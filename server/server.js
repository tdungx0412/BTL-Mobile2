import bcrypt from "bcryptjs";
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
  max: 1000,
  message: { error: "Quá nhiều yêu cầu, vui lòng thử lại sau 1 phút" },
});

app.use(cors());
app.use(express.json({ limit: "50mb" })); // Giới hạn 50mb cho ảnh Base64
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

app.get("/", (_req, res) => {
  res.json({
    message: "EIko Shop API v2.0 - Optimized",
    docs: "/api/products?page=1&limit=10",
  });
});

// --- API SẢN PHẨM (GET + PAGINATION + CACHE) ---
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

// --- API TÌM KIẾM SẢN PHẨM ---
app.get("/api/products/search", async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) return res.json([]);

  try {
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

// --- API THÊM SẢN PHẨM MỚI ---
app.post("/api/products", async (req, res) => {
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
    const safeSku = sku && typeof sku === "string" ? sku : `SP-${Date.now()}`;
    const safeCategory =
      category && typeof category === "string" ? category : "Khác";
    const safeImage = image && typeof image === "string" ? image : "";
    const safeStock = Number(stock) || 0;
    const safeDescription = description || "";
    const safeOrigin = origin || "";
    const safeMaterial = material || "";

    const [result] = await pool.query(
      `INSERT INTO products 
       (sku, name, price, category, stock, image, description, origin, material, is_featured, tags) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, '[]')`,
      [
        safeSku,
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

// --- API CẬP NHẬT SẢN PHẨM ---
app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const { name, price, category, stock, description, image } = req.body;

  try {
    const safeCategory =
      category && typeof category === "string" ? category : "Khác";

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

// --- API XÓA SẢN PHẨM ---
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

// 1. API Lấy danh sách nhân viên
app.get("/api/employees", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM employees ORDER BY id DESC");
    res.json(rows);
  } catch (error) {
    console.error("Lỗi lấy danh sách NV:", error);
    res.status(500).json({ message: "Lỗi server khi tải danh sách nhân viên" });
  }
});

// 2. API Thêm nhân viên mới
app.post("/api/employees", async (req, res) => {
  const { name, phone, status } = req.body;
  if (!name)
    return res.status(400).json({ message: "Tên nhân viên là bắt buộc" });

  try {
    const [result] = await pool.query(
      "INSERT INTO employees (name, phone, status) VALUES (?, ?, ?)",
      [name, phone || "", status || "active"],
    );
    res
      .status(201)
      .json({ id: result.insertId, message: "Thêm nhân viên thành công" });
  } catch (error) {
    console.error("Lỗi thêm NV:", error);
    res.status(500).json({ message: "Lỗi server khi thêm nhân viên" });
  }
});

// 3. API Cập nhật nhân viên
app.put("/api/employees/:id", async (req, res) => {
  const { id } = req.params;
  const { name, phone, status } = req.body;

  try {
    const [result] = await pool.query(
      "UPDATE employees SET name=?, phone=?, status=? WHERE id=?",
      [name, phone, status, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }
    res.json({ message: "Cập nhật thành công" });
  } catch (error) {
    console.error("Lỗi sửa NV:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật nhân viên" });
  }
});

// 4. API Xóa nhân viên
app.delete("/api/employees/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM employees WHERE id=?", [id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy nhân viên để xóa" });
    }
    res.json({ message: "Xóa nhân viên thành công" });
  } catch (error) {
    console.error("Lỗi xóa NV:", error);
    res.status(500).json({ message: "Lỗi server khi xóa nhân viên" });
  }
});

// ✅ API TÍNH LƯƠNG THEO CA VÀ GIỜ LÀM VIỆC
app.get("/api/attendance/salary", async (req, res) => {
  const { start_date, end_date } = req.query; // Format: YYYY-MM-DD

  if (!start_date || !end_date) {
    return res.status(400).json({ message: "Thiếu ngày bắt đầu/kết thúc" });
  }

  try {
    // Lấy dữ liệu chấm công join với tên nhân viên
    const [rows] = await pool.query(
      `SELECT a.*, e.name 
       FROM attendance a 
       JOIN employees e ON a.employee_id = e.id 
       WHERE a.work_date BETWEEN ? AND ? AND a.status = 'present'
       ORDER BY e.name, a.work_date`,
      [start_date, end_date],
    );

    // Xử lý tính toán lương phía Server
    const salaryMap = {};

    rows.forEach((row) => {
      const empId = row.employee_id;
      if (!salaryMap[empId]) {
        salaryMap[empId] = {
          name: row.name,
          totalHours: 0,
          shifts: { morning: 0, afternoon: 0, evening: 0 },
          details: [],
        };
      }

      let workHours = 0;
      let shiftType = "";

      // Logic tính giờ dựa trên Check-in / Check-out
      if (row.check_in && row.check_out) {
        const checkIn = new Date(`2000-01-01T${row.check_in}`);
        const checkOut = new Date(`2000-01-01T${row.check_out}`);

        // Tính chênh lệch giờ (xử lý trường hợp qua đêm nếu có)
        let diffMs = checkOut - checkIn;
        if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;

        workHours = diffMs / (1000 * 60 * 60);

        // Phân loại ca làm việc
        const hour = checkIn.getHours();
        if (hour >= 8 && hour < 12.5)
          shiftType = "morning"; // 8h - 12h30
        else if (hour >= 12.5 && hour < 18)
          shiftType = "afternoon"; // 12h30 - 18h
        else if (hour >= 18) shiftType = "evening"; // 18h - 23h
      }

      salaryMap[empId].totalHours += workHours;
      if (shiftType) salaryMap[empId].shifts[shiftType]++;

      salaryMap[empId].details.push({
        date: row.work_date,
        hours: workHours.toFixed(2),
        shift: shiftType,
      });
    });

    // Chuyển đổi sang mảng và tính tiền
    const HOURLY_RATE = 25000;
    const result = Object.values(salaryMap).map((emp) => ({
      ...emp,
      totalSalary: Math.round(emp.totalHours * HOURLY_RATE),
      formattedHours: emp.totalHours.toFixed(2),
    }));

    res.json(result);
  } catch (error) {
    console.error("Lỗi tính lương:", error);
    res.status(500).json({ message: "Lỗi server khi tính lương" });
  }
});

// ✅ API CHẤM CÔNG NHANH (CHECK-IN / CHECK-OUT)
app.post("/api/attendance/check", async (req, res) => {
  const { employee_id, type } = req.body; // type: 'check_in' hoặc 'check_out'
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const now = new Date().toTimeString().split(" ")[0]; // HH:MM:SS

  try {
    const [existing] = await pool.query(
      "SELECT id FROM attendance WHERE employee_id = ? AND work_date = ?",
      [employee_id, today],
    );

    if (type === "check_in") {
      if (existing.length > 0) {
        return res
          .status(400)
          .json({ message: "Nhân viên đã chấm công vào hôm nay" });
      }
      await pool.query(
        "INSERT INTO attendance (employee_id, work_date, check_in, status) VALUES (?, ?, ?, 'present')",
        [employee_id, today, now],
      );
    } else if (type === "check_out") {
      if (existing.length === 0) {
        return res
          .status(400)
          .json({ message: "Chưa chấm công vào, không thể chấm ra" });
      }
      await pool.query(
        "UPDATE attendance SET check_out = ? WHERE employee_id = ? AND work_date = ?",
        [now, employee_id, today],
      );
    }

    res.json({
      message:
        type === "check_in"
          ? "Chấm công vào thành công"
          : "Chấm công ra thành công",
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi chấm công", error: error.message });
  }
});

// ✅ API LẤY DỮ LIỆU CHẤM CÔNG THEO NGÀY (ĐỂ TÍNH LƯƠNG & EXPORT)
app.get("/api/attendance/daily", async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: "Thiếu ngày" });

  try {
    const [rows] = await pool.query(
      `SELECT a.*, e.name, e.phone 
       FROM attendance a 
       JOIN employees e ON a.employee_id = e.id 
       WHERE a.work_date = ? 
       ORDER BY e.name ASC`,
      [date],
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tải dữ liệu chấm công" });
  }
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
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE username = ?",
      [username],
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Tên đăng nhập đã tồn tại" });
    }

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

// ✅ KHỞI ĐỘNG SERVER (PHẢI NM CUỐI CÙNG)
app.listen(port, () => {
  console.log(`✅ Server: http://localhost:${port}`);
  console.log(`📊 Health: http://localhost:${port}/api/health`);
});
