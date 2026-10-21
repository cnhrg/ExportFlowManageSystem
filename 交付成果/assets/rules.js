'use strict';
(function (root) {
  function evaluatePayment(mode, c) {
    const errors = [];
    const need = (key, message) => { if (c[key] !== true) errors.push(message); };
    const amount = Number(c.amount);
    if (!Number.isSafeInteger(amount) || amount <= 0) errors.push('金额须为正数，最多两位小数');
    if (c.currency !== 'CNY') errors.push('本演示仅核算 CNY；其他币种须另行确认');
    need('noIssues','仍有未解决异常或合规问题');
    need('agreements','附件1及必要合同未核验');
    need('authorization','A 对 F 的有效委托/授权未核验');
    need('account','A 收款账户未独立核实');
    if (mode === 'pre') {
      need('fAccepted','B 对同一个 F 的书面认可未核验');
      need('attachment4','附件4签署件未核验');
      if (c.source === 'advance') {
        need('creditConfigured','垫资规则、币种及审批权限尚未确认');
        need('creditApproval','垫资申请未获有权审批人批准');
        const limit = Number(c.limit), occupied = Number(c.occupied);
        if (!Number.isSafeInteger(limit) || limit <= 0 || !Number.isSafeInteger(occupied) || occupied < 0) errors.push('垫资总额/已占用额度无效');
        else if (Number.isSafeInteger(amount) && amount > limit - occupied) errors.push('垫资剩余额度不足');
      } else if (c.source === 'received') {
        need('received','D 款项未实际入账且可用');
        if (!Number.isSafeInteger(c.available) || c.available < amount) errors.push('已到账可用资金不足');
      } else errors.push('尚未选择已到账资金或 B 垫资');
    } else if (mode === 'post') {
      need('draftApproved','A 未确认最终草稿版本');
      need('bNamed','已申报附件2未确认 B 为境内发货人');
      need('bReceived','B 尚未收到正式附件2');
      need('released','真实出口放行凭证未核验');
      need('received','D 款项未实际入账且可用');
      need('matched','到账未与交易/批次匹配');
      need('quote','银行有效报价及结算条件未核验');
      need('netApproved','费用、扣款及净额未批准');
      if (!Number.isSafeInteger(c.available) || c.available < amount) errors.push('已到账可用资金不足');
    } else errors.push('未知付款模式');
    need('manualApproval','尚未完成本版本人工审核');
    return { allowed: errors.length === 0, errors };
  }
  function cents(value) {
    if (!/^\d+(\.\d{1,2})?$/.test(String(value))) return NaN;
    const [whole, fraction = ''] = String(value).split('.');
    const n = Number(whole) * 100 + Number(fraction.padEnd(2,'0'));
    return Number.isSafeInteger(n) ? n : NaN;
  }
  const api = { evaluatePayment, cents };
  root.EXPORT_RULES = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
