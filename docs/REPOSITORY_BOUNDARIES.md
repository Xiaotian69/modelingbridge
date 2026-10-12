# 公开核心与内部内容接口

公开仓库 modelingbridge 保留通用前端、组件、教学系统、允许公开的课程/例题、算法与开发文档。
私有仓库 modelingbridge-internal 存放经过审查的草稿、索引、研究和专用工具，不复制公开历史，不存储凭证。会员代充、支付订单与商业销售业务不进入任一仓库。

## 数据接口（文档契约，尚未接入程序）

内部维护 JSON 或 CSV 索引，每条至少包含：id、title、kind、sourceUrl、originalFilename、bytes、sha256、privacyStatus、licenseStatus、rightsEvidence、reviewedBy、reviewedAt、publishStatus。
privacyStatus 使用 unknown/clear/restricted；licenseStatus 使用 unknown/original/authorized/link-only/prohibited；publishStatus 使用 draft/reviewed/approved-public。
未知状态默认禁止发布。公开发布记录只包含已审核的标题、官方来源、内容版本和适用授权，不导出内部路径、个人数据、凭证或未授权正文。

发布流程：内部登记 → 负责人逐项确认隐私/授权 → 导出最小公开内容 → 公开仓库独立 Issue/PR → 数据格式/数学验证 → 审核合并。私有不等于合法，不因可读取或可下载而推定获授权。
公开程序目前仍使用 cases/*.json 与现有前端内容；本轮不改运行时，不自动拉取私有仓库或把其凭据送入前端/CI。

## 权利范围

代码许可待负责人确定，PR #1 的 MIT 草案不自动生效。原创教材另行决定许可；第三方材料保留原许可，授权凭据存内部审核记录。只提供官方链接的条目不得夹带全文。
密钥放开发环境变量或经授权的部署 secrets，绝不写入仓库。发现泄露先撤销/轮换，评估影响，再单独决定历史处理，不擅自改历史。
