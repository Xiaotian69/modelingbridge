# 通关报告模板（前端接入版）

> 用途：`buildQuestReportMarkdown()` 函数的输出格式参考，以及前端报告预览界面的结构规范  
> 性质：学习复盘记录；每个字段标注数据来源（前端状态 vs 学生自填）  
> 合规提示：报告是学习工具，不是可提交的比赛论文；每个人工确认环节需学生手动完成

---

## 字段来源说明

| 字段类型 | 说明 |
|---------|------|
| **自动填入** | 由前端状态（`questState`）自动生成，不需要学生操作 |
| **学生自填** | 来自答案框（`states[i].answer`），学生在关卡内写入 |
| **学生勾选** | 来自通关条件（`checks[stageId]`），学生手动打勾 |

---

## 报告结构（Markdown 格式，前端生成）

---

### 报告头部（自动填入）

```markdown
# 数模闯关训练营 · 通关报告

**题目**：{caseTitle}
**训练来源**：{sourceLabel}
**完成进度**：{completed}/{total} 关（{percent}%）
**生成时间**：{generatedAt}

---
```

字段映射：
- `{caseTitle}` → `caseDetail?.title ?? "自定义训练题"`
- `{sourceLabel}` → `caseDetail ? "案例训练副本：" + caseDetail.title : "默认示例题"`
- `{completed}` → `getQuestProgress(states).completed`
- `{total}` → `getQuestProgress(states).total`
- `{percent}` → `getQuestProgress(states).percent`
- `{generatedAt}` → `new Date().toLocaleString()`

---

### 第 1 关：题目理解（read_problem）

```markdown
## 第 1 关：题目理解

**完成状态**：{stage1_completed}

### 我的题目摘要
{stage1_answer}

### 本关通关条件确认
- [{stage1_check_0}] 我用了自己的语言重述，没有复制原题
- [{stage1_check_1}] 我列出了至少3条具体疑问（指向不明确之处）
- [{stage1_check_2}] 我给出了题型判断和判断理由
```

字段映射：
- `{stage1_completed}` → `states.find(s => s.stageId === "read_problem")?.completed ? "✓ 已通关" : "进行中"`
- `{stage1_answer}` → `states.find(s => s.stageId === "read_problem")?.answer || "（未填写）"`
- `{stage1_check_N}` → `checks["read_problem"][N] ? "x" : " "`（使用 Markdown checkbox 格式）

---

### 第 2 关：任务拆解（breakdown）

```markdown
## 第 2 关：任务拆解

**完成状态**：{stage2_completed}

### 我的子问题拆解
{stage2_answer}

### 本关通关条件确认
- [{stage2_check_0}] 我列出了至少2个有明确输入/输出的子问题
- [{stage2_check_1}] 我说明了子问题之间的依赖关系
- [{stage2_check_2}] 我给出了每个子问题的难度评估和理由
```

字段映射同第1关，`stageId` 替换为 `"breakdown"`。

---

### 第 3 关：数据侦查（data）

```markdown
## 第 3 关：数据侦查

**完成状态**：{stage3_completed}

### 我的数据清单与质量检查
{stage3_answer}

### 本关通关条件确认
- [{stage3_check_0}] 我完成了三栏数据清单（已有/待获取/需假设），每栏至少1条带说明
- [{stage3_check_1}] 我对数据做了至少3项质量检查并记录了结果
- [{stage3_check_2}] 我标出了至少1个数据风险点及其对模型的潜在影响
```

字段映射同上，`stageId` 替换为 `"data"`。

---

### 第 4 关：模型选择（model）

```markdown
## 第 4 关：模型选择

**完成状态**：{stage4_completed}

### 我的模型选择与理由
{stage4_answer}

### 本关通关条件确认
- [{stage4_check_0}] 每个子问题有至少2个候选模型并完成了对比表
- [{stage4_check_1}] 我用自己的语言写出了最终模型选择理由（不少于3句话）
- [{stage4_check_2}] 我列出了所选模型的至少2个前提假设，并说明数据是否满足
```

字段映射同上，`stageId` 替换为 `"model"`。

---

### 第 5 关：代码起步（code）

```markdown
## 第 5 关：代码起步

**完成状态**：{stage5_completed}

### 我的代码实现与结果验证
{stage5_answer}

### 本关通关条件确认
- [{stage5_check_0}] 代码成功读入数据并打印了统计摘要（行/列/缺失值/均值）
- [{stage5_check_1}] 至少一个子问题的基础模型版本能跑通并输出结果
- [{stage5_check_2}] 我对输出结果做了合理性判断，并记录了判断依据
```

字段映射同上，`stageId` 替换为 `"code"`。

---

### 第 6 关：图表表达（charts）

```markdown
## 第 6 关：图表表达

**完成状态**：{stage6_completed}

### 我的图表计划与完成说明
{stage6_answer}

### 本关通关条件确认
- [{stage6_check_0}] 每个核心子问题至少有1张对应图，图表有完整标注（标题/轴标签/图例/图注）
- [{stage6_check_1}] 我为每张图写了一句图文关系说明
- [{stage6_check_2}] 我完成了图表自查清单并记录了需修改的地方
```

字段映射同上，`stageId` 替换为 `"charts"`。

---

### 第 7 关：论文框架（paper）

```markdown
## 第 7 关：论文框架

**完成状态**：{stage7_completed}

### 我的论文框架
{stage7_answer}

### 本关通关条件确认
- [{stage7_check_0}] 论文目录完整（含摘要/各章/参考文献），章节名具体
- [{stage7_check_1}] 每个章节有至少1句"说明这章说什么"的描述
- [{stage7_check_2}] 假设列表完整（至少3条，含至少1条隐含假设）
- [{stage7_check_3}] 论文自查清单完成，待完成项有说明
```

字段映射同上，`stageId` 替换为 `"paper"`。

---

### AI 使用声明（自动填入）

```markdown
---

## AI 使用声明

本次训练使用本地 AI 教练提示卡，AI 仅提供引导性问题和示例，未替学生生成任何论文段落、模型代码或最终结论。

- AI 教练模式：本地提示卡（hint / example / check）
- 生成模式：本地内容，未调用外部大模型接口
- 人工确认：每关通关条件由学生手动勾选确认

> 如在训练过程中跳转 AI 工作台并调用了大模型，请在此补充：
> - 使用的模型提供方和模型版本
> - 使用时间
> - 人工确认和修改情况

**边界声明**：本报告仅用于学习复盘，不是可直接提交的比赛论文。数据来源、模型假设、计算结果和最终表述仍需学生自行核验与完成。
```

---

### 学习总结（学生自填区，可选）

```markdown
---

## 学习总结（可选填写）

### 这次训练最大的收获
（在 saveReport 前可在此处添加额外备注，或留空）

### 下次改进的地方
（可选）

### 建模过程中最难的决策点
（可选）
```

> 此区域在当前版本中为可选，前端实现时可在"保存通关报告"按钮旁增加一个简短的文本输入框，内容追加到报告末尾。

---

## `buildQuestReportMarkdown` 函数签名参考

```typescript
interface QuestReportInput {
  title: string;           // caseDetail?.title ?? "自定义训练题"
  sourceLabel: string;     // "案例训练副本：X" 或 "默认示例题"
  states: QuestStageState[];
  aiUsageNote: string;     // 硬编码的声明文字
}

// 返回完整 Markdown 字符串，用于 fullReport 字段存储
function buildQuestReportMarkdown(input: QuestReportInput): string
```

对应 [Quest.tsx](../../../frontend/src/pages/Quest.tsx) 中已有的 `report` 变量生成逻辑，本模板是其输出格式的规范说明。

---

## 合规要求

1. 报告中任何位置均不得出现"可直接提交""保奖""一键论文"等表述。
2. AI 使用声明为必填，不可删除或跳过。
3. 通关条件勾选状态必须如实展示（不能因为学生没通关就不展示本关内容）。
4. 报告是学习工具，前端"导出"或"下载"按钮的文案应使用"下载学习记录"而非"导出论文"。
