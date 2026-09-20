CREATE DATABASE IF NOT EXISTS eiko_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eiko_shop;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  price VARCHAR(50) NOT NULL,
  icon VARCHAR(20) NOT NULL,
  image TEXT DEFAULT '',
  color VARCHAR(20) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  origin VARCHAR(255) NOT NULL,
  material VARCHAR(255) NOT NULL,
  dimensions VARCHAR(100) NOT NULL,
  weight VARCHAR(50) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  rating DECIMAL(3,1) NOT NULL DEFAULT 0.0,
  review_count INT NOT NULL DEFAULT 0,
  care_instructions TEXT,
  package_contents TEXT,
  warranty VARCHAR(255),
  shipping_info TEXT,
  `usage` TEXT,
  tags JSON,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO products (sku, name, price, icon, image, color, category, description, origin, material, dimensions, weight, stock, rating, review_count, care_instructions, package_contents, warranty, shipping_info, `usage`, tags, is_featured) VALUES
('EIKO-001', 'Túi cói Hội An', '189.000đ', '👜', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80', '#f6d6a4', 'Đồ thủ công', 'Túi cói đan thủ công, nhẹ nhàng và tiện dụng.', 'Làng nghề Cẩm Kim, Hội An', 'Cói tự nhiên, da PU', '30 x 24 x 10 cm', '420 g', 28, 4.8, 126, 'Bảo quản nơi khô thoáng, tránh ngâm nước.', '1 túi cói, 1 thẻ hướng dẫn', 'Đổi trả 7 ngày nếu lỗi', 'Giao toàn quốc 2-4 ngày', 'Đi chợ, đi biển, quà tặng', '["thủ công","Hội An","quà tặng"]', TRUE),
('EIKO-002', 'Áo dài mini Huế', '329.000đ', '👘', 'https://images.unsplash.com/photo-1523170335258-fef16a32d017?auto=format&fit=crop&w=900&q=80', '#d9c4ff', 'Thời trang', 'Món quà nhỏ mang nét duyên dáng xứ Huế.', 'Phường Kim Long, Huế', 'Lụa tơ tằm, khung gỗ', 'Dài 32 x rộng 18 cm', '180 g', 15, 4.9, 84, 'Lau nhẹ bằng khăn mềm, không giặt máy.', '1 áo dài mini, 1 giá đỡ gỗ', 'Bảo hành khung gỗ 30 ngày', 'Bọc chống bụi, giao 2-4 ngày', 'Trưng bày, quà tặng lễ tết', '["Huế","lụa","lưu niệm"]', TRUE),
('EIKO-003', 'Bình gốm Bát Tràng', '275.000đ', '', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80', '#bce5dc', 'Trang trí', 'Bình gốm thủ công họa tiết làng nghề Việt.', 'Làng gốm Bát Tràng, Hà Nội', 'Gốm sứ nung nhiệt cao', '18 x 18 x 24 cm', '780 g', 34, 4.7, 203, 'Lau bằng khăn mềm; tránh va đập.', '1 bình gốm, 1 hộp giấy kraft', 'Đổi mới nếu nứt vỡ do vận chuyển', 'Đóng 2 lớp chống sốc', 'Cắm hoa, trưng kệ sách', '["gốm","Bát Tràng","trang trí"]', TRUE),
('EIKO-004', 'Nón lá Quảng Bình', '145.000đ', '👒', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80', '#e8f5e9', 'Đồ thủ công', 'Nón lá truyền thống đan tỉ mỉ, che nắng tốt.', 'Làng nón Phú Thọ, Quảng Bình', 'Lá cọ, sợi cước', 'Đường kính 45 cm', '210 g', 50, 4.6, 92, 'Phơi khô khi bị ướt, cất nơi thoáng.', '1 nón lá, 1 quai đeo lụa', 'Bảo hành đường may 15 ngày', 'Giao nhanh nội thành 1-2 ngày', 'Che nắng du lịch, chụp ảnh', '["nón lá","truyền thống","du lịch"]', FALSE),
('EIKO-005', 'Tranh treo Đông Hồ', '215.000đ', '🎋', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80', '#f8e0ac', 'Trang trí', 'Tranh in mộc bản Đông Hồ màu sắc tự nhiên.', 'Làng tranh Đông Hồ, Bắc Ninh', 'Giấy dó, màu thực vật', '30 x 40 cm', '150 g', 42, 4.9, 178, 'Tránh ánh nắng trực tiếp lâu ngày.', '1 tranh in, 1 khung gỗ thông', 'Bảo hành khung 1 tháng', 'Cuộn trong ống giấy cứng', 'Trang trí phòng khách, quà biếu', '["tranh","Đông Hồ","nghệ thuật"]', TRUE);