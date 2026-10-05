import mysql from "mysql2/promise";
import { ENV } from "./env.js";

export const pool = mysql.createPool({
  host: ENV.DB_HOST,
  user: ENV.DB_USER,
  password: ENV.DB_PASSWORD,
  database: ENV.DB_NAME,
  port: ENV.DB_PORT,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
});

// Kiểm tra kết nối khi khởi động
pool.getConnection()
  .then((conn) => {
    console.log(`📦 Kết nối MySQL thành công tới database [${ENV.DB_NAME}]`);
    conn.release();
  })
  .catch((err) => {
    console.error("❌ Lỗi kết nối MySQL:", err.message);
  });
