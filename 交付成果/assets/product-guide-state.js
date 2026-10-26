'use strict';
(function (root) {
  const M = root.EXPORT_PRODUCT_GUIDE || (typeof require === 'function' && require('./product-guide-model.js'));
  const initial = () => ({schema:1, sequence:0, reserved:false, tradeCreated:false, records:{}});
  const recordKey = (task, source) => task.id + (task.owners.length > 1 ? ':' + source : '');
  const read = (state, task, source) => state.records[recordKey(task, source)];
  function validate(state) {
    if (!state || state.schema !== 1 || !Number.isSafeInteger(state.sequence) || typeof state.reserved !== 'boolean' ||
      typeof state.tradeCreated !== 'boolean' || !state.records || Array.isArray(state.records)) throw new Error('工作台存档格式不兼容，停止写入；请保留现有存档。');
    for (const [key, record] of Object.entries(state.records)) {
      const task = M.tasks.find(item => recordKey(item, record.source) === key);
      if (!task || !task.owners.includes(record.source) || !M.states[record.status] ||
        !Number.isSafeInteger(record.version) || record.version < 1 || !Array.isArray(record.history) ||
        !record.values || Object.values(record.values).some(value => typeof value !== 'string')) throw new Error('工作台记录损坏，停止写入：' + key);
    }
    return state;
  }
  function dependencies(state, task) {
    return task.dependencies.map(id => {
      const upstream = M.tasks.find(item => item.id === id);
      const record = read(state, upstream, upstream.owners[0]);
      const ready = record && !record.stale && (upstream.mode === 'filing' ? record.status === 'submitted' : record.status === 'approved');
      return {id, title:upstream.title, ready:Boolean(ready), version:record?.version || 0};
    });
  }
  function errors(task, values) {
    values = Object.fromEntries(Object.entries(values).map(([key,value]) => [key,String(value ?? '').trim()]));
    const problems = task.fields.flatMap(field => {
      const value = String(values[field.key] || '').trim();
      if (field.key === 'relationshipEvidence' && values.relationshipKind === '同一法定主体') return [];
      if (!value) return [field.label + '：请填写'];
      if (value.length > 1200) return [field.label + '：最多1200字'];
      if (field.kind === 'money' && !/^(0|[1-9]\d{0,15})(\.\d{1,2})?$/.test(value)) return [field.label + '：请输入非负人民币金额，最多两位小数'];
      if (['quantity','decimal'].includes(field.kind) && (!/^(0|[1-9]\d{0,12})(\.\d{1,6})?$/.test(value) || field.kind === 'quantity' && !/[1-9]/.test(value))) return [field.label + '：数量须为正数，重量非负，最多六位小数'];
      if (field.kind === 'integer' && !/^(0|[1-9]\d{0,8})$/.test(value)) return [field.label + '：请输入非负整数'];
      if (field.kind === 'currency' && value !== 'CNY') return [field.label + '：仅支持人民币CNY'];
      if (field.kind === 'relationship' && !['同一法定主体','不同法定主体'].includes(value)) return [field.label + '：请选择明确的法定主体关系'];
      return [];
    });
    if (!problems.length && values.netWeight !== undefined) {
      const scaled = value => {const [whole,part = ''] = value.split('.');return BigInt(whole) * 1000000n + BigInt(part.padEnd(6,'0'));};
      if (scaled(values.grossWeight) < scaled(values.netWeight)) problems.push('毛重不得小于净重');
      if (scaled(values.quantity) * scaled(values.unitPrice) !== scaled(values.money) * 1000000n) problems.push('本合成商品行的数量×单价须与人民币金额一致；不自动舍入或换汇');
    }
    return problems;
  }
  function invalidate(state, taskId, excluded) {
    const affected = new Set([taskId]);
    let added = true;
    while (added) {
      added = false;
      for (const item of M.tasks) if (!affected.has(item.id) && item.dependencies.some(id => affected.has(id))) {
        affected.add(item.id); added = true;
      }
    }
    for (const [key, record] of Object.entries(state.records)) {
      const definition = M.tasks.find(item => recordKey(item, record.source) === key);
      if (!excluded.includes(key) && definition.mode !== 'filing' && affected.has(definition.id)) { record.stale = true; record.approval = null; }
    }
  }
  function apply(state, taskId, session, action, input = {}) {
    validate(state);
    const task = M.tasks.find(item => item.id === taskId);
    if (!task || !Object.hasOwn(M.roles, session.role) || !['SYN-PERSON-1','SYN-PERSON-2'].includes(session.actor)) throw new Error('未知任务或演示身份。');
    if (!M.canRead(task, session.role)) throw new Error('无此任务的数据权限；共享目录不授予业务访问权。');
    const source = session.source || session.role;
    if (!task.owners.includes(source)) throw new Error('资料来源角色不适用。');
    const key = recordKey(task, source);
    let record = state.records[key];
    const edit = M.canWrite(task, session.role) && session.role === source;
    if (action === 'reserve') {
      if (task.id !== 'supplier-submit' || session.role !== 'A') throw new Error('仅A可在首次提交前预取号。');
      if (state.tradeCreated) throw new Error('本演示交易已创建，请修改原资料，不另取号。');
      state.reserved = true;
      return '已保留同一合成交易号 DEMO-GUIDE-001；尚未创建交易。';
    }
    if (action === 'recover') {
      if (!record || record.submitter !== session.actor || !edit) throw new Error('仅原提交人可恢复本方原受理。');
      record.receiptUnknown = false;
      return '已恢复原受理 ' + record.requestId + '，版本V' + record.submittedVersion + '；未重新提交或改变业务状态。';
    }
    if (action === 'execute') throw new Error('正式办理已阻断：未接入真实身份、官方渠道及独立证据核实，不生成银行付款、签署、放行、证明、退税或结案成功事实。');
    if (action === 'save') {
      if (!edit) throw new Error('本角色只能查询，不能修改其他责任方资料。');
      if (record?.receiptUnknown) throw new Error('先由原提交人恢复原受理，不能在结果未知时改版。');
      if (record?.status === 'submitted' && !(task.mode === 'filing' && task.id.endsWith('-edit'))) throw new Error('资料待审核，请由原提交人撤回或等待退回后补正。');
      if (record && input.version !== record.version) throw new Error('资料版本已变化，请重读比较后再保存。');
      if (task.id === 'supplier-edit') {
        const payer = state.records['payer-submit'];
        const supplier = state.records['supplier-submit'];
        if (payer?.status === 'submitted' && supplier && ['consignee','nominatedPayer'].some(key => String(input.values?.[key] ?? '').trim() !== supplier.values[key])) throw new Error('已有D付款关系声明，变更收货主体及付款安排须先核实关系依赖，本演示不允许覆盖。');
      }
      const problems = errors(task, input.values || {});
      if (problems.length) throw new Error(problems.join('；'));
      record = record || {source, version:0, status:'draft', history:[]};
      record.version += 1;
      if (task.id === 'supplier-edit' || task.id === 'payer-edit') {
        const originalId = task.id === 'supplier-edit' ? 'supplier-submit' : 'payer-submit';
        record.originalVersion = state.records[originalId]?.version;
        if (!record.originalVersion) throw new Error('请先首次提交本方资料，再从原资源修改入口修订。');
      }
      record.values = Object.fromEntries(task.fields.map(field => [field.key, String(input.values[field.key] ?? '').trim()]));
      record.status = 'draft'; record.stale = false; record.approval = null; record.editor = session.actor;
      state.records[key] = record;
      invalidate(state,task.id,[key]);
    } else {
      if (!record) throw new Error('先完整填写并保存本方资料。');
      if (input.version !== record.version) throw new Error('版本已变化，请重新打开详情核对。');
      if (record.receiptUnknown) throw new Error('先恢复原受理，不得换号提交、撤回或批准。');
      if (['submit','submit-unknown'].includes(action)) {
        if (!edit) throw new Error('只能提交本人角色负责的资料。');
        if (!['draft','rejected','withdrawn'].includes(record.status)) throw new Error('当前版本已提交或已审；相同操作不能再创建第二份。');
        if (!input.confirmed) throw new Error('提交前请核对本次确切版本并确认。');
        if (record.stale || dependencies(state, task).some(item => !item.ready)) throw new Error('上游资料缺失、未通过或版本变化；请先处理列出的前置任务。');
        if (task.id === 'supplier-submit' && !state.reserved) throw new Error('A首次提交前须预取号。');
        if (task.id !== 'supplier-submit' && !state.tradeCreated) throw new Error('A首次提交后才有交易；不能由B或D创建空壳。');
        if (task.id === 'supplier-submit' && state.tradeCreated) throw new Error('A已首次提交，请使用“A修改原资料”保存新修订。');
        if (task.id.endsWith('-edit') && state.records[task.id === 'supplier-edit' ? 'supplier-submit' : 'payer-submit']?.version !== record.originalVersion) throw new Error('原资料版本已变化，请重新读取比较后保存修订。');
        record.status = 'submitted'; record.submitter = session.actor; record.submittedVersion = record.version;
        record.dependencyVersions = dependencies(state, task);
        record.requestId = 'SYN-REQUEST-' + (++state.sequence);
        record.receiptUnknown = action === 'submit-unknown';
        if (task.id === 'supplier-submit') state.tradeCreated = true;
        if (task.id === 'supplier-edit' || task.id === 'payer-edit') {
          const originalId = task.id === 'supplier-edit' ? 'supplier-submit' : 'payer-submit';
          const original = state.records[originalId];
          if (!original) throw new Error('原资料不存在，不能创建第二份替代资料。');
          if (original.version !== record.originalVersion) throw new Error('原资料版本已变化，请重新读取比较后保存修订。');
          original.values = {...original.values, ...record.values};
          original.version += 1;
          original.history.push({action:'replace-original', actor:session.actor, role:session.role, version:original.version, reason:'原资源本方完整修订', time:new Date().toISOString()});
          invalidate(state,originalId,[key,originalId]);
        }
      } else if (action === 'withdraw') {
        if (!edit || record.submitter !== session.actor || record.status !== 'submitted' || task.mode === 'filing') throw new Error('只能由原提交人撤回本方待审申请；首次资料不能用撤回删除已创建交易。');
        record.status = 'withdrawn';
      } else if (action === 'approve' || action === 'reject') {
        if (session.role !== 'reviewer' || task.mode !== 'review') throw new Error('本任务不开放此审核动作；文件声明不能直接变成正式事实。');
        if (record.status !== 'submitted') throw new Error('只审核当前待审确切版本。');
        if (record.editor === session.actor || record.submitter === session.actor) throw new Error('经办审核必须分离，不能审核本人修改或提交的版本。');
        if (!String(input.reason || '').trim()) throw new Error('审核或退回必须填写具体意见。');
        if (action === 'approve' && (!input.checked || record.stale || dependencies(state, task).some(item => !item.ready) ||
          JSON.stringify(record.dependencyVersions) !== JSON.stringify(dependencies(state, task)))) throw new Error('核对未完成或上游版本变化，不能沿用旧审核。');
        record.status = action === 'approve' ? 'approved' : 'rejected';
        record.approval = action === 'approve' ? {actor:session.actor, version:record.version} : null;
      } else throw new Error('未支持的操作。');
    }
    record.history.push({action, actor:session.actor, role:session.role, version:record.version, reason:String(input.reason || ''), time:new Date().toISOString()});
    return action === 'save' ? '本方合成资料已保存为V' + record.version + '；未提交。' :
      record.receiptUnknown ? '模拟受理已保存但响应丢失：请恢复原受理，不要重新提交。' :
      action === 'approve' ? '仅本机演示资料审核通过，不代表真实业务批准或外部成功。' : '操作已保存；当前状态：' + M.states[record.status] + '。';
  }
  const api = {initial, validate, recordKey, read, dependencies, errors, apply};
  root.EXPORT_PRODUCT_STATE = api;
  if (typeof module === 'object') module.exports = api;
})(globalThis);
