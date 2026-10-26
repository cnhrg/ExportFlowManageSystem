-- Read-only audit candidates. Application must enforce these invariants
-- transactionally; these queries do not replace row locking or approval.

-- Historical standalone service-fee bills must not have been duplicated.
SELECT t.trade_number, COUNT(*) AS active_historical_fee_bill_count
FROM payment_fund_flow_tab AS f
JOIN payment_transaction_tab AS t
  ON t.transaction_number = f.transaction_number
WHERE f.event_type = 8
  AND t.transaction_type = 3
  AND NOT EXISTS (
    SELECT 1
    FROM payment_fund_flow_tab AS v
    WHERE v.event_type = 9
      AND v.reversal_of_flow_number = f.flow_number
  )
GROUP BY t.trade_number
HAVING COUNT(*) > 1;

-- The current D-funded service fee may be settled at most once per trade.
SELECT t.trade_number, COUNT(*) AS service_fee_settlement_count
FROM payment_fund_flow_tab AS f
JOIN payment_transaction_tab AS t
  ON t.transaction_number = f.transaction_number
WHERE f.event_type = 12
  AND t.transaction_type = 3
GROUP BY t.trade_number
HAVING COUNT(*) > 1;

-- Current service-fee settlements draw from the verified available bucket,
-- never from a bank account or a fourth cargo bucket.
SELECT flow_number, amount, bucket_from, bucket_to,
       bank_account_id, bank_account_fingerprint, bank_event_key
FROM payment_fund_flow_tab
WHERE event_type = 12
  AND (amount <> 300.00
       OR bucket_from IS NULL
       OR bucket_from <> 2
       OR bucket_to IS NOT NULL
       OR bank_account_id IS NOT NULL
       OR bank_account_fingerprint IS NOT NULL
       OR bank_event_key IS NOT NULL);

-- Service-fee and bank-fee events must never be represented in a cargo bucket.
SELECT flow_number, event_type, bucket_from, bucket_to
FROM payment_fund_flow_tab
WHERE event_type IN (8, 9, 10, 11)
  AND (bucket_from IS NOT NULL OR bucket_to IS NOT NULL);

-- Allocation projections must satisfy their local monetary bounds.
SELECT allocation_number, allocated_amount, released_amount, occupied_amount
FROM payment_fund_allocation_tab
WHERE currency_code <> 'CNY'
   OR allocated_amount <= 0
   OR released_amount < 0
   OR released_amount > allocated_amount
   OR occupied_amount < 0
   OR occupied_amount > released_amount;

-- Every successfully posted voucher must balance in CNY.
SELECT v.voucher_number, v.total_amount,
       SUM(CASE WHEN e.direction = 1 THEN e.amount ELSE 0 END) AS debit_total,
       SUM(CASE WHEN e.direction = 2 THEN e.amount ELSE 0 END) AS credit_total
FROM account_voucher_tab AS v
LEFT JOIN account_ledger_entry_tab AS e
  ON e.voucher_number = v.voucher_number
WHERE v.voucher_status = 2
GROUP BY v.voucher_number, v.total_amount
HAVING debit_total <> credit_total
    OR debit_total <> v.total_amount
    OR COUNT(e.id) = 0;

-- Bank facts must retain their stable identity and event key.
SELECT flow_number, event_type, bank_account_fingerprint, bank_event_key
FROM payment_fund_flow_tab
WHERE event_type IN (1, 2, 10, 11)
  AND (bank_account_fingerprint IS NULL OR bank_event_key IS NULL);

-- Service-fee receipt is not a trade allocation and cannot occupy cargo funds.
SELECT f.flow_number, f.transaction_number, f.allocation_number,
       f.event_type, f.bucket_from, f.bucket_to
FROM payment_fund_flow_tab AS f
WHERE f.event_type = 10
  AND (f.allocation_number IS NOT NULL
       OR f.bucket_from IS NOT NULL
       OR f.bucket_to IS NOT NULL);
