"""Finite real MySQL/S3/ClamAV tests; synthetic internal preparation, never official success."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import hmac
import importlib
import json
from pathlib import Path
import re
import secrets
import uuid
from urllib.parse import parse_qs, urlsplit

import pymysql
from botocore.exceptions import ClientError
from s3 import BASE, BUCKETS, client, root_credentials
from verify_antivirus_support import scan, scan_database_fresh

shared = importlib.import_module("verify-step-flows")
connect, query, canonical, Rejected = shared.connect, shared.query, shared.canonical, shared.Rejected
ROOT = Path(__file__).resolve().parents[2]
CORE = ["trade_record_tab", "document_file_tab", "tax_case_tab", "tax_submission_tab", "tax_event_tab"]
TRADE, CASE = "SYNTHETIC-S6-TRADE", "SYNTHETIC-S6-PROOF"


def insert(cursor, table, values):
    cursor.execute("INSERT INTO `" + table + "` (" + ",".join("`" + key + "`" for key in values)
                   + ") VALUES (" + ",".join(["%s"] * len(values)) + ")", tuple(values.values()))
    return cursor.lastrowid


def case_values(number=CASE, tax_type=1, scope="pending:server-s6-preparation", **changes):
    return dict(tax_case_number=number, trade_number=TRADE, trade_revision_number=1,
                scope_reference=scope, version=1, taxpayer_party_role_code=1,
                taxpayer_participant_sequence_number=1, tax_type_code=tax_type,
                case_status=1, claimed_amount=None, currency_code="CNY", **changes)


def event_values(kind=1, payload=None, **changes):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    values = dict(event_number="S6-" + uuid.uuid4().hex, tax_case_number=CASE,
                  submission_revision_number=None, external_event_key=None, event_type_code=kind,
                  result_code=1, authority_reference_number=None, amount=None, currency_code=None,
                  occurred_at=now, received_at=now, fund_flow_number=None, evidence_reference=None,
                  event_payload_json=canonical(payload or {"schema_version": 1,
                      "operation_evidence_reference": "internal:s6:synthetic-preparation",
                      "scope_reference": "pending:server-s6-preparation",
                      "unresolved_items": ["SCOPE_RULE_UNCONFIRMED", "RESPONSIBILITY_UNCONFIRMED",
                                           "DEADLINE_RULE_UNCONFIRMED", "OFFICIAL_CHANNEL_UNAVAILABLE"]}),
                  actor_reference="synthetic-export-agent")
    values.update(changes)
    return values


class Proof:
    def __init__(self, database):
        if not re.fullmatch(r"verify_taxproof_[a-f0-9]{12}", database):
            raise ValueError("Isolated database required")
        self.database, self.secret = database, secrets.token_bytes(32)

    def intent(self, action, number, body, expected, key):
        return {"action": action, "case": number, "body": body, "expected": expected, "key": key}

    def confirmation(self, action, number, body, expected, key, subject):
        digest = self.digest(self.intent(action, number, body, expected, key))
        token = uuid.uuid4().hex
        query(self.database, "INSERT INTO middleware_confirmation VALUES(%s,%s,%s,UTC_TIMESTAMP(3)+INTERVAL 5 MINUTE,NULL)",
              (token, subject, digest))
        return token

    def digest(self, value):
        return hmac.new(self.secret, canonical(value).encode(), hashlib.sha256).hexdigest()

    def get(self, number=CASE):
        rows = query(self.database, "SELECT * FROM tax_case_tab WHERE tax_case_number=%s AND tax_type_code=1", (number,))
        if not rows:
            raise Rejected("NOT_FOUND")
        return rows[0]

    def run(self, action, body, number=CASE, expected=None, key=None, subject="synthetic-F",
            confirmation=None, fail=False):
        key = key or str(uuid.uuid4())
        allowed = {"prepare": ("synthetic-F", "synthetic-B"),
                   "review": ("synthetic-reviewer", "synthetic-F"),
                   "dispatch": ("synthetic-B",), "official": ("synthetic-reviewer",),
                   "delivery": ("synthetic-B",), "receipt": ("synthetic-A",)}
        if subject not in allowed[action]:
            raise Rejected("FORBIDDEN")
        audience = "internal" if subject == "synthetic-reviewer" else "external"
        digest = self.digest(self.intent(action, number, body, expected, key))
        confirmation = confirmation or self.confirmation(action, number, body, expected, key, subject)
        with connect(self.database) as connection, connection.cursor() as cursor:
            cursor.execute("SET TRANSACTION ISOLATION LEVEL READ COMMITTED")
            connection.begin()
            try:
                def replay():
                    cursor.execute("SELECT digest,response_json FROM middleware_receipt WHERE subject=%s AND audience=%s AND request_key=%s",
                                   (subject, audience, key))
                    prior = cursor.fetchone()
                    if prior:
                        if prior["digest"] != digest:
                            raise Rejected("IDEMPOTENCY_CONFLICT")
                        return json.loads(prior["response_json"])
                    return None
                prior = replay()
                if prior:
                    connection.rollback()
                    return prior
                cursor.execute("SELECT * FROM trade_record_tab WHERE trade_number=%s FOR UPDATE", (TRADE,))
                trade = cursor.fetchone()
                prior = replay()
                if prior:
                    connection.rollback()
                    return prior
                cursor.execute("SELECT * FROM tax_case_tab WHERE tax_case_number=%s AND tax_type_code=1 FOR UPDATE", (number,))
                case = cursor.fetchone()
                if not case:
                    raise Rejected("NOT_FOUND")
                if expected is None:
                    raise Rejected("PRECONDITION_REQUIRED")
                if expected != case["version"]:
                    raise Rejected("PRECONDITION_FAILED")
                if case["case_status"] in (9, 10, 11):
                    raise Rejected("CASE_TERMINAL")
                cursor.execute("SELECT * FROM middleware_confirmation WHERE token=%s FOR UPDATE", (confirmation,))
                confirmed = cursor.fetchone()
                cursor.execute("SELECT UTC_TIMESTAMP(3) now")
                now = cursor.fetchone()["now"]
                if not confirmed or confirmed["subject"] != subject or confirmed["digest"] != digest or confirmed["used_by"] or confirmed["expires"] <= now:
                    raise Rejected("CONFIRMATION_INVALID")
                cursor.execute("SELECT * FROM tax_submission_tab WHERE tax_case_number=%s ORDER BY submission_revision_number FOR UPDATE", (number,))
                submissions = cursor.fetchall()
                current = submissions[-1] if submissions else None
                cursor.execute("SELECT * FROM tax_event_tab WHERE tax_case_number=%s ORDER BY id FOR UPDATE", (number,))
                events = cursor.fetchall()
                revision, result_code = current["submission_revision_number"] if current else None, 1
                payload = {"schema_version": 1, "operation_evidence_reference": "internal:s6:" + key}
                if action == "prepare":
                    if set(body) - {"trade_revision_number", "files", "preparation_note", "previous_revision", "correction_event"}:
                        raise Rejected("UNKNOWN_FIELD")
                    if body.get("trade_revision_number") != trade["approved_revision_number"]:
                        raise Rejected("SOURCE_REVISION_STALE")
                    if current and current["execution_status"] in (2, 3):
                        raise Rejected("DISPATCH_UNKNOWN")
                    if current and body.get("previous_revision") != revision:
                        raise Rejected("CORRECTION_CHAIN_INVALID")
                    if not current and (body.get("previous_revision") is not None or body.get("correction_event") is not None):
                        raise Rejected("CORRECTION_CHAIN_INVALID")
                    correction = body.get("correction_event")
                    if correction and not any(e["event_number"] == correction and e["event_type_code"] == 8
                                              and e["submission_revision_number"] == revision for e in events):
                        raise Rejected("CORRECTION_CHAIN_INVALID")
                    if current and current["submission_status"] not in (2, 3, 7, 10):
                        raise Rejected("REVIEW_PENDING")
                    files = body.get("files", [])
                    if not files:
                        raise Rejected("FILE_NOT_READY")
                    for file in files:
                        if set(file) != {"logical_file_number", "revision_number", "content_digest", "document_purpose_code"}:
                            raise Rejected("UNKNOWN_FIELD")
                        cursor.execute("SELECT * FROM document_file_tab WHERE logical_file_number=%s AND revision_number=%s",
                                       (file["logical_file_number"], file["revision_number"]))
                        record = cursor.fetchone()
                        if not record or record["revision_status_code"] != 2 or record["sha256"] != file["content_digest"] or record["document_type_code"] != file["document_purpose_code"]:
                            raise Rejected("FILE_NOT_READY")
                        version_id = parse_qs(urlsplit(record["storage_path"]).query).get("versionId", [None])[0]
                        cursor.execute("SELECT * FROM middleware_file_scan WHERE file_number=%s AND version_id=%s",
                                       (file["logical_file_number"], version_id))
                        scanned = cursor.fetchone()
                        if not scanned or scanned["status"] != "clean" or scanned["sha256"] != file["content_digest"]:
                            raise Rejected("FILE_NOT_READY")
                    if current and current["submission_status"] == 3:
                        insert(cursor, "tax_event_tab", event_values(18, {"schema_version": 1,
                               "operation_evidence_reference": "internal:s6:" + key,
                               "submission_content_hash": current["package_hash"], "reason": "new material revision invalidates unexecuted approval"},
                               submission_revision_number=revision, actor_reference=subject, result_code=2))
                        cursor.execute("UPDATE tax_submission_tab SET submission_status=10,version=version+1 WHERE id=%s", (current["id"],))
                    revision = (revision or 0) + 1
                    content = {"schema_version": 1, "tax_type_code": 1,
                               "approved_snapshot_number": "SYNTHETIC-INTERNAL-APPROVED-1",
                               "scope_reference": case["scope_reference"], "rule_version": "synthetic-preparation-v1",
                               "responsibility_basis": {"status": "unconfirmed", "evidence_references": []},
                               "declaration_references": [],
                               "fields": {"preparation_note": body["preparation_note"]},
                               "check_report": {"unresolved_items": ["SCOPE_RULE_UNCONFIRMED",
                                    "RESPONSIBILITY_UNCONFIRMED", "DEADLINE_RULE_UNCONFIRMED",
                                    "OFFICIAL_CHANNEL_UNAVAILABLE"],
                                    "source_version_vector": {"trade": trade["approved_revision_number"]}}}
                    package_hash = hashlib.sha256(canonical({"content": content, "files": files}).encode()).hexdigest()
                    insert(cursor, "tax_submission_tab", dict(tax_case_number=number,
                           submission_revision_number=revision, package_hash=package_hash, submission_status=1,
                           evidence_manifest_json=canonical(files), submission_content_json=canonical(content),
                           review_snapshot_json=None, previous_submission_revision_number=body.get("previous_revision"),
                           correction_event_number=correction, execution_status=1, version=1, submitted_by=subject))
                    kind, status = 2, 2
                    payload.update(submission_content_hash=package_hash)
                elif action == "review":
                    if not current or body.get("revision") != revision:
                        raise Rejected("EXACT_SUBMISSION_REQUIRED")
                    if current["submitted_by"] == subject:
                        raise Rejected("SELF_REVIEW")
                    if current["submission_status"] != 1:
                        raise Rejected("REVIEW_NOT_PENDING")
                    if body.get("package_hash") != current["package_hash"]:
                        raise Rejected("PACKAGE_HASH_MISMATCH")
                    content = json.loads(current["submission_content_json"])
                    if content["check_report"]["source_version_vector"]["trade"] != trade["approved_revision_number"]:
                        raise Rejected("SOURCE_REVISION_STALE")
                    approved = body.get("outcome") == "approve"
                    if body.get("outcome") not in ("approve", "return") or not body.get("reason"):
                        raise Rejected("INVALID_INPUT")
                    result_code, kind, status = (2, 4, 3) if approved else (3, 3, 1)
                    payload.update(submission_content_hash=current["package_hash"],
                                   reviewer_reference=subject, reason=body["reason"])
                    snapshot = {"reviewer_reference": subject, "result_code": result_code,
                                "reviewed_at": now.isoformat(timespec="milliseconds") + "Z",
                                "content_hash": current["package_hash"], "rule_version": "synthetic-preparation-v1",
                                "evidence_references": json.loads(current["evidence_manifest_json"]),
                                "comments": body["reason"]}
                    cursor.execute("UPDATE tax_submission_tab SET submission_status=%s,review_snapshot_json=%s,version=version+1 WHERE id=%s",
                                   (3 if approved else 2, canonical(snapshot), current["id"]))
                elif action == "dispatch":
                    if not current or current["submission_status"] != 3:
                        raise Rejected("REVIEW_REQUIRED")
                    if current["execution_status"] in (2, 3):
                        raise Rejected("DISPATCH_UNKNOWN")
                    if case["scope_reference"].startswith("pending:"):
                        raise Rejected("SCOPE_RULE_UNCONFIRMED")
                    raise Rejected("RESPONSIBILITY_UNCONFIRMED")
                elif action == "official":
                    if not body.get("revision"):
                        raise Rejected("EXACT_SUBMISSION_REQUIRED")
                    raise Rejected("OFFICIAL_EVIDENCE_REQUIRED")
                elif action in ("delivery", "receipt"):
                    verified = [e for e in events if e["event_type_code"] == 10 and e["result_code"] == 2]
                    if not verified:
                        raise Rejected("CERTIFICATE_NOT_VERIFIED")
                    raise Rejected("OFFICIAL_EVIDENCE_REQUIRED")
                cursor.execute("UPDATE tax_case_tab SET case_status=%s,version=version+1 WHERE id=%s", (status, case["id"]))
                event = event_values(kind, payload, tax_case_number=number, submission_revision_number=revision,
                                     actor_reference=subject, result_code=result_code)
                insert(cursor, "tax_event_tab", event)
                response = {"tax_case_number": number, "revision": revision, "event": event["event_number"],
                            "version": expected + 1, "case_status": status}
                insert(cursor, "middleware_receipt", {"subject": subject, "audience": audience, "request_key": key,
                       "digest": digest, "response_json": canonical(response)})
                cursor.execute("UPDATE middleware_confirmation SET used_by=%s WHERE token=%s", (key, confirmation))
                if fail:
                    raise Rejected("INJECTED_BEFORE_COMMIT")
                connection.commit()
                return response
            except Exception:
                connection.rollback()
                raise


def import_schema(database, ddl):
    query(None, "CREATE DATABASE `" + database + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin")
    for table in CORE:
        match = re.search(r"CREATE TABLE `" + table + r"` \([\s\S]*?\) ENGINE=InnoDB[^;]*;", ddl)
        if not match:
            raise AssertionError("Missing core DDL " + table)
        query(database, match[0])
    compound = re.findall(r"DELIMITER \$\$\n(CREATE TRIGGER[\s\S]*?)\$\$\nDELIMITER ;", ddl)
    for statement in compound:
        if "ON `tax_submission_tab`" in statement:
            query(database, statement)
    for statement in re.findall(r"^CREATE TRIGGER[^\n]+;$", ddl, re.M):
        if "$$" not in statement and any("ON `" + table + "`" in statement for table in CORE):
            query(database, statement)
    for statement in [
        "CREATE TABLE middleware_receipt(subject VARCHAR(64),audience VARCHAR(16),request_key CHAR(36),digest CHAR(64),response_json JSON,PRIMARY KEY(subject,audience,request_key)) ENGINE=InnoDB",
        "CREATE TABLE middleware_confirmation(token CHAR(32) PRIMARY KEY,subject VARCHAR(64),digest CHAR(64),expires DATETIME(3),used_by CHAR(36) NULL) ENGINE=InnoDB",
        "CREATE TABLE middleware_file_scan(file_number VARCHAR(40),version_id VARCHAR(128),sha256 CHAR(64),status VARCHAR(16),PRIMARY KEY(file_number,version_id)) ENGINE=InnoDB"
    ]:
        query(database, statement)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    target = Path(args.output).resolve()
    target.parent.mkdir(parents=True, exist_ok=True)
    database = "verify_taxproof_" + secrets.token_hex(6)
    ddl = (ROOT / "doc/sql/domain/schema.sql").read_text()
    ddl_hash, checks, versions, error = hashlib.sha256(ddl.encode()).hexdigest(), [], [], None
    storage, admin = None, None
    prefix = "_step-six-validation/" + secrets.token_hex(16) + "/material.html"

    def check(name, run, level="application_gate", conditions="synthetic internal preparation only"):
        item = {"name": name, "level": level, "conditions": conditions,
                "expected": name}
        try:
            observed = run()
            if observed is False:
                raise AssertionError(name)
            blocked = isinstance(observed, dict) and ("rejected" in observed or "mysqlError" in observed)
            item.update(passed=True, observed=observed if isinstance(observed, dict) else "expected assertion satisfied",
                        classification="correctly_blocked" if blocked else "passed")
            return observed
        except Exception as failure:
            item.update(passed=False, observed=type(failure).__name__, classification="failed")
            raise
        finally:
            checks.append(item)

    def reject(code, run):
        try:
            run()
        except Rejected as failure:
            assert str(failure) == code, (code, str(failure))
            return {"rejected": code}
        raise AssertionError("Expected " + code)

    def db_reject(code, sql, values=()):
        try:
            query(database, sql, values)
        except pymysql.MySQLError as failure:
            assert failure.args[0] == code, (code, failure.args[0])
            return {"mysqlError": code}
        raise AssertionError("Expected MySQL error " + str(code))

    try:
        import_schema(database, ddl)
        with connect(database) as connection, connection.cursor() as cursor:
            insert(cursor, "trade_record_tab", dict(trade_number=TRADE, trade_status_code=8,
                   revision_number=1, approved_revision_number=1, transaction_goods_items_json="[]",
                   transaction_filing_document_references_json="[]", transaction_filing_source_and_version_json="{}",
                   transaction_filing_missing_information_json="[]", creation_payload_hmac="0" * 64,
                   creation_payload_hmac_key_version="synthetic-s6-memory-only"))
            insert(cursor, "tax_case_tab", case_values())
            insert(cursor, "tax_event_tab", event_values())
            insert(cursor, "tax_case_tab", case_values(number="SYNTHETIC-S6-REFUND", tax_type=2))
        proof = Proof(database)
        check("Proof amount is SQL NULL, not invented zero", lambda: proof.get()["claimed_amount"] is None, "database_projection")
        check("Proof and refund coexist with same trade/scope but remain type-isolated", lambda: reject("NOT_FOUND", lambda: proof.get("SYNTHETIC-S6-REFUND")))
        check("Same trade/type/scope unique prevents duplicate proof case",
              lambda: db_reject(1062, "INSERT INTO tax_case_tab(tax_case_number,trade_number,trade_revision_number,scope_reference,version,taxpayer_party_role_code,taxpayer_participant_sequence_number,tax_type_code,case_status,currency_code) SELECT 'S6-DUPLICATE',trade_number,trade_revision_number,scope_reference,version,taxpayer_party_role_code,taxpayer_participant_sequence_number,tax_type_code,case_status,currency_code FROM tax_case_tab WHERE tax_case_number=%s", (CASE,)), "database_hard_constraint")
        check("Proof amount zero is rejected by actual CHECK", lambda: db_reject(3819, "UPDATE tax_case_tab SET claimed_amount=0 WHERE tax_case_number=%s", (CASE,)), "database_hard_constraint")
        check("Non-CNY currency is rejected", lambda: db_reject(3819, "UPDATE tax_case_tab SET currency_code='USD' WHERE tax_case_number=%s", (CASE,)), "database_hard_constraint")
        check("Invalid shared case status is rejected", lambda: db_reject(3819, "UPDATE tax_case_tab SET case_status=99 WHERE tax_case_number=%s", (CASE,)), "database_hard_constraint")
        check("Authoritative tax submission freeze trigger imported intact", lambda: len(query(database, "SHOW TRIGGERS WHERE `Table`='tax_submission_tab'")) == 2, "database_trigger")
        credentials = json.loads((BASE / "s3-client.json").read_text())
        storage, admin = client(credentials["access_key"], credentials["secret_key"]), client(*root_credentials())
        material = (ROOT / "doc/examples/step6/material.html").read_bytes()
        digest = hashlib.sha256(material).hexdigest()
        check("Real ClamAV fresh signatures and original non-official material scan", lambda: scan_database_fresh() and scan(material).endswith(": OK"), "real_clamav")
        check("Real ClamAV rejects standard antivirus test bytes",
              lambda: "FOUND" in scan(b"X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"), "real_clamav")
        for bucket in BUCKETS[:2]:
            version = storage.put_object(Bucket=bucket, Key=prefix, Body=material, IfNoneMatch="*")["VersionId"]
            versions.append((bucket, prefix, version))
            check("Exact S3 version SHA256 verified in " + bucket,
                  lambda b=bucket, v=version: hashlib.sha256(storage.get_object(Bucket=b, Key=prefix, VersionId=v)["Body"].read()).hexdigest() == digest, "real_s3")
        final_version = versions[-1][2]
        def collision():
            try:
                storage.put_object(Bucket=BUCKETS[1], Key=prefix, Body=b"different", IfNoneMatch="*")
            except ClientError as failure:
                return failure.response["Error"]["Code"] in ("PreconditionFailed", "ConditionalRequestConflict")
            return False
        check("S3 immutable conditional write collision rejected", collision, "real_s3")
        with connect(database) as connection, connection.cursor() as cursor:
            insert(cursor, "document_file_tab", dict(logical_file_number="S6-MATERIAL", revision_number=1,
                   revision_status_code=2, display_name="原创合成准备材料—非正式证明", document_type_code=22,
                   storage_path="s3://" + BUCKETS[1] + "/" + prefix + "?versionId=" + final_version,
                   sha256=digest, size_bytes=len(material), media_type="text/html", access_scope_json=canonical({"trade": TRADE, "synthetic": True})))
            insert(cursor, "middleware_file_scan", dict(file_number="S6-MATERIAL", version_id=final_version, sha256=digest, status="clean"))
        files = [{"logical_file_number": "S6-MATERIAL", "revision_number": 1,
                  "content_digest": digest, "document_purpose_code": 22}]
        content = {"trade_revision_number": 1, "files": files, "preparation_note": "合成内部备料，职责范围仍未确认"}
        command = lambda action, body, **kw: proof.run(action, body, expected=proof.get()["version"], **kw)
        check("Missing ETag blocked before domain write", lambda: reject("PRECONDITION_REQUIRED", lambda: proof.run("prepare", content)))
        check("Unknown preparation field rejected instead of silently hidden in JSON",
              lambda: reject("UNKNOWN_FIELD", lambda: command("prepare", {**content, "claimed_amount": "0.00"})))
        check("Missing material list blocked", lambda: reject("FILE_NOT_READY", lambda: command("prepare", {**content, "files": []})))
        check("Wrong file version is not citeable", lambda: reject("FILE_NOT_READY", lambda: command("prepare", {**content, "files": [{**files[0], "revision_number": 99}]})))
        check("Stale approved source revision rejected", lambda: reject("SOURCE_REVISION_STALE", lambda: command("prepare", {**content, "trade_revision_number": 99})))
        check("Foreign subject cannot prepare materials", lambda: reject("FORBIDDEN", lambda: command("prepare", content, subject="synthetic-other-trade")))
        token_key, token_expected = str(uuid.uuid4()), proof.get()["version"]
        token = proof.confirmation("prepare", CASE, {**content, "preparation_note": "other intent"}, token_expected, token_key, "synthetic-F")
        check("Confirmation cannot be transplanted across changed business content",
              lambda: reject("CONFIRMATION_INVALID", lambda: proof.run("prepare", content, expected=token_expected, key=token_key, confirmation=token)))
        expired_key = str(uuid.uuid4())
        expired = proof.confirmation("prepare", CASE, content, token_expected, expired_key, "synthetic-F")
        query(database, "UPDATE middleware_confirmation SET expires=UTC_TIMESTAMP(3)-INTERVAL 1 SECOND WHERE token=%s", (expired,))
        check("Expired original intent confirmation rejected",
              lambda: reject("CONFIRMATION_INVALID", lambda: proof.run("prepare", content, expected=token_expected, key=expired_key, confirmation=expired)))
        key, expected = str(uuid.uuid4()), proof.get()["version"]
        prepared = check("Prepare immutable full content and file manifest with NULL pre-review snapshot",
                         lambda: proof.run("prepare", content, expected=expected, key=key))
        row = query(database, "SELECT * FROM tax_submission_tab WHERE tax_case_number=%s AND submission_revision_number=1", (CASE,))[0]
        check("Full content/source vector/preparer and NULL review are persisted",
              lambda: row["review_snapshot_json"] is None and json.loads(row["submission_content_json"])["fields"]["preparation_note"] == content["preparation_note"] and json.loads(row["evidence_manifest_json"]) == files, "database_projection")
        check("Original accepted request replays even after version advancement",
              lambda: proof.run("prepare", content, expected=expected, key=key) == prepared)
        check("Same key with changed content rejected", lambda: reject("IDEMPOTENCY_CONFLICT", lambda: proof.run("prepare", {**content, "preparation_note": "changed"}, expected=expected, key=key)))
        check("Replaying original request does not bypass current subject authorization",
              lambda: reject("FORBIDDEN", lambda: proof.run("prepare", content, expected=expected, key=key, subject="revoked")))
        review = {"revision": 1, "package_hash": row["package_hash"], "outcome": "return", "reason": "缺主管职责范围证据"}
        check("Self-review rejected", lambda: reject("SELF_REVIEW", lambda: command("review", review, subject="synthetic-F")))
        check("Wrong package approval hash rejected", lambda: reject("PACKAGE_HASH_MISMATCH", lambda: command("review", {**review, "package_hash": "0" * 64}, subject="synthetic-reviewer")))
        check("Independent return persists domain event, not official rejection",
              lambda: command("review", review, subject="synthetic-reviewer"))
        check("Frozen content cannot be updated", lambda: db_reject(1644, "UPDATE tax_submission_tab SET submission_content_json=JSON_OBJECT('changed',true) WHERE tax_case_number=%s", (CASE,)), "database_trigger")
        check("Frozen manifest cannot be updated", lambda: db_reject(1644, "UPDATE tax_submission_tab SET evidence_manifest_json=JSON_ARRAY() WHERE tax_case_number=%s", (CASE,)), "database_trigger")
        check("Frozen package hash cannot be updated", lambda: db_reject(1644, "UPDATE tax_submission_tab SET package_hash=%s WHERE tax_case_number=%s", ("0" * 64, CASE)), "database_trigger")
        check("Frozen predecessor cannot be changed", lambda: db_reject(1644, "UPDATE tax_submission_tab SET previous_submission_revision_number=99 WHERE tax_case_number=%s", (CASE,)), "database_trigger")
        check("Submission history cannot be deleted", lambda: db_reject(1644, "DELETE FROM tax_submission_tab WHERE tax_case_number=%s", (CASE,)), "database_trigger")
        check("Wrong correction predecessor rejected", lambda: reject("CORRECTION_CHAIN_INVALID", lambda: command("prepare", {**content, "previous_revision": 99})))
        check("Internal return cannot invent official correction event", lambda: reject("CORRECTION_CHAIN_INVALID", lambda: command("prepare", {**content, "previous_revision": 1, "correction_event": "FAKE-OFFICIAL"})))
        second = check("Returned content revised by new immutable submission only",
                       lambda: command("prepare", {**content, "previous_revision": 1, "preparation_note": "内部补料v2"}))
        check("Prior content/package retained after new version", lambda: query(database, "SELECT package_hash FROM tax_submission_tab WHERE tax_case_number=%s AND submission_revision_number=1", (CASE,))[0]["package_hash"] == row["package_hash"], "database_projection")
        row2 = query(database, "SELECT * FROM tax_submission_tab WHERE tax_case_number=%s AND submission_revision_number=2", (CASE,))[0]
        review2 = {"revision": 2, "package_hash": row2["package_hash"], "outcome": "approve", "reason": "仅合成内部资料质量检查；不确认任何官方职责范围"}
        check("Independent internal approval is not formal acceptance",
              lambda: command("review", review2, subject="synthetic-reviewer")["case_status"] == 3)
        check("Unconfirmed scope blocks formal application after internal approval",
              lambda: reject("SCOPE_RULE_UNCONFIRMED", lambda: command("dispatch", {"revision": 2}, subject="synthetic-B")))
        check("No exact submission on official evidence is rejected",
              lambda: reject("EXACT_SUBMISSION_REQUIRED", lambda: command("official", {}, subject="synthetic-reviewer")))
        check("Synthetic source cannot establish official submission/issuance",
              lambda: reject("OFFICIAL_EVIDENCE_REQUIRED", lambda: command("official", {"revision": 2, "source": "SYNTHETIC"}, subject="synthetic-reviewer")))
        check("No verified issued proof means B cannot deliver",
              lambda: reject("CERTIFICATE_NOT_VERIFIED", lambda: command("delivery", {}, subject="synthetic-B")))
        check("No verified proof means A cannot confirm receipt/check",
              lambda: reject("CERTIFICATE_NOT_VERIFIED", lambda: command("receipt", {}, subject="synthetic-A")))
        check("B cannot submit A receipt even on same trade",
              lambda: reject("FORBIDDEN", lambda: command("receipt", {}, subject="synthetic-B")))
        for missing in ("submission_revision_number", "external_event_key", "authority_reference_number"):
            values = event_values(10, {"schema_version": 1, "operation_evidence_reference": "INVALID-MISSING-FIELD-NEGATIVE"},
                                  submission_revision_number=2, external_event_key="INVALID-MISSING-FIELD-TEST",
                                  authority_reference_number="INVALID-NOT-AUTHORITY")
            values[missing] = None
            def missing_field(v=values):
                try:
                    with connect(database) as connection, connection.cursor() as cursor:
                        insert(cursor, "tax_event_tab", v)
                except pymysql.MySQLError as failure:
                    assert failure.args[0] == 3819
                    return True
                return False
            check("Official event CHECK requires " + missing, missing_field, "database_hard_constraint", "invalid attempted event only; no official event stored")
        before = query(database, "SELECT COUNT(*) n FROM tax_event_tab")[0]["n"]
        new_content = {**content, "previous_revision": 2, "preparation_note": "v3"}
        check("Injected failure rolls back new submission, approval invalidation, event and receipt",
              lambda: reject("INJECTED_BEFORE_COMMIT", lambda: command("prepare", new_content, fail=True)))
        check("Failed transaction retained approved v2 and no third material version",
              lambda: query(database, "SELECT COUNT(*) n FROM tax_submission_tab WHERE tax_case_number=%s", (CASE,))[0]["n"] == 2 and query(database, "SELECT COUNT(*) n FROM tax_event_tab")[0]["n"] == before and query(database, "SELECT submission_status FROM tax_submission_tab WHERE id=%s", (row2["id"],))[0]["submission_status"] == 3, "database_projection")
        original_version = proof.get()["version"]
        def competing(index):
            try:
                return proof.run("prepare", {**new_content, "preparation_note": "competing-" + str(index)}, expected=original_version)
            except Rejected as failure:
                return str(failure)
        with ThreadPoolExecutor(max_workers=2) as pool:
            raced = list(pool.map(competing, range(2)))
        check("Concurrent revisions serialize at trade/case roots; stale contender rejected",
              lambda: sum(isinstance(x, dict) for x in raced) == 1 and raced.count("PRECONDITION_FAILED") == 1)
        check("Replacing approved unexecuted v2 appends approval-invalidated domain event",
              lambda: query(database, "SELECT COUNT(*) n FROM tax_event_tab WHERE event_type_code=18")[0]["n"] == 1 and query(database, "SELECT submission_status FROM tax_submission_tab WHERE id=%s", (row2["id"],))[0]["submission_status"] == 10, "database_projection")
        check("No official success or fake B delivery/A receipt persisted",
              lambda: query(database, "SELECT COUNT(*) n FROM tax_event_tab WHERE event_type_code BETWEEN 6 AND 14")[0]["n"] == 0, "database_projection")
        check("Internal event stable external keys remain NULL",
              lambda: query(database, "SELECT COUNT(*) n FROM tax_event_tab WHERE external_event_key IS NOT NULL")[0]["n"] == 0, "database_projection")
        event = query(database, "SELECT event_number FROM tax_event_tab ORDER BY id LIMIT 1")[0]["event_number"]
        check("Tax event update rejected by append-only trigger", lambda: db_reject(1644, "UPDATE tax_event_tab SET result_code=3 WHERE event_number=%s", (event,)), "database_trigger")
        check("Tax event deletion rejected by append-only trigger", lambda: db_reject(1644, "DELETE FROM tax_event_tab WHERE event_number=%s", (event,)), "database_trigger")
        check("DDL source unchanged throughout this run", lambda: hashlib.sha256((ROOT / "doc/sql/domain/schema.sql").read_bytes()).hexdigest() == ddl_hash, "provenance")
    except Exception as failure:
        error = type(failure).__name__
        if not checks or checks[-1].get("passed"):
            checks.append({"name": "Validation setup/runtime", "level": "harness",
                           "conditions": "current generated DDL and local middleware",
                           "expected": "run completes", "observed": error, "passed": False,
                           "classification": "failed"})
    finally:
        cleanup = []
        if admin:
            for bucket, key, version in versions:
                try:
                    admin.delete_object(Bucket=bucket, Key=key, VersionId=version)
                    try:
                        admin.get_object(Bucket=bucket, Key=key, VersionId=version)
                    except ClientError as failure:
                        assert failure.response["Error"]["Code"] in ("NoSuchKey", "NoSuchVersion", "404")
                        cleanup.append(True)
                    else:
                        cleanup.append(False)
                except Exception:
                    cleanup.append(False)
        if versions:
            checks.append({"name": "Only run-tracked exact S3 versions cleaned; no prefix deletion",
                           "level": "real_s3_cleanup", "conditions": "tracked VersionIds only",
                           "expected": "each exact version unavailable", "observed": cleanup,
                           "passed": len(cleanup) == len(versions) and all(cleanup),
                           "classification": "passed" if len(cleanup) == len(versions) and all(cleanup) else "failed"})
        result = {"validationOnly": True, "database": database, "databaseRetained": True,
                  "finishedAt": datetime.now(timezone.utc).isoformat(), "sourceDdlSha256": ddl_hash,
                  "coreTables": CORE, "passed": sum(c["passed"] for c in checks),
                  "failed": sum(not c["passed"] for c in checks), "checks": checks, "errorType": error,
                  "originalBusinessDatabaseAccessed": False, "testObjectVersionsCleaned": bool(versions) and all(cleanup),
                  "unverified": [{"name": name, "classification": "not_verified"} for name in
                                 ["Real official filing/acceptance/issuance/correction/revocation",
                                  "Positive proof handover and supplier reconciliation",
                                  "Production handlers, IAM, scheduling and legal authority"]],
                  "notProven": ["Production REST/RPC handlers, IAM and request confirmation security",
                                "Confirmed official responsibility/scope/deadline rules or real channel",
                                "Official submission, acceptance, correction, issuance, revocation or final rejection success",
                                "Positive B delivery/A receipt/check/objection closure on a real issued proof",
                                "Production scheduling, unknown external execution recovery or legal authenticity"]}
        target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
        print(json.dumps({"database": database, "passed": result["passed"], "failed": result["failed"],
                          "errorType": error, "output": str(target)}, ensure_ascii=False))
    if error or result["failed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
