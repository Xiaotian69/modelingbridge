# 模桥 V3.0 公开快照：反馈与贡献说明

本仓库是模桥（ModelingBridge）V3.0 初期公开源码快照，供展示与学习参考。模桥仍在持续开发，后续版本在独立代码库中进行，不保证继续在此公开；本仓库不再作为后续功能的开发基线。

想了解最新进展、体验现有功能，请访问 **[www.modelingbridge.cc](https://www.modelingbridge.cc)**。

## 1. 欢迎的反馈

- 课程内容、例题或练习中的事实错误与数学错误；
- 文档中的错误、失效链接或本地运行问题；
- 可访问性与使用体验建议。

请通过 GitHub Issue 提交，写明页面或文件位置、复现步骤和你期望的结果。

## 2. 关于 Pull Request

- 小范围勘误（错别字、失效链接、明显的数学错误）可以提交 PR，目标分支为 `main`。
- 新功能、大规模重构或面向后续版本的修改不会合并到本仓库。
- 是否合并由项目负责人 @Xiaotian69 决定；被接受的修改不保证同步到正式网站。

## 3. 本地运行和检查

环境要求：Node.js 22（LTS）；只有运行后端时才需要 Python 3.11+。以下命令均从仓库根目录开始。

```bash
cd frontend
npm ci
npm run dev
```

提交前检查：

```bash
cd frontend
npx --no-install tsc --noEmit
npm test
npm run build
```

可选后端：

```bash
cd backend
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements-dev.txt
.venv/Scripts/python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

macOS / Linux 请把 `.venv/Scripts/python.exe` 换成 `.venv/bin/python`。后端测试可在仓库根目录运行 `python -m pytest -q`；其中资料目录相关测试依赖 Git 未跟踪的可选资料，干净克隆可能失败。请如实报告失败原因，不要下载未经授权的资料来让测试通过，也不要删除断言。

## 4. 署名与内容规则

- 使用自己的 GitHub 账号和关联邮箱提交，不冒用他人身份，不改写已有提交历史。
- 不自动添加 AI 的 `Co-authored-by`；如使用了 AI 辅助，请在 PR 描述中说明范围。
- 不提交密钥、个人数据、未经授权的竞赛资料、书籍或论文。后端配置只放本机 `backend/.env`；`VITE_*` 变量会进入浏览器，不能放任何秘密。
- 仓库目前尚未发布开源许可证，提交前请了解这一点。

项目创建者与维护者：[@Xiaotian69](https://github.com/Xiaotian69)
