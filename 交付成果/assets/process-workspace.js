'use strict';
(function(){
  const P=globalThis.EXPORT_PROCESSES,E=globalThis.EXPORT_ENTITY_FLOWS,$=id=>document.getElementById(id);
  const dialog=$('sequence-dialog'),editor=$('sequence-source'),preview=$('sequence-preview');
  let current=null,revision=0,renderNumber=0,dirty=false,baseline=null,storageBlocked=false,scale=1;
  const key=()=> (current.kind==='entity'?'export-entity-flow/v1/':'export-sequence/v1/')+current.id+'/'+current.mode;
  const currentNodes=()=>current.kind==='entity'?E.get(current.id).nodes.map(id=>EXPORT_BUSINESS.nodes.find(n=>n.id===id)):P.nodesFor(current.id,current.mode);
  const defaultSource=()=>current.kind==='entity'?E.source(current.id):P.sequence(current.id,current.mode);
  const error=message=>{$('sequence-error').textContent=message;$('sequence-error').hidden=!message;};
  const status=message=>{$('sequence-status').textContent=message;};
  function validSource(source){
    if(source.length>50000)throw new Error('源码不能超过50000个字符。');
    const pattern=current.kind==='entity'?/^\s*flowchart\s+(TD|LR|TB|RL|BT)\b/:/^\s*sequenceDiagram\b/;
    if(!pattern.test(source))throw new Error(current.kind==='entity'?'请使用 flowchart 格式的Mermaid实体流转图。':'请使用以 sequenceDiagram 开头的Mermaid时序图。');
    if(/%%\s*\{|^\s*---|^\s*links?\s|\b(?:javascript|https?|data):|<(?!br\s*\/?>)/im.test(source))throw new Error('不支持配置指令、外部链接或HTML；换行可使用 <br/>。');
  }
  function modified(){dirty=true;revision++;status('未保存；点击“更新预览”查看修改。');}
  function setScale(value){
    const svg=preview.querySelector('svg');
    if(!svg)return;
    scale=Math.min(2,Math.max(.08,value));
    const box=svg.viewBox.baseVal;
    svg.style.width=Math.round(box.width*scale)+'px';svg.style.height=Math.round(box.height*scale)+'px';
    $('sequence-scale').textContent=Math.round(scale*100)+'%';
  }
  function fit(){
    const svg=preview.querySelector('svg');
    if(svg)setScale(Math.min(1,Math.max(.08,($('sequence-viewport').clientWidth-32)/svg.viewBox.baseVal.width)));
  }
  async function render(){
    const source=editor.value,requestRevision=revision,id=++renderNumber;
    error('');status('正在绘制…');
    const staging=document.createElement('div');staging.className='sequence-staging';document.body.append(staging);
    try{
      validSource(source);
      if(!globalThis.EXPORT_MERMAID)throw new Error('本地Mermaid资源未加载，请保留完整assets/vendor目录。');
      const {svg}=await EXPORT_MERMAID.render('sequence-svg-'+id,source,staging);
      if(requestRevision!==revision||!dialog.open)return false;
      const parsed=new DOMParser().parseFromString(svg,'image/svg+xml');
      if(parsed.querySelector('parsererror')||parsed.documentElement.localName!=='svg')throw new Error('Mermaid未返回有效SVG。');
      parsed.querySelectorAll('script,foreignObject,iframe,a').forEach(el=>el.remove());
      for(const element of parsed.querySelectorAll('*')){
        for(const attr of [...element.attributes])if(/^on/i.test(attr.name)||/^(href|xlink:href)$/i.test(attr.name))element.removeAttribute(attr.name);
      }
      const safe=document.importNode(parsed.documentElement,true);
      preview.replaceChildren(safe);
      if(current.kind==='entity')fit();else setScale(.7);
      const normalize=s=>s.replace(/<br\s*\/?>|\s/g,'');
      if(current.kind!=='entity'){
        const missing=currentNodes().flatMap(n=>EXPORT_NODE_VALIDATION_RULES.forNode(n)).filter(r=>!normalize(source).includes(normalize(r.name)));
        if(missing.length)error('手工图未包含 '+missing.length+' 项默认核验说明；完整规则仍在对应节点详情中。');
        if(/N\d{2}-R\d{2}/.test(source))error('当前为本机保存的旧版详细图；点击“恢复默认”可预览简洁新版，保存后才替换旧记录。');
        else if(/participant \w+ as [ABEF] 系统自动|participant OPS as 运营|participant (?:A|B|E|F)(?:_H)? as/.test(source))error('当前为本机保存的旧版角色图；点击“恢复默认”可载入统一业务主体及人工审核员的新图，保存后才替换原记录。');
      }
      if(((current.kind==='sequence'&&current.id==='5')||(current.kind==='entity'&&current.id==='funds'))&&(/36个月|原路退款|B收益真实银行双边划转|收益账户/.test(source)))error('当前为本机保存的旧版资金图；请恢复默认，改用D在首次获批分账时从可用余额一次性结算服务费的规则后再保存。');
      if(((current.kind==='sequence'&&current.id==='5')||(current.kind==='entity'&&current.id==='funds'))&&(/结汇/.test(source)||!/贸易核验入账/.test(source)))error('当前为本机保存的旧版资金图；余额释放已改为“贸易核验入账”，由收款银行核验并确认实际入账及可用状态，CIPS仅为支付清算链路。点击“恢复默认”预览，显式保存后替换，不自动覆盖原记录。');
      if(current.kind==='sequence'&&current.id==='1'&&!/服务费.*300元|300元.*服务费/.test(source))error('当前图未包含每笔300元代理服务费约定；点击“恢复默认”预览新版，显式保存后才替换本机旧记录。');
      if(current.kind==='sequence'&&current.id==='1'&&/participant (?:TEAM|REVIEWER)|人工最终审批|审批未通过不生成交易单/.test(source))error('当前为本机保存的旧步骤一流程；新流程仅供应商、付款方首次提交及各自修改，供应商首次提交即创建交易。点击“恢复默认”预览，显式保存后才替换旧记录。');
      if(current.kind==='sequence'&&current.id==='1'&&/本方非对称签名|每次写入均验签|身份签名及原键/.test(source))error('当前保存图仍强制供应商私钥；新版已改无设备实名确认与证据，合同由第三方实名电子签。恢复默认预览，显式保存才替换。');
      if(current.kind==='sequence'&&current.id==='2'&&!/第三方实名电子签平台/.test(source))error('当前保存图是旧步骤二；新版包含签约依据独立批准、第三方实名电子签/核实归档/生效、改版和正式委托。恢复默认预览，显式保存才替换。');
      if(((current.kind==='sequence'&&current.id==='5')||(current.kind==='entity'&&current.id==='funds'))&&(!/CNH不可用余额/.test(source)||!/国内人民币可用余额/.test(source)||!/服务费/.test(source)||!/D承担/.test(source)||!/分账/.test(source)||!/可用余额/.test(source)||!/不减少A合同应付/.test(source)))error('当前图未包含D在首次获批分账时从可用余额结算服务费且不减少A合同应付的规则；点击“恢复默认”预览，显式保存后才替换本机旧记录。');
      if(((current.kind==='sequence'&&current.id==='5')||(current.kind==='entity'&&current.id==='funds'))&&(/0\.03%|万分之三|D承担两项费用|receipt_fee\s*(?:=|:|×)/.test(source)))error('当前图仍包含已取消的按本金比例收费规则；请恢复默认预览固定300元服务费方案，显式保存后替换旧记录。');
      $('sequence-rendered-nodes').textContent='包含节点：'+currentNodes().map(n=>n.id).join(' / ');
      status(dirty?'预览已更新，修改尚未保存。':'当前预览已载入。');
      return true;
    }catch(e){
      if(requestRevision===revision&&dialog.open){
        preview.replaceChildren();error('时序图无法绘制：'+e.message);status('未保存。请修正源码后重试。');
      }
      return false;
    }finally{staging.remove();}
  }
  function loadSaved(){
    storageBlocked=false;baseline=null;
    try{
      baseline=localStorage.getItem(key());
      if(baseline!==null){
        const record=JSON.parse(baseline);
        if(record.version!==1||typeof record.source!=='string'||record.source.length>50000)throw new Error('保存记录格式不正确');
        return record.source;
      }
    }catch(e){
      storageBlocked=true;
      error('无法读取本机时序图记录：'+e.message+'。当前显示默认图，保存已禁用；原记录未覆盖。');
    }
    return defaultSource();
  }
  async function open(id,mode='all',trigger=document.activeElement,kind='sequence'){
    if(dialog.open&&dirty&&!window.confirm('当前修改尚未保存，是否放弃并切换？')){
      $('diagram-select').value=current.kind+':'+current.id;return;
    }
    const returnFocus=dialog.open?current.trigger:trigger;
    current={id,mode,trigger:returnFocus,kind};dirty=false;revision++;
    const group=kind==='entity'?E.get(id):P.groups.find(g=>g.id===id);
    $('diagram-select').value=kind+':'+id;
    $('sequence-dialog-title').textContent=(kind==='entity'?group.name+' · 实体流转图':'流程'+id+' · '+group.name+' · 时序图');
    $('sequence-scope').textContent=kind==='entity'?group.entity+'。展示实体状态、业务主体交接及适用审批、条件分支与异常回路；非实时业务状态。':id==='1'?'步骤一仅供应商、付款方各首次提交一份，并允许修改本方原资料；无运营建单、邀请或人工终审。逐用例详细中间件时序及HTTP/Protocol Buffers映射见系统用例页。':group.source+'；'+({all:'完整分支',pre:'出口前预付款分支',post:'出口后付款分支'}[mode])+'。ABEF统一为业务主体，系统与运营工作台合一；人工审核员作为独立角色。蓝：系统处理（建设需求）；橙：人工经办／审核；绿：记录交接。完整规则见节点详情。';
    error('');editor.value=loadSaved();$('sequence-save').disabled=storageBlocked;
    $('sequence-node-links').replaceChildren(...currentNodes().map(n=>{
      const button=document.createElement('button');button.type='button';button.textContent=n.id+' '+n.title;
      button.onclick=()=>{if(close())EXPORT_APP.details(n.id);};return button;
    }));
    if(!dialog.open)dialog.showModal();
    const readError=$('sequence-error').textContent;
    await render();
    if(storageBlocked)error(readError);
  }
  function close(){
    if(dirty&&!window.confirm('当前修改尚未保存，是否放弃？'))return false;
    revision++;dirty=false;dialog.close();current?.trigger?.focus();return true;
  }
  async function save(){
    if(storageBlocked){error('本机记录读取失败，不能覆盖保存。');return;}
    const startRevision=revision,source=editor.value;
    if(!await render()||revision!==startRevision)return;
    try{
      if(localStorage.getItem(key())!==baseline)throw new Error('另一页面已修改此图；请先下载当前源码，再关闭并重新打开载入最新记录');
      const record=JSON.stringify({version:1,source,updatedAt:new Date().toISOString()});
      localStorage.setItem(key(),record);baseline=record;dirty=false;
      status('已保存到本机；下次打开相同流程和付款分支可继续编辑。');
    }catch(e){error('保存失败：'+e.message);status('修改未保存，源码仍在编辑框内，可下载保留。');}
  }
  function download(){
    const blob=new Blob([editor.value],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download=(current.kind==='entity'?'实体流转-'+current.id:'流程'+current.id)+'-'+current.mode+'.mmd';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function downloadPng(){
    const button=$('sequence-download-png'),startRevision=revision;
    const filename=(current.kind==='entity'?'实体流转-'+current.id:'流程'+current.id)+'-'+current.mode+'.png';
    let imageUrl=null;
    button.disabled=true;
    try{
      if(!await render()||startRevision!==revision)return;
      const svg=preview.querySelector('svg'),box=svg.viewBox.baseVal;
      if(!Number.isFinite(box.width)||!Number.isFinite(box.height)||box.width<=0||box.height<=0)throw new Error('图示尺寸无效，请重新生成预览。');
      const ratio=Math.min(2,16384/box.width,16384/box.height,Math.sqrt(16000000/(box.width*box.height)));
      const width=Math.max(1,Math.floor(box.width*ratio)),height=Math.max(1,Math.floor(box.height*ratio));
      const clone=svg.cloneNode(true);
      clone.removeAttribute('style');
      clone.setAttribute('width',String(width));clone.setAttribute('height',String(height));
      clone.setAttribute('xmlns','http://www.w3.org/2000/svg');
      imageUrl=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml;charset=utf-8'}));
      const image=new Image();
      await new Promise((resolve,reject)=>{
        image.onload=resolve;image.onerror=()=>reject(new Error('浏览器无法读取图示，请更新预览后重试。'));image.src=imageUrl;
      });
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
      const context=canvas.getContext('2d');
      if(!context)throw new Error('浏览器无法创建PNG画布。');
      context.fillStyle='#ffffff';context.fillRect(0,0,width,height);context.drawImage(image,0,0,width,height);
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('PNG编码失败，图示可能超出浏览器容量。')),'image/png'));
      if(startRevision!==revision||!dialog.open){status('图示已切换或源码已修改，未下载旧图；请重新点击下载PNG。');return;}
      const url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      status('已生成完整PNG（'+width+' × '+height+'，白色背景）'+(ratio<2?'；长图已按浏览器容量等比缩小。':'。'));
    }catch(e){
      if(startRevision===revision&&dialog.open){error('PNG下载失败：'+e.message);status('未生成PNG，请修正问题后重试。');}
    }finally{
      if(imageUrl)URL.revokeObjectURL(imageUrl);
      button.disabled=false;
    }
  }
  editor.addEventListener('input',modified);
  $('sequence-refresh').onclick=render;$('sequence-save').onclick=save;
  $('sequence-close').onclick=close;
  $('sequence-default').onclick=()=>{
    if(dirty&&!window.confirm('放弃当前未保存修改，恢复默认源码？'))return;
    editor.value=defaultSource();modified();render();
  };
  $('sequence-download').onclick=download;
  $('sequence-download-png').onclick=downloadPng;
  $('sequence-zoom-in').onclick=()=>setScale(scale+.1);
  $('sequence-zoom-out').onclick=()=>setScale(scale-.1);
  $('sequence-fit').onclick=fit;
  $('sequence-toggle-editor').onclick=()=>{
    const collapsed=dialog.classList.toggle('sequence-code-hidden');
    $('sequence-toggle-editor').textContent=collapsed?'编辑源码':'收起源码';
    $('sequence-toggle-editor').setAttribute('aria-expanded',String(!collapsed));
    if(current.kind==='entity')fit();
  };
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  window.addEventListener('beforeunload',event=>{if(dialog.open&&dirty){event.preventDefault();event.returnValue='';}});
  window.addEventListener('storage',event=>{
    if(dialog.open&&(event.key===key()||event.key===null)&&event.newValue!==baseline)error('另一页面更改了本机记录。当前源码仍保留；请下载后重新打开，避免覆盖。');
  });
  window.addEventListener('resize',()=>{if(dialog.open&&current.kind==='entity')fit();});
  for(const group of P.groups)$('diagram-select').add(new Option('流程'+group.id+' · '+group.name,'sequence:'+group.id));
  for(const flow of E.flows)$('diagram-select').add(new Option(flow.name+' · 实体流转图','entity:'+flow.id));
  $('diagram-select').onchange=()=>{
    const [kind,id]=$('diagram-select').value.split(':');
    open(id,kind==='entity'?'all':current.mode,current.trigger,kind);
  };
  $('process-sequences').replaceChildren(...P.groups.map(group=>{
    const b=document.createElement('button');b.type='button';b.textContent='流程'+group.id+' · '+group.name;
    b.onclick=()=>open(group.id,document.querySelector('#mode-buttons .selected').dataset.mode,b);return b;
  }));
  $('entity-flow-cards').replaceChildren(...E.flows.map(flow=>{
    const card=document.createElement('article'),title=document.createElement('h2'),p=document.createElement('p'),button=document.createElement('button');
    title.textContent=flow.name;p.textContent=flow.entity;button.textContent='查看实体流转图';
    button.onclick=()=>open(flow.id,'all',button,'entity');card.append(title,p,button);return card;
  }));
  globalThis.EXPORT_SEQUENCE={open};
})();
