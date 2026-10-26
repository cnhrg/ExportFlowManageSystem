'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),model=require('../../../交付成果/assets/step-six-usecases-model.js'),transport=require('../transport-examples.cjs');
const artifacts={},pretty=x=>JSON.stringify(x,null,2)+'\n',digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const material='<!doctype html><meta charset="utf-8"><title>步骤六原创合成备料</title><h1>代理出口证明准备清单</h1><p>本文件只用于隔离验证；不是正式报关单、税务回执、职责确认、证明原件或A接收凭证。不得用于正式申请。</p>\n';
const file={fileNumber:'FILE-S6-SYNTHETIC-001',versionId:'SYNTHETIC-NOT-STORED',sha256:digest(material),purposeCode:22};
const rule={ruleReference:'SYNTHETIC-INTERNAL-PREPARATION-ONLY',ruleVersion:'1',authorityEvidence:{...file,purposeCode:21}};
const item={declarationNumber:'SYNTHETIC-NOT-OFFICIAL-DECLARATION',declarationRevisionNumber:1,goodsItemSequence:1,quantity:'10.000000',unitCode:'PCS',officialDeclaration:{...file,purposeCode:20}};
const trade='TRD-S6-SYNTHETIC-001',number='TPC-S6-SYNTHETIC-001',tag='"s6-case-1"';
const body={
  'case-create':{tradeRevisionNumber:1,scopeRule:rule,scopeItems:[item],supplierParticipantSequenceNumber:1},
  'submission-create':{tradeRevisionNumber:1,scopeRule:rule,responsibilityRule:rule,deadlineRule:rule,scopeItems:[item],materialVersions:[file],preparationNote:'仅内部合成准备；正式职责、范围、渠道未确认'},
  'review-create':{submissionRevisionNumber:1,packageHash:digest(material),outcome:'REVIEW_OUTCOME_RETURNED',reason:'职责/范围/渠道未确认，退回备料，不得正式申请'},
  'dispatch-create':{submissionRevisionNumber:1,reviewEventNumber:'SYNTHETIC-NOT-APPROVED',packageHash:digest(material)},
  'claim-create':{submissionRevisionNumber:1,dispatchReference:'SYNTHETIC-NOT-DISPATCHED',factKind:'OFFICIAL_FACT_KIND_ISSUED',externalEventKey:'INVALID-NOT-AUTHORITY-KEY',authorityReferenceNumber:'INVALID-NOT-OFFICIAL',sourceReference:'INVALID-NOT-AUTHORITY',officialFile:{...file,purposeCode:21},occurredAt:'2026-10-25T01:00:00.123Z'},
  'verification-create':{claimNumber:'S6-SYNTHETIC-CLAIM',submissionRevisionNumber:1,sourceVerificationReference:'INVALID-NOT-VERIFIED',verified:true,reason:'负例：无真实官方来源，必须拒绝'},
  'delivery-create':{certificateEventNumber:'SYNTHETIC-NOT-ISSUED',certificateVersion:file,supplierParticipantSequenceNumber:1,dispatchEvidence:{...file,purposeCode:23},deliveryChannel:'private-portal'},
  'receipt-create':{deliveryEventNumber:'SYNTHETIC-NOT-DELIVERED',certificateVersion:file,outcome:'RECEIPT_OUTCOME_CHECKED',reason:'负例：无正式证明及交付不得完成核对',receiptEvidence:{...file,purposeCode:23}},
  'disposition-create':{objectionEventNumber:'SYNTHETIC-OBJECTION',dispositionEvidence:[file],resolution:'缺正式更正证据，不能实质关闭'}
};
const canonical=value=>JSON.stringify(value&&typeof value==='object'?Array.isArray(value)?value.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(value).sort().map(key=>[key,JSON.parse(canonical(value[key]))])):value);
const packageHash=digest(canonical({content:body['submission-create'],files:body['submission-create'].materialVersions}));
body['review-create'].packageHash=packageHash;
body['dispatch-create'].packageHash=packageHash;
const caseResource={taxCaseNumber:number,tradeNumber:trade,tradeRevisionNumber:1,scopeReference:'pending:server-controlled-preparation-only',caseStatus:'PROOF_CASE_STATUS_PREPARING',currentSubmissionRevisionNumber:1,etag:tag,blockers:['SCOPE_RULE_UNCONFIRMED','RESPONSIBILITY_UNCONFIRMED','OFFICIAL_CHANNEL_UNAVAILABLE'],taxTypeCode:1,currencyCode:'CNY'};
const submission={taxCaseNumber:number,submissionRevisionNumber:1,packageHash,content:body['submission-create'],executionStatus:'not_sent',etag:tag};
const reviewEvent={eventNumber:'S6-SYNTHETIC-REVIEW',taxCaseNumber:number,submissionRevisionNumber:1,actorReference:'SYNTHETIC-INDEPENDENT-REVIEWER',review:body['review-create'],etag:tag};
const resources={
  basis:{tradeNumber:trade,tradeRevisionNumber:1,missingRequirements:caseResource.blockers,confirmedRules:[],eligibleScopeItems:[],etag:tag,formalApplicationAvailable:false},
  'case-read':caseResource,'submission-create':submission,'submission-read':submission,
  'review-context':{caseResource,submission,blockers:caseResource.blockers,etag:tag},'review-create':reviewEvent,
  'dispatch-read':{dispatchReference:'SYNTHETIC-UNKNOWN-RECOVERY-ONLY',taxCaseNumber:number,submissionRevisionNumber:1,executionStatus:'unknown',blockers:['DISPATCH_UNKNOWN','OFFICIAL_EVIDENCE_REQUIRED'],etag:tag},
  history:{submissions:[submission],events:[reviewEvent],etag:tag},
  result:{requestKey:'d7060000-0000-4000-8000-000000000001',acceptanceReference:'S6-SYNTHETIC-ORIGINAL',resourceLocation:'/api/v1/tax-proof-cases/'+number+'/submissions/1',originalEtag:tag,submission}
};
const blocked={'case-create':'SCOPE_RULE_UNCONFIRMED','dispatch-create':'RESPONSIBILITY_UNCONFIRMED','claim-create':'OFFICIAL_EVIDENCE_REQUIRED','claim-read':'NOT_FOUND','verification-create':'OFFICIAL_EVIDENCE_REQUIRED','delivery-create':'CERTIFICATE_NOT_VERIFIED','receipt-create':'CERTIFICATE_NOT_VERIFIED','disposition-create':'OBJECTION_UNRESOLVED'};
const examples=model.endpoints.map((endpoint,index)=>{
  const id=endpoint.id.slice(3),write=endpoint.method!=='GET';
  const request={method:endpoint.method,path:endpoint.path.replace('{trade_number}',trade).replace('{tax_case_number}',number).replace('{submission_revision_number}','1').replace('{dispatch_reference}','SYNTHETIC-UNKNOWN-RECOVERY-ONLY').replace('{claim_number}','S6-SYNTHETIC-CLAIM').replace('{request_key}','d7060000-0000-4000-8000-000000000001'),
    headers:{Authorization:'<INVALID-SYNTHETIC-'+(endpoint.audience==='内部运营'?'INTERNAL':'EXTERNAL')+'-CREDENTIAL>'}};
  if(write)Object.assign(request.headers,{'Content-Type':'application/json','Idempotency-Key':'d7060000-0000-4000-8000-'+String(index+1).padStart(12,'0'),'If-Match':tag,'X-Confirmation-Id':'<INVALID-EXACT-INTENT-CONFIRMATION>'});
  if(write)request.body=body[id];
  const error=blocked[id],status=error?(error==='NOT_FOUND'?404:409):Number(endpoint.status);
  const response={status,headers:{'Content-Type':error?'application/problem+json':'application/json','Cache-Control':'no-store','X-Request-Id':'S6-DESIGN-'+index},body:error?{
    type:'urn:trade:problem:'+error.toLowerCase(),title:error,status,
    detail:'合成输入缺正式证据；必须阻断，不是官方成功',instance:request.path,
    errors:[{pointer:write?'/'+endpoint.body:'',code:error,detail:'补齐本意图真实权威依据，或查询本方可见原资源'}],
    outcomeUnknown:false,retryAfterMs:0
  }:resources[id]};
  if(!error){response.headers.ETag=tag;if(write)response.headers.Location=request.path+'/'+(id==='submission-create'?'1':reviewEvent.eventNumber);}
  return transport.enrich({id:endpoint.id,request,response,note:'设计/合成数据；相互独立时间切片，不构成正式申请成功链'},endpoint);
});
const rpcs=examples.map((example,index)=>{
  const endpoint=model.endpoints[index],rpc=transport.rpc(example,endpoint,'trade.taxproof.v1');
  if(example.response.status>=400){
    delete rpc.response;
    rpc.error={code:example.response.status===404?'NOT_FOUND':'FAILED_PRECONDITION',details:{
      code:example.response.body.errors[0].code,httpStatus:example.response.status,errors:example.response.body.errors,
      retryable:false,retryAfterMs:0,outcomeUnknown:false,requestReference:example.response.headers['X-Request-Id']
    }};
    rpc.errorType='trade.filing.v1.RpcFailure';rpc.httpErrorType='trade.filing.v1.HttpProblem';
  }
  return rpc;
});
const projection={
  version:1,scope:'proof/type=1 only; no external success synthetic fixtures',
  tax_case_tab:{identity:['trade_number','tax_type_code','scope_reference'],proof:{tax_type_code:1,claimed_amount:null,currency_code:'CNY'},concurrency:'version',scopeResolution:'server confirmed scope rule; preparation placeholder cannot authorize filing'},
  tax_submission_tab:{submission_content_json:{schema_version:1,tax_type_code:1,approved_snapshot_number:'server-resolved immutable cause-2 trade snapshot',scope_reference:'server-resolved confirmed rule scope or preparation-only placeholder',rule_version:'server rule revision',responsibility_basis:'closed status plus confirmed authority FileRef[] or explicit unresolved items',declaration_references:'exact declaration identities/revisions and approved item scope',fields:'SubmissionInput proof-only whitelist; never claimed_amount',check_report:'unresolved items, source version vector, checks; no false official confirmation'},evidence_manifest_json:'FileRef[]: logical_file_number, revision_number, content_digest, document_purpose_code; FileVersion VersionId resolved against immutable file metadata',review_snapshot_json:{reviewer_reference:'independent actor',result_code:'2 approved/3 returned',reviewed_at:'UTC millisecond timestamp',content_hash:'exact package hash',rule_version:'server rule revision',evidence_references:'FileRef[]',comments:'optional reason; NULL whole snapshot before review'},previous_submission_revision_number:'prior immutable version or NULL',correction_event_number:'verified official correction event or NULL for internal return',dispatch_reference:'original stable execution reference or NULL',execution_status:{1:'not_sent',2:'in_progress',3:'unknown',4:'confirmed_not_submitted',5:'submission_receipt_verified'}},
  tax_event_tab:{payloadSchema:'shared §11 closed JSON with schema_version=1 and operation_evidence_reference',payload:'typed branch fields mapped from Proto; authenticated actor is server-injected',types:{1:'case_opened',2:'submission_created',3:'review_returned',4:'review_approved',5:'dispatch_intent',6:'official_submitted',7:'official_accepted',8:'official_correction',9:'official_processing',10:'official_issued_or_corrected',11:'official_final_rejected',12:'official_revoked',13:'proof_delivery',14:'proof_receipt_or_objection',15:'evidence_claim',16:'verification_or_objection_disposition',18:'review_invalidated'},resultCodes:{1:'recorded',2:'verified_or_approved',3:'returned'},officialRequirements:'6..12 require exact revision, real external_event_key and authority_reference_number; internal events external_event_key NULL',branches:{preparation:['scope_reference','unresolved_items'],submissionAndReview:['submission_content_hash','reviewer_reference?','reason?'],official:['dispatch_reference','source_namespace','authority_reference','evidence_references','outcome_code?'],handover:['delivery_number','proof_file','recipient_reference','received_delivery_number?']},mapping:{review:'3/4',delivery:'13',receipt:'14 with received/checked/objected',disposition:'16 with objection reference and substantive evidence',officialCorrection:'10 with previous_certificate_event_number; invalidate old handover, no invented event code'}},
  middleware:'confirmation, original command receipt, sequence, file task, outbox/lease only; no handover/case/review business authority'
};
artifacts['doc/examples/step6/material.html']=material;
artifacts['doc/examples/step6/http-contract.json']=pretty(model.endpoints);
artifacts['doc/examples/step6/http-examples.json']=pretty(examples);
artifacts['doc/examples/step6/rpc-examples.json']=pretty(rpcs);
artifacts['doc/examples/step6/entity-projection.json']=pretty(projection);
artifacts['doc/examples/step6/http-reference.md']='# 步骤六逐接口HTTP RESPONSE、cURL与RPC\n\n设计示例均非有效身份/确认。官方成功缺证据必须阻断，创建案件例也因无确认范围规则而409；可在服务端确定的准备占位案中备料。通用头、错误及签名策略沿步骤一，不擅自要求供应商私钥。\n\n'+examples.map((e,i)=>'## '+e.id+' · '+e.rpc+'\n\n'+model.endpoints[i].detail+'\n\n```http\n'+e.request.method+' '+e.request.path+'\n'+Object.entries(e.request.headers).map(([k,v])=>k+': '+v).join('\n')+'\n\n'+(e.request.body?pretty(e.request.body):'')+'```\n\n### RESPONSE\n\n```http\n'+e.httpResponse+'\n```\n\n```bash\n'+e.curl+'\n```\n\n### RPC\n\n```json\n'+pretty(rpcs[i])+'```\n').join('\n');
for(const goal of model.useCases){
  artifacts['doc/examples/step6/'+goal.id+'-system.mmd']=goal.systemSequence+'\n';
  artifacts['doc/examples/step6/'+goal.id+'-implementation.mmd']=goal.sequence+'\n';
}
artifacts['doc/sql/step6/transaction-contract.sql']=`-- Design contract, NOT a migration and NOT a runnable production handler.
-- Apply only current doc/sql/domain/schema.sql to a fresh verify_taxproof_<12hex> database.
-- Shared codes are generated by the domain owner; this step introduces no private code values.
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
START TRANSACTION;
-- Original request is checked before locking, then rechecked under trade root.
SELECT * FROM trade_record_tab WHERE trade_number = ? FOR UPDATE;
SELECT * FROM tax_case_tab WHERE tax_case_number = ? AND tax_type_code = 1 FOR UPDATE;
SELECT * FROM tax_submission_tab WHERE tax_case_number = ? ORDER BY submission_revision_number FOR UPDATE;
SELECT * FROM tax_event_tab WHERE tax_case_number = ? ORDER BY id FOR UPDATE;
-- Revalidate current permissions, exact If-Match, immutable snapshot vector, scope and independent actor.
-- Append typed tax_event and command receipt in the same transaction. Freeze complete submission JSON.
-- Missing official evidence => ROLLBACK; no fake external_event_key, authority reference or delivery.
-- B delivery type13 and A receipt/check/objection type14 are separate DOMAIN events.
COMMIT;
-- S3, ClamAV and official-channel I/O are outside this transaction; unknown queries original dispatch.
`;
const proto=fs.readFileSync(path.join(root,'proto/trade/taxproof/v1/taxproof.proto'),'utf8');
for(const name of ['proto/trade/taxproof/v1/taxproof.proto','doc/步骤六系统用例与接口协议.md'])artifacts[name]=fs.readFileSync(path.join(root,name),'utf8');
assert.equal(model.endpoints.length,17);assert.equal(model.useCases.length,12);
assert.equal(new Set(model.useCases.map(x=>x.systemSequence)).size,12);
assert.equal(new Set(model.useCases.map(x=>x.sequence)).size,12);
for(const e of model.endpoints){
  assert.match(proto,new RegExp('rpc '+e.rpc+'\\('+e.reqMsg+'\\) returns \\('+e.rspMsg+'\\)'));
  assert.ok(proto.includes(e.path));assert.ok(e.responseBody==='resource'&&e.id.startsWith('s6-'));
  if(e.method!=='GET')assert.ok(e.body&&body[e.id.slice(3)]);
}
for(const goal of model.useCases)for(const id of goal.endpoints)assert.ok(model.endpoints.some(x=>x.id===id));
for(const goal of model.useCases)assert.ok(!goal.sequence.includes('\\n'),'literal newline escape in diagram');
for(const example of examples){assert.ok(example.curl.includes('--include'));assert.ok(example.httpResponse.startsWith('HTTP/1.1'));}
const artifactPath='交付成果/assets/step-six-usecases-artifacts.js';
const bundle="'use strict';\n(function(root){const artifacts="+pretty(artifacts).trim()+";root.EXPORT_STEP_SIX_ARTIFACTS=artifacts;if(typeof module!=='undefined'&&module.exports)module.exports=artifacts;})(typeof globalThis!=='undefined'?globalThis:this);\n";
artifacts[artifactPath]=bundle;
for(const [name,content]of Object.entries(artifacts)){
  const target=path.join(root,name);
  if(process.argv.includes('--check'))assert.equal(fs.readFileSync(target,'utf8'),content,'stale '+name);
  else{fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content);}
}
console.log(JSON.stringify({step:6,endpoints:model.endpoints.length,useCases:model.useCases.length,diagrams:24,generated:Object.keys(artifacts).length,check:process.argv.includes('--check')}));
