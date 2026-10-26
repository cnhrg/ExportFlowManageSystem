'use strict';
// Executable design rules over already authorized/loaded facts, not a server or CA verifier.
const {canonical}=require('../../../交付成果/assets/system-usecases-model.js');
const same=(a,b)=>canonical(a)===canonical(b);
function basisMissing(filing,fileLookup){
  const missing=[],add=path=>missing.push(path);
  const agent=filing.exportAgent?.exportAgentDetails,broker=filing.customsBroker?.customsDetails;
  if(!agent?.receiptPath)add('exportAgent.exportAgentDetails.receiptPath');
  if(!agent?.paymentPath)add('exportAgent.exportAgentDetails.paymentPath');
  if(![1,2].includes(agent?.paymentBranchCode))add('exportAgent.exportAgentDetails.paymentBranchCode');
  for(const [name,purpose]of [['qualification','MATERIAL_PURPOSE_CUSTOMS_QUALIFICATION'],['quotation','MATERIAL_PURPOSE_CUSTOMS_QUOTATION']]){
    const ref=broker?.[name],actual=ref&&fileLookup(ref.logicalFileNumber,ref.revisionNumber);
    if(!actual||!actual.referenceEligible||actual.sha256!==ref.sha256||ref.purpose!==purpose||actual.purpose!==purpose)add('customsBroker.customsDetails.'+name);
  }
  const money=broker?.quotedAmount;
  if(money?.currencyCode!=='CNY'||!/^(0|[1-9][0-9]{0,17})\.[0-9]{2}$/.test(money?.amount||'')||/^0\.00$/.test(money.amount))add('customsBroker.customsDetails.quotedAmount');
  if(!broker?.pricingBasis)add('customsBroker.customsDetails.pricingBasis');
  return missing;
}
function openRevision(root){
  if(![3,8].includes(root.status))return {error:'TRADE_NOT_REOPENABLE'};
  return {status:2,revision:root.revision+1,event:root.status===3?15:13,snapshotReason:root.status===8?3:null,approvedRevision:root.approvedRevision};
}
function reviewDecision(root,input,actor,submitter){
  if(root.status!==5)return {error:'TRADE_NOT_REVIEWABLE'};
  if(actor===submitter)return {error:'REVIEWER_NOT_INDEPENDENT'};
  if(input.outcome==='DECISION_OUTCOME_RETURN'){
    if(!input.reason||!input.missingItems?.length||input.missingItems.some(item=>!item.fieldPaths?.length&&!item.documentPurposeCodes?.length))return {error:'REQUIRED_MATERIAL'};
    return {status:3,event:7,snapshotReason:null};
  }
  if(input.outcome!=='DECISION_OUTCOME_APPROVE'||input.missingItems?.length)return {error:'INVALID_INPUT'};
  return {status:8,event:10,snapshotReason:2};
}
function appliesOn(from,to,date){
  if(![from,to,date].every(value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value))return false;
  return from<=date&&date<=to;
}
function addApprovedEvidence(root,approvedSnapshot,currentDependencyMatches){
  if(![2,8].includes(root.status)||!root.approvedSnapshot||root.approvedSnapshot!==approvedSnapshot||!currentDependencyMatches)return {error:'TRADE_BASIS_NOT_APPROVED'};
  return {status:2,revision:root.revision+1,event:root.status===8?13:null,snapshotReason:root.status===8?3:null,approvedSnapshot:root.approvedSnapshot};
}
function contractAction(action,root){
  if(root.activeSignature||root.unknownSignature)return {error:'SIGNATURE_IN_PROGRESS'};
  if(action==='terminate')return [1,2,3,4,5,6].includes(root.status)&&root.terminationAuthorized&&root.legalEvidenceVerified?{status:8}:{error:'AUTHORIZATION_NOT_APPLICABLE'};
  if(root.revision!==root.currentRevision)return {error:'CONTRACT_STATE_CONFLICT'};
  if(action==='revise')return [3,5,6,8].includes(root.status)?{revision:root.currentRevision+1,status:1}:{error:'CONTRACT_STATE_CONFLICT'};
  if(action==='activate'){
    if(root.status!==5||!root.archiveVerified||!root.conditionsVerified)return {error:'SIGNATURE_EVIDENCE_INVALID'};
    if(root.oldEffectiveRevision&&(root.supersedes!==root.oldEffectiveRevision||!root.replacementAuthorized))return {error:'REPLACEMENT_REQUIRED'};
    return {status:6,superseded:root.oldEffectiveRevision||null};
  }
  const allowed={replace:1,submit:1,review:2,sign:4};
  return root.status===allowed[action]?{allowed:true}:{error:'CONTRACT_STATE_CONFLICT'};
}
function signatureBasisUnchanged(oldBasis,newBasis){
  // Inputs are complete server-normalized signing dependencies, never raw filing JSON.
  const byPurpose={10:['agencyInstructions'],11:['logisticsScope','quotation'],12:['customsScope','qualification','quotation']};
  if(!oldBasis||!newBasis||oldBasis.purpose!==newBasis.purpose||!byPurpose[oldBasis.purpose])return false;
  return ['purpose','parties','goods','paymentTerms','contractTerms','effectivePeriod',...byPurpose[oldBasis.purpose]]
    .every(key=>Object.hasOwn(oldBasis,key)&&Object.hasOwn(newBasis,key)&&oldBasis[key]!=null&&newBasis[key]!=null&&same(oldBasis[key],newBasis[key]));
}
module.exports={basisMissing,openRevision,reviewDecision,appliesOn,addApprovedEvidence,contractAction,signatureBasisUnchanged};
