# Vercel + Render 试用上线步骤

这个项目是前后端分离：

- `frontend/`：React + Vite 前端，部署到 Vercel。
- `backend/`：FastAPI 后端，部署到 Render。
- `cases/`：案例数据，后端会从仓库根目录读取。

## 0. 先把代码推到 GitHub

Vercel 和 Render 都最适合从 GitHub 仓库自动部署。

```powershell
git add .
git commit -m "Prepare Vercel and Render deployment"
git branch -M main
git remote add origin https://github.com/你的用户名/modelingbridge-web.git
git push -u origin main
```

如果你已经有远程仓库，只需要 `git push`。

## 1. 部署后端到 Render

推荐用仓库根目录里的 `render.yaml`：

1. 打开 Render，选择 `New` -> `Blueprint`。
2. 连接这个 GitHub 仓库。
3. Render 会读取根目录的 `render.yaml`，创建 `modelingbridge-api` 服务。
4. 在环境变量里填写：

```text
APP_ENV=production
LLM_PROVIDER=deepseek
LLM_API_KEY=你的大模型密钥
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat
BACKEND_CORS_ORIGINS=https://你的前端域名.vercel.app
```

第一次还不知道 Vercel 域名时，`BACKEND_CORS_ORIGINS` 可以先留空，等前端部署完再回来补。

部署成功后，打开：

```text
https://你的-render-服务名.onrender.com/api/health
```

看到 `{"ok":true}` 就说明后端好了。

如果不用 Blueprint，手动创建 Render Web Service 时这样填：

```text
Runtime: Python
Root Directory: 留空
Build Command: pip install -r backend/requirements.txt
Start Command: cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## 2. 部署前端到 Vercel

1. 打开 Vercel，选择 `Add New` -> `Project`。
2. 导入同一个 GitHub 仓库。
3. 项目设置里填写：

```text
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

4. 添加环境变量：

```text
VITE_API_BASE_URL=https://你的-render-服务名.onrender.com
```

注意不要在末尾加 `/`。

5. 点击 Deploy。

部署完成后，Vercel 会给你一个类似下面的地址：

```text
https://modelingbridge-web.vercel.app
```

## 3. 回到 Render 补 CORS

拿到 Vercel 前端地址后，回到 Render 后端服务的环境变量，把：

```text
BACKEND_CORS_ORIGINS=https://modelingbridge-web.vercel.app
```

改成你的真实 Vercel 地址，然后重新部署或重启后端。

如果你还想在本地前端调用线上后端，可以写成逗号分隔：

```text
BACKEND_CORS_ORIGINS=https://modelingbridge-web.vercel.app,http://localhost:5173,http://127.0.0.1:5173
```

## 4. 试用前检查

- 打开前端首页。
- 进入案例库，确认案例能加载。
- 打开工作台，输入题目，点击分析。
- 如果没填 `LLM_API_KEY`，系统会走演示模式；填了密钥才会真实调用大模型。

## 常见问题

前端显示网络错误：

- 检查 `VITE_API_BASE_URL` 是否是 Render 后端地址。
- 检查 Render 后端 `/api/health` 是否正常。
- 检查 Render 的 `BACKEND_CORS_ORIGINS` 是否包含当前 Vercel 域名。

修改环境变量后没生效：

- Vercel 的 `VITE_*` 变量是在构建时写入的，改完要重新 Deploy。
- Render 的后端变量改完要重新 Deploy 或 Restart。
