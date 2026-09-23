const express = require("express");
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, config } = require('../configs/db');

// Helper cấp phát hộ chiếu JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role || 'client' },
    config.JWT_SECRET || 'myflix_secret_default_key',
    { expiresIn: "7d" }
  );
};

// 1. API ĐĂNG KÝ TÀI KHOẢN MỚI
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const cleanUsername = username?.trim();
  const cleanPassword = password?.trim();

  // Bắt lỗi 1: Trường rỗng
  if (!cleanUsername || !cleanPassword) {
    return res.status(400).json({ error: "Vui lòng nhập đầy đủ tài khoản và mật khẩu!" });
  }

  // Bắt lỗi 2: Độ dài tối thiểu
  if (cleanUsername.length < 3) {
    return res.status(400).json({ error: "Tên tài khoản phải chứa ít nhất 3 ký tự!" });
  }

  if (cleanPassword.length < 4) {
    return res.status(400).json({ error: "Mật khẩu phải chứa ít nhất 4 ký tự!" });
  }

  try {
    // 🛡️ BẮT BUỘC SỬ DỤNG DATABASE POSTGRESQL (NEON DB) THẬT
    if (!pool) {
      return res.status(500).json({ error: "Chưa cấu hình DATABASE_URL! Vui lòng kiểm tra file .env" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(cleanPassword, salt);

    // Kiểm tra tài khoản đã tồn tại chưa (không phân biệt hoa thường)
    const userExist = await pool.query(
      "SELECT id FROM users WHERE LOWER(username) = LOWER($1)",
      [cleanUsername]
    );

    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: "Tài khoản này đã tồn tại trên hệ thống!" });
    }

    // Insert user mới vào Database Neon thật
    const newUser = await pool.query(
      "INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role",
      [cleanUsername, hashedPassword, 'client']
    );

    const createdUser = newUser.rows[0];
    const token = generateToken(createdUser);

    return res.status(201).json({
      message: "Đăng ký thành công!",
      token,
      user: createdUser
    });

  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: "Tài khoản này đã tồn tại trên hệ thống!" });
    }
    console.error("❌ Lỗi Đăng Ký Hệ Thống:", err.message);
    res.status(500).json({ error: "Lỗi kết nối cơ sở dữ liệu khi đăng ký!" });
  }
});

// 2. API ĐĂNG NHẬP & CẤP HỘ CHIẾU JWT
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const cleanUsername = username?.trim();
  const cleanPassword = password?.trim();

  if (!cleanUsername || !cleanPassword) {
    return res.status(400).json({ error: "Vui lòng nhập đầy đủ tài khoản và mật khẩu!" });
  }

  try {
    if (!pool) {
      return res.status(500).json({ error: "Chưa cấu hình DATABASE_URL! Vui lòng kiểm tra file .env" });
    }

    // Truy vấn đúng từ PostgreSQL Neon DB
    const result = await pool.query(
      "SELECT * FROM users WHERE LOWER(username) = LOWER($1)",
      [cleanUsername]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Tài khoản hoặc mật khẩu không chính xác!" });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(cleanPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Tài khoản hoặc mật khẩu không chính xác!" });
    }

    const token = generateToken(user);

    res.json({
      message: "Đăng nhập thành công!",
      token,
      user: { id: user.id, username: user.username, role: user.role || 'client' }
    });

  } catch (err) {
    console.error("❌ Lỗi Đăng Nhập Hệ Thống:", err.message);
    res.status(500).json({ error: "Lỗi kết nối cơ sở dữ liệu khi đăng nhập!" });
  }
});

// 3. API KIỂM TRA TRẠNG THÁI HẠ TẦNG
router.get("/status", async (req, res) => {
  res.json({
    status: "ok",
    database: "PostgreSQL (Neon DB)",
    redis: config.REDIS_URL ? "Upstash / Redis" : "Memory Adapter"
  });
});

module.exports = router;
