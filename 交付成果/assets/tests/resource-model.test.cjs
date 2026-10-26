'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../resource-model.js');
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);
test('two-year ToB ceiling separates file size, order total, versions and database load',()=>{
  const r=M.calculate();
  assert.equal(r.years.length,2);
  assert.equal(r.years[0].annualOrders,109500);
  assert.equal(r.years[1].orders,219000);
  close(r.years[1].fileTB,1.4235);
  close(r.years[1].dbTB,0.0876);
  assert.equal(r.filesPerOrder,25);
  assert.equal(r.originalFiles,5475000);
  close(r.peakRPS,6.25);
  close(r.fileMbps,5.416666666666667);
  const smallerFiles=M.calculate({fileKB:100});
  assert.equal(smallerFiles.originalFiles,r.originalFiles*2);
  assert.equal(smallerFiles.years[1].fileTB,r.years[1].fileTB);
  assert.equal(smallerFiles.years[1].dbTB,r.years[1].dbTB);
});
test('RAID1 capacity and independent backup include logs and database backup quota',()=>{
  const r=M.calculate();
  close(r.rawTB,8);
  close(r.usableTB,4);
  close(r.normalBudgetTB,2.8);
  close(r.objectLogicalTB,1.4385);
  close(r.years[1].rawRequiredTB,1.4235*2/0.7);
  close(r.backupDataTB,2.36555);
  close(r.backupRequiredTB,2.36555/0.7);
  close(r.backupBudgetTB,5.6);
  assert.ok(r.storageFits);
  assert.ok(r.backupFits);
  assert.equal(r.hostCount,8);
  assert.equal(r.cores,60);
  assert.equal(r.memoryGB,432);
});
test('revision growth, logs and backup history expose shortfalls instead of masking them',()=>{
  const large=M.calculate({versionFactor:5}),small=M.calculate({dailyOrders:100});
  assert.equal(large.storageFits,false);
  assert.equal(large.backupFits,false);
  assert.equal(small.years[1].orders,73000);
  close(small.years[1].dbTB,0.0292);
  assert.equal(M.calculate({logGB:100}).storageFits,false);
  const backupOnly=M.calculate({dailyOrders:1,logGB:400});
  assert.equal(backupOnly.backupFits,false);
});
test('invalid load assumptions fail explicitly and do not change defaults',()=>{
  for(const input of [{dailyOrders:301},{dailyOrders:0},{dailyOrders:1.5},{fileMB:NaN},{fileMB:6},{fileKB:0},{fileKB:5001},{fileMB:0.1,fileKB:200},{versionFactor:0.5},{logGB:Infinity}]){
    assert.throws(()=>M.calculate(input),RangeError);
  }
  assert.equal(M.defaults.dailyOrders,300);
  assert.equal(M.calculate({requestsPerOrder:60}).peakRPS,2*M.calculate().peakRPS);
});
test('budget changes deployment without changing demand, storage or retention',()=>{
  const generous=M.calculate(),minimum=M.calculate({},'minimum'),moderate=M.calculate({},'moderate');
  for(const r of [minimum,moderate]){
    assert.deepEqual(r.years,generous.years);
    for(const key of ['peakRPS','originalFiles','normalBudgetTB','backupDataTB','backupBudgetTB','metricsGB']){
      assert.equal(r[key],generous[key],key);
    }
    assert.equal(r.hardware.find(row=>row[0]==='业务数据库')[1],2);
    assert.equal(r.hardware.at(-1)[0],'独立备份服务器');
    assert.equal(r.hardware.at(-1)[1],1);
    assert.ok(r.profile.bufferPoolGiB<r.profile.dbMemoryGiB);
    assert.ok(r.profile.itKW/r.profile.upsKW<=0.8);
    assert.ok(r.profile.coolingKW>=r.profile.itKW*1.3);
  }
  assert.deepEqual([minimum.hostCount,minimum.cores,minimum.memoryGB],[4,28,208]);
  assert.deepEqual([moderate.hostCount,moderate.cores,moderate.memoryGB],[7,52,336]);
  assert.deepEqual([generous.hostCount,generous.cores,generous.memoryGB],[8,60,432]);
  assert.match(minimum.middleware.find(row=>row[0]==='Grafana / 接入')[2],/单入口/);
  assert.match(moderate.middleware.find(row=>row[0]==='XXL-JOB')[2],/2执行器/);
  assert.equal(M.calculate({versionFactor:5},'minimum').storageFits,false);
  assert.equal(M.calculate({versionFactor:2.4},'minimum').storageFits,false);
  assert.equal(M.calculate({versionFactor:2.4},'moderate').storageFits,true);
  close(minimum.localReserveTB,0.2);
  assert.equal(M.calculate({dailyOrders:100},'moderate').years[1].orders,73000);
  assert.deepEqual(M.calculate().middleware,generous.middleware);
  assert.throws(()=>M.calculate({},'unknown'),RangeError);
  assert.throws(()=>M.calculate({},'toString'),RangeError);
});
