'use strict';
(function(root){
  const M=root.EXPORT_STATE_MODEL,U=root.EXPORT_DESIGN_DIAGRAMS;
  const $=id=>document.getElementById(id),esc=U.escape;
  let selected='trade',machineId='trade-1',initialized=false;
  function show(id){
    const changed=id&&M.domains.some(domain=>domain.id===id)&&selected!==id;
    if(changed){selected=id;machineId=M.domains.find(domain=>domain.id===id).machines[0].id;}
    if(!initialized||changed){initialized=true;render();}
  }
  function select(id){
    const domain=M.domains.find(item=>item.id===id);
    if(!domain)throw new Error('未知状态机领域：'+id);
    selected=id;machineId=domain.machines[0].id;render();
    history.replaceState(null,'','#state-design/'+id);
  }
  function render(){
    const domain=M.domains.find(item=>item.id===selected),current=domain.machines.find(item=>item.id===machineId)||domain.machines[0];
    machineId=current.id;
    const book=M.persistenceBook(current);
    const stateRows=current.states.map(([code,label,kind])=>{
      const value=book?.values.find(item=>item[0]===code);
      return [value?code:'—',label,value?value[2]:'图示编号 '+code+'；概念流程节点，不是持久化枚举'+(kind==='exception'?'；异常处理分支':'')];
    });
    $('state-design-tabs').innerHTML=M.domains.map(item=>'<button type="button" role="tab" id="state-tab-'+item.id+'" data-tab="'+item.id+'" aria-controls="state-design-panel" aria-selected="'+(selected===item.id)+'" tabindex="'+(selected===item.id?'0':'-1')+'">'+esc(item.name)+'</button>').join('');
    $('state-design-panel').setAttribute('aria-labelledby','state-tab-'+selected);
    $('state-design-panel').innerHTML=
      '<div class="state-machine-picker" role="group" aria-label="选择子状态机">'+domain.machines.map(item=>'<button type="button" data-machine="'+item.id+'" aria-pressed="'+(item.id===current.id)+'">'+esc(item.title)+'</button>').join('')+'</div>'+
      '<section class="database-card"><div class="database-section-heading"><div><span class="database-eyebrow">STATE TRANSITIONS · '+esc(domain.name)+'</span><h3>'+esc(current.title)+'</h3><p>'+esc(current.persistence?'持久化字段：'+current.persistence[0]+'.'+current.persistence[1]:'概念流程：具体实体状态码按数据库字典评审，不使用S/X图示编号入库。')+'</p></div><a class="database-design-link" href="#database-design/'+domain.id+'">查看本域实体字段</a></div><div id="state-design-diagram"></div><p class="database-muted">连线为事件及Guard；“状态不变”为自循环。触发范围和动态恢复上下文仅为流程说明，不是新增业务状态；异常明细仍以下表为准。</p><h4 class="database-subheading">状态定义'+(book?' · '+esc(book.name):' · 非持久化码表')+'</h4>'+U.table(['持久化码','状态 / 处理节点','含义与边界'],stateRows)+(book?'<p class="database-boundary">'+esc(book.rule)+'</p>':'')+'</section>'+
      '<section class="database-card"><h3>事件定义</h3>'+U.table(['事件 / 版本','含义','生产方 / 来源','最小载荷','幂等 / 去重'],current.events.map(event=>[event.name+'\n'+event.schemaVersion,event.meaning,event.source,event.payload,event.key]))+'</section>'+
      '<section class="database-card"><h3>Guard 定义</h3>'+U.table(['编号','必须满足的条件'],current.guards)+'</section>'+
      '<section class="database-card"><h3>Transitions · 正常转换</h3>'+U.table(['当前状态 / 触发范围','事件','Guard','目标状态 / 动作'],current.transitions)+'</section>'+
      (current.exceptions.length?'<section class="database-card"><h3>异常处理与补偿</h3>'+U.table(['发生状态','事件 / 条件','Guard','结束分支','处理 / 补偿'],current.exceptions)+'</section>':'');
    U.mount($('state-design-diagram'),M.source(current),'state-'+current.id,current.title+'状态图');
  }
  function initialize(){
    U.bindTabs($('state-design-tabs'),select);
    $('state-design-panel').addEventListener('click',event=>{
      const target=event.target.closest('[data-machine]');
      if(!target)return;
      machineId=target.dataset.machine;render();
      $('state-design-panel').querySelector('[data-machine="'+machineId+'"]').focus();
    });
  }
  root.EXPORT_STATE_WORKSPACE={initialize,show};
})(globalThis);
