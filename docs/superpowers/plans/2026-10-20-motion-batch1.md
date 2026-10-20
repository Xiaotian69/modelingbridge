# iOS 式动效 · 第一批 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 第一批要做到三件事：
- 站内前进导航用原生 View Transitions，做出 push 滑入、返回滑出、同层淡化三种效果；
- 全站按压反馈和弹簧曲线；
- 不改路由、不加依赖。

**Architecture:** 不替换 `BrowserRouter`，只在它下面用 `UNSAFE_NavigationContext` 包一层 navigator。只改写 `push`，`replace`、`go`、`createHref` 都原样转发，所以 Link 的 `state`、修饰键点击、外链等原有行为全部不变。

`push` 的处理顺序：
1. 判断这次导航属于哪种过渡（`navKind`）；
2. 预加载目标路由组件，最多等 300ms；
3. 调 `startViewTransition`，在回调里用 `flushSync` 提交新页面；
4. 等 `RouteScroll` 发出「已就绪」信号，最多 100ms；
5. 新快照截取后播放过渡。

任何一步失败，都退回为直接提交，并且只提交一次。

**Tech Stack:** React 18.3、react-router-dom 6.30.3（BrowserRouter）、Vite 5、Vitest 2 + jsdom、CSS custom properties、View Transitions API（Level 1，同文档内）。

**Spec:** `docs/superpowers/specs/2026-10-20-ios-motion-design.md`。第一批对应 §2 第 1–3 项和 §5.1–5.3、§5.5、§5.7。

## Global Constraints

**工程约束**
- 工作区和分支：`E:/modelingbridge-motion`，分支 `feat/motion-ios-20261020`，从生产 `41bc8a3` 拉出，已解除 upstream。
- 不推送、不合并、不上线。推送功能分支前必须先问负责人。
- 不新增任何 npm 依赖，`package.json` 和锁文件都不改。
- 提交信息不加 AI Co-Authored-By（CONTRIBUTING）。提交前运行 `git ls-files --eol` 检查，新文件必须是 `i/lf`。
- 测试基线是 3072 项全部通过（2026-10-20 实测）。每个任务结束时，全量测试都要通过。

**时长和体积上限**
- 过渡动画本体 ≤ 400ms。
- 点击后 300ms 内必须开始提交新页面。
- 等就绪（滚动、焦点）最多 100ms，超时就跳过动画，导航照常完成，并且不能再提交第二次。
- 首屏 JS 增量 ≤ 15 KB gzip（`npm run build` 前后对比）。

**动效模式**
- 减少动态：完全不调用 `startViewTransition`。
- lite：只做淡化。
- 页面在后台：不播。

**就绪判断**
预加载包装只保证路由组件本身已就绪。提交后，只要页面里还有 `.page-loading` 或 `[data-route-pending="true"]`，就跳过动画。

**不播过渡的情况**
- POP（浏览器后退、前进）。
- 只改 hash 或 search。
- 进入或离开 `/challenge`。
- 白名单里的「同页参数切换」。

## Review Focus

以下每一项都要在负责它的任务里有对应测试：
1. 快速连点 A→B：A 的预加载晚于 B 完成，最后页面必须停在 B，历史记录只多出 B 这一条（Task 4）。
2. 预加载超过 300ms 才完成：只做一次普通导航，后完成的预加载什么也不做（Task 4）。
3. `startViewTransition` 抛错，或者回调里等就绪超时：页面只提交一次，URL 正确（Task 4）。
4. 带 `state` 的 Link（例如返回条的 `restore`）经过包装后，`state` 原样到达 `location.state`（Task 5）。
5. 目标页的子组件在提交后仍处于加载状态（`.page-loading`）：调用 `skipTransition`，页面正常显示（Task 4）。

---

### Task 1: 弹簧曲线 token 与按压反馈（CSS）

**Files:**
- Modify: `frontend/src/design/tokens.css:44-58`，以及 `@media (prefers-reduced-motion)` 所在的那一段
- Modify: `frontend/src/design/motion.ts`（`EASING`）
- Modify: `frontend/src/design/motion.css`（`.mb-collapse`、`.mb-sheet-*`、按压规则）
- Test: `frontend/src/design/motion.test.tsx`

**Interfaces:**
- Produces: CSS 变量 `--ease-spring` 和 `--ease-spring-bouncy`；`EASING.spring`、`EASING.springBouncy`（字符串，与 CSS 逐字一致）。

两条曲线的值是用阻尼弹簧阶跃响应生成的：ζ=0.82 取 24 段，ζ=0.6 取 28 段。直接照抄，不要重新生成：

```
spring:       linear(0, 0.051, 0.167, 0.31, 0.454, 0.586, 0.699, 0.79, 0.86, 0.913, 0.951, 0.977, 0.993, 1.003, 1.009, 1.011, 1.011, 1.01, 1.009, 1.007, 1.006, 1.004, 1.003, 1.002, 1)
springBouncy: linear(0, 0.071, 0.237, 0.438, 0.635, 0.804, 0.932, 1.02, 1.07, 1.092, 1.093, 1.082, 1.064, 1.045, 1.027, 1.013, 1.002, 0.996, 0.992, 0.991, 0.992, 0.993, 0.995, 0.997, 0.998, 0.999, 1, 1.001, 1)
```

- [ ] **Step 1：写测试。** 在 `motion.test.tsx` 新增 describe `"spring tokens"`，包含以下四个用例：
  - `it("defaults to the standard curve where linear() is unsupported")`：`tokens` 中包含 `--ease-spring: var(--ease-standard);` 和 `--ease-spring-bouncy: var(--ease-enter);`。
  - `it("upgrades inside @supports linear()")`：`tokens` 匹配 `/@supports \(transition-timing-function: linear\(0, 1\)\)\s*\{\s*:root\s*\{[^}]*--ease-spring: linear\(/`。
  - 已有的 `it.each(Object.entries(EASING))` 会自动覆盖新增的两个键，要求 `--ease-spring: linear(...)` 和 `--ease-spring-bouncy: linear(...)` 都逐字出现在 tokens.css 中。
  - `it("press feedback is pointer-only for hover and off for reduced motion")`：读取 `src/design/motion.css`（读取方式同 tokens），断言以下三点：
    - 包含 `scale(0.97)`；
    - 悬停上浮规则写在 `@media (hover: hover) and (pointer: fine)` 里面；
    - `@media (prefers-reduced-motion: reduce)` 块中有针对按压选择器的 `transform: none`。
- [ ] **Step 2：运行测试，确认失败。** 运行 `npx vitest run src/design/motion.test.tsx`，预期以上新用例 FAIL。
- [ ] **Step 3：实现。**
  - tokens.css：在 `:root` 中写入两个回退值，然后新增 `@supports (transition-timing-function: linear(0, 1)) { :root { --ease-spring: …; --ease-spring-bouncy: …; } }`。
  - motion.ts：在 `EASING` 中加入 `spring` 和 `springBouncy` 两个键，`EASING` 中 camelCase 的键在 CSS 中对应 kebab-case 的变量名。现有测试按 `--ease-${name}` 拼接变量名，需要改为把 camelCase 转成 kebab 后再比对。
  - motion.css：
    - `.mb-collapse` 的 `grid-template-rows` 过渡、sheet 打开态的 `transform`，改用 `var(--ease-spring)`。
    - 关闭态保留 `--ease-exit`。
    - 新增按压规则，选择器为 `.btn, .door-go, .lesson-button, .quiet-card a, .interactive-card, .records-card a, .door`：
      - `:active` 时 `transform: scale(0.97)`，过渡 `var(--dur-quick) var(--ease-standard)`；
      - 松手回弹用 `transition: transform calc(320ms * var(--motion-scale)) var(--ease-spring-bouncy)`。
      - 现有 `.btn:active { translateY(1px) }` 由这条规则取代。
    - 悬停上浮 `translateY(-2px)`，只对卡片类生效，并写在 `(hover: hover) and (pointer: fine)` 媒体查询里。
    - 在减少动态的媒体查询中，把以上选择器的 `transform` 设为 `none`。
- [ ] **Step 4：运行测试，确认通过。** 运行 `npx vitest run src/design/motion.test.tsx`，然后运行全量 `npx vitest run`，预期全部 PASS。
- [ ] **Step 5：提交。** 提交信息为 `feat(motion): spring easing tokens and press feedback`。

### Task 2: 可预加载的路由组件 `lazyPage`

**Files:**
- Create: `frontend/src/app/lazyPage.ts`
- Modify: `frontend/src/App.tsx`（所有 `lazy(() => import(...).then(...))` 改为 `lazyPage(...)`，工厂函数原样保留）
- Test: `frontend/src/app/lazyPage.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  export type PreloadablePage<P> = ComponentType<P> & { preload(): Promise<void> };
  export function lazyPage<P extends object>(factory: () => Promise<{ default: ComponentType<P> }>): PreloadablePage<P>;
  export function isPreloadable(type: unknown): type is { preload(): Promise<void> };
  ```

实现方式：
- 模块级持有 `resolved: ComponentType<P> | null` 和 `pending: Promise<void> | null`。
- `preload()` 只调用一次 factory；如果失败，把 `pending` 清空，以便下次重试，同时让这个 Promise 以 reject 结束。
- 渲染时，`resolved` 已存在就直接 `createElement(resolved, props)`，不会挂起；否则渲染内部的 `React.lazy(() => preload().then(() => ({ default: resolved! })))`，保持原有的 Suspense 和错误边界行为。

- [ ] **Step 1：写测试。**
  - `it("suspends before preload")`：在 `<Suspense fallback={<p>loading</p>}>` 中渲染，`loading` 首先出现。
  - `it("renders synchronously after preload resolves")`：先 `await Page.preload()`，再用 `flushSync(() => root.render(<Suspense fallback={<p>loading</p>}><Page/></Suspense>))` 渲染。断言 DOM 中立即出现目标文字，从未出现 `loading`。
  - `it("calls the factory once across preload and render")`：factory 用 `vi.fn` 包装，断言 `toHaveBeenCalledTimes(1)`。
  - `it("a failed preload rejects and a later preload retries")`：第一次 factory 抛错，第二次成功。断言第一次 reject，第二次 resolve，factory 共被调用 2 次。
  - `it("passes props through")`。
- [ ] **Step 2：运行测试，确认失败。** 运行 `npx vitest run src/app/lazyPage.test.tsx`，预期 FAIL，原因是找不到模块。
- [ ] **Step 3：实现。** 写 `lazyPage.ts`，并替换 App.tsx 中的所有 lazy 调用（包括 `ChallengePage`、`LibraryLayout`、`NotFoundPage`）。改完后，`App.tsx` 中不应再 import `lazy`。
- [ ] **Step 4：运行测试，确认通过。** 先运行新测试，再运行全量测试（`ahpIntegration` 等集成测试依赖路由懒加载，必须全部通过）。
- [ ] **Step 5：提交。** 提交信息为 `feat(app): preloadable route pages`。

### Task 3: 路由分类（纯函数）

**Files:**
- Create: `frontend/src/app/navMotion.ts`
- Test: `frontend/src/app/navMotion.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type NavKind = "forward" | "back" | "fade" | "none";
  export function routeDepth(pathname: string): number | null;
  export function isSamePage(from: string, to: string): boolean;
  export function navKind(from: string, to: string): NavKind;
  ```

**`routeDepth` 的层级规则**（末尾斜杠先去掉；不在下表中的路径返回 `null`）：

| 深度 | 路径 |
|---|---|
| 0 | `/` |
| 1 | `/learn`、`/practice`、`/quest`、`/cases`、`/library`，以及 `/library/*` 下的全部子路径（资料页的子标签，同层）、`/records`、`/workbench`、`/feedback`、`/about` |
| 2 | `/learn/<course>`、`/learn/reference`、`/learn/team-roles`、`/cases/<slug>` |
| 3 | `/learn/linear-programming/lab`、`/practice/<topic>`、`/practice/<topic>/<id>` |

**`isSamePage` 判断为同一页的情况：**
- pathname 相同；
- 两边都匹配 `/practice/<topic>` 或 `/practice/<topic>/<id>`，并且 topic 相同；
- 两边都匹配 `/library/skills` 或 `/library/skills/<id>`。

**`navKind` 的判断顺序：**
1. 任一侧是 `/challenge`，或者 `isSamePage` 为真：返回 `"none"`。
2. 任一侧深度为 `null`，或两侧深度相等：返回 `"fade"`。
3. 目标更深：返回 `"forward"`；目标更浅：返回 `"back"`。

- [ ] **Step 1：写测试。** 用 `it.each` 写表格测试，至少覆盖以下几组：
  - `["/", "/learn", "forward"]`
  - `["/learn", "/learn/ahp", "forward"]`
  - `["/learn/ahp", "/practice/ahp", "forward"]`
  - `["/learn/ahp", "/learn", "back"]`
  - `["/practice/ahp/3", "/learn/ahp", "back"]`
  - `["/learn", "/cases", "fade"]`
  - `["/library", "/library/calendar", "fade"]`
  - `["/cases/a", "/cases/b", "fade"]`（不同案例算换页）
  - `["/practice/ahp/1", "/practice/ahp/2", "none"]`
  - `["/practice/ahp", "/practice/topsis", "fade"]`
  - `["/library/skills", "/library/skills/x", "none"]`
  - `["/", "/challenge", "none"]`
  - `["/challenge", "/", "none"]`
  - `["/learn", "/learn", "none"]`
  - `["/learn/", "/learn/ahp", "forward"]`
  - `["/unknown", "/learn", "fade"]`
- [ ] **Step 2：运行测试，确认失败。**
- [ ] **Step 3：实现 `navMotion.ts`。**
- [ ] **Step 4：运行测试，确认通过。**
- [ ] **Step 5：提交。** 提交信息为 `feat(app): classify navigations for page transitions`。

### Task 4: 过渡导航编排（纯逻辑）+ RouteScroll 就绪信号

**Files:**
- Create: `frontend/src/components/motion/routeSettled.ts`
- Modify: `frontend/src/components/motion/RouteScroll.tsx`：在 `restore` 内 `done = true` 之后调用 `markRouteSettled()`
- Create: `frontend/src/app/transitionPush.ts`
- Test: `frontend/src/app/transitionPush.test.ts`
- Test: 在 `frontend/src/components/motion/RouteScroll.test.tsx` 中追加一条用例

**Interfaces:**
- Consumes: `navKind`（Task 3）。
- Produces:
  ```ts
  // routeSettled.ts
  export function settleGeneration(): number;
  export function markRouteSettled(): void;            // generation++ 并唤醒等待者
  export function waitForRouteSettled(after: number, timeoutMs: number): Promise<boolean>; // generation > after 时 true；超时 false；只结算一次

  // transitionPush.ts
  export type MotionMode = "full" | "lite" | "off";
  export type ViewTransitionLike = { finished: Promise<unknown>; ready: Promise<unknown>; skipTransition(): void };
  export type TransitionDeps = {
    push(to: To, state?: unknown, opts?: unknown): void;     // 原始 navigator.push
    currentPath(): string;                                   // 当前 pathname
    locationKey(): string;                                   // 当前 location.key（检测等待期间发生的 POP）
    preload(pathname: string): Promise<void>;
    start?: (update: () => Promise<void>) => ViewTransitionLike; // document.startViewTransition 的绑定，不支持时为 undefined
    flush(fn: () => void): void;                             // flushSync
    mode(): MotionMode;
    isLoading(): boolean;                                    // DOM 中有 .page-loading / [data-route-pending="true"]
    setPhase(dir: "forward" | "back" | "fade" | null, pending: boolean): void; // 写 html[data-nav-dir] / [data-nav-pending]
    preloadTimeoutMs?: number;   // 默认 300
    settleTimeoutMs?: number;    // 默认 100
  };
  export function createTransitionPush(deps: TransitionDeps): {
    push(to: To, state?: unknown, opts?: unknown): void;
    dispose(): void;             // 卸载时调用：作废所有进行中的导航
  };
  export function isViewTransitionNavigation(): boolean; // 新页面提交时为 true，过渡结束后复位；Layout 读取它来跳过 WAAPI 入场动画
  ```

**push 的逻辑**（每次调用都分配一个递增的 `id`；`commit` 只会执行一次）：
1. 用 `typeof to === "string" ? parsePath(to) : to` 算出目标 pathname，缺省时用当前 pathname。
2. 计算 `kind = navKind(currentPath(), target)`。
3. 以下任一情况成立，就跳过动画、直接走原生 push：
   - `kind === "none"`；
   - `mode() === "off"`；
   - 没有 `start`。

   直接 push 之前，如果有正在播放的过渡，先调用它的 `skipTransition()`。
4. 准备过渡：
   - 过渡方向 `dir`：lite 模式下一律用 `"fade"`，否则用 `kind`；
   - 调用 `setPhase(null, true)`；
   - 记下当前的 `key0 = locationKey()`；
   - 让 `preload(target)`（失败也视为完成，但标记为失败）与 300ms 定时器赛跑。
5. 赛跑结束后，按顺序检查：
   - 如果 `id` 已经不是最新的，或者 `locationKey() !== key0`，直接放弃，不提交。
   - 如果是超时或预加载失败：执行一次普通 `commit`，并调用 `setPhase(null, false)`。
6. 进入过渡：
   - 先 `skipTransition()` 掉上一个过渡；
   - 设置标志 `isViewTransitionNavigation() = true`，调用 `setPhase(dir, false)`；
   - 调用 `start(async () => { … })`，回调内部依次执行：
     - 记录 `g = settleGeneration()`；
     - 执行 `flush(() => commit())`；
     - 如果 `isLoading()`，调用 `vt.skipTransition()` 并返回；
     - 执行 `ok = await waitForRouteSettled(g, 100)`；
     - 如果 `!ok || isLoading()`，调用 `vt.skipTransition()`。
   - 如果 `start` 抛出异常，且这次还没有提交：普通提交一次。
7. 收尾与异常处理：
   - 在 `vt.finished.finally` 里，如果这个 `vt` 仍是当前过渡：复位标志、调用 `setPhase(null, false)`。
   - 给 `ready`、`finished` 都挂上 `.catch(() => {})`，因为调用 `skipTransition` 会让 `ready` 进入 reject。

- [ ] **Step 1：写 `routeSettled` 测试**（放在 `transitionPush.test.ts` 的独立 describe 中）：
  - `resolves true when marked after`；
  - `resolves false after timeout`（使用 fake timers）；
  - 用例 `marking twice settles once`：同一个等待者只结算一次。
- [ ] **Step 2：写 `createTransitionPush` 测试。** 测试用工厂 `makeDeps()` 构造依赖：
  - `push`、`flush` 都用 `vi.fn`；
  - `preload` 返回由测试手动 resolve 的 deferred；
  - `start` 是假实现：在微任务中调用 `update()`，并返回一个带 `skipTransition: vi.fn()` 的对象。

  要写的用例：
  - `it("animates forward: preload → start → commit once")`：`push` 调用 1 次；`setPhase` 收到 `"forward"`。
  - `it("latest intent wins: A preloads after B")`：先 push A，再 push B；先 resolve B，再 resolve A。断言原始 `push` 只被调用一次，参数是 B。
  - `it("preload slower than 300ms commits once without a transition, late resolve is ignored")`：`advanceTimersByTime(300)` 后，`push` 被调用 1 次，`start` 未被调用；随后 resolve 预加载，`push` 仍然只有 1 次。
  - `it("preload failure commits plainly")`。
  - `it("start throwing commits once")`。
  - `it("settle timeout skips the animation but does not commit again")`：`waitForRouteSettled` 一直不被 mark，100ms 后 `skipTransition` 被调用 1 次，`push` 仍为 1 次。
  - `it("loading after commit skips")`：`isLoading` 返回 true 时，`skipTransition` 被调用。
  - `it("mode off / kind none / no start → plain push, no preload wait")`。
  - `it("lite uses fade")`。
  - `it("POP during preload abandons")`：在预加载期间修改 `locationKey`，最终 `push` 被调用 0 次。
  - `it("dispose abandons pending")`。
- [ ] **Step 3：在 `RouteScroll.test.tsx` 中补一条用例。** 用例名 `marks route settled after restoring`：
  - 先记下 `settleGeneration()`；
  - 执行导航，并跑完一个 rAF；
  - 断言 `settleGeneration()` 变大。
- [ ] **Step 4：运行测试，确认失败。** 运行 `npx vitest run src/app/transitionPush.test.ts src/components/motion/RouteScroll.test.tsx`，预期 FAIL。
- [ ] **Step 5：实现。** 写 `routeSettled.ts` 和 `transitionPush.ts`，并在 `RouteScroll` 中接入 `markRouteSettled()`。
- [ ] **Step 6：运行测试，确认通过。** 先跑新测试，再跑全量。
- [ ] **Step 7：提交。** 提交信息为 `feat(app): view-transition push with race, timeout and settle rules`。

### Task 5: 接入应用 —— navigator 包装、过渡 CSS、Layout 去重

**Files:**
- Create: `frontend/src/app/TransitionNavigation.tsx`
- Create: `frontend/src/design/viewTransitions.css`（在 `main.tsx` 中紧跟 `motion.css` 之后 import）
- Modify: `frontend/src/App.tsx`（`<TransitionNavigation>` 包住 `<AppRoutes />`，放在 `BrowserRouter` 里面）
- Modify: `frontend/src/layouts/Layout.tsx:50-68`（WAAPI 入场：`isViewTransitionNavigation()` 为 true 时跳过）
- Modify: `frontend/src/app/shell.css:125`（`.site-header` 加上 `view-transition-name: mb-header`）
- Test: `frontend/src/app/TransitionNavigation.test.tsx`

**Interfaces:**
- Consumes：`createTransitionPush`、`MotionMode`、`isViewTransitionNavigation`（Task 4）；`isPreloadable`（Task 2）；`AppRoutes`（App.tsx）；`motionScale`（`design/motion.ts`）。
- Produces：
  - `export function TransitionNavigation({ children }: { children: ReactNode }): JSX.Element`
  - `export function routePreloader(routes: RouteObject[]): (pathname: string) => Promise<void>`

**`routePreloader` 的实现**
- 先用 `matchRoutes(routes, pathname)` 找到匹配的路由。
- 对每个匹配项：如果 `route.element?.type` 满足 `isPreloadable`，就调用它的 `preload()`。
- 用 `Promise.all` 等待所有预加载完成。
- 没有匹配项时直接 resolve。

**`TransitionNavigation` 的实现**
- 用 `useContext(UNSAFE_NavigationContext)` 取到原始 navigator。
- 新建 navigator：`Object.assign(Object.create(navigator), { push })`，再通过 `UNSAFE_NavigationContext.Provider value={{ ...ctx, navigator: wrapped }}` 提供下去。
- 用 `useMemo` 保证 navigator 引用稳定，组件卸载时调用 `dispose()`。
- 路由表由 `createRoutesFromChildren(AppRoutes().props.children)` 生成。`AppRoutes` 没有 hook，可以直接调用。如果测试需要，也可以改为作为 prop 传入。
- 各依赖的取法：

  | 依赖 | 取法 |
  |---|---|
  | `mode` | 以下任一成立时为 `"off"`：`document.visibilityState === "hidden"`、`motionScale() === 0`。`documentElement.dataset.motion === "lite"` 时为 `"lite"`。其余为 `"full"`。 |
  | `start` | `document.startViewTransition ? (u) => document.startViewTransition(u) : undefined` |
  | `flush` | `flushSync` |
  | `currentPath` / `locationKey` | 读 `useLocation()` 的 ref |
  | `isLoading` | `!!document.querySelector('.page-loading, [data-route-pending="true"]')` |
  | `setPhase` | 写或删 `document.documentElement.dataset.navDir` 和 `dataset.navPending` |

**`viewTransitions.css`**（只放在 `@media (prefers-reduced-motion: no-preference)` 里）

| 选择器 | 规则 |
|---|---|
| `::view-transition` | `pointer-events: none`，过渡期间点击仍能落到新页面 |
| `::view-transition-group(mb-header)` | `animation-duration: calc(240ms * var(--motion-scale))` |
| `:root[data-nav-dir="forward"]::view-transition-old(root)` | `mb-push-out` 340ms：`to { transform: translateX(-8%); opacity: 0 }` |
| `:root[data-nav-dir="forward"]::view-transition-new(root)` | `mb-push-in` 340ms：`from { transform: translateX(12%); opacity: 0 }` |
| `:root[data-nav-dir="back"]` 的 old / new | 与 forward 方向相反 |
| `:root[data-nav-dir="fade"]` 的 old / new | 200ms 交叉淡化，`var(--ease-standard)` |
| `:root[data-nav-pending]` | `cursor: progress`，作为 300ms 等待期间的即时反馈 |

- 时长写成 `calc(340ms * var(--motion-scale))`。
- forward / back 的 transform 用 `var(--ease-spring)`，opacity 用 `var(--ease-standard)`。

- [ ] **Step 1：写测试。** 用 `MemoryRouter` 挂载 `<TransitionNavigation><AppRoutes/></TransitionNavigation>`，并用一个 `LocationProbe` 输出 pathname 和 state。每个用例都在 `afterEach` 中删除 `document.startViewTransition`。
  - `it("without startViewTransition, links navigate normally")`：点击首页上的“从第零课开始”，最终 pathname 为 `/learn/introduction`。
  - `it("with startViewTransition, a forward link runs one transition and lands")`：给 `startViewTransition` 一个假实现，同步调用 `update` 并返回带 `finished` 的对象。断言它被调用 1 次，最终 pathname 正确，`data-nav-dir` 在过渡结束后被清除。
  - `it("reduced motion never calls startViewTransition")`：用 stub 让 `matchMedia` 在 reduced 时返回 true。
  - `it("Link state survives the wrapper")`：渲染 `<Link to="/learn" state={{ restore: { scrollY: 5 } }}>`，点击后，Probe 读到的 `state.restore.scrollY` 应为 5。
  - `it("ctrl-click is not intercepted")`：执行 `fireEvent.click(link, { ctrlKey: true })`，`startViewTransition` 和 navigate 都没有被调用，pathname 不变。
  - `it("Navigate redirects (replace) pass straight through")`：访问 `/practice` 后到达 `/practice/linear-programming`，期间 `startViewTransition` 至多被调用 1 次。
- [ ] **Step 2：运行测试，确认失败。**
- [ ] **Step 3：实现。** 按上面写好 `TransitionNavigation.tsx`、`viewTransitions.css`，并修改 App.tsx、Layout.tsx、shell.css。
  - Layout.tsx 的 WAAPI effect 开头增加：`if (navigationType === "POP" || isViewTransitionNavigation()) return;`
- [ ] **Step 4：运行全量测试和类型检查，确认通过。** 运行 `npx vitest run`，以及 `npx tsc -b`（如果项目用的是 `tsc --noEmit`，就照项目原有方式）。预期全部 PASS。
- [ ] **Step 5：构建并对比首屏体积。** 运行 `npm run build`，对比 `dist/assets/index-*.js` 的 gzip 体积与生产构建的差值（生产构建可在临时目录 checkout `41bc8a3` 后 build 得到）。差值必须 ≤ 15 KB gzip。
- [ ] **Step 6：提交。** 提交信息为 `feat(motion): iOS-style page transitions via View Transitions`。

### Task 6: 浏览器验收与交付

**Files:**
- Create: `docs/motion-batch1-report.md`
- Commit: `docs/superpowers/specs/2026-10-20-ios-motion-design.md`
- Commit: 本计划

- [ ] **Step 1：启动预览。** 运行 `npm run build && npx vite preview --host 127.0.0.1 --port 5200`（后台运行）。
- [ ] **Step 2：用 gstack `/browse` 实测。** 在桌面、390、320 三种宽度下，各跑一遍正常模式和 `prefers-reduced-motion` 模式。每一步都记录最终 URL、滚动位置，以及控制台是否报错。测试路径如下：
  1. 首页 → 第零课
  2. 学习页 → AHP
  3. 课程中段 → 点“返回学习页”或面包屑，检查回到原滚动位置，且没有跳动
  4. 带 `#锚点` 首次进入
  5. 课程 → 练习 → 返回
  6. 浏览器后退，再前进：不应播放过渡
  7. 快速连点两个链接
  8. 手机菜单导航
  9. 进入 `/challenge` 再返回
- [ ] **Step 3：在长课程页采集性能轨迹。** 在长课程页（`/learn/regression`）上，用浏览器性能接口采集一次切换期间的长任务（`PerformanceObserver` 的 `longtask`），记入报告。
- [ ] **Step 4：写报告并提交。** 报告内容包括：做了什么、测试数、体积差、实测结果、已知限制（Safari 版本支持、iOS 原生返回手势不叠加过渡）、负责人待验内容。提交信息为 `docs: motion batch 1 report, spec and plan`。
- [ ] **Step 5：停下，向负责人请求推送确认。** 确认后才执行 `git push -u origin feat/motion-ios-20261020`。之后取 Vercel 预览地址，确认负责人的手机能登录访问。不关闭任何保护。
