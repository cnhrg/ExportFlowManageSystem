-- Documentation templates only; named parameters are not MySQL client syntax.
-- Execute application-specific checks and writes atomically under READ COMMITTED.
-- Do not call a bank, object store, or scanner while a transaction is open.

-- N11: reconcile one real incoming transfer. The event is inserted only after
-- bank evidence is verified outside this transaction.
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
START TRANSACTION;
SELECT account_number, verification_status, account_status, valid_from, valid_to,
       account_purpose_code, currency_code, account_fingerprint
FROM payment_bank_account_tab
WHERE account_fingerprint = :stable_account_fingerprint
ORDER BY configuration_revision_number DESC
FOR UPDATE;
SELECT flow_number, event_type, amount, currency_code, bank_event_key, request_hash
FROM payment_fund_flow_tab
WHERE bank_account_fingerprint = :stable_account_fingerprint
  AND bank_event_key = :verified_bank_event_key
FOR UPDATE;
-- If absent and independently verified, append event 1, bucket NULL -> 1,
-- plus its balanced voucher/ledger rows; otherwise replay same hash or reject.
ROLLBACK;

-- N12: allocate a receipt. Lock the aggregate root before reading its current
-- approved revision and current allocation rows.
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
START TRANSACTION;
SELECT id, trade_status_code, approved_revision_number
FROM trade_record_tab
WHERE trade_number = :trade_number
FOR UPDATE;
SELECT snapshot_number, revision_number, snapshot_reason_code
FROM trade_revision_tab
WHERE trade_number = :trade_number
  AND revision_number = :approved_revision_number
  AND snapshot_reason_code = 2
FOR UPDATE;
SELECT allocation_number, allocated_amount, allocation_status
FROM payment_fund_allocation_tab
WHERE receipt_flow_number = :receipt_flow_number
ORDER BY allocation_number
FOR UPDATE;
-- Current-read every row; sum only eligible allocations in application code.
-- Insert pending allocation, then independent review changes only its status
-- after rechecking the exact snapshot and remaining unmatched gross amount.
ROLLBACK;

-- N13: preserve invoice declaration without triggering service-fee settlement.
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
START TRANSACTION;
SELECT transaction_number, transaction_type, transaction_status, trade_number,
       trade_revision_number, amount, source_lines_json, execution_basis_json
FROM payment_transaction_tab
WHERE transaction_number = :invoice_transaction_number
FOR UPDATE;
-- Create/submit only the immutable INVOICE transaction. Submission, correction
-- and retry do not create a fee transaction or any fee cash-flow event.
COMMIT;

-- N15: first approved distribution settles the fixed fee exactly once.
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
START TRANSACTION;
SELECT trade_number, trade_revision_number
FROM payment_transaction_tab
WHERE transaction_number = :settlement_transaction_number
  AND transaction_type = 4
FOR UPDATE;
SELECT allocation_number, released_amount, occupied_amount
FROM payment_fund_allocation_tab
WHERE trade_number = :trade_number
ORDER BY allocation_number
FOR UPDATE;
SELECT flow_number, event_type, transaction_number, amount, bucket_from, bucket_to
FROM payment_fund_flow_tab
WHERE event_key = CONCAT(:trade_number, ':agency_service_fee')
FOR UPDATE;
-- If this trade has no event 12, require D authorization, approved distribution,
-- verified trade and at least CNY 300.00 in the available bucket. Append one
-- event 12 (bucket 2 -> NULL), ledger voucher and settlement approval atomically.
-- A duplicate request returns the original event; it must not debit again.
-- The A contractual payable remains unchanged by this fee.
ROLLBACK;

-- N15/N16: settlement approval and payment reservation. Check bank account and
-- evidence before locking; external submission is strictly after COMMIT.
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
START TRANSACTION;
SELECT id, trade_status_code, approved_revision_number
FROM trade_record_tab
WHERE trade_number = :trade_number
FOR UPDATE;
SELECT transaction_number, transaction_type, transaction_status, amount,
       execution_basis_json, payer_account_number, payee_account_number
FROM payment_transaction_tab
WHERE transaction_number = :payment_transaction_number
FOR UPDATE;
SELECT allocation_number, allocated_amount, released_amount, occupied_amount,
       allocation_status
FROM payment_fund_allocation_tab
WHERE allocation_number IN (:allocation_numbers)
ORDER BY allocation_number
FOR UPDATE;
SELECT account_number, account_status, verification_status, account_fingerprint
FROM payment_bank_account_tab
WHERE account_number IN (:payer_account_number, :payee_account_number)
ORDER BY account_number
FOR UPDATE;
SELECT id, internal_account_type_code, account_number, ledger_balance, account_status
FROM account_tab
WHERE scope_key IN (:restricted_scope, :available_scope, :locked_scope)
ORDER BY account_number
FOR UPDATE;
-- Verify no unresolved relevant difference, sufficient released unoccupied
-- value, approved non-lending basis and unchanged payee; append event 4 (2 -> 3),
-- update affected allocation projections, and post balanced voucher atomically.
-- COMMIT before submitting the approved immutable order to the bank.
ROLLBACK;

-- N16 recovery: query the original payment number after unknown execution.
-- Do not create a new payment request and do not release event 4 while unknown.
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
START TRANSACTION;
SELECT transaction_number, transaction_status, request_number, request_hash,
       approval_snapshot_json, result_snapshot_json, lifecycle_events_json
FROM payment_transaction_tab
WHERE transaction_number = :original_payment_transaction_number
FOR UPDATE;
SELECT flow_number, event_type, transaction_number, bank_event_key, request_hash
FROM payment_fund_flow_tab
WHERE transaction_number = :original_payment_transaction_number
ORDER BY flow_number
FOR UPDATE;
-- Persist the exact query attempt/result. Unknown -> retain bucket 3.
-- Confirmed debit -> event 2 (3 -> NULL); explicit no-debit failure -> event 5
-- (3 -> 2). A-declared receipt requires its own evidence, not just event 2.
ROLLBACK;

-- N17: reconcile a substantive difference without editing old money facts.
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
START TRANSACTION;
SELECT difference_number, handle_status, bank_event_key, flow_number,
       transaction_number, bank_amount, internal_amount
FROM payment_reconcile_difference_tab
WHERE difference_number = :difference_number
FOR UPDATE;
SELECT transaction_number, transaction_status, result_snapshot_json
FROM payment_transaction_tab
WHERE transaction_number = :affected_transaction_number
FOR UPDATE;
SELECT allocation_number, allocated_amount, released_amount, occupied_amount,
       allocation_status
FROM payment_fund_allocation_tab
WHERE allocation_number = :affected_allocation_number
FOR UPDATE;
-- Attach actual evidence, record disposition, require a separate reviewer,
-- and append any correcting event/voucher; never patch an old bank event or
-- manually set a bucket/account balance.
ROLLBACK;
