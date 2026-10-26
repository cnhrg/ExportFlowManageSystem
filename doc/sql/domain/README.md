# 当前领域模型的本机 MySQL

当前生成设计为 **47表、702列**：新增关务不可变修订、办理请求两表，税务补确切资料/审核/办理及事件历史。**原部署 `export_trade` 仍45张空表、666列，未迁移**；本轮只在随机隔离验证库导入新DDL，不重建、ALTER或导入原业务库。领域前缀保留当前模型，其中 `trade_participater_tab` 保留原拼写。这是本机设计验证，不代表生产流程或金融控制验收。

## 连接

- MySQL 8.4，`127.0.0.1:3307`，库 `export_trade`；禁用 MySQL X 网络接口。
- 数据、配置及凭据：`~/Library/ExportTradeLocal/`，目录0700、凭据0600。
- 应用：`mysql --defaults-file="$HOME/Library/ExportTradeLocal/client.cnf"`。
- 管理：`mysql --defaults-file="$HOME/Library/ExportTradeLocal/root-client.cnf" export_trade`，只走私有socket。
- `com.export-trade.mysql` LaunchAgent 在当前用户登录后自动启动；**不是无人登录时的系统级启动**。手动重启：`launchctl kickstart -k "gui/$(id -u)/com.export-trade.mysql"`。
- 不修改 Homebrew 默认数据目录、旧 `ExportTradeStep1Demo` 样例实例或原有 PostgreSQL 服务。

## 生成与验证

```sh
node doc/sql/domain/generate.cjs
node doc/sql/domain/generate.cjs --check
node doc/sql/domain/verify.cjs --database verify_domain_<本轮随机后缀>
```

`schema.sql` 是生成产物，修改唯一模型或生成器后重新生成，不手工维护第二份字段字典。`verify.cjs` 要求显式隔离库名、先确认空库再事务回滚测试；拒绝export_trade及旧演示库。复合触发器使用mysql客户端DELIMITER语法；驱动须按完整触发器语句执行，不能直接按分号切割。

领域模型和生成DDL不绑定部署位置：本机验证、云厂商托管MySQL及合规要求下的自建MySQL均使用同一字段名、字段类型和约束；仅连接参数、可用性拓扑及运维配置按环境区分。公共审计字段在模型展示时按字段名展开为具体SQL类型，不以“公共字段”或`metadata`充当数据库类型。

建库后已按用户确认的最新模型应用 `migrations/001-contract-review-nullable.sql`：合同未审核时 `review_snapshot_json` 可为NULL，同步两列说明；使用ALTER，不删除或重建表。最新 `schema.sql` 已含该结果，新实例不需要重复执行此迁移。

首次创建独立实例使用 `node infra/local/setup-mysql.cjs`，**已有实例会拒绝覆盖**。`--resume-bootstrap` 仅用于本脚本中断后的空库恢复，遇到任何既有表即停止；不会DROP、TRUNCATE或重建旧数据。部分DDL失败需先调查，不可自动清库重试。

## 物理化选择

1. InnoDB、utf8mb4；所有字符串使用大小写敏感、NO PAD的 `utf8mb4_0900_bin`，确保业务号不被大小写/尾随空格悄然合并。所有既定PK/UK/IDX均落地；逻辑FK仅建查询索引，**没有物理外键**。字典两表保留模型规定的自然主键，其他id统一 `BIGINT UNSIGNED AUTO_INCREMENT`，不额外添加列。
2. 模型默认NOT NULL；显式NULL原样保留。尚未发生的到离港/回执/复核/签署/导出时间、未确定外部编号、根组织父号、按事件不适用金额等，使用生成器中的逐表 `nullable` 白名单；没有空日期、假回执号或默认0金额。其余必填值须应用显式提供；不靠任意默认状态掩盖遗漏。
3. 公共字段仅在模型出现时展开。UTC `DATETIME(3)`；创建默认 `UTC_TIMESTAMP(3)`。MySQL不支持手册示例中的 `ON UPDATE (UTC_TIMESTAMP(3))`，实际使用 `ON UPDATE CURRENT_TIMESTAMP(3)`，实例默认时区及普通应用新连接强制UTC，应用不得改会话时区。管理连接同样须保持UTC。
4. 金额 `DECIMAL(20,2)`，数量及比率保留原精度。不编造未定义状态码；只对模型绑定的已知码表建立CHECK，未定义码表仍需业务评审。顶层币种约束CNY；JSON内部结构、币种及十进制字符串由应用完整校验。
5. 已建立交易状态、合同范围/交易号、固定300元账单、正数流水/分录、分配余额上限、资金三桶迁移等CHECK。逐交易合同组合UK；公共协议 `trade_number=NULL`，不被该UK误伤。银行稳定指纹＋事件键、反向凭证号及幂等键UK按原模型落地。
6. 11张纯追加事实表有UPDATE/DELETE拒绝触发器；税务资料、关务办理请求另外冻结身份与业务内容并禁止删除，允许合法阶段投影更新。原业务账户未向新隔离库扩权。合同版本、凭证等仍需更新合法生命周期，不能整体当成不可更新表。管理员具有DDL能力，本机触发器不等同于防管理员篡改或独立审计保全。
7. 不把所有余额都限制为非负：会计科目正常方向由受控scope确定；可支付额、双人复核、银行未知锁额、借贷平衡、状态转换授权、文件确切版本、HMAC和跨表原子性仍须应用实现。MySQL持久化设置为 `innodb_flush_log_at_trx_commit=1`、`sync_binlog=1`；开启binlog不等于已有备份/恢复演练。

编号预留、文件恢复、操作确认和第三方签署任务是时序图中的应用基础设施，尚不是可运行后端；当前47表设计只在隔离测试物理化。S3、扫描和Docker部署及边界见 [`infra/local/README.md`](../../../infra/local/README.md)。

## 后续迁移建议（未执行）

在真实业务迁移前，先评估旧关务表头/税务资料历史可还原性；不得为缺失旧版捏造批准、官方回执或0金额。新增两张关务表，逐列添加税务与版本/事件载荷，再对既有范围去重冲突及码表映射作人工确认；保留旧事件键并补可信来源命名空间。冻结触发器启用前完成历史基线审查。新UK/非空列/CHECK只有存量通过回放后才能启用；需另行制定备份、并行核对与回滚方案，本轮不提供可直接执行业务库的迁移脚本。
