'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const W=require('../work-breakdown.js');
const {buildWorkbook,phaseRows}=require('../work-breakdown-export.js');
function unzip(bytes) {
  const archive=Buffer.from(bytes),files=new Map();
  let offset=0;
  while (archive.readUInt32LE(offset)===0x04034b50) {
    assert.equal(archive.readUInt16LE(offset+8),0);
    const length=archive.readUInt32LE(offset+18),nameLength=archive.readUInt16LE(offset+26);
    const extra=archive.readUInt16LE(offset+28),start=offset+30+nameLength+extra;
    const name=archive.subarray(offset+30,offset+30+nameLength).toString();
    files.set(name,archive.subarray(start,start+length).toString());
    offset=start+length;
  }
  const end=archive.length-22;
  assert.equal(archive.readUInt32LE(end),0x06054b50);
  assert.equal(archive.readUInt32LE(end+16),offset);
  assert.equal(archive.readUInt16LE(end+10),files.size);
  assert.equal(archive.readUInt32LE(offset),0x02014b50);
  return files;
}
test('export includes all phases and exact package staffing and effort, independent of UI filters',()=>{
  const files=unzip(buildWorkbook(W));
  const workbook=files.get('xl/workbook.xml');
  for (const [index,phase] of W.phases.entries()) {
    const rows=phaseRows(W,phase),tasks=W.allTasks.filter(entry=>entry.task.phase===phase.id);
    assert.equal(rows.length,tasks.length+1);
    assert.equal(rows.slice(1).reduce((sum,row)=>sum+row[7],0),phase.personDays);
    for (const [rowIndex,{task}] of tasks.entries()) {
      assert.equal(rows[rowIndex+1][4],task.staffingCount);
      assert.equal(rows[rowIndex+1][5],task.executionContext.assignment.owner);
      assert.equal(rows[rowIndex+1][6],task.executionContext.assignment.reviewer);
      assert.equal(rows[rowIndex+1][7],task.personDays);
    }
    const sheet=files.get('xl/worksheets/sheet'+(index+1)+'.xml');
    assert.equal([...sheet.matchAll(/<row r=/g)].length,rows.length);
    assert.match(sheet,/<pane ySplit="1"/);
    assert.match(sheet,/<c r="H2"><v>/);
    assert.match(workbook,new RegExp('sheetId="'+(index+1)+'"'));
  }
  assert.equal([...workbook.matchAll(/<sheet name=/g)].length,W.phases.length);
});
test('spreadsheet text remains literal and XML-safe, while invalid numeric effort fails explicitly',()=>{
  const fixture={...W,allTasks:W.allTasks.map((entry,index)=>index===0?{
    ...entry,task:{...entry.task,title:'=SUM(1,2) <&>"\u0000'}
  }:entry)};
  const files=unzip(buildWorkbook(fixture));
  assert.match(files.get('xl/worksheets/sheet1.xml'),/=SUM\(1,2\) &lt;&amp;&gt;&quot;\ufffd/);
  assert.doesNotMatch(files.get('xl/worksheets/sheet1.xml'),/<f>/);
  fixture.allTasks[0].task.personDays=NaN;
  assert.throws(()=>buildWorkbook(fixture),/无效人日/);
});
test('export failure reports its cause and restores the button for retry',()=>{
  let click,logged;
  const button={disabled:false,addEventListener:(event,handler)=>{click=handler;}},status={textContent:''};
  vm.runInNewContext(fs.readFileSync(require.resolve('../work-breakdown-export.js'),'utf8'),{
    TextEncoder,document:{getElementById:id=>id==='work-breakdown-export'?button:status},
    console:{error:(...args)=>{logged=args;}}
  });
  click();
  assert.equal(button.disabled,false);
  assert.match(status.textContent,/导出失败：工作拆解数据未加载/);
  assert.equal(logged[0],'工作明细导出失败');
});
