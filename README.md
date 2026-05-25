# ModelingBridge / 模桥 — 本地运行指南（小白向）

本仓库已按 `docs/phase1` 的规划搭好 **第一版可运行网站**：首页、学习路径、AI 引导工作台（步骤卡片流）、案例库、工具箱、学习记录（本机演示）、合规说明，以及 **FastAPI 后端**（案例接口 + 拆题分析接口）。

页面结构与文案已对齐你提供的《数学建模AI引导式学习平台网站MVP设计方案》（2026-05 Word 版）：无法直接读取 `.docx` 时，已将正文提取为 **`docs/mvp_design_extracted.txt`** 便于检索对照。

你的微信里的《数模引路 项目计划书》若是 Word 版，无法在此环境直接打开；**产品口径**仍以仓库内 `docs/phase1` 与上述 MVP 方案为准。

---

## 看不懂命令？用最简办法（Windows）

1. 确认已安装 **Python 3.11+** 和 **Node.js LTS**（见下一节）。  
2. 在资源管理器中打开本文件夹 `数模网站开发`。  
3. **先双击** `启动后端.bat`，等窗口里出现 `Backend: http://127.0.0.1:8000`（**不要关这个窗口**）。  
4. **再双击** `启动前端.bat`，按窗口里提示的地址（一般是 `http://127.0.0.1:5173`）用浏览器打开。  

脚本里使用 **英文提示**，避免在中文 Windows 的 CMD 下出现乱码、把整行当成“命令”执行。  
**不要在项目根目录执行 `npm run dev`**：`package.json` 在 `frontend` 文件夹里，请只通过 `启动前端.bat` 启动。

更白话的步骤说明见同目录下的 **`怎么运行.txt`**。

---

## 你需要提前安装

1. **Node.js LTS**（自带 npm）：用于前端  
   下载：https://nodejs.org/
2. **Python 3.11+**：用于后端  
   下载：https://www.python.org/downloads/

安装完成后，打开终端（PowerShell），`cd` 到本仓库根目录：`e:\数模网站开发`

## 一、启动后端（必须先开）

```powershell
cd e:\数模网站开发\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

（可选）在 `backend` 目录新建 `.env`，填入大模型密钥（OpenAI 兼容接口，例如 DeepSeek）：

```text
LLM_API_KEY=你的密钥
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat
```

不配密钥也可以运行：拆题接口会返回 **演示用结构化结果**，用于熟悉流程。

启动服务：

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

浏览器访问 `http://127.0.0.1:8000/api/health` 应看到 `{"ok":true}`。

## 二、启动前端

新开一个终端：

```powershell
cd e:\数模网站开发\frontend
npm install
npm run dev
```

终端里会显示本地地址（一般是 `http://127.0.0.1:5173`）。用浏览器打开即可。

前端已通过 Vite 代理把 `/api` 转到 `http://127.0.0.1:8000`，因此 **前后端要同时运行**。

## 三、建议你第一次点击哪里

1. 首页 → **开始 AI 拆题**  
2. 工作台左侧用示例题目直接点 **开始分析**  
3. 依次勾选 4 个「人工确认」复选框，阅读行动清单  
4. 打开 **案例库** → 进入「共享单车」演示案例对照结构  

## 四、目录说明（你只需要知道这几项）

| 路径 | 作用 |
| --- | --- |
| `frontend/` | 网站界面（React + Vite + Tailwind） |
| `backend/` | 接口服务（FastAPI） |
| `cases/` | 案例 JSON（可继续加文件扩展案例库） |
| `docs/phase1/` | 产品/信息架构/流程说明 |

## 五、常见问题

**案例列表是空的：** 确认 `cases/` 下有 `*.json`，且后端是从 `backend` 目录启动的（本项目的相对路径已按此约定）。  

**工作台报网络错误：** 确认后端 `8000` 已启动，且前端 `npm run dev` 正在运行。  

**大模型输出格式报错回退演示：** 检查 `LLM_BASE_URL` 是否为 **OpenAI 兼容** 的 `/v1/chat/completions`，以及模型名是否正确。

---

如需把「数模引路」品牌名、配色或学校协会信息改成你的版本，告诉我文案与偏好即可继续改一版。
