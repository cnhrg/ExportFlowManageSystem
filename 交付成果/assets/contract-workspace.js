'use strict';
(function(root){
  const M=root.EXPORT_CONTRACT_MODEL,D=root.EXPORT_BUSINESS;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $=id=>document.getElementById(id);
  const statuses={draft:'待独立审核',approved:'已模拟审核 · 待用章授权',sealed:'双方用章准备完成 · 尚未签署',submitted:'已模拟提交 · 待外部签署回执',failed:'模拟提交失败 · 可重试',archived:'模拟签署归档 · 非真实合同'};
  const storageKey='export-econtracts/prototype-v1';
  let records=[],savedRaw=null,blocked='',selected='',kind='agency',role='drafter',values={},revision='',origin=null,step=0;
  function sourceLink(material){
    return '<a href="../'+material.file.split('/').map(encodeURIComponent).join('/')+'" target="_blank" rel="noopener">'+esc(material.id+' · '+material.file.split('/').pop())+'</a><small>'+esc(material.kind)+' · 参考材料，不是本笔已签原件</small>';
  }
  function materials(ids){
    return D.materials.filter(m=>m.file&&ids.includes(m.id)).map(m=>'<li>'+sourceLink(m)+'</li>').join('');
  }
  function paper(filled=false){
    const t=M.template(kind),v=filled?values:{},field=key=>esc(v[key]||'________________');
    return '<article class="contract-paper contract-blank"><div class="contract-paper-brand">CONTRACT / '+esc(t.source)+'</div><h3>'+esc(t.name)+'</h3><p class="contract-paper-note">依据材料模板整理的'+(filled?'填写预览':'空白版式')+' · 非原件复刻</p>'+
      '<p>合同编号：'+field('number')+'<br>签订日期：'+field('date')+'<br>交易 / 批次：'+field('transaction')+' / '+field('batch')+'</p>'+
      '<p><b>甲方（'+esc(t.parties[0])+'）</b><br>'+field('partyA')+'<br>注册号：'+field('codeA')+'<br>地址：'+field('addressA')+'<br>授权代表：'+field('signerA')+'</p>'+
      '<p><b>乙方（'+esc(t.parties[1])+'）</b><br>'+field('partyB')+'<br>注册号：'+field('codeB')+'<br>地址：'+field('addressB')+'<br>授权代表：'+field('signerB')+'</p>'+
      '<h4>一、合同标的</h4><p>'+esc(t.terms)+'</p><p>'+field('goods')+' / '+field('quantity')+' '+field('unit')+'<br>单价：'+field('price')+' · 总金额：'+field('amount')+' '+field('currency')+'</p>'+
      [['二、服务范围','scope'],['三、代理服务费及其他费用','fees'],['四、结算与付款','payment'],['五、交付约定','delivery'],['六、有效期','validity'],['七、争议解决','disputes'],['八、补充约定','changes']].map(([label,key])=>'<h4>'+label+'</h4><p>'+field(key)+'</p>').join('')+
      '<div class="contract-seal-row"><div>甲方签章<div class="contract-seal">待授权<br>甲方签章位</div></div><div>乙方签章<div class="contract-seal">待授权<br>乙方签章位</div></div></div></article>';
  }
  function templateScreen(){
    const t=M.template(kind);
    return '<div class="contract-template-layout"><div><h3>选择合同模板</h3><p>来自材料文件夹；历史主体与日期不自动带入。</p><div class="contract-template-cards">'+M.templates.map(item=>'<button type="button" data-contract-kind="'+item.id+'" class="'+(kind===item.id?'active':'')+'"><span class="contract-file-icon">DOC</span><strong>'+esc(item.name)+'</strong><small>'+esc(item.source+' · '+item.parties.join(' / '))+'</small></button>').join('')+'</div>'+
      '<div class="contract-actions">'+button('start-fill','使用此模板 → 填充信息',role!=='drafter')+'</div><details><summary>查看原始模板及使用提醒</summary><ul class="contract-source-list">'+materials([t.source])+'</ul><p>'+esc(t.risk)+'</p></details></div>'+
      '<div><div class="contract-preview-label">空白模板预览 <span>'+esc(t.source)+'</span></div>'+paper()+'</div></div>';
  }
  function readStored(){
    try{
      savedRaw=localStorage.getItem(storageKey);
      if(!savedRaw)return;
      const data=JSON.parse(savedRaw);
      if(data.schema!==1||!Array.isArray(data.records))throw new Error('电子合同记录格式不受支持');
      for(const r of data.records){
        M.template(r.template);
        if(!r.id||!Number.isInteger(r.version)||r.version<1||!Object.hasOwn(statuses,r.status)||!r.values||M.validate(r.values).length||!r.source?.text||!r.source.hash||!Array.isArray(r.history)||!Array.isArray(r.seals))throw new Error('电子合同记录不完整');
      }
      records=data.records;
    }catch(error){blocked='本机合同记录无法读取，已停止写入以保留原记录：'+error.message;}
  }
  function persist(next){
    if(blocked)throw new Error(blocked);
    if(localStorage.getItem(storageKey)!==savedRaw)throw new Error('另一个页面已修改合同记录，请刷新后继续，避免覆盖。');
    const encoded=JSON.stringify({schema:1,records:next});
    localStorage.setItem(storageKey,encoded);
    savedRaw=encoded;records=next;
    document.dispatchEvent(new CustomEvent('contracts-updated'));
  }
  const current=()=>records.find(r=>r.id===selected);
  function button(action,text,disabled=false){
    return '<button type="button" data-contract-action="'+action+'"'+(disabled?' disabled':'')+'>'+esc(text)+'</button>';
  }
  function form(){
    const t=M.template(kind);
    return '<form id="contract-form"><div class="contract-form-heading"><h3>'+(revision?'修订合同 · 旧审批 / 用章 / 回执失效':'按交易信息生成合同草稿')+'</h3><label>候选合同模板<select id="contract-template"'+(revision?' disabled':'')+'>'+M.templates.map(item=>'<option value="'+item.id+'"'+(kind===item.id?' selected':'')+'>'+esc(item.name+' · '+item.source)+'</option>').join('')+'</select></label></div>'+
      '<details><summary>模板使用提醒 / 原始文件</summary><p>'+esc(t.risk)+'</p><ul class="contract-source-list">'+materials([t.source])+'</ul></details>'+
      '<div class="contract-actions">'+button('fill-dossier','带入当前交易资料',role!=='drafter')+button('fill-demo','填入合成交易示例',role!=='drafter')+'</div>'+
      '<p>双方角色：'+esc(t.parties.join(' / '))+'。缺失信息需人工补齐；不会复制模板中的历史签约方、账户或日期。</p>'+
      '<fieldset class="contract-fields"'+(role!=='drafter'?' disabled':'')+'>'+M.fields.map(([key,label])=>'<label class="'+(['scope','fees','payment','delivery','validity','disputes','changes'].includes(key)?'wide':'')+'">'+esc(label)+
        (['scope','fees','payment','delivery','validity','disputes','changes'].includes(key)?'<textarea name="'+key+'" required rows="2">'+esc(values[key])+'</textarea>':'<input name="'+key+'" required maxlength="300" type="'+(key==='date'?'date':['quantity','price','amount'].includes(key)?'number':'text')+'"'+(['quantity','price','amount'].includes(key)?' min="0.01" step="0.01"':'')+' value="'+esc(values[key])+'"'+(revision&&['transaction','batch'].includes(key)?' readonly':'')+'>')+'</label>').join('')+'</fieldset>'+
      '<div class="contract-actions">'+button('back-template','← 空白模板')+'<button type="submit"'+(role!=='drafter'||blocked?' disabled':'')+'>'+(revision?'生成修订版并重新审核':'生成合同 → 电子盖章')+'</button></div></form>';
  }
  function request(record){
    return {notice:'内部适配层设计示例，不是法大大API字段；未发送网络请求',
      provider:'法大大（外包电子合同系统）',businessId:record.id,contractVersion:record.version,
      transactionId:record.values.transaction,batch:record.values.batch,
      templateSource:record.source.id,templateFileHash:record.source.hash,
      documentFormat:'生产环境：服务端生成并固化PDF或经供应商确认的版式文件；本原型仅文本/HTML草稿',
      idempotencyKey:record.submission?.key||record.id+'-v'+record.version,
      signers:[{party:'甲方',name:record.values.partyA,representative:record.values.signerA,anchor:'甲方签章区'},{party:'乙方',name:record.values.partyB,representative:record.values.signerB,anchor:'乙方签章区'}],
      workflow:['企业 / 签署人身份核验','电子印章授权及签署意愿确认','创建 / 发起签署任务','在法大大授权页面完成签署','服务端校验通知并查询任务终态','下载签署原文、验签报告及存证材料'],
      security:'密钥只存后端；按已开通版本官方文档签名验签，时间窗/重放防护、事件去重及业务ID/版本/文件摘要绑定。参数与API路径待沙箱联调确认。'};
  }
  function preview(r){
    const t=M.template(r.template),ready=role==='sealer';
    return '<section class="contract-preview"><header><div><small>'+esc(r.id+' / V'+r.version)+'</small><h3>'+esc(t.name)+'</h3></div><span>'+esc(statuses[r.status])+'</span></header>'+
      '<div class="contract-actions">'+button('revise','修订当前版本',role!=='drafter'||r.status==='submitted')+button('download','下载演示合同 HTML')+button('download-request','下载提交数据示例 JSON')+'</div>'+
      '<article class="contract-paper"><div class="contract-watermark">演示合同 · 不具签署效力</div><pre>'+esc(M.documentText(r).split('----- 原模板参考附件开始 -----')[0])+'</pre><div class="contract-seal-row">'+['A','B'].map((party,index)=>'<div><strong>'+esc(index===0?r.values.partyA:r.values.partyB)+'</strong><div class="contract-seal'+(r.seals.includes(party)?' visible':'')+'">演示专用<br>非有效印章<br>'+party+'方签章位</div><small>签章位：文末'+(index===0?'左侧':'右侧')+' · 实际坐标由外包模板控件确认</small></div>').join('')+'</div></article>'+
      '<details><summary>原模板全文参考（脱敏文本，不是本笔签署正文）</summary><pre class="contract-template-text">'+esc(r.source.text)+'</pre></details>'+
      (r.status==='draft'?'<section class="contract-review"><h4>独立人工审核 · 当前 V'+r.version+'</h4>'+['主体、签署人、企业身份及委托链已核对','模板全文及修订差异已Review，服务费 / 两日付款 / 汇率冲突已书面统一','固定人民币300元服务费由D承担，首次获批分账时从D已核验可用余额结算；D授权及收费依据齐备，A合同应付不因该费用减少','电子签署适用性、相关方意愿及用章授权依据已确认'].map(text=>'<label><input type="checkbox" data-contract-check'+(role!=='reviewer'?' disabled':'')+'>'+esc(text)+'</label>').join('')+'<label>审核意见<textarea id="contract-review-reason" rows="2"'+(role!=='reviewer'?' disabled':'')+'></textarea></label>'+button('approve','模拟独立审核通过',role!=='reviewer')+'</section>':'')+
      (step===2&&['approved','sealed'].includes(r.status)?'<section class="contract-sign-controls"><h4>电子盖章 · 双方签章位</h4><p>红色印章仅为演示贴图，不生成数字签名。</p><div class="contract-actions">'+button('seal-A','盖甲方演示章',!ready||r.seals.includes('A'))+button('seal-B','盖乙方演示章',!ready||r.seals.includes('B'))+button('next-submit','下一步 → 提交电子合同',r.status!=='sealed')+'</div></section>':'')+
      (step===3&&r.status==='sealed'?'<section class="contract-submit-card"><span class="contract-file-icon">EC</span><h3>合同已就绪，待提交</h3><p>'+esc(r.values.number)+' · V'+r.version+' · 双方演示章齐备</p><p>提交对象：法大大电子合同平台（未接入）</p>'+button('submit','模拟提交电子合同',!ready)+'<p>提交后等待外部签署，不自动认定生效。</p></section>':'')+
      (r.status==='failed'?'<p class="contract-warning">提交失败不代表已签署，保留相同业务幂等键；生产环境须先查询外部任务再决定是否重试。</p>'+button('submit','模拟重试提交（同幂等键）',!ready):'')+
      (r.status==='submitted'?'<section><h4>外包回执演示 · 等待，不自动标记完成</h4><p>真实对接：先验通知签名、防重放，再查询任务状态并校验文档摘要、双方签名、证书链 / 有效期 / 吊销状态及时间证据。只有校验通过才归档。</p><div class="contract-actions">'+button('success','模拟双方签署、验签通过并归档',!ready)+button('failure','模拟外包拒绝 / 提交失败',!ready)+'</div></section>':'')+
      '<details><summary>法大大适配层 · 提交内容与技术边界</summary><pre class="contract-request">'+esc(JSON.stringify(request(r),null,2))+'</pre></details>'+
      (step===3&&r.status==='archived'?'<section class="contract-submit-card contract-complete"><h3>✓ 模拟签署归档完成</h3><p>'+esc(r.values.number)+' · V'+r.version+' · 非真实有效合同</p>'+button('download','下载演示合同 HTML')+'</section>':'')+
      '<details><summary>版本 / 操作留痕（本机演示，可被本机修改，非可信审计）</summary><div class="contract-actions">'+(r.previousVersions||[]).map(v=>button('download-v'+v.version,'下载历史草稿 V'+v.version)).join('')+'</div><ol>'+r.history.map(e=>'<li>'+esc(e.time+' · '+e.action)+'</li>').join('')+'</ol></details></section>';
  }
  function standards(){
    return '<details class="contract-standards"><summary>核心技术设计 · 法大大集成与国家规范对照</summary>'+
      '<div class="contract-design-grid"><article><h4>业务系统负责</h4><p>交易 / 批次关联、模板准入与版本、合同字段及条款差异、独立审批、用章授权、签章位置、业务幂等键、失败补偿及归档索引。</p></article><article><h4>外包电子合同系统负责</h4><p>按已开通产品完成企业与签署人核验、意愿确认、印章及证书服务、授权签署、数字签名、任务进度与签署文件交付。跨境主体的支持范围和认证方式须先向供应商确认。</p></article></div>'+
      '<table><thead><tr><th>依据 / 属性</th><th>产品与技术控制设计</th><th>原型状态</th></tr></thead><tbody>'+
      '<tr><td>《电子签名法》第13、14条 · 法律</td><td>签名制作数据专有及签署时控制；签名与文书改动可发现；可靠电子签名的法律效力。图像印章本身不满足这些条件。</td><td>仅设计对照；未认证、未签名</td></tr>'+
      '<tr><td>GB/T 38540—2020《信息安全技术 安全电子签章密码技术规范》 · 推荐性国家标准</td><td>电子印章及电子签章数据结构、生成与验证；由供应商提供适用实现及检测依据，不能以贴图代替密码签章。</td><td>待供应商技术评估；不宣称符合性</td></tr>'+
      '<tr><td>归档与证据链 · 实施设计</td><td>签署原文、文件摘要、证书链、签名验证结果、时间证据、授权 / 意愿记录与操作流水关联同一合同版本；保存期限按适用法律及业务要求确定。</td><td>本机草稿及模拟记录，不是电子证据包</td></tr>'+
      '</tbody></table><p>GB/T推荐性标准与法律要求分开呈现；标准状态、适用行业及供应商能力须在上线时重新核实。提交成功不等于签署完成，签署完成也不自动放行业务、付款或报关。</p>'+
      '<p class="contract-official-links"><a href="https://open.fadada.com/" target="_blank" rel="noopener">法大大开放平台</a> · <a href="https://dev.fadada.com/api-doc" target="_blank" rel="noopener">法大大官方文档入口</a> · <a href="https://std.samr.gov.cn/gb/search/gbDetailed?id=A0280129494AEBB4E05397BE0A0AB6FE" target="_blank" rel="noopener">GB/T 38540—2020 官方标准信息</a> · <a href="https://wap.miit.gov.cn/zwgk/zcwj/flfg/art/2022/art_4ed0e4a46946479c90a9e0f2c76a11ef.html" target="_blank" rel="noopener">《电子签名法》官方文本</a></p></details>';
  }
  function render(){
    const r=current();
    const maxStep=r?(['sealed','submitted','failed','archived'].includes(r.status)?3:2):1;
    $('contract-body').innerHTML='<p class="contract-demo-note">本机演示 · 无真实电子印章或网络提交 · 已生成合同刷新保留，未生成草稿不保存 · 请勿录入真实敏感资料</p>'+
      (blocked?'<p role="alert" class="contract-error">'+esc(blocked)+'</p>':'')+
      '<nav class="contract-stepper" aria-label="电子合同四步流程">'+['空白模板','填充信息','电子盖章','提交电子合同'].map((label,index)=>'<button type="button" data-contract-step="'+index+'" class="'+(step===index?'current':index<step?'done':'')+'"'+(index>maxStep?' disabled':'')+(step===index?' aria-current="step"':'')+'><b>'+(index<step?'✓':String(index+1).padStart(2,'0'))+'</b><span>'+label+'</span></button>').join('')+'</nav>'+
      '<div class="contract-toolbar"><label>演示岗位<select id="contract-role">'+[['drafter','业务经办'],['reviewer','独立审核员'],['sealer','用章授权人']].map(([id,name])=>'<option value="'+id+'"'+(role===id?' selected':'')+'>'+name+'</option>').join('')+'</select></label>'+button('new','＋ 新建合同',role!=='drafter')+
      '<label>本机合同<select id="contract-record"><option value="">选择已生成合同</option>'+records.map(item=>'<option value="'+esc(item.id)+'"'+(item.id===selected?' selected':'')+'>'+esc(item.values.number+' · V'+item.version+' · '+statuses[item.status])+'</option>').join('')+'</select></label></div>'+
      '<div class="contract-main">'+(step===0?templateScreen():step===1?'<div class="contract-fill-layout">'+form()+'<div class="contract-live-preview"><div class="contract-preview-label">填充后预览</div><div id="contract-live-paper">'+paper(true)+'</div></div></div>':r?preview(r):'')+'</div>'+standards();
    if(step>=2&&r?.seals.length){
      const paperElement=$('contract-body').querySelector('.contract-preview>.contract-paper');
      paperElement.scrollTop=paperElement.scrollHeight;
    }
  }
  function capture(){
    const form=$('contract-form');
    if(form)values={...values,...Object.fromEntries(new FormData(form))};
  }
  function message(text){$('contract-message').textContent=text;}
  function download(name,content,type){
    const url=URL.createObjectURL(new Blob([content],{type})),link=document.createElement('a');
    link.href=url;link.download=name;document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function fillDossier(){
    const data=origin?.values?origin:root.EXPORT_CAPABILITY_WORKSPACE?.getContractContext();
    if(!data)throw new Error('建档入口尚未初始化，请先打开业务操作');
    const v=data.values,t=M.template(kind);
    values={...values,transaction:origin?.transaction||values.transaction||'DEMO-EX-001',batch:origin?.batch||values.batch||'LOT-01',
      number:v.contractNo||'',partyA:v.aName||'',codeA:v.aCode||'',addressA:v.aAddress||'',
      partyB:kind==='agency'?v.bName||'':kind==='sales'?v.cName||'':'',codeB:kind==='agency'?v.bCode||'':kind==='sales'?v.cCode||'':'',
      addressB:kind==='sales'?v.cAddress||'':'',goods:[v.goods,v.spec].filter(Boolean).join(' / '),
      quantity:v.quantity||'',unit:v.unit||'',price:v.unitPrice||'',amount:v.totalValue||'',currency:v.currency||'',
      scope:kind==='agency'?v.bInstruction||'':t.terms,fees:[v.serviceFeeAmount&&'代理服务费：人民币'+v.serviceFeeAmount+'元 / 交易单',v.serviceFeePayer&&'承担方：'+v.serviceFeePayer,v.serviceFeeMethod].filter(Boolean).join('；')||'代理服务费固定人民币300元 / 交易单，由D承担并在首次获批分账时从D可用余额结算；须有D书面授权，不减少A合同应付。',
      delivery:[v.eRoute,v.cDelivery].filter(Boolean).join('；')};
    if(revision){const old=records.find(r=>r.id===revision);values.transaction=old.values.transaction;values.batch=old.values.batch;}
    render();message('已带入'+(data.source||'本页建档字段')+'（未自动认定为已批准）。缺失签署人、地址、条款及授权仍须补齐；实际买卖方和物流委托链需人工确认。');
  }
  function fillDemo(){
    values={transaction:'DEMO-EX-001',batch:'LOT-01',number:'DEMO-'+kind.toUpperCase()+'-'+String(records.length+1).padStart(3,'0'),date:new Date().toISOString().slice(0,10),
      partyA:'A合成供应商有限公司',codeA:'DEMO-A-001',addressA:'合成甲方地址（非真实）',signerA:'甲方演示授权人',
      partyB:kind==='agency'?'B合成贸易代理有限公司':kind==='logistics'?'E合成物流有限公司':'境外合成买方有限公司',
      codeB:'DEMO-COUNTERPART-001',addressB:'合成乙方地址（非真实）',signerB:'乙方演示授权人',
      goods:'合成家居收纳用品 / DEMO-01',quantity:'1200',unit:'件',price:'8.50',amount:'10200',currency:'USD',
      scope:M.template(kind).terms,fees:'演示：代理服务费固定为每笔人民币300元，由D承担并在首次获批分账时从D已核验可用余额结算；D授权及收费依据必须齐备，不减少A合同应付。不按货值比例抽佣；INVOICE申报、补件及改版不触发结算。银行实际费用凭证列示并按合同承担。',
      payment:'演示：适用付款分支、单证及资金门禁全部通过并经独立审批后执行；银行实际汇率及费用以本笔有效凭证为准。',
      delivery:'演示：按本笔确认的运输计划及交付地点执行；销售贸易术语 / 保险与物流报价须按实际合同复核。',
      validity:'演示：双方通过合法有效电子签署后生效；至本笔履约及结算完毕。',
      disputes:'演示：先协商；协商不成按双方书面确认的适用法律及有管辖权法院处理，签前法务复核。',
      changes:'演示拟议修订：不复用历史主体、地址、账户和日期；逐项统一费用承担、付款时点、汇率与门禁；完整条款以双方审核版本为准。'};
    if(origin?.transaction)values.transaction=origin.transaction;
    if(revision){const old=records.find(r=>r.id===revision);values.transaction=old.values.transaction;values.batch=old.values.batch;}
    render();message('已填入合成数据，仅供走通原型，不是已审核的交易或法律条款。');
  }
  function perform(action){
    capture();
    const r=current();
    if(['new','fill-demo','fill-dossier','revise'].includes(action)&&role!=='drafter')throw new Error('仅业务经办可起草或修订');
    if(action==='new'){selected='';revision='';values={};step=0;render();message('');return;}
    if(action==='start-fill'){
      if(role!=='drafter')throw new Error('仅业务经办可填写合同');
      if(r){
        if(r.status==='submitted')throw new Error('外部任务处理中，须先核实回执，不能修订');
        kind=r.template;values={...r.values};revision=r.id;selected='';
      }
      step=1;render();return;
    }
    if(action==='back-template'){step=0;render();return;}
    if(action==='fill-demo'){fillDemo();return;}
    if(action==='fill-dossier'){fillDossier();return;}
    if(!r)throw new Error('请先生成或选择合同');
    if(action==='revise'){
      if(r.status==='submitted')throw new Error('外部任务处理中，须先核实 / 撤销任务，不能直接修订');
      selected='';revision=r.id;kind=r.template;values={...r.values};step=1;render();message('修订生成新版本；旧版本审批、用章和回执保留在历史记录但不可沿用。');return;
    }
    if(action==='next-submit'){
      if(r.status!=='sealed')throw new Error('须先完成当前版本独立审核及双方用章');
      step=3;render();return;
    }
    if(action==='download'||/^download-v\d+$/.test(action)){
      const version=action==='download'?r:(r.previousVersions||[]).find(v=>v.version===Number(action.slice(10)));
      if(!version)throw new Error('历史合同版本不存在');
      const stamps=version.seals.map(p=>'<p style="color:#b42318;border:2px dashed #b42318;padding:12px">演示专用 · 非有效印章 · '+p+'方签章位</p>').join('');
      download('DEMO-'+version.id+'-v'+version.version+'.html','<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>演示合同草稿</title><body><pre style="white-space:pre-wrap">'+esc(M.documentText(version))+'</pre>'+stamps+'</body></html>','text/html;charset=utf-8');return;
    }
    if(action==='download-request'){download('DEMO-'+r.id+'-request.json',JSON.stringify(request(r),null,2),'application/json');return;}
    const op=action.startsWith('seal-')?'seal':action;
    const next=M.act(r,op,{role,party:action.split('-')[1],checks:[...$('contract-body').querySelectorAll('[data-contract-check]')].map(input=>input.checked),reason:$('contract-review-reason')?.value,requestId:r.submission?.requestId});
    persist(records.map(item=>item.id===r.id?next:item));
    if(['submitted','failed','archived'].includes(next.status))step=3;
    render();message('已保存本机演示状态：'+statuses[next.status]+'。没有向法大大提交真实合同，也不会改变节点审核结论。');
  }
  function open(node='N02',recordId='',context=null,trigger=null){
    origin=context;
    const r=records.find(item=>item.id===recordId);
    selected=r?.id||'';kind=r?.template||M.templates.find(t=>t.nodes.includes(node))?.id||'agency';revision='';values=r?{...r.values}:{};
    step=r?(['sealed','submitted','failed','archived'].includes(r.status)?3:2):0;
    if(context?.transaction)values.transaction=context.transaction;
    render();message(node==='N04'?'附件4仅有流程图，无法生成报关合同。请先补正式正文；可查看其他已提供候选模板。':'');
    document.querySelector('#navigation [data-view="contracts"]').click();
  }
  function initialize(){
    readStored();
    const host=$('contract-workspace');
    render();
    document.addEventListener('click',event=>{
      const entry=event.target.closest('[data-contract-open]');
      if(entry&&!host.contains(entry))open(entry.dataset.contractOpen||'N02','',null,entry);
    });
    host.addEventListener('click',event=>{
      try{
        const stage=event.target.closest('[data-contract-step]');
        if(stage&&!stage.disabled){
          capture();
          const target=Number(stage.dataset.contractStep),r=current();
          if(target===1&&r){
            if(role!=='drafter'||r.status==='submitted')throw new Error('请由业务经办修订；处理中任务须先核实回执');
            revision=r.id;kind=r.template;values={...r.values};selected='';
          }
          step=target;render();message('');return;
        }
        const action=event.target.closest('[data-contract-action]');
        if(action){perform(action.dataset.contractAction);return;}
        const picker=event.target.closest('[data-contract-kind]');
        if(picker){if(role!=='drafter')throw new Error('请切换业务经办后选择起草模板');kind=picker.dataset.contractKind;M.template(kind);selected='';revision='';values={};step=0;render();message('');}
      }catch(error){message('操作未完成：'+error.message);}
    });
    host.addEventListener('input',event=>{
      if(event.target.closest('#contract-form')){capture();$('contract-live-paper').innerHTML=paper(true);}
    });
    host.addEventListener('change',event=>{
      if(event.target.id==='contract-role'){capture();role=event.target.value;render();message('');}
      if(event.target.id==='contract-record'){
        const r=records.find(item=>item.id===event.target.value);
        selected=r?.id||'';revision='';values=r?{...r.values}:{};if(r)kind=r.template;
        step=r?(['sealed','submitted','failed','archived'].includes(r.status)?3:2):0;render();message('');
      }
      if(event.target.id==='contract-template'){capture();kind=event.target.value;values={};render();message('切换模板后已清空字段，避免沿用其他合同条款。');}
    });
    host.addEventListener('submit',event=>{
      if(event.target.id!=='contract-form')return;
      event.preventDefault();
      try{
        if(role!=='drafter')throw new Error('仅业务经办可生成合同');
        capture();
        const t=M.template(kind),previous=records.find(r=>r.id===revision);
        if(previous?.status==='submitted')throw new Error('外部签署任务处理中，不能修订');
        const id=previous?.id||'EC-DEMO-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
        const next=M.generate(kind,values,root.EXPORT_SOURCE_PREVIEWS[t.source],id,previous);
        persist(previous?records.map(r=>r.id===id?next:r):[...records,next]);
        selected=id;revision='';step=2;render();message('草稿已生成并保存至本机，请切换独立审核员核验当前版本。');
      }catch(error){message('生成未完成：'+error.message);}
    });
  }
  root.EXPORT_CONTRACTS={initialize,open};
})(globalThis);
