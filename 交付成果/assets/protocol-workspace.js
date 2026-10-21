'use strict';
(function(root){
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let tab='customs';
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
    ['A确认当前最终版 / 修订后重新确认 · N08',[0,1]],
    ['通过授权通道提交申报 · N09',[1,3]],
    ['接收技术 / 业务回执并去重关联',[1,3]],
    ['查询申报进度 / 超时核查避免重复申报',[1,3]],
    ['处理退单、补正及查验通知',[0,1,3]],
    ['登记放行 / 结关并归档正式回执',[1,2,3]],
    ['申请撤销 / 更正并跟踪办理结果',[0,1,3]]
  ];
  const bankCases=[
    ['查询来款 / 入账结果 · N11',[0,3]],['查询账户余额 / 可用与受限状态',[0,3]],['查询流水、回单及分页对账',[0,3]],['提交INVOICE及贸易材料 · N12—N13',[0,1,3]],['贸易核验结果 / 实际可用状态查询',[0,3]],['提交付款：B→A / B收益双边划转',[0,1,3]],['查询转账终态及失败原因 · N17',[0,3]],['原路退款申请、审批与状态查询（扩展）',[0,1,3]],['异常挂账、对账差异及审计追溯',[0,2,3]]
  ];
  const taxCases=[
    ['准备代理出口证明材料 · N18',[0,1]],['核验申请主体、授权及主管渠道',[0,1,3]],['提交代理出口货物证明申请 · N19',[0,3]],['查询受理 / 补正 / 拒绝状态',[0,3]],['下载正式证明并交付A · N20',[0,1,3]],['系统生成退税资料 / 人工审批 · N21',[1,2]],['授权经办提交退税申报',[1,3]],['接收补正通知、修订并重新审批',[1,2,3]],['查询处理结果 / 关联银行退税到账',[1,3]]
  ];
  function customs(){
    return '<div class="protocol-section-heading"><h3>关务 · API报关功能用例</h3><span>待实现 / 接口规范待取得</span></div>'+
      '<p class="protocol-notice">未找到可验证的现行公开报关API文档。当前仅展示需要实现的功能用例，不提供模拟申报或接口演示；以下用例是产品需求，不表示官方已提供对应API。实际实现须取得正式接口规范、企业授权并完成接入测试。</p>'+
      useCases('出口申报 · 待实现功能',[['A 最终版确认人','left'],['F 授权申报经办','left'],['审计 / 归档人员','left'],['单一窗口 / 海关','right']],customsCases);
  }
  function bank(){
    return '<div class="protocol-section-heading"><h3>银行 API · 业务用例设计</h3><span>仅用例图 / 未接入银行</span></div>'+
      useCases('本系统银行适配层',[['B 财务经办','left'],['独立资金审批人','left'],['审计 / 对账人员','left'],['收款 / 付款银行','right']],bankCases)+
      '<div class="protocol-cards"><article><h4>查询与通知</h4><p>入账、余额、流水、回单、贸易核验及转账结果：按账户 / 币种 / 银行流水号对账，分页游标、增量拉取与通知去重；银行通知不能直接当作已可用资金。</p></article><article><h4>资金动作控制</h4><p>材料提交与审批绑定版本；B→A付款及B收益双边划转须分权审批、限额、幂等和终态查询。超时保持待核，不自动重试、不自动释放受限余额。</p></article><article><h4>退款为扩展设计</h4><p>当前V1未匹配款仍受限挂账；按本次要求列出原路退款扩展用例，须另经业务、银行及合规确认，不改变现有资金流规则，不开放执行。</p></article></div><p class="protocol-notice">此处不假设银行已经提供对应API。接口范围、材料格式、签名证书、账户授权、跨境及退款可行性，均以签约银行开放能力和正式文档为准。CIPS为支付清算链路，不代替收款银行的贸易核验及可用状态确认。</p>';
  }
  function tax(){
    return '<div class="protocol-section-heading"><h3>税务局对接 · 业务用例设计</h3><span>仅用例图 / 官方渠道待确认</span></div>'+
      useCases('税务办理适配 / 结果登记',[['B 证明经办','left'],['A / F 授权经办','left'],['独立人工审核员','left'],['主管税务机关','right']],taxCases)+
      '<div class="protocol-cards"><article><h4>证明申请 · N18—N20</h4><p>F准备资料、B暂定主责申请并交付A；最终以主管税务机关确认的申请资格、权限及渠道为准。不得把模板或运输互代协议当作官方证明。</p></article><article><h4>退税申报 · N21</h4><p>本系统生成资料、人工审核后，由有权经办通过官方税务渠道申报。分别记录提交、受理、补正、处理结果和实际到账，不将内部审批当作税务批准。</p></article><article><h4>接口边界</h4><p>当前未确认可调用的公开税务申报API；先设计授权办理 / 正式回执登记。实际API、认证及证书、电子凭证验真和归档要求待主管机关或授权服务商确认。</p></article></div>';
  }
  function render(){
    $('protocol-tabs').innerHTML=[['customs','关务 · API报关'],['bank','银行 API'],['tax','税务局对接']].map(([id,text])=>'<button type="button" role="tab" id="protocol-tab-'+id+'" aria-controls="protocol-panel" aria-selected="'+(tab===id)+'" tabindex="'+(tab===id?'0':'-1')+'" data-protocol-tab="'+id+'">'+text+'</button>').join('');
    $('protocol-panel').setAttribute('aria-labelledby','protocol-tab-'+tab);
    $('protocol-panel').innerHTML=tab==='customs'?customs():tab==='bank'?bank():tax();
  }
  function initialize(){
    render();
    $('protocol-tabs').addEventListener('click',event=>{
      const target=event.target.closest('[data-protocol-tab]');
      if(target){tab=target.dataset.protocolTab;render();$('protocol-tab-'+tab).focus();}
    });
    $('protocol-tabs').addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      const tabs=['customs','bank','tax'],i=tabs.indexOf(tab);
      tab=event.key==='Home'?'customs':event.key==='End'?'tax':tabs[(i+(event.key==='ArrowRight'?1:2))%3];render();$('protocol-tab-'+tab).focus();
    });
  }
  root.EXPORT_PROTOCOLS={initialize};
})(globalThis);
