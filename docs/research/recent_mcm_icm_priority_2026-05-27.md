# 近三年美赛题面与获奖论文优先处理索引

更新日期：2026-05-27

## 范围说明

这里的“近三年”按第一版可落地资料定义为 **2023、2024、2025**：

- 2023、2024：本地已有题面 PDF、数据附件和获奖论文。
- 2025：本地已有获奖论文，题面需优先从 COMAP 官方题目矩阵补齐。
- 2026：COMAP 已公布题目，但本地暂无获奖论文包；可作为后续“新题速读/选题训练”，不作为第一批论文拆解主线。

官方题目来源：

- COMAP Problems and Results Matrix: https://www.contest.comap.org/undergraduate/contests/matrix/index.html
- COMAP MCM/ICM Previous Contests: https://www.contest.comap.org/undergraduate/contests/mcm/previous-contests.php

## 本地可读性结论

### 2023-2025 获奖论文

| 年份 | 本地 PDF 数 | 显示加密 | 可提取文字 | 图片型/低文本 | 结论 |
| --- | ---: | ---: | ---: | ---: | --- |
| 2023 | 37 | 37 | 37 | 0 | 有锁但可读，可优先拆解 |
| 2024 | 28 | 28 | 28 | 0 | 有锁但可读，可优先拆解 |
| 2025 | 40 | 0 | 35 | 5 | 大部分可读，5 篇需 OCR 或人工查看 |

判断：2023、2024 的“锁”不是阻塞项。`pdfinfo` 显示加密，但 `pdftotext` 能正常提取前两页文字，适合做摘要结构、模型路线、图表表达拆解。

2025 的问题反而不是锁，而是有 5 篇图片型/低文本 PDF：

| 年份 | 题号 | 文件 | 状态 |
| --- | --- | --- | --- |
| 2025 | A | `A题/2501567.pdf` | 前两页提取 0 字，需 OCR |
| 2025 | A | `A题/2501909.pdf` | 前两页提取 0 字，需 OCR |
| 2025 | A | `A题/2504218.pdf` | 前两页提取 0 字，需 OCR |
| 2025 | A | `A题/2511565.pdf` | 前两页提取 0 字，需 OCR |
| 2025 | B | `B题/2501687.pdf` | 前两页提取 0 字，需 OCR |

### 2023-2024 本地题面

| 年份 | 本地题面 PDF | 数据附件 | 加密 | 结论 |
| --- | ---: | ---: | ---: | --- |
| 2023 | 6 | 1 | 0 | 题面可读，Wordle 数据可直接用于训练 |
| 2024 | 7 | 3 | 0 | 题面可读，Tennis/Great Lakes 数据可用于训练 |

2025 题面本地暂缺，应先用 COMAP 官方题面补齐，不需要等待额外网盘资料。

## 2023 题目与学习价值

| 题号 | 官方题名 | 第一版建议 | 适合模型 | 学习价值 |
| --- | --- | --- | --- | --- |
| A | Drought-Stricken Plant Communities | P1 | 生态系统建模、回归、微分/差分方程 | 有生态背景，对小白略难 |
| B | Reimagining Maasai Mara | P1 | 系统评价、仿真、优化 | 跨学科强，适合进阶 |
| C | Predicting Wordle Results | P0 | 特征工程、回归/随机森林、时间序列 | 有数据附件，适合小白理解“非传统数据如何特征化” |
| D | Prioritizing the UN Sustainability Goals | P0/P1 | AHP、熵权 TOPSIS、多目标评价 | 很适合接评价模型教学 |
| E | Light Pollution | P1 | 指标体系、空间/政策评价 | 适合论文表达训练 |
| F | Green GDP | P1 | 综合评价、经济环境指标 | 适合进阶评价题 |

第一批建议优先做：**2023C Wordle**、**2023D 可持续发展目标优先级**。

## 2024 题目与学习价值

| 题号 | 官方题名 | 第一版建议 | 适合模型 | 学习价值 |
| --- | --- | --- | --- | --- |
| A | Resource Availability and Sex Ratios | P1 | 生态建模、动态系统 | 机制题，进阶 |
| B | Searching for Submersibles | P1 | 搜索策略、优化、概率模型 | 适合进阶优化 |
| C | Momentum in Tennis | P0 | 时间序列、分类/回归、统计检验 | 有 Wimbledon 数据，适合从数据到论文全流程 |
| D | Great Lakes Water Problem | P0/P1 | 时间序列、网络/水文系统、优化 | 有数据和附录，适合综合训练 |
| E | Sustainability of Property Insurance | P1 | 风险评价、预测、政策分析 | 适合进阶金融风险建模 |
| F | Reducing Illegal Wildlife Trade | P1 | 网络模型、策略评价 | 适合 ICM 风格综合题 |

第一批建议优先做：**2024C Tennis Momentum**、**2024D Great Lakes Water Problem**。

## 2025 题目与学习价值

| 题号 | 官方题名 | 第一版建议 | 适合模型 | 学习价值 |
| --- | --- | --- | --- | --- |
| A | Testing Time: The Constant Wear On Stairs | P1 | 机理建模、图像/几何、材料磨损 | 题目新但对小白偏难 |
| B | Managing Sustainable Tourism | P0 | 综合评价、预测、优化、政策建议 | 非常适合做小白到进阶的完整训练 |
| C | Models for Olympic Medal Tables | P0 | 回归、时间序列、排名预测、评价 | 适合预测+论文表达，主题友好 |
| D | A Roadmap to a Better City | P1 | 网络优化、城市规划、路径/评价 | 可接图论优化 |
| E | Making Room for Agriculture | P1 | 资源配置、可持续评价、优化 | 适合优化+评价组合 |
| F | Cyber Strong? | P1 | 风险评价、网络安全指标 | 适合 ICM 综合评价 |

第一批建议优先做：**2025B Sustainable Tourism**、**2025C Olympic Medal Tables**。

## 获奖论文本地分布

| 年份 | A | B | C | D | E | F | 备注 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 2023 | 7 | 3 | 12 | 3 | 8 | 4 | 全部可提取文字 |
| 2024 | 5 | 0 | 11 | 4 | 3 | 5 | B 题本地暂无 PDF |
| 2025 | 5 | 7 | 15 | 4 | 4 | 5 | A 题 4 篇、B 题 1 篇需 OCR |

## 第一批处理顺序

建议先做 6 个“近三年经典训练副本”：

1. 2023C Wordle：特征工程 + 预测 + 英文摘要结构。
2. 2024C Tennis Momentum：统计检验 + 时序特征 + 可视化表达。
3. 2025C Olympic Medal Tables：预测 + 排名解释 + 不确定性。
4. 2025B Sustainable Tourism：评价 + 预测 + 政策优化。
5. 2023D UN Sustainability Goals：AHP/TOPSIS + 多目标权衡。
6. 2024D Great Lakes Water Problem：时序/水文数据 + 情景分析。

这些题共同覆盖：

- 建模：读题、拆任务、指标体系、预测、评价、优化。
- 编程：数据清洗、特征工程、模型训练、可视化。
- 论文：摘要、模型路线、图表说明、结果解释、敏感性分析。

## 不做什么

1. 不上传 PDF 到第三方网站批量解锁。
2. 不把获奖论文全文放进前端。
3. 不给“标准答案”或完整可提交论文。
4. 不优先处理图片型 PDF，除非该题正好进入 P0 且没有其他可读论文替代。

## 下一步

1. 先为 2023C、2024C、2025C 各选 2-3 篇可读获奖论文，拆摘要结构和模型路线。
2. 同步把 2023C、2024C 的本地数据附件做字段盘点。
3. 从 COMAP 官方补 2025B、2025C 题面链接。
4. 产出 `classic_case_learning_scripts_v1.md`，每题按“建模、编程、论文”三栏组织。
