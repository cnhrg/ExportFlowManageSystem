-- Read-only assertions on the retained verify_customs_* database from this step.
-- Every "ok" must be 1. Never select export_trade here.
SELECT DATABASE() REGEXP '^verify_customs_[a-f0-9]{12}$' AS ok;

SELECT COUNT(*) = 1 AND MIN(declaration_status) = 4
  AND SUM(external_declaration_number IS NOT NULL) = 0
  AND SUM(submitted_at IS NOT NULL OR released_at IS NOT NULL) = 0 AS ok
FROM customs_declaration_tab;

SELECT COUNT(*) >= 3 AND MIN(revision_status) = 1 AND MAX(revision_status) = 1
  AND SUM(JSON_EXTRACT(content_json, '$.schema_version') <> 1) = 0 AS ok
FROM customs_declaration_revision_tab;

SELECT COUNT(*) = 1 AND MIN(execution_status) = 3 AND SUM(provider_reference IS NOT NULL) = 0 AS ok
FROM customs_filing_request_tab;

SELECT COUNT(*) > 0
  AND SUM(external_event_key IS NOT NULL) = 0
  AND SUM(event_type_code BETWEEN 8 AND 16) = 0 AS ok
FROM customs_event_tab;

SELECT COUNT(*) = 3 AS ok
FROM middleware_file_task WHERE phase = 'done' AND file_id IS NOT NULL;

SELECT COUNT(*) = 1 AS ok
FROM middleware_file_task WHERE phase = 'rejected' AND last_error = 'DIGEST_MISMATCH' AND file_id IS NULL;
