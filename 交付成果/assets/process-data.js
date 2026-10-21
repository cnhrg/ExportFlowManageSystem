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
    N01:[['D','自行填写付款主体及与C的商业关系；C的主体与收货信息由A收集后统一填写']],
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
    N13:[['BANK','贸易真实性及合规核验、实际入账与可用状态确认、B收益真实银行划转双边回执；CIPS仅承担支付清算']],
    N14:[['BANK','逐笔贸易核验入账执行明细、实际入账金额与费用']],
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
    N01:[['A','OPS','一次性填写供应商、货物单证及收货主体、送货地址'],['D','OPS','自行填写付款主体及与C的商业关系']],
    N02:[['A','B','核对代理范围、费用及付款条件并签署附件1']],
    N03:[['A','E','确认物流委任链、合同及报价'],['E','CARRIER','落实承运安排'],['E','AGENT','确认目的地清关边界（适用时）']],
    N04:[['A','F','签署附件4并办理委托授权'],['F','CUSTOMS','办理正式电子委托（适用时）'],['B','A','书面指定或认可同一F（预付模式）']],
    N05:[['A','OPS','提交本笔最终发票、箱单、合同及实货数据']],
    N06:[['A','E','交付提送货指示及最终货物批次'],['E','CARRIER','确认运输编号、工具、路线和ETA'],['E','A','提交运输计划与包装交接记录'],['A','F','交付报关所需物流信息']],
    N07:[['A','F','交付授权及最终出口单证'],['F','A','送审双抬头报关最终草稿']],
    N08:[['A','F','书面确认具体最终版本；实质变更后重新确认']],
    N09:[['F','CUSTOMS','提交已获A确认的最终申报'],['CUSTOMS','F','返回受理和出口放行结果'],['F','A','交付正式附件2'],['F','B','交付正式附件2并保留接收证据']],
    N10:[['CARRIER','E','更新运输状态和异常'],['E','C','交付货物并取得签收'],['E','A','报告签收或货损处置'],['E','DEST','配合目的地监管或扣留处理（发生时）']],
    N11:[['D','CIPS','合并汇款并在水单附言列明各笔交易建档ID及金额'],['CIPS','BANK','向B账户汇入合并款项及附言'],['BANK','OPS','发送水单与实际入账记录；全额先记不可用'],['OPS','OPS','系统按水单附言中的交易建档ID逐笔关联交易档案并核对总分']],
    N12:[['OPS','B','仅按已关联额度生成国际付款发票INVOICE及1:N匹配清单'],['REVIEWER','OPS','逐笔审批当前发票与材料版本'],['OPS','D','发送审批通过的付款发票']],
    N13:[['OPS','BANK','提交获批INVOICE、水单与档案分配明细，申请贸易核验入账'],['BANK','BANK','核验贸易背景、付款关系及合同累计可收额度'],['BANK','OPS','返回核验结果、实际入账及可用确认；仅成功对应额度释放，差额保持受限']],
    N14:[['B','BANK','核对逐笔贸易核验入账回执、实际入账金额及费用'],['BANK','B','提供逐笔贸易核验入账执行明细与扣费'],['B','OPS','提交费用、扣款及应付A净额审批']],
    N15:[['B','OPS','申请预付款；核对同一F认可、授权及资金来源']],
    N16:[['B','OPS','归集附件2、放行、到账及结算证据']],
    N17:[['B','PAYBANK','按获批金额及核实账户执行付款'],['PAYBANK','B','返回实际付款结果'],['A','BANK','核对人民币实际到账'],['A','B','确认本笔收款']],
    N18:[['F','B','整理证明申请配套资料及批次核对结果'],['B','TAX','确认申请职责、资料要求和渠道（需确认时）']],
    N19:[['F','B','协助资料补正'],['B','TAX','暂定由B经确认的正式渠道申请'],['TAX','B','返回受理或补正反馈']],
    N20:[['TAX','B','正式签发或反馈'],['B','A','交付正式电子证明并取得接收证据'],['F','B','协助更正资料（需更正时）']],
    N21:[['TEAM','OPS','确认退税所需材料已归档于本笔交易档案'],['TEAM','TAX','经人工审批后由授权经办人通过官方税务系统提交退税申报'],['TAX','OPS','返回提交回执、受理状态及申报编号'],['TAX','OPS','发送办理进度、补正通知或处理结果'],['OPS','TEAM','自动更新进度并生成申报/补正跟进任务'],['TEAM','OPS','按通知提交补正材料或正式更正文件'],['TEAM','TAX','经人工审批后通过官方税务系统提交补正资料'],['TAX','OPS','返回补正受理及最新处理状态'],['TEAM','BANK','核实退税实际到账（发生时）']],
    N22:[['A','OPS','提交收款及退税结果'],['E','OPS','提交运输和签收结果'],['F','OPS','提交申报和证明交付记录'],['B','OPS','核对四流、垫资回收和余额并人工结案']],
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
    if(id==='3')return logisticsSequence(ns,R);
    if(id==='5')return fundsSequence(ns,R,mode);
    if(id==='7')return taxSequence(ns[0],R);
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
    const lines=['sequenceDiagram','    autonumber',...participantLines(new Set(['TEAM','REVIEWER','OPS','C','CARRIER','DEST']))];
    for(const node of ns){
      scopedNode(lines,node,node.id==='N06'||node.id==='N10'?'E':'A');
      for(const [from,to,label] of exchanges[node.id])message(lines,from,to,label);
      if(node.id==='N05')appendModificationRequest(lines);
      lines.push('    end','    rect rgb(235, 245, 255)');
      ownAction(lines,'OPS','系统基于交易档案生成待审批资料并按规则检查资料的正确性');
      const review=['REVIEWER'];
      for(const actor of review)message(lines,'OPS',actor,'生成审核待办及本节点核验任务');
      lines.push('    end','    rect rgb(255, 246, 226)');
      for(const actor of review)appendReview(lines,node,R,actor);
      lines.push('    end','    rect rgb(234, 248, 239)','    alt 核验通过且前置条件满足');
      ownAction(lines,'OPS','保存审核记录并交接下一节点');
      lines.push('    else 未通过或前置条件不满足');
      message(lines,'OPS',review[0],'退回补正，暂停受影响交接');
      lines.push('    end','    end');
    }
    return lines.join('\n');
  }
  function fundsSequence(ns,R,mode){
    const lines=['sequenceDiagram','    autonumber',...participantLines(new Set(['TEAM','REVIEWER','OPS','C','D','CIPS','BANK','PAYBANK']))];
    const find=id=>ns.find(n=>n.id===id);
    const n11=find('N11'),n12=find('N12'),n13=find('N13'),n14=find('N14');
    scopedNode(lines,n11,'D');
    message(lines,'D','CIPS','将多笔货款合并为一笔CIPS汇款至B的银行账号，并在水单附言逐笔列明交易建档ID及金额；全额先记CNH不可用余额');
    message(lines,'CIPS','BANK','提交合并汇款及1:1..N付款明细');
    message(lines,'BANK','OPS','发送CIPS水单与实际入账信息；全额先记CNH不可用余额');
    lines.push('    end','    rect rgb(235, 245, 255)');
    message(lines,'OPS','OPS','系统根据水单附言中的交易建档ID及款项信息，逐笔关联交易档案');
    ownAction(lines,'OPS','总分对账：同币种入账本金＝已关联明细＋未匹配差额；差额独立挂账并记录原路索引与账龄');
    lines.push('    end','    rect rgb(255, 246, 226)');
    appendReview(lines,n11,R,'REVIEWER');
    lines.push('    end');
    scopedNode(lines,n12,'OPS');
    lines.push('    opt 存在已关联且未占用的额度');
    ownAction(lines,'OPS','仅按已关联额度生成国际付款发票INVOICE，绑定交易档案ID、水单及分配明细');
    message(lines,'OPS','REVIEWER','提交付款发票及水单匹配清单，人工核验：'+R.forNode(n12).map(rule=>rule.name).join('；'));
    ownAction(lines,'REVIEWER','逐笔审核交易档案、付款发票及合并金额分配');
    lines.push('    alt 人工审批通过');
    message(lines,'REVIEWER','OPS','批准对应付款发票与贸易核验入账资料');
    message(lines,'OPS','D','发送审批通过的付款发票及交易明细');
    scopedNode(lines,n13,'B');
    message(lines,'OPS','REVIEWER','贸易核验入账核验清单：'+R.forNode(n13).map(rule=>rule.name).join('；'));
    ownAction(lines,'REVIEWER','核对已批准发票、水单明细及贸易核验入账申请');
    message(lines,'OPS','BANK','提交已审批的付款发票及CIPS水单，申请贸易核验入账；附对应交易档案明细');
    ownAction(lines,'BANK','核验贸易背景、付款关系及合同累计可收额度；CIPS支付清算成功不代替本行核验');
    lines.push('    alt 外部材料审批通过');
    message(lines,'BANK','OPS','银行材料核验通过，继续确认实际入账及可用状态；此时仍不可用');
    lines.push('    alt 对应额度贸易核验入账成功');
    message(lines,'BANK','OPS','返回可独立核实的逐笔贸易核验入账结果、实际入账及可用状态凭证');
    ownAction(lines,'OPS','贸易核验入账完成后幂等核销对应CNH不可用额度，按银行实际确认金额及费用记国内人民币可用余额；未成功部分继续留在CNH不可用余额');
    ownAction(lines,'OPS','读取步骤1交易档案已批准佣金规则：计费基数、费率、计价币种/换算、税费口径、分批规则及累计上限');
    ownAction(lines,'OPS','按贸易核验入账成功对应交易档案计算本次佣金/手续费，核对累计已扣金额及上限；贸易核验入账未成功或规则不一致时不得扣取');
    lines.push('    alt 佣金计算及档案规则核验通过');
    message(lines,'OPS','BANK','以批准版本和幂等指令，将佣金从B人民币结算银行账户真实划转至独立B收益银行账户');
    message(lines,'BANK','OPS','返回来源扣账和收益入账双边流水及执行号；单边或未知结果保持在途锁额');
    ownAction(lines,'OPS','双边金额币种与执行号核实后确认收益划转完成；未核清不得放行A净付款');
    message(lines,'OPS','REVIEWER','提交人民币贸易核验入账额、银行费、佣金扣取、B收益账户入账及A净付款核验清单');
    lines.push('    else 规则缺失、金额超限或计算不一致');
    message(lines,'OPS','REVIEWER','暂停本笔结款，登记佣金计算差异并退财务复核；不得扣取或放行A净付款');
    lines.push('    end');
    lines.push('    else 贸易核验入账处理中、失败、冻结或金额差异');
    message(lines,'BANK','OPS','返回处理中或失败原因，对应额度继续记CNH不可用；本次不得扣佣或转入B收益账户');
    lines.push('    end','    else 材料不通过');
    message(lines,'BANK','OPS','银行核验未通过，贸易核验入账失败并返回原因');
    message(lines,'BANK','OPS','记录失败，对应CNH继续不可用；补件形成新版本，重新人工审批及外部材料审批');
    lines.push('    end','    end','    else 内部人工审批不通过');
    message(lines,'REVIEWER','OPS','退回修订，不发送发票或提交贸易核验入账；对应CNH保持不可用');
    lines.push('    end','    end','    end');
    lines.push('    opt CNH不可用余额中存在找不到明细的差额');
    ownAction(lines,'OPS','建立未匹配受限挂账与账龄台账，保留原汇款编号、付款方与原始水单，不转人民币可付或收益');
    message(lines,'B','REVIEWER','核查认领依据；本场景不含退款，差异未解决不得结案');
    lines.push('    end');
    message(lines,'C','B','提供真实收货主体资料；实际签收在N10核验');
    lines.push('    opt 仅对已贸易核验入账成功的对应额度进行后续结算');
    scopedNode(lines,n14,'B');
    message(lines,'B','BANK','核对逐笔贸易核验入账回执、实际入账金额及费用');
    message(lines,'BANK','B','提供逐笔贸易核验入账执行明细与扣费');
    message(lines,'B','OPS','核对国内人民币可用余额、贸易核验入账费用、步骤1佣金规则及A净应付金额');
    ownAction(lines,'B','复核本次佣金扣取、B收益账户入账及累计上限；佣金随货款贸易核验入账流程处理，不由境外买方另行付款');
    message(lines,'OPS','REVIEWER','提交结算净额及费用核对清单：'+R.forNode(n14).map(rule=>rule.name).join('；'));
    appendReview(lines,n14,R,'REVIEWER');
    lines.push('    end','    end');
    const pre=find('N15'),post=find('N16');
    if(mode==='all')lines.push('    alt 出口前预付款');
    if(pre){
      scopedNode(lines,pre,'B');
      message(lines,'B','OPS','申请预付款并核对获批资金来源、额度及同一F授权');
      appendReview(lines,pre,R,'REVIEWER');
      lines.push('    end');
    }
    if(mode==='all')lines.push('    else 出口后付款');
    if(post){
      scopedNode(lines,post,'B');
      message(lines,'OPS','REVIEWER','提交正式附件2、放行、贸易核验入账及国内人民币可用余额证据');
      appendReview(lines,post,R,'REVIEWER');
      lines.push('    end');
    }
    if(mode==='all')lines.push('    end');
    const n17=find('N17');
    if(n17){
      scopedNode(lines,n17,'B');
      message(lines,'B','PAYBANK','按批准净额及核实账户向A付款');
      message(lines,'PAYBANK','B','返回实际付款结果');
      message(lines,'A','BANK','核对人民币实际到账');
      message(lines,'A','B','确认本笔收款');
      message(lines,'OPS','REVIEWER','审核付款结果：'+R.forNode(n17).map(rule=>rule.name).join('；'));
      ownAction(lines,'REVIEWER','核对付款银行结果及A到账确认');
      message(lines,'REVIEWER','OPS','记录本笔收款与清偿状态');
      message(lines,'OPS','A','确认最终到账及本笔关联');
      lines.push('    end');
    }
    return lines.join('\n');
  }
  function entrySequence(node,R){
    const lines=['sequenceDiagram','    autonumber',...participantLines(new Set(['TEAM','REVIEWER','OPS','FILES','DB','D']))];
    lines.push('    rect rgb(255, 246, 226)');
    ownAction(lines,'A',node.id+' '+clean(node.title));
    message(lines,'A','A','收集供应商、货物单证及C收货主体、送货地址');
    message(lines,'A','OPS','一次性填写上述两部分信息并提交原件');
    message(lines,'B','OPS','步骤1确定佣金：A/B确认计费基数、费率、计价币种/换算依据、税费口径、分批规则及累计上限；确定随货款贸易核验入账后从A结款中扣取的规则');
    ownAction(lines,'B','归档佣金规则及A/B确认依据，绑定交易档案版本；不登记境外买方独立付款或佣金INVOICE');
    lines.push('    opt 运输信息已收集（步骤1可缺省）');
    message(lines,'A','OPS','填写收集到的口岸与运输信息');
    lines.push('    end');
    message(lines,'D','OPS','自行填写付款主体及与C的商业关系，提交支持材料');
    lines.push('    end','    rect rgb(235, 245, 255)');
    ownAction(lines,'OPS','系统基于交易档案生成待审批资料并按规则检查资料的正确性');
    ownAction(lines,'OPS','运输信息缺省不阻断步骤1，后续运输节点补齐；本步骤不对接收款银行');
    message(lines,'OPS','REVIEWER','提交待审批资料、规则检查结果及待核项');
    lines.push('    end','    rect rgb(255, 246, 226)');
    message(lines,'OPS','REVIEWER','人工核验清单：'+R.forNode(node).map(rule=>rule.name).join('；'));
    ownAction(lines,'REVIEWER','人工最终审批：审核ABEF业务主体和D提交的资料及规则检查结果');
    message(lines,'REVIEWER','OPS','人工最终审批');
    lines.push('    end','    alt 人工审核员审批通过且必填资料齐全、待核问题已解决','    alt 原件保存及交易档案关联成功');
    message(lines,'OPS','FILES','保存原件及文件版本，取得文件标识');
    message(lines,'FILES','OPS','返回原件存储标识');
    message(lines,'OPS','DB','保存关键字段、文件索引、审核记录及交易档案，锁定佣金计费规则版本供步骤5贸易核验入账后扣取；变更须重审');
    message(lines,'DB','OPS','返回交易档案标识');
    message(lines,'OPS','DB','生成唯一交易单，关联交易档案与批次');
    message(lines,'DB','OPS','返回交易单号及档案关联');
    message(lines,'OPS','A','返回交易单号及提交结果');
    message(lines,'OPS','D','返回本方提交结果');
    ownAction(lines,'OPS','原件及版本保存在文件存储系统；数据库保存关键字段与原件索引');
    lines.push('    else 存储或关联失败');
    ownAction(lines,'OPS','存储或关联失败保持待处理，不返回交易创建成功');
    lines.push('    end','    else 未通过、必填缺失或存在未解决问题');
    message(lines,'OPS','A','退回本方待补内容，不生成交易单');
    message(lines,'OPS','D','退回本方待补内容，补正后重新核实与审批');
    lines.push('    end');
    ownAction(lines,'OPS','系统及存储交互为设计流程，当前离线页面尚未接入后台能力');
    return lines.join('\n');
  }
  function taxSequence(node,R){
    const lines=['sequenceDiagram','    autonumber',...participantLines(new Set(['TEAM','REVIEWER','OPS','TAX','BANK']))];
    scopedNode(lines,node,'TEAM');
    message(lines,'TEAM','OPS','确认本笔交易档案中的出口、合同、发票、结算及证明材料已收集');
    lines.push('    end','    rect rgb(235, 245, 255)');
    ownAction(lines,'OPS','系统基于交易档案生成待审批资料并按规则检查资料的正确性');
    message(lines,'OPS','REVIEWER','提交退税资料包、批次核对结果及检查问题，等待人工审批');
    lines.push('    end','    rect rgb(255, 246, 226)');
    message(lines,'OPS','REVIEWER','人工核验清单：'+R.forNode(node).map(rule=>rule.name).join('；'));
    ownAction(lines,'REVIEWER','人工审核退税资料与申报批次');
    lines.push('    end');
    lines.push('    alt 人工审批通过');
    message(lines,'REVIEWER','OPS','批准本版本退税资料');
    message(lines,'TEAM','TAX','授权经办人通过官方税务系统提交退税申报');
    message(lines,'TAX','OPS','返回提交回执、受理状态及申报编号');
    lines.push('    loop 每日定时或收到税务机关通知');
    message(lines,'TAX','OPS','同步退税办理进度、补正要求或处理结果');
    ownAction(lines,'OPS','按申报编号更新交易档案状态并生成跟进任务');
    message(lines,'OPS','TEAM','通知退税进度、补正要求及后续待办');
    lines.push('    opt 税务机关要求补正');
    message(lines,'TEAM','OPS','提交补正材料或正式单据更正');
    lines.push('    rect rgb(235, 245, 255)');
    ownAction(lines,'OPS','系统基于交易档案生成待审批资料并按规则检查资料的正确性');
    message(lines,'OPS','REVIEWER','提交补正资料及版本差异审批');
    lines.push('    end','    rect rgb(255, 246, 226)');
    ownAction(lines,'REVIEWER','人工审核补正资料及影响范围');
    message(lines,'REVIEWER','OPS','批准本版本补正资料');
    lines.push('    end','    rect rgb(234, 248, 239)');
    message(lines,'TEAM','TAX','授权经办人通过官方税务系统提交补正资料');
    message(lines,'TAX','OPS','返回补正提交回执及最新状态');
    lines.push('    end','    end');
    lines.push('    rect rgb(234, 248, 239)');
    message(lines,'TAX','OPS','返回正式处理结果及退税到账状态');
    ownAction(lines,'OPS','归档提交、受理、补正、处理结果及到账记录');
    lines.push('    end','    end');
    lines.push('    else 人工审批未通过');
    message(lines,'REVIEWER','TEAM','退回补正，审批通过前不得向官方税务系统提交');
    lines.push('    end');
    return lines.join('\n');
  }
  const api={groups,actors,forNode,nodesFor,sequence};
  root.EXPORT_PROCESSES=api;
  if(typeof module!=='undefined')module.exports=api;
})(globalThis);
