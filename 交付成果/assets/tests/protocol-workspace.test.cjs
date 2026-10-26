'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),context=vm.createContext({});
const steps=['system','step-two','step-three','step-four','step-five','step-six','step-seven','step-eight'];
for(const step of steps){
  for(const kind of ['model','artifacts']){
    const name=step+'-usecases-'+kind+'.js';
    vm.runInContext(fs.readFileSync(path.join(base,name),'utf8'),context,{filename:name});
  }
}
for(const name of ['design-diagrams.js','system-usecases-workspace.js']){
  vm.runInContext(fs.readFileSync(path.join(base,name),'utf8'),context,{filename:name});
}
const workspace=context.EXPORT_SYSTEM_USECASES_WORKSPACE,catalog=workspace.getProtocolCatalog();
test('protocol catalog includes every authoritative API once and keeps inbound callbacks external',()=>{
  assert.equal(catalog.length,145);
  assert.equal(new Set(catalog.map(entry=>entry.key)).size,catalog.length);
  for(const entry of catalog){
    assert.equal(entry.endpoint.path.startsWith('/internal/'),entry.endpoint.audience==='内部运营');
    assert.ok(['外部服务','内部运营'].includes(entry.endpoint.audience));
    assert.ok(entry.errors.length);
  }
  const notice=catalog.find(entry=>entry.endpoint.rpc==='CreateSignatureNotification');
  assert.equal(notice.endpoint.audience,'外部服务');
  assert.ok(notice.useCases.some(item=>item.id==='contract-sign'));
});
test('shared protocol references retain cross-step use-case links without inventing a goal for overview',()=>{
  const basis=catalog.find(entry=>entry.endpoint.rpc==='GetTradeContractBasis');
  assert.ok(basis.useCases.some(item=>item.stepNumber===3&&item.id==='shipment-plan'));
  const overview=catalog.find(entry=>entry.endpoint.rpc==='GetFilingOverview');
  assert.equal(overview.useCases.length,0);
  assert.deepEqual(Array.from(catalog.filter(entry=>!entry.useCases.length),entry=>entry.endpoint.rpc),['GetFilingOverview','GetAgencyServiceFeeSettlement']);
});
test('every catalog detail uses original requests, responses, RPC examples, deadlines and source messages',()=>{
  for(const entry of catalog){
    const endpoint=entry.endpoint,html=workspace.renderProtocol(endpoint,'h4');
    for(const label of ['REQUEST','RESPONSE','cURL example','RPC example',endpoint.reqMsg,endpoint.rspMsg,
      String(endpoint.timeout.clientMs),String(endpoint.timeout.serverMs)]){
      assert.ok(html.includes(label),endpoint.rpc+': '+label);
    }
    assert.ok(!html.includes('undefined'),endpoint.rpc);
    assert.ok(html.includes('<h4>'));
    assert.equal(workspace.getProtocolSource(entry.file),fs.readFileSync(path.resolve(base,'../..',entry.file),'utf8'));
  }
});
