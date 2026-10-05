CREATE DATABASE IF NOT EXISTS eiko_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eiko_shop;

-- ====================================================
-- 1. BẢNG NGƯỜI DÙNG (USERS)
-- ====================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed tài khoản admin mẫu (TK: admin, MK: admin123) và khách mẫu
INSERT INTO users (username, password, full_name, role) VALUES
('admin', '$2b$10$Hr2WAN4aSJoDxlq7AtYGc.FzxMV/IbOzvQJdNt1UoaL56cbrCTrxS', 'Quản trị viên Eiko', 'admin'),
('khachhang', '$2b$10$Hr2WAN4aSJoDxlq7AtYGc.FzxMV/IbOzvQJdNt1UoaL56cbrCTrxS', 'Nguyễn Văn Khách', 'user')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- ====================================================
-- 2. BẢNG SẢN PHẨM (PRODUCTS)
-- ====================================================
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  icon VARCHAR(20) NOT NULL DEFAULT '🎁',
  image TEXT DEFAULT '',
  color VARCHAR(20) NOT NULL DEFAULT '#fce7f3',
  category VARCHAR(100) NOT NULL DEFAULT 'Khác',
  description TEXT NOT NULL,
  origin VARCHAR(255) NOT NULL DEFAULT 'Việt Nam',
  material VARCHAR(255) NOT NULL DEFAULT 'Thủ công',
  dimensions VARCHAR(100) NOT NULL DEFAULT 'Tiêu chuẩn',
  weight VARCHAR(50) NOT NULL DEFAULT '300 g',
  stock INT NOT NULL DEFAULT 0,
  rating DECIMAL(3,1) NOT NULL DEFAULT 5.0,
  review_count INT NOT NULL DEFAULT 0,
  care_instructions TEXT,
  package_contents TEXT,
  warranty VARCHAR(255),
  shipping_info TEXT,
  `usage` TEXT,
  tags JSON,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO products (sku, name, price, icon, image, color, category, description, origin, material, dimensions, weight, stock, rating, review_count, care_instructions, package_contents, warranty, shipping_info, `usage`, tags, is_featured, is_active) VALUES
('EIKO-001', 'Túi cói Hội An', 189000, '👜', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80', '#f6d6a4', 'Đồ thủ công', 'Túi cói đan thủ công, nhẹ nhàng và tiện dụng.', 'Làng nghề Cẩm Kim, Hội An', 'Cói tự nhiên, da PU', '30 x 24 x 10 cm', '420 g', 28, 4.8, 126, 'Bảo quản nơi khô thoáng, tránh ngâm nước.', '1 túi cói, 1 thẻ hướng dẫn', 'Đổi trả 7 ngày nếu lỗi', 'Giao toàn quốc 2-4 ngày', 'Đi chợ, đi biển, quà tặng', '["thủ công","Hội An","quà tặng"]', TRUE, TRUE),
('EIKO-002', 'Áo dài mini Huế', 329000, '👘', 'https://images.unsplash.com/photo-1523170335258-fef16a32d017?auto=format&fit=crop&w=900&q=80', '#d9c4ff', 'Thời trang', 'Món quà nhỏ mang nét duyên dáng xứ Huế.', 'Phường Kim Long, Huế', 'Lụa tơ tằm, khung gỗ', 'Dài 32 x rộng 18 cm', '180 g', 15, 4.9, 84, 'Lau nhẹ bằng khăn mềm, không giặt máy.', '1 áo dài mini, 1 giá đỡ gỗ', 'Bảo hành khung gỗ 30 ngày', 'Bọc chống bụi, giao 2-4 ngày', 'Trưng bày, quà tặng lễ tết', '["Huế","lụa","lưu niệm"]', TRUE, TRUE),
('EIKO-003', 'Bình gốm Bát Tràng', 275000, '🏺', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80', '#bce5dc', 'Trang trí', 'Bình gốm thủ công họa tiết làng nghề Việt.', 'Làng gốm Bát Tràng, Hà Nội', 'Gốm sứ nung nhiệt cao', '18 x 18 x 24 cm', '780 g', 34, 4.7, 203, 'Lau bằng khăn mềm; tránh va đập.', '1 bình gốm, 1 hộp giấy kraft', 'Đổi mới nếu nứt vỡ do vận chuyển', 'Đóng 2 lớp chống sốc', 'Cắm hoa, trưng kệ sách', '["gốm","Bát Tràng","trang trí"]', TRUE, TRUE),
('EIKO-004', 'Nón lá Quảng Bình', 145000, '👒', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80', '#e8f5e9', 'Đồ thủ công', 'Nón lá truyền thống đan tỉ mỉ, che nắng tốt.', 'Làng nón Phú Thọ, Quảng Bình', 'Lá cọ, sợi cước', 'Đường kính 45 cm', '210 g', 50, 4.6, 92, 'Phơi khô khi bị ướt, cất nơi thoáng.', '1 nón lá, 1 quai đeo lụa', 'Bảo hành đường may 15 ngày', 'Giao nhanh nội thành 1-2 ngày', 'Che nắng du lịch, chụp ảnh', '["nón lá","truyền thống","du lịch"]', FALSE, TRUE),
('EIKO-005', 'Tranh treo Đông Hồ', 215000, '🎋', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80', '#f8e0ac', 'Trang trí', 'Tranh in mộc bản Đông Hồ màu sắc tự nhiên.', 'Làng tranh Đông Hồ, Bắc Ninh', 'Giấy dó, màu thực vật', '30 x 40 cm', '150 g', 42, 4.9, 178, 'Tránh ánh nắng trực tiếp lâu ngày.', '1 tranh in, 1 khung gỗ thông', 'Bảo hành khung 1 tháng', 'Cuộn trong ống giấy cứng', 'Trang trí phòng khách, quà biếu', '["tranh","Đông Hồ","nghệ thuật"]', TRUE, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name), price = VALUES(price);

-- ====================================================
-- 3. BẢNG DỊCH VỤ CÁ NHÂN (PERSONAL_SERVICES)
-- ====================================================
CREATE TABLE IF NOT EXISTS personal_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  image TEXT DEFAULT '',
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'packaging',
  duration_minutes INT NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO personal_services (name, price, image, description, category, duration_minutes, is_active) VALUES
('Gói quà giấy Kraft hoa khô', 45000, 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80', 'Gói quà phong cách vintage mộc mạc kèm thiệp viết tay ý nghĩa.', 'packaging', 20, TRUE),
('Kit thêu tay hoa sen DIY', 120000, 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=600&q=80', 'Bộ tự thêu đầy đủ chỉ màu, khung căng và vải in sẵn họa tiết.', 'diy_kit', 60, TRUE),
('Khung ảnh kẹp gỗ mini', 65000, 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80', 'Decor bàn học, góc làm việc nhỏ xinh theo phong cách ấm áp.', 'mini_decor', 15, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ====================================================
-- 4. BẢNG ĐƠN HÀNG (ORDERS)
-- ====================================================
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  customer_name VARCHAR(255) NOT NULL DEFAULT 'Khách hàng',
  phone VARCHAR(20) DEFAULT '',
  address TEXT DEFAULT '',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'COD',
  status ENUM('pending', 'confirmed', 'processing', 'shipping', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  note TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ====================================================
-- 5. BẢNG CHI TIẾT ĐƠN HÀNG (ORDER_ITEMS)
-- ====================================================
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price_at_purchase DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;