# 模桥 V2 上线：备份与回滚方案

日期：2026-10-12 · 适用：把 V2（`feat/v2-ux-batch3`）发布到 www.modelingbridge.cc
**本文件只是方案。未经负责人明确确认，不推送、不合并生产分支、不部署。**

## 1. 现状（已核实）

| 项目 | 值 |
| --- | --- |
| 托管 | 腾讯云 EdgeOne Pages（静态，无后端），项目根目录 `frontend`，`npm run build`，发布目录 `dist`，SPA 重写见 `frontend/edgeone.json` |
| 生产分支 | `origin/feat/edgeone-hk-pilot` = `54e7d4c` |
| 线上构建 | 2026-10-12 读取 `https://www.modelingbridge.cc/`：`assets/index-CkE5nywU.js`、`assets/index-Otb_V5sv.css`，与本机构建 `54e7d4c` 的产物**完全一致**（`Last-Modified: 2026-10-11 05:47:34 GMT`） |
| V2 候选 | `feat/v2-ux-batch3`（发布提交 `f485653`）；`54e7d4c` 是它的祖先，所以上线是**快进**，不需要强推 |
| 已知问题 | `https://modelingbridge.cc`（裸域名）TLS 握手失败，www 正常（与 V2 无关，见第 6 节） |

## 2. 已完成的备份（本机，未上传）

位置：`E:\modelingbridge-backups\2026-10-12\`

| 文件 | 内容 |
| --- | --- |
| `prod-source-54e7d4c.zip` | 生产提交的完整源码（`git archive`） |
| `prod-dist-54e7d4c.zip` | 生产提交的构建产物，资源哈希与线上一致，可直接作为静态站点回滚包 |
| `v2-dist-f485653.zip` | V2 候选构建产物 |
| `live-index.html` | 线上首页 HTML 快照 |
| `SHA256SUMS.txt` | 以上文件的校验和 |

本地 Git 标签：`backup/prod-2026-10-12` → `54e7d4c`（尚未推送）。

## 3. 上线步骤（需你逐项确认后执行）

0. **冻结**：确认这段时间无人向 `feat/edgeone-hk-pilot` 推送：`git ls-remote origin refs/heads/feat/edgeone-hk-pilot` 仍为 `54e7d4c`。
1. **推送备份标签**（便于任何人回滚）：`git push origin backup/prod-2026-10-12`
2. **推送 V2 分支并开 Draft PR**（按协作约定，指向 `feat/modelingbridge-v2-ui`，留存审阅记录）：`feat/v2-ux-shell`、`feat/v2-ux-batch3`。
3. **在 EdgeOne 控制台记下当前生产部署**（部署 ID / 时间），确认控制台的“部署历史 / 回滚”入口位置。
4. **快进生产分支**（不强推）：
   ```bash
   git push origin <V2发布提交>:refs/heads/feat/edgeone-hk-pilot
   ```
   EdgeOne 按生产分支自动构建；若未自动触发，在控制台手动部署该分支。
5. **上线后 10 分钟冒烟检查**（www 地址，无痕窗口 + 手机各一次）：
   - 首页加载，页面源码中的资源名不再是 `index-CkE5nywU.js`；
   - 直接打开并刷新深链：`/learn/linear-programming#derive`、`/practice/linear-programming/practice-1`、`/quest?case=bike-demand-demo`、`/library/prompts/pr.breakdown.base`、`/records`；
   - 七关：从案例进入能看到案例题面（不是默认题）；
   - 老用户本地数据：用之前访问过旧站的浏览器打开，学习记录里能看到原有阅读位置与练习结果；
   - 深浅主题切换、手机菜单、控制台无报错。
6. 任一关键项失败 → 立即按第 4 节回滚，再排查。

## 4. 回滚（目标 10 分钟内）

按优先顺序：

**A. EdgeOne 控制台回滚（最快，不改 Git）**：在部署历史中选择第 3 步记下的旧部署，重新发布 / 回滚。完成后 www 首页资源名应恢复为 `index-CkE5nywU.js`。

**B. Git 回退（控制台不可用时）**，不改写历史、不强推：
```bash
git fetch origin
git switch -c rollback/prod origin/feat/edgeone-hk-pilot   # 当前指向 V2 发布提交
git read-tree -u --reset 54e7d4c                           # 工作区与暂存区恢复成生产旧版
git commit -m "revert: roll production back to 54e7d4c"
git diff 54e7d4c --stat                                    # 应为空
git push origin rollback/prod:refs/heads/feat/edgeone-hk-pilot
```
已在本机演练（2026-10-12）：从 V2 提交执行后与 `54e7d4c` 差异为 0。EdgeOne 重新构建后即为旧版。

**C. 静态包**：若控制台支持直接上传，可上传 `prod-dist-54e7d4c.zip`（解压后的 `dist`）。是否支持以控制台为准。

## 5. 回滚对学生本地数据的影响

- V2 学习数据存于 `mb.v2.learning`，同时**双写**旧版键 `mb_learning_reading_v1`、`mb_learning_practice_v1`：回到旧版后，阅读位置与练习对错 / 次数仍在。
- 七关草稿 `mb_quest_draft:*` 与实战报告 `mb_records` 格式未改，新旧版本通用。
- 只有 V2 新增的信息（练习草稿、提示级别、检查点记录、偏好）旧版看不到；它们仍留在浏览器里，再次升级到 V2 时恢复。
- 学生在 V2 中主动“清空学习数据”会同时删除旧版键，这是预期行为。

## 6. 上线前建议同时处理

1. 裸域名 `https://modelingbridge.cc` 的证书 / HTTPS 配置（目前握手失败），或对外只公布 `https://www.modelingbridge.cc`。
2. 你或内容合作者通读 9 条提示词模板。
3. 选一个访问量低的时间段上线，上线后把 www 地址发给协会负责人。
