# 09 ClaudeCode 工作清单：UI 重构后的内容扩展

> 当前 Codex 正在负责前端 UI、交互和大模型接入。ClaudeCode 请专注内容策划、题库整理和资料核验，不要改前端代码和后端代码。

## 一、协作边界

不要修改：

- `frontend/src/App.tsx`
- `frontend/src/layouts/Layout.tsx`
- `frontend/src/pages/*.tsx`
- `frontend/src/index.css`
- `frontend/src/data/modelingContent.ts`
- `frontend/src/api/client.ts`
- `frontend/src/types.ts`
- `backend/app/**/*.py`
- `backend/.env`
- `backend/.env.example`

可以新增或修改：

- `docs/content/*.md`
- `docs/trial/*.md`
- `docs/research/*.md`
- `cases/*.json` 的文案内容，但必须保持 JSON 结构不变

## 二、P0 任务

### 0. 先使用用户上传的美赛资料包

优先阅读/扫描：

- `2000-2024年美赛赛题汇总【公众号：数模加油站】`
- `2006-2025年美赛优秀论文汇总【公众号：数模加油站】`
- `数学建模Prompt`
- `docs/research/mcm_uploaded_resources_scan.md`

要求：

- 不批量复制题面或论文正文。
- 只做索引、题型标签、结构拆解和教学化摘要。
- 对优秀论文严格遵守版权边界：不摘抄长段正文，不输出可替代原文的内容。
- Prompt 资料要做合规清洗，去掉代写、保奖、一键论文等表达。

### 1. 经典赛题资料包

交付文件：`docs/research/classic_problem_bank.md`

要求：

- 至少整理 20 道经典题，覆盖国赛、美赛、亚太/华数杯/MathorCup 等。
- 每道题包含：年份、比赛、题名、题型、为什么经典、适合训练的模型、可做的简化版任务。
- 不搬运完整原题，不给最终答案，只做教学索引。
- 对国赛和美赛题目尽量给官方或可靠来源链接。

### 2. 模型方法卡精修

交付文件：`docs/content/model_method_cards_v2.md`

要求：

- 以 `frontend/src/data/modelingContent.ts` 当前模型卡为基础补充内容。
- 每张模型卡补：新手问答 5 组、最小例题、Python 伪代码、论文写法、常见错误。
- 优先模型：线性规划、时间序列、回归/随机森林、熵权 TOPSIS、AHP、聚类、微分方程、网络流。

### 3. 赛事日历核验表

交付文件：`docs/research/contest_calendar_verified.md`

要求：

- 核验 2026 或最近一年公开信息：国赛、美赛、MathorCup、五一、数维杯、华数杯、APMCM、深圳杯。
- 每项记录：报名时间、比赛时间、主办/承办方、官网链接、是否适合新手、含金量建议。
- 明确标注“已确认”“需等待当年通知”“2026 暂停”等状态。
- 不要把非官方页面当成唯一依据，最好给 2 个来源。

### 4. AI 问答式学习提示词库

交付文件：`docs/content/ai_tutor_prompts.md`

要求：

- 为每类模型写一套“问答式学习提示词”。
- 每套包含：概念解释、结合题目判断适用性、最小代码、检验方法、论文表达、追问清单。
- 强调学习辅助，不允许输出可直接提交的论文正文。

## 三、P1 任务

### 4.5 美赛优秀论文拆解

交付文件：`docs/research/mcm_outstanding_paper_patterns.md`

要求：

- 从用户上传的优秀论文中先选 10 篇。
- 每篇只整理：年份、题号、论文结构、模型路线、图表类型、摘要写法、检验写法、可学习点。
- 不复制长段正文，不给可直接套用的论文段落。
- 最后总结“优秀美赛论文常见结构模板”和“新手最容易漏的部分”。

### 5. 试点课内容脚本

交付文件：`docs/trial/10_协会试点课脚本.md`

要求：

- 90 分钟版本和 120 分钟版本各一套。
- 包括主持人台词、演示题、学生操作步骤、反馈收集方式。
- 明确哪些页面要打开：总览、学习、AI 建模、例题、技巧、反馈。

### 6. 简化例题 JSON 扩展

交付目录：`cases/`

要求：

- 新增 5 个教学案例 JSON，结构完全匹配现有案例。
- 优先主题：信贷决策、交通服务平台、葡萄酒评价、Wordle 预测、城市宜居评价。
- 不虚构真实数据来源；涉及数据写“题目附件 / 人工整理 / 公开数据需人工确认”。
- 修改后必须用 PowerShell 或 Python 校验 JSON 可解析。

### 7. 首页文案备选

交付文件：`docs/content/home_copy_options.md`

要求：

- 写 3 套首页一句话定位。
- 写 6 个适合按钮/卡片的短标题。
- 写 10 条合规边界短句，避免代写、保奖、一键论文等表达。

## 四、交付汇报格式

最后请按以下格式汇报：

1. 新增/修改文件清单。
2. 每个文件用途。
3. 资料来源链接。
4. JSON 是否校验通过。
5. 建议 Codex 接下来做成前端功能的内容。
