# 步骤八HTTP/RPC及cURL

未部署设计；内部合成凭据不可用。各组为独立结构例，非完整结案成功链。结案申请当前unknown报告明确返回422 application/problem+json；RPC仅error，无response/resource。

## GetReconciliationContext

`GET /internal/v1/trades/TRD-S8-SYNTHETIC/reconciliation-context`

客户端/应用deadline：5000/4000ms。

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s8-context-synthetic-1"

{
  "tradeNumber": "TRD-S8-SYNTHETIC",
  "vector": {
    "sources": [
      {
        "type": "trade",
        "id": "TRD-S8-SYNTHETIC",
        "revision": "1",
        "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
        "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
      }
    ],
    "objectSets": [
      {
        "type": "trade",
        "objectIds": [
          "TRD-S8-SYNTHETIC"
        ],
        "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
      },
      {
        "type": "shipment",
        "objectIds": [],
        "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
      },
      {
        "type": "customs",
        "objectIds": [],
        "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
      },
      {
        "type": "payment",
        "objectIds": [],
        "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
      },
      {
        "type": "accounting",
        "objectIds": [],
        "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
      },
      {
        "type": "certificate",
        "objectIds": [],
        "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
      },
      {
        "type": "taxrefund",
        "objectIds": [],
        "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
      },
      {
        "type": "compliance",
        "objectIds": [],
        "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
      }
    ],
    "ruleVersion": "S8-RECONCILIATION-1",
    "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
  },
  "checks": [
    {
      "itemNumber": "SOURCE-COMPLETENESS",
      "ruleCode": "SOURCE_UNKNOWN",
      "result": "CHECK_RESULT_UNKNOWN",
      "sources": [
        {
          "type": "trade",
          "id": "TRD-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        }
      ],
      "evidence": [],
      "blockingCodes": [
        "SOURCE_UNKNOWN"
      ],
      "explanation": "跨域尚未提供真实源与完整集合，空合成集合不证明无对象"
    },
    {
      "itemNumber": "EXTERNAL-EVIDENCE",
      "ruleCode": "REAL_EXTERNAL_PROOF",
      "result": "CHECK_RESULT_UNKNOWN",
      "sources": [],
      "evidence": [],
      "blockingCodes": [
        "EXTERNAL_EVIDENCE_MISSING"
      ],
      "explanation": "原创文件只证明内部合成记录，不构成银行/海关/税务证明"
    },
    {
      "itemNumber": "FUNDS-ALLOCATION",
      "ruleCode": "CNY_CONSERVATION",
      "result": "CHECK_RESULT_PASS",
      "expectedDecimal": "100.00",
      "observedDecimal": "100.00",
      "currencyCode": "CNY",
      "sources": [
        {
          "type": "trade",
          "id": "TRD-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        }
      ],
      "evidence": [
        {
          "logicalFileNumber": "FILE-S8-SYNTHETIC",
          "revisionNumber": 1,
          "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
          "documentPurposeCode": 19
        }
      ],
      "blockingCodes": [],
      "explanation": "仅说明结构中的合成金额一致，不证明真实资金平衡"
    }
  ],
  "activeReasons": [
    {
      "caseNumber": "CASE-S8-SYNTHETIC",
      "holdReference": "HOLD-S8-SYNTHETIC-1",
      "affectedContexts": [
        {
          "contextCode": "funds",
          "businessReference": "PAY-S8-SYNTHETIC",
          "scopeCode": 3,
          "operations": [
            "approve-payment",
            "execute-payment"
          ],
          "source": {
            "type": "funds",
            "id": "PAY-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        }
      ],
      "pendingAcknowledgements": [
        "funds:PAY-S8-SYNTHETIC"
      ]
    }
  ],
  "openCaseNumbers": [
    "CASE-S8-SYNTHETIC"
  ],
  "unknownExecutionReferences": [
    "SYNTHETIC-BANK-UNKNOWN"
  ],
  "missingEvidenceCodes": [
    "EXTERNAL_EVIDENCE_MISSING"
  ],
  "etag": "\"s8-context-synthetic-1\""
}
```

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S8-SYNTHETIC/reconciliation-context" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.reconciliation.v1.InternalReconciliationService",
  "method": "GetReconciliationContext",
  "requestType": "GetReconciliationContextReqMsg",
  "responseType": "GetReconciliationContextRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>"
  },
  "request": {
    "tradeNumber": "TRD-S8-SYNTHETIC"
  },
  "response": {
    "resource": {
      "tradeNumber": "TRD-S8-SYNTHETIC",
      "vector": {
        "sources": [
          {
            "type": "trade",
            "id": "TRD-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        ],
        "objectSets": [
          {
            "type": "trade",
            "objectIds": [
              "TRD-S8-SYNTHETIC"
            ],
            "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
          },
          {
            "type": "shipment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "customs",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "payment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "accounting",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "certificate",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "taxrefund",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "compliance",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          }
        ],
        "ruleVersion": "S8-RECONCILIATION-1",
        "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
      },
      "checks": [
        {
          "itemNumber": "SOURCE-COMPLETENESS",
          "ruleCode": "SOURCE_UNKNOWN",
          "result": "CHECK_RESULT_UNKNOWN",
          "sources": [
            {
              "type": "trade",
              "id": "TRD-S8-SYNTHETIC",
              "revision": "1",
              "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
              "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
            }
          ],
          "evidence": [],
          "blockingCodes": [
            "SOURCE_UNKNOWN"
          ],
          "explanation": "跨域尚未提供真实源与完整集合，空合成集合不证明无对象"
        },
        {
          "itemNumber": "EXTERNAL-EVIDENCE",
          "ruleCode": "REAL_EXTERNAL_PROOF",
          "result": "CHECK_RESULT_UNKNOWN",
          "sources": [],
          "evidence": [],
          "blockingCodes": [
            "EXTERNAL_EVIDENCE_MISSING"
          ],
          "explanation": "原创文件只证明内部合成记录，不构成银行/海关/税务证明"
        },
        {
          "itemNumber": "FUNDS-ALLOCATION",
          "ruleCode": "CNY_CONSERVATION",
          "result": "CHECK_RESULT_PASS",
          "expectedDecimal": "100.00",
          "observedDecimal": "100.00",
          "currencyCode": "CNY",
          "sources": [
            {
              "type": "trade",
              "id": "TRD-S8-SYNTHETIC",
              "revision": "1",
              "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
              "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
            }
          ],
          "evidence": [
            {
              "logicalFileNumber": "FILE-S8-SYNTHETIC",
              "revisionNumber": 1,
              "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
              "documentPurposeCode": 19
            }
          ],
          "blockingCodes": [],
          "explanation": "仅说明结构中的合成金额一致，不证明真实资金平衡"
        }
      ],
      "activeReasons": [
        {
          "caseNumber": "CASE-S8-SYNTHETIC",
          "holdReference": "HOLD-S8-SYNTHETIC-1",
          "affectedContexts": [
            {
              "contextCode": "funds",
              "businessReference": "PAY-S8-SYNTHETIC",
              "scopeCode": 3,
              "operations": [
                "approve-payment",
                "execute-payment"
              ],
              "source": {
                "type": "funds",
                "id": "PAY-S8-SYNTHETIC",
                "revision": "1",
                "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
                "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
              }
            }
          ],
          "pendingAcknowledgements": [
            "funds:PAY-S8-SYNTHETIC"
          ]
        }
      ],
      "openCaseNumbers": [
        "CASE-S8-SYNTHETIC"
      ],
      "unknownExecutionReferences": [
        "SYNTHETIC-BANK-UNKNOWN"
      ],
      "missingEvidenceCodes": [
        "EXTERNAL_EVIDENCE_MISSING"
      ],
      "etag": "\"s8-context-synthetic-1\""
    }
  },
  "successTrailers": {}
}
```

## CreateReconciliationReport

`POST /internal/v1/trades/TRD-S8-SYNTHETIC/reconciliation-reports`

客户端/应用deadline：10000/8000ms。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /internal/v1/trades/TRD-S8-SYNTHETIC/reconciliation-reports/RPT-S8-SYNTHETIC
ETag: "s8-immutable-1"

{
  "reportNumber": "RPT-S8-SYNTHETIC",
  "tradeNumber": "TRD-S8-SYNTHETIC",
  "vector": {
    "sources": [
      {
        "type": "trade",
        "id": "TRD-S8-SYNTHETIC",
        "revision": "1",
        "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
        "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
      }
    ],
    "objectSets": [
      {
        "type": "trade",
        "objectIds": [
          "TRD-S8-SYNTHETIC"
        ],
        "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
      },
      {
        "type": "shipment",
        "objectIds": [],
        "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
      },
      {
        "type": "customs",
        "objectIds": [],
        "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
      },
      {
        "type": "payment",
        "objectIds": [],
        "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
      },
      {
        "type": "accounting",
        "objectIds": [],
        "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
      },
      {
        "type": "certificate",
        "objectIds": [],
        "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
      },
      {
        "type": "taxrefund",
        "objectIds": [],
        "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
      },
      {
        "type": "compliance",
        "objectIds": [],
        "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
      }
    ],
    "ruleVersion": "S8-RECONCILIATION-1",
    "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
  },
  "checks": [
    {
      "itemNumber": "SOURCE-COMPLETENESS",
      "ruleCode": "SOURCE_UNKNOWN",
      "result": "CHECK_RESULT_UNKNOWN",
      "sources": [
        {
          "type": "trade",
          "id": "TRD-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        }
      ],
      "evidence": [],
      "blockingCodes": [
        "SOURCE_UNKNOWN"
      ],
      "explanation": "跨域尚未提供真实源与完整集合，空合成集合不证明无对象"
    },
    {
      "itemNumber": "EXTERNAL-EVIDENCE",
      "ruleCode": "REAL_EXTERNAL_PROOF",
      "result": "CHECK_RESULT_UNKNOWN",
      "sources": [],
      "evidence": [],
      "blockingCodes": [
        "EXTERNAL_EVIDENCE_MISSING"
      ],
      "explanation": "原创文件只证明内部合成记录，不构成银行/海关/税务证明"
    },
    {
      "itemNumber": "FUNDS-ALLOCATION",
      "ruleCode": "CNY_CONSERVATION",
      "result": "CHECK_RESULT_PASS",
      "expectedDecimal": "100.00",
      "observedDecimal": "100.00",
      "currencyCode": "CNY",
      "sources": [
        {
          "type": "trade",
          "id": "TRD-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        }
      ],
      "evidence": [
        {
          "logicalFileNumber": "FILE-S8-SYNTHETIC",
          "revisionNumber": 1,
          "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
          "documentPurposeCode": 19
        }
      ],
      "blockingCodes": [],
      "explanation": "仅说明结构中的合成金额一致，不证明真实资金平衡"
    }
  ],
  "evidence": [
    {
      "logicalFileNumber": "FILE-S8-SYNTHETIC",
      "revisionNumber": 1,
      "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
      "documentPurposeCode": 19
    }
  ],
  "reportHash": "f21b61ebfb49a9935d675d846d88a353e096c823f861545fb968398c169320e8",
  "creatorReference": "SYNTHETIC-RECONCILER",
  "createdAt": "2026-11-01T01:00:00Z",
  "acceptanceId": "S8-SYNTHETIC-REPORT"
}
```

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S8-SYNTHETIC/reconciliation-reports" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d8080000-0000-4000-8000-000000000002' \
  --header 'If-Match: "s8-context-synthetic-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"expectedVector":{"sources":[{"type":"trade","id":"TRD-S8-SYNTHETIC","revision":"1","hash":"09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72","sourceEventTail":"EVT-S8-SYNTHETIC-BASE"}],"objectSets":[{"type":"trade","objectIds":["TRD-S8-SYNTHETIC"],"hash":"28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"},{"type":"shipment","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"customs","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"payment","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"accounting","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"certificate","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"taxrefund","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"compliance","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"}],"ruleVersion":"S8-RECONCILIATION-1","hash":"1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"}}'
```

```json
{
  "designOnly": true,
  "service": "trade.reconciliation.v1.InternalReconciliationService",
  "method": "CreateReconciliationReport",
  "requestType": "CreateReconciliationReportReqMsg",
  "responseType": "CreateReconciliationReportRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d8080000-0000-4000-8000-000000000002",
    "if-match": "\"s8-context-synthetic-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "tradeNumber": "TRD-S8-SYNTHETIC",
    "report": {
      "expectedVector": {
        "sources": [
          {
            "type": "trade",
            "id": "TRD-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        ],
        "objectSets": [
          {
            "type": "trade",
            "objectIds": [
              "TRD-S8-SYNTHETIC"
            ],
            "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
          },
          {
            "type": "shipment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "customs",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "payment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "accounting",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "certificate",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "taxrefund",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "compliance",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          }
        ],
        "ruleVersion": "S8-RECONCILIATION-1",
        "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
      }
    }
  },
  "response": {
    "resource": {
      "reportNumber": "RPT-S8-SYNTHETIC",
      "tradeNumber": "TRD-S8-SYNTHETIC",
      "vector": {
        "sources": [
          {
            "type": "trade",
            "id": "TRD-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        ],
        "objectSets": [
          {
            "type": "trade",
            "objectIds": [
              "TRD-S8-SYNTHETIC"
            ],
            "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
          },
          {
            "type": "shipment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "customs",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "payment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "accounting",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "certificate",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "taxrefund",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "compliance",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          }
        ],
        "ruleVersion": "S8-RECONCILIATION-1",
        "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
      },
      "checks": [
        {
          "itemNumber": "SOURCE-COMPLETENESS",
          "ruleCode": "SOURCE_UNKNOWN",
          "result": "CHECK_RESULT_UNKNOWN",
          "sources": [
            {
              "type": "trade",
              "id": "TRD-S8-SYNTHETIC",
              "revision": "1",
              "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
              "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
            }
          ],
          "evidence": [],
          "blockingCodes": [
            "SOURCE_UNKNOWN"
          ],
          "explanation": "跨域尚未提供真实源与完整集合，空合成集合不证明无对象"
        },
        {
          "itemNumber": "EXTERNAL-EVIDENCE",
          "ruleCode": "REAL_EXTERNAL_PROOF",
          "result": "CHECK_RESULT_UNKNOWN",
          "sources": [],
          "evidence": [],
          "blockingCodes": [
            "EXTERNAL_EVIDENCE_MISSING"
          ],
          "explanation": "原创文件只证明内部合成记录，不构成银行/海关/税务证明"
        },
        {
          "itemNumber": "FUNDS-ALLOCATION",
          "ruleCode": "CNY_CONSERVATION",
          "result": "CHECK_RESULT_PASS",
          "expectedDecimal": "100.00",
          "observedDecimal": "100.00",
          "currencyCode": "CNY",
          "sources": [
            {
              "type": "trade",
              "id": "TRD-S8-SYNTHETIC",
              "revision": "1",
              "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
              "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
            }
          ],
          "evidence": [
            {
              "logicalFileNumber": "FILE-S8-SYNTHETIC",
              "revisionNumber": 1,
              "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
              "documentPurposeCode": 19
            }
          ],
          "blockingCodes": [],
          "explanation": "仅说明结构中的合成金额一致，不证明真实资金平衡"
        }
      ],
      "evidence": [
        {
          "logicalFileNumber": "FILE-S8-SYNTHETIC",
          "revisionNumber": 1,
          "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
          "documentPurposeCode": 19
        }
      ],
      "reportHash": "f21b61ebfb49a9935d675d846d88a353e096c823f861545fb968398c169320e8",
      "creatorReference": "SYNTHETIC-RECONCILER",
      "createdAt": "2026-11-01T01:00:00Z",
      "acceptanceId": "S8-SYNTHETIC-REPORT"
    }
  },
  "successTrailers": {}
}
```

## GetReconciliationReport

`GET /internal/v1/trades/TRD-S8-SYNTHETIC/reconciliation-reports/RPT-S8-SYNTHETIC`

客户端/应用deadline：5000/4000ms。

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s8-immutable-2"

{
  "reportNumber": "RPT-S8-SYNTHETIC",
  "tradeNumber": "TRD-S8-SYNTHETIC",
  "vector": {
    "sources": [
      {
        "type": "trade",
        "id": "TRD-S8-SYNTHETIC",
        "revision": "1",
        "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
        "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
      }
    ],
    "objectSets": [
      {
        "type": "trade",
        "objectIds": [
          "TRD-S8-SYNTHETIC"
        ],
        "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
      },
      {
        "type": "shipment",
        "objectIds": [],
        "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
      },
      {
        "type": "customs",
        "objectIds": [],
        "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
      },
      {
        "type": "payment",
        "objectIds": [],
        "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
      },
      {
        "type": "accounting",
        "objectIds": [],
        "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
      },
      {
        "type": "certificate",
        "objectIds": [],
        "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
      },
      {
        "type": "taxrefund",
        "objectIds": [],
        "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
      },
      {
        "type": "compliance",
        "objectIds": [],
        "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
      }
    ],
    "ruleVersion": "S8-RECONCILIATION-1",
    "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
  },
  "checks": [
    {
      "itemNumber": "SOURCE-COMPLETENESS",
      "ruleCode": "SOURCE_UNKNOWN",
      "result": "CHECK_RESULT_UNKNOWN",
      "sources": [
        {
          "type": "trade",
          "id": "TRD-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        }
      ],
      "evidence": [],
      "blockingCodes": [
        "SOURCE_UNKNOWN"
      ],
      "explanation": "跨域尚未提供真实源与完整集合，空合成集合不证明无对象"
    },
    {
      "itemNumber": "EXTERNAL-EVIDENCE",
      "ruleCode": "REAL_EXTERNAL_PROOF",
      "result": "CHECK_RESULT_UNKNOWN",
      "sources": [],
      "evidence": [],
      "blockingCodes": [
        "EXTERNAL_EVIDENCE_MISSING"
      ],
      "explanation": "原创文件只证明内部合成记录，不构成银行/海关/税务证明"
    },
    {
      "itemNumber": "FUNDS-ALLOCATION",
      "ruleCode": "CNY_CONSERVATION",
      "result": "CHECK_RESULT_PASS",
      "expectedDecimal": "100.00",
      "observedDecimal": "100.00",
      "currencyCode": "CNY",
      "sources": [
        {
          "type": "trade",
          "id": "TRD-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        }
      ],
      "evidence": [
        {
          "logicalFileNumber": "FILE-S8-SYNTHETIC",
          "revisionNumber": 1,
          "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
          "documentPurposeCode": 19
        }
      ],
      "blockingCodes": [],
      "explanation": "仅说明结构中的合成金额一致，不证明真实资金平衡"
    }
  ],
  "evidence": [
    {
      "logicalFileNumber": "FILE-S8-SYNTHETIC",
      "revisionNumber": 1,
      "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
      "documentPurposeCode": 19
    }
  ],
  "reportHash": "f21b61ebfb49a9935d675d846d88a353e096c823f861545fb968398c169320e8",
  "creatorReference": "SYNTHETIC-RECONCILER",
  "createdAt": "2026-11-01T01:00:00Z",
  "acceptanceId": "S8-SYNTHETIC-REPORT"
}
```

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S8-SYNTHETIC/reconciliation-reports/RPT-S8-SYNTHETIC" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.reconciliation.v1.InternalReconciliationService",
  "method": "GetReconciliationReport",
  "requestType": "GetReconciliationReportReqMsg",
  "responseType": "GetReconciliationReportRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>"
  },
  "request": {
    "tradeNumber": "TRD-S8-SYNTHETIC",
    "reportNumber": "RPT-S8-SYNTHETIC"
  },
  "response": {
    "resource": {
      "reportNumber": "RPT-S8-SYNTHETIC",
      "tradeNumber": "TRD-S8-SYNTHETIC",
      "vector": {
        "sources": [
          {
            "type": "trade",
            "id": "TRD-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        ],
        "objectSets": [
          {
            "type": "trade",
            "objectIds": [
              "TRD-S8-SYNTHETIC"
            ],
            "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
          },
          {
            "type": "shipment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "customs",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "payment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "accounting",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "certificate",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "taxrefund",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "compliance",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          }
        ],
        "ruleVersion": "S8-RECONCILIATION-1",
        "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
      },
      "checks": [
        {
          "itemNumber": "SOURCE-COMPLETENESS",
          "ruleCode": "SOURCE_UNKNOWN",
          "result": "CHECK_RESULT_UNKNOWN",
          "sources": [
            {
              "type": "trade",
              "id": "TRD-S8-SYNTHETIC",
              "revision": "1",
              "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
              "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
            }
          ],
          "evidence": [],
          "blockingCodes": [
            "SOURCE_UNKNOWN"
          ],
          "explanation": "跨域尚未提供真实源与完整集合，空合成集合不证明无对象"
        },
        {
          "itemNumber": "EXTERNAL-EVIDENCE",
          "ruleCode": "REAL_EXTERNAL_PROOF",
          "result": "CHECK_RESULT_UNKNOWN",
          "sources": [],
          "evidence": [],
          "blockingCodes": [
            "EXTERNAL_EVIDENCE_MISSING"
          ],
          "explanation": "原创文件只证明内部合成记录，不构成银行/海关/税务证明"
        },
        {
          "itemNumber": "FUNDS-ALLOCATION",
          "ruleCode": "CNY_CONSERVATION",
          "result": "CHECK_RESULT_PASS",
          "expectedDecimal": "100.00",
          "observedDecimal": "100.00",
          "currencyCode": "CNY",
          "sources": [
            {
              "type": "trade",
              "id": "TRD-S8-SYNTHETIC",
              "revision": "1",
              "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
              "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
            }
          ],
          "evidence": [
            {
              "logicalFileNumber": "FILE-S8-SYNTHETIC",
              "revisionNumber": 1,
              "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
              "documentPurposeCode": 19
            }
          ],
          "blockingCodes": [],
          "explanation": "仅说明结构中的合成金额一致，不证明真实资金平衡"
        }
      ],
      "evidence": [
        {
          "logicalFileNumber": "FILE-S8-SYNTHETIC",
          "revisionNumber": 1,
          "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
          "documentPurposeCode": 19
        }
      ],
      "reportHash": "f21b61ebfb49a9935d675d846d88a353e096c823f861545fb968398c169320e8",
      "creatorReference": "SYNTHETIC-RECONCILER",
      "createdAt": "2026-11-01T01:00:00Z",
      "acceptanceId": "S8-SYNTHETIC-REPORT"
    }
  },
  "successTrailers": {}
}
```

## CreateDiscrepancyCase

`POST /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases`

客户端/应用deadline：10000/8000ms。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC
ETag: "s8-case-event-1"

{
  "caseNumber": "CASE-S8-SYNTHETIC",
  "tradeNumber": "TRD-S8-SYNTHETIC",
  "basis": {
    "reportNumber": "RPT-S8-SYNTHETIC",
    "itemNumber": "EXTERNAL-EVIDENCE",
    "caseTypeCode": 4,
    "severityCode": 2,
    "scopeCode": 3,
    "owner": {
      "type": "funds",
      "id": "PAY-S8-SYNTHETIC",
      "revision": "1",
      "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
      "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
    },
    "evidence": [
      {
        "logicalFileNumber": "FILE-S8-SYNTHETIC",
        "revisionNumber": 1,
        "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
        "documentPurposeCode": 19
      }
    ]
  },
  "caseStatus": 2,
  "assignedTo": "SYNTHETIC-CASE-OWNER",
  "dueAt": "2026-11-05T01:00:00Z",
  "activeReasons": [
    {
      "caseNumber": "CASE-S8-SYNTHETIC",
      "holdReference": "HOLD-S8-SYNTHETIC-1",
      "affectedContexts": [
        {
          "contextCode": "funds",
          "businessReference": "PAY-S8-SYNTHETIC",
          "scopeCode": 3,
          "operations": [
            "approve-payment",
            "execute-payment"
          ],
          "source": {
            "type": "funds",
            "id": "PAY-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        }
      ],
      "pendingAcknowledgements": [
        "funds:PAY-S8-SYNTHETIC"
      ]
    }
  ],
  "dispositions": [
    {
      "dispositionNumber": "DSP-S8-SYNTHETIC",
      "caseNumber": "CASE-S8-SYNTHETIC",
      "actionCode": 3,
      "resultCode": 1,
      "actorReference": "SYNTHETIC-CASE-OWNER",
      "occurredAt": "2026-11-01T01:00:00Z",
      "affectedContexts": [
        {
          "contextCode": "funds",
          "businessReference": "PAY-S8-SYNTHETIC",
          "scopeCode": 3,
          "operations": [
            "approve-payment",
            "execute-payment"
          ],
          "source": {
            "type": "funds",
            "id": "PAY-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        }
      ],
      "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
      "remedy": {
        "originalDispositionReference": "DSP-S8-SYNTHETIC-HOLD",
        "substantiveDispositions": [
          {
            "type": "trade",
            "id": "TRD-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        ],
        "evidence": [
          {
            "logicalFileNumber": "FILE-S8-SYNTHETIC",
            "revisionNumber": 1,
            "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
            "documentPurposeCode": 19
          }
        ],
        "explanation": "仅记录补正，不解除原因"
      },
      "etag": "\"s8-case-event-1\""
    }
  ],
  "acceptanceId": "S8-SYNTHETIC-CASE",
  "etag": "\"s8-case-event-1\""
}
```

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d8080000-0000-4000-8000-000000000004' \
  --header 'If-Match: "s8-context-synthetic-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"reportNumber":"RPT-S8-SYNTHETIC","itemNumber":"EXTERNAL-EVIDENCE","caseTypeCode":4,"severityCode":2,"scopeCode":3,"owner":{"type":"funds","id":"PAY-S8-SYNTHETIC","revision":"1","hash":"09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72","sourceEventTail":"EVT-S8-SYNTHETIC-BASE"},"evidence":[{"logicalFileNumber":"FILE-S8-SYNTHETIC","revisionNumber":1,"sha256":"5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030","documentPurposeCode":19}]}'
```

```json
{
  "designOnly": true,
  "service": "trade.reconciliation.v1.InternalReconciliationService",
  "method": "CreateDiscrepancyCase",
  "requestType": "CreateDiscrepancyCaseReqMsg",
  "responseType": "CreateDiscrepancyCaseRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d8080000-0000-4000-8000-000000000004",
    "if-match": "\"s8-context-synthetic-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "tradeNumber": "TRD-S8-SYNTHETIC",
    "caseInput": {
      "reportNumber": "RPT-S8-SYNTHETIC",
      "itemNumber": "EXTERNAL-EVIDENCE",
      "caseTypeCode": 4,
      "severityCode": 2,
      "scopeCode": 3,
      "owner": {
        "type": "funds",
        "id": "PAY-S8-SYNTHETIC",
        "revision": "1",
        "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
        "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
      },
      "evidence": [
        {
          "logicalFileNumber": "FILE-S8-SYNTHETIC",
          "revisionNumber": 1,
          "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
          "documentPurposeCode": 19
        }
      ]
    }
  },
  "response": {
    "resource": {
      "caseNumber": "CASE-S8-SYNTHETIC",
      "tradeNumber": "TRD-S8-SYNTHETIC",
      "basis": {
        "reportNumber": "RPT-S8-SYNTHETIC",
        "itemNumber": "EXTERNAL-EVIDENCE",
        "caseTypeCode": 4,
        "severityCode": 2,
        "scopeCode": 3,
        "owner": {
          "type": "funds",
          "id": "PAY-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        },
        "evidence": [
          {
            "logicalFileNumber": "FILE-S8-SYNTHETIC",
            "revisionNumber": 1,
            "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
            "documentPurposeCode": 19
          }
        ]
      },
      "caseStatus": 2,
      "assignedTo": "SYNTHETIC-CASE-OWNER",
      "dueAt": "2026-11-05T01:00:00Z",
      "activeReasons": [
        {
          "caseNumber": "CASE-S8-SYNTHETIC",
          "holdReference": "HOLD-S8-SYNTHETIC-1",
          "affectedContexts": [
            {
              "contextCode": "funds",
              "businessReference": "PAY-S8-SYNTHETIC",
              "scopeCode": 3,
              "operations": [
                "approve-payment",
                "execute-payment"
              ],
              "source": {
                "type": "funds",
                "id": "PAY-S8-SYNTHETIC",
                "revision": "1",
                "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
                "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
              }
            }
          ],
          "pendingAcknowledgements": [
            "funds:PAY-S8-SYNTHETIC"
          ]
        }
      ],
      "dispositions": [
        {
          "dispositionNumber": "DSP-S8-SYNTHETIC",
          "caseNumber": "CASE-S8-SYNTHETIC",
          "actionCode": 3,
          "resultCode": 1,
          "actorReference": "SYNTHETIC-CASE-OWNER",
          "occurredAt": "2026-11-01T01:00:00Z",
          "affectedContexts": [
            {
              "contextCode": "funds",
              "businessReference": "PAY-S8-SYNTHETIC",
              "scopeCode": 3,
              "operations": [
                "approve-payment",
                "execute-payment"
              ],
              "source": {
                "type": "funds",
                "id": "PAY-S8-SYNTHETIC",
                "revision": "1",
                "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
                "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
              }
            }
          ],
          "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
          "remedy": {
            "originalDispositionReference": "DSP-S8-SYNTHETIC-HOLD",
            "substantiveDispositions": [
              {
                "type": "trade",
                "id": "TRD-S8-SYNTHETIC",
                "revision": "1",
                "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
                "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
              }
            ],
            "evidence": [
              {
                "logicalFileNumber": "FILE-S8-SYNTHETIC",
                "revisionNumber": 1,
                "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
                "documentPurposeCode": 19
              }
            ],
            "explanation": "仅记录补正，不解除原因"
          },
          "etag": "\"s8-case-event-1\""
        }
      ],
      "acceptanceId": "S8-SYNTHETIC-CASE",
      "etag": "\"s8-case-event-1\""
    }
  },
  "successTrailers": {}
}
```

## GetDiscrepancyCase

`GET /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC`

客户端/应用deadline：5000/4000ms。

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s8-case-event-1"

{
  "caseNumber": "CASE-S8-SYNTHETIC",
  "tradeNumber": "TRD-S8-SYNTHETIC",
  "basis": {
    "reportNumber": "RPT-S8-SYNTHETIC",
    "itemNumber": "EXTERNAL-EVIDENCE",
    "caseTypeCode": 4,
    "severityCode": 2,
    "scopeCode": 3,
    "owner": {
      "type": "funds",
      "id": "PAY-S8-SYNTHETIC",
      "revision": "1",
      "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
      "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
    },
    "evidence": [
      {
        "logicalFileNumber": "FILE-S8-SYNTHETIC",
        "revisionNumber": 1,
        "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
        "documentPurposeCode": 19
      }
    ]
  },
  "caseStatus": 2,
  "assignedTo": "SYNTHETIC-CASE-OWNER",
  "dueAt": "2026-11-05T01:00:00Z",
  "activeReasons": [
    {
      "caseNumber": "CASE-S8-SYNTHETIC",
      "holdReference": "HOLD-S8-SYNTHETIC-1",
      "affectedContexts": [
        {
          "contextCode": "funds",
          "businessReference": "PAY-S8-SYNTHETIC",
          "scopeCode": 3,
          "operations": [
            "approve-payment",
            "execute-payment"
          ],
          "source": {
            "type": "funds",
            "id": "PAY-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        }
      ],
      "pendingAcknowledgements": [
        "funds:PAY-S8-SYNTHETIC"
      ]
    }
  ],
  "dispositions": [
    {
      "dispositionNumber": "DSP-S8-SYNTHETIC",
      "caseNumber": "CASE-S8-SYNTHETIC",
      "actionCode": 3,
      "resultCode": 1,
      "actorReference": "SYNTHETIC-CASE-OWNER",
      "occurredAt": "2026-11-01T01:00:00Z",
      "affectedContexts": [
        {
          "contextCode": "funds",
          "businessReference": "PAY-S8-SYNTHETIC",
          "scopeCode": 3,
          "operations": [
            "approve-payment",
            "execute-payment"
          ],
          "source": {
            "type": "funds",
            "id": "PAY-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        }
      ],
      "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
      "remedy": {
        "originalDispositionReference": "DSP-S8-SYNTHETIC-HOLD",
        "substantiveDispositions": [
          {
            "type": "trade",
            "id": "TRD-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        ],
        "evidence": [
          {
            "logicalFileNumber": "FILE-S8-SYNTHETIC",
            "revisionNumber": 1,
            "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
            "documentPurposeCode": 19
          }
        ],
        "explanation": "仅记录补正，不解除原因"
      },
      "etag": "\"s8-case-event-1\""
    }
  ],
  "acceptanceId": "S8-SYNTHETIC-CASE",
  "etag": "\"s8-case-event-1\""
}
```

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.reconciliation.v1.InternalReconciliationService",
  "method": "GetDiscrepancyCase",
  "requestType": "GetDiscrepancyCaseReqMsg",
  "responseType": "GetDiscrepancyCaseRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>"
  },
  "request": {
    "tradeNumber": "TRD-S8-SYNTHETIC",
    "caseNumber": "CASE-S8-SYNTHETIC"
  },
  "response": {
    "resource": {
      "caseNumber": "CASE-S8-SYNTHETIC",
      "tradeNumber": "TRD-S8-SYNTHETIC",
      "basis": {
        "reportNumber": "RPT-S8-SYNTHETIC",
        "itemNumber": "EXTERNAL-EVIDENCE",
        "caseTypeCode": 4,
        "severityCode": 2,
        "scopeCode": 3,
        "owner": {
          "type": "funds",
          "id": "PAY-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        },
        "evidence": [
          {
            "logicalFileNumber": "FILE-S8-SYNTHETIC",
            "revisionNumber": 1,
            "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
            "documentPurposeCode": 19
          }
        ]
      },
      "caseStatus": 2,
      "assignedTo": "SYNTHETIC-CASE-OWNER",
      "dueAt": "2026-11-05T01:00:00Z",
      "activeReasons": [
        {
          "caseNumber": "CASE-S8-SYNTHETIC",
          "holdReference": "HOLD-S8-SYNTHETIC-1",
          "affectedContexts": [
            {
              "contextCode": "funds",
              "businessReference": "PAY-S8-SYNTHETIC",
              "scopeCode": 3,
              "operations": [
                "approve-payment",
                "execute-payment"
              ],
              "source": {
                "type": "funds",
                "id": "PAY-S8-SYNTHETIC",
                "revision": "1",
                "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
                "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
              }
            }
          ],
          "pendingAcknowledgements": [
            "funds:PAY-S8-SYNTHETIC"
          ]
        }
      ],
      "dispositions": [
        {
          "dispositionNumber": "DSP-S8-SYNTHETIC",
          "caseNumber": "CASE-S8-SYNTHETIC",
          "actionCode": 3,
          "resultCode": 1,
          "actorReference": "SYNTHETIC-CASE-OWNER",
          "occurredAt": "2026-11-01T01:00:00Z",
          "affectedContexts": [
            {
              "contextCode": "funds",
              "businessReference": "PAY-S8-SYNTHETIC",
              "scopeCode": 3,
              "operations": [
                "approve-payment",
                "execute-payment"
              ],
              "source": {
                "type": "funds",
                "id": "PAY-S8-SYNTHETIC",
                "revision": "1",
                "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
                "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
              }
            }
          ],
          "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
          "remedy": {
            "originalDispositionReference": "DSP-S8-SYNTHETIC-HOLD",
            "substantiveDispositions": [
              {
                "type": "trade",
                "id": "TRD-S8-SYNTHETIC",
                "revision": "1",
                "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
                "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
              }
            ],
            "evidence": [
              {
                "logicalFileNumber": "FILE-S8-SYNTHETIC",
                "revisionNumber": 1,
                "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
                "documentPurposeCode": 19
              }
            ],
            "explanation": "仅记录补正，不解除原因"
          },
          "etag": "\"s8-case-event-1\""
        }
      ],
      "acceptanceId": "S8-SYNTHETIC-CASE",
      "etag": "\"s8-case-event-1\""
    }
  },
  "successTrailers": {}
}
```

## CreateCaseAssignment

`POST /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/assignments`

客户端/应用deadline：10000/8000ms。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/dispositions/DSP-S8-SYNTHETIC-5
ETag: "s8-case-event-1"

{
  "dispositionNumber": "DSP-S8-SYNTHETIC-5",
  "caseNumber": "CASE-S8-SYNTHETIC",
  "actionCode": 1,
  "resultCode": 1,
  "actorReference": "SYNTHETIC-CASE-OWNER",
  "occurredAt": "2026-11-01T01:00:00Z",
  "affectedContexts": [
    {
      "contextCode": "funds",
      "businessReference": "PAY-S8-SYNTHETIC",
      "scopeCode": 3,
      "operations": [
        "approve-payment",
        "execute-payment"
      ],
      "source": {
        "type": "funds",
        "id": "PAY-S8-SYNTHETIC",
        "revision": "1",
        "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
        "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
      }
    }
  ],
  "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
  "etag": "\"s8-case-event-1\"",
  "assignment": {
    "assignedTo": "SYNTHETIC-CASE-OWNER",
    "dueAt": "2026-11-05T01:00:00Z",
    "reason": "分派核实，非已解决"
  }
}
```

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/assignments" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d8080000-0000-4000-8000-000000000006' \
  --header 'If-Match: "s8-context-synthetic-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"assignedTo":"SYNTHETIC-CASE-OWNER","dueAt":"2026-11-05T01:00:00Z","reason":"分派核实，非已解决"}'
```

```json
{
  "designOnly": true,
  "service": "trade.reconciliation.v1.InternalReconciliationService",
  "method": "CreateCaseAssignment",
  "requestType": "CreateCaseAssignmentReqMsg",
  "responseType": "CreateCaseAssignmentRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d8080000-0000-4000-8000-000000000006",
    "if-match": "\"s8-context-synthetic-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "tradeNumber": "TRD-S8-SYNTHETIC",
    "caseNumber": "CASE-S8-SYNTHETIC",
    "assignment": {
      "assignedTo": "SYNTHETIC-CASE-OWNER",
      "dueAt": "2026-11-05T01:00:00Z",
      "reason": "分派核实，非已解决"
    }
  },
  "response": {
    "resource": {
      "dispositionNumber": "DSP-S8-SYNTHETIC-5",
      "caseNumber": "CASE-S8-SYNTHETIC",
      "actionCode": 1,
      "resultCode": 1,
      "actorReference": "SYNTHETIC-CASE-OWNER",
      "occurredAt": "2026-11-01T01:00:00Z",
      "affectedContexts": [
        {
          "contextCode": "funds",
          "businessReference": "PAY-S8-SYNTHETIC",
          "scopeCode": 3,
          "operations": [
            "approve-payment",
            "execute-payment"
          ],
          "source": {
            "type": "funds",
            "id": "PAY-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        }
      ],
      "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
      "etag": "\"s8-case-event-1\"",
      "assignment": {
        "assignedTo": "SYNTHETIC-CASE-OWNER",
        "dueAt": "2026-11-05T01:00:00Z",
        "reason": "分派核实，非已解决"
      }
    }
  },
  "successTrailers": {}
}
```

## CreateHoldDecision

`POST /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/hold-decisions`

客户端/应用deadline：10000/8000ms。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/dispositions/DSP-S8-SYNTHETIC-6
ETag: "s8-case-event-1"

{
  "dispositionNumber": "DSP-S8-SYNTHETIC-6",
  "caseNumber": "CASE-S8-SYNTHETIC",
  "actionCode": 2,
  "resultCode": 2,
  "actorReference": "SYNTHETIC-CASE-OWNER",
  "occurredAt": "2026-11-01T01:00:00Z",
  "affectedContexts": [
    {
      "contextCode": "funds",
      "businessReference": "PAY-S8-SYNTHETIC",
      "scopeCode": 3,
      "operations": [
        "approve-payment",
        "execute-payment"
      ],
      "source": {
        "type": "funds",
        "id": "PAY-S8-SYNTHETIC",
        "revision": "1",
        "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
        "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
      }
    }
  ],
  "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
  "etag": "\"s8-case-event-1\"",
  "hold": {
    "affectedContexts": [
      {
        "contextCode": "funds",
        "businessReference": "PAY-S8-SYNTHETIC",
        "scopeCode": 3,
        "operations": [
          "approve-payment",
          "execute-payment"
        ],
        "source": {
          "type": "funds",
          "id": "PAY-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        }
      }
    ],
    "reason": "真实资金证据缺失，只暂停本对象付款操作",
    "evidence": [
      {
        "logicalFileNumber": "FILE-S8-SYNTHETIC",
        "revisionNumber": 1,
        "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
        "documentPurposeCode": 19
      }
    ],
    "independentApprovalReference": "SYNTHETIC-INDEPENDENT-APPROVAL"
  },
  "holdReference": "HOLD-S8-SYNTHETIC-1"
}
```

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/hold-decisions" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d8080000-0000-4000-8000-000000000007' \
  --header 'If-Match: "s8-context-synthetic-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"affectedContexts":[{"contextCode":"funds","businessReference":"PAY-S8-SYNTHETIC","scopeCode":3,"operations":["approve-payment","execute-payment"],"source":{"type":"funds","id":"PAY-S8-SYNTHETIC","revision":"1","hash":"09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72","sourceEventTail":"EVT-S8-SYNTHETIC-BASE"}}],"reason":"真实资金证据缺失，只暂停本对象付款操作","evidence":[{"logicalFileNumber":"FILE-S8-SYNTHETIC","revisionNumber":1,"sha256":"5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030","documentPurposeCode":19}],"independentApprovalReference":"SYNTHETIC-INDEPENDENT-APPROVAL"}'
```

```json
{
  "designOnly": true,
  "service": "trade.reconciliation.v1.InternalReconciliationService",
  "method": "CreateHoldDecision",
  "requestType": "CreateHoldDecisionReqMsg",
  "responseType": "CreateHoldDecisionRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d8080000-0000-4000-8000-000000000007",
    "if-match": "\"s8-context-synthetic-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "tradeNumber": "TRD-S8-SYNTHETIC",
    "caseNumber": "CASE-S8-SYNTHETIC",
    "hold": {
      "affectedContexts": [
        {
          "contextCode": "funds",
          "businessReference": "PAY-S8-SYNTHETIC",
          "scopeCode": 3,
          "operations": [
            "approve-payment",
            "execute-payment"
          ],
          "source": {
            "type": "funds",
            "id": "PAY-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        }
      ],
      "reason": "真实资金证据缺失，只暂停本对象付款操作",
      "evidence": [
        {
          "logicalFileNumber": "FILE-S8-SYNTHETIC",
          "revisionNumber": 1,
          "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
          "documentPurposeCode": 19
        }
      ],
      "independentApprovalReference": "SYNTHETIC-INDEPENDENT-APPROVAL"
    }
  },
  "response": {
    "resource": {
      "dispositionNumber": "DSP-S8-SYNTHETIC-6",
      "caseNumber": "CASE-S8-SYNTHETIC",
      "actionCode": 2,
      "resultCode": 2,
      "actorReference": "SYNTHETIC-CASE-OWNER",
      "occurredAt": "2026-11-01T01:00:00Z",
      "affectedContexts": [
        {
          "contextCode": "funds",
          "businessReference": "PAY-S8-SYNTHETIC",
          "scopeCode": 3,
          "operations": [
            "approve-payment",
            "execute-payment"
          ],
          "source": {
            "type": "funds",
            "id": "PAY-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        }
      ],
      "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
      "etag": "\"s8-case-event-1\"",
      "hold": {
        "affectedContexts": [
          {
            "contextCode": "funds",
            "businessReference": "PAY-S8-SYNTHETIC",
            "scopeCode": 3,
            "operations": [
              "approve-payment",
              "execute-payment"
            ],
            "source": {
              "type": "funds",
              "id": "PAY-S8-SYNTHETIC",
              "revision": "1",
              "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
              "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
            }
          }
        ],
        "reason": "真实资金证据缺失，只暂停本对象付款操作",
        "evidence": [
          {
            "logicalFileNumber": "FILE-S8-SYNTHETIC",
            "revisionNumber": 1,
            "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
            "documentPurposeCode": 19
          }
        ],
        "independentApprovalReference": "SYNTHETIC-INDEPENDENT-APPROVAL"
      },
      "holdReference": "HOLD-S8-SYNTHETIC-1"
    }
  },
  "successTrailers": {}
}
```

## CreateGateAcknowledgement

`POST /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/gate-acknowledgements`

客户端/应用deadline：10000/8000ms。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/dispositions/DSP-S8-SYNTHETIC-7
ETag: "s8-case-event-1"

{
  "dispositionNumber": "DSP-S8-SYNTHETIC-7",
  "caseNumber": "CASE-S8-SYNTHETIC",
  "actionCode": 4,
  "resultCode": 1,
  "actorReference": "SYNTHETIC-CASE-OWNER",
  "occurredAt": "2026-11-01T01:00:00Z",
  "affectedContexts": [
    {
      "contextCode": "funds",
      "businessReference": "PAY-S8-SYNTHETIC",
      "scopeCode": 3,
      "operations": [
        "approve-payment",
        "execute-payment"
      ],
      "source": {
        "type": "funds",
        "id": "PAY-S8-SYNTHETIC",
        "revision": "1",
        "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
        "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
      }
    }
  ],
  "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
  "etag": "\"s8-case-event-1\"",
  "acknowledgement": {
    "decisionReference": "DSP-S8-SYNTHETIC-HOLD",
    "holdReference": "HOLD-S8-SYNTHETIC-1",
    "target": {
      "contextCode": "funds",
      "businessReference": "PAY-S8-SYNTHETIC",
      "scopeCode": 3,
      "operations": [
        "approve-payment",
        "execute-payment"
      ],
      "source": {
        "type": "funds",
        "id": "PAY-S8-SYNTHETIC",
        "revision": "1",
        "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
        "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
      }
    },
    "ownerExecution": {
      "type": "funds",
      "id": "PAY-S8-SYNTHETIC",
      "revision": "1",
      "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
      "sourceEventTail": "SYNTHETIC-OWNER-GATE"
    },
    "phase": "applied"
  }
}
```

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/gate-acknowledgements" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d8080000-0000-4000-8000-000000000008' \
  --header 'If-Match: "s8-context-synthetic-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"decisionReference":"DSP-S8-SYNTHETIC-HOLD","holdReference":"HOLD-S8-SYNTHETIC-1","target":{"contextCode":"funds","businessReference":"PAY-S8-SYNTHETIC","scopeCode":3,"operations":["approve-payment","execute-payment"],"source":{"type":"funds","id":"PAY-S8-SYNTHETIC","revision":"1","hash":"09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72","sourceEventTail":"EVT-S8-SYNTHETIC-BASE"}},"ownerExecution":{"type":"funds","id":"PAY-S8-SYNTHETIC","revision":"1","hash":"09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72","sourceEventTail":"SYNTHETIC-OWNER-GATE"},"phase":"applied"}'
```

```json
{
  "designOnly": true,
  "service": "trade.reconciliation.v1.InternalReconciliationService",
  "method": "CreateGateAcknowledgement",
  "requestType": "CreateGateAcknowledgementReqMsg",
  "responseType": "CreateGateAcknowledgementRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d8080000-0000-4000-8000-000000000008",
    "if-match": "\"s8-context-synthetic-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "tradeNumber": "TRD-S8-SYNTHETIC",
    "caseNumber": "CASE-S8-SYNTHETIC",
    "acknowledgement": {
      "decisionReference": "DSP-S8-SYNTHETIC-HOLD",
      "holdReference": "HOLD-S8-SYNTHETIC-1",
      "target": {
        "contextCode": "funds",
        "businessReference": "PAY-S8-SYNTHETIC",
        "scopeCode": 3,
        "operations": [
          "approve-payment",
          "execute-payment"
        ],
        "source": {
          "type": "funds",
          "id": "PAY-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        }
      },
      "ownerExecution": {
        "type": "funds",
        "id": "PAY-S8-SYNTHETIC",
        "revision": "1",
        "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
        "sourceEventTail": "SYNTHETIC-OWNER-GATE"
      },
      "phase": "applied"
    }
  },
  "response": {
    "resource": {
      "dispositionNumber": "DSP-S8-SYNTHETIC-7",
      "caseNumber": "CASE-S8-SYNTHETIC",
      "actionCode": 4,
      "resultCode": 1,
      "actorReference": "SYNTHETIC-CASE-OWNER",
      "occurredAt": "2026-11-01T01:00:00Z",
      "affectedContexts": [
        {
          "contextCode": "funds",
          "businessReference": "PAY-S8-SYNTHETIC",
          "scopeCode": 3,
          "operations": [
            "approve-payment",
            "execute-payment"
          ],
          "source": {
            "type": "funds",
            "id": "PAY-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        }
      ],
      "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
      "etag": "\"s8-case-event-1\"",
      "acknowledgement": {
        "decisionReference": "DSP-S8-SYNTHETIC-HOLD",
        "holdReference": "HOLD-S8-SYNTHETIC-1",
        "target": {
          "contextCode": "funds",
          "businessReference": "PAY-S8-SYNTHETIC",
          "scopeCode": 3,
          "operations": [
            "approve-payment",
            "execute-payment"
          ],
          "source": {
            "type": "funds",
            "id": "PAY-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        },
        "ownerExecution": {
          "type": "funds",
          "id": "PAY-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "SYNTHETIC-OWNER-GATE"
        },
        "phase": "applied"
      }
    }
  },
  "successTrailers": {}
}
```

## CreateCaseRemedy

`POST /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/remedies`

客户端/应用deadline：10000/8000ms。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/dispositions/DSP-S8-SYNTHETIC-8
ETag: "s8-case-event-1"

{
  "dispositionNumber": "DSP-S8-SYNTHETIC-8",
  "caseNumber": "CASE-S8-SYNTHETIC",
  "actionCode": 3,
  "resultCode": 1,
  "actorReference": "SYNTHETIC-CASE-OWNER",
  "occurredAt": "2026-11-01T01:00:00Z",
  "affectedContexts": [
    {
      "contextCode": "funds",
      "businessReference": "PAY-S8-SYNTHETIC",
      "scopeCode": 3,
      "operations": [
        "approve-payment",
        "execute-payment"
      ],
      "source": {
        "type": "funds",
        "id": "PAY-S8-SYNTHETIC",
        "revision": "1",
        "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
        "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
      }
    }
  ],
  "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
  "etag": "\"s8-case-event-1\"",
  "remedy": {
    "originalDispositionReference": "DSP-S8-SYNTHETIC-HOLD",
    "substantiveDispositions": [
      {
        "type": "trade",
        "id": "TRD-S8-SYNTHETIC",
        "revision": "1",
        "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
        "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
      }
    ],
    "evidence": [
      {
        "logicalFileNumber": "FILE-S8-SYNTHETIC",
        "revisionNumber": 1,
        "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
        "documentPurposeCode": 19
      }
    ],
    "explanation": "仅记录补正，不解除原因"
  }
}
```

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/remedies" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d8080000-0000-4000-8000-000000000009' \
  --header 'If-Match: "s8-context-synthetic-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"originalDispositionReference":"DSP-S8-SYNTHETIC-HOLD","substantiveDispositions":[{"type":"trade","id":"TRD-S8-SYNTHETIC","revision":"1","hash":"09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72","sourceEventTail":"EVT-S8-SYNTHETIC-BASE"}],"evidence":[{"logicalFileNumber":"FILE-S8-SYNTHETIC","revisionNumber":1,"sha256":"5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030","documentPurposeCode":19}],"explanation":"仅记录补正，不解除原因"}'
```

```json
{
  "designOnly": true,
  "service": "trade.reconciliation.v1.InternalReconciliationService",
  "method": "CreateCaseRemedy",
  "requestType": "CreateCaseRemedyReqMsg",
  "responseType": "CreateCaseRemedyRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d8080000-0000-4000-8000-000000000009",
    "if-match": "\"s8-context-synthetic-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "tradeNumber": "TRD-S8-SYNTHETIC",
    "caseNumber": "CASE-S8-SYNTHETIC",
    "remedy": {
      "originalDispositionReference": "DSP-S8-SYNTHETIC-HOLD",
      "substantiveDispositions": [
        {
          "type": "trade",
          "id": "TRD-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        }
      ],
      "evidence": [
        {
          "logicalFileNumber": "FILE-S8-SYNTHETIC",
          "revisionNumber": 1,
          "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
          "documentPurposeCode": 19
        }
      ],
      "explanation": "仅记录补正，不解除原因"
    }
  },
  "response": {
    "resource": {
      "dispositionNumber": "DSP-S8-SYNTHETIC-8",
      "caseNumber": "CASE-S8-SYNTHETIC",
      "actionCode": 3,
      "resultCode": 1,
      "actorReference": "SYNTHETIC-CASE-OWNER",
      "occurredAt": "2026-11-01T01:00:00Z",
      "affectedContexts": [
        {
          "contextCode": "funds",
          "businessReference": "PAY-S8-SYNTHETIC",
          "scopeCode": 3,
          "operations": [
            "approve-payment",
            "execute-payment"
          ],
          "source": {
            "type": "funds",
            "id": "PAY-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        }
      ],
      "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
      "etag": "\"s8-case-event-1\"",
      "remedy": {
        "originalDispositionReference": "DSP-S8-SYNTHETIC-HOLD",
        "substantiveDispositions": [
          {
            "type": "trade",
            "id": "TRD-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        ],
        "evidence": [
          {
            "logicalFileNumber": "FILE-S8-SYNTHETIC",
            "revisionNumber": 1,
            "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
            "documentPurposeCode": 19
          }
        ],
        "explanation": "仅记录补正，不解除原因"
      }
    }
  },
  "successTrailers": {}
}
```

## CreateCaseRemedyDecision

`POST /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/remedy-decisions`

客户端/应用deadline：10000/8000ms。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/dispositions/DSP-S8-SYNTHETIC-9
ETag: "s8-case-event-1"

{
  "dispositionNumber": "DSP-S8-SYNTHETIC-9",
  "caseNumber": "CASE-S8-SYNTHETIC",
  "actionCode": 4,
  "resultCode": 3,
  "actorReference": "SYNTHETIC-CASE-OWNER",
  "occurredAt": "2026-11-01T01:00:00Z",
  "affectedContexts": [
    {
      "contextCode": "funds",
      "businessReference": "PAY-S8-SYNTHETIC",
      "scopeCode": 3,
      "operations": [
        "approve-payment",
        "execute-payment"
      ],
      "source": {
        "type": "funds",
        "id": "PAY-S8-SYNTHETIC",
        "revision": "1",
        "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
        "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
      }
    }
  ],
  "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
  "etag": "\"s8-case-event-1\"",
  "review": {
    "applicationReference": "DSP-S8-SYNTHETIC-APPLICATION",
    "outcome": "REVIEW_OUTCOME_RETURN",
    "reason": "真实外部证据未核实，保留原暂停及其他原因",
    "expectedVector": {
      "sources": [
        {
          "type": "trade",
          "id": "TRD-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        }
      ],
      "objectSets": [
        {
          "type": "trade",
          "objectIds": [
            "TRD-S8-SYNTHETIC"
          ],
          "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
        },
        {
          "type": "shipment",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "customs",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "payment",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "accounting",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "certificate",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "taxrefund",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "compliance",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        }
      ],
      "ruleVersion": "S8-RECONCILIATION-1",
      "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
    },
    "evidence": []
  },
  "approverReference": "SYNTHETIC-INDEPENDENT-REVIEWER"
}
```

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/remedy-decisions" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d8080000-0000-4000-8000-000000000010' \
  --header 'If-Match: "s8-context-synthetic-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"applicationReference":"DSP-S8-SYNTHETIC-APPLICATION","outcome":"REVIEW_OUTCOME_RETURN","reason":"真实外部证据未核实，保留原暂停及其他原因","expectedVector":{"sources":[{"type":"trade","id":"TRD-S8-SYNTHETIC","revision":"1","hash":"09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72","sourceEventTail":"EVT-S8-SYNTHETIC-BASE"}],"objectSets":[{"type":"trade","objectIds":["TRD-S8-SYNTHETIC"],"hash":"28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"},{"type":"shipment","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"customs","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"payment","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"accounting","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"certificate","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"taxrefund","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"compliance","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"}],"ruleVersion":"S8-RECONCILIATION-1","hash":"1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"},"evidence":[]}'
```

```json
{
  "designOnly": true,
  "service": "trade.reconciliation.v1.InternalReconciliationService",
  "method": "CreateCaseRemedyDecision",
  "requestType": "CreateCaseRemedyDecisionReqMsg",
  "responseType": "CreateCaseRemedyDecisionRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d8080000-0000-4000-8000-000000000010",
    "if-match": "\"s8-context-synthetic-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "tradeNumber": "TRD-S8-SYNTHETIC",
    "caseNumber": "CASE-S8-SYNTHETIC",
    "decision": {
      "applicationReference": "DSP-S8-SYNTHETIC-APPLICATION",
      "outcome": "REVIEW_OUTCOME_RETURN",
      "reason": "真实外部证据未核实，保留原暂停及其他原因",
      "expectedVector": {
        "sources": [
          {
            "type": "trade",
            "id": "TRD-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        ],
        "objectSets": [
          {
            "type": "trade",
            "objectIds": [
              "TRD-S8-SYNTHETIC"
            ],
            "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
          },
          {
            "type": "shipment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "customs",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "payment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "accounting",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "certificate",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "taxrefund",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "compliance",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          }
        ],
        "ruleVersion": "S8-RECONCILIATION-1",
        "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
      },
      "evidence": []
    }
  },
  "response": {
    "resource": {
      "dispositionNumber": "DSP-S8-SYNTHETIC-9",
      "caseNumber": "CASE-S8-SYNTHETIC",
      "actionCode": 4,
      "resultCode": 3,
      "actorReference": "SYNTHETIC-CASE-OWNER",
      "occurredAt": "2026-11-01T01:00:00Z",
      "affectedContexts": [
        {
          "contextCode": "funds",
          "businessReference": "PAY-S8-SYNTHETIC",
          "scopeCode": 3,
          "operations": [
            "approve-payment",
            "execute-payment"
          ],
          "source": {
            "type": "funds",
            "id": "PAY-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        }
      ],
      "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
      "etag": "\"s8-case-event-1\"",
      "review": {
        "applicationReference": "DSP-S8-SYNTHETIC-APPLICATION",
        "outcome": "REVIEW_OUTCOME_RETURN",
        "reason": "真实外部证据未核实，保留原暂停及其他原因",
        "expectedVector": {
          "sources": [
            {
              "type": "trade",
              "id": "TRD-S8-SYNTHETIC",
              "revision": "1",
              "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
              "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
            }
          ],
          "objectSets": [
            {
              "type": "trade",
              "objectIds": [
                "TRD-S8-SYNTHETIC"
              ],
              "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
            },
            {
              "type": "shipment",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "customs",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "payment",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "accounting",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "certificate",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "taxrefund",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "compliance",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            }
          ],
          "ruleVersion": "S8-RECONCILIATION-1",
          "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
        },
        "evidence": []
      },
      "approverReference": "SYNTHETIC-INDEPENDENT-REVIEWER"
    }
  },
  "successTrailers": {}
}
```

## CreateCorrectionApplication

`POST /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/correction-applications`

客户端/应用deadline：10000/8000ms。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/dispositions/DSP-S8-SYNTHETIC-10
ETag: "s8-case-event-1"

{
  "dispositionNumber": "DSP-S8-SYNTHETIC-10",
  "caseNumber": "CASE-S8-SYNTHETIC",
  "actionCode": 5,
  "resultCode": 1,
  "actorReference": "SYNTHETIC-CASE-OWNER",
  "occurredAt": "2026-11-01T01:00:00Z",
  "affectedContexts": [
    {
      "contextCode": "funds",
      "businessReference": "PAY-S8-SYNTHETIC",
      "scopeCode": 3,
      "operations": [
        "approve-payment",
        "execute-payment"
      ],
      "source": {
        "type": "funds",
        "id": "PAY-S8-SYNTHETIC",
        "revision": "1",
        "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
        "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
      }
    }
  ],
  "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
  "etag": "\"s8-case-event-1\"",
  "correctionApplication": {
    "originalNode": {
      "type": "trade",
      "id": "TRD-S8-SYNTHETIC",
      "revision": "1",
      "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
      "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
    },
    "affectedContexts": [
      {
        "contextCode": "funds",
        "businessReference": "PAY-S8-SYNTHETIC",
        "scopeCode": 3,
        "operations": [
          "approve-payment",
          "execute-payment"
        ],
        "source": {
          "type": "funds",
          "id": "PAY-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        }
      }
    ],
    "dependencyEdges": [
      {
        "type": "funds",
        "id": "PAY-S8-SYNTHETIC",
        "revision": "1",
        "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
        "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
      }
    ],
    "expectedVector": {
      "sources": [
        {
          "type": "trade",
          "id": "TRD-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        }
      ],
      "objectSets": [
        {
          "type": "trade",
          "objectIds": [
            "TRD-S8-SYNTHETIC"
          ],
          "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
        },
        {
          "type": "shipment",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "customs",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "payment",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "accounting",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "certificate",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "taxrefund",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "compliance",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        }
      ],
      "ruleVersion": "S8-RECONCILIATION-1",
      "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
    },
    "reason": "原节点新修订及重审",
    "evidence": [
      {
        "logicalFileNumber": "FILE-S8-SYNTHETIC",
        "revisionNumber": 1,
        "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
        "documentPurposeCode": 19
      }
    ]
  }
}
```

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/correction-applications" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d8080000-0000-4000-8000-000000000011' \
  --header 'If-Match: "s8-context-synthetic-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"originalNode":{"type":"trade","id":"TRD-S8-SYNTHETIC","revision":"1","hash":"09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72","sourceEventTail":"EVT-S8-SYNTHETIC-BASE"},"affectedContexts":[{"contextCode":"funds","businessReference":"PAY-S8-SYNTHETIC","scopeCode":3,"operations":["approve-payment","execute-payment"],"source":{"type":"funds","id":"PAY-S8-SYNTHETIC","revision":"1","hash":"09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72","sourceEventTail":"EVT-S8-SYNTHETIC-BASE"}}],"dependencyEdges":[{"type":"funds","id":"PAY-S8-SYNTHETIC","revision":"1","hash":"09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72","sourceEventTail":"EVT-S8-SYNTHETIC-BASE"}],"expectedVector":{"sources":[{"type":"trade","id":"TRD-S8-SYNTHETIC","revision":"1","hash":"09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72","sourceEventTail":"EVT-S8-SYNTHETIC-BASE"}],"objectSets":[{"type":"trade","objectIds":["TRD-S8-SYNTHETIC"],"hash":"28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"},{"type":"shipment","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"customs","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"payment","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"accounting","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"certificate","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"taxrefund","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"compliance","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"}],"ruleVersion":"S8-RECONCILIATION-1","hash":"1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"},"reason":"原节点新修订及重审","evidence":[{"logicalFileNumber":"FILE-S8-SYNTHETIC","revisionNumber":1,"sha256":"5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030","documentPurposeCode":19}]}'
```

```json
{
  "designOnly": true,
  "service": "trade.reconciliation.v1.InternalReconciliationService",
  "method": "CreateCorrectionApplication",
  "requestType": "CreateCorrectionApplicationReqMsg",
  "responseType": "CreateCorrectionApplicationRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d8080000-0000-4000-8000-000000000011",
    "if-match": "\"s8-context-synthetic-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "tradeNumber": "TRD-S8-SYNTHETIC",
    "caseNumber": "CASE-S8-SYNTHETIC",
    "application": {
      "originalNode": {
        "type": "trade",
        "id": "TRD-S8-SYNTHETIC",
        "revision": "1",
        "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
        "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
      },
      "affectedContexts": [
        {
          "contextCode": "funds",
          "businessReference": "PAY-S8-SYNTHETIC",
          "scopeCode": 3,
          "operations": [
            "approve-payment",
            "execute-payment"
          ],
          "source": {
            "type": "funds",
            "id": "PAY-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        }
      ],
      "dependencyEdges": [
        {
          "type": "funds",
          "id": "PAY-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        }
      ],
      "expectedVector": {
        "sources": [
          {
            "type": "trade",
            "id": "TRD-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        ],
        "objectSets": [
          {
            "type": "trade",
            "objectIds": [
              "TRD-S8-SYNTHETIC"
            ],
            "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
          },
          {
            "type": "shipment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "customs",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "payment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "accounting",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "certificate",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "taxrefund",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "compliance",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          }
        ],
        "ruleVersion": "S8-RECONCILIATION-1",
        "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
      },
      "reason": "原节点新修订及重审",
      "evidence": [
        {
          "logicalFileNumber": "FILE-S8-SYNTHETIC",
          "revisionNumber": 1,
          "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
          "documentPurposeCode": 19
        }
      ]
    }
  },
  "response": {
    "resource": {
      "dispositionNumber": "DSP-S8-SYNTHETIC-10",
      "caseNumber": "CASE-S8-SYNTHETIC",
      "actionCode": 5,
      "resultCode": 1,
      "actorReference": "SYNTHETIC-CASE-OWNER",
      "occurredAt": "2026-11-01T01:00:00Z",
      "affectedContexts": [
        {
          "contextCode": "funds",
          "businessReference": "PAY-S8-SYNTHETIC",
          "scopeCode": 3,
          "operations": [
            "approve-payment",
            "execute-payment"
          ],
          "source": {
            "type": "funds",
            "id": "PAY-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        }
      ],
      "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
      "etag": "\"s8-case-event-1\"",
      "correctionApplication": {
        "originalNode": {
          "type": "trade",
          "id": "TRD-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        },
        "affectedContexts": [
          {
            "contextCode": "funds",
            "businessReference": "PAY-S8-SYNTHETIC",
            "scopeCode": 3,
            "operations": [
              "approve-payment",
              "execute-payment"
            ],
            "source": {
              "type": "funds",
              "id": "PAY-S8-SYNTHETIC",
              "revision": "1",
              "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
              "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
            }
          }
        ],
        "dependencyEdges": [
          {
            "type": "funds",
            "id": "PAY-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        ],
        "expectedVector": {
          "sources": [
            {
              "type": "trade",
              "id": "TRD-S8-SYNTHETIC",
              "revision": "1",
              "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
              "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
            }
          ],
          "objectSets": [
            {
              "type": "trade",
              "objectIds": [
                "TRD-S8-SYNTHETIC"
              ],
              "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
            },
            {
              "type": "shipment",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "customs",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "payment",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "accounting",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "certificate",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "taxrefund",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "compliance",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            }
          ],
          "ruleVersion": "S8-RECONCILIATION-1",
          "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
        },
        "reason": "原节点新修订及重审",
        "evidence": [
          {
            "logicalFileNumber": "FILE-S8-SYNTHETIC",
            "revisionNumber": 1,
            "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
            "documentPurposeCode": 19
          }
        ]
      }
    }
  },
  "successTrailers": {}
}
```

## CreateCorrectionDecision

`POST /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/correction-decisions`

客户端/应用deadline：10000/8000ms。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/dispositions/DSP-S8-SYNTHETIC-11
ETag: "s8-case-event-1"

{
  "dispositionNumber": "DSP-S8-SYNTHETIC-11",
  "caseNumber": "CASE-S8-SYNTHETIC",
  "actionCode": 6,
  "resultCode": 3,
  "actorReference": "SYNTHETIC-CASE-OWNER",
  "occurredAt": "2026-11-01T01:00:00Z",
  "affectedContexts": [
    {
      "contextCode": "funds",
      "businessReference": "PAY-S8-SYNTHETIC",
      "scopeCode": 3,
      "operations": [
        "approve-payment",
        "execute-payment"
      ],
      "source": {
        "type": "funds",
        "id": "PAY-S8-SYNTHETIC",
        "revision": "1",
        "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
        "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
      }
    }
  ],
  "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
  "etag": "\"s8-case-event-1\"",
  "review": {
    "applicationReference": "DSP-S8-SYNTHETIC-APPLICATION",
    "outcome": "REVIEW_OUTCOME_RETURN",
    "reason": "真实外部证据未核实，保留原暂停及其他原因",
    "expectedVector": {
      "sources": [
        {
          "type": "trade",
          "id": "TRD-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        }
      ],
      "objectSets": [
        {
          "type": "trade",
          "objectIds": [
            "TRD-S8-SYNTHETIC"
          ],
          "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
        },
        {
          "type": "shipment",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "customs",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "payment",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "accounting",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "certificate",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "taxrefund",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "compliance",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        }
      ],
      "ruleVersion": "S8-RECONCILIATION-1",
      "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
    },
    "evidence": []
  },
  "approverReference": "SYNTHETIC-INDEPENDENT-REVIEWER"
}
```

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/correction-decisions" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d8080000-0000-4000-8000-000000000012' \
  --header 'If-Match: "s8-context-synthetic-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"applicationReference":"DSP-S8-SYNTHETIC-APPLICATION","outcome":"REVIEW_OUTCOME_RETURN","reason":"真实外部证据未核实，保留原暂停及其他原因","expectedVector":{"sources":[{"type":"trade","id":"TRD-S8-SYNTHETIC","revision":"1","hash":"09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72","sourceEventTail":"EVT-S8-SYNTHETIC-BASE"}],"objectSets":[{"type":"trade","objectIds":["TRD-S8-SYNTHETIC"],"hash":"28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"},{"type":"shipment","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"customs","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"payment","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"accounting","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"certificate","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"taxrefund","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"compliance","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"}],"ruleVersion":"S8-RECONCILIATION-1","hash":"1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"},"evidence":[]}'
```

```json
{
  "designOnly": true,
  "service": "trade.reconciliation.v1.InternalReconciliationService",
  "method": "CreateCorrectionDecision",
  "requestType": "CreateCorrectionDecisionReqMsg",
  "responseType": "CreateCorrectionDecisionRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d8080000-0000-4000-8000-000000000012",
    "if-match": "\"s8-context-synthetic-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "tradeNumber": "TRD-S8-SYNTHETIC",
    "caseNumber": "CASE-S8-SYNTHETIC",
    "decision": {
      "applicationReference": "DSP-S8-SYNTHETIC-APPLICATION",
      "outcome": "REVIEW_OUTCOME_RETURN",
      "reason": "真实外部证据未核实，保留原暂停及其他原因",
      "expectedVector": {
        "sources": [
          {
            "type": "trade",
            "id": "TRD-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        ],
        "objectSets": [
          {
            "type": "trade",
            "objectIds": [
              "TRD-S8-SYNTHETIC"
            ],
            "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
          },
          {
            "type": "shipment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "customs",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "payment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "accounting",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "certificate",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "taxrefund",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "compliance",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          }
        ],
        "ruleVersion": "S8-RECONCILIATION-1",
        "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
      },
      "evidence": []
    }
  },
  "response": {
    "resource": {
      "dispositionNumber": "DSP-S8-SYNTHETIC-11",
      "caseNumber": "CASE-S8-SYNTHETIC",
      "actionCode": 6,
      "resultCode": 3,
      "actorReference": "SYNTHETIC-CASE-OWNER",
      "occurredAt": "2026-11-01T01:00:00Z",
      "affectedContexts": [
        {
          "contextCode": "funds",
          "businessReference": "PAY-S8-SYNTHETIC",
          "scopeCode": 3,
          "operations": [
            "approve-payment",
            "execute-payment"
          ],
          "source": {
            "type": "funds",
            "id": "PAY-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        }
      ],
      "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
      "etag": "\"s8-case-event-1\"",
      "review": {
        "applicationReference": "DSP-S8-SYNTHETIC-APPLICATION",
        "outcome": "REVIEW_OUTCOME_RETURN",
        "reason": "真实外部证据未核实，保留原暂停及其他原因",
        "expectedVector": {
          "sources": [
            {
              "type": "trade",
              "id": "TRD-S8-SYNTHETIC",
              "revision": "1",
              "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
              "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
            }
          ],
          "objectSets": [
            {
              "type": "trade",
              "objectIds": [
                "TRD-S8-SYNTHETIC"
              ],
              "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
            },
            {
              "type": "shipment",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "customs",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "payment",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "accounting",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "certificate",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "taxrefund",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "compliance",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            }
          ],
          "ruleVersion": "S8-RECONCILIATION-1",
          "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
        },
        "evidence": []
      },
      "approverReference": "SYNTHETIC-INDEPENDENT-REVIEWER"
    }
  },
  "successTrailers": {}
}
```

## CreateReleaseApplication

`POST /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/release-applications`

客户端/应用deadline：10000/8000ms。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/dispositions/DSP-S8-SYNTHETIC-12
ETag: "s8-case-event-1"

{
  "dispositionNumber": "DSP-S8-SYNTHETIC-12",
  "caseNumber": "CASE-S8-SYNTHETIC",
  "actionCode": 7,
  "resultCode": 1,
  "actorReference": "SYNTHETIC-CASE-OWNER",
  "occurredAt": "2026-11-01T01:00:00Z",
  "affectedContexts": [
    {
      "contextCode": "funds",
      "businessReference": "PAY-S8-SYNTHETIC",
      "scopeCode": 3,
      "operations": [
        "approve-payment",
        "execute-payment"
      ],
      "source": {
        "type": "funds",
        "id": "PAY-S8-SYNTHETIC",
        "revision": "1",
        "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
        "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
      }
    }
  ],
  "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
  "etag": "\"s8-case-event-1\"",
  "releaseApplication": {
    "holdReference": "HOLD-S8-SYNTHETIC-1",
    "substantiveDispositions": [
      {
        "type": "trade",
        "id": "TRD-S8-SYNTHETIC",
        "revision": "1",
        "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
        "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
      }
    ],
    "expectedVector": {
      "sources": [
        {
          "type": "trade",
          "id": "TRD-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        }
      ],
      "objectSets": [
        {
          "type": "trade",
          "objectIds": [
            "TRD-S8-SYNTHETIC"
          ],
          "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
        },
        {
          "type": "shipment",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "customs",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "payment",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "accounting",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "certificate",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "taxrefund",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "compliance",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        }
      ],
      "ruleVersion": "S8-RECONCILIATION-1",
      "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
    },
    "evidence": [
      {
        "logicalFileNumber": "FILE-S8-SYNTHETIC",
        "revisionNumber": 1,
        "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
        "documentPurposeCode": 19
      }
    ]
  }
}
```

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/release-applications" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d8080000-0000-4000-8000-000000000013' \
  --header 'If-Match: "s8-context-synthetic-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"holdReference":"HOLD-S8-SYNTHETIC-1","substantiveDispositions":[{"type":"trade","id":"TRD-S8-SYNTHETIC","revision":"1","hash":"09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72","sourceEventTail":"EVT-S8-SYNTHETIC-BASE"}],"expectedVector":{"sources":[{"type":"trade","id":"TRD-S8-SYNTHETIC","revision":"1","hash":"09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72","sourceEventTail":"EVT-S8-SYNTHETIC-BASE"}],"objectSets":[{"type":"trade","objectIds":["TRD-S8-SYNTHETIC"],"hash":"28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"},{"type":"shipment","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"customs","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"payment","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"accounting","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"certificate","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"taxrefund","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"compliance","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"}],"ruleVersion":"S8-RECONCILIATION-1","hash":"1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"},"evidence":[{"logicalFileNumber":"FILE-S8-SYNTHETIC","revisionNumber":1,"sha256":"5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030","documentPurposeCode":19}]}'
```

```json
{
  "designOnly": true,
  "service": "trade.reconciliation.v1.InternalReconciliationService",
  "method": "CreateReleaseApplication",
  "requestType": "CreateReleaseApplicationReqMsg",
  "responseType": "CreateReleaseApplicationRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d8080000-0000-4000-8000-000000000013",
    "if-match": "\"s8-context-synthetic-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "tradeNumber": "TRD-S8-SYNTHETIC",
    "caseNumber": "CASE-S8-SYNTHETIC",
    "application": {
      "holdReference": "HOLD-S8-SYNTHETIC-1",
      "substantiveDispositions": [
        {
          "type": "trade",
          "id": "TRD-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        }
      ],
      "expectedVector": {
        "sources": [
          {
            "type": "trade",
            "id": "TRD-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        ],
        "objectSets": [
          {
            "type": "trade",
            "objectIds": [
              "TRD-S8-SYNTHETIC"
            ],
            "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
          },
          {
            "type": "shipment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "customs",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "payment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "accounting",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "certificate",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "taxrefund",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "compliance",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          }
        ],
        "ruleVersion": "S8-RECONCILIATION-1",
        "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
      },
      "evidence": [
        {
          "logicalFileNumber": "FILE-S8-SYNTHETIC",
          "revisionNumber": 1,
          "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
          "documentPurposeCode": 19
        }
      ]
    }
  },
  "response": {
    "resource": {
      "dispositionNumber": "DSP-S8-SYNTHETIC-12",
      "caseNumber": "CASE-S8-SYNTHETIC",
      "actionCode": 7,
      "resultCode": 1,
      "actorReference": "SYNTHETIC-CASE-OWNER",
      "occurredAt": "2026-11-01T01:00:00Z",
      "affectedContexts": [
        {
          "contextCode": "funds",
          "businessReference": "PAY-S8-SYNTHETIC",
          "scopeCode": 3,
          "operations": [
            "approve-payment",
            "execute-payment"
          ],
          "source": {
            "type": "funds",
            "id": "PAY-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        }
      ],
      "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
      "etag": "\"s8-case-event-1\"",
      "releaseApplication": {
        "holdReference": "HOLD-S8-SYNTHETIC-1",
        "substantiveDispositions": [
          {
            "type": "trade",
            "id": "TRD-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        ],
        "expectedVector": {
          "sources": [
            {
              "type": "trade",
              "id": "TRD-S8-SYNTHETIC",
              "revision": "1",
              "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
              "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
            }
          ],
          "objectSets": [
            {
              "type": "trade",
              "objectIds": [
                "TRD-S8-SYNTHETIC"
              ],
              "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
            },
            {
              "type": "shipment",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "customs",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "payment",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "accounting",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "certificate",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "taxrefund",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "compliance",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            }
          ],
          "ruleVersion": "S8-RECONCILIATION-1",
          "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
        },
        "evidence": [
          {
            "logicalFileNumber": "FILE-S8-SYNTHETIC",
            "revisionNumber": 1,
            "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
            "documentPurposeCode": 19
          }
        ]
      }
    }
  },
  "successTrailers": {}
}
```

## CreateReleaseDecision

`POST /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/release-decisions`

客户端/应用deadline：10000/8000ms。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/dispositions/DSP-S8-SYNTHETIC-13
ETag: "s8-case-event-1"

{
  "dispositionNumber": "DSP-S8-SYNTHETIC-13",
  "caseNumber": "CASE-S8-SYNTHETIC",
  "actionCode": 8,
  "resultCode": 3,
  "actorReference": "SYNTHETIC-CASE-OWNER",
  "occurredAt": "2026-11-01T01:00:00Z",
  "affectedContexts": [
    {
      "contextCode": "funds",
      "businessReference": "PAY-S8-SYNTHETIC",
      "scopeCode": 3,
      "operations": [
        "approve-payment",
        "execute-payment"
      ],
      "source": {
        "type": "funds",
        "id": "PAY-S8-SYNTHETIC",
        "revision": "1",
        "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
        "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
      }
    }
  ],
  "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
  "etag": "\"s8-case-event-1\"",
  "review": {
    "applicationReference": "DSP-S8-SYNTHETIC-APPLICATION",
    "outcome": "REVIEW_OUTCOME_RETURN",
    "reason": "真实外部证据未核实，保留原暂停及其他原因",
    "expectedVector": {
      "sources": [
        {
          "type": "trade",
          "id": "TRD-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        }
      ],
      "objectSets": [
        {
          "type": "trade",
          "objectIds": [
            "TRD-S8-SYNTHETIC"
          ],
          "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
        },
        {
          "type": "shipment",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "customs",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "payment",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "accounting",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "certificate",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "taxrefund",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "compliance",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        }
      ],
      "ruleVersion": "S8-RECONCILIATION-1",
      "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
    },
    "evidence": []
  },
  "approverReference": "SYNTHETIC-INDEPENDENT-REVIEWER"
}
```

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/release-decisions" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d8080000-0000-4000-8000-000000000014' \
  --header 'If-Match: "s8-context-synthetic-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"applicationReference":"DSP-S8-SYNTHETIC-APPLICATION","outcome":"REVIEW_OUTCOME_RETURN","reason":"真实外部证据未核实，保留原暂停及其他原因","expectedVector":{"sources":[{"type":"trade","id":"TRD-S8-SYNTHETIC","revision":"1","hash":"09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72","sourceEventTail":"EVT-S8-SYNTHETIC-BASE"}],"objectSets":[{"type":"trade","objectIds":["TRD-S8-SYNTHETIC"],"hash":"28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"},{"type":"shipment","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"customs","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"payment","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"accounting","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"certificate","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"taxrefund","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"compliance","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"}],"ruleVersion":"S8-RECONCILIATION-1","hash":"1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"},"evidence":[]}'
```

```json
{
  "designOnly": true,
  "service": "trade.reconciliation.v1.InternalReconciliationService",
  "method": "CreateReleaseDecision",
  "requestType": "CreateReleaseDecisionReqMsg",
  "responseType": "CreateReleaseDecisionRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d8080000-0000-4000-8000-000000000014",
    "if-match": "\"s8-context-synthetic-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "tradeNumber": "TRD-S8-SYNTHETIC",
    "caseNumber": "CASE-S8-SYNTHETIC",
    "decision": {
      "applicationReference": "DSP-S8-SYNTHETIC-APPLICATION",
      "outcome": "REVIEW_OUTCOME_RETURN",
      "reason": "真实外部证据未核实，保留原暂停及其他原因",
      "expectedVector": {
        "sources": [
          {
            "type": "trade",
            "id": "TRD-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        ],
        "objectSets": [
          {
            "type": "trade",
            "objectIds": [
              "TRD-S8-SYNTHETIC"
            ],
            "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
          },
          {
            "type": "shipment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "customs",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "payment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "accounting",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "certificate",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "taxrefund",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "compliance",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          }
        ],
        "ruleVersion": "S8-RECONCILIATION-1",
        "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
      },
      "evidence": []
    }
  },
  "response": {
    "resource": {
      "dispositionNumber": "DSP-S8-SYNTHETIC-13",
      "caseNumber": "CASE-S8-SYNTHETIC",
      "actionCode": 8,
      "resultCode": 3,
      "actorReference": "SYNTHETIC-CASE-OWNER",
      "occurredAt": "2026-11-01T01:00:00Z",
      "affectedContexts": [
        {
          "contextCode": "funds",
          "businessReference": "PAY-S8-SYNTHETIC",
          "scopeCode": 3,
          "operations": [
            "approve-payment",
            "execute-payment"
          ],
          "source": {
            "type": "funds",
            "id": "PAY-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        }
      ],
      "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
      "etag": "\"s8-case-event-1\"",
      "review": {
        "applicationReference": "DSP-S8-SYNTHETIC-APPLICATION",
        "outcome": "REVIEW_OUTCOME_RETURN",
        "reason": "真实外部证据未核实，保留原暂停及其他原因",
        "expectedVector": {
          "sources": [
            {
              "type": "trade",
              "id": "TRD-S8-SYNTHETIC",
              "revision": "1",
              "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
              "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
            }
          ],
          "objectSets": [
            {
              "type": "trade",
              "objectIds": [
                "TRD-S8-SYNTHETIC"
              ],
              "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
            },
            {
              "type": "shipment",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "customs",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "payment",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "accounting",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "certificate",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "taxrefund",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "compliance",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            }
          ],
          "ruleVersion": "S8-RECONCILIATION-1",
          "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
        },
        "evidence": []
      },
      "approverReference": "SYNTHETIC-INDEPENDENT-REVIEWER"
    }
  },
  "successTrailers": {}
}
```

## CreateCaseClosureApplication

`POST /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/closure-applications`

客户端/应用deadline：10000/8000ms。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/dispositions/DSP-S8-SYNTHETIC-14
ETag: "s8-case-event-1"

{
  "dispositionNumber": "DSP-S8-SYNTHETIC-14",
  "caseNumber": "CASE-S8-SYNTHETIC",
  "actionCode": 9,
  "resultCode": 1,
  "actorReference": "SYNTHETIC-CASE-OWNER",
  "occurredAt": "2026-11-01T01:00:00Z",
  "affectedContexts": [
    {
      "contextCode": "funds",
      "businessReference": "PAY-S8-SYNTHETIC",
      "scopeCode": 3,
      "operations": [
        "approve-payment",
        "execute-payment"
      ],
      "source": {
        "type": "funds",
        "id": "PAY-S8-SYNTHETIC",
        "revision": "1",
        "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
        "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
      }
    }
  ],
  "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
  "etag": "\"s8-case-event-1\"",
  "closureApplication": {
    "substantiveDispositions": [
      {
        "type": "trade",
        "id": "TRD-S8-SYNTHETIC",
        "revision": "1",
        "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
        "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
      }
    ],
    "moneyDifferenceClosure": {
      "type": "funds",
      "id": "PAY-S8-SYNTHETIC",
      "revision": "1",
      "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
      "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
    },
    "expectedVector": {
      "sources": [
        {
          "type": "trade",
          "id": "TRD-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        }
      ],
      "objectSets": [
        {
          "type": "trade",
          "objectIds": [
            "TRD-S8-SYNTHETIC"
          ],
          "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
        },
        {
          "type": "shipment",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "customs",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "payment",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "accounting",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "certificate",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "taxrefund",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "compliance",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        }
      ],
      "ruleVersion": "S8-RECONCILIATION-1",
      "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
    },
    "evidence": [
      {
        "logicalFileNumber": "FILE-S8-SYNTHETIC",
        "revisionNumber": 1,
        "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
        "documentPurposeCode": 19
      }
    ]
  }
}
```

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/closure-applications" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d8080000-0000-4000-8000-000000000015' \
  --header 'If-Match: "s8-context-synthetic-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"substantiveDispositions":[{"type":"trade","id":"TRD-S8-SYNTHETIC","revision":"1","hash":"09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72","sourceEventTail":"EVT-S8-SYNTHETIC-BASE"}],"moneyDifferenceClosure":{"type":"funds","id":"PAY-S8-SYNTHETIC","revision":"1","hash":"09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72","sourceEventTail":"EVT-S8-SYNTHETIC-BASE"},"expectedVector":{"sources":[{"type":"trade","id":"TRD-S8-SYNTHETIC","revision":"1","hash":"09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72","sourceEventTail":"EVT-S8-SYNTHETIC-BASE"}],"objectSets":[{"type":"trade","objectIds":["TRD-S8-SYNTHETIC"],"hash":"28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"},{"type":"shipment","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"customs","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"payment","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"accounting","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"certificate","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"taxrefund","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"compliance","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"}],"ruleVersion":"S8-RECONCILIATION-1","hash":"1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"},"evidence":[{"logicalFileNumber":"FILE-S8-SYNTHETIC","revisionNumber":1,"sha256":"5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030","documentPurposeCode":19}]}'
```

```json
{
  "designOnly": true,
  "service": "trade.reconciliation.v1.InternalReconciliationService",
  "method": "CreateCaseClosureApplication",
  "requestType": "CreateCaseClosureApplicationReqMsg",
  "responseType": "CreateCaseClosureApplicationRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d8080000-0000-4000-8000-000000000015",
    "if-match": "\"s8-context-synthetic-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "tradeNumber": "TRD-S8-SYNTHETIC",
    "caseNumber": "CASE-S8-SYNTHETIC",
    "application": {
      "substantiveDispositions": [
        {
          "type": "trade",
          "id": "TRD-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        }
      ],
      "moneyDifferenceClosure": {
        "type": "funds",
        "id": "PAY-S8-SYNTHETIC",
        "revision": "1",
        "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
        "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
      },
      "expectedVector": {
        "sources": [
          {
            "type": "trade",
            "id": "TRD-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        ],
        "objectSets": [
          {
            "type": "trade",
            "objectIds": [
              "TRD-S8-SYNTHETIC"
            ],
            "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
          },
          {
            "type": "shipment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "customs",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "payment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "accounting",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "certificate",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "taxrefund",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "compliance",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          }
        ],
        "ruleVersion": "S8-RECONCILIATION-1",
        "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
      },
      "evidence": [
        {
          "logicalFileNumber": "FILE-S8-SYNTHETIC",
          "revisionNumber": 1,
          "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
          "documentPurposeCode": 19
        }
      ]
    }
  },
  "response": {
    "resource": {
      "dispositionNumber": "DSP-S8-SYNTHETIC-14",
      "caseNumber": "CASE-S8-SYNTHETIC",
      "actionCode": 9,
      "resultCode": 1,
      "actorReference": "SYNTHETIC-CASE-OWNER",
      "occurredAt": "2026-11-01T01:00:00Z",
      "affectedContexts": [
        {
          "contextCode": "funds",
          "businessReference": "PAY-S8-SYNTHETIC",
          "scopeCode": 3,
          "operations": [
            "approve-payment",
            "execute-payment"
          ],
          "source": {
            "type": "funds",
            "id": "PAY-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        }
      ],
      "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
      "etag": "\"s8-case-event-1\"",
      "closureApplication": {
        "substantiveDispositions": [
          {
            "type": "trade",
            "id": "TRD-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        ],
        "moneyDifferenceClosure": {
          "type": "funds",
          "id": "PAY-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        },
        "expectedVector": {
          "sources": [
            {
              "type": "trade",
              "id": "TRD-S8-SYNTHETIC",
              "revision": "1",
              "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
              "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
            }
          ],
          "objectSets": [
            {
              "type": "trade",
              "objectIds": [
                "TRD-S8-SYNTHETIC"
              ],
              "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
            },
            {
              "type": "shipment",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "customs",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "payment",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "accounting",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "certificate",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "taxrefund",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "compliance",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            }
          ],
          "ruleVersion": "S8-RECONCILIATION-1",
          "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
        },
        "evidence": [
          {
            "logicalFileNumber": "FILE-S8-SYNTHETIC",
            "revisionNumber": 1,
            "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
            "documentPurposeCode": 19
          }
        ]
      }
    }
  },
  "successTrailers": {}
}
```

## CreateCaseClosureDecision

`POST /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/closure-decisions`

客户端/应用deadline：10000/8000ms。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/dispositions/DSP-S8-SYNTHETIC-15
ETag: "s8-case-event-1"

{
  "dispositionNumber": "DSP-S8-SYNTHETIC-15",
  "caseNumber": "CASE-S8-SYNTHETIC",
  "actionCode": 9,
  "resultCode": 3,
  "actorReference": "SYNTHETIC-CASE-OWNER",
  "occurredAt": "2026-11-01T01:00:00Z",
  "affectedContexts": [
    {
      "contextCode": "funds",
      "businessReference": "PAY-S8-SYNTHETIC",
      "scopeCode": 3,
      "operations": [
        "approve-payment",
        "execute-payment"
      ],
      "source": {
        "type": "funds",
        "id": "PAY-S8-SYNTHETIC",
        "revision": "1",
        "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
        "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
      }
    }
  ],
  "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
  "etag": "\"s8-case-event-1\"",
  "review": {
    "applicationReference": "DSP-S8-SYNTHETIC-APPLICATION",
    "outcome": "REVIEW_OUTCOME_RETURN",
    "reason": "真实外部证据未核实，保留原暂停及其他原因",
    "expectedVector": {
      "sources": [
        {
          "type": "trade",
          "id": "TRD-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        }
      ],
      "objectSets": [
        {
          "type": "trade",
          "objectIds": [
            "TRD-S8-SYNTHETIC"
          ],
          "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
        },
        {
          "type": "shipment",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "customs",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "payment",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "accounting",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "certificate",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "taxrefund",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "compliance",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        }
      ],
      "ruleVersion": "S8-RECONCILIATION-1",
      "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
    },
    "evidence": []
  },
  "approverReference": "SYNTHETIC-INDEPENDENT-REVIEWER"
}
```

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/closure-decisions" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d8080000-0000-4000-8000-000000000016' \
  --header 'If-Match: "s8-context-synthetic-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"applicationReference":"DSP-S8-SYNTHETIC-APPLICATION","outcome":"REVIEW_OUTCOME_RETURN","reason":"真实外部证据未核实，保留原暂停及其他原因","expectedVector":{"sources":[{"type":"trade","id":"TRD-S8-SYNTHETIC","revision":"1","hash":"09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72","sourceEventTail":"EVT-S8-SYNTHETIC-BASE"}],"objectSets":[{"type":"trade","objectIds":["TRD-S8-SYNTHETIC"],"hash":"28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"},{"type":"shipment","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"customs","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"payment","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"accounting","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"certificate","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"taxrefund","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"compliance","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"}],"ruleVersion":"S8-RECONCILIATION-1","hash":"1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"},"evidence":[]}'
```

```json
{
  "designOnly": true,
  "service": "trade.reconciliation.v1.InternalReconciliationService",
  "method": "CreateCaseClosureDecision",
  "requestType": "CreateCaseClosureDecisionReqMsg",
  "responseType": "CreateCaseClosureDecisionRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d8080000-0000-4000-8000-000000000016",
    "if-match": "\"s8-context-synthetic-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "tradeNumber": "TRD-S8-SYNTHETIC",
    "caseNumber": "CASE-S8-SYNTHETIC",
    "decision": {
      "applicationReference": "DSP-S8-SYNTHETIC-APPLICATION",
      "outcome": "REVIEW_OUTCOME_RETURN",
      "reason": "真实外部证据未核实，保留原暂停及其他原因",
      "expectedVector": {
        "sources": [
          {
            "type": "trade",
            "id": "TRD-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        ],
        "objectSets": [
          {
            "type": "trade",
            "objectIds": [
              "TRD-S8-SYNTHETIC"
            ],
            "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
          },
          {
            "type": "shipment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "customs",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "payment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "accounting",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "certificate",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "taxrefund",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "compliance",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          }
        ],
        "ruleVersion": "S8-RECONCILIATION-1",
        "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
      },
      "evidence": []
    }
  },
  "response": {
    "resource": {
      "dispositionNumber": "DSP-S8-SYNTHETIC-15",
      "caseNumber": "CASE-S8-SYNTHETIC",
      "actionCode": 9,
      "resultCode": 3,
      "actorReference": "SYNTHETIC-CASE-OWNER",
      "occurredAt": "2026-11-01T01:00:00Z",
      "affectedContexts": [
        {
          "contextCode": "funds",
          "businessReference": "PAY-S8-SYNTHETIC",
          "scopeCode": 3,
          "operations": [
            "approve-payment",
            "execute-payment"
          ],
          "source": {
            "type": "funds",
            "id": "PAY-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        }
      ],
      "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
      "etag": "\"s8-case-event-1\"",
      "review": {
        "applicationReference": "DSP-S8-SYNTHETIC-APPLICATION",
        "outcome": "REVIEW_OUTCOME_RETURN",
        "reason": "真实外部证据未核实，保留原暂停及其他原因",
        "expectedVector": {
          "sources": [
            {
              "type": "trade",
              "id": "TRD-S8-SYNTHETIC",
              "revision": "1",
              "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
              "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
            }
          ],
          "objectSets": [
            {
              "type": "trade",
              "objectIds": [
                "TRD-S8-SYNTHETIC"
              ],
              "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
            },
            {
              "type": "shipment",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "customs",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "payment",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "accounting",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "certificate",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "taxrefund",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "compliance",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            }
          ],
          "ruleVersion": "S8-RECONCILIATION-1",
          "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
        },
        "evidence": []
      },
      "approverReference": "SYNTHETIC-INDEPENDENT-REVIEWER"
    }
  },
  "successTrailers": {}
}
```

## GetCaseDisposition

`GET /internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/dispositions/DSP-S8-SYNTHETIC`

客户端/应用deadline：5000/4000ms。

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s8-case-event-1"

{
  "dispositionNumber": "DSP-S8-SYNTHETIC",
  "caseNumber": "CASE-S8-SYNTHETIC",
  "actionCode": 3,
  "resultCode": 1,
  "actorReference": "SYNTHETIC-CASE-OWNER",
  "occurredAt": "2026-11-01T01:00:00Z",
  "affectedContexts": [
    {
      "contextCode": "funds",
      "businessReference": "PAY-S8-SYNTHETIC",
      "scopeCode": 3,
      "operations": [
        "approve-payment",
        "execute-payment"
      ],
      "source": {
        "type": "funds",
        "id": "PAY-S8-SYNTHETIC",
        "revision": "1",
        "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
        "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
      }
    }
  ],
  "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
  "remedy": {
    "originalDispositionReference": "DSP-S8-SYNTHETIC-HOLD",
    "substantiveDispositions": [
      {
        "type": "trade",
        "id": "TRD-S8-SYNTHETIC",
        "revision": "1",
        "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
        "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
      }
    ],
    "evidence": [
      {
        "logicalFileNumber": "FILE-S8-SYNTHETIC",
        "revisionNumber": 1,
        "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
        "documentPurposeCode": 19
      }
    ],
    "explanation": "仅记录补正，不解除原因"
  },
  "etag": "\"s8-case-event-1\""
}
```

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S8-SYNTHETIC/discrepancy-cases/CASE-S8-SYNTHETIC/dispositions/DSP-S8-SYNTHETIC" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.reconciliation.v1.InternalReconciliationService",
  "method": "GetCaseDisposition",
  "requestType": "GetCaseDispositionReqMsg",
  "responseType": "GetCaseDispositionRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>"
  },
  "request": {
    "tradeNumber": "TRD-S8-SYNTHETIC",
    "caseNumber": "CASE-S8-SYNTHETIC",
    "dispositionNumber": "DSP-S8-SYNTHETIC"
  },
  "response": {
    "resource": {
      "dispositionNumber": "DSP-S8-SYNTHETIC",
      "caseNumber": "CASE-S8-SYNTHETIC",
      "actionCode": 3,
      "resultCode": 1,
      "actorReference": "SYNTHETIC-CASE-OWNER",
      "occurredAt": "2026-11-01T01:00:00Z",
      "affectedContexts": [
        {
          "contextCode": "funds",
          "businessReference": "PAY-S8-SYNTHETIC",
          "scopeCode": 3,
          "operations": [
            "approve-payment",
            "execute-payment"
          ],
          "source": {
            "type": "funds",
            "id": "PAY-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        }
      ],
      "acceptanceId": "S8-SYNTHETIC-DISPOSITION",
      "remedy": {
        "originalDispositionReference": "DSP-S8-SYNTHETIC-HOLD",
        "substantiveDispositions": [
          {
            "type": "trade",
            "id": "TRD-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        ],
        "evidence": [
          {
            "logicalFileNumber": "FILE-S8-SYNTHETIC",
            "revisionNumber": 1,
            "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
            "documentPurposeCode": 19
          }
        ],
        "explanation": "仅记录补正，不解除原因"
      },
      "etag": "\"s8-case-event-1\""
    }
  },
  "successTrailers": {}
}
```

## CreateTradeClosureApplication

`POST /internal/v1/trades/TRD-S8-SYNTHETIC/closure-applications`

客户端/应用deadline：10000/8000ms。

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "https://example.invalid/problems/external-evidence-missing",
  "title": "EXTERNAL_EVIDENCE_MISSING",
  "status": 422,
  "detail": "当前报告包含unknown，缺真实外部证据，不受理正常结案申请",
  "instance": "/internal/v1/trades/TRD-S8-SYNTHETIC/closure-applications",
  "errors": [
    {
      "pointer": "/reportNumber",
      "code": "EXTERNAL_EVIDENCE_MISSING",
      "detail": "补齐原所属域真实证据后生成新报告"
    }
  ],
  "outcomeUnknown": false,
  "retryAfterMs": 0
}
```

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S8-SYNTHETIC/closure-applications" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d8080000-0000-4000-8000-000000000018' \
  --header 'If-Match: "s8-context-synthetic-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"reportNumber":"RPT-S8-SYNTHETIC","reportHash":"f21b61ebfb49a9935d675d846d88a353e096c823f861545fb968398c169320e8","expectedVector":{"sources":[{"type":"trade","id":"TRD-S8-SYNTHETIC","revision":"1","hash":"09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72","sourceEventTail":"EVT-S8-SYNTHETIC-BASE"}],"objectSets":[{"type":"trade","objectIds":["TRD-S8-SYNTHETIC"],"hash":"28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"},{"type":"shipment","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"customs","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"payment","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"accounting","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"certificate","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"taxrefund","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"compliance","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"}],"ruleVersion":"S8-RECONCILIATION-1","hash":"1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"},"reason":"独立协议结构例：须另有当前真实证据完整报告；未建立前置，不执行、不证明受理成功"}'
```

```json
{
  "designOnly": true,
  "service": "trade.reconciliation.v1.InternalReconciliationService",
  "method": "CreateTradeClosureApplication",
  "requestType": "CreateTradeClosureApplicationReqMsg",
  "responseType": "CreateTradeClosureApplicationRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d8080000-0000-4000-8000-000000000018",
    "if-match": "\"s8-context-synthetic-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "tradeNumber": "TRD-S8-SYNTHETIC",
    "application": {
      "reportNumber": "RPT-S8-SYNTHETIC",
      "reportHash": "f21b61ebfb49a9935d675d846d88a353e096c823f861545fb968398c169320e8",
      "expectedVector": {
        "sources": [
          {
            "type": "trade",
            "id": "TRD-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        ],
        "objectSets": [
          {
            "type": "trade",
            "objectIds": [
              "TRD-S8-SYNTHETIC"
            ],
            "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
          },
          {
            "type": "shipment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "customs",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "payment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "accounting",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "certificate",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "taxrefund",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "compliance",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          }
        ],
        "ruleVersion": "S8-RECONCILIATION-1",
        "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
      },
      "reason": "独立协议结构例：须另有当前真实证据完整报告；未建立前置，不执行、不证明受理成功"
    }
  },
  "successTrailers": {},
  "error": {
    "code": "FAILED_PRECONDITION",
    "details": {
      "code": "EXTERNAL_EVIDENCE_MISSING",
      "httpStatus": 422,
      "errors": [
        {
          "pointer": "/reportNumber",
          "code": "EXTERNAL_EVIDENCE_MISSING",
          "detail": "补齐原所属域真实证据后生成新报告"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "d8080000-0000-4000-8000-000000000018"
    }
  }
}
```

## GetTradeClosureApplication

`GET /internal/v1/trades/TRD-S8-SYNTHETIC/closure-applications/APP-S8-SYNTHETIC`

客户端/应用deadline：5000/4000ms。

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s8-immutable-18"

{
  "applicationNumber": "APP-S8-SYNTHETIC",
  "tradeNumber": "TRD-S8-SYNTHETIC",
  "basis": {
    "reportNumber": "RPT-S8-REQUIRES-REAL-EVIDENCE",
    "reportHash": "e7f924d30e22039d4ce3d0dca99e67a942fb6ddebed90b5da83a837efa4c25ed",
    "expectedVector": {
      "sources": [
        {
          "type": "trade",
          "id": "TRD-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        }
      ],
      "objectSets": [
        {
          "type": "trade",
          "objectIds": [
            "TRD-S8-SYNTHETIC"
          ],
          "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
        },
        {
          "type": "shipment",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "customs",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "payment",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "accounting",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "certificate",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "taxrefund",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "compliance",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        }
      ],
      "ruleVersion": "S8-RECONCILIATION-1",
      "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
    },
    "reason": "独立协议结构例：须另有当前真实证据完整报告；未建立前置，不执行、不证明受理成功"
  },
  "applicantReference": "SYNTHETIC-APPLICANT",
  "createdAt": "2026-11-01T01:00:00Z",
  "acceptanceId": "S8-SYNTHETIC-APPLICATION"
}
```

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S8-SYNTHETIC/closure-applications/APP-S8-SYNTHETIC" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.reconciliation.v1.InternalReconciliationService",
  "method": "GetTradeClosureApplication",
  "requestType": "GetTradeClosureApplicationReqMsg",
  "responseType": "GetTradeClosureApplicationRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>"
  },
  "request": {
    "tradeNumber": "TRD-S8-SYNTHETIC",
    "applicationNumber": "APP-S8-SYNTHETIC"
  },
  "response": {
    "resource": {
      "applicationNumber": "APP-S8-SYNTHETIC",
      "tradeNumber": "TRD-S8-SYNTHETIC",
      "basis": {
        "reportNumber": "RPT-S8-REQUIRES-REAL-EVIDENCE",
        "reportHash": "e7f924d30e22039d4ce3d0dca99e67a942fb6ddebed90b5da83a837efa4c25ed",
        "expectedVector": {
          "sources": [
            {
              "type": "trade",
              "id": "TRD-S8-SYNTHETIC",
              "revision": "1",
              "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
              "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
            }
          ],
          "objectSets": [
            {
              "type": "trade",
              "objectIds": [
                "TRD-S8-SYNTHETIC"
              ],
              "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
            },
            {
              "type": "shipment",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "customs",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "payment",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "accounting",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "certificate",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "taxrefund",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "compliance",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            }
          ],
          "ruleVersion": "S8-RECONCILIATION-1",
          "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
        },
        "reason": "独立协议结构例：须另有当前真实证据完整报告；未建立前置，不执行、不证明受理成功"
      },
      "applicantReference": "SYNTHETIC-APPLICANT",
      "createdAt": "2026-11-01T01:00:00Z",
      "acceptanceId": "S8-SYNTHETIC-APPLICATION"
    }
  },
  "successTrailers": {}
}
```

## CreateTradeClosureDecision

`POST /internal/v1/trades/TRD-S8-SYNTHETIC/closure-applications/APP-S8-SYNTHETIC/decisions`

客户端/应用deadline：10000/8000ms。

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /internal/v1/trades/TRD-S8-SYNTHETIC/closure-applications/APP-S8-SYNTHETIC/decisions/DEC-S8-SYNTHETIC
ETag: "s8-immutable-19"

{
  "decisionNumber": "DEC-S8-SYNTHETIC",
  "applicationNumber": "APP-S8-SYNTHETIC",
  "eventTypeCode": 20,
  "tradeStatusCode": 8,
  "reviewerReference": "SYNTHETIC-INDEPENDENT-REVIEWER",
  "blockingCodes": [
    "EXTERNAL_EVIDENCE_MISSING"
  ],
  "reason": "无真实外部证据，退回保持8",
  "acceptanceId": "S8-SYNTHETIC-DECISION"
}
```

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S8-SYNTHETIC/closure-applications/APP-S8-SYNTHETIC/decisions" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d8080000-0000-4000-8000-000000000020' \
  --header 'If-Match: "s8-context-synthetic-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"outcome":"REVIEW_OUTCOME_RETURN","reason":"当前报告陈旧或证据缺失，不结案","expectedVector":{"sources":[{"type":"trade","id":"TRD-S8-SYNTHETIC","revision":"1","hash":"09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72","sourceEventTail":"EVT-S8-SYNTHETIC-BASE"}],"objectSets":[{"type":"trade","objectIds":["TRD-S8-SYNTHETIC"],"hash":"28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"},{"type":"shipment","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"customs","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"payment","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"accounting","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"certificate","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"taxrefund","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"},{"type":"compliance","objectIds":[],"hash":"4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"}],"ruleVersion":"S8-RECONCILIATION-1","hash":"1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"},"evidence":[]}'
```

```json
{
  "designOnly": true,
  "service": "trade.reconciliation.v1.InternalReconciliationService",
  "method": "CreateTradeClosureDecision",
  "requestType": "CreateTradeClosureDecisionReqMsg",
  "responseType": "CreateTradeClosureDecisionRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d8080000-0000-4000-8000-000000000020",
    "if-match": "\"s8-context-synthetic-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "tradeNumber": "TRD-S8-SYNTHETIC",
    "applicationNumber": "APP-S8-SYNTHETIC",
    "decision": {
      "outcome": "REVIEW_OUTCOME_RETURN",
      "reason": "当前报告陈旧或证据缺失，不结案",
      "expectedVector": {
        "sources": [
          {
            "type": "trade",
            "id": "TRD-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        ],
        "objectSets": [
          {
            "type": "trade",
            "objectIds": [
              "TRD-S8-SYNTHETIC"
            ],
            "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
          },
          {
            "type": "shipment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "customs",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "payment",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "accounting",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "certificate",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "taxrefund",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          },
          {
            "type": "compliance",
            "objectIds": [],
            "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
          }
        ],
        "ruleVersion": "S8-RECONCILIATION-1",
        "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
      },
      "evidence": []
    }
  },
  "response": {
    "resource": {
      "decisionNumber": "DEC-S8-SYNTHETIC",
      "applicationNumber": "APP-S8-SYNTHETIC",
      "eventTypeCode": 20,
      "tradeStatusCode": 8,
      "reviewerReference": "SYNTHETIC-INDEPENDENT-REVIEWER",
      "blockingCodes": [
        "EXTERNAL_EVIDENCE_MISSING"
      ],
      "reason": "无真实外部证据，退回保持8",
      "acceptanceId": "S8-SYNTHETIC-DECISION"
    }
  },
  "successTrailers": {}
}
```

## GetTradeClosureDecision

`GET /internal/v1/trades/TRD-S8-SYNTHETIC/closure-applications/APP-S8-SYNTHETIC/decisions/DEC-S8-SYNTHETIC`

客户端/应用deadline：5000/4000ms。

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s8-immutable-20"

{
  "decisionNumber": "DEC-S8-SYNTHETIC",
  "applicationNumber": "APP-S8-SYNTHETIC",
  "eventTypeCode": 20,
  "tradeStatusCode": 8,
  "reviewerReference": "SYNTHETIC-INDEPENDENT-REVIEWER",
  "blockingCodes": [
    "EXTERNAL_EVIDENCE_MISSING"
  ],
  "reason": "无真实外部证据，退回保持8",
  "acceptanceId": "S8-SYNTHETIC-DECISION"
}
```

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S8-SYNTHETIC/closure-applications/APP-S8-SYNTHETIC/decisions/DEC-S8-SYNTHETIC" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.reconciliation.v1.InternalReconciliationService",
  "method": "GetTradeClosureDecision",
  "requestType": "GetTradeClosureDecisionReqMsg",
  "responseType": "GetTradeClosureDecisionRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>"
  },
  "request": {
    "tradeNumber": "TRD-S8-SYNTHETIC",
    "applicationNumber": "APP-S8-SYNTHETIC",
    "decisionNumber": "DEC-S8-SYNTHETIC"
  },
  "response": {
    "resource": {
      "decisionNumber": "DEC-S8-SYNTHETIC",
      "applicationNumber": "APP-S8-SYNTHETIC",
      "eventTypeCode": 20,
      "tradeStatusCode": 8,
      "reviewerReference": "SYNTHETIC-INDEPENDENT-REVIEWER",
      "blockingCodes": [
        "EXTERNAL_EVIDENCE_MISSING"
      ],
      "reason": "无真实外部证据，退回保持8",
      "acceptanceId": "S8-SYNTHETIC-DECISION"
    }
  },
  "successTrailers": {}
}
```

## GetReconciliationAcceptance

`GET /internal/v1/trades/TRD-S8-SYNTHETIC/reconciliation-acceptances/d8080000-0000-4000-8000-000000000001`

客户端/应用deadline：5000/4000ms。

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s8-immutable-21"

{
  "requestKey": "d8080000-0000-4000-8000-000000000001",
  "originalHttpStatus": 201,
  "originalLocation": "/internal/v1/trades/TRD-S8-SYNTHETIC/reconciliation-reports/RPT-S8-SYNTHETIC",
  "originalEtag": "\"s8-report-synthetic-1\"",
  "bodyHash": "378e36e5ae406db6f3f28c35bf534d1c69cd6cd07c706aad1f92423757301de0",
  "report": {
    "reportNumber": "RPT-S8-SYNTHETIC",
    "tradeNumber": "TRD-S8-SYNTHETIC",
    "vector": {
      "sources": [
        {
          "type": "trade",
          "id": "TRD-S8-SYNTHETIC",
          "revision": "1",
          "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
          "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
        }
      ],
      "objectSets": [
        {
          "type": "trade",
          "objectIds": [
            "TRD-S8-SYNTHETIC"
          ],
          "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
        },
        {
          "type": "shipment",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "customs",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "payment",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "accounting",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "certificate",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "taxrefund",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        },
        {
          "type": "compliance",
          "objectIds": [],
          "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
        }
      ],
      "ruleVersion": "S8-RECONCILIATION-1",
      "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
    },
    "checks": [
      {
        "itemNumber": "SOURCE-COMPLETENESS",
        "ruleCode": "SOURCE_UNKNOWN",
        "result": "CHECK_RESULT_UNKNOWN",
        "sources": [
          {
            "type": "trade",
            "id": "TRD-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        ],
        "evidence": [],
        "blockingCodes": [
          "SOURCE_UNKNOWN"
        ],
        "explanation": "跨域尚未提供真实源与完整集合，空合成集合不证明无对象"
      },
      {
        "itemNumber": "EXTERNAL-EVIDENCE",
        "ruleCode": "REAL_EXTERNAL_PROOF",
        "result": "CHECK_RESULT_UNKNOWN",
        "sources": [],
        "evidence": [],
        "blockingCodes": [
          "EXTERNAL_EVIDENCE_MISSING"
        ],
        "explanation": "原创文件只证明内部合成记录，不构成银行/海关/税务证明"
      },
      {
        "itemNumber": "FUNDS-ALLOCATION",
        "ruleCode": "CNY_CONSERVATION",
        "result": "CHECK_RESULT_PASS",
        "expectedDecimal": "100.00",
        "observedDecimal": "100.00",
        "currencyCode": "CNY",
        "sources": [
          {
            "type": "trade",
            "id": "TRD-S8-SYNTHETIC",
            "revision": "1",
            "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
            "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
          }
        ],
        "evidence": [
          {
            "logicalFileNumber": "FILE-S8-SYNTHETIC",
            "revisionNumber": 1,
            "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
            "documentPurposeCode": 19
          }
        ],
        "blockingCodes": [],
        "explanation": "仅说明结构中的合成金额一致，不证明真实资金平衡"
      }
    ],
    "evidence": [
      {
        "logicalFileNumber": "FILE-S8-SYNTHETIC",
        "revisionNumber": 1,
        "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
        "documentPurposeCode": 19
      }
    ],
    "reportHash": "f21b61ebfb49a9935d675d846d88a353e096c823f861545fb968398c169320e8",
    "creatorReference": "SYNTHETIC-RECONCILER",
    "createdAt": "2026-11-01T01:00:00Z",
    "acceptanceId": "S8-SYNTHETIC-REPORT"
  }
}
```

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S8-SYNTHETIC/reconciliation-acceptances/d8080000-0000-4000-8000-000000000001" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.reconciliation.v1.InternalReconciliationService",
  "method": "GetReconciliationAcceptance",
  "requestType": "GetReconciliationAcceptanceReqMsg",
  "responseType": "GetReconciliationAcceptanceRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>"
  },
  "request": {
    "tradeNumber": "TRD-S8-SYNTHETIC",
    "requestKey": "d8080000-0000-4000-8000-000000000001"
  },
  "response": {
    "resource": {
      "requestKey": "d8080000-0000-4000-8000-000000000001",
      "originalHttpStatus": 201,
      "originalLocation": "/internal/v1/trades/TRD-S8-SYNTHETIC/reconciliation-reports/RPT-S8-SYNTHETIC",
      "originalEtag": "\"s8-report-synthetic-1\"",
      "bodyHash": "378e36e5ae406db6f3f28c35bf534d1c69cd6cd07c706aad1f92423757301de0",
      "report": {
        "reportNumber": "RPT-S8-SYNTHETIC",
        "tradeNumber": "TRD-S8-SYNTHETIC",
        "vector": {
          "sources": [
            {
              "type": "trade",
              "id": "TRD-S8-SYNTHETIC",
              "revision": "1",
              "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
              "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
            }
          ],
          "objectSets": [
            {
              "type": "trade",
              "objectIds": [
                "TRD-S8-SYNTHETIC"
              ],
              "hash": "28c0b28c134c7ef66afdcadcb9dca9e062e5244aeb6840fbea66c2c721207ddc"
            },
            {
              "type": "shipment",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "customs",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "payment",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "accounting",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "certificate",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "taxrefund",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            },
            {
              "type": "compliance",
              "objectIds": [],
              "hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
            }
          ],
          "ruleVersion": "S8-RECONCILIATION-1",
          "hash": "1058a396e57dea147da35c229791294e3ae70432544db21e0ad2c533be4adef7"
        },
        "checks": [
          {
            "itemNumber": "SOURCE-COMPLETENESS",
            "ruleCode": "SOURCE_UNKNOWN",
            "result": "CHECK_RESULT_UNKNOWN",
            "sources": [
              {
                "type": "trade",
                "id": "TRD-S8-SYNTHETIC",
                "revision": "1",
                "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
                "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
              }
            ],
            "evidence": [],
            "blockingCodes": [
              "SOURCE_UNKNOWN"
            ],
            "explanation": "跨域尚未提供真实源与完整集合，空合成集合不证明无对象"
          },
          {
            "itemNumber": "EXTERNAL-EVIDENCE",
            "ruleCode": "REAL_EXTERNAL_PROOF",
            "result": "CHECK_RESULT_UNKNOWN",
            "sources": [],
            "evidence": [],
            "blockingCodes": [
              "EXTERNAL_EVIDENCE_MISSING"
            ],
            "explanation": "原创文件只证明内部合成记录，不构成银行/海关/税务证明"
          },
          {
            "itemNumber": "FUNDS-ALLOCATION",
            "ruleCode": "CNY_CONSERVATION",
            "result": "CHECK_RESULT_PASS",
            "expectedDecimal": "100.00",
            "observedDecimal": "100.00",
            "currencyCode": "CNY",
            "sources": [
              {
                "type": "trade",
                "id": "TRD-S8-SYNTHETIC",
                "revision": "1",
                "hash": "09374aec203ba430c53b9fcf46759cb154699ba852d41fb3fd2fdb226d142f72",
                "sourceEventTail": "EVT-S8-SYNTHETIC-BASE"
              }
            ],
            "evidence": [
              {
                "logicalFileNumber": "FILE-S8-SYNTHETIC",
                "revisionNumber": 1,
                "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
                "documentPurposeCode": 19
              }
            ],
            "blockingCodes": [],
            "explanation": "仅说明结构中的合成金额一致，不证明真实资金平衡"
          }
        ],
        "evidence": [
          {
            "logicalFileNumber": "FILE-S8-SYNTHETIC",
            "revisionNumber": 1,
            "sha256": "5c331c40fe7d48aa26b6e83dd36aaa3b2bdea6b54d76bb7bf3d96b823aafd030",
            "documentPurposeCode": 19
          }
        ],
        "reportHash": "f21b61ebfb49a9935d675d846d88a353e096c823f861545fb968398c169320e8",
        "creatorReference": "SYNTHETIC-RECONCILER",
        "createdAt": "2026-11-01T01:00:00Z",
        "acceptanceId": "S8-SYNTHETIC-REPORT"
      }
    }
  },
  "successTrailers": {}
}
```
