import bcrypt from "bcryptjs"; // npm install bcryptjs
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

// Tăng giới hạn request để tránh bị chặn khi dev
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  message: { error: "Quá nhiều yêu cầu, vui lòng thử lại sau 1 phút" },
});

app.use(cors());
// Giới hạn 50mb cho ảnh Base64
app.use(express.json({ limit: "50mb" }));
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

    // ✅ ĐÃ LOẠI BỎ 'icon' KHỎI DANH SÁCH SELECT
    const [rows] = await pool.query(
      `SELECT 
        id, sku, name, price, image, color, category, description, origin,
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
    // ✅ ĐÃ LOẠI BỎ 'icon' KHỎI DANH SÁCH SELECT
    const [rows] = await pool.query(
      `SELECT 
        id, sku, name, price, image, color, category, description, origin,
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

    cache.flushAll();
    res.json(products);
  } catch (error) {
    console.error("Lỗi tìm kiếm:", error);
    res.status(500).json({ message: "Lỗi server khi tìm kiếm" });
  }
});

// ✅ 2. API THÊM SẢN PHẨM MỚI
app.post("/api/products", async (req, res) => {
  // Lấy thêm 'sku' từ body để xử lý
  const {
    name,
    price,
    category,
    stock,
    image,
    description,
    origin,
    material,
    sku,
  } = req.body;

  if (!name || !price) {
    return res.status(400).json({ message: "Tên và giá sản phẩm là bắt buộc" });
  }

  try {
    // ✅ TỰ ĐỘNG SINH SKU NẾU NGƯỜI DÙNG KHÔNG NHẬP (GIẢI QUYẾT LI 500)
    const safeSku = sku && typeof sku === "string" ? sku : `SP-${Date.now()}`;

    const safeCategory =
      category && typeof category === "string" ? category : "Khác";
    const safeImage = image && typeof image === "string" ? image : "";
    const safeStock = Number(stock) || 0;
    const safeDescription = description || "";
    const safeOrigin = origin || "";
    const safeMaterial = material || "";

    // ✅ ĐÃ LOẠI BỎ 'icon' KHỎI INSERT VÀ THÊM 'sku'
    const [result] = await pool.query(
      `INSERT INTO products 
       (sku, name, price, category, stock, image, description, origin, material, is_featured, tags) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, '[]')`,
      [
        safeSku, // <-- THÊM SKU TỰ ĐỘNG
        name,
        price,
        safeCategory,
        safeStock,
        safeImage,
        safeDescription,
        safeOrigin,
        safeMaterial,
      ],
    );

    cache.flushAll();

    res.status(201).json({
      id: result.insertId,
      message: "Thêm sản phẩm thành công",
      data: { name, sku: safeSku, image: safeImage },
    });
  } catch (error) {
    console.error("Lỗi thêm SP:", error);
    res.status(500).json({
      message: "Lỗi server khi thêm sản phẩm",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ✅ 3. API CẬP NHẬT SẢN PHẨM
app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const { name, price, category, stock, description, image } = req.body;

  try {
    const safeCategory =
      category && typeof category === "string" ? category : "Khác";

    // ✅ CẬP NHẬT KHÔNG CẦN ICON
    const [result] = await pool.query(
      `UPDATE products SET name=?, price=?, category=?, stock=?, description=?, image=? WHERE id=?`,
      [name, price, safeCategory, Number(stock), description, image || "", id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy sản phẩm để cập nhật" });
    }

    cache.flushAll();
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

    cache.flushAll();
    res.json({ message: "Xóa sản phẩm thành công" });
  } catch (error) {
    console.error("Lỗi xóa SP:", error);
    res.status(500).json({ message: "Lỗi server khi xóa" });
  }
});

app.listen(port, () => {
  console.log(`✅ Server: http://localhost:${port}`);
  console.log(`📊 Health: http://localhost:${port}/api/health`);
});

// ✅ API ĐĂNG KÝ
app.post("/api/auth/register", async (req, res) => {
  const { username, password, full_name } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Tên đăng nhập và mật khẩu là bắt buộc" });
  }

  try {
    // Kiểm tra trùng username
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE username = ?",
      [username],
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Tên đăng nhập đã tồn tại" });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (username, password, full_name) VALUES (?, ?, ?)",
      [username, hashedPassword, full_name || username],
    );

    res
      .status(201)
      .json({ id: result.insertId, message: "Đăng ký thành công" });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    res.status(500).json({ message: "Lỗi server khi đăng ký" });
  }
});

// ✅ API ĐĂNG NHẬP
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ message: "Sai tên đăng nhập hoặc mật khẩu" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Sai tên đăng nhập hoặc mật khẩu" });
    }

    // Trả về thông tin user (không trả password)
    res.json({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({ message: "Lỗi server khi đăng nhập" });
  }
});
