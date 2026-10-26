'use strict';
(function (root) {
  const definitions = {
  "FE-01": {
    "rationale": "现有导航和任务模型可复用，生产登录、接口状态和错误页仍须新增。",
    "steps": [
      {
        "personDays": 1,
        "action": "配置现成列表、详情、表单及加载、空结果、拒绝访问组件，按交易号和本方资料号建立路由及返回位置。",
        "logic": "中国供应商、付款方仅进入服务端授权的本方入口。详情分别消费GET /api/v1/trades/{trade_number}及本方supplier-filing或payer-filings/{payer_filing_id}；内部运营只消费GET /internal/v1/trades/{trade_number}/filing-overview。任务列表和登录路径待DES-1、SEC-01冻结，不从演示数据猜接口。路由参数不能作为授权依据；加载失败保留返回位置，404不显示他方对象是否存在。",
        "expected": "列表进入详情和表单后始终显示同一交易及本方资料；内部页面没有代建单、代填或审批入口。空结果、加载中和不可见对象有不同提示，不以空白页代替失败。",
        "test": "准备两个互不可见的合成交易和中国供应商、付款方、内部运营三个账号；从允许列表进入详情、表单并返回，核对交易号及原筛选位置。手改地址访问另一交易，断言显示不可见且不渲染其资料；内部概览无双方声明正文。"
      },
      {
        "personDays": 2,
        "action": "接入自建登录会话及两受众请求封装，统一处理登录失效、字段错误和结果未知，并取消失效页面的后续敏感请求。",
        "logic": "SEC-01提供身份、当前组织、受众和到期撤销结果。401停止自动读取和提交，提示重新认证；403不通过切换前端角色绕过，404不猜号。使用no-store，不把长期令牌、原始证件或签名URL放localStorage。请求封装保留HttpProblem.errors.pointer/code、outcomeUnknown和retryAfterMs；业务恢复交原表单处理，不由全局拦截器换键重发。Cookie模式按冻结的CSRF及Origin契约接入。",
        "expected": "失效后页面不会继续轮询、提交或展示新敏感响应；重新登录后按当前权限重新GET。网络错误与业务明确拒绝可区分，未知不显示已失败或已完成。",
        "test": "登录后打开本方详情，在请求未返回时撤销会话，再触发提交和返回列表；断言后续敏感请求停止，迟到响应不重新填入旧账号页面。重新登录为另一方只显示其资料。分别注入401、403、404和503 outcomeUnknown，核对重新认证、权限拒绝、不可见和原请求恢复提示，确认无透明新键写入。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "FE-01",
      "status": "细化",
      "summary": "保留基础组件、路由和会话两项工作，限定共用支撑为步骤一四个用例。补充本方资源读取、内部只读概览、未认证和不可见对象的页面反馈；不恢复已删除的30任务页核对或专项交互核对。登录及任务列表尚无已发布接口，列为交接待冻结项。",
      "sourceReferences": [
        {
          "path": "交付成果/assets/process-data.js",
          "lineStart": 4,
          "lineEnd": 4,
          "reason": "交易建档仅对应N01",
          "sha256": "37910ef0ab58d2c553203a8e6cf0278cd6b43ae06fd9d5fec5eb7c2caaf78f20"
        },
        {
          "path": "doc/步骤一HTTP接口协议.md",
          "lineStart": 5,
          "lineEnd": 41,
          "reason": "双方本方资源、内部最小只读概览、授权及强标签",
          "sha256": "3783a1197e2c7dbbfb42b5fb1a18d9d71c5db69c2aab257fdbe1b7d912b8d1c3"
        },
        {
          "path": "doc/步骤一HTTP接口协议.md",
          "lineStart": 164,
          "lineEnd": 170,
          "reason": "实名会话、确认意图、Cookie及本地存储限制",
          "sha256": "3783a1197e2c7dbbfb42b5fb1a18d9d71c5db69c2aab257fdbe1b7d912b8d1c3"
        },
        {
          "path": "doc/examples/step1/http-examples.json",
          "lineStart": 572,
          "lineEnd": 600,
          "reason": "本人预留GET的资源表示，与离线角色切换无关",
          "sha256": "406ea54c7af45a02bb25d7847141c556b3e6aff7e41cf4156349d9322044bcde"
        }
      ],
      "useCaseIds": [
        "supplier-submit",
        "payer-submit",
        "supplier-edit",
        "payer-edit"
      ],
      "nodeIds": [
        "N01"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "一期角色入口、交易号及资料号路由、基础组件选择、加载和错误展示规则",
          "contract": "doc/步骤一HTTP接口协议.md；任务列表查询、登录跳转及返回位置参数待DES-1冻结",
          "test": "逐个路由用本方、他方及内部账号核对目标资源；未冻结入口明确禁用，不连离线存储充数"
        },
        {
          "dependencyId": "SEC-01",
          "consumes": "自建账号会话、内部外部受众、到期撤销、重新认证及Cookie/CSRF配置",
          "contract": "doc/步骤一HTTP接口协议.md §9；登录、登出、会话查询的实际路径和响应待安全开发工程师冻结",
          "test": "交接时使会话到期及主动撤销各一次，验证401后停止请求、跨受众拒绝且日志不含令牌"
        }
      ],
      "integrationScenarios": [
        {
          "name": "旧账号请求迟到与撤权后的路由恢复",
          "setup": "隔离接口环境，中国供应商账号可见交易甲，付款方账号只可见交易乙；人为延迟交易甲详情响应",
          "steps": [
            "中国供应商打开交易甲详情后撤销会话",
            "切换登录付款方，访问交易乙并释放交易甲的迟到响应",
            "手动输入交易甲路径并返回列表"
          ],
          "assertions": [
            "迟到响应不能写入付款方页面",
            "交易甲返回不可见，未泄露其声明或存在性",
            "列表恢复付款方自己的位置，未触发自动提交"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "真实登录、会话查询、登出、任务列表和分页协议尚未在步骤一资源表定义。建议DES-1与SEC-01交接时冻结路径、受众、CSRF、错误及返回路由，不创建猜测接口。",
          "owner": "产品架构负责人、安全开发工程师",
          "impact": "阻断真实登录和列表联调；不阻断已有详情资源的组件与路由实现。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "frontend",
      "before": {
        "personDays": 1.5,
        "baselinePersonDays": 3,
        "subtaskCount": 2,
        "dependencies": [
          "DES-1",
          "SEC-01"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit",
            "supplier-edit",
            "payer-edit"
          ],
          "nodeIds": [
            "N01"
          ]
        },
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit",
            "supplier-edit",
            "payer-edit"
          ],
          "nodeIds": [
            "N01"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "FE-01-S1",
          "previousAction": "确定成熟基础组件及路由。",
          "currentIds": [
            "FE-01-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FE-01-S2",
          "previousAction": "搭建生产页面壳、登录会话接入、列表详情与统一加载错误态。",
          "currentIds": [
            "FE-01-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "FE-02": {
    "rationale": "已有首次提交、修订及精度规则，新增真实接口绑定和多商品行，不重复产品设计。",
    "steps": [
      {
        "personDays": 2,
        "action": "实现中国供应商和付款方各自的首次及修订表单，供应商支持多商品行和三单确切引用，付款方单独填写付款关系、原因及证明。",
        "logic": "供应商输入本方、实际收货人、送货安排、商品、包装、三单及已收集服务主体资料；后续资质报价未齐显式待补。付款方只能写本方声明，同法定主体依据由服务端核实，不同主体关系证明必填。商品序号1至65535；CNY金额两位、数量最多六位、重量最多三位，按定点HALF_UP核算而不用二进制浮点。GET本方资料预填，保留用户尚未提交的输入供人工比较；不得把供应商拟付款引用当付款方授权。",
        "expected": "两方表单字段和材料用途各自独立；多行合计精确，USD和超精度不能被悄悄转换。普通提交仍显示编辑中、未批准，后续待补项不会被显示为整单完成。",
        "test": "用独立CNY合成资料录入100 PCS乘125.00等于12500.00，再增加及删除一行并核对合计；输入USD、指数金额和超精度数量，断言显示对应字段错误。分别使用同主体和不同主体付款方，缺关系证明时应拒绝。切换账号检查请求及页面均不含他方私有声明。"
      },
      {
        "personDays": 3,
        "action": "连接预留、首次创建和原地址替换接口，提交前显示确切内容并申请绑定本次意图的确认，保存原请求恢复信息。",
        "logic": "POST /api/v1/trade-number-reservations使用purpose=supplier-trade-filing；只有供应商POST /api/v1/trades才建交易，业务键固定原tradeNumber。付款方POST /api/v1/trades/{trade_number}/payer-filings，修订分别PUT supplier-filing及payer-filings/{payer_filing_id}，PUT前GET取得单一强If-Match。业务正文不加RPC包装，不自报actor或状态。操作确认的键与业务键分开，确认绑定方法、路径、原键、原标签、正文摘要。201或回放200只表示原受理，随后GET本方内容；未提交草稿不伪装为已保存到服务端。",
        "expected": "取号不产生空交易，首次提交成功只创建一笔；付款资料已存在提示GET后修改原资源。超时、503 COMMIT_OUTCOME_UNKNOWN沿原键原文原标签恢复；RECEIPT_NOT_READY显示已受理、回执待恢复，不再次建单。",
        "test": "丢弃取号响应后以原键重试，断言返回原号且没有交易；首次提交丢弃响应后恢复，断言同一交易、修订及原Location。再用新键首次POST付款资料应409，不生成第二份。模拟RECEIPT_NOT_READY及确认过期，分别核对原受理恢复和重新确认路径；修改正文不得沿用旧业务键或确认。"
      },
      {
        "personDays": 2,
        "action": "完成跨标签页、跨方修改、关系依赖冲突和退回重开后的前端联调，区分恢复原命令与提交新意图。",
        "logic": "412先保留本地输入、GET本方最新资料，展示差异由本人合并后新键、新标签、新确认提交；另一方修订也会推进交易聚合修订。428先读标签，409 DEPENDENT_FILING_CONFLICT停止直接变更实际收货人或拟付款关系，转专门更正。送审或批准后TRADE_NOT_EDITABLE不能绕过；退回状态3须由后续内部POST revisions重开到2才允许本方修订。未知旧命令应先恢复，不能用当前GET声称原命令已成功。",
        "expected": "冲突和失败均不清空当前输入，不自动覆盖最新资料或付款方声明；退回意见与当前编辑权限可见，重开前无可提交入口。原受理修订和当前修订分别标记。",
        "test": "两个标签页读同一供应商ETag，由付款方先修改，再在旧页PUT，断言412且旧输入仍可比较。付款方已声明后供应商更换实际收货主体，应409且原双方声明不变。将交易置待审及退回，分别尝试PUT，再由内部重开回2后修订，核对无越状态提交或额外交易。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "FE-02",
      "status": "细化",
      "summary": "将四个建档用例落实到本方完整表单、预留及首次原子创建、PUT修订和原请求恢复。纠正原说明中笼统的保存、退回及重试：协议没有草稿保存接口，退回重开由后续签约依据流程负责；跨方变更也会使旧ETag失效。",
      "sourceReferences": [
        {
          "path": "doc/步骤一系统用例与业务规则.md",
          "lineStart": 9,
          "lineEnd": 18,
          "reason": "四个用例、一方一份资料、首次提交才建交易",
          "sha256": "b9e8d335113a7a9fec4573429c5d06733a7b797ce9cdd617f3189df8708cc147"
        },
        {
          "path": "doc/步骤一HTTP接口协议.md",
          "lineStart": 11,
          "lineEnd": 65,
          "reason": "真实资源路径、最小受理、强ETag、确认及未知重入规则",
          "sha256": "3783a1197e2c7dbbfb42b5fb1a18d9d71c5db69c2aab257fdbe1b7d912b8d1c3"
        },
        {
          "path": "doc/步骤一HTTP接口协议.md",
          "lineStart": 79,
          "lineEnd": 103,
          "reason": "双方输入、关系证明、CNY精度及关系更改冲突",
          "sha256": "3783a1197e2c7dbbfb42b5fb1a18d9d71c5db69c2aab257fdbe1b7d912b8d1c3"
        },
        {
          "path": "doc/examples/step1/http-examples.json",
          "lineStart": 2,
          "lineEnd": 38,
          "reason": "取号预留purpose、返回原交易号及Location",
          "sha256": "406ea54c7af45a02bb25d7847141c556b3e6aff7e41cf4156349d9322044bcde"
        },
        {
          "path": "doc/步骤二系统用例与接口协议.md",
          "lineStart": 143,
          "lineEnd": 151,
          "reason": "退回3先经内部重开回2，不能让外部表单直接修改待审状态",
          "sha256": "309fb3369cd0cde8dcda7f2b1878fd1cb1518505439e5d38b418ce419fd98102"
        }
      ],
      "useCaseIds": [
        "supplier-submit",
        "payer-submit",
        "supplier-edit",
        "payer-edit"
      ],
      "nodeIds": [
        "N01"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "本方字段、精度、待补清单、草稿保留及关系更正边界",
          "contract": "doc/步骤一系统用例与业务规则.md；doc/步骤一HTTP接口协议.md §5",
          "test": "核对四用例表单字段，不存在运营建单、邀请六方填报或草稿保存假接口"
        },
        {
          "dependencyId": "FE-01",
          "consumes": "会话、交易路由、字段错误定位及失效后停止请求的封装",
          "contract": "doc/步骤一HTTP接口协议.md §6、§9",
          "test": "提交中401后保留当前输入且不重复写；错误pointer能定位商品行或If-Match"
        },
        {
          "dependencyId": "BL-01",
          "consumes": "预留、双方首次及PUT、完整本方GET、强ETag、最小受理、确认与同号恢复",
          "contract": "doc/examples/step1/http-contract.json；doc/examples/step1/http-examples.json",
          "test": "同号重入只一交易，跨方变更使旧标签412，PUT不创建资料且回放保留原受理版本"
        }
      ],
      "integrationScenarios": [
        {
          "name": "跨方串行化与不变正文的原受理恢复",
          "setup": "中国供应商和付款方各有有效账号；同一合成交易处于编辑中，两个供应商标签页均读取修订2",
          "steps": [
            "付款方修改付款原因推进修订",
            "供应商旧页保留输入并PUT，收到412后人工合并",
            "以新键及新标签提交，丢弃响应，再原文重放",
            "读取双方当前资料与受理元数据"
          ],
          "assertions": [
            "旧页没有自动覆盖付款方修改",
            "新请求只推进一次修订，回放返回原受理修订而非最新GET正文",
            "两方私有字段不串页，首次交易号不变"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "原说明中的保存不是已定义的服务端草稿接口。建议DES-1明确未提交输入的保留位置及敏感字段限制，不能把localStorage草稿显示为平台受理。",
          "owner": "产品架构负责人、安全开发工程师",
          "impact": "阻断跨会话草稿持久化方案；不阻断已定义的首次及修订提交。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "frontend",
      "before": {
        "personDays": 3.5,
        "baselinePersonDays": 7,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "FE-01",
          "BL-01"
        ]
      },
      "review": "对照步骤一四用例和事务顺序，核对预留不建交易、首次供应商提交原子建单、付款方私有声明不覆盖、跨方修订导致旧标签冲突及输入保留。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit",
            "supplier-edit",
            "payer-edit"
          ],
          "nodeIds": [
            "N01"
          ]
        },
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit",
            "supplier-edit",
            "payer-edit"
          ],
          "nodeIds": [
            "N01"
          ]
        },
        {
          "useCaseIds": [
            "supplier-edit",
            "payer-edit",
            "payer-submit",
            "supplier-submit"
          ],
          "nodeIds": [
            "N01"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "FE-02-S1",
          "previousAction": "让中国供应商和付款方分别填写本方资料；修改时带回原内容，并支持增加、删除多条商品明细。",
          "currentIds": [
            "FE-02-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FE-02-S2",
          "previousAction": "接入预留交易编号、保存和提交接口；提交冲突或失败时保留当前输入，提示用户重新核对版本。",
          "currentIds": [
            "FE-02-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FE-02-S3",
          "previousAction": "演练同号恢复、跨页冲突、退回修订及双方私有字段。",
          "currentIds": [
            "FE-02-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "FE-03": {
    "rationale": "已有文件引用展示；本次计真实字节上传、扫描和确切版本查看。",
    "steps": [
      {
        "personDays": 2,
        "action": "实现按文件用途和业务归属准备上传、计算实际字节摘要、直传进度及失败重试的控件。",
        "logic": "中国供应商、付款方及各阶段有权经办人选择材料；POST /api/v1/file-uploads提供类型、长度、SHA256和reservationId、tradeNumber、organizationReference之一。未建交易仅本人预留；公共合同草稿仅有权机构归属。按返回signedUpload.method、requiredHeaders和到期时刻PUT真实字节，单次60秒、最多三次有界重试；过期由GET /api/v1/file-uploads/{upload_id}重新授权，不新建业务归属。网络失败保留表单及文件选择，不保存能力URL到持久草稿或日志。",
        "expected": "进度来自真实传输，100%只表示字节传完；上传号与业务对象、用途可追溯。超限、摘要不符和授权错误明确失败，不把手写文件引用当成功上传。",
        "test": "用原创合成文件校验实际长度及SHA256，传输一半断网后恢复，断言尝试有上限且业务草稿不丢。令上传URL过期后GET原上传资源，断言归属和uploadId不变；换无权账号刷新授权应拒绝。输入超过服务端限额的文件，应显示限额来源与失败原因而非清空表单。"
      },
      {
        "personDays": 2,
        "action": "显示扫描及持久恢复任务状态，连接文件确认、确切版元数据和重新鉴权的原件查看入口。",
        "logic": "GET原上传资源展示awaiting_upload、processing、retry_wait、ready、rejected、manual_action及attemptCount、nextAttemptAt、lastErrorCode。FILE_NOT_READY至少两秒轮询，单轮两分钟后停止自动刷新并说明后台仍恢复；离页停止本页轮询不取消后台任务。POST /api/v1/file-uploads/{upload_id}/files须原键及意图确认，409未就绪继续查原任务，422恶意或摘要长度不符停止。引用固定logicalFileNumber、revisionNumber、sha256、purpose；GET /api/v1/files/{file_number}/revisions/{revision_number}核对元数据。原件查看必须由BL-03补齐实时授权下载契约后接入，不从storage_path或本地路径拼URL。",
        "expected": "只有referenceEligible的确切版能供业务引用，扫描通过不显示为审核、签署或官方验真。浏览器离开后后台任务不丢；达到manual_action有明确人工处理提示。权限撤销后不再获取新下载能力。",
        "test": "分别返回processing、retry_wait、rejected和manual_action，检查状态、下一次时间及按钮。持续FILE_NOT_READY超过两分钟，应停自动轮询且提示原任务仍在。确认成功后改选同名不同字节新文件，断言旧业务引用仍指旧版；撤权后再次打开原件应拒绝，不泄露存储路径。"
      },
      {
        "personDays": 1,
        "action": "联调超限、扫描未知、确认响应丢失及历史材料越权，核对引用不被新文件替换。",
        "logic": "错误定位到具体材料行；文件确认结果未知沿原uploadId、原键、原文恢复，同上传最多生成一个确认文件，不能另键重复确认。业务提交失败不删已完成文件或重绑latest。对后续用途18至25和预留、交易、机构三种归属采用同一控件的已冻结配置，不硬编码仅支持三单。",
        "expected": "重试不生成重复文件，历史材料的号、版、摘要不变。扫描未知、用途不符和无权文件都不能通过引用；失败后的商品及材料选择仍在。",
        "test": "确认请求提交后丢弃响应，再原键恢复并尝试新键确认同一上传，核对稳定文件号。将用途3装箱单选入用途19书面确认位，应被拒绝；加入同名新文件后打开历史业务，核对仍请求原号原版。无权账号及超限文件失败后检查原商品行和材料行未被清空。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "FE-03",
      "status": "细化",
      "summary": "把上传拆成准备授权、真实字节传输、扫描恢复、文件确认和确切版引用，补齐轮询上限、过期授权、后台继续及同名新文件隔离。仅映射实际使用上传及文件查看的用例，不把所有查询审批都挂入共用包；下载能力与后续材料用途的契约缺口单列。",
      "sourceReferences": [
        {
          "path": "doc/步骤一HTTP接口协议.md",
          "lineStart": 20,
          "lineEnd": 23,
          "reason": "上传准备、读取、确认、确切版元数据四个接口",
          "sha256": "3783a1197e2c7dbbfb42b5fb1a18d9d71c5db69c2aab257fdbe1b7d912b8d1c3"
        },
        {
          "path": "doc/步骤一HTTP接口协议.md",
          "lineStart": 67,
          "lineEnd": 85,
          "reason": "上传绑定、任务状态、字节校验及机构公共草稿归属",
          "sha256": "3783a1197e2c7dbbfb42b5fb1a18d9d71c5db69c2aab257fdbe1b7d912b8d1c3"
        },
        {
          "path": "doc/步骤一HTTP接口协议.md",
          "lineStart": 105,
          "lineEnd": 120,
          "reason": "直传与API不同预算、FILE_NOT_READY至少两秒轮询且单轮最长两分钟",
          "sha256": "3783a1197e2c7dbbfb42b5fb1a18d9d71c5db69c2aab257fdbe1b7d912b8d1c3"
        },
        {
          "path": "doc/examples/step1/http-examples.json",
          "lineStart": 39,
          "lineEnd": 135,
          "reason": "签名PUT授权与referenceEligible不可混同法律核实",
          "sha256": "406ea54c7af45a02bb25d7847141c556b3e6aff7e41cf4156349d9322044bcde"
        },
        {
          "path": "doc/步骤四系统用例与接口协议.md",
          "lineStart": 29,
          "lineEnd": 35,
          "reason": "18至23等后续用途和确切版本，不能把装箱单充当书面确认",
          "sha256": "eaf6e283e192ee40ef03978d2fb4945853c01d1713eba11df41922b47a544d69"
        },
        {
          "path": "doc/examples/step1/file-revision.json",
          "lineStart": 1,
          "lineEnd": 8,
          "reason": "确切版响应只有文件元数据，没有已定义的下载能力URL",
          "sha256": "0a5652d2d124fd5b9eef73d7908b48da744dbb2254fe37da2bed04fbf179f023"
        }
      ],
      "useCaseIds": [
        "supplier-submit",
        "payer-submit",
        "supplier-edit",
        "payer-edit",
        "contract-draft",
        "contract-revise",
        "customs-authority",
        "goods-ready",
        "s4-draft",
        "s4-confirm",
        "s4-official",
        "s4-attachment",
        "s5-n13-invoice-fee",
        "s6-materials",
        "s6-certificate",
        "s6-delivery",
        "s7-package",
        "s7-correction",
        "s8-remedy"
      ],
      "nodeIds": [
        "N01",
        "N02",
        "N03",
        "N04",
        "N05",
        "N07",
        "N08",
        "N09",
        "N12",
        "N18",
        "N20",
        "N21",
        "N23"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "材料用途、各阶段归属、类型和大小限制及错误文案",
          "contract": "doc/步骤一HTTP接口协议.md §4、§5；doc/步骤四系统用例与接口协议.md材料用途规则",
          "test": "用预留、交易、机构三种归属核对oneof；大小限制取服务端配置，不编造固定数值"
        },
        {
          "dependencyId": "FE-01",
          "consumes": "已认证请求、页面离开取消轮询、错误pointer及撤权处理",
          "contract": "doc/步骤一HTTP接口协议.md §6、§9",
          "test": "离页及401后停止本页轮询，确认后台任务未被取消"
        },
        {
          "dependencyId": "BL-03",
          "consumes": "上传授权、任务状态及恢复字段、确认文件、确切版元数据和实时授权查看",
          "contract": "doc/examples/step1/http-contract.json；下载能力与后续18至25用途上传白名单待文档后端工程师冻结",
          "test": "实际字节上传和扫描后确认；原键恢复同一文件；后续用途与撤权查看均需真实接口拒绝或放行"
        }
      ],
      "integrationScenarios": [
        {
          "name": "浏览器退出后的扫描恢复与同名文件隔离",
          "setup": "有权中国供应商、同交易两个字节不同而文件名相同的合成材料；后端可控制扫描任务状态",
          "steps": [
            "上传第一份并在processing时离页",
            "后台恢复为ready，重新进入后查询原uploadId并确认",
            "上传第二份，保持旧申报引用第一份确切版",
            "撤销文件读取权限后再次打开旧原件"
          ],
          "assertions": [
            "退出不导致重建上传或丢后台恢复",
            "两份材料号版或摘要可区分，旧申报引用不变",
            "扫描通过只显示可引用，撤权不再发放查看能力"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "当前FileRevision响应没有下载URL或独立下载授权资源，不能据此实现原件查看。建议BL-03冻结短期能力、到期刷新、撤权及审计契约，并说明已签发能力的撤销边界。",
          "owner": "文档后端工程师、安全开发工程师",
          "impact": "阻断真实原件下载联调；不阻断上传、扫描和确切版元数据展示。"
        },
        {
          "question": "步骤一明确补齐用途7至13，后续业务使用18至25。建议BL-03统一确认上传MaterialPurpose枚举、白名单、角色范围和失败码，前端不自造可上传用途。",
          "owner": "文档后端工程师、领域后端工程师",
          "impact": "阻断后续用途真实上传验收；不增加共用控件范围或预算。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "frontend",
      "before": {
        "personDays": 2.5,
        "baselinePersonDays": 5,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "FE-01",
          "BL-03"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit",
            "supplier-edit",
            "payer-edit",
            "contract-draft",
            "contract-revise",
            "customs-authority",
            "goods-ready",
            "s4-draft",
            "s4-confirm",
            "s4-official",
            "s4-attachment",
            "s5-n13-invoice-fee",
            "s6-materials",
            "s6-certificate",
            "s6-delivery",
            "s7-package",
            "s7-correction",
            "s8-remedy"
          ],
          "nodeIds": [
            "N01",
            "N02",
            "N03",
            "N04",
            "N05",
            "N07",
            "N08",
            "N09",
            "N12",
            "N18",
            "N20",
            "N21",
            "N23"
          ]
        },
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit",
            "supplier-edit",
            "payer-edit",
            "contract-draft",
            "contract-revise",
            "customs-authority",
            "goods-ready",
            "s4-draft",
            "s4-confirm",
            "s4-official",
            "s4-attachment",
            "s5-n13-invoice-fee",
            "s6-materials",
            "s6-certificate",
            "s6-delivery",
            "s7-package",
            "s7-correction",
            "s8-remedy"
          ],
          "nodeIds": [
            "N01",
            "N02",
            "N03",
            "N04",
            "N05",
            "N07",
            "N08",
            "N09",
            "N12",
            "N18",
            "N20",
            "N21",
            "N23"
          ]
        },
        {
          "useCaseIds": [
            "supplier-submit",
            "supplier-edit",
            "payer-submit",
            "payer-edit",
            "s4-confirm",
            "s4-attachment",
            "contract-revise",
            "s7-correction"
          ],
          "nodeIds": [
            "N01",
            "N02",
            "N03",
            "N04",
            "N08",
            "N09",
            "N21"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "FE-03-S1",
          "previousAction": "实现上传准备、字节传输、进度和失败保留。",
          "currentIds": [
            "FE-03-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FE-03-S2",
          "previousAction": "绑定扫描状态、确认、确切版本及重新鉴权的下载。",
          "currentIds": [
            "FE-03-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FE-03-S3",
          "previousAction": "验证大文件失败、重试和无权访问。",
          "currentIds": [
            "FE-03-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "FE-04": {
    "rationale": "合同任务和表单已有，按基础组件连接后端；一期无平台跳转或签章界面开发。",
    "steps": [
      {
        "personDays": 2,
        "action": "实现签约依据送审与独审、三种合同用途建草稿、逐交易公共协议适用以及正式报关委托和预付认可表单。",
        "logic": "出口代理运营人员GET /internal/v1/trades/{trade_number}/review-context后POST review-submissions，独立审核员读取确切submitted_snapshot_number后POST review-decisions；退回需原因和missingItems，先POST revisions重开再让双方各改本方。供应商GET contract-basis读取原因2批准资料，POST /api/v1/contracts固定用途10、11、12及双方、正文确切文件和有效期。框架用途与逐单用途区分；公共协议按上海自然日首尾均含，POST agreement-applications引用指定版及服务单。报关授权POST customs-authorizations，出口代理另在内部POST customs-agent-recognitions核对同一报关代理；用途13不是三类合同签完自动生成。",
        "expected": "送审、批准、退回和待补分别显示；普通建档未批准不能建逐单合同。公共协议申请受理显示pending_review，不能显示已批准生效；正式委托及预付认可各有依据和范围。",
        "test": "用缺资质报价的编辑态交易送审，应显示具体缺项；补齐后经另一审核员批准，核对原因2快照号。分别建立三种用途合同，重复trade加用途应拒绝。选择公共协议最后有效日与次日测试适用；受理后检查pending_review，尚未重审不能作有效证据。未提供正式用途13材料时不显示已有电子委托。"
      },
      {
        "personDays": 2,
        "action": "实现合同确切版本送审、独立审核、一期线下签署证据核实及独立生效决定的页面状态。",
        "logic": "供应商按GET确切版本的reviewResult补正；POST .../revisions/{revision_number}/review-submissions，独立审核员从内部GET同版后POST review-decisions。所有新写使用根强ETag、本受众确认和原键；412保留输入并重新GET。已审核待签状态4、签署证据归档状态5和生效6分开显示；一期平台signature-requests及signing-sessions入口关闭。人工核实须经BL-05冻结的记录和独立核实契约后才能显示5，上传ready文件仅可引用。POST /internal/v1/contracts/{contract_number}/revisions/{revision_number}/activation-decisions另核生效条件，不能由签署证据上传自动触发。",
        "expected": "经办人无自审能力，退回意见可读取。页面可见审阅文件版、签署文件版、核实结论及未满足条件；未冻结人工签署接口时明确待交接，不发平台假任务或伪造签署完成。",
        "test": "经办人送审后用同一身份审核，应403或相应独审门禁，另一人可留下决定。上传合成签署材料但不提供核实决定，断言仍非已签。用隔离状态夹具展示已签未生效，再提交缺条件的activation-decisions应拒绝；无真实签署证据时记录成功分支未验证，不制造签名。"
      },
      {
        "personDays": 2,
        "action": "联调正文改版、退回、活跃或未知签署阻断、公共适用更正及旧有效合同保留。",
        "logic": "仅未送审草稿允许PUT原版；退回另POST revisions，previousWorkingRevision须匹配当前工作版。旧待审或待签先按有权termination-decisions处置且原签署明确终态，不绕过SIGNATURE_IN_PROGRESS。旧5或6建立新草稿不终止旧版；新5激活替代旧6须明确supersedes和法律依据。公共适用及正式授权进入同一更正工作链，区分旧批准依据与当前pending事实。未知写先原文恢复；新内容须新键、新标签、新确认。",
        "expected": "改版不沿用旧审核或旧签署证据；旧有效合同及法律义务可查看。新草稿不会造成两个生效版，公共适用不会迫使无依赖变化的框架合同无限重签。",
        "test": "以旧有效6建立新草稿，核对旧版仍有效；修改正文后尝试用旧审核发签或生效，应拒绝。给原版设置未知签署任务，尝试新建替代及终止，应显示先查原任务。首次追加公共适用后再加同基准授权，核对沿同一更正链重审而未覆盖旧原因2快照。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "FE-04",
      "status": "细化",
      "summary": "一期保留人工签署核实，不接平台跳转。补充签约依据送审和退回重开、三种合同用途、独审、当前工作版、公共协议日期、逐单适用及正式委托；指出当前步骤二协议只有平台签署任务，缺一期人工证据核实入口，不能把上传按钮当已签。九个用例按用途映射N02至N04。",
      "sourceReferences": [
        {
          "path": "交付成果/assets/process-data.js",
          "lineStart": 45,
          "lineEnd": 47,
          "reason": "代理、物流及报关委任分别属于N02、N03、N04",
          "sha256": "37910ef0ab58d2c553203a8e6cf0278cd6b43ae06fd9d5fec5eb7c2caaf78f20"
        },
        {
          "path": "doc/步骤二系统用例与接口协议.md",
          "lineStart": 5,
          "lineEnd": 29,
          "reason": "原因2批准快照、三种合同用途及九个目标",
          "sha256": "309fb3369cd0cde8dcda7f2b1878fd1cb1518505439e5d38b418ce419fd98102"
        },
        {
          "path": "doc/步骤二系统用例与接口协议.md",
          "lineStart": 52,
          "lineEnd": 99,
          "reason": "签约依据、合同、适用及正式授权资源与并发错误",
          "sha256": "309fb3369cd0cde8dcda7f2b1878fd1cb1518505439e5d38b418ce419fd98102"
        },
        {
          "path": "doc/步骤二系统用例与接口协议.md",
          "lineStart": 143,
          "lineEnd": 171,
          "reason": "退回重开、系统管理事实、同一更正链及旧有效合同保留",
          "sha256": "309fb3369cd0cde8dcda7f2b1878fd1cb1518505439e5d38b418ce419fd98102"
        },
        {
          "path": "doc/examples/step2/http-examples.json",
          "lineStart": 2,
          "lineEnd": 189,
          "reason": "供应商签约依据GET来自批准快照而非付款方私密声明",
          "sha256": "17e526ec7453c56ebe61ad5a9b8d775fb0bd6d2e505b2ac76ba312bf5386da53"
        }
      ],
      "useCaseIds": [
        "basis-submit",
        "basis-review",
        "contract-draft",
        "contract-review",
        "contract-revise",
        "contract-sign",
        "contract-activate",
        "framework-use",
        "customs-authority"
      ],
      "nodeIds": [
        "N02",
        "N03",
        "N04"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "一期人工签署边界、签约阶段必需项、三种合同用途与法律替代条件",
          "contract": "doc/步骤二系统用例与接口协议.md；人工签署证据记录和核实入口待冻结",
          "test": "评审页面不存在第三方跳转，确认与审核及生效各有独立可观察结果"
        },
        {
          "dependencyId": "FE-03",
          "consumes": "用途8、9、10至13的确切版文件选择与原件查看",
          "contract": "doc/步骤二系统用例与接口协议.md §8.4；doc/examples/step1/http-contract.json",
          "test": "机构公共草稿与逐单文件归属正确，扫描未就绪不可送审"
        },
        {
          "dependencyId": "BL-05",
          "consumes": "合同身份和确切版、审核意见、框架逐单申请、正式授权、认可、人工核实及激活状态",
          "contract": "doc/examples/step2/http-contract.json；doc/examples/step2/http-examples.json；一期人工核实契约待补",
          "test": "重复用途、本人审核、改版旧批准、未知任务及旧有效版逐个核对；签约依据由BL-04提供的上游制品须一并交接"
        }
      ],
      "integrationScenarios": [
        {
          "name": "旧有效物流协议与新草稿并存后的逐单适用",
          "setup": "中国供应商、独立合同审核员、出口代理有权人员；隔离环境中一份有效物流框架版及一笔原因2批准交易，所有法律状态夹具明确标注合成",
          "steps": [
            "供应商建新版草稿并查看旧版",
            "为交易选择旧有效版及服务单，提交公共适用",
            "改变新版正文后尝试沿用旧审核",
            "将原签署任务置未知，再尝试终止或另行签署"
          ],
          "assertions": [
            "新草稿不终止旧有效版",
            "逐单申请是pending_review，不直接成为批准事实",
            "改版须重审，未知任务只可原号核实，不能重复签署",
            "无真实签署证据不得把状态夹具当线上验收成功"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "一期BL-05规定线下签署核实，步骤二现有HTTP表却只有第三方signature-requests及通知路径。建议冻结人工证据提交、核实身份、确切正文关联、文件归档和错误契约；不复用平台通知冒充人工核实。",
          "owner": "合同后端工程师、产品架构负责人",
          "impact": "阻断一期人工签署成功链联调；合同起草、独审、历史与生效条件展示可先完成。"
        },
        {
          "question": "FE-04直接实现签约依据送审和独审，但现有直接依赖仅BL-05，没有列明BL-04制品交接。建议总审计确认BL-05交付时是否包含上游review-context、重开、送审和决定接口；若需独立排程再调整前置，不在此修改业务包。",
          "owner": "项目实施负责人、交易后端工程师",
          "impact": "影响依据审核的联调顺序；不要求等整个业务层全部完成才能开工。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "frontend",
      "before": {
        "personDays": 3,
        "baselinePersonDays": 6,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "FE-03",
          "BL-05"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "basis-submit",
            "basis-review",
            "contract-draft",
            "framework-use",
            "customs-authority"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04"
          ]
        },
        {
          "useCaseIds": [
            "contract-draft",
            "contract-review",
            "contract-revise",
            "contract-sign",
            "contract-activate"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04"
          ]
        },
        {
          "useCaseIds": [
            "contract-revise",
            "contract-review",
            "contract-sign",
            "contract-activate",
            "framework-use",
            "customs-authority"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "FE-04-S1",
          "previousAction": "连接签约依据、合同用途、逐单委托及公共协议版本。",
          "currentIds": [
            "FE-04-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FE-04-S2",
          "previousAction": "实现经办送审、独立审核、人工签署证据及生效条件展示。",
          "currentIds": [
            "FE-04-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FE-04-S3",
          "previousAction": "走查本人审核拒绝、改版失效及旧有效合同保留。",
          "currentIds": [
            "FE-04-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "FE-05": {
    "rationale": "共用批次、材料及审核组件，但物流与关务任务的确认责任不同，不能并成一个提交按钮。",
    "steps": [
      {
        "personDays": 3,
        "action": "实现批次计划、批准商品行分配、计划改版及取消、备货和运输证据提交、独审、异常处置与历史读取。",
        "logic": "供应商GET contract-basis后POST /api/v1/trades/{trade_number}/shipments，输入approvedSnapshotNumber、tradeRevisionNumber、allocations和legs；后续GET /api/v1/shipments/{shipment_number}、PUT其/plan。显示逐行累计有效数量和金额，不用更换批准版重置占量；跨批准版迁移未定义返回PLAN_FROZEN。供应商仅提交备货，物流公司提交订舱、提货、区段启运到达、签收及异常，POST evidence-submissions后由另一人从内部review-context核对并POST evidence-decisions。异常经exception-dispositions逐项处理；cancellation-decisions仅未执行并明确无未知任务且必要撤销证据齐时可用。计划时刻与核实实际时刻分栏，失败保留输入。",
        "expected": "新建只显示计划中；备货核实不直接订舱或启运，首段启运、末段到达和有权签收分别推进。出境缺同批放行显示CLEARANCE_REQUIRED；异常7冻结原阶段，全部处置前不恢复；取消未知不释放占量。",
        "test": "批准100 PCS、金额10000.00的同一行，建40和60两个批次后尝试第三批，断言ALLOCATION_EXCEEDED且累计不变。仅备货通过仍计划中。按区段依次提货、到达，先提交乱序后段应拒绝；缺同批放行不能出境。设置两个异常只处置一个，应仍异常；未知取消无额度释放。412时原分配和区段输入仍在。"
      },
      {
        "personDays": 3,
        "action": "实现报关依据、完整草稿及修订差异、送审独审、供应商书面确认、人工办理核实和附件2分别交付接收。",
        "logic": "出口报关代理GET /api/v1/shipments/{shipment_number}/customs-basis后POST其/customs-declarations；草稿保存完整主体、运输口岸国别、商品三单、批准快照及计划版，改版POST /api/v1/customs-declarations/{declaration_number}/revisions。经review-submissions和内部review-decisions后，只有中国供应商有权确认人POST exporter-confirmations，绑定申报号、版、hash及用途19书面文件；X-Confirmation-Id不能替代书面证据。filing-requests只建原办理意图，一期外部人工执行；official-evidence待核后由内部official-evidence-decisions追加真实结论。attachment-deliveries按中国供应商和出口代理各建交付，收件人本人POST各交付号/receipts。GET确切版、办理、证据、交付及events读取历史；所有写强ETag、原键及本受众确认，失败不覆盖旧版。",
        "expected": "批准快照、物流计划版、申报资料版清楚分栏，改一栏即旧独审及供应商确认失效。意图、提交、受理、查验、放行互不代替；发送不等于接收，两收件方状态分别可见。付款方不能替代真实境外收货人。",
        "test": "经办送审由另一审核员通过，供应商上传并书面确认版1；仅改一商品字段建版2，尝试沿用版1确认应拒绝。用出口报关代理代供应商确认应拒绝。登记待核机关文件，断言不直接放行。分别交付附件2，由中国供应商先接收，检查出口代理仍未收到；供应商尝试代其接收应403。"
      },
      {
        "personDays": 2,
        "action": "联调多批次占量、退回补正、正式更正撤回、乱序来源和未知原办理恢复，检查物流与关务互不代写。",
        "logic": "物流补正关联replacesSubmissionId并读取原reviewResult；不能改原sourceReference正文。关务更正须真实正式要求、新版重审和供应商重新书面确认，并关联original_request及correction_event_number；未知办理只GET原filing-request，不改版或撤回成功，不释放申报占量。已执行历史不覆盖，技术失败不当正式退单。原受理无对应GET时原键原文重放，不能向未声明的Location随意GET；有events资源时按真实契约读。非银行自动渠道及关务资料库查询在一期关闭。",
        "expected": "退回理由可读，旧版及源证据历史保留；乱序不回退进度，同源异文提示冲突。正式更正未核实前无新放行或额度释放；物流到达或承运通知不能替代同批放行。",
        "test": "将物流证据退回，再用新提交关联旧submission并重新确认，检查旧决定未改。令报关办理execution=未知，点击恢复及尝试改版，断言仅查原request_number且无新办理。补入合成更正要求只作门禁测试，检查新版本须重审及重新书面确认；无真实官方条件时成功分支记录未验证。返回旧版放行声明及同源异文，断言不推进新版，不覆盖已核实历史。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "FE-05",
      "status": "细化",
      "summary": "保留物流、关务和专项联调三项，补齐七个物流及十个关务用例。节点映射：shipment-plan、shipment-amend为N05/N06；goods-ready为N05；booking-pickup为N06；transport-progress为N10；logistics-exception为N10/N23；logistics-query为N05/N06/N10。s4-basis、s4-draft、s4-revision、s4-review为N07，修订重确认另支撑N08；s4-confirm为N08；s4-filing、s4-official、s4-attachment为N09；s4-correction为N07/N08/N09/N23；s4-query读取N07至N09历史。区分技术确认与书面确认、办理意图与官方事实、发送与双方接收；一期不增加关务信息查询。",
      "sourceReferences": [
        {
          "path": "交付成果/assets/process-data.js",
          "lineStart": 48,
          "lineEnd": 53,
          "reason": "N05、N06、N10与N07至N09真实协作顺序",
          "sha256": "37910ef0ab58d2c553203a8e6cf0278cd6b43ae06fd9d5fec5eb7c2caaf78f20"
        },
        {
          "path": "doc/步骤三系统用例与接口协议.md",
          "lineStart": 5,
          "lineEnd": 45,
          "reason": "物流七目标、计划及实际状态、跨版占量阻断",
          "sha256": "bed3e39150278fba4db2d78386f6de645a89f8c0dd863ef28e37254b5400d339"
        },
        {
          "path": "doc/步骤三系统用例与接口协议.md",
          "lineStart": 47,
          "lineEnd": 97,
          "reason": "证据独审、异常、来源去重、原键恢复和错误",
          "sha256": "bed3e39150278fba4db2d78386f6de645a89f8c0dd863ef28e37254b5400d339"
        },
        {
          "path": "doc/步骤四系统用例与接口协议.md",
          "lineStart": 3,
          "lineEnd": 88,
          "reason": "十个关务目标、书面确认、原办理、更正和双方交接",
          "sha256": "eaf6e283e192ee40ef03978d2fb4945853c01d1713eba11df41922b47a544d69"
        },
        {
          "path": "doc/examples/step3/http-examples.json",
          "lineStart": 2,
          "lineEnd": 65,
          "reason": "计划创建的批准快照、分配、区段及最小受理",
          "sha256": "23a94f60394bfb6d81a652ecbc8015f9faa89050378f2a0cc65e8b926523c96f"
        },
        {
          "path": "doc/examples/step4/http-examples.json",
          "lineStart": 2,
          "lineEnd": 53,
          "reason": "customs-basis返回计划版、主体与正式授权缺项",
          "sha256": "5aff4f1b2abd3a37f6fba7c2b7ee865a575d5c1f5a11743ceccd990b808beeb7"
        }
      ],
      "useCaseIds": [
        "shipment-plan",
        "shipment-amend",
        "goods-ready",
        "booking-pickup",
        "transport-progress",
        "logistics-exception",
        "logistics-query",
        "s4-basis",
        "s4-draft",
        "s4-revision",
        "s4-review",
        "s4-confirm",
        "s4-filing",
        "s4-official",
        "s4-correction",
        "s4-attachment",
        "s4-query"
      ],
      "nodeIds": [
        "N05",
        "N06",
        "N07",
        "N08",
        "N09",
        "N10",
        "N23"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "物流和关务角色、一期人工办理边界、批次拆分及监管规则缺项",
          "contract": "doc/步骤三系统用例与接口协议.md；doc/步骤四系统用例与接口协议.md",
          "test": "确认出境同批放行、书面确认本人、收件人本人及无监管依据不正式办理"
        },
        {
          "dependencyId": "FE-03",
          "consumes": "三单、物流证据、用途18至23确切版选择及状态",
          "contract": "doc/步骤四系统用例与接口协议.md材料用途及FileRef规则",
          "test": "用途3不能作19或21；未ready文件不生成书面确认或官方事实"
        },
        {
          "dependencyId": "BL-06",
          "consumes": "批准行、累计分配、planRevision、强标签、计划改版和取消",
          "contract": "doc/examples/step3/http-contract.json；doc/examples/step3/http-examples.json",
          "test": "跨批超量和跨批准版PLAN_FROZEN均显示明确原因，未知取消不释放"
        },
        {
          "dependencyId": "BL-08",
          "consumes": "customs-basis、完整草稿、确切修订、差异、独审及供应商书面确认",
          "contract": "doc/examples/step4/http-contract.json；doc/examples/step4/http-examples.json",
          "test": "草稿任一字段改版后旧独审及旧书面确认不能用于新办理"
        },
        {
          "dependencyId": "BL-07",
          "consumes": "物流证据提交及reviewResult、独立决定、区段推进和多异常处置",
          "contract": "doc/examples/step3/http-contract.json",
          "test": "备货、提货、到达、签收各一事实；非本人来源、自审、乱序及缺放行均拒绝"
        },
        {
          "dependencyId": "BL-09",
          "consumes": "人工办理号、正式证据待核和决定、更正撤回、双方交付接收及历史",
          "contract": "doc/examples/step4/http-contract.json；doc/examples/step4/operation-variants.json",
          "test": "原号未知恢复、旧版迟到、技术退单和错收件方逐一核对"
        }
      ],
      "integrationScenarios": [
        {
          "name": "草稿改版后书面确认失效与双收件方隔离",
          "setup": "同一合成批次、出口报关代理经办人、独立关务审核员、中国供应商确认人及双方独立接收人；正式外部事实只使用获准测试证据，缺失则测试阻断",
          "steps": [
            "审核并书面确认草稿版1，再修改国别生成版2",
            "尝试沿用版1确认办理版2",
            "完成版2独审和本人书面确认后建人工办理意图，并模拟响应丢失",
            "原号恢复；在真实证据前尝试放行及交付",
            "具备可用测试证据时分别向两方交付，仅一方接收"
          ],
          "assertions": [
            "版2沿用旧确认被拒，旧版历史保留",
            "未知不重报，待核不放行",
            "缺正式材料不能交付",
            "单方接收不推进另一方，出口报关代理不能代收"
          ]
        },
        {
          "name": "跨批占量与多异常恢复",
          "setup": "同一批准行100 PCS，两批各50 PCS；物流公司和独立审核员分人",
          "steps": [
            "第三批再分配1 PCS",
            "第一批建立两个异常后只处置一个",
            "尝试出境但不提供同批正式放行"
          ],
          "assertions": [
            "累计超量拒绝且原分配不变",
            "仍有一个异常则保持冻结原阶段",
            "出境明确CLEARANCE_REQUIRED，不以其他批次回执补位"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "拆报、跨批合并、批准版本迁移及具体监管适用规则仍未确认。建议业务及关务岗位明确可执行范围，未确认时保留PLAN_FROZEN和正式办理阻断，不由页面计算新可用量。",
          "owner": "关务业务负责人、物流业务负责人、领域后端工程师",
          "impact": "阻断这些特殊业务的成功验收；既有单批同批准版、草稿和缺证阻断可联调。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "frontend",
      "before": {
        "personDays": 4,
        "baselinePersonDays": 8,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "FE-03",
          "BL-06",
          "BL-08",
          "BL-07",
          "BL-09"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "shipment-plan",
            "shipment-amend",
            "goods-ready",
            "booking-pickup",
            "transport-progress",
            "logistics-exception",
            "logistics-query"
          ],
          "nodeIds": [
            "N05",
            "N06",
            "N10",
            "N23"
          ]
        },
        {
          "useCaseIds": [
            "s4-basis",
            "s4-draft",
            "s4-revision",
            "s4-review",
            "s4-confirm",
            "s4-filing",
            "s4-official",
            "s4-correction",
            "s4-attachment",
            "s4-query"
          ],
          "nodeIds": [
            "N07",
            "N08",
            "N09",
            "N23"
          ]
        },
        {
          "useCaseIds": [
            "shipment-amend",
            "booking-pickup",
            "transport-progress",
            "logistics-exception",
            "logistics-query",
            "s4-revision",
            "s4-review",
            "s4-confirm",
            "s4-filing",
            "s4-official",
            "s4-correction",
            "s4-query"
          ],
          "nodeIds": [
            "N05",
            "N06",
            "N07",
            "N08",
            "N09",
            "N10",
            "N23"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "FE-05-S1",
          "previousAction": "连接批次商品行分配、备货和各运输事件，区分计划与实际。",
          "currentIds": [
            "FE-05-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FE-05-S2",
          "previousAction": "实现完整报关草稿、差异、供应商书面确认、回执及双方接收。",
          "currentIds": [
            "FE-05-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FE-05-S3",
          "previousAction": "演练多批次、乱序证据、更正及他人代确认拒绝。",
          "currentIds": [
            "FE-05-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "FE-06": {
    "rationale": "证明和退税页面复用材料、审批和办理号组件，各自保留正式结果与交付差异。",
    "steps": [
      {
        "personDays": 2,
        "action": "实现证明准备、协作案及材料版、独审、人工办理和证据核实，连接正式证明交付、供应商核对及异议处理。",
        "logic": "出口代理GET /api/v1/trades/{trade_number}/tax-proof-preparation显示职责范围时限缺项；正式规则不足时POST tax-proof-cases可409，不能假建正式范围。出口报关代理协助POST /api/v1/tax-proof-cases/{tax_case_number}/submissions，冻结全文、清单、hash、批准快照和范围；独立审核员GET内部review-context后POST reviews。出口代理POST dispatch-intents后只按原dispatch_reference查询，外部由有权人员人工办理；official-evidence-claims仅待核，内部official-verifications才追加有依据正式事实。正式补正另版并关联原版和已核实事件，内部退回不填官方补正号。已核实证明由出口代理POST deliveries，供应商本人POST receipts选择收到、核对或异议；异议经objection-dispositions处理后必要时重交付、重核对。GET history及tax-proof-command-results/{request_key}区分当前历史与原命令；写失败保留输入。",
        "expected": "缺职责只能准备，内部批准不显示正式受理，待核原件不显示已签发。正式处理完成8仍待交接，只有实际交付及供应商独立核对齐备才9；异议或正式更正后旧接收不能复用。",
        "test": "按step6示例令范围规则未确认，准备页列缺项，正式建案应409且无假范围。报关代理送材料后尝试自审应拒绝，退回后另建版。缺真实证明时交付和接收均拒绝；由出口代理代供应商核对也拒绝。用状态夹具演示正式更正后原接收过期，不把夹具当真实机关成功。"
      },
      {
        "personDays": 2,
        "action": "实现供应商退税准备、完整材料确定版、独立审核、人工办理、通知补正、正式决定及后续待办。",
        "logic": "供应商POST /api/v1/trades/{trade_number}/tax-refund-cases准备，金额未确定省略claimedAmount而不填0；POST /api/v1/tax-refund-cases/{tax_case_number}/submission-revisions固定全文、清单、package_hash、来源和范围。独立税务审核员用内部review-context和review-decisions，源批准版或附件2变更时显示批准失效。供应商POST dispatch-intents须职责、范围和正申请额均确认；一期只人工渠道办理，超时GET operations/{operation_number}恢复原号。内部official-notices核实真实源、原办理及确切版后分别显示受理、补正、终局；correction-revisions必须原版及正式补正依据，新版重新独审。follow-ups只登记待办，非官方进度。GET案件和确切submission-revisions读取完整历史及意见；所有写带原键、强标签及本受众确认，412人工核对后新意图再提交。",
        "expected": "准备金额未知、申请额、批准额、实际到账分别可见；内部批准只待提交，正式拒绝或撤销不自动正常结案。收到补正通知不覆盖旧版，不沿用旧批准，不猜税率或期限。",
        "test": "准备时不填金额，核对响应无假0；申请正式提交缺范围时422。材料版1审核后改变源附件2，尝试办理应提示SOURCE_REVISION_STALE或相应门禁。内部退回后普通新材料版与正式补正新版本分别测试，缺正式补正事件不能调用成功。登记正式决定的合成拒绝示例后仍显示银行到账待核且交易未结案。"
      },
      {
        "personDays": 2,
        "action": "完成独立退税实收及差额页面，联调材料改版、本人证明接收、未知办理及无权资金观察。",
        "logic": "独立资金核对员读取有权资金观察后POST /internal/v1/tax-refund-cases/{tax_case_number}/credit-reconciliations；部分实收、差额、观察时间和归属账户独立列示，不能由税务决定或供应商勾选替代。REFUND_OBSERVATION_UNAVAILABLE保持未核实，不将未知当0，不增加出口代理货款三位置。供应商只可读本方案件及其权限内到账结果，不能借内部入口观察他人账户。证明旧交付、正式更正、未决异议及本人接收用原delivery号核对。原未知办理只查原号，不新申请；页面错误保留本次材料和核对说明。",
        "expected": "有权时显示独立银行观察及差额，无权时明确不可核实且不泄露账户详情。税务处理完成仍可到账待核，证明交接核对与退税到账不互相代替。",
        "test": "用供应商账号调用内部到账核对应拒绝；用有岗位权限但无银行观察授权的核对员按step7例提交，应422 REFUND_OBSERVATION_UNAVAILABLE，三位置均不变。分别给证明旧交付和更正后交付提交接收，旧版应DELIVERY_STALE。办理超时退出再进恢复同一operations号，不增加dispatch。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "FE-06",
      "status": "细化",
      "summary": "证明十二用例和退税九用例全部覆盖。s6-preparation、s6-materials对应N18，s6-cooperation支撑N18/N19，s6-review、s6-dispatch、s6-official-receipt对应N19，s6-correction对应N19并重入N18，s6-certificate、s6-delivery、s6-receipt对应N20，s6-objection对应N20/N23，s6-query读取N18至N20。全部s7用例对应N21，实收差异处置另交接N23。范围未知时正式建案也可能409；证明签发8与供应商核对9、退税决定与独立银行实收分开，禁止他方代接收和无观察权假到账。",
      "sourceReferences": [
        {
          "path": "交付成果/assets/process-data.js",
          "lineStart": 9,
          "lineEnd": 10,
          "reason": "证明N18至N20，退税N21",
          "sha256": "37910ef0ab58d2c553203a8e6cf0278cd6b43ae06fd9d5fec5eb7c2caaf78f20"
        },
        {
          "path": "doc/步骤六系统用例与接口协议.md",
          "lineStart": 3,
          "lineEnd": 62,
          "reason": "十二目标、正式建案范围、材料版、办理和交接异议",
          "sha256": "c80e0ceb5b024eacc205546ce30739d4118ec98c8ffcc6bd960584142b91d409"
        },
        {
          "path": "doc/步骤七系统用例与接口协议.md",
          "lineStart": 3,
          "lineEnd": 61,
          "reason": "九目标、税务终局、补正与独立资金观察",
          "sha256": "8b9b0d38e55742d3a1f3de0654513e94ace510722685acdfbc2ea6bea6fc41ab"
        },
        {
          "path": "doc/examples/step6/http-examples.json",
          "lineStart": 2,
          "lineEnd": 116,
          "reason": "准备允许查看缺项，正式建协作案缺规则409",
          "sha256": "a81feadc823130b453390b9a62ef4a1394834f58b1f8f68ccc387065b465e4aa"
        },
        {
          "path": "doc/examples/step7/http-examples.json",
          "lineStart": 593,
          "lineEnd": 645,
          "reason": "退款观察不可用为422，不产生实际到账",
          "sha256": "0b21196d2ca6a97a120e927fd825c3b7d9143fa4d0aa09ee8bef499e326f2826"
        }
      ],
      "useCaseIds": [
        "s6-preparation",
        "s6-cooperation",
        "s6-materials",
        "s6-review",
        "s6-dispatch",
        "s6-official-receipt",
        "s6-correction",
        "s6-certificate",
        "s6-delivery",
        "s6-receipt",
        "s6-objection",
        "s6-query",
        "s7-prepare",
        "s7-package",
        "s7-review",
        "s7-dispatch",
        "s7-notice",
        "s7-correction",
        "s7-decision",
        "s7-credit",
        "s7-recovery"
      ],
      "nodeIds": [
        "N18",
        "N19",
        "N20",
        "N21",
        "N23"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "证明及退税办理职责、范围规则、时限、一期人工核实和未知处理清单",
          "contract": "doc/步骤六系统用例与接口协议.md §1；doc/步骤七系统用例与接口协议.md §1",
          "test": "未决职责显示缺项，不自行按一交易一案或固定期限放行"
        },
        {
          "dependencyId": "FE-03",
          "consumes": "用途20至24确切版清单、扫描状态和权限过滤",
          "contract": "doc/examples/step6/entity-projection.json；doc/examples/step7/entity-projection.json",
          "test": "同名新材料不得替换已审清单，旧版仍可按确切引用查看"
        },
        {
          "dependencyId": "BL-10",
          "consumes": "证明准备缺项、正式范围协作案、材料版及独审意见",
          "contract": "doc/examples/step6/http-contract.json；doc/examples/step6/http-examples.json",
          "test": "范围未确定建案409、内部自审拒绝、源变更批准失效"
        },
        {
          "dependencyId": "BL-12",
          "consumes": "退税准备案、确定版、独审、人工办理号、通知补正和终局",
          "contract": "doc/examples/step7/http-contract.json；doc/examples/step7/http-examples.json",
          "test": "原办理恢复、正式补正缺证拒绝；申请额、决定与到账独立"
        },
        {
          "dependencyId": "BL-13",
          "consumes": "供应商退税实收受控观察、可见范围、部分到账差额及无权错误",
          "contract": "doc/examples/step7/http-contract.json 中s7-credit；资金观察来源授权及字段由BL-13交接",
          "test": "无观察权返回REFUND_OBSERVATION_UNAVAILABLE，未知不造0且出口代理货款桶不变"
        }
      ],
      "integrationScenarios": [
        {
          "name": "证明更正后旧接收失效与退税无观察权",
          "setup": "出口代理、出口报关代理、独立税务审核员、供应商接收人及独立资金核对员；隔离案件和版本夹具，无真实官方成功时仅验阻断",
          "steps": [
            "读取未确认范围并尝试正式建证明案",
            "证明材料退回后另版，给旧交付提交接收",
            "以出口代理代供应商核对",
            "对退税正式终局展示执行无银行观察的到账核对"
          ],
          "assertions": [
            "未确认范围409且没有正式协作案假成功",
            "补正另版、旧交付不可复用，代接收拒绝",
            "无观察权422、到账仍未知，未核实金额不变0",
            "无自动结案，无出口代理货款余额增加"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "FE-06负责证明人工办理、签发、交付及异议，但直接依赖未列BL-11；BL-12虽依赖BL-11，仍需明确证明接口制品何时交接。建议总审计协调交付顺序，不在此改BL-11或制造反向依赖。",
          "owner": "项目实施负责人、税务后端工程师",
          "impact": "影响证明后半程联调；准备及退税组件可按已冻结契约先做。"
        },
        {
          "question": "证明和退税范围、申请主体、正式期限以及供应商银行实收观察授权尚需正式确认。建议业务及资金岗位分别给权威来源，未确认维持准备或未核实，不以示例补值。",
          "owner": "税务业务负责人、资金业务负责人",
          "impact": "阻断真实正式办理和到账成功验收；不阻断材料版本、权限及缺证失败路径。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "frontend",
      "before": {
        "personDays": 3,
        "baselinePersonDays": 6,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "FE-03",
          "BL-10",
          "BL-12",
          "BL-13"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s6-preparation",
            "s6-cooperation",
            "s6-materials",
            "s6-review",
            "s6-dispatch",
            "s6-official-receipt",
            "s6-correction",
            "s6-certificate",
            "s6-delivery",
            "s6-receipt",
            "s6-objection",
            "s6-query"
          ],
          "nodeIds": [
            "N18",
            "N19",
            "N20",
            "N23"
          ]
        },
        {
          "useCaseIds": [
            "s7-prepare",
            "s7-package",
            "s7-review",
            "s7-dispatch",
            "s7-notice",
            "s7-correction",
            "s7-decision",
            "s7-recovery"
          ],
          "nodeIds": [
            "N21"
          ]
        },
        {
          "useCaseIds": [
            "s6-correction",
            "s6-certificate",
            "s6-delivery",
            "s6-receipt",
            "s6-objection",
            "s6-query",
            "s7-credit",
            "s7-recovery"
          ],
          "nodeIds": [
            "N19",
            "N20",
            "N21",
            "N23"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "FE-06-S1",
          "previousAction": "连接证明准备、材料送审、外部人工办理号及异议。",
          "currentIds": [
            "FE-06-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FE-06-S2",
          "previousAction": "连接退税确定版、通知补正、终局和实收待核。",
          "currentIds": [
            "FE-06-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FE-06-S3",
          "previousAction": "校验补正改版、本人接收及无权观察到账。",
          "currentIds": [
            "FE-06-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "FE-07": {
    "rationale": "复用已有差异与暂停任务；只建设基础报告和操作反馈。",
    "steps": [
      {
        "personDays": 2,
        "action": "实现完整核对上下文、逐项报告、差异登记分派及历史查询，显示观察值、期望值、来源和规则而非总分。",
        "logic": "核对经办人GET /internal/v1/trades/{trade_number}/reconciliation-context，展示sources的type/id/revision/hash/sourceEventTail及完整objectSets；POST reconciliation-reports后GET指定report_number。报告包含交易、合同、全部批次申报、双方交接、资金三位置、凭证分录、税务及异常来源，未接入和无权不是空集合或0。POST discrepancy-cases及其/assignments登记责任人和期限，GET案件及dispositions读取决定。接口错误保留筛选及差异说明，412保留内容并GET新标签，未知先恢复原命令。",
        "expected": "每项pass、fail、unknown和具体缺证原因可展开，失败可定位源对象版本。报告与案件分开编号，资金差异指向资金域记录，不能在合规页改余额或流水。",
        "test": "准备一个未知官方源、一个金额差异和一个正常商品项生成报告，核对三种结论均保留且有观察值及来源。将未接入物流与真实空批次集合分别返回，前者应unknown。登记分派后刷新，责任人与原报告号一致；尝试越权读取另一交易报告应不可见。"
      },
      {
        "personDays": 2,
        "action": "实现暂停决定及多目标传播、补交凭据与独立核实、更正影响图、逐原因解除、独立关案和正常结案双人操作。",
        "logic": "合规经办人POST案件/hold-decisions列确切业务对象、版本和动作，gate-acknowledgements区分received与applied。责任人POST remedies后另一人POST remedy-decisions，不能凭已补件解除。correction-applications及correction-decisions显示原节点、影响对象、依赖边及失效传播，批准范围后回原节点重审。release-applications及release-decisions仅针对一个holdReference，未全部目标落实仍阻断。案件closure-applications及closure-decisions和交易/internal/v1/trades/{trade_number}/closure-applications及其/decisions是两套资源，界面明确区别。结案申请人选确切报告hash、规则版、源向量和对象集合，独立审批再次重验；原键恢复不另建申请。",
        "expected": "关案不自动解冻，解除一原因不影响其他原因；传播接收不等于执行。正常结案申请仍状态8，独立通过才10；有unknown、未决资金差异或执行未知无可绕过入口，无特殊结案、授信或垫资操作。",
        "test": "同交易两案建立两个暂停原因，先关闭一案再解除其原因但只返回received，检查另一原因及未applied目标仍阻断。补件未独立实质核实不可解除。结案申请由本人审批应拒绝；报告有unknown按step8示例应422且交易仍8。缺真实外部证据时不得构造全通过成功轨迹。"
      },
      {
        "personDays": 1,
        "action": "联调报告陈旧、新增对象、并存暂停、终态原受理恢复及更正重审传播的可见结果。",
        "logic": "报告冻结后任何源版本、事件尾、规则版或完整对象集合变化均须重新核对；不仅比较已有对象修订。更正批准只准范围，不代表原节点新事实已批准。未决传播、资金锁额或实收未知阻断结案；关案不改变外部未知。GET /internal/v1/trades/{trade_number}/reconciliation-acceptances/{request_key}读取本人原受理，当前状态不替代原命令结果；错误保留原报告及输入供重做新意图。",
        "expected": "旧报告可查但标记过期和具体变化；并存原因和传播目标逐项展示。交易正常结案终态不可新意图修改，原同文受理仍能恢复；无证解除和特殊结案均不可操作。",
        "test": "生成报告后新增一个申报对象而不改其他对象，申请结案应陈旧或源不一致拒绝。再变更一个sourceEventTail及规则版分别重试，均不能沿用旧报告。用合成终态夹具检验原键回放与新键拒绝，并标注真实结案成功未验证。关案后刷新暂停列表，原有效holdReference仍存在。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "FE-07",
      "status": "细化",
      "summary": "覆盖十一合规用例：s8-context、s8-report、s8-closure-apply、s8-closure-review对应N22；s8-assignment、s8-hold、s8-remedy、s8-correction、s8-release、s8-case-close对应N23；s8-query读取N22/N23。将完整源向量、对象集合和逐项pass/fail/unknown落到报告；补正、独立实质核实、逐原因解除、传播确认和关案分开操作。申请及独审均重验，新增对象也使报告过期，无特殊结案入口。",
      "sourceReferences": [
        {
          "path": "交付成果/assets/process-data.js",
          "lineStart": 11,
          "lineEnd": 11,
          "reason": "逐项核对与正常结案N22，暂停更正及案件N23",
          "sha256": "37910ef0ab58d2c553203a8e6cf0278cd6b43ae06fd9d5fec5eb7c2caaf78f20"
        },
        {
          "path": "doc/步骤八系统用例与接口协议.md",
          "lineStart": 13,
          "lineEnd": 40,
          "reason": "完整源集合、未知阻断、逐原因解除及正常结案双重重验",
          "sha256": "e2918d2051a08419256735255787e066a167ecd22e70a9bc29a278378a9c632e"
        },
        {
          "path": "doc/步骤八系统用例与接口协议.md",
          "lineStart": 54,
          "lineEnd": 62,
          "reason": "内部受众、可查询资源、错误及原请求恢复",
          "sha256": "e2918d2051a08419256735255787e066a167ecd22e70a9bc29a278378a9c632e"
        },
        {
          "path": "doc/步骤八系统用例与接口协议.md",
          "lineStart": 70,
          "lineEnd": 96,
          "reason": "独立实质处置、解除、关案和多目标传播的不同载荷",
          "sha256": "e2918d2051a08419256735255787e066a167ecd22e70a9bc29a278378a9c632e"
        },
        {
          "path": "doc/examples/step8/http-examples.json",
          "lineStart": 2769,
          "lineEnd": 2874,
          "reason": "报告有unknown时正常结案申请422，不是成功轨迹",
          "sha256": "e3c6c8580b21b3158b27642470639c43cc1b0853c85cf79089dcf6b7cceef830"
        }
      ],
      "useCaseIds": [
        "s8-context",
        "s8-report",
        "s8-assignment",
        "s8-hold",
        "s8-remedy",
        "s8-correction",
        "s8-release",
        "s8-case-close",
        "s8-closure-apply",
        "s8-closure-review",
        "s8-query"
      ],
      "nodeIds": [
        "N22",
        "N23"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "全部源范围、unknown规则、暂停动作和正常结案条件",
          "contract": "doc/步骤八系统用例与接口协议.md §2至§4",
          "test": "核对未接入不当空集、案件关闭不当解冻、无特殊结案"
        },
        {
          "dependencyId": "FE-01",
          "consumes": "内部受众会话、报告及案件路由、字段错误和原请求提示",
          "contract": "doc/步骤八系统用例与接口协议.md §6",
          "test": "外部凭证不能读取或操作内部合规资源"
        },
        {
          "dependencyId": "BL-14",
          "consumes": "完整源向量和对象集合、逐项报告、分派、暂停原因及传播目标",
          "contract": "doc/examples/step8/http-contract.json；doc/examples/step8/compliance-decision-contract.json",
          "test": "新增对象使旧报告不可结案，每个holdReference及目标有单独received/applied"
        },
        {
          "dependencyId": "BL-16",
          "consumes": "正常结案申请、独审、历史及来自BL-15的补正、更正、解除、关案制品",
          "contract": "doc/examples/step8/http-contract.json；doc/examples/step8/http-examples.json",
          "test": "申请与批准均重验，同人拒绝、unknown拒绝，合规关案不替代资金实质关闭"
        }
      ],
      "integrationScenarios": [
        {
          "name": "新增申报对象与仅接收未执行的解除传播",
          "setup": "核对经办人、案件责任人及不同独立复核人；合成交易状态8，两个有效暂停原因，一个原因作用于两个目标",
          "steps": [
            "生成逐项报告后新增一个申报对象",
            "尝试使用旧报告申请正常结案",
            "关闭其中一案，再针对一原因申请解除并独立复核",
            "只让一个目标返回received，不返回applied"
          ],
          "assertions": [
            "新增对象令旧报告失效，即使已有源修订没变",
            "关案不减少有效原因",
            "解除仅对应原因，另一原因不变",
            "未全部applied前业务仍阻断，交易不结案"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "BL-15的实质处置、更正影响边和多目标传播是本页消费能力，但本包只直接依赖BL-16。建议明确随BL-16交接的BL-15接口及完整载荷；共享§11分支未冻结前不退化成自由JSON。",
          "owner": "合规后端工程师、领域架构负责人、项目实施负责人",
          "impact": "阻断复杂更正及多目标传播完整联调；逐项报告、单原因展示和缺证拒绝可先做。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "frontend",
      "before": {
        "personDays": 2.5,
        "baselinePersonDays": 5,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "FE-01",
          "BL-14",
          "BL-16"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s8-context",
            "s8-report",
            "s8-assignment",
            "s8-query"
          ],
          "nodeIds": [
            "N22",
            "N23"
          ]
        },
        {
          "useCaseIds": [
            "s8-hold",
            "s8-remedy",
            "s8-correction",
            "s8-release",
            "s8-case-close",
            "s8-closure-apply",
            "s8-closure-review"
          ],
          "nodeIds": [
            "N22",
            "N23"
          ]
        },
        {
          "useCaseIds": [
            "s8-report",
            "s8-correction",
            "s8-release",
            "s8-case-close",
            "s8-closure-apply",
            "s8-closure-review",
            "s8-query"
          ],
          "nodeIds": [
            "N22",
            "N23"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "FE-07-S1",
          "previousAction": "连接完整源报告、逐项结论和案件分派。",
          "currentIds": [
            "FE-07-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FE-07-S2",
          "previousAction": "实现逐原因处置、解除、传播及正常结案条件。",
          "currentIds": [
            "FE-07-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FE-07-S3",
          "previousAction": "校验源变更、并存暂停和未知项阻断。",
          "currentIds": [
            "FE-07-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "FE-08": {
    "rationale": "基础资金页面复用任务框架，但精确金额、付款锁额和只读发票必须单测。",
    "steps": [
      {
        "personDays": 3,
        "action": "实现来款实收及未匹配、分配与独立复核、发票申报补正、独立服务费和贸易核验释放的页面。",
        "logic": "服务费规则已确认：固定CNY 300由D承担，仅在首次获批分账时从D已核验可用余额结算；真实收费仍须D授权及法务/财务确认正式收费依据、票据和收入确认。资金经办人GET /internal/v1/fund-receipts/{receipt_flow_number}/allocation-context后POST allocations，另一人对/internal/v1/fund-allocations/{allocation_number}/decisions复核；毛额等于有效分配加未匹配，待复核不作可用。GET /api/v1/trades/{trade_number}/funds分别显示restricted、available、paymentLocked；内部POST bank-receipt-evidence只是待核资料，不能由水单截图造实收。按现有发票接口POST invoice-declarations并GET指定invoice_number，补正关联旧版不可覆盖；GET agency-service-fee展示首次获批分账时从D已核验可用余额结算的一次CNY300 event12；INVOICE不触发，A合同应付不减少，银行费用单列event11。内部funds-review-context、funds-verifications和fund-releases区分内部核验与真实银行可用证据，缺证422保持受限。所有金额字符串定点，失败保留输入；付款方只读已审有效发票的查询契约待冻结，未冻结不开借用接口。",
        "expected": "实收、分配、申报、核验及可用逐项显示；未匹配始终受限，内部通过不自动释放。发票不收费；首次分账服务费减少付款方可用余额300元，但中国供应商合同应付不变。付款方看不到待审发票。",
        "test": "隔离银行测试来款1000.00，分配600.00和300.00，核对未匹配100.00；未复核不得支付，再分配101.00应拒绝。缺真实银行可用证据时按step5例释放应422、受限不变。首次INVOICE与两次补正后核对无服务费事件；首次获批分账后只一笔300.00的event12，付款方可用余额减少300.00，供应商合同应付不变；无银行成功证据只测失败不造实收。付款方访问待审及他方发票应拒绝。"
      },
      {
        "personDays": 3,
        "action": "实现预付款与出口后付款结算、独立审批锁额、原号查单、供应商到账及资金差异处置复核。",
        "logic": "服务费规则已确认：固定CNY 300由D承担，仅在首次获批分账时从D已核验可用余额结算；真实收费仍须D授权及法务/财务确认正式收费依据、票据和收入确认。经办人POST /internal/v1/trades/{trade_number}/settlements，GET /internal/v1/settlements/{transaction_number}展示应付、已付、未付、获授权第三方费用及净额；预付核同一报关代理认可、委任、协议、正式授权和真实可用资金，出口后还核供应商书面最终稿、正式申报、出口代理接收及放行。独立settlement decisions及payment-approvals后才显示锁额，POST /internal/v1/payment-transactions/{transaction_number}/execution-intents不等于已扣款。execution未知仅GET同号/execution，隐藏或禁用重付与解锁，不换号。真实扣款后仍到账待核，中国供应商本人通过/api/v1/payment-transactions/{transaction_number}/beneficiary-receipt-confirmations提交独立到账证据。差异POST funds-reconciliation-differences及其/dispositions、另一人/reviews，未知侧省略而不填0，补账只能追加事实。",
        "expected": "两种付款门禁逐项列证据及缺项；无垫资授信透支换汇。未知锁额保留，扣款和供应商到账分栏。缺付款方授权、正式收费依据或可用余额不足时，本次分账明确阻断；服务费不减少中国供应商合同应付。差异未独立关闭不得放松相关门禁，页面不能编辑余额或旧流水。",
        "test": "同一结算分别选预付及出口后付款，缺同一代理认可、供应商书面确认或出口代理接收时显示各自门禁。付款锁额100.00后模拟银行未知，刷新只查原号且锁额仍100.00。补真实银行扣款但不提供收款方实收，断言仍到账待核。差异经办自复核应拒绝，未知银行侧不显示0，独立复核前仍阻断。"
      },
      {
        "personDays": 2,
        "action": "联调金额精度、并发旧版本、角色字段隔离、未知执行与服务费独立性的前端断言。",
        "logic": "服务费规则已确认：固定CNY 300由D承担，仅在首次获批分账时从D已核验可用余额结算；真实收费仍须D授权及法务/财务确认正式收费依据、票据和收入确认。CNY金额固定两位字符串，拒绝浮点、指数、超精度和隐式舍入；412保留试算及说明，GET最新证据版本后由用户重新确认新键，未知旧请求先原文恢复。资金经办、独立分配复核、结算审批、付款审批、差异复核及供应商收款各按当前权限，不以按钮隐藏代替服务端拒绝。页面按服务端显示真实收费门禁，不另造欠费规则；发票重提不收费，缺付款方授权、收费依据或可用余额不足阻断本次分账；银行费用event11另核凭据和承担方。",
        "expected": "多笔小额求和无误，失败不丢结算草稿；无权字段不出现在响应或页面。重复提交、刷新及原键重放不重复锁额、收费或付款；不可把扣款成功的绿色提示扩散为供应商已收。",
        "test": "累计0.10与0.20显示0.30，提交0.001及1e2应字段拒绝。两页读取同一ETag，先审批一页，旧页再交应412且输入保留。分别以经办人自批、付款方读待审发票、供应商代内部核账应拒绝。在未收费且已核验可用余额1299.99的交易尝试分账：服务费转列300后不能覆盖1000.00货款，不得宣称货款足额；缺授权或收费依据时不收费、不完成本次分账；所有真实银行成功须获准测试证据，否则标未验证。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "FE-08",
      "status": "细化",
      "summary": "七个资金用例分别显示实收、待复核分配、贸易核验、真实可用、三位置、结算、付款执行及供应商到账。服务费按已确认口径单列：付款方承担，首次获批分账转列可用余额300元，发票不收费，供应商合同应付不减。缺证、重复、未知和角色隔离分别联调。",
      "sourceReferences": [
        {
          "path": "交付成果/assets/business-data.js",
          "lineStart": 131,
          "lineEnd": 158,
          "reason": "实际流程N12发票、N13可用、N14净额、N15预付、N16出口后、N17付款到账",
          "sha256": "f4a37559a4f207c4918d9aad7bf57593a63d47e44c6c9cec34ef01ff9c77e33b"
        },
        {
          "path": "交付成果/assets/process-data.js",
          "lineStart": 54,
          "lineEnd": 60,
          "reason": "实际资金协作路径，不能按用例名中的n16直接映射付款到N16",
          "sha256": "37910ef0ab58d2c553203a8e6cf0278cd6b43ae06fd9d5fec5eb7c2caaf78f20"
        },
        {
          "path": "交付成果/assets/step-five-usecases-model.js",
          "lineStart": 99,
          "lineEnd": 107,
          "reason": "冲突证据：旧描述从D可用货款结算300且称N15收费，待统一",
          "sha256": "e84dced883248e2c4ccb67b263e5ded195856f82f104f740bc0a7b256e2161b5"
        },
        {
          "path": "交付成果/assets/step-five-usecases-model.js",
          "lineStart": 359,
          "lineEnd": 372,
          "reason": "同模型后部规则已规定独立服务费、未知锁额和独立到账，与旧描述不一致",
          "sha256": "e84dced883248e2c4ccb67b263e5ded195856f82f104f740bc0a7b256e2161b5"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 22,
          "lineEnd": 76,
          "reason": "24个实际接口、受众、强标签、精度及错误恢复",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 100,
          "lineEnd": 176,
          "reason": "分配、一次独立服务费、银行可用、两种付款分支和差异独审",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/examples/step5/http-examples.json",
          "lineStart": 2,
          "lineEnd": 68,
          "reason": "受限、可用、付款锁额和未决门禁分别返回",
          "sha256": "d56fda61e1ea9cc6feb447c7ac6fafeb337f855a43c756ae40fedb85f0069df9"
        },
        {
          "path": "doc/examples/step5/http-examples.json",
          "lineStart": 622,
          "lineEnd": 681,
          "reason": "缺银行可用证据422且资金桶不变",
          "sha256": "d56fda61e1ea9cc6feb447c7ac6fafeb337f855a43c756ae40fedb85f0069df9"
        }
      ],
      "useCaseIds": [
        "s5-n11-receipt",
        "s5-n12-allocation",
        "s5-n13-invoice-fee",
        "s5-n14-verification-release",
        "s5-n15-settlement",
        "s5-n16-payment",
        "s5-n17-reconciliation"
      ],
      "nodeIds": [
        "N11",
        "N12",
        "N13",
        "N14",
        "N15",
        "N16",
        "N17",
        "N23"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "预付和出口后门禁、独立服务费规则、真实节点及资金岗位矩阵",
          "contract": "doc/步骤五系统用例与接口协议.md；资金用例稳定编号与业务流程节点编号需按语义映射",
          "test": "评审应付不扣服务费、未知不重付及真实流程节点映射"
        },
        {
          "dependencyId": "FE-03",
          "consumes": "银行凭据、发票及费用依据的确切文件和可引用状态",
          "contract": "doc/步骤五系统用例与接口协议.md §2、§4",
          "test": "上传或扫描通过不能生成银行实收、可用或已付结论"
        },
        {
          "dependencyId": "FIN-04",
          "consumes": "贸易核验上下文、真实可用证据、逐范围部分释放和三位置读数",
          "contract": "doc/examples/step5/http-contract.json 中s5-review-context、s5-trade-verification、s5-availability-release、s5-funds-overview",
          "test": "内部通过但无银行可用证据422，部分释放准确且余款受限"
        },
        {
          "dependencyId": "FIN-06",
          "consumes": "结算及独立付款审批、锁额、冻结账号配置版、执行意图及原号",
          "contract": "doc/examples/step5/http-contract.json；上游实收分配、发票和服务费查询随交接明确",
          "test": "审批分人；未知保留锁额只查原号；不重复发起且服务费不冲减应付"
        },
        {
          "dependencyId": "FIN-08",
          "consumes": "银行扣款、供应商到账、独立对账差异及处置复核",
          "contract": "doc/examples/step5/http-contract.json 中s5-payment-read、s5-beneficiary-receipt及s5-difference接口；FIN-07到账证据由FIN-08统筹交接",
          "test": "扣款与到账分开、未知不当0，自处理自复核拒绝；无证解锁不可用"
        }
      ],
      "integrationScenarios": [
        {
          "name": "独立服务费与未知付款锁额并存",
          "setup": "获准测试银行渠道或明确内部合成夹具；经办、独立审批及差异复核分人；中国供应商应付1000.00，付款方已核验可用余额1300.00，授权和正式收费依据齐全，尚未收费。",
          "steps": [
            "提交INVOICE并两次补正，确认没有服务费结算",
            "首次获批分账时按D授权及可用余额结算一次服务费",
            "满足真实货款门禁后试算结算",
            "审批锁额并将原付款置未知，刷新页面",
            "核实银行扣款但不提供供应商到账证据"
          ],
          "assertions": [
            "INVOICE不触发服务费；首次获批分账仅结算一次event12并扣减D可用余额，A合同应付不减少300",
            "未知仅原号查询，不重付、不解锁",
            "银行扣款不显示供应商已收",
            "合成状态夹具不得充当真实银行成功证据"
          ]
        },
        {
          "name": "分配超额及未匹配金额隔离",
          "setup": "隔离测试实收1000.00，同一稳定银行流水，两个资金经办会话及独立复核人",
          "steps": [
            "分别分配600.00与300.00并复核",
            "尝试再分配101.00",
            "不给银行可用证明尝试释放900.00"
          ],
          "assertions": [
            "有效分配900.00加未匹配100.00等于毛额",
            "超额拒绝且原分配不变",
            "缺可用证据保持受限，不把未匹配当本交易可用"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "正式收费前需由法务/财务确认合同或补充协议明确D承担固定CNY 300、首次获批分账时从D已核验可用余额结算，并确认D授权范围、票据及收入确认；未完成前不得启用真实收费。",
          "owner": "资金业务负责人、法务负责人及接口架构负责人",
          "impact": "阻断真实收费启用及相关会计联调；不阻断INVOICE申报、event12规则实现或不收费测试。"
        },
        {
          "question": "固定300元由D承担并在首次获批分账时从已核验可用余额结算的规则已统一。上线前需完成正式收费依据、D授权、票据及收入确认的法务/财务确认；此项不改变A合同应付，也不得恢复INVOICE触发收费。",
          "owner": "资金业务负责人、资金领域开发工程师、产品架构负责人",
          "impact": "阻断收费时点及跨层一致性签收；不允许用旧模型恢复扣货款或付款欠费门禁。"
        },
        {
          "question": "资金用例code命名N12至N17与business-data真实节点标题不同。本稿按真实语义映射：发票N12、核验N13、净额N14、两分支N15/N16、付款到账N17、差异N17/N23。建议统一索引，禁止把s5-n16-payment机械映射成出口后条件N16。",
          "owner": "产品架构负责人、资金业务负责人",
          "impact": "影响追溯和手册节点签收；稳定用例id和资源接口不变。"
        },
        {
          "question": "付款方只读已审有效INVOICE是既有验收要求，但步骤五ExternalFundsService描述本方供应商/收款方，未明确付款方可读查询及待审过滤。建议资金后端和安全岗位冻结其受众、字段和可见版本，不能让前端先取全文再隐藏。",
          "owner": "资金后端工程师、安全开发工程师",
          "impact": "阻断付款方发票真实联调；不阻断资金内部页面及不可见失败测试。"
        },
        {
          "question": "本包直接前置是FIN-04、FIN-06、FIN-08，实际还消费上游实收分配、发票费用及FIN-07到账制品。建议总审计明确这些制品随何包交接，无需将全部资金包设为并行开工的硬依赖。",
          "owner": "项目实施负责人、资金后端工程师",
          "impact": "影响分批联调顺序；不新增本包工作量或改其他包。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "frontend",
      "before": {
        "personDays": 4,
        "baselinePersonDays": 8,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "FE-03",
          "FIN-04",
          "FIN-06",
          "FIN-08"
        ]
      },
      "review": "null 总Agent按用户已确认的新规则修正可用余额、发票不收费及缺授权阻断断言。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s5-n11-receipt",
            "s5-n12-allocation",
            "s5-n13-invoice-fee",
            "s5-n14-verification-release"
          ],
          "nodeIds": [
            "N11",
            "N12",
            "N13",
            "N14"
          ]
        },
        {
          "useCaseIds": [
            "s5-n15-settlement",
            "s5-n16-payment",
            "s5-n17-reconciliation"
          ],
          "nodeIds": [
            "N14",
            "N15",
            "N16",
            "N17",
            "N23"
          ]
        },
        {
          "useCaseIds": [
            "s5-n11-receipt",
            "s5-n12-allocation",
            "s5-n13-invoice-fee",
            "s5-n14-verification-release",
            "s5-n15-settlement",
            "s5-n16-payment",
            "s5-n17-reconciliation"
          ],
          "nodeIds": [
            "N11",
            "N12",
            "N13",
            "N14",
            "N15",
            "N16",
            "N17",
            "N23"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "FE-08-S1",
          "previousAction": "连接实收、分配、发票、独立服务费及三位置读数。",
          "currentIds": [
            "FE-08-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FE-08-S2",
          "previousAction": "实现结算分支、付款审批、原号查单、到账及对账差异。",
          "currentIds": [
            "FE-08-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FE-08-S3",
          "previousAction": "验证金额精度、角色分离及失败后输入保留。",
          "currentIds": [
            "FE-08-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "FE-09": {
    "rationale": "已有手册和离线测试可转成生产页面回归；不重复每包组件测试。",
    "steps": [
      {
        "personDays": 2,
        "action": "按30个手册任务建立69稳定用例的跨页面回归矩阵，在真实测试接口环境执行首次、修订、退回、独审、缺证和原受理恢复。",
        "logic": "矩阵逐项列稳定用例id、真实节点、角色、前置版本、入口、实际HTTP方法、期望状态及可核对资源；合并展示的任务不能漏掉独立用例。步骤一四用例走真实建档接口；合同按一期人工签署核实，物流关务走受控人工；资金使用获准测试银行或真实原件独立核实；证明退税无职责及观察权应阻断；合规有unknown不结案。每次恢复保留原号、键、正文、标签，记录响应及再次GET，不以localStorage或离线按钮状态作服务端证据。",
        "expected": "69用例均有执行结果或具体阻断及人工交接，30任务只是入口分组。报告分别标明真实接口结果、合成门禁验证和未验证外部成功，不能写成全链正常结案通过。",
        "test": "用独立账号沿建档到异常处置选择代表链，故意在提交响应丢失、另一方更新版本、自审、供应商确认改版及付款未知处暂停再恢复；核对服务端只一次受理、无越权、无重付。检查矩阵恰好覆盖八模型69个稳定id且无伪造用例，所有未开渠道成功项标阻断原因及责任人。"
      },
      {
        "personDays": 2,
        "action": "执行桌面和375像素窄屏、键盘、错误定位、未保存离开保护及全名文案的代表性跨页检查。",
        "logic": "在DES-1冻结的浏览器清单执行；仅用键盘完成多商品行编辑、材料失败恢复、独审意见读取、资金原号查询和暂停原因展开。表单有未提交更改时路由离开需提醒，确认提交并刷新服务端后才清除脏标记；浏览器刷新不能承诺保存原始文件字节或敏感草稿。状态、错误及必填不只依赖颜色，错误后焦点可定位，窄屏表格仍能看金额、版本和动作。全称替换业务角色缩写，不改协议路径和稳定id。",
        "expected": "代表任务不依赖鼠标或装饰，375像素宽度仍能读取必要字段及执行动作。取消离开保留输入，选择离开不会被写成已经受理；错误和加载结果可被键盘用户辨识。",
        "test": "桌面及375像素各用Tab、Shift+Tab、Enter、Escape完成代表任务，检查无焦点陷阱及不可达按钮。添加商品行未提交时返回列表，取消离开后输入仍在；同意离开不应生成业务写。制造字段错误、412和未知付款，核对焦点、非颜色文案及原号查询；所有角色名称使用全名。"
      },
      {
        "personDays": 1,
        "action": "按实际界面和测试记录更新对内、对外两份操作手册，组织未参与开发人员按角色完成代表任务并登记阻断。",
        "logic": "对外说明中国供应商和付款方本方操作，不为境外实际收货人造独立账号入口；对内按贸易代理、物流、报关及独审责任分工。每个手册任务列实际按钮、可编辑状态、确切版本、接口失败后的恢复和人工办理责任，任务到稳定用例与真实节点的对应按审计矩阵核对。明确一期仅银行接入，其余人工办理独立核实；二期签署物流通知、三期官方查询不提前开放。已签与生效、受理与放行、扣款与到账、关案与解冻分别写清；保留离线演练与生产系统的区别。",
        "expected": "两份手册入口、按钮名和错误补救与实际页面一致；每项人工交接有接手岗位及完成证据，不以截图或演示状态证明外部成功。",
        "test": "由新操作员按外部手册完成首次提交和冲突修订，内部人员按内册完成退回重审、付款未知查询及单原因解除，逐次对照页面和服务端结果。记录名称不符、缺权限、缺前置及不能继续位置，修正直接相关文案后复走；未开官方通道必须能看出阻断而非误判成功。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "FE-09",
      "status": "细化",
      "summary": "30个手册任务与69个稳定用例不是同一计数。保留本包跨页面真实接口浏览器回归、基本可用性和两份手册验收三项，逐用例记录页面或人工交接及断言；不把离线原型、合成官方成功或每包单元测试重复计入验收，也不把工作迁回FE-01。",
      "sourceReferences": [
        {
          "path": "交付成果/assets/process-data.js",
          "lineStart": 3,
          "lineEnd": 11,
          "reason": "八阶段覆盖N01至N23",
          "sha256": "37910ef0ab58d2c553203a8e6cf0278cd6b43ae06fd9d5fec5eb7c2caaf78f20"
        },
        {
          "path": "doc/examples/step8/http-examples.json",
          "lineStart": 2769,
          "lineEnd": 2874,
          "reason": "官方源未知时应拒绝正常结案，不能把设计示例当全链成功",
          "sha256": "e3c6c8580b21b3158b27642470639c43cc1b0853c85cf79089dcf6b7cceef830"
        },
        {
          "path": "doc/步骤一HTTP接口协议.md",
          "lineStart": 174,
          "lineEnd": 190,
          "reason": "无效合成凭据、REST与RPC包装及真实确认联调前提",
          "sha256": "3783a1197e2c7dbbfb42b5fb1a18d9d71c5db69c2aab257fdbe1b7d912b8d1c3"
        }
      ],
      "useCaseIds": [
        "supplier-submit",
        "payer-submit",
        "supplier-edit",
        "payer-edit",
        "basis-submit",
        "basis-review",
        "contract-draft",
        "contract-review",
        "contract-revise",
        "contract-sign",
        "contract-activate",
        "framework-use",
        "customs-authority",
        "shipment-plan",
        "shipment-amend",
        "goods-ready",
        "booking-pickup",
        "transport-progress",
        "logistics-exception",
        "logistics-query",
        "s4-basis",
        "s4-draft",
        "s4-revision",
        "s4-review",
        "s4-confirm",
        "s4-filing",
        "s4-official",
        "s4-correction",
        "s4-attachment",
        "s4-query",
        "s5-n11-receipt",
        "s5-n12-allocation",
        "s5-n13-invoice-fee",
        "s5-n14-verification-release",
        "s5-n15-settlement",
        "s5-n16-payment",
        "s5-n17-reconciliation",
        "s6-preparation",
        "s6-cooperation",
        "s6-materials",
        "s6-review",
        "s6-dispatch",
        "s6-official-receipt",
        "s6-correction",
        "s6-certificate",
        "s6-delivery",
        "s6-receipt",
        "s6-objection",
        "s6-query",
        "s7-prepare",
        "s7-package",
        "s7-review",
        "s7-dispatch",
        "s7-notice",
        "s7-correction",
        "s7-decision",
        "s7-credit",
        "s7-recovery",
        "s8-context",
        "s8-report",
        "s8-assignment",
        "s8-hold",
        "s8-remedy",
        "s8-correction",
        "s8-release",
        "s8-case-close",
        "s8-closure-apply",
        "s8-closure-review",
        "s8-query"
      ],
      "nodeIds": [
        "N01",
        "N02",
        "N03",
        "N04",
        "N05",
        "N06",
        "N07",
        "N08",
        "N09",
        "N10",
        "N11",
        "N12",
        "N13",
        "N14",
        "N15",
        "N16",
        "N17",
        "N18",
        "N19",
        "N20",
        "N21",
        "N22",
        "N23"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "69用例与30任务映射、浏览器清单、真实与合成验证分类、一期人工边界",
          "contract": "交付成果/assets/product-guide-model.js；八阶段系统用例文档；两份操作手册",
          "test": "按稳定id核对69项无漏项，不以30入口计作69次独立成功"
        },
        {
          "dependencyId": "FE-02",
          "consumes": "双方首次及修订、精确输入、ETag冲突及原号恢复页面",
          "contract": "doc/examples/step1/http-contract.json；doc/examples/step1/http-examples.json",
          "test": "浏览器实际请求能核对一交易、本方字段和原受理"
        },
        {
          "dependencyId": "FE-04",
          "consumes": "签约依据、三类合同、人工签署核实、框架及授权状态",
          "contract": "doc/examples/step2/http-contract.json；人工签署契约冻结后接入",
          "test": "独审分人、改版失效、已签未生效及旧有效版保留"
        },
        {
          "dependencyId": "FE-05",
          "consumes": "批次分配、运输与异常、书面确认、人工报关和双收件方",
          "contract": "doc/examples/step3/http-contract.json；doc/examples/step4/http-contract.json",
          "test": "超量拒绝、出境缺放行阻断、改稿重新书面确认及错收件方拒绝"
        },
        {
          "dependencyId": "FE-06",
          "consumes": "证明和退税准备、材料版、独审、人工办理及无观察权提示",
          "contract": "doc/examples/step6/http-contract.json；doc/examples/step7/http-contract.json",
          "test": "职责未知不正式办理、证明本人核对、税务结果不当到账"
        },
        {
          "dependencyId": "FE-07",
          "consumes": "逐项报告、完整源集合、暂停解除和正常结案界面",
          "contract": "doc/examples/step8/http-contract.json；doc/examples/step8/compliance-decision-contract.json",
          "test": "unknown阻断、新增对象使旧报告过期，关案不解冻"
        },
        {
          "dependencyId": "FE-08",
          "consumes": "资金三位置、服务费、分配复核、结算付款原号及差异独审",
          "contract": "doc/examples/step5/http-contract.json；doc/examples/step5/http-examples.json",
          "test": "银行可用与内部核验分开、服务费不扣款、未知不重付不解锁"
        }
      ],
      "integrationScenarios": [
        {
          "name": "新操作员按手册恢复跨页失败链",
          "setup": "隔离真实测试接口；新操作员分配中国供应商、付款方及不同内部审核账号；延迟创建响应并准备412、自审和银行未知注入点",
          "steps": [
            "按外册预留并首次提交，响应丢失后恢复",
            "另一方修改版本后按手册修订",
            "内部按内册退回重开并重新送审",
            "付款未知时退出再按原号查询",
            "窄屏仅键盘读取暂停原因并提出单原因解除"
          ],
          "assertions": [
            "每步页面与服务端状态对应，交易和付款无重复",
            "输入保留及恢复操作无需开发人员口头补充",
            "独审与权限拒绝可理解，不提供重付或无证解锁",
            "手册中的外部成功必须有真实证据，未开通项明确阻断"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "当前仓库交付静态协议及原型，没有生产前端测试服务。建议实施负责人冻结可用测试部署地址、账号角色、数据复位方式及浏览器运行入口；不编造现成端到端测试命令。",
          "owner": "测试负责人、项目实施负责人、运维工程师",
          "impact": "阻断真实接口浏览器执行；本稿定义的矩阵、断言及手册修订范围可先签收。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "frontend",
      "before": {
        "personDays": 2.5,
        "baselinePersonDays": 5,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "FE-02",
          "FE-04",
          "FE-05",
          "FE-06",
          "FE-07",
          "FE-08"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit",
            "supplier-edit",
            "payer-edit",
            "basis-submit",
            "basis-review",
            "contract-draft",
            "contract-review",
            "contract-revise",
            "contract-sign",
            "contract-activate",
            "framework-use",
            "customs-authority",
            "shipment-plan",
            "shipment-amend",
            "goods-ready",
            "booking-pickup",
            "transport-progress",
            "logistics-exception",
            "logistics-query",
            "s4-basis",
            "s4-draft",
            "s4-revision",
            "s4-review",
            "s4-confirm",
            "s4-filing",
            "s4-official",
            "s4-correction",
            "s4-attachment",
            "s4-query",
            "s5-n11-receipt",
            "s5-n12-allocation",
            "s5-n13-invoice-fee",
            "s5-n14-verification-release",
            "s5-n15-settlement",
            "s5-n16-payment",
            "s5-n17-reconciliation",
            "s6-preparation",
            "s6-cooperation",
            "s6-materials",
            "s6-review",
            "s6-dispatch",
            "s6-official-receipt",
            "s6-correction",
            "s6-certificate",
            "s6-delivery",
            "s6-receipt",
            "s6-objection",
            "s6-query",
            "s7-prepare",
            "s7-package",
            "s7-review",
            "s7-dispatch",
            "s7-notice",
            "s7-correction",
            "s7-decision",
            "s7-credit",
            "s7-recovery",
            "s8-context",
            "s8-report",
            "s8-assignment",
            "s8-hold",
            "s8-remedy",
            "s8-correction",
            "s8-release",
            "s8-case-close",
            "s8-closure-apply",
            "s8-closure-review",
            "s8-query"
          ],
          "nodeIds": [
            "N01",
            "N02",
            "N03",
            "N04",
            "N05",
            "N06",
            "N07",
            "N08",
            "N09",
            "N10",
            "N11",
            "N12",
            "N13",
            "N14",
            "N15",
            "N16",
            "N17",
            "N18",
            "N19",
            "N20",
            "N21",
            "N22",
            "N23"
          ]
        },
        {
          "useCaseIds": [
            "supplier-submit",
            "supplier-edit",
            "contract-review",
            "s4-confirm",
            "s5-n16-payment",
            "s8-release"
          ],
          "nodeIds": [
            "N01",
            "N02",
            "N03",
            "N04",
            "N08",
            "N17",
            "N23"
          ]
        },
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit",
            "supplier-edit",
            "payer-edit",
            "basis-submit",
            "basis-review",
            "contract-sign",
            "contract-activate",
            "s4-confirm",
            "s4-filing",
            "s4-official",
            "s4-attachment",
            "s5-n16-payment",
            "s6-dispatch",
            "s6-receipt",
            "s7-dispatch",
            "s7-credit",
            "s8-release",
            "s8-case-close",
            "s8-closure-review"
          ],
          "nodeIds": [
            "N01",
            "N02",
            "N03",
            "N04",
            "N08",
            "N09",
            "N17",
            "N19",
            "N20",
            "N21",
            "N22",
            "N23"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "FE-09-S1",
          "previousAction": "把30任务关键交互整理为真实接口浏览器测试。",
          "currentIds": [
            "FE-09-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FE-09-S2",
          "previousAction": "检查桌面、窄屏、键盘、未保存保护及全名文案。",
          "currentIds": [
            "FE-09-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FE-09-S3",
          "previousAction": "将实际按钮、状态和人工交接同步至两份手册。",
          "currentIds": [
            "FE-09-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "FE-10": {
    "rationale": "第二期保留原9人日，不在本轮重估；只补执行步骤。",
    "steps": [
      {
        "personDays": 3,
        "action": "在一期合同详情增加实名签署请求、本人会话跳转、返回后原任务查询和过期会话恢复。",
        "logic": "仅确切待签版4且无活跃未知任务时POST /api/v1/contracts/{contract_number}/revisions/{revision_number}/signature-requests；201只本地持久，GET /api/v1/signature-requests/{signature_request_id}读取task_version强ETag。本人POST该任务/signing-sessions仅传白名单本地returnRoute，GET /api/v1/signing-sessions/{signing_session_id}为ready才使用受控短期redirectUrl。state/nonce、域名白名单按平台与后端冻结契约核对；URL不写日志或本地持久草稿。会话expired新键新确认申请本人新会话，不新建法律签署任务。返回只查原任务，轮询至少30秒且服从平台频率；archived且合同GET显示证据核实后才已签，activation-decisions仍独立。412保留用户位置重新读，未知不换引用。",
        "expected": "pending_dispatch、dispatch_unknown、awaiting_signers、verifying、archived、rejected、manual_action可辨识；跳回不显示已签或已生效。本人可恢复同一任务，无权签署人拿不到跳转能力，未完成归档持续待核。",
        "test": "任务201后个人会话先pending再ready，检查ready前无跳转。使用非法returnRoute、其他签署人账号及过期会话应拒绝或明确expired；新会话仍属原signature_request_id。平台返回页面但延迟证据归档，应仍待核，之后显示已签但未生效。重复打开返回页不再POST新签署请求。"
      },
      {
        "personDays": 3,
        "action": "在现有批次及待办详情增加自动物流来源、通知投递状态和受控人工接管入口。",
        "logic": "物流仍以GET /api/v1/shipments/{shipment_number}及证据提交、审查结果表示业务事实，新增渠道来源、原事件键、发生及核实时间、对应区段和映射结果仅消费INT-06冻结的只读投影，不让浏览器调用渠道回调。短信邮件展示收件对象脱敏、模板版、投递状态、attemptCount、nextAttemptAt和最后错误所需字段，实际名称及路径由INT-07冻结。投递成功不改审批或运输状态；失败仍可进入原站内任务。人工接管带原渠道任务及业务引用，服务端未明确无重复执行风险时不得新建同一事实，原未知签署仅查询。失败保留筛选及原任务位置。",
        "expected": "同一批次可看到人工或渠道来源且旧历史不被替换；通知失败有重试或人工联系提示，但站内待办不丢。运输缺同批放行仍阻断，不因收到物流消息变放行或签收。",
        "test": "返回一条已核实物流事件和一条迟到待核事件，核对来源和区段分别显示、进度不倒退。模拟短信邮件连续失败，检查原任务可继续处理且审批状态未变；关闭渠道后打开一期人工入口，仍带原批次及任务号。缺正式放行时自动启运通知也不能推进出境。"
      },
      {
        "personDays": 3,
        "action": "联调重复与异文回调、迟到旧版结果、证据归档失败及人工自动切换的前端增量。",
        "logic": "由渠道测试端注入回调，前端仅GET原任务及领域结果；同providerEventId异文409隔离，不自行忽略。旧合同版真实签署结果保留法律证据并告警，不推进新版；同一人工与自动物流事件去重，接管前服务端核实原执行。verifying失败持续原任务恢复，不能用新签署绕过。测试不复制一期表单检查，只断言新增渠道交互和原人工能力保持。",
        "expected": "重复不产生第二合同签署或运输事实，旧版不覆盖新版；未知与manual_action显示原任务和接手岗位。通知成功不把业务标完成，通道故障不影响已核实一期数据。",
        "test": "重复发送同一平台事件两次、再同键异文，浏览器刷新核对一次业务推进及冲突告警。让旧版签署结果迟到，检查新工作版不被标已签；模拟归档失败维持verifying。原任务未知时点击人工接管应阻断新执行，明确终态后再接管沿原关联，不产生第二事件。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "FE-10",
      "status": "细化",
      "summary": "二期只增加签署会话、原任务恢复、物流来源和通知失败接管，不重建一期表单。明确201签署请求、个人会话ready、浏览器返回、证据归档和合同生效的区别；物流及短信邮件浏览器查询契约尚缺，列具体冻结字段和防重复人工切换条件。",
      "sourceReferences": [
        {
          "path": "doc/步骤二系统用例与接口协议.md",
          "lineStart": 39,
          "lineEnd": 50,
          "reason": "签署任务状态、本人会话、白名单跳转、原任务恢复及证据核实",
          "sha256": "309fb3369cd0cde8dcda7f2b1878fd1cb1518505439e5d38b418ce419fd98102"
        },
        {
          "path": "doc/步骤二系统用例与接口协议.md",
          "lineStart": 52,
          "lineEnd": 99,
          "reason": "签署资源及会话GET、强ETag、错误和轮询限制",
          "sha256": "309fb3369cd0cde8dcda7f2b1878fd1cb1518505439e5d38b418ce419fd98102"
        },
        {
          "path": "doc/examples/step2/http-examples.json",
          "lineStart": 1225,
          "lineEnd": 1256,
          "reason": "ready签署会话只提供短期redirectUrl及expiresAt，不是签署成功",
          "sha256": "17e526ec7453c56ebe61ad5a9b8d775fb0bd6d2e505b2ac76ba312bf5386da53"
        },
        {
          "path": "doc/步骤三系统用例与接口协议.md",
          "lineStart": 61,
          "lineEnd": 75,
          "reason": "物流来源、已核实区段顺序、同批放行及异常不可跳过",
          "sha256": "bed3e39150278fba4db2d78386f6de645a89f8c0dd863ef28e37254b5400d339"
        }
      ],
      "useCaseIds": [
        "contract-sign",
        "contract-activate",
        "transport-progress"
      ],
      "nodeIds": [
        "N02",
        "N03",
        "N04",
        "N10"
      ],
      "inputs": [
        {
          "dependencyId": "DES-2",
          "consumes": "二期通道开关、白名单、增量状态与人工切换规则",
          "contract": "交付成果/assets/work-breakdown.js 二期范围；平台state/nonce与本地returnRoute回传契约待冻结",
          "test": "逐通道关闭后原一期页面仍能处理，未知任务没有并行新执行"
        },
        {
          "dependencyId": "INT-05",
          "consumes": "signature_request_id、clientReference、task_version、本人会话、过期及归档核实状态",
          "contract": "doc/examples/step2/http-contract.json；doc/步骤二系统用例与接口协议.md §3",
          "test": "真实平台测试跳回后仍查原任务，归档未核实不显示已签"
        },
        {
          "dependencyId": "INT-06",
          "consumes": "受托批次区段、原事件键、人工自动来源、核实与拒绝结果",
          "contract": "doc/examples/step3/http-contract.json；渠道来源字段、查询投影及人工接管入口待冻结",
          "test": "重复乱序不重复推进，同批放行门禁保留，旧人工来源可追溯"
        },
        {
          "dependencyId": "INT-07",
          "consumes": "脱敏收件人、模板版、投递状态、失败原因、重试预算及原站内待办引用",
          "contract": "浏览器投递记录查询、受控重试及接管HTTP契约尚未定义，由消息集成工程师冻结；不发明/sms或/email接口",
          "test": "模拟失败可看错误和下一动作，成功不改业务，越权收件人信息不返回"
        },
        {
          "dependencyId": "FE-09",
          "consumes": "已验收一期合同物流及人工交接页面、跨页回归和手册基线",
          "contract": "两份操作手册及FE-09的69用例回归矩阵",
          "test": "只新增渠道状态及跳转测试，不重复重建一期表单和审核"
        }
      ],
      "integrationScenarios": [
        {
          "name": "浏览器签署返回早于证据归档",
          "setup": "选定平台测试环境，合同待签版4、全部授权签署人及内部有权生效人员；可延迟回调和归档",
          "steps": [
            "创建签署请求及本人会话，ready后跳转",
            "从平台返回但延迟原件归档",
            "重复通知并令旧版通知迟到",
            "恢复原任务归档，再由有权人员单独确认生效"
          ],
          "assertions": [
            "返回时仍待核，签署请求不重复创建",
            "归档失败verifying不变已签",
            "旧版结果保留证据但不推进新版本",
            "已签与生效分别显示"
          ]
        },
        {
          "name": "通知失败不丢物流待办",
          "setup": "同批已有一期人工事件，物流通道开启，通知通道可注入投递失败",
          "steps": [
            "渠道回传同一事实并重复一次",
            "让关联通知失败",
            "关闭物流通道后进入原人工任务"
          ],
          "assertions": [
            "同一事实仅推进一次且来源历史保留",
            "通知失败不回退或完成业务状态",
            "人工页面保留批次及原任务，未知执行不另建事实"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "INT-06来源投影及人工接管、INT-07投递记录与重试/接管没有浏览器HTTP清单。建议先冻结角色字段、原任务关联、状态、分页、错误和重试权限；本稿字段是交接要求，不宣称已有协议。",
          "owner": "物流集成工程师、消息集成工程师、产品架构负责人",
          "impact": "阻断物流来源与通知增量真实联调；签署既有资源及一期页面可先接。"
        },
        {
          "question": "平台尚未正式选型，签署跳转state/nonce校验与returnRoute返回载体需与INT-05确认；不能直接套某厂商路径或把示例redirectUrl当真实链接。",
          "owner": "签署集成工程师、安全开发工程师",
          "impact": "阻断实际平台跳转验收，不阻断任务、会话状态及过期恢复组件。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "frontend",
      "before": {
        "personDays": 4.5,
        "baselinePersonDays": 9,
        "subtaskCount": 3,
        "dependencies": [
          "DES-2",
          "INT-05",
          "INT-06",
          "INT-07",
          "FE-09"
        ]
      },
      "review": "对照步骤二第39至50行，核对签署请求201、本人会话ready、浏览器返回、证据归档及合同生效分别呈现；未知任务不新建，旧版签署迟到保留法律证据。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "contract-sign",
            "contract-activate"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04"
          ]
        },
        {
          "useCaseIds": [
            "transport-progress",
            "contract-sign"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04",
            "N10"
          ]
        },
        {
          "useCaseIds": [
            "contract-sign",
            "contract-activate",
            "transport-progress"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04",
            "N10"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "FE-10-S1",
          "previousAction": "实现实名签署跳转及原任务恢复。",
          "currentIds": [
            "FE-10-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FE-10-S2",
          "previousAction": "展示物流来源、通知失败和人工接管。",
          "currentIds": [
            "FE-10-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FE-10-S3",
          "previousAction": "验证重复回调、未知和人工切换。",
          "currentIds": [
            "FE-10-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "FE-11": {
    "rationale": "第三期保留原10人日，不在本轮重估。",
    "steps": [
      {
        "personDays": 4,
        "action": "在一期人工办理详情增加正式海关、证明及退税渠道结果、来源证据和原号恢复入口。",
        "logic": "关务经办继续使用/api/v1/customs-declarations/{declaration_number}/filing-requests及原request_number GET，来源由INT-08验证后投影，execution未知只查原号。更正保留原办理、新资料版独审及中国供应商重新书面确认；受理与放行、撤回意图与正式撤回分别列示。证明继续用/api/v1/tax-proof-cases/{tax_case_number}/dispatch-intents/{dispatch_reference}、history及command-results读取正式核实结论；退税用/api/v1/tax-refund-cases/{tax_case_number}/operations/{operation_number}、案件和确切提交版，INT-09回执绑定原版及来源稳定键。浏览器不能直接写验签结果或主管回调。先显示本地受理、正式提交、机关受理、处理中和终局，银行实收继续BL-13/资金权威独立核对；技术503或超时保留原键原文和当前输入，不另号派发。",
        "expected": "来源渠道、原办理号、提交版、官方参考号、核实时间及缺项可追溯。海关正式受理不显示放行，证明签发不显示供应商已核对，退税终局不显示银行到账。正式渠道关闭可回原人工详情，但未知执行不允许并行人工重办。",
        "test": "在获准官方测试环境依次返回申报已提交、受理、放行或证明签发，检查只有对应阶段变化；不给供应商接收及银行证据时相应状态仍待核。让办理响应丢失，重新进入查原号确认无第二请求。正式更正新资料版缺重新独审或书面确认时拒绝；旧版回执不得推进新版。"
      },
      {
        "personDays": 3,
        "action": "新增按当前企业及许可范围查询商品编码、申报要素和本企业有权申报信息的页面，显示来源、规则版和数据时效。",
        "logic": "此为INT-10授权查询能力，没有专用稳定用例id，不伪造业务用例。以共用支撑关联s4-query、s6-query、s7-recovery：关务经办在N07准备和N09申报历史读取中查看有权商品编码、要素及本企业申报来源；证明经办在N19/N20、退税经办在N21读取既有案件时，对照其材料引用的同一申报号和确切版本。税务案件、证明与原办理结果仍由各自既有接口读取，关务查询不新增税务数据范围。共用支撑，不冒用历史查询作为关务资料查询契约；只消费DES-3及INT-10另行冻结的查询HTTP接口、允许过滤项、分页、返回字段和错误。企业范围由服务端授权，不信任任意输入企业号；查询请求关联当前组织及授权状态。每次切换企业、撤权或到期清理原结果，异步返回须匹配当前企业、查询条件和请求序号才展示。显示来源、来源版本、观测时间、有效期和过期提示；缓存不可跨企业。无授权不取数据，过期结果不作正式归类或申报结论。",
        "expected": "有权用户只见许可范围内字段及来源时效，无权企业返回拒绝而非空成功或部分泄露。查询结果不能替代归类判断、正式申报、放行或付款证据；没有下载和全企业导出旁路。",
        "test": "用分别只授权企业甲、企业乙的账号查询同一商品或申报号，断言响应和页面均无他企信息。从s4-query、s6-query及s7-recovery对应页面读取现有申报或材料引用，再经独立关务查询入口对照同一申报号和确切版本；断言原历史接口未被当作关务资料查询接口，税务案及原办理结果未被查询结果覆盖。令来源过期，检查过期及更新时间而非默认最新；撤销授权后重查和返回旧页都不能继续展示受限内容。先发甲查询再切乙，释放甲迟到响应，断言乙页面没有甲数据。接口未冻结时仅签收测试定义，不虚构已运行查询。"
      },
      {
        "personDays": 3,
        "action": "联调无渠道、许可撤销、旧版和跨企业迟到结果及人工自动切换，验证一期证据和资金控制不被三期增量覆盖。",
        "logic": "海关税务证书或企业许可撤销立即停止新自动办理及查询，展示原任务待核与接手岗位；已有外部执行未知先原号核实，不能以通道关闭认定未提交。回执按确切批准版、计划版、申报或税务材料版隔离，旧版真实证据保留历史不推进当前版。查询超时不显示无记录，保留脱敏诊断及可重试读取，撤权清除受限结果；后台是否继续查单按渠道授权策略，不由页面重发。资金到账仍独立权威，合规unknown仍阻断正常结案。",
        "expected": "故障、无许可、业务拒绝和结果未知各有明确补救；一期人工历史保留且不会产生双份正式办理。旧结果不能回退状态或覆盖新版，未知实收不被官方成功涂成已到账。",
        "test": "关闭官方渠道后在原办理未知时点击人工接管，断言无新dispatch；撤销查询授权检查新请求拒绝且旧结果不可再看。向新资料版返回旧版正式回执及同源异文，断言历史保留或冲突隔离、当前状态不变。重复同一真实测试回执后检查一次领域推进；无正式测试许可时只执行失败路径并记录成功未验证。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "FE-11",
      "status": "细化",
      "summary": "三期增量只关联正式办理、回执、补正、确切版查询及恢复，不机械继承步骤四、六、七全部草稿用例。授权关务信息查询没有专用稳定用例，第2子任务以共用支撑关联s4-query、s6-query和s7-recovery，帮助读取有权申报来源并对照证明、退税材料中的申报引用；不冒用历史查询作为关务资料查询契约，不扩展为税务资料库查询。明确企业授权、来源时效、撤权清理、旧版迟到隔离与人工回退。",
      "sourceReferences": [
        {
          "path": "doc/步骤四系统用例与接口协议.md",
          "lineStart": 37,
          "lineEnd": 82,
          "reason": "原办理号、提交受理放行、正式更正撤回及版本错误",
          "sha256": "eaf6e283e192ee40ef03978d2fb4945853c01d1713eba11df41922b47a544d69"
        },
        {
          "path": "doc/步骤六系统用例与接口协议.md",
          "lineStart": 30,
          "lineEnd": 62,
          "reason": "证明正式职责、回执核实、交接不省略及未知原号",
          "sha256": "c80e0ceb5b024eacc205546ce30739d4118ec98c8ffcc6bd960584142b91d409"
        },
        {
          "path": "doc/步骤七系统用例与接口协议.md",
          "lineStart": 19,
          "lineEnd": 61,
          "reason": "退税正式进度、补正与独立银行实收",
          "sha256": "8b9b0d38e55742d3a1f3de0654513e94ace510722685acdfbc2ea6bea6fc41ab"
        },
        {
          "path": "doc/examples/step4/http-examples.json",
          "lineStart": 2,
          "lineEnd": 53,
          "reason": "正式渠道前置缺项可读，不凭已有草稿推定授权",
          "sha256": "5aff4f1b2abd3a37f6fba7c2b7ee865a575d5c1f5a11743ceccd990b808beeb7"
        },
        {
          "path": "doc/examples/step7/http-examples.json",
          "lineStart": 593,
          "lineEnd": 645,
          "reason": "退税银行观察不可用时仍拒绝到账核对",
          "sha256": "0b21196d2ca6a97a120e927fd825c3b7d9143fa4d0aa09ee8bef499e326f2826"
        }
      ],
      "useCaseIds": [
        "s4-filing",
        "s4-official",
        "s4-correction",
        "s4-query",
        "s6-dispatch",
        "s6-official-receipt",
        "s6-correction",
        "s6-certificate",
        "s6-query",
        "s7-dispatch",
        "s7-notice",
        "s7-correction",
        "s7-decision",
        "s7-recovery"
      ],
      "nodeIds": [
        "N07",
        "N08",
        "N09",
        "N19",
        "N20",
        "N21",
        "N23"
      ],
      "inputs": [
        {
          "dependencyId": "DES-3",
          "consumes": "官方渠道及查询数据许可、申请职责范围、自动人工切换、来源时效和错误展示",
          "contract": "交付成果/assets/work-breakdown.js 三期范围；具体渠道及查询契约待主管许可和方案冻结",
          "test": "逐渠道核对授权主体、范围和版本，未确认项明确阻断不作上线承诺"
        },
        {
          "dependencyId": "INT-08",
          "consumes": "海关正式请求及原号、回执映射、真实来源、确切申报版及更正撤回",
          "contract": "doc/examples/step4/http-contract.json；官方适配字段与既有投影映射由INT-08交接",
          "test": "技术失败不当正式退单，未知只查原号，受理不当放行且供应商书面确认保留"
        },
        {
          "dependencyId": "INT-10",
          "consumes": "企业授权查询、商品编码及申报要素、来源版本、观测与到期、限流和审计",
          "contract": "查询HTTP路径、请求白名单、分页、字段过滤、授权失效和时效语义尚未定义，须INT-10冻结；不借用s4-query充数",
          "test": "有权本企查询、他企拒绝、过期提示、撤权清理及迟到响应隔离"
        },
        {
          "dependencyId": "FE-10",
          "consumes": "渠道状态、原任务恢复、来源展示和人工接管通用交互",
          "contract": "doc/步骤二系统用例与接口协议.md 原任务和能力到期模式；三期按所属资源契约适配",
          "test": "复用交互不复用签署授权，官方渠道各自核权且不重建一期表单"
        },
        {
          "dependencyId": "INT-09",
          "consumes": "证明及退税正式职责、原dispatch、确切材料版、受理补正终局及验证来源",
          "contract": "doc/examples/step6/http-contract.json；doc/examples/step7/http-contract.json；主管适配映射由INT-09交接",
          "test": "证明和退税不串案、旧版不绑新申请，税务结果不写银行到账"
        }
      ],
      "integrationScenarios": [
        {
          "name": "三期回执迟到与银行观察缺失",
          "setup": "获准主管测试渠道；同一申报或税务案两资料版，内部独立核实角色，供应商银行观察不可用",
          "steps": [
            "对版1建立原办理并模拟超时",
            "按规定更正形成版2，向系统送达版1迟到回执",
            "重复版1回执并关闭通道，尝试人工另办",
            "对税务正式终局读取到账及结案条件"
          ],
          "assertions": [
            "旧回执只保留版1证据，不推进版2",
            "重复不重复写事实，未知不另号人工重办",
            "正式终局与到账分别显示，银行观察缺失仍未核实",
            "完整源不齐不能正常结案"
          ]
        },
        {
          "name": "授权企业切换时的查询响应隔离",
          "setup": "查询接口冻结后，两个企业各自授权账号；可延迟甲查询并使数据过期",
          "steps": [
            "企业甲发起查询后切换到企业乙",
            "返回甲迟到数据",
            "撤销乙许可并返回旧缓存页",
            "恢复合法许可后查询过期来源"
          ],
          "assertions": [
            "乙页面不显示甲结果，服务端不返回越权字段",
            "撤权后旧结果清理，不把缓存当授权",
            "过期结果有来源及时间标记，不用作正式申报判断"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "INT-10尚无查询HTTP协议及稳定业务用例。建议只作为授权共用能力冻结路径、企业对象权限、字段分页、来源版本、时效、撤权及限流；是否补独立业务用例由总审计确认，本稿不造id。",
          "owner": "关务集成工程师、产品架构负责人、安全开发工程师",
          "impact": "阻断授权查询真实联调；正式办理既有资源的页面增量不受影响。"
        },
        {
          "question": "海关与税务正式渠道、证书、办理职责及测试许可尚未确认，现有示例明确不是官方成功链。建议INT-08及INT-09提供正式映射、测试证据及自动人工切换条件，资金实收继续独立授权观察。",
          "owner": "关务业务负责人、税务业务负责人、关务集成工程师、税务集成工程师",
          "impact": "阻断正式提交受理放行及税务终局成功验收；无通道、撤权、旧版隔离和原号恢复可先验证。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "frontend",
      "before": {
        "personDays": 5,
        "baselinePersonDays": 10,
        "subtaskCount": 3,
        "dependencies": [
          "DES-3",
          "INT-08",
          "INT-10",
          "FE-10",
          "INT-09"
        ]
      },
      "review": "抽查发现独立关务查询子任务缺用例关联，已退回原Agent补齐真实受益读取用例与流程节点；明确共用支撑不冒用申报历史接口，不虚构专用用例及查询契约。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s4-filing",
            "s4-official",
            "s4-correction",
            "s4-query",
            "s6-dispatch",
            "s6-official-receipt",
            "s6-correction",
            "s6-certificate",
            "s6-query",
            "s7-dispatch",
            "s7-notice",
            "s7-correction",
            "s7-decision",
            "s7-recovery"
          ],
          "nodeIds": [
            "N07",
            "N08",
            "N09",
            "N19",
            "N20",
            "N21",
            "N23"
          ]
        },
        {
          "useCaseIds": [
            "s4-query",
            "s6-query",
            "s7-recovery"
          ],
          "nodeIds": [
            "N07",
            "N09",
            "N19",
            "N20",
            "N21"
          ]
        },
        {
          "useCaseIds": [
            "s4-filing",
            "s4-official",
            "s4-correction",
            "s4-query",
            "s6-dispatch",
            "s6-official-receipt",
            "s6-certificate",
            "s6-query",
            "s7-dispatch",
            "s7-notice",
            "s7-decision",
            "s7-recovery"
          ],
          "nodeIds": [
            "N07",
            "N08",
            "N09",
            "N19",
            "N20",
            "N21",
            "N23"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "FE-11-S1",
          "previousAction": "连接正式海关、证明和退税回执与原号恢复。",
          "currentIds": [
            "FE-11-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FE-11-S2",
          "previousAction": "实现授权关务查询范围、来源及过期提示。",
          "currentIds": [
            "FE-11-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FE-11-S3",
          "previousAction": "验证无渠道、撤权及旧版结果。",
          "currentIds": [
            "FE-11-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "BL-01": {
    "rationale": "现有取号及事务规约可直接转实现；计新增服务与事务，不重复数据库约束建设。",
    "steps": [
      {
        "personDays": 4,
        "action": "接入取号预留并实现供应商首次提交事务。",
        "logic": "消费预留的归属、用途、有效期和tradeNumber；仅供应商首次完整TradeInput可创建交易。先由BL-02恢复原键，同号同文返回原结果，异文拒绝；新写锁预留与交易唯一键，核实CNY、三单确切版本和本方确认后原子保存交易、供应商资料、事件和受理。预留本身不建交易。",
        "expected": "返回同一交易号、修订1及本方URI；失败无空交易，不预建付款方声明。",
        "test": "供应商取得预留后查询交易应不存在；并发提交两次同文只得一笔交易。插入参与方后注入回滚，确认交易及资料均不存在，原预留仍可按规则恢复。"
      },
      {
        "personDays": 4,
        "action": "实现付款方首次提交和双方本方完整替换。",
        "logic": "付款方须已绑定核实主体且交易已存在；每交易仅一份独立声明。PUT使用本方最新资源、强If-Match、新意图确认及原幂等键；供应商修改涉及收货主体或指定付款方且影响已声明关系时409，不能代改付款方原因/关系。旧标签412，缺标签428，失败保留已提交版本。",
        "expected": "本方版本递增且他方私有内容不变；读取按当前主体裁剪，不靠交易号授予权限。",
        "test": "先让付款方声明关系，再由供应商更改影响关系的主体，应409且两份资料不变；并发同标签两次修改只一份生效，越权读取付款方正文拒绝。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "BL-01",
      "status": "细化",
      "summary": "将预取号、供应商原子建单和两方原资源修改分开；补明本方授权、原If-Match、依赖付款关系冲突和事务失败保留。恢复、身份确认及文件处理调用共用包，不在本包重建。",
      "sourceReferences": [
        {
          "path": "doc/examples/step1/http-contract.json",
          "lineStart": 51,
          "lineEnd": 68,
          "reason": "CreateTrade的POST路径、TradeInput、Trade资源和201契约",
          "sha256": "45f17fcac549bb3bc133865d4a1759630af7a01b5f4445f3a2698f7691664637"
        },
        {
          "path": "doc/步骤一系统用例与业务规则.md",
          "lineStart": 3,
          "lineEnd": 32,
          "reason": "四个用例、首次供应商提交才建交易及双方分别修改",
          "sha256": "b9e8d335113a7a9fec4573429c5d06733a7b797ce9cdd617f3189df8708cc147"
        },
        {
          "path": "proto/trade/filing/v1/filing.proto",
          "lineStart": 189,
          "lineEnd": 244,
          "reason": "SupplierFiling、PayerFiling、TradeInput及各资源字段",
          "sha256": "a356b4156cfb8e091646d52f5473c50c94f1485f5acb058a0b69af089c639007"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 7,
          "lineEnd": 76,
          "reason": "交易号唯一、参与方角色唯一和修订快照",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/examples/step1/supplier-submit-accepted.json",
          "lineStart": 1,
          "lineEnd": 7,
          "reason": "建单回执处于editing、修订1，不是已批准",
          "sha256": "3ca594ca1a8bba86d13e49e1535fd799e4714f0f42cde268204c98596cf1f392"
        }
      ],
      "useCaseIds": [
        "supplier-submit",
        "payer-submit",
        "supplier-edit",
        "payer-edit"
      ],
      "nodeIds": [
        "N01"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "一期本方字段、人工职责、CNY和首次提交建单决策。",
          "contract": "doc/步骤一系统用例与业务规则.md；设计签字版及版本号待DES-1交付。",
          "test": "按四用例逐项核验字段/角色及禁止运营建单。"
        },
        {
          "dependencyId": "DM-01",
          "consumes": "交易根、参与方快照、内容修订、创建HMAC及唯一键。",
          "contract": "doc/sql/domain/schema.sql:7-100",
          "test": "用同交易号并发插入及事务回滚核验唯一性和无半份资料。"
        },
        {
          "dependencyId": "SEC-02",
          "consumes": "当前主体、受众、本方对象权限和精确意图确认验证结果。",
          "contract": "proto/trade/filing/v1/filing.proto；可信认证上下文交接字段待冻结。",
          "test": "供应商凭据请求付款方资源及撤权后重放均应拒绝。"
        },
        {
          "dependencyId": "BL-02",
          "consumes": "原键同文冻结回执恢复及异文/旧标签分支。",
          "contract": "doc/步骤一身份签名与可靠性设计.md；doc/examples/step1/http-contract.json",
          "test": "提交成功丢响应后换资源现状态，仍恢复首次结果，不再建单。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "付款关系保护与首次提交丢响应",
          "setup": "隔离数据库、供应商与付款方不同主体；使用step1合成材料结构，不使用占位凭据作真实身份。",
          "steps": [
            "供应商取号后首次提交，在COMMIT后丢弃响应",
            "原键原文恢复，再由付款方提交独立关系声明",
            "供应商以最新标签更改关联收货主体"
          ],
          "assertions": [
            "一笔交易且付款方资料只一份",
            "原提交回执保持修订1",
            "关系冲突拒绝且付款方声明、供应商原版均不被覆盖"
          ]
        }
      ],
      "openQuestions": [],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 4,
        "baselinePersonDays": 8,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "DM-01",
          "SEC-02",
          "BL-02"
        ]
      },
      "review": "对照步骤一第9至32行，核对本方写集、同号原子创建、旧标签与付款关系冲突、当前授权先于受理回放，事务失败不留半份交易。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "supplier-submit"
          ],
          "nodeIds": [
            "N01"
          ]
        },
        {
          "useCaseIds": [
            "payer-submit",
            "supplier-edit",
            "payer-edit"
          ],
          "nodeIds": [
            "N01"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "BL-01-S1",
          "previousAction": "实现取号归属、过期处理和首次提交同号原子建单。",
          "currentIds": [
            "BL-01-S1"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-01-S2",
          "previousAction": "实现本方资料读取与完整替换，联动付款关系变化保护。",
          "currentIds": [
            "BL-01-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-01-S3",
          "previousAction": "验证并发首次、原号恢复及强版本冲突。",
          "currentIds": [
            "BL-01-S1",
            "BL-01-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        }
      ]
    }
  },
  "BL-02": {
    "rationale": "恢复协议已有；本包只做可复用机制，领域包只接调用，不各造一套恢复。",
    "steps": [
      {
        "personDays": 3,
        "action": "实现一次共用的原受理登记与回放组件。",
        "logic": "当前身份/受众/对象授权通过后按subject、audience、key定位记录；比较方法、规范路径、原标签、类型化正文HMAC及密钥版本，同键异文409。同文回放冻结resource/Location/ETag及端点规定状态码，不读最新资源拼回执，不重新消费确认；URL含密钥能力不得入回执。",
        "expected": "五组历史查询用例共享恢复能力；撤权即拒绝，业务事件仍由领域事务保存。",
        "test": "保存受理后把领域资源推进一版并使原确认过期；原键同文仍返首次结果，异文409，撤权后不返回冻结敏感内容。"
      },
      {
        "personDays": 2,
        "action": "接入唯一键竞争、提交未知和资源方法差异。",
        "logic": "原键首查为空后，在调用方交易根锁下再查；唯一键冲突/死锁整笔回滚后新事务当前读原键。COMMIT应答未知查询主库；未确定不能换号执行业务。新意图才检查If-Match、当前状态及未消费确认；不为无GET的Location杜撰GET路由。",
        "expected": "重复或超时不重复执行；陈旧新写与已受理重放分别处理，HTTP与RPC错误按实际契约映射。",
        "test": "两个连接同时首查空再竞争同键，断开提交应答后恢复；业务事件及确认消费各一次。请求物流未开放单项GET应405，步骤六恢复按其约定保留原状态码。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "BL-02",
      "status": "细化",
      "summary": "统一原受理恢复的技术顺序，保留各阶段真实HTTP返回差异；明确当前授权先于回放、冻结结果先于新状态判断。技术账本不承载合同、税务或结案领域事实。",
      "sourceReferences": [
        {
          "path": "doc/examples/step6/http-contract.json",
          "lineStart": 171,
          "lineEnd": 188,
          "reason": "证明dispatch-intents输入DispatchInput及原办理资源，不是直接官方成功",
          "sha256": "655fd00fa8ede63e226b65069fcc050df3849310bc0ebc47e5be565525fe6b7d"
        },
        {
          "path": "交付成果/assets/system-usecases-model.js",
          "lineStart": 79,
          "lineEnd": 84,
          "reason": "事务先查、唯一键冲突回滚新事务和持久文件恢复",
          "sha256": "057c7300fb599a9f4c2486873edb53275213e05cc0902e3559097559e57d4e2d"
        },
        {
          "path": "doc/步骤三系统用例与接口协议.md",
          "lineStart": 77,
          "lineEnd": 87,
          "reason": "原键重放200和Location未必支持单项GET",
          "sha256": "bed3e39150278fba4db2d78386f6de645a89f8c0dd863ef28e37254b5400d339"
        },
        {
          "path": "doc/步骤六系统用例与接口协议.md",
          "lineStart": 46,
          "lineEnd": 50,
          "reason": "步骤六原受理保留原状态码、Location、ETag",
          "sha256": "c80e0ceb5b024eacc205546ce30739d4118ec98c8ffcc6bd960584142b91d409"
        },
        {
          "path": "doc/步骤八系统用例与接口协议.md",
          "lineStart": 42,
          "lineEnd": 52,
          "reason": "当前授权、原键查重及根锁后二次当前读",
          "sha256": "e2918d2051a08419256735255787e066a167ecd22e70a9bc29a278378a9c632e"
        }
      ],
      "useCaseIds": [
        "logistics-query",
        "s4-query",
        "s6-query",
        "s7-recovery",
        "s8-query"
      ],
      "nodeIds": [
        "N05",
        "N06",
        "N10",
        "N07",
        "N08",
        "N09",
        "N18",
        "N19",
        "N20",
        "N21",
        "N22",
        "N23"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "受理组件与领域业务记录的归属、逐端点回放状态码和根锁协调表。",
          "contract": "doc/步骤二系统用例与接口协议.md；doc/步骤六系统用例与接口协议.md；冲突决策待冻结。",
          "test": "用同一受理夹具分别跑各端点配置，确认不全局强制200。"
        },
        {
          "dependencyId": "DM-01",
          "consumes": "稳定交易号、根锁及业务版本定位，不要求其实现通用账本。",
          "contract": "doc/sql/domain/schema.sql:7-100；通用受理技术表迁移待DES-1冻结。",
          "test": "两个不同幂等键操作同根，根锁后读到最新版本。"
        },
        {
          "dependencyId": "SEC-02",
          "consumes": "每次恢复时的当前授权、确认绑定验证和可信主体/受众。",
          "contract": "doc/步骤一身份签名与可靠性设计.md",
          "test": "同键跨主体、跨受众及撤权恢复均拒绝且不泄露存在性。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "终态后的原回执与新意图区分",
          "setup": "已完成业务命令及原受理记录，当前资源进入终态，原确认已消费；准备原主体和另一主体。",
          "steps": [
            "原主体原键原文原标签重入",
            "同主体使用新键旧标签写入",
            "另一主体猜原键查询"
          ],
          "assertions": [
            "首个返回首次冻结结果而非终态投影",
            "第二个受版本或终态门禁拒绝",
            "第三个无权，业务事件不新增"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "步骤三、二写明幂等重放200，步骤六写保留原状态码；共用组件必须采用逐端点响应策略。请总Agent协调各层冻结，不能统一改成200或201。",
          "owner": "接口架构负责人",
          "impact": "阻断通用回放HTTP配置最终验收，不阻断原键去重和领域恢复实现。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 2.5,
        "baselinePersonDays": 5,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "DM-01",
          "SEC-02"
        ]
      },
      "review": "总Agent逐项核对原工作与新步骤：实现一次共用的原受理登记与回放组件。；接入唯一键竞争、提交未知和资源方法差异。原独立测试并入对应步骤，正常、失败及恢复判定仍保留，未删除功能或减少控制，不调整预算。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "logistics-query",
            "s4-query",
            "s6-query",
            "s7-recovery",
            "s8-query"
          ],
          "nodeIds": [
            "N05",
            "N06",
            "N10",
            "N07",
            "N08",
            "N09",
            "N18",
            "N19",
            "N20",
            "N21",
            "N22",
            "N23"
          ]
        },
        {
          "useCaseIds": [
            "logistics-query",
            "s4-query",
            "s6-query",
            "s7-recovery",
            "s8-query"
          ],
          "nodeIds": [
            "N05",
            "N06",
            "N10",
            "N07",
            "N08",
            "N09",
            "N18",
            "N19",
            "N20",
            "N21",
            "N22",
            "N23"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "BL-02-S1",
          "previousAction": "实现原请求标识、载荷摘要、首次响应持久化及强版本校验。",
          "currentIds": [
            "BL-02-S1"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-02-S2",
          "previousAction": "实现重试重新授权、主库查原受理及到期错误映射。",
          "currentIds": [
            "BL-02-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-02-S3",
          "previousAction": "提供重复、异文、未知及撤权后的契约测试。",
          "currentIds": [
            "BL-02-S1",
            "BL-02-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        }
      ]
    }
  },
  "BL-03": {
    "rationale": "RustFS与ClamAV本机验证已有，应用上传授权和元数据一致性尚未实现。",
    "steps": [
      {
        "personDays": 4,
        "action": "接入私有上传资源及确切版本扫描确认。",
        "logic": "输入所属预留/交易、文件用途、预期长度和SHA256，保存稳定暂存键、最终键及文件号后发短期地址。确认原上传意图，事务外读取固定VersionId真实字节和扫描结果；仅长度、摘要、用途、版本一致且clean才建立不可变文件修订。扫描器/病毒库版本和时效按批准策略核验，过期、未知、超时不确认；未就绪可恢复，感染或摘要冲突永久拒绝。",
        "expected": "上传成功不等于可引用；完成后得到逻辑文件号、修订及摘要，业务审核状态不变。",
        "test": "同对象键上传两个版本，扫描旧版后切换latest；确认必须仍指向旧确切版或拒绝，不得引用未扫描新版。感染文件、病毒库过期及扫描超时均不能建立正式文件引用。"
      },
      {
        "personDays": 4,
        "action": "接入持久任务恢复与每次读取授权。",
        "logic": "复用原键恢复与数据库任务租约/栅栏；扫描、复制、写元数据各阶段可重入，固定最终键存在时逐项比对，不盲覆盖。浏览器退出后后台恢复，8次/24小时预算耗尽告警；读元数据与签名下载地址都实时核本方/用途授权，敏感地址不进入原回执。",
        "expected": "进程重启不丢确认意图，旧worker不能写终态；旧证据不覆盖、无权不得下载。",
        "test": "复制完成元数据提交前停止处理器，重启恢复只得一份文件修订；让旧租约处理器迟到写入应被栅栏拒绝；撤权后刷新原签名地址请求拒绝。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "BL-03",
      "status": "细化",
      "summary": "把上传、确切对象扫描、持久确认和每次查看授权串成一个文件用例；只建设一次恢复任务，合同、关务和税务消费文件引用及扫描结论，不重复扫描基础设施。",
      "sourceReferences": [
        {
          "path": "doc/examples/step1/http-contract.json",
          "lineStart": 267,
          "lineEnd": 284,
          "reason": "原upload下创建files，输入确认期望值、输出FileRevision",
          "sha256": "45f17fcac549bb3bc133865d4a1759630af7a01b5f4445f3a2698f7691664637"
        },
        {
          "path": "交付成果/assets/system-usecases-model.js",
          "lineStart": 37,
          "lineEnd": 40,
          "reason": "上传、状态读取、确认及文件修订读取端点",
          "sha256": "057c7300fb599a9f4c2486873edb53275213e05cc0902e3559097559e57d4e2d"
        },
        {
          "path": "proto/trade/filing/v1/filing.proto",
          "lineStart": 258,
          "lineEnd": 279,
          "reason": "FileUploadInput和FileConfirmationInput固定摘要与长度",
          "sha256": "a356b4156cfb8e091646d52f5473c50c94f1485f5acb058a0b69af089c639007"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 147,
          "lineEnd": 172,
          "reason": "逻辑文件号/修订、存储路径、摘要及用途",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "交付成果/assets/system-usecases-model.js",
          "lineStart": 119,
          "lineEnd": 140,
          "reason": "持久确认意图、租约栅栏、确切对象扫描和条件复制",
          "sha256": "057c7300fb599a9f4c2486873edb53275213e05cc0902e3559097559e57d4e2d"
        }
      ],
      "useCaseIds": [
        "supplier-submit",
        "payer-submit",
        "supplier-edit",
        "payer-edit"
      ],
      "nodeIds": [
        "N01"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "文件确认状态、保留政策和任务表归属。",
          "contract": "doc/步骤一身份签名与可靠性设计.md；生产保留期和删除许可待冻结。",
          "test": "确认原件保全、失败隔离和扫描完成不代表业务通过均有决策。"
        },
        {
          "dependencyId": "DM-02",
          "consumes": "不可变文件修订、用途和固定存储版本映射。",
          "contract": "doc/sql/domain/schema.sql:147-172",
          "test": "同逻辑文件修订不能二次覆盖，历史引用可还原。"
        },
        {
          "dependencyId": "OPS-04",
          "consumes": "私有版本化对象存储、扫描服务、短期访问和密钥配置。",
          "contract": "doc/方案验证中间件环境说明.md；生产端点与权限由OPS-04交接。",
          "test": "仅内部扫描可取确切版本，公开匿名读取失败，故障时保持未就绪。"
        },
        {
          "dependencyId": "SEC-04",
          "consumes": "上传类型/长度限制、恶意文件拒绝及访问防护。",
          "contract": "doc/步骤一HTTP接口协议.md；具体生产白名单待冻结。",
          "test": "超长、感染和伪造摘要均无正式文件。"
        },
        {
          "dependencyId": "BL-02",
          "consumes": "上传创建/确认原键回放和确认一次消费。",
          "contract": "doc/examples/step1/http-contract.json",
          "test": "重复确认及丢响应恢复得到同一修订，不新增文件。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "扫描通过后对象被替换与任务接管",
          "setup": "隔离版本化存储、扫描服务、供应商预留及两名任务执行器；文件使用原创无敏感合成材料。",
          "steps": [
            "提交V1并扫描，之后同键写V2",
            "使V1复制任务租约过期后由第二执行器接管",
            "原请求确认并读取文件，再撤销供应商授权"
          ],
          "assertions": [
            "仅V1的固定摘要/VersionId可完成",
            "元数据一次提交，V2不借用V1扫描结果",
            "撤权后无下载能力，交易未自动审核通过"
          ]
        }
      ],
      "openQuestions": [],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 4,
        "baselinePersonDays": 8,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "DM-02",
          "OPS-04",
          "SEC-04",
          "BL-02"
        ]
      },
      "review": "总Agent逐项核对原工作与新步骤：接入私有上传资源及确切版本扫描确认。；接入持久任务恢复与每次读取授权。原独立测试并入对应步骤，正常、失败及恢复判定仍保留，未删除功能或减少控制，不调整预算。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit",
            "supplier-edit",
            "payer-edit"
          ],
          "nodeIds": [
            "N01"
          ]
        },
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit",
            "supplier-edit",
            "payer-edit"
          ],
          "nodeIds": [
            "N01"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "BL-03-S1",
          "previousAction": "实现上传准备、受限暂存和真实字节扫描，持久化处理阶段。",
          "currentIds": [
            "BL-03-S1"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-03-S2",
          "previousAction": "实现稳定正式键、条件写、真实版本摘要及元数据确认和恢复。",
          "currentIds": [
            "BL-03-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-03-S3",
          "previousAction": "接对象权限、用途及下载授权，验证扫描失败和跨主体读取。",
          "currentIds": [
            "BL-03-S1",
            "BL-03-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        }
      ]
    }
  },
  "BL-04": {
    "rationale": "已有签约依据两用例；复用通用审核和版本服务，不再做首次建档终审。",
    "steps": [
      {
        "personDays": 2,
        "action": "实现依据补充、完整送审和缺项返回。",
        "logic": "读取供应商资料及独立付款方声明，内部有权人员补充本阶段资质、报价、付款分支/收付路径和代理范围；输入expectedTradeRevision及证据清单。当前版冻结为原因1快照并进入待审5；退回明确字段路径、用途、责任方。合同不是本次批准前提，后续才需要的运输时间可按规则待补。",
        "expected": "得到submissionId及不可变送审快照；缺本阶段必需项不批准，不回写他方私有声明。",
        "test": "缺报关资质/报价送审，审核上下文必须列出缺项；补齐后重送生成新送审内容，旧送审全文可查。"
      },
      {
        "personDays": 3,
        "action": "实现独立决定与批准版本原子绑定。",
        "logic": "根据submissionId锁交易及原送审，审核人不得为填报人/送审人；核当前源版及确切文件。退回到3并留原因，通过时写原因2完整快照、批准指针和事件10同事务，不能重读未冻结资料替换审阅对象。",
        "expected": "批准版明确可供合同、批次消费；后续更正新修订，旧批准不覆盖，不自动付款。",
        "test": "送审后并发改源版再审批应拒绝；自审失败。另一审核员批准后注入回执写失败，确认批准指针、快照、事件均回滚。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "BL-04",
      "status": "细化",
      "summary": "把签约依据送审、独审和批准快照明确为步骤二前置，排除合同已签的循环条件；批准绑定送审全文与源版，不把交易8当成付款或合同生效。",
      "sourceReferences": [
        {
          "path": "doc/examples/step2/http-contract.json",
          "lineStart": 173,
          "lineEnd": 214,
          "reason": "内部review-submissions及review-decisions分别建资源",
          "sha256": "0f0af03b8a70a1f283f3deae1658fdb02e6c523e8d0b9df01e28198d4ef923bc"
        },
        {
          "path": "doc/步骤二系统用例与接口协议.md",
          "lineStart": 5,
          "lineEnd": 20,
          "reason": "原因2批准快照、阶段必需项和经办审核分人",
          "sha256": "309fb3369cd0cde8dcda7f2b1878fd1cb1518505439e5d38b418ce419fd98102"
        },
        {
          "path": "proto/trade/contracts/v1/contracts.proto",
          "lineStart": 217,
          "lineEnd": 227,
          "reason": "expected_trade_revision、submission_id、MissingItem及批准快照响应",
          "sha256": "c39991b428a7c66710b5758ef9de067e03ff8206c63f6a2c17b3699b396939ce"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 58,
          "lineEnd": 100,
          "reason": "原因1送审/2批准快照和批准事件",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/examples/step2/entity-projection.json",
          "lineStart": 1,
          "lineEnd": 12,
          "reason": "步骤二使用独立合成已批准交易，不能把步骤一演示库当已批准",
          "sha256": "5311ca45d07ecdbae0c71b360945b19d8be564e63a43d48238fd241bc0a59a94"
        }
      ],
      "useCaseIds": [
        "basis-submit",
        "basis-review"
      ],
      "nodeIds": [
        "N02",
        "N03",
        "N04"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "签约依据阶段必需字段和允许待补字段、分人矩阵。",
          "contract": "doc/步骤二系统用例与接口协议.md:5-20",
          "test": "逐项确认不要求先签合同才批准签约依据。"
        },
        {
          "dependencyId": "BL-01",
          "consumes": "双方本方资源、修订及付款关系核实依据。",
          "contract": "proto/trade/filing/v1/filing.proto；proto/trade/contracts/v1/contracts.proto:217-227",
          "test": "取双方不同版本与关系冲突输入，验证送审准确引用。"
        },
        {
          "dependencyId": "BL-02",
          "consumes": "独立提交和决定的原受理恢复。",
          "contract": "doc/examples/step2/http-contract.json",
          "test": "批准成功丢响应原键返回同approvedSnapshotNumber。"
        },
        {
          "dependencyId": "BL-03",
          "consumes": "资质报价等用途正确的clean确切文件版本。",
          "contract": "proto/trade/contracts/v1/contracts.proto:217-227",
          "test": "传未完成扫描或摘要不一致引用，批准不产生。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "退回补齐后独立批准及源版竞争",
          "setup": "供应商、付款方、运营汇总人员与独立审核员四身份；交易编辑态，资质文件初缺。",
          "steps": [
            "汇总送审后独立退回缺资质报价",
            "供应商补齐并重送",
            "在审核读上下文后修改相关源版，再批准旧送审",
            "重新核实最新送审再独立批准"
          ],
          "assertions": [
            "旧送审和退回意见保留",
            "源版变化阻断旧批准",
            "最终有原因2快照，尚无合同生效或资金放行"
          ]
        }
      ],
      "openQuestions": [],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 2.5,
        "baselinePersonDays": 5,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "BL-01",
          "BL-02",
          "BL-03"
        ]
      },
      "review": "总Agent逐项核对原工作与新步骤：实现依据补充、完整送审和缺项返回。；实现独立决定与批准版本原子绑定。原独立测试并入对应步骤，正常、失败及恢复判定仍保留，未删除功能或减少控制，不调整预算。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "basis-submit"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04"
          ]
        },
        {
          "useCaseIds": [
            "basis-review"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "BL-04-S1",
          "previousAction": "汇总双方确切资料，补齐资质、报价和路径后形成送审快照。",
          "currentIds": [
            "BL-04-S1"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-04-S2",
          "previousAction": "接独立审核、退回和上游变化失效。",
          "currentIds": [
            "BL-04-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-04-S3",
          "previousAction": "验证步骤一只读及步骤二送审边界。",
          "currentIds": [
            "BL-04-S1",
            "BL-04-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        }
      ]
    }
  },
  "BL-05": {
    "rationale": "平台签署延期，计线下核实通道增量；人工记录不能复用自动签署成功事件。",
    "steps": [
      {
        "personDays": 3,
        "action": "实现三种用途合同起草、独审及新版本更正。",
        "logic": "逐单合同输入用途10/11/12、原因2批准快照、主体序号、审核正文确切版及自然日有效期；trade+用途唯一身份。未送审草稿可PUT，已送审另建版；存在执行中/未知签署先恢复。独审者非作者/送审人；新工作版不撤销旧生效版。",
        "expected": "草稿、待审、待签及旧生效版可分别查询；拒绝用新合同号绕过唯一性。",
        "test": "同交易同用途并发建两份只一身份；合同V1有效时建V2草稿，V1仍有效，V2自审拒绝且旧版不变。"
      },
      {
        "personDays": 3,
        "action": "实现一期人工签署登记、独立核实和另行生效编排。",
        "logic": "只对已审确切正文登记线下签署件、各方授权及签署时间/正文关联证据，先待核；独立核实签署人、完整性和用途后4→5，条件齐才有权决定5→6。签署件字节可不同于审核件，须核正文关联。人工入口的请求/决定/恢复字段待冻结；禁止借平台通知或ActivationInput直接伪造已签署。",
        "expected": "电子签渠道关闭时仍有受控人工路径，待核不生效；新版本正式替代与旧版6→7同事务。",
        "test": "登记缺一方授权的签署件应保持待核；补证独审后才5，再单独确认生效。替代写旧版状态后注入事务失败，两版法律状态均回滚。"
      },
      {
        "personDays": 3,
        "action": "实现框架逐单适用及正式报关委托/预付认可。",
        "logic": "框架引用合同号/确切版、主体映射、服务单及使用日，核用途、范围和首尾均含的有效自然日后作为交易更正等待重审。正式报关电子委托用途13及预付时出口代理对同一报关代理的书面认可分别登记核实，不能以附件4流程图或合同已签替代。",
        "expected": "适用记录不回填原批准快照；委托/认可各自可追溯，均不单独产生付款资格。",
        "test": "框架终止日当天允许审查，次日拒绝；认可报关代理序号与供应商委托不同应拒绝，旧批准及付款状态不改变。"
      }
    ],
    "risk": {
      "trigger": "人工签署证据或适用法律要求超出评审基线",
      "extraDays": 3
    },
    "audit": {
      "id": "BL-05",
      "status": "细化",
      "summary": "明确一期线下签署证据核实、合同生效和正式委托三个不同决定；现有Proto只有平台签署任务，缺一期人工签署登记/独审契约，列为冻结阻断而不伪造现有接口。框架适用走逐单更正重审。",
      "sourceReferences": [
        {
          "path": "doc/examples/step2/http-contract.json",
          "lineStart": 389,
          "lineEnd": 406,
          "reason": "现有signature-requests输入SignatureInput，非一期人工签署登记",
          "sha256": "0f0af03b8a70a1f283f3deae1658fdb02e6c523e8d0b9df01e28198d4ef923bc"
        },
        {
          "path": "doc/步骤二系统用例与接口协议.md",
          "lineStart": 5,
          "lineEnd": 29,
          "reason": "三种逐单用途、框架适用、正式委托及更正不废旧有效版",
          "sha256": "309fb3369cd0cde8dcda7f2b1878fd1cb1518505439e5d38b418ce419fd98102"
        },
        {
          "path": "proto/trade/contracts/v1/contracts.proto",
          "lineStart": 230,
          "lineEnd": 271,
          "reason": "签署输入仅provider_code/正文摘要，生效与正式授权/认可另有输入",
          "sha256": "c39991b428a7c66710b5758ef9de067e03ff8206c63f6a2c17b3699b396939ce"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 102,
          "lineEnd": 145,
          "reason": "合同身份与工作版、审核正文与签署件分别存放",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        }
      ],
      "useCaseIds": [
        "contract-draft",
        "contract-review",
        "contract-revise",
        "contract-sign",
        "contract-activate",
        "framework-use",
        "customs-authority"
      ],
      "nodeIds": [
        "N02",
        "N03",
        "N04"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "线下签署登记/独立核实请求、正文关联、恢复及分人决策。",
          "contract": "待冻结一期人工签署登记及核实HTTP/Proto；现有proto/trade/contracts/v1/contracts.proto:230-256只覆盖平台任务和生效。",
          "test": "签署渠道关闭，仍能提交待核人工签署证据且不能直接置已签。"
        },
        {
          "dependencyId": "BL-04",
          "consumes": "原因2快照、已批准主体/用途和交易ETag。",
          "contract": "proto/trade/contracts/v1/contracts.proto:217-227",
          "test": "未批准当前资料不得作为逐单合同依据。"
        },
        {
          "dependencyId": "DM-03",
          "consumes": "合同用途唯一性、工作版/法律有效版及生效替代不变量。",
          "contract": "doc/sql/domain/schema.sql:102-145；doc/步骤二系统用例与接口协议.md",
          "test": "新工作版不影响旧有效版，正式替代两版原子变化。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "一期人工签署与新版替代",
          "setup": "关闭签署平台通道；两方授权经办、独立合同审核员和生效决定人；原因2批准快照、V1有效合同、V2待签稿。",
          "steps": [
            "V2登记双方线下签署证据但暂缺一份授权",
            "独立核实被阻断后补证重提",
            "独立核实已签，另行确认生效替代V1"
          ],
          "assertions": [
            "补证前V2不签署不生效，V1仍有效",
            "已签与生效有不同记录",
            "替代原子完成，不触发货款付款或自动正式报关"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "一期要求人工签署核实，现有SignatureInput/签署用例以第三方平台为中心，没有人工签署声明与独立核实资源。请总Agent协调前端、协议及安全共同冻结入口；此为已有一期范围的契约补齐。",
          "owner": "合同业务负责人及接口架构负责人",
          "impact": "阻断一期线下签署及依赖合同生效的真实联调，不阻断草稿、独审、版本和框架适用开发。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 4.5,
        "baselinePersonDays": 9,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "BL-04",
          "DM-03"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "contract-draft",
            "contract-review",
            "contract-revise"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04"
          ]
        },
        {
          "useCaseIds": [
            "contract-sign",
            "contract-activate"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04"
          ]
        },
        {
          "useCaseIds": [
            "framework-use",
            "customs-authority"
          ],
          "nodeIds": [
            "N03",
            "N04"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "BL-05-S1",
          "previousAction": "实现三用途合同、条款审查、更正及公共协议适用。",
          "currentIds": [
            "BL-05-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "BL-05-S2",
          "previousAction": "新增受控人工签署核实、逐单委托及预付款认可。",
          "currentIds": [
            "BL-05-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "BL-05-S3",
          "previousAction": "验证正文版本、生效独立判断及旧授权失效。",
          "currentIds": [
            "BL-05-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "BL-06": {
    "rationale": "复用既有计划和占量规约；不计承运商接入。",
    "steps": [
      {
        "personDays": 3,
        "action": "实现基于批准快照的新批次及累计分配。",
        "logic": "输入approvedSnapshotNumber、tradeRevisionNumber、主体序号、分配商品数量/单位/金额CNY及区段；使用交易依据GET的ETag。交易根锁下READ COMMITTED逐行当前读有效分配，数量与金额分别不超批准上限，单位完全相同；业务号、批次/分配/区段、完整计划封套及回执同COMMIT。",
        "expected": "返回批次号、planRevision和强ETag；只建立计划，不记已备货或已提货。",
        "test": "批准100件10000元，两个并发请求分别70件7000元；只能一个成功。数量不超而金额超限亦拒绝，不残留半批次。"
      },
      {
        "personDays": 3,
        "action": "实现未执行计划的更正、取消及旧版恢复。",
        "logic": "使用当前批次ETag和完整新计划，改前封存旧计划；存在待审证据先退回再更正，执行后禁止覆盖。跨批准内容修订已有有效分配时PLAN_FROZEN，不自推迁移。取消限未提货计划/订舱阶段，已订舱须正式撤销凭据，未知执行不释放有效占量。",
        "expected": "旧planRevision可查，取消保留分配撤销行，不回收已履约量或重置交易总额度。",
        "test": "40件批次改为50件只替换本批次占量；另一批准修订新建批次应阻断。订舱撤销未知时取消失败，正式撤销核实后才撤销占量。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "BL-06",
      "status": "细化",
      "summary": "用批准快照和冻结planRevision组织批次，不以当前交易修订重置累计额度；补明同根锁内当前读、计划改版保留和未知取消不释放。运输证据核实留BL-07。",
      "sourceReferences": [
        {
          "path": "doc/examples/step3/http-contract.json",
          "lineStart": 3,
          "lineEnd": 20,
          "reason": "交易下创建shipments，完整ShipmentPlan及ShipmentReceipt",
          "sha256": "efa5e3523ca34c6d3f431f14f4de78d5c06c65218be72fb231aa318cc7f09aec"
        },
        {
          "path": "doc/步骤三系统用例与接口协议.md",
          "lineStart": 33,
          "lineEnd": 45,
          "reason": "计划版本、强标签、单位精度、跨批准版阻断",
          "sha256": "bed3e39150278fba4db2d78386f6de645a89f8c0dd863ef28e37254b5400d339"
        },
        {
          "path": "doc/步骤三系统用例与接口协议.md",
          "lineStart": 59,
          "lineEnd": 71,
          "reason": "根锁/READ COMMITTED当前读及复用合同依据GET",
          "sha256": "bed3e39150278fba4db2d78386f6de645a89f8c0dd863ef28e37254b5400d339"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 174,
          "lineEnd": 247,
          "reason": "批次、商品分配及运输区段字段",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/examples/step3/entity-projection.json",
          "lineStart": 4,
          "lineEnd": 32,
          "reason": "批准100件10000元、批次分配40件4000元的合成结构",
          "sha256": "553bd64b38d1b7604c69ccf9b0e43ad5371f767257676ef13d9ad517c4776f59"
        }
      ],
      "useCaseIds": [
        "shipment-plan",
        "shipment-amend"
      ],
      "nodeIds": [
        "N05",
        "N06"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "计划粒度、允许更正/取消状态、跨批准版本暂阻断决策。",
          "contract": "doc/步骤三系统用例与接口协议.md:33-45",
          "test": "列明跨版迁移不在既定范围内，不把改修订当额度重置。"
        },
        {
          "dependencyId": "DM-04",
          "consumes": "批次四表、分配累计和不可变计划封套/强标签规则。",
          "contract": "doc/sql/domain/schema.sql:174-268；proto/trade/logistics/v1/logistics.proto",
          "test": "按100件/10000元并发竞争核验事务约束。"
        },
        {
          "dependencyId": "BL-04",
          "consumes": "原因2批准快照号、商品行/主体及交易强ETag。",
          "contract": "proto/trade/contracts/v1/contracts.proto；GET /api/v1/trades/{trade_number}/contract-basis",
          "test": "改用未批准当前资料输入应拒绝，批准行可定位。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "并发批次和批准后更正",
          "setup": "批准快照R4含100件10000元；供应商身份；无已执行批次；两个数据库连接。",
          "steps": [
            "并发申请70件与70件",
            "修改成功批次到40件",
            "交易生成另一批准修订后尝试以新版另建70件"
          ],
          "assertions": [
            "并发累计不超100件/10000元",
            "旧计划可还原，当前仅占40件",
            "跨批准修订禁止擅自恢复/新增额度"
          ]
        }
      ],
      "openQuestions": [],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 3,
        "baselinePersonDays": 6,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "DM-04",
          "BL-04"
        ]
      },
      "review": "总Agent逐项核对原工作与新步骤：实现基于批准快照的新批次及累计分配。；实现未执行计划的更正、取消及旧版恢复。原独立测试并入对应步骤，正常、失败及恢复判定仍保留，未删除功能或减少控制，不调整预算。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "shipment-plan"
          ],
          "nodeIds": [
            "N05",
            "N06"
          ]
        },
        {
          "useCaseIds": [
            "shipment-amend"
          ],
          "nodeIds": [
            "N06"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "BL-06-S1",
          "previousAction": "实现按批准商品行建立和读取批次计划。",
          "currentIds": [
            "BL-06-S1"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-06-S2",
          "previousAction": "实现更正取消与同批准版累计占量校验。",
          "currentIds": [
            "BL-06-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-06-S3",
          "previousAction": "验证并发分配、跨批上限和不适用更正。",
          "currentIds": [
            "BL-06-S1",
            "BL-06-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        }
      ]
    }
  },
  "BL-07": {
    "rationale": "人工事件通道复用材料和独审，仍需按事件保留来源事实。",
    "steps": [
      {
        "personDays": 3,
        "action": "实现备货、订舱、提货证据提交和独立决定。",
        "logic": "供应商提交同批三单确切版及实货凭据；物流主体提交订舱/提货，核实名主体、有效物流合同和委托链。待审提交固定planRevision、sourceReference及结构化bookingReference/legSequence；审核员非声明人，决定通过才追加领域事件，备货核实仍处计划态。",
        "expected": "待审不写实际运输事实，退回留理由且另建补正提交；同源异文冲突。",
        "test": "物流经办自审订舱应拒绝；退回后新提交关联原提交。独审通过备货不变批次计划态，真实订舱通过才2，提货通过才3。"
      },
      {
        "personDays": 4,
        "action": "实现多区段进度、异常闭环及历史恢复。",
        "logic": "依序核实真实启运/到达/授权签收；出境区段服务端识别并核同批正式放行，通知不能代替。首段启运4、末段全部到达5、有权签收6。每异常独立保留原事件和最初冻结阶段，新异常不覆盖；全部实质处置后才恢复原进度，正式灭失另判失败9，不自动退款/付款。共用BL-02恢复原受理。",
        "expected": "乱序不能倒退，异常7不能推进；无证签收、失败或资金变动均不产生。",
        "test": "两段运输先投末段到达应拒绝/隔离；同批无放行的出境拒绝。登记两个异常只处理一个仍7，处理第二个回原阶段而不直接签收；签收时缺授权凭据仍非6。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "BL-07",
      "status": "细化",
      "summary": "把待审凭据和已核实物流事实分开；运输按区段顺序，同批放行才出境；多异常保最初冻结阶段。仅消费文件、恢复和领域能力，不重复建设承运商适配或资金处理。",
      "sourceReferences": [
        {
          "path": "doc/examples/step3/http-contract.json",
          "lineStart": 147,
          "lineEnd": 164,
          "reason": "证据独立决定走内部evidence-decisions，非外部直接写状态",
          "sha256": "efa5e3523ca34c6d3f431f14f4de78d5c06c65218be72fb231aa318cc7f09aec"
        },
        {
          "path": "doc/步骤三系统用例与接口协议.md",
          "lineStart": 7,
          "lineEnd": 31,
          "reason": "七用例及备货/订舱/提货/启运/到达/签收状态",
          "sha256": "bed3e39150278fba4db2d78386f6de645a89f8c0dd863ef28e37254b5400d339"
        },
        {
          "path": "doc/步骤三系统用例与接口协议.md",
          "lineStart": 47,
          "lineEnd": 75,
          "reason": "待审提交、独立决定、结构化承运字段、异常和外部I/O边界",
          "sha256": "bed3e39150278fba4db2d78386f6de645a89f8c0dd863ef28e37254b5400d339"
        },
        {
          "path": "proto/trade/logistics/v1/logistics.proto",
          "lineStart": 113,
          "lineEnd": 160,
          "reason": "证据、独立决定、异常处置及取消输入",
          "sha256": "7bce7ecd9d8b345cc605a8ba11c37add96c2a624ef60aaf1ca70800f80eed5ea"
        },
        {
          "path": "doc/examples/step3/entity-projection.json",
          "lineStart": 18,
          "lineEnd": 38,
          "reason": "合成计划绑定批准版与区段，不能当真实运输",
          "sha256": "553bd64b38d1b7604c69ccf9b0e43ad5371f767257676ef13d9ad517c4776f59"
        }
      ],
      "useCaseIds": [
        "goods-ready",
        "booking-pickup",
        "transport-progress",
        "logistics-exception",
        "logistics-query"
      ],
      "nodeIds": [
        "N05",
        "N06",
        "N10"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "一期人工凭据核实岗位、线路出境识别及签收授权要求。",
          "contract": "doc/步骤三系统用例与接口协议.md:59-75",
          "test": "确认无承运接口也不得上传截图后直达签收。"
        },
        {
          "dependencyId": "BL-06",
          "consumes": "冻结批次planRevision、分配/区段、主体及ETag。",
          "contract": "proto/trade/logistics/v1/logistics.proto；doc/examples/step3/http-contract.json",
          "test": "旧planRevision证据不绑定当前计划，非法区段号拒绝。"
        },
        {
          "dependencyId": "BL-03",
          "consumes": "三单、物流原始凭据的确切版本、用途和clean结论。",
          "contract": "doc/步骤三系统用例与接口协议.md:47-57",
          "test": "扫描失败不允许核实物流事实。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "同批放行门禁和双异常恢复",
          "setup": "国内段与出境段合成批次，备货/订舱/提货已独审，独立物流审核员；海关正式来源初缺。",
          "steps": [
            "申请出境核实应被阻断",
            "由关务域交接已独立核实的同批放行依据后再核实",
            "途中登记延误与货损两个异常，分别处置",
            "按真实到达和有权签收证据继续核实"
          ],
          "assertions": [
            "仅同批正式放行满足出境门禁",
            "解除一异常仍阻断推进",
            "全解除恢复原阶段，签收仍需独立事实",
            "物流成功不改银行或货款桶"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "BL-07的出境联调消费BL-09正式放行，但不能把BL-09设成整包开工前提，否则BL-09→BL-08→BL-06的联调链会被误认为必须先全部物流完成。请总Agent保留只读正式放行交接场景，不增加反向全包依赖。",
          "owner": "应用架构负责人",
          "impact": "同批出境成功联调须关务结果就绪；备货、订舱、提货和失败门禁可先完成。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 3.5,
        "baselinePersonDays": 7,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "BL-06",
          "BL-03"
        ]
      },
      "review": "总Agent逐项核对原工作与新步骤：实现备货、订舱、提货证据提交和独立决定。；实现多区段进度、异常闭环及历史恢复。原独立测试并入对应步骤，正常、失败及恢复判定仍保留，未删除功能或减少控制，不调整预算。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "goods-ready",
            "booking-pickup"
          ],
          "nodeIds": [
            "N05",
            "N06"
          ]
        },
        {
          "useCaseIds": [
            "transport-progress",
            "logistics-exception",
            "logistics-query"
          ],
          "nodeIds": [
            "N06",
            "N10"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "BL-07-S1",
          "previousAction": "实现备货、订舱、提货、到达和签收声明及独立核实。",
          "currentIds": [
            "BL-07-S1"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-07-S2",
          "previousAction": "实现物流异常、逐项处置与同批放行条件。",
          "currentIds": [
            "BL-07-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-07-S3",
          "previousAction": "验证乱序、重复和多异常并存。",
          "currentIds": [
            "BL-07-S1",
            "BL-07-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        }
      ]
    }
  },
  "BL-08": {
    "rationale": "已有完整草稿和书面确认规约；计生产服务接入与并发失效校验。",
    "steps": [
      {
        "personDays": 4,
        "action": "实现准备依据、完整草稿及未执行更正。",
        "logic": "读取原因2交易快照、冻结批次planRevision、三单及有效合同/正式委托。表头分别映射供应商、出口代理境内发货人、实际收货人及报关代理；锁交易/批次后读同批有效申报商品量额。完整首版/新修订保留正文hash及逐行明细；新修订只替换本申报占量，未知办理或未获正式更正许可禁止改版。拆报规则未确认阻断第二单。",
        "expected": "只有本地草稿号，无官方申报号/提交时间；旧版可还原，源规则缺失显示缺项。",
        "test": "建立草稿后改一个表头字段生成V2，V1全文hash不变；另单超同批量额拒绝。原办理未知时更正失败，不释放原占量。"
      },
      {
        "personDays": 5,
        "action": "实现独立送审决定及供应商确切版书面确认。",
        "logic": "送审冻结申报号/修订/hash、作者与送审人；内部审核员与二者不同，核主体、单位、批准源版与文件。仅供应商有权确认人能提交对应同版同hash的writtenEvidence及授权，技术confirmationId不能替代书面文件。与改版同根串行；新版不复制旧独审/确认。",
        "expected": "通过独审后仍待供应商确认；书面确认后只达可申请办理状态，不作海关提交事实。",
        "test": "报关代理代供应商确认及供应商只传技术确认号均拒绝；独审V1后并发生成V2与确认V1，只允许符合当前版分支，V2无旧确认。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "BL-08",
      "status": "细化",
      "summary": "报关草稿完整版本、独审和供应商本人书面确认分别实现；同批申报累计当前读，任一字段变更不沿用审核/确认。正式渠道办理归BL-09，信息查询不在一期。",
      "sourceReferences": [
        {
          "path": "doc/examples/step4/http-contract.json",
          "lineStart": 195,
          "lineEnd": 212,
          "reason": "exporter-confirmations的外部受众、强类型确认与事件响应",
          "sha256": "6c50164045c0cf29da97201d6bda7623acc367f4773c6e31fbd4dd853a0b6085"
        },
        {
          "path": "交付成果/assets/step-four-usecases-model.js",
          "lineStart": 33,
          "lineEnd": 52,
          "reason": "basis/draft/revision/review/confirm的消息、主体和事务",
          "sha256": "d7f4a2d46a140a2287901ec02c005089534b10faa4ea4d9b5140cb4b7cf839b5"
        },
        {
          "path": "proto/trade/customs/v1/customs.proto",
          "lineStart": 201,
          "lineEnd": 224,
          "reason": "base_revision、独审和ExporterConfirmationInput",
          "sha256": "a0f97ed44350574d2c1cd4d1c27b8e7cede75899e6cb3ee43b2d99b2b4a0d71f"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 270,
          "lineEnd": 317,
          "reason": "申报根、完整不可变报关修订",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/examples/step4/entity-projection.json",
          "lineStart": 1,
          "lineEnd": 15,
          "reason": "批准快照、批次计划及生产销售单位/境内发货人不同角色",
          "sha256": "d478ebe2124710a545c6bab0c9d84ce7013172b5fe9219dfb7487eb3b2f763ae"
        }
      ],
      "useCaseIds": [
        "s4-basis",
        "s4-draft",
        "s4-revision",
        "s4-review",
        "s4-confirm"
      ],
      "nodeIds": [
        "N07",
        "N08"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "双抬头合法适用依据、供应商书面确认要求和拆报合并决策。",
          "contract": "doc/步骤四系统用例与接口协议.md；未确认法律/拆报项须保留门禁。",
          "test": "缺合法依据只能备料；未确认拆报不得建第二正式范围。"
        },
        {
          "dependencyId": "DM-05",
          "consumes": "完整申报修订、同批占量、事件码及新版失效不变量。",
          "contract": "doc/sql/domain/schema.sql:270-390",
          "test": "旧修订更新/删除失败，累计不超批次。"
        },
        {
          "dependencyId": "BL-06",
          "consumes": "冻结计划、商品分配量额/单位、planRevision及主体。",
          "contract": "proto/trade/customs/v1/customs.proto；GET /api/v1/shipments/{shipment_number}/customs-basis",
          "test": "错计划版/错单位/错主体草稿拒绝。"
        },
        {
          "dependencyId": "BL-03",
          "consumes": "用途18草稿、19供应商书面确认及确切源文件。",
          "contract": "proto/trade/customs/v1/customs.proto:219-224",
          "test": "未clean或用途错的确认文件不通过。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "一栏变化后的审核与本人书面确认",
          "setup": "冻结批次40件，报关代理草稿V1、独立关务审核员和供应商授权人；三者不同身份。",
          "steps": [
            "独立审核V1并由供应商书面确认",
            "按允许退回路径新建V2改一栏",
            "尝试沿用V1独审及书面确认申请办理",
            "重审V2并供应商重新提供对应书面确认"
          ],
          "assertions": [
            "V1保留，V2初始无可复用批准",
            "旧确认不能申请V2办理",
            "报关代理不能代确认，新版满足后仍无官方提交事实"
          ]
        }
      ],
      "openQuestions": [],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 4.5,
        "baselinePersonDays": 9,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "DM-05",
          "BL-06",
          "BL-03"
        ]
      },
      "review": "对照步骤四第49至57行，核对完整草稿和同批占量、独审与作者送审人分离、供应商本人确切版书面确认；改版不沿用旧批准及确认。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s4-basis",
            "s4-draft",
            "s4-revision"
          ],
          "nodeIds": [
            "N07"
          ]
        },
        {
          "useCaseIds": [
            "s4-review",
            "s4-confirm"
          ],
          "nodeIds": [
            "N07",
            "N08"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "BL-08-S1",
          "previousAction": "实现来源冻结、完整草稿及逐字段改版。",
          "currentIds": [
            "BL-08-S1"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-08-S2",
          "previousAction": "实现独立审核、中国供应商本人书面确认及失效传播。",
          "currentIds": [
            "BL-08-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-08-S3",
          "previousAction": "验证跨角色代确认、并发改版和过期批准。",
          "currentIds": [
            "BL-08-S1",
            "BL-08-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        }
      ]
    }
  },
  "BL-09": {
    "rationale": "无海关自动适配，复用人工证据通道；正式更正与双方交付各有独立动作。",
    "steps": [
      {
        "personDays": 3,
        "action": "实现人工办理任务、证据登记与独立核实。",
        "logic": "前置同版独审、供应商书面确认、有效委托及明确正式职责/通道。先持久化action/revision/hash/originalRequest及原办理号；一期无海关自动外呼，授权人外部人工办理，结果未知保持原号查询。证据先待核，独立人员核真实来源、官方稳定键、确切版和前序正式事实后才推进提交/受理/查验/放行，验签错误不得当退单。",
        "expected": "本地待办与官方阶段分离，同键异文隔离；未接入或缺证不造官方号/时刻。",
        "test": "登记合成放行声明只能待核；独审缺正式来源应拒绝且状态不变。相同原办理号超时重入仅一个意图，受理凭据不能替代缺失的提交依据。"
      },
      {
        "personDays": 4,
        "action": "实现正式更正撤回、两方附件交接和原结果读取。",
        "logic": "已核实正式退单/更正要求才进入新修订重审及供应商重确认；撤回关联原办理，正式撤回核实前不释放量。附件2绑定正式版本向供应商和出口代理分别交付，由各自本人接收或异议，不能代收。历史与原受理复用BL-02，迟到旧事件不倒退当前投影。",
        "expected": "更正链、原件及分方接收可追溯；发出不等于两方已接收，撤回意图不等于撤回成功。",
        "test": "未知撤回时尝试释放量应失败；供应商接收后出口代理仍待收，报关代理代收拒绝。旧版正式事件迟到保留而不覆盖新版状态，原请求可恢复。"
      }
    ],
    "risk": {
      "trigger": "正式回执核实方式或更正职责发生变化",
      "extraDays": 2
    },
    "audit": {
      "id": "BL-09",
      "status": "细化",
      "summary": "一期只保存人工办理原号、正式凭据声明和独立核实；申报/受理/查验/放行、正式更正撤回及两方附件2接收各自留事实。技术失败不记海关退单，未知不重报不释放量。",
      "sourceReferences": [
        {
          "path": "doc/examples/step4/http-contract.json",
          "lineStart": 219,
          "lineEnd": 236,
          "reason": "filing-requests只建原号意图，返回FilingRequest",
          "sha256": "6c50164045c0cf29da97201d6bda7623acc367f4773c6e31fbd4dd853a0b6085"
        },
        {
          "path": "交付成果/assets/step-four-usecases-model.js",
          "lineStart": 53,
          "lineEnd": 72,
          "reason": "正式办理、证据独审、更正撤回、分别交付及恢复的实际分支",
          "sha256": "d7f4a2d46a140a2287901ec02c005089534b10faa4ea4d9b5140cb4b7cf839b5"
        },
        {
          "path": "proto/trade/customs/v1/customs.proto",
          "lineStart": 225,
          "lineEnd": 272,
          "reason": "FilingRequestInput、OfficialEvidence/Decision及分方交付接收",
          "sha256": "a0f97ed44350574d2c1cd4d1c27b8e7cede75899e6cb3ee43b2d99b2b4a0d71f"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 318,
          "lineEnd": 340,
          "reason": "原办理号、执行状态、请求hash及冻结载荷",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/examples/step4/authority-claim.html",
          "lineStart": 1,
          "lineEnd": 1,
          "reason": "原创合成声明页面，不是海关官方凭证",
          "sha256": "62c1d00fe1155148acf0d7ca4d888b0dc752cf9c93977247efaf4b55cd6c6e72"
        }
      ],
      "useCaseIds": [
        "s4-filing",
        "s4-official",
        "s4-correction",
        "s4-attachment",
        "s4-query"
      ],
      "nodeIds": [
        "N09"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "人工报关办理职责、独立验真渠道、回执事件映射和分方交接要求。",
          "contract": "doc/步骤四系统用例与接口协议.md；一期人工渠道核验清单待冻结。",
          "test": "关闭自动渠道，缺真实验证路径时只能待核不能放行。"
        },
        {
          "dependencyId": "BL-08",
          "consumes": "同申报/修订/hash的独审、供应商书面确认、源计划和有效委托。",
          "contract": "proto/trade/customs/v1/customs.proto:219-251",
          "test": "V2申请带V1确认应失败，根投影不变。"
        },
        {
          "dependencyId": "BL-02",
          "consumes": "原办理资源及命令冻结回执恢复，不重建新办理。",
          "contract": "doc/examples/step4/http-contract.json",
          "test": "成功提交本地意图丢响应，重入保持原requestNumber和Location。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "一期人工放行核实与分别接收",
          "setup": "无海关接口；报关代理、独立关务审核员、供应商和出口代理四身份；同版已审已书面确认；真实验真只在获授权测试渠道完成。",
          "steps": [
            "保存人工办理意图，在外部人工办理并登记来源声明",
            "独立核实正式提交及放行依据；无正式渠道则执行缺证失败分支并标成功未验证",
            "分别交付同一正式附件2给供应商与出口代理",
            "供应商接收，出口代理提出异议"
          ],
          "assertions": [
            "未核声明不放行，不用合成样例冒充成功",
            "两份交付不同接收记录，供应商不代出口代理",
            "出口代理异议保留并阻断需要其接收的付款条件"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "现有s4-filing写渠道未接入只显示待办/缺项，一期要求外部人工办理。须冻结人工经办交接与原办理号登记所需证据，不能把通道关闭解释为禁止所有线下人工办理，也不能把人工声明当正式提交。",
          "owner": "关务业务负责人及接口架构负责人",
          "impact": "阻断一期人工办理成功路径交接，不阻断意图、缺证拒绝、回执声明及独立核实框架。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 3.5,
        "baselinePersonDays": 7,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "BL-08",
          "BL-02"
        ]
      },
      "review": "总Agent逐项核对原工作与新步骤：实现人工办理任务、证据登记与独立核实。；实现正式更正撤回、两方附件交接和原结果读取。原独立测试并入对应步骤，正常、失败及恢复判定仍保留，未删除功能或减少控制，不调整预算。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s4-filing",
            "s4-official"
          ],
          "nodeIds": [
            "N09"
          ]
        },
        {
          "useCaseIds": [
            "s4-correction",
            "s4-attachment",
            "s4-query"
          ],
          "nodeIds": [
            "N09"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "BL-09-S1",
          "previousAction": "实现人工办理请求、原号及回执待核和独立核实。",
          "currentIds": [
            "BL-09-S1"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-09-S2",
          "previousAction": "实现正式更正撤回、原件分别交付与接收。",
          "currentIds": [
            "BL-09-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-09-S3",
          "previousAction": "验证原号恢复、未知和更正证据不足。",
          "currentIds": [
            "BL-09-S1",
            "BL-09-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        }
      ]
    }
  },
  "BL-10": {
    "rationale": "证明准备四用例沿用材料和审核框架，不重复实现上传与账号。",
    "steps": [
      {
        "personDays": 3,
        "action": "实现证明职责预检及范围唯一协作建案。",
        "logic": "消费批准快照、正式附件2/接收、主管机关职责和范围规则；未确认返回缺项，可预检/备料，不自行推定出口代理主办、报关代理协助已获许可。正式scope由服务端确认规则计算并检查重叠，type=1、claimedAmount=NULL、CNY，交易/type/scope唯一；不能随机scope绕重。",
        "expected": "只有规则齐全才建立确定范围协作案；建案不产生官方申请/受理。",
        "test": "规则未确认时读取缺项成功、正式建案409；确认规则后同范围并发建案仅一份，改成退税type或填0证明申请额均拒绝。"
      },
      {
        "personDays": 3,
        "action": "实现报关代理协助材料版及独立审核。",
        "logic": "输入完整提交内容、批准快照、范围/规则/职责和附件2引用，文件用途/逻辑号/修订/摘要固定；上传扫描事务外。根→案件→提交锁下冻结submissionContent/evidenceManifest及packageHash；审核人非经办，重验源向量，通过只到待提交3，退回保留原文并另版。源附件2/批准版变化使未执行批准失效。",
        "expected": "完整材料可还原，批准不当正式受理；不另建税务通用封套表。",
        "test": "仅提交文件列表缺正文应拒绝；提交后附件2更正再批旧材料应拒绝。经办自审失败，独审通过得内部批准，官方字段仍空。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "BL-10",
      "status": "细化",
      "summary": "证明申请以主管机关确认职责及scope规则建案，不默认一交易一证明；材料全文、确切文件和源版本共同冻结，独审只产生内部批准。税务状态和JSON实现消费DM-06。",
      "sourceReferences": [
        {
          "path": "doc/examples/step6/http-contract.json",
          "lineStart": 27,
          "lineEnd": 44,
          "reason": "正式规则确认后按CaseInput创建协作案，非一交易一证明",
          "sha256": "655fd00fa8ede63e226b65069fcc050df3849310bc0ebc47e5be565525fe6b7d"
        },
        {
          "path": "doc/步骤六系统用例与接口协议.md",
          "lineStart": 3,
          "lineEnd": 35,
          "reason": "申请职责未确认、type=1范围、完整材料和内部批准边界",
          "sha256": "c80e0ceb5b024eacc205546ce30739d4118ec98c8ffcc6bd960584142b91d409"
        },
        {
          "path": "proto/trade/taxproof/v1/taxproof.proto",
          "lineStart": 136,
          "lineEnd": 163,
          "reason": "CaseInput、SubmissionInput、ReviewInput及DispatchInput",
          "sha256": "64f7dad6388e571d26b5136a7f8a3a2177ca8e6671592a19edca3ad0ca70759c"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 392,
          "lineEnd": 447,
          "reason": "trade/type/scope唯一、证明金额NULL、不可变材料版",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/examples/step6/entity-projection.json",
          "lineStart": 1,
          "lineEnd": 12,
          "reason": "证明仅type=1且claimed_amount为null",
          "sha256": "42f610fae73480ad80aa944617fc2f452368f7299c6c7b9760a2185438065cc5"
        }
      ],
      "useCaseIds": [
        "s6-preparation",
        "s6-cooperation",
        "s6-materials",
        "s6-review"
      ],
      "nodeIds": [
        "N18",
        "N19"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "主管职责、申请范围/时限及一期人工办理/独核岗位决策。",
          "contract": "doc/步骤六系统用例与接口协议.md:3-7；正式机关确认文件待交付。",
          "test": "无正式职责规则时有缺项并保持只备料。"
        },
        {
          "dependencyId": "DM-06",
          "consumes": "type隔离、scope唯一、冻结内容/清单/hash及状态码。",
          "contract": "doc/sql/domain/schema.sql:392-475；doc/examples/step6/entity-projection.json",
          "test": "证明金额NULL和退税案件隔离受约束。"
        },
        {
          "dependencyId": "BL-09",
          "consumes": "正式附件2确切版、独立核实来源和相关主体接收记录。",
          "contract": "proto/trade/customs/v1/customs.proto；proto/trade/taxproof/v1/taxproof.proto:136-153",
          "test": "草稿或待核附件2不能作为已核正式依据，变更后重审。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "职责未定备料与附件2变化失效",
          "setup": "出口代理、报关代理、独立税务审核员不同身份；正式附件2V1已核，申请职责规则初未确认。",
          "steps": [
            "预检后尝试正式建案",
            "导入主管机关确认规则并按确定范围建案、送材料V1",
            "送审后关务更正附件2到V2，再独审原材料",
            "按V2另交材料重新独审"
          ],
          "assertions": [
            "未定规则不正式建案",
            "原版保留，源变更不能沿用旧批准",
            "最终内部批准仍非官方受理"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "证明由出口代理申请、报关代理协助仍待主管机关书面确认，scope、时限和重叠范围也不能由样例推断。请总Agent将其列为一期正式人工办理及三期自动接入共同准入项。",
          "owner": "税务业务负责人",
          "impact": "阻断确定正式范围及申请成功验收；不阻断职责预检、缺项、材料准备和失败关闭。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 3,
        "baselinePersonDays": 6,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "DM-06",
          "BL-09"
        ]
      },
      "review": "总Agent逐项核对原工作与新步骤：实现证明职责预检及范围唯一协作建案。；实现报关代理协助材料版及独立审核。原独立测试并入对应步骤，正常、失败及恢复判定仍保留，未删除功能或减少控制，不调整预算。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s6-preparation",
            "s6-cooperation"
          ],
          "nodeIds": [
            "N18"
          ]
        },
        {
          "useCaseIds": [
            "s6-materials",
            "s6-review"
          ],
          "nodeIds": [
            "N18",
            "N19"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "BL-10-S1",
          "previousAction": "实现主管职责、适用范围与协作案件准备。",
          "currentIds": [
            "BL-10-S1"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-10-S2",
          "previousAction": "实现材料确定版、送审、退回及批准。",
          "currentIds": [
            "BL-10-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-10-S3",
          "previousAction": "验证角色协助边界和材料改版失效。",
          "currentIds": [
            "BL-10-S1",
            "BL-10-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        }
      ]
    }
  },
  "BL-11": {
    "rationale": "人工办理和交接复用通用机制；保留八个证明后续用例的差异。",
    "steps": [
      {
        "personDays": 3,
        "action": "实现人工办理原号、正式声明独核及补正链。",
        "logic": "已独立批准材料版/hash且职责、范围、时限/渠道明确才保存办理意图；一期授权人外部人工办理，未知保留dispatchReference不重派。声明先待核，独立核真实sourceNamespace/官方号/稳定事件键/确切版；正式补正关联原版和已核补正事件，新版重审，内部退回不造机关补正。",
        "expected": "意图、正式提交、受理、补正各有不同事实；技术失败不记机关拒绝。",
        "test": "原办理超时后同键恢复仅一号；提交合成官方号无真实验证引用时拒绝核实。内部退回材料不能带虚构官方补正号重报，旧材料仍在。"
      },
      {
        "personDays": 3,
        "action": "实现签发/更正/撤销核实与分别交付、供应商接收核对。",
        "logic": "核签发原件及附件2范围后状态8；更正/撤销必须新正式证据关联原证明，撤销后禁止新交付。出口代理交付当前有效确切版，供应商本人分别记录收到、核对通过或异议；全部适用交付核对齐才9，收到不等于核对通过，更正后重新交付/核对。",
        "expected": "交付13、接收14等保存税务业务载荷，不藏受理账本；出口代理不能代供应商确认。",
        "test": "有效证明V1交付后更正V2，旧交付核对不能使V2完成；出口代理代接收拒绝。缺真实证明时交付拒绝，状态不变。"
      },
      {
        "personDays": 2,
        "action": "实现异议实质处置及有权历史/原受理查询。",
        "logic": "处置引用原异议、当前证明及实质凭据；需主管更正则等真实更正证据，内部说明不能清零。处置不代替供应商再次核对。按当前本方授权查询不可变材料、交付/接收及原回执，复用BL-02，不以最新状态替代首次响应。",
        "expected": "异议与处置链完整，未解决不完成/退税/结案；无权恢复不泄露。",
        "test": "供应商对范围提出异议，审核员仅填已解释不得关闭；正式更正重交后仍需供应商新核对。撤权后查询原已知键应拒绝。"
      }
    ],
    "risk": {
      "trigger": "主管机关证明结果或交付原件规则变更",
      "extraDays": 2
    },
    "audit": {
      "id": "BL-11",
      "status": "细化",
      "summary": "证明人工办理、正式证据独核、供应商接收核对及异议分别处理；更正/撤销保留官方原件，状态8不当9。无主管证据只能验失败门禁，不能据样例宣称成功。",
      "sourceReferences": [
        {
          "path": "doc/examples/step6/http-contract.json",
          "lineStart": 315,
          "lineEnd": 332,
          "reason": "供应商独立receipts资源使用ReceiptInput，记录核对或异议",
          "sha256": "655fd00fa8ede63e226b65069fcc050df3849310bc0ebc47e5be565525fe6b7d"
        },
        {
          "path": "交付成果/assets/step-six-usecases-model.js",
          "lineStart": 47,
          "lineEnd": 78,
          "reason": "办理、正式回执、补正、签发、更正撤销及交接异议真实用例",
          "sha256": "3b792df1da3e484b29d479f3c0bef3d62a3d05d3910119961e5ace06065832ea"
        },
        {
          "path": "doc/步骤六系统用例与接口协议.md",
          "lineStart": 30,
          "lineEnd": 38,
          "reason": "根锁/原号恢复、独核官方来源及供应商本人核对",
          "sha256": "c80e0ceb5b024eacc205546ce30739d4118ec98c8ffcc6bd960584142b91d409"
        },
        {
          "path": "proto/trade/taxproof/v1/taxproof.proto",
          "lineStart": 159,
          "lineEnd": 202,
          "reason": "办理、声明、核实、交付、接收及异议处置字段",
          "sha256": "64f7dad6388e571d26b5136a7f8a3a2177ca8e6671592a19edca3ad0ca70759c"
        },
        {
          "path": "doc/examples/step6/entity-projection.json",
          "lineStart": 1,
          "lineEnd": 12,
          "reason": "无外部成功夹具，不能以投影当正式证明",
          "sha256": "42f610fae73480ad80aa944617fc2f452368f7299c6c7b9760a2185438065cc5"
        }
      ],
      "useCaseIds": [
        "s6-dispatch",
        "s6-official-receipt",
        "s6-correction",
        "s6-certificate",
        "s6-delivery",
        "s6-receipt",
        "s6-objection",
        "s6-query"
      ],
      "nodeIds": [
        "N19",
        "N20"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "一期人工申请办理证据、正式来源独核流程及接收岗位。",
          "contract": "doc/步骤六系统用例与接口协议.md:30-38；人工通道登记契约待冻结。",
          "test": "关闭税务自动接口仍有受控人工交接，无证不推进官方状态。"
        },
        {
          "dependencyId": "BL-10",
          "consumes": "type=1确定范围、材料修订/packageHash、独审和源版本向量。",
          "contract": "proto/trade/taxproof/v1/taxproof.proto:159-202",
          "test": "材料变版后旧审核不可建正式办理意图。"
        },
        {
          "dependencyId": "BL-02",
          "consumes": "当前授权后的原办理/受理恢复。",
          "contract": "doc/examples/step6/http-contract.json",
          "test": "COMMIT后丢响应仍回原dispatchReference及原资源。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "证明更正后重交接且独立本人核对",
          "setup": "授权税务测试渠道或明确标注缺证失败环境；出口代理、报关代理、审核员与供应商四身份；type=1材料已独审。",
          "steps": [
            "人工办理并登记正式来源，独立核实后交付V1",
            "供应商收到但提出范围异议",
            "主管更正V2正式来源核实后重新交付",
            "供应商本人核对V2"
          ],
          "assertions": [
            "无正式渠道时停在缺证分支，成功未验证",
            "收到V1不记全部完成",
            "更正不覆盖旧原件/异议，V2须新接收核对才可9",
            "不自动退税或交易结案"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "税务Proto要求OFFICIAL_CHANNEL_UNAVAILABLE阻断，需与一期外部人工办理方式明确区分：自动连接未开不等于有权人工渠道不存在。请总Agent统一人工办理登记、真实核实引用和缺渠道错误含义。",
          "owner": "税务业务负责人及接口架构负责人",
          "impact": "阻断一期人工证明正式办理成功联调，不阻断待核、拒绝、补正和历史恢复。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 4,
        "baselinePersonDays": 8,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "BL-10",
          "BL-02"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s6-dispatch",
            "s6-official-receipt",
            "s6-correction"
          ],
          "nodeIds": [
            "N19"
          ]
        },
        {
          "useCaseIds": [
            "s6-certificate",
            "s6-delivery",
            "s6-receipt"
          ],
          "nodeIds": [
            "N20"
          ]
        },
        {
          "useCaseIds": [
            "s6-objection",
            "s6-query"
          ],
          "nodeIds": [
            "N20"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "BL-11-S1",
          "previousAction": "实现原办理号、官方受理、通知补正及证明结果核实。",
          "currentIds": [
            "BL-11-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "BL-11-S2",
          "previousAction": "实现证明更正撤销、分方交付、本人接收与异议。",
          "currentIds": [
            "BL-11-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "BL-11-S3",
          "previousAction": "验证未知、重复、补正换版及交接争议。",
          "currentIds": [
            "BL-11-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "BL-12": {
    "rationale": "不做税务接口，复用证明的材料、人工办理及通知机制；税务规则单独保留。",
    "steps": [
      {
        "personDays": 3,
        "action": "实现供应商退税准备、完整材料版和独审。",
        "logic": "type=2，确定规则计算scope并检查唯一/重叠，读取已核证明及批准资料；准备claimedAmount可NULL不造0。PackageInput经服务端白名单映射，冻结正文、规则/职责/范围、账户依据、确切文件清单并算完整packageHash。审核者非准备人，重验源向量；缺规则只备料，不擅自确认税率和金额。",
        "expected": "旧材料及退回意见保留，内部批准只到3；材料清单不替代正文。",
        "test": "只改申请额未换文件也必须改变packageHash；未知规则准备可成功但提交被阻断。经办自审失败，正式提交额为空/0均不通过。"
      },
      {
        "personDays": 3,
        "action": "实现人工办理、官方通知独核和正式补正链。",
        "logic": "独立批准的确切版/hash、职责/范围/授权及人工正式渠道齐才持久化原dispatchReference，事务外人工办理。OfficialNotice绑定原版、原办理号、官方稳定键及可信验证引用，不能只信客户端verifiedSourceReference。正式补正关联previousSubmissionRevision与真实correctionEvent，新版重审不复制旧批准；未知先原号查单。",
        "expected": "技术投递不推进官方进度，旧通知不误绑新申请，不重复申报。",
        "test": "原提交超时恢复不换号；旧V1通知在V2建版后仍只归V1。同外部键异文拒绝；没有已核补正事件不能创建假正式补正。"
      },
      {
        "personDays": 2,
        "action": "实现正式决定、规则约束后续待办及恢复查询。",
        "logic": "正式批准额来自核实的决定事件，申请额保持原值；期限只有正式规则引用才能设置。终拒/撤销保存终局而不自动正常结案，不建特殊救济入口。原键查询返回首次冻结回执，当前进度另查；到账转交BL-13，不由税务决定置实收。",
        "expected": "申请/批准/到账三金额可区分，unknown未变失败；无真实来源时按错误契约失败关闭。",
        "test": "申请1000、正式批准900，申请原额仍1000且已核到账为空；没有期限规则传期限拒绝；终拒后结案仍阻断，原受理可恢复。"
      }
    ],
    "risk": {
      "trigger": "退税提交主体或补正期限规则需新增分支",
      "extraDays": 2
    },
    "audit": {
      "id": "BL-12",
      "status": "细化",
      "summary": "退税完整材料、独审、人工提交、官方进度和终局独立编排；申请额可空仅限准备，正式提交须明确规则核算正数。批准额与银行实际到账分开，不硬编码税率/期限。",
      "sourceReferences": [
        {
          "path": "doc/examples/step7/http-contract.json",
          "lineStart": 51,
          "lineEnd": 68,
          "reason": "packages输入完整PackageInput并返回不可变Submission",
          "sha256": "b3672e800c4caaef135f054a91ac238f53cd851a459ac066c8c6226f7c8e033d"
        },
        {
          "path": "doc/步骤七系统用例与接口协议.md",
          "lineStart": 3,
          "lineEnd": 43,
          "reason": "type=2、范围规则、不可变材料、原号恢复与到账边界",
          "sha256": "8b9b0d38e55742d3a1f3de0654513e94ace510722685acdfbc2ea6bea6fc41ab"
        },
        {
          "path": "proto/trade/taxrefund/v1/taxrefund.proto",
          "lineStart": 52,
          "lineEnd": 99,
          "reason": "PackageInput、DispatchInput、OfficialNoticeInput、CorrectionInput和独立金额字段",
          "sha256": "cfcaaf9719573217afbfcadcfda06650b9e050f4297cffe03ff85c282f7fef9d"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 420,
          "lineEnd": 475,
          "reason": "材料版、原办理执行状态及正式事件确切版/稳定键",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/examples/step7/entity-projection.json",
          "lineStart": 1,
          "lineEnd": 14,
          "reason": "服务端映射内容及规则UNCONFIRMED，不直接落命令JSON",
          "sha256": "9397656ef6f74b744989219047ec8a80ba272e097622574ee26194bfae36987a"
        }
      ],
      "useCaseIds": [
        "s7-prepare",
        "s7-package",
        "s7-review",
        "s7-dispatch",
        "s7-notice",
        "s7-correction",
        "s7-decision",
        "s7-recovery"
      ],
      "nodeIds": [
        "N21"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "供应商申请权限、税率/期限/范围来源及人工办理独核规则。",
          "contract": "doc/步骤七系统用例与接口协议.md:3-17；主管规则引用待冻结。",
          "test": "UNCONFIRMED情况下禁止正式提交且不自动填税率期限。"
        },
        {
          "dependencyId": "BL-11",
          "consumes": "当前有效证明、正式更正/撤销、供应商本人核对及确切范围。",
          "contract": "proto/trade/taxproof/v1/taxproof.proto；proto/trade/taxrefund/v1/taxrefund.proto:52-63",
          "test": "证明撤销/异议未闭环时退税正式办理阻断。"
        },
        {
          "dependencyId": "DM-06",
          "consumes": "共享税务type隔离、不可变包、补正链及官方状态不变量。",
          "contract": "doc/sql/domain/schema.sql:392-475；doc/领域拆分评估与交易域设计.md §11",
          "test": "type=1案件号不能经退税端点写入，旧内容更新被拒绝。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "退税旧版通知与新补正并存",
          "setup": "供应商、独立审核员、税务通知核实员；type=2材料V1已审；人工正式渠道获许可，无许可时只运行失败路径。",
          "steps": [
            "保存原办理号并人工提交V1",
            "登记独立核实正式补正要求，创建V2重审",
            "迟到V1通知后再接收V2正式决定",
            "查询申请额、批准额、到账及原受理"
          ],
          "assertions": [
            "V1/V2材料与事件各归原版",
            "V2不复用V1批准",
            "批准不等于到账，不增加出口代理货款余额",
            "无正式来源样例返回422而非伪成功"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "OfficialNoticeInput虽有verified_source_reference字段，真实性必须从受控证据核实库解析，不能由客户端字符串自证；一期人工税务提交路径同样需与缺自动通道错误分开。请总Agent协调协议、INT-09及前端。",
          "owner": "税务业务负责人及税务接口负责人",
          "impact": "阻断正式通知/提交成功验收，不阻断材料、独审和缺证失败实现。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 4,
        "baselinePersonDays": 8,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "BL-11",
          "DM-06"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s7-prepare",
            "s7-package",
            "s7-review"
          ],
          "nodeIds": [
            "N21"
          ]
        },
        {
          "useCaseIds": [
            "s7-dispatch",
            "s7-notice",
            "s7-correction"
          ],
          "nodeIds": [
            "N21"
          ]
        },
        {
          "useCaseIds": [
            "s7-decision",
            "s7-recovery"
          ],
          "nodeIds": [
            "N21"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "BL-12-S1",
          "previousAction": "实现退税准备、确定版、独审和人工提交记录。",
          "currentIds": [
            "BL-12-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "BL-12-S2",
          "previousAction": "实现正式通知、期限、补正及终局核实。",
          "currentIds": [
            "BL-12-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "BL-12-S3",
          "previousAction": "验证补正新版本、原号恢复和终局非到账。",
          "currentIds": [
            "BL-12-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "BL-13": {
    "rationale": "仅消费资金权威观察与差异接口，不重复建设银行接入或对账。",
    "steps": [
      {
        "personDays": 3,
        "action": "接入受控供应商退税实收观察和独立核对。",
        "logic": "CreditInput绑定提交版、正式决定事件、controlledFundObservationReference及供应商账户依据；资金域返回账号归属/来源、币种、金额、稳定银行事件、已核实状态及可观察范围。独立核对部分/多笔到账，不重用银行事件；无权/缺观察返回REFUND_OBSERVATION_UNAVAILABLE，不能写0。",
        "expected": "追加税务事件17引用实收依据；申请额/批准额不改，出口代理三位置不增额。",
        "test": "批准900、供应商实际分两笔400和500，重复第一观察不能累计800；无供应商账户权限时金额未知且不产生税务完成事件。"
      },
      {
        "personDays": 2,
        "action": "交接金额/归属差异并核实完成条件。",
        "logic": "资金差额和账号归属冲突带原决定/观察引用交资金域；未知一侧NULL而非0，资金实质处理与独立复核后税务重核。所有适用到账和交接核对完成才8→9；没有实际到账或差异未闭环不以备注完成。",
        "expected": "差异有责任编号和证据，不直接改资金余额/释放锁额，不自动交易结案。",
        "test": "批准900、实际800生成100差额，批注已解决仍不得9；补足100并经独立核对后可满足到账完成，交易仍未结案。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "BL-13",
      "status": "细化",
      "summary": "到账核对只消费供应商账户受控银行观察，不能复用出口代理收款推定；明确部分到账、未知与零金额差异，资金差异交资金域，不在税务包重做银行或账务。",
      "sourceReferences": [
        {
          "path": "doc/examples/step7/http-contract.json",
          "lineStart": 243,
          "lineEnd": 260,
          "reason": "ReconcileRefundCredit使用CreditInput及内部独立核对受众",
          "sha256": "b3672e800c4caaef135f054a91ac238f53cd851a459ac066c8c6226f7c8e033d"
        },
        {
          "path": "doc/步骤七系统用例与接口协议.md",
          "lineStart": 31,
          "lineEnd": 35,
          "reason": "退税到账为供应商本方真实银行记录，缺观察返回REFUND_OBSERVATION_UNAVAILABLE",
          "sha256": "8b9b0d38e55742d3a1f3de0654513e94ace510722685acdfbc2ea6bea6fc41ab"
        },
        {
          "path": "proto/trade/taxrefund/v1/taxrefund.proto",
          "lineStart": 80,
          "lineEnd": 95,
          "reason": "CreditInput引用正式决定、受控资金观察和收款账户依据",
          "sha256": "cfcaaf9719573217afbfcadcfda06650b9e050f4297cffe03ff85c282f7fef9d"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 449,
          "lineEnd": 475,
          "reason": "税务事件17只引用资金流水、金额及证据",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/examples/step7/s7-credit-implementation.mmd",
          "lineStart": 19,
          "lineEnd": 28,
          "reason": "到账核对实际消息由资金权威观察驱动",
          "sha256": "95e0f9fcabd01ab4fef6c2df9fba83931ec2efd204a2fefae4d94a0c177afc4e"
        }
      ],
      "useCaseIds": [
        "s7-credit"
      ],
      "nodeIds": [
        "N21"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "供应商账户观测授权、独立核对岗位及差异交接定义。",
          "contract": "doc/步骤七系统用例与接口协议.md:31-35；受控观察服务字段/访问许可待冻结。",
          "test": "没有供应商账户许可时必须明确未知，不能以出口代理对账代替。"
        },
        {
          "dependencyId": "BL-12",
          "consumes": "正式批准决定、确切提交版、批准额和供应商收款依据。",
          "contract": "proto/trade/taxrefund/v1/taxrefund.proto:66-95",
          "test": "待核税务通知不能用作正式决定核对到账。"
        },
        {
          "dependencyId": "FIN-08",
          "consumes": "独立资金观察及差异创建/实质关闭引用，不消费不明来源缓存金额。",
          "contract": "proto/trade/taxrefund/v1/taxrefund.proto:80；FIN-08到供应商退税观察的内部交接待冻结。",
          "test": "核验观察的账号持有人、银行稳定键及权限；重复观察只记一次。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "供应商账户不可观察与部分退税",
          "setup": "正式批准900元；独立核对员；出口代理账号可查、供应商账号初无授权。",
          "steps": [
            "用出口代理银行记录尝试核对供应商退税",
            "取得合法供应商账户观察权限后接入400元与400元不同事件",
            "重复第一事件，随后接入100元",
            "由独立核对员重核差异"
          ],
          "assertions": [
            "第一步不确认到账且不是0差异",
            "累计800再900，不因重复变1200",
            "仅真实实收与实质差异核对支持完成，出口代理货款桶不变"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "FIN-08基线是独立重算/差异能力，不等于已有供应商退税账户观测接口。请总Agent协调资金组明确一期银行许可、受控观察字段及正式差异交接；不得用适配器示例假定已获供应商账户权限。",
          "owner": "资金业务负责人及银行接口负责人",
          "impact": "阻断s7-credit成功及完整正常结案，不阻断无权/缺观察失败路径和税务正式决定。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 2.5,
        "baselinePersonDays": 5,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "BL-12",
          "FIN-08"
        ]
      },
      "review": "总Agent逐项核对原工作与新步骤：接入受控供应商退税实收观察和独立核对。；交接金额/归属差异并核实完成条件。原独立测试并入对应步骤，正常、失败及恢复判定仍保留，未删除功能或减少控制，不调整预算。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s7-credit"
          ],
          "nodeIds": [
            "N21"
          ]
        },
        {
          "useCaseIds": [
            "s7-credit"
          ],
          "nodeIds": [
            "N21"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "BL-13-S1",
          "previousAction": "实现按主体授权查询退税实收观察。",
          "currentIds": [
            "BL-13-S1"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-13-S2",
          "previousAction": "登记确切到账引用并将差异交资金域处理。",
          "currentIds": [
            "BL-13-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-13-S3",
          "previousAction": "验证撤权、部分到账及重复交接。",
          "currentIds": [
            "BL-13-S1",
            "BL-13-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        }
      ]
    }
  },
  "BL-14": {
    "rationale": "报告规则已有；新增跨域源读取与完整性验证，不能简化成几项人工勾选。",
    "steps": [
      {
        "personDays": 5,
        "action": "组织全域上下文并生成不可变逐项报告。",
        "logic": "读取批准快照、全部合同/批次/申报/交接/税务/资金账务/异常，冻结type/id/revision/hash/eventTail及完整排序对象ID集合/hash、ruleVersion；未知来源/未接入/不可授权不当空集合。事务外计算逐项观察/期望/差额，锁同一交易根后当前读重验向量与集合，追加trade事件18。",
        "expected": "报告有每项来源和证据；并发新对象使报告陈旧，不能客户端传allPassed。",
        "test": "读取上下文后新增同交易批次但旧对象版不变，生成旧向量报告应拒绝；无供应商账户观察项为unknown不是pass。"
      },
      {
        "personDays": 4,
        "action": "创建差异分派及按原因、对象、动作范围暂停。",
        "logic": "差异案件绑定来源上下文和业务号、类型/严重级别、责任人/期限和报告项；金额差异引用资金域差异。每个holdReference独立列AffectedContext及operations/确切源版，决定、received和applied分别留痕；所有新执行检查有效原因集合，不改交易生命周期。",
        "expected": "报告失败/未知有可追踪责任，多因不覆盖；仅接收传播不等于执行成功。",
        "test": "同对象登记两个原因，暂停已接收但未applied时仍阻断；重复相同传播不新增执行，分派更新不清除已有原因。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "BL-14",
      "status": "细化",
      "summary": "核对报告冻结完整对象集合与源向量，不能只比现有对象版本；逐项pass/fail/unknown，差异分派与多原因暂停独立。资金权威由资金域提供，不从合规重算后反写余额。",
      "sourceReferences": [
        {
          "path": "doc/examples/step8/http-contract.json",
          "lineStart": 27,
          "lineEnd": 44,
          "reason": "内部创建reconciliation-reports，ReportInput到报告资源",
          "sha256": "baed7583fe871d78d476eb5e812cc2338f2c3d45ed0b5475a5ddc19f71a40c79"
        },
        {
          "path": "doc/步骤八系统用例与接口协议.md",
          "lineStart": 13,
          "lineEnd": 34,
          "reason": "完整集合、未知阻断、精确金额勾稽和逐原因暂停传播",
          "sha256": "e2918d2051a08419256735255787e066a167ecd22e70a9bc29a278378a9c632e"
        },
        {
          "path": "proto/trade/reconciliation/v1/reconciliation.proto",
          "lineStart": 100,
          "lineEnd": 179,
          "reason": "SourceVector/ObjectSet/CheckItem、报告输入和有效原因",
          "sha256": "0768c8d7e372f5c2f85d35778206d83b5b2747ec536025d4b8c3a9481f240a5c"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 762,
          "lineEnd": 807,
          "reason": "差异案件及不可变处置事件权威归属",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/examples/step8/entity-projection.json",
          "lineStart": 1,
          "lineEnd": 14,
          "reason": "示例为designOnly且未证明外部成功",
          "sha256": "a88dbfdedf84da141a5216b0e790cb0759abbd9273d019ce766240b35c46817b"
        }
      ],
      "useCaseIds": [
        "s8-context",
        "s8-report",
        "s8-assignment",
        "s8-hold"
      ],
      "nodeIds": [
        "N22",
        "N23"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "各域权威来源、完整对象类别、锁协调和资金守恒判定。",
          "contract": "doc/步骤八系统用例与接口协议.md:13-28",
          "test": "对象类别不能以未接入空集合通过。"
        },
        {
          "dependencyId": "DM-07",
          "consumes": "报告事件18、类型化处置、有效原因与传播不变量。",
          "contract": "doc/examples/step8/compliance-decision-contract.json；proto/trade/reconciliation/v1/reconciliation.proto",
          "test": "开放JSON/未知分支拒绝，报告不藏技术账本。"
        },
        {
          "dependencyId": "BL-07",
          "consumes": "全部批次/区段/签收及未解物流异常的源尾和集合。",
          "contract": "proto/trade/logistics/v1/logistics.proto",
          "test": "新增异常使报告过期，已到达不等于已签收。"
        },
        {
          "dependencyId": "BL-09",
          "consumes": "全部申报修订、确认、正式回执、两方附件2接收及未知办理。",
          "contract": "proto/trade/customs/v1/customs.proto",
          "test": "待核放行和出口代理未接收均不能pass。"
        },
        {
          "dependencyId": "BL-12",
          "consumes": "全部证明/退税案、材料、正式决定、交接及原办理状态。",
          "contract": "proto/trade/taxproof/v1/taxproof.proto；proto/trade/taxrefund/v1/taxrefund.proto",
          "test": "终拒不当正常完成，税务批准不当到账。"
        },
        {
          "dependencyId": "FIN-08",
          "consumes": "银行/分配/三位置/供应商到账/服务费/凭证分录的独立勾稽及差异。",
          "contract": "doc/步骤五系统用例与接口协议.md；资金独立核对结果交接结构待冻结。",
          "test": "扣款有、供应商到账未知时报告不能全通过。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "对象集合竞争与两原因暂停",
          "setup": "已批准交易，完整合成对象集合且真实外部来源未接入项明确unknown；两名内部合规人员。",
          "steps": [
            "读取源向量后新增税务案件",
            "以旧向量生成报告",
            "重新生成逐项报告并分派差异",
            "为同付款操作创建两个独立暂停原因并分别确认传播"
          ],
          "assertions": [
            "新增对象令旧向量失效",
            "未知不转换为通过",
            "每原因有独立引用和执行接收状态",
            "暂停不覆盖交易8生命周期且不改变货款位置"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "各域后台回执和资金动作必须与结案共享交易根协调；如任一适配器绕根更新事实，集合/版本重验不能证明一致性。请总Agent把根锁和事件尾交接纳入各层统一约束。",
          "owner": "应用架构负责人及数据库负责人",
          "impact": "阻断正常结案一致性验收，不阻断独立报告和差异登记的缺证分支。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 4.5,
        "baselinePersonDays": 9,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "DM-07",
          "BL-07",
          "BL-09",
          "BL-12",
          "FIN-08"
        ]
      },
      "review": "对照步骤八第17至28行，核对完整对象集合与源向量、逐项通过失败未知、资金结果只消费权威输出，不从合规反写余额。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s8-context",
            "s8-report"
          ],
          "nodeIds": [
            "N22"
          ]
        },
        {
          "useCaseIds": [
            "s8-assignment",
            "s8-hold"
          ],
          "nodeIds": [
            "N23"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "BL-14-S1",
          "previousAction": "汇总完整对象集合及源版本，生成逐项结果。",
          "currentIds": [
            "BL-14-S1"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-14-S2",
          "previousAction": "实现责任分派、独立暂停及跨域传播。",
          "currentIds": [
            "BL-14-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-14-S3",
          "previousAction": "验证缺权、漏源、并发源变化和未知项。",
          "currentIds": [
            "BL-14-S1",
            "BL-14-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        }
      ]
    }
  },
  "BL-15": {
    "rationale": "复用已有案件与审核机制，重点是实质处置及逐原因解除。",
    "steps": [
      {
        "personDays": 4,
        "action": "实现实质处置和原节点更正编排。",
        "logic": "补证引用原处置及真实结果，独立复核不能只认备注。更正申请冻结originalNode、完整AffectedContext/依赖边、源向量/集合/规则；批准只授权更正范围，原节点新修订重审，旧报告和受影响未执行批准失效；已执行事实保留，未知执行先恢复，逐目标失效applied未齐不新执行。",
        "expected": "产生范围决定、原节点重入和失效确认链，不代写其他领域正式事实。",
        "test": "对已付款结算提出文字修正，不能撤写银行扣款；未知原付款不得创建反向假失败。批准资料更正后税务旧批准失效，未确认传播前正式办理拒绝。"
      },
      {
        "personDays": 3,
        "action": "实现独立逐原因解除及单独关案。",
        "logic": "解除申请绑定原holdReference、实质处置、源向量/集合及证据；非申请人独审重核，只解除该因，且所有目标applied才放开其作用范围。案件关闭另申请/独审，金额差异须资金域实质关闭引用；关案不生成解除或解锁事件。",
        "expected": "一因解除不消其他因，关案可留有效暂停；拒绝时原限制不变。",
        "test": "同案两因H1/H2，H1解除通过但一目标未applied时仍阻断；补齐后H2仍阻断。独立关案后H2仍有效，货款锁额不变。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "BL-15",
      "status": "细化",
      "summary": "把实质处置、更正范围批准、逐原因解除及关案分别组织；已执行不撤写，未知先查原号，下游失效传播未确认仍阻断。合规不能代资金关差异或解锁。",
      "sourceReferences": [
        {
          "path": "doc/examples/step8/http-contract.json",
          "lineStart": 315,
          "lineEnd": 332,
          "reason": "release-decisions独立决定资源，与申请和关案不同",
          "sha256": "baed7583fe871d78d476eb5e812cc2338f2c3d45ed0b5475a5ddc19f71a40c79"
        },
        {
          "path": "doc/步骤八系统用例与接口协议.md",
          "lineStart": 30,
          "lineEnd": 36,
          "reason": "多原因解除、关案不解冻及原节点更正失效传播",
          "sha256": "e2918d2051a08419256735255787e066a167ecd22e70a9bc29a278378a9c632e"
        },
        {
          "path": "doc/步骤八系统用例与接口协议.md",
          "lineStart": 76,
          "lineEnd": 94,
          "reason": "11种封闭处置分支及action/result语义",
          "sha256": "e2918d2051a08419256735255787e066a167ecd22e70a9bc29a278378a9c632e"
        },
        {
          "path": "doc/examples/step8/compliance-decision-contract.json",
          "lineStart": 1,
          "lineEnd": 21,
          "reason": "决定类型必填、独立approver及逐目标applied",
          "sha256": "d12ed2b73917894817e4782ff948ec529971b5896b91268c468b112b9d9c09f3"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 788,
          "lineEnd": 807,
          "reason": "不可变处置事件、action/result和affected_contexts",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        }
      ],
      "useCaseIds": [
        "s8-remedy",
        "s8-correction",
        "s8-release",
        "s8-case-close"
      ],
      "nodeIds": [
        "N23"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "原节点更正责任、独立复核、传播目标和资金实质关闭边界。",
          "contract": "doc/步骤八系统用例与接口协议.md:30-36",
          "test": "复核人不能以关案代解除或解锁。"
        },
        {
          "dependencyId": "BL-14",
          "consumes": "报告、案件、原holdReference、AffectedContext/源向量/完整集合及传播状态。",
          "contract": "proto/trade/reconciliation/v1/reconciliation.proto；doc/examples/step8/compliance-decision-contract.json",
          "test": "跨案件/错原原因解除拒绝，目标received不冒充applied。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "关案后仍有暂停及更正重审",
          "setup": "同一交易两个暂停原因，金额差异和税务材料更正分别有责任域；经办与独立复核员。",
          "steps": [
            "实质处理金额差异并取得资金域独核关闭引用",
            "申请关案并独审通过",
            "申请解除H1，延迟一个目标applied",
            "批准税务更正范围，原节点建新版并完成失效传播"
          ],
          "assertions": [
            "关案不自动清H1/H2或资金锁额",
            "H1未全applied仍阻断，H2始终独立",
            "新版仍须原税务独审，不能因更正范围批准直接正式办理"
          ]
        }
      ],
      "openQuestions": [],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 3.5,
        "baselinePersonDays": 7,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "BL-14"
        ]
      },
      "review": "总Agent逐项核对原工作与新步骤：实现实质处置和原节点更正编排。；实现独立逐原因解除及单独关案。原独立测试并入对应步骤，正常、失败及恢复判定仍保留，未删除功能或减少控制，不调整预算。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s8-remedy",
            "s8-correction"
          ],
          "nodeIds": [
            "N23"
          ]
        },
        {
          "useCaseIds": [
            "s8-release",
            "s8-case-close"
          ],
          "nodeIds": [
            "N23"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "BL-15-S1",
          "previousAction": "实现处置材料、回原节点更正及资金域交接。",
          "currentIds": [
            "BL-15-S1"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-15-S2",
          "previousAction": "实现逐原因独立解除、传播确认及案件关闭。",
          "currentIds": [
            "BL-15-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-15-S3",
          "previousAction": "验证多原因、传播失败及处置证据失效。",
          "currentIds": [
            "BL-15-S1",
            "BL-15-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        }
      ]
    }
  },
  "BL-16": {
    "rationale": "复用完整报告和历史读取；本包只计正常结案的最终门禁。",
    "steps": [
      {
        "personDays": 4,
        "action": "实现正常结案申请与独立决定事务。",
        "logic": "服务费规则已确认：固定CNY 300由D承担，仅在首次获批分账时从D已核验可用余额结算；真实收费仍须D授权及法务/财务确认正式收费依据、票据和收入确认。申请绑定报告18/hash、ruleVersion、源向量及全部对象集合；锁交易根后重验全域最终事实、实收/可用/扣款/供应商到账、服务费独立事实、资金守恒/账务平衡和全部有效原因/传播/未知执行。齐备才写19仍8；审批人非申请人且决定时再次重验，退回20，批准17及8→10同COMMIT。",
        "expected": "无特殊结案、无透支/垫资/换汇、无unknown正常通过；失败不写结案。",
        "test": "申请后新增批次/税务案或产生银行未知，审批必须拒绝。并发资金回执与批准用同交易根协调，只有重验当前集合通过才可10；写事件后失败应整体回滚。"
      },
      {
        "personDays": 2,
        "action": "实现终态历史及首次原受理恢复。",
        "logic": "当前授权后查询批准快照、报告、申请/退回/结案及案件处置，敏感证据按权限裁剪。首次成功原键同文在终态仍回首次回执，不能以当前10拒绝恢复；新意图不能重开或再执行，读取当前10不能替代证明某次申请成功。",
        "expected": "结案历史可追溯、原结果不变，查询无副作用。",
        "test": "成功结案后恢复首次申请/决定原键，返回各自原结果；新键请求重开或付款拒绝，原事件数量不增；撤权后历史不可见。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "BL-16",
      "status": "细化",
      "summary": "正常结案申请和独立决定两次重核同一完整来源集合；事件19只申请、17才8→10，20退回不改生命周期。终态不可重开，未知/未到账/有效暂停均阻断。",
      "sourceReferences": [
        {
          "path": "doc/examples/step8/http-contract.json",
          "lineStart": 411,
          "lineEnd": 476,
          "reason": "closure-applications与closure-decisions分别输入、读取与决定",
          "sha256": "baed7583fe871d78d476eb5e812cc2338f2c3d45ed0b5475a5ddc19f71a40c79"
        },
        {
          "path": "doc/步骤八系统用例与接口协议.md",
          "lineStart": 38,
          "lineEnd": 52,
          "reason": "申请及决定双重核验、同根事务和终态原键恢复",
          "sha256": "e2918d2051a08419256735255787e066a167ecd22e70a9bc29a278378a9c632e"
        },
        {
          "path": "doc/领域拆分评估与交易域设计.md",
          "lineStart": 640,
          "lineEnd": 642,
          "reason": "事件17/18/19/20的封闭载荷与正常结案条件",
          "sha256": "9756de6bf51abc7ed64763295fafe9949093b33bf8490867b2197567856e35b6"
        },
        {
          "path": "doc/examples/step8/failure-examples.json",
          "lineStart": 1,
          "lineEnd": 32,
          "reason": "正常结案申请固定报告摘要、源向量和集合的实际失败样例",
          "sha256": "bdb100ac63a1a694d012657cacdd08c8a25f60b35f57530fca587cf91c1c86e3"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 78,
          "lineEnd": 100,
          "reason": "申请/退回/结案事件及生命周期码",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        }
      ],
      "useCaseIds": [
        "s8-closure-apply",
        "s8-closure-review",
        "s8-query"
      ],
      "nodeIds": [
        "N22",
        "N23"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "正常结案规则版、权威来源完整集与各域共享根锁契约。",
          "contract": "doc/步骤八系统用例与接口协议.md:13-52",
          "test": "列明所有unknown、未决执行和未核到账都阻断。"
        },
        {
          "dependencyId": "BL-15",
          "consumes": "实质处置、资金域关闭引用、有效原因和逐目标解除/失效applied。",
          "contract": "proto/trade/reconciliation/v1/reconciliation.proto",
          "test": "案件已关但有效原因仍在时结案拒绝。"
        },
        {
          "dependencyId": "BL-13",
          "consumes": "供应商退税实际到账独核、未核部分和差异闭环引用。",
          "contract": "proto/trade/taxrefund/v1/taxrefund.proto:80-95",
          "test": "税务已批准但实际到账不可观察时不得正常结案。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "申请后新对象竞争及unknown拒绝",
          "setup": "交易8，申请人和独立审核员；完整受控测试来源，缺正式渠道的项目保持unknown，不伪造成功来源。",
          "steps": [
            "先以unknown报告申请结案，确认失败",
            "在可获得全部真实验收依据时提交结案申请",
            "审批前新增一项案件或暂停",
            "独立审批并查询原申请结果"
          ],
          "assertions": [
            "第一步不产生19或17",
            "新增对象/暂停使决定拒绝且不结案",
            "申请原受理与当前拒绝分开",
            "完整成功只在全域真实来源齐备时另行验收，不据离线样例宣称通过"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "当前步骤八验证仅有unknown和缩减分支，无真实完整正常结案成功轨迹；一期银行及人工官方证据、供应商到账观察必须齐备才可验收成功。请总Agent不要把静态协议或隔离测试通过当完整上线验收。",
          "owner": "业务验收负责人",
          "impact": "阻断完整正常结案成功验收，不阻断全部拒绝、并发陈旧及历史恢复验证。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 3,
        "baselinePersonDays": 6,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "BL-15",
          "BL-13"
        ]
      },
      "review": "对照步骤八第38至52行，核对申请与独立决定两次当前读集合、新对象或银行未知阻断、事件与终态同事务，结案后首次原受理仍可恢复。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s8-closure-apply",
            "s8-closure-review"
          ],
          "nodeIds": [
            "N22"
          ]
        },
        {
          "useCaseIds": [
            "s8-query"
          ],
          "nodeIds": [
            "N22",
            "N23"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "BL-16-S1",
          "previousAction": "实现结案申请及决定时重新核对最新源集合。",
          "currentIds": [
            "BL-16-S1"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-16-S2",
          "previousAction": "接实际到账、资金守恒、执行未知及暂停条件。",
          "currentIds": [
            "BL-16-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-16-S3",
          "previousAction": "验证决定竞争、原受理恢复及完整历史。",
          "currentIds": [
            "BL-16-S1",
            "BL-16-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        }
      ]
    }
  },
  "BL-17": {
    "rationale": "复用各包已通过的单测和专项记录，仅计跨域用户验收与交接，避免重复跑全部开发测试。",
    "steps": [
      {
        "personDays": 4,
        "action": "执行建档至报关的联合路径和人工岗位交接。",
        "logic": "使用独立主体账号、隔离合成交易和授权测试文件，记录用例/节点/接口/输入版/实际输出/证据。一期只银行自动；合同线下签署、物流、报关由有权人办理并独立核实。覆盖退回改版、供应商书面确认、同批放行、两方接收和原键恢复；复用各包测试夹具，不重建文件/授权能力。",
        "expected": "前四阶段每用例有执行记录或明确被正式渠道/权限阻断，人工岗位有人承接，不伪称自动。",
        "test": "跑四建档、九合同、七物流、十关务用例；逐用例至少正常/缺证或退回路径。故意自审、错版本、代确认和COMMIT丢响应，记录实际拒绝与状态不变。"
      },
      {
        "personDays": 4,
        "action": "执行资金、证明、退税和正常结案联合验收。",
        "logic": "服务费规则已确认：固定CNY 300由D承担，仅在首次获批分账时从D已核验可用余额结算；真实收费仍须D授权及法务/财务确认正式收费依据、票据和收入确认。银行沙箱/许可范围验证实收、可用、扣款和供应商到账各自权威；验证event12减少D可用余额且不减少A合同应付、未知原号不重付。证明/退税人工正式证据核实及更正重交接，跨域报告集合竞争和多原因解除；无真实成功来源即保留unknown并列未验收，不为完成率伪造成功。整理角色手册及未决项交接。",
        "expected": "69用例覆盖清单、缺陷复测和人工岗位签收；未知不能正常结案，银行/监管限制有明确责任。",
        "test": "付款锁额后丢银行响应，原号查单且无解锁；税务决定不改到账，关案不解因。申请后新增对象拒绝结案；恢复演练后重跑原请求不多执行。完整成功需获授权真实来源另验。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "BL-17",
      "status": "细化",
      "summary": "本包实际执行一期69用例联合验收和岗位交接，不重复开发/估算各包单元测试；每项区分应用成功、银行/人工正式来源成功与缺证失败，禁止把离线样例当全流程已实现。",
      "sourceReferences": [
        {
          "path": "doc/examples/step5/http-contract.json",
          "lineStart": 403,
          "lineEnd": 420,
          "reason": "付款独立批准强类型资源是联合验收资金关口",
          "sha256": "f611bc7106dcd4dbbff2bae63c629636955752ddf101490c00d4bcbfa45a161f"
        },
        {
          "path": "交付成果/assets/process-data.js",
          "lineStart": 4,
          "lineEnd": 11,
          "reason": "八阶段真实N01至N23分组",
          "sha256": "37910ef0ab58d2c553203a8e6cf0278cd6b43ae06fd9d5fec5eb7c2caaf78f20"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 162,
          "lineEnd": 184,
          "reason": "付款未知、供应商到账、差异和资金事务验证",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/步骤八系统用例与接口协议.md",
          "lineStart": 64,
          "lineEnd": 68,
          "reason": "现有验证不证明完整生产E2E",
          "sha256": "e2918d2051a08419256735255787e066a167ecd22e70a9bc29a278378a9c632e"
        }
      ],
      "useCaseIds": [
        "supplier-submit",
        "payer-submit",
        "supplier-edit",
        "payer-edit",
        "basis-submit",
        "basis-review",
        "contract-draft",
        "contract-review",
        "contract-revise",
        "contract-sign",
        "contract-activate",
        "framework-use",
        "customs-authority",
        "shipment-plan",
        "shipment-amend",
        "goods-ready",
        "booking-pickup",
        "transport-progress",
        "logistics-exception",
        "logistics-query",
        "s4-basis",
        "s4-draft",
        "s4-revision",
        "s4-review",
        "s4-confirm",
        "s4-filing",
        "s4-official",
        "s4-correction",
        "s4-attachment",
        "s4-query",
        "s5-n11-receipt",
        "s5-n12-allocation",
        "s5-n13-invoice-fee",
        "s5-n14-verification-release",
        "s5-n15-settlement",
        "s5-n16-payment",
        "s5-n17-reconciliation",
        "s6-preparation",
        "s6-cooperation",
        "s6-materials",
        "s6-review",
        "s6-dispatch",
        "s6-official-receipt",
        "s6-correction",
        "s6-certificate",
        "s6-delivery",
        "s6-receipt",
        "s6-objection",
        "s6-query",
        "s7-prepare",
        "s7-package",
        "s7-review",
        "s7-dispatch",
        "s7-notice",
        "s7-correction",
        "s7-decision",
        "s7-credit",
        "s7-recovery",
        "s8-context",
        "s8-report",
        "s8-assignment",
        "s8-hold",
        "s8-remedy",
        "s8-correction",
        "s8-release",
        "s8-case-close",
        "s8-closure-apply",
        "s8-closure-review",
        "s8-query"
      ],
      "nodeIds": [
        "N01",
        "N02",
        "N03",
        "N04",
        "N05",
        "N06",
        "N07",
        "N08",
        "N09",
        "N10",
        "N11",
        "N12",
        "N13",
        "N14",
        "N15",
        "N16",
        "N17",
        "N18",
        "N19",
        "N20",
        "N21",
        "N22",
        "N23"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "69用例验收矩阵、一期边界、岗位和正式证据准入清单。",
          "contract": "八阶段doc/步骤*系统用例文档；最终签字版矩阵待DES-1交付。",
          "test": "没有成功证据的外部用例必须标受阻，不以样例填成功。"
        },
        {
          "dependencyId": "FE-09",
          "consumes": "基础页面回归结果、角色手册、版本/错误恢复交互。",
          "contract": "doc/对内运营产品需求与操作手册.html；doc/对外产品需求与操作手册.html",
          "test": "逐用例从页面触发实际接口，不恢复FE-01已删专项核对。"
        },
        {
          "dependencyId": "BL-16",
          "consumes": "完整来源核验、结案双重重核、历史和拒绝分支。",
          "contract": "proto/trade/reconciliation/v1/reconciliation.proto",
          "test": "unknown及新对象均阻断，原受理仍可查。"
        },
        {
          "dependencyId": "FIN-10",
          "consumes": "银行并发/锁额/独立对账及未知恢复专项结果。",
          "contract": "doc/步骤五系统用例与接口协议.md；资金专项验收记录待交付。",
          "test": "重用已审测试数据复核跨域影响，不重复造银行成功夹具。"
        },
        {
          "dependencyId": "SEC-06",
          "consumes": "撤权、自审、重放及证据访问安全复测结论。",
          "contract": "doc/步骤一身份签名与可靠性设计.md；安全复测报告待交付。",
          "test": "未关闭高风险问题不能签联合验收。"
        },
        {
          "dependencyId": "OPS-06",
          "consumes": "备份恢复、任务接管和人工运行交接记录。",
          "contract": "doc/方案验证中间件环境说明.md；生产差距与恢复演练记录待交付。",
          "test": "恢复后原号不重复业务，原件确切版本仍可定位。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "一期全程人工与银行边界验收",
          "setup": "隔离应用/数据库/文件/扫描/任务环境，真实授权角色及银行沙箱；其余外联关闭，主管人工核验渠道书面确认。",
          "steps": [
            "按八阶段用例矩阵执行并保存每次输入版本/回执",
            "在资金未知、文件归档中断和结案审批前新增对象处注入故障",
            "恢复任务并原号查询",
            "业务、资金、关务、税务岗位分别签收操作及受阻项"
          ],
          "assertions": [
            "69用例有可定位执行证据及明确成功/失败/受阻标签",
            "非银行未自动接入，人工声明不作正式事实",
            "无重付、无无证解锁、无unknown正常结案",
            "高风险缺陷和必需正式来源缺失时不签一期完成"
          ]
        }
      ],
      "openQuestions": [],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 4,
        "baselinePersonDays": 8,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "FE-09",
          "BL-16",
          "FIN-10",
          "SEC-06",
          "OPS-06"
        ]
      },
      "review": "总Agent逐项核对原工作与新步骤：执行建档至报关的联合路径和人工岗位交接。；执行资金、证明、退税和正常结案联合验收。原独立测试并入对应步骤，正常、失败及恢复判定仍保留，未删除功能或减少控制，不调整预算。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit",
            "supplier-edit",
            "payer-edit",
            "basis-submit",
            "basis-review",
            "contract-draft",
            "contract-review",
            "contract-revise",
            "contract-sign",
            "contract-activate",
            "framework-use",
            "customs-authority",
            "shipment-plan",
            "shipment-amend",
            "goods-ready",
            "booking-pickup",
            "transport-progress",
            "logistics-exception",
            "logistics-query",
            "s4-basis",
            "s4-draft",
            "s4-revision",
            "s4-review",
            "s4-confirm",
            "s4-filing",
            "s4-official",
            "s4-correction",
            "s4-attachment",
            "s4-query"
          ],
          "nodeIds": [
            "N01",
            "N02",
            "N03",
            "N04",
            "N05",
            "N06",
            "N07",
            "N08",
            "N09",
            "N10"
          ]
        },
        {
          "useCaseIds": [
            "s5-n11-receipt",
            "s5-n12-allocation",
            "s5-n13-invoice-fee",
            "s5-n14-verification-release",
            "s5-n15-settlement",
            "s5-n16-payment",
            "s5-n17-reconciliation",
            "s6-preparation",
            "s6-cooperation",
            "s6-materials",
            "s6-review",
            "s6-dispatch",
            "s6-official-receipt",
            "s6-correction",
            "s6-certificate",
            "s6-delivery",
            "s6-receipt",
            "s6-objection",
            "s6-query",
            "s7-prepare",
            "s7-package",
            "s7-review",
            "s7-dispatch",
            "s7-notice",
            "s7-correction",
            "s7-decision",
            "s7-credit",
            "s7-recovery",
            "s8-context",
            "s8-report",
            "s8-assignment",
            "s8-hold",
            "s8-remedy",
            "s8-correction",
            "s8-release",
            "s8-case-close",
            "s8-closure-apply",
            "s8-closure-review",
            "s8-query"
          ],
          "nodeIds": [
            "N11",
            "N12",
            "N13",
            "N14",
            "N15",
            "N16",
            "N17",
            "N18",
            "N19",
            "N20",
            "N21",
            "N22",
            "N23"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "BL-17-S1",
          "previousAction": "串联八阶段正常、退回补正和材料改版场景。",
          "currentIds": [
            "BL-17-S1"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-17-S2",
          "previousAction": "核对银行自动与人工路径、正式证据和岗位交接。",
          "currentIds": [
            "BL-17-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-17-S3",
          "previousAction": "关闭联合缺陷、移交值守及剩余阻断项。",
          "currentIds": [
            "BL-17-S1",
            "BL-17-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        }
      ]
    }
  },
  "BL-18": {
    "rationale": "第二期保留原12人日，编排和人工切换在原用例上增量实施。",
    "steps": [
      {
        "personDays": 6,
        "action": "挂接签署和物流通道，保留原业务门禁。",
        "logic": "消费已验签适配结果及DM-10稳定映射；签署发起先持久原clientReference，完成须查原任务、核全部签署方与审核正文关联并归档，签署5与生效6分开。物流通知入待核封套，经独立核实再推进；重复/乱序/旧版结果不得覆盖当前事实。",
        "expected": "渠道成功只产生其权威范围结果，不绕过一期独审、同批放行或文件归档。",
        "test": "签署平台回调完成但签署件存储失败保持verifying且不5；物流到达通知先于启运不直接到达/签收，旧版签署迟到留法律证据不推进新版。"
      },
      {
        "personDays": 6,
        "action": "实现受控人工切换、通知投递和回归验收。",
        "logic": "按交易/通道记录启停、切换人、原任务与确定外部结果；未知任务先原号查单，不并行人工重办。通知消费业务事件，只解析合法接收人和模板版，投递失败不改变合同/物流状态。迁移核原键和旧映射，复用一期证据/权限能力，仅验新增渠道故障与切换。",
        "expected": "同一法律签署/物流事实跨人工自动仅一份有效执行；通知失败可重试，不重触业务。",
        "test": "通道超时后切人工应先拒绝重复办理，核清原任务再接管；重复投递及退信不重复签署/物流事件。关闭通道后旧任务仍按原号恢复，页面可查原历史。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "BL-18",
      "status": "细化",
      "summary": "二期只计签署、物流及通知接入的编排/人工切换增量；用例关联收窄到实际新增能力，不重复一期合同起草、物流计划或共用恢复测试建设。",
      "sourceReferences": [
        {
          "path": "doc/步骤二系统用例与接口协议.md",
          "lineStart": 39,
          "lineEnd": 50,
          "reason": "稳定clientReference、签署任务恢复、迟到旧版法律证据",
          "sha256": "309fb3369cd0cde8dcda7f2b1878fd1cb1518505439e5d38b418ce419fd98102"
        },
        {
          "path": "doc/步骤三系统用例与接口协议.md",
          "lineStart": 47,
          "lineEnd": 57,
          "reason": "来源去重和待审证据不当已核实事实",
          "sha256": "bed3e39150278fba4db2d78386f6de645a89f8c0dd863ef28e37254b5400d339"
        },
        {
          "path": "doc/examples/step2/http-contract.json",
          "lineStart": 389,
          "lineEnd": 406,
          "reason": "编排复用原signature-requests契约，不从浏览器跳转认定签署",
          "sha256": "0f0af03b8a70a1f283f3deae1658fdb02e6c523e8d0b9df01e28198d4ef923bc"
        },
        {
          "path": "proto/trade/contracts/v1/contracts.proto",
          "lineStart": 230,
          "lineEnd": 256,
          "reason": "平台任务/本人会话、归一化通知接收不等于签署",
          "sha256": "c39991b428a7c66710b5758ef9de067e03ff8206c63f6a2c17b3699b396939ce"
        }
      ],
      "useCaseIds": [
        "contract-revise",
        "contract-sign",
        "contract-activate",
        "booking-pickup",
        "transport-progress",
        "logistics-exception",
        "logistics-query"
      ],
      "nodeIds": [
        "N02",
        "N03",
        "N04",
        "N06",
        "N10"
      ],
      "inputs": [
        {
          "dependencyId": "DES-2",
          "consumes": "供应商正式契约、通道开关、回退判定和验收矩阵。",
          "contract": "doc/步骤二系统用例与接口协议.md:31-50；供应商实际契约与通知事件清单待冻结。",
          "test": "平台不支持唯一引用/查单时必须人工核实，不假定可安全重发。"
        },
        {
          "dependencyId": "INT-05",
          "consumes": "验签后的签署任务、归档证据及原号查询结果。",
          "contract": "proto/trade/contracts/v1/contracts.proto:230-256；厂商映射附件待交接。",
          "test": "伪通知、同事件异文、旧版迟到均有隔离记录。"
        },
        {
          "dependencyId": "INT-06",
          "consumes": "受托物流来源、批次/区段/事件键及实际凭据引用。",
          "contract": "proto/trade/logistics/v1/logistics.proto；实际物流供应商映射待交接。",
          "test": "错承运主体/错批次不能进入核实事实。"
        },
        {
          "dependencyId": "INT-07",
          "consumes": "模板版、合法接收人、业务事件引用及投递失败状态。",
          "contract": "doc/sql/domain/schema.sql:959-1020；通知供应商字段映射待冻结。",
          "test": "失败/重复通知不推进业务，敏感签署链接不进入普通消息。"
        },
        {
          "dependencyId": "FE-10",
          "consumes": "本人签署会话/物流来源显示和人工接管入口。",
          "contract": "doc/examples/step2/http-contract.json；doc/examples/step3/http-contract.json",
          "test": "浏览器跳回不显示已签，未知原任务不被新按钮替换。"
        },
        {
          "dependencyId": "OPS-07",
          "consumes": "通道监控、租约恢复/栅栏和故障切换演练记录。",
          "contract": "doc/步骤二系统用例与接口协议.md:39-50；渠道运维交接待提供。",
          "test": "重启任务接管仍绑定原外部引用，旧worker无权覆盖结果。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "自动签署未知时人工接管和消息失败",
          "setup": "一期已验收交易、签署与物流供应商沙箱、通知失败模拟器，授权操作及独立审核身份。",
          "steps": [
            "发起签署后断开响应，立即尝试人工再签",
            "按原clientReference查清并恢复原任务",
            "签署件归档前制造存储故障，随后恢复",
            "物流重复乱序通知和消息退信后重试"
          ],
          "assertions": [
            "不重复创建法律签署任务",
            "归档前不已签，生效另判",
            "物流仍需独核/同批放行",
            "消息结果不改变业务，人工/自动切换审计完整"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "通知增量没有独立稳定业务用例；本包只关联签署/物流实际投递场景，其余通知触发若需新增必须由DES-2列事件清单，不能默认支撑69用例或重复估算一期业务。",
          "owner": "第二期产品负责人",
          "impact": "阻断新增通知触发范围签字，不阻断已明确签署/物流渠道编排。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 6,
        "baselinePersonDays": 12,
        "subtaskCount": 3,
        "dependencies": [
          "DES-2",
          "INT-05",
          "INT-06",
          "INT-07",
          "FE-10",
          "OPS-07"
        ]
      },
      "review": "对照步骤二平台恢复与步骤三第49至57行，核对二期仅接通渠道增量，通知不创造事实，未知切人工先查原号，旧版签署证据不丢弃。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "contract-revise",
            "contract-sign",
            "contract-activate",
            "booking-pickup",
            "transport-progress",
            "logistics-exception",
            "logistics-query"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04",
            "N06",
            "N10"
          ]
        },
        {
          "useCaseIds": [
            "contract-sign",
            "contract-activate",
            "transport-progress",
            "logistics-exception",
            "logistics-query"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04",
            "N06",
            "N10"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "BL-18-S1",
          "previousAction": "连接签署物流通知适配至现有应用命令。",
          "currentIds": [
            "BL-18-S1"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-18-S2",
          "previousAction": "实现分通道开关及原人工任务关联。",
          "currentIds": [
            "BL-18-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-18-S3",
          "previousAction": "结合运维演练联合验收。",
          "currentIds": [
            "BL-18-S1",
            "BL-18-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        }
      ]
    }
  },
  "BL-19": {
    "rationale": "第三期保留原14人日，最终关口包含官方、资金和恢复验收。",
    "steps": [
      {
        "personDays": 7,
        "action": "执行官方办理映射、人工切换及授权查询/筛查增量验收。",
        "logic": "使用已确认企业/经办授权、职责范围、证书、规则版和供应商契约；海关/证明/退税原号派发/查单，正式来源独核后才推进。人工与自动共用稳定外部映射；查询仅许可企业/字段/时效，筛查名单版和人工复核不当法定结论。保留供应商书面确认、独审及全部原件。",
        "expected": "官方提交、受理、放行、签发/决定各自可追溯；缺权限/过期/来源不可核不成功，不扩大查询数据范围。",
        "test": "证书撤销、跨企业查询、原号超时后人工再办均被阻断；旧版官方通知只归原版。查询陈旧结果不能填成正式申报结论，筛查命中需人工复核。"
      },
      {
        "personDays": 7,
        "action": "完成跨域结案、迁移与故障恢复联合验收。",
        "logic": "从FIN-12消费供应商退税实际到账/费用等独立银行证据，不把税务决定当到账。核完整对象集合、官方更正撤销引起批准失效、多原因暂停和逐目标applied；迁移核旧原办理/文件/规则版，不重解释旧事件。申请和决定均重读最新源向量，不重复一期基础开发。",
        "expected": "完整真实来源齐备才验正常结案成功；任何未知/未决/未解除传播仍拒绝，人工回退无重复正式申请。",
        "test": "退税批准后无银行观察，结案必须拒绝；申请后撤销证明或新增更正案，决定拒绝。恢复中重放全部官方通知不多申报/不重复实收；全证据齐时由独立审核员验一次8→10。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "BL-19",
      "status": "细化",
      "summary": "三期只做官方渠道、授权查询、筛查及结案联核增量；冻结真实渠道和来源后验证人工/自动跨渠道防重复。查询和筛查无稳定独立用例，不伪造id，作为关务准备/核对共用输入标待冻结。",
      "sourceReferences": [
        {
          "path": "doc/examples/step7/http-contract.json",
          "lineStart": 171,
          "lineEnd": 188,
          "reason": "官方通知统一输入OfficialNoticeInput，实际源验证另有门禁",
          "sha256": "b3672e800c4caaef135f054a91ac238f53cd851a459ac066c8c6226f7c8e033d"
        },
        {
          "path": "doc/步骤四系统用例与接口协议.md",
          "lineStart": 47,
          "lineEnd": 57,
          "reason": "供应商确认、原号办理和官方证据核实门禁",
          "sha256": "eaf6e283e192ee40ef03978d2fb4945853c01d1713eba11df41922b47a544d69"
        },
        {
          "path": "doc/步骤七系统用例与接口协议.md",
          "lineStart": 31,
          "lineEnd": 43,
          "reason": "税务机关不返回银行到账、未知恢复",
          "sha256": "8b9b0d38e55742d3a1f3de0654513e94ace510722685acdfbc2ea6bea6fc41ab"
        },
        {
          "path": "doc/步骤八系统用例与接口协议.md",
          "lineStart": 13,
          "lineEnd": 40,
          "reason": "全来源集合、真实权威及申请/决定双重核验",
          "sha256": "e2918d2051a08419256735255787e066a167ecd22e70a9bc29a278378a9c632e"
        }
      ],
      "useCaseIds": [
        "s4-basis",
        "s4-filing",
        "s4-official",
        "s4-correction",
        "s4-query",
        "s6-preparation",
        "s6-dispatch",
        "s6-official-receipt",
        "s6-correction",
        "s6-certificate",
        "s6-query",
        "s7-dispatch",
        "s7-notice",
        "s7-correction",
        "s7-decision",
        "s7-credit",
        "s7-recovery",
        "s8-context",
        "s8-report",
        "s8-hold",
        "s8-release",
        "s8-closure-apply",
        "s8-closure-review",
        "s8-query"
      ],
      "nodeIds": [
        "N07",
        "N09",
        "N18",
        "N19",
        "N20",
        "N21",
        "N22",
        "N23"
      ],
      "inputs": [
        {
          "dependencyId": "DES-3",
          "consumes": "正式权限、规则/数据许可、渠道契约、迁移与验收准入。",
          "contract": "doc/步骤四系统用例与接口协议.md；doc/步骤六系统用例与接口协议.md；第三期正式渠道附件待冻结。",
          "test": "缺任一申请职责或许可不得签通道成功验收。"
        },
        {
          "dependencyId": "INT-08",
          "consumes": "海关原办理/确切版、核验源及官方事件键映射。",
          "contract": "proto/trade/customs/v1/customs.proto；正式海关契约待交接。",
          "test": "技术拒绝不能写海关退单，未知仍原号。"
        },
        {
          "dependencyId": "INT-09",
          "consumes": "证明及退税正式提交/补正/决定来源、撤销关系。",
          "contract": "proto/trade/taxproof/v1/taxproof.proto；proto/trade/taxrefund/v1/taxrefund.proto",
          "test": "证明/退税type隔离，旧通知不误绑新版。"
        },
        {
          "dependencyId": "INT-10",
          "consumes": "企业授权范围、查询字段、来源/规则版、时效/限流。",
          "contract": "尚无独立查询Proto/HTTP；DES-3须冻结INT-10资源契约。",
          "test": "无许可及跨企业查询拒绝，结果不作正式放行事实。"
        },
        {
          "dependencyId": "INT-11",
          "consumes": "名单来源/版本、最小字段、命中解释和人工复核引用。",
          "contract": "doc/sql/domain/schema.sql:716-760；外部筛查归一化契约待冻结。",
          "test": "数据源不可用返回待核，命中不自动构成法定结论。"
        },
        {
          "dependencyId": "FE-11",
          "consumes": "官方回执、许可查询、待核/未知及人工路径页面。",
          "contract": "doc/examples/step4/http-contract.json；doc/examples/step6/http-contract.json；doc/examples/step7/http-contract.json",
          "test": "页面不以HTTP成功跳过供应商确认/独审。"
        },
        {
          "dependencyId": "SEC-08",
          "consumes": "证书/授权撤销、企业字段隔离及回调安全复测。",
          "contract": "第三期许可/安全复测记录待交付。",
          "test": "撤权即时生效，历史原键不能绕过。"
        },
        {
          "dependencyId": "OPS-08",
          "consumes": "官方通道容量、恢复、迁移核对及人工回退演练。",
          "contract": "第三期正式渠道运维交接记录待交付。",
          "test": "断连重启后原办理引用稳定，未决不丢失。"
        },
        {
          "dependencyId": "FIN-12",
          "consumes": "供应商退税观察/费用及官方事项资金交接独立证据。",
          "contract": "proto/trade/taxrefund/v1/taxrefund.proto:80；资金联核结构待冻结。",
          "test": "批准、银行实收、归属及差额分别核对，出口代理货款不增额。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "证明撤销与税务批准到账分离的结案竞争",
          "setup": "获正式许可的海关税务测试渠道、查询数据源、名单来源和银行观察；各业务经办/独立审核与资金核对岗位。",
          "steps": [
            "同一事项先人工再切自动，以原号核查不重办",
            "核实退税批准但暂不提供供应商到账观察",
            "生成报告/申请后接收正式证明撤销或新增更正对象",
            "处理重审和银行实际到账，再由独立人申请/决定结案"
          ],
          "assertions": [
            "无重复官方办理",
            "未到账及撤销/新增对象均阻断原结案",
            "查询/筛查不替代正式凭据",
            "仅完整最新真实来源及全部原因/传播闭环才通过8→10"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "授权关务查询和外部名单筛查已有三期范围，但缺独立HTTP/Proto及用例稳定id。请总Agent由DES-3冻结查询/筛查资源、许可和实际挂接点；本包只列现有s4-basis/s8-context等共用关系，不虚构新用例。",
          "owner": "第三期产品负责人及接口架构负责人",
          "impact": "阻断查询/筛查正式联调和范围签字，不阻断既有官方办理契约增量。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 7,
        "baselinePersonDays": 14,
        "subtaskCount": 3,
        "dependencies": [
          "DES-3",
          "INT-08",
          "INT-09",
          "INT-10",
          "INT-11",
          "FE-11",
          "SEC-08",
          "OPS-08",
          "FIN-12"
        ]
      },
      "review": "对照步骤七第35至43行和步骤八最终结案规则，核对官方决定与银行实收分离、查询许可和人工自动共用原办理号、跨域恢复不重复执行。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s4-basis",
            "s4-filing",
            "s4-official",
            "s4-correction",
            "s4-query",
            "s6-preparation",
            "s6-dispatch",
            "s6-official-receipt",
            "s6-correction",
            "s6-certificate",
            "s6-query",
            "s7-dispatch",
            "s7-notice",
            "s7-correction",
            "s7-decision",
            "s7-recovery",
            "s8-context",
            "s8-hold"
          ],
          "nodeIds": [
            "N07",
            "N09",
            "N18",
            "N19",
            "N20",
            "N21",
            "N22",
            "N23"
          ]
        },
        {
          "useCaseIds": [
            "s4-query",
            "s6-certificate",
            "s6-query",
            "s7-credit",
            "s7-recovery",
            "s8-context",
            "s8-report",
            "s8-release",
            "s8-closure-apply",
            "s8-closure-review",
            "s8-query"
          ],
          "nodeIds": [
            "N09",
            "N20",
            "N21",
            "N22",
            "N23"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "BL-19-S1",
          "previousAction": "编排海关税务查询及筛查到原用例。",
          "currentIds": [
            "BL-19-S1"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-19-S2",
          "previousAction": "复核迁移、完整来源及故障恢复。",
          "currentIds": [
            "BL-19-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "BL-19-S3",
          "previousAction": "汇总资金安全运维结论并逐通道启用。",
          "currentIds": [
            "BL-19-S1",
            "BL-19-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        }
      ]
    }
  },
  "DM-01": {
    "rationale": "已有领域模型、47表设计DDL和事务验证；计核对、基础设施缺表与生产仓储实现，不重新建模。",
    "steps": [
      {
        "personDays": 3,
        "action": "落实交易和参与方数据约束及双方写集隔离。",
        "logic": "沿现有DDL做增量迁移/仓储映射，不清空或重建已有业务库，不另建主体主档。tradeNumber唯一，角色/序号唯一；供应商和付款方字段白名单分开，创建HMAC含密钥版且不承担身份认证。金额定点CNY、数量单位和三单一致在领域校验，参与方授权引用从可信上下文取得；创建资料/事件同事务。",
        "expected": "无法用供应商写集覆盖付款方私有声明；预留不产生交易业务行，失败无半份资料。",
        "test": "在已有交易样本的隔离副本应用迁移，记录数量/旧摘要不变；同交易号并发创建只一根。供应商映射包含付款关系私有字段应拒绝；USD/超精度/非法角色拒绝，事务失败无残留。"
      },
      {
        "personDays": 2,
        "action": "实现根版本、送审/批准/更正快照及状态转换不变量。",
        "logic": "revisionNumber是内容版，version是根并发游标；同内容版原因1送审和2批准为不同不可变快照。批准指针不超当前版，已批准更正保存原因3再重审；框架适用等更正不回写旧批准。生命周期2/3/4/5/8/9/10按领域命令校验，终态不可新写，技术受理恢复在外层先行。",
        "expected": "旧全文/HMAC可核验，状态事件与根投影原子变化；不把步骤一提交当终审批准。",
        "test": "同修订插入原因1和2可共存，重复同原因失败；直接更新旧快照/事件触发拒绝。批准后建新版保旧快照，终止/结案新意图拒绝。"
      }
    ],
    "risk": {
      "trigger": "确认需要迁移真实存量交易且历史可还原",
      "extraDays": 2
    },
    "audit": {
      "id": "DM-01",
      "status": "细化",
      "summary": "领域实现交易根、参与方快照和完整修订不变量；应用取号/提交归BL-01，通用受理归BL-02。批准快照原因与内容修订、根version区分，DDL约束不能代替全部业务状态门禁。",
      "sourceReferences": [
        {
          "path": "doc/examples/step1/http-contract.json",
          "lineStart": 123,
          "lineEnd": 140,
          "reason": "本方PUT完整替换资源到领域写集的边界",
          "sha256": "45f17fcac549bb3bc133865d4a1759630af7a01b5f4445f3a2698f7691664637"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 7,
          "lineEnd": 100,
          "reason": "交易、角色快照、原因快照和事件实际字段/唯一键",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 1132,
          "lineEnd": 1138,
          "reason": "交易修订/事件禁止更新删除",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "proto/trade/filing/v1/filing.proto",
          "lineStart": 189,
          "lineEnd": 244,
          "reason": "双方资料和交易创建的真实输入映射",
          "sha256": "a356b4156cfb8e091646d52f5473c50c94f1485f5acb058a0b69af089c639007"
        },
        {
          "path": "doc/examples/step2/entity-projection.json",
          "lineStart": 1,
          "lineEnd": 12,
          "reason": "内容修订4与批准指针、批准快照是不同引用",
          "sha256": "5311ca45d07ecdbae0c71b360945b19d8be564e63a43d48238fd241bc0a59a94"
        }
      ],
      "useCaseIds": [
        "supplier-submit",
        "payer-submit",
        "supplier-edit",
        "payer-edit",
        "basis-submit",
        "basis-review",
        "framework-use"
      ],
      "nodeIds": [
        "N01",
        "N02",
        "N03",
        "N04"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "交易字段归属、CNY/版本/批准快照语义、公共JSON和迁移差距决策。",
          "contract": "doc/sql/domain/schema.sql:7-100；doc/领域拆分评估与交易域设计.md §11",
          "test": "按四建档和依据送审/批准样例逐字段映射，区分数据库硬约束与应用校验。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "同内容版送审和批准并存",
          "setup": "隔离同版本MySQL及领域测试驱动；交易内容R4，分别模拟填报、运营与独立审核可信身份。",
          "steps": [
            "保存原因1送审R4",
            "独审通过保存原因2批准R4并更新批准指针",
            "新增原因3更正R5并尝试修改旧R4快照"
          ],
          "assertions": [
            "R4两类快照身份不同且可还原",
            "R5不覆盖R4批准证据",
            "旧快照更新被拒绝，状态变更和事件同事务"
          ]
        }
      ],
      "openQuestions": [],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 2.5,
        "baselinePersonDays": 5,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1"
        ]
      },
      "review": "对照步骤一修订与批准快照规则，核对内容版与根并发版本区分、不重建主体主档、仓储写集隔离和旧快照保留；迁移仅在隔离副本验证。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit",
            "supplier-edit",
            "payer-edit"
          ],
          "nodeIds": [
            "N01"
          ]
        },
        {
          "useCaseIds": [
            "basis-submit",
            "basis-review",
            "framework-use"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "DM-01-S1",
          "previousAction": "复核交易四表与编号预留、操作确认、原受理记录的缺口。",
          "currentIds": [
            "DM-01-S1"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "DM-01-S2",
          "previousAction": "实现交易仓储、不可变版本、摘要和迁移增量。",
          "currentIds": [
            "DM-01-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "DM-01-S3",
          "previousAction": "把现有断言转为可重复事务测试。",
          "currentIds": [
            "DM-01-S1",
            "DM-01-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        }
      ]
    }
  },
  "DM-02": {
    "rationale": "原件版本字段和S3验证已具备，应用约束尚需落地。",
    "steps": [
      {
        "personDays": 2,
        "action": "落实逻辑文件、确切修订、用途和摘要约束。",
        "logic": "同logicalFileNumber/revision唯一；新字节另修订，固定storagePath所指VersionId、长度和contentDigest。业务FileRef只含逻辑号/修订/摘要/用途，材料包用途可引用确切锚点但摘要仍是整文件。业务引用核文件归属/用途和clean固定版本；clean只可引用，不代表内容真实或业务通过。",
        "expected": "同一历史引用始终同字节，文件确认不产生合同/银行/监管成功。",
        "test": "同逻辑修订尝试写不同摘要/路径应拒绝；同物理三单材料以不同用途/锚点引用时仍核整文件摘要，错用途不通过。"
      },
      {
        "personDays": 1,
        "action": "落实历史保留和授权引用边界。",
        "logic": "源文件更正建立新修订，已送审/已批准历史引用不可覆盖或级联删除；法律保全和到期销毁须正式政策，不硬编期限。领域返回文件状态/归属/用途与历史定位，当前读取授权由安全/BL-03实时决定，不把旧引用当永久下载授权。",
        "expected": "历史证据可重验，撤权不删历史但不能再读原件，日志不复制二进制或敏感地址。",
        "test": "更正到V2后读取原批准引用仍定位V1；删除被历史引用文件拒绝。撤权后经服务入口读取V1拒绝而元数据不被篡改。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "DM-02",
      "status": "细化",
      "summary": "领域只负责逻辑文件/修订/用途和历史引用不变量；存储、扫描及任务运行分别归OPS-04/BL-03。确切版本由不可变元数据解析，不能把HTTP命令或latest地址塞进业务清单。",
      "sourceReferences": [
        {
          "path": "doc/examples/step1/http-contract.json",
          "lineStart": 267,
          "lineEnd": 284,
          "reason": "文件确认输出FileRevision，不是领域业务批准",
          "sha256": "45f17fcac549bb3bc133865d4a1759630af7a01b5f4445f3a2698f7691664637"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 147,
          "lineEnd": 172,
          "reason": "document_file_tab唯一修订及storage_path/摘要/用途",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/步骤六系统用例与接口协议.md",
          "lineStart": 19,
          "lineEnd": 28,
          "reason": "公共FileRef白名单、用途18至25和确切VersionId映射",
          "sha256": "c80e0ceb5b024eacc205546ce30739d4118ec98c8ffcc6bd960584142b91d409"
        },
        {
          "path": "proto/trade/filing/v1/filing.proto",
          "lineStart": 258,
          "lineEnd": 279,
          "reason": "上传预期摘要和长度不等于业务审核",
          "sha256": "a356b4156cfb8e091646d52f5473c50c94f1485f5acb058a0b69af089c639007"
        },
        {
          "path": "doc/examples/step1/file-revision.json",
          "lineStart": 1,
          "lineEnd": 8,
          "reason": "不可变文件修订实际资源形状",
          "sha256": "0a5652d2d124fd5b9eef73d7908b48da744dbb2254fe37da2bed04fbf179f023"
        }
      ],
      "useCaseIds": [
        "supplier-submit",
        "payer-submit",
        "supplier-edit",
        "payer-edit"
      ],
      "nodeIds": [
        "N01"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "文件用途白名单、保留/法律保全政策和VersionId解析格式。",
          "contract": "doc/领域拆分评估与交易域设计.md §11；生产保留期限待法务冻结。",
          "test": "文件旧引用不跟随latest，销毁无正式许可不执行。"
        },
        {
          "dependencyId": "DM-01",
          "consumes": "预留/交易归属、角色快照和修订证据引用。",
          "contract": "doc/sql/domain/schema.sql:7-100",
          "test": "文件引用不能绑定另一交易或越过角色边界。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "旧批准引用保持原文件版本",
          "setup": "交易R1引用材料文件V1并送审，随后上传V2；文件服务与安全入口使用真实测试授权。",
          "steps": [
            "形成V2新修订并在交易新版引用",
            "解析旧送审材料清单",
            "撤销用户授权后请求旧文件下载"
          ],
          "assertions": [
            "旧清单仍是V1和原摘要",
            "V2不覆盖原件、旧审阅证据可核验",
            "撤权后不下载，文件存在不等于有访问权"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "生产证据保留期、法律保全和销毁审批尚无正式确认值；不得由样例或普通存储生命周期擅自删除。",
          "owner": "法务合规负责人",
          "impact": "阻断生产销毁策略启用，不阻断追加保留及权限隔离实现。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 1.5,
        "baselinePersonDays": 3,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "DM-01"
        ]
      },
      "review": "总Agent逐项核对原工作与新步骤：落实逻辑文件、确切修订、用途和摘要约束。；落实历史保留和授权引用边界。原独立测试并入对应步骤，正常、失败及恢复判定仍保留，未删除功能或减少控制，不调整预算。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit"
          ],
          "nodeIds": [
            "N01"
          ]
        },
        {
          "useCaseIds": [
            "supplier-edit",
            "payer-edit"
          ],
          "nodeIds": [
            "N01"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "DM-02-S1",
          "previousAction": "核对文件模型、用途和保留策略边界。",
          "currentIds": [
            "DM-02-S1"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "DM-02-S2",
          "previousAction": "实现确切文件引用、不可覆盖仓储及保留标记。",
          "currentIds": [
            "DM-02-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "DM-02-S3",
          "previousAction": "验证跨用途误用和历史版覆盖拒绝。",
          "currentIds": [
            "DM-02-S1",
            "DM-02-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        }
      ]
    }
  },
  "DM-03": {
    "rationale": "合同状态与用途已有设计，计人工签署分支和领域实现。",
    "steps": [
      {
        "personDays": 2,
        "action": "落实用途身份、确切版本及审核冻结。",
        "logic": "逐单用途10/11/12以trade+用途唯一，引用原因2批准快照；公共协议trade=NULL且主体/用途/范围/日期明确。合同工作指针不当法律有效指针，已送审正文/主体更正另版，审核者分人、审核快照绑定原文件。根无version列，不擅加；强ETag用受理单调游标及版/事件尾避免ABA。",
        "expected": "新草稿不废旧生效版，不新建合同身份绕唯一性；旧正文/批准证据完整。",
        "test": "V1有效/V2草稿并存、两次同正文草稿PUT后旧标签失效；同交易用途另建身份失败，旧审核不能绑定改版正文。"
      },
      {
        "personDays": 2,
        "action": "落实已签、生效、正式替代与公共适用不变量。",
        "logic": "签署真实性/全部签署方/正文关联及归档证据由应用核实后领域4→5，生效另核5→6；签署件hash不要求等于审阅件。正式替代新6与旧6→7同事务，未知签署不得静默作废。框架自然日含首尾，逐单显式引用确切版重审；报关正式授权用途13与同一代理预付认可不由合同已签推导。",
        "expected": "无证据不签不生效，日期/主体/用途错不适用，不产生付款资格。",
        "test": "结束日当天与次日边界分别核验；替代中途失败两版状态回滚。少一方授权、旧任务未知、认可代理不一致均拒绝。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "DM-03",
      "status": "细化",
      "summary": "实现合同用途、工作版与法律有效版、确切审核正文及生效替代不变量；不在领域重复做平台任务或人工核实应用流程。一期人工签署协议缺口随BL-05上报。",
      "sourceReferences": [
        {
          "path": "doc/examples/step2/http-contract.json",
          "lineStart": 509,
          "lineEnd": 526,
          "reason": "独立activation-decisions资源映射合同生效规则",
          "sha256": "0f0af03b8a70a1f283f3deae1658fdb02e6c523e8d0b9df01e28198d4ef923bc"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 102,
          "lineEnd": 145,
          "reason": "合同trade+用途唯一，版本冻结审核件/签署件及状态",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/步骤二系统用例与接口协议.md",
          "lineStart": 5,
          "lineEnd": 29,
          "reason": "三种合同用途、正式授权、框架逐单更正",
          "sha256": "309fb3369cd0cde8dcda7f2b1878fd1cb1518505439e5d38b418ce419fd98102"
        },
        {
          "path": "doc/步骤二系统用例与接口协议.md",
          "lineStart": 72,
          "lineEnd": 78,
          "reason": "强标签避免ABA、合同有效日期首尾均含",
          "sha256": "309fb3369cd0cde8dcda7f2b1878fd1cb1518505439e5d38b418ce419fd98102"
        },
        {
          "path": "proto/trade/contracts/v1/contracts.proto",
          "lineStart": 168,
          "lineEnd": 203,
          "reason": "工作版不是生效版，签署文件和审阅结果分别投影",
          "sha256": "c39991b428a7c66710b5758ef9de067e03ff8206c63f6a2c17b3699b396939ce"
        }
      ],
      "useCaseIds": [
        "contract-draft",
        "contract-review",
        "contract-revise",
        "contract-sign",
        "contract-activate",
        "framework-use",
        "customs-authority"
      ],
      "nodeIds": [
        "N02",
        "N03",
        "N04"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "人工签署核实结果结构、生效条件、日期和公共适用决策。",
          "contract": "doc/步骤二系统用例与接口协议.md；一期人工签署输入待冻结。",
          "test": "契约区分签署与生效，不把平台回调作为通用已签证明。"
        },
        {
          "dependencyId": "DM-02",
          "consumes": "审核正文/最终签署件不可变引用及用途/授权边界。",
          "contract": "doc/sql/domain/schema.sql:122-172",
          "test": "旧审核件可还原，签署件另存且完整性/正文关联可核验。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "新工作版不替代法律生效版",
          "setup": "逐单合同V1状态6，当前建立V2；两方合法授权证据及独立合同审核身份。",
          "steps": [
            "V2送审后另版更正，尝试沿用V2审核",
            "归档新确切版完整签署证据",
            "单独批准生效并正式替代V1",
            "在替代事务中注入一次失败后重试原意图"
          ],
          "assertions": [
            "未正式替代前V1始终有效",
            "已签和生效记录不同",
            "失败无一新一旧半状态，成功同事务旧7/新6"
          ]
        }
      ],
      "openQuestions": [],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 2,
        "baselinePersonDays": 4,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "DM-02"
        ]
      },
      "review": "总Agent逐项核对原工作与新步骤：落实用途身份、确切版本及审核冻结。；落实已签、生效、正式替代与公共适用不变量。原独立测试并入对应步骤，正常、失败及恢复判定仍保留，未删除功能或减少控制，不调整预算。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "contract-draft",
            "contract-review",
            "contract-revise"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04"
          ]
        },
        {
          "useCaseIds": [
            "contract-sign",
            "contract-activate",
            "framework-use",
            "customs-authority"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "DM-03-S1",
          "previousAction": "核对三种合同用途、公共协议及适用期间。",
          "currentIds": [
            "DM-03-S1"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "DM-03-S2",
          "previousAction": "实现版本、生效及人工签署核实值对象与约束。",
          "currentIds": [
            "DM-03-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "DM-03-S3",
          "previousAction": "验证正文变更、授权到期及不完整签署证据。",
          "currentIds": [
            "DM-03-S1",
            "DM-03-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        }
      ]
    }
  },
  "DM-04": {
    "rationale": "计划、状态和占量SQL已有，按规则落地而非重新设计物流系统。",
    "steps": [
      {
        "personDays": 2,
        "action": "落实分配累计、不可变完整计划及更正/取消约束。",
        "logic": "交易根串行同交易全部批次，READ COMMITTED按有效分配FOR UPDATE当前读，以定点数量/金额分别不超原因2批准行，单位同一。计划无version列，以受理游标/冻结封套派生planRevision；未执行改前封存旧计划。已提货不可取消，未知不释放；跨批准内容版迁移未确认时阻断。",
        "expected": "新增批次/计划改版不重置额度；取消保留撤销行，已履约不返量。",
        "test": "同根两连接70+70竞争批准100，只一份成功；同批40→50只算50。执行后PUT及跨批准版新建均拒绝，旧计划封套可还原。"
      },
      {
        "personDays": 2,
        "action": "落实独立核实事件、区段顺序和多异常状态。",
        "logic": "待审声明不进eventStatus=1核心事实；备货只事件不变计划态，核实订舱/提货/启运/末段到达/签收才依序2/3/4/5/6。出境须同批正式放行，有权签收证据齐；实际时刻UTC有序。异常7冻结最初阶段并按未解集合阻断，处置齐仅恢复原阶段，正式灭失另走9，不触资金。",
        "expected": "迟到不倒退、技术失败不变履约失败，事件追加写不覆盖。",
        "test": "前段未到达却核后段提货拒绝；双异常只处置一项仍7，两项齐回原阶段。扫描通过但缺签收授权仍不能6，重复源事件只记一次。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "DM-04",
      "status": "细化",
      "summary": "实现物流累计占量、冻结计划及核实事件状态规则；跨行总量靠同交易根当前读而非单表CHECK。多个异常保最初恢复阶段，计划及运输事实分开。",
      "sourceReferences": [
        {
          "path": "doc/examples/step3/http-contract.json",
          "lineStart": 51,
          "lineEnd": 68,
          "reason": "计划PUT只改计划，不能写实际物流状态",
          "sha256": "efa5e3523ca34c6d3f431f14f4de78d5c06c65218be72fb231aa318cc7f09aec"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 174,
          "lineEnd": 268,
          "reason": "物流四表、商品/区段及不可变事件字段",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/步骤三系统用例与接口协议.md",
          "lineStart": 19,
          "lineEnd": 45,
          "reason": "物流状态、planRevision、累计量额和跨批准版冻结",
          "sha256": "bed3e39150278fba4db2d78386f6de645a89f8c0dd863ef28e37254b5400d339"
        },
        {
          "path": "doc/步骤三系统用例与接口协议.md",
          "lineStart": 59,
          "lineEnd": 75,
          "reason": "RC当前读根锁、多区段和异常恢复",
          "sha256": "bed3e39150278fba4db2d78386f6de645a89f8c0dd863ef28e37254b5400d339"
        },
        {
          "path": "doc/examples/step3/entity-projection.json",
          "lineStart": 4,
          "lineEnd": 38,
          "reason": "批准100件与批次40件及区段输入示例",
          "sha256": "553bd64b38d1b7604c69ccf9b0e43ad5371f767257676ef13d9ad517c4776f59"
        }
      ],
      "useCaseIds": [
        "shipment-plan",
        "shipment-amend",
        "goods-ready",
        "booking-pickup",
        "transport-progress",
        "logistics-exception",
        "logistics-query"
      ],
      "nodeIds": [
        "N05",
        "N06",
        "N10"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "物流粒度、源证据/路线出境识别和未执行更正边界。",
          "contract": "doc/步骤三系统用例与接口协议.md",
          "test": "明确DB单行约束与应用跨行累计/状态测试各自责任。"
        },
        {
          "dependencyId": "DM-01",
          "consumes": "交易根、原因2商品/主体快照、内容版及根锁。",
          "contract": "doc/sql/domain/schema.sql:7-100",
          "test": "使用另一批准修订不能绕开已有有效分配。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "根锁后当前读防超分配",
          "setup": "真实隔离MySQL两个连接；批准100件10000元，两个不同幂等意图同时读初始无分配。",
          "steps": [
            "第一事务取得根锁创建70件并提交",
            "第二事务取得根锁后重新当前读累计，再申请70件",
            "读取计划历史并提交双异常事件"
          ],
          "assertions": [
            "第二事务看到已占70而拒绝",
            "不靠REPEATABLE READ旧快照普通SUM",
            "双异常独立保原阶段，无退款/付款副作用"
          ]
        }
      ],
      "openQuestions": [],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 2,
        "baselinePersonDays": 4,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "DM-01"
        ]
      },
      "review": "总Agent逐项核对原工作与新步骤：落实分配累计、不可变完整计划及更正/取消约束。；落实独立核实事件、区段顺序和多异常状态。原独立测试并入对应步骤，正常、失败及恢复判定仍保留，未删除功能或减少控制，不调整预算。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "shipment-plan",
            "shipment-amend"
          ],
          "nodeIds": [
            "N05",
            "N06"
          ]
        },
        {
          "useCaseIds": [
            "goods-ready",
            "booking-pickup",
            "transport-progress",
            "logistics-exception",
            "logistics-query"
          ],
          "nodeIds": [
            "N05",
            "N06",
            "N10"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "DM-04-S1",
          "previousAction": "核对批准行、批次、区段和事件键。",
          "currentIds": [
            "DM-04-S1"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "DM-04-S2",
          "previousAction": "实现占量、更正和核实事件领域规则。",
          "currentIds": [
            "DM-04-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "DM-04-S3",
          "previousAction": "验证累计超量、重复乱序与多异常。",
          "currentIds": [
            "DM-04-S1",
            "DM-04-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        }
      ]
    }
  },
  "DM-05": {
    "rationale": "关务修订与办理请求已有新DDL及守卫样例，仍需生产仓储和状态转换。",
    "steps": [
      {
        "personDays": 3,
        "action": "落实草稿完整版本、占量及审核/书面确认不变量。",
        "logic": "完整表头/商品/contentHash/批准快照/planRevision冻结；同交易/批次根锁当前读其他有效申报最新行，本申报新修订仅替换旧占量。任何内容变化不继承旧独审/供应商确认；确认绑定申报/版/hash/授权/书面文件，不接受技术凭据代替。未知办理或无正式改版许可拒绝更正。",
        "expected": "V1可重建，V2须新审/新确认；拆报规则不明不允许第二单。",
        "test": "只改一栏后尝试带旧批准/确认失败；并发两单超批次量额只允许合法范围；UPDATE旧修订触发拒绝，旧占量不重复累计。"
      },
      {
        "personDays": 2,
        "action": "落实原办理、官方事件核实、撤回及分方交接规则。",
        "logic": "待核声明不改变正式状态；官方核实要真实来源、稳定外部键、确切版/原办理及阶段前序。外部键同文去重异文拒绝，迟到保历史不倒退。正式撤回核实才状态11并释放占量。交付与供应商/出口代理本人接收分开，发出和一方接收不能补造另一方接收。",
        "expected": "官方号/时刻只随已核事实写，技术错误不作退单；不可变事件与根投影原子。",
        "test": "未知撤回不释放量；同外部键异文不更新官方状态。A接收后B仍待收，F代收拒绝；任一投影更新失败整事务回滚。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "DM-05",
      "status": "细化",
      "summary": "领域实现完整报关修订、同批占量、独审/供应商书面确认精确绑定及正式事件去重；官方事实与待核声明分离，撤回意图不释放量。",
      "sourceReferences": [
        {
          "path": "doc/examples/step4/http-contract.json",
          "lineStart": 315,
          "lineEnd": 332,
          "reason": "官方证据核实独立内部资源映射领域正式事件",
          "sha256": "6c50164045c0cf29da97201d6bda7623acc367f4773c6e31fbd4dd853a0b6085"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 270,
          "lineEnd": 390,
          "reason": "报关根、完整修订、办理号、商品行和正式事件表",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/步骤四系统用例与接口协议.md",
          "lineStart": 47,
          "lineEnd": 57,
          "reason": "改版、同版独审/书面确认、未知和撤回门禁",
          "sha256": "eaf6e283e192ee40ef03978d2fb4945853c01d1713eba11df41922b47a544d69"
        },
        {
          "path": "交付成果/assets/step-four-usecases-model.js",
          "lineStart": 45,
          "lineEnd": 72,
          "reason": "独审确认、官方核实和分别交付的领域事务",
          "sha256": "d7f4a2d46a140a2287901ec02c005089534b10faa4ea4d9b5140cb4b7cf839b5"
        },
        {
          "path": "doc/examples/step4/entity-projection.json",
          "lineStart": 1,
          "lineEnd": 15,
          "reason": "草稿源快照、计划版与不同角色精确引用",
          "sha256": "d478ebe2124710a545c6bab0c9d84ce7013172b5fe9219dfb7487eb3b2f763ae"
        }
      ],
      "useCaseIds": [
        "s4-basis",
        "s4-draft",
        "s4-revision",
        "s4-review",
        "s4-confirm",
        "s4-filing",
        "s4-official",
        "s4-correction",
        "s4-attachment",
        "s4-query"
      ],
      "nodeIds": [
        "N07",
        "N08",
        "N09"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "双抬头适用、拆报合并/正式更正撤回规则和事件映射。",
          "contract": "doc/步骤四系统用例与接口协议.md",
          "test": "未确认依据只能准备，不根据样例推定合法。"
        },
        {
          "dependencyId": "DM-02",
          "consumes": "草稿/书面确认/正式附件2/官方回执确切文件和用途。",
          "contract": "doc/sql/domain/schema.sql:147-172；proto/trade/customs/v1/customs.proto",
          "test": "错用途、未扫描或摘要错均不得确认/放行。"
        },
        {
          "dependencyId": "DM-04",
          "consumes": "冻结批次计划版、批准分配行及占量/取消边界。",
          "contract": "doc/sql/domain/schema.sql:174-268",
          "test": "同批商品单位/数量不匹配应拒绝，未知计划不释放量。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "改版与确认并发、撤回未知",
          "setup": "草稿V1已独审、供应商待确认；同批商品40件，两个并发连接及可信供应商/报关经办身份。",
          "steps": [
            "同根并发创建V2与确认V1",
            "对可申请版本建立原办理后标执行未知",
            "尝试改版/撤回释放量",
            "正式撤回证据独核后重验占量"
          ],
          "assertions": [
            "不存在V2继承V1确认",
            "未知前不改正文、不释放量",
            "正式撤回才释放，原办理/修订/事件均保留"
          ]
        }
      ],
      "openQuestions": [],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 2.5,
        "baselinePersonDays": 5,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "DM-02",
          "DM-04"
        ]
      },
      "review": "总Agent逐项核对原工作与新步骤：落实草稿完整版本、占量及审核/书面确认不变量。；落实原办理、官方事件核实、撤回及分方交接规则。原独立测试并入对应步骤，正常、失败及恢复判定仍保留，未删除功能或减少控制，不调整预算。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s4-basis",
            "s4-draft",
            "s4-revision",
            "s4-review",
            "s4-confirm"
          ],
          "nodeIds": [
            "N07",
            "N08"
          ]
        },
        {
          "useCaseIds": [
            "s4-filing",
            "s4-official",
            "s4-correction",
            "s4-attachment",
            "s4-query"
          ],
          "nodeIds": [
            "N09"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "DM-05-S1",
          "previousAction": "核对不可变修订、办理请求和原件交接数据。",
          "currentIds": [
            "DM-05-S1"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "DM-05-S2",
          "previousAction": "实现独审、书面确认和正式事件约束。",
          "currentIds": [
            "DM-05-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "DM-05-S3",
          "previousAction": "复用守卫样例测试越权与假退单。",
          "currentIds": [
            "DM-05-S1",
            "DM-05-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        }
      ]
    }
  },
  "DM-06": {
    "rationale": "证明及退税模型已有，合用公共版本结构但分开事项和正式状态。",
    "steps": [
      {
        "personDays": 2,
        "action": "落实type隔离、范围唯一和不可变完整提交包。",
        "logic": "trade/type/scope唯一，scope由确认规则计算，不能默认一交易一证明；type1金额NULL，type2准备可NULL、正式提交正额CNY。映射封闭submissionContent和FileRef manifest后算packageHash；前版/正式补正事件精确关联，准备UNCONFIRMED不能正式办。数据库冻结内容/清单/hash/前版，应用校验规则/重叠范围和逐字段语义。",
        "expected": "两类案件不混写，正文变化必换版和hash，旧包可还原。",
        "test": "对证明写0金额CHECK拒绝；同scope同type重复失败但不同type可区分；只改金额不改文件也变hash，更新旧正文/删除旧提交触发拒绝。"
      },
      {
        "personDays": 2,
        "action": "落实独审、源变更失效、原办理和官方事件规则。",
        "logic": "审核快照初NULL、结果绑定确切包和可信独立人；源版变使受影响未执行批准失效事件18，旧正式结果不撤写。内部批准只3，意图5不当正式提交6；正式事件6..12必须确切提交版、可信命名空间稳定键和机关号，外部键全局去重，未知执行3保原dispatchReference不重派。",
        "expected": "正式受理不由技术任务状态推导，旧通知归旧版，技术错误不写机关拒绝。",
        "test": "自审/旧包批准拒绝；正式事件缺机关号或版被约束拒绝。并发相同外部键只一事实、异文冲突，源版变更不能覆盖历史批准。"
      },
      {
        "personDays": 1,
        "action": "落实证明交接异议和退税到账核对不同完成条件。",
        "logic": "证明签发8后需出口代理交付13和供应商本人核对14，异议实质处置16、官方更正后重交接；退税不用证明13/14，事件17引用资金域观察及供应商归属，申请/批准/到账分开。全部适用核对完成才9，终拒/撤销不自动交易结案。",
        "expected": "收到不等于核对通过，税务批准不当银行实收，出口代理货款三位置不增额。",
        "test": "证明更正后旧接收无效；出口代理代供应商确认拒绝。退税批准900实际800保持差异，资金观察不可得为unknown而非0，不可9。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "DM-06",
      "status": "细化",
      "summary": "证明和退税共用三表但type严格隔离；完整正文+manifest摘要、正式补正链、独审投影和官方事件均有明确约束。事件17只引用资金真实观察，不自造退税现金。",
      "sourceReferences": [
        {
          "path": "doc/examples/step6/http-contract.json",
          "lineStart": 75,
          "lineEnd": 92,
          "reason": "完整SubmissionInput映射共享税务提交版，而非自由JSON",
          "sha256": "655fd00fa8ede63e226b65069fcc050df3849310bc0ebc47e5be565525fe6b7d"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 392,
          "lineEnd": 475,
          "reason": "共享税务三表、唯一范围、NULL金额、执行/正式事件字段",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 1177,
          "lineEnd": 1180,
          "reason": "提交内容/清单/hash/前版/补正引用冻结及历史不可删除",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/步骤六系统用例与接口协议.md",
          "lineStart": 15,
          "lineEnd": 38,
          "reason": "证明8/9、交接异议及公共封闭载荷",
          "sha256": "c80e0ceb5b024eacc205546ce30739d4118ec98c8ffcc6bd960584142b91d409"
        },
        {
          "path": "doc/步骤七系统用例与接口协议.md",
          "lineStart": 7,
          "lineEnd": 17,
          "reason": "退税申请/批准/到账分开和18种事件语义",
          "sha256": "8b9b0d38e55742d3a1f3de0654513e94ace510722685acdfbc2ea6bea6fc41ab"
        }
      ],
      "useCaseIds": [
        "s6-preparation",
        "s6-cooperation",
        "s6-materials",
        "s6-review",
        "s6-dispatch",
        "s6-official-receipt",
        "s6-correction",
        "s6-certificate",
        "s6-delivery",
        "s6-receipt",
        "s6-objection",
        "s6-query",
        "s7-prepare",
        "s7-package",
        "s7-review",
        "s7-dispatch",
        "s7-notice",
        "s7-correction",
        "s7-decision",
        "s7-credit",
        "s7-recovery"
      ],
      "nodeIds": [
        "N18",
        "N19",
        "N20",
        "N21"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "税务职责/范围、正式来源、共用JSON及证明/退税完成条件决策。",
          "contract": "doc/领域拆分评估与交易域设计.md §11；主管职责/范围规则待冻结。",
          "test": "未知规则无默认税率/时限，全部分支拒绝未知字段。"
        },
        {
          "dependencyId": "DM-05",
          "consumes": "正式附件2修订、批准源版、确认/交接及更正撤销引用。",
          "contract": "doc/sql/domain/schema.sql:270-390；proto/trade/customs/v1/customs.proto",
          "test": "更正附件2后受影响税务未执行批准失效，旧官方事件不删除。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "证明与退税共享表隔离及源变更失效",
          "setup": "同交易type1证明案与type2退税案，确切附件2V1；领域可信经办/独审身份。",
          "steps": [
            "分别提交完整包并独审",
            "将附件2更正V2，传播到两案受影响未执行批准",
            "尝试旧包正式办理及跨type入口读取/写入",
            "另版重审并查询旧包"
          ],
          "assertions": [
            "受影响批准有事件18且不可执行",
            "两type入口严格隔离",
            "旧内容/hash/官方事件不覆盖，新版重新独审"
          ]
        }
      ],
      "openQuestions": [],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 2.5,
        "baselinePersonDays": 5,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "DM-05"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s6-preparation",
            "s6-cooperation",
            "s6-materials",
            "s7-prepare",
            "s7-package"
          ],
          "nodeIds": [
            "N18",
            "N21"
          ]
        },
        {
          "useCaseIds": [
            "s6-review",
            "s6-dispatch",
            "s6-official-receipt",
            "s6-correction",
            "s6-certificate",
            "s6-query",
            "s7-review",
            "s7-dispatch",
            "s7-notice",
            "s7-correction",
            "s7-decision",
            "s7-recovery"
          ],
          "nodeIds": [
            "N19",
            "N20",
            "N21"
          ]
        },
        {
          "useCaseIds": [
            "s6-delivery",
            "s6-receipt",
            "s6-objection",
            "s7-credit"
          ],
          "nodeIds": [
            "N20",
            "N21"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "DM-06-S1",
          "previousAction": "核对证明、退税确定版及原件历史映射。",
          "currentIds": [
            "DM-06-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "DM-06-S2",
          "previousAction": "实现资料、机关事件和到账引用约束。",
          "currentIds": [
            "DM-06-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "DM-06-S3",
          "previousAction": "复用语义测试覆盖补正与异议。",
          "currentIds": [
            "DM-06-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "DM-07": {
    "rationale": "报告和多原因暂停已有设计，需落地源版本向量与状态转换。",
    "steps": [
      {
        "personDays": 3,
        "action": "落实完整源向量/对象集合、报告与正常结案业务事件。",
        "logic": "事件18保存白名单报告schema/ruleVersion/sourceVector/objectSets/checks/evidence；每项pass/fail/unknown，不接客户端allPassed。源版本和完整对象集合均需根锁当前读重验。申请19不改8，独审再验后17+8→10；退回20，终态不可新写。技术受理仅最小回执，不承担业务报告。",
        "expected": "新对象使报告失效；unknown/未决/未核到账/不平衡阻断，旧报告永久可查。",
        "test": "向量旧对象版均未变但新增对象，应判陈旧；请求带未知JSON字段拒绝。申请后新增暂停，审批不写17。"
      },
      {
        "personDays": 2,
        "action": "落实案件11分支、逐原因有效集合及更正失效传播。",
        "logic": "decisionSnapshot公共字段加decisionType/details封闭分支，action/result按公共契约组合，独立通过须approver与申请人不同。holdReference为原暂停事件号，received与applied不同；解除只原因且逐目标applied齐，关案不清有效因。更正范围决定不批准新事实，已执行保留、未知原号先恢复，资金差异由资金域处理。",
        "expected": "同案多因、跨目标传播和关闭后有效限制可表达，不新增isHold/isClosed或技术封套权威。",
        "test": "关案后H2仍有效；H1独审通过但目标只received仍阻断。跨案件解除/错action/result/自由details字段拒绝；更正后旧未执行批准不能再执行。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "DM-07",
      "status": "细化",
      "summary": "实现报告/申请的业务事件和11种合规决定封闭载荷；多原因与逐目标传播不藏通用任务表，关案不解因。现公共§11已包含步骤八分支，旧文末要求再合入的说明已过时，记录给总Agent。",
      "sourceReferences": [
        {
          "path": "doc/examples/step8/http-contract.json",
          "lineStart": 147,
          "lineEnd": 164,
          "reason": "HoldInput只创建暂停决定资源，不改生命周期",
          "sha256": "baed7583fe871d78d476eb5e812cc2338f2c3d45ed0b5475a5ddc19f71a40c79"
        },
        {
          "path": "doc/领域拆分评估与交易域设计.md",
          "lineStart": 594,
          "lineEnd": 594,
          "reason": "公共规范已明确decision_type/details及11种封闭分支",
          "sha256": "9756de6bf51abc7ed64763295fafe9949093b33bf8490867b2197567856e35b6"
        },
        {
          "path": "doc/领域拆分评估与交易域设计.md",
          "lineStart": 640,
          "lineEnd": 642,
          "reason": "报告18、申请19/20和结案17载荷",
          "sha256": "9756de6bf51abc7ed64763295fafe9949093b33bf8490867b2197567856e35b6"
        },
        {
          "path": "doc/examples/step8/compliance-decision-contract.json",
          "lineStart": 1,
          "lineEnd": 21,
          "reason": "公共决定必填项、独立approver与applied规则",
          "sha256": "d12ed2b73917894817e4782ff948ec529971b5896b91268c468b112b9d9c09f3"
        },
        {
          "path": "doc/步骤八系统用例与接口协议.md",
          "lineStart": 30,
          "lineEnd": 52,
          "reason": "多原因、更正、结案及根锁协调",
          "sha256": "e2918d2051a08419256735255787e066a167ecd22e70a9bc29a278378a9c632e"
        }
      ],
      "useCaseIds": [
        "s8-context",
        "s8-report",
        "s8-assignment",
        "s8-hold",
        "s8-remedy",
        "s8-correction",
        "s8-release",
        "s8-case-close",
        "s8-closure-apply",
        "s8-closure-review",
        "s8-query"
      ],
      "nodeIds": [
        "N22",
        "N23"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "完整源类别、同根锁序、11分支及真实金额差异关闭边界。",
          "contract": "doc/examples/step8/compliance-decision-contract.json；doc/领域拆分评估与交易域设计.md §11",
          "test": "公共规范与步骤八契约逐字段对齐，不重复设计新事件表。"
        },
        {
          "dependencyId": "DM-06",
          "consumes": "税务全部案件/提交/官方事件及完成/未知定义。",
          "contract": "doc/sql/domain/schema.sql:392-475",
          "test": "终拒和未核到账不能作为正常已完成。"
        },
        {
          "dependencyId": "DM-08",
          "consumes": "银行事实、三位置/付款执行、账户版及金额守恒约束。",
          "contract": "doc/sql/domain/schema.sql:477-643；doc/步骤五系统用例与接口协议.md",
          "test": "付款未知锁额不能被合规关闭或解除变成可用。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "11分支闭合与多目标解除",
          "setup": "隔离领域测试库；同案H1作用物流及付款两个目标，另H2作用付款；已有关联资金未知。",
          "steps": [
            "记录H1解除申请及独立通过",
            "物流applied、付款仅received",
            "关闭案件后读取有效原因",
            "付款applied后尝试新执行"
          ],
          "assertions": [
            "目标未全applied时H1仍阻断",
            "关案不消H1/H2",
            "H1齐后H2及资金未知仍阻断，不无证解锁",
            "原决定/快照均追加保留"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "步骤八文末仍称必须由主线程把分支合入公共§11，实际公共文档594行已包含11种分支并链接封闭契约。请总Agent清理过时交接说明，避免重复估算或再建第二套结构。",
          "owner": "领域架构负责人",
          "impact": "不阻断沿现公共契约实现；影响文档一致性与验收解释。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 2.5,
        "baselinePersonDays": 5,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "DM-06",
          "DM-08"
        ]
      },
      "review": "总Agent逐项核对原工作与新步骤：落实完整源向量/对象集合、报告与正常结案业务事件。；落实案件11分支、逐原因有效集合及更正失效传播。原独立测试并入对应步骤，正常、失败及恢复判定仍保留，未删除功能或减少控制，不调整预算。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s8-context",
            "s8-report",
            "s8-closure-apply",
            "s8-closure-review",
            "s8-query"
          ],
          "nodeIds": [
            "N22"
          ]
        },
        {
          "useCaseIds": [
            "s8-assignment",
            "s8-hold",
            "s8-remedy",
            "s8-correction",
            "s8-release",
            "s8-case-close"
          ],
          "nodeIds": [
            "N23"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "DM-07-S1",
          "previousAction": "核对源集合、逐项结果、案件及独立暂停结构。",
          "currentIds": [
            "DM-07-S1"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "DM-07-S2",
          "previousAction": "实现报告过期、实质处置和逐原因传播约束。",
          "currentIds": [
            "DM-07-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "DM-07-S3",
          "previousAction": "验证源变化、关案不解冻和解除竞争。",
          "currentIds": [
            "DM-07-S1",
            "DM-07-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        }
      ]
    }
  },
  "DM-08": {
    "rationale": "现有资金SQL是设计验证，不是生产执行器；保留较多事务及并发工作量。",
    "steps": [
      {
        "personDays": 3,
        "action": "落实账户配置、资金单据和分配版本不变量。",
        "logic": "账户指纹跨配置版稳定，变持有人/用途/期限新建配置号，付款冻结不可变配置且执行前重核有效半开区间/启停/核实。银行实收按fingerprint+bankEventKey去重；资金单送审载荷更正新transactionNumber并明确supersedes，不同于原号查单。分配正额、待复核不当可付，released/occupied投影受约束且按全量当前读累计。",
        "expected": "配置改版不制造第二份余额，单据新业务更正与原受理重放可区分。",
        "test": "同真实实收用配置V1/V2重复入账只一事实；未核账户/过期账户不能新执行；两分配并发总和超实收只合法部分成功。"
      },
      {
        "personDays": 2,
        "action": "落实三位置事件及一次独立服务费规则。",
        "logic": "事件1外部→受限、3受限→可用、4可用→锁额、2锁额→外部、5仅明确未扣款失败/取消解锁；内部核验通过不代银行可用。固定人民币300元由D承担，仅在首次获批分账时按trade_number+agency_service_fee幂等追加event12，从D已核验可用余额结算；须有D授权及正式收费依据，不减少A合同应付。INVOICE申报不触发结算；事件8/9/10仅作历史兼容，事件11银行费用须有真实凭证。",
        "expected": "不建第四桶；event12从D已核验可用余额转列服务费，不冲减A合同应付；实收/可用/扣款/供应商到账分别权威。",
        "test": "INVOICE补正两次均无event12；首次获批分账且D授权、收费依据和可用余额证据齐全时仅记一笔300元event12。缺授权、收费依据或可用余额不足时不扣费、不完成本次分账；服务费不减少A合同应付。银行费用无真实凭证不得记现金。"
      },
      {
        "personDays": 2,
        "action": "落实付款原号执行、未知保锁及原子资金写集。",
        "logic": "锁根及资金范围后当前读余额/占用；领域动作、三位置投影、分配、凭证分录、确认消费与执行意图同COMMIT，银行I/O事务外。executionStatus=3未知继续保锁，不能新号/无证解锁；明确扣款事件2不等于供应商到账。差异未知侧NULL，实质核实后仅追加修正事件不改旧流。",
        "expected": "并发不超付/负桶，提交失败不出现半凭证或半锁额；关闭差异不自动解锁。",
        "test": "可用1000并发两付款700只一成功；银行响应丢失锁700不变，原号查询不新增锁/付款。注入分录失败全部回滚，银行扣款后供应商未确认仍待核到账。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "DM-08",
      "status": "细化",
      "summary": "领域包实现资金实体、账户版本、三位置及事务不变量，不重复渠道、应用编排或独立对账。服务费规则已统一：D承担固定300元，首次获批分账时从D已核验可用余额记event12；INVOICE不触发，不减少A合同应付。旧event8/9/10仅历史兼容；真实收费仍须正式收费依据及D授权。",
      "sourceReferences": [
        {
          "path": "proto/trade/funds/v1/funds.proto",
          "lineStart": 251,
          "lineEnd": 261,
          "reason": "历史审计快照；当前规则已统一为D承担、首次获批分账时event12结算，旧event8/9/10仅历史兼容。",
          "sha256": "67a2059e55f0d75dba9d4a298a0f5bb9db274ef43240b13f16c617d7ba84282c"
        },
        {
          "path": "doc/examples/step5/http-contract.json",
          "lineStart": 103,
          "lineEnd": 118,
          "reason": "HTTP契约已与Proto统一为GetAgencyServiceFeeSettlement及AgencyServiceFeeSettlement",
          "sha256": "f611bc7106dcd4dbbff2bae63c629636955752ddf101490c00d4bcbfa45a161f"
        },
        {
          "path": "proto/trade/funds/v1/funds.proto",
          "lineStart": 531,
          "lineEnd": 532,
          "reason": "历史审计快照；当前规则已统一为D承担、首次获批分账时event12结算，旧event8/9/10仅历史兼容。",
          "sha256": "67a2059e55f0d75dba9d4a298a0f5bb9db274ef43240b13f16c617d7ba84282c"
        },
        {
          "path": "doc/examples/step5/http-contract.json",
          "lineStart": 228,
          "lineEnd": 245,
          "reason": "BankReceiptEvidenceInput只创建待核证据资源，不直接假实收",
          "sha256": "f611bc7106dcd4dbbff2bae63c629636955752ddf101490c00d4bcbfa45a161f"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 477,
          "lineEnd": 615,
          "reason": "真实账户配置版、事务单、分配及包含event12的资金事件约束",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 80,
          "lineEnd": 106,
          "reason": "三位置、银行事实独立、分配复核",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 108,
          "lineEnd": 169,
          "reason": "一次300独立服务费、银行可用和付款未知规则",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/examples/step5/fee-evidence-cases.json",
          "lineStart": 1,
          "lineEnd": 34,
          "reason": "历史审计快照；当前规则已统一为D承担、首次获批分账时event12结算，旧event8/9/10仅历史兼容。",
          "sha256": "75aae69b0da0481c2993399165d9cef9b2e1ac0f80bbde2a1768accd16de9c32"
        }
      ],
      "useCaseIds": [
        "s5-n11-receipt",
        "s5-n12-allocation",
        "s5-n13-invoice-fee",
        "s5-n14-verification-release",
        "s5-n15-settlement",
        "s5-n16-payment",
        "s5-n17-reconciliation"
      ],
      "nodeIds": [
        "N11",
        "N12",
        "N13",
        "N14",
        "N15",
        "N16",
        "N17"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "银行权威能力/人工证据、三位置、配置有效区间、服务费及资金事务决策。",
          "contract": "doc/步骤五系统用例与接口协议.md；银行开放能力正式附件待确认。",
          "test": "逐事实列银行来源与不可推定项，缺证不成功。"
        },
        {
          "dependencyId": "DM-01",
          "consumes": "交易根和原因2批准快照、主体/付款关系及内容版。",
          "contract": "doc/sql/domain/schema.sql:7-100",
          "test": "支付冻结批准源版并与当前影响失效结果核对，不用交易状态代银行事实。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "账户改版去重与付款未知锁额",
          "setup": "稳定真实账号指纹、配置V1/V2，同一实收银行事件；领域隔离测试可用1000，两个付款各700。",
          "steps": [
            "跨配置版重放同实收事件",
            "并发申请两笔付款锁额",
            "成功锁额后模拟银行未知，尝试新号和解锁",
            "独立银行查单提供明确未扣款失败后处理"
          ],
          "assertions": [
            "实收只记一次",
            "最多锁700，可用300",
            "未知期间不重付/不解锁",
            "有真实明确未扣款证据才5解锁，所有会计写集原子"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "服务费承担方和时点已由用户确认：D承担固定CNY 300，仅在首次获批分账时从D已核验可用余额结算event12，INVOICE不触发且A合同应付不减少。正式收费前仍须法务/财务确认合同依据、D授权、票据及收入确认。",
          "owner": "资金业务负责人、法务负责人及接口架构负责人",
          "impact": "阻断真实收费启用及相关会计联调；不阻断规则实现、INVOICE申报或不收费测试。"
        },
        {
          "question": "资金领域不变量由DM-08/DM-09实现，FIN包负责应用编排、记账调用和独立对账。请总Agent在资金审计合并时去除重复迁移/状态规则估算，保留各自领域单元与应用联调测试。",
          "owner": "资金架构负责人",
          "impact": "影响包边界与估算归属，不削减授权、并发或资金控制。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 3.5,
        "baselinePersonDays": 7,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "DM-01"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s5-n11-receipt",
            "s5-n12-allocation",
            "s5-n15-settlement"
          ],
          "nodeIds": [
            "N11",
            "N14",
            "N15",
            "N16"
          ]
        },
        {
          "useCaseIds": [
            "s5-n13-invoice-fee",
            "s5-n14-verification-release"
          ],
          "nodeIds": [
            "N12",
            "N13",
            "N14"
          ]
        },
        {
          "useCaseIds": [
            "s5-n16-payment",
            "s5-n17-reconciliation"
          ],
          "nodeIds": [
            "N15",
            "N16",
            "N17"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "DM-08-S1",
          "previousAction": "核对账户稳定指纹、实收、分配、三位置和执行意图。",
          "currentIds": [
            "DM-08-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "DM-08-S2",
          "previousAction": "实现精确金额、锁序、状态及防重复约束。",
          "currentIds": [
            "DM-08-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "DM-08-S3",
          "previousAction": "把资金守卫转为并发及故障领域测试。",
          "currentIds": [
            "DM-08-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "DM-09": {
    "rationale": "账务模型及约束已有，计生产平衡引擎和新增冲正，不重做对账作业。",
    "steps": [
      {
        "personDays": 3,
        "action": "落实平衡凭证、账户范围及纯追加分录原子提交。",
        "logic": "来源业务号+记账阶段唯一键、同键摘要匹配；CNY DECIMAL20,2，借贷方向和正额分开，凭证总额=借方单边=贷方。账户type+scope唯一不按配置版重复开户；scope/科目/来源/会计日Asia/Shanghai及期间受控。资金域领域操作同事务调用，分录/余额/资金事件共同提交，不在流水回填单值凭证号。",
        "expected": "无部分分录、余额与已过账分录一致；不是所有会计科目统一非负，货款控制位置不可透支。",
        "test": "借100贷99拒绝；借贷都100但科目或scope错仍拒绝。分录第二行注入失败，资金事件/余额/凭证/分录全部回滚；同键重放无重复记账。将1000货款分400和600两次真实付款，各阶段凭证平衡且仅扣对应锁额，不重复记整笔1000。"
      },
      {
        "personDays": 3,
        "action": "落实整张反向凭证、失败同键恢复及分录重算验证。",
        "logic": "冲正追加新凭证与逐行原分录引用，原凭证最多一成功反向凭证，原分录不修改；外部收支须真实反向银行事实，不以内部冲正抹银行扣款。失败占位同键同文受控恢复；原凭证状态3与反向分录/余额同COMMIT。独立FIN重算消费不可变分录，本包只提供领域读取与不变量测试。",
        "expected": "完整反向链、原数据保留，重复冲正不重复返款；unknown不冲正现金。",
        "test": "两个并发冲正同原凭证只一反向成功；UPDATE/DELETE旧分录触发拒绝。缺银行反向事实对原扣款冲正拒绝；失败后原键重试仅一次最终记账，重算等于余额。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "DM-09",
      "status": "细化",
      "summary": "领域包实现凭证、分录、余额原子与整张追加冲正，不重建FIN独立重算工具。借贷平衡还需科目/范围/来源正确；发现公共与资金文档账户锁序排序键不同，留总Agent统一。",
      "sourceReferences": [
        {
          "path": "doc/examples/step5/http-contract.json",
          "lineStart": 578,
          "lineEnd": 595,
          "reason": "差异独立复核强类型资源不允许直接改余额或旧分录",
          "sha256": "f611bc7106dcd4dbbff2bae63c629636955752ddf101490c00d4bcbfa45a161f"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 645,
          "lineEnd": 714,
          "reason": "账户范围唯一、凭证幂等/反向唯一、不可变分录与余额",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 1156,
          "lineEnd": 1162,
          "reason": "资金流水及账务分录禁止更新删除",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 179,
          "lineEnd": 184,
          "reason": "资金事务按account_number排序及写集原子",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/步骤八系统用例与接口协议.md",
          "lineStart": 44,
          "lineEnd": 49,
          "reason": "公共跨域锁序写account id升序，需与资金统一",
          "sha256": "e2918d2051a08419256735255787e066a167ecd22e70a9bc29a278378a9c632e"
        }
      ],
      "useCaseIds": [
        "s5-n11-receipt",
        "s5-n12-allocation",
        "s5-n13-invoice-fee",
        "s5-n14-verification-release",
        "s5-n15-settlement",
        "s5-n16-payment",
        "s5-n17-reconciliation"
      ],
      "nodeIds": [
        "N11",
        "N12",
        "N13",
        "N14",
        "N15",
        "N16",
        "N17"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "会计科目/正常方向、范围、会计日及全链统一账户锁序决策。",
          "contract": "doc/金融账务系统数据库规范手册.md；doc/步骤五系统用例与接口协议.md；排序键冲突待冻结。",
          "test": "使用业务号与id逆序的两个账户验证统一锁序，不能各模块自行选择。"
        },
        {
          "dependencyId": "DM-08",
          "consumes": "资金事件类型/范围、金额、三位置和不可变业务来源。",
          "contract": "doc/sql/domain/schema.sql:477-615",
          "test": "记账阶段和资金事件一一对应，服务费不能进货款桶。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "锁序一致性及冲正并发",
          "setup": "两个账户业务号顺序与内部id顺序相反，已过账原凭证及合法反向依据；两个数据库连接。",
          "steps": [
            "付款与跨域核对同时锁两个账户",
            "按冻结统一排序执行，不允许另一模块反序",
            "并发两次整张冲正，并对一次分录插入注入失败",
            "按不可变分录重算余额"
          ],
          "assertions": [
            "统一排序无模块反序锁，死锁时整笔回滚原键恢复",
            "原凭证最多一成功反向凭证",
            "原分录不改，余额/凭证/资金写集一致"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "步骤五锁序按account_number排序，步骤八公共序按account id排序；两个键可能逆序。请总Agent由数据库/资金架构统一一套排序键并要求所有调用方遵循，不能用重试掩盖系统性反序。",
          "owner": "数据库负责人及资金架构负责人",
          "impact": "阻断跨域资金并发锁序验收，不阻断单据/分录纯追加及平衡校验。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 3,
        "baselinePersonDays": 6,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "DM-08"
        ]
      },
      "review": "总Agent逐项核对原工作与新步骤：落实平衡凭证、账户范围及纯追加分录原子提交。；落实整张反向凭证、失败同键恢复及分录重算验证。原独立测试并入对应步骤，正常、失败及恢复判定仍保留，未删除功能或减少控制，不调整预算。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s5-n11-receipt",
            "s5-n12-allocation",
            "s5-n13-invoice-fee",
            "s5-n14-verification-release",
            "s5-n15-settlement",
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N11",
            "N12",
            "N13",
            "N14",
            "N15",
            "N16",
            "N17"
          ]
        },
        {
          "useCaseIds": [
            "s5-n17-reconciliation"
          ],
          "nodeIds": [
            "N17"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "DM-09-S1",
          "previousAction": "核对科目、凭证与货款和服务费事件映射。",
          "currentIds": [
            "DM-09-S1"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "DM-09-S2",
          "previousAction": "实现同事务平衡记账及追加冲正。",
          "currentIds": [
            "DM-09-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "DM-09-S3",
          "previousAction": "验证失败回滚、部分付款和重复事件。",
          "currentIds": [
            "DM-09-S1",
            "DM-09-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        }
      ]
    }
  },
  "DM-10": {
    "rationale": "第二期保留原8人日，新增通道映射不覆盖人工历史。",
    "steps": [
      {
        "personDays": 4,
        "action": "落实签署稳定映射和法律证据归属。",
        "logic": "以本地合同号/版、审核正文摘要、clientReference和providerTask绑定，provider/eventId去重；同键异文隔离，人工/自动绑定同一原法律任务。映射规则版和原核实方式随首次处理冻结，新映射仅按批准生效范围用于新事实，不重解释一期人工证据。回调received不当已签，归档验证结果满足才4→5；旧版迟到真实签署证据保留/告警，不推进新版，未知未核清禁止作废重签。",
        "expected": "不新增第二套合同生命周期，版本更正不丢法律证据，通用任务只存恢复信息。",
        "test": "同回调两次只一来源映射，异文409；V1已签迟到而当前V2草稿，V1证据保留、V2不变；升级映射后重放旧事实仍按原规则及人工核实方式还原；人工接管未知任务不得新建另一法律签署。"
      },
      {
        "personDays": 4,
        "action": "落实物流跨渠道源键及独核事实归一化。",
        "logic": "归一化可信来源主体/批次/区段/kind/sourceReference，保源文件和occurredAt；人工登记与承运通知映射同一实际事件，不能仅靠客户端源键自证身份。重复同文回原提交、异文拒绝；乱序/旧计划证据隔离，独立核实仍由原领域规则推进。通知投递不进入核心事实。",
        "expected": "一个真实事件只一核实事实，自动渠道不绕同批放行/签收授权，多异常仍独立。",
        "test": "同订舱由人工先登记、平台后通知不重复推进；末段到达先到不直接签收。来源主体不符、旧planRevision和无放行出境均拒绝或待核。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "DM-10",
      "status": "细化",
      "summary": "二期领域增量只实现人工/平台共同映射、稳定来源去重和旧版证据隔离；传输验签、文件恢复、平台任务调度不重复建设。签署真实结果不能因版本旧而丢弃。",
      "sourceReferences": [
        {
          "path": "doc/步骤二系统用例与接口协议.md",
          "lineStart": 39,
          "lineEnd": 50,
          "reason": "稳定clientReference、回调唯一键、旧版签署法律证据及归档",
          "sha256": "309fb3369cd0cde8dcda7f2b1878fd1cb1518505439e5d38b418ce419fd98102"
        },
        {
          "path": "doc/步骤三系统用例与接口协议.md",
          "lineStart": 49,
          "lineEnd": 57,
          "reason": "来源主体/批次/类型/源键去重及独立决定",
          "sha256": "bed3e39150278fba4db2d78386f6de645a89f8c0dd863ef28e37254b5400d339"
        },
        {
          "path": "proto/trade/contracts/v1/contracts.proto",
          "lineStart": 230,
          "lineEnd": 255,
          "reason": "归一化ProviderNotification和任务绑定，不是厂商API",
          "sha256": "c39991b428a7c66710b5758ef9de067e03ff8206c63f6a2c17b3699b396939ce"
        },
        {
          "path": "doc/examples/step3/http-contract.json",
          "lineStart": 75,
          "lineEnd": 92,
          "reason": "归一化物流来源先建立证据提交资源，再走原独立核实",
          "sha256": "efa5e3523ca34c6d3f431f14f4de78d5c06c65218be72fb231aa318cc7f09aec"
        }
      ],
      "useCaseIds": [
        "contract-revise",
        "contract-sign",
        "contract-activate",
        "booking-pickup",
        "transport-progress",
        "logistics-exception",
        "logistics-query"
      ],
      "nodeIds": [
        "N02",
        "N03",
        "N04",
        "N06",
        "N10"
      ],
      "inputs": [
        {
          "dependencyId": "DES-2",
          "consumes": "厂商事件唯一性/查单能力、人工接管映射和合法归一化字段。",
          "contract": "doc/步骤二系统用例与接口协议.md:31-50；选定供应商正式契约待冻结。",
          "test": "无稳定唯一事件键/原号查单能力不得假定可自动重试。"
        },
        {
          "dependencyId": "DM-03",
          "consumes": "合同确切版、独审、签署及生效/替代不变量。",
          "contract": "doc/sql/domain/schema.sql:102-145",
          "test": "映射结果不能绕过签署归档或生效条件。"
        },
        {
          "dependencyId": "DM-04",
          "consumes": "冻结计划、区段及核实事件/异常恢复规则。",
          "contract": "doc/sql/domain/schema.sql:174-268",
          "test": "外部通知只能绑定正确planRevision和区段。"
        },
        {
          "dependencyId": "BL-17",
          "consumes": "一期人工办理、原号/源键和历史数据验收基线。",
          "contract": "一期联合验收与人工交接记录待BL-17交付。",
          "test": "抽样迁移原人工任务后重放通知，不重复事实。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "旧签署迟到和人工物流重复",
          "setup": "一期人工数据已验收，签署V1原任务未知且已建V2草稿；一份人工订舱记录与后续平台通知指向同一实际事件。",
          "steps": [
            "接收V1真实签署完成并核归档",
            "保持V2不变并转法律处置",
            "接收平台同一订舱事件两次再送同键异文",
            "检查来源映射及领域事件"
          ],
          "assertions": [
            "旧版真实法律证据不丢，新版不假签",
            "人工/自动不重复订舱事实",
            "异文隔离告警，通知结果不直接生效/签收"
          ]
        }
      ],
      "openQuestions": [],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 4,
        "baselinePersonDays": 8,
        "subtaskCount": 3,
        "dependencies": [
          "DES-2",
          "DM-03",
          "DM-04",
          "BL-17"
        ]
      },
      "review": "对照步骤二第39至50行与步骤三第49至57行，核对来源命名空间、同键同文去重、异文隔离、旧版证据归属和映射升级不重解释旧事实。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "contract-revise",
            "contract-sign",
            "contract-activate"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04"
          ]
        },
        {
          "useCaseIds": [
            "booking-pickup",
            "transport-progress",
            "logistics-exception",
            "logistics-query"
          ],
          "nodeIds": [
            "N06",
            "N10"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "DM-10-S1",
          "previousAction": "定义来源命名空间、原任务和原事件关联。",
          "currentIds": [
            "DM-10-S1"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "DM-10-S2",
          "previousAction": "实现人工自动共用的防重复和切换约束。",
          "currentIds": [
            "DM-10-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "DM-10-S3",
          "previousAction": "验证历史兼容及映射改版。",
          "currentIds": [
            "DM-10-S1",
            "DM-10-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        }
      ]
    }
  },
  "DM-11": {
    "rationale": "第三期保留原10人日，正式规则和许可与历史版本分离。",
    "steps": [
      {
        "personDays": 5,
        "action": "落实官方来源、原办理/版及跨人工自动去重规则。",
        "logic": "各主管源的命名空间、稳定键、官方号、occurredAt与原dispatch/filingRequest、确切材料版/hash绑定；签名/授权由适配器核后提供受控引用，领域再查范围/阶段前序。重复同文不新事实，异文隔离；旧版回执不误绑新提交，未知原号保留，不因切自动新报。",
        "expected": "技术受理、正式提交/受理/放行/决定不混同，官方更正撤销不覆盖旧证据。",
        "test": "相同官方事件由人工及自动重复登记仅一正式事实；同键跨案/跨版错绑拒绝；技术验签失败不能记机关拒绝，撤回未知不释放量。"
      },
      {
        "personDays": 5,
        "action": "落实数据源许可、时效与规则改版影响判定。",
        "logic": "来源/企业授权/字段范围/查询时间、名单/规则版及生效区间固定到使用时快照；查询结果仅建议或有权企业数据，不等于正式归类/申报/放行。规则升级保历史解释，对受影响未执行批准发失效及重审，不撤写已执行事实；失效传播未齐阻断新执行。许可撤销停止新查询，历史读取仍核当前权限。",
        "expected": "旧事实可按原规则还原，无跨企业数据泄露，无授权不默认成功；筛查命中仍待人工复核。",
        "test": "规则R2生效后重放R1事件不重解释；证书/许可撤销后查询拒绝。返回过期商品编码不得自动填正式草稿结论，名单源故障保持待核而非通过。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "DM-11",
      "status": "细化",
      "summary": "三期领域增量保存正式来源命名空间、授权范围/规则版和原版绑定；来源规则改版不重解释旧事实。查询/筛查映射待真实供应商契约冻结，不能把本地枚举当已接主管接口。",
      "sourceReferences": [
        {
          "path": "doc/examples/step7/http-contract.json",
          "lineStart": 171,
          "lineEnd": 188,
          "reason": "归一化正式通知含确切申请版，不等于机关原生API",
          "sha256": "b3672e800c4caaef135f054a91ac238f53cd851a459ac066c8c6226f7c8e033d"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 368,
          "lineEnd": 390,
          "reason": "关务正式事件、确切修订和稳定外部键",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 449,
          "lineEnd": 475,
          "reason": "税务正式事件确切版/官方号/外部键硬约束",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/步骤七系统用例与接口协议.md",
          "lineStart": 9,
          "lineEnd": 17,
          "reason": "规则及职责快照冻结、事件类型、申请/批准/到账分离",
          "sha256": "8b9b0d38e55742d3a1f3de0654513e94ace510722685acdfbc2ea6bea6fc41ab"
        }
      ],
      "useCaseIds": [
        "s4-basis",
        "s4-filing",
        "s4-official",
        "s4-correction",
        "s4-query",
        "s6-preparation",
        "s6-dispatch",
        "s6-official-receipt",
        "s6-correction",
        "s6-certificate",
        "s6-query",
        "s7-dispatch",
        "s7-notice",
        "s7-correction",
        "s7-decision",
        "s7-recovery"
      ],
      "nodeIds": [
        "N07",
        "N09",
        "N18",
        "N19",
        "N20",
        "N21"
      ],
      "inputs": [
        {
          "dependencyId": "DES-3",
          "consumes": "主管源命名空间、字段/状态/规则、企业授权及查询/筛查许可决策。",
          "contract": "proto/trade/customs/v1/customs.proto；proto/trade/taxproof/v1/taxproof.proto；proto/trade/taxrefund/v1/taxrefund.proto；外部映射/查询契约待冻结。",
          "test": "逐字段确认真实厂商/机关文档，不从归一化Proto杜撰对方API。"
        },
        {
          "dependencyId": "DM-10",
          "consumes": "稳定外部来源/原任务绑定、人工自动去重和旧版隔离实现。",
          "contract": "doc/步骤二系统用例与接口协议.md:39-50；既有来源映射结构待交接。",
          "test": "复用原能力增加官方类型，不复制第二套通用接收/去重设施。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "规则升级与官方回执跨版",
          "setup": "海关/税务正式测试渠道许可R1，旧办理V1未决，新规则R2仅影响新办理；企业甲乙不同授权。",
          "steps": [
            "接收V1迟到正式回执并按R1核归属",
            "启用R2后标识受影响未执行批准失效",
            "甲凭据查询乙企业数据及过期查询缓存",
            "从人工切自动按原办理号查单"
          ],
          "assertions": [
            "V1不绑新版、不重解释已执行事实",
            "受影响批准重审及传播齐前不执行",
            "跨企业拒绝、陈旧缓存不充正式事实",
            "原号稳定不重复申请"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "查询数据源/名单许可、字段时效及规则改版映射尚未正式冻结，现有Proto是本应用归一化协议，不是海关税务或名单厂商API。请总Agent将实际源文档作为DES-3/INT包交接物。",
          "owner": "第三期接口架构负责人及法务合规负责人",
          "impact": "阻断真实来源映射和授权查询/筛查成功验收，不阻断既有类型事件的缺证门禁。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 5,
        "baselinePersonDays": 10,
        "subtaskCount": 3,
        "dependencies": [
          "DES-3",
          "DM-10"
        ]
      },
      "review": "核对正式来源原办理与确切版绑定、许可和规则版留痕、旧版回执不误推进新版；查询与筛查仅提供受权输入，不虚构正式监管结论。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s4-filing",
            "s4-official",
            "s4-correction",
            "s4-query",
            "s6-dispatch",
            "s6-official-receipt",
            "s6-correction",
            "s6-certificate",
            "s6-query",
            "s7-dispatch",
            "s7-notice",
            "s7-correction",
            "s7-decision",
            "s7-recovery"
          ],
          "nodeIds": [
            "N09",
            "N19",
            "N20",
            "N21"
          ]
        },
        {
          "useCaseIds": [
            "s4-basis",
            "s6-preparation",
            "s7-notice",
            "s7-decision"
          ],
          "nodeIds": [
            "N07",
            "N18",
            "N21"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "DM-11-S1",
          "previousAction": "定义官方事件键、主管规则及许可范围。",
          "currentIds": [
            "DM-11-S1"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "DM-11-S2",
          "previousAction": "实现规则版本、过期和历史兼容。",
          "currentIds": [
            "DM-11-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        },
        {
          "previousId": "DM-11-S3",
          "previousAction": "验证撤销、范围变化及缺失来源。",
          "currentIds": [
            "DM-11-S1",
            "DM-11-S2"
          ],
          "reason": "将独立测试步骤纳入对应实现步骤，原检查不删除、不另计一次实现。"
        }
      ]
    }
  },
  "INT-01": {
    "rationale": "只估首家银行的接入认证和消息验签；密钥设施由安全包负责。",
    "steps": [
      {
        "personDays": 2,
        "action": "冻结首家银行能力清单：逐项列出实收通知、余额、对账文件、贸易核验、可用状态、付款提交、原号查单、扣款回单的开放状态、测试授权、报文版本和状态字典，并标出对应funds.proto字段（BankReceiptEvidenceInput、bank_available_evidence、ExecutionStatus 1-6）",
        "logic": "输入为银行书面接口说明和测试授权函。每项必须有银行出具的来源版本号；没有书面依据的项登记为“未开放/人工”，不按经验假设支持。银行状态码要逐个映射到ExecutionStatus：只有银行明确表示未受理或未扣款才能映射为6 explicit_failure，超时、处理中和未知统一映射为3 unknown。CNH映射为CNY+位置2需财务确认后才可启用",
        "expected": "得到一份版本化能力清单和状态映射表，每项都能追溯到银行文件页码；未开放项明确交给受控网银人工办理和独立核实；清单本身不产生任何资金事实",
        "test": "准备银行说明的两个版本，第二版删去付款查单能力。导入后核对：清单版本号递增；付款查单变为“人工”；映射表里“处理中”“超时”都落到3，不落到6；缺少测试授权的能力在上线检查中标为阻断"
      },
      {
        "personDays": 3,
        "action": "实现银行传输认证、证书与密钥加载、原报文签名验签和错误映射，统一封装连接超时、单次超时和事务外调用",
        "logic": "消费SEC-05的密钥标识与证书链版本。先保存原始报文字节和摘要，再验签；验签失败、证书过期、时间窗外和重放都归为技术拒绝并告警，不转换成银行业务失败，也不写资金事件。应用HTTP/RPC预算沿步骤五第41-42行现有契约，只约束本系统接口，不直接当作银行超时。银行连接、单次调用和原号查单的超时取DES-1按银行书面协议冻结的值，作为配置加载并记录来源版本；某项能力没有冻结值时适配层不启用该能力。银行调用在COMMIT之后发起，期间不持交易根锁或其他业务锁。重试只沿原请求号进行，计入步骤一第88行外部调用预算，关闭SDK自带重试，避免叠加",
        "expected": "适配层对外只输出“已验签的原始观察”或“技术拒绝”两类结果，带银行原报文摘要、证书序号和验签算法；没有任何代码路径在验签失败时修改受限、可用或付款锁额",
        "test": "分别用正确签名、篡改1字节、过期证书、重放旧nonce四种报文调用。断言：只有第一种产出原始观察；其余三种返回技术拒绝、保存原报文摘要、告警计数加1；四种情况下account_tab与fund_flow行数都不变。另删去付款查单的银行单次调用预算配置后启动：该能力标为不可用，适配层不回退使用应用的10000/8000毫秒"
      },
      {
        "personDays": 2,
        "action": "在银行正式测试渠道验证证书轮换、超时、断线和原号查询，并记录银行共同签字的结果",
        "logic": "使用测试授权和非生产账号。轮换时新旧证书在银行允许的重叠期内都能验签，过期后旧证书拒绝。人为让银行响应超过DES-1冻结的单次调用预算，适配层返回未知并保留原请求号；随后只用原请求号、在冻结的查单预算内查询。SDK自带重试保持关闭。测试数据一律标记合成，不进入生产账务",
        "expected": "得到一份测试记录，含证书序号、轮换时间、所用银行预算的来源版本、超时样本和原号查询结果；超时样本最终以原号查询结果定性，期间不新建请求号",
        "test": "在测试渠道执行：1）新证书上线，旧证书仍在重叠期；2）重叠期结束后用旧证书签名请求；3）提交一笔付款查询，让响应延迟超过已冻结的银行单次调用预算。判定：第2步被拒绝；第3步记录为unknown，抓包中原请求只发出一次，之后原号查询返回同一请求号的结果，日志中不存在第二个请求号；等待银行期间数据库中没有该交易根的行锁"
      }
    ],
    "risk": {
      "trigger": "银行认证或报文协议与首轮材料不一致",
      "extraDays": 3
    },
    "audit": {
      "id": "INT-01",
      "status": "细化",
      "summary": "原稿只列能力清单、认证和验签三件事，缺少银行侧字段与内部契约的对照，也没写未开放能力怎么交给人工。修订后：S1冻结一份逐能力清单，每项标明开放/未开放/人工、测试授权、字段字典版本和对应的funds.proto输入；S2按步骤一机构签名规则（RSA-PSS/ECDSA/SM2）实现传输认证、原报文验签和错误映射，验签失败只记技术拒绝，不写业务失败；S3在银行正式测试环境验证证书轮换、超时和COMMIT后原号查询。超时分两层处理：应用HTTP/RPC预算沿步骤五第41-42行现有契约；银行连接、单次调用和原号查单预算按银行书面协议由DES-1冻结，不默认与应用预算相等，不叠加SDK重试，也不在持有业务锁时外调。银行预算目前没有书面值，列为待确认。CNH要映射为CNY+fund_location_code=2，同样待确认。本包不直接实现用例，作为银行协议通道共用支撑s5-n11-receipt（核实银行来款）、s5-n14-verification-release（银行可用证据）和s5-n16-payment（付款提交与原号查单）。",
      "sourceReferences": [
        {
          "path": "doc/步骤一身份签名与可靠性设计.md",
          "lineStart": 28,
          "lineEnd": 28,
          "reason": "机构系统签名算法RSA-PSS/ECDSA/SM2及验签要求",
          "sha256": "c33cbc94bc4f3e1e1168d85b66554cd1c276e358fc8870d6139a0d4a1be8b84c"
        },
        {
          "path": "doc/步骤一身份签名与可靠性设计.md",
          "lineStart": 53,
          "lineEnd": 55,
          "reason": "回执证明与COMMIT结果未知的处理",
          "sha256": "c33cbc94bc4f3e1e1168d85b66554cd1c276e358fc8870d6139a0d4a1be8b84c"
        },
        {
          "path": "doc/步骤一身份签名与可靠性设计.md",
          "lineStart": 88,
          "lineEnd": 88,
          "reason": "外部调用重试预算8次/24小时与人工接管",
          "sha256": "c33cbc94bc4f3e1e1168d85b66554cd1c276e358fc8870d6139a0d4a1be8b84c"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 41,
          "lineEnd": 42,
          "reason": "应用HTTP/RPC预算：读5000/4000毫秒、写10000/8000毫秒；只约束应用接口，不是银行超时",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 28,
          "lineEnd": 37,
          "reason": "写请求幂等键、If-Match、CNY固定币种",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 179,
          "lineEnd": 182,
          "reason": "S3/ClamAV/银行查询扣款在事务外；执行未知保持锁额并原号查单，禁止盲重发",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 477,
          "lineEnd": 503,
          "reason": "payment_bank_account_tab稳定指纹、币种CNY及境内外位置",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "交付成果/assets/step-five-usecases-model.js",
          "lineStart": 371,
          "lineEnd": 371,
          "reason": "外部银行未接入时只验证缺证据阻断，不构造银行成功",
          "sha256": "e84dced883248e2c4ccb67b263e5ded195856f82f104f740bc0a7b256e2161b5"
        }
      ],
      "useCaseIds": [
        "s5-n11-receipt",
        "s5-n14-verification-release",
        "s5-n16-payment"
      ],
      "nodeIds": [
        "N11",
        "N13",
        "N16",
        "N17"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "第1期银行边界设计、能力清单模板、观察数据的去向",
          "contract": "待DES-1冻结（含银行连接、单次调用、原号查单预算及其书面来源版本）；参照doc/步骤五系统用例与接口协议.md 179-182行事务外I/O约束",
          "test": "核对模板里每项能力都有开放状态、授权和对应proto字段三栏"
        },
        {
          "dependencyId": "DM-08",
          "consumes": "资金状态机、ExecutionStatus 1-6、事件码1-11与去重约束",
          "contract": "proto/trade/funds/v1/funds.proto 170-185行；doc/sql/domain/schema.sql 572-612行",
          "test": "用映射表逐个比对银行状态到ExecutionStatus，确认没有映射到不存在的码"
        },
        {
          "dependencyId": "SEC-05",
          "consumes": "银行密钥标识、证书链、轮换窗口和私钥保管方式",
          "contract": "SEC-05交付的密钥与证书轮换说明（待交付）",
          "test": "在测试环境装载新旧证书，确认适配层能按证书序号选择验签公钥"
        }
      ],
      "integrationScenarios": [
        {
          "name": "银行测试渠道首次连通与验签",
          "setup": "银行测试环境、测试授权、合成账号BANK-S5-SYNTHETIC；资金库为空",
          "steps": [
            "装载SEC-05证书并发送一条余额查询",
            "把返回报文改动1字节后重放给验签组件",
            "让响应超过已冻结的银行单次调用预算，再用原请求号查询"
          ],
          "assertions": [
            "正确报文得到已验签原始观察",
            "篡改报文被技术拒绝且不写任何资金表",
            "超时只产生unknown记录，原号查询前后请求号一致"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "首家银行实际开放哪些能力（实收通知、余额、对账文件、贸易核验、可用状态、付款提交、原号查单、扣款回单）、测试环境授权、证书和签名算法目前都未确认",
          "owner": "首家银行项目对接负责人",
          "impact": "阻断对应能力的自动适配和银行共同验收；未开放项一律走受控网银人工办理加独立核实，不阻断人工通道开发"
        },
        {
          "question": "流程N11/N13写CNH，DDL只允许currency_code=CNY，并以fund_location_code 1境内/2境外区分。银行报文中的CNH要按账户配置映射为CNY+位置2，这一规则需要确认是否被财务和银行接受",
          "owner": "财务负责人",
          "impact": "阻断境外人民币账户的报文映射和对账口径；境内CNY账户不受影响"
        },
        {
          "question": "银行使用的签名算法和证书格式是否在步骤一登记策略范围内（RSA-PSS/ECDSA P-256/SM2）",
          "owner": "安全架构负责人",
          "impact": "阻断验签实现定稿；若银行使用范围外算法，触发原估算风险项额外1.5人日"
        },
        {
          "question": "首家银行的连接、单次调用和原号查单超时预算，以及银行侧限流和是否自带重试，目前没有书面值。应用HTTP的读5000/4000毫秒、写10000/8000毫秒不能代替这些值",
          "owner": "第1期方案设计负责人（依据首家银行项目对接负责人提供的书面协议冻结）",
          "impact": "阻断银行适配层超时配置、S3超时用例和银行共同验收；人工通道不受影响"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "funds",
      "before": {
        "personDays": 3.5,
        "baselinePersonDays": 7,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "DM-08",
          "SEC-05"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s5-n11-receipt",
            "s5-n14-verification-release",
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N11",
            "N13",
            "N16"
          ]
        },
        {
          "useCaseIds": [
            "s5-n11-receipt",
            "s5-n14-verification-release",
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N11",
            "N13",
            "N16"
          ]
        },
        {
          "useCaseIds": [
            "s5-n11-receipt",
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N11",
            "N16"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "INT-01-S1",
          "previousAction": "获取并冻结已开放接口、测试授权及状态字典。",
          "currentIds": [
            "INT-01-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "INT-01-S2",
          "previousAction": "实现银行认证、传输、签名验签和错误映射。",
          "currentIds": [
            "INT-01-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "INT-01-S3",
          "previousAction": "以正式测试渠道验证证书、验签和超时。",
          "currentIds": [
            "INT-01-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "INT-02": {
    "rationale": "银行接收与原始文件解析独立于资金记账，字段与样例确定后可并行。",
    "steps": [
      {
        "personDays": 3,
        "action": "接收已开放的实收通知、余额和账单报文，保存为已验签原始观察，不直接改资金余额",
        "logic": "输入来自INT-01的已验签报文。按（账户稳定指纹，银行事件键）去重；同键同摘要直接返回原观察号，同键不同摘要隔离并告警。余额报文只存为“某时刻银行账面余额观察”，带银行时间戳和报文版本，不换算成本交易可用额。CNH报文按已确认的账户配置映射为CNY+位置2，映射不到的账户拒绝并告警",
        "expected": "每条观察有观察号、原报文摘要、银行时间戳、账户指纹和来源版本；资金域的受限、可用、付款锁额和account_tab余额都不因观察而变化；入账要等FIN-01核实后消费",
        "test": "推送一条实收通知后立即查询：观察表多1行，fund_flow和account_tab行数不变。再推送同键同文报文，观察号相同、行数不变。再推送同键但金额不同的报文，返回冲突、进入隔离并产生告警，原观察不被覆盖"
      },
      {
        "personDays": 4,
        "action": "实现银行原始对账文件的受控导入：文件级登记、逐行解析、同键同文去重、同键异文隔离和来源保留",
        "logic": "导入人只能上传银行原件，先在事务外做sha256、ClamAV扫描和逻辑文件号/版本登记；解析失败的行整体隔离，不做部分入账。同一文件重复导入按sha256幂等；文件修订版本中同键异文的行隔离，不覆盖旧版。导入结果只是待核观察，需独立人员核实后才可交FIN-01消费，导入人不能核实自己的导入",
        "expected": "每条观察能定位到逻辑文件号、版本号、行号和sha256；未核实的导入不产生实收；同一人导入并核实时被拒绝",
        "test": "导入同一账单两次：第二次返回原导入批号，观察行数不变。修改其中一行金额后作为修订版导入：该行进入隔离，其他行按键去重。用导入人账号去核实：返回职责冲突；换另一人核实后，观察状态变为已核实"
      },
      {
        "personDays": 2,
        "action": "补齐异常输入测试：缺列、部分账单、跨账户同号流水、非CNY或未配置CNH账户",
        "logic": "缺必填列整份拒绝；部分账单（页码不连续或合计不符）标记不完整，不进入对账基线；两个账户出现相同银行流水号时，以账户指纹+事件键区分，不能合并；币种非CNY且账户未配置境外位置时拒绝",
        "expected": "每类异常都有明确错误码和隔离记录；账户之间互不影响；不完整账单不会被FIN-08当作对账基线",
        "test": "准备四份文件：缺金额列、第2页缺失、甲、乙两个银行账户同号流水、USD币种。判定：前两份分别得到缺列和不完整错误；第三份生成两条独立观察；第四份被拒绝；全过程fund_flow行数为0"
      }
    ],
    "risk": {
      "trigger": "银行账单存在新增格式或非统一事件键",
      "extraDays": 4
    },
    "audit": {
      "id": "INT-02",
      "status": "细化",
      "summary": "原稿把实收通知、余额和对账文件写在一起，没有说明原始观察放在哪里、由谁消费。核对funds.proto后确认：资金域只有人工入口CreateBankReceiptEvidence（manualEvidenceIntake、eventType 1/10/11），没有自动观察接口，领域表里也没有流水或余额文件表。修订后：S1只做“已验签原始观察”的接收和保存，按稳定账号指纹+银行事件键去重，余额只记为银行观察；S2做受控文件导入，同键同文幂等，同键异文隔离告警，每条保留文件号、版本和sha256；S3补齐缺列、部分账单、跨账户同号和CNH映射测试。自动观察的存储位置列为待DES-1冻结，人工通道继续以CreateBankReceiptEvidence加独立核实为准。",
      "sourceReferences": [
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 103,
          "lineEnd": 107,
          "reason": "按account_fingerprint+bank_event_key跨配置版本去重；人工证据不得冒称银行回调",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "proto/trade/funds/v1/funds.proto",
          "lineStart": 300,
          "lineEnd": 315,
          "reason": "BankReceiptEvidenceInput字段：accountFingerprint、bankEventKey、sourceEvidence、manualEvidenceIntake",
          "sha256": "67a2059e55f0d75dba9d4a298a0f5bb9db274ef43240b13f16c617d7ba84282c"
        },
        {
          "path": "doc/examples/step5/http-reference.md",
          "lineStart": 765,
          "lineEnd": 860,
          "reason": "CreateBankReceiptEvidence示例：缺真实证据返回422 BANK_EVIDENCE_REQUIRED，资金桶不变",
          "sha256": "593d03ad562dc08e266b3c7c37eb5e3df943b62d6d7c3b70e5ae4a0fd1f3dc08"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 477,
          "lineEnd": 503,
          "reason": "银行账户稳定指纹、币种CNY与fund_location_code",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/sql/step5/assertions.sql",
          "lineStart": 49,
          "lineEnd": 53,
          "reason": "同一银行事件只对应一个稳定银行身份",
          "sha256": "385a55fc3f3ca46861b1d46498251794d5a541a49a2f00b563fb3fcacc779c91"
        },
        {
          "path": "交付成果/assets/business-data.js",
          "lineStart": 131,
          "lineEnd": 134,
          "reason": "N11 CIPS水单、未匹配差额和CNH不可用余额",
          "sha256": "f4a37559a4f207c4918d9aad7bf57593a63d47e44c6c9cec34ef01ff9c77e33b"
        }
      ],
      "useCaseIds": [
        "s5-n11-receipt"
      ],
      "nodeIds": [
        "N11"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "原始观察的存储位置、去重键、隔离和告警规则",
          "contract": "待DES-1冻结（当前47张领域表中无对应表）",
          "test": "确认冻结稿给出表名、唯一键（账户指纹+银行事件键）和隔离状态"
        },
        {
          "dependencyId": "INT-01",
          "consumes": "已验签的原始报文、能力清单中实收/余额/对账文件三项的开放状态",
          "contract": "INT-01能力清单与状态映射表",
          "test": "用INT-01的测试渠道推送一条实收通知，确认本包收到的是验签后的报文和证书序号"
        }
      ],
      "integrationScenarios": [
        {
          "name": "人工导入与自动通知并存",
          "setup": "同一银行账户：上午网银导出对账文件人工导入，下午银行开放实收通知；资金库已有该账户配置",
          "steps": [
            "导入上午文件并由另一人核实",
            "同一笔实收再通过实收通知推送",
            "比较两次观察"
          ],
          "assertions": [
            "两条来源合并为同一（账户指纹，银行事件键）观察，不生成第二条",
            "FIN-01只消费一次，受限余额只增加一次",
            "两次来源的原报文都可追溯"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "funds.proto只有人工CreateBankReceiptEvidence(manual_evidence_intake)和FundsReleaseInput.bank_available_evidence，47张领域表中没有银行流水、余额文件或原始观察收件表。INT-02/03的自动观察要落到哪张基础设施表、采用什么去重键、由谁消费，需要DES-1冻结",
          "owner": "第1期方案设计负责人",
          "impact": "阻断INT-02/03自动观察的持久化和FIN-01/04/07的自动消费；不阻断人工证据入口、受限入账和缺证据422路径"
        },
        {
          "question": "首家银行实际开放哪些能力（实收通知、余额、对账文件、贸易核验、可用状态、付款提交、原号查单、扣款回单）、测试环境授权、证书和签名算法目前都未确认",
          "owner": "首家银行项目对接负责人",
          "impact": "阻断对应能力的自动适配和银行共同验收；未开放项一律走受控网银人工办理加独立核实，不阻断人工通道开发"
        },
        {
          "question": "流程N11/N13写CNH，DDL只允许currency_code=CNY，并以fund_location_code 1境内/2境外区分。银行报文中的CNH要按账户配置映射为CNY+位置2，这一规则需要确认是否被财务和银行接受",
          "owner": "财务负责人",
          "impact": "阻断境外人民币账户的报文映射和对账口径；境内CNY账户不受影响"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "funds",
      "before": {
        "personDays": 4.5,
        "baselinePersonDays": 9,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "INT-01"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s5-n11-receipt"
          ],
          "nodeIds": [
            "N11"
          ]
        },
        {
          "useCaseIds": [
            "s5-n11-receipt"
          ],
          "nodeIds": [
            "N11"
          ]
        },
        {
          "useCaseIds": [
            "s5-n11-receipt"
          ],
          "nodeIds": [
            "N11"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "INT-02-S1",
          "previousAction": "实现实收通知、余额及账单原始数据接收。",
          "currentIds": [
            "INT-02-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "INT-02-S2",
          "previousAction": "实现受控文件导入、同键异文隔离及来源保留。",
          "currentIds": [
            "INT-02-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "INT-02-S3",
          "previousAction": "验证重复、缺列、部分账单及跨账户键冲突。",
          "currentIds": [
            "INT-02-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "INT-03": {
    "rationale": "付款与贸易核验能力未知，按已开放清单实现并保留人工执行边界，不删除资金控制。",
    "steps": [
      {
        "personDays": 4,
        "action": "对已开放的贸易核验和可用状态接口做适配，输出带来源的可用证据候选，供FIN-04核实后释放",
        "logic": "输入为FIN-04提交的核验范围（交易号、分配号、INVOICE号、金额）。银行返回结果按范围逐笔对应，金额、账户指纹或INVOICE不一致的结果作为差异隔离。接口未开放时，由授权人员在网银查询并上传回单，另一人核实来源后才可作为证据。适配层只给证据，不调用释放",
        "expected": "每份可用证据都带银行回单号、范围、金额、时间戳和原报文摘要；适配层运行前后受限和可用余额不变；人工证据标记manual并有核实人",
        "test": "对同一分配提交核验，银行只确认其中60%金额可用。判定：证据金额为60%，剩余40%没有证据；调用前后account_tab余额不变；FIN-04用该证据只能释放60%"
      },
      {
        "personDays": 4,
        "action": "实现付款按原transaction_number提交、原号查单、迟到回执关联，以及未开放时的网银人工办理登记",
        "logic": "只在FIN-06 COMMIT锁额后执行。提交使用原transaction_number和原幂等键；连接或响应超时写3 unknown，后续只按原号查询。银行明确扣款写4并附扣款回单；只有银行明确未受理或未扣款才写6。迟到回执按原号关联，与已核实终态冲突时隔离告警，不回退。人工办理：授权经办在网银用原号作为附言办理，上传回单，另一人核实后录入同一状态枚举",
        "expected": "同一付款号在银行侧最多一笔指令；状态只沿1→2→3/4/6推进，4不会因迟到的失败回执被改成6；人工记录和自动记录走同一状态和去重键",
        "test": "让银行模拟器在响应前断开：状态为3，锁额不变。重复触发提交：日志中仍只有一个银行指令号。随后原号查询返回扣款成功：状态变为4。再推送一条迟到的“失败”回执：被隔离告警，状态仍为4"
      },
      {
        "personDays": 3,
        "action": "验证部分成功、扣款不等于到账、明确失败和人工核实冲突四类场景",
        "logic": "银行部分扣款时按实际扣款金额写证据，剩余金额保持未知或差异，不按全额处理。状态4只代表贸易代理商账户扣款，ExecutionStatus 5必须由FIN-07凭中国供应商侧收款证据写入。明确失败要附银行原文说明未扣款，人工核实人与经办人不能是同一人",
        "expected": "四类场景都有可回放的报文样本；本包运行后不出现状态5；没有扣款回单的失败不能触发解锁",
        "test": "构造：1）扣款800/1000；2）扣款1000后无中国供应商回单；3）银行原文“账户冻结未扣款”；4）经办人自己核实网银回单。判定：1）证据800、差额200进入差异；2）状态停在4；3）状态6且附原文；4）核实被拒绝"
      }
    ],
    "risk": {
      "trigger": "付款或核验接口需额外认证或状态映射",
      "extraDays": 5
    },
    "audit": {
      "id": "INT-03",
      "status": "细化",
      "summary": "原稿把贸易核验、可用证明和付款结果放在一起，没有区分“银行受理”“银行扣款”“中国供应商到账”三个不同事实。修订后：S1只对已开放的贸易核验和可用状态查询做适配，输出作为FundsReleaseInput.bank_available_evidence的候选证据；S2实现付款按原transaction_number提交与查单，状态严格映射ExecutionStatus：超时为3 unknown，银行确认扣款为4，只有银行明确未受理或未扣款才是6；未开放时由授权人员在网银办理，原号录入，另一人核实；S3验证部分成功、扣款不等于到账、迟到回执与明确失败。中国供应商到账（状态5）不由本包产生，交给FIN-07。",
      "sourceReferences": [
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 120,
          "lineEnd": 125,
          "reason": "内部核验不等于银行可用；仅真实银行可用证据可释放",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 154,
          "lineEnd": 161,
          "reason": "未知保留锁额、原号查询、扣款不等于中国供应商到账",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "proto/trade/funds/v1/funds.proto",
          "lineStart": 170,
          "lineEnd": 178,
          "reason": "ExecutionStatus 1未提交、2已受理、3未知、4扣款确认、5收款方到账、6明确失败",
          "sha256": "67a2059e55f0d75dba9d4a298a0f5bb9db274ef43240b13f16c617d7ba84282c"
        },
        {
          "path": "proto/trade/funds/v1/funds.proto",
          "lineStart": 357,
          "lineEnd": 375,
          "reason": "FundsReleaseInput.bank_available_evidence",
          "sha256": "67a2059e55f0d75dba9d4a298a0f5bb9db274ef43240b13f16c617d7ba84282c"
        },
        {
          "path": "交付成果/assets/step-five-usecases-model.js",
          "lineStart": 307,
          "lineEnd": 325,
          "reason": "N16时序：COMMIT后原号办理，未知不重发新单",
          "sha256": "e84dced883248e2c4ccb67b263e5ded195856f82f104f740bc0a7b256e2161b5"
        },
        {
          "path": "doc/sql/step5/transaction-recipes.sql",
          "lineStart": 119,
          "lineEnd": 136,
          "reason": "未知恢复事务配方",
          "sha256": "65c6ce76da15fa3e092897720acbc02525e466ceb12b420458ea29ec4dd299a7"
        },
        {
          "path": "doc/examples/step5/http-reference.md",
          "lineStart": 1573,
          "lineEnd": 1610,
          "reason": "GetPaymentExecution示例：缺证据时状态保持未提交",
          "sha256": "593d03ad562dc08e266b3c7c37eb5e3df943b62d6d7c3b70e5ae4a0fd1f3dc08"
        }
      ],
      "useCaseIds": [
        "s5-n14-verification-release",
        "s5-n16-payment"
      ],
      "nodeIds": [
        "N13",
        "N16",
        "N17"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "第1期付款执行和可用证据的边界设计、人工办理登记规则",
          "contract": "待DES-1冻结；参照doc/步骤五系统用例与接口协议.md 154-161行",
          "test": "确认人工办理登记的字段与自动结果字段一致"
        },
        {
          "dependencyId": "INT-01",
          "consumes": "付款提交、查单、核验接口的开放状态和状态码映射",
          "contract": "INT-01能力清单与状态映射表",
          "test": "抽查映射表：超时、处理中映射为3，明确未扣款映射为6"
        },
        {
          "dependencyId": "FIN-06",
          "consumes": "已COMMIT的付款执行意图：transaction_number、原幂等键、受益人账号版本、锁定金额",
          "contract": "proto/trade/funds/v1/funds.proto 427-481行",
          "test": "查询一笔已锁额付款，确认执行快照与锁额凭证已存在后再发起银行调用"
        }
      ],
      "integrationScenarios": [
        {
          "name": "付款超时后的原号恢复",
          "setup": "FIN-06已锁定1000元并生成执行意图；银行模拟器配置为首次响应超时",
          "steps": [
            "适配层提交付款",
            "超时后后台按原号查询",
            "查询返回扣款成功",
            "推送迟到失败回执"
          ],
          "assertions": [
            "期间银行侧只有1笔指令",
            "锁额在扣款确认前一直保留",
            "最终状态4，迟到失败被隔离",
            "没有产生ExecutionStatus 5"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "首家银行实际开放哪些能力（实收通知、余额、对账文件、贸易核验、可用状态、付款提交、原号查单、扣款回单）、测试环境授权、证书和签名算法目前都未确认",
          "owner": "首家银行项目对接负责人",
          "impact": "阻断对应能力的自动适配和银行共同验收；未开放项一律走受控网银人工办理加独立核实，不阻断人工通道开发"
        },
        {
          "question": "银行是否提供“受理后撤销”或“明确未扣款”的书面状态；若没有，状态6只能靠人工凭银行书面说明认定",
          "owner": "首家银行项目对接负责人",
          "impact": "阻断自动解锁路径；不阻断锁额保留和人工核实"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "funds",
      "before": {
        "personDays": 5.5,
        "baselinePersonDays": 11,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "INT-01",
          "FIN-06"
        ]
      },
      "review": "对照步骤五第128至169行及ExecutionStatus，核对银行受理、扣款、供应商到账分离；可用证据只作释放输入，渠道不能自行写账，未知原号查询。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s5-n14-verification-release"
          ],
          "nodeIds": [
            "N13"
          ]
        },
        {
          "useCaseIds": [
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N16"
          ]
        },
        {
          "useCaseIds": [
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N16",
            "N17"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "INT-03-S1",
          "previousAction": "实现已开放贸易核验、可用证据和付款请求。",
          "currentIds": [
            "INT-03-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "INT-03-S2",
          "previousAction": "实现原号查单、迟到结果及受控网银人工核实。",
          "currentIds": [
            "INT-03-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "INT-03-S3",
          "previousAction": "验证部分成功、扣款非到账及明确失败。",
          "currentIds": [
            "INT-03-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "INT-04": {
    "rationale": "本包是银行共同联调；不重复INT单包测试，也不替代资金全链验收。",
    "steps": [
      {
        "personDays": 3,
        "action": "在银行测试环境按能力执行故障矩阵：重复推送、超时、迟到回执、签名失败、乱序",
        "logic": "矩阵行是INT-01清单中已开放的每项能力，列是五类故障。每格写明输入、预期状态和必须不变的余额。乱序时以已核实终态为准，不回退；签名失败只算技术拒绝",
        "expected": "得到一张填好的矩阵，每格有执行时间、原始报文摘要和结论；任何一格出现重复入账、重复付款或未知被解锁都判为不通过",
        "test": "逐格执行。抽查判定：重复推送实收后受限余额只增加一次；付款超时后锁额不变；迟到失败不改变状态4；签名失败后fund_flow行数不变"
      },
      {
        "personDays": 2,
        "action": "演练能力停用、人工接管和恢复自动：同一付款或实收在两种通道之间切换时不重复",
        "logic": "在配置中停用某项能力，系统提示转网银人工办理；人工按原号办理并由另一人核实。恢复自动后，自动通道先按原号查询，发现人工已办理则只关联不再提交",
        "expected": "停用期间没有自动调用；恢复后对同一付款号不产生第二笔银行指令；人工记录保留经办人和核实人",
        "test": "停用付款提交，人工办理一笔并核实；恢复自动后触发同一付款号的提交。判定：自动通道只做查询，银行侧仍为1笔指令，记录显示“人工办理，自动查询确认”"
      },
      {
        "personDays": 2,
        "action": "与银行共同确认开放清单、未开放缺口和验收结论，形成双方签字的记录",
        "logic": "验收只认银行测试环境的真实执行记录；模拟器记录只作为开发自测。未开放能力在结论中写清人工通道和责任岗位",
        "expected": "得到一份双方签字的验收记录，列出已验收能力、未开放能力及其人工通道；上线检查以此为准",
        "test": "核对验收记录：每项已验收能力都能对应到S1矩阵中的执行记录；未开放项都有人工办理岗位；没有引用模拟器结果作为正式通过依据"
      }
    ],
    "risk": {
      "trigger": "银行要求追加共同验收轮次",
      "extraDays": 2
    },
    "audit": {
      "id": "INT-04",
      "status": "细化",
      "summary": "原稿是一张故障矩阵，没有区分自动接口和人工通道各自的验收标准。修订后：S1在银行测试环境按能力逐项执行重复、超时、迟到和签名失败矩阵；S2演练能力停用后切到受控网银人工办理，再恢复自动时与人工历史按同一去重键衔接；S3与银行共同确认开放清单、缺口和验收结论，模拟器结果不能当正式验收。本包不直接实现用例，通过银行联调和故障回归共用支撑s5-n11-receipt、s5-n14-verification-release、s5-n16-payment、s5-n17-reconciliation。",
      "sourceReferences": [
        {
          "path": "doc/步骤一身份签名与可靠性设计.md",
          "lineStart": 88,
          "lineEnd": 88,
          "reason": "重试预算与超限人工接管",
          "sha256": "c33cbc94bc4f3e1e1168d85b66554cd1c276e358fc8870d6139a0d4a1be8b84c"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 154,
          "lineEnd": 161,
          "reason": "未知保持锁额，原号查询",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 184,
          "lineEnd": 201,
          "reason": "错误码与outcomeUnknown语义",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "交付成果/assets/step-five-usecases-model.js",
          "lineStart": 371,
          "lineEnd": 371,
          "reason": "未接入时只验证缺证据阻断",
          "sha256": "e84dced883248e2c4ccb67b263e5ded195856f82f104f740bc0a7b256e2161b5"
        },
        {
          "path": "doc/examples/step5/http-reference.md",
          "lineStart": 59,
          "lineEnd": 60,
          "reason": "示例为设计合成输入，写请求不自动重试",
          "sha256": "593d03ad562dc08e266b3c7c37eb5e3df943b62d6d7c3b70e5ae4a0fd1f3dc08"
        }
      ],
      "useCaseIds": [
        "s5-n11-receipt",
        "s5-n14-verification-release",
        "s5-n16-payment",
        "s5-n17-reconciliation"
      ],
      "nodeIds": [
        "N11",
        "N13",
        "N16",
        "N17"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "第1期银行验收口径和人工接管规则",
          "contract": "待DES-1冻结",
          "test": "确认验收口径中写明模拟器不作正式验收"
        },
        {
          "dependencyId": "INT-02",
          "consumes": "实收、余额、对账文件的观察接收和导入功能",
          "contract": "INT-02交付",
          "test": "用一条重复实收通知验证只保存一次观察"
        },
        {
          "dependencyId": "INT-03",
          "consumes": "核验、可用证据、付款提交和原号查单功能",
          "contract": "INT-03交付",
          "test": "用一笔超时付款验证只按原号查询"
        }
      ],
      "integrationScenarios": [
        {
          "name": "付款能力停用与恢复",
          "setup": "银行测试环境；付款提交已开放；一笔已锁额付款",
          "steps": [
            "运维停用付款提交",
            "授权经办在网银按原号办理并由另一人核实",
            "恢复付款提交并触发同号提交"
          ],
          "assertions": [
            "停用期间无自动调用",
            "恢复后只做原号查询",
            "银行侧只有一笔指令，锁额只消耗一次"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "首家银行实际开放哪些能力（实收通知、余额、对账文件、贸易核验、可用状态、付款提交、原号查单、扣款回单）、测试环境授权、证书和签名算法目前都未确认",
          "owner": "首家银行项目对接负责人",
          "impact": "阻断对应能力的自动适配和银行共同验收；未开放项一律走受控网银人工办理加独立核实，不阻断人工通道开发"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "funds",
      "before": {
        "personDays": 3.5,
        "baselinePersonDays": 7,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "INT-02",
          "INT-03"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s5-n11-receipt",
            "s5-n14-verification-release",
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N11",
            "N13",
            "N16"
          ]
        },
        {
          "useCaseIds": [
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N16"
          ]
        },
        {
          "useCaseIds": [
            "s5-n11-receipt",
            "s5-n16-payment",
            "s5-n17-reconciliation"
          ],
          "nodeIds": [
            "N11",
            "N16",
            "N17"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "INT-04-S1",
          "previousAction": "在银行测试环境执行重复、超时和晚到矩阵。",
          "currentIds": [
            "INT-04-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "INT-04-S2",
          "previousAction": "演练未开放能力、停用及人工接管。",
          "currentIds": [
            "INT-04-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "INT-04-S3",
          "previousAction": "确认开放清单、缺口和银行共同验收结论。",
          "currentIds": [
            "INT-04-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "INT-05": {
    "rationale": "第二期保留原15人日，首家实名签署平台。",
    "steps": [
      {
        "personDays": 5,
        "action": "实现签署任务发起：本地先持久clientReference与合同确切版本、正文摘要、签署人授权引用，COMMIT后由后台处理器调用平台",
        "logic": "前置：合同版状态4待签、无其他活跃任务。锁序交易根→合同根/版→门禁→文件→确认→任务。COMMIT后先按clientReference查单，确定不存在且平台支持同引用幂等才发起；超时写dispatch_unknown，不换引用；平台无查单能力转manual_action。启动及每5秒恢复扫描，租约60秒，8次/24小时预算",
        "expected": "一个合同版本同时最多一个活跃签署任务；HTTP返回201只表示本地已持久；平台侧对同一clientReference最多一个任务",
        "test": "在发起调用时让平台超时。判定：任务为dispatch_unknown；恢复扫描先按原clientReference查单；平台查到已建任务则只关联；平台日志中该clientReference只有一个任务。对同一合同版再次发起：返回已有活跃任务"
      },
      {
        "personDays": 6,
        "action": "实现平台回调：专用凭证、原报文验签、时效与防重放、(providerCode, providerEventId)去重，回调后按原任务查单并归档确切签署文件",
        "logic": "先受控保全原报文再验签；同键同文返回原结果，同键异文409隔离告警。回调只触发查单，不直接生效。查单核对任务号、clientReference、合同版本、全部签署方和审核正文摘要；下载签署文件后在事务外做sha256和扫描，归档成功才在短事务中把状态4→5并写ContractSigned，signed_file_revision_id只确定一次。平台已完成但归档失败时保持verifying并自动恢复",
        "expected": "合同状态5只在签署文件已归档且核对一致后出现；乱序或重复回调不回退已核实终态；旧版本任务的真实签署结果被隔离保留，不推进新版本",
        "test": "依次推送：已签回调、同一事件重复、同键改了签署时间的回调、旧版本任务的已签回调。判定：第一条后状态5且有签署文件版本；第二条返回原结果；第三条409并告警；第四条隔离并转法律处置，新版本状态不变"
      },
      {
        "personDays": 4,
        "action": "验证撤销、未知、平台故障时的人工切换，以及一期线下签署记录与平台任务的衔接",
        "logic": "未知签署任务在平台确定撤销或完成前保持门禁，不能本地作废。平台故障时由授权人员按BL-05线下签署流程处理，平台恢复后先查原clientReference，已线下生效的合同版本不再发起平台任务。5→6生效仍需有权者另行确认",
        "expected": "未知任务期间合同不能生效也不能另签；线下与平台不会对同一版本各产生一份已签原件",
        "test": "制造平台不可用超过24小时恢复预算：任务转manual_action并告警。人工完成线下签署并核验后恢复平台：判定系统不再对该版本发起任务；对已发出的平台任务先查单，平台返回已撤销才关闭"
      }
    ],
    "risk": null,
    "audit": {
      "id": "INT-05",
      "status": "细化",
      "summary": "原稿只写“对接实名签署和回调”，没有落到步骤二已定的任务恢复机制。修订后：S1按步骤二先本地持久clientReference→合同号/版本/正文摘要，COMMIT后才调平台（连接3秒、单次10秒），超时只按原clientReference查单；S2回调以(providerCode, providerEventId)去重，同键异文409隔离，原报文验签，状态4→5只在归档确切签署文件并核验后与ContractSigned同一COMMIT，这只表示已签署，5→6生效另由有权者确认；S3验证撤销、未知、旧版本任务真实签署结果的隔离，以及一期人工线下签署（BL-05）切到平台后的去重衔接。平台尚未选定，列为待确认。",
      "sourceReferences": [
        {
          "path": "doc/步骤二系统用例与接口协议.md",
          "lineStart": 39,
          "lineEnd": 48,
          "reason": "签署任务持久、COMMIT后发起、原clientReference查单、回调去重、4→5与归档同事务",
          "sha256": "309fb3369cd0cde8dcda7f2b1878fd1cb1518505439e5d38b418ce419fd98102"
        },
        {
          "path": "doc/步骤二系统用例与接口协议.md",
          "lineStart": 63,
          "lineEnd": 63,
          "reason": "平台通知入口POST /api/v1/signature-notifications",
          "sha256": "309fb3369cd0cde8dcda7f2b1878fd1cb1518505439e5d38b418ce419fd98102"
        },
        {
          "path": "doc/步骤二系统用例与接口协议.md",
          "lineStart": 75,
          "lineEnd": 75,
          "reason": "通知以(providerCode,providerEventId)去重，不需要用户幂等键",
          "sha256": "309fb3369cd0cde8dcda7f2b1878fd1cb1518505439e5d38b418ce419fd98102"
        },
        {
          "path": "doc/步骤二系统用例与接口协议.md",
          "lineStart": 81,
          "lineEnd": 81,
          "reason": "读5000/4000毫秒、写10000/8000毫秒，平台工作走后台",
          "sha256": "309fb3369cd0cde8dcda7f2b1878fd1cb1518505439e5d38b418ce419fd98102"
        },
        {
          "path": "doc/步骤一身份签名与可靠性设计.md",
          "lineStart": 92,
          "lineEnd": 92,
          "reason": "电子签任务恢复8次/24小时，未知门禁保留到平台确定",
          "sha256": "c33cbc94bc4f3e1e1168d85b66554cd1c276e358fc8870d6139a0d4a1be8b84c"
        },
        {
          "path": "proto/trade/contracts/v1/contracts.proto",
          "lineStart": 41,
          "lineEnd": 60,
          "reason": "CreateSignatureRequest/GetSignatureRequest/CreateSignatureNotification定义",
          "sha256": "c39991b428a7c66710b5758ef9de067e03ff8206c63f6a2c17b3699b396939ce"
        }
      ],
      "useCaseIds": [
        "contract-sign",
        "contract-activate"
      ],
      "nodeIds": [
        "N02",
        "N03",
        "N04"
      ],
      "inputs": [
        {
          "dependencyId": "DES-2",
          "consumes": "第2期电子签平台选型结论和对接边界",
          "contract": "待DES-2冻结；doc/步骤二系统用例与接口协议.md 39-48行",
          "test": "确认选型结论包含幂等、查单、回调签名三项能力说明"
        },
        {
          "dependencyId": "DM-10",
          "consumes": "外部证据映射、跨渠道去重键(providerCode, providerEventId)",
          "contract": "DM-10交付；doc/步骤二系统用例与接口协议.md 75行",
          "test": "以同一事件键分别从回调和查单两条路径写入，确认只有一条记录"
        },
        {
          "dependencyId": "SEC-07",
          "consumes": "回调专用凭证、原报文验签公钥和隐私字段处理",
          "contract": "SEC-07交付",
          "test": "用篡改报文调用回调接口，确认被拒且无业务写入"
        },
        {
          "dependencyId": "BL-17",
          "consumes": "一期联合验收后的线下签署流程和历史合同记录",
          "contract": "BL-17验收记录",
          "test": "抽查一期线下签署合同，确认有签署件版本可供去重比对"
        }
      ],
      "integrationScenarios": [
        {
          "name": "签署回调早于本地COMMIT可见",
          "setup": "平台测试环境；合同版本4；回调在任务COMMIT后极短时间到达",
          "steps": [
            "发起签署",
            "平台立即推送已签回调",
            "后台查单并归档"
          ],
          "assertions": [
            "回调先保全原报文后查单",
            "状态4→5与ContractSigned在同一事务",
            "重复回调不产生第二份签署文件版本"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "第三方电子签平台尚未选定，同引用幂等、原任务查单、回调签名算法均未知",
          "owner": "电子签平台对接负责人",
          "impact": "阻断S1/S2的真实对接与联调；不阻断本地任务持久、恢复调度和人工切换开发"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "funds",
      "before": {
        "personDays": 7.5,
        "baselinePersonDays": 15,
        "subtaskCount": 3,
        "dependencies": [
          "DES-2",
          "DM-10",
          "SEC-07",
          "BL-17"
        ]
      },
      "review": "对照步骤二第39至48行，核对原任务查单、重复通知、签署正文关联及归档后状态；要求修正资金组引用中把4至5写为生效的错误。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "contract-sign"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04"
          ]
        },
        {
          "useCaseIds": [
            "contract-sign",
            "contract-activate"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04"
          ]
        },
        {
          "useCaseIds": [
            "contract-sign",
            "contract-activate"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "INT-05-S1",
          "previousAction": "对接实名、用章授权及确切正文签署任务。",
          "currentIds": [
            "INT-05-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "INT-05-S2",
          "previousAction": "实现回调验签、确切文件及原任务恢复。",
          "currentIds": [
            "INT-05-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "INT-05-S3",
          "previousAction": "验证撤销、未知及人工切换。",
          "currentIds": [
            "INT-05-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "INT-06": {
    "rationale": "第二期保留原12人日，首家受托物流服务方。",
    "steps": [
      {
        "personDays": 4,
        "action": "对接首家物流服务方的受托批次和区段事件，映射为待审物流证据提交",
        "logic": "服务方事件经SEC-07验签后，按(服务方代码, sourceReference)去重，映射为CreateShipmentEvidence待审封套：订舱号、追踪号（不含令牌）、地点代码、区段序号逐字段映射，未能映射的字段留空并标记缺项，不从附件或自由文本提取。待审封套不写区段事实",
        "expected": "每个服务方事件最多一条待审提交；核实前批次状态不变；映射失败的事件进入隔离",
        "test": "推送一条订舱事件两次，再推送同sourceReference但订舱号不同的事件。判定：只有一条待审提交；第三条被隔离告警；批次状态在审核前不变"
      },
      {
        "personDays": 5,
        "action": "核验签收和异常事件的映射：签收需有权收货人凭据，异常映射为事件9并等待处置",
        "logic": "签收事件只有附有权收货人的签收凭据才可提交核实；单纯“已送达”通知只更新区段到达。出境区段的启运需要同批次已有核实的正式放行。异常事件映射为9，处置10由人工决定，不由服务方事件直接完成",
        "expected": "批次只在末段到达且各段完整时到5，有权收货人确认后到6；异常期间新推进被阻断",
        "test": "推送：无凭据的送达通知、出境区段启运（尚无放行）、货损异常、带凭据的签收。判定：第一条只写到达；第二条被门禁拒绝；第三条使批次进入异常并阻断推进；处置前第四条签收被阻断"
      },
      {
        "personDays": 3,
        "action": "联调重复、乱序，以及一期人工登记物流事实与自动事件的关联",
        "logic": "一期已人工登记并核实的区段事实，自动事件到达时按批次、区段、事件类型和实际时刻比对，相同事实只关联不重复推进；内容冲突转人工复核。乱序事件按本地已核实顺序处理，旧通知不回退",
        "expected": "同一物理事实在人工与自动两条来源下只出现一条核实事件",
        "test": "先人工登记并核实提货事件；再推送同一提货的自动事件；再推送一条时间更早的启运事件。判定：提货只关联不新增；早于提货的启运被拒绝并告警；批次状态不回退"
      }
    ],
    "risk": null,
    "audit": {
      "id": "INT-06",
      "status": "细化",
      "summary": "原稿写“受托批次、区段事件和异常映射”，但没写明哪些字段是声明、哪些是核实后的事实。按步骤三：物流公司推送的报文只是待审声明，核实后才写事件3-12；sourceReference只用于去重和追溯；乱序不回退。修订后：S1把首家物流服务方事件映射为CreateShipmentEvidence待审提交，bookingReference、trackingReference、locationCode、legSequence结构化映射；S2对签收、异常做核实映射，出境区段必须已有正式放行；S3联调重复、乱序和一期人工登记历史的关联。服务方API尚未提供，列为待确认。",
      "sourceReferences": [
        {
          "path": "doc/步骤三系统用例与接口协议.md",
          "lineStart": 35,
          "lineEnd": 35,
          "reason": "事件码3-12，待审声明不进核心事件，重复/伪造/验签失败隔离",
          "sha256": "bed3e39150278fba4db2d78386f6de645a89f8c0dd863ef28e37254b5400d339"
        },
        {
          "path": "doc/步骤三系统用例与接口协议.md",
          "lineStart": 65,
          "lineEnd": 65,
          "reason": "bookingReference/trackingReference结构化录入，sourceReference只作去重",
          "sha256": "bed3e39150278fba4db2d78386f6de645a89f8c0dd863ef28e37254b5400d339"
        },
        {
          "path": "doc/步骤三系统用例与接口协议.md",
          "lineStart": 73,
          "lineEnd": 73,
          "reason": "多区段顺序、旧通知不回退、出境须同批放行",
          "sha256": "bed3e39150278fba4db2d78386f6de645a89f8c0dd863ef28e37254b5400d339"
        },
        {
          "path": "proto/trade/logistics/v1/logistics.proto",
          "lineStart": 23,
          "lineEnd": 44,
          "reason": "CreateShipmentEvidence与CreateShipmentEvidenceDecision接口",
          "sha256": "7bce7ecd9d8b345cc605a8ba11c37add96c2a624ef60aaf1ca70800f80eed5ea"
        }
      ],
      "useCaseIds": [
        "booking-pickup",
        "transport-progress",
        "logistics-exception"
      ],
      "nodeIds": [
        "N06",
        "N10"
      ],
      "inputs": [
        {
          "dependencyId": "DES-2",
          "consumes": "第2期物流服务方对接边界和首家服务方选择",
          "contract": "待DES-2冻结",
          "test": "确认首家服务方及其事件清单"
        },
        {
          "dependencyId": "DM-10",
          "consumes": "外部证据映射与跨渠道去重",
          "contract": "DM-10交付",
          "test": "以人工和自动两条路径写同一事件，确认只有一条核实事件"
        },
        {
          "dependencyId": "SEC-07",
          "consumes": "服务方回调凭证与验签",
          "contract": "SEC-07交付",
          "test": "篡改报文调用，确认被隔离"
        }
      ],
      "integrationScenarios": [
        {
          "name": "人工历史与自动事件衔接",
          "setup": "批次已有人工核实的订舱与提货；服务方开始推送事件",
          "steps": [
            "服务方补推订舱、提货",
            "服务方推送启运",
            "审核员核实启运"
          ],
          "assertions": [
            "订舱、提货只关联不重复",
            "启运核实前批次状态不变",
            "核实后批次进入4"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "首家物流服务方尚未提供API协议、签名方式和事件字典",
          "owner": "物流渠道对接负责人",
          "impact": "阻断S1/S2真实对接；不阻断映射规则和人工衔接逻辑开发"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "funds",
      "before": {
        "personDays": 6,
        "baselinePersonDays": 12,
        "subtaskCount": 3,
        "dependencies": [
          "DES-2",
          "DM-10",
          "SEC-07"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "booking-pickup"
          ],
          "nodeIds": [
            "N06"
          ]
        },
        {
          "useCaseIds": [
            "transport-progress",
            "logistics-exception"
          ],
          "nodeIds": [
            "N06",
            "N10"
          ]
        },
        {
          "useCaseIds": [
            "booking-pickup",
            "transport-progress"
          ],
          "nodeIds": [
            "N06",
            "N10"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "INT-06-S1",
          "previousAction": "对接受托批次及区段事件。",
          "currentIds": [
            "INT-06-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "INT-06-S2",
          "previousAction": "核验回执、签收及异常映射。",
          "currentIds": [
            "INT-06-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "INT-06-S3",
          "previousAction": "联调重复、乱序及人工历史关联。",
          "currentIds": [
            "INT-06-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "INT-07": {
    "rationale": "第二期保留原7人日，通知与业务事实隔离。",
    "steps": [
      {
        "personDays": 2,
        "action": "确定通知模板、渠道、接收方授权与最小字段",
        "logic": "模板以(template_code, version_number, locale_code)唯一，content_hash和approved_by记录审批；变量只允许variable_schema_json白名单内的字段，不含金额明细、证件号和银行账号全号。接收方只能是业务事件涉及且已授权的联系人",
        "expected": "每个模板版本都有批准人和摘要；渲染时出现白名单外变量直接失败",
        "test": "用含银行账号全号变量的模板渲染：失败并报告变量名。用已批准模板渲染：内容摘要与content_hash一致"
      },
      {
        "personDays": 3,
        "action": "实现投递、限频和失败重试：按业务号+事件ID幂等，按原投递号重试",
        "logic": "同一(business_reference, event_id)只生成一个投递单；每次调用服务商写一条尝试记录。超时为未知，按原投递号重试，最多8次/24小时，超限转站内待办并告警。按接收方和模板限频",
        "expected": "同一事件不会给同一人发出两条不同投递单；投递状态变化不触发任何业务状态变化",
        "test": "对同一事件触发两次：只有一个投递单。让服务商超时三次后成功：尝试记录4条，投递单1个。检查对应合同或批次状态：发送前后相同"
      },
      {
        "personDays": 2,
        "action": "验证退订、失败和站内接管",
        "logic": "退订后该渠道不再发送，站内待办仍生成；硬失败（号码无效）不重试，直接转站内；业务待办始终是权威",
        "expected": "失败或退订都不影响业务流程推进，相关人员能在站内看到待办",
        "test": "对已退订用户触发事件：无短信尝试，站内待办存在。对无效号码触发：一次尝试后失败，转站内，审批状态不变"
      }
    ],
    "risk": null,
    "audit": {
      "id": "INT-07",
      "status": "细化",
      "summary": "原稿基线关联了16个步骤二、三用例，但这些用例的事实都不由通知产生：通知送达不代表签署、到达或审批完成（步骤一第21行、步骤三第13行）。修订后不标直接实现，只按实际发送场景共用支撑4个用例：contract-review（独立审核合同条款和委托链的待审提醒）、contract-sign（第三方实名签署邀请）、transport-progress（运输、到达与签收进度提醒）、logistics-exception（货损、拒收或延误处置提醒）。S1基于message_template_tab定模板、渠道和变量白名单；S2基于message_notification_delivery_tab/message_delivery_attempt_tab做投递、限频、按原投递号重试；S3验证退订、失败和站内待办接管。三张表的状态码表在DDL中注明“待定义”，列为待确认。",
      "sourceReferences": [
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 959,
          "lineEnd": 977,
          "reason": "message_template_tab：模板版本、渠道、变量白名单、状态码待定义",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 979,
          "lineEnd": 1001,
          "reason": "message_notification_delivery_tab：业务号+事件幂等、投递状态待定义",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 1003,
          "lineEnd": 1021,
          "reason": "message_delivery_attempt_tab：尝试号、服务商消息号、尝试状态",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/步骤一身份签名与可靠性设计.md",
          "lineStart": 21,
          "lineEnd": 21,
          "reason": "短信到达不能作为可靠电子签名或确认",
          "sha256": "c33cbc94bc4f3e1e1168d85b66554cd1c276e358fc8870d6139a0d4a1be8b84c"
        },
        {
          "path": "doc/步骤三系统用例与接口协议.md",
          "lineStart": 13,
          "lineEnd": 13,
          "reason": "通知到达不代表收货",
          "sha256": "bed3e39150278fba4db2d78386f6de645a89f8c0dd863ef28e37254b5400d339"
        },
        {
          "path": "doc/步骤一身份签名与可靠性设计.md",
          "lineStart": 88,
          "lineEnd": 88,
          "reason": "重试8次/24小时与人工接管",
          "sha256": "c33cbc94bc4f3e1e1168d85b66554cd1c276e358fc8870d6139a0d4a1be8b84c"
        }
      ],
      "useCaseIds": [
        "contract-review",
        "contract-sign",
        "transport-progress",
        "logistics-exception"
      ],
      "nodeIds": [
        "N02",
        "N03",
        "N04",
        "N06",
        "N10"
      ],
      "inputs": [
        {
          "dependencyId": "DES-2",
          "consumes": "第2期通知渠道选型与业务事件清单",
          "contract": "待DES-2冻结",
          "test": "确认事件清单中每项都标明对应的业务待办"
        },
        {
          "dependencyId": "SEC-07",
          "consumes": "服务商回执验签与接收方隐私规则",
          "contract": "SEC-07交付",
          "test": "检查回执接口拒绝未签名报文"
        },
        {
          "dependencyId": "BL-17",
          "consumes": "一期站内待办作为通知失败时的接管入口",
          "contract": "BL-17验收记录",
          "test": "确认站内待办在一期已可用"
        }
      ],
      "integrationScenarios": [
        {
          "name": "通知失败不影响签署流程",
          "setup": "合同进入待签，签署人手机号无效",
          "steps": [
            "触发签署邀请通知",
            "服务商返回号码无效",
            "签署人从站内待办进入签署"
          ],
          "assertions": [
            "通知失败转站内",
            "合同状态只由签署结果推进",
            "投递单只有一个"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "message_template_tab、message_notification_delivery_tab、message_delivery_attempt_tab的状态字段码表在DDL中标注“待定义”",
          "owner": "第2期方案设计负责人",
          "impact": "阻断状态持久化定稿；不阻断模板渲染和限频开发"
        },
        {
          "question": "短信、邮件服务商未选定",
          "owner": "第2期方案设计负责人",
          "impact": "阻断真实投递联调；不阻断站内接管"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "funds",
      "before": {
        "personDays": 3.5,
        "baselinePersonDays": 7,
        "subtaskCount": 3,
        "dependencies": [
          "DES-2",
          "SEC-07",
          "BL-17"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "contract-review",
            "contract-sign"
          ],
          "nodeIds": [
            "N02",
            "N06"
          ]
        },
        {
          "useCaseIds": [
            "contract-sign",
            "transport-progress",
            "logistics-exception"
          ],
          "nodeIds": [
            "N02",
            "N06",
            "N10"
          ]
        },
        {
          "useCaseIds": [
            "contract-sign",
            "logistics-exception"
          ],
          "nodeIds": [
            "N02",
            "N10"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "INT-07-S1",
          "previousAction": "确定模板、接收方授权及最小字段。",
          "currentIds": [
            "INT-07-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "INT-07-S2",
          "previousAction": "实现限频、投递和失败重试。",
          "currentIds": [
            "INT-07-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "INT-07-S3",
          "previousAction": "验证退订、失败及站内接管。",
          "currentIds": [
            "INT-07-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "INT-08": {
    "rationale": "第三期保留原18人日，正式海关渠道获批后才实施。",
    "steps": [
      {
        "personDays": 7,
        "action": "实现正式申报、更正、撤回提交与原号查询",
        "logic": "前置：最终稿已经供应商书面确认（事件6）、办理意图（事件7）已COMMIT。action 1申报、2更正、3撤回；提交在事务外按原办理号执行。超时写3未知，后续只按原办理号查询，不重新派发；只有渠道明确未提交才写5",
        "expected": "每个办理号对应渠道侧最多一次提交；未确认最终稿的报关单不能提交",
        "test": "对未经供应商确认的报关稿发起办理：被门禁拒绝。对已确认稿发起并让渠道超时：状态3；原号查询返回已提交：状态4；渠道日志只有一次提交"
      },
      {
        "personDays": 6,
        "action": "把海关回执映射为正式事件：受理9、查验10、放行11、补正要求12、退单13、撤回14",
        "logic": "按（渠道，外部稳定键）去重，键超128字符用注册规范的定长摘要并保留原文；同键异文拒绝；验签失败记技术拒绝，不写退单；只有已核实的放行才写事件11",
        "expected": "每个海关回执最多一条正式事件；技术错误不会显示成海关退单",
        "test": "推送受理、同键重复、同键异文、验签失败、放行五条。判定：受理与放行各写一次；重复返回原事件；异文被拒；验签失败只有技术记录"
      },
      {
        "personDays": 5,
        "action": "联调自动回执与一期人工登记的事件17待核声明的衔接，以及人工切换",
        "logic": "一期出口报关代理人工上传的回执是事件17待核，源键放在payload中，不占正式去重键。自动回执到达后，若对应待核声明存在，只追加正式事实并关联声明；独立人员已人工核实的正式事实，自动回执按同一外部键去重。渠道不可用时退回人工登记+独立核实",
        "expected": "同一海关回执在人工和自动两条路径下只产生一条正式事实",
        "test": "出口报关代理先人工上传放行回执（事件17），审核员核实后写事件11；渠道再推送同一放行。判定：只有一个事件11；自动回执关联到既有事实"
      }
    ],
    "risk": null,
    "audit": {
      "id": "INT-08",
      "status": "细化",
      "summary": "原稿关联了步骤四全部10个用例，但草稿、修订、审核、供应商书面确认、附件交付都是内部流程，不经过海关渠道。修订后只关联s4-filing、s4-official、s4-correction、s4-query。S1按customs_filing_request_tab的execution_status 1-5实现申报、更正、撤回提交和原号查询，技术超时只能写3未知，不能写5；S2把海关回执映射为受理、查验、放行、退单等正式事件，按“渠道+外部稳定键”去重，同键异文拒绝；S3处理与一期人工事件17待核声明的衔接：同一外部键只能有一个正式事实。前置门禁（供应商书面确认最终稿）不得被渠道绕过。",
      "sourceReferences": [
        {
          "path": "doc/步骤四系统用例与接口协议.md",
          "lineStart": 43,
          "lineEnd": 45,
          "reason": "执行状态1-5、事件1-18、外部键映射、同键异文拒绝、技术验签失败不算退单",
          "sha256": "eaf6e283e192ee40ef03978d2fb4945853c01d1713eba11df41922b47a544d69"
        },
        {
          "path": "doc/步骤四系统用例与接口协议.md",
          "lineStart": 54,
          "lineEnd": 54,
          "reason": "出口报关代理登记事件17待核，独立核实后才追加正式事实",
          "sha256": "eaf6e283e192ee40ef03978d2fb4945853c01d1713eba11df41922b47a544d69"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 318,
          "lineEnd": 337,
          "reason": "customs_filing_request_tab及execution_status",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "proto/trade/customs/v1/customs.proto",
          "lineStart": 39,
          "lineEnd": 54,
          "reason": "CreateCustomsFilingRequest/GetCustomsFilingRequest/CreateCustomsOfficialEvidence",
          "sha256": "a0f97ed44350574d2c1cd4d1c27b8e7cede75899e6cb3ee43b2d99b2b4a0d71f"
        }
      ],
      "useCaseIds": [
        "s4-filing",
        "s4-official",
        "s4-correction",
        "s4-query"
      ],
      "nodeIds": [
        "N09"
      ],
      "inputs": [
        {
          "dependencyId": "DES-3",
          "consumes": "第3期海关渠道对接边界与授权",
          "contract": "待DES-3冻结",
          "test": "确认渠道清单及授权主体"
        },
        {
          "dependencyId": "DM-11",
          "consumes": "正式事件外部键规范、定长摘要规则和规则版本",
          "contract": "DM-11交付；doc/步骤四系统用例与接口协议.md 45行",
          "test": "用超长外部键验证摘要后唯一"
        },
        {
          "dependencyId": "SEC-08",
          "consumes": "官方渠道许可、证书及查询隔离",
          "contract": "SEC-08交付",
          "test": "以无许可主体调用，确认被拒"
        }
      ],
      "integrationScenarios": [
        {
          "name": "申报超时后放行回执先到",
          "setup": "已确认报关稿、办理意图已提交；渠道提交超时",
          "steps": [
            "提交超时，状态3",
            "渠道推送放行回执",
            "原号查询"
          ],
          "assertions": [
            "放行回执关联原办理号",
            "执行状态由查询确定为4",
            "不存在第二次提交"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "海关正式渠道（单一窗口或报关代理系统）的接入方式、授权主体和回执签名尚未确定",
          "owner": "报关业务负责人",
          "impact": "阻断S1/S2真实对接；不阻断人工事件17登记和独立核实"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "funds",
      "before": {
        "personDays": 9,
        "baselinePersonDays": 18,
        "subtaskCount": 3,
        "dependencies": [
          "DES-3",
          "DM-11",
          "SEC-08"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s4-filing",
            "s4-query"
          ],
          "nodeIds": [
            "N09"
          ]
        },
        {
          "useCaseIds": [
            "s4-official",
            "s4-correction"
          ],
          "nodeIds": [
            "N09"
          ]
        },
        {
          "useCaseIds": [
            "s4-official",
            "s4-query"
          ],
          "nodeIds": [
            "N09"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "INT-08-S1",
          "previousAction": "实现正式申报、更正撤回及原号查询。",
          "currentIds": [
            "INT-08-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "INT-08-S2",
          "previousAction": "核验受理、查验放行及正式结果。",
          "currentIds": [
            "INT-08-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "INT-08-S3",
          "previousAction": "联调重复、未知和人工切换。",
          "currentIds": [
            "INT-08-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "INT-09": {
    "rationale": "第三期保留原20人日，证明与退税分别办理。",
    "steps": [
      {
        "personDays": 8,
        "action": "对接已获授权的代理出口货物证明申请、进度与结果",
        "logic": "前置：职责、范围、时限、正式渠道、当前独立批准和确切文件都满足。提交在事务外按原dispatch_reference执行；未接通返回OFFICIAL_CHANNEL_UNAVAILABLE，不派发模拟成功。回执按官方稳定键去重，核对原办理号和确切提交版后才追加正式事件6-12",
        "expected": "证明的正式状态只来自已核实的官方回执；验签或传输失败不当作机关拒绝",
        "test": "渠道关闭时发起：返回OFFICIAL_CHANNEL_UNAVAILABLE，无办理记录变化。渠道打开、提交超时：保持原dispatch_reference为未知；查询得到受理：追加受理事件；同一回执重复推送：不新增"
      },
      {
        "personDays": 7,
        "action": "对接退税提交、受理通知、补正和正式决定",
        "logic": "退税提交与证明一样按原dispatch号；补正要求作为正式事件8；正式决定只记录批准金额和决定，不写任何到账。跟进待办可记为事件15证据声明，但不当作官方进度",
        "expected": "批准决定不会改变贸易代理商的资金三位置，也不会显示为已到账",
        "test": "推送一份批准退税决定。判定：退税案件进入正式处理完成；fund_flow、account_tab无变化；s7-credit仍显示REFUND_OBSERVATION_UNAVAILABLE（除非FIN-12已核实中国供应商侧到账）"
      },
      {
        "personDays": 5,
        "action": "联调更正、撤销、未知与原号恢复，以及一期人工办理切换",
        "logic": "证明撤销或更正保留历史并影响退税用例的依据；一期人工在电子税务局办理的记录以事件15待核声明登记，自动回执到达时按官方稳定键关联，不重复。技术失败超出恢复预算转人工，沿原dispatch号查询",
        "expected": "人工与自动对同一官方事实只产生一条正式记录；撤销后依赖它的退税依据被标记失效",
        "test": "人工登记受理回执并核实；渠道再推送同一受理：只关联。推送证明撤销：退税案件显示依据失效，不自动重新提交"
      }
    ],
    "risk": null,
    "audit": {
      "id": "INT-09",
      "status": "待确认",
      "summary": "原稿关联了步骤六、七全部20个用例，实际渠道只参与提交、回执和查询。修订后关联s6-dispatch、s6-official-receipt、s6-correction、s6-certificate、s6-query、s7-dispatch、s7-notice、s7-decision、s7-recovery。外部未接入时返回OFFICIAL_CHANNEL_UNAVAILABLE，办理意图只记录原dispatch_reference，未知按原号查询，不得新号重派。退税到账不由税务渠道返回，而是进入供应商中国供应商账户，所以s7-credit不由本包产生事实，归FIN-12。申请主体和职责尚待税务机关确认，状态改为待确认。",
      "sourceReferences": [
        {
          "path": "doc/步骤六系统用例与接口协议.md",
          "lineStart": 36,
          "lineEnd": 38,
          "reason": "OFFICIAL_CHANNEL_UNAVAILABLE、原dispatch_reference、证据上传只是声明、证明交付与接收",
          "sha256": "c80e0ceb5b024eacc205546ce30739d4118ec98c8ffcc6bd960584142b91d409"
        },
        {
          "path": "doc/步骤七系统用例与接口协议.md",
          "lineStart": 9,
          "lineEnd": 9,
          "reason": "退税案件状态，提交意图不等于已提交，超时不等于拒绝",
          "sha256": "8b9b0d38e55742d3a1f3de0654513e94ace510722685acdfbc2ea6bea6fc41ab"
        },
        {
          "path": "doc/步骤七系统用例与接口协议.md",
          "lineStart": 15,
          "lineEnd": 15,
          "reason": "退税事件1-18与提交/执行状态",
          "sha256": "8b9b0d38e55742d3a1f3de0654513e94ace510722685acdfbc2ea6bea6fc41ab"
        },
        {
          "path": "doc/步骤七系统用例与接口协议.md",
          "lineStart": 35,
          "lineEnd": 35,
          "reason": "税务机关不返回到账，退税入中国供应商，不虚增贸易代理商货款",
          "sha256": "8b9b0d38e55742d3a1f3de0654513e94ace510722685acdfbc2ea6bea6fc41ab"
        },
        {
          "path": "doc/步骤七系统用例与接口协议.md",
          "lineStart": 43,
          "lineEnd": 43,
          "reason": "I/O事务外，超时记未知按原dispatch号查询",
          "sha256": "8b9b0d38e55742d3a1f3de0654513e94ace510722685acdfbc2ea6bea6fc41ab"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 420,
          "lineEnd": 445,
          "reason": "tax_submission_tab及execution_status",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "proto/trade/taxproof/v1/taxproof.proto",
          "lineStart": 31,
          "lineEnd": 44,
          "reason": "CreateTaxProofDispatch与OfficialClaim",
          "sha256": "64f7dad6388e571d26b5136a7f8a3a2177ca8e6671592a19edca3ad0ca70759c"
        },
        {
          "path": "proto/trade/taxrefund/v1/taxrefund.proto",
          "lineStart": 18,
          "lineEnd": 24,
          "reason": "CreateRefundDispatch/GetRefundOperation",
          "sha256": "cfcaaf9719573217afbfcadcfda06650b9e050f4297cffe03ff85c282f7fef9d"
        }
      ],
      "useCaseIds": [
        "s6-dispatch",
        "s6-official-receipt",
        "s6-correction",
        "s6-certificate",
        "s6-query",
        "s7-dispatch",
        "s7-notice",
        "s7-decision",
        "s7-recovery"
      ],
      "nodeIds": [
        "N19",
        "N20",
        "N21"
      ],
      "inputs": [
        {
          "dependencyId": "DES-3",
          "consumes": "第3期证明与退税渠道边界、申请主体与职责划分",
          "contract": "待DES-3冻结",
          "test": "确认申请主体（贸易代理商或中国供应商）逐项写明"
        },
        {
          "dependencyId": "DM-11",
          "consumes": "官方事件键、规则版本",
          "contract": "DM-11交付",
          "test": "用同一官方回执两次写入，确认去重"
        },
        {
          "dependencyId": "SEC-08",
          "consumes": "主管渠道许可与证书",
          "contract": "SEC-08交付",
          "test": "无许可调用被拒"
        }
      ],
      "integrationScenarios": [
        {
          "name": "退税批准不影响贸易代理商资金",
          "setup": "退税案件已提交；贸易代理商账户有受限和可用余额",
          "steps": [
            "推送正式批准决定",
            "查询贸易代理商资金概览"
          ],
          "assertions": [
            "案件状态更新",
            "贸易代理商的受限、可用、付款锁额不变",
            "到账栏显示未观察"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "代理出口货物证明与退税的申请主体、职责范围和渠道授权需税务机关确认",
          "owner": "税务业务负责人",
          "impact": "阻断S1/S2真实对接；不阻断人工办理登记和独立核实"
        },
        {
          "question": "退税进入供应商中国供应商账户，贸易代理商系统没有观察中国供应商账户的权限",
          "owner": "财务负责人",
          "impact": "阻断s7-credit自动核对；只能由中国供应商提供银行证据并独立核实，详见FIN-12"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "funds",
      "before": {
        "personDays": 10,
        "baselinePersonDays": 20,
        "subtaskCount": 3,
        "dependencies": [
          "DES-3",
          "DM-11",
          "SEC-08"
        ]
      },
      "review": "对照步骤六主管职责与步骤七第35至43行，核对官方税务决定不证明供应商银行到账，职责未确认阻断真实办理。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s6-dispatch",
            "s6-official-receipt",
            "s6-certificate",
            "s6-query"
          ],
          "nodeIds": [
            "N19",
            "N20"
          ]
        },
        {
          "useCaseIds": [
            "s7-dispatch",
            "s7-notice",
            "s7-decision",
            "s7-recovery"
          ],
          "nodeIds": [
            "N21"
          ]
        },
        {
          "useCaseIds": [
            "s6-correction",
            "s6-query",
            "s7-recovery"
          ],
          "nodeIds": [
            "N20",
            "N21"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "INT-09-S1",
          "previousAction": "对接获授权的证明申请、进度和结果。",
          "currentIds": [
            "INT-09-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "INT-09-S2",
          "previousAction": "对接退税提交、通知及补正。",
          "currentIds": [
            "INT-09-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "INT-09-S3",
          "previousAction": "联调更正撤销、未知及原号恢复。",
          "currentIds": [
            "INT-09-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "INT-10": {
    "rationale": "第三期保留原12人日，仅授权关务信息查询。",
    "steps": [
      {
        "personDays": 3,
        "action": "核对许可范围、可查询字段、数据时效和更新频率",
        "logic": "依据官方平台的授权书确定可查询的主体和字段；未在授权内的字段不接入。每个字段登记来源、版本和有效期",
        "expected": "得到一份授权字段清单；未授权时功能显示“未配置授权”并禁用",
        "test": "在未配置授权的环境打开查询：功能禁用、无外部调用。导入授权清单后：只出现清单内字段"
      },
      {
        "personDays": 5,
        "action": "实现查询、缓存与过期标记、限流和审计",
        "logic": "查询只用当前主体的授权凭据；结果带来源、版本和获取时间，过期后标记过期仍可查看但不能作为当前参考。引用参考数据填写草稿时记录来源版本，参考数据更新不改旧草稿。每次查询写审计",
        "expected": "草稿中引用的参考数据可追溯版本；查询结果从不写入正式申报事实",
        "test": "引用商品编码填写草稿后，模拟参考数据更新。判定：旧草稿的编码和版本不变，提示有新版本；正式事件表无新增"
      },
      {
        "personDays": 4,
        "action": "验证撤权、过期和不可用",
        "logic": "授权撤销后立即拒绝查询，已缓存数据标记来源已撤权；渠道不可用时返回明确错误，不使用合成数据",
        "expected": "撤权后无法查询其他企业或本企业新数据；不可用时页面显示真实错误",
        "test": "撤销授权后查询：返回无授权。用其他企业编号查询：拒绝。断开渠道：返回不可用错误，无合成结果"
      }
    ],
    "risk": null,
    "audit": {
      "id": "INT-10",
      "status": "待确认",
      "summary": "原稿基线把全部69个用例都列为关联，属于过度关联。授权关务查询只提供商品编码、申报要素和本企业有权申报信息的参考数据，查询结果不能代替归类判断或正式申报回执。修订后只关联s4-draft、s4-revision（填写草稿时引用参考数据）、s4-official（独立核实人可查询本企业申报信息作为核对线索，不当正式事实）。S1核对许可范围和字段；S2实现查询、来源版本与时效标记、限流和审计；S3验证撤权、过期和不可用。许可条件尚未与官方平台确认，状态为待确认。",
      "sourceReferences": [
        {
          "path": "交付成果/资方展示_产品功能原型设计.md",
          "lineStart": 145,
          "lineEnd": 147,
          "reason": "授权取得本企业报关信息，不公开全企业数据，未配置授权时禁用同步",
          "sha256": "2d652fdff243786cdabbd7221d383d1ebb5d071c172294218d4e3cbb63bdda04"
        },
        {
          "path": "doc/领域拆分评估与交易域设计.md",
          "lineStart": 105,
          "lineEnd": 105,
          "reason": "参考数据必须有来源、版本、生效区间，不得重解释旧交易",
          "sha256": "9756de6bf51abc7ed64763295fafe9949093b33bf8490867b2197567856e35b6"
        },
        {
          "path": "doc/步骤四系统用例与接口协议.md",
          "lineStart": 54,
          "lineEnd": 54,
          "reason": "正式证据需要真实来源和独立核实",
          "sha256": "eaf6e283e192ee40ef03978d2fb4945853c01d1713eba11df41922b47a544d69"
        }
      ],
      "useCaseIds": [
        "s4-draft",
        "s4-revision",
        "s4-official"
      ],
      "nodeIds": [
        "N07",
        "N09"
      ],
      "inputs": [
        {
          "dependencyId": "DES-3",
          "consumes": "第3期授权查询边界",
          "contract": "待DES-3冻结",
          "test": "确认查询范围仅限本企业"
        },
        {
          "dependencyId": "INT-08",
          "consumes": "海关渠道连接与证书",
          "contract": "INT-08交付",
          "test": "复用INT-08渠道完成一次连通测试"
        },
        {
          "dependencyId": "SEC-08",
          "consumes": "查询隔离与许可",
          "contract": "SEC-08交付",
          "test": "用跨企业编号查询，确认被拒"
        }
      ],
      "integrationScenarios": [
        {
          "name": "参考数据更新不改旧草稿",
          "setup": "草稿已引用商品编码版本v1",
          "steps": [
            "参考数据更新到v2",
            "打开旧草稿",
            "新建草稿"
          ],
          "assertions": [
            "旧草稿保持v1并提示",
            "新草稿默认v2",
            "正式申报事实无变化"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "官方平台授权查询的字段、接口、频率、证书和授权条件尚未确认",
          "owner": "报关业务负责人",
          "impact": "阻断真实查询接入；不阻断人工货品录入"
        },
        {
          "question": "基线对INT-10关联全部69个用例，建议收窄到s4-draft、s4-revision、s4-official",
          "owner": "第3期方案设计负责人",
          "impact": "影响用例追溯表，不影响开发范围"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "funds",
      "before": {
        "personDays": 6,
        "baselinePersonDays": 12,
        "subtaskCount": 3,
        "dependencies": [
          "DES-3",
          "INT-08",
          "SEC-08"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s4-draft"
          ],
          "nodeIds": [
            "N07"
          ]
        },
        {
          "useCaseIds": [
            "s4-draft",
            "s4-revision",
            "s4-official"
          ],
          "nodeIds": [
            "N07",
            "N09"
          ]
        },
        {
          "useCaseIds": [
            "s4-draft",
            "s4-official"
          ],
          "nodeIds": [
            "N07",
            "N09"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "INT-10-S1",
          "previousAction": "核对许可、查询范围、数据字段和时效。",
          "currentIds": [
            "INT-10-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "INT-10-S2",
          "previousAction": "实现查询、缓存过期标记、限流和审计。",
          "currentIds": [
            "INT-10-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "INT-10-S3",
          "previousAction": "验证撤权、过期及不可用。",
          "currentIds": [
            "INT-10-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "INT-11": {
    "rationale": "第三期保留原8人日，命中仍由有权人员复核。",
    "steps": [
      {
        "personDays": 2,
        "action": "确认合法名单来源、许可范围和最小查询字段",
        "logic": "名单服务商必须有合法授权；查询只发送名称、国家和必要的证件号片段，不发送交易金额和合同内容",
        "expected": "得到服务商清单、名单版本策略和字段清单",
        "test": "核对字段清单不含金额、合同正文；用测试账号调用一次，记录list_version"
      },
      {
        "personDays": 4,
        "action": "实现筛查运行、版本记录、命中解释和人工复核",
        "logic": "每次筛查写一条run记录（provider_code、list_version、rule_version、主体快照版本）；命中写hit记录，matched_attributes_json只存脱敏值。命中只生成人工复核任务，复核人与发起人不同；复核结论可作为暂停原因交给步骤八",
        "expected": "命中不会自动拒绝交易或付款，也不会自动通过；结论可追溯名单和规则版本",
        "test": "对一个与名单近似的付款方筛查：生成命中和复核任务；复核前付款门禁显示“合规复核未完成”；发起人尝试复核被拒"
      },
      {
        "personDays": 2,
        "action": "验证误报、服务商故障和缺数据",
        "logic": "服务商不可用时，该筛查记为缺项，相关门禁阻断，不默认通过；缺必要字段时不调用，直接返回缺项",
        "expected": "故障期间没有“通过”结论；误报经复核解除后保留历史",
        "test": "断开服务商后筛查：结果为缺项，付款门禁阻断。复核一条误报：结论为排除，run和hit记录保留"
      }
    ],
    "risk": null,
    "audit": {
      "id": "INT-11",
      "status": "细化",
      "summary": "原稿基线也关联了全部69个用例。筛查只在主体提交、来款付款方、付款受益人和四流核对时使用。修订后关联supplier-submit、payer-submit、s5-n11-receipt、s5-n16-payment、s8-context、s8-hold。S1确认合法名单来源和最小查询字段；S2基于compliance_screening_run_tab和compliance_screening_hit_tab保存provider_code、list_version、rule_version、命中解释（只存脱敏值），命中只转人工复核，不自动成为法定结论；S3验证误报、服务商故障时缺项阻断。run_status与decision_status码表在DDL中未定义，列为待确认。一期、二期由合规人员人工筛查并登记结果。",
      "sourceReferences": [
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 716,
          "lineEnd": 738,
          "reason": "compliance_screening_run_tab：provider_code、list_version、rule_version",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 741,
          "lineEnd": 759,
          "reason": "compliance_screening_hit_tab：命中属性",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/领域拆分评估与交易域设计.md",
          "lineStart": 48,
          "lineEnd": 48,
          "reason": "合规不能压成交易上一个布尔值",
          "sha256": "9756de6bf51abc7ed64763295fafe9949093b33bf8490867b2197567856e35b6"
        },
        {
          "path": "doc/领域拆分评估与交易域设计.md",
          "lineStart": 65,
          "lineEnd": 65,
          "reason": "筛查不等于法定结论，不覆盖资金或监管权威事实",
          "sha256": "9756de6bf51abc7ed64763295fafe9949093b33bf8490867b2197567856e35b6"
        },
        {
          "path": "doc/领域拆分评估与交易域设计.md",
          "lineStart": 595,
          "lineEnd": 595,
          "reason": "matched_attributes_json只存脱敏值，不复制原始名单",
          "sha256": "9756de6bf51abc7ed64763295fafe9949093b33bf8490867b2197567856e35b6"
        },
        {
          "path": "交付成果/资金流两清与反洗钱风险分析.md",
          "lineStart": 23,
          "lineEnd": 31,
          "reason": "现有系统合规筛查空白与高风险评估",
          "sha256": "80783f8a2b342b97a9459389e1c27793f0b1bfd54dd16c4c42fe7ed0f49cf703"
        },
        {
          "path": "doc/步骤八系统用例与接口协议.md",
          "lineStart": 32,
          "lineEnd": 32,
          "reason": "多原因暂停分别解除",
          "sha256": "e2918d2051a08419256735255787e066a167ecd22e70a9bc29a278378a9c632e"
        }
      ],
      "useCaseIds": [
        "supplier-submit",
        "payer-submit",
        "s5-n11-receipt",
        "s5-n16-payment",
        "s8-context",
        "s8-hold"
      ],
      "nodeIds": [
        "N01",
        "N11",
        "N16",
        "N17",
        "N22",
        "N23"
      ],
      "inputs": [
        {
          "dependencyId": "DES-3",
          "consumes": "第3期合规筛查边界",
          "contract": "待DES-3冻结",
          "test": "确认服务商与使用节点"
        },
        {
          "dependencyId": "SEC-08",
          "consumes": "外部渠道许可与数据隔离",
          "contract": "SEC-08交付",
          "test": "检查查询字段最小化"
        },
        {
          "dependencyId": "DM-11",
          "consumes": "规则版本与查询许可",
          "contract": "DM-11交付",
          "test": "确认rule_version来源"
        }
      ],
      "integrationScenarios": [
        {
          "name": "付款前受益人命中",
          "setup": "付款审批中，受益人命中名单",
          "steps": [
            "触发筛查",
            "复核员处理"
          ],
          "assertions": [
            "复核前不能锁额",
            "排除后门禁解除",
            "确认命中后转步骤八暂停"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "compliance_screening_run_tab的run_status和decision_status码表未定义",
          "owner": "第3期方案设计负责人",
          "impact": "阻断状态持久化定稿"
        },
        {
          "question": "合法名单服务商及授权未确定",
          "owner": "合规负责人",
          "impact": "阻断自动筛查；不阻断人工筛查登记"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "funds",
      "before": {
        "personDays": 4,
        "baselinePersonDays": 8,
        "subtaskCount": 3,
        "dependencies": [
          "DES-3",
          "SEC-08",
          "DM-11"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit"
          ],
          "nodeIds": [
            "N01"
          ]
        },
        {
          "useCaseIds": [
            "payer-submit",
            "s5-n11-receipt",
            "s5-n16-payment",
            "s8-hold"
          ],
          "nodeIds": [
            "N01",
            "N11",
            "N16",
            "N23"
          ]
        },
        {
          "useCaseIds": [
            "s5-n16-payment",
            "s8-context"
          ],
          "nodeIds": [
            "N16",
            "N22"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "INT-11-S1",
          "previousAction": "确认合法名单来源及最小查询字段。",
          "currentIds": [
            "INT-11-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "INT-11-S2",
          "previousAction": "实现版本、命中解释和人工复核。",
          "currentIds": [
            "INT-11-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "INT-11-S3",
          "previousAction": "验证误报、故障及缺数据。",
          "currentIds": [
            "INT-11-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "OPS-01": {
    "rationale": "已有本机部署脚本，只计新机房环境参数化、隔离与加固，不重复选型或物理施工。",
    "steps": [
      {
        "personDays": 2,
        "action": "形成已交付机房资源与环境隔离配置清单。",
        "logic": "输入批准资源模型、设备交接单和开发测试生产用途；逐台记录角色、操作系统版本、网卡、存储、机柜、管理责任及备份目标。核对双电源、双PDU、交换和线路的实际交付证据；缺设备或专业机电验收时列缺项，不用规划参数冒充实物，也不在本包施工。",
        "expected": "得到资源实物与规划差异、环境地址分配、管理路径和未交付项。开发数据不能落入生产，8台规划不构成全栈高可用承诺。",
        "test": "在获准的隔离验收环境逐台对照已批准档位的交接单，选一台不存在或角色不符的设备确认列为阻断；核对开发账号不能读取生产备份。资源模板和本机验证不能替代实物及隔离验收。"
      },
      {
        "personDays": 2,
        "action": "编制可重复应用的网络、入口和银行出口环境配置。",
        "logic": "以环境网段、银行批准目标、DNS/TLS和管理人员清单为输入，划分业务、数据库、存储、管理和备份访问；隔离/api/v1与/internal/v1，外部入口不转发内部路径。业务出口一期仅批准银行；病毒库更新、授时、镜像导入等运维依赖另列最小许可，不混入业务外联。",
        "expected": "配置可审阅、按环境替换，管理访问经批准的堡垒入口和强认证。数据库、S3控制台、监控及调度后台不直接面向业务用户。",
        "test": "在授权测试网分别尝试外部入口访问内部路径、开发网访问生产数据库和未批准业务目标；必须拒绝。批准银行测试目标及授权管理路径可达并留访问记录，不能仅以本机loopback证明生产隔离。"
      },
      {
        "personDays": 1,
        "action": "交付隔离验收记录和环境恢复操作单。",
        "logic": "按批准的端口与源地址矩阵逐项验证，不扫描未授权地址；比较配置版本、实际监听、访问日志和重启策略。本机LaunchAgent是用户登录后启动，生产启动及配置恢复机制须单独制定，不能沿用登录自启假设。",
        "expected": "交接记录包含允许与拒绝结果、配置摘要、责任人及恢复入口；缺正式证书或隔离不符时禁止生产放行，不影响本机离线方案评审。",
        "test": "由另一名运维在空白隔离节点复核配置恢复步骤，检查重启后只恢复批准监听；非管理来源被拒且审计可定位，凭据不写入日志或操作单。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "OPS-01",
      "status": "细化",
      "summary": "本机资产仅用于方案验证，生产环境须独立交付。按已批准资源档位交接实物、网络、供电和管理边界；8台为富裕预算规划，不能当作已交付设备。以隔离环境和入口共用支撑“供应商首次提交交易资料”，以批准银行出口支撑“审批付款、锁定金额并确认供应商到账”；不直接实现建单、付款审批或银行事实核实。采购、施工与设备到货由机房方负责，本包负责配置和验收。",
      "sourceReferences": [
        {
          "path": "infra/local/README.md",
          "lineStart": 9,
          "lineEnd": 24,
          "reason": "本机Colima、组件入口、loopback与管理员访问边界",
          "sha256": "79e5697633ec8b2d27a9953c8506c49e49fdbfe9c129c66f13b0c3890d96b5a3"
        },
        {
          "path": "doc/自建机房两年资源规划.md",
          "lineStart": 29,
          "lineEnd": 39,
          "reason": "三档资源角色和8台富裕档规划，均须保留安全与留存底线",
          "sha256": "c74bb466f37756920c856595fd02119d4960ae774d3cf5b3c913e998fcc11b41"
        },
        {
          "path": "doc/自建机房两年资源规划.md",
          "lineStart": 47,
          "lineEnd": 64,
          "reason": "主从及单点故障边界、机房配套和验收要求，规划不等于实物交付",
          "sha256": "c74bb466f37756920c856595fd02119d4960ae774d3cf5b3c913e998fcc11b41"
        },
        {
          "path": "deploy/nginx.conf",
          "lineStart": 1,
          "lineEnd": 28,
          "reason": "现有配置仅静态文件和Basic认证，未配置生产业务入口",
          "sha256": "1a0b649b871eb7f69a608824d97dd1c4b795664c4c5d31dd84280430bd33d091"
        },
        {
          "path": "doc/步骤一HTTP接口协议.md",
          "lineStart": 9,
          "lineEnd": 15,
          "reason": "首次建单使用隔离外部入口，身份从服务端凭证取得",
          "sha256": "3783a1197e2c7dbbfb42b5fb1a18d9d71c5db69c2aab257fdbe1b7d912b8d1c3"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 164,
          "lineEnd": 169,
          "reason": "银行付款依赖受控出口，未知原号核实与到账分离，不由环境包直接实现",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        }
      ],
      "useCaseIds": [
        "supplier-submit",
        "s5-n16-payment"
      ],
      "nodeIds": [
        "N01",
        "N16"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "批准的资源角色、环境网段、银行出口、机房配套交付边界和生产启动方式",
          "contract": "doc/自建机房两年资源规划.md；实际IP、设备清单、系统版本及机电交接单待冻结",
          "test": "逐项签认规划与实物差异；缺项保留，不填假地址"
        },
        {
          "dependencyId": "SEC-01",
          "consumes": "管理账号开通、强认证、停用及紧急恢复规则",
          "contract": "doc/步骤一身份签名与可靠性设计.md §2；堡垒管理账号策略待冻结",
          "test": "用授权与停用测试管理账号各访问一次，比较拒绝和审计结果"
        }
      ],
      "integrationScenarios": [
        {
          "name": "静态演示入口与正式业务入口隔离",
          "setup": "授权隔离网络、外部用户与运维测试账号，保留现有静态Nginx配置副本，准备批准的银行测试目标",
          "steps": [
            "核对静态站点只提供文件，不将其Basic账号映射为业务身份",
            "按新入口矩阵访问内部路由、存储管理端口和批准银行目标",
            "由运维复核拒绝日志及配置版本"
          ],
          "assertions": [
            "外部用户不能进入内部业务或管理面",
            "仅批准业务目标可达",
            "不改动现有本机服务或宣称生产已部署"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "8台规划对应的设备、系统版本、机房机电验收和生产网络地址何时交付？",
          "owner": "机房基础设施负责人",
          "impact": "阻断生产配置落地和机房验收；不阻断参数模板与本机资产核对"
        },
        {
          "question": "银行正式白名单、双线路出口地址和证书信任链由谁最终签认？",
          "owner": "银行接入负责人",
          "impact": "阻断正式银行连通放行；不阻断未授权目标拒绝测试"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "platform",
      "before": {
        "personDays": 2.5,
        "baselinePersonDays": 5,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "SEC-01"
        ]
      },
      "review": "对照机房资源规划第27至43行，核对规划不等于实物交付、配置不含采购施工、单点不虚称全栈高可用；已退回删除临时容器健康观察。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "supplier-submit"
          ],
          "nodeIds": [
            "N01"
          ]
        },
        {
          "useCaseIds": [
            "supplier-submit",
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N01",
            "N16"
          ]
        },
        {
          "useCaseIds": [
            "supplier-submit"
          ],
          "nodeIds": [
            "N01"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "OPS-01-S1",
          "previousAction": "确认提供的机房计算网络资源和开发测试生产边界。",
          "currentIds": [
            "OPS-01-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "OPS-01-S2",
          "previousAction": "参数化应用网络、批准银行出口和最小管理入口。",
          "currentIds": [
            "OPS-01-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "OPS-01-S3",
          "previousAction": "验证隔离、端口和管理审计。",
          "currentIds": [
            "OPS-01-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "OPS-02": {
    "rationale": "现有MySQL和生成DDL可复用，生产应用部署与安全迁移尚需实施。",
    "steps": [
      {
        "personDays": 2,
        "action": "交付单体应用、数据库及独立运行账号的环境参数与部署模板。",
        "logic": "消费冻结的单体制品入口和DDL版本，区分业务MySQL、调度库及监控账号。应用不可用root，迁移账号与运行账号分离；数据库连接保持UTC和持久化要求。生产主从和多应用实例按规划配置，不照搬本机登录自启或给每个数据库实例重复分配96GiB。",
        "expected": "同一制品可注入不同环境配置，数据库账号权限可核查，应用会话和任务不依赖某台机器的本地状态。尚无应用制品时模板标明待交付项。",
        "test": "后续在隔离环境部署已交付的真实制品，核对有效配置和连接时区；用运行账号执行DDL、删除追加事实或访问调度库必须拒绝，合法事务可提交。本次不运行不存在的部署命令。"
      },
      {
        "personDays": 2.5,
        "action": "为领域及中间件设施分别建立存量预检和增量迁移步骤。",
        "logic": "以旧版本库快照、新schema及应用基础设施设计为输入，列出新增关务修订/请求、税务载荷和待实现确认/编号/恢复设施。先检查历史来源、NULL、唯一键冲突和触发器兼容，再备份及执行受审迁移；无真实旧证据保留缺项，不填0金额或假批准。001已含于新DDL时不重复执行。",
        "expected": "迁移清单说明适用版本、前置备份、校验、不可逆点和回退条件；失败不能清库重建，旧事件键、编号高水位和证据引用保持。",
        "test": "用带重复scope、缺旧修订和非法非空值的合成旧库先跑预检，应在写入前阻断并列出记录；修正后执行迁移，比较行数、摘要、事件键和高水位。检查新空库不重复执行001。"
      },
      {
        "personDays": 1.5,
        "action": "验证迁移中断、应用重启和旧新版本兼容并交接恢复步骤。",
        "logic": "把DDL的隐式提交与业务事务回滚分开处理，保留已执行迁移版本；主从切换先隔离旧主核对GTID和未决资金，不以从库查询替代主库原受理。应用回退只在兼容矩阵允许时进行，不回写业务状态。",
        "expected": "中断后能识别部分迁移并受控续作或恢复备份；应用恢复保留原业务号、任务号、确认结果与文件版本，未知付款不变成未执行。",
        "test": "在隔离旧库的某个DDL步骤后中止，按记录恢复，再重启两应用实例；比对迁移版本、数据和原任务。制造复制落后，确认禁止用落后从库生成付款重试或解锁结论。"
      }
    ],
    "risk": {
      "trigger": "确认需迁移真实存量且须并行核对",
      "extraDays": 3
    },
    "audit": {
      "id": "OPS-02",
      "status": "细化",
      "summary": "原export_trade为45表666列，最新47表702列只在隔离库验证；001迁移不能覆盖新关务税务及中间件设施。以部署和持久化共用支撑“供应商首次提交交易资料”，以关务税务存量迁移支撑“申请正式报关办理并查询原办理结果”和“申请提交退税材料并查询原办理结果”，以兼容恢复支撑“审批付款、锁定金额并确认供应商到账”；不直接实现这些领域命令。交付版本化迁移、存量预检及账号/多实例配置，不宣称已有可部署后端。",
      "sourceReferences": [
        {
          "path": "doc/sql/domain/README.md",
          "lineStart": 3,
          "lineEnd": 26,
          "reason": "原库与新设计差异、现有验证和001迁移的适用范围",
          "sha256": "0c72058df686d5a618d706f6a5004e68e32f430238113841a114952fd73bee41"
        },
        {
          "path": "doc/sql/domain/README.md",
          "lineStart": 30,
          "lineEnd": 42,
          "reason": "持久化参数、追加事实、未物理化中间件和存量迁移约束",
          "sha256": "0c72058df686d5a618d706f6a5004e68e32f430238113841a114952fd73bee41"
        },
        {
          "path": "doc/自建机房两年资源规划.md",
          "lineStart": 43,
          "lineEnd": 49,
          "reason": "各档数据库内存预算、异步主从、多实例应用和故障边界",
          "sha256": "c74bb466f37756920c856595fd02119d4960ae774d3cf5b3c913e998fcc11b41"
        }
      ],
      "useCaseIds": [
        "supplier-submit",
        "s4-filing",
        "s7-dispatch",
        "s5-n16-payment"
      ],
      "nodeIds": [
        "N01",
        "N09",
        "N21",
        "N16"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "单体制品形式、配置项、数据库版本、启动及回退兼容约定",
          "contract": "doc/步骤一身份签名与可靠性设计.md §1；应用构建入口和部署命令尚待真实后端交付冻结",
          "test": "制品摘要、配置清单和启动探针三者对照，不拿静态站点代替后端"
        },
        {
          "dependencyId": "OPS-01",
          "consumes": "目标节点、网段、管理入口和数据库存储配额",
          "contract": "doc/自建机房两年资源规划.md；OPS-01环境交接清单",
          "test": "确认部署目标属于正确环境且运行账号不能跨环境访问"
        },
        {
          "dependencyId": "DM-01",
          "consumes": "交易参与方、版本不变量及其DDL发布基线；其他领域新增设施由总集成清单汇入",
          "contract": "doc/sql/domain/schema.sql；doc/sql/domain/README.md；中间件增量DDL待单独冻结",
          "test": "记录DDL摘要，比较目标库版本；缺设施DDL时只验领域部分，不冒称完整迁移"
        }
      ],
      "integrationScenarios": [
        {
          "name": "旧45表向批准版本迁移失败后保留原请求",
          "setup": "隔离旧结构库、合成历史交易和未决原号任务、冲突scope数据，迁移与运行两个账号",
          "steps": [
            "执行迁移预检并记录阻断数据",
            "在修正后的副本执行迁移并模拟步骤中断",
            "按操作单恢复并重启应用查询原受理"
          ],
          "assertions": [
            "预检失败不改业务记录",
            "中断不自动DROP或TRUNCATE",
            "恢复后原号和事件保留，未知任务未被重付或无证解锁"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "编号、操作确认、文件恢复、受理和平台签名任务的物理DDL及真实应用制品何时冻结？",
          "owner": "后端技术负责人",
          "impact": "阻断完整应用部署及中间件迁移验收；不阻断领域DDL差异与存量预检设计"
        },
        {
          "question": "领域README一处称建库后已应用001，而原业务库又明确未迁移；001实际作用库及迁移登记应如何交接？",
          "owner": "数据库负责人",
          "impact": "阻断将001直接套用到任何既有库；不阻断新DDL隔离校验"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "platform",
      "before": {
        "personDays": 3,
        "baselinePersonDays": 6,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "OPS-01",
          "DM-01"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "supplier-submit"
          ],
          "nodeIds": [
            "N01"
          ]
        },
        {
          "useCaseIds": [
            "supplier-submit",
            "s4-filing",
            "s7-dispatch"
          ],
          "nodeIds": [
            "N01",
            "N09",
            "N21"
          ]
        },
        {
          "useCaseIds": [
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N16"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "OPS-02-S1",
          "previousAction": "参数化单体应用和数据库部署及最小账号。",
          "currentIds": [
            "OPS-02-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "OPS-02-S2",
          "previousAction": "建立增量迁移、备份前置和失败回退。",
          "currentIds": [
            "OPS-02-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "OPS-02-S3",
          "previousAction": "隔离环境验证事务、重启和迁移失败。",
          "currentIds": [
            "OPS-02-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "OPS-03": {
    "rationale": "本机XXL-JOB只是后台；一期优先单体内恢复，不追加Redis或消息队列。",
    "steps": [
      {
        "personDays": 1.5,
        "action": "实现同库持久任务、恢复扫描、租约与栅栏配置及运行入口。",
        "logic": "任务先持久化稳定原键、资源版本、阶段、attempt_count、next_attempt_at、lease_until和fencing_token，再在事务外处理I/O。文件/回执沿设计启动及每5秒扫描、60秒租约、20秒续租，先查完成结果再领取；失租旧栅栏不能提交。银行执行由资金模块持有原执行意图和授权，调度器只能触发受控处理。",
        "expected": "重启可继续原任务，多个应用实例只接受有效租约结果；无Redis、MQ或另设取号服务，XXL-JOB后台成功不产生付款成功。",
        "test": "在未来隔离实现中创建上传任务，取得租约后中止进程，等租约失效后让另一实例接管，再让旧实例提交；只接管者可推进，原对象键和文件号不变。此测试当前尚无生产worker可执行。"
      },
      {
        "personDays": 1.5,
        "action": "接入撤权检查、分类重试预算和失败待办。",
        "logic": "敏感请求及人工恢复读取持久授权，不以易失缓存决定权限。文件阶段采用设计的8次/24小时预算和稳定错误记录，不叠SDK重试；恶意内容、摘要冲突、持久403不重试。银行超时先原transaction_number查明，预算用银行冻结契约，不能沿文件预算重新付款。",
        "expected": "撤权用户不能恢复或下载；超限任务显示manual_action、最后错误和原任务引用。银行未知仍锁额，任务失败不产生明确未扣款结论。",
        "test": "给合成文件任务连续制造暂态失败至预算上限，重启后计数不清零；撤销原经办人会话后直接请求恢复应拒绝。另置银行任务未知，触发扫描只记录原号查询，不新增付款意图或释放金额。"
      },
      {
        "personDays": 1,
        "action": "交付重复调度、租约冲突与缓存丢失的运行验收。",
        "logic": "以同一任务的两次扫描、应用重启和空缓存为输入，核对完成结果与幂等键。若后续接XXL-JOB，只允许登记受控handler，不授予任意命令执行或直接资金写权限；调度数据库与业务数据库分开。",
        "expected": "重复触发可恢复同一结果，缓存清空不会忘记撤权或付款占用；运行人员可定位原任务、阶段、租约和错误，不靠新建任务绕过。",
        "test": "同时运行两个授权测试扫描器并重复触发同一任务，核对最终对象确切版本和业务事件只有一份；在付款未知时清空测试缓存再恢复，核对锁额不变、无新银行支付请求。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "OPS-03",
      "status": "细化",
      "summary": "XXL-JOB只有管理后台，没有执行器或已启用业务任务；5秒恢复扫描仍为单体待实现模块。将文件/回执有界重试、租约栅栏、原号恢复和会话撤销分开说明，银行任务不套用文件重试参数。所列用例仅为恢复设施的选定支撑场景。",
      "sourceReferences": [
        {
          "path": "doc/步骤一身份签名与可靠性设计.md",
          "lineStart": 73,
          "lineEnd": 94,
          "reason": "持久恢复、租约栅栏、文件预算与未知结果原则",
          "sha256": "c33cbc94bc4f3e1e1168d85b66554cd1c276e358fc8870d6139a0d4a1be8b84c"
        },
        {
          "path": "infra/local/README.md",
          "lineStart": 120,
          "lineEnd": 138,
          "reason": "调度后台无执行器，恢复及确认尚未实现",
          "sha256": "79e5697633ec8b2d27a9953c8506c49e49fdbfe9c129c66f13b0c3890d96b5a3"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 162,
          "lineEnd": 169,
          "reason": "银行原号恢复、未知保留锁额与到账分离",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        }
      ],
      "useCaseIds": [
        "supplier-submit",
        "s5-n16-payment"
      ],
      "nodeIds": [
        "N01",
        "N16"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "单体内恢复状态、租约栅栏、错误分级、银行任务由资金模块执行的边界",
          "contract": "doc/步骤一身份签名与可靠性设计.md §5；银行查询及重试预算待银行确认",
          "test": "按任务类型核对参数，禁止把8次文件恢复解释为8次付款"
        },
        {
          "dependencyId": "OPS-02",
          "consumes": "持久任务表迁移、事务连接和多实例运行配置",
          "contract": "doc/sql/domain/README.md §后续迁移建议；中间件表迁移版本待交付",
          "test": "重启后原键、计数和栅栏可读，缺表时启动明确报错"
        },
        {
          "dependencyId": "SEC-02",
          "consumes": "任务恢复、下载和执行的当前主体/对象/岗位授权策略",
          "contract": "doc/步骤一身份签名与可靠性设计.md §3.2；doc/步骤五系统用例与接口协议.md §2",
          "test": "撤权后直接调用原任务恢复被拒，不因原受理成功跳过授权"
        }
      ],
      "integrationScenarios": [
        {
          "name": "双实例恢复与银行未知并存",
          "setup": "两个应用测试实例、一份已扫描未写元数据文件任务、一笔银行结果未知的合成付款意图，不向真实银行付款",
          "steps": [
            "两实例竞争文件任务租约，令旧实例失租",
            "清空易失缓存并触发重复扫描",
            "由授权人员查看原付款任务并按冻结测试适配原号查询"
          ],
          "assertions": [
            "旧栅栏不能写元数据",
            "文件及原受理不重复",
            "银行未知锁额保留，扫描和调度不能直接付款"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "业务恢复handler、基础设施表及银行查单预算尚未交付，是否保留仅进程内扫描作为一期运行方式？",
          "owner": "后端技术负责人",
          "impact": "阻断恢复设施运行验收；不阻断现有XXL-JOB管理台可达性核对"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "platform",
      "before": {
        "personDays": 2,
        "baselinePersonDays": 4,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "OPS-02",
          "SEC-02"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "supplier-submit"
          ],
          "nodeIds": [
            "N01"
          ]
        },
        {
          "useCaseIds": [
            "supplier-submit",
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N01",
            "N16"
          ]
        },
        {
          "useCaseIds": [
            "supplier-submit",
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N01",
            "N16"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "OPS-03-S1",
          "previousAction": "实现数据库持久任务、租约及进程内恢复扫描。",
          "currentIds": [
            "OPS-03-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "OPS-03-S2",
          "previousAction": "连接会话撤销、限重试和失败待办。",
          "currentIds": [
            "OPS-03-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "OPS-03-S3",
          "previousAction": "验证重复执行、租约过期与重启。",
          "currentIds": [
            "OPS-03-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "OPS-04": {
    "rationale": "RustFS、ClamAV和私有桶验证可复用；生产加密访问、权限和留存仍须配置。",
    "steps": [
      {
        "personDays": 2,
        "action": "参数化生产私有存储、扫描连接和分权凭据设施。",
        "logic": "以环境地址、TLS信任、三桶名及应用最小策略为输入，将管理员初始化、应用读写、备份和密钥管理分开。浏览器不接收管理员密钥；扫描使用ClamAV INSTREAM，不伪造HTTP服务。前端来源冻结后限制CORS，不能允许任意来源。HSM/KMS接入形式由安全方案冻结，不将本机私有文件目录称合规托管。",
        "expected": "应用仅能读写获准对象和暂存清理，不能管理桶、删除正式历史版本或绕过留存；扫描不可用返回明确失败，密钥值不进入制品。",
        "test": "用测试应用凭据尝试管理桶、跨用途读取和删除正式版本，应拒绝；验证TLS信任失败时不降级HTTP。浏览器网络响应和配置只出现短期受控能力，不含管理员秘密。"
      },
      {
        "personDays": 2.5,
        "action": "落实条件写、确切版本、隔离区及逐对象留存配置。",
        "logic": "固定暂存和最终键，写入使用If-None-Match: *，保存返回的VersionId、SHA-256和长度；读取同一真实版本扫描后才复制到最终区，元数据提交后才可引用。按批准用途和保留策略设置对象锁模式及期限；无策略保留待确认，不能把开启Object Lock当作已锁定。",
        "expected": "重传不覆盖旧对象，失败或未知扫描对象不能成为ready。历史书面确认引用确切文件版，但是否本人授权、批准版本匹配仍交业务授权门禁判断。",
        "test": "对同键上传两份不同字节确认条件冲突，按旧VersionId读取摘要不变；分别核对对象实际保留模式和到期值。将另一申报版的干净文件作为书面确认输入，应由业务门禁拒绝，不因扫描通过放行。"
      },
      {
        "personDays": 1.5,
        "action": "验证扫描失败关闭、无权读取和确切历史版本恢复。",
        "logic": "覆盖干净、检测样本、25MiB流上限、解压超限、过旧病毒库、超时和服务不可用；这些结果分别记为拒绝或待处理，不能默认clean。恢复仅验证批准备份中的确切版本及引用，不操作现有业务桶或删除卷。",
        "expected": "故障时文件确认受阻，恢复后VersionId映射和字节摘要可追溯；恢复不把孤立最终对象直接升级为业务已受理。",
        "test": "在独立测试设施注入扫描超时与过旧库结果，检查ready及业务事件均未产生；恢复一份被新版本覆盖但仍被引用的旧版，比对摘要和元数据。无权主体即使知道对象键也读不到内容。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "OPS-04",
      "status": "细化",
      "summary": "RustFS、私有桶和ClamAV的本机配置仅为验证资产，生产存储、扫描和密钥设施须独立交付。HTTP配置、可被管理员绕过的治理锁及本机凭据不构成生产保全。落实TLS及最小账号、确切版本与扫描同字节、批准留存及密钥设施交接。文件可引用不等于供应商书面确认、合同真实或银行事实。",
      "sourceReferences": [
        {
          "path": "infra/local/README.md",
          "lineStart": 24,
          "lineEnd": 53,
          "reason": "本机HTTP、三桶权限、治理锁、VersionId和扫描边界",
          "sha256": "79e5697633ec8b2d27a9953c8506c49e49fdbfe9c129c66f13b0c3890d96b5a3"
        },
        {
          "path": "infra/local/clamd.conf",
          "lineStart": 6,
          "lineEnd": 20,
          "reason": "INSTREAM端口及扫描大小、解压和递归边界",
          "sha256": "9fa0df19af9f870b9dd772e87bec34686e42f36d4fb9af3d317d4e19fa2489ed"
        },
        {
          "path": "doc/步骤四系统用例与接口协议.md",
          "lineStart": 51,
          "lineEnd": 54,
          "reason": "供应商书面确认绑定确切批准版，不能用技术确认或扫描代替",
          "sha256": "eaf6e283e192ee40ef03978d2fb4945853c01d1713eba11df41922b47a544d69"
        }
      ],
      "useCaseIds": [
        "supplier-submit",
        "payer-submit",
        "s4-confirm"
      ],
      "nodeIds": [
        "N01",
        "N08"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "文件用途、原件及证据保留、TLS、密钥托管和扫描失败策略",
          "contract": "doc/步骤一身份签名与可靠性设计.md §5；infra/local/README.md §S3桶及文件约束；生产留存期限及模式待批准",
          "test": "用用途逐项映射桶策略与对象实际留存属性，不接受只截取开关截图"
        },
        {
          "dependencyId": "OPS-01",
          "consumes": "存储/扫描节点、内网地址、证书分发和管理隔离",
          "contract": "doc/自建机房两年资源规划.md；OPS-01网络配置交接清单",
          "test": "业务入口不能访问管理端口，应用节点仅能连接获准数据端口"
        }
      ],
      "integrationScenarios": [
        {
          "name": "报关书面确认文件扫描成功但绑定错误",
          "setup": "隔离S3和扫描实例，供应商授权确认人，申报r1和r2各一份原创合成文件，独审只批准r2",
          "steps": [
            "按确切版本上传并扫描r1文件",
            "以r1文件申请确认r2，检查业务拒绝",
            "上传r2匹配文件并在扫描故障时再次确认"
          ],
          "assertions": [
            "干净文件不能跨版证明书面同意",
            "扫描未知不能成为ready",
            "旧VersionId和摘要保留，正式办理未推进"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "生产存储实现、文件系统兼容、批准留存模式/期限和管理员独立保全要求尚未签认。",
          "owner": "数据保护与证据保全负责人",
          "impact": "阻断生产原件及法律证据保全验收；不阻断本机治理锁能力复核"
        },
        {
          "question": "生产HSM/KMS及密钥管理员、备份保管岗位如何分工？",
          "owner": "信息安全负责人",
          "impact": "阻断生产密钥托管落地；不阻断接口参数及用途分权设计"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "platform",
      "before": {
        "personDays": 3,
        "baselinePersonDays": 6,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "OPS-01"
        ]
      },
      "review": "对照平台分组的生产证据保全与密钥交付边界，留存模式、期限和管理员分权未冻结时明确阻断，不把本机存储能力当生产验收。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit"
          ],
          "nodeIds": [
            "N01"
          ]
        },
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit",
            "s4-confirm"
          ],
          "nodeIds": [
            "N01",
            "N08"
          ]
        },
        {
          "useCaseIds": [
            "supplier-submit",
            "s4-confirm"
          ],
          "nodeIds": [
            "N01",
            "N08"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "OPS-04-S1",
          "previousAction": "参数化私有存储、扫描及最小应用账号。",
          "currentIds": [
            "OPS-04-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "OPS-04-S2",
          "previousAction": "配置加密访问、确切版本、隔离及批准保留策略。",
          "currentIds": [
            "OPS-04-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "OPS-04-S3",
          "previousAction": "验证扫描故障、无权读取和确切版本恢复。",
          "currentIds": [
            "OPS-04-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "OPS-05": {
    "rationale": "仓库尚无生产发布流水线；采用成熟构建能力，不重复写依赖扫描引擎。",
    "steps": [
      {
        "personDays": 2,
        "action": "建立内部构建和按真实入口执行的检查流水线。",
        "logic": "消费代码构建入口、锁定依赖、DDL摘要与SEC-04规则；已有node doc/sql/domain/generate.cjs --check可作为设计产物漂移检查，数据库验证必须指定批准隔离库。真实后端测试命令由制品交付时登记，不将文档cURL当自动验收。依赖获取和扫描按内部许可执行，不上传代码、单证或秘密至第三方扫描服务。",
        "expected": "构建记录可追溯提交、依赖、检查结果和制品摘要，任何必需检查失败阻断提升。设计产物检查通过不能变为业务端到端通过。",
        "test": "在流水线测试分支引入生成漂移和一个真实失败测试，确认各自阻断；核查执行器网络与日志无外传单证。后端入口尚缺时该阶段明确未通过，不用空测试代替。"
      },
      {
        "personDays": 2,
        "action": "实现制品完整性签认、环境参数分离和双人发布审批。",
        "logic": "构建产物只生成一次并记录摘要和签名，部署使用批准信任材料验签；密钥从受控设施调用，不打包配置秘密。按开发测试生产提升相同制品；提交人不能兼任最终发布批准人。签名、审批、环境和数据库兼容版绑定，不以重打包伪装相同版本。",
        "expected": "合法审批后同一签名制品逐环境发布，篡改、单人审批和不兼容迁移被拒；发布证据不包含密钥或实际单证。",
        "test": "对测试制品改变一个字节再验签应拒绝；同人申请并审批应阻断。合法两人审批后比对各环境摘要与参数来源，确认环境差异没有改变制品字节。"
      },
      {
        "personDays": 2,
        "action": "演练逐台摘流发布、兼容失败和应用回退。",
        "logic": "使用OPS-02迁移/兼容矩阵和批准健康判据，先备份再执行需迁移的发布；应用逐台摘流，不能以进程存活替代业务读写检查。回退应用不擅自回滚已核实外部事实，不在不兼容DDL上启动旧版本；无法安全回退时停止发布并按批准恢复方案处置。",
        "expected": "失败发布有清楚停点、责任人和原制品恢复步骤，持久任务沿原号接管。付款、暂停及审批历史不因回退被改写。",
        "test": "在隔离环境发布一个启动正常但业务探针失败的测试版本，按操作单回退；比对未决任务、原受理、数据库版本和事件数量。再给不兼容DDL组合，确认提升在执行前被拒绝。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "OPS-05",
      "status": "细化",
      "summary": "现有Nginx是静态交付配置，不能作为业务后端发布入口。以内部构建、制品验签和双人发布共用支撑“供应商首次提交交易资料”，以兼容回退和原任务保留支撑“审批付款、锁定金额并确认供应商到账”；不直接实现提交或付款业务。现有生成检查可复用，真实后端命令由制品交付时登记，不虚构npm测试或生产发布命令。",
      "sourceReferences": [
        {
          "path": "deploy/nginx.conf",
          "lineStart": 1,
          "lineEnd": 28,
          "reason": "当前部署仅静态内容与Basic认证",
          "sha256": "1a0b649b871eb7f69a608824d97dd1c4b795664c4c5d31dd84280430bd33d091"
        },
        {
          "path": "doc/sql/domain/README.md",
          "lineStart": 14,
          "lineEnd": 26,
          "reason": "真实生成检查入口、隔离库验证与禁止清库",
          "sha256": "0c72058df686d5a618d706f6a5004e68e32f430238113841a114952fd73bee41"
        },
        {
          "path": "infra/local/README.md",
          "lineStart": 134,
          "lineEnd": 138,
          "reason": "生产应用及签名设施仍待实现，不能复用本机脚本冒称发布",
          "sha256": "79e5697633ec8b2d27a9953c8506c49e49fdbfe9c129c66f13b0c3890d96b5a3"
        }
      ],
      "useCaseIds": [
        "supplier-submit",
        "s5-n16-payment"
      ],
      "nodeIds": [
        "N01",
        "N16"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "内部流水线执行环境、制品格式、发布审批岗位、验签信任及回退判据",
          "contract": "真实后端仓内构建/测试入口与制品格式待冻结；现有deploy/nginx.conf只供静态站点",
          "test": "逐条核查入口文件存在及副作用，缺入口不拼造命令"
        },
        {
          "dependencyId": "OPS-02",
          "consumes": "部署模板、迁移版本、预检、备份和旧新应用兼容矩阵",
          "contract": "doc/sql/domain/README.md §后续迁移建议；OPS-02交付的版本化操作单",
          "test": "同一测试制品在目标数据库版运行，兼容矩阵未覆盖则阻断"
        },
        {
          "dependencyId": "SEC-04",
          "consumes": "内部依赖校验、输入边界回归和制品秘密排除规则",
          "contract": "SEC-04批准扫描规则与例外流程待交付；infra/local/README.md凭据与持久化边界",
          "test": "使用合成秘密和违规依赖夹具验证失败门禁，无真实秘密入库"
        }
      ],
      "integrationScenarios": [
        {
          "name": "单人审批或制品篡改导致发布被拒",
          "setup": "内部隔离执行器、发布申请人与独立批准人、两份只差一字节的测试制品、兼容数据库副本",
          "steps": [
            "申请人尝试自行批准",
            "独立批准人批准后替换制品字节",
            "恢复合法制品并模拟业务探针失败，按旧版操作单回退"
          ],
          "assertions": [
            "前两次无生产提升动作",
            "回退使用原摘要和受支持数据库版",
            "无清库、改状态或重复资金执行"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "内部流水线平台、真实后端构建/测试入口、制品签名实现和批准人名单尚未确定。",
          "owner": "研发效能与发布负责人",
          "impact": "阻断业务流水线运行和发布验收；不阻断既有文档生成检查的接入设计"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "platform",
      "before": {
        "personDays": 3,
        "baselinePersonDays": 6,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "OPS-02",
          "SEC-04"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "supplier-submit"
          ],
          "nodeIds": [
            "N01"
          ]
        },
        {
          "useCaseIds": [
            "supplier-submit"
          ],
          "nodeIds": [
            "N01"
          ]
        },
        {
          "useCaseIds": [
            "supplier-submit",
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N01",
            "N16"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "OPS-05-S1",
          "previousAction": "搭建内部构建、单元集成测试及依赖校验。",
          "currentIds": [
            "OPS-05-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "OPS-05-S2",
          "previousAction": "实现制品签名、环境参数及双人发布审批。",
          "currentIds": [
            "OPS-05-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "OPS-05-S3",
          "previousAction": "演练发布失败、数据库兼容和应用回退。",
          "currentIds": [
            "OPS-05-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "OPS-06": {
    "rationale": "现有日志监控栈可复用；仍缺业务指标、跨文件数据库备份与恢复演练。",
    "steps": [
      {
        "personDays": 3,
        "action": "接入源头脱敏日志、资金重算异常和真实告警接收。",
        "logic": "消费FIN-09三位置/占用/账务独立重算结果和稳定请求号，仅输出授权可见的差异代码、任务号及版本。补充数据库复制/主机资源、业务未知任务和资金差异规则，阈值由业务与运维签认，不用端口up证明成功。运维告警渠道单列审批，不扩展一期面向客户的短信邮件业务通知。",
        "expected": "资金不符即使端口正常也能触发待办和批准值守通道；规则关联原任务，不写完整账号、密钥或回执正文。通知投递失败自身可见。",
        "test": "在隔离演练中保持HTTP探针成功并制造一笔合成重算差异，检查告警接收、分派及解除记录；再断开批准告警接收端确认失败可见。检索合成敏感标记无原值；设施探测结果不能替代该业务告警及接管测试。"
      },
      {
        "personDays": 3,
        "action": "制定并验证数据库、确切对象版本及任务记录的一致备份恢复。",
        "logic": "备份清单包括业务库、必要审计/确认/原受理、任务租约状态、文件版本及摘要映射、密钥版本引用、调度配置和恢复所需日志。使用独立账号、加密及批准离线/不可变副本；记录备份点与binlog边界，不把本机卷、RAID或从库称备份。恢复前隔离执行出口，核对原号高水位和外部未决事实。",
        "expected": "隔离恢复后业务引用指向可读取的确切文件版，证据链和未决任务一致，测得恢复时长与数据差距；未批准RPO/RTO不填承诺值。",
        "test": "用合成交易、旧文件版和未决原号任务制作批准备份，恢复到独立环境，逐项比对行数、版本摘要、高水位和任务号；缺任一历史文件版时验收失败，不自动改为latest。"
      },
      {
        "personDays": 2,
        "action": "由值守人员演练未知银行任务接管及恢复后重算。",
        "logic": "先核对恢复库与银行受控事实，未查明扣款的任务继续锁额并沿原transaction_number查单；银行扣款不替代供应商到账证据。资金差异交原域独立复核，值守不能手改余额、取消锁额或把任务失败改为明确未扣款。",
        "expected": "值守交接包含告警确认、原号查单、证据核实和升级责任；恢复后无重复支付，受限/可用/付款锁额与账务可勾稽。",
        "test": "安排非编写者按操作单处理一笔恢复前已发出但结果未知的合成任务，测试适配返回未知、明确扣款两种分支；前者锁额保留，后者按真实扣款证据推进但供应商到账仍待独立核对。比较支付调用和原事件数。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "OPS-06",
      "status": "细化",
      "summary": "本机监控配置仅为验证资产，其告警规则覆盖抓取、探测和日志丢弃，Alertmanager配置仅含本机UI接收方。生产须独立交付业务MySQL/主机/资金指标、真实值守通知和一致恢复证据；补齐业务告警、数据库与文件确切版备份、未知银行接管及值守交接，恢复指标须实测。",
      "sourceReferences": [
        {
          "path": "infra/local/observability/alerts.yml",
          "lineStart": 1,
          "lineEnd": 24,
          "reason": "现有三条设施告警，没有资金业务规则",
          "sha256": "32fb89004805eb529be486adfade453717d5707bd84b58207e22351ab857ab52"
        },
        {
          "path": "infra/local/observability/alertmanager.yml",
          "lineStart": 1,
          "lineEnd": 9,
          "reason": "唯一receiver是local-ui，尚无真实通知",
          "sha256": "6288cbb0cc8ff28a0d3f852e9925c61016f0862633d768bf07793b1f86474067"
        },
        {
          "path": "infra/local/README.md",
          "lineStart": 104,
          "lineEnd": 122,
          "reason": "本机监控配置范围、日志保留、业务监控缺口和调度边界",
          "sha256": "79e5697633ec8b2d27a9953c8506c49e49fdbfe9c129c66f13b0c3890d96b5a3"
        },
        {
          "path": "doc/自建机房两年资源规划.md",
          "lineStart": 19,
          "lineEnd": 19,
          "reason": "独立账号、加密、不可变或离线备份及恢复演练不可省略",
          "sha256": "c74bb466f37756920c856595fd02119d4960ae774d3cf5b3c913e998fcc11b41"
        },
        {
          "path": "doc/自建机房两年资源规划.md",
          "lineStart": 47,
          "lineEnd": 49,
          "reason": "异步主从和单点恢复边界，RPO/RTO须业务确认并实测",
          "sha256": "c74bb466f37756920c856595fd02119d4960ae774d3cf5b3c913e998fcc11b41"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 162,
          "lineEnd": 169,
          "reason": "付款未知不解锁，扣款和供应商到账分别核实",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        }
      ],
      "useCaseIds": [
        "s5-n16-payment",
        "s5-n17-reconciliation"
      ],
      "nodeIds": [
        "N16",
        "N17"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "恢复优先级、备份点定义、值守职责及待批准RPO/RTO",
          "contract": "doc/自建机房两年资源规划.md §硬件布局与故障边界；备份周期及通知渠道待冻结",
          "test": "确认有业务签认与演练实测，不能拿复制延迟初始阈值当RPO"
        },
        {
          "dependencyId": "OPS-03",
          "consumes": "任务原键、阶段、租约栅栏、预算及人工恢复入口",
          "contract": "doc/步骤一身份签名与可靠性设计.md §5",
          "test": "恢复后计数不归零，原号及阶段可解释"
        },
        {
          "dependencyId": "OPS-04",
          "consumes": "确切VersionId、SHA-256、留存及备份读取账号",
          "contract": "infra/local/README.md §S3桶及文件约束",
          "test": "从备份读取被业务引用的历史版本并比对字节摘要"
        },
        {
          "dependencyId": "OPS-05",
          "consumes": "可恢复签名制品、环境参数和发布回退操作单",
          "contract": "OPS-05制品清单与兼容矩阵待交付",
          "test": "独立恢复节点验签并核对数据库兼容版"
        },
        {
          "dependencyId": "FIN-09",
          "consumes": "三位置、账务和占用独立重算的差异代码、对象范围与原执行引用",
          "contract": "doc/步骤五系统用例与接口协议.md；业务指标字段和告警阈值待与资金负责人冻结",
          "test": "提供一份平衡和一份不平衡合成结果，分别不报警和产生可关联告警"
        }
      ],
      "integrationScenarios": [
        {
          "name": "设施健康但恢复后资金重算不平",
          "setup": "隔离恢复环境、值守和独立资金复核员、合成付款未知任务、精确文件版备份与不平重算样例",
          "steps": [
            "保持探针健康，注入独立重算差异",
            "值守接收告警，核对恢复点和原号查单",
            "在补齐确切证据前尝试解除锁额"
          ],
          "assertions": [
            "告警经真实批准渠道到达，非仅UI",
            "未知未查明时锁额不动且无新付款",
            "业务证据与确切版本一致才允许原域处置"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "一期运维外部告警使用何种批准渠道，谁值守，业务可接受的RPO/RTO及备份保留周期是什么？",
          "owner": "生产运维负责人",
          "impact": "阻断试运行值守签认及恢复目标验收；不阻断现有设施指标核对"
        },
        {
          "question": "银行原号查单、灾备后对账和供应商到账独立核实渠道尚待银行确认。",
          "owner": "资金运营与银行接入负责人",
          "impact": "阻断真实银行灾备接管通过结论；不阻断合成未知锁额保持测试"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "platform",
      "before": {
        "personDays": 4,
        "baselinePersonDays": 8,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "OPS-03",
          "OPS-04",
          "OPS-05",
          "FIN-09"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s5-n17-reconciliation"
          ],
          "nodeIds": [
            "N17"
          ]
        },
        {
          "useCaseIds": [
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N16"
          ]
        },
        {
          "useCaseIds": [
            "s5-n16-payment",
            "s5-n17-reconciliation"
          ],
          "nodeIds": [
            "N16",
            "N17"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "OPS-06-S1",
          "previousAction": "接入脱敏应用日志、业务指标和资金异常规则。",
          "currentIds": [
            "OPS-06-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "OPS-06-S2",
          "previousAction": "配置数据库、文件确切版本及任务记录一致恢复。",
          "currentIds": [
            "OPS-06-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "OPS-06-S3",
          "previousAction": "演练恢复与未决银行任务接管，移交值守。",
          "currentIds": [
            "OPS-06-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "OPS-07": {
    "rationale": "第二期保留原8人日，新增出口配置而非重建机房。",
    "steps": [
      {
        "personDays": 3,
        "action": "按签署、物流和通知分别配置最小出口、回调入口及证书。",
        "logic": "消费DES-2冻结的渠道目录、测试环境、厂商TLS/回调认证与数据字段；按渠道独立配置凭据、出口、证书和接收方。未批准渠道关闭，不复用银行证书或让通知账户读取签署原件；厂商真实协议未确认时只交参数模板，不填臆造域名和签名头。",
        "expected": "每渠道具备单独启停和版本化配置；二期物流或通知技术成功不改变银行权威或官方放行事实。",
        "test": "在后续渠道测试环境逐个验证正确和错误证书/目标组合，错误组合不可达或认证失败；合法签署任务仍绑定原clientReference，物流主体须有真实委托。当前不部署任何渠道。"
      },
      {
        "personDays": 2.5,
        "action": "接入各渠道限流、恢复可观测字段和通知失败待办。",
        "logic": "按厂商确认的频率和Retry-After运行，不把设计默认当供应商承诺；记录providerCode、原引用、阶段、错误码、延迟和剩余预算，不记签署短期URL或回执正文。通知接收、投递和实际业务完成分别观察；失败留待办，不以无限重发掩盖。",
        "expected": "可以定位签署归档停滞、物流回调失败和通知投递失败，通道故障不会阻断独立银行结果接收，也不产生已签、已收货等虚假事实。",
        "test": "由INT-05/06/07提供冻结测试适配，分别返回限流、重复物流通知和通知不可达；核对按渠道退避、唯一事件和失败待办，日志中无签署URL或敏感正文。"
      },
      {
        "personDays": 2.5,
        "action": "演练逐渠道停用、原号接管和一期受控人工回退。",
        "logic": "停止新发起与自动推进，保留所有未决原号和已核实证据；人工签署/物流办理继续遵守确切版本、独立核实和授权。旧版签署真实结果隔离归档并交法律处置，不能推进新版也不能直接删弃。通知失败不改变合同、物流或资金状态。",
        "expected": "一个渠道故障不扩散到其他渠道，已有资金位置保持；未决任务不换号，人工路径保留核实人和证据。",
        "test": "在测试适配中先发出签署任务再断链，停用新发起后送达旧版合法结果；检查隔离归档及告警，合同新版本未生效。另模拟物流和通知故障，人工仅登记待核凭据，原资金三位置不变。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "OPS-07",
      "status": "细化",
      "summary": "二期仅新增签署、首家物流和短信邮件业务通知的渠道运行配置，不扩大到关税务。配置开工依赖冻结渠道契约，而非适配包全部完成；移除三个适配完成的开工依赖，联调仍列必需交付。晚到旧版签署证据需隔离保留，不能因停用通道抹去法律事实。",
      "sourceReferences": [
        {
          "path": "doc/步骤二系统用例与接口协议.md",
          "lineStart": 37,
          "lineEnd": 50,
          "reason": "厂商协议待选型、原任务查单、回调归档和旧版证据处置",
          "sha256": "309fb3369cd0cde8dcda7f2b1878fd1cb1518505439e5d38b418ce419fd98102"
        },
        {
          "path": "doc/步骤三系统用例与接口协议.md",
          "lineStart": 9,
          "lineEnd": 17,
          "reason": "物流委托、凭据独立核实及人工路径边界",
          "sha256": "bed3e39150278fba4db2d78386f6de645a89f8c0dd863ef28e37254b5400d339"
        },
        {
          "path": "infra/local/README.md",
          "lineStart": 116,
          "lineEnd": 120,
          "reason": "尚无外部通知和真实业务执行器，不能冒称已接入",
          "sha256": "79e5697633ec8b2d27a9953c8506c49e49fdbfe9c129c66f13b0c3890d96b5a3"
        }
      ],
      "useCaseIds": [
        "contract-sign",
        "contract-activate",
        "booking-pickup",
        "transport-progress",
        "logistics-exception"
      ],
      "nodeIds": [
        "N02",
        "N03",
        "N04",
        "N06",
        "N10"
      ],
      "inputs": [
        {
          "dependencyId": "DES-2",
          "consumes": "正式选择的签署物流通知渠道、出口/证书、回调认证、限流和最小字段契约",
          "contract": "doc/步骤二系统用例与接口协议.md §3；物流与通知厂商真实契约待冻结。INT-05/06/07提供联调适配及回执样例，不以其整包完成作为配置开工前提",
          "test": "渠道名称、环境、签名规范和样例由接入负责人签认，缺一项不启用"
        },
        {
          "dependencyId": "OPS-06",
          "consumes": "现有值守告警、备份恢复和原号任务操作单",
          "contract": "OPS-06试运行交接清单；infra/local/README.md监控日志调度边界",
          "test": "新通道告警能交到原值守，恢复仍查原号"
        }
      ],
      "integrationScenarios": [
        {
          "name": "停用电子签通道后到达旧版签署测试结果",
          "setup": "最终验收须接入INT-05实际可运行签署适配制品及获准供应商测试环境，记录制品版本和运行配置；合同r1已发原clientReference，r2待重审，独立运维和合同核实人员；测试证据不充当正式法律签署",
          "steps": [
            "用INT-05制品发起并查询原任务，停止通道新发起",
            "经供应商测试回调和实际适配处理r1合法晚到结果及重复通知",
            "人工核实原任务并演练隔离证据交接，再查看r2及资金"
          ],
          "assertions": [
            "原任务只归档一次，旧测试证据保留且可追溯",
            "r2不因r1通知生效",
            "银行状态和三位置不变；仅检查配置模板或模拟结果不得签认INT-05渠道最终验收"
          ]
        },
        {
          "name": "物流与业务通知独立故障接管",
          "setup": "最终验收须接入INT-06首家物流适配、INT-07短信邮件通知的实际可运行制品及各自获准渠道测试环境，记录版本；准备有委托的合成批次、批准测试接收方和独立物流核实员",
          "steps": [
            "通过INT-06接收重复运输事件并注入断链，查询原事件及恢复待办",
            "通过INT-07分别向批准测试接收方发送短信和邮件并留存渠道投递结果，再制造失败与停用",
            "按一期操作单人工接管，并核对物流核实记录及资金位置"
          ],
          "assertions": [
            "物流重复事件不重复推进，断链沿原事件恢复且待独立核实",
            "短信邮件投递和失败待办可观察，通知不替代业务签收",
            "已核实资金不变；INT-06或INT-07缺可运行制品或真实批准测试渠道时相应最终验收阻断，不能仅测模板"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "签署、首家物流、短信邮件供应商的端点、证书、回调验签、速率和停用后的查单能力尚未正式确认。",
          "owner": "外部渠道集成负责人",
          "impact": "阻断真实渠道启用和故障联调；不阻断隔离模板及人工操作单设计"
        },
        {
          "question": "适配包完成应作为联调关口而非配置开工条件，建议总Agent同步调整实施排序。",
          "owner": "项目交付负责人",
          "impact": "仅调整开工依赖，不缩减INT-05/06/07联调或验收内容"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": [
          "INT-05",
          "INT-06",
          "INT-07"
        ]
      },
      "agent": "platform",
      "before": {
        "personDays": 4,
        "baselinePersonDays": 8,
        "subtaskCount": 3,
        "dependencies": [
          "DES-2",
          "OPS-06",
          "INT-05",
          "INT-06",
          "INT-07"
        ]
      },
      "review": "复核移除渠道适配作为配置开工前置的建议；要求最终验收必须使用签署、物流和通知的实际可运行制品，已由原Agent补齐，配置模板检查不替代渠道联调。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "contract-sign",
            "booking-pickup"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04",
            "N06"
          ]
        },
        {
          "useCaseIds": [
            "contract-sign",
            "transport-progress",
            "logistics-exception"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04",
            "N10"
          ]
        },
        {
          "useCaseIds": [
            "contract-sign",
            "contract-activate",
            "transport-progress"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04",
            "N10"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "OPS-07-S1",
          "previousAction": "配置签署物流通知最小出口及证书。",
          "currentIds": [
            "OPS-07-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "OPS-07-S2",
          "previousAction": "设置限流、告警和可观测字段。",
          "currentIds": [
            "OPS-07-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "OPS-07-S3",
          "previousAction": "演练停用和一期人工接管。",
          "currentIds": [
            "OPS-07-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "OPS-08": {
    "rationale": "第三期保留原10人日，官方通道许可先满足。",
    "steps": [
      {
        "personDays": 3.5,
        "action": "按官方办理和授权查询分别配置受控任务、企业证书与限流。",
        "logic": "输入DES-3确认的主管渠道、企业授权、证书用途、查询许可和真实协议；为不同企业/用途分离凭据、出口和预算，任务使用原request_number或dispatch号，沿用应用持久任务设施。读取许可不能授予申报权限，官方证书有效不能替代企业授权。",
        "expected": "未授权企业、渠道或用途不启用；查询缓存按企业和许可范围隔离，结果标示来源和观察时刻。无正式渠道时仅允许受控备料，不产生官方成功。",
        "test": "用隔离测试配置交换企业证书和查询/办理用途，检查拒绝；给同一原任务重复触发，原号保持且无新增办理。需要真实INT-08/09/10适配交付后执行，不虚构主管URL。"
      },
      {
        "personDays": 3.5,
        "action": "测量批准查询负载、扫描排队和官方任务恢复。",
        "logic": "依据已确认300单/日、单笔文件及30请求模型构造样本，另列查询、登录、上传和恢复任务是否已计入，不能把规划6.25RPS当服务等级承诺。按渠道允许速率测p95、错误、排队和资源水位；故障恢复前隔离新执行，原号查明后才继续，不把限流或超时当明确未提交。",
        "expected": "形成注明负载构成、渠道限制和瓶颈的实测记录，恢复后无重复官方提交；未接渠道的容量及成功结论明确未验证。",
        "test": "在获准的模拟/主管测试环境按批准负载执行授权查询，记录延迟和限流；在一份已发未知任务处中断并从备份恢复，核对只原号查询、外部提交计数不增加、未知门禁仍在。"
      },
      {
        "personDays": 3,
        "action": "交接主管证书更新、故障接管和跨域来源恢复。",
        "logic": "保留企业/渠道/证书版本、原请求、确切提交版、官方回执及归档文件映射；轮换后新请求用新证书，历史按原来源核验。主管故障走受控人工办理及独立核实，不凭截图或通知生成放行、签发或批准，退税批准不当成供应商到账。",
        "expected": "值守可定位原来源链、停用新请求并升级到对应主管渠道负责人；恢复不改已执行事实、资金位置或结案条件。",
        "test": "由非编写者轮换测试证书，模拟官方查询不可达后沿原任务接管；检查旧回执仍可追溯，新请求只用新许可，缺正式证据时保持待核/未知且不能正常结案。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "OPS-08",
      "status": "细化",
      "summary": "三期官方渠道、授权查询没有真实生产端点和容量验收结果。按批准负载和渠道频率测量，不增加臆造SLA；官方任务沿用同库原号恢复，不新建消息队列。移除官方适配整包完成的开工依赖，配置消费DES-3冻结契约，真实联调仍需INT-08/09/10制品。",
      "sourceReferences": [
        {
          "path": "doc/步骤四系统用例与接口协议.md",
          "lineStart": 49,
          "lineEnd": 57,
          "reason": "正式授权、原办理号、官方证据和真实成功边界",
          "sha256": "eaf6e283e192ee40ef03978d2fb4945853c01d1713eba11df41922b47a544d69"
        },
        {
          "path": "doc/步骤六系统用例与接口协议.md",
          "lineStart": 5,
          "lineEnd": 7,
          "reason": "主管职责、范围、渠道待确认，不能伪造办理成功",
          "sha256": "c80e0ceb5b024eacc205546ce30739d4118ec98c8ffcc6bd960584142b91d409"
        },
        {
          "path": "doc/步骤七系统用例与接口协议.md",
          "lineStart": 35,
          "lineEnd": 43,
          "reason": "税务不证明到账，事务外I/O、原号恢复和授权门禁",
          "sha256": "8b9b0d38e55742d3a1f3de0654513e94ace510722685acdfbc2ea6bea6fc41ab"
        },
        {
          "path": "doc/自建机房两年资源规划.md",
          "lineStart": 19,
          "lineEnd": 23,
          "reason": "请求与文件负载是假设，需补测查询及后台负载",
          "sha256": "c74bb466f37756920c856595fd02119d4960ae774d3cf5b3c913e998fcc11b41"
        },
        {
          "path": "doc/自建机房两年资源规划.md",
          "lineStart": 47,
          "lineEnd": 49,
          "reason": "主从及单点恢复边界，RPO/RTO须业务确认并实测",
          "sha256": "c74bb466f37756920c856595fd02119d4960ae774d3cf5b3c913e998fcc11b41"
        },
        {
          "path": "doc/自建机房两年资源规划.md",
          "lineStart": 64,
          "lineEnd": 64,
          "reason": "容量和复制初始告警门槛不是已批准SLA或RPO",
          "sha256": "c74bb466f37756920c856595fd02119d4960ae774d3cf5b3c913e998fcc11b41"
        }
      ],
      "useCaseIds": [
        "s4-filing",
        "s4-official",
        "s4-query",
        "s6-dispatch",
        "s6-query",
        "s7-dispatch",
        "s7-recovery"
      ],
      "nodeIds": [
        "N09",
        "N18",
        "N19",
        "N20",
        "N21"
      ],
      "inputs": [
        {
          "dependencyId": "DES-3",
          "consumes": "官方职责范围、企业授权、查询许可、端点/证书用途、来源字段、时效与批准负载",
          "contract": "doc/步骤四系统用例与接口协议.md；doc/步骤六系统用例与接口协议.md；doc/步骤七系统用例与接口协议.md；实际主管及查询契约待冻结。INT-08/09/10适配和真实测试回执为联调关口",
          "test": "逐渠道核查主管授权和可验证样例，无契约不启用"
        },
        {
          "dependencyId": "OPS-07",
          "consumes": "逐渠道隔离启停、限流、告警和人工接管配置模板",
          "contract": "OPS-07配置版本与故障操作单待交付；不复用其供应商证书",
          "test": "替换为官方企业/用途配置后核对互不串用"
        }
      ],
      "integrationScenarios": [
        {
          "name": "海关办理未知时证书轮换并恢复授权查询",
          "setup": "最终验收须接入INT-08海关正式办理与回执适配、INT-10授权关务查询的实际可运行制品及获准渠道测试环境，记录版本；企业甲许可和企业乙隔离数据、一份甲未知办理原号、两代测试证书、运维与独立关务核实员",
          "steps": [
            "通过INT-08制品记录测试办理原号，在结果未知处恢复备份并隔离新办理",
            "轮换测试证书后沿原号恢复，使用INT-10制品执行许可内查询及批准负载测量",
            "尝试跨企业查询，核对来源、观察时刻、确切回执和恢复后的外部提交计数"
          ],
          "assertions": [
            "原提交只发生一次，未知未被技术失败清除",
            "乙企业资料不返回，查询来源和时效可观察",
            "INT-08和INT-10均须有实际运行记录；任一缺制品或批准测试渠道则对应最终验收阻断，不能只测模板"
          ]
        },
        {
          "name": "证明与退税主管通道恢复不冒充银行到账",
          "setup": "最终验收须接入INT-09证明与退税主管渠道的实际可运行制品及获准主管测试环境，记录版本；准备职责范围已获确认的证明和退税测试案件、未决原dispatch号、独立税务核实员和只读资金对照",
          "steps": [
            "使用INT-09制品分别运行证明、退税的批准测试请求并保存原号与确切提交版",
            "在回执处理前制造断链，恢复后原号查询并核实主管测试回执",
            "尝试将税务处理结果标为退税实收，再比较资金三位置和银行证据"
          ],
          "assertions": [
            "两类主管任务均沿原号恢复，不重复正式执行，测试回执不充当正式机关事实",
            "主管处理结果不替代独立银行到账，不改变贸易代理商货款三位置",
            "缺INT-09可运行制品或主管授权测试环境时不签认最终验收；模板检查和自制成功回执均不能替代"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "主管职责、企业证书和查询授权、官方测试环境、频率/时效及可接受查询负载何时确认？",
          "owner": "关务税务渠道负责人",
          "impact": "阻断真实官方运行、容量及恢复验收；不阻断隔离和原号恢复设计"
        },
        {
          "question": "建议总Agent将INT-08/09/10完成放在联调关口，配置开工只要求设计契约冻结。",
          "owner": "项目交付负责人",
          "impact": "调整开工顺序，不免除官方适配、查询许可或真实证据验收"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": [
          "INT-08",
          "INT-09",
          "INT-10"
        ]
      },
      "agent": "platform",
      "before": {
        "personDays": 5,
        "baselinePersonDays": 10,
        "subtaskCount": 3,
        "dependencies": [
          "DES-3",
          "OPS-07",
          "INT-08",
          "INT-09",
          "INT-10"
        ]
      },
      "review": "复核移除官方适配作为配置开工前置的建议；最终验收仍要求海关、税务及查询的可运行制品与获准环境，不新增未授权查询能力。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s4-filing",
            "s4-query",
            "s6-dispatch",
            "s7-dispatch"
          ],
          "nodeIds": [
            "N09",
            "N19",
            "N21"
          ]
        },
        {
          "useCaseIds": [
            "s4-query",
            "s6-query",
            "s7-recovery"
          ],
          "nodeIds": [
            "N09",
            "N18",
            "N19",
            "N20",
            "N21"
          ]
        },
        {
          "useCaseIds": [
            "s4-official",
            "s6-dispatch",
            "s7-recovery"
          ],
          "nodeIds": [
            "N09",
            "N19",
            "N21"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "OPS-08-S1",
          "previousAction": "部署官方任务队列、证书和限流配置。",
          "currentIds": [
            "OPS-08-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "OPS-08-S2",
          "previousAction": "验证查询容量和备份恢复。",
          "currentIds": [
            "OPS-08-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "OPS-08-S3",
          "previousAction": "交接证书更新与主管渠道故障处理。",
          "currentIds": [
            "OPS-08-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "SEC-01": {
    "rationale": "采用成熟本地身份组件，按应用账号和强认证集成，不自行发明认证算法。",
    "steps": [
      {
        "personDays": 3,
        "action": "实现受控开户、法定主体/经办授权登记与自建强认证。",
        "logic": "输入业务核实的法定主体、组织经办授权范围、内部岗位与有效期，分别登记不可混用的外部和内部身份。采用批准的本地通行密钥或多因素方案，一期不调用第三方身份/SMS服务；自填名称、交易号和演示角色参数都不能开通权限。身份核实记录留受控引用，敏感原件不入登录日志。",
        "expected": "未开通、无授权或停用账号不能登录敏感入口；合法账号获得其受众会话，未自动获得所有交易权限。开户核实不冒称可靠电子签名。",
        "test": "在未来IAM隔离实现中准备未开通、有效、授权过期和停用四类账号，断开第三方身份网络分别登录；合法本地强认证可用，其余拒绝。修改请求体role或公司名不改变身份归属。"
      },
      {
        "personDays": 2.5,
        "action": "建立持久会话链、到期和撤销的即时敏感请求检查。",
        "logic": "会话标明主体、组织、受众、授权版本、强认证及重认证引用，续期可沿已核实链，独立新登录不承接旧操作确认。Cookie采用Secure/HttpOnly/SameSite并校验CSRF/Origin；撤权每次敏感请求读取有效门禁，不仅清前端或等待缓存到期。",
        "expected": "停用和撤销后已登录会话也不能新写、下载或恢复原受理；合法同文恢复仍需当前授权，不因确认号存在免认证。",
        "test": "合法登录取得会话后执行一次敏感读写，再撤销并直接重发原请求，必须认证/授权失败；换新登录会话复用旧确认应拒绝。仅同一核实链续期允许按设计恢复，不能重复执行业务。"
      },
      {
        "personDays": 1.5,
        "action": "交付登录失败、敏感动作重认证及凭据恢复流程。",
        "logic": "按批准阈值限制失败尝试，账号恢复由有权核实人员独立确认，撤销原凭据/会话并记录授权重建。恢复不能由客服直接改主体、冒用经办人或绕过独审。生产去除演示角色切换，不把Basic站点密码作为业务强认证。",
        "expected": "失败可观察、恢复可追溯，新凭据只恢复已核实授权；恢复前会话失效，未自动通过操作确认或业务审批。",
        "test": "用合成账号触发失败限制，按操作单由独立核实人恢复；旧会话和旧恢复令牌不可再用。传入演示角色、未经批准的联系方式或仅会知交易号均不能完成恢复。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "SEC-01",
      "status": "细化",
      "summary": "身份设计的第三方实名集成按阶段处理：一期受控开户、人工核实法定主体与经办授权、自建强认证，二期再接选定签署平台。以主体身份、会话撤销和凭据恢复共用支撑“供应商首次提交交易资料”和“付款方首次提交付款资料”，不直接实现建单或付款关系声明。本机账号及演示角色不构成业务IAM，不要求普通供应商持私钥。",
      "sourceReferences": [
        {
          "path": "doc/步骤一身份签名与可靠性设计.md",
          "lineStart": 9,
          "lineEnd": 28,
          "reason": "内外受众、实名授权、强认证和用户不持私钥的设计",
          "sha256": "c33cbc94bc4f3e1e1168d85b66554cd1c276e358fc8870d6139a0d4a1be8b84c"
        },
        {
          "path": "doc/步骤一身份签名与可靠性设计.md",
          "lineStart": 34,
          "lineEnd": 47,
          "reason": "身份从服务端获得、确认绑定会话及当前授权",
          "sha256": "c33cbc94bc4f3e1e1168d85b66554cd1c276e358fc8870d6139a0d4a1be8b84c"
        },
        {
          "path": "infra/local/README.md",
          "lineStart": 136,
          "lineEnd": 138,
          "reason": "真实IAM/MFA与证书设施尚待选型接入",
          "sha256": "79e5697633ec8b2d27a9953c8506c49e49fdbfe9c129c66f13b0c3890d96b5a3"
        }
      ],
      "useCaseIds": [
        "supplier-submit",
        "payer-submit"
      ],
      "nodeIds": [
        "N01"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "一期开户人工核实职责、本地强认证、会话时限、撤权及恢复策略",
          "contract": "doc/步骤一身份签名与可靠性设计.md §2/§3；第三方实名设计按一期禁外接约束分期，具体本地方案及阈值待冻结",
          "test": "业务与安全共同确认主体核实证据和有效期，不将厂商认证当一期依赖"
        }
      ],
      "integrationScenarios": [
        {
          "name": "授权停用后旧会话持有确认号",
          "setup": "自建IAM测试实例、已人工核实的外部账号和内部管理账号、有效会话及未消费确认引用",
          "steps": [
            "管理人员停用外部经办授权",
            "外部会话直接调用敏感请求与原结果恢复",
            "完成受控凭据恢复后再尝试复用旧会话和确认"
          ],
          "assertions": [
            "停用即时阻断，旧确认不能代替Authorization",
            "恢复不继承旧会话能力",
            "不调用第三方身份服务或新增业务成功记录"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "一期人工主体/经办核实由谁签认，本地通行密钥或多因素、账号恢复和会话时限选哪套方案？",
          "owner": "身份与访问管理负责人",
          "impact": "阻断一期真实身份上线；不阻断受众隔离与授权模型设计"
        },
        {
          "question": "身份设计中的第三方实名服务描述应如何标注为二期选型，避免一期额外接入？",
          "owner": "方案架构负责人",
          "impact": "阻断一期范围签认中的歧义；不影响一期人工核实与本地强认证建设"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "platform",
      "before": {
        "personDays": 3.5,
        "baselinePersonDays": 7,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit"
          ],
          "nodeIds": [
            "N01"
          ]
        },
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit"
          ],
          "nodeIds": [
            "N01"
          ]
        },
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit"
          ],
          "nodeIds": [
            "N01"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "SEC-01-S1",
          "previousAction": "集成自建账号、受控开户和本地强认证。",
          "currentIds": [
            "SEC-01-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "SEC-01-S2",
          "previousAction": "实现会话到期、撤销及停用生效。",
          "currentIds": [
            "SEC-01-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "SEC-01-S3",
          "previousAction": "验证登录失败、重认证及恢复流程。",
          "currentIds": [
            "SEC-01-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "SEC-02": {
    "rationale": "权限矩阵已有，计统一对象字段授权及确认凭据，不重复业务审批代码。",
    "steps": [
      {
        "personDays": 3,
        "action": "实现主体、交易关系、字段投影和内外受众的服务端策略。",
        "logic": "从验证凭证解析主体/组织/岗位和受托交易范围，字段按用例白名单输出。仅供应商首次完整提交创建交易，付款方独立声明并修改本方资料；内部最小概览不能代建、代填或读取双方私有正文。可见目录和可预测业务号不授予对象权限。",
        "expected": "供应商不能改付款方内容，付款方不能代建交易；跨主体不可见对象按协议404且不泄露资料，权限拒绝不生成业务事件。",
        "test": "准备同一交易的供应商甲、付款方乙和无关系丙，分别直接GET/PUT双方资料；丙不返回对象，甲乙各仅本方字段。乙尝试POST创建交易、内部概览账号尝试代填均拒绝；合法供应商提交失败时无空壳。"
      },
      {
        "personDays": 3,
        "action": "落实独立审核、供应商书面确认和版本化动作授权。",
        "logic": "服务费规则已确认：固定CNY 300由D承担，仅在首次获批分账时从D已核验可用余额结算；真实收费仍须D授权及法务/财务确认正式收费依据、票据和收入确认。审核员身份不同于作者/送审者，付款经办、审批和执行按批准职责分开；操作确认绑定主体/会话/受众/方法/路径/键/标签/正文，事务内重新计算。报关必须供应商授权人对确切批准版提交ready书面文件，技术确认号不替代书面同意；任何变更使受影响未执行批准和确认失效。",
        "expected": "自批、跨人复用确认、金额/受益人/版本替换都拒绝；新版本须重新独审和供应商确认。付款审批只能使用有效版本及已核实可用额，服务费不减少中国供应商合同应付；缺付款方授权、收费依据或可用余额不足时不得完成首次分账。",
        "test": "让报关作者兼审核、报关代理代供应商确认、用r1书面文件确认r2，均拒绝；合法不同人员批准r2后核对授权记录。另改付款金额或受益人配置版并复用原确认，必须拒绝且无锁额或执行。"
      },
      {
        "personDays": 2,
        "action": "覆盖下载、原受理恢复、分别接收及逐原因解除的实时鉴权。",
        "logic": "原受理回放早于新版本门禁但不早于当前授权检查；下载短期能力到期重新核权。附件2供应商和贸易代理商各自接收，不能代收。解除只针对有权范围内的holdReference且独立复核，关案不解冻；正常结案独审仍核当前源集合与未知项，不信客户端allPassed。",
        "expected": "撤权后不能恢复或下载；一次接收不替另一方，一项解除不抹其他暂停，未知执行存在时不能正常结案。",
        "test": "完成原受理后撤权，再原键回放及获取历史原件应拒绝；让供应商代贸易代理商接收附件2应拒绝。造两项合成暂停，独审解除一项后另一项仍阻断；申请人自批及带未知付款的结案均拒绝。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "SEC-02",
      "status": "细化",
      "summary": "授权需覆盖真实主体、交易委托、字段及动作，不能以目录可见或持交易号推导资料权。按首次供应商建单、付款方独立、供应商本人书面报关确认、独审分人、版本变更失效、付款及逐原因解除选取支撑用例；查询恢复和下载同样实时核权。",
      "sourceReferences": [
        {
          "path": "doc/步骤一系统用例与业务规则.md",
          "lineStart": 13,
          "lineEnd": 26,
          "reason": "首次供应商建单、付款方独立和双方本方修改",
          "sha256": "b9e8d335113a7a9fec4573429c5d06733a7b797ce9cdd617f3189df8708cc147"
        },
        {
          "path": "doc/步骤一HTTP接口协议.md",
          "lineStart": 9,
          "lineEnd": 41,
          "reason": "服务端身份、字段过滤、内外入口和不可见对象",
          "sha256": "3783a1197e2c7dbbfb42b5fb1a18d9d71c5db69c2aab257fdbe1b7d912b8d1c3"
        },
        {
          "path": "doc/步骤一身份签名与可靠性设计.md",
          "lineStart": 34,
          "lineEnd": 47,
          "reason": "确认精确绑定主体会话和意图，事务内核权、消费及原结果恢复",
          "sha256": "c33cbc94bc4f3e1e1168d85b66554cd1c276e358fc8870d6139a0d4a1be8b84c"
        },
        {
          "path": "doc/步骤四系统用例与接口协议.md",
          "lineStart": 49,
          "lineEnd": 57,
          "reason": "作者送审与审核分离、供应商本人书面确认、分别接收及版本失效",
          "sha256": "eaf6e283e192ee40ef03978d2fb4945853c01d1713eba11df41922b47a544d69"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 110,
          "lineEnd": 125,
          "reason": "首次分账服务费需付款方授权、正式收费依据及已核验可用余额；人工声明不构成银行权威。",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 164,
          "lineEnd": 169,
          "reason": "付款审批核对版本和受益配置，未知保留锁额，扣款与供应商到账分离",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/步骤八系统用例与接口协议.md",
          "lineStart": 32,
          "lineEnd": 40,
          "reason": "逐原因解除、关案不解冻、独立结案重读",
          "sha256": "e2918d2051a08419256735255787e066a167ecd22e70a9bc29a278378a9c632e"
        }
      ],
      "useCaseIds": [
        "supplier-submit",
        "payer-submit",
        "supplier-edit",
        "payer-edit",
        "s4-review",
        "s4-confirm",
        "s4-attachment",
        "s5-n16-payment",
        "s8-release",
        "s8-closure-review"
      ],
      "nodeIds": [
        "N01",
        "N07",
        "N08",
        "N09",
        "N16",
        "N22",
        "N23"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "主体关系、交易授权、字段白名单、独审职责和版本影响矩阵",
          "contract": "doc/步骤一HTTP接口协议.md；doc/步骤四系统用例与接口协议.md；doc/步骤八系统用例与接口协议.md；岗位全量授权矩阵待冻结",
          "test": "用供应商、付款方、物流、报关和内部独审角色逐项对照，不由菜单权限推导"
        },
        {
          "dependencyId": "SEC-01",
          "consumes": "已核实主体/组织/受众、会话链、岗位授权版本和撤销门禁",
          "contract": "doc/步骤一身份签名与可靠性设计.md §2/§3",
          "test": "正文伪造actor不影响服务端主体；撤销后旧会话即时拒绝"
        }
      ],
      "integrationScenarios": [
        {
          "name": "报关改版后供应商旧确认及代理代收",
          "setup": "供应商本人授权账号、出口报关代理作者、独立关务审核员、贸易代理商接收账号，申报r1批准且已书面确认，r2发生一字段变更",
          "steps": [
            "复用r1确认尝试r2正式办理",
            "由不同人员审核r2并由供应商确认匹配书面文件",
            "向双方分别交付后让供应商尝试代贸易代理商接收"
          ],
          "assertions": [
            "r1确认不能推进r2",
            "审核人与作者分开且书面证据版准确",
            "各接收事实独立，不产生贸易代理商已收的假记录"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "跨主体委托撤销、代办边界及经办/审核/执行岗位兼任限制需业务方签认完整矩阵。",
          "owner": "业务授权与内控负责人",
          "impact": "阻断未明确动作的放行；不阻断已明确首次提交、本方修改、独审和本人确认限制"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "platform",
      "before": {
        "personDays": 4,
        "baselinePersonDays": 8,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "SEC-01"
        ]
      },
      "review": "对照步骤四第49至57行及步骤八第32至40行，核对供应商本人书面确认、经办独审分离、逐原因解除和结案重读，不以入口可见代替动作授权。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit",
            "supplier-edit",
            "payer-edit"
          ],
          "nodeIds": [
            "N01"
          ]
        },
        {
          "useCaseIds": [
            "s4-review",
            "s4-confirm",
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N07",
            "N08",
            "N16"
          ]
        },
        {
          "useCaseIds": [
            "s4-attachment",
            "s8-release",
            "s8-closure-review"
          ],
          "nodeIds": [
            "N09",
            "N22",
            "N23"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "SEC-02-S1",
          "previousAction": "实现主体、受托交易和岗位的服务端策略。",
          "currentIds": [
            "SEC-02-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "SEC-02-S2",
          "previousAction": "实现经办审核执行分离及精确操作确认。",
          "currentIds": [
            "SEC-02-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "SEC-02-S3",
          "previousAction": "提供直接请求越权与撤权测试。",
          "currentIds": [
            "SEC-02-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "SEC-03": {
    "rationale": "已有审计字段及数据分类设计；计代码落地，不另做一轮总体威胁方案。",
    "steps": [
      {
        "personDays": 2.5,
        "action": "分类身份、账号、原件和凭据，落实源头脱敏与追加审计。",
        "logic": "按字段识别秘密、个人身份、完整银行账号、合同原文和辅助设备线索，业务日志只保留受控引用及必要错误码；敏感信息在进入日志前排除。审计记录主体/受众/对象/动作/结果/原因、授权版本和请求关联，普通业务账号无更新删除权，管理员行为另有独立保全要求。",
        "expected": "运行日志、领域事件和审计边界明确，密钥/账号/正文不明文泄漏；追加审计不能替代业务已受理、已收件或资金成功。",
        "test": "用合成身份值、完整账号及token样式标记经过请求和错误分支，检查应用原始日志而不只看Alloy处理后结果；业务账号尝试改删审计应拒绝，正常业务事件仍按原契约保存引用。"
      },
      {
        "personDays": 2,
        "action": "接入拒绝、历史文件下载及受控导出审计。",
        "logic": "下载和导出使用当前对象/字段授权，记录确切文件版、用途、请求关联和结果，不记录下载能力URL或正文。合法和拒绝路径都可追溯，跨主体拒绝不泄漏对象存在性；审计导出本身也授权并留记录。日志或审计写失败对敏感写的处理按冻结策略执行。",
        "expected": "合法下载、无权导出及历史查询可各自定位，错误响应不携带其他主体资料；审计不会生成附件已接收或结案成功事件。",
        "test": "准备一份合成附件2历史版，以合法接收方下载，再由另一主体直接导出；前者记录确切版和成功，后者拒绝且无数据。检查两条记录均有主体/对象/原因，无正文或敏感URL。"
      },
      {
        "personDays": 1.5,
        "action": "验证审计链定位、敏感值检索及批准保留隔离。",
        "logic": "按原请求关联串起鉴权拒绝、文件访问、业务受理引用与运维处理；不可把跨链相同时间当作同一事实。审计与Loki运行日志分别配置保留和访问策略，历史文件/证据遵守DM-02保留，不能随7天日志清理。",
        "expected": "授权审计人员能定位拒绝与来源，但普通业务用户不能批量读取全局日志；运行日志到期不删除证据或原受理。",
        "test": "用一条越权导出请求号从审计找回授权判断和拒绝原因，检索全部合成敏感标记应无明文；在独立测试数据上模拟运行日志过期，确认历史文件引用及审计仍按批准策略保留。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "SEC-03",
      "status": "细化",
      "summary": "Alloy仅辅助脱敏容器日志，Loki7天不是法律留存，普通MySQL追加触发器不能防管理员篡改。以源头脱敏、追加审计和拒绝/下载/导出追踪共用支撑“分别向供应商和出口代理交付附件2并确认接收”和“查询案件、审批记录和原请求结果”；不直接实现交付、本人接收或案件决定，审计不能替代领域事实、账务或正式证据。",
      "sourceReferences": [
        {
          "path": "infra/local/README.md",
          "lineStart": 107,
          "lineEnd": 118,
          "reason": "运行日志保留、容器日志代理权限和辅助脱敏限制",
          "sha256": "79e5697633ec8b2d27a9953c8506c49e49fdbfe9c129c66f13b0c3890d96b5a3"
        },
        {
          "path": "doc/步骤一身份签名与可靠性设计.md",
          "lineStart": 19,
          "lineEnd": 23,
          "reason": "身份确认与证据引用、IP设备辅助且最小化",
          "sha256": "c33cbc94bc4f3e1e1168d85b66554cd1c276e358fc8870d6139a0d4a1be8b84c"
        },
        {
          "path": "doc/sql/domain/README.md",
          "lineStart": 35,
          "lineEnd": 36,
          "reason": "追加触发器不代表防管理员篡改，账务和授权须应用实现",
          "sha256": "0c72058df686d5a618d706f6a5004e68e32f430238113841a114952fd73bee41"
        },
        {
          "path": "doc/步骤八系统用例与接口协议.md",
          "lineStart": 15,
          "lineEnd": 19,
          "reason": "完整来源向量与证据真实边界",
          "sha256": "e2918d2051a08419256735255787e066a167ecd22e70a9bc29a278378a9c632e"
        }
      ],
      "useCaseIds": [
        "s4-attachment",
        "s8-query"
      ],
      "nodeIds": [
        "N09",
        "N22",
        "N23"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "数据分类、审计字段、管理员独立保全和保留策略",
          "contract": "doc/步骤一身份签名与可靠性设计.md §2；审计设施物理方案与期限待冻结",
          "test": "列明各字段是否允许进入日志、审计、事件和原件，逐项审批"
        },
        {
          "dependencyId": "SEC-02",
          "consumes": "对象/字段鉴权结果、拒绝原因、授权版本与下载导出策略",
          "contract": "doc/步骤一HTTP接口协议.md §1/§2；doc/步骤四系统用例与接口协议.md §各目标门禁与恢复",
          "test": "合法及越权请求同时输出受控审计且响应不泄漏"
        },
        {
          "dependencyId": "DM-02",
          "consumes": "文件号版、用途、历史引用与保留不变量",
          "contract": "infra/local/README.md §S3桶及文件约束；doc/步骤一身份签名与可靠性设计.md §5",
          "test": "一份仍被历史引用的文件不可随日志清理删除"
        }
      ],
      "integrationScenarios": [
        {
          "name": "下载拒绝可追溯但日志不暴露原件",
          "setup": "合成附件2两份确切版、合法贸易代理商接收人、无权主体和独立审计员，分离运行日志与证据留存",
          "steps": [
            "合法用户下载旧版，另一个主体尝试导出",
            "审计员按请求号定位两次访问",
            "检索合成账号、正文与临时下载能力标记"
          ],
          "assertions": [
            "授权与拒绝结果均可定位",
            "无权响应无原件、日志无敏感原值",
            "下载审计不代替本人接收事实，证据不受运行日志到期影响"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "审计保留期限、管理员独立保全以及敏感动作审计设施故障时的失败策略未冻结。",
          "owner": "审计与数据保护负责人",
          "impact": "阻断生产审计保全验收；不阻断源头脱敏及普通账号追加保护"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "platform",
      "before": {
        "personDays": 3,
        "baselinePersonDays": 6,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "SEC-02",
          "DM-02"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s4-attachment",
            "s8-query"
          ],
          "nodeIds": [
            "N09",
            "N22",
            "N23"
          ]
        },
        {
          "useCaseIds": [
            "s4-attachment",
            "s8-query"
          ],
          "nodeIds": [
            "N09",
            "N22",
            "N23"
          ]
        },
        {
          "useCaseIds": [
            "s8-query"
          ],
          "nodeIds": [
            "N22",
            "N23"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "SEC-03-S1",
          "previousAction": "落实敏感数据分类、源头脱敏和追加审计。",
          "currentIds": [
            "SEC-03-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "SEC-03-S2",
          "previousAction": "接业务拒绝、下载访问和受控导出审计。",
          "currentIds": [
            "SEC-03-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "SEC-03-S3",
          "previousAction": "验证日志泄露及拒绝事件可追溯。",
          "currentIds": [
            "SEC-03-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "SEC-04": {
    "rationale": "采用成熟校验和扫描工具；应用上传流程在文件包，流水线执行在运维包。",
    "steps": [
      {
        "personDays": 2.5,
        "action": "实现封闭输入、会话请求防护、限流及安全响应规则。",
        "logic": "按Proto白名单重建输入，拒绝未知/重复字段、错误类型、未支持方法和客户端actor/审批字段；更新强If-Match，响应no-store和按协议失败结构。Cookie校验CSRF/Origin，配置TLS和批准响应头；限流按主体及入口策略冻结，不用限流代替授权或在错误时泄漏对象。",
        "expected": "直接请求与页面走相同规则，拒绝不产生交易或付款资料；错误明确且没有成功资源形状，合法两方提交可按原语义完成。",
        "test": "以合成步骤一请求分别加入重复JSON键、actor字段、弱ETag、缺Origin/CSRF及超过批准速率，检查指定400/412/428或已冻结限流响应；核对no-store和安全头，失败后无空交易。"
      },
      {
        "personDays": 2,
        "action": "落实上传类型/大小/解析隔离和内部依赖校验规则。",
        "logic": "验证实际字节与批准格式，不相信扩展名或Content-Type；结合ClamAV流/解压边界，格式检查和扫描结果分开。干净文件不自动获得签署真实性。内部构建使用锁定依赖和批准扫描数据源，秘密与代码/单证不得上传第三方扫描服务，例外须独立审批。",
        "expected": "格式伪装、超限或扫描未知文件不能被业务引用；依赖违规可阻断制品，但扫描通过不赋予合同、官方或银行证据效力。",
        "test": "用无害合成字节伪装PDF、超过批准尺寸文件及受控扫描失败结果分别上传，检查隔离/拒绝且无ready引用；内部扫描用已知违规测试依赖夹具确认门禁，不下载或运行危险载荷。"
      },
      {
        "personDays": 1.5,
        "action": "形成授权范围内的直接请求回归及构建阻断记录。",
        "logic": "只在隔离测试入口执行批准的合成输入，覆盖错误参数、确认绑定、超限和异常扫描，不探测未知部署或真实第三方。把每个拒绝关联SEC-03审计和发布门禁，保留合法对照路径，避免仅证明全部请求都被挡住。",
        "expected": "形成可重跑的输入、错误、状态不变及合法对照记录；尚无handler的用例标未验证，不拿静态协议检查当运行通过。",
        "test": "同一用例先发送不匹配确认及超限文件，再发送满足条件的合法本方资料；前者无业务事件，后者只产生一次原受理。构建中违规规则应阻断，恢复依赖后相关正常测试仍通过。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "SEC-04",
      "status": "细化",
      "summary": "协议已有封闭输入、确认、缓存和文件边界，生产handler尚未存在；本机ClamAV也不验证法律签署。细化可复用接口防护、上传边界及内部构建规则，测试限定授权隔离环境中的合成样本，不开展漏洞发现或渗透。",
      "sourceReferences": [
        {
          "path": "doc/步骤一HTTP接口协议.md",
          "lineStart": 30,
          "lineEnd": 41,
          "reason": "封闭ProtoJSON、方法、确认、no-store和ETag语义",
          "sha256": "3783a1197e2c7dbbfb42b5fb1a18d9d71c5db69c2aab257fdbe1b7d912b8d1c3"
        },
        {
          "path": "doc/步骤一身份签名与可靠性设计.md",
          "lineStart": 19,
          "lineEnd": 28,
          "reason": "TLS、Cookie/CSRF及不下发共享私钥",
          "sha256": "c33cbc94bc4f3e1e1168d85b66554cd1c276e358fc8870d6139a0d4a1be8b84c"
        },
        {
          "path": "infra/local/README.md",
          "lineStart": 49,
          "lineEnd": 53,
          "reason": "上传、扫描和真实性不能混同",
          "sha256": "79e5697633ec8b2d27a9953c8506c49e49fdbfe9c129c66f13b0c3890d96b5a3"
        },
        {
          "path": "doc/examples/step1/http-reference.md",
          "lineStart": 3,
          "lineEnd": 17,
          "reason": "cURL为未部署推演，不能顺序调用证明成功",
          "sha256": "43addaa69ca4ab479159779d1a2cc308ec39beb61530cf11358f8b989372fb2f"
        }
      ],
      "useCaseIds": [
        "supplier-submit",
        "payer-submit"
      ],
      "nodeIds": [
        "N01"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "输入协议、会话防护、上传格式和大小、限流及内部扫描许可",
          "contract": "doc/步骤一HTTP接口协议.md；infra/local/clamd.conf；生产格式白名单及限流值待冻结",
          "test": "每条规则有正常和拒绝夹具，不能写死未批准生产阈值"
        },
        {
          "dependencyId": "SEC-03",
          "consumes": "拒绝审计字段、敏感值排除和测试记录关联格式",
          "contract": "SEC-03审计契约待冻结；infra/local/README.md §监控、日志和调度操作",
          "test": "错误请求的审计可按请求号查到，日志不含合成秘密明文"
        }
      ],
      "integrationScenarios": [
        {
          "name": "文件类型伪装与正常资料对照",
          "setup": "批准的隔离上传入口、合法供应商/付款方账号、无害伪装字节、超限样本及正常合成材料",
          "steps": [
            "发送格式伪装与超限上传",
            "尝试将失败文件引用进首次提交",
            "改用正常文件和精确确认重新提交原合法意图"
          ],
          "assertions": [
            "失败文件未ready且引用被拒",
            "无空交易和部分确认消费",
            "正常对照可受理一次，扫描通过不称法律真实性通过"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "生产格式白名单、限流维度/阈值、内部依赖扫描引擎和例外审批规则待确定。",
          "owner": "应用安全与研发效能负责人",
          "impact": "阻断具体规则上线与运行通过结论；不阻断已确定协议拒绝语义"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "platform",
      "before": {
        "personDays": 3,
        "baselinePersonDays": 6,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "SEC-03"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit"
          ],
          "nodeIds": [
            "N01"
          ]
        },
        {
          "useCaseIds": [
            "supplier-submit"
          ],
          "nodeIds": [
            "N01"
          ]
        },
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit"
          ],
          "nodeIds": [
            "N01"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "SEC-04-S1",
          "previousAction": "配置参数校验、会话请求防护、限流及安全响应头。",
          "currentIds": [
            "SEC-04-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "SEC-04-S2",
          "previousAction": "配置上传格式边界和内部依赖扫描规则。",
          "currentIds": [
            "SEC-04-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "SEC-04-S3",
          "previousAction": "验证伪造、超限和危险内容路径。",
          "currentIds": [
            "SEC-04-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "SEC-05": {
    "rationale": "复用既定密钥设施，负责生命周期和权限；银行报文签验算法接入属INT-01。",
    "steps": [
      {
        "personDays": 2,
        "action": "登记银行、幂等摘要和平台回执密钥的用途分权及版本读取。",
        "logic": "每把密钥登记用途、所属环境/机构、算法、版本、有效期、保管责任及允许调用主体，银行验签信任材料与请求认证密钥分开；内部HMAC不公开，平台回执按规范公开业务摘要。只给应用调用必需用途，不向浏览器、仓库、制品或日志导出秘密。",
        "expected": "错误用途和环境的调用被拒，记录可定位key_version而无密钥值；普通供应商不被要求安装证书或保存私钥。",
        "test": "在批准的测试密钥设施用平台回执调用者尝试取银行密钥、跨环境调用和直接导出，应拒绝；检查合成配置和日志无秘密原值。给确定提交的测试受理验证回执绑定原事件与原投影摘要。"
      },
      {
        "personDays": 1.5,
        "action": "实现轮换、到期/撤销阻断及历史证据按原版本核验。",
        "logic": "轮换明确新请求切换点，保留历史公钥和核验所需版本；HMAC旧键重入按原key_version比对，不能因轮换把同文当新请求。历史验签结合当时授权、吊销和可信时间证据，缺项标待核，不盲目断言长期有效。到期或撤销阻断新请求，不抹历史证据。",
        "expected": "新请求使用新密钥版，原受理可恢复且历史验证结论有依据；证书失效不生成实收、扣款或供应商到账。",
        "test": "用测试旧版产生受理后轮换，重复原键同文应取回原受理；新键走新版本。再模拟新证书过期与旧证据缺吊销资料，前者新请求被拒，后者保留待核而非虚构验签成功。"
      },
      {
        "personDays": 1.5,
        "action": "联合银行适配验证签名失败、灾备凭据恢复和未知结果。",
        "logic": "由银行正式契约确定签名字段、算法、证书链、时效与吊销核实方式，测试适配不能自行宣布银行权威。平台仅在确定COMMIT后签回执，签名设施失败是RECEIPT_NOT_READY，COMMIT未知先查主库原键；银行验签失败保留原报文受控引用及待核状态，不解除未知付款锁额。",
        "expected": "密钥设施恢复后继续原任务而不重发付款；平台回执、银行事实和合同签署保持三种不同证明边界。",
        "test": "在银行批准测试环境或明确标注模拟环境中替换签名/撤销测试证书，应留下失败而无资金成功事件；模拟平台签名设施不可用和数据库提交未知，分别核对两种503语义，恢复后原受理不重复。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "SEC-05",
      "status": "细化",
      "summary": "需分离银行机构认证/验签、内部幂等HMAC和平台受理签名用途；平台回执不冒充用户合同签名。本机私有凭据不是生产HSM/KMS，银行算法、吊销与可信时间依赖正式协议。补充密钥版本、轮换、历史验证和灾备未知门禁。",
      "sourceReferences": [
        {
          "path": "doc/步骤一身份签名与可靠性设计.md",
          "lineStart": 26,
          "lineEnd": 28,
          "reason": "浏览器无统一私钥、机构可选套件和用途分离",
          "sha256": "c33cbc94bc4f3e1e1168d85b66554cd1c276e358fc8870d6139a0d4a1be8b84c"
        },
        {
          "path": "doc/步骤一身份签名与可靠性设计.md",
          "lineStart": 53,
          "lineEnd": 57,
          "reason": "确定提交后平台签回执、公开摘要与未知不签成功",
          "sha256": "c33cbc94bc4f3e1e1168d85b66554cd1c276e358fc8870d6139a0d4a1be8b84c"
        },
        {
          "path": "infra/local/README.md",
          "lineStart": 136,
          "lineEnd": 138,
          "reason": "生产HSM/KMS与真实银行接入尚未实现",
          "sha256": "79e5697633ec8b2d27a9953c8506c49e49fdbfe9c129c66f13b0c3890d96b5a3"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 164,
          "lineEnd": 169,
          "reason": "银行扣款、未知锁额、供应商到账独立",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        }
      ],
      "useCaseIds": [
        "supplier-submit",
        "s5-n11-receipt",
        "s5-n16-payment"
      ],
      "nodeIds": [
        "N01",
        "N11",
        "N16"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "密钥用途、摘要规范、平台回执证据边界及银行待确认认证规范",
          "contract": "doc/步骤一身份签名与可靠性设计.md §2/§3.3；银行算法/签名字段/吊销与时间规则待冻结",
          "test": "平台回执可核原受理但不得标记用户已可靠签约"
        },
        {
          "dependencyId": "OPS-04",
          "consumes": "受控密钥设施调用、TLS、用途分权、灾备保管与证据确切版本",
          "contract": "OPS-04密钥设施交接契约待选型；infra/local/README.md本机凭据不代表生产托管",
          "test": "用途越权调用被拒，备份恢复不导出秘密到普通应用账号"
        },
        {
          "dependencyId": "SEC-03",
          "consumes": "密钥调用/拒绝/轮换审计字段及源头脱敏策略",
          "contract": "SEC-03审计字段待冻结；doc/步骤一身份签名与可靠性设计.md证据引用要求",
          "test": "查到key_version和调用结果，查不到合成秘密原值"
        }
      ],
      "integrationScenarios": [
        {
          "name": "密钥轮换遇到已提交但回执未签",
          "setup": "测试签名设施、已确定提交的原受理、另一笔COMMIT未知请求及银行未知付款，独立密钥管理员和应用账号",
          "steps": [
            "使回执签名暂不可用并轮换测试密钥",
            "按原键恢复确定受理与未知请求",
            "撤销银行测试证书后执行原付款查单验证"
          ],
          "assertions": [
            "确定受理只补原回执不重做业务",
            "未知提交先核实，不签未知成功",
            "银行验签失败不解锁也不生成到账"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "银行证书、算法、验签原文、吊销与可信时间、灾备凭据及原号查单协议未确认。",
          "owner": "银行接入与密码应用负责人",
          "impact": "阻断真实银行认证、验签及灾备通过结论；不阻断用途分离和平台回执契约实现"
        },
        {
          "question": "平台回执签名与HMAC轮换所用生产密钥设施、历史验证材料保留策略待批准。",
          "owner": "密码应用与证据保全负责人",
          "impact": "阻断生产签名托管和长期核验验收；不要求供应商自管私钥"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "platform",
      "before": {
        "personDays": 2.5,
        "baselinePersonDays": 5,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "OPS-04",
          "SEC-03"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "supplier-submit",
            "s5-n11-receipt"
          ],
          "nodeIds": [
            "N01",
            "N11"
          ]
        },
        {
          "useCaseIds": [
            "supplier-submit",
            "s5-n11-receipt",
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N01",
            "N11",
            "N16"
          ]
        },
        {
          "useCaseIds": [
            "supplier-submit",
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N01",
            "N16"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "SEC-05-S1",
          "previousAction": "落实银行及内容摘要密钥分权、版本和读取权限。",
          "currentIds": [
            "SEC-05-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "SEC-05-S2",
          "previousAction": "实现轮换、过期阻断及恢复。",
          "currentIds": [
            "SEC-05-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "SEC-05-S3",
          "previousAction": "与银行适配验证失效、撤销及灾备。",
          "currentIds": [
            "SEC-05-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "SEC-06": {
    "rationale": "仅计投产前组合攻击与复测；各包基础安全测试不再重做。",
    "steps": [
      {
        "personDays": 3,
        "action": "执行一期授权、文件、资金与人工证据的批准回归矩阵。",
        "logic": "服务费规则已确认：固定CNY 300由D承担，仅在首次获批分账时从D已核验可用余额结算；真实收费仍须D授权及法务/财务确认正式收费依据、票据和收入确认。以已实现制品、合成主体和隔离测试数据为输入，覆盖跨主体资料、复用别人或旧版确认、扫描通过但官方来源不足、未知银行锁额、独立服务费及暂停/结案。无真实银行与主管接入的外部成功保持未验证，只测试缺证阻断，不伪造可信来源。",
        "expected": "每例记录实际请求、响应、业务状态不变和审计；不能由改页面、上传截图或技术通知构造正式成功。没有垫资、授信、透支、换汇或特殊结案入口。",
        "test": "让付款方读取供应商私有内容、代理代供应商书面确认、提交authority-claim合成材料、服务费未付时执行满足其他条件的模拟付款，分别检查前几项拒绝及服务费不成为条件；未知付款只原号查询，供应商到账仍需独立证据。"
      },
      {
        "personDays": 3,
        "action": "修复验收发现并由非修复人员重跑原例及合法相邻路径。",
        "logic": "每项实际发现登记复现输入、影响版本、责任包、修复制品摘要和复测结果，不预设存在漏洞。修复不能以全接口禁用替代对象授权，不能删除资金、授权或证据校验；只修本轮实际发现及紧耦合问题，问题等级和放行规则由批准标准判定。",
        "expected": "原失败例被修正，合法双方提交、独审和原受理恢复仍可完成；未关闭阻断项保持上线阻断，未执行项不写通过。",
        "test": "对每个真实验收失败用相同主体/原键/版本独立复跑，再用合法不同人员和匹配证据走对照；核对不重复受理且拒绝无副作用。若本轮无可运行handler，只交测试输入和缺口，不编造修复完成。"
      },
      {
        "personDays": 2,
        "action": "核对生产暴露面、暂停/结案门禁及上线安全签认。",
        "logic": "消费OPS-05候选制品和环境清单，按批准范围核对端口、内部路由、账号、密钥和审批记录，不擅自扫描真实第三方。两原因暂停分别解除、关案不自动解冻；结案独审重读全部源集合，未知付款或未核实到账均阻断。",
        "expected": "上线结论列实际已测、未测、阻断和残留项，签认依据是可观察结果及批准边界；端口健康或静态检查通过不算业务安全通过。",
        "test": "准备两项暂停的合成交易，关一案件并解除一个原因，另一原因仍阻断；再准备报告通过后新增未知付款的交易，由不同于申请人的审核员审批，须重新核验并拒绝结案。对照部署清单确认只有批准入口可达。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "SEC-06",
      "status": "细化",
      "summary": "本包实施说明保持一期验收及修复职责；本轮审计仅核对工作可执行性，没有做漏洞发现或渗透。将测试落到授权隔离环境的跨主体、精确确认、人工证据、资金未知及结案门禁，并要求修复后独立复测和合法对照；现有静态规约不能作为生产安全通过。",
      "sourceReferences": [
        {
          "path": "doc/步骤一身份签名与可靠性设计.md",
          "lineStart": 34,
          "lineEnd": 55,
          "reason": "精确意图、当前授权、确认消费及未知回执",
          "sha256": "c33cbc94bc4f3e1e1168d85b66554cd1c276e358fc8870d6139a0d4a1be8b84c"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 110,
          "lineEnd": 125,
          "reason": "D服务费结算不冲减A合同应付；人工声明不构成银行事实",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 164,
          "lineEnd": 169,
          "reason": "未知原号恢复与供应商到账分离",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/步骤八系统用例与接口协议.md",
          "lineStart": 32,
          "lineEnd": 40,
          "reason": "多原因暂停、关案不解冻及无未知正常结案",
          "sha256": "e2918d2051a08419256735255787e066a167ecd22e70a9bc29a278378a9c632e"
        },
        {
          "path": "doc/examples/step4/authority-claim.html",
          "lineStart": 1,
          "lineEnd": 1,
          "reason": "现有材料明确是合成声明，不能充当官方事实",
          "sha256": "62c1d00fe1155148acf0d7ca4d888b0dc752cf9c93977247efaf4b55cd6c6e72"
        }
      ],
      "useCaseIds": [
        "supplier-submit",
        "payer-submit",
        "s4-confirm",
        "s5-n13-invoice-fee",
        "s5-n16-payment",
        "s8-release",
        "s8-case-close",
        "s8-closure-review"
      ],
      "nodeIds": [
        "N01",
        "N08",
        "N13",
        "N16",
        "N22",
        "N23"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "一期批准边界、授权测试范围、放行标准及角色职责",
          "contract": "doc/步骤一系统用例与业务规则.md；doc/步骤五系统用例与接口协议.md；doc/步骤八系统用例与接口协议.md",
          "test": "矩阵覆盖批准边界而不引入二三期真实外部成功"
        },
        {
          "dependencyId": "SEC-04",
          "consumes": "输入、上传、会话与构建规则及实际回归结果",
          "contract": "SEC-04回归记录和候选制品摘要待交付",
          "test": "抽取正常与拒绝输入复跑，缺handler标未测"
        },
        {
          "dependencyId": "SEC-05",
          "consumes": "密钥用途、轮换、验签失败和历史核验结果",
          "contract": "SEC-05密钥测试记录；真实银行契约待确认",
          "test": "核对无效签名未产生资金成功"
        },
        {
          "dependencyId": "FIN-07",
          "consumes": "扣款、明确未扣款、未知及供应商到账分别核实的实现和测试夹具",
          "contract": "doc/步骤五系统用例与接口协议.md §N16",
          "test": "模拟未知保持锁额，扣款不自动变供应商到账"
        },
        {
          "dependencyId": "BL-16",
          "consumes": "正常结案独审、最新源集合核验及历史恢复入口",
          "contract": "doc/步骤八系统用例与接口协议.md §4",
          "test": "申请后新增对象或未知执行，审批必须拒绝"
        },
        {
          "dependencyId": "FE-09",
          "consumes": "已批准角色下的前端流程回归与操作手册版本",
          "contract": "FE-09交付记录待提供；不恢复FE-01已删除的30任务页专项核对",
          "test": "页面与直接请求拒绝一致，不用隐藏按钮替代服务端鉴权"
        },
        {
          "dependencyId": "OPS-05",
          "consumes": "候选制品、环境配置、发布权限和回退记录",
          "contract": "OPS-05签名制品及发布操作单待交付",
          "test": "测试制品与候选制品摘要相同，环境变化列出复测范围"
        }
      ],
      "integrationScenarios": [
        {
          "name": "关案后另一暂停与银行未知继续阻断结案",
          "setup": "隔离应用、申请人和独立审核员、两项有效暂停、一笔未知付款及合成核对报告，不操作真实资金",
          "steps": [
            "关闭其中案件并独审解除一个holdReference",
            "保留另一原因及未知付款，申请正常结案",
            "复核服务费与货款记录未互相扣减"
          ],
          "assertions": [
            "关案不会自动解除任何未批准原因",
            "未知付款不解锁、不重付且结案拒绝",
            "无特殊结案路径，独立服务费不成付款先决条件"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "一期可运行候选制品、真实银行批准测试环境和上线阻断分级标准何时交付？",
          "owner": "测试与上线验收负责人",
          "impact": "阻断实际专项验证及放行意见；不阻断本轮实施说明审计和回归矩阵交付"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "platform",
      "before": {
        "personDays": 4,
        "baselinePersonDays": 8,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "SEC-04",
          "SEC-05",
          "FIN-07",
          "BL-16",
          "FE-09",
          "OPS-05"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit",
            "s4-confirm",
            "s5-n13-invoice-fee",
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N01",
            "N08",
            "N13",
            "N16"
          ]
        },
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit",
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N01",
            "N16"
          ]
        },
        {
          "useCaseIds": [
            "s8-release",
            "s8-case-close",
            "s8-closure-review"
          ],
          "nodeIds": [
            "N22",
            "N23"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "SEC-06-S1",
          "previousAction": "验证跨主体资金、文件、确认重放及人工证据绕过。",
          "currentIds": [
            "SEC-06-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "SEC-06-S2",
          "previousAction": "修复专项发现并独立复测。",
          "currentIds": [
            "SEC-06-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "SEC-06-S3",
          "previousAction": "核对部署暴露面、权限及上线安全结论。",
          "currentIds": [
            "SEC-06-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "SEC-07": {
    "rationale": "第二期保留原9人日，新增渠道逐项审查。",
    "steps": [
      {
        "personDays": 3,
        "action": "冻结签署物流通知的主体授权、接收方和外发最小字段。",
        "logic": "每渠道登记机构身份、业务用途、企业/交易委托、签署人或物流接收方、允许字段和授权期限。供应商签署仅本人必要签署会话，物流数据按委托区段，通知只含最小状态与受控入口；不以银行许可替代，不为收货人强设账号，不在短信邮件放合同原文或长期下载链接。",
        "expected": "外发范围能按主体和用途解释，错误接收人无数据；电子签法定主体/经办及用章授权需真实证据，平台名称或短信到达不能证明可靠签名。",
        "test": "用只具银行权限的账号调用签署/物流通道应拒绝；准备同一交易两个不同接收方，比较外发字段与授权范围。通知样例中不含完整账号、合同正文或签署能力URL。"
      },
      {
        "personDays": 3.5,
        "action": "实现机构回调认证、原任务/版本绑定和签署证据验证。",
        "logic": "先按选定厂商原报文验证来源、签名、时效及重放，再归一化providerCode；通知键(providerCode,providerEventId)同文去重、异文隔离。签署查原clientReference核对所有签署人、批准正文关联、证书链/吊销/可信时间和附件覆盖；签署改变字节，不能要求签署件hash等于审核原文。物流回调先待核，不直接变收货或放行。",
        "expected": "伪造来源和异文同键被拒，技术received不等于已签署或生效；证据包本地确切版保全完成才可按业务条件推进，通知不能改资金。",
        "test": "对冻结的合法厂商样例分别改签名、provider、合同版和接收方，检查拒绝或隔离且当前合同不变；重复合法通知只建一个归档任务。以签署后字节不同但正文关联可证明的测试包走验证，缺证书/附件则保持verifying。"
      },
      {
        "personDays": 2.5,
        "action": "验证撤权、旧版晚到结果、错误接收人与隐私隔离。",
        "logic": "撤权立即停止该用户新发起、下载及业务推进，不抹去机构已接收法律签署任务。禁用或旧版任务的可信晚到证据按原任务受控隔离保留，必要时授权后台原号查明并交法律处置；不能丢弃真实签署或推进新版。伪造无关回调仍拒绝，通知送达不能代本人签收。",
        "expected": "撤权用户无新能力，历史法律事实与审计可保留；不同企业、收件人和新旧合同版互不串用，资金位置不受通知影响。",
        "test": "发起测试签署任务后撤销用户授权并改新版本，尝试旧链接下载应拒绝；再送入合法旧版晚到结果与伪造结果，前者隔离保留且告警，后者认证失败。核对新版本、物流收货和资金均未被推进。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "SEC-07",
      "status": "细化",
      "summary": "二期按签署、物流和业务通知分别确认主体、接收方与最小字段；银行授权不能复用。修正旧说明将所有旧版/撤权晚到回调一概拒弃的歧义：业务推进受阻，但已发任务的真实签署证据应隔离保存、原号核实及法律处置，不推进新版。",
      "sourceReferences": [
        {
          "path": "doc/步骤二系统用例与接口协议.md",
          "lineStart": 33,
          "lineEnd": 48,
          "reason": "第三方签署认证、原报文回调、个人链接和晚到旧版证据",
          "sha256": "309fb3369cd0cde8dcda7f2b1878fd1cb1518505439e5d38b418ce419fd98102"
        },
        {
          "path": "doc/步骤三系统用例与接口协议.md",
          "lineStart": 11,
          "lineEnd": 17,
          "reason": "物流主体委托、独立核实、签收不强制收货人开户",
          "sha256": "bed3e39150278fba4db2d78386f6de645a89f8c0dd863ef28e37254b5400d339"
        },
        {
          "path": "doc/examples/step2/http-reference.md",
          "lineStart": 1,
          "lineEnd": 13,
          "reason": "示例是独立未执行推演，实际凭据/签名仍待供应商确认",
          "sha256": "18f72bff4476364c9ffe2f6cf8731c8ca9598eb924badac81703523bbc3f77ce"
        }
      ],
      "useCaseIds": [
        "contract-sign",
        "contract-activate",
        "booking-pickup",
        "transport-progress",
        "logistics-exception"
      ],
      "nodeIds": [
        "N02",
        "N03",
        "N04",
        "N06",
        "N10"
      ],
      "inputs": [
        {
          "dependencyId": "DES-2",
          "consumes": "选定厂商正式认证/回调/签署证据契约、接收方和最小字段、停用后法律处置规则",
          "contract": "doc/步骤二系统用例与接口协议.md §3；物流通知正式供应商契约及隐私规则待冻结",
          "test": "验证合法原报文及篡改对照样例，未选厂商不编造头名或接口"
        },
        {
          "dependencyId": "SEC-06",
          "consumes": "一期对象/字段授权、确认、文件和证据边界的已测基线及未关闭问题",
          "contract": "SEC-06批准验收记录待交付",
          "test": "二期新增外发/回调不能绕过一期撤权、独审、资金及原受理恢复门禁"
        }
      ],
      "integrationScenarios": [
        {
          "name": "撤权与合同改版后合法签署结果晚到",
          "setup": "测试电子签适配，供应商必要签署人、独立合同审核员及证据管理员，r1已发任务、r2待审，原用户授权随后撤销",
          "steps": [
            "拒绝原用户继续获取签署链接和下载能力",
            "接收并核实测试机构的r1晚到真实形状证据",
            "重复通知，再发送同事件号异文及错误企业结果"
          ],
          "assertions": [
            "r1证据隔离保留、原号可核实，不被静默删除",
            "r2不生效，已核实资金不变",
            "同文不重复，异文与错企业不推进业务且留审计"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "正式签署平台算法、证据导出、可信时间、吊销验证、境内外数据及撤权后任务处置规则待确认。",
          "owner": "法务与电子签署接入负责人",
          "impact": "阻断可靠签署与法律证据验收；不阻断最小字段、用户撤权和机构认证边界实现"
        },
        {
          "question": "物流和通知的企业委托、个人信息处理范围、错误接收方补救与保留规则待签认。",
          "owner": "数据保护与渠道业务负责人",
          "impact": "阻断真实外发启用；不阻断隔离样例和字段最小化检查"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "platform",
      "before": {
        "personDays": 4.5,
        "baselinePersonDays": 9,
        "subtaskCount": 3,
        "dependencies": [
          "DES-2",
          "SEC-06"
        ]
      },
      "review": "对照步骤二第33至48行，核对原报文认证、签署件与审核正文关联、撤权停止新能力以及旧版晚到法律证据隔离保留，禁止推进新版本。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "contract-sign",
            "booking-pickup",
            "transport-progress"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04",
            "N06",
            "N10"
          ]
        },
        {
          "useCaseIds": [
            "contract-sign",
            "contract-activate",
            "transport-progress"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04",
            "N10"
          ]
        },
        {
          "useCaseIds": [
            "contract-sign",
            "contract-activate",
            "transport-progress",
            "logistics-exception"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04",
            "N10"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "SEC-07-S1",
          "previousAction": "确认供应商范围、接收方及最小字段。",
          "currentIds": [
            "SEC-07-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "SEC-07-S2",
          "previousAction": "落实回调认证、版本绑定和最小出口。",
          "currentIds": [
            "SEC-07-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "SEC-07-S3",
          "previousAction": "验证隐私、撤权及错误接收方。",
          "currentIds": [
            "SEC-07-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "SEC-08": {
    "rationale": "第三期保留原11人日，主管证书和查询数据许可单独校验。",
    "steps": [
      {
        "personDays": 4,
        "action": "实现企业授权、主管证书、办理职责和查询许可的分别校验。",
        "logic": "以正式企业委托、经办岗位、主管证书用途、申报/案件范围及查询许可为输入，企业证书持有不等于任意企业资料可读。办理仍需确切独审版、供应商本人书面确认和正式委托；证明职责、退税范围或渠道未确认时可备料但不能正式执行。独立关务查询能力使用共用支撑说明，不造稳定业务用例。",
        "expected": "许可不足的查询无数据返回，缺正式职责和授权的办理不发起；外部成功只能来自可信来源及确切证据，不能由人工导入自报成功。",
        "test": "用企业甲证书查询乙资料、只读许可发起申报、缺主管职责提交证明申请，分别拒绝且无外部执行。以匹配主体及有效范围的授权执行许可内查询，结果只含允许字段与来源时刻。"
      },
      {
        "personDays": 4,
        "action": "实现撤权停用、缓存/导出隔离和人工导入及回调保护。",
        "logic": "查询缓存键和导出任务绑定企业/对象/许可版本/字段范围/来源时间，撤权后阻断新查询、下载和导入，不让已缓存数据绕权；在途可信回执保留原任务证据但不跨主体或越权推进。人工导入同样核权、扫描、确切版本及独立验真，人工验真不冒称数字验签。",
        "expected": "企业间无缓存、导出或回调串用，撤权后无新能力；旧证据保留合法审计链，未知官方结果不因技术停用变明确失败。",
        "test": "先缓存甲查询并建立导出任务，再撤销甲许可，直接取结果/导入应拒绝；乙账号请求同资源不能命中甲缓存。送入错企业回调及无真实来源合成官方文件，不能新增受理、放行、签发或税务批准事实。"
      },
      {
        "personDays": 3,
        "action": "对跨企业、过期证书、查询时效和原号恢复执行批准复测。",
        "logic": "用正式冻结的主管测试协议验证，证书过期/撤销阻断新请求，历史证据按原时刻与材料核验。查询明确来源和有效时点，过期数据不得当作当前官方结论；未知任务只原号查单。税务通知/批准与资金域独立到账分开，不能推高贸易代理商货款三位置。",
        "expected": "复测记录区分实际通过、缺渠道未验证和需人工核实；无授权不返回资料，未决未知不允许正常结案，不形成特殊结案或无证解锁。",
        "test": "准备甲乙企业、有效/过期两代测试证书和旧查询快照；分别执行跨企业、过期证书和超时效查询，核对无泄漏且旧数据标过期/不可作当前依据。对未知退税办理按原dispatch号恢复，税务成功样例不产生银行到账或货款资金事件。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "SEC-08",
      "status": "细化",
      "summary": "三期企业授权、主管证书和查询许可是独立条件；官方接口、缓存及人工导入都必须按企业、对象和用途核权。没有稳定的独立关务查询用例id，不为运行任务新造用例，也不把s4-query的申报历史查询冒充全量关务数据产品。正式事实缺证阻断，税务决定不证明银行到账。",
      "sourceReferences": [
        {
          "path": "doc/步骤四系统用例与接口协议.md",
          "lineStart": 7,
          "lineEnd": 11,
          "reason": "各法定主体和岗位分别授权，s4-query是申报历史及原请求",
          "sha256": "eaf6e283e192ee40ef03978d2fb4945853c01d1713eba11df41922b47a544d69"
        },
        {
          "path": "doc/步骤四系统用例与接口协议.md",
          "lineStart": 49,
          "lineEnd": 57,
          "reason": "正式委托、本人确认、独立官方核实与原号恢复",
          "sha256": "eaf6e283e192ee40ef03978d2fb4945853c01d1713eba11df41922b47a544d69"
        },
        {
          "path": "doc/步骤六系统用例与接口协议.md",
          "lineStart": 5,
          "lineEnd": 13,
          "reason": "主管职责范围待确认，内部独审与外部主体授权分离",
          "sha256": "c80e0ceb5b024eacc205546ce30739d4118ec98c8ffcc6bd960584142b91d409"
        },
        {
          "path": "doc/步骤七系统用例与接口协议.md",
          "lineStart": 35,
          "lineEnd": 43,
          "reason": "退税到账不由税务机关证明，查询恢复当前授权与原号",
          "sha256": "8b9b0d38e55742d3a1f3de0654513e94ace510722685acdfbc2ea6bea6fc41ab"
        },
        {
          "path": "doc/步骤八系统用例与接口协议.md",
          "lineStart": 17,
          "lineEnd": 19,
          "reason": "权限与来源未知必须阻断，不能用技术成功替代正式事实",
          "sha256": "e2918d2051a08419256735255787e066a167ecd22e70a9bc29a278378a9c632e"
        }
      ],
      "useCaseIds": [
        "s4-filing",
        "s4-official",
        "s4-query",
        "s6-dispatch",
        "s6-official-receipt",
        "s7-dispatch",
        "s7-notice",
        "s7-recovery"
      ],
      "nodeIds": [
        "N09",
        "N19",
        "N21"
      ],
      "inputs": [
        {
          "dependencyId": "DES-3",
          "consumes": "企业授权、主管职责范围、证书用途、查询许可/时效、官方来源和人工核实规范",
          "contract": "doc/步骤四系统用例与接口协议.md；doc/步骤六系统用例与接口协议.md；doc/步骤七系统用例与接口协议.md；INT-10真实查询数据契约和许可待冻结",
          "test": "每项许可有主体、对象、动作、字段和有效期；缺项只测拒绝，不填假主管规则"
        },
        {
          "dependencyId": "SEC-07",
          "consumes": "机构回调认证、撤权、隐私最小化、旧任务证据隔离和跨主体保护基线",
          "contract": "SEC-07批准回归及证据处置约定待交付；官方机构凭据单独登记不复用供应商凭据",
          "test": "将已有回调保护案例替换为主管企业/用途，核对不串用证书或许可"
        }
      ],
      "integrationScenarios": [
        {
          "name": "授权撤销后命中旧查询缓存并收到在途官方回执",
          "setup": "主管测试适配、企业甲乙、甲原号未知办理和已缓存查询、有效后被撤销的甲许可、独立业务核实员",
          "steps": [
            "撤销甲查询及下载许可，乙尝试获取甲缓存和导出",
            "沿原任务接收可信测试回执并由授权人员保全核实",
            "尝试把税务批准标为退税到账或将未知任务直接结案"
          ],
          "assertions": [
            "旧缓存及导出不绕过撤权，乙无任何甲数据",
            "原任务证据可追溯且不跨企业推进",
            "税务批准不产生银行实收，未知仍阻断正常结案，货款三位置不变"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "主管企业证书、正式职责和申报范围、独立关务查询许可、可导出字段/时效及人工验真来源待正式确认。",
          "owner": "关务税务授权与数据合规负责人",
          "impact": "阻断官方办理和授权查询真实上线；不阻断跨企业隔离和缺证阻断设计"
        },
        {
          "question": "独立关务信息查询尚无稳定业务用例id，建议总Agent保持共用支撑标注并明确不与s4-query历史查询混同。",
          "owner": "产品与方案架构负责人",
          "impact": "影响查询能力的用例追踪和验收边界，不要求本审计新增业务用例或涨预算"
        },
        {
          "question": "官方回执撤销、证书吊销及历史证据长期核验的正式规则和材料获取渠道是什么？",
          "owner": "主管渠道与证据保全负责人",
          "impact": "阻断相应真实验签及长期核验结论；不阻断保留历史证据和拒绝未授权新请求"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "platform",
      "before": {
        "personDays": 5.5,
        "baselinePersonDays": 11,
        "subtaskCount": 3,
        "dependencies": [
          "DES-3",
          "SEC-07"
        ]
      },
      "review": "对照步骤四正式办理门禁及步骤八未知阻断规则，核对官方办理与关务资料查询授权分离；独立查询缺少稳定用例已列待确认，不冒用申报历史查询。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s4-filing",
            "s4-query",
            "s6-dispatch",
            "s7-dispatch"
          ],
          "nodeIds": [
            "N09",
            "N19",
            "N21"
          ]
        },
        {
          "useCaseIds": [
            "s4-official",
            "s4-query",
            "s6-official-receipt",
            "s7-notice"
          ],
          "nodeIds": [
            "N09",
            "N19",
            "N21"
          ]
        },
        {
          "useCaseIds": [
            "s4-query",
            "s7-notice",
            "s7-recovery"
          ],
          "nodeIds": [
            "N09",
            "N21"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "SEC-08-S1",
          "previousAction": "落实企业授权、主管证书及查询许可。",
          "currentIds": [
            "SEC-08-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "SEC-08-S2",
          "previousAction": "实现撤权停用、导出隔离和回调保护。",
          "currentIds": [
            "SEC-08-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "SEC-08-S3",
          "previousAction": "验证跨企业、过期证书及数据导出。",
          "currentIds": [
            "SEC-08-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "FIN-01": {
    "rationale": "稳定账户和流水约束已有；生产实收消费及凭证仍需实现。",
    "steps": [
      {
        "personDays": 2,
        "action": "核实收款账户持有人、用途和稳定指纹，处理账户配置版本变化",
        "logic": "账户配置以account_fingerprint为稳定身份，配置版本只记录变更（用途、状态、境内外位置）。每次变更需独立复核；变更不复制余额。fund_location_code 1境内、2境外，币种固定CNY",
        "expected": "同一真实账户只有一个稳定身份；新配置版生效后余额仍挂在原身份下",
        "test": "为同一账户新增配置版（用途从1改为2）：account_tab行数不变；用旧配置版号查询余额与新版一致；发起人自己复核被拒"
      },
      {
        "personDays": 4,
        "action": "消费已核实银行观察或人工核实证据，原子写事件1入受限、实收单和平衡凭证",
        "logic": "事务外先校验证据文件sha256与扫描结果。BEGIN READ COMMITTED：先查幂等键→锁稳定银行身份→插入实收单→fund_flow事件1（from NULL to 1）→受限账户余额→凭证与分录，一次COMMIT。同（账户指纹，银行事件键）同文返回原实收号，异文409。人工证据缺真实性证明返回422 BANK_EVIDENCE_REQUIRED，余额不变",
        "expected": "每笔真实到账只产生一个实收单和一个事件1；凭证借贷相等；未分配金额全部在受限",
        "test": "用同一银行事件分别经INT-02观察和人工证据提交：只产生一笔实收，受限增加一次。提交缺证明的人工证据：422，余额不变。运行assertions.sql 36-53行检查：无不平衡凭证、无跨身份事件"
      },
      {
        "personDays": 2,
        "action": "验证重复、同键异文、账户配置变更期间入账",
        "logic": "配置变更与入账并发时都锁稳定身份，按固定锁序；同键异文不覆盖旧实收",
        "expected": "并发下不产生重复实收；冲突有告警",
        "test": "两个线程同时消费同一观察：一个成功一个返回原号。配置变更与入账并发：两者都成功，余额只增加一次。同键改金额：409"
      }
    ],
    "risk": null,
    "audit": {
      "id": "FIN-01",
      "status": "细化",
      "summary": "原稿“消费已核实银行观察并入受限”缺少字段来源与事务配方。修订后：S1按payment_bank_account_tab核实账户持有人、用途和稳定指纹，配置版本变化不产生新余额；S2消费两条来源：INT-02已核实观察，以及人工CreateBankReceiptEvidence（eventType=1货款，manualEvidenceIntake=true）经独立核实后的证据，按（账户指纹，银行事件键）去重，事件1（NULL→桶1受限）、实收单、凭证与分录同一短事务；未匹配金额留受限；S3验证重复、异文和配置变更。付款方自报的水单只是声明，不是实收。",
      "sourceReferences": [
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 103,
          "lineEnd": 107,
          "reason": "去重键、只有银行确认才写event1、人工证据不得冒称银行回调",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/sql/step5/README.md",
          "lineStart": 32,
          "lineEnd": 38,
          "reason": "N11入账规则",
          "sha256": "bea461bd46108a1c001c74a8543c5e5f94bcac8479a78996be7b2bab52181dc5"
        },
        {
          "path": "doc/sql/step5/transaction-recipes.sql",
          "lineStart": 5,
          "lineEnd": 22,
          "reason": "N11事务配方",
          "sha256": "65c6ce76da15fa3e092897720acbc02525e466ceb12b420458ea29ec4dd299a7"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 477,
          "lineEnd": 503,
          "reason": "银行账户稳定指纹与配置版",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 572,
          "lineEnd": 612,
          "reason": "fund_flow事件与桶CHECK",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/sql/step5/assertions.sql",
          "lineStart": 49,
          "lineEnd": 53,
          "reason": "银行事件与稳定身份一一对应",
          "sha256": "385a55fc3f3ca46861b1d46498251794d5a541a49a2f00b563fb3fcacc779c91"
        },
        {
          "path": "proto/trade/funds/v1/funds.proto",
          "lineStart": 300,
          "lineEnd": 315,
          "reason": "BankReceiptEvidenceInput字段",
          "sha256": "67a2059e55f0d75dba9d4a298a0f5bb9db274ef43240b13f16c617d7ba84282c"
        },
        {
          "path": "交付成果/assets/step-five-usecases-model.js",
          "lineStart": 42,
          "lineEnd": 69,
          "reason": "s5-n11用例",
          "sha256": "e84dced883248e2c4ccb67b263e5ded195856f82f104f740bc0a7b256e2161b5"
        }
      ],
      "useCaseIds": [
        "s5-n11-receipt"
      ],
      "nodeIds": [
        "N11"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "第1期资金事务锁序与观察存储设计",
          "contract": "待DES-1冻结；doc/步骤五系统用例与接口协议.md 170-182行",
          "test": "核对锁序表"
        },
        {
          "dependencyId": "DM-08",
          "consumes": "资金事件码与去重唯一键",
          "contract": "doc/sql/domain/schema.sql 572-612行",
          "test": "执行重复插入，确认唯一键冲突"
        },
        {
          "dependencyId": "DM-09",
          "consumes": "凭证平衡与只追加冲正",
          "contract": "doc/sql/domain/schema.sql 664-713行",
          "test": "检查凭证总额等于借方合计"
        },
        {
          "dependencyId": "INT-02",
          "consumes": "已核实原始观察（账户指纹、银行事件键、金额、时间、来源文件版本）",
          "contract": "INT-02交付；观察存储待DES-1冻结",
          "test": "取一条已核实观察，确认字段齐全"
        }
      ],
      "integrationScenarios": [
        {
          "name": "人工证据与银行观察同时到达",
          "setup": "同一笔100万元到账；网银回单人工上传，同时银行推送通知",
          "steps": [
            "两条路径并发提交",
            "查询实收与受限余额"
          ],
          "assertions": [
            "只有一笔实收",
            "受限增加100万一次",
            "两份来源都挂在同一实收下"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "funds.proto只有人工CreateBankReceiptEvidence(manual_evidence_intake)和FundsReleaseInput.bank_available_evidence，47张领域表中没有银行流水、余额文件或原始观察收件表。INT-02/03的自动观察要落到哪张基础设施表、采用什么去重键、由谁消费，需要DES-1冻结",
          "owner": "第1期方案设计负责人",
          "impact": "阻断INT-02/03自动观察的持久化和FIN-01/04/07的自动消费；不阻断人工证据入口、受限入账和缺证据422路径"
        },
        {
          "question": "流程N11/N13写CNH，DDL只允许currency_code=CNY，并以fund_location_code 1境内/2境外区分。银行报文中的CNH要按账户配置映射为CNY+位置2，这一规则需要确认是否被财务和银行接受",
          "owner": "财务负责人",
          "impact": "阻断境外人民币账户的报文映射和对账口径；境内CNY账户不受影响"
        },
        {
          "question": "步骤五用例编号N11-N17与业务流程节点含义不一致：例如流程N12是预开INVOICE，用例s5-n12是来款分配；流程N13是银行贸易核验，用例s5-n13是INVOICE与服务费。本稿nodeIds按实际流程节点含义填写",
          "owner": "第1期方案设计负责人",
          "impact": "影响用例与流程追溯表；不影响开发范围"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "funds",
      "before": {
        "personDays": 4,
        "baselinePersonDays": 8,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "DM-08",
          "DM-09",
          "INT-02"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s5-n11-receipt"
          ],
          "nodeIds": [
            "N11"
          ]
        },
        {
          "useCaseIds": [
            "s5-n11-receipt"
          ],
          "nodeIds": [
            "N11"
          ]
        },
        {
          "useCaseIds": [
            "s5-n11-receipt"
          ],
          "nodeIds": [
            "N11"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "FIN-01-S1",
          "previousAction": "实现账户持有人、稳定指纹和变更版本核实。",
          "currentIds": [
            "FIN-01-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FIN-01-S2",
          "previousAction": "消费已核实银行观察并原子入受限及平衡凭证。",
          "currentIds": [
            "FIN-01-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FIN-01-S3",
          "previousAction": "验证重复、异文及账户变更。",
          "currentIds": [
            "FIN-01-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "FIN-02": {
    "rationale": "分配模型已有，计事务实现和独立复核，不重复原始账单解析。",
    "steps": [
      {
        "personDays": 3,
        "action": "实现一款多交易和一交易多款的毛额分配",
        "logic": "输入：实收号、交易号、金额、BL-04批准快照版本。锁序：幂等→交易根→批准快照→稳定银行身份→实收→分配（按号）。当前读后以DECIMAL校验：有效分配合计+本次≤实收毛额。分配不移动桶，金额仍在受限",
        "expected": "分配后未匹配=实收-有效分配；受限余额不变",
        "test": "100万实收分配给交易甲 60万、交易乙 30万：未匹配10万，受限仍100万。再给交易丙分配20万：拒绝超额"
      },
      {
        "personDays": 2,
        "action": "实现独立复核与撤销、改额",
        "logic": "分配创建后为待复核，复核人不得为创建人；复核通过才有效。撤销或改额追加新记录关联原行，原行保留原因",
        "expected": "待复核分配不出现在可释放和可付款额度中；历史可查",
        "test": "创建人复核：拒绝。另一人复核：生效。撤销后查询：原行存在、状态撤销、未匹配恢复"
      },
      {
        "personDays": 2,
        "action": "验证并发超分、重复提交和撤销历史",
        "logic": "并发请求都先锁交易根和实收，当前读保证合计不超；同幂等键同文返回原分配，异文409",
        "expected": "任何并发顺序下有效分配合计≤实收",
        "test": "两个线程同时各分配60万（实收100万）：一个成功、一个超额拒绝。同键重复提交：同号。运行assertions.sql 26-34行：无违规"
      }
    ],
    "risk": null,
    "audit": {
      "id": "FIN-02",
      "status": "细化",
      "summary": "原稿缺并发超分的锁序和守恒公式。修订后：S1按“实收毛额=有效分配+未匹配”实现一款多交易、一交易多款，锁交易根、批准快照、稳定银行身份、实收，再按分配号排序FOR UPDATE当前读；S2分配创建与复核分离，待复核不算有效、不提供付款额度，撤销或改额保留原行；S3验证并发超分、重复和撤销历史。流程上分配发生在节点N11（按水单附言逐笔匹配），后续节点N12预开INVOICE只针对已分配金额。",
      "sourceReferences": [
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 103,
          "lineEnd": 107,
          "reason": "毛额守恒、锁序、创建与复核分离",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/sql/step5/transaction-recipes.sql",
          "lineStart": 24,
          "lineEnd": 46,
          "reason": "分配事务配方",
          "sha256": "65c6ce76da15fa3e092897720acbc02525e466ceb12b420458ea29ec4dd299a7"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 545,
          "lineEnd": 568,
          "reason": "allocation表",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/sql/step5/assertions.sql",
          "lineStart": 26,
          "lineEnd": 34,
          "reason": "分配边界：released≤allocated、occupied≤released",
          "sha256": "385a55fc3f3ca46861b1d46498251794d5a541a49a2f00b563fb3fcacc779c91"
        },
        {
          "path": "交付成果/assets/step-five-usecases-model.js",
          "lineStart": 70,
          "lineEnd": 97,
          "reason": "s5-n12用例",
          "sha256": "e84dced883248e2c4ccb67b263e5ded195856f82f104f740bc0a7b256e2161b5"
        },
        {
          "path": "交付成果/assets/business-data.js",
          "lineStart": 131,
          "lineEnd": 138,
          "reason": "N11逐笔匹配与N12只按已分配额开INVOICE",
          "sha256": "f4a37559a4f207c4918d9aad7bf57593a63d47e44c6c9cec34ef01ff9c77e33b"
        }
      ],
      "useCaseIds": [
        "s5-n12-allocation"
      ],
      "nodeIds": [
        "N11",
        "N12"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "锁序与事务预算",
          "contract": "doc/步骤五系统用例与接口协议.md 170-182行",
          "test": "核对锁序"
        },
        {
          "dependencyId": "FIN-01",
          "consumes": "实收单、稳定银行身份、受限余额",
          "contract": "FIN-01交付",
          "test": "查询一笔实收确认受限金额"
        },
        {
          "dependencyId": "BL-04",
          "consumes": "签约交易依据批准快照版本",
          "contract": "BL-04交付",
          "test": "确认快照版本号可锁定"
        }
      ],
      "integrationScenarios": [
        {
          "name": "一款三交易并发分配",
          "setup": "实收100万，三个交易同时分配",
          "steps": [
            "三个经办并发提交",
            "两名复核员分别复核"
          ],
          "assertions": [
            "合计≤100万",
            "待复核金额不可付款",
            "受限余额始终100万"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "步骤五用例编号N11-N17与业务流程节点含义不一致：例如流程N12是预开INVOICE，用例s5-n12是来款分配；流程N13是银行贸易核验，用例s5-n13是INVOICE与服务费。本稿nodeIds按实际流程节点含义填写",
          "owner": "第1期方案设计负责人",
          "impact": "影响用例与流程追溯表；不影响开发范围"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "funds",
      "before": {
        "personDays": 3.5,
        "baselinePersonDays": 7,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "FIN-01",
          "BL-04"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s5-n12-allocation"
          ],
          "nodeIds": [
            "N11"
          ]
        },
        {
          "useCaseIds": [
            "s5-n12-allocation"
          ],
          "nodeIds": [
            "N11",
            "N12"
          ]
        },
        {
          "useCaseIds": [
            "s5-n12-allocation"
          ],
          "nodeIds": [
            "N11"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "FIN-02-S1",
          "previousAction": "实现一款多交易和一交易多款的毛额分配。",
          "currentIds": [
            "FIN-02-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FIN-02-S2",
          "previousAction": "实现独立复核与撤销替代。",
          "currentIds": [
            "FIN-02-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FIN-02-S3",
          "previousAction": "验证并发超分、重复和撤销历史。",
          "currentIds": [
            "FIN-02-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "FIN-03": {
    "rationale": "发票复用审核与材料能力；服务费实现和费用联核移交结算包，不在两处重复建设。",
    "steps": [
      {
        "personDays": 2,
        "action": "实现INVOICE确切版、独立审核、申报和付款方只读",
        "logic": "INVOICE按交易号和已有效分配金额预开，金额不得超出分配；补正新建版本关联原版，不覆盖；审核人不得为制单人；付款方只能查看。申报和补正只保存申报及审核版本，不形成银行实收或可用事实",
        "expected": "INVOICE不改变资金桶，不表示银行已入账",
        "test": "开票金额超分配：拒绝。补正：新版本关联旧版，旧版只读。付款方尝试修改：403"
      },
      {
        "personDays": 1,
        "action": "联调发票补正、版本冲突及付款方只读。",
        "logic": "补正新建不可变版本并关联旧版，独立审核只批准当前确切版；付款方只能读取本方已审有效发票。提交、补正及重试不调用服务费结算，也不写银行事实。",
        "expected": "原版和修订链均保留；同键重放返回原结果，旧标签不能覆盖当前版，发票操作不改变余额。",
        "test": "用旧标签补正应412且版本不变；付款方写入应403。由不同人员审核后连续补正两次，再原键重放，核对修订链和受理唯一；event12数量、资金余额及银行事实均不因发票操作变化。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "FIN-03",
      "status": "细化",
      "summary": "发票包只负责确切版、独立审核、申报、补正及付款方只读。原服务费实现和费用联核的4个基线人日转入结算包；发票提交、补正及重试均不收费，整体范围和总投入不增加。",
      "sourceReferences": [
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 109,
          "lineEnd": 118,
          "reason": "INVOICE不触发服务费；固定CNY 300由吉尔吉斯斯坦付款方承担，首次获批分账时按trade_number+agency_service_fee幂等记event 12（桶2转列贸易代理商服务费）；event 8/9/10为历史兼容，银行费用仍为event 11",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 197,
          "lineEnd": 197,
          "reason": "服务费同幂等键重放返回原event12，不重复结算",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 203,
          "lineEnd": 209,
          "reason": "服务费流程文字修订建议：INVOICE不触发，余额/授权/核验不足不扣费",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/sql/step5/transaction-recipes.sql",
          "lineStart": 48,
          "lineEnd": 82,
          "reason": "N13 INVOICE不创建服务费事件；N15首次获批分账锁event 12行，校验授权、核验和桶2≥300后一次追加，重放返回原事件",
          "sha256": "65c6ce76da15fa3e092897720acbc02525e466ceb12b420458ea29ec4dd299a7"
        },
        {
          "path": "proto/trade/funds/v1/funds.proto",
          "lineStart": 251,
          "lineEnd": 262,
          "reason": "历史审计快照；当前规则已统一为D承担、首次获批分账时event12结算，旧event8/9/10仅历史兼容。",
          "sha256": "67a2059e55f0d75dba9d4a298a0f5bb9db274ef43240b13f16c617d7ba84282c"
        },
        {
          "path": "proto/trade/funds/v1/funds.proto",
          "lineStart": 300,
          "lineEnd": 315,
          "reason": "历史审计快照；当前规则已统一为D承担、首次获批分账时event12结算，旧event8/9/10仅历史兼容。",
          "sha256": "67a2059e55f0d75dba9d4a298a0f5bb9db274ef43240b13f16c617d7ba84282c"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 579,
          "lineEnd": 579,
          "reason": "历史审计快照；当前规则已统一为D承担、首次获批分账时event12结算，旧event8/9/10仅历史兼容。",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 598,
          "lineEnd": 609,
          "reason": "历史审计快照；当前规则已统一为D承担、首次获批分账时event12结算，旧event8/9/10仅历史兼容。",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/sql/step5/assertions.sql",
          "lineStart": 4,
          "lineEnd": 24,
          "reason": "历史审计快照；当前规则已统一为D承担、首次获批分账时event12结算，旧event8/9/10仅历史兼容。",
          "sha256": "385a55fc3f3ca46861b1d46498251794d5a541a49a2f00b563fb3fcacc779c91"
        },
        {
          "path": "doc/sql/step5/assertions.sql",
          "lineStart": 55,
          "lineEnd": 62,
          "reason": "历史审计快照；当前规则已统一为D承担、首次获批分账时event12结算，旧event8/9/10仅历史兼容。",
          "sha256": "385a55fc3f3ca46861b1d46498251794d5a541a49a2f00b563fb3fcacc779c91"
        },
        {
          "path": "doc/examples/step5/fee-evidence-cases.json",
          "lineStart": 1,
          "lineEnd": 34,
          "reason": "历史审计快照；当前规则已统一为D承担、首次获批分账时event12结算，旧event8/9/10仅历史兼容。",
          "sha256": "75aae69b0da0481c2993399165d9cef9b2e1ac0f80bbde2a1768accd16de9c32"
        },
        {
          "path": "交付成果/assets/business-data.js",
          "lineStart": 95,
          "lineEnd": 98,
          "reason": "流程N02：固定300元由吉尔吉斯斯坦付款方承担，首次获批分账时结算",
          "sha256": "f4a37559a4f207c4918d9aad7bf57593a63d47e44c6c9cec34ef01ff9c77e33b"
        },
        {
          "path": "交付成果/assets/step-five-usecases-model.js",
          "lineStart": 98,
          "lineEnd": 122,
          "reason": "s5-n13用例：INVOICE申报、补件、改版或重试不触发服务费",
          "sha256": "e84dced883248e2c4ccb67b263e5ded195856f82f104f740bc0a7b256e2161b5"
        },
        {
          "path": "交付成果/assets/step-five-usecases-model.js",
          "lineStart": 359,
          "lineEnd": 361,
          "reason": "规则：INVOICE不形成银行事实；event 12从可用余额转列，不伪造银行扣款",
          "sha256": "e84dced883248e2c4ccb67b263e5ded195856f82f104f740bc0a7b256e2161b5"
        },
        {
          "path": "doc/步骤八系统用例与接口协议.md",
          "lineStart": 26,
          "lineEnd": 26,
          "reason": "早期结案材料曾采用供应商独立服务费实收口径；当前源文档已改为勾稽D授权、event12、可用余额及A合同应付",
          "sha256": "e2918d2051a08419256735255787e066a167ecd22e70a9bc29a278378a9c632e"
        }
      ],
      "useCaseIds": [
        "s5-n13-invoice-fee"
      ],
      "nodeIds": [
        "N12"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "发票确切版、独立审核、补正及付款方只读的冻结契约。",
          "contract": "doc/步骤五系统用例与接口协议.md 109-118、203-209行",
          "test": "核对固定金额、D承担、event12、首次获批分账触发、授权/可用余额门禁及A应付不变"
        },
        {
          "dependencyId": "FIN-02",
          "consumes": "有效分配金额",
          "contract": "FIN-02交付",
          "test": "确认INVOICE上限取有效分配"
        }
      ],
      "integrationScenarios": [
        {
          "name": "发票补正及独立审核不产生资金事实",
          "setup": "有效分配已确认；发票经办、独立审核人及付款方为不同合成账号。",
          "steps": [
            "创建发票并由另一人审核。",
            "补正两次并用原键重放，检查各确切版。",
            "用旧标签补正，并让付款方尝试写入。"
          ],
          "assertions": [
            "发票金额不超有效分配，原版和修订链可追溯。",
            "旧标签及付款方写入拒绝，重放不重复新建。",
            "发票操作不生成服务费、银行事实或资金事件。"
          ]
        }
      ],
      "openQuestions": [],
      "estimateChange": {
        "oldBaseline": 7,
        "newBaseline": 3,
        "reason": "服务费实现3个基线人日及费用联核1个基线人日转入FIN-05；发票保留3个基线人日，独立审核和补正检查不删除。"
      },
      "dependencyChanges": {
        "add": [],
        "remove": [
          "BL-05"
        ]
      },
      "agent": "funds",
      "before": {
        "personDays": 3.5,
        "baselinePersonDays": 7,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "FIN-02",
          "BL-05"
        ]
      },
      "review": "总Agent依据步骤五发票不收费及首次获批分账收费规则，将4个基线人日移交结算包，核对跨包旧新引用、领域约束和授权交接。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s5-n13-invoice-fee"
          ],
          "nodeIds": [
            "N12"
          ]
        },
        {
          "useCaseIds": [
            "s5-n13-invoice-fee"
          ],
          "nodeIds": [
            "N12"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "FIN-03-S1",
          "previousAction": "实现确切发票版、独审、申报及付款方只读。",
          "currentIds": [
            "FIN-03-S1",
            "FIN-03-S2"
          ],
          "reason": "发票实现及补正、只读和冲突联调留本包。"
        },
        {
          "previousId": "FIN-03-S2",
          "previousAction": "实现首次申报完成后的独立300元账单及实收核实。",
          "currentIds": [
            "FIN-05-S4"
          ],
          "reason": "按已确认的付款方承担及分账收费口径，将实现转入结算包。"
        },
        {
          "previousId": "FIN-03-S3",
          "previousAction": "验证补正、重试和独立账务。",
          "currentIds": [
            "FIN-03-S2",
            "FIN-05-S4"
          ],
          "reason": "发票不收费回归留本包；收费与费用分离联核转结算包，原检查不删除。"
        }
      ]
    }
  },
  "FIN-04": {
    "rationale": "部分释放和来源范围不可省略，保留资金并发测试。",
    "steps": [
      {
        "personDays": 3,
        "action": "实现核验范围、银行可用证据校验和部分释放计算",
        "logic": "事务外校验证据文件。核验范围＝交易+分配+INVOICE+金额；证据金额、账户指纹、范围一致才可用；同一证据不能释放两次",
        "expected": "只按证据金额释放，剩余留受限",
        "test": "证据60万对应分配100万：只可释放60万。同一证据再次使用：拒绝"
      },
      {
        "personDays": 3,
        "action": "原子写事件3、更新released与受限/可用、生成平衡凭证",
        "logic": "BEGIN RC，查幂等→锁交易根→稳定身份→实收→核验单→分配按号→账户按号，当前读；COMMIT一次",
        "expected": "事件3金额=释放金额，受限减少、可用增加相同金额",
        "test": "释放60万后：受限-60万、可用+60万、released=60万、凭证平衡"
      },
      {
        "personDays": 2,
        "action": "验证缺证据、重复来源和并发释放",
        "logic": "缺证据返回422，余额不变；并发释放受released≤allocated约束",
        "expected": "不出现超释放",
        "test": "无证据释放：422。两个线程同时释放同一分配各60万（分配100万）：一个失败"
      }
    ],
    "risk": null,
    "audit": {
      "id": "FIN-04",
      "status": "细化",
      "summary": "原稿“绑定实际核验范围和银行可用证据”补充实现细节：内部核验通过不是银行可用证明。修订后：S1核验范围绑定交易、分配、INVOICE和金额，只有真实银行可用证据（FundsReleaseInput.bank_available_evidence，来源INT-03或人工网银回单经独立核实）与同一范围金额匹配时才释放；S2事件3（桶1→2）、released_amount、控制账户与凭证同一短事务，可部分释放；S3验证重复来源、缺证据和并发释放。",
      "sourceReferences": [
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 120,
          "lineEnd": 125,
          "reason": "贸易核验与实际可用、部分释放",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "proto/trade/funds/v1/funds.proto",
          "lineStart": 357,
          "lineEnd": 375,
          "reason": "FundsReleaseInput",
          "sha256": "67a2059e55f0d75dba9d4a298a0f5bb9db274ef43240b13f16c617d7ba84282c"
        },
        {
          "path": "doc/sql/step5/README.md",
          "lineStart": 56,
          "lineEnd": 62,
          "reason": "N14独立贸易审核与可用释放：缺真实银行可用证据保持受限，event 3桶1→2与released及分录同事务",
          "sha256": "bea461bd46108a1c001c74a8543c5e5f94bcac8479a78996be7b2bab52181dc5"
        },
        {
          "path": "交付成果/assets/step-five-usecases-model.js",
          "lineStart": 276,
          "lineEnd": 288,
          "reason": "N14时序：缺证据422 BANK_AVAILABILITY_EVIDENCE_REQUIRED",
          "sha256": "e84dced883248e2c4ccb67b263e5ded195856f82f104f740bc0a7b256e2161b5"
        },
        {
          "path": "doc/sql/step5/assertions.sql",
          "lineStart": 26,
          "lineEnd": 34,
          "reason": "released≤allocated",
          "sha256": "385a55fc3f3ca46861b1d46498251794d5a541a49a2f00b563fb3fcacc779c91"
        },
        {
          "path": "交付成果/assets/business-data.js",
          "lineStart": 139,
          "lineEnd": 146,
          "reason": "流程N13银行核验入账与可用、N14核对",
          "sha256": "f4a37559a4f207c4918d9aad7bf57593a63d47e44c6c9cec34ef01ff9c77e33b"
        }
      ],
      "useCaseIds": [
        "s5-n14-verification-release"
      ],
      "nodeIds": [
        "N13",
        "N14"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "释放规则与锁序",
          "contract": "doc/步骤五系统用例与接口协议.md 120-125行",
          "test": "核对规则"
        },
        {
          "dependencyId": "FIN-03",
          "consumes": "已申报INVOICE",
          "contract": "FIN-03交付",
          "test": "确认INVOICE状态"
        },
        {
          "dependencyId": "DM-09",
          "consumes": "凭证与分录",
          "contract": "DM-09交付",
          "test": "确认凭证平衡检查"
        }
      ],
      "integrationScenarios": [
        {
          "name": "部分可用释放",
          "setup": "分配100万，银行只确认60万可用",
          "steps": [
            "提交核验与证据",
            "释放"
          ],
          "assertions": [
            "可用60万、受限40万",
            "无事件推断付款"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "funds.proto只有人工CreateBankReceiptEvidence(manual_evidence_intake)和FundsReleaseInput.bank_available_evidence，47张领域表中没有银行流水、余额文件或原始观察收件表。INT-02/03的自动观察要落到哪张基础设施表、采用什么去重键、由谁消费，需要DES-1冻结",
          "owner": "第1期方案设计负责人",
          "impact": "阻断INT-02/03自动观察的持久化和FIN-01/04/07的自动消费；不阻断人工证据入口、受限入账和缺证据422路径"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "funds",
      "before": {
        "personDays": 4,
        "baselinePersonDays": 8,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "FIN-03",
          "DM-09"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s5-n14-verification-release"
          ],
          "nodeIds": [
            "N13"
          ]
        },
        {
          "useCaseIds": [
            "s5-n14-verification-release"
          ],
          "nodeIds": [
            "N13",
            "N14"
          ]
        },
        {
          "useCaseIds": [
            "s5-n14-verification-release"
          ],
          "nodeIds": [
            "N13"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "FIN-04-S1",
          "previousAction": "实现核验范围、银行实际可用证据和部分释放。",
          "currentIds": [
            "FIN-04-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FIN-04-S2",
          "previousAction": "原子更新受限与可用并生成平衡凭证。",
          "currentIds": [
            "FIN-04-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FIN-04-S3",
          "previousAction": "验证重复来源、缺证和并发释放。",
          "currentIds": [
            "FIN-04-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "FIN-05": {
    "rationale": "复用正式合同及关务证据读接口，分别计算两类付款条件。",
    "steps": [
      {
        "personDays": 3,
        "action": "实现应付、已付、锁额、授权第三方扣款和实际银行费用的精确结算",
        "logic": "事务外读取合同、INVOICE、FIN-04已释放金额和银行费用凭证的固定版本。BEGIN RC，先查结算原键→锁交易根→批准版→结算单→按号锁分配和账户，当前读已付、锁额、有效分配和未决差异。授权第三方扣款必须有收费适用授权（码14）；银行费用单列；固定300元服务费只在首次获批分账时从D已核验可用余额按event12结算，需D授权及正式收费依据，不作为中国供应商合同应付扣项且不进入应付净额。",
        "expected": "结算单列出每一项来源版本；净额只用真实可用资金覆盖，不足时显示缺口，不生成垫资",
        "test": "构造应付100万、已付20万、锁额10万、授权扣款1万、银行费用50元、服务费300元：净额=100-20-10-1万-50元，服务费不出现在扣减项；可用只有60万时显示缺口"
      },
      {
        "personDays": 3,
        "action": "实现预付款与出口后付款分支和要求码逐项核对",
        "logic": "预付款：1 中国供应商-贸易代理商协议、2 贸易代理商指定/认可出口报关代理、3 中国供应商委任同一出口报关代理、4 中国供应商-出口报关代理协议、5电子委托、6金额/CNY/批次/审批、11 吉尔吉斯斯坦付款方实收匹配、12银行条件、13批准净额、14收费授权。出口后：1、3、5-14，其中7 中国供应商批准最终稿、8申报件列贸易代理商为境内发货人、9 贸易代理商已收到、10正式放行。每码绑定证据确切版本；缺任一码返回422并列出缺码",
        "expected": "两分支证据集合不混用，批准后结算版本冻结；分账收费仅按event12转列可用余额，不提前锁定货款付款额。",
        "test": "出口后付款缺码10：返回缺码列表含10，无decision记录。预付款证据中用汇款水单代替码11：拒绝。制单人自己审批：拒绝。齐全时另一人审批：结算冻结，货款付款锁额不变；首次分账的300元服务费及可用余额、凭证变化符合本包收费步骤"
      },
      {
        "personDays": 2,
        "action": "验证依据改版后的批准前重核、费用差异和并发申请",
        "logic": "修正只能新建关联版本，不覆盖原结算。结算审批和付款批准前读取当前交易/合同版本和INVOICE版本（步骤五第156行），所引用版本已不是当前有效版本时拒绝批准并提示重新结算。合同新草稿或只签署未生效的新版本不改变旧有效版本；替代生效后旧结算的确切失效范围见FIN-11待确认项，本包不自行判定自动失效时点。同一交易并发结算靠交易根锁串行",
        "expected": "重核只在批准动作时拦截引用非当前版本的结算；修正形成新关联版本；并发不产生两个有效结算；费用差异进入差异单",
        "test": "有权者确认合同新版本生效、旧版6→7后，对引用旧版的结算发起审批：拒绝并提示新版本，无资金事件。新版本只签署（状态5）时，审批引用旧有效版的结算：不因新版本被拒。两个并发结算请求：一个成功、一个返回冲突。银行费用凭证金额与结算列示不一致：结算标记差异，转FIN-08"
      },
      {
        "personDays": 4,
        "action": "实现首次获批分账的一次服务费结算及费用分离联核。",
        "logic": "按已确认规则实现每交易一次固定CNY 300服务费：D承担，仅在首次获批分账时以trade_number+agency_service_fee幂等追加event12，从D已核验可用余额结算。须有贸易核验、可用余额证据、D授权及正式收费依据；同事务写事件、凭证和分账结果。INVOICE申报、补件、改版和重试不触发收费；余额不足、授权缺失或差异未决时不扣费且阻断本次分账。事件8/9/10仅为历史兼容，不减少A合同应付。复用资金领域包的事件和事务约束，不在发票包重复实现。分别核对A合同应付、D的event12服务费结算、银行实际费用event11及供应商银行到账；服务费占用D已核验可用余额，但不作为A合同应付扣项。按实际收费事实与银行证据勾稽，收费事件和分账批准原子提交，历史兼容事件不得产生新收费。",
        "expected": "每笔交易最多一次event12；重放不重复扣费，A合同应付不变；缺少授权、收费依据或可用余额时不产生费用或完成分账。 结算的中国供应商应付净额中不出现服务费；银行费用和服务费各自勾稽",
        "test": "INVOICE提交及补正后event12数量为0；首次获批分账且所有收费门禁齐备时只记一笔300元event12并扣减D可用余额。原键重放不再扣费；可用余额299.99、缺D授权或有未决差异时拒绝且不写event12。 一笔交易核对D可用余额减少300元且仅有一个event12、A合同应付不变；50元银行费用只记event11并关联真实凭证。重放不重复收费，缺D授权或收费依据时不写event12，缺银行费用证据时不生成银行扣款。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "FIN-05",
      "status": "细化",
      "summary": "按闭合要求码核对预付款及出口后付款的确切证据，由不同人员审批。接收原发票包的服务费实现和费用联核，共4个基线人日：付款方承担固定300元，首次获批分账时从已核验可用余额结算event12，不减少中国供应商合同应付；发票不收费。结算批准不提前锁定货款，但不能将服务费转列误判为账户所有字段不变。依据改版、并发及费用差异仍分别检查。",
      "sourceReferences": [
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 127,
          "lineEnd": 152,
          "reason": "结算列示项与付款要求码1-14、两分支",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "proto/trade/funds/v1/funds.proto",
          "lineStart": 377,
          "lineEnd": 425,
          "reason": "结算与审批消息",
          "sha256": "67a2059e55f0d75dba9d4a298a0f5bb9db274ef43240b13f16c617d7ba84282c"
        },
        {
          "path": "交付成果/assets/step-five-usecases-model.js",
          "lineStart": 289,
          "lineEnd": 306,
          "reason": "N15时序：缺项或审批人同制单人ROLLBACK",
          "sha256": "e84dced883248e2c4ccb67b263e5ded195856f82f104f740bc0a7b256e2161b5"
        },
        {
          "path": "交付成果/assets/business-data.js",
          "lineStart": 147,
          "lineEnd": 154,
          "reason": "流程N15预付款与N16出口后付款条件",
          "sha256": "f4a37559a4f207c4918d9aad7bf57593a63d47e44c6c9cec34ef01ff9c77e33b"
        },
        {
          "path": "doc/sql/step5/transaction-recipes.sql",
          "lineStart": 84,
          "lineEnd": 117,
          "reason": "审批与锁额事务配方",
          "sha256": "65c6ce76da15fa3e092897720acbc02525e466ceb12b420458ea29ec4dd299a7"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 156,
          "lineEnd": 156,
          "reason": "付款批准前复核交易/合同版本及预付款或出口后证据",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 109,
          "lineEnd": 118,
          "reason": "INVOICE不触发服务费；固定CNY 300由吉尔吉斯斯坦付款方承担，首次获批分账时按trade_number+agency_service_fee幂等记event 12（桶2转列贸易代理商服务费）；event 8/9/10为历史兼容，银行费用仍为event 11",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 197,
          "lineEnd": 197,
          "reason": "服务费同幂等键重放返回原event12，不重复结算",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 203,
          "lineEnd": 209,
          "reason": "服务费流程文字修订建议：INVOICE不触发，余额/授权/核验不足不扣费",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/sql/step5/transaction-recipes.sql",
          "lineStart": 48,
          "lineEnd": 82,
          "reason": "N13 INVOICE不创建服务费事件；N15首次获批分账锁event 12行，校验授权、核验和桶2≥300后一次追加，重放返回原事件",
          "sha256": "65c6ce76da15fa3e092897720acbc02525e466ceb12b420458ea29ec4dd299a7"
        },
        {
          "path": "proto/trade/funds/v1/funds.proto",
          "lineStart": 251,
          "lineEnd": 262,
          "reason": "历史审计快照；当前规则已统一为D承担、首次获批分账时event12结算，旧event8/9/10仅历史兼容。",
          "sha256": "67a2059e55f0d75dba9d4a298a0f5bb9db274ef43240b13f16c617d7ba84282c"
        },
        {
          "path": "proto/trade/funds/v1/funds.proto",
          "lineStart": 300,
          "lineEnd": 315,
          "reason": "历史审计快照；当前规则已统一为D承担、首次获批分账时event12结算，旧event8/9/10仅历史兼容。",
          "sha256": "67a2059e55f0d75dba9d4a298a0f5bb9db274ef43240b13f16c617d7ba84282c"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 579,
          "lineEnd": 579,
          "reason": "历史审计快照；当前规则已统一为D承担、首次获批分账时event12结算，旧event8/9/10仅历史兼容。",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 598,
          "lineEnd": 609,
          "reason": "历史审计快照；当前规则已统一为D承担、首次获批分账时event12结算，旧event8/9/10仅历史兼容。",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/sql/step5/assertions.sql",
          "lineStart": 4,
          "lineEnd": 24,
          "reason": "历史审计快照；当前规则已统一为D承担、首次获批分账时event12结算，旧event8/9/10仅历史兼容。",
          "sha256": "385a55fc3f3ca46861b1d46498251794d5a541a49a2f00b563fb3fcacc779c91"
        },
        {
          "path": "doc/sql/step5/assertions.sql",
          "lineStart": 55,
          "lineEnd": 62,
          "reason": "历史审计快照；当前规则已统一为D承担、首次获批分账时event12结算，旧event8/9/10仅历史兼容。",
          "sha256": "385a55fc3f3ca46861b1d46498251794d5a541a49a2f00b563fb3fcacc779c91"
        },
        {
          "path": "doc/examples/step5/fee-evidence-cases.json",
          "lineStart": 1,
          "lineEnd": 34,
          "reason": "历史审计快照；当前规则已统一为D承担、首次获批分账时event12结算，旧event8/9/10仅历史兼容。",
          "sha256": "75aae69b0da0481c2993399165d9cef9b2e1ac0f80bbde2a1768accd16de9c32"
        },
        {
          "path": "交付成果/assets/business-data.js",
          "lineStart": 95,
          "lineEnd": 98,
          "reason": "流程N02：固定300元由吉尔吉斯斯坦付款方承担，首次获批分账时结算",
          "sha256": "f4a37559a4f207c4918d9aad7bf57593a63d47e44c6c9cec34ef01ff9c77e33b"
        },
        {
          "path": "交付成果/assets/step-five-usecases-model.js",
          "lineStart": 98,
          "lineEnd": 122,
          "reason": "s5-n13用例：INVOICE申报、补件、改版或重试不触发服务费",
          "sha256": "e84dced883248e2c4ccb67b263e5ded195856f82f104f740bc0a7b256e2161b5"
        },
        {
          "path": "交付成果/assets/step-five-usecases-model.js",
          "lineStart": 359,
          "lineEnd": 361,
          "reason": "规则：INVOICE不形成银行事实；event 12从可用余额转列，不伪造银行扣款",
          "sha256": "e84dced883248e2c4ccb67b263e5ded195856f82f104f740bc0a7b256e2161b5"
        },
        {
          "path": "doc/步骤八系统用例与接口协议.md",
          "lineStart": 26,
          "lineEnd": 26,
          "reason": "早期结案材料曾采用供应商独立服务费实收口径；当前源文档已改为勾稽D授权、event12、可用余额及A合同应付",
          "sha256": "e2918d2051a08419256735255787e066a167ecd22e70a9bc29a278378a9c632e"
        }
      ],
      "useCaseIds": [
        "s5-n15-settlement"
      ],
      "nodeIds": [
        "N14",
        "N15",
        "N16"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "结算规则与要求码表冻结稿",
          "contract": "doc/步骤五系统用例与接口协议.md 127-152行",
          "test": "对照14个码逐项确认证据来源"
        },
        {
          "dependencyId": "FIN-04",
          "consumes": "已释放可用额与释放事件",
          "contract": "FIN-04交付",
          "test": "查询交易可用额与released投影一致"
        },
        {
          "dependencyId": "BL-09",
          "consumes": "人工核实的海关放行事实（码10）",
          "contract": "BL-09交付",
          "test": "取一条核实放行，确认带确切回执版本"
        },
        {
          "dependencyId": "BL-05",
          "consumes": "中国供应商-贸易代理商、中国供应商-出口报关代理协议及线下签署核实（码1、4）；正式收费合同依据及付款方授权。",
          "contract": "BL-05交付",
          "test": "确认合同版本可锁定引用"
        },
        {
          "dependencyId": "DM-08",
          "consumes": "服务费event12、每交易唯一键、可用余额及凭证的原子事务约束。",
          "contract": "doc/sql/domain/schema.sql及doc/步骤五系统用例与接口协议.md的服务费与锁序约定。",
          "test": "核对首次分账只结算一次；缺付款方授权、收费依据或余额不足时无event12、余额和凭证副作用，重放返回原结果。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "出口后付款缺放行",
          "setup": "合同、委托、最终稿确认齐全，海关放行尚未核实；另有付款方授权、正式收费依据及足以覆盖服务费和货款的已核验可用余额。",
          "steps": [
            "申请出口后结算",
            "BL-09核实放行后重新提交",
            "另一人审批"
          ],
          "assertions": [
            "第一次返回缺码10，无锁额",
            "第二次通过并冻结结算",
            "结算批准不提前生成货款付款锁额；首次分账服务费转列event12，可用余额减少300元而中国供应商合同应付不变。"
          ]
        },
        {
          "name": "分账收费的余额边界、缺证拒绝及原键恢复",
          "setup": "隔离环境内准备已贸易核验交易、真实可用证据、付款方授权及收费依据；不同人员经办与审批。",
          "steps": [
            "首次分账前先提交并补正发票，检查费用事件。",
            "执行首次分账并原键重放，再以新键尝试再次收费。",
            "换用未收费测试交易，分别撤去授权、收费依据或将可用余额降至299.99。"
          ],
          "assertions": [
            "发票不产生event12；首次获批分账仅转列300元，重放或换键不能重复收费。",
            "每交易唯一键、余额、凭证与分账结果原子提交；失败不能留下部分副作用。",
            "缺证或余额不足拒绝本次分账，中国供应商合同应付不减少，银行费用另据真实证据记event11。"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "步骤五用例编号N11-N17与业务流程节点含义不一致：例如流程N12是预开INVOICE，用例s5-n12是来款分配；流程N13是银行贸易核验，用例s5-n13是INVOICE与服务费。本稿nodeIds按实际流程节点含义填写",
          "owner": "第1期方案设计负责人",
          "impact": "影响用例与流程追溯表；不影响开发范围"
        },
        {
          "question": "服务费承担方和时点已由用户确认：D承担固定CNY 300，仅在首次获批分账时从D已核验可用余额结算event12，INVOICE不触发且A合同应付不减少。正式收费前仍须法务/财务确认合同依据、D授权、票据及收入确认。",
          "owner": "资金业务负责人、法务负责人及接口架构负责人",
          "impact": "阻断真实收费启用及相关会计联调；不阻断服务费规则实现、商业发票确切版、补正及独立审核。"
        }
      ],
      "estimateChange": {
        "oldBaseline": 8,
        "newBaseline": 12,
        "reason": "接收FIN-03移交的服务费实现及费用联核4个基线人日；总基线不增加，领域约束仍复用DM-08。"
      },
      "dependencyChanges": {
        "add": [
          "DM-08"
        ],
        "remove": []
      },
      "agent": "funds",
      "before": {
        "personDays": 4,
        "baselinePersonDays": 8,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "FIN-04",
          "BL-09",
          "BL-05"
        ]
      },
      "review": "总Agent核对步骤五109至118行及127至169行，收费归结算入口、发票不收费；授权、收费依据和余额不足阻断本次分账。跨包转移不双计，付款锁额与服务费转列分开验收。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s5-n15-settlement"
          ],
          "nodeIds": [
            "N14"
          ]
        },
        {
          "useCaseIds": [
            "s5-n15-settlement"
          ],
          "nodeIds": [
            "N15",
            "N16"
          ]
        },
        {
          "useCaseIds": [
            "s5-n15-settlement"
          ],
          "nodeIds": [
            "N15",
            "N16"
          ]
        },
        {
          "useCaseIds": [
            "s5-n15-settlement"
          ],
          "nodeIds": [
            "N14",
            "N15",
            "N16"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "FIN-05-S1",
          "previousAction": "实现应付、已付、锁额及实际银行费用的精确结算。",
          "currentIds": [
            "FIN-05-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FIN-05-S2",
          "previousAction": "实现预付款与出口后付款分支及确切依据。",
          "currentIds": [
            "FIN-05-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FIN-05-S3",
          "previousAction": "验证旧版、费用差异及并发申请。",
          "currentIds": [
            "FIN-05-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "FIN-06": {
    "rationale": "执行未知是核心风险，不能按普通表单审批估工。",
    "steps": [
      {
        "personDays": 4,
        "action": "实现经办、审批职责分离和原子锁额",
        "logic": "BEGIN RC：查审批原键→锁交易根→稳定银行身份→结算→付款单→按号锁分配→按号锁账户，FOR UPDATE当前读可用额、占用、差异和受益人账号版本。任一门禁不满足ROLLBACK，不生成锁额或银行事件。满足时事件4、占用投影、执行快照、凭证分录同一COMMIT",
        "expected": "可用减少、付款锁额增加同一金额；occupied≤released；审批人与经办人不同",
        "test": "经办人自己审批：拒绝。存在未决差异时审批：拒绝且无事件4。正常审批10万：可用-10万、锁额+10万、凭证平衡、执行快照含受益人账号版本"
      },
      {
        "personDays": 3,
        "action": "实现固定原号执行意图和事务外银行或人工执行",
        "logic": "执行意图按原transaction_number和原幂等键创建；COMMIT后由后台交INT-03提交，或在能力未开放时生成网银人工办理任务（附言为原付款号），执行人需授权且不同于审批人",
        "expected": "同一付款号最多一笔银行指令；人工任务和自动调用不会同时存在",
        "test": "重复提交同一执行意图：返回原意图。能力未开放时提交：生成人工任务，无自动调用；人工办理后状态按INT-03映射更新"
      },
      {
        "personDays": 3,
        "action": "验证调用前后崩溃、重复执行和未知锁额",
        "logic": "COMMIT前崩溃：无锁额、无意图。COMMIT后、调用前崩溃：恢复任务按原号先查询再决定是否提交。调用后崩溃：状态3，锁额保留，只按原号查询",
        "expected": "任何崩溃点都不产生重复指令或无证据解锁",
        "test": "在三个点分别终止进程后重启：第一种余额不变；第二种银行侧最终一笔指令；第三种状态3、锁额10万不变，查询后才推进"
      }
    ],
    "risk": null,
    "audit": {
      "id": "FIN-06",
      "status": "细化",
      "summary": "原稿已写“锁额与凭证同事务、执行意图固定原号”，修订后补充锁序和失败分支：S1经办、审批、执行三角色由SEC-02互斥校验；审批时复核交易与合同版本、付款分支证据、受益人账号配置版、有效分配、未决差异和可用额，事件4（桶2→3）、分配占用、执行快照、凭证分录同一COMMIT。S2执行意图固定原transaction_number，COMMIT后才交INT-03调用银行；银行未开放时由授权经办在网银按原号办理。S3验证COMMIT前后崩溃、重复执行和未知锁额。未知保持锁额，只有明确未扣款才解锁（由FIN-07执行）。",
      "sourceReferences": [
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 154,
          "lineEnd": 161,
          "reason": "锁额、未知保持、解锁条件",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "proto/trade/funds/v1/funds.proto",
          "lineStart": 427,
          "lineEnd": 481,
          "reason": "审批、执行意图消息",
          "sha256": "67a2059e55f0d75dba9d4a298a0f5bb9db274ef43240b13f16c617d7ba84282c"
        },
        {
          "path": "doc/sql/step5/transaction-recipes.sql",
          "lineStart": 84,
          "lineEnd": 136,
          "reason": "审批锁额与未知恢复配方",
          "sha256": "65c6ce76da15fa3e092897720acbc02525e466ceb12b420458ea29ec4dd299a7"
        },
        {
          "path": "交付成果/assets/step-five-usecases-model.js",
          "lineStart": 307,
          "lineEnd": 325,
          "reason": "N16时序：COMMIT后原号办理",
          "sha256": "e84dced883248e2c4ccb67b263e5ded195856f82f104f740bc0a7b256e2161b5"
        },
        {
          "path": "交付成果/assets/business-data.js",
          "lineStart": 155,
          "lineEnd": 158,
          "reason": "流程N17向中国供应商付款",
          "sha256": "f4a37559a4f207c4918d9aad7bf57593a63d47e44c6c9cec34ef01ff9c77e33b"
        }
      ],
      "useCaseIds": [
        "s5-n16-payment"
      ],
      "nodeIds": [
        "N15",
        "N16",
        "N17"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "付款事务与锁序设计",
          "contract": "doc/步骤五系统用例与接口协议.md 170-182行",
          "test": "对照锁序表"
        },
        {
          "dependencyId": "FIN-05",
          "consumes": "已批准结算版本与净额",
          "contract": "FIN-05交付",
          "test": "查询结算为已批准且版本冻结"
        },
        {
          "dependencyId": "SEC-02",
          "consumes": "授权矩阵与经办/审批/执行互斥",
          "contract": "SEC-02交付",
          "test": "用同一账号分饰两角，确认被拒"
        }
      ],
      "integrationScenarios": [
        {
          "name": "锁额后进程崩溃",
          "setup": "已批准结算10万，银行付款能力开放",
          "steps": [
            "审批锁额COMMIT",
            "在调用银行前终止进程",
            "重启恢复"
          ],
          "assertions": [
            "锁额保留10万",
            "恢复先按原号查询",
            "银行侧最终只有一笔指令"
          ]
        }
      ],
      "openQuestions": [],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "funds",
      "before": {
        "personDays": 5,
        "baselinePersonDays": 10,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "FIN-05",
          "SEC-02"
        ]
      },
      "review": "对照步骤五第162至169行，核对版本、账户、有效分配和余额重读，付款锁额与凭证同事务，事务外才调用银行，未知不新单。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N15",
            "N16"
          ]
        },
        {
          "useCaseIds": [
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N16",
            "N17"
          ]
        },
        {
          "useCaseIds": [
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N16"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "FIN-06-S1",
          "previousAction": "实现经办、审批、执行职责及原子锁额和平衡凭证。",
          "currentIds": [
            "FIN-06-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FIN-06-S2",
          "previousAction": "实现固定原号执行意图及事务外银行或人工执行。",
          "currentIds": [
            "FIN-06-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FIN-06-S3",
          "previousAction": "验证调用前后崩溃、重复执行和未知锁额。",
          "currentIds": [
            "FIN-06-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "FIN-07": {
    "rationale": "接收银行结果与供应商实收是两个事实，不以扣款完成代替到账。",
    "steps": [
      {
        "personDays": 3,
        "action": "消费原号银行结果：扣款确认写事件2，明确失败未扣款写事件5，迟到冲突隔离",
        "logic": "输入来自INT-03（或人工网银回单经核实）的原号结果。新开READ COMMITTED事务：先查结果幂等键→锁交易根→稳定银行身份→付款单→分配→账户，当前读执行状态。状态3/2收到扣款回单：事件2（桶3→NULL）、占用投影、凭证分录同一COMMIT，状态4。收到银行原文说明未扣款：事件5（桶3→2），状态6。已是4再收到失败：不改，隔离告警",
        "expected": "扣款后付款锁额减少、可用不变；明确失败后锁额回到可用；任何情况都不出现无证据解锁",
        "test": "锁额10万，推送扣款回单：锁额-10万，状态4，凭证平衡。再推送失败回执：隔离，余额和状态不变。另一笔锁额5万只有“处理中”：状态保持3，锁额5万不变"
      },
      {
        "personDays": 2,
        "action": "实现中国供应商本方到账核实（ExecutionStatus 5）",
        "logic": "中国供应商经办上传本方银行入账回单（金额、入账账号、付款附言含原付款号），通过CreateBeneficiaryReceiptConfirmation提交；独立资金核对员核对与扣款事件金额、受益人账号版本一致后写5。只有扣款状态4才能确认到账；缺证据返回422，状态不变",
        "expected": "到账是独立记录，不改资金三位置；扣款与到账在概览中分开显示",
        "test": "付款状态4、无中国供应商回单：概览显示“已扣款，到账未核实”。中国供应商上传回单、本人核实：拒绝；另一人核实：状态5。对状态3的付款提交到账：拒绝"
      },
      {
        "personDays": 2,
        "action": "验证重复回执、扣款金额不符和人工结果核实",
        "logic": "同一扣款回单重复推送幂等；回单金额与锁额不同时只按回单金额处理，差额进入FIN-08差异；人工网银结果的录入人与核实人不能相同",
        "expected": "不出现第二条事件2；金额不符不被强行对平",
        "test": "重复推送扣款回单：事件2只有一条。推送扣款9.99万（锁额10万）：事件2为9.99万，差额0.01万生成差异，剩余锁额保留。录入人自己核实网银回单：拒绝"
      }
    ],
    "risk": null,
    "audit": {
      "id": "FIN-07",
      "status": "细化",
      "summary": "原稿把“银行结果”和“供应商到账”放在一个包里，修订后把四个事实分开实现：银行受理（ExecutionStatus 2）；银行扣款（4，事件2从桶3移出、消耗锁额）；明确失败且未扣款（6，事件5从桶3回到桶2）；中国供应商本方到账（5，必须有中国供应商侧独立银行入账证据，经CreateBeneficiaryReceiptConfirmation提交并由另一人核实）。迟到结果按原transaction_number关联，与已核实终态冲突时隔离告警，不回退。人工网银结果走同一状态枚举，同样要另一人核实。",
      "sourceReferences": [
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 154,
          "lineEnd": 161,
          "reason": "未知保留锁额；event2消耗锁额；只有明确未扣款才event5；扣款不等于中国供应商到账",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "proto/trade/funds/v1/funds.proto",
          "lineStart": 170,
          "lineEnd": 178,
          "reason": "ExecutionStatus 1-6",
          "sha256": "67a2059e55f0d75dba9d4a298a0f5bb9db274ef43240b13f16c617d7ba84282c"
        },
        {
          "path": "proto/trade/funds/v1/funds.proto",
          "lineStart": 427,
          "lineEnd": 481,
          "reason": "执行与受益人到账确认消息",
          "sha256": "67a2059e55f0d75dba9d4a298a0f5bb9db274ef43240b13f16c617d7ba84282c"
        },
        {
          "path": "doc/sql/step5/transaction-recipes.sql",
          "lineStart": 119,
          "lineEnd": 136,
          "reason": "未知恢复事务配方",
          "sha256": "65c6ce76da15fa3e092897720acbc02525e466ceb12b420458ea29ec4dd299a7"
        },
        {
          "path": "doc/examples/step5/http-reference.md",
          "lineStart": 1669,
          "lineEnd": 1759,
          "reason": "CreateBeneficiaryReceiptConfirmation示例",
          "sha256": "593d03ad562dc08e266b3c7c37eb5e3df943b62d6d7c3b70e5ae4a0fd1f3dc08"
        },
        {
          "path": "交付成果/assets/step-five-usecases-model.js",
          "lineStart": 368,
          "lineEnd": 368,
          "reason": "event2银行扣款不等于中国供应商到账",
          "sha256": "e84dced883248e2c4ccb67b263e5ded195856f82f104f740bc0a7b256e2161b5"
        }
      ],
      "useCaseIds": [
        "s5-n16-payment"
      ],
      "nodeIds": [
        "N16",
        "N17"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "执行状态与到账规则冻结稿",
          "contract": "doc/步骤五系统用例与接口协议.md 154-161行",
          "test": "对照ExecutionStatus 1-6逐项确认处理分支"
        },
        {
          "dependencyId": "FIN-06",
          "consumes": "已COMMIT的锁额、执行快照和原付款号",
          "contract": "FIN-06交付；proto/trade/funds/v1/funds.proto 427-481行",
          "test": "查询一笔付款，确认锁额凭证和执行快照存在"
        },
        {
          "dependencyId": "INT-03",
          "consumes": "原号付款结果（含银行回单号、原文、金额）及状态映射",
          "contract": "INT-03交付",
          "test": "用一条超时样本确认交来的是状态3，而不是6"
        }
      ],
      "integrationScenarios": [
        {
          "name": "扣款后迟迟没有中国供应商到账",
          "setup": "付款已锁额10万，银行扣款成功",
          "steps": [
            "INT-03推送扣款回单",
            "中国供应商经办查看付款详情",
            "中国供应商上传入账回单",
            "独立核对员核实"
          ],
          "assertions": [
            "扣款后锁额清零、状态4",
            "核实前中国供应商页面显示到账未核实",
            "核实后状态5，资金三位置无变化"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "贸易代理商无权查询中国供应商的收款账户，中国供应商到账只能靠中国供应商上传回单再独立核实",
          "owner": "财务负责人",
          "impact": "阻断自动到账确认；不阻断人工核实和扣款处理"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "funds",
      "before": {
        "personDays": 3.5,
        "baselinePersonDays": 7,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "FIN-06",
          "INT-03"
        ]
      },
      "review": "对照ExecutionStatus及步骤五第162至169行，核对真实扣款消耗锁额、明确未扣款才解锁、供应商到账单独证据，不以银行扣款代替。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N16"
          ]
        },
        {
          "useCaseIds": [
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N17"
          ]
        },
        {
          "useCaseIds": [
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N16",
            "N17"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "FIN-07-S1",
          "previousAction": "实现原号结果、明确失败、晚到和对账关联。",
          "currentIds": [
            "FIN-07-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FIN-07-S2",
          "previousAction": "实现中国供应商本方到账的权威核实。",
          "currentIds": [
            "FIN-07-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FIN-07-S3",
          "previousAction": "验证迟到冲突、重复和失败解锁条件。",
          "currentIds": [
            "FIN-07-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "FIN-08": {
    "rationale": "必须独立重算而非调用记账函数，对账控制不因复用代码减掉。",
    "steps": [
      {
        "personDays": 4,
        "action": "按银行原始账单独立匹配实收、付款和账务",
        "logic": "读取已核实的银行观察（账户指纹、银行事件键、金额、方向、日期）与fund_flow事件1/2/11及对应分录，按（账户指纹，银行事件键）和原付款号匹配。实现上用独立查询，不调用记账服务、不复用其余额计算函数。只有部分账单的日期不参与对账；某侧缺数据记NULL",
        "expected": "每个不匹配项生成一条差异，带两侧原值和来源；对账运行不修改任何流水和余额",
        "test": "准备一份银行账单，然后：删除系统中一条事件1、复制一条事件1、把一条付款金额改为不同值、让一笔付款系统状态为3而银行已扣款。运行后得到缺失、重复、金额、状态四条差异；fund_flow和account_tab在运行前后一致。代码审查确认对账模块不引用记账模块"
      },
      {
        "personDays": 3,
        "action": "实现差异处置、实质更正和独立复核",
        "logic": "处置只追加意见或待补证；需补账时追加更正事件（如漏记的事件11银行费用）和平衡凭证，差异事实、更正和确认在同一COMMIT。复核人不能是处置人；复核通过才关闭并重新评估门禁",
        "expected": "原流水和原凭证保持不变；未关闭差异所在范围不能释放或锁额",
        "test": "对“银行多扣50元手续费”的差异补记事件11并提交：新增一条事件和一张凭证，原记录不变。处置人自己复核：拒绝。复核前对同一交易发起付款锁额：被差异门禁拒绝；另一人复核后：可锁额"
      },
      {
        "personDays": 2,
        "action": "验证缺证据处置、未知不是0和重复运行",
        "logic": "缺证据时只追加待补证，不关闭、不解锁；银行一侧未知时差异金额为NULL，不写0；同一对账日重复运行不产生重复差异",
        "expected": "差异可追溯，重复运行幂等",
        "test": "对状态3付款（银行未提供结果）运行对账：差异银行侧金额为NULL。用缺证据的处置尝试关闭：拒绝。同一日运行两次：差异数量不变"
      }
    ],
    "risk": null,
    "audit": {
      "id": "FIN-08",
      "status": "细化",
      "summary": "原稿已要求对账不复用记账函数，修订后写明怎么做到：S1一侧取银行原始账单（INT-02已核实观察或人工导入的银行原件），另一侧取fund_flow和account_ledger_entry_tab，用独立SQL或独立程序逐笔匹配，代码中不能引用资金记账模块；差异分缺失、重复、金额、状态四类，未知一侧为NULL而不是0。S2差异处置与独立复核分开，补账只能追加新事件和平衡凭证，不改原流水、不直接改余额。S3用四类样本验证。未决差异继续阻断相关范围的释放和付款。",
      "sourceReferences": [
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 163,
          "lineEnd": 168,
          "reason": "差异类型、未知不是0、补账追加、未决差异维持门禁",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "proto/trade/funds/v1/funds.proto",
          "lineStart": 483,
          "lineEnd": 521,
          "reason": "差异、处置、复核消息",
          "sha256": "67a2059e55f0d75dba9d4a298a0f5bb9db274ef43240b13f16c617d7ba84282c"
        },
        {
          "path": "doc/sql/step5/transaction-recipes.sql",
          "lineStart": 138,
          "lineEnd": 158,
          "reason": "差异事务配方",
          "sha256": "65c6ce76da15fa3e092897720acbc02525e466ceb12b420458ea29ec4dd299a7"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 616,
          "lineEnd": 640,
          "reason": "资金差异表",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        },
        {
          "path": "doc/金融账务系统数据库规范手册.md",
          "lineStart": 1047,
          "lineEnd": 1055,
          "reason": "第3道防线对账必须独立实现，不调用业务余额计算",
          "sha256": "2273f0e3241a1be4e41b634f7510aa3dcb99309690888e7dff53764355d8ac6c"
        },
        {
          "path": "交付成果/assets/step-five-usecases-model.js",
          "lineStart": 326,
          "lineEnd": 339,
          "reason": "N17时序：事务外原号查单，缺证据只追加待补证",
          "sha256": "e84dced883248e2c4ccb67b263e5ded195856f82f104f740bc0a7b256e2161b5"
        },
        {
          "path": "doc/examples/step5/http-reference.md",
          "lineStart": 1760,
          "lineEnd": 1854,
          "reason": "CreateFundsReconciliationDifference示例",
          "sha256": "593d03ad562dc08e266b3c7c37eb5e3df943b62d6d7c3b70e5ae4a0fd1f3dc08"
        }
      ],
      "useCaseIds": [
        "s5-n17-reconciliation"
      ],
      "nodeIds": [
        "N14",
        "N22",
        "N23"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "对账口径、差异门禁范围和观察存储位置",
          "contract": "doc/步骤五系统用例与接口协议.md 163-168行；观察存储待DES-1冻结",
          "test": "对照四类差异确认口径"
        },
        {
          "dependencyId": "FIN-07",
          "consumes": "扣款、明确失败、到账事件和原付款号",
          "contract": "FIN-07交付",
          "test": "取一笔状态4付款，确认有事件2和银行回单号"
        }
      ],
      "integrationScenarios": [
        {
          "name": "银行多扣手续费",
          "setup": "银行账单显示付款外另扣50元手续费，系统未记",
          "steps": [
            "运行对账",
            "处置人补记事件11",
            "另一名复核员复核"
          ],
          "assertions": [
            "生成金额差异",
            "补记后新增事件与凭证，原流水不变",
            "复核后差异关闭，门禁解除"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "funds.proto只有人工CreateBankReceiptEvidence(manual_evidence_intake)和FundsReleaseInput.bank_available_evidence，47张领域表中没有银行流水、余额文件或原始观察收件表。INT-02/03的自动观察要落到哪张基础设施表、采用什么去重键、由谁消费，需要DES-1冻结",
          "owner": "第1期方案设计负责人",
          "impact": "阻断INT-02/03自动观察的持久化和FIN-01/04/07的自动消费；不阻断人工证据入口、受限入账和缺证据422路径"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "funds",
      "before": {
        "personDays": 4.5,
        "baselinePersonDays": 9,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "FIN-07"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s5-n17-reconciliation"
          ],
          "nodeIds": [
            "N14",
            "N22"
          ]
        },
        {
          "useCaseIds": [
            "s5-n17-reconciliation"
          ],
          "nodeIds": [
            "N14",
            "N23"
          ]
        },
        {
          "useCaseIds": [
            "s5-n17-reconciliation"
          ],
          "nodeIds": [
            "N22",
            "N23"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "FIN-08-S1",
          "previousAction": "按银行原始账单独立匹配实收、付款和账务。",
          "currentIds": [
            "FIN-08-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FIN-08-S2",
          "previousAction": "实现差异案件、实质更正和独立复核。",
          "currentIds": [
            "FIN-08-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FIN-08-S3",
          "previousAction": "验证漏记、重记、金额和状态差。",
          "currentIds": [
            "FIN-08-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "FIN-09": {
    "rationale": "资金位置与账务规则已有；只计独立日终重算及告警接口。",
    "steps": [
      {
        "personDays": 2,
        "action": "独立重算受限、可用、付款锁额与分配占用",
        "logic": "按事件码对fund_flow逐笔累加，得到每个分配、每个账户的三桶金额；同时检查released≤allocated、occupied≤released、任一桶不为负。结果与account_tab.ledger_balance及分配投影比对",
        "expected": "每个不一致项输出账户号、期望值、实际值和相关事件号",
        "test": "在测试库把某受限账户余额直接改大100元后运行：报告该账户差100元并列出事件号；数据库余额未被改回"
      },
      {
        "personDays": 2,
        "action": "核对借贷平衡、balance_after序列和凭证链",
        "logic": "逐凭证借方合计=贷方合计=total_amount；逐账户按分录顺序校验balance_after=上一笔±amount；冲正凭证必须关联原凭证且一原凭证最多一个成功冲正",
        "expected": "不平衡凭证、断裂序列、重复冲正都能定位",
        "test": "在测试库插入一张借贷差0.01元的凭证、删除某账户中间一条分录：报告分别列出凭证号和断裂位置"
      },
      {
        "personDays": 2,
        "action": "验证新增事件、迟到结果和重跑",
        "logic": "重算以运行时点快照为界，运行期间新增的事件留到下次；迟到的银行结果写入后下一次重算覆盖；同一时点重跑结果一致，只写报告",
        "expected": "重算从不修改业务数据；重跑报告一致",
        "test": "在运行中写入一条事件1：本次报告不含它，下次包含。对同一时点运行两次：两份报告内容一致"
      }
    ],
    "risk": null,
    "audit": {
      "id": "FIN-09",
      "status": "细化",
      "summary": "原稿只写“独立重算”，修订后写明口径：从fund_flow按事件码重算每个分配和每个内部账户的受限、可用、付款锁额（1:NULL→1，3:1→2，4:2→3，2:3→NULL，5:3→2，6:2→1，7冲正反向），与account_tab余额和分配released/occupied投影比对；从account_ledger_entry_tab重算余额与balance_after序列，逐凭证检查借贷平衡。重算程序独立实现，不调用记账代码；只出报告，发现差异交FIN-08登记，不自动修复。本包不直接实现用例，作为日终独立重算共用支撑s5-n12-allocation（分配边界）、s5-n14-verification-release（释放额）、s5-n16-payment（付款锁额与占用）和s5-n17-reconciliation（差异来源）。",
      "sourceReferences": [
        {
          "path": "doc/金融账务系统数据库规范手册.md",
          "lineStart": 1057,
          "lineEnd": 1066,
          "reason": "对账频率：余额vs分录、借贷平衡、balance_after、全量重算",
          "sha256": "2273f0e3241a1be4e41b634f7510aa3dcb99309690888e7dff53764355d8ac6c"
        },
        {
          "path": "doc/金融账务系统数据库规范手册.md",
          "lineStart": 909,
          "lineEnd": 914,
          "reason": "日终自检独立算一遍",
          "sha256": "2273f0e3241a1be4e41b634f7510aa3dcb99309690888e7dff53764355d8ac6c"
        },
        {
          "path": "doc/sql/step5/assertions.sql",
          "lineStart": 26,
          "lineEnd": 47,
          "reason": "分配边界与凭证平衡断言",
          "sha256": "385a55fc3f3ca46861b1d46498251794d5a541a49a2f00b563fb3fcacc779c91"
        },
        {
          "path": "doc/sql/step5/README.md",
          "lineStart": 9,
          "lineEnd": 22,
          "reason": "三桶与内部账户映射",
          "sha256": "bea461bd46108a1c001c74a8543c5e5f94bcac8479a78996be7b2bab52181dc5"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 82,
          "lineEnd": 89,
          "reason": "事件码与三桶迁移",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 645,
          "lineEnd": 713,
          "reason": "account_tab、account_voucher_tab、account_ledger_entry_tab",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        }
      ],
      "useCaseIds": [
        "s5-n12-allocation",
        "s5-n14-verification-release",
        "s5-n16-payment",
        "s5-n17-reconciliation"
      ],
      "nodeIds": [
        "N11",
        "N14",
        "N16",
        "N22"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "日终任务时点、会计日（UTC+8）与报告去向",
          "contract": "待DES-1冻结",
          "test": "确认会计日切分规则"
        },
        {
          "dependencyId": "FIN-08",
          "consumes": "差异登记入口",
          "contract": "FIN-08交付",
          "test": "用重算报告的一条差异调用差异登记，确认能创建"
        }
      ],
      "integrationScenarios": [
        {
          "name": "余额被直接篡改",
          "setup": "测试库已有完整交易链",
          "steps": [
            "直接UPDATE某账户余额",
            "运行独立重算",
            "把差异交FIN-08登记"
          ],
          "assertions": [
            "报告定位到该账户",
            "重算不改余额",
            "差异进入待处置"
          ]
        }
      ],
      "openQuestions": [],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "funds",
      "before": {
        "personDays": 3,
        "baselinePersonDays": 6,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "FIN-08"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s5-n12-allocation",
            "s5-n14-verification-release",
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N11",
            "N14",
            "N16"
          ]
        },
        {
          "useCaseIds": [
            "s5-n17-reconciliation"
          ],
          "nodeIds": [
            "N22"
          ]
        },
        {
          "useCaseIds": [
            "s5-n16-payment",
            "s5-n17-reconciliation"
          ],
          "nodeIds": [
            "N16",
            "N22"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "FIN-09-S1",
          "previousAction": "独立重算受限、可用、付款锁额与未决占用。",
          "currentIds": [
            "FIN-09-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FIN-09-S2",
          "previousAction": "核对借贷平衡、银行观察与凭证链。",
          "currentIds": [
            "FIN-09-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FIN-09-S3",
          "previousAction": "验证新增事件、迟到结果和重跑。",
          "currentIds": [
            "FIN-09-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "FIN-10": {
    "rationale": "仅计跨服务资金专项与银行结合故障，不重复各包规则单测。",
    "steps": [
      {
        "personDays": 3,
        "action": "并发执行实收、分配、释放、锁额全链，验证守恒",
        "logic": "合成数据：5笔实收、20个交易；多线程按随机顺序发起分配、释放、锁额。所有事务按固定锁序，超过1秒锁等待返回可重试错误，确定性死锁最多内部重试2次",
        "expected": "无超额分配、无超额释放、无负桶；所有凭证平衡",
        "test": "跑完执行assertions.sql：违规行数为0；FIN-09重算报告无差异；记录P99事务耗时≤2秒"
      },
      {
        "personDays": 3,
        "action": "结合银行未知、迟到、人工接管和恢复演练",
        "logic": "按INT-04矩阵注入超时、迟到失败、进程崩溃和能力停用；停用期间走网银人工办理并由另一人核实",
        "expected": "未知期间锁额不变；银行侧每个付款号只有一笔指令；人工与自动不重复记账",
        "test": "注入付款超时并杀进程：恢复后原号查询，锁额保留。停用付款能力并人工办理后恢复：自动只查询，银行侧仍一笔"
      },
      {
        "personDays": 2,
        "action": "确认差异闭环、实际渠道及财务验收结论",
        "logic": "汇总S1、S2执行记录和FIN-08差异处置记录；自动与人工两条路径分别列出通过项和未开放项",
        "expected": "一份财务负责人签字的验收记录；未关闭差异为0或已注明阻断范围",
        "test": "核对验收记录：每条结论都能对应到执行日志；不引用模拟器结果作为银行正式通过"
      }
    ],
    "risk": null,
    "audit": {
      "id": "FIN-10",
      "status": "细化",
      "summary": "原稿是一期资金验收，修订后把验收拆成可执行步骤：S1按固定锁序并发跑实收、分配、释放、锁额、扣款全链，事务预算2秒、锁等待1秒，跑完执行assertions.sql全部断言和FIN-09重算；S2复用INT-04故障矩阵，验证未知不解锁不重付、迟到不回退、人工接管后不重复；S3自动接口路径和人工网银路径分别留执行记录，由财务负责人签字。",
      "sourceReferences": [
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 170,
          "lineEnd": 182,
          "reason": "锁序、事务预算、外部I/O在事务外",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "交付成果/assets/step-five-usecases-model.js",
          "lineStart": 370,
          "lineEnd": 371,
          "reason": "一致性与外部边界规则",
          "sha256": "e84dced883248e2c4ccb67b263e5ded195856f82f104f740bc0a7b256e2161b5"
        },
        {
          "path": "doc/sql/step5/assertions.sql",
          "lineStart": 1,
          "lineEnd": 62,
          "reason": "全部资金断言",
          "sha256": "385a55fc3f3ca46861b1d46498251794d5a541a49a2f00b563fb3fcacc779c91"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 154,
          "lineEnd": 161,
          "reason": "未知恢复与解锁条件",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        }
      ],
      "useCaseIds": [
        "s5-n11-receipt",
        "s5-n12-allocation",
        "s5-n14-verification-release",
        "s5-n16-payment",
        "s5-n17-reconciliation"
      ],
      "nodeIds": [
        "N11",
        "N13",
        "N16",
        "N17"
      ],
      "inputs": [
        {
          "dependencyId": "DES-1",
          "consumes": "第1期资金验收口径",
          "contract": "待DES-1冻结",
          "test": "确认口径区分自动和人工路径"
        },
        {
          "dependencyId": "FIN-09",
          "consumes": "独立重算程序",
          "contract": "FIN-09交付",
          "test": "在压测前后各运行一次"
        },
        {
          "dependencyId": "INT-04",
          "consumes": "银行故障矩阵和共同验收记录",
          "contract": "INT-04交付",
          "test": "确认矩阵中已开放能力清单"
        }
      ],
      "integrationScenarios": [
        {
          "name": "同一交易两笔付款并发锁额",
          "setup": "交易可用10万，两笔各8万付款同时审批通过",
          "steps": [
            "并发提交两次锁额",
            "查看可用和锁额"
          ],
          "assertions": [
            "一笔成功、一笔余额不足",
            "可用不为负",
            "失败一笔无凭证"
          ]
        }
      ],
      "openQuestions": [],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "funds",
      "before": {
        "personDays": 4,
        "baselinePersonDays": 8,
        "subtaskCount": 3,
        "dependencies": [
          "DES-1",
          "FIN-09",
          "INT-04"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s5-n12-allocation",
            "s5-n14-verification-release",
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N11",
            "N13",
            "N16"
          ]
        },
        {
          "useCaseIds": [
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N16",
            "N17"
          ]
        },
        {
          "useCaseIds": [
            "s5-n11-receipt",
            "s5-n17-reconciliation"
          ],
          "nodeIds": [
            "N11",
            "N17"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "FIN-10-S1",
          "previousAction": "并发执行分配、释放和付款链，验证守恒。",
          "currentIds": [
            "FIN-10-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FIN-10-S2",
          "previousAction": "结合银行未知、晚到、人工接管和恢复演练。",
          "currentIds": [
            "FIN-10-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FIN-10-S3",
          "previousAction": "确认差异闭环、实际渠道及财务验收结论。",
          "currentIds": [
            "FIN-10-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "FIN-11": {
    "rationale": "第二期保留原8人日，仅回归自动证据切换后的资金条件。",
    "steps": [
      {
        "personDays": 3,
        "action": "核对签署、物流自动证据与原批准版映射，以及合同替代后的付款批准前重核",
        "logic": "结算证据按（合同号，版本，签署件版本）绑定，不区分平台还是线下。新草稿或已签署（状态5）的新版本不改变旧有效版本（状态6）的地位。有权者确认新版本生效、同一事务把旧版6→7之后，付款批准前的复核（步骤五第156行）读取当前有效版本；所引用的合同版本已被替代时返回CONTRACT_OR_EXPORT_EVIDENCE_MISSING等门禁错误，不追加event 4。已有event 2的付款保留原记录；执行未知的付款只按原transaction_number查单，不因合同替代而解锁或重发。已锁额待执行付款怎么处置等待待确认结论，结论前系统不对其做自动处置。物流事件不作为要求码证据",
        "expected": "证据来源切换不改变已批准结算或付款；新版本签署但未生效时旧版本仍是付款依据；替代生效后，引用旧版本、尚未付款批准的结算在付款批准时被重核拦下并提示重新结算；已扣款付款不变；执行未知的付款只有原号查单；已锁额待执行付款在结论前不被自动解锁或重发",
        "test": "一期线下签署合同下的结算已批准：二期接入后对其发起付款批准，复核通过。平台签署新版合同到状态5：对另一笔引用旧有效版的结算发起付款批准，不因新版本存在而被拒。有权者确认新版本生效（新版6、旧版7）后：对第三笔引用旧版、尚未付款批准的结算发起付款批准，返回422门禁错误且无event 4；已有event 2的付款记录和凭证不变；执行未知的付款只新增原号查单记录，桶3不变。物流签收事件到达：结算和可用余额不变"
      },
      {
        "personDays": 3,
        "action": "用一期用例集回归结算、锁额和两类付款分支",
        "logic": "重放FIN-10的场景数据和断言，加上平台签署来源的合同",
        "expected": "全部断言通过，结果与一期一致",
        "test": "执行回归后assertions.sql违规为0；预付款缺码11、出口后缺码10仍被拒绝"
      },
      {
        "personDays": 2,
        "action": "核对差异与人工恢复",
        "logic": "平台不可用时合同走线下签署，资金侧按合同版本取证据，不依赖渠道",
        "expected": "渠道切换不产生资金差异",
        "test": "停用平台、线下签署后办理结算和付款：流程通过，FIN-09重算无差异"
      }
    ],
    "risk": null,
    "audit": {
      "id": "FIN-11",
      "status": "细化",
      "summary": "二期接入平台签署（INT-05）和物流自动事件（INT-06）后，付款要求码1-5的合同类证据可能来自平台归档件。修订后的回归要点：S1结算证据按合同版本和签署件版本绑定，不区分平台或线下，一期线下签署件继续有效。按步骤二，新草稿或只完成签署（4→5）的新版本不终止旧的有效合同（第161行）；5→6由有权者另行确认，正式替代与旧版6→7同一事务（第48行）。真实替代生效后，依赖旧版本、尚未执行的批准在付款批准前按步骤五第156行重核当前交易/合同版本和证据；已扣款的付款保留不动；执行未知的只按原transaction_number查单。引用旧版本的结算和已锁额待执行付款具体在什么范围失效、如何处置，源文档没有规定，列为待确认，本包不预设已锁额付款可以继续，也不预设一律失效。物流事件不进入付款要求码，不能触发释放或批准。S2用一期用例集回归结算、锁额和两分支。S3平台故障时退回线下签署，资金侧接口不变。",
      "sourceReferences": [
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 127,
          "lineEnd": 152,
          "reason": "付款要求码1-14与预付/出口后两分支",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 154,
          "lineEnd": 161,
          "reason": "付款批准前复核交易/合同版本、证据、受益方配置、有效分配、未决差异和可用余额；未知保留锁额并原号查单",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 196,
          "lineEnd": 196,
          "reason": "PAYMENT_GATE_INCOMPLETE/CONTRACT_OR_EXPORT_EVIDENCE_MISSING：422，按门禁补齐复核",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "doc/步骤二系统用例与接口协议.md",
          "lineStart": 39,
          "lineEnd": 48,
          "reason": "签署结果核验：4→5只表示已签署（归档签署文件并写ContractSigned）；5→6由有权者另行确认；正式替代与旧版6→7同事务；未知签署不能简单作废",
          "sha256": "309fb3369cd0cde8dcda7f2b1878fd1cb1518505439e5d38b418ce419fd98102"
        },
        {
          "path": "doc/步骤二系统用例与接口协议.md",
          "lineStart": 161,
          "lineEnd": 161,
          "reason": "旧5/6的新草稿不使其失效；激活新版须指定被替代版本和正式法律替代依据，同事务旧6→7",
          "sha256": "309fb3369cd0cde8dcda7f2b1878fd1cb1518505439e5d38b418ce419fd98102"
        },
        {
          "path": "doc/步骤三系统用例与接口协议.md",
          "lineStart": 35,
          "lineEnd": 35,
          "reason": "物流待审声明不进核心事实",
          "sha256": "bed3e39150278fba4db2d78386f6de645a89f8c0dd863ef28e37254b5400d339"
        }
      ],
      "useCaseIds": [
        "s5-n15-settlement",
        "s5-n16-payment"
      ],
      "nodeIds": [
        "N15",
        "N16"
      ],
      "inputs": [
        {
          "dependencyId": "DES-2",
          "consumes": "第2期证据切换设计",
          "contract": "待DES-2冻结",
          "test": "确认合同证据按版本绑定"
        },
        {
          "dependencyId": "BL-18",
          "consumes": "第2期渠道开关",
          "contract": "BL-18交付",
          "test": "切换开关后确认资金接口不变"
        },
        {
          "dependencyId": "FIN-10",
          "consumes": "一期验收场景数据与断言",
          "contract": "FIN-10交付",
          "test": "重放一期场景"
        }
      ],
      "integrationScenarios": [
        {
          "name": "平台签署新版合同替代旧版后付款",
          "setup": "一期合同（状态6）下有三笔结算：甲已扣款（event 2）；乙已批准结算、尚未付款批准；丙已付款批准并锁额，银行执行未知。二期在平台签署补充版本",
          "steps": [
            "新版本签署完成（4→5）后查询当前有效合同版本",
            "有权者确认新版本生效（5→6），同一事务旧版6→7",
            "对乙发起付款批准",
            "对丙按原transaction_number查单",
            "按新版本为乙重新结算、审批并锁额"
          ],
          "assertions": [
            "第1步当前有效版本仍是旧版，乙的依据未变",
            "第3步付款批准重核发现引用版本已被替代，返回422，无event 4",
            "丙只有原号查单记录，桶3锁额不变，未自动解锁或重发",
            "新结算引用平台归档版本并锁额成功；甲的event 2和凭证不变"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "合同被正式替代（新版5→6、旧版6→7）后，引用旧版本的已批准结算、已付款批准未锁额、已锁额待执行的付款分别在什么范围失效；已锁额待执行的付款是继续执行、撤销解锁还是转人工处置。步骤二和步骤五都没有规定，步骤五第156行只要求付款批准前重核当前交易/合同版本和证据",
          "owner": "法务负责人（会同第1期方案设计负责人）",
          "impact": "阻断合同替代后旧版本付款的自动处置规则和对应回归断言；结论前系统只做付款批准前重核、已执行保留、未知原号查单，不自动解锁或重发"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "funds",
      "before": {
        "personDays": 4,
        "baselinePersonDays": 8,
        "subtaskCount": 3,
        "dependencies": [
          "DES-2",
          "BL-18",
          "FIN-10"
        ]
      },
      "review": "对照步骤二签署4至5与另判生效、步骤五证据码，核对渠道自动化不改变已批准结算；物流通知不能直接释放资金。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s5-n15-settlement",
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N15",
            "N16"
          ]
        },
        {
          "useCaseIds": [
            "s5-n15-settlement",
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N15",
            "N16"
          ]
        },
        {
          "useCaseIds": [
            "s5-n16-payment"
          ],
          "nodeIds": [
            "N16"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "FIN-11-S1",
          "previousAction": "核对签署物流自动证据与原批准版映射。",
          "currentIds": [
            "FIN-11-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FIN-11-S2",
          "previousAction": "重验结算、锁额和付款分支。",
          "currentIds": [
            "FIN-11-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FIN-11-S3",
          "previousAction": "核对差异与人工恢复。",
          "currentIds": [
            "FIN-11-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "FIN-12": {
    "rationale": "第三期保留原10人日，供应商退税实收仍须权威来源。",
    "steps": [
      {
        "personDays": 4,
        "action": "联核正式放行、税务结果和中国供应商侧实际到账",
        "logic": "输入：INT-08放行事实、INT-09正式决定（批准金额）、中国供应商上传的本方银行入账回单。独立资金核对员核对金额、日期、账户归属后记录到账；部分到账记差额；无回单保持REFUND_OBSERVATION_UNAVAILABLE",
        "expected": "退税到账记录与贸易代理商资金三位置无关；核实前不显示已到账",
        "test": "税务批准1万、中国供应商上传到账8000：记录到账8000、差额2000待处理。贸易代理商的受限、可用、锁额不变。无回单时：显示未观察，不显示0"
      },
      {
        "personDays": 3,
        "action": "验证无观察权、缺来源和报告过期",
        "logic": "步骤八报告保存来源版本向量和集合；结案前短事务重读，向量或集合变化即过期",
        "expected": "过期报告不能用于结案",
        "test": "生成报告后新增一条资金事件，再用旧报告申请结案：拒绝并提示重新生成"
      },
      {
        "personDays": 3,
        "action": "确认正常结案的完整来源与差异闭环",
        "logic": "资金六项：毛额=分配+未匹配；已分配净额重算一致；应付=已付+未付/差异；服务费按D承担的event12及D可用余额勾稽且不减少A合同应付；银行费用按event11及真实凭证勾稽；凭证平衡；退税金额与归属分别核实。任一unknown或fail不能正常结案",
        "expected": "只有全部pass且复核人与申请人不同时才可结案",
        "test": "有一笔状态3付款时申请结案：拒绝。退税未观察时：资金第6项为unknown，拒绝。全部pass、另一人审批：结案"
      }
    ],
    "risk": null,
    "audit": {
      "id": "FIN-12",
      "status": "细化",
      "summary": "原稿“核对供应商退税实收权威”需要说清权威来源：退税进入中国供应商账户，税务机关不回传到账，贸易代理商系统也观察不到。修订后：S1联核正式放行、税务正式决定和中国供应商侧到账，中国供应商到账只能凭中国供应商上传银行回单由独立资金核对员核实（ReconcileRefundCredit），缺证据时为REFUND_OBSERVATION_UNAVAILABLE；退税绝不进入贸易代理商货款受限、可用、付款锁额。S2步骤八报告的资金六项逐项pass/fail/unknown，来源向量变化后报告过期。S3正常结案要求无unknown、无未决付款、无未释放锁额、无未核实到账。",
      "sourceReferences": [
        {
          "path": "doc/步骤七系统用例与接口协议.md",
          "lineStart": 32,
          "lineEnd": 35,
          "reason": "s7-credit规则与REFUND_OBSERVATION_UNAVAILABLE",
          "sha256": "8b9b0d38e55742d3a1f3de0654513e94ace510722685acdfbc2ea6bea6fc41ab"
        },
        {
          "path": "doc/步骤八系统用例与接口协议.md",
          "lineStart": 19,
          "lineEnd": 28,
          "reason": "报告逐项pass/fail/unknown与资金六项",
          "sha256": "e2918d2051a08419256735255787e066a167ecd22e70a9bc29a278378a9c632e"
        },
        {
          "path": "doc/步骤八系统用例与接口协议.md",
          "lineStart": 34,
          "lineEnd": 34,
          "reason": "资金差异须资金域实质关闭",
          "sha256": "e2918d2051a08419256735255787e066a167ecd22e70a9bc29a278378a9c632e"
        },
        {
          "path": "proto/trade/taxrefund/v1/taxrefund.proto",
          "lineStart": 34,
          "lineEnd": 34,
          "reason": "ReconcileRefundCredit接口",
          "sha256": "cfcaaf9719573217afbfcadcfda06650b9e050f4297cffe03ff85c282f7fef9d"
        }
      ],
      "useCaseIds": [
        "s7-credit",
        "s8-report",
        "s8-closure-review"
      ],
      "nodeIds": [
        "N21",
        "N22"
      ],
      "inputs": [
        {
          "dependencyId": "DES-3",
          "consumes": "第3期联核设计",
          "contract": "待DES-3冻结",
          "test": "确认退税到账的证据来源写明为中国供应商侧回单"
        },
        {
          "dependencyId": "INT-09",
          "consumes": "税务正式决定（批准金额、决定号）",
          "contract": "INT-09交付",
          "test": "取一条正式决定，确认无到账字段"
        },
        {
          "dependencyId": "FIN-11",
          "consumes": "二期回归后的资金基线",
          "contract": "FIN-11交付",
          "test": "确认回归断言全部通过"
        }
      ],
      "integrationScenarios": [
        {
          "name": "退税到账不影响贸易代理商资金",
          "setup": "退税批准1万；贸易代理商有受限和可用余额",
          "steps": [
            "中国供应商上传到账回单",
            "独立核对员核实",
            "查看贸易代理商资金概览和步骤八报告"
          ],
          "assertions": [
            "到账记录1万",
            "贸易代理商三位置不变",
            "报告第6项pass"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "中国供应商账户退税到账只能靠中国供应商上传回单，是否需要中国供应商授权的银行查询",
          "owner": "财务负责人",
          "impact": "阻断自动核对；不阻断人工核实和结案审批"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "funds",
      "before": {
        "personDays": 5,
        "baselinePersonDays": 10,
        "subtaskCount": 3,
        "dependencies": [
          "DES-3",
          "INT-09",
          "FIN-11"
        ]
      },
      "review": "对照步骤七第35至43行及步骤八第19至40行，核对退税进入供应商账户、不增加代理商货款，缺权威到账保持未知、未决付款或暂停阻断正常结案。",
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s7-credit"
          ],
          "nodeIds": [
            "N21"
          ]
        },
        {
          "useCaseIds": [
            "s8-report"
          ],
          "nodeIds": [
            "N22"
          ]
        },
        {
          "useCaseIds": [
            "s8-closure-review"
          ],
          "nodeIds": [
            "N22"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "FIN-12-S1",
          "previousAction": "联核正式放行、税务结果和实际到账。",
          "currentIds": [
            "FIN-12-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FIN-12-S2",
          "previousAction": "验证无观察权、缺源及报告过期。",
          "currentIds": [
            "FIN-12-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "FIN-12-S3",
          "previousAction": "确认正常结案完整来源及差异闭环。",
          "currentIds": [
            "FIN-12-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "DES-1": {
    "rationale": "已有八阶段用例、协议、领域模型、原型和环境验证；只计一期生产差距与人工通道补充设计，按工作项加总。",
    "steps": [
      {
        "personDays": 8,
        "action": "冻结一期角色、阶段门禁和人工/自动边界决策。",
        "logic": "逐项对照前四阶段真实用例、流程节点和Proto/HTTP，确定首次供应商提交建单、付款方独立、经办/送审/独审分人、原因2快照、合同用途/生效、同批出境及供应商本人书面报关确认。一期只银行自动，其余有权人外部人工办理并独核；交付每条决策的责任岗位、来源版本、适用期、缺证行为及人工交接物。",
        "expected": "签字版范围/角色/门禁决策表及一期排除清单；不重做FE-01已删30任务页或专项交互核对。",
        "test": "以供应商首次提交、合同待核签署、出境缺放行和报关改一栏四例走查，任一岗位或缺证处理无决定即列阻断，不交给开发猜测。"
      },
      {
        "personDays": 8,
        "action": "交付领域/技术归属、契约差距与一致性决策。",
        "logic": "复核权威DDL/公共JSON/示例/Proto，列数据库硬约束、领域校验、应用编排、适配器和技术任务各归属。冻结原受理最小响应、逐端点重放状态码、确切版本、统一全链锁排序键及同根写协调。补一期人工签署声明/独核、人工官方办理原号登记协议差距；记录版本变更失效/重审/传播表。现有SQL示例及本机表不当生产后端。",
        "expected": "已批准接口/事件/字段映射与待确认清单、迁移差距及单一共用能力分工；无重复技术账本或领域封套。",
        "test": "对步骤六重放原状态码与步骤二/三200差异、account id/accountNumber逆序、人工签署无平台通道进行契约走查；不能达成一致的条目阻断对应实现，不伪造已有端点。"
      },
      {
        "personDays": 6,
        "action": "冻结银行能力、资金权威及财务规则决策。",
        "logic": "首家银行书面确认账号/用途、实收、实际可用、扣款、收款方到账、稳定事件键、原号查询/幂等、费用及沙箱权限；缺接口列受控人工证据和独核。明确受限/可用/锁额、D承担固定300元且仅在首次获批分账时从已核验可用余额结算、INVOICE不触发且不减少A合同应付，以及预付与出口后门禁。保留未知原号/锁额及定点守恒，禁止垫资/授信/透支/换汇。冻结流程与资金用例节点语义对照而不改稳定id。",
        "expected": "银行能力签字表、逐事实权威来源、付款分支证据表和资金节点映射决策；供应商账户无观测权限列阻断。",
        "test": "用合并实收、部分可用、付款未知、服务费未收、银行扣款未到账五场景由银行/财务确认实际输出；没有明确未扣款证据不得批准解锁。"
      },
      {
        "personDays": 5,
        "action": "冻结身份、文件证据与部署运行差距方案。",
        "logic": "沿现有单体/同库和自部署存储/扫描设施，确认真实主体/经办授权、强认证、精确内容确认、撤权、独审及密钥版本/留存政策；文件确切VersionId、扫描、租约栅栏和预算由共用包承接。机房、网络、备份、恢复及生产差距由相应岗位签字，不重新选型或假定本机演示已上线。",
        "expected": "安全/运维决策记录、证据保留待定责任及验收准入，界面简化不删授权或资金控制。",
        "test": "撤权后原回执恢复、旧worker迟到、扫描后对象替换、根锁内外部I/O四项走查，确认拒绝/恢复和职责，不输出不存在的生产路径/命令。"
      },
      {
        "personDays": 5,
        "action": "冻结税务/正常结案规则及33包与外层交接验收矩阵。",
        "logic": "主管机关确认证明申请职责/范围/时限及退税规则、人工正式核验方式；批准/到账/交接分别权威。对完整来源、对象集合、暂停逐因解除/逐目标applied、关案不解冻和申请/决定两次重验作决策。逐包输入/输出/验收人与共用能力去重，69用例注明成功/失败/受阻所需证据；设计决策本包只计一次，实现包不再计相同评审。",
        "expected": "签字版实施/验收矩阵与未确认项负责人/阻断范围；无特殊结案，未接入不填空集通过。",
        "test": "用税务职责未定、证明更正、退税批准无供应商到账、双暂停仅解一因、结案申请后新增对象逐项桌面演练；每例都有确定接口输入、状态不变判定及责任岗位。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "DES-1",
      "status": "细化",
      "summary": "设计包交付可执行决策、契约差距及验收准入，保留原基线。D承担300元并在首次获批分账时从可用余额结算的服务费规则已统一；正式收费的合同依据、D授权及会计处理仍须确认。其余待决事项包括人工签署契约、节点语义、账户锁序、逐端点回放码和供应商退税观察权限。",
      "sourceReferences": [
        {
          "path": "proto/trade/funds/v1/funds.proto",
          "lineStart": 251,
          "lineEnd": 261,
          "reason": "历史审计快照；当前规则已统一为D承担、首次获批分账时event12结算，旧event8/9/10仅历史兼容。",
          "sha256": "67a2059e55f0d75dba9d4a298a0f5bb9db274ef43240b13f16c617d7ba84282c"
        },
        {
          "path": "doc/examples/step5/http-contract.json",
          "lineStart": 103,
          "lineEnd": 118,
          "reason": "服务费HTTP期望Bill请求响应，当前Proto实际仍为Settlement",
          "sha256": "f611bc7106dcd4dbbff2bae63c629636955752ddf101490c00d4bcbfa45a161f"
        },
        {
          "path": "doc/examples/step2/http-contract.json",
          "lineStart": 389,
          "lineEnd": 406,
          "reason": "当前签署HTTP仅平台任务输入，支持一期人工契约差距裁决",
          "sha256": "0f0af03b8a70a1f283f3deae1658fdb02e6c523e8d0b9df01e28198d4ef923bc"
        },
        {
          "path": "交付成果/assets/process-data.js",
          "lineStart": 4,
          "lineEnd": 11,
          "reason": "八阶段真实节点分组",
          "sha256": "37910ef0ab58d2c553203a8e6cf0278cd6b43ae06fd9d5fec5eb7c2caaf78f20"
        },
        {
          "path": "交付成果/assets/process-data.js",
          "lineStart": 54,
          "lineEnd": 66,
          "reason": "N12发票、N13贸易核验、N17付款及税务/结案的原流程语义",
          "sha256": "37910ef0ab58d2c553203a8e6cf0278cd6b43ae06fd9d5fec5eb7c2caaf78f20"
        },
        {
          "path": "doc/步骤五系统用例与接口协议.md",
          "lineStart": 98,
          "lineEnd": 169,
          "reason": "资金用例以N12分配/N13发票/N16付款标识，与总流程节点文字不同",
          "sha256": "ae27940d168633c6897e8aa7b8e1911f245fb075b89b60bd30a482dd12755503"
        },
        {
          "path": "proto/trade/contracts/v1/contracts.proto",
          "lineStart": 230,
          "lineEnd": 256,
          "reason": "现签署协议以平台任务为中心，缺一期人工签署登记/独核资源",
          "sha256": "c39991b428a7c66710b5758ef9de067e03ff8206c63f6a2c17b3699b396939ce"
        },
        {
          "path": "doc/领域拆分评估与交易域设计.md",
          "lineStart": 9,
          "lineEnd": 16,
          "reason": "CNY、三资金位置、独立一次300服务费等当前设计基线",
          "sha256": "9756de6bf51abc7ed64763295fafe9949093b33bf8490867b2197567856e35b6"
        },
        {
          "path": "doc/步骤八系统用例与接口协议.md",
          "lineStart": 42,
          "lineEnd": 68,
          "reason": "共同锁序和目前离线/有限验证边界",
          "sha256": "e2918d2051a08419256735255787e066a167ecd22e70a9bc29a278378a9c632e"
        }
      ],
      "useCaseIds": [
        "supplier-submit",
        "payer-submit",
        "supplier-edit",
        "payer-edit",
        "basis-submit",
        "basis-review",
        "contract-draft",
        "contract-review",
        "contract-revise",
        "contract-sign",
        "contract-activate",
        "framework-use",
        "customs-authority",
        "shipment-plan",
        "shipment-amend",
        "goods-ready",
        "booking-pickup",
        "transport-progress",
        "logistics-exception",
        "logistics-query",
        "s4-basis",
        "s4-draft",
        "s4-revision",
        "s4-review",
        "s4-confirm",
        "s4-filing",
        "s4-official",
        "s4-correction",
        "s4-attachment",
        "s4-query",
        "s5-n11-receipt",
        "s5-n12-allocation",
        "s5-n13-invoice-fee",
        "s5-n14-verification-release",
        "s5-n15-settlement",
        "s5-n16-payment",
        "s5-n17-reconciliation",
        "s6-preparation",
        "s6-cooperation",
        "s6-materials",
        "s6-review",
        "s6-dispatch",
        "s6-official-receipt",
        "s6-correction",
        "s6-certificate",
        "s6-delivery",
        "s6-receipt",
        "s6-objection",
        "s6-query",
        "s7-prepare",
        "s7-package",
        "s7-review",
        "s7-dispatch",
        "s7-notice",
        "s7-correction",
        "s7-decision",
        "s7-credit",
        "s7-recovery",
        "s8-context",
        "s8-report",
        "s8-assignment",
        "s8-hold",
        "s8-remedy",
        "s8-correction",
        "s8-release",
        "s8-case-close",
        "s8-closure-apply",
        "s8-closure-review",
        "s8-query"
      ],
      "nodeIds": [
        "N01",
        "N02",
        "N03",
        "N04",
        "N05",
        "N06",
        "N07",
        "N08",
        "N09",
        "N10",
        "N11",
        "N12",
        "N13",
        "N14",
        "N15",
        "N16",
        "N17",
        "N18",
        "N19",
        "N20",
        "N21",
        "N22",
        "N23"
      ],
      "inputs": [],
      "integrationScenarios": [
        {
          "name": "设计契约差距联合裁决",
          "setup": "业务/关务/税务/资金/安全/数据库/接口负责人；当前八阶段用例、流程、Proto/HTTP、DDL与原创样例，尚不假定任何正式外部通道已验收。",
          "steps": [
            "对一期线下签署和人工官方办理画出实际输入/独核/恢复交接",
            "并排核N12/N13/N16/N17流程与资金用例语义，保稳定id冻结对应关系",
            "用逆序account id/业务号走并发锁序",
            "检查步骤六和二/三回放状态码差异",
            "逐项签字决策与未决阻断"
          ],
          "assertions": [
            "每个差距有明确决定/岗位/版本及受影响包",
            "没有伪造已有人工签署或查询协议",
            "未确认银行/主管权威来源不被样例替代",
            "文案细化保持原32基线，共用能力只估一次"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "服务费承担方和时点已由用户确认：D承担固定CNY 300，仅在首次获批分账时从D已核验可用余额结算event12，INVOICE不触发且A合同应付不减少。正式收费前仍须法务/财务确认合同依据、D授权、票据及收入确认。",
          "owner": "资金业务负责人、法务负责人及接口架构负责人",
          "impact": "阻断真实收费启用及相关会计联调；不阻断规则实现、INVOICE申报或不收费测试。"
        },
        {
          "question": "真实总流程N12是INVOICE、N13贸易核验、N16出口后付款证据、N17实际付款；资金用例稳定id却含s5-n12-allocation、s5-n13-invoice-fee、s5-n16-payment。请总Agent冻结语义交叉映射，不能直接把id中的n号当真实节点；本审计保留稳定用例id并在资金领域包列完整N11至N17支撑范围。",
          "owner": "产品负责人及资金业务负责人",
          "impact": "阻断跨前端/资金/流程的精确节点验收映射；不改变既有资金范围与工时。"
        },
        {
          "question": "一期人工签署声明/独立核实资源缺失，官方办理协议的缺自动通道与有效人工渠道未明确区分；由接口/业务负责人共同冻结，不能靠前端布尔或手工改状态补足。",
          "owner": "接口架构负责人及业务验收负责人",
          "impact": "阻断一期人工成功链与依赖合同/官方事实的完整结案成功验收，不阻断准备/拒绝门禁。"
        },
        {
          "question": "账户锁序account id与accountNumber排序相冲突，幂等重放状态码也有分阶段差异；必须统一锁序并配置逐端点回放规则。",
          "owner": "数据库负责人及接口架构负责人",
          "impact": "阻断跨域并发与HTTP一致性验收，不新增业务范围。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 16,
        "baselinePersonDays": 32,
        "subtaskCount": 5,
        "dependencies": []
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit",
            "supplier-edit",
            "payer-edit",
            "basis-submit",
            "basis-review",
            "contract-draft",
            "contract-review",
            "contract-revise",
            "contract-sign",
            "contract-activate",
            "framework-use",
            "customs-authority",
            "shipment-plan",
            "shipment-amend",
            "goods-ready",
            "booking-pickup",
            "transport-progress",
            "logistics-exception",
            "logistics-query",
            "s4-basis",
            "s4-draft",
            "s4-revision",
            "s4-review",
            "s4-confirm",
            "s4-filing",
            "s4-official",
            "s4-correction",
            "s4-attachment",
            "s4-query"
          ],
          "nodeIds": [
            "N01",
            "N02",
            "N03",
            "N04",
            "N05",
            "N06",
            "N07",
            "N08",
            "N09",
            "N10"
          ]
        },
        {
          "useCaseIds": [
            "supplier-submit",
            "supplier-edit",
            "contract-sign",
            "s4-filing",
            "s6-query",
            "s7-recovery",
            "s8-context",
            "s8-report"
          ],
          "nodeIds": [
            "N01",
            "N02",
            "N03",
            "N04",
            "N09",
            "N18",
            "N19",
            "N20",
            "N21",
            "N22"
          ]
        },
        {
          "useCaseIds": [
            "s5-n11-receipt",
            "s5-n12-allocation",
            "s5-n13-invoice-fee",
            "s5-n14-verification-release",
            "s5-n15-settlement",
            "s5-n16-payment",
            "s5-n17-reconciliation"
          ],
          "nodeIds": [
            "N11",
            "N12",
            "N13",
            "N14",
            "N15",
            "N16",
            "N17"
          ]
        },
        {
          "useCaseIds": [
            "supplier-submit",
            "payer-submit",
            "supplier-edit",
            "payer-edit",
            "contract-sign",
            "s4-confirm"
          ],
          "nodeIds": [
            "N01",
            "N02",
            "N03",
            "N04",
            "N08"
          ]
        },
        {
          "useCaseIds": [
            "s6-preparation",
            "s6-cooperation",
            "s6-materials",
            "s6-review",
            "s6-dispatch",
            "s6-official-receipt",
            "s6-correction",
            "s6-certificate",
            "s6-delivery",
            "s6-receipt",
            "s6-objection",
            "s6-query",
            "s7-prepare",
            "s7-package",
            "s7-review",
            "s7-dispatch",
            "s7-notice",
            "s7-correction",
            "s7-decision",
            "s7-credit",
            "s7-recovery",
            "s8-context",
            "s8-report",
            "s8-assignment",
            "s8-hold",
            "s8-remedy",
            "s8-correction",
            "s8-release",
            "s8-case-close",
            "s8-closure-apply",
            "s8-closure-review",
            "s8-query"
          ],
          "nodeIds": [
            "N18",
            "N19",
            "N20",
            "N21",
            "N22",
            "N23"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "DES-1-S1",
          "previousAction": "逐项核对69用例、角色责任和30任务页，冻结一期人工替代及排除项。",
          "currentIds": [
            "DES-1-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "DES-1-S2",
          "previousAction": "复核已有领域和协议，补基础设施表、原受理、确认及迁移差距。",
          "currentIds": [
            "DES-1-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "DES-1-S3",
          "previousAction": "明确银行开放能力、原号执行与人工核实边界。",
          "currentIds": [
            "DES-1-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "DES-1-S4",
          "previousAction": "评审自建身份、密钥、部署及证据留存。",
          "currentIds": [
            "DES-1-S4"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "DES-1-S5",
          "previousAction": "明确每个工作包的输入输出、验收场景和交接方式，消除重复建设和责任空白。",
          "currentIds": [
            "DES-1-S5"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "DES-2": {
    "rationale": "保留原8人日设计估算；按现有二期范围分解，不重新调整预算。",
    "steps": [
      {
        "personDays": 3,
        "action": "冻结供应商正式契约与通道准入决策。",
        "logic": "确定签署平台、受托物流及通知供应商、合同/许可、测试环境、字段/事件键、签名算法/证书、速率/deadline、查原号/幂等能力和数据出口；本应用归一化ProviderNotification不当厂商API。交付逐字段映射、失败/未知含义及缺能力转人工条件，不擅自固定厂商。",
        "expected": "三通道带版本号的正式映射/授权决策及阻断项，不凭公开产品介绍承诺能力。",
        "test": "使用厂商原始签名报文和官方测试渠道核一次签名/原号查询；无法核定稳定引用或查单时标阻断，禁止自动重发。"
      },
      {
        "personDays": 3,
        "action": "冻结证据保全、跨渠道映射和人工切换方案。",
        "logic": "沿一期合同/物流规则和共用任务，签署全部签署人/审核正文关联/证书时间/归档与5→6生效分开；旧版迟到法律结果不丢。物流通知只待核不作正式放行/签收；人工自动切换先核原任务，未知不双办。通知最小字段、接收人/模板版及失败不改业务状态，冻结实际触发清单。",
        "expected": "证据/隐私/映射/回退决策表，领域与适配/安全/运维各自责任清楚，不新增重复恢复设施。",
        "test": "桌面演练签完但本地归档失败、V1迟到签署、物流乱序和通知退信，确认保存位置、状态不变、接管人及恢复原号。"
      },
      {
        "personDays": 2,
        "action": "冻结增量依赖、迁移及二期验收准入。",
        "logic": "以BL-17一期人工数据/原键/源事件基线建立迁移核对清单，DM-10只领域映射、INT只传输/验签、BL-18只编排和联验，通知运行不造业务用例。按通道单独启用，列授权测试数据、故障/重复/乱序/切人工场景及签字岗位，不重复一期全套建档或页面专项工作。",
        "expected": "二期可执行交接矩阵和验收准入、数据最小化/回退签字；不将签署平台成功当合同自动生效。",
        "test": "给每个增量包挑一原任务迁移与回调竞争场景，能定位输入版本、验收人及不重复执行判定；未列入通知触发的用例不默认计入。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "DES-2",
      "status": "细化",
      "summary": "二期设计只交付选定签署/物流/通知供应商的真实字段、证据、授权及人工切换决策；收窄全用例默认关联，保留8基线，不重复一期领域/恢复/身份方案。",
      "sourceReferences": [
        {
          "path": "doc/examples/step2/http-contract.json",
          "lineStart": 389,
          "lineEnd": 406,
          "reason": "既有签署任务HTTP为供应商正式映射提供本地契约端点",
          "sha256": "0f0af03b8a70a1f283f3deae1658fdb02e6c523e8d0b9df01e28198d4ef923bc"
        },
        {
          "path": "doc/步骤二系统用例与接口协议.md",
          "lineStart": 31,
          "lineEnd": 50,
          "reason": "平台真实契约待选、原任务恢复及法律证据核验要求",
          "sha256": "309fb3369cd0cde8dcda7f2b1878fd1cb1518505439e5d38b418ce419fd98102"
        },
        {
          "path": "doc/步骤三系统用例与接口协议.md",
          "lineStart": 47,
          "lineEnd": 57,
          "reason": "物流来源唯一键、待审/核实分离",
          "sha256": "bed3e39150278fba4db2d78386f6de645a89f8c0dd863ef28e37254b5400d339"
        },
        {
          "path": "doc/sql/domain/schema.sql",
          "lineStart": 959,
          "lineEnd": 1020,
          "reason": "通知模板、投递/尝试不持有业务完成状态",
          "sha256": "b62360cae517e07328a5bc2a7551796ce52488c2a4816901c5902cf123f26147"
        }
      ],
      "useCaseIds": [
        "contract-revise",
        "contract-sign",
        "contract-activate",
        "booking-pickup",
        "transport-progress",
        "logistics-exception",
        "logistics-query"
      ],
      "nodeIds": [
        "N02",
        "N03",
        "N04",
        "N06",
        "N10"
      ],
      "inputs": [
        {
          "dependencyId": "BL-17",
          "consumes": "一期验收/缺陷、人工签署物流原任务/源键、权限/证据与运行交接基线。",
          "contract": "一期联合验收及人工岗位签收制品待BL-17交付。",
          "test": "抽查原号、旧合同版和物流源事件可定位；一期未验收必需能力不得作为二期已具备。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "供应商能力和人工回退决策验收",
          "setup": "一期已验收基线；拟选三类供应商正式协议/沙箱、产品/法务/安全/接口/运维负责人。",
          "steps": [
            "核厂商真实原号幂等与查询能力，不支持时写明确人工核实方案",
            "对签署未知和物流同事件双渠道重演决策",
            "列通知实际触发事件和敏感字段出口",
            "逐通道签准入/阻断"
          ],
          "assertions": [
            "字段映射可追溯厂商正式版本",
            "无未知双办或旧版法律证据丢失",
            "通知不改变业务且不默认覆盖69用例",
            "设计交付是批准决策/契约，不重估一期基础实现"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "选定平台的原号幂等/查单、签署证据格式、物流可信源键和通知触发清单未正式确认；不能仅以现有归一化Proto作为供应商能力证明。",
          "owner": "第二期产品负责人及外部接口负责人",
          "impact": "阻断相应通道正式选型/联调准入，原人工路径继续有效。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 4,
        "baselinePersonDays": 8,
        "subtaskCount": 3,
        "dependencies": [
          "BL-17"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "contract-sign",
            "booking-pickup",
            "transport-progress"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04",
            "N06",
            "N10"
          ]
        },
        {
          "useCaseIds": [
            "contract-revise",
            "contract-sign",
            "contract-activate",
            "booking-pickup",
            "transport-progress",
            "logistics-exception",
            "logistics-query"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04",
            "N06",
            "N10"
          ]
        },
        {
          "useCaseIds": [
            "contract-sign",
            "contract-activate",
            "transport-progress",
            "logistics-exception",
            "logistics-query"
          ],
          "nodeIds": [
            "N02",
            "N03",
            "N04",
            "N06",
            "N10"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "DES-2-S1",
          "previousAction": "确认签署物流通知供应商、契约与人工切换。",
          "currentIds": [
            "DES-2-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "DES-2-S2",
          "previousAction": "评审映射、隐私、证据和回退方案。",
          "currentIds": [
            "DES-2-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "DES-2-S3",
          "previousAction": "冻结实施依赖和验收。",
          "currentIds": [
            "DES-2-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  },
  "DES-3": {
    "rationale": "保留原11人日设计估算；正式渠道缺授权则停止接入设计冻结。",
    "steps": [
      {
        "personDays": 4,
        "action": "冻结主管办理职责、规则及数据许可决策。",
        "logic": "书面确认海关申报主体/授权、双抬头适用/拆报、更正撤回、证明主办协助/范围/时限、退税申请/计算规则/账户归属。选定正式渠道、企业证书、许可企业/字段/用途、费用和测试条件，查询不扩为全社会申报数据。未知规则不从国别/样例推定税率期限；交付版本/生效期/责任人和阻断项。",
        "expected": "主管/法务/业务签字准入清单，缺项仅备料/受控人工，不豁免独审和供应商书面确认。",
        "test": "逐项拿主管正式文件核办理主体、scope、时限和查询数据使用许可；任一缺失明确阻断何通道，不在实现包重做法律判断。"
      },
      {
        "personDays": 4,
        "action": "冻结官方/查询/筛查映射、资金联核和失效传播方案。",
        "logic": "真实外部契约逐字段映射本应用Proto/HTTP和共享DDL，不假定其等于机关API；原办理号、确切版/hash、稳定事件键、官方号、状态前序及证据核验引用必备。明确查询来源/时效/限流及筛查名单版/误报独核的资源契约和实际挂接点，无稳定用例id不造id。规则升级/官方撤销影响未执行批准，旧事实按原规则保留；税务决定与供应商实际到账各自权威。",
        "expected": "正式接口/事件/数据字典和待冻结清单、跨域更正/暂停/结案源集合，复用二期去重/任务而不重建。",
        "test": "同官方事件人工/自动两次、旧版通知、证书撤销、跨企业查询、筛查源中断、税务批准无到账六例契约走查，逐项确定状态保留与拒绝码。"
      },
      {
        "personDays": 3,
        "action": "冻结迁移、容量/安全、人工回退和三期联合验收。",
        "logic": "沿前两期原号、源键、证据与规则快照迁移核对，按通道/企业授权启用；官方未知先查原号，人工接管不双办。列真实授权测试渠道、证据来源、负例/并发/恢复和正常结案成功准入；申请/决定两次集合重验和资金独立实收必验，不用离线unknown例充完整成功。",
        "expected": "各包前置/输入/输出/签字验收矩阵、回退与上线准入决策；完整来源不足仍禁止正常结案。",
        "test": "演练申请后新增对象/证明撤销、退税部分到账、解除一因仍有另一因、正式通道断连重启，逐项确认不可重付/重报/无证解锁；全部真实来源齐备才批准正常结案成功验收。"
      }
    ],
    "risk": null,
    "audit": {
      "id": "DES-3",
      "status": "细化",
      "summary": "三期设计交付主管职责/法律适用、接口和数据许可、规则版本及完整结案验收决定；授权查询/筛查的真实协议缺口需明确冻结。只关联实际受影响用例，保留11基线。",
      "sourceReferences": [
        {
          "path": "doc/examples/step4/http-contract.json",
          "lineStart": 219,
          "lineEnd": 236,
          "reason": "官方办理本地意图端点与真实主管渠道契约需分别冻结",
          "sha256": "6c50164045c0cf29da97201d6bda7623acc367f4773c6e31fbd4dd853a0b6085"
        },
        {
          "path": "doc/步骤六系统用例与接口协议.md",
          "lineStart": 3,
          "lineEnd": 7,
          "reason": "证明申请职责/范围/期限仍须主管确认",
          "sha256": "c80e0ceb5b024eacc205546ce30739d4118ec98c8ffcc6bd960584142b91d409"
        },
        {
          "path": "doc/步骤七系统用例与接口协议.md",
          "lineStart": 31,
          "lineEnd": 43,
          "reason": "供应商银行实收与税务决定分离、原号恢复",
          "sha256": "8b9b0d38e55742d3a1f3de0654513e94ace510722685acdfbc2ea6bea6fc41ab"
        },
        {
          "path": "doc/步骤八系统用例与接口协议.md",
          "lineStart": 13,
          "lineEnd": 40,
          "reason": "完整真实源、逐因控制和正常结案重核",
          "sha256": "e2918d2051a08419256735255787e066a167ecd22e70a9bc29a278378a9c632e"
        }
      ],
      "useCaseIds": [
        "s4-basis",
        "s4-filing",
        "s4-official",
        "s4-correction",
        "s4-query",
        "s6-preparation",
        "s6-dispatch",
        "s6-official-receipt",
        "s6-correction",
        "s6-certificate",
        "s6-query",
        "s7-dispatch",
        "s7-notice",
        "s7-correction",
        "s7-decision",
        "s7-credit",
        "s7-recovery",
        "s8-context",
        "s8-report",
        "s8-hold",
        "s8-release",
        "s8-closure-apply",
        "s8-closure-review",
        "s8-query"
      ],
      "nodeIds": [
        "N07",
        "N09",
        "N18",
        "N19",
        "N20",
        "N21",
        "N22",
        "N23"
      ],
      "inputs": [
        {
          "dependencyId": "BL-18",
          "consumes": "二期通道编排、人工切换、稳定映射、故障恢复和迁移验收结果。",
          "contract": "二期渠道验收及人工回退制品待BL-18交付。",
          "test": "原未知任务和旧版证据仍可定位，不假定二期只有成功数据。"
        },
        {
          "dependencyId": "FIN-11",
          "consumes": "二期资金跨域回归、签署/物流新来源不绕付款门禁的核对记录。",
          "contract": "资金二期回归报告待FIN-11交付；doc/步骤五系统用例与接口协议.md",
          "test": "平台完成/物流通知不能代银行可用、正式放行或供应商到账。"
        }
      ],
      "integrationScenarios": [
        {
          "name": "官方来源及完整结案准入裁决",
          "setup": "前两期已验收基线；主管/银行/数据源正式许可及契约或明确缺项；第三期业务、法务、资金、安全、接口、数据库和运维负责人。",
          "steps": [
            "逐来源核权限/规则/字段和官方验真路径",
            "冻结尚缺查询/筛查资源及实际用例挂接",
            "以税务批准无到账、证明撤销、双因暂停和新增对象竞争走查结案",
            "签迁移/回退/故障和成功验收准入"
          ],
          "assertions": [
            "官方受理不当到账/结案",
            "查询/筛查不替代主管事实或法定结论",
            "每个未确认事项有全名岗位和阻断范围",
            "共用恢复/去重不重复估算，11基线不因文字细化上调"
          ]
        }
      ],
      "openQuestions": [
        {
          "question": "海关/税务正式契约、证明职责/范围/时限、退税规则及供应商银行观测许可须书面确认；当前本地Proto、DDL和样例均不能证明已获正式接入授权。",
          "owner": "第三期业务负责人及法务合规负责人",
          "impact": "阻断对应正式通道与完整正常结案成功准入，准备及失败关闭可继续。"
        },
        {
          "question": "INT-10授权查询、INT-11外部筛查虽已有工作范围，缺明确独立HTTP/Proto和稳定业务用例。请总Agent保留现有稳定编号，冻结真实资源/数据范围/挂接点后评估是否有实质新增，不能仅为补文案涨工时。",
          "owner": "第三期产品负责人及接口架构负责人",
          "impact": "阻断查询/筛查最终契约和验收范围签字，不阻断既有官方办理增量。"
        }
      ],
      "estimateChange": null,
      "dependencyChanges": {
        "add": [],
        "remove": []
      },
      "agent": "domain",
      "before": {
        "personDays": 5.5,
        "baselinePersonDays": 11,
        "subtaskCount": 3,
        "dependencies": [
          "BL-18",
          "FIN-11"
        ]
      },
      "review": null,
      "subtaskLinks": [
        {
          "useCaseIds": [
            "s4-basis",
            "s4-filing",
            "s4-correction",
            "s6-preparation",
            "s6-dispatch",
            "s7-dispatch"
          ],
          "nodeIds": [
            "N07",
            "N09",
            "N18",
            "N19",
            "N21"
          ]
        },
        {
          "useCaseIds": [
            "s4-official",
            "s4-correction",
            "s4-query",
            "s6-official-receipt",
            "s6-correction",
            "s6-certificate",
            "s6-query",
            "s7-notice",
            "s7-correction",
            "s7-decision",
            "s7-credit",
            "s7-recovery",
            "s8-context",
            "s8-hold",
            "s8-release"
          ],
          "nodeIds": [
            "N09",
            "N19",
            "N20",
            "N21",
            "N22",
            "N23"
          ]
        },
        {
          "useCaseIds": [
            "s4-query",
            "s6-query",
            "s7-credit",
            "s7-recovery",
            "s8-context",
            "s8-report",
            "s8-release",
            "s8-closure-apply",
            "s8-closure-review",
            "s8-query"
          ],
          "nodeIds": [
            "N09",
            "N20",
            "N21",
            "N22",
            "N23"
          ]
        }
      ],
      "subtaskChanges": [
        {
          "previousId": "DES-3-S1",
          "previousAction": "确认海关税务主责、规则和数据许可。",
          "currentIds": [
            "DES-3-S1"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "DES-3-S2",
          "previousAction": "评审官方事件、查询与资金联核方案。",
          "currentIds": [
            "DES-3-S2"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        },
        {
          "previousId": "DES-3-S3",
          "previousAction": "冻结迁移、安全、容量和验收。",
          "currentIds": [
            "DES-3-S3"
          ],
          "reason": "保留步骤位置，按来源细化实施和测试。"
        }
      ]
    }
  }
};
  root.EXPORT_WORK_PACKAGE_CONTEXT = definitions;
  if (typeof module === 'object' && module.exports) module.exports = definitions;
})(globalThis);
