'use strict';
(function (root) {
  const modules = ['system','step-two','step-three','step-four','step-five','step-six','step-seven','step-eight'];
  const globals = ['SYSTEM','STEP_TWO','STEP_THREE','STEP_FOUR','STEP_FIVE','STEP_SIX','STEP_SEVEN','STEP_EIGHT'];
  const stepDocuments = ['步骤一系统用例与业务规则','步骤二系统用例与接口协议','步骤三系统用例与接口协议','步骤四系统用例与接口协议','步骤五系统用例与接口协议','步骤六系统用例与接口协议','步骤七系统用例与接口协议','步骤八系统用例与接口协议'];
  const protoDomains = ['filing','contracts','logistics','customs','funds','taxproof','taxrefund','reconciliation'];
  const definitions = root.EXPORT_WORK_PACKAGE_CONTEXT ||
    (typeof require === 'function' ? require('./work-package-context.js') : null);
  if (!definitions) throw new Error('工作拆解缺少叶子执行上下文。');
  const flowModel = root.EXPORT_BUSINESS ||
    (typeof require === 'function' ? require('./business-data.js') : null);
  if (!flowModel) throw new Error('工作拆解缺少业务流程节点。');
  const roleNames={A:'中国供应商',B:'贸易代理商',C:'境外实际收货人',D:'付款方',E:'物流公司',F:'出口报关代理'};
  const flowNodes = flowModel.nodes.map(node=>({id:node.id,name:node.title.replace(/\b[A-F]\b/g,id=>roleNames[id]).replace(/[—–]/g,'与')}));
  const sourceModels = modules.map((name,index) => {
    const source = root['EXPORT_' + globals[index] + '_USECASES_MODEL'] ||
      (typeof require === 'function' ? require('./' + name + '-usecases-model.js') : null);
    if (!source) throw new Error('工作拆解缺少系统用例模型：' + name);
    return source;
  });
  const useCases = modules.flatMap((name,index) => {
    const source=sourceModels[index];
    return source.useCases.map(item => ({
      id:item.id, name:item.name, code:item.code, step:index+1,actor:item.actor,description:item.description,
      source:'交付成果/assets/'+name+'-usecases-model.js',
      document:'doc/'+stepDocuments[index]+'.md',
      proto:'proto/trade/'+protoDomains[index]+'/v1/'+protoDomains[index]+'.proto',
      endpoints:(item.endpoints || []).map(id => {
        const endpointSource=source.endpoints.some(endpoint=>endpoint.id===id) ? index :
          sourceModels.findIndex(model=>model.endpoints.some(endpoint=>endpoint.id===id));
        const endpoint=sourceModels[endpointSource]?.endpoints.find(endpoint=>endpoint.id===id);
        if (!endpoint) throw new Error('工作拆解引用不存在的接口：'+item.id+'/'+id);
        return {id,method:endpoint.method,path:endpoint.path,detail:endpoint.detail,
          source:'交付成果/assets/'+modules[endpointSource]+'-usecases-model.js'};
      })
    }));
  });
  const steps = n => useCases.filter(item => n.includes(item.step)).map(item => item.id);
  const phases = [
    {id:1, title:'第一期：银行接入与全流程人工协同', goal:'用基础表单、列表和审核页完成八阶段协同；银行按已开放能力接入，其余外部办理由授权人员完成并交独立人员核实。',
      excluded:'不接电子签署、海关、税务、承运商、第三方身份或筛查、短信邮件服务；不建设关务信息查询，不做品牌视觉、装饰动画或经营大屏。',
      entry:'确认首家银行、账户、开放接口、测试环境和人工回执核验渠道；业务方确认权限、正式证据及办理职责。',
      exit:'八阶段正常与退回路径、资金并发与原号恢复、缺证阻断、独审和备份恢复通过验收；未开放接口有受控人工路径，不用截图直接产生到账或放行。',
      gates:['冻结用例、银行能力及人工核实清单','完成运行环境、身份授权、数据版本和证据底座','联通基础页面、八阶段用例、银行及独立对账','完成业务验收、安全复测、恢复演练和试运行交接']},
    {id:2, title:'第二期：签署、物流与通知自动化', goal:'保留一期人工路径，增加第三方实名签署、受托物流状态和通知接入；对外部结果做验签、去重、版本及独立核实。',
      excluded:'本期不做海关正式申报、税务正式提交或关务信息查询；不以物流通知替代海关放行，不建设非必要视觉效果。',
      entry:'一期已验收；签署平台与物流服务方的合同、授权、字段、测试渠道及证据保留方式已确认。',
      exit:'签署版与审核正文一致、合同生效另判；物流乱序和重复通知可追溯；服务故障可回到受控人工办理且不会重复执行。',
      gates:['评审供应商授权、接入契约及数据最小化','分包实现签署、物流、通知适配及对应页面','完成超时、撤销、乱序及人工切换验收','分通道启用并核对原有记录']},
    {id:3, title:'第三期：关务、税务及授权查询', goal:'在主管渠道、办理主体和规则确认后接入海关与税务；提供授权范围内的关务信息查询、证明及退税跟进。',
      excluded:'不提供全社会报关数据查询；不凭样例推定税率、期限或申请职责；不自动豁免核验，不引入垫资、授信、透支或换汇。',
      entry:'前两期记录及审计可核对；海关、税务和查询数据源书面确认权限、范围、费用、规则版本及测试条件。',
      exit:'正式回执与待核声明分开；证明、退税结果和实际到账分别核实；查询无授权不返回数据；完整来源不齐仍禁止正常结案。',
      gates:['确认法律适用、主体、接口授权及数据许可','依次联调海关、证明、退税、关务查询和筛查','验证回执、补正、更正、撤销和跨域结案','完成迁移校验、故障恢复及正式渠道验收']}
  ];
  const layers = [];
  const layer = (id,title,color,description) => {
    const item = {id,title,color,description,capabilities:[]}; layers.push(item); return item;
  };
  const capability = (parent,id,title,description) => {
    const item = {id,title,description,tasks:[]}; parent.capabilities.push(item); return item;
  };
  function task(group,id,title,phase,days,team,scope,deliverable,acceptance,dependencies = [],cases = [],options = {}) {
    const staffingCount = options.staffingCount || 2;
    const item = {id,title,phase,personDays:days,team,staffingCount,staffing:staffingCount+'人承接',
      scope,deliverable,acceptance,dependencies,usecases:cases,kind:'delivery',...options};
    group.tasks.push(item); return item;
  }
  const fe = layer('frontend','交互层（前端）','#2563eb','只建设完成任务所需的表单、列表、状态与错误提示；基础可用性和无障碍不因省去美化而取消。');
  const fbase = capability(fe,'fe-base','基础页面与外部资料','只允许中国供应商和付款方在步骤一各自首次提交及修改本方资料。');
  task(fbase,'FE-01','基础页面骨架与任务导航',1,6,'前端开发','使用现成基础组件实现登录、任务目录、列表、详情和必要错误提示；不另建组件体系或品牌视觉。','可运行页面骨架及路由配置。','登录后能从任务列表进入详情和表单；会话失效后停止读取和提交。',['SEC-01']);
  task(fbase,'FE-02','双方首次提交及本方修订表单',1,10,'前端开发、测试','预取号、分别提交、原资料预填、字段校验及版本冲突；贸易代理商步骤一只读。','两套本方表单、版本比较及恢复交互。','首次中国供应商提交才创建交易；付款方资料不被他方覆盖；无邀请六方填报。',['FE-01','BL-01'],steps([1]));
  task(fbase,'FE-03','材料上传与确切版本查看',1,7,'前端开发','显示上传进度、扫描状态、用途及原件版本；失败保留草稿。','基础材料列表与受控查看入口。','上传完成不显示审核通过；无权原件不可下载。',['FE-01','BL-03']);
  const fops = capability(fe,'fe-ops','八阶段办理与审核页面','表单中的办理条件、经办审核分离和结果未知必须可读。');
  task(fops,'FE-04','协议、委任与签署证据页面',1,8,'前端开发、测试','签约依据、合同版本、公共协议适用及线下签署证据；不调用电子签署平台。','基础送审、退回、版本及签署核实页面。','已签与已生效分开；操作人不能审核本人版本。',['FE-03','BL-05'],steps([2]));
  task(fops,'FE-05','备货、运输及报关协同页面',1,10,'前端开发、测试','按批次填计划和事件；报关草稿送审、中国供应商书面确认及海关材料核实；不含关务资料库查询。','批次、草稿、确认和交付页面。','提货、到达、签收分开；报关改一栏也重新确认；正式办理由外部人工完成。',['FE-03','BL-06','BL-08'],steps([3,4]));
  task(fops,'FE-06','证明与退税人工协同页面',1,8,'前端开发、测试','准备材料、独审、正式渠道办理号、补正、证明交接和到账核对。','证明、退税任务页及来源查看。','未知或职责未确认可准备但不能假受理；证明确认与退税到账各自登记。',['FE-03','BL-10','BL-12'],steps([6,7]));
  task(fops,'FE-07','差异、暂停与正常结案页面',1,7,'前端开发、测试','显示逐项核对、独立案件、暂停原因、解除传播及正常结案条件。','异常队列、报告及逐原因解除页面。','关闭案件不自动解除暂停；任何未知项阻断正常结案。',['FE-01','BL-14'],steps([8]));
  task(fops,'FE-08','资金、发票与独立对账页面',1,10,'前端开发、资金测试','三位置、来款分配、发票、结算付款、原号查单、供应商到账及独立差异复核。','基础资金操作及证据追溯页面。','服务费单列；付款未知不提供重付或解锁入口；付款方只读已审有效发票。',['FE-03','FIN-04','FIN-06'],steps([5]));
  task(fops,'FE-09','前端流程回归与操作手册验收',1,7,'测试、前端开发','联查八阶段、未保存保护、角色字段、全名文案、错误恢复和基本浏览器兼容；不做视觉精修。','可重复流程测试、两份角色手册。','69用例均有页面或明确人工步骤；错误提示给出补救动作。',['FE-02','FE-04','FE-05','FE-06','FE-07','FE-08']);
  const fauto = capability(fe,'fe-auto','后续渠道页面增量','只计接入带来的新交互，不重复估算一期页面。');
  task(fauto,'FE-10','实名签署、物流回执与通知增量',2,9,'前端开发、测试','增加平台签署跳转、原签署任务恢复、物流来源和通知失败查看。','渠道状态与人工接管入口。','页面返回不表示签完；渠道失败不隐藏原任务。',['INT-05','INT-06','INT-07','FE-09'],['contract-sign','contract-activate','transport-progress']);
  task(fauto,'FE-11','官方办理及授权关务查询增量',3,10,'前端开发、测试','增加海关税务正式回执与授权关务信息查询，查询范围和时效有标记。','正式渠道结果及授权查询页面。','查询不扩展为他方全量申报数据；未授权和无通道有明确提示。',['INT-08','INT-10','FE-10'],steps([4,6,7]),{feature:'customs-lookup'});

  const bl = layer('business','业务层','#0f766e','按最新系统用例组织提交、查询、复核及原结果恢复；正式渠道未开放时保留受控人工办理。');
  const design = capability(bl,'bl-design','分期方案设计','按评审和差距补齐工作确定基线，再统一按2倍效率折算；保留完整范围与验收要求。');
  const btrade = capability(bl,'bl-trade','建档、资料及合同用例','一方一份资料、原资源修改和确切送审版。');
  task(btrade,'BL-01','交易预取号、首次提交与原资料修改',1,12,'交易后端、测试','实现四个建档用例、同号同文恢复、本方访问及付款关系变化保护。','建档命令、读取及冲突测试。','中国供应商首次提交原子创建交易；修改不另建资料或覆盖付款方声明。',['DM-01','SEC-02'],steps([1]));
  task(btrade,'BL-02','统一原受理恢复和版本冲突处理',1,8,'后端开发、测试','请求标识、确切响应、同文恢复、异文拒绝及重试前重新授权；通用能力不替代领域事实。','恢复组件及超时、重复、过期版本测试。','恢复返回首次响应而非最新资源；未知不换号重发。',['DM-01','SEC-02'],['logistics-query','s4-query','s6-query','s7-recovery','s8-query']);
  task(btrade,'BL-03','自建文件上传、扫描及版本授权',1,10,'文档后端、测试','接自部署存储和扫描，绑定文件用途与确切版本；不购买外部文件或识别服务。','文件服务及权限测试。','未扫描不能确认；访问实时核权；历史证据不可覆盖。',['DM-02','OPS-04','SEC-04']);
  task(btrade,'BL-04','签约依据汇总与独立审核',1,8,'交易后端、测试','读取双方本方资料、补齐本阶段必要项后送审；审核与填报送审分离。','签约依据命令及批准快照。','步骤一不终审建单；缺资质报价不批准；批准绑定当前源版。',['BL-01','BL-02','BL-03'],['basis-submit','basis-review']);
  task(btrade,'BL-05','合同、线下签署核实及逐单委托',1,12,'合同后端、测试','起草、审条款、更正、核实线下签署与生效；框架逐单引用、正式报关委托及预付认可。','合同用例与人工核实记录；签署渠道默认关闭。','新草稿不废旧有效版；三种合同用途分别管理；正式委托不能由流程图替代。',['BL-04','DM-03'],steps([2]).filter(id => !['basis-submit','basis-review'].includes(id)));
  const bflow = capability(bl,'bl-flow','履约与官方事项人工办理','一期在系统内审批和留证，在外部由有权人员办理，独立核实正式结果。');
  task(bflow,'BL-06','批次计划、分配及未执行更正',1,9,'物流后端、测试','批准商品行分批、计划改版与正式取消边界。','计划应用服务与累计占量检查。','累计不超批准量额；未知执行不释放占量。',['DM-04','BL-04'],['shipment-plan','shipment-amend']);
  task(bflow,'BL-07','备货、运输事件及异常独立核实',1,11,'物流后端、测试','提交备货、订舱、提货、运输、签收和异常，核实真实证据；不连承运商。','事件、证据复核及异常处置用例。','出境核实同批放行；多异常逐项关闭，不推导银行事实。',['BL-06','BL-03'],steps([3]).filter(id => !['shipment-plan','shipment-amend'].includes(id)));
  task(bflow,'BL-08','报关草稿、独立审核及供应商确认',1,12,'关务后端、测试','来源快照、完整草稿、修订、独审及中国供应商书面确认；不查外部关务信息库。','草稿与确认用例、版本差异及拒绝测试。','任何改动须新审核和本方确认；其他角色不能代确认。',['DM-05','BL-06','BL-03'],['s4-basis','s4-draft','s4-revision','s4-review','s4-confirm']);
  task(bflow,'BL-09','人工报关办理、回执核实及分别交付',1,11,'关务后端、测试','记录外部人工办理号、海关证据、正式更正撤回和原件交付；不调用海关或报关平台。','人工办理任务、证据复核、两方接收和历史恢复。','待核声明不改变正式状态；真实退单才更正；发出不等于两方接收。',['BL-08','BL-02'],['s4-filing','s4-official','s4-correction','s4-attachment','s4-query']);
  task(bflow,'BL-10','证明范围、材料版本及独立审核',1,10,'税务后端、测试','准备申请职责范围，建协作档案及材料送审；无正式职责依据只准备。','证明准备和审核用例。','不推定一交易一证明；退回新版本；报关代理协助不替代申请主体。',['DM-06','BL-09'],['s6-preparation','s6-cooperation','s6-materials','s6-review']);
  task(bflow,'BL-11','证明人工办理、官方证据与交接异议',1,12,'税务后端、测试','人工在主管渠道办理，系统核实回执、补正、证明、更正撤销、交付与异议。','正式证据核实及分别交接用例。','内部批准不当受理；供应商本人核对接收；更正须正式证据。',['BL-10','BL-02'],steps([6]).filter(id => !['s6-preparation','s6-cooperation','s6-materials','s6-review'].includes(id)));
  task(bflow,'BL-12','退税材料、独审及人工办理跟进',1,12,'税务后端、测试','备料确定版、独审、人工提交、通知补正及终局；不接税务渠道，不猜税率期限。','退税用例、来源与补正版本记录。','缺职责不正式提交；税务决定不当到账或正常结案。',['BL-11','DM-06'],steps([7]).filter(id => id !== 's7-credit'));
  task(bflow,'BL-13','退税实收权威查询及差异交接',1,7,'税务后端、资金后端','消费有权银行来源的供应商退税实收，独立核对；无观察权限返回未核实。','到账引用及资金差异协作接口。','不以代理商银行账户推定供应商到账；无权不可伪造零差异。',['BL-12','FIN-08'],['s7-credit']);
  const bclose = capability(bl,'bl-close','跨域核对、案件及正常结案','完整来源集合、逐原因暂停和实质差异处理。');
  task(bclose,'BL-14','逐项报告、差异责任与独立暂停',1,12,'合规后端、测试','冻结全部对象及源版本，生成逐项结果、分派案件和传播暂停。','核对报告及案件命令。','新对象使报告过期；未知阻断；暂停不覆盖生命周期。',['DM-07','BL-07','BL-09','BL-12','FIN-08'],['s8-context','s8-report','s8-assignment','s8-hold']);
  task(bclose,'BL-15','差异处置、更正、解除和案件关闭',1,11,'合规后端、测试','实质处置、原节点更正、逐原因独立解除与传播确认；资金差异交资金域。','处置及解除命令、闭环证据。','关案不解冻；解除一因不解其他；备注不能消除金额差。',['BL-14'],['s8-remedy','s8-correction','s8-release','s8-case-close']);
  task(bclose,'BL-16','正常结案独审与完整历史查询',1,8,'交易后端、测试','申请与决定时重核全部最新来源、到账、资金守恒和异常；仅正常结案。','结案命令、历史及原受理恢复。','不提供特殊结案；未知、未决执行、差异或有效暂停均拒绝。',['BL-15','BL-13'],['s8-closure-apply','s8-closure-review','s8-query']);
  task(bclose,'BL-17','一期全流程联合验收及人工岗位交接',1,12,'测试、业务验收负责人','以真实授权测试资料核验全部用例、银行边界、岗位分离、原受理恢复和人工凭据核实。','验收场景、缺陷关闭记录及人工操作交接。','69用例均有结果与异常路径；外部未接入功能不伪称自动执行。',['FE-09','BL-16','FIN-10','SEC-06','OPS-06']);
  task(bclose,'BL-18','第二期渠道编排与回退验收',2,12,'后端开发、测试','将签署、物流和通知适配挂到原用例，保留人工路径及明确切换控制。','按交易通道开关、迁移及回归报告。','未知原任务先核实，不能人工和自动重复签署或确认同一事件。',['INT-05','INT-06','INT-07','FE-10','OPS-07']);
  task(bclose,'BL-19','第三期官方渠道与结案联合验收',3,14,'后端开发、测试','联通海关、证明、退税、授权查询及独立资金证据，复核完整源集合和故障恢复。','正式渠道验收、迁移和人工回退清单。','接口成功不跳过书面确认、独审或银行到账核实。',['INT-08','INT-09','INT-10','INT-11','FE-11','SEC-08','OPS-08','FIN-12']);

  const dm = layer('domain','领域层','#7c3aed','以交易、合同、物流、关务、税务、资金和合规各自事实为边界，不在方案设计包之外重复估算需求评审。');
  const dbase = capability(dm,'dm-base','交易与证据规则实现','将方案评审结果落实为数据结构、约束及不变量测试。');
  task(dbase,'DM-01','交易快照、参与方及版本不变量',1,10,'领域后端、测试','实现交易根、双方资料、不可变修订、商品行及同号载荷摘要。','迁移脚本、约束、事件定义与单元测试。','仅人民币；他方声明不覆盖；修订可还原；摘要不承担认证。',[],steps([1,2]));
  task(dbase,'DM-02','原件版本、用途及保留不变量',1,7,'文档后端、测试','逻辑文件、确切版本、内容摘要、用途及历史授权。','证据引用结构与不可覆盖约束。','文件确认只表示可引用，不是业务审核或外部成功。',['DM-01']);
  task(dbase,'DM-03','合同用途、签署核实及生效规则',1,9,'合同后端、测试','三个逐单用途、框架适用、线下签署证据和独立生效条件。','合同与委托状态及不变量测试。','新版本不废旧有效版；正式委托独立核实。',['DM-02'],steps([2]));
  const dflow = capability(dm,'dm-flow','履约、税务及合规规则实现','域内状态独立，使用稳定业务引用传递证据。');
  task(dflow,'DM-04','物流计划占量及核实事件规则',1,9,'物流后端、测试','批次批准行分配、计划更正、核实运输事件及多异常恢复。','物流结构、约束及乱序测试。','提货不等于出境；到达不等于签收；累计数量金额不超额。',['DM-01'],steps([3]));
  task(dflow,'DM-05','报关修订、书面确认及正式事件规则',1,10,'关务后端、测试','完整草稿、来源版、独审、书面确认、正式回执及分别接收。','关务状态机、事件结构和更正约束。','技术失败不当官方退单；人工核实保留方式和责任人，不冒充数字验签。',['DM-02','DM-04'],steps([4]));
  task(dflow,'DM-06','证明、退税案件及确定版规则',1,11,'税务后端、测试','分开证明与退税事项、职责范围、材料版、机关事件、异议与到账引用。','税务结构、码表及补正约束。','未知不可改成功；正式处理完成不推导实际到账。',['DM-05'],steps([6,7]));
  task(dflow,'DM-07','完整核对报告、案件与暂停规则',1,10,'合规后端、测试','源版本集合、逐项结论、差异案件、多个暂停原因及正常结案不变量。','合规结构、源向量及并发约束。','新增对象使报告失效；关案不解除；资金差异只认权威关闭结果。',['DM-06','DM-08'],steps([8]));
  const dmoney = capability(dm,'dm-money','资金与账务规则实现','货款三位置与独立服务费分别记账。');
  task(dmoney,'DM-08','资金事务、三位置及账户版本规则',1,12,'资金后端、测试','真实实收、分配、可用释放、锁额、银行执行及供应商到账分离。','资金状态机、事件与防重复约束。','无授信垫资透支换汇；未知维持锁额；按稳定账户去重。',['DM-01'],steps([5]));
  task(dmoney,'DM-09','会计凭证、平衡和追加冲正规则',1,10,'账务后端、财务测试','按事件生成平衡凭证，实收释放锁额同本地事务记账；冲正新增。','记账规则、账户结构与平衡测试。','借贷相等且仅人民币；服务费从付款方可用余额转列，不减少中国供应商合同应付，不伪造银行扣款。',['DM-08']);
  task(dmoney,'DM-10','外部证据映射及跨渠道防重复',2,8,'领域后端、测试','增补自动回执来源、核实责任、原通道任务和人工事件关联。','事件映射版本及切换去重约束。','保留一期历史来源，不以自动事件覆盖人工核实记录。',['DM-03','DM-04','BL-17']);
  task(dmoney,'DM-11','官方事件、授权数据源及规则改版',3,10,'领域后端、测试','确定海关税务官方事件键、主管规则、查询许可及过期处理。','规则版本、查询范围结构与历史兼容测试。','来源缺失不可默认通过；规则升级不改历史批准含义。',['DM-10']);

  const integration = layer('integration','外部对接层','#0891b2','一期仅银行外联。自部署存储、身份和扫描属于内部基础设施，不用外部服务绕过一期边界。');
  const ibank = capability(integration,'int-bank','首家银行及能力缺口','估算以首家银行、单一人民币渠道为基线，银行审批和开放范围不承诺由项目控制。');
  task(ibank,'INT-01','银行能力清单、认证及验签实现',1,10,'银行集成、测试','按已确认接口实现认证、证书及密钥、验签、超时；清单区分开放与人工环节。','银行适配器及真实测试环境验证。','缺测试授权即阻断上线；不假设银行支持付款或贸易核验接口。',['DM-08','SEC-05'],[],{channel:'bank'});
  task(ibank,'INT-02','银行实收、余额及对账文件接入',1,12,'银行集成、测试','适配开放的实收通知、余额、账单；未开放采用银行原始文件受控导入和独立核实。','流水接收、导入校验及差异隔离。','同键异文告警；余额只表示银行观察，不直接代表本交易可用。',['INT-01'],['s5-n11-receipt'],{channel:'bank'});
  task(ibank,'INT-03','银行核验、可用证据及付款结果接入',1,14,'银行集成、测试','仅对开放能力提交核验、付款和查单；否则授权人员网银办理并由独立人员核实原号结果。','版本化银行状态映射、原号查询和人工执行边界。','银行未知不重付不解锁；收款方到账另核；人工记录不能伪造渠道成功。',['INT-01','FIN-06'],['s5-n14-verification-release','s5-n16-payment'],{channel:'bank'});
  task(ibank,'INT-04','银行契约、故障及人工接管联调',1,9,'银行集成、测试','验证签名失败、超时、重复、晚到、部分成功和缺少接口；含银行共同验收。','银行联调记录与人工切换操作说明。','开放范围与配置一致；无确认结果保持未知；不以模拟器代正式验收。',['INT-02','INT-03'],[],{channel:'bank'});
  const ilater = capability(integration,'int-later','第二期第三方渠道','每个渠道单独授权、单独启用，可保留一期人工路径。');
  task(ilater,'INT-05','第三方实名签署及原结果恢复',2,15,'签署集成、测试','对接一家平台实名签署、企业用章授权、回调及确切签署文件核验。','签署适配器及正文摘要、证书、原任务恢复测试。','回调不直接生效；活跃或未知原任务不另签。',['DM-10','SEC-07','BL-17'],['contract-sign','contract-activate'],{channel:'signing'});
  task(ilater,'INT-06','首家物流服务方事件接入',2,12,'物流集成、测试','受托批次、运输区段、原始回执、签收及异常映射；不代替海关证据。','物流适配与重复乱序测试。','同一事实不因人工与自动重复推进；出境必须已有核实放行。',['DM-10','SEC-07'],['booking-pickup','transport-progress','logistics-exception'],{channel:'logistics'});
  task(ilater,'INT-07','短信邮件通知及失败接管',2,7,'消息集成、测试','接入选定通知渠道，模板最小化字段、限频及失败重试，业务待办仍为系统权威。','通知适配、投递记录及退订权限检查。','发送成功不改变审批或外部业务状态；失败可在站内待办处理。',['SEC-07','BL-17'],[],{channel:'notification'});
  const iofficial = capability(integration,'int-official','第三期主管渠道与关务查询','获正式授权后逐一接入；无合法来源维持人工核实并停止自动办理。');
  task(iofficial,'INT-08','海关正式办理与回执适配',3,18,'关务集成、测试','申报、更正、撤回、原号查询与受理查验放行的正式证据；不跳过供应商书面确认。','正式渠道映射、验签去重和联调报告。','技术拒绝不写官方退单；未知原号恢复；人工与自动共用防重复控制。',['DM-11','SEC-08'],steps([4]),{channel:'customs'});
  task(iofficial,'INT-09','证明与退税主管渠道接入',3,20,'税务集成、测试','只接已确认职责范围的证明、退税提交、进度及补正；实际到账仍走资金权威。','证明与退税适配、权限和官方联调。','不猜申请主体和税率期限；证明撤销影响相关用例，正式受理不当到账。',['DM-11','SEC-08'],steps([6,7]),{channel:'tax'});
  task(iofficial,'INT-10','授权关务信息查询及数据时效',3,12,'关务集成、测试','按许可查询商品编码、申报要素及本企业有权申报信息，保留来源、版本和时效。','授权数据查询、审计及限流接口。','不公开全企业数据；无授权拒绝；查询结果不能代替归类判断或正式申报。',['INT-08','SEC-08'],[],{channel:'customs-data',feature:'customs-lookup'});
  task(iofficial,'INT-11','外部合规名单筛查与人工复核',3,8,'合规集成、测试','按最小字段接入选定合法数据源，保留名单版本及人工复核。','筛查适配、命中解释和误报处置。','命中不自动成为法定结论；供应商故障时缺项阻断，不默认通过。',['SEC-08','DM-11'],[],{channel:'screening'});

  const ops = layer('infrastructure','底层基础设施','#475569','部署工作包括机房、网络、中间件、持续集成与持续交付、监控和恢复；不实际执行采购或生产部署。');
  const obase = capability(ops,'ops-base','一期机房及自部署底座','单体应用与必要中间件起步，不因完整业务流程提前建设复杂服务集群。');
  task(obase,'OPS-01','机房资源、隔离网络及环境落地',1,9,'基础设施、运维','按评审方案配置开发测试生产隔离、银行出口白名单、证书和最小管理入口。','环境配置、网络策略及连通记录。','除批准银行外无业务外联；管理入口有授权审计。',['SEC-01']);
  task(obase,'OPS-02','应用与数据库部署及迁移',1,10,'运维、数据库工程师','部署单体应用、关系数据库、事务索引和兼容迁移。','部署脚本、迁移回退及事务验证。','迁移失败可回退；银行调用不在长数据库事务内。',['OPS-01','DM-01']);
  task(obase,'OPS-03','自部署任务、缓存与会话边界',1,7,'平台开发、运维','采用数据库持久待办与任务；确有需要才部署缓存，不把缓存当资金权威。','任务重试、查单调度、会话撤销和故障说明。','任务重复不重执业务；缓存故障不改变余额和授权。',['OPS-02','SEC-02']);
  task(obase,'OPS-04','私有文件存储、扫描及密钥设施',1,9,'平台运维、存储工程师','自部署对象存储、恶意文件扫描和密钥设施，隔离临时与正式文件。','存储版本策略、扫描隔离及备份配置。','不调用外部扫描服务；原件不可覆盖；未扫描不可读取为正式材料。',['OPS-01']);
  task(obase,'OPS-05','持续集成、制品与发布回退',1,9,'交付工程师、测试','搭建内部构建、测试、依赖检查、制品签名和双人发布流程。','持续集成与持续交付流水线、制品清单。','未授权不发布；失败回退已演练；不以人工改库恢复通过状态。',['OPS-02','SEC-04']);
  task(obase,'OPS-06','日志告警、备份恢复及试运行交接',1,11,'运维、测试','部署脱敏追踪、资金异常告警、数据库文件备份和恢复演练。','监控、恢复记录及值班交接。','恢复后资金凭证和原请求可核对；未决银行任务明确接管。',['OPS-03','OPS-04','OPS-05','FIN-09']);
  const ogrow = capability(ops,'ops-growth','后续渠道运行保障','只计新增通道的配置、演练及必要容量增量。');
  task(ogrow,'OPS-07','第二期渠道隔离与故障演练',2,8,'运维、测试','增加签署、物流和通知最小出口，按通道设置限流、证书及告警。','通道运行配置及回退演练。','通道故障不影响一期材料读取和已核实资金。',['OPS-06','INT-05','INT-06']);
  task(ogrow,'OPS-08','第三期官方渠道容量与恢复',3,10,'运维、数据库工程师','主管渠道队列、限流、证书更新、查询容量和灾备核对。','渠道容量验证及恢复操作说明。','恢复不重复申报和付款；跨域证据可还原；正式渠道许可先满足。',['OPS-07','INT-08','INT-09']);

  const sec = layer('security','安全工作','#b42318','身份、对象字段权限、密钥和资金职责分离在一期完成，不以界面简化削减。');
  const sbase = capability(sec,'sec-base','一期自建身份及数据保护','一期不接第三方身份服务，采用自建账号和本地强认证；银行身份认证归银行通道。');
  task(sbase,'SEC-01','自建账号、强认证及撤权',1,9,'身份开发、安全测试','实现账号启停、强认证、会话到期撤销及受控开户；不接外部身份提供方。','自建身份服务及撤权测试。','演示角色切换不能成为生产授权；停用立即失权。');
  task(sbase,'SEC-02','交易对象、字段及职责分离授权',1,10,'身份开发、安全测试','按主体、受托关系、岗位和操作人校验读取、命令、审批及执行。','服务端授权矩阵与越权测试。','步骤一仅两方提交；经办审核执行分离；直接请求也拒绝越权。',['SEC-01']);
  task(sbase,'SEC-03','威胁控制、数据分类与审计实现',1,9,'安全开发、后端','落实批准的信任边界、敏感字段脱敏、追加审计和下载访问控制。','安全控制及审计事件落地。','原件账号不入日志；业务接口不能删除历史；拒绝事件可追溯。',['SEC-02','DM-02']);
  task(sbase,'SEC-04','接口、上传及构建安全基线',1,9,'安全开发、测试','参数校验、会话防护、请求限流、安全响应头和内部依赖扫描。','安全配置、上传攻击及依赖检查。','伪造请求、恶意文件及越权被拒；不向外部扫描平台发送代码或单证。',['SEC-03']);
  task(sbase,'SEC-05','银行密钥、证书与轮换实现',1,8,'安全开发、运维','银行签名、加密、载荷摘要等密钥分权托管与版本轮换。','密钥配置及恢复测试。','密钥不入代码和日志；过期或验签失败不生成资金成功。',['OPS-04','SEC-03']);
  task(sbase,'SEC-06','一期安全验证及修复复测',1,10,'安全测试、开发','验证资金越权、重放、回调、上传、人工证据及部署面，修复并复测。','缺陷与复测记录、上线安全结论。','高风险路径关闭；不可用外部能力不能被手工状态绕过。',['SEC-04','SEC-05','FIN-07']);
  const sgrow = capability(sec,'sec-growth','后续供应商及主管权限','新增渠道逐一审查，不能复用银行授权。');
  task(sgrow,'SEC-07','签署物流通知授权与隐私控制',2,9,'安全开发、安全测试','供应商数据范围、回调验签、最小出口、通知模板和日志字段。','渠道授权矩阵及安全测试。','回调来源、正文版本及接收方匹配；新增外联须明确批准。',['SEC-06']);
  task(sgrow,'SEC-08','官方渠道许可、查询隔离与安全复测',3,11,'安全开发、安全测试','海关税务证书、企业授权、关务查询数据许可、导出隔离及回调保护。','主管权限证据与安全复测。','不能查询别企业资料；证书撤销即停用；人工导入仍实时核权。',['SEC-07']);

  const fin = layer('funds','资金与对账工作','#b7791f','实收、分配、释放、锁额、付款和账务分别留证；对账使用独立重算路径。');
  const fcore = capability(fin,'fin-core','一期收款、付款及账务','银行是否开放接口不改变资金守恒、证据和职责分离。');
  task(fcore,'FIN-01','收付账户版本及银行实收入账',1,11,'资金后端、财务测试','核实账户持有人和稳定指纹，消费真实银行或独立核实原始文件，防重复入账。','账户与实收服务、凭证及隔离队列。','付款方自报不当实收；不同账户配置版不重复产生余额。',['DM-08','DM-09','INT-02'],['s5-n11-receipt']);
  task(fcore,'FIN-02','来款拆分、交易分配及独立复核',1,10,'资金后端、财务测试','一款多交易及一交易多款，保存批准依据和未匹配受限额。','分配、撤销替代与复核服务。','合计不超实收；待复核不当可付；撤销不删除旧记录。',['FIN-01','BL-04'],['s5-n12-allocation']);
  task(fcore,'FIN-03','付款发票申报及版本管理',1,10,'资金后端、财务测试','确切发票版、独审、付款方只读；申报及补正不触发服务费结算。','不可变发票申报、补正和受理记录。','INVOICE不得生成服务费单据或银行收款事实。',['FIN-02','BL-05'],['s5-n13-invoice-fee']);
  task(fcore,'FIN-04','贸易核验及按真实可用额释放',1,10,'资金后端、账务测试','绑定实际核验范围和银行可用证据，支持部分释放与受限余额。','核验、释放及凭证服务。','内部通过不等于银行可用；缺证、不足或重复范围不能释放。',['FIN-03','DM-09'],['s5-n14-verification-release']);
  task(fcore,'FIN-05','结算、预付款与出口后付款条件',1,11,'资金后端、财务测试','冻结批准版、A合同应付/已付/锁额、D服务费授权及可用余额、银行实际费用和两类付款证据。','结算试算、首次分账服务费结算、分支条件及独立审批。','首次获批分账时按trade唯一键从D可用余额结算300元，不减少A合同应付；正式委托及放行按适用范围核实。',['FIN-04','BL-09','BL-05'],['s5-n15-settlement']);
  task(fcore,'FIN-06','独立付款审批、锁额及执行意图',1,12,'资金后端、账务测试','锁额与凭证同事务，执行意图固定原号；银行调用事务外，未开放则受控网银人工执行。','付款审批、锁额及执行任务。','审批、经办、执行分离；未知保持锁额；人工失败须明确未扣款证据才能解锁。',['FIN-05','SEC-02'],['s5-n16-payment']);
  task(fcore,'FIN-07','银行结果与供应商到账分别核实',1,9,'资金后端、财务测试','关联银行扣款、明确失败、迟到回执和供应商本方到账。','结果处理、原号恢复及到账确认。','银行扣款不等于收款；超时不新号重付；未接收款账户权威仍待核。',['FIN-06','INT-03'],['s5-n16-payment']);
  const frec = capability(fin,'fin-reconcile','独立重算、差异及分期增量','差异处置不直接修改余额。');
  task(frec,'FIN-08','独立银行对账及差异处置复核',1,12,'对账开发、财务测试','按银行原始账单独立匹配实收付款和账务，处理漏记、重复、金额及状态差。','对账报告、差异案件及新增冲正凭证。','对账计算不复用记账函数；未解决差异继续限制；双人复核。',['FIN-07'],['s5-n17-reconciliation']);
  task(frec,'FIN-09','日终三位置、账务与占用独立重算',1,9,'账务开发、对账测试','独立检查资金守恒、借贷平衡、账户实收及未决付款占用。','独立重算作业和差异告警。','新增事件不覆盖历史；可定位原交易、凭证与流水。',['FIN-08']);
  task(frec,'FIN-10','一期资金并发、故障及银行验收',1,11,'资金测试、银行联调','并发分配释放付款、重复回调、未知晚到、人工查单和恢复演练。','资金验收及银行能力缺口记录。','无超额、重复付款和未知解锁；真实接口与人工路径分别通过。',['FIN-09','INT-04']);
  task(frec,'FIN-11','第二期证据切换与资金条件回归',2,8,'资金测试、后端','签署与物流自动证据接入后重验付款条件、版本失效及结算来源。','增量资金回归及证据切换记录。','外部签署或物流成功不自动释放资金；旧依据不静默变更。',['BL-18','FIN-10']);
  task(frec,'FIN-12','第三期官方事实与退税到账联核',3,10,'资金开发、对账测试','核对正式放行、税务结果、供应商退税实收权威及正常结案完整来源。','跨域资金验收及缺权阻断测试。','退税入供应商不增代理商货款；无观察权继续未知。',['INT-09','FIN-11'],['s7-credit','s8-closure-review']);

  const packageIndex = new Map();
  const allTasks = [];
  for (const item of layers) for (const group of item.capabilities) for (const work of group.tasks) {
    const entry = {layer:item,capability:group,task:work};
    if (packageIndex.has(work.id)) throw new Error('重复工作包编号：' + work.id);
    packageIndex.set(work.id,entry); allTasks.push(entry);
  }
  function subtaskDays(id) {
    const definition = definitions[id];
    if (!definition || !definition.steps.length) throw new Error('工作包缺少具体子任务：'+id);
    return definition.steps.reduce((sum,step) => sum+step.personDays,0);
  }
  for (const {task:work} of allTasks) {
    work.previousPersonDays = work.personDays;
    const days = subtaskDays(work.id);
    work.personDays = days;
  }
  for (const phase of phases) {
    const designId = 'DES-' + phase.id;
    const previousDeliveryDays = allTasks.filter(entry => entry.task.phase === phase.id).reduce((sum,entry) => sum + entry.task.previousPersonDays,0);
    const designDays = subtaskDays(designId);
    task(design,designId,'第'+phase.id+'期方案设计与范围确认',phase.id,designDays,'产品与架构（含安全、测试评审）',
      '确认本期用例、数据和接口变更、人工办理边界、安全、实施依赖及验收方案，形成各工作包可直接使用的设计与交接要求。',
      '冻结的范围清单、字段和接口方案、安全及验收设计、估算基线。',
      '设计人日按完整工作2倍效率折算，范围与验收要求保留；业务负责人确认办理主责，银行或主管接口缺口写入阻断与人工路径。',
      phase.id === 1 ? [] : phase.id === 2 ? ['BL-17'] : ['BL-18','FIN-11'],[],{kind:'design'});
    const work = design.tasks.at(-1);
    work.previousPersonDays = Math.ceil(previousDeliveryDays * 0.08 / 0.92);
    const entry = {layer:bl,capability:design,task:work}; packageIndex.set(work.id,entry); allTasks.push(entry);
    for (const entry of allTasks) if (entry.task.phase === phase.id && entry.task.kind !== 'design') entry.task.dependencies.unshift(designId);
  }
  const completionDependencies = {
    'BL-01':['BL-02'],'BL-03':['BL-02'],
    'FE-05':['BL-07','BL-09'],'FE-06':['BL-13'],'FE-07':['BL-16'],'FE-08':['FIN-08'],
    'SEC-06':['BL-16','FE-09','OPS-05'],
    'FE-11':['INT-09'],'OPS-07':['INT-07'],'OPS-08':['INT-10']
  };
  for (const [id,dependencies] of Object.entries(completionDependencies)) {
    for (const dependency of dependencies) if (!packageIndex.get(id).task.dependencies.includes(dependency)) packageIndex.get(id).task.dependencies.push(dependency);
  }
  for (const {task:work} of allTasks) {
    const audit=definitions[work.id].audit;
    if (!audit) continue;
    work.dependencies=work.dependencies.filter(id=>!audit.dependencyChanges.remove.includes(id));
    for (const id of audit.dependencyChanges.add) if (!work.dependencies.includes(id)) work.dependencies.push(id);
  }
  for (const entry of allTasks) {
    for (const id of entry.task.dependencies) {
      const dependency = packageIndex.get(id);
      if (!dependency) throw new Error(entry.task.id+'前置不存在：'+id);
      if (dependency.task.phase > entry.task.phase) throw new Error(entry.task.id+'依赖未来期：'+id);
    }
    for (const id of entry.task.usecases) if (!useCases.some(item => item.id === id)) throw new Error('未知系统用例：'+id);
  }
  const visited = new Set(), active = new Set();
  function visit(id) {
    if (active.has(id)) throw new Error('工作包依赖成环：'+id);
    if (visited.has(id)) return;
    active.add(id); packageIndex.get(id).task.dependencies.forEach(visit); active.delete(id); visited.add(id);
  }
  allTasks.forEach(entry => visit(entry.task.id));
  for (const item of useCases) if (!allTasks.some(entry => entry.task.phase === 1 && entry.task.usecases.includes(item.id))) throw new Error('一期缺少用例人工或自动实现：'+item.id);
  const efficiency = 2;
  const roundPersonDays = value => Math.ceil(value*2)/2;
  for (const {task:work} of allTasks) {
    work.baselinePersonDays=work.personDays;
    work.personDays=roundPersonDays(work.baselinePersonDays/efficiency);
  }
  const phaseTotals = phases.map(phase => {
    const tasks = allTasks.filter(entry => entry.task.phase === phase.id).map(entry => entry.task);
    const designDays = tasks.filter(item => item.kind === 'design').reduce((sum,item) => sum+item.personDays,0);
    const personDays = tasks.reduce((sum,item) => sum+item.personDays,0);
    const previousPersonDays = tasks.reduce((sum,item)=>sum+item.previousPersonDays,0);
    const riskDays = tasks.reduce((sum,item)=>sum+(definitions[item.id].risk?roundPersonDays(definitions[item.id].risk.extraDays/efficiency):0),0);
    const baselinePersonDays=tasks.reduce((sum,item)=>sum+item.baselinePersonDays,0);
    const baselineDesignDays=tasks.filter(item=>item.kind==='design').reduce((sum,item)=>sum+item.baselinePersonDays,0);
    return {...phase,personDays,baselinePersonDays,
      savedPersonDays:baselinePersonDays-personDays,previousPersonDays,riskDays,designDays,deliveryDays:personDays-designDays,
      designRatio:designDays/personDays,baselineDesignRatio:baselineDesignDays/baselinePersonDays,packages:tasks.length};
  });
  const estimateBasis = {
    status:'基于现有资产的计划估算，未采集实际工时；须由实名责任人复核认领后成为排期基线。',
    personnel:'熟悉业务的高级工程师，采用成熟组件与单体架构，无现成生产业务后端；每包两人合计人日，不是每人各计一份。',
    reuse:'复用已形成的69用例、协议、原型、47表设计DDL、语义断言及本机MySQL、RustFS、ClamAV、监控脚本；只抵扣重复设计、样例和选型，不把验证器当生产实现。',
    capacity:'按首家银行、已提供计算网络资源、开发测试生产参数化部署估算；生产容量、可用性和恢复目标须DES-1评审冻结，异地双活或新增机房施工另估。',
    scope:'一期完整八阶段协同，银行按已开放能力对接；其他外部人工办理并独立核实。无界面美化、关务信息查询或非银行外联。',
    counting:'领域包只计结构、仓储、不变量及领域测试；业务包只计应用编排与集成；前端、渠道、运维、安全和资金各计本包代码。专项验收只计跨包演练。共用审核和恢复复用同一实现，不按用例重建。',
    exclusions:'不含银行或主管审批等待、采购费用、日常业务运营人日；不自动折算为团队日历工期。已列条件增量同样按2倍效率折算并向上取整至0.5人日，发生时另行确认。',
    calibration:'本轮审计前一期437、二期96、三期134人日。按具体范围增减重估受影响工作包，单纯文字细化不增加预算；审计前后差异见逐包记录。',
    ai:'按用户指定，三期全部工作均按2倍效率估算，包含设计、开发、测试、复核、联调、部署和交接。每个工作包按原基线÷2，并向上取整至0.5人日；各层和各期直接汇总工作包，不对汇总再取整。子任务只说明具体工作、处理逻辑、预期结果及测试方法，不分配工时。2倍效率为未实测的计划假设，不降低权限、证据或验收要求。'
  };
  const profiles = {
    frontend:{
      owner:'高级前端工程师',reviewer:'前端测试与接口复核负责人',
      boundary:'复用任务和字段模型；仅建设生产基础页面和真实接口绑定，不改写服务端授权或领域状态。',
      sources:['交付成果/assets/product-guide-model.js','交付成果/assets/product-guide-workspace.js','交付成果/assets/product-guide-state.js','doc/generate-product-guides.cjs'],
      tests:['同一交易的保存、提交、退回、过期版本与未保存保护。','无权限、会话到期、接口失败、结果未知及375像素宽度。'],
      checks:['node --test 交付成果/assets/tests/product-guide.test.cjs']
    },
    business:{
      owner:'高级业务后端工程师',reviewer:'业务集成测试负责人',
      boundary:'负责应用命令、授权接入和跨域编排；复用领域仓储、统一恢复、审核与文件能力，不重复实现资金记账。',
      sources:['doc/步骤一身份签名与可靠性设计.md','交付成果/assets/domain-model.js','doc/sql/domain/README.md'],
      tests:['原请求重复同文、异文、撤权后恢复和当前强版本冲突。','经办审核分离、上游改版、源证据不足及人工声明不得生成官方成功。'],
      checks:['node doc/sql/domain/generate.cjs --check']
    },
    domain:{
      owner:'高级领域后端工程师',reviewer:'领域规则与事务测试负责人',
      boundary:'只实现数据结构、仓储和领域约束；复用现有生成DDL及断言，不在本包再次建设应用接口或页面。',
      sources:['交付成果/assets/domain-model.js','doc/sql/domain/schema.sql','doc/sql/domain/README.md'],
      tests:['非法状态、并发版本、不可变历史和金额数量精度。','事务失败回滚、同键重复及业务源版变化。'],
      checks:['node doc/sql/domain/generate.cjs --check']
    },
    integration:{
      owner:'高级渠道集成工程师',reviewer:'渠道契约测试负责人',
      boundary:'只负责真实通道协议、原始观察和错误映射；不得直接改余额、生效合同或正式领域状态。',
      sources:['doc/步骤一身份签名与可靠性设计.md','doc/步骤五系统用例与接口协议.md'],
      tests:['错误签名、重复与异文、乱序、超时未知及原号恢复。','人工自动切换、防重复执行、权限到期和正式渠道与模拟器区分。'],
      checks:['node doc/sql/step5/generate.cjs --check']
    },
    infrastructure:{
      owner:'高级平台运维工程师',reviewer:'部署恢复验证负责人',
      boundary:'复用本机基础设施脚本做生产参数化和运行控制；不把本机服务可用当作生产部署完成，不执行未授权迁移或采购。',
      sources:['infra/local/README.md','infra/local/compose.yaml','infra/local/observability/compose.yaml','doc/方案验证中间件环境说明.md'],
      tests:['生产参数、最小权限、环境隔离、重启及回退。','备份恢复后确切证据和原任务一致，不重复执行银行动作。'],
      checks:[],
    },
    security:{
      owner:'高级身份与安全工程师',reviewer:'独立安全测试负责人',
      boundary:'复用成熟组件，实施身份、对象字段授权和安全基线；银行协议实现归渠道包，资金业务门禁归资金包。',
      sources:['doc/步骤一身份签名与可靠性设计.md','交付成果/assets/audit-design.js','doc/方案验证中间件环境说明.md'],
      tests:['跨主体访问、经办审核同人、重放、撤权和精确意图确认。','拒绝路径审计、日志脱敏、上传危险内容和密钥失效。'],
      checks:['node --test 交付成果/assets/tests/product-guide.test.cjs']
    },
    funds:{
      owner:'高级资金账务工程师',reviewer:'独立财务规则测试负责人',
      boundary:'复用领域和平衡记账引擎，负责业务事件事务、资金控制和独立对账；不得复用记账计算伪作独立对账。',
      sources:['doc/步骤五系统用例与接口协议.md','doc/金融账务系统数据库规范手册.md','doc/sql/step5/transaction-recipes.sql','doc/sql/step5/verify-domain-rules.cjs'],
      tests:['金额精度、总分守恒、借贷平衡、重复与并发超额。','银行实收、银行可用、扣款和供应商到账分离；未知不重付不解锁。'],
      checks:['node doc/sql/step5/generate.cjs --check']
    }
  };
  const invariants = [
    '中国供应商首次提交才创建交易；付款方独立提交，步骤一贸易代理商只读。签约依据独审在步骤二。',
    '经办人不能审核本人提交版；资料改版使相关批准失效。最终报关草稿由中国供应商本人授权书面确认。',
    '货款只按人民币受限、可用、付款锁额管理；银行实收、可用、扣款和收款方到账各自核实。',
    '首次获批分账时每交易从D已核验可用余额结算固定人民币300元服务费；须有D授权和收费依据，不减少A合同应付，INVOICE申报不触发收费。',
    '原结果未知沿原号恢复；不得重复执行、无证释放锁额或正常结案。多原因暂停分别处理，关案不自动解除。',
    '人工录入形成待核声明；正式事实必须有权威来源和独立核实，不能伪造验签、主管受理或银行成功。',
    '无垫资、授信、透支、换汇或特殊结案；不因工期缩短删除资金、安全和证据控制。'
  ];
  const auditCaveats=[
    '服务费已按用户确认统一为付款方承担固定人民币300元，首次获批分账时从已核验可用余额结算event12；发票不触发，中国供应商合同应付不减少。正式收费启用仍须核实合同依据、付款方授权、票据和收入确认，缺证不能完成本次分账。',
    '来源引用保存交付时文件摘要及行号；文件摘要不一致时须重新核对对应契约，不将旧行号或测试定义当现行批准。'
  ];
  const additionalSteps = {
    'FE-01':[1],'FE-03':[1],'FE-09':[1,2,3,4,5,6,7,8],'BL-03':[1],
    'DM-02':[1],'DM-09':[5],'INT-01':[5],'INT-04':[5],
    'FIN-09':[5],'FIN-10':[5],
    'SEC-01':[1],'SEC-02':[1],'SEC-03':[1],'SEC-04':[1],'SEC-05':[1,5],'SEC-06':[1,5],
    'BL-18':[2,3],'BL-19':[4,6,7,8],'DM-10':[2,3],'DM-11':[4,6,7],
    'INT-07':[2,3],'OPS-07':[2,3],'OPS-08':[4,6,7],'SEC-07':[2,3],'SEC-08':[4,6,7],
    'FIN-11':[2,3,5]
  };
  for (const {layer:parent,capability:group,task:work} of allTasks) {
    const definition=definitions[work.id];
    const audit=definition.audit;
    const profile=profiles[parent.id];
    if (audit) work.usecases=work.usecases.filter(id=>audit.useCaseIds.includes(id));
    work.subtasks=definition.steps.map((step,index)=>({
      id:work.id+'-S'+(index+1),action:step.action,logic:step.logic,expected:step.expected,test:step.test
    }));
    if (work.subtasks.some(step=>!step.action || !step.logic || !step.expected || !step.test)) throw new Error('子任务功能说明不完整：'+work.id);
    const associated=useCases.filter(item=>work.usecases.includes(item.id));
    const supportingSteps=additionalSteps[work.id] || (associated.length?[]:[1,2,3,4,5,6,7,8]);
    const related=useCases.filter(item=>audit ? audit.useCaseIds.includes(item.id) : work.usecases.includes(item.id) || supportingSteps.includes(item.step));
    work.relatedUseCases=related.map(item=>({
      id:item.id,name:item.name,code:item.code,step:item.step,document:item.document,
      relationship:work.usecases.includes(item.id)?'直接实现':work.kind==='design'?'设计覆盖':'共用支撑'
    }));
    const sources=new Set(profile.sources);
    for (const item of related) {
      sources.add(item.source);sources.add(item.document);sources.add(item.proto);
      for (const endpoint of item.endpoints) sources.add(endpoint.source);
      sources.add('doc/sql/step'+item.step+'/generate.cjs');
      sources.add('doc/examples/step'+item.step+'/http-reference.md');
    }
    for (const step of additionalSteps[work.id] || []) {
      sources.add('doc/'+stepDocuments[step-1]+'.md');
      sources.add('交付成果/assets/'+modules[step-1]+'-usecases-model.js');
      sources.add('doc/sql/step'+step+'/generate.cjs');
    }
    if (work.kind==='design') {
      for (let step=0;step<8;step++) sources.add('doc/'+stepDocuments[step]+'.md');
      sources.add('infra/local/README.md');
    }
    const dependencies=work.dependencies.map(id=>{
      const {task:input}=packageIndex.get(id);
      const auditedInput=audit?.inputs.find(item=>item.dependencyId===id);
      return {id,title:input.title,requiredOutput:input.deliverable,acceptance:input.acceptance,
        interfaceBoundary:auditedInput?.consumes || '消费本期已批准的范围、人工与自动边界及本包接口和验收决策。',
        contract:auditedInput?.contract || '本期方案设计冻结记录；未批准不得按推测实现。',
        handoffTest:auditedInput?.test || '核对本包范围、接口待定项和验收场景已完成签认。'};
    });
    work.traceability=work.subtasks.map((step,index)=>({
      subtaskId:step.id,
      useCases:related.filter(item=>audit?.subtaskLinks[index]?.useCaseIds.includes(item.id)).map(item=>({
        id:item.id,name:item.name,code:item.code,
        relationship:step.logic.includes('共用支撑')?'共用支撑':work.relatedUseCases.find(value=>value.id===item.id).relationship
      })),
      flowNodes:flowNodes.filter(item=>audit?.subtaskLinks[index]?.nodeIds.includes(item.id))
    }));
    work.flowNodes=flowNodes.filter(item=>audit?.nodeIds.includes(item.id));
    work.audit=audit?{
      agent:audit.agent,status:audit.status,summary:audit.summary,before:audit.before,
      estimateChange:audit.estimateChange,dependencyChanges:audit.dependencyChanges,
      sourceReferences:audit.sourceReferences,subtaskLinks:audit.subtaskLinks,subtaskChanges:audit.subtaskChanges,review:audit.review || null
    }:null;
    work.estimate = {
      previousPersonDays:work.previousPersonDays,personDays:work.personDays,
      baselinePersonDays:work.baselinePersonDays,efficiency,minimumUnit:0.5,rounding:'工作包向上取整至0.5人日',
      savedPersonDays:work.baselinePersonDays-work.personDays,
      method:audit?.estimateChange?'按审计发现的实际范围增减逐项重估':work.phase===1?'按具体子任务逐项重估，审计未增加范围':'保留审计前预算，仅细化实施与联调说明',
      rationale:definition.rationale,
      included:'工作包包含实现、对应测试、缺陷修复和交接的合计投入；全部工作均按2倍效率折算，子任务不单列工时。',
      risk:definition.risk?{...definition.risk,baselineExtraDays:definition.risk.extraDays,extraDays:roundPersonDays(definition.risk.extraDays/efficiency)}:null
    };
    work.executionContext = {
      id:work.id,title:work.title,phase:work.phase,layer:parent.title,capability:group.title,
      mission:work.scope,
      dispatchInstructions:'只承接本工作包。先阅读来源和前置交付，核实本期人工与自动边界，再依次完成子任务。对未定接口或规则停止并报告，不替其他包改写共享模块。子任务可委托SubAgent，主责须复核实际改动与执行证据；本说明不授予生产部署、共享服务变更或真实资金操作权限。',
      assignment:{status:'岗位占位，未分派实名责任人。由项目负责人指派主责和复核人后开工。',
        owner:work.kind==='design'?'产品与高级架构负责人':profile.owner,
        reviewer:work.kind==='design'?'方案与业务验收复核负责人':profile.reviewer,
        ownerDuty:'确认输入和边界，负责本包实现、测试、估算更新及交付；子任务可交给SubAgent，但主责仍须复核。',
        reviewerDuty:'独立核对验收证据、接口契约和变更范围，不能用生成结论代替实际执行记录。',
        headcount:2},
      estimate:work.estimate,subtasks:work.subtasks,
      audit:work.audit,traceability:work.traceability,flowNodes:work.flowNodes,
      integrationScenarios:audit?.integrationScenarios || [],
      openQuestions:audit?.openQuestions || [],
      sourceReferences:[...(audit?.sourceReferences || []),...[...sources].filter(file=>!audit?.sourceReferences.some(ref=>ref.path===file)).map(file=>({path:file,locator:'以关联用例稳定编号、接口方法及地址或本包标题定位；原文发生变化先复核。'}))],
      useCases:associated,relatedUseCases:work.relatedUseCases,
      inputs:dependencies,
      readiness:[
        '主责与复核人实名认领，确认本包目标、人日及两人分工。',
        '前置交付通过上述验收，取得确切版本、接口字段、错误和调用样例；不得只凭前置任务标为完成。',
        'DES-'+work.phase+'已批准本期范围、技术栈、生产代码目录、容量恢复目标和可执行验证命令。设计包自身负责形成这些决定。',
        '所需测试环境和合成数据可用；真实通道仅在书面授权后测试，不读取或发送无权资料。'
      ],
      ownershipBoundary:work.kind==='design'?'只补本期生产差距与增量设计；不计开发实现，不重写已冻结用例。':profile.boundary,
      exclusions:[phases.find(item=>item.id===work.phase).excluded,
        '不承担前置工作包的代码建设；变更共用模块须与该包主责协商，不能并行覆盖。',
        '不得凭空创建已存在的后端目录或验收命令。当前仓库没有生产业务后端，具体落点由本期设计冻结后补入交接。',
        '人工办理是产品待建设能力，现有离线原型不等同实现；本工作拆解不授权执行银行资金、变更共享服务或上线。'],
      completion:{deliverable:work.deliverable,acceptance:work.acceptance,
        requiredEvidence:['实际修改文件及制品版本、接口和迁移差异、测试命令与结果。','本包子任务逐项检查结果、失败路径证据、未决项及复核人签认。','运行或数据变更的回退方式及下一包使用说明；不能用“测试通过”一句话替代。']},
      validation:{subtaskChecks:work.subtasks.map(step=>({id:step.id,expected:step.expected,test:step.test})),
        additionalScenarios:work.kind==='design'?['范围、证据主责、技术落点、依赖和估算经业务与技术共同签认。']:profile.tests,
        existingAssetChecks:profile.checks,
        limitation:'上述已有命令只验证设计资产或离线原型，不是生产验收。生产实现须补具体执行命令及实测结果，未执行明确标注。'},
      stopConditions:['前置制品缺失、源用例冲突、生产落点或人工证据主责未定，停止相关实现并交本期设计负责人裁决。',
        '银行或主管渠道无授权、证书或测试条件，记录阻断并交集成主责；不能制造成功或绕过门禁。',
        '新增范围超出本包或触发变更条件，记录已完成项、范围变化及下游影响，由项目负责人批准后重排。'],
      handoff:{downstream:allTasks.filter(entry=>entry.task.dependencies.includes(work.id)).map(entry=>({id:entry.task.id,title:entry.task.title})),
        reportFormat:['本包编号、目标、实名主责与复核人。','已完成子任务与制品、修改文件和接口变更。','执行命令、真实结果及失败路径证据。','已耗人日、剩余估算、阻断及下游可使用版本。']},
      sharedContext:{estimateBasis,phase:phases.find(item=>item.id===work.phase),invariants,auditCaveats}
    };
  }
  if (Object.keys(definitions).some(id=>!packageIndex.has(id))) throw new Error('存在不属于任何工作包的执行上下文。');
  const model = {layers,allTasks,packageIndex,useCases,flowNodes,phases:phaseTotals,estimateBasis};
  root.EXPORT_WORK_BREAKDOWN = model;
  if (typeof module === 'object' && module.exports) module.exports = model;
})(globalThis);
