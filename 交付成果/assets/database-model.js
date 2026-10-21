'use strict';
(function(root){
  const entity=(id,name,fields,purpose,constraint,external=false)=>({id,name,fields,purpose,constraint,external});
  const link=(from,to,label,cardinality='||--o{')=>({from,to,label,cardinality});
  const domains=[
    {
      id:'trade',name:'交易档案',subtitle:'交易档案表 + 完整前后版本快照 + 文件记录表（每个revision一行）',nodes:'N01—N10 / N18—N23',
      boundary:'交易域仅保留3张表：trade_record保存所有填写信息及当前文件关联清单；trade_snapshot保存每次变更的完整前后记录和操作 / 审批身份；file_record保存每份文件的全部revision。必要文件在交易主表单独设路径列，非核心文件关联冗余存non_core_files_json。不再设置单证表或独立file_revision表。',
      aggregates:[
        ['交易档案主宽表','trade_record：一行一笔档案','所有表单输入、六方资料、货物、运输、佣金及节点业务信息随单保存；必要文件独立路径列，非核心文件使用有schema的JSON清单。'],
        ['完整前后版本快照','trade_snapshot：一行一次成功变更','保存before_record_json / after_record_json、操作人、原因、时间、审批人及审批依据；不是仅存差异，也不是仅在提交时留快照。'],
        ['文件记录表','file_record：一行一份文件的一个revision','文件本体存文件存储；修改执行INSERT并递增revision，同logical_file_id串联全部历史。文件业务绑定与文件最新revision分离。']
      ],
      lifecycle:[['建档','草稿 → 当前版待终审 → 驳回补正 / 通过并生成正式交易号'],['在途','物流 / 报关 / 资金 / 退税分别推进，以N节点条件控制'],['结案与更正','N10 + N14 + N17 + N21有效完成 → 人工结案；更正生成新快照']],
      rules:[
        'trade_record从草稿阶段即存在，dossier_no唯一；trade_no审批通过后才生成，可空但非空唯一。approved_snapshot_id指向本档案的批准事件快照，并须核对content_version和节点适用范围，不能仅凭该引用认为当前内容仍获批准。',
        '主宽表的查询字段使用普通列：org_id、dossier_no、trade_no、status、payment_mode、currency、contract_amount、created_at；主体名称可冗余为普通列便于查找。parties_json保存各角色身份、注册号、地址、D—C关系、授权及来源，不依赖外部主档变化。',
        'goods_json、shipments_json内每个元素有稳定item_id / batch_id；运输分配引用item_id并校验累计出运量。JSON不是自由文本，必须校验类型、必填字段、数量、币种与金额，保存schema_version。低单量先在应用层校验并锁定交易行。',
        'node_states_json以node_code + branch + subject_key记录节点状态、当前材料版本、规则、依赖及批准；subject_key区分批次 / 单证 / 来款分配。这里只保存当前投影，历史转换写operation_log，提交全量版本写trade_snapshot。',
        'trade_snapshot.before_record_json与after_record_json逐列保存完整交易主表，包括所有填写信息、必要文件路径、非核心文件JSON、规则及节点状态；创建时before为NULL，其他变更前后记录必须齐全。每次成功保存、文件换绑、提交、批准、驳回、失效与结案均INSERT快照，拒绝 / 失败仅记操作流水。',
        'snapshot的operator_id、operator_snapshot_json、operation_reason、operated_at必填；人工审批另记录approver_id、approver_snapshot_json、approval_decision、approval_reason、approved_at及reviewed_snapshot_id。未审批操作的审批字段为空；后来审批新增事件快照，禁止回填或更新历史快照。审批人与经办按真实person_key分离。',
        'version每次成功变更递增；content_version仅在填写内容或文件绑定改变时递增。审批必须锁定提交快照及相同content_version，不能批准过期内容。主表、完整前后快照及成功operation_log同事务；预分配快照ID后生成after_record_json，保证approved_snapshot_id与实际落库一致。',
        '合同、报关、证明、退税的业务正文、签署、A确认、F授权及外部结果存workflow_json和node_states_json；状态机不存进文件记录表。文件修改只新增元数据行，不覆盖业务事实；付款INVOICE仍归资金域。',
        '核心文件分别保存commercial_invoice_path等固定revision路径；non_core_files_json仅保存非核心关联清单，每项含稳定item_id、category、node_code、storage_path。二者共同构成当前档案文件清单；禁止把核心文件仅塞进JSON，禁止存文件正文、latest别名或临时签名URL。',
        '部分文件允许修改，但每次保存都生成新revision及新存储路径，旧版本保留。审批、签署、申报、付款和结案引用各自当时的路径；切换文件最新revision不能改变已批准依据，替换业务绑定须重新审核并使受影响节点批准失效。',
        'trade_record使用version做乐观锁，文件换绑还校验expected_storage_path。禁止客户端整表覆盖审批 / 资金 / 节点投影，后端按动作白名单修改；主表每个路径须指向READY且归属本交易或获准共享的file_record，JSON逻辑引用由服务端校验。',
        'file_record的UNIQUE(logical_file_id, revision)、UNIQUE(storage_path)、UNIQUE(logical_file_id, save_request_key)防止重号、路径覆盖和重复保存。修改前验证allow_edit及最新封存 / 保全事件；新路径上传并验摘要后在逻辑文件组锁内分配revision并INSERT。上传与数据库非原子，失败记日志，未就绪对象不得绑定。',
        '并发编辑校验previous_record_id与预期基版；冲突时已形成的新revision照常留档但标记unbound，不更新业务路径。单量低可用单库事务级逻辑文件锁；再次核对后重做生成更高revision。文件列表按revision排序，最新文件不代表已批准业务绑定。',
        '文件记录一经READY不改内容、路径和revision；回滚按旧内容另存新revision。正式签署件、银行回单和官方回执禁止原位编辑，正式更正另建文件并用supersedes_record_id关联。封存 / 撤权 / 保全使用追加operation_log，鉴权检查最新控制事件，不更新历史文件行。',
        '文件封存、权限及保全控制事件与全部revision共同持续留存；即使日志归档，也必须能查询其有效控制状态，禁止按普通日志到期处置后恢复旧编辑权。完整交易快照按档案数据级别授权和加密，不能通过审计摘要查看权绕过原始资料访问限制。',
        'N23记录异常范围、根因与独立解冻依据；新版使受影响节点批准失效并逐级重审。N22冻结完整结案快照，包含四流完成依据、资金核对、异常处置与最终税务结果。'
      ],
      integrations:[['→ 资金账户流水','trade_record.id作为稳定交易关联键；trade_no在终审后生成；传递approved_snapshot_id与合同 / 付款条件快照。'],['← RBAC账号权限','操作人使用user_account.id与当前org_id；审批保存当时身份与授权快照，不依赖后续账号 / 角色变化。'],['↔ 系统配置','引用config_record确定版本；全域文件只绑定file_record.storage_path，交易域统一维护revision。每次动作写operation_log，外部通信使用integration_record。']],
      questions:['采用单库关系数据库 + 文件存储；当前不拆微服务、不建独立商品 / 主体 / 节点 / 审核条目关联表。','同一业务单证先归属一笔交易；若未来出现一份正式报关单覆盖多交易，再明确拆单或关联方案，不提前引入关系网。'],
      entities:[
        entity('trade_record','交易档案表',['uuid id PK','uuid org_id FK','string dossier_no UK','string trade_no UK','int version','int content_version','int schema_version','uuid approved_snapshot_id FK','string status','string payment_mode','string currency','decimal contract_amount','string contract_no','string invoice_no','string packing_no','json parties_json','json goods_json','json shipments_json','json collection_payment_json','json commission_json','json service_json','json workflow_json','json node_states_json','json rules_snapshot_json','json exception_json','json hold_json','string commercial_invoice_path FK','string packing_list_path FK','string sales_contract_path FK','string agency_instruction_path FK','string fee_confirmation_path FK','string consignee_support_path FK','string payer_confirmation_path FK','string payer_relationship_path FK','string customs_agent_qualification_path FK','string customs_agent_quote_path FK','string agency_contract_path FK','string logistics_contract_path FK','string customs_authorization_path FK','string customs_declaration_path FK','string customs_release_path FK','string export_certificate_path FK','string tax_result_path FK','json non_core_files_json','uuid created_by FK','datetime created_at','uuid updated_by FK','datetime updated_at'],'一行一笔档案，所有填写内容随单存储。固定列 + 有schema的结构化明细，不依赖外部主体主档复原历史；必要文件独立路径列。','dossier_no唯一；trade_no可空且非空唯一；version乐观锁；批准和文件关联须校验归属及有效版本。'),
        entity('trade_snapshot','交易档案版本快照',['uuid id PK','uuid trade_id FK','int version_no','int content_version','int schema_version','string event_type','string request_key','json before_record_json','json after_record_json','uuid operator_id FK','json operator_snapshot_json','string operation_reason','datetime operated_at','uuid reviewed_snapshot_id FK','uuid approver_id FK','json approver_snapshot_json','string approval_decision','string approval_reason','datetime approved_at','json approval_json','string content_hash'],'一行一次成功变更；完整前后记录及操作 / 审批身份独立保存。任何事件落库后全行不可变；审批另建快照指向被审提交。','UNIQUE(trade_id, version_no)，UNIQUE(trade_id, request_key)；创建前记录可空；未审批时审批人及时间为空；只追加。'),
        entity('file_record','文件记录表',['uuid id PK','uuid trade_id FK','uuid owner_org_id FK','uuid logical_file_id','int revision','uuid previous_record_id FK','uuid supersedes_record_id FK','string file_type','string display_name','string storage_path UK','string sha256','bigint size_bytes','string media_type','boolean allow_edit','string status','string binding_result','string save_request_key','string actor_type','uuid created_by FK','json actor_snapshot_json','datetime created_at','string change_reason','json access_json','json hold_json'],'一行一个revision，文件本体不入库；同logical_file_id保存全部修改版本，previous_record_id追溯编辑基版。系统公共文件trade_id可空。','UNIQUE(logical_file_id, revision)，storage_path唯一，请求键按逻辑文件唯一；修改只INSERT，READY后不可变，旧revision全部留档。'),
        entity('organization','组织 · RBAC',['uuid id PK'],'访问边界；业务主体完整信息仍随交易冻结。','跨域引用。',true),
        entity('user_account','账号 · RBAC',['uuid id PK'],'档案经办、操作人、审批人及文件提供人。','跨域引用；真实身份随事件冻结。',true)
      ],
      relations:[link('organization','trade_record','归属组织'),link('trade_record','trade_snapshot','完整前后版本'),link('trade_snapshot','trade_record','当前批准版','o|--o|'),link('trade_snapshot','trade_snapshot','被审提交版本','o|--o{'),link('trade_record','file_record','归属档案','o|--o{'),link('file_record','file_record','编辑基版或正式更正','o|--o{'),link('file_record','trade_record','必要文件路径与非核心JSON','}o..o{'),link('user_account','trade_snapshot','操作人与审批人'),link('user_account','file_record','人工保存人','o|--o{')],
      jsonLinks:'必要文件各有独立storage_path列；non_core_files_json为非核心关联冗余清单，示例：[{item_id: "SUP-01", category: "补充说明", node_code: "N05", storage_path: "exports/EX-DEMO/F01/r0002.pdf"}]。文件列表合并固定列与此JSON；文件详情及历史revision从file_record查询。'
    },
    {
      id:'funds',name:'资金账户流水',subtitle:'账户、来款分配、资金业务单与不可变资金流水四张表',nodes:'N11—N17 / N21—N23',
      boundary:'资金域保留4张表：bank_account、fund_allocation、fund_order、fund_flow。INVOICE、核验、费用、结算、付款使用按类型约束的资金业务宽表；来源明细、审批和回执可用结构化JSON。实际资金流水独立追加，不塞入交易主表反复覆盖。',
      aggregates:[
        ['真实账户与实收','bank_account + fund_flow','账户保存持有人、用途、核验及余额快照；银行实收是一条fund_flow事实。内部受限 / 可用维度不新建银行账户。'],
        ['来款拆分与业务单','fund_allocation + fund_order','一笔实收可分多交易，一笔交易可多次收款。INVOICE、核验、费计提、结算及付款按order_type区分，保存完整材料 / 费用 / 审批 / 资金来源快照。'],
        ['金额事件与对账','fund_flow：一行一个账户侧资金事件','银行入账、扣账、可用释放、占用 / 解锁、费用实扣及冲正分别保留；按事件类型决定影响的余额，不从业务单当前status倒算历史资金。']
      ],
      lifecycle:[['来款','银行实收全额受限 → 分配复核 → INVOICE批准 → 银行核验 / 入账 / 可用确认 → 对应额度释放'],['费用','按唯一业务键计提 → 预留 → 对应国内可用资金扣取 → 双边回单核清'],['付款','金额 / 账户核对 → 适用分支独立批准 → 锁额 → 银行执行 / 查单 → A到账确认']],
      rules:[
        'bank_account一行一个真实账户，明确B收款 / B收益 / A收款用途、持有人、币种、资金位置及核验快照。账号加密，列表脱敏；余额列只作可重建投影，不能作为可随意编辑的余额。',
        '银行原始实收保存为fund_flow的bank_credit事件，包含账户、银行唯一键、价值日、发生时间、金额、币种、原附言和原文索引。fund_allocation.receipt_flow_id必须引用有效实收，不能引用截图、内部释放或扣费事件。',
        'fund_allocation一行一份实收与交易的分配；保存分配金额、复核快照、已申报 / 已释放 / 已占用累计投影。实收本金 = 有效分配 + 未匹配差额；分配时锁定对应实收和交易，校验实收剩余与合同累计可收。',
        'fund_order用order_type区分invoice、verification、fee、settlement、payment、revenue_transfer、reconciliation；分别做必填和状态校验。trade_id可空仅用于未匹配实收的入账费及账户级对账。parent_order_id固定关联父业务版本，source_lines_json内每行引用allocation_id、来源事件和金额。',
        '一个资金业务单版本归属一笔交易；账户级对账及实收费用除外。低单量不设计跨多交易合并付款，逐笔发起便于核验；汇总来款通过fund_allocation拆分。付款收款账户、金额、审批、版本摘要及幂等键随单冻结，改单重新审批。',
        'INVOICE的来源明细直接放source_lines_json，version_no保留修订；只累计当前有效版本，旧版本不重复占用。核验单同时保留INVOICE版本、核验通过、实际入账和可用确认三项证据，部分成功只释放对应分配额度。',
        '费用以order_type=fee登记一次：入账费charging_key = receipt_flow_id + receipt_fee，实收本金×0.0003；申报完成费charging_key = trade_id + invoice_fee，每贸易单300元。固定D承担、授权、费率版本、基数和舍入；计提不等于银行扣账。补件 / 改版 / 重复回执不重计。',
        '受限、可用、费用预留、付款锁额分别由fund_flow的事件类型与bucket_from / bucket_to表达；内部释放、锁额 / 解锁不计入银行收支。业务类型决定会计影响，不允许客户端自填影响规则。一个事件只影响一次，账户快照与流记录同事务。',
        'fund_flow的bank_credit / bank_debit记录实际银行账户侧变化；相同bank_account_id + bank_event_key对银行事实唯一。内部release / hold / consume / unlock用独立event_key去重，可关联原银行事件但不能重算银行收支。跨B收款 / 收益账户转账保留两条账户侧银行事实，用transfer_key关联，双边核清后才认定收益到账。',
        'fund_flow保存本次金额、币种、来源 / 目标资金维度、余额 / 占用前后快照、业务版本、凭证revision路径及操作者；已提交只追加不可改。冲正追加反向事件并引用reversal_of，记录正式依据及批准，不覆盖原始实收或付款事实。',
        'V1仅用D实际可用且扣除费用预留 / 其他占用后足额的资金向A付款，差额由D补足，不默认减少A合同应收。V2垫资作为显式funding_source扩展，需独立额度 / 资金来源批准；不可用CNH不能当作垫资来源。',
        '付款单、有效锁额事件、待投递integration_record和成功operation_log在同库事务提交。超时保持未知和占用，先查询原请求；明确失败 / 取消才解锁。银行成功、A实际收款、内部节点审核分别保存。',
        '低单量逐笔对账：reconciliation类型fund_order保存账户 / 日期 / 币种、银行流水与内部事件勾稽明细JSON、差异原因、责任人和复核。禁止把不同币种或银行事实与内部迁移混加；不依靠手工改余额消除差额。',
        '金额使用DECIMAL(20,4)，费率DECIMAL(12,8)，银行提交按币种明确舍入；JSON内金额用十进制字符串，不能依赖浮点加减。CNH与国内CNY在本场景按人民币货币 + 离岸 / 境内资金位置区分，不默认外汇兑换。'
      ],
      integrations:[['← 交易档案','trade_record.id、批准快照、付款分支与合同条件；资金实际结果通过事件更新交易宽表的资金状态投影。'],['← RBAC账号权限','用user_account当前组织身份、角色授权快照、额度与银行账户范围校验；经办 / 批准 / 执行分离。'],['↔ 系统配置','规则使用config_record，银行请求使用integration_record，审计写operation_log；凭证仅存file_record.storage_path，不能随最新版替换。']],
      questions:['本方案是低单量业务资金台账，不扩展成完整企业总账；若需正式会计核算，另与财务系统凭证对接。','V1不开放退款或自动垫资；需要启用时增加明确业务类型及审批 / 对账规则，不以手工资金流事件代替真实执行。'],
      entities:[
        entity('bank_account','银行账户宽表',['uuid id PK','uuid org_id FK','string account_fingerprint UK','string purpose','json owner_verification_json','json balance_snapshot_json'],'真实账号、持有人 / 核验 / 授权、币种、账户位置、用途和余额投影完整保存。','账号指纹唯一；账号加密，核验变更记操作日志；余额由有效流事件重建。'),
        entity('fund_allocation','来款分配宽表',['uuid id PK','uuid receipt_flow_id FK','uuid trade_id FK','decimal allocated_amount','json approval_usage_json','string status'],'实收与交易的多对多金额关系；一行一份分配，复核及累计申报 / 释放 / 占用随行保存。','锁定实收后校验总分相等，分配及合同累计不超额；修改记录差异和原批准。'),
        entity('fund_order','资金业务单宽表',['uuid id PK','uuid trade_id FK','uuid parent_order_id FK','string order_type','int version_no','string charging_key UK','json source_lines_json','json approval_json','json result_json','json file_paths_json','string status'],'INVOICE / 核验 / 费用 / 结算 / 付款 / 收益划转 / 对账；金额、账户、来源明细、审批和结果快照随行保存，文件仅留版本路径。','UNIQUE(business_no, version_no)；付款幂等键唯一；费用charging_key非空唯一且计提版本锁定；每类型有独立校验。'),
        entity('fund_flow','不可变资金事件宽表',['uuid id PK','uuid account_id FK','uuid order_id FK','uuid allocation_id FK','uuid reversal_of FK','string event_key UK','string event_type','decimal amount'],'银行事实与内部受限 / 可用 / 占用事件分类保存；含币种、前后余额、交易 / 费用 / 请求、原件索引和反向关联。','只追加；银行事实按账户 + 银行事件键去重，内部事件按event_key去重；event_type固定余额影响。'),
        entity('trade_record','交易主表 · 交易档案',['uuid id PK'],'资金对应的稳定交易键。','跨域引用。',true),
        entity('organization','组织 · RBAC',['uuid id PK'],'账户管理组织。','跨域引用。',true)
      ],
      relations:[link('organization','bank_account','账户管理'),link('bank_account','fund_flow','账户侧事件'),link('fund_flow','fund_allocation','实收分配'),link('trade_record','fund_allocation','分次来款'),link('trade_record','fund_order','交易业务单','o|--o{'),link('fund_order','fund_order','前序业务版本','o|--o{'),link('fund_order','fund_flow','资金事实','o|--o{'),link('fund_allocation','fund_flow','额度事件','o|--o{'),link('fund_flow','fund_flow','反向冲正','o|--o{')]
    },
    {
      id:'rbac',name:'RBAC账号权限',subtitle:'组织、账号授权宽表与角色模板，省去成员和权限关联表',nodes:'A / B / E / F · 平台管理与审计',
      boundary:'RBAC使用3张表：organization、user_account、role_template。账号的组织成员身份、角色授予、数据范围、额度与时效按数组存储在同一宽表，保留稳定grant_id。角色模板保存权限清单；访问尝试和权限变更统一写operation_log。',
      aggregates:[
        ['组织与账号','organization + user_account','组织保存业务 / 平台属性及管理范围；账号保存本人身份、认证方式、成员身份、停用状态和权限版本。'],
        ['成对授权','user_account.grants_json','每个grant包含组织、角色版本、权限快照、数据范围、限额、有效期、申请 / 批准和撤销原因；不拆成多张关联表。'],
        ['角色模板与审计','role_template + operation_log','模板是可复制的权限定义。授予时冻结实际权限，模板改版不悄然扩大存量权限；授权及允许 / 拒绝访问保留审计。']
      ],
      lifecycle:[['账号','邀请 → 验证激活 → 暂停 / 离职停用'],['授权','待审批 → 待生效 → 有效 → 到期 / 撤销；续期新grant'],['访问','认证 → 当前组织成员身份 → 成对动作 / 范围 → 业务条件 → 结果留痕']],
      rules:[
        'organization是管理与访问边界，交易主体信息直接随trade_record冻结，业务角色A / B / E / F不写死在账号或组织上。C / D主体存在不自动产生后台账号；D填报须限定在指定档案的邀请授权内。',
        'user_account保存person_key、认证身份、memberships_json和grants_json。memberships_json每项有membership_key、org_id、有效期与状态；每次操作只选择一个有效组织身份，不能跨组织拼接权限。',
        'grants_json内每条有grant_id、org_id、role_code、role_version、permissions、scope、limit、currency、valid_from、expires_at、approval和status。服务端逐条判断动作与范围成对匹配，再对允许结果取并集，不能把甲角色动作与乙角色范围交叉组合。',
        'role_template以role_code + version_no唯一，permissions_json存resource:action清单与允许的范围类型。权限含查看、编辑、提交、审核、执行、原件下载及导出，查看不隐含导出。模板提交后锁定，变更生成新版本；已有grant迁移必须明确批准。',
        '职责分离在服务端按真实person_key、同一业务对象、申请 / 修改 / 审批 / 执行快照检查，不能只比姓名或账号ID。资金经办不可自审；多角色叠加和同人多账号不能绕过。规则可存确定版本的config_record，不需要单独冲突关系表。',
        '系统管理员仅管理账号 / 组织 / 模板，无业务审批和资金操作；Boss Viewer看授权脱敏摘要，不看原件；内部审计合规全量只读，无编辑、审批、执行或导出。Super Admin全模块权限仍受版本、资金及独立审批硬门禁。',
        '账号、成员或grant停用时提升auth_version，失效会话及旧授权缓存；每天低单量可直接读取数据库鉴权，先不引入复杂权限缓存。资金执行和导出下载必须再次校验当前授权。',
        '认证身份与会话可存受控JSON，令牌只存哈希；本地口令采用专用安全哈希字段，不存明文。历史业务审批保存当时真实人员、组织及grant快照，不因账号删改或模板更新而变化。',
        '权限改动用user_account.version做乐观锁；服务端按grant_id修改指定项。完整前后授权差异、理由、审批、来源、失败 / 拒绝结果写operation_log；禁止客户端提交任意完整权限JSON。'
      ],
      integrations:[['→ 交易与资金','提供当前user_id / org_id、grant_id、权限版本和成对范围；各业务单冻结批准时的身份和授权快照。'],['← 系统配置','职责分离、MFA / 会话及限额策略引用确定版本；规则不能绕过资金实收和审批条件。'],['→ 操作审计','认证、切组织、查阅 / 下载、导出、授权变更与拒绝事件统一写operation_log，不另拆访问日志关联表。']],
      questions:['账号通常只有少量组织与角色，JSON便于低单量维护；若未来需要大规模复杂权限查询，再拆成员 / grant关系表。','多法人组织、同人多账号核实、MFA及授权时效仍需业务确认；本轮不增加默认导出权。'],
      entities:[
        entity('organization','组织宽表',['uuid id PK','uuid parent_id FK','string org_code UK','string org_type','json profile_json'],'平台 / 业务组织、法人与联系资料、组织状态；不作为历史交易信息的唯一来源。','组织代码唯一；父组织禁止成环；上级不自动继承下级业务权限。'),
        entity('user_account','账号与授权宽表',['uuid id PK','uuid default_org_id FK','string login_name UK','string person_key','json memberships_json','json grants_json','json sessions_json','int auth_version','string status'],'账号认证、组织成员身份、角色与范围成对授予、审批 / 时效 / 撤销快照、会话摘要。','login_name唯一；grant_id稳定；更新使用version乐观锁；口令 / 令牌不明文记录。'),
        entity('role_template','角色权限模板宽表',['uuid id PK','string role_code','int version_no','json permissions_json','json approval_json','string status'],'每版角色的资源动作、范围类型与审批定义；实际授予的权限快照保存在账号宽表。','UNIQUE(role_code, version_no)；模板改版不自动扩大存量grant。')
      ],
      relations:[link('organization','organization','上级组织','o|--o{'),link('organization','user_account','默认组织','o|--o{'),link('organization','user_account','成员JSON逻辑引用','}o..o{'),link('role_template','user_account','授权JSON逻辑引用','}o..o{')],
      jsonLinks:'user_account.memberships_json[*].org_id → organization.id；grants_json[*].role_template_id → role_template.id。JSON数组内的逻辑引用由服务端校验，图中不画成物理外键或另建关联表。'
    },
    {
      id:'config',name:'系统配置',subtitle:'四张宽表：配置、通信、操作流水与审计任务',nodes:'规则 / 模板 / 渠道 / 操作审计',
      boundary:'系统域使用4张表：config_record、integration_record、operation_log、audit_task。文件统一引用交易域file_record的固定revision路径，不重复建设文件主表或revision表。适合低单量单库事务与人工复核。',
      aggregates:[
        ['版本化配置','config_record','一行一个配置版本，规则 / 费率 / 模板 / 节点定义 / 字典 / 渠道及留存策略按type区分；审批和生效区间直接随版本保存。'],
        ['外部通信与文件引用','integration_record → file_record','请求、回执与原始材料固定关联文件路径；模板、审计导出等公共文件同样使用文件记录表，trade_id可空，归属组织及访问范围必须明确。'],
        ['操作与审计','operation_log + audit_task','一行一个操作事件，完整记录身份、对象、前后状态、字段差异及证据。导出、归档、验真与到期处置用一张审计任务宽表管理。']
      ],
      lifecycle:[['配置','草稿 → 待审批 → 已批准 → 定时 / 即时生效 → 被新版本替代'],['外部请求','同事务登记待发送 → 已发送 / 未知 → 正式处理中 → 确定结果'],['审计任务','申请 / 审批 → 执行 → 结果验真 → 授权查阅或限期下载 → 按政策归档 / 处置']],
      rules:[
        'config_record以environment + scope_key + config_key + version_no唯一，schema_version约束payload_json。审批、发布人、批准摘要、生效窗口一并保存；同范围同键有效区间不重叠。按组织明确覆盖平台默认，业务单冻结实际生效版本。',
        '节点定义、材料要求和字典条目直接保存在对应配置版本JSON中，每项有稳定node_code / rule_key / code。流程分支、依赖及职责可校验，资金实收和独立审批硬门禁不能被配置绕过。',
        '批准后配置内容不可改；新版本和回滚都新增记录，状态变更写operation_log。已有交易继续使用冻结的规则 / 费率快照；存量规则迁移需明确范围及独立批准。低单量暂不设计多配置复杂发布编排。',
        'integration_record一行一个请求或接收事件。REQUEST行保存待发送 / 查询状态；RESPONSE / CALLBACK行保存原始事件及验真结果，parent_request_id关联原请求。请求内容提交后不可改，回执内容只追加；查单请求可另起记录关联原请求。',
        'REQUEST按渠道 + idempotency_key唯一，重复键不同摘要拒绝；回执按渠道 + external_event_key去重。未知或未匹配回执可先保存，不直接驱动付款或放行；正式原文仅保存对应file_record.storage_path，敏感字段脱敏。',
        '业务单、待发送REQUEST和成功operation_log在同库事务中写入；小型后台任务扫描待发送请求即可，不必先引入消息队列或单独outbox表。外部提交超时查询原单，不能因扫描重试重复付款 / 报关。',
        'file_record由交易域统一定义，一行一个文件revision；系统域只引用，不另设逻辑文件主表或revision子表。logical_file_id分组，revision递增，previous_record_id指向编辑基版，storage_path唯一且永久对应同一内容。',
        '业务实体只存revision的storage_path，例如exports/EX-DEMO/contracts/C01/r0002.pdf；不存文件内容、Base64或Blob，不重复保存文件元数据。file_record.storage_path唯一；展示链接按权限临时生成，数据库不保存带密钥的签名URL。',
        'allow_edit由文件类型、状态和授权控制：允许修改的草稿 / 工作文件，每次保存生成新revision和新路径；银行原始回单、正式签署件、官方回执等封存原件不可原位编辑，需要更正时新增关联文件及正式更正依据。所有旧revision都保留。',
        '文件先上传到新路径并验真，再锁定逻辑文件组分配revision并INSERT file_record；请求键唯一。基版或业务版本冲突时保留新revision但不换绑，上传失败不改变旧绑定；非原子上传的恢复和清理必须核对实际留档状态。',
        'file_record在READY后全行不可改；回滚是旧内容另存新revision，不删除或重编号。封存 / 权限 / 保全变更追加operation_log，访问时检查最新控制事件；逻辑删除、替换和导出访问到期都不清除任何留档revision。',
        '审批 / 签署 / 申报 / 付款固定当时storage_path，不设置可变current_revision_path。最新revision由文件组查询得出，只作展示，不替换业务绑定；换绑生成完整前后交易快照，N23使受影响批准逐级失效，外部事实保留。',
        'operation_log是全域不可变操作宽表；固定列用于按时间、用户、交易、动作、结果、request_id查询，details_json保存字段差异、授权 / 审批 / 证据快照及前后状态。禁止UPDATE / DELETE覆盖历史，修正以新事件指向原记录。',
        '成功变更、业务状态及operation_log同事务提交；失败 / 权限拒绝 / 回滚后结果单独持久化，不能随业务回滚丢掉。敏感动作审计不可写时不允许无记录执行，并独立告警。attempt / outcome用parent_event_id关联，event_key分别唯一。',
        '操作流水不存明文口令、私钥、访问令牌、完整账户或敏感原始报文。字段差异按白名单脱敏，原文通过受控文件索引访问；审计查看不自动授予原件下载权。',
        'audit_task按task_type区分export、archive、integrity_check、retention_disposal；保存用途、条件 / 范围、审批、执行结果、结果revision路径、行数及期限，文件摘要通过file_record查询。导出申请人不能自批，下载再次鉴权并留操作流水；现有内部审计合规角色仍无导出权。',
        '少量日志可按需人工复核与批次归档，归档清单直接放audit_task.result_json或不可变清单文件，包含事件ID、数量、时间范围和根摘要。使用独立只读备份 / 不可改存储与定期验真；哈希链自身不足以证明未删除或抗管理员篡改。',
        '调查保全使用交易 / 文件 / 任务的hold_json保存原因、范围、申请 / 批准及解除依据，所有变化写operation_log。日志等数据处置前核对关联保全，处置证明另存。文件与全部revision按本轮要求持续留档，不因导出链接到期、业务换版或逻辑删除清除历史。'
      ],
      integrations:[['→ 所有业务域','提供确定版本配置及文件索引；业务单保存所用版本和关键输入，配置不替代实际业务批准。'],['← RBAC账号权限','查询、导出、配置管理、发布、保全解除分别鉴权，审计中固定当时user_id / org_id / grant。'],['← 交易与资金','operation_log用target_type / target_id、trade_id、request_id串起跨域事件；低单量用单库查询即可，不建独立搜索平台。']],
      questions:['14张核心表作为宽表实现基线：交易3张、资金4张、RBAC3张、系统4张；跨域引用不重复计数。数据库引擎、加密 / 脱敏、日志留存与备份恢复目标在实施时确认。','需要高频跨JSON统计、复杂多租户规模化或大批量清结算时再评估拆表；当前不引入分库分表、缓存集群或事件总线。'],
      entities:[
        entity('config_record','配置版本宽表',['uuid id PK','string config_key','string scope_key','int version_no','json payload_json','json approval_json','datetime effective_from','datetime effective_to','string status'],'规则、费率、模板、流程、字典、渠道和留存策略；一行一个不可变内容版本，审批 / 生效信息随行保存。','UNIQUE(environment, scope_key, config_key, version_no)；生效窗口不可重叠；密钥仅保存引用。'),
        entity('integration_record','外部通信宽表',['uuid id PK','uuid parent_request_id FK','uuid config_record_id FK','string record_type','string event_key UK','json payload_json','json result_json','string status'],'REQUEST / RESPONSE / CALLBACK；完整目标业务、请求摘要、幂等键、原始结果、验真与处理状态。','请求内容冻结，回执追加；按正式渠道唯一键去重；超时不等于失败。'),
        entity('file_record','文件记录 · 交易档案',['uuid id PK','uuid logical_file_id','int revision','string storage_path UK'],'统一文件记录；每个revision一行，全域复用固定版本路径。','跨域引用，路径必须READY且授权可用。',true),
        entity('operation_log','全域操作流水宽表',['uuid id PK','uuid actor_user_id FK','uuid trade_id FK','uuid parent_event_id FK','string event_key UK','string action','string result','json details_json'],'一行一次尝试或结果；身份 / 授权 / 请求 / 对象 / 前后版本 / 字段差异 / 依据全量记录。','只追加；event_key唯一；匿名 / 系统任务actor_user可空但actor_type必填；业务无交易时trade_id可空。'),
        entity('audit_task','审计任务宽表',['uuid id PK','uuid requester_id FK','uuid approver_id FK','string result_file_path FK','string task_type','json scope_json','json approval_json','json result_json','string status'],'审计导出、归档、验真和日志到期处置；任务参数、批准、证据清单及保全随行保存，结果仅存文件revision路径。','申请 / 批准分离；条件变化重审；结果未生成可无文件路径；每次下载 / 验真 / 撤销另记operation_log。'),
        entity('user_account','账号 · RBAC',['uuid id PK'],'操作者和批准人；真实身份快照另保存在流水 / 业务单。','跨域引用。',true),
        entity('trade_record','交易主表 · 交易档案',['uuid id PK'],'跨域追溯业务键。','跨域引用。',true)
      ],
      relations:[link('config_record','integration_record','渠道版本'),link('integration_record','integration_record','请求与回执','o|--o{'),link('user_account','operation_log','操作身份','o|--o{'),link('trade_record','operation_log','交易追溯','o|--o{'),link('operation_log','operation_log','尝试结果及修正','o|--o{'),link('user_account','audit_task','申请人'),link('user_account','audit_task','批准人','o|--o{'),link('file_record','audit_task','结果版本路径','o|--o{')],
      jsonLinks:'业务文件路径、operation_log.details_json.evidence_paths[*]均引用file_record.storage_path；固定revision不随最新文件变化。文件摘要、修改人及全部历史revision统一从交易域文件记录表查询。'
    }
  ];
  for(const id of ['funds']){
    const domain=domains.find(item=>item.id===id);
    domain.entities.push(entity('file_record','文件记录 · 交易档案',['uuid id PK','string storage_path UK'],'业务实体只引用存储路径；全部历史revision由统一文件记录表留档。','路径必须存在且READY，不使用最新版本别名。',true));
    domain.relations.push(link('file_record','fund_order','文件版本路径JSON引用','}o..o{'));
  }
  const fieldDescriptions={
    id:'记录主键；跨域引用指向所属领域的同一记录',
    org_id:'数据所属管理组织，作为访问边界',
    dossier_no:'建档时生成的唯一档案编号',
    trade_no:'终审通过后生成的正式交易号；此前为空',
    trade_id:'关联交易档案主键；允许为空的场景见实体约束',
    version:'每次成功变更递增的乐观锁版本',
    content_version:'填写内容或文件绑定变化时递增；用于审批防过期',
    schema_version:'完整记录及结构化JSON的数据结构版本',
    approved_snapshot_id:'本档案最近批准事件快照；须另验当前内容有效性',
    status:'当前业务状态；合法取值及跳转见对应状态机',
    payment_mode:'预付或出口后付款分支；与当前规则版本一致',
    currency:'合同金额币种；金额不得跨币种直接汇总',
    contract_amount:'合同总金额；DECIMAL(20,4)，不是实收金额',
    contract_no:'A填写的销售合同编号',invoice_no:'A填写的商业发票编号',packing_no:'A填写的装箱单编号',
    parties_json:'A至F主体、注册号、联系地址、人员及D与C关系完整资料',
    goods_json:'货物明细及包装汇总；每项含稳定item_id及全部填写值',
    shipments_json:'口岸、方式、车辆、路线、预计时间及分批出运明细',
    collection_payment_json:'B业务指示、收款和付款路径、币种、模式原始填写值',
    commission_json:'佣金费率、基数、币种、汇率、税基、分批及扣收规则',
    service_json:'F资质、范围、报价及报价币种的业务填写内容',
    workflow_json:'合同签署、报关确认、证明及退税的正文与外部结果',
    node_states_json:'按节点、分支和业务对象保存当前状态及批准依据',
    rules_snapshot_json:'本档案适用的配置版本、条件及规则完整快照',
    exception_json:'异常范围、根因、责任人、纠正及解冻依据',
    hold_json:'留存保全范围、原因及审批快照；最新控制事件另行校验',
    commercial_invoice_path:'A商业发票的固定revision路径；N01必需',
    packing_list_path:'A装箱单的固定revision路径；N01必需',
    sales_contract_path:'A销售合同或订单的固定revision路径；N01必需',
    agency_instruction_path:'B本笔业务指示及收付路径说明；N01必需',
    fee_confirmation_path:'A与B佣金规则确认文件；N01必需',
    consignee_support_path:'C收货主体及地址支持资料；N01必需',
    payer_confirmation_path:'D付款确认资料；N01必需',
    payer_relationship_path:'C与D关系支持资料；N01必需',
    customs_agent_qualification_path:'F服务商资质文件；N01必需',
    customs_agent_quote_path:'F报价及服务范围文件；N01必需',
    agency_contract_path:'N02正式代理合同的固定revision路径',
    logistics_contract_path:'N03正式物流合同的固定revision路径',
    customs_authorization_path:'N04报关委托授权的固定revision路径',
    customs_declaration_path:'N07至N09适用报关版本路径；正式申报后固定',
    customs_release_path:'N09正式出口放行及附件2文件路径',
    export_certificate_path:'N20正式代理出口证明的固定revision路径',
    tax_result_path:'N21最终税务处理结果或不适用依据的路径',
    non_core_files_json:'非核心文件冗余关联清单；含item_id、类别、节点和固定路径',
    created_by:'创建人账号；系统生成可空但必须保存actor_type',
    created_at:'创建时间，按UTC保存',updated_by:'最近成功变更的账号',updated_at:'最近成功变更时间，按UTC保存',
    version_no:'对象内递增版本；复合唯一范围见实体约束',
    event_type:'事件类型；决定业务处理及审计分类',
    request_key:'本交易变更请求幂等键；同键不同内容拒绝',
    before_record_json:'变更前完整交易主表，含全部文件关联；创建时为空',
    after_record_json:'变更后完整交易主表，含版本、批准引用及全部文件关联',
    operator_id:'本次操作人；系统事件使用可追溯的服务账号',
    operator_snapshot_json:'操作当时姓名、person_key、组织、授权及代办身份',
    operation_reason:'本次操作的明确原因；不可仅写已修改',
    operated_at:'本次操作时间，按UTC保存',
    reviewed_snapshot_id:'审批所针对的提交快照；非审批事件可空',
    approver_id:'独立审批人账号；未发生审批时为空',
    approver_snapshot_json:'审批当时的真实人员、组织及授权快照',
    approval_decision:'批准或驳回结论；非审批事件为空',
    approval_reason:'审批意见与依据；与操作原因分别保存',
    approved_at:'审批决定时间；非审批事件为空',
    approval_json:'审批节点、经办与审核身份、意见、证据及适用版本快照',
    content_hash:'按固定序列化规则对完整记录及事件元数据计算的摘要',
    owner_org_id:'文件所有组织；公共文件也必须有明确访问边界',
    logical_file_id:'逻辑文件分组ID；同文件全部revision共享，不另建主表',
    revision:'同逻辑文件内从1递增的版本号；每次修改新增一行',
    previous_record_id:'本次编辑的基版文件记录；首次保存为空',
    supersedes_record_id:'正式更正所替代的原件记录；非更正可空',
    file_type:'受控文件类型，决定可编辑性及材料校验规则',
    display_name:'原始或展示文件名；不作为唯一存储路径',
    storage_path:'不可变文件存储路径；唯一对应本revision内容',
    sha256:'文件原始字节的SHA-256摘要，用于完整性验真',
    size_bytes:'文件大小，单位字节',media_type:'经校验的文件媒体类型',
    allow_edit:'本revision创建时的编辑策略；还须校验最新封存及授权事件',
    binding_result:'保存时是否成功换绑；bound或unbound，非当前绑定投影',
    save_request_key:'文件保存幂等键；在logical_file_id内唯一',
    actor_type:'操作来源：人工、系统任务或匿名尝试',
    actor_snapshot_json:'保存文件时的身份、来源及授权快照',
    change_reason:'文件新建、修改、回滚或正式更正的明确原因',
    access_json:'文件创建时的可访问组织、人员和动作策略快照',
    account_fingerprint:'规范化账号的受控指纹，用于去重，不展示原账号',
    purpose:'B收款、B收益或A收款等真实账户用途',
    owner_verification_json:'账户持有人、授权及核验材料和结论快照',
    balance_snapshot_json:'由资金事件重建的余额及占用投影，禁止手改',
    receipt_flow_id:'有效银行实收事件主键，不得引用内部释放事件',
    allocated_amount:'本次分配给该交易的金额；不得超过剩余实收',
    approval_usage_json:'分配复核及累计申报、释放、占用金额投影',
    parent_order_id:'前序资金业务单的确定版本，可空',
    order_type:'invoice、verification、fee、payment等资金业务类型',
    charging_key:'费用唯一计提键；非费用业务可空',
    source_lines_json:'来源分配、资金事件和金额明细；每项有稳定行ID',
    result_json:'执行结果、外部依据及异常信息的结构化快照',
    file_paths_json:'业务使用的固定revision路径清单，不保存文件正文',
    account_id:'本资金事件对应的真实银行账户',order_id:'相关资金业务单版本；独立实收可空',
    allocation_id:'相关来款分配；账户级事件可空',reversal_of:'被冲正的原始资金事件；非冲正为空',
    event_key:'事件幂等唯一键；来源及唯一范围按实体约束',
    amount:'本次资金事件金额；DECIMAL(20,4)，方向由事件类型决定',
    parent_id:'上级组织，可空；禁止形成循环组织结构',org_code:'唯一组织代码',org_type:'平台或业务组织类型',
    profile_json:'组织法人与联系资料等完整属性快照',default_org_id:'默认组织，仅作登录默认值，不替代有效成员鉴权',
    login_name:'唯一登录名',person_key:'真实人员标识；职责分离跨多个账号判断',
    memberships_json:'组织成员身份、稳定成员键、有效期及状态清单',
    grants_json:'角色版本、成对权限范围、额度、时效及批准清单',
    sessions_json:'受控会话摘要及失效信息，不存明文令牌',auth_version:'权限版本；撤权或停用时递增以失效旧会话',
    role_code:'角色模板代码，与版本号联合唯一',permissions_json:'资源与动作权限及允许的数据范围定义',
    config_key:'配置键；与环境、范围及版本共同唯一',scope_key:'配置适用的平台或组织范围',
    payload_json:'按类型及schema校验的完整配置或请求内容',
    effective_from:'批准配置的生效时间，UTC',effective_to:'生效窗口结束时间，UTC；长期有效可空',
    parent_request_id:'回执、回调或查单对应的原请求；原请求可空',config_record_id:'所用渠道配置的确定版本',
    record_type:'REQUEST请求、RESPONSE响应或CALLBACK回调',
    actor_user_id:'事件操作人；系统或匿名可空，需明确actor_type',
    parent_event_id:'关联尝试、结果或纠正的原操作事件，可空',action:'域内受控动作编码，如trade.submit',
    result:'success、rejected、failed、cancelled或unknown结果',
    details_json:'脱敏字段差异、前后状态、权限及审批证据；不是完整交易快照替代物',
    requester_id:'审计任务申请人，必须具备对应权限',result_file_path:'任务产物的固定revision路径；未生成可空',
    task_type:'export导出、archive归档、integrity_check验真或retention_disposal处置',
    scope_json:'申请范围、过滤条件、用途、脱敏及授权期限快照'
  };
  const entityFieldDescriptions={
    'trade_record.status':'档案草稿、待终审、在途、暂停或结案等主状态',
    'trade_record.created_by':'首次创建档案的账号；服务任务使用服务账号',
    'trade_snapshot.version_no':'本次变更后trade_record.version，按交易唯一递增',
    'trade_snapshot.content_hash':'完整前后记录及操作审批元数据的规范化SHA-256摘要',
    'file_record.status':'入库即READY且不可变；上传失败仅记流水不供业务引用',
    'fund_flow.event_type':'银行入扣账或内部释放、占用、解锁、冲正事件类型',
    'config_record.payload_json':'本配置版本的完整规则、费率、模板或渠道参数',
    'integration_record.payload_json':'提交后冻结的请求或原始回执结构化数据',
    'user_account.status':'邀请、激活、暂停或离职停用等账号状态'
  };
  const inputGroups=[
    ['A主体','parties_json.A','aName、aCode、aAddress、aContact、aPhone','名称、注册号、地址、联系人、电话随单冻结。'],
    ['A货物与包装','goods_json.items / goods_json.packing','goods、spec、brand、vendorPN、customerPN、hsSuggestion、origin、productCertificate、quantity、unit、unitPrice、packages、netWeight、grossWeight','保留品名、规格、品牌、双方料号、HS建议、原产地、证书说明及数量价格；每项稳定item_id。'],
    ['A合同与编号','contract_amount / currency / contract_no / invoice_no / packing_no','totalValue、currency、contractNo、invoiceNo、packingNo','固定列与明细合计一致；金额用十进制，资料不足允许草稿保存，提交按规则校验。'],
    ['B主体及收付指示','parties_json.B / collection_payment_json / payment_mode','bName、bCode、bContact、bPhone、bInstruction、bCollection、bPayment、bCurrency、bMode','收付指示原文保留；bMode规范化到payment_mode，副本不允许相互矛盾。'],
    ['佣金全部输入','commission_json','commissionRate、commissionBasis、commissionCurrency、commissionFxBasis、commissionTaxBasis、commissionPartialPolicy、commissionVersion、commissionEvidence、commissionDeductionRule','证据说明为原始填写值；对应必要确认文件路径独立存fee_confirmation_path。'],
    ['C收货方','parties_json.C','cName、cCountry、cCode、cAddress、cContact、cPhone、cDelivery','完整主体、国家、地址与交付要求；不依赖外部主档最新值。'],
    ['D付款方','parties_json.D','dName、dCountry、dCode、dContact、dPhone、dConfirm、dRelationship','付款确认和与C关系说明原文保留，支持文件另存固定路径。'],
    ['E运输资料','shipments_json','ePort、eMode、eVehicle、eRoute、eEta','口岸、运输方式、车船信息、路线和预计到达时间；分批运输增加稳定batch_id。'],
    ['F服务商','parties_json.F / service_json','fName、fQualification、fScope、fContact、fPhone、fEmail、fQuote、fQuoteCurrency','主体和联系信息入parties_json.F，资质、范围、报价、币种入service_json。'],
    ['后续节点输入','workflow_json / node_states_json / exception_json','N02—N23业务正文、签署、确认、申报、运输结果、证明、税务、异常及结案信息','按node_code、branch、subject_key保存全部输入；资金源事实保留资金域，交易只存引用及投影。']
  ];
  function fieldRows(item){
    return item.fields.map(field=>{
      const [type,name,...keys]=field.split(/\s+/);
      const description=entityFieldDescriptions[item.id+'.'+name]||fieldDescriptions[name];
      if(!description)throw new Error('缺少字段说明：'+item.id+'.'+name);
      return [name,type,keys.join(' / ')||'—',description];
    });
  }
  function source(domain){
    return 'erDiagram\n  direction LR\n'+domain.entities.map(item=>'  '+item.id+'["'+item.name+'"] {\n'+fieldRows(item).map((row,index)=>'    '+item.fields[index]+' "'+row[3].replace(/["\r\n]/g,' ')+'"').join('\n')+'\n  }').join('\n')+'\n'+domain.relations.map(item=>'  '+item.from+' '+item.cardinality+' '+item.to+' : "'+item.label+'"').join('\n');
  }
  const api={domains,source,fieldRows,inputGroups};
  root.EXPORT_DATABASE_MODEL=api;
  if(typeof module!=='undefined')module.exports=api;
})(globalThis);
