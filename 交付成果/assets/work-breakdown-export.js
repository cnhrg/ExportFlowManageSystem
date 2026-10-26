'use strict';
(function (root) {
  const encoder=new TextEncoder();
  const xml=value=>String(value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g,'\ufffd')
    .replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
  const declaration='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const spreadsheet='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  function crc32(bytes) {
    let crc=0xffffffff;
    for (const byte of bytes) {
      crc^=byte;
      for (let bit=0;bit<8;bit++) crc=(crc>>>1)^((crc&1)?0xedb88320:0);
    }
    return (crc^0xffffffff)>>>0;
  }
  function zip(files) {
    const parts=[],central=[];
    let offset=0,centralSize=0;
    for (const [filename,content] of files) {
      const name=encoder.encode(filename),data=encoder.encode(content),crc=crc32(data);
      const local=new Uint8Array(30+name.length),header=new DataView(local.buffer);
      header.setUint32(0,0x04034b50,true);header.setUint16(4,20,true);
      header.setUint16(6,0x800,true);header.setUint16(12,0x2821,true);
      header.setUint32(14,crc,true);header.setUint32(18,data.length,true);
      header.setUint32(22,data.length,true);header.setUint16(26,name.length,true);local.set(name,30);
      const entry=new Uint8Array(46+name.length),directory=new DataView(entry.buffer);
      directory.setUint32(0,0x02014b50,true);directory.setUint16(4,20,true);directory.setUint16(6,20,true);
      directory.setUint16(8,0x800,true);directory.setUint16(14,0x2821,true);
      directory.setUint32(16,crc,true);directory.setUint32(20,data.length,true);directory.setUint32(24,data.length,true);
      directory.setUint16(28,name.length,true);directory.setUint32(42,offset,true);entry.set(name,46);
      parts.push(local,data);central.push(entry);offset+=local.length+data.length;centralSize+=entry.length;
    }
    const end=new Uint8Array(22),footer=new DataView(end.buffer);
    footer.setUint32(0,0x06054b50,true);footer.setUint16(8,files.length,true);footer.setUint16(10,files.length,true);
    footer.setUint32(12,centralSize,true);footer.setUint32(16,offset,true);
    const result=new Uint8Array(offset+centralSize+end.length);
    let position=0;
    for (const part of [...parts,...central,end]) {result.set(part,position);position+=part.length;}
    return result;
  }
  function phaseRows(model,phase) {
    return [
      ['分层','能力域','工作名称','简要范围','承接人数','主责岗位（待实名指派）','复核岗位（待实名指派）','预计人日（包级合计）','前置工作'],
      ...model.allTasks.filter(entry=>entry.task.phase===phase.id).map(({layer,capability,task})=>[
        layer.title,capability.title,task.title,task.scope,task.staffingCount,
        task.executionContext.assignment.owner,task.executionContext.assignment.reviewer,task.personDays,
        task.dependencies.map(id=>model.packageIndex.get(id).task.title).join('\n')
      ])
    ];
  }
  function worksheet(rows) {
    const widths=[22,26,36,60,12,30,30,20,45];
    return declaration+'<worksheet xmlns="'+spreadsheet+'"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>'+
      widths.map((width,index)=>'<col min="'+(index+1)+'" max="'+(index+1)+'" width="'+width+'" customWidth="1"/>').join('')+'</cols><sheetData>'+
      rows.map((row,index)=>'<row r="'+(index+1)+'">'+row.map((value,column)=>{
        const reference=String.fromCharCode(65+column)+(index+1);
        if (typeof value==='number') {
          if (!Number.isFinite(value)) throw new Error('工作明细含无效人日或人数。');
          return '<c r="'+reference+'"><v>'+value+'</v></c>';
        }
        return '<c r="'+reference+'" t="inlineStr" s="'+(index===0?1:0)+'"><is><t xml:space="preserve">'+xml(value)+'</t></is></c>';
      }).join('')+'</row>').join('')+'</sheetData><autoFilter ref="A1:I'+rows.length+'"/></worksheet>';
  }
  function buildWorkbook(model) {
    if (!model || !model.phases.length || !model.allTasks.length) throw new Error('工作拆解数据未加载。');
    const relationship='http://schemas.openxmlformats.org/package/2006/relationships';
    const office='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    const files=[
      ['[Content_Types].xml',declaration+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+
        model.phases.map((phase,index)=>'<Override PartName="/xl/worksheets/sheet'+(index+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>'],
      ['_rels/.rels',declaration+'<Relationships xmlns="'+relationship+'"><Relationship Id="rId1" Type="'+office+'/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml',declaration+'<workbook xmlns="'+spreadsheet+'" xmlns:r="'+office+'"><sheets>'+model.phases.map((phase,index)=>
        '<sheet name="'+xml(['第一期','第二期','第三期'][index] || '第'+phase.id+'期')+'" sheetId="'+(index+1)+'" r:id="rId'+(index+1)+'"/>').join('')+'</sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels',declaration+'<Relationships xmlns="'+relationship+'">'+model.phases.map((phase,index)=>
        '<Relationship Id="rId'+(index+1)+'" Type="'+office+'/worksheet" Target="worksheets/sheet'+(index+1)+'.xml"/>').join('')+
        '<Relationship Id="styles" Type="'+office+'/styles" Target="styles.xml"/></Relationships>'],
      ['xl/styles.xml',declaration+'<styleSheet xmlns="'+spreadsheet+'"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'],
      ...model.phases.map((phase,index)=>['xl/worksheets/sheet'+(index+1)+'.xml',worksheet(phaseRows(model,phase))])
    ];
    return zip(files);
  }
  const api={buildWorkbook,phaseRows};
  if (typeof module==='object' && module.exports) module.exports=api;
  root.EXPORT_WORK_BREAKDOWN_EXPORT=api;
  if (typeof document==='undefined') return;
  const button=document.getElementById('work-breakdown-export');
  if (!button) return;
  button.addEventListener('click',()=>{
    const status=document.getElementById('work-breakdown-export-status');
    button.disabled=true;
    try {
      const bytes=buildWorkbook(root.EXPORT_WORK_BREAKDOWN);
      const url=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
      const link=document.createElement('a');
      link.href=url;link.download='代理出口工作明细.xlsx';
      document.body.append(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),60000);
      status.textContent='已生成三期全部工作明细；每期一个工作表，人数为单包配置，人日为包级合计。';
    } catch (error) {
      console.error('工作明细导出失败',error);
      status.textContent='导出失败：'+error.message;
    } finally {
      button.disabled=false;
    }
  });
})(globalThis);
