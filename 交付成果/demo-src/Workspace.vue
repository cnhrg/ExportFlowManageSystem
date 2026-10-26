<script setup>
import {computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch} from 'vue';
import {ElAlert, ElButton, ElCheckbox, ElDialog, ElInput, ElOption, ElSelect, ElTabPane, ElTabs, ElTag} from 'element-plus';

const M=globalThis.EXPORT_DEMO_MODEL, D=globalThis.EXPORT_DEMO_STATE, S=globalThis.EXPORT_PRODUCT_STATE;
const steps=globalThis.EXPORT_PRODUCT_GUIDE.steps;
const state=shallowRef(D.initial()), role=ref('A'), actor=ref('SYN-PERSON-1'), source=ref('A');
const entrance=ref('external'), group=ref('home'), pageId=ref(''), search=ref(''), filter=ref('all');
const form=ref({}), tab=ref('business'), dirty=ref(false), blocked=ref(''), message=ref(''), isError=ref(false), problems=ref([]);
const confirmVersion=ref(false), checked=ref(false), reason=ref('已核对本版材料、商品数量及责任范围（合成演示）');
const drawer=ref(false), preview=ref(null), uploadConsent=ref(false), busy=ref(false), oldVersion=ref(1);
let raw=null, currentHash='',listOrigin=null;
const listMemory=new Map();
const page=computed(()=>M.pages.find(item=>item.id===pageId.value));
const roles=computed(()=>Object.entries(M.roles).filter(([id])=>entrance.value==='external'?['A','D'].includes(id):!['A','D'].includes(id)));
const visible=computed(()=>M.pages.filter(item=>M.canRead(item,role.value)));
const menus=computed(()=>Object.entries(M.groups).filter(([id])=>visible.value.some(item=>item.group===id)));
const session=()=>({role:role.value,actor:actor.value,source:source.value});
const record=computed(()=>page.value?D.record(state.value,page.value,role.value,source.value):null);
const owner=computed(()=>page.value?.owners.includes(role.value)&&source.value===role.value);
const editable=computed(()=>owner.value&&!record.value?.receiptUnknown&&
  (record.value?.status!=='submitted'||page.value?.id.endsWith('-edit'))&&!blocked.value);
const stateName=entry=>!entry?'尚无已审有效发票':entry.receiptUnknown?'提交结果未知':entry.stale?'上游变更 · 待重新核对':MStatus(entry);
function MStatus(entry) {return globalThis.EXPORT_PRODUCT_GUIDE.states[entry.status];}
const availableActions=computed(()=>page.value?.actions.filter(item=>item.roles.includes(role.value)).map(item=>({...item,kind:M.kindFor(item,role.value)}))||[]);
const tradeSummary=computed(()=>['A','B','reviewer'].includes(role.value)?
  state.value.data.records['supplier-submit'].values:M.values(M.pages.find(item=>item.id==='supplier-submit')));
function displayMoney(value) {
  const [whole,part='00']=String(value).split('.');
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g,',')+'.'+part.padEnd(2,'0');
}
const list=computed(()=>visible.value.filter(item=>(group.value==='home'||item.group===group.value)&&
  (!search.value||(item.title+' '+M.example.trade+' '+item.actions.map(action=>action.title).join(' ')).includes(search.value))&&
  (filter.value==='all'||safeRecord(item)?.status===filter.value)));
function safeRecord(item) {return D.record(state.value,item,role.value,D.sourceFor(item,role.value));}
const dependencies=computed(()=>page.value?S.dependencies(state.value.data,page.value):[]);
const canSubmit=computed(()=>owner.value&&record.value&&['draft','rejected','withdrawn'].includes(record.value.status));
const snapshots=computed(()=>state.value.snapshots[S.recordKey(page.value,source.value)]||[]);
const previous=computed(()=>snapshots.value.find(item=>item.version===oldVersion.value));
const changes=computed(()=>page.value?.fields.filter(field=>previous.value&&previous.value.values[field.key]!==form.value[field.key])||[]);
const documents=computed(()=>page.value?[
  ...M.documents(page.value,role.value).map(item=>({...item,restricted:item.restricted&&!record.value,
    version:record.value?.version||1,status:role.value==='D'&&pageId.value==='payer-invoice'?'已审有效演示发票':'原创合成准备稿'})),
  ...state.value.files.filter(item=>!(role.value==='D'&&pageId.value==='payer-invoice')&&item.page===pageId.value&&item.role===source.value).map(item=>({...item,id:item.name,purpose:'仅本机元数据',status:'未上传 · 未扫描'}))
]:[]);
const visibleRequests=computed(()=>state.value.requests.filter(item=>page.value?.usecases.includes(item.action)&&
  (['B','reviewer'].includes(role.value)||item.role===role.value)));
const fields=computed(()=>{
  const buckets=[{id:'identity',title:'主体与业务安排',keys:['supplier','supplierCode','supplierAddress','supplierContact','payer','payerCode','payerCountry','payerContact','consignee','deliveryAddress','nominatedPayer','relationshipKind','relation','relationshipEvidence','agent','logisticsProvider','customsProvider','scope','paths','contract','authority','purpose']},
    {id:'goods',title:'商品与金额',keys:['goods','goodsSpec','quantity','unit','unitPrice','money','currency','cartons','netWeight','grossWeight','fee','allocations','account']},
    {id:'evidence',title:'材料、版本与办理信息',keys:[]}];
  return buckets.map(bucket=>({...bucket,fields:(page.value?.fields||[]).filter(field=>bucket.id==='evidence'?
    !buckets.slice(0,2).some(other=>other.keys.includes(field.key)):bucket.keys.includes(field.key))})).filter(bucket=>bucket.fields.length);
});
const moneyLabel=computed(()=>page.value?.id==='tax-package'?'申报货值（人民币）':page.value?.id==='tax-credit'?'本方到账声明金额（人民币，待核）':'人民币金额');
function fieldLabel(field) {
  if(field.key==='money')return moneyLabel.value;
  return M.fullNames(field.label).replaceAll('A授权','供应商授权').replaceAll('A与B','供应商与出口代理').replaceAll('A/B','供应商/出口代理')
    .replace(/^B主体/,'出口代理主体').replace(/^E主体/,'物流公司主体').replace(/^F主体/,'出口报关代理主体').replace(/^INVOICE/,'付款发票');
}
function say(text,error=false,focus=true) {message.value=text;isError.value=error;if(focus)nextTick(()=>document.querySelector('.demo-message')?.focus());}
function loadForm() {
  if(!page.value)return;
  form.value={...(record.value?.values||{})};
  confirmVersion.value=false;checked.value=false;dirty.value=false;problems.value=[];tab.value='business';
  oldVersion.value=snapshots.value.at(-2)?.version||1;
}
function guard() {
  if(!dirty.value)return true;
  if(!window.confirm('有尚未保存的修改。放弃修改并离开？'))return false;
  dirty.value=false;return true;
}
function encodeRoute() {return '#demo/'+entrance.value+'/'+role.value+'/'+group.value+(pageId.value?'/'+pageId.value:'');}
function navigate(next={}) {
  if(!guard())return;
  if(!pageId.value)listMemory.set(role.value+'/'+group.value,{search:search.value,filter:filter.value,scroll:window.scrollY});
  if(next.entrance)entrance.value=next.entrance;
  if(next.role) {role.value=next.role;actor.value=next.role==='reviewer'?'SYN-PERSON-2':'SYN-PERSON-1';}
  if(next.group)group.value=next.group;
  pageId.value=next.page||'';
  if(page.value)source.value=D.sourceFor(page.value,role.value);
  const remembered=listMemory.get(role.value+'/'+group.value);
  search.value=remembered?.search||'';filter.value=remembered?.filter||'all';drawer.value=false;message.value='';
  currentHash=encodeRoute();
  if(location.hash!==currentHash)location.hash=currentHash;else applyRoute();
}
function applyRoute() {
  let match=location.hash.match(/^#demo\/(external|internal)\/([A-Za-z]+)\/([a-z]+)(?:\/([a-z0-9-]+))?$/);
  const old=location.hash.match(/^#product-workspace\/([A-Za-z]+)\/([a-z0-9-]+)$/);
  if(old) {
    const item=M.pages.find(entry=>entry.id===old[2]);
    if(!item||!M.roles[old[1]]) {say('旧链接的岗位或页面不存在。',true);return;}
    match=[null,['A','D'].includes(old[1])?'external':'internal',old[1],item.group,item.id];
  }
  if(!match) {
    if(/^#(?:capabilities|product-workspace)$/.test(location.hash))openEntrance(location.hash==='#capabilities'?'internal':'external');
    return;
  }
  if(!guard()) {history.replaceState(null,'',currentHash);return;}
  const [,entry,nextRole,nextGroup,id]=match;
  const nextPage=M.pages.find(item=>item.id===id);
  if(!M.roles[nextRole]||(['A','D'].includes(nextRole))!==(entry==='external')||
    nextGroup!=='home'&&!M.groups[nextGroup]||id&&(!nextPage||nextPage.group!==nextGroup||!M.canRead(nextPage,nextRole))) {
    say('链接无效或当前岗位无此页面权限；未输出其他主体资料。',true);
    history.replaceState(null,'',currentHash||'#demo/external/A/home');return;
  }
  if(role.value!==nextRole)actor.value=nextRole==='reviewer'?'SYN-PERSON-2':'SYN-PERSON-1';
  entrance.value=entry;role.value=nextRole;group.value=nextGroup;pageId.value=id||'';
  if(page.value)source.value=D.sourceFor(page.value,role.value);
  drawer.value=false;loadForm();currentHash=encodeRoute();
  history.replaceState(null,'',currentHash);
  globalThis.EXPORT_APP.showView('business-demo');
  document.querySelectorAll('[data-view="external-demo"],[data-view="internal-demo"]').forEach(button=>button.classList.toggle('active',button.dataset.view===entry+'-demo'));
  nextTick(()=>{
    document.querySelector('#demo-main-title')?.focus({preventScroll:true});
    window.scrollTo(0,pageId.value?0:listMemory.get(role.value+'/'+group.value)?.scroll||0);
  });
}
function openEntrance(entry) {navigate({entrance:entry,role:entry==='external'?'A':'B',group:'home'});}
function readStorage() {
  try {
    const value=localStorage.getItem(D.storageKey);
    state.value=value?D.validate(JSON.parse(value)):D.initial();
    raw=value;blocked.value='';loadForm();
  } catch(error) {blocked.value='无法读取演示存档，已停止写入且未覆盖原资料：'+error.message;}
}
function persist(action,input={}) {
  if(blocked.value)throw new Error(blocked.value);
  if(localStorage.getItem(D.storageKey)!==raw)throw new Error('另一页面已更新资料，请保留当前输入后重新读取，不能覆盖新版本。');
  const next=JSON.parse(JSON.stringify(state.value));
  const text=D.apply(next,pageId.value,session(),action,{version:record.value?.version,confirmed:role.value==='reviewer'?checked.value:confirmVersion.value,checked:checked.value,reason:reason.value,values:{...form.value},...input});
  const encoded=JSON.stringify(next);
  localStorage.setItem(D.storageKey,encoded);raw=encoded;state.value=next;
  return text;
}
async function perform(action,input={}) {
  if(busy.value)return;
  busy.value=true;problems.value=[];
  try {
    const mapped=availableActions.value.find(item=>item.id===action);
    if(dirty.value&&action!=='save'&&action!=='upload'&&!['save','revise'].includes(mapped?.kind))throw new Error('请先保存当前修改，再核对确切版本。');
    if(action==='save'||mapped&&['save','revise'].includes(mapped.kind)) {
      const errors=S.errors(page.value,form.value);problems.value=errors;
      if(errors.length) {
        await nextTick();document.querySelector('.demo-form [aria-invalid="true"] input, .demo-form input[aria-invalid="true"]')?.focus();
        throw new Error('请按字段提示修正资料，当前输入已保留。');
      }
    }
    // Give the pending state a paint before a potentially expensive local serialization.
    await new Promise(resolve=>requestAnimationFrame(resolve));
    const text=persist(action,input);
    if(action!=='upload'||!dirty.value)loadForm();
    say(text);
  } catch(error) {say(error.message,true,!problems.value.length);}
  finally {busy.value=false;}
}
function fieldError(field) {return problems.value.find(text=>text.startsWith(field.label)||field.key==='grossWeight'&&text.startsWith('毛重')||['money','quantity','unitPrice'].includes(field.key)&&text.includes('数量×单价'))||'';}
function changeRole(value) {navigate({role:value,group:'home'});}
function changeSource(value) {
  if(!guard())return;
  source.value=value;loadForm();
}
function openPage(item) {
  if(!M.canRead(item,role.value)){say('当前岗位不能查看此来源正文，请由对应责任方处理前置任务。',true);return;}
  if(!pageId.value)listOrigin={role:role.value,group:group.value};
  navigate({group:item.group,page:item.id});
}
function returnToList() {
  navigate({group:listOrigin?.role===role.value?listOrigin.group:page.value.group});
}
function focusDetail(action) {
  if(!action.roles.includes(role.value))return;
  perform(action.id);
}
function viewDesign(action) {
  if(!guard())return;
  const W=globalThis.EXPORT_SYSTEM_USECASES_WORKSPACE;
  W.show();W.selectStep(['one','two','three','four','five','six','seven','eight'][action.step-1]);W.select(action.id);
  globalThis.EXPORT_APP.showView('system-usecases');
}
function reset() {
  if(!window.confirm('恢复同一套合成示例会清除此Demo的修改和轨迹；不会删除旧工作台存档。确认恢复？'))return;
  try {
    if(blocked.value)throw new Error('存档当前不可读取；请先保留原始存档并处理问题，不能直接覆盖。');
    if(localStorage.getItem(D.storageKey)!==raw)throw new Error('另一页面已更新，请先重新读取再恢复示例。');
    const next=D.initial(),encoded=JSON.stringify(next);localStorage.setItem(D.storageKey,encoded);
    raw=encoded;state.value=next;dirty.value=false;loadForm();say('已恢复同一套正常合成草稿，所有正式证据仍待核。');
  } catch(error) {say(error.message,true);}
}
function reload() {if(!guard())return;readStorage();if(!blocked.value)say('已读取当前浏览器最新演示资料。');}
function upload(event) {
  const file=event.target.files[0];
  if(!file)return;
  if(!uploadConsent.value) {say('请先确认仅选择合成材料，不选择真实证件、账号或合同。',true);event.target.value='';return;}
  perform('upload',{name:file.name,size:file.size});event.target.value='';
}
function openPreview(doc) {
  if(doc.restricted) {say('付款方只能查看已审有效发票，当前草稿不展示。',true);return;}
  preview.value=doc;
}
function exportData() {
  try {
    const entry={trade:M.example.trade,page:pageId.value,source:source.value,record:record.value,
      versions:role.value==='D'&&pageId.value==='payer-invoice'?[]:snapshots.value,requests:visibleRequests.value,notice:'仅本方合成离线资料，不是正式凭证'};
    const blob=new Blob([JSON.stringify(entry,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);
    const link=document.createElement('a');link.href=url;link.download=pageId.value+'-example.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  } catch(error) {say('导出失败：'+error.message,true);}
}
function beforeUnload(event) {if(dirty.value) {event.preventDefault();event.returnValue='';}}
function storageChanged(event) {if(event.key===D.storageKey)say('另一页面已更新，请保留当前输入后重新读取。',true);}
function leaving(event) {if((event.target.closest('.nav-item')||event.target.closest('a'))&&!guard()){event.preventDefault();event.stopImmediatePropagation();}}
watch(source,()=>{confirmVersion.value=false;});
onMounted(()=>{
  readStorage();applyRoute();
  globalThis.EXPORT_DEMO={openEntrance,open:(nextRole,id)=>{
    const item=M.pages.find(entry=>entry.id===id);
    if(item)navigate({entrance:['A','D'].includes(nextRole)?'external':'internal',role:nextRole,group:item.group,page:id});
  },getSnapshot:()=>JSON.parse(JSON.stringify(state.value))};
  globalThis.EXPORT_PRODUCT_WORKSPACE={open:globalThis.EXPORT_DEMO.open};
  window.addEventListener('hashchange',applyRoute);window.addEventListener('beforeunload',beforeUnload);
  window.addEventListener('storage',storageChanged);document.addEventListener('click',leaving,true);
});
onUnmounted(()=>{
  window.removeEventListener('hashchange',applyRoute);window.removeEventListener('beforeunload',beforeUnload);
  window.removeEventListener('storage',storageChanged);document.removeEventListener('click',leaving,true);
});
</script>

<template>
  <div class="trade-demo">
    <a href="#demo-content" class="demo-skip">跳到业务内容</a>
    <header class="demo-topbar">
      <div class="demo-brand"><span class="demo-mark" aria-hidden="true">T</span><div><strong>{{ entrance==='external'?'对外门户':'对内工作台' }}</strong><small>代理出口 · 合成业务演示</small></div></div>
      <div class="demo-identity">
        <label>工作身份<ElSelect :model-value="role" aria-label="工作身份" @update:model-value="changeRole"><ElOption v-for="[id,name] in roles" :key="id" :label="name" :value="id"/></ElSelect></label>
        <label>演示人员<ElSelect v-model="actor" aria-label="演示人员"><ElOption label="经办人员一" value="SYN-PERSON-1"/><ElOption label="独立人员二" value="SYN-PERSON-2"/></ElSelect></label>
      </div>
    </header>
    <div class="demo-disclaimer">离线example数据 · 角色切换不是真实登录 · 不填写真实资料 · 所有正式签署、银行及监管渠道均未接入</div>
    <div v-if="blocked" role="alert" class="demo-error">{{ blocked }}</div>
    <div class="demo-message" :class="{'has-error':isError}" :role="isError?'alert':'status'" aria-live="polite" tabindex="-1">{{ message }}</div>
    <div class="demo-mobile-bar"><ElButton @click="drawer=!drawer" :aria-expanded="drawer" aria-controls="demo-menu">功能菜单</ElButton><span>{{ M.roles[role] }} / {{ group==='home'?'工作首页':M.groups[group] }}</span></div>
    <div class="demo-layout">
      <aside id="demo-menu" class="demo-nav" :class="{'is-open':drawer}">
        <div class="demo-nav-label">工作入口 / {{ M.roles[role] }}</div>
        <nav aria-label="当前岗位业务功能">
          <button :aria-current="group==='home'?'page':undefined" @click="navigate({group:'home'})">工作首页</button>
          <button v-for="[id,name] in menus" :key="id" :aria-current="group===id?'page':undefined" @click="navigate({group:id})">{{ name }}<span>{{ visible.filter(item=>item.group===id).length }}</span></button>
        </nav>
        <div class="demo-nav-footer"><p>只显示当前岗位可访问功能。<br>入口归组不授予办理权限。</p><ElButton @click="reload">重新读取</ElButton><ElButton @click="reset">恢复示例</ElButton><a :href="'../doc/'+(entrance==='external'?'对外产品需求与操作手册':'对内运营产品需求与操作手册')+'.html'">产品操作手册</a></div>
      </aside>
      <div id="demo-content" class="demo-content" role="region" aria-label="当前业务内容" tabindex="-1">
        <div class="demo-breadcrumb"><button @click="navigate({group:'home'})">{{ entrance==='external'?'对外门户':'对内工作台' }}</button><span>/</span><button v-if="group!=='home'" @click="navigate({group})">{{ M.groups[group] }}</button><span v-if="page">/ {{ page.title }}</span></div>
        <template v-if="!page">
          <div class="demo-page-heading"><div><p class="demo-eyebrow">{{ group==='home'?'WORKSPACE':'BUSINESS RECORDS' }}</p><h2 id="demo-main-title" tabindex="-1">{{ group==='home'?'把本笔交易，办清楚。':M.groups[group] }}</h2><p>{{ group==='home'?'从当前身份的业务入口开始。示例资料已经填好，核对后再保存与提交。':'按业务对象进入详情，查看版本、材料与下一步。' }}</p></div><ElTag effect="plain">人民币 · 无垫资</ElTag></div>
          <div v-if="group==='home'" class="demo-stats">
            <article><small>当前合成交易</small><strong>01</strong><span>{{ state.data.tradeCreated?'本机已首次提交':'资料已预填 · 尚未首次提交' }}</span></article>
            <article><small>可访问业务</small><strong>{{ visible.length.toString().padStart(2,'0') }}</strong><span>按岗位及责任范围显示</span></article>
            <article><small>正式外部证据</small><strong>待核</strong><span>未接入，不作为真实办理依据</span></article>
          </div>
          <section class="demo-trade-summary">
            <div><span class="demo-eyebrow">示例交易档案</span><h3>{{ M.example.trade }}</h3><p>{{ role==='D'?'示例海桥采购公司 · 本方付款资料':role==='A'?M.example.supplier:'当前岗位受托交易' }}</p></div>
            <div><small>货值（仅合成计划）</small><strong>¥{{ displayMoney(tradeSummary.money) }}</strong><span>{{ role==='D'?'付款关系须独立声明':tradeSummary.goods+' · '+tradeSummary.cartons+'箱' }}</span></div>
          </section>
          <section v-if="group==='home'" class="demo-card"><h3>从这里继续</h3><p>所有页面使用同一套正常example数据；当前均为准备资料，不代表外部事项已经完成。</p><div class="demo-quick-actions"><ElButton v-for="item in visible.slice(0,3)" :key="item.id" @click="openPage(item)">{{ item.title }}</ElButton></div></section>
          <section class="demo-card">
            <div class="demo-list-tools"><h3>{{ group==='home'?'我的业务目录':'业务对象' }}</h3><ElInput v-model="search" clearable placeholder="搜索业务、用例或交易号" aria-label="搜索业务"/><ElSelect v-model="filter" aria-label="按资料状态筛选"><ElOption label="全部资料状态" value="all"/><ElOption label="草稿" value="draft"/><ElOption label="待独立核对" value="submitted"/><ElOption label="已退回" value="rejected"/><ElOption label="已审演示资料" value="approved"/></ElSelect></div>
            <div class="demo-object-list">
              <button v-for="item in list" :key="item.id" class="demo-object" @click="openPage(item)">
                <span class="demo-object-index">{{ String(item.step).padStart(2,'0') }}</span>
                <span class="demo-object-copy"><strong>{{ item.title }}</strong><small>{{ M.example.trade }} · {{ M.groups[item.group] }}</small></span>
                <span class="demo-object-state">{{ stateName(safeRecord(item)) }}</span><span aria-hidden="true">→</span>
              </button>
              <div v-if="!list.length" class="demo-empty"><h3>没有匹配的业务</h3><p>请清空关键词或切换资料状态；不会因此新增交易。</p><ElButton @click="search='';filter='all'">清空筛选</ElButton></div>
            </div>
          </section>
        </template>
        <template v-else>
          <div class="demo-page-heading"><div><p class="demo-eyebrow">{{ M.groups[page.group] }} / {{ M.example.trade }}</p><h2 id="demo-main-title" tabindex="-1">{{ page.title }}</h2><p>{{ M.fullNames(page.goal) }}</p></div><ElButton @click="returnToList">返回列表</ElButton></div>
          <div class="demo-context"><ElTag :type="record?.stale||record?.receiptUnknown?'warning':'info'">{{ stateName(record) }}</ElTag><span v-if="record">当前V{{ record.version }} · {{ dirty?'有未保存修改':'本机合成资料' }}</span><span>后续：{{ page.mode==='external'?'责任人核实正式来源':page.mode==='review'?'提交后交独立人员核对':'由本方确认提交' }}</span></div>
          <div v-if="page.owners.length>1&&['B','reviewer'].includes(role)&&!page.owners.includes(role)" class="demo-source"><label>查看资料来源<ElSelect :model-value="source" @update:model-value="changeSource"><ElOption v-for="id in page.owners" :key="id" :label="M.roles[id]" :value="id"/></ElSelect></label><p>不同主体的声明分别保存，不能互相替代。</p></div>
          <div v-if="!record" class="demo-card demo-empty"><h3>尚无已审且有效的付款发票</h3><p>财务正在准备本交易发票。付款方不能看到待审稿，也不能修改财务资料。</p></div>
          <template v-else>
            <ElTabs v-model="tab" class="demo-tabs">
              <ElTabPane label="业务办理" name="business">
                <section v-if="dependencies.length" class="demo-card demo-dependencies"><h3>办理前先核对</h3><div v-for="dep in dependencies" :key="dep.id"><span :class="{'demo-ready':dep.ready}">{{ dep.ready?'演示依据已具备':'尚缺有效依据' }}</span><button @click="openPage(M.pages.find(item=>item.id===dep.id))">{{ M.pages.find(item=>item.id===dep.id).title }} · V{{ dep.version }}</button></div></section>
                <section v-if="['shipment','customs'].includes(page.group)||page.id==='supplier-submit'||page.id==='supplier-edit'" class="demo-card">
                  <div class="demo-section-title"><h3>{{ page.group==='customs'?'申报商品行（合成草稿）':'商品与批次明细' }}</h3><ElTag effect="plain">批准分配尚待核实</ElTag></div>
                  <div class="demo-table-scroll"><table class="demo-table"><caption class="demo-sr">本交易商品行，字段修改请使用下方商品与金额表单</caption><thead><tr><th>商品 / 规格</th><th>数量 / 单位</th><th>单价</th><th>货值</th><th>箱数 / 净毛重</th></tr></thead><tbody><tr><td>{{ form.goods||M.example.goods[0].name }}<br><small>{{ form.goodsSpec||'HC-M1 / 中国' }}</small></td><td>{{ form.quantity||'100' }} {{ form.unit||'PCS' }}</td><td>¥{{ form.unitPrice||'125.00' }}</td><td>¥{{ form.money||'12500.00' }}</td><td>{{ form.cartons||'10' }}箱<br>{{ form.netWeight||'100.000' }} / {{ form.grossWeight||'120.000' }} kg</td></tr></tbody></table></div>
                </section>
                <section v-if="page.group==='funds'&&role!=='D'" class="demo-card"><h3>资金与费用分开看</h3><div class="demo-fund-grid"><div><small>拟处理货款</small><strong>¥{{ form.money||'12500.00' }}</strong><span>待银行核实，不是实收</span></div><div><small>银行费用说明</small><strong>¥{{ form.fee||'80.00' }}</strong><span>试算引用，承担方需正式依据</span></div><div><small>付款方承担的服务费</small><strong>¥300.00</strong><span>首次获批分账结算，每笔交易一次</span></div></div><p class="demo-muted">服务费从付款方已核验可用余额结算，不减少供应商合同应付。示例货款12500.00加服务费300.00需12800.00，银行费用另据实际约定；仅12500.00不足同时支付全额货款与服务费。缺收费依据、付款方授权或足额可用余额时阻断分账。</p><p class="demo-muted">受限 / 可用 / 付款锁额：均无已核实余额。预填分配与付款申请不改变三桶，也不证明供应商到账。</p></section>
                <section v-if="page.group==='shipment'" class="demo-card"><h3>计划与实际进度</h3><ol class="demo-timeline"><li><strong>订舱准备</strong><span>计划2026-06-18 · 示例联程物流</span></li><li><strong>提货计划</strong><span>2026-06-19 · 无实际提货核实记录</span></li><li class="is-pending"><strong>出境与交付待核</strong><span>缺同批正式放行与签收证据，不推算完成时间</span></li></ol></section>
                <section v-if="page.group==='contracts'" class="demo-card"><h3>合同与签署方</h3><div class="demo-signer-list"><div v-for="name in ['供应商','出口代理','适用的物流/报关服务商']" :key="name"><strong>{{ name }}</strong><span>授权与必要签署范围待核</span><ElTag type="info">未核实签署</ElTag></div></div><p class="demo-muted">默认每笔交易、每种用途单独签署；公共协议只有明确适用时才可引用。浏览器确认与合同正式签署分开。</p></section>
                <section v-if="page.group==='cases'" class="demo-card"><h3>四流核对与暂停范围</h3><div class="demo-report-grid"><article v-for="name in ['货物流','报关流','资金流','退税流']" :key="name"><strong>{{ name }}</strong><ElTag type="warning">待核</ElTag><p>尚缺正式来源和完整对象集合</p></article></div><p>暂停原因逐项处理；处置申请不等于解除暂停，关闭案件不等于正常结案。</p></section>
                <section v-if="page.group==='tax'" class="demo-card"><h3>{{ page.id.startsWith('proof')?'证明协作档案':'退税申请档案' }}</h3><dl class="demo-definition"><dt>本笔范围</dt><dd>{{ M.example.trade }} / 计划批次SYN-LOT-001 / 草稿申报SYN-DEC-001</dd><dt>正式来源</dt><dd>无官方受理、签发或决定；申请主责与适用范围仍须正式依据</dd><dt>金额核对</dt><dd>申请货值、决定金额、银行到账分别核对；目前不推算退税额</dd></dl></section>
                <form class="demo-form" @submit.prevent="perform('save')">
                  <section v-for="bucket in fields" :key="bucket.id" class="demo-card">
                    <h3>{{ bucket.title }}</h3><p class="demo-muted">{{ editable?'默认已填合成数据，按本笔资料核对后保存。':'只读当前确切版本；不能修改其他方或已送审正文。' }}</p>
                    <div class="demo-field-grid">
                      <div v-for="field in bucket.fields" :key="field.key" class="demo-field" :class="{'is-wide':field.kind==='text'}">
                        <label :for="'demo-field-'+field.key">{{ fieldLabel(field) }}<span v-if="field.key!=='relationshipEvidence'||form.relationshipKind!=='同一法定主体'" class="demo-required"> *</span></label>
                        <ElSelect v-if="field.key==='relationshipKind'" :id="'demo-field-'+field.key" v-model="form[field.key]" :disabled="!editable" @change="dirty=true" :aria-describedby="'demo-help-'+field.key" :aria-invalid="Boolean(fieldError(field))"><ElOption label="同一法定主体" value="同一法定主体"/><ElOption label="不同法定主体" value="不同法定主体"/></ElSelect>
                        <ElInput v-else :id="'demo-field-'+field.key" v-model="form[field.key]" :readonly="!editable||field.key==='currency'" :maxlength="1200" :type="field.kind==='text'&&form[field.key]?.length>50?'textarea':'text'" :autosize="{minRows:2,maxRows:5}" :inputmode="['money','quantity','integer','decimal'].includes(field.kind)?'decimal':'text'" :aria-describedby="'demo-help-'+field.key" :aria-invalid="Boolean(fieldError(field))" @input="dirty=true"/>
                        <small :id="'demo-help-'+field.key" :class="{'demo-field-error':fieldError(field)}">{{ M.fullNames(fieldError(field)||field.rule) }}</small>
                      </div>
                    </div>
                  </section>
                  <section class="demo-card demo-material-inline"><h3>本版材料</h3><div class="demo-doc-cards"><button v-for="doc in documents" :key="doc.id" type="button" @click="openPreview(doc)"><span class="demo-doc-icon" aria-hidden="true">≡</span><span><strong>{{ doc.name }}</strong><small>V{{ doc.version }} · {{ doc.status }}</small></span><span>预览</span></button></div><ElButton @click="tab='materials'">查看材料清单与模拟上传</ElButton></section>
                  <section class="demo-card demo-next">
                    <h3>{{ role==='reviewer'?'独立核对与决定':'保存、核对，再办理' }}</h3>
                    <ElAlert v-if="page.mode==='external'" :closable="false" type="warning" title="本页仅准备和登记待核资料。正式来源未接入，不能生成外部成功。"/>
                    <label v-if="owner" class="demo-check"><ElCheckbox v-model="confirmVersion">已核对当前保存版本V{{ record.version }}及其材料引用，确认只提交本方内容</ElCheckbox></label>
                    <label v-if="role==='reviewer'" class="demo-check"><ElCheckbox v-model="checked">已逐项核对当前版本、材料及上游依据</ElCheckbox></label>
                    <div v-if="role==='reviewer'||page.actions.some(item=>item.kind==='case')" class="demo-reason"><label for="demo-reason">审核 / 差异 / 处置意见</label><ElInput id="demo-reason" v-model="reason" type="textarea" :rows="3" maxlength="1200"/></div>
                    <div class="demo-action-bar">
                      <ElButton v-if="editable" type="primary" native-type="submit" :loading="busy">保存{{ record.version>1?'新修订':'草稿' }}</ElButton>
                      <ElButton v-if="page.id==='supplier-submit'&&owner&&!state.data.tradeCreated" :disabled="Boolean(blocked)" @click="perform('reserve')">{{ state.data.reserved?'已预取同号':'预取交易号' }}</ElButton>
                      <ElButton v-if="canSubmit" :disabled="dirty||Boolean(blocked)" :loading="busy" @click="perform('submit')">{{ page.mode==='filing'?'确认提交本方资料':'提交待核资料' }}</ElButton>
                      <ElButton v-if="owner&&record.status==='submitted'&&page.mode!=='filing'&&!record.receiptUnknown" @click="perform('withdraw')">撤回待核资料</ElButton>
                      <ElButton v-if="owner&&record.requestId" @click="perform('recover')">查询原受理</ElButton>
                      <ElButton v-if="role==='reviewer'&&page.mode==='review'" type="primary" :loading="busy" @click="perform('approve')">独立核对通过</ElButton>
                      <ElButton v-if="role==='reviewer'&&page.mode==='review'" @click="perform('reject')">退回补正</ElButton>
                    </div>
                    <details class="demo-recovery"><summary>提交超时或未收到响应时</summary><p>按原请求查询，不更换交易号或重新提交。此按钮只演示“本机已保存、响应丢失”，不调用正式接口。</p><ElButton v-if="canSubmit" :disabled="dirty" @click="perform('submit-unknown')">演练原提交响应丢失</ElButton></details>
                    <p class="demo-muted">恢复方式：{{ M.fullNames(page.recovery) }}</p>
                  </section>
                </form>
                <section class="demo-card"><h3>本页业务动作</h3><p class="demo-muted">按当前岗位列出具体目标。涉及正式证据的动作明确阻断；本机处理不替代正式事实。</p><div class="demo-usecase-actions"><article v-for="action in availableActions" :key="action.id" :data-demo-case="action.id"><div><h4>{{ action.title }}</h4><p>{{ action.description }}</p></div><ElButton :loading="busy" @click="focusDetail(action)">{{ action.kind==='query'?'查询当前对象与历史':['official','handoff'].includes(action.kind)?'核对办理条件':action.kind==='review'?'审核当前版本':action.kind==='report'?'生成待核报告':action.kind==='case'?role==='reviewer'?'复核处置意见':'提交处置申请':['save','revise'].includes(action.kind)?'保存当前准备稿':'按当前版本提交' }}</ElButton><ElButton link @click="viewDesign(action)">用例与协议</ElButton></article><p v-if="!availableActions.length">当前岗位只读观察此页；办理动作由责任方完成。</p></div></section>
              </ElTabPane>
              <ElTabPane label="材料与预览" name="materials">
                <section class="demo-card"><h3>材料清单</h3><p>材料版本不覆盖；本地模拟只保存文件名和大小，不读取文件内容、不计算虚假摘要、不声称上传或扫描成功。</p><div class="demo-doc-cards"><button v-for="doc in documents" :key="doc.id+'-'+doc.version" @click="openPreview(doc)"><span class="demo-doc-icon" aria-hidden="true">≡</span><span><strong>{{ doc.name }}</strong><small>{{ doc.purpose }} · V{{ doc.version }}</small><small>{{ doc.status }}</small></span><span>预览</span></button></div><div v-if="editable" class="demo-upload"><ElCheckbox v-model="uploadConsent">仅选择原创合成材料，不选择真实单证、身份或账号文件</ElCheckbox><label for="demo-upload">添加本方材料元数据（不超过10MB）</label><input id="demo-upload" type="file" @change="upload"><p>保存后在当前清单可见；受控文件的正式上传、扫描和确切版本核实仍须后端支持。</p></div></section>
              </ElTabPane>
              <ElTabPane v-if="!(role==='D'&&page.id==='payer-invoice')" label="版本与记录" name="history">
                <section class="demo-card"><div class="demo-section-title"><h3>版本对照</h3><ElButton @click="exportData">导出本方合成资料</ElButton></div><label>选择保存的旧版<ElSelect v-model="oldVersion"><ElOption v-for="item in snapshots" :key="item.version" :label="'V'+item.version" :value="item.version"/></ElSelect></label><p>当前编辑区与V{{ oldVersion }}比较。所有旧版快照保留，不把当前主档替代历史。</p><div class="demo-table-scroll"><table class="demo-table"><thead><tr><th>字段</th><th>所选旧版</th><th>当前内容</th></tr></thead><tbody><tr v-for="field in changes" :key="field.key"><th>{{ fieldLabel(field) }}</th><td>{{ previous.values[field.key] }}</td><td>{{ form[field.key] }}</td></tr><tr v-if="!changes.length"><td colspan="3">与所选保存版本暂无字段差异</td></tr></tbody></table></div></section>
                <section class="demo-card"><h3>本方受理与操作历史</h3><ol class="demo-timeline"><li v-for="(entry,index) in record.history" :key="index"><strong>V{{ entry.version }} · {{ ({'example-draft':'默认示例草稿',save:'保存新版本',submit:'确认提交','submit-unknown':'提交后响应丢失',approve:'独立资料审核通过',reject:'退回补正',withdraw:'撤回待审','replace-original':'原资源修订'})[entry.action]||entry.action }}</strong><span>{{ entry.time }} · {{ entry.actor==='SYN-PERSON-2'?'独立人员二':'经办人员一' }}</span><span>{{ entry.reason }}</span></li></ol><p v-if="record.requestId">原受理号：{{ record.requestId }} · 提交V{{ record.submittedVersion }} · {{ record.receiptUnknown?'结果未知，先原号恢复':'本机结果已知' }}</p><div v-for="entry in visibleRequests" :key="entry.id" class="demo-request"><strong>{{ entry.id }} · {{ entry.status==='pending'?'待独立处理':entry.status==='rejected'?'已退回':'本机意见已复核' }}</strong><p>{{ entry.reason }}</p><p>{{ entry.reviewReason }}</p></div></section>
              </ElTabPane>
              <ElTabPane label="用例与协议" name="design">
                <section class="demo-card"><h3>页面与系统用例对应</h3><p>流程第{{ page.step }}步 · {{ steps[page.step-1] }}。接口为设计契约，当前不发送请求。</p><article v-for="action in page.actions" :key="action.id" class="demo-protocol"><h4>{{ action.title }} <small>{{ action.code }}</small></h4><p>{{ action.description }}</p><ElButton @click="viewDesign(action)">查看双层时序及完整协议</ElButton><ul><li v-for="api in action.protocols" :key="api.rpc"><code>{{ api.method }} {{ api.path }}</code><small>{{ api.rpc }} · {{ api.audience }}</small></li></ul></article></section>
              </ElTabPane>
            </ElTabs>
          </template>
        </template>
      </div>
    </div>
    <ElDialog :model-value="Boolean(preview)" title="原创合成材料预览" class="demo-preview" width="760px" append-to-body @close="preview=null" @update:model-value="value=>{if(!value)preview=null}">
      <article v-if="preview" class="demo-paper">
        <div class="demo-paper-mark">EXAMPLE / 非正式材料</div><h2>{{ preview.name }}</h2><p>交易：{{ M.example.trade }} · 材料V{{ preview.version }} · 仅离线演示</p>
        <template v-if="preview.size!==undefined"><p>合成文件名：{{ preview.name }}</p><p>大小：{{ preview.size }}字节。未读取文件内容，本窗口仅预览元数据。</p></template>
        <template v-else-if="role==='D'&&page.id==='payer-invoice'"><h3>本交易付款发票</h3><p>{{ form.invoice }}</p><p>货款人民币{{ form.money }}元；本版材料：{{ form.materials }}</p><p>仅已审有效的合成发票，不是正式申报、银行核验或扣费凭证。</p></template>
        <template v-else-if="role==='D'"><h3>付款关系说明</h3><p>{{ form.payer }}</p><p>{{ form.relation }}</p><p>支持资料：{{ form.relationshipEvidence }}</p></template>
        <template v-else><dl class="demo-definition"><dt>供应商</dt><dd>{{ M.example.supplier }}</dd><dt>实际收货人</dt><dd>{{ M.example.consignee }}</dd><dt>商品</dt><dd>{{ form.goods||M.example.goods[0].name }}</dd><dt>数量与货值</dt><dd>{{ form.quantity||'100' }} PCS × ¥{{ form.unitPrice||'125.00' }} = ¥{{ form.money||'12500.00' }}</dd><dt>包装</dt><dd>{{ form.cartons||'10' }}箱，净重{{ form.netWeight||'100.000' }}kg，毛重{{ form.grossWeight||'120.000' }}kg</dd></dl><h3>材料用途与边界</h3><p>{{ preview.purpose }}</p><p>本准备稿不含真实签名或印章，不证明身份、授权、实际运输、银行实收或官方受理。主体、内容及有效版本须在正式办理时另行核实。</p></template>
      </article>
      <template #footer><ElButton @click="preview=null">关闭预览</ElButton></template>
    </ElDialog>
  </div>
</template>
