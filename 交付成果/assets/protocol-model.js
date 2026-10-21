'use strict';
(function(root){
  const required=['transaction','batch','declarationNo','domesticShipper','manufacturer','consignee','agent','port','transport','tradeMode','currency','goods','hsCode','unit'];
  function validate(v){
    const errors=required.filter(key=>!String(v[key]??'').trim()).map(key=>'缺少字段：'+key);
    for(const key of ['quantity','unitPrice','totalAmount','netWeight','grossWeight']){
      if(!/^\d+(\.\d{1,4})?$/.test(String(v[key]??''))||Number(v[key])<=0)errors.push(key+'须为正数，最多四位小数');
    }
    if(!/^\d{10}$/.test(v.hsCode||''))errors.push('商品编码须为10位数字；这里只校验格式，不执行归类或监管条件核验');
    if(!/^[A-Z]{3}$/.test(v.currency||''))errors.push('币种须为三位大写代码');
    if(Math.abs(Number(v.quantity)*Number(v.unitPrice)-Number(v.totalAmount))>.01)errors.push('数量 × 单价与总金额不一致');
    if(Number(v.netWeight)>Number(v.grossWeight))errors.push('净重不能大于毛重');
    return [...new Set(errors)];
  }
  function create(values,previous){
    const errors=validate(values);
    if(errors.length)throw new Error(errors.join('；'));
    if(previous&&['submitted','accepted','inspection','released'].includes(previous.status))throw new Error('任务处理中或已放行，须先查询正式状态并走适用更正流程；不能直接改版或重复申报');
    if(previous&&['transaction','batch','declarationNo'].some(key=>previous.values[key]!==values[key]))throw new Error('修订不得改变交易、批次或业务申报编号；请新建独立草稿');
    const history=[...(previous?.history||[]),{action:'保存待校验草稿',time:new Date().toISOString()}];
    return {schema:1,version:(previous?.version||0)+1,values:{...values},status:'draft',confirmation:null,submission:null,receipts:[],history};
  }
  function apply(record,action,options={}){
    const r=JSON.parse(JSON.stringify(record));
    const fail=message=>{throw new Error(message);};
    if(action==='confirm'){
      if(r.status!=='draft')fail('仅草稿可确认，内容变更必须重新确认');
      if(validate(r.values).length)fail('草稿字段校验未通过');
      if(!options.authorized||!options.versionConfirmed||!options.evidence?.trim())fail('须核对A对当前最终版的书面确认、F委托授权及人工核验依据');
      r.confirmation={version:r.version,evidence:options.evidence.trim()};r.status='confirmed';
    }else if(action==='submit'){
      if(r.status!=='confirmed'||r.confirmation?.version!==r.version)fail('仅已确认当前版本可模拟提交；禁止重复提交');
      r.submission={idempotencyKey:r.values.transaction+'/'+r.values.batch+'/'+r.values.declarationNo+'/v'+r.version,requestId:'MOCK-CUS-'+Date.now(),version:r.version};
      r.status='submitted';
    }else if(action==='receipt'){
      if(!r.submission||options.requestId!==r.submission.requestId||options.version!==r.version)fail('回执请求号 / 版本不匹配，拒绝更新');
      if(!options.eventId?.trim()||!options.reference?.trim())fail('回执须包含事件ID及来源编号（此处仅演示）');
      if(r.receipts.some(e=>e.eventId===options.eventId))fail('重复事件已拒绝，不重复推进状态');
      const next={submitted:['accepted','rejected'],accepted:['inspection','released','rejected'],inspection:['released','rejected']}[r.status]||[];
      if(!next.includes(options.status))fail('回执顺序无效：提交不等于受理，受理 / 查验不等于放行；终态不得倒退');
      r.status=options.status;r.receipts.push({...options});
    }else fail('未知协议操作');
    r.history.push({action:action==='receipt'?'模拟回执：'+options.status:action==='confirm'?'模拟确认当前最终版':'模拟提交本地适配器',time:new Date().toISOString()});
    return r;
  }
  function envelope(r){
    return {schema:'trade-customs-internal-demo/v1',notice:'本系统内部JSON模型，不是单一窗口报文、海关API或可直接申报文件',
      businessKey:r.values.transaction+'/'+r.values.batch+'/'+r.values.declarationNo,version:r.version,
      idempotencyKey:r.submission?.idempotencyKey||null,requestId:r.submission?.requestId||null,
      header:{direction:'出口',domesticShipper:r.values.domesticShipper,manufacturer:r.values.manufacturer,overseasConsignee:r.values.consignee,declarationAgent:r.values.agent,port:r.values.port,transport:r.values.transport,tradeMode:r.values.tradeMode,currency:r.values.currency},
      items:[{name:r.values.goods,hsCode:r.values.hsCode,quantity:r.values.quantity,unit:r.values.unit,unitPrice:r.values.unitPrice,totalAmount:r.values.totalAmount,netWeight:r.values.netWeight,grossWeight:r.values.grossWeight}],
      references:{transaction:r.values.transaction,batch:r.values.batch,finalVersionEvidence:r.confirmation?.evidence||null},
      pendingMapping:['企业海关编码 / 统一社会信用代码','官方代码表及监管条件','成交单位与法定计量单位 / 数量','运输航次、提运单、境内货源地、最终目的国','随附单证及正式报文必填项','官方报文版本、证书签名、接入资质及交换客户端']};
  }
  const api={validate,create,apply,envelope};
  root.EXPORT_PROTOCOL_MODEL=api;
  if(typeof module!=='undefined')module.exports=api;
})(globalThis);
