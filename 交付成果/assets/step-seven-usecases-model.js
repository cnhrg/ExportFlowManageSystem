'use strict';
(function(root){
  const common=root.EXPORT_SYSTEM_USECASES_MODEL||(typeof require==='function'?require('./system-usecases-model.js'):null);
  const base='/api/v1/tax-refund-cases/{tax_case_number}', internal='/internal/v1/tax-refund-cases/{tax_case_number}';
  const endpoints=[
    ['s7-create','CreateRefundCase','POST','/api/v1/trades/{trade_number}/tax-refund-cases','PreparationInput','RefundCase','preparation','外部服务','建立有范围引用的准备案件；规则未知不得正式申请'],
    ['s7-read','GetRefundCase','GET',base,'—','RefundCase','','外部服务','仅本方材料、确切版、已核实进度与原受理引用'],
    ['s7-package','CreateRefundPackage','POST',base+'/submission-revisions','PackageInput','Submission','package','外部服务','冻结业务内容、范围规则及文件版本，提交独立审核'],
    ['s7-submission','GetRefundSubmission','GET',base+'/submission-revisions/{submission_revision_number}','—','Submission','','外部服务','查询指定不可变业务版、审核快照及执行状态'],
    ['s7-context','GetRefundReviewContext','GET',internal+'/review-context','—','ReviewContext','','内部运营','独立审批人查看批准依据、职责及缺证据门禁'],
    ['s7-review','CreateRefundReview','POST',internal+'/review-decisions','ReviewInput','Receipt','decision','内部运营','禁止自审；批准或退回绑定确切内容摘要'],
    ['s7-dispatch','CreateRefundDispatch','POST',base+'/dispatch-intents','DispatchInput','Receipt','intent','外部服务','法定权限和范围规则核实后只记录办理意图，未知不重发'],
    ['s7-notice','CreateRefundNotice','POST',internal+'/official-notices','OfficialNoticeInput','Receipt','notice','内部运营','核实真实税务来源、确切提交版和源key；技术通知不代表受理'],
    ['s7-correction','CreateRefundCorrection','POST',base+'/correction-revisions','CorrectionInput','Submission','correction','外部服务','关联原版及补正事件建立新业务版，必须重新独立审核'],
    ['s7-followup','CreateRefundFollowUp','POST',base+'/follow-ups','FollowUpInput','Receipt','follow_up','外部服务','登记待办/查询进度，不猜期限、不改变官方结论'],
    ['s7-credit','ReconcileRefundCredit','POST',internal+'/credit-reconciliations','CreditInput','Receipt','reconciliation','内部运营','独立真实A账户资金观测核实，缺权威载体即阻断；绝不增加B货款余额'],
    ['s7-recovery','GetRefundOperation','GET',base+'/operations/{operation_number}','—','Operation','','外部服务','读取原意图和未知状态，不能凭当前案件倒推某次提交成功']
  ].map(([id,rpc,method,path,input,output,body,audience,detail])=>({
    id,rpc,method,path,input,output,body,audience,detail,status:method==='GET'?'200':'201',
    reqMsg:rpc+'ReqMsg',rspMsg:rpc+'RspMsg',responseBody:'resource',query:[],
    file:'proto/trade/taxrefund/v1/taxrefund.proto',
    service:audience==='内部运营'?'InternalTaxRefundOperationsService':'ExternalTaxRefundService',
    timeout:method==='GET'?common.timeouts.read:common.timeouts.write
  }));
  const goals=[
    ['prepare','供应商准备退税材料并确认申请范围',['供应商经办人'],['s7-create','s7-read'],
      '供应商核对本方身份、批准交易资料、正式报关附件和步骤六证明，准备退税材料。申请金额尚未确定也可先备料；税率、期限和分案范围须有正式规则，不能默认一笔交易只建一个退税案件。',
      ['锁trade_record根，当前读同type2且scope_reference的案件；type1证明不混用','按已确认规则规范化范围；规则未知只存准备引用，禁止正式提交','INSERT tax_case(type2,status1,CNY,claimed_amount可NULL)及准备事件，业务范围留event_payload'],
      ['供应商经办人->>SYSTEM: 查看退税责任、材料清单和范围规则','SYSTEM-->>供应商经办人: 未确认项与允许准备范围，不推算税率','供应商经办人->>SYSTEM: 提交本方备料与范围引用','SYSTEM-->>供应商经办人: 准备案件、缺项和确切标签，不是正式申请']],
    ['package','核对退税材料并提交一个完整版本',['供应商经办人'],['s7-read','s7-package','s7-submission'],
      '供应商选定退税材料及所需的报关、供应商确认、官方回执、证明、交接或银行费用凭据，核对申请内容后固定为一版送审。系统保留每份文件的具体版本和用途；规则未确认时可备料，但不能批准正式提交。',
      ['读取文件task完成状态、用途、S3 VersionId/hash与扫描结果；文件缺失拒绝','锁案件及全部提交版当前读；分配next revision，不覆盖历史','INSERT submission_content_json(批准快照/范围/规则/申请额/账户依据)和evidence_manifest_json','冻结package_hash，status待审；案件1或退回后回2，review_snapshot NULL'],
      ['供应商经办人->>SYSTEM: 选择文件版本，填写本次申请内容并检查','SYSTEM-->>供应商经办人: 显示缺项、内容摘要、申请范围和版本预览','供应商经办人->>SYSTEM: 确认这一版内容并送审','SYSTEM-->>供应商经办人: 保存本版等待独立审核，尚未正式受理']],
    ['review','独立审核退税材料或退回补充',['独立税务审核员','供应商经办人'],['s7-context','s7-review','s7-submission'],
      '独立税务审核员核对指定版本，决定批准或退回。审核员不能是这一版的准备人；范围、责任或核算依据未确认时不能批准。退回后保留原版和意见，由供应商另备新版。',
      ['锁案件/确切提交，校验status2及当前内容hash、独立审核身份','当前读批准交易与文件、职责、范围、核算和账户规则；缺失不批准','追加审核领域事件；review_snapshot_json冻结审核者/摘要/依据/意见','批准案件2→3；退回2→1；旧版本内容及原批准不可覆盖'],
      ['独立税务审核员->>SYSTEM: 查看待审版本和审核依据','SYSTEM-->>独立税务审核员: 显示内容摘要、待确认规则和所需凭据','独立税务审核员->>SYSTEM: 批准或退回并填写理由','SYSTEM-->>独立税务审核员: 保存这一版审核结论，尚未由主管机关受理','SYSTEM-->>供应商经办人: 显示退回原因或待办理进度']],
    ['dispatch','申请提交退税材料并查询原办理结果',['供应商授权经办人'],['s7-dispatch','s7-recovery'],
      '供应商有权经办人选择已批准版本，确认提交。职责和权限须经正式确认；系统先保存办理请求，再通过已接入渠道办理。渠道未接入时停止正式办理，超时或结果不明时用原办理号查询，不能换号重复提交。',
      ['当前读确切版批准快照和有效授权，不接受客户端approved=true','锁submission执行状态；仅未执行允许建立唯一dispatch_reference','写办理意图事件/任务及execution_status待执行，同事务冻结原受理','COMMIT后worker事务外调用已接入渠道；未接入仅阻断，不造发送成功','超时写未知；恢复按原dispatch_reference查询，不能重建意图或记受理'],
      ['供应商授权经办人->>SYSTEM: 查看已批准版本和正式办理权限','SYSTEM-->>供应商授权经办人: 显示本次申请内容及尚未接入的渠道','供应商授权经办人->>SYSTEM: 确认提交这一版','alt 正式权限、范围或渠道不齐全','SYSTEM-->>供应商授权经办人: 说明缺项，停止正式办理','else 可以保存办理请求','SYSTEM-->>供应商授权经办人: 返回原办理号，显示待执行或结果未明；稍后查原号','end']],
    ['notice','核实税务受理、补正和处理进度',['税务通知核实员','供应商经办人'],['s7-context','s7-notice','s7-read'],
      '核实员核对官方通知的真实来源、唯一标识、机关业务号、原件和对应的申请版本，再登记受理、补正或处理中。每种进度须有相应依据，不能用最新材料版本替代通知实际针对的版本。',
      ['按官方来源profile及真实external_event_key先去重，同key异文冲突','锁案件和指定版，不允许以最新版本替代官方exact版','验证签章/来源权威、回执号、时刻和原办理引用，缺证据拒绝','INSERT tax_event(exact revision,external_event_key,event_payload_json,actor_reference)','受理4→5，补正4/5/7→6，处理中5→7；陈旧通知保留证据不回退终态'],
      ['税务通知核实员->>SYSTEM: 查看官方原始通知和对应申请版本','SYSTEM-->>税务通知核实员: 显示原办理号、通知标识和仍缺的核实依据','税务通知核实员->>SYSTEM: 登记核实后的受理、补正或处理进度','alt 缺少正式证据','SYSTEM-->>税务通知核实员: 保留待核任务，正式进度不变','else 已核实','SYSTEM-->>供应商经办人: 显示有正式依据的进度和补正要求','end']],
    ['correction','补充退税材料并重新送审',['供应商经办人','独立税务审核员'],['s7-correction','s7-context','s7-review'],
      '供应商根据正式补正要求另交新版，注明原申请版本和已核实的补正记录，再由独立审核员重审。内部退回也须另备新版，但不能冒充官方补正。新版本不沿用旧批准，已提交的旧版继续保留。',
      ['锁原案件、全部提交版及补正事件，确认事件属于同案件及原exact版','INSERT新revision，previous_submission_revision_number及correction_event_number固定','复制后显式补正业务内容/文件范围并重算hash，review_snapshot_json NULL','新版本execution未执行，案件6→2，旧版历史批准保留但不授权新版本'],
      ['供应商经办人->>SYSTEM: 查看原版及官方补正要求','SYSTEM-->>供应商经办人: 原事件、需补字段和不可覆盖历史','供应商经办人->>SYSTEM: 提交关联原版的新补正版本','SYSTEM-->>供应商经办人: 新版待审，旧批准不可复用','独立税务审核员->>SYSTEM: 独立重审新摘要和补正对应关系','SYSTEM-->>独立税务审核员: 新版审核结果，不直接重报']],
    ['decision','查看退税正式决定并登记后续待办',['税务通知核实员','供应商经办人'],['s7-notice','s7-followup','s7-read'],
      '核实员登记主管机关的正式决定，供应商查看后登记跟进事项。申请金额、批准金额和实际到账金额分别列示；机关处理完成不代表钱已到账，最终拒绝或撤销也不会自动让交易结案。办理期限须有正式规则，未确认时留待确认。',
      ['正式决定仍走官方exact版/源key去重及权威证据核实','approved amount作为决定事件amount；不覆盖claimed_amount，不创建资金流水','正式处理完成写case8；终局拒绝10或正式撤销11只写税务终态','跟进事件记录责任人/规则明确的截止时刻；规则未知deadline NULL','禁止自动交易10、特殊结案或税务终态后自动重开'],
      ['税务通知核实员->>SYSTEM: 核实正式决定、批准额及原确切版','SYSTEM-->>税务通知核实员: 决定已登记或缺证据阻断','供应商经办人->>SYSTEM: 查看决定并登记跟进待办','SYSTEM-->>供应商经办人: 申请额、批准额和到账核对分列；拒绝不结交易']],
    ['credit','核对供应商实际收到的退税款及差额',['独立资金核对员','供应商经办人'],['s7-context','s7-credit','s7-read'],
      '独立资金核对员依据受控渠道取得的真实银行记录，核对供应商收款账户的退税款及差额。系统尚无这种权威资金记录时，必须停止到账核对并说明原因，不能拿税务通知或合成流水证明到账，更不能增加出口代理的货款余额。',
      ['当前读税务正式批准事件及其批准额，不把税务通知当到账','读取真实资金域受控观察及A收款账户归属、币种、稳定银行源key','没有该权威载体或真实流水即阻断，ROLLBACK无资金/余额/税务到账事件','若未来接入核对部分/重复/差异金额，不超真实净到账且独立复核','绝不INSERT B货款入账或增其可用余额；全部交接/核对满足才case8→9'],
      ['独立资金核对员->>SYSTEM: 按真实供应商账户流水核对本案退款','SYSTEM-->>独立资金核对员: 显示银行来源及金额，或说明缺少权威记录','alt 没有真实资金记录','SYSTEM-->>独立资金核对员: 停止到账核对，不记录银行到账成功','else 以后已接入真实资金记录','SYSTEM-->>供应商经办人: 分别显示已到账金额、差额和待办，出口代理货款余额不变','end']],
    ['recovery','查询退税进度和原请求结果',['供应商经办人','独立税务审核员'],['s7-read','s7-submission','s7-recovery','s7-context'],
      '供应商和内部审核员分别通过本方入口查询有权查看的资料。提交后结果不明时，用原请求编号和原内容查询，系统先返回那次保存的结果，不因后来换版而重复办理；当前进度另列，不能用它倒推某次提交已成功。',
      ['只读主库按对象授权过滤本方投影，内部审核上下文另用内部凭证','未知写请求原方法/原键/原文/原标签重入，先查受理再锁根后当前读','同文且当前授权/HMAC合法返回原resource/Location/ETag；异文409','任务租约过期只恢复本地文件或查询原外部号，不盲发外部申请'],
      ['供应商经办人->>SYSTEM: 查询指定版本、原办理号，或用原请求编号和原内容查询提交结果','SYSTEM-->>供应商经办人: 分别显示原提交结果和当前办理进度','独立税务审核员->>SYSTEM: 用内部身份读取审核依据','SYSTEM-->>独立税务审核员: 显示有权查看的内部资料，不借用供应商登录凭据']]
  ];
  const useCases=goals.map(([short,name,actors,links,description,steps,black],index)=>{
    const declarations=actors.map(actor=>'actor '+actor+' as '+actor).join('\n    ');
    const systemSequence='sequenceDiagram\n    '+declarations+'\n    participant SYSTEM as 代理出口系统\n    '+black.join('\n    ');
    const sequence=`sequenceDiagram
    actor PERSON as ${actors[0]}
    participant PAGE as 本方客户端
    participant APP as 单体两受众门面
    participant DB as MySQL主库
    participant FILE as 文件任务与S3扫描
    participant WORKER as 租约恢复worker
    PERSON->>PAGE: ${name}，明确本次确切意图
    PAGE->>APP: 本受众凭证、对象、原键/标签/确认
    APP->>DB: 认证授权；先读本subject/audience原受理
    alt 原键已受理
      APP->>DB: 校验原意图HMAC及当前权限；异文409
      APP-->>PAGE: 原冻结resource/Location/ETag，不重复消费确认
    else 新请求
      opt 本目标需要新文件
        APP->>FILE: 事务外查确切VersionId/hash/scan；未就绪只留任务
        WORKER->>FILE: 按租约恢复未完成文件，不持业务锁
      end
      APP->>DB: SET TRANSACTION ISOLATION LEVEL READ COMMITTED; BEGIN
      APP->>DB: 锁交易根→案件→提交版→事件/确认/受理；锁根后当前读重入
      APP->>DB: 校验两受众权限/If-Match/确切意图确认，过期或异主体拒绝
      ${steps.map(step=>'APP->>DB: '+step).join('\n      ')}
      alt 门禁满足
        APP->>DB: 领域写/确认消费/最小冻结受理/任务同COMMIT
        APP-->>PAGE: 本次结果；未产生的官方/到账事实不宣称成功
      else 门禁不满足或数据库异常
        APP->>DB: ROLLBACK，明确业务码
        APP-->>PAGE: 缺项及原请求恢复路径
      end
    end`;
    const mermaidText=value=>value.replace(/;/g,'；');
    return {id:'s7-'+short,code:'步骤七用例'+(index+1),name,actor:actors[0],actors,endpoints:links,description,transaction:steps.join('；'),intent:name,
      systemSequence:mermaidText(systemSequence),sequence:mermaidText(sequence)};
  });
  const rules=[
    ['步骤七规则一','N21税务type2；type1证明共享实体但隔离生命周期。范围按已确认规则规范化，UK trade/type/scope，不猜一交易一案。'],
    ['步骤七规则二','case1准备/2待审核/3待提交/4已提交/5受理/6补正/7处理中/8正式处理完成未交接核对/9全部交接核对完成/10终局拒绝/11撤销；内部批准不是正式提交。'],
    ['步骤七规则三','CNY定点；准备申请额可NULL；申请额/批准额/实际到账分别权威。NULL不是0。'],
    ['步骤七规则四','submission_content_json存业务/批准快照/范围/规则/金额，review_snapshot_json未审NULL；补正新版本及前版/事件引用，不覆盖旧批准。'],
    ['步骤七规则五','官方事件必须exact提交版与真实源key；内部事件两字段可NULL，不能伪造官方回执或把技术失败作税务拒绝。'],
    ['步骤七规则六','资金退税入A不增B货款余额。缺真实受控资金观测权威明确阻断；禁止假银行成功夹具。'],
    ['步骤七规则七','终局拒绝/撤销不自动交易结案，无特殊结案，无自动重开；税率/期限/权限/账户规则不猜。'],
    ['步骤七规则八','RC锁根后当前读；重入先查、事务内再查；文件I/O事务外恢复；两受众和独立审核；未接渠道失败关闭。'],
    ['步骤七规则九','文件用途18草稿/19A确认/20正式报关/21官方回执/22出口证明/23交接/24退税材料/25银行费用；原件仅以确切文件版本引用。']
  ];
  const errors=[...common.errors,
    ['SCOPE_RULE_UNCONFIRMED / TAX_AUTHORITY_UNCONFIRMED / TAX_CHANNEL_UNAVAILABLE',422,'FAILED_PRECONDITION',false,'保留准备；取得正式范围/职责依据并接入渠道后另建确切意图'],
    ['SELF_REVIEW / APPROVAL_STALE / SUBMISSION_VERSION_CONFLICT',409,'FAILED_PRECONDITION',false,'独立审核确切新版本，不复用旧批准'],
    ['OFFICIAL_EVIDENCE_REQUIRED / OFFICIAL_EXACT_REVISION_REQUIRED / OFFICIAL_SOURCE_KEY_REQUIRED',422,'FAILED_PRECONDITION',false,'补真实官方依据与确切版、稳定源key；不冒称受理'],
    ['REFUND_OBSERVATION_UNAVAILABLE / REAL_BANK_EVIDENCE_REQUIRED',422,'FAILED_PRECONDITION',false,'仅等待独立真实资金域权威观测，不制造到账或增加B余额'],
    ['DISPATCH_UNKNOWN / TAX_TERMINAL',409,'FAILED_PRECONDITION',false,'未知只查原办理号；终态只读不自动重开或关闭交易']
  ];
  const model={id:'step-seven',name:'步骤七 · 退税申报与进度',endpoints,useCases,rules,errors};
  root.EXPORT_STEP_SEVEN_USECASES_MODEL=model;if(typeof module==='object'&&module.exports)module.exports=model;
})(globalThis);
