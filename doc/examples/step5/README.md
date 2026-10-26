# 步骤五逐项双图及类型化示例

- N11 核实银行来款并查看未匹配金额：[黑盒](s5-n11-receipt-system.mmd) / [实现](s5-n11-receipt-implementation.mmd)
- N12 来款分配、复核与超额防护：[黑盒](s5-n12-allocation-system.mmd) / [实现](s5-n12-allocation-implementation.mmd)
- N13 提交或补正商业发票申报：[黑盒](s5-n13-invoice-fee-system.mmd) / [实现](s5-n13-invoice-fee-implementation.mmd)
- N14 核验贸易资料并释放银行已确认可用的货款：[黑盒](s5-n14-verification-release-system.mmd) / [实现](s5-n14-verification-release-implementation.mmd)
- N15 试算并审批预付款或出口后付款的结算单：[黑盒](s5-n15-settlement-system.mmd) / [实现](s5-n15-settlement-implementation.mmd)
- N16 审批付款、锁定金额并确认供应商到账：[黑盒](s5-n16-payment-system.mmd) / [实现](s5-n16-payment-implementation.mmd)
- N17 处理资金差异并由独立人员复核：[黑盒](s5-n17-reconciliation-system.mmd) / [实现](s5-n17-reconciliation-implementation.mmd)

全部24端点见http-contract.json、http-examples.json、rpc-examples.json。13项缺资源/证据失败不伪造成功resource；其余是内部合成投影或受理而非银行成功。
