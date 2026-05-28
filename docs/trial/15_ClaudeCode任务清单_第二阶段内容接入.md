# 15 ClaudeCode 任务清单：第二阶段内容接入准备

日期：2026-05-25

## 一、任务定位

ClaudeCode 这次不要继续扩写大段内容，而是把已经写好的内容变成**可产品化接入的短内容、结构化矩阵和质量检查报告**。

Codex 下一步会把这些内容接入前端 `/quest`，所以 ClaudeCode 的交付物要短、清晰、可映射、可检查。

## 二、协作边界

### 不要修改

- `frontend/src/**/*.tsx`
- `frontend/src/**/*.ts`
- `frontend/src/**/*.css`
- `backend/app/**/*.py`
- `backend/.env`
- `backend/.env.example`
- `frontend/package.json`
- `frontend/package-lock.json`

### 可以新增或修改

- `docs/content/*.md`
- `docs/research/*.md`
- `docs/trial/*.md`
- `cases/*.json` 的文案内容，但必须保持 JSON 结构不变

### 内容原则

- 做学习训练，不做代写。
- 做任务引导，不给最终答案。
- 做模型比较，不替学生做最终判断。
- 产物示例只给结构和短句。
- 所有外部来源必须标明来源或说明“需人工核验”。
- 删除或改写“保奖、一键论文、降 AIGC、直接提交、整篇生成”等风险表达。

## 三、输入资料

请优先读取并复用这些现有文件：

- `docs/content/quest_stage_templates.md`
- `docs/content/quest_case_scripts.md`
- `docs/content/quest_ai_coach_prompts.md`
- `docs/content/model_method_cards_quest.md`
- `docs/content/quest_report_template.md`
- `docs/content/quest_home_copy_options.md`
- `docs/research/quest_problem_bank.md`
- `cases/bike_demand_demo.json`
- `cases/evaluation_topsis_demo.json`
- `cases/optimization_dispatch_demo.json`

不要从零重写，先审校和压缩。

## 四、P0 任务

### 任务 1：内容审校报告

交付文件：

- `docs/content/quest_content_audit.md`

要求：

- 检查以下 4 类内容是否对齐：
  - 7 关通用模板。
  - 3 个案例训练脚本。
  - AI 教练提示词。
  - 模型方法卡。
- 输出一个表格，列出：
  - 内容项。
  - 当前状态：可直接接入 / 需要压缩 / 需要补齐 / 有合规风险。
  - 发现的问题。
  - 建议修改。
- 单独列出所有合规风险句子，并给出替代表达。
- 单独列出“内容太长不适合前端卡片”的段落。

验收标准：

- 至少覆盖 8 个已有内容文件。
- 每个问题都要指出文件名和小标题。
- 不写泛泛评价，必须给可执行修改建议。

### 任务 2：3 个案例的产品化内容矩阵

交付文件：

- `docs/content/quest_case_seed_matrix.md`

优先案例：

- `bike_demand_demo`
- `evaluation_topsis_demo`
- `optimization_dispatch_demo`

要求：

按下面结构输出，每个案例 7 关，每关都要有固定字段：

```md
## caseSlug: bike_demand_demo

### stageId: read_problem

- taskBrief:
- studentPrompt:
- coachHints:
  1.
  2.
  3.
- commonMistakes:
  1.
  2.
- outputExample:
- mustDoByStudent:
- complianceNote:
```

字段要求：

- `taskBrief` 不超过 80 字。
- `studentPrompt` 不超过 120 字。
- `coachHints` 每条不超过 80 字。
- `commonMistakes` 每条不超过 80 字。
- `outputExample` 只能是结构示意或短句，不能形成论文段落。
- `mustDoByStudent` 必须写清“学生自己要判断/填写什么”。
- `complianceNote` 必须提醒 AI 只做学习辅助。

验收标准：

- 3 个案例 × 7 关全部完整。
- 每关字段齐全。
- 没有超过 200 字的大段落。
- 没有可直接提交的论文式段落。

### 任务 3：AI 教练提示词包 v2

交付文件：

- `docs/content/quest_coach_prompt_pack_v2.md`

要求：

按 `stageId + mode` 输出 21 条提示词：

- `read_problem.hint`
- `read_problem.example`
- `read_problem.check`
- `breakdown.hint`
- 依次类推，直到 `paper.check`

每条提示词必须包含：

- promptId。
- 适用场景。
- 输入变量。
- 提示词正文。
- 输出格式。
- 禁止事项。

输入变量统一使用：

- `{{problemText}}`
- `{{caseTitle}}`
- `{{stageTitle}}`
- `{{stageGoal}}`
- `{{studentAnswer}}`
- `{{passConditions}}`

输出格式建议：

```md
1. 先反馈学生当前答案的一个优点。
2. 再指出 1-2 个需要补充的点。
3. 最后给一个下一步问题。
```

验收标准：

- 21 条提示词完整。
- 每条都有稳定 promptId。
- 每条都要求 AI 不写最终论文正文、不虚构数据、不替学生做最终判断。
- 提示词长度适合复制到前端或后端，不要写成长文章。

## 五、P1 任务

### 任务 4：模型选择关卡卡片压缩版

交付文件：

- `docs/content/model_method_cards_frontend.md`

优先模型：

- 线性规划
- 时间序列
- 回归/随机森林
- 熵权 TOPSIS
- AHP
- 聚类
- 微分方程
- 网络流

每张卡使用固定字段：

```md
## modelId: linear_programming

- name:
- fitWhen:
- requiredData:
- output:
- commonMisuse:
- validation:
- noviceQuestions:
  1.
  2.
  3.
- paperExpressionTip:
```

验收标准：

- 至少 8 张卡。
- 每张卡不超过 220 字。
- `noviceQuestions` 至少 3 个。
- 明确说明“这不是最终模型推荐，学生仍需结合数据判断”。

### 任务 5：通关报告模板产品化版

交付文件：

- `docs/content/quest_report_template_frontend.md`

要求：

- 把现有通关报告模板压缩成前端可生成的版本。
- 明确每一段由哪个关卡答案填充。
- 明确哪些地方必须由学生手写。
- 明确 AI 使用记录格式。

必须包含：

- 训练题信息。
- 7 关产物。
- 我的判断。
- AI 建议摘要。
- 人工确认记录。
- 剩余工作。
- 合规声明。

验收标准：

- 模板适合前端拼接。
- 没有需要人工猜测的字段。
- 不包含完整论文段落。

### 任务 6：体验文案补充

交付文件：

- `docs/content/quest_microcopy_v2.md`

要求：

输出以下文案：

- 10 条“继续上次闯关”提示。
- 10 条“通关成功”反馈。
- 10 条“还不能通关”提示。
- 10 条“AI 教练边界”短句。
- 5 条“完成 7 关后”的复盘提示。

风格要求：

- 有闯关感，但不幼稚。
- 语气鼓励，但不夸大。
- 不使用保奖、稳赢、提分保证等表达。

## 六、P2 任务

### 任务 7：轻剧情包装建议

交付文件：

- `docs/content/quest_light_story_options.md`

要求：

- 只做建议，不要求 Codex 立刻实现。
- 提供 3 个轻剧情方向。
- 每个方向说明：
  - 适合用户。
  - 可以带来的获得感。
  - 可能风险。
  - 为什么不能影响学习流程。

验收标准：

- 不引入重剧情设定。
- 不设计金币、排行榜、抽卡。
- 明确剧情只是包装，不改变 7 关学习结构。

## 七、交付顺序

推荐顺序：

1. `quest_content_audit.md`
2. `quest_case_seed_matrix.md`
3. `quest_coach_prompt_pack_v2.md`
4. `model_method_cards_frontend.md`
5. `quest_report_template_frontend.md`
6. `quest_microcopy_v2.md`
7. `quest_light_story_options.md`

P0 的 1-3 必须先完成，Codex 才适合开始工程接入。

## 八、最终汇报格式

ClaudeCode 完成后请按这个格式汇报：

```md
## 完成文件

- 文件：
- 用途：
- 可直接产品化程度：

## 合规检查

- 是否发现风险表达：
- 如何替换：
- 是否存在版权/来源风险：

## 给 Codex 的接入建议

- 建议先接入哪些字段：
- 哪些内容适合前端卡片：
- 哪些内容不适合前端直接展示：

## 仍需人工确认

- 内容问题：
- 产品问题：
- 来源问题：
```

## 九、成功标准

这份任务完成后，Codex 应该能不再重新理解大段内容，而是直接把内容映射到：

- `caseSlug`
- `stageId`
- `coachMode`
- `modelId`
- `reportSection`

如果 Codex 还需要重新从长文里摘句子，说明本轮 ClaudeCode 任务没有完成到位。

