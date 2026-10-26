# 步骤二HTTP响应与cURL示例

每例为独立未执行推演；必须先满足当前资源状态、权限和真实签署/官方证据。不含真实签名或有效凭据，不能顺序运行假装完成全流程。替换部署BASE_URL及受众对应凭证，获取匹配每例正文/原键/标签的新确认；不自动重试未知写入。

## GetTradeContractBasis

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/trades/TRD-S2-DEMO-001/contract-basis" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s2-trade-r4-approved-v6"

{
  "tradeNumber": "TRD-S2-DEMO-001",
  "approvedTradeRevision": 4,
  "approvedSnapshotNumber": "SNP-S2-DEMO-APPROVED-001",
  "supplierFiling": {
    "supplier": {
      "legalName": "示例供应商",
      "countryCode": "CN",
      "registeredAddress": "合成注册地址，非真实地点",
      "contactName": "合成联系人",
      "contactPhone": "DEMO-NOT-A-PHONE",
      "contactEmail": "demo@example.invalid",
      "identityProtectedReference": "DEMO-IDENTITY-SUPPLIER"
    },
    "consignee": {
      "party": {
        "legalName": "Example Consignee",
        "countryCode": "SG",
        "registeredAddress": "合成注册地址，非真实地点",
        "contactName": "合成联系人",
        "contactPhone": "DEMO-NOT-A-PHONE",
        "contactEmail": "demo@example.invalid",
        "identityProtectedReference": "DEMO-IDENTITY-CONSIGNEE"
      },
      "deliveryAddress": "Synthetic delivery location",
      "deliveryArrangements": "合成收货安排"
    },
    "salesContractNumber": "SC-DEMO-001",
    "invoiceNumber": "CI-DEMO-001",
    "packingListNumber": "PL-DEMO-001",
    "goods": [
      {
        "itemSequenceNumber": 1,
        "productName": "展示用金属支架",
        "specification": "DEMO-M1",
        "quantity": "100",
        "unitCode": "PCS",
        "unitPrice": {
          "amount": "125.00",
          "currencyCode": "CNY"
        },
        "total": {
          "amount": "12500.00",
          "currencyCode": "CNY"
        },
        "originCountryCode": "CN"
      }
    ],
    "packing": [
      {
        "goodsItemSequenceNumber": 1,
        "quantity": "100",
        "unitCode": "PCS",
        "cartons": 10,
        "netWeightKg": "100.000",
        "grossWeightKg": "120.000"
      }
    ],
    "materials": [
      {
        "purpose": "MATERIAL_PURPOSE_SALES_CONTRACT",
        "logicalFileNumber": "FILE-S1-DEMO-001",
        "revisionNumber": 1,
        "sha256": "77ca371c4895a5272f9e9bf6aa1805ccd4978aa25b05db54f6e67cfbe241f284",
        "htmlAnchor": "sales-contract"
      },
      {
        "purpose": "MATERIAL_PURPOSE_COMMERCIAL_INVOICE",
        "logicalFileNumber": "FILE-S1-DEMO-001",
        "revisionNumber": 1,
        "sha256": "77ca371c4895a5272f9e9bf6aa1805ccd4978aa25b05db54f6e67cfbe241f284",
        "htmlAnchor": "commercial-invoice"
      },
      {
        "purpose": "MATERIAL_PURPOSE_PACKING_LIST",
        "logicalFileNumber": "FILE-S1-DEMO-001",
        "revisionNumber": 1,
        "sha256": "77ca371c4895a5272f9e9bf6aa1805ccd4978aa25b05db54f6e67cfbe241f284",
        "htmlAnchor": "packing-list"
      }
    ],
    "contractTotal": {
      "amount": "12500.00",
      "currencyCode": "CNY"
    },
    "invoiceTotal": {
      "amount": "12500.00",
      "currencyCode": "CNY"
    },
    "sourceContentsConfirmed": true,
    "exportAgent": {
      "party": {
        "legalName": "示例出口代理",
        "countryCode": "CN",
        "registeredAddress": "合成注册地址，非真实地点",
        "contactName": "合成联系人",
        "contactPhone": "DEMO-NOT-A-PHONE",
        "contactEmail": "demo@example.invalid",
        "identityProtectedReference": "DEMO-IDENTITY-EXPORT-AGENT"
      },
      "serviceScope": "合成代理出口范围",
      "agreedInstructions": "供应商事先沟通后填写的代理指示",
      "exportAgentDetails": {
        "receiptPath": "合成受限人民币收款路径，实际账户须核实",
        "paymentPath": "合成向供应商人民币付款路径，实际账户须核实",
        "paymentBranchCode": 1
      }
    },
    "logisticsProvider": {
      "party": {
        "legalName": "示例物流公司",
        "countryCode": "CN",
        "registeredAddress": "合成注册地址，非真实地点",
        "contactName": "合成联系人",
        "contactPhone": "DEMO-NOT-A-PHONE",
        "contactEmail": "demo@example.invalid",
        "identityProtectedReference": "DEMO-IDENTITY-LOGISTICS"
      },
      "serviceScope": "合成运输范围",
      "agreedInstructions": "供应商事先沟通后填写；具体运输工具尚待确定"
    },
    "customsBroker": {
      "party": {
        "legalName": "示例出口报关代理",
        "countryCode": "CN",
        "registeredAddress": "合成注册地址，非真实地点",
        "contactName": "合成联系人",
        "contactPhone": "DEMO-NOT-A-PHONE",
        "contactEmail": "demo@example.invalid",
        "identityProtectedReference": "DEMO-IDENTITY-CUSTOMS"
      },
      "serviceScope": "合成报关服务范围",
      "agreedInstructions": "供应商事先沟通后填写；本例无真实资质证明",
      "customsDetails": {
        "qualification": {
          "purpose": "MATERIAL_PURPOSE_CUSTOMS_QUALIFICATION",
          "logicalFileNumber": "FILE-S2-QUALIFICATION",
          "revisionNumber": 1,
          "sha256": "ac8d5734d4089657c9de6f987ea5b31f1fecc9dd14cabc1d1199007af6ef7952"
        },
        "quotedAmount": {
          "amount": "100.00",
          "currencyCode": "CNY"
        },
        "pricingBasis": "合成单笔报价计价说明，不代表真实约定",
        "quotation": {
          "purpose": "MATERIAL_PURPOSE_CUSTOMS_QUOTATION",
          "logicalFileNumber": "FILE-S2-QUOTATION",
          "revisionNumber": 1,
          "sha256": "b1d57f7dd3fc422bafb55e3bdd4866422fb424c27bec307962cd902ab0e661d4"
        }
      }
    },
    "nominatedPayerProtectedReference": "DEMO-IDENTITY-CONSIGNEE"
  },
  "etag": "\"s2-trade-r4-approved-v6\"",
  "currentEvidence": {
    "agreementApplications": [],
    "customsAuthorizations": [],
    "customsAgentRecognitions": []
  }
}
```

## GetTradeReviewContext

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S2-DEMO-001/review-context?submitted_snapshot_number=SNP-S2-SUBMITTED-001" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s2-trade-r4-review-v5"

{
  "tradeNumber": "TRD-S2-DEMO-001",
  "tradeRevision": 4,
  "lifecycle": "reviewing",
  "supplierFiling": {
    "supplier": {
      "legalName": "示例供应商",
      "countryCode": "CN",
      "registeredAddress": "合成注册地址，非真实地点",
      "contactName": "合成联系人",
      "contactPhone": "DEMO-NOT-A-PHONE",
      "contactEmail": "demo@example.invalid",
      "identityProtectedReference": "DEMO-IDENTITY-SUPPLIER"
    },
    "consignee": {
      "party": {
        "legalName": "Example Consignee",
        "countryCode": "SG",
        "registeredAddress": "合成注册地址，非真实地点",
        "contactName": "合成联系人",
        "contactPhone": "DEMO-NOT-A-PHONE",
        "contactEmail": "demo@example.invalid",
        "identityProtectedReference": "DEMO-IDENTITY-CONSIGNEE"
      },
      "deliveryAddress": "Synthetic delivery location",
      "deliveryArrangements": "合成收货安排"
    },
    "salesContractNumber": "SC-DEMO-001",
    "invoiceNumber": "CI-DEMO-001",
    "packingListNumber": "PL-DEMO-001",
    "goods": [
      {
        "itemSequenceNumber": 1,
        "productName": "展示用金属支架",
        "specification": "DEMO-M1",
        "quantity": "100",
        "unitCode": "PCS",
        "unitPrice": {
          "amount": "125.00",
          "currencyCode": "CNY"
        },
        "total": {
          "amount": "12500.00",
          "currencyCode": "CNY"
        },
        "originCountryCode": "CN"
      }
    ],
    "packing": [
      {
        "goodsItemSequenceNumber": 1,
        "quantity": "100",
        "unitCode": "PCS",
        "cartons": 10,
        "netWeightKg": "100.000",
        "grossWeightKg": "120.000"
      }
    ],
    "materials": [
      {
        "purpose": "MATERIAL_PURPOSE_SALES_CONTRACT",
        "logicalFileNumber": "FILE-S1-DEMO-001",
        "revisionNumber": 1,
        "sha256": "77ca371c4895a5272f9e9bf6aa1805ccd4978aa25b05db54f6e67cfbe241f284",
        "htmlAnchor": "sales-contract"
      },
      {
        "purpose": "MATERIAL_PURPOSE_COMMERCIAL_INVOICE",
        "logicalFileNumber": "FILE-S1-DEMO-001",
        "revisionNumber": 1,
        "sha256": "77ca371c4895a5272f9e9bf6aa1805ccd4978aa25b05db54f6e67cfbe241f284",
        "htmlAnchor": "commercial-invoice"
      },
      {
        "purpose": "MATERIAL_PURPOSE_PACKING_LIST",
        "logicalFileNumber": "FILE-S1-DEMO-001",
        "revisionNumber": 1,
        "sha256": "77ca371c4895a5272f9e9bf6aa1805ccd4978aa25b05db54f6e67cfbe241f284",
        "htmlAnchor": "packing-list"
      }
    ],
    "contractTotal": {
      "amount": "12500.00",
      "currencyCode": "CNY"
    },
    "invoiceTotal": {
      "amount": "12500.00",
      "currencyCode": "CNY"
    },
    "sourceContentsConfirmed": true,
    "exportAgent": {
      "party": {
        "legalName": "示例出口代理",
        "countryCode": "CN",
        "registeredAddress": "合成注册地址，非真实地点",
        "contactName": "合成联系人",
        "contactPhone": "DEMO-NOT-A-PHONE",
        "contactEmail": "demo@example.invalid",
        "identityProtectedReference": "DEMO-IDENTITY-EXPORT-AGENT"
      },
      "serviceScope": "合成代理出口范围",
      "agreedInstructions": "供应商事先沟通后填写的代理指示",
      "exportAgentDetails": {
        "receiptPath": "合成受限人民币收款路径，实际账户须核实",
        "paymentPath": "合成向供应商人民币付款路径，实际账户须核实",
        "paymentBranchCode": 1
      }
    },
    "logisticsProvider": {
      "party": {
        "legalName": "示例物流公司",
        "countryCode": "CN",
        "registeredAddress": "合成注册地址，非真实地点",
        "contactName": "合成联系人",
        "contactPhone": "DEMO-NOT-A-PHONE",
        "contactEmail": "demo@example.invalid",
        "identityProtectedReference": "DEMO-IDENTITY-LOGISTICS"
      },
      "serviceScope": "合成运输范围",
      "agreedInstructions": "供应商事先沟通后填写；具体运输工具尚待确定"
    },
    "customsBroker": {
      "party": {
        "legalName": "示例出口报关代理",
        "countryCode": "CN",
        "registeredAddress": "合成注册地址，非真实地点",
        "contactName": "合成联系人",
        "contactPhone": "DEMO-NOT-A-PHONE",
        "contactEmail": "demo@example.invalid",
        "identityProtectedReference": "DEMO-IDENTITY-CUSTOMS"
      },
      "serviceScope": "合成报关服务范围",
      "agreedInstructions": "供应商事先沟通后填写；本例无真实资质证明",
      "customsDetails": {
        "qualification": {
          "purpose": "MATERIAL_PURPOSE_CUSTOMS_QUALIFICATION",
          "logicalFileNumber": "FILE-S2-QUALIFICATION",
          "revisionNumber": 1,
          "sha256": "ac8d5734d4089657c9de6f987ea5b31f1fecc9dd14cabc1d1199007af6ef7952"
        },
        "quotedAmount": {
          "amount": "100.00",
          "currencyCode": "CNY"
        },
        "pricingBasis": "合成单笔报价计价说明，不代表真实约定",
        "quotation": {
          "purpose": "MATERIAL_PURPOSE_CUSTOMS_QUOTATION",
          "logicalFileNumber": "FILE-S2-QUOTATION",
          "revisionNumber": 1,
          "sha256": "b1d57f7dd3fc422bafb55e3bdd4866422fb424c27bec307962cd902ab0e661d4"
        }
      }
    },
    "nominatedPayerProtectedReference": "DEMO-IDENTITY-CONSIGNEE"
  },
  "payerFiling": {
    "payer": {
      "legalName": "Example Consignee",
      "countryCode": "SG",
      "registeredAddress": "合成注册地址，非真实地点",
      "contactName": "合成联系人",
      "contactPhone": "DEMO-NOT-A-PHONE",
      "contactEmail": "demo@example.invalid",
      "identityProtectedReference": "DEMO-IDENTITY-CONSIGNEE"
    },
    "relationship": "PAYER_RELATIONSHIP_SAME_LEGAL_ENTITY",
    "paymentPurpose": "支付本笔合成出口交易货款",
    "relationshipEvidence": [],
    "sourceContentsConfirmed": true
  },
  "missingItems": [],
  "submittedSnapshotNumber": "SNP-S2-SUBMITTED-001",
  "etag": "\"s2-trade-r4-review-v5\"",
  "evidence": {
    "agreementApplications": [],
    "customsAuthorizations": [],
    "customsAgentRecognitions": []
  }
}
```

## CreateTradeRevision

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S2-DEMO-001/revisions" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 0ea255d0-0000-4000-8000-000000000003' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --header 'If-Match: "s2-trade-r4-returned-v6"' \
  --data-raw '{"expectedTradeRevision":4,"reason":"终审退回后开始补充，仅打开工作版，不替供应商写资料","evidence":[]}'
```

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
ETag: "s2-trade-r5-v7"
Location: /internal/v1/trades/TRD-S2-DEMO-001/revisions/5
X-Receipt-Proof: <platform receipt; SYNTHETIC-NOT-VALID>

{
  "tradeNumber": "TRD-S2-DEMO-001",
  "tradeRevision": 5,
  "lifecycle": "editing",
  "etag": "\"s2-trade-r5-v7\""
}
```

## GetInternalContractRevision

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/internal/v1/contracts/CON-S2-DEMO-001/revisions/1" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s2-demo-working-1-state-4-v4"

{
  "contractNumber": "CON-S2-DEMO-001",
  "revisionNumber": 1,
  "status": "REVISION_STATUS_AWAITING_SIGNATURE",
  "content": {
    "tradeSnapshotNumber": "SNP-S2-DEMO-APPROVED-001",
    "parties": [
      {
        "contractPartySequence": 1,
        "partyRoleCode": 1,
        "participantSequenceNumber": 1
      },
      {
        "contractPartySequence": 2,
        "partyRoleCode": 2,
        "participantSequenceNumber": 1
      }
    ],
    "reviewFile": {
      "logicalFileNumber": "FILE-S2-REVIEW-001",
      "revisionNumber": 1,
      "sha256": "54bd82f2df4660a8d8bcdfc80f5ef9b9167f2e9a708d12b9e205d74b52f4e175",
      "documentTypeCode": 10
    },
    "effectiveFrom": "2026-10-25",
    "effectiveTo": "2027-10-25"
  },
  "etag": "\"s2-demo-working-1-state-4-v4\"",
  "currentRevisionNumber": 1,
  "signatureRequest": {
    "signatureRequestId": "SIG-S2-DEMO-001",
    "clientReference": "SIGREF-S2-DEMO-001",
    "contractNumber": "CON-S2-DEMO-001",
    "revisionNumber": 1,
    "state": "awaiting_signers",
    "attemptCount": 0,
    "lastErrorCode": "",
    "etag": "\"s2-signature-request-awaiting-signers-v2\"",
    "providerTaskReference": "NOT-A-REAL-PLATFORM-TASK"
  },
  "reviewResult": {
    "outcome": "DECISION_OUTCOME_APPROVE",
    "reason": "合成通过推演，真实审核/证据须另核实",
    "ruleVersion": "S2-RULES-1",
    "reviewedAt": "2026-10-25T08:20:00.123Z",
    "reviewerReference": "SYNTHETIC-INDEPENDENT-REVIEWER",
    "evidenceReferences": []
  }
}
```

## CreateContractTermination

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/contracts/CON-S2-DEMO-001/revisions/1/termination-decisions" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 0ea255d0-0000-4000-8000-000000000005' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --header 'If-Match: "s2-demo-working-1-state-4-v4"' \
  --data-raw '{"reasonCode":1,"reason":"未签旧工作版正式撤回，须确认无活跃或未知签署任务","legalEvidence":[{"logicalFileNumber":"REQUIRED-EXTERNAL-TERMINATION-AUTHORITY","revisionNumber":1,"sha256":"<no-real-evidence-in-this-design-fixture>","documentTypeCode":10}]}'
```

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
ETag: "s2-demo-working-1-state-8-v6"
Location: /internal/v1/contracts/CON-S2-DEMO-001/revisions/1/termination-decisions/ACCEPT-S2-REVISION_STATUS_TERMINATED-1
X-Receipt-Proof: <platform receipt; SYNTHETIC-NOT-VALID>

{
  "contractNumber": "CON-S2-DEMO-001",
  "revisionNumber": 1,
  "status": "REVISION_STATUS_TERMINATED",
  "etag": "\"s2-demo-working-1-state-8-v6\"",
  "acceptanceId": "ACCEPT-S2-REVISION_STATUS_TERMINATED-1"
}
```

## CreateInternalOperationConfirmation

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/operation-confirmations" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 0ea255d0-0000-4000-8000-000000000006' \
  --data-raw '{"method":"POST","resourcePath":"/internal/v1/trades/TRD-S2-DEMO-001/review-submissions","idempotencyKey":"0ea255d0-0000-4000-8000-000000000008","ifMatch":"\"s2-trade-r4-v4\"","bodySha256":"1a5637ef97288b6710fe2452839da52d1823509433a17c0f551299bdf7f44758"}'
```

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /internal/v1/operation-confirmations/S2-INTERNAL-CONFIRMATION-NOT-VALID

{
  "confirmationId": "S2-INTERNAL-CONFIRMATION-NOT-VALID",
  "requestDigest": "2ca15adcc98ba0d8c092516b4f51e9cb560df260be4f2f5a194a1a1a398e14a7",
  "expiresAt": "2026-10-25T08:29:00.000Z",
  "state": "available"
}
```

## GetInternalOperationConfirmation

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/internal/v1/operation-confirmations/S2-INTERNAL-CONFIRMATION-NOT-VALID" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "confirmationId": "S2-INTERNAL-CONFIRMATION-NOT-VALID",
  "requestDigest": "2ca15adcc98ba0d8c092516b4f51e9cb560df260be4f2f5a194a1a1a398e14a7",
  "expiresAt": "2026-10-25T08:29:00.000Z",
  "state": "available"
}
```

## CreateTradeReviewSubmission

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S2-DEMO-001/review-submissions" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 0ea255d0-0000-4000-8000-000000000008' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --header 'If-Match: "s2-trade-r4-v4"' \
  --data-raw '{"expectedTradeRevision":4,"supportingEvidence":[],"summary":"未执行的合成设计例；本阶段必需资料应已核实，实际步骤一库不具备此批准事实"}'
```

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
ETag: "s2-trade-r4-review-v5"
Location: /internal/v1/trades/TRD-S2-DEMO-001/review-submissions/REVIEW-S2-DEMO-001
X-Receipt-Proof: <platform receipt; SYNTHETIC-NOT-VALID>

{
  "submissionId": "REVIEW-S2-DEMO-001",
  "tradeNumber": "TRD-S2-DEMO-001",
  "tradeRevision": 4,
  "submittedSnapshotNumber": "SNP-S2-SUBMITTED-001",
  "etag": "\"s2-trade-r4-review-v5\""
}
```

## CreateTradeReviewDecision

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S2-DEMO-001/review-decisions" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 0ea255d0-0000-4000-8000-000000000009' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --header 'If-Match: "s2-trade-r4-review-v5"' \
  --data-raw '{"submissionId":"REVIEW-S2-DEMO-001","outcome":"DECISION_OUTCOME_APPROVE","reason":"仅设计推演：须由独立审核员真实核实本阶段规则后才可批准","missingItems":[]}'
```

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /internal/v1/trades/TRD-S2-DEMO-001/review-decisions/DECISION-S2-DEMO-001
X-Receipt-Proof: <platform receipt; SYNTHETIC-NOT-VALID>

{
  "decisionId": "DECISION-S2-DEMO-001",
  "tradeNumber": "TRD-S2-DEMO-001",
  "approvedSnapshotNumber": "SNP-S2-DEMO-APPROVED-001",
  "tradeRevision": 4,
  "lifecycle": "approved"
}
```

## CreateContract

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/contracts" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 0ea255d0-0000-4000-8000-000000000010' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"scope":"CONTRACT_SCOPE_PER_TRADE","purpose":"CONTRACT_PURPOSE_EXPORT_AGENCY","tradeNumber":"TRD-S2-DEMO-001","content":{"tradeSnapshotNumber":"SNP-S2-DEMO-APPROVED-001","parties":[{"contractPartySequence":1,"partyRoleCode":1,"participantSequenceNumber":1},{"contractPartySequence":2,"partyRoleCode":2,"participantSequenceNumber":1}],"reviewFile":{"logicalFileNumber":"FILE-S2-REVIEW-001","revisionNumber":1,"sha256":"54bd82f2df4660a8d8bcdfc80f5ef9b9167f2e9a708d12b9e205d74b52f4e175","documentTypeCode":10},"effectiveFrom":"2026-10-25","effectiveTo":"2027-10-25"}}'
```

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
ETag: "s2-demo-working-1-state-1-v1"
Location: /api/v1/contracts/CON-S2-DEMO-001
X-Receipt-Proof: <platform receipt; SYNTHETIC-NOT-VALID>

{
  "contractNumber": "CON-S2-DEMO-001",
  "scope": "CONTRACT_SCOPE_PER_TRADE",
  "purpose": "CONTRACT_PURPOSE_EXPORT_AGENCY",
  "tradeNumber": "TRD-S2-DEMO-001",
  "currentRevisionNumber": 1,
  "etag": "\"s2-demo-working-1-state-1-v1\""
}
```

## GetContract

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/contracts/CON-S2-DEMO-001" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s2-demo-working-1-state-1-v1"

{
  "contractNumber": "CON-S2-DEMO-001",
  "scope": "CONTRACT_SCOPE_PER_TRADE",
  "purpose": "CONTRACT_PURPOSE_EXPORT_AGENCY",
  "tradeNumber": "TRD-S2-DEMO-001",
  "currentRevisionNumber": 1,
  "etag": "\"s2-demo-working-1-state-1-v1\""
}
```

## GetContractRevision

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/contracts/CON-S2-DEMO-001/revisions/1" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s2-demo-working-1-state-3-v4"

{
  "contractNumber": "CON-S2-DEMO-001",
  "revisionNumber": 1,
  "status": "REVISION_STATUS_RETURNED",
  "content": {
    "tradeSnapshotNumber": "SNP-S2-DEMO-APPROVED-001",
    "parties": [
      {
        "contractPartySequence": 1,
        "partyRoleCode": 1,
        "participantSequenceNumber": 1
      },
      {
        "contractPartySequence": 2,
        "partyRoleCode": 2,
        "participantSequenceNumber": 1
      }
    ],
    "reviewFile": {
      "logicalFileNumber": "FILE-S2-REVIEW-001",
      "revisionNumber": 1,
      "sha256": "54bd82f2df4660a8d8bcdfc80f5ef9b9167f2e9a708d12b9e205d74b52f4e175",
      "documentTypeCode": 10
    },
    "effectiveFrom": "2026-10-25",
    "effectiveTo": "2027-10-25"
  },
  "etag": "\"s2-demo-working-1-state-3-v4\"",
  "currentRevisionNumber": 1,
  "reviewResult": {
    "outcome": "DECISION_OUTCOME_RETURN",
    "reason": "合成补正意见：补齐正文范围与正式授权对应关系",
    "ruleVersion": "S2-RULES-1",
    "reviewedAt": "2026-10-25T08:20:00.123Z",
    "reviewerReference": "SYNTHETIC-INDEPENDENT-REVIEWER",
    "evidenceReferences": []
  }
}
```

## ReplaceContractDraft

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request PUT "${BASE_URL:?Set BASE_URL}/api/v1/contracts/CON-S2-DEMO-001/revisions/1" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 0ea255d0-0000-4000-8000-000000000013' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --header 'If-Match: "s2-demo-working-1-state-1-v1"' \
  --data-raw '{"tradeSnapshotNumber":"SNP-S2-DEMO-APPROVED-001","parties":[{"contractPartySequence":1,"partyRoleCode":1,"participantSequenceNumber":1},{"contractPartySequence":2,"partyRoleCode":2,"participantSequenceNumber":1}],"reviewFile":{"logicalFileNumber":"FILE-S2-REVIEW-001","revisionNumber":1,"sha256":"54bd82f2df4660a8d8bcdfc80f5ef9b9167f2e9a708d12b9e205d74b52f4e175","documentTypeCode":10},"effectiveFrom":"2026-10-25","effectiveTo":"2027-10-25"}'
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s2-demo-working-1-state-1-v2"
X-Receipt-Proof: <platform receipt; SYNTHETIC-NOT-VALID>

{
  "contractNumber": "CON-S2-DEMO-001",
  "revisionNumber": 1,
  "status": "REVISION_STATUS_DRAFT",
  "etag": "\"s2-demo-working-1-state-1-v2\"",
  "acceptanceId": "ACCEPT-S2-REVISION_STATUS_DRAFT-1"
}
```

## CreateContractRevision

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/contracts/CON-S2-DEMO-001/revisions" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 0ea255d0-0000-4000-8000-000000000014' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --header 'If-Match: "s2-demo-working-1-state-3-v4"' \
  --data-raw '{"previousWorkingRevision":1,"correctionReason":"仅推演：正式任务已查清，待补条款另起版","content":{"tradeSnapshotNumber":"SNP-S2-DEMO-APPROVED-001","parties":[{"contractPartySequence":1,"partyRoleCode":1,"participantSequenceNumber":1},{"contractPartySequence":2,"partyRoleCode":2,"participantSequenceNumber":1}],"reviewFile":{"logicalFileNumber":"FILE-S2-REVIEW-001","revisionNumber":1,"sha256":"54bd82f2df4660a8d8bcdfc80f5ef9b9167f2e9a708d12b9e205d74b52f4e175","documentTypeCode":10},"effectiveFrom":"2026-10-25","effectiveTo":"2027-10-25"}}'
```

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
ETag: "s2-demo-working-2-state-1-v1"
Location: /api/v1/contracts/CON-S2-DEMO-001/revisions/2
X-Receipt-Proof: <platform receipt; SYNTHETIC-NOT-VALID>

{
  "contractNumber": "CON-S2-DEMO-001",
  "revisionNumber": 2,
  "status": "REVISION_STATUS_DRAFT",
  "etag": "\"s2-demo-working-2-state-1-v1\"",
  "acceptanceId": "ACCEPT-S2-REVISION_STATUS_DRAFT-2"
}
```

## CreateContractReviewSubmission

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/contracts/CON-S2-DEMO-001/revisions/1/review-submissions" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 0ea255d0-0000-4000-8000-000000000015' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --header 'If-Match: "s2-demo-working-1-state-1-v2"' \
  --data-raw '{"declaration":"确认送审确切正文与主体/依据，尚未签署"}'
```

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
ETag: "s2-demo-working-1-state-2-v3"
Location: /api/v1/contracts/CON-S2-DEMO-001/revisions/1/review-submissions/ACCEPT-S2-REVISION_STATUS_IN_REVIEW-1
X-Receipt-Proof: <platform receipt; SYNTHETIC-NOT-VALID>

{
  "contractNumber": "CON-S2-DEMO-001",
  "revisionNumber": 1,
  "status": "REVISION_STATUS_IN_REVIEW",
  "etag": "\"s2-demo-working-1-state-2-v3\"",
  "acceptanceId": "ACCEPT-S2-REVISION_STATUS_IN_REVIEW-1"
}
```

## CreateContractReviewDecision

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/contracts/CON-S2-DEMO-001/revisions/1/review-decisions" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 0ea255d0-0000-4000-8000-000000000016' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --header 'If-Match: "s2-demo-working-1-state-2-v3"' \
  --data-raw '{"outcome":"DECISION_OUTCOME_APPROVE","reason":"仅推演：须独立核实条款/委托链/收费与付款条件","ruleVersion":"S2-RULES-1","evidence":[]}'
```

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
ETag: "s2-demo-working-1-state-4-v4"
Location: /internal/v1/contracts/CON-S2-DEMO-001/revisions/1/review-decisions/ACCEPT-S2-REVISION_STATUS_AWAITING_SIGNATURE-1
X-Receipt-Proof: <platform receipt; SYNTHETIC-NOT-VALID>

{
  "contractNumber": "CON-S2-DEMO-001",
  "revisionNumber": 1,
  "status": "REVISION_STATUS_AWAITING_SIGNATURE",
  "etag": "\"s2-demo-working-1-state-4-v4\"",
  "acceptanceId": "ACCEPT-S2-REVISION_STATUS_AWAITING_SIGNATURE-1"
}
```

## CreateSignatureRequest

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/contracts/CON-S2-DEMO-001/revisions/1/signature-requests" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 0ea255d0-0000-4000-8000-000000000017' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --header 'If-Match: "s2-demo-working-1-state-4-v4"' \
  --data-raw '{"providerCode":"UNSELECTED-PROVIDER-DESIGN-ONLY","reviewedDocumentSha256":"54bd82f2df4660a8d8bcdfc80f5ef9b9167f2e9a708d12b9e205d74b52f4e175"}'
```

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
ETag: "s2-signature-request-pending-dispatch-v1"
Location: /api/v1/signature-requests/SIG-S2-DEMO-001
X-Receipt-Proof: <platform receipt; SYNTHETIC-NOT-VALID>

{
  "signatureRequestId": "SIG-S2-DEMO-001",
  "clientReference": "SIGREF-S2-DEMO-001",
  "contractNumber": "CON-S2-DEMO-001",
  "revisionNumber": 1,
  "state": "pending_dispatch",
  "attemptCount": 0,
  "lastErrorCode": "",
  "etag": "\"s2-signature-request-pending-dispatch-v1\""
}
```

## GetSignatureRequest

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/signature-requests/SIG-S2-DEMO-001" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s2-signature-request-awaiting-signers-v2"

{
  "signatureRequestId": "SIG-S2-DEMO-001",
  "clientReference": "SIGREF-S2-DEMO-001",
  "contractNumber": "CON-S2-DEMO-001",
  "revisionNumber": 1,
  "state": "awaiting_signers",
  "attemptCount": 0,
  "lastErrorCode": "",
  "etag": "\"s2-signature-request-awaiting-signers-v2\"",
  "providerTaskReference": "NOT-A-REAL-PLATFORM-TASK"
}
```

## CreateSigningSession

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/signature-requests/SIG-S2-DEMO-001/signing-sessions" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 0ea255d0-0000-4000-8000-000000000019' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --header 'If-Match: "s2-signature-request-awaiting-signers-v2"' \
  --data-raw '{"returnRoute":"/contracts/signature-result"}'
```

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /api/v1/signing-sessions/SESSION-S2-DEMO-001
X-Receipt-Proof: <platform receipt; SYNTHETIC-NOT-VALID>

{
  "signingSessionId": "SESSION-S2-DEMO-001",
  "signatureRequestId": "SIG-S2-DEMO-001",
  "state": "pending"
}
```

## GetSigningSession

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/signing-sessions/SESSION-S2-DEMO-001" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "signingSessionId": "SESSION-S2-DEMO-001",
  "signatureRequestId": "SIG-S2-DEMO-001",
  "state": "ready",
  "redirectUrl": "https://esign.example.invalid/session/NOT-A-REAL-SESSION",
  "expiresAt": "2026-10-25T08:35:00.123Z"
}
```

## CreateSignatureNotification

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/signature-notifications" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "X-Provider-Signature: ${PROVIDER_SIGNATURE:?Sign these exact raw bytes per registered provider profile}" \
  --data-raw '{"providerCode":"UNSELECTED-PROVIDER-DESIGN-ONLY","providerEventId":"NOTICE-S2-DEMO-001","clientReference":"SIGREF-S2-DEMO-001","providerTaskReference":"NOT-A-REAL-PLATFORM-TASK","reportedState":"completed","occurredAt":"2026-10-25T08:30:00.123Z"}'
```

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /api/v1/signature-notifications/NOTICE-S2-DEMO-001

{
  "notificationId": "NOTICE-S2-DEMO-001",
  "state": "received"
}
```

## CreateContractActivation

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/contracts/CON-S2-DEMO-001/revisions/1/activation-decisions" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 0ea255d0-0000-4000-8000-000000000022' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --header 'If-Match: "s2-demo-working-1-state-5-v5"' \
  --data-raw '{"conditionEvidence":[{"logicalFileNumber":"REQUIRED-EXTERNAL-ACTIVATION-AUTHORITY","revisionNumber":1,"sha256":"<no-real-evidence-in-this-design-fixture>","documentTypeCode":10}],"reason":"未执行推演：必须先取得真实全部签署/归档证据并满足条件，不能用本例激活"}'
```

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
ETag: "s2-demo-working-1-state-6-v6"
Location: /internal/v1/contracts/CON-S2-DEMO-001/revisions/1/activation-decisions/ACCEPT-S2-REVISION_STATUS_EFFECTIVE-1
X-Receipt-Proof: <platform receipt; SYNTHETIC-NOT-VALID>

{
  "contractNumber": "CON-S2-DEMO-001",
  "revisionNumber": 1,
  "status": "REVISION_STATUS_EFFECTIVE",
  "etag": "\"s2-demo-working-1-state-6-v6\"",
  "acceptanceId": "ACCEPT-S2-REVISION_STATUS_EFFECTIVE-1"
}
```

## CreateAgreementApplication

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/trades/TRD-S2-DEMO-001/agreement-applications" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 0ea255d0-0000-4000-8000-000000000023' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --header 'If-Match: "s2-trade-r4-v4"' \
  --data-raw '{"contractNumber":"CON-S2-FRAMEWORK-LOGISTICS","contractRevisionNumber":2,"approvedTradeSnapshotNumber":"SNP-S2-DEMO-APPROVED-001","partyMappings":[{"contractPartySequence":1,"partyRoleCode":1,"participantSequenceNumber":1},{"contractPartySequence":2,"partyRoleCode":5,"participantSequenceNumber":1}],"serviceOrder":{"logicalFileNumber":"REQUIRED-EXTERNAL-SERVICE-ORDER","revisionNumber":1,"sha256":"<no-real-evidence-in-this-design-fixture>","documentTypeCode":11},"useDate":"2026-10-25"}'
```

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /api/v1/trades/TRD-S2-DEMO-001/agreement-applications/APPLICATION-S2-DEMO-001
X-Receipt-Proof: <platform receipt; SYNTHETIC-NOT-VALID>

{
  "applicationId": "APPLICATION-S2-DEMO-001",
  "tradeNumber": "TRD-S2-DEMO-001",
  "contractNumber": "CON-S2-FRAMEWORK-LOGISTICS",
  "contractRevisionNumber": 2,
  "tradeRevision": 6,
  "state": "pending_review"
}
```

## GetAgreementApplication

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/trades/TRD-S2-DEMO-001/agreement-applications/APPLICATION-S2-DEMO-001" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}"
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "applicationId": "APPLICATION-S2-DEMO-001",
  "tradeNumber": "TRD-S2-DEMO-001",
  "contractNumber": "CON-S2-FRAMEWORK-LOGISTICS",
  "contractRevisionNumber": 2,
  "tradeRevision": 6,
  "state": "pending_review"
}
```

## CreateCustomsAuthorization

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/trades/TRD-S2-DEMO-001/customs-authorizations" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 0ea255d0-0000-4000-8000-000000000025' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --header 'If-Match: "s2-trade-r4-v4"' \
  --data-raw '{"approvedTradeSnapshotNumber":"SNP-S2-DEMO-APPROVED-001","officialAuthorization":{"logicalFileNumber":"REQUIRED-EXTERNAL-OFFICIAL-AUTHORIZATION","revisionNumber":1,"sha256":"<no-real-evidence-in-this-design-fixture>","documentTypeCode":13},"customsParticipantSequence":1,"validFrom":"2026-10-25","validTo":"2027-10-25","scopeDescription":"本笔明确货物/报关范围；示例不代表已办理官方委托"}'
```

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /api/v1/trades/TRD-S2-DEMO-001/customs-authorizations/AUTHORITY-S2-DEMO-001
X-Receipt-Proof: <platform receipt; SYNTHETIC-NOT-VALID>

{
  "authorizationId": "AUTHORITY-S2-DEMO-001",
  "tradeNumber": "TRD-S2-DEMO-001",
  "state": "pending_review",
  "tradeRevision": 6
}
```

## CreateCustomsAgentRecognition

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S2-DEMO-001/customs-agent-recognitions" \
  --header 'Accept: application/json' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 0ea255d0-0000-4000-8000-000000000026' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --header 'If-Match: "s2-trade-r4-v4"' \
  --data-raw '{"approvedTradeSnapshotNumber":"SNP-S2-DEMO-APPROVED-001","customsParticipantSequence":1,"writtenRecognition":{"logicalFileNumber":"REQUIRED-EXTERNAL-WRITTEN-RECOGNITION","revisionNumber":1,"sha256":"<no-real-evidence-in-this-design-fixture>","documentTypeCode":13},"validFrom":"2026-10-25","validTo":"2027-10-25"}'
```

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /internal/v1/trades/TRD-S2-DEMO-001/customs-agent-recognitions/RECOGNITION-S2-DEMO-001
X-Receipt-Proof: <platform receipt; SYNTHETIC-NOT-VALID>

{
  "recognitionId": "RECOGNITION-S2-DEMO-001",
  "tradeNumber": "TRD-S2-DEMO-001",
  "state": "pending_review",
  "tradeRevision": 6
}
```
