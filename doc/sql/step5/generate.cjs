'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),model=require('../../../交付成果/assets/step-five-usecases-model.js');
const transport=require('../transport-examples.cjs'),artifacts={};
const pretty=value=>JSON.stringify(value,null,2)+'\n';
const material=fs.readFileSync(path.join(root,'doc/examples/step5/material.html'),'utf8');
const file={logicalFileNumber:'FILE-S5-SYNTHETIC',revisionNumber:1,sha256:crypto.createHash('sha256').update(material).digest('hex'),documentTypeCode:14};
const trade='TRD-S5-SYNTHETIC',invoice='INV-S5-SYNTHETIC',allocation='ALLOC-S5-SYNTHETIC',payment='PAY-S5-SYNTHETIC',difference='DIFF-S5-SYNTHETIC';
const money=amount=>({amount,currencyCode:'CNY'}),zero=money('0.00'),tag='"s5-synthetic-revision-1"';
const balances={restricted:zero,available:zero,paymentLocked:zero};
const returnDecision={outcome:'DECISION_OUTCOME_RETURN',reason:'缺真实银行及商业证据，退回补正；不推进资金状态'};
const inputs={
 's5-invoice-create':{invoiceNumber:invoice,declaredAmount:money('1000.00'),approvedTradeRevisionNumber:1,invoiceFiles:[file],allocationNumbers:[],sourceContentsConfirmed:true},
 's5-allocation-create':{tradeNumber:trade,approvedTradeRevisionNumber:1,allocatedAmount:money('1000.00'),sourceTypeCode:'invoice',sourceNumber:invoice,reason:'合成结构例，无真实实收不可受理'},
 's5-allocation-decision':{...returnDecision,evidence:[]},
 's5-bank-evidence':{accountNumber:'BANK-S5-SYNTHETIC',accountFingerprint:'SYNTHETIC-NOT-A-BANK-IDENTITY',bankEventKey:'SYNTHETIC-NOT-A-BANK-EVENT',amount:money('1000.00'),occurredAt:'2026-10-25T01:00:00Z',valueDate:'2026-10-25T01:00:00Z',sourceEvidence:file,evidenceHash:file.sha256,manualEvidenceIntake:true,eventType:'BANK_EVIDENCE_KIND_CARGO_RECEIPT',payerPartyRoleCode:4,independentPayment:false},
 's5-trade-verification':{approvedTradeRevisionNumber:1,invoiceNumbers:[invoice],allocationNumbers:[],verificationEvidence:[],outcome:'DECISION_OUTCOME_RETURN',reason:returnDecision.reason},
 's5-availability-release':{receiptFlowNumber:'FLOW-S5-ABSENT',allocationNumber:allocation,releaseAmount:money('500.00'),bankAvailableEvidence:file,bankAvailableEvidenceHash:file.sha256,verificationTransactionNumber:'VERIFY-S5-SYNTHETIC',reason:'原创合成文件不是银行可用证据，应拒绝'},
 's5-settlement-create':{paymentBranch:'PAYMENT_BRANCH_PREPAYMENT',approvedTradeRevisionNumber:1,invoiceNumbers:[invoice],allocationNumbers:[],payableAmount:money('1000.00'),alreadyPaidAmount:zero,authorizedDeductions:[],proposedAmount:money('1000.00'),supplierConfirmation:file,requiredEvidence:[],contractReferences:[],ruleVersion:'s5-design-1'},
 's5-settlement-decision':{...returnDecision,verifiedEvidence:[]},
 's5-payment-approval':{amount:money('1000.00'),beneficiaryAccountNumber:'BENEFICIARY-S5-UNVERIFIED',beneficiaryAccountFingerprint:'SYNTHETIC-UNVERIFIED',beneficiaryAccountRevisionNumber:1,allocationNumbers:[],approvalEvidence:[],reason:'缺有效结算及受益方核实，不得锁额'},
 's5-payment-execution':{executionIntentReference:'INTENT-S5-SYNTHETIC',reason:'无真实银行适配器，不可执行'},
 's5-beneficiary-receipt':{receivedAmount:money('1000.00'),receivedAt:'2026-10-25T01:00:00Z',bankReceiptEvidence:file,bankReference:'SYNTHETIC-NOT-ARRIVAL',reason:'合成文件不证明A到账'},
 's5-difference-create':{differenceType:'DIFFERENCE_TYPE_STATUS',bankAccountNumber:'BANK-S5-SYNTHETIC',bankEventKey:'SYNTHETIC-UNVERIFIED',transactionNumber:payment,evidence:[file],reason:'内部合成差异，无银行金额，未知侧省略而非0'},
 's5-difference-disposition':{reason:'请求补充真实证据，不改余额、不关闭差异',evidence:[file]},
 's5-difference-review':{...returnDecision,evidence:[]}
};
const invoiceResource={invoiceNumber:invoice,tradeNumber:trade,declaredAmount:money('1000.00'),approvedTradeRevisionNumber:1,status:'FUNDS_TRANSACTION_STATUS_PENDING_APPROVAL',invoiceFiles:[file],missingGateCodes:['FUND_EVIDENCE_MISSING'],etag:tag};
const differenceResource={differenceNumber:difference,differenceType:'DIFFERENCE_TYPE_STATUS',status:'DIFFERENCE_STATUS_OPEN',bankEventKey:'SYNTHETIC-UNVERIFIED',transactionNumber:payment,ownerReference:'SYNTHETIC-INTERNAL-OPERATOR',evidence:[file],etag:tag};
const resources={
 's5-funds-overview':{tradeNumber:trade,approvedTradeRevisionNumber:1,balances,matchedReceipts:zero,unmatchedRestricted:zero,allocatedGross:zero,released:zero,occupied:zero,openGateCodes:['FUND_EVIDENCE_MISSING'],openDifferenceNumbers:[],etag:tag},
 's5-invoice-create':invoiceResource,'s5-invoice-read':invoiceResource,
 's5-review-context':{tradeNumber:trade,approvedTradeRevisionNumber:1,invoices:[invoiceResource],receipts:[],allocations:[],missingGateCodes:['BANK_AVAILABILITY_EVIDENCE_REQUIRED'],openDifferenceNumbers:[],etag:tag},
 's5-trade-verification':{transactionNumber:'VERIFY-S5-SYNTHETIC',tradeNumber:trade,status:'FUNDS_TRANSACTION_STATUS_RETURNED',verifiedAmount:zero,verificationScopeHash:file.sha256,missingGateCodes:['FUND_EVIDENCE_MISSING'],etag:tag},
 's5-payment-read':{transactionNumber:payment,amount:money('1000.00'),executionStatus:'EXECUTION_STATUS_NOT_SUBMITTED',transactionStatus:'FUNDS_TRANSACTION_STATUS_DRAFT',balances,attempts:[],missingEvidenceCodes:['BANK_EVIDENCE_REQUIRED'],acceptanceId:'S5-INTERNAL-SYNTHETIC-ONLY',etag:tag},
 's5-difference-create':differenceResource,'s5-difference-read':differenceResource,
 's5-difference-disposition':{...differenceResource,status:'DIFFERENCE_STATUS_PROCESSING'},
 's5-difference-review':{...differenceResource,status:'DIFFERENCE_STATUS_PROCESSING',reviewOutcome:'DECISION_OUTCOME_RETURN'}
};
const failures={
 's5-receipt-read':[404,'NOT_FOUND'],'s5-allocation-context':[404,'NOT_FOUND'],
 's5-fee-read':[404,'NOT_FOUND'],
 's5-allocation-create':[422,'FUND_EVIDENCE_MISSING'],'s5-allocation-read':[404,'NOT_FOUND'],
 's5-allocation-decision':[404,'NOT_FOUND'],'s5-bank-evidence':[422,'BANK_EVIDENCE_REQUIRED'],
 's5-availability-release':[422,'BANK_AVAILABILITY_EVIDENCE_REQUIRED'],
 's5-settlement-create':[422,'PAYMENT_GATE_INCOMPLETE'],'s5-settlement-read':[404,'NOT_FOUND'],
 's5-settlement-decision':[404,'NOT_FOUND'],'s5-payment-approval':[422,'BENEFICIARY_UNVERIFIED'],
 's5-payment-execution':[422,'BANK_EVIDENCE_REQUIRED'],'s5-beneficiary-receipt':[422,'PAYEE_RECEIPT_UNVERIFIED']
};
const params={trade_number:trade,invoice_number:invoice,receipt_flow_number:'FLOW-S5-ABSENT',allocation_number:allocation,transaction_number:payment,difference_number:difference};
const examples=model.endpoints.map((endpoint,index)=>{
 const request={method:endpoint.method,path:endpoint.path.replace(/\{([^}]+)\}/g,(_,key)=>params[key]),headers:{Authorization:'<INVALID-SYNTHETIC-'+(endpoint.audience==='内部运营'?'INTERNAL':'EXTERNAL')+'-CREDENTIAL>'}};
 if(endpoint.body){Object.assign(request.headers,{'Content-Type':'application/json','Idempotency-Key':'d7050000-0000-4000-8000-'+String(index+1).padStart(12,'0'),'If-Match':tag,'X-Confirmation-Id':'<INVALID-SYNTHETIC-CONFIRMATION>'});request.body=inputs[endpoint.id];assert(request.body,endpoint.id);}
 const failure=failures[endpoint.id];
 const response={status:failure?failure[0]:Number(endpoint.status),headers:{'Content-Type':failure?'application/problem+json':'application/json','Cache-Control':'no-store'},body:failure?{type:'urn:export-trade:funds:'+failure[1].toLowerCase(),title:'真实证据或资源不足，操作未完成',status:failure[0],detail:'仅合成设计例；没有真实银行接入或成功事实，资金桶及锁额不变。',instance:request.path,errors:[{pointer:'/resource',code:failure[1],detail:'补充真实证据后按原号查询/补正，不盲重新付款'}],outcomeUnknown:false,retryAfterMs:0}:resources[endpoint.id]};
 assert(response.body,endpoint.id);
 if(!failure){response.headers.ETag=tag;if(endpoint.method==='POST')response.headers.Location=request.path+'/S5-SYNTHETIC-ACCEPTANCE';}
 return transport.enrich({request,response},endpoint);
});
const rpcs=examples.map((example,index)=>{
 const endpoint=model.endpoints[index],rpc=transport.rpc(example,endpoint,'trade.funds.v1'),failure=failures[endpoint.id];
 if(failure){delete rpc.response;delete rpc.successTrailers;rpc.error={code:failure[0]===404?'NOT_FOUND':'FAILED_PRECONDITION',details:{code:failure[1],httpStatus:failure[0],errors:example.response.body.errors,retryable:false,retryAfterMs:0,outcomeUnknown:false,requestReference:'S5-SYNTHETIC-'+String(index+1)}};}
 return rpc;
});
artifacts['doc/examples/step5/http-contract.json']=pretty(model.endpoints);
artifacts['doc/examples/step5/http-examples.json']=pretty(examples);
artifacts['doc/examples/step5/rpc-examples.json']=pretty(rpcs);
artifacts['doc/examples/step5/fee-evidence-cases.json']=pretty([
 {designOnly:true,rpc:'CreateBankReceiptEvidence',request:{evidence:{...inputs['s5-bank-evidence'],eventType:'BANK_EVIDENCE_KIND_BANK_FEE_DEBIT',amount:money('5.00'),transactionNumber:payment,payerPartyRoleCode:2,independentPayment:false}},expectedError:'BANK_EVIDENCE_REQUIRED',cargoBucketsUnchanged:true}
]);
const syntheticDocument=(number,type,amount)=>({
 transaction_number:number,transaction_type:type,source_context_code:'step5-design-only',
 trade_number:trade,trade_revision_number:1,amount,currency_code:'CNY',
 source_lines_json:{validationOnly:true,invoice_number:invoice},
 execution_basis_json:{validationOnly:true,noBankFact:true},
 transaction_status:2,request_number:'S5-SYNTHETIC-'+number,
 request_hash:file.sha256,approval_snapshot_json:{validationOnly:true},
 result_snapshot_json:{validationOnly:true},lifecycle_events_json:[{kind:'synthetic_internal_submission_only'}],
 created_by:'SYNTHETIC-VALIDATION-ONLY'
});
artifacts['doc/examples/step5/entity-projection.json']=pretty({
 designOnly:true,bankSuccess:false,syntheticOnly:true,executableSeed:false,
 invoice:invoiceResource,balances,
 fieldMapping:{bankAccount:'payment_bank_account_tab',documents:'payment_transaction_tab',allocations:'payment_fund_allocation_tab',events:'payment_fund_flow_tab',differences:'payment_reconcile_difference_tab',accounts:'account_tab',vouchers:'account_voucher_tab',entries:'account_ledger_entry_tab'},
 sourceTableProjections:{
  payment_transaction_tab:[syntheticDocument(invoice,1,'1000.00')],
  payment_fund_flow_tab:[],
  payment_bank_account_tab:[],payment_fund_allocation_tab:[],payment_reconcile_difference_tab:[],
  account_tab:[],account_voucher_tab:[],account_ledger_entry_tab:[]
 },
 absentRowsReason:'未核实真实银行/分配/收款，不制造银行配置身份、实收、释放、付款、到账、费用或成功账务分录；真实验证的故障凭证全部回滚。',
 constraints:['no bank success or service-fee settlement fixtures without verified available funds','service fee settles once from verified D-funded available balance during first approved distribution','event11 requires real bank identity','event3 partial release requires bank availability evidence']
});
artifacts['doc/examples/step5/http-reference.md']='# 步骤五 HTTP / RPC / cURL\n\n设计例，所有身份与证据均合成。缺银行事实的端点返回强类型错误，内部受理不等于银行执行。\n\n'+examples.map((e,i)=>'## '+e.rpc+'\n\n```http\n'+e.httpResponse+'\n```\n\n```bash\n'+e.curl+'\n```\n\n```json\n'+pretty(rpcs[i])+'```\n').join('\n');
artifacts['doc/examples/step5/README.md']='# 步骤五逐项双图及类型化示例\n\n'+model.useCases.map(u=>'- '+u.code+' '+u.name+'：[黑盒]('+u.id+'-system.mmd) / [实现]('+u.id+'-implementation.mmd)').join('\n')+'\n\n全部24端点见http-contract.json、http-examples.json、rpc-examples.json。13项缺资源/证据失败不伪造成功resource；其余是内部合成投影或受理而非银行成功。\n';
for(const u of model.useCases)for(const [kind,source]of [['system',u.systemSequence],['implementation',u.sequence]])artifacts['doc/examples/step5/'+u.id+'-'+kind+'.mmd']=source+'\n';
for(const name of ['proto/trade/funds/v1/funds.proto','doc/步骤五系统用例与接口协议.md','doc/examples/step5/material.html'])artifacts[name]=fs.readFileSync(path.join(root,name),'utf8');
const output='交付成果/assets/step-five-usecases-artifacts.js',files={...artifacts,[output]:"'use strict';\nglobalThis.EXPORT_STEP_FIVE_ARTIFACTS="+pretty(artifacts).trim()+";\n"};
for(const [name,source]of Object.entries(files)){const target=path.join(root,name);if(process.argv.includes('--check'))assert.equal(fs.readFileSync(target,'utf8'),source,'Stale artifact: '+name);else{fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,source);}}
console.log(JSON.stringify({useCases:model.useCases.length,diagrams:model.useCases.length*2,endpoints:examples.length,typedFailures:Object.keys(failures).length,artifacts:Object.keys(files).length}));
