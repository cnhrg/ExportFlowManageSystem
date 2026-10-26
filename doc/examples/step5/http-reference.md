# 步骤五 HTTP / RPC / cURL

设计例，所有身份与证据均合成。缺银行事实的端点返回强类型错误，内部受理不等于银行执行。

## GetTradeFundsOverview

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s5-synthetic-revision-1"

{
  "tradeNumber": "TRD-S5-SYNTHETIC",
  "approvedTradeRevisionNumber": 1,
  "balances": {
    "restricted": {
      "amount": "0.00",
      "currencyCode": "CNY"
    },
    "available": {
      "amount": "0.00",
      "currencyCode": "CNY"
    },
    "paymentLocked": {
      "amount": "0.00",
      "currencyCode": "CNY"
    }
  },
  "matchedReceipts": {
    "amount": "0.00",
    "currencyCode": "CNY"
  },
  "unmatchedRestricted": {
    "amount": "0.00",
    "currencyCode": "CNY"
  },
  "allocatedGross": {
    "amount": "0.00",
    "currencyCode": "CNY"
  },
  "released": {
    "amount": "0.00",
    "currencyCode": "CNY"
  },
  "occupied": {
    "amount": "0.00",
    "currencyCode": "CNY"
  },
  "openGateCodes": [
    "FUND_EVIDENCE_MISSING"
  ],
  "openDifferenceNumbers": [],
  "etag": "\"s5-synthetic-revision-1\""
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/trades/TRD-S5-SYNTHETIC/funds" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.funds.v1.ExternalFundsService",
  "method": "GetTradeFundsOverview",
  "requestType": "GetTradeFundsOverviewReqMsg",
  "responseType": "GetTradeFundsOverviewRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>"
  },
  "request": {
    "tradeNumber": "TRD-S5-SYNTHETIC"
  },
  "response": {
    "resource": {
      "tradeNumber": "TRD-S5-SYNTHETIC",
      "approvedTradeRevisionNumber": 1,
      "balances": {
        "restricted": {
          "amount": "0.00",
          "currencyCode": "CNY"
        },
        "available": {
          "amount": "0.00",
          "currencyCode": "CNY"
        },
        "paymentLocked": {
          "amount": "0.00",
          "currencyCode": "CNY"
        }
      },
      "matchedReceipts": {
        "amount": "0.00",
        "currencyCode": "CNY"
      },
      "unmatchedRestricted": {
        "amount": "0.00",
        "currencyCode": "CNY"
      },
      "allocatedGross": {
        "amount": "0.00",
        "currencyCode": "CNY"
      },
      "released": {
        "amount": "0.00",
        "currencyCode": "CNY"
      },
      "occupied": {
        "amount": "0.00",
        "currencyCode": "CNY"
      },
      "openGateCodes": [
        "FUND_EVIDENCE_MISSING"
      ],
      "openDifferenceNumbers": [],
      "etag": "\"s5-synthetic-revision-1\""
    }
  },
  "successTrailers": {}
}
```

## GetFundReceipt

```http
HTTP/1.1 404 Error
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "urn:export-trade:funds:not_found",
  "title": "真实证据或资源不足，操作未完成",
  "status": 404,
  "detail": "仅合成设计例；没有真实银行接入或成功事实，资金桶及锁额不变。",
  "instance": "/api/v1/fund-receipts/FLOW-S5-ABSENT",
  "errors": [
    {
      "pointer": "/resource",
      "code": "NOT_FOUND",
      "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
    }
  ],
  "outcomeUnknown": false,
  "retryAfterMs": 0
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/fund-receipts/FLOW-S5-ABSENT" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.funds.v1.ExternalFundsService",
  "method": "GetFundReceipt",
  "requestType": "GetFundReceiptReqMsg",
  "responseType": "GetFundReceiptRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>"
  },
  "request": {
    "receiptFlowNumber": "FLOW-S5-ABSENT"
  },
  "error": {
    "code": "NOT_FOUND",
    "details": {
      "code": "NOT_FOUND",
      "httpStatus": 404,
      "errors": [
        {
          "pointer": "/resource",
          "code": "NOT_FOUND",
          "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "S5-SYNTHETIC-2"
    }
  }
}
```

## CreateInvoiceDeclaration

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
ETag: "s5-synthetic-revision-1"
Location: /api/v1/trades/TRD-S5-SYNTHETIC/invoice-declarations/S5-SYNTHETIC-ACCEPTANCE

{
  "invoiceNumber": "INV-S5-SYNTHETIC",
  "tradeNumber": "TRD-S5-SYNTHETIC",
  "declaredAmount": {
    "amount": "1000.00",
    "currencyCode": "CNY"
  },
  "approvedTradeRevisionNumber": 1,
  "status": "FUNDS_TRANSACTION_STATUS_PENDING_APPROVAL",
  "invoiceFiles": [
    {
      "logicalFileNumber": "FILE-S5-SYNTHETIC",
      "revisionNumber": 1,
      "sha256": "a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a",
      "documentTypeCode": 14
    }
  ],
  "missingGateCodes": [
    "FUND_EVIDENCE_MISSING"
  ],
  "etag": "\"s5-synthetic-revision-1\""
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/trades/TRD-S5-SYNTHETIC/invoice-declarations" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7050000-0000-4000-8000-000000000003' \
  --header 'If-Match: "s5-synthetic-revision-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"invoiceNumber":"INV-S5-SYNTHETIC","declaredAmount":{"amount":"1000.00","currencyCode":"CNY"},"approvedTradeRevisionNumber":1,"invoiceFiles":[{"logicalFileNumber":"FILE-S5-SYNTHETIC","revisionNumber":1,"sha256":"a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a","documentTypeCode":14}],"allocationNumbers":[],"sourceContentsConfirmed":true}'
```

```json
{
  "designOnly": true,
  "service": "trade.funds.v1.ExternalFundsService",
  "method": "CreateInvoiceDeclaration",
  "requestType": "CreateInvoiceDeclarationReqMsg",
  "responseType": "CreateInvoiceDeclarationRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>",
    "idempotency-key": "d7050000-0000-4000-8000-000000000003",
    "if-match": "\"s5-synthetic-revision-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "tradeNumber": "TRD-S5-SYNTHETIC",
    "invoice": {
      "invoiceNumber": "INV-S5-SYNTHETIC",
      "declaredAmount": {
        "amount": "1000.00",
        "currencyCode": "CNY"
      },
      "approvedTradeRevisionNumber": 1,
      "invoiceFiles": [
        {
          "logicalFileNumber": "FILE-S5-SYNTHETIC",
          "revisionNumber": 1,
          "sha256": "a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a",
          "documentTypeCode": 14
        }
      ],
      "allocationNumbers": [],
      "sourceContentsConfirmed": true
    }
  },
  "response": {
    "resource": {
      "invoiceNumber": "INV-S5-SYNTHETIC",
      "tradeNumber": "TRD-S5-SYNTHETIC",
      "declaredAmount": {
        "amount": "1000.00",
        "currencyCode": "CNY"
      },
      "approvedTradeRevisionNumber": 1,
      "status": "FUNDS_TRANSACTION_STATUS_PENDING_APPROVAL",
      "invoiceFiles": [
        {
          "logicalFileNumber": "FILE-S5-SYNTHETIC",
          "revisionNumber": 1,
          "sha256": "a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a",
          "documentTypeCode": 14
        }
      ],
      "missingGateCodes": [
        "FUND_EVIDENCE_MISSING"
      ],
      "etag": "\"s5-synthetic-revision-1\""
    }
  },
  "successTrailers": {}
}
```

## GetInvoiceDeclaration

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s5-synthetic-revision-1"

{
  "invoiceNumber": "INV-S5-SYNTHETIC",
  "tradeNumber": "TRD-S5-SYNTHETIC",
  "declaredAmount": {
    "amount": "1000.00",
    "currencyCode": "CNY"
  },
  "approvedTradeRevisionNumber": 1,
  "status": "FUNDS_TRANSACTION_STATUS_PENDING_APPROVAL",
  "invoiceFiles": [
    {
      "logicalFileNumber": "FILE-S5-SYNTHETIC",
      "revisionNumber": 1,
      "sha256": "a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a",
      "documentTypeCode": 14
    }
  ],
  "missingGateCodes": [
    "FUND_EVIDENCE_MISSING"
  ],
  "etag": "\"s5-synthetic-revision-1\""
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/trades/TRD-S5-SYNTHETIC/invoice-declarations/INV-S5-SYNTHETIC" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.funds.v1.ExternalFundsService",
  "method": "GetInvoiceDeclaration",
  "requestType": "GetInvoiceDeclarationReqMsg",
  "responseType": "GetInvoiceDeclarationRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>"
  },
  "request": {
    "tradeNumber": "TRD-S5-SYNTHETIC",
    "invoiceNumber": "INV-S5-SYNTHETIC"
  },
  "response": {
    "resource": {
      "invoiceNumber": "INV-S5-SYNTHETIC",
      "tradeNumber": "TRD-S5-SYNTHETIC",
      "declaredAmount": {
        "amount": "1000.00",
        "currencyCode": "CNY"
      },
      "approvedTradeRevisionNumber": 1,
      "status": "FUNDS_TRANSACTION_STATUS_PENDING_APPROVAL",
      "invoiceFiles": [
        {
          "logicalFileNumber": "FILE-S5-SYNTHETIC",
          "revisionNumber": 1,
          "sha256": "a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a",
          "documentTypeCode": 14
        }
      ],
      "missingGateCodes": [
        "FUND_EVIDENCE_MISSING"
      ],
      "etag": "\"s5-synthetic-revision-1\""
    }
  },
  "successTrailers": {}
}
```

## GetAgencyServiceFeeSettlement

```http
HTTP/1.1 404 Error
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "urn:export-trade:funds:not_found",
  "title": "真实证据或资源不足，操作未完成",
  "status": 404,
  "detail": "仅合成设计例；没有真实银行接入或成功事实，资金桶及锁额不变。",
  "instance": "/api/v1/trades/TRD-S5-SYNTHETIC/agency-service-fee",
  "errors": [
    {
      "pointer": "/resource",
      "code": "NOT_FOUND",
      "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
    }
  ],
  "outcomeUnknown": false,
  "retryAfterMs": 0
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/trades/TRD-S5-SYNTHETIC/agency-service-fee" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.funds.v1.ExternalFundsService",
  "method": "GetAgencyServiceFeeSettlement",
  "requestType": "GetAgencyServiceFeeSettlementReqMsg",
  "responseType": "GetAgencyServiceFeeSettlementRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>"
  },
  "request": {
    "tradeNumber": "TRD-S5-SYNTHETIC"
  },
  "error": {
    "code": "NOT_FOUND",
    "details": {
      "code": "NOT_FOUND",
      "httpStatus": 404,
      "errors": [
        {
          "pointer": "/resource",
          "code": "NOT_FOUND",
          "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "S5-SYNTHETIC-5"
    }
  }
}
```

## GetFundAllocationContext

```http
HTTP/1.1 404 Error
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "urn:export-trade:funds:not_found",
  "title": "真实证据或资源不足，操作未完成",
  "status": 404,
  "detail": "仅合成设计例；没有真实银行接入或成功事实，资金桶及锁额不变。",
  "instance": "/internal/v1/fund-receipts/FLOW-S5-ABSENT/allocation-context",
  "errors": [
    {
      "pointer": "/resource",
      "code": "NOT_FOUND",
      "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
    }
  ],
  "outcomeUnknown": false,
  "retryAfterMs": 0
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/internal/v1/fund-receipts/FLOW-S5-ABSENT/allocation-context" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.funds.v1.InternalFundsOperationsService",
  "method": "GetFundAllocationContext",
  "requestType": "GetFundAllocationContextReqMsg",
  "responseType": "GetFundAllocationContextRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>"
  },
  "request": {
    "receiptFlowNumber": "FLOW-S5-ABSENT"
  },
  "error": {
    "code": "NOT_FOUND",
    "details": {
      "code": "NOT_FOUND",
      "httpStatus": 404,
      "errors": [
        {
          "pointer": "/resource",
          "code": "NOT_FOUND",
          "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "S5-SYNTHETIC-6"
    }
  }
}
```

## CreateFundAllocation

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "urn:export-trade:funds:fund_evidence_missing",
  "title": "真实证据或资源不足，操作未完成",
  "status": 422,
  "detail": "仅合成设计例；没有真实银行接入或成功事实，资金桶及锁额不变。",
  "instance": "/internal/v1/fund-receipts/FLOW-S5-ABSENT/allocations",
  "errors": [
    {
      "pointer": "/resource",
      "code": "FUND_EVIDENCE_MISSING",
      "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
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
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/fund-receipts/FLOW-S5-ABSENT/allocations" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7050000-0000-4000-8000-000000000007' \
  --header 'If-Match: "s5-synthetic-revision-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"tradeNumber":"TRD-S5-SYNTHETIC","approvedTradeRevisionNumber":1,"allocatedAmount":{"amount":"1000.00","currencyCode":"CNY"},"sourceTypeCode":"invoice","sourceNumber":"INV-S5-SYNTHETIC","reason":"合成结构例，无真实实收不可受理"}'
```

```json
{
  "designOnly": true,
  "service": "trade.funds.v1.InternalFundsOperationsService",
  "method": "CreateFundAllocation",
  "requestType": "CreateFundAllocationReqMsg",
  "responseType": "CreateFundAllocationRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d7050000-0000-4000-8000-000000000007",
    "if-match": "\"s5-synthetic-revision-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "receiptFlowNumber": "FLOW-S5-ABSENT",
    "allocation": {
      "tradeNumber": "TRD-S5-SYNTHETIC",
      "approvedTradeRevisionNumber": 1,
      "allocatedAmount": {
        "amount": "1000.00",
        "currencyCode": "CNY"
      },
      "sourceTypeCode": "invoice",
      "sourceNumber": "INV-S5-SYNTHETIC",
      "reason": "合成结构例，无真实实收不可受理"
    }
  },
  "error": {
    "code": "FAILED_PRECONDITION",
    "details": {
      "code": "FUND_EVIDENCE_MISSING",
      "httpStatus": 422,
      "errors": [
        {
          "pointer": "/resource",
          "code": "FUND_EVIDENCE_MISSING",
          "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "S5-SYNTHETIC-7"
    }
  }
}
```

## GetFundAllocation

```http
HTTP/1.1 404 Error
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "urn:export-trade:funds:not_found",
  "title": "真实证据或资源不足，操作未完成",
  "status": 404,
  "detail": "仅合成设计例；没有真实银行接入或成功事实，资金桶及锁额不变。",
  "instance": "/internal/v1/fund-allocations/ALLOC-S5-SYNTHETIC",
  "errors": [
    {
      "pointer": "/resource",
      "code": "NOT_FOUND",
      "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
    }
  ],
  "outcomeUnknown": false,
  "retryAfterMs": 0
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/internal/v1/fund-allocations/ALLOC-S5-SYNTHETIC" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.funds.v1.InternalFundsOperationsService",
  "method": "GetFundAllocation",
  "requestType": "GetFundAllocationReqMsg",
  "responseType": "GetFundAllocationRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>"
  },
  "request": {
    "allocationNumber": "ALLOC-S5-SYNTHETIC"
  },
  "error": {
    "code": "NOT_FOUND",
    "details": {
      "code": "NOT_FOUND",
      "httpStatus": 404,
      "errors": [
        {
          "pointer": "/resource",
          "code": "NOT_FOUND",
          "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "S5-SYNTHETIC-8"
    }
  }
}
```

## CreateFundAllocationDecision

```http
HTTP/1.1 404 Error
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "urn:export-trade:funds:not_found",
  "title": "真实证据或资源不足，操作未完成",
  "status": 404,
  "detail": "仅合成设计例；没有真实银行接入或成功事实，资金桶及锁额不变。",
  "instance": "/internal/v1/fund-allocations/ALLOC-S5-SYNTHETIC/decisions",
  "errors": [
    {
      "pointer": "/resource",
      "code": "NOT_FOUND",
      "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
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
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/fund-allocations/ALLOC-S5-SYNTHETIC/decisions" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7050000-0000-4000-8000-000000000009' \
  --header 'If-Match: "s5-synthetic-revision-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"outcome":"DECISION_OUTCOME_RETURN","reason":"缺真实银行及商业证据，退回补正；不推进资金状态","evidence":[]}'
```

```json
{
  "designOnly": true,
  "service": "trade.funds.v1.InternalFundsOperationsService",
  "method": "CreateFundAllocationDecision",
  "requestType": "CreateFundAllocationDecisionReqMsg",
  "responseType": "CreateFundAllocationDecisionRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d7050000-0000-4000-8000-000000000009",
    "if-match": "\"s5-synthetic-revision-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "allocationNumber": "ALLOC-S5-SYNTHETIC",
    "decision": {
      "outcome": "DECISION_OUTCOME_RETURN",
      "reason": "缺真实银行及商业证据，退回补正；不推进资金状态",
      "evidence": []
    }
  },
  "error": {
    "code": "NOT_FOUND",
    "details": {
      "code": "NOT_FOUND",
      "httpStatus": 404,
      "errors": [
        {
          "pointer": "/resource",
          "code": "NOT_FOUND",
          "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "S5-SYNTHETIC-9"
    }
  }
}
```

## CreateBankReceiptEvidence

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "urn:export-trade:funds:bank_evidence_required",
  "title": "真实证据或资源不足，操作未完成",
  "status": 422,
  "detail": "仅合成设计例；没有真实银行接入或成功事实，资金桶及锁额不变。",
  "instance": "/internal/v1/bank-receipt-evidence",
  "errors": [
    {
      "pointer": "/resource",
      "code": "BANK_EVIDENCE_REQUIRED",
      "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
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
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/bank-receipt-evidence" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7050000-0000-4000-8000-000000000010' \
  --header 'If-Match: "s5-synthetic-revision-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"accountNumber":"BANK-S5-SYNTHETIC","accountFingerprint":"SYNTHETIC-NOT-A-BANK-IDENTITY","bankEventKey":"SYNTHETIC-NOT-A-BANK-EVENT","amount":{"amount":"1000.00","currencyCode":"CNY"},"occurredAt":"2026-10-25T01:00:00Z","valueDate":"2026-10-25T01:00:00Z","sourceEvidence":{"logicalFileNumber":"FILE-S5-SYNTHETIC","revisionNumber":1,"sha256":"a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a","documentTypeCode":14},"evidenceHash":"a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a","manualEvidenceIntake":true,"eventType":"BANK_EVIDENCE_KIND_CARGO_RECEIPT","payerPartyRoleCode":4,"independentPayment":false}'
```

```json
{
  "designOnly": true,
  "service": "trade.funds.v1.InternalFundsOperationsService",
  "method": "CreateBankReceiptEvidence",
  "requestType": "CreateBankReceiptEvidenceReqMsg",
  "responseType": "CreateBankReceiptEvidenceRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d7050000-0000-4000-8000-000000000010",
    "if-match": "\"s5-synthetic-revision-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "evidence": {
      "accountNumber": "BANK-S5-SYNTHETIC",
      "accountFingerprint": "SYNTHETIC-NOT-A-BANK-IDENTITY",
      "bankEventKey": "SYNTHETIC-NOT-A-BANK-EVENT",
      "amount": {
        "amount": "1000.00",
        "currencyCode": "CNY"
      },
      "occurredAt": "2026-10-25T01:00:00Z",
      "valueDate": "2026-10-25T01:00:00Z",
      "sourceEvidence": {
        "logicalFileNumber": "FILE-S5-SYNTHETIC",
        "revisionNumber": 1,
        "sha256": "a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a",
        "documentTypeCode": 14
      },
      "evidenceHash": "a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a",
      "manualEvidenceIntake": true,
      "eventType": "BANK_EVIDENCE_KIND_CARGO_RECEIPT",
      "payerPartyRoleCode": 4,
      "independentPayment": false
    }
  },
  "error": {
    "code": "FAILED_PRECONDITION",
    "details": {
      "code": "BANK_EVIDENCE_REQUIRED",
      "httpStatus": 422,
      "errors": [
        {
          "pointer": "/resource",
          "code": "BANK_EVIDENCE_REQUIRED",
          "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "S5-SYNTHETIC-10"
    }
  }
}
```

## GetFundsReviewContext

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s5-synthetic-revision-1"

{
  "tradeNumber": "TRD-S5-SYNTHETIC",
  "approvedTradeRevisionNumber": 1,
  "invoices": [
    {
      "invoiceNumber": "INV-S5-SYNTHETIC",
      "tradeNumber": "TRD-S5-SYNTHETIC",
      "declaredAmount": {
        "amount": "1000.00",
        "currencyCode": "CNY"
      },
      "approvedTradeRevisionNumber": 1,
      "status": "FUNDS_TRANSACTION_STATUS_PENDING_APPROVAL",
      "invoiceFiles": [
        {
          "logicalFileNumber": "FILE-S5-SYNTHETIC",
          "revisionNumber": 1,
          "sha256": "a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a",
          "documentTypeCode": 14
        }
      ],
      "missingGateCodes": [
        "FUND_EVIDENCE_MISSING"
      ],
      "etag": "\"s5-synthetic-revision-1\""
    }
  ],
  "receipts": [],
  "allocations": [],
  "missingGateCodes": [
    "BANK_AVAILABILITY_EVIDENCE_REQUIRED"
  ],
  "openDifferenceNumbers": [],
  "etag": "\"s5-synthetic-revision-1\""
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S5-SYNTHETIC/funds-review-context" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.funds.v1.InternalFundsOperationsService",
  "method": "GetFundsReviewContext",
  "requestType": "GetFundsReviewContextReqMsg",
  "responseType": "GetFundsReviewContextRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>"
  },
  "request": {
    "tradeNumber": "TRD-S5-SYNTHETIC"
  },
  "response": {
    "resource": {
      "tradeNumber": "TRD-S5-SYNTHETIC",
      "approvedTradeRevisionNumber": 1,
      "invoices": [
        {
          "invoiceNumber": "INV-S5-SYNTHETIC",
          "tradeNumber": "TRD-S5-SYNTHETIC",
          "declaredAmount": {
            "amount": "1000.00",
            "currencyCode": "CNY"
          },
          "approvedTradeRevisionNumber": 1,
          "status": "FUNDS_TRANSACTION_STATUS_PENDING_APPROVAL",
          "invoiceFiles": [
            {
              "logicalFileNumber": "FILE-S5-SYNTHETIC",
              "revisionNumber": 1,
              "sha256": "a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a",
              "documentTypeCode": 14
            }
          ],
          "missingGateCodes": [
            "FUND_EVIDENCE_MISSING"
          ],
          "etag": "\"s5-synthetic-revision-1\""
        }
      ],
      "receipts": [],
      "allocations": [],
      "missingGateCodes": [
        "BANK_AVAILABILITY_EVIDENCE_REQUIRED"
      ],
      "openDifferenceNumbers": [],
      "etag": "\"s5-synthetic-revision-1\""
    }
  },
  "successTrailers": {}
}
```

## CreateTradeFundsVerification

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
ETag: "s5-synthetic-revision-1"
Location: /internal/v1/trades/TRD-S5-SYNTHETIC/funds-verifications/S5-SYNTHETIC-ACCEPTANCE

{
  "transactionNumber": "VERIFY-S5-SYNTHETIC",
  "tradeNumber": "TRD-S5-SYNTHETIC",
  "status": "FUNDS_TRANSACTION_STATUS_RETURNED",
  "verifiedAmount": {
    "amount": "0.00",
    "currencyCode": "CNY"
  },
  "verificationScopeHash": "a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a",
  "missingGateCodes": [
    "FUND_EVIDENCE_MISSING"
  ],
  "etag": "\"s5-synthetic-revision-1\""
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S5-SYNTHETIC/funds-verifications" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7050000-0000-4000-8000-000000000012' \
  --header 'If-Match: "s5-synthetic-revision-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"approvedTradeRevisionNumber":1,"invoiceNumbers":["INV-S5-SYNTHETIC"],"allocationNumbers":[],"verificationEvidence":[],"outcome":"DECISION_OUTCOME_RETURN","reason":"缺真实银行及商业证据，退回补正；不推进资金状态"}'
```

```json
{
  "designOnly": true,
  "service": "trade.funds.v1.InternalFundsOperationsService",
  "method": "CreateTradeFundsVerification",
  "requestType": "CreateTradeFundsVerificationReqMsg",
  "responseType": "CreateTradeFundsVerificationRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d7050000-0000-4000-8000-000000000012",
    "if-match": "\"s5-synthetic-revision-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "tradeNumber": "TRD-S5-SYNTHETIC",
    "verification": {
      "approvedTradeRevisionNumber": 1,
      "invoiceNumbers": [
        "INV-S5-SYNTHETIC"
      ],
      "allocationNumbers": [],
      "verificationEvidence": [],
      "outcome": "DECISION_OUTCOME_RETURN",
      "reason": "缺真实银行及商业证据，退回补正；不推进资金状态"
    }
  },
  "response": {
    "resource": {
      "transactionNumber": "VERIFY-S5-SYNTHETIC",
      "tradeNumber": "TRD-S5-SYNTHETIC",
      "status": "FUNDS_TRANSACTION_STATUS_RETURNED",
      "verifiedAmount": {
        "amount": "0.00",
        "currencyCode": "CNY"
      },
      "verificationScopeHash": "a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a",
      "missingGateCodes": [
        "FUND_EVIDENCE_MISSING"
      ],
      "etag": "\"s5-synthetic-revision-1\""
    }
  },
  "successTrailers": {}
}
```

## CreateFundsAvailabilityRelease

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "urn:export-trade:funds:bank_availability_evidence_required",
  "title": "真实证据或资源不足，操作未完成",
  "status": 422,
  "detail": "仅合成设计例；没有真实银行接入或成功事实，资金桶及锁额不变。",
  "instance": "/internal/v1/trades/TRD-S5-SYNTHETIC/fund-releases",
  "errors": [
    {
      "pointer": "/resource",
      "code": "BANK_AVAILABILITY_EVIDENCE_REQUIRED",
      "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
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
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S5-SYNTHETIC/fund-releases" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7050000-0000-4000-8000-000000000013' \
  --header 'If-Match: "s5-synthetic-revision-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"receiptFlowNumber":"FLOW-S5-ABSENT","allocationNumber":"ALLOC-S5-SYNTHETIC","releaseAmount":{"amount":"500.00","currencyCode":"CNY"},"bankAvailableEvidence":{"logicalFileNumber":"FILE-S5-SYNTHETIC","revisionNumber":1,"sha256":"a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a","documentTypeCode":14},"bankAvailableEvidenceHash":"a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a","verificationTransactionNumber":"VERIFY-S5-SYNTHETIC","reason":"原创合成文件不是银行可用证据，应拒绝"}'
```

```json
{
  "designOnly": true,
  "service": "trade.funds.v1.InternalFundsOperationsService",
  "method": "CreateFundsAvailabilityRelease",
  "requestType": "CreateFundsAvailabilityReleaseReqMsg",
  "responseType": "CreateFundsAvailabilityReleaseRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d7050000-0000-4000-8000-000000000013",
    "if-match": "\"s5-synthetic-revision-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "tradeNumber": "TRD-S5-SYNTHETIC",
    "release": {
      "receiptFlowNumber": "FLOW-S5-ABSENT",
      "allocationNumber": "ALLOC-S5-SYNTHETIC",
      "releaseAmount": {
        "amount": "500.00",
        "currencyCode": "CNY"
      },
      "bankAvailableEvidence": {
        "logicalFileNumber": "FILE-S5-SYNTHETIC",
        "revisionNumber": 1,
        "sha256": "a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a",
        "documentTypeCode": 14
      },
      "bankAvailableEvidenceHash": "a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a",
      "verificationTransactionNumber": "VERIFY-S5-SYNTHETIC",
      "reason": "原创合成文件不是银行可用证据，应拒绝"
    }
  },
  "error": {
    "code": "FAILED_PRECONDITION",
    "details": {
      "code": "BANK_AVAILABILITY_EVIDENCE_REQUIRED",
      "httpStatus": 422,
      "errors": [
        {
          "pointer": "/resource",
          "code": "BANK_AVAILABILITY_EVIDENCE_REQUIRED",
          "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "S5-SYNTHETIC-13"
    }
  }
}
```

## CreateSettlement

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "urn:export-trade:funds:payment_gate_incomplete",
  "title": "真实证据或资源不足，操作未完成",
  "status": 422,
  "detail": "仅合成设计例；没有真实银行接入或成功事实，资金桶及锁额不变。",
  "instance": "/internal/v1/trades/TRD-S5-SYNTHETIC/settlements",
  "errors": [
    {
      "pointer": "/resource",
      "code": "PAYMENT_GATE_INCOMPLETE",
      "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
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
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S5-SYNTHETIC/settlements" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7050000-0000-4000-8000-000000000014' \
  --header 'If-Match: "s5-synthetic-revision-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"paymentBranch":"PAYMENT_BRANCH_PREPAYMENT","approvedTradeRevisionNumber":1,"invoiceNumbers":["INV-S5-SYNTHETIC"],"allocationNumbers":[],"payableAmount":{"amount":"1000.00","currencyCode":"CNY"},"alreadyPaidAmount":{"amount":"0.00","currencyCode":"CNY"},"authorizedDeductions":[],"proposedAmount":{"amount":"1000.00","currencyCode":"CNY"},"supplierConfirmation":{"logicalFileNumber":"FILE-S5-SYNTHETIC","revisionNumber":1,"sha256":"a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a","documentTypeCode":14},"requiredEvidence":[],"contractReferences":[],"ruleVersion":"s5-design-1"}'
```

```json
{
  "designOnly": true,
  "service": "trade.funds.v1.InternalFundsOperationsService",
  "method": "CreateSettlement",
  "requestType": "CreateSettlementReqMsg",
  "responseType": "CreateSettlementRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d7050000-0000-4000-8000-000000000014",
    "if-match": "\"s5-synthetic-revision-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "tradeNumber": "TRD-S5-SYNTHETIC",
    "settlement": {
      "paymentBranch": "PAYMENT_BRANCH_PREPAYMENT",
      "approvedTradeRevisionNumber": 1,
      "invoiceNumbers": [
        "INV-S5-SYNTHETIC"
      ],
      "allocationNumbers": [],
      "payableAmount": {
        "amount": "1000.00",
        "currencyCode": "CNY"
      },
      "alreadyPaidAmount": {
        "amount": "0.00",
        "currencyCode": "CNY"
      },
      "authorizedDeductions": [],
      "proposedAmount": {
        "amount": "1000.00",
        "currencyCode": "CNY"
      },
      "supplierConfirmation": {
        "logicalFileNumber": "FILE-S5-SYNTHETIC",
        "revisionNumber": 1,
        "sha256": "a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a",
        "documentTypeCode": 14
      },
      "requiredEvidence": [],
      "contractReferences": [],
      "ruleVersion": "s5-design-1"
    }
  },
  "error": {
    "code": "FAILED_PRECONDITION",
    "details": {
      "code": "PAYMENT_GATE_INCOMPLETE",
      "httpStatus": 422,
      "errors": [
        {
          "pointer": "/resource",
          "code": "PAYMENT_GATE_INCOMPLETE",
          "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "S5-SYNTHETIC-14"
    }
  }
}
```

## GetSettlement

```http
HTTP/1.1 404 Error
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "urn:export-trade:funds:not_found",
  "title": "真实证据或资源不足，操作未完成",
  "status": 404,
  "detail": "仅合成设计例；没有真实银行接入或成功事实，资金桶及锁额不变。",
  "instance": "/internal/v1/settlements/PAY-S5-SYNTHETIC",
  "errors": [
    {
      "pointer": "/resource",
      "code": "NOT_FOUND",
      "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
    }
  ],
  "outcomeUnknown": false,
  "retryAfterMs": 0
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/internal/v1/settlements/PAY-S5-SYNTHETIC" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.funds.v1.InternalFundsOperationsService",
  "method": "GetSettlement",
  "requestType": "GetSettlementReqMsg",
  "responseType": "GetSettlementRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>"
  },
  "request": {
    "transactionNumber": "PAY-S5-SYNTHETIC"
  },
  "error": {
    "code": "NOT_FOUND",
    "details": {
      "code": "NOT_FOUND",
      "httpStatus": 404,
      "errors": [
        {
          "pointer": "/resource",
          "code": "NOT_FOUND",
          "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "S5-SYNTHETIC-15"
    }
  }
}
```

## CreateSettlementDecision

```http
HTTP/1.1 404 Error
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "urn:export-trade:funds:not_found",
  "title": "真实证据或资源不足，操作未完成",
  "status": 404,
  "detail": "仅合成设计例；没有真实银行接入或成功事实，资金桶及锁额不变。",
  "instance": "/internal/v1/settlements/PAY-S5-SYNTHETIC/decisions",
  "errors": [
    {
      "pointer": "/resource",
      "code": "NOT_FOUND",
      "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
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
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/settlements/PAY-S5-SYNTHETIC/decisions" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7050000-0000-4000-8000-000000000016' \
  --header 'If-Match: "s5-synthetic-revision-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"outcome":"DECISION_OUTCOME_RETURN","reason":"缺真实银行及商业证据，退回补正；不推进资金状态","verifiedEvidence":[]}'
```

```json
{
  "designOnly": true,
  "service": "trade.funds.v1.InternalFundsOperationsService",
  "method": "CreateSettlementDecision",
  "requestType": "CreateSettlementDecisionReqMsg",
  "responseType": "CreateSettlementDecisionRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d7050000-0000-4000-8000-000000000016",
    "if-match": "\"s5-synthetic-revision-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "transactionNumber": "PAY-S5-SYNTHETIC",
    "decision": {
      "outcome": "DECISION_OUTCOME_RETURN",
      "reason": "缺真实银行及商业证据，退回补正；不推进资金状态",
      "verifiedEvidence": []
    }
  },
  "error": {
    "code": "NOT_FOUND",
    "details": {
      "code": "NOT_FOUND",
      "httpStatus": 404,
      "errors": [
        {
          "pointer": "/resource",
          "code": "NOT_FOUND",
          "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "S5-SYNTHETIC-16"
    }
  }
}
```

## CreatePaymentApproval

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "urn:export-trade:funds:beneficiary_unverified",
  "title": "真实证据或资源不足，操作未完成",
  "status": 422,
  "detail": "仅合成设计例；没有真实银行接入或成功事实，资金桶及锁额不变。",
  "instance": "/internal/v1/settlements/PAY-S5-SYNTHETIC/payment-approvals",
  "errors": [
    {
      "pointer": "/resource",
      "code": "BENEFICIARY_UNVERIFIED",
      "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
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
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/settlements/PAY-S5-SYNTHETIC/payment-approvals" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7050000-0000-4000-8000-000000000017' \
  --header 'If-Match: "s5-synthetic-revision-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"amount":{"amount":"1000.00","currencyCode":"CNY"},"beneficiaryAccountNumber":"BENEFICIARY-S5-UNVERIFIED","beneficiaryAccountFingerprint":"SYNTHETIC-UNVERIFIED","beneficiaryAccountRevisionNumber":1,"allocationNumbers":[],"approvalEvidence":[],"reason":"缺有效结算及受益方核实，不得锁额"}'
```

```json
{
  "designOnly": true,
  "service": "trade.funds.v1.InternalFundsOperationsService",
  "method": "CreatePaymentApproval",
  "requestType": "CreatePaymentApprovalReqMsg",
  "responseType": "CreatePaymentApprovalRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d7050000-0000-4000-8000-000000000017",
    "if-match": "\"s5-synthetic-revision-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "transactionNumber": "PAY-S5-SYNTHETIC",
    "approval": {
      "amount": {
        "amount": "1000.00",
        "currencyCode": "CNY"
      },
      "beneficiaryAccountNumber": "BENEFICIARY-S5-UNVERIFIED",
      "beneficiaryAccountFingerprint": "SYNTHETIC-UNVERIFIED",
      "beneficiaryAccountRevisionNumber": 1,
      "allocationNumbers": [],
      "approvalEvidence": [],
      "reason": "缺有效结算及受益方核实，不得锁额"
    }
  },
  "error": {
    "code": "FAILED_PRECONDITION",
    "details": {
      "code": "BENEFICIARY_UNVERIFIED",
      "httpStatus": 422,
      "errors": [
        {
          "pointer": "/resource",
          "code": "BENEFICIARY_UNVERIFIED",
          "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "S5-SYNTHETIC-17"
    }
  }
}
```

## CreatePaymentExecutionIntent

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "urn:export-trade:funds:bank_evidence_required",
  "title": "真实证据或资源不足，操作未完成",
  "status": 422,
  "detail": "仅合成设计例；没有真实银行接入或成功事实，资金桶及锁额不变。",
  "instance": "/internal/v1/payment-transactions/PAY-S5-SYNTHETIC/execution-intents",
  "errors": [
    {
      "pointer": "/resource",
      "code": "BANK_EVIDENCE_REQUIRED",
      "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
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
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/payment-transactions/PAY-S5-SYNTHETIC/execution-intents" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7050000-0000-4000-8000-000000000018' \
  --header 'If-Match: "s5-synthetic-revision-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"executionIntentReference":"INTENT-S5-SYNTHETIC","reason":"无真实银行适配器，不可执行"}'
```

```json
{
  "designOnly": true,
  "service": "trade.funds.v1.InternalFundsOperationsService",
  "method": "CreatePaymentExecutionIntent",
  "requestType": "CreatePaymentExecutionIntentReqMsg",
  "responseType": "CreatePaymentExecutionIntentRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d7050000-0000-4000-8000-000000000018",
    "if-match": "\"s5-synthetic-revision-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "transactionNumber": "PAY-S5-SYNTHETIC",
    "execution": {
      "executionIntentReference": "INTENT-S5-SYNTHETIC",
      "reason": "无真实银行适配器，不可执行"
    }
  },
  "error": {
    "code": "FAILED_PRECONDITION",
    "details": {
      "code": "BANK_EVIDENCE_REQUIRED",
      "httpStatus": 422,
      "errors": [
        {
          "pointer": "/resource",
          "code": "BANK_EVIDENCE_REQUIRED",
          "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "S5-SYNTHETIC-18"
    }
  }
}
```

## GetPaymentExecution

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s5-synthetic-revision-1"

{
  "transactionNumber": "PAY-S5-SYNTHETIC",
  "amount": {
    "amount": "1000.00",
    "currencyCode": "CNY"
  },
  "executionStatus": "EXECUTION_STATUS_NOT_SUBMITTED",
  "transactionStatus": "FUNDS_TRANSACTION_STATUS_DRAFT",
  "balances": {
    "restricted": {
      "amount": "0.00",
      "currencyCode": "CNY"
    },
    "available": {
      "amount": "0.00",
      "currencyCode": "CNY"
    },
    "paymentLocked": {
      "amount": "0.00",
      "currencyCode": "CNY"
    }
  },
  "attempts": [],
  "missingEvidenceCodes": [
    "BANK_EVIDENCE_REQUIRED"
  ],
  "acceptanceId": "S5-INTERNAL-SYNTHETIC-ONLY",
  "etag": "\"s5-synthetic-revision-1\""
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/internal/v1/payment-transactions/PAY-S5-SYNTHETIC/execution" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.funds.v1.InternalFundsOperationsService",
  "method": "GetPaymentExecution",
  "requestType": "GetPaymentExecutionReqMsg",
  "responseType": "GetPaymentExecutionRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>"
  },
  "request": {
    "transactionNumber": "PAY-S5-SYNTHETIC"
  },
  "response": {
    "resource": {
      "transactionNumber": "PAY-S5-SYNTHETIC",
      "amount": {
        "amount": "1000.00",
        "currencyCode": "CNY"
      },
      "executionStatus": "EXECUTION_STATUS_NOT_SUBMITTED",
      "transactionStatus": "FUNDS_TRANSACTION_STATUS_DRAFT",
      "balances": {
        "restricted": {
          "amount": "0.00",
          "currencyCode": "CNY"
        },
        "available": {
          "amount": "0.00",
          "currencyCode": "CNY"
        },
        "paymentLocked": {
          "amount": "0.00",
          "currencyCode": "CNY"
        }
      },
      "attempts": [],
      "missingEvidenceCodes": [
        "BANK_EVIDENCE_REQUIRED"
      ],
      "acceptanceId": "S5-INTERNAL-SYNTHETIC-ONLY",
      "etag": "\"s5-synthetic-revision-1\""
    }
  },
  "successTrailers": {}
}
```

## CreateBeneficiaryReceiptConfirmation

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "urn:export-trade:funds:payee_receipt_unverified",
  "title": "真实证据或资源不足，操作未完成",
  "status": 422,
  "detail": "仅合成设计例；没有真实银行接入或成功事实，资金桶及锁额不变。",
  "instance": "/api/v1/payment-transactions/PAY-S5-SYNTHETIC/beneficiary-receipt-confirmations",
  "errors": [
    {
      "pointer": "/resource",
      "code": "PAYEE_RECEIPT_UNVERIFIED",
      "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
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
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/payment-transactions/PAY-S5-SYNTHETIC/beneficiary-receipt-confirmations" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7050000-0000-4000-8000-000000000020' \
  --header 'If-Match: "s5-synthetic-revision-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"receivedAmount":{"amount":"1000.00","currencyCode":"CNY"},"receivedAt":"2026-10-25T01:00:00Z","bankReceiptEvidence":{"logicalFileNumber":"FILE-S5-SYNTHETIC","revisionNumber":1,"sha256":"a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a","documentTypeCode":14},"bankReference":"SYNTHETIC-NOT-ARRIVAL","reason":"合成文件不证明A到账"}'
```

```json
{
  "designOnly": true,
  "service": "trade.funds.v1.ExternalFundsService",
  "method": "CreateBeneficiaryReceiptConfirmation",
  "requestType": "CreateBeneficiaryReceiptConfirmationReqMsg",
  "responseType": "CreateBeneficiaryReceiptConfirmationRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>",
    "idempotency-key": "d7050000-0000-4000-8000-000000000020",
    "if-match": "\"s5-synthetic-revision-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "transactionNumber": "PAY-S5-SYNTHETIC",
    "confirmation": {
      "receivedAmount": {
        "amount": "1000.00",
        "currencyCode": "CNY"
      },
      "receivedAt": "2026-10-25T01:00:00Z",
      "bankReceiptEvidence": {
        "logicalFileNumber": "FILE-S5-SYNTHETIC",
        "revisionNumber": 1,
        "sha256": "a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a",
        "documentTypeCode": 14
      },
      "bankReference": "SYNTHETIC-NOT-ARRIVAL",
      "reason": "合成文件不证明A到账"
    }
  },
  "error": {
    "code": "FAILED_PRECONDITION",
    "details": {
      "code": "PAYEE_RECEIPT_UNVERIFIED",
      "httpStatus": 422,
      "errors": [
        {
          "pointer": "/resource",
          "code": "PAYEE_RECEIPT_UNVERIFIED",
          "detail": "补充真实证据后按原号查询/补正，不盲重新付款"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "S5-SYNTHETIC-20"
    }
  }
}
```

## CreateFundsReconciliationDifference

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
ETag: "s5-synthetic-revision-1"
Location: /internal/v1/funds-reconciliation-differences/S5-SYNTHETIC-ACCEPTANCE

{
  "differenceNumber": "DIFF-S5-SYNTHETIC",
  "differenceType": "DIFFERENCE_TYPE_STATUS",
  "status": "DIFFERENCE_STATUS_OPEN",
  "bankEventKey": "SYNTHETIC-UNVERIFIED",
  "transactionNumber": "PAY-S5-SYNTHETIC",
  "ownerReference": "SYNTHETIC-INTERNAL-OPERATOR",
  "evidence": [
    {
      "logicalFileNumber": "FILE-S5-SYNTHETIC",
      "revisionNumber": 1,
      "sha256": "a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a",
      "documentTypeCode": 14
    }
  ],
  "etag": "\"s5-synthetic-revision-1\""
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/funds-reconciliation-differences" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7050000-0000-4000-8000-000000000021' \
  --header 'If-Match: "s5-synthetic-revision-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"differenceType":"DIFFERENCE_TYPE_STATUS","bankAccountNumber":"BANK-S5-SYNTHETIC","bankEventKey":"SYNTHETIC-UNVERIFIED","transactionNumber":"PAY-S5-SYNTHETIC","evidence":[{"logicalFileNumber":"FILE-S5-SYNTHETIC","revisionNumber":1,"sha256":"a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a","documentTypeCode":14}],"reason":"内部合成差异，无银行金额，未知侧省略而非0"}'
```

```json
{
  "designOnly": true,
  "service": "trade.funds.v1.InternalFundsOperationsService",
  "method": "CreateFundsReconciliationDifference",
  "requestType": "CreateFundsReconciliationDifferenceReqMsg",
  "responseType": "CreateFundsReconciliationDifferenceRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d7050000-0000-4000-8000-000000000021",
    "if-match": "\"s5-synthetic-revision-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "difference": {
      "differenceType": "DIFFERENCE_TYPE_STATUS",
      "bankAccountNumber": "BANK-S5-SYNTHETIC",
      "bankEventKey": "SYNTHETIC-UNVERIFIED",
      "transactionNumber": "PAY-S5-SYNTHETIC",
      "evidence": [
        {
          "logicalFileNumber": "FILE-S5-SYNTHETIC",
          "revisionNumber": 1,
          "sha256": "a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a",
          "documentTypeCode": 14
        }
      ],
      "reason": "内部合成差异，无银行金额，未知侧省略而非0"
    }
  },
  "response": {
    "resource": {
      "differenceNumber": "DIFF-S5-SYNTHETIC",
      "differenceType": "DIFFERENCE_TYPE_STATUS",
      "status": "DIFFERENCE_STATUS_OPEN",
      "bankEventKey": "SYNTHETIC-UNVERIFIED",
      "transactionNumber": "PAY-S5-SYNTHETIC",
      "ownerReference": "SYNTHETIC-INTERNAL-OPERATOR",
      "evidence": [
        {
          "logicalFileNumber": "FILE-S5-SYNTHETIC",
          "revisionNumber": 1,
          "sha256": "a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a",
          "documentTypeCode": 14
        }
      ],
      "etag": "\"s5-synthetic-revision-1\""
    }
  },
  "successTrailers": {}
}
```

## GetFundsReconciliationDifference

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s5-synthetic-revision-1"

{
  "differenceNumber": "DIFF-S5-SYNTHETIC",
  "differenceType": "DIFFERENCE_TYPE_STATUS",
  "status": "DIFFERENCE_STATUS_OPEN",
  "bankEventKey": "SYNTHETIC-UNVERIFIED",
  "transactionNumber": "PAY-S5-SYNTHETIC",
  "ownerReference": "SYNTHETIC-INTERNAL-OPERATOR",
  "evidence": [
    {
      "logicalFileNumber": "FILE-S5-SYNTHETIC",
      "revisionNumber": 1,
      "sha256": "a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a",
      "documentTypeCode": 14
    }
  ],
  "etag": "\"s5-synthetic-revision-1\""
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/internal/v1/funds-reconciliation-differences/DIFF-S5-SYNTHETIC" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```json
{
  "designOnly": true,
  "service": "trade.funds.v1.InternalFundsOperationsService",
  "method": "GetFundsReconciliationDifference",
  "requestType": "GetFundsReconciliationDifferenceReqMsg",
  "responseType": "GetFundsReconciliationDifferenceRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>"
  },
  "request": {
    "differenceNumber": "DIFF-S5-SYNTHETIC"
  },
  "response": {
    "resource": {
      "differenceNumber": "DIFF-S5-SYNTHETIC",
      "differenceType": "DIFFERENCE_TYPE_STATUS",
      "status": "DIFFERENCE_STATUS_OPEN",
      "bankEventKey": "SYNTHETIC-UNVERIFIED",
      "transactionNumber": "PAY-S5-SYNTHETIC",
      "ownerReference": "SYNTHETIC-INTERNAL-OPERATOR",
      "evidence": [
        {
          "logicalFileNumber": "FILE-S5-SYNTHETIC",
          "revisionNumber": 1,
          "sha256": "a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a",
          "documentTypeCode": 14
        }
      ],
      "etag": "\"s5-synthetic-revision-1\""
    }
  },
  "successTrailers": {}
}
```

## CreateFundsDifferenceDisposition

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
ETag: "s5-synthetic-revision-1"
Location: /internal/v1/funds-reconciliation-differences/DIFF-S5-SYNTHETIC/dispositions/S5-SYNTHETIC-ACCEPTANCE

{
  "differenceNumber": "DIFF-S5-SYNTHETIC",
  "differenceType": "DIFFERENCE_TYPE_STATUS",
  "status": "DIFFERENCE_STATUS_PROCESSING",
  "bankEventKey": "SYNTHETIC-UNVERIFIED",
  "transactionNumber": "PAY-S5-SYNTHETIC",
  "ownerReference": "SYNTHETIC-INTERNAL-OPERATOR",
  "evidence": [
    {
      "logicalFileNumber": "FILE-S5-SYNTHETIC",
      "revisionNumber": 1,
      "sha256": "a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a",
      "documentTypeCode": 14
    }
  ],
  "etag": "\"s5-synthetic-revision-1\""
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/funds-reconciliation-differences/DIFF-S5-SYNTHETIC/dispositions" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7050000-0000-4000-8000-000000000023' \
  --header 'If-Match: "s5-synthetic-revision-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"reason":"请求补充真实证据，不改余额、不关闭差异","evidence":[{"logicalFileNumber":"FILE-S5-SYNTHETIC","revisionNumber":1,"sha256":"a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a","documentTypeCode":14}]}'
```

```json
{
  "designOnly": true,
  "service": "trade.funds.v1.InternalFundsOperationsService",
  "method": "CreateFundsDifferenceDisposition",
  "requestType": "CreateFundsDifferenceDispositionReqMsg",
  "responseType": "CreateFundsDifferenceDispositionRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d7050000-0000-4000-8000-000000000023",
    "if-match": "\"s5-synthetic-revision-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "differenceNumber": "DIFF-S5-SYNTHETIC",
    "disposition": {
      "reason": "请求补充真实证据，不改余额、不关闭差异",
      "evidence": [
        {
          "logicalFileNumber": "FILE-S5-SYNTHETIC",
          "revisionNumber": 1,
          "sha256": "a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a",
          "documentTypeCode": 14
        }
      ]
    }
  },
  "response": {
    "resource": {
      "differenceNumber": "DIFF-S5-SYNTHETIC",
      "differenceType": "DIFFERENCE_TYPE_STATUS",
      "status": "DIFFERENCE_STATUS_PROCESSING",
      "bankEventKey": "SYNTHETIC-UNVERIFIED",
      "transactionNumber": "PAY-S5-SYNTHETIC",
      "ownerReference": "SYNTHETIC-INTERNAL-OPERATOR",
      "evidence": [
        {
          "logicalFileNumber": "FILE-S5-SYNTHETIC",
          "revisionNumber": 1,
          "sha256": "a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a",
          "documentTypeCode": 14
        }
      ],
      "etag": "\"s5-synthetic-revision-1\""
    }
  },
  "successTrailers": {}
}
```

## CreateFundsDifferenceReview

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
ETag: "s5-synthetic-revision-1"
Location: /internal/v1/funds-reconciliation-differences/DIFF-S5-SYNTHETIC/reviews/S5-SYNTHETIC-ACCEPTANCE

{
  "differenceNumber": "DIFF-S5-SYNTHETIC",
  "differenceType": "DIFFERENCE_TYPE_STATUS",
  "status": "DIFFERENCE_STATUS_PROCESSING",
  "bankEventKey": "SYNTHETIC-UNVERIFIED",
  "transactionNumber": "PAY-S5-SYNTHETIC",
  "ownerReference": "SYNTHETIC-INTERNAL-OPERATOR",
  "evidence": [
    {
      "logicalFileNumber": "FILE-S5-SYNTHETIC",
      "revisionNumber": 1,
      "sha256": "a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a",
      "documentTypeCode": 14
    }
  ],
  "etag": "\"s5-synthetic-revision-1\"",
  "reviewOutcome": "DECISION_OUTCOME_RETURN"
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/funds-reconciliation-differences/DIFF-S5-SYNTHETIC/reviews" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7050000-0000-4000-8000-000000000024' \
  --header 'If-Match: "s5-synthetic-revision-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"outcome":"DECISION_OUTCOME_RETURN","reason":"缺真实银行及商业证据，退回补正；不推进资金状态","evidence":[]}'
```

```json
{
  "designOnly": true,
  "service": "trade.funds.v1.InternalFundsOperationsService",
  "method": "CreateFundsDifferenceReview",
  "requestType": "CreateFundsDifferenceReviewReqMsg",
  "responseType": "CreateFundsDifferenceReviewRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d7050000-0000-4000-8000-000000000024",
    "if-match": "\"s5-synthetic-revision-1\"",
    "confirmation-id": "<INVALID-SYNTHETIC-CONFIRMATION>"
  },
  "request": {
    "differenceNumber": "DIFF-S5-SYNTHETIC",
    "review": {
      "outcome": "DECISION_OUTCOME_RETURN",
      "reason": "缺真实银行及商业证据，退回补正；不推进资金状态",
      "evidence": []
    }
  },
  "response": {
    "resource": {
      "differenceNumber": "DIFF-S5-SYNTHETIC",
      "differenceType": "DIFFERENCE_TYPE_STATUS",
      "status": "DIFFERENCE_STATUS_PROCESSING",
      "bankEventKey": "SYNTHETIC-UNVERIFIED",
      "transactionNumber": "PAY-S5-SYNTHETIC",
      "ownerReference": "SYNTHETIC-INTERNAL-OPERATOR",
      "evidence": [
        {
          "logicalFileNumber": "FILE-S5-SYNTHETIC",
          "revisionNumber": 1,
          "sha256": "a4c7f99241eb4be457854e4dbdac2ca529b8125a3568f0da0c429486faf6c34a",
          "documentTypeCode": 14
        }
      ],
      "etag": "\"s5-synthetic-revision-1\"",
      "reviewOutcome": "DECISION_OUTCOME_RETURN"
    }
  },
  "successTrailers": {}
}
```
