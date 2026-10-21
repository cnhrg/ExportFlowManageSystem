'use strict';
(function(root){
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=value=>Number(value).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
  const sum=(rows,key)=>rows.reduce((total,row)=>total+row[key],0);
  const organizations={all:'全部授权组织',trade:'贸易代理业务组',operations:'运营服务组'};
  const colors=['#4477ee','#22aa91','#e6a348','#8b74dd'];
  const snapshot='2026-10-21',day=86400000,snapshotTime=Date.parse(snapshot+'T00:00:00Z');
  const state={device:'desktop',mobileSection:'overview',period:'30',organization:'all',query:'',fundStatus:'all',page:1,selected:'',message:''};
  const pageSize=8;
  let initialized=false;
  const transactions=Array.from({length:12},(_,index)=>{
    const progress=index%7,expected=(index+2)*10000;
    const received=progress<2?0:expected,matched=progress===2?received*.8:received;
    const exchanged=progress<3?0:progress===3?matched*.6:matched;
    const rate=1,credited=exchanged*rate,bankFee=exchanged?80:0;
    const commission=progress>=4?Math.round(credited*.02):0;
    const paid=progress>=5?credited-bankFee-commission:0;
    return {
      id:'BV-EX-'+String(index+1).padStart(3,'0'),batch:'LOT-01',customer:'A客户'+String(index+1).padStart(2,'0'),
      organization:index%2?'operations':'trade',age:[1,3,5,6,10,15,20,25,29,40,60,85][index],
      expected,received,matched,exchanged,credited,bankFee,commission,paid,
      unavailable:received-exchanged,rmb:credited-bankFee-commission-paid,
      netDue:progress>=4?credited-bankFee-commission-paid:0,
      commissionDue:progress>=4?0:Math.round(credited*.02),
      hold:index===3||index===9,
      paymentGate:progress>=4?(index===4?'账户待独立核验':index===11?'放行 / 接收凭证待补':'资料齐备'):'结汇 / 结算未完成'
    };
  });
  function scoped(){
    const query=state.query.trim().toLowerCase();
    return transactions.filter(row=>row.age<Number(state.period)&&(state.organization==='all'||row.organization===state.organization)&&
      (!query||[row.id,row.customer,row.batch].some(value=>value.toLowerCase().includes(query))));
  }
  function blocked(row){return row.netDue>0&&(row.hold||row.paymentGate!=='资料齐备');}
  function fundMatches(row){
    const filters={
      all:()=>true,received:()=>row.received>0,unmatched:()=>row.received>row.matched,
      pendingFx:()=>row.matched>row.exchanged,exchanged:()=>row.exchanged>0,
      unavailable:()=>row.unavailable>0,rmb:()=>row.rmb>0,commission:()=>row.commission>0,
      paid:()=>row.paid>0,payment:()=>row.netDue>0,ready:()=>row.netDue>0&&!blocked(row),blocked:()=>blocked(row),fees:()=>row.bankFee>0
    };
    return filters[state.fundStatus]();
  }
  function select(id,value,label,options){
    return '<label class="boss-filter-control"><span>'+label+'</span><select id="'+id+'">'+options.map(([key,text])=>'<option value="'+key+'"'+(key===value?' selected':'')+'>'+text+'</option>').join('')+'</select></label>';
  }
  function icon(name){
    const paths={
      desktop:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 21h8M12 16v5"/>',
      mobile:'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/>',
      received:'<path d="M12 3v12m-4-4 4 4 4-4M4 15v5h16v-5"/>',
      rmb:'<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 9h18m-7 5h4"/>',
      commission:'<path d="M4 18V8m6 10V4m6 14v-7m5 10H2"/>',
      payment:'<path d="M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4"/>'
    };
    return '<svg class="bv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths[name]+'</svg>';
  }
  function metric(label,value,currency,filter){
    return '<button type="button" class="bv-kpi bv-kpi-'+filter+'" data-boss-fund-status="'+filter+'"><span class="bv-kpi-heading"><small>'+label+'</small><i class="bv-kpi-icon">'+icon(filter)+'</i></span><strong>'+money(value)+'</strong><span>'+currency+' <i>累计 / 快照口径 ↗</i></span></button>';
  }
  const dateAt=age=>new Date(snapshotTime-age*day).toISOString().slice(5,10).replace('-','/');
  function eventBuckets(rows,series){
    const period=Number(state.period),width=period===7?1:period===30?5:10;
    return Array.from({length:Math.ceil(period/width)},(_,index)=>{
      const oldest=period-1-index*width,newest=Math.max(0,oldest-width+1);
      return {
        label:dateAt(newest),range:dateAt(oldest)+(oldest===newest?'':'–'+dateAt(newest)),
        values:series.map(item=>rows.reduce((total,row)=>{
          const age=Math.max(0,row.age-item.delay);
          return total+(age>=newest&&age<=oldest?row[item.key]:0);
        },0))
      };
    });
  }
  function chartData(labels,series,buckets,currency){
    return '<details class="bv-chart-data"><summary>查看图表数据</summary><div class="management-table-wrap"><table class="bv-table"><caption>'+currency+' · 元</caption><thead><tr><th>日期区间</th>'+labels.map(label=>'<th>'+label+'</th>').join('')+'</tr></thead><tbody>'+
      buckets.map(bucket=>'<tr><th>'+bucket.range+'</th>'+series.map((_,index)=>'<td>'+money(bucket.values[index])+'</td>').join('')+'</tr>').join('')+'</tbody></table></div></details>';
  }
  function trend(rows,title,currency,series,id){
    const buckets=eventBuckets(rows,series),maximum=Math.max(...buckets.flatMap(bucket=>bucket.values),1);
    const compact=state.device==='mobile';
    const ceiling=Math.ceil(maximum/10000)*10000,w=compact?360:640,h=compact?220:245,left=compact?40:54,right=18,top=20,bottom=36;
    const x=index=>left+index*(w-left-right)/(buckets.length-1);
    const y=value=>h-bottom-value/ceiling*(h-top-bottom);
    const grid=Array.from({length:5},(_,index)=>{
      const value=ceiling*index/4,position=y(value);
      return '<line x1="'+left+'" y1="'+position+'" x2="'+(w-right)+'" y2="'+position+'" stroke="#e8eef5"/><text x="'+(left-8)+'" y="'+(position+4)+'" text-anchor="end">'+(value/10000).toFixed(1)+'</text>';
    }).join('');
    const total=buckets.reduce((value,bucket)=>value+bucket.values.reduce((a,b)=>a+b,0),0);
    return '<article class="management-card bv-chart" data-chart="'+id+'"><header><h3>'+title+'</h3><span>'+currency+' · 万元</span></header>'+
      '<div class="bv-chart-legend">'+series.map((item,index)=>'<span><i style="background:'+colors[index]+'"></i>'+item.name+'</span>').join('')+'</div>'+
      '<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+title+'，'+currency+'分日期区间发生额"><title>'+title+' · '+currency+'</title>'+grid+
      series.map((item,seriesIndex)=>'<defs><linearGradient id="bv-'+id+'-'+seriesIndex+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+colors[seriesIndex]+'" stop-opacity=".13"/><stop offset="100%" stop-color="'+colors[seriesIndex]+'" stop-opacity="0"/></linearGradient></defs><path fill="url(#bv-'+id+'-'+seriesIndex+')" d="M'+left+','+(h-bottom)+' L'+buckets.map((bucket,index)=>x(index)+','+y(bucket.values[seriesIndex])).join(' L')+' L'+x(buckets.length-1)+','+(h-bottom)+' Z"/><polyline fill="none" stroke="'+colors[seriesIndex]+'" stroke-width="3" stroke-linejoin="round" points="'+buckets.map((bucket,index)=>x(index)+','+y(bucket.values[seriesIndex])).join(' ')+'"/>'+
        buckets.map((bucket,index)=>'<circle cx="'+x(index)+'" cy="'+y(bucket.values[seriesIndex])+'" r="4" fill="'+colors[seriesIndex]+'"><title>'+bucket.range+' '+item.name+' '+money(bucket.values[seriesIndex])+' '+currency+'</title></circle>').join('')).join('')+
      buckets.map((bucket,index)=>'<text x="'+x(index)+'" y="'+(h-10)+'" text-anchor="middle">'+bucket.label+'</text>').join('')+'</svg>'+
      (!total?'<p class="bv-chart-empty">当前筛选无发生额</p>':'')+
      chartData(series.map(item=>item.name),series,buckets,currency)+'</article>';
  }
  function donut(title,currency,parts,id){
    const total=parts.reduce((value,part)=>value+part.value,0),circumference=2*Math.PI*69;
    let offset=0;
    const segments=parts.map((part,index)=>{
      const length=total?part.value/total*circumference:0;
      const circle='<circle class="bv-donut-segment" cx="115" cy="115" r="69" fill="none" stroke="'+colors[index]+'" stroke-width="28" stroke-dasharray="'+length+' '+(circumference-length)+'" stroke-dashoffset="'+(-offset)+'" transform="rotate(-90 115 115)"><title>'+part.label+'：'+money(part.value)+' '+currency+'（'+(total?part.value/total*100:0).toFixed(1)+'%）</title></circle>';
      offset+=length;return circle;
    }).join('');
    return '<article class="management-card bv-chart" data-chart="'+id+'"><header><h3>'+title+'</h3><span>'+currency+'</span></header>'+
      '<div class="bv-donut-layout"><svg viewBox="0 0 230 230" role="img" aria-label="'+title+'，总额'+money(total)+' '+currency+'"><title>'+title+'</title><circle cx="115" cy="115" r="69" fill="none" stroke="#edf2f7" stroke-width="28"/>'+segments+
      '<text x="115" y="110" text-anchor="middle" class="bv-donut-total">'+(total/10000).toFixed(2)+'</text><text x="115" y="132" text-anchor="middle">'+(total?'合计 · 万元':'暂无数据')+'</text></svg>'+
      '<div class="bv-donut-legend">'+parts.map((part,index)=>'<button type="button" data-boss-fund-status="'+part.filter+'"><i style="background:'+colors[index]+'"></i><span>'+part.label+'<b>'+money(part.value)+'</b></span><em>'+(total?part.value/total*100:0).toFixed(1)+'%</em></button>').join('')+'</div></div></article>';
  }
  function revenue(rows){
    const series=[{key:'commission',name:'B收益银行入账',delay:3}],buckets=eventBuckets(rows,series);
    const maximum=Math.max(...buckets.map(bucket=>bucket.values[0]),1),ceiling=Math.ceil(maximum/100)*100,w=state.device==='mobile'?360:640,h=220,left=state.device==='mobile'?40:54;
    const barWidth=(w-left-18)/buckets.length;
    return '<article class="management-card bv-chart" data-chart="revenue"><header><h3>B收益银行划转趋势</h3><span>CNY · 元</span></header><svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="B收益银行划转柱状图"><title>B收益银行划转趋势，非利润</title>'+
      [0,.5,1].map(ratio=>'<line x1="'+left+'" y1="'+(180-ratio*150)+'" x2="'+(w-18)+'" y2="'+(180-ratio*150)+'" stroke="#e8eef5"/><text x="'+(left-8)+'" y="'+(184-ratio*150)+'" text-anchor="end">'+Math.round(ceiling*ratio)+'</text>').join('')+
      buckets.map((bucket,index)=>{
        const value=bucket.values[0],height=value/ceiling*150,x=left+index*barWidth+barWidth*.25;
        return '<rect x="'+x+'" y="'+(180-height)+'" width="'+(barWidth*.5)+'" height="'+height+'" rx="4" fill="#8e87d3"><title>'+bucket.range+' '+money(value)+' CNY</title></rect><text x="'+(x+barWidth*.25)+'" y="204" text-anchor="middle">'+bucket.label+'</text>';
      }).join('')+'</svg><small class="bv-chart-note">双边回单核验成功的合成样本 · 不等于利润</small>'+chartData(['B收益银行入账'],series,buckets,'CNY')+'</article>';
  }
  function payment(rows){
    const groups=[
      {label:'已净付 A',value:sum(rows,'paid'),filter:'paid',color:colors[1]},
      {label:'待付 · 门禁齐备',value:rows.filter(row=>!blocked(row)).reduce((total,row)=>total+row.netDue,0),filter:'ready',color:colors[0]},
      {label:'待付 · 被阻断',value:rows.filter(blocked).reduce((total,row)=>total+row.netDue,0),filter:'blocked',color:colors[2]}
    ];
    const maximum=Math.max(...groups.map(group=>group.value),1);
    return '<article class="management-card bv-chart" data-chart="payments"><header><h3>A净付款分布</h3><span>CNY · 元</span></header><div class="bv-payment-bars">'+groups.map(group=>'<button type="button" data-boss-fund-status="'+group.filter+'"><span>'+group.label+'<b>'+money(group.value)+'</b></span><i><em style="width:'+(group.value/maximum*100)+'%;background:'+group.color+'"></em></i></button>').join('')+'</div><small class="bv-chart-note">已结算净额分布 · 不含未结算交易</small></article>';
  }
  function ledger(rows){
    const data=rows.filter(fundMatches),pages=Math.max(1,Math.ceil(data.length/pageSize));
    state.page=Math.min(state.page,pages);
    const mobile=state.device==='mobile',pageRows=data.slice((state.page-1)*pageSize,state.page*pageSize);
    return '<details class="management-card bv-ledger"'+(mobile||state.fundStatus!=='all'||state.selected?' open':'')+'><summary>资金明细 <span>'+data.length+' 笔 · '+(mobile?'按交易查看':'展开台账')+'</span></summary>'+
      '<div class="boss-filter-row">'+select('boss-fund-status',state.fundStatus,'资金标签',[
        ['all','全部'],['received','有CNH入账'],['unmatched','待匹配'],['pendingFx','已匹配待结汇'],['exchanged','已结汇'],
        ['unavailable','CNH不可用'],['rmb','CNY账面余额'],['commission','B收益银行入账'],['fees','银行费用'],['paid','已净付A'],['payment','A待付'],['ready','待付门禁齐备'],['blocked','付款被阻断']
      ])+'</div>'+(mobile?'<div class="bv-mobile-records">'+(pageRows.map(row=>'<article class="bv-mobile-record"><header><div><b>'+row.id+'</b><small>'+row.customer+' · '+row.batch+'</small></div><span class="bv-record-state'+(blocked(row)?' is-blocked':'')+'">'+(blocked(row)?'付款阻断':row.paid?'已净付 A':row.netDue?'待净付款':'处理中')+'</span></header><dl>'+
        [['银行入账 · CNH',row.received],['未匹配 · CNH',row.received-row.matched],['结汇到账 · CNY',row.credited],['账面余额 · CNY',row.rmb],['B收益 · CNY',row.commission],['净付 A · CNY',row.paid]].map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+money(value)+'</dd></div>').join('')+'</dl><button type="button" data-boss-open="'+row.id+'">资金分配与回单摘要 <span>↗</span></button></article>').join('')||'<p class="bv-empty">当前筛选无资金记录</p>')+'</div>':
      '<div class="management-table-wrap"><table class="bv-table"><thead><tr><th>交易 / 批次</th><th>入账 CNH</th><th>未匹配 CNH</th><th>结汇到账 CNY</th><th>余额 CNY</th><th>B收益 CNY</th><th>净付A CNY</th><th>资金摘要</th></tr></thead><tbody>'+
      (pageRows.map(row=>'<tr><td>'+row.id+'<small>'+row.batch+' · '+row.customer+'</small></td>'+
        [row.received,row.received-row.matched,row.credited,row.rmb,row.commission,row.paid].map(value=>'<td>'+money(value)+'</td>').join('')+
        '<td><button type="button" class="text-button" data-boss-open="'+row.id+'">查看</button></td></tr>').join('')||'<tr><td colspan="8" class="bv-empty">当前筛选无资金记录</td></tr>')+
      '</tbody></table></div>')+'<div class="bv-pagination"><span>第 '+state.page+' / '+pages+' 页</span><button type="button" data-boss-page="'+(state.page-1)+'"'+(state.page===1?' disabled':'')+'>上一页</button><button type="button" data-boss-page="'+(state.page+1)+'"'+(state.page===pages?' disabled':'')+'>下一页</button></div></details>';
  }
  function detail(rows){
    const row=rows.find(item=>item.id===state.selected);
    if(!row)return '';
    return '<article class="management-card bv-detail" id="boss-transaction-detail" tabindex="-1"><header class="bv-detail-toolbar"><h3>'+row.id+' / '+row.batch+'</h3><button type="button" data-boss-close>收起</button></header><div class="bv-reconciliation"><div><b>CNH分配</b><span>入账 '+money(row.received)+' = 待匹配 '+money(row.received-row.matched)+' + 匹配待结汇 '+money(row.matched-row.exchanged)+' + 已结汇 '+money(row.exchanged)+'</span></div>'+
      '<div><b>CNY去向</b><span>到账 '+money(row.credited)+' = 余额 '+money(row.rmb)+' + 银行费 '+money(row.bankFee)+' + B收益 '+money(row.commission)+' + 净付A '+money(row.paid)+'</span></div></div>'+
      '<p class="chart-caption">A待付 '+money(row.netDue)+' CNY · '+(row.hold?'ON HOLD · ':'')+row.paymentGate+'；B收益：'+(row.commission?'SYN-DEBIT-'+row.id+' ↔ SYN-CREDIT-'+row.id:'尚无成功划转')+'。均为合成回单索引。</p></article>';
  }
  function analytics(rows,section='all'){
    const received=sum(rows,'received'),exchanged=sum(rows,'exchanged'),commission=sum(rows,'commission');
    const trends=()=>trend(rows,'收款与结汇趋势','CNH',[{key:'received',name:'银行入账',delay:1},{key:'exchanged',name:'成功结汇原币',delay:2}],'cnh-trend')+
      trend(rows,'人民币到账与净付款趋势','CNY',[{key:'credited',name:'结汇到账',delay:2},{key:'paid',name:'净付 A',delay:4}],'cny-trend');
    const allocations=()=>donut('CNH收款分配','CNH',[
      {label:'待匹配',value:received-sum(rows,'matched'),filter:'unmatched'},
      {label:'匹配待结汇',value:sum(rows,'matched')-exchanged,filter:'pendingFx'},
      {label:'已结汇',value:exchanged,filter:'exchanged'}
    ],'cnh-allocation')+donut('人民币到账去向','CNY',[
      {label:'账面余额',value:sum(rows,'rmb'),filter:'rmb'},{label:'已净付 A',value:sum(rows,'paid'),filter:'paid'},
      {label:'B收益银行入账',value:commission,filter:'commission'},{label:'银行费用',value:sum(rows,'bankFee'),filter:'fees'}
    ],'cny-allocation');
    if(section==='overview')return allocations()+payment(rows);
    if(section==='trends')return trends()+revenue(rows);
    return '<div class="bv-section-heading"><div><span>CASH FLOW</span><h3>双币种收支趋势</h3></div><p>按演示事件日期归集 · 分币种核算</p></div><div class="bv-analytics-grid">'+trends()+'</div>'+
      '<div class="bv-section-heading"><div><span>ALLOCATION</span><h3>每一笔资金，去向清晰</h3></div><p>互斥分配 · 点击图例下钻明细</p></div><div class="bv-analytics-grid">'+allocations()+'</div>'+
      '<div class="bv-section-heading"><div><span>SETTLEMENT</span><h3>收益划转与净付款</h3></div><p>B收益银行入账 ≠ 会计利润</p></div><div class="bv-analytics-grid">'+revenue(rows)+payment(rows)+'</div>';
  }
  function filters(rows){
    return '<div class="boss-filter-row bv-filters">'+select('boss-period',state.period,'建档范围',[['7','近7天'],['30','近30天'],['90','近90天']])+
      select('boss-organization',state.organization,'组织',Object.entries(organizations))+
      '<form id="boss-search"><label class="boss-filter-control"><span>交易 / 客户</span><input id="boss-query" value="'+esc(state.query)+'" placeholder="搜索交易编号或客户"></label><button type="submit">查询</button></form><button type="button" class="text-button" data-boss-reset>重置</button><span class="scope-note">'+rows.length+' 笔交易</span></div>';
  }
  function overview(rows){
    const held=rows.filter(blocked),unmatched=sum(rows,'received')-sum(rows,'matched');
    return '<div class="bv-kpis">'+metric('累计银行入账',sum(rows,'received'),'CNH','received')+metric('人民币账面余额',sum(rows,'rmb'),'CNY','rmb')+metric('B收益银行累计入账',sum(rows,'commission'),'CNY','commission')+metric('A待净付款',sum(rows,'netDue'),'CNY','payment')+'</div>'+
      '<div class="bv-attention"><div><span class="bv-attention-dot"></span><b>资金关注</b><small>当前筛选范围</small></div><button type="button" data-boss-fund-status="blocked">付款被阻断 <strong>'+held.length+' 笔</strong><span>查看原因 ↗</span></button><button type="button" data-boss-fund-status="unmatched">待匹配受限款 <strong>'+money(unmatched)+' <small>CNH</small></strong><span>查看明细 ↗</span></button></div>';
  }
  function definitions(){
    return '<details class="boss-disclosure bv-definitions"><summary>数据口径 / 演示边界</summary><p>电脑端与移动端共享同一筛选及合成数据。筛选按建档日期选择交易集合。指标及饼图为该集合截至快照日累计量或余额；趋势为该集合在所选时间内按演示事件日期归集的发生额，并非累计曲线。样本事件时间为建档后1 / 2 / 3 / 4天（最晚不超过快照日），不代表真实银行时间。点击图例和指标只筛选明细，不改变图表的全局范围。</p><p>CNH与CNY分币种展示，不相加。CNH饼图三项互斥，待匹配和匹配待结汇共同构成不可用余额。CNY去向互斥：结汇到账 = 账面余额 + 净付A + B收益银行划转 + 银行费；双账户合并需抵销内部划转。账面余额不等于可用余额。B收益不等于利润或已确认会计收入。样本汇率为1:1。</p><p>Boss仅查看脱敏资金摘要，无单据面板、业务审批或银行执行能力。本场景无退款；未匹配款受限挂账。正式系统的权限、银行对账及冻结在途处理须由后端实现。本看板不读取运营持久审核状态。</p></details>';
  }
  function render(){
    const rows=scoped(),mobile=state.device==='mobile';
    if(state.selected&&!rows.some(row=>row.id===state.selected))state.selected='';
    const tabs='<div class="bv-device-toolbar"><div class="bv-device-tabs" role="tablist" aria-label="资金看板设备原型">'+[['desktop','电脑端'],['mobile','移动端']].map(([device,label])=>'<button type="button" id="boss-device-'+device+'" role="tab" aria-selected="'+(state.device===device)+'" aria-controls="boss-device-panel" tabindex="'+(state.device===device?'0':'-1')+'" data-boss-device="'+device+'">'+icon(device)+label+'</button>').join('')+'</div><span>独立布局 · 同一资金口径</span></div>';
    const hero='<header class="bv-dashboard-heading"><div><span class="bv-overline">FUNDS OVERVIEW</span><h3>资金总览<span>V1</span></h3><p>看清资金流向，掌握结算进度。</p></div><div class="bv-snapshot"><span><i></i>合成快照 · '+snapshot+'</span><small>无银行连接 · 不同步运营审批</small></div></header>';
    const nav='<nav class="bv-mobile-nav" aria-label="移动端看板分区">'+[['overview','资金总览','rmb'],['trends','收支趋势','commission'],['ledger','交易明细','payment']].map(([section,label,glyph])=>'<button type="button" data-boss-section="'+section+'" aria-pressed="'+(state.mobileSection===section)+'">'+icon(glyph)+label+'</button>').join('')+'</nav>';
    const content=mobile?
      '<div class="bv-phone"><div class="bv-phone-top"><span>TRADE / BOSS VIEWER</span><b>只读</b></div>'+hero+filters(rows)+nav+'<div class="bv-mobile-body">'+
      (state.mobileSection==='overview'?overview(rows)+'<div class="bv-analytics-grid">'+analytics(rows,'overview')+'</div>':state.mobileSection==='trends'?'<div class="bv-section-heading"><div><span>CASH FLOW</span><h3>收支趋势</h3></div><p>分币种 · 发生额</p></div><div class="bv-analytics-grid">'+analytics(rows,'trends')+'</div>':ledger(rows))+
      detail(rows)+definitions()+'</div><div class="bv-home-indicator" aria-hidden="true"></div></div>':
      '<div class="bv-desktop">'+hero+filters(rows)+overview(rows)+analytics(rows)+ledger(rows)+detail(rows)+definitions()+'</div>';
    $('boss-workspace').innerHTML=tabs+'<div class="boss-prototype-status bv-live-status" role="status" aria-live="polite">'+esc(state.message)+'</div><div id="boss-device-panel" role="tabpanel" aria-labelledby="boss-device-'+state.device+'" tabindex="0" class="bv-device-panel is-'+state.device+'">'+content+'</div>';
  }
  function resetLocal(){state.fundStatus='all';state.page=1;state.selected='';}
  function initialize(){
    if(initialized)return;
    initialized=true;
    const host=$('boss-workspace');
    host.addEventListener('keydown',event=>{
      const tab=event.target.closest('[data-boss-device]');
      if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      state.device=event.key==='Home'?'desktop':event.key==='End'?'mobile':state.device==='desktop'?'mobile':'desktop';
      state.message='';render();$('boss-device-'+state.device).focus();
    });
    host.addEventListener('change',event=>{
      const key={'boss-period':'period','boss-organization':'organization','boss-fund-status':'fundStatus'}[event.target.id];
      if(!key)return;
      state[key]=event.target.value;
      if(key!=='fundStatus')resetLocal();else state.page=1;
      state.message=key==='fundStatus'?'已筛选资金明细；图表保持全局范围。':'';render();
    });
    host.addEventListener('submit',event=>{
      if(event.target.id!=='boss-search')return;
      event.preventDefault();state.query=$('boss-query').value;resetLocal();state.message='';render();
    });
    host.addEventListener('click',event=>{
      const button=event.target.closest('button');
      if(!button||button.disabled)return;
      const data=button.dataset;
      if(data.bossDevice){
        state.device=data.bossDevice;state.message='';render();$('boss-device-'+state.device).focus();return;
      }else if(data.bossSection){
        state.mobileSection=data.bossSection;state.message='';render();
        host.querySelector('[data-boss-section="'+state.mobileSection+'"]')?.focus();return;
      }else if(data.bossPage){
        const page=Number(data.bossPage),total=scoped().filter(fundMatches).length;
        if(!Number.isInteger(page)||page<1||page>Math.max(1,Math.ceil(total/pageSize)))return;
        state.page=page;
      }else if(data.bossFundStatus){
        state.fundStatus=data.bossFundStatus;state.page=1;state.selected='';state.message='已筛选资金明细；图表保持全局范围。';
        if(state.device==='mobile')state.mobileSection='ledger';
      }else if(data.bossOpen){
        if(!scoped().some(row=>row.id===data.bossOpen)){state.message='交易不在当前筛选范围。';render();return;}
        state.selected=data.bossOpen;
      }else if('bossClose' in data)state.selected='';
      else if('bossReset' in data){state.period='30';state.organization='all';state.query='';resetLocal();state.message='';}
      else return;
      render();
      if(data.bossOpen)$('boss-transaction-detail')?.focus();
      if(data.bossFundStatus)host.querySelector('.bv-ledger')?.scrollIntoView({behavior:'smooth',block:'nearest'});
    });
    render();
  }
  root.EXPORT_BOSS={initialize};
})(globalThis);
