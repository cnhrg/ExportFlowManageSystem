'use strict';
(function(root){
  const databaseName='export-operations-audit-v1';
  let database,revision=0;
  const requestResult=request=>new Promise((resolve,reject)=>{
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
  async function digest(value){
    const bytes=value instanceof Blob?await value.arrayBuffer():new TextEncoder().encode(value);
    const hash=await crypto.subtle.digest('SHA-256',bytes);
    return Array.from(new Uint8Array(hash),byte=>byte.toString(16).padStart(2,'0')).join('');
  }
  async function verify(snapshot){
    if(snapshot.schema!==1||!Number.isInteger(snapshot.revision)||!Array.isArray(snapshot.records)||!Array.isArray(snapshot.events))throw new Error('本地审计数据格式不兼容，未覆盖旧数据。');
    let previous='';
    for(const entry of snapshot.events.slice().reverse()){
      const {hash,...body}=entry;
      if(body.previous!==previous||hash!==await digest(JSON.stringify(body)))throw new Error('审计摘要链不一致，已停止写入；请保留本地数据并核查。');
      previous=hash;
    }
    for(const record of snapshot.records){
      for(const file of record.evidence||[]){
        if(!(file.blob instanceof Blob)||file.hash!==await digest(file.blob))throw new Error('归档文件摘要不一致，已停止写入。');
      }
      if(snapshot.dataHash!==await digest(JSON.stringify(snapshot.records, (key,value)=>key==='blob'?undefined:value)))throw new Error('单据快照摘要不一致，已停止写入。');
    }
  }
  async function open(){
    if(!root.indexedDB||!root.crypto?.subtle)throw new Error('浏览器不支持IndexedDB或SHA-256，请用受支持的Chrome打开原型。');
    const request=indexedDB.open(databaseName,1);
    request.onupgradeneeded=()=>request.result.createObjectStore('snapshots');
    database=await new Promise((resolve,reject)=>{
      let blocked=false;
      request.onblocked=()=>{blocked=true;reject(new Error('审计存储升级被其他窗口阻止，请关闭旧窗口后刷新重试。'));};
      request.onerror=()=>reject(request.error);
      request.onsuccess=()=>{
        if(blocked){request.result.close();return;}
        resolve(request.result);
      };
    });
    database.onversionchange=()=>{database.close();database=null;};
    const transaction=database.transaction('snapshots','readonly');
    const snapshot=await requestResult(transaction.objectStore('snapshots').get('current'));
    if(snapshot){await verify(snapshot);revision=snapshot.revision;}
    return snapshot;
  }
  async function save(records,events){
    let previous='';
    for(const entry of events.slice().reverse()){
      if(!entry.hash){
        entry.previous=previous;
        entry.hash=await digest(JSON.stringify(entry));
      }
      previous=entry.hash;
    }
    const snapshot={schema:1,revision:revision+1,records,events,dataHash:await digest(JSON.stringify(records,(key,value)=>key==='blob'?undefined:value))};
    if(!database)throw new Error('审计数据库已关闭，请刷新后重试。');
    await new Promise((resolve,reject)=>{
      const transaction=database.transaction('snapshots','readwrite');
      const store=transaction.objectStore('snapshots');
      let conflict=false;
      const request=store.get('current');
      request.onsuccess=()=>{
        if((request.result?.revision||0)!==revision){conflict=true;transaction.abort();return;}
        store.put(snapshot,'current');
      };
      transaction.oncomplete=()=>resolve();
      transaction.onabort=()=>reject(new Error(conflict?'另一窗口已更新审计数据，请刷新重新载入；本次未写入。':'本地写入失败（容量或数据库错误），本次操作未保存。'));
      transaction.onerror=()=>console.error('审计存储事务失败',transaction.error);
    });
    revision=snapshot.revision;
  }
  root.EXPORT_AUDIT_STORE={open,save,digest};
})(globalThis);
