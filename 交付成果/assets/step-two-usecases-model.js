'use strict';
(function(root){
  const common=root.EXPORT_SYSTEM_USECASES_MODEL||(typeof require==='function'?require('./system-usecases-model.js'):null);
  const endpoints=[
    ['contract-basis','GetTradeContractBasis','GET','/api/v1/trades/{trade_number}/contract-basis','—','TradeContractBasis','','外部服务','供应商读取已批准快照号和本方签约依据/当前交易ETag，不返回付款方私有声明；无批准则422'],
    ['trade-context','GetTradeReviewContext','GET','/internal/v1/trades/{trade_number}/review-context','—','TradeReviewContext','','内部运营','读取当前结构化资料/待补项/强ETag；可用submitted_snapshot_number查询确切送审快照，仍返回当前根标签'],
    ['trade-reopen','CreateTradeRevision','POST','/internal/v1/trades/{trade_number}/revisions','TradeRevisionInput','TradeWorkingRevision','revision','内部运营','待补3开始补充或批准8开启更正，原子递增内容版并进入2；仅打开工作版，不替供应商填报'],
    ['internal-revision','GetInternalContractRevision','GET','/internal/v1/contracts/{contract_number}/revisions/{revision_number}','—','ContractRevision','','内部运营','内部受众读取确切合同正文/工作指针/签署任务及强ETag；不得借外部凭证审阅'],
    ['terminate','CreateContractTermination','POST','/internal/v1/contracts/{contract_number}/revisions/{revision_number}/termination-decisions','TerminationInput','ContractRevisionReceipt','termination','内部运营','正式依据/授权齐备且无活跃未知签署才终止8；保全已签义务，不能仅换工作指针遗留待签旧版'],
    ['internal-confirmation','CreateInternalOperationConfirmation','POST','/internal/v1/operation-confirmations','OperationIntent','OperationConfirmation','intent','内部运营','内部会话强认证及明确确认，绑定内部受众；不可拿外部确认凭据代用，本方法不递归要求确认'],
    ['internal-confirmation-read','GetInternalOperationConfirmation','GET','/internal/v1/operation-confirmations/{confirmation_id}','—','OperationConfirmation','','内部运营','仅本人查询内部确认有效期及绑定，不泄露认证秘密'],
    ['trade-submit','CreateTradeReviewSubmission','POST','/internal/v1/trades/{trade_number}/review-submissions','TradeReviewInput','TradeReviewSubmission','submission','内部运营','汇总后送独立终审；只冻结送审快照，不批准交易'],
    ['trade-review','CreateTradeReviewDecision','POST','/internal/v1/trades/{trade_number}/review-decisions','TradeDecisionInput','TradeDecision','decision','内部运营','独立审核员按确切送审快照批准/退回，不允许自审'],
    ['create','CreateContract','POST','/api/v1/contracts','ContractInput','Contract','contract','外部服务','每交易/用途创建唯一合同身份和草稿；公共协议仅允许白名单用途及明确授权'],
    ['read','GetContract','GET','/api/v1/contracts/{contract_number}','—','Contract','','外部服务','读取本人可见合同及工作版，不将最新草稿当法律有效版'],
    ['revision','GetContractRevision','GET','/api/v1/contracts/{contract_number}/revisions/{revision_number}','—','ContractRevision','','外部服务','读取确切版本与强ETag；不自动跳最新版'],
    ['replace','ReplaceContractDraft','PUT','/api/v1/contracts/{contract_number}/revisions/{revision_number}','RevisionContent','ContractRevisionReceipt','content','外部服务','仅当前工作编辑版完整替换；If-Match、原键与确认凭据必填；回执不复制可变正文'],
    ['revise','CreateContractRevision','POST','/api/v1/contracts/{contract_number}/revisions','RevisionInput','ContractRevisionReceipt','revision','外部服务','退回/改版新建版本；旧待审/待签须先正式终止且查清任务，旧已签/生效法律义务不因新草稿消失'],
    ['submit','CreateContractReviewSubmission','POST','/api/v1/contracts/{contract_number}/revisions/{revision_number}/review-submissions','ContractReviewInput','ContractRevisionReceipt','submission','外部服务','冻结具体正文/主体/交易批准依据送审；公共协议不伪造交易快照'],
    ['review','CreateContractReviewDecision','POST','/internal/v1/contracts/{contract_number}/revisions/{revision_number}/review-decisions','ContractDecisionInput','ContractRevisionReceipt','decision','内部运营','独立审核条款、费用、委托链、版本；仅当前待审工作版可通过/退回'],
    ['sign','CreateSignatureRequest','POST','/api/v1/contracts/{contract_number}/revisions/{revision_number}/signature-requests','SignatureInput','SignatureRequest','signature','外部服务','本地先绑定稳定clientReference，提交后进程内任务对接电子签，不要求供应商设备'],
    ['sign-read','GetSignatureRequest','GET','/api/v1/signature-requests/{signature_request_id}','—','SignatureRequest','','外部服务','本人查询持久签署状态；未知发起先按原引用查单'],
    ['sign-session','CreateSigningSession','POST','/api/v1/signature-requests/{signature_request_id}/signing-sessions','SigningSessionInput','SigningSession','session','外部服务','当前已核实本签署方获取短期平台跳转地址；地址不写普通审计/事件'],
    ['session-read','GetSigningSession','GET','/api/v1/signing-sessions/{signing_session_id}','—','SigningSession','','外部服务','读取本人持久会话准备状态，ready才返回短期地址；已过期显式expired，不自动刷新或重放旧能力'],
    ['notice','CreateSignatureNotification','POST','/api/v1/signature-notifications','ProviderNotification','NotificationReceipt','notification','外部服务','仅第三方平台专用认证；验原报文签名/时效/重放后去重落库，通知不是签署成功'],
    ['activate','CreateContractActivation','POST','/internal/v1/contracts/{contract_number}/revisions/{revision_number}/activation-decisions','ActivationInput','ContractRevisionReceipt','activation','内部运营','当前已签工作版满足归档和生效条件才激活；已有旧生效版必须明确法律替代且同事务6→7'],
    ['apply','CreateAgreementApplication','POST','/api/v1/trades/{trade_number}/agreement-applications','AgreementUseInput','AgreementApplication','application','外部服务','逐单申请公共协议确切已签版、主体映射/用途/区间；创建更正待复核，不直接放行'],
    ['apply-read','GetAgreementApplication','GET','/api/v1/trades/{trade_number}/agreement-applications/{application_id}','—','AgreementApplication','','外部服务','恢复原适用申请；有效性仍按实时合同/授权及期间判定'],
    ['authority','CreateCustomsAuthorization','POST','/api/v1/trades/{trade_number}/customs-authorizations','CustomsAuthorizationInput','CustomsAuthorization','authorization','外部服务','供应商登记正式渠道电子委托证据；平台合同签名不等于海关授权'],
    ['recognize','CreateCustomsAgentRecognition','POST','/internal/v1/trades/{trade_number}/customs-agent-recognitions','RecognitionInput','Recognition','recognition','内部运营','出口代理有权人员认可同一报关代理/范围/期间；只增加来源证据，不批准付款']
  ].map(([id,rpc,method,path,input,output,body,audience,detail])=>({
    id,rpc,method,path,input,output,body,audience,detail,status:method==='POST'?'201':'200',reqMsg:rpc+'ReqMsg',rspMsg:rpc+'RspMsg',responseBody:'resource',
    file:'proto/trade/contracts/v1/contracts.proto',
    service:audience==='内部运营'?'InternalContractOperationsService':'ExternalContractService',
    query:id==='trade-context'?['submitted_snapshot_number']:[],
    timeout:method==='GET'?common.timeouts.read:common.timeouts.write
  }));
  const business=[
    ['basis-submit','确认并送审签约交易依据','出口代理运营人员',
      '供应商补齐签约所需的主体、人民币金额、付款方式、业务路径、资质和报价，出口代理核对后送审。步骤一提交的资料尚未批准；物流时刻等本阶段用不到的信息可列为待补，不能标成已齐全。',
      ['trade-context','trade-reopen','trade-submit'],'供应商补齐业务路径、资质和报价，出口代理核对后送审，保存本次送审的完整资料。',
      '锁交易根先查原键；待补3先事件15递增版进入2，再由本方修改；批准8开启更正事件13及原因3快照。编辑2送审按事件14的2→4、事件5的4→4、事件6的4→5依次同事务，原因1快照绑定事件6；独立批准后才原因2'],
    ['basis-review','独立审核签约交易依据','独立审核员',
      '独立审核员核对本次送审的资料，决定批准或退回，并写明需补充的内容。审核员不能是填报人或送审人；补充后须以新版本重新送审。后续签合同也不能改写这次批准的内容。',
      ['trade-context','trade-review'],'核对本次送审资料，批准后保存批准依据，退回时列明需补充的内容。',
      '锁交易根先查原决定；同键回放先于状态检查。核对状态5/修订/职责分离；通过事件10＋原因2快照＋批准指针/状态8，退回事件7/状态3；一次COMMIT'],
    ['contract-draft','起草代理、物流或报关合同','供应商经办人',
      '供应商根据已批准的交易资料，分别起草出口代理协议、物流服务合同和报关服务合同，每笔交易各自签约。合同双方核对条款后再送审；物流公司和报关代理通过电子签平台签署，无须在步骤一另交一份交易资料。',
      ['contract-basis','create','read','revision','replace','submit'],'选择合同用途和已批准交易版本，核对双方、条款及有效期，保存草稿后送审。',
      'BEGIN先查原键再锁根：逐单锁已批准交易根，公共起草锁本方机构授权行；再查trade＋用途/原键，无才建身份/版本1。公共方身份封套服务端展开完整法定身份/授权JSON，不假造交易快照。已有逐单身份异键409；正文引用最终文件，草稿PUT返回冻结最小回执'],
    ['contract-review','独立审核合同条款和委托链','独立审核员',
      '独立审核员核对合同条款与委托依据。代理协议须明确每笔固定300元人民币服务费由D承担，在首次获批分账时从D已核验可用余额结算；留存收费依据及D授权，且不减少A合同应付。物流合同须核对委托关系、报价和境外清关范围，报关合同须核对供应商的委任和代理资质。附件4流程图不能充当合同正文。',
      ['review','internal-revision'],'审核指定版本及其依据，通过后等待签署，退回时保留补充意见。',
      '锁交易根/合同根/确切版先查原决定；岗位分离、当前依据及ETag核对；通过2→4，退回2→3，冻结review_snapshot_json并追加ContractReviewPassed/Returned；不能伪造ContractSigned'],
    ['contract-revise','补正或更正合同版本','供应商经办人',
      '供应商可直接修改尚未送审的草稿；送审后实质内容有变，须另建版本并重新审核。新草稿不会废止已签署或已生效的合同。签署仍在进行或结果不明时，先查原签署任务，必要时正式撤销，不能另起一份重复签署。',
      ['revision','replace','revise','submit','internal-revision','terminate'],'阅读旧版及意见，必要时由有权人员正式终止待审或待签旧版，再以新稿重新审核。',
      'BEGIN先查原键，再按交易/合同根锁序核验；仅当前工作版可修改/送审/审核/新发签/激活。旧2/4须正式终止后才新修订，3/8或已签5/生效6可新建但不废止法律义务；活跃未知任务阻断。新生效版若已有6必须明确替代并同事务旧6→7；回放不受当前状态影响'],
    ['contract-sign','发起并完成第三方实名签署','合同各方授权签署人',
      '合同各方通过浏览器进入第三方电子签平台，完成本人身份和企业用章授权核验，签署已经审核的合同正文。供应商不需要签名设备或自行管理私钥，前端也不保存各方共用的签名私钥。',
      ['sign','sign-read','sign-session','session-read','notice'],'发起已审核版本的签署，各方在平台实名确认正文，再查询原签署任务的结果。',
      '本地持久clientReference/确切版本/正文摘要后COMMIT；进程内任务对接平台。发起未知先按原引用查单；平台回调验签/去重后仅落持久通知，主库核对原任务，不因浏览器跳回/通知完成直接置已签'],
    ['contract-activate','核验签署结果并确认生效','出口代理有权运营人员',
      '系统核对平台签名证据、双方授权、可信时间和证书，检查签署件与审核正文的差异，并归档原件后，才记录合同已签署。出口代理有权人员再核对生效条件；条件满足，合同才生效。',
      ['internal-revision','activate'],'核实签署结果及证据，确认生效条件和适用期间，记录生效版本或尚未满足的条件。',
      '签署结果核实/下载/证据校验/存储均事务外，自发恢复。短事务先查任务结果，4→5并一次绑定signed_file；激活另核实5及条件，5→6追加ContractActivated。若正式替代旧版同事务6→7并保法律授权'],
    ['framework-use','逐交易引用有效公共协议','供应商经办人',
      '供应商为本笔交易选择一份已生效的公共物流框架协议，核对签约主体、用途、有效期和具体服务单，再申请引用。出口代理协议和报关服务合同仍须逐单签署；供应商与付款方的关系、批次、报价和正式授权也须逐单核对。',
      ['contract-basis','apply','apply-read','revision'],'选择指定的公共协议版本，核对主体、用途、有效期和本笔服务单，再申请用于本交易。',
      '锁交易根再锁协议根先查原申请；实时核验6及中国自然日首尾均含的区间/用途/主体及未终止。8首笔更正事件13/原因3；后续同基准更正工作版2可连续追加，各请求递增一次，不要求每项都重审。签约相关依赖未变的既有合同继续绑定原原因2，不因新增材料无限重签；最终一次重审才可用'],
    ['customs-authority','登记正式委托与预付认可','供应商与出口代理有权经办人',
      '供应商登记正式报关电子委托及其适用范围、有效期。涉及预付款时，出口代理还须认可受托的同一家报关代理。电子签平台签合同不能代办正式委托，另一家公司的认可记录也不能沿用。',
      ['contract-basis','trade-context','authority','recognize'],'登记本笔正式委托；预付款时由出口代理核实并认可同一报关代理，保存依据或列出缺项。',
      '原键先查；核对供应商/报关代理确切法定身份及用途13原件/范围/期间，认可限出口代理权限。写既有参与方授权/来源及事件，不造批准付款/正式报关事实；新增批准后事实走更正及重新审查']
  ];
  function blackBox(item){
    return `sequenceDiagram
    actor PERSON as ${item.actor}
    participant SYSTEM as 代理出口系统
    PERSON->>SYSTEM: 查看本方可见的确切资料及当前版本
    SYSTEM-->>PERSON: 内容、授权操作及当前版本
    PERSON->>SYSTEM: ${item.intent}
    alt 本方有权且满足本用例条件
      SYSTEM-->>PERSON: 本次处理结果、对应版本，以及接下来需要谁处理
    else 原请求已受理
      SYSTEM-->>PERSON: 原结果，不重复执行业务
    else 前提不满足或外部结果尚未知
      SYSTEM-->>PERSON: 说明未满足的条件；结果不明时查询原请求，合同状态暂不推进
    end
    Note over PERSON,SYSTEM: HTTPS不是用户签名；合同各方在第三方平台实名确认，不要求供应商设备`;
  }
  function implementation(item){
    const signing=item.id==='contract-sign',activate=item.id==='contract-activate';
    return `sequenceDiagram
    autonumber
    participant PAGE as ${item.actor}前端
    participant APP as 单体应用的${item.endpoints.some(id=>endpoints.find(e=>e.id===id)?.audience==='内部运营')?'运营及外部受限入口':'对外接入入口'}
    participant DATABASE as 同一MySQL领域及中间件表
    participant STORE as 私有对象及证据存储
    ${signing||activate?'participant PROVIDER as 第三方实名电子签平台':''}
    ${activate?`opt 通知或定时唤起核实；这是人工激活之前的独立后台阶段
      APP->>PROVIDER: 按原平台任务查询并下载签署件/证据包，不持业务锁
      PROVIDER-->>APP: 原任务状态、实际原件及全部签署方证据
      APP->>APP: 核验证书/可信时间/签名覆盖/授权及审核正文关联，未知不通过
      APP->>STORE: 固定键先查后归档，失败按持久任务自动退避恢复
      APP->>DATABASE: BEGIN依交易或机构授权根、合同根、版本、任务固定序再查原结果
      APP->>DATABASE: 仅原版与证据均匹配才4→5及ContractSigned；文件元数据同COMMIT
    end`:''}
    PAGE->>APP: 使用本受众GET确切资源及强ETag，客户端5秒/应用4秒
    APP->>APP: 核实实名/经办授权/对象权限，仅返回本方可见数据
    APP-->>PAGE: 当前版本、已审正文与本方可操作范围
    PAGE->>APP: 明确确认内容并完成必要强认证，取得绑定本意图的确认凭据
    PAGE->>APP: 创建本用例资源（原键/标签/确认凭据，客户端10秒/应用8秒）
    APP->>STORE: 事务外先查并保全操作证据，失败自行重试，不持业务根锁
    APP->>DATABASE: BEGIN；固定锁序先查原请求结果
    alt 原键已受理
      APP->>DATABASE: 当前权限核验，比较原方法/路径/标签/业务HMAC
      alt 同键同文
        APP->>DATABASE: 读取原冻结结果及回执绑定；COMMIT只读
        APP-->>PAGE: 200原最小受理结果及原Location，不执行新业务
      else 同键异文
        APP->>DATABASE: ROLLBACK；不消费新确认、不改原结果
        APP-->>PAGE: 409 IDEMPOTENCY_CONFLICT
      end
    else 新请求
      APP->>DATABASE: 核对强ETag、状态、当前授权门禁及确认绑定
      Note over APP,DATABASE: ${item.transaction}
      alt 任一前提或写入不满足
        APP->>DATABASE: ROLLBACK全部本地写入，确认不提前消费
        APP-->>PAGE: 409/412/422等明确业务码；永久错误不自动重试
      else 本地写入条件满足
        APP->>DATABASE: 写业务/事件/冻结原最小回执到同库受理账本/消费确认；COMMIT
        APP->>APP: 确定COMMIT后生成并持久平台回执，失败自恢复503 RECEIPT_NOT_READY
        APP-->>PAGE: POST新建201及准确资源Location；PUT200；未知COMMIT先原键查询
      end
    end
    ${signing?`opt 仅已持久签署任务待发起，应用启动及定时自行恢复
      APP->>PROVIDER: 先按原clientReference查询；确定不存在才幂等发起确切版本
      PROVIDER-->>APP: 原平台任务号或结果未知，按原绑定恢复
      APP->>DATABASE: BEGIN先查原绑定；条件保存原任务号/阶段；COMMIT
      PAGE->>APP: GET原任务强ETag，本签署方带标签/原键/确认创建会话
      APP->>DATABASE: BEGIN先查本人原会话，无才持久会话准备任务和最小pending回执；COMMIT
      APP-->>PAGE: 201待准备会话及Location，尚无短期链接
      APP->>PROVIDER: 后台服务端核对本签署方再取短期链接，连接3秒/总10秒
      APP->>DATABASE: 条件保存本人会话ready/有效期及受控能力，未知同会话恢复
      PAGE->>APP: GET本人原会话，ready才读取短期链接，过期只返回expired
      APP-->>PAGE: 本人短期地址不进受理回执/普通审计，不因查询延长时效
      PAGE->>PROVIDER: 查看确切合同并实名签署，平台控制签名密钥与授权
      PROVIDER->>APP: 签名通知；不是浏览器跳回即成功
      APP->>APP: 按平台规范验证原报文签名/时效/事件唯一键
      APP->>STORE: 事务外持久保全平台原报文，失败不假应答
      APP->>DATABASE: BEGIN先查机构/事件键，保存受控引用和任务；COMMIT才201或同文200 received，异文409
    end`:''}
    Note over APP,DATABASE: 远程超时不延长锁；确定失败预算内有界重试，提交未知先主库查原键`;
  }
  const useCases=business.map(([id,name,actor,description,links,intent,transaction],index)=>{
    const internal=links.some(key=>endpoints.find(endpoint=>endpoint.id===key).audience==='内部运营');
    const item={id,code:'步骤二用例'+(index+1),name,actor,description,endpoints:[...(internal?['internal-confirmation','internal-confirmation-read']:[]),...(links.some(key=>endpoints.find(endpoint=>endpoint.id===key).audience==='外部服务'&&key!=='notice')?['confirmation','confirmation-read']:[]),...links],intent,transaction};
    item.systemSequence=blackBox(item);item.sequence=implementation(item);return item;
  });
  const rules=[
    ['步骤二规则一','步骤一编辑资料不等于批准；签约逐单版本只能绑定原因2的不可变批准快照。送审、批准、合同审核和合同签署是不同事实。'],
    ['步骤二规则二','每trade/用途唯一合同身份：用途10代理、11物流、12报关分别签；修订是原合同新版本，不造新身份规避唯一性。'],
    ['步骤二规则三','操作确认、平台受理签名与可靠合同电子签名分层；HTTPS不能单独证明抗抵赖，供应商不需自管密钥。'],
    ['步骤二规则四','编辑1可PUT；送审2冻结，退回3后必须新版本再送审；不得继承旧审核/签署。状态4待签、5已签未生效、6生效、7替代、8终止。'],
    ['步骤二规则五','审核人与填报/提交人职责分离；合同通过不写交易批准，签约不能倒过来回填或修改批准快照。'],
    ['步骤二规则六','平台任务稳定clientReference绑定唯一合同版/正文/签署方；未知先查原任务，不盲目重发；进行中/未知不可直接改版。'],
    ['步骤二规则七','平台回调必须按约定验签/去重/主库核实；浏览器redirect和单条completed通知不作为ContractSigned。'],
    ['步骤二规则八','签署件和审阅正文可不同字节，必须区分文件引用并验证仅合法签名增量/已复核差异；证据原件本地不可改归档。'],
    ['步骤二规则九','公共协议本轮只允许物流框架11，结束日必填、主体/用途/服务单匹配，逐单引用确切版；到期/撤销即时阻止新使用，不依赖定时器。'],
    ['步骤二规则十','公共协议申请/授权材料进入已批准交易必须新增更正修订和重审；原批准快照不回填，待复核不能放行。'],
    ['步骤二规则十一','附件4流程图不是报关合同；平台签合同不是正式海关电子委托。预付必须出口代理认可的同一报关代理、范围/期间都匹配，不批准付款。'],
    ['步骤二规则十二','仅人民币；固定300元服务费由D承担，在首次获批分账时从D已核验可用余额结算；须留存D授权及正式收费依据，不减少A合同应付，INVOICE申报不触发收费。'],
    ['步骤二规则十三','先查重入、根锁/ETag/确认消费同事务；远程签署、文件存储、证书验证均事务外，持久任务自行恢复并告警。'],
    ['步骤二规则十四','签后变更要新审签及正式替代/终止依据；新草稿不使旧生效协议失效；到期、已替代、终止禁止新引用。'],
    ['步骤二规则十五','合同DATE沿主实体中国自然日首尾均含，有效结束日次日00:00起禁止新使用；银行DATETIME半开区间不是合同DATE口径。'],
    ['步骤二规则十六','草稿/审核/生效响应冻结最小受理投影，不存可变合同正文或短期签署URL；同库受理账本与业务/确认同COMMIT且唯一键兜底。'],
    ['步骤二规则十七','批准后新增协议/委托是同一更正工作版上的连续提交，最终一次重审；依据未变的既有签署合同保留原批准快照，受影响的合同仅阻断新使用，不抹除法律事实。']
  ];
  const errors=[...common.errors,
    ['TRADE_NOT_REOPENABLE / TRADE_NOT_REVIEWABLE / CONTRACT_STATE_CONFLICT / SIGNATURE_IN_PROGRESS / REPLACEMENT_REQUIRED',409,'FAILED_PRECONDITION',false,'读取本受众上下文；正式处理旧任务/法律替代，不盲开新签'],
    ['CONTRACT_ALREADY_EXISTS / PROVIDER_EVENT_CONFLICT',409,'ALREADY_EXISTS',false,'恢复原合同或隔离平台事件异文；不覆盖'],
    ['REVIEWER_NOT_INDEPENDENT',403,'PERMISSION_DENIED',false,'交独立有权审核员，不能降低岗位分离'],
    ['TRADE_BASIS_NOT_APPROVED / CONTRACT_PURPOSE_NOT_REUSABLE / AGREEMENT_NOT_APPLICABLE / SIGNATURE_EVIDENCE_INVALID / AUTHORIZATION_NOT_APPLICABLE',422,'INVALID_ARGUMENT',false,'补齐真实批准/适用/授权/签署证据，设计占位不得通过']
  ];
  const model={id:'step-two',name:'步骤二 · 协议与委任',endpoints,useCases,rules,errors,purposes:[{code:10,name:'出口代理协议',roles:[1,2]},{code:11,name:'国际物流服务合同',roles:[1,5]},{code:12,name:'报关代理服务合同',roles:[1,6]}]};
  root.EXPORT_STEP_TWO_USECASES_MODEL=model;
  if(typeof module!=='undefined')module.exports=model;
})(globalThis);
