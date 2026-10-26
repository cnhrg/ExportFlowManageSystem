'use strict';
(function(root){
  const first=root.EXPORT_SYSTEM_USECASES_MODEL,second=root.EXPORT_STEP_TWO_USECASES_MODEL,third=root.EXPORT_STEP_THREE_USECASES_MODEL,d=root.EXPORT_DESIGN_DIAGRAMS;
  const registry=[
    ['one',first,root.EXPORT_SYSTEM_USECASES_ARTIFACTS,1,'一'],
    ['two',second,root.EXPORT_STEP_TWO_ARTIFACTS,2,'二'],
    ['three',third,root.EXPORT_STEP_THREE_ARTIFACTS,3,'三'],
    ...['FOUR','FIVE','SIX','SEVEN','EIGHT'].map((name,i)=>[name.toLowerCase(),root['EXPORT_STEP_'+name+'_USECASES_MODEL'],root['EXPORT_STEP_'+name+'_ARTIFACTS'],i+4,['四','五','六','七','八'][i]])
  ];
  for(const [key,model,bundle]of registry)if(!model||!bundle)throw new Error('Missing use case registration: '+key);
  const artifact=name=>{
    const bundle=registry.find(entry=>typeof entry[2][name]==='string');
    if(!bundle)throw new Error('Missing offline artifact: '+name);
    return bundle[2][name];
  };
  const resolveEndpoint=(reference,model=m)=>{
    const id=typeof reference==='string'?reference:reference.id;
    const endpoint=model.endpoints.find(item=>item.id===id)||registry.flatMap(entry=>entry[1].endpoints).find(item=>item.id===id);
    if(!endpoint)throw new Error('Missing endpoint: '+id);
    return endpoint;
  };
  let m=first,step='one';
  const esc=d.escape,table=d.table,artifacts=root.EXPORT_SYSTEM_USECASES_ARTIFACTS;
  let initialized=false,selected=m.useCases[0].id;
  const panel=()=>document.getElementById('system-usecases-panel');
  const endpointFile=endpoint=>endpoint.file||'proto/trade/filing/v1/'+(endpoint.audience==='内部运营'?'operations.proto':'filing.proto');
  const code=value=>'<pre class="s1-code" tabindex="0">'+esc(typeof value==='string'?value:JSON.stringify(value,null,2))+'</pre>';
  function download(name,label){
    return '<a href="../'+esc(name)+'" download data-s1-download="'+esc(name)+'">'+esc(label)+'</a>';
  }
  function useCaseSvg(){
    if(m!==first){
      const actors=[...new Set(m.useCases.flatMap(item=>item.actors||[item.actor]))];
      const associations=m.useCases.flatMap((u,i)=>(u.actors||[u.actor]).map(actor=>'<line x1="240" y1="'+(110+actors.indexOf(actor)*150)+'" x2="650" y2="'+(100+i*130)+'"/>')).join('');
      const height=Math.max(1220,m.useCases.length*130+90,actors.length*150+90);
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1380 '+height+'" role="img" aria-labelledby="s2-uml-title"><title id="s2-uml-title">'+esc(m.name)+'系统边界与业务目标用例</title><rect x="480" y="10" width="880" height="'+(height-20)+'" rx="8"/><text x="920" y="44">代理出口系统 · '+esc(m.name)+'</text><g class="s1-associations">'+associations+'</g><g class="s1-actors">'+actors.map((name,i)=>'<g><circle cx="220" cy="'+(90+i*150)+'" r="12"/><path d="M220,'+(102+i*150)+'v32m-24-20h48m-24 20-20 27m20-27 20 27"/><text x="220" y="'+(180+i*150)+'">'+esc(name)+'</text></g>').join('')+'</g>'+m.useCases.map((u,i)=>'<g class="s1-case'+(u.id===selected?' s1-case-primary':'')+'"><ellipse cx="920" cy="'+(100+i*130)+'" rx="270" ry="44"/><text x="920" y="'+(94+i*130)+'">'+esc(u.code)+'</text><text x="920" y="'+(118+i*130)+'">'+esc(u.name)+'</text></g>').join('')+'</svg>';
    }
    const actors=[['供应商',150],['付款方',380]];
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1120 550" role="img" aria-labelledby="s1-uml-title s1-uml-desc"><title id="s1-uml-title">步骤一双主体系统用例图</title><desc id="s1-uml-desc">供应商首次提交并创建交易，付款方首次提交付款资料；两者各可修改自己的原资料。服务主体是供应商收集的资料对象，不是额外在线提交者。</desc><rect x="240" y="10" width="850" height="530" rx="8"/><text x="660" y="44">代理出口系统 · 步骤一</text><g class="s1-associations">'+
      m.useCases.map((u,i)=>'<line x1="112" y1="'+(u.actor==='供应商'?170:400)+'" x2="435" y2="'+(110+i*115)+'"/>').join('')+
      '</g><g class="s1-actors">'+actors.map(([name,y])=>'<g><circle cx="90" cy="'+y+'" r="12"/><path d="M90,'+(y+12)+'v32m-24-20h48m-24 20-20 27m20-27 20 27"/><text x="90" y="'+(y+90)+'">'+name+'</text></g>').join('')+'</g>'+
      m.useCases.map((u,i)=>'<g class="s1-case'+(u.id===selected?' s1-case-primary':'')+'"><ellipse cx="660" cy="'+(110+i*115)+'" rx="225" ry="42"/><text x="660" y="'+(104+i*115)+'">'+u.code+'</text><text x="660" y="'+(128+i*115)+'">'+u.name+'</text></g>').join('')+'</svg>';
  }
  function protocol(endpoint,heading='h5'){
    const file=endpointFile(endpoint);
    const confirmation=/OperationConfirmation$/.test(endpoint.rpc),notice=endpoint.id==='notice';
    const source=artifact(file);
    const definitions=[endpoint.reqMsg,endpoint.rspMsg].map(name=>source.match(new RegExp('message '+name+' \\{[^}]*\\}'))?.[0]).join('\n\n');
    const entry=registry.find(item=>item[1].endpoints.some(e=>e.rpc===endpoint.rpc&&endpointFile(e)===file));
    if(!entry)throw new Error('Unregistered protocol: '+endpoint.rpc);
    const example=JSON.parse(entry[2]['doc/examples/step'+entry[3]+'/http-examples.json']).find(item=>item.rpc===endpoint.rpc);
    if(!example)throw new Error('Missing HTTP example: '+endpoint.rpc);
    const rpcExample=JSON.parse(entry[2]['doc/examples/step'+entry[3]+'/rpc-examples.json']).find(item=>(item.method||item.rpc)===endpoint.rpc);
    if(!rpcExample)throw new Error('Missing RPC example: '+endpoint.rpc);
    return '<article class="s1-endpoint" data-rpc="'+endpoint.rpc+'"><'+heading+'><code>'+esc(endpoint.method+' '+endpoint.path)+'</code></'+heading+'><p>'+esc(endpoint.detail)+'</p>'+
      table(['接口映射','明确约定'],[
        ['服务边界',endpoint.audience+' · '+(endpoint.service||(endpoint.audience==='内部运营'?'InternalFilingOperationsService':'ExternalTradeFilingService'))+'；同一应用，不是微服务'],
        ['Protocol Buffers方法',endpoint.rpc+'（'+endpoint.reqMsg+' → '+endpoint.rspMsg+'）；HTTP正文 '+endpoint.input+' → '+endpoint.output],
        ['响应正文映射','RspMsg.resource是强类型'+endpoint.output+'；google.api.http response_body: "resource"。HTTP只返回资源JSON，无RPC外壳/成功错误码。'],
        ['HTTP正文映射',endpoint.body?'请求正文直接为 '+endpoint.input+'；注解 body: "'+endpoint.body+'"，不再套请求消息外壳':'无正文，路径参数映射请求消息；'+(endpoint.query?.length?'仅允许显式查询参数 '+endpoint.query.join('、'):'未声明查询参数拒绝')],
        ['成功响应',endpoint.status+(endpoint.method==='POST'?'＋Location；相同幂等请求重放200':'')+'；资源实体标签按规范返回'],
        ['请求头',endpoint.method==='GET'?'Authorization；无副作用':notice?'第三方平台专用认证及原报文签名/时效/事件键，非用户Cookie/确认凭据':confirmation?'Authorization、Content-Type、独立Idempotency-Key；强认证与明确确认，不递归要求确认号':'Authorization、Content-Type、Idempotency-Key、X-Confirmation-Id'+(example.request.headers['If-Match']?'、If-Match':'')+'；机构签名仅选配，不要求供应商私钥'],
        ['HTTP/RPC超时','HTTP客户端总超时 '+endpoint.timeout.clientMs+'毫秒；应用处理上限 '+endpoint.timeout.serverMs+'毫秒；RPC调用必须设置同等总deadline，并接受服务端上限裁剪'],
        ['重试约定',endpoint.timeout.retry+'；SDK不得叠加透明写重试，超时不证明事务回滚'],
        ['RPC元数据',notice?'平台专用认证profile；未约定二进制通知规范时禁用该RPC':'authorization、idempotency-key、if-match、confirmation-id（确认创建本身例外）；机构invocation-proof-bin可选。内部/外部受众分离；不是内部模块RPC'],
        ['错误与详情','非OK gRPC状态＋RpcFailure；HTTP问题详情。UNAVAILABLE/DEADLINE_EXCEEDED写入结果可未知；ALREADY_EXISTS幂等异文、FAILED_PRECONDITION旧标签/缺标签以业务码区分，完整表见下方']
      ])+'<details><summary>REQUEST · 请求方法、地址、请求头与JSON正文</summary>'+code(example.request)+'</details>'+
      '<details><summary>RESPONSE · 响应状态、响应头与JSON正文</summary>'+code(example.httpResponse)+'</details>'+
      '<details><summary>cURL example · 原键与精确内容确认</summary><p>'+esc(notice?
        '仅展示平台通知的接收契约；必须按正式平台规范验原报文签名、时效和事件键，不使用用户确认凭据，示例不是可用的厂商请求。':
        '替换部署地址及本受众凭证；业务写须先取得绑定同一正文/原键/标签的确认，示例无真实凭证，无自动写重试。')+'</p>'+code(example.curl)+'</details>'+
      '<details><summary>RPC example · ReqMsg、RspMsg、metadata与deadline</summary>'+code(rpcExample)+'</details>'+
      '<details><summary>关联Protocol Buffers映射及ReqMsg / RspMsg定义</summary>'+code('rpc '+endpoint.rpc+' ('+endpoint.reqMsg+') returns ('+endpoint.rspMsg+') {\n  option (google.api.http) = { '+endpoint.method.toLowerCase()+': "'+endpoint.path+'"'+(endpoint.body?' body: "'+endpoint.body+'"':'')+' response_body: "resource" };\n}\n\n'+definitions)+download(file,'下载所在协议文件')+'</details></article>';
  }
  function getProtocolCatalog(){
    const key=endpoint=>endpointFile(endpoint)+'/'+endpoint.service+'/'+endpoint.rpc;
    const catalog=registry.flatMap(([step,model,bundle,number])=>model.endpoints.map(endpoint=>({
      key:key(endpoint),endpoint,step,stepNumber:number,stepName:model.name||'步骤一 · 交易资料提交',
      file:endpointFile(endpoint),errors:model.errors,useCases:[]
    })));
    const byKey=new Map(catalog.map(entry=>[entry.key,entry]));
    if(byKey.size!==catalog.length)throw new Error('Duplicate service protocol');
    for(const [step,model,,number]of registry){
      for(const useCase of model.useCases){
        for(const reference of useCase.endpoints){
          const entry=byKey.get(key(resolveEndpoint(reference,model)));
          if(!entry)throw new Error('Missing catalog protocol');
          entry.useCases.push({step,stepNumber:number,id:useCase.id,code:useCase.code,name:useCase.name});
        }
      }
    }
    return catalog;
  }
  function downloadArtifact(name){
    const content=artifact(name);
    const url=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'})),link=document.createElement('a');
    link.href=url;link.download=name.split('/').pop();document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  function select(id){
    const useCase=m.useCases.find(item=>item.id===id);if(!useCase)return;
    selected=id;
    document.querySelectorAll('#system-usecases-tabs [role="tab"]').forEach(button=>{
      const active=button.dataset.tab===id;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
    });
    panel().setAttribute('aria-labelledby','s1-tab-'+id);
    if(![first,second,third].includes(m)){renderLater(useCase);return;}
    if(m===third){renderThird(useCase);return;}
    if(m===second){renderSecond(useCase);return;}
    const example=id==='supplier-submit'?'trade-input.json':id==='payer-submit'?'payer-filing.json':id==='supplier-edit'?'supplier-replacement.json':'payer-replacement.json';
    panel().innerHTML='<h3>'+esc(useCase.code+' · '+useCase.name)+'</h3><p>'+esc(useCase.description)+'</p>'+
      '<p class="s1-note">本步骤由供应商和付款方分别填报。供应商提前收集出口代理、物流公司、出口报关代理的资料；付款方自行说明付款原因和与收货人的关系。运营人员不代建交易，物流公司也不在此单独提交。</p>'+
      table(['用例规约','边界'],[
        ['进入方式',useCase.actor+'实名登录后打开本方资料。仅知道交易号不能获得查看或修改权限。供应商可先预留号、填草稿，首次完整提交才创建交易。'],
        ['提交条件',id==='supplier-submit'?'本人有建单权限，交易号预留属于本人，所需资料和材料已齐备。':id==='payer-submit'?'交易已创建，本方身份及与该交易的关系已核实，尚未提交付款方资料。':'本方资料已存在，交易仍在编辑中，且本人有相应修改权限。先读取最新资料和版本标记，再完整提交修改。'],
        ['保存后的结果','交易仍在编辑中，尚未终审批准。每次首次提交或修改成功都会递增资料版本并留下记录；示例按供应商首次、付款方首次、双方修改的顺序形成版本1至4，普通保存不生成完整快照。'],
        ['失败或超时怎么办','保留原请求编号和原内容查询，已受理则返回原结果，不重复建单。相同编号内容不同报409；资料已被别人修改报412，缺少版本标记报428。结果不明时不要另取号重交。'],
        ['谁能改、保留什么','供应商不写付款方私有声明，付款方不改商品或供应商收集的资料。系统追加保存提交结果和修改位置，旧记录不覆盖，事件中不放私密正文。']
      ])+
      '<h4>系统顺序图 · 参与者与系统黑盒</h4><p>遵循已确认的《软件方法》表达方式：按业务意图命名系统事件，系统响应描述可观察结果；不将数据库或内部模块混入黑盒图。</p><div id="s1-system-sequence"></div>'+
      '<h4>实现展开图 · 单体应用、事务与中间件</h4><p>本图是同一系统事件的实现说明，不是微服务拆分。默认70%阅读比例，可放缩或适配全图。</p><div id="s1-selected-sequence"></div>'+
      '<h4>身份验证、抗抵赖及部署边界</h4>'+table(['设计面','约定'],m.assurance)+
      '<h4>HTTP与RPC错误码、超时恢复</h4>'+table(['稳定业务码','HTTP状态','gRPC状态','可恢复','处置'],m.errors.map(([reason,http,rpc,retry,detail])=>[reason,http===null?'无响应':http,rpc,retry?'有条件':'否',detail]))+
      '<h4>关联HTTP接口与Protocol Buffers映射</h4><p>以下接口与本用例直接关联；HTTP资源规范是独立契约，注解不替代请求头、状态码及权限规则。</p>'+
      useCase.endpoints.map(key=>protocol(m.endpoints.find(e=>e.id===key))).join('')+
      '<details><summary>预取单号中间件逻辑 · 同库事务与重入</summary><div id="s1-preorder-sequence"></div></details>'+
      '<details><summary>共用材料上传时序 · 私有对象存储与数据库边界</summary><div id="s1-upload-sequence"></div></details>'+
      '<details><summary>步骤一系统用例图 · 双主体四用例</summary><div class="s1-uml" tabindex="0" role="region" aria-label="步骤一用例图，宽图可局部滚动">'+useCaseSvg()+'</div></details>'+
      '<details><summary>本用例合成输入及HTTP/RPC请求、deadline与错误样例</summary><p>所有签名字节为明确无效占位，不是可用身份凭证或实际请求记录。</p>'+code(artifacts['doc/examples/step1/'+example])+code(artifacts['doc/examples/step1/http-examples.json'])+code(artifacts['doc/examples/step1/rpc-examples.json'])+code(artifacts['doc/examples/step1/rpc-error.json'])+'</details>'+
      '<details><summary>业务规则与来源</summary>'+table(['规则','约束'],m.rules)+
      '<p>原始工作簿只作字段定位及USD拒绝依据，不公开原文；合成三单有销售合同、商业发票、装箱单锚点。发票字段参考 <a href="https://www.trade.gov/commercial-invoice" target="_blank" rel="noopener noreferrer">International Trade Administration商业发票说明</a>；包装字段参考 <a href="https://www.trade.gov/packing-list" target="_blank" rel="noopener noreferrer">装箱单说明</a>，不作为中国法定要求。</p>'+
      '<p>本页与“数据库设计”和状态机使用同一领域模型。普通提交或修改不会批准交易，也不会生成完整快照。页面展示的是接口设计和合成数据；本机存储、扫描等中间件已可用于验证，生产业务接口和真实身份服务尚未实现。</p></details>'+
      '<details><summary>完整Protocol Buffers源码 · 对外服务</summary>'+code(artifacts['proto/trade/filing/v1/filing.proto'])+'</details>'+
      '<details><summary>内部运营协议 · 独立入口，只读，非步骤一提交者</summary>'+protocol(m.endpoints.find(e=>e.id==='operations'))+code(artifacts['proto/trade/filing/v1/operations.proto'])+'</details>'+
      '<div class="s1-downloads">'+[
        ['doc/步骤一HTTP接口协议.md','HTTP/RPC接口协议'],['doc/步骤一系统用例与业务规则.md','系统用例规约'],
        ['doc/examples/step1/http-reference.md','HTTP响应与cURL全集'],
        ['doc/步骤一身份签名与可靠性设计.md','身份签名、取号及自动重试'],
        ['proto/trade/filing/v1/filing.proto','对外Protocol Buffers'],['proto/trade/filing/v1/operations.proto','内部运营Protocol Buffers'],
        ['doc/sql/step1/README.md','MySQL样例说明'],['doc/sql/step1/schema.sql','数据库结构'],['doc/sql/step1/seed.sql','四用例SQL数据'],
        ['doc/examples/step1/material-bundle.html','合成人民币三单']
      ].map(([name,label])=>download(name,label)).join('')+'</div>';
    d.mount(document.getElementById('s1-system-sequence'),useCase.systemSequence,useCase.id+'-system',useCase.name+' · 系统黑盒',{initialScale:.7});
    d.mount(document.getElementById('s1-selected-sequence'),useCase.sequence,useCase.id,useCase.name+' · 单体实现',{initialScale:.7});
    const detail=document.getElementById('s1-upload-sequence').parentElement;
    detail.addEventListener('toggle',()=>{
      if(detail.open&&!detail.dataset.mounted){detail.dataset.mounted='true';d.mount(document.getElementById('s1-upload-sequence'),m.uploadSequence,'material-upload','材料私有直传及自行恢复',{initialScale:.7});}
    });
    const preorder=document.getElementById('s1-preorder-sequence').parentElement;
    preorder.addEventListener('toggle',()=>{
      if(preorder.open&&!preorder.dataset.mounted){preorder.dataset.mounted='true';d.mount(document.getElementById('s1-preorder-sequence'),m.preorderSequence,'number-reservation','预取交易号与重入',{initialScale:.7});}
    });
  }
  function renderSecond(useCase){
    const examples=JSON.parse(root.EXPORT_STEP_TWO_ARTIFACTS['doc/examples/step2/http-examples.json']);
    const linked=useCase.endpoints.map(key=>m.endpoints.find(e=>e.id===key)||first.endpoints.find(e=>e.id===key));
    panel().innerHTML='<h3>'+esc(useCase.code+' · '+useCase.name)+'</h3><p>'+esc(useCase.description)+'</p>'+
      '<p class="s1-note">本步骤先批准签约依据，再分别审核和签署三类合同；也可处理补正、公共物流协议引用和正式报关授权。页面使用合成例，未接入真实电子签；步骤一的编辑资料须经过审核才能当签约依据。</p>'+
      table(['用例说明','处理要求'],[['参与者',useCase.actor],['办理目标',useCase.intent],['失败或超时怎么办','使用原请求编号和原内容查询，系统仍检查当前身份、入口及权限。同号不同内容报409，旧版本标记报412，缺标记报428。签署结果不明时先查原平台任务，不另起重复签署。'],['何时算签署、何时生效','全部签署证据核实并归档后记录已签署（状态5）；生效条件也满足后才生效（状态6）。平台通知或浏览器跳回都不能直接让合同生效。']])+
      '<h4>系统顺序图 · 参与者与系统黑盒</h4><div id="s1-system-sequence"></div>'+
      '<h4>实现展开图 · 单体、事务与中间件</h4><p>默认70%。调用电子签平台、读写对象存储时不持有业务锁。HTTP 201仅表示本次请求已保存，合同是否签署、生效须另查。</p><div id="s1-selected-sequence"></div>'+
      '<details><summary>实现细节：事务与保存顺序</summary>'+code(useCase.transaction)+'</details>'+
      '<h4>关联HTTP资源与Protocol Buffers</h4>'+linked.map(protocol).join('')+
      '<details><summary>步骤二系统用例图 · 九个业务目标</summary><div class="s1-uml" tabindex="0" role="region" aria-label="步骤二用例图，宽图可局部滚动">'+useCaseSvg()+'</div></details>'+
      '<details><summary>本用例HTTP/RPC合成输入输出与实体映射</summary><p>无真实签名或有效凭证；已签/生效内容仅设计推演，不能做付款依据。</p>'+code(examples.filter(e=>linked.some(endpoint=>endpoint.rpc===e.rpc)))+code(root.EXPORT_STEP_TWO_ARTIFACTS['doc/examples/step2/entity-projection.json'])+'</details>'+
      '<details><summary>规则、操作证据与错误恢复</summary>'+table(['规则','约束'],m.rules)+table(['身份/部署','约定'],first.assurance)+table(['业务码','HTTP','gRPC','可重试','处置'],m.errors.map(row=>[row[0],row[1]??'无响应',row[2],row[3]?'有条件':'否',row[4]]))+'<p>步骤二独有门禁、完整错误分类和平台接入边界详见接口规范，不以HTTP解析成功代替业务核验。</p></details>'+
      (useCase.id==='basis-submit'?'<details><summary>供应商补齐签约必需字段 · 仍使用步骤一原PUT入口</summary><p>以下全为未执行合成例；资质/报价原文件仅结构演示，不是真实法律或业务证明。</p>'+code(root.EXPORT_STEP_TWO_ARTIFACTS['doc/examples/step2/basis-supplier-replacement.json'])+'</details>':'')+
      (useCase.id==='basis-review'?'<details><summary>同一送审版的协议适用、正式委托与认可 · 只读证据投影</summary><p>三笔连续更正后一次送审的合成结构；占位文件不是有效官方证据。</p>'+code(root.EXPORT_STEP_TWO_ARTIFACTS['doc/examples/step2/evidence-review-context.json'])+'</details>':'')+
      '<details><summary>完整Protocol Buffers源码</summary>'+code(root.EXPORT_STEP_TWO_ARTIFACTS['proto/trade/contracts/v1/contracts.proto'])+'</details>'+
      '<div class="s1-downloads">'+[['doc/步骤二系统用例与接口协议.md','步骤二完整规约/错误/超时'],['proto/trade/contracts/v1/contracts.proto','步骤二Protocol Buffers'],['doc/examples/step2/http-reference.md','HTTP响应与cURL全集'],['doc/examples/step2/http-examples.json','HTTP合成例'],['doc/examples/step2/rpc-examples.json','RPC合成例'],['doc/examples/step2/entity-projection.json','实体数据例'],['doc/examples/step2/review-document.html','原创待审正文'],['doc/步骤一身份签名与可靠性设计.md','无设备身份与证据设计']].map(([name,label])=>download(name,label)).join('')+'</div>';
    d.mount(document.getElementById('s1-system-sequence'),useCase.systemSequence,'step2-'+useCase.id+'-system',useCase.name+' · 系统黑盒',{initialScale:.7});
    d.mount(document.getElementById('s1-selected-sequence'),useCase.sequence,'step2-'+useCase.id,useCase.name+' · 单体实现',{initialScale:.7});
  }
  function renderThird(useCase){
    const a=root.EXPORT_STEP_THREE_ARTIFACTS,examples=JSON.parse(a['doc/examples/step3/http-examples.json']);
    const linked=useCase.endpoints.map(id=>m.endpoints.find(e=>e.id===id)||second.endpoints.find(e=>e.id===id));
    panel().innerHTML='<h3>'+esc(useCase.code+' · '+useCase.name)+'</h3><p>'+esc(useCase.description)+'</p>'+
      '<p class="s1-note">步骤三对应备货、订舱提货和运输签收。证据提交只表示待核实；无真实合同/正式放行/有权签收证据时，不能确认外部成功。隔离验证不代表生产API已部署。</p>'+
      table(['用例说明','处理要求'],[['参与者',useCase.actor],
        ['身份与版本','核实经办身份和授权，需要时重新认证，再由本人确认本次内容。供应商无需签名设备。批准交易资料与物流计划各有版本；重复查询原请求也不能跳过当前权限检查。'],
        ['失败或超时怎么办','缺凭据报422，阶段不符或超额报409，旧版本标记报412，缺标记报428。用原编号和原内容查询原结果；超时不取消货物分配，也不能换内容沿用原编号。']])+
      '<h4>系统顺序图 · 参与者与系统黑盒</h4><div id="s1-system-sequence"></div>'+
      '<h4>实现展开图 · 单体、事务与中间件</h4><p>默认70%；先查重入、交易根锁控制跨批累计、文件扫描与存储不持业务锁。</p><div id="s1-selected-sequence"></div>'+
      '<details><summary>实现细节：事务与保存顺序</summary>'+code(useCase.transaction)+'</details>'+
      '<h4>关联HTTP资源与Protocol Buffers</h4>'+linked.map(protocol).join('')+
      '<details><summary>步骤三系统用例图 · 七个业务目标</summary><div class="s1-uml" tabindex="0" role="region" aria-label="步骤三用例图，宽图可局部滚动">'+useCaseSvg()+'</div></details>'+
      '<details><summary>本用例HTTP/RPC合成输入与实体映射</summary>'+code(examples.filter(e=>linked.some(endpoint=>endpoint.rpc===e.rpc)))+code(a['doc/examples/step3/entity-projection.json'])+'</details>'+
      '<details><summary>规则、错误及身份与操作证据</summary>'+table(['规则','约束'],m.rules)+table(['业务码','HTTP','gRPC','可恢复','处置'],m.errors.map(row=>[row[0],row[1]??'无响应',row[2],row[3]?'有条件':'否',row[4]]))+table(['身份设计','约定'],first.assurance)+'</details>'+
      '<details><summary>完整Protocol Buffers源码</summary>'+code(a['proto/trade/logistics/v1/logistics.proto'])+'</details>'+
      '<div class="s1-downloads">'+[['doc/步骤三系统用例与接口协议.md','步骤三完整规约/实体/门禁'],['proto/trade/logistics/v1/logistics.proto','步骤三Protocol Buffers'],
        ['doc/examples/step3/http-reference.md','HTTP响应与cURL全集'],['doc/examples/step3/http-examples.json','HTTP合成例'],['doc/examples/step3/rpc-examples.json','RPC合成例'],
        ['doc/examples/step3/entity-projection.json','实体数据例'],['doc/examples/step3/material.html','原创合成物流材料']].map(([name,label])=>download(name,label)).join('')+'</div>'+
      '<p>外部系统尚未接入，仅检查缺少正式证据时是否阻断；离线示例不能作为外部办理成功的证明。</p>';
    d.mount(document.getElementById('s1-system-sequence'),useCase.systemSequence,'step3-'+useCase.id+'-system',useCase.name+' · 系统黑盒',{initialScale:.7});
    d.mount(document.getElementById('s1-selected-sequence'),useCase.sequence,'step3-'+useCase.id,useCase.name+' · 单体实现',{initialScale:.7});
  }
  function renderLater(useCase){
    const entry=registry.find(item=>item[1]===m),a=entry[2],number=entry[3],label=entry[4];
    const linked=useCase.endpoints.map(reference=>resolveEndpoint(reference));
    const localExamples=JSON.parse(a['doc/examples/step'+number+'/http-examples.json']);
    const files=[['doc/步骤'+label+'系统用例与接口协议.md','完整规约、领域映射及门禁'],
      ...[...new Set(m.endpoints.map(endpoint=>endpoint.file))].map(file=>[file,'Protocol Buffers源码']),
      ['doc/examples/step'+number+'/http-reference.md','HTTP RESPONSE与cURL全集'],
      ['doc/examples/step'+number+'/http-examples.json','HTTP类型化合成例'],
      ['doc/examples/step'+number+'/rpc-examples.json','RPC类型化合成例']];
    for(const [name]of files)if(typeof a[name]!=='string')throw new Error('Missing required step artifact: '+name);
    panel().innerHTML='<h3>'+esc(useCase.code+' · '+useCase.name)+'</h3><p>'+esc(useCase.description)+'</p>'+
      '<p class="s1-note">本页是设计和隔离验证结果，生产接口尚未实现。缺少真实银行、海关或税务依据时不能继续相应业务；上传材料、内部批准或请求已保存，都不能证明外部办理成功。本版不提供垫资、授信或特殊结案。</p>'+
      table(['用例说明','处理要求'],[['参与者',useCase.actor],
        ['身份与凭据','先核实身份和授权，需要时重新认证，再由本人确认本次内容。经办人与独立复核人分开；查询原请求也要检查当前权限。'],
        ['历史和超时处理','批准资料、材料旧版和正式办理记录均保留。用原请求编号和原内容查询时返回原结果；同号内容不同报409，缺版本标记报428，旧标记报412。外部结果不明时先查原办理号，不重复执行。']])+
      '<h4>系统顺序图 · 参与者与系统黑盒</h4><div id="s1-system-sequence"></div>'+
      '<h4>实现展开图 · 单体、事务与中间件</h4><p>默认70%；READ COMMITTED、先查重入与根锁后当前读，外部I/O和文件恢复不占业务锁。</p><div id="s1-selected-sequence"></div>'+
      '<details><summary>实现细节：事务与保存顺序</summary>'+code(useCase.transaction)+'</details>'+
      '<h4>关联HTTP资源与Protocol Buffers</h4>'+linked.map(protocol).join('')+
      '<details><summary>本步骤系统用例图</summary><div class="s1-uml" tabindex="0" role="region" aria-label="'+esc(m.name)+'用例图，宽图局部滚动">'+useCaseSvg()+'</div></details>'+
      '<details><summary>本用例合成输入输出与领域规则</summary>'+code(localExamples.filter(example=>linked.some(endpoint=>endpoint.rpc===example.rpc)))+
      (a['doc/examples/step'+number+'/entity-projection.json']?code(a['doc/examples/step'+number+'/entity-projection.json']):'')+
      table(['规则','约束'],m.rules)+table(['业务码','HTTP','gRPC','可恢复','处置'],m.errors.map(row=>[row[0],row[1]??'无响应',row[2],row[3]?'有条件':'否',row[4]]))+'</details>'+
      '<details><summary>身份与操作证据</summary>'+table(['设计','约定'],first.assurance)+'</details>'+
      '<div class="s1-downloads">'+files.map(([name,label])=>download(name,label)).join('')+'</div>'+
      '<p>本步为设计与离线示例；内部合成数据、真实中间件操作和外部办理事实不能相互替代，未接入的外部渠道不宣称办理成功。</p>';
    d.mount(document.getElementById('s1-system-sequence'),useCase.systemSequence,'step'+number+'-'+useCase.id+'-system',useCase.name+' · 系统黑盒',{initialScale:.7});
    d.mount(document.getElementById('s1-selected-sequence'),useCase.sequence,'step'+number+'-'+useCase.id,useCase.name+' · 单体实现',{initialScale:.7});
  }
  const selections=Object.fromEntries(registry.map(([key,model])=>[key,model.useCases[0].id]));
  function selectStep(id){
    const entry=registry.find(item=>item[0]===id);if(!entry)throw new Error('Unknown use case step: '+id);
    selections[step]=selected;step=id;m=entry[1];
    document.querySelectorAll('#system-usecases-steps [role="tab"]').forEach(button=>{
      const active=button.dataset.tab===step;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
    });
    document.getElementById('system-usecases-step-panel').setAttribute('aria-labelledby','s1-step-'+step);
    const host=document.getElementById('system-usecases-tabs');
    host.setAttribute('aria-label',m.name||'步骤一系统用例');
    host.innerHTML=m.useCases.map(item=>'<button type="button" id="s1-tab-'+item.id+'" role="tab" data-tab="'+item.id+'" aria-controls="system-usecases-panel" aria-selected="false" tabindex="-1">'+esc(item.name)+'</button>').join('');
    select(selections[step]);
  }
  function initialize(){
    if(initialized)return;initialized=true;
    const steps=document.getElementById('system-usecases-steps');
    steps.innerHTML=registry.map(([id,model])=>'<button id="s1-step-'+id+'" data-tab="'+id+'" type="button" role="tab" aria-selected="false" tabindex="-1" aria-controls="system-usecases-step-panel">'+esc(model===first?'步骤一 · 交易资料提交':model.name)+'</button>').join('');
    const host=document.getElementById('system-usecases-tabs');
    d.bindTabs(host,select);d.bindTabs(steps,selectStep);selectStep('one');
    panel().addEventListener('click',event=>{
      const anchor=event.target.closest('[data-s1-download]');if(!anchor)return;event.preventDefault();
      downloadArtifact(anchor.dataset.s1Download);
    });
  }
  function show(){initialize();}
  root.EXPORT_SYSTEM_USECASES_WORKSPACE={initialize,show,select,selectStep,getProtocolCatalog,renderProtocol:protocol,getProtocolSource:artifact,downloadArtifact};
})(globalThis);
