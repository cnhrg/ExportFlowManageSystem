'use strict';
(function(root){
  const templates=[
    {id:'agency',name:'出口货物贸易代理合同',source:'M06',guides:['T02'],nodes:['N02'],parties:['A 委托方','B 受托代理方'],
      risk:'M06存在收费、章次及收汇后两日付款条款待Review；须明确代理服务范围及每笔人民币300元服务费由D承担，首次获批分账时从D已核验可用余额结算；D收费依据及授权须留档，禁止按货值比例抽佣。',
      terms:'委托出口代理、双抬头报关配套及代收代付；货物所有权及真实贸易责任按双方确认条款承担。第三方税费、银行费与固定代理服务费分别列示；每笔固定人民币300元服务费由D承担，在首次获批分账时从D已核验可用余额结算且不减少A合同应付。D须另行确认承担及扣收授权，INVOICE申报、补件或改版不触发结算。'},
    {id:'logistics',name:'国际物流服务合同',source:'M07',guides:['T06'],nodes:['N03','N06','N10'],parties:['委托方（核实A或B）','E 物流服务方'],
      risk:'M07原甲方为B；必须核实A—E或有效转委托链。原文含清关费用，须明确E不承担本流程中国出口报关，日期、报价、月结及续约均须重审。',
      terms:'按确认的运输计划提货、运输、跟踪并取得签收；记录货况、包装、货损及索赔证据。运输报价作为附件，变价须书面确认；中国出口报关仍由F承担。'},
    {id:'sales',name:'出口销售合同 / SALES CONTRACT',source:'M08',guides:['T05','E03'],nodes:['N01','N05','N21'],parties:['实际卖方（不得自动认定B）','实际买方（不得以付款方替代）'],
      risk:'必须核实真实买卖双方、收货C与付款D关系。原模板为USD计价，其他币种属于待审核修订；贸易术语、保险、索赔、仲裁机构及管辖须补齐。',
      terms:'按约定货物名称、规格、数量、单价及总额买卖。明确贸易术语、装运、包装、付款与保险；原模板质量异议30日、数量异议15日，须按本笔条款复核。'}
  ];
  const fields=[
    ['transaction','交易编号'],['batch','货物批次'],['number','本笔合同编号'],['date','签订日期'],
    ['partyA','甲方 / 卖方法定名称'],['codeA','甲方注册号'],['addressA','甲方地址'],['signerA','甲方授权签署人'],
    ['partyB','乙方 / 买方法定名称'],['codeB','乙方注册号'],['addressB','乙方地址'],['signerB','乙方授权签署人'],
    ['goods','货物名称 / 规格'],['quantity','数量'],['unit','单位'],['price','单价'],['amount','货物总金额'],['currency','币种'],
    ['scope','代理 / 物流 / 销售范围'],['fees','代理服务费及其他费用承担 / 结算规则'],['payment','付款、结算及前置门禁'],
    ['delivery','运输 / 交付 / 贸易术语'],['validity','有效期 / 生效条件'],['disputes','争议解决及管辖'],['changes','对原模板的修订与补充']
  ];
  const template=id=>{
    const item=templates.find(t=>t.id===id);
    if(!item)throw new Error('缺少可用合同正文模板；附件4流程图及M10运输互代协议不可替代。');
    return item;
  };
  function validate(values){
    const errors=fields.filter(([key])=>!String(values[key]??'').trim()).map(([,label])=>'请填写'+label);
    for(const key of ['quantity','price','amount']){
      if(!/^\d+(\.\d{1,2})?$/.test(String(values[key]))||Number(values[key])<=0)errors.push('数量、单价及总金额须为正数，最多两位小数');
    }
    if(Number.isFinite(Number(values.quantity)*Number(values.price))&&Math.abs(Number(values.quantity)*Number(values.price)-Number(values.amount))>.011)errors.push('数量 × 单价与合同总金额不一致');
    if(!/^[A-Z]{3}$/.test(values.currency||''))errors.push('币种须为三位大写代码');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(values.date||'')||Number.isNaN(Date.parse(values.date+'T00:00:00Z'))||new Date(values.date+'T00:00:00Z').toISOString().slice(0,10)!==values.date)errors.push('签订日期无效');
    if(values.partyA?.trim()===values.partyB?.trim())errors.push('签约双方不能为同一主体');
    return [...new Set(errors)];
  }
  function generate(kind,values,source,id,previous){
    const t=template(kind),errors=validate(values);
    if(errors.length)throw new Error(errors.join('；'));
    if(!source?.text||!source.hash)throw new Error('模板正文或版本摘要缺失，不能生成合同');
    if(previous&&(previous.template!==kind||previous.values.transaction!==values.transaction||previous.values.batch!==values.batch))throw new Error('修订不得切换模板、交易或批次，请新建合同');
    if(previous?.status==='submitted')throw new Error('外包签署任务处理中，须先核实 / 撤销，不能直接修订');
    const previousVersions=[...(previous?.previousVersions||[])];
    if(previous){
      const snapshot=JSON.parse(JSON.stringify(previous));
      delete snapshot.previousVersions;
      previousVersions.push(snapshot);
    }
    return {id,template:kind,version:previous?previous.version+1:1,values:{...values},source:{id:t.source,hash:source.hash,text:source.text},
      previousVersions,status:'draft',approval:null,seals:[],submission:null,history:[...(previous?.history||[]),{time:new Date().toISOString(),action:previous?'修订：旧审批、签章及提交状态失效':'生成待审核合同草稿'}]};
  }
  function act(record,action,options={}){
    const next=JSON.parse(JSON.stringify(record));
    const reject=message=>{throw new Error(message);};
    if(action==='approve'){
      if(next.status!=='draft'||options.role!=='reviewer')reject('仅独立审核员可审核当前草稿版本');
      if(!options.checks?.every(Boolean)||options.checks.length!==4||!options.reason?.trim())reject('须完成四项人工核验并填写审核意见');
      next.approval={version:next.version,role:'reviewer',reason:options.reason.trim()};
      next.status='approved';
    }else if(action==='seal'){
      if(!['approved','sealed'].includes(next.status)||options.role!=='sealer'||next.approval?.version!==next.version)reject('仅用章授权人可对已批准的当前版本模拟盖章');
      if(!['A','B'].includes(options.party)||next.seals.includes(options.party))reject('签章方无效或该方已模拟盖章');
      next.seals.push(options.party);
      if(next.seals.length===2)next.status='sealed';
    }else if(action==='submit'){
      if(options.role!=='sealer'||!['sealed','failed'].includes(next.status))reject('须双方模拟用章后由授权人提交；重复提交已被阻止');
      if(next.seals.length!==2||next.approval?.version!==next.version)reject('当前版本审批或双方用章不完整');
      const attempt=(next.submission?.attempt||0)+1;
      next.submission={key:next.id+'-v'+next.version,attempt,requestId:next.id+'-v'+next.version+'-try'+attempt,provider:'外包电子合同系统（未接入）',result:null};
      next.status='submitted';
    }else if(action==='success'||action==='failure'){
      if(options.role!=='sealer'||next.status!=='submitted'||options.requestId!==next.submission?.requestId)reject('回执与当前版本 / 请求不匹配，或已处理');
      next.submission.result=action==='success'?'模拟验签及归档成功':'模拟外包系统拒绝 / 失败';
      next.status=action==='success'?'archived':'failed';
    }else reject('未知电子合同操作');
    next.history.push({time:new Date().toISOString(),action:{approve:'模拟独立审核通过',seal:'模拟用章授权及位置预览 '+options.party,submit:'模拟提交法大大签署任务',success:'模拟完成签署并归档',failure:'模拟提交失败'}[action]+' · V'+next.version});
    return next;
  }
  function documentText(record){
    const t=template(record.template),v=record.values;
    return ['【产品原型 · 演示合同草稿 · 非有效电子合同】',t.name,
      '合同编号：'+v.number+' / V'+record.version,'交易 / 批次：'+v.transaction+' / '+v.batch,'签订日期：'+v.date,
      '模板来源：'+t.source+' / SHA-256 '+record.source.hash,
      '甲方（'+t.parties[0]+'）：'+v.partyA+'；注册号：'+v.codeA+'；地址：'+v.addressA+'；授权代表：'+v.signerA,
      '乙方（'+t.parties[1]+'）：'+v.partyB+'；注册号：'+v.codeB+'；地址：'+v.addressB+'；授权代表：'+v.signerB,
      '一、标的与范围',t.terms,'本笔约定：'+v.scope,
      '二、货物及价款',v.goods+'；'+v.quantity+' '+v.unit+' × '+v.price+' '+v.currency+' = '+v.amount+' '+v.currency,
      '三、费用及结算','代理服务费 / 其他费用：'+v.fees,'付款门禁：'+v.payment,
      '四、交付与履约',v.delivery,'五、期限与争议','生效 / 有效期：'+v.validity,'争议解决：'+v.disputes,
      '六、模板修订清单（待双方确认，不默认覆盖原条款）',v.changes,'模板风险：'+t.risk,
      '七、签章与外包处理','模拟签章方：'+(record.seals.join(' / ')||'无')+'；签名图片不等于可靠电子签名。',
      '模板全文见参考附件；以下内容是脱敏参考文本，不是本笔已填充合同，也不能代替原件排版、附件及法务审查。',
      '----- 原模板参考附件开始 -----',record.source.text,'----- 原模板参考附件结束 -----'].join('\n\n');
  }
  const api={templates,fields,template,validate,generate,act,documentText};
  root.EXPORT_CONTRACT_MODEL=api;
  if(typeof module!=='undefined')module.exports=api;
})(globalThis);
