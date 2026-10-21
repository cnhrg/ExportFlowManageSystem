'use strict';
(function(root) {
  const D = root.EXPORT_BUSINESS || require('./business-data.js');
  const {map,extra}=root.EXPORT_MATERIAL_REQUIREMENTS||require('./material-requirements.js');
  const candidates = {
    N01:{input:[['M09','M11'],['M09','M10','M11'],['M11','M16']]},
    N02:{input:[['M06'],['M06','M16']],output:[['M06']]},
    N03:{input:[['M07'],['M07']],output:[['M07'],['M07']]},
    N04:{input:[['M11'],[]],output:[['M05'],[],[]]},
    N05:{input:[['M08','M09'],['M09','M13'],['M09','M12']],output:[['M08','M09','M13'],[]]},
    N06:{input:[['M07'],['M09']]},
    N07:{input:[['M08','M09','M13'],[],['M11']],output:[['M09','M11']]},
    N08:{input:[['M09','M11'],['M09']]},
    N09:{output:[['M11'],[],[]]},
    N11:{input:[['M15'],['M15']],output:[['M15'],['M15']]},
    N12:{input:[['M15'],['M09','M10']],output:[['M14'],[],['M14','M15']]},
    N13:{input:[['M14'],['M15']],output:[['M15']]},
    N14:{input:[['M15'],[],['M06','M16']]},
    N15:{input:[['M06','M05'],[],[]]},
    N16:{input:[['M11'],['M15']]},
    N18:{input:[['M11']]},
    N19:{input:[[],['M06']]},
    N21:{input:[['M08','M09','M11'],[]]}
  };
  const conditional = {
    'N04:output:2':'仅出口前预付款需要 B 指定/认可 F；出口后付款可由 A 自选 F。',
    'N15:input:1':'仅已到账资金分支必需；B垫资时须另交授信/资金来源材料并记录本项不适用。',
    'N17:output:1':'预付款/垫资时需要对应台账；纯出口后单笔结清且无预付/垫资时须说明。',
    'N23:input:0':'实际发生异常或变更时适用；无异常须有核实依据。',
    'N23:output:0':'发生异常/更正时适用；无异常须有核实依据。'
  };
  const labelOverrides={
    'N02:input:0':'本笔代理协议待签稿及条款核对资料',
    'N05:input:2':'货物规格、实物包装及原产地基础资料',
    'N15:input:1':'银行贸易核验入账完成后的可用资金记录及本笔交易匹配',
    'N21:output:0':'人工审核员批准的退税资料包及规则检查记录',
    'N21:output:1':'官方税务系统申报回执、受理状态、最终处理结果与退税到账凭证'
  };
  const slots = [];
  for(const n of D.nodes) {
    for(const direction of ['input','output']) n[direction].forEach((label,index)=>{
      const key=n.id+':'+direction+':'+index;
      slots.push({key,node:n.id,direction,label:labelOverrides[key]||label,
        q:map[n.id][direction][index],candidates:candidates[n.id]?.[direction]?.[index]||[],conditional:conditional[key]||null,source:n.source});
    });
  }
  extra.forEach(([node,direction,label,q,condition],i)=>slots.push({key:node+':'+direction+':extra'+i,node,direction,label,q,candidates:[],conditional:condition,source:D.nodes.find(n=>n.id===node).source}));
  for(const slot of slots){
    slot.legacyCandidates=[...slot.candidates];
    const matching=D.materials.filter(m=>m.file&&m.q?.some(q=>slot.q.includes(q)));
    slot.candidates=matching.filter(m=>!['excluded','basis','collection'].includes(m.referenceType)).map(m=>m.id);
    slot.exclusions=matching.filter(m=>m.referenceType==='excluded').map(m=>m.id);
    if(slot.q.includes('Q12')&&!slot.exclusions.includes('M05'))slot.exclusions.push('M05');
    slot.references=Object.fromEntries(['template','example','instruction','support'].map(type=>[type,matching.filter(m=>m.referenceType===type).map(m=>m.id)]));
  }
  const api={version:1,slots};
  root.EXPORT_REVIEW_SCHEMA=api;
  if(typeof module!=='undefined')module.exports=api;
})(globalThis);
