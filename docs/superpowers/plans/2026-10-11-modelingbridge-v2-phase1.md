# ModelingBridge 2.0 Phase 0–1

**Goal:** 在 `feat/modelingbridge-v2-ui` 完成视觉、首页、导航和基础动效，交付本地预览后暂停验收。
**Architecture:** 保留 React Router、静态教学内容、FastAPI 和七关存储结构；共享设计变量，独立 Canvas 与视口渐显组件；非首页路由按需加载。
**Tech stack:** React 18 / TypeScript / Vite / Tailwind / Canvas 2D，无新增运行时依赖。

## Phase 0 审查

- 原工作区 `main` 干净；已 fetch origin，正式基线 `54e7d4c`，创建用户指定分支。开发分支取消对正式分支的 upstream，防止误推。
- 已有：学习路径、模型方法、经典题型、8 个静态案例、赛事日历、编码写作技巧、七关训练与 Markdown 导出、本地记录。
- 保留：全部页面路由、`cases/*.json`、教学数据、`mb_quest_draft:` 数据和训练判定逻辑。
- 结构问题：首页信息密集；8 个主导航在移动端横向拥挤；所有页面同步打包；全局装饰动画循环运行。
- 后端依赖：资源索引/下载、工作台分析、赛事计划生成。案例在 API 不可用时已有静态回退。静态站不应被标成 AI 在线。
- 部署：保留 `frontend/edgeone.json` SPA rewrites、现有域名和配置。不推送、不部署、不购买服务。
- 本机日志：`codex_block_logs_insert` 已存在，未修改数据库或日志设置。

## 设计

采用深海军蓝首屏与轻纸色阅读区，青绿色强调，系统中文字体。数学网络在右侧形成可辨识的球面节点结构，左侧保障标题和 CTA 可读。放弃大体积 3D 引擎和整站深色阅读方案，避免性能与长文对比度负担。

首页九段：数学网络 Hero → 四个功能入口 → 三条学习路径 → 四张模型卡 → 经典题型与案例 → 七关流程入口 → 现有编码/写作工具 → AI 状态 → 公益/开源/协会贡献。

## 执行清单

- [x] 行为测试：移动菜单切换/Escape/路由关闭；Canvas rAF 清理、可见性和减少动态效果；首页关键入口与真实服务文案。
- [x] 共享 UI：`src/index.css` 设计变量、字体、按钮/卡片/表单/反馈规范；`layouts/Layout.tsx` 五项导航、移动菜单、完整页脚。
- [x] 动画：`components/motion/MathNetwork.tsx` 粒子网络，DPR ≤ 1.5、移动节点减少、30fps 上限；`Reveal.tsx` IntersectionObserver 一次渐显。
- [x] 首页：`pages/Home.tsx` 复用现有教学数据；模型锚点、案例和七关入口可访问，不新增虚假下载、在线服务或练习。
- [x] 路由：`App.tsx` 按需加载，加载/失败状态，保留 history 与深链接；路由进入动画不通过重挂载 Layout 重置现有状态。
- [x] 验证：`npm test -- --maxWorkers=2 --minWorkers=1`、`npx tsc --noEmit`、`npm run build`；桌面/手机截图、导航/深链接/七关回归；`git diff --check`。
- [x] 交付：记录验证结果、预览命令、限制；只提交开发分支；等待 Phase 1 视觉验收。

## 验收边界

Phase 2 内容索引与详情、Phase 3 在线答题及七关界面重构、Phase 4 后端方案不在本轮实施。无真实后端时显示「AI 在线服务暂未开放」，现有本地训练保持可用。中国大陆实网访问和 EdgeOne 云端部署不在本地验证范围，不能据此宣称通过。

验证结果：17 个测试文件 / 42 项通过，TypeScript 与 Vite 构建通过，浏览器导航、手机布局、七关保存和历史滚动恢复已检查。详见 `docs/modelingbridge-v2-phase1-delivery.md`。Phase 1 验收是本轮停止点。
