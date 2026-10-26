"""Simple isolated tax-refund entity checks; never calls or fakes tax/bank success."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from decimal import Decimal
import hashlib
import hmac
import importlib
import json
import os
from pathlib import Path
import re
import secrets
import uuid

import pymysql
from s3 import BASE, BUCKETS, client, root_credentials
from verify_antivirus_support import scan, scan_database_fresh

shared = importlib.import_module("verify-step-flows")
connect, query, canonical, Rejected = shared.connect, shared.query, shared.canonical, shared.Rejected
ROOT = Path(__file__).resolve().parents[2]
CORE = ["trade_record_tab", "tax_case_tab", "tax_submission_tab", "tax_event_tab", "document_file_tab",
        "payment_fund_flow_tab", "payment_fund_allocation_tab"]
TRADE = "SYNTHETIC-S7-TRADE"


def insert(cursor, table, values):
    cursor.execute("INSERT INTO `" + table + "` (" + ",".join("`" + key + "`" for key in values) +
                   ") VALUES (" + ",".join(["%s"] * len(values)) + ")", tuple(values.values()))
    return cursor.lastrowid


def package_projection(body):
    synthetic_rule = body.get("synthetic_internal_rule")
    manifest = [{"logical_file_number": file["file_number"], "revision_number": 1,
                 "content_digest": file["hash"], "document_purpose_code": 24} for file in body["files"]]
    content = {"schema_version": 1, "tax_type_code": 2, "approved_snapshot_number": "SYNTHETIC-INTERNAL-SNAPSHOT",
               "scope_reference": body["scope_reference"], "rule_version": synthetic_rule or "UNCONFIRMED",
               "responsibility_basis": {"unresolved_items": [] if synthetic_rule else ["主管机关责任/范围规则待确认"],
                                        **({"synthetic_internal_rule_reference": synthetic_rule} if synthetic_rule else {})},
               "declaration_references": [],
               "fields": {"currency_code": body["currency"], **(
                   {"claimed_amount": body["claimed_amount"]} if body.get("claimed_amount") is not None else {})},
               "check_report": {"missing_gates": [] if synthetic_rule else ["SCOPE_RULE_UNCONFIRMED", "TAX_AUTHORITY_UNCONFIRMED"],
                                "checked_rule_references": []}}
    digest = hashlib.sha256(canonical({"content": content, "manifest": manifest}).encode()).hexdigest()
    return content, manifest, digest


class Refund:
    """Validation driver, not a deployed HTTP/RPC service or an IAM implementation."""
    def __init__(self, database, key):
        if not re.fullmatch(r"verify_taxrefund_[a-f0-9]{12}", database):
            raise ValueError("Random isolated database required")
        self.database, self.key = database, key

    def confirm(self, subject, audience, digest):
        number = uuid.uuid4().hex
        query(self.database, "INSERT INTO s7_confirmation VALUES(%s,%s,%s,%s,UTC_TIMESTAMP(3)+INTERVAL 5 MINUTE,NULL)",
              (number, subject, audience, digest))
        return number

    def command(self, action, body, expected, key=None, subject="supplier", audience="external", confirmation=None, fail=False):
        allowed = {"package": ("supplier", "external"), "review": ("reviewer", "internal"),
                   "dispatch": ("supplier", "external"), "notice": ("reviewer", "internal"),
                   "correction": ("supplier", "external"), "credit": ("reviewer", "internal"),
                   "invalidate": ("reviewer", "internal")}
        if allowed[action] != (subject, audience):
            raise Rejected("FORBIDDEN")
        key = key or uuid.uuid4().hex
        intent = canonical({"action": action, "body": body, "expected": expected, "key": key})
        digest = hmac.new(self.key, intent.encode(), hashlib.sha256).hexdigest()
        confirmation = confirmation or self.confirm(subject, audience, digest)
        with connect(self.database) as connection, connection.cursor() as cursor:
            cursor.execute("SET TRANSACTION ISOLATION LEVEL READ COMMITTED")
            connection.begin()
            try:
                for phase in range(2):
                    cursor.execute("SELECT * FROM s7_receipt WHERE subject=%s AND audience=%s AND request_key=%s",
                                   (subject, audience, key))
                    prior = cursor.fetchone()
                    if prior:
                        if not hmac.compare_digest(prior["digest"], digest):
                            raise Rejected("IDEMPOTENCY_CONFLICT")
                        connection.rollback()
                        return json.loads(prior["projection"])
                    if phase == 0:
                        cursor.execute("SELECT * FROM trade_record_tab WHERE trade_number=%s FOR UPDATE", (TRADE,))
                        if not cursor.fetchone():
                            raise Rejected("TRADE_NOT_FOUND")
                cursor.execute("SELECT * FROM tax_case_tab WHERE tax_case_number='S7-CASE' FOR UPDATE")
                case = cursor.fetchone()
                cursor.execute("SELECT * FROM tax_submission_tab WHERE tax_case_number='S7-CASE' ORDER BY submission_revision_number FOR UPDATE")
                submissions = cursor.fetchall()
                if expected is None:
                    raise Rejected("PRECONDITION_REQUIRED")
                if case["version"] != expected:
                    raise Rejected("VERSION_CONFLICT")
                cursor.execute("SELECT *,UTC_TIMESTAMP(3) now FROM s7_confirmation WHERE number=%s FOR UPDATE", (confirmation,))
                confirmed = cursor.fetchone()
                if not confirmed or confirmed["subject"] != subject or confirmed["audience"] != audience or confirmed["digest"] != digest or confirmed["consumed_by"] or confirmed["expires"] <= confirmed["now"]:
                    raise Rejected("CONFIRMATION_INVALID")
                if case["case_status"] in (9, 10, 11):
                    raise Rejected("TAX_TERMINAL")
                latest = submissions[-1] if submissions else None
                event, result, revision, payload = None, 1, None, body
                if action in ("package", "correction"):
                    if action == "correction":
                        cursor.execute("SELECT * FROM tax_event_tab WHERE event_number=%s", (body.get("correction_event"),))
                        correction = cursor.fetchone()
                        if not correction or correction["tax_case_number"] != "S7-CASE" or correction["event_type_code"] != 8 or correction["submission_revision_number"] != body.get("previous"):
                            raise Rejected("OFFICIAL_EVIDENCE_REQUIRED")
                    elif case["case_status"] not in (1, 2):
                        raise Rejected("PACKAGE_FROZEN")
                    amount = body.get("claimed_amount")
                    if amount is not None and (not re.fullmatch(r"\d{1,18}(\.\d{1,2})?", amount) or Decimal(amount) < 0):
                        raise Rejected("AMOUNT_INVALID")
                    if body.get("currency") != "CNY":
                        raise Rejected("CURRENCY_INVALID")
                    files = body.get("files", [])
                    if not files:
                        raise Rejected("FILE_NOT_READY")
                    for file in files:
                        cursor.execute("SELECT * FROM document_file_tab WHERE logical_file_number=%s AND revision_number=1", (file["file_number"],))
                        document = cursor.fetchone()
                        if not document or document["revision_status_code"] != 2 or not document["storage_path"].endswith("?versionId=" + file["version_id"]) or document["sha256"] != file["hash"] or document["document_type_code"] != 24:
                            raise Rejected("FILE_NOT_READY")
                    revision = (latest["submission_revision_number"] if latest else 0) + 1
                    content, manifest, content_hash = package_projection(body)
                    insert(cursor, "tax_submission_tab", {
                        "tax_case_number": "S7-CASE", "submission_revision_number": revision,
                        "package_hash": content_hash, "submission_status": 1, "submitted_by": subject,
                        "evidence_manifest_json": canonical(manifest), "submission_content_json": canonical(content),
                        "review_snapshot_json": None, "previous_submission_revision_number": body.get("previous"),
                        "correction_event_number": body.get("correction_event"), "execution_status": 1, "version": 1})
                    cursor.execute("UPDATE tax_case_tab SET case_status=2,claimed_amount=%s WHERE tax_case_number='S7-CASE'", (amount,))
                    event = 2
                elif action in ("review", "invalidate", "dispatch"):
                    if not latest or body.get("revision") != latest["submission_revision_number"] or body.get("hash") != latest["package_hash"]:
                        raise Rejected("APPROVAL_STALE")
                    revision = latest["submission_revision_number"]
                    if action == "review":
                        if latest["submitted_by"] == subject:
                            raise Rejected("SELF_REVIEW")
                        if latest["submission_status"] != 1:
                            raise Rejected("REVIEW_NOT_PENDING")
                        source_content = json.loads(latest["submission_content_json"])
                        if body.get("approve") and (not body.get("confirmed_rule") or source_content["rule_version"] != body["confirmed_rule"]):
                            raise Rejected("SCOPE_RULE_UNCONFIRMED")
                        # confirmed_rule denotes explicitly synthetic internal policy input, not official authority.
                        status, case_status, event, result = (3, 3, 4, 2) if body.get("approve") else (2, 1, 3, 3)
                        review = {"reviewer_reference": subject, "content_hash": latest["package_hash"], "result_code": result,
                                  "reviewed_at": datetime.now(timezone.utc).isoformat(),
                                  "rule_version": body.get("confirmed_rule") or "UNCONFIRMED", "evidence_references": [],
                                  "comments": "仅内部合成核查，不代表法定权威"}
                        cursor.execute("UPDATE tax_submission_tab SET submission_status=%s,review_snapshot_json=%s,version=version+1 WHERE id=%s",
                                       (status, canonical(review), latest["id"]))
                        cursor.execute("UPDATE tax_case_tab SET case_status=%s WHERE tax_case_number='S7-CASE'", (case_status,))
                    elif action == "invalidate":
                        if latest["submission_status"] != 3:
                            raise Rejected("APPROVAL_STALE")
                        event, result = 18, 1
                        cursor.execute("UPDATE tax_submission_tab SET submission_status=10,version=version+1 WHERE id=%s", (latest["id"],))
                        cursor.execute("UPDATE tax_case_tab SET case_status=1 WHERE tax_case_number='S7-CASE'")
                    else:
                        if latest["execution_status"] == 3:
                            raise Rejected("DISPATCH_UNKNOWN")
                        if latest["submission_status"] != 3:
                            raise Rejected("APPROVAL_STALE")
                        if not body.get("official_authorization"):
                            raise Rejected("TAX_AUTHORITY_UNCONFIRMED")
                        raise Rejected("TAX_CHANNEL_UNAVAILABLE")
                elif action == "notice":
                    if not body.get("revision"):
                        raise Rejected("OFFICIAL_EXACT_REVISION_REQUIRED")
                    if not body.get("source_key"):
                        raise Rejected("OFFICIAL_SOURCE_KEY_REQUIRED")
                    raise Rejected("OFFICIAL_EVIDENCE_REQUIRED")
                elif action == "credit":
                    raise Rejected("REFUND_OBSERVATION_UNAVAILABLE")
                if event:
                    payload = {"schema_version": 1, "operation_evidence_reference": "validation-operation:" + key,
                               "submission_content_hash": content_hash if event == 2 else latest["package_hash"]}
                    if event in (3, 4, 18):
                        payload.update({"reviewer_reference": subject, "reason": "内部合成审核/失效决定"})
                    insert(cursor, "tax_event_tab", {
                        "event_number": "S7-" + uuid.uuid4().hex, "tax_case_number": "S7-CASE",
                        "submission_revision_number": revision, "external_event_key": None,
                        "event_type_code": event, "result_code": result, "event_payload_json": canonical(payload),
                        "actor_reference": subject, "occurred_at": datetime.now(timezone.utc).replace(tzinfo=None),
                        "received_at": datetime.now(timezone.utc).replace(tzinfo=None)})
                cursor.execute("UPDATE tax_case_tab SET version=version+1 WHERE tax_case_number='S7-CASE'")
                projection = {"case": "S7-CASE", "revision": revision, "version": expected + 1, "event": event}
                cursor.execute("UPDATE s7_confirmation SET consumed_by=%s WHERE number=%s", (key, confirmation))
                cursor.execute("INSERT INTO s7_receipt VALUES(%s,%s,%s,%s,%s)", (subject, audience, key, digest, canonical(projection)))
                if fail:
                    raise Rejected("INJECTED_ROLLBACK")
                connection.commit()
                return projection
            except Exception:
                connection.rollback()
                raise


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--ddl-sha256", required=True)
    parser.add_argument("--output", required=True, help="Explicit JSON result path")
    args = parser.parse_args()
    target = Path(args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    ddl_path = ROOT / "doc/sql/domain/schema.sql"
    ddl = ddl_path.read_text()
    fingerprint = hashlib.sha256(ddl.encode()).hexdigest()
    if fingerprint != args.ddl_sha256:
        raise RuntimeError("DDL fingerprint changed; obtain stable final DDL before verification")
    if "trg_tax_submission_freeze_content" not in ddl:
        raise RuntimeError("Waiting for authoritative immutable tax submission triggers")
    database = "verify_taxrefund_" + secrets.token_hex(6)
    artifacts = ROOT / "doc/examples/step7"
    private = ROOT / "infra/local/.step-seven-private"
    private.mkdir(mode=0o700, exist_ok=True)
    (private / ".gitignore").write_text("*\n")
    key_path = private / (database + ".key")
    with os.fdopen(os.open(key_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600), "wb") as file:
        secret = secrets.token_bytes(32)
        file.write(secret)
    before, checks, versions = shared.application_baseline(), [], []
    credentials = json.loads((BASE / "s3-client.json").read_text())
    storage = client(credentials["access_key"], credentials["secret_key"])
    admin = client(*root_credentials())
    prefix = "_step-seven-validation/" + secrets.token_hex(16)
    failure = None

    def check(name, run, classification="内部合成实体"):
        try:
            result = run()
            if result is False:
                raise AssertionError(name)
            checks.append({"name": name, "passed": True, "classification": classification,
                           "conditions": "仅本随机库中的命名实体场景；前置均为明确合成测试材料",
                           "expected": "命名断言成立；拒绝场景必须返回指定业务码或数据库错误",
                           "observed": result if isinstance(result, (dict, bool)) else "断言成立"})
            return result
        except Exception as error:
            checks.append({"name": name, "passed": False, "classification": classification,
                           "observed": type(error).__name__})
            raise

    def rejected(code, run):
        try:
            run()
        except Rejected as error:
            assert str(error) == code, (code, str(error))
            return {"expectedReason": code, "observedReason": str(error), "outcome": "correctly_blocked"}
        raise AssertionError("Expected " + code)

    def sql_rejected(sql, args=()):
        try:
            query(database, sql, args)
        except pymysql.MySQLError as error:
            return {"observedDatabaseErrorCode": error.args[0], "outcome": "constraint_rejected"}
        raise AssertionError("Expected SQL rejection")

    def snapshot():
        return {table: query(database, "SELECT COUNT(*) n FROM `" + table + "`")[0]["n"]
                for table in ("tax_submission_tab", "tax_event_tab", "payment_fund_flow_tab", "payment_fund_allocation_tab", "s7_receipt")}

    try:
        query(None, "CREATE DATABASE `" + database + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin")
        for table in CORE:
            statement = re.search(r"CREATE TABLE `" + table + r"` \([\s\S]*?\) ENGINE=InnoDB[^;]*;", ddl).group()
            query(database, statement)
        # DELIMITER is a CLI directive, not server SQL. Send complete trigger statements.
        triggers = re.findall(r"CREATE TRIGGER `[^`]+` BEFORE (?:UPDATE|DELETE) ON `(?:tax_submission_tab|tax_event_tab)`[\s\S]*?(?:END\$\$|;)", ddl)
        for statement in triggers:
            if "BEGIN" in statement and not statement.endswith("END$$"):
                # Compound triggers include semicolons; take through END using their original offset.
                start = ddl.index(statement)
                end = ddl.index("END$$", start) + 5
                statement = ddl[start:end]
            query(database, statement.removesuffix("$$").rstrip(";"))
        check("Copied seven authoritative entity tables", lambda: len(query(database, "SHOW TABLES")) == len(CORE), "真实MySQL")
        query(database, "CREATE TABLE s7_confirmation(number CHAR(32) PRIMARY KEY,subject VARCHAR(32),audience VARCHAR(16),digest CHAR(64),expires DATETIME(3),consumed_by VARCHAR(64) NULL) ENGINE=InnoDB")
        query(database, "CREATE TABLE s7_receipt(subject VARCHAR(32),audience VARCHAR(16),request_key VARCHAR(64),digest CHAR(64),projection JSON,PRIMARY KEY(subject,audience,request_key)) ENGINE=InnoDB")
        query(database, "CREATE TABLE s7_file_task(number CHAR(32) PRIMARY KEY,object_key VARCHAR(256),version_id VARCHAR(128),hash CHAR(64),status VARCHAR(24)) ENGINE=InnoDB")
        with connect(database) as connection, connection.cursor() as cursor:
            insert(cursor, "trade_record_tab", {"trade_number": TRADE, "trade_status_code": 8, "revision_number": 1,
                "approved_revision_number": 1, "transaction_goods_items_json": "[]",
                "transaction_filing_document_references_json": "[]", "transaction_filing_source_and_version_json": "{}",
                "transaction_filing_missing_information_json": "[]", "creation_payload_hmac": "0" * 64,
                "creation_payload_hmac_key_version": "SYNTHETIC-INTERNAL-ONLY"})
            case_values = {"tax_case_number": "S7-CASE", "trade_number": TRADE, "trade_revision_number": 1,
                "scope_reference": "SYNTHETIC-PREPARATION-SCOPE", "version": 1, "taxpayer_party_role_code": 1,
                "taxpayer_participant_sequence_number": 1, "tax_type_code": 2, "case_status": 1,
                "claimed_amount": None, "currency_code": "CNY"}
            insert(cursor, "tax_case_tab", case_values)
        check("Preparation preserves NULL application amount and CNY", lambda: query(database, "SELECT claimed_amount,currency_code FROM tax_case_tab")[0] == {"claimed_amount": None, "currency_code": "CNY"})
        check("Same type same normalized scope duplicate blocked", lambda: sql_rejected("INSERT INTO tax_case_tab(tax_case_number,trade_number,trade_revision_number,scope_reference,version,taxpayer_party_role_code,taxpayer_participant_sequence_number,tax_type_code,case_status,currency_code) SELECT 'DUP',trade_number,trade_revision_number,scope_reference,version,taxpayer_party_role_code,taxpayer_participant_sequence_number,tax_type_code,case_status,currency_code FROM tax_case_tab LIMIT 1"), "DB硬约束")
        with connect(database) as connection, connection.cursor() as cursor:
            insert(cursor, "tax_case_tab", {**case_values, "tax_case_number": "S7-PROOF", "tax_type_code": 1})
            insert(cursor, "tax_case_tab", {**case_values, "tax_case_number": "S7-OTHER-SCOPE", "scope_reference": "SYNTHETIC-SECOND-PREPARATION"})
        check("Type1 proof and multiple preparation scopes remain independent", lambda: len(query(database, "SELECT * FROM tax_case_tab")) == 3)
        check("Proof application amount cannot be fabricated", lambda: sql_rejected("UPDATE tax_case_tab SET claimed_amount=0 WHERE tax_case_number='S7-PROOF'"), "DB硬约束")
        check("Negative application amount blocked", lambda: sql_rejected("UPDATE tax_case_tab SET claimed_amount=-1 WHERE tax_case_number='S7-CASE'"), "DB硬约束")
        check("Invalid tax status and non-CNY blocked", lambda: sql_rejected("UPDATE tax_case_tab SET case_status=12 WHERE tax_case_number='S7-CASE'") and sql_rejected("UPDATE tax_case_tab SET currency_code='USD' WHERE tax_case_number='S7-CASE'"), "DB硬约束")
        material = (artifacts / "material.html").read_bytes()
        check("Actual ClamAV fresh database scans original preparation material", lambda: scan_database_fresh() and scan(material).endswith(": OK"), "真实ClamAV")
        object_key = prefix + "/preparation.html"
        upload = storage.put_object(Bucket=BUCKETS[1], Key=object_key, Body=material, ContentType="text/html")
        version = upload["VersionId"]
        versions.append((BUCKETS[1], object_key, version))
        check("Actual S3 exact object version round-trip", lambda: storage.get_object(Bucket=BUCKETS[1], Key=object_key, VersionId=version)["Body"].read() == material, "真实S3")
        task = uuid.uuid4().hex
        digest = hashlib.sha256(material).hexdigest()
        query(database, "INSERT INTO s7_file_task VALUES(%s,%s,%s,%s,'object_written')", (task, object_key, version, digest))
        # New connection simulates recovery after object upload and local process loss.
        recovered = query(database, "SELECT * FROM s7_file_task WHERE number=%s", (task,))[0]
        data = storage.get_object(Bucket=BUCKETS[1], Key=recovered["object_key"], VersionId=recovered["version_id"])["Body"].read()
        check("File task recovery reuses exact version outside business transaction", lambda: hashlib.sha256(data).hexdigest() == recovered["hash"] and scan(data).endswith(": OK"), "真实S3/ClamAV+恢复驱动")
        # Document status codes and metadata follow the authoritative schema.
        with connect(database) as connection, connection.cursor() as cursor:
            insert(cursor, "document_file_tab", {
                "logical_file_number": "S7-FILE", "revision_number": 1, "revision_status_code": 2,
                "document_type_code": 24, "display_name": "Original synthetic tax preparation",
                "media_type": "text/html", "size_bytes": len(material), "sha256": digest,
                "storage_path": BUCKETS[1] + "/" + object_key + "?versionId=" + version,
                "access_scope_json": '{"validation_only":true,"tax_case":"S7-CASE"}',
                "created_by": "supplier"})
        query(database, "UPDATE s7_file_task SET status='ready' WHERE number=%s", (task,))
        h = Refund(database, secret)
        body = {"currency": "CNY", "claimed_amount": None, "scope_reference": "SYNTHETIC-PREPARATION-SCOPE",
                "files": [{"file_number": "S7-FILE", "version_id": version, "hash": digest}]}
        invoke = lambda action, value, expected, **kwargs: h.command(action, value, expected, **kwargs)
        internal = {"subject": "reviewer", "audience": "internal"}
        check("Cross-audience write rejected", lambda: rejected("FORBIDDEN", lambda: invoke("review", {}, 1)))
        check("Missing ETag rejected", lambda: rejected("PRECONDITION_REQUIRED", lambda: invoke("package", body, None)))
        expired_key = uuid.uuid4().hex
        expired_digest = hmac.new(secret, canonical({"action": "package", "body": body, "expected": 1, "key": expired_key}).encode(), hashlib.sha256).hexdigest()
        expired_confirmation = h.confirm("supplier", "external", expired_digest)
        query(database, "UPDATE s7_confirmation SET expires=UTC_TIMESTAMP(3)-INTERVAL 1 SECOND WHERE number=%s", (expired_confirmation,))
        check("Expired exact intent confirmation cannot write", lambda: rejected("CONFIRMATION_INVALID", lambda: invoke("package", body, 1, key=expired_key, confirmation=expired_confirmation)))
        wrong_confirmation = h.confirm("supplier", "internal", "0" * 64)
        check("Confirmation for other audience/digest cannot write", lambda: rejected("CONFIRMATION_INVALID", lambda: invoke("package", body, 1, confirmation=wrong_confirmation)))
        check("Unready exact file version rejected", lambda: rejected("FILE_NOT_READY", lambda: invoke("package", {**body, "files": [{**body["files"][0], "version_id": "wrong"}]}, 1)))
        initial = snapshot()
        check("Injected domain/receipt write rolls back atomically", lambda: rejected("INJECTED_ROLLBACK", lambda: invoke("package", body, 1, fail=True)))
        check("Rollback leaves domain/receipt counts unchanged", lambda: snapshot() == initial)
        key = uuid.uuid4().hex
        with ThreadPoolExecutor(max_workers=4) as pool:
            retries = list(pool.map(lambda _: invoke("package", body, 1, key=key), range(4)))
        first = retries[0]
        check("Four concurrent first invocations freeze one version and replay original receipt", lambda: all(r == first for r in retries) and len(query(database, "SELECT * FROM tax_submission_tab")) == 1)
        used_confirmation = query(database, "SELECT number FROM s7_confirmation WHERE consumed_by=%s", (key,))[0]["number"]
        check("Consumed original confirmation can recover original receipt before stale gate", lambda: invoke("package", body, 1, key=key, confirmation=used_confirmation) == first)
        check("Same original key changed content conflicts", lambda: rejected("IDEMPOTENCY_CONFLICT", lambda: invoke("package", {**body, "claimed_amount": "1.00"}, 1, key=key)))
        check("Stale new key version conflicts", lambda: rejected("VERSION_CONFLICT", lambda: invoke("package", body, 1)))
        row = query(database, "SELECT * FROM tax_submission_tab WHERE tax_case_number='S7-CASE'")[0]
        stored = json.loads(row["submission_content_json"])
        manifest = json.loads(row["evidence_manifest_json"])
        check("Closed tax content/manifest projection and full package digest match authority", lambda:
              set(stored) == {"schema_version", "tax_type_code", "approved_snapshot_number", "scope_reference", "rule_version", "responsibility_basis", "declaration_references", "fields", "check_report"}
              and set(manifest[0]) == {"logical_file_number", "revision_number", "content_digest", "document_purpose_code"}
              and hashlib.sha256(canonical({"content": stored, "manifest": manifest}).encode()).hexdigest() == row["package_hash"])
        review = {"revision": 1, "hash": row["package_hash"], "approve": True}
        check("Approval without confirmed scope rule blocked", lambda: rejected("SCOPE_RULE_UNCONFIRMED", lambda: invoke("review", review, 2, **internal)))
        # Exercise self-review with a test-only submitter identity, not an impersonation of live IAM.
        query(database, "UPDATE tax_submission_tab SET submitted_by='reviewer' WHERE id=%s", (row["id"],))
        check("Same person generation and review refused", lambda: rejected("SELF_REVIEW", lambda: invoke("review", review, 2, **internal)))
        query(database, "UPDATE tax_submission_tab SET submitted_by='supplier' WHERE id=%s", (row["id"],))
        returned = check("Independent return retains frozen source version", lambda: invoke("review", {**review, "approve": False}, 2, **internal))
        revised_body = {**body, "claimed_amount": "100.00", "synthetic_internal_rule": "SYNTHETIC-INTERNAL-POLICY-NOT-LEGAL-AUTHORITY"}

        def contender():
            try:
                return invoke("package", revised_body, returned["version"])
            except Rejected as error:
                return str(error)

        with ThreadPoolExecutor(max_workers=2) as pool:
            races = list(pool.map(lambda _: contender(), range(2)))
        check("Competing new keys current-read root version allows one new revision only", lambda: sum(isinstance(r, dict) for r in races) == 1 and races.count("VERSION_CONFLICT") == 1)
        second = next(r for r in races if isinstance(r, dict))
        row2 = query(database, "SELECT * FROM tax_submission_tab WHERE tax_case_number='S7-CASE' ORDER BY submission_revision_number DESC LIMIT 1")[0]
        approved = check("Synthetic internal independent approval is not official approval", lambda: invoke("review", {"revision": 2, "hash": row2["package_hash"], "approve": True, "confirmed_rule": "SYNTHETIC-INTERNAL-POLICY-NOT-LEGAL-AUTHORITY"}, second["version"], **internal))
        frozen_review = json.loads(query(database, "SELECT review_snapshot_json FROM tax_submission_tab WHERE id=%s", (row2["id"],))[0]["review_snapshot_json"])
        check("Closed independent review snapshot includes exact content/rule/evidence", lambda:
              set(frozen_review) == {"reviewer_reference", "content_hash", "result_code", "reviewed_at", "rule_version", "evidence_references", "comments"}
              and frozen_review["content_hash"] == row2["package_hash"] and frozen_review["result_code"] == 2)
        dispatch = {"revision": 2, "hash": row2["package_hash"]}
        check("No formal authority blocks submission", lambda: rejected("TAX_AUTHORITY_UNCONFIRMED", lambda: invoke("dispatch", dispatch, approved["version"])), "缺外部证据正确阻断")
        check("No tax channel blocks even test internal authorization flag", lambda: rejected("TAX_CHANNEL_UNAVAILABLE", lambda: invoke("dispatch", {**dispatch, "official_authorization": True}, approved["version"])), "缺外部证据正确阻断")
        query(database, "UPDATE tax_submission_tab SET execution_status=3,submission_status=4,dispatch_reference='SYNTHETIC-LOCAL-UNKNOWN-NOT-OFFICIAL' WHERE id=%s", (row2["id"],))
        unknown_counts = snapshot()
        check("Synthetic local unknown execution blocks duplicate dispatch without resend", lambda: rejected("DISPATCH_UNKNOWN", lambda: invoke("dispatch", dispatch, approved["version"])), "合成技术未知门禁")
        check("Unknown preserves execution reference and has no extra domain/fund receipt", lambda: snapshot() == unknown_counts and query(database, "SELECT execution_status,dispatch_reference FROM tax_submission_tab WHERE id=%s", (row2["id"],))[0] == {"execution_status": 3, "dispatch_reference": "SYNTHETIC-LOCAL-UNKNOWN-NOT-OFFICIAL"})
        query(database, "UPDATE tax_submission_tab SET execution_status=1,submission_status=3 WHERE id=%s", (row2["id"],))
        invalidated = check("Changed basis appends event18 invalidates approval, preserves review", lambda: invoke("invalidate", dispatch, approved["version"], **internal))
        check("Invalidated approval cannot dispatch", lambda: rejected("APPROVAL_STALE", lambda: invoke("dispatch", dispatch, invalidated["version"])))
        check("Old exact approval cannot authorize revised content", lambda: rejected("APPROVAL_STALE", lambda: invoke("dispatch", {"revision": 1, "hash": row["package_hash"]}, invalidated["version"])))
        check("Missing official exact version refused", lambda: rejected("OFFICIAL_EXACT_REVISION_REQUIRED", lambda: invoke("notice", {}, invalidated["version"], **internal)), "缺外部证据正确阻断")
        check("Missing real official source key refused", lambda: rejected("OFFICIAL_SOURCE_KEY_REQUIRED", lambda: invoke("notice", {"revision": 2}, invalidated["version"], **internal)), "缺外部证据正确阻断")
        check("Unverified official notification does not imply acceptance", lambda: rejected("OFFICIAL_EVIDENCE_REQUIRED", lambda: invoke("notice", {"revision": 2, "source_key": "UNVERIFIED-NOT-AUTHORITY"}, invalidated["version"], **internal)), "缺外部证据正确阻断")
        check("Correction cannot invent official event or reuse old approval", lambda: rejected("OFFICIAL_EVIDENCE_REQUIRED", lambda: invoke("correction", {**body, "previous": 2, "correction_event": "MISSING"}, invalidated["version"])), "缺外部证据正确阻断")
        check("Refund without real controlled fund observation blocked", lambda: rejected("REFUND_OBSERVATION_UNAVAILABLE", lambda: invoke("credit", {}, invalidated["version"], **internal)), "缺外部证据正确阻断")
        check("No A refund claim creates B fund flow or allocation", lambda: not query(database, "SELECT * FROM payment_fund_flow_tab") and not query(database, "SELECT * FROM payment_fund_allocation_tab"))
        check("Official types6-12 cannot omit exact revision/source/authority", lambda: sql_rejected("INSERT INTO tax_event_tab(event_number,tax_case_number,event_type_code,result_code,occurred_at,received_at,event_payload_json,actor_reference) VALUES('S7-FAKE-OFFICIAL','S7-CASE',7,2,UTC_TIMESTAMP(3),UTC_TIMESTAMP(3),'{}','reviewer')"), "DB硬约束")
        check("Submission business JSON cannot be overwritten", lambda: sql_rejected("UPDATE tax_submission_tab SET submission_content_json='{}' WHERE tax_case_number='S7-CASE' AND submission_revision_number=1"), "DB冻结触发器")
        check("Submission manifest/hash/previous cannot be overwritten", lambda: all(sql_rejected(sql) for sql in [
            "UPDATE tax_submission_tab SET evidence_manifest_json='[]' WHERE tax_case_number='S7-CASE' AND submission_revision_number=1",
            "UPDATE tax_submission_tab SET package_hash=REPEAT('c',64) WHERE tax_case_number='S7-CASE' AND submission_revision_number=1",
            "UPDATE tax_submission_tab SET previous_submission_revision_number=9 WHERE tax_case_number='S7-CASE' AND submission_revision_number=1"]), "DB冻结触发器")
        check("Submission delete and event mutation refused", lambda: sql_rejected("DELETE FROM tax_submission_tab WHERE tax_case_number='S7-CASE'") and sql_rejected("UPDATE tax_event_tab SET actor_reference='other' WHERE tax_case_number='S7-CASE'"), "DB冻结触发器")
        check("Internal event source keys stay NULL and no official/bank success exists", lambda: not query(database, "SELECT * FROM tax_event_tab WHERE external_event_key IS NOT NULL OR event_type_code IN (6,7,8,9,10,11,12,17)"))
        check("Rejected/unknown tax attempts never close or change transaction", lambda: query(database, "SELECT trade_status_code FROM trade_record_tab WHERE trade_number=%s", (TRADE,))[0]["trade_status_code"] == 8)
        # A projection-only terminal fixture tests guards, not a fabricated official rejection.
        query(database, "UPDATE tax_case_tab SET case_status=10 WHERE tax_case_number='S7-OTHER-SCOPE'")
        check("Terminal rejection on another scope does not auto-close trade", lambda: query(database, "SELECT trade_status_code FROM trade_record_tab WHERE trade_number=%s", (TRADE,))[0]["trade_status_code"] == 8, "合成终态投影门禁")
        check("DDL remained stable during entity validation", lambda: hashlib.sha256(ddl_path.read_bytes()).hexdigest() == fingerprint, "真实源DDL")
    except Exception as error:
        failure = type(error).__name__ + ": " + str(error)
    finally:
        cleanup = []
        for bucket, key, version in versions:
            admin.delete_object(Bucket=bucket, Key=key, VersionId=version)
            cleanup.append({"bucket": bucket, "objectKey": key, "versionId": version})
        after = shared.application_baseline()
        unchanged = after == before
        checks.append({"name": "Original export_trade table counts unchanged", "passed": unchanged, "classification": "真实基线只读", "observed": "相同" if unchanged else "不相同"})
        report = {"validationOnly": True, "database": database, "ddlSha256": fingerprint, "sourceDDLSha256": fingerprint,
            "coreTables": CORE, "checks": checks, "passed": sum(c["passed"] for c in checks),
            "failed": sum(not c["passed"] for c in checks), "failure": failure, "sourceDatabaseUnchanged": unchanged,
            "sourceTableCountsBefore": before, "sourceTableCountsAfter": after,
            "s3VersionsCleaned": cleanup, "databaseRetained": True,
            "limitations": ["简单隔离实体驱动，不是生产handler/IAM", "内部批准及规则是明确合成前置，不是法定权威",
                "无正式税务提交/受理/批准/补正成功验证", "无真实银行到账成功，不虚增B余额", "文件恢复为新连接恢复驱动，不宣称进程崩溃或自动调度"]}
        target.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    if failure or not unchanged:
        raise RuntimeError("Step-seven verification failed; inspect persisted report")
    print(json.dumps({"database": database, "passed": len(checks), "ddlSha256": fingerprint}))


if __name__ == "__main__":
    main()
