"""Isolated MySQL logistics entity tests with actual S3/ClamAV, not production APIs."""
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
from botocore.exceptions import ClientError
from s3 import BASE, BUCKETS, client, root_credentials
from verify_antivirus_support import scan, scan_database_fresh

shared = importlib.import_module("verify-step-flows")
connect, query, canonical, Rejected = shared.connect, shared.query, shared.canonical, shared.Rejected
ROOT = Path(__file__).resolve().parents[2]
CORE = ["trade_record_tab", "trade_revision_tab", "trade_event_tab", "document_file_tab",
        "logistics_shipment_tab", "logistics_shipment_item_tab",
        "logistics_transport_leg_tab", "logistics_event_tab"]


def insert(cursor, table, values):
    cursor.execute("INSERT INTO `" + table + "` (" +
                   ",".join("`" + key + "`" for key in values) + ") VALUES (" +
                   ",".join(["%s"] * len(values)) + ")", tuple(values.values()))
    return cursor.lastrowid


class Logistics:
    def __init__(self, database, secret):
        if not re.fullmatch(r"verify_logistics_[a-f0-9]{12}", database):
            raise ValueError("An isolated validation database is required")
        self.database, self.secret = database, secret

    def digest(self, value):
        return hmac.new(self.secret, canonical(value).encode(), hashlib.sha256).hexdigest()

    def tag(self, shipment):
        rows = query(self.database, "SELECT MAX(sequence) n FROM middleware_receipt WHERE shipment=%s", (shipment,))
        return str(rows[0]["n"] or 0)

    def intent(self, action, shipment, body, expected, key):
        return {"action": action, "shipment": shipment, "body": body, "tag": expected, "key": key}

    def confirm(self, action, shipment, body, expected, key, subject):
        number = str(uuid.uuid4())
        query(self.database, "INSERT INTO middleware_confirmation VALUES(%s,%s,%s,UTC_TIMESTAMP(3)+INTERVAL 5 MINUTE,NULL)",
              (number, subject, self.digest(self.intent(action, shipment, body, expected, key))))
        return number

    def run(self, action, body, shipment="", expected=None, key=None, subject="supplier", fail=False, confirmation=None):
        key = key or str(uuid.uuid4())
        digest = self.digest(self.intent(action, shipment, body, expected, key))
        allowed = {"create": ("supplier",), "replace": ("supplier",), "cancel": ("reviewer",),
                   "submit": ("supplier", "carrier"), "review": ("reviewer",)}
        if subject not in allowed[action]:
            raise Rejected("FORBIDDEN")
        audience = "internal" if subject == "reviewer" else "external"
        confirmation = confirmation or self.confirm(action, shipment, body, expected, key, subject)
        with connect(self.database) as connection, connection.cursor() as cursor:
            cursor.execute("SET TRANSACTION ISOLATION LEVEL READ COMMITTED")
            connection.begin()
            try:
                cursor.execute("SELECT * FROM middleware_receipt WHERE subject=%s AND audience=%s AND request_key=%s",
                               (subject, audience, key))
                prior = cursor.fetchone()
                if prior:
                    return self.replay(connection, prior, digest)
                cursor.execute("SELECT * FROM trade_record_tab WHERE trade_number='SYNTHETIC-S3-TRADE' FOR UPDATE")
                trade = cursor.fetchone()
                cursor.execute("SELECT * FROM middleware_receipt WHERE subject=%s AND audience=%s AND request_key=%s",
                               (subject, audience, key))
                prior = cursor.fetchone()
                if prior:
                    return self.replay(connection, prior, digest)
                cursor.execute("SELECT * FROM logistics_shipment_tab WHERE shipment_number=%s FOR UPDATE", (shipment,))
                batch = cursor.fetchone()
                cursor.execute("SELECT MAX(sequence) n FROM middleware_receipt WHERE shipment=%s", (shipment,))
                current = str(cursor.fetchone()["n"] or 0)
                if expected is None:
                    raise Rejected("PRECONDITION_REQUIRED")
                if expected != ("approved-1" if action == "create" else current):
                    raise Rejected("REVISION_CONFLICT")
                cursor.execute("SELECT * FROM middleware_confirmation WHERE number=%s FOR UPDATE", (confirmation,))
                confirmed = cursor.fetchone()
                cursor.execute("SELECT UTC_TIMESTAMP(3) now")
                now = cursor.fetchone()["now"]
                if not confirmed or confirmed["subject"] != subject or confirmed["digest"] != digest or confirmed["consumed_by"] or confirmed["expires"] <= now:
                    raise Rejected("CONFIRMATION_INVALID")
                if action in ("create", "replace"):
                    snapshot = self.approved(cursor, trade, body)
                    if action == "replace":
                        cursor.execute("SELECT COUNT(*) n FROM middleware_claim WHERE shipment=%s AND state='pending'", (shipment,))
                        if not batch or batch["shipment_status"] != 1 or cursor.fetchone()["n"]:
                            raise Rejected("PLAN_FROZEN")
                    self.allocate(cursor, body, snapshot, shipment if action == "replace" else "")
                    if action == "create":
                        cursor.execute("SELECT n FROM middleware_counter WHERE scope='shipment' FOR UPDATE")
                        number = cursor.fetchone()["n"] + 1
                        cursor.execute("UPDATE middleware_counter SET n=%s WHERE scope='shipment'", (number,))
                        shipment = "S3-" + str(number).zfill(10)
                        insert(cursor, "logistics_shipment_tab", {
                            "shipment_number": shipment, "trade_number": trade["trade_number"], "trade_revision_number": 1,
                            "shipment_status": 1, "shipper_party_role_code": 1, "shipper_participant_sequence_number": 1,
                            "consignee_party_role_code": 3, "consignee_participant_sequence_number": 1,
                            "carrier_party_role_code": 5, "carrier_participant_sequence_number": 1,
                            "origin_code": "SYNTHETIC-ORIGIN", "destination_code": "SYNTHETIC-DEST",
                            "planned_departure_date": "2026-11-01", "planned_arrival_date": "2026-11-03"})
                    else:
                        cursor.execute("DELETE FROM logistics_shipment_item_tab WHERE shipment_number=%s", (shipment,))
                        cursor.execute("DELETE FROM logistics_transport_leg_tab WHERE shipment_number=%s", (shipment,))
                    insert(cursor, "logistics_shipment_item_tab", {
                        "shipment_number": shipment, "trade_number": trade["trade_number"], "trade_revision_number": 1,
                        "trade_goods_item_sequence_number": 1, "allocated_quantity": body["quantity"],
                        "unit_code": "PCS", "allocated_amount": body["amount"], "currency_code": "CNY", "allocation_status": 1})
                    if fail:
                        raise Rejected("INJECTED_PARTIAL_WRITE")
                    insert(cursor, "logistics_transport_leg_tab", {
                        "shipment_number": shipment, "leg_sequence_number": 1, "mode_code": 3,
                        "carrier_party_role_code": 5, "carrier_participant_sequence_number": 1,
                        "origin_code": "SYNTHETIC-ORIGIN", "destination_code": "SYNTHETIC-DEST",
                        "planned_departure_at": "2026-11-01 01:00:00", "planned_arrival_at": "2026-11-03 01:00:00"})
                    event = self.event(cursor, shipment, 1 if action == "create" else 2)
                    projection = {"shipment": shipment, "status": 1, "event": event}
                elif not batch:
                    raise Rejected("NOT_FOUND")
                elif action == "submit":
                    if batch["shipment_status"] in (6, 8, 9):
                        raise Rejected("SHIPMENT_STATE_CONFLICT")
                    if body["kind"] == "readiness" and subject != "supplier" or body["kind"] != "readiness" and subject != "carrier":
                        raise Rejected("FORBIDDEN")
                    cursor.execute("SELECT MAX(sequence) n FROM middleware_plan WHERE shipment=%s", (shipment,))
                    if str(cursor.fetchone()["n"]) != body["planRevision"]:
                        raise Rejected("PLAN_REVISION_CONFLICT")
                    self.file(cursor, body["file"])
                    cursor.execute("SELECT * FROM middleware_claim WHERE shipment=%s AND subject=%s AND kind=%s AND source=%s",
                                   (shipment, subject, body["kind"], body["source"]))
                    source = cursor.fetchone()
                    if source:
                        if source["digest"] != self.digest(body):
                            raise Rejected("SOURCE_CONFLICT")
                        projection = {"shipment": shipment, "submission": source["number"], "state": "pending"}
                    else:
                        number = str(uuid.uuid4())
                        insert(cursor, "middleware_claim", {"number": number, "shipment": shipment, "subject": subject,
                            "kind": body["kind"], "source": body["source"], "digest": self.digest(body),
                            "content": canonical(body), "state": "pending"})
                        projection = {"shipment": shipment, "submission": number, "state": "pending"}
                elif action == "review":
                    cursor.execute("SELECT * FROM middleware_claim WHERE number=%s AND shipment=%s FOR UPDATE",
                                   (body["submission"], shipment))
                    claim = cursor.fetchone()
                    if not claim or claim["state"] != "pending":
                        raise Rejected("EVIDENCE_ALREADY_DECIDED")
                    content = json.loads(claim["content"])
                    self.file(cursor, content["file"])
                    cursor.execute("SELECT MAX(sequence) n FROM middleware_plan WHERE shipment=%s", (shipment,))
                    if str(cursor.fetchone()["n"]) != content["planRevision"]:
                        raise Rejected("PLAN_REVISION_CONFLICT")
                    kind = claim["kind"]
                    if body["outcome"] == "approve" and kind != "readiness":
                        # There is deliberately no success-shaped external contract/clearance fixture.
                        raise Rejected("CLEARANCE_REQUIRED" if kind == "departure" else
                                       "EVIDENCE_NOT_VERIFIED" if kind in ("arrival", "delivery") else "LOGISTICS_GATE_MISSING")
                    if body["outcome"] == "approve" and batch["shipment_status"] != 1:
                        raise Rejected("SHIPMENT_STATE_CONFLICT")
                    state = "approved" if body["outcome"] == "approve" else "rejected"
                    insert(cursor, "middleware_decision", {"submission": claim["number"], "outcome": state})
                    cursor.execute("UPDATE middleware_claim SET state=%s WHERE number=%s", (state, claim["number"]))
                    event = self.event(cursor, shipment, 3, claim["number"]) if state == "approved" else None
                    projection = {"shipment": shipment, "state": state, "event": event}
                elif action == "cancel":
                    if batch["shipment_status"] != 1:
                        raise Rejected("LOGISTICS_GATE_MISSING")
                    cursor.execute("SELECT COUNT(*) n FROM middleware_claim WHERE shipment=%s AND state='pending'", (shipment,))
                    if cursor.fetchone()["n"]:
                        raise Rejected("PLAN_FROZEN")
                    cursor.execute("UPDATE logistics_shipment_tab SET shipment_status=8 WHERE shipment_number=%s", (shipment,))
                    cursor.execute("UPDATE logistics_shipment_item_tab SET allocation_status=2 WHERE shipment_number=%s", (shipment,))
                    if fail:
                        raise Rejected("INJECTED_PARTIAL_WRITE")
                    projection = {"shipment": shipment, "status": 8, "event": self.event(cursor, shipment, 11)}
                sequence = insert(cursor, "middleware_receipt", {"subject": subject, "audience": audience, "request_key": key,
                    "digest": digest, "shipment": shipment, "projection": canonical(projection)})
                projection["tag"] = str(sequence)
                cursor.execute("UPDATE middleware_receipt SET projection=%s WHERE sequence=%s", (canonical(projection), sequence))
                if action in ("create", "replace"):
                    insert(cursor, "middleware_plan", {"shipment": shipment, "sequence": sequence, "content": canonical(body)})
                cursor.execute("UPDATE middleware_confirmation SET consumed_by=%s WHERE number=%s", (key, confirmation))
                connection.commit()
                return projection
            except (Rejected, pymysql.MySQLError):
                connection.rollback()
                raise

    def replay(self, connection, prior, digest):
        if prior["digest"] != digest:
            raise Rejected("IDEMPOTENCY_CONFLICT")
        connection.commit()
        return json.loads(prior["projection"])

    def approved(self, cursor, trade, body):
        cursor.execute("SELECT * FROM trade_revision_tab WHERE snapshot_number=%s", (body["snapshot"],))
        snapshot = cursor.fetchone()
        if trade["trade_status_code"] != 8 or not snapshot or snapshot["snapshot_reason_code"] != 2 or snapshot["revision_number"] != 1 or snapshot["trade_number"] != trade["trade_number"]:
            raise Rejected("APPROVED_SNAPSHOT_REQUIRED")
        return json.loads(snapshot["transaction_filing_snapshot_json"])

    def allocate(self, cursor, body, snapshot, excluding):
        if body["currency"] != "CNY" or body["unit"] != "PCS":
            raise Rejected("CURRENCY_OR_UNIT_INVALID")
        for field, scale, integral in (("quantity", 6, 14), ("amount", 2, 18)):
            if not re.fullmatch(r"(?:0|[1-9][0-9]{0," + str(integral - 1) + r"})(?:\.[0-9]{1," + str(scale) + r"})?", body[field]) or Decimal(body[field]) <= 0:
                raise Rejected("DECIMAL_INVALID")
        cursor.execute("SELECT allocated_quantity q,allocated_amount a "
                       "FROM logistics_shipment_item_tab WHERE trade_number='SYNTHETIC-S3-TRADE' "
                       "AND trade_revision_number=1 AND trade_goods_item_sequence_number=1 AND allocation_status=1 "
                       "AND shipment_number<>%s FOR UPDATE", (excluding,))
        allocations = cursor.fetchall()
        sums = {field: sum((row[field] for row in allocations), Decimal(0)) for field in ("q", "a")}
        if sums["q"] + Decimal(body["quantity"]) > Decimal(snapshot["quantity"]) or sums["a"] + Decimal(body["amount"]) > Decimal(snapshot["amount"]):
            raise Rejected("ALLOCATION_EXCEEDED")

    def file(self, cursor, reference):
        cursor.execute("SELECT * FROM document_file_tab WHERE logical_file_number=%s AND revision_number=%s",
                       (reference["number"], reference["revision"]))
        row = cursor.fetchone()
        if not row or row["sha256"] != reference["sha256"] or row["revision_status_code"] != 2 or row["document_type_code"] != 3:
            raise Rejected("FILE_NOT_READY")

    def event(self, cursor, shipment, kind, source=None):
        number = "LE-" + uuid.uuid4().hex
        insert(cursor, "logistics_event_tab", {"event_number": number, "shipment_number": shipment,
            "event_type_code": kind, "event_status_code": 1,
            "occurred_at": datetime.now(timezone.utc).replace(tzinfo=None),
            "received_at": datetime.now(timezone.utc).replace(tzinfo=None),
            "source_message_id": source, "evidence_reference": source})
        return number


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    database = "verify_logistics_" + secrets.token_hex(6)
    key_path = BASE / (database + ".key")
    key = secrets.token_bytes(32)
    with os.fdopen(os.open(key_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), "wb") as target:
        target.write(key)
    before = shared.application_baseline()
    checks, versions = [], []
    storage_credentials = json.loads((BASE / "s3-client.json").read_text())
    storage = client(storage_credentials["access_key"], storage_credentials["secret_key"])
    admin = client(*root_credentials())
    prefix = "_step-three-validation/" + secrets.token_hex(16)

    def check(name, test):
        result = test()
        if result is False:
            raise AssertionError(name)
        checks.append({"name": name, "passed": True})
        return result

    def rejected(code, call):
        try:
            call()
        except Rejected as error:
            assert str(error) == code, (code, str(error))
            return True
        raise AssertionError("Expected " + code)

    try:
        query(None, "CREATE DATABASE `" + database + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin")
        ddl = (ROOT / "doc/sql/domain/schema.sql").read_text()
        for table in CORE:
            statement = re.search(r"CREATE TABLE `" + table + r"` \([\s\S]*?\) ENGINE=InnoDB[^;]*;", ddl).group()
            query(database, statement)
        for table in ("trade_revision_tab", "trade_event_tab", "logistics_event_tab"):
            for action in ("UPDATE", "DELETE"):
                query(database, "CREATE TRIGGER prevent_" + action.lower() + "_" + table +
                      " BEFORE " + action + " ON `" + table +
                      "` FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='APPEND_ONLY'")
        middleware = [
            "CREATE TABLE middleware_counter(scope VARCHAR(32) PRIMARY KEY,n BIGINT NOT NULL) ENGINE=InnoDB",
            "CREATE TABLE middleware_confirmation(number CHAR(36) PRIMARY KEY,subject VARCHAR(32),digest CHAR(64),expires DATETIME(3),consumed_by CHAR(36) NULL) ENGINE=InnoDB",
            "CREATE TABLE middleware_receipt(sequence BIGINT AUTO_INCREMENT PRIMARY KEY,subject VARCHAR(32),audience VARCHAR(16),request_key CHAR(36),digest CHAR(64),shipment VARCHAR(40),projection JSON,UNIQUE KEY(subject,audience,request_key)) ENGINE=InnoDB",
            "CREATE TABLE middleware_plan(shipment VARCHAR(40),sequence BIGINT,content JSON,PRIMARY KEY(shipment,sequence)) ENGINE=InnoDB",
            "CREATE TABLE middleware_claim(number CHAR(36) PRIMARY KEY,shipment VARCHAR(40),subject VARCHAR(32),kind VARCHAR(20),source VARCHAR(64),digest CHAR(64),content JSON,state VARCHAR(16),UNIQUE KEY(shipment,subject,kind,source)) ENGINE=InnoDB",
            "CREATE TABLE middleware_decision(submission CHAR(36) PRIMARY KEY,outcome VARCHAR(16)) ENGINE=InnoDB"]
        for statement in middleware:
            query(database, statement)
        query(database, "INSERT INTO middleware_counter VALUES('shipment',0)")
        for action in ("UPDATE", "DELETE"):
            query(database, "CREATE TRIGGER immutable_plan_" + action.lower() + " BEFORE " + action +
                  " ON middleware_plan FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='APPEND_ONLY'")
        with connect(database) as connection, connection.cursor() as cursor:
            trade_id = insert(cursor, "trade_record_tab", {"trade_number": "SYNTHETIC-S3-TRADE", "trade_status_code": 8,
                "revision_number": 1, "approved_revision_number": 1, "transaction_goods_items_json": "[]",
                "transaction_filing_document_references_json": "[]", "transaction_filing_source_and_version_json": "{}",
                "transaction_filing_missing_information_json": "[]", "creation_payload_hmac": "0" * 64,
                "creation_payload_hmac_key_version": "SYNTHETIC-FIXTURE-NOT-A-REAL-APPROVAL"})
            insert(cursor, "trade_event_tab", {"event_number": "SYNTHETIC-APPROVAL-EVENT", "trade_record_id": trade_id,
                "revision_number": 1, "event_type_code": 10, "from_trade_status_code": 5, "to_trade_status_code": 8,
                "actor_reference": "SYNTHETIC-REVIEWER", "reason_code": 1, "reason_text": "Validation-only fixture",
                "event_payload": "{}", "trace_id": uuid.uuid4().hex,
                "occurred_at": datetime.now(timezone.utc).replace(tzinfo=None)})
            for reason in (1, 2):
                insert(cursor, "trade_revision_tab", {"snapshot_number": "SYNTHETIC-SNAPSHOT-" + str(reason),
                    "trade_number": "SYNTHETIC-S3-TRADE", "revision_number": 1, "snapshot_reason_code": reason,
                    "transaction_filing_snapshot_json": canonical({"quantity": "100.000000", "amount": "10000.00"}),
                    "integrity_key_version": "SYNTHETIC-FIXTURE", "revision_content_hmac": "0" * 64,
                    "source_event_number": "SYNTHETIC-APPROVAL-EVENT" if reason == 2 else "SYNTHETIC-SUBMIT-EVENT"})
        h = Logistics(database, key)
        base = {"snapshot": "SYNTHETIC-SNAPSHOT-2", "quantity": "40.000000", "amount": "4000.00", "currency": "CNY", "unit": "PCS"}
        create = lambda body=base, **kwargs: h.run("create", body, expected="approved-1", **kwargs)
        check("Copied eight actual core DDL tables to isolated database", lambda: len([r for r in query(database, "SHOW TABLES") if next(iter(r.values())) in CORE]) == 8)
        check("Unapproved cause-1 snapshot cannot allocate", lambda: rejected("APPROVED_SNAPSHOT_REQUIRED", lambda: create({**base, "snapshot": "SYNTHETIC-SNAPSHOT-1"})))
        check("Non-CNY and unit conversion refused", lambda: rejected("CURRENCY_OR_UNIT_INVALID", lambda: create({**base, "currency": "USD"})))
        check("Quantity overprecision refused without rounding", lambda: rejected("DECIMAL_INVALID", lambda: create({**base, "quantity": "1.0000001"})))
        check("Partial create rolls back batch, allocation and number", lambda: rejected("INJECTED_PARTIAL_WRITE", lambda: create(fail=True)))
        check("No partial batch/number persisted", lambda: query(database, "SELECT n FROM middleware_counter")[0]["n"] == 0 and not query(database, "SELECT * FROM logistics_shipment_tab"))
        first_key = str(uuid.uuid4())
        first = check("Create actual batch/allocation/leg and immutable plan", lambda: create(key=first_key))
        shipment = first["shipment"]
        check("Exact DECIMAL quantity and amount persisted", lambda: query(database, "SELECT allocated_quantity q,allocated_amount a FROM logistics_shipment_item_tab")[0] == {"q": Decimal("40.000000"), "a": Decimal("4000.00")})
        check("Same key changed payload rejected", lambda: rejected("IDEMPOTENCY_CONFLICT", lambda: create({**base, "amount": "3999.00"}, key=first_key)))
        with ThreadPoolExecutor(max_workers=5) as pool:
            results = list(pool.map(lambda _: create(key=first_key), range(5)))
        check("Five concurrent original retries recover identical receipt", lambda: all(result == first for result in results))
        check("Missing tag rejected", lambda: rejected("PRECONDITION_REQUIRED", lambda: h.run("replace", base, shipment=shipment)))
        replaced = check("Replace planned allocation freezes new plan", lambda: h.run("replace", {**base, "quantity": "30.000000", "amount": "3000.00"}, shipment, h.tag(shipment)))
        check("Old plan bytes remain immutable and separate from content revision", lambda: len(query(database, "SELECT * FROM middleware_plan WHERE shipment=%s", (shipment,))) == 2 and query(database, "SELECT trade_revision_number n FROM logistics_shipment_tab")[0]["n"] == 1)
        check("Original create replay wins over changed current version", lambda: create(key=first_key) == first)
        check("Stale plan tag refused", lambda: rejected("REVISION_CONFLICT", lambda: h.run("replace", base, shipment, first["tag"])))
        def competing(_):
            try:
                return create({**base, "quantity": "50.000000", "amount": "5000.00"})
            except Rejected as error:
                return str(error)
        with ThreadPoolExecutor(max_workers=2) as pool:
            competition = list(pool.map(competing, range(2)))
        check("Different-batch concurrent allocation cannot exceed approved line", lambda: sum(isinstance(r, dict) for r in competition) == 1 and competition.count("ALLOCATION_EXCEEDED") == 1)
        check("Cross-batch active aggregate is exactly 80 units / CNY8000", lambda: query(database, "SELECT SUM(allocated_quantity) q,SUM(allocated_amount) a FROM logistics_shipment_item_tab WHERE allocation_status=1")[0] == {"q": Decimal("80.000000"), "a": Decimal("8000.00")})
        check("Amount upper bound independently enforced", lambda: rejected("ALLOCATION_EXCEEDED", lambda: create({**base, "quantity": "1.000000", "amount": "3000.00"})))
        material = (ROOT / "doc/examples/step3/material.html").read_bytes()
        digest = hashlib.sha256(material).hexdigest()
        check("Actual ClamAV database fresh and original material scanned", lambda: scan_database_fresh() and scan(material).endswith(": OK"))
        for bucket in BUCKETS[:2]:
            version = storage.put_object(Bucket=bucket, Key=prefix, Body=material, IfNoneMatch="*")["VersionId"]
            versions.append((bucket, prefix, version))
            check("Actual exact S3 version and SHA-256: " + bucket,
                  lambda b=bucket, v=version: hashlib.sha256(storage.get_object(Bucket=b, Key=prefix, VersionId=v)["Body"].read()).hexdigest() == digest)
        try:
            storage.put_object(Bucket=BUCKETS[1], Key=prefix, Body=b"different", IfNoneMatch="*")
        except ClientError as error:
            assert error.response["Error"]["Code"] in ("PreconditionFailed", "ConditionalRequestConflict")
            check("S3 stable key refuses overwrite", lambda: True)
        else:
            raise AssertionError("S3 overwrite was not rejected")
        with connect(database) as connection, connection.cursor() as cursor:
            insert(cursor, "document_file_tab", {"logical_file_number": "SYNTHETIC-FILE-S3", "revision_number": 1,
                "revision_status_code": 2, "display_name": "Original synthetic logistics material", "document_type_code": 3,
                "storage_path": BUCKETS[1] + "/" + prefix + "?versionId=" + versions[-1][2], "sha256": digest,
                "size_bytes": len(material), "media_type": "text/html", "access_scope_json": '{"validation_only":true}',
                "created_by": "SYNTHETIC"})
        file = {"number": "SYNTHETIC-FILE-S3", "revision": 1, "sha256": digest}
        claim = {"kind": "readiness", "planRevision": replaced["tag"], "source": "SYNTHETIC-READY-1", "file": file}
        check("Unready exact file version refused", lambda: rejected("FILE_NOT_READY", lambda: h.run("submit", {**claim, "file": {**file, "revision": 2}}, shipment, h.tag(shipment))))
        check("Wrong digest refused", lambda: rejected("FILE_NOT_READY", lambda: h.run("submit", {**claim, "file": {**file, "sha256": "0" * 64}}, shipment, h.tag(shipment))))
        submitted = check("Readiness accepted pending, not a carrier or customs success", lambda: h.run("submit", claim, shipment, h.tag(shipment)))
        check("Pending evidence freezes plan modification", lambda: rejected("PLAN_FROZEN", lambda: h.run("replace", base, shipment, h.tag(shipment))))
        duplicate = check("Stable evidence source is deduplicated across new request keys", lambda: h.run("submit", claim, shipment, h.tag(shipment)))
        check("No second evidence row produced", lambda: duplicate["submission"] == submitted["submission"] and len(query(database, "SELECT * FROM middleware_claim")) == 1)
        check("Same source different content refused", lambda: rejected("SOURCE_CONFLICT", lambda: h.run("submit", {**claim, "note": "changed"}, shipment, h.tag(shipment))))
        decision = {"submission": submitted["submission"], "outcome": "approve"}
        check("Submitter cannot self-review through internal endpoint", lambda: rejected("FORBIDDEN", lambda: h.run("review", decision, shipment, h.tag(shipment))))
        check("Synthetic independent readiness decision appends event without new status", lambda: h.run("review", decision, shipment, h.tag(shipment), subject="reviewer"))
        check("Batch remains planned, actual dates remain NULL", lambda: query(database, "SELECT shipment_status s,actual_departure_at d,actual_arrival_at a FROM logistics_shipment_tab WHERE shipment_number=%s", (shipment,))[0] == {"s": 1, "d": None, "a": None})
        check("Second final evidence decision refused", lambda: rejected("EVIDENCE_ALREADY_DECIDED", lambda: h.run("review", decision, shipment, h.tag(shipment), subject="reviewer")))
        for kind, error in [("booking", "LOGISTICS_GATE_MISSING"), ("departure", "CLEARANCE_REQUIRED"), ("delivery", "EVIDENCE_NOT_VERIFIED")]:
            evidence = h.run("submit", {**claim, "kind": kind, "source": "SYNTHETIC-" + kind}, shipment, h.tag(shipment), subject="carrier")
            check("Missing external evidence blocks " + kind, lambda e=evidence, code=error: rejected(code, lambda: h.run("review", {"submission": e["submission"], "outcome": "approve"}, shipment, h.tag(shipment), subject="reviewer")))
            h.run("review", {"submission": evidence["submission"], "outcome": "return"}, shipment, h.tag(shipment), subject="reviewer")
        check("Cancel partial failure rolls status and allocation back", lambda: rejected("INJECTED_PARTIAL_WRITE", lambda: h.run("cancel", {}, shipment, h.tag(shipment), subject="reviewer", fail=True)))
        check("Failed cancellation keeps active allocation", lambda: query(database, "SELECT allocation_status s FROM logistics_shipment_item_tab WHERE shipment_number=%s", (shipment,))[0]["s"] == 1)
        cancel_key = str(uuid.uuid4())
        tag = h.tag(shipment)
        confirmation = h.confirm("cancel", shipment, {}, tag, cancel_key, "reviewer")
        rejected("INJECTED_PARTIAL_WRITE", lambda: h.run("cancel", {}, shipment, tag, key=cancel_key, subject="reviewer", fail=True, confirmation=confirmation))
        check("Rollback did not consume exact confirmation", lambda: query(database, "SELECT consumed_by c FROM middleware_confirmation WHERE number=%s", (confirmation,))[0]["c"] is None)
        cancelled = check("Atomic cancellation marks terminal8 and revoked allocation2", lambda: h.run("cancel", {}, shipment, tag, key=cancel_key, subject="reviewer", confirmation=confirmation))
        check("Cancellation replay returns original receipt even consumed confirmation", lambda: h.run("cancel", {}, shipment, tag, key=cancel_key, subject="reviewer", confirmation=confirmation) == cancelled)
        check("New modification cannot reopen cancelled shipment", lambda: rejected("PLAN_FROZEN", lambda: h.run("replace", base, shipment, h.tag(shipment))))
        check("Cancelled allocation frees capacity, historical row retained", lambda: create(base)["status"] == 1 and len(query(database, "SELECT * FROM logistics_shipment_item_tab WHERE allocation_status=2")) == 1)
        try:
            query(database, "UPDATE logistics_event_tab SET event_status_code=1")
        except pymysql.err.OperationalError as error:
            assert error.args[0] == 1644
            check("Actual SQL trigger prevents logistics event rewriting", lambda: True)
        else:
            raise AssertionError("Append-only guard missing")
        check("Original application 45-table row counts unchanged", lambda: before == shared.application_baseline())
    finally:
        for bucket, object_key, version in versions:
            admin.delete_object(Bucket=bucket, Key=object_key, VersionId=version)
    check("Only this run's exact S3 object versions cleaned", lambda: all(
        not admin.list_object_versions(Bucket=bucket, Prefix=object_key).get("Versions") for bucket, object_key, _ in versions))
    output = {"validationOnly": True, "database": database, "finishedAt": datetime.now(timezone.utc).isoformat(),
              "coreTables": CORE, "passed": len(checks), "checks": checks, "testObjectsCleaned": True,
              "applicationBeforeAfterEqual": True,
              "notProven": ["Production REST/RPC handlers and IAM/intent confirmation",
                            "Real contract, carrier, customs, bank, tax or legal proof",
                            "Actual booked/pickup/departure/arrival/delivery, multi-leg transport or exception success",
                            "Automatic worker scheduling, process recovery or production database permissions",
                            "The harness uses reduced synthetic snapshot/HMAC JSON, not the full REST canonical profile"]}
    target = Path(args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"passed": len(checks), "database": database, "output": str(target)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
