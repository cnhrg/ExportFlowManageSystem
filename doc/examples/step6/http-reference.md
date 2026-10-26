# 步骤六逐接口HTTP RESPONSE、cURL与RPC

设计示例均非有效身份/确认。官方成功缺证据必须阻断，创建案件例也因无确认范围规则而409；可在服务端确定的准备占位案中备料。通用头、错误及签名策略沿步骤一，不擅自要求供应商私钥。

## s6-basis · GetTaxProofPreparation

查看主管机关确认的职责、范围、时限与缺项；未确认只能备料

```http
GET /api/v1/trades/TRD-S6-SYNTHETIC-001/tax-proof-preparation
Authorization: <INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>

```

### RESPONSE

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
X-Request-Id: S6-DESIGN-0
ETag: "s6-case-1"

{
  "tradeNumber": "TRD-S6-SYNTHETIC-001",
  "tradeRevisionNumber": 1,
  "missingRequirements": [
    "SCOPE_RULE_UNCONFIRMED",
    "RESPONSIBILITY_UNCONFIRMED",
    "OFFICIAL_CHANNEL_UNAVAILABLE"
  ],
  "confirmedRules": [],
  "eligibleScopeItems": [],
  "etag": "\"s6-case-1\"",
  "formalApplicationAvailable": false
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/trades/TRD-S6-SYNTHETIC-001/tax-proof-preparation" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

### RPC

```json
{
  "designOnly": true,
  "service": "trade.taxproof.v1.ExternalTaxProofService",
  "method": "GetTaxProofPreparation",
  "requestType": "GetTaxProofPreparationReqMsg",
  "responseType": "GetTaxProofPreparationRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>"
  },
  "request": {
    "tradeNumber": "TRD-S6-SYNTHETIC-001"
  },
  "response": {
    "resource": {
      "tradeNumber": "TRD-S6-SYNTHETIC-001",
      "tradeRevisionNumber": 1,
      "missingRequirements": [
        "SCOPE_RULE_UNCONFIRMED",
        "RESPONSIBILITY_UNCONFIRMED",
        "OFFICIAL_CHANNEL_UNAVAILABLE"
      ],
      "confirmedRules": [],
      "eligibleScopeItems": [],
      "etag": "\"s6-case-1\"",
      "formalApplicationAvailable": false
    }
  },
  "successTrailers": {}
}
```

## s6-case-create · CreateTaxProofCase

基于已确认范围建立证明协同案，不自动按交易或报关单分案

```http
POST /api/v1/trades/TRD-S6-SYNTHETIC-001/tax-proof-cases
Authorization: <INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>
Content-Type: application/json
Idempotency-Key: d7060000-0000-4000-8000-000000000002
If-Match: "s6-case-1"
X-Confirmation-Id: <INVALID-EXACT-INTENT-CONFIRMATION>

{
  "tradeRevisionNumber": 1,
  "scopeRule": {
    "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
    "ruleVersion": "1",
    "authorityEvidence": {
      "fileNumber": "FILE-S6-SYNTHETIC-001",
      "versionId": "SYNTHETIC-NOT-STORED",
      "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
      "purposeCode": 21
    }
  },
  "scopeItems": [
    {
      "declarationNumber": "SYNTHETIC-NOT-OFFICIAL-DECLARATION",
      "declarationRevisionNumber": 1,
      "goodsItemSequence": 1,
      "quantity": "10.000000",
      "unitCode": "PCS",
      "officialDeclaration": {
        "fileNumber": "FILE-S6-SYNTHETIC-001",
        "versionId": "SYNTHETIC-NOT-STORED",
        "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
        "purposeCode": 20
      }
    }
  ],
  "supplierParticipantSequenceNumber": 1
}
```

### RESPONSE

```http
HTTP/1.1 409 Conflict
Content-Type: application/problem+json
Cache-Control: no-store
X-Request-Id: S6-DESIGN-1

{
  "type": "urn:trade:problem:scope_rule_unconfirmed",
  "title": "SCOPE_RULE_UNCONFIRMED",
  "status": 409,
  "detail": "合成输入缺正式证据；必须阻断，不是官方成功",
  "instance": "/api/v1/trades/TRD-S6-SYNTHETIC-001/tax-proof-cases",
  "errors": [
    {
      "pointer": "/case_input",
      "code": "SCOPE_RULE_UNCONFIRMED",
      "detail": "补齐本意图真实权威依据，或查询本方可见原资源"
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
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/trades/TRD-S6-SYNTHETIC-001/tax-proof-cases" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7060000-0000-4000-8000-000000000002' \
  --header 'If-Match: "s6-case-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"tradeRevisionNumber":1,"scopeRule":{"ruleReference":"SYNTHETIC-INTERNAL-PREPARATION-ONLY","ruleVersion":"1","authorityEvidence":{"fileNumber":"FILE-S6-SYNTHETIC-001","versionId":"SYNTHETIC-NOT-STORED","sha256":"5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6","purposeCode":21}},"scopeItems":[{"declarationNumber":"SYNTHETIC-NOT-OFFICIAL-DECLARATION","declarationRevisionNumber":1,"goodsItemSequence":1,"quantity":"10.000000","unitCode":"PCS","officialDeclaration":{"fileNumber":"FILE-S6-SYNTHETIC-001","versionId":"SYNTHETIC-NOT-STORED","sha256":"5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6","purposeCode":20}}],"supplierParticipantSequenceNumber":1}'
```

### RPC

```json
{
  "designOnly": true,
  "service": "trade.taxproof.v1.ExternalTaxProofService",
  "method": "CreateTaxProofCase",
  "requestType": "CreateTaxProofCaseReqMsg",
  "responseType": "CreateTaxProofCaseRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>",
    "idempotency-key": "d7060000-0000-4000-8000-000000000002",
    "if-match": "\"s6-case-1\"",
    "confirmation-id": "<INVALID-EXACT-INTENT-CONFIRMATION>"
  },
  "request": {
    "tradeNumber": "TRD-S6-SYNTHETIC-001",
    "caseInput": {
      "tradeRevisionNumber": 1,
      "scopeRule": {
        "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
        "ruleVersion": "1",
        "authorityEvidence": {
          "fileNumber": "FILE-S6-SYNTHETIC-001",
          "versionId": "SYNTHETIC-NOT-STORED",
          "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
          "purposeCode": 21
        }
      },
      "scopeItems": [
        {
          "declarationNumber": "SYNTHETIC-NOT-OFFICIAL-DECLARATION",
          "declarationRevisionNumber": 1,
          "goodsItemSequence": 1,
          "quantity": "10.000000",
          "unitCode": "PCS",
          "officialDeclaration": {
            "fileNumber": "FILE-S6-SYNTHETIC-001",
            "versionId": "SYNTHETIC-NOT-STORED",
            "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
            "purposeCode": 20
          }
        }
      ],
      "supplierParticipantSequenceNumber": 1
    }
  },
  "successTrailers": {},
  "error": {
    "code": "FAILED_PRECONDITION",
    "details": {
      "code": "SCOPE_RULE_UNCONFIRMED",
      "httpStatus": 409,
      "errors": [
        {
          "pointer": "/case_input",
          "code": "SCOPE_RULE_UNCONFIRMED",
          "detail": "补齐本意图真实权威依据，或查询本方可见原资源"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "S6-DESIGN-1"
    }
  },
  "errorType": "trade.filing.v1.RpcFailure",
  "httpErrorType": "trade.filing.v1.HttpProblem"
}
```

## s6-case-read · GetTaxProofCase

读取本方案件、确切版本、未决办理与交接状态

```http
GET /api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001
Authorization: <INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>

```

### RESPONSE

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
X-Request-Id: S6-DESIGN-2
ETag: "s6-case-1"

{
  "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
  "tradeNumber": "TRD-S6-SYNTHETIC-001",
  "tradeRevisionNumber": 1,
  "scopeReference": "pending:server-controlled-preparation-only",
  "caseStatus": "PROOF_CASE_STATUS_PREPARING",
  "currentSubmissionRevisionNumber": 1,
  "etag": "\"s6-case-1\"",
  "blockers": [
    "SCOPE_RULE_UNCONFIRMED",
    "RESPONSIBILITY_UNCONFIRMED",
    "OFFICIAL_CHANNEL_UNAVAILABLE"
  ],
  "taxTypeCode": 1,
  "currencyCode": "CNY"
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

### RPC

```json
{
  "designOnly": true,
  "service": "trade.taxproof.v1.ExternalTaxProofService",
  "method": "GetTaxProofCase",
  "requestType": "GetTaxProofCaseReqMsg",
  "responseType": "GetTaxProofCaseRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>"
  },
  "request": {
    "taxCaseNumber": "TPC-S6-SYNTHETIC-001"
  },
  "response": {
    "resource": {
      "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
      "tradeNumber": "TRD-S6-SYNTHETIC-001",
      "tradeRevisionNumber": 1,
      "scopeReference": "pending:server-controlled-preparation-only",
      "caseStatus": "PROOF_CASE_STATUS_PREPARING",
      "currentSubmissionRevisionNumber": 1,
      "etag": "\"s6-case-1\"",
      "blockers": [
        "SCOPE_RULE_UNCONFIRMED",
        "RESPONSIBILITY_UNCONFIRMED",
        "OFFICIAL_CHANNEL_UNAVAILABLE"
      ],
      "taxTypeCode": 1,
      "currencyCode": "CNY"
    }
  },
  "successTrailers": {}
}
```

## s6-submission-create · CreateTaxProofSubmission

F协助提交不可变材料版；补正须引用原版与补正事件，旧批准失效

```http
POST /api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/submissions
Authorization: <INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>
Content-Type: application/json
Idempotency-Key: d7060000-0000-4000-8000-000000000004
If-Match: "s6-case-1"
X-Confirmation-Id: <INVALID-EXACT-INTENT-CONFIRMATION>

{
  "tradeRevisionNumber": 1,
  "scopeRule": {
    "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
    "ruleVersion": "1",
    "authorityEvidence": {
      "fileNumber": "FILE-S6-SYNTHETIC-001",
      "versionId": "SYNTHETIC-NOT-STORED",
      "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
      "purposeCode": 21
    }
  },
  "responsibilityRule": {
    "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
    "ruleVersion": "1",
    "authorityEvidence": {
      "fileNumber": "FILE-S6-SYNTHETIC-001",
      "versionId": "SYNTHETIC-NOT-STORED",
      "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
      "purposeCode": 21
    }
  },
  "deadlineRule": {
    "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
    "ruleVersion": "1",
    "authorityEvidence": {
      "fileNumber": "FILE-S6-SYNTHETIC-001",
      "versionId": "SYNTHETIC-NOT-STORED",
      "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
      "purposeCode": 21
    }
  },
  "scopeItems": [
    {
      "declarationNumber": "SYNTHETIC-NOT-OFFICIAL-DECLARATION",
      "declarationRevisionNumber": 1,
      "goodsItemSequence": 1,
      "quantity": "10.000000",
      "unitCode": "PCS",
      "officialDeclaration": {
        "fileNumber": "FILE-S6-SYNTHETIC-001",
        "versionId": "SYNTHETIC-NOT-STORED",
        "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
        "purposeCode": 20
      }
    }
  ],
  "materialVersions": [
    {
      "fileNumber": "FILE-S6-SYNTHETIC-001",
      "versionId": "SYNTHETIC-NOT-STORED",
      "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
      "purposeCode": 22
    }
  ],
  "preparationNote": "仅内部合成准备；正式职责、范围、渠道未确认"
}
```

### RESPONSE

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
X-Request-Id: S6-DESIGN-3
ETag: "s6-case-1"
Location: /api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/submissions/1

{
  "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
  "submissionRevisionNumber": 1,
  "packageHash": "3b5ee87dbb5bc24073fa2d44b7ecb458f1a9ad9d1a632ed9a992204da547824d",
  "content": {
    "tradeRevisionNumber": 1,
    "scopeRule": {
      "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
      "ruleVersion": "1",
      "authorityEvidence": {
        "fileNumber": "FILE-S6-SYNTHETIC-001",
        "versionId": "SYNTHETIC-NOT-STORED",
        "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
        "purposeCode": 21
      }
    },
    "responsibilityRule": {
      "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
      "ruleVersion": "1",
      "authorityEvidence": {
        "fileNumber": "FILE-S6-SYNTHETIC-001",
        "versionId": "SYNTHETIC-NOT-STORED",
        "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
        "purposeCode": 21
      }
    },
    "deadlineRule": {
      "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
      "ruleVersion": "1",
      "authorityEvidence": {
        "fileNumber": "FILE-S6-SYNTHETIC-001",
        "versionId": "SYNTHETIC-NOT-STORED",
        "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
        "purposeCode": 21
      }
    },
    "scopeItems": [
      {
        "declarationNumber": "SYNTHETIC-NOT-OFFICIAL-DECLARATION",
        "declarationRevisionNumber": 1,
        "goodsItemSequence": 1,
        "quantity": "10.000000",
        "unitCode": "PCS",
        "officialDeclaration": {
          "fileNumber": "FILE-S6-SYNTHETIC-001",
          "versionId": "SYNTHETIC-NOT-STORED",
          "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
          "purposeCode": 20
        }
      }
    ],
    "materialVersions": [
      {
        "fileNumber": "FILE-S6-SYNTHETIC-001",
        "versionId": "SYNTHETIC-NOT-STORED",
        "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
        "purposeCode": 22
      }
    ],
    "preparationNote": "仅内部合成准备；正式职责、范围、渠道未确认"
  },
  "executionStatus": "not_sent",
  "etag": "\"s6-case-1\""
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/submissions" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7060000-0000-4000-8000-000000000004' \
  --header 'If-Match: "s6-case-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"tradeRevisionNumber":1,"scopeRule":{"ruleReference":"SYNTHETIC-INTERNAL-PREPARATION-ONLY","ruleVersion":"1","authorityEvidence":{"fileNumber":"FILE-S6-SYNTHETIC-001","versionId":"SYNTHETIC-NOT-STORED","sha256":"5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6","purposeCode":21}},"responsibilityRule":{"ruleReference":"SYNTHETIC-INTERNAL-PREPARATION-ONLY","ruleVersion":"1","authorityEvidence":{"fileNumber":"FILE-S6-SYNTHETIC-001","versionId":"SYNTHETIC-NOT-STORED","sha256":"5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6","purposeCode":21}},"deadlineRule":{"ruleReference":"SYNTHETIC-INTERNAL-PREPARATION-ONLY","ruleVersion":"1","authorityEvidence":{"fileNumber":"FILE-S6-SYNTHETIC-001","versionId":"SYNTHETIC-NOT-STORED","sha256":"5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6","purposeCode":21}},"scopeItems":[{"declarationNumber":"SYNTHETIC-NOT-OFFICIAL-DECLARATION","declarationRevisionNumber":1,"goodsItemSequence":1,"quantity":"10.000000","unitCode":"PCS","officialDeclaration":{"fileNumber":"FILE-S6-SYNTHETIC-001","versionId":"SYNTHETIC-NOT-STORED","sha256":"5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6","purposeCode":20}}],"materialVersions":[{"fileNumber":"FILE-S6-SYNTHETIC-001","versionId":"SYNTHETIC-NOT-STORED","sha256":"5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6","purposeCode":22}],"preparationNote":"仅内部合成准备；正式职责、范围、渠道未确认"}'
```

### RPC

```json
{
  "designOnly": true,
  "service": "trade.taxproof.v1.ExternalTaxProofService",
  "method": "CreateTaxProofSubmission",
  "requestType": "CreateTaxProofSubmissionReqMsg",
  "responseType": "CreateTaxProofSubmissionRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>",
    "idempotency-key": "d7060000-0000-4000-8000-000000000004",
    "if-match": "\"s6-case-1\"",
    "confirmation-id": "<INVALID-EXACT-INTENT-CONFIRMATION>"
  },
  "request": {
    "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
    "submission": {
      "tradeRevisionNumber": 1,
      "scopeRule": {
        "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
        "ruleVersion": "1",
        "authorityEvidence": {
          "fileNumber": "FILE-S6-SYNTHETIC-001",
          "versionId": "SYNTHETIC-NOT-STORED",
          "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
          "purposeCode": 21
        }
      },
      "responsibilityRule": {
        "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
        "ruleVersion": "1",
        "authorityEvidence": {
          "fileNumber": "FILE-S6-SYNTHETIC-001",
          "versionId": "SYNTHETIC-NOT-STORED",
          "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
          "purposeCode": 21
        }
      },
      "deadlineRule": {
        "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
        "ruleVersion": "1",
        "authorityEvidence": {
          "fileNumber": "FILE-S6-SYNTHETIC-001",
          "versionId": "SYNTHETIC-NOT-STORED",
          "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
          "purposeCode": 21
        }
      },
      "scopeItems": [
        {
          "declarationNumber": "SYNTHETIC-NOT-OFFICIAL-DECLARATION",
          "declarationRevisionNumber": 1,
          "goodsItemSequence": 1,
          "quantity": "10.000000",
          "unitCode": "PCS",
          "officialDeclaration": {
            "fileNumber": "FILE-S6-SYNTHETIC-001",
            "versionId": "SYNTHETIC-NOT-STORED",
            "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
            "purposeCode": 20
          }
        }
      ],
      "materialVersions": [
        {
          "fileNumber": "FILE-S6-SYNTHETIC-001",
          "versionId": "SYNTHETIC-NOT-STORED",
          "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
          "purposeCode": 22
        }
      ],
      "preparationNote": "仅内部合成准备；正式职责、范围、渠道未确认"
    }
  },
  "response": {
    "resource": {
      "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
      "submissionRevisionNumber": 1,
      "packageHash": "3b5ee87dbb5bc24073fa2d44b7ecb458f1a9ad9d1a632ed9a992204da547824d",
      "content": {
        "tradeRevisionNumber": 1,
        "scopeRule": {
          "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
          "ruleVersion": "1",
          "authorityEvidence": {
            "fileNumber": "FILE-S6-SYNTHETIC-001",
            "versionId": "SYNTHETIC-NOT-STORED",
            "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
            "purposeCode": 21
          }
        },
        "responsibilityRule": {
          "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
          "ruleVersion": "1",
          "authorityEvidence": {
            "fileNumber": "FILE-S6-SYNTHETIC-001",
            "versionId": "SYNTHETIC-NOT-STORED",
            "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
            "purposeCode": 21
          }
        },
        "deadlineRule": {
          "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
          "ruleVersion": "1",
          "authorityEvidence": {
            "fileNumber": "FILE-S6-SYNTHETIC-001",
            "versionId": "SYNTHETIC-NOT-STORED",
            "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
            "purposeCode": 21
          }
        },
        "scopeItems": [
          {
            "declarationNumber": "SYNTHETIC-NOT-OFFICIAL-DECLARATION",
            "declarationRevisionNumber": 1,
            "goodsItemSequence": 1,
            "quantity": "10.000000",
            "unitCode": "PCS",
            "officialDeclaration": {
              "fileNumber": "FILE-S6-SYNTHETIC-001",
              "versionId": "SYNTHETIC-NOT-STORED",
              "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
              "purposeCode": 20
            }
          }
        ],
        "materialVersions": [
          {
            "fileNumber": "FILE-S6-SYNTHETIC-001",
            "versionId": "SYNTHETIC-NOT-STORED",
            "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
            "purposeCode": 22
          }
        ],
        "preparationNote": "仅内部合成准备；正式职责、范围、渠道未确认"
      },
      "executionStatus": "not_sent",
      "etag": "\"s6-case-1\""
    }
  },
  "successTrailers": {}
}
```

## s6-submission-read · GetTaxProofSubmission

查询原材料版、冻结职责范围及审核快照

```http
GET /api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/submissions/1
Authorization: <INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>

```

### RESPONSE

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
X-Request-Id: S6-DESIGN-4
ETag: "s6-case-1"

{
  "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
  "submissionRevisionNumber": 1,
  "packageHash": "3b5ee87dbb5bc24073fa2d44b7ecb458f1a9ad9d1a632ed9a992204da547824d",
  "content": {
    "tradeRevisionNumber": 1,
    "scopeRule": {
      "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
      "ruleVersion": "1",
      "authorityEvidence": {
        "fileNumber": "FILE-S6-SYNTHETIC-001",
        "versionId": "SYNTHETIC-NOT-STORED",
        "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
        "purposeCode": 21
      }
    },
    "responsibilityRule": {
      "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
      "ruleVersion": "1",
      "authorityEvidence": {
        "fileNumber": "FILE-S6-SYNTHETIC-001",
        "versionId": "SYNTHETIC-NOT-STORED",
        "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
        "purposeCode": 21
      }
    },
    "deadlineRule": {
      "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
      "ruleVersion": "1",
      "authorityEvidence": {
        "fileNumber": "FILE-S6-SYNTHETIC-001",
        "versionId": "SYNTHETIC-NOT-STORED",
        "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
        "purposeCode": 21
      }
    },
    "scopeItems": [
      {
        "declarationNumber": "SYNTHETIC-NOT-OFFICIAL-DECLARATION",
        "declarationRevisionNumber": 1,
        "goodsItemSequence": 1,
        "quantity": "10.000000",
        "unitCode": "PCS",
        "officialDeclaration": {
          "fileNumber": "FILE-S6-SYNTHETIC-001",
          "versionId": "SYNTHETIC-NOT-STORED",
          "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
          "purposeCode": 20
        }
      }
    ],
    "materialVersions": [
      {
        "fileNumber": "FILE-S6-SYNTHETIC-001",
        "versionId": "SYNTHETIC-NOT-STORED",
        "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
        "purposeCode": 22
      }
    ],
    "preparationNote": "仅内部合成准备；正式职责、范围、渠道未确认"
  },
  "executionStatus": "not_sent",
  "etag": "\"s6-case-1\""
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/submissions/1" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

### RPC

```json
{
  "designOnly": true,
  "service": "trade.taxproof.v1.ExternalTaxProofService",
  "method": "GetTaxProofSubmission",
  "requestType": "GetTaxProofSubmissionReqMsg",
  "responseType": "GetTaxProofSubmissionRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>"
  },
  "request": {
    "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
    "submissionRevisionNumber": 1
  },
  "response": {
    "resource": {
      "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
      "submissionRevisionNumber": 1,
      "packageHash": "3b5ee87dbb5bc24073fa2d44b7ecb458f1a9ad9d1a632ed9a992204da547824d",
      "content": {
        "tradeRevisionNumber": 1,
        "scopeRule": {
          "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
          "ruleVersion": "1",
          "authorityEvidence": {
            "fileNumber": "FILE-S6-SYNTHETIC-001",
            "versionId": "SYNTHETIC-NOT-STORED",
            "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
            "purposeCode": 21
          }
        },
        "responsibilityRule": {
          "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
          "ruleVersion": "1",
          "authorityEvidence": {
            "fileNumber": "FILE-S6-SYNTHETIC-001",
            "versionId": "SYNTHETIC-NOT-STORED",
            "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
            "purposeCode": 21
          }
        },
        "deadlineRule": {
          "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
          "ruleVersion": "1",
          "authorityEvidence": {
            "fileNumber": "FILE-S6-SYNTHETIC-001",
            "versionId": "SYNTHETIC-NOT-STORED",
            "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
            "purposeCode": 21
          }
        },
        "scopeItems": [
          {
            "declarationNumber": "SYNTHETIC-NOT-OFFICIAL-DECLARATION",
            "declarationRevisionNumber": 1,
            "goodsItemSequence": 1,
            "quantity": "10.000000",
            "unitCode": "PCS",
            "officialDeclaration": {
              "fileNumber": "FILE-S6-SYNTHETIC-001",
              "versionId": "SYNTHETIC-NOT-STORED",
              "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
              "purposeCode": 20
            }
          }
        ],
        "materialVersions": [
          {
            "fileNumber": "FILE-S6-SYNTHETIC-001",
            "versionId": "SYNTHETIC-NOT-STORED",
            "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
            "purposeCode": 22
          }
        ],
        "preparationNote": "仅内部合成准备；正式职责、范围、渠道未确认"
      },
      "executionStatus": "not_sent",
      "etag": "\"s6-case-1\""
    }
  },
  "successTrailers": {}
}
```

## s6-review-context · GetTaxProofReviewContext

内部审核员独立读取完整冻结依据与缺失门禁

```http
GET /internal/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/review-context
Authorization: <INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>

```

### RESPONSE

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
X-Request-Id: S6-DESIGN-5
ETag: "s6-case-1"

{
  "caseResource": {
    "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
    "tradeNumber": "TRD-S6-SYNTHETIC-001",
    "tradeRevisionNumber": 1,
    "scopeReference": "pending:server-controlled-preparation-only",
    "caseStatus": "PROOF_CASE_STATUS_PREPARING",
    "currentSubmissionRevisionNumber": 1,
    "etag": "\"s6-case-1\"",
    "blockers": [
      "SCOPE_RULE_UNCONFIRMED",
      "RESPONSIBILITY_UNCONFIRMED",
      "OFFICIAL_CHANNEL_UNAVAILABLE"
    ],
    "taxTypeCode": 1,
    "currencyCode": "CNY"
  },
  "submission": {
    "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
    "submissionRevisionNumber": 1,
    "packageHash": "3b5ee87dbb5bc24073fa2d44b7ecb458f1a9ad9d1a632ed9a992204da547824d",
    "content": {
      "tradeRevisionNumber": 1,
      "scopeRule": {
        "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
        "ruleVersion": "1",
        "authorityEvidence": {
          "fileNumber": "FILE-S6-SYNTHETIC-001",
          "versionId": "SYNTHETIC-NOT-STORED",
          "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
          "purposeCode": 21
        }
      },
      "responsibilityRule": {
        "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
        "ruleVersion": "1",
        "authorityEvidence": {
          "fileNumber": "FILE-S6-SYNTHETIC-001",
          "versionId": "SYNTHETIC-NOT-STORED",
          "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
          "purposeCode": 21
        }
      },
      "deadlineRule": {
        "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
        "ruleVersion": "1",
        "authorityEvidence": {
          "fileNumber": "FILE-S6-SYNTHETIC-001",
          "versionId": "SYNTHETIC-NOT-STORED",
          "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
          "purposeCode": 21
        }
      },
      "scopeItems": [
        {
          "declarationNumber": "SYNTHETIC-NOT-OFFICIAL-DECLARATION",
          "declarationRevisionNumber": 1,
          "goodsItemSequence": 1,
          "quantity": "10.000000",
          "unitCode": "PCS",
          "officialDeclaration": {
            "fileNumber": "FILE-S6-SYNTHETIC-001",
            "versionId": "SYNTHETIC-NOT-STORED",
            "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
            "purposeCode": 20
          }
        }
      ],
      "materialVersions": [
        {
          "fileNumber": "FILE-S6-SYNTHETIC-001",
          "versionId": "SYNTHETIC-NOT-STORED",
          "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
          "purposeCode": 22
        }
      ],
      "preparationNote": "仅内部合成准备；正式职责、范围、渠道未确认"
    },
    "executionStatus": "not_sent",
    "etag": "\"s6-case-1\""
  },
  "blockers": [
    "SCOPE_RULE_UNCONFIRMED",
    "RESPONSIBILITY_UNCONFIRMED",
    "OFFICIAL_CHANNEL_UNAVAILABLE"
  ],
  "etag": "\"s6-case-1\""
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/internal/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/review-context" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

### RPC

```json
{
  "designOnly": true,
  "service": "trade.taxproof.v1.InternalTaxProofOperationsService",
  "method": "GetTaxProofReviewContext",
  "requestType": "GetTaxProofReviewContextReqMsg",
  "responseType": "GetTaxProofReviewContextRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>"
  },
  "request": {
    "taxCaseNumber": "TPC-S6-SYNTHETIC-001"
  },
  "response": {
    "resource": {
      "caseResource": {
        "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
        "tradeNumber": "TRD-S6-SYNTHETIC-001",
        "tradeRevisionNumber": 1,
        "scopeReference": "pending:server-controlled-preparation-only",
        "caseStatus": "PROOF_CASE_STATUS_PREPARING",
        "currentSubmissionRevisionNumber": 1,
        "etag": "\"s6-case-1\"",
        "blockers": [
          "SCOPE_RULE_UNCONFIRMED",
          "RESPONSIBILITY_UNCONFIRMED",
          "OFFICIAL_CHANNEL_UNAVAILABLE"
        ],
        "taxTypeCode": 1,
        "currencyCode": "CNY"
      },
      "submission": {
        "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
        "submissionRevisionNumber": 1,
        "packageHash": "3b5ee87dbb5bc24073fa2d44b7ecb458f1a9ad9d1a632ed9a992204da547824d",
        "content": {
          "tradeRevisionNumber": 1,
          "scopeRule": {
            "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
            "ruleVersion": "1",
            "authorityEvidence": {
              "fileNumber": "FILE-S6-SYNTHETIC-001",
              "versionId": "SYNTHETIC-NOT-STORED",
              "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
              "purposeCode": 21
            }
          },
          "responsibilityRule": {
            "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
            "ruleVersion": "1",
            "authorityEvidence": {
              "fileNumber": "FILE-S6-SYNTHETIC-001",
              "versionId": "SYNTHETIC-NOT-STORED",
              "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
              "purposeCode": 21
            }
          },
          "deadlineRule": {
            "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
            "ruleVersion": "1",
            "authorityEvidence": {
              "fileNumber": "FILE-S6-SYNTHETIC-001",
              "versionId": "SYNTHETIC-NOT-STORED",
              "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
              "purposeCode": 21
            }
          },
          "scopeItems": [
            {
              "declarationNumber": "SYNTHETIC-NOT-OFFICIAL-DECLARATION",
              "declarationRevisionNumber": 1,
              "goodsItemSequence": 1,
              "quantity": "10.000000",
              "unitCode": "PCS",
              "officialDeclaration": {
                "fileNumber": "FILE-S6-SYNTHETIC-001",
                "versionId": "SYNTHETIC-NOT-STORED",
                "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
                "purposeCode": 20
              }
            }
          ],
          "materialVersions": [
            {
              "fileNumber": "FILE-S6-SYNTHETIC-001",
              "versionId": "SYNTHETIC-NOT-STORED",
              "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
              "purposeCode": 22
            }
          ],
          "preparationNote": "仅内部合成准备；正式职责、范围、渠道未确认"
        },
        "executionStatus": "not_sent",
        "etag": "\"s6-case-1\""
      },
      "blockers": [
        "SCOPE_RULE_UNCONFIRMED",
        "RESPONSIBILITY_UNCONFIRMED",
        "OFFICIAL_CHANNEL_UNAVAILABLE"
      ],
      "etag": "\"s6-case-1\""
    }
  },
  "successTrailers": {}
}
```

## s6-review-create · CreateTaxProofReview

独立批准或退回确切版；经办不得自审，批准不等于官方受理

```http
POST /internal/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/reviews
Authorization: <INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>
Content-Type: application/json
Idempotency-Key: d7060000-0000-4000-8000-000000000007
If-Match: "s6-case-1"
X-Confirmation-Id: <INVALID-EXACT-INTENT-CONFIRMATION>

{
  "submissionRevisionNumber": 1,
  "packageHash": "3b5ee87dbb5bc24073fa2d44b7ecb458f1a9ad9d1a632ed9a992204da547824d",
  "outcome": "REVIEW_OUTCOME_RETURNED",
  "reason": "职责/范围/渠道未确认，退回备料，不得正式申请"
}
```

### RESPONSE

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
X-Request-Id: S6-DESIGN-6
ETag: "s6-case-1"
Location: /internal/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/reviews/S6-SYNTHETIC-REVIEW

{
  "eventNumber": "S6-SYNTHETIC-REVIEW",
  "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
  "submissionRevisionNumber": 1,
  "actorReference": "SYNTHETIC-INDEPENDENT-REVIEWER",
  "review": {
    "submissionRevisionNumber": 1,
    "packageHash": "3b5ee87dbb5bc24073fa2d44b7ecb458f1a9ad9d1a632ed9a992204da547824d",
    "outcome": "REVIEW_OUTCOME_RETURNED",
    "reason": "职责/范围/渠道未确认，退回备料，不得正式申请"
  },
  "etag": "\"s6-case-1\""
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/reviews" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7060000-0000-4000-8000-000000000007' \
  --header 'If-Match: "s6-case-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"submissionRevisionNumber":1,"packageHash":"3b5ee87dbb5bc24073fa2d44b7ecb458f1a9ad9d1a632ed9a992204da547824d","outcome":"REVIEW_OUTCOME_RETURNED","reason":"职责/范围/渠道未确认，退回备料，不得正式申请"}'
```

### RPC

```json
{
  "designOnly": true,
  "service": "trade.taxproof.v1.InternalTaxProofOperationsService",
  "method": "CreateTaxProofReview",
  "requestType": "CreateTaxProofReviewReqMsg",
  "responseType": "CreateTaxProofReviewRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d7060000-0000-4000-8000-000000000007",
    "if-match": "\"s6-case-1\"",
    "confirmation-id": "<INVALID-EXACT-INTENT-CONFIRMATION>"
  },
  "request": {
    "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
    "review": {
      "submissionRevisionNumber": 1,
      "packageHash": "3b5ee87dbb5bc24073fa2d44b7ecb458f1a9ad9d1a632ed9a992204da547824d",
      "outcome": "REVIEW_OUTCOME_RETURNED",
      "reason": "职责/范围/渠道未确认，退回备料，不得正式申请"
    }
  },
  "response": {
    "resource": {
      "eventNumber": "S6-SYNTHETIC-REVIEW",
      "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
      "submissionRevisionNumber": 1,
      "actorReference": "SYNTHETIC-INDEPENDENT-REVIEWER",
      "review": {
        "submissionRevisionNumber": 1,
        "packageHash": "3b5ee87dbb5bc24073fa2d44b7ecb458f1a9ad9d1a632ed9a992204da547824d",
        "outcome": "REVIEW_OUTCOME_RETURNED",
        "reason": "职责/范围/渠道未确认，退回备料，不得正式申请"
      },
      "etag": "\"s6-case-1\""
    }
  },
  "successTrailers": {}
}
```

## s6-dispatch-create · CreateTaxProofDispatch

B经正式确认职责和范围后建立办理意图；缺官方通道阻断，不造正式提交

```http
POST /api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/dispatch-intents
Authorization: <INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>
Content-Type: application/json
Idempotency-Key: d7060000-0000-4000-8000-000000000008
If-Match: "s6-case-1"
X-Confirmation-Id: <INVALID-EXACT-INTENT-CONFIRMATION>

{
  "submissionRevisionNumber": 1,
  "reviewEventNumber": "SYNTHETIC-NOT-APPROVED",
  "packageHash": "3b5ee87dbb5bc24073fa2d44b7ecb458f1a9ad9d1a632ed9a992204da547824d"
}
```

### RESPONSE

```http
HTTP/1.1 409 Conflict
Content-Type: application/problem+json
Cache-Control: no-store
X-Request-Id: S6-DESIGN-7

{
  "type": "urn:trade:problem:responsibility_unconfirmed",
  "title": "RESPONSIBILITY_UNCONFIRMED",
  "status": 409,
  "detail": "合成输入缺正式证据；必须阻断，不是官方成功",
  "instance": "/api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/dispatch-intents",
  "errors": [
    {
      "pointer": "/dispatch",
      "code": "RESPONSIBILITY_UNCONFIRMED",
      "detail": "补齐本意图真实权威依据，或查询本方可见原资源"
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
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/dispatch-intents" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7060000-0000-4000-8000-000000000008' \
  --header 'If-Match: "s6-case-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"submissionRevisionNumber":1,"reviewEventNumber":"SYNTHETIC-NOT-APPROVED","packageHash":"3b5ee87dbb5bc24073fa2d44b7ecb458f1a9ad9d1a632ed9a992204da547824d"}'
```

### RPC

```json
{
  "designOnly": true,
  "service": "trade.taxproof.v1.ExternalTaxProofService",
  "method": "CreateTaxProofDispatch",
  "requestType": "CreateTaxProofDispatchReqMsg",
  "responseType": "CreateTaxProofDispatchRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>",
    "idempotency-key": "d7060000-0000-4000-8000-000000000008",
    "if-match": "\"s6-case-1\"",
    "confirmation-id": "<INVALID-EXACT-INTENT-CONFIRMATION>"
  },
  "request": {
    "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
    "dispatch": {
      "submissionRevisionNumber": 1,
      "reviewEventNumber": "SYNTHETIC-NOT-APPROVED",
      "packageHash": "3b5ee87dbb5bc24073fa2d44b7ecb458f1a9ad9d1a632ed9a992204da547824d"
    }
  },
  "successTrailers": {},
  "error": {
    "code": "FAILED_PRECONDITION",
    "details": {
      "code": "RESPONSIBILITY_UNCONFIRMED",
      "httpStatus": 409,
      "errors": [
        {
          "pointer": "/dispatch",
          "code": "RESPONSIBILITY_UNCONFIRMED",
          "detail": "补齐本意图真实权威依据，或查询本方可见原资源"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "S6-DESIGN-7"
    }
  },
  "errorType": "trade.filing.v1.RpcFailure",
  "httpErrorType": "trade.filing.v1.HttpProblem"
}
```

## s6-dispatch-read · GetTaxProofDispatch

未知只按原办理号查单，不重复派发，不猜官方结果

```http
GET /api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/dispatch-intents/SYNTHETIC-UNKNOWN-RECOVERY-ONLY
Authorization: <INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>

```

### RESPONSE

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
X-Request-Id: S6-DESIGN-8
ETag: "s6-case-1"

{
  "dispatchReference": "SYNTHETIC-UNKNOWN-RECOVERY-ONLY",
  "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
  "submissionRevisionNumber": 1,
  "executionStatus": "unknown",
  "blockers": [
    "DISPATCH_UNKNOWN",
    "OFFICIAL_EVIDENCE_REQUIRED"
  ],
  "etag": "\"s6-case-1\""
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/dispatch-intents/SYNTHETIC-UNKNOWN-RECOVERY-ONLY" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

### RPC

```json
{
  "designOnly": true,
  "service": "trade.taxproof.v1.ExternalTaxProofService",
  "method": "GetTaxProofDispatch",
  "requestType": "GetTaxProofDispatchReqMsg",
  "responseType": "GetTaxProofDispatchRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>"
  },
  "request": {
    "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
    "dispatchReference": "SYNTHETIC-UNKNOWN-RECOVERY-ONLY"
  },
  "response": {
    "resource": {
      "dispatchReference": "SYNTHETIC-UNKNOWN-RECOVERY-ONLY",
      "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
      "submissionRevisionNumber": 1,
      "executionStatus": "unknown",
      "blockers": [
        "DISPATCH_UNKNOWN",
        "OFFICIAL_EVIDENCE_REQUIRED"
      ],
      "etag": "\"s6-case-1\""
    }
  },
  "successTrailers": {}
}
```

## s6-claim-create · CreateTaxProofOfficialClaim

提交正式回执或证明声明，先待核，不直接变官方状态

```http
POST /api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/official-evidence-claims
Authorization: <INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>
Content-Type: application/json
Idempotency-Key: d7060000-0000-4000-8000-000000000010
If-Match: "s6-case-1"
X-Confirmation-Id: <INVALID-EXACT-INTENT-CONFIRMATION>

{
  "submissionRevisionNumber": 1,
  "dispatchReference": "SYNTHETIC-NOT-DISPATCHED",
  "factKind": "OFFICIAL_FACT_KIND_ISSUED",
  "externalEventKey": "INVALID-NOT-AUTHORITY-KEY",
  "authorityReferenceNumber": "INVALID-NOT-OFFICIAL",
  "sourceReference": "INVALID-NOT-AUTHORITY",
  "officialFile": {
    "fileNumber": "FILE-S6-SYNTHETIC-001",
    "versionId": "SYNTHETIC-NOT-STORED",
    "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
    "purposeCode": 21
  },
  "occurredAt": "2026-10-25T01:00:00.123Z"
}
```

### RESPONSE

```http
HTTP/1.1 409 Conflict
Content-Type: application/problem+json
Cache-Control: no-store
X-Request-Id: S6-DESIGN-9

{
  "type": "urn:trade:problem:official_evidence_required",
  "title": "OFFICIAL_EVIDENCE_REQUIRED",
  "status": 409,
  "detail": "合成输入缺正式证据；必须阻断，不是官方成功",
  "instance": "/api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/official-evidence-claims",
  "errors": [
    {
      "pointer": "/claim",
      "code": "OFFICIAL_EVIDENCE_REQUIRED",
      "detail": "补齐本意图真实权威依据，或查询本方可见原资源"
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
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/official-evidence-claims" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7060000-0000-4000-8000-000000000010' \
  --header 'If-Match: "s6-case-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"submissionRevisionNumber":1,"dispatchReference":"SYNTHETIC-NOT-DISPATCHED","factKind":"OFFICIAL_FACT_KIND_ISSUED","externalEventKey":"INVALID-NOT-AUTHORITY-KEY","authorityReferenceNumber":"INVALID-NOT-OFFICIAL","sourceReference":"INVALID-NOT-AUTHORITY","officialFile":{"fileNumber":"FILE-S6-SYNTHETIC-001","versionId":"SYNTHETIC-NOT-STORED","sha256":"5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6","purposeCode":21},"occurredAt":"2026-10-25T01:00:00.123Z"}'
```

### RPC

```json
{
  "designOnly": true,
  "service": "trade.taxproof.v1.ExternalTaxProofService",
  "method": "CreateTaxProofOfficialClaim",
  "requestType": "CreateTaxProofOfficialClaimReqMsg",
  "responseType": "CreateTaxProofOfficialClaimRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>",
    "idempotency-key": "d7060000-0000-4000-8000-000000000010",
    "if-match": "\"s6-case-1\"",
    "confirmation-id": "<INVALID-EXACT-INTENT-CONFIRMATION>"
  },
  "request": {
    "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
    "claim": {
      "submissionRevisionNumber": 1,
      "dispatchReference": "SYNTHETIC-NOT-DISPATCHED",
      "factKind": "OFFICIAL_FACT_KIND_ISSUED",
      "externalEventKey": "INVALID-NOT-AUTHORITY-KEY",
      "authorityReferenceNumber": "INVALID-NOT-OFFICIAL",
      "sourceReference": "INVALID-NOT-AUTHORITY",
      "officialFile": {
        "fileNumber": "FILE-S6-SYNTHETIC-001",
        "versionId": "SYNTHETIC-NOT-STORED",
        "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
        "purposeCode": 21
      },
      "occurredAt": "2026-10-25T01:00:00.123Z"
    }
  },
  "successTrailers": {},
  "error": {
    "code": "FAILED_PRECONDITION",
    "details": {
      "code": "OFFICIAL_EVIDENCE_REQUIRED",
      "httpStatus": 409,
      "errors": [
        {
          "pointer": "/claim",
          "code": "OFFICIAL_EVIDENCE_REQUIRED",
          "detail": "补齐本意图真实权威依据，或查询本方可见原资源"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "S6-DESIGN-9"
    }
  },
  "errorType": "trade.filing.v1.RpcFailure",
  "httpErrorType": "trade.filing.v1.HttpProblem"
}
```

## s6-claim-read · GetTaxProofOfficialClaim

原证据声明与核实结论分开可查

```http
GET /api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/official-evidence-claims/S6-SYNTHETIC-CLAIM
Authorization: <INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>

```

### RESPONSE

```http
HTTP/1.1 404 Error
Content-Type: application/problem+json
Cache-Control: no-store
X-Request-Id: S6-DESIGN-10

{
  "type": "urn:trade:problem:not_found",
  "title": "NOT_FOUND",
  "status": 404,
  "detail": "合成输入缺正式证据；必须阻断，不是官方成功",
  "instance": "/api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/official-evidence-claims/S6-SYNTHETIC-CLAIM",
  "errors": [
    {
      "pointer": "",
      "code": "NOT_FOUND",
      "detail": "补齐本意图真实权威依据，或查询本方可见原资源"
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
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/official-evidence-claims/S6-SYNTHETIC-CLAIM" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

### RPC

```json
{
  "designOnly": true,
  "service": "trade.taxproof.v1.ExternalTaxProofService",
  "method": "GetTaxProofOfficialClaim",
  "requestType": "GetTaxProofOfficialClaimReqMsg",
  "responseType": "GetTaxProofOfficialClaimRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>"
  },
  "request": {
    "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
    "claimNumber": "S6-SYNTHETIC-CLAIM"
  },
  "successTrailers": {},
  "error": {
    "code": "NOT_FOUND",
    "details": {
      "code": "NOT_FOUND",
      "httpStatus": 404,
      "errors": [
        {
          "pointer": "",
          "code": "NOT_FOUND",
          "detail": "补齐本意图真实权威依据，或查询本方可见原资源"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "S6-DESIGN-10"
    }
  },
  "errorType": "trade.filing.v1.RpcFailure",
  "httpErrorType": "trade.filing.v1.HttpProblem"
}
```

## s6-verification-create · CreateTaxProofOfficialVerification

独立核对真实来源、确切提交版、主管业务号和附件2范围后才记官方事实

```http
POST /internal/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/official-verifications
Authorization: <INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>
Content-Type: application/json
Idempotency-Key: d7060000-0000-4000-8000-000000000012
If-Match: "s6-case-1"
X-Confirmation-Id: <INVALID-EXACT-INTENT-CONFIRMATION>

{
  "claimNumber": "S6-SYNTHETIC-CLAIM",
  "submissionRevisionNumber": 1,
  "sourceVerificationReference": "INVALID-NOT-VERIFIED",
  "verified": true,
  "reason": "负例：无真实官方来源，必须拒绝"
}
```

### RESPONSE

```http
HTTP/1.1 409 Conflict
Content-Type: application/problem+json
Cache-Control: no-store
X-Request-Id: S6-DESIGN-11

{
  "type": "urn:trade:problem:official_evidence_required",
  "title": "OFFICIAL_EVIDENCE_REQUIRED",
  "status": 409,
  "detail": "合成输入缺正式证据；必须阻断，不是官方成功",
  "instance": "/internal/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/official-verifications",
  "errors": [
    {
      "pointer": "/verification",
      "code": "OFFICIAL_EVIDENCE_REQUIRED",
      "detail": "补齐本意图真实权威依据，或查询本方可见原资源"
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
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/official-verifications" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7060000-0000-4000-8000-000000000012' \
  --header 'If-Match: "s6-case-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"claimNumber":"S6-SYNTHETIC-CLAIM","submissionRevisionNumber":1,"sourceVerificationReference":"INVALID-NOT-VERIFIED","verified":true,"reason":"负例：无真实官方来源，必须拒绝"}'
```

### RPC

```json
{
  "designOnly": true,
  "service": "trade.taxproof.v1.InternalTaxProofOperationsService",
  "method": "CreateTaxProofOfficialVerification",
  "requestType": "CreateTaxProofOfficialVerificationReqMsg",
  "responseType": "CreateTaxProofOfficialVerificationRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d7060000-0000-4000-8000-000000000012",
    "if-match": "\"s6-case-1\"",
    "confirmation-id": "<INVALID-EXACT-INTENT-CONFIRMATION>"
  },
  "request": {
    "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
    "verification": {
      "claimNumber": "S6-SYNTHETIC-CLAIM",
      "submissionRevisionNumber": 1,
      "sourceVerificationReference": "INVALID-NOT-VERIFIED",
      "verified": true,
      "reason": "负例：无真实官方来源，必须拒绝"
    }
  },
  "successTrailers": {},
  "error": {
    "code": "FAILED_PRECONDITION",
    "details": {
      "code": "OFFICIAL_EVIDENCE_REQUIRED",
      "httpStatus": 409,
      "errors": [
        {
          "pointer": "/verification",
          "code": "OFFICIAL_EVIDENCE_REQUIRED",
          "detail": "补齐本意图真实权威依据，或查询本方可见原资源"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "S6-DESIGN-11"
    }
  },
  "errorType": "trade.filing.v1.RpcFailure",
  "httpErrorType": "trade.filing.v1.HttpProblem"
}
```

## s6-delivery-create · CreateTaxProofDelivery

B交付当前已核实有效正式证明确切版本；不等于A收到核对

```http
POST /api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/deliveries
Authorization: <INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>
Content-Type: application/json
Idempotency-Key: d7060000-0000-4000-8000-000000000013
If-Match: "s6-case-1"
X-Confirmation-Id: <INVALID-EXACT-INTENT-CONFIRMATION>

{
  "certificateEventNumber": "SYNTHETIC-NOT-ISSUED",
  "certificateVersion": {
    "fileNumber": "FILE-S6-SYNTHETIC-001",
    "versionId": "SYNTHETIC-NOT-STORED",
    "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
    "purposeCode": 22
  },
  "supplierParticipantSequenceNumber": 1,
  "dispatchEvidence": {
    "fileNumber": "FILE-S6-SYNTHETIC-001",
    "versionId": "SYNTHETIC-NOT-STORED",
    "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
    "purposeCode": 23
  },
  "deliveryChannel": "private-portal"
}
```

### RESPONSE

```http
HTTP/1.1 409 Conflict
Content-Type: application/problem+json
Cache-Control: no-store
X-Request-Id: S6-DESIGN-12

{
  "type": "urn:trade:problem:certificate_not_verified",
  "title": "CERTIFICATE_NOT_VERIFIED",
  "status": 409,
  "detail": "合成输入缺正式证据；必须阻断，不是官方成功",
  "instance": "/api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/deliveries",
  "errors": [
    {
      "pointer": "/delivery",
      "code": "CERTIFICATE_NOT_VERIFIED",
      "detail": "补齐本意图真实权威依据，或查询本方可见原资源"
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
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/deliveries" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7060000-0000-4000-8000-000000000013' \
  --header 'If-Match: "s6-case-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"certificateEventNumber":"SYNTHETIC-NOT-ISSUED","certificateVersion":{"fileNumber":"FILE-S6-SYNTHETIC-001","versionId":"SYNTHETIC-NOT-STORED","sha256":"5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6","purposeCode":22},"supplierParticipantSequenceNumber":1,"dispatchEvidence":{"fileNumber":"FILE-S6-SYNTHETIC-001","versionId":"SYNTHETIC-NOT-STORED","sha256":"5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6","purposeCode":23},"deliveryChannel":"private-portal"}'
```

### RPC

```json
{
  "designOnly": true,
  "service": "trade.taxproof.v1.ExternalTaxProofService",
  "method": "CreateTaxProofDelivery",
  "requestType": "CreateTaxProofDeliveryReqMsg",
  "responseType": "CreateTaxProofDeliveryRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>",
    "idempotency-key": "d7060000-0000-4000-8000-000000000013",
    "if-match": "\"s6-case-1\"",
    "confirmation-id": "<INVALID-EXACT-INTENT-CONFIRMATION>"
  },
  "request": {
    "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
    "delivery": {
      "certificateEventNumber": "SYNTHETIC-NOT-ISSUED",
      "certificateVersion": {
        "fileNumber": "FILE-S6-SYNTHETIC-001",
        "versionId": "SYNTHETIC-NOT-STORED",
        "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
        "purposeCode": 22
      },
      "supplierParticipantSequenceNumber": 1,
      "dispatchEvidence": {
        "fileNumber": "FILE-S6-SYNTHETIC-001",
        "versionId": "SYNTHETIC-NOT-STORED",
        "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
        "purposeCode": 23
      },
      "deliveryChannel": "private-portal"
    }
  },
  "successTrailers": {},
  "error": {
    "code": "FAILED_PRECONDITION",
    "details": {
      "code": "CERTIFICATE_NOT_VERIFIED",
      "httpStatus": 409,
      "errors": [
        {
          "pointer": "/delivery",
          "code": "CERTIFICATE_NOT_VERIFIED",
          "detail": "补齐本意图真实权威依据，或查询本方可见原资源"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "S6-DESIGN-12"
    }
  },
  "errorType": "trade.filing.v1.RpcFailure",
  "httpErrorType": "trade.filing.v1.HttpProblem"
}
```

## s6-receipt-create · CreateTaxProofReceipt

A独立接收核对或提出异议，绑定原交付和证明版，不默认确认

```http
POST /api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/receipts
Authorization: <INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>
Content-Type: application/json
Idempotency-Key: d7060000-0000-4000-8000-000000000014
If-Match: "s6-case-1"
X-Confirmation-Id: <INVALID-EXACT-INTENT-CONFIRMATION>

{
  "deliveryEventNumber": "SYNTHETIC-NOT-DELIVERED",
  "certificateVersion": {
    "fileNumber": "FILE-S6-SYNTHETIC-001",
    "versionId": "SYNTHETIC-NOT-STORED",
    "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
    "purposeCode": 22
  },
  "outcome": "RECEIPT_OUTCOME_CHECKED",
  "reason": "负例：无正式证明及交付不得完成核对",
  "receiptEvidence": {
    "fileNumber": "FILE-S6-SYNTHETIC-001",
    "versionId": "SYNTHETIC-NOT-STORED",
    "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
    "purposeCode": 23
  }
}
```

### RESPONSE

```http
HTTP/1.1 409 Conflict
Content-Type: application/problem+json
Cache-Control: no-store
X-Request-Id: S6-DESIGN-13

{
  "type": "urn:trade:problem:certificate_not_verified",
  "title": "CERTIFICATE_NOT_VERIFIED",
  "status": 409,
  "detail": "合成输入缺正式证据；必须阻断，不是官方成功",
  "instance": "/api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/receipts",
  "errors": [
    {
      "pointer": "/receipt",
      "code": "CERTIFICATE_NOT_VERIFIED",
      "detail": "补齐本意图真实权威依据，或查询本方可见原资源"
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
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/receipts" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7060000-0000-4000-8000-000000000014' \
  --header 'If-Match: "s6-case-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"deliveryEventNumber":"SYNTHETIC-NOT-DELIVERED","certificateVersion":{"fileNumber":"FILE-S6-SYNTHETIC-001","versionId":"SYNTHETIC-NOT-STORED","sha256":"5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6","purposeCode":22},"outcome":"RECEIPT_OUTCOME_CHECKED","reason":"负例：无正式证明及交付不得完成核对","receiptEvidence":{"fileNumber":"FILE-S6-SYNTHETIC-001","versionId":"SYNTHETIC-NOT-STORED","sha256":"5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6","purposeCode":23}}'
```

### RPC

```json
{
  "designOnly": true,
  "service": "trade.taxproof.v1.ExternalTaxProofService",
  "method": "CreateTaxProofReceipt",
  "requestType": "CreateTaxProofReceiptReqMsg",
  "responseType": "CreateTaxProofReceiptRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>",
    "idempotency-key": "d7060000-0000-4000-8000-000000000014",
    "if-match": "\"s6-case-1\"",
    "confirmation-id": "<INVALID-EXACT-INTENT-CONFIRMATION>"
  },
  "request": {
    "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
    "receipt": {
      "deliveryEventNumber": "SYNTHETIC-NOT-DELIVERED",
      "certificateVersion": {
        "fileNumber": "FILE-S6-SYNTHETIC-001",
        "versionId": "SYNTHETIC-NOT-STORED",
        "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
        "purposeCode": 22
      },
      "outcome": "RECEIPT_OUTCOME_CHECKED",
      "reason": "负例：无正式证明及交付不得完成核对",
      "receiptEvidence": {
        "fileNumber": "FILE-S6-SYNTHETIC-001",
        "versionId": "SYNTHETIC-NOT-STORED",
        "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
        "purposeCode": 23
      }
    }
  },
  "successTrailers": {},
  "error": {
    "code": "FAILED_PRECONDITION",
    "details": {
      "code": "CERTIFICATE_NOT_VERIFIED",
      "httpStatus": 409,
      "errors": [
        {
          "pointer": "/receipt",
          "code": "CERTIFICATE_NOT_VERIFIED",
          "detail": "补齐本意图真实权威依据，或查询本方可见原资源"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "S6-DESIGN-13"
    }
  },
  "errorType": "trade.filing.v1.RpcFailure",
  "httpErrorType": "trade.filing.v1.HttpProblem"
}
```

## s6-disposition-create · CreateTaxProofObjectionDisposition

实质解决A异议；需官方更正时等待新正式证据，不能内部清掉异议

```http
POST /internal/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/objection-dispositions
Authorization: <INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>
Content-Type: application/json
Idempotency-Key: d7060000-0000-4000-8000-000000000015
If-Match: "s6-case-1"
X-Confirmation-Id: <INVALID-EXACT-INTENT-CONFIRMATION>

{
  "objectionEventNumber": "SYNTHETIC-OBJECTION",
  "dispositionEvidence": [
    {
      "fileNumber": "FILE-S6-SYNTHETIC-001",
      "versionId": "SYNTHETIC-NOT-STORED",
      "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
      "purposeCode": 22
    }
  ],
  "resolution": "缺正式更正证据，不能实质关闭"
}
```

### RESPONSE

```http
HTTP/1.1 409 Conflict
Content-Type: application/problem+json
Cache-Control: no-store
X-Request-Id: S6-DESIGN-14

{
  "type": "urn:trade:problem:objection_unresolved",
  "title": "OBJECTION_UNRESOLVED",
  "status": 409,
  "detail": "合成输入缺正式证据；必须阻断，不是官方成功",
  "instance": "/internal/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/objection-dispositions",
  "errors": [
    {
      "pointer": "/disposition",
      "code": "OBJECTION_UNRESOLVED",
      "detail": "补齐本意图真实权威依据，或查询本方可见原资源"
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
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/objection-dispositions" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: d7060000-0000-4000-8000-000000000015' \
  --header 'If-Match: "s6-case-1"' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"objectionEventNumber":"SYNTHETIC-OBJECTION","dispositionEvidence":[{"fileNumber":"FILE-S6-SYNTHETIC-001","versionId":"SYNTHETIC-NOT-STORED","sha256":"5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6","purposeCode":22}],"resolution":"缺正式更正证据，不能实质关闭"}'
```

### RPC

```json
{
  "designOnly": true,
  "service": "trade.taxproof.v1.InternalTaxProofOperationsService",
  "method": "CreateTaxProofObjectionDisposition",
  "requestType": "CreateTaxProofObjectionDispositionReqMsg",
  "responseType": "CreateTaxProofObjectionDispositionRspMsg",
  "deadlineMs": 10000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>",
    "idempotency-key": "d7060000-0000-4000-8000-000000000015",
    "if-match": "\"s6-case-1\"",
    "confirmation-id": "<INVALID-EXACT-INTENT-CONFIRMATION>"
  },
  "request": {
    "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
    "disposition": {
      "objectionEventNumber": "SYNTHETIC-OBJECTION",
      "dispositionEvidence": [
        {
          "fileNumber": "FILE-S6-SYNTHETIC-001",
          "versionId": "SYNTHETIC-NOT-STORED",
          "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
          "purposeCode": 22
        }
      ],
      "resolution": "缺正式更正证据，不能实质关闭"
    }
  },
  "successTrailers": {},
  "error": {
    "code": "FAILED_PRECONDITION",
    "details": {
      "code": "OBJECTION_UNRESOLVED",
      "httpStatus": 409,
      "errors": [
        {
          "pointer": "/disposition",
          "code": "OBJECTION_UNRESOLVED",
          "detail": "补齐本意图真实权威依据，或查询本方可见原资源"
        }
      ],
      "retryable": false,
      "retryAfterMs": 0,
      "outcomeUnknown": false,
      "requestReference": "S6-DESIGN-14"
    }
  },
  "errorType": "trade.filing.v1.RpcFailure",
  "httpErrorType": "trade.filing.v1.HttpProblem"
}
```

## s6-history · GetTaxProofHistory

读取旧版、事件、补正链、交付接收及原受理回执，不覆盖历史

```http
GET /api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/history
Authorization: <INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>

```

### RESPONSE

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
X-Request-Id: S6-DESIGN-15
ETag: "s6-case-1"

{
  "submissions": [
    {
      "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
      "submissionRevisionNumber": 1,
      "packageHash": "3b5ee87dbb5bc24073fa2d44b7ecb458f1a9ad9d1a632ed9a992204da547824d",
      "content": {
        "tradeRevisionNumber": 1,
        "scopeRule": {
          "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
          "ruleVersion": "1",
          "authorityEvidence": {
            "fileNumber": "FILE-S6-SYNTHETIC-001",
            "versionId": "SYNTHETIC-NOT-STORED",
            "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
            "purposeCode": 21
          }
        },
        "responsibilityRule": {
          "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
          "ruleVersion": "1",
          "authorityEvidence": {
            "fileNumber": "FILE-S6-SYNTHETIC-001",
            "versionId": "SYNTHETIC-NOT-STORED",
            "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
            "purposeCode": 21
          }
        },
        "deadlineRule": {
          "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
          "ruleVersion": "1",
          "authorityEvidence": {
            "fileNumber": "FILE-S6-SYNTHETIC-001",
            "versionId": "SYNTHETIC-NOT-STORED",
            "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
            "purposeCode": 21
          }
        },
        "scopeItems": [
          {
            "declarationNumber": "SYNTHETIC-NOT-OFFICIAL-DECLARATION",
            "declarationRevisionNumber": 1,
            "goodsItemSequence": 1,
            "quantity": "10.000000",
            "unitCode": "PCS",
            "officialDeclaration": {
              "fileNumber": "FILE-S6-SYNTHETIC-001",
              "versionId": "SYNTHETIC-NOT-STORED",
              "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
              "purposeCode": 20
            }
          }
        ],
        "materialVersions": [
          {
            "fileNumber": "FILE-S6-SYNTHETIC-001",
            "versionId": "SYNTHETIC-NOT-STORED",
            "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
            "purposeCode": 22
          }
        ],
        "preparationNote": "仅内部合成准备；正式职责、范围、渠道未确认"
      },
      "executionStatus": "not_sent",
      "etag": "\"s6-case-1\""
    }
  ],
  "events": [
    {
      "eventNumber": "S6-SYNTHETIC-REVIEW",
      "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
      "submissionRevisionNumber": 1,
      "actorReference": "SYNTHETIC-INDEPENDENT-REVIEWER",
      "review": {
        "submissionRevisionNumber": 1,
        "packageHash": "3b5ee87dbb5bc24073fa2d44b7ecb458f1a9ad9d1a632ed9a992204da547824d",
        "outcome": "REVIEW_OUTCOME_RETURNED",
        "reason": "职责/范围/渠道未确认，退回备料，不得正式申请"
      },
      "etag": "\"s6-case-1\""
    }
  ],
  "etag": "\"s6-case-1\""
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/history" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

### RPC

```json
{
  "designOnly": true,
  "service": "trade.taxproof.v1.ExternalTaxProofService",
  "method": "GetTaxProofHistory",
  "requestType": "GetTaxProofHistoryReqMsg",
  "responseType": "GetTaxProofHistoryRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>"
  },
  "request": {
    "taxCaseNumber": "TPC-S6-SYNTHETIC-001"
  },
  "response": {
    "resource": {
      "submissions": [
        {
          "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
          "submissionRevisionNumber": 1,
          "packageHash": "3b5ee87dbb5bc24073fa2d44b7ecb458f1a9ad9d1a632ed9a992204da547824d",
          "content": {
            "tradeRevisionNumber": 1,
            "scopeRule": {
              "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
              "ruleVersion": "1",
              "authorityEvidence": {
                "fileNumber": "FILE-S6-SYNTHETIC-001",
                "versionId": "SYNTHETIC-NOT-STORED",
                "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
                "purposeCode": 21
              }
            },
            "responsibilityRule": {
              "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
              "ruleVersion": "1",
              "authorityEvidence": {
                "fileNumber": "FILE-S6-SYNTHETIC-001",
                "versionId": "SYNTHETIC-NOT-STORED",
                "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
                "purposeCode": 21
              }
            },
            "deadlineRule": {
              "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
              "ruleVersion": "1",
              "authorityEvidence": {
                "fileNumber": "FILE-S6-SYNTHETIC-001",
                "versionId": "SYNTHETIC-NOT-STORED",
                "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
                "purposeCode": 21
              }
            },
            "scopeItems": [
              {
                "declarationNumber": "SYNTHETIC-NOT-OFFICIAL-DECLARATION",
                "declarationRevisionNumber": 1,
                "goodsItemSequence": 1,
                "quantity": "10.000000",
                "unitCode": "PCS",
                "officialDeclaration": {
                  "fileNumber": "FILE-S6-SYNTHETIC-001",
                  "versionId": "SYNTHETIC-NOT-STORED",
                  "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
                  "purposeCode": 20
                }
              }
            ],
            "materialVersions": [
              {
                "fileNumber": "FILE-S6-SYNTHETIC-001",
                "versionId": "SYNTHETIC-NOT-STORED",
                "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
                "purposeCode": 22
              }
            ],
            "preparationNote": "仅内部合成准备；正式职责、范围、渠道未确认"
          },
          "executionStatus": "not_sent",
          "etag": "\"s6-case-1\""
        }
      ],
      "events": [
        {
          "eventNumber": "S6-SYNTHETIC-REVIEW",
          "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
          "submissionRevisionNumber": 1,
          "actorReference": "SYNTHETIC-INDEPENDENT-REVIEWER",
          "review": {
            "submissionRevisionNumber": 1,
            "packageHash": "3b5ee87dbb5bc24073fa2d44b7ecb458f1a9ad9d1a632ed9a992204da547824d",
            "outcome": "REVIEW_OUTCOME_RETURNED",
            "reason": "职责/范围/渠道未确认，退回备料，不得正式申请"
          },
          "etag": "\"s6-case-1\""
        }
      ],
      "etag": "\"s6-case-1\""
    }
  },
  "successTrailers": {}
}
```

## s6-result · GetTaxProofCommandResult

以原调用者/受众/幂等键恢复原受理；现权限复核后回放非最新业务状态

```http
GET /api/v1/tax-proof-command-results/d7060000-0000-4000-8000-000000000001
Authorization: <INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>

```

### RESPONSE

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
X-Request-Id: S6-DESIGN-16
ETag: "s6-case-1"

{
  "requestKey": "d7060000-0000-4000-8000-000000000001",
  "acceptanceReference": "S6-SYNTHETIC-ORIGINAL",
  "resourceLocation": "/api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/submissions/1",
  "originalEtag": "\"s6-case-1\"",
  "submission": {
    "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
    "submissionRevisionNumber": 1,
    "packageHash": "3b5ee87dbb5bc24073fa2d44b7ecb458f1a9ad9d1a632ed9a992204da547824d",
    "content": {
      "tradeRevisionNumber": 1,
      "scopeRule": {
        "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
        "ruleVersion": "1",
        "authorityEvidence": {
          "fileNumber": "FILE-S6-SYNTHETIC-001",
          "versionId": "SYNTHETIC-NOT-STORED",
          "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
          "purposeCode": 21
        }
      },
      "responsibilityRule": {
        "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
        "ruleVersion": "1",
        "authorityEvidence": {
          "fileNumber": "FILE-S6-SYNTHETIC-001",
          "versionId": "SYNTHETIC-NOT-STORED",
          "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
          "purposeCode": 21
        }
      },
      "deadlineRule": {
        "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
        "ruleVersion": "1",
        "authorityEvidence": {
          "fileNumber": "FILE-S6-SYNTHETIC-001",
          "versionId": "SYNTHETIC-NOT-STORED",
          "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
          "purposeCode": 21
        }
      },
      "scopeItems": [
        {
          "declarationNumber": "SYNTHETIC-NOT-OFFICIAL-DECLARATION",
          "declarationRevisionNumber": 1,
          "goodsItemSequence": 1,
          "quantity": "10.000000",
          "unitCode": "PCS",
          "officialDeclaration": {
            "fileNumber": "FILE-S6-SYNTHETIC-001",
            "versionId": "SYNTHETIC-NOT-STORED",
            "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
            "purposeCode": 20
          }
        }
      ],
      "materialVersions": [
        {
          "fileNumber": "FILE-S6-SYNTHETIC-001",
          "versionId": "SYNTHETIC-NOT-STORED",
          "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
          "purposeCode": 22
        }
      ],
      "preparationNote": "仅内部合成准备；正式职责、范围、渠道未确认"
    },
    "executionStatus": "not_sent",
    "etag": "\"s6-case-1\""
  }
}
```

```bash
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/tax-proof-command-results/d7060000-0000-4000-8000-000000000001" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

### RPC

```json
{
  "designOnly": true,
  "service": "trade.taxproof.v1.ExternalTaxProofService",
  "method": "GetTaxProofCommandResult",
  "requestType": "GetTaxProofCommandResultReqMsg",
  "responseType": "GetTaxProofCommandResultRspMsg",
  "deadlineMs": 5000,
  "metadata": {
    "authorization": "<INVALID-SYNTHETIC-EXTERNAL-CREDENTIAL>"
  },
  "request": {
    "requestKey": "d7060000-0000-4000-8000-000000000001"
  },
  "response": {
    "resource": {
      "requestKey": "d7060000-0000-4000-8000-000000000001",
      "acceptanceReference": "S6-SYNTHETIC-ORIGINAL",
      "resourceLocation": "/api/v1/tax-proof-cases/TPC-S6-SYNTHETIC-001/submissions/1",
      "originalEtag": "\"s6-case-1\"",
      "submission": {
        "taxCaseNumber": "TPC-S6-SYNTHETIC-001",
        "submissionRevisionNumber": 1,
        "packageHash": "3b5ee87dbb5bc24073fa2d44b7ecb458f1a9ad9d1a632ed9a992204da547824d",
        "content": {
          "tradeRevisionNumber": 1,
          "scopeRule": {
            "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
            "ruleVersion": "1",
            "authorityEvidence": {
              "fileNumber": "FILE-S6-SYNTHETIC-001",
              "versionId": "SYNTHETIC-NOT-STORED",
              "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
              "purposeCode": 21
            }
          },
          "responsibilityRule": {
            "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
            "ruleVersion": "1",
            "authorityEvidence": {
              "fileNumber": "FILE-S6-SYNTHETIC-001",
              "versionId": "SYNTHETIC-NOT-STORED",
              "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
              "purposeCode": 21
            }
          },
          "deadlineRule": {
            "ruleReference": "SYNTHETIC-INTERNAL-PREPARATION-ONLY",
            "ruleVersion": "1",
            "authorityEvidence": {
              "fileNumber": "FILE-S6-SYNTHETIC-001",
              "versionId": "SYNTHETIC-NOT-STORED",
              "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
              "purposeCode": 21
            }
          },
          "scopeItems": [
            {
              "declarationNumber": "SYNTHETIC-NOT-OFFICIAL-DECLARATION",
              "declarationRevisionNumber": 1,
              "goodsItemSequence": 1,
              "quantity": "10.000000",
              "unitCode": "PCS",
              "officialDeclaration": {
                "fileNumber": "FILE-S6-SYNTHETIC-001",
                "versionId": "SYNTHETIC-NOT-STORED",
                "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
                "purposeCode": 20
              }
            }
          ],
          "materialVersions": [
            {
              "fileNumber": "FILE-S6-SYNTHETIC-001",
              "versionId": "SYNTHETIC-NOT-STORED",
              "sha256": "5358baeb3a0ed044f9737c03a81b05fc3d419f700e2c695eb945e0804a89ecc6",
              "purposeCode": 22
            }
          ],
          "preparationNote": "仅内部合成准备；正式职责、范围、渠道未确认"
        },
        "executionStatus": "not_sent",
        "etag": "\"s6-case-1\""
      }
    }
  },
  "successTrailers": {}
}
```
