'use strict';
(function(root){
    const domains = [
      {
        id:"trade", layer:"core", name:"出口交易（聚合根）", code:"trade · 待评审", desc:"出口交易是代理出口核心域的业务聚合根。供应商预取唯一业务单号，首次提交时同事务创建交易及其收集资料；批准前后沿用该号，不存在运营先建单或邀请。步骤一仅供应商、付款方各首次提交一份，允许各自修改原资料；出口代理、物流公司、出口报关代理资料由供应商事先沟通后填写。参与方表只保存信息字段，生命周期和聚合修订由交易主表管理。外部与内部运营入口及协议分离，服务端核实法定身份、对象权限和字段白名单；业务单号与供应商声明均不是授权凭据。合同、单证、物流、关务、资金、税务和合规围绕该单号协作，不共享交易内部事务或代写彼此状态。",
        relations:["trade_record_tab 管理交易编号、流程状态及交易建档其余字段","trade_participater_tab 按交易和主体角色保存参与方信息，不管理状态","trade_revision_tab 保存含参与方信息的不可变完整快照","trade_event_tab 追加记录交易状态和业务过程","外部填报与内部运营使用独立授权视图","相近业务提示 → 人工核对（不自动合并/拦截）"],
        codebooks:[
          {name:"trade_status_code｜交易生命周期",rule:"创建即分配交易号。2合并原未开始/填报中，3合并待补/终审退回；暂停是未解除案件集合形成的正交门禁，不覆盖生命周期。1、6、7停止新增使用，历史值不复用。9、10为持久化终态；已批准不是已结案。",values:[
            ["2","编辑中","创建后分主体填报；首次打开仅记事件。后继：3、4、9"],
            ["3","待补充","运营/终审要求补充，来源、责任和原因由事件保存。后继：2、9"],
            ["4","待运营汇总","相关主体已提交或暂缺项已明确；运营核对主体、来源、版本和待补项。后继：5、3、9"],
            ["5","待终审","送审内容冻结。后继：3、8、9"],
            ["8","已批准","批准快照只读；更正进入新修订，旧版不覆盖。后继：2、10"],
            ["9","已终止","撤销、不可补正拒绝、人工确认重复后授权终止；原因必填，禁止再送审/批准"],
            ["10","已结案","正常结案需全部领域最终条件和资金账务勾稽；特殊结案本版不启用，终态禁止重开"]
          ]},
          {name:"trade_snapshot_reason_code｜完整快照留存原因",rule:"只在重要业务边界保存不可变全量快照；不记录每次键盘输入。",values:[
            ["1","提交人工终审","冻结审核人实际审阅的交易建档内容"],
            ["2","终审批准","保存批准通过的完整权威版本"],
            ["3","批准后更正","保存更正版本并保留被更正的批准版本"]
          ]},
          {name:"party_role_code｜交易业务主体角色",rule:"使用业务主体的完整名称；出口代理在业务字段命名中使用 export_agent；运营/审核操作者来自身份与访问控制域，不作为交易业务主体角色。",values:[
            ["1","中国供应商","supplier：法定名称、主体识别号、注册地址、联系人；商品资料及单据编号"],
            ["2","出口代理","export_agent：法定名称/识别号、联系人；代理指示、范围和收款/出款路径"],
            ["3","实际收货人","法定名称、国家/地区、注册号/主体识别信息、送货地址和收货联系人"],
            ["4","付款方","法定名称、国家/地区、主体识别信息、联系人、付款编号/金额/币种及关系说明；付款处理状态不在参与方表管理"],
            ["5","物流公司","主体资料及口岸、运输方式、车辆/工具、路线、预计提货/出运时间"],
            ["6","出口报关代理","法定名称、资质、联系人、服务范围、报价和计价币种"]
          ]},
          {name:"trade_event_type_code｜交易事件类型",rule:"仅记录业务事实；事件码冻结后不复用，新增码须版本评审。",values:[
            ["1","交易建档已创建","使用预取的 trade_number 创建交易；单号唯一约束保证最多创建一笔"],
            ["2","交易建档填报已开始","首次进入分主体授权范围填报"],
            ["3","交易建档资料已提交","业务主体提交本次资料及引用版本"],
            ["4","已要求补充资料","记录责任主体、字段/材料及原因"],
            ["5","运营汇总已完成","记录人工核对结论并送终审"],
            ["6","已提交人工终审","冻结送审修订摘要"],
            ["7","终审退回补充","记录退回原因和责任方"],
            ["8","已暂停","追加案件号、范围及原因，不改变交易生命周期"],
            ["9","暂停已解除","解除指定案件；其他未解案件继续阻断"],
            ["10","终审已批准","记录批准修订摘要；确认创建时分配的 trade_number 为正式交易号"],
            ["11","发现相近交易建档","记录候选 trade_number、命中字段和规则时间窗"],
            ["12","相近业务已人工核对","记录不同业务/重复/待补证等人工核对结论"],
            ["13","已创建更正修订","批准后发生交易建档字段更正；旧批准快照保持不变"],
            ["14","已提交运营汇总","参与方资料提交完成，等待运营汇总"],
            ["15","补充已开始","首次退回补充不要求已有批准版本"],
            ["16","交易已终止","终止原因码1撤销/2拒绝/3重复、依据及授权人必填"],
            ["17","交易已结案","正常结案，冻结各域最终结果引用；特殊结案本版不启用"],
            ["18","四流核对报告已生成","固定完整证据、源版本向量、对象集合和核对规则"],
            ["19","正常结案申请已提交","仅申请，不改变批准8生命周期"],
            ["20","正常结案申请已退回","独立决定及待补责任，保持原生命周期"]
          ]},
          {name:"similar_trade_review_code｜相近业务核对结果",rule:"按可配置时间窗内的交易建档资料识别候选（如供应商/商品名称规格、实际收货人、付款方及金额币种）；时间窗长度和匹配阈值由运营配置，不在模型中预设。提示不阻断建档、不自动合并、不替代审核结论；记录规则版本、命中字段、候选业务单号及人工核对人/时间。",values:[
            ["1","待核对","提示已生成，待运营查看"],
            ["2","不同业务","保留不同交易建档并记录区别依据"],
            ["3","同一业务","人工确认重复；按运营规则处置并保留原记录"],
            ["4","待补证","当前信息不足，补齐交易建档资料后重新核对"]
          ]}
        ],
        entities:[
          {name:"trade_record_tab",title:"出口交易聚合根与建档主表",keys:"PK id · UK trade_number（VARCHAR(128)，实际长度由单号格式定义）",fields:[
            ["id / trade_number","BIGINT UNSIGNED / VARCHAR(128)","内部主键及创建前预取、创建后沿用的唯一交易号；不对外暴露内部id"],["trade_status_code","TINYINT UNSIGNED","交易生命周期；终止/结案持久化，暂停门禁独立查询"],["revision_number / approved_revision_number","INT UNSIGNED","当前内容版及最近批准版；未批准为0，批准版指针原子维护"],["transaction_goods_items_json","JSON","商品数组；稳定商品序号、数量/金额十进制字符串、币种固定CNY及产品证据引用"],["transaction_filing_document_references_json","JSON","本次用途、逻辑文件号、版本及审核时观察摘要；不存文件正文"],["transaction_filing_source_and_version_json","JSON","逐字段来源、版本、具体角色/参与方序号及采集时间"],["transaction_filing_missing_information_json","JSON","未闭环待补项只读投影；要求/补齐事实保存在事件中"],["creation_payload_hmac / creation_payload_hmac_key_version","CHAR(64) / VARCHAR(64)","首次创建规范化载荷HMAC及密钥版本；不用于相似业务匹配"],["created_by / created_at / updated_by / updated_at / version","公共字段","可变主档维护审计；不提供软删除或释放交易号"]],rule:"币种只接受CNY。审核结果由当前修订的审核事件派生，不另存主表审核JSON。创建、修订、事件及送审/批准快照按短本地事务提交；同号同文返回既有结果，同号异文拒绝并告警。终止原因及终态事件与主状态原子写入；终止/结案后不可重开或复用编号。更正已批准交易须新修订、重审，并使受影响合同/付款依据失效。暂停按未解案件集合拒绝受控动作，查询不可用时不得放行；解除一个案件不解除其余门禁。"},
          {name:"trade_participater_tab",title:"交易参与方信息",keys:"PK id · FK trade_record_id · UK (trade_record_id, party_role_code, participant_sequence_number)",fields:[
            ["id / trade_record_id","BIGINT UNSIGNED","内部主键及所属交易主表引用"],["party_role_code / participant_sequence_number","TINYINT UNSIGNED / SMALLINT UNSIGNED","参与方角色码和同一角色下的参与方序号"],["legal_name / identity_type_code / identity_number_cipher","VARCHAR(1024) / TINYINT UNSIGNED / VARBINARY(2048)","交易时法定名称快照、识别类型及加密识别号"],["country_code / registered_address","CHAR(2) / VARCHAR(2048)","国家/地区及注册地址；送货地址放收货方角色JSON，不覆盖注册地址"],["contact_name / contact_phone / contact_email","VARCHAR(512) / VARCHAR(64) / VARCHAR(320)","该参与方主联系人资料"],["participant_information_json","JSON","角色封闭结构，含原型采集的路径、单据编号、运输安排及报价，见§11"],["created_by / created_at / updated_by / updated_at","公共字段","参与方信息的创建和更新审计字段"]],rule:"一行表示本交易一个参与方，不承载状态；旧版资料由交易快照还原，不建不可解析的主体主档引用。更正同步提升交易修订；仅CNY金额，不将银行执行事实放到填报信息中。"},
          {name:"trade_revision_tab",title:"完整交易建档版本快照",keys:"UK snapshot_number · UK (trade_number, revision_number, snapshot_reason_code) · UK source_event_number",fields:[
            ["id / snapshot_number","BIGINT UNSIGNED / VARCHAR(40)","内部主键及不可变快照号"],["trade_number / revision_number","VARCHAR(128) / INT UNSIGNED","交易号及内容版，同版可有送审/批准两个不同原因快照"],["snapshot_reason_code","TINYINT UNSIGNED","送审/批准/批准后更正原因"],["transaction_filing_snapshot_json","JSON","规范化业务内容、参与方、唯一文档清单及审核封套；不复制主表维护元数据"],["integrity_key_version / revision_content_hmac","VARCHAR(64) / CHAR(64)","快照HMAC及密钥版本，保留受控验证能力"],["source_event_number","VARCHAR(40)","唯一触发事件"],["created_by / created_at","公共字段","只追加创建人/时间"]],rule:"完整快照不可由摘要替代。退回后重新送审必须新内容版，即使内容未改也递增，避免同版同原因多义；批准快照由交易号+批准版+原因2唯一定位。付款保留独立执行快照以最小化跨域保留期耦合，但不得替代送审/批准证据。"},
          {name:"trade_event_tab",title:"交易业务事件",keys:"UK event_number · IDX (trade_record_id, occurred_at)",fields:[
            ["id / event_number","BIGINT UNSIGNED / VARCHAR(40)","内部主键及唯一事件号"],["trade_record_id / revision_number","BIGINT UNSIGNED / INT UNSIGNED","交易根与对应建档版本引用"],["event_type_code","TINYINT UNSIGNED","按 trade_event_type_code 固定事件枚举"],["from_trade_status_code / to_trade_status_code","TINYINT UNSIGNED NULL","状态转换前后码；非状态事件均为 NULL"],["actor_reference","VARCHAR(64)","身份域操作者引用"],["reason_code / reason_text","TINYINT UNSIGNED / VARCHAR(512)","受控原因码及非敏感说明"],["event_payload","JSON","按事件类型保存相近交易候选、人工核对结论及必要证据引用等最小必要数据"],["trace_id","VARCHAR(64)","跨域追踪标识"],["occurred_at / created_at","DATETIME(3)","事件发生和入库时间，UTC"]],rule:"追加写；不存身份证/合同正文；不带 updated_at、updated_by、version、deleted_id。事件类型使用上方固定码表，不得用自由文本。"}
        ]
      },
      {
        id:"contract",layer:"core",name:"合同与单证证据",code:"contract / document · 待评审",desc:"默认每笔trade分别签署所需用途的协议，不把多用途合同压成一份。仅明确登记为公共协议的版本可在有效期间及适用主体/用途范围内复用；逐单交易引用该确切签署版本，不能自动豁免逐单要求。合同版本管理审签，文件版本仅管理字节及可引用资格。",
        relations:["contract_record 1:N contract_revision","logical_file_number 1:N document_file_tab（文件版本）","trade / shipment / payment_transaction 直接引用文件版本（跨域业务号）"],
        codebooks:[
          {name:"document_type_code｜材料业务用途",rule:"表示材料在业务中的用途，不描述文件编码格式；按交易建档材料目录维护，可扩展但不可复用已发布编码。",values:[
            ["1","销售合同/订单","中国供应商提交的销售合同或订单"],
            ["2","商业发票","中国供应商提交的商业发票"],
            ["3","装箱单","中国供应商提交的装箱单"],
            ["4","产品资料","中国供应商提交的产品/货物资料"],
            ["5","代理指示/范围","出口代理（export_agent）提交的代理业务指示及范围"],
            ["6","付款关系/原因证明","付款方与实际收货人不一致时支持关系和付款原因的材料"],
            ["7","运输信息","供应商事先沟通后填写的物流公司口岸、运输安排等支持材料；后续运输节点按其职责处理"],
            ["8","报关代理资质","出口报关代理提交的资质证明"],
            ["9","报关代理报价","出口报关代理提交的报价/计价材料"],
            ["10","出口代理协议","A与B签署，费用、收付路径及职责依据"],
            ["11","国际物流服务合同","A与E签署的服务范围、报价及期限"],
            ["12","报关代理服务合同","A与F签署；预付款放行必要协议"],
            ["13","报关电子委托/授权","对应主体、货物/批次及有效期间"],
            ["14","B向D付款发票","与供应商商业发票区分"],
            ["15","银行及付款证据","实收、可用确认、扣款、到账和适用银行书面条件"],
            ["16","结算及收费授权","批准结算单、收费规则及承担方授权"],
            ["17","建档材料包","一个物理文件含销售合同/发票/箱单；每用途引用确切sheet/HTML锚点，摘要仍为整文件摘要"],
            ["18","报关草稿","非正式申报，绑定申报修订"],
            ["19","供应商书面确认","供应商对确切申报版的授权确认，非技术登录证明"],
            ["20","正式报关文件","正式附件2及对应申报身份，不以草稿替代"],
            ["21","官方回执","海关或税务正式来源，上传仅声明不表示已核实"],
            ["22","代理出口货物证明","正式附件3，独立验真及适用范围"],
            ["23","交付接收依据","发送、接收和内容核对分别记录"],
            ["24","退税申报材料","确定资料版，不代表已正式提交"],
            ["25","银行费用依据","实际费用凭证，非300元代理服务费"]
          ]},
          {name:"contract_scope_code｜合同适用范围",rule:"默认逐交易；公共协议是明确选用的例外，不自动适用于所有交易。",values:[
            ["1","逐交易","交易号必填；每交易、每合同用途仅一份当前有效协议，补充/更正走原合同新版本"],
            ["2","公共协议","交易号为空；有效起止日期、适用参与方法定身份及用途必填；逐交易显式引用签署版本"]
          ]},
          {name:"contract_revision_status_code｜合同版本生命周期",rule:"版本单一写入状态；主合同状态及当前生效版由版本/替代/终止事实派生，不另设可写主状态。",values:[
            ["1","编辑中","草稿可编辑"],["2","待审核","文件和版本冻结"],["3","待补充","保留退回意见，修改另起版本"],
            ["4","待签署","审核通过，等待必要签署方"],["5","已签署","签署件齐备，尚未满足生效条件"],
            ["6","已生效","可被本交易/符合范围的公共协议使用"],
            ["7","已被替代","法律替代决定已生效，历史引用仍可读"],
            ["8","已终止","签前作废/拒绝或生效后正式终止，原因及依据必填"]
          ]},
          {name:"file_revision_status_code｜文件版本状态",rule:"表示文件版本是否已由所属业务确认作为最终版本；与业务对象自身的材料审核状态分开管理。最终确认版本内容不可覆盖，更正必须创建新版本。",values:[
            ["1","编辑中","草稿或中间修订，禁止由业务对象作为最终文件版本引用"],
            ["2","最终确认","所属业务已确认，可由业务对象直接引用"],
            ["3","已被替代","曾经最终确认，后由新版本替代；保留供历史业务修订追溯"]
          ]}
        ],
        entities:[
          {name:"contract_record_tab",title:"合同身份与当前工作版",keys:"UK contract_number · UK (trade_number, document_type_code)（仅逐交易合同）",fields:[
            ["id / contract_number","BIGINT UNSIGNED / VARCHAR(40)","内部主键及合同业务号"],
            ["contract_scope_code / document_type_code","TINYINT UNSIGNED","逐交易/公共协议及协议用途，不能仅以跨境贸易场景代替用途"],
            ["trade_number","VARCHAR(128) NULL","逐交易合同必填且不可改属其他trade；公共协议为空"],
            ["current_revision_number","INT UNSIGNED","当前工作版指针，不代表当前法律生效版"],
            ["created_by / created_at / updated_by / updated_at","公共字段","合同身份维护审计"]],rule:"逐交易按trade+用途唯一，不允许借公共协议范围绕过逐单签署。公共协议有独立合同号，不建全局主体主档；版本固化法定身份快照，使用时与本交易批准参与方核对。交易/付款证据清单直接引用合同号+版本，不增通用绑定表。"},
          {name:"contract_revision_tab",title:"合同版本与审签",keys:"UK (contract_record_id, revision_number)",fields:[
            ["id / contract_record_id","BIGINT UNSIGNED","内部主键及合同身份引用"],["revision_number","INT UNSIGNED","合同内递增版；送审后修改必须新版本"],
            ["trade_snapshot_number","VARCHAR(40) NULL","逐交易合同使用的批准快照号；公共协议为空"],
            ["party_references_json","JSON","逐单为批准快照内角色/序号；公共协议为可核验的法定身份及授权证据快照"],
            ["review_file_revision_id / signed_file_revision_id","BIGINT UNSIGNED / BIGINT UNSIGNED NULL","冻结审核正文与最终签署件，二者不同字节时不能覆写同一文件"],
            ["contract_revision_status_code","TINYINT UNSIGNED","合同版本唯一生命周期"],
            ["review_snapshot_json / lifecycle_events_json","JSON NULL / JSON","未审核时review_snapshot为空；冻结审查结论及仅追加审签/替代/终止事件；每事件有幂等号及UTC时刻"],
            ["effective_from / effective_to","DATE / DATE NULL","约定有效区间；公共协议结束日必填，逐单可依履约结清条件终止"],
            ["signed_at / effective_at","DATETIME(3) NULL","实际签署及满足生效条件时刻，未发生为空"],
            ["supersedes_revision_number","INT UNSIGNED NULL","正式生效替代的旧合同版，不等同数字前序"],
            ["created_by / created_at","公共字段","版本创建信息"]],rule:"状态与追加事件原子提交；审核结论/正文送审后冻结，签署件引用仅能在签署事件时确定一次。旧签署/有效版本不可被新草稿失效；正式替代须新版本生效且有授权，终止须理由和法律依据。公共协议使用日须处于有效区间，参与方、用途及适用条款匹配，续期另起版本，不自动展期。"},
          {name:"document_file_tab",title:"文件版本元数据",keys:"UK (logical_file_number, revision_number) · UK storage_path",fields:[
            ["id / logical_file_number","BIGINT UNSIGNED / VARCHAR(40)","主键及逻辑文件分组号"],["revision_number / revision_status_code","INT UNSIGNED / TINYINT UNSIGNED","文件版本及可引用资格，不代表合同审核/签署"],["display_name / document_type_code","VARCHAR(256) / TINYINT UNSIGNED","展示名与用途；最终确认后用途不可静默改写"],["storage_path","VARCHAR(512)","不可变对象存储路径"],["sha256 / size_bytes","CHAR(64) / BIGINT UNSIGNED","字节摘要和长度"],["media_type","VARCHAR(128)","内容检测后的MIME类型，支撑校验"],["supersedes_file_id","BIGINT UNSIGNED NULL","正式替代的旧文件版，历史业务引用仍有效"],["access_scope_json","JSON","上传时授权证据快照，不是实时授权来源"],["created_by / created_at / updated_by / updated_at","公共字段","上传与受控元数据维护审计"]],rule:"字节/摘要/大小/路径不可覆盖；确认后用途冻结，只有展示名可受控改名。文件最终确认只赋予引用资格，不触发合同审核、签署或法律替代。隔离/扫描失败对象不进入可确认版本，失败留审计。所有读取按实时授权，旧访问快照不得扩权。"}
        ]
      },
      {
        id:"logistics",layer:"core",name:"物流履约",code:"logistics · 步骤三设计",desc:"拥有物流委托、出运批次、运输计划、提货/出运/签收事实及承运方回执；不拥有报关结论或资金状态。",
        relations:["shipment 1:N shipment_item_allocation","shipment 1:N transport_leg","shipment 1:N logistics_event","trade_item 1:N shipment_item_allocation（跨域引用）"],
        codebooks:[
          {name:"shipment_status｜批次履约状态",rule:"只保存可观察履约阶段；备货为事件，缺外部证据不能推进。",values:[["1","计划中","允许未执行计划更正"],["2","已订舱","等待提货"],["3","已提货待发运","已有核实提货事实"],["4","运输中","首段已启运"],["5","已到达","末段已到达"],["6","已签收","成功终态"],["7","异常处理中","全部异常实质闭环后恢复原阶段"],["8","已取消","未执行取消终态"],["9","履约失败","实质灭失等失败终态"]]},
          {name:"allocation_status｜物流商品分配状态",rule:"只适用于物流；不与资金分配码混用。",values:[["1","有效","计入同批准商品累计"],["2","撤销","不再占用，历史计划与事件保留"]]},
          {name:"event_type_code｜物流事件类型",rule:"追加写；载荷扩展在不可变中间件封套，不能覆盖历史事实。",values:[["1","批次计划","冻结初始计划"],["2","计划更正","冻结旧新计划"],["3","备货核实","不增加批次状态"],["4","订舱确认","关联真实订舱依据"],["5","提货确认","不等于离境"],["6","启运确认","出境须正式放行"],["7","到达确认","逐区段记录"],["8","签收确认","有权签收证据"],["9","异常核实","冻结原进度"],["10","异常处置","关联原异常"],["11","取消","未执行正式取消"],["12","履约失败","实质失败非技术故障"]]},
          {name:"event_status_code｜物流事件结果",rule:"此处仅接受已核实事实；待审声明留中间件提交资源。",values:[["1","已核实","有真实适用证据"]]}
        ],
        entities:[
          {name:"logistics_shipment_tab",title:"出运批次",keys:"UK shipment_number",fields:[
            ["id / shipment_number","BIGINT UNSIGNED / VARCHAR(40)","主键与批次业务号"],["trade_number / trade_revision_number","VARCHAR(128) / INT UNSIGNED","交易及修订引用"],["shipment_status","TINYINT UNSIGNED","计划/备货/在途/签收/异常等物流状态"],["shipper_party_role_code / shipper_participant_sequence_number / consignee_party_role_code / consignee_participant_sequence_number","TINYINT UNSIGNED / SMALLINT UNSIGNED / TINYINT UNSIGNED / SMALLINT UNSIGNED","发货人与收货人的交易参与方角色和序号"],["origin_code / destination_code","VARCHAR(32)","起运地及目的地受控地点码"],["planned_departure_date / actual_departure_at","DATE / DATETIME(3)","计划日期与实际出运 UTC 时刻"],["planned_arrival_date / actual_arrival_at","DATE / DATETIME(3)","计划与实际到达"],["carrier_party_role_code / carrier_participant_sequence_number","TINYINT UNSIGNED / SMALLINT UNSIGNED","承运物流公司的交易参与方角色和序号"],["created_by / created_at / updated_at","公共字段","批次维护信息"]],rule:"物流参与方均通过 trade_number、角色码和序号解析到交易时点快照，不引用未建模的全局主体主档。一个交易可有多个批次；批次状态归物流域，交易仅消费其进度投影。"},
          {name:"logistics_shipment_item_tab",title:"批次商品分配",keys:"UK (shipment_number, trade_revision_number, trade_goods_item_sequence_number)",fields:[
            ["id / shipment_number","BIGINT UNSIGNED / VARCHAR(40)","主键及批次引用"],["trade_number / trade_revision_number / trade_goods_item_sequence_number","VARCHAR(128) / INT UNSIGNED / SMALLINT UNSIGNED","交易业务号、不可变交易修订号及修订内商品数组序号"],["allocated_quantity / unit_code","DECIMAL(20,6) / VARCHAR(32)","本批分配数量及单位"],["allocated_amount / currency_code","DECIMAL(20,2) / CHAR(3)","本批分配金额必填，币种固定CNY"],["allocation_status","TINYINT UNSIGNED","有效/撤销等状态"],["created_by / created_at","公共字段","分配创建信息"]],rule:"先锁同交易根，校验所有批次累计数量/金额不超同一批准商品行。计划中替换当前分配前冻结旧计划至受理封套；已执行不可覆盖，撤销留痕。"},
          {name:"logistics_transport_leg_tab",title:"运输区段",keys:"UK (shipment_number, leg_sequence_number)",fields:[
            ["id / shipment_number","BIGINT UNSIGNED / VARCHAR(40)","主键与批次引用"],            ["leg_sequence_number","SMALLINT UNSIGNED","运输区段顺序"],["mode_code","TINYINT UNSIGNED","海运/空运/陆运/铁路等受控方式"],["carrier_party_role_code / carrier_participant_sequence_number / carrier_booking_number","TINYINT UNSIGNED / SMALLINT UNSIGNED / VARCHAR(64)","承运物流公司的交易参与方角色、序号及订舱业务号"],["origin_code / destination_code","VARCHAR(32)","起终地点"],["planned_departure_at / actual_departure_at","DATETIME(3)","计划/实际离港 UTC"],["planned_arrival_at / actual_arrival_at","DATETIME(3)","计划/实际到达 UTC"],["tracking_reference","VARCHAR(128)","承运方追踪引用；不存访问令牌"],["created_at / updated_at","DATETIME(3)","UTC 时间"]],rule:"物流参与方通过 shipment.trade_number、角色码和序号解析到交易时点快照，不引用未建模的全局主体主档。物流报价/应付费用和付款指令归资金运营；此处只记录履约事实。"},
          {name:"logistics_event_tab",title:"物流履约事件",keys:"UK event_number · IDX (shipment_number, occurred_at)",fields:[
            ["id / event_number","BIGINT UNSIGNED / VARCHAR(40)","主键和事件业务号"],["shipment_number / transport_leg_number","VARCHAR(40)","批次及运输区段引用"],["event_type_code","TINYINT UNSIGNED","提货/装船/离境/到港/签收/延误等码"],["event_status_code","TINYINT UNSIGNED","结果/异常分类"],["occurred_at / received_at","DATETIME(3)","事件发生和接收 UTC 时间"],["location_code","VARCHAR(32)","发生地点码"],["evidence_reference","VARCHAR(128)","承运回执/文件版本引用"],["source_message_id","VARCHAR(64)","集成消息稳定引用"],["created_at","DATETIME(3)","落库 UTC 时间"]],rule:"追加写；外部回执先经集成验签和去重，不能以消息到达直接推定签收。"}
        ]
      },
      {
        id:"customs",layer:"core",name:"关务申报",code:"customs · 步骤四设计",desc:"拥有申报草稿、商品申报版本、出口方确认、申报/受理/查验/放行/更正回执及申报代理授权引用。",
        relations:["customs_declaration 1:N customs_declaration_item","customs_declaration 1:N customs_event","shipment 1:N customs_declaration（跨域引用）"],
        codebooks:[
          {name:"declaration_status｜关务当前阶段",rule:"只消费已核实事实；技术受理不等于官方成功。",values:[["1","草稿","待准备"],["2","待草稿审核","冻结送审内容"],["3","待供应商确认","已独立审核"],["4","已确认","确切版本书面确认"],["5","已提交","需正式渠道证据"],["6","已受理","需正式机关证据"],["7","查验中","正式通知"],["8","已放行","正式放行证据"],["9","待补正","新修订另审"],["10","正式退单","非技术验签失败"],["11","已撤回","正式撤回或未办理授权放弃"]]},
          {name:"revision_status｜关务资料修订",rule:"历史内容不可改，状态投影受事件控制。",values:[["1","草稿","独立版本"],["2","待审","不可覆盖"],["3","待供应商确认","同版审批"],["4","已确认","同版书面证据"],["5","待补正","保留退回理由"],["6","已被替代","不可再用于新办理"]]},
          {name:"execution_status｜关务办理执行",rule:"未知不是失败；无正式通道证据不标成功。",values:[["1","待办理","仅本地意图"],["2","办理中","原请求"],["3","结果未知","原号核实"],["4","已提交","正式渠道已核实"],["5","明确未提交","有明确依据"]]},
          {name:"action_code｜关务办理动作",rule:"新动作不能绕过历史未知。",values:[["1","申报","确切已确认版"],["2","更正","关联原申报"],["3","撤回","监管规则确认"]]},
          {name:"event_type_code｜关务领域事件",rule:"本地事件外部键为空；正式来源命名空间及键唯一。",values:[["1","草稿创建","本地"],["2","修订创建","保留旧内容"],["3","送审","冻结"],["4","审核退回","理由"],["5","审核通过","独立审核"],["6","供应商确认","书面同版"],["7","办理意图","非官方提交"],["8","正式提交","正式渠道证据"],["9","正式受理","机关证据"],["10","查验","机关通知"],["11","正式放行","同批同版"],["12","补正要求","正式通知"],["13","正式退单","非技术错误"],["14","撤回","明确依据"],["15","附件交付","分别接收方"],["16","附件接收","有权接收人"],["17","证据声明","未核实"],["18","证据审核","独立核实或拒绝"]]},
          {name:"result_code｜关务事件结果",rule:"不当成官方状态。",values:[["1","已记录","本地事实"],["2","通过","已核实"],["3","退回","保留理由"]]}
        ],
        entities:[
          {name:"customs_declaration_tab",title:"关务申报单",keys:"UK declaration_number · UK (channel_code, external_declaration_number)",fields:[
            ["id / declaration_number","BIGINT UNSIGNED / VARCHAR(40)","主键和本地申报业务号"],            ["trade_number / shipment_number","VARCHAR(128) / VARCHAR(40)","交易号与物流批次号引用"],["declaration_revision_number","INT UNSIGNED","当前工作资料修订指针"],["version","INT UNSIGNED","根强标签并发游标，不代替历史资料版"],["exporter_party_role_code / exporter_participant_sequence_number / agent_party_role_code / agent_participant_sequence_number","TINYINT UNSIGNED / SMALLINT UNSIGNED / TINYINT UNSIGNED / SMALLINT UNSIGNED","出口方及报关代理的交易参与方角色和序号；与 trade_number 合并定位交易快照"],["declaration_type_code","TINYINT UNSIGNED","出口/更正等受控类型"],["declaration_status","TINYINT UNSIGNED","草稿/已确认/已提交/受理/查验/放行/退单等"],["customs_office_code / channel_code","VARCHAR(32)","关区及申报渠道码"],["external_declaration_number","VARCHAR(64)","外部正式申报号；未回执时 NULL"],["content_hash / authorization_evidence_reference","CHAR(64) / VARCHAR(128)","确认快照摘要与授权证据引用"],["submitted_at / released_at","DATETIME(3)","提交与放行回执时间 UTC"]],rule:"主体从批准快照解析。根仅当前投影，完整表头/角色1供应商、2境内发货人、3收货人及6代理与确认依据由不可变修订/领域事件保存。更正不覆盖旧正式事实。"},
          {name:"customs_declaration_revision_tab",title:"关务资料完整修订",keys:"UK (declaration_number, revision_number)",fields:[
            ["id / declaration_number / revision_number","BIGINT UNSIGNED / VARCHAR(40) / INT UNSIGNED","主键及本申报独立内容版"],
            ["approved_snapshot_number / shipment_plan_revision","VARCHAR(40) / VARCHAR(64)","不可变交易批准依据和批次计划版"],
            ["revision_status","TINYINT UNSIGNED","初始资料阶段快照，后续阶段由追加事件派生"],
            ["content_json / content_hash","JSON / CHAR(64)","封闭关务修订v1：完整表头/各角色/商品/文件/前版/规则及规范化内容摘要"],
            ["created_by / created_at","VARCHAR(64) / DATETIME(3)","可信创建身份及UTC"]],rule:"纯追加；修改新增修订。独立审核、A同版确认及正式结论由customs_event可还原，不藏技术账本。"},
          {name:"customs_filing_request_tab",title:"关务办理请求",keys:"UK request_number · UK provider_reference",fields:[
            ["id / request_number","BIGINT UNSIGNED / VARCHAR(40)","本地稳定请求身份，不冒充机关号"],
            ["declaration_number / revision_number","VARCHAR(40) / INT UNSIGNED","确切申报修订"],
            ["action_code / execution_status","TINYINT UNSIGNED","申报/更正/撤回及执行中/未知等"],
            ["request_hash / request_payload_json","CHAR(64) / JSON","冻结办理内容及A确认事件/授权/规则依据"],
            ["provider_reference","VARCHAR(128) NULL","可信通道命名空间及原请求引用，未知时空"],
            ["created_by / created_at / updated_at","VARCHAR(64) / DATETIME(3) / DATETIME(3)","办理审计UTC"]],rule:"办理意图不表示正式提交。未知保留原号核实，不另号重报；请求身份/内容冻结，执行阶段更新须有追加领域事件。"},
          {name:"customs_declaration_item_tab",title:"申报商品行",keys:"UK (declaration_number, declaration_revision_number, item_sequence_number)",fields:[
            ["id / declaration_number","BIGINT UNSIGNED / VARCHAR(40)","主键及申报引用"],["declaration_revision_number / item_sequence_number","INT / SMALLINT UNSIGNED","申报版本与行序号"],["trade_revision_number / trade_goods_item_sequence_number / shipment_allocation_number","INT UNSIGNED / SMALLINT UNSIGNED / VARCHAR(40)","来源交易不可变修订号、修订内商品数组序号及批次分配编号"],["hs_code","VARCHAR(16)","商品归类编码"],["declared_description / specification","VARCHAR(512) / VARCHAR(256)","申报品名及规格"],["declared_quantity / unit_code","DECIMAL(20,6) / VARCHAR(32)","申报数量及海关单位"],["declared_unit_price_amount / declared_total_amount","DECIMAL(20,2)","申报单价与总价"],["currency_code / origin_country_code","CHAR(3) / CHAR(2)","币种与原产地"],["created_at","DATETIME(3)","UTC 创建时间；提交后不可变"]],rule:"由关务规则校验与交易商品、物流批次分配差异；不自动覆盖交易域商品行。"},
          {name:"customs_event_tab",title:"关务回执事件",keys:"UK event_number · UK external_event_key",fields:[
            ["id / event_number","BIGINT UNSIGNED / VARCHAR(40)","主键及事件业务号"],["declaration_number / declaration_revision_number","VARCHAR(40) / INT UNSIGNED","申报及版本引用"],["event_type_code / result_code","TINYINT UNSIGNED","类型化本地或正式事实"],["external_event_key","VARCHAR(128) NULL","仅正式来源命名空间加稳定源键，本地事件为空"],["external_reference_number","VARCHAR(64)","海关回执/查验编号"],["occurred_at / received_at","DATETIME(3)","外部发生与系统接收时间"],["payload_file_reference","VARCHAR(128)","原始报文或回执文件引用"],["signature_verification_status","TINYINT UNSIGNED","1未验签/2已验证/3失败；人工验真不谎称数字验签"],["event_payload_json / actor_reference","JSON / VARCHAR(64)","封闭关务事件v1：证据声明/审查/确认/交付接收/原办理/原因及可信操作者"],["created_at","DATETIME(3)","UTC 落库时间"]],rule:"追加写。声明/内部批准不替代机关事实，伪造/验签失败隔离不改变真实官方状态。"}
        ]
      },
      {
        id:"tax",layer:"core",name:"税务 / 退税协同",code:"tax · 步骤六七设计",desc:"证明与退税分型，准备、内部审批、正式办理、交付及资金核对独立；未确认职责/范围不能正式申请，不代替机关结论。",
        relations:["tax_case 1:N tax_submission","tax_case 1:N tax_event","customs declaration / payment verification 作为外部证据引用"],
        codebooks:[
          {name:"tax_type_code｜税务事项类型",rule:"证明与退税不共享终结含义。",values:[["1","代理出口货物证明","无申请金额，正式签发及交付接收分开"],["2","退税申报","申请/批准/实际到账金额分开"]]},
          {name:"case_status｜税务案件阶段",rule:"业务权威在类型化领域事件，根只当前投影。",values:[["1","准备中","缺职责范围可以备料"],["2","待内部审核","冻结本版"],["3","待正式提交","不表示已提交"],["4","已提交","正式渠道证据"],["5","已受理","正式机关证据"],["6","补正中","新内容另版审"],["7","处理中","机关进度"],["8","正式处理完成待核对","证明待交接/退税待银行核对"],["9","交接或到账核对完成","按事项类型"],["10","终局拒绝","不能自动交易结案"],["11","已撤销","正式依据"]]},
          {name:"submission_status｜税务资料版阶段",rule:"资料冻结，更新阶段须领域事件。",values:[["1","待审核","不可覆盖资料"],["2","已退回","新资料另版"],["3","已批准","精确内容"],["4","提交待核实","含未知"],["5","已正式提交","渠道证据"],["6","已受理","正式依据"],["7","需补正","正式通知"],["8","已被替代","旧内容可追溯"],["9","处理结束","具体结论见事件"],["10","批准已失效","更正影响后须重审"]]},
          {name:"execution_status｜税务办理执行",rule:"技术执行与机关阶段正交。",values:[["1","未发送","内部准备"],["2","执行中","原办理号"],["3","结果未知","不盲目再发"],["4","明确未提交","正式核实"],["5","已取得提交回执","非受理"]]},
          {name:"event_type_code｜税务领域事件",rule:"内部事件不伪造外部回执；源码字典冻结。",values:[["1","案件建立","准备"],["2","资料版创建","冻结内容"],["3","内部审核退回","保留意见"],["4","内部审核批准","非机关批准"],["5","办理意图","非正式提交"],["6","正式提交","核实渠道依据"],["7","正式受理","机关证据"],["8","正式补正","新资料版"],["9","正式处理中","进度"],["10","正式签发或批准","按事项"],["11","终局拒绝","禁止自动交易结案"],["12","正式撤销","保留历史"],["13","证明交付","确切证明版"],["14","证明接收","供应商独立确认"],["15","证据声明","待核实"],["16","证据核实决定","不自动变机关结论"],["17","银行到账核对","只引用资金真实依据"],["18","批准失效","受影响资料重审"]]},
          {name:"result_code｜税务事件结果",rule:"不与官方处理阶段混用。",values:[["1","已记录","声明或准备"],["2","通过","有权核实"],["3","退回","缺项或冲突"]]}
        ],
        entities:[
          {name:"tax_case_tab",title:"税务事项案件",keys:"UK tax_case_number · UK (trade_number, tax_type_code, scope_reference)",fields:[
            ["id / tax_case_number","BIGINT UNSIGNED / VARCHAR(40)","主键及案件号"],["trade_number / trade_revision_number","VARCHAR(128) / INT UNSIGNED","交易及修订引用"],["scope_reference / version","VARCHAR(128) / INT UNSIGNED","确认规则规范化的办理范围及根并发游标；未知范围禁止正式办理"],
            ["taxpayer_party_role_code / taxpayer_participant_sequence_number","TINYINT UNSIGNED / SMALLINT UNSIGNED","纳税参与方角色及其在交易中的序号；由 trade_number 唯一定位参与方快照"],["tax_type_code","TINYINT UNSIGNED","1证明/2退税"],["case_status","TINYINT UNSIGNED","按事项类型控制的阶段"],["claimed_amount / currency_code","DECIMAL(20,2) NULL / CHAR(3)","证明不适用金额为空；退税备料可空，金额确定后合法CNY"],["authority_reference_number","VARCHAR(64)","主管机构正式业务号"],["created_at / updated_at","公共字段","案件维护信息"]],rule:"范围不是客户端随机号：准备时使用服务端确定的待确认范围占位且禁止正式动作；最终范围需业务规则确认并检查重叠，不默认一单一案。处理与证明接收/银行到账分开。"},
          {name:"tax_submission_tab",title:"税务提交版本",keys:"UK (tax_case_number, submission_revision_number)",fields:[
            ["id / tax_case_number","BIGINT UNSIGNED / VARCHAR(40)","主键及案件引用"],["submission_revision_number","INT UNSIGNED","提交版本号"],["package_hash","CHAR(64)","完整业务内容及文件清单规范化摘要"],["submission_status","TINYINT UNSIGNED","内部审核与正式办理分开"],["submitted_at / accepted_at","DATETIME(3)","提交与受理 UTC 时间"],["submitted_by","VARCHAR(64)","经办身份引用"],["correction_reason_code","TINYINT UNSIGNED","补正/重报原因码"],["evidence_manifest_json","JSON","固定文件版本引用及校验摘要"],
            ["submission_content_json","JSON","封闭税务资料v1：完整申报字段/批准快照/办理范围/申请额/规则/职责/检查报告；不只文件集合"],
            ["review_snapshot_json","JSON NULL","同版独立审核及意见，未审NULL，后续决定追加领域事件"],
            ["previous_submission_revision_number / correction_event_number / dispatch_reference","INT UNSIGNED NULL / VARCHAR(40) NULL / VARCHAR(128) NULL","前版/正式补正事件/命名空间原办理引用"],
            ["execution_status / version","TINYINT UNSIGNED / INT UNSIGNED","办理执行正交阶段与并发游标"],
            ["created_at","DATETIME(3)","UTC 创建时间；提交版本冻结"]],rule:"每次补正新增版。资料/清单/摘要/前版及范围自创建不可覆盖，状态和初次审查投影只能有领域事件支撑；未知保原办理号，不复用旧批准。"},
          {name:"tax_event_tab",title:"税务处理与到账事件",keys:"UK event_number · UK external_event_key",fields:[
            ["id / event_number","BIGINT UNSIGNED / VARCHAR(40)","主键及事件业务号"],["tax_case_number / submission_revision_number","VARCHAR(40) / INT UNSIGNED NULL","案件级事件无资料版，正式事件必须确切版"],["external_event_key","VARCHAR(128) NULL","正式来源命名空间加稳定键；本地事件空"],["event_type_code / result_code","TINYINT UNSIGNED","内部与正式结果分开"],["authority_reference_number","VARCHAR(64)","主管机构回执号"],["amount / currency_code","DECIMAL(20,2) / CHAR(3)","本事件确认金额及币种（适用时）"],["occurred_at / received_at","DATETIME(3)","机关发生与接收时刻"],["fund_flow_number","VARCHAR(40)","实际到账资金流水引用；无到账时为空"],["evidence_reference","VARCHAR(128)","回执/银行依据引用"],["event_payload_json / actor_reference","JSON / VARCHAR(64)","封闭税务事件v1：提交/决定/原办理/交付接收/资金核对及可信身份"],
            ["created_at","DATETIME(3)","UTC 落库时间"]],rule:"追加纯业务事实。证明签发与供应商接收、退税批准与真实银行到账分开；不能给代理的货款账户虚增退税余额。"}
        ]
      },
      {
        id:"payment",layer:"core",name:"资金运营 / 支付",code:"payment · 现有前缀，五表待评审",desc:"本次仅CNY。事务单据描述意图/审批，追加资金事件描述银行事实及受限、可用、付款锁额三种位置；首次获批分账时固定代理服务费由D承担并从已核验可用余额结算，不减少A合同应付。资金不足不得垫资；未知银行结果保持锁额。",
        relations:["bank_account（不可变配置版）1:N fund_flow","fund_flow(receipt) 1:N fund_allocation","trade_record 1:N payment_transaction","payment_transaction 1:N fund_flow","来源事务/事件 1:N account_voucher（单次记账命令一凭证）"],
        codebooks:[
          {name:"transaction_type｜资金单据类型",rule:"每类型仅允许自己的状态/必填字段；本次不设计换汇或垫资。",values:[
            ["1","INVOICE","B向D付款发票及申报，区别供应商商业发票"],["2","贸易核验","核验范围/金额，不推定可用"],["3","服务费结算","首次获批分账时从D已核验可用余额结算固定人民币300元"],["4","结算","批准A应付及净额；服务费不得作为A合同应付扣项"],["5","付款","实际向A出款"],["6","服务费实收（历史）","兼容旧版独立银行付款记录；新业务不使用"],["7","退款/退汇","正式批准后执行的独立反向单，不覆盖原付款"]
          ]},
          {name:"transaction_status｜资金单据生命周期",rule:"仅允许按类型限定的转换，成功不覆盖独立银行/记账事实。",values:[
            ["1","草稿","批准前可编辑"],["2","待审批","提交后载荷冻结"],["3","待补充","需修改则新单替代旧单"],["4","已批准","尚未完成该类型业务"],
            ["5","执行中","外部未知仍停留此态并记执行结果"],["6","已完成","类型目标和必要账务事实齐备，持久化成功终态"],
            ["7","已拒绝","审批/外部明确拒绝，原因和证据必填"],["8","已取消","未受理/无不可逆结果，解锁后终态"],["9","已被替代","新单明确替代未执行旧单，禁止再次执行"]
          ]},
          {name:"fund_bucket_code｜资金位置",rule:"只有三种位置；银行事件外部边界用NULL，不创建第四桶。",values:[
            ["1","受限","已实收但尚未满足核验/可用条件"],["2","可用","银行确认可用，仍受A货款付款业务门禁"],["3","付款锁额","已批准A货款付款或正式退款占用"]
          ]},
          {name:"event_type｜资金事件",rule:"正数金额；位置矩阵见领域文档§9.3。只有银行收支影响实存；12为分账时从可用货款转列服务费的内部账务事件。",values:[
            ["1","bank_credit","外部→受限，真实实收"],["2","bank_debit","付款锁额→外部，真实扣款"],
            ["3","release","受限→可用，核验/可用证据齐备"],["4","lock","可用→付款锁额，禁止超过可支付余额"],
            ["5","unlock","付款锁额→可用，明确失败/取消后"],["6","restrict","可用→受限，独立限制依据"],
            ["7","reversal","对原事件反向追加，外部收支必须有真实反向银行事实"],
            ["8","service_fee_billed","历史单独开单路径，兼容旧流水；新业务不再生成"],
            ["9","service_fee_voided","历史服务费账单作废事件；新业务不再生成"],
            ["10","agency_fee_bank_credit","历史独立服务费银行收款路径；新业务不再生成"],
            ["11","bank_fee_debit","实际银行费用扣款；独立证据/承担方/科目，不伪造货款锁额"],
            ["12","agency_service_fee_settled","首次获批分账时D承担的固定300元从可用余额转列B服务费；无银行扣款"]
          ]},
          {name:"verification_status｜银行账户核验",rule:"与账户启停不同。",values:[["1","待核验","不得执行"],["2","已通过","持有人及授权依据齐全"],["3","已拒绝","保拒绝原因"]]},
          {name:"fund_location_code｜人民币银行位置",rule:"只描述真实账号位置，不是币种或资金控制桶。",values:[["1","境内","境内人民币账号"],["2","离岸","离岸人民币账号"]]},
          {name:"account_purpose_code｜真实银行账号用途",rule:"配置核验后用途不可原位修改。代码2仅兼容历史独立服务费收款账号，新收费由D可用货款分账结算，不走该账号。",values:[["1","贸易收款","B接收D贸易来款"],["2","服务费收款（历史）","仅兼容旧版A独立付款路径；新业务不使用"],["3","供应商收款","A获批收款"],["4","正式退款收款","原付款方经正式程序核验的退款路径"]]},
          {name:"bank_account_status｜银行配置启停",rule:"核验通过仍须有效期内且启用。",values:[["1","启用","可校验使用"],["2","停用","不可新执行"]]},
          {name:"allocation_status｜分配状态",rule:"金额冻结，修改用撤销后新分配。",values:[["1","待复核","不提供可支付额度"],["2","有效","计入有效分配"],["3","已撤销","持久化终态，须先消除关联占用/执行影响"]]},
          {name:"handle_status｜对账差异",rule:"关闭须复核且引用补账/处置证据。",values:[["1","待处理","待分派"],["2","处理中","调查/补证"],["3","待复核","处理待复核"],["4","已关闭","终态，后续新问题另开差异"]]},
          {name:"difference_type｜对账差异类型",rule:"按实际差异建案，不按单据状态猜测银行事实。",values:[["1","缺失","银行或内部事实缺项"],["2","重复","重复来源待核对"],["3","金额","银行与内部金额不符"],["4","状态","执行/到账/记账事实不符"]]},
          {name:"review_result｜差异复核结论",rule:"未复核时为空，复核通过才能关闭。",values:[["1","通过","依据齐备并独立复核"],["2","退回","继续处理，保留原意见"]]},
          {name:"execution_status_code｜外部执行结果",rule:"结果为不可变回执的当前投影，不能替代业务生命周期。",values:[["1","未提交","无外部受理"],["2","已受理","等待结果"],["3","未知","超时查单，禁止解锁"],["4","已扣款","银行证据确认"],["5","已到账","收款证据/双边核清"],["6","明确失败","有效终态回执"]]}
        ],
        entities:[
          {name:"payment_bank_account_tab",title:"真实银行账户不可变配置版",keys:"UK account_number · UK (account_fingerprint, configuration_revision_number)",fields:[
            ["id / account_number","BIGINT UNSIGNED / VARCHAR(32)","配置版本内部主键及独立业务号；付款冻结此号"],
            ["configuration_revision_number","INT UNSIGNED","同真实账号的配置递增版，变更用途/持有人/期限须新建版本"],
            ["bank_code / country_code","VARCHAR(32) / CHAR(2)","银行及国家/地区"],["account_purpose_code","TINYINT UNSIGNED","贸易收款/历史服务费收款/供应商收款用途"],
            ["currency_code / fund_location_code","CHAR(3) / TINYINT UNSIGNED","币种恒为CNY；境内/离岸位置不表示另一币种"],
            ["account_fingerprint","CHAR(64)","同真实账号跨配置版本稳定的受控指纹；银行事实去重按此身份而非版本id"],
            ["account_number_cipher","VARBINARY(512)","受保护账号"],
            ["verification_status / verification_snapshot_json","TINYINT UNSIGNED / JSON","核验结果及含持有人名称/证据的冻结快照"],
            ["valid_from / valid_to / account_status","DATETIME(3) / DATETIME(3) NULL / TINYINT UNSIGNED","配置有效区间及启停"],
            ["created_by / created_at","公共字段","配置创建审计；核验/停用动作留审计"]],rule:"核验通过后配置载荷不可覆盖；变更须停用旧版、新建不重叠有效区间及重新核验。审批冻结配置号和核验摘要，执行仍实时复查停用/有效期；配置不符不得自动换新账号。持有人必填于通过核验快照，不引入主体主档。银行回执跨配置版本仍以稳定账号指纹+银行事件键去重。"},
          {name:"payment_transaction_tab",title:"资金业务事务单据（transaction）",keys:"UK transaction_number · UK (source_context_code, request_number)",fields:[
            ["id / transaction_number","BIGINT UNSIGNED / VARCHAR(40)","内部主键及不可变单据版本业务号；修改送审载荷必须新号，不再保留矛盾的事务版号"],
            ["transaction_type","TINYINT UNSIGNED","类型决定字段和转换子集"],["source_context_code","VARCHAR(32)","请求来源命名空间"],
            ["trade_number / trade_revision_number","VARCHAR(128) NULL / INT UNSIGNED NULL","交易及批准修订；服务费结算必须关联交易及批准版本"],
            ["trade_filing_snapshot_json / trade_filing_snapshot_hmac / integrity_key_version","JSON NULL / CHAR(64) NULL / VARCHAR(64) NULL","适用交易的付款/退款独立执行快照及HMAC，绑定批准快照；未匹配实收正式退回以原实收/授权证据替代，不伪造交易"],
            ["parent_transaction_number / supersedes_transaction_number","VARCHAR(40) NULL","父业务单与被替代旧版分别引用，不混用"],
            ["amount / currency_code","DECIMAL(20,2) / CHAR(3)","金额及固定CNY"],
            ["source_lines_json / execution_basis_json","JSON","来源分配/实收明细及按类型冻结的核验、服务费结算、结算/付款依据"],
            ["payer_account_number / payee_account_number","VARCHAR(32) NULL","不可变银行配置版本号；按类型适用"],
            ["transaction_status","TINYINT UNSIGNED","单据唯一生命周期，含完成/拒绝/取消/被替代终态"],
            ["request_number / request_hash","VARCHAR(64) / CHAR(64)","每次创建请求号及摘要；同键异文冲突"],
            ["approval_snapshot_json / result_snapshot_json / lifecycle_events_json","JSON","冻结审批、外部事实投影及仅追加的状态/回执/查单历史"],
            ["created_by / created_at / updated_at","公共字段","创建人及UTC维护时间"]],rule:"单据一号一版：提交后载荷冻结，修改新号并原子终止旧单为被替代；旧单有外部受理/未知/扣款则不得替代，走独立反向流程。每trade首次获批分账时按agency_service_fee唯一键结算固定300元，由D承担、从D已核验可用余额转列B服务费；INVOICE申报/补正不触发收费，分账重试不重复扣费。不按实收本金计提；不从A合同应付中扣减。凭证从来源事件/单据反查，不存单值voucher_number。审批、终态、解锁和追加历史原子提交；外部回执不得覆盖批准载荷。"},
          {name:"payment_fund_allocation_tab",title:"来款分配",keys:"UK allocation_number · IDX (receipt_flow_number, trade_number)",fields:[
            ["id / allocation_number","BIGINT UNSIGNED / VARCHAR(40)","主键及分配号"],["receipt_flow_number","VARCHAR(40)","真实bank_credit来源"],
            ["trade_number / trade_revision_number","VARCHAR(128) / INT UNSIGNED","交易及批准修订"],["allocated_amount / currency_code","DECIMAL(20,2) / CHAR(3)","毛额分配及固定CNY，已付/已扣仍保留其原始归属"],
            ["allocation_status","TINYINT UNSIGNED","待复核/有效/已撤销"],
            ["released_amount / occupied_amount","DECIMAL(20,2)","净累计释放和当前付款锁额物化投影；与事件同事务，供加锁防超额"],
            ["approval_snapshot_json","JSON","复核及当时交易上限/算法；核验累计由已确认核验单范围求和，不另存verified_amount"],
            ["reversal_of_allocation_number","VARCHAR(40) NULL","新分配所替代的已撤销编号"],
            ["created_by / created_at / updated_at","公共字段","创建/维护审计"]],rule:"实收本金=有效毛额分配+未匹配毛额；A货款付款不改变原毛额，净剩余由事件派生。首次获批分账时仅一次从D已核验可用余额结算固定300元服务费；该金额不减少A合同应付，余额不足不得继续扣费或伪造A已结清。核验按实收/分配范围、金额幂等覆盖，不重复累计；释放不能超过已核验且银行确认可用范围。按稳定银行身份及实收、分配记录固定顺序加锁；释放/锁额投影与事件原子更新、独立重算。已批准分配不得改金额；撤销前须无未清占用、无未处理已执行金额，不能撤销分配来掩盖已付资金。"},
          {name:"payment_fund_flow_tab",title:"不可变资金事实与服务费结算事件",keys:"UK flow_number · UK (bank_account_fingerprint, bank_event_key) · UK event_key",fields:[
            ["id / flow_number","BIGINT UNSIGNED / VARCHAR(40)","内部主键及事件号"],
            ["bank_account_id / bank_account_fingerprint","BIGINT UNSIGNED NULL / CHAR(64) NULL","当时配置引用及稳定真实账号指纹；内部服务费事件无银行身份，银行事实按码表要求填写"],
            ["transaction_number / allocation_number","VARCHAR(40) NULL","不可变业务单号/分配号；服务费结算必须关联对应交易及来源分配"],
            ["event_type","TINYINT UNSIGNED","银行收支、内部三桶迁移、反向或服务费结算"],
            ["bank_event_key","VARCHAR(128) NULL","银行侧事实键；内部事件为空"],
            ["event_key / request_hash","VARCHAR(128) / CHAR(64)","稳定内部事件幂等键及同键异文摘要；每trade服务费结算键在此唯一"],
            ["amount / currency_code","DECIMAL(20,2) / CHAR(3)","正数发生额及固定CNY"],
            ["bucket_from / bucket_to","TINYINT UNSIGNED NULL","只允许1受限/2可用/3付款锁额；外部边界及非资金迁移事件为空"],
            ["value_date / occurred_at / created_at","DATE NULL / DATETIME(3) / DATETIME(3)","银行价值日（内部事件可空）、发生及UTC接收时间"],
            ["bank_reference / raw_message_reference","VARCHAR(128) NULL","银行号及受控原始证据；内部服务费结算不伪造银行回单"],
            ["reversal_of_flow_number","VARCHAR(40) NULL","反向事件引用原事实/结算；不得UPDATE回填凭证"]],rule:"银行事件与内部迁移严格分开；8/9/10仅为旧版独立服务费账单/收款历史码，新业务不得生成。event_type=12在首次获批分账时从货款可用桶转列D承担的300元服务费，bucket_from=2、bucket_to=NULL；不是银行扣款且不增加第四货款桶。流水及相关事实均追加写；凭证按来源事件反查，不设需异步回填的voucher列。bank_credit/debit按稳定身份+银行事件键去重，跨配置版本不重入；同事件异文拒绝并告警。"},
          {name:"payment_reconcile_difference_tab",title:"支付对账差异",keys:"UK difference_number · IDX (reconcile_date, handle_status)",fields:[
            ["id / difference_number","BIGINT UNSIGNED / VARCHAR(40)","主键及差异业务号"],["bank_account_id / reconcile_date","BIGINT UNSIGNED / DATE","账户引用及对账业务日"],["currency_code / difference_type","CHAR(3) / TINYINT","固定CNY及缺失/重复/金额/状态差异"],["bank_event_key / flow_number","VARCHAR(128) NULL / VARCHAR(40) NULL","缺失一侧可空，不制造占位流水"],["transaction_number","VARCHAR(40) NULL","相关资金事务业务号"],["bank_amount / internal_amount","DECIMAL(20,2) NULL","未知为空；有证据确认缺失才记0，双方可确认时才派生差额"],["handle_status / owner_reference","TINYINT / VARCHAR(64)","处理状态与责任人"],["handle_reason / review_result","VARCHAR(512) / TINYINT NULL","原因及复核结论；每次处置/退回留独立审计"],["evidence_reference / created_at / updated_at","VARCHAR(128) / DATETIME(3) / DATETIME(3)","处理证据和 UTC 时间"]],rule:"差异金额由 bank_amount 和 internal_amount 计算，不另存可漂移的 difference_amount。差异处理不能手工改余额；补账/调账必须生成新的资金事件和账务凭证。"}
        ]
      },
      {
        id:"account",layer:"core",name:"账务核心",code:"account · 现有前缀",desc:"人民币资金控制账户只分受限、可用、付款锁额；银行现金、清算负债、收入等是会计科目，不再作为额外资金位置。实际入账、释放/锁额、付款、手续费划转、退款及冲正均有明确记账映射；仅有账面余额不得推定可支付。",
        relations:["account 1:N account_ledger_entry","account_voucher 1:N account_ledger_entry","来源事务/事件 → 多阶段凭证（按来源号反查）"],
        codebooks:[
          {name:"internal_account_type_code｜资金控制账户类型",rule:"仅三种位置。与旧internal_account_id不是同一码表，禁止以旧码重解释历史。",values:[
            ["1","受限","尚未核验/确认可用的资金"],["2","可用","已确认可用，仍受A货款付款业务门禁"],["3","付款锁额","为批准的A货款付款或正式退款占用"]
          ]},
          {name:"ledger_account_status｜记账账户启停",rule:"这是运行门禁，不增加资金位置类型。",values:[["1","启用","可校验记账"],["2","停用","新记账拒绝，保历史余额/分录"]]},
          {name:"direction｜分录方向",rule:"方向与正数金额分离。",values:[["1","借","按受控科目规则记借方"],["2","贷","按受控科目规则记贷方"]]},
          {name:"voucher_status｜凭证持久化状态",rule:"请求阶段和账户门禁不混入凭证；冲正后旧凭证/分录仍保留。",values:[
            ["1","记账中","请求占位，禁止出现部分分录"],["2","已记账","余额/分录原子成功"],["3","已冲正","完整反向凭证成功后的原凭证终态"],["4","失败","校验/技术失败留痕，同键同文可受控重试"]
          ]}
        ],
        entities:[
          {name:"account_tab",title:"人民币三位置账务账户",keys:"UK account_number · UK (internal_account_type_code, scope_key)",fields:[
            ["id / internal_account_type_code","BIGINT UNSIGNED / TINYINT UNSIGNED","内部实例主键及受限/可用/付款锁额类型，不是同一个ID"],
            ["account_number / scope_key","VARCHAR(64) / VARCHAR(256)","账务业务号及受控范围键：主体/稳定银行身份/科目/交易范围；不得用配置版制造重复余额"],
            ["currency_code / account_status","CHAR(3) / TINYINT UNSIGNED","固定CNY及账户启停"],
            ["ledger_balance","DECIMAL(20,2)","受控物化账面余额；科目正常方向决定符号，不是所有科目统一非负"],
            ["created_at / updated_at","DATETIME(3)","UTC维护时间"]],rule:"只建三种D货款资金位置；科目及稳定银行身份由受控scope解析，不冗余配置引用。A货款可支付额按合同应付及已付/锁额核算；D承担的300元在首次分账时从可用余额转列服务费，不冲减A合同应付。锁定资金范围和账户，投影/凭证/分录同事务；分库时先确定锁额成功才调银行，超时不解锁。无授信、垫资、透支、换汇。"},
          {name:"account_voucher_tab",title:"单次记账命令凭证",keys:"UK voucher_number · UK idempotency_key · UK reversal_of_voucher_number（非空） · IDX (business_type_code, business_number, transaction_date)",fields:[
            ["id / voucher_number","BIGINT UNSIGNED / VARCHAR(40)","内部主键及凭证号"],["business_type_code / business_number","VARCHAR(32) / VARCHAR(128)","来源事件/事务类型及不可变业务号，允许未分配实收事件来源"],
            ["transaction_date / accounting_period","DATE / CHAR(6)","同一凭证所有分录的会计日/期间，本次业务采用中国UTC+8会计日"],
            ["currency_code / total_amount","CHAR(3) / DECIMAL(20,2)","固定CNY；总额为借方单边合计，必须等于贷方合计"],
            ["voucher_status","TINYINT UNSIGNED","记账中/已记账/已冲正/失败"],
            ["idempotency_key / request_hash","VARCHAR(128) / CHAR(64)","来源+记账阶段唯一命令键及异文校验"],
            ["reversal_of_voucher_number","VARCHAR(40) NULL","本次仅整张冲正，一原凭证最多一个成功反向凭证；失败占位重试同键"],
            ["created_by / created_at / updated_at","公共字段","来源及UTC维护时间"]],rule:"一次记账命令一凭证，一业务按入账/释放/支付等阶段可有多凭证；来源+阶段纳入幂等键，支持从来源反查而不回填流水。记账中可作请求占位，成功事务原子提交全部分录/余额/凭证；失败单独留痕，不留部分账。已记账原凭证在反向成功前仍已记账，冲正申请不是原凭证新阶段。"},
          {name:"account_ledger_entry_tab",title:"不可变账务分录",keys:"UK entry_number · UK idempotency_key",fields:[
            ["id / entry_number / voucher_number","BIGINT UNSIGNED / VARCHAR(40) / VARCHAR(40)","主键、分录号及凭证引用"],["account_id","BIGINT UNSIGNED","内部账务账户引用；账户业务号通过 account_id 关联取得"],["direction / amount","TINYINT UNSIGNED / DECIMAL(20,2)","借贷方向与正数金额分离"],["balance_after / currency_code","DECIMAL(20,2) / CHAR(3)","记账后余额及固定CNY"],["subject_code","VARCHAR(32)","会计科目与账户受控scope一致；来源由凭证提供"],["idempotency_key","VARCHAR(128)","分录唯一幂等键"],["request_hash / reversal_of_entry_number","CHAR(64) / VARCHAR(40) NULL","请求摘要及反向时原分录号；正常分录为空"],["accounting_period / transaction_date","CHAR(6) / DATE","固化会计期间与会计日"],["created_at","DATETIME(3)","UTC 入库时间；分录仅成功时创建"]],rule:"来源及生命周期由凭证管理；分录纯追加，不改金额/删行/回写冲正标记。仅整凭证反向，每条反向分录引用原条目；余额按account_id升序锁定，与凭证/全部分录同事务。"}
        ]
      },
      {
        id:"compliance",layer:"governance",name:"合规与差异案件",code:"compliance · 待评审",desc:"拥有筛查运行及版本、命中复核、四流差异案件、暂停/解除决定、处置证据及责任人；系统筛查不宣称法定结论。",
        relations:["screening_run 1:N screening_hit","discrepancy_case 1:N disposition_event","compliance case → trade/payment/customs references"],
        codebooks:[
          {name:"case_status｜差异案件阶段",rule:"关案不自动解除暂停。",values:[["1","待分派","未确认风险结论"],["2","调查处置中","保留责任"],["3","待独立复核","申请不等于通过"],["4","已关闭","暂停须另有明确解除"]]},
          {name:"case_type_code｜差异类型",rule:"所属域核实并处理权威事实。",values:[["1","主体","身份关系"],["2","货物物流","履约"],["3","关务单证","正式依据"],["4","资金账务","守恒和平衡"],["5","税务","证明退税"],["6","版本更正","依赖失效"]]},
          {name:"severity_code｜差异严重度",rule:"不由严重度直接推定终止。",values:[["1","一般","待核实"],["2","重要","范围门禁"],["3","重大","有权独立复核"]]},
          {name:"scope_code｜案件影响范围",rule:"精确对象和动作清单在类型化决定中冻结。",values:[["1","整交易","全部受影响动作"],["2","指定批次","物流关务"],["3","指定资金事务","只影响关联金额"],["4","指定税务事项","证明或退税"],["5","指定材料更正","递归相关依赖"]]},
          {name:"action_code｜案件处置动作",rule:"每次决定追加；申请不能代替执行。",values:[["1","分派","责任"],["2","暂停","指定范围"],["3","补正提交","未核实"],["4","处置决定","实质复核"],["5","更正申请","范围"],["6","更正范围决定","失效及重审"],["7","解除申请","原暂停引用"],["8","解除决定","独立核实"],["9","关案决定","不自动解冻"]]},
          {name:"result_code｜案件决定结果",rule:"技术受理与业务决定不同。",values:[["1","已记录","待核实"],["2","通过","独立决定"],["3","退回","说明原因"]]}
        ],
        entities:[
          {name:"compliance_screening_run_tab",title:"合规筛查运行",keys:"UK screening_run_number",fields:[
            ["id / screening_run_number","BIGINT UNSIGNED / VARCHAR(40)","主键及筛查运行号"],["trade_number / trade_revision_number / party_role_code / participant_sequence_number","VARCHAR(128) / INT UNSIGNED / TINYINT UNSIGNED / SMALLINT UNSIGNED","被筛查交易版本及交易参与方角色、序号"],["subject_snapshot_hash","CHAR(64)","被筛查参与方输入快照摘要"],["screening_type_code","TINYINT UNSIGNED","制裁/PEP/负面新闻/关系筛查类型"],["provider_code / list_version","VARCHAR(32)","数据源与名单版本"],["rule_version / run_status","VARCHAR(32) / TINYINT","规则版本与运行状态"],["started_at / completed_at","DATETIME(3)","运行 UTC 时刻"],["decision_status / reviewer_reference","TINYINT / VARCHAR(64)","系统提示状态与人工复核人"],["result_hash / created_at","CHAR(64) / DATETIME(3)","结果摘要及入库时间"]],rule:"筛查运行绑定交易修订中的具体参与方快照，不引用未建模的主体主档；保存名单和规则版本以便复现。自动命中是线索，不代替合规人员决定。"},
          {name:"compliance_screening_hit_tab",title:"筛查命中与复核",keys:"UK (screening_run_number, hit_number)",fields:[
            ["id / screening_run_number / hit_number","BIGINT / VARCHAR(40) / INT","主键、运行引用及命中序号"],["provider_matched_subject_reference","VARCHAR(128)","外部筛查来源返回的匹配对象引用，不是本系统主体主档号"],["match_score / match_basis_code","DECIMAL(9,6) / TINYINT","相似度及命中依据码"],["matched_attributes_json","JSON","最小化匹配属性；敏感字段脱敏"],["hit_status","TINYINT UNSIGNED","待审/确认/误报/升级复核"],["reviewer_reference / reviewed_at","VARCHAR(64) / DATETIME(3)","复核人和 UTC 时间"],["review_reason_code / review_note","TINYINT / VARCHAR(512)","复核理由与说明"],["evidence_reference","VARCHAR(128)","外部来源/文件引用"],["created_at","DATETIME(3)","UTC 创建时间"]],rule:"权限最小化，原始名单内容和不必要个人信息不复制进入业务库。"},
          {name:"compliance_discrepancy_case_tab",title:"四流差异/暂停案件",keys:"UK case_number · IDX (case_status, severity_code)",fields:[
            ["id / case_number","BIGINT UNSIGNED / VARCHAR(40)","主键及案件号"],            ["case_type_code / severity_code","TINYINT UNSIGNED","主体/金额/单证/物流/资金差异类型与严重级别"],["owner_context_code / owner_business_number","VARCHAR(32) / VARCHAR(128)","来源域和对象业务号，完整支持128位交易号"],["trade_number / transaction_number","VARCHAR(128) / VARCHAR(40)","交易/资金事务关联号"],["scope_code","TINYINT UNSIGNED","暂停对象/范围码"],["case_status","TINYINT UNSIGNED","待分派/调查/待复核/关闭等"],["assigned_to / due_at","VARCHAR(64) / DATETIME(3)","责任人和处理期限"],["evidence_manifest_json","JSON","证据引用和版本摘要；结构见领域设计文档 §11"],["opened_at / closed_at","DATETIME(3)","开案/结案 UTC 时间"]],rule:"案件拥有暂停/解除决定；所属业务域接收事件后自行执行门禁，不被案件域直接改写。"},
          {name:"compliance_disposition_event_tab",title:"案件处置事件",keys:"UK disposition_event_number",fields:[
            ["id / disposition_event_number","BIGINT UNSIGNED / VARCHAR(40)","主键及事件业务号"],["case_number","VARCHAR(40)","差异案件引用"],["action_code / result_code","TINYINT UNSIGNED","补证/暂停/解除/升级/结案动作及结果"],["actor_reference / approver_reference","VARCHAR(64)","经办与复核身份引用"],["reason_code / decision_snapshot_json","TINYINT / JSON","理由码及决定依据快照"],["affected_contexts_json","JSON","需消费暂停/解除结果的上下文引用"],["evidence_reference","VARCHAR(128)","依据文件版本引用"],["occurred_at / created_at","DATETIME(3)","UTC 决策及入库时间"]],rule:"追加写；解除必须引用明确独立依据及必要的双人复核。"}
        ]
      },
      {
        id:"iam",layer:"governance",name:"身份与访问控制",code:"admin / IAM · 待评审细分",desc:"拥有登录身份、组织成员关系、角色/权限、数据范围、额度、有效期和职责分离；审批结论仍由发起业务上下文持有。",
        relations:["organization 1:N user_account membership","role_template 1:N grants (versioned snapshot)","user_account → trade/payment actor reference"],
        entities:[
          {name:"admin_organization_tab",title:"组织与访问边界",keys:"UK organization_code",fields:[
            ["id / organization_code","BIGINT UNSIGNED / VARCHAR(40)","主键与组织业务码"],["organization_type_code","TINYINT UNSIGNED","平台/业务/合作方组织类型"],["parent_organization_code","VARCHAR(40)","上级组织业务码；应用层防循环"],["legal_party_number","VARCHAR(40)","业务主体主档引用"],["organization_status","TINYINT UNSIGNED","启用/停用状态"],["profile_snapshot_json","JSON","组织展示/联系信息快照"],["access_scope_code","TINYINT UNSIGNED","组织可访问边界类型"],["created_at / updated_at","DATETIME(3)","UTC 维护时间"]],rule:"组织作为访问边界，不直接充当交易参与方身份；供应商、贸易代理商、实际收货人、付款方、物流公司和出口报关代理等业务角色不写死在组织属性中。"},
          {name:"admin_user_account_tab",title:"登录身份与授权",keys:"UK login_name · UK person_key",fields:[
            ["id / login_name / person_key","BIGINT / VARCHAR(128) / VARCHAR(64)","主键、登录名、真实人员关联键"],["identity_provider_code / external_subject","VARCHAR(32) / VARCHAR(128)","认证来源与外部主体号；不存明文密码"],["account_status / auth_version","TINYINT / INT UNSIGNED","账号状态及撤权会话版本"],["memberships_json","JSON","组织成员、有效期与成员状态"],["grants_json","JSON","grant_id、角色版本、权限、数据范围、额度、批准及有效期"],["mfa_status / last_authenticated_at","TINYINT / DATETIME(3)","MFA状态和最近认证时刻"],["created_at / updated_at","DATETIME(3)","UTC 创建/更新时间"],["disabled_at / disabled_by","DATETIME(3) / VARCHAR(64)","停用时间及操作者引用"]],rule:"每次命令服务端重新校验当前授权；授权保存权限快照；经办/审核/执行职责分离按 person_key 识别。"},
          {name:"admin_role_template_tab",title:"角色权限模板",keys:"UK (role_code, version_number)",fields:[
            ["id / role_code / version_number","BIGINT / VARCHAR(40) / INT","主键、角色码和版本"],["role_name / role_status","VARCHAR(128) / TINYINT","展示名称和模板状态"],["permissions_json","JSON","资源:动作、允许数据范围和敏感字段权限"],["separation_constraints_json","JSON","不可同人完成的经办/审批/执行规则"],["effective_from / effective_to","DATETIME(3)","模板生效时间区间"],["content_hash","CHAR(64)","规范化权限摘要"],["approved_by / approved_at","VARCHAR(64) / DATETIME(3)","审批人和 UTC 审批时间"],["created_at","DATETIME(3)","UTC 创建时间；版本提交后不可变"]],rule:"改权限生成新版本；存量 grant 迁移须有明确批准，不因模板更新静默扩权。"}
        ]
      },
      {
        id:"system",layer:"platform",name:"系统配置与参考数据",code:"system · 现有前缀",desc:"拥有区域/时区、国家/币种/受控字典、系统参数及配置版本。银行账户、合同模板和领域业务规则由各自上下文拥有。",
        relations:["system_dictionary 1:N system_dictionary_item","system_config_record versioned by config_key + scope","business domains reference dictionary/config versions"],
        entities:[
          {name:"system_dictionary_tab",title:"字典类型",keys:"PK dictionary_type",fields:[
            ["dictionary_type","VARCHAR(64)","字典类型业务键"],["dictionary_name","VARCHAR(128)","显示名称"],["dictionary_status","TINYINT UNSIGNED","启用状态"],["owner_context_code","VARCHAR(32)","拥有该码表的业务上下文"],["schema_version","INT UNSIGNED","字典结构版本"],["remark","VARCHAR(256)","用途及维护约束"],["created_at / updated_at","DATETIME(3)","UTC 维护时间"]],rule:"码值定义归使用它的领域；system承载通用参考数据，不收纳无主业务规则。"},
          {name:"system_dictionary_item_tab",title:"字典项",keys:"PK (dictionary_type, dictionary_code)",fields:[
            ["dictionary_type / dictionary_code","VARCHAR(64)","字典类型及类型内唯一编码"],["dictionary_label / dictionary_value","VARCHAR(128) / VARCHAR(64)","显示名与受控值"],["sort_order","INT","展示顺序"],["extension_info","JSON","非核心扩展属性"],["item_status","TINYINT UNSIGNED","启用/停用"],["effective_from / effective_to","DATETIME(3)","生效时间范围"],["created_at / updated_at","DATETIME(3)","UTC 维护时间"]],rule:"数据库不使用 ENUM 存状态/类型；停用码值不能改变历史业务解释。"},
          {name:"system_config_record_tab",title:"带版本的系统配置",keys:"UK (config_key, scope_key, version_number)",fields:[
            ["id / config_key / scope_key","BIGINT / VARCHAR(64) / VARCHAR(128)","主键、配置键、适用范围"],["version_number","INT UNSIGNED","配置版本号"],["payload_json","JSON","按 schema 校验的配置内容"],["schema_version / content_hash","INT / CHAR(64)","结构版本及内容摘要"],["effective_from / effective_to","DATETIME(3)","配置生效区间"],["approval_status / approved_by","TINYINT / VARCHAR(64)","审批状态与批准人"],["created_by / created_at","公共字段","版本创建信息；生效版本不可原位修改"]],rule:"只把平台级配置放入此表；汇率/费率/交易业务规则由相应业务上下文持有并冻结引用。"}
        ]
      },
      {
        id:"workflow",layer:"platform",name:"工作流与任务编排",code:"batch / workflow · 待评审边界",desc:"拥有任务定义、逐次执行记录、重试、超时、运行结果和补偿触发；业务审批/付款/申报状态仍归相应业务上下文。",
        relations:["batch_task_tab（任务定义）1:N batch_task_execute_log_tab（执行记录）","每次执行尝试追加记录；任务执行调用业务上下文的幂等命令"],
        entities:[
          {name:"batch_task_tab",title:"任务定义",keys:"UK (task_code, version_number)",fields:[
            ["id / task_code / version_number","BIGINT / VARCHAR(64) / INT","主键、任务码及定义版本"],["task_name / task_type_code","VARCHAR(128) / TINYINT","任务名与定时/事件/人工触发类型"],["schedule_expression / timezone","VARCHAR(128) / VARCHAR(64)","调度规则和明确时区"],["handler_code / input_schema_version","VARCHAR(64) / INT","处理器及输入结构版本"],["retry_policy_json / timeout_seconds","JSON / INT UNSIGNED","退避重试策略与超时"],["task_status","TINYINT UNSIGNED","启用/停用"],["created_at / updated_at","DATETIME(3)","UTC 维护时间"]],rule:"调度定义不保存付款审批等业务状态；变更规则产生版本。"},
          {name:"batch_task_execute_log_tab",title:"任务执行记录",keys:"UK execute_number · UK (task_code, business_key, attempt_number) · IDX (task_status, started_at)",fields:[
            ["id / execute_number","BIGINT UNSIGNED / VARCHAR(40)","主键及单次执行业务号；每次执行尝试单独记录一行"],["task_code / definition_version","VARCHAR(64) / INT UNSIGNED","任务定义及执行时使用的定义版本"],["business_key / idempotency_key / attempt_number","VARCHAR(128) / VARCHAR(128) / INT UNSIGNED","业务对象键、下游幂等键及尝试序号"],["input_snapshot_json","JSON","本次执行输入快照结构见领域设计文档 §11"],["task_status","TINYINT UNSIGNED","运行中/成功/失败/超时/取消"],["worker_reference / trace_id","VARCHAR(64)","执行节点和链路追踪标识"],["started_at / finished_at / next_retry_at","DATETIME(3)","本次尝试起止时间及计划重试时间"],["error_code / error_message / result_reference","VARCHAR(64) / VARCHAR(1024) / VARCHAR(128)","失败分类、脱敏诊断信息及业务结果引用"]],rule:"只保留任务定义和追加式执行记录，不另设任务实例或 attempt 表。重试通过同一 business_key 的新 execute_number/递增 attempt_number 追加，不覆盖失败记录；任务最终成功仍不等于下游业务成功。"}
        ]
      },
      {
        id:"notification",layer:"platform",name:"通知与待办投递",code:"message · 现有前缀，职责待评审",desc:"拥有通知模板版本、收件人解析快照和投递/失败/重试回执；不拥有审批任务或业务待办的完成状态。",
        relations:["message_template 1:N notification_delivery","notification_delivery 1:N notification_attempt","business context emits notification request"],
        entities:[
          {name:"message_template_tab",title:"通知模板",keys:"UK (template_code, version_number, locale_code)",fields:[
            ["id / template_code / version_number","BIGINT / VARCHAR(64) / INT","主键、模板码及版本"],["locale_code / channel_code","VARCHAR(16) / TINYINT","语言地区及站内/邮件/短信渠道"],["subject_template / body_template","VARCHAR(512) / TEXT","模板内容；变量需白名单化"],["variable_schema_json","JSON","允许的变量及类型"],["template_status","TINYINT UNSIGNED","草稿/启用/停用"],["effective_from / effective_to","DATETIME(3)","生效区间"],["content_hash / approved_by","CHAR(64) / VARCHAR(64)","模板摘要及批准人"],["created_at","DATETIME(3)","UTC 创建时间"]],rule:"通知内容避免放敏感身份和账户信息；模板变更生成新版本。"},
          {name:"message_notification_delivery_tab",title:"通知投递单",keys:"UK delivery_number · UK idempotency_key",fields:[
            ["id / delivery_number","BIGINT UNSIGNED / VARCHAR(40)","主键及投递业务号"],["template_code / template_version","VARCHAR(64) / INT","模板确定版本"],["recipient_reference / recipient_snapshot","VARCHAR(128) / JSON","收件人引用及最小化解析快照"],["channel_code / locale_code","TINYINT / VARCHAR(16)","投递渠道和地区语言"],["business_reference / event_id","VARCHAR(128)","来源业务号和事件幂等标识"],["delivery_status","TINYINT UNSIGNED","待投递/已发送/失败/送达/未知"],["idempotency_key / content_hash","VARCHAR(128) / CHAR(64)","投递幂等键与渲染内容摘要"],["scheduled_at / sent_at / acknowledged_at","DATETIME(3)","计划、发送、回执 UTC 时刻"],["created_at","DATETIME(3)","UTC 创建时间"]],rule:"成功投递不代表用户已阅读/完成业务动作；审批业务状态由所属域持有。"},
          {name:"message_delivery_attempt_tab",title:"投递尝试",keys:"UK (delivery_number, attempt_number)",fields:[
            ["id / delivery_number / attempt_number","BIGINT / VARCHAR(40) / INT","主键、投递引用及尝试号"],["provider_code / provider_message_number","VARCHAR(32) / VARCHAR(128)","服务商及其消息号"],["attempt_status","TINYINT UNSIGNED","已请求/已接受/失败/送达/未知"],["requested_at / completed_at","DATETIME(3)","UTC 尝试时间"],["failure_code / failure_reason","VARCHAR(64) / VARCHAR(256)","失败原因与受控分类"],["retry_after_at","DATETIME(3)","下一次重试时间"],["provider_response_hash","CHAR(64)","回执摘要"],["created_at","DATETIME(3)","UTC 落库时间"]],rule:"记录技术投递失败和重试，不覆盖通知单初始收件人/内容版本。"}
        ]
      },
      {
        id:"audit",layer:"platform",name:"独立审计",code:"admin · 现有前缀",desc:"追加记录登录、授权变更、敏感操作、导出、配置修改及操作结果；审计日志不替代交易事件、审批记录、资金流水或技术运行日志。",
        relations:["audit events are append-only","audit target references business identifiers without foreign keys","trace_id correlates domain and integration events"],
        entities:[
          {name:"admin_audit_log_tab",title:"安全与业务操作审计",keys:"PK id · IDX (target_type, target_number) · IDX trace_id",fields:[
            ["id / trace_id","BIGINT UNSIGNED / VARCHAR(64)","主键与链路追踪标识"],["actor_type / actor_reference / actor_role_snapshot","TINYINT / VARCHAR(64) / VARCHAR(128)","人工/系统来源、操作者引用和权限快照"],["action_code / target_context_code","VARCHAR(64) / VARCHAR(32)","动作码及目标领域"],["target_type / target_number","VARCHAR(64) / VARCHAR(128)","业务对象类型和稳定业务编号"],["before_data / after_data","JSON","脱敏后的变更摘要；非完整敏感数据"],["client_ip / source_device_reference","VARCHAR(64)","来源网络/设备标识"],["operation_result / error_code","TINYINT / VARCHAR(64)","成功/拒绝/失败/未知及错误分类"],["occurred_at / created_at","DATETIME(3)","操作发生与 UTC 落库时间"]],rule:"变化字段可由前后快照比较得出，不单独冗余保存；追加写，应用数据库账号无 UPDATE/DELETE 权限。审计快照必须脱敏，审计不可替代领域历史。"},
          {name:"admin_security_event_tab",title:"安全事件",keys:"UK security_event_number",fields:[
            ["id / security_event_number","BIGINT UNSIGNED / VARCHAR(40)","主键及事件业务号"],["event_type_code / severity_code","TINYINT UNSIGNED","认证失败/越权/密钥异常/数据导出等分类"],["actor_reference / organization_code","VARCHAR(64)","操作者及组织引用"],["source_ip / device_fingerprint_hash","VARCHAR(64) / CHAR(64)","来源信息及设备指纹摘要"],["target_reference","VARCHAR(128)","受影响资源业务引用"],["event_status / response_action_code","TINYINT UNSIGNED","新建/调查/关闭及处置动作"],["detected_at / resolved_at","DATETIME(3)","检测和关闭 UTC 时间"],["evidence_reference","VARCHAR(128)","安全证据引用"],["created_at","DATETIME(3)","UTC 落库时间"]],rule:"仅保存调查所需的数据，不在审计/安全日志复制访问令牌、完整账号或证件号。"}
        ]
      },
      {
        id:"reporting",layer:"platform",name:"经营报表与只读投影",code:"reporting · 待评审",desc:"拥有指标定义、跨域只读投影刷新水位、聚合快照和导出任务；任何修正都回到权威业务上下文，报表模型不可作为写入源。",
        relations:["metric_definition 1:N report_snapshot","report_snapshot 1:N report_export_job","domain events feed read-only projections"],
        entities:[
          {name:"report_metric_definition_tab",title:"指标定义",keys:"UK (metric_code, version_number)",fields:[
            ["id / metric_code / version_number","BIGINT / VARCHAR(64) / INT","主键、指标码及定义版本"],["metric_name / metric_group_code","VARCHAR(128) / VARCHAR(32)","指标名称和分组"],["formula_reference / unit_code","VARCHAR(256) / VARCHAR(32)","受控公式实现引用及单位"],["currency_scope_code / date_basis_code","TINYINT","币种及发生日/会计日等口径"],["source_contexts_json","JSON","数据源上下文和字段来源"],["access_policy_code","VARCHAR(64)","权限/脱敏规则引用"],["effective_from / effective_to","DATETIME(3)","定义有效区间"],["approved_by / approved_at","VARCHAR(64) / DATETIME(3)","批准人及 UTC 时间"],["created_at","DATETIME(3)","UTC 创建时间"]],rule:"指标必须说明统计粒度、币种、时点、排除规则和版本；不能将状态投影误称权威。"},
          {name:"report_snapshot_tab",title:"报表刷新快照",keys:"UK (metric_code, scope_key, snapshot_at)",fields:[
            ["id / snapshot_number","BIGINT UNSIGNED / VARCHAR(40)","主键及快照号"],["metric_code / metric_version","VARCHAR(64) / INT","指标定义确定版本"],["scope_key / filter_hash","VARCHAR(128) / CHAR(64)","权限范围和过滤条件摘要"],["snapshot_at / refreshed_at","DATETIME(3)","统计时点与实际刷新 UTC 时间"],["data_watermark_json","JSON","各来源域已消费事件水位"],["result_payload","JSON","聚合值；金额以十进制字符串存储"],["currency_code / business_date_from / business_date_to","CHAR(3) / DATE / DATE","币种与日期范围"],["source_hash","CHAR(64)","输入数据/规则摘要"],["created_at","DATETIME(3)","UTC 创建时间"]],rule:"投影延迟需可见；不可据此更新交易、资金或账务权威状态。"},
          {name:"report_export_job_tab",title:"报表导出任务",keys:"UK export_number · UK idempotency_key",fields:[
            ["id / export_number","BIGINT UNSIGNED / VARCHAR(40)","主键与导出业务号"],["idempotency_key","VARCHAR(128)","同一申请重试去重键"],["requester_reference / role_snapshot","VARCHAR(64) / JSON","申请人及授权快照"],["metric_code / snapshot_number","VARCHAR(64) / VARCHAR(40)","导出指标及冻结快照引用"],["filter_snapshot_json","JSON","查询范围和字段集合快照"],["export_status","TINYINT UNSIGNED","待审批/生成中/完成/失败/过期"],["approval_reference","VARCHAR(64)","敏感导出审批引用"],["file_reference / file_hash","VARCHAR(128) / CHAR(64)","受控导出文件引用及摘要"],["expires_at / downloaded_at","DATETIME(3)","过期和下载时间"],["created_at","DATETIME(3)","UTC 创建时间"]],rule:"导出权限独立于查看权限；文件访问受限并按合规策略过期清理。"}
        ]
      }
    ];
    const relationModels = {
      trade:[["trade_record_tab","trade_participater_tab","1:N","交易主档包含参与方资料"],["trade_record_tab","trade_revision_tab","1:N","提交、批准和更正时保存完整快照"],["trade_record_tab","trade_event_tab","1:N","业务状态及过程事件"]],
      contract:[["contract_record_tab","contract_revision_tab","1:N","版本冻结参与方、有效期及审签；主记录无独立可写状态"],["document_file_tab","contract_revision_tab","1:N","审核正文/签署件各自引用不可变文件"],["trade_record_tab","contract_record_tab","1:N · 跨域","默认每交易每用途一签"],["contract_revision_tab","trade / payment evidence","1:N · 跨域","公共协议仅按明确范围/期间显式引用签署版本"]],
      logistics:[["logistics_shipment_tab","logistics_shipment_item_tab","1:N","出运批次分配交易商品行"],["logistics_shipment_tab","logistics_transport_leg_tab","1:N","一个批次包含多个运输区段"],["logistics_shipment_tab","logistics_event_tab","1:N","一个批次产生多个履约事件"],["trade_record_tab","logistics_shipment_tab","1:N · 跨域","批次引用交易号和交易修订"]],
      customs:[["customs_declaration_tab","customs_declaration_revision_tab","1:N","不可变完整表头、主体、商品及材料版"],["customs_declaration_tab","customs_filing_request_tab","1:N","办理意图及未知查单，不代替官方事实"],["customs_declaration_tab","customs_declaration_item_tab","1:N","申报版本包含商品申报行"],["customs_declaration_tab","customs_event_tab","1:N","提交、受理、查验、放行及更正回执"],["logistics_shipment_tab","customs_declaration_tab","1:N · 跨域","申报关联出运批次"],["trade_record_tab","customs_declaration_tab","1:N · 跨域","申报关联交易及冻结修订"]],
      tax:[["tax_case_tab","tax_submission_tab","1:N","案件下每次提交/补正形成独立版本"],["tax_case_tab","tax_event_tab","1:N","保存机关处理及到账核对事件"],["payment_fund_flow_tab","tax_event_tab","1:N · 跨域","仅实际到账事件可确认退税入账"]],
      payment:[["payment_bank_account_tab","payment_fund_flow_tab","1:N","事件引用当时配置；去重跨版本按稳定银行身份"],["payment_fund_flow_tab","payment_fund_allocation_tab","1:N","一实收多毛额分配"],["trade_record_tab","payment_fund_allocation_tab","1:N · 跨域","分配绑定批准修订"],["payment_transaction_tab","payment_fund_flow_tab","1:N","单据执行及计提产生追加事件"],["payment_fund_flow_tab / payment_transaction_tab","account_voucher_tab","1:N · 跨域","来源类型/号+记账阶段反查凭证，不回填流水"],["payment_reconcile_difference_tab","payment_fund_flow_tab","N:0..1","缺失流水仍可创建差异"]],
      account:[["account_tab","account_ledger_entry_tab","1:N","账户余额由不可变分录重建/校验"],["account_voucher_tab","account_ledger_entry_tab","1:N","每张凭证由多条分录组成"],["payment_transaction_tab","account_voucher_tab","1:N · 跨域","业务记账请求以来源类型/业务号引用"]],
      compliance:[["compliance_screening_run_tab","compliance_screening_hit_tab","1:N","一次筛查运行产生多个命中"],["compliance_discrepancy_case_tab","compliance_disposition_event_tab","1:N","案件处置决定追加为事件"],["trade_record_tab","compliance_screening_run_tab","1:N · 跨域","筛查锁定交易修订和参与方序号"],["compliance_discrepancy_case_tab","trade / payment / customs","N:1 · 跨域","案件引用受影响业务对象"]],
      iam:[["admin_organization_tab","admin_user_account_tab.memberships_json","1:N","成员关系记录组织归属及有效期"],["admin_role_template_tab","admin_user_account_tab.grants_json","1:N","授权快照绑定角色版本"],["admin_user_account_tab","业务审计/事件","1:N · 跨域","业务动作引用当前操作者身份"]],
      system:[["system_dictionary_tab","system_dictionary_item_tab","1:N","字典类型拥有字典项"],["system_config_record_tab","system_config_record_tab","1:N","同一配置键/范围按版本演进"],["system_dictionary_item_tab","业务上下文","1:N · 跨域","业务字段引用已发布码值"]],
      workflow:[["batch_task_tab","batch_task_execute_log_tab","1:N","定义版本下每次运行/重试追加执行记录"],["batch_task_execute_log_tab","下游业务命令","1:N · 跨域","使用业务键和幂等键调用业务域"]],
      notification:[["message_template_tab","message_notification_delivery_tab","1:N","投递冻结模板、版本、渠道和语言"],["message_notification_delivery_tab","message_delivery_attempt_tab","1:N","每次外部尝试单独留痕"],["业务上下文事件","message_notification_delivery_tab","1:N · 跨域","通知不拥有业务待办状态"]],
      audit:[["admin_audit_log_tab","业务对象引用","N:1 · 逻辑","审计按稳定业务号定位目标，不建外键"],["admin_security_event_tab","admin_audit_log_tab","1:N · 逻辑","安全调查可关联多条操作审计"],["trace_id","交易/资金/外部事件","1:N · 跨域","追踪标识串联事件，不改变权威归属"]],
      reporting:[["report_metric_definition_tab","report_snapshot_tab","1:N","指标定义版本生成只读快照"],["report_snapshot_tab","report_export_job_tab","1:N","导出冻结指标版本和快照"],["领域事件/只读视图","report_snapshot_tab","N:1 · 跨域","水位记录消费进度，不写回业务状态"]]
    };
    const eventDef = (name, meaning, payload, key, source = "本域经授权命令处理器；跨域命令记录来源上下文") => ({
      name,
      meaning,
      source,
      payload,
      key,
      schemaVersion: "v1"
    });
    const machine = (title, states, events, guards, transitions, exceptions) => ({
      title,
      states: states.map((state, index) => state.length === 1 || ["success", "exception"].includes(state[1]) ? [`S${index + 1}`, state[0], state[1]] : state),
      events, guards, transitions, exceptions
    });
    const stateMachines = {
      trade:[machine("交易生命周期（暂停为正交门禁）",[
        ["2","编辑中"],["3","待补充"],["4","待运营汇总"],["5","待终审"],["8","已批准"],["9","已终止"],["10","已结案","success"]
      ],[
        eventDef("TradeCreated","创建直接持久化编辑态；失败无交易行","trade_number, payload_hmac, actor","trade_number"),
        eventDef("FilingStarted","首次打开只留事件","trade_number, role, actor","event_number"),
        eventDef("ParticipantSubmitted","提交本方资料","revision, role, sequence, file_refs","request_number"),
        eventDef("ConsolidationSubmitted","提交运营汇总","revision, submitted_roles","event_number"),
        eventDef("InformationRequested","运营要求补充","missing_item_number, stage, owner, fields, reason","event_number"),
        eventDef("SupplementStarted","开始补充，不要求已有批准版","revision, missing_item_numbers","event_number"),
        eventDef("OperationsConsolidated","运营汇总核对完成","revision, checked_fields, reviewer","event_number"),
        eventDef("FinalReviewSubmitted","冻结送审快照","revision, snapshot_number","trade + revision"),
        eventDef("FinalReviewReturned","终审退回并保审核结果","revision, review_result, owner, reason","event_number"),
        eventDef("TradeApproved","批准审阅版本及快照","revision, snapshot_number, reviewer","trade + revision"),
        eventDef("CorrectionOpened","批准后新修订，旧版不改","approved_revision, new_revision, invalidated_refs","trade + new_revision"),
        eventDef("TradeHeld","追加门禁，不改变生命周期","case_number, scope, reason","case + event"),
        eventDef("TradeResumed","解除指定案件，其他门禁不变","case_number, reviewer, evidence_refs","case + event"),
        eventDef("SimilarTradeDetected","相近提示不自动阻断或合并","candidate_numbers, matched_fields, rule_version, time_window","event_number"),
        eventDef("SimilarTradeReviewed","人工核对不自动合并或终止","candidate_numbers, result, rule_version, evidence_refs","event_number"),
        eventDef("TradeTerminated","授权终止并写原因1撤销/2拒绝/3重复","reason_code, actor, evidence_refs, candidate_numbers","event_number"),
        eventDef("TradeClosed","根锁后重验全部对象及源版本向量，正常结案","closure_application_number, report_event_number, source_version_vector, reviewer_reference","event_number")
      ],[
        ["G1","身份/对象/字段授权及请求幂等通过"],
        ["G2","本阶段必需资料和来源齐备；允许运输暂缺只在允许阶段有效"],
        ["G3","待补责任、字段/材料和原因完整"],
        ["G4","运营核对完整；送审/批准须有本修订汇总完成事件（可同命令提交），快照/参与方/文件一致，重送审递增修订"],
        ["G5","终审与经办分离，审阅快照一致且所有适用门禁已解除"],
        ["G6","指定案件有授权解除依据；解除后重新评估剩余门禁"],
        ["G7","确有已批准版本；新修订和下游失效清单明确"],
        ["G8","相近业务只提示，人工结论可追溯"],
        ["G9","具备终止授权；理由/证据完整；已批准履约中的业务不得用撤销掩盖义务"],
        ["G10","必需合同/物流/关务/资金/账务/税务最终事实、全部对象集合、源版本向量及资金账务勾稽通过，无未知/暂停；独立审核，本版无特殊结案"]
      ],[
        ["编辑中","FilingStarted","G1","编辑中"],["编辑中","ParticipantSubmitted","G1","编辑中"],
        ["编辑中","ConsolidationSubmitted","G1+G2","待运营汇总"],
        ["编辑中/待运营汇总","InformationRequested","G1+G3","待补充"],
        ["待补充","SupplementStarted","G1+G3","编辑中"],
        ["待运营汇总","OperationsConsolidated","G1+G4","待运营汇总"],
        ["待运营汇总","FinalReviewSubmitted","G1+G4","待终审"],
        ["待终审","FinalReviewReturned","G1+G3","待补充"],
        ["待终审","TradeApproved","G1+G2+G4+G5","已批准"],
        ["已批准","CorrectionOpened","G1+G7","编辑中"],
        ["编辑中/待补充/待运营汇总/待终审/已批准","TradeHeld","G1","状态不变；追加暂停门禁"],
        ["编辑中/待补充/待运营汇总/待终审/已批准","TradeResumed","G1+G6","状态不变；重新评估门禁"],
        ["编辑中/待补充/待运营汇总/待终审/已批准","SimilarTradeDetected","G1+G8","状态不变；仅提示事件"],
        ["编辑中/待补充/待运营汇总/待终审/已批准","SimilarTradeReviewed","G1+G8","状态不变；仅核对事件"],
        ["编辑中/待补充/待运营汇总/待终审","TradeTerminated","G1+G9","已终止"],
        ["已批准","TradeClosed","G1+G10","已结案"]
      ],[])],
      contract:[machine("合同版本审签（与文件资格独立）",[
        ["1","编辑中"],["2","待审核"],["3","待补充"],["4","待签署"],["5","已签署"],["6","已生效"],["7","已被替代"],["8","已终止"]
      ],[
        eventDef("ContractSubmitted","冻结本版正文及适用范围","contract_number, revision, review_file, trade_snapshot, parties","contract + revision"),
        eventDef("ContractReviewPassed","审核通过待签","revision, reviewer, rule_version, reviewed_at","event_number"),
        eventDef("ContractReviewReturned","退回；修改另建版本","revision, reviewer, reason","event_number"),
        eventDef("ContractSigned","最终签署件与审阅正文一致或差异已复核","revision, signed_file, signer_evidence, signed_at","event_number"),
        eventDef("ContractActivated","必要签署及生效条件齐备","revision, effective_at, conditions","event_number"),
        eventDef("ContractSuperseded","正式新版本生效后法律替代","old_revision, new_revision, evidence_refs","event_number"),
        eventDef("ContractTerminated","作废/拒绝/期限届满或正式终止","revision, reason_code, legal_evidence","event_number")
      ],[
        ["C1","逐单绑定批准交易快照；公共协议主体/用途/有效期明确"],
        ["C2","审核正文最终确认、扫描通过且字节不可变"],
        ["C3","有权独立审核人；结论/理由/规则及版本冻结"],
        ["C4","必要签署方齐全、最终签署件可验证且与批准正文一致"],
        ["C5","生效条件满足；公共协议在明确有效期内，逐单不自动豁免"],
        ["C6","正式替代/终止授权及依据完整；已签/生效不得按未签作废"]
      ],[
        ["编辑中","ContractSubmitted","C1+C2","待审核"],
        ["待审核","ContractReviewPassed","C3","待签署"],
        ["待审核","ContractReviewReturned","C3","待补充"],
        ["待签署","ContractSigned","C4","已签署"],
        ["已签署","ContractActivated","C1+C4+C5","已生效"],
        ["已生效","ContractSuperseded","C6","已被替代"],
        ["编辑中/待审核/待补充/待签署/已签署/已生效","ContractTerminated","C6","已终止"]
      ],[]), machine("文件可引用资格",[
        ["1","编辑中"],["2","最终确认"],["3","已被替代"]
      ],[
        eventDef("FileFinalized","仅确认文件资格，不自动审核合同","file_number, revision, sha256, actor","file + revision"),
        eventDef("FileSuperseded","保旧文件/历史引用，另有正式新版本","old_file, new_file, reason","event_number")
      ],[
        ["F1","扫描/摘要/格式校验通过，确认人有该用途权限"],
        ["F2","替代版本已最终确认；旧版不可删除/改字节"]
      ],[
        ["编辑中","FileFinalized","F1","最终确认"],["最终确认","FileSuperseded","F2","已被替代"]
      ],[])],
      logistics:[machine("出运批次履约",[
        ["计划中"],["已订舱"],["已提货待发运"],["运输中"],["已到达"],["已签收","success"],["异常处理中"],["取消","exception"],["履约失败","exception"]
      ],[
        eventDef("ShipmentPlanned","创建绑定交易批准修订的出运批次","shipment_number, trade_number, revision, items","shipment_number"),
        eventDef("BookingConfirmed","承运方确认订舱/运输区段","shipment_number, leg, carrier_participant, booking_ref","carrier booking reference"),
        eventDef("PickupConfirmed","确认已提货并记录发生时点","shipment_number, occurred_at, evidence_ref","provider event key"),
        eventDef("DepartureConfirmed","确认实际离境/启运","shipment_number, leg, occurred_at, location","provider event key"),
        eventDef("ArrivalConfirmed","确认到达目的口岸/目的地","shipment_number, leg, occurred_at, location","provider event key"),
        eventDef("DeliveryConfirmed","收货方确认签收","shipment_number, consignee_role, signed_at, evidence_ref","delivery proof reference"),
        eventDef("LogisticsExceptionRaised","登记延误/货损/失联等异常","event_type, severity, occurred_at, evidence_ref","provider event key"),
        eventDef("ExceptionResolved","核实异常处理结果","shipment_number, resolution, reviewer, evidence_ref","event_number")
      ],[
        ["L1","批次商品累计数量/金额不超过批准交易商品行；币种一致"],
        ["L2","承运主体是交易快照中有效物流公司且订舱引用唯一"],
        ["L3","外部回执验签、去重通过；发生时间与区段顺序合理"],
        ["L4","签收人/收货主体有权且签收证据已固化"],
        ["L5","异常处置有责任人、解决依据及必要复核"]
      ],[
        ["计划中","BookingConfirmed","L1+L2","已订舱"],["已订舱","PickupConfirmed","L3","已提货待发运"],["已提货待发运","DepartureConfirmed","L3且出境正式放行","运输中"],["运输中","ArrivalConfirmed","L3且末段到达","已到达"],["已到达","DeliveryConfirmed","L4","已签收"],["已订舱/已提货待发运/运输中/已到达","LogisticsExceptionRaised","L3","异常处理中"],["异常处理中","ExceptionResolved","L5且全部异常已闭环","恢复原履约阶段，签收须另核实"],["计划中/已订舱","用户取消","授权且未实际提货且无未知执行；已订舱须确认撤销","取消"]
      ],[
        ["任一未完成状态","重复/伪造回执","L3 不满足","保持原履约阶段","隔离回执并建立异常案件；技术拒绝不改变真实货物终态"],
        ["异常处理中","货物灭失或合同取消","责任/保险/业务审批完成","履约失败","保存最终证据并通知交易、合规域"]
      ])],
      customs:[machine("出口报关申报",[
        ["1","草稿"],["2","待草稿审核"],["3","待供应商确认"],["4","已确认"],["5","已提交"],["6","已受理"],["7","查验中"],["8","已放行","success"],["9","待补正"],["10","正式退单","exception"],["11","已撤回","exception"]
      ],[
        eventDef("DeclarationPrepared","建立申报修订及商品行","declaration_number, revision, trade_revision, shipment_number","declaration + revision"),
        eventDef("DraftSubmitted","提交本版供独立审核","declaration_revision, content_hash","event_number"),
        eventDef("DraftApproved","独立审核批准本版，不等于供应商确认","declaration_revision, reviewer, content_hash","event_number"),
        eventDef("ExporterConfirmed","供应商对确切最终版书面确认","declaration_revision, supplier_participant, written_confirmation_ref","declaration revision"),
        eventDef("DeclarationSubmitted","申报通道接受提交请求","declaration_revision, channel, request_ref, content_hash","channel + request_ref"),
        eventDef("DeclarationAccepted","收到监管机关受理回执","external_event_key, authority_number, occurred_at","channel + external event key"),
        eventDef("InspectionStarted","监管机关通知查验","external_event_key, inspection_ref, occurred_at","external event key"),
        eventDef("DeclarationReleased","收到放行回执","external_event_key, declaration_number, released_at","external event key"),
        eventDef("CorrectionRequired","收到补正/退单原因","external_event_key, reason_code, evidence_ref","external event key"),
        eventDef("CorrectionSubmitted","以新修订重报","new_revision, supersedes_revision, content_hash","declaration + revision"),
        eventDef("DeclarationWithdrawn","依法/经授权撤回未完成申报","reason, actor, authority_ref","event_number")
      ],[
        ["K1","申报商品/金额/币种与批准交易及出运批次相符"],
        ["K2","出口方/报关代理参与方在对应交易修订存在且授权有效"],
        ["K3","独立审核与供应商书面确认绑定相同不可变修订/摘要；任何补正须重审重确认"],
        ["K4","正式来源/外部事件键/机关申报号核实；数字验签和人工验真不混淆"],
        ["K5","更正使用递增新修订并引用被替代修订"]
      ],[
        ["草稿","DraftSubmitted","K1+K2","待草稿审核"],["待草稿审核","DraftApproved","K1+K2+独立审核","待供应商确认"],["待供应商确认","ExporterConfirmed","K3","已确认"],["已确认","DeclarationSubmitted","K3+K4且正式提交证据","已提交"],["已提交","DeclarationAccepted","K4","已受理"],["已受理","InspectionStarted","K4","查验中"],["已受理","DeclarationReleased","K4","已放行"],["查验中","DeclarationReleased","K4","已放行"],["已提交/已受理/查验中","CorrectionRequired","K4","待补正"],["待补正/正式退单","CorrectionSubmitted","K5","草稿"],["草稿/已确认","DeclarationWithdrawn","有权撤回且监管允许/已提交需正式依据","已撤回"]
      ],[
        ["任一提交态","回执验签/幂等冲突","K4 不满足","保持原申报阶段","隔离原报文、告警并人工核验；技术失败不冒称海关退单"],
        ["已提交","监管明确拒绝且不可补正","机关终局拒绝回执","正式退单","保留终局回执；重新申报必须新建修订或申报号"],
        ["已确认","办理超时或返回未知","未证实明确未提交","保持已确认且办理执行未知","保原办理号查单；不盲目重发、不重复占量"]
      ])],
      tax:[machine("证明与退税分型案件协同",[
        ["1","准备中"],["2","待内部审核"],["3","待正式提交"],["4","已提交"],["5","已受理"],["6","补正中"],["7","处理中"],["8","正式处理完成待核对"],["9","交接或到账核对完成","success"],["10","终局拒绝","exception"],["11","已撤销","exception"]
      ],[
        eventDef("TaxCaseOpened","基于交易修订建立税务案件","tax_case_number, trade_revision, taxpayer participant","tax_case_number"),
        eventDef("SubmissionPrepared","冻结一套文件版本清单","submission_revision, manifest, package_hash","case + submission revision"),
        eventDef("SubmissionApproved","独立审核冻结完整业务内容","submission_revision, content_hash, reviewer","event_number"),
        eventDef("SubmissionSent","取得渠道提交结果","submission_revision, request_ref, submitted_at","provider request reference"),
        eventDef("SubmissionAccepted","监管机关正式受理","external_event_key, authority_ref, occurred_at","external event key"),
        eventDef("TaxProgressReceived","核实正式处理进度","submission_revision, authority_ref, evidence_refs","external event key"),
        eventDef("CorrectionRequested","记录补正要求和期限","reason_code, due_at, evidence_refs","authority ref + event key"),
        eventDef("TaxDecisionReceived","记录批准/拒绝决定及金额","result_code, amount, currency, authority_ref","external event key"),
        eventDef("RefundBankCreditRecorded","资金域确认实际银行到账","flow_number, amount, currency, value_date","bank account + bank event key"),
        eventDef("ProofReceived","供应商独立接收并核对通过已核实正式证明","submission_revision, certificate_event_number, delivery_reference, receipt_outcome_code, supplier","event_number")
      ],[
        ["T1","纳税人可解析到批准交易修订；正式申请职责/范围/规则已确认，准备不等于具备正式申请资格"],
        ["T2","提交清单中的所有文件均为最终确认版本，摘要匹配"],
        ["T3","可信正式来源、原办理、确切资料版/外部事件键和机关引用核实；不将内部审核当机关结果"],
        ["T4","到账只能由资金域已记账银行入账流水证实，金额/币种核对"],
        ["T5","证明须已签发/核实/出口代理交付/供应商独立收到且核对通过(结果2)，仅收件1或异议3不完成；退税须真实资金核对，本案件完成不自动结案交易"]
      ],[
        ["准备中","SubmissionPrepared","T2","待内部审核"],["待内部审核","SubmissionApproved","独立审核确切完整内容","待正式提交"],["待正式提交","SubmissionSent","T1+T2+T3","已提交"],["已提交","SubmissionAccepted","T3","已受理"],["已受理/处理中","CorrectionRequested","T3","补正中"],["补正中","SubmissionPrepared","T2+新资料版","待内部审核"],["已受理","TaxProgressReceived","T3","处理中"],["已受理/处理中","TaxDecisionReceived","T3+正式签发或批准","正式处理完成待核对"],["正式处理完成待核对","RefundBankCreditRecorded","类型2+T4+T5","交接或到账核对完成"],["正式处理完成待核对","ProofReceived","类型1+T5","交接或到账核对完成"]
      ],[
        ["待正式提交/已提交","渠道超时或结果未知","未取得可验证终态回执","保持原阶段及执行未知","按原办理号查单，不换号重发"],
        ["已提交/已受理/处理中","监管终局拒绝","T3有效终局回执","终局拒绝","不自动交易结案，不默认启用重申或救济"],
        ["任一非终态","缺职责/范围/正式证据","T1或T3不满足","保持原阶段","允许补料，不生成特殊结案或虚假到账"]
      ])],
      payment:[machine("A货款付款 / 正式退款（类型5、7）",[
        ["1","草稿"],["2","待审批"],["3","待补充"],["4","已批准"],["5","执行中"],
        ["6","已完成","success"],["7","已拒绝"],["8","已取消"],["9","已被替代"]
      ],[
        eventDef("PaymentReviewSubmitted","冻结金额/来源/账户配置及分支门禁","transaction_number, execution_basis, request_hash","request_number"),
        eventDef("PaymentReturned","有权审核退回","reason, reviewer, evidence_refs","event_number"),
        eventDef("PaymentApproved","独立批准；不等同银行成功","approved_snapshot, actor","event_number"),
        eventDef("PaymentSubmitted","锁额确定成功后提交同一银行请求","request_number, lock_flow_number, amount, accounts","provider request key"),
        eventDef("BankResultUnknown","超时只记未知，保持执行中/锁额","request_number, checked_at, error","request + check","银行适配器/受控查单任务"),
        eventDef("BankDebitConfirmed","确认真实扣款，追加流水/记账命令","bank_event_key, amount, value_date","fingerprint + bank key","银行回执入口，先验签和去重"),
        eventDef("PayeeReceiptConfirmed","核验收款证据/双边结果，不按名称推定银行来源","payee, amount, evidence_refs","event_number","授权财务核验入口；银行回执须验签"),
        eventDef("PaymentCompleted","到账/双边证据及必需凭证齐备才完成","bank_refs, receipt_refs, voucher_refs","event_number"),
        eventDef("PaymentRejected","审批拒绝或银行明确未执行失败","reason, evidence_refs, unlock_flow","event_number"),
        eventDef("PaymentCancelled","证明未受理且已解锁","evidence_refs, unlock_flow","event_number"),
        eventDef("PaymentSuperseded","未执行单由新号替代","new_transaction_number, reason","event_number"),
        eventDef("ReconciliationCompleted","只追加对账事实，不覆盖原执行结果","bank_refs, flow_refs, voucher_refs, result","event_number")
      ],[
        ["P1","仅CNY；适用时批准交易快照/HMAC一致，未匹配实收退款以原实收/正式授权为依据；所有适用门禁可确认且未暂停"],
        ["P2","银行配置版本核验通过、启用且仍在有效期间；不能自动换账户"],
        ["P3","D货款三桶及分配锁定；首次获批分账时固定300元从D可用余额转列服务费，不降低A合同应付"],
        ["P4","经办/审批/执行分离；类型5按预付/出口后合同、F及关务门禁，类型7按正式退款程序；类型3服务费结算仅从D已核验可用余额记账，不登记虚构银行收款"],
        ["P5","银行请求幂等且锁额确定成功；未知不换请求号、不解锁"],
        ["P6","银行事实验签/去重及金额受益人匹配；外部未知不能定失败"],
        ["P7","A货款付款有到账确认，D服务费在首次分账时有唯一结算事件及平衡凭证，退款有正式程序；必需凭证成功"],
        ["P8","有拒绝/取消/替代授权，银行确认未受理或明确未执行；锁额已安全释放"],
        ["P9","对账覆盖银行、三桶、凭证；差异单独处置不改原事实"],
        ["P10","有权独立审核人，退回原因及待补责任完整，不要求缺失材料已补齐"]
      ],[
        ["草稿","PaymentReviewSubmitted","P1+P2+P3","待审批"],
        ["待审批","PaymentReturned","P10","待补充"],
        ["待审批","PaymentApproved","P1+P2+P3+P4","已批准"],
        ["已批准","PaymentSubmitted","P1+P2+P3+P4+P5","执行中"],
        ["执行中","BankResultUnknown","P5","执行中"],
        ["执行中","BankDebitConfirmed","P6","执行中"],
        ["执行中","PayeeReceiptConfirmed","P6","执行中"],
        ["执行中","PaymentCompleted","P6+P7","已完成"],
        ["草稿/待审批/待补充/已批准/执行中","PaymentRejected","P8","已拒绝"],
        ["草稿/待审批/待补充/已批准/执行中","PaymentCancelled","P8","已取消"],
        ["草稿/待审批/待补充/已批准","PaymentSuperseded","P8","已被替代"],
        ["执行中/已完成","ReconciliationCompleted","P9","状态不变；对账结果另记"]
      ],[]),
      ...[
        ["INVOICE（类型1）","InvoiceSubmitted","InvoiceConfirmed","正式申报回执绑定本次付款发票版本；补件/改版不重计费"],
        ["贸易核验（类型2）","VerificationSubmitted","VerificationConfirmed","银行核验范围/金额有正式证据；不推定实际入账或可用"],
        ["代理服务费结算（类型3）","ServiceFeeSettlementSubmitted","ServiceFeeSettled","首次获批分账时按trade幂等从D已核验可用余额结算固定300元；不减少A合同应付"],
        ["结算（类型4）","SettlementSubmitted","SettlementConfirmed","批准总额/已付/待付一致；服务费不作为A合同应付扣项"]
      ].map(([title, submitted, completed, completionRule]) => machine(title,[
        ["1","草稿"],["2","待审批"],["3","待补充"],["4","已批准"],["5","执行中"],
        ["6","已完成","success"],["7","已拒绝"],["8","已取消"],["9","已被替代"]
      ],[
        eventDef(submitted,"提交并冻结本类型载荷","transaction_number, basis, request_hash","request_number"),
        eventDef("ReviewPassed","独立审核通过","reviewer, evidence_refs","event_number"),
        eventDef("ReviewReturned","退回待补，修改需新单","reason, reviewer","event_number"),
        eventDef("ExecutionStarted","按类型执行，不自动发送银行付款","basis, source_refs","event_number"),
        ...(title.startsWith("代理服务费") ? [
          eventDef("ServiceFeeSettled","首次获批分账时从已核验可用余额转列固定300元，由D承担","trade_number, allocation_numbers, available_balance, authorization_refs","trade_number + agency_service_fee")
        ] : []),
        eventDef(completed,completionRule,"result_refs, amount, actor","event_number","所属业务核验入口；外部证据必须验签/核对"),
        eventDef("TransactionRejected","明确拒绝","reason, evidence_refs","event_number"),
        eventDef("TransactionCancelled","有权取消且无未清占用/外部执行","reason, evidence_refs","event_number"),
        eventDef("TransactionSuperseded","明确新号替代","reason, replacement_number","event_number")
      ],[
        ["T1","类型匹配且仅CNY，来源及用途明确，适用时绑定批准交易版；服务费结算需关联trade、首次获批分账、核验可用余额及D承担授权；提交后载荷冻结"],
        ["T2","有权独立审核，必要材料完整，所有适用门禁通过"],
        ["T3",completionRule],
        ["T4","无未清外部执行/占用，有终止授权和原因；已记账服务费只能以独立冲正事件更正，沿用原trade唯一键，不得重复结算"],
        ["T5","有权独立审核退回，原因/待补责任完整"]
      ],[
        ["草稿",submitted,"T1","待审批"],["待审批","ReviewPassed","T1+T2","已批准"],
        ["待审批","ReviewReturned","T5","待补充"],["已批准","ExecutionStarted","T2","执行中"],
        ["执行中",completed,"T3","已完成"],
        ...(title.startsWith("费用") ? [
          ["已批准/执行中","FeeAssessed","T1+T2","执行中"],
          ["执行中","FeeWhollyWaived","T6","已完成"]
        ] : []),
        ["草稿/待审批/待补充/已批准/执行中","TransactionRejected","T4","已拒绝"],
        ["草稿/待审批/待补充/已批准","TransactionCancelled","T4","已取消"],
        ["草稿/待审批/待补充/已批准","TransactionSuperseded","T4","已被替代"]
      ],[]))],
      account:[machine("凭证持久化生命周期（账户门禁另管）",[
        ["1","记账中"],["2","已记账"],["3","已冲正"],["4","失败"]
      ],[
        eventDef("PostingRequested","接收唯一命令并创建/恢复占位","source_type, source_number, stage, hash","idempotency_key"),
        eventDef("VoucherPosted","凭证/分录/余额原子成功","voucher_number, lines, balance_after","idempotency_key"),
        eventDef("PostingFailed","失败单独留痕，不留部分分录","reason, trace_id","idempotency_key"),
        eventDef("PostingRetried","失败请求同键同文受控恢复","hash, recovery_reason","idempotency_key"),
        eventDef("ReversalRequested","申请反向命令，原凭证仍已记账","original_voucher, approval_refs","reversal request"),
        eventDef("VoucherReversed","完整反向凭证成功后标原凭证冲正","original_voucher, reversal_voucher","original + reversal"),
        eventDef("LedgerMismatchDetected","停用受影响账户/建差异，不改原凭证事实","account_ids, expected, actual, evidence","event_number","独立账务对账任务")
      ],[
        ["A1","仅CNY；正数分录同会计日/期间，借方单边合计=贷方合计"],
        ["A2","账户启用、科目有效、期间开放；控制账户/分配三桶守卫满足"],
        ["A3","先固定资金范围锁序，再按account_id升序加锁；全部分录/余额同事务"],
        ["A4","命令唯一键及摘要一致；同键异文冲突；失败同键重试前确认未提交"],
        ["A5","整张冲正授权/期间通过，未有成功反向凭证；原分录纯追加不可改"],
        ["A6","独立对账核实后停用账户，后续有权复核才能解除运行门禁"]
      ],[
        ["记账中","VoucherPosted","A1+A2+A3+A4","已记账"],
        ["记账中","PostingFailed","A4","失败"],
        ["失败","PostingRetried","A2+A4","记账中"],
        ["已记账","ReversalRequested","A5","已记账"],
        ["已记账","VoucherReversed","A1+A2+A3+A4+A5","已冲正"],
        ["记账中/已记账/已冲正/失败","LedgerMismatchDetected","A6","状态不变；账户停用并开差异"]
      ],[])],
      compliance:[machine("筛查命中与差异案件处置",[
        ["待筛查"],["筛查中"],["待人工复核"],["调查中"],["待复核"],["已排除","success"],["已确认风险","exception"],["业务暂停"],["解除待确认"],["已关闭","success"],["筛查失败","exception"]
      ],[
        eventDef("ScreeningStarted","锁定输入主体快照、名单及规则版本","run_number, trade_revision, participant, provider, list_version","run_number"),
        eventDef("ScreeningHitRecorded","保存最小必要命中属性","hit_number, score, basis, masked_attributes","run + hit number"),
        eventDef("FalsePositiveConfirmed","人工确认误报并记录依据","reviewer, reason_code, evidence_refs","run + hit + review"),
        eventDef("RiskConfirmed","人工确认命中需限制业务","reviewer, decision, case_number, evidence_refs","case + decision event"),
        eventDef("BusinessHoldIssued","向所属业务域发布暂停决定","affected_contexts, scope, action, case_number","case + action"),
        eventDef("ReleaseRequested","提交解除暂停申请","case_number, reason, new_evidence","case + request"),
        eventDef("ReleaseApproved","独立复核确认解除条件满足","approver, evidence_refs, decided_at","case + decision event"),
        eventDef("CaseClosureRequested","实质处置后单独申请关案，不改变暂停原因集合","case_number, substantive_dispositions, source_version_vector","case + request"),
        eventDef("CaseClosed","记录最终处置结论及审计引用","case_number, result, reviewer, closed_at","case + event number")
      ],[
        ["C1","名单、提供方、筛查规则与参与方快照版本固定"],
        ["C2","命中复核人有权限且不违反职责分离"],
        ["C3","命中确认必须有事实依据，机器分数不等于法定结论"],
        ["C4","暂停/解除命令由受影响域确认接收，不直接改写其业务状态"],
        ["C5","解除依据新证据齐备且审批人与原决定人分离"],
        ["C6","案件实质处置及资金差异已核实，独立关案；暂停须另有精确解除及各目标applied，关案不代替解冻"]
      ],[
        ["待筛查","ScreeningStarted","C1","筛查中"],["筛查中","ScreeningHitRecorded","C1","待人工复核"],["筛查中","无命中且运行成功","C1","已排除"],["待人工复核","FalsePositiveConfirmed","C2","已排除"],["待人工复核","RiskConfirmed","C2+C3","已确认风险"],["已确认风险","BusinessHoldIssued","C4","业务暂停"],["业务暂停","ReleaseRequested","true","解除待确认"],["解除待确认","ReleaseApproved","C5+各目标applied","调查中"],["调查中","CaseClosureRequested","实质处置证据齐备","待复核"],["待复核/已排除","CaseClosed","C6","已关闭"]
      ],[
        ["筛查中","提供方超时/数据不可验证","可重试且预算未耗尽","筛查失败","保留输入和错误摘要；重跑用新运行号，旧运行不覆盖"],
        ["已确认风险","证据不足或无法依法处置","缺实质处置依据","保持原阶段及有效暂停","保留责任待办，不以未知结果关案；解除须另有合法决定及目标应用确认"],
        ["业务暂停","解除复核拒绝","C5 不满足","业务暂停","继续维持门禁，记录拒绝理由和后续行动"]
      ])],
      iam:[machine("登录身份、授权和角色模板",[
        ["待邀请"],["待激活"],["启用"],["临时锁定"],["停用","exception"],["待授权审批"],["授权生效","success"],["授权撤销","exception"]
      ],[
        eventDef("IdentityInvited","管理员创建受限邀请","user_reference, org, expiry, inviter","invite id"),
        eventDef("IdentityActivated","身份提供方验证并完成MFA激活","external_subject, mfa_status, activated_at","identity provider subject"),
        eventDef("AuthenticationSucceeded","通过身份验证和风险校验","user, session, auth_version, mfa","provider assertion id"),
        eventDef("AuthenticationFailed","认证失败计数或风险事件","user, source_ip, failure_code","security event id"),
        eventDef("GrantRequested","申请角色/数据范围/敏感字段授权","grant_id, role_version, scope, approver","grant id + version"),
        eventDef("GrantApproved","独立审批人批准冻结授权快照","grant_id, permissions, scope, expiry, approver","grant id + version"),
        eventDef("GrantRevoked","撤销授权并递增会话版本","grant_id, actor, reason, auth_version","grant id + event"),
        eventDef("RoleVersionPublished","发布不可变角色模板版本","role_code, version, permissions_hash, approver","role code + version")
      ],[
        ["I1","身份提供方断言有效、MFA满足策略且账号未停用"],
        ["I2","授权范围不得超越审批者权限/组织边界"],
        ["I3","授权审批人独立于申请人并满足职责分离"],
        ["I4","角色版本已批准、生效，权限摘要与快照一致"],
        ["I5","每条业务命令重新校验当前权限、资源归属、敏感字段权限和auth_version"],
        ["I6","撤销对会话/令牌及时生效；不得仅依赖登录时角色快照"]
      ],[
        ["待邀请","IdentityInvited","管理员具备用户管理权限","待激活"],["待激活","IdentityActivated","I1","启用"],["启用","AuthenticationSucceeded","I1+I5","启用"],["启用","AuthenticationFailed","策略达到阈值","临时锁定"],["临时锁定","AuthenticationSucceeded","等待期结束且I1","启用"],["待授权审批","GrantApproved","I2+I3+I4","授权生效"],["授权生效","GrantRevoked","I6","授权撤销"],["启用/临时锁定","管理员停用","具有管理员授权","停用"],["任一模板草案","RoleVersionPublished","I3+I4","新角色版本生效"]
      ],[
        ["任一登录/授权操作","身份断言伪造或高危越权","安全策略命中","停用/授权撤销","立即失效令牌、记录安全事件并要求独立恢复审批"],
        ["待授权审批","审批拒绝/超时","无有效批准","授权撤销（未生效）","拒绝授权并保留申请/审批审计"]
      ])],
      system:[machine("系统配置与字典发布",[
        ["草稿"],["待审核"],["已批准待生效"],["已生效","success"],["已替代"],["已停用"],["审批拒绝","exception"],["版本校验失败","exception"]
      ],[
        eventDef("ConfigVersionCreated","创建新的配置键/范围版本","config_key, scope, version, schema_version, payload_hash","key + scope + version"),
        eventDef("ConfigSubmitted","提交配置和变更说明审核","version, change_reason, owner","config key + version"),
        eventDef("ConfigApproved","批准配置，冻结批准人/生效时间","version, approver, effective_from, hash","config key + version"),
        eventDef("ConfigActivated","到达生效时间并通过运行时校验","version, activation_time","config key + version"),
        eventDef("ConfigSuperseded","新配置版本替代旧版本","old_version, new_version, effective_at","config key + version"),
        eventDef("DictionaryItemDisabled","停止新业务使用码值但保留历史解释","dictionary_type, code, effective_at, reason","type + code + event"),
        eventDef("ConfigRejected","审查发现业务/安全配置不合规","version, reason_code, reviewer","config key + version")
      ],[
        ["S1","配置键对应schema版本存在；payload严格校验且无未声明字段"],
        ["S2","配置所有者和审批人权限有效且职责分离"],
        ["S3","生效时间区间无冲突；关键业务参数经风险评审"],
        ["S4","已发布字典码值不改义、不复用，停用不破坏历史"],
        ["S5","激活前执行兼容性、密钥/敏感级别和运行时校验"]
      ],[
        ["草稿","ConfigSubmitted","S1+S2","待审核"],["待审核","ConfigApproved","S2+S3","已批准待生效"],["已批准待生效","ConfigActivated","S3+S5","已生效"],["已生效","ConfigSuperseded","S3","已替代"],["草稿/待审核","DictionaryItemDisabled","S4","已停用"],["待审核","ConfigRejected","true","审批拒绝"]
      ],[
        ["草稿/待审核","schema/安全验证失败","S1 或 S5 不满足","版本校验失败","不得激活；修正必须创建新版本，保留失败版本"],
        ["已生效","新版本激活验证失败","S3/S5 不满足","旧版本继续生效","回滚只切换到仍有效的旧版本，不覆盖历史"]
      ])],
      workflow:[machine("任务定义与执行尝试",[
        ["已停用"],["已启用","success"],["待执行"],["执行中"],["重试等待"],["成功","success"],["失败","exception"],["超时待查"],["已取消","exception"],["重试耗尽","exception"]
      ],[
        eventDef("TaskDefinitionPublished","发布冻结任务定义版本","task_code, version, schedule, input_schema, retry_policy","task code + version"),
        eventDef("TaskTriggered","定时/事件/人工触发执行","task_code, definition_version, business_key, input","business key + trigger id"),
        eventDef("ExecutionStarted","worker取得租约并追加执行记录","execute_number, attempt_number, worker, trace_id","execute number"),
        eventDef("ExecutionSucceeded","处理器返回确定成功并记录结果引用","execute_number, result_reference, finished_at","execute number"),
        eventDef("ExecutionFailed","处理器确定失败并分类错误","execute_number, error_code, retryable","execute number"),
        eventDef("ExecutionTimedOut","超过超时阈值且运行结果未知","execute_number, timeout, worker lease","execute number"),
        eventDef("RetryScheduled","按冻结重试策略安排新尝试","business_key, next_attempt, next_retry_at","business key + attempt"),
        eventDef("TaskCancelled","有权限取消尚未成功执行任务","business_key, reason, actor","cancel request id")
      ],[
        ["W1","任务定义版本启用、schema和处理器实现可用"],
        ["W2","同业务键相同载荷；变化载荷不得复用幂等键"],
        ["W3","当前执行租约有效且attempt_number单调递增"],
        ["W4","错误码在冻结retry_policy中被标为可重试且预算未耗尽"],
        ["W5","超时无法证明下游未执行时必须查单/幂等重试，不能当作失败"],
        ["W6","取消不会撤销已成功的业务副作用；补偿由所属域决定"]
      ],[
        ["已启用","TaskTriggered","W1+W2","待执行"],["待执行","ExecutionStarted","W3","执行中"],["执行中","ExecutionSucceeded","W3","成功"],["执行中","ExecutionFailed","W4","重试等待或失败"],["执行中","ExecutionTimedOut","W5","超时待查"],["重试等待","RetryScheduled","W4","待执行"],["超时待查","查单确认未执行","W5","重试等待"],["超时待查","查单确认已执行","W5","成功"],["待执行/重试等待","TaskCancelled","W6","已取消"],["已启用","管理员停用","无运行中的强制终止","已停用"]
      ],[
        ["执行中","worker失联且租约过期","无法确认副作用结果","超时待查","保留执行日志；先查下游业务键，不盲目新建执行"],
        ["重试等待","达到最大尝试次数","W4 不满足","重试耗尽","转人工处理/补偿队列；失败记录不可覆盖"],
        ["任一执行","输入schema/处理器版本不兼容","W1 不满足","失败","记录失败原因；修复后使用新定义版本重新触发"]
      ])],
      notification:[machine("通知模板与投递交付",[
        ["模板草稿"],["模板待审核"],["模板启用","success"],["投递待处理"],["渲染完成"],["发送中"],["服务商已接受"],["已送达","success"],["投递未知"],["重试等待"],["永久失败","exception"],["已过期","exception"],["已取消","exception"]
      ],[
        eventDef("TemplateSubmitted","冻结模板版本及变量schema","template_code, version, locale, channel, hash","template + version"),
        eventDef("TemplateApproved","批准模板并设定生效期","template_version, approver, effective_at","template + version"),
        eventDef("NotificationRequested","业务事件请求通知投递","event_id, business_reference, recipient_ref, template_version","event id + channel"),
        eventDef("NotificationRendered","按白名单变量解析并计算内容摘要","delivery_number, content_hash, recipient_snapshot","delivery number"),
        eventDef("DeliveryAttempted","向服务商提交一次投递请求","attempt_number, provider, request_ref","delivery idempotency key"),
        eventDef("ProviderAccepted","服务商返回受理回执","provider_message_number, accepted_at","provider message id"),
        eventDef("DeliveryReceiptReceived","收到送达/失败回执","provider_message_number, status, occurred_at","provider event id"),
        eventDef("DeliveryRetryScheduled","按策略安排重试","next_attempt, retry_after_at, failure_code","delivery + attempt"),
        eventDef("DeliveryCancelled","业务域/管理员取消未发送通知","delivery_number, reason, actor","delivery number")
      ],[
        ["N1","模板版本启用且变量schema通过严格校验"],
        ["N2","收件人由授权解析，快照最小化且目标渠道有效"],
        ["N3","同一通知幂等键下业务引用、模板版本和内容摘要一致"],
        ["N4","服务商受理/回执验签，且关联当前投递尝试"],
        ["N5","失败可重试且未过期、未超最大次数"],
        ["N6","投递成功不代表用户已读或业务审批完成"]
      ],[
        ["模板草稿","TemplateSubmitted","N1","模板待审核"],["模板待审核","TemplateApproved","N1","模板启用"],["投递待处理","NotificationRendered","N1+N2+N3","渲染完成"],["渲染完成","DeliveryAttempted","N2+N3","发送中"],["发送中","ProviderAccepted","N4","服务商已接受"],["服务商已接受","DeliveryReceiptReceived","N4","已送达或永久失败"],["发送中","渠道超时","无确定回执","投递未知"],["投递未知","DeliveryRetryScheduled","先查单且N5","重试等待"],["投递未知","查单已接受","N4","服务商已接受"],["重试等待","DeliveryAttempted","N5","发送中"],["投递待处理/重试等待","DeliveryCancelled","尚未受理","已取消"]
      ],[
        ["任一投递状态","收件人/模板/变量非法","N1/N2 不满足","永久失败","记录安全最小错误；不得发送未授权内容"],
        ["发送中/投递未知","服务商无法确认结果","N4 未满足","投递未知","按原幂等键查询；不生成不同内容的重复通知"],
        ["重试等待","重试预算耗尽或过期","N5 不满足","永久失败/已过期","生成运营告警；业务结果仍由所属域判定"]
      ])],
      audit:[machine("安全事件调查与处置（操作审计本身只追加）",[
        ["新发现"],["待分级"],["调查中"],["处置待复核"],["已缓解"],["已关闭","success"],["误报已关闭","success"],["重大安全事件升级","exception"]
      ],[
        eventDef("SecurityEventDetected","接收认证/越权/密钥/导出风险告警","event_number, actor, source, target, severity","security event number"),
        eventDef("IncidentTriaged","安全人员分级并分配责任人","severity, owner, due_at, classification","event + triage version"),
        eventDef("EvidenceCollected","追加调查证据引用和时间线","evidence_ref, digest, collected_at, collector","event + evidence number"),
        eventDef("ContainmentApplied","执行会话撤销/账号暂停/访问封锁","action, target, approver, applied_at","event + action"),
        eventDef("IncidentReviewed","独立复核调查结论和处置完整性","reviewer, result, evidence_refs","event + review"),
        eventDef("IncidentResolved","记录最终原因、影响范围和恢复措施","resolution, impact, resolved_at","event number"),
        eventDef("AuditRecordAppended","追加记录业务敏感操作结果","actor, action, target, before_after_masked, result","trace id + action event")
      ],[
        ["AU1","事件来源可信且事件标识唯一；审计日志只追加不可更改"],
        ["AU2","调查访问受最小权限和字段脱敏控制"],
        ["AU3","遏制动作有授权且不直接篡改业务权威记录"],
        ["AU4","关闭结论有独立复核、影响范围和处置证据"],
        ["AU5","审计内容不得含完整账号、证件号、凭证/令牌或密钥"]
      ],[
        ["新发现","IncidentTriaged","AU1+AU2","调查中"],["待分级","IncidentTriaged","AU2","调查中"],["调查中","EvidenceCollected","AU2","调查中"],["调查中","ContainmentApplied","AU3","处置待复核"],["处置待复核","IncidentReviewed","AU4","已缓解或重大安全事件升级"],["已缓解","IncidentResolved","AU4","已关闭"],["调查中","确认误报","AU4","误报已关闭"],["任一状态","AuditRecordAppended","AU1+AU5","追加审计记录；不改变业务状态"]
      ],[
        ["调查中","发生凭证/密钥泄露或持续越权","严重度达到升级阈值","重大安全事件升级","立即启动独立应急响应、保全证据并通知责任负责人"],
        ["任一审计写入","审计存储不可用/完整性校验失败","不可保证追加完整","审计故障阻断/告警","按关键操作策略拒绝或隔离操作；不能静默跳过审计"]
      ])],
      reporting:[machine("指标发布、快照刷新与导出",[
        ["指标草稿"],["指标待审核"],["指标已发布","success"],["快照待刷新"],["刷新中"],["快照可用","success"],["导出待审批"],["导出生成中"],["导出可下载","success"],["导出已过期"],["刷新失败","exception"],["导出失败","exception"],["导出拒绝","exception"]
      ],[
        eventDef("MetricSubmitted","提交指标口径、字段来源和版本","metric_code, version, formula, scopes, owner","metric + version"),
        eventDef("MetricApproved","独立审核批准统计口径","metric_version, approver, effective_at","metric + version"),
        eventDef("RefreshStarted","按来源水位启动只读投影刷新","metric_version, scope, watermark","metric + scope + run"),
        eventDef("SnapshotPublished","完整刷新成功并冻结水位/结果","snapshot_number, source_watermarks, hash","snapshot number"),
        eventDef("ExportRequested","请求限定指标/范围/字段导出","requester, role_snapshot, filters, range","request idempotency key"),
        eventDef("ExportApproved","敏感导出审批并冻结授权快照","approver, scope, fields, expiry","export number + version"),
        eventDef("ExportGenerated","生成受控文件及摘要","snapshot_number, file_ref, file_hash, expires_at","export number"),
        eventDef("ExportDownloaded","下载时再次校验当前权限","actor, downloaded_at, authorization_version","export + actor + download event")
      ],[
        ["R1","指标公式/单位/币种/时点/排除规则及来源schema完整"],
        ["R2","审批者独立且指标版本在统计期间有效"],
        ["R3","所有源域水位连续可验证；不混用未对齐会计期间"],
        ["R4","申请字段/过滤器在已发布schema允许范围内"],
        ["R5","导出授权在请求时和下载时分别校验，敏感导出已审批"],
        ["R6","文件摘要、权限范围和到期策略固定；只读结果不写回来源域"]
      ],[
        ["指标草稿","MetricSubmitted","R1","指标待审核"],["指标待审核","MetricApproved","R2","指标已发布"],["指标已发布","RefreshStarted","R3","刷新中"],["刷新中","SnapshotPublished","R3+R6","快照可用"],["快照可用","ExportRequested","R4+R5","导出待审批"],["导出待审批","ExportApproved","R5","导出生成中"],["导出生成中","ExportGenerated","R6","导出可下载"],["导出可下载","ExportDownloaded","R5+R6","导出可下载"],["导出可下载","到期清理","达到expires_at","导出已过期"]
      ],[
        ["刷新中","源域水位缺口/口径校验失败","R3 不满足","刷新失败","不发布部分结果；记录失败水位，补齐后新运行"],
        ["导出待审批","敏感数据审批拒绝","R5 不满足","导出拒绝","不生成临时文件；保留拒绝审计"],
        ["导出生成中","文件校验/存储失败","R6 不满足","导出失败","清理未完成临时对象并记录失败，不返回成功链接"]
      ])]
    };
    const reviewedDomains = new Set(["trade", "contract", "payment", "account"]);
    Object.entries(stateMachines).forEach(([domainId, models]) => models.forEach(model => {
      if (reviewedDomains.has(domainId)) {
        const labels = new Set(model.states.map(([, label]) => label));
        const events = new Set(model.events.map(event => event.name));
        const guards = new Set(model.guards.map(([code]) => code));
        for (const [from, event, guard, to] of [...model.transitions, ...model.exceptions]) {
          if (!from.split("/").every(label => labels.has(label)) || (!to.startsWith("状态不变") && !labels.has(to))) throw new Error(`${domainId}: 未定义状态 ${from} -> ${to}`);
          if (!events.has(event) || !guard.split("+").every(code => guards.has(code))) throw new Error(`${domainId}: 未定义事件/Guard ${event} / ${guard}`);
        }
        return;
      }
      const eventNames = new Set(model.events.map(event => event.name));
      const referencedEventNames = [...model.transitions.map(([, name]) => name), ...model.exceptions.map(([, name]) => name)];
      for (const name of referencedEventNames) {
        if (eventNames.has(name)) continue;
        model.events.push(eventDef(
          name,
          `条件/异常触发事件：${name}。由服务端基于权威事实判定后产生；客户端不得直接设置目标状态。`,
          "aggregate_number, event_id, occurred_at, actor/system, reason_code, evidence_reference（适用时）",
          "aggregate_number + event_id；外部回执另加 source_event_key"
        ));
        eventNames.add(name);
      }
      const guardIds = new Set(model.guards.map(([code]) => code));
      const guardDefinitions = new Set(model.guards.map(([, definition]) => definition));
      const derivedGuardCodes = new Map(model.guards.map(([code, definition]) => [definition, code]));
      const usedGuards = [...model.transitions.map(([, , guard]) => guard), ...model.exceptions.map(([, , guard]) => guard)];
      for (const definition of usedGuards) {
        if (definition === "true" || /^[A-Z]\d+(\+[A-Z]\d+)*$/.test(definition) || guardDefinitions.has(definition)) continue;
        let codeNumber = model.guards.length + 1;
        while (guardIds.has(`G${codeNumber}`)) codeNumber++;
        const code = `G${codeNumber}`;
        model.guards.push([code, definition]);
        guardIds.add(code);
        guardDefinitions.add(definition);
        derivedGuardCodes.set(definition, code);
      }
      model.transitions = model.transitions.map(([from, name, guard, to]) => [from, name, derivedGuardCodes.get(guard) || guard, to]);
      model.exceptions = model.exceptions.map(([from, name, guard, to, handling]) => [from, name, derivedGuardCodes.get(guard) || guard, to, handling]);
      const stateLabels = new Set(model.states.map(([, label]) => label));
      let exceptionNumber = model.states.filter(([code]) => code.startsWith("X")).length + 1;
      for (const [, , , target] of model.exceptions) {
        if (stateLabels.has(target)) continue;
        while (model.states.some(([code]) => code === `X${exceptionNumber}`)) exceptionNumber++;
        model.states.push([`X${exceptionNumber}`, target, "exception"]);
        stateLabels.add(target);
        exceptionNumber++;
      }
    }));

    function freeze(value){
      if(value && typeof value === 'object' && !Object.isFrozen(value)){
        Object.values(value).forEach(freeze);Object.freeze(value);
      }
      return value;
    }
    const api=freeze({domains,relationModels,stateMachines});
    root.EXPORT_DOMAIN_MODEL=api;
    if(typeof module!=='undefined')module.exports=api;
})(globalThis);
