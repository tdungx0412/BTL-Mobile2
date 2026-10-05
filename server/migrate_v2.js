import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

async function migrateV2() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "412005",
    database: process.env.DB_NAME || "eiko_shop",
    multipleStatements: true,
  });

  console.log("🚀 Bắt đầu quá trình nâng cấp Database chuẩn 3NF (eiko_shop)...");

  // 1. Cập nhật bảng users (nếu thiếu email, phone, avatar, is_active)
  console.log("1. Kiểm tra & chuẩn hóa bảng users...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(60) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(120) NOT NULL,
      email VARCHAR(120) NULL,
      phone VARCHAR(20) NULL,
      avatar TEXT NULL,
      role ENUM('admin', 'staff', 'customer') NOT NULL DEFAULT 'customer',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_users_username (username),
      INDEX idx_users_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const [userCols] = await pool.query("DESCRIBE users");
  const userColNames = userCols.map((c) => c.Field);
  if (!userColNames.includes("email")) {
    await pool.query("ALTER TABLE users ADD COLUMN email VARCHAR(120) NULL");
  }
  if (!userColNames.includes("phone")) {
    await pool.query("ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL");
  }
  if (!userColNames.includes("avatar")) {
    await pool.query("ALTER TABLE users ADD COLUMN avatar TEXT NULL");
  }
  if (!userColNames.includes("is_active")) {
    await pool.query("ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE");
  }

  // 2. Sổ địa chỉ người dùng (user_addresses)
  console.log("2. Khởi tạo bảng user_addresses...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_addresses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      recipient_name VARCHAR(120) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      address_detail VARCHAR(255) NOT NULL,
      city VARCHAR(100) NOT NULL,
      district VARCHAR(100) NOT NULL,
      ward VARCHAR(100) NULL,
      is_default BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_addresses_uid (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 3. Danh mục sản phẩm (categories)
  console.log("3. Khởi tạo bảng categories...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      slug VARCHAR(120) NOT NULL UNIQUE,
      icon VARCHAR(30) NOT NULL DEFAULT '🎁',
      description TEXT NULL,
      display_order INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Seed categories nếu chưa có
  await pool.query(`
    INSERT INTO categories (id, name, slug, icon, description, display_order) VALUES
    (1, 'Đồ thủ công', 'do-thu-cong', '👜', 'Sản phẩm mây tre đan, cói và túi xách thủ công', 1),
    (2, 'Gốm sứ', 'gom-su', '🏺', 'Bình hoa, ly tách men thủ công làng Bát Tràng', 2),
    (3, 'Thời trang truyền thống', 'thoi-trang', '👘', 'Áo dài mini, khăn lụa tơ tằm xứ Huế', 3),
    (4, 'Trang trí & Quà tặng', 'trang-tri', '🎋', 'Tranh Đông Hồ, nón lá, quà lưu niệm nghệ thuật', 4)
    ON DUPLICATE KEY UPDATE name = VALUES(name);
  `);

  // 4. Cập nhật bảng products (bổ sung category_id)
  console.log("4. Khởi tạo & chuẩn hóa bảng products...");
  const [prodCols] = await pool.query("DESCRIBE products");
  const prodColNames = prodCols.map((c) => c.Field);
  if (!prodColNames.includes("category_id")) {
    await pool.query("ALTER TABLE products ADD COLUMN category_id INT NULL AFTER id");
    // Map category string to category_id
    await pool.query(`
      UPDATE products SET category_id = 1 WHERE category LIKE '%thủ công%' OR category LIKE '%Cói%';
      UPDATE products SET category_id = 2 WHERE category LIKE '%gốm%' OR category LIKE '%Bát Tràng%';
      UPDATE products SET category_id = 3 WHERE category LIKE '%Thời trang%' OR category LIKE '%áo dài%';
      UPDATE products SET category_id = 4 WHERE category_id IS NULL;
    `);
  }

  // 5. Hình ảnh sản phẩm (product_images)
  console.log("5. Khởi tạo bảng product_images...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      image_url TEXT NOT NULL,
      is_thumbnail BOOLEAN NOT NULL DEFAULT FALSE,
      display_order INT NOT NULL DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      INDEX idx_prod_images_pid (product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 6. Biến thể sản phẩm (product_variants)
  console.log("6. Khởi tạo bảng product_variants...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_variants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      variant_name VARCHAR(100) NOT NULL,
      sku VARCHAR(80) NOT NULL UNIQUE,
      price_adjustment DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      stock INT NOT NULL DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      INDEX idx_variants_pid (product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 7. Mã giảm giá (vouchers)
  console.log("7. Khởi tạo bảng vouchers...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vouchers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      description VARCHAR(255) NULL,
      discount_type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'fixed',
      discount_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      min_order_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      max_discount_amount DECIMAL(12,2) NULL,
      usage_limit INT NOT NULL DEFAULT 100,
      used_count INT NOT NULL DEFAULT 0,
      start_date DATETIME NOT NULL,
      end_date DATETIME NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_vouchers_code (code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    INSERT INTO vouchers (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, start_date, end_date, is_active) VALUES
    ('EIKOCHAO', 'Giảm 20.000đ cho đơn từ 150.000đ', 'fixed', 20000.00, 150000.00, 20000.00, 500, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), TRUE),
    ('EIKO10', 'Giảm 10% tối đa 50.000đ cho đơn hàng', 'percentage', 10.00, 250000.00, 50000.00, 200, NOW(), DATE_ADD(NOW(), INTERVAL 60 DAY), TRUE)
    ON DUPLICATE KEY UPDATE discount_value = VALUES(discount_value);
  `);

  // 8. Cập nhật bảng orders (bổ sung order_code, voucher_id, discount_amount, subtotal...)
  console.log("8. Kiểm tra & chuẩn hóa bảng orders...");
  const [orderCols] = await pool.query("DESCRIBE orders");
  const orderColNames = orderCols.map((c) => c.Field);
  if (!orderColNames.includes("order_code")) {
    await pool.query("ALTER TABLE orders ADD COLUMN order_code VARCHAR(50) NULL AFTER id");
    // Generate order_code cho các đơn hàng cũ
    await pool.query("UPDATE orders SET order_code = CONCAT('EIKO-', LPAD(id, 6, '0')) WHERE order_code IS NULL");
    await pool.query("ALTER TABLE orders MODIFY COLUMN order_code VARCHAR(50) NOT NULL UNIQUE");
  }
  if (!orderColNames.includes("voucher_id")) {
    await pool.query("ALTER TABLE orders ADD COLUMN voucher_id INT NULL AFTER order_code");
  }
  if (!orderColNames.includes("discount_amount")) {
    await pool.query("ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER total_amount");
  }
  if (!orderColNames.includes("subtotal")) {
    await pool.query("ALTER TABLE orders ADD COLUMN subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER voucher_id");
    await pool.query("UPDATE orders SET subtotal = total_amount WHERE subtotal = 0.00");
  }
  if (!orderColNames.includes("shipping_fee")) {
    await pool.query("ALTER TABLE orders ADD COLUMN shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER discount_amount");
  }
  if (!orderColNames.includes("payment_status")) {
    await pool.query("ALTER TABLE orders ADD COLUMN payment_status ENUM('unpaid', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid' AFTER payment_method");
  }

  // 9. Lịch sử trạng thái đơn hàng (order_status_logs)
  console.log("9. Khởi tạo bảng order_status_logs...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_status_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      status VARCHAR(50) NOT NULL,
      note TEXT NULL,
      changed_by_user_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_status_logs_oid (order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 10. Thanh toán (payments)
  console.log("10. Khởi tạo bảng payments...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      transaction_code VARCHAR(100) NULL,
      amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      provider ENUM('COD', 'VIETQR', 'VNPAY') NOT NULL DEFAULT 'COD',
      status ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
      paid_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      INDEX idx_payments_oid (order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 11. Dịch vụ thủ công & Đặt lịch (services, service_bookings)
  console.log("11. Khởi tạo bảng services & service_bookings...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS services (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      image TEXT NULL,
      category VARCHAR(100) NOT NULL DEFAULT 'packaging',
      duration_minutes INT NOT NULL DEFAULT 30,
      description TEXT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Migrate dữ liệu từ personal_services sang services nếu có
  const [psRows] = await pool.query("SELECT * FROM personal_services");
  for (const s of psRows) {
    await pool.query(`
      INSERT INTO services (id, name, price, image, category, duration_minutes, description, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name), price = VALUES(price);
    `, [s.id, s.name, s.price, s.image, s.category || 'packaging', s.duration_minutes || 30, s.description, s.is_active ?? 1]);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS service_bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      service_id INT NOT NULL,
      appointment_date DATETIME NOT NULL,
      customer_note TEXT NULL,
      estimated_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      status ENUM('requested', 'approved', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'requested',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
      INDEX idx_bookings_uid (user_id),
      INDEX idx_bookings_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 12. Đánh giá sản phẩm (reviews)
  console.log("12. Khởi tạo bảng reviews...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      user_id INT NOT NULL,
      order_id INT NULL,
      rating TINYINT NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
      comment TEXT NULL,
      review_images JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
      INDEX idx_reviews_pid (product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log("✅ Quá trình nâng cấp Database 3NF hoàn thành 100%!");
  const [allTables] = await pool.query("SHOW TABLES");
  console.log("Danh sách các bảng hiện có:");
  console.table(allTables);

  await pool.end();
}

migrateV2().catch((err) => {
  console.error("❌ Lỗi khi migrate:", err);
  process.exit(1);
});
