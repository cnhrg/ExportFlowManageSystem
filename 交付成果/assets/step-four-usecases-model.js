'use strict';
(function(root){
  const common=root.EXPORT_SYSTEM_USECASES_MODEL||(typeof require==='function'?require('./system-usecases-model.js'):null);
  const proto='proto/trade/customs/v1/customs.proto';
  const endpointSpecs=[
    ['basis','GetCustomsBasis','GET','/api/v1/shipments/{shipment_number}/customs-basis','','','CustomsBasis','外部服务','批准快照、冻结批次计划、A/B/C/F及实际委托；只读，不证明双抬头合法'],
    ['create','CreateCustomsDeclaration','POST','/api/v1/shipments/{shipment_number}/customs-declarations','draft','DeclarationDraft','CustomsReceipt','外部服务','F建立本地草稿与完整不可变首版；不是正式申报号'],
    ['read','GetCustomsDeclaration','GET','/api/v1/customs-declarations/{declaration_number}','','','CustomsDeclaration','外部服务','本方当前投影、逐版历史及待核门禁'],
    ['revision','CreateCustomsRevision','POST','/api/v1/customs-declarations/{declaration_number}/revisions','revision','RevisionInput','CustomsReceipt','外部服务','F补正另建版本，原表头及商品行保留，旧审核及A确认不复用'],
    ['revision-read','GetCustomsRevision','GET','/api/v1/customs-declarations/{declaration_number}/revisions/{revision_number}','','','DeclarationRevision','外部服务','读取确切旧版表头/商品/摘要与该版审查、A确认'],
    ['review-submit','CreateCustomsReviewSubmission','POST','/api/v1/customs-declarations/{declaration_number}/review-submissions','submission','ReviewSubmissionInput','CustomsEvent','外部服务','F冻结确切版本送审'],
    ['context','GetCustomsReviewContext','GET','/internal/v1/customs-declarations/{declaration_number}/review-context','','','CustomsReviewContext','内部运营','独立审核上下文，与F/A凭证隔离'],
    ['review','CreateCustomsReviewDecision','POST','/internal/v1/customs-declarations/{declaration_number}/review-decisions','decision','ReviewDecisionInput','CustomsEvent','内部运营','独立人员对原送审版通过或退回，禁止自审'],
    ['confirm','CreateCustomsExporterConfirmation','POST','/api/v1/customs-declarations/{declaration_number}/exporter-confirmations','confirmation','ExporterConfirmationInput','CustomsEvent','外部服务','仅A有权人对确切版本/hash书面确认，技术点击凭据不能替代书面证据'],
    ['filing','CreateCustomsFilingRequest','POST','/api/v1/customs-declarations/{declaration_number}/filing-requests','filing','FilingRequestInput','FilingRequest','外部服务','正式申报/更正/撤回的原号持久意图；待办不是外部提交成功'],
    ['filing-read','GetCustomsFilingRequest','GET','/api/v1/customs-declarations/{declaration_number}/filing-requests/{request_number}','','','FilingRequest','外部服务','未知按原号查正式渠道，不盲目再发'],
    ['evidence','CreateCustomsOfficialEvidence','POST','/api/v1/customs-declarations/{declaration_number}/official-evidence','evidence','OfficialEvidenceInput','CustomsEvent','外部服务','F登记正式来源声明，初始待核实，不直接放行'],
    ['evidence-read','GetCustomsOfficialEvidence','GET','/api/v1/customs-declarations/{declaration_number}/official-evidence/{event_number}','','','CustomsEvent','外部服务','待核、拒绝或已核实原证据及补正原因'],
    ['verify','CreateCustomsOfficialEvidenceDecision','POST','/internal/v1/customs-declarations/{declaration_number}/official-evidence-decisions','decision','OfficialEvidenceDecisionInput','CustomsEvent','内部运营','独立核验正式来源、原办理号、确切版、外部事件键及阶段；技术验签失败不是退单'],
    ['delivery','CreateCustomsAttachmentDelivery','POST','/api/v1/customs-declarations/{declaration_number}/attachment-deliveries','delivery','AttachmentDeliveryInput','AttachmentDelivery','外部服务','F向A或B分别交付确切正式附件2；发送不代表接收'],
    ['delivery-read','GetCustomsAttachmentDelivery','GET','/api/v1/customs-declarations/{declaration_number}/attachment-deliveries/{delivery_number}','','','AttachmentDelivery','外部服务','只读本方交付与独立接收，不向另一主体泄露凭据'],
    ['receipt','CreateCustomsAttachmentReceipt','POST','/api/v1/customs-declarations/{declaration_number}/attachment-deliveries/{delivery_number}/receipts','receipt','AttachmentReceiptInput','CustomsEvent','外部服务','仅该交付的A或B本人确认接收或异议，不代另一方接收'],
    ['event-read','GetCustomsEvent','GET','/api/v1/customs-declarations/{declaration_number}/events/{event_number}','','','CustomsEvent','外部服务','按原Location读取本方可见的送审/确认/交接事件，内部决定不泄露他方材料'],
    ['internal-event-read','GetInternalCustomsEvent','GET','/internal/v1/customs-declarations/{declaration_number}/events/{event_number}','','','CustomsEvent','内部运营','内部原决定资源读取，不借用F/A身份']
  ];
  const endpoints=endpointSpecs.map(([id,rpc,method,path,body,input,output,audience,detail])=>({
    id:'s4-'+id,rpc,method,path,body,input:input||'—',output,audience,detail,status:method==='POST'?'201':'200',
    reqMsg:rpc+'ReqMsg',rspMsg:rpc+'RspMsg',responseBody:'resource',query:[],file:proto,
    service:audience==='内部运营'?'InternalCustomsOperationsService':'ExternalCustomsService',
    timeout:method==='GET'?common.timeouts.read:common.timeouts.write
  }));
  const specs=[
    {id:'basis',name:'查看报关前还缺哪些资料',actor:'出口报关代理经办人',actors:['出口报关代理经办人'],links:['basis'],
      description:'出口报关代理查看本批次已批准的交易资料、已确定的运输计划，以及报关所需的主体、文件和委托。系统列出缺项；最新未批准的资料、样例国别和草稿不能充当依据。适用法律、授权或拆报合并规则未确认时，只能备料，不能正式办理。',
      black:['F->>SYS: 查看本批次的报关准备情况','SYS-->>F: 已批准交易资料、运输计划，以及供应商、出口代理、收货人、报关代理和三单清单','F->>SYS: 查看还缺哪些委托或监管依据','SYS-->>F: 列出缺项；缺正式依据时只能备料，尚不能认定双抬头填报有效'],
      impl:['PAGE->>APP: GET批次customs-basis','APP->>DB: 当前对象授权；读原因2快照及同批冻结物流计划','APP->>DB: 读合同生效及正式电子委托引用，按快照解析角色1/2/3/6','APP-->>PAGE: 200准备依据及交易/批次标签；缺规则列missing_gate_codes，无写入']},
    {id:'draft',name:'填写并保存报关草稿',actor:'出口报关代理经办人',actors:['出口报关代理经办人'],links:['basis','create','read','revision-read'],
      description:'出口报关代理填写完整报关表头和商品明细。生产销售单位、境内发货人、实际境外收货人及报关代理分别取自批准资料，不能混用。系统保存首版全文并分配本地申报号，后续仍可还原这一版；保存草稿尚未向海关申报。',
      black:['F->>SYS: 查看批次准备依据','SYS-->>F: 已批准商品、实际主体、可申报数量和缺项','F->>SYS: 核对完整草稿及附件版本后保存','SYS-->>F: 草稿已保存，返回本地申报号、版本1和内容摘要；尚未正式申报'],
      impl:['PAGE->>APP: POST批次customs-declarations及draft','APP->>DB: 锁交易根、批次；当前读全部同批有效申报最新修订商品行FOR UPDATE','APP->>DB: 校验原因2快照/计划版/角色序号/单位及CNY，拆报合并规则未确认则阻断第二单','APP->>DB: 本地计数取号；INSERT申报根、revision1完整content_json/hash及逐行商品','APP->>DB: 同COMMIT保存草稿事件/受理/确认消费；不写external_declaration_number或submitted_at']},
    {id:'revision',name:'修改报关草稿并保留旧版',actor:'出口报关代理经办人',actors:['出口报关代理经办人'],links:['read','revision-read','revision'],
      description:'出口报关代理根据退回意见另存一版完整草稿，旧版内容和审核记录继续保留。尚未执行的草稿或已核实退单可补正；办理结果不明，或海关已受理但尚无更正许可时，不能直接改写。同一申报改版只替换原占用数量，不重复占用批次。',
      black:['F->>SYS: 查看旧版和退回原因','SYS-->>F: 原表头商品、审核和供应商确认记录，以及是否有结果未明的办理','F->>SYS: 提交完整修改稿，注明原版本和修改理由','SYS-->>F: 返回新版及摘要，原确认不再适用；办理结果不明时保留原版并说明原因'],
      impl:['PAGE->>APP: POST revisions及base_revision_number/完整draft/reason','APP->>DB: 锁申报根、原办理；pending或unknown执行禁止新版本','APP->>DB: 当前读原版、同批其他申报行；本申报旧版只计一次替换，禁止跨单合并或单位换算','APP->>DB: INSERT revision n+1完整表头和商品；原content_json/hash及旧行绝不UPDATE','APP->>DB: 根指向新修订并转草稿；追加更正事件含baseRevision/reason，不复制旧审查或A确认']},
    {id:'review',name:'提交报关草稿并由独立人员审核',actor:'出口报关代理经办人',actors:['出口报关代理经办人','独立关务审核员'],links:['review-submit','context','review','revision-read'],
      description:'出口报关代理将指定版本送审，独立关务审核员核对正文、原件、有关主体和计量单位，再决定通过或退回。审核员不能是草稿作者或送审人。退回意见须保留，修改后重新送审；审核通过后还须供应商书面确认。',
      black:['F->>SYS: 将指定版本和内容摘要送审','SYS-->>F: 返回送审号，等待独立审核','REVIEWER->>SYS: 查看送审稿、原件、有关主体和计量单位','SYS-->>REVIEWER: 显示该版全文、依据和缺项','REVIEWER->>SYS: 审核通过或退回，并填写原因','SYS-->>REVIEWER: 保存该版审核结论；通过后仍须供应商书面确认及正式授权'],
      impl:['PAGE->>APP: F POST review-submissions，或内部POST review-decisions','APP->>DB: 锁revision及原送审事件；送审冻结revision/hash和submitter','alt 内部审查','APP->>DB: 当前读原送审及exact文件；actor不等于created_by/submitter，确认属于internal受众','APP->>DB: 检查表头主体、商品、三单与运输一致；追加独立决定、理由和证据，根3或9','else F送审','APP->>DB: 校验当前版未有待审，追加待审事件，根2','end','APP->>DB: 事件/根状态投影/受理/确认消费同COMMIT；修订初始状态冻结，退回不制造海关退单']},
    {id:'confirm',name:'供应商书面确认最终报关稿',actor:'供应商授权确认人',actors:['供应商授权确认人'],links:['revision-read','confirm'],
      description:'供应商有权人员查看已独立审核通过的最终报关稿，上传书面确认文件。确认记录须对应同一申报号、版本、内容摘要、批准交易资料和运输计划，并有有效授权。页面点击确认只能防止误操作，不能替代书面文件；内容有变须重新确认。',
      black:['A->>SYS: 查看最终稿和独立审核结论','SYS-->>A: 全文、摘要、运输计划、批准依据和书面确认要求','A->>SYS: 上传书面确认文件并确认这一版','SYS-->>A: 保存该版确认记录；后续内容有变须重新确认'],
      impl:['PAGE->>APP: A POST exporter-confirmations，revision/hash及written_evidence','APP->>DB: 锁申报根/revision/独立通过事件；当前读核对版本与hash','APP->>DB: 核实A身份及授权范围/有效期，文件必须ready且确切版本摘要一致','APP->>DB: 追加A业务确认事件含actor/authority/文件清单；不把技术confirmation_id当书面证据','APP->>DB: 根状态4及受理/技术确认消费同COMMIT；并发改版由同根锁串行，旧确认不迁移']},
    {id:'filing',name:'申请正式报关办理并查询原办理结果',actor:'出口报关代理经办人',actors:['出口报关代理经办人'],links:['read','filing','filing-read'],
      description:'出口报关代理为已确认版本申请正式申报、更正或撤回，系统保存办理请求和对应编号。有效合同、电子委托、职责、范围和渠道都须有正式依据；渠道未接入时只显示待办和缺项。超时后用原办理号查结果，不能换号再报。',
      black:['F->>SYS: 查看供应商已确认版本，以及正式渠道和授权是否齐备','SYS-->>F: 显示可办事项和缺项，分别列出草稿、提交、受理、放行进度','F->>SYS: 确认后申请办理这一版','SYS-->>F: 返回原办理号及待办理或阻断原因，尚不能证明已向海关提交','F->>SYS: 响应超时后按原办理号查询','SYS-->>F: 结果不明时保留原号，先向正式渠道查单，不另号重报'],
      impl:['PAGE->>APP: POST filing-requests，action/revision/hash/original_request','APP->>DB: 锁申报根、同版独立决定及A确认、原办理集合FOR UPDATE','APP->>DB: 当前读确认精确匹配；unknown原号存在禁止第二意图；更正/撤回核对原官方办理与适用许可','APP->>DB: INSERT customs_filing_request_tab含不可变请求hash/payload及pending1，COMMIT后才可能外部I/O','opt 未来经正式确认渠道且允许办理','APP->>CHANNEL: 事务外原办理号提交或查单，显式deadline，超时不重发新号','APP->>DB: 新短事务锁原办理号，未知写execution_status3；响应留待核原件','end','APP-->>PAGE: 原办理资源及missing_gate_codes；未核实官方证据不得改为已提交/受理/放行']},
    {id:'official',name:'登记并核实海关回执',actor:'出口报关代理经办人',actors:['出口报关代理经办人','独立关务审核员'],links:['evidence','evidence-read','context','verify'],
      description:'出口报关代理登记正式来源的申报、受理、查验、放行、退单、更正或撤回凭据，独立审核员逐项核实。登记后先显示待核，核实通过才更新对应进度。验签失败或渠道缺失只能说明尚未核实，不能写成海关退单或最终拒绝。',
      black:['F->>SYS: 登记原办理号、正式来源、事件键和确切文件','SYS-->>F: 待核证据事件，不推进正式进度','REVIEWER->>SYS: 查看来源、原办理、确切版及前序事实','SYS-->>REVIEWER: 原件与验真缺项；技术异常不冒充监管决定','REVIEWER->>SYS: 独立核实或拒绝并说明原因','SYS-->>REVIEWER: 仅真实证据齐备才推进对应阶段；无证据保持待核'],
      impl:['PAGE->>APP: F POST official-evidence，内部POST evidence-decisions','alt F登记声明的短事务','APP->>DB: 待核登记仅追加业务event17，保存源事件键及原办理/版/文件声明，COMMIT','else 独立核实','APP->>CHANNEL: 无事务/无锁时按正式授权渠道查验原件，未配置/来源不可信直接阻断','APP->>DB: 新短事务锁申报根、办理、待核事件；核对审核员非提交者及确切版','APP->>DB: 当前读前序已核实事件；受理不能替代提交，放行不能仅凭签名/草稿','APP->>DB: 已核实外部键唯一去重；同键异文冲突，历史通知不倒退当前状态','APP->>DB: 追加核实决定18与对应正式事件；根状态/官方号/时刻及原办理投影同COMMIT','end','Note over APP,DB: 来源失败仅拒绝核实理由，不写监管退单/拒绝，不释放占量']},
    {id:'correction',name:'处理海关退单、更正或撤回',actor:'出口报关代理经办人',actors:['出口报关代理经办人','独立关务审核员','供应商授权确认人'],links:['evidence-read','revision','review-submit','review','confirm','filing'],
      description:'正式退单或更正要求核实后，出口报关代理另建修改稿，重新独立审核，再由供应商书面确认。撤回须关联原办理号，并取得已核实的正式撤回证据后才释放占用数量；删除草稿或发生超时都不能当作撤回成功。',
      black:['REVIEWER->>SYS: 核实原办理号的正式退单或更正要求','SYS-->>REVIEWER: 显示需补正的内容及原版历史，技术错误不记成退单','F->>SYS: 另建完整修改稿并重新送审','REVIEWER->>SYS: 独立审核新版本','A->>SYS: 书面确认新版本','F->>SYS: 关联原办理号申请更正或撤回','SYS-->>F: 返回原办理记录；结果不明时不释放占量，撤回未核实前不标已撤回'],
      impl:['PAGE->>APP: 读取已核实退单事件，POST更正版/重审/新A确认','APP->>DB: 同根锁验证退单属于该申报/原办理；新修订保留原批准版本关系','APP->>DB: 更正按同申报替换量校验，不把各历史修订累加占量','PAGE->>APP: POST action correction或withdrawal及original_request_number','APP->>DB: 核对正式动作权限/范围/原因与原号；受理后不得客户端直接改根','APP->>DB: 撤回意图不转状态11、不释放数量；未知原号保持，COMMIT释放锁','APP->>CHANNEL: 事务外原号办理或查询，缺正式渠道阻断','APP->>DB: 新短事务仅正式撤回已独立核实才状态11；补正仍须新独审与A确认；终态不能静默重开']},
    {id:'attachment',name:'分别向供应商和出口代理交付附件2并确认接收',actor:'出口报关代理经办人',actors:['出口报关代理经办人','供应商授权接收人','出口代理授权接收人'],links:['delivery','delivery-read','receipt'],
      description:'出口报关代理将与正式申报版本一致的附件2原件，分别交付供应商和出口代理，由各自有权人员接收或提出异议。两方接收互不代替，异议也不能记成已接收；交付和接收记录均保留。海关是否放行仍须另查正式凭据。',
      black:['F->>SYS: 选择正式附件2版本，交付供应商','SYS-->>F: 返回供应商交付号，等待接收','F->>SYS: 将附件2另行交付出口代理','SYS-->>F: 返回出口代理交付号，等待接收','A->>SYS: 查看交付给本方的附件2，确认接收或提出异议','SYS-->>A: 保存供应商的结果，出口代理仍须自行确认','B->>SYS: 查看交付给本方的附件2，确认接收或提出异议','SYS-->>B: 保存出口代理的结果；放行情况另查海关凭据'],
      impl:['PAGE->>APP: F POST attachment-deliveries，recipient_role A或B及exact_file','APP->>DB: 锁根及正式提交事件；核对附件2来源/版/hash/文件ready且B为境内发货人','APP->>DB: 追加业务delivery事件含recipient/manifest，返回独立delivery_number','PAGE->>APP: A或B POST该delivery下receipts','APP->>DB: 锁原交付事件；当前权限角色必须等于收件方，不允许F代收/跨方接收','APP->>DB: 追加received或disputed事件及证据；去重绑定同一交付和接收方','APP->>DB: 受理及技术确认同COMMIT；A已接收不补造B接收，交付更正另建且旧历史保留']},
    {id:'query',name:'查询报关历史和原请求结果',actor:'出口报关代理经办人',actors:['出口报关代理经办人','供应商授权确认人','出口代理授权接收人','独立关务审核员'],links:['read','revision-read','filing-read','evidence-read','delivery-read','context','event-read','internal-event-read'],
      description:'各方按权限查看旧版全文、审核、供应商确认、办理进度，以及分别交付和接收的记录。提交后没收到响应，须用原请求编号、原内容和原版本标记查询；已受理的同一请求返回原回执，不因版本后来变化或确认已被使用而重复执行。同号内容不同则拒绝。',
      black:['F->>SYS: 查看当前稿、旧稿及原办理号','SYS-->>F: 显示各版全文、审核、供应商确认、待核凭据和交接记录','A->>SYS: 查看本方确认过的版本和附件接收记录','B->>SYS: 查看本方附件2交付和接收记录','REVIEWER->>SYS: 用内部身份查看审核依据','SYS-->>REVIEWER: 显示当前限制和历史记录，不泄露他方凭据','F->>SYS: 用原编号、原内容和原版本标记查询丢失的提交结果','SYS-->>F: 已受理且内容相同则返回原回执；同号异文拒绝，未受理才检查能否新提交'],
      impl:['PAGE->>APP: GET申报/确切revision/原filing/evidence/delivery，读预算5000/4000ms','APP->>DB: 当前对象及受众授权；按明确资源键读当前根/不可变修订/业务事件','APP-->>PAGE: 200本方历史和当前标签，无消费确认/状态写入','opt 原写响应丢失','PAGE->>APP: 原方法/路径/键/原文/标签/确认重入，禁止换键重办','APP->>DB: BEGIN RC先查受理；验证当前权限及HMAC同文','alt 原受理存在','APP-->>PAGE: 200原冻结投影和原Location；优先于当前新标签/已消费确认','else 尚未受理','APP->>DB: 锁交易根/批次/申报，再次当前读受理；仍无才验证完整新命令','end','end']}
  ];
  const useCases=specs.map((s,i)=>{
    const aliases={F:'出口报关代理经办人',A:s.id==='attachment'?'供应商授权接收人':'供应商授权确认人',B:'出口代理授权接收人',REVIEWER:'独立关务审核员'};
    const names=[...new Set(s.black.flatMap(line=>[...line.matchAll(/\b(F|A|B|REVIEWER)->>/g)].map(m=>m[1])))];
    const systemSequence=['sequenceDiagram',...names.map(key=>'    actor '+key+' as '+aliases[key]),'    participant SYS as 代理出口系统',...s.black.map(line=>'    '+line)].join('\n');
    const readOnly=s.id==='basis'||s.id==='query';
    const sequence=['sequenceDiagram','    autonumber','    participant PAGE as '+s.actor+'前端','    participant APP as 单体应用两受众受限入口','    participant DB as 同一MySQL业务及技术中间件','    participant FILE as 私有S3与ClamAV文件工作流','    participant CHANNEL as 正式监管渠道未接入',
      ...(!readOnly?[
        '    PAGE->>APP: GET当前资源/版本并逐项查看本次内容，读预算5000/4000ms',
        '    opt 本目标需要文件',
        '      PAGE->>FILE: 共用持久上传任务/原始字节/确切VersionId',
        '      APP->>FILE: 事务外核验摘要及ClamAV；固定键条件写，失败原任务自恢复',
        '    end',
        '    PAGE->>APP: 明确确认本次精确内容，取得受众/路径/键/标签/内容HMAC绑定凭据',
        '    Note over APP,DB: 下述每次本地业务写各自BEGIN READ COMMITTED；先查原受理，同文回放优先，异文409',
        '    APP->>DB: 固定序锁交易根→批次→申报号排序→修订/商品→办理/事件→文件→确认→受理',
        '    APP->>DB: 锁后当前读受理/门禁，缺确认或旧标签拒绝；1秒锁等待/2秒事务预算'
      ]:[]),
      ...s.impl.map(line=>'    '+line),
      ...(!readOnly?['    Note over APP,DB: 写预算客户端10000/应用8000ms；失败整体ROLLBACK，COMMIT未知先主库查原键','    Note over APP,FILE: 所有外部I/O事务外；业务历史进关务修订/办理/事件，不塞通用技术封套']:[])
    ].join('\n');
    return {id:'s4-'+s.id,code:'步骤四用例'+(i+1),name:s.name,actor:s.actor,actors:s.actors,description:s.description,
      transaction:s.impl.join('；'),intent:s.name,endpoints:s.links.map(x=>'s4-'+x),systemSequence,sequence};
  });
  const rules=[
    ['步骤四规则一','N07/N08/N09；仅设计和隔离验证驱动。无海关正式渠道/职责/范围证据时失败关闭，不宣称双抬头法律有效。'],
    ['步骤四规则二','A生产销售单位/B境内发货人/C真实境外收货人/F报关代理分别取批准快照角色1/2/3/6；不可复制历史样例国别或错误表头。'],
    ['步骤四规则三','完整表头及行、来源快照/批次计划、摘要在customs_declaration_revision_tab；逐版旧内容不改。审查/A确认/证据/交接在封闭关务事件载体，办理在独立请求表。'],
    ['步骤四规则四','A书面确认绑定申报号/版本/hash/批准快照/批次计划版/授权/文件；改版不得继承独审或A确认。技术意图确认不是A业务书面确认。'],
    ['步骤四规则五','同批全部有效申报按最新修订逐行FOR UPDATE当前读；更正只替换本单占量。CNY及原单位，拆报/合并/单位换算缺正式规则阻断。'],
    ['步骤四规则六','草稿、待办/未知、正式提交、受理、查验、放行、退单、撤回、终局拒绝分别建模；技术失败不能伪造成监管拒绝。'],
    ['步骤四规则七','单体两受众隔离；当前权限、先查重入及锁后复查；RC根锁/当前读/内容绑定确认/短事务，S3/ClamAV/官方I/O均事务外。'],
    ['步骤四规则八','未知保持原办理号不重复发，不释放占量；正式更正/撤回必须原号、许可及真实证据。终局不可静默重开。'],
    ['步骤四规则九','附件2发送、A接收、B接收、放行四件事；交付和接收分别事件，收件方本人操作，异议不能视为已接收。'],
    ['步骤四规则十','所有图原生70%由共享工作台呈现；本步不改HTML。HTTP明确response_body resource，RPC显式ReqMsg/RspMsg与deadline，无自动写重试。']
  ];
  const model={id:'step-four',name:'步骤四 · 报关与放行',endpoints,useCases,rules,errors:[...common.errors,
    ['CUSTOMS_VERSION_CONFLICT / CUSTOMS_STATE_CONFLICT / CUSTOMS_QUANTITY_EXCEEDED',409,'FAILED_PRECONDITION',false,'读取原版/原办理及同批当前占量后另建完整补正；不能覆盖历史或换号重报'],
    ['CUSTOMS_INDEPENDENT_REVIEW_REQUIRED / CUSTOMS_EXACT_CONFIRMATION_REQUIRED',422,'FAILED_PRECONDITION',false,'对新确切版独立审核，A重新书面确认及有效授权'],
    ['CUSTOMS_AUTHORITY_UNVERIFIED / CUSTOMS_OFFICIAL_EVIDENCE_REQUIRED / CUSTOMS_SCOPE_UNCONFIRMED',422,'FAILED_PRECONDITION',false,'补正式职责/渠道/范围/原件；无外部接入不能伪造通过'],
    ['CUSTOMS_EXECUTION_UNKNOWN / CUSTOMS_EVENT_CONFLICT',409,'FAILED_PRECONDITION',false,'原办理号先查单；同源键异文拒绝；不生成第二次正式请求'],
    ['FILE_PURPOSE_INVALID',422,'INVALID_ARGUMENT',false,'ready文件仍须符合本目标用途，装箱单不得替代A书面确认或机关回执'],
    ['CUSTOMS_RECIPIENT_MISMATCH',403,'PERMISSION_DENIED',false,'仅指定A或B本人接收对应交付，F不能代收']
  ]};
  root.EXPORT_STEP_FOUR_USECASES_MODEL=model;
  if(typeof module==='object'&&module.exports)module.exports=model;
})(globalThis);
