# 步骤四逐接口RESPONSE/cURL/RPC

全部仅设计，凭据无效；每段是独立形状例，不可串成真实官方成功链。附件交付形状例的正式前置尚未验证。

## GetCustomsBasis

`GET /api/v1/shipments/SHP-S4-SYNTHETIC/customs-basis`

客户端/应用预算：5000/4000毫秒。

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s4-v1-57e9172357bd"

{
  "tradeNumber": "TRD-S4-SYNTHETIC",
  "shipmentNumber": "SHP-S4-SYNTHETIC",
  "approvedSnapshotNumber": "SNP-S4-SYNTHETIC-APPROVED",
  "shipmentPlanRevision": "SYNTHETIC-PLAN-1",
  "etag": "\"s4-v1-57e9172357bd\"",
  "parties": [
    {
      "partyRoleCode": 1,
      "participantSequenceNumber": 1
    },
    {
      "partyRoleCode": 2,
      "participantSequenceNumber": 1
    },
    {
      "partyRoleCode": 3,
      "participantSequenceNumber": 1
    },
    {
      "partyRoleCode": 6,
      "participantSequenceNumber": 1
    }
  ],
  "missingGateCodes": [
    "CUSTOMS_AUTHORITY_UNVERIFIED"
  ]
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/shipments/SHP-S4-SYNTHETIC/customs-basis" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.customs.v1.ExternalCustomsService",
  "method": "GetCustomsBasis",
  "requestType": "GetCustomsBasisReqMsg",
  "responseType": "GetCustomsBasisRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>"
  },
  "request": {
    "shipmentNumber": "SHP-S4-SYNTHETIC"
  },
  "response": {
    "resource": {
      "tradeNumber": "TRD-S4-SYNTHETIC",
      "shipmentNumber": "SHP-S4-SYNTHETIC",
      "approvedSnapshotNumber": "SNP-S4-SYNTHETIC-APPROVED",
      "shipmentPlanRevision": "SYNTHETIC-PLAN-1",
      "etag": "\"s4-v1-57e9172357bd\"",
      "parties": [
        {
          "partyRoleCode": 1,
          "participantSequenceNumber": 1
        },
        {
          "partyRoleCode": 2,
          "participantSequenceNumber": 1
        },
        {
          "partyRoleCode": 3,
          "participantSequenceNumber": 1
        },
        {
          "partyRoleCode": 6,
          "participantSequenceNumber": 1
        }
      ],
      "missingGateCodes": [
        "CUSTOMS_AUTHORITY_UNVERIFIED"
      ]
    }
  },
  "successTrailers": {}
}
```

## CreateCustomsDeclaration

`POST /api/v1/shipments/SHP-S4-SYNTHETIC/customs-declarations`

客户端/应用预算：10000/8000毫秒。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
ETag: "s4-v1-57e9172357bd"
Location: /api/v1/customs-declarations/DEC-S4-SYNTHETIC

{
  "declarationNumber": "DEC-S4-SYNTHETIC",
  "revisionNumber": 1,
  "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
  "status": "DECLARATION_STATUS_DRAFT",
  "etag": "\"s4-v1-57e9172357bd\"",
  "acceptanceId": "ACCEPT-S4-SYNTHETIC"
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/shipments/SHP-S4-SYNTHETIC/customs-declarations" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7040000-0000-4000-8000-000000000002' \
  --header 'If-Match: "s4-v1-57e9172357bd"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"approvedSnapshotNumber":"SNP-S4-SYNTHETIC-APPROVED","tradeRevisionNumber":4,"shipmentPlanRevision":"SYNTHETIC-PLAN-1","productionSalesUnit":{"partyRoleCode":1,"participantSequenceNumber":1},"domesticConsignor":{"partyRoleCode":2,"participantSequenceNumber":1},"overseasConsignee":{"partyRoleCode":3,"participantSequenceNumber":1},"customsAgent":{"partyRoleCode":6,"participantSequenceNumber":1},"customsOfficeCode":"SYNTHETIC-OFFICE","channelCode":"SYNTHETIC-NOT-OFFICIAL","destinationCountryCode":"VN","transportReference":"SYNTHETIC-TRANSPORT","authorizationEvidenceReference":"SYNTHETIC-NOT-VALID-AUTHORITY","items":[{"itemSequenceNumber":1,"tradeGoodsItemSequenceNumber":1,"shipmentAllocationNumber":"SHP-S4-SYNTHETIC#1","hsCode":"SYNTHETIC","declaredDescription":"原创合成货物非真实归类","specification":"SYNTHETIC","declaredQuantity":"40.000000","unitCode":"PCS","declaredUnitPriceAmount":"100.00","declaredTotalAmount":"4000.00","currencyCode":"CNY","originCountryCode":"CN"}],"supportingFiles":[{"logicalFileNumber":"FILE-S4-SYNTHETIC","revisionNumber":1,"sha256":"4798e78866b4a0563bbb5ffebf2f1b7a3bf3f23cee90623749e666cd57944bd7","documentTypeCode":3}]}'
```

```json
{
  "designOnly": true,
  "service": "trade.customs.v1.ExternalCustomsService",
  "method": "CreateCustomsDeclaration",
  "requestType": "CreateCustomsDeclarationReqMsg",
  "responseType": "CreateCustomsDeclarationRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>",
    "idempotency-key": "d7040000-0000-4000-8000-000000000002",
    "if-match": "\"s4-v1-57e9172357bd\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "shipmentNumber": "SHP-S4-SYNTHETIC",
    "draft": {
      "approvedSnapshotNumber": "SNP-S4-SYNTHETIC-APPROVED",
      "tradeRevisionNumber": 4,
      "shipmentPlanRevision": "SYNTHETIC-PLAN-1",
      "productionSalesUnit": {
        "partyRoleCode": 1,
        "participantSequenceNumber": 1
      },
      "domesticConsignor": {
        "partyRoleCode": 2,
        "participantSequenceNumber": 1
      },
      "overseasConsignee": {
        "partyRoleCode": 3,
        "participantSequenceNumber": 1
      },
      "customsAgent": {
        "partyRoleCode": 6,
        "participantSequenceNumber": 1
      },
      "customsOfficeCode": "SYNTHETIC-OFFICE",
      "channelCode": "SYNTHETIC-NOT-OFFICIAL",
      "destinationCountryCode": "VN",
      "transportReference": "SYNTHETIC-TRANSPORT",
      "authorizationEvidenceReference": "SYNTHETIC-NOT-VALID-AUTHORITY",
      "items": [
        {
          "itemSequenceNumber": 1,
          "tradeGoodsItemSequenceNumber": 1,
          "shipmentAllocationNumber": "SHP-S4-SYNTHETIC#1",
          "hsCode": "SYNTHETIC",
          "declaredDescription": "原创合成货物非真实归类",
          "specification": "SYNTHETIC",
          "declaredQuantity": "40.000000",
          "unitCode": "PCS",
          "declaredUnitPriceAmount": "100.00",
          "declaredTotalAmount": "4000.00",
          "currencyCode": "CNY",
          "originCountryCode": "CN"
        }
      ],
      "supportingFiles": [
        {
          "logicalFileNumber": "FILE-S4-SYNTHETIC",
          "revisionNumber": 1,
          "sha256": "4798e78866b4a0563bbb5ffebf2f1b7a3bf3f23cee90623749e666cd57944bd7",
          "documentTypeCode": 3
        }
      ]
    }
  },
  "response": {
    "resource": {
      "declarationNumber": "DEC-S4-SYNTHETIC",
      "revisionNumber": 1,
      "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
      "status": "DECLARATION_STATUS_DRAFT",
      "etag": "\"s4-v1-57e9172357bd\"",
      "acceptanceId": "ACCEPT-S4-SYNTHETIC"
    }
  },
  "successTrailers": {}
}
```

## GetCustomsDeclaration

`GET /api/v1/customs-declarations/DEC-S4-SYNTHETIC`

客户端/应用预算：5000/4000毫秒。

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s4-v1-57e9172357bd"

{
  "current": {
    "declarationNumber": "DEC-S4-SYNTHETIC",
    "revisionNumber": 1,
    "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
    "status": "DECLARATION_STATUS_DRAFT",
    "etag": "\"s4-v1-57e9172357bd\"",
    "acceptanceId": "ACCEPT-S4-SYNTHETIC"
  },
  "revision": {
    "declarationNumber": "DEC-S4-SYNTHETIC",
    "revisionNumber": 1,
    "content": {
      "approvedSnapshotNumber": "SNP-S4-SYNTHETIC-APPROVED",
      "tradeRevisionNumber": 4,
      "shipmentPlanRevision": "SYNTHETIC-PLAN-1",
      "productionSalesUnit": {
        "partyRoleCode": 1,
        "participantSequenceNumber": 1
      },
      "domesticConsignor": {
        "partyRoleCode": 2,
        "participantSequenceNumber": 1
      },
      "overseasConsignee": {
        "partyRoleCode": 3,
        "participantSequenceNumber": 1
      },
      "customsAgent": {
        "partyRoleCode": 6,
        "participantSequenceNumber": 1
      },
      "customsOfficeCode": "SYNTHETIC-OFFICE",
      "channelCode": "SYNTHETIC-NOT-OFFICIAL",
      "destinationCountryCode": "VN",
      "transportReference": "SYNTHETIC-TRANSPORT",
      "authorizationEvidenceReference": "SYNTHETIC-NOT-VALID-AUTHORITY",
      "items": [
        {
          "itemSequenceNumber": 1,
          "tradeGoodsItemSequenceNumber": 1,
          "shipmentAllocationNumber": "SHP-S4-SYNTHETIC#1",
          "hsCode": "SYNTHETIC",
          "declaredDescription": "原创合成货物非真实归类",
          "specification": "SYNTHETIC",
          "declaredQuantity": "40.000000",
          "unitCode": "PCS",
          "declaredUnitPriceAmount": "100.00",
          "declaredTotalAmount": "4000.00",
          "currencyCode": "CNY",
          "originCountryCode": "CN"
        }
      ],
      "supportingFiles": [
        {
          "logicalFileNumber": "FILE-S4-SYNTHETIC",
          "revisionNumber": 1,
          "sha256": "4798e78866b4a0563bbb5ffebf2f1b7a3bf3f23cee90623749e666cd57944bd7",
          "documentTypeCode": 3
        }
      ]
    },
    "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
    "createdBy": "SYNTHETIC-F",
    "events": []
  },
  "availableRevisions": [
    1
  ],
  "filingRequests": [],
  "events": [],
  "attachmentDeliveries": [],
  "missingGateCodes": [
    "CUSTOMS_AUTHORITY_UNVERIFIED"
  ]
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/customs-declarations/DEC-S4-SYNTHETIC" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.customs.v1.ExternalCustomsService",
  "method": "GetCustomsDeclaration",
  "requestType": "GetCustomsDeclarationReqMsg",
  "responseType": "GetCustomsDeclarationRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>"
  },
  "request": {
    "declarationNumber": "DEC-S4-SYNTHETIC"
  },
  "response": {
    "resource": {
      "current": {
        "declarationNumber": "DEC-S4-SYNTHETIC",
        "revisionNumber": 1,
        "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
        "status": "DECLARATION_STATUS_DRAFT",
        "etag": "\"s4-v1-57e9172357bd\"",
        "acceptanceId": "ACCEPT-S4-SYNTHETIC"
      },
      "revision": {
        "declarationNumber": "DEC-S4-SYNTHETIC",
        "revisionNumber": 1,
        "content": {
          "approvedSnapshotNumber": "SNP-S4-SYNTHETIC-APPROVED",
          "tradeRevisionNumber": 4,
          "shipmentPlanRevision": "SYNTHETIC-PLAN-1",
          "productionSalesUnit": {
            "partyRoleCode": 1,
            "participantSequenceNumber": 1
          },
          "domesticConsignor": {
            "partyRoleCode": 2,
            "participantSequenceNumber": 1
          },
          "overseasConsignee": {
            "partyRoleCode": 3,
            "participantSequenceNumber": 1
          },
          "customsAgent": {
            "partyRoleCode": 6,
            "participantSequenceNumber": 1
          },
          "customsOfficeCode": "SYNTHETIC-OFFICE",
          "channelCode": "SYNTHETIC-NOT-OFFICIAL",
          "destinationCountryCode": "VN",
          "transportReference": "SYNTHETIC-TRANSPORT",
          "authorizationEvidenceReference": "SYNTHETIC-NOT-VALID-AUTHORITY",
          "items": [
            {
              "itemSequenceNumber": 1,
              "tradeGoodsItemSequenceNumber": 1,
              "shipmentAllocationNumber": "SHP-S4-SYNTHETIC#1",
              "hsCode": "SYNTHETIC",
              "declaredDescription": "原创合成货物非真实归类",
              "specification": "SYNTHETIC",
              "declaredQuantity": "40.000000",
              "unitCode": "PCS",
              "declaredUnitPriceAmount": "100.00",
              "declaredTotalAmount": "4000.00",
              "currencyCode": "CNY",
              "originCountryCode": "CN"
            }
          ],
          "supportingFiles": [
            {
              "logicalFileNumber": "FILE-S4-SYNTHETIC",
              "revisionNumber": 1,
              "sha256": "4798e78866b4a0563bbb5ffebf2f1b7a3bf3f23cee90623749e666cd57944bd7",
              "documentTypeCode": 3
            }
          ]
        },
        "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
        "createdBy": "SYNTHETIC-F",
        "events": []
      },
      "availableRevisions": [
        1
      ],
      "filingRequests": [],
      "events": [],
      "attachmentDeliveries": [],
      "missingGateCodes": [
        "CUSTOMS_AUTHORITY_UNVERIFIED"
      ]
    }
  },
  "successTrailers": {}
}
```

## CreateCustomsRevision

`POST /api/v1/customs-declarations/DEC-S4-SYNTHETIC/revisions`

客户端/应用预算：10000/8000毫秒。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
ETag: "s4-v2-synthetic"
Location: /api/v1/customs-declarations/DEC-S4-SYNTHETIC/revisions/2

{
  "declarationNumber": "DEC-S4-SYNTHETIC",
  "revisionNumber": 2,
  "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
  "status": "DECLARATION_STATUS_DRAFT",
  "etag": "\"s4-v2-synthetic\"",
  "acceptanceId": "ACCEPT-S4-SYNTHETIC"
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/customs-declarations/DEC-S4-SYNTHETIC/revisions" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7040000-0000-4000-8000-000000000004' \
  --header 'If-Match: "s4-v1-57e9172357bd"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"baseRevisionNumber":1,"draft":{"approvedSnapshotNumber":"SNP-S4-SYNTHETIC-APPROVED","tradeRevisionNumber":4,"shipmentPlanRevision":"SYNTHETIC-PLAN-1","productionSalesUnit":{"partyRoleCode":1,"participantSequenceNumber":1},"domesticConsignor":{"partyRoleCode":2,"participantSequenceNumber":1},"overseasConsignee":{"partyRoleCode":3,"participantSequenceNumber":1},"customsAgent":{"partyRoleCode":6,"participantSequenceNumber":1},"customsOfficeCode":"SYNTHETIC-OFFICE","channelCode":"SYNTHETIC-NOT-OFFICIAL","destinationCountryCode":"VN","transportReference":"SYNTHETIC-CORRECTED","authorizationEvidenceReference":"SYNTHETIC-NOT-VALID-AUTHORITY","items":[{"itemSequenceNumber":1,"tradeGoodsItemSequenceNumber":1,"shipmentAllocationNumber":"SHP-S4-SYNTHETIC#1","hsCode":"SYNTHETIC","declaredDescription":"原创合成货物非真实归类","specification":"SYNTHETIC","declaredQuantity":"40.000000","unitCode":"PCS","declaredUnitPriceAmount":"100.00","declaredTotalAmount":"4000.00","currencyCode":"CNY","originCountryCode":"CN"}],"supportingFiles":[{"logicalFileNumber":"FILE-S4-SYNTHETIC","revisionNumber":1,"sha256":"4798e78866b4a0563bbb5ffebf2f1b7a3bf3f23cee90623749e666cd57944bd7","documentTypeCode":3}]},"reason":"修改运输引用，新版须重新审核及A确认"}'
```

```json
{
  "designOnly": true,
  "service": "trade.customs.v1.ExternalCustomsService",
  "method": "CreateCustomsRevision",
  "requestType": "CreateCustomsRevisionReqMsg",
  "responseType": "CreateCustomsRevisionRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>",
    "idempotency-key": "d7040000-0000-4000-8000-000000000004",
    "if-match": "\"s4-v1-57e9172357bd\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "declarationNumber": "DEC-S4-SYNTHETIC",
    "revision": {
      "baseRevisionNumber": 1,
      "draft": {
        "approvedSnapshotNumber": "SNP-S4-SYNTHETIC-APPROVED",
        "tradeRevisionNumber": 4,
        "shipmentPlanRevision": "SYNTHETIC-PLAN-1",
        "productionSalesUnit": {
          "partyRoleCode": 1,
          "participantSequenceNumber": 1
        },
        "domesticConsignor": {
          "partyRoleCode": 2,
          "participantSequenceNumber": 1
        },
        "overseasConsignee": {
          "partyRoleCode": 3,
          "participantSequenceNumber": 1
        },
        "customsAgent": {
          "partyRoleCode": 6,
          "participantSequenceNumber": 1
        },
        "customsOfficeCode": "SYNTHETIC-OFFICE",
        "channelCode": "SYNTHETIC-NOT-OFFICIAL",
        "destinationCountryCode": "VN",
        "transportReference": "SYNTHETIC-CORRECTED",
        "authorizationEvidenceReference": "SYNTHETIC-NOT-VALID-AUTHORITY",
        "items": [
          {
            "itemSequenceNumber": 1,
            "tradeGoodsItemSequenceNumber": 1,
            "shipmentAllocationNumber": "SHP-S4-SYNTHETIC#1",
            "hsCode": "SYNTHETIC",
            "declaredDescription": "原创合成货物非真实归类",
            "specification": "SYNTHETIC",
            "declaredQuantity": "40.000000",
            "unitCode": "PCS",
            "declaredUnitPriceAmount": "100.00",
            "declaredTotalAmount": "4000.00",
            "currencyCode": "CNY",
            "originCountryCode": "CN"
          }
        ],
        "supportingFiles": [
          {
            "logicalFileNumber": "FILE-S4-SYNTHETIC",
            "revisionNumber": 1,
            "sha256": "4798e78866b4a0563bbb5ffebf2f1b7a3bf3f23cee90623749e666cd57944bd7",
            "documentTypeCode": 3
          }
        ]
      },
      "reason": "修改运输引用，新版须重新审核及A确认"
    }
  },
  "response": {
    "resource": {
      "declarationNumber": "DEC-S4-SYNTHETIC",
      "revisionNumber": 2,
      "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
      "status": "DECLARATION_STATUS_DRAFT",
      "etag": "\"s4-v2-synthetic\"",
      "acceptanceId": "ACCEPT-S4-SYNTHETIC"
    }
  },
  "successTrailers": {}
}
```

## GetCustomsRevision

`GET /api/v1/customs-declarations/DEC-S4-SYNTHETIC/revisions/1`

客户端/应用预算：5000/4000毫秒。

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "declarationNumber": "DEC-S4-SYNTHETIC",
  "revisionNumber": 1,
  "content": {
    "approvedSnapshotNumber": "SNP-S4-SYNTHETIC-APPROVED",
    "tradeRevisionNumber": 4,
    "shipmentPlanRevision": "SYNTHETIC-PLAN-1",
    "productionSalesUnit": {
      "partyRoleCode": 1,
      "participantSequenceNumber": 1
    },
    "domesticConsignor": {
      "partyRoleCode": 2,
      "participantSequenceNumber": 1
    },
    "overseasConsignee": {
      "partyRoleCode": 3,
      "participantSequenceNumber": 1
    },
    "customsAgent": {
      "partyRoleCode": 6,
      "participantSequenceNumber": 1
    },
    "customsOfficeCode": "SYNTHETIC-OFFICE",
    "channelCode": "SYNTHETIC-NOT-OFFICIAL",
    "destinationCountryCode": "VN",
    "transportReference": "SYNTHETIC-TRANSPORT",
    "authorizationEvidenceReference": "SYNTHETIC-NOT-VALID-AUTHORITY",
    "items": [
      {
        "itemSequenceNumber": 1,
        "tradeGoodsItemSequenceNumber": 1,
        "shipmentAllocationNumber": "SHP-S4-SYNTHETIC#1",
        "hsCode": "SYNTHETIC",
        "declaredDescription": "原创合成货物非真实归类",
        "specification": "SYNTHETIC",
        "declaredQuantity": "40.000000",
        "unitCode": "PCS",
        "declaredUnitPriceAmount": "100.00",
        "declaredTotalAmount": "4000.00",
        "currencyCode": "CNY",
        "originCountryCode": "CN"
      }
    ],
    "supportingFiles": [
      {
        "logicalFileNumber": "FILE-S4-SYNTHETIC",
        "revisionNumber": 1,
        "sha256": "4798e78866b4a0563bbb5ffebf2f1b7a3bf3f23cee90623749e666cd57944bd7",
        "documentTypeCode": 3
      }
    ]
  },
  "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
  "createdBy": "SYNTHETIC-F",
  "events": []
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/customs-declarations/DEC-S4-SYNTHETIC/revisions/1" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.customs.v1.ExternalCustomsService",
  "method": "GetCustomsRevision",
  "requestType": "GetCustomsRevisionReqMsg",
  "responseType": "GetCustomsRevisionRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>"
  },
  "request": {
    "declarationNumber": "DEC-S4-SYNTHETIC",
    "revisionNumber": 1
  },
  "response": {
    "resource": {
      "declarationNumber": "DEC-S4-SYNTHETIC",
      "revisionNumber": 1,
      "content": {
        "approvedSnapshotNumber": "SNP-S4-SYNTHETIC-APPROVED",
        "tradeRevisionNumber": 4,
        "shipmentPlanRevision": "SYNTHETIC-PLAN-1",
        "productionSalesUnit": {
          "partyRoleCode": 1,
          "participantSequenceNumber": 1
        },
        "domesticConsignor": {
          "partyRoleCode": 2,
          "participantSequenceNumber": 1
        },
        "overseasConsignee": {
          "partyRoleCode": 3,
          "participantSequenceNumber": 1
        },
        "customsAgent": {
          "partyRoleCode": 6,
          "participantSequenceNumber": 1
        },
        "customsOfficeCode": "SYNTHETIC-OFFICE",
        "channelCode": "SYNTHETIC-NOT-OFFICIAL",
        "destinationCountryCode": "VN",
        "transportReference": "SYNTHETIC-TRANSPORT",
        "authorizationEvidenceReference": "SYNTHETIC-NOT-VALID-AUTHORITY",
        "items": [
          {
            "itemSequenceNumber": 1,
            "tradeGoodsItemSequenceNumber": 1,
            "shipmentAllocationNumber": "SHP-S4-SYNTHETIC#1",
            "hsCode": "SYNTHETIC",
            "declaredDescription": "原创合成货物非真实归类",
            "specification": "SYNTHETIC",
            "declaredQuantity": "40.000000",
            "unitCode": "PCS",
            "declaredUnitPriceAmount": "100.00",
            "declaredTotalAmount": "4000.00",
            "currencyCode": "CNY",
            "originCountryCode": "CN"
          }
        ],
        "supportingFiles": [
          {
            "logicalFileNumber": "FILE-S4-SYNTHETIC",
            "revisionNumber": 1,
            "sha256": "4798e78866b4a0563bbb5ffebf2f1b7a3bf3f23cee90623749e666cd57944bd7",
            "documentTypeCode": 3
          }
        ]
      },
      "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
      "createdBy": "SYNTHETIC-F",
      "events": []
    }
  },
  "successTrailers": {}
}
```

## CreateCustomsReviewSubmission

`POST /api/v1/customs-declarations/DEC-S4-SYNTHETIC/review-submissions`

客户端/应用预算：10000/8000毫秒。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /api/v1/customs-declarations/DEC-S4-SYNTHETIC/events/EV-S4-SYNTHETIC

{
  "eventNumber": "EV-S4-SYNTHETIC",
  "declarationNumber": "DEC-S4-SYNTHETIC",
  "revisionNumber": 1,
  "actorReference": "SYNTHETIC-ACTOR",
  "state": "pending_review",
  "reason": "仅合成设计，不证明外部业务成功",
  "reviewSubmission": {
    "revisionNumber": 1,
    "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca"
  }
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/customs-declarations/DEC-S4-SYNTHETIC/review-submissions" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7040000-0000-4000-8000-000000000006' \
  --header 'If-Match: "s4-v1-57e9172357bd"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"revisionNumber":1,"contentHash":"57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca"}'
```

```json
{
  "designOnly": true,
  "service": "trade.customs.v1.ExternalCustomsService",
  "method": "CreateCustomsReviewSubmission",
  "requestType": "CreateCustomsReviewSubmissionReqMsg",
  "responseType": "CreateCustomsReviewSubmissionRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>",
    "idempotency-key": "d7040000-0000-4000-8000-000000000006",
    "if-match": "\"s4-v1-57e9172357bd\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "declarationNumber": "DEC-S4-SYNTHETIC",
    "submission": {
      "revisionNumber": 1,
      "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca"
    }
  },
  "response": {
    "resource": {
      "eventNumber": "EV-S4-SYNTHETIC",
      "declarationNumber": "DEC-S4-SYNTHETIC",
      "revisionNumber": 1,
      "actorReference": "SYNTHETIC-ACTOR",
      "state": "pending_review",
      "reason": "仅合成设计，不证明外部业务成功",
      "reviewSubmission": {
        "revisionNumber": 1,
        "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca"
      }
    }
  },
  "successTrailers": {}
}
```

## GetCustomsReviewContext

`GET /internal/v1/customs-declarations/DEC-S4-SYNTHETIC/review-context`

客户端/应用预算：5000/4000毫秒。

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "declaration": {
    "current": {
      "declarationNumber": "DEC-S4-SYNTHETIC",
      "revisionNumber": 1,
      "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
      "status": "DECLARATION_STATUS_DRAFT",
      "etag": "\"s4-v1-57e9172357bd\"",
      "acceptanceId": "ACCEPT-S4-SYNTHETIC"
    },
    "revision": {
      "declarationNumber": "DEC-S4-SYNTHETIC",
      "revisionNumber": 1,
      "content": {
        "approvedSnapshotNumber": "SNP-S4-SYNTHETIC-APPROVED",
        "tradeRevisionNumber": 4,
        "shipmentPlanRevision": "SYNTHETIC-PLAN-1",
        "productionSalesUnit": {
          "partyRoleCode": 1,
          "participantSequenceNumber": 1
        },
        "domesticConsignor": {
          "partyRoleCode": 2,
          "participantSequenceNumber": 1
        },
        "overseasConsignee": {
          "partyRoleCode": 3,
          "participantSequenceNumber": 1
        },
        "customsAgent": {
          "partyRoleCode": 6,
          "participantSequenceNumber": 1
        },
        "customsOfficeCode": "SYNTHETIC-OFFICE",
        "channelCode": "SYNTHETIC-NOT-OFFICIAL",
        "destinationCountryCode": "VN",
        "transportReference": "SYNTHETIC-TRANSPORT",
        "authorizationEvidenceReference": "SYNTHETIC-NOT-VALID-AUTHORITY",
        "items": [
          {
            "itemSequenceNumber": 1,
            "tradeGoodsItemSequenceNumber": 1,
            "shipmentAllocationNumber": "SHP-S4-SYNTHETIC#1",
            "hsCode": "SYNTHETIC",
            "declaredDescription": "原创合成货物非真实归类",
            "specification": "SYNTHETIC",
            "declaredQuantity": "40.000000",
            "unitCode": "PCS",
            "declaredUnitPriceAmount": "100.00",
            "declaredTotalAmount": "4000.00",
            "currencyCode": "CNY",
            "originCountryCode": "CN"
          }
        ],
        "supportingFiles": [
          {
            "logicalFileNumber": "FILE-S4-SYNTHETIC",
            "revisionNumber": 1,
            "sha256": "4798e78866b4a0563bbb5ffebf2f1b7a3bf3f23cee90623749e666cd57944bd7",
            "documentTypeCode": 3
          }
        ]
      },
      "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
      "createdBy": "SYNTHETIC-F",
      "events": []
    },
    "availableRevisions": [
      1
    ],
    "filingRequests": [],
    "events": [],
    "attachmentDeliveries": [],
    "missingGateCodes": [
      "CUSTOMS_AUTHORITY_UNVERIFIED"
    ]
  },
  "missingGateCodes": [
    "CUSTOMS_AUTHORITY_UNVERIFIED"
  ]
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/internal/v1/customs-declarations/DEC-S4-SYNTHETIC/review-context" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.customs.v1.InternalCustomsOperationsService",
  "method": "GetCustomsReviewContext",
  "requestType": "GetCustomsReviewContextReqMsg",
  "responseType": "GetCustomsReviewContextRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>"
  },
  "request": {
    "declarationNumber": "DEC-S4-SYNTHETIC"
  },
  "response": {
    "resource": {
      "declaration": {
        "current": {
          "declarationNumber": "DEC-S4-SYNTHETIC",
          "revisionNumber": 1,
          "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
          "status": "DECLARATION_STATUS_DRAFT",
          "etag": "\"s4-v1-57e9172357bd\"",
          "acceptanceId": "ACCEPT-S4-SYNTHETIC"
        },
        "revision": {
          "declarationNumber": "DEC-S4-SYNTHETIC",
          "revisionNumber": 1,
          "content": {
            "approvedSnapshotNumber": "SNP-S4-SYNTHETIC-APPROVED",
            "tradeRevisionNumber": 4,
            "shipmentPlanRevision": "SYNTHETIC-PLAN-1",
            "productionSalesUnit": {
              "partyRoleCode": 1,
              "participantSequenceNumber": 1
            },
            "domesticConsignor": {
              "partyRoleCode": 2,
              "participantSequenceNumber": 1
            },
            "overseasConsignee": {
              "partyRoleCode": 3,
              "participantSequenceNumber": 1
            },
            "customsAgent": {
              "partyRoleCode": 6,
              "participantSequenceNumber": 1
            },
            "customsOfficeCode": "SYNTHETIC-OFFICE",
            "channelCode": "SYNTHETIC-NOT-OFFICIAL",
            "destinationCountryCode": "VN",
            "transportReference": "SYNTHETIC-TRANSPORT",
            "authorizationEvidenceReference": "SYNTHETIC-NOT-VALID-AUTHORITY",
            "items": [
              {
                "itemSequenceNumber": 1,
                "tradeGoodsItemSequenceNumber": 1,
                "shipmentAllocationNumber": "SHP-S4-SYNTHETIC#1",
                "hsCode": "SYNTHETIC",
                "declaredDescription": "原创合成货物非真实归类",
                "specification": "SYNTHETIC",
                "declaredQuantity": "40.000000",
                "unitCode": "PCS",
                "declaredUnitPriceAmount": "100.00",
                "declaredTotalAmount": "4000.00",
                "currencyCode": "CNY",
                "originCountryCode": "CN"
              }
            ],
            "supportingFiles": [
              {
                "logicalFileNumber": "FILE-S4-SYNTHETIC",
                "revisionNumber": 1,
                "sha256": "4798e78866b4a0563bbb5ffebf2f1b7a3bf3f23cee90623749e666cd57944bd7",
                "documentTypeCode": 3
              }
            ]
          },
          "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
          "createdBy": "SYNTHETIC-F",
          "events": []
        },
        "availableRevisions": [
          1
        ],
        "filingRequests": [],
        "events": [],
        "attachmentDeliveries": [],
        "missingGateCodes": [
          "CUSTOMS_AUTHORITY_UNVERIFIED"
        ]
      },
      "missingGateCodes": [
        "CUSTOMS_AUTHORITY_UNVERIFIED"
      ]
    }
  },
  "successTrailers": {}
}
```

## CreateCustomsReviewDecision

`POST /internal/v1/customs-declarations/DEC-S4-SYNTHETIC/review-decisions`

客户端/应用预算：10000/8000毫秒。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /internal/v1/customs-declarations/DEC-S4-SYNTHETIC/events/EV-S4-SYNTHETIC

{
  "eventNumber": "EV-S4-SYNTHETIC",
  "declarationNumber": "DEC-S4-SYNTHETIC",
  "revisionNumber": 1,
  "actorReference": "SYNTHETIC-ACTOR",
  "state": "returned",
  "reason": "仅合成设计，不证明外部业务成功",
  "reviewDecision": {
    "submissionEventNumber": "EV-S4-SYNTHETIC-SUBMIT",
    "revisionNumber": 1,
    "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
    "outcome": "DECISION_OUTCOME_RETURN",
    "reason": "缺有效业务证明，退回补正",
    "verificationEvidence": []
  }
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/customs-declarations/DEC-S4-SYNTHETIC/review-decisions" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7040000-0000-4000-8000-000000000008' \
  --header 'If-Match: "s4-v1-57e9172357bd"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"submissionEventNumber":"EV-S4-SYNTHETIC-SUBMIT","revisionNumber":1,"contentHash":"57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca","outcome":"DECISION_OUTCOME_RETURN","reason":"缺有效业务证明，退回补正","verificationEvidence":[]}'
```

```json
{
  "designOnly": true,
  "service": "trade.customs.v1.InternalCustomsOperationsService",
  "method": "CreateCustomsReviewDecision",
  "requestType": "CreateCustomsReviewDecisionReqMsg",
  "responseType": "CreateCustomsReviewDecisionRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d7040000-0000-4000-8000-000000000008",
    "if-match": "\"s4-v1-57e9172357bd\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "declarationNumber": "DEC-S4-SYNTHETIC",
    "decision": {
      "submissionEventNumber": "EV-S4-SYNTHETIC-SUBMIT",
      "revisionNumber": 1,
      "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
      "outcome": "DECISION_OUTCOME_RETURN",
      "reason": "缺有效业务证明，退回补正",
      "verificationEvidence": []
    }
  },
  "response": {
    "resource": {
      "eventNumber": "EV-S4-SYNTHETIC",
      "declarationNumber": "DEC-S4-SYNTHETIC",
      "revisionNumber": 1,
      "actorReference": "SYNTHETIC-ACTOR",
      "state": "returned",
      "reason": "仅合成设计，不证明外部业务成功",
      "reviewDecision": {
        "submissionEventNumber": "EV-S4-SYNTHETIC-SUBMIT",
        "revisionNumber": 1,
        "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
        "outcome": "DECISION_OUTCOME_RETURN",
        "reason": "缺有效业务证明，退回补正",
        "verificationEvidence": []
      }
    }
  },
  "successTrailers": {}
}
```

## CreateCustomsExporterConfirmation

`POST /api/v1/customs-declarations/DEC-S4-SYNTHETIC/exporter-confirmations`

客户端/应用预算：10000/8000毫秒。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /api/v1/customs-declarations/DEC-S4-SYNTHETIC/events/EV-S4-SYNTHETIC

{
  "eventNumber": "EV-S4-SYNTHETIC",
  "declarationNumber": "DEC-S4-SYNTHETIC",
  "revisionNumber": 1,
  "actorReference": "SYNTHETIC-ACTOR",
  "state": "recorded_written_confirmation",
  "reason": "仅合成设计，不证明外部业务成功",
  "exporterConfirmation": {
    "revisionNumber": 1,
    "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
    "authorityReference": "SYNTHETIC-NOT-VALID-AUTHORITY",
    "writtenEvidence": [
      {
        "logicalFileNumber": "FILE-S4-WRITTEN",
        "revisionNumber": 1,
        "sha256": "2cdd2b12968cd24ac396a6f5cd3071fc134d80919678524d029a444763e1e57f",
        "documentTypeCode": 19
      }
    ]
  }
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/customs-declarations/DEC-S4-SYNTHETIC/exporter-confirmations" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7040000-0000-4000-8000-000000000009' \
  --header 'If-Match: "s4-v1-57e9172357bd"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"revisionNumber":1,"contentHash":"57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca","authorityReference":"SYNTHETIC-NOT-VALID-AUTHORITY","writtenEvidence":[{"logicalFileNumber":"FILE-S4-WRITTEN","revisionNumber":1,"sha256":"2cdd2b12968cd24ac396a6f5cd3071fc134d80919678524d029a444763e1e57f","documentTypeCode":19}]}'
```

```json
{
  "designOnly": true,
  "service": "trade.customs.v1.ExternalCustomsService",
  "method": "CreateCustomsExporterConfirmation",
  "requestType": "CreateCustomsExporterConfirmationReqMsg",
  "responseType": "CreateCustomsExporterConfirmationRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>",
    "idempotency-key": "d7040000-0000-4000-8000-000000000009",
    "if-match": "\"s4-v1-57e9172357bd\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "declarationNumber": "DEC-S4-SYNTHETIC",
    "confirmation": {
      "revisionNumber": 1,
      "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
      "authorityReference": "SYNTHETIC-NOT-VALID-AUTHORITY",
      "writtenEvidence": [
        {
          "logicalFileNumber": "FILE-S4-WRITTEN",
          "revisionNumber": 1,
          "sha256": "2cdd2b12968cd24ac396a6f5cd3071fc134d80919678524d029a444763e1e57f",
          "documentTypeCode": 19
        }
      ]
    }
  },
  "response": {
    "resource": {
      "eventNumber": "EV-S4-SYNTHETIC",
      "declarationNumber": "DEC-S4-SYNTHETIC",
      "revisionNumber": 1,
      "actorReference": "SYNTHETIC-ACTOR",
      "state": "recorded_written_confirmation",
      "reason": "仅合成设计，不证明外部业务成功",
      "exporterConfirmation": {
        "revisionNumber": 1,
        "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
        "authorityReference": "SYNTHETIC-NOT-VALID-AUTHORITY",
        "writtenEvidence": [
          {
            "logicalFileNumber": "FILE-S4-WRITTEN",
            "revisionNumber": 1,
            "sha256": "2cdd2b12968cd24ac396a6f5cd3071fc134d80919678524d029a444763e1e57f",
            "documentTypeCode": 19
          }
        ]
      }
    }
  },
  "successTrailers": {}
}
```

## CreateCustomsFilingRequest

`POST /api/v1/customs-declarations/DEC-S4-SYNTHETIC/filing-requests`

客户端/应用预算：10000/8000毫秒。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
ETag: "s4-v1-57e9172357bd"
Location: /api/v1/customs-declarations/DEC-S4-SYNTHETIC/filing-requests/REQ-S4-SYNTHETIC

{
  "requestNumber": "REQ-S4-SYNTHETIC",
  "declarationNumber": "DEC-S4-SYNTHETIC",
  "intent": {
    "revisionNumber": 1,
    "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
    "action": "FILING_ACTION_DECLARE",
    "reason": "仅登记本地待办，正式职责及渠道仍待确认"
  },
  "executionStatus": "EXECUTION_STATUS_PENDING",
  "missingGateCodes": [
    "CUSTOMS_AUTHORITY_UNVERIFIED",
    "CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED"
  ],
  "etag": "\"s4-v1-57e9172357bd\""
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/customs-declarations/DEC-S4-SYNTHETIC/filing-requests" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7040000-0000-4000-8000-000000000010' \
  --header 'If-Match: "s4-v1-57e9172357bd"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"revisionNumber":1,"contentHash":"57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca","action":"FILING_ACTION_DECLARE","reason":"仅登记本地待办，正式职责及渠道仍待确认"}'
```

```json
{
  "designOnly": true,
  "service": "trade.customs.v1.ExternalCustomsService",
  "method": "CreateCustomsFilingRequest",
  "requestType": "CreateCustomsFilingRequestReqMsg",
  "responseType": "CreateCustomsFilingRequestRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>",
    "idempotency-key": "d7040000-0000-4000-8000-000000000010",
    "if-match": "\"s4-v1-57e9172357bd\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "declarationNumber": "DEC-S4-SYNTHETIC",
    "filing": {
      "revisionNumber": 1,
      "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
      "action": "FILING_ACTION_DECLARE",
      "reason": "仅登记本地待办，正式职责及渠道仍待确认"
    }
  },
  "response": {
    "resource": {
      "requestNumber": "REQ-S4-SYNTHETIC",
      "declarationNumber": "DEC-S4-SYNTHETIC",
      "intent": {
        "revisionNumber": 1,
        "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
        "action": "FILING_ACTION_DECLARE",
        "reason": "仅登记本地待办，正式职责及渠道仍待确认"
      },
      "executionStatus": "EXECUTION_STATUS_PENDING",
      "missingGateCodes": [
        "CUSTOMS_AUTHORITY_UNVERIFIED",
        "CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED"
      ],
      "etag": "\"s4-v1-57e9172357bd\""
    }
  },
  "successTrailers": {}
}
```

## GetCustomsFilingRequest

`GET /api/v1/customs-declarations/DEC-S4-SYNTHETIC/filing-requests/REQ-S4-SYNTHETIC`

客户端/应用预算：5000/4000毫秒。

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s4-v1-57e9172357bd"

{
  "requestNumber": "REQ-S4-SYNTHETIC",
  "declarationNumber": "DEC-S4-SYNTHETIC",
  "intent": {
    "revisionNumber": 1,
    "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
    "action": "FILING_ACTION_DECLARE",
    "reason": "仅登记本地待办，正式职责及渠道仍待确认"
  },
  "executionStatus": "EXECUTION_STATUS_PENDING",
  "missingGateCodes": [
    "CUSTOMS_AUTHORITY_UNVERIFIED",
    "CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED"
  ],
  "etag": "\"s4-v1-57e9172357bd\""
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/customs-declarations/DEC-S4-SYNTHETIC/filing-requests/REQ-S4-SYNTHETIC" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.customs.v1.ExternalCustomsService",
  "method": "GetCustomsFilingRequest",
  "requestType": "GetCustomsFilingRequestReqMsg",
  "responseType": "GetCustomsFilingRequestRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>"
  },
  "request": {
    "declarationNumber": "DEC-S4-SYNTHETIC",
    "requestNumber": "REQ-S4-SYNTHETIC"
  },
  "response": {
    "resource": {
      "requestNumber": "REQ-S4-SYNTHETIC",
      "declarationNumber": "DEC-S4-SYNTHETIC",
      "intent": {
        "revisionNumber": 1,
        "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
        "action": "FILING_ACTION_DECLARE",
        "reason": "仅登记本地待办，正式职责及渠道仍待确认"
      },
      "executionStatus": "EXECUTION_STATUS_PENDING",
      "missingGateCodes": [
        "CUSTOMS_AUTHORITY_UNVERIFIED",
        "CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED"
      ],
      "etag": "\"s4-v1-57e9172357bd\""
    }
  },
  "successTrailers": {}
}
```

## CreateCustomsOfficialEvidence

`POST /api/v1/customs-declarations/DEC-S4-SYNTHETIC/official-evidence`

客户端/应用预算：10000/8000毫秒。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /api/v1/customs-declarations/DEC-S4-SYNTHETIC/official-evidence/EV-S4-SYNTHETIC

{
  "eventNumber": "EV-S4-SYNTHETIC",
  "declarationNumber": "DEC-S4-SYNTHETIC",
  "revisionNumber": 1,
  "actorReference": "SYNTHETIC-ACTOR",
  "state": "pending_verification",
  "reason": "仅合成设计，不证明外部业务成功",
  "officialEvidence": {
    "requestNumber": "REQ-S4-SYNTHETIC",
    "revisionNumber": 1,
    "kind": "OFFICIAL_KIND_SUBMITTED",
    "sourceEventKey": "SYNTHETIC-CLAIM-NOT-VERIFIED",
    "externalReferenceNumber": "SYNTHETIC-NOT-OFFICIAL",
    "files": [
      {
        "logicalFileNumber": "FILE-S4-AUTHORITY-CLAIM",
        "revisionNumber": 1,
        "sha256": "62c1d00fe1155148acf0d7ca4d888b0dc752cf9c93977247efaf4b55cd6c6e72",
        "documentTypeCode": 21
      }
    ],
    "occurredAt": "2026-10-25T01:00:00.123Z"
  }
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/customs-declarations/DEC-S4-SYNTHETIC/official-evidence" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7040000-0000-4000-8000-000000000012' \
  --header 'If-Match: "s4-v1-57e9172357bd"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"requestNumber":"REQ-S4-SYNTHETIC","revisionNumber":1,"kind":"OFFICIAL_KIND_SUBMITTED","sourceEventKey":"SYNTHETIC-CLAIM-NOT-VERIFIED","externalReferenceNumber":"SYNTHETIC-NOT-OFFICIAL","files":[{"logicalFileNumber":"FILE-S4-AUTHORITY-CLAIM","revisionNumber":1,"sha256":"62c1d00fe1155148acf0d7ca4d888b0dc752cf9c93977247efaf4b55cd6c6e72","documentTypeCode":21}],"occurredAt":"2026-10-25T01:00:00.123Z"}'
```

```json
{
  "designOnly": true,
  "service": "trade.customs.v1.ExternalCustomsService",
  "method": "CreateCustomsOfficialEvidence",
  "requestType": "CreateCustomsOfficialEvidenceReqMsg",
  "responseType": "CreateCustomsOfficialEvidenceRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>",
    "idempotency-key": "d7040000-0000-4000-8000-000000000012",
    "if-match": "\"s4-v1-57e9172357bd\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "declarationNumber": "DEC-S4-SYNTHETIC",
    "evidence": {
      "requestNumber": "REQ-S4-SYNTHETIC",
      "revisionNumber": 1,
      "kind": "OFFICIAL_KIND_SUBMITTED",
      "sourceEventKey": "SYNTHETIC-CLAIM-NOT-VERIFIED",
      "externalReferenceNumber": "SYNTHETIC-NOT-OFFICIAL",
      "files": [
        {
          "logicalFileNumber": "FILE-S4-AUTHORITY-CLAIM",
          "revisionNumber": 1,
          "sha256": "62c1d00fe1155148acf0d7ca4d888b0dc752cf9c93977247efaf4b55cd6c6e72",
          "documentTypeCode": 21
        }
      ],
      "occurredAt": "2026-10-25T01:00:00.123Z"
    }
  },
  "response": {
    "resource": {
      "eventNumber": "EV-S4-SYNTHETIC",
      "declarationNumber": "DEC-S4-SYNTHETIC",
      "revisionNumber": 1,
      "actorReference": "SYNTHETIC-ACTOR",
      "state": "pending_verification",
      "reason": "仅合成设计，不证明外部业务成功",
      "officialEvidence": {
        "requestNumber": "REQ-S4-SYNTHETIC",
        "revisionNumber": 1,
        "kind": "OFFICIAL_KIND_SUBMITTED",
        "sourceEventKey": "SYNTHETIC-CLAIM-NOT-VERIFIED",
        "externalReferenceNumber": "SYNTHETIC-NOT-OFFICIAL",
        "files": [
          {
            "logicalFileNumber": "FILE-S4-AUTHORITY-CLAIM",
            "revisionNumber": 1,
            "sha256": "62c1d00fe1155148acf0d7ca4d888b0dc752cf9c93977247efaf4b55cd6c6e72",
            "documentTypeCode": 21
          }
        ],
        "occurredAt": "2026-10-25T01:00:00.123Z"
      }
    }
  },
  "successTrailers": {}
}
```

## GetCustomsOfficialEvidence

`GET /api/v1/customs-declarations/DEC-S4-SYNTHETIC/official-evidence/EV-S4-SYNTHETIC`

客户端/应用预算：5000/4000毫秒。

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "eventNumber": "EV-S4-SYNTHETIC",
  "declarationNumber": "DEC-S4-SYNTHETIC",
  "revisionNumber": 1,
  "actorReference": "SYNTHETIC-ACTOR",
  "state": "pending_verification",
  "reason": "仅合成设计，不证明外部业务成功",
  "officialEvidence": {
    "requestNumber": "REQ-S4-SYNTHETIC",
    "revisionNumber": 1,
    "kind": "OFFICIAL_KIND_SUBMITTED",
    "sourceEventKey": "SYNTHETIC-CLAIM-NOT-VERIFIED",
    "externalReferenceNumber": "SYNTHETIC-NOT-OFFICIAL",
    "files": [
      {
        "logicalFileNumber": "FILE-S4-AUTHORITY-CLAIM",
        "revisionNumber": 1,
        "sha256": "62c1d00fe1155148acf0d7ca4d888b0dc752cf9c93977247efaf4b55cd6c6e72",
        "documentTypeCode": 21
      }
    ],
    "occurredAt": "2026-10-25T01:00:00.123Z"
  }
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/customs-declarations/DEC-S4-SYNTHETIC/official-evidence/EV-S4-SYNTHETIC" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.customs.v1.ExternalCustomsService",
  "method": "GetCustomsOfficialEvidence",
  "requestType": "GetCustomsOfficialEvidenceReqMsg",
  "responseType": "GetCustomsOfficialEvidenceRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>"
  },
  "request": {
    "declarationNumber": "DEC-S4-SYNTHETIC",
    "eventNumber": "EV-S4-SYNTHETIC"
  },
  "response": {
    "resource": {
      "eventNumber": "EV-S4-SYNTHETIC",
      "declarationNumber": "DEC-S4-SYNTHETIC",
      "revisionNumber": 1,
      "actorReference": "SYNTHETIC-ACTOR",
      "state": "pending_verification",
      "reason": "仅合成设计，不证明外部业务成功",
      "officialEvidence": {
        "requestNumber": "REQ-S4-SYNTHETIC",
        "revisionNumber": 1,
        "kind": "OFFICIAL_KIND_SUBMITTED",
        "sourceEventKey": "SYNTHETIC-CLAIM-NOT-VERIFIED",
        "externalReferenceNumber": "SYNTHETIC-NOT-OFFICIAL",
        "files": [
          {
            "logicalFileNumber": "FILE-S4-AUTHORITY-CLAIM",
            "revisionNumber": 1,
            "sha256": "62c1d00fe1155148acf0d7ca4d888b0dc752cf9c93977247efaf4b55cd6c6e72",
            "documentTypeCode": 21
          }
        ],
        "occurredAt": "2026-10-25T01:00:00.123Z"
      }
    }
  },
  "successTrailers": {}
}
```

## CreateCustomsOfficialEvidenceDecision

`POST /internal/v1/customs-declarations/DEC-S4-SYNTHETIC/official-evidence-decisions`

客户端/应用预算：10000/8000毫秒。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /internal/v1/customs-declarations/DEC-S4-SYNTHETIC/events/EV-S4-SYNTHETIC

{
  "eventNumber": "EV-S4-SYNTHETIC",
  "declarationNumber": "DEC-S4-SYNTHETIC",
  "revisionNumber": 1,
  "actorReference": "SYNTHETIC-ACTOR",
  "state": "verification_returned",
  "reason": "仅合成设计，不证明外部业务成功",
  "officialEvidenceDecision": {
    "evidenceEventNumber": "EV-S4-SYNTHETIC",
    "outcome": "DECISION_OUTCOME_RETURN",
    "reason": "正式来源未接入，仅退回核实不记海关退单",
    "verificationProfileReference": "SYNTHETIC-NOT-REGISTERED",
    "verificationEvidence": []
  }
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/customs-declarations/DEC-S4-SYNTHETIC/official-evidence-decisions" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7040000-0000-4000-8000-000000000014' \
  --header 'If-Match: "s4-v1-57e9172357bd"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"evidenceEventNumber":"EV-S4-SYNTHETIC","outcome":"DECISION_OUTCOME_RETURN","reason":"正式来源未接入，仅退回核实不记海关退单","verificationProfileReference":"SYNTHETIC-NOT-REGISTERED","verificationEvidence":[]}'
```

```json
{
  "designOnly": true,
  "service": "trade.customs.v1.InternalCustomsOperationsService",
  "method": "CreateCustomsOfficialEvidenceDecision",
  "requestType": "CreateCustomsOfficialEvidenceDecisionReqMsg",
  "responseType": "CreateCustomsOfficialEvidenceDecisionRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d7040000-0000-4000-8000-000000000014",
    "if-match": "\"s4-v1-57e9172357bd\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "declarationNumber": "DEC-S4-SYNTHETIC",
    "decision": {
      "evidenceEventNumber": "EV-S4-SYNTHETIC",
      "outcome": "DECISION_OUTCOME_RETURN",
      "reason": "正式来源未接入，仅退回核实不记海关退单",
      "verificationProfileReference": "SYNTHETIC-NOT-REGISTERED",
      "verificationEvidence": []
    }
  },
  "response": {
    "resource": {
      "eventNumber": "EV-S4-SYNTHETIC",
      "declarationNumber": "DEC-S4-SYNTHETIC",
      "revisionNumber": 1,
      "actorReference": "SYNTHETIC-ACTOR",
      "state": "verification_returned",
      "reason": "仅合成设计，不证明外部业务成功",
      "officialEvidenceDecision": {
        "evidenceEventNumber": "EV-S4-SYNTHETIC",
        "outcome": "DECISION_OUTCOME_RETURN",
        "reason": "正式来源未接入，仅退回核实不记海关退单",
        "verificationProfileReference": "SYNTHETIC-NOT-REGISTERED",
        "verificationEvidence": []
      }
    }
  },
  "successTrailers": {}
}
```

## CreateCustomsAttachmentDelivery

`POST /api/v1/customs-declarations/DEC-S4-SYNTHETIC/attachment-deliveries`

客户端/应用预算：10000/8000毫秒。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /api/v1/customs-declarations/DEC-S4-SYNTHETIC/attachment-deliveries/DEL-S4-SYNTHETIC

{
  "deliveryNumber": "DEL-S4-SYNTHETIC",
  "declarationNumber": "DEC-S4-SYNTHETIC",
  "content": {
    "revisionNumber": 1,
    "submittedEventNumber": "SYNTHETIC-NOT-A-REAL-SUBMISSION",
    "recipientPartyRoleCode": 2,
    "recipientParticipantSequenceNumber": 1,
    "attachmentTwo": {
      "logicalFileNumber": "FILE-S4-ATTACHMENT-SHAPE",
      "revisionNumber": 1,
      "sha256": "142688a3f9c2ff44906430e8d07108b72252cbe0806e5cbb60f3af0736d55110",
      "documentTypeCode": 20
    }
  },
  "state": "delivered",
  "receipts": []
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/customs-declarations/DEC-S4-SYNTHETIC/attachment-deliveries" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7040000-0000-4000-8000-000000000015' \
  --header 'If-Match: "s4-v1-57e9172357bd"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"revisionNumber":1,"submittedEventNumber":"SYNTHETIC-NOT-A-REAL-SUBMISSION","recipientPartyRoleCode":2,"recipientParticipantSequenceNumber":1,"attachmentTwo":{"logicalFileNumber":"FILE-S4-ATTACHMENT-SHAPE","revisionNumber":1,"sha256":"142688a3f9c2ff44906430e8d07108b72252cbe0806e5cbb60f3af0736d55110","documentTypeCode":20}}'
```

```json
{
  "designOnly": true,
  "service": "trade.customs.v1.ExternalCustomsService",
  "method": "CreateCustomsAttachmentDelivery",
  "requestType": "CreateCustomsAttachmentDeliveryReqMsg",
  "responseType": "CreateCustomsAttachmentDeliveryRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>",
    "idempotency-key": "d7040000-0000-4000-8000-000000000015",
    "if-match": "\"s4-v1-57e9172357bd\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "declarationNumber": "DEC-S4-SYNTHETIC",
    "delivery": {
      "revisionNumber": 1,
      "submittedEventNumber": "SYNTHETIC-NOT-A-REAL-SUBMISSION",
      "recipientPartyRoleCode": 2,
      "recipientParticipantSequenceNumber": 1,
      "attachmentTwo": {
        "logicalFileNumber": "FILE-S4-ATTACHMENT-SHAPE",
        "revisionNumber": 1,
        "sha256": "142688a3f9c2ff44906430e8d07108b72252cbe0806e5cbb60f3af0736d55110",
        "documentTypeCode": 20
      }
    }
  },
  "response": {
    "resource": {
      "deliveryNumber": "DEL-S4-SYNTHETIC",
      "declarationNumber": "DEC-S4-SYNTHETIC",
      "content": {
        "revisionNumber": 1,
        "submittedEventNumber": "SYNTHETIC-NOT-A-REAL-SUBMISSION",
        "recipientPartyRoleCode": 2,
        "recipientParticipantSequenceNumber": 1,
        "attachmentTwo": {
          "logicalFileNumber": "FILE-S4-ATTACHMENT-SHAPE",
          "revisionNumber": 1,
          "sha256": "142688a3f9c2ff44906430e8d07108b72252cbe0806e5cbb60f3af0736d55110",
          "documentTypeCode": 20
        }
      },
      "state": "delivered",
      "receipts": []
    }
  },
  "successTrailers": {}
}
```

## GetCustomsAttachmentDelivery

`GET /api/v1/customs-declarations/DEC-S4-SYNTHETIC/attachment-deliveries/DEL-S4-SYNTHETIC`

客户端/应用预算：5000/4000毫秒。

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "deliveryNumber": "DEL-S4-SYNTHETIC",
  "declarationNumber": "DEC-S4-SYNTHETIC",
  "content": {
    "revisionNumber": 1,
    "submittedEventNumber": "SYNTHETIC-NOT-A-REAL-SUBMISSION",
    "recipientPartyRoleCode": 2,
    "recipientParticipantSequenceNumber": 1,
    "attachmentTwo": {
      "logicalFileNumber": "FILE-S4-ATTACHMENT-SHAPE",
      "revisionNumber": 1,
      "sha256": "142688a3f9c2ff44906430e8d07108b72252cbe0806e5cbb60f3af0736d55110",
      "documentTypeCode": 20
    }
  },
  "state": "delivered",
  "receipts": []
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/customs-declarations/DEC-S4-SYNTHETIC/attachment-deliveries/DEL-S4-SYNTHETIC" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.customs.v1.ExternalCustomsService",
  "method": "GetCustomsAttachmentDelivery",
  "requestType": "GetCustomsAttachmentDeliveryReqMsg",
  "responseType": "GetCustomsAttachmentDeliveryRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>"
  },
  "request": {
    "declarationNumber": "DEC-S4-SYNTHETIC",
    "deliveryNumber": "DEL-S4-SYNTHETIC"
  },
  "response": {
    "resource": {
      "deliveryNumber": "DEL-S4-SYNTHETIC",
      "declarationNumber": "DEC-S4-SYNTHETIC",
      "content": {
        "revisionNumber": 1,
        "submittedEventNumber": "SYNTHETIC-NOT-A-REAL-SUBMISSION",
        "recipientPartyRoleCode": 2,
        "recipientParticipantSequenceNumber": 1,
        "attachmentTwo": {
          "logicalFileNumber": "FILE-S4-ATTACHMENT-SHAPE",
          "revisionNumber": 1,
          "sha256": "142688a3f9c2ff44906430e8d07108b72252cbe0806e5cbb60f3af0736d55110",
          "documentTypeCode": 20
        }
      },
      "state": "delivered",
      "receipts": []
    }
  },
  "successTrailers": {}
}
```

## CreateCustomsAttachmentReceipt

`POST /api/v1/customs-declarations/DEC-S4-SYNTHETIC/attachment-deliveries/DEL-S4-SYNTHETIC/receipts`

客户端/应用预算：10000/8000毫秒。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /api/v1/customs-declarations/DEC-S4-SYNTHETIC/events/EV-S4-SYNTHETIC

{
  "eventNumber": "EV-S4-SYNTHETIC",
  "declarationNumber": "DEC-S4-SYNTHETIC",
  "revisionNumber": 1,
  "actorReference": "SYNTHETIC-ACTOR",
  "state": "disputed",
  "reason": "仅合成设计，不证明外部业务成功",
  "attachmentReceipt": {
    "outcome": "disputed",
    "reason": "仅设计：来源未核实，不承认收到正式附件2",
    "evidence": [
      {
        "logicalFileNumber": "FILE-S4-SYNTHETIC",
        "revisionNumber": 1,
        "sha256": "4798e78866b4a0563bbb5ffebf2f1b7a3bf3f23cee90623749e666cd57944bd7",
        "documentTypeCode": 3
      }
    ]
  }
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/customs-declarations/DEC-S4-SYNTHETIC/attachment-deliveries/DEL-S4-SYNTHETIC/receipts" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7040000-0000-4000-8000-000000000017' \
  --header 'If-Match: "s4-v1-57e9172357bd"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"outcome":"disputed","reason":"仅设计：来源未核实，不承认收到正式附件2","evidence":[{"logicalFileNumber":"FILE-S4-SYNTHETIC","revisionNumber":1,"sha256":"4798e78866b4a0563bbb5ffebf2f1b7a3bf3f23cee90623749e666cd57944bd7","documentTypeCode":3}]}'
```

```json
{
  "designOnly": true,
  "service": "trade.customs.v1.ExternalCustomsService",
  "method": "CreateCustomsAttachmentReceipt",
  "requestType": "CreateCustomsAttachmentReceiptReqMsg",
  "responseType": "CreateCustomsAttachmentReceiptRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>",
    "idempotency-key": "d7040000-0000-4000-8000-000000000017",
    "if-match": "\"s4-v1-57e9172357bd\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "declarationNumber": "DEC-S4-SYNTHETIC",
    "deliveryNumber": "DEL-S4-SYNTHETIC",
    "receipt": {
      "outcome": "disputed",
      "reason": "仅设计：来源未核实，不承认收到正式附件2",
      "evidence": [
        {
          "logicalFileNumber": "FILE-S4-SYNTHETIC",
          "revisionNumber": 1,
          "sha256": "4798e78866b4a0563bbb5ffebf2f1b7a3bf3f23cee90623749e666cd57944bd7",
          "documentTypeCode": 3
        }
      ]
    }
  },
  "response": {
    "resource": {
      "eventNumber": "EV-S4-SYNTHETIC",
      "declarationNumber": "DEC-S4-SYNTHETIC",
      "revisionNumber": 1,
      "actorReference": "SYNTHETIC-ACTOR",
      "state": "disputed",
      "reason": "仅合成设计，不证明外部业务成功",
      "attachmentReceipt": {
        "outcome": "disputed",
        "reason": "仅设计：来源未核实，不承认收到正式附件2",
        "evidence": [
          {
            "logicalFileNumber": "FILE-S4-SYNTHETIC",
            "revisionNumber": 1,
            "sha256": "4798e78866b4a0563bbb5ffebf2f1b7a3bf3f23cee90623749e666cd57944bd7",
            "documentTypeCode": 3
          }
        ]
      }
    }
  },
  "successTrailers": {}
}
```

## GetCustomsEvent

`GET /api/v1/customs-declarations/DEC-S4-SYNTHETIC/events/EV-S4-SYNTHETIC`

客户端/应用预算：5000/4000毫秒。

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "eventNumber": "EV-S4-SYNTHETIC",
  "declarationNumber": "DEC-S4-SYNTHETIC",
  "revisionNumber": 1,
  "actorReference": "SYNTHETIC-ACTOR",
  "state": "pending_review",
  "reason": "仅合成设计，不证明外部业务成功",
  "reviewSubmission": {
    "revisionNumber": 1,
    "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca"
  }
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/customs-declarations/DEC-S4-SYNTHETIC/events/EV-S4-SYNTHETIC" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.customs.v1.ExternalCustomsService",
  "method": "GetCustomsEvent",
  "requestType": "GetCustomsEventReqMsg",
  "responseType": "GetCustomsEventRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>"
  },
  "request": {
    "declarationNumber": "DEC-S4-SYNTHETIC",
    "eventNumber": "EV-S4-SYNTHETIC"
  },
  "response": {
    "resource": {
      "eventNumber": "EV-S4-SYNTHETIC",
      "declarationNumber": "DEC-S4-SYNTHETIC",
      "revisionNumber": 1,
      "actorReference": "SYNTHETIC-ACTOR",
      "state": "pending_review",
      "reason": "仅合成设计，不证明外部业务成功",
      "reviewSubmission": {
        "revisionNumber": 1,
        "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca"
      }
    }
  },
  "successTrailers": {}
}
```

## GetInternalCustomsEvent

`GET /internal/v1/customs-declarations/DEC-S4-SYNTHETIC/events/EV-S4-SYNTHETIC`

客户端/应用预算：5000/4000毫秒。

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "eventNumber": "EV-S4-SYNTHETIC",
  "declarationNumber": "DEC-S4-SYNTHETIC",
  "revisionNumber": 1,
  "actorReference": "SYNTHETIC-ACTOR",
  "state": "returned",
  "reason": "仅合成设计，不证明外部业务成功",
  "reviewDecision": {
    "submissionEventNumber": "EV-S4-SYNTHETIC-SUBMIT",
    "revisionNumber": 1,
    "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
    "outcome": "DECISION_OUTCOME_RETURN",
    "reason": "缺有效业务证明，退回补正",
    "verificationEvidence": []
  }
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/internal/v1/customs-declarations/DEC-S4-SYNTHETIC/events/EV-S4-SYNTHETIC" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.customs.v1.InternalCustomsOperationsService",
  "method": "GetInternalCustomsEvent",
  "requestType": "GetInternalCustomsEventReqMsg",
  "responseType": "GetInternalCustomsEventRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>"
  },
  "request": {
    "declarationNumber": "DEC-S4-SYNTHETIC",
    "eventNumber": "EV-S4-SYNTHETIC"
  },
  "response": {
    "resource": {
      "eventNumber": "EV-S4-SYNTHETIC",
      "declarationNumber": "DEC-S4-SYNTHETIC",
      "revisionNumber": 1,
      "actorReference": "SYNTHETIC-ACTOR",
      "state": "returned",
      "reason": "仅合成设计，不证明外部业务成功",
      "reviewDecision": {
        "submissionEventNumber": "EV-S4-SYNTHETIC-SUBMIT",
        "revisionNumber": 1,
        "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
        "outcome": "DECISION_OUTCOME_RETURN",
        "reason": "缺有效业务证明，退回补正",
        "verificationEvidence": []
      }
    }
  },
  "successTrailers": {}
}
```

# 更正/撤回/核实/分别交付与错收件方阻断例

## correction

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "urn:export-trade:problem:customs-authority-unverified",
  "title": "正式条件不满足",
  "status": 422,
  "detail": "CUSTOMS_AUTHORITY_UNVERIFIED",
  "instance": "/api/v1/customs-declarations/DEC-S4-SYNTHETIC/filing-requests",
  "errors": [
    {
      "pointer": "/",
      "code": "CUSTOMS_AUTHORITY_UNVERIFIED",
      "detail": "无真实正式证据不得降级成功"
    }
  ],
  "outcomeUnknown": false,
  "retryAfterMs": 0
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/customs-declarations/DEC-S4-SYNTHETIC/filing-requests" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7041111-0000-4000-8000-000000000001' \
  --header 'If-Match: "s4-v1-57e9172357bd"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"revisionNumber":2,"contentHash":"57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca","action":"FILING_ACTION_CORRECT","reason":"正式更正需要原号、许可、新版独审及A确认","originalRequestNumber":"REQ-S4-SYNTHETIC","correctionEventNumber":"SYNTHETIC-NOT-A-VERIFIED-CORRECTION"}'
```

```json
{
  "designOnly": true,
  "service": "trade.customs.v1.ExternalCustomsService",
  "method": "CreateCustomsFilingRequest",
  "requestType": "CreateCustomsFilingRequestReqMsg",
  "responseType": "CreateCustomsFilingRequestRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>",
    "idempotency-key": "d7041111-0000-4000-8000-000000000001",
    "if-match": "\"s4-v1-57e9172357bd\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "declarationNumber": "DEC-S4-SYNTHETIC",
    "filing": {
      "revisionNumber": 2,
      "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
      "action": "FILING_ACTION_CORRECT",
      "reason": "正式更正需要原号、许可、新版独审及A确认",
      "originalRequestNumber": "REQ-S4-SYNTHETIC",
      "correctionEventNumber": "SYNTHETIC-NOT-A-VERIFIED-CORRECTION"
    }
  },
  "successTrailers": {},
  "error": {
    "code": "FAILED_PRECONDITION",
    "details": {
      "code": "CUSTOMS_AUTHORITY_UNVERIFIED",
      "httpStatus": 422,
      "errors": [
        {
          "pointer": "/",
          "code": "CUSTOMS_AUTHORITY_UNVERIFIED",
          "detail": "无真实正式证据不得降级成功"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "/api/v1/customs-declarations/DEC-S4-SYNTHETIC/filing-requests"
    }
  }
}
```

## withdrawal

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "urn:export-trade:problem:customs-official-evidence-required",
  "title": "正式条件不满足",
  "status": 422,
  "detail": "CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED",
  "instance": "/api/v1/customs-declarations/DEC-S4-SYNTHETIC/filing-requests",
  "errors": [
    {
      "pointer": "/",
      "code": "CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED",
      "detail": "无真实正式证据不得降级成功"
    }
  ],
  "outcomeUnknown": false,
  "retryAfterMs": 0
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/customs-declarations/DEC-S4-SYNTHETIC/filing-requests" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7041111-0000-4000-8000-000000000002' \
  --header 'If-Match: "s4-v1-57e9172357bd"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"revisionNumber":1,"contentHash":"57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca","action":"FILING_ACTION_WITHDRAW","reason":"仅原号撤回意图；无正式依据不改变状态或释放占量","originalRequestNumber":"REQ-S4-SYNTHETIC"}'
```

```json
{
  "designOnly": true,
  "service": "trade.customs.v1.ExternalCustomsService",
  "method": "CreateCustomsFilingRequest",
  "requestType": "CreateCustomsFilingRequestReqMsg",
  "responseType": "CreateCustomsFilingRequestRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>",
    "idempotency-key": "d7041111-0000-4000-8000-000000000002",
    "if-match": "\"s4-v1-57e9172357bd\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "declarationNumber": "DEC-S4-SYNTHETIC",
    "filing": {
      "revisionNumber": 1,
      "contentHash": "57e9172357bd31326b1ca3015f93d19bbd570ca4f551ad8588929f3e2a536bca",
      "action": "FILING_ACTION_WITHDRAW",
      "reason": "仅原号撤回意图；无正式依据不改变状态或释放占量",
      "originalRequestNumber": "REQ-S4-SYNTHETIC"
    }
  },
  "successTrailers": {},
  "error": {
    "code": "FAILED_PRECONDITION",
    "details": {
      "code": "CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED",
      "httpStatus": 422,
      "errors": [
        {
          "pointer": "/",
          "code": "CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED",
          "detail": "无真实正式证据不得降级成功"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "/api/v1/customs-declarations/DEC-S4-SYNTHETIC/filing-requests"
    }
  }
}
```

## release-verification

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "urn:export-trade:problem:customs-official-evidence-required",
  "title": "正式条件不满足",
  "status": 422,
  "detail": "CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED",
  "instance": "/internal/v1/customs-declarations/DEC-S4-SYNTHETIC/official-evidence-decisions",
  "errors": [
    {
      "pointer": "/",
      "code": "CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED",
      "detail": "无真实正式证据不得降级成功"
    }
  ],
  "outcomeUnknown": false,
  "retryAfterMs": 0
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/customs-declarations/DEC-S4-SYNTHETIC/official-evidence-decisions" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7041111-0000-4000-8000-000000000003' \
  --header 'If-Match: "s4-v1-57e9172357bd"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"evidenceEventNumber":"EV-S4-SYNTHETIC","outcome":"DECISION_OUTCOME_APPROVE","reason":"缺正式来源不能确认放行","verificationProfileReference":"SYNTHETIC-NOT-REGISTERED","verificationEvidence":[]}'
```

```json
{
  "designOnly": true,
  "service": "trade.customs.v1.InternalCustomsOperationsService",
  "method": "CreateCustomsOfficialEvidenceDecision",
  "requestType": "CreateCustomsOfficialEvidenceDecisionReqMsg",
  "responseType": "CreateCustomsOfficialEvidenceDecisionRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d7041111-0000-4000-8000-000000000003",
    "if-match": "\"s4-v1-57e9172357bd\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "declarationNumber": "DEC-S4-SYNTHETIC",
    "decision": {
      "evidenceEventNumber": "EV-S4-SYNTHETIC",
      "outcome": "DECISION_OUTCOME_APPROVE",
      "reason": "缺正式来源不能确认放行",
      "verificationProfileReference": "SYNTHETIC-NOT-REGISTERED",
      "verificationEvidence": []
    }
  },
  "successTrailers": {},
  "error": {
    "code": "FAILED_PRECONDITION",
    "details": {
      "code": "CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED",
      "httpStatus": 422,
      "errors": [
        {
          "pointer": "/",
          "code": "CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED",
          "detail": "无真实正式证据不得降级成功"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "/internal/v1/customs-declarations/DEC-S4-SYNTHETIC/official-evidence-decisions"
    }
  }
}
```

## attachment-A

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "urn:export-trade:problem:customs-official-evidence-required",
  "title": "正式条件不满足",
  "status": 422,
  "detail": "CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED",
  "instance": "/api/v1/customs-declarations/DEC-S4-SYNTHETIC/attachment-deliveries",
  "errors": [
    {
      "pointer": "/",
      "code": "CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED",
      "detail": "无真实正式证据不得降级成功"
    }
  ],
  "outcomeUnknown": false,
  "retryAfterMs": 0
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/customs-declarations/DEC-S4-SYNTHETIC/attachment-deliveries" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7041111-0000-4000-8000-000000000004' \
  --header 'If-Match: "s4-v1-57e9172357bd"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"revisionNumber":1,"submittedEventNumber":"SYNTHETIC-NOT-A-REAL-SUBMISSION","recipientPartyRoleCode":1,"recipientParticipantSequenceNumber":1,"attachmentTwo":{"logicalFileNumber":"FILE-S4-ATTACHMENT-SHAPE","revisionNumber":1,"sha256":"142688a3f9c2ff44906430e8d07108b72252cbe0806e5cbb60f3af0736d55110","documentTypeCode":20}}'
```

```json
{
  "designOnly": true,
  "service": "trade.customs.v1.ExternalCustomsService",
  "method": "CreateCustomsAttachmentDelivery",
  "requestType": "CreateCustomsAttachmentDeliveryReqMsg",
  "responseType": "CreateCustomsAttachmentDeliveryRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>",
    "idempotency-key": "d7041111-0000-4000-8000-000000000004",
    "if-match": "\"s4-v1-57e9172357bd\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "declarationNumber": "DEC-S4-SYNTHETIC",
    "delivery": {
      "revisionNumber": 1,
      "submittedEventNumber": "SYNTHETIC-NOT-A-REAL-SUBMISSION",
      "recipientPartyRoleCode": 1,
      "recipientParticipantSequenceNumber": 1,
      "attachmentTwo": {
        "logicalFileNumber": "FILE-S4-ATTACHMENT-SHAPE",
        "revisionNumber": 1,
        "sha256": "142688a3f9c2ff44906430e8d07108b72252cbe0806e5cbb60f3af0736d55110",
        "documentTypeCode": 20
      }
    }
  },
  "successTrailers": {},
  "error": {
    "code": "FAILED_PRECONDITION",
    "details": {
      "code": "CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED",
      "httpStatus": 422,
      "errors": [
        {
          "pointer": "/",
          "code": "CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED",
          "detail": "无真实正式证据不得降级成功"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "/api/v1/customs-declarations/DEC-S4-SYNTHETIC/attachment-deliveries"
    }
  }
}
```

## attachment-B

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "urn:export-trade:problem:customs-official-evidence-required",
  "title": "正式条件不满足",
  "status": 422,
  "detail": "CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED",
  "instance": "/api/v1/customs-declarations/DEC-S4-SYNTHETIC/attachment-deliveries",
  "errors": [
    {
      "pointer": "/",
      "code": "CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED",
      "detail": "无真实正式证据不得降级成功"
    }
  ],
  "outcomeUnknown": false,
  "retryAfterMs": 0
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/customs-declarations/DEC-S4-SYNTHETIC/attachment-deliveries" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7041111-0000-4000-8000-000000000005' \
  --header 'If-Match: "s4-v1-57e9172357bd"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"revisionNumber":1,"submittedEventNumber":"SYNTHETIC-NOT-A-REAL-SUBMISSION","recipientPartyRoleCode":2,"recipientParticipantSequenceNumber":1,"attachmentTwo":{"logicalFileNumber":"FILE-S4-ATTACHMENT-SHAPE","revisionNumber":1,"sha256":"142688a3f9c2ff44906430e8d07108b72252cbe0806e5cbb60f3af0736d55110","documentTypeCode":20}}'
```

```json
{
  "designOnly": true,
  "service": "trade.customs.v1.ExternalCustomsService",
  "method": "CreateCustomsAttachmentDelivery",
  "requestType": "CreateCustomsAttachmentDeliveryReqMsg",
  "responseType": "CreateCustomsAttachmentDeliveryRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>",
    "idempotency-key": "d7041111-0000-4000-8000-000000000005",
    "if-match": "\"s4-v1-57e9172357bd\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "declarationNumber": "DEC-S4-SYNTHETIC",
    "delivery": {
      "revisionNumber": 1,
      "submittedEventNumber": "SYNTHETIC-NOT-A-REAL-SUBMISSION",
      "recipientPartyRoleCode": 2,
      "recipientParticipantSequenceNumber": 1,
      "attachmentTwo": {
        "logicalFileNumber": "FILE-S4-ATTACHMENT-SHAPE",
        "revisionNumber": 1,
        "sha256": "142688a3f9c2ff44906430e8d07108b72252cbe0806e5cbb60f3af0736d55110",
        "documentTypeCode": 20
      }
    }
  },
  "successTrailers": {},
  "error": {
    "code": "FAILED_PRECONDITION",
    "details": {
      "code": "CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED",
      "httpStatus": 422,
      "errors": [
        {
          "pointer": "/",
          "code": "CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED",
          "detail": "无真实正式证据不得降级成功"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "/api/v1/customs-declarations/DEC-S4-SYNTHETIC/attachment-deliveries"
    }
  }
}
```

## wrong-recipient

```http
HTTP/1.1 403 Error
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "urn:export-trade:problem:customs-recipient-mismatch",
  "title": "正式条件不满足",
  "status": 403,
  "detail": "CUSTOMS_RECIPIENT_MISMATCH",
  "instance": "/api/v1/customs-declarations/DEC-S4-SYNTHETIC/attachment-deliveries/DEL-S4-SYNTHETIC/receipts",
  "errors": [
    {
      "pointer": "/",
      "code": "CUSTOMS_RECIPIENT_MISMATCH",
      "detail": "无真实正式证据不得降级成功"
    }
  ],
  "outcomeUnknown": false,
  "retryAfterMs": 0
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/customs-declarations/DEC-S4-SYNTHETIC/attachment-deliveries/DEL-S4-SYNTHETIC/receipts" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7041111-0000-4000-8000-000000000006' \
  --header 'If-Match: "s4-v1-57e9172357bd"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"outcome":"received","reason":"A不能代B接收","evidence":[]}'
```

```json
{
  "designOnly": true,
  "service": "trade.customs.v1.ExternalCustomsService",
  "method": "CreateCustomsAttachmentReceipt",
  "requestType": "CreateCustomsAttachmentReceiptReqMsg",
  "responseType": "CreateCustomsAttachmentReceiptRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>",
    "idempotency-key": "d7041111-0000-4000-8000-000000000006",
    "if-match": "\"s4-v1-57e9172357bd\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "declarationNumber": "DEC-S4-SYNTHETIC",
    "deliveryNumber": "DEL-S4-SYNTHETIC",
    "receipt": {
      "outcome": "received",
      "reason": "A不能代B接收",
      "evidence": []
    }
  },
  "successTrailers": {},
  "error": {
    "code": "PERMISSION_DENIED",
    "details": {
      "code": "CUSTOMS_RECIPIENT_MISMATCH",
      "httpStatus": 403,
      "errors": [
        {
          "pointer": "/",
          "code": "CUSTOMS_RECIPIENT_MISMATCH",
          "detail": "无真实正式证据不得降级成功"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "/api/v1/customs-declarations/DEC-S4-SYNTHETIC/attachment-deliveries/DEL-S4-SYNTHETIC/receipts"
    }
  }
}
```
