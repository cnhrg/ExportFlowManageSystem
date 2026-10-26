'use strict';
const assert=require('node:assert/strict');
const {domainRules}=require('../../../交付成果/assets/step-five-usecases-model.js');

assert.equal(domainRules.parseCny('12000.00'),1200000n);
assert.throws(()=>domainRules.parseCny('12,000.00'),/AMOUNT_FORMAT_INVALID/);
assert.throws(()=>domainRules.parseCny('12000.001'),/AMOUNT_FORMAT_INVALID/);
assert.throws(()=>domainRules.parseCny('1e2'),/AMOUNT_FORMAT_INVALID/);
assert.throws(()=>domainRules.parseCny(300),/AMOUNT_FORMAT_INVALID/);
assert.throws(()=>domainRules.formatCny(100000000000000000000n),/AMOUNT_RANGE_INVALID/);

const partial=domainRules.allocateReceipt({
  receiptAmount:'10000.00',alreadyAllocated:'2500.00',requestedAmount:'3000.00'
});
assert.deepEqual(partial,{allocated:'5500.00',unmatched:'4500.00'});
assert.throws(()=>domainRules.allocateReceipt({
  receiptAmount:'10000.00',alreadyAllocated:'9000.00',requestedAmount:'1000.01'
}),/ALLOCATION_EXCEEDED/);
console.log('PASS synthetic pure-domain allocation守恒/超额拒绝（无银行事件输入）');

const bucketsBefore={restricted:'500.00',available:'0.00'};
assert.throws(()=>domainRules.releaseFunds({
  restricted:bucketsBefore.restricted,available:bucketsBefore.available,amount:'1.00',
  tradeVerified:true,bankAvailableEvidence:false
}),/BANK_AVAILABILITY_EVIDENCE_REQUIRED/);
assert.deepEqual(bucketsBefore,{restricted:'500.00',available:'0.00'});
console.log('PASS 缺实际银行可用证据时保持受限（未创建/注入银行成功）');

assert.throws(()=>domainRules.approvePayment({
  available:'0.00',amount:'1.00',settlementApproved:true,beneficiaryVerified:true,
  branchEvidenceComplete:true
}),/AVAILABLE_BALANCE_INSUFFICIENT/);
assert.throws(()=>domainRules.approvePayment({
  available:'500.00',amount:'1.00',settlementApproved:true,beneficiaryVerified:false,
  branchEvidenceComplete:true
}),/PAYMENT_GATE_INCOMPLETE/);
console.log('PASS 资金不足及未核实受益方均不能锁额');

const unknown=domainRules.executionResult({
  available:'0.00',locked:'500.00',amount:'500.00',outcome:'unknown'
});
assert.deepEqual(unknown,{available:'0.00',locked:'500.00',action:'QUERY_ORIGINAL'});
console.log('PASS 合成内部锁额遇执行未知继续锁定，仅提示原号查单');
assert.deepEqual(domainRules.executionResult({
  available:'20.00',locked:'500.00',amount:'100.00',outcome:'explicit_failure'
}),{available:'120.00',locked:'400.00',action:'UNLOCK'});
assert.throws(()=>domainRules.executionResult({
  available:'20.00',locked:'500.00',amount:'0.00',outcome:'unknown'
}),/LOCKED_BALANCE_INSUFFICIENT/);
console.log('PASS 合成领域明确失败仅解锁本笔；零金额与不明结果拒绝');

assert.deepEqual(domainRules.serviceFeeSettlement({
  tradeNumber:'SYN-TRADE-001',available:'1000.00',distributionApproved:true,
  tradeVerified:true,availableBalanceVerified:true,payerAuthorized:true
}),{
  amount:'300.00',currencyCode:'CNY',payerRole:'D',payeeRole:'B',
  eventType:12,bucketFrom:2,bucketTo:null,
  eventKey:'SYN-TRADE-001:agency_service_fee',available:'700.00'
});
assert.equal(domainRules.serviceFeeSettlement({
  tradeNumber:'SYN-TRADE-001',available:'700.00',alreadySettled:true,
  distributionApproved:true,tradeVerified:true,availableBalanceVerified:true,payerAuthorized:true
}),null);
for(const gate of ['distributionApproved','tradeVerified','availableBalanceVerified','payerAuthorized']){
  assert.throws(()=>domainRules.serviceFeeSettlement({
    tradeNumber:'SYN-TRADE-001',available:'1000.00',distributionApproved:true,
    tradeVerified:true,availableBalanceVerified:true,payerAuthorized:true,[gate]:false
  }),/SERVICE_FEE_SETTLEMENT_GATE_INCOMPLETE/);
}
assert.throws(()=>domainRules.serviceFeeSettlement({
  tradeNumber:'SYN-TRADE-001',available:'299.99',distributionApproved:true,
  tradeVerified:true,availableBalanceVerified:true,payerAuthorized:true
}),/SERVICE_FEE_AVAILABLE_BALANCE_INSUFFICIENT/);
console.log('PASS 首次获批分账从D可用余额结算300.00；缺证据/余额不足拒绝，重复分账不重复结算');

const noEvidenceBuckets={restricted:'0.00',available:'250.00',locked:'10.00'};
assert.throws(()=>domainRules.validateBankEvent({
  eventType:10,bankEvidence:null,buckets:noEvidenceBuckets
}),/BANK_EVENT_TYPE_INVALID/);
assert.throws(()=>domainRules.validateBankEvent({
  eventType:11,bankEvidence:null,buckets:noEvidenceBuckets
}),/BANK_EVIDENCE_REQUIRED/);
assert.deepEqual(noEvidenceBuckets,{restricted:'0.00',available:'250.00',locked:'10.00'});
console.log('PASS event10历史服务费收款路径拒绝；event11银行费用缺真实依据时拒绝，三货款桶不变');

assert.deepEqual(domainRules.applyBucketEvents([
  {eventType:8,amount:'300.00',currencyCode:'CNY',bucketFrom:null,bucketTo:null},
  {eventType:9,amount:'300.00',currencyCode:'CNY',bucketFrom:null,bucketTo:null}
]),{restricted:'0.00',available:'0.00',locked:'0.00'});
assert.deepEqual(domainRules.applyBucketEvents([
  {eventType:1,amount:'1000.00',currencyCode:'CNY'},
  {eventType:3,amount:'1000.00',currencyCode:'CNY'},
  {eventType:12,amount:'300.00',currencyCode:'CNY',bucketFrom:2,bucketTo:null}
]),{restricted:'0.00',available:'700.00',locked:'0.00'});
assert.throws(()=>domainRules.applyBucketEvents([
  {eventType:1,amount:'100.00',currencyCode:'CNY'},
  {eventType:3,amount:'100.00',currencyCode:'CNY'},
  {eventType:12,amount:'300.00',currencyCode:'CNY',bucketFrom:2,bucketTo:null}
]),/AVAILABLE_BALANCE_INSUFFICIENT/);
assert.throws(()=>domainRules.applyBucketEvents([
  {eventType:8,amount:'300.00',currencyCode:'CNY',bucketFrom:null,bucketTo:1}
]),/NON_CARGO_EVENT_HAS_BUCKET/);
assert.throws(()=>domainRules.applyBucketEvents([
  {eventType:3,amount:'1.00',currencyCode:'CNY'}
]),/RESTRICTED_BALANCE_INSUFFICIENT/);
console.log('PASS 账单/作废不动货款桶；服务费结算仅从可用余额扣收；非法迁移和余额不足拒绝');

assert.deepEqual(domainRules.paymentRequirements({branch:'prepayment',verifiedCodes:[]}),
  {complete:false,missing:[1,2,3,4,5,6,11,12,13,14]});
assert.deepEqual(domainRules.paymentRequirements({branch:'post_export',verifiedCodes:[1,3,5,6,11,12,13,14]}),
  {complete:false,missing:[7,8,9,10]});
assert.throws(()=>domainRules.paymentRequirements({branch:'prepayment',verifiedCodes:[15]}),
  /PAYMENT_REQUIREMENT_INVALID/);
console.log('PASS 预付/出口后独立证据集合；缺A确认/B收件/正式放行不通过');
assert.deepEqual(domainRules.settlementNet({
  payable:'1000.00',alreadyPaid:'200.00',locked:'100.00',
  deductions:[{amount:'50.00',reason:'authorized_third_party',authorizationReference:'SYNTHETIC-INTERNAL-RULE-ONLY',borneByPartyRole:'A'}]
}),{remaining:'650.00',authorizedDeductions:'50.00'});
assert.throws(()=>domainRules.settlementNet({
  payable:'1000.00',deductions:[{amount:'300.00',reason:'agency_service_fee'}]
}),/SERVICE_FEE_CARGO_DEDUCTION_FORBIDDEN/);
assert.throws(()=>domainRules.settlementNet({
  payable:'1000.00',deductions:[{amount:'50.00',reason:'bank_fee'}]
}),/DEDUCTION_AUTHORIZATION_REQUIRED/);
console.log('PASS A合同应付单列已付/锁额/授权扣款；禁止把D承担服务费计为A应付扣项');

console.log('Step-five pure-domain rule cases passed; all fixtures are synthetic and no bank success was modeled.');
