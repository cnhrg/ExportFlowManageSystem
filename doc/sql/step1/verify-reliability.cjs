'use strict';
// Executable design checks, not identity infrastructure or a production worker.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync,spawn}=require('node:child_process');
const root=path.resolve(__dirname,'../../..'),m=require(path.join(root,'交付成果/assets/system-usecases-model.js'));
const claims=JSON.parse(fs.readFileSync(path.join(root,'doc/examples/step1/invocation-proof.json'))).claims;
const digest=value=>crypto.createHash('sha256').update(m.canonical(value)).digest('hex');
const bytes=value=>Buffer.from(m.canonical(value));
let signatureChecks=0;
for(const suite of ['SIGNATURE_SUITE_RSA_PSS_SHA256','SIGNATURE_SUITE_ECDSA_P256_SHA256']){
  const rsa=suite.includes('RSA'),keys=rsa?crypto.generateKeyPairSync('rsa',{modulusLength:3072}):crypto.generateKeyPairSync('ec',{namedCurve:'prime256v1'});
  const options=rsa?{padding:crypto.constants.RSA_PKCS1_PSS_PADDING,saltLength:32}:{dsaEncoding:'ieee-p1363'};
  const original={...claims,suite};
  assert.equal(original.bodyDigest,digest(m.request));
  const signature=crypto.sign('sha256',bytes(original),{key:keys.privateKey,...options});
  assert.ok(crypto.verify('sha256',bytes(original),{key:keys.publicKey,...options},signature));signatureChecks++;
  for(const [field,value]of Object.entries({method:'PUT',resourcePath:'/api/v1/trades/other',idempotencyKey:'other',ifMatch:'"other"',bodyDigest:digest({modified:true}),subjectReference:'other',audience:'other',nonce:'other',suite:'SIGNATURE_SUITE_SM2_SM3'})){
    assert.equal(crypto.verify('sha256',bytes({...original,[field]:value}),{key:keys.publicKey,...options},signature),false,field);signatureChecks++;
  }
  const business={method:'POST',path:'/api/v1/trades',ifMatch:'',body:m.request};
  const fresh={...original,nonce:'bmV3LXJhbmRvbS10ZXN0LW5vbmNl',issuedAt:'2026-10-25T08:24:01.000Z'};
  const newSignature=crypto.sign('sha256',bytes(fresh),{key:keys.privateKey,...options});
  assert.ok(crypto.verify('sha256',bytes(fresh),{key:keys.publicKey,...options},newSignature));
  assert.equal(digest(business),digest({method:fresh.method,path:fresh.resourcePath,ifMatch:fresh.ifMatch,body:m.request}));signatureChecks++;
}
for(const endpoint of m.endpoints)assert.ok(endpoint.timeout.clientMs>endpoint.timeout.serverMs);
assert.equal(m.useCases.length,4);
for(const useCase of m.useCases){
  assert.match(useCase.systemSequence,/participant SYSTEM as 代理出口系统/);
  assert.doesNotMatch(useCase.systemSequence,/participant (?:DATABASE|STORE|SIGN|APP)/);
  assert.match(useCase.sequence,/BEGIN；(?:先SELECT本人原预留|SELECT交易主表)/);
}
const result={signatureChecks,ephemeralKeysOnly:true,sm2NotTested:true,identityInfrastructureNotImplemented:true,fileWorkerNotImplemented:true};
const database='trade_step1_supplier_payer_46c455d0';
const mysql=process.env.STEP1_MYSQL||'/opt/homebrew/opt/mysql@8.4/bin/mysql';
const args=['--defaults-file='+(process.env.STEP1_MYSQL_CONFIG||path.join(os.homedir(),'Library/ExportTradeStep1Demo/client.cnf')),'--default-character-set=utf8mb4','--batch','--raw','--skip-column-names','--database='+database];
function sql(text){
  const output=spawnSync(mysql,args,{input:text,encoding:'utf8'});
  if(output.error)throw output.error;
  assert.equal(output.status,0,output.stderr);return output.stdout.trim();
}
function parallelSql(text){
  return new Promise((resolve,reject)=>{
    const child=spawn(mysql,args,{stdio:['pipe','pipe','pipe']});let stdout='',stderr='';
    child.stdout.on('data',chunk=>{stdout+=chunk;});child.stderr.on('data',chunk=>{stderr+=chunk;});
    child.on('error',reject);child.on('close',code=>code===0?resolve(stdout.trim()):reject(new Error(stderr)));
    child.stdin.end(text);
  });
}
async function checkNumbers(){
  const counter='test_s1_counter_46c455d0',reservations='test_s1_reservations_46c455d0',proc='test_s1_reserve_46c455d0';
  const q=value=>"'"+String(value).replace(/'/g,"''")+"'";
  assert.equal(sql(`SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name IN (${q(counter)},${q(reservations)});`),'0');
  assert.equal(sql(`SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema=DATABASE() AND routine_name=${q(proc)};`),'0');
  const created=[];
  try{
    sql(`CREATE TABLE ${counter}(namespace VARCHAR(16) PRIMARY KEY,last_issued_value BIGINT UNSIGNED NOT NULL) ENGINE=InnoDB;`);created.push(counter);
    sql(`CREATE TABLE ${reservations}(subject_reference VARCHAR(32) NOT NULL,request_key VARCHAR(64) NOT NULL,request_hash CHAR(64) NOT NULL,trade_number VARCHAR(23) NOT NULL,UNIQUE KEY(subject_reference,request_key),UNIQUE KEY(trade_number)) ENGINE=InnoDB;`);created.push(reservations);
    sql(`INSERT INTO ${counter} VALUES('trade',100);`);
    sql(`DELIMITER //
CREATE PROCEDURE ${proc}(IN p_key VARCHAR(64),IN p_hash CHAR(64),IN p_fail BOOLEAN,IN p_pause BOOLEAN)
BEGIN
  DECLARE v_number VARCHAR(23) DEFAULT NULL; DECLARE v_hash CHAR(64); DECLARE v_counter BIGINT UNSIGNED;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_number=NULL;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
  SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
  START TRANSACTION;
  SELECT trade_number,request_hash INTO v_number,v_hash FROM ${reservations} WHERE subject_reference='DEMO' AND request_key=p_key FOR UPDATE;
  IF v_number IS NULL THEN
    SELECT last_issued_value INTO v_counter FROM ${counter} WHERE namespace='trade' FOR UPDATE;
    IF v_counter IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='COUNTER_NOT_CONFIGURED'; END IF;
    IF p_pause THEN DO SLEEP(0.1); END IF;
    SELECT trade_number,request_hash INTO v_number,v_hash FROM ${reservations} WHERE subject_reference='DEMO' AND request_key=p_key FOR UPDATE;
    IF v_number IS NULL THEN
      IF v_counter=18446744073709551615 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='COUNTER_EXHAUSTED'; END IF;
      SET v_counter=v_counter+1;
      UPDATE ${counter} SET last_issued_value=v_counter WHERE namespace='trade';
      IF p_fail THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='INJECTED_FAILURE'; END IF;
      SET v_number=CONCAT('TRD',LPAD(v_counter,20,'0')); SET v_hash=p_hash;
      INSERT INTO ${reservations} VALUES('DEMO',p_key,p_hash,v_number);
    END IF;
  END IF;
  IF v_hash<>p_hash THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='IDEMPOTENCY_CONFLICT'; END IF;
  COMMIT;
  SELECT v_number;
END//
DELIMITER ;`);created.push(proc);
    const hash='a'.repeat(64),call=(key,payload=hash,fail=0,pause=0)=>`CALL ${proc}(${q(key)},${q(payload)},${fail},${pause});`;
    const same=await Promise.all(Array.from({length:6},()=>parallelSql(call('same-key',hash,0,1))));
    assert.equal(new Set(same).size,1);assert.equal(same[0],'TRD00000000000000000101');
    assert.equal(sql(`SELECT last_issued_value FROM ${counter};`),'101');
    assert.throws(()=>sql(call('same-key','b'.repeat(64))),/IDEMPOTENCY_CONFLICT/);
    assert.equal(sql(`SELECT last_issued_value FROM ${counter};`),'101');
    assert.throws(()=>sql(call('fail-key',hash,1)),/INJECTED_FAILURE/);
    assert.equal(sql(`SELECT last_issued_value FROM ${counter};`),'101');
    assert.equal(sql(`SELECT COUNT(*) FROM ${reservations} WHERE request_key='fail-key';`),'0');
    const distinct=await Promise.all(['second','third','fourth'].map(key=>parallelSql(call(key,hash,0,1))));
    assert.equal(new Set(distinct).size,3);
    sql(call('lost-response')); // Discard the first committed response; recover with exactly the same key.
    const highWater=sql(`SELECT last_issued_value FROM ${counter};`);
    assert.equal(sql(call('lost-response')),sql(`SELECT trade_number FROM ${reservations} WHERE request_key='lost-response';`));
    assert.equal(sql(`SELECT last_issued_value FROM ${counter};`),highWater);
    sql(`UPDATE ${counter} SET last_issued_value=18446744073709551615;`);
    assert.throws(()=>sql(call('exhausted')),/COUNTER_EXHAUSTED/);
    assert.equal(sql(`SELECT COUNT(*) FROM ${reservations} WHERE request_key='exhausted';`),'0');
    result.numberReservation={realMySql:true,parallelSameKeyRequests:6,parallelDistinctRequests:3,conflictDoesNotAllocate:true,atomicRollback:true,discardedResponseRecovery:true,overflowRejected:true};
  }finally{
    if(created.includes(proc))sql(`DROP PROCEDURE ${proc};`);
    for(const table of created.filter(name=>name!==proc).reverse())sql(`DROP TABLE ${table};`);
  }
  result.temporaryDatabaseObjectsRemoved=true;
}
(async()=>{
  if(process.argv.includes('--mysql'))await checkNumbers();
  if(process.env.STEP1_RESULT_FILE)fs.writeFileSync(process.env.STEP1_RESULT_FILE,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
