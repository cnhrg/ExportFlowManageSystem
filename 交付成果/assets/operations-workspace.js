'use strict';
(function(root){
  const $=id=>document.getElementById(id);
  const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const fields={
    reference:['资料 / 文件版本编号','text'],
    summary:['本次内容 / 变更摘要','text'],
    company:['所属供应商','text'],
    quantity:['本批数量（件）','number'],
    route:['运输路线 / 口岸','text'],
    amount:['金额（人民币，合成示例）','number'],
    account:['收款账户尾号','text'],
    foreign:['银行实际入账（CNH）','number'],
    rate:['人民币本金系数（非汇率）（须本笔有效报价）','number'],
    fee:['银行 / 中转费（RMB）','number'],
    commission:['本次佣金 / 手续费（RMB）','number'],
    other:['其他已批准扣款（RMB）','number'],
    deposit:['已付定金 / 预付款（RMB）','number'],
    quoteDate:['本笔书面报价日期','date'],
    consignee:['C收货方 / 地址','text'],
    payer:['D付款方 / C与D关系','text'],
    commissionRule:['佣金规则版本 / 确认依据','text'],
    parties:['签约主体 / 委托链','text'],
    contractType:['协议类型 / 授权范围','text'],
    validity:['签署日期 / 授权有效期','text'],
    goods:['商品名称 / 规格','text'],
    packages:['包装 / 箱数','text'],
    weight:['净重 / 毛重（kg）','text'],
    tradeValue:['贸易货值 / 币种','text'],
    transportNo:['运输编号 / 承运人','text'],
    delivery:['提货 / ETA / 签收证据','text'],
    domesticShipper:['境内发货人（报关角色）','text'],
    confirmation:['A确认的最终版本 / 书面依据','text'],
    receipt:['正式回执 / 证明 / 来源索引','text'],
    handoff:['B接收 / 交付A记录','text'],
    fundsReview:['财务独立复核 / 结清依据','text'],
    taxReview:['退税结果 / 异常闭环索引','text'],
    affected:['受影响节点 / 资料版本','text'],
    bank:['银行 / 账户主体（脱敏）','text'],
    independent:['独立核验 / 回拨依据','text'],
    logisticsQuote:['物流报价 / 合同版本（如适用）','text',true],
    freightEvidence:['运费凭证 / 对应批次（如适用）','text',true]
  };
  const scenes={
    dossier:{name:'交易建档审核',group:'交易与协议',nodes:'N01',owner:'B运营',module:'sales',fields:['reference','summary','company'],checks:['A—F身份及C/D关系证据齐备','本笔货物及材料与档案对应','佣金规则及A/B确认版本完整'],result:'建档业务审核通过，待正式系统生成交易单'},
    agreements:{name:'协议资料审核',group:'交易与协议',nodes:'N02–N04',owner:'B运营 / 法务',module:'contracts',fields:['reference','summary','company'],checks:['本笔签章、生效日期与主体一致','A—E委托链、A—F授权有效','专业条款意见及适用付款分支已关联'],result:'协议资料审核通过，不替代法务意见或真实签署'},
    documents:{name:'出口单证审核',group:'出运与报关',nodes:'N05',owner:'B运营 / A',module:'logistics',fields:['reference','summary','quantity'],checks:['合同、发票、箱单及实货逐项一致','历史主体、零数量与错误公式已清理','修订对比、原版与本版材料可追溯'],result:'本版出口单证审核通过，后续改版须重审'},
    transport:{name:'物流履约审核',group:'出运与报关',nodes:'N06 / N10',owner:'B运营 / E',module:'logistics',fields:['reference','summary','route'],checks:['运输编号、路线、口岸与批次一致','提货、交接或签收凭证已关联','延误、货损及拒收差异已解释'],result:'物流资料审核通过，不代替真实货物验收'},
    customs:{name:'报关回执审核',group:'出运与报关',nodes:'N07–N09',owner:'B关务 / F',module:'customs',fields:['reference','summary','company'],checks:['A书面确认与F最终草稿版本一致','附件2列B为境内发货人','正式受理、出口放行及B接收证据齐备'],result:'报关回执业务核验通过，不代A确认或F申报'},
    proof:{name:'代理出口证明审核',group:'证明与结案',nodes:'N18–N20',owner:'B税务 / F',module:'compliance',fields:['reference','summary','company'],checks:['正式主管渠道的证明及来源可追溯','证明与本笔附件2关键字段一致','交付A的记录及缺件处理完整'],result:'证明材料审核通过，不等于税务机关签发'},
    closure:{name:'四流结案审核',group:'证明与结案',nodes:'N21–N22',owner:'B运营 / 合规',module:'compliance',fields:['reference','summary','company'],checks:['货物、报关、资金及退税资料一致','资金由财务独立复核且无未解释余额','退税结果、适用证明及全部异常已闭环'],result:'结案资料审核通过（演示），非正式交易结案'},
    exceptions:{name:'异常更正审核',group:'证明与结案',nodes:'N23',owner:'B运营 / 合规',module:'compliance',fields:['reference','summary','company'],checks:['异常原因、受影响节点及版本已记录','修订材料与外部正式反馈一致','受影响审批已失效并重新取得必要确认'],result:'更正方案审核通过，不自动解除其他节点ON HOLD'},
    incoming:{name:'来款匹配处理',group:'资金与账户',nodes:'N11–N12',owner:'B财务',module:'funds',fields:['reference','summary','amount'],checks:['银行实际入账、D与付款号匹配','分配金额加未匹配差额等于入账本金','同一流水未重复分配 / 入账'],result:'来款匹配复核通过，不等于贸易核验入账成功'},
    settlement:{name:'结算单处理',group:'资金与账户',nodes:'N13–N14',owner:'B财务',module:'funds',fields:['reference','summary','foreign','rate','fee','commission','other','deposit','quoteDate'],checks:['最新带日期的有效书面报价已核验','CNH入账、银行贸易核验入账及人民币入账结果齐备','佣金按步骤1规则计算并记入B收益账户','A净付款与佣金扣取、银行费及预付可勾稽'],result:'结算资料复核通过，不构成银行指令'},
    payment:{name:'付款申请审核',group:'资金与账户',nodes:'N15–N17',owner:'B资金授权人',module:'funds',fields:['reference','summary','amount'],checks:['适用预付 / 出口后付款前置门禁通过','实际可用余额、净额及审批额度足够','A账户独立核验且经办审批分离'],result:'付款申请内部审核通过，未执行付款 / 未确认到账'},
    accounts:{name:'账户变更审核',group:'资金与账户',nodes:'N17',owner:'B财务',module:'accounts',fields:['reference','summary','account'],checks:['正式账户资料与A主体一致','独立渠道回拨及双人核验有记录','影响的付款申请已冻结并重新送审'],result:'账户变更材料审核通过，未变更任何真实银行账户'},
    legal:{name:'合同条款审核',group:'专业审核',nodes:'N02–N04',owner:'B法务',module:'contracts',fields:['reference','summary','company'],checks:['代理范围及真实委托链清晰','费率、汇率、费用与付款时点无冲突','修订对比及双方书面一致意见齐备'],result:'法务条款审核通过，不替代合同签署与财务审批'},
    risk:{name:'合规补证审核',group:'专业审核',nodes:'N23',owner:'B合规',module:'compliance',fields:['reference','summary','company'],checks:['主体、用途及适用外部要求有核查依据','风险命中、解释及补证已逐项留痕','独立复核人及受影响节点已明确'],result:'合规补证审核通过，不代替外部机关批准'}
  };
  Object.assign(scenes.dossier,{fields:['reference','company','consignee','payer','commissionRule','summary']});
  Object.assign(scenes.agreements,{fields:['reference','contractType','parties','validity','summary']});
  Object.assign(scenes.documents,{fields:['reference','goods','quantity','packages','weight','tradeValue','summary']});
  Object.assign(scenes.transport,{nodes:'N03 / N06 / N10',fields:['reference','route','transportNo','delivery','logisticsQuote','freightEvidence','summary']});
  Object.assign(scenes.customs,{fields:['reference','company','domesticShipper','consignee','confirmation','receipt','handoff','summary']});
  Object.assign(scenes.proof,{fields:['reference','company','receipt','handoff','summary']});
  Object.assign(scenes.closure,{fields:['reference','company','fundsReview','taxReview','summary']});
  Object.assign(scenes.exceptions,{fields:['reference','affected','receipt','summary']});
  Object.assign(scenes.accounts,{fields:['reference','bank','account','independent','summary']});
  Object.assign(scenes.legal,{fields:['reference','contractType','parties','validity','summary']});
  const opsScenes=['dossier','agreements','documents','transport','customs','proof','closure','exceptions'];
  const allScenes=Object.keys(scenes);
  const roles={
    operations:{name:'B · 运营经办',menus:opsScenes,edit:opsScenes,review:opsScenes,entity:'B',boundary:'分场景审核业务资料；不代专业财务终审、A确认或F申报'},
    legal:{name:'B · 法务审核',menus:['agreements','legal'],edit:['legal'],review:['legal'],entity:'B',boundary:'条款专业审核；不可操作资金或替双方签署'},
    finance:{name:'B · 财务经办',menus:['incoming','settlement','payment','accounts'],edit:['incoming','settlement','payment','accounts'],review:[],entity:'B',boundary:'修改与提请财务复核；无资金终审或付款执行权'},
    approver:{name:'B · 资金审批人',menus:['incoming','settlement','payment','accounts'],edit:[],review:['incoming','settlement','payment','accounts'],entity:'B',boundary:'独立复核；不可修改经办金额、审核本人提交版本或执行银行付款'},
    customs:{name:'B · 关务协同',menus:['documents','customs','proof'],edit:['customs','proof'],review:['customs'],entity:'B',boundary:'审核内部接收资料；不代A确认、不代F申报'},
    tax:{name:'B · 税务经办',menus:['proof','closure'],edit:['proof'],review:['proof'],entity:'B',boundary:'证明材料接收及核验；不代A退税申报'},
    compliance:{name:'B · 合规审核',menus:['risk','exceptions','closure'],edit:['risk'],review:['risk','exceptions','closure'],entity:'B',boundary:'补证、异常及结案复核；无付款执行权限'},
    supplier:{name:'A · 业务经办',menus:['dossier','agreements','documents'],edit:['dossier','agreements','documents'],review:[],entity:'A',boundary:'仅本方授权交易资料；提交内部审核，不可自行审核或查看B银行资料'},
    logistics:{name:'E · 业务经办',menus:['transport'],edit:['transport'],review:[],entity:'E',boundary:'仅本方受托物流委任、报价、运输及费用凭证；均属业务资料，无系统内资金流转权限'},
    forwarder:{name:'F · 报关经办',menus:['customs','proof'],edit:['customs','proof'],review:[],entity:'F',boundary:'仅本方受托资料；回填正式渠道凭证，不代A确认或B审核'},
    audit:{name:'内部审计合规 · 只读',menus:allScenes,edit:[],review:[],entity:'B',boundary:'授权全模块只读及本页记录；禁止修改、审核、驳回、执行及导出'},
    superadmin:{name:'Super Admin',menus:allScenes,edit:allScenes,review:allScenes,entity:'B',boundary:'全模块演示；仍不可自审、绕过证据门禁或执行银行 / 海关操作'},
    admin:{name:'系统管理员',menus:[],edit:[],review:[],entity:'B',boundary:'账号、角色与模板配置；无业务数据及审批权限'},
    boss:{name:'Boss Viewer',menus:[],edit:[],review:[],entity:'B',boundary:'仅脱敏单据 / 资金汇总及授权交易摘要；不提供审批或操作入口'}
  };
  const labels={pending:'待审核',draft:'待修改 / 草稿',rejected:'已驳回',approved:'本场景已通过',withdrawn:'已撤销 / 待重送',frozen:'已冻结'};
  const dependencies={
    dossier:[],agreements:['dossier','legal'],documents:['agreements'],transport:['documents'],customs:['documents'],
    proof:['customs'],closure:['transport','proof','payment'],exceptions:[],
    incoming:['dossier','agreements'],settlement:['incoming','agreements'],accounts:[],
    payment:['settlement','accounts','customs','risk','exceptions'],legal:['dossier'],risk:[]
  };
  const entryNames={
    finance:{incoming:'来款匹配处理',settlement:'结算单编制',payment:'付款申请提请',accounts:'账户资料维护'},
    approver:{incoming:'来款匹配复核',settlement:'结算单复核'},
    legal:{agreements:'协议资料查询'},
    supplier:{dossier:'交易资料补正',agreements:'协议资料提交',documents:'出口单证维护'},
    logistics:{transport:'物流委任 / 运输 / 费用凭证'},
    forwarder:{customs:'报关回执回填',proof:'证明材料提交'},
    customs:{documents:'出口单证查询',proof:'证明资料整理'},
    tax:{closure:'结案资料查询'}
  };
  const state={role:'operations',device:matchMedia('(max-width:760px)').matches?'mobile':'desktop',scene:'dossier',record:'',filter:'pending',query:'',drafts:{},draftVersions:{},notes:{},editing:'',events:[],message:'',active:false};
  let activate;
  let storageReady=false,storageBusy=false,storageError='';
  const records=allScenes.flatMap((scene,index)=>[0,1,2].map(kind=>{
    const config=scenes[scene],id='DOC-'+String(index+1).padStart(2,'0')+'-'+String(kind+1).padStart(3,'0');
    return {id,scene,transaction:'DEMO-EX-'+String(kind+1).padStart(3,'0'),batch:'LOT-01',supplier:kind===1?'A示例乙':'A示例甲',
      parties:{A:kind===1?'A-002':'A-001',E:kind===1?'E-002':'E-001',F:kind===1?'F-002':'F-001'},
      status:kind===2?'rejected':'pending',version:kind===2?2:1,
      submitter:kind===2?'退回原经办':'外部 / 上游经办',editor:'',updated:'10-21 10:30',
      values:{reference:id+'-V'+(kind===2?2:1),summary:kind===1?'待补本笔正式凭证及差异说明':'合成演示资料 · '+config.name,company:kind===1?'A示例乙':'A示例甲',quantity:'1200',route:'提货点 → 出口口岸（演示）',amount:'10000',account:'5508',foreign:'10000',rate:'1',fee:'80',commission:'2000',other:'0',deposit:'2000',quoteDate:'2026-10-21',
        consignee:'C示例收货方 / 合成送货地址',payer:'D示例付款方 / 关系说明索引 SYN-CD',
        commissionRule:'合成规则V1 / SYN-COM · 贸易核验入账成功后结款A前扣取并记入B收益账户',
        parties:(kind===1?'A示例乙':'A示例甲')+' / B示例代理商 / 关联E与F',
        contractType:'本笔代理协议及适用授权（合成）',validity:'合成日期：2026-10-21 / 有效期待正式材料核验',
        goods:'家居收纳用品 / 合成规格',packages:'120箱 / 合成包装',weight:'210 / 235',tradeValue:'CNH 10,000 · 合成贸易货值',
        transportNo:'SYN-TR-'+(kind+1)+' / E示例承运人',delivery:'SYN-PICK / SYN-ETA / SYN-DELIVERY（合成）',
        domesticShipper:'B示例代理商',confirmation:'A书面确认索引 SYN-A-V1（合成，非真实授权）',
        receipt:kind===1?'缺本笔正式凭证':'SYN-RECEIPT-'+id+'（合成凭证，非官方结果）',
        handoff:'SYN-HANDOFF（合成交接记录）',fundsReview:'SYN-FIN（财务独立复核合成索引）',
        taxReview:'SYN-TAX / SYN-CLOSE（合成归档索引）',affected:config.nodes+' / '+id+'-V1',
        bank:'演示银行 / A收款主体（脱敏）',independent:'SYN-CALLBACK / SYN-DUAL（合成独立核验索引）'},
      checks:config.checks.map((label,check)=>({label,available:kind===0||check===0,confirmed:false})),
      history:kind===2?[{time:'10-21 09:40',actor:'上游审核员',action:'驳回 V2',reason:'缺少本批次凭证，请修订后重新提交。',before:'pending',after:'rejected'}]:[],approval:null,evidence:[],blockers:[]};
  }));
  function related(record,scene){return records.find(item=>item.transaction===record.transaction&&item.batch===record.batch&&item.scene===scene);}
  function upstream(record){return (dependencies[record.scene]||[]).map(scene=>related(record,scene));}
  function upstreamSnapshot(record){return upstream(record).map(item=>({id:item.id,version:item.version,approval:item.approval?.id||null}));}
  function upstreamReady(record){return upstream(record).every(item=>item?.status==='approved'&&item.approval?.version===item.version);}
  function invalidate(record,reason,seen=new Set()){
    if(seen.has(record.id))return;
    seen.add(record.id);
    records.filter(item=>item.transaction===record.transaction&&item.batch===record.batch&&(dependencies[item.scene]||[]).includes(record.scene)).forEach(item=>{
      const before=item.status;
      item.status='frozen';item.approval=null;item.checks.forEach(check=>{check.confirmed=false;});
      item.frozenBy=actor();
      if(!item.blockers.includes(record.id))item.blockers.push(record.id);
      log(item,'上游变更冻结',record.id+'：'+reason,before);
      invalidate(item,reason,seen);
    });
  }
  async function mutate(callback){
    if(!storageReady||storageBusy){notice(storageError||'审计存储尚未就绪或正在写入，请稍后操作。');return;}
    const backup=structuredClone({records,events:state.events});
    storageBusy=true;
    try{
      await callback();
      await root.EXPORT_AUDIT_STORE.save(records,state.events);
    }catch(error){
      records.splice(0,records.length,...backup.records);state.events=backup.events;
      state.editing='';storageReady=false;storageError=error.message;
      state.message='操作未保存，已回滚：'+error.message;console.error('本地审计操作失败',error);
    }finally{storageBusy=false;render();}
  }
  function role(){return roles[state.role];}
  function canAccessEntry(entry){
    if(entry==='dossier')return ['operations','supplier','superadmin'].includes(state.role);
    if(entry==='catalog')return ['operations','customs','supplier','forwarder','superadmin'].includes(state.role);
    if(entry==='review')return ['operations','customs','superadmin'].includes(state.role);
    if(entry==='dossier-approve')return state.role==='superadmin';
    return false;
  }
  function sceneName(scene){return entryNames[state.role]?.[scene]||scenes[scene].name;}
  function actor(){return 'rogershuang';}
  function allowed(scene){return role().menus.includes(scene);}
  function visible(record){
    return allowed(record.scene)&&(role().entity==='B'||record.parties[role().entity]===role().entity+'-001');
  }
  function sceneRecords(){return records.filter(record=>record.scene===state.scene&&visible(record));}
  function pendingCount(scene){return records.filter(record=>record.scene===scene&&visible(record)&&record.status!=='approved').length;}
  function key(record){return actor()+':'+record.id;}
  function current(){return records.find(record=>record.id===state.record&&record.scene===state.scene&&visible(record));}
  function button(action,text,disabled=false){
    return '<button type="button" class="demo-button'+(action==='approve'?' primary':'')+'" data-work-action="'+action+'"'+(disabled?' disabled':'')+'>'+text+'</button>';
  }
  function notice(text){state.message=text;if(!storageBusy)render();}
  let navigationScope='operations';
  function navigation(active,scope=navigationScope){
    navigationScope=scope;
    state.active=active;
    $('ops-user-controls').innerHTML='<div class="work-role"><label>岗位权限预览<select data-work-role aria-label="岗位权限预览">'+Object.entries(roles).map(([id,item])=>'<option value="'+id+'"'+(id===state.role?' selected':'')+'>'+item.name+'</option>').join('')+'</select></label>'+
      '<label>当前演示人员<input aria-label="当前演示人员" value="'+actor()+'" readonly aria-readonly="true"></label></div>';
    $('ops-device-tabs').innerHTML=[['desktop','电脑端'],['mobile','移动端']].map(([id,label])=>'<button type="button" id="ops-device-'+id+'" data-work-device="'+id+'" role="tab" aria-selected="'+(state.device===id)+'" aria-controls="operations-prototype" tabindex="'+(state.device===id?0:-1)+'">'+label+'</button>').join('');
    $('operations-prototype').classList.toggle('ops-mobile-mode',state.device==='mobile');
    $('operations-prototype').setAttribute('aria-labelledby','ops-device-'+state.device);
    const selectedEntry='scene:'+state.scene;
    $('ops-mobile-navigation').hidden=scope==='directory';
    $('ops-mobile-navigation').innerHTML=scope!=='operations'?
      (canAccessEntry(scope)?'<label>当前工作区页面<select data-work-page aria-label="当前工作区页面">'+
        (scope==='catalog'?['entry','query'].map((tab,index)=>'<option value="'+tab+'"'+(document.querySelector('[data-catalog-tab="'+tab+'"].active')?' selected':'')+'>'+(index?'信息查询':'信息录入')+'</option>').join(''):'<option value="dossier">建档资料填报 / 汇总</option>')+'</select></label>':'<span>当前岗位无此工作区页面权限</span>'):
      '<label>当前工作区页面<select data-work-entry aria-label="当前工作区页面">'+
      [...new Set(role().menus.map(id=>scenes[id].group))].map(group=>'<optgroup label="'+group+'">'+role().menus.filter(id=>scenes[id].group===group).map(id=>'<option value="scene:'+id+'"'+(selectedEntry==='scene:'+id?' selected':'')+'>'+sceneName(id)+' · '+pendingCount(id)+' 待办</option>').join('')+'</optgroup>').join('')+
      (!role().menus.length?'<option value="">此岗位无单据操作权限</option>':'')+'</select></label><span>仅显示当前岗位授权范围</span>';
    $('ops-navigation')?.remove();
    if(scope!=='operations')return;
    const container=document.createElement('div');
    container.id='ops-navigation';
    container.innerHTML='<div class="work-menu-caption">授权操作入口 <small>数字为在途待处理单据</small></div>'+
      [...new Set(role().menus.map(id=>scenes[id].group))].map(group=>'<div class="work-menu-group"><h4>'+group+'</h4>'+role().menus.filter(id=>scenes[id].group===group).map(id=>'<button type="button" data-work-scene="'+id+'" class="work-menu-item'+(active&&state.scene===id?' active':'')+'" aria-current="'+(active&&state.scene===id?'page':'false')+'"><span>'+sceneName(id)+'</span><b>'+pendingCount(id)+'</b></button>').join('')+'</div>').join('')+
      (!role().menus.length?'<p class="work-menu-empty">此岗位无单据操作权限</p><button type="button" class="work-menu-item" data-work-link="'+(state.role==='boss'?'boss-viewer':'rbac')+'">'+(state.role==='boss'?'经营看板 · 只读':'账号 / 角色配置')+'</button>':'');
    $('capability-list').append(container);
  }
  function filtered(){
    const query=state.query.trim().toLowerCase();
    return sceneRecords().filter(record=>(state.filter==='all'||record.status===state.filter)&&(!query||[record.id,record.transaction,record.supplier,record.values.reference].some(value=>value.toLowerCase().includes(query))));
  }
  function list(){
    const rows=filtered();
    return '<div class="work-filter">'+
      '<label>单据状态<select data-work-filter aria-label="单据状态">'+[...Object.entries(labels),['all','全部单据']].map(([id,text])=>'<option value="'+id+'"'+(state.filter===id?' selected':'')+'>'+text+'</option>').join('')+'</select></label>'+
      '<form data-work-search><label>搜索在途单据<input type="search" data-work-query aria-label="搜索在途单据" value="'+escape(state.query)+'" placeholder="单据号 / 交易号 / 供应商"></label><button type="submit" class="demo-button">查询</button></form></div>'+
      '<div class="work-table-wrap"><table class="work-table"><thead><tr><th>单据 / 交易批次</th><th>供应商 / 版本</th><th>状态 / 提交人</th><th>待处理事项</th><th>操作</th></tr></thead><tbody>'+
      (rows.map(record=>'<tr class="'+(record.id===state.record?'selected':'')+'"><td data-label="单据 / 交易批次"><strong>'+record.id+'</strong><small>'+record.transaction+' / '+record.batch+'</small></td><td data-label="供应商 / 版本">'+record.supplier+'<small>V'+record.version+' · '+record.updated+'</small></td><td data-label="状态 / 提交人"><span class="work-state '+record.status+'">'+labels[record.status]+'</span><small>'+escape(record.submitter)+'</small></td><td data-label="待处理事项">'+escape(record.status==='rejected'?record.history.at(-1).reason:record.status==='approved'?scenes[record.scene].result:record.checks.some(check=>!check.available)?'缺件：补正或驳回':'待本场景核验')+'</td><td data-label="操作"><button type="button" class="demo-button" data-work-record="'+record.id+'">'+(role().review.includes(state.scene)?'查看 / 审核':role().edit.includes(state.scene)?'查看 / 修改':'查看')+'</button></td></tr>').join('')||
      '<tr><td colspan="5" class="work-empty">当前筛选下没有授权单据；可切换状态或清空查询。</td></tr>')+'</tbody></table></div>';
  }
  function detail(record){
    const config=scenes[record.scene],editing=state.editing===key(record),canEdit=role().edit.includes(record.scene)&&record.status!=='frozen',canReview=role().review.includes(record.scene);
    const values=editing?state.drafts[key(record)]:record.values;
    const fieldsHtml=config.fields.map(name=>'<label>'+fields[name][0]+(editing?'<input data-work-field="'+name+'" type="'+fields[name][1]+'"'+(fields[name][1]==='number'?' min="0" step="0.01"':'')+' value="'+escape(values[name]??'')+'">':'<span>'+escape(values[name]||'待本笔补充')+'</span>')+'</label>').join('');
    const canSubmit=canEdit&&['draft','rejected','withdrawn'].includes(record.status)&&!editing;
    const canDecide=canReview&&record.status==='pending'&&!editing;
    const own=record.submitter===actor()||record.editor===actor();
    const history=record.history.map(item=>'<li><strong>'+escape(item.action)+'</strong><span>'+escape(item.time+' · '+item.actor)+'</span><p>'+escape(item.reason)+'</p><small>'+escape(labels[item.before]+' → '+labels[item.after])+'</small>'+
      (item.snapshot?'<details><summary>查看此刻证据 / 依赖版本快照</summary><pre class="work-snapshot">'+escape(JSON.stringify(item.snapshot,null,2))+'</pre></details>':'')+'</li>').join('');
    return '<section class="work-document" id="work-document" tabindex="-1"><header><div><small>'+config.nodes+' · '+config.owner+'</small><h4>'+record.id+' <span>V'+record.version+'</span></h4></div><span class="work-state '+record.status+'">'+labels[record.status]+'</span></header><button type="button" class="work-return" data-work-return>‹ 返回待办列表</button>'+
      '<div class="work-document-grid"><div><div class="work-fields">'+fieldsHtml+'</div>'+
      (record.scene==='settlement'?'<div class="work-net"><small>人民币净付款试算 · 非付款依据</small><strong id="work-net">CNY '+net(values).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2})+'</strong><p>CNH × 汇率 − 银行费 − 本次佣金/手续费（转入B收益账户）− 其他扣款 − 已付定金。佣金按步骤1档案规则，须在贸易核验入账成功后扣取；1:1不是已验证报价。</p></div>':'')+
      '<div class="work-document-actions">'+(canEdit?(editing?button('save','保存新版本')+button('cancel','取消修改'):button('edit',record.status==='approved'?'修订并重新审核':'修改单据')):'')+(canSubmit?button('submit','提交审核'):'')+'</div>'+
      '<div class="work-document-actions">'+
      (record.status==='pending'&&canEdit&&record.submitter===actor()?button('withdraw','撤销送审'):'')+
      (record.status==='approved'&&canReview?button('revoke','撤销批准'):'')+
      (canReview&&record.status!=='frozen'?button('freeze','冻结并撤销有效批准'):'')+
      (canReview&&record.status==='frozen'?button('unfreeze','解除冻结，转待重新送审'):'')+'</div>'+
      '<div class="work-hint">依赖版本：'+(upstream(record).map(item=>escape(item.id+' V'+item.version+' · '+labels[item.status])).join('；')||'无上游依赖')+
      (record.blockers.length?'<br>冻结来源：'+escape(record.blockers.join('、')):'')+'<br>演示按出口后付款分支；只有上游最新版本均通过才可送审 / 通过。上游更改递归冻结下游，不自动恢复旧批准。</div>'+
      '<p class="work-hint">'+(editing?'修改不覆盖归档原件；保存新版本并递归冻结依赖单据，旧批准永久留痕。':'原件及版本快照保存于本机IndexedDB；冻结不撤回银行已执行指令。')+'</p>'+
      '<section class="work-evidence"><h5>持久审计证据 · 单个文件不超过5MB</h5>'+
      (canEdit?'<label>归档文件（仅用合成资料；原件及SHA-256本机保存）<input type="file" data-work-file></label>':'')+
      '<ul>'+(record.evidence.map(file=>'<li>'+escape(file.name)+' · V'+file.version+' · '+escape(file.actor)+'<small>SHA-256：'+escape(file.hash)+'</small><button type="button" class="text-button" data-work-download="'+file.id+'">下载本机归档原件</button></li>').join('')||'<li>暂无上传原件；审核清单仍为合成凭证，不代表真实来源已核验。</li>')+'</ul></section>'+
      '<details class="work-evidence"><summary>业务依据 / 现有材料参考</summary>'+sources(record.scene)+'</details></div>'+
      '<div><h5>本场景审核清单 · V'+record.version+'</h5><div class="work-checks">'+record.checks.map((check,index)=>'<label><input type="checkbox" data-work-check="'+index+'"'+(check.confirmed&&check.confirmedBy===actor()?' checked':'')+(!canDecide||!check.available||own?' disabled':'')+'><span>'+check.label+'<small>'+ (check.available?'合成凭证 V'+record.version+' · 当前审核人逐项确认':'缺本笔正式凭证 · 不能勾选通过')+'</small></span></label>').join('')+'</div>'+
      (canReview||canEdit?'<label class="work-reason">处理意见 / 驳回原因<textarea data-work-reason rows="3" placeholder="修改、审核或驳回均需填写；不能以原型记录代替正式凭证">'+escape(state.notes[key(record)]||'')+'</textarea></label>':'')+
      (canDecide?'<div class="work-document-actions">'+button('approve','审核通过',own||!upstreamReady(record)||record.checks.some(check=>!check.available))+button('reject','驳回补正',own)+'</div><p class="work-hint">'+(own?'本人修改 / 提交版本不能自审。当前固定为rogershuang，须由另一真实授权人员在正式系统复核；切换岗位不改变身份。':!upstreamReady(record)?'上游最新版本尚未全部通过，不能通过本单。':'缺凭证不可通过；驳回将冻结依赖下游。')+'</p>':'')+
      (record.approval?'<p class="work-approved">'+escape(config.result)+'<br>'+escape(record.approval.actor+' · V'+record.approval.version)+'</p>':'')+'</div></div>'+
      '<details class="work-history" open><summary>持久审计轨迹 · '+record.history.length+'</summary><ol>'+(history||'<li>暂无操作记录；上游合成单据待处理。</li>')+'</ol><p class="work-hint">每次动作留存字段、核验人、文件摘要、批准及上游版本快照；本机摘要链非可信时间戳、不可篡改存储或真实身份认证。</p></details></section>';
  }
  function net(values){return Number(values.foreign)*Number(values.rate)-Number(values.fee)-Number(values.commission)-Number(values.other)-Number(values.deposit);}
  function sources(scene){
    const links={
      agreements:[['M06 · 代理协议候选模板','步骤2-出口货物贸易代理合同(10.16).docx'],['M07 · 物流合同（委托链待核）','步骤2-国际物流服务合同-龙南逸泰源&国际运输合同(1).doc']],
      documents:[['E01 · 历史发票字段参考','按Sheet拆分/步骤1及3-出口商业发票-历史例子.xlsx'],['E02 · 历史装箱单字段参考','按Sheet拆分/步骤1及3-出口装箱单-历史例子.xlsx']],
      customs:[['M11 · 历史双抬头样例','步骤4-双抬头报关-出口双抬头.pdf（新疆）.pdf']],
      incoming:[['M15 · 付款报文样例（非银行入账证明）','步骤5-CIPS系统贷记转账报文TFLS00032_SWIFT_CNY_5 000,00(3).pdf']]
    };
    const module=scenes[scene].module,definition=root.EXPORT_CAPABILITY_WORKSPACE?.scenarios.find(item=>item.id===module);
    return '<p>操作指引 / '+scenes[scene].nodes+'；现有模板与历史样例不等于本笔已核验原件。</p>'+
      (definition?'<ul>'+definition.controls.map(control=>'<li>'+escape(control)+'</li>').join('')+'</ul>':'')+
      (links[scene]||[]).map(([name,path])=>'<a href="../材料/'+escape(path)+'" target="_blank" rel="noopener">'+name+'</a>').join('');
  }
  function render(){
    navigation(true,'operations');
    const config=scenes[state.scene];
    const base='<header class="ops-header"><div><small>ROLE-BASED OPERATIONS</small><h3>内部运营工作台</h3><p>'+role().name+' · '+actor()+' · '+role().boundary+'</p></div><span class="work-demo">合成单据 · 本地演示</span></header>'+
      '<details class="ops-boundary"><summary>'+escape(storageError?'存储已停用：'+storageError:storageReady?'本机审计存储已就绪 · 演示边界':'正在载入持久审计…')+'</summary><span>单据、审批快照、归档原件及审计链保存于本浏览器IndexedDB，刷新保留（未保存编辑不保留）。仅本机合成原型，浏览器清理会丢失，不具备生产防篡改和真实身份认证；不连接银行。人员固定为rogershuang，切换岗位不改变身份；本版本不能演示同一人操作后的独立解冻或自审。</span></details>'+
      '<p class="ops-status" id="work-status" role="status">'+escape(state.message||'请选择授权场景与待处理单据。')+'</p>';
    $('capability-detail').classList.toggle('work-detail-open',!!current());
    if(!role().menus.length){
      const boss=state.role==='boss';
      $('capability-detail').innerHTML=base+'<section class="ops-empty"><h4>'+(boss?'单据 / 资金双看板':'系统管理')+'</h4><p>'+(boss?'仅授权脱敏摘要；无原始单据、修改、审核或驳回权限。':'无单据明细、修改、审核或驳回权限。')+'</p><button type="button" class="demo-button" data-work-link="'+(boss?'boss-viewer':'rbac')+'">'+(boss?'打开Boss Viewer看板':'打开账号 / 角色配置')+'</button></section>';
      return;
    }
    if(!allowed(state.scene)){state.scene=role().menus[0];state.record='';render();return;}
    const totals=sceneRecords();
    const summary=[['在途待处理',totals.filter(record=>record.status!=='approved').length],['待审核',totals.filter(record=>record.status==='pending').length],['退回 / 待修改',totals.filter(record=>['draft','rejected'].includes(record.status)).length],['本场景已通过',totals.filter(record=>record.status==='approved').length]];
    const selected=current();
    const events=state.events.filter(event=>{
      const record=records.find(record=>record.id===event.record);
      return record&&visible(record);
    });
    $('capability-detail').innerHTML=base+
      '<div class="work-scene-heading"><div><h4>'+sceneName(state.scene)+'</h4><p>'+config.nodes+' · '+config.owner+' · 仅授权交易 / 批次</p></div><span>'+totals.length+' 张单据</span></div>'+
      '<div class="work-list-pane"><div class="ops-summary">'+summary.map(([name,count])=>'<span>'+name+'<b>'+count+'</b></span>').join('')+'</div>'+list()+'</div>'+
      (selected?detail(selected):'<section class="work-empty">从上方选择一张单据，查看本笔材料、差异、版本及可执行操作。</section>')+
      '<details class="ops-events"><summary>授权范围内持久审计记录 · '+events.length+'</summary><ul>'+(events.map(event=>'<li>'+escape(event.time+' · '+event.actor+' · '+event.record+' · '+event.action)+'</li>').join('')||'<li>暂无处理记录</li>')+'</ul></details>';
  }
  function log(record,action,reason,before){
    const entry={id:crypto.randomUUID(),time:new Date().toISOString(),actor:actor(),action,reason,before,after:record.status,
      snapshot:{version:record.version,values:{...record.values},checks:structuredClone(record.checks),approval:structuredClone(record.approval),blockers:[...record.blockers],
        evidence:record.evidence.map(({blob,...metadata})=>metadata),upstream:upstreamSnapshot(record)}};
    record.history.push(entry);
    record.updated=new Date().toLocaleTimeString('zh-CN',{hour12:false});
    state.events.unshift({...entry,record:record.id});
  }
  function perform(action){
    const record=current();
    if(!record){notice('操作被拒绝：未找到当前岗位授权单据。');return;}
    const canEdit=role().edit.includes(record.scene),canReview=role().review.includes(record.scene),note=String(state.notes[key(record)]||'').trim();
    if(record.status==='frozen'&&action!=='unfreeze'){notice('操作被拒绝：单据已冻结，须由有权独立人员先解除冻结。');return;}
    if(['freeze','unfreeze','revoke'].includes(action)){
      if(!canReview||!note){notice('操作被拒绝：需有审核权限并填写撤销 / 冻结 / 解冻原因。');return;}
      if(action==='unfreeze'){
        if(record.status!=='frozen'||record.frozenBy===actor()||!upstreamReady(record)){notice('解冻被拒绝：须另一有权人员，且所有上游最新版本已通过。');return;}
        record.status='withdrawn';record.blockers=[];record.approval=null;
        log(record,'解除冻结，等待重送',note,'frozen');
      }else{
        if(action==='revoke'&&record.status!=='approved'){notice('撤销被拒绝：无有效批准可撤销。');return;}
        const before=record.status;record.status=action==='freeze'?'frozen':'withdrawn';record.approval=null;
        if(action==='freeze')record.frozenBy=actor();
        record.checks.forEach(check=>check.confirmed=false);
        log(record,action==='freeze'?'手动冻结':'撤销批准',note,before);invalidate(record,note);
      }
      notice('已记录撤销 / 冻结状态；下游须逐级解冻、重新送审和独立复核，旧批准不会恢复。');return;
    }
    if(action==='withdraw'){
      if(!canEdit||record.status!=='pending'||record.submitter!==actor()||!note){notice('撤销被拒绝：仅原提交人可撤销待审申请，且须填写原因。');return;}
      record.status='withdrawn';record.checks.forEach(check=>check.confirmed=false);
      log(record,'撤销送审',note,'pending');invalidate(record,note);notice('已撤销送审，批准历史不删除；重新送审将生成新版本。');return;
    }
    if(['edit','save','submit','cancel'].includes(action)&&!canEdit||['approve','reject'].includes(action)&&!canReview){
      notice('操作被拒绝：当前岗位无此场景的操作权限。');return;
    }
    if(action==='edit'){
      if(state.draftVersions[key(record)]!==record.version){
        state.drafts[key(record)]={...record.values};state.draftVersions[key(record)]=record.version;
      }
      state.editing=key(record);
      notice('正在修改 '+record.id+'；原始凭证只读，保存后需重新审核。');return;
    }
    if(action==='cancel'){state.editing='';delete state.drafts[key(record)];delete state.draftVersions[key(record)];notice('已取消未保存修改，原单据版本未变。');return;}
    if(action==='save'){
      if(state.editing!==key(record)){notice('保存被拒绝：请先进入单据修改。');return;}
      const draft=state.drafts[key(record)],config=scenes[record.scene];
      if(state.draftVersions[key(record)]!==record.version){notice('保存被拒绝：原单据版本已变化，请重新载入。');return;}
      if(!note||config.fields.some(name=>!fields[name][2]&&!String(draft[name]??'').trim()||fields[name][1]==='number'&&(!Number.isFinite(Number(draft[name]))||(['fee','commission','other','deposit'].includes(name)?Number(draft[name])<0:Number(draft[name])<=0)))){
        notice('保存未执行：请补齐必填字段和修改原因；数量、金额及汇率须为正数，费用与已付款不得为负数。');return;
      }
      if(record.scene==='settlement'&&(!Number.isFinite(net(draft))||net(draft)<0)){notice('保存未执行：结算净额无效或资金不足，请核对金额和汇率。');return;}
      if(config.fields.every(name=>draft[name]===record.values[name])){notice('保存未执行：单据内容没有变化。');return;}
      const before=record.status,oldVersion=record.version;
      const changes=config.fields.filter(name=>draft[name]!==record.values[name]).map(name=>fields[name][0]+'：'+(record.values[name]??'未填写')+' → '+draft[name]).join('；');
      record.values={...draft};record.version++;record.editor=actor();record.status='draft';record.approval=null;
      record.checks.forEach(check=>check.confirmed=false);
      state.editing='';delete state.drafts[key(record)];
      log(record,'修改 V'+oldVersion+' → V'+record.version,note+'；'+changes,before);
      invalidate(record,'修改为V'+record.version+'；'+note);
      notice('已保存 V'+record.version+'；旧审核结论失效，待重新提交。');return;
    }
    if(action==='submit'){
      if(state.editing||!['draft','rejected','withdrawn'].includes(record.status)){notice('提交未执行：仅已保存草稿 / 撤销单据可送审。');return;}
      if(record.status==='rejected'){notice('提交未执行：请先按驳回意见修改并保存新版本。');return;}
      if(!note){notice('提交未执行：请填写本版提交说明。');return;}
      if(!upstreamReady(record)){notice('提交被拒绝：上游最新版本尚未全部通过。');return;}
      const before=record.status;
      if(before==='withdrawn'){record.version++;record.editor=actor();}
      record.submittedUpstream=upstreamSnapshot(record);
      record.status='pending';record.submitter=actor();record.checks.forEach(check=>check.confirmed=false);
      log(record,'提交审核 V'+record.version,note,before);
      notice('已进入本场景待审核队列；本人不能审核此版本。');return;
    }
    if(['approve','reject'].includes(action)){
      if(record.status!=='pending'||state.editing){notice('审核未执行：单据不在待审核状态。');return;}
      if(record.submitter===actor()||record.editor===actor()){notice('审核被拒绝：不能审核本人修改或提交的版本。');return;}
      if(!note){notice(action==='reject'?'驳回未执行：必须填写驳回原因。':'审核未执行：必须填写审核意见。');return;}
      if(action==='approve'&&(!upstreamReady(record)||record.submittedUpstream&&JSON.stringify(record.submittedUpstream)!==JSON.stringify(upstreamSnapshot(record)))){notice('审核被阻断：上游未通过或依赖批准版本已变化，须撤销后重新送审。');return;}
      if(action==='approve'&&record.checks.some(check=>!check.available||!check.confirmed||check.confirmedBy!==actor())){notice('审核被阻断：缺少本笔凭证或当前人员未完成逐项核验。');return;}
      record.status=action==='approve'?'approved':'rejected';
      record.approval=action==='approve'?{id:crypto.randomUUID(),actor:actor(),version:record.version,upstream:upstreamSnapshot(record)}:null;
      log(record,(action==='approve'?'审核通过':'驳回补正')+' V'+record.version,note,'pending');
      if(action==='reject')invalidate(record,'上游驳回：'+note);
      notice(action==='approve'?scenes[record.scene].result:'已驳回至原经办补正；保留本次意见，需修改新版本后重审。');return;
    }
    notice('操作未执行：未知单据动作。');
  }
  function initialize(onActivate){
    activate=onActivate;
    const view=$('view-capabilities');
    root.EXPORT_AUDIT_STORE.open().then(snapshot=>{
      if(snapshot){
        if(snapshot.records.length!==records.length||snapshot.records.some(record=>!records.some(item=>item.id===record.id&&item.scene===record.scene)||!Array.isArray(record.evidence)||!Array.isArray(record.blockers)))throw new Error('审计记录与当前原型不兼容，未覆盖归档数据。');
        records.splice(0,records.length,...snapshot.records);state.events=snapshot.events;
      }
      storageReady=true;if(state.active)render();
    }).catch(error=>{storageError=error.message;console.error('审计存储载入失败',error);if(state.active)render();});
    view.addEventListener('click',event=>{
      if(storageBusy){event.preventDefault();return;}
      const device=event.target.closest('[data-work-device]');
      if(device){
        state.device=device.dataset.workDevice;navigation(state.active);$('ops-device-'+state.device).focus();return;
      }
      if(event.target.closest('[data-work-return]')){state.record='';state.editing='';render();return;}
      const download=event.target.closest('[data-work-download]');
      if(download){
        const file=current()?.evidence.find(item=>item.id===download.dataset.workDownload);
        if(!file){notice('文件不在当前授权单据内。');return;}
        const url=URL.createObjectURL(file.blob),link=document.createElement('a');
        link.href=url;link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
      }
      const menu=event.target.closest('[data-work-scene]');
      if(menu){
        if(!allowed(menu.dataset.workScene)){notice('访问被拒绝：当前角色无此入口权限。');return;}
        state.scene=menu.dataset.workScene;state.record='';state.query='';state.filter='pending';state.message='';state.editing='';activate();return;
      }
      const row=event.target.closest('[data-work-record]');
      if(row){
        const record=records.find(item=>item.id===row.dataset.workRecord&&item.scene===state.scene&&visible(item));
        if(!record){notice('访问被拒绝：单据不在当前授权场景。');return;}
        state.record=record.id;state.editing='';state.message='';render();$('work-document').focus({preventScroll:true});$('work-document').scrollIntoView({block:'start',behavior:'smooth'});return;
      }
      const action=event.target.closest('[data-work-action]');
      if(action){void mutate(()=>perform(action.dataset.workAction));return;}
      const link=event.target.closest('[data-work-link]');
      if(link){
        const target=state.role==='boss'?'boss-viewer':state.role==='admin'?'rbac':'';
        if(link.dataset.workLink!==target){notice('访问被拒绝：无此管理入口权限。');return;}
        document.querySelector('.nav-item[data-view="'+target+'"]').click();
      }
    });
    view.addEventListener('input',event=>{
      if(storageBusy)return;
      const input=event.target,record=current();
      if(input.matches('[data-work-query]')){state.query=input.value;return;}
      if(input.matches('[data-work-field]')){
        if(!record||!role().edit.includes(record.scene)||state.editing!==key(record)||!scenes[record.scene].fields.includes(input.dataset.workField)){notice('修改被拒绝：无字段编辑权限。');return;}
        state.drafts[key(record)][input.dataset.workField]=input.value;
        if(record.scene==='settlement')$('work-net').textContent=Number.isFinite(net(state.drafts[key(record)]))?'CNY '+net(state.drafts[key(record)]).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2}):'输入无效';
      }
      if(input.matches('[data-work-reason]')){
        if(!record||!role().edit.includes(record.scene)&&!role().review.includes(record.scene)){notice('操作被拒绝：当前人员仅可查看。');return;}
        state.notes[key(record)]=input.value;
      }
    });
    view.addEventListener('change',event=>{
      const input=event.target;
      if(storageBusy){render();return;}
      if(input.matches('[data-work-file]')){
        const file=input.files?.[0],record=current();
        if(!file)return;
        if(!record){notice('归档被拒绝：未选择授权单据。');return;}
        const note=String(state.notes[key(record)]||'').trim();
        if(!role().edit.includes(record.scene)||record.status==='frozen'||!note||file.size>5*1024*1024){notice('归档被拒绝：需编辑权限、未冻结、填写归档原因，且单个文件不超过5MB。');return;}
        void mutate(async()=>{
          const hash=await root.EXPORT_AUDIT_STORE.digest(file);
          if(record.evidence.some(item=>item.hash===hash)){notice('该文件已归档，未重复保存。');return;}
          const before=record.status;
          record.version++;record.status='draft';record.approval=null;record.editor=actor();
          record.checks.forEach(check=>check.confirmed=false);
          record.evidence.push({id:crypto.randomUUID(),name:file.name,size:file.size,type:file.type,version:record.version,actor:actor(),time:new Date().toISOString(),hash,blob:file});
          log(record,'归档原件并生成新版本',note+'；'+file.name,before);invalidate(record,'证据新增，V'+record.version);
          state.editing='';notice('原件、SHA-256及快照已归档；旧批准失效，下游冻结，待重新送审。');
        });return;
      }
      if(input.matches('[data-work-role]')){
        if(!Object.hasOwn(roles,input.value)){notice('切换失败：未知岗位。');return;}
        state.role=input.value;state.scene=role().menus[0]||'';state.record='';state.query='';state.filter='pending';state.editing='';state.message='';activate('role-change');return;
      }
      if(input.matches('[data-work-entry]')){
        const entry=input.value;
        if(entry.startsWith('scene:')){
          const scene=entry.slice(6);
          if(!allowed(scene)){notice('访问被拒绝：当前角色无此入口权限。');return;}
          state.scene=scene;state.record='';state.query='';state.filter='pending';state.editing='';state.message='';activate();return;
        }
        if(!canAccessEntry(entry)){notice('访问被拒绝：当前角色无此入口权限。');return;}
        document.querySelector(entry==='catalog'?'[data-sales-page="customs-catalog"]':'[data-capability="sales"]')?.click();return;
      }
      if(input.matches('[data-work-filter]')){
        if(!['all',...Object.keys(labels)].includes(input.value)){notice('筛选失败：未知状态。');return;}
        state.filter=input.value;state.record='';state.editing='';render();return;
      }
      if(input.matches('[data-work-check]')){
        const record=current(),check=record?.checks[Number(input.dataset.workCheck)];
        if(!record||!check||!role().review.includes(record.scene)||record.status!=='pending'||!check.available||record.submitter===actor()||record.editor===actor()){
          notice('核验被拒绝：角色、单据版本或凭证条件不满足。');return;
        }
        const checked=input.checked;
        void mutate(()=>{check.confirmed=checked;check.confirmedBy=actor();log(record,checked?'逐项核验':'撤销勾选',check.label,record.status);});
      }
    });
    view.addEventListener('submit',event=>{
      if(!event.target.matches('[data-work-search]'))return;
      event.preventDefault();state.record='';state.editing='';render();
    });
    view.addEventListener('keydown',event=>{
      if(!event.target.matches('[data-work-device]')||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      if(storageBusy)return;
      state.device=event.key==='Home'?'desktop':event.key==='End'?'mobile':state.device==='desktop'?'mobile':'desktop';
      navigation(state.active);$('ops-device-'+state.device).focus();
    });
  }
  root.EXPORT_OPERATIONS={initialize,navigation,render,canAccessEntry,getContractContext:()=>{
    const record=current();
    return record?{transaction:record.transaction,batch:record.batch,source:'运营单据 '+record.id+' / V'+record.version,
      values:{aName:record.values.company||'',goods:record.values.goods||'',quantity:record.values.quantity||'',eRoute:record.values.route||''}}:null;
  }};
})(globalThis);
