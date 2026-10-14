# 提示词库渐进增强实施计划

用户已批准审计方案，直接在本会话执行，不再次请求方案批准。

目标：保留 9 个原 ID 和 URL，完善并新增 6 条原创模板，修复填写、缓存、预填、回程和复制边界，保持全部待负责人复核。

架构：继续使用 React / TypeScript / Vite、原有路由和设计 token。content/prompts 内分离类型、原有模板、新模板、文本生成；PromptDetail 保留公开导出的缓存/预填接口供七关使用。局部 CSS 仅从提示词页面引入。无新增依赖或服务。

## 执行顺序

- [x] 先在 Prompts.test.tsx 增加示例保护、非法缓存、可选空项、复制边界、比赛组合筛选、清空筛选保留 back 的失败用例；在 library/PromptDetail.test.tsx 检查跨案例预填和手工值保护；更新内容契约为恰好 15 条、保留全部旧 ID。
- [x] 执行 `npx vitest run src/pages/Prompts.test.tsx src/pages/library/PromptDetail.test.tsx src/content/prompts/prompts.test.ts --maxWorkers=2 --minWorkers=1`，记录预期失败。
- [x] 实现数据/文本契约。比赛类型为 general / CUMCM / MCM-ICM / campus，比赛筛选包含通用项；空可选字段生成“未提供”，缺少必填项保留占位符；预览与复制用同一完整文本生成函数，附用途、前提、限制和官方规则提醒。
- [x] 完善 9 条并新增异常值、敏感性、结果核验、摘要组织、论文全文检查、AI 使用规则核对 6 条。每条用真实输入、证据、无法判断和人工核验限制约束输出，版本更新但不升级审核状态。
- [x] 实现 UI 和缓存回归修复。示例仅补空值；校验旧缓存值/标记；自动预填可随案例更新而手工内容保留；非法筛选回到全部；清空筛选保留安全回程；复制状态随输入重置并防止异步串模板。
- [x] 补七关入口回归，复跑针对性测试；检查全部 15 条的输入字段和输出要求是否一致。
- [x] 运行 `npx --no-install tsc --noEmit`、`npm test -- --maxWorkers=2 --minWorkers=1`、`npm run build`。沿用审计时的低并发参数，项目测试配置不改。
- [x] 独立端口生产预览，gstack Chromium 桌面/手机和深浅主题、组合筛选、变量、示例、复制成功/失败/未填、七关往返和跨案例验证。只用虚构教学输入。
- [x] 检查差异和代码评审，修复问题并运行必要检查；写交付报告及模板说明，显式暂存本模块文件，在 codex/prompt-library-improvement 提交，不推送、不创建 PR、不部署。

关键验收示例：已有输入“我的代码”点击填示例后仍为“我的代码”；缓存数字字段不得引发 trim 异常；A 题自动预填进入 B 题后更新，手工改写题面则保留；从带 back 的无结果筛选清空后仍能回七关；复制文本包含模板限制且不递归替换用户输入中的花括号；15 条全部 self-checked。

执行结果：42 个测试文件、373 项测试通过，TypeScript 与构建通过。浏览器复制成功使用受控 Clipboard API 边界验证；原生权限拒绝和手动回退实际验证通过，原生写入成功保留人工验收。详细证据、文件清单与限制见 `docs/prompt-library-delivery.md`。
