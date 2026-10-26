'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const M=require('../demo-model.js'), D=require('../demo-state.js'), S=require('../product-guide-state.js');
const page=id=>M.pages.find(item=>item.id===id);
const session=(role,source=role,actor=role==='reviewer'?'SYN-PERSON-2':'SYN-PERSON-1')=>({role,source,actor});
function run(state,id,role,action,input={},source=role,actor) {
  const p=page(id),r=D.record(state,p,role,source);
  const next=structuredClone(state);
  const result=D.apply(next,id,session(role,source,actor),action,{version:r?.version,confirmed:true,checked:true,reason:'合成核对意见',...input});
  Object.assign(state,next);
  return result;
}
function create(state) {
  run(state,'supplier-submit','A','reserve');
  run(state,'supplier-submit','A','supplier-submit');
  run(state,'payer-submit','D','payer-submit');
}
test('all goals are reachable by their actual participants, with filled valid drafts but no official facts',()=>{
  const state=D.initial(); D.validate(state);
  assert.equal(state.data.tradeCreated,false);
  assert.equal(M.actions.length,69);
  for(const action of M.actions) {
    assert.ok(action.protocols.length,action.id);
    for(const role of action.roles)assert.ok(M.pages.some(p=>p.actions.includes(action)&&M.canRead(p,role)),action.id+': '+role);
  }
  for(const p of M.pages)for(const role of p.owners) {
    const record=D.record(state,p,role);
    assert.equal(record.status,'draft');
    assert.deepEqual(S.errors(p,record.values),[],p.id);
    assert.equal(record.requestId,undefined);
  }
  assert.equal(M.fullNames('INVOICE / SYN-FILE-001 / A与B / D可用'),'付款发票 / SYN-FILE-001 / 供应商与出口代理 / 付款方可用');
});
test('first submission, repeated original-resource edits, unknown recovery and private isolation remain consistent',()=>{
  const state=D.initial();
  assert.throws(()=>run(state,'payer-submit','D','payer-submit'),/上游|首次/);
  create(state);
  const payer=structuredClone(state.data.records['payer-submit']);
  for(const address of ['合成地址二','合成地址三']) {
    const r=D.record(state,page('supplier-edit'),'A');
    run(state,'supplier-edit','A','save',{values:{...r.values,supplierAddress:address}});
    run(state,'supplier-edit','A','supplier-edit');
  }
  assert.equal(state.data.records['supplier-submit'].version,3);
  assert.deepEqual(state.data.records['payer-submit'],payer);
  assert.equal(state.snapshots['supplier-submit'].length,3);
  assert.equal(state.snapshots['supplier-submit'][0].values.supplierAddress,M.values(page('supplier-submit')).supplierAddress);
  assert.throws(()=>D.record(state,page('payer-submit'),'A'),/权限/);
  assert.throws(()=>D.record(state,page('funds-reconcile'),'A','D'),/私有/);
  const unknown=D.initial();
  run(unknown,'supplier-submit','A','reserve');
  run(unknown,'supplier-submit','A','submit-unknown');
  const id=unknown.data.records['supplier-submit'].requestId;
  assert.throws(()=>run(unknown,'supplier-submit','A','supplier-submit'),/原受理/);
  assert.throws(()=>run(unknown,'supplier-edit','A','save',{values:M.values(page('supplier-edit'))}),/结果未知/);
  run(unknown,'supplier-submit','A','recover');
  assert.equal(unknown.data.records['supplier-submit'].requestId,id);
  assert.equal(unknown.data.sequence,1);
});
test('the modification draft starts with the actual first submission, not the original example',()=>{
  const state=D.initial(),values={...M.values(page('supplier-submit')),supplierAddress:'首次填写的合成新地址'};
  run(state,'supplier-submit','A','save',{values});
  run(state,'supplier-submit','A','reserve');run(state,'supplier-submit','A','supplier-submit');
  assert.equal(D.record(state,page('supplier-edit'),'A').values.supplierAddress,values.supplierAddress);
  assert.equal(state.snapshots['supplier-edit'][0].values.supplierAddress,M.values(page('supplier-edit')).supplierAddress);
  D.validate(state);
});
test('independent review and source changes preserve immutable snapshots and invalidate approvals',()=>{
  const state=D.initial(); create(state);
  run(state,'contract-basis','B','basis-submit');
  assert.throws(()=>run(state,'contract-basis','reviewer','basis-review',{},'B','SYN-PERSON-1'),/不能审核本人/);
  run(state,'contract-basis','reviewer','basis-review',{},'B');
  assert.equal(state.data.records['contract-basis'].status,'approved');
  run(state,'contract-draft','A','save',{values:M.values(page('contract-draft'))});
  run(state,'contract-draft','A','submit');
  run(state,'supplier-edit','A','save',{values:{...M.values(page('supplier-edit')),supplierAddress:'合成新地址'}});
  run(state,'supplier-edit','A','submit');
  assert.equal(state.data.records['contract-basis'].stale,true);
  assert.throws(()=>run(state,'contract-draft','reviewer','approve',{},'A'),/上游/);
});
test('payer sees only an effective approved invoice, without internal review reasons',()=>{
  const state=D.initial();
  assert.equal(D.record(state,page('payer-invoice'),'D'),undefined);
  create(state);
  run(state,'payer-invoice','finance','submit');
  assert.equal(D.record(state,page('payer-invoice'),'D'),undefined);
  run(state,'payer-invoice','reviewer','approve',{},'finance');
  const shared=D.record(state,page('payer-invoice'),'D');
  assert.equal(shared.status,'approved'); assert.deepEqual(shared.history,[]);
  assert.equal(shared.approval,undefined);
  run(state,'payer-invoice','finance','upload',{name:'新合成发票.txt',size:10});
  assert.equal(D.record(state,page('payer-invoice'),'D'),undefined);
  run(state,'payer-invoice','finance','save',{values:{...M.values(page('payer-invoice')),invoice:'合成新发票'}});
  assert.equal(D.record(state,page('payer-invoice'),'D'),undefined);
});
test('materials save metadata only, version per owner and reject unauthorized or submitted edits',()=>{
  const state=D.initial(),input={name:'原创合成.txt',size:120};
  run(state,'supplier-submit','A','upload',input); run(state,'supplier-submit','A','upload',input);
  assert.equal(state.files[1].version,2);
  assert.deepEqual(Object.keys(state.files[0]).sort(),['name','page','role','size','version']);
  assert.throws(()=>D.apply(state,'supplier-submit',session('B','A'),'upload',input),/仅责任方/);
  create(state);
  assert.throws(()=>run(state,'supplier-submit','A','upload',input),/已提交/);
});
test('reports remain unknown; dispositions require another person and reject changed source versions',()=>{
  const state=D.initial();
  run(state,'crossflow-report','B','s8-report');
  const report=structuredClone(state.requests[0]);
  assert.match(report.reason,/四项均为待核/);
  run(state,'funds-reconcile','finance','s5-n17-reconciliation');
  assert.throws(()=>run(state,'funds-reconcile','reviewer','s5-n17-reconciliation',{},'finance','SYN-PERSON-1'),/不能复核本人/);
  run(state,'funds-reconcile','reviewer','s5-n17-reconciliation',{},'finance');
  assert.equal(state.requests[1].status,'reviewed');
  run(state,'funds-reconcile','finance','s5-n17-reconciliation');
  run(state,'supplier-submit','A','save',{values:M.values(page('supplier-submit'))});
  assert.throws(()=>run(state,'funds-reconcile','reviewer','s5-n17-reconciliation',{},'finance'),/源版本/);
  assert.deepEqual(state.requests[0],report);
});
test('official and handoff goals block rather than manufacture success or balance changes',()=>{
  const state=D.initial();
  for(const p of M.pages)for(const action of p.actions.filter(item=>['official','handoff'].includes(item.kind))) {
    const role=action.roles[0],source=D.sourceFor(p,role);
    const before=structuredClone(state);
    assert.throws(()=>run(state,p.id,role,action.id,{},source),/正式办理已阻断/,action.id);
    assert.deepEqual(state,before);
  }
  const broken=D.initial(); broken.data.records.bad={source:'A',version:1,values:{}};
  assert.throws(()=>D.validate(broken),/损坏/);
  const missing=D.initial(); delete missing.snapshots['supplier-submit'];
  assert.throws(()=>D.validate(missing),/缺少资料|快照/);
});
test('every mapped action produces a local result or an explicit business gate, not an unsupported handler',()=>{
  const baseline=D.initial();create(baseline);
  run(baseline,'contract-basis','B','save',{values:M.values(page('contract-basis'))});
  run(baseline,'contract-basis','B','basis-submit');
  run(baseline,'contract-basis','reviewer','basis-review',{},'B');
  for(const p of M.pages)for(const action of p.actions)for(const role of action.roles) {
    const state=structuredClone(baseline),source=D.sourceFor(p,role);
    try {
      const result=run(state,p.id,role,action.id,{},source);
      assert.equal(typeof result,'string');assert.ok(result.length);
      D.validate(state);
      if(M.kindFor(action,role)==='query')assert.deepEqual(state,baseline);
      else assert.notDeepEqual(state,baseline,action.id);
    } catch(error) {
      assert.doesNotMatch(error.message,/未支持|未知任务|Cannot|undefined|not a function|资料来源不适用/,action.id+': '+role);
      assert.match(error.message,/正式办理|上游资料|只审核|本任务不开放|只允许本方|先完整填写|尚无此来源|当前版本已提交|原资料版本已变化|版本变化/,action.id+': '+role);
      assert.deepEqual(state,baseline);
    }
  }
});
