'use strict';
(function(root){
  const clone=value=>JSON.parse(JSON.stringify(value));
  const canonical=value=>JSON.stringify(sort(value));
  function sort(value){
    if(Array.isArray(value))return value.map(sort);
    return value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,sort(value[key])])):value;
  }
  const file={logicalFileNumber:'FILE-S1-DEMO-001',revisionNumber:1,sha256:'77ca371c4895a5272f9e9bf6aa1805ccd4978aa25b05db54f6e67cfbe241f284',sizeBytes:'1528',path:'doc/examples/step1/material-bundle.html'};
  const party=(legalName,reference,country='CN')=>({legalName,countryCode:country,registeredAddress:'合成注册地址，非真实地点',contactName:'合成联系人',contactPhone:'DEMO-NOT-A-PHONE',contactEmail:'demo@example.invalid',identityProtectedReference:reference});
  const money=amount=>({amount,currencyCode:'CNY'});
  const supplierFiling={
    supplier:party('示例供应商','DEMO-IDENTITY-SUPPLIER'),
    consignee:{party:party('Example Consignee','DEMO-IDENTITY-CONSIGNEE','SG'),deliveryAddress:'Synthetic delivery location',deliveryArrangements:'合成收货安排'},
    salesContractNumber:'SC-DEMO-001',invoiceNumber:'CI-DEMO-001',packingListNumber:'PL-DEMO-001',
    goods:[{itemSequenceNumber:1,productName:'展示用金属支架',specification:'DEMO-M1',quantity:'100',unitCode:'PCS',unitPrice:money('125.00'),total:money('12500.00'),originCountryCode:'CN'}],
    packing:[{goodsItemSequenceNumber:1,quantity:'100',unitCode:'PCS',cartons:10,netWeightKg:'100.000',grossWeightKg:'120.000'}],
    materials:[['MATERIAL_PURPOSE_SALES_CONTRACT','sales-contract'],['MATERIAL_PURPOSE_COMMERCIAL_INVOICE','commercial-invoice'],['MATERIAL_PURPOSE_PACKING_LIST','packing-list']].map(([purpose,htmlAnchor])=>({purpose,logicalFileNumber:file.logicalFileNumber,revisionNumber:1,sha256:file.sha256,htmlAnchor})),
    contractTotal:money('12500.00'),invoiceTotal:money('12500.00'),sourceContentsConfirmed:true,
    exportAgent:{party:party('示例出口代理','DEMO-IDENTITY-EXPORT-AGENT'),serviceScope:'合成代理出口范围',agreedInstructions:'供应商事先沟通后填写的代理指示'},
    logisticsProvider:{party:party('示例物流公司','DEMO-IDENTITY-LOGISTICS'),serviceScope:'合成运输范围',agreedInstructions:'供应商事先沟通后填写；具体运输工具尚待确定'},
    customsBroker:{party:party('示例出口报关代理','DEMO-IDENTITY-CUSTOMS'),serviceScope:'合成报关服务范围',agreedInstructions:'供应商事先沟通后填写；本例无真实资质证明'},
    nominatedPayerProtectedReference:'DEMO-IDENTITY-CONSIGNEE'
  };
  const request={tradeNumber:'TRD-S1-DEMO-001',reservationId:'RES-DEMO-001',supplierFiling};
  const payerFiling={payer:clone(supplierFiling.consignee.party),relationship:'PAYER_RELATIONSHIP_SAME_LEGAL_ENTITY',paymentPurpose:'支付本笔合成出口交易货款',relationshipEvidence:[],sourceContentsConfirmed:true};
  const endpoints=[
    ['reserve','CreateTradeNumberReservation','POST','/api/v1/trade-number-reservations','ReservationInput','TradeNumberReservation','reservation','201','外部服务','创建取号预留资源；Idempotency-Key必填'],
    ['reservation','GetTradeNumberReservation','GET','/api/v1/trade-number-reservations/{reservation_id}','—','TradeNumberReservation','','200','外部服务','取号回执恢复；只限当前主体'],
    ['create','CreateTrade','POST','/api/v1/trades','TradeInput','Trade','trade','201','外部服务','供应商首次资料与交易创建同事务；Idempotency-Key=交易号'],
    ['trade','GetTrade','GET','/api/v1/trades/{trade_number}','—','Trade','','200','外部服务','按当前主体裁剪资源和可见链接，不返回付款方私有正文'],
    ['supplier-read','GetSupplierFiling','GET','/api/v1/trades/{trade_number}/supplier-filing','—','SupplierFilingResource','','200','外部服务','返回供应商资料及聚合修订对应强实体标签'],
    ['supplier-replace','ReplaceSupplierFiling','PUT','/api/v1/trades/{trade_number}/supplier-filing','SupplierFiling','SupplierFilingResource','supplier_filing','200','外部服务','完整替换本方资料；If-Match和Idempotency-Key必填'],
    ['payer-create','CreatePayerFiling','POST','/api/v1/trades/{trade_number}/payer-filings','PayerFiling','PayerFilingResource','payer_filing','201','外部服务','每交易一份付款方资料；首次提交，独立对象授权'],
    ['payer-read','GetPayerFiling','GET','/api/v1/trades/{trade_number}/payer-filings/{payer_filing_id}','—','PayerFilingResource','','200','外部服务','仅已绑定付款方法定身份读取；不能凭交易号获得权限'],
    ['payer-replace','ReplacePayerFiling','PUT','/api/v1/trades/{trade_number}/payer-filings/{payer_filing_id}','PayerFiling','PayerFilingResource','payer_filing','200','外部服务','完整替换本方资料；If-Match和Idempotency-Key必填'],
    ['upload','CreateFileUpload','POST','/api/v1/file-uploads','FileUploadInput','FileUpload','upload','201','外部服务','所属取号预留或已建交易；创建私有暂存上传资源'],
    ['upload-read','GetFileUpload','GET','/api/v1/file-uploads/{upload_id}','—','FileUpload','','200','外部服务','查询上传处理状态；刷新短期授权须重新鉴权，不修改业务资料'],
    ['file','CreateFile','POST','/api/v1/file-uploads/{upload_id}/files','FileConfirmationInput','FileRevision','file','201','外部服务','从已扫描确切对象创建不可变文件修订；未就绪返回409'],
    ['file-read','GetFileRevision','GET','/api/v1/files/{file_number}/revisions/{revision_number}','—','FileRevision','','200','外部服务','元数据资源，不向未授权主体暴露存储路径'],
    ['operations','GetFilingOverview','GET','/internal/v1/trades/{trade_number}/filing-overview','—','FilingOverview','','200','内部运营','独立入口/凭证/只读权限；不是步骤一建单、提交或审核用例'],
    ['confirmation','CreateOperationConfirmation','POST','/api/v1/operation-confirmations','OperationIntent','OperationConfirmation','intent','201','外部服务','实名会话重新认证后确认精确业务意图；本方法不递归要求确认凭据'],
    ['confirmation-read','GetOperationConfirmation','GET','/api/v1/operation-confirmations/{confirmation_id}','—','OperationConfirmation','','200','外部服务','仅本人查询确认有效期及绑定；不回传私密正文或认证秘密']
  ].map(([id,rpc,method,path,input,output,body,status,audience,detail])=>({id,rpc,method,path,input,output,body,status,audience,detail}));
  const timeouts={
    read:{clientMs:5000,serverMs:4000,label:'读取',retry:'最多3次，原资源；总预算内100/300毫秒加抖动'},
    reservation:{clientMs:5000,serverMs:4000,label:'预取号',retry:'最多3次，原幂等键；先查询已提交预留'},
    write:{clientMs:10000,serverMs:8000,label:'资料写入',retry:'最多3次，原键原文原标签；提交未知先查主库，不盲写'},
    upload:{clientMs:10000,serverMs:8000,label:'上传准备',retry:'最多3次，原上传资源；不重新分配对象键'},
    confirmation:{clientMs:15000,serverMs:12000,label:'文件确认',retry:'前端原键查询；后台持久任务自行重试，详见规则'}
  };
  endpoints.forEach(endpoint=>{
    endpoint.file='proto/trade/filing/v1/'+(endpoint.audience==='内部运营'?'operations.proto':'filing.proto');
    endpoint.service=endpoint.audience==='内部运营'?'InternalFilingOperationsService':'ExternalTradeFilingService';
    endpoint.reqMsg=endpoint.rpc+'ReqMsg';endpoint.rspMsg=endpoint.rpc+'RspMsg';endpoint.responseBody='resource';
    endpoint.timeoutClass=endpoint.method==='GET'?'read':endpoint.id==='reserve'?'reservation':endpoint.id==='upload'?'upload':endpoint.id==='file'?'confirmation':'write';
    endpoint.timeout=timeouts[endpoint.timeoutClass];
  });
  const errors=[
    ['INVALID_INPUT / UNKNOWN_FIELD / INVALID_IF_MATCH / DEADLINE_REQUIRED',400,'INVALID_ARGUMENT',false,'修正字段或头，业务变化用新键'],
    ['UNAUTHENTICATED / REAUTHENTICATION_REQUIRED / CONFIRMATION_EXPIRED / SIGNATURE_REQUIRED / SIGNATURE_INVALID / SIGNATURE_EXPIRED',401,'UNAUTHENTICATED',false,'重新认证；签名错误仅适用已约定机构接入，不要求供应商私钥'],
    ['FORBIDDEN / CERTIFICATE_REVOKED / SIGNER_NOT_AUTHORIZED',403,'PERMISSION_DENIED',false,'恢复合法身份/授权；不能以同键绕过撤销'],
    ['NOT_FOUND',404,'NOT_FOUND',false,'不可见与不存在统一处理，不猜号'],
    ['METHOD_NOT_ALLOWED',405,'UNIMPLEMENTED',false,'使用已声明资源方法；HTTP返回Allow，不自动换方法'],
    ['IDEMPOTENCY_CONFLICT / NONCE_REUSED / CONFIRMATION_MISMATCH',409,'ALREADY_EXISTS',false,'停止异文或跨请求移植；原调用允许恢复'],
    ['FILING_ALREADY_EXISTS',409,'ALREADY_EXISTS',false,'GET原资料再PUT'],
    ['FILE_NOT_READY',409,'FAILED_PRECONDITION',true,'按2秒查询原上传资源；不缓存为最终失败'],
    ['TRADE_NOT_EDITABLE / DEPENDENT_FILING_CONFLICT',409,'FAILED_PRECONDITION',false,'后续专门流程，不直接覆盖'],
    ['REVISION_CONFLICT',412,'FAILED_PRECONDITION',false,'GET合并后新键新标签'],
    ['UNSUPPORTED_MEDIA_TYPE',415,'INVALID_ARGUMENT',false,'写接口使用application/json，不自动改写正文'],
    ['CURRENCY_NOT_SUPPORTED / DOCUMENT_INCONSISTENT / REQUIRED_MATERIAL / REQUIRED_EVIDENCE / FILE_REJECTED / REQUIRED / IDENTITY_MISMATCH / CONFIRMATION_REQUIRED / INVALID_QUANTITY / INVALID_AMOUNT / INVALID_PACKING',422,'INVALID_ARGUMENT',false,'修正字段/业务/证明；恶意文件和摘要冲突不重试'],
    ['IF_MATCH_REQUIRED',428,'FAILED_PRECONDITION',false,'先GET本方资源'],
    ['RATE_LIMITED',429,'RESOURCE_EXHAUSTED',true,'Retry-After或retry_after_ms；原键重试'],
    ['DEPENDENCY_UNAVAILABLE / COMMIT_OUTCOME_UNKNOWN / RECEIPT_NOT_READY',503,'UNAVAILABLE',true,'原键查询/恢复；未知不等于未提交'],
    ['DEADLINE_EXCEEDED',504,'DEADLINE_EXCEEDED',true,'端侧超时可能无HTTP响应；写入结果未知先恢复'],
    ['CLIENT_CANCELLED',null,'CANCELLED',false,'客户端终止等待不证明数据库回滚'],
    ['INTERNAL_ERROR',500,'INTERNAL',false,'告警及人工定位；不自动业务重提']
  ];
  const assurance=[
    ['部署边界','一个低单量单体应用；仅对内运营和对外接入两类接口。身份验签、取号、文件处理都是进程内模块/定时任务，不是微服务或模块间RPC。'],
    ['身份与抗抵赖','供应商无需签名设备或自管私钥。HTTPS＋已核实主体/经办授权＋强认证＋用户明确确认精确内容＋不可变审计；重要合同由第三方电子签平台实名签署并交付证据。HTTPS本身不证明抗抵赖。'],
    ['证据链','服务器确认凭据绑定主体、会话、受众、方法/路径、原键/标签、正文/材料摘要与时效；事务先查再消费。保全认证及确认记录、原资料与平台受理回执。机构对接可按协议用RSA/ECC或SM2，浏览器不嵌统一私钥；法定签署由第三方证据支持，不保证绝对法律效果。'],
    ['事务与重入','BEGIN后先查询/锁定既有预留或根记录，先恢复原受理结果再判断新写入。空记录查询不能替代唯一键；并发冲突整笔回滚后开启新事务重查。'],
    ['文件自行重试','前端直传原字节最多3次；单体定时任务持久记录确认意图/阶段/确切版本/租约，自行退避恢复扫描、复制与元数据写入。可恢复失败最多8次，超限告警待人工，不把未就绪当成功。']
  ];
  const preorderSequence=`sequenceDiagram
    autonumber
    participant PAGE as 供应商前端
    participant APP as 单体应用的对外接入接口
    participant DATABASE as 同一MySQL的编号中间件表
    Note over APP,DATABASE: 取号是进程内模块；不部署独立取号服务、Redis或分布式锁
    PAGE->>APP: 实名会话确认后申请预留（原键及确认凭据，超时5秒）
    APP->>APP: 验证会话、确认内容及建单权限，无需供应商密钥
    APP->>DATABASE: BEGIN；按主体及幂等键SELECT预留 FOR UPDATE
    alt 已有预留
      APP->>APP: 校验原规范请求摘要；同文恢复原交易号，异文拒绝
      APP->>DATABASE: COMMIT只读
    else 未有预留
      APP->>DATABASE: SELECT固定交易号计数行 FOR UPDATE
      APP->>DATABASE: 当前读再次查询主体与请求键，确认仍不存在
      APP->>DATABASE: 核验并消费确认；计数加一；INSERT预留（主体、键、原摘要、交易号、用途）
      APP->>DATABASE: COMMIT计数与预留，一次原子提交
    end
    opt 仅确定同文预留已提交
      APP-->>PAGE: 201新预留或200原预留及签名回执；回执待恢复503
    end
    Note over APP,DATABASE: 固定前缀TRD加全局递增序号；无需时钟或日切；达到上限明确拒绝
    opt 并发唯一键冲突或死锁
      APP->>DATABASE: ROLLBACK；预算内开启新事务，先查原键再决定分配
    end
    opt COMMIT应答丢失
      PAGE->>APP: 保留原键申请；不另取新号
      APP->>DATABASE: BEGIN；从主库当前读原键预留，确定结果
      APP-->>PAGE: 原号或503结果未知；不无条件消耗第二个号
    end
    Note over APP,DATABASE: 预留不创建交易；已发号不复用，弃单允许空洞；预留归属在创建事务内再次锁定核验`;
  const uploadSequence=`sequenceDiagram
    autonumber
    participant PAGE as 本方资料前端
    participant APP as 单体应用的对外接入接口
    participant DATABASE as 同一MySQL的上传任务与文件表
    participant STORE as 私有Amazon S3兼容对象存储
    Note over APP,DATABASE: 文件模块与定时恢复任务在同一应用内，不是独立服务或消息队列
    PAGE->>APP: 创建上传资源（所属预留或交易、长度、摘要、确认凭据）
    APP->>APP: 校验实名会话、确认绑定、文件用途及对象权限
    APP->>DATABASE: BEGIN；先查幂等上传任务及已确认文件；同文返回原绑定
    APP->>DATABASE: 新请求才核验/消费确认，保存暂存键、稳定文件号、最终键及预期摘要；COMMIT
    APP-->>PAGE: 201或200原上传资源及短期签名地址
    loop 仅网络中断或可重试服务错误，原字节最多3次
      PAGE->>STORE: PUT原暂存对象，连接5秒、单次60秒、无进度15秒
      STORE-->>PAGE: 成功或明确可重试错误；退避1秒/3秒加抖动
    end
    PAGE->>APP: 请求确认原上传资源（原键原预期摘要）
    APP->>DATABASE: BEGIN；先查询任务/原回执；新请求核验并消费本次确认，文件确认意图持久化同COMMIT
    APP->>APP: 进程内唤起处理；启动与每5秒定时扫描也能恢复
    loop 未完成且未永久拒绝，同一持久任务最多8次且最长24小时
      APP->>DATABASE: BEGIN；先查完成结果；领取60秒租约并递增栅栏；COMMIT
      APP->>STORE: HEAD及GET确切版本；进程内扫描真实字节
      APP->>DATABASE: BEGIN；按栅栏保存源版本/摘要及扫描证据；COMMIT
      APP->>STORE: 先HEAD最终键；不存在才条件复制确切版本，存在则逐项比对
      APP->>DATABASE: BEGIN；先查任务完成绑定及文件号版 FOR UPDATE
      alt 已有完全相同文件
        APP->>DATABASE: 校验所属/路径/摘要/长度；恢复原结果并COMMIT
      else 尚无文件
        APP->>DATABASE: INSERT唯一文件元数据；写任务完成结果并COMMIT
      end
      Note over APP,DATABASE: 临时失败保存next_attempt_at；1/3/10/30/60/300/900秒加抖动，重启仍恢复
    end
    alt 摘要/恶意内容/永久拒绝或重试耗尽
      APP->>DATABASE: 记录rejected或manual_action，最后错误及告警；不生成可引用成功
      APP-->>PAGE: 422或503及原上传状态；终止自动重试
    else 文件确认已经确定提交
      APP-->>PAGE: 201或200原文件修订；暂时未完成则409 FILE_NOT_READY
    end
    Note over APP,STORE: 身份/明确确认的审计证据及平台回执也稳定键保全并自动重试，不持业务事务锁
    Note over APP,DATABASE: 数据库提交未知先当前读查结果；栅栏防旧任务提交，所有历史引用核对后才清理孤立对象`;
  const supplierSequence=`sequenceDiagram
    autonumber
    participant PAGE as 供应商交易填报前端
    participant APP as 单体应用的对外接入接口
    participant DATABASE as 同一MySQL的预留与交易表
    participant STORE as 私有文件及证据存储
    Note over PAGE,APP: 无供应商签名设备；HTTPS保护传输，实名强认证与确认记录保全证据
    PAGE->>APP: 申请本人交易号预留（参见预取号子图）
    APP-->>PAGE: 201或200原预留及交易号
    Note over PAGE,STORE: 共用上传子流程完成三单；事先沟通资料由供应商统一填写
    PAGE->>APP: 展示确切资料/材料版本，用户明确确认并完成必要重新认证
    APP-->>PAGE: 有限时效的确认凭据，绑定原键/正文/方法/路径，无客户端私钥
    PAGE->>APP: 创建交易（原键、完整资料及X-Confirmation-Id；超时10秒）
    APP->>APP: 重查实名会话/授权，核对确认凭据与原业务内容
    APP->>STORE: 事务外保全受控认证及明确确认的证据；失败自动重试且不开始业务写入
    APP->>DATABASE: BEGIN；先SELECT本人原预留 FOR UPDATE
    APP->>DATABASE: SELECT原交易号 FOR UPDATE；查询原创建及提交事件
    alt 原交易已存在
      APP->>APP: 比对原主体及首次创建摘要，同文回放原受理元数据，异文409
      APP->>DATABASE: COMMIT只读或ROLLBACK冲突
    else 原交易不存在
      APP->>DATABASE: 核验预留归属、当前授权门禁及有序文件资格
      APP->>DATABASE: 再验本地门禁；消费本次确认，INSERT交易/参与方/创建及提交事件/操作证据引用
      alt 任一校验或写入失败
        APP->>DATABASE: ROLLBACK全部交易写入；无空壳；唯一冲突新事务先重查
      else 写入成功
        APP->>DATABASE: COMMIT；提交未知先查原键，不盲INSERT
      end
    end
    opt 仅在已确定同文受理或新事务已提交
      APP->>STORE: 先查询原事件绑定的既有平台回执
      opt 尚无签名回执
        APP->>APP: 仅对已确定受理的原结果生成平台受控签名回执
        APP->>STORE: 条件保存原事件键回执；失败自行恢复
      end
      APP-->>PAGE: 回执已保存才201或重放200；未就绪503 RECEIPT_NOT_READY
    end
    Note over APP,PAGE: 异文/校验/写入失败返回对应问题；COMMIT未知查不到确定结果则503，不签成功回执
    opt 响应丢失或超时
      PAGE->>APP: 当前实名会话，原业务键原文及原确认查询/重试
      APP->>DATABASE: BEGIN；先查询原受理事实，不新增交易
      APP-->>PAGE: 恢复原结果；依赖或提交未知503，不误报失败已回滚
    end`;
  function filingSequence(role,replace){
    const supplier=role==='supplier',name=supplier?'供应商':'付款方';
    const resource=supplier?'supplier-filing':'payer-filings/资料号';
    const endpoint=supplier?'/supplier-filing':replace?'/payer-filings/资料号':'/payer-filings';
    const method=replace?'PUT':'POST';
    return `sequenceDiagram
    autonumber
    participant PAGE as ${name}资料前端
    participant APP as 单体应用的对外接入接口
    participant DATABASE as 同一MySQL的交易与文件表
    participant STORE as 私有文件及证据存储
    PAGE->>APP: GET /api/v1/trades/交易号${replace?'/'+resource:''}
    APP->>APP: 本地核验法定主体及本方对象/字段权限，无运营邀请
    APP->>DATABASE: 主库读取本方资料和当前聚合修订
    APP-->>PAGE: 200本方资源及强实体标签（不泄露另一方私有正文）
    Note over PAGE,DATABASE: 如有新附件，先完成共用私有对象上传及确认，无交易行锁
    PAGE->>APP: 本方确认${replace?'完整修改及原标签':'付款关系和原因及材料摘要'}，必要重新认证
    APP-->>PAGE: 本人会话绑定的原请求确认凭据；无签名设备
    PAGE->>APP: ${method} /api/v1/trades/交易号${endpoint}（超时10秒）
    Note over PAGE,APP: ${replace?'If-Match必须为读取的强实体标签；':'首次创建本方唯一资料资源；'}Idempotency-Key及X-Confirmation-Id绑定原意图
    APP->>APP: 重查实名强认证/确认绑定/对象权限及含原标签的摘要
    APP->>STORE: 事务外保全认证及确认的操作证据；原证据键自动重试
    APP->>DATABASE: BEGIN；SELECT交易主表 FOR UPDATE
    APP->>DATABASE: 按确定事件号查询原请求
    alt 同键已受理
      APP->>DATABASE: 比对认证主体、方法/路径和请求摘要
      alt 原请求完全相同
        APP->>DATABASE: COMMIT只读
        APP->>STORE: 恢复已存原平台回执；尚无则确认原事件后补签并保存
        APP-->>PAGE: 200原资源/原标签及原回执；回执待恢复则503
      else 同键异文
        APP->>DATABASE: ROLLBACK
        APP-->>PAGE: 409 IDEMPOTENCY_CONFLICT，不签成功回执
      end
    else 新请求
      APP->>DATABASE: 检查编辑状态及${replace?'If-Match聚合修订':'付款方资料尚不存在'}
      APP->>DATABASE: 按固定顺序锁本地授权门禁及确切文件版
      alt ${replace?'标签陈旧或交易已冻结':'已有付款方资料或交易已冻结'}
        APP->>DATABASE: ROLLBACK
        APP-->>PAGE: ${replace?'412旧标签或409冻结；缺少标签428':'409资源已存在；应读取后用PUT修改'}
      else 所有门禁通过
        APP->>DATABASE: ${supplier?'替换供应商及其收集的其他主体/商品/来源/文件，不改付款方声明':'仅写付款方身份、关系及来源/证明，不改供应商字段'}
        APP->>DATABASE: 事务内核验并消费确认；聚合修订递增，追加事件3/操作证据引用/原最小回执
        alt 任一写失败或死锁
          APP->>DATABASE: ROLLBACK；预算内新事务先查，不在失败事务继续
          APP-->>PAGE: 503问题详情，原键原文恢复，不产生成功假象
        else 写入阶段成功
          APP->>DATABASE: COMMIT
          alt 提交确定
            APP->>STORE: 先查原平台签名回执
            opt 尚无原平台回执
              APP->>APP: 生成已确定受理结果的平台受控签名回执
              APP->>STORE: 条件保存原回执，失败由持久任务自动恢复
            end
            APP-->>PAGE: 回执已保存才${replace?'200':'201 Location付款方资料地址'}；否则503 RECEIPT_NOT_READY并自动恢复
          else COMMIT结果未知
            APP->>DATABASE: 新事务主库当前读原键及事件，不先再次写入
            APP-->>PAGE: 已知结果进入原回执恢复；仍不确定503 COMMIT_OUTCOME_UNKNOWN
          end
        end
      end
    end
    Note over APP,DATABASE: 重放同样恢复原平台签名回执；无完整快照或批准，修改是原资源新修订`;
  }
  function systemSequence(useCase){
    const create=useCase.id==='supplier-submit',replace=useCase.id.endsWith('edit');
    return `sequenceDiagram
    actor PERSON as ${useCase.actor}
    participant SYSTEM as 代理出口系统
    PERSON->>SYSTEM: 证明本方身份并进入${create?'新交易填报':'本方资料'}
    SYSTEM-->>PERSON: 本方可操作范围${replace?'、已有资料及当前版本':''}
    ${create?'PERSON->>SYSTEM: 预留本次交易号\n    SYSTEM-->>PERSON: 可恢复的原交易号':''}
    opt 有本方材料需要提供
      PERSON->>SYSTEM: 提供材料并确认对应的业务内容
      SYSTEM-->>PERSON: 材料版本及检查结果；未通过时说明原因
    end
    PERSON->>SYSTEM: 明确确认${create?'首次交易资料':replace?'本方原资料的完整修改':'首次付款资料'}并验证本人身份（原请求标识${replace?'、当前版本':''}）
    alt 新请求且身份/确认/资料满足受理条件
      SYSTEM-->>PERSON: ${create?'交易已创建、供应商资料已保存':'本方资料已保存'}，返回资料版本和平台签名回执
    else 原请求已受理
      SYSTEM-->>PERSON: 原受理结果，不重复创建或修改
    else 输入不满足条件或系统未能确定结果
      SYSTEM-->>PERSON: 说明需修改的内容；结果未确定时用原请求查询
    end
    Note over PERSON,SYSTEM: 提交后交易仍在编辑中，尚未批准；本步骤只有供应商和付款方分别提交`;
  }
  const useCases=[
    {id:'supplier-submit',code:'步骤一用例一',name:'供应商首次提交交易资料',actor:'供应商',description:'供应商提前与有关各方沟通，填写本方、收货人、出口代理、物流公司和出口报关代理的资料，并提供销售合同、商业发票、装箱单。预留交易号后首次完整提交，系统一并保存资料并创建交易；保存失败时不留下空交易。',endpoints:['reserve','reservation','upload','upload-read','file','file-read','create','trade'],sequence:supplierSequence},
    {id:'payer-submit',code:'步骤一用例二',name:'付款方首次提交付款资料',actor:'付款方',description:'付款方自行填写并确认本方身份、付款原因，以及与实际收货人的关系。每笔交易只有一份付款方资料，提交后如需更正，应修改这份资料。',endpoints:['trade','upload','file','payer-create','payer-read'],sequence:filingSequence('payer',false)},
    {id:'supplier-edit',code:'步骤一用例三',name:'供应商修改已提交资料',actor:'供应商',description:'供应商先查看已提交资料，在最新版本上修改，再完整提交本方资料。系统核对版本，防止覆盖别人刚做的修改；供应商不能代改付款方的私有声明。',endpoints:['supplier-read','upload','file','supplier-replace'],sequence:filingSequence('supplier',true)},
    {id:'payer-edit',code:'步骤一用例四',name:'付款方修改已提交资料',actor:'付款方',description:'付款方先查看本方最新资料，修改后在原资料地址完整提交。系统核对版本并保留修改和提交记录，不另建一份付款方资料。',endpoints:['payer-read','upload','file','payer-replace'],sequence:filingSequence('payer',true)}
  ];
  useCases.forEach(useCase=>{useCase.endpoints.unshift('confirmation','confirmation-read');useCase.systemSequence=systemSequence(useCase);});
  const rules=[
    ['步骤一规则一','只有供应商和付款方各首次提交一份；出口代理、物流公司、出口报关代理资料由供应商事先沟通后填写，不存在其独立步骤一提交用例。'],
    ['步骤一规则二','供应商预取交易号不创建交易；首次完整提交在同一事务创建交易、采集主体及创建/提交事件，失败无空壳。'],
    ['步骤一规则三','付款方通过已核实法定主体与指定交易关系获得本方权限；供应商填的受保护身份引用不是访问凭据，不需要运营建单或邀请。'],
    ['步骤一规则四','供应商不得代填或读取付款方私有声明；付款方不得修改供应商商品或其他主体资料。'],
    ['步骤一规则五','人民币金额为正数两位十进制字符串；数量最多六位小数、重量最多三位；按HALF_UP核对单价乘数量、行额及总额。'],
    ['步骤一规则六','销售合同、商业发票、装箱单三个用途可引用同一物理包的确切工作表或锚点；整个文件共享真实摘要。'],
    ['步骤一规则七','文件实际字节/长度/扫描确认后才可引用；短期签名只允许私有暂存对象，不代表合同审核或签署。'],
    ['步骤一规则八','首次用POST创建资源；修改用PUT完整替换原本方资源，不用动词式提交/修改路径。GET不改变业务状态。'],
    ['步骤一规则九','PUT必须带If-Match强实体标签及Idempotency-Key；同键回放优先于当前版本检查，异文409、旧标签412、缺标签428。'],
    ['步骤一规则十','强实体标签由交易聚合修订派生；另一方修改会令旧标签过期，应重新读取本方资源，不能盲覆盖。'],
    ['步骤一规则十一','事务按交易根、本地授权门禁、文件号版、参与方角色序号固定锁序；不持交易锁访问取号、对象存储、扫描或远程鉴权。'],
    ['步骤一规则十二','普通提交/修改只追加本方事件并递增修订，不生成送审快照或批准；修改不能覆盖旧事件，冻结/终态禁止直接修改。'],
    ['步骤一规则十三','对外服务与内部运营接口分入口、凭证及权限；内部仅只读资料概览，不增加步骤一运营建单、代填或审批。'],
    ['步骤一规则十四','错误使用非成功HTTP状态和application/problem+json；所有错误附字段定位/稳定原因，不用200封装失败。'],
    ['步骤一规则十五','原USD工作簿不改币种/不换汇，仅作映射及拒绝案例；页面和SQL均合成，公开字段参考不是中国法律规定。'],
    ['步骤一规则十六','付款方与实际收货人不同主体时必须说明关系并提供适用证明；同主体依据受保护身份核验，不以名称字符串相同判断。'],
    ['步骤一规则十七','供应商无需专用设备或自管浏览器私钥。HTTPS只保护传输；实名/经办授权、强认证、明确确认及版本/时刻/审计证据共同提高可采信性。合同由第三方实名电子签，机构可选国密或RSA/ECC；不承诺自动法律效力。'],
    ['步骤一规则十八','仅一个单体应用，逻辑接口分对内运营与对外接入（使用方、银行等）；内部模块直接调用，不增加微服务、消息队列、远程取号器。'],
    ['步骤一规则十九','预取号、创建交易、文件确认均在BEGIN后先查已有结果；不存在行不能只靠SELECT锁保证唯一，锁稳定预留/计数行并保留唯一键兜底。'],
    ['步骤一规则二十','文件写入和证据保全均有持久阶段、稳定对象键、租约栅栏及自动退避恢复；永久错误停止，超限告警待人工，不能依赖用户再次点提交。']
  ];
  function decimal(value,scale){
    if(typeof value!=='string'||!new RegExp('^(0|[1-9][0-9]{0,'+(19-scale)+'})(\\.[0-9]{1,'+scale+'})?$').test(value))return null;
    const [a,b='']=value.split('.');return BigInt(a)*10n**BigInt(scale)+BigInt(b.padEnd(scale,'0'));
  }
  function validate(value,kind='supplier'){
    const errors=[],add=(pointer,code,detail)=>errors.push({pointer,code,detail});
    const person=(p,pointer)=>{
      if(!p||typeof p!=='object'){add(pointer,'REQUIRED','必须有主体资料');return;}
      for(const key of ['legalName','countryCode','registeredAddress','contactName','contactPhone','contactEmail','identityProtectedReference'])if(typeof p[key]!=='string'||!p[key].trim())add(pointer+'/'+key,'REQUIRED','必填');
    };
    if(!value||typeof value!=='object'||Array.isArray(value))return [{pointer:'/',code:'INVALID_INPUT',detail:'应为资料对象'}];
    const only=(object,keys,pointer)=>{for(const key of Object.keys(object))if(!keys.includes(key))add(pointer+'/'+key,'UNKNOWN_FIELD','未声明或无权写字段');};
    if(kind==='payer'){
      only(value,['payer','relationship','paymentPurpose','relationshipEvidence','sourceContentsConfirmed'],'');
      person(value.payer,'/payer');
      if(!['PAYER_RELATIONSHIP_SAME_LEGAL_ENTITY','PAYER_RELATIONSHIP_RELATED_ENTITY','PAYER_RELATIONSHIP_OTHER'].includes(value.relationship))add('/relationship','REQUIRED','请选择实际收货关系');
      if(!value.paymentPurpose)add('/paymentPurpose','REQUIRED','必须说明付款原因');
      if(!Array.isArray(value.relationshipEvidence)||value.relationship!=='PAYER_RELATIONSHIP_SAME_LEGAL_ENTITY'&&value.relationshipEvidence.length===0)add('/relationshipEvidence','REQUIRED_EVIDENCE','不同主体须关系证明');
      if(value.relationship==='PAYER_RELATIONSHIP_SAME_LEGAL_ENTITY'&&value.payer?.identityProtectedReference!==supplierFiling.consignee.party.identityProtectedReference)add('/relationship','IDENTITY_MISMATCH','合成示例中须与已核实实际收货主体一致');
      if(Array.isArray(value.relationshipEvidence)&&value.relationshipEvidence.length)add('/relationshipEvidence','FILE_NOT_READY','本合成文件目录没有独立关系证明，不能伪造可引用成功');
    }else{
      only(value,['supplier','consignee','salesContractNumber','invoiceNumber','packingListNumber','goods','packing','materials','contractTotal','invoiceTotal','sourceContentsConfirmed','exportAgent','logisticsProvider','customsBroker','nominatedPayerProtectedReference'],'');
      person(value.supplier,'/supplier');person(value.consignee?.party,'/consignee/party');
      if(!value.consignee?.deliveryAddress)add('/consignee/deliveryAddress','REQUIRED','必须填写送货地址');
      for(const [key,allowed]of [['exportAgent','exportAgentDetails'],['logisticsProvider','logisticsDetails'],['customsBroker','customsDetails']]){
        const provider=value[key];person(provider?.party,'/'+key+'/party');
        if(!provider?.serviceScope)add('/'+key+'/serviceScope','REQUIRED','填写事先沟通的服务范围');
        if(provider){
          only(provider,['party','serviceScope','agreedInstructions',allowed],'/'+key);
          const details=provider[allowed];
          if(details){
            if(key==='exportAgent'&&(!details.receiptPath||!details.paymentPath||![1,2].includes(details.paymentBranchCode)))add('/'+key+'/'+allowed,'INVALID_INPUT','收付路径及付款分支1预付/2出口后付款必须明确');
            if(key==='logisticsProvider'&&(!details.port||!details.route||!Number.isInteger(details.transportModeCode)||details.transportModeCode<1))add('/'+key+'/'+allowed,'INVALID_INPUT','口岸、方式和路线必须明确');
            if(key==='customsBroker'&&(details.quotedAmount?.currencyCode!=='CNY'||!/^([1-9][0-9]{0,17}|0)\.[0-9]{2}$/.test(details.quotedAmount?.amount||'')||decimal(details.quotedAmount?.amount,2)<=0n||!details.pricingBasis||!details.qualification||!details.quotation))add('/'+key+'/'+allowed,'INVALID_INPUT','资质、正数人民币报价、计价依据及报价文件必须明确');
          }
        }
      }
      for(const key of ['salesContractNumber','invoiceNumber','packingListNumber','nominatedPayerProtectedReference'])if(!value[key])add('/'+key,'REQUIRED','必填');
      const amount=(m,p)=>{
        if(m?.currencyCode!=='CNY')add(p+'/currencyCode','CURRENCY_NOT_SUPPORTED','本次仅人民币，不折算原USD');
        const n=typeof m?.amount==='string'&&/^(0|[1-9][0-9]{0,17})\.[0-9]{2}$/.test(m.amount)?decimal(m.amount,2):null;
        if(n===null||n<=0n)add(p+'/amount','INVALID_AMOUNT','正数两位十进制字符串');return n;
      };
      const goods=Array.isArray(value.goods)?value.goods:[],packing=Array.isArray(value.packing)?value.packing:[];
      if(goods.length<1||goods.length>100)add('/goods','INVALID_INPUT','必须有1至100行商品');
      let sum=0n;const seen=new Set();
      goods.forEach((g,i)=>{
        const p='/goods/'+i;
        if(!g){add(p,'INVALID_INPUT','商品必须为对象');return;}
        if(!Number.isInteger(g.itemSequenceNumber)||g.itemSequenceNumber<1||g.itemSequenceNumber>65535||seen.has(g.itemSequenceNumber))add(p+'/itemSequenceNumber','INVALID_INPUT','序号须唯一且1至65535，与实体SMALLINT UNSIGNED一致');
        seen.add(g.itemSequenceNumber);
        for(const key of ['productName','specification','unitCode','originCountryCode'])if(typeof g[key]!=='string'||!g[key].trim())add(p+'/'+key,'REQUIRED','商品字段必填');
        const quantity=decimal(g.quantity,6),price=amount(g.unitPrice,p+'/unitPrice'),total=amount(g.total,p+'/total');
        if(quantity===null||quantity<=0n)add(p+'/quantity','INVALID_QUANTITY','正数且最多六位小数');
        if(quantity!==null&&price!==null&&total!==null&&(quantity*price+500000n)/1000000n!==total)add(p+'/total','DOCUMENT_INCONSISTENT','数量乘单价不等于行额');
        if(total!==null)sum+=total;
      });
      for(const key of ['contractTotal','invoiceTotal'])if(amount(value[key],'/'+key)!==sum)add('/'+key,'DOCUMENT_INCONSISTENT','与商品总额不一致');
      const packed=new Set();
      if(packing.length!==goods.length)add('/packing','DOCUMENT_INCONSISTENT','本示例按同批商品全量对应');
      packing.forEach((p,i)=>{
        if(!p){add('/packing/'+i,'INVALID_INPUT','箱单行必须为对象');return;}
        const g=goods.find(g=>g?.itemSequenceNumber===p.goodsItemSequenceNumber),net=decimal(p.netWeightKg,3),gross=decimal(p.grossWeightKg,3);
        if(!g||packed.has(p.goodsItemSequenceNumber)||decimal(p.quantity,6)!==decimal(g.quantity,6)||p.unitCode!==g.unitCode)add('/packing/'+i,'DOCUMENT_INCONSISTENT','商品数量单位不符或重复');
        packed.add(p.goodsItemSequenceNumber);
        if(!Number.isInteger(p.cartons)||p.cartons<=0||net===null||gross===null||net<=0n||gross<net)add('/packing/'+i,'INVALID_PACKING','箱数正整数且0<净重≤毛重');
      });
      const purposes=['MATERIAL_PURPOSE_SALES_CONTRACT','MATERIAL_PURPOSE_COMMERCIAL_INVOICE','MATERIAL_PURPOSE_PACKING_LIST'];
      const refs=Array.isArray(value.materials)?value.materials:[];
      for(const [i,purpose]of purposes.entries()){
        const matches=refs.filter(r=>r?.purpose===purpose);
        if(matches.length!==1)add('/materials','REQUIRED_MATERIAL','每用途必须一个确切引用');
        for(const r of matches)if(r.logicalFileNumber!==file.logicalFileNumber||r.revisionNumber!==1||r.sha256!==file.sha256||r.htmlAnchor!==['sales-contract','commercial-invoice','packing-list'][i]||r.workbookSheet!==undefined)add('/materials','FILE_NOT_READY','合成示例的文件版/摘要/实际定位不符');
      }
      if(refs.length!==3)add('/materials','INVALID_INPUT','示例限定三用途');
    }
    if(value.sourceContentsConfirmed!==true)add('/sourceContentsConfirmed','CONFIRMATION_REQUIRED','提交主体须确认来源，非自动文字识别验真');
    return errors;
  }
  const model={file,party,request,supplierFiling,payerFiling,endpoints,useCases,rules,uploadSequence,preorderSequence,timeouts,errors,assurance,clone,canonical,validate,
    steps:[{id:'step-one',name:'步骤一 · 交易资料提交'}]};
  root.EXPORT_SYSTEM_USECASES_MODEL=model;
  if(typeof module!=='undefined')module.exports=model;
})(globalThis);
