'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),model=require('../../../交付成果/assets/step-eight-usecases-model.js');
const transport=require('../transport-examples.cjs'),artifacts={},pretty=value=>JSON.stringify(value,null,2)+'\n';
const hash=value=>crypto.createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const material='<!doctype html><meta charset="utf-8"><title>原创四流差异核对材料</title><h1>合成供应商差异书面说明</h1><p>人民币100.00元已分配；仅合成内部观察，不是真实签署确认。无真实银行到账、海关放行、税务批准或正常结案证明。缺真实证据必须阻断。</p>\n';
const file={logicalFileNumber:'FILE-S8-SYNTHETIC',revisionNumber:1,sha256:hash(material),documentPurposeCode:19};
const trade='TRD-S8-SYNTHETIC',caseNumber='CASE-S8-SYNTHETIC',dispositionNumber='DSP-S8-SYNTHETIC';
const source={type:'trade',id:trade,revision:'1',hash:hash('synthetic-approved-reference'),sourceEventTail:'EVT-S8-SYNTHETIC-BASE'};
const vector={sources:[source],objectSets:[{type:'trade',objectIds:[trade],hash:hash([trade])},
  ...['shipment','customs','payment','accounting','certificate','taxrefund','compliance'].map(type=>({type,objectIds:[],hash:hash([])}))],
  ruleVersion:'S8-RECONCILIATION-1',hash:''};
vector.hash=hash({...vector,hash:undefined});
const checks=[
  {itemNumber:'SOURCE-COMPLETENESS',ruleCode:'SOURCE_UNKNOWN',result:'CHECK_RESULT_UNKNOWN',sources:[source],evidence:[],
    blockingCodes:['SOURCE_UNKNOWN'],explanation:'跨域尚未提供真实源与完整集合，空合成集合不证明无对象'},
  {itemNumber:'EXTERNAL-EVIDENCE',ruleCode:'REAL_EXTERNAL_PROOF',result:'CHECK_RESULT_UNKNOWN',sources:[],evidence:[],
    blockingCodes:['EXTERNAL_EVIDENCE_MISSING'],explanation:'原创文件只证明内部合成记录，不构成银行/海关/税务证明'},
  {itemNumber:'FUNDS-ALLOCATION',ruleCode:'CNY_CONSERVATION',result:'CHECK_RESULT_PASS',
    expectedDecimal:'100.00',observedDecimal:'100.00',currencyCode:'CNY',sources:[source],evidence:[file],
    blockingCodes:[],explanation:'仅说明结构中的合成金额一致，不证明真实资金平衡'}
];
const affected={contextCode:'funds',businessReference:'PAY-S8-SYNTHETIC',scopeCode:3,operations:['approve-payment','execute-payment'],source:{...source,type:'funds',id:'PAY-S8-SYNTHETIC'}};
const holdReference='HOLD-S8-SYNTHETIC-1',activeReason={caseNumber,holdReference,affectedContexts:[affected],
  pendingAcknowledgements:['funds:PAY-S8-SYNTHETIC']};
const report={reportNumber:'RPT-S8-SYNTHETIC',tradeNumber:trade,vector,checks,evidence:[file],
  reportHash:hash({vector,checks}),creatorReference:'SYNTHETIC-RECONCILER',createdAt:'2026-11-01T01:00:00Z',acceptanceId:'S8-SYNTHETIC-REPORT'};
const caseInput={reportNumber:report.reportNumber,itemNumber:'EXTERNAL-EVIDENCE',caseTypeCode:4,severityCode:2,scopeCode:3,owner:affected.source,evidence:[file]};
const assignment={assignedTo:'SYNTHETIC-CASE-OWNER',dueAt:'2026-11-05T01:00:00Z',reason:'分派核实，非已解决'};
const hold={affectedContexts:[affected],reason:'真实资金证据缺失，只暂停本对象付款操作',evidence:[file],independentApprovalReference:'SYNTHETIC-INDEPENDENT-APPROVAL'};
const acknowledgement={decisionReference:'DSP-S8-SYNTHETIC-HOLD',holdReference,target:affected,
  ownerExecution:{...affected.source,sourceEventTail:'SYNTHETIC-OWNER-GATE'},phase:'applied'};
const remedy={originalDispositionReference:'DSP-S8-SYNTHETIC-HOLD',substantiveDispositions:[source],evidence:[file],explanation:'仅记录补正，不解除原因'};
const correction={originalNode:source,affectedContexts:[affected],dependencyEdges:[affected.source],expectedVector:vector,reason:'原节点新修订及重审',evidence:[file]};
const release={holdReference,substantiveDispositions:[source],expectedVector:vector,evidence:[file]};
const review={applicationReference:'DSP-S8-SYNTHETIC-APPLICATION',outcome:'REVIEW_OUTCOME_RETURN',reason:'真实外部证据未核实，保留原暂停及其他原因',expectedVector:vector,evidence:[]};
const closureInput={reportNumber:'RPT-S8-REQUIRES-REAL-EVIDENCE',reportHash:hash('NOT-EXECUTED-REQUIRES-REAL-EVIDENCE'),
  expectedVector:vector,reason:'独立协议结构例：须另有当前真实证据完整报告；未建立前置，不执行、不证明受理成功'};
const caseClosure={substantiveDispositions:[source],moneyDifferenceClosure:affected.source,expectedVector:vector,evidence:[file]};
const inputs={'s8-report-create':{expectedVector:vector},'s8-case-create':caseInput,'s8-assignment-create':assignment,
  's8-hold-create':hold,'s8-propagation-create':acknowledgement,'s8-remedy-create':remedy,
  's8-remedy-decision':review,
  's8-correction-create':correction,'s8-correction-decision':review,'s8-release-create':release,
  's8-release-decision':review,'s8-case-close-create':caseClosure,'s8-case-close-decision':review,
  's8-closure-create':closureInput,'s8-closure-decision':{outcome:'REVIEW_OUTCOME_RETURN',reason:'当前报告陈旧或证据缺失，不结案',expectedVector:vector,evidence:[]}};
const disposition={dispositionNumber,caseNumber,actionCode:3,resultCode:1,actorReference:'SYNTHETIC-CASE-OWNER',
  occurredAt:'2026-11-01T01:00:00Z',affectedContexts:[affected],acceptanceId:'S8-SYNTHETIC-DISPOSITION',remedy,etag:'"s8-case-event-1"'};
const caseResource={caseNumber,tradeNumber:trade,basis:caseInput,caseStatus:2,assignedTo:assignment.assignedTo,
  dueAt:assignment.dueAt,activeReasons:[activeReason],dispositions:[disposition],acceptanceId:'S8-SYNTHETIC-CASE',etag:'"s8-case-event-1"'};
const application={applicationNumber:'APP-S8-SYNTHETIC',tradeNumber:trade,basis:closureInput,
  applicantReference:'SYNTHETIC-APPLICANT',createdAt:'2026-11-01T01:00:00Z',acceptanceId:'S8-SYNTHETIC-APPLICATION'};
const decision={decisionNumber:'DEC-S8-SYNTHETIC',applicationNumber:application.applicationNumber,eventTypeCode:20,
  tradeStatusCode:8,reviewerReference:'SYNTHETIC-INDEPENDENT-REVIEWER',blockingCodes:['EXTERNAL_EVIDENCE_MISSING'],reason:'无真实外部证据，退回保持8',acceptanceId:'S8-SYNTHETIC-DECISION'};
const dispositions={
  's8-assignment-create':[1,1,'assignment',assignment],'s8-hold-create':[2,2,'hold',hold],
  's8-propagation-create':[4,1,'acknowledgement',acknowledgement],'s8-remedy-create':[3,1,'remedy',remedy],
  's8-remedy-decision':[4,3,'review',review],
  's8-correction-create':[5,1,'correctionApplication',correction],'s8-correction-decision':[6,3,'review',review],
  's8-release-create':[7,1,'releaseApplication',release],'s8-release-decision':[8,3,'review',review],
  's8-case-close-create':[9,1,'closureApplication',caseClosure],'s8-case-close-decision':[9,3,'review',review]
};
const params={trade_number:trade,case_number:caseNumber,report_number:report.reportNumber,disposition_number:dispositionNumber,
  application_number:application.applicationNumber,decision_number:decision.decisionNumber,request_key:'d8080000-0000-4000-8000-000000000001'};
const examples=model.endpoints.map((endpoint,index)=>{
  const request={method:endpoint.method,path:endpoint.path.replace(/\{([^}]+)\}/g,(_,key)=>params[key]),
    headers:{Authorization:'<INVALID-SYNTHETIC-INTERNAL-CREDENTIAL>'}};
  if(endpoint.body){Object.assign(request.headers,{'Content-Type':'application/json','Idempotency-Key':'d8080000-0000-4000-8000-'+String(index+1).padStart(12,'0'),
    'If-Match':'"s8-context-synthetic-1"','X-Confirmation-Id':'<INVALID-SYNTHETIC-CONFIRMATION>'});request.body=inputs[endpoint.id];}
  let body;
  if(endpoint.output==='ReconciliationContext')body={tradeNumber:trade,vector,checks,activeReasons:[activeReason],
    openCaseNumbers:[caseNumber],unknownExecutionReferences:['SYNTHETIC-BANK-UNKNOWN'],missingEvidenceCodes:['EXTERNAL_EVIDENCE_MISSING'],etag:'"s8-context-synthetic-1"'};
  else if(endpoint.output==='ReconciliationReport')body=report;
  else if(endpoint.output==='DiscrepancyCase')body=caseResource;
  else if(endpoint.output==='DispositionResource'){
    const spec=dispositions[endpoint.id];
    body=spec?{...Object.fromEntries(Object.entries(disposition).filter(([key])=>key!=='remedy')),dispositionNumber:dispositionNumber+'-'+index,
      actionCode:spec[0],resultCode:spec[1],[spec[2]]:spec[3],...(endpoint.id==='s8-hold-create'?{holdReference}:{}),
      ...(endpoint.id.endsWith('decision')?{approverReference:'SYNTHETIC-INDEPENDENT-REVIEWER'}:{})}:disposition;
  }else if(endpoint.output==='ClosureApplication')body=application;
  else if(endpoint.output==='ClosureDecision')body=decision;
  else body={requestKey:params.request_key,originalHttpStatus:201,originalLocation:'/internal/v1/trades/'+trade+'/reconciliation-reports/'+report.reportNumber,
    originalEtag:'"s8-report-synthetic-1"',bodyHash:hash(report),report};
  const response={status:Number(endpoint.status),headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body};
  if(endpoint.method==='POST'){
    response.headers.Location=endpoint.output==='DispositionResource'
      ?'/internal/v1/trades/'+trade+'/discrepancy-cases/'+caseNumber+'/dispositions/'+body.dispositionNumber
      :request.path+'/'+(body.reportNumber||body.caseNumber||body.decisionNumber||body.applicationNumber);
  }
  response.headers.ETag=body.etag||'"s8-immutable-'+index+'"';
  if(endpoint.id==='s8-closure-create'){
    request.body={...closureInput,reportNumber:report.reportNumber,reportHash:report.reportHash};
    response.status=422;response.headers={'Content-Type':'application/problem+json','Cache-Control':'no-store'};
    response.body={type:'https://example.invalid/problems/external-evidence-missing',title:'EXTERNAL_EVIDENCE_MISSING',
      status:422,detail:'当前报告包含unknown，缺真实外部证据，不受理正常结案申请',instance:request.path,
      errors:[{pointer:'/reportNumber',code:'EXTERNAL_EVIDENCE_MISSING',detail:'补齐原所属域真实证据后生成新报告'}],
      outcomeUnknown:false,retryAfterMs:0};
  }
  return transport.enrich({scenario:'独立结构例，不是串联成功轨迹；合成记录不证明官方/银行事实',request,response},endpoint);
});
const rpc=examples.map((example,index)=>{
  const call=transport.rpc(example,model.endpoints[index],'trade.reconciliation.v1');
  if(example.response.status>=400){
    delete call.response;
    call.error={code:'FAILED_PRECONDITION',details:{code:'EXTERNAL_EVIDENCE_MISSING',httpStatus:422,
      errors:example.response.body.errors,retryable:false,retryAfterMs:0,outcomeUnknown:false,
      requestReference:example.request.headers['Idempotency-Key']}};
  }
  return call;
});
const errorExamples=model.errors.map(([code,httpStatus,grpcStatus,retryable,recovery])=>({
  codes:code.split(' / '),httpStatus,grpcStatus,retryable,recovery,
  ...(httpStatus===null?{}:{httpBody:{type:'https://example.invalid/problems/'+code.split(' / ')[0].toLowerCase(),title:code.split(' / ')[0],
    status:httpStatus,detail:recovery,instance:'/internal/v1/trades/'+trade+'/reconciliation-context',
    errors:[{pointer:'',code:code.split(' / ')[0],detail:recovery}],outcomeUnknown:code.includes('COMMIT_OUTCOME_UNKNOWN'),retryAfterMs:0}}),
  rpc:{error:{code:grpcStatus,details:{code:code.split(' / ')[0],httpStatus:httpStatus||499,
    errors:[{pointer:'',code:code.split(' / ')[0],detail:recovery}],retryable,retryAfterMs:0,
    outcomeUnknown:code.includes('COMMIT_OUTCOME_UNKNOWN'),requestReference:'S8-SYNTHETIC-REQUEST'}}}
}));
artifacts['doc/examples/step8/material.html']=material;
artifacts['doc/examples/step8/http-contract.json']=pretty(model.endpoints);
artifacts['doc/examples/step8/http-examples.json']=pretty(examples);
artifacts['doc/examples/step8/rpc-examples.json']=pretty(rpc);
artifacts['doc/examples/step8/error-examples.json']=pretty(errorExamples);
const branch=(action,results,required,optional=[])=>({action_code:action,result_codes:results,required,optional,additional_properties:false});
artifacts['doc/examples/step8/compliance-decision-contract.json']=pretty({
  schema_version:1,additional_properties:false,
  required:['action_code','result_code','reason_code','actor_reference','decided_at','decision_type','decision_details'],
  optional:['approver_reference','evidence_references','reason_text'],
  rules:['通过决定result2必须独立approver_reference；application_reference仅引用同案件原申请',
    'holdReference为原action2事件号；关案不改变有效原因；多目标解除逐目标applied才完成',
    '所有源向量、集合、引用及证据分别依照公共§11和本步Proto闭合，不接收自由扩展JSON'],
  decision_details:{
    assignment:branch(1,[1],['assigned_to','due_at','reason']),
    hold_decision:branch(2,[2,3],['reason','affected_contexts']),
    gate_acknowledgement:branch(4,[1],['decision_reference','hold_reference','phase'],
      ['target_context_code','target_business_reference','source_revision_reference','source_event_reference']),
    remedy:branch(3,[1],['original_disposition_reference','substantive_dispositions','evidence_references','explanation']),
    remedy_decision:branch(4,[2,3],['application_reference','outcome','reason','source_version_vector','object_sets','evidence_references']),
    correction_application:branch(5,[1],['original_node','affected_contexts','dependency_edges','source_version_vector','object_sets','rule_version','reason','evidence_references']),
    correction_decision:branch(6,[2,3],['application_reference','outcome','source_version_vector','object_sets','rule_version','invalidated_references','reentry_node','propagation_targets','reason','evidence_references']),
    release_application:branch(7,[1],['hold_reference','source_version_vector','object_sets','rule_version','substantive_dispositions','evidence_references']),
    release_decision:branch(8,[2,3],['hold_reference','application_reference','validation_basis','source_version_vector','object_sets','evidence_references']),
    case_closure_application:branch(9,[1],['source_version_vector','object_sets','substantive_dispositions','money_difference_closure','evidence_references']),
    case_closure_decision:branch(9,[2,3],['application_reference','scope','source_version_vector','object_sets','evidence_references'])
  },field_types:{
    assigned_to:'string',due_at:'UTC datetime',reason:'string',decision_reference:'string',hold_reference:'string',
    phase:'enum received|applied',target_context_code:'string',target_business_reference:'string',
    source_revision_reference:'string',source_event_reference:'string',original_disposition_reference:'string',
    substantive_dispositions:'array<SourceReference>',evidence_references:'array<FileRef>',explanation:'string',
    application_reference:'string',outcome:'enum APPROVE|RETURN',source_version_vector:'array<SQLSourceReference>',
    object_sets:'array<{type:string,object_ids:array<string>,hash:sha256}>',rule_version:'string',original_node:'SourceReference',
    affected_contexts:'array<AffectedContext>',dependency_edges:'array<SourceReference>',invalidated_references:'array<SourceReference>',
    reentry_node:'SourceReference',propagation_targets:'array<AffectedContext>',validation_basis:'string',
    money_difference_closure:'SourceReference|null (null only when no linked funds difference)',scope:'string'
  }});
const persistedVector=vector.sources.map(source=>({context_code:source.type,business_number:source.id,revision_reference:source.revision,
  content_hash:source.hash,event_tail_reference:source.sourceEventTail}));
const fileRef={document_purpose_code:file.documentPurposeCode,logical_file_number:file.logicalFileNumber,revision_number:file.revisionNumber,content_digest:file.sha256};
const sqlReport={payload_schema_version:1,report_schema_version:1,rule_version:vector.ruleVersion,
  source_version_vector:persistedVector,object_sets:vector.objectSets.map(set=>({type:set.type,object_ids:set.objectIds,hash:set.hash})),
  checks:checks.map(item=>({item_number:item.itemNumber,rule_code:item.ruleCode,result:{CHECK_RESULT_PASS:1,CHECK_RESULT_FAIL:2,CHECK_RESULT_UNKNOWN:3}[item.result],
    expected_decimal:item.expectedDecimal||'',observed_decimal:item.observedDecimal||'',currency_code:item.currencyCode||'',
    sources:item.sources.map(source=>({type:source.type,id:source.id,revision:source.revision,hash:source.hash,source_event_tail:source.sourceEventTail})),
    evidence:item.evidence.map(evidence=>({logical_file_number:evidence.logicalFileNumber,revision_number:evidence.revisionNumber,sha256:evidence.sha256,document_purpose_code:evidence.documentPurposeCode})),
    blocking_codes:item.blockingCodes,explanation:item.explanation})),evidence_references:[fileRef]};
artifacts['doc/examples/step8/sql-entity-examples.json']=pretty({designOnly:true,executed:false,normalClosureE2EProven:false,
  trade_event_tab:{event_number:report.reportNumber,trade_record_id:'<resolved internal id>',revision_number:1,event_type_code:18,
    from_trade_status_code:null,to_trade_status_code:null,actor_reference:report.creatorReference,reason_code:1,reason_text:'内部合成核对，外部证据unknown',
    event_payload:sqlReport,trace_id:'S8-SYNTHETIC-TRACE',occurred_at:report.createdAt},
  compliance_discrepancy_case_tab:{case_number:caseNumber,case_type_code:4,severity_code:2,owner_context_code:'funds',owner_business_number:affected.businessReference,
    trade_number:trade,transaction_number:affected.businessReference,scope_code:3,case_status:2,assigned_to:assignment.assignedTo,due_at:assignment.dueAt,
    evidence_manifest_json:[{evidence_type_code:1,owner_context_code:'document',business_reference:file.logicalFileNumber,version_reference:'1',content_digest:file.sha256}],
    opened_at:report.createdAt,closed_at:null},
  compliance_disposition_event_tab:{disposition_event_number:'DSP-S8-SYNTHETIC-HOLD',case_number:caseNumber,action_code:2,result_code:2,
    actor_reference:'SYNTHETIC-CASE-OWNER',approver_reference:'SYNTHETIC-INDEPENDENT-REVIEWER',reason_code:1,
    decision_snapshot_json:{action_code:2,result_code:2,reason_code:1,actor_reference:'SYNTHETIC-CASE-OWNER',approver_reference:'SYNTHETIC-INDEPENDENT-REVIEWER',
      decided_at:report.createdAt,decision_type:'hold_decision',decision_details:{reason:hold.reason,affected_contexts:[{
        context_code:affected.contextCode,business_reference:affected.businessReference,scope_code:affected.scopeCode,operations:affected.operations,
        source:{type:affected.source.type,id:affected.source.id,revision:affected.source.revision,hash:affected.source.hash,source_event_tail:affected.source.sourceEventTail}}]}},
    affected_contexts_json:[{context_code:affected.contextCode,business_reference:affected.businessReference,scope_code:3,action_code:2,expected_acknowledgement:true}],
    evidence_reference:file.logicalFileNumber+'#1',occurred_at:report.createdAt}});
const failedIndex=model.endpoints.findIndex(endpoint=>endpoint.id==='s8-closure-create');
artifacts['doc/examples/step8/failure-examples.json']=pretty([{method:'CreateTradeClosureApplication',
  request:examples[failedIndex].request,response:examples[failedIndex].response,
  rpc:rpc[failedIndex],persistedApplication:false}]);
artifacts['doc/examples/step8/entity-projection.json']=pretty({designOnly:true,externalSuccessProven:false,report,caseResource,disposition,
  unexecutedApplicationShape:application,returnedDecision:decision,
  mapping:{report:'trade_event_tab.event_type_code=18/event_payload',closureApplication:'trade_event_tab.event_type_code=19/event_payload',
    closureReturn:'trade_event_tab.event_type_code=20/event_payload',formalClosure:'trade_event_tab.event_type_code=17 + trade_status_code=10',
    case:'compliance_discrepancy_case_tab',businessDecisions:'compliance_disposition_event_tab.decision_snapshot_json/affected_contexts_json'},
  note:'unexecutedApplicationShape只是消息结构，不在数据库伪造成功申请；实际缺证据422见failure-examples；关案和解除分别独立'} );
artifacts['doc/examples/step8/http-reference.md']='# 步骤八HTTP/RPC及cURL\n\n未部署设计；内部合成凭据不可用。各组为独立结构例，非完整结案成功链。结案申请当前unknown报告明确返回422 application/problem+json；RPC仅error，无response/resource。\n\n'+examples.map((example,index)=>
  '## '+example.rpc+'\n\n`'+example.request.method+' '+example.request.path+'`\n\n客户端/应用deadline：'+example.timeoutMs+'/'+model.endpoints[index].timeout.serverMs+'ms。\n\n```http\n'+example.httpResponse+'\n```\n\n```sh\n'+example.curl+'\n```\n\n```json\n'+pretty(rpc[index])+'```\n').join('\n');
for(const goal of model.useCases)for(const [kind,diagram]of [['system',goal.systemSequence],['implementation',goal.sequence]])
  artifacts['doc/examples/step8/'+goal.id+'-'+kind+'.mmd']=diagram+'\n';
for(const name of ['proto/trade/reconciliation/v1/reconciliation.proto','doc/步骤八系统用例与接口协议.md'])
  artifacts[name]=fs.readFileSync(path.join(root,name),'utf8');
const output='交付成果/assets/step-eight-usecases-artifacts.js';
const bundle="'use strict';\n(function(root){\n  const artifacts="+pretty(artifacts).trim()+";\n  root.EXPORT_STEP_EIGHT_ARTIFACTS=artifacts;\n  if(typeof module==='object'&&module.exports)module.exports=artifacts;\n})(globalThis);\n";
for(const [name,content]of Object.entries({...artifacts,[output]:bundle})){
  const target=path.join(root,name);
  if(process.argv.includes('--check'))assert.equal(fs.readFileSync(target,'utf8'),content,'Stale: '+name);
  else{fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content);}
}
console.log(JSON.stringify({step:8,useCases:model.useCases.length,endpoints:model.endpoints.length,artifacts:Object.keys(artifacts).length,check:process.argv.includes('--check')}));
