"""Step-four-only guards reused by semantic and isolated-entity verification."""
from decimal import Decimal
import hashlib
import json
import re


class Rejected(Exception):
    pass


def fixed(value, scale, positive=False):
    if not isinstance(value, str) or not re.fullmatch(r"(0|[1-9][0-9]*)\.[0-9]{" + str(scale) + "}", value):
        raise Rejected("DECIMAL_INVALID")
    integer = value.split(".")[0]
    if len(integer) > 20 - scale or positive and Decimal(value) <= 0:
        raise Rejected("DECIMAL_INVALID")
    return Decimal(value)


def validate_draft(draft, shipment):
    allowed = {"approvedSnapshotNumber", "tradeRevisionNumber", "shipmentPlanRevision", "productionSalesUnit",
               "domesticConsignor", "overseasConsignee", "customsAgent", "customsOfficeCode", "channelCode",
               "destinationCountryCode", "transportReference", "authorizationEvidenceReference", "items", "supportingFiles"}
    if set(draft) != allowed or len(draft["items"]) not in range(1, 201) or len(draft["supportingFiles"]) > 100:
        raise Rejected("CUSTOMS_CONTENT_INVALID")
    for field, role in (("productionSalesUnit", 1), ("domesticConsignor", 2), ("overseasConsignee", 3), ("customsAgent", 6)):
        if draft[field] != {"partyRoleCode": role, "participantSequenceNumber": 1}:
            raise Rejected("CUSTOMS_PARTY_INVALID")
    sequences = set()
    item_fields = {"itemSequenceNumber", "tradeGoodsItemSequenceNumber", "shipmentAllocationNumber", "hsCode",
                   "declaredDescription", "specification", "declaredQuantity", "unitCode",
                   "declaredUnitPriceAmount", "declaredTotalAmount", "currencyCode", "originCountryCode"}
    for item in draft["items"]:
        if set(item) != item_fields or item["itemSequenceNumber"] in sequences:
            raise Rejected("CUSTOMS_CONTENT_INVALID")
        sequences.add(item["itemSequenceNumber"])
        if item["tradeGoodsItemSequenceNumber"] != 1 or item["shipmentAllocationNumber"] != shipment + "#1":
            raise Rejected("CUSTOMS_ALLOCATION_INVALID")
        if item["currencyCode"] != "CNY" or item["unitCode"] != "PCS":
            raise Rejected("CUSTOMS_CURRENCY_OR_UNIT_INVALID")
        quantity = fixed(item["declaredQuantity"], 6, True)
        unit_price = fixed(item["declaredUnitPriceAmount"], 2)
        amount = fixed(item["declaredTotalAmount"], 2)
        if quantity * unit_price != amount:
            raise Rejected("CUSTOMS_PRICE_RULE_REQUIRED")


def content_snapshot(draft, previous=None):
    def snake(name):
        return re.sub(r"([A-Z])", lambda match: "_" + match[1].lower(), name)
    role_fields = ("productionSalesUnit", "domesticConsignor", "overseasConsignee", "customsAgent")
    header = {snake(key): value for key, value in draft.items()
              if key not in (*role_fields, "items", "supportingFiles")}
    return {"schema_version": 1, "header": header,
            "participant_references": [{"function_code": snake(name), **{snake(key): value for key, value in draft[name].items()}}
                                       for name in role_fields],
            "goods": [{snake(key): value for key, value in item.items()} for item in draft["items"]],
            "document_references": [file_snapshot(file) for file in draft["supportingFiles"]],
            "previous_revision_number": previous, "rule_version": "STEP4-DESIGN-1"}


def file_snapshot(file):
    return {"logical_file_number": file["logicalFileNumber"], "revision_number": file["revisionNumber"],
            "content_digest": file["sha256"], "document_purpose_code": file["documentTypeCode"]}


def content_digest(draft, previous=None):
    value = json.dumps(content_snapshot(draft, previous), ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(value.encode()).hexdigest()


def exact_version(current, revision, digest):
    if current["declaration_revision_number"] != revision or current["content_hash"] != digest:
        raise Rejected("CUSTOMS_VERSION_CONFLICT")


def independent(actor, creator, submitter):
    if actor in (creator, submitter):
        raise Rejected("CUSTOMS_SELF_REVIEW")


def recipient(actor_role, delivery_role):
    if actor_role not in (1, 2) or actor_role != delivery_role:
        raise Rejected("CUSTOMS_RECIPIENT_MISMATCH")


def official_gate(profile=None):
    # No trusted official profile/adapter is installed in this design-only harness.
    raise Rejected("CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED")


def attachment_state(delivery, receipts):
    relevant = [r for r in receipts if r["delivery"] == delivery["number"] and r["role"] == delivery["role"]]
    return relevant[-1]["outcome"] if relevant else "delivered"
