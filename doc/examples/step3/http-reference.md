# 步骤三HTTP/RPC响应与cURL

仅设计，无已部署API或真实凭证。每组是独立合成输入，不可当作业务成功事实。

## CreateShipment

`POST /api/v1/trades/TRD-S3-SYNTHETIC-001/shipments`

客户端/应用预算：10000/8000毫秒。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /api/v1/shipments/SHP-S3-SYNTHETIC-001
ETag: "s3-plan-1-accept-1"

{
  "shipmentNumber": "SHP-S3-SYNTHETIC-001",
  "status": "SHIPMENT_STATUS_PLANNED",
  "planRevision": "1",
  "etag": "\"s3-plan-1-accept-1\"",
  "acceptanceId": "S3-SYNTHETIC-CREATE-SHIPMENT"
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/trades/TRD-S3-SYNTHETIC-001/shipments" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7030000-0000-4000-8000-000000000001' \
  --header 'If-Match: "s3-trade-approved-4-accept-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"approvedSnapshotNumber":"SNP-S3-SYNTHETIC-APPROVED","tradeRevisionNumber":4,"carrierParticipantSequence":1,"originCode":"CN-SYNTHETIC-ORIGIN","destinationCode":"CN-SYNTHETIC-DESTINATION","plannedDepartureDate":"2026-11-01","plannedArrivalDate":"2026-11-03","allocations":[{"goodsItemSequence":1,"quantity":"40.000000","unitCode":"PCS","amount":"4000.00","currencyCode":"CNY"}],"legs":[{"sequence":1,"modeCode":3,"originCode":"CN-SYNTHETIC-ORIGIN","destinationCode":"CN-SYNTHETIC-DESTINATION","plannedDepartureAt":"2026-11-01T01:00:00.123Z","plannedArrivalAt":"2026-11-03T01:00:00.123Z"}]}'
```

```json
{
  "designOnly": true,
  "service": "trade.logistics.v1.ExternalLogisticsService",
  "method": "CreateShipment",
  "requestType": "CreateShipmentReqMsg",
  "responseType": "CreateShipmentRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>",
    "idempotency-key": "d7030000-0000-4000-8000-000000000001",
    "if-match": "\"s3-trade-approved-4-accept-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "tradeNumber": "TRD-S3-SYNTHETIC-001",
    "plan": {
      "approvedSnapshotNumber": "SNP-S3-SYNTHETIC-APPROVED",
      "tradeRevisionNumber": 4,
      "carrierParticipantSequence": 1,
      "originCode": "CN-SYNTHETIC-ORIGIN",
      "destinationCode": "CN-SYNTHETIC-DESTINATION",
      "plannedDepartureDate": "2026-11-01",
      "plannedArrivalDate": "2026-11-03",
      "allocations": [
        {
          "goodsItemSequence": 1,
          "quantity": "40.000000",
          "unitCode": "PCS",
          "amount": "4000.00",
          "currencyCode": "CNY"
        }
      ],
      "legs": [
        {
          "sequence": 1,
          "modeCode": 3,
          "originCode": "CN-SYNTHETIC-ORIGIN",
          "destinationCode": "CN-SYNTHETIC-DESTINATION",
          "plannedDepartureAt": "2026-11-01T01:00:00.123Z",
          "plannedArrivalAt": "2026-11-03T01:00:00.123Z"
        }
      ]
    }
  },
  "response": {
    "resource": {
      "shipmentNumber": "SHP-S3-SYNTHETIC-001",
      "status": "SHIPMENT_STATUS_PLANNED",
      "planRevision": "1",
      "etag": "\"s3-plan-1-accept-1\"",
      "acceptanceId": "S3-SYNTHETIC-CREATE-SHIPMENT"
    }
  },
  "successTrailers": {}
}
```

## GetShipment

`GET /api/v1/shipments/SHP-S3-SYNTHETIC-001`

客户端/应用预算：5000/4000毫秒。

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s3-plan-1-accept-1"

{
  "shipmentNumber": "SHP-S3-SYNTHETIC-001",
  "tradeNumber": "TRD-S3-SYNTHETIC-001",
  "status": "SHIPMENT_STATUS_PLANNED",
  "plan": {
    "approvedSnapshotNumber": "SNP-S3-SYNTHETIC-APPROVED",
    "tradeRevisionNumber": 4,
    "carrierParticipantSequence": 1,
    "originCode": "CN-SYNTHETIC-ORIGIN",
    "destinationCode": "CN-SYNTHETIC-DESTINATION",
    "plannedDepartureDate": "2026-11-01",
    "plannedArrivalDate": "2026-11-03",
    "allocations": [
      {
        "goodsItemSequence": 1,
        "quantity": "40.000000",
        "unitCode": "PCS",
        "amount": "4000.00",
        "currencyCode": "CNY"
      }
    ],
    "legs": [
      {
        "sequence": 1,
        "modeCode": 3,
        "originCode": "CN-SYNTHETIC-ORIGIN",
        "destinationCode": "CN-SYNTHETIC-DESTINATION",
        "plannedDepartureAt": "2026-11-01T01:00:00.123Z",
        "plannedArrivalAt": "2026-11-03T01:00:00.123Z"
      }
    ]
  },
  "planRevision": "1",
  "etag": "\"s3-plan-1-accept-1\"",
  "evidence": [
    {
      "submissionId": "SUB-S3-SYNTHETIC-001",
      "shipmentNumber": "SHP-S3-SYNTHETIC-001",
      "content": {
        "kind": "EVIDENCE_KIND_READINESS",
        "planRevision": "1",
        "legSequence": 1,
        "occurredAt": "2026-10-30T01:00:00.123Z",
        "sourceReference": "SYNTHETIC-READINESS-001",
        "files": [
          {
            "logicalFileNumber": "FILE-S3-SYNTHETIC-001",
            "revisionNumber": 1,
            "sha256": "58502c66fd34f31116f302ac24505e47b00068059ae11169a82b6f1c44c516bd",
            "documentTypeCode": 3
          }
        ],
        "statement": "原创合成备货声明，不证明已订舱、放行或签收"
      },
      "state": "pending_review"
    }
  ]
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/shipments/SHP-S3-SYNTHETIC-001" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.logistics.v1.ExternalLogisticsService",
  "method": "GetShipment",
  "requestType": "GetShipmentReqMsg",
  "responseType": "GetShipmentRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>"
  },
  "request": {
    "shipmentNumber": "SHP-S3-SYNTHETIC-001"
  },
  "response": {
    "resource": {
      "shipmentNumber": "SHP-S3-SYNTHETIC-001",
      "tradeNumber": "TRD-S3-SYNTHETIC-001",
      "status": "SHIPMENT_STATUS_PLANNED",
      "plan": {
        "approvedSnapshotNumber": "SNP-S3-SYNTHETIC-APPROVED",
        "tradeRevisionNumber": 4,
        "carrierParticipantSequence": 1,
        "originCode": "CN-SYNTHETIC-ORIGIN",
        "destinationCode": "CN-SYNTHETIC-DESTINATION",
        "plannedDepartureDate": "2026-11-01",
        "plannedArrivalDate": "2026-11-03",
        "allocations": [
          {
            "goodsItemSequence": 1,
            "quantity": "40.000000",
            "unitCode": "PCS",
            "amount": "4000.00",
            "currencyCode": "CNY"
          }
        ],
        "legs": [
          {
            "sequence": 1,
            "modeCode": 3,
            "originCode": "CN-SYNTHETIC-ORIGIN",
            "destinationCode": "CN-SYNTHETIC-DESTINATION",
            "plannedDepartureAt": "2026-11-01T01:00:00.123Z",
            "plannedArrivalAt": "2026-11-03T01:00:00.123Z"
          }
        ]
      },
      "planRevision": "1",
      "etag": "\"s3-plan-1-accept-1\"",
      "evidence": [
        {
          "submissionId": "SUB-S3-SYNTHETIC-001",
          "shipmentNumber": "SHP-S3-SYNTHETIC-001",
          "content": {
            "kind": "EVIDENCE_KIND_READINESS",
            "planRevision": "1",
            "legSequence": 1,
            "occurredAt": "2026-10-30T01:00:00.123Z",
            "sourceReference": "SYNTHETIC-READINESS-001",
            "files": [
              {
                "logicalFileNumber": "FILE-S3-SYNTHETIC-001",
                "revisionNumber": 1,
                "sha256": "58502c66fd34f31116f302ac24505e47b00068059ae11169a82b6f1c44c516bd",
                "documentTypeCode": 3
              }
            ],
            "statement": "原创合成备货声明，不证明已订舱、放行或签收"
          },
          "state": "pending_review"
        }
      ]
    }
  },
  "successTrailers": {}
}
```

## ReplaceShipmentPlan

`PUT /api/v1/shipments/SHP-S3-SYNTHETIC-001/plan`

客户端/应用预算：10000/8000毫秒。

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s3-plan-2-accept-2"

{
  "shipmentNumber": "SHP-S3-SYNTHETIC-001",
  "status": "SHIPMENT_STATUS_PLANNED",
  "planRevision": "2",
  "etag": "\"s3-plan-2-accept-2\"",
  "acceptanceId": "S3-SYNTHETIC-PLAN-REPLACE"
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request PUT "${BASE_URL:?Set BASE_URL}/api/v1/shipments/SHP-S3-SYNTHETIC-001/plan" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7030000-0000-4000-8000-000000000003' \
  --header 'If-Match: "s3-plan-1-accept-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"approvedSnapshotNumber":"SNP-S3-SYNTHETIC-APPROVED","tradeRevisionNumber":4,"carrierParticipantSequence":1,"originCode":"CN-SYNTHETIC-ORIGIN","destinationCode":"CN-SYNTHETIC-DESTINATION","plannedDepartureDate":"2026-11-01","plannedArrivalDate":"2026-11-04","allocations":[{"goodsItemSequence":1,"quantity":"40.000000","unitCode":"PCS","amount":"4000.00","currencyCode":"CNY"}],"legs":[{"sequence":1,"modeCode":3,"originCode":"CN-SYNTHETIC-ORIGIN","destinationCode":"CN-SYNTHETIC-DESTINATION","plannedDepartureAt":"2026-11-01T01:00:00.123Z","plannedArrivalAt":"2026-11-03T01:00:00.123Z"}]}'
```

```json
{
  "designOnly": true,
  "service": "trade.logistics.v1.ExternalLogisticsService",
  "method": "ReplaceShipmentPlan",
  "requestType": "ReplaceShipmentPlanReqMsg",
  "responseType": "ReplaceShipmentPlanRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>",
    "idempotency-key": "d7030000-0000-4000-8000-000000000003",
    "if-match": "\"s3-plan-1-accept-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "shipmentNumber": "SHP-S3-SYNTHETIC-001",
    "plan": {
      "approvedSnapshotNumber": "SNP-S3-SYNTHETIC-APPROVED",
      "tradeRevisionNumber": 4,
      "carrierParticipantSequence": 1,
      "originCode": "CN-SYNTHETIC-ORIGIN",
      "destinationCode": "CN-SYNTHETIC-DESTINATION",
      "plannedDepartureDate": "2026-11-01",
      "plannedArrivalDate": "2026-11-04",
      "allocations": [
        {
          "goodsItemSequence": 1,
          "quantity": "40.000000",
          "unitCode": "PCS",
          "amount": "4000.00",
          "currencyCode": "CNY"
        }
      ],
      "legs": [
        {
          "sequence": 1,
          "modeCode": 3,
          "originCode": "CN-SYNTHETIC-ORIGIN",
          "destinationCode": "CN-SYNTHETIC-DESTINATION",
          "plannedDepartureAt": "2026-11-01T01:00:00.123Z",
          "plannedArrivalAt": "2026-11-03T01:00:00.123Z"
        }
      ]
    }
  },
  "response": {
    "resource": {
      "shipmentNumber": "SHP-S3-SYNTHETIC-001",
      "status": "SHIPMENT_STATUS_PLANNED",
      "planRevision": "2",
      "etag": "\"s3-plan-2-accept-2\"",
      "acceptanceId": "S3-SYNTHETIC-PLAN-REPLACE"
    }
  },
  "successTrailers": {}
}
```

## CreateShipmentEvidence

`POST /api/v1/shipments/SHP-S3-SYNTHETIC-001/evidence-submissions`

客户端/应用预算：10000/8000毫秒。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /api/v1/shipments/SHP-S3-SYNTHETIC-001/evidence-submissions/SUB-S3-SYNTHETIC-001

{
  "submissionId": "SUB-S3-SYNTHETIC-001",
  "shipmentNumber": "SHP-S3-SYNTHETIC-001",
  "content": {
    "kind": "EVIDENCE_KIND_READINESS",
    "planRevision": "1",
    "legSequence": 1,
    "occurredAt": "2026-10-30T01:00:00.123Z",
    "sourceReference": "SYNTHETIC-READINESS-001",
    "files": [
      {
        "logicalFileNumber": "FILE-S3-SYNTHETIC-001",
        "revisionNumber": 1,
        "sha256": "58502c66fd34f31116f302ac24505e47b00068059ae11169a82b6f1c44c516bd",
        "documentTypeCode": 3
      }
    ],
    "statement": "原创合成备货声明，不证明已订舱、放行或签收"
  },
  "state": "pending_review"
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/shipments/SHP-S3-SYNTHETIC-001/evidence-submissions" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7030000-0000-4000-8000-000000000004' \
  --header 'If-Match: "s3-plan-1-accept-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"kind":"EVIDENCE_KIND_READINESS","planRevision":"1","legSequence":1,"occurredAt":"2026-10-30T01:00:00.123Z","sourceReference":"SYNTHETIC-READINESS-001","files":[{"logicalFileNumber":"FILE-S3-SYNTHETIC-001","revisionNumber":1,"sha256":"58502c66fd34f31116f302ac24505e47b00068059ae11169a82b6f1c44c516bd","documentTypeCode":3}],"statement":"原创合成备货声明，不证明已订舱、放行或签收"}'
```

```json
{
  "designOnly": true,
  "service": "trade.logistics.v1.ExternalLogisticsService",
  "method": "CreateShipmentEvidence",
  "requestType": "CreateShipmentEvidenceReqMsg",
  "responseType": "CreateShipmentEvidenceRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>",
    "idempotency-key": "d7030000-0000-4000-8000-000000000004",
    "if-match": "\"s3-plan-1-accept-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "shipmentNumber": "SHP-S3-SYNTHETIC-001",
    "evidence": {
      "kind": "EVIDENCE_KIND_READINESS",
      "planRevision": "1",
      "legSequence": 1,
      "occurredAt": "2026-10-30T01:00:00.123Z",
      "sourceReference": "SYNTHETIC-READINESS-001",
      "files": [
        {
          "logicalFileNumber": "FILE-S3-SYNTHETIC-001",
          "revisionNumber": 1,
          "sha256": "58502c66fd34f31116f302ac24505e47b00068059ae11169a82b6f1c44c516bd",
          "documentTypeCode": 3
        }
      ],
      "statement": "原创合成备货声明，不证明已订舱、放行或签收"
    }
  },
  "response": {
    "resource": {
      "submissionId": "SUB-S3-SYNTHETIC-001",
      "shipmentNumber": "SHP-S3-SYNTHETIC-001",
      "content": {
        "kind": "EVIDENCE_KIND_READINESS",
        "planRevision": "1",
        "legSequence": 1,
        "occurredAt": "2026-10-30T01:00:00.123Z",
        "sourceReference": "SYNTHETIC-READINESS-001",
        "files": [
          {
            "logicalFileNumber": "FILE-S3-SYNTHETIC-001",
            "revisionNumber": 1,
            "sha256": "58502c66fd34f31116f302ac24505e47b00068059ae11169a82b6f1c44c516bd",
            "documentTypeCode": 3
          }
        ],
        "statement": "原创合成备货声明，不证明已订舱、放行或签收"
      },
      "state": "pending_review"
    }
  },
  "successTrailers": {}
}
```

## GetShipmentEvidence

`GET /api/v1/shipments/SHP-S3-SYNTHETIC-001/evidence-submissions/SUB-S3-SYNTHETIC-001`

客户端/应用预算：5000/4000毫秒。

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "submissionId": "SUB-S3-SYNTHETIC-001",
  "shipmentNumber": "SHP-S3-SYNTHETIC-001",
  "content": {
    "kind": "EVIDENCE_KIND_READINESS",
    "planRevision": "1",
    "legSequence": 1,
    "occurredAt": "2026-10-30T01:00:00.123Z",
    "sourceReference": "SYNTHETIC-READINESS-001",
    "files": [
      {
        "logicalFileNumber": "FILE-S3-SYNTHETIC-001",
        "revisionNumber": 1,
        "sha256": "58502c66fd34f31116f302ac24505e47b00068059ae11169a82b6f1c44c516bd",
        "documentTypeCode": 3
      }
    ],
    "statement": "原创合成备货声明，不证明已订舱、放行或签收"
  },
  "state": "rejected",
  "reviewResult": {
    "outcome": "DECISION_OUTCOME_RETURN",
    "reason": "合成材料无有效商业证明，补齐本批三单后另建提交并关联旧提交",
    "reviewedAt": "2026-10-30T02:00:00.123Z",
    "reviewerReference": "SYNTHETIC-INDEPENDENT-REVIEWER",
    "verificationEvidence": []
  }
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/shipments/SHP-S3-SYNTHETIC-001/evidence-submissions/SUB-S3-SYNTHETIC-001" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.logistics.v1.ExternalLogisticsService",
  "method": "GetShipmentEvidence",
  "requestType": "GetShipmentEvidenceReqMsg",
  "responseType": "GetShipmentEvidenceRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>"
  },
  "request": {
    "shipmentNumber": "SHP-S3-SYNTHETIC-001",
    "submissionId": "SUB-S3-SYNTHETIC-001"
  },
  "response": {
    "resource": {
      "submissionId": "SUB-S3-SYNTHETIC-001",
      "shipmentNumber": "SHP-S3-SYNTHETIC-001",
      "content": {
        "kind": "EVIDENCE_KIND_READINESS",
        "planRevision": "1",
        "legSequence": 1,
        "occurredAt": "2026-10-30T01:00:00.123Z",
        "sourceReference": "SYNTHETIC-READINESS-001",
        "files": [
          {
            "logicalFileNumber": "FILE-S3-SYNTHETIC-001",
            "revisionNumber": 1,
            "sha256": "58502c66fd34f31116f302ac24505e47b00068059ae11169a82b6f1c44c516bd",
            "documentTypeCode": 3
          }
        ],
        "statement": "原创合成备货声明，不证明已订舱、放行或签收"
      },
      "state": "rejected",
      "reviewResult": {
        "outcome": "DECISION_OUTCOME_RETURN",
        "reason": "合成材料无有效商业证明，补齐本批三单后另建提交并关联旧提交",
        "reviewedAt": "2026-10-30T02:00:00.123Z",
        "reviewerReference": "SYNTHETIC-INDEPENDENT-REVIEWER",
        "verificationEvidence": []
      }
    }
  },
  "successTrailers": {}
}
```

## GetShipmentReviewContext

`GET /internal/v1/shipments/SHP-S3-SYNTHETIC-001/review-context`

客户端/应用预算：5000/4000毫秒。

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "shipment": {
    "shipmentNumber": "SHP-S3-SYNTHETIC-001",
    "tradeNumber": "TRD-S3-SYNTHETIC-001",
    "status": "SHIPMENT_STATUS_PLANNED",
    "plan": {
      "approvedSnapshotNumber": "SNP-S3-SYNTHETIC-APPROVED",
      "tradeRevisionNumber": 4,
      "carrierParticipantSequence": 1,
      "originCode": "CN-SYNTHETIC-ORIGIN",
      "destinationCode": "CN-SYNTHETIC-DESTINATION",
      "plannedDepartureDate": "2026-11-01",
      "plannedArrivalDate": "2026-11-03",
      "allocations": [
        {
          "goodsItemSequence": 1,
          "quantity": "40.000000",
          "unitCode": "PCS",
          "amount": "4000.00",
          "currencyCode": "CNY"
        }
      ],
      "legs": [
        {
          "sequence": 1,
          "modeCode": 3,
          "originCode": "CN-SYNTHETIC-ORIGIN",
          "destinationCode": "CN-SYNTHETIC-DESTINATION",
          "plannedDepartureAt": "2026-11-01T01:00:00.123Z",
          "plannedArrivalAt": "2026-11-03T01:00:00.123Z"
        }
      ]
    },
    "planRevision": "1",
    "etag": "\"s3-plan-1-accept-1\"",
    "evidence": [
      {
        "submissionId": "SUB-S3-SYNTHETIC-001",
        "shipmentNumber": "SHP-S3-SYNTHETIC-001",
        "content": {
          "kind": "EVIDENCE_KIND_READINESS",
          "planRevision": "1",
          "legSequence": 1,
          "occurredAt": "2026-10-30T01:00:00.123Z",
          "sourceReference": "SYNTHETIC-READINESS-001",
          "files": [
            {
              "logicalFileNumber": "FILE-S3-SYNTHETIC-001",
              "revisionNumber": 1,
              "sha256": "58502c66fd34f31116f302ac24505e47b00068059ae11169a82b6f1c44c516bd",
              "documentTypeCode": 3
            }
          ],
          "statement": "原创合成备货声明，不证明已订舱、放行或签收"
        },
        "state": "pending_review"
      }
    ]
  },
  "missingGateCodes": [
    "LOGISTICS_GATE_MISSING",
    "CLEARANCE_REQUIRED"
  ],
  "openExceptionIds": []
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/internal/v1/shipments/SHP-S3-SYNTHETIC-001/review-context" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.logistics.v1.InternalLogisticsOperationsService",
  "method": "GetShipmentReviewContext",
  "requestType": "GetShipmentReviewContextReqMsg",
  "responseType": "GetShipmentReviewContextRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>"
  },
  "request": {
    "shipmentNumber": "SHP-S3-SYNTHETIC-001"
  },
  "response": {
    "resource": {
      "shipment": {
        "shipmentNumber": "SHP-S3-SYNTHETIC-001",
        "tradeNumber": "TRD-S3-SYNTHETIC-001",
        "status": "SHIPMENT_STATUS_PLANNED",
        "plan": {
          "approvedSnapshotNumber": "SNP-S3-SYNTHETIC-APPROVED",
          "tradeRevisionNumber": 4,
          "carrierParticipantSequence": 1,
          "originCode": "CN-SYNTHETIC-ORIGIN",
          "destinationCode": "CN-SYNTHETIC-DESTINATION",
          "plannedDepartureDate": "2026-11-01",
          "plannedArrivalDate": "2026-11-03",
          "allocations": [
            {
              "goodsItemSequence": 1,
              "quantity": "40.000000",
              "unitCode": "PCS",
              "amount": "4000.00",
              "currencyCode": "CNY"
            }
          ],
          "legs": [
            {
              "sequence": 1,
              "modeCode": 3,
              "originCode": "CN-SYNTHETIC-ORIGIN",
              "destinationCode": "CN-SYNTHETIC-DESTINATION",
              "plannedDepartureAt": "2026-11-01T01:00:00.123Z",
              "plannedArrivalAt": "2026-11-03T01:00:00.123Z"
            }
          ]
        },
        "planRevision": "1",
        "etag": "\"s3-plan-1-accept-1\"",
        "evidence": [
          {
            "submissionId": "SUB-S3-SYNTHETIC-001",
            "shipmentNumber": "SHP-S3-SYNTHETIC-001",
            "content": {
              "kind": "EVIDENCE_KIND_READINESS",
              "planRevision": "1",
              "legSequence": 1,
              "occurredAt": "2026-10-30T01:00:00.123Z",
              "sourceReference": "SYNTHETIC-READINESS-001",
              "files": [
                {
                  "logicalFileNumber": "FILE-S3-SYNTHETIC-001",
                  "revisionNumber": 1,
                  "sha256": "58502c66fd34f31116f302ac24505e47b00068059ae11169a82b6f1c44c516bd",
                  "documentTypeCode": 3
                }
              ],
              "statement": "原创合成备货声明，不证明已订舱、放行或签收"
            },
            "state": "pending_review"
          }
        ]
      },
      "missingGateCodes": [
        "LOGISTICS_GATE_MISSING",
        "CLEARANCE_REQUIRED"
      ],
      "openExceptionIds": []
    }
  },
  "successTrailers": {}
}
```

## CreateShipmentEvidenceDecision

`POST /internal/v1/shipments/SHP-S3-SYNTHETIC-001/evidence-decisions`

客户端/应用预算：10000/8000毫秒。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /internal/v1/shipments/SHP-S3-SYNTHETIC-001/evidence-decisions/S3-SYNTHETIC-EVIDENCE-REVIEW
ETag: "s3-plan-1-accept-3"

{
  "shipmentNumber": "SHP-S3-SYNTHETIC-001",
  "status": "SHIPMENT_STATUS_PLANNED",
  "planRevision": "1",
  "etag": "\"s3-plan-1-accept-3\"",
  "acceptanceId": "S3-SYNTHETIC-EVIDENCE-REVIEW"
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/shipments/SHP-S3-SYNTHETIC-001/evidence-decisions" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7030000-0000-4000-8000-000000000007' \
  --header 'If-Match: "s3-plan-1-accept-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"submissionId":"SUB-S3-SYNTHETIC-001","outcome":"DECISION_OUTCOME_RETURN","reason":"合成例无有效业务证明，退回补正，不推进物流状态","verificationEvidence":[]}'
```

```json
{
  "designOnly": true,
  "service": "trade.logistics.v1.InternalLogisticsOperationsService",
  "method": "CreateShipmentEvidenceDecision",
  "requestType": "CreateShipmentEvidenceDecisionReqMsg",
  "responseType": "CreateShipmentEvidenceDecisionRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d7030000-0000-4000-8000-000000000007",
    "if-match": "\"s3-plan-1-accept-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "shipmentNumber": "SHP-S3-SYNTHETIC-001",
    "decision": {
      "submissionId": "SUB-S3-SYNTHETIC-001",
      "outcome": "DECISION_OUTCOME_RETURN",
      "reason": "合成例无有效业务证明，退回补正，不推进物流状态",
      "verificationEvidence": []
    }
  },
  "response": {
    "resource": {
      "shipmentNumber": "SHP-S3-SYNTHETIC-001",
      "status": "SHIPMENT_STATUS_PLANNED",
      "planRevision": "1",
      "etag": "\"s3-plan-1-accept-3\"",
      "acceptanceId": "S3-SYNTHETIC-EVIDENCE-REVIEW"
    }
  },
  "successTrailers": {}
}
```

## CreateShipmentExceptionDisposition

`POST /internal/v1/shipments/SHP-S3-SYNTHETIC-001/exception-dispositions`

客户端/应用预算：10000/8000毫秒。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /internal/v1/shipments/SHP-S3-SYNTHETIC-001/exception-dispositions/S3-SYNTHETIC-EXCEPTION-RESOLVE
ETag: "s3-plan-1-accept-1"

{
  "shipmentNumber": "SHP-S3-SYNTHETIC-001",
  "status": "SHIPMENT_STATUS_BOOKED",
  "planRevision": "1",
  "etag": "\"s3-plan-1-accept-1\"",
  "acceptanceId": "S3-SYNTHETIC-EXCEPTION-RESOLVE"
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/shipments/SHP-S3-SYNTHETIC-001/exception-dispositions" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7030000-0000-4000-8000-000000000008' \
  --header 'If-Match: "s3-plan-1-accept-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"exceptionEventNumber":"S3-SYNTHETIC-EXCEPTION","reason":"结构设计例，真实处置须核实外部证据","evidence":[{"logicalFileNumber":"FILE-S3-SYNTHETIC-001","revisionNumber":1,"sha256":"58502c66fd34f31116f302ac24505e47b00068059ae11169a82b6f1c44c516bd","documentTypeCode":3}],"finalFailure":false}'
```

```json
{
  "designOnly": true,
  "service": "trade.logistics.v1.InternalLogisticsOperationsService",
  "method": "CreateShipmentExceptionDisposition",
  "requestType": "CreateShipmentExceptionDispositionReqMsg",
  "responseType": "CreateShipmentExceptionDispositionRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d7030000-0000-4000-8000-000000000008",
    "if-match": "\"s3-plan-1-accept-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "shipmentNumber": "SHP-S3-SYNTHETIC-001",
    "disposition": {
      "exceptionEventNumber": "S3-SYNTHETIC-EXCEPTION",
      "reason": "结构设计例，真实处置须核实外部证据",
      "evidence": [
        {
          "logicalFileNumber": "FILE-S3-SYNTHETIC-001",
          "revisionNumber": 1,
          "sha256": "58502c66fd34f31116f302ac24505e47b00068059ae11169a82b6f1c44c516bd",
          "documentTypeCode": 3
        }
      ],
      "finalFailure": false
    }
  },
  "response": {
    "resource": {
      "shipmentNumber": "SHP-S3-SYNTHETIC-001",
      "status": "SHIPMENT_STATUS_BOOKED",
      "planRevision": "1",
      "etag": "\"s3-plan-1-accept-1\"",
      "acceptanceId": "S3-SYNTHETIC-EXCEPTION-RESOLVE"
    }
  },
  "successTrailers": {}
}
```

## CreateShipmentCancellation

`POST /internal/v1/shipments/SHP-S3-SYNTHETIC-001/cancellation-decisions`

客户端/应用预算：10000/8000毫秒。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /internal/v1/shipments/SHP-S3-SYNTHETIC-001/cancellation-decisions/S3-SYNTHETIC-SHIPMENT-CANCEL
ETag: "s3-plan-1-accept-1"

{
  "shipmentNumber": "SHP-S3-SYNTHETIC-001",
  "status": "SHIPMENT_STATUS_CANCELLED",
  "planRevision": "1",
  "etag": "\"s3-plan-1-accept-1\"",
  "acceptanceId": "S3-SYNTHETIC-SHIPMENT-CANCEL"
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/shipments/SHP-S3-SYNTHETIC-001/cancellation-decisions" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7030000-0000-4000-8000-000000000009' \
  --header 'If-Match: "s3-plan-1-accept-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"reason":"仅设计：未执行计划的授权取消","evidence":[{"logicalFileNumber":"FILE-S3-SYNTHETIC-001","revisionNumber":1,"sha256":"58502c66fd34f31116f302ac24505e47b00068059ae11169a82b6f1c44c516bd","documentTypeCode":3}]}'
```

```json
{
  "designOnly": true,
  "service": "trade.logistics.v1.InternalLogisticsOperationsService",
  "method": "CreateShipmentCancellation",
  "requestType": "CreateShipmentCancellationReqMsg",
  "responseType": "CreateShipmentCancellationRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d7030000-0000-4000-8000-000000000009",
    "if-match": "\"s3-plan-1-accept-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "shipmentNumber": "SHP-S3-SYNTHETIC-001",
    "cancellation": {
      "reason": "仅设计：未执行计划的授权取消",
      "evidence": [
        {
          "logicalFileNumber": "FILE-S3-SYNTHETIC-001",
          "revisionNumber": 1,
          "sha256": "58502c66fd34f31116f302ac24505e47b00068059ae11169a82b6f1c44c516bd",
          "documentTypeCode": 3
        }
      ]
    }
  },
  "response": {
    "resource": {
      "shipmentNumber": "SHP-S3-SYNTHETIC-001",
      "status": "SHIPMENT_STATUS_CANCELLED",
      "planRevision": "1",
      "etag": "\"s3-plan-1-accept-1\"",
      "acceptanceId": "S3-SYNTHETIC-SHIPMENT-CANCEL"
    }
  },
  "successTrailers": {}
}
```
