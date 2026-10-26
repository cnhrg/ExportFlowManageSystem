'use strict';
(function(root){
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tabs=[['external','服务对外提供'],['internal','服务对内运营'],['outbound','对接外部服务']];
  const integrations=[['customs','关务报关'],['bank','银行资金'],['tax','税务办理']];
  let tab='external',integration='customs',catalog=[],initialized=false;
  const filters={external:{query:'',step:''},internal:{query:'',step:''}};
  const workspace=()=>root.EXPORT_SYSTEM_USECASES_WORKSPACE;
  const code=value=>'<pre class="s1-code" tabindex="0">'+esc(typeof value==='string'?value:JSON.stringify(value,null,2))+'</pre>';
  function useCases(domain,actors,cases){
    const height=100+cases.length*66;
    return '<div class="protocol-usecases"><svg viewBox="0 0 1020 '+height+'" role="img" aria-label="'+esc(domain)+'业务用例图"><rect x="240" y="12" width="530" height="'+(height-24)+'" rx="12" fill="#f5f8fe" stroke="#cddbed"/><text x="505" y="40" text-anchor="middle" class="protocol-svg-title">'+esc(domain)+'</text>'+
      actors.map(([name,side],i)=>{
        const x=side==='left'?110:910,y=90+i*110;
        return '<g stroke="#6c85a5" fill="none"><circle cx="'+x+'" cy="'+y+'" r="12"/><path d="M'+x+' '+(y+12)+'v30m-20-20h40m-20 20-18 20m18-20 18 20"/></g><text x="'+x+'" y="'+(y+83)+'" text-anchor="middle">'+esc(name)+'</text>';
      }).join('')+
      cases.map(([name,actorIndexes],i)=>{
        const y=80+i*66;
        return actorIndexes.map(index=>{
          const [,side]=actors[index],x=side==='left'?140:880,ay=110+index*110;
          return '<path d="M'+x+' '+ay+'L'+(side==='left'?305:705)+' '+y+'" stroke="#b9c9df" fill="none"/>';
        }).join('')+'<ellipse cx="505" cy="'+y+'" rx="200" ry="23" fill="#fff" stroke="#89a7d4"/><text x="505" y="'+(y+4)+'" text-anchor="middle">'+esc(name)+'</text>';
      }).join('')+'</svg></div><details><summary>文字版用例（可访问）</summary><ul>'+cases.map(([name,ids])=>'<li>'+esc(actors.filter((a,i)=>ids.includes(i)).map(a=>a[0]).join(' / ')+'：'+name)+'</li>').join('')+'</ul></details>';
  }
  const customsCases=[
    ['核验申报主体、委托授权 · N04',[0,1]],
    ['汇集合同、发票、箱单及运输资料 · N05—N06',[0,1]],
    ['生成出口申报草稿 · N07',[1]],
    ['校验字段、代码及随附单证一致性',[1]],
    ['供应商确认当前最终版 / 修订后重新确认 · N08',[0,1]],
    ['通过授权通道提交申报 · N09',[1,3]],
    ['接收技术 / 业务回执并去重关联',[1,3]],
    ['查询申报进度 / 超时核查避免重复申报',[1,3]],
    ['处理退单、补正及查验通知',[0,1,3]],
    ['登记放行 / 结关并归档正式回执',[1,2,3]],
    ['申请撤销 / 更正并跟踪办理结果',[0,1,3]]
  ];
  const bankCases=[
    ['查询来款 / 入账结果 · N11',[0,3]],['查询账户余额 / 可用与受限状态',[0,3]],['查询流水、回单及分页对账',[0,3]],['提交商业发票及贸易材料 · N12—N13',[0,1,3]],['贸易核验结果 / 实际可用状态查询',[0,3]],['出口代理向供应商付款 / 查询独立服务费实收',[0,1,3]],['查询转账终态及失败原因 · N17',[0,3]],['原路退款申请、审批与状态查询（扩展）',[0,1,3]],['异常挂账、对账差异及审计追溯',[0,2,3]]
  ];
  const taxCases=[
    ['准备代理出口证明材料 · N18',[0,1]],['核验申请主体、授权及主管渠道',[0,1,3]],['提交代理出口货物证明申请 · N19',[0,3]],['查询受理 / 补正 / 拒绝状态',[0,3]],['下载正式证明并交付供应商 · N20',[0,1,3]],['系统生成退税资料 / 人工审批 · N21',[1,2]],['授权经办提交退税申报',[1,3]],['接收补正通知、修订并重新审批',[1,2,3]],['查询处理结果 / 关联银行退税到账',[1,3]]
  ];
  function customs(){
    return '<div class="protocol-section-heading"><h3>关务 · API报关功能用例</h3><span>待实现 / 接口规范待取得</span></div>'+
      '<p class="protocol-notice">未找到可验证的现行公开报关API文档。当前仅展示需要实现的功能用例，不提供模拟申报或接口演示；以下用例是产品需求，不表示官方已提供对应API。实际实现须取得正式接口规范、企业授权并完成接入测试。</p>'+
      useCases('出口申报 · 待实现功能',[['供应商确认人','left'],['出口报关代理经办人','left'],['审计 / 归档人员','left'],['单一窗口 / 海关','right']],customsCases);
  }
  function bank(){
    return '<div class="protocol-section-heading"><h3>银行 API · 业务用例设计</h3><span>仅用例图 / 未接入银行</span></div>'+
      useCases('本系统银行适配层',[['出口代理财务经办人','left'],['独立资金审批人','left'],['审计 / 对账人员','left'],['收款 / 付款银行','right']],bankCases)+
      '<div class="protocol-cards"><article><h4>查询与通知</h4><p>入账、余额、流水、回单、贸易核验及转账结果：按账户 / 币种 / 银行流水号对账，分页游标、增量拉取与通知去重；银行通知不能直接当作已可用资金。</p></article><article><h4>资金动作控制</h4><p>材料提交与审批绑定版本；出口代理向供应商支付货款、供应商向出口代理另付服务费，分别核实。服务费不扣付款方来款或供应商货款；超时保持待核，不盲目重发付款，不自动释放受限余额。</p></article><article><h4>退款为扩展设计</h4><p>当前V1未匹配款仍受限挂账；原路退款扩展用例须另经业务、银行及合规确认，不改变现有资金流规则，不开放执行。</p></article></div><p class="protocol-notice">此处不假设银行已经提供对应API。接口范围、材料格式、签名证书、账户授权、跨境及退款可行性，均以签约银行开放能力和正式文档为准。CIPS为支付清算链路，不代替收款银行的贸易核验及可用状态确认。</p>';
  }
  function tax(){
    return '<div class="protocol-section-heading"><h3>税务局对接 · 业务用例设计</h3><span>仅用例图 / 官方渠道待确认</span></div>'+
      useCases('税务办理适配 / 结果登记',[['出口代理证明经办人','left'],['供应商 / 报关代理经办人','left'],['独立人工审核员','left'],['主管税务机关','right']],taxCases)+
      '<div class="protocol-cards"><article><h4>证明申请 · N18—N20</h4><p>出口报关代理准备配套材料，出口代理暂定主责申请并交付供应商；最终以主管税务机关确认的申请资格、权限及渠道为准。不得把模板或运输互代协议当作官方证明。</p></article><article><h4>退税申报 · N21</h4><p>本系统生成资料、人工审核后，由有权经办通过官方税务渠道申报。分别记录提交、受理、补正、处理结果和实际到账，不将内部审批当作税务批准。</p></article><article><h4>接口边界</h4><p>当前未确认可调用的公开税务申报API；先设计授权办理 / 正式回执登记。实际API、认证及证书、电子凭证验真和归档要求待主管机关或授权服务商确认。</p></article></div>';
  }
  const belongs=(entry,audience)=>entry.endpoint.audience===(audience==='external'?'外部服务':'内部运营');
  function caseButton(useCase){
    return '<button type="button" data-protocol-case="'+esc(useCase.id)+'" data-protocol-step="'+esc(useCase.step)+'">'+esc('步骤'+useCase.stepNumber+' · '+useCase.name)+'</button>';
  }
  function renderResults(){
    const {query,step}=filters[tab],words=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const all=catalog.filter(entry=>belongs(entry,tab));
    const shown=all.filter(entry=>(!step||String(entry.stepNumber)===step)&&words.every(word=>
      [entry.endpoint.method,entry.endpoint.path,entry.endpoint.rpc,entry.endpoint.detail,entry.endpoint.input,
        entry.endpoint.output,entry.endpoint.service,entry.endpoint.reqMsg,entry.endpoint.rspMsg,entry.file,
        ...entry.useCases.map(item=>item.name)].join(' ').toLocaleLowerCase().includes(word)));
    $('protocol-result-count').textContent='显示 '+shown.length+' / '+all.length+' 个接口';
    $('protocol-results').innerHTML=shown.length?shown.map(entry=>{
      const e=entry.endpoint,index=catalog.indexOf(entry);
      return '<details class="protocol-api" data-protocol-index="'+index+'"><summary>'+
        '<span class="protocol-method">'+esc(e.method)+'</span><code>'+esc(e.path)+'</code>'+
        '<span class="protocol-api-description">'+esc(e.detail)+'</span><small>'+esc(e.rpc+' · 步骤'+entry.stepNumber+(e.id==='notice'?' · 平台回调接收入口':''))+'</small>'+
        '</summary><div class="protocol-api-content"></div></details>';
    }).join(''):'<p class="protocol-empty">没有匹配的接口，请调整关键词或业务步骤。</p>';
  }
  function renderService(){
    const entries=catalog.filter(entry=>belongs(entry,tab)),{query,step}=filters[tab];
    const files=[...new Set(entries.map(entry=>entry.file))];
    const steps=[...new Map(entries.map(entry=>[entry.stepNumber,entry.stepName])).entries()];
    $('protocol-panel').innerHTML='<h3>'+tabs.find(([id])=>id===tab)[1]+'</h3>'+
      '<p>'+(tab==='external'?'供应商、付款方、物流公司、出口报关代理等外部使用方调用本系统的接口，另含第三方电子签署平台的回调接收入口。这里不是本系统调用银行或监管机关的协议。':
        '内部运营、独立审核及资金、关务、税务经办人员调用本系统的接口；内部受众和权限须单独核验，不能仅凭地址获得运营权限。')+'</p>'+
      '<p class="protocol-notice">以下为已分析的服务契约，不表示接口已经部署。两类入口属于同一个应用，Protocol Buffers服务名不代表微服务拆分。请求、响应、cURL及超时沿用各步骤规范；示例中的错误响应不是成功结果。</p>'+
      '<div class="protocol-filters"><label for="protocol-search">查找接口<input id="protocol-search" type="search" value="'+esc(query)+'" placeholder="用途、路径、RPC或消息名称"></label>'+
      '<label for="protocol-step-filter">协议所属步骤<select id="protocol-step-filter"><option value="">全部步骤</option>'+steps.map(([number,name])=>'<option value="'+number+'"'+(step===String(number)?' selected':'')+'>'+esc(name)+'</option>').join('')+'</select></label>'+
      '<button type="button" data-protocol-clear>清空筛选</button></div>'+
      '<p id="protocol-result-count" role="status" aria-live="polite"></p><div id="protocol-results"></div>'+
      '<details class="protocol-sources"><summary>完整Protocol Buffers文件 · '+files.length+'份</summary><p>ReqMsg / RspMsg引用的资源、枚举及公共类型以完整源码为准，保留原包名和文件结构。</p>'+
      files.map(file=>'<details><summary>'+esc(file)+'</summary>'+code(workspace().getProtocolSource(file))+
        '<a class="protocol-download" href="../'+esc(file)+'" download data-s1-download="'+esc(file)+'">下载 '+esc(file.split('/').pop())+'</a></details>').join('')+'</details>';
    renderResults();
  }
  function renderIntegration(){
    $('protocol-panel').innerHTML='<h3>对接外部服务</h3><p>本系统作为调用方，对接银行、海关、税务及签署平台。外部机构规范尚未确定，保留业务用例和授权、证据要求，不虚构厂商URL、报文或成功回执。</p>'+
      '<div id="protocol-integration-tabs" class="protocol-tabs" role="tablist" aria-label="外部服务用例分类">'+integrations.map(([id,label])=>
        '<button type="button" role="tab" id="protocol-integration-'+id+'" aria-controls="protocol-integration-panel" aria-selected="'+(integration===id)+'" tabindex="'+(integration===id?'0':'-1')+'" data-tab="'+id+'">'+label+'</button>').join('')+'</div>'+
      '<div id="protocol-integration-panel" role="tabpanel" tabindex="0" aria-labelledby="protocol-integration-'+integration+'"></div>'+
      '<details><summary>第三方电子签署平台 · 待确认厂商协议</summary><p>发起签署、查询原签署任务、获取签署件和证据包仍按步骤二用例拆解。平台回调接收接口归“服务对外提供”；发起厂商请求的协议须另取得正式规范。</p>'+
      caseButton({step:'two',stepNumber:2,id:'contract-sign',name:'发起并完成第三方实名签署'})+'</details>';
    renderIntegrationPanel();
    root.EXPORT_DESIGN_DIAGRAMS.bindTabs($('protocol-integration-tabs'),id=>{
      integration=id;renderIntegrationPanel();
      document.querySelectorAll('#protocol-integration-tabs [role="tab"]').forEach(button=>{
        const active=button.dataset.tab===id;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
      });
    });
  }
  function renderIntegrationPanel(){
    $('protocol-integration-panel').setAttribute('aria-labelledby','protocol-integration-'+integration);
    $('protocol-integration-panel').innerHTML=integration==='customs'?customs():integration==='bank'?bank():tax();
  }
  function render(){
    $('protocol-tabs').innerHTML=tabs.map(([id,text])=>'<button type="button" role="tab" id="protocol-tab-'+id+'" aria-controls="protocol-panel" aria-selected="'+(tab===id)+'" tabindex="'+(tab===id?'0':'-1')+'" data-tab="'+id+'">'+text+(id==='outbound'?'':' · '+catalog.filter(entry=>belongs(entry,id)).length)+'</button>').join('');
    $('protocol-panel').setAttribute('aria-labelledby','protocol-tab-'+tab);
    if(tab==='outbound')renderIntegration();else renderService();
  }
  function initialize(){
    if(initialized)return;initialized=true;
    catalog=workspace().getProtocolCatalog();
    render();
    root.EXPORT_DESIGN_DIAGRAMS.bindTabs($('protocol-tabs'),id=>{tab=id;render();});
    $('protocol-panel').addEventListener('input',event=>{
      if(event.target.id!=='protocol-search')return;
      filters[tab].query=event.target.value;renderResults();
    });
    $('protocol-panel').addEventListener('change',event=>{
      if(event.target.id!=='protocol-step-filter')return;
      filters[tab].step=event.target.value;renderResults();
    });
    $('protocol-panel').addEventListener('toggle',event=>{
      const detail=event.target;
      if(!detail.matches('.protocol-api')||!detail.open||detail.dataset.loaded)return;
      const entry=catalog[Number(detail.dataset.protocolIndex)];
      detail.querySelector('.protocol-api-content').innerHTML='<h4>关联用例与系统时序</h4>'+
        (entry.useCases.length?'<div class="protocol-case-links">'+entry.useCases.map(caseButton).join('')+'</div>':'<p>共用运营查询入口，当前没有绑定到单个业务目标；不额外编造用例。</p>')+
        workspace().renderProtocol(entry.endpoint,'h4')+
        '<details><summary>错误码与恢复规则 · '+esc(entry.stepName)+'</summary>'+
        root.EXPORT_DESIGN_DIAGRAMS.table(['业务码','HTTP','gRPC','可恢复','处置'],entry.errors.map(row=>[row[0],row[1]??'无响应',row[2],row[3]?'有条件':'否',row[4]]))+'</details>';
      detail.dataset.loaded='true';
    },true);
    $('protocol-panel').addEventListener('click',event=>{
      const link=event.target.closest('[data-s1-download]');
      if(link){event.preventDefault();workspace().downloadArtifact(link.dataset.s1Download);return;}
      const useCase=event.target.closest('[data-protocol-case]');
      if(useCase){
        workspace().show();workspace().selectStep(useCase.dataset.protocolStep);workspace().select(useCase.dataset.protocolCase);
        root.EXPORT_APP.showView('system-usecases');$('system-usecases-panel').focus();return;
      }
      if(event.target.closest('[data-protocol-clear]')){
        filters[tab]={query:'',step:''};renderService();$('protocol-search').focus();
      }
    });
  }
  root.EXPORT_PROTOCOLS={initialize};
})(globalThis);
