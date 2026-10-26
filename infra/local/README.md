# 本机开发基础设施

面向方案评审与验证的组件清单、业务环节映射及验收入口见 [`doc/方案验证中间件环境说明.md`](../../doc/方案验证中间件环境说明.md)；本文件侧重部署与运行操作。

步骤一、二使用`verify-step-flows.py`，步骤三至八使用对应的`verify-step-*.py`。验证器只创建独立随机测试库，不能作为生产后端、签署证据或银行、海关、税务办理成功的证明。运行入口及副作用见[环境操作说明](../../doc/方案验证中间件环境说明.md)。

最新领域设计为47表/702列，见[领域DDL使用指南](../../doc/sql/domain/README.md)；原`export_trade`保持45表/666列，未迁移。校验脚本的结果输出到终端，集成验证需用`--output`显式指定JSON路径，建议放在仓库外的临时目录；不自动生成交付目录中的过程报告。

Docker CLI＋Compose＋Colima（Apple Virtualization，2核/4GB/30GB磁盘）承载RustFS、ClamAV及监控/日志/调度组件；业务MySQL复用本机8.4安装，以独立实例运行。无Docker Desktop、Redis、消息队列或分布式取号器；现有时序图明确采用单体＋MySQL事务＋进程内恢复模块。新部署的XXL-JOB是独立调度控制台，尚未替代或接管这些业务恢复模块。

| 组件 | 本机入口 | 用途 |
|---|---|---|
| MySQL | `127.0.0.1:3307` / `export_trade` | 45张领域空表，666列 |
| RustFS S3 | `http://127.0.0.1:9000` | 私有对象存储，region `us-east-1`，path-style |
| RustFS控制台 | `http://127.0.0.1:9001` | 本机管理 |
| ClamAV | `127.0.0.1:3310` | `INSTREAM`扫描实际字节，不是HTTP接口 |
| Prometheus | `http://127.0.0.1:9090` | 指标查询及告警规则 |
| Alertmanager | `http://127.0.0.1:9093` | 告警查看、分组及静默 |
| Grafana | `http://127.0.0.1:3000` | 已配置Prometheus/Loki/Alertmanager数据源 |
| Loki | `http://127.0.0.1:3100` | 日志查询API，Grafana Explore可查询 |
| Alloy | `http://127.0.0.1:12345` | 容器日志采集器状态 |
| XXL-JOB | `http://127.0.0.1:8080/xxl-job-admin/` | 任务调度管理后台 |

所有发布端口仅监听IPv4 loopback。S3当前使用本机HTTP，**不得直接对外开放**；上线需TLS、鉴权、访问隔离及完整安全运维。Docker socket仅本机Unix socket。拥有本机账户或Docker访问权的管理员可读容器环境，不能据此宣称管理员隔离或密钥托管合规。

## 凭据与持久化

私有目录 `~/Library/ExportTradeLocal/`（0700），密钥文件0600；不在仓库、命令参数或回答中打印密钥：

- `client.cnf`：MySQL应用连接；`root-client.cnf`：管理连接。
- `rustfs.env`：RustFS管理员账号/密钥，用于控制台及初始化，**不能下发前端或作应用账号**。
- `s3-client.json`：受限应用密钥、endpoint、region及桶名；无管理权限，不能删除最终文件/证据，也不能绕过保留锁。
- `s3-venv/`：本机S3初始化/验收使用的Python环境，不是应用服务。
- `observability-credentials.json`：Grafana、XXL-JOB各自随机管理员密码、调度access token及独立调度数据库凭据；两管理后台用户名均为 `admin`，不使用官方默认密码。
- `grafana.env`、`xxl-job.env`、`scheduler-db.env`、`xxl-init/`：初始化与容器运行私有配置；调度SQL不含官方示例任务或示例API密钥。重建容器保留旧凭据，不自动覆盖数据库中已更换的密码。

RustFS和ClamAV分别使用Docker命名卷 `export-trade-local_s3-data`、`export-trade-local_antivirus-signatures`。重启/重建容器保留；**不要执行 `down -v`、volume prune或删除Colima VM**。MySQL数据位于私有目录 `mysql-data/`。命名卷和本机单盘都不是备份或高可用部署。

监控扩展另有 `prometheus-data`、`alertmanager-data`、`grafana-data`、`loki-data`、`alloy-data`、`scheduler-db-data`、`xxl-job-logs` 命名卷（均加 `export-trade-local_` 前缀）。其中调度器使用**容器内独立MySQL 8.4**、私有网络和单库账号，不发布数据库端口、不连接或改动业务 `export_trade` 的45张表。这样无需放宽原有业务MySQL的127.0.0.1监听限制。

RustFS镜像固定1.0.3对应digest，ClamAV镜像也固定digest，见 `compose.yaml`；病毒库由freshclam持续更新并持久保存。ClamAV官方该镜像仅amd64，Apple Silicon上通过Colima模拟运行。替换镜像需审核后更新digest，不自动追随latest。

## S3桶及文件约束

- `export-trade-staging`：暂存上传，开启版本管理；受限应用可清理暂存版本。
- `export-trade-files`：正式文件；版本管理＋Object Lock能力开启。
- `export-trade-evidence`：签署件、操作确认、平台回执等证据；版本管理＋Object Lock能力开启。

三桶均无匿名授权；正式文件/证据应用账户禁止删除版本、管理桶或绕过治理保留。**开启Object Lock不代表每个对象已被留存锁定**：本机未擅自设定法定保留期，实际写入须按批准策略设置对象保留模式/期限。当前验收覆盖GOVERNANCE锁及拒绝删除；管理员可显式绕过治理锁，不等同于生产COMPLIANCE保全或第三方存证。

应用必须：稳定对象键、`If-None-Match: *`条件写、防止同键覆盖；记录返回的真实VersionId、长度和SHA-256，按确切版本读取；先真实扫描再转正式对象；元数据提交成功后才允许业务引用；不能用“最新版本”、路径或健康检查替代这些条件。未配置浏览器CORS（没有擅自允许任意来源），前端来源确定后另行限制配置。

ClamAV使用25MiB流/单文件上限、100MiB解压扫描上限、16层递归、10000文件上限，`AlertExceedsMax yes`。超限、超时、病毒库过旧、未知结果或服务不可用必须拒绝确认，不能当作干净文件；应用需按协议实现超时和错误映射。检测通过也不是合同真实性、电子签名或文件解析安全的证明。

## 启动、检查与停止

```sh
# 新机器安装；本机已安装
brew install docker docker-compose colima
# 若 docker compose 尚未被发现，且下列目标不存在：
mkdir -p "$HOME/.docker/cli-plugins"
ln -s /opt/homebrew/opt/docker-compose/bin/docker-compose "$HOME/.docker/cli-plugins/docker-compose"
colima start --vm-type vz --cpu 2 --memory 4 --disk 30 --runtime docker
brew services start colima

# 以下从仓库根目录执行；仅首次在新私有目录初始化MySQL
node doc/sql/domain/generate.cjs
node infra/local/setup-mysql.cjs
node infra/local/setup-containers.cjs

# 完整监控/日志/调度扩展；首次下载校验过的官方XXL-JOB 3.3.1建表脚本
node infra/local/setup-observability.cjs

# Python缺少boto3时，安装到私有虚拟环境
python3 -m venv "$HOME/Library/ExportTradeLocal/s3-venv"
"$HOME/Library/ExportTradeLocal/s3-venv/bin/pip" install 'boto3>=1.40,<2'
"$HOME/Library/ExportTradeLocal/s3-venv/bin/python" infra/local/s3.py init

# 可重复检查；只对已存在的47表空白隔离库检查，写入全部回滚
node doc/sql/domain/verify.cjs --database verify_domain_2da75afc88bf
"$HOME/Library/ExportTradeLocal/s3-venv/bin/python" infra/local/s3.py verify
python3 infra/local/verify-antivirus.py
python3 infra/local/verify-observability.py
docker --context colima ps
curl --fail http://127.0.0.1:9000/health
```

`setup-containers.cjs` 保留既有管理员凭据及卷，等待服务健康；`s3.py init` 保留既有受限密钥，不盲目轮换。S3验收仅创建随机 `_infra-check/` 测试对象并按确切版本清理，不触碰业务对象；治理锁清理仅限这次测试版本、由管理员显式绕过。

MySQL与Colima均注册为当前用户LaunchAgent，**登录后自启，不保证无人登录即启动**；容器 `restart: unless-stopped` 随Docker恢复。若先手动启动Colima再启用Homebrew服务，服务可能显示stopped（已有VM未受该前台服务托管），下次登录仍会按注册启动；运行检查以Docker响应、LaunchAgent和实际监听为准。

临时停容器（保留卷）：

```sh
LOCAL_INFRA_DIR="$HOME/Library/ExportTradeLocal" \
  /opt/homebrew/opt/docker-compose/bin/docker-compose --context colima -f infra/local/compose.yaml stop
```

显式stop的容器不会自动恢复，需重新运行 `setup-containers.cjs`。禁用登录自启用 `brew services stop colima`；这可能停止该VM内所有服务。MySQL可用 `launchctl bootout "gui/$(id -u)/com.export-trade.mysql"` 停止当前注册实例；保留plist会在后续登录加载，不要误停其他数据库。

## 监控、日志和调度操作

完整栈由基础 `compose.yaml` 与 `observability/compose.yaml` 合并，执行 `setup-observability.cjs` 启动/恢复全部组件并等待健康。只执行基础 `setup-containers.cjs` 不会启动已停止的扩展组件。扩展同样使用 `restart: unless-stopped`，随已注册的Colima登录启动恢复。

Prometheus采集自身、Alertmanager、Grafana、Loki、Alloy及Blackbox六个指标目标；Blackbox另探测RustFS健康、XXL-JOB登录页、ClamAV端口及调度数据库端口，共10个抓取目标。HTTP/TCP探测不等同于扫描、任务执行、数据库事务或业务成功。**本次未部署业务MySQL exporter、macOS主机监控、业务指标或分布式追踪**，不宣称已监控未实现的业务后端。

指标保留15天/最多2GB（先达到者生效）；Loki日志保留7天，使用独立文件卷而非法律证据桶。容器stdout/stderr均有10MB×3轮转。Alloy只发现当前Compose项目容器，附 `service`、`container`、`environment` 标签，并以持久卷保存采集位置；不读取业务文件或macOS系统日志。日志搜索示例：

```logql
{environment="local",service="xxl-job"}
{environment="local",service="antivirus"} |= "ERROR"
```

Grafana登录后在 **Explore** 切换Prometheus/Loki即可查询；PromQL可用 `up`、`probe_success`，没有伪造业务指标或预设金融看板。已接通Alertmanager数据源，但当前规则仅在Prometheus评估并发送Alertmanager；Grafana自建告警规则不是本次配置。

三条规则覆盖抓取失败、基础服务探测失败、日志投递丢弃。告警进入Alertmanager本机UI；**尚未配置邮件、短信、企业微信或Webhook，也不宣称已外部通知**。外部通知需要另提供真实渠道。`verify-observability.py` 会产生并立即解除一次 `LocalInfrastructureSelfTest` 告警；日志验收用短命容器写入无敏感性的合成行，验证Docker→Alloy→Loki及脱敏后删除测试容器，测试日志按7天策略保留。

Alloy通过隔离内部网络的Docker socket代理采集日志，不直接挂载socket；代理关闭POST且不发布端口，但允许的只读容器检查API仍可暴露环境变量等管理数据，**不等同于无权限访问**。仅信任本机管理员，不将采集器交给非可信租户。日志字段脱敏是辅助，不保证能识别所有格式/个人信息；应用必须从源头禁止输出密钥、完整身份/账号和合同正文。

XXL-JOB 3.3.1后台通过官方版本DDL初始化，校验SHA-256；只保留调度锁和随机密码管理员，**无示例任务、无注册执行器、无启用任务**。登录后可管理执行器与任务，但在注册真实Java执行器/handler之前不能执行应用任务；access token与执行器须保持一致。当前不挂载Docker socket、不提供任意主机命令执行器、不创建付款/签约/退款等任务。后续接入必须保留应用内授权、原业务键幂等、未知结果恢复和资金门禁，不能用“调度成功”替代业务成功。

调度后台为amd64镜像，在Apple Silicon模拟运行；调度MySQL原生arm64。全部扩展镜像固定digest。Colima当前4GB是本机开发配置，任务量/日志量增加需先检查 `docker --context colima stats --no-stream` 与VM磁盘；不能视为生产容量规划。调度日志7天，不替代领域审计或法定留存。

手动查看或停止扩展（不删除卷）：

```sh
LOCAL_INFRA_DIR="$HOME/Library/ExportTradeLocal" docker --context colima compose \
  -f infra/local/compose.yaml -f infra/local/observability/compose.yaml ps
LOCAL_INFRA_DIR="$HOME/Library/ExportTradeLocal" docker --context colima compose \
  -f infra/local/compose.yaml -f infra/local/observability/compose.yaml \
  stop prometheus alertmanager grafana loki alloy blackbox docker-log-proxy xxl-job scheduler-db
```

## 时序图覆盖边界

已准备的是MySQL、S3及字节扫描依赖，不是完整业务系统。取号、确认消费、恢复任务/租约/栅栏、平台受理签名、电子签任务/回调、合同激活仍是**待实现的单体模块**；没有伪造worker、幂等服务或额外微服务来声称流程已跑通。45领域表不包含这些尚未完整物理设计的基础设施表，后续实现需单独迁移并验证。

实名/MFA、第三方电子签、证书/可信时间、银行/海关、生产HSM/KMS均需真实选型、授权及接入，本次不生成假证书、不内置平台私钥、不以本地HMAC代替法律签署。依据：[`步骤一身份签名与可靠性设计`](../../doc/步骤一身份签名与可靠性设计.md)及 `doc/examples/step1`、`step2` 实现时序图。数据库物理化详见 [`doc/sql/domain/README.md`](../../doc/sql/domain/README.md)。
