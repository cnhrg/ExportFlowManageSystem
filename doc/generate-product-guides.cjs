'use strict';
const fs = require('node:fs');
const path = require('node:path');
const base = require('../交付成果/assets/product-guide-model.js');
const demo = require('../交付成果/assets/demo-model.js');
const M = {...base,tasks:demo.pages.map(page=>({...page,fields:page.fields.map(field=>({...field,example:demo.values(page)[field.key]}))}))};
const business = require('../交付成果/assets/business-data.js');
const work = require('../交付成果/assets/work-breakdown.js');
const modules = ['system','step-two','step-three','step-four','step-five','step-six','step-seven','step-eight'];
const sources = modules.map(name => require('../交付成果/assets/' + name + '-usecases-model.js'));
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const roleNames = {A:'中国供应商', B:'贸易代理商', C:'境外实际收货人', D:'付款方', E:'物流公司', F:'出口报关代理'};
const roleLabels = {
  'A · 供应商':'中国供应商',
  'D · 付款方':'付款方',
  'B · 运营经办':'贸易代理商运营经办人员',
  'E · 物流经办':'物流公司经办人员',
  'F · 关务经办':'出口报关代理经办人员',
  'B · 财务经办':'贸易代理商财务经办人员'
};
function fullNames(value) {
  let text = String(value);
  for (const [label,name] of Object.entries(roleLabels)) text = text.replaceAll(label,name);
  text = text.replace(/(?:出口报关代理|报关代理|供应商|付款方|出口代理)([ABDF])/g, (match,role) => roleNames[role]);
  text = text.replace(/A供应商|B出口代理|C实际收货人|D付款方|E物流公司|F报关代理/g, match => roleNames[match[0]]);
  text = text.replace(/([A-F])(?:[/／—–-]([A-F]))+/g, match => match.split(/[/／—–-]/).map(role => roleNames[role]).join('、'));
  text = text.replace(/(?<![A-Za-z0-9_-])[A-F](?![A-Za-z0-9_-])/g, role => roleNames[role]);
  const terms = [
    [/\bINVOICE\b/g,'国际付款发票'], [/\bCNY(?=\d|\b)/g,'人民币'], [/\bCNH\b/g,'离岸人民币'],
    [/\bCIPS\b/g,'人民币跨境支付系统'], [/\bOCR\b/g,'光学字符识别'],
    [/\bHS\b/g,'商品名称及编码协调制度'], [/\bURL\b/g,'统一资源定位符（网页地址）'],
    [/\bPDF\b/g,'便携式文档格式文件'], [/\bREST\/RPC\b/g,'表述性状态转移风格接口或远程过程调用接口'],
    [/\bJavaScript\b/g,'浏览器脚本'], [/\blocalStorage\b/g,'浏览器本地键值存储'],
    [/\bIndexedDB\b/g,'浏览器索引数据库'], [/\bETag\b/g,'实体标签（资源版本校验标识）'],
    [/\bVersionId\b/g,'文件版本标识'], [/\bSHA256\b/g,'安全散列算法256位摘要'],
    [/\bhash\b/g,'内容摘要'], [/\bkey\b/g,'唯一标识'], [/\bexact\b/g,'确切'],
    [/\bPUT\b/g,'完整替换请求'], [/\bPOST\b/g,'创建或提交请求'], [/\bGET\b/g,'读取请求'],
    [/\bContractSigned\b/g,'合同已签署事件'],
    [/\bREFUND_OBSERVATION_UNAVAILABLE\b/g,'退税到账权威观察不可用'],
    [/\bscope_reference\b/g,'适用范围依据引用'], [/\bprevious_revision\b/g,'上一修订版本'],
    [/\bcorrection_event\b/g,'正式补正事件'], [/\bholdReference\b/g,'暂停原因引用'],
    [/\bpass\/fail\/unknown\b/g,'通过、不通过、结果未知'], [/\bunknown\b/g,'结果未知'],
    [/\bON HOLD\b/g,'业务暂停'],
    [/出口代理(?!协议)/g,'贸易代理商'],
    [/(?<!中国)供应商/g,'中国供应商'], [/(?<!出口)报关代理/g,'出口报关代理'],
    [/三单/g,'销售合同或订单、商业发票及装箱单'],
    [/四流/g,'货物流、报关流、资金流及退税流'],
    [/独审/g,'独立审核'], [/箱单/g,'装箱单'], [/关案/g,'关闭案件'],
    [/预付(?!款)/g,'出口前预付款'], [/重审/g,'重新审核'],
    [/备料/g,'准备材料'], [/补件/g,'补充材料'], [/缺件/g,'缺少材料']
  ];
  for (const [pattern,replacement] of terms) text = text.replace(pattern,replacement);
  text = text.replace(/\bN\d{2}\b/g, id => {
    const node = business.nodes.find(node => node.id === id);
    if (!node) throw new Error('流程节点缺少全名：' + id);
    return fullNames(node.title) + '（流程节点编号' + id + '）';
  });
  return text.replace(/装装箱单/g,'装箱单')
    .replace(/附件2/g,'《出口货物报关单》（附件编号2）')
    .replace(/附件3/g,'《代理出口货物证明》（附件编号3）')
    .replace(/附件4/g,'《报关报检代理服务合同》（附件编号4）')
    .replace(/报关版本人确认/g,'报关版本由本人确认')
    .replace(/浏览器浏览器/g,'浏览器')
    .replace(/境外实际收货人实际收货资料/g,'境外实际收货人的主体及收货资料')
    .replace(/限状态1/g,'限计划中（状态代码1）')
    .replace(/取消仅1\/2/g,'取消仅限计划中或已订舱（状态代码1或2）')
    .replace(/仅8已批准交易/g,'仅已批准（状态代码8）的交易')
    .replace(/生命周期仍8/g,'生命周期仍为已批准（状态代码8）')
    .replace(/正式处理完成为8，拒绝10\/撤销11/g,'正式处理完成待核对为状态代码8，终局拒绝为状态代码10，已撤销为状态代码11')
    .replace(/[—–]/g,'至')
    .replace(/不增一个冗余批次状态/g,'不新增重复的批次状态');
}
function readableHtml(html) {
  let code = false;
  return html.split(/(<[^>]+>)/g).map(part => {
    if (part.startsWith('<')) {
      if (/^<code(?:\s|>)/.test(part)) code = true;
      if (/^<\/code>/.test(part)) code = false;
      return part;
    }
    return code ? part : fullNames(part);
  }).join('');
}
const nodeNames = ids => ids.join('；');
function fieldExample(field) {
  const labels = {unit:'件，原型输入代码：',currency:'人民币，原型输入代码：',payerCountry:'新加坡，原型输入代码：'};
  return (labels[field.key] || (field.key === 'goodsSpec' ? '合成型号及中国原产地代码：' : field.key === 'goods' ? '合成商品说明，件数单位代码为件：' : '')) +
    '<code>' + esc(field.example) + '</code>';
}
const list = items => '<ul>' + items.map(value => '<li>' + esc(value) + '</li>').join('') + '</ul>';
const sourceCases = sources.flatMap((model,index) => model.useCases.map(item => ({...item, step:index+1})));
const assigned = M.tasks.flatMap(task => task.usecases);
for (const item of sourceCases) if (!assigned.includes(item.id)) throw new Error('用例没有产品页面映射：' + item.id);
for (const id of assigned) if (!sourceCases.some(item => item.id === id)) throw new Error('产品页面引用未知用例：' + id);
const nodeIds = new Set(M.tasks.flatMap(task => task.nodes));
for (let n = 1; n <= 23; n++) if (!nodeIds.has('N' + String(n).padStart(2,'0'))) throw new Error('流程节点未覆盖：' + n);
function link(task, role) {
  return '../交付成果/代理出口业务流程图.html#demo/' + (['A','D'].includes(role)?'external':'internal') + '/' + role + '/' + task.group + '/' + task.id;
}
const troubleshooting = [
  ['必填项或金额格式错误','保留当前草稿，按字段下方规则修改。人民币最多两位小数，不允许负数、指数或隐式换汇。','不要填写假证明、默认资质或真实账号。'],
  ['提交响应丢失 / 结果未知','使用原提交人恢复原受理，核对原请求号和版本；本机模拟已保留首次结果。','不要另号重发、重新取交易号，或把超时当作已取消。'],
  ['另一页面修改 / 版本冲突','保留当前输入，重新读取最新版本，比较差异后重新保存与确认。','不能用旧页面覆盖新版本；本机存储不提供生产级并发事务。'],
  ['已提交后发现错误','普通待审申请由原提交人撤回，或等待退回；修改新版本后重送。A/D首次资料使用各自修改入口。','不能直接改已送审正文或删除首次提交创建的交易。'],
  ['上游变更或批准失效','处理最新源版本，重新送审。旧版历史保留，依赖任务不得继续批准。','不能把新草稿的状态当作旧批准的延续。'],
  ['无权查看或办理','检查当前角色、资料来源角色及受托交易；目录可见不授予数据或动作权限。','不能通过切换URL、交易号或他人文件引用获得真实授权。'],
  ['官方回执、签署或到账未核实','保留原办理号、来源、时间和确切文件版，交独立人员通过正式渠道核实。','不能把内部审核、前端跳回、D自报凭证或通知接收写成外部成功。'],
  ['本机保存失败或记录损坏','停止写入并保留原存档；处理浏览器存储限制或联系维护者后再读取。','页面不会静默清空、自动重置或假称已保存。']
];
const taskInstructions = {
  'supplier-submit':['中国供应商先预取演示交易号；预取只保留号码，首次提交成功才创建交易。','逐项核对商品、数量、人民币金额、单证和实际收货安排。付款方的私有声明由付款方另行提交。'],
  'payer-submit':['付款方先核实本人获授权的交易及收货关系，再填写本方主体和付款关系。','不同法定主体须提供关系证明及代付原因；同名、地址相同或供应商代述都不能替代声明。'],
  'supplier-edit':['先读取中国供应商原资料，核对预填值和已提交版本，再说明此次变化。','改动提交后保留旧版；受影响的批准须重新确认，不能另建一份首次资料。'],
  'payer-edit':['付款方从原付款资料进入修改，核对变化前后的主体、付款关系及证明版本。','付款关系变化可能影响签约和资金核实；保留历史，由相应岗位重新审核。'],
  'contract-basis':['贸易代理商汇总双方已提交资料，核实资质、报价、服务范围和收付路径。','确认缺项已补齐后送审；独立审核员核对相同版本，不能在步骤一提前批准建档。'],
  'contract-draft':['按代理出口、物流或报关用途分别选择合同，核对当事人、条款和材料版本。','改版列出差异并重新送审；新草稿不自动终止旧有效合同。'],
  'contract-sign':['先核对已审正文、签署主体和用章授权，再准备签署材料。','签署证据核实与合同生效条件分别检查。当前原型不能签署；一期拟在外部人工签署并独立核实，平台自动签署在第二期接入。'],
  'contract-authority':['公共协议须选择适用期间和明确签署版本；正式报关委托逐笔核实。','出口前付款的认可单独办理，不能由公共协议或普通合同审核自动推定。'],
  'shipment-plan':['选择同一批准版本的商品行，填写批次数量、金额及路线。','核对各批累计占量；已执行或执行未知的部分不能通过改计划释放。'],
  'goods-ready':['中国供应商逐项核对备货、销售合同或订单、商业发票和装箱单。','填写数量、包装、重量及文件确切版本；发现不符先补正，不把备货声明当作已运输。'],
  'booking-pickup':['物流公司按受托批次登记订舱、提货和计划来源。','计划与实际时间分开；只有实际证据才能支持对应运输事件。'],
  'transport-progress':['物流公司按事件分别登记运输、到达、签收及异常，写明真实发生时间和来源。','出境前核实同批正式放行；签收证据来自实际收货，多个异常分别处理。'],
  'customs-draft':['出口报关代理核对批准来源及完整草稿，由独立审核员核对同一版本。','任何字段变化都形成新版本并重新送审，不能沿用旧的书面确认。'],
  'customs-confirm':['中国供应商本人打开最终报关草稿，核对主体、商品、数量、金额和摘要。','确认后提交本人授权书面确认的确切版本；出口报关代理和内部人员不得代办。'],
  'customs-official':['有权人员在正式渠道办理，登记原办理号及海关原件；系统内先保存待核声明。','独立核实正式回执；更正或撤回须有正式依据，技术报错不能冒充海关退单。'],
  'customs-delivery':['出口报关代理分别向中国供应商和贸易代理商交付同一有效报关单版本。','两方分别核对并接收，发送成功不能自动登记双方已接收。'],
  'bank-allocation':['财务经办核对银行实收及来源流水，再按交易逐笔分配毛额。','独立复核总分守恒和未匹配差额；付款方截图不能作为银行实收，未匹配金额保持受限。'],
  'invoice-release':['先核对交易分配、合同和国际付款发票版本，再送独立审核及银行贸易核验。','只有真实银行实收和可用状态均满足才可释放货款。INVOICE申报、补件和改版不触发服务费；每笔固定人民币300元由D承担，仅在首次获批分账时从D已核验可用余额结算，须有D授权及收费依据且不减少A合同应付。'],
  'payment-request':['先确认出口前付款或出口后付款分支，再核对银行可用金额、结算单和核实收款账户。','经办、批准与执行分离；结果未知时按原号查单，不能再付或解锁。银行扣款后仍须核实中国供应商实际到账。'],
  'funds-reconcile':['核对银行、资金位置及账务记录，列出差额、原流水和责任人。','差异交独立人员复核，以权威结果关闭；外部到账说明和备注不能直接改变余额。'],
  'proof-prepare':['确认申请主体、主管渠道、职责和适用范围，再建立协作材料版本。','职责或依据未明确时只准备材料；报关代理协助不替代有权申请人。'],
  'proof-official':['有权人员在正式主管渠道办理，登记原办理号、通知和提交版本。','独立核实受理、补正、证明及更正撤销；内部批准不能当作主管机关已受理。'],
  'proof-delivery':['交付证明时核对正式版本、收件人和交付凭据。','中国供应商本人核对接收；异议单独登记，不因发送完成自动关闭。'],
  'tax-package':['中国供应商整理适用退税材料并明确确定版本，核对证明与报关单来源。','由不同人员审核当前版本；补充或修改材料后重新确认，不沿用旧批准。'],
  'tax-official':['有权人员在税务正式渠道提交，保留原办理号和本次材料版本。','逐份核对机关通知、期限、补正和终局结果；税务决定不等于银行实际到账。'],
  'tax-credit':['按授权查询中国供应商退税实收来源，核对主体、款项和原办理号。','无权观察或缺少证据时保留未核实，差异交资金岗位；恢复原受理时不得新建动作。'],
  'crossflow-report':['冻结本次完整对象及来源版本，逐项核对货物流、报关流、资金流和退税流。','分别保留通过、不通过和未知项并分派责任；新增对象或来源变更后重做报告。'],
  'case-remedy':['按案件登记实质处置与证据，需要更正时回到原业务节点。','解除每个暂停原因须独立复核及传播确认；关闭案件不会自动解除其他暂停。'],
  'closure':['申请前核对最新完整报告、实际到账、资金守恒、未决执行和所有暂停原因。','独立审核员在决定时再次核对来源；未知、差异或未解除暂停均禁止正常结案。'],
  'payer-invoice':['付款方只查看已审且仍有效的国际付款发票。','金额或版本不符时联系贸易代理商财务，不能据旧版或待审发票付款。']
};
for (const task of M.tasks) if (!taskInstructions[task.id]) throw new Error('任务缺少具体操作说明：'+task.id);
function walkthrough(task, audience) {
  if (audience === 'external' && task.viewers?.includes('D')) return '<ol><li>选择D身份，打开“付款发票”。</li><li>尚无已审有效发票时只显示待财务核对，不展示内部草稿。</li><li>发票可见后，核对金额、交易引用、确切版本及材料；D不能修改开票字段或查看内部审核意见。</li><li>不符时联系B财务，不依据旧版或待审发票付款。付款凭证另从本方说明任务提交。</li></ol>';
  const owners = task.owners.filter(role => audience === 'external' ? ['A','D'].includes(role) : !['A','D'].includes(role));
  const role = owners[0] || 'B';
  const actions = [
    '打开本任务原型，选择“' + M.roles[role][0] + '”及演示人员，核对当前交易。',
    ...taskInstructions[task.id],
    '所有页面已预填同一套合成示例，按字段规则核对和修改，不输入真实证件或账号。',
    '点击“保存草稿”或“保存新修订”。页面显示当前版本和保存结果；未保存输入不会自动提交。'
  ];
  if (owners.length || audience === 'external') {
    actions.push('勾选当前保存版本确认，再点击“'+(task.mode==='filing'?'确认提交本方资料':'提交待核资料')+'”。也可使用“演练原提交响应丢失”，此后只点“查询原受理”，不重复提交。');
  } else {
    actions.splice(3,2,'以内部只读身份核对已提交资料。实际填写和提交由中国供应商或付款方本人办理，内部不代写。');
  }
  if (task.mode === 'review') actions.push(audience === 'external' ?
    '提交后由独立审核员核对本次确切版本。当前用户只查看处理状态和本方补正要求，不切换内部身份代为批准；退回后修订本方资料并重新提交。' :
    '切换独立审核员及另一位演示人员，定位原资料来源角色；逐项核对当前版本及上游，填写意见后批准或退回。不得审核本人修改或提交的版本。');
  if (task.mode === 'external') actions.push('在对应业务动作下点击“核对办理条件”，查看缺少的正式条件。原型只保存待核资料，不会显示已付款、已放行、已签发或正常结案。');
  actions.push('查看本机版本与受理轨迹，核对后续责任人。切换任务或离开页面时，未保存修改会触发放弃确认。');
  return '<ol>' + actions.map(text => '<li>' + esc(text) + '</li>').join('') + '</ol>';
}
function caseDetails(task) {
  return task.usecases.map(id => {
    const item = sourceCases.find(value => value.id === id);
    const source = sources[item.step-1];
    const endpoints = (item.endpoints || []).map(value => {
      const endpoint=source.endpoints.find(endpoint=>endpoint.id===value)||sources.flatMap(model=>model.endpoints).find(endpoint=>endpoint.id===value);
      if(!endpoint)throw new Error('手册缺少用例接口：'+item.id+'/'+value);
      return endpoint;
    });
    return '<section class="usecase" id="usecase-' + item.id + '"><h4>' + esc(item.name) + '（系统用例编号<code>' + esc(item.code) + '</code>）</h4><p>责任参与者：' + esc(item.actor) + '</p><p>' + esc(item.description) + '</p>' +
      (item.intent ? '<p>操作意图：' + esc(item.intent) + '</p>' : '') +
      (item.transaction ? '<p>完整业务事务、版本保护及原受理恢复规则：<a href="../交付成果/assets/' + modules[item.step-1] + '-usecases-model.js">查看本步骤系统用例设计原文</a>，按本用例全名或编号查找。原文中的程序标识用于开发核对，不是操作按钮。</p>' : '') +
      (endpoints.length ? '<details><summary>关联接口资源（设计依据，未部署；请求地址保持原文）</summary><ul>' + endpoints.map(endpoint => '<li>' + ({GET:'读取资源',POST:'创建资源或提交业务动作',PUT:'完整替换原资源',DELETE:'删除资源',PATCH:'局部修改资源'}[endpoint.method] || '接口请求') + '：<code>' + esc(endpoint.method + ' ' + endpoint.path) + '</code></li>').join('') + '</ul></details>' : '') + '</section>';
  }).join('');
}
function taskSection(task, audience) {
  const role = audience === 'external' ? task.owners.find(role => ['A','D'].includes(role)) || task.viewers?.[0] : task.owners.find(role => !['A','D'].includes(role)) || 'B';
  const readOnly = audience === 'external' && task.viewers?.includes('D');
  const observeOnly = audience === 'internal' && task.owners.every(role => ['A','D'].includes(role));
  return '<section class="task" id="task-' + task.id + '" data-guide-section><header><p class="eyebrow">流程' + task.step + ' · ' + esc(M.steps[task.step-1]) + ' · ' + nodeNames(task.nodes) + '</p><h2>' + esc(task.title) + '</h2><p>' + esc(task.goal) + '</p><a class="prototype-link" href="' + link(task,role) + '">打开对应交互原型</a></header>' +
    '<dl><dt>责任角色</dt><dd>' + esc(task.owners.map(id => M.roles[id][0]).join('；')) + '</dd><dt>进入条件</dt><dd>' + esc(task.gate) + '</dd><dt>完成结果</dt><dd>' + esc(task.result) + '</dd><dt>失败恢复</dt><dd>' + esc(task.recovery) + '</dd></dl>' +
    '<p>建设与分包：' + work.allTasks.filter(entry => /^(BL|FIN)-/.test(entry.task.id) && entry.task.usecases.some(id=>task.usecases.includes(id))).map(entry=>'<a href="多期工作计划.html#package-'+entry.task.id+'">'+esc(entry.task.title)+'（第'+entry.task.phase+'期）</a>').join('；') + '。当前离线原型只演练资料及审核，正式外部结果仍须核实。</p>' +
    '<h3>页面与字段</h3><p>任务详情顶部展示交易号、当前版本、办理条件及前置任务。填写区、提交区、独立审核区与历史分别呈现；无数据权限时不输出字段值。</p>' +
    '<div class="table-wrap"><table><thead><tr><th>字段</th><th>填写示例（合成）</th><th>校验与处理</th></tr></thead><tbody>' +
    task.fields.map(field => '<tr><th scope="row">' + esc(field.label) + '</th><td>' + fieldExample(field) + '</td><td>' + (readOnly ? '只读；' : observeOnly ? '内部只读，由外部责任方填写；' : field.key === 'relationshipEvidence' ? '不同法定主体时必填；' : '必填；') + esc(field.rule) + '。本机每项最多1200字。</td></tr>').join('') + '</tbody></table></div>' +
    '<h3>操作步骤</h3>' + walkthrough(task,audience) +
    '<h3>按钮、状态与验收</h3>' + list(readOnly ? [
      'D只读已审且仍有效的发票，页面没有保存、提交或批准按钮。',
      '财务新建、送审或改版时，D看不到待审正文；旧批准失效后不继续展示旧版。',
      'D不显示内部审核意见及受理轨迹，差异交B财务核对。'
    ] : [
      '草稿保存后才能提交；未保存修改必须先保存。重复提交当前已提交版本应明确拒绝，不新增第二份。',
      task.mode === 'filing' ? '资料提交仅表示本方资源已受理，不进入整单批准；修改通过原资源生成新修订。' : task.mode === 'review' ? '待独立审核时不得直接修改；原提交人可撤回。退回必须给出原因，补正另版后重新确认。' : '提交只形成待核声明。此页不将待核文件直接转成官方成功或资金事实。',
      '切换未授权角色应无法读取或编辑资料；B/E/F目录相同不改变责任权限。',
      '原受理恢复必须保持原请求号和提交版本，不能创建新动作；刷新后能读到已保存记录。',
      task.mode === 'review' ? '审核人与经办人相同应拒绝；上游版变更应拒绝旧版批准。' : '未接正式渠道时不得产生已核实外部结果，失败必须说明原因。'
    ]) + '<h3>详细系统用例对应</h3>' + caseDetails(task) + '</section>';
}
function document(audience) {
  const external = audience === 'external';
  const title = external ? '对外产品需求与操作手册' : '对内运营产品需求与操作手册';
  const opposite = external ? '对内运营产品需求与操作手册' : '对外产品需求与操作手册';
  const tasks = (external ? M.tasks.filter(task => task.owners.some(role => ['A','D'].includes(role)) || task.viewers?.includes('D')) : [...M.tasks]).sort((a,b) => a.step - b.step);
  const roles = external ? ['A','D'] : ['B','E','F','finance','reviewer'];
  const covered = new Set(tasks.flatMap(task => task.usecases));
  return readableHtml('<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'self\' file:; script-src \'self\' file:; style-src \'self\' file:; img-src \'self\' data: file:; connect-src \'none\'; object-src \'none\'; base-uri \'none\'"><title>' + title + '</title><link rel="stylesheet" href="assets/product-manual.css"></head><body><a class="skip" href="#content">跳到正文</a><header class="page-header"><p>代理出口业务协同平台</p><h1>' + title + '</h1><p>' + (external ? '适用：中国供应商、付款方。境外实际收货人不设独立入口。' : '适用：贸易代理商、物流公司、出口报关代理及独立审核岗位。共用目录，按责任办理。') + '</p><nav aria-label="文档导航"><a href="../交付成果/代理出口业务流程图.html#product-workspace/' + roles[0] + '/' + (external ? 'supplier-submit' : 'contract-basis') + '">打开协同原型</a><a href="' + opposite + '.html">切换另一份产品文档</a><button type="button" data-print>打印 / 保存PDF</button></nav></header><div class="document-layout"><aside><label for="guide-search">查找页面、字段或规则</label><input id="guide-search" type="search" placeholder="输入关键词"><p id="guide-search-status" role="status"></p><nav aria-label="章节目录"><a href="#quick-start">开始使用</a><a href="#terminology">角色全名与术语速查</a><a href="#responsibility">角色与交接</a><a href="#interaction">共用交互规则</a>' +
    tasks.map(task => '<a href="#task-' + task.id + '">' + task.step + '. ' + esc(task.title) + '</a>').join('') +
    '<a href="#troubleshooting">异常与恢复</a><a href="#coverage">用例及节点索引</a><a href="#limits">边界与待确认项</a></nav></aside><main id="content"><section id="quick-start"><h2>开始使用</h2><p>主页面按“对外门户”和“对内工作台”分入口。对外选择供应商或付款方，对内选择运营、物流、报关、财务或独立审核岗位；从功能菜单的业务列表进入详情，不必逐个穿过八步骤。<code>DEMO-GUIDE-001</code>为固定合成交易。所有页面默认填好同一套正常示例，先核对，再保存和提交。付款方只能看到已审有效付款发票，未审时显示等待提示。</p><p>本手册对应融合后的两个业务入口。PC使用功能侧栏、列表与详情，手机使用“功能菜单”、卡片与分区表单；两端共用状态。原流程图、电子合同和管理页面仍可作专题参考，旧业务工作台存档保留但不自动迁移。所有银行、签署、申报、证明、退税及结案结果都需要真实渠道，原型不会制造成功。</p><ol><li>A预取号、保存并首次提交，创建演示交易。</li><li>D在已核实关系下独立提交本方资料。</li><li>B汇总签约依据并保存最新修订，再送审，由另一位演示人员以独立审核岗位核对；外部用户不能代为审核。</li><li>上游资料变化会使预填下游稿标为待重新核对。经办人核对并保存新修订后再提交，不沿用旧批准。</li><li>合同、批次及后续任务按具体条件逐项办理；未接官方渠道的步骤停留待核，点击办理条件会说明缺项，不制造正式成功。</li></ol><p>详情内含业务办理、材料与预览、版本与记录、用例与协议。材料预览为原创合成准备稿；模拟上传只保存文件名、大小及材料版本，不读取字节、不上传、不扫描。报告生成后保留当前源版本及四项待核结果；差异申请由不同人员复核，源版本变化时须重新申请，不直接解冻或改余额。</p></section>' +
    '<section id="construction"><h2>分期建设与当前演示</h2><p>第一期目标是完成八阶段基础协同，业务外联仅接银行，按银行实际开放能力启用。合同签署、运输、报关、证明和退税由有权人员在外部人工办理，系统登记原件并由不同人员独立核实。人工录入仅表示待核声明，不能直接产生正式受理、放行、签署或到账。</p><p>第一期不建设关务信息查询，但仍保留本交易报关草稿、正式证据及已录入历史的查看。前端只保证基础任务完成、明确校验和错误恢复，不做界面美化。第二期接入签署、物流和通知；第三期在取得正式授权后接入海关、税务及关务信息查询。</p><p>当前页面仍是离线演示，尚未连接银行和其他外部渠道。以下正式业务步骤说明建设后的操作要求，不能据演示状态办理真实业务。原第三方实名签署用例的自动通道在第二期接通；一期人工签署核实通道须先完成设计评审，不可伪造平台签署回调。</p><p><a href="多期工作计划.html#ai-estimate">查看AI工作效率系数、各期人日和工作包</a>。一期基线'+work.phases[0].baselinePersonDays+'人日，全部工作按2倍效率折算后为'+work.phases[0].personDays+'人日，其中设计'+work.phases[0].designDays+'人日，占'+(work.phases[0].designRatio*100).toFixed(2)+'%。每包向上取整到0.5人日，设计、测试、复核、联调、部署和交接都参与折算，验收要求不变。人日不代表日历工期，也不是实际已耗工时。</p><p><a href="多期工作计划.html">查看完整多期计划</a>；工作包按名称关联系统用例，子任务说明要做什么、处理逻辑、预期结果和测试方法，不显示工时。脑图支持完整执行说明下载。</p></section>' +
    '<section id="terminology"><h2>角色全名与术语速查</h2><p>下表代号用于对照原型身份选项和设计来源；办理时须核实交易内的实际法定主体。</p><div class="table-wrap"><table><thead><tr><th>角色全名</th><th>原型代号</th><th>查阅说明</th></tr></thead><tbody>' +
    Object.entries(roleNames).map(([id,name]) => '<tr><th scope="row">' + name + '</th><td><code>' + id + '</code></td><td>' + (id === 'C' ? '无独立账户；资料由中国供应商收集，签收证据由物流公司取得。' : id === 'B' ? '原型分运营经办和财务经办，实际岗位仍须分别授权。' : '办理本方或受托范围内的任务，不因目录可见获得其他主体权限。') + '</td></tr>').join('') +
    '</tbody></table></div><p>销售合同或订单、商业发票及装箱单分别核对，不能用其中一份代替其他单证。货物流、报关流、资金流及退税流分别保留来源事实。国际付款发票用于本交易货款核对；服务费由D承担并在首次获批分账时从已核验可用余额结算，服务费票据按正式合同及财税规则处理。</p><p>为与原型准确对照，合成交易号、文件引用、币种或国家代码、系统用例编号、流程节点编号和接口地址保留原值。代码样例不是业务简称；代码旁标明业务含义。接口地址仅供开发查阅，不要求操作人员手工发送请求。技术事务原文通过各用例的设计来源链接查阅。</p></section>' +
    '<section id="responsibility"><h2>角色与交接</h2><div class="table-wrap"><table><thead><tr><th>身份</th><th>任务范围</th><th>交接要求</th></tr></thead><tbody>' + roles.map(role => '<tr><th scope="row">' + M.roles[role][0] + '</th><td>' + M.roles[role][1] + '</td><td>' + esc(role === 'A' ? '收集C资料；对最终报关版本人确认；接收证明与核对到账。' : role === 'D' ? '独立声明付款关系；自报凭证交B核实，不能改变银行实收。' : role === 'E' ? '取得C签收与异常证据；不代F报关或A确认。' : role === 'F' ? '提交草稿给独审及A确认；附件2分别交A/B接收。' : role === 'reviewer' ? '逐版独审；不能审核本人提交，也不能代官方签发。' : '按岗位核对；财务审批、经办和执行分别授权，不代A确认。') + '</td></tr>').join('') +
    '</tbody></table></div><p>八组流程依次为：' + esc(M.steps.map((name,index) => (index+1) + '. ' + name).join('；')) + '。结案不能绕过任何未核实来源。</p><p>C实际收货资料由A收集，付款关系由D声明，运输签收由E取得；不要求C注册账号。B/E/F工作台目录一致，E/F只操作受托对象。生产身份、租户和委托校验必须在服务端执行，离线角色预览不具备这些能力。</p></section>' +
    '<section id="interaction"><h2>共用交互规则</h2><h3>保存、版本与资料责任</h3><p>所有字段都有标签、必填提示和规则。填写或样例带入后先保存，保存成功才显示新版本。提交前须确认当前保存版本；表单改动未保存时拒绝提交。首次A/D分别一份，后续从各自修改入口修订原资料。文件引用包含确切版本，本机不读取或存储真实单证字节，不进行OCR。</p><h3>独审与来源事实</h3><p>待审版本只能由原提交人撤回或被独立退回。批准需要不同经办人、审核意见、逐项确认及未变化的上游版本。资料改版使依赖结论失效，旧历史保留。签署回调、正式受理、放行和到账必须核实来源，不能用“资料审核通过”替代。</p><h3>状态与处理中</h3>' + list(Object.values(M.states)) +
    '<p>这些是本机资料状态，不是交易、合同、物流或资金的第二套业务状态。正式流程状态以系统用例和领域模型为准。“演练原提交响应丢失”表示本机已保存原受理，需先恢复，不能换号再提交。</p><h3>本机存储与离开页面</h3><p>草稿、版本快照、材料元数据和操作轨迹保存在当前浏览器localStorage，存档键为<code>export-entrance-demo/v1</code>，刷新保留，不能跨设备共享。未保存修改在角色切换、任务切换或离开时提示确认；存储失败明确报错。多页写入会检查已读存档是否变化，冲突后停止覆盖并要求重读；这不能替代生产事务和强版本保护。“恢复示例”需确认，只重置本Demo；损坏存档停止写入，不自动清空。既有运营IndexedDB、旧工作台<code>export-product-workspace/v1</code>和电子合同localStorage独立保留，不清空。</p><h3>移动端与辅助访问</h3><p>窄屏用“功能菜单”切换本岗位业务，列表进入详情后可返回；长表局部滚动。标签、错误和状态均有文字，键盘可操作按钮和表单。打印本文时隐藏目录、筛选和按钮，保留完整正文与字段表。无JavaScript时本文仍可阅读。</p></section>' +
    tasks.map(task => taskSection(task,audience)).join('') +
    '<section id="troubleshooting"><h2>异常与恢复</h2><div class="table-wrap"><table><thead><tr><th>现象</th><th>处理</th><th>禁止动作</th></tr></thead><tbody>' + troubleshooting.map(row => '<tr>' + row.map(cell => '<td>' + esc(cell) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div></section>' +
    '<section id="coverage"><h2>用例及节点索引</h2><p>本册对应' + tasks.length + '个任务页面、' + covered.size + '个系统用例。对内册保留全流程映射，其中A/D步骤明确为观察和交接，不赋予内部代办权限。</p><div class="table-wrap"><table><thead><tr><th>步骤与用例</th><th>产品页面</th><th>节点</th></tr></thead><tbody>' +
    sourceCases.filter(item => covered.has(item.id)).map(item => {const task = tasks.find(task => task.usecases.includes(item.id)); return '<tr><td>' + esc(item.name) + '（系统用例编号<code>' + esc(item.code) + '</code>）</td><td><a href="#task-' + task.id + '">' + esc(task.title) + '</a></td><td>' + nodeNames(task.nodes) + '</td></tr>';}).join('') +
    '</tbody></table></div><h3>规则来源</h3><ul>' + modules.map((name,index) => '<li>步骤' + (index+1) + '：<a href="../交付成果/assets/' + name + '-usecases-model.js">系统用例及详细规则模型</a>，与原型“系统用例”专题对照。</li>').join('') + '<li><a href="../交付成果/代理出口业务流程图.html">N01至N23业务流程、领域状态与材料依据</a></li></ul></section>' +
    '<section id="limits"><h2>边界与待确认项</h2><p>本文说明产品目标及离线交互，并未部署REST/RPC、认证、服务端上传、银行、海关、签约或税务接口。原型演练只说明交互与拒绝路径，不证明真实业务执行成功。</p>' +
    list(['A建档表演练单商品行：数量最多六位小数、人民币金额最多两位，数量乘单价须等于金额，不自动舍入。毛重不得小于净重；多商品行编辑未实现。D为同一法定主体时关系证明可不填，不同主体须补材料。','正式主管渠道、证明申请主责、适用范围及期限需按有效依据确认，未确认时只备料。','电子签平台、身份及用章授权、签署证据格式和正式归档方案须选型联调；本机盖章准备不具备真实签名效力。','报关主体、规则、HS、口岸及双抬头适用性须正式核实；无依据禁止正式办理。','跨批准版本商品迁移、拆报及合并申报需明确规则；不能通过新版本重置可发货数量。','本轮无垫资、授信、透支或换汇；历史专题中的候选展示不得作为可执行业务功能。','货款只按受限、可用、付款锁额口径核对；银行实际费用据实列示。每笔固定人民币300元服务费由D承担，仅在首次获批分账时从D已核验可用余额结算；须有D授权和收费依据，INVOICE申报不触发收费且不减少A合同应付。','正常结案须全部权威来源和完整对象集合可核实；unknown阻断，不提供特殊结案绕过。']) +
    '</section></main></div><script src="assets/product-manual.js"></script></body></html>\n');
}
const outputs = [
  ['对外产品需求与操作手册.html',document('external')],
  ['对内运营产品需求与操作手册.html',document('internal')]
];
let drift = false;
for (const [name, body] of outputs) {
  const target = path.join(__dirname,name);
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(target) || fs.readFileSync(target,'utf8') !== body) {console.error('产品文档未同步：' + name); drift = true;}
  } else fs.writeFileSync(target,body);
}
if (drift) process.exitCode = 1;
else console.log('产品文档' + (process.argv.includes('--check') ? '一致' : '已生成') + '：' + sourceCases.length + '用例，23节点，' + M.tasks.length + '任务页。');
