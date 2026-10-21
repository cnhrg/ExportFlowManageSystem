'use strict';
(function(root){
  const database=root.EXPORT_DATABASE_MODEL,state=root.EXPORT_STATE_MODEL;
  const controls={
    trade:[
      ['建档 / 修改 / 重提','trade.create / revise / submit','trade_id、snapshot_id、完整before / after记录、操作人、操作原因与时间','每次成功变更均追加完整快照；失败仅记操作流水。快照不可回填或覆盖，终审才能生成正式交易号。'],
      ['材料查阅与替换','trade.file.view / download / revise','file_record.id、logical_file_id、revision、前后路径、修改原因、用途及访问结果','文件修改INSERT新revision；必要文件独立路径列，非核心关联JSON；旧审批绑定不随最新版变化。'],
      ['审批 / 失效 / 重审','trade.review.approve / reject / invalidate','reviewed_snapshot_id、content_version、审批人身份、原因与审批时间','审批新增快照保存完整前后主表；未审批历史快照不回填审批人；并校验独立审批与版本一致。'],
      ['签署 / 申报 / 回执','trade.document.sign / submit / receipt','单证版本、请求号、官方事件、原文索引、确认 / 交付证据','外部正式事实和人工登记分开，记录真实发生时间与本机接收时间。'],
      ['暂停 / 解冻 / 结案','trade.hold / release / close / amend','范围、原因、独立审批、受影响节点、前后版本及结案快照','结案后更正另存快照；解除保全或暂停不能直接恢复旧批准。']
    ],
    funds:[
      ['银行事实登记','funds.bank.ingest / duplicate / quarantine','fund_flow、账户脱敏标识、银行事件键、原文摘要、验真结果','资金事实只追加；重复、验真失败和未匹配事件留操作痕迹，但不二次计入余额。'],
      ['来款分配与释放','funds.allocate / unallocate / release','receipt_flow_id、allocation_id、trade_id、分配前后金额、核验及可用证据','锁定实收校验总分；释放逐分配记fund_flow，主表累计字段仅为投影。'],
      ['费用计提与实扣','funds.fee.accrue / reserve / collect','fee类型fund_order、charging_key、D授权、基数 / 费率 / 舍入、双边流水','计提不冒充实扣；受限款不直接划收益；重复事件不再次收费。'],
      ['付款审批与执行','funds.payment.approve / execute / cancel','fund_order批准版本、经办 / 审批 / 执行身份、账号、摘要和幂等键','改单重审；不自审；未知先查单；银行成功与A到账确认分开。'],
      ['占用 / 冲正 / 对账','funds.hold / unlock / reverse / reconcile','fund_flow前后维度、原事件关联、对账单明细JSON、差异和责任人','原始银行流水、内部资金事件及operation_log分别保留；禁止手工改余额抹平差异。']
    ],
    rbac:[
      ['认证与组织切换','iam.login / context.switch / logout','账号、组织成员键、认证结果、会话摘要、设备 / 来源脱敏信息','失败登录也记录；不存口令和明文令牌；组织身份不得混用。'],
      ['角色与范围改动','iam.grant / revoke / expire','grant_id、角色版本、成对权限 / 范围、额度、时间、申请 / 批准身份','宽表内授权修改保留完整差异和版本；模板变化不自动扩权。'],
      ['敏感访问允许 / 拒绝','iam.access.allow / deny','request_id、目标、动作、当前grant快照、判定结果和原因','未授权拒绝、职责冲突、业务状态拒绝和系统失败区分；均写operation_log。'],
      ['管理员及高权限操作','iam.admin.change / protected_role.grant','真实person_key、当前身份、被改账号 / 模板、独立审批与差异','高权限不豁免审计；不能通过多账号或代切身份绕过职责分离。'],
      ['停用与撤权','iam.account.disable / membership.disable','前后状态、撤销grant / 会话、auth_version、结果','停止新操作但不删除历史身份快照；某组织停用不误删其他组织合法身份。']
    ],
    config:[
      ['配置审核发布','config.revise / approve / publish / rollback','config_record版本、范围、内容摘要、申请 / 审批 / 发布及生效时间','配置内容批准后不可改；历史交易仍可还原当时规则。'],
      ['渠道与凭证调整','config.secret_ref.rotate / channel.change','凭证引用和版本、期限、操作者、审批及影响范围','不记录私钥、令牌、完整银行卡号或敏感原始报文。'],
      ['查询、导出及下载','audit.search / export.request / export.download','audit_task、条件 / 范围 / 用途、身份、批准、行数、文件摘要及结果','查询不自动获得导出权；内部审计合规角色保持无导出，下载每次重新鉴权。'],
      ['归档、验真和保全','audit.archive / verify / hold / release_hold','任务中的精确事件清单、时间范围、根摘要、独立存储凭据和留存版本','防改也要防删；调查保全覆盖相关交易、原件、流水和归档，解除保全独立批准。'],
      ['到期处置及审计故障','audit.dispose / write.failure','处置范围、适用策略、批准、无保全校验、结果和独立处置证明','不预设期限；日志不可写时敏感变更不得无记录执行，故障通过独立渠道告警。']
    ]
  };
  for(const domain of database.domains)domain.auditControls=controls[domain.id];
  database.auditFields=[
    ['唯一与关联列','id、event_key、request_id、trace_id、business_event_key、parent_event_id','一行一次尝试或结果；不同阶段不同键，同一事件去重，不省略重复访问尝试。'],
    ['操作者列与身份快照','actor_type、actor_user_id、org_id、person_key；details_json.actor / grants','人工、系统任务、匿名失败及代办明确区分；当时权限随事件保存。'],
    ['目标与动作列','domain、action、target_type、target_id、trade_id、object_version','类型限定白名单；trade_id只在有关交易时填写，方便低单量直接查询。'],
    ['时间与结果列','occurred_at、received_at、committed_at、phase、result、reason_code','UTC；success / rejected / failed / cancelled / unknown区分；不把超时当失败。'],
    ['宽表JSON详情','details_json.changes / before_state / after_state / approval / evidence_paths','changes保存白名单差异；文件只存revision路径，摘要及元数据从file_record反查，不另建变更 / 证据关联表。'],
    ['完整性与保留','event_hash、partition_seq、retention_config_id；details_json.archive / hold','少量日志直接检索；归档清单及根摘要独立封存，保全和到期处置实时复核。']
  ];
  state.domains.find(item=>item.id==='config').machines.push({
    id:'audit-export',name:'审计导出与访问留痕',record:'audit_task（export） / operation_log / file_record',initial:'requested',
    states:{requested:'导出待审批',rejected:'申请驳回',approved:'授权范围已批准',generating:'受控生成中',available:'结果限期可下载',failed:'导出失败',revoked:'结果访问已撤销',expired:'结果访问已到期'},
    transitions:[
      ['requested','approved','独立批准导出','申请人有明确导出权，范围 / 用途 / 脱敏 / 时效清晰，批准人非申请人','授权批准人','跨域审计','冻结audit_task条件与审批JSON，写operation_log'],
      ['requested','rejected','拒绝导出','无权限、超范围、用途不明或依据不足','授权批准人','跨域审计','拒绝留流水，不生成数据文件'],
      ['approved','generating','启动导出','当前权限有效，条件摘要与批准一致','系统','跨域审计','登记数据截止时间、任务与规则版本'],
      ['generating','available','生成并验真','数据范围、脱敏、实际行数及文件摘要通过，授权仍有效','系统','跨域审计','随任务只保存结果revision路径、行数与到期时间，文件元数据统一查文件表'],
      ['generating','failed','生成失败','查询 / 校验失败、权限变化或文件归档异常','系统','跨域审计','失败独立留痕；不发布未通过产物'],
      ['available','available','获准下载','每次重新校验访问者、权限、范围、用途及到期','获准下载人','跨域审计','记录用户、文件版本、用途、实际结果及传输信息'],
      ['available','revoked','撤销访问','有效撤销请求或权限失效','授权管理员 / 系统','跨域审计','使下载凭据失效，保留生成 / 下载历史'],
      ['available','expired','下载期限到期','服务端时间超过expires_at','系统','跨域审计','失效本次下载授权，留档文件与全部revision继续保留'],
      ['approved','revoked','生成前撤销','取消与任务启动互斥','授权管理员 / 系统','跨域审计','取消未执行任务，记录原因'],
      ['generating','revoked','生成中撤销','任务收到已批准撤销，产物不得发布','授权管理员 / 系统','跨域审计','记录撤销，临时文件按保全 / 留存处理']
    ],
    notes:['沿用内部审计合规角色“只读、无导出”的边界；该流程仅供另获明确导出授权者使用，审批不能替代权限授予。','导出审批与结果直接存audit_task宽表；申请、拒绝、失败、下载、撤销等历史分别追加operation_log，不另建导出事件关联表。','归档 / 验真也使用audit_task的其他task_type；结果文件通过revision路径留档，访问到期不删除已留档文件或任何revision。']
  });
  state.domains.find(item=>item.id==='config').machines.push({
    id:'file-revision',name:'文件修改与revision留档',record:'file_record（每个revision一行） / trade_snapshot / operation_log；业务实体只存storage_path',initial:'new',
    states:{new:'新文件待上传',uploading:'首次上传中',failed:'首次上传失败',archived:'已留档且允许修改',editing:'修改工作副本',saving:'新revision保存中',conflict:'基版冲突待处理',readonly:'正式原件只读留档'},
    transitions:[
      ['new','uploading','开始首次上传','操作者有创建权限；文件类型 / 归属 / 路径规则已校验','文件提供人 / 系统','N01 / N05及各材料节点','生成logical_file_id与请求键，登记上传尝试流水，写入独立新路径'],
      ['uploading','failed','上传或验真失败','文件未完整落存或摘要 / 类型校验失败','文件服务 / 系统','各材料节点','记录失败，业务不得引用未就绪路径'],
      ['failed','uploading','重新上传','校验重试请求键；不覆盖已留档对象','文件提供人','各材料节点','保留失败尝试，按请求幂等规则处理'],
      ['uploading','archived','可修改文件归档完成','新路径内容已存且校验通过，allow_edit=true','文件服务 / 系统','各材料节点','INSERT file_record，revision=1、status=READY；业务绑定另经主表变更与快照事务'],
      ['uploading','readonly','正式原件归档完成','内容已存且校验通过，类型为正式签署件 / 银行回单 / 官方回执等','文件服务 / 系统','N02 / N09 / N13 / N17 / N20等','INSERT READY文件记录，allow_edit=false；保存来源与原件证据'],
      ['archived','editing','申请修改文件','allow_edit=true且无后续封存；编辑权限有效；已用作审批依据时先取得适用变更批准','经办 / 独立审核员','N05 / N23及适用材料节点','固定previous_record_id与预期业务版本；历史文件可查，业务仍绑定原路径'],
      ['editing','saving','保存新revision','修改原因明确，提交预期基版及绑定路径；新路径不与历史路径重复','文件编辑人','N23','新路径写入完整内容并验真；逻辑文件组加锁后分配递增revision并INSERT'],
      ['editing','archived','放弃未保存修改','未产生成功留档的新revision','文件编辑人','各材料节点','保留原当前路径，记录取消；已形成的历史revision不能删除'],
      ['saving','archived','新revision提交成功','文件校验就绪；基版未变且请求幂等检查通过','文件服务 / 系统','N23','INSERT READY文件记录和操作流水；若同次换绑，同事务更新主表并追加完整快照，受影响批准失效'],
      ['saving','editing','保存失败','上传 / 验真或元数据提交失败，业务路径未改变','文件服务 / 系统','N23','保留旧绑定；记录失败并按请求键恢复，禁止覆盖已有留档对象'],
      ['saving','conflict','检测到并发基版变化','另一人已提交新revision或改变业务绑定版本','系统','N23','已验真的新内容INSERT为unbound revision并保留；不更新业务路径，记录冲突'],
      ['conflict','editing','核对最新基版重做','操作者确认差异，选择最新revision作为基版','文件编辑人','N23','再次保存再生成新revision，不删除冲突revision'],
      ['archived','readonly','正式封存','完成签署 / 正式提交 / 业务封存，需保护原件','授权人 / 系统','适用审批及N22','追加file.seal操作事件，后续鉴权读取最新控制事件；不更新历史文件记录'],
      ['archived','archived','查阅指定历史revision','具备本文件 / 本交易查阅或下载权限','授权查阅人','跨节点审计','按指定revision路径读取并记录访问，不更新业务绑定'],
      ['readonly','readonly','查阅正式件及历史revision','具备查阅 / 下载权限；路径确为归档版本','授权查阅人','跨节点审计','只读访问留痕；正式更正另建关联文件及依据']
    ],
    notes:['这是文件操作流程，不是file_record.status枚举：上传 / 编辑 / 冲突及封存事件写operation_log；文件记录只INSERT已验真的READY版本。','同logical_file_id每次修改都INSERT新revision及独立路径；previous_record_id记录编辑基版。业务只绑定指定storage_path，最大revision不代表业务已采用或已批准。','业务换绑记录完整前后交易快照、操作人、原因及时间；审批另增事件快照指向被审版本，不回填历史审批人。','文件回滚按旧内容新建revision并注明来源，不把版本号倒退；逻辑删除、链接到期和切换当前版都不删除任何已留档revision。','文件上传与数据库不能假设跨系统原子事务；只有文件校验就绪且元数据提交成功才返回保存成功，未就绪路径禁止业务引用。']
  });
  database.fileRevisionFields=[
    ['file_record · 唯一文件表','id、trade_id、logical_file_id、revision、previous_record_id、supersedes_record_id、storage_path','一行一个revision；同逻辑文件所有记录并存。UNIQUE(logical_file_id, revision)、UNIQUE(storage_path)、UNIQUE(logical_file_id, save_request_key)。'],
    ['file_record · 元数据与操作','display_name、file_type、sha256、size_bytes、media_type、allow_edit、created_by、actor_snapshot_json、created_at、change_reason、status、binding_result','本体在文件存储；验真后INSERT READY记录。创建人、时间与修改原因随版本保存；未绑定版本也留档，不改写历史。'],
    ['交易档案 · 文件清单','commercial_invoice_path等必要文件独立列 + non_core_files_json','必要文件不得仅存JSON；非核心文件冗余清单含类别、节点及固定路径。交易快照完整保存前后全部关联。'],
    ['其他业务实体','raw_receipt_path / result_file_path，或file_paths_json路径数组','只存对应revision路径；不复制文件二进制、摘要、大小或编辑历史，不绑定latest或临时签名URL。'],
    ['revision示例','r0001：exports/EX-DEMO/contracts/C01/r0001.pdf\nr0002：exports/EX-DEMO/contracts/C01/r0002.pdf\nr0003：exports/EX-DEMO/contracts/C01/r0003.pdf','三条revision同时保留。旧审批引用r0001；最新文件为r0003；业务采用r0003须新建变更快照和审批，不改变旧审批路径。'],
    ['审计与重审','operation_log记录file.save / file.conflict / file.rollback / file.seal / file.view / file.download','保存前后路径、基版、操作者、理由及结果；业务替换为新路径时重新审批并经N23使相关批准失效。']
  ];
})(globalThis);
