# 步骤一双主体MySQL设计样例

本目录是合成设计验证，不是服务实现；只重放供应商首次提交、付款方首次提交、供应商修改、付款方修改。没有运营先建空壳、邀请或物流公司独立提交。

新独立库`trade_step1_supplier_payer_46c455d0`；旧`trade_step1_demo_46c455d0`保留但业务语义已过时，禁止DROP/TRUNCATE或在旧库导入。本轮沿用权威实体五表74列，不新增预订单、资料状态或快照表。

## 本机隔离实例

MySQL安装路径`/opt/homebrew/opt/mysql@8.4/bin/`。独立数据目录`~/Library/ExportTradeStep1Demo/data`，只开本地socket`~/Library/ExportTradeStep1Demo/mysql.sock`、禁网络及MySQL X协议，不注册自启动；不影响已有PostgreSQL。

```sh
/opt/homebrew/opt/mysql@8.4/bin/mysqld --no-defaults \
  --datadir="$HOME/Library/ExportTradeStep1Demo/data" \
  --socket="$HOME/Library/ExportTradeStep1Demo/mysql.sock" \
  --pid-file="$HOME/Library/ExportTradeStep1Demo/mysql.pid" \
  --log-error="$HOME/Library/ExportTradeStep1Demo/mysql.log" \
  --skip-networking --mysqlx=0
```

该命令为阻塞服务；需由终端/进程工具托管，不在仓库放凭据。已有私有`client.cnf`及`fixture.key`权限0600、父目录0700，禁止输出其内容或写入Git。HMAC只用于可复现合成fixture，须在同一私有key下生成并验证。未配置本机私有实例的环境不能直接把README当全自动安装脚本。

## 生成、首次导入与检查

```sh
node doc/sql/step1/generate.cjs
node doc/sql/step1/generate.cjs --check
```

确认新库不存在后，**仅首次**使用私有client配置执行`CREATE DATABASE trade_step1_supplier_payer_46c455d0 CHARACTER SET utf8mb4 COLLATE utf8mb4_bin`，再按顺序导入`schema.sql`、`seed.sql`、`assertions.sql`。不要用`IF NOT EXISTS`隐藏已有内容；第二次导入应失败，而非覆盖。MySQL DDL不是可回滚事务；seed按四个独立短业务事务重放，无任意清空或upsert。

```sh
/opt/homebrew/opt/mysql@8.4/bin/mysql --defaults-file="$HOME/Library/ExportTradeStep1Demo/client.cnf" < doc/sql/step1/schema.sql
/opt/homebrew/opt/mysql@8.4/bin/mysql --defaults-file="$HOME/Library/ExportTradeStep1Demo/client.cnf" < doc/sql/step1/seed.sql
node doc/sql/step1/verify.cjs
```

最终数据：状态2、修订4、批准版0；1交易/6参与方/5事件/1材料包/0完整快照。首次供应商提交一个事务创建交易及5个其收集主体；付款方自己提交才新增角色4。角色2/5/6创建人是供应商，不是其本人提交。两个修改复用原参与方及原资源，事件只追加；本方受理返回最小资源元数据，GET才返回当前正文。

文件元数据对应仓库本地真实合成字节，不声称已远程上传或扫描。`identity_number_cipher`只有明确`DEMO-FIXTURE-NOT-ENCRYPTED`标记，不是生产加密。报价/资质/运输细节等缺项保留在待补清单，未造假证、批准、签署或银行事实。

`verify.cjs`先作本地字段校验，再使用真实MySQL验证五表/资料/事件/固定精度、四用例受理摘要，临时事务过程覆盖旧标签、缺标签、异文、原键回放优先于旧标签、资源重复创建、状态门禁及部分写入回滚（包括供应商首次创建不能留空壳）。临时过程执行完删除；不改历史业务数据。它是设计测试工具，不是后端生产实现，也未测试真实身份/S3/扫描或分布式并发。

## 单体签名、取号与自行恢复的验证边界

新设计见`doc/步骤一身份签名与可靠性设计.md`。只有一个应用、对内/对外两个接口受众；原五张核心表不变，编号计数/预留及文件任务属于待实现的中间件持久设施。seed先查展示锁序，但它要求空白目标库，是固定合成导入，不是可重入生产处理器。

```sh
node doc/sql/step1/verify-reliability.cjs
node doc/sql/step1/verify-reliability.cjs --mysql
```

首命令只用内存临时RSA/ECDSA密钥验证规范签名及方法/路径/主体/受众/请求键/标签/摘要篡改，重新签名不改变业务幂等载荷；不持久化密钥。`--mysql`另创建明确`test_s1_*_46c455d0`命名的两个测试表与一个过程（如已存在立即拒绝），实际验证并发同键唯一号、并发异键、异文不增号、计数/归属原子回滚、丢弃响应后原键恢复、溢出拒绝，finally仅删除本次创建对象。使用READ COMMITTED及固定计数行锁；不接触原演示记录。该过程是编号事务设计的参考执行，不是已部署取号API。

未部署SM2/真实CA/可信时间/签名设备或S3后台worker，不能把脚本通过当作它们已运行。文件自行重试、阶段/租约栅栏及故障告警是实现验收规范；无真实云环境不声称已经完成云故障恢复测试。所有公开签名JSON及HTTP头均显式无效占位，不是真实签署。

## Protocol Buffers验证

安装protoc与Python protobuf；HTTP注解依赖官方`googleapis-common-protos`，在隔离虚拟环境缺失后安装。运行该环境的：

```sh
python doc/sql/step1/validate-proto.py
```

编译两份协议、严格解析全部类型化JSON及HTTP/RPC正文、16条方法/路径/body/response_body映射与逐方法deadline、显式ReqMsg/RspMsg、两个接口受众、上传校验和/长度、可选机构签名封套，以及非OK `google.rpc.Status`内的`RpcFailure`。HTTP头/状态不由gRPC错误码代替；供应商无设备/自管密钥，使用实名确认与操作证据，不把HTTPS当合同签名。完整超时/重试预算和错误恢复见独立接口规范；全部RESPONSE/cURL见`doc/examples/step1/http-reference.md`。步骤二的另外20个方法及跨三协议编译见`doc/sql/step2/validate-proto.py`，本轮不重导数据库。

## 结束验证

```sh
/opt/homebrew/opt/mysql@8.4/bin/mysqladmin --defaults-file="$HOME/Library/ExportTradeStep1Demo/client.cnf" shutdown
```

确认进程退出及socket移除，数据目录/新旧演示库保留。无需留驻服务；不要停止或修改其他数据库实例。
