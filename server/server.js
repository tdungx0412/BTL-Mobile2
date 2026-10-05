import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import multer from "multer";
import mysql from "mysql2/promise";
import path from "path";
import apiRouter from "./src/routes/index.js";
import categoryRoutes from "./src/modules/categories/category.routes.js";
import voucherRoutes from "./src/modules/vouchers/voucher.routes.js";
import { OrderService } from "./src/modules/orders/order.service.js";
import { CraftService } from "./src/modules/services/service.service.js";
import { sendResetPasswordEmail } from "./src/utils/mailer.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Mount Modular Router (Layered Architecture V2)
app.use("/api/v2", apiRouter);
app.use("/api/categories", categoryRoutes);
app.use("/api/vouchers", voucherRoutes);

// Cấu hình thư mục uploads & multer
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `prod_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({ storage });

app.use("/uploads", express.static(path.resolve(uploadDir)));

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
const handleLogin = async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "Vui lòng nhập tên đăng nhập và mật khẩu" });
  }

  try {
    const cleanUsername = String(username).trim();
    const cleanPassword = String(password).trim();
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE username = ? OR LOWER(username) = LOWER(?)",
      [cleanUsername, cleanUsername]
    );

    // 🌟 TỰ ĐỘNG TẠO TÀI KHOẢN KHÁCH HÀNG KHI ĐĂNG NHẬP NẾU CHƯA CÓ TRÊN HỆ THỐNG
    if (rows.length === 0) {
      if (cleanUsername.length < 3) {
        return res.status(400).json({ message: "Tên đăng nhập phải có ít nhất 3 ký tự" });
      }
      if (cleanPassword.length < 4) {
        return res.status(400).json({ message: "Mật khẩu phải có ít nhất 4 ký tự" });
      }

      const hashedPassword = await bcrypt.hash(cleanPassword, 10);
      const fullName = cleanUsername.toLowerCase().startsWith("khach")
        ? cleanUsername
        : `Khách hàng ${cleanUsername}`;

      const [newResult] = await pool.query(
        "INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, 'user')",
        [cleanUsername, hashedPassword, fullName]
      );
      const newUserId = newResult.insertId;

      return res.status(200).json({
        id: newUserId,
        user_id: newUserId,
        token: `token_${newUserId}_${Date.now()}`,
        username: cleanUsername,
        full_name: fullName,
        role: "user",
        is_new_customer: true,
        message: "Tài khoản khách hàng mới đã được tạo tự động thành công 🎉",
      });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(cleanPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Tên đăng nhập đã tồn tại nhưng mật khẩu không chính xác" });
    }

    res.json({
      id: user.id,
      user_id: user.id,
      token: `token_${user.id}_${Date.now()}`,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      phone: user.phone || "",
      email: user.email || "",
    });
  } catch (error) {
    console.error("❌ Login Server Error:", error);
    res.status(500).json({ message: "Lỗi kết nối cơ sở dữ liệu khi đăng nhập" });
  }
};

const handleGuestLogin = async (req, res) => {
  try {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const guestUsername = `khach_${Date.now().toString().slice(-4)}_${randomSuffix}`;
    const hashedPassword = await bcrypt.hash("123456", 10);
    const fullName = `Khách Hàng #${randomSuffix}`;

    const [result] = await pool.query(
      "INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, 'user')",
      [guestUsername, hashedPassword, fullName]
    );

    const userId = result.insertId;
    res.json({
      id: userId,
      user_id: userId,
      token: `token_${userId}_${Date.now()}`,
      username: guestUsername,
      full_name: fullName,
      role: "user",
      is_guest: true,
      message: "Đăng nhập với tư cách Khách Hàng thành công 🎉",
    });
  } catch (error) {
    console.error("❌ Guest Login Error:", error);
    res.status(500).json({ message: "Lỗi tạo tài khoản khách vãng lai" });
  }
};

const handleRegister = async (req, res) => {
  const { username, password, full_name, email, phone } = req.body || {};
  const cleanUsername = username ? String(username).trim() : "";
  const cleanPassword = password ? String(password).trim() : "";
  const cleanFullName = full_name ? String(full_name).trim() : cleanUsername;
  const cleanEmail = email ? String(email).trim().toLowerCase() : "";
  const cleanPhone = phone ? String(phone).trim() : null;

  if (!cleanUsername || !cleanPassword) {
    return res.status(400).json({ message: "Vui lòng điền tên đăng nhập và mật khẩu" });
  }

  if (cleanUsername.length < 4) {
    return res.status(400).json({ message: "Tên đăng nhập phải có ít nhất 4 ký tự" });
  }

  if (cleanPassword.length < 6) {
    return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
  }

  // Bắt buộc phải có Gmail/Email
  if (!cleanEmail) {
    return res.status(400).json({ message: "Vui lòng nhập địa chỉ Gmail để đăng ký tài khoản" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ message: "Địa chỉ Gmail không đúng định dạng (VD: example@gmail.com)" });
  }

  try {
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE username = ? OR LOWER(username) = LOWER(?)",
      [cleanUsername, cleanUsername]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Tên đăng nhập đã tồn tại, vui lòng chọn tên khác" });
    }

    const [existingEmail] = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER(?)",
      [cleanEmail]
    );
    if (existingEmail.length > 0) {
      return res.status(409).json({ message: "Địa chỉ Gmail này đã được sử dụng cho tài khoản khác" });
    }

    const hashedPassword = await bcrypt.hash(cleanPassword, 10);
    const [result] = await pool.query(
      "INSERT INTO users (username, password, full_name, email, phone, role) VALUES (?, ?, ?, ?, ?, 'user')",
      [cleanUsername, hashedPassword, cleanFullName || `Khách hàng ${cleanUsername}`, cleanEmail, cleanPhone]
    );
    res.status(201).json({
      id: result.insertId,
      username: cleanUsername,
      full_name: cleanFullName,
      email: cleanEmail,
      message: "Đăng ký tài khoản thành công!",
    });
  } catch (error) {
    console.error("❌ Register Server Error:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi tạo tài khoản" });
  }
};

const handleForgotPassword = async (req, res) => {
  const { email } = req.body || {};
  const cleanEmail = email ? String(email).trim().toLowerCase() : "";

  if (!cleanEmail) {
    return res.status(400).json({ message: "Vui lòng nhập địa chỉ Gmail của bạn" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ message: "Địa chỉ Gmail không đúng định dạng" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT id, username, full_name, email FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
      [cleanEmail]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: `Không tìm thấy tài khoản nào gắn với Gmail: ${cleanEmail}. Vui lòng kiểm tra lại!`,
      });
    }

    const user = rows[0];
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const newPassword = `Eiko${randomSuffix}`;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, user.id]);

    const mailResult = await sendResetPasswordEmail(
      cleanEmail,
      newPassword,
      user.username,
      user.full_name
    );

    console.log(`✅ [FORGOT PASSWORD] Đã cấp lại mật khẩu cho '${user.username}' (Gmail: ${cleanEmail}): ${newPassword}`);

    return res.status(200).json({
      success: true,
      message: "Mật khẩu mới đã được khởi tạo và gửi thành công!",
      newPassword,
      emailSent: mailResult.success,
      email: cleanEmail,
      username: user.username,
    });
  } catch (error) {
    console.error("❌ Forgot Password Error:", error);
    return res.status(500).json({ message: "Lỗi máy chủ khi đặt lại mật khẩu" });
  }
};

const handleUpdateProfile = async (req, res) => {
  const { userId, full_name, email, phone, new_password, avatar } = req.body || {};
  const id = userId || req.body?.id;

  if (!id) {
    return res.status(400).json({ message: "Thiếu thông tin mã người dùng" });
  }

  try {
    const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    if (users.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    const current = users[0];

    const cleanFullName = full_name !== undefined ? String(full_name).trim() : current.full_name;
    const cleanEmail = email !== undefined ? String(email).trim().toLowerCase() : current.email;
    const cleanPhone = phone !== undefined ? String(phone).trim() : current.phone;
    const cleanAvatar = avatar !== undefined ? String(avatar).trim() : current.avatar;

    if (!cleanFullName) {
      return res.status(400).json({ message: "Họ và tên không được để trống" });
    }

    if (cleanEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({ message: "Địa chỉ Gmail không đúng định dạng" });
      }

      const [dup] = await pool.query(
        "SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?",
        [cleanEmail, id]
      );
      if (dup.length > 0) {
        return res.status(409).json({ message: "Địa chỉ Gmail này đã được người dùng khác sử dụng" });
      }
    }

    let passwordClause = "";
    let params = [cleanFullName, cleanEmail || null, cleanPhone || null, cleanAvatar || null];

    if (new_password && String(new_password).trim().length > 0) {
      const cleanNewPassword = String(new_password).trim();
      if (cleanNewPassword.length < 4) {
        return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 4 ký tự" });
      }
      const hashed = await bcrypt.hash(cleanNewPassword, 10);
      passwordClause = ", password = ?";
      params.push(hashed);
    }

    params.push(id);
    await pool.query(
      `UPDATE users SET full_name = ?, email = ?, phone = ?, avatar = ? ${passwordClause} WHERE id = ?`,
      params
    );

    const [updated] = await pool.query(
      "SELECT id, username, full_name, email, phone, avatar, role, created_at FROM users WHERE id = ?",
      [id]
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin tài khoản thành công!",
      user: updated[0],
    });
  } catch (error) {
    console.error("❌ Update Profile Error:", error);
    return res.status(500).json({ message: "Lỗi máy chủ khi cập nhật thông tin" });
  }
};

// Đăng ký các route xác thực & tài khoản
app.post("/api/auth/login", handleLogin);
app.post("/auth/login", handleLogin);
app.post("/api/auth/guest", handleGuestLogin);
app.post("/auth/guest", handleGuestLogin);
app.post("/api/auth/register", handleRegister);
app.post("/auth/register", handleRegister);
app.post("/api/auth/forgot-password", handleForgotPassword);
app.post("/auth/forgot-password", handleForgotPassword);
app.put("/api/auth/profile", handleUpdateProfile);
app.put("/auth/profile", handleUpdateProfile);


// ==========================================
//      SẢN PHẨM & DỊCH VỤ (PUBLIC)
// ==========================================

// ✅ API Lấy sản phẩm & Chi tiết sản phẩm (Tắt Cache để đồng bộ real-time)
const handleGetAllProducts = async (req, res) => {
  res.set("Cache-Control", "no-store, max-age=0");
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, c.icon AS category_icon
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = TRUE ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error("Lỗi lấy danh sách sản phẩm:", error);
    res.status(500).json({ message: "Lỗi tải sản phẩm" });
  }
};

const handleGetProductDetail = async (req, res) => {
  res.set("Cache-Control", "no-store, max-age=0");
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, c.icon AS category_icon
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ? AND p.is_active = TRUE`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
    const product = rows[0];
    const [images] = await pool.query(
      "SELECT id, image_url, is_thumbnail, display_order FROM product_images WHERE product_id = ? ORDER BY display_order ASC",
      [id]
    ).catch(() => [[]]);
    product.gallery = images || [];

    const [variants] = await pool.query(
      "SELECT id, variant_name, sku, price_adjustment, stock FROM product_variants WHERE product_id = ?",
      [id]
    ).catch(() => [[]]);
    product.variants = variants || [];

    res.json(product);
  } catch (error) {
    console.error("Lỗi lấy chi tiết sản phẩm:", error);
    res.status(500).json({ message: "Lỗi tải chi tiết sản phẩm" });
  }
};

app.get(["/api/products", "/products"], handleGetAllProducts);
app.get(["/api/products/:id", "/products/:id"], handleGetProductDetail);

app.get(["/api/personal-services", "/personal-services"], async (req, res) => {
  res.set("Cache-Control", "no-store, max-age=0");
  try {
    const [rows] = await pool.query(
      "SELECT * FROM personal_services WHERE is_active = TRUE ORDER BY id ASC",
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tải dịch vụ" });
  }
});

app.get(["/api/personal-services/:id", "/personal-services/:id", "/api/services/:id", "/services/:id"], async (req, res) => {
  try {
    const { id } = req.params;
    let [rows] = await pool.query(
      "SELECT * FROM personal_services WHERE id = ?",
      [id]
    );
    if (!rows || rows.length === 0) {
      [rows] = await pool.query(
        "SELECT * FROM services WHERE id = ?",
        [id]
      );
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy dịch vụ" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Lỗi lấy chi tiết dịch vụ:", error);
    res.status(500).json({ message: "Lỗi tải chi tiết dịch vụ" });
  }
});

// ==========================================
//      DỊCH VỤ & ĐẶT LỊCH (SERVICE BOOKINGS)
// ==========================================

const handleCreateServiceBooking = async (req, res) => {
  try {
    const booking = await CraftService.book(req.body);
    res.status(201).json(booking);
  } catch (error) {
    console.error("Lỗi đặt lịch dịch vụ:", error);
    res.status(error.status || 400).json({ message: error.message || "Lỗi đặt lịch dịch vụ" });
  }
};

app.post("/api/service-bookings/create", handleCreateServiceBooking);
app.post("/service-bookings/create", handleCreateServiceBooking);

const handleGetMyServiceBookings = async (req, res) => {
  const userId = req.query.userId || req.query.user_id;
  const phone = req.query.phone;
  let ids = [];
  if (req.query.ids) {
    ids = req.query.ids.split(",").map(Number).filter(Boolean);
  }

  if (!userId && !phone && ids.length === 0) {
    return res.status(400).json({ message: "Thiếu thông tin người dùng" });
  }

  try {
    const bookings = await CraftService.getUserBookings(userId, { phone, ids });
    res.json(bookings);
  } catch (error) {
    console.error("Lỗi lấy lịch sử đặt dịch vụ:", error);
    res.status(500).json({ message: "Lỗi tải lịch sử đặt dịch vụ" });
  }
};

app.get("/api/service-bookings/my-bookings", handleGetMyServiceBookings);
app.get("/service-bookings/my-bookings", handleGetMyServiceBookings);

const handleConfirmServicePayment = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await CraftService.confirmPayment(id);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

app.post("/api/service-bookings/:id/confirm-payment", handleConfirmServicePayment);
app.post("/service-bookings/:id/confirm-payment", handleConfirmServicePayment);

const handleCancelServiceBooking = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await CraftService.cancelBooking(id);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

app.post("/api/service-bookings/:id/cancel", handleCancelServiceBooking);
app.post("/service-bookings/:id/cancel", handleCancelServiceBooking);

const handleGetAdminServiceBookings = async (req, res) => {
  try {
    const bookings = await CraftService.getAllBookings();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

app.get("/api/admin/service-bookings", handleGetAdminServiceBookings);
app.get("/admin/service-bookings", handleGetAdminServiceBookings);

const handleUpdateServiceBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await CraftService.updateBookingStatus(id, status);
    res.json(result);
  } catch (error) {
    res.status(error.status || 400).json({ message: error.message });
  }
};

app.put("/api/admin/service-bookings/:id/status", handleUpdateServiceBookingStatus);
app.put("/admin/service-bookings/:id/status", handleUpdateServiceBookingStatus);

const handleGetTodayBookingReminders = async (req, res) => {
  const userId = req.query.userId || req.query.user_id;
  const role = req.query.role || "customer";
  let ids = [];
  if (req.query.ids) {
    ids = req.query.ids.split(",").map(Number).filter(Boolean);
  }

  try {
    const bookings = await CraftService.getDueBookings(userId, { role, ids });
    res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Lỗi lấy thông báo lịch hẹn hôm nay:", error);
    res.status(500).json({ message: "Lỗi kiểm tra lịch hẹn hôm nay" });
  }
};

app.get("/api/service-bookings/today-reminders", handleGetTodayBookingReminders);
app.get("/service-bookings/today-reminders", handleGetTodayBookingReminders);


// ==========================================
//      ADMIN CRUD: SẢN PHẨM (PRODUCTS)
// ==========================================

// Helper lưu ảnh Base64
const saveBase64Image = async (imageStr) => {
  if (!imageStr || !imageStr.startsWith("data:image")) return imageStr || "";
  try {
    const matches = imageStr.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (!matches) return imageStr;
    const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
    const data = matches[2];
    const filename = `prod_${Date.now()}_${Math.round(Math.random() * 1e9)}.${ext}`;
    const filepath = path.resolve(uploadDir, filename);
    await fs.promises.writeFile(filepath, Buffer.from(data, "base64"));
    return `/uploads/${filename}`;
  } catch (err) {
    console.error("Lỗi giải mã ảnh Base64:", err);
    return imageStr;
  }
};

const handleAdminAddProduct = async (req, res) => {
  const { name, price, category, stock, description } = req.body;
  if (!name || !price)
    return res.status(400).json({ message: "Thiếu tên hoặc giá sản phẩm" });

  try {
    const cleanPrice = parseFloat(String(price).replace(/[^0-9.-]+/g, ""));
    const cleanStock = parseInt(stock) || 0;

    let imageUrl = req.body.image || "";
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (imageUrl.startsWith("data:image")) {
      imageUrl = await saveBase64Image(imageUrl);
    }

    const [result] = await pool.query(
      "INSERT INTO products (sku, name, price, category, stock, image, description, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)",
      [
        `SP-${Date.now()}`,
        name.trim(),
        cleanPrice,
        category || "Đồ thủ công",
        cleanStock,
        imageUrl,
        description || "",
      ],
    );
    res.json({ id: result.insertId, message: "Thêm sản phẩm thành công 🎉" });
  } catch (error) {
    console.error("Lỗi thêm SP:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};

const handleAdminUpdateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, price, stock, description, category } = req.body;

  try {
    const cleanPrice = parseFloat(String(price).replace(/[^0-9.-]+/g, ""));
    const cleanStock = parseInt(stock) || 0;

    let imageUrl = req.body.image;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (imageUrl && imageUrl.startsWith("data:image")) {
      imageUrl = await saveBase64Image(imageUrl);
    }

    if (imageUrl !== undefined) {
      await pool.query(
        "UPDATE products SET name=?, price=?, stock=?, description=?, category=?, image=? WHERE id=?",
        [name, cleanPrice, cleanStock, description, category || "Đồ thủ công", imageUrl, id],
      );
    } else {
      await pool.query(
        "UPDATE products SET name=?, price=?, stock=?, description=?, category=? WHERE id=?",
        [name, cleanPrice, cleanStock, description, category || "Đồ thủ công", id],
      );
    }
    res.json({ message: "Cập nhật thành công 🎉" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
};

app.post(["/api/admin/products", "/admin/products"], upload.single("image"), handleAdminAddProduct);
app.put(["/api/admin/products/:id", "/admin/products/:id"], upload.single("image"), handleAdminUpdateProduct);

app.delete(["/api/admin/products/:id", "/admin/products/:id"], async (req, res) => {
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
    let imageUrl = image || "";
    if (imageUrl.startsWith("data:image")) {
      imageUrl = await saveBase64Image(imageUrl);
    }
    const [result] = await pool.query(
      "INSERT INTO personal_services (name, price, image, description, category, duration_minutes) VALUES (?, ?, ?, ?, ?, ?)",
      [
        name,
        cleanPrice,
        imageUrl,
        description || "",
        category || "packaging",
        duration_minutes || 30,
      ],
    );
    res.json({ id: result.insertId, message: "Thêm dịch vụ thành công 🎉" });
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
    let imageUrl = image || "";
    if (imageUrl.startsWith("data:image")) {
      imageUrl = await saveBase64Image(imageUrl);
    }
    await pool.query(
      "UPDATE personal_services SET name=?, price=?, image=?, description=?, category=?, duration_minutes=? WHERE id=?",
      [
        name,
        cleanPrice,
        imageUrl,
        description || "",
        category || "packaging",
        duration_minutes || 30,
        id,
      ],
    );
    res.json({ message: "Cập nhật dịch vụ thành công 🎉" });
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

const handleGetAdminOrders = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.id, o.order_code, o.customer_name, o.phone, o.address, o.total_amount, o.status, o.payment_method, o.payment_status, o.created_at, 
             GROUP_CONCAT(CONCAT(COALESCE(oi.item_name, p.name, 'Sản phẩm'), ' x ', oi.quantity) SEPARATOR ', ') as details
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      GROUP BY o.id
      ORDER BY o.created_at DESC LIMIT 50
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

app.get("/api/admin/orders", handleGetAdminOrders);
app.get("/admin/orders", handleGetAdminOrders);

app.get(["/api/admin/orders/:id", "/admin/orders/:id"], async (req, res) => {
  const { id } = req.params;
  try {
    const order = await OrderService.getOrderDetail(id);
    res.json(order);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Lỗi tải chi tiết đơn hàng" });
  }
});

const handleUpdateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ["pending", "confirmed", "processing", "shipping", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Trạng thái không hợp lệ" });
  }
  try {
    const paymentUpdate = (status === "confirmed" || status === "completed") ? ", payment_status = 'paid'" : "";
    await pool.query(`UPDATE orders SET status = ? ${paymentUpdate} WHERE id = ?`, [status, id]);
    await pool.query(
      "INSERT INTO order_status_logs (order_id, status, note) VALUES (?, ?, ?)",
      [id, status, `Cập nhật trạng thái sang ${status}`]
    );
    res.json({ message: "Cập nhật trạng thái thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

app.put("/api/admin/orders/:id/status", handleUpdateOrderStatus);
app.put("/admin/orders/:id/status", handleUpdateOrderStatus);

const handleConfirmPayment = async (req, res) => {
  const { id } = req.params;
  try {
    const [orderRows] = await pool.query("SELECT * FROM orders WHERE id = ?", [id]);
    if (orderRows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    const order = orderRows[0];
    if (order.status !== "pending") {
      return res.status(400).json({ message: `Đơn hàng đang ở trạng thái "${order.status}", không thể xác nhận thanh toán` });
    }

    await pool.query(
      "UPDATE orders SET status = 'confirmed', payment_status = 'paid' WHERE id = ?",
      [id]
    );

    await pool.query(
      "INSERT INTO order_status_logs (order_id, status, note) VALUES (?, 'confirmed', 'Đã xác nhận thanh toán thành công')",
      [id]
    );

    res.json({ message: "Xác nhận thanh toán thành công! Trạng thái đơn hàng: Đã xác nhận." });
  } catch (error) {
    console.error("Lỗi xác nhận thanh toán:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi xác nhận thanh toán" });
  }
};

app.post("/api/orders/:id/confirm-payment", handleConfirmPayment);
app.post("/orders/:id/confirm-payment", handleConfirmPayment);

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

// ==========================================
//      THỐNG KÊ DOANH THU & HOẠT ĐỘNG
// ==========================================
const handleGetAdminStatistics = async (req, res) => {
  const range = req.query.range || "all"; // all, today, week, month

  let dateFilter = "1=1";
  let bookingDateFilter = "1=1";
  if (range === "today") {
    dateFilter = "DATE(o.created_at) = CURDATE()";
    bookingDateFilter = "DATE(sb.created_at) = CURDATE()";
  } else if (range === "week") {
    dateFilter = "o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    bookingDateFilter = "sb.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
  } else if (range === "month") {
    dateFilter = "o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    bookingDateFilter = "sb.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
  }

  try {
    // 1. Order summary
    const [summaryRows] = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN o.status IN ('confirmed', 'completed', 'shipping') OR o.payment_status = 'paid' THEN o.total_amount ELSE 0 END), 0) as valid_revenue,
        COALESCE(SUM(CASE WHEN o.status = 'pending' THEN 1 ELSE 0 END), 0) as pending_orders,
        COALESCE(SUM(CASE WHEN o.status = 'confirmed' THEN 1 ELSE 0 END), 0) as confirmed_orders,
        COALESCE(SUM(CASE WHEN o.status = 'shipping' THEN 1 ELSE 0 END), 0) as shipping_orders,
        COALESCE(SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END), 0) as completed_orders,
        COALESCE(SUM(CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END), 0) as cancelled_orders
      FROM orders o
      WHERE ${dateFilter}
    `);

    // 2. Customer count
    const [customerRows] = await pool.query(`
      SELECT COUNT(DISTINCT phone) as unique_customers FROM orders WHERE phone != ''
    `);
    const [userRows] = await pool.query(`
      SELECT COUNT(*) as total_registered_customers FROM users WHERE role = 'customer'
    `);

    // 3. Products summary
    const [prodRows] = await pool.query(`
      SELECT 
        COUNT(*) as total_products,
        COALESCE(SUM(stock), 0) as total_stock,
        COALESCE(SUM(CASE WHEN stock <= 0 THEN 1 ELSE 0 END), 0) as out_of_stock,
        COALESCE(SUM(CASE WHEN stock > 0 AND stock <= 5 THEN 1 ELSE 0 END), 0) as low_stock
      FROM products
      WHERE is_active = TRUE
    `);

    // 4. Top Selling Products
    const [topProducts] = await pool.query(`
      SELECT 
        oi.product_id, 
        COALESCE(oi.item_name, p.name, 'Sản phẩm') as name, 
        p.image, 
        p.category, 
        p.price as current_price,
        SUM(oi.quantity) as total_quantity, 
        SUM(oi.price_at_purchase * oi.quantity) as total_revenue 
      FROM order_items oi 
      LEFT JOIN products p ON oi.product_id = p.id 
      JOIN orders o ON oi.order_id = o.id 
      WHERE ${dateFilter} AND o.status != 'cancelled' 
      GROUP BY oi.product_id, oi.item_name, p.name, p.image, p.category, p.price 
      ORDER BY total_quantity DESC LIMIT 6
    `);

    // 5. Category Breakdown
    const [categoryRows] = await pool.query(`
      SELECT 
        COALESCE(p.category, 'Đồ thủ công') as category, 
        SUM(oi.quantity) as total_quantity, 
        SUM(oi.price_at_purchase * oi.quantity) as total_revenue 
      FROM order_items oi 
      LEFT JOIN products p ON oi.product_id = p.id 
      JOIN orders o ON oi.order_id = o.id 
      WHERE ${dateFilter} AND o.status != 'cancelled' 
      GROUP BY COALESCE(p.category, 'Đồ thủ công') 
      ORDER BY total_revenue DESC
    `);

    // 6. Payment Methods Breakdown
    const [paymentRows] = await pool.query(`
      SELECT 
        o.payment_method, 
        COUNT(*) as count, 
        COALESCE(SUM(o.total_amount), 0) as total_amount 
      FROM orders o 
      WHERE ${dateFilter} AND o.status != 'cancelled' 
      GROUP BY o.payment_method
    `);

    // 7. Service Bookings summary
    const [bookingRows] = await pool.query(`
      SELECT 
        COUNT(*) as total_bookings,
        COALESCE(SUM(sb.estimated_price), 0) as total_booking_rev,
        COALESCE(SUM(CASE WHEN sb.status = 'pending' THEN 1 ELSE 0 END), 0) as pending_bookings,
        COALESCE(SUM(CASE WHEN sb.status = 'confirmed' THEN 1 ELSE 0 END), 0) as confirmed_bookings,
        COALESCE(SUM(CASE WHEN sb.status = 'in_progress' THEN 1 ELSE 0 END), 0) as in_progress_bookings,
        COALESCE(SUM(CASE WHEN sb.status = 'completed' THEN 1 ELSE 0 END), 0) as completed_bookings,
        COALESCE(SUM(CASE WHEN sb.status = 'cancelled' THEN 1 ELSE 0 END), 0) as cancelled_bookings
      FROM service_bookings sb
      WHERE ${bookingDateFilter}
    `);

    // 8. Daily Trend for the past 7 days
    const [dailyRows] = await pool.query(`
      SELECT 
        DATE_FORMAT(o.created_at, '%d/%m') as date_label,
        DATE(o.created_at) as raw_date,
        COUNT(*) as orders_count,
        COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total_amount ELSE 0 END), 0) as day_revenue
      FROM orders o
      WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(o.created_at), DATE_FORMAT(o.created_at, '%d/%m')
      ORDER BY raw_date ASC
    `);

    const last7Days = [];
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      const dayName = dayNames[d.getDay()];
      const match = dailyRows.find((r) => r.date_label === dayStr);
      last7Days.push({
        date: dayStr,
        dayName,
        orders: match ? Number(match.orders_count) : 0,
        revenue: match ? parseFloat(match.day_revenue) : 0,
      });
    }

    res.json({
      range,
      summary: {
        totalRevenue: parseFloat(summaryRows[0]?.total_revenue || 0),
        validRevenue: parseFloat(summaryRows[0]?.valid_revenue || 0),
        totalOrders: Number(summaryRows[0]?.total_orders || 0),
        pendingOrders: Number(summaryRows[0]?.pending_orders || 0),
        confirmedOrders: Number(summaryRows[0]?.confirmed_orders || 0),
        shippingOrders: Number(summaryRows[0]?.shipping_orders || 0),
        completedOrders: Number(summaryRows[0]?.completed_orders || 0),
        cancelledOrders: Number(summaryRows[0]?.cancelled_orders || 0),
        uniqueCustomers: Number(customerRows[0]?.unique_customers || 0),
        registeredCustomers: Number(userRows[0]?.total_registered_customers || 0),
        totalProducts: Number(prodRows[0]?.total_products || 0),
        totalStock: Number(prodRows[0]?.total_stock || 0),
        outOfStock: Number(prodRows[0]?.out_of_stock || 0),
        lowStock: Number(prodRows[0]?.low_stock || 0),
      },
      topProducts: topProducts.map((p) => ({
        id: p.product_id,
        name: p.name,
        image: p.image,
        category: p.category,
        price: parseFloat(p.current_price || 0),
        quantity: Number(p.total_quantity || 0),
        revenue: parseFloat(p.total_revenue || 0),
      })),
      categoryBreakdown: categoryRows.map((c) => ({
        category: c.category,
        quantity: Number(c.total_quantity || 0),
        revenue: parseFloat(c.total_revenue || 0),
      })),
      paymentMethods: paymentRows.map((pm) => ({
        method: pm.payment_method || "COD",
        count: Number(pm.count || 0),
        total: parseFloat(pm.total_amount || 0),
      })),
      bookings: {
        total: Number(bookingRows[0]?.total_bookings || 0),
        revenue: parseFloat(bookingRows[0]?.total_booking_rev || 0),
        pending: Number(bookingRows[0]?.pending_bookings || 0),
        confirmed: Number(bookingRows[0]?.confirmed_bookings || 0),
        inProgress: Number(bookingRows[0]?.in_progress_bookings || 0),
        completed: Number(bookingRows[0]?.completed_bookings || 0),
        cancelled: Number(bookingRows[0]?.cancelled_bookings || 0),
      },
      chart7Days: last7Days,
    });
  } catch (error) {
    console.error("Lỗi lấy thống kê admin:", error);
    res.status(500).json({ message: "Lỗi lấy dữ liệu thống kê: " + error.message });
  }
};

app.get(["/api/admin/statistics", "/admin/statistics", "/api/statistics"], handleGetAdminStatistics);

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
      `SELECT o.id, o.created_at, o.total_amount, o.status,
              GROUP_CONCAT(CONCAT(COALESCE(p.name, 'Sản phẩm'), ' x ', oi.quantity) SEPARATOR ', ') as summary
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
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

const handleCreateOrder = async (req, res) => {
  try {
    const order = await OrderService.createOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(error.status || 400).json({ message: error.message });
  }
};

app.post("/api/orders/create", handleCreateOrder);
app.post("/orders/create", handleCreateOrder);

const handleGetMyOrders = async (req, res) => {
  const userId = req.query.userId || req.query.user_id;
  const phone = req.query.phone;
  let ids = [];
  if (req.query.ids) {
    ids = req.query.ids.split(",").map(Number).filter(Boolean);
  }

  if (!userId && !phone && ids.length === 0) {
    return res.status(400).json({ message: "Thiếu thông tin người dùng" });
  }

  try {
    const orders = await OrderService.getMyOrders(userId, { phone, ids });
    res.json(orders);
  } catch (error) {
    console.error("Lỗi lấy lịch sử đơn hàng:", error);
    res.status(500).json({ message: "Lỗi tải lịch sử" });
  }
};

app.get("/api/orders/my-orders", handleGetMyOrders);
app.get("/orders/my-orders", handleGetMyOrders);
app.get("/api/my-orders", handleGetMyOrders);
app.get("/my-orders", handleGetMyOrders);

app.get("/api/orders/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const order = await OrderService.getOrderDetail(id);
    res.json(order);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Lỗi tải chi tiết" });
  }
});
app.get("/orders/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const order = await OrderService.getOrderDetail(id);
    res.json(order);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Lỗi tải chi tiết" });
  }
});

const handleCancelOrder = async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [orderRows] = await conn.query("SELECT * FROM orders WHERE id = ? FOR UPDATE", [id]);
    if (orderRows.length === 0) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    const order = orderRows[0];
    if (order.status === "completed" || order.status === "cancelled") {
      return res.status(400).json({ message: `Không thể hủy đơn đang ở trạng thái "${order.status}"` });
    }
    const [items] = await conn.query("SELECT product_id, quantity FROM order_items WHERE order_id = ?", [id]);
    for (const it of items) {
      if (it.product_id) {
        await conn.query("UPDATE products SET stock = stock + ? WHERE id = ?", [it.quantity, it.product_id]);
      }
    }
    await conn.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [id]);
    await conn.commit();
    res.json({ message: "Hủy đơn hàng thành công, đã hoàn trả lại kho" });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: e.message });
  } finally {
    conn.release();
  }
};

app.post("/api/orders/:id/cancel", handleCancelOrder);
app.post("/orders/:id/cancel", handleCancelOrder);

app.listen(port, () =>
  console.log(`✅ Server Eiko Shop Pro: http://localhost:${port}`),
);