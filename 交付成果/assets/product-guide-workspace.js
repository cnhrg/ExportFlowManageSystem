'use strict';
(function (root) {
  const M = root.EXPORT_PRODUCT_GUIDE, S = root.EXPORT_PRODUCT_STATE;
  const el = document.getElementById('product-workspace');
  if (!el) return;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const storageKey = 'export-product-workspace/v1';
  let state = S.initial(), raw = null, blocked = '', dirty = false, message = '', failures = [], drafts = {};
  let session = {role:'A', actor:'SYN-PERSON-1', source:'A'}, taskId = 'supplier-submit', query = '', step = '';
  try {
    raw = localStorage.getItem(storageKey);
    if (raw) state = S.validate(JSON.parse(raw));
  } catch (error) { blocked = '本机资料无法读取，已停止写入，未覆盖旧存档：' + error.message; }
  const task = () => M.tasks.find(item => item.id === taskId);
  const current = () => {
    const record = S.read(state, task(), session.source);
    return (task().viewers || []).includes(session.role) && (record?.status !== 'approved' || record?.stale) ? undefined : record;
  };
  const button = (action, text, disabled = false) => '<button type="button" data-product-action="' + action + '"' + (disabled ? ' disabled' : '') + '>' + text + '</button>';
  function write(action, input) {
    if (blocked) throw new Error(blocked);
    if (localStorage.getItem(storageKey) !== raw) throw new Error('另一页面已修改工作台资料；请先重新读取，未覆盖对方修改。');
    const next = structuredClone(state);
    const result = S.apply(next, taskId, session, action, input);
    const encoded = JSON.stringify(next);
    localStorage.setItem(storageKey, encoded);
    raw = encoded; state = next;
    dirty = false; drafts = {}; return result;
  }
  function render() {
    const definition = task(), record = current();
    const readable = M.canRead(definition, session.role);
    const writable = M.canWrite(definition, session.role) && session.role === session.source;
    const unknown = record?.receiptUnknown;
    const activeDocs = ['A','D'].includes(session.role) ? '对外产品需求与操作手册' : '对内运营产品需求与操作手册';
    const filtered = M.tasks.filter(item => (!step || item.step === Number(step)) && (item.title + item.nodes.join(' ') + item.usecases.join(' ')).toLowerCase().includes(query.toLowerCase()));
    el.innerHTML = '<div class="product-toolbar"><label>工作身份<select data-product-role>' +
      Object.entries(M.roles).map(([key, value]) => '<option value="' + key + '"' + (key === session.role ? ' selected' : '') + '>' + value[0] + '</option>').join('') +
      '</select></label><label>演示人员<select data-product-actor>' + ['SYN-PERSON-1','SYN-PERSON-2'].map(id => '<option' + (id === session.actor ? ' selected' : '') + '>' + id + '</option>').join('') +
      '</select></label><a href="../doc/' + activeDocs + '.html#task-' + definition.id + '">本任务产品说明与操作步骤</a>' + button('reload','重新读取本机资料') + '</div>' +
      '<p class="product-notice">离线合成工作台：角色切换仅预览权限，不是真实认证。仅输入合成资料，不保存真实证件、账号或文件。本机localStorage保存草稿和轨迹，其他设备不可见。正式银行、签署、海关、税务和结案执行均未接入。</p>' +
      '<p class="product-message" role="' + (failures.length || blocked ? 'alert' : 'status') + '" tabindex="-1">' + escape(blocked || message || 'A首次提交才创建演示交易；B在步骤一只读。B/E/F共用目录，动作仍按责任授权。') + '</p>' +
      (failures.length ? '<ul class="product-errors">' + failures.map(text => '<li>' + escape(text) + '</li>').join('') + '</ul>' : '') +
      '<div class="product-layout"><aside aria-label="共用任务目录"><form data-product-search><label>搜索任务或节点<input type="search" name="query" value="' + escape(query) + '"></label><label>流程<select name="step"><option value="">全部流程</option>' + M.steps.map((name,index) => '<option value="' + (index+1) + '"' + (Number(step) === index+1 ? ' selected' : '') + '>' + (index+1) + '. ' + name + '</option>').join('') + '</select></label><button>查询</button></form><nav>' +
      filtered.map(item => '<button type="button" data-product-task="' + item.id + '"' + (item.id === definition.id ? ' aria-current="page"' : '') + '><span>' + item.step + '. ' + escape(item.title) + '</span><small>' + (M.canWrite(item, session.role) ? '可办理本方资料' : M.canRead(item, session.role) ? '只读 / 独立审核' : '无数据权限') + '</small></button>').join('') +
      (!filtered.length ? '<p>没有匹配任务，请清空查询或切换流程。</p>' : '') + '</nav></aside><article id="product-task" tabindex="-1"><h3>' + escape(definition.title) + '</h3><p>' + escape(definition.goal) + '</p><p class="product-context">' + definition.nodes.join(' / ') + ' · DEMO-GUIDE-001 · ' + (state.tradeCreated ? '演示交易已创建' : '尚未创建交易') + '</p>' +
      (!readable ? '<p role="status">当前角色无此任务的数据权限。可以阅读目录和产品说明，不能查看或提交其他方资料。</p>' : detail(definition, record, writable, unknown)) +
      '</article></div>';
  }
  function detail(definition, record, writable, unknown) {
    const editable = writable && (record?.status !== 'submitted' || definition.mode === 'filing' && definition.id.endsWith('-edit')) && !unknown && !blocked;
    const original = definition.id === 'supplier-edit' ? state.records['supplier-submit'] : definition.id === 'payer-edit' ? state.records['payer-submit'] : null;
    const draftValues = drafts[S.recordKey(definition,session.source)] || record?.values || original?.values;
    const sources = ['B','reviewer'].includes(session.role) ? definition.owners : definition.owners.filter(role => role === session.role);
    if ((definition.viewers || []).includes(session.role) && !record) return '<p role="status">暂无已审且有效的本方付款发票，请联系B财务核对。待审稿和内部意见不对D展示。</p>';
    return (sources.length > 1 ? '<label>资料来源角色<select data-product-source>' + sources.map(role => '<option value="' + role + '"' + (role === session.source ? ' selected' : '') + '>' + M.roles[role][0] + '</option>').join('') + '</select></label>' : '') +
      '<dl class="product-rules"><dt>办理条件</dt><dd>' + escape(definition.gate) + '</dd><dt>当前版本</dt><dd>' + (record ? 'V' + record.version + ' · ' + M.states[record.status] + (record.stale ? ' · 上游已变更，原结论失效' : '') : '未保存') + '</dd><dt>结果边界</dt><dd>' + escape(definition.result) + '</dd></dl>' +
      '<ul class="product-dependencies">' + S.dependencies(state, definition).map(item => '<li>' + (item.ready ? '已具备演示依据：' : '尚缺：') + escape(item.title) + ' V' + item.version + '</li>').join('') + '</ul>' +
      '<form data-product-form data-version="' + (record?.version || 0) + '"><fieldset' + (!editable ? ' disabled' : '') + '><legend>本方合成资料</legend>' +
      definition.fields.map(field => '<label>' + escape(field.label) + '<input name="' + field.key + '"' + (field.key === 'relationshipEvidence' && draftValues?.relationshipKind === '同一法定主体' ? '' : ' required') + ' maxlength="1200" value="' + escape(draftValues?.[field.key] || '') + '" aria-describedby="guide-' + field.key + '"' + (['money','quantity','decimal','integer'].includes(field.kind) ? ' inputmode="decimal"' : '') + '><small id="guide-' + field.key + '">' + escape(field.rule) + '</small></label>').join('') +
      '</fieldset><div class="product-actions">' + (editable ? button('example','填入合成样例') + '<button type="submit">保存本方草稿 / 新修订</button>' : '') + (definition.id === 'supplier-submit' && writable && !state.tradeCreated ? button('reserve','预取演示交易号', Boolean(blocked)) : '') +
      '</div><label><input type="checkbox" name="confirmed">我已核对当前保存版本及其材料引用，确认提交此版本（仅合成演示）</label><div class="product-actions">' +
      (writable && record && ['draft','rejected','withdrawn'].includes(record.status) ? button('submit','确认提交', dirty || Boolean(blocked)) + button('submit-unknown','模拟提交响应丢失', dirty || Boolean(blocked)) : '') +
      (writable && record?.status === 'submitted' && definition.mode !== 'filing' ? button('withdraw','撤回待审申请', unknown || Boolean(blocked)) : '') +
      (writable && record?.requestId ? button('recover','恢复原受理 ' + record.requestId, Boolean(blocked)) : '') + '</div></form>' +
      (session.role === 'reviewer' && definition.mode === 'review' ? '<section class="product-review"><h4>独立审核当前V' + (record?.version || 0) + '</h4><label><input type="checkbox" data-product-checked>已逐项核对本版材料及上游版本</label><label>审核 / 退回意见<textarea data-product-reason maxlength="1200" rows="3"></textarea></label><div class="product-actions">' + button('approve','演示资料审核通过', !record || unknown || Boolean(blocked)) + button('reject','退回补正', !record || unknown || Boolean(blocked)) + '</div></section>' : '') +
      (definition.mode === 'external' ? '<div class="product-external"><p>正式办理前仍需真实身份、授权、正式来源与核实机制，当前均未接入。</p>' + button('execute','查看正式办理阻断原因') + '</div>' : '') +
      '<p>异常恢复：' + escape(definition.recovery) + '</p>' + ((definition.viewers || []).includes(session.role) ? '' : '<details><summary>本机版本与受理轨迹（' + (record?.history.length || 0) + '）</summary><ol>' +
      (record?.history || []).map(event => '<li>' + escape(event.time + ' · ' + event.actor + ' · V' + event.version + ' · ' + event.action + (event.reason ? ' · ' + event.reason : '')) + '</li>').join('') + '</ol></details>');
  }
  function route() {
    const match = location.hash.match(/^#product-workspace\/([A-Za-z]+)\/([a-z0-9-]+)$/);
    if (!match) return;
    if (!Object.hasOwn(M.roles, match[1]) || !M.tasks.some(item => item.id === match[2])) { message = '链接中的角色或任务不存在。'; render(); return; }
    session.role = match[1]; taskId = match[2]; session.source = task().owners.includes(session.role) ? session.role : task().owners[0];
    dirty = false; failures = []; render();
    root.EXPORT_APP?.showView('product-workspace');
  }
  function guard() {
    if (!dirty) return true;
    if (!window.confirm('存在未保存的修改。放弃这些修改并离开？')) return false;
    delete drafts[S.recordKey(task(),session.source)];
    dirty = false;
    return true;
  }
  el.addEventListener('input', event => {
    const form = event.target.closest('[data-product-form]');
    if (form && event.target.name !== 'confirmed') {
      dirty = true; drafts[S.recordKey(task(),session.source)] = Object.fromEntries(new FormData(form));
      if (event.target.name === 'relationshipKind') form.elements.relationshipEvidence.required = event.target.value !== '同一法定主体';
    }
  });
  el.addEventListener('change', event => {
    const field = event.target;
    if (!field.matches('[data-product-role],[data-product-actor],[data-product-source]')) return;
    if (!guard()) { render(); return; }
    if (field.matches('[data-product-role]')) session.role = field.value;
    if (field.matches('[data-product-actor]')) session.actor = field.value;
    session.source = field.matches('[data-product-source]') ? field.value : task().owners.includes(session.role) ? session.role : task().owners[0];
    dirty = false; failures = []; message = ''; render();
  });
  el.addEventListener('submit', event => {
    event.preventDefault();
    if (event.target.matches('[data-product-search]')) {
      if (!guard()) return;
      const data = new FormData(event.target); query = String(data.get('query')); step = String(data.get('step')); dirty = false; render(); return;
    }
    if (!event.target.matches('[data-product-form]')) return;
    const values = Object.fromEntries(new FormData(event.target)); failures = S.errors(task(), values);
    if (failures.length) { render(); return; }
    try { message = write('save', {values, version:Number(event.target.dataset.version)}); }
    catch (error) { message = error.message; failures = [message]; }
    render();
  });
  el.addEventListener('click', event => {
    const target = event.target.closest('[data-product-task],[data-product-action]');
    if (!target) return;
    failures = [];
    if (target.dataset.productTask) {
      if (!guard()) return;
      taskId = target.dataset.productTask; session.source = task().owners.includes(session.role) ? session.role : task().owners[0];
      dirty = false; message = ''; render(); document.getElementById('product-task').focus(); return;
    }
    const action = target.dataset.productAction;
    if (action === 'example') {
      for (const field of task().fields) el.querySelector('[name="' + field.key + '"]').value = field.example;
      const form = el.querySelector('[data-product-form]');
      if (form.elements.relationshipEvidence) form.elements.relationshipEvidence.required = form.elements.relationshipKind.value !== '同一法定主体';
      drafts[S.recordKey(task(),session.source)] = Object.fromEntries(new FormData(el.querySelector('[data-product-form]')));
      dirty = true; return;
    }
    if (action === 'reload') {
      if (!guard()) return;
      try { const latest = localStorage.getItem(storageKey); const parsed = latest ? S.validate(JSON.parse(latest)) : S.initial(); state = parsed; raw = latest; blocked = ''; message = '已读取本机最新存档。'; dirty = false; }
      catch (error) { blocked = error.message; }
      render(); return;
    }
    if (dirty && ['submit','submit-unknown'].includes(action)) { message = '请先保存修改，再确认提交当前保存版本。'; failures = [message]; el.querySelector('.product-message').textContent = message; return; }
    const form = el.querySelector('[data-product-form]');
    try {
      message = write(action, {version:Number(form?.dataset.version || 0), confirmed:Boolean(form?.elements.confirmed.checked), checked:Boolean(el.querySelector('[data-product-checked]')?.checked), reason:el.querySelector('[data-product-reason]')?.value || ''});
    } catch (error) { message = error.message; failures = [message]; }
    render(); el.querySelector('.product-message').focus();
  });
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  document.addEventListener('click', event => {
    if (dirty && (event.target.closest('.nav-item') || event.target.closest('a'))) {
      if (!guard()) { event.preventDefault(); event.stopImmediatePropagation(); }
      else dirty = false;
    }
  }, true);
  window.addEventListener('storage', event => {
    if (event.key === storageKey) { message = '另一页面已更新资料，请先保留当前输入，再重新读取。'; el.querySelector('.product-message').textContent = message; }
  });
  window.addEventListener('hashchange', () => { if (guard()) route(); });
  root.EXPORT_PRODUCT_WORKSPACE = {open(role = 'A', id = 'supplier-submit') {
    if (!guard()) return;
    const hash = '#product-workspace/' + role + '/' + id;
    if (location.hash === hash) route(); else location.hash = hash;
  }};
  render(); route();
})(globalThis);
