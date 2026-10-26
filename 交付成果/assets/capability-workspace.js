'use strict';
(function(root){
  const scenarios=[
    {
      id:'sales',number:'01',title:'建立交易档案',owner:'A供应商与D付款方分别提交；B在步骤一只读',category:'入口：对外A/D网页；内部独立查询',flow:'建档与签约 · 货物流 · 报关流',
      summary:'供应商事先收集适用主体及三单，预取号并首次提交创建交易；D独立提交付款声明。双方分别修改本方原资料，不在步骤一终审批准。',
      trigger:'A事先与代理及服务商沟通后自行填写；D在交易及身份关系核实后提交本方资料。无运营先建单或A至F邀请提交。',
      inputs:['A：供应商法定主体资料；本笔货物名称、数量、货值、币种、商业发票、装箱单、销售合同 / 订单、原产地及产品资料','B：代理业务指示、代理范围与本笔收付款路径；每笔固定人民币300元服务费由D承担，并在首次获批分账时从D已核验可用余额一次性结算；D授权及收费依据须齐备','C：真实收货人主体资料及完整送货地址','D：付款方主体资料、向B付款确认，以及与C的商业关系说明和支持资料','E：出口口岸、运输方式 / 工具等基础信息；步骤1暂缺可标记待补，后续报关 / 物流节点补齐','F：报关服务商资质、联系人、报价及服务范围'],
      controls:['仅A和D分别首次提交及修改本方资料，不能读取或覆盖另一方私有字段。','A首次提交才创建同号交易；B在此阶段只读，签约依据送审和独立审核属于步骤二。','适用运输细节可显式待补，不能因此豁免后续物流与报关门禁。','本步骤不连接银行、不批准整单、不提交报关或付款。'],
      outputs:['唯一同号交易及A/D分别提交的本方资料','可追踪的确切材料版本和追加受理记录；不代表整单已批准','缺件及后续签约阶段待核项目'],
      exceptions:['首次提交未知先恢复原号受理，不能另取号重复建单。','本方修改遇到版本冲突先重读比较；付款关系依赖变化须先核实。','运输信息暂缺须明确责任和后续门禁。'],
      nodes:['N01'],next:'02 · 签署必要协议'
    },
    {
      id:'contracts',number:'02',title:'签署必要协议',owner:'A / B / E / F 经办 → 法务 / 财务 Review → 授权审批人',category:'协议签署',flow:'货物流 · 资金流 · 报关流',
      summary:'按本笔交易分别核验代理协议、物流合同、报关服务合同和电子委托；协议有效、签署完整并与付款分支一致后，才开放后续节点。',
      trigger:'交易建档审批通过，且B拟开展代理 / 代收代付或E、F拟开始服务时。',
      inputs:['交易号与A / B / E / F真实法定主体、授权签署人','附件1费用、结算、付款时点与预付款 / 出口后付款分支','物流报价、委托主体、服务范围；A委任F的合同及电子授权'],
      controls:['逐份检查主体、服务范围、报价、费用、签章、生效日、交易 / 批次和授权有效期。','M06候选模板的原收费 / 扣款条款与当前固定服务费设计冲突，且章次及结算期限待Review；正式签前须法务 / 财务书面统一。','M07现有合同甲方为B；先确认A→E委托链或补有效三方 / 转委托约定，并区分F的中国出口报关职责。','M05仅为流程图，不是附件4合同；预付款前须A—F合同及B认可同一F，正式申报前须有效电子委托。'],
      outputs:['逐份协议Review清单、条款意见及审批轨迹','已签生效协议 / 授权版本与待补材料任务'],
      exceptions:['未签署、主体不一致、服务商名称与发票 / 收款资料不符或授权过期：暂停。','缺附件4正文 / 电子委托，或结算条款与付款门禁冲突：不得签批或放行付款。'],
      nodes:['N02','N03','N04'],next:'03 · 备货及安排物流'
    },
    {
      id:'logistics',number:'03',title:'备货及安排物流',owner:'A备货 / 出口单证 → E订舱 / 提运 → 运营核对',category:'货物与运输',flow:'货物流',
      summary:'汇总A的最终发票、装箱单与实货数据，关联E的提送货指示、订舱运输计划、货况及交付证明；一致性人工核验通过后形成可安排出运档案。',
      trigger:'必要协议生效，A提供最终货物与提货资料后。',
      inputs:['A：最终商业发票、装箱单、货物名称 / 规格 / 数量 / 单价 / 总额 / 币种','A：箱数 / 托盘数、净重 / 毛重、原产地及适用产品 / 原产地证书','A：提货地点、送货地址、C收货主体、交接及签收要求','E：订舱、运输编号 / 路线 / 口岸 / 工具 / ETA，提货计划、包装 / 集装箱状况、跟踪、签收或异常记录'],
      controls:['合同、发票、装箱单与实货的交易方、品名、数量、金额、包装、净重 / 毛重逐项核对。','物流编号和所有材料绑定交易号 / 批次；变更货物、路线、数量或重量时保留版本并通知A / F。','E仅负责物流，不代替F办理中国出口报关；货损、拒收、延误等留证并转人工处理。','M09及E01 / E02为历史样例，T01 / T03为填报说明；样例须去除历史主体、零数量及#REF!后另制本笔原件。'],
      outputs:['最终出口单证版本与实货核对记录','运输计划、货况 / 跟踪及签收 / 异常证据索引'],
      exceptions:['发票 / 箱单与合同或实货不一致：冻结出运包并退A修订。','路线、口岸、工具、包装或重量缺失 / 改变：补证并重新核对；不得由E越权申报。'],
      nodes:['N05','N06','N10'],next:'04 · 委任F及准备出口报关'
    },
    {
      id:'customs',number:'04',title:'委任F及准备出口报关',owner:'A委任 / 书面确认 → F制单 / 申报 → B接收归档',category:'报关协同',flow:'报关流 · 货物流',
      summary:'A将完整出口资料及有效授权交F；F制双抬头报关草稿，A对最终版本书面确认后，F方可正式申报并回传附件2、受理及放行证明。',
      trigger:'步骤2委任与步骤3最终货物 / 物流资料齐备，且适用付款条件允许委任F时。',
      inputs:['有效A—F报关服务合同、电子委托；预付款模式还须B认可同一F','最终销售合同、发票、箱单、商品及物流 / 口岸 / 运输资料','F草稿版本与字段、A确认人 / 时间 / 版本摘要、申报 / 受理 / 放行回执'],
      controls:['确认报关单角色：A为中国供应商 / 生产单位，B为境内发货人，C为收货人。','F核对完整性、一致性并制作版本化草稿；A的书面批准绑定最终版本，任何修改均需重新确认。','只有A确认最终版后F才可在正式渠道申报；申报、受理、查验、放行、退单 / 更正分别归档。','M11是历史报关核对样例，不是本笔草稿或付款放行证据；不得复制历史主体、国别、口岸或备注。','未列B为境内发货人、B未收到已申报附件2或缺正式出口放行证据：阻断出口后付款。'],
      outputs:['待审草稿、差异列表及A书面确认记录','已申报附件2、受理 / 出口放行凭证与A / B接收记录'],
      exceptions:['授权无效、草稿未确认或确认后改版：禁止申报。','退单、查验、未放行、未向B交付附件2或B栏错误：保持ON HOLD并补正。'],
      nodes:['N04','N07','N08','N09'],next:'05 · 开票、收取CNH及向A付款'
    },
    {
      id:'funds',number:'05',title:'开票、收取CNH及向A付款',owner:'B资金经办 → 财务复核 / 授权放行 → A确认到账',category:'资金结算',flow:'资金流',
      summary:'B向D开具本笔货物付款发票并以银行实际入账匹配交易；按银行实际入账及可用凭证完成人民币贸易核验入账与结算核算，列清费用与净额，仅在对应付款分支门禁通过后付款给A。',
      trigger:'合同约定的付款时点到达，且D按批准付款编号支付CNH时。',
      inputs:['B向D开具的本笔货物INVOICE：交易 / 批次、付款编号、D付款方、CNH金额','银行实际入账与水单、交易匹配、最新带日期的人民币入账及可用状态确认','银行 / 中转费用、代理费用、扣款、已付定金 / 预付款、已结尾款与拟付净额','A经公司批准渠道核实的人民币账户；出款回单及A到账确认'],
      controls:['仅以B银行实际入账及核实结果记收款；D身份 / 付款编号 / 币种 / 金额须匹配，第三方付款先补已批准关系说明。','1:1只在本笔交易的最新、带日期银行书面报价确认“无滑点、无溢价”后使用；报价过期 / 不同条件即暂停并财务复核。','结算单拆列收款总额、汇率、银行及中转费、服务费、其他扣款、已付款和人民币净额；出款后凭银行回执更新状态，A确认到账单独留痕。','预付款：满足协议、F委任及垫资审批等放行条件；出口后付款：还须核验B为境内发货人、已收到附件2及正式出口放行证据。'],
      outputs:['B向D的本笔付款发票及银行入账匹配记录','带报价依据、费用拆分、定金 / 尾款及净额的审批结算单','出款回执、A收款账户核验与到账确认'],
      exceptions:['缺银行实际入账、报价过期 / 未归档、金额不符、费用未批、超付或账户未核验：暂停。','出口后付款门禁、预付款 / 垫资审批未满足或A未确认到账：不得标记结清。'],
      nodes:['N11','N12','N13','N14','N15','N16','N17'],next:'06 · 账户中心支撑'
    },
    {
      id:'accounts',number:'06',title:'账户中心 · 银行账户与接入支撑',owner:'财务 / 银行接口管理员',category:'账户支撑',flow:'资金流',
      summary:'按银行、法人、币种与账户用途维护脱敏账户主数据，支撑步骤5的收款 / 付款核验；该模块不是操作指引中的独立业务步骤。',
      trigger:'资金结算建档、账户变更或银行回单核验时。',
      inputs:['账户主体、币种、用途、有效期及核验来源','收款账户 / 付款账户区分与变更复核','银行渠道授权范围及回单字段映射'],
      controls:['敏感账号最小可见；只展示脱敏标识。','账户变更需独立回拨 / 双人核验；本原型不连银行。'],
      outputs:['脱敏账户主数据与变更审计','银行流水 / 回单待匹配队列'],
      exceptions:['付款方截图或报文不等于银行实际入账 / 出账；异常流水转人工核查。'],
      nodes:['N11','N17'],next:'07 · 四流合一与合规'
    },
    {
      id:'compliance',number:'07',title:'合规中心 · 退税跟踪 / 四流核验入口',owner:'运营统筹 + 各流责任人 / 合规 / 财务',category:'合规与税务',flow:'货物流 · 报关流 · 资金流 · 退税流',
      summary:'用唯一交易号串联合同、货物与物流、海关申报、银行收付贸易核验入账及退税材料；差异可定位责任人与阻断节点。',
      trigger:'节点交付、付款放行、证明 / 退税归档及最终结案时。',
      inputs:['货物流：合同、发票、箱单、批次、运输 / 签收和货损证据','报关流：授权、最终草稿、书面确认、申报受理、附件2、放行 / 更正回执','资金流：付款编号、银行入账 / 可用状态、贸易核验入账报价、费用、出款和收款确认','退税流：证明申请 / 签发交付、官方税务系统申报回执、补正 / 处理结果与到账（如适用）'],
      controls:['交易号是关联键，不替代证据核验；按主体、批次、商品、数量、币种、金额和日期做跨流校验。','记录 KYC / 受益所有人、C/D 关系、最终用途、制裁 / 出口管制 / AML 核查依据及复核时间；不以人民币或付款通道推定豁免。','缺件、名单命中、身份不一致、无解释资金、报关更正或退税补正进入 ON HOLD；指定处理人、时限、证据和复核人。','业务经办、Review、财务复核与付款终审分权；所有结论绑定材料版本，改件后重审。'],
      outputs:['四流对账矩阵、差异清单、节点阻断原因和处理记录','结案清单及完整版本化证据索引；未闭环不标记正常完成'],
      exceptions:['主管税务 / 海关 / 银行的适用要求、职责与时限须以正式依据确认；系统不自动生成法律或合规批准。','预付款还需追踪后续出口、尾款及垫资清偿；任何未解释余额都阻止正常结案。'],
      nodes:['N01','N13','N16','N19','N21','N22','N23'],next:''
    }
  ];
  const $=id=>document.getElementById(id);
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let selected='directory';
  let salesPage='dossier';
  const customsCatalog={tab:'entry',role:'A',query:'',message:'',draft:{},records:[]};
  let initialized=false;
  const demo={caseCreated:false,reviewStarted:false,bankChecked:false,logisticsChecked:false,customsConfirmed:false,quoteArchived:false,quoteDate:'',complianceChecked:false,settlement:null,settlementInputs:null,settlementDirty:false};
  const dossier={entry:'web',device:'pc',vpn:false,section:'A',submitted:false,approved:false,transportMissing:true,attachments:{},attachmentSequence:0,previewId:'',customsPreview:false,customsApplied:false,customsValues:{},fieldSources:{},historySelection:'',message:'',values:{
    aName:'龙南逸泰源跨境电商有限公司',aCode:'91360727DEMO00001',aAddress:'江西省赣州市龙南市示范路88号',aContact:'林女士',aPhone:'13800000001',
    goods:'家居收纳用品',spec:'塑料材质；型号 DEMO-01',origin:'中国',quantity:'1200',unit:'件',unitPrice:'8.50',totalValue:'10200',currency:'USD',brand:'DEMO',contractNo:'SALE-DEMO-001',invoiceNo:'INV-DEMO-001',packingNo:'PL-DEMO-001',
    bName:'示例贸易代理有限公司',bCode:'91360727DEMO00002',bContact:'陈先生',bPhone:'13800000003',bInstruction:'代理出口；D货款按本笔交易编号收取并按约定分账；每笔交易固定300元服务费由D承担，在首次获批分账时从D已核验可用余额一次性结算。',bCollection:'D → B收款账户（具体账户在资金节点核验）',bPayment:'B → A收款账户（付款前独立核验）',bCurrency:'USD',bMode:'出口后付款',serviceFeeAmount:'300',serviceFeePayer:'D',serviceFeeMethod:'首次获批分账时按trade唯一键从D已核验可用余额一次性结算；不减少A合同应付',
    cName:'示例境外收货有限公司',cCountry:'俄罗斯',cCode:'C-REG-DEMO-001',cAddress:'俄罗斯示例州示范市出口大道 100 号',cContact:'Alex Demo',cPhone:'+7 900 000 0001',cDelivery:'送至合同指定仓库；收货预约待确认',
    dName:'示例付款主体有限公司',dCountry:'吉尔吉斯斯坦',dCode:'D-REG-DEMO-001',dContact:'Dana Demo',dPhone:'+996 700 000 001',dConfirm:'按交易编号及付款发票向B付款，金额与币种以审批后文件为准。',dRelationship:'D为C本笔采购的关联付款主体；具体商业关系以支持文件和人工核验为准。',
    ePort:'待E确认',eMode:'公路运输',eVehicle:'待订车后补充',eRoute:'待物流方案确认',eEta:'',
    fName:'示例报关服务有限公司',fQualification:'CUSTOMS-DEMO-001',fContact:'周先生',fPhone:'13800000002',fEmail:'customs-demo@example.test',fScope:'出口报关资料核对、草稿制作、正式申报及回执交付',fQuote:'待正式报价确认',fQuoteCurrency:'CNY'
  }};
  const dossierSections=[
    {id:'A',title:'A · 中国供应商',subtitle:'供应商主体、货物资料与本笔出口单证',requiredFiles:['A商业发票','A装箱单','A销售合同 / 订单']},
    {id:'B',title:'B · 贸易代理商',subtitle:'代理业务指示、收付款路径与固定服务费规则',requiredFiles:['B本笔代理业务指示 / 收付路径说明']},
    {id:'C',title:'C · 境外收货人',subtitle:'实际收货主体、送货地址与交付安排',requiredFiles:['C收货主体及地址支持资料']},
    {id:'D',title:'D · 付款方',subtitle:'付款主体、付款确认、C / D商业关系及服务费授权',requiredFiles:['D付款确认','C / D关系支持资料','D服务费承担及分账扣收授权']},
    {id:'E',title:'E · 物流公司',subtitle:'口岸及运输工具基础信息（步骤1可暂缺）',requiredFiles:[]},
    {id:'F',title:'F · 报关代理',subtitle:'服务商资质、联系人、报价及服务范围',requiredFiles:['F服务商资质','F报价 / 服务范围资料']}
  ];
  const materialLibrary=[
    {id:'invoice-template',name:'步骤1-商业发票.docx',path:'../材料/步骤1-商业发票.docx',previewKey:'M13',category:'A商业发票',note:'本地商业发票模板；提交前按本笔交易补齐并核验。',kind:'模板'},
    {id:'invoice-history',name:'步骤1及3-出口商业发票-历史例子.xlsx',path:'../材料/按Sheet拆分/步骤1及3-出口商业发票-历史例子.xlsx',previewKey:'E01',category:'A商业发票',note:'历史例子，仅用于字段参考，不可直接作为本笔业务原件。',kind:'历史样例'},
    {id:'packing-history',name:'步骤1及3-出口装箱单-历史例子.xlsx',path:'../材料/按Sheet拆分/步骤1及3-出口装箱单-历史例子.xlsx',previewKey:'E02',category:'A装箱单',note:'历史例子，仅用于字段参考，不可直接作为本笔业务原件。',kind:'历史样例'},
    {id:'contract-template',name:'步骤1-销售合同-外贸结汇专用中英文合同.docx',path:'../材料/步骤1-销售合同-外贸结汇专用中英文合同.docx',previewKey:'M08',category:'A销售合同 / 订单',note:'本地合同模板；签署前需完成主体、条款Review和审批。',kind:'模板'},
    {id:'contract-history',name:'步骤1-出口销售合同-历史例子.xlsx',path:'../材料/按Sheet拆分/步骤1-出口销售合同-历史例子.xlsx',previewKey:'E03',category:'A销售合同 / 订单',note:'历史例子，仅用于字段参考，不可直接作为本笔业务原件。',kind:'历史样例'}
  ];
  const customsChecklist={id:'customs-field-checklist',name:'_Export doc info list and explaination.xlsx · Export Docs 出口单证字段清单',path:'../材料/_Export doc info list and explaination.xlsx',previewKey:'M12',type:'',size:0,source:'library',sourceLabel:'材料目录 · 字段定义参考（不作为本次业务原件）'};
  const customsRecordName='关务子模块商品台账 · EX-CUS-DEMO-001（合成数据）';
  const customsFieldLabels={
    goods:'货物名称 / Goods Description',spec:'规格型号 / Description & Specification',brand:'品牌 / Brand',vendorPN:'供应商料号 / Vendor P/N',customerPN:'客户料号 / Customer P/N',
    hsSuggestion:'HS编码 / HS Code（仅建议）',origin:'原产地 / Origin',quantity:'数量 / Quantity',unit:'计量单位 / UOM',
    unitPrice:'单价 / Unit Price',totalValue:'总价 / Amount',currency:'币制 / Currency',packages:'箱数 / Cartons',
    netWeight:'净重 / N.W.',grossWeight:'毛重 / G.W.'
  };
  const customsDemoValues={
    goods:'家居收纳用品',spec:'塑料材质；型号 DEMO-01',brand:'DEMO',vendorPN:'SUP-DEMO-01',customerPN:'CUS-DEMO-01',
    hsSuggestion:'待F核验；清单未提供已确认税号',origin:'中国',quantity:'1200',unit:'件',
    unitPrice:'8.50',totalValue:'10200',currency:'USD',packages:'120箱',netWeight:'210',grossWeight:'235'
  };
  const customsCatalogFields=[
    {key:'goods',label:'货品名称',required:true},{key:'spec',label:'规格 / 型号 / 材质 / 用途',required:true},
    {key:'brand',label:'品牌'},{key:'vendorPN',label:'供应商料号'},{key:'customerPN',label:'客户料号'},
    {key:'hsCode',label:'商品编码（待核验）'},{key:'declarationElements',label:'申报要素'},
    {key:'unit',label:'成交计量单位',required:true},{key:'legalUnit',label:'第一法定计量单位（待核验）'},
    {key:'secondUnit',label:'第二法定计量单位（如适用）'},{key:'quantity',label:'成交数量',type:'number',required:true},
    {key:'legalQuantity',label:'第一法定数量',type:'number'},{key:'secondQuantity',label:'第二法定数量',type:'number'},
    {key:'origin',label:'原产国 / 地区',required:true},{key:'destination',label:'最终目的国 / 地区'},
    {key:'unitPrice',label:'单价',type:'number'},{key:'totalValue',label:'总价',type:'number'},{key:'currency',label:'币制',required:true},
    {key:'packages',label:'箱数 / 包装件数与类型'},{key:'netWeight',label:'净重（kg）',type:'number'},{key:'grossWeight',label:'毛重（kg）',type:'number'},
    {key:'regulation',label:'监管条件 / 检验检疫要求（待核验）'},{key:'sourceReference',label:'来源单证 / 官方查询依据及版本',required:true}
  ];
  const historyRecords=[
    {id:'history-home-organizer',label:'家居收纳用品 · 历史交易示例 EX-HIST-001（合成数据）',values:{aName:'龙南逸泰源跨境电商有限公司',aCode:'91360727DEMO00001',aAddress:'江西省赣州市龙南市示范路88号',aContact:'林女士',aPhone:'13800000001',goods:'家居收纳用品',spec:'塑料材质；型号 DEMO-01',brand:'DEMO',vendorPN:'SUP-DEMO-01',customerPN:'CUS-DEMO-01',origin:'中国',quantity:'1200',unit:'件',unitPrice:'8.50',totalValue:'10200',currency:'USD',packages:'120箱',netWeight:'210',grossWeight:'235',contractNo:'SALE-DEMO-001',invoiceNo:'INV-DEMO-001',packingNo:'PL-DEMO-001'}},
    {id:'history-office-organizer',label:'办公整理用品 · 历史交易示例 EX-HIST-002（合成数据）',values:{aName:'龙南逸泰源跨境电商有限公司',aCode:'91360727DEMO00001',aAddress:'江西省赣州市龙南市示范路88号',aContact:'林女士',aPhone:'13800000001',goods:'办公整理用品',spec:'金属网格材质；型号 DEMO-02',brand:'DEMO',vendorPN:'SUP-DEMO-02',customerPN:'CUS-DEMO-02',origin:'中国',quantity:'800',unit:'件',unitPrice:'12.00',totalValue:'9600',currency:'USD',packages:'80箱',netWeight:'320',grossWeight:'355',contractNo:'SALE-DEMO-002',invoiceNo:'INV-DEMO-002',packingNo:'PL-DEMO-002'}}
  ];
  const table=(head,rows)=>'<div class="demo-table-wrap"><table class="demo-table"><thead><tr>'+head.map(x=>'<th>'+escape(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(cell=>'<td>'+cell+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
  const chip=(text,tone='blue')=>'<span class="demo-chip '+tone+'">'+escape(text)+'</span>';
  const demoButton=(action,label,primary=false)=>'<button type="button" class="demo-button'+(primary?' primary':'')+'" data-demo-action="'+action+'">'+escape(label)+'</button>';
  const dataButton=(action,label,data,primary=false)=>'<button type="button" class="demo-button'+(primary?' primary':'')+'" data-demo-action="'+action+'" '+Object.entries(data).map(([key,value])=>'data-'+key+'="'+escape(value)+'"').join(' ')+'>'+escape(label)+'</button>';
  const dossierFields={
    A:[
      {key:'aName',label:'供应商法定名称',required:true},{key:'aCode',label:'统一社会信用代码 / 注册号',required:true},{key:'aAddress',label:'注册地址',required:true},{key:'aContact',label:'业务联系人',required:true},{key:'aPhone',label:'联系人电话',required:true},
      {key:'goods',label:'货物名称',required:true},{key:'spec',label:'规格 / 型号 / 材质',required:true},{key:'brand',label:'品牌'},{key:'vendorPN',label:'供应商料号'},{key:'customerPN',label:'客户料号'},
      {key:'hsSuggestion',label:'HS 编码建议（待F核验）',placeholder:'仅供关务复核，不作为已批准申报值'},
      {key:'origin',label:'原产地 / 原产国',required:true},{key:'productCertificate',label:'原产地证 / 产品证书（如适用）'},
      {key:'quantity',label:'数量',type:'number',required:true},{key:'unit',label:'计量单位',required:true},{key:'unitPrice',label:'单价',type:'number',required:true},{key:'totalValue',label:'货值 / 总金额',type:'number',required:true},{key:'currency',label:'币种',required:true},
      {key:'packages',label:'箱数 / 托盘数（可后补）'},{key:'netWeight',label:'净重（可后补）',type:'number'},{key:'grossWeight',label:'毛重（可后补）',type:'number'},
      {key:'contractNo',label:'销售合同 / 订单编号',required:true},{key:'invoiceNo',label:'商业发票编号',required:true},{key:'packingNo',label:'装箱单编号',required:true}
    ],
    B:[
      {key:'bName',label:'代理商法定名称',required:true},{key:'bCode',label:'统一社会信用代码 / 注册号',required:true},{key:'bContact',label:'业务联系人',required:true},{key:'bPhone',label:'联系人电话',required:true},
      {key:'bInstruction',label:'本笔代理业务指示 / 代理范围',required:true,wide:true},{key:'bCollection',label:'收款路径（描述，不等于银行核验）',required:true,wide:true},{key:'bPayment',label:'出款路径（描述，不等于账户批准）',required:true,wide:true},
      {key:'bCurrency',label:'预期收款币种',required:true},{key:'bMode',label:'付款分支',type:'select',required:true,options:['出口后付款','出口前预付款（待审批）']},
      {key:'serviceFeeAmount',label:'代理服务费（固定人民币 / 每笔）',type:'number',required:true,readonly:true},
      {key:'serviceFeePayer',label:'服务费承担方',required:true,readonly:true},
      {key:'serviceFeeMethod',label:'服务费结算方式',required:true,wide:true,readonly:true}
    ],
    C:[
      {key:'cName',label:'真实境外收货人法定名称',required:true},{key:'cCountry',label:'国家 / 地区',required:true},{key:'cCode',label:'注册号 / 主体识别信息',required:true},
      {key:'cAddress',label:'完整送货地址',required:true,wide:true},{key:'cContact',label:'收货联系人',required:true},{key:'cPhone',label:'联系电话',required:true},{key:'cDelivery',label:'送货指示 / 收货安排',required:true,wide:true}
    ],
    D:[
      {key:'dName',label:'付款方法定名称',required:true},{key:'dCountry',label:'国家 / 地区',required:true},{key:'dCode',label:'注册号 / 主体识别信息',required:true},
      {key:'dContact',label:'付款联系人',required:true},{key:'dPhone',label:'联系电话',required:true},{key:'dConfirm',label:'D向B付款确认（付款编号 / 金额 / 币种）',required:true,wide:true},
      {key:'dRelationship',label:'D与C之间的商业关系及付款原因',required:true,wide:true}
    ],
    E:[
      {key:'ePort',label:'出口口岸 / 口岸信息'},{key:'eMode',label:'运输方式'},{key:'eVehicle',label:'运输工具 / 车辆信息'},{key:'eRoute',label:'路线 / 计划'},{key:'eEta',label:'预计提货 / 出运时间',type:'date'}
    ],
    F:[
      {key:'fName',label:'报关服务商法定名称',required:true},{key:'fQualification',label:'资质编号 / 资质信息',required:true},{key:'fScope',label:'服务范围',required:true,wide:true},
      {key:'fContact',label:'服务联系人',required:true},{key:'fPhone',label:'联系电话',required:true},{key:'fEmail',label:'电子邮箱',required:true},{key:'fQuote',label:'报关报价 / 计价方式',required:true},{key:'fQuoteCurrency',label:'报价币种',required:true}
    ]
  };
  const fileExtension=name=>(String(name).match(/\.([^.]+)$/)||[])[1]?.toLowerCase()||'';
  const fileSize=size=>size<1024?size+' B':size<1024*1024?(size/1024).toFixed(1)+' KB':(size/1024/1024).toFixed(1)+' MB';
  const attachmentsFor=category=>dossier.attachments[category]||[];
  const findAttachment=id=>Object.values(dossier.attachments).flat().find(file=>file.id===id);
  function dossierPreview(file){
    if(!file||dossier.previewId!==file.id)return '';
    const source=file.url||file.path||'',extension=fileExtension(file.name),image=file.type?.startsWith('image/')||['png','jpg','jpeg','gif','webp'].includes(extension),pdf=file.type==='application/pdf'||extension==='pdf';
    let content;
    if(image)content='<img class="dossier-preview-image" src="'+escape(source)+'" alt="'+escape(file.name)+'">';
    else if(pdf)content='<iframe class="dossier-preview-frame" src="'+escape(source)+'" title="'+escape(file.name)+'" sandbox></iframe>';
    else if(file.previewing)content='<p class="dossier-preview-loading">正在本地读取文档内容…</p>';
    else if(file.previewError)content='<p class="dossier-preview-error" role="alert">预览失败：'+escape(file.previewError)+'。请下载原件后使用Office核对。</p>';
    else if(file.previewData?.sheets?.length){
      const sheets=file.previewData.sheets,index=Math.min(file.previewSheet||0,sheets.length-1),sheet=sheets[index],rows=sheet.rows.slice(0,80),truncated=sheet.rows.length>rows.length;
      content='<div class="dossier-preview-note">仅读取单元格值，不运行公式 / 宏；图像、签章及排版须核对原件。'+(sheet.limited||truncated?'预览已截断，需使用原件核对全文。':'')+'</div><div class="dossier-preview-tabs">'+sheets.map((item,tabIndex)=>dataButton('preview-sheet',item.name,{'file-id':file.id,'sheet-index':tabIndex})).join('')+'</div><div class="dossier-preview-table-wrap"><table class="dossier-preview-table"><tbody>'+rows.map(row=>'<tr>'+row.slice(0,20).map(cell=>'<td>'+escape(cell)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
    }else if(file.previewData?.text)content='<div class="dossier-preview-note">文本预览不包含签章、图片或完整排版；签署 / 盖章及正式内容须核对原件。</div><pre class="dossier-preview-text">'+escape(file.previewData.text.slice(0,30000))+(file.previewData.text.length>30000?'\n……预览截断，请打开原件查看全文。':'')+'</pre>';
    else content='<div class="dossier-preview-office"><strong>不支持该文件的页内预览</strong><p>可打开或下载原件，或选择PDF、图片、DOCX、XLSX、CSV格式。</p></div>';
    if(source)content+='<a class="dossier-preview-original" href="'+escape(source)+'" target="_blank" rel="noopener">在新标签页打开 / 下载原件</a>';
    return '<div class="dossier-preview" role="region" aria-label="材料预览"><div class="dossier-preview-head"><strong>预览 · '+escape(file.name)+'</strong>'+demoButton('close-preview','关闭预览')+'</div>'+content+'</div>';
  }
  async function loadAttachmentPreview(file){
    file.previewing=true;file.previewError='';file.previewData=null;renderDetail();
    try{
      if(file.file&&root.REVIEW_VENDOR?.officeText){
        file.previewData=await root.REVIEW_VENDOR.officeText(file.name,await file.file.arrayBuffer());
      }else if(file.previewKey){
        const cached=root.EXPORT_SOURCE_PREVIEWS?.[file.previewKey];
        if(!cached)throw new Error('未找到材料目录的本地预览数据');
        file.previewData={text:cached.text||'',sheets:cached.sheets||[],warnings:['材料目录预览快照；需核对原件']};
      }else if(fileExtension(file.name)==='csv'&&file.file){
        file.previewData={text:await file.file.text()};
      }else{
        throw new Error('Office预览依赖不可用；请下载原件核对');
      }
    }catch(error){
      file.previewError=error instanceof Error?error.message:String(error);
    }finally{
      file.previewing=false;
      if(dossier.previewId===file.id)renderDetail();
    }
  }
  function fileBundle(section){
    return '<div class="dossier-files"><div class="dossier-files-heading"><strong>本次材料</strong><small>选择材料目录中的范本 / 历史样例，或从本地文件夹上传本笔原件。当前离线原型不上传服务器。</small></div><div class="dossier-file-groups">'+section.requiredFiles.map((name,index)=>{
      const files=attachmentsFor(name),library=materialLibrary.filter(item=>item.category===name),inputId='dossier-upload-'+section.id+'-'+index;
      const librarySelect=library.length?'<div class="dossier-library-pick"><select aria-label="选择材料目录文件" data-library-selection="'+escape(name)+'"><option value="">从材料目录选择参考文件</option>'+library.map(item=>'<option value="'+escape(item.id)+'">'+escape(item.name+' · '+item.kind)+'</option>').join('')+'</select>'+demoButton('add-library-file','添加参考文件')+'</div>':'';
      const originalCount=files.filter(file=>file.source==='upload').length;
      return '<section class="dossier-file-category" data-file-category="'+escape(name)+'"><div class="dossier-file-category-head"><strong>'+escape(name)+'</strong>'+chip(originalCount?originalCount+'份原件':files.length?'仅有参考文件':'待补',originalCount?'green':'amber')+'</div><div class="dossier-upload-actions"><input class="dossier-file-input" id="'+inputId+'" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx,.csv" data-file-upload="'+escape(name)+'"><button type="button" class="demo-button" data-demo-action="select-upload" data-upload-id="'+inputId+'">选择本地文件上传</button>'+librarySelect+'</div>'+
        (files.length?'<ul class="dossier-attached-list">'+files.map(file=>'<li><div class="dossier-attached-file"><span><strong>'+escape(file.name)+'</strong><small>'+escape(file.sourceLabel)+(file.size?' · '+fileSize(file.size):'')+'</small></span><span class="dossier-file-actions">'+dataButton('preview-file','预览',{'file-id':file.id})+dataButton('remove-file','移除',{'file-id':file.id,category:name})+'</span></div>'+dossierPreview(file)+'</li>').join('')+'</ul>':'<p class="dossier-empty-file">尚未选择文件；本笔原件需从本地文件夹上传后再提交审核。材料目录中的模板 / 历史样例仅供参考。</p>')+'</section>';
    }).join('')+'</div></div>';
  }
  function historyQuickFill(){
    return '<div class="dossier-history-card"><div><strong>历史档案快速填空</strong><small>仅填入常用主体 / 商品字段，不复制历史附件；示例数据均为合成数据，填充后请逐项核对。</small></div><select aria-label="选择历史档案" data-history-selection><option value="">选择一条历史档案示例</option>'+historyRecords.map(record=>'<option value="'+record.id+'"'+(dossier.historySelection===record.id?' selected':'')+'>'+escape(record.label)+'</option>').join('')+'</select>'+demoButton('apply-history','应用到当前档案')+(dossier.historySelection?'<p role="status">历史档案已填入表单；原件和合同 / 发票 / 箱单编号未自动复用。</p>':'')+'</div>';
  }
  function customsImportCard(){
    return '<section class="dossier-customs-card"><div class="dossier-customs-head"><div><strong>关务子模块 · 出口单证字段映射</strong><small>基于材料目录出口文件清单核对发票 / 装箱单 / 合同 / 报关单字段；生成待确认商品草稿。</small></div>'+chip('演示映射 · 不申报','blue')+'</div>'+
      '<div class="dossier-customs-source"><div class="dossier-source-item"><small>字段定义</small><strong>Export Docs 出口单证字段清单</strong>'+dataButton('preview-customs-checklist','预览字段清单',{})+' <a href="'+escape(customsChecklist.path)+'" target="_blank" rel="noopener">打开材料原件</a></div><div class="dossier-source-item"><small>商品数据</small><strong>'+escape(customsRecordName)+'</strong></div>'+demoButton('read-customs-source','读取合成记录并预览映射')+'</div>'+dossierPreview(customsChecklist)+
      '<p class="dossier-source-note">字段定义依据本地清单（商品描述、规格、料号、数量 / 单位、单价 / 总值、原产地、箱数、净重 / 毛重及报关商品字段）；商品值来自关务模块合成演示记录。当前不解析用户上传的XLSX / OCR、不做HS归类或报关申报。</p>'+
      (dossier.customsPreview?'<div class="dossier-customs-preview"><strong>'+escape(customsRecordName)+' · 按Export Docs定义映射 · 待确认</strong><div class="dossier-mapping-grid">'+Object.entries(customsFieldLabels).map(([key,label])=>'<div><span>'+escape(label)+'</span><b>'+escape(dossier.customsValues[key]||'—')+'</b></div>').join('')+'</div><p>仅载入关务台账供查询核对，不认定HS编码或法定单位。</p>'+demoButton('catalog-load-demo','载入合成演示条目',true)+'</div>':'')+'</section>';
  }
  function dossierField(field){
    const value=escape(dossier.values[field.key]||'');
    const required=field.required?' <em>*</em>':'';
    const source=dossier.fieldSources[field.key]?'<small class="dossier-field-source">来源：'+escape(dossier.fieldSources[field.key])+'</small>':'';
    const control=field.type==='select'
      ?'<select data-dossier-field="'+field.key+'"'+(field.required?' required':'')+'>'+field.options.map(option=>'<option'+(option===value?' selected':'')+'>'+escape(option)+'</option>').join('')+'</select>'
      :'<input data-dossier-field="'+field.key+'" type="'+(field.type||'text')+'" value="'+value+'" placeholder="'+escape(field.placeholder||'请填写本笔真实信息')+'"'+(field.required?' required':'')+(field.readonly?' readonly':'')+'>';
    return '<label class="dossier-field'+(field.wide?' wide':'')+'"><span>'+escape(field.label)+required+'</span>'+control+source+'</label>';
  }
  function serviceFeeIssues(){
    return dossier.values.serviceFeeAmount!=='300'||dossier.values.serviceFeePayer!=='D'||!String(dossier.values.serviceFeeMethod||'').includes('D已核验可用余额')
      ?['服务费须为每笔人民币300元、由D承担并在首次获批分账时从可用余额结算']: [];
  }
  function dossierReview(){
    const requiredValues=Object.values(dossierFields).flat().filter(field=>field.required);
    const missingFields=requiredValues.filter(field=>!String(dossier.values[field.key]||'').trim()).map(field=>field.label).concat(serviceFeeIssues());
    const missingFiles=dossierSections.flatMap(section=>section.requiredFiles.filter(name=>!attachmentsFor(name).some(file=>file.source==='upload')));
    const linkedFiles=dossierSections.flatMap(section=>section.requiredFiles.flatMap(name=>attachmentsFor(name).map(file=>({category:name,file}))));
    const list=items=>items.length?'<ul>'+items.map(item=>'<li>'+escape(item)+'</li>').join('')+'</ul>':'<p>当前演示字段已填写；正式原件仍须按清单上传并由人工审核员核验。</p>';
    const linkedMaterials=linkedFiles.length?'<ul>'+linkedFiles.map(({category,file})=>'<li>'+escape(category+' · '+file.name+' · '+(file.source==='upload'?'本地选择，待人工核验':'目录参考 / 模板 / 历史样例'))+'</li>').join('')+'</ul>':'<p>尚未关联材料。请上传本次业务原件；目录参考文件不能满足审核要求。</p>';
    return '<div class="dossier-review"><div class="dossier-review-head"><div><small>建档终审 · 对照操作指引步骤1 / N01</small><h5>运营汇总与人工审核</h5></div>'+chip(dossier.approved?'建档已批准':dossier.submitted?'待人工终审':'待资料提交',dossier.approved?'green':'amber')+'</div>'+
      '<div class="dossier-review-grid"><section><strong>A—F主体及角色映射</strong><p>A供应商 → B境内代理 → C实际收货人 / D付款方 → E物流 → F报关代理</p><p>D与C关系须有解释及支持资料；F资质、联系人、报价和服务范围均需核验。</p></section><section><strong>规则检查边界</strong><p>本步骤只生成待审核资料与差异提示，不对接银行，不自动判定制裁 / AML通过，不代替人工终审。</p><p>E运输资料暂缺可继续建档；报关 / 物流前须补齐。</p></section><section class="dossier-linked-materials"><strong>已关联材料 ('+linkedFiles.length+') · 参考文件不计入原件</strong>'+linkedMaterials+'</section></div>'+
      '<div class="dossier-validation"><section><strong>待补字段 ('+missingFields.length+')</strong>'+list(missingFields)+'</section><section><strong>待补材料 ('+missingFiles.length+')</strong>'+list(missingFiles)+'</section></div>'+
      (dossier.message?'<p class="dossier-action-message" role="status">'+escape(dossier.message)+'</p>':'')+
      (dossier.submitted&&!dossier.approved?'<div class="dossier-approval"><span>演示审核角色：B指定的人工审核员（独立终审）</span>'+demoButton('approve-dossier','模拟人工审核通过并生成档案',true)+'</div>':'')+
      '<div class="demo-screen-footer"><span class="demo-screen-status">'+(dossier.approved?'演示交易档案已生成 · EX-D-2026-00128；当前没有写入服务器。':dossier.submitted?'已提交演示审核队列；通过前不生成正式交易单。':dossier.vpn?'VPN演示状态已通过；确认字段并提交建档审核。':'先完成VPN入口演示校验，再提交建档审核。')+'</span>'+
      (!dossier.submitted&&!dossier.approved?demoButton('submit-dossier','提交建档审核',true):'')+'</div></div>';
  }
  function addAttachment(category,file){
    const files=attachmentsFor(category);
    if(files.some(item=>item.name===file.name&&item.source===file.source&&item.path===file.path)){
      dossier.message='该材料已在清单中；如需替换，请先移除旧条目。';
      return;
    }
    files.push(file);dossier.attachments[category]=files;
  }
  function originalFilesMissing(){
    return dossierSections.flatMap(section=>section.requiredFiles.filter(name=>!attachmentsFor(name).some(file=>file.source==='upload')));
  }
  function invalidateDossierReview(){
    if(!dossier.submitted&&!dossier.approved)return false;
    dossier.submitted=false;dossier.approved=false;
    dossier.message='建档资料已变更，先前提交 / 审批状态已失效，需重新审核。';
    return true;
  }
  function refreshDossierReviewState(){
    const detail=$('capability-detail');
    const message=detail.querySelector('.dossier-action-message');
    if(message)message.textContent=dossier.message;
    const approval=detail.querySelector('.dossier-approval');
    if(approval)approval.remove();
    const submit=detail.querySelector('[data-demo-action="submit-dossier"]');
    const footer=detail.querySelector('.dossier-screen .demo-screen-footer');
    if(footer&&!submit)footer.insertAdjacentHTML('beforeend',demoButton('submit-dossier','重新提交建档审核',true));
    const status=detail.querySelector('.dossier-screen .demo-screen-status');
    if(status)status.textContent='资料已变更；请重新提交并完成B指定人工审核员终审。';
    const reviewChip=detail.querySelector('.dossier-review-head .demo-chip');
    if(reviewChip){reviewChip.className='demo-chip amber';reviewChip.textContent='待资料提交';}
    const headerChip=detail.querySelector('.demo-screen-head .demo-chip');
    if(headerChip){headerChip.className='demo-chip amber';headerChip.textContent='档案未提交';}
  }
  function dossierScreen(){
    const section=dossierSections.find(item=>item.id===dossier.section);
    const sectionContent=dossier.section==='OPS'?dossierReview():
      '<div class="dossier-section-heading"><div><strong>'+escape(section.title)+'</strong><p>'+escape(section.subtitle)+'</p></div>'+chip(section.id==='E'?'运输信息可暂缺':'填写资料','blue')+'</div>'+
      (section.id==='E'?'<label class="dossier-transport-toggle"><input type="checkbox" data-transport-missing'+(dossier.transportMissing?' checked':'')+'> 本步骤暂未取得运输信息，后续物流 / 报关节点补齐（不作为后续豁免）</label>':'')+
      (section.id==='A'?historyQuickFill():'')+
      '<div class="dossier-form-grid">'+dossierFields[section.id].map(dossierField).join('')+'</div>'+
      (section.requiredFiles.length?fileBundle(section):'')+
      (section.id==='D'?'<p class="dossier-source-note">当付款方与收货人不同，需记录商业关系及本笔付款对应依据；关系无法解释时停止后续付款与申报。</p>':'')+
      (section.id==='A'?'<p class="dossier-source-note">商业发票、装箱单及销售合同 / 订单须属于本次出口；正式最终版在后续备货节点更新并复核。</p>':'')+
      (section.id==='E'?'<p class="dossier-source-note">操作指引步骤1：向E取得口岸及运输工具信息，由A转交F。没有信息时可暂缺，但不得沿用暂缺状态通过后续物流 / 报关检查。</p>':'');
    return '<div class="dossier-usage-bar"><strong>网页工作台入口</strong><span>运营发起网页链接 / 二维码邀请 → A—F经VPN与身份校验填写资料 → 运营汇总 → 内部审核员终审。二维码及认证尚未接入。</span>'+demoButton('check-dossier-vpn',dossier.vpn?'VPN演示已通过':'模拟VPN授权')+'</div>'+
      '<div class="dossier-device-bar"><strong>页面预览</strong><div>'+demoButton('device-pc',dossier.device==='pc'?'PC视图 ✓':'PC视图')+demoButton('device-mobile',dossier.device==='mobile'?'移动端视图 ✓':'移动端视图')+'</div></div>'+
      '<div id="dossier-screen" class="demo-screen dossier-screen'+(dossier.device==='mobile'?' mobile-preview':'')+'">'+
      '<div class="demo-screen-head"><h4>新建交易档案</h4>'+chip(dossier.approved?'演示档案已生成':dossier.submitted?'待人工终审':'填写中',dossier.approved?'green':'amber')+'</div>'+
      '<div class="dossier-role-tabs" role="tablist" aria-label="交易档案资料责任方">'+dossierSections.map(item=>'<button type="button" role="tab" aria-selected="'+(dossier.section===item.id)+'" class="'+(dossier.section===item.id?'active':'')+'" data-dossier-section="'+item.id+'">'+escape(item.title)+'</button>').join('')+'<button type="button" role="tab" aria-selected="'+(dossier.section==='OPS')+'" class="'+(dossier.section==='OPS'?'active':'')+'" data-dossier-section="OPS">运营 · 汇总终审</button></div>'+
      '<div class="dossier-panel">'+sectionContent+'</div>'+
      (dossier.section!=='OPS'?'<div class="demo-screen-footer"><span class="demo-screen-status">资料及附件仅保留在当前页面；刷新即清除。</span>'+demoButton('dossier-next','下一资料责任方')+'</div>':'')+'</div>';
  }
  function customsCatalogScreen(){
    const entry=customsCatalog.tab==='entry';
    const filtered=customsCatalog.records.filter(record=>[record.id,...Object.values(record.values)].join(' ').toLowerCase().includes(customsCatalog.query.toLowerCase()));
    const rows=filtered.map(record=>[
      escape(record.id),escape(record.values.goods),escape(record.values.hsCode||'待核验'),
      escape(record.values.quantity+' '+record.values.unit),
      escape(record.values.legalUnit||'待核验')+' / '+escape(record.values.secondUnit||'未填写'),
      escape(record.source),chip(record.checked?'内部已核对（演示）':'待内部核对',record.checked?'green':'amber'),
      dataButton('catalog-detail','查看明细',{'record-id':record.id})+dataButton('catalog-edit','修改条目',{'record-id':record.id})+dataButton('catalog-fill-dossier','带入建档商品',{'record-id':record.id})+
      (customsCatalog.role==='reviewer'?dataButton('catalog-check','核对条目与单位',{'record-id':record.id}):'')
    ]);
    const detail=filtered.find(record=>record.id===customsCatalog.detailId);
    return '<div class="customs-catalog"><div class="dossier-role-tabs" role="tablist" aria-label="关务系统功能">'+
      '<button type="button" role="tab" aria-selected="'+entry+'" class="'+(entry?'active':'')+'" data-catalog-tab="entry">信息录入</button>'+
      '<button type="button" role="tab" aria-selected="'+!entry+'" class="'+(!entry?'active':'')+'" data-catalog-tab="query">信息查询</button></div>'+
      (entry?'<section class="customs-official-panel"><h4>官方平台对接</h4><p>目标：经企业授权获取可访问的报关单表头、商品明细、申报要素、法定单位、监管信息及回执；具体范围、接口及更新频率以官方授权为准。</p><div class="customs-official-links"><a href="https://www.singlewindow.cn/" target="_blank" rel="noopener">中国国际贸易单一窗口 ↗</a><a href="https://online.customs.gov.cn/" target="_blank" rel="noopener">海关政务服务平台 ↗</a></div>'+chip('未配置授权 · 未获取官方数据','amber')+'<button type="button" class="demo-button" disabled>同步官方信息（待接入）</button><p>公开税则 / 单位参考与本企业申报数据分别管理；不承诺获取所有企业或未授权数据。下方演示记录不属于官方返回结果。</p></section>'+
      customsImportCard()+
      '<section class="customs-entry-panel"><h4>'+(customsCatalog.editId?'修改条目 · '+escape(customsCatalog.editId):'人工录入货品条目')+'</h4>'+(customsCatalog.editId?demoButton('catalog-new','取消修改 / 新建条目'):'')+'<form id="customs-catalog-form"><div class="dossier-form-grid">'+customsCatalogFields.map(field=>'<label class="dossier-field"><span>'+escape(field.label)+(field.required?' <em>*</em>':'')+'</span><input name="'+field.key+'" data-catalog-field="'+field.key+'" value="'+escape(customsCatalog.draft[field.key]||'')+'" type="'+(field.type||'text')+'"'+(field.type==='number'?' min="0" step="any"':'')+(field.required?' required':'')+'></label>').join('')+'</div><div class="demo-screen-footer"><span>保存为待核对条目，不代表已申报或官方归类。</span><button type="submit" class="demo-button primary">保存货品条目</button></div></form></section>':
      '<section class="customs-query-panel"><div class="customs-query-controls"><label>查看身份（演示）<select data-catalog-role><option value="A"'+(customsCatalog.role==='A'?' selected':'')+'>A · 供应商</option><option value="reviewer"'+(customsCatalog.role==='reviewer'?' selected':'')+'>内部审核人员</option></select></label><label>查询条目 / 编码 / 单位<input type="search" data-catalog-query value="'+escape(customsCatalog.query)+'" placeholder="输入名称、编码或单位"></label>'+demoButton('catalog-search','查询')+'</div><p>A可查看授权条目及明细；内部审核人员可核对条目、成交 / 法定单位及来源依据。身份切换仅演示，生产权限须服务端控制。</p>'+
      table(['条目编号','货品','商品编码','成交数量 / 单位','第一 / 第二法定单位','来源','核对状态','操作'],rows)+
      (!rows.length?'<p role="status">'+(customsCatalog.records.length?'没有符合条件的条目。':'尚无货品条目；请先人工录入，或在信息录入页载入合成演示记录。')+'</p>':'')+
      (detail?'<section class="customs-record-detail"><h4>'+escape(detail.id)+' · 货品明细</h4><dl>'+customsCatalogFields.map(field=>'<div><dt>'+escape(field.label)+'</dt><dd>'+escape(detail.values[field.key]||'未填写')+'</dd></div>').join('')+'</dl></section>':'')+'</section>')+
      (customsCatalog.message?'<p class="dossier-action-message" role="status">'+escape(customsCatalog.message)+'</p>':'')+'</div>';
  }
  function fundsAccountDiagram(){
    return `<figure class="funds-account-figure" aria-labelledby="funds-account-heading">
      <div class="funds-design-section-head"><div><small>ACCOUNT VIEW / FUNDS MAP</small><h3 id="funds-account-heading">先看资金去向 · 账户 × CIPS × 供货商</h3></div><span class="demo-chip blue">D承担服务费 · 首次获批分账时结算 · 本场景不含退款</span></div>
      <div class="funds-account-legend"><span class="cash">实线：资金流转 / 余额转换</span><span class="info">蓝色虚线：材料信息提交</span></div>
      <div class="funds-account-scroll" tabindex="0" role="region" aria-label="账户资金路径图，小屏可横向滚动">
        <svg class="funds-account-svg" viewBox="0 0 1280 650" role="img" aria-labelledby="funds-account-svg-title funds-account-svg-desc">
          <title id="funds-account-svg-title">D货款经贸易核验进入可用余额；首次获批分账时从D可用余额结算固定300元服务费，再按合同向A付款</title>
          <desc id="funds-account-svg-desc">不按实收本金比例抽佣。每笔交易固定300元服务费由D承担，在首次获批分账时从D已核验可用余额一次性结算；该事件不减少A合同应付。银行及中转费用按实际凭证单列。</desc>
          <defs>
            <marker id="funds-cash-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#7c91a9"/></marker>
            <marker id="funds-available-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#329475"/></marker>
            <marker id="funds-info-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#5085c5"/></marker>
          </defs>
          <rect class="account-group" x="440" y="155" width="505" height="420" rx="18"/>
          <text class="account-heading" x="465" y="190">B · 贸易收款账户与内部资金分类</text>
          <text class="account-caption" x="465" y="212">D货款实收与服务费分账结算分别记账</text>
          <rect class="account-party" x="20" y="240" width="160" height="130" rx="12"/>
          <text class="account-heading" x="100" y="279" text-anchor="middle">D · 付款方</text>
          <text class="account-copy" x="100" y="307" text-anchor="middle">汇总多笔单据</text>
          <text class="account-caption" x="100" y="335" text-anchor="middle">原付款银行账户</text>
          <rect class="account-cips" x="240" y="240" width="155" height="130" rx="12"/>
          <text class="account-heading" x="317" y="279" text-anchor="middle">CIPS</text>
          <text class="account-copy" x="317" y="307" text-anchor="middle">人民币跨境支付清算</text>
          <text class="account-caption" x="317" y="335" text-anchor="middle">经授权银行渠道</text>
          <rect class="account-unavailable" x="465" y="245" width="185" height="125" rx="12"/>
          <text class="account-heading" x="557" y="280" text-anchor="middle">CNH不可用余额</text>
          <text class="account-copy" x="557" y="307" text-anchor="middle">待核验 + 未匹配</text>
          <text class="account-caption" x="557" y="335" text-anchor="middle">先核验贸易及银行可用状态</text>
          <rect class="account-available" x="735" y="245" width="185" height="125" rx="12"/>
          <text class="account-heading" x="827" y="280" text-anchor="middle">国内人民币可用余额</text>
          <text class="account-copy" x="827" y="307" text-anchor="middle">仅释放核验成功额度</text>
          <text class="account-caption" x="827" y="335" text-anchor="middle">分账前余额须达到300元</text>
          <rect class="account-party" x="1035" y="240" width="220" height="130" rx="12"/>
          <text class="account-heading" x="1145" y="279" text-anchor="middle">A · 供货商</text>
          <text class="account-copy" x="1145" y="307" text-anchor="middle">经独立核验的人民币账户</text>
          <text class="account-caption" x="1145" y="335" text-anchor="middle">实际到账后确认收款</text>
          <path class="account-cash-path" d="M180 290H240" marker-end="url(#funds-cash-arrow)"/>
          <text class="account-edge" x="210" y="225" text-anchor="middle">① 汇总付款</text>
          <path class="account-cash-path" d="M395 290H465" marker-end="url(#funds-cash-arrow)"/>
          <text class="account-edge" x="430" y="395" text-anchor="middle">② 入账CNH不可用</text>
          <path class="account-success-path" d="M650 290H735" marker-end="url(#funds-available-arrow)"/>
          <text class="account-edge account-success-label" x="692" y="235" text-anchor="middle">④ 贸易核验入账成功</text>
          <text class="account-caption" x="692" y="320" text-anchor="middle">仅核验贸易货款</text>
          <path class="account-success-path" d="M920 290H1035" marker-end="url(#funds-available-arrow)"/>
          <text class="account-edge account-success-label" x="977" y="225" text-anchor="middle">⑤ 按批准结算额向A付款</text>
          <text class="account-caption" x="1005" y="402" text-anchor="middle">A账户独立核验 · 实际到账后确认</text>
          <text class="account-caption" x="1005" y="425" text-anchor="middle">V1不垫资 · 实际可用货款足额才放行</text>
          <rect class="account-service" x="735" y="450" width="185" height="110" rx="12"/>
          <text class="account-heading" x="827" y="479" text-anchor="middle">B · 服务费收入科目</text>
          <text class="account-copy" x="827" y="505" text-anchor="middle">D承担 · 固定CNY 300</text>
          <text class="account-caption" x="827" y="535" text-anchor="middle">首次获批分账时内部转列</text>
          <path class="account-success-path" d="M827 370V450" marker-end="url(#funds-available-arrow)"/>
          <text class="account-edge account-success-label" x="827" y="417" text-anchor="middle">分账时一次性结算</text>
          <path class="account-info-path" d="M465 260H420V95H317V240" marker-end="url(#funds-info-arrow)"/>
          <text class="account-info-label" x="440" y="45" text-anchor="middle">③ 按备注关联交易档案ID → 生成INVOICE → 人工审批</text>
          <text class="account-info-label" x="440" y="70" text-anchor="middle">向收款银行提交贸易材料，核验后确认入账；CIPS仅为支付清算链路</text>
          <rect class="account-failure" x="465" y="590" width="480" height="47" rx="8"/>
          <text class="account-failure-label" x="705" y="610" text-anchor="middle">未核验、未授权或余额不足 → 不执行服务费分账</text>
          <text class="account-caption" x="705" y="628" text-anchor="middle">A合同应付仍按合同核算，不以服务费扣减</text>
        </svg>
      </div>
      <figcaption>D汇款通过贸易核验并确认可用后，首次获批分账时由D承担固定人民币300元服务费，从可用余额一次性结算；余款按合同及批准金额向A付款。服务费事件不降低A合同应付；银行及中转费用按实际凭证单列并依合同承担。本地原型不执行真实银行收付。</figcaption>
    </figure>`;
  }
  function fundsInformationDesign(){
    return '<section class="funds-design-section funds-information" id="funds-information-v1"><div class="funds-design-section-head"><div><h3>信息流</h3></div></div>'+
      table(['资金事件 / 节点','唯一关联与关键字段','流水文件 / 执行凭据','发票 / 合同 / 业务材料','逐笔对账方式 / 差异处置'],[
        ['① D汇款入B · N11','receipt_id；银行交易号、价值日、D原付款账户、B收款账户、币种、银行实际入账本金及原始备注；银行交易号与账户/币种共同去重','银行正式流水、入账通知、原始支付报文及水单；付款截图不替代银行实收凭证','贸易合同/订单、代理协议与收款授权；D≠C时补付款关系依据','实际入账全额登记CNH不可用余额；银行及中转费按实际凭证单列，不按实收本金计提比例费用'],
        ['② 水单拆分 / 档案匹配 · N11–N12','allocation_id → receipt_id + trade_id + batch_id；仅记录货款毛额分配；一笔来款可关联多笔贸易单','原水单、D分单清单、分配版本及差异台账','贸易货款绑定有效合同、付款关系和批准的交易档案；服务费待可用确认后再结算','实收本金 = 已关联货款 + 未匹配差额；未匹配金额继续受限，不得转收入或可付款余额'],
        ['④ 贸易核验入账 · N13','trade_verification_id → 申报编号 + INVOICE版本 + allocation_id；记录货款核验依据、核验金额、国内RMB实际入账及可用确认','银行核验结果、实际RMB入账及可用凭证；内部释放不虚构银行扣账','货款按真实贸易合同、INVOICE、水单及付款关系核验；此节点不扣服务费','仅银行核验成功且确认国内RMB实际入账/可用后释放对应货款；未匹配或未通过部分继续受限，服务费留待获批分账时处理'],
        ['⑤ 货款分账与A付款 · N14–N17','payment_id → settlement_id + trade_id + 批准版本；关联A合同应付、已付、D可用余额及累计分账','批准结算单、D服务费结算事件、银行付款回单及A到账确认分别留存','D收费授权、来源分配、A账户核验及适用出运 / 放行证据；银行费凭实际凭证另列','首次获批分账时从D可用余额一次性结算300元；A合同应付仍按合同核算，不以服务费作A应付扣项'],
        ['⑥ 代理服务费分账结算 · N14','service_fee_id → trade_id + allocation_id；固定人民币300元/交易；payer_role=D；trade_id + agency_service_fee唯一','内部结算事件、D已核验可用余额、批准分账和对应凭证；不伪造独立银行扣款','正式收费依据及D授权；INVOICE申报、补件、改版和重复命令不触发或重复收费','首次获批分账时从D可用余额转列B服务费；至少300元可用且授权齐备才结算，不降低A合同应付']
      ])+'</section>';
  }
  function fundsDesign(){
    return '<div class="funds-design">'+
      '<div class="funds-version-bar" aria-label="资金流设计版本"><span class="funds-version-current"><b>V1 · 当前设计 / D承担分账时结算服务费</b><small>D来款 → CNH不可用 → 国内RMB可用 → 首次获批分账结算300元后按合同向A付款</small></span><span class="funds-version-reserved"><b>V2 · 支持B垫资链路</b><small>获批授信/自有资金 → 先行付A → D回款核验入账 → 按协议核销垫资并清偿；方案说明，未接入执行</small></span></div>'+
      fundsAccountDiagram()+
      fundsInformationDesign()+'</div>';
  }
  function agreementsPrototype(){
    return '<div class="demo-screen process-prototype"><div class="demo-screen-head"><div><small>02 / N02—N04 · 协议与授权</small><h4>本笔交易协议清单</h4></div>'+chip('签署 / 授权均待本笔原件','amber')+'</div>'+
      '<div class="prototype-notice">材料目录只用于识别模板与核对风险；所有示例 / 流程图均不算本笔已签协议。服务商名称、签约主体或收款信息不一致时暂停。</div>'+
      '<div class="prototype-cards">'+
      '<article><header><strong>附件1 · A—B出口代理合同</strong>'+chip('候选模板 · M06','blue')+'</header><p>核对法定主体、代理范围、固定服务费及承担方、付款时点、结算汇率、账户与签章 / 生效日。</p><small>Review重点：现有模板收费及扣款条款与当前设计不一致，须正式修订；“收汇后2个工作日付款”须与本笔预付 / 出口后门禁、贸易核验入账及银行费用条款统一。</small><a href="../材料/步骤2-出口货物贸易代理合同(10.16).docx" target="_blank" rel="noopener">打开 M06 候选合同</a></article>'+
      '<article><header><strong>国际物流服务合同 · A—E</strong>'+chip('主体待核 · M07','amber')+'</header><p>核对E身份、联系人、报价、提货 / 运输 / 签收 / 货损责任及服务范围。</p><small>现有合同甲方为B，不可直接视为A—E已签合同；先确认委托链或补有效三方 / 转委托约定。E不承担F的中国出口报关。</small><a href="../材料/步骤2-国际物流服务合同-龙南逸泰源&国际运输合同(1).doc" target="_blank" rel="noopener">打开 M07 物流合同</a></article>'+
      '<article><header><strong>附件4 · A—F报关服务合同</strong>'+chip('缺正式正文','red')+'</header><p>补双方主体、报关服务范围、报价、责任、单证交付、更正约定及签署 / 生效记录。</p><small>M05仅为业务流程图，不是合同正文；需本笔已签合同。预付款前还须B书面认可与A实际委任同一F。</small><a href="../材料/代理出口业务四流流程图-简体中文-附件4.pdf" target="_blank" rel="noopener">查看 M05 流程图参考</a></article>'+
      '<article><header><strong>报关电子委托 / 授权</strong>'+chip('本笔待补','amber')+'</header><p>记录授权主体、F、货物 / 批次、范围、有效期及撤销状态。</p><small>正式申报前必须有效；授权范围或批次变更需重新核验。</small><span class="prototype-source">目录未见本笔有效电子委托</span></article></div>'+
      '<div class="prototype-stepper"><span class="done">主体与交易绑定</span><i>→</i><span class="'+(demo.reviewStarted?'done':'current')+'">条款 Review</span><i>→</i><span>法务 / 财务审批</span><i>→</i><span>签署归档</span></div>'+
      '<div class="demo-screen-footer"><span class="demo-screen-status">'+(demo.reviewStarted?'已创建本地演示Review任务；签署及授权仍待本笔原件':'待Review · 未签署协议不开放服务 / 付款放行')+'</span>'+demoButton('start-review',demo.reviewStarted?'Review任务已发起':'发起协议Review',true)+'</div></div>';
  }
  function logisticsPrototype(){
    return '<div class="demo-screen process-prototype"><div class="demo-screen-head"><div><small>03 / N05—N06 · A备货 / E安排物流</small><h4>货物与运输批次 · LOT-01</h4></div>'+chip(demo.logisticsChecked?'核对清单已生成':'待本笔资料核对',demo.logisticsChecked?'blue':'amber')+'</div>'+
      '<div class="prototype-notice">演示字段为合成数据；最终发票、箱单及实货须逐项一致。历史工作簿不是本笔原件，出运 / 报关前须上传并人工核验正式文件。</div>'+
      '<div class="prototype-form-grid"><section><header><strong>A · 最终货物与出口单证</strong>'+chip('N05','blue')+'</header><label>货物名称<input value="家居收纳用品 · 合成示例"></label><div class="prototype-input-row"><label>数量 / 单位<input value="1200 件"></label><label>币种 / 总金额<input value="USD 10,200"></label></div><div class="prototype-input-row"><label>箱数 / 托盘<input value="120 箱 / 待核"></label><label>净重 / 毛重<input value="210 / 235 kg · 示例"></label></div><label>原产地 / 产品证书<input value="中国 · 按适用性补正式证明"></label><label>提货 → 送货 / 收货方<input value="待A填写本笔地址与C收货信息"></label></section>'+
      '<section><header><strong>E · 订舱与运输计划</strong>'+chip('N06','blue')+'</header><label>运输编号 / 路线 / 口岸<input value="待E提供本笔计划"></label><div class="prototype-input-row"><label>运输工具 / ETA<input value="待确认"></label><label>提货时间 / 联系人<input value="待确认"></label></div><label>包装 / 集装箱状况<input value="提货交接时记录并附证据"></label><label>跟踪 / 签收 / 异常<input value="运输跟踪；签收或货损 / 拒收报告"></label></section></div>'+
      '<div class="prototype-materials"><strong>材料对照</strong><span><b>M13</b> 商业发票模板 · 非本笔发票</span><span><b>E01 / E02</b> 历史发票 / 箱单 · 仅字段参考</span><span><b>T01 / T03</b> 填报说明</span><span><b>M07</b> 物流合同 · 先核A—E委托链</span><a href="../材料/按Sheet拆分/步骤1及3-出口商业发票-历史例子.xlsx" target="_blank" rel="noopener">查看E01历史样例</a><a href="../材料/按Sheet拆分/步骤1及3-出口装箱单-历史例子.xlsx" target="_blank" rel="noopener">查看E02历史样例</a></div>'+
      '<div class="prototype-checks"><strong>出运前一致性</strong><span>'+chip('交易方 / 收货方','amber')+'合同、发票、箱单与A / C / D主体一致</span><span>'+chip('货物 / 金额','amber')+'品名、规格、数量、单价、金额、币种一致</span><span>'+chip('包装 / 重量','amber')+'箱 / 托盘、净重 / 毛重与实货一致</span><span>'+chip('物流 / 职责','amber')+'路线、口岸、批次可追踪；E不办理出口报关</span></div>'+
      '<div class="demo-screen-footer"><span class="demo-screen-status">'+(demo.logisticsChecked?'已生成演示核对清单；不是实货验收 / 出运批准':'单证或运输字段仍待本笔资料与人工核验')+'</span>'+demoButton('check-logistics','生成一致性核对清单',true)+'</div></div>';
  }
  function customsPrototype(){
    return '<div class="demo-screen process-prototype"><div class="demo-screen-head"><div><small>04 / N04、N07—N09 · 授权 → 草稿 → 确认 → 正式申报</small><h4>双抬头出口报关协同 · LOT-01</h4></div>'+chip(demo.customsConfirmed?'演示确认记录 · 非正式授权':'待A书面确认',demo.customsConfirmed?'blue':'amber')+'</div>'+
      '<div class="prototype-notice warning">本地原型不连接单一窗口、海关或电子委托平台。下方按钮仅切换演示状态，不能构成真实授权、A签批或正式申报。</div>'+
      '<div class="prototype-parties"><div><small>生产 / 供应商</small><strong>A</strong><span>中国供应商 / 生产单位</span></div><b>＋</b><div><small>境内发货人</small><strong>B</strong><span>报关单必须列明B</span></div><b>→</b><div><small>出口代理</small><strong>F</strong><span>核稿并经正式渠道申报</span></div><b>→</b><div><small>境外收货人</small><strong>C</strong><span>按实际资料填写</span></div></div>'+
      '<div class="prototype-stepper"><span class="done">有效委托 / 授权</span><i>→</i><span class="done">单证 + 物流齐备</span><i>→</i><span class="'+(demo.customsConfirmed?'done':'current')+'">A确认最终草稿 V1</span><i>→</i><span>F正式申报</span><i>→</i><span>回填附件2 / 受理 / 放行</span></div>'+
      table(['检查项','要求 / 证据','当前原型状态'],[['委任F','附件4已签合同 + 有效电子委托；预付款须B认可同一F','待本笔原件'],['草稿版本','F送审版本、货物 / 物流字段及差异清单','V1 · 合成示意'],['A书面确认','确认人、时间、载体与最终版本绑定；改版重新确认','待正式确认'],['申报 / 交付','正式附件2、受理与出口放行证明；B接收留痕','未申报 / 待正式证据']])+
      '<div class="prototype-materials"><strong>材料对照</strong><span><b>M11</b> 双抬头报关历史样例 · 不可复制为本笔申报件</span><span><b>E04</b> 报关草单历史快照</span><span><b>R03 / R05—R07</b> 授权、A确认、附件2及放行凭证待补</span><a href="../材料/步骤4-双抬头报关-出口双抬头.pdf（新疆）.pdf" target="_blank" rel="noopener">查看M11核对样例</a></div>'+
      '<div class="prototype-gate"><strong>付款硬门禁</strong><p>出口后付款前：确认已申报报关单列B为境内发货人，B已收到正式附件2，并有出口放行证明。任一缺失或不一致 → ON HOLD。</p></div>'+
      '<div class="demo-screen-footer"><span class="demo-screen-status">'+(demo.customsConfirmed?'演示态已记录；仍禁止正式申报与出口后付款':'未绑定A真实授权签批；正式申报尚未发生')+'</span>'+demoButton('confirm-customs',demo.customsConfirmed?'撤销演示确认状态':'模拟记录A确认V1')+'</div></div>';
  }
  function settlementPrototype(){
    return '<div class="demo-screen process-prototype"><div class="demo-screen-head"><div><small>05 / N11—N17 · 开票 → CNH入账 → 结算 → 付款</small><h4>付款发票与净额结算 · 合成数据</h4></div>'+chip('实际银行 / 付款未接入','blue')+'</div>'+
      '<div class="prototype-notice warning">1:1仅为操作指引所述的待核条件。须将本笔最新、带日期的银行书面报价归档，并确认无滑点、无溢价；已过期或条件不同即暂停。勾选仅表示原型状态，不验证银行文件。</div>'+
      '<div class="prototype-payment-flow"><span>B向D开具货物INVOICE</span><i>→</i><span>D付CNH</span><i>→</i><span>B核实银行入账</span><i>→</i><span>结算审批</span><i>→</i><span>B向A付人民币</span></div>'+
      '<div class="prototype-finance-grid"><section><header><strong>本笔入账 / 结算输入</strong>'+chip('按付款编号关联','blue')+'</header><label>交易号 / 批次<input value="DEMO-EX-001 / LOT-01"></label><label>B向D发票 / 付款编号<input value="待生成本笔货物INVOICE"></label><div class="prototype-input-row"><label>银行实际入账 (CNH)<input type="number" min="0" step="0.01" data-calc="foreign" value="10000"></label><input type="hidden" data-calc="rate" value="1"></div><label>银行金额确认日期<input type="date" data-quote-date></label><label class="prototype-checkbox"><input type="checkbox" data-quote-confirmed'+(demo.quoteArchived?' checked':'')+'> 我已归档并核对银行入账金额及可用凭证（仅演示状态）</label><div class="prototype-input-row"><label>银行 / 中转实际费用 (RMB)<input type="number" min="0" step="0.01" data-calc="fee" value="80"></label><label>其他已批准扣款 (RMB)<input type="number" min="0" step="0.01" data-calc="other" value="0"></label></div><div class="prototype-input-row"><label>已付定金 / 预付款 (RMB)<input type="number" min="0" step="0.01" data-calc="deposit" value="2000"></label><label>代理服务费 (CNY)<input type="text" value="300 / D承担，首次获批分账时从可用余额结算" readonly></label></div><label>结算分支<select data-calc="timing"><option>出口后付款</option><option>预付款</option></select></label></section>'+
      '<section><header><strong>审批与放行门禁</strong>'+chip('未放行','amber')+'</header>'+table(['控制','状态'],[['CNH与本笔INVOICE / D / 付款号匹配',chip('待核实','amber')],['B银行实际入账及贸易核验入账结果',chip('待银行凭证','amber')],['银行人民币入账金额确认',chip(demo.quoteArchived?'原型已勾选 · 未验真':'待归档核验','amber')],['费用、定金、累计应付 / 不超付',chip('待复核','amber')],['A人民币账户独立核验 / 付款回执 / 到账确认',chip('待核验','amber')]])+'<div class="prototype-gate"><strong>出口后付款</strong><p>额外核验B为境内发货人、B已收正式附件2及出口放行证据。预付款须协议 / F委任 / 适用垫资审批全部通过。</p></div></section></div>'+
      '<div class="demo-calculator"><div class="demo-calculator-title"><strong>D可用于A付款的余额上限</strong><span>贸易核验入账成功后：D可用余额 − 固定服务费300元 − 银行实际费用 − 其他扣款 − 已付定金；A合同应付仍独立按合同核算</span></div><div class="demo-calc-result"><span>可用资金上限</span><strong id="settlement-result">'+(demo.settlementInputs?'待重新试算':'CNY 7,620.00')+'</strong><small id="settlement-timing">'+(demo.settlementInputs?'参数已保存 · 请重新试算':'合成示例 · 报价 / 入账 / 门禁未验证')+'</small></div><div class="demo-screen-footer"><span class="demo-screen-status">'+(demo.settlement?(demo.settlementDirty?'输入已变更；请重新试算后再复核':'演示试算已更新；须人工核验所有正式凭证'):demo.settlementInputs?'参数已保存；请重新试算，不能作为结算依据':'仅为可用资金上限试算，不构成A应付款或付款批准')+'</span>'+demoButton('preview-settlement','计算资金上限',true)+'<button type="button" class="demo-button" disabled>付款放行（未接入）</button></div></div>'+
      '<div class="prototype-materials"><strong>材料对照</strong><span><b>M14</b> 历史陆运费发票，非货物付款发票</span><span><b>M15</b> 人民币付款报文样例，非银行成功回执</span><span><b>M16 / M17</b> B账户参考，非A收款账户核验</span><span><b>R08—R11</b> 银行报价、结算、付款与到账证据按本笔补齐</span><a href="../材料/步骤5-付款发票INVOICE,SZ26101401(2).pdf" target="_blank" rel="noopener">查看M14样例</a><a href="../材料/步骤5-CIPS系统贷记转账报文TFLS00032_SWIFT_CNY_5 000,00(3).pdf" target="_blank" rel="noopener">查看M15样例</a></div></div>';
  }
  function demoScreen(){
    if(selected==='sales')return dossierScreen();
    if(selected==='contracts')return agreementsPrototype();
    if(selected==='logistics')return logisticsPrototype();
    if(selected==='customs')return customsPrototype();
    if(selected==='funds')return settlementPrototype();
    if(selected==='compliance')return '<div class="demo-screen process-prototype"><div class="demo-screen-head"><div><small>07 / DEMO-EX-001 · LOT-01</small><h4>四流核验与退税跟踪</h4></div>'+chip('待补证 · 禁止结案','amber')+'</div>'+
      table(['工作节点','当前状态','责任方 / 下一步'],[['主体 / 委托链','待本笔有效协议','B运营 / 法务 · 补齐签章与授权'],['货物 / 单证','待最终版本一致性核验','A提供 · E物流 · B协调'],['报关 / 放行','待正式附件2与出口放行证明','F回传 · B接收'],['资金 / 付款门禁','未放行（财务明细按独立权限查看）','B财务 · 核验凭证与分支条件'],['退税证明 / 结果','待申请与交接证据','B / F交接 · A办理适用退税']])+
      '<div class="prototype-gate"><strong>异常未闭环不得结案</strong><p>退税证明、四流一致性和适用放行凭证须逐项留证；模拟核验不构成合规批准或退税申报。</p></div>'+
      '<div class="demo-screen-footer"><span class="demo-screen-status">'+(demo.complianceChecked?'已生成本页演示差异清单；正式风险状态未解除':'待按责任方补齐本笔证据')+'</span>'+demoButton('check-compliance','生成四流差异清单',true)+'</div></div>';
    if(selected==='contracts')return '<div class="demo-screen"><div class="demo-screen-head"><div><small>02 / 合同中心 · 模板 / Review / 审批</small><h4>合同与审批进度</h4></div>'+chip(demo.reviewStarted?'Review 进行中':'待业务 Review',demo.reviewStarted?'amber':'blue')+'</div>'+table(['合同 / 交易','模板版本','Review / 审批','签署状态'],[['出口销售合同 · EX-D-00128','中英模板 V3.2','业务已提交 · 法务待审',chip('未签署','amber')],['代理出口合同 · EX-D-00126','代理模板 V2.4','法务通过 · 财务通过',chip('待双方签署','blue')],['物流服务合同 · EX-D-00120','物流模板 V1.8','已完成',chip('已归档','green')]])+'<div class="demo-approval-track"><span class="done">业务起草</span><i></i><span class="'+(demo.reviewStarted?'done':'current')+'">法务 Review</span><i></i><span>财务复核</span><i></i><span>授权审批</span><i></i><span>双方签署</span></div><div class="demo-screen-footer"><span class="demo-screen-status">'+(demo.reviewStarted?'已创建Review任务，等待法务处理':'版本差异、结算条款及账户信息纳入审阅')+'</span>'+demoButton('start-review',demo.reviewStarted?'Review 已发起':'发起合同 Review',true)+'</div></div>';
    if(selected==='accounts')return '<div class="demo-screen"><div class="demo-screen-head"><div><small>06 / 资金账户 · 按银行 / 主体 / 币种管理</small><h4>账户与银行连接</h4></div>'+chip('4 个演示账户组','blue')+'</div>'+table(['银行 / 主体','收款账户','付款账户','清算 / 中转','连接状态'],[['演示银行 A · B代理商','CNH / 尾号 0281','CNY / 尾号 1046','CNH收款及待贸易核验入账资金',chip('回单导入演示','amber')],['演示银行 B · B代理商','CNY / 尾号 7319','USD / 尾号 6420','在途清算 · 独立台账',chip('接口待接入','blue')],['B代理商 · 服务费科目','D可用余额内部分账','—','首次获批分账时结算300元',chip('待分账结算','amber')],['演示银行 A · A供应商','CNY / 尾号 5508','—','不适用',chip('仅作收款核验','green')]])+'<div class="demo-account-callout"><strong>账户与余额隔离</strong><span>D货款合并收款先记CNH不可用；贸易核验入账成功后登记国内人民币可用余额。首次获批分账时从D已核验可用余额一次性结算固定300元服务费，再按合同应付向A付款；服务费不降低A合同应付。</span></div><div class="demo-screen-footer"><span class="demo-screen-status">'+(demo.bankChecked?'本地连接检查完成；当前未连接任何真实银行':'支持授权 API / 主机直连 / 受控回单导入的接入设计')+'</span>'+demoButton('check-bank','演示连接检查')+'</div></div>';
    if(selected==='funds')return     '<div class="demo-screen"><div class="demo-screen-head"><div><small>04 / 资金运营 · CNH入账 → 银行贸易核验入账 → D服务费分账 → A货款结算</small><h4>收款与资金上限试算</h4></div>'+chip('待财务复核','amber')+'</div>'+table(['时间 / 交易','资金事件','金额','状态'],[['10-20 09:42 · EX-D-00128','CNH货款入账 · CNH不可用','CNH 100,000.00',chip('银行已入账','green')],['10-20 10:05 · EX-D-00128','银行贸易核验入账 · 银行核验入账待确认','CNY 100,000.00',chip('待审批','amber')],['10-20 10:06 · EX-D-00128','银行手续费 / 中转费','CNY 150.00',chip('费用待确认','amber')],['首次获批分账 · EX-D-00128','D可用余额服务费结算','CNY 300.00',chip('待余额核验','amber')]])+'<div class="demo-calculator"><div class="demo-calculator-title"><strong>D可用于A付款的余额上限</strong><span>人民币可用货款 − 固定服务费300元 − 银行实际费用 − 其他扣款 − 已付定金；A合同应付仍按合同核算</span></div><div class="demo-calc-fields"><label>货款金额 (CNH)<input type="number" min="0" step="0.01" data-calc="foreign" value="100000"></label><input type="hidden" data-calc="rate" value="1"><label>银行实际费用 (CNY)<input type="number" min="0" step="0.01" data-calc="fee" value="150"></label><label>已付定金 (CNY)<input type="number" min="0" step="0.01" data-calc="deposit" value="10000"></label><label>其他扣款 (CNY)<input type="number" min="0" step="0.01" data-calc="other" value="0"></label><label>结算时点<select data-calc="timing"><option>实时入账</option><option>T-1 预约结算</option><option>跨月结算</option></select></label></div><div class="demo-calc-result"><span>可用资金上限</span><strong id="settlement-result">CNY 89,550.00</strong><small id="settlement-timing">实时入账 · 待财务复核</small></div></div><div class="demo-screen-footer"><span class="demo-screen-status">'+(demo.settlement?'试算已更新；付款仍须银行回执、权限审批及余额校验':'货款入账、银行费用、服务费结算、定金与A合同应付分别记账；T-1 / 跨月按确认价值日归属')+'</span>'+demoButton('preview-settlement','更新资金上限',true)+'</div></div>';
    if(selected==='customs')return '<div class="demo-screen"><div class="demo-screen-head"><div><small>05 / 报关协同 · 草稿 → 确认 → 申报回执</small><h4>出口申报任务</h4></div>'+chip(demo.customsConfirmed?'A 已确认演示版本':'等待 A 确认','amber')+'</div>'+table(['交易 / 批次','申报主体 / 代理','草稿版本','关键校验','当前状态'],[['EX-D-2026-00128 / LOT-01','B · F代理','V3 · 10:21',chip('4 项一致','green'),chip(demo.customsConfirmed?'已确认演示版':'待 A 确认','amber')],['EX-D-2026-00126 / LOT-02','B · F代理','V2 · 10-19',chip('1 项待补','amber'),chip('缺物流资料','red')]])+'<div class="demo-customs-flow"><span class="done">销售单证锁版</span><i>→</i><span class="'+(demo.customsConfirmed?'done':'current')+'">A 书面确认摘要</span><i>→</i><span>授权 F 正式申报</span><i>→</i><span>回填受理 / 放行回执</span></div><div class="demo-screen-footer"><span class="demo-screen-status">'+(demo.customsConfirmed?'演示确认已绑定 V3；真实申报仍须由授权人员在正式渠道办理':'版本变更会撤销旧确认；草稿不能代替申报回执')+'</span>'+demoButton('confirm-customs',demo.customsConfirmed?'已确认演示版本':'模拟 A 确认此版本')+'</div></div>';
    return     '<div class="demo-screen"><div class="demo-screen-head"><div><small>06 / 合规与经营分析 · 四流核验</small><h4>交易风险与对账驾驶舱</h4></div>'+chip(demo.complianceChecked?'模拟核验已完成':'2 项待处理','amber')+'</div><div class="demo-risk-summary"><div><small>主体 / 关系</small><strong class="risk-ok">已核验</strong><span>付款方与收货人关系留痕</span></div><div><small>单证 / 版本</small><strong class="risk-ok">版本一致</strong><span>销售单与报关草稿 V3</span></div><div><small>资金 / 费用</small><strong class="risk-warn">待解释</strong><span>银行实际费用与D服务费结算、A合同应付待核对</span></div><div><small>退税 / 结果</small><strong class="risk-pending">待归档</strong><span>正式证明 / 处理结果</span></div></div>'+table(['核验规则','系统提示','负责人 / 下一步'],[['银行实收 ≠ 付款方凭证','以银行回单及CNH不可用 / 人民币可用状态为准','资金岗 · 等待回单'],['D服务费与A合同应付分开','固定300元由D承担，首次获批分账时从已核验可用余额结算；不减少A合同应付','财务岗 · 核验D授权及可用余额'],['报关放行与批次','附件2 / 放行证明待关联','报关岗 · 回填正式回执']])+'<div class="demo-screen-footer"><span class="demo-screen-status">'+(demo.complianceChecked?'已生成演示差异清单；不构成真实合规筛查或批准':'命中差异时暂停付款 / 结案，按角色派发补证任务')+'</span>'+demoButton('check-compliance','运行四流模拟核验',true)+'</div></div>';
  }
  function renderList(){
    const directory=selected==='directory',catalog=selected==='sales'&&salesPage==='customs-catalog';
    const scope=directory?'directory':selected==='operations'?'operations':catalog?'catalog':'dossier';
    $('operations-prototype').classList.toggle('work-directory-mode',directory);
    $('capability-navigation-heading').textContent=directory?'工作入口目录':catalog?'关务系统 · 可见页面':selected==='operations'?'内部运营 · 可见页面':'01 建档 · 可见页面';
    $('work-directory-return').hidden=directory;
    $('capability-list').replaceChildren();
    root.EXPORT_OPERATIONS.navigation(selected==='operations',scope);
    if(directory||selected==='operations')return;
    if(!root.EXPORT_OPERATIONS.canAccessEntry(scope)){
      $('capability-list').innerHTML='<p class="work-menu-empty">当前岗位无此工作区页面权限</p>';return;
    }
    $('capability-list').innerHTML=catalog?
      ['entry','query'].map((tab,index)=>'<button type="button" class="work-menu-item'+(customsCatalog.tab===tab?' active':'')+'" data-catalog-tab="'+tab+'" aria-current="'+(customsCatalog.tab===tab?'page':'false')+'">'+(index?'信息查询':'信息录入')+'</button>').join(''):
      '<button type="button" class="work-menu-item active" data-capability="sales" aria-current="page">建档资料填报 / 汇总</button>';
    if(catalog)$('ops-mobile-navigation').querySelector('select').value=customsCatalog.tab;
  }
  function renderDetail(){
    const detail=$('capability-detail');
    detail.classList.remove('work-detail-open');
    detail.classList.toggle('capability-preview-only',selected==='sales');
    if(selected==='directory'){
      detail.innerHTML='<header class="capability-entry-bar"><h3>工作入口目录</h3><p>展示当前所有工作入口；进入工作区后，仅显示当前岗位有权访问的页面。入口可见不代表已获业务权限。</p></header><div class="work-entry-cards">'+
        [['sales','01','建立交易档案','填报、汇总本笔交易主体、货品及材料。'],['catalog','关务','关务系统','录入及查询关务货品信息。'],['operations','02–07','内部运营工作台','按岗位查看授权业务页面与在途待办。']].map(([id,number,title,description])=>
          '<button type="button" class="work-entry-card" data-workspace="'+id+'"><span>'+number+'</span><strong>'+title+'</strong><small>'+description+'</small><b>进入工作区 →</b></button>').join('')+'</div>';return;
    }
    if(selected==='sales'){
      const catalog=salesPage==='customs-catalog';
      if(!catalog){
        detail.innerHTML='<header class="capability-entry-bar"><h3>A/D交易资料入口</h3><p>A首次提交创建同号交易；D独立提交本方资料。B在步骤一只读。旧“邀请A至F填报、终审后建单”流程已停用。</p></header><p><a class="primary-link" href="#product-workspace/A/supplier-submit">A首次提交与本方修改</a></p><p><a class="primary-link" href="#product-workspace/D/payer-submit">D付款资料首次提交与修改</a></p><p><a href="#product-workspace/B/supplier-submit">B只读查询及步骤二签约依据送审</a></p>';
        return;
      }
      if(!root.EXPORT_OPERATIONS.canAccessEntry(catalog?'catalog':'dossier')){
        detail.innerHTML='<section class="ops-empty" role="status"><h3>当前岗位无此工作区页面权限</h3><p>工作入口目录展示全部入口，但不授予业务访问权限。请切换已授权岗位，或返回工作入口目录。</p></section>';return;
      }
      if(catalog&&!root.EXPORT_OPERATIONS.canAccessEntry('review'))customsCatalog.role='A';
      detail.innerHTML='<header class="capability-entry-bar"><h3>'+(catalog?'关务系统':'建立交易档案入口')+'</h3><p>'+
        (catalog?'供授权人员录入货品、查询条目与单位；内部核对入口按当前岗位权限开放。':'供A供应商填写、B运营汇总主体、货品和本次材料；提交后在独立建档审核入口核验，不得自审。本地建档表单与合成审核队列分别演示，不自动生成真实交易。')+'</p></header>'+
        (catalog?customsCatalogScreen():dossierScreen());
      if(!root.EXPORT_OPERATIONS.canAccessEntry('dossier-approve'))detail.querySelector('[data-demo-action="approve-dossier"]')?.remove();
      if(catalog&&!root.EXPORT_OPERATIONS.canAccessEntry('review')){
        const selector=detail.querySelector('[data-catalog-role]');
        selector?.querySelector('option[value="reviewer"]')?.remove();
      }
      return;
    }
    root.EXPORT_OPERATIONS.render();
  }
  function captureSettlementDraft(){
    const inputs=[...$('capability-detail').querySelectorAll('[data-calc]')];
    if(!inputs.length)return;
    demo.settlementInputs=Object.fromEntries(inputs.map(input=>[input.dataset.calc,input.value]));
  }
  function resize(){
    if(!document.getElementById('view-capabilities')?.classList.contains('active'))return;
    $('capability-detail')?.scrollTo({top:0,behavior:'smooth'});
  }
  function initialize(){
    if(initialized)return;
    initialized=true;
    root.EXPORT_OPERATIONS.initialize(reason=>{if(reason!=='role-change')selected='operations';renderList();renderDetail();});
    renderList();renderDetail();
    $('funds-design-content').innerHTML=fundsDesign();
    $('view-capabilities').addEventListener('click',event=>{
      if(event.target.closest('[data-work-directory]')){selected='directory';renderList();renderDetail();return;}
      const entry=event.target.closest('[data-workspace]');
      if(entry){selected=entry.dataset.workspace==='catalog'?'sales':entry.dataset.workspace;salesPage=entry.dataset.workspace==='catalog'?'customs-catalog':'dossier';renderList();renderDetail();return;}
      const button=event.target.closest('[data-capability]');
      if(!button)return;
      selected=button.dataset.capability;
      if(selected==='sales')salesPage='dossier';renderList();renderDetail();
    });
    $('view-capabilities').addEventListener('change',event=>{
      if(!event.target.matches('[data-work-page]')||selected!=='sales')return;
      if(salesPage==='customs-catalog'&&root.EXPORT_OPERATIONS.canAccessEntry('catalog')){
        customsCatalog.tab=event.target.value;customsCatalog.message='';renderList();renderDetail();
      }
    });
    $('view-capabilities').addEventListener('submit',event=>{
      if(event.target.id!=='customs-catalog-form')return;
      event.preventDefault();
      const values=Object.fromEntries([...new FormData(event.target)].map(([key,value])=>[key,String(value).trim()]));
      if(!event.target.reportValidity())return;
      if(customsCatalogFields.some(field=>field.required&&!values[field.key])){
        customsCatalog.message='保存失败：必填字段不能只包含空格。';renderDetail();return;
      }
      const invalid=customsCatalogFields.filter(field=>field.type==='number'&&values[field.key]!==''&&(!Number.isFinite(Number(values[field.key]))||Number(values[field.key])<0));
      if(Number(values.quantity)<=0||invalid.length){
        customsCatalog.message='保存失败：成交数量须大于0，其他数量、金额和重量不得为负数。';renderDetail();return;
      }
      const existing=customsCatalog.records.find(record=>record.id===customsCatalog.editId);
      if(existing){existing.values={...existing.values,...values};existing.source='人工修订 · 待重新核验';existing.checked=false;}
      else customsCatalog.records.push({id:'CUS-MANUAL-'+String(customsCatalog.records.length+1).padStart(3,'0'),values,source:'人工录入 · 待核验',checked:false});
      customsCatalog.editId='';
      customsCatalog.draft={};customsCatalog.query='';customsCatalog.tab='query';customsCatalog.message='货品条目已保存至当前页面台账，等待内部核对；刷新后清除。';renderDetail();
    });
    $('view-capabilities').addEventListener('click',async event=>{
      if(selected!=='sales')return;
      const catalogTab=event.target.closest('[data-catalog-tab]');
      if(catalogTab){customsCatalog.tab=catalogTab.dataset.catalogTab;customsCatalog.message='';renderList();renderDetail();return;}
      const button=event.target.closest('[data-capability-node]');
      if(button){root.EXPORT_APP?.details(button.dataset.capabilityNode);return;}
      const section=event.target.closest('[data-dossier-section]');
      if(section){dossier.section=section.dataset.dossierSection;dossier.message='';renderDetail();return;}
      const actionButton=event.target.closest('[data-demo-action]');
      const action=actionButton?.dataset.demoAction;
      if(!action)return;
      if(action==='approve-dossier'&&!root.EXPORT_OPERATIONS.canAccessEntry('dossier-approve')){
        dossier.message='审核被拒绝：本岗位不能终审交易建档，请由独立内部审核人员处理。';renderDetail();return;
      }
      if(action==='catalog-new'){customsCatalog.editId='';customsCatalog.draft={};customsCatalog.message='';renderDetail();return;}
      if(action==='catalog-search'){renderDetail();return;}
      if(action==='catalog-load-demo'){
        if(!customsCatalog.records.some(record=>record.id==='EX-CUS-DEMO-001')){
          customsCatalog.records.push({id:'EX-CUS-DEMO-001',values:{...customsDemoValues,sourceReference:'合成演示记录 · Export Docs字段定义（非官方数据）'},source:'合成演示数据',checked:false});
        }
        customsCatalog.tab='query';customsCatalog.query='';customsCatalog.message='合成条目已载入；商品编码和法定单位仍待人工核验。';renderDetail();return;
      }
      if(['catalog-detail','catalog-edit','catalog-check','catalog-fill-dossier'].includes(action)){
        const record=customsCatalog.records.find(item=>item.id===actionButton.dataset.recordId);
        if(!record){customsCatalog.message='未找到货品条目，请重新查询。';renderDetail();return;}
        if(action==='catalog-detail')customsCatalog.detailId=record.id;
        if(action==='catalog-edit'){customsCatalog.editId=record.id;customsCatalog.draft={...record.values};customsCatalog.tab='entry';customsCatalog.message='正在修改 '+record.id+'；保存后须重新核对。';}
        if(action==='catalog-check'){
          if(customsCatalog.role!=='reviewer'||!root.EXPORT_OPERATIONS.canAccessEntry('review')){customsCatalog.message='仅有权内部审核角色可核对条目。';renderDetail();return;}
          if(!record.values.hsCode||!record.values.legalUnit){
            customsCatalog.message='核对未通过：商品编码或第一法定单位尚缺，请对照官方依据补充条目。';renderDetail();return;
          }
          record.checked=true;customsCatalog.message='条目及单位已标记内部核对（演示），不代表海关审核通过。';
        }
        if(action==='catalog-fill-dossier'){
          const keys=Object.keys(customsFieldLabels);
          keys.forEach(key=>{
            dossier.values[key]=record.values[key]||'';
            dossier.fieldSources[key]=record.source+' · '+record.id+'（待本笔复核）';
          });
          dossier.values.hsSuggestion=record.values.hsCode||'待F核验';
          dossier.fieldSources.hsSuggestion=record.source+' · '+record.id+'（待F核验）';
          invalidateDossierReview();salesPage='dossier';dossier.section='A';renderList();
        }
        renderDetail();return;
      }
      if(action==='entry-web'||action==='entry-qr'){dossier.entry=action==='entry-web'?'web':'qr';renderDetail();return;}
      if(action==='device-pc'||action==='device-mobile'){dossier.device=action==='device-mobile'?'mobile':'pc';renderDetail();return;}
      if(action==='check-dossier-vpn'){dossier.vpn=true;dossier.message='原型状态已切换；真实 VPN / 身份校验尚未接入。';renderDetail();return;}
      if(action==='dossier-next'){
        const sections=[...dossierSections.map(item=>item.id),'OPS'];
        dossier.section=sections[Math.min(sections.indexOf(dossier.section)+1,sections.length-1)];dossier.message='';renderDetail();return;
      }
      if(action==='select-upload'){
        $('capability-detail').querySelector('#'+CSS.escape(actionButton.dataset.uploadId))?.click();return;
      }
      if(action==='add-library-file'){
        const group=actionButton.closest('.dossier-file-category'),select=group?.querySelector('[data-library-selection]'),material=materialLibrary.find(item=>item.id===select?.value);
        if(!material){dossier.message='请先选择一份材料目录参考文件。';renderDetail();return;}
        addAttachment(material.category,{id:'lib-'+(++dossier.attachmentSequence),name:material.name,path:material.path,previewKey:material.previewKey,type:'',size:0,source:'library',sourceLabel:'材料目录 · '+material.kind+'（不计作本次原件）',note:material.note});
        invalidateDossierReview();if(!dossier.message)dossier.message='材料目录参考文件已关联；请上传本笔正式原件后再提交审核。';renderDetail();return;
      }
      if(action==='preview-file'){
        dossier.previewId=actionButton.dataset.fileId||'';
        const file=findAttachment(dossier.previewId);
        if(file)await loadAttachmentPreview(file);else renderDetail();
        return;
      }
      if(action==='preview-customs-checklist'){
        dossier.previewId=customsChecklist.id;
        await loadAttachmentPreview(customsChecklist);
        return;
      }
      if(action==='preview-sheet'){
        const file=actionButton.dataset.fileId===customsChecklist.id?customsChecklist:findAttachment(actionButton.dataset.fileId);
        if(file){file.previewSheet=Number(actionButton.dataset.sheetIndex)||0;renderDetail();}
        return;
      }
      if(action==='close-preview'){
        dossier.previewId='';renderDetail();return;
      }
      if(action==='remove-file'){
        const category=actionButton.dataset.category,files=attachmentsFor(category),file=files.find(item=>item.id===actionButton.dataset.fileId);
        if(file?.url)URL.revokeObjectURL(file.url);
        dossier.attachments[category]=files.filter(item=>item.id!==actionButton.dataset.fileId);
        if(dossier.previewId===actionButton.dataset.fileId)dossier.previewId='';
        invalidateDossierReview();dossier.message='材料已移除；本次档案需要重新审核。';renderDetail();return;
      }
      if(action==='apply-history'){
        const record=historyRecords.find(item=>item.id===dossier.historySelection);
        if(!record){dossier.message='请先选择一条历史档案示例。';renderDetail();return;}
        Object.assign(dossier.values,record.values);
        Object.keys(record.values).forEach(key=>{dossier.fieldSources[key]='历史档案示例 '+record.id;});
        invalidateDossierReview();dossier.message='历史档案字段已填入；材料附件未复制，请逐项核对主体、货物和本笔单证。';renderDetail();return;
      }
      if(action==='read-customs-source'){
        dossier.customsValues={...customsDemoValues};dossier.customsPreview=true;dossier.message='';
        renderDetail();return;
      }
      if(action==='apply-customs-values'){
        if(!dossier.customsPreview){dossier.message='请先读取关务清单并预览字段映射。';renderDetail();return;}
        Object.assign(dossier.values,dossier.customsValues);
        Object.keys(dossier.customsValues).forEach(key=>{dossier.fieldSources[key]='关务模块商品台账合成记录 EX-CUS-DEMO-001 · Export Docs字段映射';});
        dossier.customsApplied=true;invalidateDossierReview();dossier.message='关务商品字段已回填；请核对来源单证，HS编码仍需F人工确认。';renderDetail();return;
      }
      if(action==='submit-dossier'){
        if(!dossier.vpn){dossier.section='OPS';dossier.message='请先完成授权VPN入口校验；本按钮仅模拟门禁，不检测真实VPN。';renderDetail();return;}
        dossier.section='OPS';
        const empty=Object.values(dossierFields).flat().filter(field=>field.required&&!String(dossier.values[field.key]||'').trim());
        const missingFiles=originalFilesMissing();
        if(empty.length||missingFiles.length||serviceFeeIssues().length){
          dossier.message='提交被阻断：请先补齐必填字段和本次业务材料。';
        }else{
          dossier.submitted=true;dossier.message='已进入演示审核队列；B指定人工审核员终审前不生成交易单。';
        }
        renderDetail();return;
      }
      if(action==='approve-dossier'){
        const empty=Object.values(dossierFields).flat().filter(field=>field.required&&!String(dossier.values[field.key]||'').trim());
        const missingFiles=originalFilesMissing();
        if(!dossier.vpn||!dossier.submitted||empty.length||missingFiles.length||serviceFeeIssues().length){
          dossier.message='审批未执行：入口、资料或材料状态不满足建档终审条件。';renderDetail();return;
        }
        dossier.approved=true;dossier.message='演示审批已通过；生成唯一交易单并关联交易档案。正式系统需写入服务端并留存原件索引 / 审核记录。';renderDetail();return;
      }
      if(action==='create-case')demo.caseCreated=true;
      if(action==='start-review')demo.reviewStarted=true;
      if(action==='check-logistics')demo.logisticsChecked=true;
      if(action==='check-bank')demo.bankChecked=true;
      if(action==='confirm-customs')demo.customsConfirmed=!demo.customsConfirmed;
      if(action==='check-compliance')demo.complianceChecked=true;
      if(action==='preview-settlement'){
        const read=name=>Number($('capability-detail').querySelector('[data-calc="'+name+'"]')?.value||0);
        const foreign=read('foreign'),rate=read('rate'),fee=read('fee'),other=read('other'),deposit=read('deposit');
        if([foreign,rate,fee,other,deposit].some(value=>!Number.isFinite(value)||value<0)||rate===0){
          $('settlement-result').textContent='请检查金额与汇率';return;
        }
        const serviceFee=300,amount=foreign*rate-serviceFee-fee-other-deposit;
        if(amount<0){$('settlement-result').textContent='可用资金不足，无法覆盖服务费及已批准扣款';return;}
        const timing=$('capability-detail').querySelector('[data-calc="timing"]').value;
        $('settlement-result').textContent='CNY '+amount.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
        $('settlement-timing').textContent=timing+' · 示例试算';
        captureSettlementDraft();
        demo.quoteDate=$('capability-detail').querySelector('[data-quote-date]').value;
        demo.settlement={values:{foreign,rate,serviceFee,fee,other,deposit,timing},amount,timing};
        demo.settlementDirty=false;
        const status=$('capability-detail').querySelector('.demo-screen-status');
        status.textContent=demo.quoteArchived?'试算已更新；仍须人工核验正式银行 / 入账 / 审批凭证':'试算已更新但银行入账及可用凭证未确认；须暂停结算与付款';
      }
      if(action!=='preview-settlement')renderDetail();
    });
    $('view-capabilities').addEventListener('input',event=>{
      if(selected!=='sales')return;
      if(event.target.matches('[data-catalog-field]')){customsCatalog.draft[event.target.dataset.catalogField]=event.target.value;return;}
      if(event.target.matches('[data-catalog-query]')){customsCatalog.query=event.target.value;return;}
      if(event.target.matches('[data-dossier-field]')){
        updateDossierField(event.target);
        if(invalidateDossierReview())refreshDossierReviewState();
        return;
      }
      if(event.target.matches('[data-transport-missing]')){
        dossier.transportMissing=event.target.checked;
        if(invalidateDossierReview())renderDetail();
        return;
      }
      if(!event.target.matches('[data-calc]'))return;
      captureSettlementDraft();
      demo.settlementDirty=true;
      $('settlement-result').textContent='待重新试算';
      $('settlement-timing').textContent='输入已变更 · 请重新试算';
      const button=$('capability-detail').querySelector('[data-demo-action="preview-settlement"]');
      if(button)button.textContent='更新试算';
    });
    $('view-capabilities').addEventListener('change',event=>{
      if(selected!=='sales')return;
      if(event.target.matches('[data-catalog-role]')){
        if(event.target.value==='reviewer'&&!root.EXPORT_OPERATIONS.canAccessEntry('review')){
          customsCatalog.message='身份切换被拒绝：当前岗位无内部审核权限。';renderDetail();return;
        }
        customsCatalog.role=event.target.value;customsCatalog.message='';renderDetail();return;
      }
      if(event.target.matches('[data-catalog-field]')){customsCatalog.draft[event.target.dataset.catalogField]=event.target.value;return;}
      if(event.target.matches('[data-quote-confirmed]')){
        captureSettlementDraft();
        demo.quoteDate=$('capability-detail').querySelector('[data-quote-date]').value;
        demo.quoteArchived=event.target.checked;
        renderDetail();
        return;
      }
      if(event.target.matches('[data-quote-date]')){
        demo.quoteDate=event.target.value;
        return;
      }
      if(event.target.matches('[data-dossier-field]')){
        updateDossierField(event.target);
        if(invalidateDossierReview())refreshDossierReviewState();
        return;
      }
      if(event.target.matches('[data-history-selection]')){
        dossier.historySelection=event.target.value;return;
      }
      if(event.target.matches('[data-calc]')){
        captureSettlementDraft();
        demo.settlementDirty=true;
        return;
      }
      if(!event.target.matches('[data-file-upload]'))return;
      const category=event.target.dataset.fileUpload,files=Array.from(event.target.files||[]);
      if(!files.length)return;
      files.forEach(file=>addAttachment(category,{id:'upload-'+(++dossier.attachmentSequence),name:file.name,type:file.type,size:file.size,url:URL.createObjectURL(file),file,source:'upload',sourceLabel:'当前浏览器本地文件'}));
      dossier.previewId='';invalidateDossierReview();dossier.message=files.length+'份本地材料已加入当前档案，可预览；离开页面后不会保留。';renderDetail();
    });
  }
  function updateDossierField(field){
    const key=field.dataset.dossierField;
    dossier.values[key]=field.value;
    dossier.fieldSources[key]='人工修改';
    let source=field.parentElement.querySelector('.dossier-field-source');
    if(!source){
      source=document.createElement('small');
      source.className='dossier-field-source';
      field.insertAdjacentElement('afterend',source);
    }
    source.textContent='来源：人工修改';
  }
  root.EXPORT_CAPABILITY_WORKSPACE={initialize,resize,scenarios,getContractContext:()=>({values:{...dossier.values},approved:dossier.approved})};
})(globalThis);
