'use strict';
(function(root){
  const common=root.EXPORT_SYSTEM_USECASES_MODEL||(typeof require==='function'?require('./system-usecases-model.js'):null);
  const endpoints=[
    ['context','GetReconciliationContext','GET','/internal/v1/trades/{trade_number}/reconciliation-context','', 'ReconciliationContext',''],
    ['report-create','CreateReconciliationReport','POST','/internal/v1/trades/{trade_number}/reconciliation-reports','ReportInput','ReconciliationReport','report'],
    ['report-read','GetReconciliationReport','GET','/internal/v1/trades/{trade_number}/reconciliation-reports/{report_number}','','ReconciliationReport',''],
    ['case-create','CreateDiscrepancyCase','POST','/internal/v1/trades/{trade_number}/discrepancy-cases','CaseInput','DiscrepancyCase','case_input'],
    ['case-read','GetDiscrepancyCase','GET','/internal/v1/trades/{trade_number}/discrepancy-cases/{case_number}','','DiscrepancyCase',''],
    ['assignment-create','CreateCaseAssignment','POST','/internal/v1/trades/{trade_number}/discrepancy-cases/{case_number}/assignments','AssignmentInput','DispositionResource','assignment'],
    ['hold-create','CreateHoldDecision','POST','/internal/v1/trades/{trade_number}/discrepancy-cases/{case_number}/hold-decisions','HoldInput','DispositionResource','hold'],
    ['propagation-create','CreateGateAcknowledgement','POST','/internal/v1/trades/{trade_number}/discrepancy-cases/{case_number}/gate-acknowledgements','GateAcknowledgementInput','DispositionResource','acknowledgement'],
    ['remedy-create','CreateCaseRemedy','POST','/internal/v1/trades/{trade_number}/discrepancy-cases/{case_number}/remedies','RemedyInput','DispositionResource','remedy'],
    ['remedy-decision','CreateCaseRemedyDecision','POST','/internal/v1/trades/{trade_number}/discrepancy-cases/{case_number}/remedy-decisions','ReviewInput','DispositionResource','decision'],
    ['correction-create','CreateCorrectionApplication','POST','/internal/v1/trades/{trade_number}/discrepancy-cases/{case_number}/correction-applications','CorrectionInput','DispositionResource','application'],
    ['correction-decision','CreateCorrectionDecision','POST','/internal/v1/trades/{trade_number}/discrepancy-cases/{case_number}/correction-decisions','ReviewInput','DispositionResource','decision'],
    ['release-create','CreateReleaseApplication','POST','/internal/v1/trades/{trade_number}/discrepancy-cases/{case_number}/release-applications','ReleaseInput','DispositionResource','application'],
    ['release-decision','CreateReleaseDecision','POST','/internal/v1/trades/{trade_number}/discrepancy-cases/{case_number}/release-decisions','ReviewInput','DispositionResource','decision'],
    ['case-close-create','CreateCaseClosureApplication','POST','/internal/v1/trades/{trade_number}/discrepancy-cases/{case_number}/closure-applications','CaseClosureInput','DispositionResource','application'],
    ['case-close-decision','CreateCaseClosureDecision','POST','/internal/v1/trades/{trade_number}/discrepancy-cases/{case_number}/closure-decisions','ReviewInput','DispositionResource','decision'],
    ['disposition-read','GetCaseDisposition','GET','/internal/v1/trades/{trade_number}/discrepancy-cases/{case_number}/dispositions/{disposition_number}','','DispositionResource',''],
    ['closure-create','CreateTradeClosureApplication','POST','/internal/v1/trades/{trade_number}/closure-applications','ClosureInput','ClosureApplication','application'],
    ['closure-read','GetTradeClosureApplication','GET','/internal/v1/trades/{trade_number}/closure-applications/{application_number}','','ClosureApplication',''],
    ['closure-decision','CreateTradeClosureDecision','POST','/internal/v1/trades/{trade_number}/closure-applications/{application_number}/decisions','ClosureDecisionInput','ClosureDecision','decision'],
    ['closure-decision-read','GetTradeClosureDecision','GET','/internal/v1/trades/{trade_number}/closure-applications/{application_number}/decisions/{decision_number}','','ClosureDecision',''],
    ['acceptance-read','GetReconciliationAcceptance','GET','/internal/v1/trades/{trade_number}/reconciliation-acceptances/{request_key}','','AcceptanceResource','']
  ].map(([id,rpc,method,path,input,output,body])=>({id:'s8-'+id,rpc,method,path,input:input||'—',output,body,
    audience:'内部运营',detail:output+'不可变资源；当前权限校验，非官方成功声明',status:method==='POST'?'201':'200',
    file:'proto/trade/reconciliation/v1/reconciliation.proto',service:'InternalReconciliationService',
    reqMsg:rpc+'ReqMsg',rspMsg:rpc+'RspMsg',responseBody:'resource',query:[],
    timeout:method==='GET'?common.timeouts.read:common.timeouts.write}));
  const specs=[
    ['context','查看四流核对所需的全部资料',['核对经办人'],['context'],
      '核对经办人查看本次批准交易涉及的全部运输批次、报关版本、合同、资金账务、证明、退税和异常案件。系统列出缺项和操作限制；没有权限的人员不能查看他方私密凭据。',
      ['读取批准修订和各域稳定type/id/revision/hash/source事件尾，不借用最新主档',
       '按业务关系枚举全部对象ID集合及集合摘要；空集合与未接域unknown分别返回',
       '列出证据缺口、未决执行、每个有效暂停原因及各目标执行门禁；返回上下文强标签']],
    ['report','生成并查看逐项核对报告',['核对经办人'],['context','report-create','report-read'],
      '核对经办人根据全部相关资料生成报告。报告保留当时使用的每份资料及其版本、完整对象清单、规则版本和逐项核对结果，保存后不能覆盖。有关业务结果仍不明时，报告须明确列出，交易不能据此结案。',
      ['基于已读取向量在事务外计算合同/货物流/单证流/资金流/账务逐项差异',
       '根锁后逐域当前读事件尾与排序对象集合；新增批次/付款/案件或hash不同则REPORT_STALE',
       '重算金额分配与未匹配、三桶与流水、应付已付锁额、凭证分录及冲正，未知为unknown',
       '追加trade_event18完整报告及摘要、规则版、源向量、集合、证据和逐项结果；无业务推进']],
    ['assignment','登记核对差异并分派处理人',['核对经办人','案件协调人'],['report-read','case-create','assignment-create','case-read'],
      '核对经办人针对报告中的具体差异开案，案件协调人指定责任人和处理期限。涉及资金的差额须由资金业务负责处理；分派或转派任务后，案件仍未解决。',
      ['锁报告及根；校验报告条目和来源对象、相同差异源重复开案冲突，不丢其他原因',
       'INSERT合规案件与原报告/条目证据清单，来源业务号支持128字符',
       '追加分派事件保存责任人、明确UTC期限及转派理由；不得以转派关闭案件']],
    ['hold','决定暂停哪些业务并确认落实',['合规经办人','独立合规复核人','所属业务域经办人'],['case-read','hold-create','propagation-create'],
      '合规经办人与独立复核人按原因决定暂停哪些交易、批次、付款或单证操作，再由对应业务确认已落实。同一案件可有多个独立原因，须分别记录；暂停不改变交易原有的已批准阶段。',
      ['独立复核暂停依据，逐原因生成holdReference和精确受影响上下文，不造isHold状态',
       '追加暂停decision_snapshot和affected_contexts，业务域新推进读取同库有效原因并失败关闭',
       '传播确认绑定原决定/原因/对象/源版/操作范围；pending或unknown禁止受影响新执行',
       '技术投递完成不等于业务执行；各域追加接收/执行确认，既有不可逆事实只走原域补救']],
    ['remedy','补交凭据并处理实际差异',['案件责任人','独立合规复核人'],['case-read','remedy-create','remedy-decision','disposition-read'],
      '案件责任人补交凭据，并提交原负责业务已经完成的更正、资金追回或冲正记录，由独立复核人核对。上传附件和填写说明不能代替实际处理；数量、金额或正式依据仍有差异时，问题和暂停原因继续保留。',
      ['读取原差异、原源向量、责任与仍待处置金额；业务事实只由原所属域形成',
       '记录已扫描确切文件版本及原域处置事件稳定引用，补正关联原事件，不覆盖旧材料',
       '独立复核实质余额/数量及证据来源，缺银行/监管真实证明拒绝清零，保留全部暂停原因']],
    ['correction','申请更正原业务并重新审核',['更正申请人','独立更正审批人','原节点经办人','原节点独立审核人','下游业务域经办人'],['correction-create','correction-decision','disposition-read'],
      '申请人指出要更正的原业务环节、批准版本和全部受影响事项，由独立人员批准更正范围。之后须回原环节另建版本、重新审核，并通知后续业务停用受影响的旧批准。允许更正尚不代表新内容已获批准，也不能删除已经执行的事实。',
      ['保存原节点/旧修订/影响对象及依赖边集合；锁相同根和排序所有受影响对象',
       '独立审批核对未执行/执行未知/已执行边界，未知不直接作废外部办理',
       '批准后原节点新修订并重新审批，旧报告及受影响未执行批准失效；下游传播门禁pending即阻断',
       '原域确认失效/重审/重新办理完成后追加确切引用；不可逆外部事实按原域正式更正流程']],
    ['release','申请解除一项暂停原因并确认落实',['案件责任人','独立合规复核人','所属业务域经办人'],['release-create','release-decision','propagation-create','disposition-read'],
      '案件责任人针对一项明确的暂停原因申请解除，独立复核人核实处理依据后决定是否通过。对应业务全部确认解除已落实前，这项原因仍限制操作；其他案件或同案的其他暂停原因继续有效。',
      ['保存指定原暂停事件、实质处置源引用、当前完整向量及证据；申请不改变暂停',
       '复核人与申请人不同，当前读原原因仍有效且范围未变；陈旧/缺证据拒绝',
       '通过只追加该原因解除决定及逐域传播要求；解除待确认仍阻断，不删除原暂停',
       '所有目标确认后该原因不再生效；其他holdReference保持原状态，不以关案替代解除']],
    ['case-close','核实问题已解决并独立关闭案件',['案件责任人','独立关案复核人'],['case-close-create','case-close-decision','case-read'],
      '案件责任人申请关案，独立复核人核对每项实际处理结果。涉及资金差额的，须先取得资金业务关闭原差异的记录，并核对金额相符；合规关案不能代替资金差异关闭。关案永不自动解冻，仍须按每项原因另行解除暂停。',
      ['申请绑定报告项及原域差异处置事件，合规和资金差异各有明确独立结论',
       '独立复核当前未解事项与实质差额，资金差异未闭环或未知结果则拒绝关案',
       '通过追加关案事件并更新案件状态，所有暂停/解除历史保持；即使案件已关也仍查有效原因']],
    ['closure-apply','申请正常结案',['结案申请人'],['context','report-read','closure-create','closure-read'],
      '申请人为已批准交易选择最新核对报告，申请正常结案。系统须核对全部相关资料及版本仍未变化、资金金额能对上、账务借贷平衡、正式外部凭据和各项必要结论齐全，且没有未解决的异常；任一条件不足都不能进入结案审批。',
      ['读取报告18原文/摘要/规则版，锁根后对比全部向量及对象集合，不接受客户端allPassed',
       '重算毛额=已分配+未匹配，余额=受限+可用+锁额，资金事件/流水/应付实付守恒',
       '逐凭证借贷平衡、账户从分录重算、冲正不覆盖，A到账/服务费/税款分别核实',
       '要求真实签署/海关/银行/税务证据和终局范围，未决执行/未解案件/原因/传播拒绝',
       '全部条件齐才追加trade_event19申请；不改变生命周期，不提供特殊结案入口']],
    ['closure-review','独立审批正常结案或退回',['独立结案审批人'],['closure-read','closure-decision','closure-decision-read'],
      '审批人须与申请人不同，审批前重新核对全部资料、资金、账务和正式外部凭据。申请后新增记录或资料变化会使原报告失效，须重新核对。税务最终拒绝或不适用不能自动算作正常完成；本版没有特殊结案入口。',
      ['锁根后当前读申请及报告全部源集合/事件尾，再验规则当前有效与资金/账务/外部证据',
       '申请人等于审批人拒绝；报告陈旧/资金不平/外部结果unknown不得正式结案',
       '退回追加trade_event20及逐项理由，生命周期仍8；补正后新报告/新申请',
       '通过仅追加trade_event17、决定和8转10同短事务提交；终态不可重开且无特殊执行路径']],
    ['query','查询案件、审批记录和原请求结果',['核对经办人','案件责任人','独立结案审批人'],['case-read','disposition-read','closure-read','closure-decision-read','acceptance-read'],
      '各方按权限查看案件和审批记录。网络中断或提交结果不明时，用原身份、原入口、原请求编号和原内容查询当时保存的回执；当前案件状态另查，不能拿它替代原请求结果，也不能重复作出决定。',
      ['当前身份/对象授权后GET只读；终态新写拒绝，但同键原文允许回放',
       '主库按原主体/受众/键查受理；原冻结投影/Location/正文/标签返回，不生成新决定',
       '同键异文409，查无受理返回未确定并保留原键，不能擅自换键或将超时当撤销']]
  ];
  const blackbox=[
    ['查看已批准交易的全部核对资料','返回有关对象清单、资料版本、适用规则和缺项，尚未作出核对结论'],
    ['按所见资料生成核对报告','返回保存后的报告编号、逐项差异和结果未明事项，尚未结案'],
    ['针对具体差异开案','返回新案件，等待指定处理人和期限'],
    ['提出暂停原因及涉及的对象、操作范围','显示暂停决定和各业务的落实情况，未确认落实的继续限制操作'],
    ['补交凭据和原负责业务的实际处理记录','保存补充材料或逐项退回，原暂停继续有效'],
    ['申请更正原业务，列明全部影响范围','显示范围审批结果、原环节重审及后续业务的处理情况'],
    ['针对一项暂停原因申请解除','显示独立复核和各业务落实情况，其他暂停原因继续有效'],
    ['提交关案申请及资金差异已解决的依据','显示独立关案结果和仍有效的暂停，不自动解冻'],
    ['选择最新核对报告并申请正常结案','符合条件时等待独立审批，否则列出未满足项；交易阶段暂不改变'],
    ['查看原申请和对应报告，独立批准或退回','通过则正常结案；退回则保持已批准阶段，并列明原因'],
    ['查询原案件、审批记录或原请求结果','返回本方可见的记录；已受理请求返回原回执，未确定的说明查询方式']
  ];
  const commandSteps={
    'report-create':['对比所选完整向量/规则版与根锁后当前读；新增对象或事件即REPORT_STALE',
      '重算三桶/流水、应付/已付、凭证借贷/账户/冲正，逐项记录pass/fail/unknown',
      '追加trade_event18完整报告、对象集合、规则版、证据及源事件尾；不推进生命周期'],
    'case-create':['锁原报告及明确差异项，核实所属域/对象及稳定差异源，同源重复开案拒绝',
      'INSERT独立案件与原报告证据清单，状态1未分派；资金权威事实不在本域修改'],
    'assignment-create':['锁原案件与当前责任/期限，校验协调人分派权限',
      '追加action1分派事件并更新责任人/UTC期限，案件保持未解决；返回处置资源Location'],
    'hold-create':['核对经办/独立复核身份及精确原因、目标对象和操作范围',
      '追加action2/result2暂停决定，holdReference等于本事件号；affected_contexts逐目标冻结',
      '新执行同根查询所有原因，传播pending失败关闭；交易生命周期不改为暂停态'],
    'propagation-create':['读取原暂停或解除决定、原原因及本业务域确切目标，拒绝跨范围借用确认',
      '核验所属域已经执行门禁的稳定事件引用；追加action4/result1业务确认，投递成功不替代执行',
      '解除必须每目标applied才移除该原因，仍有其他原因继续阻断；不覆写历史'],
    'remedy-create':['锁原差异和原事件，读取确切已扫描文件与原域实质处置引用',
      '追加action3/result1补正提交，原金额差异与暂停不随上传或备注自动消失'],
    'remedy-decision':['独立读取原补正、最新原域事实和源向量；禁止补正人自审',
      '逐项核验数量/资金/官方依据，缺实质证据退回；追加action4/result2或3决定',
      '核实补正不等于解除原因或关闭资金差异，均另走独立资源'],
    'correction-create':['保存原节点/原批准修订、完整受影响对象及依赖边，绑定当前完整源向量',
      '追加action5/result1更正范围申请；不改原批准和任何外部办理事实'],
    'correction-decision':['独立审批范围，区分未执行/执行未知/已执行，未知先原号查单而非直接作废',
      '追加action6/result2或3及失效范围；通过使旧报告与受影响未执行批准失效',
      '冻结原节点重审及下游传播门禁要求；pending不准新执行，不批准更正后的业务事实'],
    'release-create':['确认指定holdReference属于本案件且有效，读取实质补正源及完整向量',
      '追加action7/result1解除申请，原原因继续有效，不能一次性全交易解冻'],
    'release-decision':['锁原申请/原暂停，当前读补正及向量，独立人员与申请人不同',
      '通过仅追加action8/result2指定原因解除；退回result3保持原原因，其他原因从不受影响',
      '通过生成逐目标传播要求，pending仍阻断；不把本决定当作已执行'],
    'case-close-create':['核实本案原域实质处置、资金差异独立关闭引用及全部待办',
      '追加action9/result1关案申请，不自动关闭案件或解除暂停'],
    'case-close-decision':['独立读取原申请，核对所有原域处置；资金差额未清、资金差异未关或未知则退回',
      '追加action9/result2或3，只有通过更新案件状态4；仍按全部原暂停和解除事件查门禁'],
    'closure-create':['锁报告18原文及当前全部源集合/事件尾/规则版，任一陈旧拒绝',
      '重算毛额=已分配+未匹配、三桶/流水/投影、应付/实付/锁额及服务费/退税归属',
      '逐凭证/账户/冲正勾稽；真实签署/监管/银行/税务依据必须齐全',
      '任何未解案件/原因/传播/执行unknown失败关闭，全部满足才追加19；生命周期仍8'],
    'closure-decision':['读取原申请人及报告18，独立审批并再次当前读最新向量/完整集合和规则',
      '重新验证资金守恒/账务平衡/真实外证及全部异常原因；申请后新增事实也阻断',
      '退回追加trade_event20及逐项理由仍8；全部满足才追加17和8转10同短事务',
      '不提供特殊结案路径，终态不可重开；超时原键查询不可另键重做']
  };
  const useCases=specs.map(([id,name,actors,links,description,steps],index)=>{
    const read=id==='context'||id==='query';
    let systemSequence=`sequenceDiagram
    actor PERSON as ${actors[0]}
    participant SYSTEM as 代理出口系统
    PERSON->>SYSTEM: ${blackbox[index][0]}
    SYSTEM-->>PERSON: 显示当前资料版本、涉及事项、缺项和本方可办操作
    ${read?'PERSON->>SYSTEM: 查看有权读取的资料，不作修改':'PERSON->>SYSTEM: 核对本次内容并确认提交'}
    SYSTEM-->>PERSON: ${blackbox[index][1]}`;
    if(actors.length>1&&!['assignment','query'].includes(id))systemSequence+=`
    actor REVIEWER as ${actors[1]}
    REVIEWER->>SYSTEM: 独立查看本次依据、范围与当前事实
    SYSTEM-->>REVIEWER: 显示原提交和仍未满足的条件
    REVIEWER->>SYSTEM: ${id==='hold'?'独立核定暂停原因，以及每项业务需停止的操作':'独立批准或退回申请，逐项写明理由'}
    SYSTEM-->>REVIEWER: ${blackbox[index][1]}`;
    if(id==='assignment')systemSequence+=`
    actor COORDINATOR as 案件协调人
    COORDINATOR->>SYSTEM: 查看原差异案件并分派具体责任人和期限
    SYSTEM-->>COORDINATOR: 原案件分派结果，不表示问题已解决`;
    if(['hold','release'].includes(id))systemSequence+=`
    actor OWNER as 所属业务域经办人
    OWNER->>SYSTEM: 查看本业务需暂停或恢复的具体操作及原因
    SYSTEM-->>OWNER: 待执行范围及其他仍有效原因
    OWNER->>SYSTEM: 确认本业务已按原决定落实操作限制或解除
    SYSTEM-->>OWNER: 显示各项落实结果；其他暂停原因仍有效`;
    if(id==='correction')systemSequence+=`
    actor EDITOR as 原节点经办人
    actor NODEREVIEWER as 原节点独立审核人
    actor DOWNSTREAM as 下游业务域经办人
    EDITOR->>SYSTEM: 按已批准范围在原节点建立新修订并重新送审
    NODEREVIEWER->>SYSTEM: 独立审核确切新修订，原批准不沿用
    SYSTEM-->>NODEREVIEWER: 新审查结果及仍待执行的传播范围
    DOWNSTREAM->>SYSTEM: 确认本域旧批准失效及新依据重审结果
    SYSTEM-->>DOWNSTREAM: 显示本业务的限制已落实或尚待补充；外部执行结果不明时仍不能继续`;
    const operations=steps.map(step=>'      APP->>DB: '+step).join('\n');
    let sequence=read?`sequenceDiagram
    autonumber
    participant PAGE as 内部授权查询者
    participant APP as 单体内部接口
    participant DB as 同一MySQL主库
    PAGE->>APP: GET具体资源，客户端5秒应用4秒
    APP->>APP: 当前身份、受众及对象授权
${operations}
    APP-->>PAGE: 200资源及强ETag，Cache-Control no-store
    Note over APP,DB: 无业务写；未知原受理保留原键，不能推定未提交`: '';
    if(!read){
      const writes=links.filter(link=>commandSteps[link]);
      const actorFor=link=>link==='propagation-create'?'OWNER':link==='assignment-create'?'REVIEWER':
        /(?:remedy-decision|correction-decision|release-decision|case-close-decision|hold-create)/.test(link)?'REVIEWER':'PAGE';
      sequence=`sequenceDiagram
    autonumber
    participant PAGE as ${actors[0]}
    ${actors[1]?'participant REVIEWER as '+actors[1]:''}
    ${['hold','release'].includes(id)?'participant OWNER as 所属业务域经办人':''}
    ${id==='correction'?'participant EDITOR as 原节点经办人\n    participant NODEREVIEWER as 原节点独立审核人\n    participant DOWNSTREAM as 下游业务域经办人':''}
    participant APP as 单体内部接口
    participant DB as 同一MySQL主库
    participant FILE as 私有S3与ClamAV
    PAGE->>APP: GET本目标上下文/原资源，客户端5秒应用4秒
    APP-->>PAGE: 精确当前标签、完整范围、允许意图和待补项
    opt 目标需要新证据
      PAGE->>APP: 复用原上传/确认任务，明确文件所属业务对象
      APP->>FILE: 事务外确切VersionId/摘要/ClamAV，持久任务租约退避恢复
      FILE-->>APP: 已就绪不可变引用或pending；未就绪不能业务提交
    end`;
      if(id==='report')sequence+=`
    APP->>APP: 事务外按完整源快照及规则计算报告草稿，不把计算期快照当最终最新`;
      for(const link of writes){
        const endpoint=endpoints.find(endpoint=>endpoint.id==='s8-'+link),person=actorFor(link);
        sequence+=`
    Note over ${person},APP: 独立HTTP/RPC消息 ${endpoint.rpc}，不是整个用例合成一笔请求
    ${person}->>APP: 明确该次意图，POST ${endpoint.path} 原键/If-Match/确认，10秒/8秒
    APP->>APP: 校验当前身份/受众/对象权限，规范化该次正文
    APP->>DB: BEGIN READ COMMITTED，先查原主体受众键受理
    alt 同键原文已有冻结结果
      DB-->>APP: 原资源/Location/标签，优先于新版本、确认消费和终态
      APP-->>${person}: 原201结果；异文409；不重复领域决定
    else 当前独立新写
      APP->>DB: 固定锁序：交易根（多单二进制升序）、物流/关务/税务根、资金范围/事务/分配、account id升序、案件/事件尾/文件/确认/受理
      APP->>DB: 根锁后再查原键，FOR UPDATE当前读源向量及完整对象集合
      APP->>DB: 新意图校验强标签、独立人员/确认绑定及终态，失败ROLLBACK
${commandSteps[link].map(step=>'      APP->>DB: '+step).join('\n')}
      APP->>DB: 本次业务事实与最小冻结回执同短事务COMMIT
      APP-->>${person}: 201具体资源Location；COMMIT未知503原键恢复
    end`;
      }
      if(id==='correction')sequence+=`
    EDITOR->>APP: 所属原域版本资源建立新修订并送审，绑定范围决定稳定引用
    APP->>DB: 原域另一个短事务复查范围/门禁，保留旧批准，追加新修订与送审事件
    NODEREVIEWER->>APP: 原域独立审核确切新修订，外部正式更正仍须真实证据
    APP->>DB: 原域另一个短事务形成新审查事实及待传播清单；未知外部执行仍阻断
    DOWNSTREAM->>APP: 所属域原入口核实旧批准失效/新依据重审，提交稳定执行引用
    APP->>DB: 各所属域分别短事务确认门禁，缺稳定接口/证据则pending，不假造传播成功`;
      sequence+=`
    Note over APP,FILE: 全部文件与外部I/O事务外，后台原任务恢复；无真实外证不造成功
    Note over APP,DB: 各次独立受理；关案不解冻，终态仅原回放；步骤四至七缺稳定来源则unknown阻断`;
    }
    return {id:'s8-'+id,code:'步骤八用例'+(index+1),name,actor:actors[0],actors,description,
      transaction:steps.join('；'),intent:name,endpoints:links.map(link=>'s8-'+link),systemSequence,sequence,diagramScale:0.7};
  });
  const rules=[
    ['范围','N22/N23；单体同库，暂停与交易生命周期正交；无isClosed/isHold、无特殊结案执行、无垫资授信换汇。'],
    ['报告事实','trade_event18持有不可变完整报告，19申请，20退回，17正式结案；不得放到技术ledger隐藏业务事实。'],
    ['源一致性','源type/id/revision/hash/source事件尾和完整对象集合及规则版一起冻结；最终根锁后当前读重验，不仅比较已有对象版本。'],
    ['资金守恒','仅CNY精确十进制；毛额=分配+未匹配；三桶/流水/投影、应付/已付/锁额、费用与服务费、退税归属、分录借贷及账户重算逐项核验。'],
    ['暂停原因','每个holdReference独立；解除指定原因须独立复核和逐域确认，关案不能解除任何暂停，其他原因仍阻断。'],
    ['更正重审','原节点更正按批准范围新修订重审，旧报告及受影响未执行批准失效；执行未知保留阻断，不覆盖原外部事实。'],
    ['正常结案','仅8→10；最新事实、资金守恒、账务平衡、真实外部证据、无未解异常/暂停/未知结果；终态禁止新写但允许原受理回放。'],
    ['权威与范围','合规案件不直接修改资金/税务事实，资金差异独立关闭；技术任务只存投递/租约/幂等，不充当业务决定。'],
    ['跨步骤未接','步骤四至七稳定引用尚未提供则unknown失败关闭；不把合成fixture当作官方或银行成功。'],
    ['传输','REST强资源、显式ReqMsg/RspMsg及resource；内部受众凭证，不以浏览器外部凭证代替；图默认70%。']
  ];
  const model={id:'step-eight',name:'步骤八 · 四流核对与异常',nodeIds:['N22','N23'],
    actors:[...new Set(useCases.flatMap(goal=>goal.actors))],endpoints,useCases,rules,
    errors:[...common.errors,
      ['REPORT_STALE / RULE_VERSION_STALE',409,'FAILED_PRECONDITION',false,'重读全量上下文生成新报告，不修改旧报告'],
      ['HOLD_ACTIVE / PROPAGATION_PENDING / OPEN_EXCEPTION / EXECUTION_UNKNOWN',409,'FAILED_PRECONDITION',false,'逐原因处置及原域恢复查单，未知不等于失败'],
      ['SELF_REVIEW / SCOPE_MISMATCH / TERMINAL_TRADE',409,'FAILED_PRECONDITION',false,'独立复核及原范围；终态仅原受理恢复'],
      ['CASE_NOT_FOUND',404,'NOT_FOUND',false,'当前主体仅可引用本交易可见原案件，不存在与不可见统一拒绝'],
      ['CASE_TERMINAL',409,'FAILED_PRECONDITION',false,'已关案件不能新建暂停，但原有效原因仍须单独解除'],
      ['FUNDS_UNBALANCED / ACCOUNTING_UNBALANCED / EXTERNAL_EVIDENCE_MISSING / SOURCE_UNKNOWN',422,'FAILED_PRECONDITION',false,'原所属域补正实质事实与正式证据，不用手工通过标志'],
      ['CASE_NOT_RESOLVED / MONEY_DIFFERENCE_OPEN',422,'FAILED_PRECONDITION',false,'案件及资金差异分别独立关闭，不自动解除暂停']]};
  root.EXPORT_STEP_EIGHT_USECASES_MODEL=model;
  if(typeof module==='object'&&module.exports)module.exports=model;
})(globalThis);
