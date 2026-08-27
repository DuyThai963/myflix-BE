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

// Initial development CORS setup
app.use(cors());

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
