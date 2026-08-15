require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || "myflix_demo_portfolio_jwt_secret_key_2026",
  DATABASE_URL: process.env.DATABASE_URL || "",
  REDIS_URL: process.env.REDIS_URL || "",

  // Provider cấu hình chế độ Showcase Demo an toàn
  MOVIE_PROVIDER: process.env.MOVIE_PROVIDER || "demo_showcase",

  // Không dùng domain crawler lậu bên ngoài
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000"
};
