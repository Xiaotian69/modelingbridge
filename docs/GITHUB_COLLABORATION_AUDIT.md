# GitHub 整理审查记录（2026-10-12）

## 基线与范围

main d426d2c；PR #1 / codex/github-packaging 41995c4；PR #2 / feat/edgeone-hk-pilot 54e7d4c；本地新版 7645dbb 从 EdgeOne 分支继承。
整理分支 chore/github-collaboration 从 7645dbb 创建，复用 PR #1 文档素材和测试开发配置，不导入 LICENSE、不更改业务代码、现有测试、案例或 EdgeOne 配置。
PR #1/#2 保持 OPEN Draft。未创建 develop、未合并或发布。

## 安全审查

所有本地可达历史对象与本轮文档做常见凭证格式扫描，未发现匹配，不构成完整秘密/版权审计。环境示例密钥为空。
已跟踪文档和内容代码包含本机路径、资料目录信息，未重写历史，后续需要单独泛化。原始第三方资料不在本轮提交中；资料下载接口的授权问题应在对外服务前核验。
本机资料盘点包含 58 个文件，其中 Git 未跟踪显示 25 个 XLSX/MP4，其余被忽略规则隐藏。仅生成本地元数据清单，来源/隐私/授权均待负责人审核，原文和清单均未上传。
公开仓库已发 duopuw-web 写权限邀请，仍需接受。新 modelingbridge-internal 保持 Private，仅推送治理骨架；不邀请联合开发者、不上传本地资料。

## 本次验证

- 前端 npm ci 成功。
- Vitest：26 个测试文件、175 项测试通过。
- 独立 TypeScript tsc --noEmit 通过。
- Vite build 通过。
- 本轮主页与协作文档的相对 Markdown 链接目标存在。
- .gitignore 样例确认资料、环境文件、worktree、构建产物被忽略。
- 后端：3 passed / 1 failed；test_new_mcm_archive_is_whitelisted 要求被 Git 忽略的本机资料目录存在，干净隔离目录不满足。未修改测试。
- 本地 Node 24.14.0 / Python 3.13.6；CI 配置 Node 22 / Ubuntu，尚未远程运行，不能视作远程 CI 已通过。
- npm 安装报告 22 项依赖告警（1 low、8 moderate、11 high、2 critical）；本轮未执行自动修复或升级，后续独立分级处理。

## 待负责人处理

负责人已确认 EdgeOne Production 绑定 feat/edgeone-hk-pilot、生产自动部署开启、Preview 自动部署关闭；本轮仅推新版开发分支与整理分支。整理 Draft PR 目标为 feat/modelingbridge-v2-ui（7645dbb），不面向生产分支。
在 main/实际生产分支设置 PR 审核、禁止强推与删除、讨论解决，CI 首次成功运行后指定 frontend-quality 为必需检查。
确认代码与原创内容各自许可证；检查旧提交作者邮箱与本人 GitHub 账号关联。不改全局 Git 设置，不改历史作者。
审核本机资料来源/隐私/版权，逐项决定是否入私库；私库协作者访问另行确认。

复核两次本地 V2 提交：无匹配凭证、硬编码凭证赋值或原始资料文件；一份交付文档含工作目录路径（不含个人身份字段），历史保持原样。
