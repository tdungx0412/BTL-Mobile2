import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import mysql from "mysql2/promise";
import NodeCache from "node-cache";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);

// --- CẤU HÌNH TỐI ƯU ---
const cache = new NodeCache({ stdTTL: 300 }); // Cache 5 phút
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Quá nhiều yêu cầu, vui lòng thử lại sau 1 phút" },
});

app.use(cors());
app.use(express.json());
app.use(limiter);

// --- MYSQL POOL ---
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "eiko_shop",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// --- HEALTH CHECK ---
app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, timestamp: new Date().toISOString() });
  } catch {
    res.status(500).json({ ok: false, message: "MySQL disconnected" });
  }
});

// --- API SẢN PHẨM (PAGINATION + CACHE) ---
app.get("/api/products", async (req, res) => {
  const cacheKey = `products_${JSON.stringify(req.query)}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) return res.json(cachedData);

  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `SELECT 
        id, sku, name, price, icon, image, color, category, description, origin,
        material, dimensions, weight, stock, rating, review_count AS reviewCount,
        care_instructions AS careInstructions, package_contents AS packageContents, 
        warranty, shipping_info AS shippingInfo, \`usage\`, tags, is_featured AS isFeatured
      FROM products 
      ORDER BY is_featured DESC, name ASC
      LIMIT ? OFFSET ?`,
      [limit, offset],
    );

    const products = rows.map((p) => ({
      ...p,
      tags: typeof p.tags === "string" ? JSON.parse(p.tags) : p.tags,
      reviewCount: Number(p.reviewCount ?? 0),
      isFeatured: Boolean(p.isFeatured),
    }));

    const responseData = {
      data: products,
      pagination: { page, limit, total: rows.length },
    };
    cache.set(cacheKey, responseData);
    res.json(responseData);
  } catch (error) {
    console.error("DB Error:", error.message);
    res.status(500).json({
      message: "Lỗi máy chủ nội bộ",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

app.get("/", (_req, res) => {
  res.json({
    message: "EIko Shop API v2.0 - Optimized",
    docs: "/api/products?page=1&limit=10",
  });
});

// --- API SẢN PHẨM (TÌM KIẾM, THÊM, SỬA, XÓA) ---

// ✅ 1. API TÌM KIẾM SẢN PHẨM
app.get("/api/products/search", async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) return res.json([]);

  try {
    const [rows] = await pool.query(
      `SELECT 
        id, sku, name, price, icon, image, color, category, description, origin,
        material, dimensions, weight, stock, rating, review_count AS reviewCount,
        care_instructions AS careInstructions, package_contents AS packageContents, 
        warranty, shipping_info AS shippingInfo, \`usage\`, tags, is_featured AS isFeatured
      FROM products 
      WHERE name LIKE ? OR sku LIKE ? 
      ORDER BY is_featured DESC, name ASC`,
      [`%${keyword}%`, `%${keyword}%`],
    );

    const products = rows.map((p) => ({
      ...p,
      tags: typeof p.tags === "string" ? JSON.parse(p.tags) : p.tags,
      reviewCount: Number(p.reviewCount ?? 0),
      isFeatured: Boolean(p.isFeatured),
    }));

    // Xóa cache cũ để đảm bảo tìm kiếm luôn mới
    cache.flushAll();
    res.json(products);
  } catch (error) {
    console.error("Lỗi tìm kiếm:", error);
    res.status(500).json({ message: "Lỗi server khi tìm kiếm" });
  }
});

// ✅ 2. API THÊM SẢN PHẨM MỚI
app.post("/api/products", async (req, res) => {
  const { name, price, category, stock, image, description, origin, material } =
    req.body;

  if (!name || !price) {
    return res.status(400).json({ message: "Tên và giá sản phẩm là bắt buộc" });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO products 
       (name, price, category, stock, image, description, origin, material, is_featured, tags) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, '[]')`,
      [
        name,
        price,
        category,
        Number(stock) || 0,
        image || "",
        description || "",
        origin || "",
        material || "",
      ],
    );

    cache.flushAll(); // Xóa cache sau khi thêm mới
    res
      .status(201)
      .json({ id: result.insertId, message: "Thêm sản phẩm thành công" });
  } catch (error) {
    console.error("Lỗi thêm SP:", error);
    res.status(500).json({ message: "Lỗi server khi thêm sản phẩm" });
  }
});

// ✅ 3. API CẬP NHẬT SẢN PHẨM
app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const { name, price, category, stock, description } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE products SET name=?, price=?, category=?, stock=?, description=? WHERE id=?`,
      [name, price, category, Number(stock), description, id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy sản phẩm để cập nhật" });
    }

    cache.flushAll(); // Xóa cache sau khi sửa
    res.json({ message: "Cập nhật thành công" });
  } catch (error) {
    console.error("Lỗi sửa SP:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật" });
  }
});

// ✅ 4. API XÓA SẢN PHẨM
app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(`DELETE FROM products WHERE id=?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    cache.flushAll(); // Xóa cache sau khi xóa
    res.json({ message: "Xóa sản phẩm thành công" });
  } catch (error) {
    console.error("Lỗi xóa SP:", error);
    res.status(500).json({ message: "Lỗi server khi xóa" });
  }
});

app.listen(port, () => {
  console.log(` Server: http://localhost:${port}`);
  console.log(`📊 Health: http://localhost:${port}/api/health`);
});
