'use strict';
(function(root){
  const renamed={
    M06:'步骤2-出口货物贸易代理合同(10.16).docx',
    M07:'步骤2-国际物流服务合同-龙南逸泰源&国际运输合同(1).doc',
    M08:'步骤1-销售合同-外贸结汇专用中英文合同.docx',
    M09:'步骤一-发票箱单:合同等案例.xls',
    M10:'步骤7-代理出口货物证明-合同SZ26101301(1).pdf',
    M11:'步骤4-双抬头报关-出口双抬头.pdf（新疆）.pdf',
    M13:'步骤1-商业发票.docx',
    M14:'步骤5-付款发票INVOICE,SZ26101401(2).pdf',
    M15:'步骤5-CIPS系统贷记转账报文TFLS00032_SWIFT_CNY_5 000,00(3).pdf',
    M16:'步骤1-B收款路径-开泰银行开票信息（人民币，泰铢，美元）龙南市逸泰源跨境电商.docx'
  };
  const types={
    M05:['excluded',['Q12']],
    M06:['template',['Q10']],M07:['template',['Q11']],M08:['template',['Q02','Q23']],
    M09:['collection',[]],M10:['excluded',['Q40','Q41','Q42']],M11:['example',['Q24','Q26']],
    M12:['collection',[]],M13:['template',['Q02','Q14']],
    M14:['example',['Q28']],M15:['example',['Q29','Q30']],M16:['support',['Q03']]
  };
  function apply(D,sheets){
    for(const m of D.materials){
      if(renamed[m.id]){m.previousFile=m.file;m.file='材料/'+renamed[m.id];}
      const [referenceType,q]=types[m.id]||[m.file?'basis':'missing',[]];
      Object.assign(m,{referenceType,q});
    }
    const proof=D.materials.find(m=>m.id==='M10');
    Object.assign(proof,{kind:'命名为证明，正文为运输互为代理协议',status:'文件名不改变内容；不能替代正式附件3',
      suggest:'保留用户命名。正文合同号2026100101，实际是运输互为代理协议，非税务机关签发证明。Q40/Q41/Q42仍需正式申请、签发与交付证据。'});
    for(const node of ['N18','N19','N20','N21'])if(!proof.nodes.includes(node))proof.nodes.push(node);
    for(const id of ['M09','M12'])D.materials.find(m=>m.id===id).status+='；已按Sheet拆分，节点不再整体关联';
    D.materials.push({id:'M17',file:'材料/步骤1-B收款信息.jpg',referenceType:'support',q:['Q03'],kind:'B收款信息照片参考',
      owner:'B',nodes:['N01','N11'],location:'照片：B代理收款标注和银行信息',status:'未见本笔编号及完整签署；不是A账户或银行到账',
      suggest:'可与M13/M16核对B收款路径，不是独立账户核验、银行接受、报价或付款成功证明。仅链接原图，不复制账号。',confirm:'B财务、银行'});
    D.materials.push(...sheets.map(m=>({...m,nodes:[...m.nodes]})));
    const {map,extra}=root.EXPORT_MATERIAL_REQUIREMENTS||require('./material-requirements.js');
    for(const m of D.materials.filter(m=>m.q?.length)){
      for(const n of D.nodes){
        const q=[...Object.values(map[n.id]).flat(2),...extra.filter(row=>row[0]===n.id).flatMap(row=>row[3])];
        if(m.q.some(id=>q.includes(id))&&!m.nodes.includes(n.id))m.nodes.push(n.id);
      }
    }
    D.materialCatalogVersion=2;
  }
  root.EXPORT_APPLY_MATERIAL_CATALOG=apply;
  if(typeof module!=='undefined')module.exports=apply;
})(globalThis);
