import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mysql from "mysql2/promise";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json({ limit: "50mb" }));

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "eiko_shop",
  waitForConnections: true,
  connectionLimit: 10,
});

// ==========================================
//          AUTHENTICATION
// ==========================================
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (rows.length === 0)
      return res.status(401).json({ message: "Sai TK/MK" });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Sai TK/MK" });

    res.json({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { username, password, full_name } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Thiếu thông tin" });

  try {
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE username = ?",
      [username],
    );
    if (existing.length > 0)
      return res.status(409).json({ message: "Tên đăng nhập đã tồn tại" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)",
      [username, hashedPassword, full_name || username, "user"],
    );
    res
      .status(201)
      .json({ id: result.insertId, message: "Đăng ký thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// ==========================================
//      SẢN PHẨM & DỊCH VỤ (PUBLIC)
// ==========================================

// ✅ API Lấy sản phẩm (Tắt Cache để đồng bộ real-time)
app.get("/api/products", async (req, res) => {
  res.set("Cache-Control", "no-store, max-age=0"); // Không cho trình duyệt cache
  try {
    const [rows] = await pool.query(
      "SELECT * FROM products WHERE is_active = TRUE ORDER BY created_at DESC",
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tải SP" });
  }
});

// ✅ API Lấy dịch vụ (Tắt Cache)
app.get("/api/personal-services", async (req, res) => {
  res.set("Cache-Control", "no-store, max-age=0");
  try {
    const [rows] = await pool.query(
      "SELECT * FROM personal_services WHERE is_active = TRUE ORDER BY RAND()",
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tải dịch vụ" });
  }
});

// ==========================================
//      ADMIN CRUD: SẢN PHẨM (PRODUCTS)
// ==========================================

app.post("/api/admin/products", async (req, res) => {
  const { name, price, category, stock, image, description } = req.body;
  if (!name || !price)
    return res.status(400).json({ message: "Thiếu tên hoặc giá" });

  try {
    const cleanPrice = parseFloat(String(price).replace(/[^0-9.-]+/g, ""));
    const cleanStock = parseInt(stock) || 0;

    const [result] = await pool.query(
      "INSERT INTO products (sku, name, price, category, stock, image, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        `SP-${Date.now()}`,
        name,
        cleanPrice,
        category || "Khác",
        cleanStock,
        image || "",
        description || "",
      ],
    );
    res.json({ id: result.insertId, message: "Thêm sản phẩm thành công" });
  } catch (error) {
    console.error("Lỗi thêm SP:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
});

app.put("/api/admin/products/:id", async (req, res) => {
  const { id } = req.params;
  const { name, price, stock, description, image } = req.body;

  try {
    const cleanPrice = parseFloat(String(price).replace(/[^0-9.-]+/g, ""));
    const cleanStock = parseInt(stock) || 0;

    await pool.query(
      "UPDATE products SET name=?, price=?, stock=?, description=?, image=? WHERE id=?",
      [name, cleanPrice, cleanStock, description, image || "", id],
    );
    res.json({ message: "Cập nhật thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
});

app.delete("/api/admin/products/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM products WHERE id=?", [req.params.id]);
    res.json({ message: "Đã xóa" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
//      ADMIN CRUD: DỊCH VỤ (SERVICES)
// ==========================================

app.get("/api/admin/services", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM personal_services ORDER BY created_at DESC",
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tải dịch vụ" });
  }
});

app.post("/api/admin/services", async (req, res) => {
  const { name, price, image, description, category, duration_minutes } =
    req.body;
  if (!name || !price)
    return res.status(400).json({ message: "Thiếu thông tin" });

  try {
    const cleanPrice = parseFloat(String(price).replace(/[^0-9.-]+/g, ""));
    const [result] = await pool.query(
      "INSERT INTO personal_services (name, price, image, description, category, duration_minutes) VALUES (?, ?, ?, ?, ?, ?)",
      [
        name,
        cleanPrice,
        image || "",
        description || "",
        category || "packaging",
        duration_minutes || 30,
      ],
    );
    res.json({ id: result.insertId, message: "Thêm dịch vụ thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/api/admin/services/:id", async (req, res) => {
  const { id } = req.params;
  const { name, price, image, description, category, duration_minutes } =
    req.body;
  try {
    const cleanPrice = parseFloat(String(price).replace(/[^0-9.-]+/g, ""));
    await pool.query(
      "UPDATE personal_services SET name=?, price=?, image=?, description=?, category=?, duration_minutes=? WHERE id=?",
      [
        name,
        cleanPrice,
        image || "",
        description || "",
        category,
        duration_minutes,
        id,
      ],
    );
    res.json({ message: "Cập nhật thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete("/api/admin/services/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM personal_services WHERE id=?", [
      req.params.id,
    ]);
    res.json({ message: "Đã xóa" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
//      ADMIN: THỐNG KÊ & BÁO CÁO & KHÁCH HÀNG
// ==========================================

app.get("/api/admin/orders", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.id, o.customer_name, o.total_amount, o.created_at, 
             GROUP_CONCAT(CONCAT(p.name, ' x ', oi.quantity)) as details
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      GROUP BY o.id
      ORDER BY o.created_at DESC LIMIT 50
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/admin/revenue/daily", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT SUM(total_amount) as revenue, COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE()",
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/admin/customers", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, full_name, created_at FROM users WHERE role = 'user' ORDER BY created_at DESC",
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tải danh sách khách hàng" });
  }
});

app.get("/api/admin/customers/:userId/orders", async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT o.id, o.created_at, o.total_amount, 
              GROUP_CONCAT(CONCAT(p.name, ' x ', oi.quantity)) as summary
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       WHERE o.user_id = ? 
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [userId],
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tải hóa đơn khách hàng" });
  }
});

// ==========================================
//      KHÁCH HÀNG: THANH TOÁN & LỊCH SỬ
// ==========================================

app.post("/api/orders/create", async (req, res) => {
  const { items, user_id } = req.body;
  if (!items || items.length === 0)
    return res.status(400).json({ message: "Giỏ hàng trống" });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let totalAmount = 0;
    const orderDetails = [];

    for (const item of items) {
      const [prodRows] = await conn.query(
        "SELECT id, name, price, stock FROM products WHERE id = ?",
        [item.product_id],
      );
      if (prodRows.length === 0)
        throw new Error(`SP ID ${item.product_id} không tồn tại`);

      const prod = prodRows[0];
      if (prod.stock < item.quantity)
        throw new Error(`SP "${prod.name}" hết hàng`);

      totalAmount += prod.price * item.quantity;
      orderDetails.push({ ...item, price: prod.price, name: prod.name });
    }

    const [orderResult] = await conn.query(
      "INSERT INTO orders (customer_name, user_id, total_amount, status) VALUES (?, ?, ?, 'completed')",
      ["Khách Online", user_id || null, totalAmount],
    );
    const orderId = orderResult.insertId;

    for (const item of orderDetails) {
      await conn.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)",
        [orderId, item.product_id, item.quantity, item.price],
      );
      await conn.query("UPDATE products SET stock = stock - ? WHERE id = ?", [
        item.quantity,
        item.product_id,
      ]);
    }

    await conn.commit();
    res.json({ message: "Đặt hàng thành công!", orderId, totalAmount });
  } catch (error) {
    await conn.rollback();
    res.status(400).json({ message: error.message });
  } finally {
    conn.release();
  }
});

app.get("/api/my-orders", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: "Thiếu userId" });

  try {
    const [rows] = await pool.query(
      `SELECT o.id, o.created_at, o.total_amount, 
              GROUP_CONCAT(CONCAT(p.name, ' x ', oi.quantity)) as summary
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       WHERE o.user_id = ? 
       GROUP BY o.id
       ORDER BY o.created_at DESC LIMIT 20`,
      [userId],
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tải lịch sử" });
  }
});

app.get("/api/orders/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [orderRows] = await pool.query("SELECT * FROM orders WHERE id = ?", [
      id,
    ]);
    if (orderRows.length === 0)
      return res.status(404).json({ message: "Không tìm thấy" });

    const [itemRows] = await pool.query(
      `SELECT p.name, p.image, oi.quantity, oi.price_at_purchase as price
       FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?`,
      [id],
    );

    res.json({ ...orderRows[0], items: itemRows });
  } catch (error) {
    res.status(500).json({ message: "Lỗi tải chi tiết" });
  }
});

app.listen(port, () =>
  console.log(`✅ Server Eiko Shop Pro: http://localhost:${port}`),
);
