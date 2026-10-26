"""Step-five isolated entity checks; not production handlers or bank integration."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import subprocess
import sys

import pymysql
from botocore.exceptions import ClientError

ROOT = Path(__file__).resolve().parents[2]
BASE = Path.home() / "Library/ExportTradeLocal"
MYSQL_CONFIG = BASE / "root-client.cnf"
DDL = ROOT / "doc/sql/domain/schema.sql"
EXPECTED_DDL_SHA256 = "489bb342ade74d14da570e233c058527310df4b0374bec5bcda9dec93248e5a9"
CORE_TABLES = [
    "payment_bank_account_tab",
    "payment_transaction_tab",
    "payment_fund_allocation_tab",
    "payment_fund_flow_tab",
    "payment_reconcile_difference_tab",
    "account_tab",
    "account_voucher_tab",
    "account_ledger_entry_tab",
]
APPEND_ONLY_TABLES = ["payment_fund_flow_tab", "account_ledger_entry_tab"]


def connect(database):
    if not re.fullmatch(r"verify_step_five_[a-f0-9]{12}", database):
        raise ValueError("Connection refused: isolated step-five database name required")
    connection = pymysql.connect(
        read_default_file=str(MYSQL_CONFIG), database=database, charset="utf8mb4",
        autocommit=True, connect_timeout=3, read_timeout=8, write_timeout=8,
        cursorclass=pymysql.cursors.DictCursor,
    )
    with connection.cursor() as cursor:
        cursor.execute("SET time_zone='+00:00'")
        cursor.execute("SET SESSION innodb_lock_wait_timeout=1")
    return connection


def create_database(database):
    if not re.fullmatch(r"verify_step_five_[a-f0-9]{12}", database):
        raise ValueError("Refusing non-random validation database")
    connection = pymysql.connect(
        read_default_file=str(MYSQL_CONFIG), database="information_schema",
        charset="utf8mb4", autocommit=True, connect_timeout=3, read_timeout=8,
        write_timeout=8, cursorclass=pymysql.cursors.DictCursor,
    )
    try:
        with connection.cursor() as cursor:
            cursor.execute("CREATE DATABASE `" + database +
                           "` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin")
    finally:
        connection.close()


def query(database, sql, args=()):
    with connect(database) as connection, connection.cursor() as cursor:
        cursor.execute(sql, args)
        return cursor.fetchall()


def mysql_statements(source):
    delimiter = ";"
    buffer = []
    quote = None
    block_comment = False
    line_comment = False
    index = 0
    while index < len(source):
        at_line_start = index == 0 or source[index - 1] == "\n"
        if at_line_start and quote is None and not block_comment and not line_comment:
            end = source.find("\n", index)
            end = len(source) if end < 0 else end
            line = source[index:end]
            directive = re.fullmatch(r"\s*DELIMITER\s+(\S+)\s*", line, re.IGNORECASE)
            if directive:
                pending = "".join(buffer)
                if re.search(r"\b(?:CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)\b", pending, re.I):
                    raise AssertionError("Unexpected DELIMITER change inside a SQL statement")
                delimiter = directive.group(1)
                index = end + (end < len(source))
                continue
        char = source[index]
        next_two = source[index:index + 2]
        if line_comment:
            buffer.append(char)
            if char == "\n":
                line_comment = False
            index += 1
            continue
        if block_comment:
            buffer.append(char)
            if next_two == "*/":
                buffer.append("/")
                block_comment = False
                index += 2
            else:
                index += 1
            continue
        if quote:
            buffer.append(char)
            if char == "\\" and quote != "`" and index + 1 < len(source):
                buffer.append(source[index + 1])
                index += 2
                continue
            if char == quote:
                if index + 1 < len(source) and source[index + 1] == quote:
                    buffer.append(source[index + 1])
                    index += 2
                    continue
                quote = None
            index += 1
            continue
        if next_two == "/*":
            buffer.extend(("/", "*"))
            block_comment = True
            index += 2
            continue
        if next_two == "--" and (index + 2 == len(source) or source[index + 2].isspace()):
            buffer.extend(("-", "-"))
            line_comment = True
            index += 2
            continue
        if char == "#":
            buffer.append(char)
            line_comment = True
            index += 1
            continue
        if char in ("'", '"', "`"):
            quote = char
            buffer.append(char)
            index += 1
            continue
        if source.startswith(delimiter, index):
            statement = "".join(buffer).strip()
            if statement:
                yield statement
            buffer = []
            index += len(delimiter)
            continue
        buffer.append(char)
        index += 1
    if "".join(buffer).strip():
        raise AssertionError("Unterminated DDL statement")


def create_tables(database, ddl):
    copied_tables, copied_triggers = set(), set()
    for statement in mysql_statements(ddl):
        table = re.search(r"\bCREATE\s+TABLE\s+`([^`]+)`", statement, re.IGNORECASE)
        trigger = re.search(r"\bCREATE\s+TRIGGER\s+`([^`]+)`", statement, re.IGNORECASE)
        if table and table.group(1) in CORE_TABLES:
            query(database, statement)
            copied_tables.add(table.group(1))
        elif trigger and any("`" + name + "`" in statement for name in APPEND_ONLY_TABLES):
            query(database, statement)
            copied_triggers.add(trigger.group(1))
    if copied_tables != set(CORE_TABLES):
        raise AssertionError("Incomplete funds/account DDL table copy: " +
                             ", ".join(sorted(set(CORE_TABLES) - copied_tables)))
    if len(copied_triggers) != 4:
        raise AssertionError("Expected four source append-only funds/account triggers, got " +
                             str(len(copied_triggers)))


def insert(cursor, table, values):
    fields = ",".join("`" + field + "`" for field in values)
    placeholders = ",".join(["%s"] * len(values))
    cursor.execute(
        "INSERT INTO `" + table + "` (" + fields + ") VALUES (" + placeholders + ")",
        tuple(values.values()),
    )
    return cursor.lastrowid


def synthetic_fee_transaction(cursor, amount="300.00"):
    digest = hashlib.sha256(b"STEP5-INTERNAL-SYNTHETIC-FEE-ONLY").hexdigest()
    insert(cursor, "payment_transaction_tab", {
        "transaction_number": "S5-FEE-SYNTHETIC-001",
        "transaction_type": 3,
        "source_context_code": "step5-validation-only",
        "trade_number": "S5-SYNTHETIC-TRADE-001",
        "trade_revision_number": 1,
        "amount": amount,
        "currency_code": "CNY",
        "source_lines_json": json.dumps({"validationOnly": True}, separators=(",", ":")),
        "execution_basis_json": json.dumps({"validationOnly": True}, separators=(",", ":")),
        "transaction_status": 6,
        "request_number": "S5-FEE-SYNTHETIC-REQUEST-001",
        "request_hash": digest,
        "approval_snapshot_json": json.dumps({"validationOnly": True}, separators=(",", ":")),
        "result_snapshot_json": json.dumps({"validationOnly": True}, separators=(",", ":")),
        "lifecycle_events_json": json.dumps(
            [{"kind": "synthetic_internal_fee_settlement_fixture"}], separators=(",", ":")
        ),
        "created_by": "SYNTHETIC-VALIDATION-ONLY",
    })


def synthetic_fee_event(cursor, event_key="S5-FEE-SETTLEMENT-SYNTHETIC-001", amount="300.00",
                        bucket_to=None):
    return insert(cursor, "payment_fund_flow_tab", {
        "flow_number": "S5-FEE-FLOW-SYNTHETIC-001",
        "bank_account_id": None,
        "bank_account_fingerprint": None,
        "transaction_number": "S5-FEE-SYNTHETIC-001",
        "allocation_number": None,
        "event_type": 12,
        "bank_event_key": None,
        "event_key": event_key,
        "request_hash": hashlib.sha256(event_key.encode()).hexdigest(),
        "amount": amount,
        "currency_code": "CNY",
        "bucket_from": 2,
        "bucket_to": bucket_to,
        "occurred_at": datetime.now(timezone.utc).replace(tzinfo=None),
        "bank_reference": None,
        "raw_message_reference": None,
        "reversal_of_flow_number": None,
    })


def run_domain_tests():
    command = ["node", "doc/sql/step5/verify-domain-rules.cjs"]
    result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, check=False)
    if result.stdout:
        print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)
    if result.returncode:
        raise AssertionError("Pure step-five domain-rule checks failed")


def domain_fee_fixture():
    result = subprocess.run(
        ["node", "-e",
         "const {domainRules}=require('./交付成果/assets/step-five-usecases-model.js');"
         "console.log(JSON.stringify(domainRules.serviceFeeSettlement({"
         "tradeNumber:'SYN-TRADE-001',available:'1000.00',distributionApproved:true,"
         "tradeVerified:true,availableBalanceVerified:true,payerAuthorized:true})));"],
        cwd=ROOT, text=True, capture_output=True, check=True,
    )
    fee = json.loads(result.stdout)
    if fee["eventType"] != 12 or fee["bucketFrom"] != 2 or fee["bucketTo"] is not None:
        raise AssertionError("Fee domain rule did not debit the available balance")
    return fee


def verify_local_atomicity(database, checks):
    def rollback_bundle():
        with connect(database) as connection, connection.cursor() as cursor:
            connection.begin()
            try:
                synthetic_fee_event(cursor, "S5-ROLLBACK-EVENT")
            except pymysql.IntegrityError:
                connection.rollback()
            else:
                connection.rollback()
        return len(query(database, "SELECT id FROM payment_fund_flow_tab "
                                   "WHERE event_key='S5-ROLLBACK-EVENT'")) == 0

    check(checks, "Rolled-back duplicate fee command leaves no partial funds fact",
          rollback_bundle)

    def atomic_ledger_failure():
        connection = connect(database)
        try:
            connection.begin()
            with connection.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO payment_fund_flow_tab "
                    "(flow_number,transaction_number,event_type,event_key,request_hash,amount,"
                    "currency_code,occurred_at) VALUES "
                    "('S5-ATOMIC-ROLLBACK','S5-FEE-SYNTHETIC-001',8,'S5-ATOMIC-KEY',"
                    "%s,300,'CNY',UTC_TIMESTAMP(3))", ("a" * 64,))
                voucher = {
                    "voucher_number": "S5-ATOMIC-VOUCHER",
                    "business_type_code": "synthetic_rollback_only",
                    "business_number": "S5-ATOMIC-ROLLBACK",
                    "transaction_date": "2026-10-25", "accounting_period": "202610",
                    "currency_code": "CNY", "total_amount": "300.00",
                    "voucher_status": 1, "idempotency_key": "S5-ATOMIC-VOUCHER-KEY",
                    "request_hash": "a" * 64,
                }
                insert(cursor, "account_voucher_tab", voucher)
                insert(cursor, "account_ledger_entry_tab", {
                    "entry_number": "S5-INVALID-ENTRY", "voucher_number": voucher["voucher_number"],
                    "account_id": 1, "direction": 9, "amount": "300.00",
                    "balance_after": "300.00", "currency_code": "CNY",
                    "subject_code": "synthetic_invalid", "idempotency_key": "S5-INVALID-ENTRY",
                    "request_hash": "a" * 64, "accounting_period": "202610",
                    "transaction_date": "2026-10-25",
                })
        except pymysql.MySQLError:
            connection.rollback()
        else:
            connection.rollback()
            raise AssertionError("Invalid ledger direction unexpectedly accepted")
        finally:
            connection.close()
        return (
            query(database, "SELECT COUNT(*) n FROM payment_fund_flow_tab "
                            "WHERE event_key='S5-ATOMIC-KEY'")[0]["n"] == 0
            and query(database, "SELECT COUNT(*) n FROM account_voucher_tab "
                                "WHERE voucher_number='S5-ATOMIC-VOUCHER'")[0]["n"] == 0
            and query(database, "SELECT COUNT(*) n FROM account_ledger_entry_tab "
                                "WHERE entry_number='S5-INVALID-ENTRY'")[0]["n"] == 0
        )

    check(checks, "Funds event and voucher both roll back on ledger constraint failure",
          atomic_ledger_failure)

    first, second = connect(database), connect(database)
    try:
        for connection in (first, second):
            with connection.cursor() as cursor:
                cursor.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED")
            connection.begin()
        with first.cursor() as cursor:
            cursor.execute("SELECT transaction_number FROM payment_transaction_tab "
                           "WHERE transaction_number='S5-FEE-SYNTHETIC-001' FOR UPDATE")

        def competing_lock():
            with second.cursor() as cursor:
                cursor.execute("SELECT transaction_number FROM payment_transaction_tab "
                               "WHERE transaction_number='S5-FEE-SYNTHETIC-001' FOR UPDATE")

        try:
            competing_lock()
        except pymysql.err.OperationalError as error:
            check(checks, "Competing RC command cannot bypass held document root lock",
                  lambda: error.args[0] == 1205)
            second.rollback()
        else:
            check(checks, "Competing RC command cannot bypass held document root lock",
                  lambda: False)
        with first.cursor() as cursor:
            cursor.execute("UPDATE payment_transaction_tab SET result_snapshot_json=%s "
                           "WHERE transaction_number='S5-FEE-SYNTHETIC-001'",
                           (json.dumps({"validationOnly": True, "currentReadMarker": 2}),))
        first.commit()
        second.begin()
        with second.cursor() as cursor:
            cursor.execute("SELECT result_snapshot_json FROM payment_transaction_tab "
                           "WHERE transaction_number='S5-FEE-SYNTHETIC-001' FOR UPDATE")
            observed = json.loads(cursor.fetchone()["result_snapshot_json"])
        check(checks, "RC current read after root lock observes preceding committed command",
              lambda: observed["currentReadMarker"] == 2)
        second.rollback()
    finally:
        first.close()
        second.close()

    sql = (ROOT / "doc/sql/step5/assertions.sql").read_text()
    statements = [statement.strip() for statement in re.sub(r"--[^\n]*", "", sql).split(";")]
    for index, statement in enumerate(filter(None, statements), 1):
        check(checks, "Read-only funds/accounting audit query " + str(index) + " has no violations",
              lambda sql=statement: not query(database, sql))


def check(checks, name, action):
    try:
        outcome = action()
        if outcome is False:
            raise AssertionError("condition was false")
        checks.append({"name": name, "passed": True})
        print("PASS " + name)
    except Exception as error:
        checks.append({
            "name": name, "passed": False,
            "error": type(error).__name__ + ": " + str(error),
        })
        print("FAIL " + name + ": " + type(error).__name__ + ": " + str(error))


def run_middleware(checks, versions):
    sys.path.insert(0, str(ROOT / "infra/local"))
    from s3 import BASE as S3_BASE, BUCKETS, client, root_credentials
    from verify_antivirus_support import scan, scan_database_fresh

    credentials = json.loads((S3_BASE / "s3-client.json").read_text())
    storage = client(credentials["access_key"], credentials["secret_key"])
    admin = client(*root_credentials())
    content = (ROOT / "doc/examples/step5/material.html").read_bytes()
    expected_hash = hashlib.sha256(content).hexdigest()
    prefix = "_step-five-validation/" + secrets.token_hex(16)

    check(checks, "ClamAV signature database is fresh and scans original synthetic material",
          lambda: scan_database_fresh() and scan(content).endswith(": OK"))
    for bucket in BUCKETS[:2]:
        try:
            response = storage.put_object(
                Bucket=bucket, Key=prefix, Body=content, IfNoneMatch="*",
                Metadata={"sha256": expected_hash, "validation-only": "true"},
            )
            version = response["VersionId"]
            versions.append((bucket, prefix, version))
            fetched = storage.get_object(Bucket=bucket, Key=prefix, VersionId=version)["Body"].read()
            check(checks, "Exact S3 version/hash verified in " + bucket,
                  lambda data=fetched: hashlib.sha256(data).hexdigest() == expected_hash)
            try:
                storage.put_object(Bucket=bucket, Key=prefix, Body=b"conflicting synthetic bytes",
                                   IfNoneMatch="*")
            except ClientError as error:
                check(checks, "Conditional S3 write rejects overwrite in " + bucket,
                      lambda: error.response["Error"]["Code"] in (
                          "PreconditionFailed", "ConditionalRequestConflict"
                      ))
            else:
                check(checks, "Conditional S3 write rejects overwrite in " + bucket,
                      lambda: False)
        except Exception as error:
            check(checks, "S3 test completed in " + bucket,
                  lambda: (_ for _ in ()).throw(error))
    return admin


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--expected-ddl-sha256", default=EXPECTED_DDL_SHA256)
    args = parser.parse_args()
    database = "verify_step_five_" + secrets.token_hex(6)
    checks, versions = [], []
    admin = None
    ddl_hash = None
    fatal = None
    try:
        ddl = DDL.read_text()
        ddl_hash = hashlib.sha256(ddl.encode()).hexdigest()
        if ddl_hash != args.expected_ddl_sha256:
            raise AssertionError("Authoritative DDL SHA-256 changed; await final integration")
        if not re.search(r"`event_type`[^;]*IN \(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12\)", ddl):
            raise AssertionError("Funds event enum 1-12 is not present in authoritative DDL")
        create_database(database)
        create_tables(database, ddl)
        check(checks, "Copied eight exact funds/account tables from final DDL",
              lambda: len(query(database, "SHOW TABLES")) == len(CORE_TABLES))

        check(checks, "Model-level step-five business invariants",
              lambda: run_domain_tests() is None)

        fee = domain_fee_fixture()
        with connect(database) as connection, connection.cursor() as cursor:
            connection.begin()
            synthetic_fee_transaction(cursor, fee["amount"])
            synthetic_fee_event(cursor, amount=fee["amount"])
            connection.commit()
        rows = query(
            database,
            "SELECT flow_number,event_type,transaction_number,amount,currency_code,"
            "bucket_from,bucket_to,bank_event_key,bank_account_fingerprint "
            "FROM payment_fund_flow_tab",
        )
        check(checks, "Synthetic service-fee settlement persists once from available balance",
              lambda: len(rows) == 1 and rows[0]["event_type"] == 12
              and rows[0]["amount"] == 300
              and rows[0]["bucket_from"] == 2 and rows[0]["bucket_to"] is None
              and rows[0]["bank_event_key"] is None
              and rows[0]["bank_account_fingerprint"] is None)

        def duplicate_fee_settlement():
            with connect(database) as connection, connection.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO payment_fund_flow_tab "
                    "(flow_number,transaction_number,event_type,event_key,request_hash,amount,"
                    "currency_code,occurred_at) VALUES "
                    "('S5-FEE-DUPLICATE','S5-FEE-SYNTHETIC-001',12,'S5-FEE-BILL-SYNTHETIC-001',"
                    "%s,300,'CNY',UTC_TIMESTAMP(3))",
                    (hashlib.sha256(b"S5-FEE-BILL-SYNTHETIC-001").hexdigest(),),
                )

        check(checks, "Database idempotency key rejects duplicate internal fee settlement",
              lambda: rejected_mysql(duplicate_fee_settlement))

        def invalid_fee_amount():
            with connect(database) as connection, connection.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO payment_fund_flow_tab "
                    "(flow_number,transaction_number,event_type,event_key,request_hash,amount,"
                    "currency_code,occurred_at) VALUES "
                    "('S5-FEE-BAD','S5-FEE-SYNTHETIC-001',12,'S5-FEE-BAD-KEY',%s,299,'CNY',UTC_TIMESTAMP(3))",
                    (hashlib.sha256(b"S5-FEE-BAD-KEY").hexdigest(),),
                )

        check(checks, "Database check requires fixed 300.00 CNY fee settlement",
              lambda: rejected_mysql(invalid_fee_amount))

        def invalid_fee_bucket():
            with connect(database) as connection, connection.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO payment_fund_flow_tab "
                    "(flow_number,transaction_number,event_type,event_key,request_hash,amount,"
                    "currency_code,bucket_from,bucket_to,occurred_at) VALUES "
                    "('S5-FEE-BUCKET','S5-FEE-SYNTHETIC-001',12,'S5-FEE-BUCKET-KEY',%s,"
                    "300,'CNY',1,NULL,UTC_TIMESTAMP(3))",
                    (hashlib.sha256(b"S5-FEE-BUCKET-KEY").hexdigest(),),
                )

        check(checks, "Database check rejects service-fee settlement from a non-available bucket",
              lambda: rejected_mysql(invalid_fee_bucket))

        for event_type in (11,):
            def missing_bank_identity(kind=event_type):
                with connect(database) as connection, connection.cursor() as cursor:
                    cursor.execute(
                        "INSERT INTO payment_fund_flow_tab "
                        "(flow_number,transaction_number,event_type,event_key,request_hash,amount,"
                        "currency_code,occurred_at) VALUES (%s,%s,%s,%s,%s,%s,'CNY',UTC_TIMESTAMP(3))",
                        ("S5-NO-BANK-" + str(kind), "S5-FEE-SYNTHETIC-001", kind,
                         "S5-NO-BANK-EVENT-" + str(kind), hashlib.sha256(str(kind).encode()).hexdigest(),
                         "50.00"),
                    )

            check(checks, "Database rejects event " + str(event_type) +
                  " without real bank identity keys",
                  lambda action=missing_bank_identity: rejected_mysql(action))
        check(checks, "No bank success events were inserted for this run",
              lambda: query(database, "SELECT COUNT(*) AS n FROM payment_fund_flow_tab "
                                      "WHERE event_type IN (1,2,10,11)")[0]["n"] == 0)

        def update_immutable_flow():
            query(database, "UPDATE payment_fund_flow_tab SET bank_reference='changed' "
                            "WHERE flow_number='S5-FEE-FLOW-SYNTHETIC-001'")

        check(checks, "Isolated append-only trigger rejects rewriting original fund event",
              lambda: rejected_mysql(update_immutable_flow))
        verify_local_atomicity(database, checks)
        admin = run_middleware(checks, versions)
    except Exception as error:
        fatal = type(error).__name__ + ": " + str(error)
        print("FATAL " + fatal, file=sys.stderr)
    finally:
        if admin:
            for bucket, key, version in versions:
                try:
                    admin.delete_object(Bucket=bucket, Key=key, VersionId=version)
                except Exception as error:
                    checks.append({"name": "Remove this run's exact S3 version",
                                   "passed": False, "error": type(error).__name__ + ": " + str(error)})
            for bucket, key, _ in versions:
                try:
                    remaining = admin.list_object_versions(Bucket=bucket, Prefix=key)
                    found = any(v["Key"] == key for v in remaining.get("Versions", []))
                    checks.append({"name": "Only this run's exact S3 version is absent after cleanup",
                                   "passed": not found})
                except Exception as error:
                    checks.append({"name": "Verify exact S3 version cleanup", "passed": False,
                                   "error": type(error).__name__ + ": " + str(error)})

    result = {
        "validationOnly": True,
        "database": database,
        "finishedAt": datetime.now(timezone.utc).isoformat(),
        "ddlSha256": ddl_hash,
        "coreTables": CORE_TABLES,
        "passed": sum(1 for item in checks if item["passed"]),
        "failed": sum(1 for item in checks if not item["passed"]),
        "checks": checks,
        "databaseRetained": True,
        "s3ObjectVersions": [
            {"bucket": bucket, "key": key, "versionId": version}
            for bucket, key, version in versions
        ],
        "testObjectVersionsCleaned": all(
            item["passed"] for item in checks
            if "version is absent after cleanup" in item["name"]
        ),
        "exportTradeAndOldDemoTouched": False,
        "bankSuccessEventsInserted": False,
        "notProven": [
            "Production REST/RPC handlers, IAM, confirmation service, or real bank connection",
            "Real bank receipt, available-balance response, execution, beneficiary arrival, or bank fee",
            "Real INVOICE, contract, regulatory/customs evidence, or accounting-policy approval",
            "Production concurrency/permissions and automatic worker recovery",
        ],
    }
    if fatal:
        result["fatal"] = fatal
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"database": database, "passed": result["passed"],
                      "failed": result["failed"], "output": str(output)}, ensure_ascii=False))
    if fatal or result["failed"]:
        raise SystemExit(1)


def rejected_mysql(action):
    try:
        action()
    except pymysql.MySQLError:
        return True
    raise AssertionError("Expected MySQL to reject the operation")


if __name__ == "__main__":
    main()
