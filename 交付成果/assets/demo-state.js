'use strict';
(function (root) {
  const M = root.EXPORT_DEMO_MODEL || require('./demo-model.js');
  const S = root.EXPORT_PRODUCT_STATE || require('./product-guide-state.js');
  const clone = value => JSON.parse(JSON.stringify(value));
  const storageKey = 'export-entrance-demo/v1';
  function initial() {
    const state = {schema:1, data:S.initial(), snapshots:{}, files:[], requests:[], counter:0};
    for (const page of M.pages) for (const source of page.owners) {
      const key = S.recordKey(page, source);
      const record = {source,version:1,status:'draft',values:M.values(page),editor:'SYN-PERSON-1',
        history:[{action:'example-draft',actor:'SYN-PERSON-1',role:source,version:1,time:'2026-06-16T01:00:00.000Z',reason:'默认合成草稿，尚未提交'}]};
      state.data.records[key] = record;
      state.snapshots[key] = [{version:1,values:clone(record.values)}];
    }
    return state;
  }
  function validate(state) {
    if (!state || state.schema!==1 || !state.snapshots || typeof state.snapshots!=='object' || Array.isArray(state.snapshots) ||
      !Array.isArray(state.files) || !Array.isArray(state.requests) || !Number.isSafeInteger(state.counter) || state.counter<0)
      throw new Error('演示存档版本或结构不兼容，已停止写入，旧资料未覆盖。');
    S.validate(state.data);
    for (const page of M.pages) for (const source of page.owners) {
      const key=S.recordKey(page,source),record=state.data.records[key];
      if (!record || !Array.isArray(state.snapshots[key]) ||
        !state.snapshots[key].some(item=>item&&item.version===record.version&&JSON.stringify(item.values)===JSON.stringify(record.values)))
        throw new Error('演示存档缺少资料或当前版快照，已停止写入：'+key);
    }
    for (const [key, records] of Object.entries(state.snapshots)) {
      if (!state.data.records[key] || !Array.isArray(records) || records.some(item=>!item || !Number.isSafeInteger(item.version) ||
        !item.values || Object.values(item.values).some(value=>typeof value!=='string')))
        throw new Error('版本快照损坏，请保留存档：'+key);
    }
    for (const file of state.files) if (!M.pages.some(page=>page.id===file.page&&page.owners.includes(file.role)) ||
      typeof file.name!=='string' || !Number.isSafeInteger(file.size) || file.size<0 || file.size>10*1024*1024 ||
      !Number.isSafeInteger(file.version) || file.version<1)
      throw new Error('材料元数据损坏，已停止写入。');
    for (const item of state.requests) if (!M.actions.some(action=>action.id===item.action) ||
      !M.roles[item.role] || !['pending','reviewed','rejected'].includes(item.status) || typeof item.reason!=='string' ||
      !['SYN-PERSON-1','SYN-PERSON-2'].includes(item.actor) || !item.sourceVersions || typeof item.sourceVersions!=='object' ||
      Array.isArray(item.sourceVersions) || Object.values(item.sourceVersions).some(version=>!Number.isSafeInteger(version)||version<1))
      throw new Error('处置申请记录损坏，已停止写入。');
    return state;
  }
  function sourceFor(page, role) {
    return page.owners.includes(role) ? role : page.owners[0];
  }
  function record(state, page, role, source) {
    if (!M.canRead(page,role)) throw new Error('当前岗位无此对象的数据权限。');
    if (source && !page.owners.includes(source)) throw new Error('资料来源不适用。');
    const origin = source || sourceFor(page,role);
    if (M.privatePages.has(page.id) && page.owners.includes(role) && origin!==role)
      throw new Error('只能读取本方私有声明。');
    const value = S.read(state.data,page,origin);
    if (role==='D' && page.id==='payer-invoice' && (value?.status!=='approved' || value.stale)) return undefined;
    if (role==='D' && page.id==='payer-invoice') return {source:origin,version:value.version,status:value.status,values:clone(value.values),history:[]};
    return value;
  }
  const officialError = '正式办理已阻断：尚无真实身份、有效授权、银行或监管渠道及独立核实证据；不产生签署、放行、到账、余额变动、解除暂停、关案或结案成功。请保存待核材料并由责任人核实原办理号。';
  function apply(state, pageId, session, action, input={}) {
    validate(state);
    const page = M.pages.find(item=>item.id===pageId);
    if (!page || !M.roles[session.role] || !M.canRead(page,session.role)) throw new Error('当前入口或岗位无此业务对象权限。');
    if (!['SYN-PERSON-1','SYN-PERSON-2'].includes(session.actor)) throw new Error('未知演示经办人。');
    const source = session.source || sourceFor(page,session.role);
    const current = record(state,page,session.role,source);
    const key = S.recordKey(page,source);
    if (action==='upload') {
      if (!page.owners.includes(session.role) || source!==session.role) throw new Error('仅责任方能添加本方材料。');
      if (!input.name || !Number.isSafeInteger(input.size) || input.size<0 || input.size>10*1024*1024)
        throw new Error('请选择不超过10MB的合成材料；不读取真实内容。');
      if (current?.receiptUnknown || current?.status==='submitted') throw new Error('当前版本已提交或结果未知，请先处理原受理。');
      if (input.version!==current?.version) throw new Error('材料所属资料版本已变化，请重新读取后添加。');
      S.apply(state.data,pageId,{...session,source},'save',{version:input.version,values:current.values,reason:'新增合成材料元数据，原审核不沿用'});
      const saved=state.data.records[key];
      state.snapshots[key].push({version:saved.version,values:clone(saved.values)});
      const previous=state.files.filter(file=>file.page===pageId&&file.role===session.role&&file.name===input.name);
      state.files.push({page:pageId,role:session.role,name:String(input.name).slice(0,200),size:input.size,version:previous.length+1});
      return '合成材料元数据已保存，所属资料已修订为草稿，原审核不沿用；未上传S3、未扫描，也未成为正式可引用文件。请核对版本引用后另行提交。';
    }
    const definition = page.actions.find(item=>item.id===action);
    const mapped = definition && {...definition,kind:M.kindFor(definition,session.role)};
    if (mapped) {
      if (!mapped.roles.includes(session.role)) throw new Error('当前岗位只能查看设计，不能执行此动作。');
      if (['official','handoff'].includes(mapped.kind)) throw new Error(officialError);
      if (mapped.kind==='query') return '已读取本交易当前版本、来源及原请求历史；未发送新办理请求，也未新增受理号。';
      if (mapped.kind==='report') {
        const reason='源集合尚缺真实货物、海关、银行和税务证据；报告四项均为待核，正常结案阻断。';
        state.requests.push({id:'SYN-DEMO-'+(++state.counter),action,role:session.role,actor:session.actor,
          status:'pending',reason,sourceSequence:state.data.sequence,sourceVersions:Object.fromEntries(Object.entries(state.data.records).map(([id,value])=>[id,value.version]))});
        return '已保存不可变的本机核对报告：四项待核；没有全部通过或结案结果。';
      }
      if (mapped.kind==='case') {
        if (!String(input.reason||'').trim()) throw new Error('请填写实际差异、影响对象和希望如何处理。');
        if (!input.confirmed) throw new Error('请确认当前版本和处置范围。');
        const latest=state.requests.filter(item=>item.action===action&&item.role===source).at(-1);
        if (session.role==='reviewer') {
          if (!latest || latest.status!=='pending') throw new Error('尚无此来源的待审处置申请。');
          if (latest.actor===session.actor) throw new Error('不能复核本人提出的处置申请。');
          if (JSON.stringify(latest.sourceVersions)!==JSON.stringify(Object.fromEntries(Object.entries(state.data.records).map(([id,value])=>[id,value.version]))))
            throw new Error('源版本已变化，请经办人重新核对后提交新的处置申请。');
          latest.status=input.reject?'rejected':'reviewed'; latest.reviewer=session.actor; latest.reviewReason=input.reason;
          return '本机处置意见已'+(input.reject?'退回':'复核')+'；不解除任何实际暂停、不修改余额、不覆盖原节点。';
        }
        if (latest?.status==='pending') throw new Error('本方已有待审申请，请等待独立复核，不重复申请。');
        state.requests.push({id:'SYN-DEMO-'+(++state.counter),action,role:session.role,actor:session.actor,status:'pending',
          reason:input.reason,sourceVersions:Object.fromEntries(Object.entries(state.data.records).map(([id,value])=>[id,value.version]))});
        return '已保存本机差异/处置申请，等待独立复核；未改变原节点或暂停状态。';
      }
      if (mapped.kind==='review' || mapped.kind==='submit-review' && session.role==='reviewer') action=input.reject?'reject':'approve';
      else if (mapped.kind==='save' || mapped.kind==='revise') action='save';
      else action='submit';
    }
    if (['save','submit','submit-unknown','withdraw','recover','reserve'].includes(action) && (!page.owners.includes(session.role) || source!==session.role))
      throw new Error('只允许本方经办保存或提交，不能代其他主体办理。');
    if (page.id.endsWith('-edit')&&['save','submit','submit-unknown'].includes(action)) {
      const original=state.data.records[page.id==='supplier-edit'?'supplier-submit':'payer-submit'];
      if(original?.receiptUnknown)throw new Error('本方首次提交结果未知，请先由原提交人查询原受理，不能提前修改。');
    }
    if (action==='save') {
      input={...input,values:input.values||current?.values};
      if (page.id.endsWith('-edit')) {
        const original=state.data.records[page.id==='supplier-edit'?'supplier-submit':'payer-submit'];
        if (!original || original.status!=='submitted') throw new Error('请先完成本方首次提交，再修改原资源。');
      }
    }
    if (action==='approve' && page.id==='closure') throw new Error(officialError);
    const result = S.apply(state.data,pageId,{...session,source},action,input);
    if (['submit','submit-unknown'].includes(action)&&['supplier-submit','payer-submit'].includes(pageId)) {
      const editId=pageId==='supplier-submit'?'supplier-edit':'payer-edit',draft=state.data.records[editId];
      draft.values={...draft.values,...state.data.records[key].values};
      draft.version+=1;
      draft.originalVersion=state.data.records[key].version;
      draft.history.push({action:'prefill-original',actor:session.actor,role:session.role,version:draft.version,
        reason:'以本方首次提交的确切资料预填修改稿，尚未提交修改',time:new Date().toISOString()});
      state.snapshots[editId].push({version:draft.version,values:clone(draft.values)});
    }
    if (action==='save') {
      const saved=state.data.records[key];
      state.snapshots[key] ||= [];
      state.snapshots[key].push({version:saved.version,values:clone(saved.values)});
    }
    if (action==='submit' && page.id.endsWith('-edit')) {
      const originalId=page.id==='supplier-edit'?'supplier-submit':'payer-submit',original=state.data.records[originalId];
      state.snapshots[originalId].push({version:original.version,values:clone(original.values)});
    }
    return result.replaceAll('A首次','供应商首次').replaceAll('A已','供应商已').replaceAll('D付款','付款方付款');
  }
  const api={initial,validate,storageKey,sourceFor,record,apply,officialError};
  root.EXPORT_DEMO_STATE=api;
  if (typeof module==='object') module.exports=api;
})(globalThis);
