-- MySQL 8.4+. Run only inside the dedicated schema described in README.md.
USE trade_step1_supplier_payer_46c455d0;
SET time_zone = '+00:00';
CREATE TABLE trade_record_tab (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  trade_number VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
  trade_status_code TINYINT UNSIGNED NOT NULL,
  revision_number INT UNSIGNED NOT NULL,
  approved_revision_number INT UNSIGNED NOT NULL DEFAULT 0,
  transaction_goods_items_json JSON NOT NULL,
  transaction_filing_document_references_json JSON NOT NULL,
  transaction_filing_source_and_version_json JSON NOT NULL,
  transaction_filing_missing_information_json JSON NOT NULL,
  creation_payload_hmac CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  creation_payload_hmac_key_version VARCHAR(64) NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_by VARCHAR(64) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uk_trade_number (trade_number),
  CONSTRAINT ck_trade_status CHECK (trade_status_code IN (2,3,4,5,8,9,10)),
  CONSTRAINT ck_trade_revision CHECK (revision_number > 0 AND approved_revision_number <= revision_number),
  CONSTRAINT ck_trade_arrays CHECK (
    JSON_TYPE(transaction_goods_items_json)='ARRAY' AND
    JSON_TYPE(transaction_filing_document_references_json)='ARRAY' AND
    JSON_TYPE(transaction_filing_source_and_version_json)='ARRAY' AND
    JSON_TYPE(transaction_filing_missing_information_json)='ARRAY'),
  CONSTRAINT ck_goods_cny CHECK (
    JSON_SCHEMA_VALID('{"type":"array","items":{"type":"object","required":["currency_code","amount"],"properties":{"currency_code":{"enum":["CNY"]},"amount":{"type":"string","pattern":"^(0|[1-9][0-9]{0,17})[.][0-9]{2}$"}}}}', transaction_goods_items_json))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE trade_participater_tab (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  trade_record_id BIGINT UNSIGNED NOT NULL,
  party_role_code TINYINT UNSIGNED NOT NULL,
  participant_sequence_number SMALLINT UNSIGNED NOT NULL,
  legal_name VARCHAR(1024) NOT NULL,
  identity_type_code TINYINT UNSIGNED NOT NULL,
  identity_number_cipher VARBINARY(2048) NOT NULL,
  country_code CHAR(2) NOT NULL,
  registered_address VARCHAR(2048) NOT NULL,
  contact_name VARCHAR(512) NOT NULL,
  contact_phone VARCHAR(64) NOT NULL,
  contact_email VARCHAR(320) NOT NULL,
  participant_information_json JSON NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_by VARCHAR(64) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_trade_participant (trade_record_id,party_role_code,participant_sequence_number),
  CONSTRAINT ck_participant_role CHECK (party_role_code BETWEEN 1 AND 6 AND participant_sequence_number > 0),
  CONSTRAINT ck_participant_json CHECK (JSON_TYPE(participant_information_json)='OBJECT')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE trade_revision_tab (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  snapshot_number VARCHAR(40) NOT NULL,
  trade_number VARCHAR(128) NOT NULL,
  revision_number INT UNSIGNED NOT NULL,
  snapshot_reason_code TINYINT UNSIGNED NOT NULL,
  transaction_filing_snapshot_json JSON NOT NULL,
  integrity_key_version VARCHAR(64) NOT NULL,
  revision_content_hmac CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  source_event_number VARCHAR(40) NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_snapshot_number (snapshot_number),
  UNIQUE KEY uk_trade_snapshot_reason (trade_number,revision_number,snapshot_reason_code),
  UNIQUE KEY uk_snapshot_source_event (source_event_number),
  CONSTRAINT ck_snapshot_reason CHECK (snapshot_reason_code IN (1,2,3) AND revision_number > 0),
  CONSTRAINT ck_snapshot_json CHECK (JSON_TYPE(transaction_filing_snapshot_json)='OBJECT')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE trade_event_tab (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_number VARCHAR(40) NOT NULL,
  trade_record_id BIGINT UNSIGNED NOT NULL,
  revision_number INT UNSIGNED NOT NULL,
  event_type_code TINYINT UNSIGNED NOT NULL,
  from_trade_status_code TINYINT UNSIGNED NULL,
  to_trade_status_code TINYINT UNSIGNED NULL,
  actor_reference VARCHAR(64) NOT NULL,
  reason_code TINYINT UNSIGNED NOT NULL,
  reason_text VARCHAR(512) NOT NULL,
  event_payload JSON NOT NULL,
  trace_id VARCHAR(64) NOT NULL,
  occurred_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_event_number (event_number),
  KEY idx_trade_occurred (trade_record_id,occurred_at),
  CONSTRAINT ck_event_type CHECK (event_type_code BETWEEN 1 AND 17),
  CONSTRAINT ck_event_states CHECK (
    (from_trade_status_code IS NULL AND to_trade_status_code IS NULL) OR
    (from_trade_status_code IS NOT NULL AND to_trade_status_code IS NOT NULL AND
      from_trade_status_code IN (2,3,4,5,8,9,10) AND to_trade_status_code IN (2,3,4,5,8,9,10))),
  CONSTRAINT ck_event_payload CHECK (JSON_TYPE(event_payload)='OBJECT')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE document_file_tab (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  logical_file_number VARCHAR(40) NOT NULL,
  revision_number INT UNSIGNED NOT NULL,
  revision_status_code TINYINT UNSIGNED NOT NULL,
  display_name VARCHAR(256) NOT NULL,
  document_type_code TINYINT UNSIGNED NOT NULL,
  storage_path VARCHAR(512) NOT NULL,
  sha256 CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  size_bytes BIGINT UNSIGNED NOT NULL,
  media_type VARCHAR(128) NOT NULL,
  supersedes_file_id BIGINT UNSIGNED NULL,
  access_scope_json JSON NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_by VARCHAR(64) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_file_revision (logical_file_number,revision_number),
  UNIQUE KEY uk_storage_path (storage_path),
  CONSTRAINT ck_file_version CHECK (revision_number > 0 AND revision_status_code IN (1,2,3)),
  CONSTRAINT ck_file_purpose CHECK (document_type_code BETWEEN 1 AND 17),
  CONSTRAINT ck_file_digest CHECK (sha256 REGEXP '^[0-9a-f]{64}$' AND size_bytes > 0),
  CONSTRAINT ck_file_scope CHECK (JSON_TYPE(access_scope_json)='OBJECT')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
