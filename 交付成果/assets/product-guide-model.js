'use strict';
(function (root) {
  const roles = {
    A: ['A · 供应商', '本方资料、合同、货物批次、报关确认、收款与退税'],
    D: ['D · 付款方', '本方身份、付款关系、付款发票及凭证'],
    B: ['B · 运营经办', '汇总签约依据、协议跟进、证明及四流核对'],
    E: ['E · 物流经办', '受托批次、订舱、提货、运输及签收证据'],
    F: ['F · 关务经办', '受托报关草稿、正式回执声明及证明协助'],
    finance: ['B · 财务经办', '来款、分配、结算、付款申请及对账'],
    reviewer: ['独立审核员', '核对确切版本，批准或退回；禁止审核本人经办资料']
  };
  const steps = ['交易建档', '协议与委任', '备货与物流', '报关与放行', '收款、结算与付款', '代理出口货物证明', '退税申报与跟进', '四流核对与异常'];
  const field = (key, label, example, rule, kind = 'text') => ({key, label, example, rule, kind});
  const catalogue = {
    supplier: field('supplier', '供应商主体引用', 'SYN-A-001', '仅合成主体引用；必须与本交易本方一致'),
    payer: field('payer', '付款方主体引用', 'SYN-D-001', '由D声明，不能由A代填D私有资料'),
    consignee: field('consignee', '实际收货主体及送货安排', 'SYN-C-001 / 合成仓库', 'A收集；D身份不能代替C'),
    goods: field('goods', '商品、数量及计量单位', '支架 / 100 PCS', '正数量；与批准行和材料一致，不自动OCR识别'),
    money: field('money', '人民币金额', '12500.00', 'CNY十进制金额，不接受负数、指数或超出两位小数', 'money'),
    relation: field('relation', '付款关系及原因', '不同法定主体 / 合成商业关系及代付货款说明', '不同主体必须关联关系证明，不以同名判断身份'),
    materials: field('materials', '材料确切版本引用', 'SYN-FILE-001@1', '版本不可覆盖；上传成功不等于审核通过'),
    scope: field('scope', '服务范围及责任边界', '代理出口 / 固定服务费分账结算', '固定人民币300元由D承担，首次获批分账时从D已核验可用余额结算；D授权齐备且不减少A合同应付'),
    paths: field('paths', '收付路径及付款分支', 'D→B→A / 出口后付款', '只允许已确认路径；本次不提供垫资、透支或换汇'),
    version: field('version', '依据、版本及摘要引用', 'SYN-APPROVED-001@1', '指定确切版本，不自动取最新草稿'),
    contract: field('contract', '合同用途及必要签署方', '用途10 / A与B', '用途10代理、11物流、12报关；身份和签署授权分别核实'),
    authority: field('authority', '授权、委托链及有效期', 'SYN-AUTH-001 / 合成有效期', '委托关系与期间必须适用当前主体及交易'),
    difference: field('difference', '本次变化及影响范围', '修改送货安排；未改变付款关系', '改版保留旧依据；不能覆盖已执行事实'),
    shipment: field('shipment', '出运批次及批准商品行', 'SYN-LOT-001 / 商品1', '跨批累计不得超过同一批准版本；不自动迁移跨批准版本分配'),
    route: field('route', '区段、路线、口岸及计划时间', '区段1 / 合成口岸 / 待核实', '计划与实际事实分开；出境必须核实同批正式放行'),
    event: field('event', '事件种类、实际时间及来源', '提货 / 合成时间 / SYN-SOURCE', '订舱、提货、到达、签收分别登记，不以通知替代真实证据'),
    exception: field('exception', '异常原因及处置范围', 'SYN-CASE-001 / 延误', '多原因逐项处置；解除单项不恢复其他暂停'),
    declaration: field('declaration', '申报号、版本及最终摘要', 'SYN-DEC-001@1 / SYN-HASH', '任何字段变化均须新版本、独审及A重新确认'),
    written: field('written', 'A授权书面确认引用', 'SYN-A-CONFIRM-001', '必须A本人授权确认；技术防误点确认不替代书面确认'),
    receipt: field('receipt', '原办理号及来源证据引用', 'SYN-REQUEST-001 / SYN-EVIDENCE', '原件先待核；内部模拟或人工勾选不是官方结果'),
    bank: field('bank', '银行流水及原始事件引用', 'SYN-BANK-001', '银行实收与付款方自报分开；重复流水不能重复分配'),
    allocations: field('allocations', '交易分配与未匹配差额', '12500.00→本交易；差额0.00', '总分守恒；未匹配余额保持受限；尚无真实银行接入'),
    invoice: field('invoice', 'INVOICE申报与分账结算引用', 'SYN-INV-001 / SYN-SERVICE-FEE-SETTLEMENT', 'INVOICE申报、补件、改版不触发服务费；首次获批分账才从D可用余额结算300元'),
    account: field('account', '核实账户的脱敏引用', 'SYN-ACCOUNT / 尾号0000', '账户变更独立核实，重新审核受影响付款；不输入真实账号'),
    fee: field('fee', '银行实际费用', '80.00', '按真实凭据和约定承担，不把服务费并入银行费用', 'money'),
    purpose: field('purpose', '申请范围及适用依据', 'SYN-RULE-001 / 当前交易', '主管渠道、主责或期限未明确时不得正式办理'),
    handoff: field('handoff', '交付对象及接收核对', '交付A / SYN-DELIVERY-001', '发送与接收是两件事；A、B分别本人接收'),
    deadline: field('deadline', '通知、期限及责任人', 'SYN-NOTICE-001 / 待核实期限', '期限依据官方通知，不默认推算为已受理'),
    report: field('report', '报告及源对象集合引用', 'SYN-REPORT-001 / 完整集合', 'pass/fail/unknown逐项保留；unknown阻断正常结案')
  };
  Object.assign(catalogue, {
    supplierCode:field('supplierCode','供应商法定身份引用','SYN-A-IDENTITY','与实名核实结果一致；名称本身不授权'),
    supplierAddress:field('supplierAddress','供应商注册地址','合成注册地址','原资料来源可追溯，不填历史模板地址'),
    supplierContact:field('supplierContact','供应商经办与联系方式引用','SYN-A-CONTACT','仅合成引用；生产联系方式按权限保护'),
    goodsSpec:field('goodsSpec','商品规格及原产地','SYN-M1 / CN','规格、原产地与合同和实货一致'),
    quantity:field('quantity','商品数量','100','正数，最多六位小数，不接受指数或隐式单位转换','quantity'),
    unit:field('unit','商品计量单位','PCS','与批准商品行、发票和箱单一致'),
    unitPrice:field('unitPrice','人民币单价','125.00','本笔批准单价，最多两位小数','money'),
    currency:field('currency','币种','CNY','本轮仅人民币CNY，不做汇率换算','currency'),
    salesContract:field('salesContract','销售合同或订单号','SYN-SALES-001','本次交易的合同编号，不复制历史例子'),
    commercialInvoice:field('commercialInvoice','商业发票号','SYN-CI-001','关联本次三单确切版本'),
    packingList:field('packingList','装箱单号','SYN-PL-001','关联本批商品、箱数和重量'),
    cartons:field('cartons','箱数','10','非负整数，包装对应商品与实货','integer'),
    netWeight:field('netWeight','净重（千克）','100.000','非负，最多六位小数','decimal'),
    grossWeight:field('grossWeight','毛重（千克）','120.000','不得小于净重，最多六位小数','decimal'),
    deliveryAddress:field('deliveryAddress','收货地址及联系人引用','合成仓库 / SYN-C-CONTACT','由A收集，不以D地址替代'),
    nominatedPayer:field('nominatedPayer','拟付款主体受保护引用','SYN-D-001','仅资料声明来源，不是访问D资料的凭证'),
    agent:field('agent','B主体及代理业务指示','SYN-B-001 / 合成代理指示','A提前沟通后填写收集资料，B不在步骤一单独提交'),
    logisticsProvider:field('logisticsProvider','E主体及服务指示','SYN-E-001 / 运输细节待补','可显式待补后续具体运输细节，不能假填资质或报价'),
    customsProvider:field('customsProvider','F主体及服务范围','SYN-F-001 / 合成报关服务','适用资质、报价待正式核实，不能当作已满足签约门禁'),
    payerCode:field('payerCode','付款方法定身份引用','SYN-D-IDENTITY','由D独立声明，身份访问控制另行核实'),
    payerCountry:field('payerCountry','付款方国家或地区','SG','真实所属地区，不因支付通道推定身份'),
    payerContact:field('payerContact','付款方联系人及联系方式引用','SYN-D-CONTACT','本方私有资料，不向A展示'),
    relationshipKind:field('relationshipKind','与实际收货人的关系类型','不同法定主体','选择“同一法定主体”或“不同法定主体”；同名不等于同主体','relationship'),
    relationshipEvidence:field('relationshipEvidence','商业关系支持材料引用','SYN-RELATION-FILE@1','不同法定主体时必填，人工核实后才用于后续门禁')
  });
  const supplierFields = ['supplier','supplierCode','supplierAddress','supplierContact','consignee','deliveryAddress','nominatedPayer','goods','goodsSpec','quantity','unit','unitPrice','money','currency','salesContract','commercialInvoice','packingList','cartons','netWeight','grossWeight','materials','agent','logisticsProvider','customsProvider','scope','paths'];
  const payerFields = ['payer','payerCode','payerCountry','payerContact','relationshipKind','relation','relationshipEvidence','materials'];
  function task(id, step, title, owners, nodes, usecases, fields, goal, gate, result, recovery, dependencies = [], mode = 'review') {
    return {id, step, title, owners, nodes, usecases, fields:fields.map(key => catalogue[key]), goal, gate, result, recovery, dependencies, mode};
  }
  const tasks = [
    task('supplier-submit', 1, 'A首次提交交易资料', ['A'], ['N01'], ['supplier-submit'], supplierFields,
      'A事先收集主体和三单，预取号并首次提交。', 'A身份及本方对象授权已核实；本页仅合成模拟。', '首次提交在本机演示中创建同号交易及A资料，状态为资料已提交，未批准。', '缺件定位字段；提交超时先恢复原受理，不能重新取号。', [], 'filing'),
    task('payer-submit', 1, 'D首次提交付款资料', ['D'], ['N01'], ['payer-submit'], payerFields,
      'D独立声明付款身份、与C关系和付款原因。', '交易已存在且D关系已核实；交易号本身不授权。', '仅创建D本方一份资料，不改变A提交的内容。', '不同主体缺关系证据时补件；不能更换主体绕过核实。', ['supplier-submit'], 'filing'),
    task('supplier-edit', 1, 'A修改原资料', ['A'], ['N01'], ['supplier-edit'], [...supplierFields,'difference'],
      '在原资源新建本方修订。', 'A已首次提交；改动不得破坏D已声明关系。', '本方修订递增并保留旧记录；D私有字段保持不变。', '版本过期重新读取并比较；改变付款关系须先核实依赖。', ['supplier-submit'], 'filing'),
    task('payer-edit', 1, 'D修改原付款资料', ['D'], ['N01'], ['payer-edit'], [...payerFields,'difference'],
      'D在原资料地址提交完整替换内容。', 'D已首次提交，仅编辑本方资源。', '新修订替换本方当前表示，旧受理仍可查看。', '不能再次首次提交；陈旧版本须重读核对。', ['payer-submit'], 'filing'),
    task('contract-basis', 2, '汇总送审签约依据', ['B'], ['N02','N03','N04'], ['basis-submit','basis-review'], ['version','authority','scope','paths','materials'],
      'B汇总当前资料，由独立审核员批准或退回签约依据。', '双方首次资料齐备；签约阶段必需项完成，未来运输细节可列待补。', '仅形成签约依据的演示批准，不表示合同已签或付款可执行。', '审核退回保留原因，补正新版本后重新送审。', ['supplier-submit','payer-submit']),
    task('contract-draft', 2, '合同起草、条款审查与改版', ['A'], ['N02','N03','N04'], ['contract-draft','contract-review','contract-revise'], ['contract','version','scope','authority','materials','difference'],
      '按用途建立唯一合同身份，独审正文及委托链。', '引用确切批准依据；一单一用途，旧有效合同不因新草稿失效。', '演示条款审核通过，只开放签署准备，不等于已签。', '签署活跃或未知先核实原任务，不另建合同身份。', ['contract-basis']),
    task('contract-sign', 2, '签署准备与生效核对', ['A','B','E','F'], ['N02','N03','N04'], ['contract-sign','contract-activate'], ['contract','version','authority','receipt'],
      '必要签署方核对确切正文，区分平台待办、签署核验及生效。', '真实平台、身份和证据归档未接入，本页仅记录准备资料。', '保存待核签署材料，不生成已签合同或生效事实。', '跳回页面不算签完；原任务查单、正文及全体签署证据核实后另决定生效。', ['contract-draft'], 'external'),
    task('contract-authority', 2, '公共协议、正式委托及预付认可', ['A','B'], ['N03','N04'], ['framework-use','customs-authority'], ['contract','authority','version','purpose','materials'],
      '逐交易核对框架适用，登记正式报关委托及同一F的认可。', '框架白名单、范围、主体及日期一致；预付认可不等于付款审批。', '形成待核适用/授权资料，不回填旧批准快照。', '缺正式授权或委托链不明时停止后续办理。', ['contract-basis']),
    task('shipment-plan', 3, '新建或修改出运计划', ['A'], ['N05','N06'], ['shipment-plan','shipment-amend'], ['version','shipment','goods','money','route','difference'],
      '按批准商品行分配批次及运输区段。', '跨批累计数量和金额不得超批准；待审、未知或已执行计划不得直接改写。', '本机保存计划演示，不代表允许发运。', '超量拒绝；取消须核实无提货和未知任务；跨批准版迁移待明确规则。', ['contract-basis']),
    task('goods-ready', 3, '备货与三单核对', ['A'], ['N05'], ['goods-ready'], ['shipment','goods','money','materials'],
      'A提交同批三单与实货说明，独立审核员核对。', '材料绑定同计划版、用途和商品行，不能用历史样例替代。', '演示备货资料审核结论；尚不形成真实可发运事实。', '退回后新增证据版本并重送，不覆盖旧提交。', ['shipment-plan']),
    task('booking-pickup', 3, '订舱、提货与运输计划证据', ['E'], ['N06'], ['booking-pickup'], ['shipment','authority','route','event','materials'],
      'E按受托批次分别提交订舱与提货证据。', '委托链、有效合同、备货核实齐；订舱与提货不能合并为一条事实。', '待核事件资料，批准也只代表本机演示审核。', '缺件退回；未知原承运任务先核实，不释放占量。', ['goods-ready']),
    task('transport-progress', 3, '运输、签收及物流异常', ['E'], ['N10','N23'], ['transport-progress','logistics-exception','logistics-query'], ['shipment','route','event','materials','exception'],
      '按区段登记进展，取得C授权签收或报告异常。', '出境需同批真实正式放行；到达不等于签收，多异常逐项闭环。', '本机声明及审核轨迹，不替代正式放行和真实签收。', '延误/货损/拒收保留原进度；关闭一案不解除其他原因。', ['booking-pickup']),
    task('customs-draft', 4, '报关依据、草稿与独立审查', ['F'], ['N07'], ['s4-basis','s4-draft','s4-revision','s4-review'], ['version','shipment','declaration','goods','money','materials','difference'],
      'F制作版本化完整草稿并送独审。', '批准快照、计划与A/B/C/F角色一致；商品不得超分配。', '演示已审草稿，等待A对确切版本确认。', '修改一栏也要新版本，原批准和A确认不沿用。', ['goods-ready']),
    task('customs-confirm', 4, 'A确认最终报关草稿', ['A'], ['N08'], ['s4-confirm'], ['declaration','version','written','materials'],
      'A逐栏核对最终草稿并关联书面确认。', '只有A本人授权确认，F或内部审核不能代替。', '本机确认记录，不冒充真实授权书。', '版本变化先重新独审，确认不能迁移到新摘要。', ['customs-draft'], 'filing'),
    task('customs-official', 4, '正式办理、回执声明及更正', ['F'], ['N09','N23'], ['s4-filing','s4-official','s4-correction'], ['declaration','authority','receipt','materials','difference'],
      '登记办理依据及正式来源原件，独立核实申报/受理/查验/放行。', '需要真实渠道、适用规则和有效委托；本原型缺这些条件。', '资料保持待核，正式办理按钮明确阻断；不会造放行。', '未知按原办理号查单，不能更换号重报；退单按原通知补正。', ['customs-confirm'], 'external'),
    task('customs-delivery', 4, '附件2分别交付与接收', ['F','A','B'], ['N09'], ['s4-attachment','s4-query'], ['declaration','receipt','handoff','materials'],
      'F交付附件2，A/B分别核对接收。', '收件人只确认自己的交付；正式证据须先核实。', '保存本机交付资料，不以发送表示A/B已接收。', '错版或缺件提出异议并重交，旧记录保留。', [], 'external'),
    task('bank-allocation', 5, '银行实收、分配与独立复核', ['finance'], ['N11','N12'], ['s5-n11-receipt','s5-n12-allocation'], ['bank','money','allocations','materials'],
      '区分D自报凭证、银行实收、交易分配与未匹配款。', '仅真实银行事实可入账；合并总额等于分配加未匹配。', '保存待核实收和分配说明，不增加真实余额。', '重复/异文流水隔离，未匹配保持受限，差额不能强制抹平。', [], 'external'),
    task('invoice-release', 5, 'INVOICE、服务费与贸易核验', ['finance'], ['N12','N13'], ['s5-n13-invoice-fee','s5-n14-verification-release'], ['invoice','version','money','receipt','materials'],
      '逐版核对INVOICE申报、服务费结算依据及银行部分释放。', 'INVOICE不触发服务费；固定300元由D在首次获批分账时从已核验可用余额结算。', '待核资料，不把内部审核当可用入账。', '部分通过只处理对应额，其余受限；补正保留申报历史。', [], 'external'),
    task('payment-request', 5, '结算及预付/出口后付款申请', ['finance'], ['N14','N15','N16','N17'], ['s5-n15-settlement','s5-n16-payment'], ['version','paths','money','fee','account','receipt'],
      '经办编制应付与付款分支，交独立审批；A到账独立核实。', '可用余额、账户、授权、同批出口条件等须真实满足；无垫资/透支/换汇。', '本机申请及审核记录；不执行银行付款、不生成锁额或A到账。', '付款未知按原号查单，不重复付款或解锁；账户改版重新审核。', [], 'external'),
    task('funds-reconcile', 5, '资金差异与到账说明', ['finance','A','D'], ['N17','N23'], ['s5-n17-reconciliation'], ['bank','money','receipt','exception'],
      'A只说明本方收款，D只说明本方付款；财务处理资金差异。', '不能把D付款截图当B实收；A收款声明须财务独立核实。', '分别保存各方私有声明，不改变账务余额。', '漏记/重复/金额不符交资金责任人，禁止直接改余额消差。', [], 'private'),
    task('proof-prepare', 6, '证明范围、协同案件及材料审核', ['B','F'], ['N18','N19'], ['s6-preparation','s6-cooperation','s6-materials','s6-review'], ['purpose','version','declaration','materials'],
      'B确认申请主责与渠道，F协助整理确定版材料。', '适用依据未确认时只备料，独立税务审核员审核。', '本机协同材料和审核轨迹，不代表官方受理。', '退回补正另建版本；主责/范围不明不得发起正式办理。', []),
    task('proof-official', 6, '证明办理、官方结果与补正', ['B','F'], ['N19','N20'], ['s6-dispatch','s6-official-receipt','s6-correction','s6-certificate'], ['purpose','receipt','deadline','materials','difference'],
      '登记正式来源与补正，区分申请、受理、签发、更正和撤销。', '无正式渠道与真实凭据时不得标记签发。', '保持待核资料，不生成官方证明。', '未知按原申请恢复；补正另版重审，撤销影响下游资料。', ['proof-prepare'], 'external'),
    task('proof-delivery', 6, '证明交付、A接收与异议', ['B','A'], ['N20'], ['s6-delivery','s6-receipt','s6-objection','s6-query'], ['receipt','handoff','materials','difference'],
      'B交付正式证明，A核对或提出异议，独立处理后重交。', 'A只能确认自己的交付，内部不能代收。', '保留交付/接收声明与异议，未核官方证明不视为完成。', '错主体、版本或摘要提出异议；不覆盖原交付。', [], 'external'),
    task('tax-package', 7, 'A退税备料、确定版与独审', ['A'], ['N21'], ['s7-prepare','s7-package','s7-review'], ['purpose','version','materials','money'],
      'A确认适用范围并形成不可变清单，交独立税务审核。', '证明、申报、贸易及资金材料适用；缺来源列unknown。', '本机资料审核，不表示已向税务机关提交。', '退回保留原因，新版重新独审。', []),
    task('tax-official', 7, '退税提交、通知、补正及终局', ['A','B'], ['N21'], ['s7-dispatch','s7-notice','s7-correction','s7-decision'], ['purpose','receipt','deadline','materials','difference'],
      '授权经办提交，核实官方通知、补正与终局决定。', 'B协助不替代A申报授权；无官方通道保持未提交。', '待核通知资料，不伪造受理、批准或终局。', '原请求恢复；补正另版审；终局拒绝不能自动正常结案。', ['tax-package'], 'external'),
    task('tax-credit', 7, '退税到账、差异及原受理查询', ['A','finance'], ['N21','N23'], ['s7-credit','s7-recovery'], ['money','account','receipt','exception'],
      '区分税务决定金额与实际到账及账户归属。', 'A到账不增加B货款账户；需独立真实银行核对。', '本方到账说明待核，不写银行或账务成功事实。', '差额与迟到款交责任人处理，不用税务处理完成替代到账。', [], 'private'),
    task('crossflow-report', 8, '四流逐项报告与差异分派', ['B'], ['N22','N23'], ['s8-context','s8-report','s8-assignment'], ['report','version','exception','materials'],
      '冻结源版本和完整对象集合，逐项保留pass/fail/unknown及责任。', '未接入、缺证、集合不全均unknown，不能勾选全部通过。', '演示报告保持unknown并可提出差异，不正常结案。', '新源事件或新增对象使旧报告过期，重新核对。', [], 'external'),
    task('case-remedy', 8, '暂停、更正、处置与解除复核', ['B','E','F'], ['N23'], ['s8-hold','s8-remedy','s8-correction','s8-release','s8-case-close'], ['exception','purpose','version','materials','difference'],
      '逐原因确定暂停范围，经独立复核后处置或申请解除。', '只能处置本方责任对象；资金差异由资金域关闭；关案与解除分开。', '本机处置申请，不自动解除暂停或覆盖原节点事实。', '原节点新修订重审；传播未确认继续阻断，其他原因保留。', []),
    task('closure', 8, '正常结案申请、独审与历史', ['B'], ['N22'], ['s8-closure-apply','s8-closure-review','s8-query'], ['report','version','receipt','materials'],
      '申请与独审时均重读全部来源及对象集合。', '必须无unknown、差异、有效暂停、未决执行及未核实到账；当前原型不具备完整真实事实。', '允许保存申请准备，不允许伪造正常结案。', '过期报告重新生成；退回保留理由；不提供特殊结案绕过入口。', [], 'external')
  ];
  tasks.push({
    ...task('payer-invoice', 5, 'D查看已审付款发票', ['finance'], ['N12'], [], ['invoice','money','materials'],
      '财务准备本笔发票，独立资料审核后D只读核对。', 'D仅可见本交易已审演示发票，不显示待审内部材料和其他交易。', '演示已审发票供D核对，不代表真实已申报或银行已收款。', '金额或版本不符交B核对；D不得修改B开票内容。', [], 'review'),
    viewers:['D']
  });
  const states = {draft:'草稿', submitted:'已提交 · 待独立核对', approved:'演示资料审核通过', rejected:'已退回 · 待补正', withdrawn:'已撤回'};
  const internal = role => !['A','D'].includes(role);
  const canRead = (task, role) => task.owners.includes(role) || (task.viewers || []).includes(role) || (internal(role) && ['B','reviewer'].includes(role));
  const canWrite = (task, role) => task.owners.includes(role);
  const model = {roles, steps, tasks, states, internal, canRead, canWrite};
  root.EXPORT_PRODUCT_GUIDE = model;
  if (typeof module === 'object') module.exports = model;
})(globalThis);
