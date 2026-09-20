CREATE DATABASE IF NOT EXISTS eiko_shop;
USE eiko_shop;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  price VARCHAR(50) NOT NULL,
  icon VARCHAR(20) NOT NULL,
  image TEXT NOT NULL DEFAULT '',
  color VARCHAR(20) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  origin VARCHAR(255) NOT NULL,
  material VARCHAR(255) NOT NULL,
  dimensions VARCHAR(100) NOT NULL,
  weight VARCHAR(50) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  rating DECIMAL(3,1) NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  care_instructions TEXT NOT NULL,
  package_contents TEXT NOT NULL DEFAULT '',
  warranty TEXT NOT NULL DEFAULT '',
  shipping_info TEXT NOT NULL DEFAULT '',
  usage TEXT NOT NULL DEFAULT '',
  tags JSON NOT NULL,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO products (
  sku, name, price, icon, image, color, category, description, origin, material,
  dimensions, weight, stock, rating, review_count, care_instructions,
  package_contents, warranty, shipping_info, usage, tags, is_featured
) VALUES
('EIKO-001', 'Túi cói Hội An', '189.000đ', '👜', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80', '#f6d6a4', 'Đồ thủ công', 'Túi cói đan thủ công, nhẹ nhàng và tiện dụng cho mọi chuyến đi.', 'Làng nghề Cẩm Kim, Hội An', 'Cói tự nhiên, da PU', '30 x 24 x 10 cm', '420 g', 28, 4.8, 126, 'Bảo quản nơi khô thoáng, tránh ngâm nước và phơi nắng gắt.', '1 túi cói, 1 thẻ hướng dẫn bảo quản', 'Đổi sản phẩm trong 7 ngày nếu lỗi do nhà sản xuất', 'Đóng hộp chống móp, giao toàn quốc từ 2-4 ngày', 'Dùng đi chợ, đi biển hoặc làm túi quà tặng hằng ngày', JSON_ARRAY('thủ công','Hội An','quà tặng'), 1),
('EIKO-002', 'Áo dài mini Huế', '329.000đ', '👘', 'https://images.unsplash.com/photo-1523170335258-fef16a32d017?auto=format&fit=crop&w=900&q=80', '#d9c4ff', 'Thời trang', 'Món quà nhỏ mang nét duyên dáng và thanh lịch của xứ Huế.', 'Phường Kim Long, Huế', 'Lụa tơ tằm, khung gỗ', 'Dài 32 x rộng 18 cm', '180 g', 15, 4.9, 84, 'Lau nhẹ bằng khăn mềm, không giặt máy.', '1 áo dài mini, 1 giá đỡ gỗ, 1 hộp quà', 'Bảo hành khung gỗ 30 ngày', 'Bọc chống bụi, giao toàn quốc từ 2-4 ngày', 'Trưng trên bàn làm việc, kệ sách hoặc tặng dịp lễ', JSON_ARRAY('Huế','lụa','lưu niệm'), 1),
('EIKO-003', 'Bình gốm Bát Tràng', '275.000đ', '🏺', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80', '#bce5dc', 'Trang trí', 'Bình gốm thủ công với họa tiết lấy cảm hứng từ làng nghề Việt.', 'Làng gốm Bát Tràng, Hà Nội', 'Gốm sứ nung nhiệt cao', '18 x 18 x 24 cm', '780 g', 34, 4.7, 203, 'Lau bằng khăn mềm; tránh va đập và sốc nhiệt.', '1 bình gốm, 1 hộp giấy kraft có đệm giấy', 'Đổi mới nếu sản phẩm nứt vỡ do vận chuyển', 'Đóng 2 lớp chống sốc, giao toàn quốc từ 2-4 ngày', 'Cắm hoa, trưng trên kệ sách hoặc làm quà tặng tân gia', JSON_ARRAY('gốm sứ','Bát Tràng','trang trí'), 1),
('EIKO-004', 'Móc khóa Việt Nam', '59.000đ', '🔑', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80', '#ffd2de', 'Quà tặng', 'Móc khóa gỗ nhỏ gọn, khắc hình bản đồ Việt Nam.', 'Xưởng mộc Đồng Kỵ, Bắc Ninh', 'Gỗ beech, khoen thép không gỉ', '6 x 3.5 x 0.8 cm', '35 g', 62, 4.6, 318, 'Tránh tiếp xúc lâu với nước và hóa chất tẩy rửa.', '1 móc khóa, 1 túi giấy mini', 'Đổi sản phẩm trong 7 ngày nếu lỗi gia công', 'Gói chống xước, giao toàn quốc từ 2-4 ngày', 'Gắn vào chìa khóa, balo hoặc quai túi', JSON_ARRAY('gỗ','Việt Nam','giá tốt'), 0),
('EIKO-005', 'Tranh treo Đông Hồ', '215.000đ', '🎋', 'https://images.unsplash.com/photo-1523170335258-fef16a32d017?auto=format&fit=crop&w=900&q=80', '#f8e0ac', 'Trang trí', 'Tranh in thủ công lấy cảm hứng từ dòng tranh Đông Hồ.', 'Làng tranh Đông Hồ, Bắc Ninh', 'Giấy điệp, khung gỗ thông', '25 x 35 cm', '360 g', 19, 4.8, 97, 'Treo trong nhà, tránh ánh nắng trực tiếp và nơi có độ ẩm cao.', '1 tranh, 1 khung gỗ, 1 bộ móc treo', 'Đổi mới nếu khung bị hư hỏng khi nhận hàng', 'Bọc góc chống va đập, giao toàn quốc từ 2-4 ngày', 'Treo ở phòng khách, phòng làm việc hoặc góc đọc sách', JSON_ARRAY('trang trí','Đông Hồ','nghệ thuật'), 1);
