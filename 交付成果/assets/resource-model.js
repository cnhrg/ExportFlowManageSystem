'use strict';
(function(root){
  const defaults=Object.freeze({dailyOrders:300,fileKB:200,fileMB:5,versionFactor:1.3,dbKB:200,requestsPerOrder:30,peakFactor:20,logGB:1});
  const hardware=[
    ['应用 / 扫描 / 执行器',3,8,32,'每台2×480GB企业SSD，RAID1；双10GbE','2台承载＋1台冗余，可3实例均衡；失去任1台后剩余2台承载峰值，发布逐台摘流；ClamAV限流，执行器幂等和租约由业务保证'],
    ['业务数据库',2,8,128,'每台2×960GB企业SSD，RAID1；双10GbE','MySQL一主一从，主从同配128GiB；innodb_buffer_pool_size初始96GiB，余32GiB供OS/连接/复制及其他实例；人工核实并隔离旧主后切换'],
    ['私有S3存储',1,8,32,'2×4TB企业数据盘RAID1＋镜像系统盘；双10GbE','阵列可用4TB，70%预算2.8TB；单节点停机会中断文件服务，RAID不等于节点HA'],
    ['监控 / 日志 / 调度控制',1,8,32,'2×1.92TB企业SSD，RAID1；双10GbE','监控、日志、调度控制单实例；独立调度库/Grafana库位于数据库主从，隔离卷/账号/配额'],
    ['独立备份服务器',1,4,16,'2×8TB企业数据盘RAID1＋镜像系统盘；双10GbE','阵列可用8TB，70%预算5.6TB；独立权限及不可变/离线副本，备份不是在线从库']
  ];
  const middleware=[
    ['MySQL','本机业务实例＋容器调度库','业务一主一从，主从各128GiB，业务Buffer Pool初始96GiB；调度/Grafana独立数据库同样复制并隔离账号/配额','预留32GiB，若另设MySQL实例，其Buffer Pool与连接内存也计入整机总额；默认异步复制可能丢失事务，监测延迟/内存/物理读，隔离旧主并核实GTID/账务后切换；不承诺零丢失'],
    ['RustFS / S3','单节点、命名卷、版本管理/治理锁已验证','1节点＋RAID1＋独立备份；生产版本/文件系统兼容性及对象数须验收','单磁盘故障由RAID缓解；整机故障需恢复，期间文件确认阻断；对象版本/锁定策略及恢复须实测'],
    ['ClamAV','单容器，流扫描已验证','至少2扫描实例；病毒库更新监测，隔离CPU/内存，禁止直接公网访问','扫描服务失败/超时/超限阻断文件确认；文件任务仍用确切版本'],
    ['XXL-JOB','单后台＋专用单库，无业务执行器','单后台＋独立调度库，3执行器分散在3台应用机','后台故障暂停调度，恢复后幂等补偿；租约/栅栏与未知恢复仍由应用保证，不因实例增多重复执行业务'],
    ['Prometheus / Alertmanager','单实例＋本机UI路由','各1实例；接真实通知渠道，另设外部存活探测','运维机停机会失去本地监控/告警，外部探测不可与它同机'],
    ['Loki / Alloy','单Loki＋容器日志采集','Loki单体，写副本1；Alloy按主机采集，独立S3桶','30天规划留存；WAL/缓存单列配额，故障期间本地缓冲须限额并告警，不代替业务审计'],
    ['Grafana / 接入','单Grafana、loopback HTTP','单Grafana＋独立元数据库；双入口代理/TLS位于应用机','运维界面允许恢复性中断；密钥保护、访问控制和证书仍需验收']
  ];
  const profiles={
    minimum:{
      name:'最小预算',dbMemoryGiB:64,bufferPoolGiB:40,appCount:1,itKW:1.5,upsKVA:3,upsKW:2,coolingKW:2,rackU:12,
      summary:'4台合并部署，优先保住数据库主从与独立备份；接受应用、文件、运维同机故障停服。',
      hardware:[
        ['应用 / S3 / 运维合并',1,8,64,'2×4TB企业SSD数据盘RAID1＋镜像系统盘；双10GbE','应用、扫描、执行器、S3及运维同机；CPU/内存/IO配额隔离，不能将多个容器当物理冗余'],
        ['业务数据库',2,8,64,'每台2×960GB企业SSD，RAID1；双10GbE','一主一从，主从同配64GiB，业务Buffer Pool初始40GiB，预留24GiB'],
        hardware[4]
      ],
      reasons:[
        ['应用/运维合并','估算仅6.25 RPS，合并低负载服务减少机数，保留64GiB给扫描和缓存','单机故障同时失去入口、文件和观测；只适合能接受停机、人工恢复的场景'],
        ['数据库64GiB / Buffer Pool 40GiB','缓存热数据而非强求87.6GB数据全部驻留，主从独立避免与扫描争资源','冷数据依靠SSD，需监测物理读/延迟；切主前隔离旧主，缓存预热另验收'],
        ['保留完整存储与独立备份','文件容量由业务量决定，不因预算低缩短留存；备份不能与在线数据同机','数据盘用企业SSD缓解合并IO争用，未报价不保证该组合是市场最低总价'],
        ['安全/网络不降级','沿用双链路、访问控制、扫描、审计与恢复演练，不靠删控制节省','省的是节点隔离和应用冗余，不是合规要求；仍需外部存活探测']
      ]
    },
    moderate:{
      name:'适中预算',dbMemoryGiB:96,bufferPoolGiB:64,appCount:2,itKW:2.4,upsKVA:4,upsKW:3,coolingKW:3.2,rackU:18,
      summary:'7台分工隔离，双应用＋数据库主从，平衡资源利用和维护性；存储及运维仍单点。',
      hardware:[
        ['应用 / 扫描 / 执行器',2,8,32,hardware[0][4],'双应用及入口，停1台后另1台承载峰值；扫描限流，任务幂等/租约'],
        ['业务数据库',2,8,96,hardware[1][4],'一主一从，主从同配96GiB，业务Buffer Pool初始64GiB，预留32GiB'],
        hardware[2],hardware[3],hardware[4]
      ],
      reasons:[
        ['双应用与角色隔离','相比最小档拆开应用、S3和运维，减少扫描/存储/日志相互争抢','停1台应用后剩余1台须通过峰值压测，滚动发布与故障重叠时余量较小'],
        ['数据库96GiB / Buffer Pool 64GiB','比最小档增加热页缓存，仍留32GiB给OS/连接/复制，避免一次配置到顶','不保证全部数据驻留；需根据热集、物理读与p95决定后续加内存'],
        ['单S3、单运维','当前小规模ToB按可恢复中断设计，避免为少量吞吐引入分布式维护复杂度','S3停机阻断文件操作，运维停机影响调度/观测，不是全栈HA'],
        ['保留升级路径','两台应用及数据库采用与富裕档相同CPU/磁盘级别，便于再增应用和内存','96GiB DIMM组合须按主板通道/可扩展性核实，不承诺跨硬件无损扩容']
      ]
    },
    generous:{
      name:'富裕预算',dbMemoryGiB:128,bufferPoolGiB:96,appCount:3,itKW:3,upsKVA:6,upsKW:4,coolingKW:4,rackU:20,
      summary:'沿用当前8台方案：3应用（2＋1冗余），数据库主从各128GiB；额外预算用于缓存和应用维护余量。',
      hardware,
      reasons:[
        ['3应用（2台承载＋1台冗余）','保持当前配置，故障/维护时仍由2台承载峰值，逐台摘流发布更从容','须实测任1台故障；会话/文件不依赖单机，任务仍需幂等/租约'],
        ['数据库128GiB / Buffer Pool 96GiB','保持当前大内存主从同配，优先降低随机物理读并减少切主性能落差','缓存不是全部驻留保证，不能替代SSD、redo/binlog持久化或主从一致性'],
        ['保留独立角色与备份','应用、数据库、文件、运维、备份分工清晰，降低性能干扰及运维误操作影响','S3与运维仍单节点；富裕仅相对本轮三档，不等于无单点或异地容灾'],
        ['不为低RPS盲目堆集群','额外预算只增加有明确价值的应用冗余及热页缓存，不引入Redis/MQ/三节点数据库','如以后要求文件/监控持续可用，需要另做拓扑方案，不能用加内存代替']
      ]
    }
  };
  function calculate(input={},profileId='generous'){
    if(!Object.hasOwn(profiles,profileId))throw new RangeError('未知预算方案：'+profileId);
    const profile=profiles[profileId],selectedHardware=profile.hardware;
    const p={...defaults,...input};
    const limits={dailyOrders:[1,300],fileKB:[1,5000],fileMB:[0.001,5],versionFactor:[1,5],dbKB:[1,2000],requestsPerOrder:[1,10000],peakFactor:[1,100],logGB:[0.1,500]};
    for(const [key,[min,max]] of Object.entries(limits)){
      if(!Number.isFinite(p[key])||p[key]<min||p[key]>max)throw new RangeError(key+' 超出允许范围 '+min+'–'+max);
    }
    if(!Number.isInteger(p.dailyOrders))throw new RangeError('每日单量必须为整数');
    if(p.fileKB>p.fileMB*1000)throw new RangeError('单文件大小不能超过每单原件合计');
    const rawTB=8,usableTB=rawTB/2;
    const years=Array.from({length:2},(_,i)=>{
      const orders=p.dailyOrders*365*(i+1),fileTB=orders*p.fileMB*p.versionFactor/1e6;
      const dbTB=orders*p.dbKB*2/1e9;
      return {year:i+1,annualOrders:p.dailyOrders*365,orders,fileTB,dbTB,rawRequiredTB:fileTB*2/0.7};
    });
    const last=years[1],fileTB=last.fileTB,logLogicalTB=p.logGB*30*0.5/1000;
    const localReserveTB=profileId==='minimum'?0.2:0;
    const backupDataTB=fileTB*1.3+0.5+logLogicalTB;
    const selectedMiddleware=middleware.map(row=>[...row]);
    selectedMiddleware[0][2]='业务一主一从，各'+profile.dbMemoryGiB+'GiB，业务Buffer Pool初始'+profile.bufferPoolGiB+'GiB；调度/Grafana独立数据库复制及账号隔离';
    selectedMiddleware[0][3]='预留'+(profile.dbMemoryGiB-profile.bufferPoolGiB)+'GiB给OS/连接/复制/其他实例；所有实例内存合计受整机约束。异步复制可能丢失事务，隔离旧主并核实GTID/账务后切换，不承诺零丢失';
    selectedMiddleware[2][2]=profile.appCount+'个扫描实例位于应用机，设CPU/内存配额，更新病毒库，不暴露公网';
    selectedMiddleware[3][2]='单后台＋独立调度库，'+profile.appCount+'执行器位于应用机；后台'+(profileId==='minimum'?'与应用/S3合并':'位于独立运维机');
    selectedMiddleware[6][2]='单Grafana＋独立元数据库；'+(profile.appCount===1?'单入口代理/TLS，与应用合并':'双入口代理/TLS跨应用机');
    if(profileId==='minimum'){
      selectedMiddleware[1][2]='S3与应用/运维同机，独立RAID1数据卷/配额＋独立备份，生产兼容性及对象数需验收';
      selectedMiddleware[4][2]='各1实例，与应用同机；接真实通知＋外部存活探测，不能自监控代替外部探测';
      selectedMiddleware[5][2]='Loki单体与应用同机，写副本1；Alloy各机采集，独立S3桶及至少200GB运维本地配额';
    }
    return {parameters:p,profileId,profile,hardware:selectedHardware,middleware:selectedMiddleware,years,rawTB,usableTB,normalBudgetTB:usableTB*0.7,
      filesPerOrder:p.fileMB*1000/p.fileKB,originalFiles:last.orders*p.fileMB*1000/p.fileKB,
      backupDataTB,backupRequiredTB:backupDataTB/0.7,backupAvailableTB:8,backupBudgetTB:8*0.7,
      backupFits:backupDataTB<=8*0.7,
      logLogicalTB,logRawTB:logLogicalTB*2/0.7,objectLogicalTB:fileTB+logLogicalTB,localReserveTB,
      metricsGB:20000*(86400/15)*30*2/1e9*1.3,
      peakRPS:p.dailyOrders*p.requestsPerOrder/(8*3600)*p.peakFactor,
      fileMbps:p.dailyOrders*p.fileMB*p.versionFactor*8/(8*3600)*10,
      hostCount:selectedHardware.reduce((n,row)=>n+row[1],0),
      cores:selectedHardware.reduce((n,row)=>n+row[1]*row[2],0),
      memoryGB:selectedHardware.reduce((n,row)=>n+row[1]*row[3],0),
      storageFits:fileTB+logLogicalTB+localReserveTB<=usableTB*0.7};
  }
  const api={defaults,profiles,hardware,middleware,calculate};
  root.EXPORT_RESOURCE_MODEL=api;
  if(typeof module!=='undefined')module.exports=api;
})(globalThis);
