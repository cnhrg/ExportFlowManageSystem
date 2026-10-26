'use strict';
// Local transaction test harness only, not an API implementation.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../../..'),m=require(path.join(root,'交付成果/assets/system-usecases-model.js'));
const hash=value=>crypto.createHash('sha256').update(value).digest('hex'),q=value=>"'"+String(value).replace(/'/g,"''")+"'";
const key=fs.readFileSync(process.env.STEP1_HMAC_KEY_FILE||path.join(os.homedir(),'Library/ExportTradeStep1Demo/fixture.key'));
const hmac=value=>crypto.createHmac('sha256',key).update(m.canonical(value)).digest('hex');
let semanticChecks=0;
function reject(kind,change,code){
  const value=m.clone(kind==='payer'?m.payerFiling:m.supplierFiling);change(value);
  const errors=m.validate(value,kind);assert.ok(errors.some(error=>error.code===code),JSON.stringify(errors));semanticChecks++;
}
assert.deepEqual(m.validate(m.supplierFiling),[]);semanticChecks++;
assert.deepEqual(m.validate(m.payerFiling,'payer'),[]);semanticChecks++;
reject('supplier',x=>x.goods[0].unitPrice.currencyCode='USD','CURRENCY_NOT_SUPPORTED');
reject('supplier',x=>x.materials.pop(),'REQUIRED_MATERIAL');
reject('supplier',x=>x.goods[0].quantity='1e2','INVALID_QUANTITY');
reject('supplier',x=>x.goods[0].quantity='0.0000001','INVALID_QUANTITY');
reject('supplier',x=>x.goods[0].total.amount=12500,'INVALID_AMOUNT');
reject('supplier',x=>x.invoiceTotal.amount='12500.01','DOCUMENT_INCONSISTENT');
reject('supplier',x=>x.packing[0].grossWeightKg='99.000','INVALID_PACKING');
reject('supplier',x=>x.materials[0].revisionNumber=2,'FILE_NOT_READY');
reject('supplier',x=>x.materials[0].workbookSheet='conflicting locator','FILE_NOT_READY');
reject('supplier',x=>x.actorId='FORGED','UNKNOWN_FIELD');
reject('supplier',x=>x.sourceContentsConfirmed=false,'CONFIRMATION_REQUIRED');
reject('payer',x=>x.relationship='PAYER_RELATIONSHIP_OTHER','REQUIRED_EVIDENCE');
reject('payer',x=>x.payer.identityProtectedReference='DIFFERENT','IDENTITY_MISMATCH');
reject('payer',x=>x.supplier={forged:true},'UNKNOWN_FIELD');
reject('payer',x=>x.paymentPurpose='','REQUIRED');
const half=m.clone(m.supplierFiling);half.goods[0].quantity='0.5';half.packing[0].quantity='0.5';
half.goods[0].unitPrice.amount='0.01';half.goods[0].total.amount='0.01';half.contractTotal.amount=half.invoiceTotal.amount='0.01';
assert.deepEqual(m.validate(half),[]);semanticChecks++;
const material=fs.readFileSync(path.join(root,m.file.path));
assert.equal(hash(material),m.file.sha256);assert.equal(String(material.length),m.file.sizeBytes);
for(const ref of m.supplierFiling.materials)assert.ok(material.toString().includes('id="'+ref.htmlAnchor+'"'));
assert.equal(hash(fs.readFileSync(path.join(root,'材料/步骤一-发票箱单:合同等案例.xls'))),'1ae466a0eeaf09feb0064125d541a55660aab47e92a63413683931fe6340419a');
if(process.argv.includes('--semantic-only')){console.log(JSON.stringify({semanticChecks,originalWorkbookUnchanged:true}));process.exit(0);}
const database='trade_step1_supplier_payer_46c455d0';
const args=['--defaults-file='+(process.env.STEP1_MYSQL_CONFIG||path.join(os.homedir(),'Library/ExportTradeStep1Demo/client.cnf')),'--default-character-set=utf8mb4','--batch','--raw','--skip-column-names','--database='+database];
function sql(text,expected){
  const result=spawnSync(process.env.STEP1_MYSQL||'/opt/homebrew/opt/mysql@8.4/bin/mysql',args,{input:"SET time_zone='+00:00';\n"+text,encoding:'utf8',maxBuffer:8*1024*1024});
  if(result.error)throw result.error;
  if(expected){assert.notEqual(result.status,0);assert.match(result.stderr,expected);return;}
  assert.equal(result.status,0,result.stderr);return result.stdout.trim();
}
const assertions=sql(fs.readFileSync(path.join(__dirname,'assertions.sql'),'utf8')).split('\n').map(JSON.parse);
assertions.forEach(item=>assert.equal(item.ok,1,item.check));
assert.equal(sql('SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE();'),'74');
const examples=JSON.parse(fs.readFileSync(path.join(root,'doc/examples/step1/http-examples.json')));
for(const example of examples.filter(item=>item.useCase)){
  const request=example.request,actor=example.useCase.startsWith('supplier')?'DEMO-SUPPLIER-USER':'DEMO-PAYER-USER';
  const event='S1'+hash(JSON.stringify([actor,m.request.tradeNumber,request.headers['Idempotency-Key']])).slice(0,38);
  const payload=JSON.parse(sql('SELECT event_payload FROM trade_event_tab WHERE event_number='+q(event)+';'));
  assert.equal(payload.request_hash,hmac({method:request.method,path:request.path,ifMatch:request.headers['If-Match']||'',body:request.body}));
  assert.deepEqual(payload.accepted_representation,example.response.body);
  if(example.useCase==='supplier-submit')assert.equal(sql('SELECT creation_payload_hmac FROM trade_record_tab;'),payload.request_hash);
}
const snapshot=()=>sql("SELECT JSON_OBJECT('trade',(SELECT JSON_ARRAYAGG(JSON_OBJECT('revision',revision_number,'version',version,'goods',transaction_goods_items_json,'sources',transaction_filing_source_and_version_json)) FROM trade_record_tab),'parties',(SELECT JSON_ARRAYAGG(JSON_OBJECT('role',party_role_code,'name',contact_name,'info',participant_information_json)) FROM trade_participater_tab),'events',(SELECT JSON_ARRAYAGG(event_payload) FROM trade_event_tab));");
const before=snapshot();
sql("START TRANSACTION;UPDATE trade_record_tab SET transaction_goods_items_json=JSON_SET(transaction_goods_items_json,'$[0].currency_code','USD');COMMIT;",/ck_goods_cny|3819/);
const proc='demo_s1_http_guard_46c455d0';
assert.equal(sql(`SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema=DATABASE() AND routine_name=${q(proc)};`),'0','Do not overwrite an existing routine');
let created=false;
try{
  sql(`DELIMITER //
CREATE PROCEDURE ${proc}(IN p_actor VARCHAR(64),IN p_event VARCHAR(40),IN p_key VARCHAR(128),IN p_hash CHAR(64),IN p_role INT,IN p_match VARCHAR(256),IN p_create BOOLEAN,IN p_authorized BOOLEAN,IN p_atomic BOOLEAN)
BEGIN
  DECLARE v_id BIGINT UNSIGNED; DECLARE v_revision INT; DECLARE v_status INT; DECLARE v_count INT;
  DECLARE v_hash CHAR(64); DECLARE v_actor VARCHAR(64); DECLARE v_key VARCHAR(128);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
  IF NOT p_authorized THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='ACCESS_DENIED'; END IF;
  START TRANSACTION;
  IF p_atomic THEN
    INSERT INTO trade_record_tab (trade_number,trade_status_code,revision_number,approved_revision_number,transaction_goods_items_json,transaction_filing_document_references_json,transaction_filing_source_and_version_json,transaction_filing_missing_information_json,creation_payload_hmac,creation_payload_hmac_key_version,created_by,created_at,updated_by,updated_at,version)
    SELECT 'TEST-ATOMIC-ROLLBACK-ONLY',2,1,0,transaction_goods_items_json,'[]','[]','[]',creation_payload_hmac,creation_payload_hmac_key_version,'DEMO-SUPPLIER-USER',UTC_TIMESTAMP(3),'DEMO-SUPPLIER-USER',UTC_TIMESTAMP(3),1 FROM trade_record_tab WHERE trade_number='TRD-S1-DEMO-001';
    SET v_id=LAST_INSERT_ID();
    INSERT INTO trade_participater_tab (trade_record_id,party_role_code,participant_sequence_number,legal_name,identity_type_code,identity_number_cipher,country_code,registered_address,contact_name,contact_phone,contact_email,participant_information_json,created_by,created_at,updated_by,updated_at)
    SELECT v_id,1,1,legal_name,identity_type_code,identity_number_cipher,country_code,registered_address,contact_name,contact_phone,contact_email,participant_information_json,'DEMO-SUPPLIER-USER',UTC_TIMESTAMP(3),'DEMO-SUPPLIER-USER',UTC_TIMESTAMP(3) FROM trade_participater_tab WHERE party_role_code=1;
    INSERT INTO trade_event_tab (event_number,trade_record_id,revision_number,event_type_code,from_trade_status_code,to_trade_status_code,actor_reference,reason_code,reason_text,event_payload,trace_id,occurred_at,created_at)
    VALUES('TEST-ATOMIC-EVENT',v_id,1,1,NULL,NULL,p_actor,0,'ROLLBACK ONLY',JSON_OBJECT('payload_schema_version',1),'TEST',UTC_TIMESTAMP(3),UTC_TIMESTAMP(3));
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='INJECTED_ATOMIC_FAILURE';
  END IF;
  SELECT id,revision_number,trade_status_code INTO v_id,v_revision,v_status FROM trade_record_tab WHERE trade_number='TRD-S1-DEMO-001' FOR UPDATE;
  SELECT COUNT(*) INTO v_count FROM trade_event_tab WHERE event_number=p_event;
  IF v_count>0 THEN
    SELECT JSON_UNQUOTE(JSON_EXTRACT(event_payload,'$.request_hash')),actor_reference,JSON_UNQUOTE(JSON_EXTRACT(event_payload,'$.request_id')) INTO v_hash,v_actor,v_key FROM trade_event_tab WHERE event_number=p_event;
    IF v_hash<>p_hash OR v_actor<>p_actor OR v_key<>p_key THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='IDEMPOTENCY_CONFLICT'; END IF;
    COMMIT;
    SELECT JSON_EXTRACT(event_payload,'$.accepted_representation') FROM trade_event_tab WHERE event_number=p_event;
  ELSE
    IF v_status<>2 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='TRADE_NOT_EDITABLE'; END IF;
    IF p_create AND EXISTS(SELECT 1 FROM trade_participater_tab WHERE trade_record_id=v_id AND party_role_code=p_role) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='FILING_ALREADY_EXISTS'; END IF;
    IF NOT p_create AND p_match='' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='IF_MATCH_REQUIRED'; END IF;
    IF NOT p_create AND p_match<>CONCAT('"s1-',IF(p_role=1,'supplier','payer'),'-TRD-S1-DEMO-001-r',v_revision,'"') THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='REVISION_CONFLICT'; END IF;
    UPDATE trade_record_tab SET revision_number=revision_number+1,version=version+1 WHERE id=v_id;
    UPDATE trade_participater_tab SET contact_name='SHOULD-ROLL-BACK' WHERE trade_record_id=v_id AND party_role_code=p_role;
    INSERT INTO trade_event_tab (event_number,trade_record_id,revision_number,event_type_code,from_trade_status_code,to_trade_status_code,actor_reference,reason_code,reason_text,event_payload,trace_id,occurred_at,created_at)
    VALUES(p_event,v_id,v_revision+1,3,NULL,NULL,p_actor,0,'ROLLBACK ONLY',JSON_OBJECT('payload_schema_version',3),'TEST',UTC_TIMESTAMP(3),UTC_TIMESTAMP(3));
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='INJECTED_WRITE_FAILURE';
  END IF;
END//
DELIMITER ;`);created=true;
  const accepted=examples.find(item=>item.useCase==='supplier-edit'),request=accepted.request;
  const actor='DEMO-SUPPLIER-USER',oldKey=request.headers['Idempotency-Key'];
  const oldEvent='S1'+hash(JSON.stringify([actor,m.request.tradeNumber,oldKey])).slice(0,38);
  const digest=hmac({method:request.method,path:request.path,ifMatch:request.headers['If-Match'],body:request.body});
  const call=(event,key,digest,match,{role=1,create=false,authorized=true,atomic=false}={})=>`CALL ${proc}(${q(role===1?actor:'DEMO-PAYER-USER')},${q(event)},${q(key)},${q(digest)},${role},${q(match)},${create?1:0},${authorized?1:0},${atomic?1:0});`;
  assert.deepEqual(JSON.parse(sql(call(oldEvent,oldKey,digest,request.headers['If-Match']))),accepted.response.body,'Replay must precede current revision check');
  sql(call(oldEvent,oldKey,hash('changed'),request.headers['If-Match']),/IDEMPOTENCY_CONFLICT/);
  sql(call(oldEvent,oldKey,digest,request.headers['If-Match'],{authorized:false}),/ACCESS_DENIED/);
  sql(call('TEST-NEW-EVENT','new-key',hash('new'),''),/IF_MATCH_REQUIRED/);
  sql(call('TEST-NEW-EVENT','new-key',hash('new'),'"s1-supplier-TRD-S1-DEMO-001-r3"'),/REVISION_CONFLICT/);
  sql(call('TEST-NEW-EVENT','new-key',hash('new'),'',{role:4,create:true}),/FILING_ALREADY_EXISTS/);
  sql(call('TEST-NEW-EVENT','new-key',hash('new'),'"s1-supplier-TRD-S1-DEMO-001-r4"'),/INJECTED_WRITE_FAILURE/);
  sql(call('TEST-NEW-EVENT','new-key',hash('new'),'',{atomic:true}),/INJECTED_ATOMIC_FAILURE/);
  assert.equal(sql("SELECT COUNT(*) FROM trade_record_tab WHERE trade_number='TEST-ATOMIC-ROLLBACK-ONLY';"),'0');
  assert.equal(sql("SELECT COUNT(*) FROM trade_participater_tab;"),'6');
  assert.equal(sql("SELECT COUNT(*) FROM trade_event_tab WHERE event_number LIKE 'TEST-%';"),'0');
}finally{if(created)sql('DROP PROCEDURE '+proc+';');}
assert.equal(snapshot(),before,'Verifier changed persistent business data');
const result={semanticChecks,sqlAssertions:assertions.length,columns:74,revision:4,participants:6,events:5,snapshots:0,originalWorkbookUnchanged:true,atomicCreationRollback:true,putPartialWriteRollback:true,replayBeforeIfMatch:true,missingAndStaleTagsRejected:true,sameKeyDifferentPayloadRejected:true,payerDuplicateCreationRejected:true,database,mysqlVersion:sql('SELECT VERSION();')};
if(process.env.STEP1_RESULT_FILE)fs.writeFileSync(process.env.STEP1_RESULT_FILE,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
