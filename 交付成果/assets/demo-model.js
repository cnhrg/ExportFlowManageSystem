'use strict';
(function (root) {
  const M = root.EXPORT_PRODUCT_GUIDE || require('./product-guide-model.js');
  const modules = ['system','step-two','step-three','step-four','step-five','step-six','step-seven','step-eight'];
  const globals = ['SYSTEM','STEP_TWO','STEP_THREE','STEP_FOUR','STEP_FIVE','STEP_SIX','STEP_SEVEN','STEP_EIGHT'];
  const sources = globals.map((name, index) => root['EXPORT_' + name + '_USECASES_MODEL'] ||
    require('./' + modules[index] + '-usecases-model.js'));
  const roles = {
    A: '供应商', D: '付款方', B: '出口代理运营', E: '物流公司经办',
    F: '出口报关代理经办', finance: '财务经办', reviewer: '独立审核员'
  };
  const groups = {
    trade: '交易与资料', contracts: '合同与委托', shipment: '出运与物流',
    customs: '报关与交接', funds: '收款与结算', tax: '证明与退税', cases: '核对与异常'
  };
  const pageGroups = {
    trade: ['supplier-submit','payer-submit','supplier-edit','payer-edit','contract-basis'],
    contracts: ['contract-draft','contract-sign','contract-authority'],
    shipment: ['shipment-plan','goods-ready','booking-pickup','transport-progress'],
    customs: ['customs-draft','customs-confirm','customs-official','customs-delivery'],
    funds: ['bank-allocation','invoice-release','payment-request','funds-reconcile','payer-invoice'],
    tax: ['proof-prepare','proof-official','proof-delivery','tax-package','tax-official','tax-credit'],
    cases: ['crossflow-report','case-remedy','closure']
  };
  // Explicit roles describe the action, not merely visibility of its parent page.
  const actionRules = {
    'supplier-submit': ['A','submit'], 'payer-submit': ['D','submit'],
    'supplier-edit': ['A','submit'], 'payer-edit': ['D','submit'],
    'basis-submit': ['B','submit'], 'basis-review': ['reviewer','review'],
    'contract-draft': ['A','save'], 'contract-review': ['reviewer','review'],
    'contract-revise': ['A','revise'], 'contract-sign': ['A B E F','official'],
    'contract-activate': ['reviewer','official'], 'framework-use': ['A B','statement'],
    'customs-authority': ['A B','statement'], 'shipment-plan': ['A','save'],
    'shipment-amend': ['A B','revise'], 'goods-ready': ['A reviewer','submit-review'],
    'booking-pickup': ['E reviewer','submit-review'], 'transport-progress': ['E reviewer','submit-review'],
    'logistics-exception': ['E B reviewer','case'], 'logistics-query': ['A E B reviewer','query'],
    's4-basis': ['F','query'], 's4-draft': ['F','save'], 's4-revision': ['F','revise'],
    's4-review': ['F reviewer','submit-review'], 's4-confirm': ['A','confirm'],
    's4-filing': ['F','official'], 's4-official': ['F reviewer','official'],
    's4-correction': ['F A reviewer','official'], 's4-attachment': ['F A B','handoff'],
    's4-query': ['F A B reviewer','query'], 's5-n11-receipt': ['finance reviewer','official'],
    's5-n12-allocation': ['finance reviewer','official'], 's5-n13-invoice-fee': ['finance A reviewer','statement'],
    's5-n14-verification-release': ['finance reviewer','official'],
    's5-n15-settlement': ['finance A reviewer','statement'],
    's5-n16-payment': ['finance A reviewer','official'],
    's5-n17-reconciliation': ['finance reviewer','case'],
    's6-preparation': ['B F','query'], 's6-cooperation': ['B','save'],
    's6-materials': ['B F','submit'], 's6-review': ['reviewer','review'],
    's6-dispatch': ['B','official'], 's6-official-receipt': ['B reviewer','official'],
    's6-correction': ['B F reviewer','submit-review'], 's6-certificate': ['reviewer','official'],
    's6-delivery': ['B','handoff'], 's6-receipt': ['A','handoff'],
    's6-objection': ['A B reviewer','case'], 's6-query': ['A B F reviewer','query'],
    's7-prepare': ['A','save'], 's7-package': ['A','submit'],
    's7-review': ['reviewer','review'], 's7-dispatch': ['A','official'],
    's7-notice': ['A B reviewer','official'], 's7-correction': ['A reviewer','submit-review'],
    's7-decision': ['A B reviewer','official'], 's7-credit': ['A finance reviewer','official'],
    's7-recovery': ['A reviewer','query'], 's8-context': ['B','query'],
    's8-report': ['B','report'], 's8-assignment': ['B','case'],
    's8-hold': ['B E F reviewer','case'], 's8-remedy': ['B E F reviewer','case'],
    's8-correction': ['B E F reviewer','case'], 's8-release': ['B E F reviewer','official'],
    's8-case-close': ['B E F reviewer','official'], 's8-closure-apply': ['B','official'],
    's8-closure-review': ['reviewer','official'], 's8-query': ['B E F reviewer','query']
  };
  const titles = {
    'supplier-submit':'交易资料', 'payer-submit':'付款资料', 'supplier-edit':'修改交易资料', 'payer-edit':'修改付款资料',
    'contract-basis':'签约依据', 'contract-draft':'合同正文与版本', 'contract-sign':'签署进度',
    'contract-authority':'公共协议与正式委托', 'shipment-plan':'出运计划', 'goods-ready':'备货与单证',
    'booking-pickup':'订舱与提货', 'transport-progress':'运输与签收', 'customs-draft':'报关草稿',
    'customs-confirm':'最终报关稿确认', 'customs-official':'报关办理与回执', 'customs-delivery':'报关单交接',
    'bank-allocation':'来款与分配', 'invoice-release':'发票、服务费与核验',
    'payment-request':'结算与付款申请', 'funds-reconcile':'本方资金说明与差异',
    'proof-prepare':'证明协作档案', 'proof-official':'证明办理与补正', 'proof-delivery':'证明交接与异议',
    'tax-package':'退税材料', 'tax-official':'退税通知与办理', 'tax-credit':'退税到账核对',
    'crossflow-report':'四流核对报告', 'case-remedy':'异常处置与暂停', closure:'正常结案', 'payer-invoice':'付款发票'
  };
  const actions = sources.flatMap((source, index) => source.useCases.map(usecase => {
    const rule = actionRules[usecase.id];
    if (!rule) throw new Error('原型未定义具体动作：' + usecase.id);
    return {id:usecase.id, title:fullNames(usecase.name), code:usecase.code, step:index + 1,
      description:fullNames(usecase.description), roles:rule[0].split(' '), kind:rule[1],
      protocols:usecase.endpoints.map(id => {
        const endpoint = source.endpoints.find(item => item.id === id) || sources.flatMap(item=>item.endpoints).find(item=>item.id===id);
        if (!endpoint) throw new Error('动作接口引用缺失：' + id);
        return {method:endpoint.method,path:endpoint.path,rpc:endpoint.rpc,audience:endpoint.audience};
      })};
  }));
  const pages = M.tasks.map(task => ({
    ...task, title:titles[task.id], group:Object.keys(pageGroups).find(group=>pageGroups[group].includes(task.id)),
    actions:actions.filter(action=>task.usecases.includes(action.id))
  }));
  // Additional participants read only the business object needed by their mapped action.
  const privatePages = new Set(['payer-submit','payer-edit','funds-reconcile','tax-credit','payer-invoice']);
  function fullNames(value) {
    const names={A:'供应商',B:'出口代理',C:'实际收货人',D:'付款方',E:'物流公司',F:'出口报关代理'};
    return String(value).replace(/(?<![A-Za-z0-9_-])[A-F](?![A-Za-z0-9_-])/g,id=>names[id])
      .replace(/\bINVOICE\b/g,'付款发票').replace(/三单/g,'销售合同、商业发票及装箱单').replace(/独审/g,'独立审核')
      .replace(/\bpass\/fail\/unknown\b/g,'通过、不通过或待核').replace(/\bunknown\b/g,'待核');
  }
  function kindFor(action,role) {
    if(action.id==='shipment-amend'&&role==='B')return 'official';
    if(['s5-n13-invoice-fee','s5-n15-settlement'].includes(action.id)&&role==='A')return 'query';
    if(role==='reviewer'&&(action.kind==='statement'||action.kind==='submit-review'&&action.step>=6))return 'official';
    return action.kind;
  }
  function canRead(page, role) {
    if (privatePages.has(page.id)) return page.owners.includes(role) || page.id === 'payer-invoice' && ['D','reviewer'].includes(role) ||
      role==='reviewer' && page.actions.some(action=>action.roles.includes(role)) ||
      ['payer-submit','payer-edit'].includes(page.id) && ['B','reviewer'].includes(role);
    return page.owners.includes(role) || page.actions.some(action=>action.roles.includes(role)) ||
      role === 'reviewer' && page.mode === 'review' || role === 'B';
  }
  const example = {
    trade:'DEMO-GUIDE-001', supplier:'示例华澄五金有限公司', payer:'示例海桥采购公司',
    consignee:'示例海桥收货仓', agent:'示例远航出口代理', logistics:'示例联程物流', customs:'示例通达报关',
    goods:[{line:'1',name:'铝合金安装支架',spec:'HC-M1 / 中国',quantity:'100',unit:'PCS',price:'125.00',amount:'12500.00',cartons:'10',net:'100.000',gross:'120.000'}],
    values:{
      supplier:'示例华澄五金有限公司 / SYN-A-001', payer:'示例海桥采购公司 / SYN-D-001',
      consignee:'示例海桥收货仓 / SYN-C-001', supplierAddress:'示例产业园1号（虚构）',
      supplierContact:'供应商演示经办 / SYN-A-CONTACT', goods:'铝合金安装支架 / 商品行1 / 100 PCS',
      goodsSpec:'HC-M1 / 中国', deliveryAddress:'示例海桥仓库2号 / SYN-C-CONTACT（虚构）',
      agent:'示例远航出口代理 / SYN-B-001', logisticsProvider:'示例联程物流 / SYN-E-001',
      customsProvider:'示例通达报关 / SYN-F-001', payerContact:'付款方演示经办 / SYN-D-CONTACT',
      relation:'不同法定主体；示例海桥采购公司为示例海桥收货仓代付本交易货款',
      materials:'SYN-FILE-001@1 / 销售合同、商业发票及装箱单（原创合成）',
      scope:'本笔代理出口；付款方承担固定人民币300元服务费，首次获批分账时从已核验可用余额结算，不减少供应商合同应付',
      paths:'付款方→出口代理→供应商 / 出口后付款，无垫资', contract:'用途10代理合同 / 供应商与出口代理',
      version:'DEMO-GUIDE-001 / 依据V1草稿（尚未批准）',
      authority:'SYN-AUTH-001 / 2026-01-01至2026-12-31 / 待核实授权',
      difference:'本次准备V1；无已执行事实，不覆盖历史版本',
      shipment:'SYN-LOT-001 / 计划V1 / 商品行1 / 100 PCS',
      route:'公路 / 示例提货仓→示例出口口岸→示例收货仓 / 计划2026-06-18',
      event:'订舱计划2026-06-18 09:00；提货计划2026-06-19 09:00（均非实际发生）',
      exception:'本交易暂无已核实异常；处置申请仅保存为草稿',
      declaration:'SYN-DEC-001 / 草稿V1 / 无正式海关编号',
      written:'SYN-A-CONFIRM-001 / 供应商书面确认准备稿，尚未签署',
      receipt:'SYN-SOURCE-001 / 离线待核声明；无正式回执',
      bank:'SYN-BANK-001 / 预计来款12500.00；尚无银行实收流水',
      allocations:'拟分配12500.00至DEMO-GUIDE-001；未核实，不入三桶余额',
      invoice:'SYN-INV-001 / 货款12500.00；服务费300.00于首次获批分账时从付款方可用余额结算',
      account:'SYN-ACCOUNT-A / 供应商演示账户尾号0000 / 尚未核实',
      purpose:'DEMO-GUIDE-001 / 规则及主责待正式确认，仅准备材料',
      handoff:'供应商与出口代理分别接收 / SYN-DELIVERY-001 / 尚未正式交付',
      deadline:'演示经办跟进2026-06-20；无法定期限通知，不推算受理日期',
      report:'SYN-REPORT-001 / 草稿V1；货流、报关流、资金流、退税流均待核'
    }
  };
  function values(page) {
    const result = Object.fromEntries(page.fields.map(field=>[field.key,example.values[field.key] ?? field.example]));
    if (['payer-submit','payer-edit'].includes(page.id)) result.materials='SYN-PAYER-FILE@1 / 付款关系说明（合成）';
    if (page.id === 'tax-credit') result.money='0.00';
    return result;
  }
  function documents(page, role) {
    if (role==='D') return page.id === 'payer-invoice' ?
      [{id:'SYN-INV-001',name:'本交易付款发票',purpose:'仅已审有效版本可查看',restricted:true}] :
      [{id:'SYN-PAYER-FILE',name:'付款关系说明.html',purpose:'付款方私有合成材料'}];
    if (page.group === 'trade' || page.id === 'goods-ready') return [
      {id:'SYN-FILE-001',name:'销售合同.html',purpose:'销售合同 / 商品行1'},
      {id:'SYN-CI-001',name:'商业发票.html',purpose:'货值人民币12500.00'},
      {id:'SYN-PL-001',name:'装箱单.html',purpose:'10箱 / 净重100kg / 毛重120kg'}
    ];
    return [{id:'SYN-' + page.id.toUpperCase(),name:page.title+'准备稿.html',purpose:'原创合成准备材料，非正式凭证'}];
  }
  const model = {roles,groups,pages,actions,example,values,documents,canRead,privatePages,fullNames,kindFor};
  root.EXPORT_DEMO_MODEL = model;
  if (typeof module === 'object') module.exports = model;
})(globalThis);
