'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const W = require('../work-breakdown.js');
const root = path.resolve(__dirname,'../../..');
const read = name => fs.readFileSync(path.join(root,name),'utf8');

test('work packages cover current use cases, remain independently specified and form an ordered dependency graph', () => {
  const visited = new Set(), active = new Set();
  function visit(entry) {
    const task = entry.task;
    assert.ok(!active.has(task.id),'cycle at '+task.id);
    if (visited.has(task.id)) return;
    active.add(task.id);
    for (const id of task.dependencies) {
      const dependency = W.packageIndex.get(id);
      assert.ok(dependency,task.id+' missing '+id);
      assert.ok(dependency.task.phase <= task.phase,task.id+' depends on a later phase');
      visit(dependency);
    }
    active.delete(task.id);
    visited.add(task.id);
  }
  for (const entry of W.allTasks) {
    const task = entry.task;
    assert.ok(task.personDays > 0 && Number.isFinite(task.personDays),task.id);
    assert.ok(task.staffingCount >= 1 && task.staffingCount <= 2,task.id);
    for (const key of ['scope','deliverable','acceptance','team']) assert.ok(task[key].length > 0,task.id+' '+key);
    for (const id of task.usecases) assert.ok(W.useCases.some(item=>item.id===id),id);
    visit(entry);
  }
  for (const item of W.useCases) assert.ok(W.allTasks.some(entry=>entry.task.phase===1 && entry.task.usecases.includes(item.id)),item.name);
  assert.equal(visited.size,W.allTasks.length);
});

test('phase one permits only bank integration and excludes the deferred customs lookup', () => {
  const integrations = W.allTasks.filter(entry=>entry.layer.id==='integration' && entry.task.phase===1);
  assert.ok(integrations.length > 0);
  assert.ok(integrations.every(entry=>entry.task.channel==='bank'));
  const lookups = W.allTasks.filter(entry=>entry.task.feature==='customs-lookup');
  assert.ok(lookups.length > 0);
  assert.ok(lookups.every(entry=>entry.task.phase>1));
  for (const channel of ['signing','logistics','notification','customs','tax','customs-data','screening']) {
    assert.ok(W.allTasks.some(entry=>entry.task.channel===channel && entry.task.phase>1),channel);
  }
});

test('design is included once in each phase and gates delivery without forcing a budget ratio', () => {
  for (const phase of W.phases) {
    const tasks=W.allTasks.filter(entry=>entry.task.phase===phase.id).map(entry=>entry.task);
    const designs=tasks.filter(task=>task.kind==='design');
    assert.equal(designs.length,1);
    assert.equal(phase.personDays,tasks.reduce((sum,task)=>sum+task.personDays,0));
    assert.equal(phase.personDays,phase.designDays+phase.deliveryDays);
    assert.ok(phase.baselineDesignRatio > 0 && phase.baselineDesignRatio < 1);
    assert.equal(phase.designRatio,phase.designDays/phase.personDays);
    assert.equal(phase.designDays,designs[0].personDays);
    assert.ok(tasks.filter(task=>task.kind!=='design').every(task=>task.dependencies.includes(designs[0].id)));
  }
  assert.ok(W.packageIndex.get('DES-3').task.dependencies.includes('FIN-11'));
  assert.ok(W.packageIndex.get('BL-19').task.dependencies.includes('FIN-12'));
});

test('audited estimates remain bottom-up and explain material changes from the snapshot', () => {
  const ratios=new Set();
  for (const {task} of W.allTasks) {
    assert.equal(task.baselinePersonDays,require('../work-package-context.js')[task.id].steps.reduce((sum,step)=>sum+step.personDays,0),task.id);
    if (task.phase===1) ratios.add(task.baselinePersonDays/task.previousPersonDays);
    if (task.audit.estimateChange) {
      assert.ok(task.audit.estimateChange.reason.length>0,task.id);
    } else {
      assert.equal(task.baselinePersonDays,task.audit.before.baselinePersonDays,task.id);
    }
  }
  assert.ok(ratios.size>1,'not a uniform percentage discount');
  for (const phase of W.phases) {
    assert.equal(phase.previousPersonDays,W.allTasks.filter(entry=>entry.task.phase===phase.id).reduce((sum,entry)=>sum+entry.task.previousPersonDays,0));
  }
  const first=W.phases[0];
  assert.ok(first.personDays<first.previousPersonDays);
  assert.equal(first.riskDays,W.allTasks.filter(entry=>entry.task.phase===1).reduce((sum,entry)=>sum+(entry.task.estimate.risk?.extraDays || 0),0));
  assert.match(W.estimateBasis.status,/未采集实际工时/);
  assert.match(W.estimateBasis.personnel,/高级工程师/);
});

test('all work uses double efficiency with package-level half-day upward rounding', () => {
  const definitions=require('../work-package-context.js');
  for (const {task} of W.allTasks) {
    assert.equal(task.baselinePersonDays,definitions[task.id].steps.reduce((sum,step)=>sum+step.personDays,0));
    assert.equal(task.personDays,Math.ceil(task.baselinePersonDays/2*2)/2,task.id);
    assert.equal(task.personDays*2,Math.ceil(task.personDays*2));
    assert.equal(task.estimate.savedPersonDays,task.baselinePersonDays-task.personDays);
    for (const step of task.subtasks) {
      assert.deepEqual(Object.keys(step).sort(),['action','expected','id','logic','test']);
      assert.ok(!/人日|效率|估算|工时/.test([step.action,step.logic,step.expected,step.test].join(' ')),step.id);
    }
    if (task.estimate.risk) assert.equal(task.estimate.risk.extraDays,Math.ceil(task.estimate.risk.baselineExtraDays)/2);
  }
  for (const phase of W.phases) {
    const tasks=W.allTasks.filter(entry=>entry.task.phase===phase.id).map(entry=>entry.task);
    assert.equal(phase.personDays,tasks.reduce((sum,task)=>sum+task.personDays,0));
    assert.ok(phase.personDays<phase.baselinePersonDays);
  }
  assert.equal(W.packageIndex.get('DES-1').task.personDays,W.packageIndex.get('DES-1').task.baselinePersonDays/2);
  assert.equal(W.packageIndex.get('INT-04').task.personDays,W.packageIndex.get('INT-04').task.baselinePersonDays/2);
  assert.match(W.estimateBasis.ai,/全部工作均按2倍/);
});

test('every leaf has a self-contained PIC and agent handoff with valid sources, checks and input artifacts', () => {
  const archive=JSON.parse(read('doc/工作包执行上下文.json'));
  const plan=read('doc/多期工作计划.html');
  assert.equal(archive.schemaVersion,3);
  assert.deepEqual(archive.packages,W.allTasks.map(entry=>entry.task.executionContext));
  for (const {task} of W.allTasks) {
    const context=task.executionContext;
    assert.deepEqual(context.relatedUseCases,task.relatedUseCases);
    assert.match(context.assignment.status,/未分派实名/);
    assert.ok(context.assignment.owner && context.assignment.reviewer && context.assignment.ownerDuty && context.assignment.reviewerDuty,task.id);
    assert.equal(context.assignment.headcount,2);
    assert.ok(context.sourceReferences.length>0 && context.subtasks.length>=2,task.id);
    assert.ok(context.sharedContext.invariants.length>0 && context.sharedContext.phase.id===task.phase,task.id);
    assert.ok(context.validation.additionalScenarios.length>0 && context.stopConditions.length>0 && context.handoff.reportFormat.length>0,task.id);
    for (const source of context.sourceReferences) assert.ok(fs.existsSync(path.join(root,source.path)),task.id+' '+source.path);
    for (const step of context.subtasks) {
      assert.ok(step.action && step.logic && step.expected && step.test,step.id);
      assert.ok(plan.includes(step.id),step.id);
    }
    assert.deepEqual(context.inputs.map(input=>input.id),task.dependencies);
    for (const input of context.inputs) {
      const dependency=W.packageIndex.get(input.id).task;
      assert.equal(input.requiredOutput,dependency.deliverable);
      assert.equal(input.acceptance,dependency.acceptance);
      assert.ok(dependency.executionContext.handoff.downstream.some(item=>item.id===task.id));
    }
    for (const item of context.useCases) for (const endpoint of item.endpoints) {
      const source=require(path.join(root,endpoint.source));
      assert.ok(source.endpoints.some(value=>value.id===endpoint.id && value.method===endpoint.method && value.path===endpoint.path),task.id+' '+endpoint.path);
    }
  }
});

test('basic page work is limited to component routing and usable page integration', () => {
  const task=W.packageIndex.get('FE-01').task;
  assert.equal(task.subtasks.length,2);
  assert.match(task.subtasks[0].action,/组件|路由/);
  assert.equal(task.baselinePersonDays,3);
  assert.equal(task.personDays,1.5);
  assert.doesNotMatch(JSON.stringify(task.subtasks),/核对现有30任务页|核对键盘|窄屏|组件约定/);
  const html=read('交付成果/代理出口业务流程图.html');
  assert.equal([...html.matchAll(/data-work-phase="[123]"/g)].length,3);
  assert.match(html,/data-work-phase="1" aria-pressed="true"/);
  assert.doesNotMatch(html,/id="work-breakdown-phase"/);
});

test('generated plan and both manuals expose linked packages, accurate phase totals and manual boundaries', () => {
  const plan=read('doc/多期工作计划.html');
  for (const {task} of W.allTasks) {
    assert.ok(plan.includes('id="package-'+task.id+'"'),task.id);
    const start=plan.indexOf('id="package-'+task.id+'"');
    const end=plan.indexOf('</small></p></section>',start);
    const packageHtml=plan.slice(start,end);
    assert.ok(packageHtml.includes('<h3>'+task.title+'</h3>'),task.id);
    assert.doesNotMatch(packageHtml,/独立交付|主责与复核|估算依据|配置人力/);
    assert.ok(task.relatedUseCases.length>0,task.id);
    for (const item of task.relatedUseCases) {
      assert.ok(W.useCases.some(source=>source.id===item.id && source.name===item.name));
      assert.ok(packageHtml.includes('href="#case-'+item.id+'"'),task.id+' '+item.name);
    }
    assert.ok(task.usecases.every(id=>task.relatedUseCases.some(item=>item.id===id && item.relationship==='直接实现')));
  }
  for (const item of W.useCases) assert.ok(plan.includes('id="case-'+item.id+'"'),item.id);
  for (const phase of W.phases) {
    assert.ok(plan.includes(phase.personDays+'人日，共'+phase.packages+'个工作包'));
    assert.ok(plan.includes((phase.designRatio*100).toFixed(2)+'%'));
  }
  for (const name of ['对外产品需求与操作手册','对内运营产品需求与操作手册']) {
    const html=read('doc/'+name+'.html');
    assert.match(html,/分期建设与当前演示/);
    assert.match(html,/当前页面仍是离线演示，尚未连接银行和其他外部渠道/);
    assert.match(html,/第一期不建设关务信息查询，但仍保留本交易报关草稿/);
    assert.ok(html.includes('href="多期工作计划.html"'));
    for (const match of html.matchAll(/多期工作计划\.html#package-([^"]+)/g)) assert.ok(W.packageIndex.has(match[1]));
    assert.match(html,/平台自动签署在第二期接入/);
  }
});

test('all local document links and fragment targets resolve across the generated deliverables', () => {
  const files=['多期工作计划.html','对外产品需求与操作手册.html','对内运营产品需求与操作手册.html'].map(name=>path.join(root,'doc',name));
  const contents=new Map();
  for (const file of files) {
    const html=fs.readFileSync(file,'utf8');
    for (const [,raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      assert.ok(!/^(https?:)?\/\//.test(raw),'unexpected remote asset '+raw);
      const [resource,fragment] = raw.replaceAll('&amp;','&').split('#');
      const target=resource?path.resolve(path.dirname(file),decodeURIComponent(resource)):file;
      assert.ok(fs.existsSync(target),file+' => '+raw);
      if (fragment && target.endsWith('.html') && !fragment.includes('/')) {
        if (!contents.has(target)) contents.set(target,fs.readFileSync(target,'utf8'));
        const destination=contents.get(target);
        const id=decodeURIComponent(fragment);
        assert.ok(destination.includes('id="'+id+'"') ||
          (destination.includes('id="view-'+id+'"') && destination.includes('data-view="'+id+'"')),raw);
      }
    }
  }
});
