# 06 技术准备与开发环境

## 1. 第一阶段技术目标

第一阶段技术准备只做到“第二阶段能开工”，不追求完整业务系统。

需要明确：

- 技术栈
- 推荐目录结构
- 前后端边界
- AI 调用封装方式
- 接口草案
- 环境变量
- 暂缓功能
- 技术风险

## 2. 推荐技术路线

| 模块 | 建议方案 | 第一阶段任务 |
| --- | --- | --- |
| 前端 | Next.js / React | 确定页面路由、组件结构和 UI 风格 |
| 后端 | FastAPI | 设计 AI 工作台接口草案 |
| AI 调用 | OpenAI 兼容接口，可接 DeepSeek / Gemini / OpenAI | 先封装统一 `llm_client`，不绑定单一模型 |
| 数据存储 | SQLite 或 JSON 文件 | 第一版保存项目记录、提示词版本、用户反馈 |
| 文档生成 | Markdown 优先，后续可转 Word | 第一阶段所有材料先用 Markdown |
| 图表 | matplotlib | 后期工具箱统一图表风格 |
| 部署 | 本地开发，后期 Vercel 或服务器 | 第一阶段只写部署备选方案 |

## 3. 推荐仓库结构

```text
modelingbridge/
├─ frontend/
│  ├─ app/
│  ├─ components/
│  └─ styles/
├─ backend/
│  ├─ main.py
│  ├─ routers/
│  ├─ services/
│  └─ prompts/
├─ cases/
│  └─ bike_demand_demo/
├─ docs/
│  └─ phase1/
├─ outputs/
├─ README.md
└─ .env.example
```

当前阶段已建立：

```text
docs/
└─ phase1/
```

## 4. 前端页面路由草案

| 路由 | 页面 | 说明 |
| --- | --- | --- |
| `/` | 首页 | 定位、流程、入口、边界说明 |
| `/learn` | 学习路径 | 7 个建模学习模块 |
| `/workbench` | AI 拆题工作台 | MVP 核心页面 |
| `/cases` | 案例库 | 案例列表 |
| `/cases/[slug]` | 案例详情 | 完整案例展示 |
| `/tools` | 工具箱 | 工具入口 |
| `/about` | 关于与合规 | 学习用途和边界说明 |

## 5. 后端接口草案

| 接口 | 用途 | 输入 | 输出 |
| --- | --- | --- | --- |
| `POST /api/analyze-problem` | 题目拆解 | `problem_text`, `attachment_note` | 题型、小问、约束、输出要求 |
| `POST /api/data-needs` | 数据需求 | `problem_analysis` | 字段表、来源建议、替代方案 |
| `POST /api/recommend-model` | 模型推荐 | `problem_analysis`, `data_needs`, `student_level` | 基础模型、进阶模型、局限、检验 |
| `POST /api/save-feedback` | 保存反馈 | `user_feedback` | 保存状态 |
| `GET /api/cases` | 案例列表 | 无 | 案例标题、标签、简介 |
| `GET /api/cases/{slug}` | 案例详情 | `slug` | 案例完整内容 |
| `GET /api/prompts/version` | 提示词版本 | 无 | 当前版本、更新时间 |

## 6. 核心数据结构草案

题目分析结果：

```json
{
  "problem_type": "prediction_optimization",
  "type_reason": "题目要求先预测需求，再提出调度建议",
  "subtasks": [
    {
      "id": "q1",
      "goal": "预测未来一周各区域需求",
      "inputs": ["历史订单", "天气", "节假日"],
      "outputs": ["区域需求预测表"],
      "constraints": ["区域容量", "车辆库存"],
      "metrics": ["MAE", "RMSE"]
    }
  ],
  "student_confirmations": ["确认题型", "确认小问无遗漏"]
}
```

模型推荐结果：

```json
{
  "basic_models": [
    {
      "name": "多元线性回归",
      "reason": "适合解释天气、时间、区域等因素对需求的影响",
      "limitations": "难以捕捉复杂非线性关系",
      "validation": "误差指标与残差分析"
    }
  ],
  "advanced_models": [
    {
      "name": "随机森林回归",
      "reason": "能处理非线性和特征交互",
      "limitations": "解释性弱于线性模型",
      "validation": "交叉验证和特征重要性分析"
    }
  ],
  "requires_student_confirmation": true
}
```

## 7. 环境变量草案

`.env.example` 后续建议包含：

```text
LLM_PROVIDER=deepseek
LLM_API_KEY=replace_with_your_key
LLM_BASE_URL=https://api.example.com/v1
LLM_MODEL=replace_with_model_name
DATABASE_URL=sqlite:///./modelingbridge.db
APP_ENV=development
```

注意：

- 不提交真实 API Key。
- `.env` 文件必须加入 `.gitignore`。
- 第一版统一通过 `llm_client` 调用模型，避免业务代码绑定具体供应商。

## 8. 开发规范草案

| 类型 | 规范 |
| --- | --- |
| 文档 | Markdown 优先，文件名使用英文和数字前缀 |
| Prompt | 按功能拆分，保留版本号和测试记录 |
| 接口 | 请求和响应尽量结构化，前端不解析长文本 |
| 数据 | 外部来源必须可追溯，无法确认时标注“需人工确认” |
| 输出 | AI 输出必须包含原因、局限和学生确认点 |
| 安全 | 不在线运行用户任意代码，不存储敏感个人信息 |

## 9. 暂缓开发功能

| 功能 | 暂缓原因 | 替代方案 |
| --- | --- | --- |
| 在线代码运行 | 环境隔离和安全成本高 | 提供本地代码框架 |
| 微信或其他入口 | 主流程未稳定 | 先完成网页 MVP |
| 完整论文生成 | 不符合引导式学习定位 | 只给结构和写作要点 |
| 自动外网搜数据 | 来源可靠性难控制 | 数据需求表 + 人工确认 |
| 大规模用户系统 | 第一版验证不需要 | 先用本地记录或轻量反馈表 |

## 10. 技术风险

| 风险 | 影响 | 第一阶段应对 |
| --- | --- | --- |
| 模型输出不稳定 | 页面难展示、用户不信任 | 固定输出格式，记录提示词版本 |
| API 成本不可控 | Demo 成本上升 | 限制输入长度，缓存案例输出 |
| 数据来源不可靠 | 学术风险 | 标注需人工确认，不自动引用 |
| Prompt 越界生成终稿 | 定位跑偏 | 每个 Prompt 写入禁止事项 |
| 前后端边界不清 | 第二阶段返工 | 先定接口草案和数据结构 |
| 部署环境不确定 | 上线延期 | 先本地开发，后期再选部署 |

## 11. 验收标准

- 技术栈和目录结构已确定。
- 前后端接口草案已形成。
- 提示词、案例、页面原型都能进入仓库管理。
- 环境变量和 API Key 处理规则明确。
- 第二阶段可以直接开始开发首页和 AI 工作台。
