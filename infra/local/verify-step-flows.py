"""Real local dependency tests, not production handlers or valid legal evidence."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import hmac
import json
import os
from pathlib import Path
import re
import secrets
import subprocess
import sys
import threading
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import pymysql
from botocore.exceptions import ClientError

from s3 import BASE, BUCKETS, client, root_credentials
from verify_antivirus_support import scan, scan_database_fresh

ROOT = Path(__file__).resolve().parents[2]
CORE = ["trade_record_tab", "trade_participater_tab", "trade_revision_tab",
        "trade_event_tab", "contract_record_tab", "contract_revision_tab", "document_file_tab"]
MYSQL_CONFIG = BASE / "root-client.cnf"


class Rejected(Exception):
    pass


def canonical(value):
    # This harness uses its own explicit canonicalization, NOT the REST typed-JSON profile.
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def connect(database=None):
    connection = pymysql.connect(read_default_file=str(MYSQL_CONFIG), database=database,
                                 charset="utf8mb4", autocommit=True,
                                 connect_timeout=3, read_timeout=8, write_timeout=8,
                                 cursorclass=pymysql.cursors.DictCursor)
    with connection.cursor() as cursor:
        cursor.execute("SET time_zone='+00:00'")
        cursor.execute("SET SESSION innodb_lock_wait_timeout=1")
    return connection


def query(database, sql, args=()):
    with connect(database) as connection, connection.cursor() as cursor:
        cursor.execute(sql, args)
        return cursor.fetchall()


def application_baseline():
    tables = query("export_trade", "SHOW TABLES")
    return {next(iter(row.values())): query("export_trade", "SELECT COUNT(*) AS n FROM `" +
                                          next(iter(row.values())) + "`")[0]["n"] for row in tables}


MIDDLEWARE = [
    """CREATE TABLE middleware_counter (scope VARCHAR(40) PRIMARY KEY, last_issued_value BIGINT UNSIGNED NOT NULL) ENGINE=InnoDB""",
    """CREATE TABLE middleware_reservation (
       subject VARCHAR(64), request_key CHAR(36), request_hmac CHAR(64) NOT NULL,
       trade_number VARCHAR(128) NOT NULL UNIQUE, PRIMARY KEY(subject,request_key)) ENGINE=InnoDB""",
    """CREATE TABLE middleware_confirmation (
       confirmation_id CHAR(36) PRIMARY KEY, subject VARCHAR(64), audience VARCHAR(32),
       request_hmac CHAR(64), expires_at DATETIME(3), consumed_by CHAR(36) NULL) ENGINE=InnoDB""",
    """CREATE TABLE middleware_command_receipt_tab (
       acceptance_sequence BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
       acceptance_id CHAR(36) NOT NULL UNIQUE, subject VARCHAR(64) NOT NULL,
       audience VARCHAR(32) NOT NULL, request_key CHAR(36) NOT NULL,
       request_hmac CHAR(64) NOT NULL, root_reference VARCHAR(128) NOT NULL,
       accepted_projection JSON NOT NULL, location VARCHAR(512) NOT NULL,
       UNIQUE KEY original_key(subject,audience,request_key),
       KEY root_sequence(root_reference,acceptance_sequence)) ENGINE=InnoDB""",
    """CREATE TABLE middleware_file_task (
       task_id CHAR(36) PRIMARY KEY, object_key VARCHAR(256) NOT NULL,
       stage_version VARCHAR(256) NOT NULL, expected_hash CHAR(64) NOT NULL,
       expected_size BIGINT UNSIGNED NOT NULL, document_type_code INT NOT NULL DEFAULT 17,
       phase VARCHAR(24) NOT NULL,
       attempts INT NOT NULL DEFAULT 0, fencing_token INT NOT NULL DEFAULT 0,
       lease_until DATETIME(3) NULL, final_version VARCHAR(256) NULL,
       file_id BIGINT UNSIGNED NULL, last_error VARCHAR(64) NULL) ENGINE=InnoDB""",
    """CREATE TABLE middleware_signature_task (
       task_id CHAR(36) PRIMARY KEY, contract_id BIGINT UNSIGNED NOT NULL,
       revision_number INT UNSIGNED NOT NULL, state VARCHAR(32) NOT NULL,
       client_reference CHAR(36) NOT NULL UNIQUE) ENGINE=InnoDB""",
    """CREATE TABLE middleware_provider_notice (
       provider VARCHAR(32), event_id VARCHAR(64), body_hash CHAR(64) NOT NULL,
       task_id CHAR(36) NOT NULL, PRIMARY KEY(provider,event_id)) ENGINE=InnoDB""",
]


class Harness:
    def __init__(self, database):
        if not re.fullmatch(r"verify_steps_[a-f0-9]{12}", database):
            raise ValueError("Only explicitly isolated validation databases are allowed")
        self.database = database
        self.key_path = BASE / (database + ".key")
        self.key = self.key_path.read_bytes()

    def digest(self, value):
        return hmac.new(self.key, canonical(value).encode(), hashlib.sha256).hexdigest()

    def insert(self, cursor, table, values):
        cursor.execute("INSERT INTO `" + table + "` (" +
                       ",".join("`" + field + "`" for field in values) + ") VALUES (" +
                       ",".join(["%s"] * len(values)) + ")", tuple(values.values()))
        return cursor.lastrowid

    def reserve(self, key, subject="supplier", body=None, fail=False):
        digest = self.digest(body or {"purpose": "step-one"})
        with connect(self.database) as connection, connection.cursor() as cursor:
            connection.begin()
            try:
                cursor.execute("SELECT * FROM middleware_counter WHERE scope='trade' FOR UPDATE")
                counter = cursor.fetchone()
                cursor.execute("SELECT * FROM middleware_reservation WHERE subject=%s AND request_key=%s",
                               (subject, key))
                prior = cursor.fetchone()
                if prior:
                    if prior["request_hmac"] != digest:
                        raise Rejected("IDEMPOTENCY_CONFLICT")
                    connection.commit()
                    return prior["trade_number"]
                number = "VAL-" + str(counter["last_issued_value"] + 1).zfill(12)
                cursor.execute("UPDATE middleware_counter SET last_issued_value=last_issued_value+1 WHERE scope='trade'")
                self.insert(cursor, "middleware_reservation", {
                    "subject": subject, "request_key": key, "request_hmac": digest, "trade_number": number})
                if fail:
                    raise Rejected("INJECTED_RESERVATION_FAILURE")
                connection.commit()
                return number
            except (Rejected, pymysql.MySQLError):
                connection.rollback()
                raise

    def confirm(self, subject, audience, intent):
        identifier = str(uuid.uuid4())
        query(self.database, """INSERT INTO middleware_confirmation
              VALUES(%s,%s,%s,%s,UTC_TIMESTAMP(3)+INTERVAL 5 MINUTE,NULL)""",
              (identifier, subject, audience, self.digest(intent)))
        return identifier

    def command(self, subject, audience, key, number, version, action, body, confirmation, handler):
        intent = {"key": key, "root": number, "version": version, "action": action, "body": body}
        digest = self.digest(intent)
        with connect(self.database) as connection, connection.cursor() as cursor:
            connection.begin()
            try:
                # Fixed namespace lock also serializes commands before the trade root exists.
                cursor.execute("SELECT * FROM middleware_reservation WHERE trade_number=%s FOR UPDATE", (number,))
                if not cursor.fetchone() or subject not in ("supplier", "payer", "operator", "reviewer"):
                    raise Rejected("FORBIDDEN")
                cursor.execute("SELECT * FROM trade_record_tab WHERE trade_number=%s FOR UPDATE", (number,))
                trade = cursor.fetchone()
                cursor.execute("""SELECT * FROM middleware_command_receipt_tab
                               WHERE subject=%s AND audience=%s AND request_key=%s""", (subject, audience, key))
                prior = cursor.fetchone()
                if prior:
                    if prior["request_hmac"] != digest:
                        raise Rejected("IDEMPOTENCY_CONFLICT")
                    connection.commit()
                    return json.loads(prior["accepted_projection"])
                if action in ("submit", "approve", "return", "reopen", "evidence") and audience != "internal":
                    raise Rejected("FORBIDDEN")
                if action == "supplier" and subject != "supplier" or action == "payer" and subject != "payer":
                    raise Rejected("FORBIDDEN")
                if trade and trade["version"] != version:
                    raise Rejected("REVISION_CONFLICT")
                cursor.execute("SELECT *, expires_at>UTC_TIMESTAMP(3) AS fresh FROM middleware_confirmation "
                               "WHERE confirmation_id=%s FOR UPDATE", (confirmation,))
                proof = cursor.fetchone()
                if not proof or (proof["subject"], proof["audience"], proof["request_hmac"]) != (subject, audience, digest):
                    raise Rejected("CONFIRMATION_MISMATCH")
                if not proof["fresh"] or proof["consumed_by"]:
                    raise Rejected("CONFIRMATION_EXPIRED_OR_USED")
                result = handler(cursor, trade)
                accepted = str(uuid.uuid4())
                result["acceptanceId"] = accepted
                self.insert(cursor, "middleware_command_receipt_tab", {
                    "acceptance_id": accepted, "subject": subject, "audience": audience, "request_key": key,
                    "request_hmac": digest, "root_reference": number,
                    "accepted_projection": canonical(result), "location": "/validation/receipts/" + accepted})
                cursor.execute("UPDATE middleware_confirmation SET consumed_by=%s WHERE confirmation_id=%s",
                               (accepted, confirmation))
                connection.commit()
                return result
            except (Rejected, pymysql.MySQLError):
                connection.rollback()
                raise

    def run(self, number, action, handler, body=None, subject="operator", audience="internal", version=None):
        if version is None:
            rows = query(self.database, "SELECT version FROM trade_record_tab WHERE trade_number=%s", (number,))
            version = rows[0]["version"] if rows else 0
        key = str(uuid.uuid4())
        body = body or {}
        intent = {"key": key, "root": number, "version": version, "action": action, "body": body}
        confirmation = self.confirm(subject, audience, intent)
        result = self.command(subject, audience, key, number, version, action, body, confirmation, handler)
        return result, (subject, audience, key, number, version, action, body, confirmation, handler)

    def event(self, cursor, trade, code, before=None, after=None, payload=None, actor="operator"):
        event = "VE-" + uuid.uuid4().hex
        self.insert(cursor, "trade_event_tab", {
            "event_number": event, "trade_record_id": trade["id"], "revision_number": trade["revision_number"],
            "event_type_code": code, "from_trade_status_code": before, "to_trade_status_code": after,
            "actor_reference": actor, "reason_code": 1, "reason_text": "Synthetic integration validation",
            "event_payload": canonical(payload or {"payload_schema_version": 4}),
            "trace_id": event, "occurred_at": datetime.now(timezone.utc).replace(tzinfo=None)})
        return event

    def snapshot(self, cursor, trade, reason, event):
        cursor.execute("SELECT * FROM trade_participater_tab WHERE trade_record_id=%s ORDER BY party_role_code",
                       (trade["id"],))
        parties = [{key: value for key, value in row.items() if key in
                    ("party_role_code", "participant_sequence_number", "participant_information_json")}
                   for row in cursor.fetchall()]
        contents = {"goods": json.loads(trade["transaction_goods_items_json"]),
                    "documents": json.loads(trade["transaction_filing_document_references_json"]), "parties": parties}
        number = "VS-" + uuid.uuid4().hex
        self.insert(cursor, "trade_revision_tab", {
            "snapshot_number": number, "trade_number": trade["trade_number"],
            "revision_number": trade["revision_number"], "snapshot_reason_code": reason,
            "transaction_filing_snapshot_json": canonical(contents), "integrity_key_version": "local-test-only",
            "revision_content_hmac": self.digest(contents), "source_event_number": event})
        return number

    def filing(self, number, role, file_id, fail=False, supplier=None, payer=None):
        def execute(cursor, trade):
            if trade and trade["trade_status_code"] != 2:
                raise Rejected("TRADE_NOT_EDITABLE")
            if not trade:
                if role != 1:
                    raise Rejected("SUPPLIER_FIRST")
                cursor.execute("SELECT * FROM document_file_tab WHERE id=%s", (file_id,))
                if not cursor.fetchone():
                    raise Rejected("FILE_NOT_READY")
                identifier = self.insert(cursor, "trade_record_tab", {
                    "trade_number": number, "trade_status_code": 2, "revision_number": 1,
                    "approved_revision_number": 0, "transaction_goods_items_json": canonical(mapped_goods(supplier)),
                    "transaction_filing_document_references_json": canonical(supplier["materials"]),
                    "transaction_filing_source_and_version_json": "[]",
                    "transaction_filing_missing_information_json": "[]",
                    "creation_payload_hmac": self.digest({"test": number}),
                    "creation_payload_hmac_key_version": "local-test-only", "version": 1})
                cursor.execute("SELECT * FROM trade_record_tab WHERE id=%s", (identifier,))
                trade = cursor.fetchone()
                self.event(cursor, trade, 1, actor="supplier")
            else:
                cursor.execute("UPDATE trade_record_tab SET revision_number=revision_number+1,version=version+1 WHERE id=%s",
                               (trade["id"],))
                trade["revision_number"] += 1
            for party_role in ([1, 2, 3, 5, 6] if role == 1 else [4]):
                party, info = mapped_party(party_role, supplier, payer)
                cursor.execute("SELECT id FROM trade_participater_tab WHERE trade_record_id=%s AND party_role_code=%s",
                               (trade["id"], party_role))
                if cursor.fetchone():
                    cursor.execute("UPDATE trade_participater_tab SET participant_information_json=%s "
                                   "WHERE trade_record_id=%s AND party_role_code=%s",
                                   (canonical(info), trade["id"], party_role))
                else:
                    self.insert(cursor, "trade_participater_tab", {
                        "trade_record_id": trade["id"], "party_role_code": party_role,
                        "participant_sequence_number": 1, "legal_name": party["legalName"],
                        "identity_type_code": 1, "identity_number_cipher": b"NOT-A-REAL-IDENTITY",
                        "country_code": party["countryCode"], "registered_address": party["registeredAddress"],
                        "contact_name": party["contactName"], "contact_phone": party["contactPhone"],
                        "contact_email": party["contactEmail"], "participant_information_json": canonical(info)})
            self.event(cursor, trade, 3, actor="supplier" if role == 1 else "payer")
            if fail:
                raise Rejected("INJECTED_PARTIAL_WRITE")
            return {"tradeNumber": number, "revision": trade["revision_number"], "state": 2}
        return execute

    def transition(self, action, subject="operator"):
        def execute(cursor, trade):
            state = trade["trade_status_code"]
            if action == "submit":
                if state != 2:
                    raise Rejected("TRADE_NOT_REVIEWABLE")
                self.require_basis(cursor, trade)
                self.event(cursor, trade, 14, 2, 4)
                self.event(cursor, trade, 5, 4, 4)
                event = self.event(cursor, trade, 6, 4, 5)
                self.snapshot(cursor, trade, 1, event)
                target = 5
            elif action in ("return", "approve"):
                if state != 5 or subject != "reviewer":
                    raise Rejected("REVIEWER_NOT_INDEPENDENT")
                target = 3 if action == "return" else 8
                event = self.event(cursor, trade, 7 if target == 3 else 10, 5, target)
                if target == 8:
                    self.snapshot(cursor, trade, 2, event)
                    cursor.execute("UPDATE trade_record_tab SET approved_revision_number=revision_number WHERE id=%s",
                                   (trade["id"],))
            elif action in ("reopen", "evidence"):
                if action == "reopen" and state != 3 or action == "evidence" and state not in (2, 8):
                    raise Rejected("TRADE_NOT_REOPENABLE")
                trade["revision_number"] += 1
                cursor.execute("UPDATE trade_record_tab SET revision_number=revision_number+1 WHERE id=%s", (trade["id"],))
                if state in (3, 8):
                    event = self.event(cursor, trade, 15 if state == 3 else 13, state, 2)
                    if state == 8:
                        self.snapshot(cursor, trade, 3, event)
                if action == "evidence":
                    cursor.execute("UPDATE trade_record_tab SET transaction_filing_document_references_json="
                                   "JSON_ARRAY_APPEND(transaction_filing_document_references_json,'$',"
                                   "JSON_OBJECT('validation_evidence',%s)) WHERE id=%s",
                                   (str(uuid.uuid4()), trade["id"]))
                    self.event(cursor, trade, 3)
                target = 2
            else:
                raise ValueError(action)
            cursor.execute("UPDATE trade_record_tab SET trade_status_code=%s,version=version+1 WHERE id=%s",
                           (target, trade["id"]))
            return {"revision": trade["revision_number"], "state": target}
        return execute

    def require_basis(self, cursor, trade):
        cursor.execute("SELECT party_role_code,participant_information_json FROM trade_participater_tab "
                       "WHERE trade_record_id=%s", (trade["id"],))
        info = {row["party_role_code"]: json.loads(row["participant_information_json"]) for row in cursor.fetchall()}
        agent, broker = info.get(2, {}), info.get(6, {})
        if not agent.get("receipt_path") or not agent.get("payment_path") or agent.get("payment_branch_code") not in (1, 2):
            raise Rejected("REQUIRED_MATERIAL")
        if broker.get("currency_code") != "CNY" or not broker.get("pricing_basis") or Decimal(broker.get("quoted_amount", "0")) <= 0:
            raise Rejected("REQUIRED_MATERIAL")
        for name, purpose in (("customs_qualification_reference", 8), ("quotation_reference", 9)):
            ref = broker.get(name)
            if not ref:
                raise Rejected("REQUIRED_MATERIAL")
            cursor.execute("SELECT sha256,document_type_code,revision_status_code FROM document_file_tab "
                           "WHERE logical_file_number=%s AND revision_number=%s",
                           (ref["logical_file_number"], ref["revision_number"]))
            file = cursor.fetchone()
            if not file or (file["sha256"], file["document_type_code"], file["revision_status_code"]) != (ref["content_digest"], purpose, 2):
                raise Rejected("FILE_NOT_READY")


def mapped_goods(filing):
    return [{"item_sequence_number": item["itemSequenceNumber"], "product_name": item["productName"],
             "specification": item["specification"], "quantity": item["quantity"], "unit_code": item["unitCode"],
             "unit_price_amount": item["unitPrice"]["amount"], "amount": item["total"]["amount"],
             "currency_code": item["total"]["currencyCode"], "origin_country_code": item["originCountryCode"]}
            for item in filing["goods"]]


def mapped_party(role, supplier, payer):
    if role == 1:
        return supplier["supplier"], {"sales_document_numbers": [
            {"document_type_code": purpose, "document_number": supplier[field],
             **({"document_amount": supplier["contractTotal" if purpose == 1 else "invoiceTotal"]["amount"],
                 "currency_code": "CNY"} if purpose != 3 else {})}
            for purpose, field in [(1, "salesContractNumber"), (2, "invoiceNumber"), (3, "packingListNumber")]]}
    if role == 3:
        return supplier["consignee"]["party"], {"delivery_address": supplier["consignee"]["deliveryAddress"]}
    if role == 4:
        return payer["payer"], {"payer_relationship_code": 1, "payment_purpose": payer["paymentPurpose"],
                                "relationship_evidence_references": [], "payment_confirmations": []}
    field = {2: "exportAgent", 5: "logisticsProvider", 6: "customsBroker"}[role]
    info = {"agency_scope" if role == 2 else "service_scope": supplier[field]["serviceScope"],
            "agency_instructions" if role == 2 else "agreed_instructions": supplier[field]["agreedInstructions"]}
    if role == 2 and supplier[field].get("exportAgentDetails"):
        details = supplier[field]["exportAgentDetails"]
        info.update(receipt_path=details["receiptPath"], payment_path=details["paymentPath"],
                    payment_branch_code=details["paymentBranchCode"], currency_code="CNY")
    if role == 6 and supplier[field].get("customsDetails"):
        details = supplier[field]["customsDetails"]
        info.update(customs_qualification_reference=mapped_ref(details["qualification"], 8),
                    quotation_reference=mapped_ref(details["quotation"], 9),
                    quoted_amount=details["quotedAmount"]["amount"],
                    currency_code=details["quotedAmount"]["currencyCode"], pricing_basis=details["pricingBasis"])
    return supplier[field]["party"], info


def mapped_ref(ref, purpose):
    return {"document_purpose_code": purpose, "logical_file_number": ref["logicalFileNumber"],
            "revision_number": ref["revisionNumber"], "content_digest": ref["sha256"]}


def create_database(database):
    key = BASE / (database + ".key")
    with key.open("xb") as target:
        os.chmod(key, 0o600)
        target.write(secrets.token_bytes(32))
    schema = (ROOT / "doc/sql/domain/schema.sql").read_text()
    with connect() as connection, connection.cursor() as cursor:
        cursor.execute("CREATE DATABASE `" + database + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin")
        cursor.execute("USE `" + database + "`")
        for name in CORE:
            statement = re.search(r"CREATE TABLE `" + name + r"` \(.*?\) ENGINE=.*?;", schema, re.S)
            if not statement:
                raise AssertionError("Missing current DDL " + name)
            cursor.execute(statement[0])
        for statement in re.findall(r"CREATE TRIGGER .*?;", schema):
            if any("ON `" + name + "`" in statement for name in ("trade_revision_tab", "trade_event_tab")):
                cursor.execute(statement)
        for statement in MIDDLEWARE:
            cursor.execute(statement)
        cursor.execute("INSERT INTO middleware_counter VALUES('trade',0)")


def file_worker(database, task_id, fail_after_put=False):
    harness = Harness(database)
    credentials = json.loads((BASE / "s3-client.json").read_text())
    storage = client(credentials["access_key"], credentials["secret_key"])
    with connect(database) as connection, connection.cursor() as cursor:
        connection.begin()
        cursor.execute("SELECT * FROM middleware_file_task WHERE task_id=%s FOR UPDATE", (task_id,))
        task = cursor.fetchone()
        if task["phase"] == "done":
            connection.commit()
            return task["file_id"]
        if task["phase"] in ("rejected", "manual_action"):
            raise Rejected("TASK_NOT_RETRYABLE")
        if task["attempts"] >= 8:
            cursor.execute("UPDATE middleware_file_task SET phase='manual_action',last_error='RETRY_EXHAUSTED' WHERE task_id=%s",
                           (task_id,))
            connection.commit()
            raise Rejected("RETRY_EXHAUSTED")
        cursor.execute("""UPDATE middleware_file_task SET attempts=attempts+1,fencing_token=fencing_token+1,
                       lease_until=UTC_TIMESTAMP(3)+INTERVAL 60 SECOND,phase='processing'
                       WHERE task_id=%s AND (lease_until IS NULL OR lease_until<UTC_TIMESTAMP(3))""", (task_id,))
        if cursor.rowcount != 1:
            raise Rejected("LEASE_BUSY")
        token = task["fencing_token"] + 1
        connection.commit()
    data = storage.get_object(Bucket=BUCKETS[0], Key=task["object_key"], VersionId=task["stage_version"])["Body"].read()
    if hashlib.sha256(data).hexdigest() != task["expected_hash"] or len(data) != task["expected_size"]:
        query(database, "UPDATE middleware_file_task SET phase='rejected',last_error='DIGEST_MISMATCH',lease_until=NULL "
              "WHERE task_id=%s AND fencing_token=%s", (task_id, token))
        raise Rejected("DIGEST_MISMATCH")
    scan_database_fresh()
    if not scan(data).endswith(": OK"):
        query(database, "UPDATE middleware_file_task SET phase='rejected',last_error='SCAN_REJECTED',lease_until=NULL "
              "WHERE task_id=%s AND fencing_token=%s", (task_id, token))
        raise Rejected("SCAN_REJECTED")
    try:
        result = storage.put_object(Bucket=BUCKETS[1], Key=task["object_key"], Body=data,
                                    IfNoneMatch="*", Metadata={"sha256": task["expected_hash"]})
        version = result["VersionId"]
    except ClientError as error:
        if error.response["Error"]["Code"] not in ("PreconditionFailed", "ConditionalRequestConflict"):
            raise
        head = storage.head_object(Bucket=BUCKETS[1], Key=task["object_key"])
        version = head["VersionId"]
    actual = storage.get_object(Bucket=BUCKETS[1], Key=task["object_key"], VersionId=version)["Body"].read()
    if actual != data:
        raise Rejected("FINAL_OBJECT_CONFLICT")
    if fail_after_put:
        # Process death leaves the durable lease; caller explicitly advances expiry for this test.
        os._exit(73)
    with connect(database) as connection, connection.cursor() as cursor:
        connection.begin()
        cursor.execute("SELECT * FROM middleware_file_task WHERE task_id=%s FOR UPDATE", (task_id,))
        current = cursor.fetchone()
        if current["fencing_token"] != token or current["phase"] != "processing":
            raise Rejected("STALE_FENCE")
        file_id = harness.insert(cursor, "document_file_tab", {
            "logical_file_number": "VF-" + task_id.replace("-", ""), "revision_number": 1,
            "revision_status_code": 2, "display_name": "Synthetic local integration material",
            "document_type_code": task["document_type_code"],
            "storage_path": BUCKETS[1] + "/" + task["object_key"] + "?versionId=" + version,
            "sha256": task["expected_hash"], "size_bytes": len(data), "media_type": "text/html",
            "access_scope_json": canonical({"validationOnly": True, "owner": "supplier", "versionId": version})})
        cursor.execute("UPDATE middleware_file_task SET phase='done',file_id=%s,final_version=%s,lease_until=NULL "
                       "WHERE task_id=%s AND fencing_token=%s", (file_id, version, task_id, token))
        connection.commit()
        return file_id


def main(output):
    before = application_baseline()
    database = "verify_steps_" + secrets.token_hex(6)
    print(json.dumps({"isolatedValidationDatabase": database}), flush=True)
    create_database(database)
    harness = Harness(database)
    checks = []

    def check(name, condition):
        if not condition:
            raise AssertionError(name)
        checks.append(name)

    def rejects(name, function, code):
        try:
            function()
        except Rejected as error:
            check(name, str(error) == code)
        else:
            raise AssertionError(name + ": expected rejection")

    credentials = json.loads((BASE / "s3-client.json").read_text())
    storage = client(credentials["access_key"], credentials["secret_key"])
    admin = client(*root_credentials())
    prefix = "_flow-check/" + database + "/"
    supplier = json.loads((ROOT / "doc/examples/step1/supplier-filing.json").read_text())
    payer = json.loads((ROOT / "doc/examples/step1/payer-filing.json").read_text())

    def upload(data, purpose=17, wrong_hash=False):
        identifier = str(uuid.uuid4())
        object_key = prefix + identifier
        version = storage.put_object(Bucket=BUCKETS[0], Key=object_key, Body=data, IfNoneMatch="*")["VersionId"]
        query(database, """INSERT INTO middleware_file_task
              (task_id,object_key,stage_version,expected_hash,expected_size,document_type_code,phase)
              VALUES(%s,%s,%s,%s,%s,%s,'pending')""",
              (identifier, object_key, version, "0" * 64 if wrong_hash else hashlib.sha256(data).hexdigest(), len(data), purpose))
        return identifier, object_key

    try:
        key = str(uuid.uuid4())
        with ThreadPoolExecutor(max_workers=6) as pool:
            numbers = list(pool.map(lambda _: harness.reserve(key), range(6)))
        check("six concurrent same-key reservations return one number", len(set(numbers)) == 1)
        number = numbers[0]
        rejects("same-key different-content reservation rejected",
                lambda: harness.reserve(key, body={"changed": True}), "IDEMPOTENCY_CONFLICT")
        rejects("failed reservation rolls back counter and ownership",
                lambda: harness.reserve(str(uuid.uuid4()), fail=True), "INJECTED_RESERVATION_FAILURE")
        check("counter has no increments from rejected requests",
              query(database, "SELECT last_issued_value FROM middleware_counter")[0]["last_issued_value"] == 1)
        with ThreadPoolExecutor(max_workers=3) as pool:
            distinct = list(pool.map(lambda _: harness.reserve(str(uuid.uuid4())), range(3)))
        check("three independent reservation keys have unique numbers", len(set(distinct)) == 3)

        data = (ROOT / "doc/examples/step1/material-bundle.html").read_bytes()
        task, object_key = upload(data)
        process = subprocess.run([sys.executable, __file__, "--worker", database, task, "--crash-after-put"],
                                 capture_output=True, text=True, timeout=45)
        check("worker process actually terminates after final S3 write", process.returncode == 73)
        check("object-write crash creates no premature file metadata",
              query(database, "SELECT COUNT(*) AS n FROM document_file_tab")[0]["n"] == 0)
        query(database, "UPDATE middleware_file_task SET lease_until=UTC_TIMESTAMP(3)-INTERVAL 1 SECOND WHERE task_id=%s", (task,))
        process = subprocess.run([sys.executable, __file__, "--worker", database, task],
                                 capture_output=True, text=True, timeout=45)
        if process.returncode:
            raise RuntimeError("Recovery worker failed: " + process.stderr)
        final = query(database, "SELECT * FROM middleware_file_task WHERE task_id=%s", (task,))[0]
        file_id = final["file_id"]
        check("new process resumes exact object and commits one file", final["phase"] == "done" and final["attempts"] == 2)
        check("completed task replay creates no duplicate metadata", file_worker(database, task) == file_id)
        versions = admin.list_object_versions(Bucket=BUCKETS[1], Prefix=object_key).get("Versions", [])
        check("conditional recovery did not create a second final version", len(versions) == 1)
        with connect(database) as connection, connection.cursor() as cursor:
            cursor.execute("UPDATE middleware_file_task SET last_error='STALE_WORKER' "
                           "WHERE task_id=%s AND fencing_token=%s", (task, final["fencing_token"] - 1))
            check("stale fencing token cannot finalize", cursor.rowcount == 0)
        corrupt, _ = upload(data, wrong_hash=True)
        rejects("actual stored bytes with wrong declared hash are rejected",
                lambda: file_worker(database, corrupt), "DIGEST_MISMATCH")
        inert_test = b"X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"
        infected, _ = upload(inert_test)
        rejects("real antivirus finding cannot create a referencable file",
                lambda: file_worker(database, infected), "SCAN_REJECTED")
        check("rejected uploads did not add file metadata",
              query(database, "SELECT COUNT(*) AS n FROM document_file_tab")[0]["n"] == 1)
        rejects("permanently rejected upload is not auto-retried",
                lambda: file_worker(database, infected), "TASK_NOT_RETRYABLE")
        exhausted, _ = upload(data)
        query(database, "UPDATE middleware_file_task SET attempts=8 WHERE task_id=%s", (exhausted,))
        rejects("persistent retry budget moves to explicit manual action",
                lambda: file_worker(database, exhausted), "RETRY_EXHAUSTED")
        material = query(database, "SELECT logical_file_number,sha256 FROM document_file_tab WHERE id=%s", (file_id,))[0]
        for reference in supplier["materials"]:
            check("each material anchor binds actual uploaded package hash", reference["sha256"] == material["sha256"])
            reference["logicalFileNumber"] = material["logical_file_number"]
        filing = lambda role, target=number, fail=False: harness.filing(
            target, role, file_id, fail, supplier=supplier, payer=payer)

        rollback_number = distinct[0]
        rejects("partial supplier creation rolls back all core rows",
                lambda: harness.run(rollback_number, "supplier", filing(1, rollback_number, True),
                                    subject="supplier", audience="external"), "INJECTED_PARTIAL_WRITE")
        check("no trade or orphan parties after failure",
              query(database, "SELECT COUNT(*) AS n FROM trade_record_tab")[0]["n"] == 0 and
              query(database, "SELECT COUNT(*) AS n FROM trade_participater_tab")[0]["n"] == 0)
        check("failed command does not consume confirmation",
              query(database, "SELECT COUNT(*) AS n FROM middleware_confirmation WHERE consumed_by IS NOT NULL")[0]["n"] == 0)
        accepted, args = harness.run(number, "supplier", filing(1),
                                     subject="supplier", audience="external")
        with ThreadPoolExecutor(max_workers=6) as pool:
            replayed = list(pool.map(lambda _: harness.command(*args), range(6)))
        check("concurrent response-loss recovery returns frozen original receipt", all(item == accepted for item in replayed))
        check("only one trade and five supplier-collected roles created",
              query(database, "SELECT COUNT(*) AS n FROM trade_record_tab")[0]["n"] == 1 and
              query(database, "SELECT COUNT(*) AS n FROM trade_participater_tab")[0]["n"] == 5)
        harness.run(number, "payer", filing(4), subject="payer", audience="external")
        harness.run(number, "supplier", filing(1), subject="supplier", audience="external")
        check("payer and supplier updates preserve six roles", query(database, "SELECT COUNT(*) AS n FROM trade_participater_tab")[0]["n"] == 6)
        saved = query(database, "SELECT transaction_goods_items_json FROM trade_record_tab WHERE trade_number=%s", (number,))[0]
        check("actual SQL preserves CNY decimal-string goods", json.loads(saved["transaction_goods_items_json"])[0]["amount"] == "12500.00")
        query(database, "UPDATE middleware_confirmation SET expires_at=UTC_TIMESTAMP(3)-INTERVAL 1 SECOND")
        check("original acceptance survives expired confirmation and changed version", harness.command(*args) == accepted)
        changed = list(args)
        changed[6] = {"different": True}
        rejects("accepted key cannot be reused with another body", lambda: harness.command(*changed), "IDEMPOTENCY_CONFLICT")
        current_version = query(database, "SELECT version FROM trade_record_tab WHERE trade_number=%s", (number,))[0]["version"]
        barrier = threading.Barrier(2)

        def race_edit(_):
            barrier.wait(timeout=5)
            try:
                harness.run(number, "supplier", filing(1), subject="supplier", audience="external", version=current_version)
                return "accepted"
            except Rejected as error:
                return str(error)
        with ThreadPoolExecutor(max_workers=2) as pool:
            competing = list(pool.map(race_edit, range(2)))
        check("same-version concurrent edits commit once and reject stale writer",
              sorted(competing) == ["REVISION_CONFLICT", "accepted"])
        with connect(database) as blocker, blocker.cursor() as cursor:
            blocker.begin()
            cursor.execute("SELECT id FROM trade_record_tab WHERE trade_number=%s FOR UPDATE", (number,))
            cursor.fetchone()
            try:
                query(database, "SELECT id FROM trade_record_tab WHERE trade_number=%s FOR UPDATE", (number,))
            except pymysql.err.OperationalError as error:
                check("contended real root lock respects one-second server wait limit", error.args[0] == 1205)
            else:
                raise AssertionError("Contended lock unexpectedly succeeded")
            finally:
                blocker.rollback()

        rejects("initial incomplete step-one filing cannot be submitted as signing basis",
                lambda: harness.run(number, "submit", harness.transition("submit")), "REQUIRED_MATERIAL")
        basis = json.loads((ROOT / "doc/examples/step2/basis-supplier-replacement.json").read_text())
        supplier["exportAgent"]["exportAgentDetails"] = basis["exportAgent"]["exportAgentDetails"]
        supplier["customsBroker"]["customsDetails"] = basis["customsBroker"]["customsDetails"]
        for name, purpose in (("qualification", 8), ("quotation", 9)):
            basis_task, _ = upload((ROOT / ("doc/examples/step2/" + name + ".html")).read_bytes(), purpose=purpose)
            basis_file = file_worker(database, basis_task)
            record = query(database, "SELECT * FROM document_file_tab WHERE id=%s", (basis_file,))[0]
            supplier["customsBroker"]["customsDetails"][name].update(
                logicalFileNumber=record["logical_file_number"], revisionNumber=record["revision_number"], sha256=record["sha256"])
        harness.run(number, "supplier", filing(1), subject="supplier", audience="external")
        harness.run(number, "submit", harness.transition("submit"))
        rejects("external audience cannot perform internal review",
                lambda: harness.run(number, "approve", harness.transition("approve", "reviewer"),
                                    subject="reviewer", audience="external"), "FORBIDDEN")
        rejects("submitter cannot approve its own trade",
                lambda: harness.run(number, "approve", harness.transition("approve")), "REVIEWER_NOT_INDEPENDENT")
        harness.run(number, "return", harness.transition("return", "reviewer"), subject="reviewer")
        harness.run(number, "reopen", harness.transition("reopen"))
        harness.run(number, "submit", harness.transition("submit"))
        review_version = query(database, "SELECT version FROM trade_record_tab WHERE trade_number=%s", (number,))[0]["version"]
        review_barrier = threading.Barrier(2)

        def race_review(_):
            review_barrier.wait(timeout=5)
            try:
                harness.run(number, "approve", harness.transition("approve", "reviewer"),
                            subject="reviewer", version=review_version)
                return "accepted"
            except Rejected as error:
                return str(error)
        with ThreadPoolExecutor(max_workers=2) as pool:
            decisions = list(pool.map(race_review, range(2)))
        check("two current-version approvals produce one approval snapshot",
              sorted(decisions) == ["REVISION_CONFLICT", "accepted"])
        snapshots = query(database, "SELECT snapshot_number,revision_number,snapshot_reason_code,revision_content_hmac "
                          "FROM trade_revision_tab ORDER BY id")
        check("returned trade resubmits under a new revision without unique-key collision",
              len([row for row in snapshots if row["snapshot_reason_code"] == 1]) == 2)
        approved = next(row for row in snapshots if row["snapshot_reason_code"] == 2)
        approved_before = canonical(approved)
        for _ in range(3):
            harness.run(number, "evidence", harness.transition("evidence"))
        check("three evidence additions share one correction baseline",
              query(database, "SELECT COUNT(*) AS n FROM trade_revision_tab WHERE snapshot_reason_code=3")[0]["n"] == 1)
        harness.run(number, "submit", harness.transition("submit"))
        harness.run(number, "approve", harness.transition("approve", "reviewer"), subject="reviewer")
        check("original approved snapshot is unchanged", canonical(query(
            database, "SELECT snapshot_number,revision_number,snapshot_reason_code,revision_content_hmac "
            "FROM trade_revision_tab WHERE snapshot_number=%s", (approved["snapshot_number"],))[0]) == approved_before)
        try:
            query(database, "UPDATE trade_revision_tab SET revision_content_hmac=%s WHERE snapshot_number=%s",
                  ("0" * 64, approved["snapshot_number"]))
        except pymysql.err.OperationalError as error:
            check("real append-only trigger blocks snapshot overwrite", error.args[0] == 1644)
        else:
            raise AssertionError("Append-only guard did not execute")
        review_task, _ = upload((ROOT / "doc/examples/step2/review-document.html").read_bytes(), purpose=10)
        review_file = file_worker(database, review_task)
        contract_checks(harness, number, review_file, approved["snapshot_number"], check, rejects)
        semantic = subprocess.run(["node", str(ROOT / "doc/sql/step2/verify.cjs")],
                                  check=True, capture_output=True, text=True)
        check("documented step-two semantic counterexamples pass", json.loads(semantic.stdout)["oldVersionAndDualEffectiveBlocked"])
        check("existing export_trade table counts unchanged", application_baseline() == before)
    finally:
        # Only this run's randomly named object versions; never sweep business objects.
        for bucket in BUCKETS:
            response = admin.list_object_versions(Bucket=bucket, Prefix=prefix)
            for item in response.get("Versions", []) + response.get("DeleteMarkers", []):
                admin.delete_object(Bucket=bucket, Key=item["Key"], VersionId=item["VersionId"])
    report = {"validationOnly": True, "database": database, "coreTables": CORE,
              "checksPassed": len(checks), "checks": checks, "existingBusinessDataUntouched": True,
              "actualDependencies": ["MySQL", "RustFS S3", "ClamAV"],
              "finishedAt": datetime.now(timezone.utc).isoformat(),
              "harnessCanonicalization": "Python sorted-key JSON for synthetic commands; not REST typed-JSON C14N",
              "recoveryInvocation": "separate manually launched worker process; SQL-forced lease expiry; not an automatic scheduler",
              "notProven": ["production HTTP/authentication/confirmation", "actual e-signature/CA/customs",
                            "XXL-JOB business executor", "production crash durability or backup restore",
                            "full business JSON mapping and all lifecycle paths",
                            "production two-second transaction wall-clock enforcement or automatic backoff scheduling"],
              "syntheticObjectsCleaned": True, "isolatedDatabaseRetained": True,
              "objectReferencesInRetainedTestRows": "not dereferenceable after deliberate test-object cleanup",
              "mysqlPrivilegeBoundary": "private administrator connection restricted by harness to new random schema; production app grants not tested"}
    destination = Path(output)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"database": database, "checksPassed": len(checks), "report": str(destination)}))


def contract_checks(harness, number, file_id, snapshot, check, rejects):
    database = harness.database
    with connect(database) as connection, connection.cursor() as cursor:
        identifier = harness.insert(cursor, "contract_record_tab", {
            "contract_number": "VALIDATION-CONTRACT", "contract_scope_code": 1,
            "document_type_code": 10, "trade_number": number, "current_revision_number": 1})
        harness.insert(cursor, "contract_revision_tab", {
                "contract_record_id": identifier, "revision_number": 1, "trade_snapshot_number": snapshot,
                "party_references_json": "[]", "review_file_revision_id": file_id,
                "contract_revision_status_code": 1, "lifecycle_events_json": "[]",
                "effective_from": "2026-10-25", "effective_to": "2026-10-26"})

    def contract_action(action, actor="supplier"):
        def execute(cursor, trade):
            cursor.execute("SELECT * FROM contract_record_tab WHERE id=%s FOR UPDATE", (identifier,))
            contract = cursor.fetchone()
            version = contract["current_revision_number"]
            cursor.execute("SELECT * FROM contract_revision_tab WHERE contract_record_id=%s AND revision_number=%s FOR UPDATE",
                           (identifier, version))
            revision = cursor.fetchone()
            status = revision["contract_revision_status_code"]
            if action == "revise":
                if status != 3:
                    raise Rejected("CONTRACT_STATE_CONFLICT")
                version += 1
                harness.insert(cursor, "contract_revision_tab", {
                    "contract_record_id": identifier, "revision_number": version, "trade_snapshot_number": snapshot,
                    "party_references_json": "[]", "review_file_revision_id": file_id,
                    "contract_revision_status_code": 1, "lifecycle_events_json": "[]",
                    "effective_from": "2026-10-25", "effective_to": "2026-10-26"})
                cursor.execute("UPDATE contract_record_tab SET current_revision_number=%s WHERE id=%s", (version, identifier))
                return {"contract": "VALIDATION-CONTRACT", "revision": version, "state": 1}
            if action == "submit" and status == 1:
                target, event_type = 2, "ContractSubmitted"
            elif action in ("return", "approve") and status == 2:
                if actor != "reviewer":
                    raise Rejected("REVIEWER_NOT_INDEPENDENT")
                target = 3 if action == "return" else 4
                event_type = "ContractReviewReturned" if target == 3 else "ContractReviewPassed"
                cursor.execute("UPDATE contract_revision_tab SET review_snapshot_json=%s WHERE id=%s",
                               (canonical({"reviewer_reference": actor, "review_result_code": 2 if target == 3 else 1,
                                           "reviewed_at": datetime.now(timezone.utc).isoformat(),
                                           "rule_version": "VALIDATION-ONLY", "comments": "Synthetic review explanation"}),
                                revision["id"]))
            else:
                raise Rejected("CONTRACT_STATE_CONFLICT")
            event = {"event_number": "VC-" + uuid.uuid4().hex, "event_type": event_type,
                     "occurred_at": datetime.now(timezone.utc).isoformat(), "actor_reference": actor,
                     "request_hash": harness.digest({"action": action, "revision": version}),
                     "from_status_code": status, "to_status_code": target, "evidence_references": []}
            cursor.execute("UPDATE contract_revision_tab SET contract_revision_status_code=%s,"
                           "lifecycle_events_json=JSON_ARRAY_APPEND(lifecycle_events_json,'$',CAST(%s AS JSON)) WHERE id=%s",
                           (target, canonical(event), revision["id"]))
            return {"contract": "VALIDATION-CONTRACT", "revision": version, "state": target}
        return execute

    submitted, submit_args = harness.run(number, "contract-submit", contract_action("submit"),
                                         subject="supplier", audience="external")
    rejects("contract submitter cannot self-review",
            lambda: harness.run(number, "contract-review", contract_action("approve")), "REVIEWER_NOT_INDEPENDENT")
    harness.run(number, "contract-return", contract_action("return", "reviewer"), subject="reviewer")
    check("supplier can read persisted contract return comments", bool(json.loads(query(
        database, "SELECT review_snapshot_json FROM contract_revision_tab WHERE contract_record_id=%s AND revision_number=1",
        (identifier,))[0]["review_snapshot_json"])["comments"]))
    check("contract command replay freezes original result after state changes", harness.command(*submit_args) == submitted)
    harness.run(number, "contract-revise", contract_action("revise"), subject="supplier", audience="external")
    harness.run(number, "contract-submit", contract_action("submit"), subject="supplier", audience="external")
    harness.run(number, "contract-review", contract_action("approve", "reviewer"), subject="reviewer")
    check("contract correction retains returned version and creates approved new working version",
          [row["contract_revision_status_code"] for row in query(
              database, "SELECT contract_revision_status_code FROM contract_revision_tab WHERE contract_record_id=%s ORDER BY revision_number",
              (identifier,))] == [3, 4])
    with connect(database) as connection, connection.cursor() as cursor:
        task = str(uuid.uuid4())
        harness.insert(cursor, "middleware_signature_task", {
            "task_id": task, "contract_id": identifier, "revision_number": 2,
            "state": "dispatch_unknown", "client_reference": str(uuid.uuid4())})

    def sign(version):
        def execute(cursor, trade):
            cursor.execute("SELECT * FROM contract_record_tab WHERE id=%s FOR UPDATE", (identifier,))
            contract = cursor.fetchone()
            cursor.execute("SELECT * FROM contract_revision_tab WHERE contract_record_id=%s AND revision_number=%s FOR UPDATE",
                           (identifier, version))
            revision = cursor.fetchone()
            cursor.execute("SELECT * FROM middleware_signature_task WHERE task_id=%s FOR UPDATE", (task,))
            integration = cursor.fetchone()
            if contract["current_revision_number"] != version:
                raise Rejected("CONTRACT_STATE_CONFLICT")
            if integration["state"] in ("pending_dispatch", "dispatch_unknown", "awaiting_signers"):
                raise Rejected("SIGNATURE_IN_PROGRESS")
            if revision["contract_revision_status_code"] != 4:
                raise Rejected("CONTRACT_STATE_CONFLICT")
            return {"state": "pending_dispatch"}
        return execute

    rejects("old noncurrent revision cannot start signing", lambda: harness.run(number, "sign", sign(1)), "CONTRACT_STATE_CONFLICT")
    rejects("unknown signing outcome cannot start a second task", lambda: harness.run(number, "sign", sign(2)), "SIGNATURE_IN_PROGRESS")
    provider_body = {"task": task, "reportedState": "completed"}
    digest = harness.digest(provider_body)
    query(database, "INSERT INTO middleware_provider_notice VALUES('synthetic-provider','event-1',%s,%s)", (digest, task))
    try:
        query(database, "INSERT INTO middleware_provider_notice VALUES('synthetic-provider','event-1',%s,%s)", (digest, task))
    except pymysql.err.IntegrityError as error:
        check("provider event has real database unique deduplication", error.args[0] == 1062)
    check("received notification never makes a contract signed",
          all(row["contract_revision_status_code"] not in (5, 6) for row in query(
              database, "SELECT contract_revision_status_code FROM contract_revision_tab")))
    # No synthetic signature is accepted: activation must fail without verified archive.
    def activate(cursor, trade):
        cursor.execute("SELECT * FROM contract_record_tab WHERE id=%s FOR UPDATE", (identifier,))
        cursor.fetchone()
        cursor.execute("SELECT * FROM contract_revision_tab WHERE contract_record_id=%s AND revision_number=2 FOR UPDATE",
                       (identifier,))
        revision = cursor.fetchone()
        if revision["contract_revision_status_code"] != 5 or revision["signed_file_revision_id"] is None:
            raise Rejected("SIGNATURE_EVIDENCE_INVALID")
        raise AssertionError("Unexpected real signature in isolated fixture")
    rejects("activation fails closed without real signed archive",
            lambda: harness.run(number, "activate", activate), "SIGNATURE_EVIDENCE_INVALID")
    check("actual SQL DATE includes the last agreed day", query(
        database, "SELECT effective_from<=DATE('2026-10-26') AND effective_to>=DATE('2026-10-26') AS included "
        "FROM contract_revision_tab LIMIT 1")[0]["included"] == 1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output")
    parser.add_argument("--worker", nargs=2, metavar=("DATABASE", "TASK"))
    parser.add_argument("--crash-after-put", action="store_true")
    options = parser.parse_args()
    if options.worker:
        file_worker(*options.worker, fail_after_put=options.crash_after_put)
    elif options.output:
        main(options.output)
    else:
        parser.error("--output is required; existing databases are never reused")
