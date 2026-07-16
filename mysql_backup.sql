-- -----------------------------------------------------
-- CTH SLA PLATFORM - COMPLETE MYSQL SCHEMA & DATA BACKUP
-- Generated at: 2026-07-09
-- Compatible with MySQL 5.7+ and MySQL 8.0+
-- -----------------------------------------------------

CREATE DATABASE IF NOT EXISTS `cth_sla_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `cth_sla_db`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `system_settings`;
DROP TABLE IF EXISTS `system_operators`;
DROP TABLE IF EXISTS `meetings`;
DROP TABLE IF EXISTS `staff`;
DROP TABLE IF EXISTS `units`;
DROP TABLE IF EXISTS `endpoints`;
DROP TABLE IF EXISTS `endpoint_groups`;
DROP TABLE IF EXISTS `participant_groups`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `ad_banners`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Bảng Cấu hình hệ thống ( system_settings )
CREATE TABLE `system_settings` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `system_name` VARCHAR(255) NOT NULL DEFAULT 'HỆ THỐNG GIÁM SÁT HỘP TRỰC TUYẾN',
  `short_name` VARCHAR(255) NOT NULL DEFAULT 'E-MEETING SLA',
  `logo_base_64` LONGTEXT,
  `primary_color` VARCHAR(50) DEFAULT '#3B82F6',
  `support_qr_base_64` LONGTEXT,
  `support_phone` VARCHAR(50),
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.2 Bảng liên kết quảng cáo ( ad_banners ) bổ sung
CREATE TABLE `ad_banners` (
  `id` VARCHAR(50) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `image` LONGTEXT,
  `link` VARCHAR(255),
  `active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.5 Bảng Nhóm điểm cầu ( endpoint_groups )
CREATE TABLE `endpoint_groups` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng Danh mục Đơn vị ( units )
CREATE TABLE `units` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng Danh mục Cán bộ ( staff )
CREATE TABLE `staff` (
  `id` VARCHAR(50) PRIMARY KEY,
  `full_name` VARCHAR(255) NOT NULL,
  `unit_id` VARCHAR(50),
  `position` VARCHAR(255),
  `email` VARCHAR(255),
  `phone` VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng Danh mục Điểm cầu ( endpoints )
CREATE TABLE `endpoints` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `location` VARCHAR(255),
  `status` VARCHAR(50) DEFAULT 'DISCONNECTED',
  `last_connected` VARCHAR(255),
  `ip_1` VARCHAR(100),
  `ip_2` VARCHAR(100),
  `group_id` VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`group_id`) REFERENCES `endpoint_groups`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bảng Nhóm thành phần tham gia ( participant_groups )
CREATE TABLE `participant_groups` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bảng Danh mục Cán bộ vận hành hệ thống ( system_operators )
CREATE TABLE `system_operators` (
  `id` VARCHAR(50) PRIMARY KEY,
  `full_name` VARCHAR(255) NOT NULL,
  `position` VARCHAR(255),
  `endpoint_id` VARCHAR(50),
  `phone` VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`endpoint_id`) REFERENCES `endpoints`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Bảng Quản lý Cuộc họp ( meetings )
CREATE TABLE `meetings` (
  `id` VARCHAR(50) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `host_unit_name` VARCHAR(255),
  `host_unit_id` VARCHAR(50),
  `chair_person_name` VARCHAR(255),
  `chair_person_id` VARCHAR(50),
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  `participants` JSON,
  `endpoints` JSON,
  `description` TEXT,
  `notes` TEXT,
  `endpoint_checks` JSON,
  `status` VARCHAR(50) DEFAULT 'SCHEDULED',
  `cancel_reason` TEXT,
  `invitation_link` TEXT,
  `meeting_room_id` VARCHAR(100),
  `meeting_format` VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Bảng Quản lý Tài khoản ( users )
CREATE TABLE `users` (
  `id` VARCHAR(50) PRIMARY KEY,
  `username` VARCHAR(255) UNIQUE NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'VIEWER',
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Tạo các chỉ mục phục vụ tối ưu hóa truy vấn
CREATE INDEX idx_meetings_start_time ON `meetings` (start_time);
CREATE INDEX idx_meetings_status ON `meetings` (status);
CREATE INDEX idx_meetings_host_unit ON `meetings` (host_unit_name);
CREATE INDEX idx_staff_unit ON `staff` (unit_id);

-- -----------------------------------------------------
-- DỮ LIỆU BAN ĐẦU (SEED DATA & BACKUP) SẴN SÀNG CHO MYSQL
-- -----------------------------------------------------

-- Bảng `system_settings`
INSERT INTO `system_settings` (`id`, `system_name`, `short_name`, `primary_color`, `support_phone`) VALUES
(1, 'ỦY BAN NHÂN DÂN TỈNH SƠN LA', 'HỘI NGHỊ TRỰC TUYẾN SƠN LA', '#3B82F6', '0328.007.999');

-- Bảng `units`
INSERT INTO `units` (`id`, `name`, `code`, `description`) VALUES
('U1', 'Văn phòng Tổng công ty', 'VP-TCT', 'Đơn vị quản lý điều hành chung'),
('U2', 'Phòng Kỹ thuật', 'P-KT', 'Quản lý vận hành hạ tầng'),
('U3', 'Phòng Kế hoạch', 'P-KH', 'Lập kế hoạch và kinh doanh'),
('U4', 'Phòng Tài chính', 'P-TC', 'Quản lý ngân sách'),
('U5', 'Phòng Nhân sự', 'P-NS', 'Quản lý con người');

-- Bảng `staff`
INSERT INTO `staff` (`id`, `full_name`, `unit_id`, `position`, `email`, `phone`) VALUES
('S1', 'Nguyễn Văn A', 'U1', 'Tổng Giám đốc', 'vana@example.com', '0912345678'),
('S2', 'Trần Thị B', 'U2', 'Trưởng phòng Kỹ thuật', 'thib@example.com', '0987654321'),
('S3', 'Lê Văn C', 'U3', 'Phó phòng Kế hoạch', 'vanc@example.com', '0901112223'),
('S4', 'Phạm Minh D', 'U1', 'Chánh Văn phòng', 'minhd@example.com', '0915556667');

-- Bảng `endpoint_groups`
INSERT INTO `endpoint_groups` (`id`, `name`, `description`) VALUES
('XA_PHUONG', 'Xã/Phường', 'Các điểm cầu thuộc UBND xã, phường, thị trấn'),
('SO_NGANH', 'Sở/Ngành', 'Các điểm cầu thuộc sở, ban, ngành cấp tỉnh'),
('TINH', 'Tỉnh', 'Các điểm cầu thuộc UBND tỉnh, HĐND tỉnh, Tỉnh ủy');

-- Bảng `endpoints`
INSERT INTO `endpoints` (`id`, `name`, `location`, `status`, `last_connected`, `ip_1`, `ip_2`, `group_id`) VALUES
('1', 'Điểm cầu Hà Nội', 'Tầng 5, Tòa nhà A', 'CONNECTED', '2024-05-20 08:00', '10.8.0.1', '192.168.1.1', 'TINH'),
('2', 'Điểm cầu TP.HCM', 'Tòa nhà B, Quận 1', 'CONNECTED', '2024-05-20 08:05', '10.8.0.2', '192.168.1.2', 'TINH'),
('3', 'Điểm cầu Đà Nẵng', 'VP Đại diện Miền Trung', 'DISCONNECTED', '2024-05-19 17:30', '10.8.0.3', '192.168.1.3', 'TINH'),
('4', 'Điểm cầu Cần Thơ', 'VP Cần Thơ', 'CONNECTED', '2024-05-20 08:15', '10.8.0.4', '192.168.1.4', 'SO_NGANH'),
('5', 'Điểm cầu Hải Phòng', 'VP Hải Phòng', 'DISCONNECTED', '2024-05-18 10:00', '10.8.0.5', '192.168.1.5', 'SO_NGANH'),
('6', 'Điểm cầu Nghệ An', 'VP Nghệ An', 'CONNECTED', '2024-05-20 08:20', '10.8.0.6', '192.168.1.6', 'SO_NGANH'),
('7', 'Điểm cầu Quảng Ninh', 'VP Quảng Ninh', 'CONNECTED', '2024-05-20 08:22', '10.8.0.7', '192.168.1.7', 'XA_PHUONG'),
('8', 'Điểm cầu Khánh Hòa', 'VP Nha Trang', 'CONNECTED', '2024-05-20 08:25', '10.8.0.8', '192.168.1.8', 'XA_PHUONG'),
('9', 'Điểm cầu Hà Giang', 'VP Hà Giang', 'CONNECTED', '2024-05-20 08:30', '10.8.0.9', '192.168.1.9', 'XA_PHUONG');

-- Bảng `participant_groups`
INSERT INTO `participant_groups` (`id`, `name`, `description`) VALUES
('G1', 'Ban Giám đốc', 'Bao gồm các lãnh đạo cao nhất'),
('G2', 'Hội đồng quản trị', 'Các thành viên HĐQT'),
('G3', 'Trưởng phó các phòng ban', 'Đội ngũ quản lý cấp trung'),
('G4', 'Toàn thể cán bộ nhân viên', 'Tất cả nhân viên công ty');

-- Bảng `system_operators`
INSERT INTO `system_operators` (`id`, `full_name`, `position`, `endpoint_id`, `phone`) VALUES
('OP1', 'Nguyễn Kỹ Thuật', 'Quản trị kỹ thuật', '1', '0911222333'),
('OP2', 'Trần Vận Hành', 'Kỹ thuật viên', '2', '0922333444');

-- Bảng `users`
INSERT INTO `users` (`id`, `username`, `full_name`, `role`, `password`) VALUES
('1', 'admin', 'Quản trị viên Hệ thống', 'ADMIN', 'admin'),
('2', 'user', 'Cán bộ Giám sát', 'VIEWER', 'user'),
('3', 'leader', 'Lãnh đạo Đơn vị', 'VIEWER', 'user');

-- Bảng `meetings`
INSERT INTO `meetings` (`id`, `title`, `host_unit_name`, `host_unit_id`, `chair_person_name`, `chair_person_id`, `start_time`, `end_time`, `participants`, `endpoints`, `description`, `notes`, `endpoint_checks`, `status`, `meeting_room_id`, `meeting_format`) VALUES
('MEET-001', 'Họp Giao ban Sáng Thứ Hai', 'Văn phòng Tổng công ty', 'U1', 'Nguyễn Văn A', 'S1', '2026-07-13 08:00:00', '2026-07-13 10:00:00', 
'["Ban Giám đốc", "Trưởng các phòng ban"]', 
'[{"id": "1", "name": "Điểm cầu Hà Nội", "location": "Tầng 5, Tòa nhà A", "status": "CONNECTED", "lastConnected": "2024-05-20 08:00", "ip1": "10.8.0.1", "ip2": "192.168.1.1"}]', 
'Báo cáo kết quả tuần trước và triển khai kế hoạch tuần mới.', 'Đầy đủ thành phần', '{}', 'SCHEDULED', 'ZOOM-999-888', 'TRUC_TUYEN'),

('MEET-002', 'Hội nghị Triển khai Kỹ thuật Q3', 'Phòng Kỹ thuật', 'U2', 'Trần Thị B', 'S2', '2026-07-14 14:00:00', '2026-07-14 17:00:00', 
'["Đội Kỹ thuật", "Đại diện Chi nhánh"]', 
'[]', 
'Hướng dẫn cài đặt và vận hành hệ thống mới.', 'Cần chuẩn bị tài liệu kỹ thuật', '{}', 'SCHEDULED', 'MS-TEAMS-111', 'TRUC_TUYEN');

-- Bảng `ad_banners`
INSERT INTO `ad_banners` (`id`, `title`, `image`, `link`, `active`) VALUES
('ad1', 'Cổng Dịch vụ công Quốc gia', 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=300&h=300', 'https://dichvucong.gov.vn', 1),
('ad2', 'Cổng TTĐT Tỉnh Sơn La', 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?auto=format&fit=crop&q=80&w=300&h=300', 'https://sonla.gov.vn', 1),
('ad3', 'Trang Tin Đảng Cộng Sản', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=300&h=300', 'http://dangcongsan.vn', 1),
('ad4', 'Báo Sơn La Điện Tử', 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=300&h=300', 'https://baosonla.org.vn', 1),
('ad5', 'Hệ Thống Quản Lý Văn Bản', 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=300&h=300', 'https://qlvb.sonla.gov.vn', 1),
('ad6', 'Tổng Đài Hỗ Trợ Viettel', 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=300&h=300', 'https://viettel.vn', 1);

COMMIT;
