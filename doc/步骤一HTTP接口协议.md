# 步骤一HTTP接口协议

本规范独立于Protocol Buffers定义，描述HTTP资源及同名可选gRPC入口的请求头/metadata、超时、返回码和权限；`proto/trade/filing/v1/filing.proto`、`operations.proto`以标准`google.api.http`逐项映射。一个单体应用仅分对内运营和对外接入，不拆微服务或模块间RPC。均为未发布设计，不是已运行接口；替代先前命令式五方法设计，不并存第二套提交协议。接口路径中的英文是协议标识，界面业务角色必须使用全称。

## 1. 资源与服务边界

供应商进入实名页面→创建交易号预留→填写本方收集资料/上传材料→首次`POST /api/v1/trades`原子创建交易与供应商资料。付款方经本方身份与交易对象核验后创建付款资料；两方分别允许替换自己原资源。没有运营建单/邀请、物流公司或出口报关代理单独提交，没有本步骤审批用例。

外部与内部在同一应用中使用隔离路由/入口策略、令牌受众和权限，可用反向代理暴露不同域名，但不是两个业务部署或两套数据库；对外路由不得转发内部路径。外部范围包括使用方及银行等合作机构，本步骤只定义供应商/付款方接口，不编造银行协议。认证主体、组织、角色、访问范围从服务端验证的凭证取得，不从正文或业务号推断。内部只读最小概览，不返回双方声明正文，不允许代建单、代填或审批。

| HTTP方法与资源地址 | Protocol Buffers方法 | HTTP正文类型 / 注解body | 成功类型 / 状态 |
|---|---|---|---|
| POST /api/v1/trade-number-reservations | CreateTradeNumberReservation | ReservationInput / reservation | TradeNumberReservation / 201 |
| GET /api/v1/trade-number-reservations/{reservation_id} | GetTradeNumberReservation | 无 | TradeNumberReservation / 200 |
| POST /api/v1/trades | CreateTrade | TradeInput / trade | Trade / 201 |
| GET /api/v1/trades/{trade_number} | GetTrade | 无 | Trade / 200 |
| GET /api/v1/trades/{trade_number}/supplier-filing | GetSupplierFiling | 无 | SupplierFilingResource / 200 |
| PUT /api/v1/trades/{trade_number}/supplier-filing | ReplaceSupplierFiling | SupplierFiling / supplier_filing | SupplierFilingResource / 200 |
| POST /api/v1/trades/{trade_number}/payer-filings | CreatePayerFiling | PayerFiling / payer_filing | PayerFilingResource / 201 |
| GET /api/v1/trades/{trade_number}/payer-filings/{payer_filing_id} | GetPayerFiling | 无 | PayerFilingResource / 200 |
| PUT /api/v1/trades/{trade_number}/payer-filings/{payer_filing_id} | ReplacePayerFiling | PayerFiling / payer_filing | PayerFilingResource / 200 |
| POST /api/v1/file-uploads | CreateFileUpload | FileUploadInput / upload | FileUpload / 201 |
| GET /api/v1/file-uploads/{upload_id} | GetFileUpload | 无 | FileUpload / 200 |
| POST /api/v1/file-uploads/{upload_id}/files | CreateFile | FileConfirmationInput / file | FileRevision / 201 |
| GET /api/v1/files/{file_number}/revisions/{revision_number} | GetFileRevision | 无 | FileRevision / 200 |
| GET /internal/v1/trades/{trade_number}/filing-overview | GetFilingOverview | 无 | operations.FilingOverview / 200 |
| POST /api/v1/operation-confirmations | CreateOperationConfirmation | OperationIntent / intent | OperationConfirmation / 201 |
| GET /api/v1/operation-confirmations/{confirmation_id} | GetOperationConfirmation | 无 | OperationConfirmation / 200 |

资源地址均是名词，修改不使用`:submit`、`:validate`、`/commands`等动作路径。路径参数从请求消息取值；正文直接为表中指定子消息，**不套`trade`、`supplierFiling`或`payerFiling`请求包装层**；网关按注解装配类型化请求。未列出的字段/查询参数/方法拒绝，不能借全文替换注入actor、状态、权限或审批结果。字段用ProtoJSON lowerCamelCase；uint64使用字符串，uint32用JSON整数；Timestamp使用UTC RFC3339。

## 2. HTTP通用语义

- HTTPS；外部认证`Authorization: Bearer <仅由运行时取得>`，正文`Content-Type: application/json`。成功为`application/json`，失败为`application/problem+json`（RFC 9457）。拒绝未知/重复JSON键、错误类型及非法枚举；不接收客户端审核/actor字段。示例不含真实令牌。
- POST创建成功为201及`Location`指向实际创建资源。相同幂等请求回放200及原`Location`/原成功正文；不得重复创建。PUT只替换**已存在**的本方资源，返回200及受理元数据；不存在返回404，不用PUT偷偷新建。DELETE/PATCH及未支持方法返回405和`Allow`。
- 每个写请求必须带`Idempotency-Key`。创建交易时固定为原`tradeNumber`；其他写请求使用不可复用的UUID。首次付款资料每交易仅一个，服务端分配稳定资料号，本例为`primary`，后续新键POST返回409，修改使用原地址PUT。
- 供应商无需签名设备/私钥。业务写带`X-Confirmation-Id`（RPC confirmation-id），由实名会话明确确认具体内容、必要重新认证后申请；绑定主体/会话/受众/方法/路径/原键/原标签/正文摘要。创建确认本身例外，不递归要求确认。成功业务写返回平台`X-Receipt-Proof`，它证明平台受理不冒充用户签名。机构自愿约定的`X-Invocation-Proof`仅适用已登记的机构签名接入，不强制普通浏览器。完整证据与限制见[身份确认设计](步骤一身份签名与可靠性设计.md)。
- 所有响应`Cache-Control: no-store`，身份/资料不进共享缓存。交易及资料GET、交易创建/资料修改的成功响应均带强`ETag`。GET返回完整**本方**资料；POST/PUT返回资料资源的**最小受理表示**（交易号/资料号/受理修订/标签，不返回content），不使用可变主表拼装历史回执。GET同地址可取得当前完整内容。文件GET返回不可变元数据；上传GET为处理状态，不触发确认或交易写入。
- 资料PUT必须带单个精确`If-Match`，示例`"s1-supplier-TRD-S1-DEMO-001-r2"`。不接受弱标签、`*`或标签列表，格式不符400，缺少428，旧标签412。标签含资源种类/交易号/聚合修订；不是仅对正文做hash。同方和跨方修改均递增聚合修订；另一方改动导致旧标签失效是有意保守串行化。重新GET本方资源、人工合并后用新键和新标签重试，绝不自动覆盖。
- POST不要求If-Match：不存在资源无法获取其标签；短事务中校验交易编辑态、法定主体、材料资格，以及付款资料唯一性。付款方提交不依赖供应商私有正文的前端旧副本。标签是并发前置条件，不是授权凭证。
- 成功回放保存**原**标签，它不代表当前最新版本；后续修改必须重新GET。不可见对象统一404，未认证401；业务无权限若不涉及对象存在性可403。不靠可预测交易号/资料号/上传号授权。

## 3. 请求幂等与未知结果

解析并重建白名单类型化输入后，`S1-HTTP-C14N-2`构造：

```json
{"method":"PUT","path":"/api/v1/trades/TRD-S1-DEMO-001/supplier-filing","ifMatch":"\"s1-supplier-TRD-S1-DEMO-001-r2\"","body":{"说明":"此处实际为完整SupplierFiling，不是自由JSON"}}
```

完整方法、解析后重建的规范路径、原精确If-Match（无则空字符串）、请求正文共同参与认证摘要。对象键递归按UTF-16码元排序、数组保序、UTF-8无空白、不Unicode正规化；保留optional存在性与十进制字面，禁止未知/重复键。请求方法/路径/头不能被忽略。主体与幂等键绑定在查找命名空间中。变更业务输入/If-Match属于新请求，须新键；同键异文409，不得把旧键用于“刷新版本后重试”。

HTTP和RPC都先按类型重建正文，再规范化：非optional标量及repeated字段显式输出默认值（空字符串/0/false/空数组），optional仅在存在时输出，oneof仅输出选中项，缺少业务必需message仍拒绝；枚举用完整名称、uint64用十进制字符串。不能直接hash通用ProtoJSON序列化器的默认“省略空数组”输出。请求签名使用同一规范正文，故RPC补空数组不应制造幂等异文。平台最小受理表示另按资源的受理投影重建：Trade为tradeNumber/revisionNumber/lifecycle/supplierFilingUri/etag，供应商为tradeNumber/revisionNumber/etag，付款方再含payerFilingId；不强行添加当前GET的content或空链接。

中间件回执投影：预留为reservationId/tradeNumber/createdAt，上传准备仅uploadId及首次state（不签短期URL/访问能力），文件确认是完整不可变FileRevision。时刻仍规范为UTC三位毫秒。客户端按此投影复核`acceptedRepresentationDigest`，不是盲目对整份含临时授权的HTTP响应求摘要；原投影必须随持久受理结果冻结。响应中的签名URL过期经授权GET刷新，不能改原回执。

创建交易：入口查实名会话/确认绑定/当前权限，事务外保全不可变操作证据；`BEGIN`后**先锁原编号预留，查询原交易和原创建事件**，已有先核对原主体/首次HMAC恢复原结果；不存在才按锁序核验/消费确认并INSERT交易、创建/提交事件。业务与确认消费同COMMIT，回滚不提前耗掉确认。主表唯一号兜底；唯一冲突回滚新事务先查，不能先INSERT代替重入。`creation_payload_hmac`及版本保存首次HMAC，确认号不参与业务HMAC。预留归属不可变，不回收。

其余交易资料写入：`event_number = "S1"+SHA256(UTF8(JSON.stringify([authenticatedSubject,tradeNumber,idempotencyKey]))).hex.slice(0,38)`。锁交易根后查同键事件，核对主体、完整键及`S1-HTTP-C14N-2`请求HMAC；**相同请求回放先于当前状态/标签检查**，但不绕过当前访问撤销。事件封套版本3保存`request_id`、`request_hash`（HMAC-SHA256）、`request_hash_key_version`、`canonicalization_version`、`http_method`、`resource_path`、`if_match`、角色/序号、变更路径、文件引用、来源确认及`accepted_representation`（最小受理表示，禁止私密正文）；原受理修订/时刻/操作者取事件列。键版本至少保留至审计/重试期结束；历史事件不因新密钥重写，读取原版本密钥验证。

接入操作确认后，事件3版本3条件必填`operation_evidence_reference`，引用受控身份/确认审计；历史`signing_evidence_reference`仅机构签名模式，旧fixture不当生产证明。确认有效300秒，未受理过期401 CONFIRMATION_EXPIRED，绑定不符409 CONFIRMATION_MISMATCH；原同文已受理先回放，不因原确认到期重做，仍核对归属及当前权限。换确认不改变业务HMAC。平台回执仅对确定COMMIT签署，待恢复503 RECEIPT_NOT_READY不可当业务未提交。

编号预留和文件上传/确认以“认证主体＋规范资源范围＋方法＋幂等键”写持久准备账本，保存请求认证摘要及回执；准备账本/编号账本是待实现基础设施，不为演示增加第六张核心表。同上传最多确认一个不可变文件修订，稳定编号/最终对象定位必须在复制前绑定；即便使用新键也不得创建第二份确认文件。

超时、网络断开或503不证明未提交。创建交易按原交易号GET；预留/上传按原资源GET或原键重试；资料请求以原键、原文、原标签重放取得原结果，GET仅表示当前内容，不能证明某次命令受理。服务端使用主库及确定提交结果；未知保持原键查询/重试，不换号不换键；若原文未变化且数据库明确回滚，同键可以重试。所有受理回放均无新业务写入。

## 4. 文件与取号预留

`ReservationInput.purpose`固定`"supplier-trade-filing"`。编号账本先持久保存当前供应商、请求键、交易号，再返回201；取号响应丢失同键返回原号。无交易记录时用`FileUploadInput.reservationId`绑定本人预留；已建交易用`tradeNumber`绑定本方字段权限，二者oneof互斥。供应商不能借文件接口给付款方上传独立声明。

上传资源201只授权私有暂存路径PUT、限定类型/长度/实际SHA256及过期时刻；该签名URL是存储授权，不是用户抗抵赖签名。前端直传最多3次自行退避，单次60秒；已在服务器的扫描/复制/元数据写入由同应用持久定时任务自动恢复，最多8次/24小时，不能只等用户再点确认。任务状态为`awaiting_upload/processing/retry_wait/ready/rejected/manual_action`，返回`attemptCount/nextAttemptAt/lastErrorCode`，不改交易生命周期。签名地址不写事件或日志；过期经本人授权GET计算新表示，不更改归属/确认事实；已处理不再提供写能力。

创建文件前HEAD/GET**确切对象版本**，扫描实际字节，不能把对象实体标签当SHA256；版本桶或条件复制保证扫描字节与最终版本相同。最终对象键禁止客户端覆盖，写入后再次核对；文件元数据单独短事务提交，扫描未就绪409，恶意/摘要/长度不符422。结果仅为`referenceEligible=true`，不是法律审核或电子签署。原文件不可改；修改附件创建新逻辑文件或合法新增修订，不覆盖原引用。孤立对象按持久账本和所有历史引用核对后清理，无跨存储分布式事务承诺。

## 5. 资料校验与权限

共用文件接口允许用途7–13，覆盖运输信息、资质、报价、三类协议和正式授权；不要求步骤一首次填报就提交这些后续文件。公共协议草稿无交易时可用FileUploadInput.organizationReference，须服务端核实当前机构成员/起草权限并在任务锁定归属，不能按客户端字符串授权。与reservationId/tradeNumber保持oneof互斥。

服务主体可选角色专属`exportAgentDetails`、`logisticsDetails`、`customsDetails`，分别映射既有角色JSON的收付路径/付款分支、运输字段、资质/人民币报价/计价及报价文件。初次允许待补，步骤二送审校验本阶段必需项，供应商在编辑态通过原PUT补齐；不得用运营summary冒充这些结构化声明。PUT保留专用命令维护的官方委托/出口代理认可数组，禁止供应商代写。完整字段映射见领域JSON§11及步骤二§8。

供应商输入身份、实际收货人/送货资料、商品/单价/金额、三单对应引用、事先沟通的出口代理/物流/报关主体与适用服务范围、拟付款主体受保护引用。缺少后续资质/报价等证据必须列入待补项，不能填假证或当作整单可批准。供应商的指定付款方身份引用只记录申报事实；付款方登录后服务端核对已核实法定身份、本交易指定关系及当前访问策略，未确定关系一律不开放。无运营邀请依赖。

付款方独立填写本方身份/与实际收货关系/付款原因/适用证明；同法定主体需服务端比较受保护身份，不按名称；不同主体必需关系证明。证明引用需角色用途、确切版本、访问范围、资格及合法来源校验。若供应商更改实际收货主体或拟付款主体：本轮已存在付款方资料时返回409 `DEPENDENT_FILING_CONFLICT`，必须先走后续专门关系更正设计；不静默删掉或沿用原声明。

本轮金额仅CNY，DECIMAL(20,2)/JSON两位字符串；数量DECIMAL(20,6)、重量DECIMAL(20,3)，整数部分上限分别18/14/17位，定点HALF_UP核算；商品序号1–65535匹配实体SMALLINT UNSIGNED。三单按人工确认字段勾稽，不声称识别任意扫描件自动验真。所需用途可由同文件包不同sheet/anchor引用，但不是分别计算章节hash。供应商PUT可替换自己提供的服务主体资料，不写付款方私有声明。普通提交/修改状态仍2，送审/批准后返回409，终止/结案不可直接改。

## 6. 错误资源

| HTTP状态 | 稳定问题类型后缀 | 恢复 |
|---|---|---|
| 400 | INVALID_INPUT / UNKNOWN_FIELD / INVALID_IF_MATCH | 修正JSON/字段/头；已变更输入用新键 |
| 401 / 403 | UNAUTHENTICATED / FORBIDDEN | 重新认证/取得合法权限，不泄露对象 |
| 404 | NOT_FOUND | 不可见或不存在，不尝试猜号 |
| 409 | IDEMPOTENCY_CONFLICT / FILING_ALREADY_EXISTS / FILE_NOT_READY / TRADE_NOT_EDITABLE / DEPENDENT_FILING_CONFLICT | 异文停止；本方已存在改走GET+PUT；文件未就绪查询；冻结转后续专门流程 |
| 412 | REVISION_CONFLICT | 重新读取本方资源，人工核对后新键/新标签 |
| 422 | CURRENCY_NOT_SUPPORTED / DOCUMENT_INCONSISTENT / REQUIRED_MATERIAL / REQUIRED_EVIDENCE / FILE_REJECTED | 修正业务及证据，不转换USD冒充CNY |
| 428 | IF_MATCH_REQUIRED | 先GET取得精确强实体标签 |
| 429 | RATE_LIMITED | 按Retry-After原键重试 |
| 503 | DEPENDENCY_UNAVAILABLE / COMMIT_OUTCOME_UNKNOWN | Retry-After；原键原文查询/重试，不把未确定当失败或成功 |

`HttpProblem`对应标准问题详情的`type/title/status/detail/instance/errors`。`type`为`https://api.example.invalid/problems/<稳定问题类型>`示例地址，生产部署须替换为可查文档URI；`errors.pointer`为JSON Pointer，例如`/goods/0/unitPrice/currencyCode`，头错误用`/headers/If-Match`约定定位。没有错误回执伪装成功资源，没有仅依赖gRPC status的HTTP定义。

生成的`doc/examples/step1/http-examples.json`展示四用例、取号及文件创建的HTTP头/正文/响应；`http-contract.json`可逐行核对上述表与两份Protocol Buffers注解。它是映射索引，不假称OpenAPI规范。所有样例均合成；未提供后端或真实云实现。

## 7. REST超时与RPC deadline（逐接口适用）

| 资源/对应方法 | HTTP客户端总超时 / 应用处理上限 | gRPC客户端deadline / 应用上限 |
|---|---|---|
| 全部GET，含内部GetFilingOverview | 5000 / 4000毫秒 | 5000 / 4000毫秒 |
| CreateTradeNumberReservation | 5000 / 4000毫秒 | 5000 / 4000毫秒 |
| CreateTrade、CreatePayerFiling、ReplaceSupplierFiling、ReplacePayerFiling | 10000 / 8000毫秒 | 10000 / 8000毫秒 |
| CreateFileUpload | 10000 / 8000毫秒 | 10000 / 8000毫秒 |
| CreateOperationConfirmation | 10000 / 8000毫秒 | 10000 / 8000毫秒 |
| CreateFile | 15000 / 12000毫秒 | 15000 / 12000毫秒 |

客户端总预算包含连接、排队、重试等待、接收完整响应，不是每次重试重新获得完整预算；连接上限2秒。表内应用上限包括认证/确认/证据准备及本地事务（机构接入含验签），不含长时后台任务。应用按剩余预算处理，连接池等待最多500毫秒、单次锁等待最多1秒、业务事务墙钟最多2秒；数据库`innodb_lock_wait_timeout`不能单独实现总事务deadline，应用另行监测及回滚。剩余预算不足不得开启写事务；提交阶段若超时/断线，先按原键查询，禁止声称已回滚。

gRPC必须显式设置deadline；服务端以`min(客户端剩余deadline,本方法应用上限)`处理，缺省deadline返回`INVALID_ARGUMENT`及`DEADLINE_REQUIRED`，超长deadline被裁剪。HTTP调用方若缩短超时/断线，应用不会因此保证COMMIT取消；接口上限通过应用计时器执行。反向代理配置至少客户端默认上限加1秒避免过早截断，但调用者仍可能自行超时。超时响应在应用尚能回复时为504；客户端已断连则可能没有HTTP响应，不能伪造一条实际响应。

GET/预留/上传准备在**原总预算内**最多3次（含首次），等待100/300毫秒加0–20%抖动；仅429/临时503/网络错误有条件重试。资料写入先按原键恢复结果再决定预算内重试，所有尝试共用原键/正文/标签。禁止SDK额外透明重试与应用重试叠加。FILE_NOT_READY轮询另起只读调用，至少2秒，前端单轮最长2分钟后停止自动轮询并显示持续后台状态；不撤销已经持久的文件恢复任务。文件写入自动恢复完整规则见专门设计。

## 8. gRPC元数据与统一错误定义

成功消息与HTTP资源是相同类型；RPC请求包装消息由HTTP注解指向正文子消息。RPC元数据：

| metadata | 映射 | 规则 |
|---|---|---|
| authorization | HTTP Authorization | 验证同一法定主体及接口受众 |
| idempotency-key | HTTP Idempotency-Key | 所有写必填；创建交易为原交易号 |
| if-match | HTTP If-Match | 两个Replace方法必填单一强标签 |
| confirmation-id | HTTP X-Confirmation-Id | 业务写必填；实名确认的服务端引用，不是独立授权；创建确认本身除外 |
| invocation-proof-bin | HTTP X-Invocation-Proof解码字节 | 可选已约定机构接入，普通供应商不要求 |
| receipt-proof-bin | HTTP X-Receipt-Proof解码字节 | 成功尾metadata；原平台ReceiptProof，不签可变GET结果 |
| grpc-status-details-bin | HTTP问题详情 | 非OK `google.rpc.Status`，details包含`trade.filing.v1.RpcFailure` |

`RpcFailure.code`与HTTP `errors[].code`一致，`httpStatus`明确HTTP对应状态，`retryable/retryAfterMs/outcomeUnknown/requestReference/errors`明确恢复。gRPC状态只有传输/通用分类，不能代替业务码；同一FAILED_PRECONDITION必须区分缺标签、旧标签、冻结、文件未就绪。网关自行生成且无details的错误不得猜成业务拒绝；`UNKNOWN`按`outcomeUnknown=true`原键恢复。gRPC客户端deadline到期可能来不及收details，同样不假设未提交。

| 稳定业务码 | HTTP | gRPC状态 | 自动重试/处置 |
|---|---|---|---|
| INVALID_INPUT / UNKNOWN_FIELD / INVALID_IF_MATCH / DEADLINE_REQUIRED | 400 | INVALID_ARGUMENT | 修正请求，不重试原无效输入 |
| UNAUTHENTICATED / REAUTHENTICATION_REQUIRED / CONFIRMATION_EXPIRED / SIGNATURE_REQUIRED / SIGNATURE_INVALID / SIGNATURE_EXPIRED | 401 | UNAUTHENTICATED | 重新认证/确认；后三个仅机构签名模式 |
| FORBIDDEN / CERTIFICATE_REVOKED / SIGNER_NOT_AUTHORIZED | 403 | PERMISSION_DENIED | 当前权限不满足；不可借幂等绕过 |
| NOT_FOUND | 404 | NOT_FOUND | 不存在或不可见，不猜号 |
| METHOD_NOT_ALLOWED | 405 | UNIMPLEMENTED | 只用已声明方法；HTTP带Allow |
| IDEMPOTENCY_CONFLICT / NONCE_REUSED / FILING_ALREADY_EXISTS / CONFIRMATION_MISMATCH | 409 | ALREADY_EXISTS | 不自动改文重试；原请求可恢复，确认不得跨业务移植 |
| FILE_NOT_READY | 409 | FAILED_PRECONDITION | 条件可重试，2000毫秒查询原资源；不是终态错误 |
| TRADE_NOT_EDITABLE / DEPENDENT_FILING_CONFLICT | 409 | FAILED_PRECONDITION | 停止直接修改，转专门流程 |
| REVISION_CONFLICT | 412 | FAILED_PRECONDITION | GET后人工合并、新键/新标签 |
| UNSUPPORTED_MEDIA_TYPE | 415 | INVALID_ARGUMENT | 写接口使用application/json，不自动转换正文 |
| CURRENCY_NOT_SUPPORTED / DOCUMENT_INCONSISTENT / REQUIRED_MATERIAL / REQUIRED_EVIDENCE / FILE_REJECTED / REQUIRED / IDENTITY_MISMATCH / CONFIRMATION_REQUIRED / INVALID_QUANTITY / INVALID_AMOUNT / INVALID_PACKING | 422 | INVALID_ARGUMENT | 修正字段/业务/证据，永久文件错误不重试 |
| IF_MATCH_REQUIRED | 428 | FAILED_PRECONDITION | GET取得本方版本 |
| RATE_LIMITED | 429 | RESOURCE_EXHAUSTED | 尊重Retry-After/retryAfterMs及总预算 |
| DEPENDENCY_UNAVAILABLE | 503 | UNAVAILABLE | 1000毫秒后条件恢复；不冒充成功 |
| COMMIT_OUTCOME_UNKNOWN | 503 | UNAVAILABLE | outcomeUnknown=true，主库原键恢复 |
| RECEIPT_NOT_READY | 503 | UNAVAILABLE | 已确定业务受理，outcomeUnknown=false；后台补原签名回执 |
| DEADLINE_EXCEEDED | 504或客户端无响应 | DEADLINE_EXCEEDED | 写结果可能未知，原键恢复，不能盲重做 |
| CLIENT_CANCELLED | 客户端已断连无响应 | CANCELLED | 取消等待不等于取消COMMIT |
| INTERNAL_ERROR | 500 | INTERNAL | 告警/人工定位，写结果仍先核实 |

HTTP问题详情新增`outcomeUnknown`、`retryAfterMs`；临时503/429带`Retry-After`秒值，其他永久错误不暗示自动重试。不得将客户端取消虚构成标准HTTP 499接口响应。未知错误不能默认为成功或可重试的新请求。

RPC缺少实际HTTP对应响应（如客户端取消）时`RpcFailure.httpStatus=0`，不得当作HTTP状态发送。未知RPC方法为UNIMPLEMENTED；合法路由上不支持的HTTP方法返回405，未知HTTP资源仍404。证明头超过16KiB返回400 INVALID_INPUT并明确头定位，不尝试截断验签。

## 9. 浏览器确认资源

OperationIntent.method/resourcePath/idempotencyKey/ifMatch/bodySha256是要提交业务的精确意图；空ifMatch必须参与重建，不传主体或“已认证”标记。确认创建也有自己独立Idempotency-Key（不要与目标业务键混用）；服务端只在已重新认证的实名会话中保存随机确认号，重放同键不延长时效，过期要新键创建。GET仅本人可见，返回expiresAt/state/requestDigest，不存/返回令牌或私密正文。新会话链需新确认；会话续期按已核实同一授权链。

Cookie模式须Secure/HttpOnly/SameSite、CSRF令牌与Origin校验；不能将长期令牌放localStorage。本项目未部署登录/短信/通行密钥服务，接口设计不把前端自报“确认了”作为强认证证据。HTTPS只保护传输；合同的可靠签署交第三方电子签平台，见步骤二。创建确认返回受控服务端记录，不要求递归平台签名回执，其余业务受理回执保持原规范。

OperationConfirmation.requestDigest为类型重建后的OperationIntent规范JSON的SHA-256（含method/resourcePath/idempotencyKey/ifMatch/bodySha256）；服务端主体/组织/会话/受众另绑定不可改审计，不能仅凭客户端意图摘要取得授权。它不同于原业务HMAC或平台回执businessRequestDigest，不能替换这些既有摘要。

## 10. RESPONSE、cURL与显式ReqMsg / RspMsg

[完整HTTP示例](examples/step1/http-reference.md)逐个列出本步骤**全部16个方法**的可复制cURL、HTTP RESPONSE状态行/响应头/JSON，含读取、内部只读概览、确认资源；机器可读源为[http-examples.json](examples/step1/http-examples.json)。页面每个关联接口分别展开RESPONSE、cURL、ReqMsg/RspMsg定义，不只给方法签名。

每个RPC均显式定义`<方法名>ReqMsg`和`<方法名>RspMsg`，例如：

```proto
message CreateTradeReqMsg { TradeInput trade = 1; }
message CreateTradeRspMsg { Trade resource = 1; }
rpc CreateTrade(CreateTradeReqMsg) returns (CreateTradeRspMsg) {
  option (google.api.http) = {
    post: "/api/v1/trades" body: "trade" response_body: "resource"
  };
}
```

HTTP发送TradeInput、返回Trade资源JSON，不需要`trade`/`resource`外壳；RPC则发送ReqMsg并接收`{"resource": {...}}`强类型RspMsg。字段/路径参数保原编号与类型；未发布契约的旧Request名称统一为ReqMsg，不能对已部署客户端无版本迁移地直接改名。RspMsg不加code/message/success把失败伪装成功，错误仍为非2xx问题详情或非OK google.rpc.Status/RpcFailure；ETag/Location/受理回执保持头/metadata契约。

cURL使用环境变量BASE_URL/ACCESS_TOKEN/CONFIRMATION_ID，`.invalid`地址/合成凭据不可运行成功。先实名强认证、展示精确内容并取得绑定当前正文/原键/标签的确认，再提交业务；确认创建有独立原键。cURL不模拟用户点击或冒称已认证，不加自动写重试；未知结果保留原键原文恢复。内部例必须用内部入口和受众凭证；Cookie集成另须CSRF/Origin，不能机械复制Bearer例绕过。
