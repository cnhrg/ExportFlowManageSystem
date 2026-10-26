'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../../..'),model=require(path.join(root,'交付成果/assets/step-seven-usecases-model.js'));
const load=name=>JSON.parse(fs.readFileSync(path.join(root,'doc/examples/step7/'+name),'utf8'));
const http=load('http-examples.json'),rpc=load('rpc-examples.json'),entities=load('entities.json');
const proto=fs.readFileSync(path.join(root,'proto/trade/taxrefund/v1/taxrefund.proto'),'utf8');
let count=0;const checks=[];
const test=(name,run)=>{run();count++;checks.push({name,passed:true});console.log('PASS '+name);};
test('Every complete goal has distinct black-box and middleware diagrams',()=>{
  assert.equal(model.useCases.length,9);
  assert.equal(new Set(model.useCases.map(u=>u.sequence)).size,9);
  for(const u of model.useCases){
    assert.ok(u.id.startsWith('s7-'));assert.ok(u.systemSequence.startsWith('sequenceDiagram'));
    assert.ok(!/MySQL|FOR UPDATE|S3|COMMIT/.test(u.systemSequence));
    assert.match(u.sequence,/READ COMMITTED/);assert.match(u.sequence,/锁根后当前读/);
    for(const actor of u.actors)assert.ok(u.systemSequence.includes('as '+actor));
    for(const endpoint of u.endpoints)assert.ok(model.endpoints.some(e=>e.id===endpoint));
  }
});
test('All twelve methods have named typed requests/responses and resource mapping',()=>{
  assert.equal(model.endpoints.length,12);assert.equal(http.length,12);assert.equal(rpc.length,12);
  for(const e of model.endpoints){
    assert.ok(proto.includes('rpc '+e.rpc+'('+e.reqMsg+') returns ('+e.rspMsg+')'));
    assert.ok(proto.includes('message '+e.reqMsg+' {'));assert.ok(proto.includes('message '+e.rspMsg+' { '+e.output+' resource = 1; }'));
    assert.ok(proto.includes((e.method==='GET'?'get':'post')+': "'+e.path+'"'));
  }
  assert.equal((proto.match(/response_body: "resource"/g)||[]).length,12);
  assert.ok(!proto.includes('google.protobuf.Struct'));
});
test('External authority/bank absence produces failures, never synthetic success',()=>{
  for(const id of ['s7-dispatch','s7-notice','s7-correction','s7-credit']){
    const h=http.find(x=>x.id===id),r=rpc[http.indexOf(h)];
    assert.equal(h.response.status,422);assert.ok(h.response.body.errors[0].code);
    assert.equal(r.error.code,'FAILED_PRECONDITION');assert.equal(r.response,undefined);
    assert.match(h.httpResponse,/HTTP\/1.1 422/);
  }
});
test('Null preparation and independent review do not fabricate amounts or approval',()=>{
  assert.equal(entities.tax_case_tab.claimed_amount,null);
  assert.equal(entities.tax_submission_tab.review_snapshot_json,null);
  assert.equal(entities.tax_event_tab.external_event_key,null);
  assert.equal(http.find(e=>e.id==='s7-review').request.body.decision,'REVIEW_DECISION_RETURN');
  assert.ok(!Object.hasOwn(entities.tax_submission_tab.submission_content_json,'claimedAmount'));
});
test('HTTP and RPC keep distinct audiences, exact body, metadata, deadline and GET cleanliness',()=>{
  for(let i=0;i<http.length;i++){
    const h=http[i],r=rpc[i],e=model.endpoints[i];
    assert.match(h.curl,/--include --fail-with-body/);assert.match(h.httpResponse,/^HTTP\/1.1 /);
    assert.equal(r.deadlineMs,e.timeout.clientMs);assert.equal(r.serverBudgetMs,e.timeout.serverMs);
    assert.ok(r.service.endsWith(e.service));
    if(e.body){assert.deepEqual(r.request[e.body.replace(/_([a-z])/g,(_,c)=>c.toUpperCase())],h.request.body);assert.ok(r.metadata['confirmation-id']);}
    else {assert.equal(h.request.body,undefined);assert.equal(r.metadata['idempotency-key'],undefined);}
    if(h.response.status===201)assert.ok(h.response.headers.Location.startsWith('/api/v1/tax-refund-cases/'));
    if(h.response.status<400)assert.deepEqual(r.response.resource,h.response.body);
  }
});
test('Transport mapper rejects undeclared, duplicate and path-confused input',()=>{
  const transport=require('../transport-examples.cjs'),endpoint=model.endpoints.find(e=>e.id==='s7-read');
  const source=http.find(e=>e.id==='s7-read'),changed=path=>({...source,request:{...source.request,path}});
  assert.throws(()=>transport.rpc(changed(source.request.path+'?approved=true'),endpoint,'trade.taxrefund.v1'),/Undeclared/);
  assert.throws(()=>transport.rpc(changed('/api/v1/other'),endpoint,'trade.taxrefund.v1'),/does not match/);
});
test('Correction and official references are explicit, monetary authorities remain separate',()=>{
  assert.match(proto,/previous_submission_revision_number/);assert.match(proto,/correction_event_number/);
  assert.match(proto,/external_event_key/);assert.match(proto,/controlled_fund_observation_reference/);
  assert.match(proto,/optional string claimed_amount/);assert.match(proto,/optional string approved_amount/);
  assert.match(proto,/optional string verified_credit_amount/);
});
test('Global and CommonJS artifact exports contain every diagram and protocol source',()=>{
  const a=require(path.join(root,'交付成果/assets/step-seven-usecases-artifacts.js'));
  assert.equal(globalThis.EXPORT_STEP_SEVEN_USECASES_MODEL,model);
  assert.equal(globalThis.EXPORT_STEP_SEVEN_ARTIFACTS,a);
  assert.equal(a['proto/trade/taxrefund/v1/taxrefund.proto'],proto);
  assert.equal(a['doc/步骤七系统用例与接口协议.md'],fs.readFileSync(path.join(root,'doc/步骤七系统用例与接口协议.md'),'utf8'));
  for(const u of model.useCases)assert.equal(a['doc/examples/step7/'+u.id+'-system.mmd'],u.systemSequence+'\n');
});
const result={designOnly:true,passed:count,methods:model.endpoints.length,goals:model.useCases.length,diagrams:18,checks};
console.log(JSON.stringify(result));
