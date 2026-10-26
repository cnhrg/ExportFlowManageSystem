"""Actual isolated customs entities and S3/ClamAV; not production handlers or official success."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import copy
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
import subprocess
import sys
import uuid

import pymysql
from botocore.exceptions import ClientError
from s3 import BASE, BUCKETS, client, root_credentials
from verify_antivirus_support import scan, scan_database_fresh

ROOT = Path(__file__).resolve().parents[2]
sys.dont_write_bytecode = True
sys.path.insert(0, str(ROOT / "doc/sql/step4"))
from customs_guards import (Rejected, content_digest, content_snapshot, exact_version, file_snapshot, independent,
                            official_gate, recipient, validate_draft)

shared = importlib.import_module("verify-step-flows")
connect, query, canonical = shared.connect, shared.query, shared.canonical
CORE = ["trade_record_tab", "trade_revision_tab", "trade_event_tab", "logistics_shipment_tab",
        "logistics_shipment_item_tab", "document_file_tab", "customs_declaration_tab",
        "customs_declaration_revision_tab", "customs_declaration_item_tab",
        "customs_filing_request_tab", "customs_event_tab"]
TRADE, SHIPMENT = "SYNTHETIC-S4-TRADE", "SHP-S4-SYNTHETIC"


def insert(cursor, table, values):
    cursor.execute("INSERT INTO `" + table + "` (" + ",".join("`" + key + "`" for key in values) +
                   ") VALUES (" + ",".join(["%s"] * len(values)) + ")", tuple(values.values()))
    return cursor.lastrowid


def isolated(database):
    if not re.fullmatch(r"verify_customs_[a-f0-9]{12}", database):
        raise ValueError("Only this step's explicitly isolated databases are allowed")


def source_triggers(ddl):
    for match in re.finditer(r"CREATE TRIGGER `[^`]+`[\s\S]*?(?:END\$\$|;(?=\n|$))", ddl):
        statement = match.group()
        if any("ON `" + table + "`" in statement for table in CORE):
            yield statement[:-2] if statement.endswith("$$") else statement


class Customs:
    def __init__(self, database, secret=None):
        isolated(database)
        self.database, self.secret, self.operation_evidence = database, secret or secrets.token_bytes(32), None

    def digest(self, value):
        return hmac.new(self.secret, canonical(value).encode(), hashlib.sha256).hexdigest()

    def tag(self, number):
        rows = query(self.database, "SELECT version,content_hash FROM customs_declaration_tab WHERE declaration_number=%s", (number,))
        return self.root_tag(rows[0]) if rows else "plan-1"

    @staticmethod
    def root_tag(root):
        return "v" + str(root["version"]) + "-" + root["content_hash"][:12]

    def intent(self, action, number, body, expected, key, subject, audience):
        return {"action": action, "number": number, "body": body, "tag": expected, "key": key,
                "subject": subject, "audience": audience}

    def confirm(self, action, number, body, expected, key, subject, audience=None):
        audience = audience or ("internal" if action in ("review", "verify") else "external")
        token = str(uuid.uuid4())
        digest = self.digest(self.intent(action, number, body, expected, key, subject, audience))
        query(self.database, "INSERT INTO s4_confirmation VALUES(%s,%s,%s,%s,UTC_TIMESTAMP(3)+INTERVAL 5 MINUTE,NULL)",
              (token, subject, audience, digest))
        return token

    def events(self, cursor, number, kind=None, revision=None):
        cursor.execute("SELECT * FROM customs_event_tab WHERE declaration_number=%s ORDER BY id FOR UPDATE", (number,))
        rows = cursor.fetchall()
        return [row for row in rows if (kind is None or row["event_type_code"] == kind) and
                (revision is None or row["declaration_revision_number"] == revision)]

    @staticmethod
    def payload(event):
        return json.loads(event["event_payload_json"])

    def event(self, cursor, number, revision, kind, payload, subject, result=1):
        event = "S4E-" + uuid.uuid4().hex
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        occurred = datetime.fromisoformat(payload["occurredAt"].replace("Z", "+00:00")).replace(tzinfo=None) if kind == 17 else now
        cursor.execute("SELECT content_hash FROM customs_declaration_revision_tab WHERE declaration_number=%s AND revision_number=%s",
                       (number, revision))
        content_hash = cursor.fetchone()["content_hash"]
        closed = {"schema_version": 1, "content_hash": content_hash, "operation_evidence_reference": self.operation_evidence}
        if kind == 2:
            closed["comments"] = payload["reason"]
        elif kind in (3, 4, 5):
            closed.update(reviewer_reference=subject, reviewed_revision_number=revision,
                          comments=payload.get("reason", ""), review_submission_event_number=payload.get("submissionEventNumber", event))
        elif kind == 6:
            closed.update(confirmation_document=file_snapshot(payload["writtenEvidence"][0]),
                          authority_reference=payload["authorityReference"])
        elif kind == 7:
            closed.update(request_number=payload["requestNumber"], execution_status=1)
        elif kind == 17:
            closed.update(request_number=payload.get("requestNumber"), source_namespace="SYNTHETIC-NOT-A-TRUSTED-CHANNEL",
                          authority_reference=payload.get("externalReferenceNumber"), verified_by=None,
                          evidence_references=[file_snapshot(file) for file in payload["files"]],
                          claimed_external_event_key=payload.get("sourceEventKey"),
                          claimed_event_type_code=payload["claimedEventTypeCode"])
        elif kind == 18:
            cursor.execute("SELECT * FROM customs_event_tab WHERE event_number=%s", (payload["evidenceEventNumber"],))
            original = self.payload(cursor.fetchone())
            closed.update({key: original[key] for key in ("request_number", "source_namespace", "authority_reference", "evidence_references",
                                                         "claimed_external_event_key", "claimed_event_type_code")})
            closed.update(verified_by=subject, evidence_event_number=payload["evidenceEventNumber"],
                          comments=payload.get("reason", ""), decision_code=3,
                          verification_profile_reference=payload.get("verificationProfileReference"))
        insert(cursor, "customs_event_tab", {"event_number": event, "declaration_number": number,
            "declaration_revision_number": revision, "event_type_code": kind, "result_code": result,
            "external_event_key": None, "external_reference_number": None, "occurred_at": occurred, "received_at": now,
            "payload_file_reference": None, "signature_verification_status": 1,
            "event_payload_json": canonical(closed),
            "actor_reference": subject})
        return event

    @staticmethod
    def file(cursor, file):
        cursor.execute("SELECT * FROM document_file_tab WHERE logical_file_number=%s AND revision_number=%s FOR UPDATE",
                       (file["logicalFileNumber"], file["revisionNumber"]))
        row = cursor.fetchone()
        if not row or row["revision_status_code"] != 2 or row["sha256"] != file["sha256"] or row["document_type_code"] != file["documentTypeCode"]:
            raise Rejected("FILE_NOT_READY")

    def store_revision(self, cursor, number, revision, body, subject):
        digest = content_digest(body, revision - 1 if revision > 1 else None)
        insert(cursor, "customs_declaration_revision_tab", {"declaration_number": number, "revision_number": revision,
            "approved_snapshot_number": body["approvedSnapshotNumber"], "shipment_plan_revision": body["shipmentPlanRevision"],
            "revision_status": 1, "content_json": canonical(content_snapshot(body, revision - 1 if revision > 1 else None)),
            "content_hash": digest, "created_by": subject})
        for item in body["items"]:
            insert(cursor, "customs_declaration_item_tab", {"declaration_number": number,
                "declaration_revision_number": revision, "item_sequence_number": item["itemSequenceNumber"],
                "trade_revision_number": body["tradeRevisionNumber"], "trade_goods_item_sequence_number": item["tradeGoodsItemSequenceNumber"],
                "shipment_allocation_number": item["shipmentAllocationNumber"], "hs_code": item["hsCode"],
                "declared_description": item["declaredDescription"], "specification": item["specification"],
                "declared_quantity": item["declaredQuantity"], "unit_code": item["unitCode"],
                "declared_unit_price_amount": item["declaredUnitPriceAmount"], "declared_total_amount": item["declaredTotalAmount"],
                "currency_code": item["currencyCode"], "origin_country_code": item["originCountryCode"]})
        return digest

    def draft_gate(self, cursor, body, number=""):
        validate_draft(body, SHIPMENT)
        cursor.execute("SELECT * FROM trade_revision_tab WHERE snapshot_number=%s FOR UPDATE", (body["approvedSnapshotNumber"],))
        approved = cursor.fetchone()
        if not approved or approved["snapshot_reason_code"] != 2 or approved["revision_number"] != body["tradeRevisionNumber"]:
            raise Rejected("APPROVED_SNAPSHOT_REQUIRED")
        if body["shipmentPlanRevision"] != "SYNTHETIC-PLAN-1":
            raise Rejected("CUSTOMS_PLAN_VERSION_CONFLICT")
        cursor.execute("SELECT * FROM logistics_shipment_item_tab WHERE shipment_number=%s AND allocation_status=1 FOR UPDATE", (SHIPMENT,))
        allocation = cursor.fetchone()
        cursor.execute("""SELECT d.declaration_number,i.trade_goods_item_sequence_number,i.declared_quantity,i.declared_total_amount
                       FROM customs_declaration_tab d JOIN customs_declaration_item_tab i
                       ON i.declaration_number=d.declaration_number AND i.declaration_revision_number=d.declaration_revision_number
                       WHERE d.shipment_number=%s AND d.declaration_status<>11 ORDER BY d.declaration_number,i.item_sequence_number
                       FOR UPDATE""", (SHIPMENT,))
        others = [row for row in cursor.fetchall() if row["declaration_number"] != number]
        quantity = sum((Decimal(i["declaredQuantity"]) for i in body["items"]), Decimal(0))
        amount = sum((Decimal(i["declaredTotalAmount"]) for i in body["items"]), Decimal(0))
        quantity += sum((row["declared_quantity"] for row in others), Decimal(0))
        amount += sum((row["declared_total_amount"] for row in others), Decimal(0))
        if not allocation or quantity > allocation["allocated_quantity"] or amount > allocation["allocated_amount"]:
            raise Rejected("CUSTOMS_QUANTITY_EXCEEDED")
        if not number and others:
            raise Rejected("CUSTOMS_SCOPE_UNCONFIRMED")
        for file in body["supportingFiles"]:
            self.file(cursor, file)

    def run(self, action, body, number="", expected=None, key=None, subject="F", audience=None,
            confirmation=None, fail=False):
        key = key or str(uuid.uuid4())
        internal = action in ("review", "verify")
        audience = audience or ("internal" if internal else "external")
        roles = {"F": {"agent", "reviewer"}, "R": {"reviewer"}, "A": {"supplier"}, "B": {"exporter"}}
        required = {"create": "agent", "revise": "agent", "submit": "agent", "review": "reviewer",
                    "confirm": "supplier", "filing": "agent", "evidence": "agent", "verify": "reviewer", "deliver": "agent"}
        if audience != ("internal" if internal else "external") or required[action] not in roles.get(subject, set()):
            raise Rejected("FORBIDDEN")
        digest = self.digest(self.intent(action, number, body, expected, key, subject, audience))
        if confirmation is None:
            confirmation = self.confirm(action, number, body, expected, key, subject, audience)
        with connect(self.database) as connection, connection.cursor() as cursor:
            cursor.execute("SET TRANSACTION ISOLATION LEVEL READ COMMITTED")
            connection.begin()
            try:
                def prior():
                    cursor.execute("SELECT * FROM s4_receipt WHERE subject=%s AND audience=%s AND request_key=%s",
                                   (subject, audience, key))
                    return cursor.fetchone()
                original = prior()
                if original:
                    if original["digest"] != digest:
                        raise Rejected("IDEMPOTENCY_CONFLICT")
                    connection.rollback()
                    return json.loads(original["projection"])
                cursor.execute("SELECT * FROM trade_record_tab WHERE trade_number=%s FOR UPDATE", (TRADE,))
                if not cursor.fetchone():
                    raise Rejected("NOT_FOUND")
                cursor.execute("SELECT * FROM logistics_shipment_tab WHERE shipment_number=%s FOR UPDATE", (SHIPMENT,))
                cursor.fetchone()
                original = prior()
                if original:
                    if original["digest"] != digest:
                        raise Rejected("IDEMPOTENCY_CONFLICT")
                    connection.rollback()
                    return json.loads(original["projection"])
                cursor.execute("SELECT * FROM customs_declaration_tab WHERE declaration_number=%s FOR UPDATE", (number,))
                root = cursor.fetchone()
                if action != "create" and not root:
                    raise Rejected("NOT_FOUND")
                if expected is None:
                    raise Rejected("PRECONDITION_REQUIRED")
                if expected != ("plan-1" if action == "create" else self.root_tag(root)):
                    raise Rejected("REVISION_CONFLICT")
                def validate_confirmation(lock=False):
                    cursor.execute("SELECT * FROM s4_confirmation WHERE number=%s" + (" FOR UPDATE" if lock else ""), (confirmation,))
                    confirmed = cursor.fetchone()
                    cursor.execute("SELECT UTC_TIMESTAMP(3) now")
                    now = cursor.fetchone()["now"]
                    if not confirmed or confirmed["subject"] != subject or confirmed["audience"] != audience or confirmed["digest"] != digest or confirmed["consumed_by"] or confirmed["expires"] <= now:
                        raise Rejected("CONFIRMATION_INVALID")
                validate_confirmation()
                revision = root["declaration_revision_number"] if root else 1
                status = root["declaration_status"] if root else 1
                result = None
                if action == "create":
                    self.draft_gate(cursor, body)
                    cursor.execute("SELECT n FROM s4_counter WHERE scope='declaration' FOR UPDATE")
                    counter = cursor.fetchone()["n"] + 1
                    cursor.execute("UPDATE s4_counter SET n=%s WHERE scope='declaration'", (counter,))
                    number = "S4D-" + str(counter).zfill(12)
                    content_hash = self.store_revision(cursor, number, 1, body, subject)
                    insert(cursor, "customs_declaration_tab", {"declaration_number": number, "trade_number": TRADE,
                        "shipment_number": SHIPMENT, "declaration_revision_number": 1, "version": 1,
                        "exporter_party_role_code": 2, "exporter_participant_sequence_number": 1,
                        "agent_party_role_code": 6, "agent_participant_sequence_number": 1,
                        "declaration_type_code": 1, "declaration_status": 1, "customs_office_code": body["customsOfficeCode"],
                        "channel_code": body["channelCode"], "content_hash": content_hash,
                        "authorization_evidence_reference": body["authorizationEvidenceReference"]})
                    event = self.event(cursor, number, 1, 1, {"contentHash": content_hash}, subject)
                    result = {"declaration": number, "revision": 1, "event": event}
                else:
                    cursor.execute("SELECT * FROM customs_declaration_revision_tab WHERE declaration_number=%s AND revision_number=%s FOR UPDATE",
                                   (number, revision))
                    frozen = cursor.fetchone()
                    cursor.execute("SELECT * FROM customs_filing_request_tab WHERE declaration_number=%s ORDER BY request_number FOR UPDATE", (number,))
                    requests = cursor.fetchall()
                    if action == "revise":
                        if any(row["execution_status"] in (1, 2, 3) for row in requests):
                            raise Rejected("CUSTOMS_EXECUTION_UNKNOWN")
                        if status not in (1, 3, 4, 9):
                            raise Rejected("CUSTOMS_STATE_CONFLICT")
                        if body["baseRevisionNumber"] != revision:
                            raise Rejected("CUSTOMS_VERSION_CONFLICT")
                        self.draft_gate(cursor, body["draft"], number)
                        revision += 1
                        content_hash = self.store_revision(cursor, number, revision, body["draft"], subject)
                        cursor.execute("UPDATE customs_declaration_tab SET declaration_revision_number=%s,content_hash=%s,declaration_status=1,"
                                       "customs_office_code=%s,channel_code=%s,authorization_evidence_reference=%s WHERE declaration_number=%s",
                                       (revision, content_hash, body["draft"]["customsOfficeCode"], body["draft"]["channelCode"],
                                        body["draft"]["authorizationEvidenceReference"], number))
                        event = self.event(cursor, number, revision, 2, {"baseRevision": revision - 1, "reason": body["reason"]}, subject)
                    elif action in ("submit", "review", "confirm", "filing"):
                        exact_version(root, body["revisionNumber"], body["contentHash"])
                        events = self.events(cursor, number, revision=revision)
                        if action == "submit":
                            if status not in (1, 9):
                                raise Rejected("CUSTOMS_STATE_CONFLICT")
                            event = self.event(cursor, number, revision, 3, body, subject)
                            cursor.execute("UPDATE customs_declaration_tab SET declaration_status=2 WHERE declaration_number=%s", (number,))
                        elif action == "review":
                            submissions = [e for e in events if e["event_type_code"] == 3 and e["event_number"] == body["submissionEventNumber"]]
                            if status != 2 or not submissions:
                                raise Rejected("CUSTOMS_STATE_CONFLICT")
                            independent(subject, frozen["created_by"], submissions[0]["actor_reference"])
                            approve = body["outcome"] == "approve"
                            event = self.event(cursor, number, revision, 5 if approve else 4, body, subject, 2 if approve else 3)
                            cursor.execute("UPDATE customs_declaration_tab SET declaration_status=%s WHERE declaration_number=%s", (3 if approve else 9, number))
                        elif action == "confirm":
                            if status != 3 or not any(e["event_type_code"] == 5 for e in events):
                                raise Rejected("CUSTOMS_INDEPENDENT_REVIEW_REQUIRED")
                            if body["authorityReference"] != "SYNTHETIC-A-AUTHORITY" or len(body["writtenEvidence"]) != 1:
                                raise Rejected("CUSTOMS_EXACT_CONFIRMATION_REQUIRED")
                            for file in body["writtenEvidence"]:
                                if file["documentTypeCode"] != 19:
                                    raise Rejected("FILE_PURPOSE_INVALID")
                                self.file(cursor, file)
                            event = self.event(cursor, number, revision, 6, body, subject)
                            cursor.execute("UPDATE customs_declaration_tab SET declaration_status=4 WHERE declaration_number=%s", (number,))
                        elif action == "filing":
                            if any(row["execution_status"] in (1, 2, 3, 4) for row in requests):
                                raise Rejected("CUSTOMS_EXECUTION_UNKNOWN")
                            if status != 4 or not any(e["event_type_code"] == 6 for e in events):
                                raise Rejected("CUSTOMS_EXACT_CONFIRMATION_REQUIRED")
                            if body["action"] != 1:
                                official_gate()
                            request_number = "S4R-" + uuid.uuid4().hex
                            request_payload = {"schema_version": 1, "approved_snapshot_number": frozen["approved_snapshot_number"],
                                "declaration_content_hash": body["contentHash"], "action_code": body["action"],
                                "operation_evidence_reference": self.operation_evidence, "evidence_references": []}
                            insert(cursor, "customs_filing_request_tab", {"request_number": request_number,
                                "declaration_number": number, "revision_number": revision, "action_code": body["action"],
                                "execution_status": 1, "request_hash": hashlib.sha256(canonical(request_payload).encode()).hexdigest(),
                                "request_payload_json": canonical(request_payload), "provider_reference": None, "created_by": subject})
                            event = self.event(cursor, number, revision, 7, {"requestNumber": request_number, **body}, subject)
                            result = {"declaration": number, "revision": revision, "request": request_number,
                                      "execution": 1, "missingGates": ["CUSTOMS_AUTHORITY_UNVERIFIED", "CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED"]}
                    elif action == "evidence":
                        if body["claimedEventTypeCode"] not in range(8, 15) or not 1 <= len(body["sourceEventKey"]) <= 128:
                            raise Rejected("CUSTOMS_CONTENT_INVALID")
                        matching = [request for request in requests if request["request_number"] == body["requestNumber"]]
                        if not matching or body["revisionNumber"] != matching[0]["revision_number"]:
                            raise Rejected("CUSTOMS_VERSION_CONFLICT")
                        for file in body["files"]:
                            if file["documentTypeCode"] != 21:
                                raise Rejected("FILE_PURPOSE_INVALID")
                            self.file(cursor, file)
                        prior_claims = self.events(cursor, number, 17, revision)
                        duplicates = [row for row in prior_claims if self.payload(row)["claimed_external_event_key"] == body["sourceEventKey"]]
                        if duplicates:
                            old = self.payload(duplicates[0])
                            if old["request_number"] != body["requestNumber"] or old["evidence_references"] != [file_snapshot(file) for file in body["files"]] or old["authority_reference"] != body.get("externalReferenceNumber") or old["claimed_event_type_code"] != body["claimedEventTypeCode"] or duplicates[0]["occurred_at"] != datetime.fromisoformat(body["occurredAt"].replace("Z", "+00:00")).replace(tzinfo=None):
                                raise Rejected("CUSTOMS_EVENT_CONFLICT")
                            event = duplicates[0]["event_number"]
                        else:
                            event = self.event(cursor, number, revision, 17, body, subject)
                        result = {"declaration": number, "revision": revision, "event": event, "state": "pending_verification"}
                    elif action == "verify":
                        claims = [row for row in self.events(cursor, number, 17, revision) if row["event_number"] == body["evidenceEventNumber"]]
                        if not claims:
                            raise Rejected("NOT_FOUND")
                        independent(subject, claims[0]["actor_reference"], claims[0]["actor_reference"])
                        if body["outcome"] == "approve":
                            official_gate(body.get("verificationProfileReference"))
                        event = self.event(cursor, number, revision, 18, body, subject, 3)
                        result = {"declaration": number, "revision": revision, "event": event, "state": "verification_returned"}
                    elif action == "deliver":
                        if body["recipientPartyRoleCode"] not in (1, 2):
                            raise Rejected("CUSTOMS_RECIPIENT_MISMATCH")
                        # No official submitted fact is synthesized to make delivery succeed.
                        official_gate()
                    if result is None:
                        result = {"declaration": number, "revision": revision, "event": event}
                    cursor.execute("UPDATE customs_declaration_tab SET version=version+1 WHERE declaration_number=%s", (number,))
                validate_confirmation(lock=True)
                if fail:
                    raise Rejected("INJECTED_PARTIAL_WRITE")
                cursor.execute("SELECT * FROM customs_declaration_tab WHERE declaration_number=%s", (number,))
                updated = cursor.fetchone()
                result.update({"tag": self.root_tag(updated), "status": updated["declaration_status"]})
                insert(cursor, "s4_receipt", {"subject": subject, "audience": audience, "request_key": key,
                    "digest": digest, "declaration": number, "projection": canonical(result)})
                cursor.execute("UPDATE s4_confirmation SET consumed_by=%s WHERE number=%s", (key, confirmation))
                connection.commit()
                return result
            except (Rejected, pymysql.MySQLError):
                connection.rollback()
                raise

    def transport_unknown(self, request):
        with connect(self.database) as connection, connection.cursor() as cursor:
            connection.begin()
            cursor.execute("SELECT * FROM trade_record_tab WHERE trade_number=%s FOR UPDATE", (TRADE,))
            cursor.fetchone()
            cursor.execute("SELECT * FROM logistics_shipment_tab WHERE shipment_number=%s FOR UPDATE", (SHIPMENT,))
            cursor.fetchone()
            cursor.execute("SELECT declaration_number FROM customs_filing_request_tab WHERE request_number=%s", (request,))
            number = cursor.fetchone()["declaration_number"]
            cursor.execute("SELECT * FROM customs_declaration_tab WHERE declaration_number=%s FOR UPDATE", (number,))
            cursor.fetchone()
            cursor.execute("SELECT * FROM customs_filing_request_tab WHERE request_number=%s FOR UPDATE", (request,))
            row = cursor.fetchone()
            if row["execution_status"] not in (1, 2, 3):
                raise Rejected("CUSTOMS_STATE_CONFLICT")
            cursor.execute("UPDATE customs_filing_request_tab SET execution_status=3 WHERE request_number=%s", (request,))
            cursor.execute("UPDATE customs_declaration_tab SET version=version+1 WHERE declaration_number=%s", (number,))
            connection.commit()
            return True


def file_worker(database, task_id, crash_after_put=False):
    isolated(database)
    credentials = json.loads((BASE / "s3-client.json").read_text())
    storage = client(credentials["access_key"], credentials["secret_key"])
    with connect(database) as connection, connection.cursor() as cursor:
        connection.begin()
        cursor.execute("SELECT * FROM middleware_file_task WHERE task_id=%s FOR UPDATE", (task_id,))
        task = cursor.fetchone()
        if task["phase"] == "done":
            return task["file_id"]
        if task["phase"] in ("rejected", "manual_action"):
            raise Rejected("TASK_NOT_RETRYABLE")
        if task["attempts"] >= 8:
            cursor.execute("UPDATE middleware_file_task SET phase='manual_action',last_error='RETRY_EXHAUSTED' WHERE task_id=%s", (task_id,))
            connection.commit()
            raise Rejected("RETRY_EXHAUSTED")
        cursor.execute("UPDATE middleware_file_task SET phase='processing',attempts=attempts+1,fencing_token=fencing_token+1,"
                       "lease_until=UTC_TIMESTAMP(3)+INTERVAL 60 SECOND WHERE task_id=%s AND "
                       "(lease_until IS NULL OR lease_until<UTC_TIMESTAMP(3))", (task_id,))
        if cursor.rowcount != 1:
            raise Rejected("LEASE_BUSY")
        token = task["fencing_token"] + 1
        connection.commit()
    data = storage.get_object(Bucket=BUCKETS[0], Key=task["object_key"], VersionId=task["stage_version"])["Body"].read()
    if len(data) != task["expected_size"] or hashlib.sha256(data).hexdigest() != task["expected_hash"]:
        query(database, "UPDATE middleware_file_task SET phase='rejected',last_error='DIGEST_MISMATCH',lease_until=NULL WHERE task_id=%s AND fencing_token=%s", (task_id, token))
        raise Rejected("DIGEST_MISMATCH")
    scan_database_fresh()
    if not scan(data).endswith(": OK"):
        query(database, "UPDATE middleware_file_task SET phase='rejected',last_error='SCAN_REJECTED',lease_until=NULL WHERE task_id=%s AND fencing_token=%s", (task_id, token))
        raise Rejected("SCAN_REJECTED")
    try:
        version = storage.put_object(Bucket=BUCKETS[1], Key=task["object_key"], Body=data, IfNoneMatch="*",
                                     Metadata={"sha256": task["expected_hash"]})["VersionId"]
    except ClientError as error:
        if error.response["Error"]["Code"] not in ("PreconditionFailed", "ConditionalRequestConflict"):
            raise
        version = storage.head_object(Bucket=BUCKETS[1], Key=task["object_key"])["VersionId"]
    if storage.get_object(Bucket=BUCKETS[1], Key=task["object_key"], VersionId=version)["Body"].read() != data:
        raise Rejected("FINAL_OBJECT_CONFLICT")
    if crash_after_put:
        os._exit(73)
    with connect(database) as connection, connection.cursor() as cursor:
        connection.begin()
        cursor.execute("SELECT * FROM middleware_file_task WHERE task_id=%s FOR UPDATE", (task_id,))
        current = cursor.fetchone()
        if current["phase"] != "processing" or current["fencing_token"] != token:
            raise Rejected("STALE_FENCE")
        file_id = insert(cursor, "document_file_tab", {"logical_file_number": "S4F-" + task_id.replace("-", ""),
            "revision_number": 1, "revision_status_code": 2, "display_name": "原创合成关务测试材料，非正式附件2",
            "document_type_code": task["document_type_code"], "storage_path": BUCKETS[1] + "/" + task["object_key"] + "?versionId=" + version,
            "sha256": task["expected_hash"], "size_bytes": len(data), "media_type": "text/html",
            "access_scope_json": canonical({"validationOnly": True, "versionId": version}), "created_by": "SYNTHETIC"})
        cursor.execute("UPDATE middleware_file_task SET phase='done',file_id=%s,final_version=%s,lease_until=NULL WHERE task_id=%s",
                       (file_id, version, task_id))
        connection.commit()
        return file_id


def bootstrap(database, ddl):
    isolated(database)
    query(None, "CREATE DATABASE `" + database + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin")
    for table in CORE:
        statement = re.search(r"CREATE TABLE `" + table + r"` \([\s\S]*?\) ENGINE=InnoDB[^;]*;", ddl)
        if not statement:
            raise AssertionError("Missing source DDL " + table)
        query(database, statement.group())
    for statement in source_triggers(ddl):
        query(database, statement)
    middleware = [
        "CREATE TABLE s4_counter(scope VARCHAR(32) PRIMARY KEY,n BIGINT NOT NULL) ENGINE=InnoDB",
        "CREATE TABLE s4_confirmation(number CHAR(36) PRIMARY KEY,subject VARCHAR(64),audience VARCHAR(16),digest CHAR(64),expires DATETIME(3),consumed_by CHAR(36) NULL) ENGINE=InnoDB",
        "CREATE TABLE s4_receipt(sequence BIGINT AUTO_INCREMENT PRIMARY KEY,subject VARCHAR(64),audience VARCHAR(16),request_key CHAR(36),digest CHAR(64),declaration VARCHAR(40),projection JSON,UNIQUE KEY(subject,audience,request_key)) ENGINE=InnoDB",
        shared.MIDDLEWARE[4]]
    for statement in middleware:
        query(database, statement)
    query(database, "INSERT INTO s4_counter VALUES('declaration',0)")
    with connect(database) as connection, connection.cursor() as cursor:
        trade_id = insert(cursor, "trade_record_tab", {"trade_number": TRADE, "trade_status_code": 8,
            "revision_number": 4, "approved_revision_number": 4, "transaction_goods_items_json": "[]",
            "transaction_filing_document_references_json": "[]", "transaction_filing_source_and_version_json": "{}",
            "transaction_filing_missing_information_json": "[]", "creation_payload_hmac": "0" * 64,
            "creation_payload_hmac_key_version": "SYNTHETIC-NOT-A-REAL-APPROVAL"})
        insert(cursor, "trade_event_tab", {"event_number": "SYNTHETIC-S4-APPROVED", "trade_record_id": trade_id,
            "revision_number": 4, "event_type_code": 10, "from_trade_status_code": 5, "to_trade_status_code": 8,
            "actor_reference": "SYNTHETIC-REVIEWER", "reason_code": 1, "reason_text": "Internal fixture only",
            "event_payload": "{}", "trace_id": uuid.uuid4().hex, "occurred_at": datetime.now(timezone.utc).replace(tzinfo=None)})
        for reason in (1, 2):
            insert(cursor, "trade_revision_tab", {"snapshot_number": "SNP-S4-SYNTHETIC-" + ("APPROVED" if reason == 2 else "SUBMITTED"),
                "trade_number": TRADE, "revision_number": 4, "snapshot_reason_code": reason,
                "transaction_filing_snapshot_json": canonical({"validationOnly": True, "quantity": "40.000000", "amount": "4000.00"}),
                "integrity_key_version": "SYNTHETIC", "revision_content_hmac": "0" * 64,
                "source_event_number": "SYNTHETIC-S4-APPROVED" if reason == 2 else "SYNTHETIC-S4-SUBMITTED"})
        insert(cursor, "logistics_shipment_tab", {"shipment_number": SHIPMENT, "trade_number": TRADE,
            "trade_revision_number": 4, "shipment_status": 1, "shipper_party_role_code": 1,
            "shipper_participant_sequence_number": 1, "consignee_party_role_code": 3,
            "consignee_participant_sequence_number": 1, "carrier_party_role_code": 5,
            "carrier_participant_sequence_number": 1, "origin_code": "SYNTHETIC-ORIGIN",
            "destination_code": "SYNTHETIC-DESTINATION", "planned_departure_date": "2026-11-01", "planned_arrival_date": "2026-11-03"})
        insert(cursor, "logistics_shipment_item_tab", {"shipment_number": SHIPMENT, "trade_number": TRADE,
            "trade_revision_number": 4, "trade_goods_item_sequence_number": 1, "allocated_quantity": "40.000000",
            "unit_code": "PCS", "allocated_amount": "4000.00", "currency_code": "CNY", "allocation_status": 1})


def main(output):
    database = "verify_customs_" + secrets.token_hex(6)
    ddl = (ROOT / "doc/sql/domain/schema.sql").read_text()
    source_hash = hashlib.sha256(ddl.encode()).hexdigest()
    before = shared.application_baseline()
    checks, versions, keys = [], [], []
    credentials = json.loads((BASE / "s3-client.json").read_text())
    storage, admin = client(credentials["access_key"], credentials["secret_key"]), client(*root_credentials())
    prefix = "_step-four-validation/" + secrets.token_hex(16)
    failure, cleaned = None, False

    def check(name, test, category="application_gate", expected="Condition satisfied"):
        try:
            observed = test()
            if observed is False:
                raise AssertionError(name)
            checks.append({"name": name, "category": category, "expected": expected,
                           "observed": observed if observed is not None else "Completed without rejection", "passed": True})
            return observed
        except Exception as error:
            checks.append({"name": name, "category": category, "expected": expected,
                           "observed": type(error).__name__ + ": " + str(error), "passed": False})
            raise

    def rejected(code, call):
        try:
            call()
        except Rejected as error:
            assert str(error) == code, (code, str(error))
            return code
        raise AssertionError("Expected " + code)

    def sql_rejected(call, expected_code=None):
        try:
            call()
        except pymysql.MySQLError as error:
            assert error.args[0] in (1644, 3819, 1062), error
            if expected_code is not None:
                assert error.args[0] == expected_code, error
            return {"mysqlError": error.args[0]}
        raise AssertionError("SQL protection did not reject")

    try:
        bootstrap(database, ddl)
        check("Eleven current core tables and all applicable complete source triggers copied", lambda:
              len(query(database, "SHOW TABLES")) == len(CORE) + 4 and len(query(database, "SHOW TRIGGERS")) == len(list(source_triggers(ddl))), "db_hard")
        material = (ROOT / "doc/examples/step4/material.html").read_bytes()
        check("Actual ClamAV database fresh and original synthetic material clean", lambda:
              bool(scan_database_fresh()) and scan(material).endswith(": OK"), "real_middleware")
        task = str(uuid.uuid4())
        object_key = prefix + "/" + task
        keys.append(object_key)
        stage_version = storage.put_object(Bucket=BUCKETS[0], Key=object_key, Body=material, IfNoneMatch="*")["VersionId"]
        versions.append((BUCKETS[0], object_key, stage_version))
        insert_values = (task, object_key, stage_version, hashlib.sha256(material).hexdigest(), len(material), "pending")
        query(database, "INSERT INTO middleware_file_task(task_id,object_key,stage_version,expected_hash,expected_size,phase,document_type_code) VALUES(%s,%s,%s,%s,%s,%s,3)", insert_values)
        crashed = subprocess.run([sys.executable, str(Path(__file__)), "--worker", database, task, "--crash-after-put"], check=False)
        check("Worker process stops after actual final object write, before DB ready", lambda:
              crashed.returncode == 73 and query(database, "SELECT phase,file_id FROM middleware_file_task WHERE task_id=%s", (task,))[0] == {"phase": "processing", "file_id": None}, "real_middleware")
        check("Second worker cannot steal active durable lease", lambda: rejected("LEASE_BUSY", lambda: file_worker(database, task)), "real_middleware")
        final_version = storage.head_object(Bucket=BUCKETS[1], Key=object_key)["VersionId"]
        versions.append((BUCKETS[1], object_key, final_version))
        query(database, "UPDATE middleware_file_task SET lease_until=UTC_TIMESTAMP(3)-INTERVAL 1 SECOND WHERE task_id=%s", (task,))
        recovered = subprocess.run([sys.executable, str(Path(__file__)), "--worker", database, task], check=False)
        check("New process recovers original durable task without browser retry", lambda: recovered.returncode == 0 and query(database, "SELECT phase FROM middleware_file_task WHERE task_id=%s", (task,))[0]["phase"] == "done", "real_middleware")
        check("Recovery reuses exact S3 VersionId and verifies original bytes", lambda: query(database, "SELECT final_version FROM middleware_file_task WHERE task_id=%s", (task,))[0]["final_version"] == final_version and storage.get_object(Bucket=BUCKETS[1], Key=object_key, VersionId=final_version)["Body"].read() == material, "real_middleware")
        check("Completed file task reentry returns same metadata, not duplicate file", lambda: file_worker(database, task) == query(database, "SELECT file_id FROM middleware_file_task WHERE task_id=%s", (task,))[0]["file_id"] and len(query(database, "SELECT id FROM document_file_tab")) == 1, "real_middleware")
        check("S3 fixed final key rejects changed overwrite", lambda: s3_overwrite_rejected(storage, object_key), "real_middleware")
        bad_task = str(uuid.uuid4())
        bad_key = prefix + "/" + bad_task
        keys.append(bad_key)
        bad_version = storage.put_object(Bucket=BUCKETS[0], Key=bad_key, Body=material, IfNoneMatch="*")["VersionId"]
        versions.append((BUCKETS[0], bad_key, bad_version))
        query(database, "INSERT INTO middleware_file_task(task_id,object_key,stage_version,expected_hash,expected_size,phase) VALUES(%s,%s,%s,%s,%s,'pending')",
              (bad_task, bad_key, bad_version, "0" * 64, len(material)))
        check("Actual staged byte digest mismatch persists durable rejection", lambda: rejected("DIGEST_MISMATCH", lambda: file_worker(database, bad_task)), "real_middleware")
        check("Rejected file task is not blindly retried or marked ready", lambda: rejected("TASK_NOT_RETRYABLE", lambda: file_worker(database, bad_task)) and
              query(database, "SELECT phase,file_id FROM middleware_file_task WHERE task_id=%s", (bad_task,))[0] == {"phase": "rejected", "file_id": None}, "real_middleware")
        file_row = query(database, "SELECT * FROM document_file_tab")[0]
        file = {"logicalFileNumber": file_row["logical_file_number"], "revisionNumber": 1,
                "sha256": file_row["sha256"], "documentTypeCode": 3}
        def purpose_material(purpose, name):
            content = (ROOT / "doc/examples/step4" / name).read_bytes()
            task_id = str(uuid.uuid4())
            key = prefix + "/" + task_id
            keys.append(key)
            stage = storage.put_object(Bucket=BUCKETS[0], Key=key, Body=content, IfNoneMatch="*")["VersionId"]
            versions.append((BUCKETS[0], key, stage))
            query(database, "INSERT INTO middleware_file_task(task_id,object_key,stage_version,expected_hash,expected_size,phase,document_type_code) "
                  "VALUES(%s,%s,%s,%s,%s,'pending',%s)", (task_id, key, stage, hashlib.sha256(content).hexdigest(), len(content), purpose))
            file_id = file_worker(database, task_id)
            row = query(database, "SELECT * FROM document_file_tab WHERE id=%s", (file_id,))[0]
            return {"logicalFileNumber": row["logical_file_number"], "revisionNumber": 1, "sha256": row["sha256"], "documentTypeCode": row["document_type_code"]}
        written_file = check("Distinct original purpose19 bytes actually scanned and stored for synthetic A confirmation",
                             lambda: purpose_material(19, "supplier-confirmation.html"), "real_middleware")
        authority_file = check("Distinct original purpose21 bytes stored only as an unverified authority claim",
                               lambda: purpose_material(21, "authority-claim.html"), "real_middleware")
        data = json.loads((ROOT / "doc/examples/step4/entity-projection.json").read_text())
        draft = copy.deepcopy(data["draft"])
        draft["supportingFiles"] = [file]
        h = Customs(database)
        h.operation_evidence = file["logicalFileNumber"] + "#1"
        create = lambda body=draft, **kw: h.run("create", body, expected="plan-1", **kw)
        check("Cause1 snapshot cannot become customs basis", lambda: rejected("APPROVED_SNAPSHOT_REQUIRED", lambda: create({**draft, "approvedSnapshotNumber": "SNP-S4-SYNTHETIC-SUBMITTED"})))
        check("Stale frozen shipment plan refused", lambda: rejected("CUSTOMS_PLAN_VERSION_CONFLICT", lambda: create({**draft, "shipmentPlanRevision": "stale"})))
        check("Nonready file version refused", lambda: rejected("FILE_NOT_READY", lambda: create({**draft, "supportingFiles": [{**file, "revisionNumber": 2}]})))
        check("Draft exact file digest mismatch refused", lambda: rejected("FILE_NOT_READY", lambda: create({**draft, "supportingFiles": [{**file, "sha256": "0" * 64}]})))
        over = copy.deepcopy(draft)
        over["items"][0].update(declaredQuantity="41.000000", declaredTotalAmount="4100.00")
        check("Quantity/amount cannot exceed same-batch active allocation", lambda: rejected("CUSTOMS_QUANTITY_EXCEEDED", lambda: create(over)))
        amount_over = copy.deepcopy(draft)
        amount_over["items"][0].update(declaredUnitPriceAmount="200.00", declaredTotalAmount="8000.00")
        check("Amount cap independently blocks even when quantity fits", lambda: rejected("CUSTOMS_QUANTITY_EXCEEDED", lambda: create(amount_over)))
        check("Partial first creation rolls back all business rows and local number", lambda: rejected("INJECTED_PARTIAL_WRITE", lambda: create(fail=True)))
        check("Failed creation persisted neither root/revision/item/event nor consumed number", lambda:
              all(not query(database, "SELECT id FROM `" + table + "`") for table in ("customs_declaration_tab", "customs_declaration_revision_tab", "customs_declaration_item_tab", "customs_event_tab")) and query(database, "SELECT n FROM s4_counter")[0]["n"] == 0, "db_hard")
        creation_keys = [str(uuid.uuid4()), str(uuid.uuid4())]
        def competing_creation(key):
            try:
                return create(key=key)
            except Rejected as error:
                return str(error)
        with ThreadPoolExecutor(max_workers=2) as pool:
            creation_results = list(pool.map(competing_creation, creation_keys))
        check("Distinct concurrent first declarations serialize under batch root and cannot over-allocate", lambda:
              sum(isinstance(row, dict) for row in creation_results) == 1 and "CUSTOMS_QUANTITY_EXCEEDED" in creation_results)
        winner = next(index for index, value in enumerate(creation_results) if isinstance(value, dict))
        key = creation_keys[winner]
        first = check("Create local draft with complete frozen header and item", lambda: creation_results[winner])
        number = first["declaration"]
        check("DECIMAL exact values persisted, official number/time remain NULL", lambda: query(database, "SELECT declared_quantity q,declared_total_amount a FROM customs_declaration_item_tab")[0] == {"q": Decimal("40.000000"), "a": Decimal("4000.00")} and query(database, "SELECT external_declaration_number n,submitted_at s,released_at r FROM customs_declaration_tab")[0] == {"n": None, "s": None, "r": None}, "db_hard")
        check("Actual MySQL CHECK rejects non-CNY item", lambda: sql_rejected(lambda: query(database, "UPDATE customs_declaration_item_tab SET currency_code='USD'"), 3819), "db_hard")
        check("Actual MySQL CHECK rejects zero declared quantity", lambda: sql_rejected(lambda: query(database, "UPDATE customs_declaration_item_tab SET declared_quantity=0"), 3819), "db_hard")
        check("Actual MySQL CHECK rejects undefined customs root status", lambda: sql_rejected(lambda: query(database, "UPDATE customs_declaration_tab SET declaration_status=99"), 3819), "db_hard")
        check("Changed content with original key rejected", lambda: rejected("IDEMPOTENCY_CONFLICT", lambda: create({**draft, "transportReference": "different"}, key=key)))
        with ThreadPoolExecutor(max_workers=4) as pool:
            replay = list(pool.map(lambda _: create(key=key), range(4)))
        check("Four concurrent original retries recover identical frozen receipt", lambda: all(value == first for value in replay))
        check("Current permission rechecked before receipt replay", lambda: rejected("FORBIDDEN", lambda: create(key=key, subject="outsider")))
        second_draft = copy.deepcopy(draft)
        second_draft["items"][0].update(declaredQuantity="10.000000", declaredTotalAmount="1000.00")
        check("Second declaration cannot evade batch cumulative bound", lambda: rejected("CUSTOMS_QUANTITY_EXCEEDED", lambda: create(second_draft)))
        check("Missing If-Match refused", lambda: rejected("PRECONDITION_REQUIRED", lambda: h.run("submit", {"revisionNumber": 1, "contentHash": "x"}, number)))
        check("Missing content confirmation refused", lambda: rejected("CONFIRMATION_INVALID", lambda: h.run("submit", {"revisionNumber": 1, "contentHash": "x"}, number, h.tag(number), confirmation="")))
        revision_hash = query(database, "SELECT content_hash h FROM customs_declaration_tab WHERE declaration_number=%s", (number,))[0]["h"]
        submit_body = {"revisionNumber": 1, "contentHash": revision_hash}
        submit_key = str(uuid.uuid4())
        expired = h.confirm("submit", number, submit_body, h.tag(number), submit_key, "F")
        query(database, "UPDATE s4_confirmation SET expires=UTC_TIMESTAMP(3)-INTERVAL 1 SECOND WHERE number=%s", (expired,))
        check("Expired exact-intent confirmation refused", lambda: rejected("CONFIRMATION_INVALID", lambda: h.run("submit", submit_body, number, h.tag(number), key=submit_key, confirmation=expired)))
        submit = check("F freezes exact first revision for independent review", lambda: h.run("submit", submit_body, number, h.tag(number)))
        review_body = {**submit_body, "submissionEventNumber": submit["event"], "outcome": "approve", "reason": "Internal synthetic consistency only"}
        check("Dual-role author still cannot independently self-review", lambda: rejected("CUSTOMS_SELF_REVIEW", lambda: h.run("review", review_body, number, h.tag(number))))
        check("Internal review rejects external audience credential", lambda: rejected("FORBIDDEN", lambda: h.run("review", review_body, number, h.tag(number), subject="R", audience="external")))
        returned = check("Independent return saves exact reason, not official rejection", lambda: h.run("review", {**review_body, "outcome": "return", "reason": "补正运输引用"}, number, h.tag(number), subject="R"))
        check("Return makes root9 but original revision_status remains frozen1", lambda: returned["status"] == 9 and query(database, "SELECT revision_status s FROM customs_declaration_revision_tab")[0]["s"] == 1)
        replacement = copy.deepcopy(draft)
        replacement["transportReference"] = "SYNTHETIC-CORRECTED-TRANSPORT"
        replacement["customsOfficeCode"] = "SYNTHETIC-OFFICE-V2"
        replacement["channelCode"] = "SYNTHETIC-CHANNEL-V2"
        replacement["items"][0].update(declaredQuantity="35.000000", declaredTotalAmount="3500.00")
        amendment = {"baseRevisionNumber": 1, "draft": replacement, "reason": "按独审意见补正，未正式提交"}
        revised = check("Append full corrected revision without double-counting old quantity", lambda: h.run("revise", amendment, number, h.tag(number)))
        check("Old header/item remain intact and latest allocation is35 not75", lambda:
              json.loads(query(database, "SELECT content_json FROM customs_declaration_revision_tab WHERE revision_number=1")[0]["content_json"])["header"]["transport_reference"] == draft["transportReference"] and
              len(query(database, "SELECT * FROM customs_declaration_item_tab WHERE declaration_number=%s", (number,))) == 2 and revised["revision"] == 2)
        check("Current root office/channel project new header while old full header stays readable", lambda:
              query(database, "SELECT customs_office_code o,channel_code c FROM customs_declaration_tab")[0] ==
              {"o": replacement["customsOfficeCode"], "c": replacement["channelCode"]} and
              json.loads(query(database, "SELECT content_json FROM customs_declaration_revision_tab WHERE revision_number=1")[0]["content_json"])["header"]["customs_office_code"] == draft["customsOfficeCode"])
        check("Domain snapshot follows closed shared schema and hashes complete old header/previous revision", lambda:
              set(json.loads(query(database, "SELECT content_json FROM customs_declaration_revision_tab WHERE revision_number=2")[0]["content_json"])) ==
              {"schema_version", "header", "participant_references", "goods", "document_references", "previous_revision_number", "rule_version"} and
              query(database, "SELECT content_hash h FROM customs_declaration_revision_tab WHERE revision_number=2")[0]["h"] == content_digest(replacement, 1))
        small = copy.deepcopy(replacement)
        small["items"][0].update(declaredQuantity="1.000000", declaredTotalAmount="100.00")
        check("Even under quantity cap, second declaration blocks until split-scope rule confirmed", lambda: rejected("CUSTOMS_SCOPE_UNCONFIRMED", lambda: create(small)))
        check("Original create replay precedes changed ETag and consumed confirmation", lambda: create(key=key) == first)
        check("Old ETag cannot modify new current revision", lambda: rejected("REVISION_CONFLICT", lambda: h.run("revise", amendment, number, first["tag"])))
        def exact_body():
            row = query(database, "SELECT declaration_revision_number n,content_hash h FROM customs_declaration_tab WHERE declaration_number=%s", (number,))[0]
            return {"revisionNumber": row["n"], "contentHash": row["h"]}
        written = lambda: {**exact_body(), "authorityReference": "SYNTHETIC-A-AUTHORITY", "writtenEvidence": [written_file]}
        check("Old independent approval is not inherited by corrected revision", lambda: rejected("CUSTOMS_INDEPENDENT_REVIEW_REQUIRED", lambda: h.run("confirm", written(), number, h.tag(number), subject="A")))
        submitted2 = h.run("submit", exact_body(), number, h.tag(number))
        h.run("review", {**exact_body(), "submissionEventNumber": submitted2["event"], "outcome": "approve", "reason": "Synthetic consistency pass"}, number, h.tag(number), subject="R")
        check("A cannot confirm altered digest at same revision", lambda: rejected("CUSTOMS_VERSION_CONFLICT", lambda: h.run("confirm", {**written(), "contentHash": "0" * 64}, number, h.tag(number), subject="A")))
        check("F cannot supply A written confirmation", lambda: rejected("FORBIDDEN", lambda: h.run("confirm", written(), number, h.tag(number))))
        check("A missing written evidence refused even with technical confirmation", lambda: rejected("CUSTOMS_EXACT_CONFIRMATION_REQUIRED", lambda: h.run("confirm", {**written(), "writtenEvidence": []}, number, h.tag(number), subject="A")))
        check("Ready packing-list purpose3 cannot masquerade as A written confirmation19", lambda: rejected("FILE_PURPOSE_INVALID", lambda: h.run("confirm", {**written(), "writtenEvidence": [file]}, number, h.tag(number), subject="A")))
        check("Synthetic A exact-version written confirmation remains local fact", lambda: h.run("confirm", written(), number, h.tag(number), subject="A"))
        check("Immutable revision UPDATE blocked by copied source trigger", lambda: sql_rejected(lambda: query(database, "UPDATE customs_declaration_revision_tab SET content_json=JSON_OBJECT('changed',true)")), "db_hard")
        check("Immutable revision DELETE blocked by copied source trigger", lambda: sql_rejected(lambda: query(database, "DELETE FROM customs_declaration_revision_tab")), "db_hard")
        check("Business event UPDATE/DELETE blocked by copied source trigger", lambda: sql_rejected(lambda: query(database, "DELETE FROM customs_event_tab")), "db_hard")
        check("Duplicate business revision key rejected by MySQL", lambda: sql_rejected(lambda: query(database, "INSERT INTO customs_declaration_revision_tab(declaration_number,revision_number,approved_snapshot_number,shipment_plan_revision,revision_status,content_json,content_hash,created_by) SELECT declaration_number,revision_number,approved_snapshot_number,shipment_plan_revision,revision_status,content_json,content_hash,created_by FROM customs_declaration_revision_tab LIMIT 1")), "db_hard")
        h.run("revise", {"baseRevisionNumber": 2, "draft": {**replacement, "transportReference": "BEFORE-RACE"}, "reason": "prepare race on awaiting-A version"}, number, h.tag(number))
        pending = h.run("submit", exact_body(), number, h.tag(number))
        h.run("review", {**exact_body(), "submissionEventNumber": pending["event"], "outcome": "approve", "reason": "Synthetic race basis"}, number, h.tag(number), subject="R")
        race_tag, race_confirmation = h.tag(number), written()
        race_revision = {"baseRevisionNumber": exact_body()["revisionNumber"], "draft": {**replacement, "transportReference": "RACE-REVISION"}, "reason": "race"}
        def race(action):
            try:
                return h.run(action, race_confirmation if action == "confirm" else race_revision, number, race_tag, subject="A" if action == "confirm" else "F")
            except Rejected as error:
                return str(error)
        with ThreadPoolExecutor(max_workers=2) as pool:
            competition = list(pool.map(race, ("confirm", "revise")))
        check("Concurrent A confirmation and correction cannot both use same root tag", lambda: sum(isinstance(value, dict) for value in competition) == 1 and "REVISION_CONFLICT" in competition)
        current = exact_body()
        if query(database, "SELECT declaration_status s FROM customs_declaration_tab")[0]["s"] == 1:
            pending = h.run("submit", current, number, h.tag(number))
            h.run("review", {**current, "submissionEventNumber": pending["event"], "outcome": "approve", "reason": "Synthetic race revision"}, number, h.tag(number), subject="R")
            h.run("confirm", written(), number, h.tag(number), subject="A")
        filing_body = {**exact_body(), "action": 1, "reason": "本地正式办理意图，官方渠道未接入"}
        filing_key, filing_tag = str(uuid.uuid4()), h.tag(number)
        token = h.confirm("filing", number, filing_body, filing_tag, filing_key, "F")
        check("Partial filing rolls back request/event and confirmation consumption", lambda: rejected("INJECTED_PARTIAL_WRITE", lambda: h.run("filing", filing_body, number, filing_tag, key=filing_key, confirmation=token, fail=True)))
        check("Rollback leaves original exact confirmation reusable", lambda: query(database, "SELECT consumed_by c FROM s4_confirmation WHERE number=%s", (token,))[0]["c"] is None and not query(database, "SELECT * FROM customs_filing_request_tab"))
        filing = check("Persist original pending intent without official success", lambda: h.run("filing", filing_body, number, filing_tag, key=filing_key, confirmation=token))
        check("Pending intent keeps root4, official identifiers and actual dates NULL", lambda: filing["status"] == 4 and filing["execution"] == 1 and query(database, "SELECT external_declaration_number n,submitted_at s,released_at r FROM customs_declaration_tab")[0] == {"n": None, "s": None, "r": None})
        check("Original filing replay returns same request despite consumed confirmation", lambda: h.run("filing", filing_body, number, filing_tag, key=filing_key, confirmation=token) == filing)
        check("Source trigger freezes filing identity/content but permits status projection", lambda: sql_rejected(lambda: query(database, "UPDATE customs_filing_request_tab SET request_payload_json=JSON_OBJECT('tampered',true)")), "db_hard")
        check("Source trigger retains filing history against DELETE", lambda: sql_rejected(lambda: query(database, "DELETE FROM customs_filing_request_tab")), "db_hard")
        check("Injected transport timeout persists unknown3, never official submitted4", lambda: h.transport_unknown(filing["request"]))
        check("Unknown request prevents duplicate intent/new business number", lambda: rejected("CUSTOMS_EXECUTION_UNKNOWN", lambda: h.run("filing", filing_body, number, h.tag(number))))
        check("Unknown request prevents draft revision and occupancy release", lambda: rejected("CUSTOMS_EXECUTION_UNKNOWN", lambda: h.run("revise", {"baseRevisionNumber": exact_body()["revisionNumber"], "draft": replacement, "reason": "unknown"}, number, h.tag(number))))
        check("Unknown keeps exactly one original request and original immutable payload", lambda: len(query(database, "SELECT * FROM customs_filing_request_tab")) == 1 and query(database, "SELECT execution_status s FROM customs_filing_request_tab")[0]["s"] == 3)
        recovered_request = subprocess.run([sys.executable, str(Path(__file__)), "--replay", database],
            input=canonical({"test_secret": h.secret.hex(), "request": {"action": "filing", "body": filing_body,
                "number": number, "expected": filing_tag, "key": filing_key, "confirmation": token}}),
            text=True, capture_output=True, check=False)
        check("Fresh application process recovers original frozen receipt while current filing is unknown", lambda:
              recovered_request.returncode == 0 and json.loads(recovered_request.stdout) == filing)
        evidence_body = {"requestNumber": filing["request"], "revisionNumber": exact_body()["revisionNumber"],
                         "sourceEventKey": "SYNTHETIC-SOURCE-CLAIM", "externalReferenceNumber": "SYNTHETIC-CLAIMED-RELEASE",
                         "claimedEventTypeCode": 11, "occurredAt": "2026-10-25T01:00:00.123Z", "files": [authority_file]}
        check("Unregistered alleged official event kind rejected", lambda: rejected("CUSTOMS_CONTENT_INVALID", lambda: h.run("evidence", {**evidence_body, "claimedEventTypeCode": 99}, number, h.tag(number))))
        check("Ready packing-list file cannot masquerade as authority receipt21", lambda: rejected("FILE_PURPOSE_INVALID", lambda: h.run("evidence", {**evidence_body, "files": [file]}, number, h.tag(number))))
        evidence = check("Register alleged official evidence pending only in business event17", lambda: h.run("evidence", evidence_body, number, h.tag(number)))
        duplicate = h.run("evidence", evidence_body, number, h.tag(number))
        check("Stable source claim deduplicates without acquiring verified external key", lambda: evidence["event"] == duplicate["event"] and query(database, "SELECT COUNT(*) n FROM customs_event_tab WHERE external_event_key IS NOT NULL")[0]["n"] == 0)
        check("Same source claim changed content rejected", lambda: rejected("CUSTOMS_EVENT_CONFLICT", lambda: h.run("evidence", {**evidence_body, "externalReferenceNumber": "SYNTHETIC-ALTERED-CLAIM"}, number, h.tag(number))))
        verify_body = {"evidenceEventNumber": evidence["event"], "outcome": "approve", "verificationProfileReference": "SYNTHETIC-NOT-TRUSTED"}
        check("Evidence submitter cannot self-verify even with dual reviewer role", lambda: rejected("CUSTOMS_SELF_REVIEW", lambda: h.run("verify", verify_body, number, h.tag(number))))
        check("No actual customs channel blocks independent release verification", lambda: rejected("CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED", lambda: h.run("verify", verify_body, number, h.tag(number), subject="R")), "blocked_expected", "CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED")
        check("Reject unverifiable evidence as local decision, not customs rejection", lambda: h.run("verify", {**verify_body, "outcome": "return", "reason": "官方来源未核实"}, number, h.tag(number), subject="R"))
        for role in (1, 2):
            check("Formal attachment2 delivery to role" + str(role) + " blocked without submitted original", lambda r=role: rejected("CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED", lambda: h.run("deliver", {"recipientPartyRoleCode": r, "file": file}, number, h.tag(number))), "blocked_expected", "CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED")
        check("A cannot receive B attachment and F cannot receive A", lambda:
              rejected("CUSTOMS_RECIPIENT_MISMATCH", lambda: recipient(1, 2)) and rejected("CUSTOMS_RECIPIENT_MISMATCH", lambda: recipient(6, 1)), "semantic")
        check("Official correction/withdrawal cannot bypass missing source authority", lambda: rejected("CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED", official_gate), "blocked_expected", "CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED")
        check("No synthetic official8..14 event, external key, submitted/released date or attachment15/16 success fabricated", lambda:
              query(database, "SELECT COUNT(*) n FROM customs_event_tab WHERE event_type_code BETWEEN 8 AND 16")[0]["n"] == 0 and
              query(database, "SELECT COUNT(*) n FROM customs_event_tab WHERE external_event_key IS NOT NULL")[0]["n"] == 0)
        check("Current source DDL fingerprint unchanged during this run", lambda: hashlib.sha256((ROOT / "doc/sql/domain/schema.sql").read_bytes()).hexdigest() == source_hash, "db_hard")
    except Exception as error:
        failure = type(error).__name__ + ": " + str(error)
        if not checks or checks[-1]["passed"]:
            checks.append({"name": "Run failed outside named check", "category": "runtime", "expected": "Complete run", "observed": failure, "passed": False})
    finally:
        for key in keys:
            try:
                versions.append((BUCKETS[1], key, admin.head_object(Bucket=BUCKETS[1], Key=key)["VersionId"]))
            except ClientError as error:
                if error.response["Error"]["Code"] not in ("404", "NoSuchKey", "NotFound"):
                    failure = failure or "Cleanup head failed: " + error.response["Error"]["Code"]
        for bucket, key, version in set(versions):
            admin.delete_object(Bucket=bucket, Key=key, VersionId=version)
        cleaned = True
        for bucket, key, version in set(versions):
            try:
                admin.get_object(Bucket=bucket, Key=key, VersionId=version)
                cleaned = False
            except ClientError as error:
                if error.response["Error"]["Code"] not in ("NoSuchVersion", "NoSuchKey", "404"):
                    raise
        checks.append({"name": "Only this run's exact S3 versions cleaned", "category": "real_middleware",
                       "expected": "All enumerated current-run VersionIds absent", "observed": cleaned, "passed": cleaned})
        unchanged = before == shared.application_baseline()
        checks.append({"name": "Original application row counts unchanged", "category": "db_hard",
                       "expected": "All original table counts equal", "observed": unchanged, "passed": unchanged})
        for name in ("Real customs submission/acceptance/inspection/release", "Real customs return/correction/withdrawal",
                     "Real official attachment2 delivery and separate A/B receipt", "Production REST/RPC/IAM/authorization/e-signature",
                     "Automatic file recovery scheduling and official adapter"):
            checks.append({"name": name, "category": "not_verified", "expected": "Requires real authorized external evidence or implementation",
                           "observed": "Not claimed; no external success fixture fabricated", "passed": None})
        result = {"validationOnly": True, "database": database, "finishedAt": datetime.now(timezone.utc).isoformat(),
                  "sourceDDL": "doc/sql/domain/schema.sql", "sourceDDLSha256": source_hash, "coreTables": CORE,
                  "passed": sum(item["passed"] is True for item in checks), "failed": sum(item["passed"] is False for item in checks),
                  "unverified": sum(item["passed"] is None for item in checks), "checks": checks,
                  "failure": failure, "applicationBeforeAfterEqual": unchanged, "testObjectsCleaned": cleaned,
                  "limitations": ["Reduced synthetic approved snapshot/role fixtures, not production authorization or canonical REST profile",
                                  "Synthetic A written material is only a local structural fact, not a valid signature/mandate",
                                  "Transport unknown is a local injected timeout, not a real official submission",
                                  "Fresh-process receipt replay receives the same ephemeral test HMAC key via private stdin; production key management is not tested",
                                  "Manual lease expiry and fresh worker process verify resumability, not an automatic scheduler"]}
        target = Path(output)
        if not target.is_absolute():
            target = ROOT / target
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(result, ensure_ascii=False, indent=2, default=str) + "\n")
        print(json.dumps({key: result[key] for key in ("database", "passed", "failed", "unverified", "sourceDDLSha256")}, ensure_ascii=False))
    if failure or not cleaned or not unchanged:
        raise RuntimeError(failure or "Cleanup or baseline mismatch")


def s3_overwrite_rejected(storage, key):
    try:
        storage.put_object(Bucket=BUCKETS[1], Key=key, Body=b"not-original", IfNoneMatch="*")
    except ClientError as error:
        assert error.response["Error"]["Code"] in ("PreconditionFailed", "ConditionalRequestConflict")
        return True
    raise AssertionError("Stable final key was overwritten")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", help="Explicit JSON result path; no report is generated by default")
    parser.add_argument("--worker", nargs=2)
    parser.add_argument("--replay")
    parser.add_argument("--crash-after-put", action="store_true")
    args = parser.parse_args()
    if args.worker:
        file_worker(*args.worker, crash_after_put=args.crash_after_put)
    elif args.replay:
        replay = json.loads(sys.stdin.read())
        secret = bytes.fromhex(replay["test_secret"])
        if len(secret) != 32:
            raise ValueError("A 32-byte test key is required")
        print(canonical(Customs(args.replay, secret).run(**replay["request"])))
    else:
        if not args.output:
            parser.error("--output is required for verification")
        main(args.output)
