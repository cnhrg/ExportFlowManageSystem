'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'../../..'),model=require('../../../交付成果/assets/step-seven-usecases-model.js');
const profile=path.join(root,'doc/examples/step7/.chrome-validation-'+require('node:crypto').randomBytes(6).toString('hex'));
fs.mkdirSync(profile);
const chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',[
  '--headless=new','--no-first-run','--no-default-browser-check','--disable-background-networking',
  '--disable-component-update','--disable-sync','--disable-extensions','--metrics-recording-only',
  '--disable-features=OptimizationHints,MediaRouter','--user-data-dir='+profile,
  '--remote-debugging-port=0','about:blank'],{stdio:['ignore','ignore','pipe']});
let socket,sequence=0,stderr='';const pending=new Map(),exceptions=[];
chrome.stderr.on('data',value=>{stderr+=value;});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function wait(test,label){const end=Date.now()+45000;while(Date.now()<end){if(await test())return;await sleep(100);}throw new Error(label);}
function send(method,params={}){return new Promise((resolve,reject)=>{
  const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout '+method));},30000);
  pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));
});}
async function js(expression){
  const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
(async()=>{
  try{
    for(const useCase of model.useCases)for(const source of [useCase.systemSequence,useCase.sequence])assert.ok(!source.includes(';'),useCase.id);
    await wait(()=>fs.existsSync(path.join(profile,'DevToolsActivePort')),'Chrome readiness failed: '+stderr);
    const port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];
    const targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
    socket=new WebSocket(targets.find(target=>target.type==='page').webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
    socket.addEventListener('message',event=>{
      const value=JSON.parse(event.data),entry=pending.get(value.id);
      if(entry){clearTimeout(entry.timer);pending.delete(value.id);value.error?entry.reject(new Error(JSON.stringify(value.error))):entry.resolve(value.result);}
      if(value.method==='Runtime.exceptionThrown')exceptions.push(value.params.exceptionDetails);
    });
    await send('Runtime.enable');await send('Page.enable');await send('Network.enable');
    await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
    await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1080,deviceScaleFactor:1,mobile:false});
    await send('Page.navigate',{url:'file://'+path.join(root,'交付成果/代理出口业务流程图.html')});
    await wait(()=>js('Boolean(globalThis.EXPORT_APP&&globalThis.EXPORT_SYSTEM_USECASES_WORKSPACE)'),'Eight-step page failed to initialize');
    await js("document.querySelector('[data-view=\"system-usecases\"]').click()");
    await wait(()=>js("Boolean(document.querySelector('#s1-step-seven'))"),'Step-seven registration missing');
    await js("document.querySelector('#s1-step-seven').click()");
    assert.equal(await js("document.querySelectorAll('#system-usecases-steps [role=\"tab\"]').length"),8);
    assert.equal(await js("document.querySelectorAll('#system-usecases-tabs [role=\"tab\"]').length"),model.useCases.length);
    const checks=[];
    for(const useCase of model.useCases){
      await js('document.querySelector('+JSON.stringify('#s1-tab-'+useCase.id)+').click()');
      await wait(()=>js("Boolean(document.querySelector('#s1-selected-sequence svg')&&document.querySelector('#s1-system-sequence svg'))"),'Diagrams failed: '+useCase.id);
      assert.equal(await js("document.querySelectorAll('#system-usecases-panel [role=\"alert\"]').length"),0);
      const rpc=await js("Array.from(document.querySelectorAll('#system-usecases-panel>.s1-endpoint')).map(item=>item.dataset.rpc)");
      assert.deepEqual(rpc,useCase.endpoints.map(id=>model.endpoints.find(endpoint=>endpoint.id===id).rpc));
      assert.equal(await js("document.querySelector('#s1-selected-sequence .database-source pre').textContent"),useCase.sequence);
      for(const selector of ['#s1-system-sequence','#s1-selected-sequence']){
        assert.equal(await js('document.querySelector('+JSON.stringify(selector+' output')+').textContent'),'70%');
      }
      const rendered=await js("['#s1-system-sequence','#s1-selected-sequence'].map(s=>{const svg=document.querySelector(s+' svg'),box=svg.getBBox();return {text:svg.textContent.length,width:box.width,height:box.height}})");
      for(const item of rendered)assert.ok(item.text>20&&item.width>100&&item.height>100,useCase.id+JSON.stringify(item));
      checks.push({useCase:useCase.id,passed:true,diagrams:2,scale:'70%',endpoints:rpc.length,rendered});
    }
    assert.equal(exceptions.length,0,JSON.stringify(exceptions));
    const result={stepsRegistered:8,useCases:checks.length,renderedDiagrams:checks.length*2,initialScale:'70%',uniqueEndpoints:model.endpoints.length,offline:true,exceptions,checks};
    console.log(JSON.stringify(result));
  }finally{
    if(socket)socket.close();
    chrome.kill('SIGTERM');
    await Promise.race([new Promise(resolve=>chrome.once('exit',resolve)),sleep(5000)]);
    if(chrome.exitCode===null){chrome.kill('SIGKILL');await sleep(500);}
    fs.rmSync(profile,{recursive:true,force:true});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
