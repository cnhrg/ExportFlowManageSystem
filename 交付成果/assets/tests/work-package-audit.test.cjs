'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const W=require('../work-breakdown.js');
const root=path.resolve(__dirname,'../../..');
test('every audited package carries sourced subtask traceability and executable handoffs',()=>{
  const nodes=new Set(),agents=new Set(),sourceLines=new Map();
  for (const {task} of W.allTasks) {
    const audit=task.audit,C=task.executionContext;
    assert.ok(audit && audit.status && audit.summary,task.id);
    agents.add(audit.agent);
    assert.equal(task.traceability.length,task.subtasks.length,task.id);
    assert.equal(audit.subtaskLinks.length,task.subtasks.length,task.id);
    assert.ok(audit.sourceReferences.length>0,task.id);
    for (const ref of audit.sourceReferences) {
      if (!sourceLines.has(ref.path)) sourceLines.set(ref.path,fs.readFileSync(path.join(root,ref.path),'utf8').split('\n'));
      assert.ok(ref.lineStart>=1 && ref.lineEnd>=ref.lineStart && ref.lineEnd<=sourceLines.get(ref.path).length,task.id+' '+ref.path);
      assert.ok(ref.reason,task.id);
      assert.equal(ref.sha256,createHash('sha256').update(fs.readFileSync(path.join(root,ref.path))).digest('hex'),task.id+' source changed: '+ref.path);
    }
    for (const trace of task.traceability) {
      assert.ok(trace.flowNodes.length>0 && trace.useCases.length>0,task.id+' '+trace.subtaskId);
      for (const node of trace.flowNodes) {
        assert.match(node.id,/^N(?:0[1-9]|1[0-9]|2[0-3])$/);
        assert.ok(node.name,task.id);nodes.add(node.id);
      }
      for (const item of trace.useCases) assert.ok(task.relatedUseCases.some(related=>related.id===item.id && related.name===item.name),trace.subtaskId);
    }
    assert.ok(C.integrationScenarios.length>0,task.id);
    for (const scenario of C.integrationScenarios) {
      assert.ok(scenario.name && scenario.setup && scenario.steps.length && scenario.assertions.length,task.id);
    }
    for (const input of C.inputs) assert.ok(input.interfaceBoundary && input.contract && input.handoffTest,task.id+' '+input.id);
    for (const question of C.openQuestions) assert.ok(question.question && question.owner && question.impact,task.id);
    assert.deepEqual(task.dependencies.slice().sort(),C.inputs.map(input=>input.id).sort(),task.id+' handoff coverage');
    assert.equal(audit.subtaskChanges.length,audit.before.subtaskCount,task.id+' old task mapping');
    for (const change of audit.subtaskChanges) assert.ok(change.currentIds.length && change.currentIds.every(id=>W.allTasks.some(entry=>entry.task.subtasks.some(step=>step.id===id))),task.id);
  }
  assert.equal(nodes.size,23);
  assert.equal(agents.size,4);
});
test('main-agent samples cover every nonempty layer-phase and each independent audit group',()=>{
  const sampled=W.allTasks.filter(({task})=>task.audit.review),agentSamples=new Map();
  for (const {task} of sampled) agentSamples.set(task.audit.agent,(agentSamples.get(task.audit.agent)||0)+1);
  for (const {layer,task} of W.allTasks) {
    assert.ok(sampled.some(entry=>entry.layer.id===layer.id && entry.task.phase===task.phase),layer.id+' '+task.phase);
    assert.ok(agentSamples.get(task.audit.agent)>=2,task.audit.agent);
  }
  for (const {task} of W.allTasks) {
    if (task.audit.estimateChange || task.audit.dependencyChanges.add.length || task.audit.dependencyChanges.remove.length) assert.ok(task.audit.review,task.id+' material change not reviewed');
  }
});
test('independent customs lookup is supporting evidence rather than an invented history-query contract',()=>{
  const task=W.packageIndex.get('FE-11').task;
  const index=task.subtasks.findIndex(step=>step.logic.includes('不冒用历史查询'));
  assert.ok(index>=0);
  assert.ok(task.traceability[index].useCases.every(item=>item.relationship==='共用支撑'));
  assert.ok(task.executionContext.openQuestions.length>0);
  assert.ok(!W.useCases.some(item=>item.id==='customs-lookup'),'do not invent a use case to conceal a missing contract');
});
test('fee implementation moves to settlement without double-counting effort or losing old test references',()=>{
  const invoice=W.packageIndex.get('FIN-03').task,settlement=W.packageIndex.get('FIN-05').task;
  assert.equal(invoice.baselinePersonDays,3);
  assert.equal(settlement.baselinePersonDays,12);
  assert.equal(invoice.personDays+settlement.personDays,invoice.audit.before.personDays+settlement.audit.before.personDays);
  assert.ok(invoice.audit.subtaskChanges.some(change=>change.currentIds.includes('FIN-05-S4')));
  assert.ok(settlement.dependencies.includes('DM-08'));
  assert.ok(settlement.executionContext.openQuestions.some(item=>item.impact.includes('阻断真实收费')));
  assert.match(settlement.subtasks[3].logic,/首次获批分账/);
  assert.match(settlement.subtasks[3].test,/299.99/);
  assert.doesNotMatch(W.packageIndex.get('FE-08').task.subtasks.map(step=>step.test).join(' '),/独立账单|不新增欠费付款门禁/);
});
