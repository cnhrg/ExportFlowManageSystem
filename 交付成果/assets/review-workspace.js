'use strict';
(function(root){
  const M=root.EXPORT_REVIEW_MODEL,S=root.EXPORT_REVIEW_SCHEMA,D=root.EXPORT_BUSINESS;
  const storeKey='export-material-review/v1';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const files=new Map(),viewed=new Set(),urls=new Set();
  const available=id=>files.has(id);
  let state=M.blank(),blocked=false,errorText='',host=null,nodeId=null,onChange=()=>{},activeSlot=null,operation=0,savedRaw=null;
  try{
    const saved=localStorage.getItem(storeKey);
    if(saved)state=M.validate(JSON.parse(saved));
    savedRaw=saved;
  }catch(e){blocked=true;errorText='无法读取本机审核记录：'+e.message+'。为避免覆盖，已停止写入；请先排查浏览器存储或保留现有备份。';}
  function notifyError(e){errorText=e.message;render();if($('review-dialog-error'))$('review-dialog-error').textContent=e.message;}
  function event(s,node,action,reason){s.events.unshift({time:new Date().toISOString(),node,action,reason});s.events=s.events.slice(0,1000);}
  function alignSources(s){
    if(s.sourceAlignmentVersion===2)return;
    const previous=s.sourceAlignmentVersion||0;
    if(previous===1){
      const backupKey=storeKey+':catalog-v2-backup:'+s.transaction;
      if(!localStorage.getItem(backupKey))localStorage.setItem(backupKey,JSON.stringify(s));
    }
    for(const doc of Object.values(s.documents)){
      const source=root.EXPORT_SOURCE_PREVIEWS[doc.sourceId];
      if(doc.kind==='reference'&&source?.hash===doc.hash)doc.name=source.name;
    }
    let count=0;
    for(const slot of S.slots){
      const e=M.entry(s,slot.key);
      const oldIds=new Set(e.docs.map(id=>s.documents[id].sourceId)),before=[...e.docs];
      if(previous===1)e.docs=e.docs.filter(id=>{
        const doc=s.documents[id],source=root.EXPORT_SOURCE_PREVIEWS[doc.sourceId];
        return !(doc.kind==='reference'&&source?.hash===id&&!slot.candidates.includes(doc.sourceId));
      });
      const editable=!e.docs.some(id=>s.documents[id].kind==='formal')&&!e.review&&!e.na;
      for(const sourceId of slot.candidates){
        if(!editable)continue;
        const material=D.materials.find(m=>m.id===sourceId);
        if(previous===1&&sourceId!=='M17'&&!material.parentId)continue;
        if(previous===1&&material.parentId&&slot.legacyCandidates.includes(material.parentId)&&!oldIds.has(material.parentId))continue;
        const source=root.EXPORT_SOURCE_PREVIEWS[sourceId];
        if(!source)throw new Error('已有材料索引缺失：'+sourceId);
        if(!s.documents[source.hash])s.documents[source.hash]={name:source.name,size:source.size,modified:source.modified,hash:source.hash,kind:'reference',sourceId};
        if(!e.docs.includes(source.hash)){e.docs.push(source.hash);count++;}
      }
      if(JSON.stringify(before)!==JSON.stringify(e.docs)){e.revision++;e.review=null;e.na=null;s.entries[slot.key]=e;M.invalidate(s,slot.node);}
    }
    s.sourceAlignmentVersion=2;
    event(s,'ALL','按新命名与Sheet材料更新关联',count+'条新增参考关联；模板/例子/说明分类，排除误名材料，不计本笔审核完成度。');
  }
  function replaceBuiltinReferences(s,e){
    e.docs=e.docs.filter(id=>!(s.documents[id].kind==='reference'&&s.documents[id].sourceId));
  }
  function commit(fn){
    if(blocked)throw new Error(errorText);
    if(localStorage.getItem(storeKey)!==savedRaw)throw new Error('其他页面已修改本机记录，请先刷新后再编辑，避免覆盖他人的修改。');
    const next=JSON.parse(JSON.stringify(state));
    fn(next);M.validate(next);
    const encoded=JSON.stringify(next);
    try{localStorage.setItem(storeKey,encoded);}catch(e){throw new Error('保存失败，修改未生效：'+e.message+'。请导出已有记录并检查存储权限/空间。');}
    savedRaw=encoded;
    state=next;errorText='';onChange();render();
  }
  function revoke(){for(const url of urls)URL.revokeObjectURL(url);urls.clear();}
  function dialog(title,body){
    revoke();operation++;
    $('review-dialog-title').textContent=title;
    $('review-dialog-body').innerHTML=body+'<p id="review-dialog-error" class="review-error" role="alert"></p>';
    if(!$('review-dialog').open)$('review-dialog').showModal();
  }
  function closeDialog(){$('review-dialog').close();revoke();operation++;}
  function displayText(text,notice=''){
    const pre=document.createElement('pre');pre.className='file-text';pre.textContent=text;
    const target=$('file-preview');target.replaceChildren();
    if(notice){const p=document.createElement('p');p.textContent=notice;p.className='preview-note';target.append(p);}
    target.append(pre);
  }
  function displaySheets(sheets,reference=false){
    const target=$('file-preview'),tabs=document.createElement('div'),tableHost=document.createElement('div'),note=document.createElement('p');
    tabs.className='sheet-tabs';tabs.setAttribute('role','group');tabs.setAttribute('aria-label','选择工作表');
    tableHost.className='sheet-scroll';note.className='preview-note';
    target.replaceChildren(note,tabs,tableHost);
    function select(index){
      const sheet=sheets[index];
      note.textContent=(reference?'脱敏参考表格：长数字及邮箱已遮蔽，不能计入本笔审核完成度。':'表格预览：')+'仅显示单元格值，不执行公式/宏；图像、签章及排版须核对原件。'+(sheet.limited?'本工作表超过预览范围，仅显示前500行、50列；必须外部核对全文。':'');
      tabs.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
      const table=document.createElement('table'),body=document.createElement('tbody');
      for(const row of sheet.rows){
        const tr=document.createElement('tr');
        for(const cell of row){const td=document.createElement('td');td.textContent=String(cell);tr.append(td);}
        body.append(tr);
      }
      table.append(body);tableHost.replaceChildren(table);
      if(!sheet.rows.length)tableHost.textContent='空工作表，无可预览单元格。';
    }
    sheets.forEach((sheet,index)=>{const b=document.createElement('button');b.textContent=sheet.name;b.onclick=()=>select(index);tabs.append(b);});
    if(sheets.length)select(0);else throw new Error('文件中没有可读取的工作表');
  }
  async function preview(file,id){
    const ticket=++operation;
    const target=$('file-preview');target.textContent='正在本地读取…';
    try{
      if(/\.(doc|docx|xlsx|xls|csv)$/i.test(file.name)){
        const result=await root.REVIEW_VENDOR.officeText(file.name,await file.arrayBuffer());
        if(ticket!==operation)return;
        if(result.sheets)displaySheets(result.sheets);
        else displayText(result.text.slice(0,600000),'文本预览，不含签章、图片或完整排版；请用原文件核实签署/盖章。'+(result.text.length>600000?'内容超长，预览仅前60万字符，须外部阅读全文。':'')+(result.warnings.length?'解析提示：'+result.warnings.join('；'):''));
      }else if(/\.(txt|json|md|xml)$/i.test(file.name)){
        const text=await file.text();if(ticket!==operation)return;
        displayText(text.slice(0,600000),text.length>600000?'预览截断，须使用本机应用核对完整内容。':'文本仅以纯文本显示，不执行文件内容。');
      }else if(/\.(pdf|png|jpg|jpeg|webp)$/i.test(file.name)){
        const url=URL.createObjectURL(file);urls.add(url);
        const el=document.createElement(/\.pdf$/i.test(file.name)?'iframe':'img');
        el.src=url;el.title=file.name;el.className='file-frame';
        if(el.tagName==='IFRAME')el.setAttribute('sandbox','');
        target.replaceChildren(el);
        const a=document.createElement('a');a.href=url;a.download=file.name;a.textContent='下载后用本机应用核对原件（如预览空白）';target.append(a);
      }else{
        const url=URL.createObjectURL(file);urls.add(url);
        const a=document.createElement('a');a.href=url;a.download=file.name;a.textContent='此格式不支持页内预览；下载并使用本机应用打开';
        target.replaceChildren(a);
      }
      if(/\.(doc|docx|xlsx|xls|csv|txt|json|md|xml)$/i.test(file.name)){
        const url=URL.createObjectURL(file);urls.add(url);
        const a=document.createElement('a');a.href=url;a.download=file.name;a.textContent='下载原文件，用本机应用核对完整内容与排版';target.append(a);
      }
      if(ticket===operation)viewed.add(id);
    }catch(e){if(ticket===operation){viewed.delete(id);target.textContent='读取失败：'+e.message+'。该文件不能记为已预览，请使用本机应用另存为受支持格式后重新选择。';}}
  }
  function referencePreview(id){
    const m=D.materials.find(x=>x.id===id),previewData=root.EXPORT_SOURCE_PREVIEWS?.[id];
    dialog('Review参考材料 · '+id,'<p>'+esc(m.file)+'</p><p class="preview-note">这是'+esc(m.kind)+'，Review只记录参考阅读，不计入本笔输入/输出完成度，不能替代正式凭证。</p><p><strong>原件审计提示：</strong>'+esc(m.status)+'<br>'+esc(m.suggest)+'</p><a target="_blank" rel="noopener" href="../'+m.file.split('/').map(encodeURIComponent).join('/')+'">打开原文件核对签章与原始排版 ↗</a><div id="file-preview"></div><label>阅读意见<textarea id="reference-comment" maxlength="1500" placeholder="可记录参考材料问题，不形成正式材料审核"></textarea></label><button id="reference-save">保存参考阅读意见</button>');
    if(previewData?.sheets)displaySheets(previewData.sheets,true);
    else if(previewData?.text)displayText(previewData.text,'脱敏参考文本：长数字及邮箱已遮蔽；须打开本地原件完整核对，不能据此核验签章。');
    else $('file-preview').textContent='此为图像/PDF参考，请打开上方原文件查看。';
    $('reference-save').onclick=()=>{try{
      const reason=$('reference-comment').value.trim();if(reason.length<4)throw new Error('请填写至少4个字的阅读意见。');
      commit(s=>event(s,nodeId,'参考材料Review '+id,reason));closeDialog();
    }catch(e){notifyError(e);}};
  }
  function gateValid(id,seen=new Set()){
    if(seen.has(id))return false;
    seen.add(id);
    const n=D.nodes.find(x=>x.id===id),g=state.gates[id];
    return !!g&&M.progress(state,id,available).complete&&g.signature===M.materialSignature(state,id)&&M.deps(state,n).every(dep=>gateValid(dep,new Set(seen)));
  }
  function progress(id){return M.progress(state,id,available);}
  function coverage(id){return M.coverage(state,id);}
  const statusLabel={passed:'Review通过',missing:'未关联',reference:'仅参考材料，不计完成',pending:'已关联，待Review',rejected:'Review退回',unavailable:'历史Review通过，须重选原文件核验',na:'已确认不适用'};
  function requirementsHtml(slot){
    return slot.q.map(id=>{const q=root.EXPORT_REVIEW_REQUIREMENTS[id];return '<p class="review-result"><strong>'+esc(id+' '+q.file)+'</strong><br>提交：'+esc(q.role)+'<br>内容：'+esc(q.content)+'<br>时点：'+esc(q.timing)+'<br>适用：'+esc(q.condition)+'<br>依据：'+esc(q.source+'；'+q.kind)+'</p>';}).join('');
  }
  function slotHtml(slot){
    const e=M.entry(state,slot.key),status=M.status(state,slot.key,available);
    const short={passed:'已通过',missing:'未关联',reference:'仅参考',pending:'待Review',rejected:'已退回',unavailable:'须重选',na:'不适用'};
    const counts=['template','example','instruction'].map((type,i)=>['模板','例子','说明'][i]+' '+e.docs.filter(id=>D.materials.find(m=>m.id===state.documents[id].sourceId)?.referenceType===type).length).join(' · ');
    return '<article class="material-slot compact-slot" data-slot="'+slot.key+'"><button class="slot-open" data-slot-detail="'+slot.key+'" aria-label="查看材料详情：'+esc(slot.label)+'"><span class="compact-slot-name">'+esc(slot.label)+'<small class="reference-counts">'+esc(counts)+'</small></span><span class="compact-slot-meta"><span class="tag '+(status==='passed'?'complete-tag':status==='na'?'':'warning')+'" title="'+esc(statusLabel[status])+'">'+short[status]+'</span><small>'+e.docs.length+'份</small><span aria-hidden="true">›</span></span></button></article>';
  }
  function slotDetailHtml(slot){
    const e=M.entry(state,slot.key),status=M.status(state,slot.key,available);
    const sources=slot.candidates.map(id=>D.materials.find(m=>m.id===id)).filter(m=>m?.file);
    const requirements=requirementsHtml(slot);
    const classification='<section class="reference-classification"><h4>模板、例子与填报说明</h4>'+[['template','模板'],['example','例子'],['instruction','填报说明'],['support','配套线索']].map(([type,label])=>{
      const materials=sources.filter(m=>m.referenceType===type);
      return '<p><strong>'+label+'：</strong>'+(materials.length?materials.map(m=>esc(m.id+' '+m.file.split('/').pop())+' <small>'+(e.docs.some(id=>state.documents[id].sourceId===m.id)?'已关联':'可手动关联')+'</small>').join('<br>'):'未提供')+'</p>';
    }).join('')+'</section>'+(slot.exclusions.length?'<div class="slot-conditional"><strong>明确排除／文件名待核（不计覆盖）</strong>'+slot.exclusions.map(id=>{const m=D.materials.find(m=>m.id===id);return '<p>'+esc(m.id+' '+m.file.split('/').pop())+'<br>'+esc(m.suggest)+'</p>';}).join('')+'</div>':'');
    return '<article class="material-slot slot-detail" data-slot="'+slot.key+'"><div class="slot-title"><strong>'+esc(slot.label)+'</strong><span class="tag '+(status==='passed'?'complete-tag':status==='na'?'':'warning')+'">'+statusLabel[status]+'</span></div><small>'+esc(slot.q.length?slot.q.join(' / '):'节点操作交付 / 新增控制，见来源')+'</small>'+(requirements?'<details open><summary>应提交内容、责任与原指引依据</summary>'+requirements+'</details>':'')+(slot.conditional?'<p class="slot-conditional">条件适用：'+esc(slot.conditional)+'</p>':'')+
      classification+'<div class="attached-files">'+e.docs.map(id=>{const doc=state.documents[id],m=D.materials.find(m=>m.id===doc.sourceId),label=doc.kind==='formal'?'本笔正式材料':({template:'模板',example:'例子',instruction:'填报说明',support:'配套线索'}[m?.referenceType]||'参考材料');return '<div><span>'+esc(doc.name)+'</span><small>'+esc(label)+' · SHA256 '+id.slice(0,10)+' · '+(doc.sourceId?'已关联本地参考索引':available(id)?'本次可读取':'须重新选择')+'</small><button data-file-view="'+id+'" data-key="'+slot.key+'">查看 / Review</button><button data-unlink="'+id+'" data-key="'+slot.key+'">移除</button></div>';}).join('')+'</div>'+
      (e.review?'<p class="review-result">'+esc(e.review.reviewer)+' · '+esc(e.review.time)+'<br>'+esc(e.review.reason)+'</p>':'')+(e.na?'<p class="review-result">不适用：'+esc(e.na.reviewer)+' / '+esc(e.na.reason)+'</p>':'')+
      '<div class="slot-actions"><button data-associate="'+slot.key+'">手动关联文件</button><button data-review="'+slot.key+'" '+(!e.docs.length?'disabled':'')+'>Review已关联材料</button>'+(slot.conditional?'<button data-na="'+slot.key+'">确认不适用</button>':'')+'</div>'+
      (sources.length?'<details><summary>已有参考资料（'+sources.length+'）· 可Review，不计完成</summary>'+sources.map(m=>'<div class="reference-row"><span>'+m.id+' '+esc(m.file.split('/').pop())+'</span><button data-reference="'+m.id+'">Review</button></div>').join('')+'</details>':'')+'</article>';
  }
  function slotDetails(key){
    const slot=S.slots.find(x=>x.key===key);
    dialog('材料详情 · '+slot.label,slotDetailHtml(slot));
    $('review-dialog-body').onclick=handleAction;
  }
  function render(){
    if(!host||!nodeId)return;
    const n=D.nodes.find(x=>x.id===nodeId),p=progress(nodeId),c=coverage(nodeId);
    $('node-progress').innerHTML='<span class="progress-chip" title="材料关联覆盖率：'+c.linked+'/'+c.total+'项已关联（含参考），不代表材料齐全或通过" aria-label="材料关联覆盖率 '+c.percent+'%"><span aria-hidden="true">▣</span> '+c.percent+'%</span><span class="progress-chip reviewed" title="资料审核完成度：'+p.passed+'/'+p.total+'项正式材料通过；'+p.waived+'项不适用。资料100%不等于节点放行" aria-label="资料审核完成度 '+p.percent+'%"><span aria-hidden="true">✓</span> '+p.percent+'%</span>';
    host.innerHTML=(errorText?'<p class="review-error" role="alert">'+esc(errorText)+'</p>':'')+
      ['input','output'].map(direction=>'<h4>'+ (direction==='input'?'输入材料 · 关联与Review':'输出材料 · 关联与Review')+'</h4>'+S.slots.filter(x=>x.node===nodeId&&x.direction===direction).map(slotHtml).join('')).join('')+
      '<section class="node-validation-rules"><h4>本节点校验规则集</h4><p class="preview-note">人工核验标准／系统设计要求，不是已执行的自动校验结果。资料100%不等于业务放行。</p>'+
      root.EXPORT_NODE_VALIDATION_RULES.forNode(n,state).map(rule=>'<details class="validation-rule"><summary>'+esc(rule.id+' · '+rule.name)+'</summary><dl>'+[['适用范围',rule.applicability],['应核证据',rule.evidence],['判定标准',rule.check],['不通过处理',rule.failure],['责任与依据',rule.reviewer+'；'+rule.source]].map(([label,value])=>'<dt>'+label+'</dt><dd>'+esc(value)+'</dd>').join('')+'</dl></details>').join('')+'</section>';
    host.onclick=handleAction;
  }
  function handleAction(event){
    const b=event.target.closest('button');if(!b)return;
    try{
      if(b.dataset.slotDetail)slotDetails(b.dataset.slotDetail);
      else if(b.dataset.associate)associate(b.dataset.associate);
      else if(b.dataset.review)review(b.dataset.review);
      else if(b.dataset.reference)referencePreview(b.dataset.reference);
      else if(b.dataset.na)notApplicable(b.dataset.na);
      else if(b.dataset.fileView){const doc=state.documents[b.dataset.fileView],f=files.get(b.dataset.fileView);if(doc.sourceId&&doc.kind==='reference'){referencePreview(doc.sourceId);if(f)preview(f,b.dataset.fileView);}else{review(b.dataset.key);if(f)preview(f,b.dataset.fileView);}}
      else if(b.dataset.unlink){commit(s=>{const e=M.entry(s,b.dataset.key);e.docs=e.docs.filter(id=>id!==b.dataset.unlink);e.revision++;e.review=null;e.na=null;s.entries[b.dataset.key]=e;M.invalidate(s,nodeId);eventLog(s,'移除材料关联',state.documents[b.dataset.unlink].name);});slotDetails(b.dataset.key);}
    }catch(e){notifyError(e);}
  }
  function eventLog(s,action,reason){event(s,nodeId,action,reason);}
  function associate(key){
    activeSlot=key;
    dialog('关联材料 · '+S.slots.find(x=>x.key===key).label,'<p>可关联多份文件，以覆盖该项要求。正式材料须是本笔交易真实文件；已知源模板/历史样例即使重选也只按参考材料处理。单个文件限20MB，不上传。</p><label>新增文件性质<select id="association-kind"><option value="formal">本笔正式材料（后续仍须Review）</option><option value="reference">模板/历史样例/参考</option></select></label><input id="associate-files" type="file" multiple><p>也可从本机已关联材料库复用；每个输入/输出槽仍须单独Review：</p><select id="library-doc"><option value="">选择已关联文件</option>'+Object.entries(state.documents).map(([id,d])=>'<option value="'+id+'">'+esc(d.name)+'（'+esc(d.kind)+'）</option>').join('')+'</select><button id="link-library">关联选中文件</button>');
    $('associate-files').onchange=async()=>{
      const token=key,selected=[...$('associate-files').files],kind=$('association-kind').value,ticket=operation;
      if(!selected.length)return;
      $('associate-files').disabled=true;
      try{
        if(!crypto.subtle)throw new Error('浏览器不支持本地SHA256，请使用较新Chrome/Edge。');
        const records=[];
        for(const f of selected){
          if(!f.size||f.size>20*1024*1024)throw new Error(f.name+'为空或超过20MB。');
          const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await f.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('');
          const known=Object.values(root.EXPORT_SOURCE_PREVIEWS||{}).some(x=>x.hash===hash);
          records.push({id:hash,file:f,meta:{name:f.name,size:f.size,modified:f.lastModified,hash,kind:known?'reference':kind}});
        }
        if(ticket!==operation||!$('review-dialog').open)return;
        const oldRuntime=new Map(files);
        records.forEach(x=>files.set(x.id,x.file));
        try{commit(s=>{
          const e=M.entry(s,token),before=JSON.stringify(e.docs);let changed=false;
          if(records.some(r=>(s.documents[r.id]||r.meta).kind==='formal'))replaceBuiltinReferences(s,e);
          for(const r of records){
            if(!Object.hasOwn(s.documents,r.id))s.documents[r.id]=r.meta;
            if(!e.docs.includes(r.id)){e.docs.push(r.id);changed=true;}
          }
          if(changed||before!==JSON.stringify(e.docs)){e.revision++;e.review=null;e.na=null;M.invalidate(s,slotNode(token));}
          s.entries[token]=e;event(s,slotNode(token),'关联/恢复本地文件',records.map(r=>r.meta.name).join('；'));
        });}catch(e){files.clear();oldRuntime.forEach((v,k)=>files.set(k,v));throw e;}
        closeDialog();
      }catch(e){notifyError(e);if($('associate-files'))$('associate-files').disabled=false;}
    };
    $('link-library').onclick=()=>{
      try{const id=$('library-doc').value;if(!id)throw new Error('请先选择已有文件。');
        commit(s=>{const e=M.entry(s,key),before=JSON.stringify(e.docs);if(s.documents[id].kind==='formal')replaceBuiltinReferences(s,e);if(!e.docs.includes(id))e.docs.push(id);if(before!==JSON.stringify(e.docs)){e.revision++;e.review=null;e.na=null;s.entries[key]=e;M.invalidate(s,slotNode(key));event(s,slotNode(key),'复用文件关联',s.documents[id].name);}});closeDialog();
      }catch(e){notifyError(e);}
    };
  }
  const slotNode=key=>S.slots.find(x=>x.key===key).node;
  function review(key){
    const slot=S.slots.find(x=>x.key===key),e=M.entry(state,key);
    dialog('Review · '+slot.label,'<p>逐份查看，再针对整项要求填写审核结果。预览只辅助阅读；签章、真实性及全部细项须人工核实。参考文件不得批准为本笔完成。</p><div class="review-file-buttons">'+e.docs.map(id=>'<button data-preview-id="'+id+'">'+esc(state.documents[id].name)+' · '+(available(id)?'查看':'需重选')+'</button>').join('')+'</div><div id="file-preview"></div><p>SHA256 / 版本签名：'+esc(M.signature(e))+'</p><label>审核人<input id="material-reviewer" maxlength="80"></label><label>审核结论<select id="review-decision"><option value="passed">通过：本笔材料完整有效</option><option value="rejected">退回：缺失/不一致/不适用</option></select></label><label>核查依据及意见<textarea id="material-review-reason" maxlength="2000"></textarea></label><label class="check"><input type="checkbox" id="review-attest">已查看全部关联文件（必要时本机应用阅读全文），核实交易/批次、真实性、有效性及本材料槽的全部要求；不是模板/历史样例。</label><button id="save-material-review">保存Review结果</button>');
    $('review-dialog-body').insertAdjacentHTML('afterbegin','<button data-slot-detail="'+key+'">‹ 返回材料详情</button><details><summary>核对应提交内容与适用条件</summary>'+requirementsHtml(slot)+(slot.conditional?'<p>'+esc(slot.conditional)+'</p>':'')+'</details>');
    $('review-dialog-body').querySelectorAll('[data-preview-id]').forEach(b=>b.onclick=()=>{
      const f=files.get(b.dataset.previewId);
      const doc=state.documents[b.dataset.previewId];
      if(doc.sourceId&&doc.kind==='reference'){const source=root.EXPORT_SOURCE_PREVIEWS[doc.sourceId];if(source.sheets)displaySheets(source.sheets,true);else displayText(source.text,'自动关联参考资料，不能计入正式材料审核完成度。请从材料“查看 / Review”打开原件并记录参考意见。');return;}
      if(!f){$('file-preview').textContent='文件内容不在本次会话。请关闭后“手动关联文件”重新选择原文件，摘要一致时可恢复索引。';return;}
      preview(f,b.dataset.previewId);
    });
    $('save-material-review').onclick=()=>{
      try{
        const reviewer=$('material-reviewer').value.trim(),reason=$('material-review-reason').value.trim(),result=$('review-decision').value;
        if(!state.transaction.trim())throw new Error('请先在本机业务记录中填写交易/批次编号。');
        if(!reviewer||reason.length<4)throw new Error('审核人必填，意见至少4个字。');
        if(result==='passed'){
          if(!e.docs.length||e.docs.some(id=>state.documents[id].kind!=='formal'))throw new Error('含模板/历史样例/参考材料，不能记为正式材料完成；请补齐本笔文件。');
          if(e.docs.some(id=>!available(id)||!viewed.has(id)))throw new Error('请先逐份查看所有关联文件；不可读取时须重新选择。');
          if(!$('review-attest').checked)throw new Error('须确认已经核验全部细项。');
        }
        commit(s=>{const current=M.entry(s,key);current.na=null;current.review={result,reviewer,reason,time:new Date().toISOString(),revision:current.revision,signature:M.signature(current),transaction:s.transaction};s.entries[key]=current;M.invalidate(s,slot.node);event(s,slot.node,'材料Review '+result,slot.label+'：'+reason);});
        closeDialog();
      }catch(err){notifyError(err);}
    };
  }
  function notApplicable(key){
    const slot=S.slots.find(x=>x.key===key);
    dialog('适用性审核 · '+slot.label,'<p>'+esc(slot.conditional)+'</p><label>审核人<input id="na-reviewer" maxlength="80"></label><label>不适用依据（不能用来豁免硬性要求）<textarea id="na-reason" maxlength="2000"></textarea></label><button id="save-na">记录不适用</button><button id="clear-na">恢复为需提交</button>');
    $('save-na').onclick=()=>{try{
      const reviewer=$('na-reviewer').value.trim(),reason=$('na-reason').value.trim();
      if(!state.transaction.trim()||!reviewer||reason.length<4)throw new Error('先设置交易编号，并填写审核人及至少4个字的依据。');
      if(key==='N04:output:2'&&state.mode==='pre')throw new Error('预付款模式不能豁免B认可F。');
      if(slot.node==='N15'&&slot.key.includes('extra')&&state.funding==='advance')throw new Error('B垫资分支不能豁免授信资料。');
      if(!M.canWaive(state,key))throw new Error('当前付款分支不能豁免该项必要证据或预付台账/清偿核对记录。');
      commit(s=>{const e=M.entry(s,key);e.review=null;e.revision++;e.na={reviewer,reason,time:new Date().toISOString(),transaction:s.transaction,revision:e.revision};s.entries[key]=e;M.invalidate(s,slot.node);event(s,slot.node,'不适用确认',slot.label+'：'+reason);});closeDialog();
    }catch(e){notifyError(e);}};
    $('clear-na').onclick=()=>{try{commit(s=>{const e=M.entry(s,key);e.na=null;e.review=null;e.revision++;s.entries[key]=e;M.invalidate(s,slot.node);});closeDialog();}catch(e){notifyError(e);}};
  }
  function saveCase(){
    try{
      const transaction=$('case-id').value.trim();
      if(!transaction)throw new Error('交易/批次编号不能为空。');
      if(state.transaction&&transaction!==state.transaction)throw new Error('不能把原交易审核迁移到另一交易。请先导出备份，再使用“更换交易”清空后设置。');
      const mode=$('case-mode').value,funding=$('case-funding').value;
      const amounts=Object.fromEntries(['amount','available','limit','occupied'].map(k=>[k,$('case-'+k).value]));
      commit(s=>{
        const conditionalChanged=s.mode!==mode||s.funding!==funding;
        s.transaction=transaction;s.mode=mode;s.funding=funding;Object.assign(s,amounts);s.gates={};
        if(conditionalChanged)for(const key of Object.keys(s.entries))if(S.slots.find(x=>x.key===key).conditional){s.entries[key].na=null;s.entries[key].review=null;s.entries[key].revision++;}
        event(s,'ALL','业务上下文更新','分支/金额设置已保存，节点卡点审批全部失效；分支变化时条件项重审。');
      });
      closeDialog();
    }catch(e){notifyError(e);}
  }
  function exportRecords(){
    try{
      const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download='材料Review备份_'+(state.transaction||'未指定').replace(/[^\w\u4e00-\u9fff-]/g,'_')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch(e){notifyError(e);}
  }
  function initialize(){
    try{if(state.sourceAlignmentVersion!==2)commit(alignSources);}catch(e){blocked=true;notifyError(new Error('材料索引初始化/迁移失败，已停止写入，请备份后排查并刷新：'+e.message));}
    $('review-dialog-close').onclick=closeDialog;
    $('review-settings').onclick=()=>{
      dialog('材料审核设置','<div class="review-context"><p>本机文件索引与审核记录设置；重开后需重选原件恢复可读状态，导入备份须重新Review。</p><label>交易/批次编号<input id="case-id" maxlength="100" value="'+esc(state.transaction)+'"></label><label>付款模式<select id="case-mode"><option value="post" '+(state.mode==='post'?'selected':'')+'>出口后付款</option><option value="pre" '+(state.mode==='pre'?'selected':'')+'>出口前预付款</option></select></label><label>预付资金来源<select id="case-funding"><option value="received" '+(state.funding==='received'?'selected':'')+'>已到账可用资金</option><option value="advance" '+(state.funding==='advance'?'selected':'')+'>B垫资</option></select></label><div class="review-amounts">'+[['amount','拟付CNY'],['available','可用余额CNY'],['limit','垫资额度CNY'],['occupied','已占用CNY']].map(([id,label])=>'<label>'+label+'<input id="case-'+id+'" value="'+esc(state[id])+'" inputmode="decimal" maxlength="30"></label>').join('')+'</div><button id="save-case">保存交易与分支设置</button><div class="slot-actions"><button id="export-reviews">导出记录备份</button><button id="import-reviews">导入备份（重审）</button></div><small>更换交易须先导出原记录，并清空当前材料审核；分支/金额变化使卡点审批失效。此为本机工作记录，不是真实审批系统。</small></div>');
      $('save-case').onclick=saveCase;
      $('export-reviews').onclick=exportRecords;
      $('import-reviews').onclick=()=>{$('review-import-file').value='';$('review-import-file').click();};
    };
    $('review-dialog').addEventListener('close',()=>{revoke();operation++;});
    $('review-import-file').onchange=async()=>{
      try{
        const file=$('review-import-file').files[0];if(!file)return;
        if(file.size>12*1024*1024)throw new Error('备份超过12MB限制。');
        const incoming=M.imported(JSON.parse(await file.text()));
        alignSources(incoming);
        dialog('导入备份将替换本机工作记录','<p>导入交易：'+esc(incoming.transaction)+'。先导出当前记录可避免丢失。备份不含文件内容；所有Review、不适用及卡点结论重新核验。</p><button id="confirm-import">确认替换并重新审核</button>');
        $('confirm-import').onclick=()=>{try{commit(s=>{for(const k of Object.keys(s))delete s[k];Object.assign(s,incoming);});files.clear();viewed.clear();onChange();render();closeDialog();}catch(e){notifyError(e);}};
      }catch(e){notifyError(e);}
    };
    $('change-transaction').onclick=()=>{
      dialog('更换交易前请先导出备份','<p>会清空当前文件索引、Review与卡点记录；不删除任何原始文件。新交易不能继承旧交易批准。</p><button id="confirm-new-case">确认清空，创建新交易记录</button>');
      $('confirm-new-case').onclick=()=>{try{commit(s=>{for(const k of Object.keys(s))delete s[k];Object.assign(s,M.blank());alignSources(s);});files.clear();viewed.clear();onChange();render();closeDialog();}catch(e){notifyError(e);}};
    };
  }
  root.EXPORT_REVIEW_WORKSPACE={mount(el,id,cb){host=el;nodeId=id;onChange=cb;render();},initialize,progress,coverage,gateValid,
    getState:()=>JSON.parse(JSON.stringify(state)),repaint:render};
})(globalThis);
