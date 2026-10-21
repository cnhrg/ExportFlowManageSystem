'use strict';
(function(root) {
  const schema=root.EXPORT_REVIEW_SCHEMA||(typeof require==='function'?require('./review-schema.js'):null);
  const business=root.EXPORT_BUSINESS||(typeof require==='function'?require('./business-data.js'):null);
  const slotMap=new Map(schema.slots.map(s=>[s.key,s]));
  const blank=()=>({format:'export-material-review/v1',schemaVersion:schema.version,sourceAlignmentVersion:0,transaction:'',mode:'post',funding:'received',amount:'',available:'',limit:'',occupied:'',entries:{},documents:{},gates:{},events:[]});
  function gateConditions(s,n){
    if(!['N15','N16'].includes(n.id))return [...n.conditions];
    return [...n.conditions,'已独立核实 A 收款账户、拟付款金额及累计预付/尾款，无重复超付',
      ...(n.id==='N16'?['逐项核实国内人民币可用余额、付款匹配、有效银行报价、费用扣款与净额审批']:
        s.funding==='advance'?['垫资规则、币种、资金来源、额度总额/已占用和审批权限有效，且本笔由有权人批准']:['D资金实际到账、可用且足额，N13银行入账核验已完成']),
      '已对本版本材料和当前全部资金参数完成人工终审；无未解决法律/合规/报关/付款问题'];
  }
  function validate(s) {
    const fail=m=>{throw new Error('记录格式错误：'+m);};
    const record=x=>x&&typeof x==='object'&&!Array.isArray(x);
    const text=(v,max)=>typeof v==='string'&&v.length<=max;
    if(!record(s)||s.format!=='export-material-review/v1'||s.schemaVersion!==schema.version)fail('不支持的版本');
    if(s.sourceAlignmentVersion!==undefined&&![0,1,2].includes(s.sourceAlignmentVersion))fail('原件关联版本');
    if(!text(s.transaction,100)||!['pre','post'].includes(s.mode)||!['advance','received'].includes(s.funding))fail('交易或分支');
    for(const k of ['amount','available','limit','occupied'])if(!text(s[k],30))fail('金额字段');
    for(const k of ['entries','documents','gates'])if(!record(s[k])||Object.keys(s[k]).length>1000)fail(k);
    if(!Array.isArray(s.events)||s.events.length>1000)fail('记录数量');
    const keys=['__proto__','constructor','prototype'];
    for(const [id,doc] of Object.entries(s.documents)) {
      if(keys.includes(id)||!record(doc)||!text(doc.name,250)||!Number.isSafeInteger(doc.size)||doc.size<=0||doc.size>20*1024*1024||!Number.isSafeInteger(doc.modified)||doc.modified<0||!/^[a-f0-9]{64}$/.test(doc.hash)||!['formal','reference'].includes(doc.kind))fail('文件元数据');
      if(id!==doc.hash)fail('文件摘要与ID不符');
    }
    for(const [key,e] of Object.entries(s.entries)){
      if(!slotMap.has(key)||!record(e)||!Array.isArray(e.docs)||e.docs.length>30||e.docs.some(id=>!Object.hasOwn(s.documents,id))||new Set(e.docs).size!==e.docs.length||!Number.isSafeInteger(e.revision)||e.revision<1)fail('材料槽');
      if(e.na!==null) {
        if(!canWaive(s,key)||!record(e.na)||!text(e.na.reason,2000)||e.na.reason.trim().length<4||!text(e.na.reviewer,80)||!e.na.reviewer.trim()||!text(e.na.time,60)||e.na.transaction!==s.transaction||e.na.revision!==e.revision)fail('不适用记录');
      }
      if(e.review!==null) {
        const r=e.review;
        if(!record(r)||!['passed','rejected'].includes(r.result)||!text(r.reason,2000)||r.reason.trim().length<4||!text(r.reviewer,80)||!r.reviewer.trim()||!text(r.time,60)||r.revision!==e.revision||!text(r.transaction,100)||r.transaction!==s.transaction||!text(r.signature,5000))fail('Review记录');
      }
    }
    for(const [key,g] of Object.entries(s.gates)) {
      const n=business.nodes.find(x=>x.id===key);
      if(!n||!record(g)||!text(g.reviewer,80)||!g.reviewer.trim()||!text(g.reason,2000)||g.reason.trim().length<4||!text(g.time,60)||g.transaction!==s.transaction||!text(g.signature,100000)||!Array.isArray(g.checks)||g.checks.length!==gateConditions(s,n).length||g.checks.some(c=>c!==true))fail('节点卡点');
    }
    for(const e of s.events)if(!record(e)||!text(e.time,60)||!text(e.action,300)||!text(e.node,20)||!text(e.reason,2000))fail('历史日志');
    return s;
  }
  function entry(s,key){return s.entries[key]||{docs:[],revision:1,review:null,na:null};}
  const signature=e=>JSON.stringify([...e.docs].sort())+':'+e.revision;
  function canWaive(s,key){
    const slot=slotMap.get(key);
    return !!slot?.conditional&&!!s.transaction.trim()&&
      !(key==='N04:output:2'&&s.mode==='pre')&&
      !(key==='N15:input:extra7'&&s.funding==='advance')&&
      !(key==='N15:input:1'&&s.funding==='received')&&
      !(key==='N17:output:1'&&s.mode==='pre')&&
      !(key==='N22:input:extra8'&&s.mode==='pre');
  }
  function status(s,key,available) {
    const e=entry(s,key),slot=slotMap.get(key);
    if(e.na&&canWaive(s,key)&&e.na.transaction===s.transaction&&e.na.revision===e.revision)return 'na';
    if(!e.docs.length)return 'missing';
    const docs=e.docs.map(id=>s.documents[id]);
    if(docs.some(d=>!d||d.kind!=='formal'))return 'reference';
    if(e.review?.result==='rejected')return 'rejected';
    if(e.review?.result==='passed'&&e.review.signature===signature(e)&&e.review.transaction===s.transaction){
      return e.docs.every(available)?'passed':'unavailable';
    }
    return 'pending';
  }
  function progress(s,node,available) {
    const slots=schema.slots.filter(x=>x.node===node);
    const active=slots.filter(x=>status(s,x.key,available)!=='na');
    const passed=active.filter(x=>status(s,x.key,available)==='passed');
    const percent=active.length?Math.floor(100*passed.length/active.length):0;
    return {total:active.length,passed:passed.length,waived:slots.length-active.length,percent,complete:active.length>0&&passed.length===active.length};
  }
  function coverage(s,node){
    const active=schema.slots.filter(x=>x.node===node&&status(s,x.key,()=>false)!=='na');
    const linked=active.filter(x=>entry(s,x.key).docs.length>0).length;
    return {total:active.length,linked,percent:active.length?Math.floor(100*linked/active.length):0};
  }
  function deps(s,n){
    return [...n.deps,...(n.branchDeps?.[s.mode]||[]),...(n.id==='N15'&&s.funding==='received'?['N13']:[])];
  }
  function materialSignature(s,node) {
    return JSON.stringify(schema.slots.filter(x=>x.node===node).map(x=>[x.key,entry(s,x.key)]));
  }
  function invalidate(s,node){
    const affected=new Set([node]);let changed=true;
    while(changed){changed=false;for(const n of business.nodes)if(!affected.has(n.id)&&deps(s,n).some(id=>affected.has(id))){affected.add(n.id);changed=true;}}
    affected.forEach(id=>delete s.gates[id]);
    return [...affected];
  }
  function imported(s){
    const copy=JSON.parse(JSON.stringify(validate(s)));
    for(const e of Object.values(copy.entries)){e.review=null;e.na=null;e.revision++;}
    copy.gates={};
    copy.events.unshift({time:new Date().toISOString(),node:'ALL',action:'导入备份',reason:'文件索引保留，旧Review、不适用及卡点结论全部转为待复核；重新选择文件后核验。'});
    copy.events=copy.events.slice(0,1000);
    return copy;
  }
  const api={blank,validate,entry,signature,status,progress,coverage,deps,gateConditions,canWaive,materialSignature,invalidate,imported};
  root.EXPORT_REVIEW_MODEL=api;
  if(typeof module!=='undefined')module.exports=api;
})(globalThis);
