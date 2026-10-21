'use strict';
(function () {
  const $ = id => document.getElementById(id);
  const roles = {
    sales: {
      name: '销售 / 业务经办',
      description: '建立交易档案并维护本方未锁定资料，提交后进入独立审核。',
      scope: '所属组织',
      members: 12,
      permissions: [[1,1,1,1,0,0,0],[1,0,1,1,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]
    },
    operations: {
      name: '运营',
      description: '按建档、协议资料、出口单证、物流履约、报关回执、证明、结案及异常更正场景处理授权单据；可修改、提交、审核或驳回，禁止自审，不替代专业资金终审及外部确认。',
      scope: '授权范围内全部',
      members: 8,
      permissions: [[1,1,1,1,1,0,0],[1,1,1,1,1,0,1],[0,0,0,0,0,0,0],[1,0,1,1,1,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]
    },
    legal: {
      name: '法务 / 合同管理员',
      description: '维护合同模板与条款，Review合同风险并记录法律意见。',
      scope: '指定客户 / 交易',
      members: 3,
      permissions: [[1,0,0,0,0,0,0],[1,1,1,1,1,0,1],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[1,0,0,0,0,0,0],[1,0,1,0,0,0,0]]
    },
    finance: {
      name: '财务经办',
      description: '处理授权范围内的账户、流水匹配、贸易核验入账试算、对账与付款申请。',
      scope: '指定客户 / 交易',
      members: 5,
      permissions: [[1,0,0,0,0,0,0],[1,0,0,0,0,0,0],[1,1,1,1,0,0,1],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]
    },
    'finance-approver': {
      name: '财务审批 / 资金授权人',
      description: '按审批额度复核并放行付款；申请人与审批人必须分离。',
      scope: '指定客户 / 交易',
      members: 2,
      permissions: [[1,0,0,0,0,0,0],[1,0,0,0,0,0,0],[1,0,0,0,1,1,1],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]
    },
    customs: {
      name: '报关经办',
      description: '维护委托范围内的报关资料与草稿，申报前须取得出口方最终确认。',
      scope: '指定客户 / 交易',
      members: 4,
      permissions: [[1,0,0,0,0,0,0],[1,0,1,1,0,0,0],[0,0,0,0,0,0,0],[1,1,1,1,0,1,1],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]
    },
    tax: {
      name: '税务经办',
      description: '交接证明与退税材料并跟踪状态，不代替纳税主体进行正式申报。',
      scope: '指定客户 / 交易',
      members: 2,
      permissions: [[1,0,0,0,0,0,0],[1,0,1,1,0,0,1],[0,0,0,0,0,0,0],[1,0,1,1,0,0,1],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]
    },
    compliance: {
      name: '合规人员',
      description: '查看主体风险与核查材料，在授权范围内复核 Hold 并保留命中记录。',
      scope: '授权范围内全部',
      members: 3,
      permissions: [[1,0,0,0,0,0,0],[1,0,0,0,0,0,0],[1,0,0,0,0,0,0],[1,0,0,0,1,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]
    },
    admin: {
      name: '系统管理员',
      description: '管理账号、组织、角色与系统配置，并可编辑合同模板；不具备业务审批或资金操作权限。',
      scope: '所属组织',
      members: 2,
      permissions: [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[1,1,1,1,0,0,1],[1,0,1,0,0,0,0]]
    },
    boss: {
      name: 'Boss Viewer',
      description: '只读查看单据进度、资金链路与授权交易脱敏摘要；不查看原件或参与业务审批。',
      scope: '授权范围内全部',
      members: 2,
      permissions: [[1,0,0,0,0,0,0],[1,0,0,0,0,0,0],[1,0,0,0,0,0,0],[1,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]
    },
    'super-admin': {
      name: 'Super Admin',
      description: '拥有全部业务模块和系统管理权限；所有敏感操作必须完整留痕。',
      scope: '全组织 / 全系统',
      members: 1,
      permissions: Array.from({length: 6}, () => [1,1,1,1,1,1,1])
    },
    'internal-audit': {
      name: '内部审计合规',
      description: '查看全部业务模块、权限配置和审计记录；只读，不得新建、编辑、提交、审核、执行或导出。',
      scope: '全组织（只读）',
      members: 1,
      permissions: Array.from({length: 6}, () => [1,0,0,0,0,0,0])
    }
  };
  const defaultRole = 'sales';

  const roleTree = [
    {
      id: 'A', name: 'A · 中国供应商', color: 'a',
      roles: [
        {name: '业务经办', type: '非资金操作', nodes: [['N02','代理协议'],['N05','备货单证'],['N08','确认报关草稿'],['N21','退税资料']], permissions: ['编辑本方资料','提交单证','确认草稿']}
      ]
    },
    {
      id: 'B', name: 'B · 贸易代理商', color: 'b',
      roles: [
        {name: '运营经办', type: '分场景业务审核 · 非资金操作', nodes: [['N01','建档审核'],['N02','协议资料'],['N05','出口单证'],['N06','物流履约'],['N09','报关回执'],['N19','代理出口证明'],['N22','四流结案'],['N23','异常更正']], permissions: ['查看在途单据','修改并重提','审核通过','驳回补正'], boundary:'仅业务资料核验；不可自审、代A确认、代F申报或执行B付款'},
        {name: '资金经办 / 授权人', type: '资金操作', nodes: [['N12','付款发票'],['N14','结算核对'],['N15','预付款放行'],['N16','出口后付款'],['N17','付款 / 收款确认']], permissions: ['来款匹配','贸易核验入账对账','付款提请','授权人放行'], boundary: '经办人与审批人不可为同一人'}
      ]
    },
    {
      id: 'E', name: 'E · 物流公司', color: 'e',
      roles: [
        {name: '业务经办', type: '非资金操作', nodes: [['N03','物流委任 / 报价合同'],['N06','运输计划'],['N10','运输签收 / 运费凭证']], permissions: ['维护运输','上传货况','提交签收','提交报价','上传费用凭证'], boundary: '报价及费用凭证归业务资料；不涉及系统内资金流转，不可查看银行账户或执行付款'}
      ]
    },
    {
      id: 'F', name: 'F · 出口报关代理', color: 'f',
      roles: [
        {name: '业务经办', type: '非资金操作', nodes: [['N04','委任授权'],['N07','报关草稿'],['N09','正式申报'],['N18','证明资料']], permissions: ['维护报关资料','提交申报','登记回执']}
      ]
    }
  ];

  function renderMindmap() {
    const groups = roleTree.map(group =>
      '<article class="mindmap-group mindmap-' + group.color + '">' +
        '<div class="mindmap-entity"><span>' + group.id + '</span><b>' + group.name + '</b></div>' +
        '<div class="mindmap-branches">' + group.roles.map(role =>
          '<section class="mindmap-role' + (role.type === '未配置' ? ' is-unconfigured' : '') + '">' +
            '<div class="mindmap-role-heading"><b>' + role.name + '</b><span>' + role.type + '</span></div>' +
            '<div class="mindmap-nodes">' + (role.nodes.length
              ? role.nodes.map(node => '<button type="button" data-node="' + node[0] + '" title="' + node[0] + ' · ' + node[1] + '"><b>' + node[0] + '</b><span>' + node[1] + '</span></button>').join('')
              : '<span class="mindmap-empty">无对应工作节点</span>') +
            '</div>' +
            (role.permissions.length ? '<div class="mindmap-permissions">' + role.permissions.map(permission => '<span>' + permission + '</span>').join('') + '</div>' : '') +
            (role.boundary ? '<div class="mindmap-boundary">' + role.boundary + '</div>' : '') +
          '</section>'
        ).join('') + '</div>' +
      '</article>'
    ).join('');
    $('rbac-mindmap').innerHTML =
      '<div class="mindmap-root"><b>代理出口业务平台</b><span>RBAC 角色权限</span></div>' +
      '<div class="mindmap-branch-caption">按业务主体 → 操作类型拆分</div>' +
      '<div class="mindmap-groups">' + groups +
        '<article class="mindmap-admin"><div class="mindmap-entity"><span>SYS</span><b>系统权限角色</b></div>' +
          '<div class="mindmap-branches">' +
            '<section class="mindmap-role"><div class="mindmap-role-heading"><b>Super Admin</b><span>全权限</span></div>' +
              '<div class="mindmap-nodes"><span class="mindmap-empty">全业务模块与系统管理权限</span></div>' +
              '<div class="mindmap-permissions"><span>新建 / 编辑 / 提交</span><span>审核 / 执行 / 导出</span></div>' +
              '<div class="mindmap-boundary">敏感操作完整留痕</div>' +
            '</section>' +
            '<section class="mindmap-role"><div class="mindmap-role-heading"><b>系统管理员</b><span>系统配置</span></div>' +
              '<div class="mindmap-nodes"><span class="mindmap-empty">无业务工作节点</span></div>' +
              '<div class="mindmap-permissions"><span>用户 / 角色配置</span><span>组织配置</span><span>编辑合同模板</span></div>' +
              '<div class="mindmap-boundary">无业务审批 · 无资金操作</div>' +
            '</section>' +
            '<section class="mindmap-role"><div class="mindmap-role-heading"><b>内部审计合规</b><span>全量只读</span></div>' +
              '<div class="mindmap-nodes"><span class="mindmap-empty">全部业务模块与审计记录</span></div>' +
              '<div class="mindmap-permissions"><span>查看交易与材料</span><span>查看权限配置</span><span>查看审批及操作轨迹</span></div>' +
              '<div class="mindmap-boundary">不可新建、编辑、提交、审核、执行或导出</div>' +
            '</section>' +
          '</div></article>' +
      '</div>' +
      '<div class="mindmap-note"><span>业务角色按主体与授权范围隔离</span><span>节点编号可点击查看流程详情</span><span>关键审核与资金执行按授权分离</span></div>';
  }

  function renderRole(roleId) {
    const role = roles[roleId];
    if (!role) return;
    document.querySelectorAll('[data-rbac-role]').forEach(button => {
      const selected = button.dataset.rbacRole === roleId;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    $('rbac-selected-role').textContent = role.name;
    $('rbac-role-description').textContent = role.description;
    $('rbac-scope').value = role.scope;
    $('rbac-edit-members').innerHTML = '管理成员 <span>' + role.members + '</span>';
    const modules = ['交易档案','合同与单证','收款与资金','报关与退税','用户与角色','合同模板'];
    $('rbac-permission-rows').innerHTML = role.permissions.map((row, moduleIndex) =>
      '<tr><th>' + modules[moduleIndex] + '</th>' +
      row.map((allowed, actionIndex) => '<td><input type="checkbox" data-module="' + moduleIndex + '" data-action="' + actionIndex + '"' +
        (allowed ? ' checked' : '') + ' aria-label="' + ['交易档案','合同与单证','收款与资金','报关与退税','用户与角色'][moduleIndex] + ['查看','新建','编辑','提交','审核','执行','导出'][actionIndex] + '"></td>').join('') +
      '</tr>'
    ).join('');
    $('rbac-select-all').checked = false;
    $('rbac-save-status').textContent = '角色权限变更需复核后生效；高风险动作受职责分离策略约束。';
  }

  function initRbac() {
    $('rbac-role-list').addEventListener('click', event => {
      const button = event.target.closest('[data-rbac-role]');
      if (button) renderRole(button.dataset.rbacRole);
    });
    $('rbac-role-search').addEventListener('input', event => {
      const query = event.target.value.trim().toLocaleLowerCase();
      const buttons = [...document.querySelectorAll('[data-rbac-role]')];
      buttons.forEach(button => {
        button.hidden = !button.textContent.toLocaleLowerCase().includes(query);
      });
      const visible = buttons.find(button => !button.hidden);
      if (visible && !document.querySelector('[data-rbac-role].active:not([hidden])')) renderRole(visible.dataset.rbacRole);
      if (!visible) $('rbac-save-status').textContent = '未找到匹配角色。';
    });
    $('rbac-select-all').addEventListener('change', event => {
      document.querySelectorAll('#rbac-permission-rows input[type=checkbox]').forEach(input => {
        input.checked = event.target.checked && Number(input.dataset.action) < 4;
      });
    });
    $('rbac-save').addEventListener('click', () => {
      $('rbac-save-status').textContent = '已提交配置复核（本地原型演示；未写入服务器）。';
    });
    $('rbac-reset').addEventListener('click', () => {
      const selected = document.querySelector('[data-rbac-role].active');
      renderRole(selected?.dataset.rbacRole || defaultRole);
    });
    $('rbac-edit-members').addEventListener('click', () => {
      $('rbac-save-status').textContent = '成员列表为原型占位；实际授权须校验组织归属并记录审批。';
    });
    $('rbac-temp-grant').addEventListener('click', () => {
      $('rbac-save-status').textContent = '临时授权须补充授权原因、审批人和到期时间；本原型不会创建真实授权。';
    });
  }

  if ($('rbac-mindmap')) {
    renderMindmap();
    globalThis.EXPORT_BOSS.initialize();
  }
})();
