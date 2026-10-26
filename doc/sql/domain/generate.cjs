'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
globalThis.EXPORT_DOMAIN_MODEL = require('../../../交付成果/assets/domain-model.js');
const model = require('../../../交付成果/assets/database-model.js');

// Pending external facts must remain NULL, not fabricated dates, numbers or zeroes.
const nullable = {
  contract_revision_tab: 'effective_from',
  logistics_shipment_tab: 'actual_departure_at actual_arrival_at',
  logistics_transport_leg_tab: 'actual_departure_at actual_arrival_at carrier_booking_number tracking_reference',
  logistics_event_tab: 'transport_leg_number location_code evidence_reference source_message_id',
  customs_declaration_tab: 'external_declaration_number submitted_at released_at',
  customs_event_tab: 'external_reference_number payload_file_reference',
  tax_case_tab: 'authority_reference_number',
  tax_submission_tab: 'submitted_at accepted_at submitted_by correction_reason_code',
  tax_event_tab: 'authority_reference_number amount currency_code fund_flow_number evidence_reference',
  payment_reconcile_difference_tab: 'handle_reason evidence_reference',
  compliance_screening_run_tab: 'completed_at decision_status reviewer_reference result_hash',
  compliance_screening_hit_tab: 'reviewer_reference reviewed_at review_reason_code review_note evidence_reference',
  compliance_discrepancy_case_tab: 'trade_number transaction_number assigned_to due_at closed_at',
  compliance_disposition_event_tab: 'approver_reference',
  admin_organization_tab: 'parent_organization_code legal_party_number',
  admin_user_account_tab: 'last_authenticated_at disabled_at disabled_by',
  admin_role_template_tab: 'effective_to approved_by approved_at',
  system_dictionary_item_tab: 'effective_to',
  system_config_record_tab: 'effective_to approved_by',
  batch_task_tab: 'schedule_expression',
  batch_task_execute_log_tab: 'worker_reference started_at finished_at next_retry_at error_code error_message result_reference',
  message_template_tab: 'effective_to approved_by',
  message_notification_delivery_tab: 'sent_at acknowledged_at',
  message_delivery_attempt_tab: 'provider_message_number completed_at failure_code failure_reason retry_after_at provider_response_hash',
  admin_audit_log_tab: 'before_data after_data error_code client_ip source_device_reference',
  admin_security_event_tab: 'actor_reference organization_code source_ip device_fingerprint_hash target_reference resolved_at evidence_reference',
  report_metric_definition_tab: 'effective_to approved_by approved_at',
  report_export_job_tab: 'snapshot_number approval_reference file_reference file_hash expires_at downloaded_at'
};
const appendOnly = new Set([
  'trade_revision_tab', 'trade_event_tab', 'logistics_event_tab', 'customs_event_tab', 'customs_declaration_revision_tab',
  'tax_event_tab', 'payment_fund_flow_tab', 'account_ledger_entry_tab',
  'compliance_disposition_event_tab', 'admin_audit_log_tab', 'report_snapshot_tab'
]);
const common = {
  created_by: "VARCHAR(64) NOT NULL DEFAULT 'system'",
  updated_by: "VARCHAR(64) NOT NULL DEFAULT 'system'",
  created_at: 'DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3))',
  updated_at: 'DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)) ON UPDATE CURRENT_TIMESTAMP(3)',
  version: 'INT UNSIGNED NOT NULL DEFAULT 0',
  deleted_id: 'BIGINT UNSIGNED NOT NULL DEFAULT 0'
};
const extraChecks = {
  trade_record_tab: ['approved_revision_number <= revision_number',
    "JSON_TYPE(transaction_goods_items_json) = 'ARRAY'",
    "JSON_TYPE(transaction_filing_document_references_json) = 'ARRAY'"],
  contract_record_tab: [
    '(contract_scope_code = 1 AND trade_number IS NOT NULL AND CHAR_LENGTH(trade_number) > 0) OR (contract_scope_code = 2 AND trade_number IS NULL)'
  ],
  contract_revision_tab: ['effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from'],
  customs_declaration_revision_tab: ['revision_number > 0', "JSON_TYPE(content_json) = 'OBJECT'"],
  customs_filing_request_tab: ['revision_number > 0', "JSON_TYPE(request_payload_json) = 'OBJECT'"],
  tax_case_tab: ["tax_type_code <> 1 OR claimed_amount IS NULL", "claimed_amount IS NULL OR claimed_amount >= 0"],
  tax_submission_tab: ['submission_revision_number > 0', "JSON_TYPE(submission_content_json) = 'OBJECT'", "JSON_TYPE(evidence_manifest_json) = 'ARRAY'"],
  tax_event_tab: ["event_type_code NOT IN (6,7,8,9,10,11,12) OR (submission_revision_number IS NOT NULL AND external_event_key IS NOT NULL AND authority_reference_number IS NOT NULL)"],
  payment_bank_account_tab: ['valid_to IS NULL OR valid_to > valid_from'],
  payment_transaction_tab: ['amount > 0', 'transaction_type <> 3 OR amount = 300.00'],
  payment_fund_allocation_tab: [
    'allocated_amount > 0', 'released_amount >= 0 AND released_amount <= allocated_amount',
    'occupied_amount >= 0 AND occupied_amount <= released_amount'
  ],
  payment_fund_flow_tab: [
    'amount > 0',
    '(event_type IN (8,9,12) AND amount = 300.00) OR event_type NOT IN (8,9,12)',
    '(event_type NOT IN (1,2,10,11)) OR (bank_account_id IS NOT NULL AND bank_account_fingerprint IS NOT NULL AND bank_event_key IS NOT NULL)',
    '(event_type NOT IN (8,9)) OR (transaction_number IS NOT NULL AND bucket_from IS NULL AND bucket_to IS NULL)',
    '(event_type NOT IN (10,11)) OR (transaction_number IS NOT NULL AND bucket_from IS NULL AND bucket_to IS NULL)',
    '(event_type <> 12) OR (transaction_number IS NOT NULL AND amount = 300.00 AND bucket_from = 2 AND bucket_to IS NULL AND bank_account_id IS NULL AND bank_account_fingerprint IS NULL AND bank_event_key IS NULL)',
    '(event_type <> 1) OR (bucket_from IS NULL AND bucket_to IS NOT NULL AND bucket_to = 1)',
    '(event_type <> 2) OR (bucket_from IS NOT NULL AND bucket_from = 3 AND bucket_to IS NULL)',
    '(event_type <> 3) OR (bucket_from IS NOT NULL AND bucket_to IS NOT NULL AND bucket_from = 1 AND bucket_to = 2)',
    '(event_type <> 4) OR (bucket_from IS NOT NULL AND bucket_to IS NOT NULL AND bucket_from = 2 AND bucket_to = 3)',
    '(event_type <> 5) OR (bucket_from IS NOT NULL AND bucket_to IS NOT NULL AND bucket_from = 3 AND bucket_to = 2)',
    '(event_type <> 6) OR (bucket_from IS NOT NULL AND bucket_to IS NOT NULL AND bucket_from = 2 AND bucket_to = 1)',
    '(event_type NOT IN (7,9)) OR reversal_of_flow_number IS NOT NULL'
  ],
  account_voucher_tab: ['total_amount > 0'],
  account_ledger_entry_tab: ['amount > 0'],
  logistics_shipment_item_tab: ['allocated_quantity > 0', 'allocated_amount >= 0'],
  customs_declaration_item_tab: ['declared_quantity > 0', 'declared_unit_price_amount >= 0', 'declared_total_amount >= 0'],
  compliance_screening_hit_tab: ['match_score >= 0 AND match_score <= 1'],
  document_file_tab: ['revision_number > 0', 'size_bytes > 0']
};
const literal = value => "'" + value.replace(/'/g, "''") + "'";
const identifier = value => {
  assert.match(value, /^[a-z][a-z0-9_]*$/);
  assert.ok(value.length <= 64);
  return '`' + value + '`';
};
function objectName(prefix, table, suffix) {
  const core = table.replace(/_tab$/, '');
  const full = prefix + '_' + core + '_' + suffix;
  return full.length <= 42 ? full : full.slice(0, 33) + '_' + createHash('sha256').update(full).digest('hex').slice(0, 8);
}
function tables() {
  return model.domains.flatMap(domain => domain.entities.map(entity => {
    const fields = model.fieldRows(domain, entity).map(([name, logicalType, , , description]) => {
      let type = logicalType.replace(/ NULL$/, '');
      const isNullable = logicalType.endsWith(' NULL') || (nullable[entity.name] || '').split(' ').includes(name);
      if (name === 'id') type = 'BIGINT UNSIGNED';
      if (type === '公共字段') {
        assert.ok(common[name], entity.name + '.' + name);
        return { name, type: common[name].split(' NOT NULL')[0], nullable: false, comment: description, sql: identifier(name) + ' ' + common[name] + ' COMMENT ' + literal(description) };
      }
      assert.match(type, /^(?:(?:BIGINT|SMALLINT|TINYINT|INT)(?: UNSIGNED)?|(?:VARBINARY|VARCHAR|CHAR)\(\d+\)|DECIMAL\(\d+,\d+\)|DATETIME\(3\)|DATE|JSON|TEXT)$/);
      const collation = /^(VARCHAR|CHAR)\(/.test(type) ? ' CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin' : '';
      let defaults = name === 'id' ? ' AUTO_INCREMENT' : '';
      if (name === 'created_at' || name === 'updated_at') defaults = common[name].replace('DATETIME(3) NOT NULL', '');
      return { name, type, nullable: isNullable, comment: description, sql: identifier(name) + ' ' + type + collation + (isNullable ? ' NULL' : ' NOT NULL') + defaults + ' COMMENT ' + literal(description) };
    });
    const names = new Set(fields.map(field => field.name));
    assert.equal(names.size, fields.length);
    for (const name of (nullable[entity.name] || '').split(' ').filter(Boolean)) assert.ok(names.has(name), entity.name + '.' + name);
    const indexes = model.indexDefinitions(entity.keys).map(key => ({ kind: key.split(' ')[0], columns: model.indexedFields(key) }));
    if (names.has('id') && !indexes.some(index => index.kind === 'PK')) indexes.unshift({ kind: 'PK', columns: ['id'] });
    for (const index of indexes) for (const name of index.columns) assert.ok(names.has(name), entity.name + '.' + name);
    const definitions = fields.map(field => field.sql);
    for (const index of indexes) {
      // FK in the logical dictionary is a lookup, never a physical foreign key.
      const columns = index.columns.map(identifier).join(', ');
      definitions.push(index.kind === 'PK' ? 'PRIMARY KEY (' + columns + ')' :
        (index.kind === 'UK' ? 'UNIQUE KEY ' : 'KEY ') + identifier(objectName(index.kind === 'UK' ? 'uk' : 'idx', entity.name, index.columns.join('_'))) +
        ' (' + columns + ') COMMENT ' + literal(index.kind === 'UK' ? '业务唯一键 / 幂等键' : '查询索引 / 逻辑引用'));
    }
    const checks = [...(extraChecks[entity.name] || [])];
    for (const field of fields) {
      if (field.name === 'currency_code') checks.push('currency_code = \'CNY\'');
      const values = model.enumeration(domain, entity, field.name);
      if (values.startsWith('枚举：')) {
        const codes = [...values.matchAll(/(?:^枚举：|；)(\d+)=/g)].map(match => match[1]);
        assert.ok(codes.length);
        checks.push(identifier(field.name) + ' IN (' + codes.join(', ') + ')');
      }
    }
    checks.forEach((check, index) => definitions.push('CONSTRAINT ' + identifier(objectName('chk', entity.name, String(index + 1))) + ' CHECK (' + check + ')'));
    const sql = '-- ' + domain.id + ' / ' + entity.title + '\nCREATE TABLE ' + identifier(entity.name) +
      ' (\n  ' + definitions.join(',\n  ') + '\n) ENGINE=InnoDB ROW_FORMAT=DYNAMIC DEFAULT CHARACTER SET utf8mb4 COLLATE=utf8mb4_0900_bin COMMENT=' + literal(entity.title) + ';\n';
    if (appendOnly.has(entity.name)) assert.ok(!fields.some(field => ['updated_at', 'updated_by', 'version', 'deleted_id'].includes(field.name)));
    return { name: entity.name, fields, indexes, checks, sql };
  }));
}
function generate() {
  const result = tables();
  assert.equal(result.length, model.stats.entities);
  assert.equal(result.reduce((sum, table) => sum + table.fields.length, 0), model.stats.fields);
  let sql = '-- Generated by: node doc/sql/domain/generate.cjs\n-- Fresh database only. No DROP, IF NOT EXISTS, foreign keys or business seed data.\nSET NAMES utf8mb4 COLLATE utf8mb4_0900_bin;\nSET SESSION time_zone = \'+00:00\';\n\n';
  sql += result.map(table => table.sql).join('\n');
  for (const table of appendOnly) {
    for (const action of ['UPDATE', 'DELETE']) {
      sql += '\nCREATE TRIGGER ' + identifier(objectName('trg', table, action.toLowerCase())) + ' BEFORE ' + action +
        ' ON ' + identifier(table) + " FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Append-only table: " + table + "';\n";
    }
  }
  const frozenFields={
    tax_submission_tab:['tax_case_number','submission_revision_number','package_hash','evidence_manifest_json','submission_content_json','previous_submission_revision_number','correction_event_number','created_at'],
    customs_filing_request_tab:['request_number','declaration_number','revision_number','action_code','request_hash','request_payload_json','created_by','created_at']
  };
  for(const [table,fields]of Object.entries(frozenFields)){
    sql+='\nDELIMITER $$\nCREATE TRIGGER '+identifier(objectName('trg',table,'freeze_content'))+' BEFORE UPDATE ON '+identifier(table)+
      ' FOR EACH ROW BEGIN IF '+fields.map(field=>'NOT (OLD.'+identifier(field)+' <=> NEW.'+identifier(field)+')').join(' OR ')+
      " THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Frozen business content: "+table+"'; END IF; END$$\nDELIMITER ;\n";
    sql+='\nCREATE TRIGGER '+identifier(objectName('trg',table,'delete'))+' BEFORE DELETE ON '+identifier(table)+
      " FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Retained business history: "+table+"';\n";
  }
  return sql;
}
if (require.main === module) {
  const target = path.join(__dirname, 'schema.sql');
  const sql = generate();
  if (process.argv.includes('--check')) assert.equal(fs.readFileSync(target, 'utf8'), sql, 'Regenerate schema.sql');
  else fs.writeFileSync(target, sql);
  console.log(model.stats.entities+' tables / '+model.stats.fields+' columns; schema ' + (process.argv.includes('--check') ? 'matches' : 'generated'));
}
module.exports = { tables, generate, appendOnly };
