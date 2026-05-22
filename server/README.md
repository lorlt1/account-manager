# 账号管家后端

Node.js + Fastify + MongoDB 后端，提供注册、登录和整份账号数据云同步。

## 本地运行

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

## 接口

- `GET /health`：健康检查
- `POST /auth/register`：注册，参数 `{ "username": "...", "password": "..." }`
- `POST /auth/login`：登录，参数 `{ "username": "...", "password": "..." }`
- `GET /sync`：读取云端同步数据，需要 `Authorization: Bearer <token>`
- `PUT /sync`：保存云端同步数据，需要 `Authorization: Bearer <token>`

App 登录密码使用 bcrypt 哈希保存。账号数据整体使用 AES-256-GCM 加密后写入 MongoDB。
