'use strict';
(function () {
  const D = globalThis.EXPORT_BUSINESS;
  const R = globalThis.EXPORT_RULES;
  const P = globalThis.EXPORT_PROCESSES;
  const $ = id => document.getElementById(id);
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nodeMap = new Map(D.nodes.map(n => [n.id,n]));
  const materialMap = new Map(D.materials.map(m => [m.id,m]));
  const roleMap = new Map(D.roles.map(r => [r.id,r]));
  const flowMap = new Map(D.flows.map(f => [f.id,f]));
  const overviewTitles = {
    N01:'A 提交交易建档',
    N02:'A—B 签署代理协议',
    N03:'A—E 签署物流协议',
    N04:'A—F 完成报关委托',
    N05:'A 准备货物与出口单证',
    N06:'E 安排订舱、提货与运输',
    N07:'F 草拟双抬头报关单',
    N08:'A 书面确认报关草稿',
    N09:'F 正式申报并交付附件2',
    N10:'E 运输交货并取得签收',
    N11:'D 汇款，银行确认入账',
    N12:'B 按交易档案开付款发票',
    N13:'银行审核材料并办理贸易核验入账',
    N14:'B 核对贸易核验入账与应付净额',
    N15:'B 审批出口前预付款',
    N16:'B 审批出口后付款',
    N17:'B 向 A 付款，A 确认到账',
    N18:'F 准备出口证明资料',
    N19:'B 申请代理出口货物证明',
    N20:'税务签发证明，B 交付 A',
    N21:'A 提交退税申报并跟进',
    N22:'B 核对四流并完成结案',
    N23:'B 登记异常并发起重审'
  };
  const nodeTitle=n=>overviewTitles[n.id]||n.title;
  const laneForNode=n=>n.id==='N23'?'controls':['A','B','E','F'].includes(n.role)?'business':'external';
  const graphLayout={left:190,column:460,nodeWidth:280,nodeHeight:120,row:220,businessY:120,externalY:1080,controlsY:1410,width:4830};
  const list = items => '<ul>'+items.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
  const tags = ids => ids.map(id=>'<button data-node="'+id+'" class="tag">'+id+'</button>').join(' ');
  const materialLabels=(id,direction)=>EXPORT_REVIEW_SCHEMA.slots.filter(s=>s.node===id&&s.direction===direction).map(s=>s.label+(s.conditional?'（条件适用：'+s.conditional+'）':''));
  const externalSummary=id=>P.forNode(id).external.map(x=>x.name.replace(/^([CD]) .+$/,'$1').replace('实际承运人','承运人').replace('中国海关','海关').replace('主管税务机关','税务').replace('目的地清关代理','清关代理').replace('签证／检验机构','签证机构')).join('／')||'无直接交互';
  const externalDetail=id=>{const meta=P.forNode(id);return '<div class="node-process"><span class="tag">流程'+meta.group.id+' · '+esc(meta.group.name)+'</span><button data-sequence="'+meta.group.id+'">查看时序图</button></div><section class="external-roles"><strong>涉及的外部角色</strong>'+(meta.external.length?'<ul>'+meta.external.map(x=>'<li>'+esc(x.name)+'：'+esc(x.interaction)+'</li>').join('')+'</ul>':'<p>无直接外部交互；本节点由内部角色办理。</p>')+'</section>';};
  const originalLink = m => m.file ? '<a href="../'+m.file.split('/').map(encodeURIComponent).join('/')+'" target="_blank" rel="noopener">'+esc(m.file)+'</a>' : '<strong>'+esc(m.kind)+'</strong>';
  let graph, graphMode='all', currentView='overview', selectedNode=null, simulationMode='post', simSelected='N01';
  let approved = new Map(), versions = new Map(D.nodes.map(n=>[n.id,1])), audit=[];
  let toastTimer;
  let constrainingPan=false;

  function constrainPan(){
    if(!graph||constrainingPan||currentView!=='overview')return;
    const width=$('graph').clientWidth,height=$('graph').clientHeight;
    if(!width||!height)return;
    const cells=graph.getCells().filter(cell=>cell.isVisible()&&!cell.id.startsWith('lane-'));
    const box=graph.getCellsBBox(cells);
    if(!box)return;
    const scale=graph.zoom(),position=graph.translate(),padding=24;
    const left=$('process-filter').value==='all'?Math.min(0,box.x):box.x;
    const clamp=(value,start,end,size)=>{
      const content=(end-start)*scale;
      if(content<=size-padding*2)return (size-content)/2-start*scale;
      return Math.max(size-padding-end*scale,Math.min(padding-start*scale,value));
    };
    const tx=clamp(position.tx,left,box.x+box.width,width),ty=clamp(position.ty,box.y,box.y+box.height,height);
    if(Math.abs(tx-position.tx)<.1&&Math.abs(ty-position.ty)<.1)return;
    constrainingPan=true;
    try{graph.translate(tx,ty);}finally{constrainingPan=false;}
  }

  function toast(message) {
    $('toast').textContent=message; $('toast').hidden=false;
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('toast').hidden=true,5000);
  }
  function showView(view) {
    currentView=view;
    document.querySelectorAll('.view').forEach(e=>e.classList.toggle('active',e.id==='view-'+view));
    document.querySelectorAll('[data-view]').forEach(e=>e.classList.toggle('active',e.dataset.view===view));
    if(view==='overview' && graph) requestAnimationFrame(()=>graph.resize($('graph').clientWidth,$('graph').clientHeight));
    if(view==='capabilities')globalThis.EXPORT_CAPABILITY_WORKSPACE?.resize();
    if(view==='database-design')globalThis.EXPORT_DATABASE_WORKSPACE?.show();
    if(view==='state-design')globalThis.EXPORT_STATE_WORKSPACE?.show();
  }
  function details(id) {
    const n=nodeMap.get(id); selectedNode=id; showView('overview');
    const process=$('process-filter').value;
    if(process!=='all'&&!P.nodesFor(process).some(x=>x.id===id))$('process-filter').value=P.forNode(id).group.id;
    $('node-detail').hidden=false;
    $('node-detail').innerHTML='<button class="close" id="close-detail" aria-label="关闭节点详情">×</button><div><span class="tag">'+n.id+' · '+esc(n.role)+'</span><span class="tag">'+esc(flowMap.get(n.flow).name)+'</span>'+(n.pending?'<span class="tag warning">待主管机关确认</span>':'')+'</div><div class="node-heading"><h3>'+esc(nodeTitle(n))+'</h3><div id="node-progress" class="node-progress" aria-live="polite"></div></div><p>'+esc(n.action)+'</p><div id="material-review-workspace"></div><h4>审核角色</h4><p>'+esc(n.review)+'</p><h4>前置依赖</h4><p>'+esc(n.deps.join(' / ') || (n.branchDeps?'预付 N15 / 出口后 N16':'无固定前置；须完成本节点核验'))+'</p><h4>异常与暂停</h4><p class="exception">'+esc(n.exception)+'</p><h4>来源定位</h4><p class="source">'+esc(n.source)+'</p>';
    $('close-detail').onclick=()=>{ $('node-detail').hidden=true; selectedNode=null; filterGraph(); };
    $('material-review-workspace').insertAdjacentHTML('beforebegin',externalDetail(id));
    EXPORT_REVIEW_WORKSPACE.mount($('material-review-workspace'),id,()=>{
      updateCompletion();
    });
    $('node-detail').scrollTop=0;
    filterGraph();
  }
  function createGraph() {
    if(!globalThis.X6?.Graph) throw new Error('本地 AntV X6 未加载，请保持 assets/vendor 与 HTML 一起保存。');
    graph=new X6.Graph({
      container:$('graph'),width:$('graph').clientWidth,height:$('graph').clientHeight,
      background:{color:'#fbfcfe'},grid:{visible:true,size:20,type:'dot',args:{color:'#e5ebf3',thickness:1}},
      interacting:false,panning:{enabled:true,eventTypes:['leftMouseDown','mouseWheel']},
      mousewheel:false,connecting:{allowBlank:false},autoResize:true,
      selecting:false
    });
    const lanes=[
      {id:'business',label:'ABEF 业务主体',color:'#4e6b9b',y:60,height:790,fill:'#f3f6fb'},
      {id:'external',label:'外部角色与系统',color:'#8290a5',y:990,height:250,fill:'#f9fbfe'},
      {id:'controls',label:'四流结案与异常',color:'#bc7670',y:1320,height:250,fill:'#f3f6fb'}
    ];
    lanes.forEach(lane=>graph.addNode({id:'lane-'+lane.id,x:0,y:lane.y,width:graphLayout.width,height:lane.height,zIndex:0,
      attrs:{body:{fill:lane.fill,stroke:'#e7edf5',rx:12,ry:12},
        label:{text:lane.label,fill:lane.color,fontSize:15,fontWeight:600,refX:17,refY:22,textAnchor:'start',textVerticalAnchor:'middle'}}}));
    const phases=['01 建档','02 协议与委任','03 备货 / 开票 / 预付','04 草稿确认 / D 付款','05 申报放行 / 入账','06 运输 / 结算','07 付款放行','08 证明准备 / 申请','09 证明 / 退税','10 四流结案'];
    phases.forEach((p,col)=>graph.addNode({id:'phase-'+col,x:graphLayout.left+col*graphLayout.column,y:0,width:graphLayout.nodeWidth,height:36,zIndex:0,
      attrs:{body:{fill:'#eaf0f8',stroke:'none',rx:5,ry:5},label:{text:p,fill:'#7d8fa7',fontSize:12}}}));
    const businessByColumn=new Map();
    D.nodes.filter(n=>laneForNode(n)==='business').forEach(n=>{
      const group=businessByColumn.get(n.col)||[];
      group.push(n);businessByColumn.set(n.col,group);
    });
    businessByColumn.forEach(group=>group.sort((a,b)=>a.row-b.row));
    D.nodes.forEach(n=>{
      const color=flowMap.get(n.flow).color;
      const lane=laneForNode(n),stack=lane==='business'?businessByColumn.get(n.col).indexOf(n):0;
      const y=lane==='business'?graphLayout.businessY+stack*graphLayout.row:lane==='external'?graphLayout.externalY:graphLayout.controlsY;
      graph.addNode({id:n.id,x:graphLayout.left+n.col*graphLayout.column,y,width:graphLayout.nodeWidth,height:graphLayout.nodeHeight,zIndex:3,
        markup:[{tagName:'rect',selector:'body'},{tagName:'rect',selector:'accent'},{tagName:'text',selector:'meta'},{tagName:'text',selector:'title'},{tagName:'text',selector:'subtitle'},{tagName:'text',selector:'state'},{tagName:'text',selector:'completion'}],
        attrs:{
          body:{fill:'#fff',stroke:'#dce5f1',strokeWidth:1.2,rx:9,ry:9},
          accent:{fill:color,stroke:'none',x:0,y:20,width:4,height:80,rx:2,ry:2},
          meta:{text:n.id+'   '+n.role+' · '+flowMap.get(n.flow).name,refX:0,refY:0,x:17,y:21,fill:color,fontSize:11,fontWeight:600,textAnchor:'start',textVerticalAnchor:'middle'},
          title:{text:nodeTitle(n),refX:0,refY:0,x:17,y:51,fill:'#28415e',fontSize:14,fontWeight:600,textAnchor:'start',textVerticalAnchor:'middle'},
          subtitle:{text:'外部：'+externalSummary(n.id),refX:0,refY:0,x:17,y:80,fill:n.pending?'#b28a43':'#8a9aaf',fontSize:9,textAnchor:'start',textVerticalAnchor:'middle'},
          state:{text:'→',refX:0,refY:0,x:258,y:23,fill:color,fontSize:16,textAnchor:'middle',textVerticalAnchor:'middle'},
          completion:{text:'资料完成度 0%',refX:0,refY:0,x:17,y:105,fill:'#8494a9',fontSize:10,textAnchor:'start',textVerticalAnchor:'middle'}
        },data:{business:true}
      });
    });
    const routes=D.edges.map(([from,to,mode])=>{
      const source=graph.getCellById(from).getBBox(),target=graph.getCellById(to).getBBox();
      const backwards=target.x<source.x,exception=mode==='exception'||mode==='correction';
      if(backwards||exception)return {from,to,sourceSide:'right',targetSide:'left',channel:mode==='correction'?1660:exception?1600:1280};
      if(source.x===target.x)return {from,to,sourceSide:source.y<target.y?'bottom':'top',targetSide:source.y<target.y?'top':'bottom'};
      return {from,to,sourceSide:'right',targetSide:'left',channel:target.x-source.x>graphLayout.column?900:undefined};
    });
    const anchor=(route,end)=>{
      const side=route[end+'Side'],id=route[end==='source'?'from':'to'];
      const peers=routes.filter(r=>r[end==='source'?'from':'to']===id&&r[end+'Side']===side);
      const offset=(peers.indexOf(route)-(peers.length-1)/2)*18;
      return {name:side,args:side==='right'||side==='left'?{dx:side==='right'?12:-12,dy:offset}:{dx:offset,dy:side==='bottom'?12:-12}};
    };
    const channelCounts=new Map();
    D.edges.forEach(([from,to,mode,caption],i)=>{
      const isReturn=mode==='exception'||mode==='correction';
      const color=isReturn?'#c0877f':flowMap.get(nodeMap.get(to).flow).color;
      const route=routes[i],sourceAnchor=anchor(route,'source'),targetAnchor=anchor(route,'target');
      const source=graph.getCellById(from).getBBox(),target=graph.getCellById(to).getBBox();
      let vertices=[];
      // Long dependencies and return paths use separate tracks outside the node rows.
      if(route.channel!==undefined){
        const track=channelCounts.get(route.channel)||0;
        channelCounts.set(route.channel,track+1);
        const y=route.channel+track*16;
        vertices=[
          {x:source.right+60,y:source.center.y+sourceAnchor.args.dy},
          {x:source.right+60,y},
          {x:target.left-60,y},
          {x:target.left-60,y:target.center.y+targetAnchor.args.dy}
        ];
      }
      graph.addEdge({id:'edge-'+i,
        source:{cell:from,anchor:sourceAnchor},
        target:{cell:to,anchor:targetAnchor},
        vertices,zIndex:1,
        router:route.channel!==undefined?{name:'normal'}:{name:'manhattan',args:{step:10,padding:30,excludeNodes:[...lanes.map(lane=>'lane-'+lane.id),...phases.map((p,col)=>'phase-'+col)],startDirections:[route.sourceSide],endDirections:[route.targetSide]}},
        connector:{name:'rounded',args:{radius:12}},
        attrs:{line:{stroke:color,strokeWidth:1.6,strokeOpacity:.55,strokeDasharray:mode?'6 5':null,targetMarker:{name:'block',width:7,height:6}}},
        labels:mode?[{position:{distance:.5,offset:-12},attrs:{label:{text:caption||{pre:'预付',post:'出口后',exception:'异常暂停',correction:'更正后重审'}[mode],fontSize:11,fill:color},body:{fill:'#fbfcfe',stroke:color,strokeOpacity:.18,rx:4,ry:4}}}]:[],
        data:{from,to,mode}
      });
    });
    graph.on('node:click',({node})=>{if(node.data?.business) details(node.id);});
    graph.on('translate',constrainPan);
    graph.on('scale',()=>{$('zoom-label').textContent=Math.round(graph.zoom()*100)+'%';constrainPan();});
    graph.on('resize',constrainPan);
    graph.zoomTo(.66); graph.translate(15,12);
    new ResizeObserver(()=>{if(currentView==='overview')graph.resize($('graph').clientWidth,$('graph').clientHeight);}).observe($('graph'));
  }
  function filterGraph() {
    const role=$('role-filter').value,flow=$('flow-filter').value,search=$('graph-search').value.toLowerCase().trim();
    const process=$('process-filter').value,processNodes=process==='all'?null:new Set(P.nodesFor(process).map(n=>n.id));
    const matches=new Set();
    D.nodes.forEach(n=>{
      const cell=graph.getCellById(n.id);
      const visible=(graphMode==='all'||!n.mode||n.mode===graphMode)&&(!processNodes||processNodes.has(n.id));
      cell.setVisible(visible);
      const matched=(role==='all'||(role==='REVIEWER'?!!n.review:n.role===role))&&(flow==='all'||n.flow===flow)&&(!search||JSON.stringify([n,P.forNode(n.id),materialLabels(n.id,'input'),materialLabels(n.id,'output')]).toLowerCase().includes(search));
      if(matched&&visible)matches.add(n.id);
      cell.attr('body/opacity',matched?1:.2);
      ['meta','title','subtitle','state','accent','completion'].forEach(s=>cell.attr(s+'/opacity',matched?1:.2));
      cell.attr('body/stroke',selectedNode===n.id?'#2563eb':n.gate?'#d7b9b0':'#dce5f1');
      cell.attr('body/strokeWidth',selectedNode===n.id?2.5:1.2);
    });
    graph.getEdges().forEach(edge=>{
      const e=edge.data;
      edge.setVisible((graphMode==='all'||!['pre','post'].includes(e.mode)||e.mode===graphMode)&&graph.getCellById(e.from).isVisible()&&graph.getCellById(e.to).isVisible());
      const connected=selectedNode===e.from||selectedNode===e.to;
      edge.attr('line/strokeOpacity',matches.has(e.from)&&matches.has(e.to)?(selectedNode?(connected?.95:.12):.55):.06);
      edge.attr('line/strokeWidth',selectedNode&&connected?2.4:1.6);
      edge.setZIndex(selectedNode&&connected?2:1);
    });
    for(const lane of ['business','external','controls'])graph.getCellById('lane-'+lane).setVisible(process==='all'||D.nodes.some(n=>laneForNode(n)===lane&&graph.getCellById(n.id).isVisible()));
    for(let col=0;col<10;col++)graph.getCellById('phase-'+col).setVisible(process==='all'||D.nodes.some(n=>n.col===col&&graph.getCellById(n.id).isVisible()));
    document.querySelectorAll('#node-list [data-node]').forEach(button=>{button.hidden=!graph.getCellById(button.dataset.node).isVisible();});
    $('open-sequence').textContent=process==='all'?'流程1 · 时序图':'流程'+process+' · 时序图';
    constrainPan();
  }
  function fitGraph(){
    const cells=D.nodes.map(n=>graph.getCellById(n.id)).filter(n=>n.isVisible());
    const box=graph.getCellsBBox([...cells,...graph.getEdges().filter(edge=>edge.isVisible())]);
    if(box)graph.zoomToRect(box,{padding:35,maxScale:1});
  }
  function updateCompletion(){
    D.nodes.forEach(n=>{
      const p=EXPORT_REVIEW_WORKSPACE.progress(n.id),c=EXPORT_REVIEW_WORKSPACE.coverage(n.id);
      graph.getCellById(n.id).attr('completion/text','关联 '+c.percent+'% · 审核 '+p.percent+'%');
      graph.getCellById(n.id).attr('completion/fill',p.complete?'#17875e':'#8494a9');
    });
  }
  function renderMaterials() {
    const q=$('material-search').value.trim().toLowerCase(),kind=$('material-kind').value;
    const ms=D.materials.filter(m=>(kind==='all'||(kind==='source'?!!m.file:!m.file))&&(!q||JSON.stringify(m).toLowerCase().includes(q)));
    $('material-result').textContent=ms.length+' 类材料';
    $('material-rows').innerHTML=ms.map(m=>'<tr><td><span class="tag">'+m.id+'</span>'+originalLink(m)+'<small>'+esc(m.location)+'</small></td><td><strong>'+esc(m.owner)+'</strong>'+tags(m.nodes)+'</td><td><span class="tag '+(!m.file?'warning':'')+'">'+esc(m.kind)+'</span><p>'+esc(m.status)+'</p></td><td><p>'+esc(m.suggest)+'</p><small>确认方：'+esc(m.confirm)+'</small></td></tr>').join('')||'<tr><td colspan="4" class="empty">没有匹配材料，请调整搜索条件。</td></tr>';
  }
  function renderStaticViews() {
    for(const group of P.groups)$('process-filter').add(new Option('流程'+group.id+' · '+group.name,group.id));
    for(const r of D.roles) $('role-filter').add(new Option(r.id+' '+r.name,r.id));
    for(const f of D.flows) $('flow-filter').add(new Option(f.name,f.id));
    $('node-list').innerHTML=D.nodes.map(n=>'<button data-node="'+n.id+'">'+n.id+' · '+esc(nodeTitle(n))+'</button>').join('');
    renderMaterials();
    $('print-summary').innerHTML='<div class="print-cover"><h1>代理出口业务 · 四流协作摘要</h1><p>'+esc(D.notice)+'</p><p>ABEF统一作为业务主体，人工审核员独立审核。退税资料由系统基于交易档案生成并按规则检查，人工审批后由授权经办人通过官方税务系统申报；系统跟进补正和处理状态。垫资额度和权限须另审。输入和输出所有适用材料均须关联正式文件并Review通过；资料100%不等于卡点放行，本机记录不是真实业务审批。</p></div><h2>一、角色与边界</h2>'+D.roles.map(r=>'<article><h3>'+r.id+' '+esc(r.name)+'</h3><p>'+esc(r.scope)+'</p><p>边界：'+esc(r.not)+'</p></article>').join('')+'<h2>二、完整节点与门禁（不受页面筛选影响）</h2>'+D.nodes.map(n=>'<article><h3>'+n.id+' '+esc(n.title)+' / '+n.role+'</h3><p>'+esc(n.action)+'</p><p>输入：'+esc(materialLabels(n.id,'input').join('；'))+'</p><p>输出：'+esc(materialLabels(n.id,'output').join('；'))+'</p><p>审核：'+esc(n.review)+'；前置：'+esc(n.deps.join(' / ')||(n.branchDeps?'预付N15 / 出口后N16':'按节点条件'))+'</p><p>全部满足：'+esc(n.conditions.join('；'))+'</p><p>异常：'+esc(n.exception)+'</p><p>材料：'+esc(n.materials.join(' / '))+'；来源：'+esc(n.source)+'</p></article>').join('')+'<h2>三、修订及待核事项</h2>'+D.issues.map(i=>'<article><h3>'+i.id+' '+esc(i.title)+'</h3><p>原文：'+esc(i.before)+'</p><p>建议：'+esc(i.after)+'</p><p>来源：'+esc(i.source)+'；确认：'+esc(i.confirm)+'</p></article>').join('')+'<h2>四、材料目录</h2>'+D.materials.map(m=>'<article><h3>'+m.id+' '+esc(m.file||m.kind)+'</h3><p>节点：'+esc(m.nodes.join(' / '))+'；提供：'+esc(m.owner)+'</p><p>'+esc(m.status)+'；'+esc(m.suggest)+'</p></article>').join('');
    $('print-summary').querySelector('.print-cover p:nth-of-type(2)').textContent='ABEF统一作为业务主体，人工审核员独立审核。退税资料由系统基于交易档案生成并按规则检查，人工审批后由授权经办人通过官方税务系统申报；系统跟进补正和处理状态。垫资额度和权限须另审。输入和输出所有适用材料均须关联正式文件并Review通过；资料100%不等于卡点放行，本机记录不是真实业务审批。';
  }
  function appendPrintedRules(){
    $('print-summary').querySelectorAll('article').forEach(article=>{
      const id=article.querySelector('h3')?.textContent.match(/^(N\d{2}) /)?.[1];
      if(id){const p=document.createElement('p');p.textContent='流程'+P.forNode(id).group.id+'；外部角色：'+P.forNode(id).external.map(x=>x.name+'（'+x.interaction+'）').join('；');if(!P.forNode(id).external.length)p.textContent+='无直接外部交互';article.append(p);}
    });
    const section=document.createElement('section');
    section.innerHTML='<h2>五、节点逐项校验规则（人工标准，非自动结果）</h2>'+D.nodes.map(n=>'<article><h3>'+esc(n.id+' '+n.title)+'</h3>'+globalThis.EXPORT_NODE_VALIDATION_RULES.forNode(n).map(r=>'<p><strong>'+esc(r.id+' '+r.name)+'</strong><br>判定：'+esc(r.check)+'<br>证据：'+esc(r.evidence)+'<br>不通过：'+esc(r.failure)+'<br>责任／依据：'+esc(r.reviewer+'；'+r.source)+'</p>').join('')+'</article>').join('');
    $('print-summary').append(section);
  }
  const activeNodes=()=>D.nodes.filter(n=>!n.mode||n.mode===simulationMode);
  const dependencies=n=>[...n.deps,...(n.branchDeps?.[simulationMode]||[]),...(approved.get(n.id)?.additionalDeps||[])];
  function resetSimulation(mode=simulationMode) {
    simulationMode=mode; approved=new Map(); audit=[]; versions=new Map(D.nodes.map(n=>[n.id,1])); simSelected='N01'; renderSimulation();
  }
  function invalidate(id,materialChanged=true) {
    const invalid=new Set([id]);
    let changed=true;
    while(changed) { changed=false; activeNodes().forEach(n=>{
      if(!invalid.has(n.id)&&dependencies(n).some(x=>invalid.has(x))) {invalid.add(n.id);changed=true;}
    }); }
    invalid.forEach(x=>approved.delete(x));
    if(materialChanged) {
      versions.set(id,versions.get(id)+1);
      audit.unshift({node:id,version:versions.get(id),person:'材料变更演示',role:'版本控制',conclusion:'本节点及依赖批准失效',reason:'节点及受影响下游：'+[...invalid].join(' / '),time:new Date().toLocaleTimeString('zh-CN')});
    }
    return invalid;
  }
  function renderSimulation() {
    const ns=activeNodes(), n=nodeMap.get(simSelected);
    $('simulation-progress').textContent='合成交易 DEMO-001 · '+approved.size+' / '+ns.length+' 步有模拟完成记录';
    $('simulation-list').innerHTML=ns.map(x=>'<button class="simulation-step '+(approved.has(x.id)?'done ':'')+(x.id===simSelected?'active':'')+'" data-sim="'+x.id+'"><div><b>'+x.id+' · '+x.role+'</b><strong>'+esc(x.title)+'</strong></div><span class="state-dot">'+(approved.has(x.id)?'✓':'○')+'</span></button>').join('');
    const missing=dependencies(n).filter(id=>!approved.has(id));
    const done=approved.get(n.id);
    $('simulation-detail').innerHTML='<span class="tag">'+n.id+' · 材料版本 V'+versions.get(n.id)+'</span>'+(n.pending?'<span class="tag warning">正式业务仍待外部确认</span>':'')+'<h3>'+esc(n.title)+'</h3><p>'+esc(n.action)+'</p><h4>前置与责任</h4><p>审核角色：'+esc(n.review)+'<br>前置节点：'+esc(dependencies(n).join(' / ')||'无固定前置，须逐项核验本节点')+'</p>'+(missing.length?'<div class="blockers">尚未完成前置：'+esc(missing.join(' / '))+'。可查看本节点，但不能通过。</div>':'')+(done?'<div class="success">✓ 本页演示已通过 V'+done.version+' · '+esc(done.person)+'<br>'+esc(done.reason)+'</div>':'')+'<h4>本版本逐项核验（仅合成场景）</h4><div id="node-checks">'+n.conditions.map((c,i)=>'<label class="check"><input type="checkbox" data-condition="'+i+'" '+(done?'checked disabled':'')+'>'+esc(c)+'</label>').join('')+'</div>'+(['N15','N16'].includes(n.id)&&!done?paymentForm(n.id):'')+(!done?'<h4>记录人工审核</h4><div class="input-grid"><label class="field">模拟审核员名称<input id="reviewer" placeholder="输入演示名称，不填真实个人信息" maxlength="40"></label><label class="field">审核角色（按流程）<input value="'+esc(n.review)+'" readonly></label></div><label class="field">结论理由（必填）<textarea id="review-reason" placeholder="说明本版本证据及模拟结论" maxlength="400"></textarea></label><div id="simulation-errors" role="alert"></div>':'')+'<div class="action-row">'+(!done?'<button id="approve-node" class="primary">记录本版本模拟通过</button><button id="hold-node">记录暂停 / 不通过</button>':'')+'<button id="change-version">模拟材料变更 · 使相关批准失效</button></div><h4>异常时的真实业务要求</h4><p>'+esc(n.exception)+'</p>';
    $('change-version').onclick=()=>{const ids=invalidate(n.id);renderSimulation();toast('材料版本已变更，'+ids.size+' 个节点的相关模拟批准已失效。');};
    if(!done) {
      $('approve-node').onclick=()=>reviewNode(n,true);
      $('hold-node').onclick=()=>reviewNode(n,false);
      if($('numeric-example')) $('numeric-example').onclick=()=>{
        $('amount').value='5000';$('available').value='8000';
        if($('limit')){$('limit').value='10000';$('occupied').value='2000';}
        invalidateFormApproval(); toast('已填合成数值。所有证据与人工审核仍需逐项核验。');
      };
      if($('funding-source')) $('funding-source').onchange=()=>{
        $('advance-fields').hidden=$('funding-source').value!=='advance';
        invalidateFormApproval();
      };
      $('simulation-detail').querySelectorAll('input,select,textarea').forEach(e=>e.addEventListener('input',()=>{
        if(e.id!=='manualApproval')invalidateFormApproval();
      }));
    }
    $('audit-log').innerHTML=audit.length?audit.map(a=>'<div><b>'+esc(a.time)+' · '+a.node+' V'+a.version+' · '+esc(a.conclusion)+'</b><br>'+esc(a.person)+' / '+esc(a.role)+'：'+esc(a.reason)+'</div>').join('<hr>'):'暂无记录。';
  }
  function invalidateFormApproval() {
    if($('manualApproval')) $('manualApproval').checked=false;
    if($('simulation-errors')) $('simulation-errors').innerHTML='';
  }
  function paymentForm(id) {
    const pre=id==='N15';
    const checks=[
      ['agreements','附件1及必要协议有效'],['authorization','A 对 F 的委托/授权有效'],['account','A 收款账户已独立核实'],['noIssues','无未解决法律、合规、报关及付款问题'],
      ...(pre?[['fAccepted','同一个 F 已获 B 书面认可并由 A 委任'],['attachment4','A/F 已完整签署附件4']]:[['draftApproved','A 已批准拟申报的最终草稿版本'],['bNamed','正式附件2列 B 为境内发货人'],['bReceived','B 已收到正式附件2'],['released','已取得真实出口放行凭证'],['matched','到账与交易及批次匹配'],['quote','银行报价有效，1:1/实际报价冲突已确认'],['netApproved','费用、扣款与应付 A 净额获批']]),
      ['received','D 款项已实际入账且可用（已到账资金分支必选）']
    ];
    return '<h4>资金门禁专项核验</h4><p>本演示金额以 CNY 计，最多两位小数；所有数值初始为空。垫资分支不要求 D 已付款，但必须另行确认授信与审批。</p><button id="numeric-example">填入合成数值（不是实际额度）</button><div class="input-grid"><label class="field">拟付金额 / CNY<input id="amount" inputmode="decimal" placeholder="未配置"></label><label class="field">已入账可用资金 / CNY<input id="available" inputmode="decimal" placeholder="未配置"></label></div>'+(pre?'<label class="field">资金来源<select id="funding-source"><option value="">请选择，默认不放行</option><option value="received">D 已到账可用资金</option><option value="advance">B 自有资金垫资（单独授信审批）</option></select></label><div id="advance-fields" hidden><div class="input-grid"><label class="field">垫资总额度 / CNY<input id="limit" inputmode="decimal" placeholder="须财务确认"></label><label class="field">已占用额度 / CNY<input id="occupied" inputmode="decimal" placeholder="须财务确认"></label></div><label class="check"><input type="checkbox" id="creditConfigured">授信规则、资金来源、币种、额度和权限已确认（合成）</label><label class="check"><input type="checkbox" id="creditApproval">本笔垫资已由有权审批人批准（合成）</label></div>':'')+checks.map(([key,label])=>'<label class="check"><input type="checkbox" id="'+key+'">'+esc(label)+'</label>').join('')+'<label class="check"><input type="checkbox" id="manualApproval"><strong>已对本版本材料与上述资金参数完成人工终审（最后勾选；参数变更即失效）</strong></label>';
  }
  function reviewNode(n,pass) {
    const errors=[],person=$('reviewer').value.trim(),reason=$('review-reason').value.trim();
    if(!person) errors.push('请填写模拟审核员名称');
    if(reason.length<4) errors.push('请填写至少4个字的审核理由');
    if(pass) {
      const missing=dependencies(n).filter(id=>!approved.has(id));
      if(missing.length) errors.push('前置尚未完成：'+missing.join(' / '));
      const checks=[...$('node-checks').querySelectorAll('input')];
      if(checks.some(c=>!c.checked))errors.push('本节点的全部条件须逐项核验');
      if(n.id==='N15'||n.id==='N16') {
        const c={currency:'CNY'};
        $('simulation-detail').querySelectorAll('input[type=checkbox][id]').forEach(e=>c[e.id]=e.checked);
        ['amount','available','limit','occupied'].forEach(id=>{if($(id))c[id]=R.cents($(id).value);});
        c.source=$('funding-source')?.value;
        errors.push(...R.evaluatePayment(n.id==='N15'?'pre':'post',c).errors);
        if(n.id==='N15'&&c.source==='received'&&!approved.has('N13')) errors.push('已到账资金分支还须先完成 N13 银行入账核验');
      }
    }
    if(errors.length) {
      $('simulation-errors').innerHTML='<div class="blockers"><strong>未通过，不会产生批准记录</strong>'+list(errors)+'</div>';
      return;
    }
    const record={node:n.id,person,reason,role:n.review,version:versions.get(n.id),conclusion:pass?'模拟通过':'暂停 / 不通过',time:new Date().toLocaleTimeString('zh-CN'),
      additionalDeps:n.id==='N15'&&$('funding-source')?.value==='received'?['N13']:[]};
    if(pass) approved.set(n.id,record); else invalidate(n.id,false);
    audit.unshift(record); renderSimulation();
    toast(pass?'已记录合成场景审核；不代表真实业务获批。':'已暂停本节点，相关依赖批准失效。');
  }
  function init() {
    EXPORT_PROTOCOLS.initialize();
    EXPORT_DATABASE_WORKSPACE.initialize();
    EXPORT_STATE_WORKSPACE.initialize();
    EXPORT_CONTRACTS.initialize();
    renderStaticViews();appendPrintedRules();createGraph();renderSimulation();EXPORT_REVIEW_WORKSPACE.initialize();updateCompletion();
    globalThis.EXPORT_CAPABILITY_WORKSPACE?.initialize();
    $('navigation').onclick=e=>{const b=e.target.closest('[data-view]');if(b)showView(b.dataset.view);};
    $('supplementary-navigation').onclick=$('navigation').onclick;
    $('sidebar-toggle').onclick=()=>{
      const collapsed=document.body.classList.toggle('sidebar-collapsed');
      const label=collapsed?'展开侧边栏':'收起侧边栏';
      $('sidebar-toggle').setAttribute('aria-expanded',String(!collapsed));
      $('sidebar-toggle').setAttribute('aria-label',label);
      $('sidebar-toggle').title=label;
      $('sidebar-toggle').textContent=collapsed?'›':'‹';
      requestAnimationFrame(()=>{
        if(currentView==='overview')graph.resize($('graph').clientWidth,$('graph').clientHeight);
        if(currentView==='capabilities')globalThis.EXPORT_CAPABILITY_WORKSPACE?.resize();
      });
    };
    $('print-button').onclick=()=>window.print();
    $('mode-buttons').onclick=e=>{const b=e.target.closest('[data-mode]');if(!b)return;graphMode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('selected',x===b));filterGraph();};
    $('process-filter').onchange=()=>{
      if(selectedNode&&$('process-filter').value!=='all'&&!P.nodesFor($('process-filter').value).some(n=>n.id===selectedNode)){$('node-detail').hidden=true;selectedNode=null;}
      filterGraph();fitGraph();
    };
    $('open-sequence').onclick=()=>EXPORT_SEQUENCE.open($('process-filter').value==='all'?'1':$('process-filter').value,graphMode);
    ['role-filter','flow-filter'].forEach(id=>$(id).onchange=filterGraph);
    $('graph-search').oninput=filterGraph;
    $('zoom-in').onclick=()=>graph.zoomTo(Math.min(1.5,graph.zoom()+.1));
    $('zoom-out').onclick=()=>graph.zoomTo(Math.max(.2,graph.zoom()-.1));
    $('fit-button').onclick=fitGraph;
    $('readable-button').onclick=()=>{graph.zoomTo(.85);graph.translate(10,12);};
    $('zoom-label').textContent='66%';
    $('material-search').oninput=renderMaterials;$('material-kind').onchange=renderMaterials;
    $('simulation-list').onclick=e=>{const b=e.target.closest('[data-sim]');if(b){simSelected=b.dataset.sim;renderSimulation();}};
    $('simulation-mode').onchange=()=>{resetSimulation($('simulation-mode').value);toast('付款模式已更换，全部模拟审核已清空。');};
    $('reset-simulation').onclick=()=>{resetSimulation();toast('已清空全部合成数据及本页模拟记录。');};
    document.addEventListener('click',e=>{const b=e.target.closest('[data-node]');if(b)details(b.dataset.node);});
    document.addEventListener('click',e=>{const b=e.target.closest('[data-sequence]');if(b)EXPORT_SEQUENCE.open(b.dataset.sequence,graphMode,b);});
    filterGraph();
    globalThis.EXPORT_APP={graph,showView,details,getSimulation:()=>({mode:simulationMode,approved:[...approved.keys()],versions:Object.fromEntries(versions),audit:[...audit]}),selectSimulation:id=>{simSelected=id;renderSimulation();showView('simulation');}};
  }
  try {init();} catch(error) {
    $('fatal-error').hidden=false;$('fatal-error').textContent='页面初始化失败：'+error.message+'。请保留完整交付目录后重新打开。';
    console.error(error);
  }
})();
