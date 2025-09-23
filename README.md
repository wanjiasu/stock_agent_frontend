## Getting Started

First, run the development server:

- npm run dev → 使用 .env.local （开发环境配置）
- npm run build → 使用 .env.prod （生产环境配置）
- npm run start → 使用 .env.prod （生产环境配置）

```bash
npm run dev

npm run build:prod

npm run start

pm2 start npm --name "nextjs" -- run start -- -p 3000

pm2 start "/root/myapp/myapp_backend/env/bin/python" --name "fastapi-app" -- -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```


