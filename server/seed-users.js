import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

async function seed() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "412005",
    database: process.env.DB_NAME || "eiko_shop",
  });

  const hashAdmin = await bcrypt.hash("admin123", 10);
  const hashUser = await bcrypt.hash("123456", 10);

  // Admin account
  await pool.query(
    `INSERT INTO users (username, password, full_name, role)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE password = VALUES(password), role = 'admin'`,
    ["admin", hashAdmin, "Quản trị viên Eiko", "admin"],
  );

  // Customer account
  await pool.query(
    `INSERT INTO users (username, password, full_name, role)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE password = VALUES(password)`,
    ["khachhang", hashUser, "Khách hàng mẫu", "user"],
  );

  // TranTrungDung account
  await pool.query(
    `INSERT INTO users (username, password, full_name, role)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE password = VALUES(password), role = 'admin'`,
    ["TranTrungDung", hashAdmin, "Trần Trung Dũng", "admin"],
  );

  const [rows] = await pool.query(
    "SELECT id, username, role, full_name FROM users",
  );
  console.log("Users in DB:");
  console.table(rows);

  await pool.end();
}

seed().catch(console.error);
