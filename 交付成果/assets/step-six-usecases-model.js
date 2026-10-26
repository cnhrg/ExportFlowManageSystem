'use strict';
(function(root){
  const common=root.EXPORT_SYSTEM_USECASES_MODEL||(typeof require==='function'?require('./system-usecases-model.js'):null);
  const base='/api/v1/tax-proof-cases/{tax_case_number}',internal='/internal/v1/tax-proof-cases/{tax_case_number}';
  const specs=[
    ['basis','GetTaxProofPreparation','GET','/api/v1/trades/{trade_number}/tax-proof-preparation','','PreparationContext','',false,'查看主管机关确认的职责、范围、时限与缺项；未确认只能备料'],
    ['case-create','CreateTaxProofCase','POST','/api/v1/trades/{trade_number}/tax-proof-cases','CaseInput','TaxProofCase','case_input',false,'基于已确认范围建立证明协同案，不自动按交易或报关单分案'],
    ['case-read','GetTaxProofCase','GET',base,'','TaxProofCase','',false,'读取本方案件、确切版本、未决办理与交接状态'],
    ['submission-create','CreateTaxProofSubmission','POST',base+'/submissions','SubmissionInput','TaxProofSubmission','submission',false,'F协助提交不可变材料版；补正须引用原版与补正事件，旧批准失效'],
    ['submission-read','GetTaxProofSubmission','GET',base+'/submissions/{submission_revision_number}','','TaxProofSubmission','',false,'查询原材料版、冻结职责范围及审核快照'],
    ['review-context','GetTaxProofReviewContext','GET',internal+'/review-context','','ReviewContext','',true,'内部审核员独立读取完整冻结依据与缺失门禁'],
    ['review-create','CreateTaxProofReview','POST',internal+'/reviews','ReviewInput','TaxProofEvent','review',true,'独立批准或退回确切版；经办不得自审，批准不等于官方受理'],
    ['dispatch-create','CreateTaxProofDispatch','POST',base+'/dispatch-intents','DispatchInput','DispatchIntent','dispatch',false,'B经正式确认职责和范围后建立办理意图；缺官方通道阻断，不造正式提交'],
    ['dispatch-read','GetTaxProofDispatch','GET',base+'/dispatch-intents/{dispatch_reference}','','DispatchIntent','',false,'未知只按原办理号查单，不重复派发，不猜官方结果'],
    ['claim-create','CreateTaxProofOfficialClaim','POST',base+'/official-evidence-claims','OfficialClaimInput','OfficialEvidenceClaim','claim',false,'提交正式回执或证明声明，先待核，不直接变官方状态'],
    ['claim-read','GetTaxProofOfficialClaim','GET',base+'/official-evidence-claims/{claim_number}','','OfficialEvidenceClaim','',false,'原证据声明与核实结论分开可查'],
    ['verification-create','CreateTaxProofOfficialVerification','POST',internal+'/official-verifications','VerificationInput','TaxProofEvent','verification',true,'独立核对真实来源、确切提交版、主管业务号和附件2范围后才记官方事实'],
    ['delivery-create','CreateTaxProofDelivery','POST',base+'/deliveries','DeliveryInput','TaxProofEvent','delivery',false,'B交付当前已核实有效正式证明确切版本；不等于A收到核对'],
    ['receipt-create','CreateTaxProofReceipt','POST',base+'/receipts','ReceiptInput','TaxProofEvent','receipt',false,'A独立接收核对或提出异议，绑定原交付和证明版，不默认确认'],
    ['disposition-create','CreateTaxProofObjectionDisposition','POST',internal+'/objection-dispositions','DispositionInput','TaxProofEvent','disposition',true,'实质解决A异议；需官方更正时等待新正式证据，不能内部清掉异议'],
    ['history','GetTaxProofHistory','GET',base+'/history','','TaxProofHistory','',false,'读取旧版、事件、补正链、交付接收及原受理回执，不覆盖历史'],
    ['result','GetTaxProofCommandResult','GET','/api/v1/tax-proof-command-results/{request_key}','','CommandResult','',false,'以原调用者/受众/幂等键恢复原受理；现权限复核后回放非最新业务状态']
  ];
  const endpoints=specs.map(([id,rpc,method,path,input,output,body,inside,detail])=>({
    id:'s6-'+id,rpc,method,path,input:input||'—',output,body,audience:inside?'内部运营':'外部服务',detail,
    status:method==='GET'?'200':'201',reqMsg:rpc+'ReqMsg',rspMsg:rpc+'RspMsg',responseBody:'resource',query:[],
    file:'proto/trade/taxproof/v1/taxproof.proto',service:inside?'InternalTaxProofOperationsService':'ExternalTaxProofService',
    timeout:{clientMs:method==='GET'?5000:10000,serverMs:method==='GET'?4000:8000,label:method==='GET'?'读取':'资料写入',retry:method==='GET'?'总预算内最多3次原资源读取':'禁止盲重试；原键原文原标签查询原受理与原办理号'}
  }));
  const goals=[
    ['preparation','查看申请证明前的职责、范围和缺项','出口代理经办人',['出口代理','出口报关代理'],['basis'],
      '出口代理查看申请证明的职责分工、适用范围和所缺材料。目前出口代理主办、报关代理协助的安排仍待主管机关确认，不能只凭操作指引就认定谁有权申请。',
      '按交易权限读取批准快照、附件2及主管规则引用；缺规则返回明确缺项，不取号不立正式范围。',
      '查看已批准交易资料和主管机关的职责、范围要求','列出已确认要求、待确认事项和缺项，尚未向主管机关申请'],
    ['cooperation','建立证明申请的协作档案','出口代理经办人',['出口代理'],['basis','case-create','case-read'],
      '出口代理按已确认的范围规则建立协作档案，用于准备证明申请。是否拆分以该规则为准，不能默认一笔交易或一张报关单恰好对应一份证明。建档后仍须备料、审核和正式办理。',
      '锁交易根后查原请求；核对规则适用交易版/商品/附件2范围，按trade/type=1/scope唯一建案，claimed_amount=NULL、CNY。',
      '确认适用范围后建立证明申请协作档案','返回档案编号和版本标记，尚未正式申请'],
    ['materials','报关代理协助整理并提交证明材料','出口报关代理经办人',['出口报关代理','出口代理'],['submission-create','submission-read'],
      '出口报关代理在授权范围内协助整理材料，核对附件2后提交一个完整版本。每份文件须固定到具体存储版本、摘要和用途，旧版继续保留。协助备料不能取代有权申请主体。',
      '事务外上传/扫描；交易→案件锁后核本方授权、确切附件2与清洁文件，插入submission_content_json和evidence_manifest_json。',
      '核对材料全文、职责依据和申请范围，确认本版后送审','保存本版等待独立审核，旧版不变'],
    ['review','独立审核证明材料或退回补充','独立税务审核员',['独立税务审核员'],['review-context','review-create'],
      '独立税务审核员核对本次材料全文、摘要及所引用的各项资料版本，决定批准或退回。审核员不能是经办人，退回须说明原因；批准只适用于这一版材料，尚不能证明主管机关已受理。',
      '锁交易→案件→当前提交，独立身份/源版重验；追加税务审核事件并冻结review_snapshot_json，退回仍保留原版。',
      '核对这一版材料及依据，填写批准或退回意见','保存内部审核结论，尚未正式提交或受理'],
    ['dispatch','申请正式办理并查询原办理结果','出口代理经办人',['出口代理'],['dispatch-create','dispatch-read','result'],
      '出口代理申请办理已批准的材料版本。职责、范围、期限或渠道缺少正式依据，或渠道尚未接入时，系统停止正式办理并说明原因。办理结果不明时保留原办理号查询，不能换号重复申请。',
      '短事务核确切已批准版、正式职责和渠道，持久化同一dispatch_reference；外部I/O事务外。未知保持原号，禁止新号重派。',
      '确认已批准材料及办理条件，申请正式办理；超时后查原办理号','返回办理请求和进度，或说明为何不能办理'],
    ['official-receipt','登记税务回执并独立核实','出口代理经办人',['出口代理','独立税务审核员','主管税务机关'],['claim-create','claim-read','verification-create'],
      '出口代理登记主管机关回执，由独立人员核实来源、申请版本和原办理号。正式提交、受理、要求补正、处理中和拒绝须分别记录；验签失败只能说明证据未核实，不能记成机关拒绝。',
      '证据声明先待核；核实者重验真实源引用/稳定外部键/确切提交版/原办理号后追加官方事实；外部键去重且跨案冲突拒绝。',
      '提供原始回执及对应申请版本，交独立人员核实','先登记待核，核实通过后才更新对应的正式进度'],
    ['correction','补充证明材料并重新送审','出口报关代理经办人',['出口报关代理','出口代理','独立税务审核员'],['submission-create','review-create'],
      '出口报关代理根据补正要求另交新版材料，注明原版和对应的补正记录，再独立重审。主管机关要求补正须有已核实的正式记录；内部退回不能伪造为机关要求。新版不能沿用旧批准，也不能覆盖旧提交。',
      '锁交易→案件→原版/补正事件；未决执行先恢复；新材料版使原未执行批准失效，不覆盖原官方提交或已完成执行。',
      '按原版和补正要求提交新材料，再次送审','保留旧版及审核记录，新版审核通过前不能办理'],
    ['certificate','核实证明原件及正式更正、撤销记录','独立税务审核员',['独立税务审核员','主管税务机关'],['claim-create','verification-create','case-read'],
      '独立税务审核员核实正式证明的来源，检查其范围与附件2是否一致。更正或撤销须有新的官方证据并关联原证明，系统不能自行制作。证明核实后还须交付供应商核对；撤销不能自动让交易正常结案。',
      '事务外核来源及原件；事务内锁确切版，追加签发/更正/撤销类型事件；撤销失效原交付资格，更正重新交付与A核对。',
      '核对证明原件、对应范围及更正或撤销依据','保存核实结果；有效证明仍须交付供应商核对，撤销不触发正常结案'],
    ['delivery','出口代理交付正式电子证明','出口代理经办人',['出口代理','供应商'],['delivery-create','history'],
      '出口代理将已核实且当前有效的正式证明交给供应商。系统单独保存证明版本、接收方和交付渠道的税务业务记录，证明文件和交接凭据分别登记用途。发送完成后仍须供应商确认收到并核对。',
      '锁交易→案件→有效证明事件；须真实签发已核、无撤销/异议，追加delivery载荷含证明事件/文件确切版/收件A及渠道。',
      '选择已核实且有效的证明版本，交付供应商','保存交付记录，等待供应商接收核对'],
    ['receipt','供应商接收并核对证明或提出异议','供应商经办人',['供应商'],['receipt-create','history'],
      '本案供应商查看交付给自己的证明，分别确认收到、核对通过，或提出异议。出口代理不能代确认。系统保留原交付及各次核对记录；仅收到文件还不算完成，所有应核对的交付均通过才完成本案。',
      '锁交易→案件→交付事件，核A身份、证明版未失效；追加A接收与核对或异议事件。全部适用交付核对齐才状态9。',
      '查看原交付的证明，确认收到及核对结果，或说明异议','保存本方结果；有异议时等待处理，不自动完成案件'],
    ['objection','处理证明异议并重新交付','独立税务审核员',['独立税务审核员','出口代理','供应商'],['disposition-create','delivery-create','receipt-create'],
      '审核员依据凭据处理供应商的异议；需要主管机关更正的，须等正式更正证明，内部说明不能替代。新证明交付后由供应商重新核对，原异议记录保留。差异未解决时不能完成本案，也不会自动进入退税或结案。',
      '锁原异议与当前证明；记录处置证据和需官方更正结果，缺正式证据保持未闭环；解决不代替A再次核对。',
      '查看原异议及处理依据；需要正式更正时等待新证明，再重新交付','差异未解决或供应商未重新核对前，案件继续待办'],
    ['query','查询证明办理历史和原请求结果','出口代理经办人',['出口代理','出口报关代理','供应商','独立税务审核员'],['case-read','submission-read','history','result'],
      '各方按当前权限查看材料旧版、补正、审核、办理和交接记录。提交后没收到响应时查询原请求，系统返回当时保存的结果，不拿最新进度替代，也不重复办理。',
      '主库读取原subject/audience/key受理；确认当前权限后回放冻结结果；历史按不可变提交/事件有界读取，禁止query过滤绕授权。',
      '查看本方历史或查询原请求的处理结果','返回有权查看的原记录或说明不可见，不另建办理号']
  ];
  const useCases=goals.map(([id,name,actor,actors,ids,description,transaction,action,result],i)=>({
    id:'s6-'+id,code:'步骤六用例'+(i+1),name,actor,actors,description,transaction,intent:name,endpoints:ids.map(x=>'s6-'+x),
    systemSequence:`sequenceDiagram\n    actor USER as ${actor}\n    participant SYSTEM as 代理出口系统\n    USER->>SYSTEM: 打开本方记录，查看所需资料和当前进度\n    SYSTEM-->>USER: 显示本方可办事项、材料版本和缺项\n    USER->>SYSTEM: ${action}\n    alt 本方有权且所需依据齐全\n      SYSTEM-->>USER: ${result}\n    else 职责、范围或正式证据未确认\n      SYSTEM-->>USER: 说明缺什么、为何不能继续；已提交的请求可查原结果\n    end`,
    sequence:`sequenceDiagram\n    autonumber\n    participant PAGE as ${actor}界面\n    participant APP as 单体应用受限入口\n    participant DB as MySQL税务领域及受理表\n    participant FILE as 私有S3确切版本\n    participant AV as ClamAV\n    PAGE->>APP: GET本方上下文，5秒/4秒\n    APP->>DB: 对象授权读取交易批准版、税务type=1和历史\n    APP-->>PAGE: 强ETag与明确缺项\n    ${['materials','official-receipt','certificate','objection'].includes(id)?'PAGE->>FILE: 共用上传协议直传原创材料\\n    APP->>AV: 事务外扫描确切VersionId\\n    AV-->>APP: clean/感染/失败，失败不引用\\n    APP->>FILE: HEAD固定VersionId及SHA256核对':'APP->>DB: 读取本目标依赖的确切税务领域记录'}\n    PAGE->>APP: ${ids.map(x=>endpoints.find(e=>e.id==='s6-'+x).rpc).join(' / ')}，写10秒/8秒\n    APP->>DB: 按当前subject/audience/原键查受理，同文才回放\n    Note over APP,DB: ${transaction}\n    APP->>DB: RC短事务；交易根→案件→提交/事件有序当前读并复验ETag\n    alt ${id==='dispatch'?'职责/范围/通道不确认或结果未知':'缺源证据、越权、自审、旧版或终态'}\n      APP->>DB: ROLLBACK，不造官方事件或A确认\n      APP-->>PAGE: 明确业务错误及原资源恢复路径\n    else 本目标领域门禁满足\n      APP->>DB: ${action}；同事务最小受理与技术outbox\n      APP->>DB: COMMIT；不在锁内访问外部渠道\n      APP-->>PAGE: ${result}\n    end`
  }));
  useCases.forEach(goal=>{goal.sequence=goal.sequence.replace(/\\n/g,'\n');});
  const rules=[
    ['范围与职责','B申请/F协助待主管机关确认；scope_reference只由已确认范围规则解析，缺规则不得正式申请，不自推一交易或一报关单一证明。'],
    ['共享税务隔离','type=1证明/type=2退税；所有入口查询锁定type=1。证明claimed_amount必须NULL，currency=CNY；同交易/type/scope唯一。'],
    ['共享状态','1准备/2待审/3待提交/4已提交/5受理/6补正/7处理中/8正式完成未交接核对/9全部交接核对完成/10终拒/11撤销；不以内部批准或技术投递推进官方状态。'],
    ['不可变业务快照','submission_content_json固定完整内容、源交易/附件2、职责范围规则与快照；evidence_manifest_json固定文件版；独立审批留review_snapshot_json，补正留previous_revision/correction_event。'],
    ['官方事实','真实来源、正式业务号、确切submission_revision不可缺；官方external_event_key稳定去重。内部审核、B交付、A接收不得伪造外部号。'],
    ['领域交接','交付与A接收核对/异议是tax_event类型化业务载荷；发送不等于收到，收到不等于核对通过，更正后重新交接；不藏通用middleware。'],
    ['文件用途','18报关草稿/19供应商确认/20正式报关文件/21官方回执/22代理出口货物证明/23交付接收/24退税材料/25银行费用依据由主模型维护；S3与扫描均在事务外。'],
    ['原请求恢复','当前授权→原键查重→交易根→案件→提交/事件；READ COMMITTED当前读。unknown保留原dispatch_reference，先查原结果，禁止新号重派。'],
    ['边界','官方与银行未接入，仅证明缺证据失败关闭；无生产handler/IAM/正式签发验收，不触export_trade或旧库。']
  ];
  const ownErrors=[
    ['SCOPE_RULE_UNCONFIRMED / RESPONSIBILITY_UNCONFIRMED / DEADLINE_RULE_UNCONFIRMED / OFFICIAL_CHANNEL_UNAVAILABLE',409,'FAILED_PRECONDITION',false,'补主管正式适用依据与真实通道，不改键绕过'],
    ['TAX_TYPE_MISMATCH / SELF_REVIEW / SOURCE_REVISION_STALE / REVIEW_REQUIRED / CORRECTION_CHAIN_INVALID',409,'FAILED_PRECONDITION',false,'读取确切版并独立重审；非本类型不可见'],
    ['OFFICIAL_EVIDENCE_REQUIRED / EXACT_SUBMISSION_REQUIRED / CERTIFICATE_NOT_VERIFIED / DELIVERY_STALE / OBJECTION_UNRESOLVED',409,'FAILED_PRECONDITION',false,'核实真实确切版本证据；不得伪造外部成功'],
    ['DISPATCH_UNKNOWN',409,'FAILED_PRECONDITION',false,'仅原dispatch_reference查询，禁止重新派发']
  ];
  const model={id:'step-six',name:'步骤六 · 代理出口货物证明',endpoints,useCases,rules,errors:[...(common?common.errors:[]),...ownErrors]};
  root.EXPORT_STEP_SIX_USECASES_MODEL=model;
  if(typeof module!=='undefined'&&module.exports)module.exports=model;
})(typeof globalThis!=='undefined'?globalThis:this);
