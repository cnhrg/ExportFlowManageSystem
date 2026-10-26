# 步骤四生成与隔离验证

- `generate.cjs`仅生成步骤四离线协议/实体映射/20张图及资源包；`--check`检查确定性。复用`../transport-examples.cjs`。
- `customs_guards.py`为本步小型守卫，同时用于`verify.py`和真实隔离驱动；不是生产handler。
- `validate-proto.py`实际编译Proto、强类型往返19组HTTP/RPC、3个错误资源及6个动作阻断分支，共检查25份cURL。仅在本目录写唯一描述符文件，完成即删。
- `assertions.sql`只读检查本步成功运行后的随机验证库；**不在export_trade或旧库执行**。
- 唯一DDL为`../domain/schema.sql`，不维护第二份手写schema；`infra/local/verify-step-four.py`复制11张当前表及完整触发器（包含`DELIMITER $$`复合块，不能按分号误切）。

```sh
node doc/sql/step4/generate.cjs
node doc/sql/step4/generate.cjs --check
python doc/sql/step4/verify.py
python doc/sql/step4/validate-proto.py
python infra/local/verify-step-four.py --output /tmp/export-trade-step-four-result.json
```

Python使用已安装私有proto或s3验证venv；不修改依赖和共享配置。随机`verify_customs_*`库保留，原创材料只清本run确切VersionId。文件中断恢复由手动过期租约及新进程驱动，不宣称自动调度。全部官方提交/放行/撤回及正式附件2交接成功均未验证；静态交付响应仅形状例，带`externalSuccessStatus=UNVERIFIED`，不能作为通过前置。

最终规约：[系统用例与接口协议](../../步骤四系统用例与接口协议.md)。验证结果只写入`--output`显式指定的JSON路径，不自动生成交付目录中的过程报告。
