-- -------------------------------------------------------------
-- BẢNG LIÊN KẾT QUẢNG CÁO (ad_banners) BỔ SUNG CHO MYSQL HOSTINGER
-- Đảm bảo không ảnh hưởng đến bất kỳ dữ liệu hiện tại nào của hệ thống.
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `ad_banners` (
  `id` VARCHAR(50) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `image` LONGTEXT,
  `link` VARCHAR(255),
  `active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chèn dữ liệu mẫu ban đầu (Nếu chưa tồn tại)
INSERT INTO `ad_banners` (`id`, `title`, `image`, `link`, `active`) VALUES
('ad1', 'Cổng Dịch vụ công Quốc gia', 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=300&h=300', 'https://dichvucong.gov.vn', 1),
('ad2', 'Cổng TTĐT Tỉnh Sơn La', 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?auto=format&fit=crop&q=80&w=300&h=300', 'https://sonla.gov.vn', 1),
('ad3', 'Trang Tin Đảng Cộng Sản', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=300&h=300', 'http://dangcongsan.vn', 1),
('ad4', 'Báo Sơn La Điện Tử', 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=300&h=300', 'https://baosonla.org.vn', 1),
('ad5', 'Hệ Thống Quản Lý Văn Bản', 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=300&h=300', 'https://qlvb.sonla.gov.vn', 1),
('ad6', 'Tổng Đài Hỗ Trợ Viettel', 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=300&h=300', 'https://viettel.vn', 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `image` = VALUES(`image`), `link` = VALUES(`link`), `active` = VALUES(`active`);
