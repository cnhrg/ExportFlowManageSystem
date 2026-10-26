'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),model=require('../../../交付成果/assets/step-four-usecases-model.js');
const transport=require('../transport-examples.cjs'),artifacts={};
const pretty=x=>JSON.stringify(x,null,2)+'\n',hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const material='<!doctype html><meta charset="utf-8"><title>原创合成报关草稿</title><h1>步骤四材料</h1><p>本件仅为原创合成备料及文件恢复测试。A为生产销售单位、B为拟境内发货人、C为真实收货人、F为拟报关代理。40件，CNY4000.00。无真实委托、签章、官方申报、受理、放行或正式附件2。</p>\n';
const file={logicalFileNumber:'FILE-S4-SYNTHETIC',revisionNumber:1,sha256:hash(material),documentTypeCode:3};
const materialFor=label=>material.replace('<h1>步骤四材料</h1>','<h1>'+label+'</h1><p>用途形状不同的原创字节，非有效签章或正式机关原件。</p>');
const writtenMaterial=materialFor('合成A确切版书面确认'),authorityMaterial=materialFor('合成待核机关回执声明'),attachmentMaterial=materialFor('合成附件2字段形状，正式原件未验证');
const writtenFile={logicalFileNumber:'FILE-S4-WRITTEN',revisionNumber:1,sha256:hash(writtenMaterial),documentTypeCode:19};
const authorityFile={logicalFileNumber:'FILE-S4-AUTHORITY-CLAIM',revisionNumber:1,sha256:hash(authorityMaterial),documentTypeCode:21};
const attachmentFile={logicalFileNumber:'FILE-S4-ATTACHMENT-SHAPE',revisionNumber:1,sha256:hash(attachmentMaterial),documentTypeCode:20};
const declaration='DEC-S4-SYNTHETIC',shipment='SHP-S4-SYNTHETIC',requestNumber='REQ-S4-SYNTHETIC',eventNumber='EV-S4-SYNTHETIC';
const party=role=>({partyRoleCode:role,participantSequenceNumber:1});
const draft={approvedSnapshotNumber:'SNP-S4-SYNTHETIC-APPROVED',tradeRevisionNumber:4,shipmentPlanRevision:'SYNTHETIC-PLAN-1',
  productionSalesUnit:party(1),domesticConsignor:party(2),overseasConsignee:party(3),customsAgent:party(6),
  customsOfficeCode:'SYNTHETIC-OFFICE',channelCode:'SYNTHETIC-NOT-OFFICIAL',destinationCountryCode:'VN',transportReference:'SYNTHETIC-TRANSPORT',
  authorizationEvidenceReference:'SYNTHETIC-NOT-VALID-AUTHORITY',items:[{itemSequenceNumber:1,tradeGoodsItemSequenceNumber:1,
    shipmentAllocationNumber:shipment+'#1',hsCode:'SYNTHETIC',declaredDescription:'原创合成货物非真实归类',specification:'SYNTHETIC',
    declaredQuantity:'40.000000',unitCode:'PCS',declaredUnitPriceAmount:'100.00',declaredTotalAmount:'4000.00',currencyCode:'CNY',originCountryCode:'CN'}],
  supportingFiles:[file]};
const snake=name=>name.replace(/[A-Z]/g,char=>'_'+char.toLowerCase());
const mapped=value=>Object.fromEntries(Object.entries(value).map(([key,value])=>[snake(key),value]));
const roleFields=['productionSalesUnit','domesticConsignor','overseasConsignee','customsAgent'];
const fileRef=file=>({logical_file_number:file.logicalFileNumber,revision_number:file.revisionNumber,content_digest:file.sha256,document_purpose_code:file.documentTypeCode});
const domainContent={schema_version:1,header:mapped(Object.fromEntries(Object.entries(draft).filter(([key])=>![...roleFields,'items','supportingFiles'].includes(key)))),
  participant_references:roleFields.map(name=>({function_code:snake(name),...mapped(draft[name])})),goods:draft.items.map(mapped),
  document_references:draft.supportingFiles.map(fileRef),previous_revision_number:null,rule_version:'STEP4-DESIGN-1'};
const sorted=value=>Array.isArray(value)?value.map(sorted):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,sorted(value[key])])):value;
const digest=hash(JSON.stringify(sorted(domainContent))),tag='"s4-v1-'+digest.slice(0,12)+'"';
const receipt={declarationNumber:declaration,revisionNumber:1,contentHash:digest,status:'DECLARATION_STATUS_DRAFT',etag:tag,acceptanceId:'ACCEPT-S4-SYNTHETIC'};
const event=(state,detail={})=>({eventNumber,declarationNumber:declaration,revisionNumber:1,actorReference:'SYNTHETIC-ACTOR',state,reason:'仅合成设计，不证明外部业务成功',...detail});
const reviewSubmission={revisionNumber:1,contentHash:digest};
const decision={submissionEventNumber:'EV-S4-SYNTHETIC-SUBMIT',revisionNumber:1,contentHash:digest,outcome:'DECISION_OUTCOME_RETURN',
  reason:'缺有效业务证明，退回补正',verificationEvidence:[]};
const confirmation={revisionNumber:1,contentHash:digest,authorityReference:'SYNTHETIC-NOT-VALID-AUTHORITY',writtenEvidence:[writtenFile]};
const filing={revisionNumber:1,contentHash:digest,action:'FILING_ACTION_DECLARE',reason:'仅登记本地待办，正式职责及渠道仍待确认'};
const filingResource={requestNumber,declarationNumber:declaration,intent:filing,executionStatus:'EXECUTION_STATUS_PENDING',
  missingGateCodes:['CUSTOMS_AUTHORITY_UNVERIFIED','CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED'],etag:tag};
const evidence={requestNumber,revisionNumber:1,kind:'OFFICIAL_KIND_SUBMITTED',sourceEventKey:'SYNTHETIC-CLAIM-NOT-VERIFIED',
  externalReferenceNumber:'SYNTHETIC-NOT-OFFICIAL',files:[authorityFile],occurredAt:'2026-10-25T01:00:00.123Z'};
const verify={evidenceEventNumber:eventNumber,outcome:'DECISION_OUTCOME_RETURN',reason:'正式来源未接入，仅退回核实不记海关退单',
  verificationProfileReference:'SYNTHETIC-NOT-REGISTERED',verificationEvidence:[]};
const delivery={revisionNumber:1,submittedEventNumber:'SYNTHETIC-NOT-A-REAL-SUBMISSION',recipientPartyRoleCode:2,recipientParticipantSequenceNumber:1,attachmentTwo:attachmentFile};
const deliveryResource={deliveryNumber:'DEL-S4-SYNTHETIC',declarationNumber:declaration,content:delivery,state:'delivered',receipts:[]};
const revision={declarationNumber:declaration,revisionNumber:1,content:draft,contentHash:digest,createdBy:'SYNTHETIC-F',events:[]};
const resource={current:receipt,revision,availableRevisions:[1],filingRequests:[],events:[],attachmentDeliveries:[],missingGateCodes:['CUSTOMS_AUTHORITY_UNVERIFIED']};
const inputs={'s4-create':draft,'s4-revision':{baseRevisionNumber:1,draft:{...draft,transportReference:'SYNTHETIC-CORRECTED'},reason:'修改运输引用，新版须重新审核及A确认'},
  's4-review-submit':reviewSubmission,'s4-review':decision,'s4-confirm':confirmation,'s4-filing':filing,'s4-evidence':evidence,'s4-verify':verify,
  's4-delivery':delivery,'s4-receipt':{outcome:'disputed',reason:'仅设计：来源未核实，不承认收到正式附件2',evidence:[file]}};
const responses={'s4-basis':{tradeNumber:'TRD-S4-SYNTHETIC',shipmentNumber:shipment,approvedSnapshotNumber:draft.approvedSnapshotNumber,
    shipmentPlanRevision:draft.shipmentPlanRevision,etag:tag,parties:[party(1),party(2),party(3),party(6)],missingGateCodes:['CUSTOMS_AUTHORITY_UNVERIFIED']},
  's4-create':receipt,'s4-read':resource,'s4-revision':{...receipt,revisionNumber:2,etag:'"s4-v2-synthetic"'},
  's4-revision-read':revision,'s4-review-submit':event('pending_review',{reviewSubmission}),
  's4-context':{declaration:resource,missingGateCodes:['CUSTOMS_AUTHORITY_UNVERIFIED']},'s4-review':event('returned',{reviewDecision:decision}),
  's4-confirm':event('recorded_written_confirmation',{exporterConfirmation:confirmation}),'s4-filing':filingResource,'s4-filing-read':filingResource,
  's4-evidence':event('pending_verification',{officialEvidence:evidence}),'s4-evidence-read':event('pending_verification',{officialEvidence:evidence}),
  's4-verify':event('verification_returned',{officialEvidenceDecision:verify}),'s4-delivery':deliveryResource,'s4-delivery-read':deliveryResource,
  's4-receipt':event('disputed',{attachmentReceipt:inputs['s4-receipt']}),
  's4-event-read':event('pending_review',{reviewSubmission}),
  's4-internal-event-read':event('returned',{reviewDecision:decision})};
const params={shipment_number:shipment,declaration_number:declaration,revision_number:'1',request_number:requestNumber,event_number:eventNumber,delivery_number:deliveryResource.deliveryNumber};
const examples=model.endpoints.map((endpoint,index)=>{
  const request={method:endpoint.method,path:endpoint.path.replace(/\{([^}]+)\}/g,(_,name)=>params[name]),headers:{Authorization:'<INVALID-SYNTHETIC-'+(endpoint.audience==='内部运营'?'INTERNAL':'EXTERNAL')+'-CREDENTIAL>'}};
  if(endpoint.body){Object.assign(request.headers,{'Content-Type':'application/json','Idempotency-Key':'d7040000-0000-4000-8000-'+String(index+1).padStart(12,'0'),
    'If-Match':tag,'X-Confirmation-Id':'<INVALID-SYNTHETIC-CONFIRMATION>'});request.body=inputs[endpoint.id];}
  const response={status:Number(endpoint.status),headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:responses[endpoint.id]};
  if(response.body.etag)response.headers.ETag=response.body.etag;
  if(response.body.current)response.headers.ETag=response.body.current.etag;
  if(endpoint.method==='POST'){
    const base='/api/v1/customs-declarations/'+declaration;
    const locations={'s4-create':base,'s4-revision':base+'/revisions/2','s4-filing':base+'/filing-requests/'+requestNumber,
      's4-evidence':base+'/official-evidence/'+eventNumber,'s4-delivery':base+'/attachment-deliveries/'+deliveryResource.deliveryNumber};
    response.headers.Location=locations[endpoint.id]||(endpoint.audience==='内部运营'?'/internal/v1':'/api/v1')+'/customs-declarations/'+declaration+'/events/'+eventNumber;
  }
  const example=transport.enrich({request,response},endpoint);
  if(['s4-delivery','s4-delivery-read','s4-receipt'].includes(endpoint.id)){
    example.externalSuccessStatus='UNVERIFIED';
    example.requiresUnverifiedPreconditions=['真实正式提交证据','同版正式附件2原件','真实交付及对应收件方身份'];
  }
  return example;
});
const rpcs=examples.map((e,i)=>transport.rpc(e,model.endpoints[i],'trade.customs.v1'));
const variantSpecs=[
  ['correction','s4-filing',{...filing,revisionNumber:2,action:'FILING_ACTION_CORRECT',originalRequestNumber:requestNumber,
    correctionEventNumber:'SYNTHETIC-NOT-A-VERIFIED-CORRECTION',reason:'正式更正需要原号、许可、新版独审及A确认'},422,'CUSTOMS_AUTHORITY_UNVERIFIED'],
  ['withdrawal','s4-filing',{...filing,action:'FILING_ACTION_WITHDRAW',originalRequestNumber:requestNumber,
    reason:'仅原号撤回意图；无正式依据不改变状态或释放占量'},422,'CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED'],
  ['release-verification','s4-verify',{...verify,outcome:'DECISION_OUTCOME_APPROVE',reason:'缺正式来源不能确认放行'},422,'CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED'],
  ['attachment-A','s4-delivery',{...delivery,recipientPartyRoleCode:1},422,'CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED'],
  ['attachment-B','s4-delivery',delivery,422,'CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED'],
  ['wrong-recipient','s4-receipt',{outcome:'received',reason:'A不能代B接收',evidence:[]},403,'CUSTOMS_RECIPIENT_MISMATCH']
];
const variants=variantSpecs.map(([id,endpointId,body,status,code],index)=>{
  const endpoint=model.endpoints.find(e=>e.id===endpointId),base=examples.find(e=>e.rpc===endpoint.rpc);
  const request={...base.request,headers:{...base.request.headers,'Idempotency-Key':'d7041111-0000-4000-8000-'+String(index+1).padStart(12,'0')},body};
  const problem={type:'urn:export-trade:problem:'+code.toLowerCase().replace(/_/g,'-'),title:'正式条件不满足',status,
    detail:code,instance:request.path,errors:[{pointer:'/',code,detail:'无真实正式证据不得降级成功'}],outcomeUnknown:false,retryAfterMs:0};
  const example=transport.enrich({request,response:{status,headers:{'Content-Type':'application/problem+json','Cache-Control':'no-store'},body:problem}},endpoint);
  const rpc=transport.rpc(example,endpoint,'trade.customs.v1');
  delete rpc.response;
  rpc.error={code:status===403?'PERMISSION_DENIED':'FAILED_PRECONDITION',
    details:{code,httpStatus:status,errors:problem.errors,retryable:false,retryAfterMs:0,outcomeUnknown:false,requestReference:request.path}};
  return {id,designOnly:true,externalSuccessStatus:'UNVERIFIED',http:example,rpc};
});
artifacts['doc/examples/step4/material.html']=material;
artifacts['doc/examples/step4/supplier-confirmation.html']=writtenMaterial;
artifacts['doc/examples/step4/authority-claim.html']=authorityMaterial;
artifacts['doc/examples/step4/attachment-two-shape.html']=attachmentMaterial;
artifacts['doc/examples/step4/http-contract.json']=pretty(model.endpoints);
artifacts['doc/examples/step4/http-examples.json']=pretty(examples);
artifacts['doc/examples/step4/rpc-examples.json']=pretty(rpcs);
artifacts['doc/examples/step4/operation-variants.json']=pretty(variants);
artifacts['doc/examples/step4/entity-projection.json']=pretty({designOnly:true,allExternalSuccessUnverified:true,draft,domainContent,revision,receipt,filing:filingResource,
  purposeSpecificFiles:{packingList:file,writtenConfirmation:writtenFile,authorityClaim:authorityFile,attachmentTwoShape:attachmentFile},
  domainRequest:{schema_version:1,approved_snapshot_number:draft.approvedSnapshotNumber,declaration_content_hash:digest,action_code:1,
    operation_evidence_reference:'SYNTHETIC-NOT-A-REAL-OPERATION-EVIDENCE',evidence_references:[]},
  domainEvent:{schema_version:1,content_hash:digest,operation_evidence_reference:'SYNTHETIC-NOT-A-REAL-OPERATION-EVIDENCE',
    reviewer_reference:'SYNTHETIC-REVIEWER',reviewed_revision_number:1,comments:'合成退回理由',review_submission_event_number:'SYNTHETIC-SUBMISSION'},
  fieldMapping:{current:'customs_declaration_tab',history:'customs_declaration_revision_tab.content_json',items:'customs_declaration_item_tab',
    reviewAndWrittenConfirmation:'customs_event_tab typed payload events3/4/5/6',filing:'customs_filing_request_tab',evidence:'customs_event_tab events17/18/8..14',
    deliveryAndReceipt:'customs_event_tab events15/16',etag:'customs_declaration_tab.version + content_hash',technicalOnly:'同库中间件确认/受理/文件恢复任务'}});
artifacts['doc/examples/step4/failure-examples.json']=pretty([
  {type:'urn:export-trade:problem:customs-official-evidence-required',title:'正式来源尚未核实',status:422,code:'CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED',detail:'保持待核和原办理号；不写放行或退单',retryable:false},
  {type:'urn:export-trade:problem:customs-execution-unknown',title:'原办理结果未知',status:409,code:'CUSTOMS_EXECUTION_UNKNOWN',detail:'按原请求号查单，不换号重发',retryable:false},
  {type:'urn:export-trade:problem:customs-recipient-mismatch',title:'非指定接收方',status:403,code:'CUSTOMS_RECIPIENT_MISMATCH',detail:'A不能代B接收，F不能代收',retryable:false}
].map(({code,retryable,...problem})=>({...problem,instance:'/api/v1/customs-declarations/'+declaration,
  errors:[{pointer:'/',code,detail:problem.detail}],outcomeUnknown:code==='CUSTOMS_EXECUTION_UNKNOWN',retryAfterMs:0})));
artifacts['doc/examples/step4/http-reference.md']='# 步骤四逐接口RESPONSE/cURL/RPC\n\n全部仅设计，凭据无效；每段是独立形状例，不可串成真实官方成功链。附件交付形状例的正式前置尚未验证。\n\n'+examples.map((e,i)=>
  '## '+e.rpc+'\n\n`'+e.request.method+' '+e.request.path+'`\n\n客户端/应用预算：'+e.timeoutMs+'/'+model.endpoints[i].timeout.serverMs+'毫秒。\n\n```http\n'+e.httpResponse+'\n```\n\n```bash\n'+e.curl+'\n```\n\n```json\n'+pretty(rpcs[i])+'```\n').join('\n')
  +'\n# 更正/撤回/核实/分别交付与错收件方阻断例\n\n'+variants.map(v=>'## '+v.id+'\n\n```http\n'+v.http.httpResponse+'\n```\n\n```bash\n'+v.http.curl+'\n```\n\n```json\n'+pretty(v.rpc)+'```\n').join('\n');
for(const uc of model.useCases)for(const [kind,source]of [['system',uc.systemSequence],['implementation',uc.sequence]])
  artifacts['doc/examples/step4/'+uc.id+'-'+kind+'.mmd']=source+'\n';
for(const name of ['proto/trade/customs/v1/customs.proto','doc/步骤四系统用例与接口协议.md'])artifacts[name]=fs.readFileSync(path.join(root,name),'utf8');
const output='交付成果/assets/step-four-usecases-artifacts.js';
const files={...artifacts,[output]:"'use strict';\n(function(root){\nconst artifacts="+pretty(artifacts).trim()+";\nroot.EXPORT_STEP_FOUR_ARTIFACTS=artifacts;\nif(typeof module==='object'&&module.exports)module.exports=artifacts;\n})(globalThis);\n"};
for(const [name,source]of Object.entries(files)){
  const target=path.join(root,name);
  if(process.argv.includes('--check'))assert.equal(fs.readFileSync(target,'utf8'),source,'Stale artifact: '+name);
  else{fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,source);}
}
console.log('Step four: '+model.useCases.length+' use cases / '+model.useCases.length*2+' diagrams / '+examples.length+' explicit HTTP/RPC examples; '+Object.keys(files).length+' artifacts consistent.');
