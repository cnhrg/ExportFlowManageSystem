'use strict';
(function(root){
  const common=root.EXPORT_SYSTEM_USECASES_MODEL||(typeof require==='function'?require('./system-usecases-model.js'):null);
  const errors=common.errors;
  const endpoints=[
    ['s5-funds-overview','GetTradeFundsOverview','GET','/api/v1/trades/{trade_number}/funds','—','FundsOverview','','200','外部服务','按当前主体读取交易资金概览、受限/可用/锁额投影及待处理项；不推断银行或A到账。'],
    ['s5-receipt-read','GetFundReceipt','GET','/api/v1/fund-receipts/{receipt_flow_number}','—','FundReceipt','','200','外部服务','按原银行事实号恢复同文实收及匹配状态；未匹配仍受限。'],
    ['s5-invoice-create','CreateInvoiceDeclaration','POST','/api/v1/trades/{trade_number}/invoice-declarations','InvoiceDeclarationInput','InvoiceDeclaration','invoice','201','外部服务','B提交INVOICE材料、声明金额及确切附件；受理不代表已核验、可用或银行成功。'],
    ['s5-invoice-read','GetInvoiceDeclaration','GET','/api/v1/trades/{trade_number}/invoice-declarations/{invoice_number}','—','InvoiceDeclaration','','200','外部服务','读取原申报及独立审核/补正状态；补正关联原单，不覆盖已提交版。'],
    ['s5-fee-read','GetAgencyServiceFeeSettlement','GET','/api/v1/trades/{trade_number}/agency-service-fee','—','AgencyServiceFeeSettlement','','200','外部服务','读取首次获批分账时从D已核验可用余额结算的固定300元服务费；按trade至多一次。'],
    ['s5-allocation-context','GetFundAllocationContext','GET','/internal/v1/fund-receipts/{receipt_flow_number}/allocation-context','—','FundAllocationContext','','200','内部运营','仅内部资金运营入口；读取确切实收、未匹配额、批准交易候选及差异门禁。'],
    ['s5-allocation-create','CreateFundAllocation','POST','/internal/v1/fund-receipts/{receipt_flow_number}/allocations','FundAllocationInput','FundAllocation','allocation','201','内部运营','按交易/批准版分配实收毛额；待复核不计入可支付额。'],
    ['s5-allocation-read','GetFundAllocation','GET','/internal/v1/fund-allocations/{allocation_number}','—','FundAllocation','','200','内部运营','读取单笔分配、原始毛额、当前复核、释放与占用投影。'],
    ['s5-allocation-decision','CreateFundAllocationDecision','POST','/internal/v1/fund-allocations/{allocation_number}/decisions','FundAllocationDecisionInput','FundAllocation','decision','201','内部运营','独立复核批准/退回分配；复核人不得为创建人。'],
    ['s5-bank-evidence','CreateBankReceiptEvidence','POST','/internal/v1/bank-receipt-evidence','BankReceiptEvidenceInput','BankReceiptEvidence','evidence','201','内部运营','人工核对实际银行流水及固定版本证据后追加；没有银行接入时无外部成功回执。'],
    ['s5-review-context','GetFundsReviewContext','GET','/internal/v1/trades/{trade_number}/funds-review-context','—','FundsReviewContext','','200','内部运营','读取已提交INVOICE、合同/交易快照、真实流水、缺项、差异及独立审核分离门禁。'],
    ['s5-trade-verification','CreateTradeFundsVerification','POST','/internal/v1/trades/{trade_number}/funds-verifications','TradeFundsVerificationInput','TradeFundsVerification','verification','201','内部运营','核定申报及贸易范围；仅内部审核，不把审核意见写成银行实收或可用。'],
    ['s5-availability-release','CreateFundsAvailabilityRelease','POST','/internal/v1/trades/{trade_number}/fund-releases','FundsReleaseInput','FundsRelease','release','201','内部运营','按实际银行可用证据逐笔从受限释放；部分金额可释放，缺真实证据则拒绝。'],
    ['s5-settlement-create','CreateSettlement','POST','/internal/v1/trades/{trade_number}/settlements','SettlementInput','Settlement','settlement','201','内部运营','生成预付款或出口后结算试算；首次获批分账同时从D可用余额一次性结算300元服务费，不减少A合同应付。'],
    ['s5-settlement-read','GetSettlement','GET','/internal/v1/settlements/{transaction_number}','—','Settlement','','200','内部运营','恢复原结算单、批准版、应付/已付/待付及缺失证据。'],
    ['s5-settlement-decision','CreateSettlementDecision','POST','/internal/v1/settlements/{transaction_number}/decisions','SettlementDecisionInput','Settlement','decision','201','内部运营','独立批准或退回；预付/出口后按各自证据清单闭合，不允许授信/垫资。'],
    ['s5-payment-approval','CreatePaymentApproval','POST','/internal/v1/settlements/{transaction_number}/payment-approvals','PaymentApprovalInput','PaymentApproval','approval','201','内部运营','独立批准受益方、确切银行账号版、CNY金额及来源；本地锁额与账务同事务。'],
    ['s5-payment-execution','CreatePaymentExecutionIntent','POST','/internal/v1/payment-transactions/{transaction_number}/execution-intents','PaymentExecutionInput','PaymentExecution','execution','201','内部运营','仅持久化原号办理意图；银行调用事务外。本例无银行接口，返回待核/未知不伪装扣款成功。'],
    ['s5-payment-read','GetPaymentExecution','GET','/internal/v1/payment-transactions/{transaction_number}/execution','—','PaymentExecution','','200','内部运营','以原付款号查询/恢复。未知时继续保持锁额，不接受新号重付。'],
    ['s5-beneficiary-receipt','CreateBeneficiaryReceiptConfirmation','POST','/api/v1/payment-transactions/{transaction_number}/beneficiary-receipt-confirmations','BeneficiaryReceiptConfirmationInput','BeneficiaryReceiptConfirmation','confirmation','201','外部服务','收款方A独立确认真实到账并附证；银行扣款或付款方声明不能替代A到账。'],
    ['s5-difference-create','CreateFundsReconciliationDifference','POST','/internal/v1/funds-reconciliation-differences','FundsDifferenceInput','FundsDifference','difference','201','内部运营','为缺失/重复/金额/状态不一致开立差异；缺证据为空，不造占位流水/零额。'],
    ['s5-difference-read','GetFundsReconciliationDifference','GET','/internal/v1/funds-reconciliation-differences/{difference_number}','—','FundsDifference','','200','内部运营','读取原差异、责任人、处置和独立复核历史。'],
    ['s5-difference-disposition','CreateFundsDifferenceDisposition','POST','/internal/v1/funds-reconciliation-differences/{difference_number}/dispositions','FundsDifferenceDispositionInput','FundsDifference','disposition','201','内部运营','按证据追加处置；补账/调账必须形成新资金事件及凭证，禁止手改余额。'],
    ['s5-difference-review','CreateFundsDifferenceReview','POST','/internal/v1/funds-reconciliation-differences/{difference_number}/reviews','FundsDifferenceReviewInput','FundsDifference','review','201','内部运营','独立复核已处置差异，证据不全/未决时维持受限、锁额和门禁。']
  ].map(([id,rpc,method,path,input,output,body,status,audience,detail])=>{
    const timeout=method==='GET'?common.timeouts.read:common.timeouts.write;
    const internal=audience==='内部运营';
    return {id,rpc,method,path,input,output,body,status,audience,detail,
      reqMsg:rpc+'ReqMsg',rspMsg:rpc+'RspMsg',responseBody:'resource',query:[],
      file:'proto/trade/funds/v1/funds.proto',
      service:internal?'InternalFundsOperationsService':'ExternalFundsService',
      timeout,timeoutClass:method==='GET'?'read':'write'};
  });
  const endpointById=new Map(endpoints.map(endpoint=>[endpoint.id,endpoint]));
  const transaction=(lines)=>lines.join('\n');
  const useCases=[
    {
      id:'s5-n11-receipt',code:'N11',name:'核实银行来款并查看未匹配金额',
      actor:'出口代理资金经办人与独立复核人',actors:['出口代理资金经办人','出口代理资金独立复核人'],
      endpoints:['s5-receipt-read','s5-bank-evidence','s5-funds-overview'],
      description:'资金经办人登记银行流水，独立复核人核实实际到账。系统按实际收款账户和银行流水标识防止重复入账；款项先记为受限，未匹配到交易的金额不能释放或付款。未接银行渠道时只能登记待核材料，不能据此认定到账或增加余额。',
      transaction:transaction([
        'READ COMMITTED：先查原请求键；异文409，原文恢复原受理。',
        '锁已核验的收款账户配置与稳定指纹，再以FOR UPDATE当前读查询银行事件键；跨配置版重复仍命中原事实。',
        '银行原始对账文件先在事务外保全确切S3 VersionId/hash并扫描；内事务只在真实到账依据核验后插入event_type=1，NULL→受限；资金事实与来源账务凭证同COMMIT。',
        '未匹配款只保留受限金额与待匹配理由；不创建虚拟trade、allocation或可用账户余额。'
      ]),
      systemSequence:`sequenceDiagram
    actor OP as 出口代理资金经办人
    participant SYS as 代理出口系统（单体）
    actor REVIEWER as 出口代理资金独立复核人
    OP->>SYS: 提交待核银行流水及确切文件引用
    SYS-->>OP: 返回原受理号和待核状态，不声称实收
    REVIEWER->>SYS: 查看原银行证据、稳定账号身份与重复核查
    SYS-->>REVIEWER: 展示匹配/未匹配项及缺失证据
    REVIEWER->>SYS: 独立核实实际到账或退回
    alt 有可验证真实到账依据
      SYS-->>REVIEWER: 记录实际到账，款项记为受限；未匹配金额继续受限
    else 无银行证据/渠道未接
      SYS-->>REVIEWER: 保持待核，不写银行成功、不改变余额
    end
    OP->>SYS: 查询原实收号和匹配结果
    SYS-->>OP: 返回原来款记录、匹配情况和当前使用限制`
    },
    {
      id:'s5-n12-allocation',code:'N12',name:'来款分配、复核与超额防护',
      actor:'资金经办人与独立资金复核人',actors:['出口代理资金经办人','出口代理资金独立复核人'],
      endpoints:['s5-allocation-context','s5-allocation-create','s5-allocation-read','s5-allocation-decision'],
      description:'资金经办人把已核实的来款分配给交易：一笔来款可分给多笔交易，一笔交易也可对应多笔来款。每笔分配保留原始金额、批准交易资料和来源，不得超额。独立复核通过后，仍须完成贸易核验并取得银行可用证据，才能用于付款。',
      transaction:transaction([
        'BEGIN READ COMMITTED先查重入，再锁trade_record_tab聚合根、对应批准原因2快照、稳定银行身份和实收flow。',
        '对同一实收全部有效/待复核allocation行按allocation_number排序FOR UPDATE当前读；应用以定点金额计算毛额守恒。',
        '待复核分配只能在同一事务插入/修改其工作投影；独立decision再次锁定根、flow、allocation及审批依据，异人批准后状态有效。',
        '检查原实收金额=有效分配+未匹配余额；超额、跨trade未批准、异币种、同键异文均整笔回滚。'
      ]),
      systemSequence:`sequenceDiagram
    actor OP as 出口代理资金经办人
    participant SYS as 代理出口系统（单体）
    actor REVIEWER as 出口代理资金独立复核人
    OP->>SYS: 查询已核实实收、未匹配余额和批准交易
    SYS-->>OP: 返回来款原始金额、已分配金额和本次最多可分配金额
    OP->>SYS: 明确确认具体分配金额、交易和批准版
    SYS-->>OP: 保存分配并返回编号，等待独立复核；可用资金暂不增加
    REVIEWER->>SYS: 独立复核同一银行流水和交易快照
    alt 守恒且金额未超限
      SYS-->>REVIEWER: 将确切分配版标记有效；待核实金额仍受限
    else 不匹配或超额
      SYS-->>REVIEWER: 回滚/退回，不生成负余额或额度
    end
    OP->>SYS: 以原分配号读取当前与历史状态
    SYS-->>OP: 返回不可覆盖的毛额和复核结果`
    },
    {
      id:'s5-n13-invoice-fee',code:'N13',name:'提交或补正商业发票申报',
      actor:'出口代理商业发票申报经办人与中国供应商财务',actors:['出口代理商业发票申报经办人','中国供应商财务经办人','出口代理资金独立审核人'],
      endpoints:['s5-invoice-create','s5-invoice-read'],
      description:'出口代理提交向付款方开具的商业发票及对应附件，由独立资金审核人核对申报内容和来源。INVOICE申报、补件、改版或重试均不触发服务费；每笔交易仅在首次获批分账时，从D已核验可用余额一次性结算固定人民币300元。',
      transaction:transaction([
        '文件上传、S3确切版本检查与ClamAV扫描均在业务事务外；拒绝未扫描或被替代版本。',
        '提交时先按主体/受众/原键查同文结果；锁交易根与当前批准版，插入不可变INVOICE交易单据，冻结来源/金额/CNY/文件清单。',
        'INVOICE提交或补正仅保存申报及审核版本；不创建服务费单据或资金事件。',
        '服务费只在N15首次获批分账时处理；同一trade的后续分批、重试及INVOICE补正均不得再次收费。'
      ]),
      systemSequence:`sequenceDiagram
    actor SUP as 出口代理商业发票申报经办人
    participant SYS as 代理出口系统（单体）
    actor OP as 中国供应商财务经办人
    actor REVIEWER as 出口代理资金独立审核人
    SUP->>SYS: 提交商业发票、申报金额、批准交易版本和已扫描附件版本
    SYS-->>SUP: 返回申报号并等待审核，货款尚未因此支付
    REVIEWER->>SYS: 核对交易快照、金额、分配范围及附件
    alt 首次提交或补正
      SYS-->>REVIEWER: 保存不可变申报版；不在INVOICE阶段收取服务费
    end
    OP->>SYS: 查询申报与审核状态
    SYS-->>OP: 返回申报历史；服务费将在首次获批分账时处理`
    },
    {
      id:'s5-n14-verification-release',code:'N14',name:'核验贸易资料并释放银行已确认可用的货款',
      actor:'出口代理资金审核人',actors:['出口代理资金经办人','出口代理资金独立审核人'],
      endpoints:['s5-review-context','s5-trade-verification','s5-availability-release','s5-funds-overview'],
      description:'独立审核人核对商业发票、批准交易资料、来款分配、合同和正式凭据。贸易核验通过后，还须银行证明同一范围的款项实际可用，系统才按已核实金额把受限资金转为可用；可分次释放，也可全部释放。',
      transaction:transaction([
        '贸易核验先查原单、锁trade根/批准快照、INVOICE与allocation行，复核来源范围及未决差异；审核事件和单据状态同COMMIT。',
        '释放另起短事务，锁稳定账号指纹、实际bank_credit、对应allocation、受限/可用control account并按account_number排序FOR UPDATE。',
        '当前读核实银行available-balance证据覆盖相同范围与金额后，追加event_type=3 (1→2)，更新released_amount并创建平衡凭证/分录。',
        '金额允许部分释放，数量与来源逐项绑定。无银行证据、仅贸易核验、重复金额或范围错配时保持受限并拒绝。',
        '银行/存储/扫描IO不持事务锁；本地资金、投影和账务原子提交。'
      ]),
      systemSequence:`sequenceDiagram
    actor OP as 出口代理资金经办人
    participant SYS as 代理出口系统（单体）
    actor REVIEWER as 出口代理资金独立审核人
    OP->>SYS: 请求审核指定INVOICE和分配范围
    SYS-->>OP: 返回批准版、证据、未决差异和当前桶
    REVIEWER->>SYS: 独立确认贸易核验结论
    SYS-->>REVIEWER: 仅记录核验事实；没有银行可用证据仍受限
    OP->>SYS: 提交实际银行可用凭证及部分释放金额
    alt 银行真实可用范围匹配
      SYS-->>OP: 原子记账并从受限部分释放到可用
    else 无真实银行证据或范围不匹配
      SYS-->>OP: 拒绝释放，余额仍在受限桶
    end`
    },
    {
      id:'s5-n15-settlement',code:'N15',name:'试算并审批预付款或出口后付款的结算单',
      actor:'出口代理资金经办人与独立审批人',actors:['出口代理资金经办人','出口代理资金独立审批人','中国供应商经办人'],
      endpoints:['s5-settlement-create','s5-settlement-read','s5-settlement-decision'],
      description:'资金经办人选择出口前预付款或出口后付款，按适用规则和批准交易版本试算结算单，再交独立人员审批。首次获批分账时，须依据有效收费约定，从D已核验可用余额一次性结算固定人民币300元并入账；该费用不减少A合同应付。两种付款分支分别检查所需协议、委托、资金来源、申报件接收、放行、银行条件和金额；预付款不提供垫资、授信或透支。',
      transaction:transaction([
        '事务内先查原键、锁trade根和批准版，再按allocation/既有付款/差异锁顺序当前读，计算A合同应付、已付、授权第三方扣款及净额。',
        '预付分支要求A-B协议、B指定/认可F、A委任同一F、A-F协议、有效电子委托、金额/CNY/批次/审批、D实收匹配、银行条件、费用授权；不得以未来入账或受限额替代可用额。',
        '出口后分支还要求A有效委任F、A批准最终草稿、已申报附件2列B为境内发货人且B已收到、正式放行证明、D来款匹配、银行条件和批准结算净额。',
        '首次分账须核验D承担服务费的有效约定、分账批准及至少300.00元D可用余额；同一事务按trade唯一键从可用余额结算固定300.00元并记event_type=12。余额不足、缺授权或差异未决时拒绝该次分账。',
        '服务费结算不得从A合同应付或其应付净额中扣除；扣费后可用余额不足以支付全部应付时，保留A合同应付并按资金不足规则处理，不得将短缺改写为A承担。费用结算、分账和账务凭证原子提交。'
      ]),
      systemSequence:`sequenceDiagram
    actor OP as 出口代理资金经办人
    participant SYS as 代理出口系统（单体）
    actor REVIEWER as 出口代理资金独立审批人
    actor SUP as 中国供应商经办人
    OP->>SYS: 选择预付款或出口后分支并建立结算试算
    SYS-->>OP: 返回逐项清单、A合同应付、D可用余额、缺项和资金来源
    SUP->>SYS: 对结算单金额/供应商收讫附件作有权确认（适用时）
    REVIEWER->>SYS: 独立审核该分支全部合同、授权、银行/出口证据
    alt 资金可用且分支规则全部满足
      SYS-->>REVIEWER: 首次分账从D可用余额结算300元；A合同应付不变
    else 缺证据/受限资金/额度不足
      SYS-->>REVIEWER: 退回或阻断；不提供贷款、透支或垫资
    end
    OP->>SYS: 用原结算号查询与补正
    SYS-->>OP: 保留原审查意见，新增版本重新审查`
    },
    {
      id:'s5-n16-payment',code:'N16',name:'审批付款、锁定金额并确认供应商到账',
      actor:'出口代理付款经办人、独立审批人及供应商收款确认人',actors:['出口代理付款经办人','出口代理付款独立审批人','中国供应商收款确认人'],
      endpoints:['s5-payment-approval','s5-payment-execution','s5-payment-read','s5-beneficiary-receipt'],
      description:'付款经办、独立审批、执行和供应商收款确认分别处理。审批通过后，系统从可用资金中锁定付款金额并同步记账，再向银行办理。结果不明时保留锁额，用原付款号查单；只有明确失败且确认未扣款才能解锁。银行扣款后，仍须供应商另交凭据确认实际到账。',
      transaction:transaction([
        '批准短事务按trade根、settlement、allocation、账号稳定指纹及CNY三桶固定顺序FOR UPDATE；再次检查账户有效期、受益人、开放差异和足额可用。',
        '追加event_type=4 (2→3)、按allocation更新occupied_amount、冻结交易/合同/银行账号版本及批准金额，并写平衡凭证/分录同COMMIT。',
        '银行执行在COMMIT后事务外；连接超时保存execution_status=unknown及原始attempt，不新建付款号、不释放锁额。',
        '恢复仅用原transaction_number查单。真实扣款证据追加event_type=2 (3→NULL)并消耗占用；明确失败/取消且确认未扣款才event_type=5 (3→2)。',
        'A到账确认独立匹配收款方证据；银行扣款、银行费用11、服务费收款10均不能代替。'
      ]),
      systemSequence:`sequenceDiagram
    actor OP as 出口代理付款经办人
    participant SYS as 代理出口系统（单体）
    actor REVIEWER as 出口代理付款独立审批人
    actor BANK as 未接入的银行（本轮不发起调用）
    actor PAYEE as 中国供应商收款确认人
    OP->>SYS: 提交结算付款请求、账户版本及确切意图确认
    REVIEWER->>SYS: 查看已批准结算、案件、受益人和可用余额
    alt 审批通过且资金足额可用
      SYS-->>REVIEWER: 锁额并原子记账；返回原付款号
      SYS-->>OP: 执行待办理；不得称银行成功
      opt 银行真实接入后
        SYS->>BANK: 按已批准的付款请求办理
        BANK-->>SYS: 明确回执或结果未知
      end
    else 银行或结算证据缺失
      SYS-->>REVIEWER: 保持原桶，拒绝新付款
    end
    OP->>SYS: 使用原付款号恢复未知执行
    SYS-->>OP: 未知保持锁额；只查单，不换号重付
    PAYEE->>SYS: 单独提交本方真实到账凭据
    SYS-->>PAYEE: 缺凭据时继续待核；银行扣款不能证明供应商已到账`
    },
    {
      id:'s5-n17-reconciliation',code:'N17',name:'处理资金差异并由独立人员复核',
      actor:'资金差异处理人与独立复核人',actors:['出口代理资金差异处理人','出口代理资金独立复核人','出口代理资金经办人'],
      endpoints:['s5-difference-create','s5-difference-read','s5-difference-disposition','s5-difference-review','s5-funds-overview'],
      description:'差异处理人登记银行与内部记录之间的流水缺失、重复、金额或执行状态不一致，并提交处理依据。补账须新增资金记录和凭证，不能直接改余额或覆盖旧记录；独立复核通过后才关闭差异。未解决时，相关付款、资金释放或结算继续受限。',
      transaction:transaction([
        '先查原差异命令键，再锁差异行、相关资金单据、银行事件和allocation/桶/账务账户，按固定顺序当前读。',
        '证据文件与银行查单在事务外完成；内部状态只存实际观测、确切来源键及差异两侧金额，未知一侧保持NULL。',
        '处置为追加生命周期事实；资金更正必须增加反向/补充event、凭证及分录，同一事务核对守恒，不可UPDATE旧资金事件。',
        '另一身份独立复核后才关闭差异；退回保留原原因。未闭环差异继续阻断受影响资金操作，不解锁未知执行。'
      ]),
      systemSequence:`sequenceDiagram
    actor OP as 出口代理资金差异处理人
    participant SYS as 代理出口系统（单体）
    actor REVIEWER as 出口代理资金独立复核人
    OP->>SYS: 报告并查询具体资金/账务差异
    SYS-->>OP: 返回银行与内部记录、影响范围和当前操作限制
    OP->>SYS: 附实质处置与原始依据，不更改旧余额
    REVIEWER->>SYS: 独立复核处置和新增补账/凭证
    alt 两侧事实可勾稽且凭证平衡
      SYS-->>REVIEWER: 关闭该差异并保存不可变结果
    else 证据不足或金额不平
      SYS-->>REVIEWER: 保持处理中；相关锁额/受限继续
    end
    OP->>SYS: 用原差异号读取处置和补正结果
    SYS-->>OP: 显示原始记录、处理历史和当前限制，未完成的事项继续保留`
    }
  ];
  const implementationSteps={
    N11:[
      'APP->>STORE: 事务外读取银行原始证据固定VersionId/hash',
      'APP->>SCAN: 扫描同一字节；合成文件不能当银行凭证',
      'APP->>DB: BEGIN READ COMMITTED；先按主体/方法/路径/原键查同文受理',
      'APP->>DB: 锁稳定收款账号身份；FOR UPDATE当前读fingerprint+bank_event_key',
      'alt 有独立核实的真实到账依据',
      'APP->>DB: event1 NULL到受限 + account控制投影 + 平衡voucher/entries原子COMMIT',
      'APP-->>PAGE: 返回原flow；未匹配额留受限，不创建虚拟交易',
      'else 当前未接银行且缺真实凭证',
      'APP->>DB: ROLLBACK；不产生event1/余额/凭证',
      'APP-->>PAGE: 422 BANK_EVIDENCE_REQUIRED；GET原受理待核',
      'end'],
    N12:[
      'APP->>DB: BEGIN READ COMMITTED；先查分配/decision原键与正文摘要',
      'APP->>DB: 按trade号锁交易根和批准版，再锁稳定银行身份和实收flow',
      'APP->>DB: 根锁后按allocation_number排序FOR UPDATE当前读全部待审/有效分配',
      'APP->>APP: 定点核对gross等于有效分配加未匹配；待审预留避免并发超分',
      'alt 超额/实收不存在/复核人与发起人相同',
      'APP->>DB: ROLLBACK；不写分配或增加可用额',
      'APP-->>PAGE: 409/422缺项；GET原分配再补正',
      'else 足额且独立复核',
      'APP->>DB: 原子保存毛额/批准快照/decision及确认消费；COMMIT',
      'APP-->>PAGE: 返回待复核或有效分配；货款仍受限，无资金迁移/无新增分录',
      'end'],
    N13:[
      'APP->>STORE: 事务外校验INVOICE确切VersionId/长度/hash',
      'APP->>SCAN: 扫描确切文件；不认可合成文件为商业依据',
      'APP->>DB: BEGIN READ COMMITTED；先查INVOICE原键，同文恢复异文409',
      'APP->>DB: 锁trade根；FOR UPDATE当前读批准版/原INVOICE',
      'APP->>APP: 核对CNY/金额/文件及补正前版，已提交内容不可覆盖',
      'APP->>DB: 仅追加INVOICE申报及审核版本，不触发服务费结算',
      'APP->>DB: 受理/确认消费原子COMMIT',
      'APP-->>PAGE: 返回INVOICE申报状态；服务费待首次获批分账处理'],
    N14:[
      'APP->>STORE: 事务外读取贸易核验证据及银行可用证明固定版本',
      'APP->>SCAN: 校验相同字节；内部审核不替代银行证据',
      'APP->>DB: BEGIN READ COMMITTED先查verification/release原键',
      'APP->>DB: 锁trade根/稳定银行身份/receipt/核验单；allocation与account按号排序',
      'APP->>DB: FOR UPDATE当前读有效分配、已释放额、受限余额及未决差异',
      'alt 缺真实银行可用依据或范围不符',
      'APP->>DB: ROLLBACK；受限保持原值，无event3/凭证',
      'APP-->>PAGE: 422 BANK_AVAILABILITY_EVIDENCE_REQUIRED；GET review-context补正',
      'else 范围金额及贸易核验均满足',
      'APP->>DB: 仅本次部分金额event3桶1到2 + released投影 + voucher/entries原子COMMIT',
      'APP-->>PAGE: 返回释放原号和剩余受限；不推断付款成功',
      'end'],
    N15:[
      'APP->>STORE: 事务外核对适用合同/正式报关/放行/授权费用固定证据版本',
      'APP->>DB: BEGIN READ COMMITTED先查settlement/decision原键',
      'APP->>DB: 锁trade根/批准版/结算单；排序锁分配与account',
      'APP->>DB: FOR UPDATE当前读已付、锁额、有效分配、未决差异及结算净额',
      'alt 出口前预付款',
      'APP->>APP: 核对要求1到6及11到14、同一F委任、真实D实收/可用',
      'else 出口后付款',
      'APP->>APP: 核对要求1/3/5到14、A最终稿确认、B收正式申报件及真实放行',
      'end',
      'APP->>APP: 单列授权第三方扣款与银行费用；服务费不列作A应付扣项，禁止垫资授信',
      'alt 缺项或审批人与制单人相同',
      'APP->>DB: ROLLBACK；返回422门禁；不生成锁额/银行事件/分录',
      'else 独立复核满足',
      'APP->>DB: 首次获批分账按trade键从D可用余额结算300并追加event12',
      'APP->>DB: 冻结A合同应付/分账来源/决策；服务费结算与凭证原子COMMIT',
      'end',
      'APP-->>PAGE: GET原settlement返回缺项或批准版，修正另建关联版本'],
    N16:[
      'APP->>STORE: 事务外核验确切受益方账号版及审批/银行证据',
      'APP->>DB: BEGIN READ COMMITTED先查approval/intent原键',
      'APP->>DB: 锁trade根/稳定银行身份/结算/付款单；排序锁allocation/account',
      'APP->>DB: FOR UPDATE当前读可用额/占用/分支证据/独立审批/差异',
      'alt 缺证据或余额不足',
      'APP->>DB: ROLLBACK；拒绝批准/办理，不生成银行成功',
      'else 门禁完整',
      'APP->>DB: event4桶2到3 + 占用投影 + 冻结执行快照 + voucher/entries原子COMMIT',
      'APP->>BANK: COMMIT后用原transaction_number办理/查单（当前适配器未接入）',
      'alt 超时/执行未知',
      'APP->>DB: 追加unknown观测；保留锁额，不重发新单',
      'else 真实明确失败且未扣款',
      'APP->>DB: 新RC事务先查原键/锁根当前读；event5解锁+凭证原子COMMIT',
      'else 真实扣款已证实',
      'APP->>DB: 新RC事务event2消耗锁额+凭证原子COMMIT；不推断A到账',
      'end',
      'end',
      'APP-->>PAGE: GET原付款号恢复；A到账另核真实收款证据，缺失返回422'],
    N17:[
      'APP->>STORE: 事务外读取两侧原始对账及处置证据固定版本',
      'APP->>BANK: 事务外仅原号查单；无接入则未知侧保持NULL',
      'APP->>DB: BEGIN READ COMMITTED先查difference/disposition/review原键',
      'APP->>DB: 锁trade根/差异行/相关单据/银行身份；排序锁allocation/account',
      'APP->>DB: FOR UPDATE当前读原flow/凭证/执行观测与未决门禁',
      'APP->>APP: 检查缺失/重复/金额/状态及独立复核；未知不是0',
      'alt 有真实依据且需补账',
      'APP->>DB: 追加更正event及平衡voucher/entries；禁止更新原flow/余额捷径',
      'else 缺证据',
      'APP->>DB: 仅追加待补证处置/退回意见；不关闭，不解锁',
      'end',
      'APP->>DB: 差异事实/更正资金账务/确认消费同一COMMIT',
      'APP-->>PAGE: GET原差异显示历史；异人核实闭环才关闭并重评门禁']
  };
  useCases.forEach(useCase=>{
    useCase.intent=useCase.name;
    if(useCase.endpoints.some(id=>!endpointById.has(id)))throw new Error('STEP_FIVE_ENDPOINT_MISSING');
    useCase.sequence=['sequenceDiagram','    autonumber',
      ...useCase.actors.map((actor,index)=>'    actor '+(index===0?'PAGE':'ACTOR'+index)+' as '+actor),
      '    participant APP as 单体资金应用',
      '    participant DB as MySQL资金及账务',
      '    participant STORE as 私有S3确切版本','    participant SCAN as ClamAV',
      '    participant BANK as 银行事实边界（未接入）',
      '    PAGE->>APP: GET当前资源/强ETag，再确认具体正文及原幂等键',
      ...implementationSteps[useCase.code].map(line=>'    '+line),
      '    Note over APP,DB: RC先查重入/根锁后当前读；资金与账务本地原子；外部I/O事务外'
    ].join('\n');
  });
  const rules=[
    ['N11 收款事实','bank_credit仅接受真实到账证据；银行事件按稳定账号指纹+银行事件键去重；入账先进受限，未匹配仍受限。'],
    ['N12 毛额守恒','一实收可多交易、每交易可多实收；实收毛额=有效分配+未匹配。交易根锁后FOR UPDATE当前读同根分配，防并发超额。'],
    ['N12 独立复核','分配待复核不算有效资金；复核人不能是发起人，异文同键冲突，作废/改额保留原行及原因。'],
    ['N13 INVOICE','INVOICE、银行核验、银行实收、可用余额、结算、付款和到账是不同事实；申报不形成银行事实。补正关联原INVOICE并不可覆盖。'],
    ['N13 服务费','INVOICE申报、补件、改版及重试不触发服务费；固定CNY 300由D承担，仅在首次获批分账时从已核验可用余额按trade唯一键结算。'],
    ['N13 费用隔离','历史event8/9/10不由新业务生成；event12从D可用余额转列B服务费，不伪造银行扣款、不减少A合同应付。'],
    ['N14 部分释放','只有贸易核验、确切分配、实收和真实银行可用证据共同满足时，逐范围event3从桶1到桶2；可部分释放，缺银行证据保持受限。'],
    ['N15 结算','CNY DECIMAL(20,2)；已付款、当前锁额、有效授权第三方费用分别勾稽；首次获批分账时D可用余额扣减固定300元服务费，A合同应付独立保留。'],
    ['N15 预付','至少满足要求1–6、11–14及适用合同：A-B协议、B指定/认可F、A委任同一F、A-F协议、有效电子委托、金额/CNY/批次/审批、D实收匹配、银行条件、收费授权；只能用真实可用资金。'],
    ['N15 出口后','至少满足要求1、3、5–14：A有效委任F、A批准最终稿、申报件列B为境内发货人且B已收到、正式放行、D实收匹配、银行条件和批准净额；公共协议须逐项适用。'],
    ['N16 付款锁额','独立审批且受益方/账号配置/资金证据通过后才可event4桶2→3；更新allocation占用和凭证原子提交，外部银行I/O在COMMIT后。'],
    ['N16 未知执行','未知使用原transaction_number查单并保留桶3锁额；只在真实明确失败/未扣款时event5桶3→2，不重发新单。'],
    ['N16 到账','event2银行扣款不等于收款方A到账；A收款确认需要独立银行证据，扣款、对账、记账与到账分别建事实。'],
    ['N17 差异','差异处置不改余额/原流水；缺证据保持NULL，不造0/占位流水；补账追加新事件与凭证，异人复核后才关闭。'],
    ['一致性','先查原幂等键，再锁聚合根；READ COMMITTED后FOR UPDATE当前读；资金事件、物化投影、凭证及分录本地原子提交。'],
    ['外部边界','外部银行/监管未接入时仅验证缺证据阻断；无垫资、授信、透支、换汇，不构造银行成功输入。'],
    ['单体与受众','共用一个模块化单体；ExternalFundsService与InternalFundsOperationsService是两受众接口，不是微服务或生产实现。']
  ];
  const domainRules=(()=>{
    const parseCny=(value)=>{
      if(typeof value!=='string'||!/^(?:0|[1-9][0-9]{0,17})\.[0-9]{2}$/.test(value))throw new Error('AMOUNT_FORMAT_INVALID');
      return BigInt(value.replace('.',''));
    };
    const formatCny=(cents)=>{
      if(typeof cents!=='bigint'||cents<0n||cents>99999999999999999999n)throw new Error('AMOUNT_RANGE_INVALID');
      return (cents/100n).toString()+'.'+(cents%100n).toString().padStart(2,'0');
    };
    const allocateReceipt=({receiptAmount,alreadyAllocated='0.00',requestedAmount})=>{
      const gross=parseCny(receiptAmount),existing=parseCny(alreadyAllocated),request=parseCny(requestedAmount);
      if(request<=0n||existing+request>gross)throw new Error('ALLOCATION_EXCEEDED');
      return {allocated:formatCny(existing+request),unmatched:formatCny(gross-existing-request)};
    };
    const releaseFunds=({restricted,available,amount,tradeVerified,bankAvailableEvidence})=>{
      if(!tradeVerified)throw new Error('TRADE_VERIFICATION_REQUIRED');
      if(!bankAvailableEvidence)throw new Error('BANK_AVAILABILITY_EVIDENCE_REQUIRED');
      const source=parseCny(restricted),target=parseCny(available),move=parseCny(amount);
      if(move<=0n||move>source)throw new Error('RESTRICTED_BALANCE_INSUFFICIENT');
      return {restricted:formatCny(source-move),available:formatCny(target+move)};
    };
    const approvePayment=({available,locked='0.00',amount,settlementApproved,beneficiaryVerified,branchEvidenceComplete,openDifference=false})=>{
      if(!settlementApproved||!branchEvidenceComplete||!beneficiaryVerified||openDifference)throw new Error('PAYMENT_GATE_INCOMPLETE');
      const source=parseCny(available),move=parseCny(amount);
      if(move<=0n||move>source)throw new Error('AVAILABLE_BALANCE_INSUFFICIENT');
      return {available:formatCny(source-move),locked:formatCny(parseCny(locked)+move)};
    };
    const executionResult=({available,locked,amount,outcome})=>{
      const free=parseCny(available),held=parseCny(locked),move=parseCny(amount);
      if(move<=0n||move>held)throw new Error('LOCKED_BALANCE_INSUFFICIENT');
      if(outcome==='unknown')return {available:formatCny(free),locked:formatCny(held),action:'QUERY_ORIGINAL'};
      if(outcome==='explicit_failure')return {available:formatCny(free+move),locked:formatCny(held-move),action:'UNLOCK'};
      if(outcome==='confirmed_debit')return {available:formatCny(free),locked:formatCny(held-move),action:'CONSUME_LOCK'};
      throw new Error('EXECUTION_EVIDENCE_REQUIRED');
    };
    const serviceFeeSettlement=({tradeNumber,available,alreadySettled=false,distributionApproved=false,tradeVerified=false,availableBalanceVerified=false,payerAuthorized=false})=>{
      if(alreadySettled)return null;
      if(!distributionApproved||!tradeVerified||!availableBalanceVerified||!payerAuthorized)
        throw new Error('SERVICE_FEE_SETTLEMENT_GATE_INCOMPLETE');
      if(typeof tradeNumber!=='string'||!tradeNumber.trim())throw new Error('TRADE_NUMBER_REQUIRED');
      const balance=parseCny(available),fee=parseCny('300.00');
      if(balance<fee)throw new Error('SERVICE_FEE_AVAILABLE_BALANCE_INSUFFICIENT');
      return {amount:'300.00',currencyCode:'CNY',payerRole:'D',payeeRole:'B',eventType:12,bucketFrom:2,bucketTo:null,eventKey:tradeNumber+':agency_service_fee',available:formatCny(balance-fee)};
    };
    const paymentRequirements=({branch,verifiedCodes=[],additionalRequiredCodes=[]})=>{
      const required=branch==='prepayment'?[1,2,3,4,5,6,11,12,13,14]:
        branch==='post_export'?[1,3,5,6,7,8,9,10,11,12,13,14]:null;
      if(!required)throw new Error('PAYMENT_BRANCH_INVALID');
      if([...verifiedCodes,...additionalRequiredCodes].some(code=>!Number.isInteger(code)||code<1||code>14))
        throw new Error('PAYMENT_REQUIREMENT_INVALID');
      const missing=[...new Set([...required,...additionalRequiredCodes])].filter(code=>!verifiedCodes.includes(code));
      return {complete:missing.length===0,missing};
    };
    const settlementNet=({payable,alreadyPaid='0.00',locked='0.00',deductions=[]})=>{
      const total=parseCny(payable),paid=parseCny(alreadyPaid),held=parseCny(locked);
      const authorized=deductions.reduce((sum,item)=>{
        if(item.reason==='agency_service_fee')throw new Error('SERVICE_FEE_CARGO_DEDUCTION_FORBIDDEN');
        if(!item.authorizationReference||!item.borneByPartyRole)throw new Error('DEDUCTION_AUTHORIZATION_REQUIRED');
        return sum+parseCny(item.amount);
      },0n);
      if(paid+held+authorized>total)throw new Error('SETTLEMENT_LIMIT_EXCEEDED');
      return {remaining:formatCny(total-paid-held-authorized),authorizedDeductions:formatCny(authorized)};
    };
    const validateBankEvent=({eventType,bankEvidence,buckets})=>{
      if(eventType!==11)throw new Error('BANK_EVENT_TYPE_INVALID');
      if(!bankEvidence||bankEvidence.verified!==true||!bankEvidence.accountFingerprint||!bankEvidence.bankEventKey)
        throw new Error('BANK_EVIDENCE_REQUIRED');
      return {accepted:true,buckets:{...buckets}};
    };
    const applyBucketEvents=(events)=>{
      const buckets={restricted:0n,available:0n,locked:0n};
      const positive=(value)=>{
        const cents=parseCny(value);if(cents<=0n)throw new Error('AMOUNT_RANGE_INVALID');return cents;
      };
      for(const event of events){
        const amount=positive(event.amount);
        if(event.currencyCode!=='CNY')throw new Error('CURRENCY_NOT_SUPPORTED');
        if(event.eventType===1)buckets.restricted+=amount;
        else if(event.eventType===2){if(amount>buckets.locked)throw new Error('LOCKED_BALANCE_INSUFFICIENT');buckets.locked-=amount;}
        else if(event.eventType===3){if(amount>buckets.restricted)throw new Error('RESTRICTED_BALANCE_INSUFFICIENT');buckets.restricted-=amount;buckets.available+=amount;}
        else if(event.eventType===4){if(amount>buckets.available)throw new Error('AVAILABLE_BALANCE_INSUFFICIENT');buckets.available-=amount;buckets.locked+=amount;}
        else if(event.eventType===5){if(amount>buckets.locked)throw new Error('LOCKED_BALANCE_INSUFFICIENT');buckets.locked-=amount;buckets.available+=amount;}
        else if(event.eventType===6){if(amount>buckets.available)throw new Error('AVAILABLE_BALANCE_INSUFFICIENT');buckets.available-=amount;buckets.restricted+=amount;}
        else if(event.eventType===12){
          if(event.bucketFrom!==2||event.bucketTo!=null)throw new Error('SERVICE_FEE_BUCKET_INVALID');
          if(amount>buckets.available)throw new Error('AVAILABLE_BALANCE_INSUFFICIENT');
          buckets.available-=amount;
        }else if([8,9,10,11].includes(event.eventType)){
          if(event.bucketFrom!=null||event.bucketTo!=null)throw new Error('NON_CARGO_EVENT_HAS_BUCKET');
        }else throw new Error('FUNDS_EVENT_TYPE_INVALID');
      }
      return Object.fromEntries(Object.entries(buckets).map(([key,value])=>[key,formatCny(value)]));
    };
    return {parseCny,formatCny,allocateReceipt,releaseFunds,approvePayment,executionResult,serviceFeeSettlement,paymentRequirements,settlementNet,validateBankEvent,applyBucketEvents};
  })();
  const model={id:'step-five',name:'步骤五 · 收款、结算与付款',endpoints,useCases,rules,errors:[...errors,
    ['FUND_EVIDENCE_MISSING / RECEIPT_UNMATCHED / BANK_AVAILABILITY_EVIDENCE_REQUIRED',422,'FAILED_PRECONDITION',false,'保持受限并补充真实银行/匹配证据；不得根据INVOICE或人工声明释放'],
    ['ALLOCATION_EXCEEDED / SETTLEMENT_LIMIT_EXCEEDED / AVAILABLE_BALANCE_INSUFFICIENT',409,'FAILED_PRECONDITION',false,'读取原分配、批准版和当前桶；超额操作整体回滚'],
    ['PAYMENT_GATE_INCOMPLETE / BENEFICIARY_UNVERIFIED / CONTRACT_OR_EXPORT_EVIDENCE_MISSING',422,'FAILED_PRECONDITION',false,'按预付/出口后各自门禁补正；无垫资、授信或换汇'],
    ['EXECUTION_OUTCOME_UNKNOWN',503,'UNAVAILABLE',true,'只用原付款号查单；继续保持锁额，不得换号重付或解锁'],
    ['BANK_EVIDENCE_REQUIRED / PAYEE_RECEIPT_UNVERIFIED',422,'FAILED_PRECONDITION',false,'扣款不等于到账；补充真实银行证据并独立核实'],
    ['SERVICE_FEE_SETTLEMENT_GATE_INCOMPLETE / SERVICE_FEE_AVAILABLE_BALANCE_INSUFFICIENT',422,'FAILED_PRECONDITION',false,'补齐D承担服务费的有效约定、核验与分账批准；可用余额不足300元时不扣费、不改A合同应付'],
    ['DIFFERENCE_OPEN / ACCOUNTING_UNBALANCED / LEDGER_EVENT_CONFLICT',409,'FAILED_PRECONDITION',false,'以新资金事件/凭证处置差异，原流水不可改写']
  ],actors:[...new Set(useCases.flatMap(item=>item.actors))],domainRules};
  root.EXPORT_STEP_FIVE_USECASES_MODEL=model;
  if(typeof module==='object'&&module.exports)module.exports=model;
})(globalThis);
