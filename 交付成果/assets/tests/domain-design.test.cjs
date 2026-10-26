'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const model=require('../domain-model.js');
const database=require('../database-model.js');
const state=require('../state-model.js');
require('../business-data.js');
require('../audit-design.js');

test('grouped fields retain every name, matching type and original description',()=>{
  for(const domain of model.domains)for(const entity of domain.entities){
    const rows=database.fieldRows(domain,entity);
    const expected=entity.fields.flatMap(([names,types,description])=>{
      const fields=names.split(' / '),kinds=types.split(' / ');
      return fields.map((name,index)=>{
        const sourceType=kinds.length===1?kinds[0]:kinds[index];
        return [name,sourceType==='公共字段'?database.commonFields[name].split(' NOT NULL')[0]:sourceType,description];
      });
    });
    assert.equal(new Set(rows.map(row=>row[0])).size,rows.length,entity.name);
    assert.deepEqual(rows.map(row=>row.slice(0,2)),expected.map(row=>row.slice(0,2)),entity.name);
    expected.forEach(([,,description],index)=>assert.ok(rows[index][4].startsWith(description),entity.name));
    for(const key of database.indexDefinitions(entity.keys)){
      for(const field of database.indexedFields(key))assert.ok(rows.some(row=>row[0]===field),entity.name+': '+key);
    }
  }
});

test('common audit fields have concrete types in the dictionary and ER diagram',()=>{
  const trade=model.domains.find(domain=>domain.id==='trade');
  const entity=trade.entities.find(item=>item.name==='trade_record_tab');
  const rows=database.fieldRows(trade,entity);
  assert.deepEqual(rows.filter(([name])=>['created_by','created_at','updated_by','updated_at','version'].includes(name)).map(([name,type])=>[name,type]),[
    ['created_by','VARCHAR(64)'],
    ['created_at','DATETIME(3)'],
    ['updated_by','VARCHAR(64)'],
    ['updated_at','DATETIME(3)'],
    ['version','INT UNSIGNED']
  ]);
  const source=database.source(trade);
  assert.match(source,/VARCHAR_64 created_by/);
  assert.match(source,/DATETIME_3 created_at/);
  assert.doesNotMatch(source,/metadata/);
});

test('field aliases bind real persisted codebooks, never conceptual diagram labels',()=>{
  const trade=model.domains.find(domain=>domain.id==='trade');
  const event=trade.entities.find(entity=>entity.name==='trade_event_tab');
  for(const name of ['from_trade_status_code','to_trade_status_code']){
    const value=database.enumeration(trade,event,name);
    assert.ok(value.includes('8=已批准'));
    assert.ok(value.includes('10=已结案'));
  }
  const contract=model.domains.find(domain=>domain.id==='contract');
  const file=contract.entities.find(entity=>entity.name==='document_file_tab');
  assert.ok(database.enumeration(contract,file,'revision_status_code').includes('2=最终确认'));
  const logistics=model.domains.find(domain=>domain.id==='logistics');
  assert.match(database.enumeration(logistics,logistics.entities[0],'shipment_status'),/码表待定义/);
});

test('state adapters preserve all event, guard, transition and compensation definitions',()=>{
  for(const domain of state.domains){
    const original=model.stateMachines[domain.id];
    assert.equal(domain.machines.length,original.length);
    domain.machines.forEach((machine,index)=>{
      for(const key of ['title','states','events','guards','transitions','exceptions']){
        assert.deepEqual(machine[key],original[index][key],machine.id+': '+key);
      }
      const events=new Set(machine.events.map(event=>event.name));
      const guards=new Set(machine.guards.map(([code])=>code));
      for(const [,event,guard] of [...machine.transitions,...machine.exceptions]){
        assert.ok(events.has(event),machine.id+': '+event);
        for(const code of guard.split('+'))if(guard!=='true')assert.ok(guards.has(code),machine.id+': '+guard);
      }
      if(machine.persistence){
        const [table,field]=machine.persistence;
        const owner=database.entities.get(table);
        assert.ok(owner,machine.id+': '+table);
        assert.ok(database.fieldRows(owner.domain,owner.entity).some(row=>row[0]===field),machine.id+': '+field);
        const book=state.persistenceBook(machine);
        assert.ok(book,machine.id);
        for(const [code,label] of machine.states)assert.ok(book.values.some(value=>value[0]===code&&value[1]===label),machine.id+': '+label);
      }
    });
  }
});

test('state diagrams keep unchanged actions as self-loops and mark dynamic contexts',()=>{
  const trade=state.domains.find(domain=>domain.id==='trade').machines[0];
  const source=state.source(trade);
  assert.match(source,/ST_8 --> ST_8 : TradeHeld \[G1\]/);
  assert.doesNotMatch(source,/state "状态不变/);
  const logistics=state.domains.find(domain=>domain.id==='logistics').machines[0];
  assert.match(state.source(logistics),/处理\/恢复上下文：恢复原履约阶段或已签收/);
  assert.equal(state.persistenceBook(logistics),null);
});

test('every existing process node maps to real new entities without rewriting process data',()=>{
  const nodes=globalThis.EXPORT_BUSINESS.nodes;
  assert.deepEqual(Object.keys(state.mapping).sort(),nodes.map(node=>node.id).sort());
  for(const node of nodes){
    const [domain,records]=state.mapping[node.id];
    assert.ok(model.domains.some(item=>item.id===domain),node.id);
    for(const name of records.match(/[a-z_]+_tab\b/g)||[])assert.ok(database.entities.has(name),node.id+': '+name);
  }
});

test('all logical relationships generate explicit external placeholders without physical FKs',()=>{
  for(const domain of model.domains){
    const source=database.source(domain);
    assert.ok(!source.includes('undefined'),domain.id);
    assert.ok(!/\sFK(?:\s|,)/.test(source),domain.id);
    for(const entity of domain.entities)assert.ok(source.includes(entity.name+'['),entity.name);
    for(const [from,to] of model.relationModels[domain.id]){
      for(const name of [from,to])if(!domain.entities.some(entity=>entity.name===name))assert.ok(source.includes(name+'（逻辑引用占位，非本域表）'),domain.id+': '+name);
    }
  }
});
