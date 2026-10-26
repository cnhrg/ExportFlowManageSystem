'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { tables, appendOnly, generate } = require('./generate.cjs');
const mysql = '/opt/homebrew/opt/mysql@8.4/bin/mysql';
const base = path.join(os.homedir(), 'Library/ExportTradeLocal');
const schema = tables();
const checks=[];
const database = process.argv[process.argv.indexOf('--database')+1];
assert.ok(process.argv.includes('--database') && /^verify_domain_[a-f0-9]{12}$/.test(database),
  'Explicit empty verify_domain_<12 hex> isolation database required; export_trade and old demos forbidden');
assert.equal(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'), generate());
function run(sql, expectedError) {
  const result = spawnSync(mysql, ['--defaults-file=' + base + '/root-client.cnf',
    '--batch', '--skip-column-names', '--raw', database], { input: sql, encoding: 'utf8' });
  if (result.error) throw result.error;
  if (expectedError) {
    assert.notEqual(result.status, 0, 'Expected SQL rejection');
    assert.match(result.stderr, new RegExp('ERROR ' + expectedError + '\\b'), result.stderr);
  } else {
    assert.equal(result.status, 0, result.stderr);
  }
  return result.stdout.trim();
}
const quote = value => "'" + String(value).replace(/'/g, "''") + "'";
function insert(name, overrides = {}) {
  const table = schema.find(table => table.name === name);
  const fields = table.fields.filter(field => field.name !== 'id');
  const values = fields.map(field => {
    if (Object.hasOwn(overrides, field.name)) return overrides[field.name] === null ? 'NULL' : quote(overrides[field.name]);
    if (field.nullable) return 'NULL';
    if (field.type === 'JSON') return "'{}'";
    if (field.type === 'DATETIME(3)') return "'2026-10-25 00:00:00.000'";
    if (field.type === 'DATE') return "'2026-10-25'";
    if (/INT|DECIMAL/.test(field.type)) return '1';
    if (/BINARY/.test(field.type)) return "X'01'";
    if (field.name === 'currency_code') return "'CNY'";
    if (field.name === 'accounting_period') return "'202610'";
    if (field.type === 'CHAR(64)') return quote('a'.repeat(64));
    return "'check'";
  });
  return 'INSERT INTO `' + name + '` (' + fields.map(field => '`' + field.name + '`').join(',') + ') VALUES (' + values.join(',') + ');';
}
function transaction(sql, error) {
  const result=run('START TRANSACTION;\n' + sql + '\nROLLBACK;', error);
  checks.push({name:'事务约束场景'+(checks.length+1),layer:'database',
    tables:[...new Set([...sql.matchAll(/(?:INSERT INTO|UPDATE|DELETE FROM)\s+`?([a-z_]+)`?/g)].map(match=>match[1]))],
    statementKinds:[...new Set([...sql.matchAll(/\b(INSERT|UPDATE|DELETE)\b/g)].map(match=>match[1]))],
    expected:error?'拒绝且连接关闭回滚，MySQL错误'+error:'事务接受，显式ROLLBACK',
    observed:error?'实际错误码已匹配'+error:'事务已接受并回滚',passed:true});
  return result;
}
const actual = JSON.parse(run(`SELECT JSON_ARRAYAGG(JSON_OBJECT('table',table_name,'name',column_name,'type',column_type,'nullable',is_nullable,'collation',collation_name,'comment',column_comment))
 FROM information_schema.columns WHERE table_schema=DATABASE();`));
assert.equal(actual.length, schema.reduce((sum,table)=>sum+table.fields.length,0));
assert.equal(run("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND engine='InnoDB' AND table_comment<>'';"), String(schema.length));
assert.equal(run("SELECT COUNT(*) FROM information_schema.referential_constraints WHERE constraint_schema=DATABASE();"), '0');
assert.equal(run("SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema=DATABASE();"), String(appendOnly.size * 2+4));
for (const table of schema) {
  const columns = actual.filter(column => column.table === table.name);
  assert.deepEqual(columns.map(column => column.name).sort(), table.fields.map(field => field.name).sort());
  for (const field of table.fields) {
    const column = columns.find(column => column.name === field.name);
    assert.equal(column.type.toUpperCase(), field.type, table.name + '.' + field.name);
    assert.equal(column.nullable, field.nullable ? 'YES' : 'NO');
    assert.equal(column.comment, field.comment);
    if (/^(CHAR|VARCHAR)/.test(field.type)) assert.equal(column.collation, 'utf8mb4_0900_bin');
  }
  assert.equal(run('SELECT COUNT(*) FROM `' + table.name + '`;'), '0', 'Refusing tests on nonempty database');
  const indexes = JSON.parse(run("SELECT JSON_ARRAYAGG(JSON_OBJECT('name', index_name,'column',column_name,'position',seq_in_index,'unique',non_unique)) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name=" + quote(table.name) + ';'));
  for (const expected of table.indexes) {
    assert.ok(indexes.some(index => {
      const columns = indexes.filter(item => item.name === index.name).sort((a, b) => a.position - b.position);
      return (expected.kind !== 'PK' || index.name === 'PRIMARY') &&
        index.unique === (['PK', 'UK'].includes(expected.kind) ? 0 : 1) &&
        JSON.stringify(columns.map(column => column.column)) === JSON.stringify(expected.columns);
    }), table.name + ' missing index');
  }
  checks.push({name:table.name+'结构与空库守卫',layer:'database',columns:columns.length,
    expected:'字段名/类型/NULL/注释/排序规则/唯一及普通索引与权威模型相同，行数0',observed:'逐项一致，行数0',passed:true});
}
const trade = overrides => insert('trade_record_tab', {
  trade_number: 'CHECK-1', trade_status_code: 2, approved_revision_number: 0,
  transaction_goods_items_json: '[]', transaction_filing_document_references_json: '[]', ...overrides
});
transaction(trade({}) + trade({}), 1062);
transaction(trade({}) + trade({ trade_number: 'CHECK-1 ' })); // NO PAD: distinct, not silently collapsed.
transaction(trade({ trade_status_code: 1 }), 3819);
transaction(insert('contract_record_tab', { contract_number: 'contract1', contract_scope_code: 2 }) +
  insert('contract_record_tab', { contract_number: 'contract2', contract_scope_code: 2 }));
transaction(insert('contract_record_tab', { contract_number: 'contract1', contract_scope_code: 1, trade_number: 'T1' }) +
  insert('contract_record_tab', { contract_number: 'contract2', contract_scope_code: 1, trade_number: 'T1' }), 1062);
transaction(insert('contract_record_tab', { contract_scope_code: 1, trade_number: null }), 3819);
transaction(insert('contract_revision_tab', { review_snapshot_json: null }));
transaction(insert('payment_transaction_tab', { transaction_type: 3, amount: 299 }), 3819);
transaction(insert('payment_transaction_tab', { currency_code: 'USD' }), 3819);
transaction(insert('payment_fund_flow_tab', { event_type: 3, bucket_from: null, bucket_to: 2 }), 3819);
transaction(insert('payment_fund_flow_tab', { event_type: 8, amount: 300, transaction_number: 'fee1', bucket_from: null, bucket_to: null }));
const ledger = insert('account_ledger_entry_tab', {});
transaction(ledger + 'UPDATE account_ledger_entry_tab SET amount=2;', 1644);
transaction(ledger + 'DELETE FROM account_ledger_entry_tab;', 1644);
transaction(insert('account_ledger_entry_tab', { amount: 0 }), 3819);
transaction(insert('account_voucher_tab', { voucher_number: 'v1', idempotency_key: 'k1', reversal_of_voucher_number: 'original' }) +
  insert('account_voucher_tab', { voucher_number: 'v2', idempotency_key: 'k2', reversal_of_voucher_number: 'original' }), 1062);
transaction(insert('customs_declaration_revision_tab')+'UPDATE customs_declaration_revision_tab SET content_json=\'{"changed":true}\';',1644);
const tax=overrides=>insert('tax_submission_tab',{evidence_manifest_json:'[]',...overrides});
transaction(tax()+'UPDATE tax_submission_tab SET submission_content_json=\'{"changed":true}\';',1644);
transaction(tax()+'UPDATE tax_submission_tab SET review_snapshot_json=\'{"result":2}\',submission_status=3;');
transaction(tax()+'DELETE FROM tax_submission_tab;',1644);
transaction(insert('customs_filing_request_tab')+"UPDATE customs_filing_request_tab SET request_hash=REPEAT('b',64);",1644);
transaction(insert('customs_filing_request_tab')+'UPDATE customs_filing_request_tab SET execution_status=3;');
transaction(insert('tax_case_tab',{tax_type_code:1,claimed_amount:1}),3819);
transaction(insert('tax_case_tab',{tax_type_code:1,claimed_amount:null}));
transaction(insert('tax_event_tab',{event_type_code:7}),3819);
transaction(insert('payment_fund_flow_tab',{event_type:10,transaction_number:'fee',bucket_from:null,bucket_to:null}),3819);
transaction(insert('payment_fund_flow_tab',{event_type:10,transaction_number:'fee',bucket_from:null,bucket_to:null,bank_account_id:1,bank_account_fingerprint:'a'.repeat(64),bank_event_key:'synthetic-bank-reference'}));
transaction(insert('payment_fund_flow_tab',{event_type:11,transaction_number:'bankfee',bucket_from:2,bucket_to:null,bank_account_id:1,bank_account_fingerprint:'a'.repeat(64),bank_event_key:'synthetic-bank-fee'}),3819);
transaction(insert('payment_fund_flow_tab',{event_type:11,transaction_number:'bankfee',bucket_from:null,bucket_to:null,bank_account_id:1,bank_account_fingerprint:'a'.repeat(64),bank_event_key:'synthetic-bank-fee'}));
for (const table of schema) assert.equal(run('SELECT COUNT(*) FROM `' + table.name + '`;'), '0');
console.log('MySQL: '+schema.length+' empty tables / '+actual.length+' typed columns in '+database+'; indexes, checks and history guards verified. Application permissions not changed or tested.');
if(process.argv.includes('--output')){
  const output=process.argv[process.argv.indexOf('--output')+1];
  assert.ok(output && !output.startsWith('--'),'Explicit output path required');
  fs.writeFileSync(output,JSON.stringify({database,sourceDdlSha256:require('node:crypto').createHash('sha256').update(generate()).digest('hex'),
    finishedAt:new Date().toISOString(),tableCount:schema.length,columnCount:actual.length,
    checks,passed:checks.every(check=>check.passed),applicationPermissionsTested:false,
    externalSystemsTested:false,businessSchemaMigrated:false},null,2)+'\n');
}
