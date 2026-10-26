'use strict';
(function(root){
  const common=root.EXPORT_SYSTEM_USECASES_MODEL||(typeof require==='function'?require('./system-usecases-model.js'):null);
  const endpoints=[
    ['create-shipment','CreateShipment','POST','/api/v1/trades/{trade_number}/shipments','ShipmentPlan','ShipmentReceipt','plan','外部服务','供应商在批准依据下分配货物并建立批次；交易根强标签控制跨批分配，不等于获准发运'],
    ['shipment-read','GetShipment','GET','/api/v1/shipments/{shipment_number}','—','Shipment','','外部服务','当前计划、冻结计划版、已核实进度及本方可见证据；缺物流协议不冒称已获准出运'],
    ['plan-replace','ReplaceShipmentPlan','PUT','/api/v1/shipments/{shipment_number}/plan','ShipmentPlan','ShipmentReceipt','plan','外部服务','仅计划1且无待审/已接受外部执行，整体替换当前计划及分配，原冻结计划及回执不改'],
    ['evidence-create','CreateShipmentEvidence','POST','/api/v1/shipments/{shipment_number}/evidence-submissions','ShipmentEvidenceInput','ShipmentEvidence','evidence','外部服务','供应商或已核实物流公司提交本方证据声明；受理pending_review，不直接变业务进度'],
    ['evidence-read','GetShipmentEvidence','GET','/api/v1/shipments/{shipment_number}/evidence-submissions/{submission_id}','—','ShipmentEvidence','','外部服务','读取原提交及其审查结果；原命令重入仍只回放首次受理'],
    ['shipment-context','GetShipmentReviewContext','GET','/internal/v1/shipments/{shipment_number}/review-context','—','ShipmentReviewContext','','内部运营','内部独立读取计划、确切证据、缺失门禁和未闭环异常，不借用供应商凭证'],
    ['evidence-review','CreateShipmentEvidenceDecision','POST','/internal/v1/shipments/{shipment_number}/evidence-decisions','EvidenceDecisionInput','ShipmentReceipt','decision','内部运营','独立核实证据/主体/原计划版/前序及合同门禁后追加物流事件；无真实放行不确认出境'],
    ['exception-resolve','CreateShipmentExceptionDisposition','POST','/internal/v1/shipments/{shipment_number}/exception-dispositions','ExceptionDispositionInput','ShipmentReceipt','disposition','内部运营','仅处置原未闭环异常；恢复到事件冻结的原进度，不允许客户端任意跳转；灭失证据齐才失败9'],
    ['shipment-cancel','CreateShipmentCancellation','POST','/internal/v1/shipments/{shipment_number}/cancellation-decisions','CancellationInput','ShipmentReceipt','cancellation','内部运营','仅计划/订舱且无未知执行、无提货/出运；已订舱须真实撤销确认；原子撤销有效分配不抹历史']
  ].map(([id,rpc,method,path,input,output,body,audience,detail])=>({id,rpc,method,path,input,output,body,audience,detail,
    status:method==='POST'?'201':'200',reqMsg:rpc+'ReqMsg',rspMsg:rpc+'RspMsg',responseBody:'resource',query:[],
    file:'proto/trade/logistics/v1/logistics.proto',service:audience==='内部运营'?'InternalLogisticsOperationsService':'ExternalLogisticsService',
    timeout:method==='GET'?common.timeouts.read:common.timeouts.write}));
  const specs=[
    ['shipment-plan','建立批次并分配批准货物','供应商经办人',['contract-basis','create-shipment','shipment-read'],
      '供应商将已批准交易中的货物分到运输批次。各批次累计数量和人民币金额不能超过批准的商品数量、金额；收货人和物流公司以该次批准保存的资料为准。',
      '交易根锁先查原请求，核实原因2快照和同根全部有效分配；精确DECIMAL校验后取本地批次号，批次/商品分配/运输区段/原计划封套和最小回执同COMMIT；尚无实际出运事实'],
    ['shipment-amend','修改或取消未执行运输计划','供应商与出口代理有权人员',['shipment-read','plan-replace','shipment-context','shipment-cancel'],
      '供应商只能修改仍处于计划阶段、没有待审事项或对外执行的运输计划。出口代理有权人员可取消尚未提货的计划或订舱；已订舱须取得正式撤销确认。执行结果不明时先查清，系统超时不能当作取消成功。',
      '先交易根、批次根，再锁商品分配/区段/确认/受理；替换保存完整不可变旧计划与新计划，重算跨批上限；取消状态8与allocation_status2原子写，未知不释放数量'],
    ['goods-ready','提交并核实备货与出口单证','供应商与独立审核员',['shipment-read','evidence-create','evidence-read','shipment-context','evidence-review'],
      '供应商提交本批次的备货凭据，以及对应的销售合同、商业发票和装箱单。独立审核员核对商品、数量和包装后记录备货已核实；批次仍处于计划阶段，尚未订舱或发运。',
      '证据原文件经共用上传任务S3确切版本/摘要/扫描；声明先持久pending_review；独立审查读取同计划版，无缺件才记readiness事件，状态仍1；补正另建提交不覆盖旧结论'],
    ['booking-pickup','登记并核实订舱与提货','物流公司与独立审核员',['shipment-read','evidence-create','evidence-read','shipment-context','evidence-review'],
      '物流公司提交本批次的订舱和提货凭据，由独立审核员分别核实。系统须先核对物流公司在本交易中的身份和实际委托关系；订舱成功不能证明货物已经提走。物流公司在本阶段交凭据，无须回到步骤一单独填报。',
      '先查本方证据键/源引用；审核读取真实有效合同及备货/授权门禁。订舱1→2，提货2→3，各写确切计划版与区段证据；未知或缺合同拒绝，不造承运成功回执'],
    ['transport-progress','核实运输、到达与签收事实','物流公司与独立审核员',['shipment-read','evidence-create','evidence-read','shipment-context','evidence-review'],
      '物流公司按运输区段提交提货、离境、到达和签收凭据，独立审核员依次核实。确认出境前必须取得同批货物的正式海关放行证据；材料刚提交或通知先后顺序混乱，都不能让货物进度直接跳到后续阶段。',
      '每区段按先提货后离境再到达确认，事件按源引用去重；海关无真实放行则阻断离境。首段离境3→4，末段到达4→5，最终必要签收5→6；各段实际时刻及事件同事务，旧通知不回退终态'],
    ['logistics-exception','报告并处置货损、拒收或延误','物流公司与出口代理有权人员',['evidence-create','shipment-context','evidence-review','exception-resolve'],
      '物流公司报告货损、拒收或延误，出口代理有权人员依据凭据处理，并保留索赔材料。同批次有多个未解决异常时，须逐一处理，全部解决后才恢复原进度；异常记录不会自动触发退款、付款或报关结论。',
      '异常核实追加事件9并进入7，原进度及异常源绑定存不可变受理证据；恢复须全部有效处置证据且从原事件派生进度；正式灭失才9。异常期间不确认签收或取消已出运货物'],
    ['logistics-query','查询批次进度与恢复原受理','供应商或物流公司经办人',['shipment-read','evidence-read','shipment-context'],
      '供应商或物流公司查看本方批次的计划、实际进度和退回补充原因；内部审核人员使用独立入口。提交后超时，应保留原请求编号和内容查询处理结果，不能只看当前进度就认定那次提交已成功，也不能另取批次号重复分配。',
      '读接口仅认证/对象授权/主库查询，无业务写；写结果未知先查同库受理账本，原键同文返回原冻结投影和Location，异文409；不可换号重复分配或假设已发运']
  ];
  const writes={
    'shipment-plan':[
      'APP->>DB: 锁原因2批准快照；同交易有其他批准内容修订有效批次则阻断新分配',
      'APP->>DB: 按商品序号读取同根有效分配FOR UPDATE',
      'APP->>DB: 校验数量、金额、CNY、单位与角色1/3/5的批准序号',
      'APP->>DB: 锁同库计数行取批次号，INSERT批次、分配、区段及计划事件1',
      'APP->>DB: 冻结完整计划封套，计划版等于本次受理序号；不写实际出运时刻'],
    'shipment-amend':[
      'APP->>DB: 读取批次阶段及待审/外部任务，未知执行或已提货则拒绝取消',
      'alt PUT计划且状态1、无待审或执行',
      'APP->>DB: 排除本批后重算累计，旧计划封套保持只读，替换当前分配与区段',
      'APP->>DB: 写新计划封套和更正事件2，不改批准交易修订',
      'else 申请取消',
      'APP->>DB: 状态须1或2，已订舱另查已核实撤销依据，无依据不释放',
      'APP->>DB: UPDATE批次状态8及有效分配状态2，追加取消事件11',
      'end'],
    'goods-ready':[
      'alt 供应商POST证据提交',
      'APP->>DB: 校验同计划版、三单确切文件和本方源键，INSERT待审声明',
      'else 独立审核POST证据决定',
      'APP->>DB: 锁同版提交，复查商品、数量、包装与证据，禁止自审',
      'APP->>DB: 追加通过或退回理由；通过仅INSERT备货事件3，批次仍1',
      'end'],
    'booking-pickup':[
      'alt 物流公司POST订舱或提货证据',
      'APP->>DB: 校验可信物流主体/源键和确切计划版，INSERT待审声明，不写实际时刻',
      'else 独立审核POST核实决定',
      'APP->>DB: 读取同版有效合同适用、委托链、备货与前序核实事件',
      'APP->>DB: 缺任一真实依据则LOGISTICS_GATE_MISSING，不用布尔输入替代',
      'APP->>DB: 订舱核实1转2并写结构化订舱号；提货核实2转3，分别追加事件4或5',
      'end'],
    'transport-progress':[
      'alt 物流公司POST原始运输或签收证据',
      'APP->>DB: 绑定具体区段和原计划版，先本方源键去重，原始声明待审',
      'else 独立核实',
      'APP->>DB: 读受控线路及同批正式海关放行；缺证据返回CLEARANCE_REQUIRED',
      'APP->>DB: 核对逐段前序、发生时刻与有权签收主体，乱序只保留声明不跳阶段',
      'APP->>DB: 写各段实际时刻和事件6至8；首段启运4，末段到达5，真实签收才6',
      'end'],
    'logistics-exception':[
      'alt 物流公司报告并经独立核实异常',
      'APP->>DB: 冻结原进度及异常源，追加异常事件9，批次进入7',
      'else 有权内部人员POST异常处置',
      'APP->>DB: 锁原异常与未闭环集合，核实责任/处置凭据，不接受客户端指定恢复状态',
      'APP->>DB: 追加处置事件10；仍有未闭环则保持7，否则恢复原阶段，签收另核实',
      'APP->>DB: 仅实质灭失且审批证据齐备才追加失败事件12并持久状态9',
      'end']
  };
  const participants=[
    ['供应商'],['供应商','出口代理有权人员'],['供应商','独立审核员'],
    ['物流公司','独立审核员'],['物流公司','独立审核员'],
    ['物流公司','出口代理有权人员','独立审核员'],['供应商','物流公司','出口代理有权人员','独立审核员']
  ];
  const useCases=specs.map(([id,name,actor,links,description,transaction],i)=>{
    let systemSequence=`sequenceDiagram
    actor PERSON as ${participants[i][0]}
    participant SYSTEM as 代理出口系统
    PERSON->>SYSTEM: 查看本方批次、批准商品及当前计划
    SYSTEM-->>PERSON: 允许操作、确切版本、证据和待补原因
    PERSON->>SYSTEM: ${name}
    alt 本方有权且本次条件齐备
      SYSTEM-->>PERSON: 本次处理结果及下一步待办
    else 前提缺失或外部结果未知
      SYSTEM-->>PERSON: 明确缺项或原请求恢复方式，不冒充已出运或已签收
    end`;
    if(['goods-ready','booking-pickup','transport-progress','logistics-exception'].includes(id)){
      systemSequence=`sequenceDiagram
    actor PERSON as ${participants[i][0]}
    participant SYSTEM as 代理出口系统
    actor REVIEWER as 独立审核员
    ${id==='logistics-exception'?'actor OPERATOR as 出口代理有权人员':''}
    PERSON->>SYSTEM: 查看当前本方计划、进度和可提交证据种类
    SYSTEM-->>PERSON: 精确计划版、标签及待补原因
    PERSON->>SYSTEM: 提交${id==='goods-ready'?'备货和出口单证':id==='booking-pickup'?'订舱或提货':id==='transport-progress'?'运输、到达或签收':'货损、拒收或延误'}凭据并确认内容
    SYSTEM-->>PERSON: 原受理号及待审声明，不表示已完成外部事实
    REVIEWER->>SYSTEM: 查看原计划、本次提交和审核依据
    SYSTEM-->>REVIEWER: 对应计划版本的凭据、来源及尚未满足的条件
    REVIEWER->>SYSTEM: 独立核实本次事实或退回并注明理由
    alt 真实证据及本阶段门禁齐备
      SYSTEM-->>REVIEWER: 已核实的具体事件及允许进度
    else 缺证据或外部结果未知
      SYSTEM-->>REVIEWER: 保持原进度，提供明确缺项及补正原因
    end
    PERSON->>SYSTEM: 查询原提交的审查结果
    SYSTEM-->>PERSON: 本方可见结论；退回后另建关联原提交的新补正
    ${id==='logistics-exception'?`OPERATOR->>SYSTEM: 提交原异常的实质处置与凭据
    SYSTEM-->>OPERATOR: 全部闭环后恢复原阶段，真实灭失才失败；不直接签收`:''}`;
    }
    if(id==='shipment-amend')systemSequence=`sequenceDiagram
    actor SUPPLIER as 供应商
    participant SYSTEM as 代理出口系统
    actor OPERATOR as 出口代理有权人员
    SUPPLIER->>SYSTEM: 查看当前未执行计划及标签
    SYSTEM-->>SUPPLIER: 当前计划、是否待审或执行未知
    SUPPLIER->>SYSTEM: 明确确认后整体替换本方运输计划
    SYSTEM-->>SUPPLIER: 保存新计划并保留原版；不能修改时说明原因
    opt 需要取消而非修改
      OPERATOR->>SYSTEM: 查看取消条件及真实订舱撤销依据
      SYSTEM-->>OPERATOR: 是否已提货、是否有未知执行与缺失依据
      OPERATOR->>SYSTEM: 提交本次授权取消与原版内容确认
      SYSTEM-->>OPERATOR: 已取消并释放有效分配，或阻断且保持原占量
    end`;
    let sequence=`sequenceDiagram
    autonumber
    participant PAGE as ${actor}前端
    participant APP as 单体应用对外或内部受限入口
    participant DB as 同一MySQL业务及中间件表
    participant STORE as 私有S3兼容文件与证据存储
    participant SCAN as ClamAV扫描
    PAGE->>APP: ${id==='shipment-plan'?'GET交易contract-basis批准快照及交易强ETag':'本受众GET资源及批次强ETag'}，客户端5秒/应用4秒
    APP->>DB: 对象授权后读当前计划与不可变批准快照
    APP-->>PAGE: 本方数据、缺失门禁及当前标签
    opt 本用例含材料证据
      PAGE->>APP: 共用准备上传/确认文件，声明摘要及用途
      PAGE->>STORE: 短期授权直传暂存对象
      APP->>DB: 先查上传持久任务，保存确切VersionId
      APP->>STORE: 事务外GET确切版本，校验真实长度/摘要
      APP->>SCAN: INSTREAM实际字节，未知/病毒库过旧阻断
      APP->>STORE: 固定最终键If-None-Match写，冲突只核对同文原对象
      APP->>DB: 短事务确认文件元数据，失败由持久任务原键自发恢复
    end
    alt 只读查询目标
      APP-->>PAGE: 200当前授权投影，不写状态或消费确认
    else 本目标的新业务写入
      PAGE->>APP: 明确确认当前内容，取得本受众精确意图确认凭据
      PAGE->>APP: POST或PUT，原键/If-Match/确认，客户端10秒/应用8秒
      APP->>STORE: 事务外保全操作证据，失败不占业务锁
      APP->>DB: BEGIN READ COMMITTED先查原受理；固定序锁交易根、批次号排序、分配、区段、文件、确认、任务
      alt 同键原结果存在
        APP->>DB: 当前权限及方法/路径/原标签/业务HMAC比对
        APP-->>PAGE: 同文200原冻结结果；异文409，不执行新分配
      else 新命令
        APP->>DB: 核对ETag/当前权限/确认绑定/本阶段门禁
        ${(writes[id]||[]).join('\n        ')}
        alt 条件或写入失败
          APP->>DB: ROLLBACK业务/分配/消费确认整体，锁等待1秒/事务预算2秒
          APP-->>PAGE: 409/412/422明确业务码，缺外部证据不降级成功
        else 本地条件满足
          APP->>DB: 业务行/事件/原计划或证据封套/受理账本/确认消费同COMMIT
          APP-->>PAGE: POST201准确Location，PUT200；COMMIT未知主库查原键
        end
      end
    end
    Note over APP,DB: 无银行、海关、电子签接入时只保全声明并阻断相应正式事实；调度后台不替代领域核实`;
    if(id==='logistics-query')sequence=`sequenceDiagram
    autonumber
    participant PAGE as 本方或内部查询前端
    participant APP as 单体应用对应受众入口
    participant DB as 同一MySQL主库
    PAGE->>APP: GET批次或证据提交，客户端5秒/应用4秒
    APP->>DB: 当前对象授权，读取批次计划、实际进度及已核实事件
    APP->>DB: 读取同计划版提交及不可变reviewResult退回理由
    APP-->>PAGE: 200本方投影和当前ETag，内部读另用内部凭证
    opt 原写请求响应丢失
      PAGE->>APP: 原方法、原键、原文、原标签和原确认重入
      APP->>DB: BEGIN先查原受理，验证当前权限与HMAC
      alt 已受理且同文
        APP-->>PAGE: 200原冻结投影及原Location，不再分配或消费确认
      else 未查到
        APP->>DB: 锁交易根再当前读原受理，无才按原命令完整门禁执行
        APP-->>PAGE: 原命令结果或明确冲突，不能凭GET当前状态假定其成功
      end
    end`;
    return {id,code:'步骤三用例'+(i+1),name,actor,actors:participants[i],description,transaction,intent:name,endpoints:links,systemSequence,sequence};
  });
  const rules=[
    ['步骤三规则一','步骤三对应N05/N06/N10，跨步骤四海关放行只消费真实已核实证据；无放行不确认出境。'],
    ['步骤三规则二','批次计划绑定原因2批准快照及其中商品/主体角色序号，不能用当前未批准修订或假定最新等于生效。'],
    ['步骤三规则三','同交易根下所有有效分配累计不超批准行数量/金额；定点DECIMAL(20,6)/(20,2)，单位一致，仅CNY。并发不同批次也锁同一交易根。'],
    ['步骤三规则四','物流核心表无version列；强ETag/计划版由同库受理序号、冻结计划封套及事件尾派生，不暗加字段；PUT不改实际事实。'],
    ['步骤三规则五','外部证据提交pending_review，独立核实才追加履约事件；主体授权/合同/官方证据不以测试输入或通知接收证明。'],
    ['步骤三规则六','状态1计划、2订舱、3已提货待发运、4运输中、5到达、6签收、7异常、8取消、9失败；备货是事件，不再加状态。'],
    ['步骤三规则七','批次6/8/9终态禁止新推进，原键同文回放仍允许；未知任务不释放分配；运输事实不覆盖既有实际时刻。'],
    ['步骤三规则八','多区段按序核实，各段事实留存；事件transport_leg_number使用批次号#区段序号可逆引用，不造不存在的区段主键列。'],
    ['步骤三规则九','异常恢复到原受控进度，多异常未全闭环仍7；永久损失必须实质处置证据才9，不以技术失败代替。'],
    ['步骤三规则十','HTTP/RPC复用单体，两受众/当前权限隔离；先查重入，S3/扫描在事务外，文件恢复不靠浏览器重试。']
  ];
  const model={id:'step-three',name:'步骤三 · 备货与物流',endpoints,useCases,rules,errors:[...common.errors,
    ['ALLOCATION_EXCEEDED / PLAN_FROZEN / SHIPMENT_STATE_CONFLICT',409,'FAILED_PRECONDITION',false,'GET合并并补正原计划或处理原任务，不另号重复分配'],
    ['SOURCE_CONFLICT',409,'ALREADY_EXISTS',false,'原主体、批次、种类、源引用只接受同文；补正另建关联原提交的新意图'],
    ['LOGISTICS_GATE_MISSING / CLEARANCE_REQUIRED / EVIDENCE_NOT_VERIFIED',422,'FAILED_PRECONDITION',false,'补齐真实同批证据；未接外部系统不能伪造通过']
  ]};
  root.EXPORT_STEP_THREE_USECASES_MODEL=model;if(typeof module==='object'&&module.exports)module.exports=model;
})(globalThis);
