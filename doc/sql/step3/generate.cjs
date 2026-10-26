'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),model=require('../../../交付成果/assets/step-three-usecases-model.js');
const transport=require('../transport-examples.cjs'),artifacts={};
const pretty=value=>JSON.stringify(value,null,2)+'\n',hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const material='<!doctype html><meta charset="utf-8"><title>原创物流批次材料</title><h1>合成备货与运输计划</h1><p>仅用于设计和中间件验证。100件中计划本批40件，人民币4000.00元。无真实签章、授权、订舱、海关放行或签收证明。</p>\n';
const file={logicalFileNumber:'FILE-S3-SYNTHETIC-001',revisionNumber:1,sha256:hash(material),documentTypeCode:3};
const trade='TRD-S3-SYNTHETIC-001',shipment='SHP-S3-SYNTHETIC-001',submission='SUB-S3-SYNTHETIC-001';
const plan={approvedSnapshotNumber:'SNP-S3-SYNTHETIC-APPROVED',tradeRevisionNumber:4,carrierParticipantSequence:1,
  originCode:'CN-SYNTHETIC-ORIGIN',destinationCode:'CN-SYNTHETIC-DESTINATION',plannedDepartureDate:'2026-11-01',plannedArrivalDate:'2026-11-03',
  allocations:[{goodsItemSequence:1,quantity:'40.000000',unitCode:'PCS',amount:'4000.00',currencyCode:'CNY'}],
  legs:[{sequence:1,modeCode:3,originCode:'CN-SYNTHETIC-ORIGIN',destinationCode:'CN-SYNTHETIC-DESTINATION',
    plannedDepartureAt:'2026-11-01T01:00:00.123Z',plannedArrivalAt:'2026-11-03T01:00:00.123Z'}]};
const evidence={kind:'EVIDENCE_KIND_READINESS',planRevision:'1',legSequence:1,occurredAt:'2026-10-30T01:00:00.123Z',
  sourceReference:'SYNTHETIC-READINESS-001',files:[file],statement:'原创合成备货声明，不证明已订舱、放行或签收'};
const claim={submissionId:submission,shipmentNumber:shipment,content:evidence,state:'pending_review'};
const tag='"s3-plan-1-accept-1"',receipt={shipmentNumber:shipment,status:'SHIPMENT_STATUS_PLANNED',planRevision:'1',etag:tag,acceptanceId:'S3-SYNTHETIC-ACCEPTANCE'};
const resource={shipmentNumber:shipment,tradeNumber:trade,status:'SHIPMENT_STATUS_PLANNED',plan,planRevision:'1',etag:tag,evidence:[claim]};
const input={'create-shipment':plan,'plan-replace':{...plan,plannedArrivalDate:'2026-11-04'},
  'evidence-create':evidence,'evidence-review':{submissionId:submission,outcome:'DECISION_OUTCOME_RETURN',reason:'合成例无有效业务证明，退回补正，不推进物流状态',verificationEvidence:[]},
  'exception-resolve':{exceptionEventNumber:'S3-SYNTHETIC-EXCEPTION',reason:'结构设计例，真实处置须核实外部证据',evidence:[file],finalFailure:false},
  'shipment-cancel':{reason:'仅设计：未执行计划的授权取消',evidence:[file]}};
const responses={'create-shipment':receipt,'shipment-read':resource,'plan-replace':{...receipt,planRevision:'2',etag:'"s3-plan-2-accept-2"'},
  'evidence-create':claim,'evidence-read':{...claim,state:'rejected',reviewResult:{outcome:'DECISION_OUTCOME_RETURN',
    reason:'合成材料无有效商业证明，补齐本批三单后另建提交并关联旧提交',reviewedAt:'2026-10-30T02:00:00.123Z',
    reviewerReference:'SYNTHETIC-INDEPENDENT-REVIEWER',verificationEvidence:[]}},
  'shipment-context':{shipment:resource,missingGateCodes:['LOGISTICS_GATE_MISSING','CLEARANCE_REQUIRED'],openExceptionIds:[]},
  'evidence-review':{...receipt,etag:'"s3-plan-1-accept-3"'},'exception-resolve':{...receipt,status:'SHIPMENT_STATUS_BOOKED'},
  'shipment-cancel':{...receipt,status:'SHIPMENT_STATUS_CANCELLED'}};
const params={trade_number:trade,shipment_number:shipment,submission_id:submission};
const locations={'create-shipment':'/api/v1/shipments/'+shipment,'evidence-create':'/api/v1/shipments/'+shipment+'/evidence-submissions/'+submission,
  'evidence-review':'/internal/v1/shipments/'+shipment+'/evidence-decisions/S3-SYNTHETIC-EVIDENCE-REVIEW',
  'exception-resolve':'/internal/v1/shipments/'+shipment+'/exception-dispositions/S3-SYNTHETIC-EXCEPTION-RESOLVE',
  'shipment-cancel':'/internal/v1/shipments/'+shipment+'/cancellation-decisions/S3-SYNTHETIC-SHIPMENT-CANCEL'};
const examples=model.endpoints.map((endpoint,index)=>{
  const request={method:endpoint.method,path:endpoint.path.replace(/\{([^}]+)\}/g,(_,key)=>params[key]),headers:{Authorization:'<INVALID-SYNTHETIC-'+(endpoint.audience==='内部运营'?'INTERNAL':'EXTERNAL')+'-CREDENTIAL>'}};
  if(endpoint.body){
    Object.assign(request.headers,{'Content-Type':'application/json','Idempotency-Key':'d7030000-0000-4000-8000-'+String(index+1).padStart(12,'0'),
      'If-Match':endpoint.id==='create-shipment'?'"s3-trade-approved-4-accept-1"':tag,'X-Confirmation-Id':'<INVALID-SYNTHETIC-CONFIRMATION>'});
    request.body=input[endpoint.id];
  }
  const response={status:Number(endpoint.status),headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:responses[endpoint.id]};
  if(response.body.acceptanceId)response.body={...response.body,acceptanceId:'S3-SYNTHETIC-'+endpoint.id.toUpperCase()};
  if(endpoint.method==='POST')response.headers.Location=locations[endpoint.id];
  if(response.body.etag)response.headers.ETag=response.body.etag;
  return transport.enrich({request,response},endpoint);
});
const rpc=examples.map((example,index)=>transport.rpc(example,model.endpoints[index],'trade.logistics.v1'));
artifacts['doc/examples/step3/material.html']=material;
artifacts['doc/examples/step3/http-contract.json']=pretty(model.endpoints);
artifacts['doc/examples/step3/http-examples.json']=pretty(examples);
artifacts['doc/examples/step3/rpc-examples.json']=pretty(rpc);
artifacts['doc/examples/step3/entity-projection.json']=pretty({designOnly:true,source:'权威物流四表，不新增核心列',
  snapshot:{number:plan.approvedSnapshotNumber,reason:2,tradeRevision:4,goods:[{sequence:1,quantity:'100.000000',amount:'10000.00',currency:'CNY',unit:'PCS'}]},
  plan,receipt,file,fieldMapping:{shipment:'logistics_shipment_tab',allocations:'logistics_shipment_item_tab',legs:'logistics_transport_leg_tab',
    verifiedFacts:'logistics_event_tab',planRevision:'同库受理序号/不可变计划封套',pendingEvidence:'不可变中间件提交及独立审核决定'}});
artifacts['doc/examples/step3/http-reference.md']='# 步骤三HTTP/RPC响应与cURL\n\n仅设计，无已部署API或真实凭证。每组是独立合成输入，不可当作业务成功事实。\n\n'+examples.map((e,i)=>
  '## '+e.rpc+'\n\n`'+e.request.method+' '+e.request.path+'`\n\n客户端/应用预算：'+e.timeoutMs+'/'+model.endpoints[i].timeout.serverMs+'毫秒。\n\n```http\n'+e.httpResponse+'\n```\n\n```bash\n'+e.curl+'\n```\n\n```json\n'+pretty(rpc[i])+'```\n').join('\n');
for(const useCase of model.useCases)for(const [kind,source]of [['system',useCase.systemSequence],['implementation',useCase.sequence]])
  artifacts['doc/examples/step3/'+useCase.id+'-'+kind+'.mmd']=source+'\n';
for(const name of ['proto/trade/logistics/v1/logistics.proto','doc/步骤三系统用例与接口协议.md'])artifacts[name]=fs.readFileSync(path.join(root,name),'utf8');
const output='交付成果/assets/step-three-usecases-artifacts.js';
const files={...artifacts,[output]:"'use strict';\nglobalThis.EXPORT_STEP_THREE_ARTIFACTS="+pretty(artifacts).trim()+";\n"};
for(const [name,source]of Object.entries(files)){
  const target=path.join(root,name);
  if(process.argv.includes('--check'))assert.equal(fs.readFileSync(target,'utf8'),source,'Stale artifact: '+name);
  else{fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,source);}
}
console.log('Step three: '+model.useCases.length+' use cases / '+model.useCases.length*2+' diagrams / '+examples.length+' explicit HTTP/RPC examples; '+Object.keys(files).length+' artifacts consistent.');
