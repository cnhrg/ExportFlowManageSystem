'use strict';
(function(){
  const M=globalThis.EXPORT_RESOURCE_MODEL,host=document.getElementById('resource-panel');
  if(!host||!M)throw new Error('资源页容器或模型未加载');
  const fmt=(value,digits=0)=>value.toLocaleString('zh-CN',{maximumFractionDigits:digits,minimumFractionDigits:digits});
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function table(headers,rows){
    return '<div class="resource-table" tabindex="0" role="region" aria-label="'+esc(headers.join('、'))+'"><table><thead><tr>'+headers.map(h=>'<th scope="col">'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
  }
  let selectedProfile='generous',parameters={...M.defaults};
  host.innerHTML='<div class="resource-tabs" role="tablist" aria-label="资源预算方案">'+Object.entries(M.profiles).map(([id,profile])=>
    '<button type="button" role="tab" id="resource-tab-'+id+'" aria-controls="resource-results" aria-selected="'+(id===selectedProfile)+'" tabindex="'+(id===selectedProfile?0:-1)+'" data-budget="'+id+'">'+esc(profile.name)+'</button>').join('')+
    '</div><p class="resource-common-note">三档共用下方业务假设，仅调整部署和内存/冗余；当前配置归富裕预算。预算指相对资源投入，不列价格，不保证实际最低采购总价。修改输入后请点击重新测算，切换预算保留输入及最近一次测算。</p><form id="resource-inputs" class="resource-inputs">'+[
    ['dailyOrders','每日交易上限（单）',1,300,1],['fileKB','单文件大小（KB）',1,5000,1],['fileMB','每单原件合计（MB）',0.001,5,0.001],
    ['versionFactor','签署/修订倍率',1,5,0.1],['dbKB','每单数据库载荷（KB）',1,2000,1],
    ['requestsPerOrder','每单请求数（次）',1,10000,1],['peakFactor','请求峰均倍率',1,100,1],['logGB','原始日志（GB/日）',0.1,500,0.1]
  ].map(([key,label,min,max,step])=>'<label>'+label+'<input name="'+key+'" type="number" min="'+min+'" max="'+max+'" step="'+step+'" value="'+M.defaults[key]+'" required></label>').join('')+
    '<button type="submit">重新测算</button></form><p id="resource-error" role="alert"></p><div id="resource-results" role="tabpanel" tabindex="0" aria-labelledby="resource-tab-generous"></div>';
  function render(p){
    const r=M.calculate(p,selectedProfile),last=r.years.at(-1),q=r.parameters,profile=r.profile;
    document.getElementById('resource-results').innerHTML=
      '<section class="resource-section resource-profile"><h3>'+esc(profile.name)+' · 设计理由与取舍</h3><p>'+esc(profile.summary)+'</p>'+
      table(['设计决策','为什么这样配置','代价 / 验收边界'],profile.reasons)+'</section><div class="resource-metrics">'+[
        ['2年累计交易',fmt(last.orders)+' 单'],['文件逻辑容量',fmt(last.fileTB,4)+' TB'],
        ['峰值请求估算',fmt(r.peakRPS,2)+' RPS'],['规划物理服务器',r.hostCount+' 台']
      ].map(([label,value])=>'<article><span>'+label+'</span><strong>'+value+'</strong></article>').join('')+'</div>'+
      '<section class="resource-section"><h3>两年ToB用量与容量</h3><p>按每日上限全年365天持续运行，Y1–Y2每年同上限，不假设复合增长；累计数据2年不删除，规划期结束不代表允许删除。MB/GB/TB均为十进制。每单原件合计不超过5MB，200KB是单文件估算大小，不是每单数据库载荷。</p>'+
      table(['年度','当年交易（单）','累计交易（单）','文件逻辑（TB）','数据库含索引（TB）','S3原始盘需求（TB）'],r.years.map(y=>['Y'+y.year,fmt(y.annualOrders),fmt(y.orders),fmt(y.fileTB,2),fmt(y.dbTB,3),fmt(y.rawRequiredTB,2)]))+
      '<details><summary>公式、留存和压测假设</summary><p>文件 = 累计单量 × '+fmt(q.fileMB,3)+'MB × '+fmt(q.versionFactor,1)+'；数据库 = 累计单量 × '+fmt(q.dbKB)+'KB × 2（索引/页开销），不包含文件字节、binlog与备份。S3原始盘需求 = 文件 × RAID1双盘 ÷ 70%水位，不是跨节点副本。</p>'+
      '<p>按单文件 '+fmt(q.fileKB)+'KB，约 '+fmt(r.filesPerOrder,1)+'份原件/单，两年约 '+fmt(r.originalFiles)+'份原件；大小分布及修订后对象数须实测，不能仅用TB判断S3性能。200KB仅用于文件数量估算，不再加一次文件字节。</p>'+
      '<p>请求 = 日单量 × 每单请求 ÷ 8小时 ÷ 3600 × 峰均倍率，当前 '+fmt(r.peakRPS,2)+' RPS；文件带宽 = 日文件量 ÷ 8小时 × 10倍突发，约 '+fmt(r.fileMbps,2)+' Mbps，不含备份/复制。每单请求数不额外乘文件份数；后台任务、列表/查询、登录及实际上传请求若未纳入30次，必须另测。ToB并发量尚无实测，不沿用原500会话假设。</p>'+
      '<p>运行日志暂按1GB/日（可调）、30天、压缩后50%，当前逻辑 '+fmt(r.logLogicalTB,3)+'TB、RAID1/70%水位原始 '+fmt(r.logRawTB,3)+'TB；指标按2万活跃序列、15秒采样、30天、2字节/样本、单Prometheus及30%开销，合计 '+fmt(r.metricsGB,2)+'GB。均须实测校准；审计/证据期限另行批准，不修改本机7/15天策略。</p></details></section>'+
      '<section class="resource-section"><h3>自建机房物理资源清单</h3><p>建议上限配置，不是当前已采购资源。共 '+r.hostCount+'台 / '+r.cores+'个物理CPU核 / '+fmt(r.memoryGB)+'GiB内存；内存按二进制GiB，磁盘容量仍按十进制。虚拟机或容器vCPU不得与物理核重复相加。系统盘镜像不计入业务容量。</p>'+
      table(['用途','数量（台）','每台物理核','每台内存（GiB）','磁盘/网络','部署与故障边界'],r.hardware)+
      '<p>数据库主从同配'+profile.dbMemoryGiB+'GiB，innodb_buffer_pool_size初始'+profile.bufferPoolGiB+'GiB，预留'+(profile.dbMemoryGiB-profile.bufferPoolGiB)+'GiB给OS、连接/排序/临时表、复制、备份及其他实例。两年数据含索引约 '+fmt(last.dbTB*1000,1)+'GB/实例；不能以磁盘数据量保证全部驻留或缓存命中率。大内存降低物理读，不替代SSD、事务持久化或主从一致性。</p>'+
      '<p class="resource-capacity '+(r.storageFits?'':'resource-warning')+'" role="status">S3总原始 '+fmt(r.rawTB)+'TB，RAID1阵列可用 '+fmt(r.usableTB)+'TB，70%工作预算 '+fmt(r.normalBudgetTB,1)+'TB。两年文件＋日志逻辑 '+fmt(r.objectLogicalTB,4)+'TB'+(r.localReserveTB?'，加合并部署本地指标/WAL/缓存预留 '+fmt(r.localReserveTB,1)+'TB':'（运维机本地指标/WAL/缓存另设至少200GB配额）')+'：'+(r.storageFits?'容量预算内；其他桶及索引额外增长仍需监测。':'超出容量预算，必须扩容，不得按该清单采购。')+' 单S3节点故障时服务不可用，不能宣称N+1。</p>'+
      '<p class="'+(r.backupFits?'':'resource-warning')+'">备份负载 = 文件（已含修订）×1.3备份历史倍率＋0.5TB数据库全备/增量/binlog配额＋当前日志 '+fmt(r.logLogicalTB,3)+'TB，共 '+fmt(r.backupDataTB,4)+'TB；含30%空余需 '+fmt(r.backupRequiredTB,3)+'TB阵列可用空间。备份RAID1可用 '+fmt(r.backupAvailableTB)+'TB、70%预算 '+fmt(r.backupBudgetTB,1)+'TB。'+(r.backupFits?'当前估算满足。':'当前估算不满足，需扩容。')+' DB备份配额随实际变化率和留存重算；同址备份不是在线副本或异地容灾。</p></section>'+
      '<section class="resource-section"><h3>中间件：本机现状 → '+esc(profile.name)+'</h3>'+table(['组件','已部署验证环境','生产资源/布局建议','接入与验收条件'],r.middleware)+'</section>'+
      '<section class="resource-section"><h3>机房配套与单点排除</h3>'+table(['项目','建议数量/规格','验收或边界'],[
        ['机柜/故障域','1×42U，双路供电与双PDU，预留约30%机位',r.hostCount+'台建议控制在约'+profile.rackU+'U内，采购核实机型/交换机/UPS空间；不保证整柜故障存活'],
        ['业务/存储网络','2台10GbE交换机，每台≥16口；每服务器每交换机各1链路',r.hostCount+'台主机占每交换机'+r.hostCount+'口，另留上联/互联/扩容；数据库复制和备份限速、VLAN隔离；须验收双链路切换'],
        ['管理/边界','2台管理交换机、2台HA防火墙；入口代理位于应用机（'+(profile.appCount===1?'单实例':'至少跨2机')+'）','独立带外管理、业务/存储/备份/管理VLAN与ACL；堡垒机、MFA、证书和密钥保护资源不能省略'],
        ['运营商/网络安全','2条独立路径线路，建议每条≥100Mbps，随文件假设重算','当前文件突发估算 '+fmt(r.fileMbps,2)+'Mbps；'+(r.fileMbps>70?'已超过100Mbps线路70%预算，须提高带宽。':'尚需预留协议开销及其他流量。')+' ToB列表/下载流量另测；接入方要求、备案及等保适用范围需评审；无公网管理端口'],
        ['供电/UPS','IT暂估'+fmt(profile.itKW,1)+'kW；两路UPS各承担完整负载，每路建议≥'+profile.upsKVA+'kVA且额定输出≥'+profile.upsKW+'kW','最小/适中按每台0.3kW＋网络0.3kW；富裕DB每台0.45kW，其余0.3kW。均需核实整机/启动峰值；单路负载≤80%，暂按30分钟续航，电池依厂商曲线设计'],
        ['制冷/环境','净显冷故障后仍≥'+profile.coolingKW+'kW；温湿度、漏水、烟感与门禁监控','IT功率×1.3取整预算；UPS损耗/房间热负荷另核；消防、防雷、接地由专业机电设计，不估采购价格'],
        ['备件/值守','系统SSD、数据盘、光模块、电源/风扇备件；7×24告警渠道与值班安排','硬盘同规格保供；厂商质保及响应；恢复演练与UPS/消防巡检，不把软件健康检查当机房验收'],
        ['备份/恢复','同机房独立备份设备＋不可变/离线副本；加密、独立账号与定期恢复演练','三档均单机房、非全栈HA：火灾、整站停电或勒索可同时影响在线与同址备份；无异地容灾。RPO/RTO须确认后实测，不承诺零丢失']
      ])+'</section>'+
      '<section class="resource-section"><h3>分期投放与扩容门槛</h3>'+table(['阶段/指标','动作','不能省略的条件'],[
        ['首期',profile.summary,'当前'+r.hostCount+'台；三档均保留DB一主一从与独立备份，不改变业务量/留存，均有单点'],
        ['滚动预测覆盖未来12个月','实际文件/数据库/日志增长按月更新参数，提前扩容','规划期2年不是法定留存期；超过300单/日或5MB/单须重新评审模型上限'],
        ['S3或备份阵列使用>60%，或预测将超过70%','先扩容量并验证恢复；有持续可用要求则升级存储拓扑','监测数百万小文件及版本膨胀；RAID不是备份，也不提供整机HA'],
        ['DB磁盘>60%、CPU持续>60%或延迟超压测SLO','优化索引/慢SQL、扩盘/内存/只读能力；锁争用单独诊断','单主资金写入不靠随意多主/分库解决；binlog与备份预算独立'],
        ['DB可用内存持续<15%或发生swap/OOM；物理读与p95同步恶化','先查连接/临时表、慢SQL及其他实例，再调整Buffer Pool或扩内存',profile.bufferPoolGiB+'GiB为初值，按物理读、命中率及工作集校准；不能只因池已用满就扩容；重启/切主冷缓存须预热验收'],
        ['应用CPU持续>60%、扫描排队或p95超目标','按压测增加应用/扫描实例并限流',(profile.appCount===1?'单机故障会停服，需恢复或升级双应用':'停任1台后剩余'+(profile.appCount-1)+'台承载峰值，逐台摘流')+'；会话/文件不依赖单机，任务须幂等/租约'],
        ['数据库复制延迟>5秒持续1分钟或复制中断','告警并核实事务/GTID，必要时限制新增写入；切换前隔离旧主','阈值为初始运维假设，RPO/RTO待业务确认；资金未知结果先对账，不因切主重付'],
        ['日志/指标活跃序列、日增量超过假设20%','调保留、基数及采样策略并扩盘；告警先接真实渠道','不得为了容量擅自缩短法律证据/审计保留，禁止高基数身份/业务号做指标标签']
      ])+'<p><a href="../doc/自建机房两年资源规划.md">查看资源规划口径</a> · <a href="../doc/方案验证中间件环境说明.md">查看已部署中间件与验证范围</a></p></section>';
  }
  document.getElementById('resource-inputs').addEventListener('submit',event=>{
    event.preventDefault();
    const form=event.currentTarget;
    if(!form.reportValidity())return;
    try{
      const p=Object.fromEntries([...new FormData(form)].map(([key,value])=>[key,Number(value)]));
      render(p);parameters=p;document.getElementById('resource-error').textContent='';
    }catch(error){document.getElementById('resource-error').textContent=error.message;}
  });
  const tabs=[...host.querySelectorAll('[role="tab"]')];
  function selectTab(tab){
    selectedProfile=tab.dataset.budget;
    tabs.forEach(button=>{
      const active=button===tab;
      button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
    });
    document.getElementById('resource-results').setAttribute('aria-labelledby',tab.id);
    render(parameters);
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>selectTab(tab));
    tab.addEventListener('keydown',event=>{
      const next=event.key==='ArrowRight'?(index+1)%tabs.length:event.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:event.key==='Home'?0:event.key==='End'?tabs.length-1:null;
      if(next===null)return;
      event.preventDefault();tabs[next].focus();selectTab(tabs[next]);
    });
  });
  render(M.defaults);
})();
