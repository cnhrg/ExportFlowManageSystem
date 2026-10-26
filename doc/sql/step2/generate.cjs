'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),model=require(path.join(root,'交付成果/assets/step-two-usecases-model.js'));
const first=require(path.join(root,'交付成果/assets/system-usecases-model.js')),transport=require('../transport-examples.cjs');
const guards=require('./review-guards.cjs');
const artifacts={},pretty=value=>JSON.stringify(value,null,2)+'\n',hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const trade='TRD-S2-DEMO-001',contract='CON-S2-DEMO-001',snapshot='SNP-S2-DEMO-APPROVED-001';
const etag='"s2-demo-working-1-state-1-v1"';
const keyFor=id=>'0ea255d0-0000-4000-8000-'+String(model.endpoints.findIndex(endpoint=>endpoint.id===id)+1).padStart(12,'0');
const document='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>原创合成待审协议</title><h1>步骤二演示：待审正文，不是已签合同</h1><p>供应商与出口代理的本笔代理出口范围须经核实。仅人民币，每笔固定300元代理服务费由D承担，仅在首次获批分账时从D已核验可用余额结算；须有D授权及正式收费依据，不减少A合同应付，INVOICE申报不触发收费。</p><p>本材料没有签名、印章、真实身份或平台证据；不得用于付款、申报或证明真实法律事实。</p></html>\n';
const file={logicalFileNumber:'FILE-S2-REVIEW-001',revisionNumber:1,sha256:hash(document),documentTypeCode:10};
const content={tradeSnapshotNumber:snapshot,parties:[{contractPartySequence:1,partyRoleCode:1,participantSequenceNumber:1},{contractPartySequence:2,partyRoleCode:2,participantSequenceNumber:1}],reviewFile:file,effectiveFrom:'2026-10-25',effectiveTo:'2027-10-25'};
const contractResource={contractNumber:contract,scope:'CONTRACT_SCOPE_PER_TRADE',purpose:'CONTRACT_PURPOSE_EXPORT_AGENCY',tradeNumber:trade,currentRevisionNumber:1,etag};
const revision={contractNumber:contract,revisionNumber:1,status:'REVISION_STATUS_DRAFT',content,etag,currentRevisionNumber:1};
const returnedRevision={...revision,status:'REVISION_STATUS_RETURNED',etag:'"s2-demo-working-1-state-3-v4"',reviewResult:{outcome:'DECISION_OUTCOME_RETURN',reason:'合成补正意见：补齐正文范围与正式授权对应关系',ruleVersion:'S2-RULES-1',reviewedAt:'2026-10-25T08:20:00.123Z',reviewerReference:'SYNTHETIC-INDEPENDENT-REVIEWER',evidenceReferences:[]}};
const request={signatureRequestId:'SIG-S2-DEMO-001',clientReference:'SIGREF-S2-DEMO-001',contractNumber:contract,revisionNumber:1,state:'pending_dispatch',attemptCount:0,lastErrorCode:'',etag:'"s2-signature-request-pending-dispatch-v1"'};
const signingRequest={...request,state:'awaiting_signers',providerTaskReference:'NOT-A-REAL-PLATFORM-TASK',etag:'"s2-signature-request-awaiting-signers-v2"'};
const basis=first.clone(first.supplierFiling),basisFiles=[];
const materialRef=({purpose,logicalFileNumber,revisionNumber,sha256})=>({purpose,logicalFileNumber,revisionNumber,sha256});
for(const [name,purpose,type]of [['qualification','MATERIAL_PURPOSE_CUSTOMS_QUALIFICATION',8],['quotation','MATERIAL_PURPOSE_CUSTOMS_QUOTATION',9]]){
  const text='<!doctype html><meta charset="utf-8"><title>合成'+name+'</title><h1>原创结构演示，非真实资质或报价证明</h1><p>没有真实证照、登记号、签名或印章。仅用于说明步骤一补充资料到签约依据的字段链路。</p>\n';
  const ref={purpose,logicalFileNumber:'FILE-S2-'+name.toUpperCase(),revisionNumber:1,sha256:hash(text)};
  basisFiles.push({...ref,referenceEligible:true,documentTypeCode:type,designOnly:true});
  artifacts['doc/examples/step2/'+name+'.html']=text;
}
basis.exportAgent.exportAgentDetails={receiptPath:'合成受限人民币收款路径，实际账户须核实',paymentPath:'合成向供应商人民币付款路径，实际账户须核实',paymentBranchCode:1};
basis.customsBroker.customsDetails={qualification:materialRef(basisFiles[0]),quotedAmount:{amount:'100.00',currencyCode:'CNY'},pricingBasis:'合成单笔报价计价说明，不代表真实约定',quotation:materialRef(basisFiles[1])};
assert.deepEqual(first.validate(basis),[]);
assert.deepEqual(guards.basisMissing(basis,(number,version)=>basisFiles.find(item=>item.logicalFileNumber===number&&item.revisionNumber===version)),[]);
const receipt=(status,tag,version=1)=>({contractNumber:contract,revisionNumber:version,status,etag:tag,acceptanceId:'ACCEPT-S2-'+status+'-'+version});
const intent={method:'POST',resourcePath:'/internal/v1/trades/'+trade+'/review-submissions',idempotencyKey:keyFor('trade-submit'),ifMatch:'"s2-trade-r4-v4"',bodySha256:''};
const submission={expectedTradeRevision:4,supportingEvidence:[],summary:'未执行的合成设计例；本阶段必需资料应已核实，实际步骤一库不具备此批准事实'};
intent.bodySha256=hash(first.canonical(submission));
const confirmation={confirmationId:'S2-INTERNAL-CONFIRMATION-NOT-VALID',requestDigest:hash(first.canonical(intent)),expiresAt:'2026-10-25T08:29:00.000Z',state:'available'};
const fileEvidence=(purpose,name)=>({logicalFileNumber:'REQUIRED-EXTERNAL-'+name,revisionNumber:1,sha256:'<no-real-evidence-in-this-design-fixture>',documentTypeCode:purpose});
const input={
  'internal-confirmation':intent,'trade-submit':submission,
  'trade-reopen':{expectedTradeRevision:4,reason:'终审退回后开始补充，仅打开工作版，不替供应商写资料',evidence:[]},
  'trade-review':{submissionId:'REVIEW-S2-DEMO-001',outcome:'DECISION_OUTCOME_APPROVE',reason:'仅设计推演：须由独立审核员真实核实本阶段规则后才可批准',missingItems:[]},
  create:{scope:contractResource.scope,purpose:contractResource.purpose,tradeNumber:trade,content},
  replace:content,revise:{previousWorkingRevision:1,correctionReason:'仅推演：正式任务已查清，待补条款另起版',content},
  submit:{declaration:'确认送审确切正文与主体/依据，尚未签署'},
  review:{outcome:'DECISION_OUTCOME_APPROVE',reason:'仅推演：须独立核实条款/委托链/收费与付款条件',ruleVersion:'S2-RULES-1',evidence:[]},
  sign:{providerCode:'UNSELECTED-PROVIDER-DESIGN-ONLY',reviewedDocumentSha256:file.sha256},
  'sign-session':{returnRoute:'/contracts/signature-result'},
  notice:{providerCode:'UNSELECTED-PROVIDER-DESIGN-ONLY',providerEventId:'NOTICE-S2-DEMO-001',clientReference:request.clientReference,providerTaskReference:'NOT-A-REAL-PLATFORM-TASK',reportedState:'completed',occurredAt:'2026-10-25T08:30:00.123Z'},
  activate:{conditionEvidence:[fileEvidence(10,'ACTIVATION-AUTHORITY')],reason:'未执行推演：必须先取得真实全部签署/归档证据并满足条件，不能用本例激活'},
  terminate:{reasonCode:1,reason:'未签旧工作版正式撤回，须确认无活跃或未知签署任务',legalEvidence:[fileEvidence(10,'TERMINATION-AUTHORITY')]},
  apply:{contractNumber:'CON-S2-FRAMEWORK-LOGISTICS',contractRevisionNumber:2,approvedTradeSnapshotNumber:snapshot,partyMappings:[{contractPartySequence:1,partyRoleCode:1,participantSequenceNumber:1},{contractPartySequence:2,partyRoleCode:5,participantSequenceNumber:1}],serviceOrder:fileEvidence(11,'SERVICE-ORDER'),useDate:'2026-10-25'},
  authority:{approvedTradeSnapshotNumber:snapshot,officialAuthorization:fileEvidence(13,'OFFICIAL-AUTHORIZATION'),customsParticipantSequence:1,validFrom:'2026-10-25',validTo:'2027-10-25',scopeDescription:'本笔明确货物/报关范围；示例不代表已办理官方委托'},
  recognize:{approvedTradeSnapshotNumber:snapshot,customsParticipantSequence:1,writtenRecognition:fileEvidence(13,'WRITTEN-RECOGNITION'),validFrom:'2026-10-25',validTo:'2027-10-25'}
};
const application={applicationId:'APPLICATION-S2-DEMO-001',tradeNumber:trade,contractNumber:input.apply.contractNumber,contractRevisionNumber:2,tradeRevision:6,state:'pending_review'};
const emptyEvidence={agreementApplications:[],customsAuthorizations:[],customsAgentRecognitions:[]};
const responses={
  'contract-basis':{tradeNumber:trade,approvedTradeRevision:4,approvedSnapshotNumber:snapshot,supplierFiling:basis,etag:'"s2-trade-r4-approved-v6"',currentEvidence:emptyEvidence},
  'trade-context':{tradeNumber:trade,tradeRevision:4,lifecycle:'reviewing',supplierFiling:basis,payerFiling:first.payerFiling,missingItems:[],submittedSnapshotNumber:'SNP-S2-SUBMITTED-001',etag:'"s2-trade-r4-review-v5"',evidence:emptyEvidence},
  'trade-reopen':{tradeNumber:trade,tradeRevision:5,lifecycle:'editing',etag:'"s2-trade-r5-v7"'},
  'internal-confirmation':confirmation,'internal-confirmation-read':confirmation,
  'trade-submit':{submissionId:'REVIEW-S2-DEMO-001',tradeNumber:trade,tradeRevision:4,submittedSnapshotNumber:'SNP-S2-SUBMITTED-001',etag:'"s2-trade-r4-review-v5"'},
  'trade-review':{decisionId:'DECISION-S2-DEMO-001',tradeNumber:trade,approvedSnapshotNumber:snapshot,tradeRevision:4,lifecycle:'approved'},
  create:contractResource,read:contractResource,revision:returnedRevision,
  'internal-revision':{...revision,status:'REVISION_STATUS_AWAITING_SIGNATURE',etag:'"s2-demo-working-1-state-4-v4"',signatureRequest:signingRequest,reviewResult:{...returnedRevision.reviewResult,outcome:'DECISION_OUTCOME_APPROVE',reason:'合成通过推演，真实审核/证据须另核实'}},
  replace:receipt('REVISION_STATUS_DRAFT','"s2-demo-working-1-state-1-v2"'),
  revise:receipt('REVISION_STATUS_DRAFT','"s2-demo-working-2-state-1-v1"',2),
  submit:receipt('REVISION_STATUS_IN_REVIEW','"s2-demo-working-1-state-2-v3"'),
  review:receipt('REVISION_STATUS_AWAITING_SIGNATURE','"s2-demo-working-1-state-4-v4"'),
  sign:request,'sign-read':signingRequest,
  'sign-session':{signingSessionId:'SESSION-S2-DEMO-001',signatureRequestId:request.signatureRequestId,state:'pending'},
  'session-read':{signingSessionId:'SESSION-S2-DEMO-001',signatureRequestId:request.signatureRequestId,state:'ready',redirectUrl:'https://esign.example.invalid/session/NOT-A-REAL-SESSION',expiresAt:'2026-10-25T08:35:00.123Z'},
  notice:{notificationId:'NOTICE-S2-DEMO-001',state:'received'},
  activate:receipt('REVISION_STATUS_EFFECTIVE','"s2-demo-working-1-state-6-v6"'),
  terminate:receipt('REVISION_STATUS_TERMINATED','"s2-demo-working-1-state-8-v6"'),
  apply:application,'apply-read':application,
  authority:{authorizationId:'AUTHORITY-S2-DEMO-001',tradeNumber:trade,state:'pending_review',tradeRevision:6},
  recognize:{recognitionId:'RECOGNITION-S2-DEMO-001',tradeNumber:trade,state:'pending_review',tradeRevision:6}
};
const params={trade_number:trade,contract_number:contract,revision_number:'1',signature_request_id:request.signatureRequestId,signing_session_id:responses['sign-session'].signingSessionId,application_id:application.applicationId,confirmation_id:confirmation.confirmationId};
function targetTag(endpoint){
  if(['trade-submit','apply','authority','recognize'].includes(endpoint.id))return '"s2-trade-r4-v4"';
  if(endpoint.id==='trade-review')return responses['trade-submit'].etag;
  if(endpoint.id==='submit')return responses.replace.etag;
  if(endpoint.id==='review')return responses.submit.etag;
  if(endpoint.id==='sign')return responses.review.etag;
  if(endpoint.id==='sign-session')return '"s2-signature-request-awaiting-signers-v2"';
  if(endpoint.id==='activate')return '"s2-demo-working-1-state-5-v5"';
  if(endpoint.id==='trade-reopen')return '"s2-trade-r4-returned-v6"';
  if(endpoint.id==='revise')return '"s2-demo-working-1-state-3-v4"';
  if(endpoint.id==='terminate')return '"s2-demo-working-1-state-4-v4"';
  return etag;
}
const examples=model.endpoints.map(endpoint=>{
  const resourcePath=endpoint.path.replace(/\{([^}]+)\}/g,(_,name)=>params[name])+(endpoint.id==='trade-context'?'?submitted_snapshot_number='+responses['trade-context'].submittedSnapshotNumber:'');
  const write=endpoint.method!=='GET',confirm=endpoint.id==='internal-confirmation',notice=endpoint.id==='notice';
  const headers={Accept:'application/json',Authorization:'<synthetic '+endpoint.audience+' credential omitted>'};
  if(write){headers['Content-Type']='application/json';headers['Idempotency-Key']=keyFor(endpoint.id);}
  if(write&&!confirm&&!notice){headers['X-Confirmation-Id']='<synthetic per-intent confirmation; NOT-VALID>';if(endpoint.id!=='create')headers['If-Match']=targetTag(endpoint);}
  if(notice){delete headers.Authorization;delete headers['Idempotency-Key'];headers['X-Provider-Signature']='<provider raw-body signature; NOT-VALID>';}
  const responseHeaders={'Content-Type':'application/json','Cache-Control':'no-store'};
  const resource=responses[endpoint.id];assert.ok(resource,endpoint.id);
  if(resource.etag)responseHeaders.ETag=resource.etag;
  if(write){
    const locations={create:'/api/v1/contracts/'+contract,'internal-confirmation':'/internal/v1/operation-confirmations/'+confirmation.confirmationId,sign:'/api/v1/signature-requests/'+request.signatureRequestId,'sign-session':'/api/v1/signing-sessions/'+resource.signingSessionId,revise:resourcePath+'/'+resource.revisionNumber,'trade-reopen':resourcePath+'/'+resource.tradeRevision};
    responseHeaders.Location=locations[endpoint.id]||resourcePath+'/'+(resource.submissionId||resource.decisionId||resource.notificationId||resource.applicationId||resource.authorizationId||resource.recognitionId||resource.acceptanceId);
    assert.ok(!responseHeaders.Location.endsWith('/undefined'),endpoint.id);
    if(endpoint.method==='PUT')delete responseHeaders.Location;
    if(!confirm&&!notice)responseHeaders['X-Receipt-Proof']='<platform receipt; SYNTHETIC-NOT-VALID>';
  }
  return transport.enrich({scenario:'Independent unexecuted fixture: prerequisite states/permissions/evidence must be established; not a runnable success trace.',request:{method:endpoint.method,path:resourcePath,headers,...(write?{body:input[endpoint.id]}:{})},response:{status:Number(endpoint.status),headers:responseHeaders,body:resource}},endpoint);
});
const rpc=examples.map(example=>{
  const endpoint=model.endpoints.find(item=>item.rpc===example.rpc);
  return transport.rpc(example,endpoint,'trade.contracts.v1');
});
artifacts['doc/examples/step2/review-document.html']=document;
artifacts['doc/examples/step2/http-contract.json']=pretty(model.endpoints);
artifacts['doc/examples/step2/http-examples.json']=pretty(examples);
artifacts['doc/examples/step2/rpc-examples.json']=pretty(rpc);
artifacts['doc/examples/step2/basis-supplier-replacement.json']=pretty(basis);
artifacts['doc/examples/step2/basis-file-catalogue.json']=pretty(basisFiles);
artifacts['doc/examples/step2/evidence-review-context.json']=pretty({
  ...responses['trade-context'],tradeRevision:7,submittedSnapshotNumber:'SNP-S2-SUBMITTED-7',approvedSnapshotNumber:snapshot,etag:'"s2-trade-r7-review-v10"',
  evidence:{agreementApplications:[{application:{...application,tradeRevision:5},content:input.apply}],customsAuthorizations:[{authorization:responses.authority,content:input.authority}],customsAgentRecognitions:[{recognition:{...responses.recognize,tradeRevision:7},content:input.recognize}]}
});
artifacts['doc/examples/step2/entity-projection.json']=pretty({
  designOnly:true,executed:false,actualStepOneDatabaseUnchanged:true,
  trade_record_tab:{trade_number:trade,trade_status_code:8,revision_number:4,approved_revision_number:4},
  trade_revision_tab:{snapshot_number:snapshot,trade_number:trade,revision_number:4,snapshot_reason_code:2,source_event_number:'EVT-S2-APPROVE-DEMO'},
  contract_record_tab:{contract_number:contract,contract_scope_code:1,document_type_code:10,trade_number:trade,current_revision_number:1},
  contract_revision_tab:{revision_number:1,trade_snapshot_number:snapshot,party_references_json:content.parties.map(party=>({contract_party_sequence:party.contractPartySequence,party_role_code:party.partyRoleCode,participant_sequence_number:party.participantSequenceNumber})),review_file_revision_id:'resolve FILE-S2-REVIEW-001 version 1',signed_file_revision_id:null,contract_revision_status_code:1,review_snapshot_json:null,lifecycle_events_json:[],effective_from:content.effectiveFrom,effective_to:content.effectiveTo,signed_at:null,effective_at:null,supersedes_revision_number:null},
  document_file_tab:{logical_file_number:file.logicalFileNumber,revision_number:1,document_type_code:10,storage_path:'doc/examples/step2/review-document.html',sha256:file.sha256,size_bytes:String(Buffer.byteLength(document)),media_type:'text/html',note:'Real local ORIGINAL DRAFT bytes only; not a verified signed file or remote storage fact.'},
  projectedAcceptanceResources:{agreementApplication:'transaction_filing_document_references_json + event 3 agreement_application/source, pending correction review',customsAuthorization:'customs broker participant_information_json.customs_authorizations + source/event 3, pending correction review',customsRecognition:'export agent participant_information_json.customs_agent_recognitions + source/event 3, pending correction review'},
  unresolvedExternalEvidence:'No real signer identity, CA/authorization, official customs permission, provider task or signed archive exists. Hypothetical HTTP response states are NOT legal/payment evidence.'
});
artifacts['doc/examples/step2/failure-examples.json']=pretty([
  ['TRADE_BASIS_NOT_APPROVED',422,'/content/tradeSnapshotNumber'],['CONTRACT_PURPOSE_NOT_REUSABLE',422,'/purpose'],
  ['AGREEMENT_NOT_APPLICABLE',422,'/partyMappings'],['SIGNATURE_IN_PROGRESS',409,'/contractNumber'],
  ['REVIEWER_NOT_INDEPENDENT',403,'/'],['SIGNATURE_EVIDENCE_INVALID',422,'/'],
  ['AUTHORIZATION_NOT_APPLICABLE',422,'/officialAuthorization'],['CONFIRMATION_MISMATCH',409,'/headers/X-Confirmation-Id']
].map(([error,status,pointer])=>({type:'urn:export-trade:problem:'+error.toLowerCase(),title:error,status,detail:'Design-only rejection; correct the prerequisite, never turn this into successful acceptance.',instance:'/design-only/step-two',errors:[{pointer,code:error,detail:error}],outcomeUnknown:false,retryAfterMs:0})));
artifacts['doc/examples/step2/http-reference.md']='# 步骤二HTTP响应与cURL示例\n\n每例为独立未执行推演；必须先满足当前资源状态、权限和真实签署/官方证据。不含真实签名或有效凭据，不能顺序运行假装完成全流程。替换部署BASE_URL及受众对应凭证，获取匹配每例正文/原键/标签的新确认；不自动重试未知写入。\n\n'+examples.map(example=>'## '+example.rpc+'\n\n```sh\n'+example.curl+'\n```\n\n```http\n'+example.httpResponse+'\n```\n').join('\n');
for(const useCase of model.useCases){
  artifacts['doc/examples/step2/'+useCase.id+'-sequence.mmd']=useCase.sequence+'\n';
  artifacts['doc/examples/step2/'+useCase.id+'-system-sequence.mmd']=useCase.systemSequence+'\n';
}
for(const name of ['doc/步骤二系统用例与接口协议.md','proto/trade/contracts/v1/contracts.proto'])artifacts[name]=fs.readFileSync(path.join(root,name),'utf8');
const generated='/* Generated by doc/sql/step2/generate.cjs; unexecuted synthetic design fixtures. */\nglobalThis.EXPORT_STEP_TWO_ARTIFACTS='+JSON.stringify(artifacts,null,2)+';\n';
for(const [name,text]of Object.entries({...artifacts,'交付成果/assets/step-two-usecases-artifacts.js':generated})){
  const destination=path.join(root,name);
  if(process.argv.includes('--check'))assert.equal(fs.readFileSync(destination,'utf8'),text,'Artifact drift: '+name);
  else{fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,text);}
}
console.log(JSON.stringify({step:2,artifacts:Object.keys(artifacts).length,useCases:model.useCases.length,endpoints:model.endpoints.length,httpExamples:examples.length,rpcExamples:rpc.length,databaseExecuted:false}));
