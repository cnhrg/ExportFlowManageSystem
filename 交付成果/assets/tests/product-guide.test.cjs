'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const M = require('../product-guide-model.js');
const S = require('../product-guide-state.js');
const state = () => S.initial();
const session = (role, source = role, actor = 'SYN-PERSON-1') => ({role, source, actor});
const definition = id => M.tasks.find(task => task.id === id);
const values = id => Object.fromEntries(definition(id).fields.map(field => [field.key, field.example]));
function save(s,id,role,overrides = {}) {
  const record = S.read(s,definition(id),role);
  return S.apply(s,id,session(role),'save',{version:record?.version,values:{...values(id),...overrides}});
}
function submit(s,id,role,action = 'submit') {
  return S.apply(s,id,session(role),action,{version:S.read(s,definition(id),role).version,confirmed:true});
}
function create(s) {save(s,'supplier-submit','A'); S.apply(s,'supplier-submit',session('A'),'reserve'); submit(s,'supplier-submit','A');}
test('only A first submission creates the trade; D is independent and not a second A record', () => {
  const s = state();
  save(s,'supplier-submit','A');
  assert.equal(s.tradeCreated,false);
  assert.throws(() => submit(s,'supplier-submit','A'),/预取号/);
  S.apply(s,'supplier-submit',session('A'),'reserve');
  submit(s,'supplier-submit','A');
  save(s,'payer-submit','D'); submit(s,'payer-submit','D');
  assert.equal(s.tradeCreated,true);
  assert.equal(Object.keys(s.records).length,2);
  assert.throws(() => submit(s,'payer-submit','D'),/已提交/);
  assert.throws(() => S.apply(s,'supplier-submit',session('D','A'),'save',{values:values('supplier-submit')}),/权限/);
  assert.throws(() => S.apply(s,'supplier-submit',session('B','A'),'save',{values:values('supplier-submit')}),/不能修改/);
});
test('original-key recovery never resubmits an unknown receipt or repeats creation', () => {
  const s = state(); save(s,'supplier-submit','A'); S.apply(s,'supplier-submit',session('A'),'reserve'); submit(s,'supplier-submit','A','submit-unknown');
  const request = s.records['supplier-submit'].requestId;
  assert.throws(() => submit(s,'supplier-submit','A'),/原受理/);
  assert.throws(() => S.apply(s,'supplier-submit',session('A','A','SYN-PERSON-2'),'recover'),/原提交人/);
  S.apply(s,'supplier-submit',session('A'),'recover');
  assert.equal(s.records['supplier-submit'].requestId,request);
  assert.equal(s.sequence,1);
});
test('editing replaces the original own resource and preserves other-party declarations', () => {
  const s = state(); create(s); save(s,'payer-submit','D'); submit(s,'payer-submit','D');
  const before = structuredClone(s.records['payer-submit']);
  save(s,'supplier-edit','A'); submit(s,'supplier-edit','A');
  assert.equal(s.records['supplier-submit'].version,2);
  assert.deepEqual(s.records['payer-submit'],before);
  assert.throws(() => save(s,'supplier-edit','A',{consignee:'另一个主体'}),/关系依赖/);
  assert.throws(() => save(s,'supplier-edit','A',{nominatedPayer:'SYN-OTHER-D'}),/关系依赖/);
  assert.throws(() => S.apply(s,'payer-submit',session('A','D'),'save',{version:1,values:values('payer-submit')}),/权限/);
});
test('single-line filing checks exact totals, weights and conditional relationship evidence', () => {
  for (const overrides of [
    {quantity:'0'},{quantity:'1e2'},{currency:'USD'},{cartons:'1.2'},
    {grossWeight:'99.999'},{netWeight:'100.0000001'},{money:'12500.01'}
  ]) assert.throws(() => save(state(),'supplier-submit','A',overrides),/数量|CNY|整数|毛重|小数|金额/);
  const s = state();
  save(s,'supplier-submit','A',{quantity:'0.1',unitPrice:'0.20',money:'0.02',netWeight:' 0.000001 ',grossWeight:'0.000002'});
  assert.equal(s.records['supplier-submit'].values.netWeight,'0.000001');
  assert.throws(() => save(s,'payer-submit','D',{relationshipEvidence:''}),/支持材料/);
  save(s,'payer-submit','D',{relationshipKind:'同一法定主体',relationshipEvidence:''});
  assert.equal(s.records['payer-submit'].values.relationshipEvidence,'');
});
test('replacing a filing invalidates transitive approvals without altering the other party', () => {
  const s = state(); create(s); save(s,'payer-submit','D'); submit(s,'payer-submit','D');
  save(s,'contract-basis','B'); submit(s,'contract-basis','B');
  S.apply(s,'contract-basis',session('reviewer','B','SYN-PERSON-2'),'approve',{version:1,reason:'合成独审',checked:true});
  save(s,'contract-draft','A'); submit(s,'contract-draft','A');
  const payer = structuredClone(s.records['payer-submit']);
  save(s,'supplier-edit','A',{supplierAddress:'合成新地址'}); submit(s,'supplier-edit','A');
  assert.equal(s.records['contract-basis'].stale,true);
  assert.equal(s.records['contract-basis'].approval,null);
  assert.equal(s.records['contract-draft'].stale,true);
  assert.equal(s.records['supplier-edit'].stale,false);
  assert.deepEqual(s.records['payer-submit'],payer);
});
test('review requires another person and fresh upstream; changes invalidate approvals', () => {
  const s = state(); create(s); save(s,'payer-submit','D'); submit(s,'payer-submit','D');
  save(s,'contract-basis','B'); submit(s,'contract-basis','B');
  const input = {version:1,reason:'合成材料已核对',checked:true};
  assert.throws(() => S.apply(s,'contract-basis',session('reviewer','B'),'approve',input),/不能审核本人/);
  S.apply(s,'contract-basis',session('reviewer','B','SYN-PERSON-2'),'approve',input);
  save(s,'contract-draft','A'); submit(s,'contract-draft','A');
  save(s,'contract-basis','B',{scope:'修订服务范围'});
  assert.equal(s.records['contract-draft'].stale,true);
  assert.throws(() => S.apply(s,'contract-draft',session('reviewer','A','SYN-PERSON-2'),'approve',input),/上游版本/);
});
test('E/F shared catalogue never grants finance or A confirmation actions; official result is blocked', () => {
  const s = state(); create(s);
  for (const role of ['E','F']) {
    assert.equal(M.canRead(definition('bank-allocation'),role),false);
    assert.throws(() => S.apply(s,'customs-confirm',session(role,'A'),'save',{values:values('customs-confirm')}),/权限/);
  }
  assert.throws(() => S.apply(s,'bank-allocation',session('finance'),'execute'),/正式办理已阻断/);
  assert.throws(() => S.apply(s,'customs-official',session('reviewer','F','SYN-PERSON-2'),'approve',{version:1,checked:true,reason:'x'}),/先完整填写/);
});
test('private shared task stores A/D declarations separately and exact currency rejects coercion', () => {
  const s = state(); create(s);
  save(s,'funds-reconcile','A',{receipt:'SYN-A-PRIVATE'});
  save(s,'funds-reconcile','D',{receipt:'SYN-D-PRIVATE'});
  assert.equal(S.read(s,definition('funds-reconcile'),'A').values.receipt,'SYN-A-PRIVATE');
  assert.equal(S.read(s,definition('funds-reconcile'),'D').values.receipt,'SYN-D-PRIVATE');
  for (const money of ['1e3','-1','12.345','  ','001']) assert.throws(() => save(s,'funds-reconcile','A',{money}),/人民币|填写/);
  assert.throws(() => S.apply(s,'funds-reconcile',session('A'),'save',{version:0,values:values('funds-reconcile')}),/版本已变化/);
});
test('every detailed use case and N01–N23 maps to the generated manuals', () => {
  const modules = ['system','step-two','step-three','step-four','step-five','step-six','step-seven','step-eight'];
  const internal = fs.readFileSync(path.resolve(__dirname,'../../../doc/对内运营产品需求与操作手册.html'),'utf8');
  const external = fs.readFileSync(path.resolve(__dirname,'../../../doc/对外产品需求与操作手册.html'),'utf8');
  for (const module of modules) for (const item of require('../'+module+'-usecases-model.js').useCases) {
    assert.ok(M.tasks.some(task => task.usecases.includes(item.id)),item.id);
    assert.ok(internal.includes('id="usecase-'+item.id+'"'),item.id);
  }
  for (let i=1;i<=23;i++) assert.ok(M.tasks.some(task => task.nodes.includes('N'+String(i).padStart(2,'0'))));
  for (const task of M.tasks.filter(task => task.owners.includes('A') || task.owners.includes('D') || task.viewers?.includes('D'))) assert.ok(external.includes('id="task-'+task.id+'"'));
});
test('manual prose spells out roles and terms while retaining exact reference identifiers', () => {
  for (const audience of ['对外产品需求与操作手册','对内运营产品需求与操作手册']) {
    const html = fs.readFileSync(path.resolve(__dirname,'../../../doc/'+audience+'.html'),'utf8');
    const prose = html.replace(/<code\b[^>]*>[\s\S]*?<\/code>/g,'').replace(/<[^>]*>/g,' ');
    assert.doesNotMatch(prose,/(?<![A-Za-z0-9_-])[A-F](?![A-Za-z0-9_-])|三单|独审|四流|\b(?:INVOICE|CNY|CNH|OCR|HS|URL|PDF|unknown|pass|fail|localStorage|IndexedDB)\b/);
    assert.doesNotMatch(prose,/装装箱单|中国供应商供应商|付款方付款方|浏览器浏览器/);
    assert.match(html,/角色全名与术语速查/);
    assert.match(prose,/备货与出口单证（流程节点编号N05）/);
    assert.ok(html.includes('#demo/' + (audience.startsWith('对外') ? 'external/A' : 'internal/B') + '/trade/supplier-submit'));
    assert.ok(html.includes('SYN-A-001</code>'));
    assert.ok(html.includes('<code>POST /api/v1/trades</code>'));
    assert.ok(html.includes('<code>CNY</code>'));
    for (const task of M.tasks.filter(task => task.owners.includes('A') || task.owners.includes('D'))) {
      assert.ok(html.includes('#task-'+task.id));
    }
    if (audience.startsWith('对外')) {
      assert.doesNotMatch(prose,/切换独立审核员及另一位演示人员/);
      assert.match(prose,/不切换内部身份代为批准/);
    }
  }
});
