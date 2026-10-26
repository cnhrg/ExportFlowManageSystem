# 步骤一HTTP响应与cURL示例

全部为未部署设计，凭证/确认号不可用。curl无自动写重试；真实会话的确认必须匹配同一正文/原键/标签。

## CreateTradeNumberReservation

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/trade-number-reservations" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: ea8cf811-f9fb-48dd-a9b1-8f47a5444200' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"purpose":"supplier-trade-filing"}'
```

```http
HTTP/1.1 201 Created
Location: /api/v1/trade-number-reservations/RES-DEMO-001
Cache-Control: no-store
Content-Type: application/json
X-Receipt-Proof: <Base64(ReceiptProof); SYNTHETIC-NOT-VALID>

{
  "reservationId": "RES-DEMO-001",
  "tradeNumber": "TRD-S1-DEMO-001",
  "createdAt": "2026-10-25T08:00:00Z"
}
```

## CreateFileUpload

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/file-uploads" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: ea8cf811-f9fb-48dd-a9b1-8f47a5444210' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"reservationId":"RES-DEMO-001","purpose":"MATERIAL_PURPOSE_FILING_BUNDLE","displayName":"material-bundle.html","mediaType":"text/html","sizeBytes":"1528","sha256":"77ca371c4895a5272f9e9bf6aa1805ccd4978aa25b05db54f6e67cfbe241f284"}'
```

```http
HTTP/1.1 201 Created
Location: /api/v1/file-uploads/UPLOAD-DEMO-001
Cache-Control: no-store
Content-Type: application/json
X-Receipt-Proof: <Base64(ReceiptProof); SYNTHETIC-NOT-VALID>

{
  "uploadId": "UPLOAD-DEMO-001",
  "state": "awaiting_upload",
  "signedUpload": {
    "url": "https://s3.example.invalid/private-staging/UPLOAD-DEMO-001?SIGNATURE-NOT-USABLE",
    "method": "PUT",
    "requiredHeaders": [
      {
        "name": "Content-Type",
        "value": "text/html"
      },
      {
        "name": "x-amz-checksum-sha256",
        "value": "d8o3HEiVpScvnpv2qhgFzNSXiqJbBdtU9uZ8++JB8oQ="
      }
    ],
    "expiresAt": "2026-10-25T08:20:00Z"
  }
}
```

## CreateFile

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 15 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/file-uploads/UPLOAD-DEMO-001/files" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: ea8cf811-f9fb-48dd-a9b1-8f47a5444211' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"expectedSha256":"77ca371c4895a5272f9e9bf6aa1805ccd4978aa25b05db54f6e67cfbe241f284","expectedSizeBytes":"1528"}'
```

```http
HTTP/1.1 201 Created
Location: /api/v1/files/FILE-S1-DEMO-001/revisions/1
Cache-Control: no-store
Content-Type: application/json
X-Receipt-Proof: <Base64(ReceiptProof); SYNTHETIC-NOT-VALID>

{
  "logicalFileNumber": "FILE-S1-DEMO-001",
  "revisionNumber": 1,
  "purpose": "MATERIAL_PURPOSE_FILING_BUNDLE",
  "sha256": "77ca371c4895a5272f9e9bf6aa1805ccd4978aa25b05db54f6e67cfbe241f284",
  "sizeBytes": "1528",
  "referenceEligible": true
}
```

## CreateTrade

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/trades" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: TRD-S1-DEMO-001' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"tradeNumber":"TRD-S1-DEMO-001","reservationId":"RES-DEMO-001","supplierFiling":{"supplier":{"legalName":"示例供应商","countryCode":"CN","registeredAddress":"合成注册地址，非真实地点","contactName":"合成联系人","contactPhone":"DEMO-NOT-A-PHONE","contactEmail":"demo@example.invalid","identityProtectedReference":"DEMO-IDENTITY-SUPPLIER"},"consignee":{"party":{"legalName":"Example Consignee","countryCode":"SG","registeredAddress":"合成注册地址，非真实地点","contactName":"合成联系人","contactPhone":"DEMO-NOT-A-PHONE","contactEmail":"demo@example.invalid","identityProtectedReference":"DEMO-IDENTITY-CONSIGNEE"},"deliveryAddress":"Synthetic delivery location","deliveryArrangements":"合成收货安排"},"salesContractNumber":"SC-DEMO-001","invoiceNumber":"CI-DEMO-001","packingListNumber":"PL-DEMO-001","goods":[{"itemSequenceNumber":1,"productName":"展示用金属支架","specification":"DEMO-M1","quantity":"100","unitCode":"PCS","unitPrice":{"amount":"125.00","currencyCode":"CNY"},"total":{"amount":"12500.00","currencyCode":"CNY"},"originCountryCode":"CN"}],"packing":[{"goodsItemSequenceNumber":1,"quantity":"100","unitCode":"PCS","cartons":10,"netWeightKg":"100.000","grossWeightKg":"120.000"}],"materials":[{"purpose":"MATERIAL_PURPOSE_SALES_CONTRACT","logicalFileNumber":"FILE-S1-DEMO-001","revisionNumber":1,"sha256":"77ca371c4895a5272f9e9bf6aa1805ccd4978aa25b05db54f6e67cfbe241f284","htmlAnchor":"sales-contract"},{"purpose":"MATERIAL_PURPOSE_COMMERCIAL_INVOICE","logicalFileNumber":"FILE-S1-DEMO-001","revisionNumber":1,"sha256":"77ca371c4895a5272f9e9bf6aa1805ccd4978aa25b05db54f6e67cfbe241f284","htmlAnchor":"commercial-invoice"},{"purpose":"MATERIAL_PURPOSE_PACKING_LIST","logicalFileNumber":"FILE-S1-DEMO-001","revisionNumber":1,"sha256":"77ca371c4895a5272f9e9bf6aa1805ccd4978aa25b05db54f6e67cfbe241f284","htmlAnchor":"packing-list"}],"contractTotal":{"amount":"12500.00","currencyCode":"CNY"},"invoiceTotal":{"amount":"12500.00","currencyCode":"CNY"},"sourceContentsConfirmed":true,"exportAgent":{"party":{"legalName":"示例出口代理","countryCode":"CN","registeredAddress":"合成注册地址，非真实地点","contactName":"合成联系人","contactPhone":"DEMO-NOT-A-PHONE","contactEmail":"demo@example.invalid","identityProtectedReference":"DEMO-IDENTITY-EXPORT-AGENT"},"serviceScope":"合成代理出口范围","agreedInstructions":"供应商事先沟通后填写的代理指示"},"logisticsProvider":{"party":{"legalName":"示例物流公司","countryCode":"CN","registeredAddress":"合成注册地址，非真实地点","contactName":"合成联系人","contactPhone":"DEMO-NOT-A-PHONE","contactEmail":"demo@example.invalid","identityProtectedReference":"DEMO-IDENTITY-LOGISTICS"},"serviceScope":"合成运输范围","agreedInstructions":"供应商事先沟通后填写；具体运输工具尚待确定"},"customsBroker":{"party":{"legalName":"示例出口报关代理","countryCode":"CN","registeredAddress":"合成注册地址，非真实地点","contactName":"合成联系人","contactPhone":"DEMO-NOT-A-PHONE","contactEmail":"demo@example.invalid","identityProtectedReference":"DEMO-IDENTITY-CUSTOMS"},"serviceScope":"合成报关服务范围","agreedInstructions":"供应商事先沟通后填写；本例无真实资质证明"},"nominatedPayerProtectedReference":"DEMO-IDENTITY-CONSIGNEE"}}'
```

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
ETag: "s1-trade-TRD-S1-DEMO-001-r1"
Location: /api/v1/trades/TRD-S1-DEMO-001
X-Receipt-Proof: <Base64(ReceiptProof); SYNTHETIC-NOT-VALID>

{
  "tradeNumber": "TRD-S1-DEMO-001",
  "revisionNumber": 1,
  "lifecycle": "editing",
  "supplierFilingUri": "/api/v1/trades/TRD-S1-DEMO-001/supplier-filing",
  "etag": "\"s1-trade-TRD-S1-DEMO-001-r1\""
}
```

## CreatePayerFiling

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/trades/TRD-S1-DEMO-001/payer-filings" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: ea8cf811-f9fb-48dd-a9b1-8f47a5444202' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"payer":{"legalName":"Example Consignee","countryCode":"SG","registeredAddress":"合成注册地址，非真实地点","contactName":"合成联系人","contactPhone":"DEMO-NOT-A-PHONE","contactEmail":"demo@example.invalid","identityProtectedReference":"DEMO-IDENTITY-CONSIGNEE"},"relationship":"PAYER_RELATIONSHIP_SAME_LEGAL_ENTITY","paymentPurpose":"支付本笔合成出口交易货款","relationshipEvidence":[],"sourceContentsConfirmed":true}'
```

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
ETag: "s1-payer-TRD-S1-DEMO-001-r2"
Location: /api/v1/trades/TRD-S1-DEMO-001/payer-filings/primary
X-Receipt-Proof: <Base64(ReceiptProof); SYNTHETIC-NOT-VALID>

{
  "tradeNumber": "TRD-S1-DEMO-001",
  "payerFilingId": "primary",
  "revisionNumber": 2,
  "etag": "\"s1-payer-TRD-S1-DEMO-001-r2\""
}
```

## ReplaceSupplierFiling

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request PUT "${BASE_URL:?Set BASE_URL}/api/v1/trades/TRD-S1-DEMO-001/supplier-filing" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: ea8cf811-f9fb-48dd-a9b1-8f47a5444203' \
  --header 'If-Match: "s1-supplier-TRD-S1-DEMO-001-r2"' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"supplier":{"legalName":"示例供应商","countryCode":"CN","registeredAddress":"合成注册地址，非真实地点","contactName":"合成联系人","contactPhone":"DEMO-NOT-A-PHONE","contactEmail":"demo@example.invalid","identityProtectedReference":"DEMO-IDENTITY-SUPPLIER"},"consignee":{"party":{"legalName":"Example Consignee","countryCode":"SG","registeredAddress":"合成注册地址，非真实地点","contactName":"合成联系人","contactPhone":"DEMO-NOT-A-PHONE","contactEmail":"demo@example.invalid","identityProtectedReference":"DEMO-IDENTITY-CONSIGNEE"},"deliveryAddress":"Synthetic delivery location","deliveryArrangements":"供应商修改后的合成送货安排"},"salesContractNumber":"SC-DEMO-001","invoiceNumber":"CI-DEMO-001","packingListNumber":"PL-DEMO-001","goods":[{"itemSequenceNumber":1,"productName":"展示用金属支架","specification":"DEMO-M1","quantity":"100","unitCode":"PCS","unitPrice":{"amount":"125.00","currencyCode":"CNY"},"total":{"amount":"12500.00","currencyCode":"CNY"},"originCountryCode":"CN"}],"packing":[{"goodsItemSequenceNumber":1,"quantity":"100","unitCode":"PCS","cartons":10,"netWeightKg":"100.000","grossWeightKg":"120.000"}],"materials":[{"purpose":"MATERIAL_PURPOSE_SALES_CONTRACT","logicalFileNumber":"FILE-S1-DEMO-001","revisionNumber":1,"sha256":"77ca371c4895a5272f9e9bf6aa1805ccd4978aa25b05db54f6e67cfbe241f284","htmlAnchor":"sales-contract"},{"purpose":"MATERIAL_PURPOSE_COMMERCIAL_INVOICE","logicalFileNumber":"FILE-S1-DEMO-001","revisionNumber":1,"sha256":"77ca371c4895a5272f9e9bf6aa1805ccd4978aa25b05db54f6e67cfbe241f284","htmlAnchor":"commercial-invoice"},{"purpose":"MATERIAL_PURPOSE_PACKING_LIST","logicalFileNumber":"FILE-S1-DEMO-001","revisionNumber":1,"sha256":"77ca371c4895a5272f9e9bf6aa1805ccd4978aa25b05db54f6e67cfbe241f284","htmlAnchor":"packing-list"}],"contractTotal":{"amount":"12500.00","currencyCode":"CNY"},"invoiceTotal":{"amount":"12500.00","currencyCode":"CNY"},"sourceContentsConfirmed":true,"exportAgent":{"party":{"legalName":"示例出口代理","countryCode":"CN","registeredAddress":"合成注册地址，非真实地点","contactName":"合成联系人","contactPhone":"DEMO-NOT-A-PHONE","contactEmail":"demo@example.invalid","identityProtectedReference":"DEMO-IDENTITY-EXPORT-AGENT"},"serviceScope":"合成代理出口范围","agreedInstructions":"供应商事先沟通后填写的代理指示"},"logisticsProvider":{"party":{"legalName":"示例物流公司","countryCode":"CN","registeredAddress":"合成注册地址，非真实地点","contactName":"合成联系人","contactPhone":"DEMO-NOT-A-PHONE","contactEmail":"demo@example.invalid","identityProtectedReference":"DEMO-IDENTITY-LOGISTICS"},"serviceScope":"合成运输范围","agreedInstructions":"供应商事先沟通后填写；具体运输工具尚待确定"},"customsBroker":{"party":{"legalName":"示例出口报关代理","countryCode":"CN","registeredAddress":"合成注册地址，非真实地点","contactName":"合成联系人","contactPhone":"DEMO-NOT-A-PHONE","contactEmail":"demo@example.invalid","identityProtectedReference":"DEMO-IDENTITY-CUSTOMS"},"serviceScope":"合成报关服务范围","agreedInstructions":"供应商事先沟通后填写；本例无真实资质证明"},"nominatedPayerProtectedReference":"DEMO-IDENTITY-CONSIGNEE"}'
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s1-supplier-TRD-S1-DEMO-001-r3"
X-Receipt-Proof: <Base64(ReceiptProof); SYNTHETIC-NOT-VALID>

{
  "tradeNumber": "TRD-S1-DEMO-001",
  "revisionNumber": 3,
  "etag": "\"s1-supplier-TRD-S1-DEMO-001-r3\""
}
```

## ReplacePayerFiling

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request PUT "${BASE_URL:?Set BASE_URL}/api/v1/trades/TRD-S1-DEMO-001/payer-filings/primary" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: ea8cf811-f9fb-48dd-a9b1-8f47a5444204' \
  --header 'If-Match: "s1-payer-TRD-S1-DEMO-001-r3"' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json' \
  --header "X-Confirmation-Id: ${CONFIRMATION_ID:?Confirm this exact intent first}" \
  --data-raw '{"payer":{"legalName":"Example Consignee","countryCode":"SG","registeredAddress":"合成注册地址，非真实地点","contactName":"合成联系人","contactPhone":"DEMO-NOT-A-PHONE","contactEmail":"demo@example.invalid","identityProtectedReference":"DEMO-IDENTITY-CONSIGNEE"},"relationship":"PAYER_RELATIONSHIP_SAME_LEGAL_ENTITY","paymentPurpose":"付款方修改后的合成付款说明","relationshipEvidence":[],"sourceContentsConfirmed":true}'
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s1-payer-TRD-S1-DEMO-001-r4"
X-Receipt-Proof: <Base64(ReceiptProof); SYNTHETIC-NOT-VALID>

{
  "tradeNumber": "TRD-S1-DEMO-001",
  "payerFilingId": "primary",
  "revisionNumber": 4,
  "etag": "\"s1-payer-TRD-S1-DEMO-001-r4\""
}
```

## GetTradeNumberReservation

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/trade-number-reservations/RES-DEMO-001" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json'
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "reservationId": "RES-DEMO-001",
  "tradeNumber": "TRD-S1-DEMO-001",
  "createdAt": "2026-10-25T08:00:00Z"
}
```

## GetTrade

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/trades/TRD-S1-DEMO-001" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json'
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s1-trade-TRD-S1-DEMO-001-r4"

{
  "tradeNumber": "TRD-S1-DEMO-001",
  "revisionNumber": 4,
  "lifecycle": "editing",
  "supplierFilingUri": "/api/v1/trades/TRD-S1-DEMO-001/supplier-filing",
  "etag": "\"s1-trade-TRD-S1-DEMO-001-r4\"",
  "payerFilingUri": "/api/v1/trades/TRD-S1-DEMO-001/payer-filings/primary"
}
```

## GetSupplierFiling

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/trades/TRD-S1-DEMO-001/supplier-filing" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json'
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s1-supplier-TRD-S1-DEMO-001-r4"

{
  "tradeNumber": "TRD-S1-DEMO-001",
  "content": {
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
      "deliveryArrangements": "供应商修改后的合成送货安排"
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
      "agreedInstructions": "供应商事先沟通后填写的代理指示"
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
      "agreedInstructions": "供应商事先沟通后填写；本例无真实资质证明"
    },
    "nominatedPayerProtectedReference": "DEMO-IDENTITY-CONSIGNEE"
  },
  "revisionNumber": 4,
  "etag": "\"s1-supplier-TRD-S1-DEMO-001-r4\""
}
```

## GetPayerFiling

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/trades/TRD-S1-DEMO-001/payer-filings/primary" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json'
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s1-payer-TRD-S1-DEMO-001-r4"

{
  "tradeNumber": "TRD-S1-DEMO-001",
  "payerFilingId": "primary",
  "revisionNumber": 4,
  "etag": "\"s1-payer-TRD-S1-DEMO-001-r4\"",
  "content": {
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
    "paymentPurpose": "付款方修改后的合成付款说明",
    "relationshipEvidence": [],
    "sourceContentsConfirmed": true
  }
}
```

## GetFileUpload

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/file-uploads/UPLOAD-DEMO-001" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json'
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "uploadId": "UPLOAD-DEMO-001",
  "state": "awaiting_upload",
  "signedUpload": {
    "url": "https://s3.example.invalid/private-staging/UPLOAD-DEMO-001?SIGNATURE-NOT-USABLE",
    "method": "PUT",
    "requiredHeaders": [
      {
        "name": "Content-Type",
        "value": "text/html"
      },
      {
        "name": "x-amz-checksum-sha256",
        "value": "d8o3HEiVpScvnpv2qhgFzNSXiqJbBdtU9uZ8++JB8oQ="
      }
    ],
    "expiresAt": "2026-10-25T08:20:00Z"
  }
}
```

## GetFileRevision

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/files/FILE-S1-DEMO-001/revisions/1" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json'
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "logicalFileNumber": "FILE-S1-DEMO-001",
  "revisionNumber": 1,
  "purpose": "MATERIAL_PURPOSE_FILING_BUNDLE",
  "sha256": "77ca371c4895a5272f9e9bf6aa1805ccd4978aa25b05db54f6e67cfbe241f284",
  "sizeBytes": "1528",
  "referenceEligible": true
}
```

## GetFilingOverview

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/internal/v1/trades/TRD-S1-DEMO-001/filing-overview" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json'
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
ETag: "s1-overview-TRD-S1-DEMO-001-r4"

{
  "tradeNumber": "TRD-S1-DEMO-001",
  "revisionNumber": 4,
  "supplierFilingPresent": true,
  "payerFilingPresent": true,
  "missingInformation": [
    {
      "pointer": "/participant[2,1].receipt_path",
      "code": "INFORMATION_NOT_PROVIDED",
      "detail": "供应商后续补充，不视为已批准"
    },
    {
      "pointer": "/participant[2,1].payment_path",
      "code": "INFORMATION_NOT_PROVIDED",
      "detail": "供应商后续补充，不视为已批准"
    },
    {
      "pointer": "/participant[2,1].payment_branch_code",
      "code": "INFORMATION_NOT_PROVIDED",
      "detail": "供应商后续补充，不视为已批准"
    },
    {
      "pointer": "/participant[5,1].port",
      "code": "INFORMATION_NOT_PROVIDED",
      "detail": "供应商后续补充，不视为已批准"
    },
    {
      "pointer": "/participant[5,1].transport_mode_code",
      "code": "INFORMATION_NOT_PROVIDED",
      "detail": "供应商后续补充，不视为已批准"
    },
    {
      "pointer": "/participant[5,1].route",
      "code": "INFORMATION_NOT_PROVIDED",
      "detail": "供应商后续补充，不视为已批准"
    },
    {
      "pointer": "/participant[6,1].customs_qualification_reference",
      "code": "INFORMATION_NOT_PROVIDED",
      "detail": "供应商后续补充，不视为已批准"
    },
    {
      "pointer": "/participant[6,1].quotation_reference",
      "code": "INFORMATION_NOT_PROVIDED",
      "detail": "供应商后续补充，不视为已批准"
    },
    {
      "pointer": "/participant[6,1].quoted_amount",
      "code": "INFORMATION_NOT_PROVIDED",
      "detail": "供应商后续补充，不视为已批准"
    },
    {
      "pointer": "/participant[6,1].pricing_basis",
      "code": "INFORMATION_NOT_PROVIDED",
      "detail": "供应商后续补充，不视为已批准"
    },
    {
      "pointer": "/participant[6,1].currency_code",
      "code": "INFORMATION_NOT_PROVIDED",
      "detail": "供应商后续补充，不视为已批准"
    }
  ],
  "etag": "\"s1-overview-TRD-S1-DEMO-001-r4\""
}
```

## CreateOperationConfirmation

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 10 \
  --request POST "${BASE_URL:?Set BASE_URL}/api/v1/operation-confirmations" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: ea8cf811-f9fb-48dd-a9b1-8f47a5444230' \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json' \
  --data-raw '{"method":"POST","resourcePath":"/api/v1/trades","idempotencyKey":"TRD-S1-DEMO-001","ifMatch":"","bodySha256":"46d8a1b7d28cacfb4b27a08a468dfdbb65ee62ada98ed850cc804e9b094119da"}'
```

```http
HTTP/1.1 201 Created
Content-Type: application/json
Cache-Control: no-store
Location: /api/v1/operation-confirmations/CONFIRMATION-S1-SYNTHETIC-NOT-VALID

{
  "confirmationId": "CONFIRMATION-S1-SYNTHETIC-NOT-VALID",
  "requestDigest": "2c7b7b7f832a0a1836edbbce100bcc5b8fdc17a1094aee256ccd8eb1426f5742",
  "expiresAt": "2026-10-25T08:29:00.000Z",
  "state": "available"
}
```

## GetOperationConfirmation

```sh
# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.
# No automatic write retries: unknown outcome must recover the original key.
curl --include --fail-with-body --connect-timeout 2 --max-time 5 \
  --request GET "${BASE_URL:?Set BASE_URL}/api/v1/operation-confirmations/CONFIRMATION-S1-SYNTHETIC-NOT-VALID" \
  --header "Authorization: Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}" \
  --header 'Accept: application/json'
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "confirmationId": "CONFIRMATION-S1-SYNTHETIC-NOT-VALID",
  "requestDigest": "2c7b7b7f832a0a1836edbbce100bcc5b8fdc17a1094aee256ccd8eb1426f5742",
  "expiresAt": "2026-10-25T08:29:00.000Z",
  "state": "available"
}
```
