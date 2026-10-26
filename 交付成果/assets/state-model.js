'use strict';
(function(root){
  const model=root.EXPORT_DOMAIN_MODEL;
  if(!model)throw new Error('领域模型未加载');
  const persistence={
    trade:[['trade_record_tab','trade_status_code','trade_status_code']],
    contract:[['contract_revision_tab','contract_revision_status_code','contract_revision_status_code'],['document_file_tab','revision_status_code','file_revision_status_code']],
    payment:Array.from({length:5},()=>['payment_transaction_tab','transaction_status','transaction_status']),
    account:[['account_voucher_tab','voucher_status','voucher_status']],
    customs:[['customs_declaration_tab','declaration_status','declaration_status']],
    tax:[['tax_case_tab','case_status','case_status']]
  };
  const domains=model.domains.map(domain=>({
    id:domain.id,name:domain.name,
    machines:(model.stateMachines[domain.id]||[]).map((machine,index)=>({
      ...machine,id:domain.id+'-'+(index+1),domainId:domain.id,persistence:persistence[domain.id]?.[index]||null
    }))
  }));
  const mapping={
    N01:['trade','trade_record_tab、trade_participater_tab、trade_revision_tab、trade_event_tab','首次提交创建同号交易；终审批准当前修订，非批准时才建单。'],
    N02:['contract','contract_record_tab、contract_revision_tab、document_file_tab','代理协议所需签署、生效条件与确切版本；固定300元由D承担并从已核验可用余额分账结算，须有D授权。'],
    N03:['contract','contract_record_tab、contract_revision_tab；logistics_shipment_tab','有效物流协议、真实委托链与批准交易参与方匹配。'],
    N04:['contract','contract_revision_tab、document_file_tab；customs_declaration_tab','报关服务合同与正式授权分别留证，预付核对同一F。'],
    N05:['contract','document_file_tab；trade_record_tab.transaction_filing_document_references_json','引用最终文件版本及摘要，材料变更新修订并重审。'],
    N06:['logistics','logistics_shipment_tab、logistics_shipment_item_tab、logistics_transport_leg_tab','批次数量/金额不超批准商品，运输资料依阶段补齐。'],
    N07:['customs','customs_declaration_tab、customs_declaration_revision_tab、customs_declaration_item_tab','完整申报修订冻结批准交易、批次计划和商品；独立审核后才由供应商确认。'],
    N08:['customs','customs_declaration_revision_tab、customs_event_tab','供应商对同一最终版书面确认，补正须新修订重审重确认，不等于正式受理。'],
    N09:['customs','customs_filing_request_tab、customs_event_tab、customs_declaration_tab；document_file_tab','办理意图、未知查单、正式提交/受理/放行及供应商/出口代理分别接收不可互代。'],
    N10:['logistics','logistics_shipment_tab、logistics_event_tab；compliance_discrepancy_case_tab','同批次有效签收，货损/拒收按案件处理，非自动无争议结案。'],
    N11:['payment','payment_fund_flow_tab、payment_fund_allocation_tab','银行实收先受限；有效毛额分配加未匹配金额等于实收，水单不等于实收。'],
    N12:['payment','payment_transaction_tab（类型1 INVOICE）','逐来源冻结版本并独立审核；INVOICE申报及补正均不触发服务费。'],
    N13:['payment','payment_transaction_tab（类型2）、payment_fund_flow_tab；account_voucher_tab','银行核验、实际入账、银行可用及记账事实分开；齐备才释放对应额度。'],
    N14:['payment','payment_transaction_tab（类型3/4）、payment_fund_flow_tab（event_type=12）、payment_reconcile_difference_tab','首次获批分账从D可用余额一次性结算300元；该事件不减少A合同应付。'],
    N15:['payment','payment_transaction_tab（类型5）、payment_fund_allocation_tab；contract_revision_tab','预付分支；合同/F/银行可用门禁及来源额度齐备，无垫资路径。'],
    N16:['payment','payment_transaction_tab（类型5）；customs_declaration_tab、contract_revision_tab','出口后分支；N09/N14、确切合同版、放行及银行可用门禁齐备。'],
    N17:['payment','payment_transaction_tab、payment_fund_flow_tab；account_voucher_tab、account_ledger_entry_tab','原批准分支、锁额、银行扣款、A到账确认及必要凭证；未知不解锁。'],
    N18:['tax','tax_case_tab、tax_submission_tab；document_file_tab','以批准交易及正式关务证据备料，指定版本与申请主体一致。'],
    N19:['tax','tax_submission_tab、tax_event_tab','按正式渠道独立登记申请、受理、补正及回执，技术投递不等于批准。'],
    N20:['tax','tax_event_tab、tax_submission_tab；document_file_tab','正式证明和指定版本交付留证，不以上传表示机关签发。'],
    N21:['tax','tax_case_tab、tax_submission_tab、tax_event_tab；payment_fund_flow_tab','监管批准与实际银行退税到账独立核验，补正/拒绝有正式依据。'],
    N22:['trade','trade_record_tab、trade_event_tab；各领域权威结案证据','四流与异常闭环后持久化10已结案，不能再次重开或复用编号。'],
    N23:['compliance','compliance_discrepancy_case_tab、compliance_disposition_event_tab；trade_event_tab','暂停是未解案件集合门禁；指定解除不清其他门禁。仅已批准未结案交易可开新修订。']
  };
  function persistenceBook(machine){
    if(!machine.persistence)return null;
    const [,,name]=machine.persistence;
    return model.domains.find(domain=>domain.id===machine.domainId).codebooks?.find(book=>book.name.split('｜')[0]===name)||null;
  }
  const text=value=>String(value).replace(/["\r\n]/g,' ').replace(/[<>]/g,'');
  function source(machine){
    const nodes=machine.states.map(([code,label])=>({id:'ST_'+code.replace(/[^A-Za-z0-9_]/g,'_'),label}));
    const labels=new Map(nodes.map(node=>[node.label,node.id]));
    const contexts=new Map();
    function context(label){
      if(!contexts.has(label))contexts.set(label,'CTX_'+contexts.size);
      return contexts.get(label);
    }
    const edges=[];
    for(const [from,event,guard,to] of [...machine.transitions,...machine.exceptions]){
      const parts=from.split('/'),known=parts.every(label=>labels.has(label));
      const sources=labels.has(from)?[labels.get(from)]:known?parts.map(label=>labels.get(label)):[context('触发范围：'+from)];
      const target=to.startsWith('状态不变')?null:labels.get(to)||context('处理/恢复上下文：'+to);
      for(const id of sources)edges.push('  '+id+' --> '+(target||id)+' : '+text(event+' ['+guard+']'+(target?'':' · '+to)));
    }
    return ['stateDiagram-v2','  direction LR',...nodes.map(node=>'  state "'+text(node.label)+'" as '+node.id),...[...contexts].map(([label,id])=>'  state "'+text(label)+'" as '+id),'  [*] --> '+nodes[0].id,...edges].join('\n');
  }
  const api={domains,mapping,source,persistenceBook};
  root.EXPORT_STATE_MODEL=api;
  if(typeof module!=='undefined')module.exports=api;
})(globalThis);
