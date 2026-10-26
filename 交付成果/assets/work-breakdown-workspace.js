'use strict';
(function () {
  const section = document.getElementById('view-work-breakdown');
  const mapElement = document.getElementById('work-breakdown-tree');
  if (!section || !mapElement) return;

  const model = globalThis.EXPORT_WORK_BREAKDOWN;
  const MindMap = globalThis.simpleMindMap && globalThis.simpleMindMap.default;
  const search = document.getElementById('work-breakdown-search');
  const phaseNavigation = document.getElementById('work-breakdown-phases');
  let selectedPhase = 1;
  const count = document.getElementById('work-breakdown-count');
  const status = document.getElementById('work-breakdown-status');
  const detail = document.getElementById('work-breakdown-detail');
  const directory = document.getElementById('work-breakdown-accessible-list');
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);

  if (!MindMap) {
    status.textContent = '脑图库未能加载，请检查本地 assets/vendor/simpleMindMap.core.min.js 文件。';
    console.error('SimpleMindMap core bundle was not loaded.');
    return;
  }

  let mindMap = null;
  let expanded = false;
  let pendingFit = false;
  let pendingFocusUid = '';
  let debounceTimer = 0;

  function matches(query) {
    const normalized = query.trim().toLocaleLowerCase();
    return model.allTasks.filter(({ layer, capability, task }) => {
      if (task.phase !== selectedPhase) return false;
      if (!normalized) return true;
      const dependencyText = task.dependencies.map(id => {
        const dependency = model.packageIndex.get(id);
        return id + ' ' + (dependency ? dependency.task.title : '');
      });
      return [
        layer.title, layer.description, capability.title, capability.description,
        task.id, task.title, task.team, task.staffing, '第'+task.phase+'期', task.scope, task.deliverable,
        task.acceptance, ...task.subtasks.flatMap(step=>[step.action,step.logic,step.expected,step.test]),
        ...task.relatedUseCases.map(item=>item.name+' '+item.code),
        ...task.flowNodes.map(item=>item.id+' '+item.name),
        ...task.executionContext.openQuestions.map(item=>item.question), ...dependencyText
      ].join(' ').toLocaleLowerCase().includes(normalized);
    });
  }

  function staffingTotal(tasks) {
    return tasks.reduce((total, task) => total + task.personDays, 0);
  }

  function renderDirectory(found) {
    const visibleIds = new Set(found.map(entry => entry.task.id));
    const visibleLayers = model.layers.map((layer, layerIndex) => {
      const groups = layer.capabilities.map((capability, groupIndex) => {
        const tasks = capability.tasks.filter(task => visibleIds.has(task.id));
        if (!tasks.length) return '';
        return '<details class="work-breakdown-directory-group"><summary>' +
          escapeHtml((layerIndex + 1) + '.' + (groupIndex + 1) + ' ' + capability.title) +
          ' <span>' + tasks.length + '项 · ' + staffingTotal(tasks) + '人日</span></summary><ul>' +
          tasks.map(task => '<li><button type="button" data-work-package-open="' +
            escapeHtml(task.id) + '">' + escapeHtml(task.title) +
            ' <small class="work-breakdown-reference">'+escapeHtml(task.id)+'</small></button></li>').join('') +
          '</ul></details>';
      }).join('');
      if (!groups) return '';
      const layerTasks = layer.capabilities.flatMap(capability =>
        capability.tasks.filter(task => visibleIds.has(task.id)));
      return '<details class="work-breakdown-directory-layer"><summary>' +
        escapeHtml((layerIndex + 1) + '. ' + layer.title) +
        ' <span>' + layerTasks.length + '项 · ' + staffingTotal(layerTasks) +
        '人日</span></summary>' + groups + '</details>';
    }).join('');
    directory.innerHTML = visibleLayers ||
      '<p class="work-breakdown-directory-empty">没有匹配的工作包。</p>';
  }

  function treeNode(text, uid, nodeType, children, options = {}) {
    const data = {
      uid,
      text,
      expand: options.expand !== false,
      _nodeType: nodeType
    };
    if (options.staffingTotal !== undefined) data._staffingTotal = options.staffingTotal;
    if (options.workPackageId) data._workPackageId = options.workPackageId;
    if (options.layerId) data._layerId = options.layerId;
    if (options.capabilityId) data._capabilityId = options.capabilityId;
    return { data, children: children || [] };
  }

  function createTree(found, query) {
    const taskIds = new Set(found.map(entry => entry.task.id));
    const layers = model.layers.map((layer, layerIndex) => {
      const capabilities = layer.capabilities.map((capability, groupIndex) => {
        const visibleTasks = capability.tasks.filter(task => taskIds.has(task.id));
        const tasks = visibleTasks
          .map(task => treeNode(
            task.title + ' · ' + task.personDays + '人日',
            'work-' + task.id,
            'task',
            [],
            { workPackageId: task.id, staffingTotal: task.personDays }
          ));
        if (!tasks.length) return null;
        return treeNode(
          (layerIndex + 1) + '.' + (groupIndex + 1) + ' ' + capability.title +
            ' · ' + tasks.length + '项 · ' + staffingTotal(visibleTasks) + '人日',
          'capability-' + capability.id,
          'capability',
          tasks,
          {
            capabilityId: capability.id,
            expand: expanded || Boolean(query),
            staffingTotal: staffingTotal(visibleTasks)
          }
        );
      }).filter(Boolean);
      if (!capabilities.length) return null;
      const layerTaskCount = capabilities.reduce((total, group) =>
        total + group.children.length, 0);
      const layerStaffingTotal = capabilities.reduce((total, group) =>
        total + group.data._staffingTotal, 0);
      return treeNode(
        String(layerIndex + 1).padStart(2, '0') + ' ' + layer.title +
          ' · ' + layerTaskCount + '项 · ' + layerStaffingTotal + '人日',
        'layer-' + layer.id,
        'layer',
        capabilities,
        {
          layerId: layer.id,
          expand: expanded || Boolean(query),
          staffingTotal: layerStaffingTotal
        }
      );
    }).filter(Boolean);

    if (!layers.length) {
      layers.push(treeNode('没有匹配的工作包', 'no-results', 'empty', []));
    }
    return treeNode(
      model.phases.find(phase=>phase.id===selectedPhase).title+' · ' + found.length + '项 · ' +
        staffingTotal(found.map(entry => entry.task)) + '人日',
      'work-breakdown-root',
      'root',
      layers
    );
  }

  function renderTaskDetail(entry) {
    const { layer, capability, task } = entry;
    const context=task.executionContext;
    const items=values=>'<ul>'+values.map(value=>'<li>'+escapeHtml(value)+'</li>').join('')+'</ul>';
    const useCaseList=cases=>'<ul class="work-breakdown-usecases">'+cases.map(item=>
      '<li><a href="../doc/对内运营产品需求与操作手册.html#usecase-'+escapeHtml(item.id)+'">'+escapeHtml(item.name)+
      '</a><small class="work-breakdown-reference">'+escapeHtml(item.relationship+' · '+item.code)+'</small></li>').join('')+'</ul>';
    const directCases=task.relatedUseCases.filter(item=>item.relationship==='直接实现');
    const supportingCases=task.relatedUseCases.filter(item=>item.relationship!=='直接实现');
    const trace=step=>{
      const links=task.traceability.find(item=>item.subtaskId===step.id);
      return '<details><summary>对应流程与系统用例</summary><p>'+links.flowNodes.map(item=>'<a href="../doc/多期工作计划.html#flow-node-'+escapeHtml(item.id)+'">'+escapeHtml(item.name)+' <small>'+escapeHtml(item.id)+'</small></a>').join('；')+'</p>'+
        useCaseList(links.useCases)+'</details>';
    };
    const integration='<details data-work-integration><summary>联调场景与前置交付</summary>'+
      context.integrationScenarios.map(item=>'<section><h5>'+escapeHtml(item.name)+'</h5><p>'+escapeHtml(item.setup)+'</p><h5>操作</h5>'+items(item.steps)+'<h5>判定</h5>'+items(item.assertions)+'</section>').join('')+
      context.inputs.map(item=>'<section><h5>'+escapeHtml(item.title)+'</h5><p>'+escapeHtml(item.interfaceBoundary)+'</p><p>'+escapeHtml(item.contract)+'</p><p>'+escapeHtml(item.handoffTest)+'</p></section>').join('')+'</details>';
    const questions=context.openQuestions.length?'<section data-work-open-questions><h4>待确认与开工限制</h4>'+context.openQuestions.map(item=>
      '<p>'+escapeHtml(item.question)+'</p><p>'+escapeHtml('确认岗位：'+item.owner+'。影响：'+item.impact)+'</p>').join('')+'</section>':'';
    const dependencies = task.dependencies.length
      ? task.dependencies.map(id => {
        const dependency = model.packageIndex.get(id);
        return '<button type="button" class="work-breakdown-dependency" data-work-package-open="' +
          escapeHtml(id) + '">' + escapeHtml(dependency.task.title) + '</button>';
      }).join('')
      : '<span class="work-breakdown-no-dependencies">无，可独立启动</span>';
    detail.innerHTML = '<span class="work-breakdown-detail-kicker">' +
      escapeHtml(layer.title + ' / ' + capability.title) +
      '</span><h3>' + escapeHtml(task.title) + '</h3><p>'+escapeHtml(task.scope)+'</p>'+
      '<h4>具体工作</h4><div class="work-breakdown-subtasks">'+task.subtasks.map(step=>
        '<section class="work-breakdown-subtask" data-subtask="'+escapeHtml(step.id)+'"><h5>'+escapeHtml(step.action)+'</h5>'+
        '<dl><dt>处理逻辑</dt><dd>'+escapeHtml(step.logic)+'</dd><dt>预期结果</dt><dd>'+escapeHtml(step.expected)+
        '</dd><dt>如何测试</dt><dd>'+escapeHtml(step.test)+'</dd></dl>'+trace(step)+'</section>').join('')+'</div>'+
      questions+integration+
      '<h4>关联的系统用例</h4>'+ (directCases.length?useCaseList(directCases):'')+
      (supportingCases.length?'<details'+(!directCases.length && supportingCases.length<=9?' open':'')+'><summary>共用支撑或设计覆盖的系统用例（'+supportingCases.length+'项）</summary><p class="work-breakdown-reference">为这些用例提供共用能力或方案，不在本包重复实现业务。</p>'+useCaseList(supportingCases)+'</details>':'')+
      '<div class="work-breakdown-detail-dependencies"><h4>开始前需要完成</h4><div>'+dependencies+'</div></div>'+
      '<details><summary>来源与执行边界</summary><p>'+escapeHtml(context.ownershipBoundary)+'</p><h4>来源</h4><ul>'+
      context.sourceReferences.map(ref=>'<li><a href="../'+escapeHtml(ref.path)+'">'+escapeHtml(ref.path)+(ref.lineStart?'，第'+ref.lineStart+'至'+ref.lineEnd+'行':'')+'</a>'+(ref.reason?'：'+escapeHtml(ref.reason):'')+'</li>').join('')+'</ul>'+
      '<h4>必须遵守的规则</h4>'+items(context.sharedContext.invariants)+'<h4>遇到这些情况先停止</h4>'+items(context.stopConditions)+'</details>'+
      '<details><summary>来源冲突与复核限制</summary>'+items(context.sharedContext.auditCaveats)+'</details>'+
      '<p><a href="../doc/多期工作计划.html#package-'+task.id+'">在工作计划中查看</a></p>'+
      '<p><button type="button" data-work-context-download="'+escapeHtml(task.id)+'">下载完整执行说明</button></p>'+
      '<small class="work-breakdown-reference">引用编号 '+escapeHtml(task.id)+'</small>';
  }

  function showLayer(layer) {
    const found = matches(search.value).filter(entry => entry.layer.id === layer.id);
    const tasks = found.map(entry => entry.task);
    const taskCount = tasks.length;
    detail.innerHTML = '<span class="work-breakdown-detail-kicker">系统设计分层</span><h3>' +
      escapeHtml(layer.title) + '</h3><p>' + escapeHtml(layer.description) +
      '</p><p class="work-breakdown-detail-summary">' + taskCount + '个末级工作包 · ' +
      new Set(found.map(entry=>entry.capability.id)).size + '个能力域 · 当前筛选工作量 ' +
      staffingTotal(tasks) + '人日。</p>';
  }

  function showCapability(capability, layer) {
    const tasks = matches(search.value).filter(entry=>entry.capability.id===capability.id).map(entry=>entry.task);
    detail.innerHTML = '<span class="work-breakdown-detail-kicker">' +
      escapeHtml(layer.title) + '</span><h3>' + escapeHtml(capability.title) +
      '</h3><p>' + escapeHtml(capability.description) +
      '</p><p class="work-breakdown-detail-summary">' + tasks.length +
      '个末级工作包 · 当前筛选工作量 ' + staffingTotal(tasks) +
      '人日。</p><ul class="work-breakdown-detail-task-list">' +
      tasks.map(task => '<li><button type="button" data-work-package-open="' +
        escapeHtml(task.id) + '">' + escapeHtml(task.title) +
        '</button></li>').join('') + '</ul>';
  }

  function showNode(node) {
    const nodeType = node.getData('_nodeType');
    if (nodeType === 'task') {
      const entry = model.packageIndex.get(node.getData('_workPackageId'));
      if (entry) renderTaskDetail(entry);
      return;
    }
    if (nodeType === 'layer') {
      const layer = model.layers.find(item => item.id === node.getData('_layerId'));
      if (layer) showLayer(layer);
      return;
    }
    if (nodeType === 'capability') {
      for (const layer of model.layers) {
        const capability = layer.capabilities.find(item =>
          item.id === node.getData('_capabilityId'));
        if (capability) {
          showCapability(capability, layer);
          return;
        }
      }
    }
  }

  function afterTreeRender() {
    if (pendingFit) {
      pendingFit = false;
      mindMap.view.fit();
    }
    if (pendingFocusUid) {
      const node = mindMap.renderer.findNodeByUid(pendingFocusUid);
      if (node) node.highlight();
      pendingFocusUid = '';
    }
  }

  function updateMap() {
    const phase=model.phases.find(item=>item.id===selectedPhase);
    phaseNavigation.querySelectorAll('[data-work-phase]').forEach(button=>
      button.setAttribute('aria-pressed',String(Number(button.dataset.workPhase)===selectedPhase)));
    document.getElementById('work-breakdown-phase-title').textContent=phase.title;
    document.getElementById('work-breakdown-phase-goal').textContent=phase.goal;
    const query = search.value.trim();
    const found = matches(query);
    renderDirectory(found);
    count.textContent = found.length + ' / ' + phase.packages + ' 个工作包 · ' +
      staffingTotal(found.map(entry => entry.task)) + '人日（含方案设计）';
    status.textContent = query
      ? found.length
        ? '搜索结果已展开。点击脑图节点或文字版索引查看详情。'
        : '没有匹配项，请检查工作名称、系统用例、处理逻辑或测试方法。'
      : '默认显示到第二级；各节点汇总预计人日，非日历工期。点击工作查看功能及测试，点击用例名称查看说明。';
    if (!mindMap) return;
    pendingFit = true;
    mindMap.setData(createTree(found, query));
  }

  function openTask(id) {
    const entry = model.packageIndex.get(id);
    if (!entry) return;
    selectedPhase = entry.task.phase;
    search.value = id;
    renderTaskDetail(entry);
    pendingFocusUid = 'work-' + id;
    updateMap();
  }

  function mountMap() {
    if (mindMap || !section.classList.contains('active') ||
      !mapElement.clientWidth || !mapElement.clientHeight) return;
    try {
      mindMap = new MindMap({
        el: mapElement,
        data: null,
        layout: 'logicalStructure',
        readonly: true,
        fitPadding: 56,
        textAutoWrapWidth: 220,
        mousewheelAction: 'zoom',
        minZoomRatio: 20,
        maxZoomRatio: 300,
        enableDblclickBackToRootNode: true
      });
      mindMap.on('node_tree_render_end', afterTreeRender);
      mindMap.on('node_click', function (node) {
        showNode(node || this);
      });
      updateMap();
    } catch (error) {
      mindMap = null;
      status.textContent = '脑图初始化失败：' + (error && error.message
        ? error.message
        : '请检查本地资源和浏览器控制台。');
      console.error('SimpleMindMap initialization failed.', error);
    }
  }

  function activateMapWhenVisible() {
    window.requestAnimationFrame(() => {
      if (!section.classList.contains('active')) return;
      if (!mindMap) {
        mountMap();
      } else if (mapElement.clientWidth && mapElement.clientHeight) {
        mindMap.resize();
      }
    });
  }

  document.getElementById('work-breakdown-expand').addEventListener('click', () => {
    expanded = true;
    updateMap();
  });
  document.getElementById('work-breakdown-collapse').addEventListener('click', () => {
    search.value = '';
    expanded = false;
    updateMap();
  });
  document.getElementById('work-breakdown-fit').addEventListener('click', () => {
    if (mindMap) mindMap.view.fit();
  });
  document.getElementById('work-breakdown-zoom-out').addEventListener('click', () => {
    if (mindMap) mindMap.view.narrow();
  });
  document.getElementById('work-breakdown-zoom-in').addEventListener('click', () => {
    if (mindMap) mindMap.view.enlarge();
  });
  search.addEventListener('input', () => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(updateMap, 180);
  });
  phaseNavigation.addEventListener('click', event => {
    const button=event.target.closest('[data-work-phase]');
    if (!button || Number(button.dataset.workPhase)===selectedPhase) return;
    selectedPhase=Number(button.dataset.workPhase);
    search.value = '';
    expanded = false;
    detail.innerHTML = '<p class="work-breakdown-detail-empty">已切换期次。点击节点查看该期的汇总工作量、独立工作包及前置依赖。</p>';
    updateMap();
  });
  directory.addEventListener('click', event => {
    const button = event.target.closest('[data-work-package-open]');
    if (button) openTask(button.dataset.workPackageOpen);
  });
  detail.addEventListener('click', event => {
    const download=event.target.closest('[data-work-context-download]');
    if (download) {
      const task=model.packageIndex.get(download.dataset.workContextDownload).task;
      const blob=new Blob([JSON.stringify(task.executionContext,null,2)+'\n'],{type:'application/json;charset=utf-8'});
      const url=URL.createObjectURL(blob);
      const link=document.createElement('a');
      link.href=url;link.download=task.id+'-执行上下文.json';
      document.body.append(link);link.click();link.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url),1000);
      status.textContent='已发起“'+task.title+'”执行说明下载，包含完整来源、输入、功能及交接信息。请确认文件已保存。';
      return;
    }
    const button = event.target.closest('[data-work-package-open]');
    if (button) openTask(button.dataset.workPackageOpen);
  });

  if (typeof ResizeObserver !== 'undefined') {
    const resizeObserver = new ResizeObserver(activateMapWhenVisible);
    resizeObserver.observe(mapElement);
  }
  const visibilityObserver = new MutationObserver(activateMapWhenVisible);
  visibilityObserver.observe(section, { attributes: true, attributeFilter: ['class'] });
  function openRoute() {
    if (location.hash === '#work-breakdown') globalThis.EXPORT_APP.showView('work-breakdown');
  }
  window.addEventListener('hashchange', openRoute);
  openRoute();
  window.setTimeout(activateMapWhenVisible, 0);
  updateMap();
})();
