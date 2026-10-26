-- Design query recipes only: bind parameters, never apply to export_trade.
-- Authentication/object authorization and same-key replay precede this transaction.
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
START TRANSACTION;
SELECT id, trade_number, trade_status_code, approved_revision_number
FROM trade_record_tab WHERE trade_number = ? FOR UPDATE;
SELECT tax_case_number, tax_type_code, scope_reference, case_status, claimed_amount, version
FROM tax_case_tab
WHERE trade_number = ? AND tax_type_code = 2 AND scope_reference = ? FOR UPDATE;
-- Re-read original receipt under the root lock before new If-Match/confirmation gates.
SELECT submission_revision_number, package_hash, submission_status,
       submission_content_json, evidence_manifest_json, review_snapshot_json,
       previous_submission_revision_number, correction_event_number,
       dispatch_reference, execution_status, version
FROM tax_submission_tab WHERE tax_case_number = ?
ORDER BY submission_revision_number FOR UPDATE;
SELECT event_number, submission_revision_number, event_type_code, result_code,
       external_event_key, authority_reference_number, amount, currency_code,
       event_payload_json, actor_reference
FROM tax_event_tab WHERE tax_case_number = ? ORDER BY id FOR UPDATE;
-- Domain writes/events + original frozen receipt + confirmation consume must commit together.
-- S3/ClamAV/tax/bank I/O must never run while this transaction holds locks.
ROLLBACK;
