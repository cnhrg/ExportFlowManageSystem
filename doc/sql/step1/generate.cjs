'use strict';
// Generates synthetic design fixtures; it does not execute HTTP or cloud operations.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),os=require('node:os');
const root=path.resolve(__dirname,'../../..'),m=require(path.join(root,'交付成果/assets/system-usecases-model.js'));
const transport=require('../transport-examples.cjs');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const q=value=>"'"+String(value).replace(/'/g,"''")+"'";
const json=value=>"CONVERT(X'"+Buffer.from(JSON.stringify(value)).toString('hex')+"' USING utf8mb4)";
const pretty=value=>JSON.stringify(value,null,2)+'\n';
const material=fs.readFileSync(path.join(root,m.file.path));
assert.equal(hash(material),m.file.sha256);assert.equal(String(material.length),m.file.sizeBytes);
const key=fs.readFileSync(process.env.STEP1_HMAC_KEY_FILE||path.join(os.homedir(),'Library/ExportTradeStep1Demo/fixture.key'));
assert.ok(key.length>=32);
const hmac=value=>crypto.createHmac('sha256',key).update(m.canonical(value)).digest('hex');
const trade=m.request.tradeNumber,base='/api/v1/trades/'+trade,supplier='DEMO-SUPPLIER-USER',payer='DEMO-PAYER-USER';
const tag=(kind,revision)=>'"s1-'+kind+'-'+trade+'-r'+revision+'"';
const supplierReplacement=m.clone(m.supplierFiling);supplierReplacement.consignee.deliveryArrangements='供应商修改后的合成送货安排';
const payerReplacement=m.clone(m.payerFiling);payerReplacement.paymentPurpose='付款方修改后的合成付款说明';
assert.deepEqual(m.validate(m.supplierFiling),[]);assert.deepEqual(m.validate(supplierReplacement),[]);
assert.deepEqual(m.validate(m.payerFiling,'payer'),[]);assert.deepEqual(m.validate(payerReplacement,'payer'),[]);
const createResult={tradeNumber:trade,revisionNumber:1,lifecycle:'editing',supplierFilingUri:base+'/supplier-filing',etag:tag('trade',1)};
const accepted=(role,revision)=>role===1?{tradeNumber:trade,revisionNumber:revision,etag:tag('supplier',revision)}:{tradeNumber:trade,payerFilingId:'primary',revisionNumber:revision,etag:tag('payer',revision)};
const commands=[
  {id:'supplier-submit',actor:supplier,role:1,revision:1,key:trade,method:'POST',path:'/api/v1/trades',ifMatch:'',body:m.request,response:createResult,status:201,location:base},
  {id:'payer-submit',actor:payer,role:4,revision:2,key:'ea8cf811-f9fb-48dd-a9b1-8f47a5444202',method:'POST',path:base+'/payer-filings',ifMatch:'',body:m.payerFiling,response:accepted(4,2),status:201,location:base+'/payer-filings/primary'},
  {id:'supplier-edit',actor:supplier,role:1,revision:3,key:'ea8cf811-f9fb-48dd-a9b1-8f47a5444203',method:'PUT',path:base+'/supplier-filing',ifMatch:tag('supplier',2),body:supplierReplacement,response:accepted(1,3),status:200},
  {id:'payer-edit',actor:payer,role:4,revision:4,key:'ea8cf811-f9fb-48dd-a9b1-8f47a5444204',method:'PUT',path:base+'/payer-filings/primary',ifMatch:tag('payer',3),body:payerReplacement,response:accepted(4,4),status:200}
  // Mutation responses intentionally omit private content; GET returns current content.
];
const refs=filing=>(filing.materials||filing.relationshipEvidence||[]).map(ref=>({
  document_purpose_code:{MATERIAL_PURPOSE_SALES_CONTRACT:1,MATERIAL_PURPOSE_COMMERCIAL_INVOICE:2,MATERIAL_PURPOSE_PACKING_LIST:3,MATERIAL_PURPOSE_RELATIONSHIP_EVIDENCE:6}[ref.purpose],
  logical_file_number:ref.logicalFileNumber,revision_number:ref.revisionNumber,content_digest:ref.sha256,
  ...(ref.htmlAnchor?{material_locator:{html_anchor:ref.htmlAnchor}}:ref.workbookSheet?{material_locator:{workbook_sheet:ref.workbookSheet}}:{})
}));
const goods=m.supplierFiling.goods.map(g=>({
  item_sequence_number:g.itemSequenceNumber,product_name:g.productName,specification:g.specification,quantity:g.quantity,unit_code:g.unitCode,
  unit_price_amount:g.unitPrice.amount,amount:g.total.amount,currency_code:'CNY',origin_country_code:g.originCountryCode,
  packing:{cartons:10,net_weight_kg:'100.000',gross_weight_kg:'120.000'}
}));
const time=revision=>'2026-10-25 08:'+String(20+revision*5).padStart(2,'0')+':00.000';
const utc=revision=>time(revision).replace(' ','T')+'Z';
const participant=(role,party,info,actor,revision)=>{
  const cipher=Buffer.from('DEMO-FIXTURE-NOT-ENCRYPTED:'+party.identityProtectedReference).toString('hex');
  return `INSERT INTO trade_participater_tab
  (trade_record_id,party_role_code,participant_sequence_number,legal_name,identity_type_code,identity_number_cipher,country_code,registered_address,contact_name,contact_phone,contact_email,participant_information_json,created_by,created_at,updated_by,updated_at)
  SELECT id,${role},1,${q(party.legalName)},1,X'${cipher}',${q(party.countryCode)},${q(party.registeredAddress)},${q(party.contactName)},${q(party.contactPhone)},${q(party.contactEmail)},${json(info)},${q(actor)},${q(time(revision))},${q(actor)},${q(time(revision))} FROM trade_record_tab WHERE trade_number=${q(trade)};`;
};
const supplierInfo={
  business_registration_reference:m.supplierFiling.supplier.identityProtectedReference,
  sales_document_numbers:[{document_type_code:1,document_number:'SC-DEMO-001',document_amount:'12500.00',currency_code:'CNY'},{document_type_code:2,document_number:'CI-DEMO-001',document_amount:'12500.00',currency_code:'CNY'},{document_type_code:3,document_number:'PL-DEMO-001'}]
};
const consigneeInfo=filing=>({delivery_address:filing.consignee.deliveryAddress,delivery_arrangements:filing.consignee.deliveryArrangements});
const payerInfo=filing=>({payer_relationship_code:1,payment_purpose:filing.paymentPurpose,relationship_evidence_references:[],payment_confirmations:[]});
const supplierPaths=['transaction_goods_items_json','participant[1,1]','participant[2,1]','participant[3,1]','participant[5,1]','participant[6,1]','nominated_payer_protected_reference'];
const sources=(supplierRevision,payerRevision)=>[
  ...supplierPaths.map(field_path=>({field_path,source_type_code:2,source_reference:field_path==='nominated_payer_protected_reference'?m.supplierFiling.nominatedPayerProtectedReference:'SYNTHETIC-SUPPLIER-DECLARATION',source_version:String(supplierRevision),participant_role_code:1,participant_sequence_number:1,collected_at:utc(supplierRevision)})),
  ...m.supplierFiling.materials.map((ref,i)=>({field_path:['supplier.sales_contract','supplier.commercial_invoice','goods.packing'][i],source_type_code:1,source_reference:m.file.logicalFileNumber+'#'+ref.htmlAnchor,source_version:'1',participant_role_code:1,participant_sequence_number:1,collected_at:utc(1)})),
  ...(payerRevision?[{field_path:'participant[4,1]',source_type_code:2,source_reference:'SYNTHETIC-PAYER-DECLARATION',source_version:String(payerRevision),participant_role_code:4,participant_sequence_number:1,collected_at:utc(payerRevision)}]:[])
];
const missing=[
  ['participant[2,1].receipt_path','participant[2,1].payment_path','participant[2,1].payment_branch_code'],
  ['participant[5,1].port','participant[5,1].transport_mode_code','participant[5,1].route'],
  ['participant[6,1].customs_qualification_reference'],
  ['participant[6,1].quotation_reference','participant[6,1].quoted_amount','participant[6,1].pricing_basis','participant[6,1].currency_code']
].map((field_paths,index)=>({missing_item_number:'MISS-S1-'+(index+1),field_paths,document_purpose_codes:[],requested_at:utc(1),reason_code:1,reason_text:'合成示例未提供；供应商后续收集，不视为整单齐备',participant_role_code:1}));
for(const command of commands){
  command.eventNumber='S1'+hash(JSON.stringify([command.actor,trade,command.key])).slice(0,38);
  command.requestHash=hmac({method:command.method,path:command.path,ifMatch:command.ifMatch,body:command.body});
  command.payload={
    payload_schema_version:3,party_role_code:command.role,participant_sequence_number:1,
    field_paths:command.role===1?supplierPaths:['participant[4,1]'],document_references:refs(command.role===1?m.supplierFiling:m.payerFiling),
    request_id:command.key,request_hash:command.requestHash,request_hash_key_version:'LOCAL-DEMO-1',canonicalization_version:'S1-HTTP-C14N-2',
    http_method:command.method,resource_path:command.path,if_match:command.ifMatch,source_contents_confirmed:true,
    accepted_representation:command.response
  };
}
const event=command=>`INSERT INTO trade_event_tab
  (event_number,trade_record_id,revision_number,event_type_code,from_trade_status_code,to_trade_status_code,actor_reference,reason_code,reason_text,event_payload,trace_id,occurred_at,created_at)
  SELECT ${q(command.eventNumber)},id,${command.revision},3,NULL,NULL,${q(command.actor)},0,${q(command.id)},${json(command.payload)},${q('TRACE-'+command.id)},${q(time(command.revision))},${q(time(command.revision))}
  FROM trade_record_tab WHERE trade_number=${q(trade)};`;
const seed=[
  '-- GENERATED synthetic four-use-case fixture. Guards are specified in HTTP contract; this is not a production command handler.',
  '-- No DROP/TRUNCATE/upsert. A second import must fail rather than overwrite history.',
  'USE trade_step1_supplier_payer_46c455d0;', "SET time_zone='+00:00';", 'SET NAMES utf8mb4;',
  '-- File metadata describes real local synthetic bytes, not an asserted successful remote upload.',
  'START TRANSACTION;',
  `SELECT id FROM document_file_tab WHERE logical_file_number=${q(m.file.logicalFileNumber)} AND revision_number=1 FOR UPDATE;`,
  `INSERT INTO document_file_tab (logical_file_number,revision_number,revision_status_code,display_name,document_type_code,storage_path,sha256,size_bytes,media_type,supersedes_file_id,access_scope_json,created_by,created_at,updated_by,updated_at)
  VALUES (${q(m.file.logicalFileNumber)},1,2,'Synthetic CNY material bundle',17,${q(m.file.path)},${q(m.file.sha256)},${m.file.sizeBytes},'text/html',NULL,${json({organization_references:['DEMO-SUPPLIER-ORG'],participant_role_codes:[1],allowed_action_codes:['read'],expires_at:null})},${q(supplier)},${q(time(1))},${q(supplier)},${q(time(1))});`,
  'COMMIT;',
  '-- Supplier first submission atomically creates trade and all supplier-collected information.',
  '-- Fixture requires absent trade. Production first locks the middleware reservation and branches on this current read; see reliability design.',
  'START TRANSACTION;',
  `SELECT id,creation_payload_hmac FROM trade_record_tab WHERE trade_number=${q(trade)} FOR UPDATE;`,
  `INSERT INTO trade_record_tab
  (trade_number,trade_status_code,revision_number,approved_revision_number,transaction_goods_items_json,transaction_filing_document_references_json,transaction_filing_source_and_version_json,transaction_filing_missing_information_json,creation_payload_hmac,creation_payload_hmac_key_version,created_by,created_at,updated_by,updated_at,version)
  VALUES (${q(trade)},2,1,0,${json(goods)},${json(refs(m.supplierFiling))},${json(sources(1))},${json(missing)},${q(commands[0].requestHash)},'LOCAL-DEMO-1',${q(supplier)},${q(time(1))},${q(supplier)},${q(time(1))},1);`,
  participant(1,m.supplierFiling.supplier,supplierInfo,supplier,1),
  participant(2,m.supplierFiling.exportAgent.party,{agency_scope:m.supplierFiling.exportAgent.serviceScope,agency_instructions:m.supplierFiling.exportAgent.agreedInstructions,currency_code:'CNY'},supplier,1),
  participant(3,m.supplierFiling.consignee.party,consigneeInfo(m.supplierFiling),supplier,1),
  participant(5,m.supplierFiling.logisticsProvider.party,{service_scope:m.supplierFiling.logisticsProvider.serviceScope,agreed_instructions:m.supplierFiling.logisticsProvider.agreedInstructions},supplier,1),
  participant(6,m.supplierFiling.customsBroker.party,{service_scope:m.supplierFiling.customsBroker.serviceScope,agreed_instructions:m.supplierFiling.customsBroker.agreedInstructions},supplier,1),
  `INSERT INTO trade_event_tab (event_number,trade_record_id,revision_number,event_type_code,from_trade_status_code,to_trade_status_code,actor_reference,reason_code,reason_text,event_payload,trace_id,occurred_at,created_at)
  SELECT 'EVT-S1-SUPPLIER-CREATED',id,1,1,NULL,NULL,${q(supplier)},0,'Supplier atomic creation',${json({payload_schema_version:1,source_reference:m.request.reservationId,accepted_representation:createResult})},'TRACE-CREATE',${q(time(1))},${q(time(1))} FROM trade_record_tab WHERE trade_number=${q(trade)};`,
  event(commands[0]),'COMMIT;'
];
for(const command of commands.slice(1)){
  seed.push('START TRANSACTION;',`SELECT id FROM trade_record_tab WHERE trade_number=${q(trade)} FOR UPDATE;`,
    `SELECT event_number,event_payload FROM trade_event_tab WHERE event_number=${q(command.eventNumber)};`);
  if(command.id==='payer-submit')seed.push(participant(4,m.payerFiling.payer,payerInfo(m.payerFiling),payer,2));
  else seed.push(`UPDATE trade_participater_tab SET participant_information_json=${json(command.role===1?consigneeInfo(supplierReplacement):payerInfo(payerReplacement))},updated_by=${q(command.actor)},updated_at=${q(time(command.revision))}
  WHERE trade_record_id=(SELECT id FROM trade_record_tab WHERE trade_number=${q(trade)}) AND party_role_code=${command.role===1?3:4} AND participant_sequence_number=1;`);
  seed.push(`UPDATE trade_record_tab SET revision_number=${command.revision},version=version+1,updated_by=${q(command.actor)},updated_at=${q(time(command.revision))},
  transaction_filing_source_and_version_json=${json(sources(command.revision>=3?3:1,command.revision===4?4:2))}
  WHERE trade_number=${q(trade)} AND trade_status_code=2 AND revision_number=${command.revision-1};`,event(command),'COMMIT;');
}
const checks=[
  ['five_core_tables',"(SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_type='BASE TABLE')=5"],
  ['editing_revision_four',"(SELECT COUNT(*) FROM trade_record_tab WHERE revision_number=4 AND version=4 AND trade_status_code=2 AND approved_revision_number=0)=1"],
  ['six_participants',"(SELECT COUNT(*) FROM trade_participater_tab)=6"],
  ['two_submitters_only',"(SELECT COUNT(*) FROM trade_event_tab WHERE actor_reference NOT IN ('DEMO-SUPPLIER-USER','DEMO-PAYER-USER'))=0"],
  ['supplier_created',"(SELECT COUNT(*) FROM trade_record_tab WHERE created_by='DEMO-SUPPLIER-USER')=1"],
  ['four_submissions',"(SELECT COUNT(*) FROM trade_event_tab WHERE event_type_code=3)=4"],
  ['one_creation',"(SELECT COUNT(*) FROM trade_event_tab WHERE event_type_code=1 AND revision_number=1 AND actor_reference='DEMO-SUPPLIER-USER')=1"],
  ['five_events',"(SELECT COUNT(*) FROM trade_event_tab)=5"],
  ['no_approval_snapshot',"(SELECT COUNT(*) FROM trade_revision_tab)=0"],
  ['actual_local_material',`(SELECT COUNT(*) FROM document_file_tab WHERE sha256=${q(m.file.sha256)} AND size_bytes=${m.file.sizeBytes} AND document_type_code=17 AND revision_status_code=2)=1`],
  ['supplier_edit_persisted',"(SELECT COUNT(*) FROM trade_participater_tab WHERE party_role_code=3 AND JSON_UNQUOTE(JSON_EXTRACT(participant_information_json,'$.delivery_arrangements'))="+q(supplierReplacement.consignee.deliveryArrangements)+")=1"],
  ['payer_edit_persisted',"(SELECT COUNT(*) FROM trade_participater_tab WHERE party_role_code=4 AND JSON_UNQUOTE(JSON_EXTRACT(participant_information_json,'$.payment_purpose'))="+q(payerReplacement.paymentPurpose)+")=1"],
  ['cny_total',"(SELECT SUM(CAST(j.amount AS DECIMAL(20,2))) FROM trade_record_tab t,JSON_TABLE(t.transaction_goods_items_json,'$[*]' COLUMNS(amount VARCHAR(32) PATH '$.amount',currency VARCHAR(3) PATH '$.currency_code')) j WHERE j.currency='CNY')=12500.00"],
  ['confirmed_refs',"(SELECT COUNT(*) FROM trade_record_tab t,JSON_TABLE(t.transaction_filing_document_references_json,'$[*]' COLUMNS(f VARCHAR(40) PATH '$.logical_file_number',v INT PATH '$.revision_number',h VARCHAR(64) PATH '$.content_digest')) r LEFT JOIN document_file_tab d ON d.logical_file_number=r.f AND d.revision_number=r.v AND d.sha256=r.h WHERE d.id IS NULL)=0"],
  ['minimum_receipts',"(SELECT COUNT(*) FROM trade_event_tab WHERE event_type_code=3 AND JSON_EXTRACT(event_payload,'$.accepted_representation') IS NOT NULL AND JSON_EXTRACT(event_payload,'$.accepted_representation.content') IS NULL)=4"],
  ['missing_evidence_visible',"(SELECT JSON_LENGTH(transaction_filing_missing_information_json) FROM trade_record_tab)=4"]
];
const problem=(status,type,pointer,detail)=>({type:'https://api.example.invalid/problems/'+type,title:type,status,detail,instance:'/synthetic/request',errors:[{pointer,code:type,detail}]});
const reservation={reservationId:m.request.reservationId,tradeNumber:trade,createdAt:'2026-10-25T08:00:00Z'};
const upload={uploadId:'UPLOAD-DEMO-001',state:'awaiting_upload',signedUpload:{url:'https://s3.example.invalid/private-staging/UPLOAD-DEMO-001?SIGNATURE-NOT-USABLE',method:'PUT',requiredHeaders:[{name:'Content-Type',value:'text/html'},{name:'x-amz-checksum-sha256',value:Buffer.from(m.file.sha256,'hex').toString('base64')}],expiresAt:'2026-10-25T08:20:00Z'}};
const fileRevision={logicalFileNumber:m.file.logicalFileNumber,revisionNumber:1,purpose:'MATERIAL_PURPOSE_FILING_BUNDLE',sha256:m.file.sha256,sizeBytes:m.file.sizeBytes,referenceEligible:true};
const proof={
  claims:{profile:'S1-PROOF-1',audience:'export-trade-external-demo',subjectReference:supplier,keyReference:'DEMO-SUPPLIER-KEY',certificateReference:'DEMO-CERT-NOT-ISSUED',
    suite:'SIGNATURE_SUITE_RSA_PSS_SHA256',method:'POST',resourcePath:'/api/v1/trades',idempotencyKey:trade,ifMatch:'',
    bodyDigest:hash(m.canonical(m.request)),issuedAt:'2026-10-25T08:24:00.000Z',expiresAt:'2026-10-25T08:29:00.000Z',nonce:'MDEyMzQ1Njc4OWFiY2RlZg'},
  signature:'AA==' // Deliberately invalid synthetic byte, not proof of actual identity.
};
const receiptProof={
  claims:{profile:'S1-RECEIPT-1',audience:supplier,keyReference:'DEMO-PLATFORM-KEY',certificateReference:'DEMO-PLATFORM-CERT-NOT-ISSUED',suite:'SIGNATURE_SUITE_RSA_PSS_SHA256',
    eventNumber:commands[0].eventNumber,requestReference:trade,businessRequestDigest:hash(m.canonical({method:'POST',path:'/api/v1/trades',ifMatch:'',body:m.request})),
    acceptedRepresentationDigest:hash(m.canonical(createResult)),committedAt:utc(1)},
  signature:'AA=='
};
const cases={
  'trade-input.json':m.request,'supplier-filing.json':m.supplierFiling,'payer-filing.json':m.payerFiling,
  'supplier-replacement.json':supplierReplacement,'payer-replacement.json':payerReplacement,
  'reservation-input.json':{purpose:'supplier-trade-filing'},'reservation.json':reservation,
  'file-upload-input.json':{reservationId:reservation.reservationId,purpose:'MATERIAL_PURPOSE_FILING_BUNDLE',displayName:'material-bundle.html',mediaType:'text/html',sizeBytes:m.file.sizeBytes,sha256:m.file.sha256},
  'file-upload.json':upload,'file-confirmation.json':{expectedSha256:m.file.sha256,expectedSizeBytes:m.file.sizeBytes},'file-revision.json':fileRevision,
  'supplier-resource.json':{tradeNumber:trade,content:supplierReplacement,revisionNumber:4,etag:tag('supplier',4)},
  'payer-resource.json':{...accepted(4,4),content:payerReplacement},
  'trade.json':{...createResult,revisionNumber:4,payerFilingUri:base+'/payer-filings/primary',etag:tag('trade',4)},
  'operations-overview.json':{tradeNumber:trade,revisionNumber:4,supplierFilingPresent:true,payerFilingPresent:true,missingInformation:missing.flatMap(item=>item.field_paths.map(field=>({pointer:'/'+field,code:'INFORMATION_NOT_PROVIDED',detail:'供应商后续补充，不视为已批准'}))),etag:tag('overview',4)},
  'usd-input.json':(()=>{const input=m.clone(m.request);input.supplierFiling.goods[0].unitPrice.currencyCode='USD';return input;})(),
  'usd-error.json':problem(422,'CURRENCY_NOT_SUPPORTED','/supplierFiling/goods/0/unitPrice/currencyCode','仅人民币，原USD不换算'),
  'stale-error.json':problem(412,'REVISION_CONFLICT','/headers/If-Match','重新GET本方资源并人工核对后以新键提交'),
  'idempotency-error.json':problem(409,'IDEMPOTENCY_CONFLICT','/headers/Idempotency-Key','原键不能改文或更改原If-Match'),
  'missing-evidence-error.json':problem(422,'REQUIRED_EVIDENCE','/relationshipEvidence','不同主体需实际关系证明'),
  'invocation-proof.json':proof,'receipt-proof.json':receiptProof,
  'rpc-failure.json':{code:'COMMIT_OUTCOME_UNKNOWN',httpStatus:503,errors:[{pointer:'/','code':'COMMIT_OUTCOME_UNKNOWN',detail:'按原业务键恢复，不换号重提'}],retryable:true,retryAfterMs:1000,outcomeUnknown:true,requestReference:trade}
};
cases['operation-intent.json']={method:'POST',resourcePath:'/api/v1/trades',idempotencyKey:trade,ifMatch:'',bodySha256:hash(m.canonical(m.request))};
cases['operation-confirmation.json']={confirmationId:'CONFIRMATION-S1-SYNTHETIC-NOT-VALID',requestDigest:hash(m.canonical(cases['operation-intent.json'])),expiresAt:'2026-10-25T08:29:00.000Z',state:'available'};
cases['commit-unknown-error.json']={...problem(503,'COMMIT_OUTCOME_UNKNOWN','/','提交结果未知，按原键恢复'),outcomeUnknown:true,retryAfterMs:1000};
cases['receipt-pending-error.json']={...problem(503,'RECEIPT_NOT_READY','/','已受理，原签名回执后台恢复中'),outcomeUnknown:false,retryAfterMs:1000};
cases['file-upload-retry.json']={uploadId:'UPLOAD-DEMO-001',state:'retry_wait',attemptCount:2,nextAttemptAt:'2026-10-25T08:24:03.000Z',lastErrorCode:'DEPENDENCY_UNAVAILABLE'};
cases['rpc-error.json']={code:14,message:'COMMIT_OUTCOME_UNKNOWN',details:[{'@type':'type.googleapis.com/trade.filing.v1.RpcFailure',...cases['rpc-failure.json']}]};
for(const command of commands)cases[command.id+'-accepted.json']=command.response;
const httpExamples=[
  {request:{method:'POST',path:'/api/v1/trade-number-reservations',headers:{'Content-Type':'application/json','Idempotency-Key':'ea8cf811-f9fb-48dd-a9b1-8f47a5444200'},body:cases['reservation-input.json']},response:{status:201,headers:{Location:'/api/v1/trade-number-reservations/'+reservation.reservationId,'Cache-Control':'no-store'},body:reservation}},
  {request:{method:'POST',path:'/api/v1/file-uploads',headers:{'Content-Type':'application/json','Idempotency-Key':'ea8cf811-f9fb-48dd-a9b1-8f47a5444210'},body:cases['file-upload-input.json']},response:{status:201,headers:{Location:'/api/v1/file-uploads/'+upload.uploadId,'Cache-Control':'no-store'},body:upload}},
  {request:{method:'POST',path:'/api/v1/file-uploads/'+upload.uploadId+'/files',headers:{'Content-Type':'application/json','Idempotency-Key':'ea8cf811-f9fb-48dd-a9b1-8f47a5444211'},body:cases['file-confirmation.json']},response:{status:201,headers:{Location:'/api/v1/files/'+m.file.logicalFileNumber+'/revisions/1','Cache-Control':'no-store'},body:fileRevision}},
  ...commands.map(command=>({useCase:command.id,request:{method:command.method,path:command.path,headers:{'Content-Type':'application/json','Idempotency-Key':command.key,...(command.ifMatch?{'If-Match':command.ifMatch}:{})},body:command.body},response:{status:command.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',ETag:command.response.etag,...(command.location?{Location:command.location}:{})},body:command.response}}))
];
for(const endpoint of m.endpoints){
  if(httpExamples.some(example=>example.request.method===endpoint.method&&new RegExp('^'+endpoint.path.replace(/\{[^}]+\}/g,'[^/]+')+'$').test(example.request.path)))continue;
  const parameters={trade_number:trade,reservation_id:reservation.reservationId,payer_filing_id:'primary',upload_id:upload.uploadId,file_number:m.file.logicalFileNumber,revision_number:'1',confirmation_id:cases['operation-confirmation.json'].confirmationId};
  const body=endpoint.id==='confirmation'?cases['operation-intent.json']:undefined;
  const responses={reservation,trade:cases['trade.json'],'supplier-read':cases['supplier-resource.json'],'payer-read':cases['payer-resource.json'],'upload-read':upload,'file-read':fileRevision,operations:cases['operations-overview.json'],confirmation:cases['operation-confirmation.json'],'confirmation-read':cases['operation-confirmation.json']};
  const resourcePath=endpoint.path.replace(/\{([^}]+)\}/g,(_,key)=>parameters[key]);
  httpExamples.push({request:{method:endpoint.method,path:resourcePath,headers:{...(body?{'Content-Type':'application/json','Idempotency-Key':'ea8cf811-f9fb-48dd-a9b1-8f47a5444230'}:{})},...(body?{body}:{})},response:{status:Number(endpoint.status),headers:{'Content-Type':'application/json','Cache-Control':'no-store',...(endpoint.method==='POST'?{Location:'/api/v1/operation-confirmations/'+cases['operation-confirmation.json'].confirmationId}:{}),...(responses[endpoint.id].etag?{ETag:responses[endpoint.id].etag}:{})},body:responses[endpoint.id]}});
}
for(const example of httpExamples){
  example.designOnly=true;
  example.request.headers.Authorization='<synthetic credential omitted>';
  example.request.headers.Accept='application/json';
  example.response.headers['Content-Type']='application/json';
  const endpoint=m.endpoints.find(item=>item.method===example.request.method&&new RegExp('^'+item.path.replace(/\{[^}]+\}/g,'[^/]+')+'$').test(example.request.path));
  assert.ok(endpoint,'Unmapped HTTP example');
  if(endpoint.method!=='GET'&&endpoint.id!=='confirmation'){
    example.request.headers['X-Confirmation-Id']='<synthetic per-intent confirmation; NOT-VALID>';
    example.response.headers['X-Receipt-Proof']='<Base64(ReceiptProof); SYNTHETIC-NOT-VALID>';
  }
  transport.enrich(example,endpoint);
}
const rpcExamples=httpExamples.map(example=>{
  const endpoint=m.endpoints.find(item=>item.method===example.request.method&&new RegExp('^'+item.path.replace(/\{[^}]+\}/g,'[^/]+')+'$').test(example.request.path));
  return transport.rpc(example,endpoint,endpoint.audience==='内部运营'?'trade.filing.operations.v1':'trade.filing.v1');
});
cases['rpc-examples.json']=rpcExamples;
cases['http-examples.json']=httpExamples;cases['http-contract.json']=m.endpoints;
cases['transport-policy.json']={timeouts:m.timeouts,errors:m.errors,confirmationProfile:'S1-OPERATION-CONFIRMATION-1',optionalInstitutionSignatureProfile:'S1-PROOF-1',deployments:1,interfaceAudiences:['internal-operations','external-integration']};
const artifacts={};
for(const name of ['proto/trade/filing/v1/filing.proto','proto/trade/filing/v1/operations.proto','doc/sql/step1/schema.sql','doc/sql/step1/README.md','doc/步骤一HTTP接口协议.md','doc/步骤一系统用例与业务规则.md','doc/步骤一身份签名与可靠性设计.md',m.file.path])artifacts[name]=fs.readFileSync(path.join(root,name),'utf8');
artifacts['doc/sql/step1/seed.sql']=seed.join('\n')+'\n';
artifacts['doc/sql/step1/assertions.sql']="-- GENERATED: every ok must equal 1.\nUSE trade_step1_supplier_payer_46c455d0;\nSET time_zone='+00:00';\n"+checks.map(([name,expression])=>`SELECT JSON_OBJECT('check',${q(name)},'ok',IF(${expression},1,0));`).join('\n')+'\n';
for(const [name,value]of Object.entries(cases))artifacts['doc/examples/step1/'+name]=pretty(value);
artifacts['doc/examples/step1/http-reference.md']='# 步骤一HTTP响应与cURL示例\n\n全部为未部署设计，凭证/确认号不可用。curl无自动写重试；真实会话的确认必须匹配同一正文/原键/标签。\n\n'+httpExamples.map(example=>'## '+example.rpc+'\n\n```sh\n'+example.curl+'\n```\n\n```http\n'+example.httpResponse+'\n```\n').join('\n');
for(const useCase of m.useCases){
  artifacts['doc/examples/step1/'+useCase.id+'-sequence.mmd']=useCase.sequence+'\n';
  artifacts['doc/examples/step1/'+useCase.id+'-system-sequence.mmd']=useCase.systemSequence+'\n';
}
artifacts['doc/examples/step1/upload-sequence.mmd']=m.uploadSequence+'\n';
artifacts['doc/examples/step1/number-reservation-sequence.mmd']=m.preorderSequence+'\n';
const generated='/* Generated by doc/sql/step1/generate.cjs; synthetic data only. */\nglobalThis.EXPORT_SYSTEM_USECASES_ARTIFACTS='+JSON.stringify(artifacts,null,2)+';\n';
const outputs={...artifacts,'交付成果/assets/system-usecases-artifacts.js':generated};
for(const [name,text]of Object.entries(outputs)){
  const destination=path.join(root,name);
  if(process.argv.includes('--check'))assert.equal(fs.readFileSync(destination,'utf8'),text,'Artifact drift: '+name);
  else fs.writeFileSync(destination,text);
}
console.log(JSON.stringify({artifacts:Object.keys(outputs).length,useCases:commands.length,endpoints:m.endpoints.length,syntheticFileBytes:material.length}));
module.exports={commands,tag,hmac,trade};
