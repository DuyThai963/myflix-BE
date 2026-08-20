const { Pool } = require('pg');
const { createClient } = require('redis');
const config = require('../config');

// In-memory mock fallback cho môi trường dev khi chưa cấu hình DB thật
const memoryUsers = new Map();
const memoryHistories = new Map();

let pool = null;
let isDbConnected = false;

if (config.DATABASE_URL) {
  pool = new Pool({
    connectionString: config.DATABASE_URL,
    ssl: config.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  // Tự động kiểm tra kết nối và khởi tạo bảng users/watch_histories nếu chưa có
  pool.connect(async (err, client, release) => {
    if (err) {
      console.warn('Database connection error:', err.message);
      isDbConnected = false;
    } else {
      console.log('Database connected');
      isDbConnected = true;
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'client',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS watch_histories (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            watch_id VARCHAR(255) NOT NULL,
            episode_slug VARCHAR(255),
            episode_name VARCHAR(255),
            watched_time NUMERIC DEFAULT 0,
            movie JSONB,
            server_name VARCHAR(255),
            is_embed BOOLEAN DEFAULT false,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_user_watch UNIQUE (user_id, watch_id)
          );
        `);
      } catch (tableErr) {
        console.warn('Init table error:', tableErr.message);
      } finally {
        release();
      }
    }
  });
} else {
  pool = {
    query: async () => ({ rows: [] })
  };
}

// Khởi tạo Redis Client cho Watch Party Realtime
let redisClient = null;
let pubClient = null;
let subClient = null;
let isRedisConnected = false;

if (config.REDIS_URL) {
  pubClient = createClient({ url: config.REDIS_URL });
  subClient = pubClient.duplicate();
  redisClient = createClient({ url: config.REDIS_URL });

  Promise.all([pubClient.connect(), subClient.connect(), redisClient.connect()])
    .then(() => {
      console.log('Redis connected');
      isRedisConnected = true;
    })
    .catch((err) => {
      console.warn('Redis connection error:', err.message);
      isRedisConnected = false;
    });
}

module.exports = {
  pool,
  redisClient,
  pubClient,
  subClient,
  config,
  memoryUsers,
  memoryHistories,
  getIsDbConnected: () => isDbConnected,
  getIsRedisConnected: () => isRedisConnected
};
