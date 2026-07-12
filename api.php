<?php
/**
 * -----------------------------------------------------------------------------
 * CTH SLA PLATFORM - HOSTINGER MYSQL API GATEWAY (api.php)
 * -----------------------------------------------------------------------------
 * File này đóng vai trò là một REST API Gateway trung gian viết bằng PHP,
 * cho phép ứng dụng React Frontend (Vite) truy vấn và lưu trữ dữ liệu trực tiếp
 * vào cơ sở dữ liệu MySQL trên Hostinger một cách bảo mật mà không bị lộ mật khẩu.
 * 
 * HƯỚNG DẪN CẤU HÌNH TRÊN HOSTINGER:
 * 1. Tạo một cơ sở dữ liệu MySQL mới trên hPanel/cPanel của Hostinger.
 * 2. Nhập file backup `mysql_backup.sql` vào cơ sở dữ liệu vừa tạo qua phpMyAdmin.
 * 3. Điền thông tin cấu hình kết nối database bên dưới (HOST, USER, PASSWORD, DB).
 * 4. Upload file `api.php` này vào thư mục `public_html` cùng với build của React.
 * -----------------------------------------------------------------------------
 */

// CẤU HÌNH KẾT NỐI DATABASE MYSQL (Thay đổi thông tin tương ứng trên Hostinger của bạn)
define('DB_HOST', 'localhost');          // Thường là localhost trên Hostinger
define('DB_PORT', '3306');               // Cổng mặc định của MySQL
define('DB_USER', 'u123456789_cth_usr');  // Username MySQL tạo trên Hostinger
define('DB_PASS', 'Mật_Khẩu_Của_Bạn_123'); // Mật khẩu của Database User
define('DB_NAME', 'db123456789_cth_db');   // Tên Database tạo trên Hostinger

// THIẾT LẬP CÁC HEADER CHO PHÉP TRUY CẬP (CORS & JSON RESPONSE)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Trả về OK cho phương thức kiểm tra OPTIONS (Preflight request của trình duyệt)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Khởi tạo kết nối PDO MySQL
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Lỗi kết nối cơ sở dữ liệu MySQL trên Hostinger. Vui lòng kiểm tra lại cấu hình DB_USER, DB_PASS, DB_NAME trong file api.php.",
        "details" => $e->getMessage()
    ]);
    exit();
}

// LẤY HÀNH ĐỘNG CẦN THỰC HIỆN TỪ URL (ví dụ: api.php?action=getMeetings)
$action = isset($_GET['action']) ? $_GET['action'] : '';
$method = $_SERVER['REQUEST_METHOD'];

// Lấy dữ liệu gửi lên trong Body (nếu là POST hoặc PUT)
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

// BỘ ĐIỀU HƯỚNG CÁC ROUTE API (CRUD)
switch ($action) {
    
    // ==========================================
    // 1. CẤU HÌNH HỆ THỐNG (SYSTEM SETTINGS)
    // ==========================================
    case 'getSettings':
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM system_settings WHERE id = 1");
            $settings = $stmt->fetch();
            if ($settings) {
                echo json_encode([
                    "systemName" => $settings['system_name'],
                    "shortName" => $settings['short_name'],
                    "logoBase64" => $settings['logo_base_64'],
                    "primaryColor" => $settings['primary_color'],
                    "supportQrBase64" => $settings['support_qr_base_64'],
                    "supportPhone" => $settings['support_phone']
                ]);
            } else {
                echo json_encode(null);
            }
        } else {
            http_response_code(405);
        }
        break;

    case 'updateSettings':
        if ($method === 'POST') {
            if (!$input) {
                http_response_code(400);
                echo json_encode(["message" => "Dữ liệu cấu hình không hợp lệ"]);
                break;
            }
            $sql = "INSERT INTO system_settings (id, system_name, short_name, logo_base_64, primary_color, support_qr_base_64, support_phone)
                    VALUES (1, :systemName, :shortName, :logoBase64, :primaryColor, :supportQrBase64, :supportPhone)
                    ON DUPLICATE KEY UPDATE 
                      system_name = VALUES(system_name),
                      short_name = VALUES(short_name),
                      logo_base_64 = VALUES(logo_base_64),
                      primary_color = VALUES(primary_color),
                      support_qr_base_64 = VALUES(support_qr_base_64),
                      support_phone = VALUES(support_phone)";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':systemName' => $input['systemName'],
                ':shortName' => $input['shortName'],
                ':logoBase64' => isset($input['logoBase64']) ? $input['logoBase64'] : null,
                ':primaryColor' => isset($input['primaryColor']) ? $input['primaryColor'] : '#3B82F6',
                ':supportQrBase64' => isset($input['supportQrBase64']) ? $input['supportQrBase64'] : null,
                ':supportPhone' => isset($input['supportPhone']) ? $input['supportPhone'] : null
            ]);
            echo json_encode(["status" => "success", "message" => "Đã cập nhật cấu hình hệ thống"]);
        } else {
            http_response_code(405);
        }
        break;

    // ==========================================
    // 2. QUẢN LÝ CUỘC HỌP (MEETINGS)
    // ==========================================
    case 'getMeetings':
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM meetings ORDER BY start_time DESC");
            $meetings = $stmt->fetchAll();
            $formatted = [];
            foreach ($meetings as $m) {
                $formatted[] = [
                    "id" => $m['id'],
                    "title" => $m['title'],
                    "hostUnit" => $m['host_unit_name'],
                    "hostUnitId" => $m['host_unit_id'],
                    "chairPerson" => $m['chair_person_name'],
                    "chairPersonId" => $m['chair_person_id'],
                    "startTime" => $m['start_time'],
                    "endTime" => $m['end_time'],
                    "participants" => json_decode($m['participants'], true) ?: [],
                    "endpoints" => json_decode($m['endpoints'], true) ?: [],
                    "description" => $m['description'],
                    "notes" => $m['notes'],
                    "endpointChecks" => json_decode($m['endpoint_checks'], true) ?: new stdClass(),
                    "status" => $m['status'],
                    "cancelReason" => $m['cancel_reason'],
                    "invitationLink" => $m['invitation_link'],
                    "meetingRoomId" => $m['meeting_room_id'],
                    "meetingFormat" => $m['meeting_format'],
                    "createdAt" => $m['created_at']
                ];
            }
            echo json_encode($formatted);
        } else {
            http_response_code(405);
        }
        break;

    case 'upsertMeeting':
        if ($method === 'POST') {
            if (!$input || !isset($input['id'])) {
                http_response_code(400);
                echo json_encode(["message" => "Thiếu mã cuộc họp"]);
                break;
            }
            $sql = "INSERT INTO meetings (id, title, host_unit_name, host_unit_id, chair_person_name, chair_person_id, start_time, end_time, participants, endpoints, description, notes, endpoint_checks, status, cancel_reason, invitation_link, meeting_room_id, meeting_format)
                    VALUES (:id, :title, :host_unit_name, :host_unit_id, :chair_person_name, :chair_person_id, :start_time, :end_time, :participants, :endpoints, :description, :notes, :endpoint_checks, :status, :cancel_reason, :invitation_link, :meeting_room_id, :meeting_format)
                    ON DUPLICATE KEY UPDATE
                      title = VALUES(title),
                      host_unit_name = VALUES(host_unit_name),
                      host_unit_id = VALUES(host_unit_id),
                      chair_person_name = VALUES(chair_person_name),
                      chair_person_id = VALUES(chair_person_id),
                      start_time = VALUES(start_time),
                      end_time = VALUES(end_time),
                      participants = VALUES(participants),
                      endpoints = VALUES(endpoints),
                      description = VALUES(description),
                      notes = VALUES(notes),
                      endpoint_checks = VALUES(endpoint_checks),
                      status = VALUES(status),
                      cancel_reason = VALUES(cancel_reason),
                      invitation_link = VALUES(invitation_link),
                      meeting_room_id = VALUES(meeting_room_id),
                      meeting_format = VALUES(meeting_format)";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $input['id'],
                ':title' => $input['title'],
                ':host_unit_name' => isset($input['hostUnit']) ? $input['hostUnit'] : null,
                ':host_unit_id' => isset($input['hostUnitId']) ? $input['hostUnitId'] : null,
                ':chair_person_name' => isset($input['chairPerson']) ? $input['chairPerson'] : null,
                ':chair_person_id' => isset($input['chairPersonId']) ? $input['chairPersonId'] : null,
                ':start_time' => $input['startTime'],
                ':end_time' => $input['endTime'],
                ':participants' => json_encode(isset($input['participants']) ? $input['participants'] : []),
                ':endpoints' => json_encode(isset($input['endpoints']) ? $input['endpoints'] : []),
                ':description' => isset($input['description']) ? $input['description'] : null,
                ':notes' => isset($input['notes']) ? $input['notes'] : null,
                ':endpoint_checks' => json_encode(isset($input['endpointChecks']) ? $input['endpointChecks'] : new stdClass()),
                ':status' => isset($input['status']) ? $input['status'] : 'SCHEDULED',
                ':cancel_reason' => isset($input['cancelReason']) ? $input['cancelReason'] : null,
                ':invitation_link' => isset($input['invitationLink']) ? $input['invitationLink'] : null,
                ':meeting_room_id' => isset($input['meetingRoomId']) ? $input['meetingRoomId'] : null,
                ':meeting_format' => isset($input['meetingFormat']) ? $input['meetingFormat'] : 'TRUC_TUYEN'
            ]);
            echo json_encode(["status" => "success", "message" => "Lưu thông tin cuộc họp thành công"]);
        } else {
            http_response_code(405);
        }
        break;

    case 'deleteMeeting':
        if ($method === 'POST' || $method === 'DELETE') {
            $id = isset($_GET['id']) ? $_GET['id'] : (isset($input['id']) ? $input['id'] : '');
            if (!$id) {
                http_response_code(400);
                echo json_encode(["message" => "Thiếu ID cuộc họp cần xóa"]);
                break;
            }
            $stmt = $pdo->prepare("DELETE FROM meetings WHERE id = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(["status" => "success", "message" => "Đã xóa cuộc họp"]);
        } else {
            http_response_code(405);
        }
        break;

    // ==========================================
    // 3. QUẢN LÝ ĐIỂM CẦU (ENDPOINTS)
    // ==========================================
    case 'getEndpoints':
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM endpoints ORDER BY name ASC");
            $endpoints = $stmt->fetchAll();
            $formatted = [];
            foreach ($endpoints as $e) {
                $formatted[] = [
                    "id" => $e['id'],
                    "name" => $e['name'],
                    "location" => $e['location'],
                    "status" => $e['status'],
                    "lastConnected" => $e['last_connected'],
                    "ip1" => $e['ip_1'],
                    "ip2" => $e['ip_2']
                ];
            }
            echo json_encode($formatted);
        } else {
            http_response_code(405);
        }
        break;

    case 'upsertEndpoint':
        if ($method === 'POST') {
            if (!$input || !isset($input['id'])) {
                http_response_code(400);
                echo json_encode(["message" => "Thiếu mã điểm cầu"]);
                break;
            }
            $sql = "INSERT INTO endpoints (id, name, location, status, last_connected, ip_1, ip_2)
                    VALUES (:id, :name, :location, :status, :last_connected, :ip1, :ip2)
                    ON DUPLICATE KEY UPDATE
                      name = VALUES(name),
                      location = VALUES(location),
                      status = VALUES(status),
                      last_connected = VALUES(last_connected),
                      ip_1 = VALUES(ip_1),
                      ip_2 = VALUES(ip_2)";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $input['id'],
                ':name' => $input['name'],
                ':location' => isset($input['location']) ? $input['location'] : null,
                ':status' => isset($input['status']) ? $input['status'] : 'DISCONNECTED',
                ':last_connected' => isset($input['lastConnected']) ? $input['lastConnected'] : null,
                ':ip1' => isset($input['ip1']) ? $input['ip1'] : null,
                ':ip2' => isset($input['ip2']) ? $input['ip2'] : null
            ]);
            echo json_encode(["status" => "success", "message" => "Lưu điểm cầu thành công"]);
        } else {
            http_response_code(405);
        }
        break;

    case 'deleteEndpoint':
        if ($method === 'POST' || $method === 'DELETE') {
            $id = isset($_GET['id']) ? $_GET['id'] : (isset($input['id']) ? $input['id'] : '');
            if (!$id) {
                http_response_code(400);
                echo json_encode(["message" => "Thiếu ID điểm cầu"]);
                break;
            }
            $stmt = $pdo->prepare("DELETE FROM endpoints WHERE id = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(["status" => "success", "message" => "Đã xóa điểm cầu"]);
        } else {
            http_response_code(405);
        }
        break;

    // ==========================================
    // 4. DANH MỤC ĐƠN VỊ (UNITS)
    // ==========================================
    case 'getUnits':
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM units ORDER BY name ASC");
            echo json_encode($stmt->fetchAll());
        } else {
            http_response_code(405);
        }
        break;

    case 'upsertUnit':
        if ($method === 'POST') {
            if (!$input || !isset($input['id'])) {
                http_response_code(400);
                echo json_encode(["message" => "Thiếu mã đơn vị"]);
                break;
            }
            $sql = "INSERT INTO units (id, name, code, description)
                    VALUES (:id, :name, :code, :description)
                    ON DUPLICATE KEY UPDATE
                      name = VALUES(name),
                      code = VALUES(code),
                      description = VALUES(description)";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $input['id'],
                ':name' => $input['name'],
                ':code' => $input['code'],
                ':description' => isset($input['description']) ? $input['description'] : null
            ]);
            echo json_encode(["status" => "success", "message" => "Lưu đơn vị thành công"]);
        } else {
            http_response_code(405);
        }
        break;

    case 'deleteUnit':
        if ($method === 'POST' || $method === 'DELETE') {
            $id = isset($_GET['id']) ? $_GET['id'] : (isset($input['id']) ? $input['id'] : '');
            $stmt = $pdo->prepare("DELETE FROM units WHERE id = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(["status" => "success", "message" => "Đã xóa đơn vị"]);
        } else {
            http_response_code(405);
        }
        break;

    // ==========================================
    // 5. DANH MỤC CÁN BỘ (STAFF)
    // ==========================================
    case 'getStaff':
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM staff ORDER BY full_name ASC");
            $staff = $stmt->fetchAll();
            $formatted = [];
            foreach ($staff as $s) {
                $formatted[] = [
                    "id" => $s['id'],
                    "fullName" => $s['full_name'],
                    "unitId" => $s['unit_id'],
                    "position" => $s['position'],
                    "email" => $s['email'],
                    "phone" => $s['phone']
                ];
            }
            echo json_encode($formatted);
        } else {
            http_response_code(405);
        }
        break;

    case 'upsertStaff':
        if ($method === 'POST') {
            if (!$input || !isset($input['id'])) {
                http_response_code(400);
                echo json_encode(["message" => "Thiếu mã cán bộ"]);
                break;
            }
            $sql = "INSERT INTO staff (id, full_name, unit_id, position, email, phone)
                    VALUES (:id, :fullName, :unitId, :position, :email, :phone)
                    ON DUPLICATE KEY UPDATE
                      full_name = VALUES(full_name),
                      unit_id = VALUES(unit_id),
                      position = VALUES(position),
                      email = VALUES(email),
                      phone = VALUES(phone)";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $input['id'],
                ':fullName' => $input['fullName'],
                ':unitId' => isset($input['unitId']) ? $input['unitId'] : null,
                ':position' => isset($input['position']) ? $input['position'] : null,
                ':email' => isset($input['email']) ? $input['email'] : null,
                ':phone' => isset($input['phone']) ? $input['phone'] : null
            ]);
            echo json_encode(["status" => "success", "message" => "Lưu thông tin cán bộ thành công"]);
        } else {
            http_response_code(405);
        }
        break;

    case 'deleteStaff':
        if ($method === 'POST' || $method === 'DELETE') {
            $id = isset($_GET['id']) ? $_GET['id'] : (isset($input['id']) ? $input['id'] : '');
            $stmt = $pdo->prepare("DELETE FROM staff WHERE id = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(["status" => "success", "message" => "Đã xóa cán bộ"]);
        } else {
            http_response_code(405);
        }
        break;

    // ==========================================
    // 6. NHÓM THÀNH PHẦN THAM GIA (GROUPS)
    // ==========================================
    case 'getGroups':
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM participant_groups ORDER BY name ASC");
            echo json_encode($stmt->fetchAll());
        } else {
            http_response_code(405);
        }
        break;

    case 'upsertGroup':
        if ($method === 'POST') {
            if (!$input || !isset($input['id'])) {
                http_response_code(400);
                echo json_encode(["message" => "Thiếu mã nhóm"]);
                break;
            }
            $sql = "INSERT INTO participant_groups (id, name, description)
                    VALUES (:id, :name, :description)
                    ON DUPLICATE KEY UPDATE
                      name = VALUES(name),
                      description = VALUES(description)";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $input['id'],
                ':name' => $input['name'],
                ':description' => isset($input['description']) ? $input['description'] : null
            ]);
            echo json_encode(["status" => "success", "message" => "Lưu nhóm thành công"]);
        } else {
            http_response_code(405);
        }
        break;

    case 'deleteGroup':
        if ($method === 'POST' || $method === 'DELETE') {
            $id = isset($_GET['id']) ? $_GET['id'] : (isset($input['id']) ? $input['id'] : '');
            $stmt = $pdo->prepare("DELETE FROM participant_groups WHERE id = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(["status" => "success", "message" => "Đã xóa nhóm thành công"]);
        } else {
            http_response_code(405);
        }
        break;

    // ==========================================
    // 7. QUẢN LÝ TÀI KHOẢN (USERS)
    // ==========================================
    case 'getUsers':
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM users ORDER BY username ASC");
            $users = $stmt->fetchAll();
            $formatted = [];
            foreach ($users as $u) {
                $formatted[] = [
                    "id" => $u['id'],
                    "username" => $u['username'],
                    "fullName" => $u['full_name'],
                    "role" => $u['role'],
                    "password" => $u['password']
                ];
            }
            echo json_encode($formatted);
        } else {
            http_response_code(405);
        }
        break;

    case 'upsertUser':
        if ($method === 'POST') {
            if (!$input || !isset($input['id'])) {
                http_response_code(400);
                echo json_encode(["message" => "Thiếu mã tài khoản"]);
                break;
            }
            $sql = "INSERT INTO users (id, username, full_name, role, password)
                    VALUES (:id, :username, :fullName, :role, :password)
                    ON DUPLICATE KEY UPDATE
                      username = VALUES(username),
                      full_name = VALUES(full_name),
                      role = VALUES(role),
                      password = VALUES(password)";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $input['id'],
                ':username' => $input['username'],
                ':fullName' => $input['fullName'],
                ':role' => isset($input['role']) ? $input['role'] : 'VIEWER',
                ':password' => $input['password']
            ]);
            echo json_encode(["status" => "success", "message" => "Lưu tài khoản thành công"]);
        } else {
            http_response_code(405);
        }
        break;

    case 'deleteUser':
        if ($method === 'POST' || $method === 'DELETE') {
            $id = isset($_GET['id']) ? $_GET['id'] : (isset($input['id']) ? $input['id'] : '');
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(["status" => "success", "message" => "Đã xóa tài khoản"]);
        } else {
            http_response_code(405);
        }
        break;

    // ==========================================
    // 8. CÁN BỘ VẬN HÀNH HỆ THỐNG (OPERATORS)
    // ==========================================
    case 'getOperators':
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM system_operators ORDER BY full_name ASC");
            $operators = $stmt->fetchAll();
            $formatted = [];
            foreach ($operators as $o) {
                $formatted[] = [
                    "id" => $o['id'],
                    "fullName" => $o['full_name'],
                    "position" => $o['position'],
                    "endpointId" => $o['endpoint_id'],
                    "phone" => $o['phone']
                ];
            }
            echo json_encode($formatted);
        } else {
            http_response_code(405);
        }
        break;

    case 'upsertOperator':
        if ($method === 'POST') {
            if (!$input || !isset($input['id'])) {
                http_response_code(400);
                echo json_encode(["message" => "Thiếu mã cán bộ vận hành"]);
                break;
            }
            $sql = "INSERT INTO system_operators (id, full_name, position, endpoint_id, phone)
                    VALUES (:id, :fullName, :position, :endpointId, :phone)
                    ON DUPLICATE KEY UPDATE
                      full_name = VALUES(full_name),
                      position = VALUES(position),
                      endpoint_id = VALUES(endpoint_id),
                      phone = VALUES(phone)";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $input['id'],
                ':fullName' => $input['fullName'],
                ':position' => isset($input['position']) ? $input['position'] : null,
                ':endpointId' => isset($input['endpointId']) ? $input['endpointId'] : null,
                ':phone' => isset($input['phone']) ? $input['phone'] : null
            ]);
            echo json_encode(["status" => "success", "message" => "Lưu thông tin cán bộ vận hành thành công"]);
        } else {
            http_response_code(405);
        }
        break;

    case 'deleteOperator':
        if ($method === 'POST' || $method === 'DELETE') {
            $id = isset($_GET['id']) ? $_GET['id'] : (isset($input['id']) ? $input['id'] : '');
            $stmt = $pdo->prepare("DELETE FROM system_operators WHERE id = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(["status" => "success", "message" => "Đã xóa cán bộ vận hành"]);
        } else {
            http_response_code(405);
        }
        break;

    default:
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Không tìm thấy hành động được yêu cầu (Invalid Action)"]);
        break;
}
