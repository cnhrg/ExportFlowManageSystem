'use strict';
const camel=value=>value.replace(/_([a-z])/g,(_,char)=>char.toUpperCase());
const quote=value=>"'"+value.replace(/'/g,"'\"'\"'")+"'";
function curl(example){
  const request=example.request,lines=[
    '# Design-only synthetic input. Set BASE_URL and the required credentials/confirmation first.',
    '# No automatic write retries: unknown outcome must recover the original key.',
    'curl --include --fail-with-body --connect-timeout 2 --max-time '+example.timeoutMs/1000+' \\',
    '  --request '+request.method+' "${BASE_URL:?Set BASE_URL}'+request.path+'" \\'
  ];
  const variables={Authorization:'Bearer ${ACCESS_TOKEN:?Set ACCESS_TOKEN}','X-Confirmation-Id':'${CONFIRMATION_ID:?Confirm this exact intent first}','X-Provider-Signature':'${PROVIDER_SIGNATURE:?Sign these exact raw bytes per registered provider profile}'};
  for(const [key,value]of Object.entries(request.headers)){
    lines.push('  --header '+(variables[key]?'"'+key+': '+variables[key]+'"':quote(key+': '+value))+' \\');
  }
  if(request.body!==undefined)lines.push('  --data-raw '+quote(JSON.stringify(request.body)));
  else lines[lines.length-1]=lines[lines.length-1].replace(/ \\$/,'');
  return lines.join('\n');
}
function rpc(example,endpoint,packageName){
  const request={},params=[...endpoint.path.matchAll(/\{([^}]+)\}/g)];
  const url=new URL(example.request.path,'https://transport-design.example.invalid');
  const match=url.pathname.match(new RegExp('^'+endpoint.path.replace(/\{[^}]+\}/g,'([^/]+)')+'$'));
  if(!match)throw new Error('HTTP path does not match '+endpoint.rpc);
  params.forEach((param,index)=>{request[camel(param[1])]=/revision_number$/.test(param[1])?Number(match[index+1]):match[index+1];});
  for(const [name,value]of url.searchParams){
    if(!(endpoint.query||[]).includes(name)||url.searchParams.getAll(name).length!==1)throw new Error('Undeclared or repeated HTTP query parameter: '+name);
    request[camel(name)]=value;
  }
  if(endpoint.body)request[camel(endpoint.body)]=example.request.body;
  const metadata={};
  for(const [header,value]of Object.entries(example.request.headers)){
    if(['Authorization','Idempotency-Key','If-Match','X-Confirmation-Id'].includes(header))metadata[header==='X-Confirmation-Id'?'confirmation-id':header.toLowerCase()]=value;
  }
  if(endpoint.id==='notice')metadata['provider-auth-profile']='<negotiated profile required; RPC disabled until agreed>';
  return {designOnly:true,service:packageName+'.'+endpoint.service,method:endpoint.rpc,
    requestType:endpoint.rpc+'ReqMsg',responseType:endpoint.rpc+'RspMsg',
    deadlineMs:endpoint.timeout.clientMs,metadata,request,response:{resource:example.response.body},
    successTrailers:example.response.headers['X-Receipt-Proof']?{'receipt-proof-bin':'<platform receipt bytes; SYNTHETIC-NOT-VALID>'}:{}};
}
function enrich(example,endpoint){
  example.rpc=endpoint.rpc;example.designOnly=true;example.timeoutMs=endpoint.timeout.clientMs;
  example.requestType=endpoint.rpc+'ReqMsg';example.responseType=endpoint.rpc+'RspMsg';
  example.httpResponse='HTTP/1.1 '+example.response.status+' '+({200:'OK',201:'Created',422:'Unprocessable Content',409:'Conflict'}[example.response.status]||'Error')+'\n'+Object.entries(example.response.headers).map(([name,value])=>name+': '+value).join('\n')+'\n\n'+JSON.stringify(example.response.body,null,2);
  example.curl=curl(example);return example;
}
module.exports={enrich,rpc,curl};
