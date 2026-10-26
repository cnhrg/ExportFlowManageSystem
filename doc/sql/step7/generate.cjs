'use strict';
const fs=require('fs'),path=require('path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../..'),model=require(path.join(root,'交付成果/assets/step-seven-usecases-model.js'));
const transport=require('../transport-examples.cjs'),check=process.argv.includes('--check');
const files={},write=(name,value)=>{files[name]=typeof value==='string'?value:JSON.stringify(value,null,2)+'\n';};
const file={fileNumber:'SYNTHETIC-S7-FILE',versionId:'SYNTHETIC-NOT-A-REAL-S3-VERSION',sha256:'a'.repeat(64),purposeCode:24,revisionNumber:1};
const scope={reference:'SYNTHETIC-PREPARATION-SCOPE',customsRevisionReferences:[],certificateReferences:[]};
const content={approvedTradeSnapshotReference:'SYNTHETIC-APPROVED-SNAPSHOT',scope,currencyCode:'CNY',files:[file]};
const taxCase={taxCaseNumber:'SYNTHETIC-S7-CASE',tradeNumber:'SYNTHETIC-S7-TRADE',taxTypeCode:2,scope,status:'CASE_STATUS_PREPARING',currencyCode:'CNY',version:1,etag:'"s7-case-1"',missingGates:['SCOPE_RULE_UNCONFIRMED','TAX_AUTHORITY_UNCONFIRMED']};
const manifest=[{logical_file_number:file.fileNumber,revision_number:1,content_digest:file.sha256,document_purpose_code:24}];
const storedContent={schema_version:1,tax_type_code:2,approved_snapshot_number:content.approvedTradeSnapshotReference,scope_reference:scope.reference,rule_version:'UNCONFIRMED',
  responsibility_basis:{unresolved_items:['主管机关责任/范围规则待确认']},declaration_references:[],fields:{currency_code:'CNY'},
  check_report:{missing_gates:['SCOPE_RULE_UNCONFIRMED','TAX_AUTHORITY_UNCONFIRMED'],checked_rule_references:[]}};
const canonical=value=>Array.isArray(value)?'['+value.map(canonical).join(',')+']':value&&typeof value==='object'?'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}':JSON.stringify(value);
const packageHash=crypto.createHash('sha256').update(canonical({content:storedContent,manifest})).digest('hex');
const submission={taxCaseNumber:taxCase.taxCaseNumber,submissionRevisionNumber:1,content,packageHash,executionStatus:'not_dispatched',etag:'"s7-submission-1"'};
const receipt={taxCaseNumber:taxCase.taxCaseNumber,operationNumber:'SYNTHETIC-S7-OP',result:'internal_synthetic_only',etag:'"s7-case-2"'};
const inputs={
  's7-create':{tradeRevisionNumber:1,scope,taxpayerSnapshotReference:'SYNTHETIC-A-SNAPSHOT',currencyCode:'CNY'},
  's7-package':content,
  's7-review':{submissionRevisionNumber:1,packageHash:submission.packageHash,decision:'REVIEW_DECISION_RETURN',reason:'范围/责任未确认，退回补料',verifiedBasisReferences:[]},
  's7-dispatch':{submissionRevisionNumber:1,packageHash:submission.packageHash,authorizationBasisReference:'UNVERIFIED-NOT-AUTHORITY'},
  's7-notice':{submissionRevisionNumber:1,externalEventKey:'',authorityReferenceNumber:'',kind:'OFFICIAL_KIND_ACCEPTED',originalNotice:{...file,purposeCode:21},verifiedSourceReference:'',occurredAt:'2026-10-25T00:00:00Z',currencyCode:'CNY',dispatchReference:'UNVERIFIED'},
  's7-correction':{previousSubmissionRevisionNumber:1,correctionEventNumber:'',replacement:content},
  's7-followup':{submissionRevisionNumber:1,ownerReference:'SYNTHETIC-A-OPERATOR',action:'等待主管机关确认范围/职责，不猜截止日期'},
  's7-credit':{submissionRevisionNumber:1,officialDecisionEventNumber:'',controlledFundObservationReference:'',recipientAccountBasisReference:''}
};
const rejected={'s7-dispatch':'SCOPE_RULE_UNCONFIRMED','s7-notice':'OFFICIAL_EVIDENCE_REQUIRED','s7-correction':'OFFICIAL_EVIDENCE_REQUIRED','s7-credit':'REFUND_OBSERVATION_UNAVAILABLE'};
const http=model.endpoints.map(endpoint=>{
  const pathname=endpoint.path.replace('{trade_number}',taxCase.tradeNumber).replace('{tax_case_number}',taxCase.taxCaseNumber).replace('{submission_revision_number}','1').replace('{operation_number}',receipt.operationNumber);
  const headers={Authorization:'Bearer SYNTHETIC-NOT-A-TOKEN',Accept:'application/json'};
  if(endpoint.method!=='GET')Object.assign(headers,{'Content-Type':'application/json','Idempotency-Key':'77777777-7777-4777-8777-'+String(model.endpoints.indexOf(endpoint)+1).padStart(12,'0'),'If-Match':'"s7-case-1"','X-Confirmation-Id':'SYNTHETIC-NOT-A-CONFIRMATION'});
  const output={RefundCase:taxCase,Submission:submission,Receipt:receipt,ReviewContext:{taxCase,submissions:[submission],missingGates:taxCase.missingGates,verifiedEventReferences:[]},Operation:{operationNumber:receipt.operationNumber,taxCaseNumber:taxCase.taxCaseNumber,executionStatus:'not_dispatched',originalReceipt:receipt}};
  const reason=rejected[endpoint.id],status=reason?422:Number(endpoint.status);
  const body=reason?{type:'urn:trade:problem:'+reason.toLowerCase(),title:reason,status,detail:'缺真实权威依据，失败关闭；不产生正式成功事实',instance:pathname,
    errors:[{pointer:'/'+endpoint.body,code:reason,detail:'补齐本意图的真实权威依据'}],outcomeUnknown:false,retryAfterMs:0}:output[endpoint.output];
  const responseHeaders={'Content-Type':reason?'application/problem+json':'application/json','Cache-Control':'no-store'};
  if(!reason){responseHeaders.ETag=body.etag||'"s7-context-1"';if(endpoint.method==='POST')responseHeaders.Location=endpoint.id==='s7-create'?'/api/v1/tax-refund-cases/'+taxCase.taxCaseNumber:endpoint.output==='Submission'?'/api/v1/tax-refund-cases/'+taxCase.taxCaseNumber+'/submission-revisions/1':'/api/v1/tax-refund-cases/'+taxCase.taxCaseNumber+'/operations/'+receipt.operationNumber;}
  return transport.enrich({id:endpoint.id,audience:endpoint.audience,request:{method:endpoint.method,path:pathname,headers,...(inputs[endpoint.id]?{body:inputs[endpoint.id]}:{})},response:{status,headers:responseHeaders,body},note:'设计合成输入；官方/银行成功未验证，未接渠道明确阻断'},endpoint);
});
const rpc=http.map((example,index)=>{
  const result=transport.rpc(example,model.endpoints[index],'trade.taxrefund.v1');
  result.serverBudgetMs=model.endpoints[index].timeout.serverMs;
  if(example.response.status>=400){
    delete result.response;
    result.error={code:'FAILED_PRECONDITION',details:{code:example.response.body.errors[0].code,httpStatus:example.response.status,errors:example.response.body.errors,
      retryable:false,retryAfterMs:0,outcomeUnknown:false,requestReference:'SYNTHETIC-S7-TRACE'}};
    result.errorType='trade.filing.v1.RpcFailure';result.httpErrorType='trade.filing.v1.HttpProblem';
  }
  return result;
});
write('doc/examples/step7/http-contract.json',model.endpoints);
write('doc/examples/step7/http-examples.json',http);
write('doc/examples/step7/rpc-examples.json',rpc);
write('doc/examples/step7/entities.json',{
  syntheticOnly:true,warning:'只含准备及内部合成数据；没有税务机关/银行成功夹具',
  tax_case_tab:{tax_case_number:taxCase.taxCaseNumber,trade_number:taxCase.tradeNumber,tax_type_code:2,case_status:1,scope_reference:scope.reference,version:1,claimed_amount:null,currency_code:'CNY'},
  tax_submission_tab:{tax_case_number:taxCase.taxCaseNumber,submission_revision_number:1,package_hash:packageHash,submission_status:1,submission_content_json:storedContent,evidence_manifest_json:manifest,review_snapshot_json:null,previous_submission_revision_number:null,correction_event_number:null,dispatch_reference:null,execution_status:1,version:1},
  tax_event_tab:{event_number:'SYNTHETIC-S7-PREP-EVENT',tax_case_number:taxCase.taxCaseNumber,submission_revision_number:null,external_event_key:null,event_type_code:1,result_code:1,event_payload_json:{schema_version:1,operation_evidence_reference:'SYNTHETIC-PREP-OP',scope_reference:scope.reference,unresolved_items:storedContent.responsibility_basis.unresolved_items},actor_reference:'SYNTHETIC-A-OPERATOR'}
});
write('doc/examples/step7/entity-projection.json',{
  authority:'doc/领域拆分评估与交易域设计.md §11',schema_version:1,
  source:'PackageInput is a command, never stored verbatim as domain JSON; server resolves controlled evidence and computes report.',
  submission_content_json:storedContent,evidence_manifest_json:manifest,
  review_snapshot_json:{reviewer_reference:'SYNTHETIC-INDEPENDENT-REVIEWER',result_code:3,reviewed_at:'2026-10-25T00:00:00Z',content_hash:packageHash,rule_version:'UNCONFIRMED',evidence_references:[],comments:'范围未确认，退回补料'},
  event_payload_branches:{
    preparation:{schema_version:1,operation_evidence_reference:'SYNTHETIC-PREP-OP',scope_reference:scope.reference,unresolved_items:['范围/职责待确认']},
    package_or_review:{schema_version:1,operation_evidence_reference:'SYNTHETIC-REVIEW-OP',submission_content_hash:packageHash,reviewer_reference:'SYNTHETIC-INDEPENDENT-REVIEWER',reason:'内部退回'}
  },
  unavailable_branches:['正式办理/结果必须真实源命名空间/机关号/确切文件证据，本例不造成功','银行核对必须真实受控资金域证据，本例不造到账'],
  hash_profile:'Validation-only canonical sorted-key UTF-8 JSON of {content,manifest}; production must reuse negotiated canonical profile.'
});
write('doc/examples/step7/material.html','<!doctype html><meta charset="utf-8"><title>原创退税备料样本</title><h1>仅供隔离验证</h1><p>A供应商退税材料准备；范围、税率、期限、正式授权尚未确认。本文件不是官方回执、批准决定或银行到账证明。</p>\n');
write('doc/examples/step7/http-reference.md','# 步骤七逐接口HTTP / RESPONSE / cURL\n\n所有示例是离线设计，不是已经上线的handler；设置真实BASE_URL及本受众凭证/确切意图确认前不可执行。官方、补正和到账示例故意返回缺证据阻断。\n\n'+http.map(e=>'## '+e.id+' · '+e.rpc+'\n\n```http\n'+e.request.method+' '+e.request.path+'\n'+Object.entries(e.request.headers).map(([k,v])=>k+': '+v).join('\n')+'\n\n'+(e.request.body?JSON.stringify(e.request.body,null,2):'')+'\n```\n\n### RESPONSE\n\n```http\n'+e.httpResponse+'\n```\n\n```bash\n'+e.curl+'\n```\n').join('\n'));
for(const useCase of model.useCases){
  write('doc/examples/step7/'+useCase.id+'-system.mmd',useCase.systemSequence+'\n');
  write('doc/examples/step7/'+useCase.id+'-implementation.mmd',useCase.sequence+'\n');
}
write('doc/examples/step7/transport-policy.json',{designOnly:true,defaultDiagramScale:0.7,
  audiences:{external:'ExternalTaxRefundService / 本方对象权限',internal:'InternalTaxRefundOperationsService / 独立内部权限'},
  writes:{headers:['Authorization','Idempotency-Key','If-Match','X-Confirmation-Id'],replay:'原键/原文/原标签；先查原受理并校验当前权限，锁根后当前读重查',confirmation:'独立确认入口复用步骤一；绑定subject/audience/method/path/body/ETag/idempotency-key及TTL，不递归确认'},
  reads:{headers:['Authorization'],queryAllowlist:[]},deadlines:{readClientMs:5000,readServerMs:4000,writeClientMs:10000,writeServerMs:8000},
  errors:model.errors,unknown:'DEADLINE_EXCEEDED/UNAVAILABLE不证明提交失败；恢复原操作号/原办理号，禁止新号盲重发'});
const artifacts={...files,
  'doc/步骤七系统用例与接口协议.md':fs.readFileSync(path.join(root,'doc/步骤七系统用例与接口协议.md'),'utf8'),
  'proto/trade/taxrefund/v1/taxrefund.proto':fs.readFileSync(path.join(root,'proto/trade/taxrefund/v1/taxrefund.proto'),'utf8')};
write('交付成果/assets/step-seven-usecases-artifacts.js',"'use strict';\n(function(root){const artifacts="+JSON.stringify(artifacts,null,2)+";root.EXPORT_STEP_SEVEN_ARTIFACTS=artifacts;if(typeof module==='object'&&module.exports)module.exports=artifacts;})(globalThis);\n");
let mismatches=0;
for(const [name,value]of Object.entries(files)){
  const target=path.join(root,name);
  if(check){if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==value){console.error('STALE '+name);mismatches++;}}
  else {fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,value);}
}
if(mismatches)process.exitCode=1;else console.log((check?'Checked ':'Generated ')+Object.keys(files).length+' step-seven artifacts');
