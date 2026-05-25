# Agent Skills Workflow

本项目已安装两套 Codex skill，用来提升后续开发质量和协作效率。

## 已安装

| Skill | 本机位置 | 用途 |
| --- | --- | --- |
| gstack | `C:/Users/Xiaotian/.codex/skills/gstack` | 让 Codex 在关键节点调用外部 Codex CLI 做第二意见、挑战式审查或独立 review |
| Superpowers | `C:/Users/Xiaotian/.codex/skills/*` | 一组工程流程技能：需求澄清、计划拆分、TDD、系统调试、代码审查、并行子任务、收尾验证 |

## 在本项目中的使用规则

### 1. 做产品/UI/功能重构前

使用 Superpowers 的思路：

- 先用 brainstorming 澄清目标、用户和约束。
- 再用 writing-plans 把需求拆成可验证任务。
- 对大功能保留计划文档，建议放在 `docs/superpowers/plans/`。

适用场景：

- 重构赛事规划器。
- 重构 AI 工作台。
- 把赛题资源库做成可上传/可索引系统。
- 接数据库、账号系统或在线反馈后台。

### 2. 修 Bug 或接口异常时

使用 Superpowers 的 systematic-debugging：

- 先复现问题。
- 定位是哪一层：前端、API、后端、文件数据、模型服务。
- 找根因，不只修表面报错。
- 修完必须重新验证对应接口和页面。

适用场景：

- `/api/cases` 500。
- JSON 解析失败。
- 资源下载无法打开。
- 大模型调用失败后没有兜底。

### 3. 涉及高风险改动时

使用 gstack：

- 对关键计划或改动做第二意见。
- 让外部 Codex CLI 挑战方案，找遗漏风险。
- 在上线前做独立 code review。

适用场景：

- 改后端下载白名单。
- 改 API Key / 模型接入。
- 改赛事规划生成逻辑。
- 大范围 UI 重构。

### 4. 后续与 ClaudeCode 协作

ClaudeCode 继续适合做：

- 赛题资料索引。
- 优秀论文结构拆解。
- 模型卡和提示词内容扩充。
- 赛事时间官方来源核验。

Codex 使用 Superpowers/gstack 负责：

- 把 ClaudeCode 交付内容产品化。
- 做前后端接口和交互。
- 做构建、接口、下载、JSON 校验。
- 做安全边界和合规检查。

## 注意

安装后的技能需要重启 Codex 才会在新会话中自动进入技能列表。本文件先作为当前项目的工作流约定。
