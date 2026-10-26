"""Isolated real-dependency N22/N23 tests; never a normal-closure success E2E."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from decimal import Decimal
import hashlib
import hmac
import importlib
import json
import re
import secrets
import threading
import uuid
from pathlib import Path

import pymysql
from botocore.exceptions import ClientError
from s3 import BASE, BUCKETS, client, root_credentials
from verify_antivirus_support import scan, scan_database_fresh

shared = importlib.import_module("verify-step-flows")
connect, query, Rejected = shared.connect, shared.query, shared.Rejected
ROOT = Path(__file__).resolve().parents[2]
TRADE = "SYNTHETIC-S8-" + "X" * 115
RULE = "S8-RECONCILIATION-1"
NOW = lambda: datetime.now(timezone.utc).replace(tzinfo=None)


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), default=str)


def digest(value):
    return hashlib.sha256(canonical(value).encode()).hexdigest()


def sql_vector(vector):
    return [{"context_code": source["type"], "business_number": source["id"],
             "revision_reference": source["revision"], "content_hash": source["hash"],
             "event_tail_reference": source["source_event_tail"]} for source in vector["sources"]]


def insert(cursor, table, values):
    cursor.execute("INSERT INTO `" + table + "` (" + ",".join("`" + key + "`" for key in values) +
                   ") VALUES (" + ",".join(["%s"] * len(values)) + ")", tuple(values.values()))
    return cursor.lastrowid


def parse_json(value):
    return json.loads(value) if isinstance(value, str) else value


class Reconciliation:
    """Reduced application gates on real entities, not deployed REST handlers."""
    def __init__(self, database):
        if not re.fullmatch(r"verify_reconciliation_[a-f0-9]{12}", database):
            raise ValueError("Only this run's random isolated database is permitted")
        self.database, self.secret = database, secrets.token_bytes(32)

    def rows(self, cursor, sql, values=()):
        cursor.execute(sql, values)
        return cursor.fetchall()

    def root(self, cursor):
        return self.rows(cursor, "SELECT * FROM trade_record_tab WHERE trade_number=%s FOR UPDATE", (TRADE,))[0]

    def sources(self, cursor):
        root = self.root(cursor)
        specs = [
            ("logistics_shipment_tab", "shipment_number", "trade_number", TRADE),
            ("customs_declaration_tab", "declaration_number", "trade_number", TRADE),
            ("tax_case_tab", "tax_case_number", "trade_number", TRADE),
            ("payment_transaction_tab", "transaction_number", "trade_number", TRADE),
            ("payment_fund_allocation_tab", "allocation_number", "trade_number", TRADE),
            ("account_tab", "account_number", "scope_key", TRADE),
            ("compliance_discrepancy_case_tab", "case_number", "trade_number", TRADE),
        ]
        sources = [{"type": "trade", "id": TRADE, "revision": str(root["revision_number"]),
                    "hash": digest({k: root[k] for k in ("revision_number", "approved_revision_number", "trade_status_code")}),
                    "source_event_tail": str(self.rows(cursor, "SELECT COALESCE(MAX(id),0) n FROM trade_event_tab "
                                                       "WHERE trade_record_id=%s AND event_type_code NOT IN(18,19,20)",
                                                       (root["id"],))[0]["n"])}]
        sets = []
        for table, number, owner, value in specs:
            if table == "account_tab":
                flow_rows = self.rows(cursor, "SELECT * FROM payment_fund_flow_tab ORDER BY flow_number FOR UPDATE")
                flow_ids = [row["flow_number"] for row in flow_rows]
                sets.append({"type": "payment_fund_flow_tab", "object_ids": flow_ids, "hash": digest(flow_ids)})
                sources.extend({"type": "payment_fund_flow_tab", "id": row["flow_number"], "revision": "1",
                                "hash": digest(row), "source_event_tail": str(row["id"])} for row in flow_rows)
            ordering = "id" if table == "account_tab" else number
            rows = self.rows(cursor, "SELECT * FROM `" + table + "` WHERE `" + owner + "`=%s ORDER BY `" + ordering + "` FOR UPDATE", (value,))
            ids = sorted(row[number] for row in rows)
            sets.append({"type": table, "object_ids": ids, "hash": digest(ids)})
            for row in rows:
                sources.append({"type": table, "id": row[number], "revision": str(row.get("version", 0)),
                                "hash": digest(row), "source_event_tail": str(row["id"])})
        # This single-trade isolated database has no unrelated case/flow/entry rows.
        for table, number in (("compliance_disposition_event_tab", "disposition_event_number"),
                              ("account_voucher_tab", "voucher_number"),
                              ("account_ledger_entry_tab", "entry_number")):
            rows = self.rows(cursor, "SELECT * FROM `" + table + "` ORDER BY `" + number + "` FOR UPDATE")
            ids = [row[number] for row in rows]
            sets.append({"type": table, "object_ids": ids, "hash": digest(ids)})
            for row in rows:
                sources.append({"type": table, "id": row[number], "revision": "1", "hash": digest(row),
                                "source_event_tail": str(row["id"])})
        value = {"sources": sources, "object_sets": sets, "rule_version": RULE}
        return {**value, "hash": digest(value)}

    def context(self):
        with connect(self.database) as connection, connection.cursor() as cursor:
            cursor.execute("SET TRANSACTION ISOLATION LEVEL READ COMMITTED")
            connection.begin()
            vector = self.sources(cursor)
            connection.commit()
            return vector

    def event(self, cursor, event_type, payload, actor, target=None):
        root = self.root(cursor)
        number = "S8-" + uuid.uuid4().hex
        insert(cursor, "trade_event_tab", {
            "event_number": number, "trade_record_id": root["id"], "revision_number": root["revision_number"],
            "event_type_code": event_type, "from_trade_status_code": 8 if target is not None else None,
            "to_trade_status_code": target, "actor_reference": actor, "reason_code": 1,
            "reason_text": "ISOLATED SYNTHETIC VALIDATION; no external success",
            "event_payload": canonical({"payload_schema_version": 1, **payload}),
            "trace_id": uuid.uuid4().hex, "occurred_at": NOW()})
        return number

    def dispositions(self, cursor):
        return [{**row, "snapshot": parse_json(row["decision_snapshot_json"])}
                for row in self.rows(cursor, "SELECT * FROM compliance_disposition_event_tab ORDER BY id FOR UPDATE")]

    def active_reasons(self, cursor):
        events = self.dispositions(cursor)
        holds = {row["disposition_event_number"] for row in events
                 if row["action_code"] == 2 and row["result_code"] == 2}
        releases = {row["snapshot"]["decision_details"]["hold_reference"]: row["disposition_event_number"]
                    for row in events if row["action_code"] == 8 and row["result_code"] == 2}
        acknowledgements = {row["snapshot"]["decision_details"]["decision_reference"]
                            for row in events if row["snapshot"].get("decision_type") == "gate_acknowledgement"
                            and row["snapshot"]["decision_details"]["phase"] == "applied"}
        # One target per hold in this reduced fixture; production requires ALL exact targets.
        released = {hold for hold, decision in releases.items() if decision in acknowledgements}
        return sorted(holds - released)

    def disposition(self, cursor, case_number, action, result, actor, decision_type, details,
                    approver=None, affected=None):
        number = "D8-" + uuid.uuid4().hex
        snapshot = {"action_code": action, "result_code": result, "reason_code": 1,
                    "actor_reference": actor, "decided_at": NOW().isoformat(timespec="milliseconds") + "Z",
                    "decision_type": decision_type, "decision_details": details,
                    "reason_text": "ISOLATED internal decision, not external evidence"}
        if approver:
            snapshot["approver_reference"] = approver
        contract = json.loads((ROOT / "doc/examples/step8/compliance-decision-contract.json").read_text())
        branch = contract["decision_details"][decision_type]
        if set(snapshot) - set(contract["required"] + contract["optional"]) or not set(contract["required"]) <= set(snapshot):
            raise Rejected("INVALID_DECISION_SCHEMA")
        if action != branch["action_code"] or result not in branch["result_codes"]:
            raise Rejected("INVALID_DECISION_SCHEMA")
        if set(details) - set(branch["required"] + branch["optional"]) or not set(branch["required"]) <= set(details):
            raise Rejected("INVALID_DECISION_SCHEMA")
        insert(cursor, "compliance_disposition_event_tab", {
            "disposition_event_number": number, "case_number": case_number, "action_code": action,
            "result_code": result, "actor_reference": actor, "approver_reference": approver, "reason_code": 1,
            "decision_snapshot_json": canonical(snapshot), "affected_contexts_json": canonical(affected or []),
            "evidence_reference": "SYNTHETIC-ONLY-FILE-REFERENCE", "occurred_at": NOW()})
        return {"disposition_number": number, "case_number": case_number, "action_code": action, "result_code": result}

    def report(self, cursor, number):
        rows = self.rows(cursor, "SELECT * FROM trade_event_tab WHERE event_number=%s AND event_type_code=18 FOR UPDATE", (number,))
        if not rows:
            raise Rejected("REPORT_NOT_FOUND")
        return parse_json(rows[0]["event_payload"])

    def checks(self, cursor):
        checks = []
        accounts = self.rows(cursor, "SELECT * FROM account_tab WHERE scope_key=%s ORDER BY id FOR UPDATE", (TRADE,))
        for account in accounts:
            entries = self.rows(cursor, "SELECT * FROM account_ledger_entry_tab WHERE account_id=%s ORDER BY id FOR UPDATE", (account["id"],))
            ledger = sum((row["amount"] if row["direction"] == 1 else -row["amount"] for row in entries), Decimal(0))
            if ledger != account["ledger_balance"]:
                checks.append("ACCOUNTING_UNBALANCED")
        for voucher in self.rows(cursor, "SELECT * FROM account_voucher_tab ORDER BY voucher_number FOR UPDATE"):
            entries = self.rows(cursor, "SELECT direction,amount FROM account_ledger_entry_tab WHERE voucher_number=%s FOR UPDATE",
                                (voucher["voucher_number"],))
            debit = sum((r["amount"] for r in entries if r["direction"] == 1), Decimal(0))
            credit = sum((r["amount"] for r in entries if r["direction"] == 2), Decimal(0))
            if debit != credit or debit != voucher["total_amount"]:
                checks.append("ACCOUNTING_UNBALANCED")
        flows = self.rows(cursor, "SELECT * FROM payment_fund_flow_tab ORDER BY flow_number FOR UPDATE")
        buckets = {1: Decimal(0), 2: Decimal(0), 3: Decimal(0)}
        for row in flows:
            if row["bucket_from"] in buckets:
                buckets[row["bucket_from"]] -= row["amount"]
            if row["bucket_to"] in buckets:
                buckets[row["bucket_to"]] += row["amount"]
        for account in accounts:
            if account["ledger_balance"] != buckets[account["internal_account_type_code"]]:
                checks.append("FUNDS_UNBALANCED")
        if self.active_reasons(cursor):
            checks.append("HOLD_ACTIVE")
        if self.rows(cursor, "SELECT case_number FROM compliance_discrepancy_case_tab WHERE case_status<>4 FOR UPDATE"):
            checks.append("OPEN_EXCEPTION")
        if self.rows(cursor, "SELECT difference_number FROM payment_reconcile_difference_tab WHERE handle_status<>4 FOR UPDATE"):
            checks.append("MONEY_DIFFERENCE_OPEN")
        if self.rows(cursor, "SELECT transaction_number FROM payment_transaction_tab WHERE transaction_status=5 FOR UPDATE"):
            checks.append("EXECUTION_UNKNOWN")
        # No official/actual bank integration: never invent success to satisfy these gates.
        checks.extend(["SOURCE_UNKNOWN", "EXTERNAL_EVIDENCE_MISSING"])
        return sorted(set(checks))

    def execute(self, action, body, key=None, actor="operator", expected=None, fail=False):
        key = key or str(uuid.uuid4())
        fingerprint = hmac.new(self.secret, canonical({"action": action, "body": body}).encode(), hashlib.sha256).hexdigest()
        with connect(self.database) as connection, connection.cursor() as cursor:
            cursor.execute("SET TRANSACTION ISOLATION LEVEL READ COMMITTED")
            connection.begin()
            try:
                def prior():
                    rows = self.rows(cursor, "SELECT * FROM middleware_s8_receipt WHERE actor=%s AND audience='internal' AND request_key=%s", (actor, key))
                    if rows:
                        if rows[0]["request_hash"] != fingerprint:
                            raise Rejected("IDEMPOTENCY_CONFLICT")
                        return parse_json(rows[0]["response"])
                result = prior()
                if result is not None:
                    connection.commit()
                    return result
                root = self.root(cursor)
                result = prior()
                if result is not None:
                    connection.commit()
                    return result
                if root["trade_status_code"] != 8:
                    raise Rejected("TERMINAL_TRADE")
                if expected is None:
                    raise Rejected("IF_MATCH_REQUIRED")
                if expected != self.sources(cursor)["hash"]:
                    raise Rejected("REVISION_CONFLICT")
                if "case" in body:
                    cases = self.rows(cursor, "SELECT * FROM compliance_discrepancy_case_tab WHERE case_number=%s AND trade_number=%s FOR UPDATE",
                                      (body["case"], TRADE))
                    if not cases:
                        raise Rejected("CASE_NOT_FOUND")
                    if cases[0]["case_status"] == 4 and action in ("hold", "case_close_apply", "case_close"):
                        raise Rejected("CASE_TERMINAL")
                if action == "report":
                    vector = self.sources(cursor)
                    report = {"report_schema_version": 1, "source_version_vector": sql_vector(vector),
                              "object_sets": vector["object_sets"], "rule_version": RULE,
                              "checks": [{"item_number": code, "rule_code": code, "result": 3 if
                                          code in ("SOURCE_UNKNOWN", "EXTERNAL_EVIDENCE_MISSING") else 2,
                                          "expected_decimal": "", "observed_decimal": "", "currency_code": "CNY",
                                          "sources": [], "evidence": [], "blocking_codes": [code],
                                          "explanation": "Reduced isolated entity gate; not official evidence"}
                                         for code in self.checks(cursor)], "evidence_references": []}
                    result = {"report_number": self.event(cursor, 18, report, actor),
                              "vector_hash": vector["hash"]}
                elif action == "case":
                    number = "C8-" + uuid.uuid4().hex
                    insert(cursor, "compliance_discrepancy_case_tab", {
                        "case_number": number, "case_type_code": 4, "severity_code": 2, "owner_context_code": "trade",
                        "owner_business_number": TRADE, "trade_number": TRADE, "scope_code": 1,
                        "case_status": 1, "evidence_manifest_json": "[]", "opened_at": NOW()})
                    result = {"case_number": number}
                elif action == "hold":
                    if actor == body["applicant"]:
                        raise Rejected("SELF_REVIEW")
                    result = self.disposition(cursor, body["case"], 2, 2, body["applicant"], "hold_decision",
                                              {"reason": body["reason"], "affected_contexts": [{
                                                  "context_code": "funds", "business_reference": TRADE, "scope_code": 1,
                                                  "operations": ["approve-payment", "execute-payment"],
                                                  "source": {"type": "trade", "id": TRADE, "revision": str(root["revision_number"]),
                                                             "hash": digest({"trade": TRADE, "revision": root["revision_number"]}),
                                                             "source_event_tail": "SYNTHETIC-INTERNAL-ROOT"}}]}, actor,
                                              [{"context_code": "funds", "business_reference": TRADE, "scope_code": 1,
                                                "action_code": 2, "expected_acknowledgement": True}])
                elif action == "release_apply":
                    hold = next((row for row in self.dispositions(cursor) if row["disposition_event_number"] == body["hold"]), None)
                    if hold is None or hold["case_number"] != body["case"] or body["hold"] not in self.active_reasons(cursor):
                        raise Rejected("SCOPE_MISMATCH")
                    result = self.disposition(cursor, body["case"], 7, 1, actor, "release_application",
                                              {"hold_reference": body["hold"], "source_version_vector": sql_vector(self.sources(cursor)),
                                               "object_sets": self.sources(cursor)["object_sets"], "rule_version": RULE,
                                               "substantive_dispositions": [], "evidence_references": []})
                elif action == "release_decide":
                    application = next((row for row in self.dispositions(cursor) if row["disposition_event_number"] == body["application"]), None)
                    if not application or application["case_number"] != body["case"] or application["action_code"] != 7:
                        raise Rejected("SCOPE_MISMATCH")
                    if application["actor_reference"] == actor:
                        raise Rejected("SELF_REVIEW")
                    hold = application["snapshot"]["decision_details"]["hold_reference"]
                    if hold not in self.active_reasons(cursor):
                        raise Rejected("SCOPE_MISMATCH")
                    result = self.disposition(cursor, body["case"], 8, 2, application["actor_reference"], "release_decision",
                                              {"hold_reference": hold, "application_reference": body["application"],
                                               "validation_basis": "internal synthetic clerical reason only",
                                               "source_version_vector": sql_vector(self.sources(cursor)),
                                               "object_sets": self.sources(cursor)["object_sets"],
                                               "evidence_references": []}, actor)
                elif action == "ack":
                    target = next((row for row in self.dispositions(cursor) if row["disposition_event_number"] == body["decision"]), None)
                    if not target or target["case_number"] != body["case"] or target["action_code"] != 8:
                        raise Rejected("SCOPE_MISMATCH")
                    result = self.disposition(cursor, body["case"], 4, 1, actor, "gate_acknowledgement",
                                              {"decision_reference": body["decision"], "phase": "applied",
                                               "hold_reference": target["snapshot"]["decision_details"]["hold_reference"]})
                elif action == "case_close_apply":
                    result = self.disposition(cursor, body["case"], 9, 1, actor, "case_closure_application",
                                              {"source_version_vector": sql_vector(self.sources(cursor)),
                                               "object_sets": self.sources(cursor)["object_sets"],
                                               "substantive_dispositions": [], "money_difference_closure": None,
                                               "evidence_references": []})
                elif action == "case_close":
                    application = next((row for row in self.dispositions(cursor) if row["disposition_event_number"] == body["application"]), None)
                    if not application or application["case_number"] != body["case"] or application["snapshot"]["decision_type"] != "case_closure_application":
                        raise Rejected("SCOPE_MISMATCH")
                    if application["actor_reference"] == actor:
                        raise Rejected("SELF_REVIEW")
                    if self.rows(cursor, "SELECT difference_number FROM payment_reconcile_difference_tab WHERE handle_status<>4 FOR UPDATE"):
                        raise Rejected("MONEY_DIFFERENCE_OPEN")
                    result = self.disposition(cursor, body["case"], 9, 2, application["actor_reference"], "case_closure_decision",
                                              {"application_reference": body["application"],
                                               "scope": "internal clerical discrepancy; hold release remains separate",
                                               "source_version_vector": sql_vector(self.sources(cursor)),
                                               "object_sets": self.sources(cursor)["object_sets"],
                                               "evidence_references": []}, actor)
                    cursor.execute("UPDATE compliance_discrepancy_case_tab SET case_status=4,closed_at=UTC_TIMESTAMP(3) WHERE case_number=%s", (body["case"],))
                elif action in ("closure", "closure_decide"):
                    report = self.report(cursor, body["report"])
                    current = self.sources(cursor)
                    if report["source_version_vector"] != sql_vector(current) or report["object_sets"] != current["object_sets"]:
                        raise Rejected("REPORT_STALE")
                    if report["rule_version"] != RULE:
                        raise Rejected("RULE_VERSION_STALE")
                    blockers = self.checks(cursor)
                    for code in ("FUNDS_UNBALANCED", "ACCOUNTING_UNBALANCED", "HOLD_ACTIVE",
                                 "MONEY_DIFFERENCE_OPEN", "EXECUTION_UNKNOWN", "OPEN_EXCEPTION",
                                 "SOURCE_UNKNOWN", "EXTERNAL_EVIDENCE_MISSING"):
                        if code in blockers:
                            raise Rejected(code)
                    # Deliberately unavailable: this harness cannot certify the missing external evidence.
                    raise Rejected("EXTERNAL_EVIDENCE_MISSING")
                else:
                    raise Rejected("INVALID_ACTION")
                if fail:
                    raise Rejected("INJECTED_PARTIAL_WRITE")
                insert(cursor, "middleware_s8_receipt", {"actor": actor, "audience": "internal", "request_key": key,
                                                        "request_hash": fingerprint, "response": canonical(result)})
                connection.commit()
                return result
            except Exception:
                connection.rollback()
                raise


def install(database, ddl):
    with connect() as connection, connection.cursor() as cursor:
        cursor.execute("CREATE DATABASE `" + database + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin")
        cursor.execute("USE `" + database + "`")
        tables = re.findall(r"CREATE TABLE `[^`]+` \([\s\S]*?\) ENGINE=InnoDB[^;]*;", ddl)
        for statement in tables:
            cursor.execute(statement)
        # Keep composite BEGIN/END bodies intact, not split on internal semicolons.
        triggers = re.findall(r"CREATE TRIGGER (?:(?!CREATE TRIGGER)[\s\S])*?(?:END\$\$|;(?=\s*(?:CREATE TRIGGER|DELIMITER|$)))", ddl)
        for statement in triggers:
            cursor.execute(statement.removesuffix("$$"))
        cursor.execute("CREATE TABLE middleware_s8_receipt (actor VARCHAR(64),audience VARCHAR(16),request_key CHAR(36),"
                       "request_hash CHAR(64) NOT NULL,response JSON NOT NULL,PRIMARY KEY(actor,audience,request_key)) ENGINE=InnoDB")
        insert(cursor, "trade_record_tab", {
            "trade_number": TRADE, "trade_status_code": 8, "revision_number": 1, "approved_revision_number": 1,
            "transaction_goods_items_json": "[]", "transaction_filing_document_references_json": "[]",
            "transaction_filing_source_and_version_json": "{}", "transaction_filing_missing_information_json": "[]",
            "creation_payload_hmac": "0" * 64, "creation_payload_hmac_key_version": "SYNTHETIC-INTERNAL-FIXTURE"})
    return len(tables), len(triggers)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    target = Path(args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    ddl = (ROOT / "doc/sql/domain/schema.sql").read_text()
    database = "verify_reconciliation_" + secrets.token_hex(6)
    tables, triggers = install(database, ddl)
    h = Reconciliation(database)
    checks, versions = [], []

    def check(name, test, layer="application-gate"):
        value = test()
        if value is False:
            raise AssertionError(name)
        checks.append({"name": name, "passed": True, "layer": layer})
        return value

    def refused(code, test):
        try:
            test()
        except Rejected as error:
            assert str(error) == code, (code, str(error))
            return True
        raise AssertionError("Expected rejection " + code)

    def run(action, body=None, **kwargs):
        return h.execute(action, body or {}, expected=h.context()["hash"], **kwargs)

    credentials = json.loads((BASE / "s3-client.json").read_text())
    storage, admin = client(credentials["access_key"], credentials["secret_key"]), client(*root_credentials())
    object_key = "_step-eight-validation/" + secrets.token_hex(16)
    try:
        check("Current authoritative DDL copied only to random isolated database", lambda: tables == 47, "database")
        check("Actual immutable-event and frozen-content triggers installed", lambda: triggers > 20, "database")
        material = (ROOT / "doc/examples/step8/material.html").read_bytes()
        sha = hashlib.sha256(material).hexdigest()
        check("Actual ClamAV current signatures scan original synthetic material", lambda: scan_database_fresh() and scan(material).endswith(": OK"), "ClamAV")
        for bucket in BUCKETS[:2]:
            version = storage.put_object(Bucket=bucket, Key=object_key, Body=material, IfNoneMatch="*")["VersionId"]
            versions.append((bucket, object_key, version))
            check("Exact S3 VersionId and digest verified: " + bucket,
                  lambda b=bucket, v=version: hashlib.sha256(storage.get_object(Bucket=b, Key=object_key, VersionId=v)["Body"].read()).hexdigest() == sha, "S3")
        try:
            storage.put_object(Bucket=BUCKETS[1], Key=object_key, Body=b"changed", IfNoneMatch="*")
        except ClientError as error:
            assert error.response["Error"]["Code"] in ("PreconditionFailed", "ConditionalRequestConflict")
            check("Conditional S3 write refuses overwrite of stable key", lambda: True, "S3")
        else:
            raise AssertionError("S3 overwrite accepted")
        with connect(database) as connection, connection.cursor() as cursor:
            insert(cursor, "document_file_tab", {"logical_file_number": "FILE-S8-SYNTHETIC", "revision_number": 1,
                "revision_status_code": 2, "display_name": "Original synthetic reconciliation note", "document_type_code": 3,
                "storage_path": BUCKETS[1] + "/" + object_key + "?versionId=" + versions[-1][2], "sha256": sha,
                "size_bytes": len(material), "media_type": "text/html", "access_scope_json": '{"validation_only":true}',
                "created_by": "SYNTHETIC"})
        key = str(uuid.uuid4())
        original_tag = h.context()["hash"]
        first = check("Immutable report18 persists complete source vector/object sets and rule", lambda: h.execute("report", {}, key=key, expected=original_tag))
        payload = parse_json(query(database, "SELECT event_payload p FROM trade_event_tab WHERE event_number=%s", (first["report_number"],))[0]["p"])
        check("Scanned synthetic S3 file never satisfies official evidence gate",
              lambda: any(row["rule_code"] == "EXTERNAL_EVIDENCE_MISSING" and row["result"] == 3 for row in payload["checks"]))
        check("Five concurrent same-key requests replay one frozen receipt",
              lambda: all(result == first for result in ThreadPoolExecutor(max_workers=5).map(
                  lambda _: h.execute("report", {}, key=key, expected="stale"), range(5))))
        check("Same key altered content conflicts", lambda: refused("IDEMPOTENCY_CONFLICT", lambda: h.execute("report", {"changed": True}, key=key, expected=original_tag)))
        check("Missing strong tag rejected", lambda: refused("IF_MATCH_REQUIRED", lambda: h.execute("case", {})))
        c1 = check("Create first genuine isolated compliance case", lambda: run("case"))["case_number"]
        c2 = check("Create second independent case", lambda: run("case"))["case_number"]
        check("Unknown case cannot acquire a business hold despite absent SQL foreign keys",
              lambda: refused("CASE_NOT_FOUND", lambda: run("hold", {"case": "NONEXISTENT", "applicant": "owner", "reason": "invalid"}, actor="reviewer")))
        check("128-character owner business reference preserved", lambda: query(database, "SELECT owner_business_number n FROM compliance_discrepancy_case_tab LIMIT 1")[0]["n"] == TRADE, "database")
        check("Old report detects newly inserted object set", lambda: refused("REPORT_STALE", lambda: run("closure", {"report": first["report_number"]})))
        def hold(case, reason):
            return run("hold", {"case": case, "applicant": "case-owner", "reason": reason}, actor="independent")["disposition_number"]
        hold1, hold2, hold3 = hold(c1, "clerical-A"), hold(c2, "clerical-B"), hold(c1, "clerical-C")
        def active():
            with connect(database) as connection, connection.cursor() as cursor:
                return h.active_reasons(cursor)
        check("Two cases and same-case third reason all independently active", lambda: set(active()) == {hold1, hold2, hold3})
        check("Hold decision never overwrites trade lifecycle8", lambda: query(database, "SELECT trade_status_code s FROM trade_record_tab")[0]["s"] == 8)
        app = run("release_apply", {"case": c1, "hold": hold1}, actor="case-owner")["disposition_number"]
        check("Release application alone does not unlock", lambda: len(active()) == 3)
        check("Self-review prohibited", lambda: refused("SELF_REVIEW", lambda: run("release_decide", {"case": c1, "application": app}, actor="case-owner")))
        check("Cross-case release cannot borrow another application", lambda: refused("SCOPE_MISMATCH", lambda: run("release_decide", {"case": c2, "application": app}, actor="reviewer")))
        released = run("release_decide", {"case": c1, "application": app}, actor="reviewer")["disposition_number"]
        check("Release decision pending propagation still blocks", lambda: len(active()) == 3)
        run("ack", {"case": c1, "decision": released}, actor="funds-owner")
        check("Only acknowledged original reason removed; other case/same-case remain", lambda: set(active()) == {hold2, hold3})
        close_application = run("case_close_apply", {"case": c1}, actor="case-owner")["disposition_number"]
        check("Case closure application is not closure or release", lambda: len(active()) == 2 and query(
            database, "SELECT case_status s FROM compliance_discrepancy_case_tab WHERE case_number=%s", (c1,))[0]["s"] == 1)
        check("Case closure also prohibits original applicant self-review", lambda: refused("SELF_REVIEW", lambda: run(
            "case_close", {"case": c1, "application": close_application}, actor="case-owner")))
        run("case_close", {"case": c1, "application": close_application}, actor="reviewer")
        check("Independent case close does not release remaining reason", lambda: set(active()) == {hold2, hold3})
        check("Closed case disallows new pause intentions but still permits separate original release",
              lambda: refused("CASE_TERMINAL", lambda: run("hold", {"case": c1, "applicant": "owner", "reason": "new"}, actor="reviewer")))
        report_hold = run("report")
        check("Latest report cannot close while hold reasons active", lambda: refused("HOLD_ACTIVE", lambda: run("closure", {"report": report_hold["report_number"]})))
        before = len(query(database, "SELECT * FROM compliance_discrepancy_case_tab"))
        check("Injected partial business write rolls back", lambda: refused("INJECTED_PARTIAL_WRITE", lambda: run("case", fail=True)))
        check("Rollback leaves no partial case or receipt", lambda: len(query(database, "SELECT * FROM compliance_discrepancy_case_tab")) == before)
        # Deliberately inconsistent internal projections, never a fabricated bank credit.
        with connect(database) as connection, connection.cursor() as cursor:
            account_id = insert(cursor, "account_tab", {"internal_account_type_code": 1, "account_number": "ACC-S8-SYNTHETIC",
                "scope_key": TRADE, "currency_code": "CNY", "account_status": 1, "ledger_balance": "0.01"})
        unbalanced = run("report")
        check("CNY one-cent unbacked projection blocks normal closure", lambda: refused("FUNDS_UNBALANCED", lambda: run("closure", {"report": unbalanced["report_number"]})))
        with connect(database) as connection, connection.cursor() as cursor:
            cursor.execute("UPDATE account_tab SET ledger_balance=0 WHERE id=%s", (account_id,))
            insert(cursor, "account_voucher_tab", {"voucher_number": "VCH-S8-INCOMPLETE-FIXTURE",
                "business_type_code": "SYNTHETIC-INVALID", "business_number": TRADE, "transaction_date": "2026-11-01",
                "accounting_period": "202611", "currency_code": "CNY", "total_amount": "1.00", "voucher_status": 2,
                "idempotency_key": "SYNTHETIC-VOUCHER-INCOMPLETE", "request_hash": "0" * 64})
        accounting = run("report")
        check("Incomplete synthetic voucher fails debit/credit/amount reconciliation independently",
              lambda: refused("ACCOUNTING_UNBALANCED", lambda: run("closure", {"report": accounting["report_number"]})))
        query(database, "DELETE FROM account_voucher_tab WHERE voucher_number='VCH-S8-INCOMPLETE-FIXTURE'")
        with connect(database) as connection, connection.cursor() as cursor:
            insert(cursor, "payment_reconcile_difference_tab", {"difference_number": "DIFF-S8-SYNTHETIC", "bank_account_id": 1,
                "reconcile_date": "2026-11-01", "currency_code": "CNY", "difference_type": 3, "handle_status": 2,
                "owner_reference": "SYNTHETIC", "bank_amount": None, "internal_amount": "0.01"})
        close_application2 = run("case_close_apply", {"case": c2}, actor="case-owner")["disposition_number"]
        check("Compliance cannot close on behalf of open money difference", lambda: refused("MONEY_DIFFERENCE_OPEN", lambda: run("case_close", {"case": c2, "application": close_application2}, actor="reviewer")))
        query(database, "DELETE FROM payment_reconcile_difference_tab WHERE difference_number='DIFF-S8-SYNTHETIC'")
        for case, hold_number in ((c2, hold2), (c1, hold3)):
            app_number = run("release_apply", {"case": case, "hold": hold_number}, actor="case-owner")["disposition_number"]
            decision = run("release_decide", {"case": case, "application": app_number}, actor="reviewer")["disposition_number"]
            run("ack", {"case": case, "decision": decision}, actor="funds-owner")
        run("case_close", {"case": c2, "application": close_application2}, actor="reviewer")
        check("All reason releases require their own approvals and acknowledgements", lambda: active() == [])
        fresh = run("report")
        check("No exceptions and zero balances still cannot certify unknown external domains",
              lambda: refused("SOURCE_UNKNOWN", lambda: run("closure", {"report": fresh["report_number"]})))
        tag = h.context()["hash"]
        competing = list(ThreadPoolExecutor(max_workers=2).map(
            lambda action: h.execute(action, {}, expected=tag), ["report", "report"]))
        check("Concurrent reports retain independent immutable report events", lambda: len({r["report_number"] for r in competing}) == 2)
        with connect(database) as connection, connection.cursor() as cursor:
            insert(cursor, "payment_transaction_tab", {"transaction_number": "PAY-S8-UNKNOWN", "transaction_type": 5,
                "source_context_code": "trade", "trade_number": TRADE, "amount": "1.00", "currency_code": "CNY",
                "source_lines_json": "[]", "execution_basis_json": "{}", "transaction_status": 5,
                "request_number": "S8-SYNTHETIC-UNKNOWN", "request_hash": "0" * 64, "approval_snapshot_json": "{}",
                "result_snapshot_json": '{"execution_status_code":3,"completed_at":null}', "lifecycle_events_json": "[]"})
        unknown = run("report")
        check("Explicit unresolved local execution is not assumed failed or complete", lambda: refused("EXECUTION_UNKNOWN", lambda: run("closure", {"report": unknown["report_number"]})))
        check("Current root event/collection mutation invalidates concurrent old report", lambda: refused("REPORT_STALE", lambda: run("closure", {"report": competing[0]["report_number"]})))
        latest = run("report")
        old_tag = h.context()["hash"]
        started = threading.Event()
        with ThreadPoolExecutor(max_workers=1) as pool, connect(database) as connection, connection.cursor() as cursor:
            connection.begin()
            h.root(cursor)
            def waiting_closure():
                started.set()
                return refused("REVISION_CONFLICT", lambda: h.execute("closure", {"report": latest["report_number"]}, expected=old_tag))
            pending = pool.submit(waiting_closure)
            assert started.wait(2)
            cursor.execute("UPDATE trade_record_tab SET revision_number=2 WHERE trade_number=%s", (TRADE,))
            connection.commit()
            check("Real competing root lock/current read rejects stale closure after writer commit", lambda: pending.result(timeout=8))
        for table in ("trade_event_tab", "compliance_disposition_event_tab"):
            try:
                query(database, "UPDATE `" + table + "` SET created_at=created_at")
            except pymysql.err.OperationalError as error:
                assert error.args[0] == 1644
                check("Actual DB append-only trigger rejects rewrite: " + table, lambda: True, "database")
            else:
                raise AssertionError("Missing append-only trigger " + table)
        # Explicit terminal fixture is not generated by pretending the missing closure prerequisites passed.
        query(database, "UPDATE trade_record_tab SET trade_status_code=10 WHERE trade_number=%s", (TRADE,))
        check("Terminal10 still replays exact original report before new-state checks",
              lambda: h.execute("report", {}, key=key, expected="stale") == first)
        check("Terminal10 rejects every new intent", lambda: refused("TERMINAL_TRADE", lambda: run("report")))
        check("No fake official closure/application events emitted", lambda: not query(database, "SELECT id FROM trade_event_tab WHERE event_type_code IN(17,19)"))
        contract = json.loads((ROOT / "doc/examples/step8/compliance-decision-contract.json").read_text())
        def closed_decisions():
            for row in query(database, "SELECT action_code,result_code,decision_snapshot_json FROM compliance_disposition_event_tab"):
                snapshot = parse_json(row["decision_snapshot_json"])
                branch = contract["decision_details"][snapshot["decision_type"]]
                assert set(branch["required"]) <= set(snapshot["decision_details"]) <= set(branch["required"] + branch["optional"])
                assert row["action_code"] == branch["action_code"] and row["result_code"] in branch["result_codes"]
            return True
        check("All persisted compliance business decisions satisfy closed branch/action/result whitelist", closed_decisions)
    finally:
        for bucket, key, version in versions:
            admin.delete_object(Bucket=bucket, Key=key, VersionId=version)
    check("Only exact S3 versions created by this run cleaned",
          lambda: all(not any(item["VersionId"] == version for item in admin.list_object_versions(
              Bucket=bucket, Prefix=key).get("Versions", [])) for bucket, key, version in versions), "S3")
    report = {
        "validationOnly": True, "database": database, "sourceDdlSha256": hashlib.sha256(ddl.encode()).hexdigest(),
        "coreTablesCopied": tables, "triggersCopied": triggers, "passed": len(checks), "checks": checks,
        "dependencies": ["real MySQL READ COMMITTED", "real private S3 VersionId", "real ClamAV"],
        "finishedAt": datetime.now(timezone.utc).isoformat(), "testObjectsCleaned": True,
        "applicationDatabaseAccessed": False, "normalClosureE2EProven": False,
        "notProven": ["Production REST/RPC and IAM/confirmation authorization",
                      "Real customs, bank, tax, signed contract or A receipt success",
                      "Full cross-domain reconciliation/normal closure E2E; only reduced entity gates tested",
                      "All production owner gate consumers, multi-target propagation, correction graph execution and workers",
                      "Full external evidence authenticity, source canonicalization and domain-wide conservation rules",
                      "Terminal10 is an explicit synthetic fixture, not a successful normal closure"]}
    target.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"passed": len(checks), "database": database, "tables": tables,
                      "triggers": triggers, "output": str(target), "normalClosureE2EProven": False}, ensure_ascii=False))


if __name__ == "__main__":
    main()
