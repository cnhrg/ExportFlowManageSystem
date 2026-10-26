'use strict';
(function(root){
  const model=root.EXPORT_DOMAIN_MODEL;
  if(!model)throw new Error('领域模型未加载');
  const domains=model.domains;
  const entities=new Map(domains.flatMap(domain=>domain.entities.map(entity=>[entity.name,{domain,entity}])));
  const commonFields={
    created_by:"VARCHAR(64) NOT NULL DEFAULT 'system'",
    updated_by:"VARCHAR(64) NOT NULL DEFAULT 'system'",
    created_at:'DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3))',
    updated_at:'DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)) ON UPDATE CURRENT_TIMESTAMP(3)',
    version:'INT UNSIGNED NOT NULL DEFAULT 0',
    deleted_id:'BIGINT UNSIGNED NOT NULL DEFAULT 0'
  };
  const indexDefinitions=keys=>keys.split('·').map(value=>value.trim()).filter(value=>/^(PK|UK|FK|IDX)\b/i.test(value));
  function indexedFields(index){
    const group=index.match(/^(?:PK|UK|FK|IDX)\s+\(([^)]+)\)/i);
    if(group)return group[1].split(',').map(value=>value.trim());
    const field=index.match(/^(?:PK|UK|FK|IDX)\s+([A-Za-z_][A-Za-z0-9_]*)/i);
    return field?[field[1]]:[];
  }
  function enumeration(domain,entity,name){
    const bindings={
      'trade_revision_tab.snapshot_reason_code':'trade_snapshot_reason_code',
      'trade_event_tab.from_trade_status_code':'trade_status_code',
      'trade_event_tab.to_trade_status_code':'trade_status_code',
      'trade_event_tab.to_trade_status_code':'trade_status_code',
      'document_file_tab.revision_status_code':'file_revision_status_code',
      'payment_bank_account_tab.account_status':'bank_account_status',
      'payment_fund_flow_tab.bucket_from':'fund_bucket_code',
      'payment_fund_flow_tab.bucket_to':'fund_bucket_code',
      'account_tab.account_status':'ledger_account_status'
    };
    const aliases=[bindings[entity.name+'.'+name]||name];
    if(name.endsWith('_party_role_code'))aliases.push('party_role_code');
    if(domain.id==='trade'&&name==='event_type_code')aliases.push('trade_event_type_code');
    const books=[...(domain.codebooks||[]),...(domains.find(item=>item.id==='trade').codebooks||[]).filter(item=>item.name.startsWith('party_role_code｜'))];
    const book=books.find(item=>aliases.includes(item.name.split('｜')[0]));
    if(book)return '枚举：'+book.values.map(value=>value[0]+'='+value[1]+'（'+value[2]+'）').join('；');
    if(name.endsWith('_status')||name.endsWith('_status_code'))return '该字段独立码表待定义；不得使用概念流程标签或图示编号作为持久化枚举。';
    if(name.endsWith('_event_type_code')||name==='event_type_code'){
      const names=(model.stateMachines[domain.id]||[]).flatMap(machine=>machine.events.map(event=>event.name));
      return '事件定义：'+[...new Set(names)].join('、')+'；持久化编码仍须所属域明确。';
    }
    return '';
  }
  function example(name,type,description){
    if(name==='id'||name.endsWith('_id'))return '1001';
    if(description.startsWith('枚举：'))return description.match(/^枚举：([^=]+)=/)[1]+'（见码表）';
    if(/hmac|hash|digest|sha256/.test(name))return 'a3f1…9c20（64位）';
    if(name.endsWith('_cipher'))return '受控加密字节';
    if(type.includes('JSON'))return '见领域说明第11节';
    if(type.includes('DECIMAL'))return '1280.00';
    if(type.includes('DATETIME'))return '2026-10-25T02:25:11Z';
    if(type.startsWith('DATE'))return '2026-10-25';
    if(type.includes('CHAR(3)'))return 'CNY';
    if(name.includes('email'))return 'ops@example.com';
    if(name.includes('country'))return 'CN';
    if(type.includes('INT'))return '1';
    if(/number|reference/.test(name))return 'TRD-DEMO-001';
    if(type==='公共字段')return '按表类型维护，见说明';
    return '示例文本';
  }
  function fieldRows(domain,entity){
    return entity.fields.flatMap(([groupedNames,groupedTypes,description])=>{
      const names=groupedNames.split(' / '),types=groupedTypes.split(' / ');
      if(types.length!==1&&types.length!==names.length)throw new Error(entity.name+'：字段与类型数量不一致');
      return names.map((name,index)=>{
        const sourceType=types.length===1?types[0]:types[index];
        const commonField=sourceType==='公共字段';
        const type=commonField?(commonFields[name]||'').split(' NOT NULL')[0]:sourceType;
        if(commonField&&!type)throw new Error(entity.name+'.'+name+'：未定义公共字段类型');
        const indexes=indexDefinitions(entity.keys).filter(key=>indexedFields(key).includes(name));
        const values=enumeration(domain,entity,name);
        return [name,type,indexes.join('；')||'—',example(name,type,values),[description,values].filter(Boolean).join('；'),commonField];
      });
    });
  }
  const text=value=>String(value).replace(/["\r\n]/g,' ').replace(/[<>]/g,'');
  function diagram(domain){
    const relations=model.relationModels[domain.id]||[],local=new Set(domain.entities.map(entity=>entity.name)),references=new Map();
    function endpoint(name){
      if(local.has(name))return name;
      if(!references.has(name))references.set(name,'REF_'+references.size);
      return references.get(name);
    }
    const cardinalities={'1:N':'||--o{','N:1':'}o--||','N:0..1':'}o--o|','1:1':'||--||'};
    const edges=relations.map(([from,to,cardinality,label])=>{
      const key=cardinality.split(' · ')[0],edge=cardinalities[key];
      if(!edge)throw new Error('未支持的关系基数：'+cardinality);
      return '  '+endpoint(from)+' '+edge+' '+endpoint(to)+' : "'+text(label+'（'+cardinality+'，逻辑引用）')+'"';
    });
    const blocks=domain.entities.map(entity=>'  '+entity.name+'["'+text(entity.title+' · '+entity.name)+'"] {\n'+fieldRows(domain,entity).map(([name,type,indexes,,description])=>{
      const diagramType=type.replace(/[^A-Za-z0-9_]/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'');
      if(!diagramType)throw new Error(entity.name+'.'+name+'：无法生成ER图字段类型');
      const keys=[...new Set(indexDefinitions(entity.keys).filter(key=>indexedFields(key).includes(name)).map(key=>key.split(' ')[0]).filter(key=>['PK','UK'].includes(key)))];
      const brief=description.length>90?description.slice(0,90)+'…（完整说明见字段字典）':description;
      return '    '+diagramType+' '+name+(keys.length?' '+keys.join(','):'')+' "'+text(type+'；'+brief)+'"';
    }).join('\n')+'\n  }');
    const placeholders=[...references].map(([name,id])=>'  '+id+'["'+text(name+'（逻辑引用占位，非本域表）')+'"]');
    return ['erDiagram','  direction LR',...blocks,...placeholders,...edges].join('\n');
  }
  const stats={
    domains:domains.length,
    entities:domains.reduce((count,domain)=>count+domain.entities.length,0),
    fields:domains.reduce((count,domain)=>count+domain.entities.reduce((sum,entity)=>sum+fieldRows(domain,entity).length,0),0),
    codebooks:domains.reduce((count,domain)=>count+(domain.codebooks||[]).length,0),
    machines:Object.values(model.stateMachines).flat().length
  };
  const api={domains,entities,relations:model.relationModels,commonFields,fieldRows,indexDefinitions,indexedFields,enumeration,source:diagram,stats};
  root.EXPORT_DATABASE_MODEL=api;
  if(typeof module!=='undefined')module.exports=api;
})(globalThis);
