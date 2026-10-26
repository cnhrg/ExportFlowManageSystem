'use strict';
(function(root){
  const M=root.EXPORT_DATABASE_MODEL,U=root.EXPORT_DESIGN_DIAGRAMS;
  const $=id=>document.getElementById(id),esc=U.escape;
  let selected='trade',initialized=false,query='';
  function show(id){
    const changed=id&&M.domains.some(domain=>domain.id===id)&&selected!==id;
    if(changed)selected=id;
    if(!initialized||changed){initialized=true;render();}
  }
  function select(id){
    if(!M.domains.some(domain=>domain.id===id))throw new Error('未知数据库领域：'+id);
    selected=id;render();
    history.replaceState(null,'','#database-design/'+id);
  }
  function filter(){
    const value=query.trim().toLowerCase();
    const details=[...$('database-panel').querySelectorAll('[data-model-search]')];
    for(const item of details){
      item.hidden=value!==''&&!item.dataset.modelSearch.includes(value);
      if(value&&!item.hidden)item.open=true;
    }
    const visible=details.filter(item=>!item.hidden).length;
    $('database-search-status').textContent=value?'当前领域匹配 '+visible+' 项实体/码表；清空可恢复全部。':'当前领域共 '+details.length+' 项实体/码表，可展开阅读。';
    $('database-search-empty').hidden=visible!==0;
  }
  function render(){
    const domain=M.domains.find(item=>item.id===selected),relations=M.relations[selected]||[];
    $('database-model-count').textContent=M.stats.domains+' 个领域 · '+M.stats.entities+' 个实体';
    $('database-tabs').innerHTML=M.domains.map((item,index)=>'<button type="button" role="tab" id="database-tab-'+item.id+'" data-tab="'+item.id+'" aria-controls="database-panel" aria-selected="'+(selected===item.id)+'" tabindex="'+(selected===item.id?'0':'-1')+'"><small>'+String(index+1).padStart(2,'0')+'</small>'+esc(item.name)+'</button>').join('');
    $('database-panel').setAttribute('aria-labelledby','database-tab-'+selected);
    const books=(domain.codebooks||[]).map(book=>'<details class="database-entity-fields" data-model-search="'+esc([book.name,book.rule,...book.values.flat()].join(' ').toLowerCase())+'"><summary>'+esc(book.name)+' · '+book.values.length+'个码值</summary>'+U.table(['编码','名称','定义'],book.values)+'<p class="database-boundary">'+esc(book.rule)+'</p></details>').join('');
    const fields=domain.entities.map(entity=>'<details class="database-entity-fields" data-model-search="'+esc([entity.name,entity.title,entity.rule,...entity.fields.flat()].join(' ').toLowerCase())+'"><summary>'+esc(entity.title)+' · '+esc(entity.name)+'（'+M.fieldRows(domain,entity).length+'字段）</summary><p class="database-muted">索引定义：'+esc(entity.keys)+'</p>'+U.table(['字段','类型','索引','示例','说明 / 枚举'],M.fieldRows(domain,entity))+'<p class="database-boundary">'+esc(entity.rule)+'</p></details>').join('');
    $('database-panel').innerHTML=
      '<section class="database-card database-er"><div class="database-section-heading"><h3>'+esc(domain.name)+' · 实体关系图</h3><a class="database-design-link" href="#state-design/'+domain.id+'">查看本域状态机</a></div><div id="database-er-diagram"></div><p class="database-muted">PK主键、UK唯一键；跨域节点仅为逻辑引用，不表示物理外键。完整类型与约束见字段字典。</p><h4 class="database-subheading">关系与跨域交接</h4>'+U.table(['来源','目标','基数 / 范围','引用与事实归属'],relations)+'</section>'+
      '<section class="database-card database-field-dictionary"><h3>实体字段、索引与受控码表</h3><div class="database-search-tools"><label for="database-model-search">搜索当前领域实体、字段及码表</label><input id="database-model-search" type="search" value="'+esc(query)+'" autocomplete="off" placeholder="例如 trade_number、生命周期、HMAC"><button type="button" data-model-expand="true">展开匹配项</button><button type="button" data-model-expand="false">收起匹配项</button></div><p id="database-search-status" class="database-muted" role="status" aria-live="polite"></p><p id="database-search-empty" class="database-boundary" hidden>本领域无匹配，请清空搜索或切换领域。</p>'+fields+books+'<a class="database-design-link" href="../doc/领域拆分评估与交易域设计.md#11-json-字段结构定义" target="_blank" rel="noopener">JSON结构定义（第11节）</a></section>';
    filter();
    U.mount($('database-er-diagram'),M.source(domain),'database-'+domain.id,domain.name+' ER 图',{entities:domain.entities.map(entity=>({id:entity.name,name:entity.title})),focus:domain.entities[0].name});
  }
  function initialize(){
    U.bindTabs($('database-tabs'),select);
    $('database-panel').addEventListener('input',event=>{
      if(event.target.id==='database-model-search'){query=event.target.value;filter();}
    });
    $('database-panel').addEventListener('click',event=>{
      const button=event.target.closest('[data-model-expand]');
      if(button)for(const item of $('database-panel').querySelectorAll('[data-model-search]'))if(!item.hidden)item.open=button.dataset.modelExpand==='true';
    });
  }
  root.EXPORT_DATABASE_WORKSPACE={initialize,show};
})(globalThis);
