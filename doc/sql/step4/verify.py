"""Focused semantic negatives; these are not deployed handler or official success tests."""
import copy
import json
from pathlib import Path
import sys
sys.dont_write_bytecode = True
from customs_guards import (Rejected, attachment_state, content_digest, exact_version, independent, official_gate,
                            recipient, validate_draft)

ROOT = Path(__file__).resolve().parents[3]
data = json.loads((ROOT / "doc/examples/step4/entity-projection.json").read_text())
draft = data["draft"]
checks = []


def check(name, test):
    assert test() is not False, name
    checks.append(name)


def rejected(code, call):
    try:
        call()
    except Rejected as error:
        assert str(error) == code, (code, str(error))
        return True
    raise AssertionError("Expected " + code)


def changed_item(**values):
    value = copy.deepcopy(draft)
    value["items"][0].update(values)
    return value


shipment = draft["items"][0]["shipmentAllocationNumber"].split("#")[0]
check("Original synthetic complete draft validates without official claims", lambda: validate_draft(draft, shipment))
check("Generated and Python domain-content canonical hashes agree", lambda: content_digest(draft) == data["receipt"]["contentHash"])
check("Unknown header field rejected", lambda: rejected("CUSTOMS_CONTENT_INVALID", lambda: validate_draft({**draft, "released": True}, shipment)))
check("Unknown item field rejected", lambda: rejected("CUSTOMS_CONTENT_INVALID", lambda: validate_draft(changed_item(official=True), shipment)))
check("Non-CNY refused", lambda: rejected("CUSTOMS_CURRENCY_OR_UNIT_INVALID", lambda: validate_draft(changed_item(currencyCode="USD"), shipment)))
check("Unconfirmed unit conversion refused", lambda: rejected("CUSTOMS_CURRENCY_OR_UNIT_INVALID", lambda: validate_draft(changed_item(unitCode="KG"), shipment)))
check("Overprecision refused", lambda: rejected("DECIMAL_INVALID", lambda: validate_draft(changed_item(declaredQuantity="1.0000001"), shipment)))
check("Exponent refused", lambda: rejected("DECIMAL_INVALID", lambda: validate_draft(changed_item(declaredQuantity="4e1"), shipment)))
check("Zero quantity refused", lambda: rejected("DECIMAL_INVALID", lambda: validate_draft(changed_item(declaredQuantity="0.000000"), shipment)))
check("Unconfirmed price/rounding rule refused", lambda: rejected("CUSTOMS_PRICE_RULE_REQUIRED", lambda: validate_draft(changed_item(declaredTotalAmount="1.00"), shipment)))
check("Payer D cannot replace actual C", lambda: rejected("CUSTOMS_PARTY_INVALID", lambda: validate_draft({**draft, "overseasConsignee": {"partyRoleCode": 4, "participantSequenceNumber": 1}}, shipment)))
check("Self-review author refused", lambda: rejected("CUSTOMS_SELF_REVIEW", lambda: independent("F", "F", "F2")))
check("Self-review submitter refused", lambda: rejected("CUSTOMS_SELF_REVIEW", lambda: independent("F2", "F", "F2")))
check("A cannot accept B delivery", lambda: rejected("CUSTOMS_RECIPIENT_MISMATCH", lambda: recipient(1, 2)))
check("F cannot receive for A", lambda: rejected("CUSTOMS_RECIPIENT_MISMATCH", lambda: recipient(6, 1)))
check("B may authorize only own reception", lambda: recipient(2, 2))
check("Old confirmation cannot approve new revision", lambda: rejected("CUSTOMS_VERSION_CONFLICT", lambda: exact_version({"declaration_revision_number": 2, "content_hash": "b"}, 1, "a")))
check("Same version altered hash refused", lambda: rejected("CUSTOMS_VERSION_CONFLICT", lambda: exact_version({"declaration_revision_number": 1, "content_hash": "b"}, 1, "a")))
check("Synthetic profile cannot prove customs release", lambda: rejected("CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED", lambda: official_gate("SYNTHETIC")))
deliveries = [{"number": "D-A", "role": 1}, {"number": "D-B", "role": 2}]
receipts = [{"delivery": "D-A", "role": 1, "outcome": "received"}]
check("Pure shape projection: A received does not imply B received", lambda: attachment_state(deliveries[0], receipts) == "received" and attachment_state(deliveries[1], receipts) == "delivered")
receipts.append({"delivery": "D-B", "role": 2, "outcome": "disputed"})
check("Pure shape projection: B dispute is not receipt", lambda: attachment_state(deliveries[1], receipts) == "disputed")
print(json.dumps({"passed": len(checks), "semanticOnly": True, "checks": checks}, ensure_ascii=False))
