# 🎬 MyFlix Backend API & Realtime Watch Party Engine

![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=node.js)
![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-black?style=for-the-badge&logo=socket.io)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Cloud-336791?style=for-the-badge&logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-Upstash_Cluster-dc382d?style=for-the-badge&logo=redis)

Backend service for **MyFlix Platform** - handling REST APIs, Watch Party WebSocket synchronization, affirmative watch progress tracking, and secure JWT authentication.

## 🌟 Key Features
- **Realtime Watch Party Hub**: Socket.io room management with Redis Adapter clustering.
- **Dual-Tier Sync Algorithm**: Hard Sync on user seek/pause (<0.5s) and Soft Sync drift compensation (+1.5s latency buffer).
- **Affirmative Watch History**: Real-time progress UPSERT and 15-movie lazy cleanup.
- **Strict Whitelist CORS**: Domain authorization via `FRONTEND_URL` environment variable.
- **Clean Copyright Showcase**: Powered by Blender Open Movie (CC-BY) dataset.

## 🛠️ Environment Variables
Configure the following in your `.env` file (or Render dashboard):
```env
PORT=5000
FRONTEND_URL=https://myflix-fe.vercel.app
DATABASE_URL=postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require
REDIS_URL=rediss://default:token@xyz.upstash.io:6379
JWT_SECRET=your_super_secret_jwt_key
```

## 🚀 Deployment (Render)
1. Link this repository to **Render Web Service**.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Add Environment Variables listed above.
