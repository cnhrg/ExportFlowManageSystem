# 步骤七逐接口HTTP / RESPONSE / cURL

所有示例是离线设计，不是已经上线的handler；设置真实BASE_URL及本受众凭证/确切意图确认前不可执行。官方、补正和到账示例故意返回缺证据阻断。

## s7-create · CreateRefundCase

```http
POST /api/v1/trades/SYNTHETIC-S7-TRADE/tax-refund-cases
Authorization: Bearer SYNTHETIC-NOT-A-TOKEN
Accept: application/json
Content-Type: application/json
Idempotency-Key: 77777777-7777-4777-8777-000000000001
If-Match: "s7-case-1"
X-Confirmation-Id: SYNTHETIC-NOT-A-CONFIRMATION

{
  "tradeRevisionNumber": 1,
  "scope": {
    "reference": "SYNTHETIC-PREPARATION-SCOPE",
    "customsRevisionReferences": [],
    "certificateReferences": []
  },
  "taxpayerSnapshotReference": "SYNTHETIC-A-SNAPSHOT",
  "currencyCode": "CNY"
}
```

### RESPONSE

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
ETag: "s7-case-1"
Location: /api/v1/tax-refund-cases/SYNTHETIC-S7-CASE

{
  "taxCaseNumber": "SYNTHETIC-S7-CASE",
  "tradeNumber": "SYNTHETIC-S7-TRADE",
  "taxTypeCode": 2,
  "scope": {
    "reference": "SYNTHETIC-PREPARATION-SCOPE",
    "customsRevisionReferences": [],
    "certificateReferences": []
  },
  "status": "CASE_STATUS_PREPARING",
  "currencyCode": "CNY",
  "version": 1,
  "etag": "\"s7-case-1\"",
  "missingGates": [
    "SCOPE_RULE_UNCONFIRMED",
    "TAX_AUTHORITY_UNCONFIRMED"
  ]
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/trades/SYNTHETIC-S7-TRADE/tax-refund-cases" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 77777777-7777-4777-8777-000000000001' \
  --header 'If-Match: "s7-case-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"tradeRevisionNumber":1,"scope":{"reference":"SYNTHETIC-PREPARATION-SCOPE","customsRevisionReferences":[],"certificateReferences":[]},"taxpayerSnapshotReference":"SYNTHETIC-A-SNAPSHOT","currencyCode":"CNY"}'
```

## s7-read · GetRefundCase

```http
GET /api/v1/tax-refund-cases/SYNTHETIC-S7-CASE
Authorization: Bearer SYNTHETIC-NOT-A-TOKEN
Accept: application/json


```

### RESPONSE

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s7-case-1"

{
  "taxCaseNumber": "SYNTHETIC-S7-CASE",
  "tradeNumber": "SYNTHETIC-S7-TRADE",
  "taxTypeCode": 2,
  "scope": {
    "reference": "SYNTHETIC-PREPARATION-SCOPE",
    "customsRevisionReferences": [],
    "certificateReferences": []
  },
  "status": "CASE_STATUS_PREPARING",
  "currencyCode": "CNY",
  "version": 1,
  "etag": "\"s7-case-1\"",
  "missingGates": [
    "SCOPE_RULE_UNCONFIRMED",
    "TAX_AUTHORITY_UNCONFIRMED"
  ]
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/tax-refund-cases/SYNTHETIC-S7-CASE" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json'
```

## s7-package · CreateRefundPackage

```http
POST /api/v1/tax-refund-cases/SYNTHETIC-S7-CASE/submission-revisions
Authorization: Bearer SYNTHETIC-NOT-A-TOKEN
Accept: application/json
Content-Type: application/json
Idempotency-Key: 77777777-7777-4777-8777-000000000003
If-Match: "s7-case-1"
X-Confirmation-Id: SYNTHETIC-NOT-A-CONFIRMATION

{
  "approvedTradeSnapshotReference": "SYNTHETIC-APPROVED-SNAPSHOT",
  "scope": {
    "reference": "SYNTHETIC-PREPARATION-SCOPE",
    "customsRevisionReferences": [],
    "certificateReferences": []
  },
  "currencyCode": "CNY",
  "files": [
    {
      "fileNumber": "SYNTHETIC-S7-FILE",
      "versionId": "SYNTHETIC-NOT-A-REAL-S3-VERSION",
      "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "purposeCode": 24,
      "revisionNumber": 1
    }
  ]
}
```

### RESPONSE

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
ETag: "s7-submission-1"
Location: /api/v1/tax-refund-cases/SYNTHETIC-S7-CASE/submission-revisions/1

{
  "taxCaseNumber": "SYNTHETIC-S7-CASE",
  "submissionRevisionNumber": 1,
  "content": {
    "approvedTradeSnapshotReference": "SYNTHETIC-APPROVED-SNAPSHOT",
    "scope": {
      "reference": "SYNTHETIC-PREPARATION-SCOPE",
      "customsRevisionReferences": [],
      "certificateReferences": []
    },
    "currencyCode": "CNY",
    "files": [
      {
        "fileNumber": "SYNTHETIC-S7-FILE",
        "versionId": "SYNTHETIC-NOT-A-REAL-S3-VERSION",
        "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "purposeCode": 24,
        "revisionNumber": 1
      }
    ]
  },
  "packageHash": "e4afdaaaa83c04c21b71374ed7183fcf7f6b579ae9bc544aaef8e86fc195ee2c",
  "executionStatus": "not_dispatched",
  "etag": "\"s7-submission-1\""
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/tax-refund-cases/SYNTHETIC-S7-CASE/submission-revisions" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 77777777-7777-4777-8777-000000000003' \
  --header 'If-Match: "s7-case-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"approvedTradeSnapshotReference":"SYNTHETIC-APPROVED-SNAPSHOT","scope":{"reference":"SYNTHETIC-PREPARATION-SCOPE","customsRevisionReferences":[],"certificateReferences":[]},"currencyCode":"CNY","files":[{"fileNumber":"SYNTHETIC-S7-FILE","versionId":"SYNTHETIC-NOT-A-REAL-S3-VERSION","sha256":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","purposeCode":24,"revisionNumber":1}]}'
```

## s7-submission · GetRefundSubmission

```http
GET /api/v1/tax-refund-cases/SYNTHETIC-S7-CASE/submission-revisions/1
Authorization: Bearer SYNTHETIC-NOT-A-TOKEN
Accept: application/json


```

### RESPONSE

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s7-submission-1"

{
  "taxCaseNumber": "SYNTHETIC-S7-CASE",
  "submissionRevisionNumber": 1,
  "content": {
    "approvedTradeSnapshotReference": "SYNTHETIC-APPROVED-SNAPSHOT",
    "scope": {
      "reference": "SYNTHETIC-PREPARATION-SCOPE",
      "customsRevisionReferences": [],
      "certificateReferences": []
    },
    "currencyCode": "CNY",
    "files": [
      {
        "fileNumber": "SYNTHETIC-S7-FILE",
        "versionId": "SYNTHETIC-NOT-A-REAL-S3-VERSION",
        "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "purposeCode": 24,
        "revisionNumber": 1
      }
    ]
  },
  "packageHash": "e4afdaaaa83c04c21b71374ed7183fcf7f6b579ae9bc544aaef8e86fc195ee2c",
  "executionStatus": "not_dispatched",
  "etag": "\"s7-submission-1\""
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/tax-refund-cases/SYNTHETIC-S7-CASE/submission-revisions/1" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json'
```

## s7-context · GetRefundReviewContext

```http
GET /internal/v1/tax-refund-cases/SYNTHETIC-S7-CASE/review-context
Authorization: Bearer SYNTHETIC-NOT-A-TOKEN
Accept: application/json


```

### RESPONSE

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s7-context-1"

{
  "taxCase": {
    "taxCaseNumber": "SYNTHETIC-S7-CASE",
    "tradeNumber": "SYNTHETIC-S7-TRADE",
    "taxTypeCode": 2,
    "scope": {
      "reference": "SYNTHETIC-PREPARATION-SCOPE",
      "customsRevisionReferences": [],
      "certificateReferences": []
    },
    "status": "CASE_STATUS_PREPARING",
    "currencyCode": "CNY",
    "version": 1,
    "etag": "\"s7-case-1\"",
    "missingGates": [
      "SCOPE_RULE_UNCONFIRMED",
      "TAX_AUTHORITY_UNCONFIRMED"
    ]
  },
  "submissions": [
    {
      "taxCaseNumber": "SYNTHETIC-S7-CASE",
      "submissionRevisionNumber": 1,
      "content": {
        "approvedTradeSnapshotReference": "SYNTHETIC-APPROVED-SNAPSHOT",
        "scope": {
          "reference": "SYNTHETIC-PREPARATION-SCOPE",
          "customsRevisionReferences": [],
          "certificateReferences": []
        },
        "currencyCode": "CNY",
        "files": [
          {
            "fileNumber": "SYNTHETIC-S7-FILE",
            "versionId": "SYNTHETIC-NOT-A-REAL-S3-VERSION",
            "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "purposeCode": 24,
            "revisionNumber": 1
          }
        ]
      },
      "packageHash": "e4afdaaaa83c04c21b71374ed7183fcf7f6b579ae9bc544aaef8e86fc195ee2c",
      "executionStatus": "not_dispatched",
      "etag": "\"s7-submission-1\""
    }
  ],
  "missingGates": [
    "SCOPE_RULE_UNCONFIRMED",
    "TAX_AUTHORITY_UNCONFIRMED"
  ],
  "verifiedEventReferences": []
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/internal/v1/tax-refund-cases/SYNTHETIC-S7-CASE/review-context" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json'
```

## s7-review · CreateRefundReview

```http
POST /internal/v1/tax-refund-cases/SYNTHETIC-S7-CASE/review-decisions
Authorization: Bearer SYNTHETIC-NOT-A-TOKEN
Accept: application/json
Content-Type: application/json
Idempotency-Key: 77777777-7777-4777-8777-000000000006
If-Match: "s7-case-1"
X-Confirmation-Id: SYNTHETIC-NOT-A-CONFIRMATION

{
  "submissionRevisionNumber": 1,
  "packageHash": "e4afdaaaa83c04c21b71374ed7183fcf7f6b579ae9bc544aaef8e86fc195ee2c",
  "decision": "REVIEW_DECISION_RETURN",
  "reason": "范围/责任未确认，退回补料",
  "verifiedBasisReferences": []
}
```

### RESPONSE

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
ETag: "s7-case-2"
Location: /api/v1/tax-refund-cases/SYNTHETIC-S7-CASE/operations/SYNTHETIC-S7-OP

{
  "taxCaseNumber": "SYNTHETIC-S7-CASE",
  "operationNumber": "SYNTHETIC-S7-OP",
  "result": "internal_synthetic_only",
  "etag": "\"s7-case-2\""
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/tax-refund-cases/SYNTHETIC-S7-CASE/review-decisions" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 77777777-7777-4777-8777-000000000006' \
  --header 'If-Match: "s7-case-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"submissionRevisionNumber":1,"packageHash":"e4afdaaaa83c04c21b71374ed7183fcf7f6b579ae9bc544aaef8e86fc195ee2c","decision":"REVIEW_DECISION_RETURN","reason":"范围/责任未确认，退回补料","verifiedBasisReferences":[]}'
```

## s7-dispatch · CreateRefundDispatch

```http
POST /api/v1/tax-refund-cases/SYNTHETIC-S7-CASE/dispatch-intents
Authorization: Bearer SYNTHETIC-NOT-A-TOKEN
Accept: application/json
Content-Type: application/json
Idempotency-Key: 77777777-7777-4777-8777-000000000007
If-Match: "s7-case-1"
X-Confirmation-Id: SYNTHETIC-NOT-A-CONFIRMATION

{
  "submissionRevisionNumber": 1,
  "packageHash": "e4afdaaaa83c04c21b71374ed7183fcf7f6b579ae9bc544aaef8e86fc195ee2c",
  "authorizationBasisReference": "UNVERIFIED-NOT-AUTHORITY"
}
```

### RESPONSE

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "urn:trade:problem:scope_rule_unconfirmed",
  "title": "SCOPE_RULE_UNCONFIRMED",
  "status": 422,
  "detail": "缺真实权威依据，失败关闭；不产生正式成功事实",
  "instance": "/api/v1/tax-refund-cases/SYNTHETIC-S7-CASE/dispatch-intents",
  "errors": [
    {
      "pointer": "/intent",
      "code": "SCOPE_RULE_UNCONFIRMED",
      "detail": "补齐本意图的真实权威依据"
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
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/tax-refund-cases/SYNTHETIC-S7-CASE/dispatch-intents" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 77777777-7777-4777-8777-000000000007' \
  --header 'If-Match: "s7-case-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"submissionRevisionNumber":1,"packageHash":"e4afdaaaa83c04c21b71374ed7183fcf7f6b579ae9bc544aaef8e86fc195ee2c","authorizationBasisReference":"UNVERIFIED-NOT-AUTHORITY"}'
```

## s7-notice · CreateRefundNotice

```http
POST /internal/v1/tax-refund-cases/SYNTHETIC-S7-CASE/official-notices
Authorization: Bearer SYNTHETIC-NOT-A-TOKEN
Accept: application/json
Content-Type: application/json
Idempotency-Key: 77777777-7777-4777-8777-000000000008
If-Match: "s7-case-1"
X-Confirmation-Id: SYNTHETIC-NOT-A-CONFIRMATION

{
  "submissionRevisionNumber": 1,
  "externalEventKey": "",
  "authorityReferenceNumber": "",
  "kind": "OFFICIAL_KIND_ACCEPTED",
  "originalNotice": {
    "fileNumber": "SYNTHETIC-S7-FILE",
    "versionId": "SYNTHETIC-NOT-A-REAL-S3-VERSION",
    "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "purposeCode": 21,
    "revisionNumber": 1
  },
  "verifiedSourceReference": "",
  "occurredAt": "2026-10-25T00:00:00Z",
  "currencyCode": "CNY",
  "dispatchReference": "UNVERIFIED"
}
```

### RESPONSE

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "urn:trade:problem:official_evidence_required",
  "title": "OFFICIAL_EVIDENCE_REQUIRED",
  "status": 422,
  "detail": "缺真实权威依据，失败关闭；不产生正式成功事实",
  "instance": "/internal/v1/tax-refund-cases/SYNTHETIC-S7-CASE/official-notices",
  "errors": [
    {
      "pointer": "/notice",
      "code": "OFFICIAL_EVIDENCE_REQUIRED",
      "detail": "补齐本意图的真实权威依据"
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
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/tax-refund-cases/SYNTHETIC-S7-CASE/official-notices" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 77777777-7777-4777-8777-000000000008' \
  --header 'If-Match: "s7-case-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"submissionRevisionNumber":1,"externalEventKey":"","authorityReferenceNumber":"","kind":"OFFICIAL_KIND_ACCEPTED","originalNotice":{"fileNumber":"SYNTHETIC-S7-FILE","versionId":"SYNTHETIC-NOT-A-REAL-S3-VERSION","sha256":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","purposeCode":21,"revisionNumber":1},"verifiedSourceReference":"","occurredAt":"2026-10-25T00:00:00Z","currencyCode":"CNY","dispatchReference":"UNVERIFIED"}'
```

## s7-correction · CreateRefundCorrection

```http
POST /api/v1/tax-refund-cases/SYNTHETIC-S7-CASE/correction-revisions
Authorization: Bearer SYNTHETIC-NOT-A-TOKEN
Accept: application/json
Content-Type: application/json
Idempotency-Key: 77777777-7777-4777-8777-000000000009
If-Match: "s7-case-1"
X-Confirmation-Id: SYNTHETIC-NOT-A-CONFIRMATION

{
  "previousSubmissionRevisionNumber": 1,
  "correctionEventNumber": "",
  "replacement": {
    "approvedTradeSnapshotReference": "SYNTHETIC-APPROVED-SNAPSHOT",
    "scope": {
      "reference": "SYNTHETIC-PREPARATION-SCOPE",
      "customsRevisionReferences": [],
      "certificateReferences": []
    },
    "currencyCode": "CNY",
    "files": [
      {
        "fileNumber": "SYNTHETIC-S7-FILE",
        "versionId": "SYNTHETIC-NOT-A-REAL-S3-VERSION",
        "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "purposeCode": 24,
        "revisionNumber": 1
      }
    ]
  }
}
```

### RESPONSE

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "urn:trade:problem:official_evidence_required",
  "title": "OFFICIAL_EVIDENCE_REQUIRED",
  "status": 422,
  "detail": "缺真实权威依据，失败关闭；不产生正式成功事实",
  "instance": "/api/v1/tax-refund-cases/SYNTHETIC-S7-CASE/correction-revisions",
  "errors": [
    {
      "pointer": "/correction",
      "code": "OFFICIAL_EVIDENCE_REQUIRED",
      "detail": "补齐本意图的真实权威依据"
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
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/tax-refund-cases/SYNTHETIC-S7-CASE/correction-revisions" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 77777777-7777-4777-8777-000000000009' \
  --header 'If-Match: "s7-case-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"previousSubmissionRevisionNumber":1,"correctionEventNumber":"","replacement":{"approvedTradeSnapshotReference":"SYNTHETIC-APPROVED-SNAPSHOT","scope":{"reference":"SYNTHETIC-PREPARATION-SCOPE","customsRevisionReferences":[],"certificateReferences":[]},"currencyCode":"CNY","files":[{"fileNumber":"SYNTHETIC-S7-FILE","versionId":"SYNTHETIC-NOT-A-REAL-S3-VERSION","sha256":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","purposeCode":24,"revisionNumber":1}]}}'
```

## s7-followup · CreateRefundFollowUp

```http
POST /api/v1/tax-refund-cases/SYNTHETIC-S7-CASE/follow-ups
Authorization: Bearer SYNTHETIC-NOT-A-TOKEN
Accept: application/json
Content-Type: application/json
Idempotency-Key: 77777777-7777-4777-8777-000000000010
If-Match: "s7-case-1"
X-Confirmation-Id: SYNTHETIC-NOT-A-CONFIRMATION

{
  "submissionRevisionNumber": 1,
  "ownerReference": "SYNTHETIC-A-OPERATOR",
  "action": "等待主管机关确认范围/职责，不猜截止日期"
}
```

### RESPONSE

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
ETag: "s7-case-2"
Location: /api/v1/tax-refund-cases/SYNTHETIC-S7-CASE/operations/SYNTHETIC-S7-OP

{
  "taxCaseNumber": "SYNTHETIC-S7-CASE",
  "operationNumber": "SYNTHETIC-S7-OP",
  "result": "internal_synthetic_only",
  "etag": "\"s7-case-2\""
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/tax-refund-cases/SYNTHETIC-S7-CASE/follow-ups" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 77777777-7777-4777-8777-000000000010' \
  --header 'If-Match: "s7-case-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"submissionRevisionNumber":1,"ownerReference":"SYNTHETIC-A-OPERATOR","action":"等待主管机关确认范围/职责，不猜截止日期"}'
```

## s7-credit · ReconcileRefundCredit

```http
POST /internal/v1/tax-refund-cases/SYNTHETIC-S7-CASE/credit-reconciliations
Authorization: Bearer SYNTHETIC-NOT-A-TOKEN
Accept: application/json
Content-Type: application/json
Idempotency-Key: 77777777-7777-4777-8777-000000000011
If-Match: "s7-case-1"
X-Confirmation-Id: SYNTHETIC-NOT-A-CONFIRMATION

{
  "submissionRevisionNumber": 1,
  "officialDecisionEventNumber": "",
  "controlledFundObservationReference": "",
  "recipientAccountBasisReference": ""
}
```

### RESPONSE

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json
Cache-Control: no-store

{
  "type": "urn:trade:problem:refund_observation_unavailable",
  "title": "REFUND_OBSERVATION_UNAVAILABLE",
  "status": 422,
  "detail": "缺真实权威依据，失败关闭；不产生正式成功事实",
  "instance": "/internal/v1/tax-refund-cases/SYNTHETIC-S7-CASE/credit-reconciliations",
  "errors": [
    {
      "pointer": "/reconciliation",
      "code": "REFUND_OBSERVATION_UNAVAILABLE",
      "detail": "补齐本意图的真实权威依据"
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
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/tax-refund-cases/SYNTHETIC-S7-CASE/credit-reconciliations" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 77777777-7777-4777-8777-000000000011' \
  --header 'If-Match: "s7-case-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"submissionRevisionNumber":1,"officialDecisionEventNumber":"","controlledFundObservationReference":"","recipientAccountBasisReference":""}'
```

## s7-recovery · GetRefundOperation

```http
GET /api/v1/tax-refund-cases/SYNTHETIC-S7-CASE/operations/SYNTHETIC-S7-OP
Authorization: Bearer SYNTHETIC-NOT-A-TOKEN
Accept: application/json


```

### RESPONSE

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s7-context-1"

{
  "operationNumber": "SYNTHETIC-S7-OP",
  "taxCaseNumber": "SYNTHETIC-S7-CASE",
  "executionStatus": "not_dispatched",
  "originalReceipt": {
    "taxCaseNumber": "SYNTHETIC-S7-CASE",
    "operationNumber": "SYNTHETIC-S7-OP",
    "result": "internal_synthetic_only",
    "etag": "\"s7-case-2\""
  }
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/tax-refund-cases/SYNTHETIC-S7-CASE/operations/SYNTHETIC-S7-OP" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json'
```
