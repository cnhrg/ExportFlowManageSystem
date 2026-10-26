'use strict';
(function(root){
  const groups=[
    {id:'1',name:'交易建档',source:'操作指引步骤1',nodes:['N01']},
    {id:'2',name:'协议与委任',source:'操作指引步骤2',nodes:['N02','N03','N04']},
    {id:'3',name:'备货与物流',source:'操作指引步骤3；N06同时承接步骤1运输信息',nodes:['N05','N06','N10']},
    {id:'4',name:'报关与放行',source:'操作指引步骤4',nodes:['N07','N08','N09']},
    {id:'5',name:'收款、结算与付款',source:'操作指引步骤5及预付/出口后付款条件',nodes:['N11','N12','N13','N14','N15','N16','N17']},
    {id:'6',name:'代理出口货物证明',source:'操作指引步骤6；申请责任待主管税务机关确认',nodes:['N18','N19','N20']},
    {id:'7',name:'退税申报与进度跟进',source:'操作指引步骤7',nodes:['N21']},
    {id:'8',name:'四流核对与异常',source:'跨流程控制：结案、暂停、更正与重审',nodes:['N22','N23']}
  ];
  const actors={
    A:'A 中国供应商',B:'B 贸易代理商',E:'E 物流公司',F:'F 报关代理',
    TEAM:'ABEF业务主体',REVIEWER:'人工审核员',
    C:'C 境外收货人',D:'D 付款方',OPS:'系统',BANK:'收款银行',PAYBANK:'付款银行',CUSTOMS:'中国海关',
    TAX:'官方税务系统',CARRIER:'实际承运人',AGENT:'目的地清关代理',DEST:'目的地海关',CIPS:'CIPS支付系统',
    FILES:'文件存储系统',DB:'数据库'
  };
  const external={
    N01:[['D','付款方独立首次提交付款主体、付款原因及实际收货关系，允许修改；其余主体资料由供应商提前沟通后收集填写']],
    N02:[],
    N03:[['CARRIER','实际承运安排，按委托链适用'],['AGENT','目的地清关服务范围，适用时']],
    N04:[['CUSTOMS','正式报关电子委托渠道，按实际授权方式']],
    N05:[],
    N06:[['CARRIER','运力、运输编号、提货与路线']],
    N07:[],N08:[],
    N09:[['CUSTOMS','申报、受理、放行及正式回执']],
    N10:[['C','交货及签收'],['CARRIER','运输及货损处理'],['DEST','目的地监管或扣留，发生时']],
    N11:[['D','汇总多笔单据付款，水单备注列明交易档案ID及金额'],['CIPS','CIPS汇款及付款附言'],['BANK','B收款账户实际入账，全额先记不可用']],
    N12:[['D','接收人工审批通过的付款发票'],['C','收货资料及签收']],
    N13:[['BANK','贸易真实性及合规核验、实际入账与可用状态确认；CIPS仅承担支付清算']],
    N14:[['BANK','逐笔贸易核验入账执行明细、实际入账金额与银行实际费用']],
    N15:[],N16:[],
    N17:[['PAYBANK','B向A付款结果'],['BANK','A实际收款结果']],
    N18:[['TAX','配套资料范围及办理要求，需确认时']],
    N19:[['TAX','申请主体、权限、渠道及受理']],
    N20:[['TAX','正式签发或反馈']],
    N21:[['TAX','官方税务系统申报、补正及处理结果'],['BANK','退税实际到账，发生时']],
    N22:[],
    N23:[['BANK','资金异常核实，适用时'],['CUSTOMS','申报更正或放行异常，适用时'],['TAX','证明或退税补正，适用时']]
  };
  const exchanges={
    N01:[['A','OPS','供应商预取号，首次提交自动创建交易及其事先收集资料，允许修改原资料'],['D','OPS','付款方首次提交付款主体、原因及实际收货关系，允许修改原资料']],
    N02:[['A','B','核对代理范围、费用及付款条件并签署附件1']],
    N03:[['A','E','确认物流委任链、合同及报价'],['E','CARRIER','落实承运安排'],['E','AGENT','确认目的地清关边界（适用时）']],
    N04:[['A','F','签署报关服务合同并办理正式委托；附件4流程图不代替合同'],['F','CUSTOMS','核实正式电子委托（适用时）'],['B','A','书面指定或认可同一报关代理（预付模式）']],
    N05:[['A','OPS','提交本笔最终发票、箱单、合同及实货数据']],
    N06:[['A','E','交付提送货指示及最终货物批次'],['E','CARRIER','确认运输编号、工具、路线和ETA'],['E','A','提交运输计划与包装交接记录'],['A','F','交付报关所需物流信息']],
    N07:[['A','F','交付授权及最终出口单证'],['F','A','送审双抬头报关最终草稿']],
    N08:[['A','F','书面确认具体最终版本；实质变更后重新确认']],
    N09:[['F','CUSTOMS','提交已获A确认的最终申报'],['CUSTOMS','F','返回受理和出口放行结果'],['F','A','交付正式附件2'],['F','B','交付正式附件2并保留接收证据']],
    N10:[['CARRIER','E','更新运输状态和异常'],['E','C','交付货物并取得签收'],['E','A','报告签收或货损处置'],['E','DEST','配合目的地监管或扣留处理（发生时）']],
    N11:[['D','CIPS','合并汇款并在水单附言列明各笔交易建档ID及金额'],['CIPS','BANK','向B账户汇入合并款项及附言'],['BANK','OPS','发送水单与实际入账记录；全额先记不可用'],['OPS','OPS','系统按水单附言中的交易建档ID逐笔关联交易档案并核对总分']],
    N12:[['OPS','B','仅按已关联额度生成国际付款发票INVOICE及1:N匹配清单'],['REVIEWER','OPS','逐笔审批当前发票与材料版本'],['OPS','D','发送审批通过的付款发票']],
    N13:[['OPS','BANK','提交获批INVOICE、水单与档案分配明细，申请贸易核验入账'],['BANK','BANK','核验贸易背景、付款关系及合同累计可收额度'],['BANK','OPS','返回核验结果、实际入账及可用确认；仅成功对应额度释放，差额保持受限']],
    N14:[['B','BANK','核对逐笔贸易核验入账回执、实际入账金额及银行实际费用'],['BANK','B','提供逐笔贸易核验入账执行明细与实际费用凭证'],['B','OPS','首次获批分账时核验D服务费授权及可用余额并按trade唯一键结算300元；不减少A合同应付']],
    N15:[['B','OPS','申请预付款；核对同一F认可、授权及资金来源']],
    N16:[['B','OPS','归集附件2、放行、到账及结算证据']],
    N17:[['B','PAYBANK','按获批金额及核实账户执行付款'],['PAYBANK','B','返回实际付款结果'],['A','BANK','核对人民币实际到账'],['A','B','确认本笔收款']],
    N18:[['F','B','整理证明申请配套资料及批次核对结果'],['B','TAX','确认申请职责、资料要求和渠道（需确认时）']],
    N19:[['F','B','协助资料补正'],['B','TAX','暂定由B经确认的正式渠道申请'],['TAX','B','返回受理或补正反馈']],
    N20:[['TAX','B','正式签发或反馈'],['B','A','交付正式电子证明并取得接收证据'],['F','B','协助更正资料（需更正时）']],
    N21:[['TEAM','OPS','确认退税所需材料已归档于本笔交易档案'],['TEAM','TAX','经人工审批后由授权经办人通过官方税务系统提交退税申报'],['TAX','OPS','返回提交回执、受理状态及申报编号'],['TAX','OPS','发送办理进度、补正通知或处理结果'],['OPS','TEAM','自动更新进度并生成申报/补正跟进任务'],['TEAM','OPS','按通知提交补正材料或正式更正文件'],['TEAM','TAX','经人工审批后通过官方税务系统提交补正资料'],['TAX','OPS','返回补正受理及最新处理状态'],['TEAM','BANK','核实退税实际到账（发生时）']],
    N22:[['A','OPS','提交收款及退税结果'],['E','OPS','提交运输和签收结果'],['F','OPS','提交申报和证明交付记录'],['B','OPS','冻结四流逐项报告，实质勾稽资金账务并独立审核正常结案；未知阻断']],
    N23:[['OPS','B','登记异常、责任人和暂停范围'],['B','BANK','核实资金异常（适用时）'],['F','CUSTOMS','办理申报更正（适用时）'],['A','TAX','回复税务补正（适用时）'],['B','OPS','提交纠正证据并返回原节点重审']]
  };
  const clean=text=>String(text).replace(/[&<>"\r\n;]/g,c=>({'&':'＆','<':'＜','>':'＞','"':'＂',';':'；','\r':' ','\n':' '}[c]));
  const wrap=text=>{
    const normalized=clean(text);
    const checklist=normalized.match(/^(人工核验清单：|贸易核验入账核验清单：)(.*)$/);
    if(checklist)return checklist[1]+checklist[2].split('；').join('；<br/>');
    const chars=Array.from(normalized),lines=[];
    for(let i=0;i<chars.length;i+=46)lines.push(chars.slice(i,i+46).join(''));
    return lines.join('<br/>');
  };
  function forNode(id){
    const group=groups.find(p=>p.nodes.includes(id));
    if(!group||!external[id])throw new Error('缺少节点流程配置：'+id);
    return {group,external:external[id].map(([actor,interaction])=>({actor,name:actors[actor],interaction}))};
  }
  function nodesFor(id,mode='all'){
    const D=root.EXPORT_BUSINESS||require('./business-data.js');
    const group=groups.find(g=>g.id===id);
    if(!group)throw new Error('未知流程：'+id);
    return group.nodes.map(key=>D.nodes.find(n=>n.id===key)).filter(n=>mode==='all'||!n.mode||n.mode===mode);
  }
  function lane(actor){
    if(actor==='REVIEWER'||/_H$/.test(actor))return 'REVIEWER';
    if(['A','B','E','F'].includes(actor))return 'TEAM';
    return actor;
  }
  function participantLines(used){
    const systemActors=['FILES','DB'].filter(actor=>used.has(actor));
    const externalActors=Object.keys(actors).filter(actor=>!['A','B','E','F','OPS','TEAM','REVIEWER','FILES','DB'].includes(actor)&&used.has(actor));
    return [
      '    box rgb(240, 246, 255) ABEF业务主体',
      '    participant TEAM as ABEF业务主体',
      '    end',
      '    participant REVIEWER as 人工审核员',
      '    participant OPS as 系统',
      ...systemActors.map(actor=>'    participant '+actor+' as '+actors[actor]),
      ...externalActors.map(actor=>'    participant '+actor+' as '+actors[actor])
    ];
  }
  function message(lines,from,to,label){
    from=lane(from);to=lane(to);
    lines.push('    activate '+from,'    '+from+'->>'+to+': '+wrap(label),'    deactivate '+from);
  }
  function ownAction(lines,actor,label){message(lines,actor,actor,label);}
  function scopedNode(lines,node,actor){
    lines.push('    rect rgb(255, 246, 226)');
    ownAction(lines,actor,node.id+' '+clean(node.title));
  }
  function appendReview(lines,node,R,reviewerName){
    const checklist=R.forNode(node).map(rule=>rule.name).join('；');
    message(lines,'OPS',reviewerName,'人工核验清单：'+checklist);
    ownAction(lines,reviewerName,'核验当前版本及适用条件');
    message(lines,reviewerName,'OPS',node.id==='N23'?'协调原节点责任人与原审核人重审':'记录审核意见；未通过则退回补正');
  }
  function sequence(id,mode='all'){
    const R=root.EXPORT_NODE_VALIDATION_RULES||require('./node-validation-rules.js'),ns=nodesFor(id,mode);
    if(id==='1')return entrySequence(ns[0],R);
    if(id==='2')return agreementSequence();
    if(id==='3')return logisticsSequence(ns,R);
    if(['4','5','6','7','8'].includes(id))return remainingSequence(id,mode);
    const used=new Set(['TEAM','REVIEWER','OPS']);
    for(const n of ns){
      for(const [from,to] of exchanges[n.id]){used.add(lane(from));used.add(lane(to));}
      for(const {actor} of external[n.id])used.add(lane(actor));
    }
    const lines=['sequenceDiagram','    autonumber',...participantLines(used)];
    for(const n of ns){
      if(mode==='all'&&n.id==='N15')lines.push('    alt 出口前预付款');
      if(mode==='all'&&n.id==='N16')lines.push('    else 出口后付款');
      const review=['REVIEWER'];
      const owner=['A','B','C','D','E','F'].includes(n.role)?n.role:'OPS';
      scopedNode(lines,n,owner);
      for(const [from,to,label] of exchanges[n.id])message(lines,from,to,label);
      if(n.id==='N05')appendModificationRequest(lines);
      lines.push('    end','    rect rgb(235, 245, 255)');
      ownAction(lines,'OPS','系统基于交易档案生成待审批资料并按规则检查资料的正确性');
      for(const a of review)message(lines,'OPS',a,'生成审核待办并提交人工核验');
      lines.push('    end','    rect rgb(255, 246, 226)');
      for(const a of review)appendReview(lines,n,R,a);
      lines.push('    end','    rect rgb(234, 248, 239)','    alt 核验通过且前置条件满足');
      ownAction(lines,'OPS','保存审核记录并交接下一节点');
      lines.push('    else 未通过或前置条件不满足');
      message(lines,'OPS',review[0],'退回补正，暂停受影响交接');
      lines.push('    end','    end');
      if(mode==='all'&&n.id==='N16')lines.push('    end');
    }
    return lines.join('\n');
  }
  function appendModificationRequest(lines){
    lines.push('    opt A按需申请修改已提交的出口单证');
    message(lines,'A','OPS','提交拟修改内容、原因及受影响文件');
    message(lines,'OPS','REVIEWER','提交修改点及版本差异，等待人工审批');
    ownAction(lines,'REVIEWER','审核修改点与版本影响');
    lines.push('    alt 修改点审批通过');
    message(lines,'REVIEWER','OPS','批准本次修改');
    message(lines,'A','OPS','提交修订版并保留原版本');
    lines.push('    else 修改点未批准');
    message(lines,'REVIEWER','OPS','拒绝修改，维持原版本并暂停受影响交接');
    lines.push('    end','    end');
  }
  function logisticsSequence(ns,R){
    return `sequenceDiagram
    autonumber
    actor SUPPLIER as 供应商
    actor LOGISTICS as 物流公司
    actor REVIEWER as 独立审核员
    participant SYSTEM as 代理出口系统
    participant CUSTOMS as 同批正式海关放行证据
    actor CONSIGNEE as 实际收货人
    Note over SUPPLIER,SYSTEM: 本图对应N05、N06、N10，逐用例REST与中间件展开见系统用例步骤三
    SUPPLIER->>SYSTEM: 选择原因2批准商品与主体，建立批次及运输计划
    SYSTEM-->>SUPPLIER: 数量金额不超批准行的计划批次，尚未出运
    opt 未执行计划需修改或取消
      SUPPLIER->>SYSTEM: 修改计划；取消交出口代理有权人员
      SYSTEM-->>SUPPLIER: 原计划封存，新计划或取消回执；未知执行不释放分配
    end
    SUPPLIER->>SYSTEM: 提交本批备货与出口单证确切版本
    SYSTEM-->>REVIEWER: 原计划版、材料与差异待办
    REVIEWER->>SYSTEM: 核实备货或退回，不能自己审自己
    LOGISTICS->>SYSTEM: 分别提交真实订舱与提货依据
    SYSTEM-->>REVIEWER: 本批计划、委托链、合同与证据
    alt 有效合同与备货、主体及证据齐备
      REVIEWER->>SYSTEM: 独立核实订舱，再核实提货
      SYSTEM-->>LOGISTICS: 已订舱2，已提货待发运3，不等于出境
    else 缺材料或外部执行未知
      SYSTEM-->>LOGISTICS: 明确阻断并保留原资源查询，不冒充承运成功
    end
    LOGISTICS->>SYSTEM: 提交各段启运、到达及最后签收依据
    SYSTEM->>CUSTOMS: 核实出境区段同批正式放行
    alt 缺真实正式放行或其他必需证据
      SYSTEM-->>LOGISTICS: 阻断出境/签收，受理声明不改正式事实
    else 来源、时序、放行与区段证据经独立核实
      REVIEWER->>SYSTEM: 逐段确认实际事实，不乱序跳阶段
      SYSTEM-->>LOGISTICS: 首段启运4，末段到达5
      CONSIGNEE->>LOGISTICS: 提供真实有权签收或数量差异、拒收证据
      LOGISTICS->>SYSTEM: 提交签收依据
      REVIEWER->>SYSTEM: 核实签收主体、同批和差异闭环后确认6
    end
    opt 物流异常、货损或拒收
      LOGISTICS->>SYSTEM: 报告原批次证据，核实后进入异常7
      REVIEWER->>SYSTEM: 核实全部异常处置或实质灭失证据
      SYSTEM-->>LOGISTICS: 全部闭环恢复原阶段，签收另核实；实质失败才9
    end`;
  }
  function entrySequence(node,R){
    const lines=['sequenceDiagram','    autonumber',
      '    actor SUPPLIER as 供应商','    actor PAYER as 付款方',
      '    participant FRONT as 本方资料前端','    participant SYSTEM as 单体应用对外接入接口',
      '    participant FILE as 私有对象及操作证据存储','    participant DATABASE as 同一MySQL交易及中间件表',
      '    Note over SUPPLIER,SYSTEM: 本图汇总步骤一四个用例；逐用例中间件时序及HTTP协议见系统用例页',
      '    SUPPLIER->>FRONT: 事先沟通后填写供应商、出口代理、实际收货人、物流公司及出口报关代理资料',
      '    FRONT->>SYSTEM: 实名/强认证及明确确认后申请预留；原键与本人意图确认号',
      '    SYSTEM->>DATABASE: BEGIN先查原预留，无才锁固定计数行再查，计数与归属同事务提交',
      '    SYSTEM-->>FRONT: 原交易号及预留号；此时无交易记录',
      '    FRONT->>SYSTEM: 准备/确认上传；前端向私有存储直传原字节',
      '    SYSTEM->>FILE: 确切版本扫描及最终文件写入；失败由同应用持久任务自行恢复',
      '    SYSTEM-->>FRONT: 已确定文件版/摘要/资格，或明确未就绪',
      '    SUPPLIER->>FRONT: 首次完整提交本方资料',
      '    FRONT->>SYSTEM: POST交易资源；原交易号作为幂等键及绑定内容的确认号',
      '    SYSTEM->>FILE: 事务外保全实名/强认证及明确确认的操作证据，未持久化不写业务',
      '    SYSTEM->>DATABASE: BEGIN先锁原预留查原交易/事件；无才同事务创建交易、收集主体及事件',
      '    DATABASE-->>SYSTEM: COMMIT或全部ROLLBACK；失败无空壳',
      '    SYSTEM-->>FRONT: 仅确定提交才201或重放200及平台签名回执；否则明确错误/待恢复',
      '    PAYER->>FRONT: 以本方法定身份进入交易；填写付款关系与原因',
      '    FRONT->>SYSTEM: POST付款资料资源；独立对象权限、幂等键及本人意图确认号',
      '    SYSTEM->>DATABASE: BEGIN锁交易根先查原事件，无才写本方资料、递增修订/证据引用及消费确认同COMMIT',
      '    SYSTEM-->>FRONT: 201付款方资料地址及实体标签',
      '    opt 供应商或付款方修改自己的原资料',
      '    FRONT->>SYSTEM: GET本方资源与强实体标签',
      '    SYSTEM-->>FRONT: 200本方完整资料，不泄露另一方私有声明',
      '    FRONT->>SYSTEM: PUT原本方地址；If-Match、Idempotency-Key及本人意图确认号',
      '    SYSTEM->>DATABASE: 锁交易根，同键回放先于旧版校验；新请求原子替换本方资料并追加事件',
      '    SYSTEM-->>FRONT: 200受理元数据；旧标签412或缺标签428',
      '    end',
      '    Note over SYSTEM,DATABASE: 状态仍编辑中；无运营建单、邀请、其他主体单独提交或人工终审',
      '    Note over FRONT,SYSTEM: 供应商无需设备或自管私钥；HTTPS只保护传输，结合实名/强认证/明确确认及不可改证据。合同另由第三方实名电子签',
      '    Note over SUPPLIER,SYSTEM: D承担的每笔300元服务费仅在首次获批分账时从已核验可用余额结算；本步保存不触发扣费',
      '    Note over SYSTEM,DATABASE: 校验目录：'+R.forNode(node).map(rule=>rule.name).join('；')
    ];
    return lines.join('\n');
  }
  function agreementSequence(){
    return `sequenceDiagram
    autonumber
    actor SUPPLIER as 供应商
    actor OPERATOR as 出口代理运营人员
    actor REVIEWER as 独立审核员
    participant SYSTEM as 代理出口系统
    participant LOGISTICS as 物流公司
    participant CUSTOMSAGENT as 报关代理
    participant SIGNING as 第三方实名电子签平台
    participant OFFICIAL as 正式报关委托渠道
    Note over SUPPLIER,SYSTEM: 已完成步骤一双主体资料；供应商无需设备/自管私钥，HTTPS不单独等于抗抵赖
    SUPPLIER->>SYSTEM: 在编辑态用原本方PUT补齐结构化收付路径/付款分支/资质/人民币报价及计价依据
    OPERATOR->>SYSTEM: 用内部审阅入口核对本阶段资料/标签，明确确认并送审签约依据
    SYSTEM-->>REVIEWER: 确切送审快照、来源及本阶段门禁
    alt 独立审核通过
      REVIEWER->>SYSTEM: 批准确切依据，不是付款全门禁通过
      SYSTEM-->>SUPPLIER: 不可改批准交易快照；可开始三用途合同
    else 退回补充
      REVIEWER->>SYSTEM: 明确缺项及原因
      SYSTEM-->>OPERATOR: 待补3；有权人员开启新内容版3→2，供应商/付款方再各改本方并重送
    end
    opt 仅已有批准签约依据
      loop 出口代理协议10、物流合同11、报关服务合同12分别处理
        SUPPLIER->>SYSTEM: 明确用途、双方、批准依据、确切正文/期间，保存并送审
        SYSTEM-->>REVIEWER: 原合同版及委托链/收费/付款条件
        alt 审核不通过或实质更正
          REVIEWER->>SYSTEM: 退回确切版并说明问题
          SUPPLIER->>SYSTEM: 退回3新修订；旧待审/待签先由有权人员正式终止，不继承签章/审核
        else 审核通过且无未知或活跃冲突任务
          REVIEWER->>SYSTEM: 通过确切版，仅待签署
          SUPPLIER->>SYSTEM: 确认发起原已审版第三方实名签署
          SYSTEM->>SIGNING: 本地持久任务后按原引用查单/幂等发起
          SUPPLIER->>SIGNING: 进入本人短期会话、实名及授权确认后签确切正文
          opt 物流或报关用途
            alt 本次为物流用途11
              LOGISTICS->>SIGNING: 由物流公司法定有权签署人确认
            else 本次为报关用途12
              CUSTOMSAGENT->>SIGNING: 由报关代理法定有权签署人确认
            end
          end
          opt 出口代理协议
            OPERATOR->>SIGNING: 由出口代理授权签署人确认，运营登录不等于签章权
          end
          SIGNING-->>SYSTEM: 原任务签名通知；未知先查单，不盲重签
          SYSTEM->>SIGNING: 主动核实原版任务/全部必要签署方，下载真实签署件与证据
          SYSTEM->>SYSTEM: 核验授权/签名/可信时间/正文关联并不可改归档，齐备才记已签5
          OPERATOR->>SYSTEM: 从内部入口核对当前已签工作版/条件/期间；有旧生效版须正式替代，同事务新6旧7
        end
      end
      opt 引用公共物流框架协议11
        SUPPLIER->>SYSTEM: 逐笔提交确切生效版、主体映射、服务单及适用期间
        SYSTEM->>SYSTEM: 实时核对范围/主体/有效期，不豁免逐单代理10或报关12
        SYSTEM-->>REVIEWER: 新增交易更正修订待复核，不回填旧批准快照
      end
      SUPPLIER->>OFFICIAL: 按正式渠道办理对同一报关代理的实际委托
      OFFICIAL-->>SUPPLIER: 正式授权证据及范围/期间；平台合同不能替代
      SUPPLIER->>SYSTEM: 登记正式委托证据供复核
      opt 出口前预付款
        OPERATOR->>SYSTEM: 有权人员书面认可同一报关代理、范围及期间
        SYSTEM-->>REVIEWER: 认可/授权进入更正复核，不批准付款或伪造海关事实
      end
      OPERATOR->>SYSTEM: 公共适用/正式委托/认可沿同基准更正工作链连续补齐，最终一次送审/批准
      SYSTEM->>SYSTEM: 复核各合同依赖，未变保留原批准快照；受影响阻断新使用，不抹除法律义务
    end
    Note over SUPPLIER,SYSTEM: 固定300元由D承担，首次获批分账时从D已核验可用余额一次性结算；不减少A合同应付
    Note over SYSTEM,SIGNING: 签约/签署/生效分别留证；详细短事务、存储、超时/错误及恢复见步骤二系统用例`;
  }
  function remainingSequence(id,mode){
    const sources={
      '4':`sequenceDiagram
    autonumber
    actor Supplier as 供应商
    actor Agent as 出口报关代理经办人
    actor Reviewer as 独立关务审核员
    actor Exporter as 出口代理经办人
    participant System as 代理出口系统
    participant Customs as 正式报关渠道及海关
    Agent->>System: 按批准交易快照、批次计划确切版准备草稿
    System->>System: 检查累计申报不超同批分配，保存不可变修订
    Agent->>System: 提交本版审核
    Reviewer->>System: 独立核对本版完整表头、商品与依据
    alt 审核通过
      Supplier->>System: 对同一最终修订书面确认
      Agent->>System: 登记正式办理意图、确切版及原办理号
      opt 正式渠道已确认授权且接入
        System->>Customs: 按原办理号办理；本地受理非正式提交
        Customs-->>System: 正式提交、受理、查验及放行证据分别到达
        Reviewer->>System: 逐件核实真实来源、版、摘要及正式事件键
      end
      Note over System,Customs: 无接入/超时/未知保持待核实，原号查单，不伪造退单/放行
      opt 只有正式放行及附件2已经核实
        Agent->>System: 登记确切正式文件向供应商、出口代理分别交付
        Supplier->>System: 独立确认本方接收或异议
        Exporter->>System: 独立确认本方接收或异议
      end
    else 退回或发生实质更正
      Agent->>System: 新修订补正，重新独立审核并由供应商确认
    end`,
      '5':`sequenceDiagram
    autonumber
    actor Payer as 付款方
    actor Operator as 出口代理资金经办人
    actor Reviewer as 独立资金审核员
    actor Supplier as 供应商
    participant Bank as 真实收付款银行
    participant System as 代理出口系统
    Payer->>Bank: 人民币合并汇款，附逐交易金额
    Note over Bank,System: 无正式流水不能登记银行成功；以下事实必须独立核实
    opt 银行真实入账证据已核实
      Operator->>System: 登记稳定银行身份/事件键及原始实收
      System->>System: 全额受限，未匹配保留受限；不可虚增可用
      Operator->>System: 提交逐交易分配及独立审核
      Reviewer->>System: 核实总分守恒、来源、累计不超额
      Operator->>System: 冻结INVOICE并送独立审核、交付付款方
      opt 银行贸易核验及实际可用事实均已核实
        Reviewer->>System: 仅对应确认额度受限转可用，其他受限保持
      end
      Operator->>System: 编制结算，区分真实银行费用、D服务费分账结算及A合同应付
      opt 首次获批分账且D授权、贸易核验及可用余额齐备
        Reviewer->>System: 从D可用余额一次性结算固定300元服务费，不扣减A合同应付
      end
      ${mode==='post'?'Note over Operator,System: 当前仅出口后付款分支':mode==='pre'?'Note over Operator,System: 当前仅出口前预付款分支':'alt 出口前预付款'}
      ${mode==='post'?'Operator->>System: 核实正式放行/附件2/合同与可用资金': 'Operator->>System: 仅使用真实到账且核验可用款，核实合同与正式委托/认可，不含垫资授信'}
      ${['pre','post'].includes(mode)?'':'else 出口后付款\n      Operator->>System: 核实正式放行、附件2及真实可用款\n      end'}
      Reviewer->>System: 独立批准确切账户、来源、金额，事务内可用转付款锁额
      opt 银行支付渠道已接入且事实足够
        System->>Bank: 按已冻结原执行号付款，外部调用不占业务锁
        Bank-->>System: 明确扣款或明确未执行证据；超时仅未知
      end
      Note over Bank,System: 未知保持锁额；只按原号查单，明确未执行才可安全解锁
      Supplier->>System: 独立提交实际到账确认，扣款不等于供应商到账
      Reviewer->>System: 核实双边款项及凭证，满足才完成
    end`,
      '6':`sequenceDiagram
    autonumber
    actor Supplier as 供应商
    actor Exporter as 出口代理经办人
    actor CustomsAgent as 出口报关代理经办人
    actor Reviewer as 独立税务审核员
    participant System as 代理出口系统
    participant Authority as 主管税务机关
    CustomsAgent->>System: 准备附件2及确切版本配套资料
    Exporter->>System: 建立证明协同案件，冻结范围/规则及完整资料版
    Reviewer->>System: 独立审核；证明申请金额不适用为NULL
    alt 正式申请职责、范围、权限尚未确认或官方未接入
      System-->>Exporter: 保留准备与待办，明确阻断正式申请/签发/交付
    else 全部正式申请前提已确认
      Exporter->>System: 确切资料版办理意图及原办理号
      System->>Authority: 有权经办通过正式渠道办理
      Authority-->>System: 提交、受理、补正、签发证据分别核实
      Reviewer->>System: 核实原件/范围/确切资料版，不以内审冒称正式签发
      opt 正式证明已核实且有效
        Exporter->>System: 向供应商交付确切证明
        Supplier->>System: 独立接收或提出异议
      end
    end
    Note over Supplier,System: 补正另版重审；发送不等于接收，证明不等于退税到账`,
      '7':`sequenceDiagram
    autonumber
    actor Supplier as 供应商经办人
    actor Reviewer as 独立退税审核员
    actor Finance as 资金核实人员
    participant System as 代理出口系统
    participant Authority as 主管税务机关
    participant Bank as 实际收款银行
    Supplier->>System: 准备确定版材料、批准快照、范围及申请额
    Reviewer->>System: 独立审核或退回，新资料必须新版本
    alt 职责/范围/税率/期限/权限未确认或官方未接入
      System-->>Supplier: 保留准备，明确阻断正式申报
    else 已确认有权正式办理
      Supplier->>System: 确切批准版办理意图和原办理号
      System->>Authority: 官方渠道提交，未知原号查单
      Authority-->>System: 正式受理、补正、进度或终局决定
      Reviewer->>System: 核实来源和资料版，分别记录申请额/正式批准额
      opt 正式补正
        Supplier->>System: 新资料版关联原补正事件，受影响批准失效并重审
      end
    end
    Note over System,Authority: 税务机关处理结果不能声称银行到账；终局拒绝不自动结案交易
    Finance->>Bank: 核实供应商实际收款账户及真实退税流水
    Finance->>System: 只有受控资金证据才能核对实际到账/部分差异
    System-->>Supplier: 无银行证据保持待核对，不给出口代理货款账户虚增余额`,
      '8':`sequenceDiagram
    autonumber
    actor Operator as 出口代理核对经办人
    actor Owner as 所属业务域责任人
    actor Reviewer as 独立结案审核员
    participant System as 代理出口系统
    Operator->>System: 读取全部对象集合、源版本向量和规则版
    System-->>Operator: 形成不可变逐项四流核对报告，不只是资料齐备
    opt 有差异、未知或更正
      Operator->>System: 建立差异案件，分派并按精确范围暂停
      Owner->>System: 在所属域实质处置/新版本补正/原节点重审
      Reviewer->>System: 针对原暂停原因分别决定是否解除
      Note over Owner,System: 关闭一个案件不自动解冻其他原因；原法律/银行事实不得覆盖
    end
    Operator->>System: 提交正常结案申请，绑定确切报告及源版本向量
    Reviewer->>System: 独立复核全部对象、资金守恒、三桶、应付已付和凭证平衡
    System->>System: 短事务根锁后当前读，重验新增事件/案件/付款和依赖版
    alt 任何未知/差异/暂停/版本陈旧/不平账
      System-->>Reviewer: 明确阻断结案，保留原阶段和修正责任
    else 所有正式终态与账务条件具备
      System->>System: 同事务正常结案8到10、写不可变最终受理
      System-->>Operator: 原键回放同一结果，终态不能重开
    end
    Note over Reviewer,System: 本版不启用特殊结案；缺外部依据不伪造成功全链`
    };
    return sources[id];
  }
  const api={groups,actors,forNode,nodesFor,sequence};
  root.EXPORT_PROCESSES=api;
  if(typeof module!=='undefined')module.exports=api;
})(globalThis);
