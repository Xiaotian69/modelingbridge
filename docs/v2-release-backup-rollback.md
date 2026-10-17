# 模桥 v2.0.0-preview 正式上线方案（含备份与回滚）

更新：2026-10-13 · 发布对象：`v2.0.0-preview`（分支 `feat/v2-ux-batch3`，本地标签 `v2.0.0-preview`）→ https://www.modelingbridge.cc
**合并生产分支与部署必须由负责人明确确认后执行。** 发布说明见 [releases/v2.0.0-preview.md](releases/v2.0.0-preview.md)。

## 1. EdgeOne 部署要求核查

我没有 EdgeOne 控制台权限。下表“依据”一栏说明每项是怎么核实的；标 ☐ 的请你在控制台对一下。

| 项目 | 结论 | 依据 |
| --- | --- | --- |
| 生产绑定分支 | `feat/edgeone-hk-pilot`（当前 `54e7d4c`） | 线上资源 `index-CkE5nywU.js` / `index-Otb_V5sv.css` 与本机构建 `54e7d4c` 的产物文件名（内容哈希）完全一致；`main`（d426d2c）不一致；CONTRIBUTING 记录“Production 仅绑定 feat/edgeone-hk-pilot、Preview 自动部署关闭”。☐ 控制台确认 |
| 项目根目录 | `frontend` | 部署文档；构建会读取仓库根目录 `cases/`，线上已正常 ☐ |
| 构建命令 | `npm run build`（安装 `npm ci` / `npm install`） | 部署文档 ☐ |
| 输出目录 | `dist` | 部署文档 ☐ |
| Node 版本 | 20.18.0 | `frontend/edgeone.json`。V2 依赖 Vite 5 / esbuild 0.21.5（要求 Node ≥18），GitHub CI 用 Node 22、本机 Node 24 均通过 |
| SPA 路由与响应头 | `edgeone.json`：`/*` → `/index.html`；`nosniff`、`strict-origin-when-cross-origin` | V2 未修改该文件；线上 `/quest`、`/library/prompts`、`/records`、`/learn/linear-programming` 刷新均返回 200 |
| 环境变量 | **无需新增**。代码只读两个可选变量：`VITE_API_BASE_URL`、`VITE_TRIAL_ACCESS_CODE`，线上两者均为空 | 线上产物与“不设任何变量”的本机构建逐字节一致（变量会被内联进 JS，若有值哈希必变）。⚠ 不要设置 `VITE_TRIAL_ACCESS_CODE`，否则全站出现试用码门 |
| 新依赖 | `katex`、`highlight.js`（已在 lockfile） | 与生产相比仅此新增；无原生模块 |
| 域名 www | ✅ `www.modelingbridge.cc` CNAME → `www.modelingbridge.cc.pages.dnsoe8.com`（EdgeOne Pages）；证书 TrustAsia DV，有效期 2026-10-11 ~ 2027-01-08，SAN 仅 www | DNS 与 openssl 实测 |
| 域名 apex | ❌ `modelingbridge.cc` 解析到 207.207.210.229 / .107（域名商停放服务器），HTTP 返回停放页（含域名商的 Google Analytics），HTTPS 握手失败。**不是本站** | DNS、curl、openssl 实测 |
| HTTP→HTTPS | ⚠ `http://www.modelingbridge.cc` 直接返回 200，未跳转 HTTPS；无 HSTS | curl 实测 ☐ 建议在 EdgeOne 开启“强制 HTTPS” |
| Vercel | 仓库同时接了 Vercel：每次推送分支会生成 **Preview** 部署（非生产，本次推送也触发了）。线上域名由 EdgeOne 提供（响应头 `EO-*`） | GitHub deployments API |

## 2. 备份（已完成，本机）

位置：`E:\modelingbridge-backups\2026-10-12\`（校验和见 `SHA256SUMS.txt`）

| 文件 | 内容 |
| --- | --- |
| `prod-source-54e7d4c.zip` | 线上版本完整源码 |
| `prod-dist-54e7d4c.zip` | 线上版本构建产物（与线上逐字节一致），可作静态回滚包 |
| `v2-dist-f485653.zip` | V2 构建产物（功能代码与 `v2.0.0-preview` 相同，后者只多了版本号与文档） |
| `live-index.html` | 线上首页快照 |

本地标签：`backup/prod-2026-10-12` → `54e7d4c`；`v2.0.0-preview` → 发布候选提交。两者都**尚未推送**。

## 3. 上线前（发布前一天内）

1. ☐ 负责人或内容合作者通读 9 条提示词模板（`frontend/src/content/prompts/index.ts`）。
2. ☐ 在 EdgeOne 控制台核对第 1 节标 ☐ 的项目，并记下**当前生产部署的 ID / 时间**和“回滚 / 重新部署”入口。
3. ☐ 决定 apex 处理（见第 6 节），至少确保对外只发 `https://www.modelingbridge.cc`。
4. ☐ 在 GitHub 上看 Draft PR 的 CI（Frontend quality）为绿色。
5. ☐ 选择访问量低的时间段，预留 30 分钟。

## 4. 上线步骤（负责人确认“发布”后执行）

```bash
# 0. 冻结检查：生产分支仍为 54e7d4c、候选标签指向预期提交
git fetch origin
git ls-remote origin refs/heads/feat/edgeone-hk-pilot      # 应为 54e7d4c...
git rev-parse v2.0.0-preview^{commit}                       # 与 origin/feat/v2-ux-batch3 一致

# 1. 推送回滚点与版本标签（不触发部署）
git push origin backup/prod-2026-10-12 v2.0.0-preview

# 2. 快进生产分支（不强推；54e7d4c 是候选的祖先）
git push origin "v2.0.0-preview^{commit}:refs/heads/feat/edgeone-hk-pilot"
```

- 推送后 EdgeOne 按生产分支自动构建；若未触发，在控制台对 `feat/edgeone-hk-pilot` 手动部署。
- 快进后 GitHub 会把发布 PR 自动标记为已合并，无需在网页上点合并。
- 构建约 1–3 分钟；控制台显示构建失败 → 线上仍是旧版，无需回滚，排查后重来。

## 5. 上线后 10 分钟验收

在无痕窗口和一部手机上，用 `https://www.modelingbridge.cc`：

1. 首页源码中的资源名不再是 `index-CkE5nywU.js`；开屏播放约 2 秒后进入首页，可跳过。
2. 直接打开并**刷新**：`/learn/linear-programming#derive`、`/practice/linear-programming/practice-1`、`/quest?case=bike-demand-demo`、`/library/prompts/pr.breakdown.base`、`/records`、`/resources`（应跳到 `/library`）。
3. 刷题：练习 1 输入 1600 提交 → 显示错误类型，不出现 2600。
4. 七关：从“教学案例 → 校园共享单车 → 用这道题进入七关实战”，看到案例题面（不是默认题）。
5. 提示词库：填入示例 → 复制，粘贴到记事本内容完整。
6. 老用户数据：用以前访问过旧站的浏览器打开“学习记录”，原有阅读位置与练习结果仍在。
7. 深浅主题切换、手机菜单；浏览器控制台无红色报错（`/api/*` 请求会被重写为首页，属预期）。

任一项失败且影响使用 → 立即回滚（第 7 节），再排查。全部通过 → 把 www 地址发给协会负责人。

## 6. 域名处理建议（与 V2 无关，但影响对外体验）

`modelingbridge.cc` 目前是域名商停放页，用户输入不带 www 的地址会看到别人的页面。二选一：

- **推荐**：在域名商处把 apex 设置为 301 跳转到 `https://www.modelingbridge.cc`（URL 转发），或
- 在 EdgeOne Pages 为 apex 添加自定义域名并按控制台提示配置解析（apex 不能直接 CNAME，需要域名商支持 CNAME 拉平 / ALIAS，或使用 EdgeOne 提供的接入方式）并签发证书。

同时建议开启“强制 HTTPS”。这些都是域名 / 控制台设置，不需要改代码，可在上线前或上线后独立进行。

## 7. 回滚（目标 10 分钟内）

**A. EdgeOne 控制台（首选，不改 Git）**：部署历史中选第 3 步记下的旧部署，重新发布 / 回滚。完成后首页资源名恢复为 `index-CkE5nywU.js`。

**B. Git 回退（控制台不可用时；不改写历史、不强推）**：
```bash
git fetch origin
git switch -c rollback/prod origin/feat/edgeone-hk-pilot
git read-tree -u --reset 54e7d4c
git commit -m "revert: roll production back to 54e7d4c"
git diff 54e7d4c --stat                                    # 应为空
git push origin rollback/prod:refs/heads/feat/edgeone-hk-pilot
```
已在本机演练：从 V2 提交执行后与 `54e7d4c` 差异为 0。

**C. 静态包**：若控制台支持直接上传，上传 `prod-dist-54e7d4c.zip` 解压后的内容（是否支持以控制台为准）。

回滚对学生数据的影响：V2 持续双写旧版键，回到旧版后阅读位置与练习结果仍在；七关草稿与实战报告格式未变；V2 独有信息（练习草稿、提示级别、检查点、偏好）留在浏览器中，再次升级时恢复。

## 8. 上线后

- 把 `feat/v2-ux-batch3` 同步进 `feat/modelingbridge-v2-ui`（队友开发基线），避免后续分支基于旧版。
- 收集协会负责人反馈，按“MVP 先上线、后续迭代”排期。
