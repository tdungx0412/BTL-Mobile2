import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "eiko_shop",
  });

  console.log("Connected to MySQL:", process.env.DB_NAME);

  const addCol = async (table, colDef) => {
    try {
      await conn.query(`ALTER TABLE ${table} ADD COLUMN ${colDef}`);
      console.log(`✅ Đã thêm cột vào [${table}]: ${colDef}`);
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME") {
        console.log(`ℹ️ Cột đã tồn tại trong [${table}]: ${colDef}`);
      } else {
        console.error(`❌ Lỗi thêm cột vào [${table}]:`, e.message);
      }
    }
  };

  await addCol("products", "image TEXT NULL");
  await addCol("products", "color VARCHAR(20) NOT NULL DEFAULT '#fce7f3'");
  await addCol("products", "rating DECIMAL(3,1) NOT NULL DEFAULT 5.0");
  await addCol("products", "review_count INT NOT NULL DEFAULT 0");
  await addCol("products", "is_featured BOOLEAN NOT NULL DEFAULT FALSE");

  await addCol("orders", "phone VARCHAR(20) DEFAULT ''");
  await addCol("orders", "address TEXT NULL");
  await addCol("orders", "payment_method VARCHAR(50) NOT NULL DEFAULT 'COD'");
  await addCol("orders", "note TEXT NULL");

  await addCol("personal_services", "image TEXT NULL");

  console.log("🎉 Hoàn thành kiểm tra và đồng bộ cấu trúc database!");
  await conn.end();
}

migrate().catch(console.error);
