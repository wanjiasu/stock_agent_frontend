# PM2 部署指南（Frontend + Backend）

本指南说明如何使用 PM2 在同一主机上部署本项目的前端（Next.js）与后端（FastAPI）。路径以本机目录为例：

`/Users/kuriball/Documents/MyProjects/bc_agent_app/backend`

`/Users/kuriball/Documents/MyProjects/bc_agent_app/frontend`

## 前提条件

- 已安装 `node`、`pnpm`、`pm2`（全局安装：`pnpm add -g pm2` 或 `npm i -g pm2`）
- 已安装 `python3`，可创建虚拟环境
- 两侧 `.env` 已配置：
  - Backend：至少包含 CORS 相关变量，确保前端来源被允许（例如 `http://157.230.36.231:3001`）
  - Frontend：包含 `NEXT_PUBLIC_API_URL` 和客服组件所需变量：
    - `NEXT_PUBLIC_CHATWOOT_BASE_URL=https://airedspark.com`
    - `NEXT_PUBLIC_CHATWOOT_TOKEN=...`

---

## 后端（FastAPI）部署

推荐使用项目本地虚拟环境的 `uvicorn` 可执行文件，避免 shell 激活步骤带来的环境差异。

1) 初始化虚拟环境并安装依赖（首次部署或更换环境时执行）：

```bash
cd /Users/kuriball/Documents/MyProjects/bc_agent_app/backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

2) 使用 PM2 启动 FastAPI 服务（uvicorn）：

```bash
cd /Users/kuriball/Documents/MyProjects/bc_agent_app/backend
pm2 delete stock_agent_backend ; pm2 start .venv/bin/python --name stock_agent_backend -- -m uvicorn api.server:app --host 0.0.0.0 --port 8001 && pm2 save
```

3) 管理与查看：

```bash
pm2 status
pm2 logs fastapi-server
pm2 restart fastapi-server
pm2 stop fastapi-server
pm2 delete fastapi-server
```

4) 更换虚拟环境的注意事项：

- PM2 会记住进程启动时的解释器/可执行文件路径；如果更换虚拟环境，建议执行：

```bash
pm2 delete fastapi-server
# 重新按步骤 1) 和 2) 启动（指向新的 .venv）
```

---

## 前端（Next.js）部署

生产模式应使用 `pnpm run start`（Next.js 构建后启动），端口通过环境变量 `PORT` 指定。

1) 安装依赖与构建：

```bash
cd /Users/kuriball/Documents/MyProjects/bc_agent_app/frontend
pnpm install
pnpm build
```

2) 使用 PM2 启动前端服务（生产）：

```bash
HOSTNAME=0.0.0.0 PORT=3001 pm2 start pnpm --name myapp -- run start && pm2 save
```

如需开发模式（热更新），使用：

```bash
PORT=3001 pm2 start "pnpm run dev" \
  --name bc-agent-dev \
  --cwd /Users/kuriball/Documents/MyProjects/bc_agent_app/frontend
```

3) 管理与查看：

```bash
pm2 status
pm2 logs bc-agent
pm2 restart bc-agent
pm2 stop bc-agent
pm2 delete bc-agent
```

---

## 开机自启动与持久化

完成部署后建议保存当前进程列表并设置系统启动脚本：

```bash
pm2 save
pm2 startup
# 按照 pm2 输出提示执行对应的系统命令（例如需要 sudo）
```

---

## 使用 ecosystem.config.js（推荐）

如需更规范地管理多个进程，可在项目根目录创建 `ecosystem.config.js`：

```js
module.exports = {
  apps: [
    {
      name: "fastapi-server",
      cwd: "/Users/kuriball/Documents/MyProjects/bc_agent_app/backend",
      script: ".venv/bin/uvicorn",
      args: "api.server:app --host 0.0.0.0 --port 8001",
      env: {
        // 后端读取 .env；此处仅做覆盖或补充（可选）
      },
    },
    {
      name: "bc-agent",
      cwd: "/Users/kuriball/Documents/MyProjects/bc_agent_app/frontend",
      script: "pnpm",
      args: "run start",
      env: {
        PORT: "3001",
        // Next.js 主要读取 .env；此处仅做覆盖或补充（可选）
      },
    },
  ],
};
```

启动与持久化：

```bash
pm2 start ecosystem.config.js
pm2 status
pm2 save
```

---

## 常见问题

- 前端日志显示 `injecting env (0) from .env`：检查 `frontend/.env` 或 `.env.local` 是否存在且包含所需变量；客户端可用变量需以 `NEXT_PUBLIC_` 开头。
- CORS 跨域错误：确保后端 `.env` 的 `CORS_ALLOW_ORIGINS` 包含前端地址（例如 `http://157.230.36.231:3001`）。
- 更换虚拟环境或依赖后未生效：执行 `pm2 restart <name>` 或删除后重新 `pm2 start`。
- 端口占用：确认没有遗留的开发进程（例如 `pnpm dev`）；必要时更换 `PORT` 或停止旧进程。

---

## 验证

- 后端健康检查：`curl http://localhost:8001/health`
- 前端访问地址：`http://localhost:3001/`（或服务器外网地址）
- 客服组件检查：浏览器网络面板应能加载 `https://airedspark.com/packs/js/sdk.js`，并在页面右下角出现聊天入口。