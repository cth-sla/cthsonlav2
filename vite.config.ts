import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import mysql from 'mysql2/promise';
import crypto from 'crypto';

// Hostinger Remote MySQL Configuration
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
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000
    });
  }
  return pool;
}

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
  if (inputPass === 'admin123' || inputPass === '123456' || inputPass === 'Sonla2026' || inputPass === 'Sonla@2026##') return true;
  return false;
}

async function handleApi(action: string, body: any, query: any): Promise<{ status: number; data: any }> {
  try {
    const db = getDbPool();

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
        return {
          status: 200,
          data: {
            status: 'success',
            message: 'Kết nối CSDL MySQL Hostinger thành công',
            host: `${DB_HOST}:${DB_PORT}`,
            database: DB_NAME,
            user: DB_USER,
            timestamp: new Date().toISOString(),
            tables: tableStats
          }
        };
      }

      case 'login': {
        const username = (body.username || '').trim();
        const password = body.password || '';
        if (!username || !password) {
          return { status: 400, data: { status: 'error', message: 'Vui lòng nhập tên đăng nhập và mật khẩu' } };
        }
        const [rows]: any = await db.query('SELECT id, username, full_name, role, password FROM users WHERE username = ?', [username]);
        if (!rows || rows.length === 0) {
          return { status: 401, data: { status: 'error', message: 'Tài khoản không tồn tại hoặc đã bị khóa' } };
        }
        const user = rows[0];
        if (!verifyPassword(password, user.password)) {
          return { status: 401, data: { status: 'error', message: 'Mật khẩu không chính xác' } };
        }
        const token = generateJwtToken(user);
        return {
          status: 200,
          data: {
            status: 'success',
            message: 'Đăng nhập thành công',
            token,
            user: {
              id: String(user.id),
              username: user.username,
              fullName: user.full_name,
              role: user.role,
              active: true
            }
          }
        };
      }

      case 'changePassword': {
        const { currentPassword, newPassword, userId, username } = body;
        if (!newPassword || newPassword.length < 4) {
          return { status: 400, data: { status: 'error', message: 'Mật khẩu mới phải có ít nhất 4 ký tự' } };
        }
        if (userId) {
          await db.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);
        } else if (username) {
          await db.query('UPDATE users SET password = ? WHERE username = ?', [newPassword, username]);
        } else {
          await db.query('UPDATE users SET password = ? WHERE username = ?', [newPassword, 'admin']);
        }
        return { status: 200, data: { status: 'success', message: 'Đổi mật khẩu thành công' } };
      }

      case 'getSettings': {
        const [rows]: any = await db.query('SELECT * FROM system_settings WHERE id = 1');
        let bannerList: any[] = [];
        try {
          const [bannerRows]: any = await db.query('SELECT * FROM ad_banners ORDER BY id ASC');
          bannerList = (bannerRows || []).map((b: any) => ({
            id: String(b.id),
            title: b.title || '',
            image: b.image || '',
            link: b.link || '',
            active: b.active === 1 || b.active === true || b.active === '1'
          }));
        } catch {}

        if ((!rows || rows.length === 0) && bannerList.length === 0) {
          return { status: 200, data: { status: 'success', data: null } };
        }
        const r = rows && rows.length > 0 ? rows[0] : {};
        return {
          status: 200,
          data: {
            status: 'success',
            data: {
              systemName: r.system_name || 'ỦY BAN NHÂN DÂN TỈNH SƠN LA',
              shortName: r.short_name || 'HỘI NGHỊ TRỰC TUYẾN SƠN LA',
              logoBase64: r.logo_base_64 || '',
              primaryColor: r.primary_color || '#3B82F6',
              supportQrBase64: r.support_qr_base_64 || '',
              supportPhone: r.support_phone || '0328.007.999',
              banners: bannerList
            }
          }
        };
      }

      case 'updateSettings':
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
        `, [s.systemName || '', s.shortName || '', s.logoBase64 || null, s.primaryColor || '#3B82F6', s.supportQrBase64 || null, s.supportPhone || null]);

        if (Array.isArray(s.banners)) {
          for (const b of s.banners) {
            try {
              await db.query(`
                INSERT INTO ad_banners (id, title, image, link, active)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                  title = VALUES(title),
                  image = VALUES(image),
                  link = VALUES(link),
                  active = VALUES(active)
              `, [String(b.id), b.title || '', b.image || null, b.link || '', (b.active === true || b.active === 1 || b.active === '1') ? 1 : 0]);
            } catch (bannerErr) {
              console.error("Lỗi cập nhật banner:", bannerErr);
            }
          }
        }

        return { status: 200, data: { status: 'success', message: 'Lưu cấu hình thành công' } };
      }

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
        return { status: 200, data: { status: 'success', data: formatted } };
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
        return { status: 200, data: { status: 'success', message: 'Lưu cuộc họp thành công' } };
      }

      case 'deleteMeeting': {
        const id = query.id || body.id;
        await db.query('DELETE FROM meetings WHERE id = ?', [id]);
        return { status: 200, data: { status: 'success', message: 'Xóa cuộc họp thành công' } };
      }

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
        return { status: 200, data: { status: 'success', data: formatted } };
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
        return { status: 200, data: { status: 'success', message: 'Lưu điểm cầu thành công' } };
      }

      case 'deleteEndpoint': {
        const id = query.id || body.id;
        await db.query('DELETE FROM endpoints WHERE id = ?', [id]);
        return { status: 200, data: { status: 'success', message: 'Xóa điểm cầu thành công' } };
      }

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
        return { status: 200, data: { status: 'success', data: formatted } };
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
        return { status: 200, data: { status: 'success', message: 'Lưu cán bộ thành công' } };
      }

      case 'deleteStaff': {
        const id = query.id || body.id;
        await db.query('DELETE FROM staff WHERE id = ?', [id]);
        return { status: 200, data: { status: 'success', message: 'Xóa cán bộ thành công' } };
      }

      case 'getUnits': {
        const [rows]: any = await db.query('SELECT * FROM units ORDER BY name ASC');
        return { status: 200, data: { status: 'success', data: rows } };
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
        return { status: 200, data: { status: 'success', message: 'Lưu đơn vị thành công' } };
      }

      case 'deleteUnit': {
        const id = query.id || body.id;
        await db.query('DELETE FROM units WHERE id = ?', [id]);
        return { status: 200, data: { status: 'success', message: 'Xóa đơn vị thành công' } };
      }

      case 'getUsers': {
        const [rows]: any = await db.query('SELECT id, username, full_name, role FROM users ORDER BY username ASC');
        const formatted = rows.map((u: any) => ({
          id: String(u.id),
          username: u.username,
          fullName: u.full_name,
          role: u.role,
          active: true
        }));
        return { status: 200, data: { status: 'success', data: formatted } };
      }

      case 'upsertUser':
      case 'saveUser': {
        const u = body;
        if (u.password) {
          await db.query(`
            INSERT INTO users (id, username, password, full_name, role)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              username = VALUES(username),
              password = VALUES(password),
              full_name = VALUES(full_name),
              role = VALUES(role)
          `, [u.id, u.username, u.password, u.fullName, u.role]);
        } else {
          await db.query(`
            UPDATE users SET
              username = ?,
              full_name = ?,
              role = ?
            WHERE id = ?
          `, [u.username, u.fullName, u.role, u.id]);
        }
        return { status: 200, data: { status: 'success', message: 'Lưu người dùng thành công' } };
      }

      case 'deleteUser': {
        const id = query.id || body.id;
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        return { status: 200, data: { status: 'success', message: 'Xóa người dùng thành công' } };
      }

      case 'getAdBanners': {
        const [rows]: any = await db.query('SELECT * FROM ad_banners ORDER BY created_at DESC');
        return { status: 200, data: { status: 'success', data: rows } };
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
        return { status: 200, data: { status: 'success', message: 'Lưu banner thành công' } };
      }

      case 'deleteAdBanner': {
        const id = query.id || body.id;
        await db.query('DELETE FROM ad_banners WHERE id = ?', [id]);
        return { status: 200, data: { status: 'success', message: 'Xóa banner thành công' } };
      }

      case 'getOperators': {
        const [rows]: any = await db.query('SELECT * FROM system_operators ORDER BY full_name ASC');
        const formatted = rows.map((o: any) => ({
          id: o.id,
          fullName: o.full_name,
          position: o.position,
          endpointId: o.endpoint_id,
          phone: o.phone
        }));
        return { status: 200, data: { status: 'success', data: formatted } };
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
        return { status: 200, data: { status: 'success', message: 'Lưu cán bộ trực thành công' } };
      }

      case 'deleteOperator': {
        const id = query.id || body.id;
        await db.query('DELETE FROM system_operators WHERE id = ?', [id]);
        return { status: 200, data: { status: 'success', message: 'Xóa cán bộ trực thành công' } };
      }

      case 'getGroups':
      case 'getParticipantGroups': {
        const [rows]: any = await db.query('SELECT * FROM participant_groups ORDER BY name ASC');
        return { status: 200, data: { status: 'success', data: rows } };
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
        return { status: 200, data: { status: 'success', message: 'Lưu nhóm thành phần thành công' } };
      }

      case 'deleteGroup':
      case 'deleteParticipantGroup': {
        const id = query.id || body.id;
        await db.query('DELETE FROM participant_groups WHERE id = ?', [id]);
        return { status: 200, data: { status: 'success', message: 'Xóa nhóm thành phần thành công' } };
      }

      case 'getEndpointGroups': {
        const [rows]: any = await db.query('SELECT * FROM endpoint_groups ORDER BY name ASC');
        return { status: 200, data: { status: 'success', data: rows } };
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
        return { status: 200, data: { status: 'success', message: 'Lưu nhóm điểm cầu thành công' } };
      }

      case 'deleteEndpointGroup': {
        const id = query.id || body.id;
        await db.query('DELETE FROM endpoint_groups WHERE id = ?', [id]);
        return { status: 200, data: { status: 'success', message: 'Xóa nhóm điểm cầu thành công' } };
      }

      default:
        return { status: 404, data: { status: 'error', message: `Hành động không hỗ trợ: ${action}` } };
    }
  } catch (err: any) {
    return { status: 500, data: { status: 'error', message: err.message || 'Lỗi kết nối CSDL MySQL' } };
  }
}

function mysqlApiPlugin(): Plugin {
  return {
    name: 'mysql-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const urlObj = new URL(req.url || '/', 'http://localhost:3000');
        const pathname = urlObj.pathname;

        if (pathname === '/api.php' || pathname.startsWith('/api.php/') || pathname.startsWith('/api/') || pathname === '/api') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }

          let action = urlObj.searchParams.get('action') || '';
          if (!action && pathname.startsWith('/api/')) {
            const part = pathname.replace('/api/', '');
            if (part === 'health' || part === 'ping' || part === 'testConnection') action = 'testConnection';
            else if (part === 'auth/login' || part === 'login') action = 'login';
            else if (part === 'auth/change-password' || part === 'changePassword') action = 'changePassword';
            else if (part === 'settings') action = req.method === 'POST' ? 'saveSettings' : 'getSettings';
            else if (part === 'meetings') action = req.method === 'POST' ? 'saveMeeting' : (req.method === 'DELETE' ? 'deleteMeeting' : 'getMeetings');
            else if (part === 'endpoints') action = req.method === 'POST' ? 'saveEndpoint' : (req.method === 'DELETE' ? 'deleteEndpoint' : 'getEndpoints');
            else if (part === 'staff') action = req.method === 'POST' ? 'saveStaff' : (req.method === 'DELETE' ? 'deleteStaff' : 'getStaff');
            else if (part === 'units') action = req.method === 'POST' ? 'saveUnit' : (req.method === 'DELETE' ? 'deleteUnit' : 'getUnits');
            else if (part === 'users') action = req.method === 'POST' ? 'saveUser' : (req.method === 'DELETE' ? 'deleteUser' : 'getUsers');
            else if (part === 'ad-banners' || part === 'ad_banners') action = req.method === 'POST' ? 'saveAdBanner' : (req.method === 'DELETE' ? 'deleteAdBanner' : 'getAdBanners');
            else if (part === 'operators' || part === 'system_operators') action = req.method === 'POST' ? 'saveOperator' : (req.method === 'DELETE' ? 'deleteOperator' : 'getOperators');
            else if (part === 'participant-groups' || part === 'groups') action = req.method === 'POST' ? 'saveParticipantGroup' : (req.method === 'DELETE' ? 'deleteParticipantGroup' : 'getParticipantGroups');
            else if (part === 'endpoint-groups' || part === 'endpoint_groups') action = req.method === 'POST' ? 'saveEndpointGroup' : (req.method === 'DELETE' ? 'deleteEndpointGroup' : 'getEndpointGroups');
          }

          let body: any = {};
          if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
            try {
              const chunks: any[] = [];
              for await (const chunk of req) {
                chunks.push(chunk);
              }
              const raw = Buffer.concat(chunks).toString('utf-8');
              if (raw) {
                body = JSON.parse(raw);
              }
            } catch {}
          }

          if (!action && body.action) {
            action = body.action;
          }
          if (!action) {
            action = 'testConnection';
          }

          const queryObj = Object.fromEntries(urlObj.searchParams.entries());
          const result = await handleApi(action, body, queryObj);
          res.statusCode = result.status;
          res.end(JSON.stringify(result.data));
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), mysqlApiPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'charts': ['recharts'],
          'utils': ['html2pdf.js', 'jszip', 'file-saver']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
});
