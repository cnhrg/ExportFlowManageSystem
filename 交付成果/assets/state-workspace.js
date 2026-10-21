'use strict';
(function(root){
  const M=root.EXPORT_STATE_MODEL,U=root.EXPORT_DESIGN_DIAGRAMS,D=root.EXPORT_BUSINESS,$=id=>document.getElementById(id),esc=U.escape;
  let selected='process',machineId='orchestration',initialized=false;
  function show(){if(initialized)return;initialized=true;render();}
  function alignment(){
    const rows=D.nodes.map(node=>{
      const item=M.mapping[node.id];
      let dependencies=node.deps.length?node.deps.join(' + '):'无固定前置；仍须本节点条件';
      if(node.branchDeps)dependencies=Object.entries(node.branchDeps).map(([mode,ids])=>(mode==='pre'?'预付':'出口后')+'：'+ids.join(' + ')).join('；两者互斥');
      if(node.id==='N15')dependencies+='；已到账来源额外要求N13，垫资仅V2另审';
      return [node.id+' · '+node.title,dependencies,item[0]+'\n'+item[1],item[2]+'\n\n主流程条件：\n'+node.conditions.join('\n')];
    });
    return '<section class="database-card state-node-table"><div class="database-section-heading"><div><span class="database-eyebrow">CANONICAL PROCESS MAPPING</span><h3>N01—N23 · 主流程逐节点对齐</h3><p>节点名称、固定依赖、分支与条件直接读取主流程数据；“+”表示全部满足，不是任选其一。</p></div><span class="database-counter">'+D.nodes.length+' 个节点全覆盖</span></div>'+U.table(['主流程节点','必须满足的前置','状态对象 / 数据落点','完成口径与原始节点条件'],rows)+'</section>';
  }
  function render(){
    const domain=M.domains.find(item=>item.id===selected),current=domain.machines.find(item=>item.id===machineId)||domain.machines[0];machineId=current.id;
    $('state-design-tabs').innerHTML=M.domains.map(item=>'<button type="button" role="tab" id="state-tab-'+item.id+'" data-tab="'+item.id+'" aria-controls="state-design-panel" aria-selected="'+(selected===item.id)+'" tabindex="'+(selected===item.id?'0':'-1')+'">'+esc(item.name)+'</button>').join('');
    $('state-design-panel').setAttribute('aria-labelledby','state-tab-'+selected);
    $('state-design-panel').innerHTML='<p class="state-design-notice">对齐口径：主流程保留预付垫资及“按批准佣金规则”的通用分支；资金流设计V1规定不垫资、向D收取0.03%入账费与每贸易单300元申报费。以下保留主流程前置，并明确V1 / V2及收费版本，禁止混用。节点审核通过、内部审批与外部正式结果分别记录。</p>'+
      '<div class="state-machine-picker" role="group" aria-label="选择子状态机">'+domain.machines.map(item=>'<button type="button" data-machine="'+item.id+'" aria-pressed="'+(item.id===current.id)+'">'+esc(item.name)+'</button>').join('')+'</div>'+
      '<section class="database-card"><div class="database-section-heading"><div><span class="database-eyebrow">STATE TRANSITIONS</span><h3>'+esc(current.name)+'</h3><p>数据落点：'+esc(current.record)+'</p></div><span class="database-counter">'+Object.keys(current.states).length+' 个状态 · '+current.transitions.length+' 条转换</span></div><div id="state-design-diagram"></div><div class="database-legend"><span>箭头 = 触发事件</span><span>前置条件、责任方及副作用见转换表</span><span>无箭头的跳转默认禁止</span></div><ul class="database-rules">'+current.notes.map(note=>'<li>'+esc(note)+'</li>').join('')+'</ul></section>'+
      '<section class="database-card"><h3>状态转换契约</h3>'+U.table(['状态变化','触发事件','必须满足的条件','责任方 / 主流程节点','写入与异常边界'],current.transitions.map(row=>[current.states[row[0]]+' → '+current.states[row[1]],row[2],row[3],row[4]+'\n'+row[5],row[6]]))+'</section>'+
      '<section class="database-card"><h3>宽表执行与审计约束</h3><ol class="database-rules"><li>每次转换检查当前状态、业务版本、操作人授权、适用分支及全部前置；使用version乐观锁，额度操作再使用数据库锁与唯一约束。重复event_key不重复产生资金副作用。</li><li>业务宽表状态、operation_log与待发送integration_record在同库事务提交。历史前后状态、字段差异、审批、授权及证据路径存operation_log.details_json，保留发生 / 接收时间；交易每次成功变更还须INSERT完整前后trade_snapshot，记录操作人、原因、时间；审批另建快照记录审批人及被审版本，不回填旧快照。不另拆状态事件 / 审计变更关联表。</li><li>文件实际存储于文件系统；业务实体只记录file_record.storage_path。可修改文件每次保存生成新revision和新路径，全部旧版本保留；最大revision仅用于展示，不能替换历史审批、签署、申报或付款依据。</li><li>业务改用新文件路径或变更材料版本，须重新审批并使受影响批准失效；N23独立解冻后逐级重审。已发生签署、放行、入账和付款事实保留，不随材料修改回退。</li><li>失败 / 退回须有明确依据，超时维持未知或原处理中状态。拒绝、事务失败、重复和乱序回执单独记录；敏感动作审计不可写时不得无记录执行。</li><li>查阅、下载、检索、导出和文件修改均单独鉴权并留痕；日志归档 / 验真 / 保全保留操作证据。文件全部revision持续留档，不因链接到期或业务换版清除。</li></ol></section>'+
      (selected==='process'?alignment():'');
    U.mount($('state-design-diagram'),M.source(current),'state-'+current.id,current.name+'状态图');
  }
  function initialize(){
    U.bindTabs($('state-design-tabs'),id=>{selected=id;machineId=M.domains.find(item=>item.id===id).machines[0].id;render();});
    $('state-design-panel').addEventListener('click',event=>{
      const target=event.target.closest('[data-machine]');if(!target)return;
      machineId=target.dataset.machine;render();$('state-design-panel').querySelector('[data-machine="'+machineId+'"]').focus();
    });
  }
  root.EXPORT_STATE_WORKSPACE={initialize,show};
})(globalThis);
