'use strict';
const fs = require('node:fs');
const path = require('node:path');
const W = require('../交付成果/assets/work-breakdown.js');
const P = require('../交付成果/assets/product-guide-model.js');
const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const names = value => esc(value).replace(/(?<!中国)供应商/g,'中国供应商').replace(/出口代理/g,'贸易代理商').replace(/(?<!出口)报关代理/g,'出口报关代理');
const list = items => '<ul>' + items.map(text => '<li>' + esc(text) + '</li>').join('') + '</ul>';
const total = W.phases.reduce((sum,item) => sum+item.personDays,0);
const sourceModules = ['system','step-two','step-three','step-four','step-five','step-six','step-seven','step-eight'];
const packageLink = id => '<a href="#package-' + id + '">' + esc(W.packageIndex.get(id).task.title) + '</a>';
function traceDetails(task,step) {
  const trace=task.traceability.find(item=>item.subtaskId===step.id);
  return '<details><summary>对应流程与系统用例</summary><p>'+trace.flowNodes.map(item=>'<a href="#flow-node-'+esc(item.id)+'">'+names(item.name)+' <small>'+esc(item.id)+'</small></a>').join('；')+'</p><ul>'+
    trace.useCases.map(item=>'<li><a href="#case-'+esc(item.id)+'">'+names(item.name)+'</a> <small>'+esc(item.relationship)+'</small></li>').join('')+'</ul></details>';
}
function integrationDetails(context) {
  return '<details><summary>联调场景与前置交付</summary>'+
    context.integrationScenarios.map(item=>'<section><h5>'+esc(item.name)+'</h5><p>'+esc(item.setup)+'</p><h5>操作</h5>'+list(item.steps)+'<h5>判定</h5>'+list(item.assertions)+'</section>').join('')+
    context.inputs.map(item=>'<section><h5>'+esc(item.title)+'</h5><p>'+esc(item.interfaceBoundary)+'</p><p>'+esc(item.contract)+'</p><p>'+esc(item.handoffTest)+'</p></section>').join('')+'</details>';
}
function executionDetails(task) {
  const C=task.executionContext;
  return '<h4>具体工作</h4><div class="package-subtasks">'+task.subtasks.map(step=>
    '<section class="package-subtask" data-subtask="'+esc(step.id)+'"><h5>'+esc(step.action)+'</h5><dl>'+
    '<dt>处理逻辑</dt><dd>'+esc(step.logic)+'</dd><dt>预期结果</dt><dd>'+esc(step.expected)+
    '</dd><dt>如何测试</dt><dd>'+esc(step.test)+'</dd></dl>'+traceDetails(task,step)+'</section>').join('')+'</div>'+
    (C.openQuestions.length?'<h4>待确认与开工限制</h4>'+C.openQuestions.map(item=>'<p>'+esc(item.question)+'</p><p>'+esc('确认岗位：'+item.owner+'。影响：'+item.impact)+'</p>').join(''):'')+
    integrationDetails(C)+
    '<h4>关联的系统用例</h4><p>直接实现为本包业务范围；共用支撑和设计覆盖表示提供基础能力或方案，不重复实现用例。</p><ul>'+
    task.relatedUseCases.map(item=>'<li><a href="#case-'+esc(item.id)+'">'+names(item.name)+'</a> <small>'+esc(item.relationship+' · '+item.code)+'</small></li>').join('')+'</ul>'+
    '<h4>开始前需要完成</h4><p>'+(task.dependencies.length?task.dependencies.map(packageLink).join('；'):'无前置工作包，先确认本期范围和授权。')+'</p>'+
    '<details><summary>来源与执行边界</summary><p>'+esc(C.ownershipBoundary)+'</p><ul>'+
    C.sourceReferences.map(ref=>'<li><a href="../'+esc(ref.path)+'">'+esc(ref.path)+(ref.lineStart?'，第'+ref.lineStart+'至'+ref.lineEnd+'行':'')+'</a>'+(ref.reason?'：'+esc(ref.reason):'')+'</li>').join('')+'</ul>'+
    '<h4>必须遵守的规则</h4>'+list(C.sharedContext.invariants)+'<h4>遇到这些情况先停止</h4>'+list(C.stopConditions)+
    '<h4>来源冲突与复核限制</h4>'+list(C.sharedContext.auditCaveats)+
    '<p>'+esc(C.validation.limitation)+'</p></details><p><small>引用编号 '+esc(task.id)+'</small></p>';
}
function packageSection(entry) {
  const {layer,capability,task} = entry;
  return '<section id="package-'+task.id+'" data-guide-section><h3>'+esc(task.title)+'</h3><p>'+esc(layer.title+' / '+capability.title)+'</p><p>'+esc(task.scope)+'</p>'+executionDetails(task)+'</section>';
}
const phases = W.phases.map(phase => {
  const entries = W.allTasks.filter(entry => entry.task.phase === phase.id);
  const layerRows = W.layers.map(layer => {
    const tasks=entries.filter(entry=>entry.layer.id===layer.id).map(entry=>entry.task);
    return '<tr><th scope="row">'+esc(layer.title)+'</th><td>'+tasks.length+'</td><td>'+tasks.reduce((sum,item)=>sum+item.personDays,0)+'</td></tr>';
  }).join('');
  const ordered = [], seen = new Set();
  function add(entry) {
    if (seen.has(entry.task.id)) return;
    seen.add(entry.task.id);
    entry.task.dependencies.filter(id=>W.packageIndex.get(id).task.phase===phase.id).forEach(id=>add(W.packageIndex.get(id)));
    ordered.push(entry);
  }
  entries.forEach(add);
  return '<section id="phase-'+phase.id+'"><h2>'+esc(phase.title)+'</h2><p>'+esc(phase.goal)+'</p><dl><dt>设计投入</dt><dd>'+phase.designDays+'人日，占本期总量'+(phase.designRatio*100).toFixed(2)+'%；工作包'+packageLink('DES-'+phase.id)+'。</dd><dt>建设与验证</dt><dd>'+phase.deliveryDays+'人日，含开发、测试、部署脚本、联调及交接。</dd><dt>本期总量</dt><dd>'+phase.personDays+'人日，共'+phase.packages+'个工作包；不能据此推定团队人数或工期。</dd><dt>本期不做</dt><dd>'+esc(phase.excluded)+'</dd><dt>开始条件</dt><dd>'+esc(phase.entry)+'</dd><dt>完成条件</dt><dd>'+esc(phase.exit)+'</dd></dl><h3>推进顺序与交付关口</h3><ol>'+phase.gates.map(text=>'<li>'+esc(text)+'</li>').join('')+'</ol><p>工作包按直接依赖排列。没有相互依赖的包可在人员允许时并行，同一人不能同时满额投入多个包。</p><div class="table-wrap"><table><thead><tr><th>分层</th><th>包数</th><th>预计人日</th></tr></thead><tbody>'+layerRows+'</tbody></table></div>'+
    '<details><summary>工作包投入汇总</summary><div class="table-wrap"><table><thead><tr><th>工作名称</th><th>系数前基线人日</th><th>折算人日</th></tr></thead><tbody>'+
    ordered.map(({task})=>'<tr><th scope="row">'+packageLink(task.id)+'</th><td>'+task.baselinePersonDays+'</td><td>'+task.personDays+'</td></tr>').join('')+
    '</tbody></table></div></details>'+ordered.map(packageSection).join('')+'</section>';
}).join('');
const coverage = W.useCases.map(item => {
  const entries=W.allTasks.filter(entry=>entry.task.relatedUseCases.some(related=>related.id===item.id));
  const prototype=P.tasks.find(task=>task.usecases.includes(item.id));
  return '<tr id="case-'+item.id+'"><th scope="row">'+names(item.name)+'</th><td>步骤'+item.step+' <small>'+esc(item.code)+'</small></td><td>'+entries.map(entry=>packageLink(entry.task.id)+' <small>'+esc(entry.task.relatedUseCases.find(related=>related.id===item.id).relationship)+'</small>').join('；')+'</td><td><a href="对内运营产品需求与操作手册.html#usecase-'+item.id+'">查看用例说明与操作规则</a>'+(prototype?'；<a href="../交付成果/代理出口业务流程图.html#product-workspace/'+prototype.owners[0]+'/'+prototype.id+'">对应离线原型</a>':'')+'</td></tr>';
}).join('');
const first=W.phases.find(phase=>phase.id===1);
const layerReasons = {
  frontend:'复用30任务页、字段及现成组件，只补生产接口和多商品行；不做美化。',
  business:'复用已确认用例、协议和公共材料审核恢复机制；设计只补生产差距，专项验收不重复单包测试。',
  domain:'复用47表设计DDL、码表及语义断言，补仓储、缺失的应用基础设施表和并发约束，不重做全套建模。',
  integration:'仅首家银行；协议、原始观察、执行和共同联调分开，不重复资金记账或密钥设施。',
  infrastructure:'复用本机脚本和中间件验证，补生产参数化、权限、发布和业务恢复；不包含采购及机房施工。',
  security:'采用成熟身份及扫描组件，计应用集成与控制落地；保留独立复测，不重做总体方案。',
  funds:'复用既定规则和领域引擎；分别计业务事务、独立对账及跨包故障，保留全部资金门禁。'
};
const reassessment='<section id="reassessment"><h2>一期人力重估与条件增量</h2><p>'+esc(W.estimateBasis.status)+'</p><p>资产复用重估将一期从'+first.previousPersonDays+'人日调整为系数前基线'+first.baselinePersonDays+'人日。全部工作再按2倍效率折算为'+first.personDays+'人日，其中设计'+first.designDays+'人日、建设与验证'+first.deliveryDays+'人日。工时只在工作包及汇总中保留，子任务不写时间预估。</p>'+
  '<div class="table-wrap"><table><thead><tr><th>分层</th><th>历史人日</th><th>系数前基线</th><th>AI折算人日</th><th>调整依据</th></tr></thead><tbody>'+
  W.layers.map(layer=>{
    const tasks=W.allTasks.filter(entry=>entry.layer.id===layer.id && entry.task.phase===1).map(entry=>entry.task);
    const previous=tasks.reduce((sum,task)=>sum+task.previousPersonDays,0),current=tasks.reduce((sum,task)=>sum+task.personDays,0);
    const baseline=tasks.reduce((sum,task)=>sum+task.baselinePersonDays,0);
    return '<tr><th scope="row">'+esc(layer.title)+'</th><td>'+previous+'</td><td>'+baseline+'</td><td>'+current+'</td><td>'+esc(layerReasons[layer.id])+'</td></tr>';
  }).join('')+'</tbody></table></div><h3>计数和复用边界</h3>'+list(Object.values(W.estimateBasis))+
  '<h3>待确认事项与触发条件</h3><p>下面是已识别条件的敏感性估算，不是已发生工时，也不是统计置信区间。当前基线未加入这些增量。银行协议与正式证据规则不确定时先停止相关工作并核实，不由执行人自行补造规则。</p><div class="table-wrap"><table><thead><tr><th>工作包</th><th>条件</th><th>暂估增量人日</th></tr></thead><tbody>'+
  W.allTasks.filter(entry=>entry.task.phase===1 && entry.task.estimate.risk).map(({task})=>'<tr><th scope="row">'+packageLink(task.id)+'</th><td>'+esc(task.estimate.risk.trigger)+'</td><td>'+task.estimate.risk.extraDays+'</td></tr>').join('')+
  '</tbody></table></div><p>若上述条件全部发生，示例增量合计'+first.riskDays+'人日，对应'+(first.personDays+first.riskDays)+'人日。此数不是报价上限；生产容量、可用性、证据规则、银行新增能力或迁移范围有实质变化须重新估算。没有真实存量迁移时，不计迁移条件增量。</p><h3>如何交给任务负责人或SubAgent</h3><p>在脑图点击末级工作包，可查看子任务并下载该包独立执行上下文。每份文件都带本期范围、业务不变量、来源路径、前置制品、人日、检查和交接要求，不依赖另一包的说明才能知道任务边界。</p><p><a href="工作包执行上下文.json">打开全部'+W.allTasks.length+'个工作包执行上下文（JavaScript对象表示法数据文件，可另存）</a>。包内负责人均为岗位占位，项目负责人须指派实名主责与独立复核人。取得说明不表示已有外部授权；生产代码目录、容量及验证命令未冻结前，相关实现保持阻断。</p></section>';
const aiEstimate='<section id="ai-estimate"><h2>AI工作效率系数</h2><p>'+esc(W.estimateBasis.ai)+'</p><div class="table-wrap"><table><thead><tr><th>期次</th><th>系数前基线人日</th><th>全部工作效率</th><th>折算后人日</th><th>节省人日</th></tr></thead><tbody>'+
  W.phases.map(p=>'<tr><th scope="row">'+esc(p.title)+'</th><td>'+p.baselinePersonDays+'</td><td>2倍</td><td>'+p.personDays+'</td><td>'+p.savedPersonDays+'</td></tr>').join('')+
  '</tbody></table></div><p>三期合计从'+W.phases.reduce((sum,p)=>sum+p.baselinePersonDays,0)+'人日折算为'+total+'人日。设计分别为'+W.phases.map(p=>p.designDays).join('、')+'人日。最小工时单位为0.5人日，取整以工作包为单位；不代表实测精度或日历工期承诺。</p></section>';
const audited=W.allTasks.filter(({task})=>task.audit);
const auditReview='<section id="leaf-audit"><h2>叶子工作审计与待确认项</h2><p>四个独立审计分组覆盖交互、应用与领域、渠道与资金、平台与授权。每项工作对照流程及系统用例，补清输入、版本、处理分支、可观察结果及联调判定。这里的审计针对实施说明，不表示生产业务已经实现或联调通过。</p>'+
  '<p>审计覆盖'+audited.length+'个工作包；当前'+W.allTasks.reduce((sum,{task})=>sum+task.subtasks.length,0)+'项子任务。原250项中25项独立测试说明并入对应实施步骤，保留原检查，逐包可查旧新引用。审计前总投入333.5人日，审计后'+total+'人日。纯说明细化不增加预算；实质变化在下表逐项说明。工作包人数不能相加作为团队总人数。</p>'+
  '<h3>交付前复核的来源变化</h3>'+list(W.allTasks[0].task.executionContext.sharedContext.auditCaveats)+
  '<div class="table-wrap"><table><thead><tr><th>工作包</th><th>审计结论与差异</th><th>审计前／后人日</th><th>前置变动</th></tr></thead><tbody>'+
  audited.map(({task})=>'<tr id="audit-'+esc(task.id)+'"><th scope="row">'+packageLink(task.id)+'</th><td>'+esc(task.audit.status+'：'+task.audit.summary)+(task.audit.estimateChange?'<p>'+esc(task.audit.estimateChange.reason)+'</p>':'')+'</td><td>'+task.audit.before.personDays+' / '+task.personDays+'</td><td>'+
    esc(['增加：'+(task.audit.dependencyChanges.add.map(id=>W.packageIndex.get(id).task.title).join('；') || '无'),'移除：'+(task.audit.dependencyChanges.remove.map(id=>W.packageIndex.get(id).task.title).join('；') || '无')].join('。'))+'</td></tr>').join('')+
  '</tbody></table></div><details><summary>子任务旧新引用对照</summary><div class="table-wrap"><table><thead><tr><th>工作包</th><th>原工作</th><th>现工作</th><th>处理</th></tr></thead><tbody>'+
  audited.filter(({task})=>task.audit.before.subtaskCount!==task.subtasks.length).flatMap(({task})=>task.audit.subtaskChanges.map(change=>
    '<tr><th scope="row">'+packageLink(task.id)+'</th><td>'+esc(change.previousAction)+' <small>'+esc(change.previousId)+'</small></td><td>'+
    esc(change.currentIds.map(id=>W.allTasks.flatMap(entry=>entry.task.subtasks).find(step=>step.id===id).action+'（'+W.packageIndex.get(id.split('-S')[0]).task.title+'）').join('；'))+'</td><td>'+esc(change.reason)+'</td></tr>')).join('')+
  '</tbody></table></div></details><h3>待确认与开工限制</h3><p>以下事项需要对应岗位作出决定。只阻断所列范围；不得用模拟成功或默认值补齐外部能力。</p>'+
  audited.flatMap(({task})=>task.executionContext.openQuestions.map(item=>'<section><h4>'+packageLink(task.id)+'</h4><p>'+esc(item.question)+'</p><p>'+esc('确认岗位：'+item.owner+'。影响：'+item.impact)+'</p></section>')).join('')+
  '<h3>总Agent抽查记录</h3><p>抽查按分层与期次取样，并覆盖四个审计分组。实质范围、估算、依赖改动和高风险业务规则另行逐项核对。</p><ul>'+
  audited.filter(({task})=>task.audit.review).map(({task})=>'<li>'+packageLink(task.id)+'：'+esc(task.audit.review)+'</li>').join('')+'</ul>'+
  '<h3>流程节点与工作交接</h3><p>节点名称沿用流程图，工作包按实际支撑范围关联；用例中的数字标识不等于流程节点编号。</p><div class="table-wrap"><table><thead><tr><th>流程节点</th><th>关联工作</th></tr></thead><tbody>'+
  W.flowNodes.map(node=>'<tr id="flow-node-'+esc(node.id)+'"><th scope="row">'+names(node.name)+' <small>'+esc(node.id)+'</small></th><td>'+
    audited.filter(({task})=>task.flowNodes.some(item=>item.id===node.id)).map(({task})=>packageLink(task.id)).join('；')+'</td></tr>').join('')+'</tbody></table></div></section>';
const html = '<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'self\' file:; script-src \'self\' file:; style-src \'self\' file:; connect-src \'none\'; object-src \'none\'; base-uri \'none\'"><title>代理出口系统多期工作计划</title><link rel="stylesheet" href="assets/product-manual.css"></head><body><a class="skip" href="#content">跳到正文</a><header class="page-header"><h1>代理出口系统多期工作计划</h1><p>按最新八阶段'+W.useCases.length+'个系统用例安排'+W.allTasks.length+'个独立工作包；七个分层，分三期交付。</p><nav aria-label="文档导航"><a href="../交付成果/代理出口业务流程图.html#work-breakdown">工作拆解脑图</a><a href="对外产品需求与操作手册.html">对外操作手册</a><a href="对内运营产品需求与操作手册.html">对内操作手册</a><button type="button" data-print>打印 / 保存便携式文档</button></nav></header>'+
  '<div class="document-layout"><aside><label for="guide-search">查找工作名称、子任务或系统用例</label><input id="guide-search" type="search"><p id="guide-search-status" role="status"></p><nav aria-label="章节目录"><a href="#baseline">范围与估算口径</a><a href="#leaf-audit">叶子审计与待确认项</a><a href="#ai-estimate">AI工作效率系数</a><a href="#reassessment">一期重估与任务交接</a>'+
  W.phases.map(phase=>'<a href="#phase-'+phase.id+'">'+esc(phase.title)+'</a>').join('')+
  '<a href="#manual-work">第一期人工办理边界</a><a href="#coverage">用例与工作包对照</a><a href="#change">本次拆解修订</a></nav></aside><main id="content"><section id="baseline"><h2>范围与估算口径</h2>'+
  '<p>第一期保留建档、协议、物流、报关、收款付款、证明、退税和异常结案。业务外联只接银行，其余由有权人员在系统外办理，再由独立人员核实原件、主体、版本和结果。基础前端只保证任务完成、字段校验、清楚反馈和键盘操作，不做视觉精修。</p>'+
  '<p>总估算'+total+'人日，包含每期方案设计。1人日为1人一个完整工作日的有效投入；两人承接一个8人日包时，合计投入8人日，不是每人8人日。人员可先后承担不同包，人日不能直接折算为日历天数。</p>'+
  '<p>按熟悉业务的高级工程师、成熟组件及单体架构计。复用现有设计、协议、DDL、原型及本机验证，只抵扣重复建设，不把这些资产当作生产业务后端。系数前当前基线为'+W.phases.map(p=>p.baselinePersonDays).join('、')+'人日；三期受影响工作包按审计发现的实际范围变化重估，全部工作统一按2倍效率折算。基础页面只组装现成组件、设置路由和连接登录及列表详情，不另计现有任务页核对和专项交互检查。</p>'+
  '<p>一期方案设计原基线32人日，折算为'+first.designDays+'人日，占本期'+(first.designRatio*100).toFixed(2)+'%。二、三期设计折算为'+W.phases[1].designDays+'和'+W.phases[2].designDays+'人日。设计、代码实现及专项验收分别计数，全部保留原验收要求。</p>'+
  '<div class="table-wrap"><table><thead><tr><th>期次</th><th>方案设计人日</th><th>建设与验证人日</th><th>合计人日</th><th>设计占比</th></tr></thead><tbody>'+
  W.phases.map(p=>'<tr><th scope="row"><a href="#phase-'+p.id+'">'+esc(p.title)+'</a></th><td>'+p.designDays+'</td><td>'+p.deliveryDays+'</td><td>'+p.personDays+'</td><td>'+(p.designRatio*100).toFixed(2)+'%</td></tr>').join('')+
  '</tbody></table></div><p>工作量含开发、对应测试、缺陷修复、部署配置和交接。银行等待、主管许可、采购、日常业务办理耗时及费用不在研发人日内。基线按首家银行、第二期首家签署及物流服务方、第三期首套主管渠道；新增渠道、实际生产容量或规则变化须另估。</p></section>'+
  auditReview+aiEstimate+reassessment+
  '<section id="manual-work"><h2>第一期人工办理边界</h2><div class="table-wrap"><table><thead><tr><th>事项</th><th>系统内</th><th>系统外及独立核实</th></tr></thead><tbody>'+
  [
    ['银行','只启用银行已开放并通过验收的实收、余额、贸易核验、付款、查单和对账能力。','未开放项由授权财务人员从网银或银行正式渠道办理，另一人核实原号、原件和实际结果；未知维持受限或锁额。'],
    ['合同及正式委托','起草、审核、版本、人工签署核实及生效条件。','线下或在独立外部工具签署，原件与授权由不同人员核实。一期不调用签署平台；原第三方实名签署用例的自动通道留到第二期。人工核实通道须在一期设计中正式补充协议和验收，不复用平台回调伪造签署事件。'],
    ['物流','批次、计划、备货、运输及异常材料和核实。','物流人员人工办理运输并提交来源；出境须已核实同批海关放行。'],
    ['报关','完整草稿、独审、供应商书面确认及原件分别交付。','有权报关人员在正式渠道办理；独立核实海关回执、更正撤回及正式报关单。第一期不做关务信息查询，但保留本交易已录入报关记录及历史查询。'],
    ['证明与退税','职责范围、材料版、内部审批、原办理号及补正交接。','有权人员从主管渠道办理；独立核实机关受理、证明和决定。退税实收另由有权银行证据核实；主管职责未确认时只准备。'],
    ['身份、文件与通知','自建账号及本地强认证，自部署存储与扫描、站内待办。','一期不引入外部身份、扫描、筛查、短信邮件服务。银行自带的渠道认证按银行规范办理。'],
    ['结案','逐项报告、实质差异处理、逐原因暂停解除和独立正常结案。','人工办理不降低证据标准；未核实、无权读取、范围不全或未决执行均阻断。']
  ].map(row=>'<tr>'+row.map(cell=>'<td>'+esc(cell)+'</td>').join('')+'</tr>').join('')+
  '</tbody></table></div><p>手工录入只能形成待核声明。正式事实须通过规定的独立核实及权威证据登记，不能凭勾选、备注或截图产生成功结果。后续接入自动渠道时沿用原业务号并防止人工与自动重复执行。</p></section>'+
  phases+'<section id="coverage"><h2>用例与工作包对照</h2><p>全部'+W.useCases.length+'个用例均有第一期基础建设或人工办理工作包；第二、三期在同一规则上增加渠道，不重复建设第一期主体功能。第三方实名签署的原自动用例在第二期接通，一期人工签署核实属于明确的新增设计边界。</p><div class="table-wrap"><table><thead><tr><th>系统用例全名</th><th>来源</th><th>工作包</th><th>操作与原型</th></tr></thead><tbody>'+coverage+'</tbody></table></div><h3>最新依据</h3>'+list(['八阶段系统用例是需求依据，当前统计为'+W.useCases.length+'个。工作包保留每个用例的稳定编号及全名。','原型仅展示交互和拒绝路径，不代表已经完成银行或主管系统联调。'])+'<ul>'+sourceModules.map((name,index)=>'<li><a href="../交付成果/assets/'+name+'-usecases-model.js">步骤'+(index+1)+'系统用例与规则原文</a></li>').join('')+'</ul></section>'+
  '<section id="change"><h2>本次拆解修订</h2>'+list([
    '保留七个分层和树状脑图，改以人日汇总投入；原“每包2人相加”的配置总人数不再用作消耗。',
    '取消运营邀请六方填报和终审后建单，改为中国供应商首次提交创建交易、付款方独立提交、各自修订原资料；签约依据审核在步骤二。',
    '明确独立的证明申请、交付及退税用例，补齐逐项报告、暂停传播、实质处置和正常结案，不再提供特殊结案。',
    '修正旧拆解中物流、关务模型及存储、通知前置编号错配；全部直接依赖已按现有工作包重建，禁止跨期倒挂和循环。',
    '一期删除界面美化和非银行外部接入；关务信息查询仅在第三期，正式草稿录入、确认和本交易历史查询仍保留。',
    '银行对接按实际开放清单核定；自部署基础设施和安全控制在一期完成，不以外部服务替代。',
    '删除基础页面包中的现有任务页核对和专项交互检查，对应扣减1个基线人日；全部工作按2倍效率折算，每包向上取整到0.5人日。',
    '所有叶子补齐实名认领要求、来源、前置制品、子任务、人日、边界、验证、阻断和交接；可从脑图下载单包执行上下文。'
  ])+'</section></main></div><script src="assets/product-manual.js"></script></body></html>\n';
const contexts=JSON.stringify({
  schemaVersion:3,unit:'人日',estimateBasis:W.estimateBasis,phases:W.phases,
  packages:W.allTasks.map(entry=>entry.task.executionContext)
},null,2)+'\n';
for (const [name,body] of [['多期工作计划.html',html],['工作包执行上下文.json',contexts]]) {
  const target=path.join(__dirname,name);
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(target) || fs.readFileSync(target,'utf8') !== body) {
      console.error('工作计划或执行上下文未同步：'+name);process.exitCode=1;
    }
  } else fs.writeFileSync(target,body);
}
if (!process.exitCode) console.log('工作计划及执行上下文'+(process.argv.includes('--check')?'一致':'已生成')+'：'+W.allTasks.length+'包，'+total+'人日。');
