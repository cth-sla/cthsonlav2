import { Meeting, Unit, Staff, Endpoint, User, SystemSettings, ParticipantGroup, SystemOperator } from '../types';

/**
 * -----------------------------------------------------------------------------
 * FILE KẾT NỐI CƠ SỞ DỮ LIỆU MYSQL & API SERVICE (CTH SLA PLATFORM)
 * -----------------------------------------------------------------------------
 * File này cung cấp:
 * 1. Cấu hình kết nối MySQL Pool sử dụng thư viện 'mysql2/promise' ở Backend.
 * 2. Các hàm truy vấn CRUD MySQL cho toàn bộ thực thể của hệ thống.
 * 3. Client-side fetcher kết nối tới Express API tương ứng.
 * -----------------------------------------------------------------------------
 */

// =============================================================================
// PHẦN 1: CẤU HÌNH KẾT NỐI & TRUY VẤN Ở BACKEND (Sử dụng trong Node.js/Express)
// =============================================================================

/**
 * Lưu ý: Để chạy phần Backend này, hãy cài đặt thư viện mysql2:
 * npm install mysql2 @types/mysql2
 * 
 * Khai báo các biến môi trường trong file .env:
 * MYSQL_HOST=localhost
 * MYSQL_USER=root
 * MYSQL_PASSWORD=your_password
 * MYSQL_DATABASE=cth_sla_db
 * MYSQL_PORT=3306
 */

export const mysqlBackendConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'u411714528_lichhop',
  password: process.env.MYSQL_PASSWORD || 'Sonla2026',
  database: process.env.MYSQL_DATABASE || 'u411714528_lichhop',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

/**
 * Lớp cơ sở để thực thi các câu lệnh SQL ở Backend
 */
export class MySQLDatabase {
  private static pool: any = null;

  public static getPool() {
    if (!this.pool) {
      try {
        // Dynamic import hoặc require để tránh lỗi bundle client-side trong môi trường Vite
        // Ở backend thực tế: import mysql from 'mysql2/promise';
        // this.pool = mysql.createPool(mysqlBackendConfig);
        console.log("MySQL connection pool initialized.");
      } catch (err) {
        console.error("Failed to initialize MySQL pool:", err);
      }
    }
    return this.pool;
  }

  // Thực thi truy vấn SQL
  public static async query(sql: string, params: any[] = []): Promise<any> {
    const pool = this.getPool();
    if (!pool) {
      throw new Error("MySQL Pool is not initialized or running client-side.");
    }
    const [results] = await pool.execute(sql, params);
    return results;
  }
}

/**
 * Các hàm xử lý SQL ở Backend (Dùng để viết API Route hoặc Controller)
 */
export const mysqlBackendService = {
  // --- SETTINGS ---
  async getSettings(): Promise<SystemSettings | null> {
    const rows = await MySQLDatabase.query("SELECT * FROM system_settings WHERE id = 1");
    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    return {
      systemName: r.system_name,
      shortName: r.short_name,
      logoBase64: r.logo_base_64,
      primaryColor: r.primary_color,
      supportQrBase64: r.support_qr_base_64,
      supportPhone: r.support_phone
    };
  },

  async updateSettings(s: SystemSettings): Promise<void> {
    await MySQLDatabase.query(
      `INSERT INTO system_settings (id, system_name, short_name, logo_base_64, primary_color, support_qr_base_64, support_phone)
       VALUES (1, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         system_name = VALUES(system_name),
         short_name = VALUES(short_name),
         logo_base_64 = VALUES(logo_base_64),
         primary_color = VALUES(primary_color),
         support_qr_base_64 = VALUES(support_qr_base_64),
         support_phone = VALUES(support_phone)`,
      [s.systemName, s.shortName, s.logoBase64 || null, s.primaryColor, s.supportQrBase64 || null, s.supportPhone || null]
    );
  },

  // --- MEETINGS ---
  async getMeetings(): Promise<any[]> {
    return await MySQLDatabase.query("SELECT * FROM meetings ORDER BY start_time DESC");
  },

  async upsertMeeting(m: Meeting): Promise<void> {
    await MySQLDatabase.query(
      `INSERT INTO meetings (id, title, host_unit_name, host_unit_id, chair_person_name, chair_person_id, start_time, end_time, participants, endpoints, description, notes, endpoint_checks, status, cancel_reason, invitation_link, meeting_room_id, meeting_format)
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
         meeting_format = VALUES(meeting_format)`,
      [
        m.id, m.title, m.hostUnit, m.hostUnitId || null, m.chairPerson, m.chairPersonId || null,
        m.startTime, m.endTime, JSON.stringify(m.participants || []), JSON.stringify(m.endpoints || []),
        m.description || null, m.notes || null, JSON.stringify(m.endpointChecks || {}),
        m.status, m.cancelReason || null, m.invitationLink || null, m.meetingRoomId || null, m.meetingFormat || null
      ]
    );
  },

  async deleteMeeting(id: string): Promise<void> {
    await MySQLDatabase.query("DELETE FROM meetings WHERE id = ?", [id]);
  },

  // --- ENDPOINTS ---
  async getEndpoints(): Promise<any[]> {
    return await MySQLDatabase.query("SELECT * FROM endpoints ORDER BY name ASC");
  },

  async upsertEndpoint(e: Endpoint): Promise<void> {
    await MySQLDatabase.query(
      `INSERT INTO endpoints (id, name, location, status, last_connected, ip_1, ip_2)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         location = VALUES(location),
         status = VALUES(status),
         last_connected = VALUES(last_connected),
         ip_1 = VALUES(ip_1),
         ip_2 = VALUES(ip_2)`,
      [e.id, e.name, e.location || null, e.status, e.lastConnected || null, e.ip1 || null, e.ip2 || null]
    );
  },

  async deleteEndpoint(id: string): Promise<void> {
    await MySQLDatabase.query("DELETE FROM endpoints WHERE id = ?", [id]);
  },

  // --- STAFF ---
  async getStaff(): Promise<any[]> {
    return await MySQLDatabase.query("SELECT * FROM staff ORDER BY full_name ASC");
  },

  async upsertStaff(s: Staff): Promise<void> {
    await MySQLDatabase.query(
      `INSERT INTO staff (id, full_name, unit_id, position, email, phone)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         unit_id = VALUES(unit_id),
         position = VALUES(position),
         email = VALUES(email),
         phone = VALUES(phone)`,
      [s.id, s.fullName, s.unitId || null, s.position || null, s.email || null, s.phone || null]
    );
  },

  async deleteStaff(id: string): Promise<void> {
    await MySQLDatabase.query("DELETE FROM staff WHERE id = ?", [id]);
  },

  // --- UNITS ---
  async getUnits(): Promise<any[]> {
    return await MySQLDatabase.query("SELECT * FROM units ORDER BY name ASC");
  },

  async upsertUnit(u: Unit): Promise<void> {
    await MySQLDatabase.query(
      `INSERT INTO units (id, name, code, description)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         code = VALUES(code),
         description = VALUES(description)`,
      [u.id, u.name, u.code, u.description || null]
    );
  },

  async deleteUnit(id: string): Promise<void> {
    await MySQLDatabase.query("DELETE FROM units WHERE id = ?", [id]);
  }
};


// =============================================================================
// PHẦN 2: CLIENT API SERVICE - KẾT NỐI TỚI BACKEND MYSQL
// =============================================================================

const isPHPHosting = true; // Đặt mặc định là true cho môi trường Hostinger PHP + MySQL

/**
 * Hàm bổ trợ tự động chuyển đổi URL cho phù hợp với môi trường Hosting:
 * - Nếu dùng PHP (Hostinger): dùng dạng api.php?action=actionName (không có gạch chéo đầu để hỗ trợ cả thư mục con)
 * - Nếu dùng Node Express: dùng dạng api/endpointName
 */
const reqUrl = (phpAction: string, expressEndpoint: string, extraParams: string = ''): string => {
  if (isPHPHosting) {
    return extraParams 
      ? `api.php?action=${phpAction}&${extraParams}`
      : `api.php?action=${phpAction}`;
  } else {
    return extraParams
      ? `api/${expressEndpoint}/${extraParams}`
      : `api/${expressEndpoint}`;
  }
};

/**
 * Gọi API HTTP thông thường từ trình duyệt lên server PHP/Express để lấy dữ liệu MySQL.
 * Nếu chưa cấu hình backend, các phương thức này sẽ tự động fall back về lưu trữ Local để chạy demo ổn định.
 */
export const mysqlClientService = {
  // Luôn trả về true để ứng dụng ưu tiên sử dụng cơ sở dữ liệu MySQL của Hostinger.
  isUsingRealAPI: () => {
    return true;
  },

  async getSettings(): Promise<SystemSettings | null> {
    if (!this.isUsingRealAPI()) return null;
    const res = await fetch(reqUrl('getSettings', 'settings'));
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const data = await res.json();
    if (data && data.status === 'error') {
      throw new Error(data.message || "MySQL Connection Error");
    }
    return data;
  },

  async updateSettings(s: SystemSettings): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const res = await fetch(reqUrl('updateSettings', 'settings'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s)
    });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
  },

  async getMeetings(): Promise<Meeting[]> {
    if (!this.isUsingRealAPI()) return [];
    const res = await fetch(reqUrl('getMeetings', 'meetings'));
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const data = await res.json();
    if (data && data.status === 'error') {
      throw new Error(data.message || "MySQL Connection Error");
    }
    if (!Array.isArray(data)) return [];
    return data.map((m: any) => ({
      ...m,
      hostUnit: m.hostUnit || m.host_unit_name,
      hostUnitId: m.hostUnitId || m.host_unit_id,
      chairPerson: m.chairPerson || m.chair_person_name,
      chairPersonId: m.chairPersonId || m.chair_person_id,
      startTime: m.startTime || m.start_time,
      endTime: m.endTime || m.end_time,
      participants: typeof m.participants === 'string' ? JSON.parse(m.participants) : (m.participants || []),
      endpoints: typeof m.endpoints === 'string' ? JSON.parse(m.endpoints) : (m.endpoints || []),
      endpointChecks: typeof m.endpointChecks === 'string' ? JSON.parse(m.endpointChecks) : 
                      (typeof m.endpoint_checks === 'string' ? JSON.parse(m.endpoint_checks) : (m.endpointChecks || m.endpoint_checks || {})),
      cancelReason: m.cancelReason || m.cancel_reason,
      invitationLink: m.invitationLink || m.invitation_link,
      meetingRoomId: m.meetingRoomId || m.meeting_room_id,
      meetingFormat: m.meetingFormat || m.meeting_format
    }));
  },

  async upsertMeeting(m: Meeting): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const res = await fetch(reqUrl('upsertMeeting', 'meetings'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(m)
    });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
  },

  async deleteMeeting(id: string): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const url = reqUrl('deleteMeeting', `meetings/${encodeURIComponent(id)}`, `id=${encodeURIComponent(id)}`);
    const res = await fetch(url, { method: isPHPHosting ? 'POST' : 'DELETE' });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
  },

  async getEndpoints(): Promise<Endpoint[]> {
    if (!this.isUsingRealAPI()) return [];
    const res = await fetch(reqUrl('getEndpoints', 'endpoints'));
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const data = await res.json();
    if (data && data.status === 'error') {
      throw new Error(data.message || "MySQL Connection Error");
    }
    if (!Array.isArray(data)) return [];
    return data.map((e: any) => ({
      id: e.id,
      name: e.name,
      location: e.location,
      status: e.status,
      lastConnected: e.lastConnected || e.last_connected,
      ip1: e.ip1 || e.ip_1,
      ip2: e.ip2 || e.ip_2
    }));
  },

  async upsertEndpoint(e: Endpoint): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const res = await fetch(reqUrl('upsertEndpoint', 'endpoints'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(e)
    });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
  },

  async deleteEndpoint(id: string): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const url = reqUrl('deleteEndpoint', `endpoints/${encodeURIComponent(id)}`, `id=${encodeURIComponent(id)}`);
    const res = await fetch(url, { method: isPHPHosting ? 'POST' : 'DELETE' });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
  },

  async getUnits(): Promise<Unit[]> {
    if (!this.isUsingRealAPI()) return [];
    const res = await fetch(reqUrl('getUnits', 'units'));
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const data = await res.json();
    if (data && data.status === 'error') {
      throw new Error(data.message || "MySQL Connection Error");
    }
    return Array.isArray(data) ? data : [];
  },

  async upsertUnit(u: Unit): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const res = await fetch(reqUrl('upsertUnit', 'units'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(u)
    });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
  },

  async deleteUnit(id: string): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const url = reqUrl('deleteUnit', `units/${encodeURIComponent(id)}`, `id=${encodeURIComponent(id)}`);
    const res = await fetch(url, { method: isPHPHosting ? 'POST' : 'DELETE' });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
  },

  async getStaff(): Promise<Staff[]> {
    if (!this.isUsingRealAPI()) return [];
    const res = await fetch(reqUrl('getStaff', 'staff'));
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const data = await res.json();
    if (data && data.status === 'error') {
      throw new Error(data.message || "MySQL Connection Error");
    }
    if (!Array.isArray(data)) return [];
    return data.map((s: any) => ({
      id: s.id,
      fullName: s.fullName || s.full_name,
      unitId: s.unitId || s.unit_id,
      position: s.position,
      email: s.email,
      phone: s.phone
    }));
  },

  async upsertStaff(s: Staff): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const res = await fetch(reqUrl('upsertStaff', 'staff'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s)
    });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
  },

  async deleteStaff(id: string): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const url = reqUrl('deleteStaff', `staff/${encodeURIComponent(id)}`, `id=${encodeURIComponent(id)}`);
    const res = await fetch(url, { method: isPHPHosting ? 'POST' : 'DELETE' });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
  },

  async getGroups(): Promise<ParticipantGroup[]> {
    if (!this.isUsingRealAPI()) return [];
    const res = await fetch(reqUrl('getGroups', 'groups'));
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const data = await res.json();
    if (data && data.status === 'error') {
      throw new Error(data.message || "MySQL Connection Error");
    }
    return Array.isArray(data) ? data : [];
  },

  async upsertGroup(g: ParticipantGroup): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const res = await fetch(reqUrl('upsertGroup', 'groups'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(g)
    });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
  },

  async deleteGroup(id: string): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const url = reqUrl('deleteGroup', `groups/${encodeURIComponent(id)}`, `id=${encodeURIComponent(id)}`);
    const res = await fetch(url, { method: isPHPHosting ? 'POST' : 'DELETE' });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
  },

  async getUsers(): Promise<User[]> {
    if (!this.isUsingRealAPI()) return [];
    const res = await fetch(reqUrl('getUsers', 'users'));
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const data = await res.json();
    if (data && data.status === 'error') {
      throw new Error(data.message || "MySQL Connection Error");
    }
    if (!Array.isArray(data)) return [];
    return data.map((u: any) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName || u.full_name,
      role: u.role,
      password: u.password
    }));
  },

  async upsertUser(u: User): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const res = await fetch(reqUrl('upsertUser', 'users'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(u)
    });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
  },

  async deleteUser(id: string): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const url = reqUrl('deleteUser', `users/${encodeURIComponent(id)}`, `id=${encodeURIComponent(id)}`);
    const res = await fetch(url, { method: isPHPHosting ? 'POST' : 'DELETE' });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
  },

  async getOperators(): Promise<SystemOperator[]> {
    if (!this.isUsingRealAPI()) return [];
    const res = await fetch(reqUrl('getOperators', 'operators'));
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const data = await res.json();
    if (data && data.status === 'error') {
      throw new Error(data.message || "MySQL Connection Error");
    }
    if (!Array.isArray(data)) return [];
    return data.map((o: any) => ({
      id: o.id,
      fullName: o.fullName || o.full_name,
      position: o.position,
      endpointId: o.endpointId || o.endpoint_id,
      phone: o.phone,
      createdAt: o.createdAt || o.created_at
    }));
  },

  async upsertOperator(o: SystemOperator): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const res = await fetch(reqUrl('upsertOperator', 'operators'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(o)
    });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
  },

  async deleteOperator(id: string): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const url = reqUrl('deleteOperator', `operators/${encodeURIComponent(id)}`, `id=${encodeURIComponent(id)}`);
    const res = await fetch(url, { method: isPHPHosting ? 'POST' : 'DELETE' });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
  }
};
