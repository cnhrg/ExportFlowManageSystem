'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../../..'),model=require('../../../交付成果/assets/step-eight-usecases-model.js');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,'doc/examples/step8',name),'utf8'));
const proto=fs.readFileSync(path.join(root,'proto/trade/reconciliation/v1/reconciliation.proto'),'utf8');
const examples=read('http-examples.json'),rpcs=read('rpc-examples.json'),checks=[];
function check(name,test){test();checks.push({name,passed:true});}
check('Every concrete goal has separate black-box and implementation diagrams at default70%',()=>{
  assert.equal(model.useCases.length,11);
  for(const goal of model.useCases){
    assert.match(goal.id,/^s8-/);assert.equal(goal.diagramScale,0.7);assert.ok(goal.actors.length);
    assert.ok(goal.actors.every(actor=>typeof actor==='string'&&!/[、与]/.test(actor)));
    assert.match(goal.systemSequence,/actor PERSON/);assert.doesNotMatch(goal.systemSequence,/MySQL|S3|COMMIT|ClamAV|FOR UPDATE/);
    assert.match(goal.sequence,/MySQL/);
    if(!['s8-context','s8-query'].includes(goal.id)){
      for(const text of ['READ COMMITTED','先查原','当前读','短事务COMMIT','事务外','原键','VersionId'])assert.ok(goal.sequence.includes(text),goal.id+': '+text);
      const writes=goal.endpoints.map(id=>model.endpoints.find(endpoint=>endpoint.id===id)).filter(endpoint=>endpoint.method==='POST');
      for(const endpoint of writes)assert.ok(goal.sequence.includes(endpoint.rpc),goal.id+': '+endpoint.rpc);
      assert.equal((goal.sequence.match(/BEGIN READ COMMITTED/g)||[]).length,writes.length);
    }
  }
});
check('Browser globals and CommonJS expose the same step without shared-workspace changes',()=>{
  const context={globalThis:null};context.globalThis=context;
  vm.runInNewContext(fs.readFileSync(path.join(root,'交付成果/assets/system-usecases-model.js'),'utf8'),context);
  vm.runInNewContext(fs.readFileSync(path.join(root,'交付成果/assets/step-eight-usecases-model.js'),'utf8'),context);
  vm.runInNewContext(fs.readFileSync(path.join(root,'交付成果/assets/step-eight-usecases-artifacts.js'),'utf8'),context);
  assert.equal(context.EXPORT_STEP_EIGHT_USECASES_MODEL.id,model.id);
  assert.ok(context.EXPORT_STEP_EIGHT_ARTIFACTS['doc/examples/step8/http-examples.json']);
});
check('Every POST has an explicit request, resource response and readable Location',()=>{
  assert.equal(examples.length,model.endpoints.length);assert.equal(rpcs.length,examples.length);
  const reads=model.endpoints.filter(endpoint=>endpoint.method==='GET').map(endpoint=>new RegExp('^'+endpoint.path.replace(/\{[^}]+\}/g,'[^/]+')+'$'));
  for(const [index,endpoint]of model.endpoints.entries()){
    const example=examples[index],rpc=rpcs[index];
    assert.match(endpoint.id,/^s8-/);assert.equal(example.rpc,endpoint.rpc);
    assert.match(proto,new RegExp('message '+endpoint.reqMsg+'\\s*\\{'));
    assert.match(proto,new RegExp('message '+endpoint.rspMsg+'\\s*\\{'));
    const failed=example.response.status>=400;
    if(failed){
      assert.equal(rpc.response,undefined);assert.equal(rpc.error.code,'FAILED_PRECONDITION');
      assert.equal(example.response.headers['Content-Type'],'application/problem+json');
      assert.deepEqual(rpc.error.details.errors,example.response.body.errors);
    }else{
      assert.equal(rpc.response.resource.constructor,Object);
      assert.deepEqual(rpc.response.resource,example.response.body);
    }
    assert.equal(rpc.metadata.authorization,example.request.headers.Authorization);
    assert.equal(rpc.deadlineMs,endpoint.timeout.clientMs);assert.ok(endpoint.timeout.serverMs<rpc.deadlineMs);
    assert.ok(example.httpResponse.startsWith('HTTP/1.1 '+example.response.status));
    assert.ok(example.curl.includes('--fail-with-body'));assert.ok(!example.curl.includes('--retry'));
    if(endpoint.method==='POST'&&!failed){
      assert.ok(reads.some(regex=>regex.test(example.response.headers.Location)),example.rpc+' Location is not a GET resource');
      assert.ok(rpc.metadata['idempotency-key']);assert.ok(rpc.metadata['confirmation-id']);assert.ok(rpc.metadata['if-match']);
    }
  }
});
check('Report examples preserve unknown gates and do not pretend normal closure passed',()=>{
  const report=examples.find(example=>example.rpc==='GetReconciliationReport').response.body;
  assert.ok(report.vector.sources.every(source=>['type','id','revision','hash','sourceEventTail'].every(key=>source[key])));
  assert.equal(report.vector.objectSets.length,8);assert.ok(report.vector.ruleVersion);
  assert.ok(report.checks.some(item=>item.result==='CHECK_RESULT_UNKNOWN'));
  const failure=read('failure-examples.json')[0];
  assert.equal(failure.response.status,422);assert.equal(failure.persistedApplication,false);
  assert.equal(failure.rpc.error.code,'FAILED_PRECONDITION');assert.equal(failure.rpc.response,undefined);
  const app=examples.find(example=>example.rpc==='CreateTradeClosureApplication');
  assert.equal(app.request.body.reportNumber,report.reportNumber);assert.equal(app.response.status,422);
  const entity=read('entity-projection.json');
  assert.equal(entity.externalSuccessProven,false);assert.equal(entity.returnedDecision.eventTypeCode,20);
  assert.equal(entity.returnedDecision.tradeStatusCode,8);
});
check('Multi-reason release, separate closure and correction invalidation are explicit independent goals',()=>{
  const goals=Object.fromEntries(model.useCases.map(goal=>[goal.id,goal]));
  assert.match(goals['s8-release'].transaction,/只追加该原因/);
  assert.match(goals['s8-release'].transaction,/其他holdReference保持/);
  assert.match(goals['s8-case-close'].description,/关案永不自动解冻/);
  assert.match(goals['s8-correction'].transaction,/旧报告及受影响未执行批准失效/);
  assert.match(goals['s8-closure-apply'].transaction,/毛额=已分配\+未匹配/);
  assert.match(goals['s8-closure-review'].transaction,/新增|全部源集合/);
  assert.doesNotMatch(proto,/rpc\s+.*(?:Special|Reopen|Advance|Credit|Convert)/);
});
check('No request or response has client-controlled closure/hold shortcuts',()=>{
  const walk=value=>{
    if(!value||typeof value!=='object')return;
    for(const [key,child]of Object.entries(value)){assert.ok(!['isClosed','isHold','allPassed','specialClosure'].includes(key),key);walk(child);}
  };
  walk(examples);walk(rpcs);
});
check('All business enums in disposition examples follow the authoritative codebooks',()=>{
  const domains=require('../../../交付成果/assets/domain-model.js').domains;
  const compliance=domains.find(domain=>domain.id==='compliance');
  const values=name=>new Set(compliance.codebooks.find(book=>book.name.startsWith(name+'｜')).values.map(row=>Number(row[0])));
  const actions=values('action_code'),results=values('result_code');
  for(const example of examples){
    const body=example.response.body;
    if(body.actionCode!==undefined){assert.ok(actions.has(body.actionCode));assert.ok(results.has(body.resultCode));}
  }
});
check('Compliance decision contract is closed and keeps applications distinct from independent decisions',()=>{
  const contract=read('compliance-decision-contract.json');
  assert.equal(contract.additional_properties,false);assert.equal(Object.keys(contract.decision_details).length,11);
  for(const branch of Object.values(contract.decision_details)){
    assert.equal(branch.additional_properties,false);assert.ok(branch.required.length);
    for(const field of [...branch.required,...branch.optional])assert.ok(contract.field_types[field],field);
  }
  assert.deepEqual(contract.decision_details.release_application.result_codes,[1]);
  assert.deepEqual(contract.decision_details.release_decision.result_codes,[2,3]);
  assert.equal(contract.decision_details.gate_acknowledgement.action_code,4);
  assert.deepEqual(contract.decision_details.gate_acknowledgement.result_codes,[1]);
});
const result={step:8,passed:checks.length,checks,normalClosureE2EProven:false};
console.log(JSON.stringify({...result,endpoints:model.endpoints.length,useCases:model.useCases.length}));
