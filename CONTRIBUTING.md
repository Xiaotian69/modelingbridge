# 模桥新手贡献指南

每次只做一个小任务。先读 [协作手册](docs/TEAM_WORKFLOW.md)，由负责人在 Issue 中指定开发基线和允许修改的文件；当前新版开发基线为 `feat/modelingbridge-v2-ui`；整理 PR 未合并前可在 `chore/github-collaboration` 阅读本指南，不从旧 main 开始新版功能。

## 1. 准备环境与账号

安装 Git、Node.js 22、Python 3.11 或更高版本。用自己的 GitHub 账号接受邀请，配置 HTTPS 凭据或 SSH，不共享账号或 Token。

```powershell
git clone https://github.com/Xiaotian69/modelingbridge.git
cd modelingbridge
git config --local user.name "你的真实署名"
git config --local user.email "从自己 GitHub Settings / Emails 复制的邮箱"
git config --show-origin --get user.name
git config --show-origin --get user.email
```

将命令中的中文值替换为自己的信息。邮箱须关联本人账号，可选本人 GitHub noreply 邮箱，不使用负责人的邮箱。不要更改全局配置或改写旧提交。AI 使用说明放 PR 中，不自动添加 AI 的 Co-Authored-By；真实联合作者需征得同意。

## 2. 认领 Issue 与分支

Issue 写明负责人、目标、允许修改文件、验收标准和内容来源。负责人确认后开始。

```powershell
git status --short
git fetch origin
```

有未提交内容时先停下，和负责人确认如何保存；不用 reset、自动 stash 或强制覆盖。
负责人在 Issue 写明基线后，替换下一条命令的 `BASE_BRANCH`：

```powershell
git switch -c docs/lp-content-check --no-track origin/BASE_BRANCH
```

`BASE_BRANCH` 是占位符，不应原样执行。当前负责人已确认可替换为 `feat/modelingbridge-v2-ui`；后续任务以 Issue 为准。使用 --no-track 避免误把个人分支推向基线，首次推送用下方 -u origin HEAD。命名用 `feat/*`、`fix/*`、`docs/*`、`chore/*`，任务分支只属于一人。Codex 默认 `codex/*` 也可使用。

## 3. 本地运行和测试

```powershell
cd frontend
npm ci
npm run dev
```

按终端地址访问。另开终端运行后端（无密钥时有演示回退）：

```powershell
cd backend
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements-dev.txt
.venv/Scripts/python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

上述两组命令均从仓库根目录开始。后端配置仅放本机 `backend/.env`，不能提交；`VITE_*` 会进入浏览器，不能放秘密。
提交前从根目录执行：

```powershell
cd frontend
npx --no-install tsc --noEmit
cd ..
npm --prefix frontend test
npm --prefix frontend run build
```

仓库没有 lint/typecheck npm 脚本；上面单独运行已有 TypeScript 编译器。Vite 构建不等于类型检查。CI 同样检查类型、测试与构建。
后端测试可在根目录执行 `backend/.venv/Scripts/python.exe -m pytest -q`。其中资料目录存在性测试依赖被忽略的本地资料，干净克隆可能失败：记录错误给负责人，不下载未经授权资料来凑测试、不删断言。

## 4. 让 Codex 帮忙

可复制这个任务提示：

> 请先检查 git status 和贡献指南，完成 Issue 中规定的小任务。只修改允许的文件，不改部署、API 配置、密钥和无关业务，不上传资料，不删除测试。先解释方案，再实现和验证。提交前给我完整差异，不替我合并或发布。

遇到不懂的修改让 AI 解释。逐段阅读差异，确认能解释给另一人；不要让两个人的 AI 同时改同一批核心文件。不得把内部资料、个人数据或凭证发给未经批准的 AI 服务。

## 5. 保存提交

```powershell
git diff
git status --short
git add docs/lp-content-review.md
git diff --cached
git commit -m "docs: review linear programming lesson sources"
git push -u origin HEAD
```

这里只演示一个文件，按实际任务逐项选择，不用 `git add .` 或 `git add -A`。提交前检查姓名邮箱、敏感数据和授权；只提交自己理解的改动。

## 6. 创建 PR 与同步

在 GitHub 分支页面点 Compare & pull request，目标选择 Issue 指定基线，填写模板：做了什么、测试结果、影响、截图和 AI 辅助范围。不确定时先创建 Draft，邀请 @Xiaotian69 审核。
推送可能触发部署预览；当前 Production 仅绑定 feat/edgeone-hk-pilot、Preview 自动部署关闭；禁止向生产分支推送，配置变化时重新确认。

工作区干净时同步基线（用实际名称替换）：

```powershell
git fetch origin
git merge origin/BASE_BRANCH
```

不 rebase 已共享分支，不强推。冲突时先 `git status`，和对方确认两边目的，保留双方需要的内容并移除冲突标记，逐个 `git add` 冲突文件，再 `git commit`，重跑测试。不会解决时停止并找负责人；若本次 merge 开始前干净，可用 `git merge --abort` 返回合并前。

## 7. 第一项任务

由负责人创建“核验线性规划章节来源与 3 道练习”的 Issue。只新增 `docs/lp-content-review.md`：记录课程段落、题目编号、数学结论检查、出处、授权状态及发现的问题。先审查内容，不修改 solver、App、全局样式或部署配置，不上传原题文件。验收：3 道练习有可复核的解与来源，授权未知明确标记，负责人逐项审核。
