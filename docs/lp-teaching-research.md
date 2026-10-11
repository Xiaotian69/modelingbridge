# 线性规划教学研究与来源记录

研究日期：2026-10-11。用途：设计原创教学样板；没有将第三方教程正文或本地 PDF 发布到网站。以下区分“检查了材料”与“实际执行了代码”。

## GitHub 与公开例题调查

| 项目 / 原始地址 | 具体例题 | 许可与复用边界 | 模型、完整程度与核验方式 |
| --- | --- | --- | --- |
| [PuLP](https://github.com/coin-or/pulp) | [A Blending Problem](https://coin-or.github.io/pulp/CaseStudies/a_blending_problem.html) | [MIT](https://raw.githubusercontent.com/coin-or/pulp/master/LICENSE)。复用受许可覆盖的代码应保留版权与许可；本轮未复制其代码或正文。 | 配料 LP；背景、数据、变量、约束、Python、结果较完整。可依赖安装对应 PuLP/求解器后复算；本轮阅读，没有运行此原例。 |
| [OR-Tools](https://github.com/google/or-tools) | [LP Example](https://developers.google.com/optimization/lp/lp_example)、[Stigler Diet](https://developers.google.com/optimization/lp/stigler_diet) | [仓库 Apache-2.0](https://raw.githubusercontent.com/google/or-tools/stable/LICENSE)；开发者文档页按其页脚 CC BY 4.0、代码示例 Apache-2.0，第三方例外需单独检查。本轮只链接。 | LP 与饮食成本最小化；提供约束、完整数据/代码、求解状态与结果。小例 max 3x+4y 的解 (6,4)、值 34 可手算代回；饮食例可运行核验，但本轮没有执行其完整数据集。 |
| [Python Data Science Handbook](https://github.com/jakevdp/PythonDataScienceHandbook) | [In Depth: Linear Regression](https://jakevdp.github.io/PythonDataScienceHandbook/05.06-linear-regression.html) | [代码 MIT](https://raw.githubusercontent.com/jakevdp/PythonDataScienceHandbook/master/LICENSE-CODE)；[正文 CC BY-NC-ND 4.0](https://raw.githubusercontent.com/jakevdp/PythonDataScienceHandbook/master/LICENSE-TEXT)。公开可读不等于允许翻译、改写后公开。本轮只参考编排思路。 | 回归，不是 LP。文字、代码、图像交替推进，数据及输出可由 notebook 重现，随机数据需留意版本与种子。本轮没有运行原 notebook。 |
| [ND Pyomo Cookbook](https://github.com/jckantor/ND-Pyomo-Cookbook) | [Production Models with Linear Constraints](https://jckantor.github.io/ND-Pyomo-Cookbook/notebooks/02.01-Production-Models-with-Linear-Constraints.html) | [代码 MIT](https://raw.githubusercontent.com/jckantor/ND-Pyomo-Cookbook/main/LICENSE-CODE.txt)；[正文 CC BY-NC-ND 4.0](https://raw.githubusercontent.com/jckantor/ND-Pyomo-Cookbook/main/LICENSE-TEXT.txt)。不能因为仓库标有 MIT 就把正文当成 MIT。本轮不复制或改编文字。 | 生产 LP，先单产品再组合、从收入成本得到利润，连到灵敏度；数据/模型/代码/结果完整，可安装 Pyomo 与求解器复算。本轮阅读原例，未执行原 notebook。 |
| [SciPy](https://github.com/scipy/scipy) | [linprog 官方 API](https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.linprog.html) | SciPy BSD-3-Clause；本轮调用安装包 API，Python 例子自行编写。 | 用 HiGHS 独立验证本章原创例题和 117 组参数，包括连续和整数最优值，共 234 次参考求解。参考数据生成脚本与结果进入仓库。 |

上述 GitHub/官方页面实际可访问。在线主分支可能更新；复现本章应使用本仓库锁定的前端依赖及记录的 Python 环境，而非假定外部示例 API 永远不变。PuLP 当前文档/版本间 API 和求解器安装方式存在变化，本章因此使用已在本机验证的 SciPy 示例。

教学取舍：采用“一个问题贯穿多个步骤”，而不是从模型名词开始罗列卡片；每一行数组对应一行约束，代码输出紧接解释；数值结果代回原问题；最后用改变需求或变量类型引导迁移。本章生产背景、数据与中文正文独立编写，没有翻译任何外部教程。

## 《数模》历史资料的结构分析

用户提供：`资料/数学建模竞赛新手教程 (数学建模委员会) (z-library.sk, 1lib.sk, z-lib.sk).pdf`，共 95 页。已本地抽取并视觉查看代表页；抽取文本与页面图只放在忽略目录 `.context/teaching-research`，不进入前端 public/dist。PDF 第 2 页有版权声明，作者保留相关权利；本轮只做研究性结构摘要。

封面显示 2004.1，内页页眉显示 2004 年 11 月，两者不一致；此处按“2004 年第 1 卷第 1 期”描述，不补造准确出版月。以下 PDF 页码从 1 开始，与印刷页码不同。

| 阅读位置 | 观察到的组织方法 | 本章原创设计中的对应 |
| --- | --- | --- |
| 新手教程，PDF 10–15 页，印刷 6–11 页 | 先借日常问题暴露隐含条件，再讨论假设、表达、计算与现实解释；后续竞赛叙事连接数据观察、算法和检验。 | 开头先问为什么不能只做高利润产品；资源表之后才命名变量；“算对”后再检查订单、损耗和排程。没有复用原文对话。 |
| 十类算法，PDF 16–18 页，印刷 12–14 页 | 用方法分类给学习者建立全局认识，并与问题类型关联。 | 速查保留为辅助层；初学课程仅展开一种方法，并明确回归、整数模型与 LP 的分工。算法清单不当作必学排名。 |
| 电力市场输电阻塞管理模型，PDF 22 页起；重点读 22–26 页 | 背景、假设、符号、物理限制、优化目标与计算依次相接；先明确约束可行性再谈经济目标。 | 符号表明单位，逐条解释工时约束；完整比较顶点；Python 后给约束剩余量与现实核查。没有搬运论文公式/数据。 |

历史与现代的区分：当年的 DOS、Turbo C、Win2000 等工具经验和硬件限制不作为今天的软件建议；本章使用现代 Python/SciPy。参赛经验中偏奖项、人员分工或时代刻板印象的表达不引入课程。值得保留的是从问题出发、明确关键假设、计算后检验的过程，而非照搬当年的环境与经验结论。

## 题库与 AI 后续边界

`questions.ts` 独立维护来源、知识点、难度、题型、答案、容差、提示、解析、审核状态与核验说明。仅 `review === 'verified'` 发布。当前均为原创静态客观题，数学答案由手算、独立 HiGHS 或明确定义核验；这不是外部教师已经审核的声明。

未来 AI 只能生成候选题：先检查结构，再由独立程序验证计算，人工复核叙述、歧义和教学适用性，才转为 verified。开放建模报告保持待审核，不能用关键词覆盖率冒充正确性评价。本轮没有接入或伪装实时生成服务，没有新增服务器。
