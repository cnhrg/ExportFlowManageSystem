'use strict';
(function(root){
  const machine=(id,name,record,initial,states,transitions,notes)=>({id,name,record,initial,states,transitions,notes});
  const domains=[
    {id:'process',name:'主流程对齐',machines:[
      machine('orchestration','交易主状态','trade_record / trade_snapshot / operation_log','draft',{
        draft:'建档草稿',reviewing:'建档待终审',correction:'建档补正',active:'在途：四流子状态并行',hold:'交易级暂停',closing:'待四流结案复核',closed:'已结案',amending:'结案后更正'
      },[
        ['draft','reviewing','提交建档','A与D资料齐备，规则检查完成；版本及原件已归档','A / D填报，B运营汇总','N01','固定提交版本；创建独立终审任务'],
        ['reviewing','correction','终审驳回','逐项记录不通过依据','独立审核员','N01','保留原版本及驳回理由，不生成正式交易单'],
        ['correction','reviewing','补正重提','生成新版本，规则重新检查，禁止复用旧批准','经办 → 独立审核员','N01','追加版本和新审核任务'],
        ['reviewing','active','终审通过并建单','当前版本通过；文件就绪；正式交易号、批准快照和事件关联提交成功','独立审核员 / 系统','N01','原子生成trade_record.trade_no并绑定批准快照；按依赖激活N02、N03、N11等节点'],
        ['active','active','并行子流程推进','每个节点分别满足依赖、当前版本证据及该节点条件','A / B / E / F及独立审核员','N02—N21','分别更新物流、报关、资金和退税状态，不以单一status替代四流状态'],
        ['active','hold','交易级异常暂停','存在需要阻断全交易的风险；局部问题仅暂停受影响节点','异常责任人 / 独立审核员','N23','保存暂停范围、原因、版本和受影响依赖；不撤销已发生银行事实'],
        ['hold','active','独立解除暂停','根因纠正、上游最新版本通过、独立解冻；相关下游逐级重审','独立审核员','N23','只恢复可办理资格，不恢复旧批准；保留更正及解冻事件'],
        ['active','closing','发起结案复核','N10、N14、N17、N21均具备有效完成依据，异常与余额已解释','B运营 / 系统检查','N22','生成四流证据和版本快照；尚未结案'],
        ['closing','active','结案退回','证据不足、差异未解决或材料变更','独立审核员','N22 / N23','恢复受影响待办并保留退回原因'],
        ['closing','closed','人工结案通过','四流匹配、全部必备证据及异常闭环；垫资和尾款无未解释余额；退税结果归档','独立审核员','N22','冻结结案快照，保留资金对账及最终税务结果'],
        ['closed','amending','获准结案后更正','正式更正申请、原因和审批齐备','授权经办 / 独立审核员','N23','新增更正链；已结案快照及历史银行事实不改写'],
        ['amending','closing','更正完成申请复核','受影响节点重新审核，正式渠道更正及新证据齐备','经办 / 独立审核员','N23 → N22','新版本再次结案复核']
      ],['主状态是四流进度的汇总，不表示物流、资金、报关与税务按一条直线串行；节点依赖以本页N01—N23映射表为准。','预付 / 出口后付款为互斥分支。N17只接受选中分支的N15或N16批准；N22必须等待N10、N14、N17、N21汇合。','退税不适用或无法办理必须记录已确认的最终结果和依据，不能直接跳过N21 / N22；无正式依据不认定结案。']),
      machine('node','节点审核与失效','trade_record.node_states_json / operation_log / trade_snapshot（完整前后记录及审批事件）','blocked',{
        blocked:'前置未满足',ready:'可办理',reviewing:'当前版待审核',rejected:'驳回补正',passed:'本版本已通过',invalidated:'批准失效',hold:'暂停待纠正'
      },[
        ['blocked','ready','依赖满足','适用前置节点的当前版本有效，分支匹配','系统','N01—N23','开放当前节点待办，不自动批准'],
        ['ready','reviewing','经办提交','材料版本、适用规则和申请人快照固定，资料校验完成','各节点经办','N01—N23','创建逐项审核任务'],
        ['reviewing','rejected','驳回','任一必需项未通过或存在未解决问题','独立审核员','N01—N23','追加审核结论及补正原因'],
        ['rejected','reviewing','新版本重提','补正完成，最新上游依赖仍有效','经办','N01—N23','新审核版本，不覆盖原结论'],
        ['reviewing','passed','记录通过','所有适用材料及节点条件通过；审批与经办分离；需外部结果的节点须取得正式结果','独立审核员','N01—N23','写入当前版本结论；资金执行仍须资金域独立门禁'],
        ['passed','invalidated','上游或本节点版本变更','追踪版本依赖；受影响批准逐级失效','系统','N23','追加失效事件，保留原批准历史及已发生业务事实'],
        ['invalidated','blocked','重新校验依赖','最新版本前置未通过','系统','N23','等待逐级重新送审'],
        ['invalidated','ready','前置重新有效','最新上游版本全部通过','系统','N23','仅恢复办理，不自动恢复批准'],
        ['ready','hold','异常暂停','记录暂停范围、责任人与原因','经办 / 审核员','N23','暂停受影响节点'],
        ['reviewing','hold','审核中异常','证据冲突或需外部核实','独立审核员','N23','冻结本轮推进'],
        ['passed','hold','通过后发现异常','发生新的风险或更正要求','独立审核员','N23','当前批准不再用于新执行；外部终态保持历史事实'],
        ['hold','blocked','独立解冻并重审','根因纠正并留痕；重新校验最新上游依赖','独立审核员','N23','从依赖检查重走，禁止直接恢复passed']
      ],['passed是当前版本的节点审核结论，不能替代银行实收、海关放行或税务结果。','表格仅描述通用审核外壳；各业务状态机决定外部动作可否执行。补正、重复回执及超时不得绕过审批。'])
    ]},
    {id:'trade',name:'交易档案与文件',machines:[
      machine('contract','合同版本与签署','trade_record.workflow_json / trade_snapshot / file_record / operation_log','draft',{
        draft:'待审核草稿',approved:'当前版已批准',signing:'双方签署中',submitted:'签署渠道已提交',unknown:'渠道结果未知',effective:'正式签署生效',rejected:'退回修订'
      },[
        ['draft','approved','独立审核通过','模板、条款、真实双方、费用、账户和付款分支核对一致','独立审核员','N02 / N03 / N04','锁定内容摘要和审核版本'],
        ['approved','signing','开始授权签署','签署人有权用章；签署内容与批准版本相同','授权签署人','N02 / N03 / N04','保存逐方授权及签署证据'],
        ['signing','submitted','提交签署服务','所需双方动作完整，提交幂等键未使用','授权经办','N02 / N03 / N04','保存请求号，尚不认定生效'],
        ['submitted','unknown','超时未确认','尚无确定渠道结果','系统','N02 / N03 / N04','保留请求，查原单，不新建重复签署'],
        ['submitted','effective','核实生效','正式签署证据有效且生效条件满足','渠道 / 人工核验','N02 / N03 / N04','归档生效文件；节点还需对应业务门禁审核'],
        ['unknown','effective','查询取得正式成功','原请求匹配、签署证据完整','渠道 / 人工核验','N02 / N03 / N04','幂等落存正式结果'],
        ['submitted','rejected','正式退回','确定失败或退回回执','渠道','N02 / N03 / N04','保留原请求及拒绝原因'],
        ['unknown','rejected','查单确认退回','取得原请求确定失败证据','渠道','N02 / N03 / N04','解除处理中限制'],
        ['rejected','draft','修订新版本','保留原版，撤销旧批准和签署适用性','经办','N23','重新审核及授权签署'],
        ['approved','draft','批准后修改','未进入渠道处理中，明确作废旧确认','经办','N23','追加新版本，旧审批不继承']
      ],['线下正式签署也须收集完整证据和人工核验，不要求虚构电子签署渠道。当前电子合同原型的模拟签章 / 提交不能进入effective。','生效合同的变更使用新的补充 / 变更合同或正式解除流程；不将生效事实直接回退为草稿。N04还须核实F委托授权和预付模式的B认可。']),
      machine('customs','报关申报与放行','trade_record.workflow_json / trade_snapshot / file_record / operation_log','draft',{
        draft:'报关草稿',confirmed:'A确认当前最终版',submitted:'已提交',unknown:'提交结果未知',accepted:'正式受理',inspection:'查验中',released:'正式出口放行',rejected:'退单待修订'
      },[
        ['draft','confirmed','A书面确认','N04、N05、N06有效；N07草稿完成；B为境内发货人；授权人确认准确版本','A授权人','N07 → N08','保存版本摘要、确认人及书面证据'],
        ['confirmed','draft','确认后修改','尚未提交；经人工审核同意修改点','A / F经办','N05 / N23','新版本使A确认及相关审核失效'],
        ['confirmed','submitted','F正式申报','F委托有效，提交版本与A确认一致，幂等键未提交','F授权经办','N09','冻结请求及申报版本'],
        ['submitted','unknown','未取得确定回执','超时或网络中断','系统 / F','N09','只查原请求，禁止重复申报'],
        ['submitted','accepted','正式受理回执','官方来源、请求 / 版本匹配，事件未处理','关务渠道 / F登记','N09','保存官方编号和原始代码'],
        ['unknown','accepted','查询确认受理','取得原请求正式结果','关务渠道 / F登记','N09','幂等补录受理事实'],
        ['submitted','rejected','提交退单','收到明确退单回执','关务渠道','N09 / N23','保留退单原因，等待修订'],
        ['unknown','rejected','查单确认退单','取得明确失败或退单结果','关务渠道','N09 / N23','保留查询及回执'],
        ['accepted','inspection','查验通知','正式查验事件','关务渠道','N09','跟进查验和补件'],
        ['accepted','released','正式放行回执','官方放行证据及同版本申报匹配','关务渠道 / F','N09','归档放行；交付B附件2后才满足N09完整条件'],
        ['inspection','released','查验后正式放行','查验问题已处理，取得正式放行证据','关务渠道 / F','N09','归档放行事件'],
        ['accepted','rejected','受理后退单','取得正式退单 / 更正要求','关务渠道','N09 / N23','阻断下游放行条件'],
        ['inspection','rejected','查验退单','取得正式退单结果','关务渠道','N09 / N23','保留查验历史'],
        ['rejected','draft','获准修订','新版本及更正依据齐备','F / A','N23 → N07','重新走N07草拟与N08确认']
      ],['N09通过还要求B收到正式附件2；仅released不能自动完成N09，也不能直接触发N16付款。','迟到或乱序回执先暂存并查询权威状态，补齐事件链后重放；禁止终态倒退。放行后的更正另开正式更正业务，不覆盖原放行。']),
      machine('tax','证明与退税办理','trade_record.workflow_json / trade_snapshot / file_record / operation_log；到账引用fund_flow','preparing',{
        preparing:'证明资料准备',certificatePending:'证明已申请',certificateCorrection:'证明补正',certificateDelivered:'正式证明已交付A',reviewing:'退税材料待审批',submitted:'官方申报已提交',accepted:'已受理处理中',correction:'退税补正待审批',result:'正式处理结果已登记',received:'实际到账已核实',archived:'最终结果已归档'
      },[
        ['preparing','certificatePending','申请代理出口证明','N09有效；N18同批次资料齐备；申请职责与渠道已确认','B暂定主责，F配合','N18 → N19','登记官方申请号与提交版本'],
        ['certificatePending','certificateCorrection','官方补正通知','通知来源及申请号核实','主管税务渠道','N19 / N23','保留原材料及补正要求'],
        ['certificateCorrection','certificatePending','获批补正重提','新版本材料审核通过，通过正式渠道补正','B / F','N19 / N23','记录新版本与补正提交回执'],
        ['certificatePending','certificateDelivered','正式签发并交付','正式文件与附件2一致，A已收到并核对','税务渠道 / B / A','N20','归档正式证明及A接收证据'],
        ['certificateDelivered','reviewing','生成退税申报包','档案材料收集齐备，系统完成规则检查','系统 / 授权经办','N21','创建当前版本独立审核任务'],
        ['reviewing','submitted','批准后正式申报','人工批准当前版本，申报人具备资格和正式渠道授权','独立审核员 / 授权经办','N21','保存批准版本与官方提交回执'],
        ['submitted','accepted','官方受理','正式受理回执对应本次申报','税务渠道','N21','受理不等于批准或到账'],
        ['submitted','correction','提交退回补正','正式退回或补正通知','税务渠道','N21 / N23','形成补正版本待办'],
        ['accepted','correction','处理期间补正','正式补正要求、责任人与期限明确','税务渠道','N21 / N23','记录原申报及补正关联'],
        ['correction','submitted','补正审批后再提交','新版本经人工审核，正式渠道提交','授权经办','N21','保留每轮补正证据，不能跳过审核'],
        ['accepted','result','取得正式处理结果','官方最终结果和金额已核实','税务渠道 / 经办','N21','区分批准、有依据的不适用及拒绝等结果'],
        ['result','received','核实实际到账','有退税应收时，银行事实与对应申报匹配','财务 / A','N21','关联真实银行入账与金额'],
        ['received','archived','核对结果归档','金额差异已处理，材料齐备','授权经办 / 审核员','N21 → N22','提供结案证据'],
        ['result','archived','无应收最终处置归档','有正式不适用 / 拒绝 / 最终处置依据，影响与差异经人工确认','独立审核员','N21 → N22','保存最终依据，不伪造到账']
      ],['税务超时保持原提交 / 处理中并创建跟进任务；不得推定受理、通过或到账。','N21最终记录只是N22前置之一；还须N10、N14、N17及全部结案条件。'])
    ]},
    {id:'funds',name:'资金账户流水',machines:[
      machine('receipt','收款、分配与可用释放','fund_flow / fund_allocation / fund_order','restricted',{
        restricted:'实收全额受限',matched:'已复核分配',invoiceReview:'INVOICE待审批',invoiceApproved:'当前版INVOICE已批准',verifying:'银行核验处理中',unknown:'银行结果未知',correction:'核验退回待补正',releasable:'核验入账及可用证据齐备',released:'本分配额度已释放'
      },[
        ['restricted','matched','复核来款匹配','N01有效；银行实收唯一登记；已分配 + 未匹配差额 = 实收，未超合同额度','资金经办 / 独立复核','N11','追加fund_allocation；未匹配部分继续受限'],
        ['matched','invoiceReview','按分配生成INVOICE','仅使用已关联且未占用金额，同一交易、币种和版本','B资金经办 / 系统','N12','冻结分配明细与本次申报额度'],
        ['invoiceReview','invoiceApproved','人工批准当前版','逐笔发票、档案和水单一致；经办不可自审','独立审核员','N12','保存审批摘要及版本'],
        ['invoiceReview','matched','审批驳回','记录具体不符项，旧版本申报占用作废','独立审核员','N12 / N23','补正重建版本并复核分配'],
        ['invoiceApproved','verifying','提交贸易核验','当前批准有效；D收到相应INVOICE；正式渠道幂等提交','B资金经办','N13','记录请求与申报完成事件，完成事件才可触发对应费用'],
        ['verifying','unknown','结果超时','未获得银行确定结果','系统','N13','维持受限或锁额，查询原单'],
        ['verifying','correction','银行退回','明确退回或补件要求','银行 / B','N13 / N23','不释放资金，补件生成新审核版本'],
        ['unknown','correction','查单确认退回','取得原请求明确失败 / 退回证据','银行 / B','N13 / N23','保留完整查询和退回链'],
        ['correction','invoiceReview','提交补正版本','修改内容核验完成，重新进行独立审批','B资金经办','N12 / N13 / N23','旧批准不适用于新版本'],
        ['verifying','releasable','三项银行证据核实','贸易核验通过 + 实际国内入账 + 可用确认；金额 / 分配 / 合同累计一致','银行 / 独立对账','N13','记录可释放额度，未成功部分继续受限'],
        ['unknown','releasable','查单取得完整结果','原请求结果及三项独立证据全部核实','银行 / 独立对账','N13','补齐证据后允许一次释放'],
        ['releasable','released','幂等释放记账','锁定分配余额；事件未处理；本次释放不超成功额度','系统','N13','追加fund_flow的release事件、更新额度投影并写operation_log；费用占用不重复扣减']
      ],['状态机以一笔分配 / 核验额度为单位；一笔银行实收可同时存在未匹配、待核验及已释放金额，不能把整笔实收直接标为全部可用。','CNH与国内CNY按人民币的资金位置区分；只释放银行确认成功的对应金额。N13整体通过还需所选规则版本的收益划转等条件。']),
      machine('payment','付款分支、执行与确认','fund_order / fund_order.source_lines_json / fund_flow','settling',{
        settling:'结算待核对',branchReview:'适用付款分支待审批',approved:'当前版本付款已批准',reserved:'资金已锁定',submitted:'银行指令已提交',unknown:'付款结果未知',failed:'明确失败或取消',bankSuccess:'银行付款成功',confirmed:'A确认实际到账'
      },[
        ['settling','branchReview','结算核对完成','出口后分支完成N14；预付分支独立核对金额和账户，已到账来源满足N13或V2垫资另审','B资金经办','N14 / N15 / N16','固定金额、币种、核实账户、付款模式和适用规则版本'],
        ['branchReview','approved','预付款独立批准','pre分支：N04、附件1 / 4、同一F认可、无未解决问题；V1须N13可用且足额，V2另有有效授信 / 自有资金审批','独立资金批准人','N15','记录pre批准，不能同时走post；V2不能使用CNH受限款'],
        ['branchReview','approved','出口后付款独立批准','post分支：N09、N14有效；A确认、B收到附件2、放行、匹配及净额核对齐备','独立资金批准人','N16','记录post批准，保存依赖版本及摘要'],
        ['branchReview','settling','审批驳回','任一付款条件不满足','独立资金批准人','N15 / N16 / N23','保留驳回依据，重做结算 / 补正'],
        ['approved','reserved','锁定用款','选中分支批准仍有效；账户核实；有效可用资金扣除已有占用后足额；累计不超批','系统','N17','事务锁额 + 付款资金分配 + 幂等指令 / 待发送integration_record'],
        ['reserved','submitted','执行银行付款','执行者当前授权有效；批准摘要与实际请求完全一致；幂等键不重复','授权资金执行人','N17','保存原请求号及发送证据'],
        ['reserved','failed','发送前取消','已确认尚未发送，待发送integration_record投递与取消互斥','授权人 / 系统','N17 / N23','原子取消指令并释放锁额，保留取消证据'],
        ['submitted','unknown','未取得确定结果','超时或查询处理中','系统 / 财务','N17','保持占用，禁止自动重发或自动解锁'],
        ['submitted','bankSuccess','取得银行成功','正式结果与原指令 / 金额 / 收款账户匹配','银行 / 对账人员','N17','幂等记账消费锁额，等待A收款证据'],
        ['unknown','bankSuccess','查单确认成功','原请求正式成功结果','银行 / 对账人员','N17','同一事件只记账一次'],
        ['submitted','failed','银行明确失败','原指令确定失败 / 取消，排除在途扣款','银行 / 对账人员','N17 / N23','释放未消费锁额；不得冲掉已成功银行事实'],
        ['unknown','failed','查单确认失败','取得银行明确失败 / 取消证据','银行 / 对账人员','N17 / N23','保留查询链后释放占用'],
        ['failed','settling','申请新付款','旧请求终态已核实；重新结算 / 审批新指令','B资金经办','N14—N17 / N23','新指令关联旧单，不复用旧请求内容'],
        ['bankSuccess','confirmed','A确认实际收款','A核实本笔银行入账，预付与尾款累计无重复或超付','A收款授权人','N17','保存A收款确认及对账证据，满足N17完成条件']
      ],['预付路径不要求提前完成出口放行；出口后付款必须先满足N09和N14。N15按主流程的资金来源分支判断，已到账路径另要求N13。','V1不垫资，费用由D承担且扣费后货款不足须D补足；V2垫资需独立授信、锁额与回收记录。预付成功后仍需完成出运、银行核验核对及N22汇合条件。','银行成功、A确认、节点审核通过是不同事实。任何后续版本变化都不能把已付款事实回退成未付款。']),
      machine('fee','V1费用计提与收益到账','fund_order / fund_flow','accrued',{
        accrued:'费用已计提',waiting:'待可用资金及授权',reserved:'可用资金费用预留',approved:'收益划转已批准',submitted:'收益划转已提交',unknown:'划转结果未知',failed:'明确失败',reconciling:'待双边对账',received:'B收益实际到账'
      },[
        ['accrued','waiting','登记计费事件','receipt_fee按实收本金×0.03%每receipt一次；invoice_fee按申报完成每trade计300元一次','系统','N11—N13','计费业务键唯一，保存D授权及适用费率版本'],
        ['waiting','reserved','对应资金可用','N13可用证据齐备，资金足额，D授权及银行扣划依据有效','系统 / 财务','N13 / N14','将原费用占用迁移到可用额度，不重复预留'],
        ['reserved','approved','独立批准划转','B真实收益账户核实；金额和待扣费用一致，经办审批分离','独立资金批准人','N13 / N14','固定来源、目标、金额及费用明细'],
        ['approved','submitted','提交收益划转','仅使用对应国内人民币可用资金，幂等指令','授权资金执行人','N13 / N14','保存银行请求，不能直接确认收益'],
        ['submitted','unknown','划转超时','无确定银行终态','系统','N13 / N14','保留占用并查询原指令'],
        ['submitted','reconciling','银行返回成功','原请求、金额和账号匹配','银行 / 财务','N13 / N14','等待来源扣账与收益入账双边回单'],
        ['unknown','reconciling','查单确认成功','原请求正式成功证据','银行 / 财务','N13 / N14','幂等补录成功，不重复发起扣划'],
        ['submitted','failed','明确划转失败','确定失败，无在途扣款','银行 / 财务','N13 / N14 / N23','释放执行锁额，费用应付及必要预留继续保留'],
        ['unknown','failed','查单确认失败','取得银行明确失败结果','银行 / 财务','N13 / N14 / N23','保留查询证据，不重复计提'],
        ['failed','waiting','重新申请扣取','处理失败原因后重新核对资金 / 授权','B财务','N13 / N14 / N23','新指令关联原费用，不生成第二笔费用'],
        ['reconciling','received','双边回单核清','RMB来源实际扣账与B收益实际入账逐笔匹配','独立对账人员','N13 / N14','记实际费用收取及收益到账；差异不自动抹平']
      ],['本机资金流V1的收费子状态机；主流程当前另保留按批准佣金规则的描述，必须固定选用规则版本，不将两套费率叠加。','受限资金不可直接划收益；补件、改版、重复回执及重新匹配均不重新计提。'])
    ]},
    {id:'rbac',name:'RBAC账号权限',machines:[
      machine('account','账号与成员生命周期','user_account / user_account.memberships_json / user_account.sessions_json','invited',{
        invited:'已邀请待验证',active:'账号及成员身份有效',suspended:'暂停访问',disabled:'已停用 / 离职'
      },[
        ['invited','active','身份核验完成','本人身份、组织归属和邀请有效','组织管理员 / 本人','全部节点身份前置','激活身份；仍需单独角色授予才有业务权限'],
        ['active','suspended','暂停访问','异常登录、组织临时暂停等有明确原因','授权管理员','全部节点 / N23','撤销会话、提升权限版本、阻断新操作'],
        ['suspended','active','获准恢复访问','风险解除，成员仍有效，重新认证','授权管理员 / 本人','全部节点身份前置','重新计算有效授权，不恢复已过期或撤销的grant'],
        ['active','disabled','离职或账号停用','有效管理请求及审计依据','授权管理员','全部节点身份前置','撤销会话与相关授权，历史审批人快照保留'],
        ['suspended','disabled','终止成员身份','离职或正式停用确认','授权管理员','全部节点身份前置','保留访问 / 管理历史，禁止直接登录']
      ],['全局账号停用与某一组织user_account.memberships_json停用分开处理；后者不应误删该人的其他合法组织身份。','停用不会删除历史审核或撤销已经发生的银行 / 海关事实。重新入职须走重新核验与授予流程。']),
      machine('grant','角色授予、到期与撤销','user_account.grants_json / user_account.grants_json.scope / operation_log','requested',{
        requested:'授权待审批',rejected:'授权驳回',scheduled:'已批准待生效',active:'授权生效',expired:'授权到期',revoked:'授权已撤销'
      },[
        ['requested','scheduled','独立批准授权','角色、成对数据范围、额度 / 币种和时效明确；职责冲突检查通过','授权管理员 / 批准人','全部节点身份前置','冻结授权内容与批准人'],
        ['requested','rejected','审批拒绝','超范围、冲突、证据不足或期限无效','批准人','全部节点身份前置','保存拒绝依据；修订另建请求'],
        ['scheduled','active','到达生效时间','账号及成员有效，当前时间处于授权区间','系统','全部节点身份前置','提升权限版本，重新计算权限与范围'],
        ['scheduled','revoked','生效前撤销','有权管理者撤销或成员停用','授权管理员 / 系统','全部节点身份前置','阻止后续生效'],
        ['scheduled','expired','错过有效区间','恢复调度时已经超过expires_at','系统','全部节点身份前置','不得补激活过期授权'],
        ['active','expired','授权到期','按服务端时间判定，无宽限自动延续','系统','全部节点身份前置','失效缓存，执行入口重新鉴权'],
        ['active','revoked','撤销授权 / 成员停用','有效管理请求；账号停用或职责调整','授权管理员 / 系统','全部节点身份前置','立即阻断新操作，保留旧审批授权快照']
      ],['权限只决定能否尝试动作，不能替代N01—N23业务条件。资金批准与执行时都要重新鉴权。','expired和revoked不自动恢复；续期或重新授权新建记录。Super Admin也不能绕过版本、余额和独立审批门禁。'])
    ]},
    {id:'config',name:'系统配置',machines:[
      machine('release','配置审核与发布','config_record','draft',{
        draft:'配置草稿',reviewing:'配置待审批',rejected:'驳回待修订',approved:'版本已批准',scheduled:'待定时发布',effective:'配置已生效',superseded:'已被新发布替代',cancelled:'发布已取消'
      },[
        ['draft','reviewing','提交配置审核','schema / 字典 / 流程校验通过，固定内容摘要','配置经办','全部节点规则前置','提交不可变版本，记录影响范围'],
        ['reviewing','rejected','审批驳回','内容不完整或规则冲突','独立配置批准人','全部节点规则前置','记录原因，不影响当前生效版本'],
        ['rejected','draft','修订新版本','保留原审核版本','配置经办','全部节点规则前置','新增版本及摘要，重新校验'],
        ['reviewing','approved','批准当前版本','审批人非经办人，风险和影响范围已复核','独立配置批准人','全部节点规则前置','审批固定版本及内容摘要'],
        ['approved','scheduled','设置生效时间','当前配置版本已批准；环境 / 作用域明确，生效区间无冲突','授权发布人','全部节点规则前置','在config_record宽表保存生效窗口和发布依据'],
        ['scheduled','effective','发布生效','内容摘要与批准一致；原子切换生效版本并校验组织优先级','系统 / 授权发布人','全部节点规则前置','新业务引用此config_record版本；存量继续引用原版本'],
        ['scheduled','cancelled','取消未生效发布','有权操作且发布尚未生效','授权发布人','全部节点规则前置','保留取消原因'],
        ['effective','superseded','新版本替代 / 回滚发布','替代版本已批准且生效；回滚新增版本记录','系统 / 授权发布人','全部节点规则前置','结束原生效区间，历史引用不变']
      ],['低单量按一条config_record宽表保存审批、计划生效及发布状态，批准内容和生效信息分别有字段；多项配置可人工逐项发布，不单独建立发布批次与明细表。','变更规则不会自动使历史审核失效；只有明确批准的存量迁移才重新核验受影响对象，硬性资金条件不可配置绕过。']),
      machine('external','外部请求与回执收敛','integration_record','pending',{
        pending:'请求待投递',sent:'请求已发送',unknown:'结果未知待查询',processing:'外部受理处理中',succeeded:'正式成功结果',failed:'正式失败结果',cancelled:'发送前取消'
      },[
        ['pending','sent','发送原请求','有效业务批准、当前请求摘要与幂等键匹配，渠道已授权','系统 / 授权经办','N09 / N13 / N17 / N19 / N21','记录发送与渠道请求号'],
        ['pending','cancelled','原子取消未投递请求','与发送互斥，确认尚未触发外部操作','授权经办 / 系统','N23','取消待发送integration_record待发送任务，通知所属领域'],
        ['sent','unknown','超时 / 连接中断','不能确认是否已被外部接收','系统','N09 / N13 / N17 / N19 / N21','查原单；资金或报关指令不得直接重发'],
        ['sent','processing','正式受理','签名 / 来源、请求、版本和事件ID匹配','外部渠道','N09 / N13 / N17 / N19 / N21','登记受理，不当作业务完成'],
        ['unknown','processing','查单确认受理','原请求正式处理中结果','外部渠道 / 系统','N09 / N13 / N17 / N19 / N21','保留查询链'],
        ['sent','succeeded','直接确定成功','该渠道支持确定成功回执，且业务结果字段齐备','外部渠道','N13 / N17等适用渠道','交由所属领域验证门禁后推进'],
        ['unknown','succeeded','查单确认成功','原请求成功结果、金额 / 内容匹配','外部渠道 / 系统','N09 / N13 / N17 / N19 / N21','保存事实，缺前序事件时按权威查询结果补齐证据链'],
        ['processing','succeeded','最终成功结果','正式结果经来源和业务关联核实','外部渠道','N09 / N13 / N17 / N19 / N21','幂等投递领域事件，不直接改写业务余额'],
        ['sent','failed','确定失败','收到原请求正式失败回执','外部渠道','N23','通知所属领域按规则处理锁额 / 补正'],
        ['unknown','failed','查询确认失败','有确定失败证据，无在途未决动作','外部渠道 / 系统','N23','保留查询及失败结果'],
        ['processing','failed','受理后失败','官方退单 / 拒绝结果','外部渠道','N23','修订需新批准和新请求，旧结果不覆盖']
      ],['通用传输结果不等于领域完成：报关需正式放行及交付，银行需核验 / 入账 / 可用确认，退税需最终处理与实际到账核验。','重复事件只记一次处理结果；未关联 / 验真失败 / 乱序事件暂存待核对，不能倒退已确认终态。补正是关联原业务的新请求，不是假装旧请求从终态重启。'])
    ]}
  ];
  const mapping={
    N01:['交易建档','trade_record / trade_snapshot（完整前后记录及审批事件）','终审通过且原件归档，交易主表生成正式trade_no并绑定批准快照'],
    N02:['合同签署','trade_record.workflow_json / trade_snapshot / file_record / operation_log','代理合同有效，费用、账户、付款分支书面统一'],
    N03:['物流委任','trade_record.workflow_json / trade_snapshot / file_record / trade_record.shipments_json','有效物流合同，真实委托链明确'],
    N04:['报关委任','trade_record.workflow_json / trade_snapshot / file_record','有效F授权；预付模式额外核对同一F认可'],
    N05:['单证版本','trade_record.node_states_json / trade_snapshot / file_record','单证实货一致，修改点先审批，业务固定当时文件revision路径'],
    N06:['运输计划','trade_record.shipments_json','运输批次与货物一致，运输信息补齐'],
    N07:['报关草稿','trade_record.workflow_json / trade_snapshot / file_record','单证与运输版本一致，草稿完成'],
    N08:['报关确认','trade_record.node_states_json / trade_snapshot / operation_log','A授权人确认最终版本，B列境内发货人'],
    N09:['报关结果','operation_log / file_record','真实申报、正式放行、B收到附件2三者齐备'],
    N10:['物流交付','trade_record.shipments_json / operation_log / trade_record.exceptions_json','同批次签收，货损 / 拒收 / 索赔按约处理'],
    N11:['实收匹配','fund_flow / fund_allocation','实收与总分匹配；受限款不用于付款'],
    N12:['付款INVOICE','fund_order（invoice） / source_lines_json','已关联额度，逐笔人工批准，变更重审'],
    N13:['银行核验及收益','fund_order / fund_flow','核验、入账、可用独立核实；收益按适用规则双边核对'],
    N14:['结算对账','fund_order（settlement / reconciliation）','回执、费用、应付、预付和A账户核对无重复'],
    N15:['预付批准','fund_order / trade_record.node_states_json','pre分支；N04有效，已到账或V2垫资条件满足'],
    N16:['出口后批准','fund_order / trade_record.node_states_json','post分支；N09、N14有效，附件2与放行等条件齐备'],
    N17:['付款及确认','fund_order / fund_flow','适用分支批准、银行付款与A实际收款确认'],
    N18:['证明资料','trade_record.workflow_json / file_record','N09后同批次证明资料，申请职责及渠道确认'],
    N19:['证明申请','trade_record.workflow_json / trade_snapshot / file_record / operation_log','正式申请及回执，材料、职责和时限核实'],
    N20:['证明交付','operation_log / file_record','正式签发且A已收到核对'],
    N21:['退税办理','trade_record.workflow_json / trade_snapshot / file_record / operation_log / fund_flow','审批、官方提交 / 补正、最终处理与到账证据分开留存'],
    N22:['四流结案','trade_record / trade_snapshot（完整前后记录及审批事件） / trade_record.node_states_json','四项前置汇合，异常及余额闭环，最终退税结果归档'],
    N23:['异常更正','trade_record.exceptions_json / operation_log / 各业务单approval_json','上游新版本通过、独立解冻、下游逐级重审；文件改用新revision路径须重审']
  };
  function source(item){
    return 'stateDiagram-v2\n  direction LR\n'+Object.entries(item.states).map(([id,label])=>'  state "'+label+'" as '+id).join('\n')+'\n  [*] --> '+item.initial+'\n'+item.transitions.map(row=>'  '+row[0]+' --> '+row[1]+' : '+row[2]).join('\n');
  }
  const api={domains,mapping,source};
  root.EXPORT_STATE_MODEL=api;
  if(typeof module!=='undefined')module.exports=api;
})(globalThis);
