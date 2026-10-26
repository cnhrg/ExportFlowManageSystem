'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../..'),model=require('../../../交付成果/assets/step-six-usecases-model.js');
const load=name=>JSON.parse(fs.readFileSync(path.join(root,'doc/examples/step6',name),'utf8'));
const http=load('http-examples.json'),rpc=load('rpc-examples.json'),projection=load('entity-projection.json');
const checks=[];
function check(name,run){run();checks.push({name,passed:true});}
check('No fake official success in formal dispatch, verification, delivery or receipt examples',()=>{
  for(const id of ['dispatch-create','verification-create','delivery-create','receipt-create']){
    const example=http.find(x=>x.id==='s6-'+id),remote=rpc.find(x=>x.method===example.rpc);
    assert.equal(example.response.status,409);assert.equal(remote.error.code,'FAILED_PRECONDITION');assert.ok(!remote.response);
  }
});
check('Scope uncertainty blocks case creation rather than inferring one proof per declaration',()=>{
  assert.equal(http.find(x=>x.id==='s6-case-create').response.body.errors[0].code,'SCOPE_RULE_UNCONFIRMED');
  const context=http.find(x=>x.id==='s6-basis').response.body;
  assert.equal(context.formalApplicationAvailable,false);assert.deepEqual(context.eligibleScopeItems,[]);
});
check('Proof does not serialize an invented claim amount',()=>{
  assert.equal(projection.tax_case_tab.proof.claimed_amount,null);
  for(const example of http)assert.ok(!JSON.stringify(example.response.body).includes('claimedAmount'));
});
check('Returned material is an independent review and does not mean an authority rejection',()=>{
  const review=http.find(x=>x.id==='s6-review-create').response.body;
  assert.equal(review.review.outcome,'REVIEW_OUTCOME_RETURNED');assert.ok(!('externalEventKey' in review));
  assert.equal(projection.tax_event_tab.mapping.review,'3/4');
});
check('Original request recovery preserves frozen submission, not latest case',()=>{
  const original=http.find(x=>x.id==='s6-result').response.body;
  assert.equal(original.submission.submissionRevisionNumber,1);assert.equal(original.originalEtag,original.submission.etag);
  assert.ok(!('caseResource' in original));assert.equal(original.requestKey,'d7060000-0000-4000-8000-000000000001');
});
check('Domain handover has distinct typed B delivery, A receipt and objection disposition',()=>{
  assert.equal(projection.tax_event_tab.mapping.delivery,'13');assert.match(projection.tax_event_tab.mapping.receipt,/14/);
  const source=fs.readFileSync(path.join(root,'proto/trade/taxproof/v1/taxproof.proto'),'utf8');
  for(const type of ['DeliveryInput','ReceiptInput','DispositionInput'])assert.match(source,new RegExp('message '+type+' \\{'));
  assert.match(source,/oneof payload/);assert.ok(!source.includes('google.protobuf.Struct'));
});
check('Every goal has a unique black-box SSD and actual target-specific transaction expansion',()=>{
  assert.equal(new Set(model.useCases.map(x=>x.systemSequence)).size,model.useCases.length);
  assert.equal(new Set(model.useCases.map(x=>x.sequence)).size,model.useCases.length);
  for(const goal of model.useCases){assert.ok(goal.id.startsWith('s6-'));assert.ok(goal.actors.length);assert.ok(goal.sequence.includes(goal.transaction));}
});
check('HTTP to RPC uses explicit resource envelopes only for successes and original metadata/deadlines',()=>{
  for(let i=0;i<http.length;i++){
    assert.equal(http[i].rpc,rpc[i].method);assert.equal(http[i].timeoutMs,rpc[i].deadlineMs);
    if(http[i].response.status<400)assert.deepEqual(rpc[i].response.resource,http[i].response.body);
    else{
      assert.equal(http[i].response.headers['Content-Type'],'application/problem+json');
      assert.equal(rpc[i].errorType,'trade.filing.v1.RpcFailure');
      assert.equal(rpc[i].httpErrorType,'trade.filing.v1.HttpProblem');
      assert.equal(rpc[i].error.details.code,http[i].response.body.errors[0].code);
      assert.equal(rpc[i].error.details.httpStatus,http[i].response.status);
      assert.deepEqual(rpc[i].error.details.errors,http[i].response.body.errors);
      assert.ok(!rpc[i].response);assert.ok(!('resource' in http[i].response.body));
    }
    if(http[i].request.method!=='GET'){assert.equal(rpc[i].metadata['if-match'],http[i].request.headers['If-Match']);assert.ok(rpc[i].metadata['confirmation-id']);}
  }
});
console.log(JSON.stringify({step:6,passed:checks.length,checks},null,2));
