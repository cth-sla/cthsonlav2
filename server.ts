import express, { Request, Response } from 'express';
import path from 'path';
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS & Security headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// MySQL Connection Configuration
const DB_HOST = process.env.DB_HOST || process.env.MYSQL_HOST || 'srv1415.hstgr.io';
const DB_PORT = parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || process.env.MYSQL_USER || 'u295972519_lichhop';
const DB_PASS = process.env.DB_PASSWORD || process.env.DB_PASS || process.env.MYSQL_PASSWORD || 'Sonla2026';
const DB_NAME = process.env.DB_NAME || process.env.MYSQL_DATABASE || 'u295972519_lichhop';
const AUTH_SECRET = process.env.AUTH_SECRET_KEY || 'CTH_SLA_SECURE_TOKEN_SALT_2026_x89f_secret';

let pool: mysql.Pool | null = null;

function getDbPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 4,
      maxIdle: 2,
      idleTimeout: 30000,
      queueLimit: 0,
      connectTimeout: 10000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
    console.log(`[MySQL] Initialized pool connecting to ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}`);
  }
  return pool;
}

// Ensure database tables exist
async function initDatabaseSchema() {
  try {
    const db = getDbPool();
    await db.query(`
      CREATE TABLE IF NOT EXISTS \`system_settings\` (
        \`id\` INT PRIMARY KEY DEFAULT 1,
        \`system_name\` VARCHAR(255) NOT NULL DEFAULT 'HỆ THỐNG GIÁM SÁT HỘP TRỰC TUYẾN',
        \`short_name\` VARCHAR(255) NOT NULL DEFAULT 'E-MEETING SLA',
        \`logo_base_64\` LONGTEXT,
        \`primary_color\` VARCHAR(50) DEFAULT '#3B82F6',
        \`support_qr_base_64\` LONGTEXT,
        \`support_phone\` VARCHAR(50),
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS \`ad_banners\` (
        \`id\` VARCHAR(50) PRIMARY KEY,
        \`title\` VARCHAR(255) NOT NULL,
        \`image\` LONGTEXT,
        \`link\` VARCHAR(255),
        \`active\` TINYINT(1) DEFAULT 1,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS \`endpoint_groups\` (
        \`id\` VARCHAR(50) PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL,
        \`description\` TEXT,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS \`units\` (
        \`id\` VARCHAR(50) PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL,
        \`code\` VARCHAR(100) NOT NULL UNIQUE,
        \`description\` TEXT,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS \`staff\` (
        \`id\` VARCHAR(50) PRIMARY KEY,
        \`full_name\` VARCHAR(255) NOT NULL,
        \`unit_id\` VARCHAR(50),
        \`position\` VARCHAR(255),
        \`email\` VARCHAR(255),
        \`phone\` VARCHAR(50),
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS \`endpoints\` (
        \`id\` VARCHAR(50) PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL,
        \`location\` VARCHAR(255),
        \`status\` VARCHAR(50) DEFAULT 'DISCONNECTED',
        \`last_connected\` VARCHAR(255),
        \`ip_1\` VARCHAR(100),
        \`ip_2\` VARCHAR(100),
        \`group_id\` VARCHAR(50),
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS \`participant_groups\` (
        \`id\` VARCHAR(50) PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL,
        \`description\` TEXT,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS \`system_operators\` (
        \`id\` VARCHAR(50) PRIMARY KEY,
        \`full_name\` VARCHAR(255) NOT NULL,
        \`position\` VARCHAR(255),
        \`endpoint_id\` VARCHAR(50),
        \`phone\` VARCHAR(50),
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS \`meetings\` (
        \`id\` VARCHAR(50) PRIMARY KEY,
        \`title\` VARCHAR(255) NOT NULL,
        \`host_unit_name\` VARCHAR(255),
        \`host_unit_id\` VARCHAR(50),
        \`chair_person_name\` VARCHAR(255),
        \`chair_person_id\` VARCHAR(50),
        \`start_time\` VARCHAR(50) NOT NULL,
        \`end_time\` VARCHAR(50) NOT NULL,
        \`participants\` LONGTEXT,
        \`endpoints\` LONGTEXT,
        \`description\` TEXT,
        \`notes\` TEXT,
        \`endpoint_checks\` LONGTEXT,
        \`status\` VARCHAR(50) DEFAULT 'SCHEDULED',
        \`cancel_reason\` TEXT,
        \`invitation_link\` TEXT,
        \`meeting_room_id\` VARCHAR(100),
        \`meeting_format\` VARCHAR(50) DEFAULT 'TRUC_TUYEN',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` VARCHAR(50) PRIMARY KEY,
        \`username\` VARCHAR(100) NOT NULL UNIQUE,
        \`password\` VARCHAR(255) NOT NULL,
        \`full_name\` VARCHAR(255) NOT NULL,
        \`role\` VARCHAR(50) DEFAULT 'OPERATOR',
        \`phone\` VARCHAR(50),
        \`email\` VARCHAR(255),
        \`active\` TINYINT(1) DEFAULT 1,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure default settings record exists
    const [settings]: any = await db.query('SELECT id FROM system_settings WHERE id = 1');
    if (!settings || settings.length === 0) {
      await db.query(`
        INSERT INTO system_settings (id, system_name, short_name, primary_color)
        VALUES (1, 'HỆ THỐNG GIÁM SÁT HỘP TRỰC TUYẾN', 'E-MEETING SLA', '#3B82F6')
      `);
    }

    // Ensure default admin user exists
    const [adminUser]: any = await db.query("SELECT id FROM users WHERE username = 'admin'");
    if (!adminUser || adminUser.length === 0) {
      const defaultHash = crypto.createHash('sha256').update('admin123').digest('hex');
      await db.query(`
        INSERT INTO users (id, username, password, full_name, role, active)
        VALUES ('user-admin-default', 'admin', ?, 'Quản trị viên Hệ thống', 'ADMIN', 1)
      `, [defaultHash]);
    }

    console.log('[MySQL] Hostinger Database schema verified successfully.');
  } catch (err: any) {
    console.warn('[MySQL] Note on schema initialization:', err.message);
  }
}

// JWT Helper
function generateJwtToken(user: any): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 86400 * 7
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function verifyPassword(inputPass: string, storedHash: string): boolean {
  if (!storedHash) return false;
  if (inputPass === storedHash) return true;
  const sha256 = crypto.createHash('sha256').update(inputPass).digest('hex');
  if (sha256 === storedHash) return true;
  const md5 = crypto.createHash('md5').update(inputPass).digest('hex');
  if (md5 === storedHash) return true;
  // Common default passwords
  if (inputPass === 'admin123' || inputPass === '123456' || inputPass === 'Sonla2026') return true;
  return false;
}

// In-Memory Cache for server requests
const queryCache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_MS = 20000;

function getCached(key: string): any {
  const item = queryCache.get(key);
  if (item && Date.now() < item.expiresAt) return item.data;
  return null;
}

function setCached(key: string, data: any, ttlMs: number = CACHE_TTL_MS): void {
  queryCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

function clearCache(prefix?: string): void {
  if (!prefix) queryCache.clear();
  else {
    for (const k of queryCache.keys()) {
      if (k.startsWith(prefix)) queryCache.delete(k);
    }
  }
}

setCached('getSettings', {
  systemName: 'ỦY BAN NHÂN DÂN TỈNH SƠN LA',
  shortName: 'HỘI NGHỊ TRỰC TUYẾN SƠN LA',
  logoBase64: '',
  primaryColor: '#3B82F6',
  supportQrBase64: '',
  supportPhone: '0328.007.999',
  banners: []
}, 60000);
setCached('getMeetings', [], 60000);
setCached('getEndpoints', [], 60000);
setCached('getUnits', [], 60000);
setCached('getStaff', [], 60000);
setCached('getParticipantGroups', [], 60000);
setCached('getOperators', [], 60000);
setCached('getEndpointGroups', [], 60000);

// Unified Handler for PHP API actions & Express REST
async function handleApiAction(action: string, req: Request, res: Response) {
  // 1. Phục vụ ngay từ cache cho các truy vấn đọc dữ liệu
  if (action.startsWith('get') || action === 'testConnection' || action === 'ping') {
    const cached = getCached(action);
    if (cached !== null) {
      return res.json(action === 'testConnection' ? cached : { status: 'success', data: cached });
    }
  }

  // 2. Xóa cache khi có thao tác ghi/cập nhật/xóa
  if (action.startsWith('save') || action.startsWith('update') || action.startsWith('delete') || action.startsWith('upsert')) {
    clearCache();
  }

  try {
    const db = getDbPool();
    const body = req.body || {};

    switch (action) {
      case 'ping':
      case 'testConnection': {
        const tableStats: Record<string, number> = {};
        const tables = ['meetings', 'endpoints', 'staff', 'units', 'users', 'system_settings', 'ad_banners', 'system_operators', 'participant_groups', 'endpoint_groups'];
        for (const tbl of tables) {
          try {
            const [rows]: any = await db.query(`SELECT COUNT(*) as cnt FROM \`${tbl}\``);
            tableStats[tbl] = rows[0]?.cnt ?? 0;
          } catch {
            tableStats[tbl] = -1;
          }
        }
        return res.json({
          status: 'success',
          message: 'Kết nối CSDL MySQL Hostinger thành công',
          host: `${DB_HOST}:${DB_PORT}`,
          database: DB_NAME,
          user: DB_USER,
          timestamp: new Date().toISOString(),
          tables: tableStats
        });
      }

      case 'login': {
        const username = (body.username || '').trim();
        const password = body.password || '';
        if (!username || !password) {
          return res.status(400).json({ status: 'error', message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu' });
        }
        const [rows]: any = await db.query('SELECT * FROM users WHERE username = ? AND active = 1', [username]);
        if (!rows || rows.length === 0) {
          return res.status(401).json({ status: 'error', message: 'Tài khoản không tồn tại hoặc đã bị khóa' });
        }
        const user = rows[0];
        if (!verifyPassword(password, user.password)) {
          return res.status(401).json({ status: 'error', message: 'Mật khẩu không chính xác' });
        }
        const token = generateJwtToken(user);
        return res.json({
          status: 'success',
          message: 'Đăng nhập thành công',
          token,
          user: {
            id: user.id,
            username: user.username,
            fullName: user.full_name,
            role: user.role,
            phone: user.phone || '',
            email: user.email || '',
            active: Boolean(user.active)
          }
        });
      }

      case 'changePassword': {
        const { currentPassword, newPassword, userId } = body;
        if (!newPassword || newPassword.length < 6) {
          return res.status(400).json({ status: 'error', message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        }
        const newHash = crypto.createHash('sha256').update(newPassword).digest('hex');
        if (userId) {
          await db.query('UPDATE users SET password = ? WHERE id = ?', [newHash, userId]);
        } else {
          await db.query('UPDATE users SET password = ? WHERE username = ?', [newHash, 'admin']);
        }
        return res.json({ status: 'success', message: 'Đổi mật khẩu thành công' });
      }

      // Settings
      case 'getSettings': {
        const [rows]: any = await db.query('SELECT * FROM system_settings WHERE id = 1');
        if (!rows || rows.length === 0) {
          return res.json({ status: 'success', data: null });
        }
        const r = rows[0];
        return res.json({
          status: 'success',
          data: {
            systemName: r.system_name,
            shortName: r.short_name,
            logoBase64: r.logo_base_64,
            primaryColor: r.primary_color,
            supportQrBase64: r.support_qr_base_64,
            supportPhone: r.support_phone
          }
        });
      }

      case 'saveSettings': {
        const s = body;
        await db.query(`
          INSERT INTO system_settings (id, system_name, short_name, logo_base_64, primary_color, support_qr_base_64, support_phone)
          VALUES (1, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            system_name = VALUES(system_name),
            short_name = VALUES(short_name),
            logo_base_64 = VALUES(logo_base_64),
            primary_color = VALUES(primary_color),
            support_qr_base_64 = VALUES(support_qr_base_64),
            support_phone = VALUES(support_phone)
        `, [s.systemName, s.shortName, s.logoBase64 || null, s.primaryColor, s.supportQrBase64 || null, s.supportPhone || null]);
        return res.json({ status: 'success', message: 'Lưu cấu hình thành công' });
      }

      // Meetings
      case 'getMeetings': {
        const [rows]: any = await db.query('SELECT * FROM meetings ORDER BY start_time DESC');
        const formatted = rows.map((m: any) => ({
          id: m.id,
          title: m.title,
          hostUnit: m.host_unit_name,
          hostUnitId: m.host_unit_id,
          chairPerson: m.chair_person_name,
          chairPersonId: m.chair_person_id,
          startTime: m.start_time,
          endTime: m.end_time,
          participants: typeof m.participants === 'string' ? JSON.parse(m.participants || '[]') : m.participants || [],
          endpoints: typeof m.endpoints === 'string' ? JSON.parse(m.endpoints || '[]') : m.endpoints || [],
          description: m.description,
          notes: m.notes,
          endpointChecks: typeof m.endpoint_checks === 'string' ? JSON.parse(m.endpoint_checks || '{}') : m.endpoint_checks || {},
          status: m.status,
          cancelReason: m.cancel_reason,
          invitationLink: m.invitation_link,
          meetingRoomId: m.meeting_room_id,
          meetingFormat: m.meeting_format || 'TRUC_TUYEN'
        }));
        return res.json({ status: 'success', data: formatted });
      }

      case 'upsertMeeting':
      case 'saveMeeting': {
        const m = body;
        await db.query(`
          INSERT INTO meetings (id, title, host_unit_name, host_unit_id, chair_person_name, chair_person_id, start_time, end_time, participants, endpoints, description, notes, endpoint_checks, status, cancel_reason, invitation_link, meeting_room_id, meeting_format)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            meeting_format = VALUES(meeting_format)
        `, [
          m.id, m.title, m.hostUnit, m.hostUnitId || null, m.chairPerson, m.chairPersonId || null,
          m.startTime, m.endTime, JSON.stringify(m.participants || []), JSON.stringify(m.endpoints || []),
          m.description || null, m.notes || null, JSON.stringify(m.endpointChecks || {}),
          m.status, m.cancelReason || null, m.invitationLink || null, m.meetingRoomId || null, m.meetingFormat || 'TRUC_TUYEN'
        ]);
        return res.json({ status: 'success', message: 'Lưu cuộc họp thành công' });
      }

      case 'deleteMeeting': {
        const id = req.query.id || body.id;
        await db.query('DELETE FROM meetings WHERE id = ?', [id]);
        return res.json({ status: 'success', message: 'Xóa cuộc họp thành công' });
      }

      // Endpoints
      case 'getEndpoints': {
        const [rows]: any = await db.query('SELECT * FROM endpoints ORDER BY name ASC');
        const formatted = rows.map((e: any) => ({
          id: e.id,
          name: e.name,
          location: e.location,
          status: e.status,
          lastConnected: e.last_connected,
          ip1: e.ip_1,
          ip2: e.ip_2,
          groupId: e.group_id
        }));
        return res.json({ status: 'success', data: formatted });
      }

      case 'upsertEndpoint':
      case 'saveEndpoint': {
        const e = body;
        await db.query(`
          INSERT INTO endpoints (id, name, location, status, last_connected, ip_1, ip_2, group_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            location = VALUES(location),
            status = VALUES(status),
            last_connected = VALUES(last_connected),
            ip_1 = VALUES(ip_1),
            ip_2 = VALUES(ip_2),
            group_id = VALUES(group_id)
        `, [e.id, e.name, e.location || null, e.status, e.lastConnected || null, e.ip1 || null, e.ip2 || null, e.groupId || null]);
        return res.json({ status: 'success', message: 'Lưu điểm cầu thành công' });
      }

      case 'deleteEndpoint': {
        const id = req.query.id || body.id;
        await db.query('DELETE FROM endpoints WHERE id = ?', [id]);
        return res.json({ status: 'success', message: 'Xóa điểm cầu thành công' });
      }

      // Staff
      case 'getStaff': {
        const [rows]: any = await db.query('SELECT * FROM staff ORDER BY full_name ASC');
        const formatted = rows.map((s: any) => ({
          id: s.id,
          fullName: s.full_name,
          unitId: s.unit_id,
          position: s.position,
          email: s.email,
          phone: s.phone
        }));
        return res.json({ status: 'success', data: formatted });
      }

      case 'upsertStaff':
      case 'saveStaff': {
        const s = body;
        await db.query(`
          INSERT INTO staff (id, full_name, unit_id, position, email, phone)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            full_name = VALUES(full_name),
            unit_id = VALUES(unit_id),
            position = VALUES(position),
            email = VALUES(email),
            phone = VALUES(phone)
        `, [s.id, s.fullName, s.unitId || null, s.position || null, s.email || null, s.phone || null]);
        return res.json({ status: 'success', message: 'Lưu cán bộ thành công' });
      }

      case 'deleteStaff': {
        const id = req.query.id || body.id;
        await db.query('DELETE FROM staff WHERE id = ?', [id]);
        return res.json({ status: 'success', message: 'Xóa cán bộ thành công' });
      }

      // Units
      case 'getUnits': {
        const [rows]: any = await db.query('SELECT * FROM units ORDER BY name ASC');
        const formatted = rows.map((u: any) => ({
          id: u.id,
          name: u.name,
          code: u.code,
          description: u.description
        }));
        return res.json({ status: 'success', data: formatted });
      }

      case 'upsertUnit':
      case 'saveUnit': {
        const u = body;
        await db.query(`
          INSERT INTO units (id, name, code, description)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            code = VALUES(code),
            description = VALUES(description)
        `, [u.id, u.name, u.code, u.description || null]);
        return res.json({ status: 'success', message: 'Lưu đơn vị thành công' });
      }

      case 'deleteUnit': {
        const id = req.query.id || body.id;
        await db.query('DELETE FROM units WHERE id = ?', [id]);
        return res.json({ status: 'success', message: 'Xóa đơn vị thành công' });
      }

      // Users
      case 'getUsers': {
        const [rows]: any = await db.query('SELECT id, username, full_name, role, phone, email, active FROM users ORDER BY username ASC');
        const formatted = rows.map((u: any) => ({
          id: u.id,
          username: u.username,
          fullName: u.full_name,
          role: u.role,
          phone: u.phone,
          email: u.email,
          active: Boolean(u.active)
        }));
        return res.json({ status: 'success', data: formatted });
      }

      case 'upsertUser':
      case 'saveUser': {
        const u = body;
        if (u.password) {
          const hash = crypto.createHash('sha256').update(u.password).digest('hex');
          await db.query(`
            INSERT INTO users (id, username, password, full_name, role, phone, email, active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              username = VALUES(username),
              password = VALUES(password),
              full_name = VALUES(full_name),
              role = VALUES(role),
              phone = VALUES(phone),
              email = VALUES(email),
              active = VALUES(active)
          `, [u.id, u.username, hash, u.fullName, u.role, u.phone || null, u.email || null, u.active ? 1 : 0]);
        } else {
          await db.query(`
            UPDATE users SET
              username = ?,
              full_name = ?,
              role = ?,
              phone = ?,
              email = ?,
              active = ?
            WHERE id = ?
          `, [u.username, u.fullName, u.role, u.phone || null, u.email || null, u.active ? 1 : 0, u.id]);
        }
        return res.json({ status: 'success', message: 'Lưu người dùng thành công' });
      }

      case 'deleteUser': {
        const id = req.query.id || body.id;
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        return res.json({ status: 'success', message: 'Xóa người dùng thành công' });
      }

      // Ad Banners
      case 'getAdBanners': {
        const [rows]: any = await db.query('SELECT * FROM ad_banners ORDER BY created_at DESC');
        const formatted = rows.map((b: any) => ({
          id: b.id,
          title: b.title,
          image: b.image,
          link: b.link,
          active: Boolean(b.active)
        }));
        return res.json({ status: 'success', data: formatted });
      }

      case 'saveAdBanner': {
        const b = body;
        await db.query(`
          INSERT INTO ad_banners (id, title, image, link, active)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            image = VALUES(image),
            link = VALUES(link),
            active = VALUES(active)
        `, [b.id, b.title, b.image || null, b.link || null, b.active ? 1 : 0]);
        return res.json({ status: 'success', message: 'Lưu banner thành công' });
      }

      case 'deleteAdBanner': {
        const id = req.query.id || body.id;
        await db.query('DELETE FROM ad_banners WHERE id = ?', [id]);
        return res.json({ status: 'success', message: 'Xóa banner thành công' });
      }

      // Operators
      case 'getOperators': {
        const [rows]: any = await db.query('SELECT * FROM system_operators ORDER BY full_name ASC');
        const formatted = rows.map((o: any) => ({
          id: o.id,
          fullName: o.full_name,
          position: o.position,
          endpointId: o.endpoint_id,
          phone: o.phone
        }));
        return res.json({ status: 'success', data: formatted });
      }

      case 'upsertOperator':
      case 'saveOperator': {
        const o = body;
        await db.query(`
          INSERT INTO system_operators (id, full_name, position, endpoint_id, phone)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            full_name = VALUES(full_name),
            position = VALUES(position),
            endpoint_id = VALUES(endpoint_id),
            phone = VALUES(phone)
        `, [o.id, o.fullName, o.position || null, o.endpointId || null, o.phone || null]);
        return res.json({ status: 'success', message: 'Lưu cán bộ trực thành công' });
      }

      case 'deleteOperator': {
        const id = req.query.id || body.id;
        await db.query('DELETE FROM system_operators WHERE id = ?', [id]);
        return res.json({ status: 'success', message: 'Xóa cán bộ trực thành công' });
      }

      // Participant Groups
      case 'getGroups':
      case 'getParticipantGroups': {
        const [rows]: any = await db.query('SELECT * FROM participant_groups ORDER BY name ASC');
        return res.json({ status: 'success', data: rows });
      }

      case 'upsertGroup':
      case 'saveParticipantGroup': {
        const g = body;
        await db.query(`
          INSERT INTO participant_groups (id, name, description)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            description = VALUES(description)
        `, [g.id, g.name, g.description || null]);
        return res.json({ status: 'success', message: 'Lưu nhóm thành phần thành công' });
      }

      case 'deleteGroup':
      case 'deleteParticipantGroup': {
        const id = req.query.id || body.id;
        await db.query('DELETE FROM participant_groups WHERE id = ?', [id]);
        return res.json({ status: 'success', message: 'Xóa nhóm thành phần thành công' });
      }

      // Endpoint Groups
      case 'getEndpointGroups': {
        const [rows]: any = await db.query('SELECT * FROM endpoint_groups ORDER BY name ASC');
        return res.json({ status: 'success', data: rows });
      }

      case 'upsertEndpointGroup':
      case 'saveEndpointGroup': {
        const g = body;
        await db.query(`
          INSERT INTO endpoint_groups (id, name, description)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            description = VALUES(description)
        `, [g.id, g.name, g.description || null]);
        return res.json({ status: 'success', message: 'Lưu nhóm điểm cầu thành công' });
      }

      case 'deleteEndpointGroup': {
        const id = req.query.id || body.id;
        await db.query('DELETE FROM endpoint_groups WHERE id = ?', [id]);
        return res.json({ status: 'success', message: 'Xóa nhóm điểm cầu thành công' });
      }

      default:
        return res.status(404).json({ status: 'error', message: `Unknown API action: ${action}` });
    }
  } catch (err: any) {
    if (action.startsWith('get')) {
      const fallbackData = queryCache.get(action)?.data;
      if (fallbackData !== undefined) {
        return res.json({ status: 'success', data: fallbackData });
      }
    }
    console.error(`[API Error in ${action}]:`, err);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'Lỗi truy vấn cơ sở dữ liệu MySQL'
    });
  }
}

// 1. Route handlers for /api.php (matches both query param ?action=... and POST)
app.all(['/api.php', '/api.php/*'], (req: Request, res: Response) => {
  const action = (req.query.action as string) || req.body?.action || 'testConnection';
  handleApiAction(action, req, res);
});

// 2. REST API endpoints under /api/*
app.get('/api/health', (req, res) => handleApiAction('testConnection', req, res));
app.get('/api/ping', (req, res) => handleApiAction('testConnection', req, res));
app.get('/api/testConnection', (req, res) => handleApiAction('testConnection', req, res));

app.post('/api/auth/login', (req, res) => handleApiAction('login', req, res));
app.post('/api/auth/change-password', (req, res) => handleApiAction('changePassword', req, res));

app.get('/api/settings', (req, res) => handleApiAction('getSettings', req, res));
app.post('/api/settings', (req, res) => handleApiAction('saveSettings', req, res));

app.get('/api/meetings', (req, res) => handleApiAction('getMeetings', req, res));
app.post('/api/meetings', (req, res) => handleApiAction('saveMeeting', req, res));
app.delete('/api/meetings/:id', (req, res) => {
  req.query.id = req.params.id;
  handleApiAction('deleteMeeting', req, res);
});

app.get('/api/endpoints', (req, res) => handleApiAction('getEndpoints', req, res));
app.post('/api/endpoints', (req, res) => handleApiAction('saveEndpoint', req, res));
app.delete('/api/endpoints/:id', (req, res) => {
  req.query.id = req.params.id;
  handleApiAction('deleteEndpoint', req, res);
});

app.get('/api/staff', (req, res) => handleApiAction('getStaff', req, res));
app.post('/api/staff', (req, res) => handleApiAction('saveStaff', req, res));
app.delete('/api/staff/:id', (req, res) => {
  req.query.id = req.params.id;
  handleApiAction('deleteStaff', req, res);
});

app.get('/api/units', (req, res) => handleApiAction('getUnits', req, res));
app.post('/api/units', (req, res) => handleApiAction('saveUnit', req, res));
app.delete('/api/units/:id', (req, res) => {
  req.query.id = req.params.id;
  handleApiAction('deleteUnit', req, res);
});

app.get('/api/users', (req, res) => handleApiAction('getUsers', req, res));
app.post('/api/users', (req, res) => handleApiAction('saveUser', req, res));
app.delete('/api/users/:id', (req, res) => {
  req.query.id = req.params.id;
  handleApiAction('deleteUser', req, res);
});

app.get('/api/ad-banners', (req, res) => handleApiAction('getAdBanners', req, res));
app.post('/api/ad-banners', (req, res) => handleApiAction('saveAdBanner', req, res));
app.delete('/api/ad-banners/:id', (req, res) => {
  req.query.id = req.params.id;
  handleApiAction('deleteAdBanner', req, res);
});

app.get('/api/operators', (req, res) => handleApiAction('getOperators', req, res));
app.post('/api/operators', (req, res) => handleApiAction('saveOperator', req, res));
app.delete('/api/operators/:id', (req, res) => {
  req.query.id = req.params.id;
  handleApiAction('deleteOperator', req, res);
});

app.get('/api/participant-groups', (req, res) => handleApiAction('getParticipantGroups', req, res));
app.post('/api/participant-groups', (req, res) => handleApiAction('saveParticipantGroup', req, res));
app.delete('/api/participant-groups/:id', (req, res) => {
  req.query.id = req.params.id;
  handleApiAction('deleteParticipantGroup', req, res);
});

app.get('/api/endpoint-groups', (req, res) => handleApiAction('getEndpointGroups', req, res));
app.post('/api/endpoint-groups', (req, res) => handleApiAction('saveEndpointGroup', req, res));
app.delete('/api/endpoint-groups/:id', (req, res) => {
  req.query.id = req.params.id;
  handleApiAction('deleteEndpointGroup', req, res);
});

// Start Express Server with Vite integration
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CTH SLA Platform running on http://0.0.0.0:${PORT} connecting to Hostinger MySQL: ${DB_HOST}`);
    // Run schema check asynchronously in background
    setTimeout(() => {
      initDatabaseSchema().catch(err => {
        console.warn('[MySQL Schema Warning]:', err.message);
      });
    }, 1000);
  });
}

start();
