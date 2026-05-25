# 08 给 ClaudeCode 的下一步提示词

把下面内容直接发给 ClaudeCode 使用。

```text
你现在在项目目录：E:\数模网站开发。

请作为内容策划 + 数学建模教学助理，继续协助“模桥 ModelingBridge”从免费试运行 Demo 推进到可组织协会试点课的版本。

协作限制：
1. 不要修改前端页面和后端代码，避免和 Codex 的代码工作冲突。尤其不要改：
   - frontend/src/App.tsx
   - frontend/src/layouts/Layout.tsx
   - frontend/src/pages/*.tsx
   - frontend/src/api/client.ts
   - frontend/src/types.ts
   - backend/app/**/*.py
   - backend/.env
   - backend/.env.example
2. 不要安装新包，不要改依赖，不要重构架构。
3. 不要写入、展示或推测任何 API Key / Token。
4. 文案定位必须保持：免费试运行、学习辅助、人工确认、AI 使用记录、合规透明。
5. 不要宣传盈利、会员、保奖、一键论文、代写、自动参赛。
6. 可以新增或修改 Markdown 文档、案例 JSON 文案；新增文件使用 UTF-8。

请先阅读：
- README.md
- docs/phase1/*.md
- docs/trial/01_试运行方案.md
- docs/trial/02_访谈问卷与反馈表.md
- docs/trial/03_AI使用记录与合规说明.md
- docs/trial/04_下一阶段项目清单.md
- docs/trial/05_模型评测记录.md
- cases/bike_demand_demo.json
- cases/optimization_dispatch_demo.json
- cases/evaluation_topsis_demo.json
- E:/数模网站开发/数学建模AI引导式学习平台网站MVP设计方案.docx
- D:/社交/wechat data/xwechat_files/wxid_twcrddl29g6w22_d73f/msg/file/2026-05/数学建模AI公益教学平台项目企划书.docx
- D:/社交/wechat data/xwechat_files/wxid_twcrddl29g6w22_d73f/msg/file/2026-05/数学建模一键式工作流建设方案.docx

请完成以下交付物：

一、新增 docs/trial/05_模型评测题集.md
- 至少 5 道评测题，覆盖：预测、优化、评价、机理分析、混合题。
- 每道题包含：题目文本、附件说明、预期题型、关键数据项、推荐模型方向、人工确认点、容易误导 AI 的点。
- 题目不要太长，适合用于 API 快速测试。
- 不要给最终答案或论文正文。

二、新增 docs/trial/06_协会试点课流程.md
- 设计 90-120 分钟协会周末试点课。
- 包含：课前准备、现场流程、演示题、学生分组试用、反馈收集、课后复盘。
- 明确每 10-20 分钟做什么，主持人说什么，学生交付什么。
- 要能直接给协会教学组照着执行。

三、新增 docs/content/model_cards.md
- 整理常见数学建模模型卡片。
- 至少包含：线性/整数规划、时间序列预测、回归、随机森林、熵权-TOPSIS、AHP、聚类、灰色预测、排队论、微分方程。
- 每张卡片包含：适用场景、输入、输出、优点、局限、检验方式、适合新手怎么学。
- 不要写成教科书长文，写成工作台可复用的短卡片。

四、新增 docs/content/toolbox_checklists.md
- 整理工具箱清单。
- 至少包含：数据清洗清单、特征工程清单、模型检验清单、优化约束检查清单、图表表达清单、论文结构清单、AI 使用记录清单。
- 每个清单用可勾选项呈现，适合后续放进网页。

五、新增 docs/trial/07_试运行招募文案.md
- 写 3 个版本：
  1. 面向普通参赛同学。
  2. 面向数学建模协会教学组。
  3. 面向项目答辩/老师说明。
- 只强调免费试运行、学习辅助、反馈共创、合规透明。
- 不出现收费、会员、保奖、代写、一键论文等表述。

六、可选：精修 cases/*.json
- 可以优化三个案例的教学表达，但必须保持 JSON 结构不变。
- sections 必须保留原有 key。
- 不要写可直接提交的论文段落。
- 修改后请用 PowerShell 或 Python 检查 JSON 可解析。

最后请汇报：
- 新增/修改文件清单。
- 每个文件用途。
- 是否完成 JSON 校验。
- 哪些内容建议交给 Codex 继续做成前端功能。
```
