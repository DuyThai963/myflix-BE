require('dotenv').config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");

// Nạp kết nối Tầng dữ liệu & Cấu hình bảo hiểm đa môi trường
const { pubClient, subClient, config } = require('./configs/db');

const app = express();
const server = http.createServer(app);

// 🔒 1. CHÍNH SÁCH BẢO MẬT CORS NGHIÊM NGẶT (STRICT WHITELIST)
// Cho phép cấu hình 1 hoặc nhiều domain qua biến FRONTEND_URL (phân tách bởi dấu phẩy)
const rawFrontendUrls = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map(url => url.trim().replace(/\/$/, "")) // Bỏ dấu / ở cuối nếu có
  .filter(Boolean);

// Danh sách các Origin được phép truy cập
const allowedOrigins = [
  ...rawFrontendUrls,
  "http://localhost:3000",
  "http://127.0.0.1:3000"
];

// Hàm kiểm tra Origin hợp lệ
const corsOptionsDelegate = (reqOrigin, callback) => {
  // Cho phép request không có origin (server health check, render ping, postman nội bộ)
  if (!reqOrigin) {
    return callback(null, true);
  }

  const cleanReqOrigin = reqOrigin.replace(/\/$/, "");

  // Kiểm tra xem Origin có nằm trong Whitelist đã cấp phép không
  const isAllowed = allowedOrigins.some(allowed => {
    return allowed === cleanReqOrigin || allowed === "*";
  });

  if (isAllowed) {
    return callback(null, true);
  } else {
    return callback(new Error(`CORS policy violation: Origin ${reqOrigin} is not allowed.`));
  }
};

app.use(cors({
  origin: corsOptionsDelegate,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🌐 2. CẤU HÌNH HẠ TẦNG SOCKET.IO VỚI BẢO MẬT CORS ĐỒNG BỘ
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      corsOptionsDelegate(origin, (err, allowed) => {
        if (err || !allowed) {
          return callback(new Error("Socket connection rejected by CORS"), false);
        }
        return callback(null, true);
      });
    },
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Nếu đầu dây Redis Adapter thông suốt, ráp nối luồng Cluster Production ngay tại chỗ
if (pubClient && subClient) {
  io.adapter(createAdapter(pubClient, subClient));
}

// 🔌 Kích hoạt kiến trúc điều phối phòng Realtime
require('./sockets/watchParty')(io);

// 🔗 3. ĐĂNG KÝ HỆ THỐNG ROUTER ĐÃ CHIA MODULAR SẠCH SẼ
app.use("/api/auth", require("./routes/auth"));
app.use("/api/history", require("./routes/history"));
app.use("/api", require("./routes/proxy"));

// 🛡️ Middleware bẫy lỗi CORS bảo mật
app.use((err, req, res, next) => {
  if (err && err.message && err.message.includes('CORS policy violation')) {
    return res.status(403).json({
      error: "Yêu cầu bị từ chối bởi chính sách bảo mật CORS của MyFlix!",
      detail: err.message
    });
  }
  next(err);
});

const PORT = config.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});
