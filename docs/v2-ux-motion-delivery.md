# 模桥 V2 · 全站交互动效打磨（第三批之前）

日期：2026-10-12 · 分支：`feat/v2-ux-shell` · 未推送、未合并、未部署
目标：丝滑、自然、统一、克制。不加动画依赖；不改教材数学内容、判分引擎与题目 ID。

## 1. 统一的 Motion Design System

**唯一来源**：`src/design/tokens.css` 中的动效变量；`src/design/motion.ts` 为脚本驱动的少数动画提供同一组数值，`motion.test.tsx` 检查两边一致。

| 用途 | 变量 | 时长 | 缓动 |
| --- | --- | --- | --- |
| 按钮、搜索结果、标签切换、导航下划线 | `--dur-quick` | 140ms | `--ease-standard` |
| 页面切换（淡入 + 上移 6px） | `--dur-page` | 220ms | `--ease-enter` |
| 展开 / 收起（反馈、提示、帮助梯子、目录） | `--dur-expand` | 220ms | `--ease-standard` |
| 滑动面板（手机菜单、将来的 AI 助教抽屉） | `--dur-panel` | 260ms | 进 `--ease-enter` / 出 `--ease-exit` |
| 深浅主题切换 | `--dur-theme` | 240ms | `--ease-standard` |
| 回看小节的柔和高亮 | `--dur-highlight` | 1800ms（页面淡入后开始） | `--ease-standard` |

- `--motion-scale`：正常 1；系统“减少动态效果”时为 0（全部动效关闭，平滑滚动也关闭）；低性能设备（内存 ≤ 2GB、CPU ≤ 2 核或开启省流量）为 0.6，且页面切换只淡入不位移。
- 新增两个可复用组件：`Collapse`（网格 0fr↔1fr 展开收起，收起时保留内容淡出，关闭后 `inert` + `aria-hidden`）与 `Sheet`（统一的滑动面板，手机菜单已改用，AI 助教抽屉之后直接复用）。
- 只动画 `opacity`、`transform`、颜色与网格轨道；任何动效都不拦截点击、键盘和输入。

**没有使用 View Transitions API 的原因**：它在过渡期间会冻结页面输入（违背“不阻塞点击与输入”），且当前 `BrowserRouter` 不支持路由级视图过渡。主题切换改用短暂的 CSS 颜色过渡，页面切换用 Web Animations，效果相同且不阻塞。

## 2. 精讲 ↔ 刷题衔接

| 行为 | 实现 |
| --- | --- |
| 跳到相关教材 | 跨页面时**瞬间**定位（不与页面淡入冲突），标题不被吸顶栏遮挡；页面淡入结束后，目标小节出现柔和描边高亮并渐隐 |
| 返回原题 | 回程票记录离开时“反馈区”在屏幕上的位置；返回后以该反馈区为锚点复位（实测离开时 366px，返回后 360px），**不再跳回页面顶部** |
| 返回后页面状态 | 草稿、尝试次数、提示级别照旧恢复；上次的判分反馈由确定性判分重新计算后原样显示（仍不含标准答案） |
| 同页目录 / 上一节 / 下一节 | 平滑滚动；跨页面与浏览器前进后退为瞬间定位 |
| 浏览器前进后退 | 不播放页面动画，按历史记录精确恢复滚动位置；位置保存在 `sessionStorage`，整页刷新后仍有效 |
| URL 语义 | 未改变：仍为 `/learn/linear-programming#小节`、`/practice/linear-programming/题目ID` |

## 3. 界面细节

- 错题反馈：每次提交柔和淡入，并以展开方式推开下方内容（不再瞬间跳动 175px）。
- 帮助梯子：首次打开从 0 展开；切换级别时高度从旧值平滑过渡到新值，文字淡入。
- 检查点的提示与解析：只有在学生点开后才渲染，展开有过渡（答案不会提前隐藏在页面里）。
- “卡住了？”提示与“已恢复你的作答”横幅：展开 / 收起过渡。
- 手机菜单：滑入、滑出（之前关闭时直接消失），遮罩淡入淡出，Esc 后焦点回到菜单按钮。
- 深浅主题：颜色 240ms 交叉淡化，结束后立即移除过渡类，不影响之后的交互。
- 粒子开屏：未改动；站内导航（含点 Logo 回首页）不播放。

## 4. 前后对比（真实浏览器逐帧采样，同一脚本，生产构建）

| 交互 | 改动前（第二批） | 改动后 |
| --- | --- | --- |
| 错题反馈出现 | 第 1 帧即完整出现，下方内容瞬间下移 175px | 189ms 内淡入并平滑推开 |
| 帮助梯子首次打开 | 第 1 帧即 163px | 0 → 179px 平滑展开；收起 165 → 0px |
| 帮助级别切换 | 163 → 224px 瞬变 | 201ms 平滑过渡 |
| 主题切换 | 1 帧硬切 | 234ms 交叉淡化 |
| 页面切换 | 216ms 淡入 | 178ms 淡入 + 上移，后退 / 前进不动画 |
| 目录内跳转 | 1 帧跳 8944px | 约 900ms 平滑滚动，标题落在阅读进度条下方 |
| 返回原题（手机） | 离开时 276px，返回后**回到顶部 0** | 反馈区位置 366px → 360px |
| 手机菜单关闭 | 直接消失 | 70 → 390px 滑出 |

压力检查：
- 主线程每 40ms 忙 30ms（模拟低端机）时连续提交、开合帮助、切主题、25ms 间隔连点导航：最终状态全部正确，页面完全不透明，无残留动画。
- 浏览器后退 / 前进精确恢复（7341 → 7341）；深链接 `#sensitivity` 标题位于吸顶栏下方；站内回首页不播放开屏。
- 控制台无错误。
- 减少动态效果：由单元测试覆盖（gstack 不允许模拟该媒体特性，未在真实浏览器切换）；CPU 降速同样无法模拟，以人为主线程阻塞代替。

## 5. 测试

| 项目 | 结果 |
| --- | --- |
| `npx tsc --noEmit` | 通过 |
| `npm test` | 35 个文件，283 项全部通过（连续两次） |
| `npm run build` | 通过；主 JS gzip 82.85 KB（+0.7 KB），主 CSS gzip 9.33 KB（+0.75 KB）；无新增依赖 |

新增 21 项动效回归测试：
- `design/motion.test.tsx`（17）：CSS / JS 变量逐项一致、时长在约定区间、减少动态与低性能缩放、`Collapse` 的隐藏与收起保留、页面动画仅在前进导航时播放且使用统一参数、连点时取消上一段动画、减少动态时不动画、主题过渡类的添加与移除、帮助梯子高度过渡。
- `components/motion/RouteScroll.policy.test.tsx`（4）：同页平滑 / 跨页瞬间、减少动态不平滑、返回原题按锚点复位、前进后退位置跨刷新保存。
- `practiceFlow.test.tsx` 补充：回程票记录锚点；返回后反馈原样显示且不含答案。

原有测试未改断言；仅 `practiceFlow` 中一处改为重新查询当前反馈元素（反馈每次提交会重新淡入）。

## 6. 修改文件

- 新增：`src/design/motion.ts`、`src/design/motion.css`、`src/design/motion.test.tsx`、`src/components/motion/Collapse.tsx`、`src/components/motion/Sheet.tsx`、`src/components/motion/RouteScroll.policy.test.tsx`
- 修改：`src/design/tokens.css`（动效变量）、`src/app/themeBoot.ts`（低性能标记）、`src/app/PrefsContext.tsx`（主题过渡）、`src/app/shell.css`（移除分散的旧动效）、`src/main.tsx`、`src/layouts/Layout.tsx`（页面动画规则、手机菜单改用 Sheet）、`src/components/motion/RouteScroll.tsx`（滚动策略、锚点复位、位置持久化）、`src/state/returnTicket.ts`、`src/pages/Course.tsx`、`src/practice/ExerciseView.tsx`、`src/practice/HelpLadder.tsx`、`src/learning/Checkpoint.tsx`、`src/learning/reader.css`、`src/practice/practiceFlow.test.tsx`
- 未改：`content.ts`、`questions.ts`、`grading.ts`、`solver.ts`、`Graph.tsx`、开屏相关文件
