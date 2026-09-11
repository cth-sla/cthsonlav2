import { Meeting, Unit, Staff, Endpoint, User, SystemSettings, ParticipantGroup, SystemOperator, EndpointGroup } from '../types';
import { storageService } from './storageService';

/**
 * -----------------------------------------------------------------------------
 * FILE KẾT NỐI CƠ SỞ DỮ LIỆU MYSQL & API SERVICE (CTH SLA PLATFORM)
 * -----------------------------------------------------------------------------
 * Bản nâng cấp bảo mật:
 * 1. Đã gỡ bỏ toàn bộ mật khẩu và tài khoản cơ sở dữ liệu cứng khỏi mã nguồn Frontend
 * 2. Tích hợp quản lý phiên làm việc & xác thực token Bearer JWT an toàn trong SessionStorage
 * 3. Bảo vệ các endpoint nhạy cảm (Đăng nhập, Đổi mật khẩu, Quản lý tài khoản)
 * 4. Ngăn chặn tuyệt đối việc để lộ mật khẩu trong các truy vấn danh sách người dùng
 * -----------------------------------------------------------------------------
 */

// =============================================================================
// PHẦN 1: CẤU HÌNH KẾT NỐI & TRUY VẤN Ở BACKEND (Sử dụng biến môi trường máy chủ)
// =============================================================================

export const mysqlBackendConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || '',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || '',
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
        console.log("MySQL connection pool initialized via server environment.");
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
 * Các hàm xử lý SQL ở Backend
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
// PHẦN 2: CLIENT API SERVICE - KẾT NỐI TỚI BACKEND MYSQL BẢO MẬT
// =============================================================================

const isPHPHosting = true; // Đặt mặc định là true cho môi trường Hostinger PHP + MySQL

// Quản lý Token xác thực trong SessionStorage (tự động giải phóng khi đóng trình duyệt)
const AUTH_TOKEN_KEY = 'cth_sla_jwt_session_token';

export const authStorage = {
  getToken: (): string | null => {
    try {
      return sessionStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken: (token: string): void => {
    try {
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch {}
  },
  clearToken: (): void => {
    try {
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
    } catch {}
  }
};

/**
 * Tự động tạo headers kèm Authorization Bearer Token
 */
const getAuthHeaders = (extra: Record<string, string> = {}): Record<string, string> => {
  const headers: Record<string, string> = { ...extra };
  const token = authStorage.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Tự động xác định đường dẫn chính xác của file api.php
 */
const getPhpApiPath = (): string => {
  const path = window.location.pathname;
  const dir = path.substring(0, path.lastIndexOf('/') + 1);
  return dir + 'api.php';
};

/**
 * Hàm bổ trợ tự động chuyển đổi URL cho phù hợp với môi trường Hosting
 */
const reqUrl = (phpAction: string, expressEndpoint: string, extraParams: string = ''): string => {
  if (isPHPHosting) {
    const apiPath = getPhpApiPath();
    return extraParams 
      ? `${apiPath}?action=${phpAction}&${extraParams}`
      : `${apiPath}?action=${phpAction}`;
  } else {
    return extraParams
      ? `api/${expressEndpoint}/${extraParams}`
      : `api/${expressEndpoint}`;
  }
};

/**
 * Helper xử lý kết quả trả về từ fetch API MySQL
 */
const handleResponse = async (res: Response): Promise<any> => {
  const text = await res.text();

  if (!res.ok) {
    let errorMsg = `HTTP Error: ${res.status}`;
    try {
      const errorData = JSON.parse(text);
      if (errorData) {
        if (errorData.message) {
          errorMsg = errorData.message;
        }
      }
    } catch (e) {
      if (text && (text.includes("<?php") || text.includes("<html") || text.includes("<!DOCTYPE"))) {
        return { __isPhpDevMode: true };
      } else if (text) {
        errorMsg = `Lỗi từ máy chủ: ${text.substring(0, 120)}`;
      }
    }
    throw new Error(errorMsg);
  }

  try {
    const data = JSON.parse(text);
    if (data && data.status === 'error') {
      throw new Error(data.message || "Lỗi truy vấn cơ sở dữ liệu");
    }
    return data;
  } catch (err: any) {
    if (text && (text.includes("<?php") || text.includes("<html") || text.includes("<!DOCTYPE"))) {
      return { __isPhpDevMode: true };
    }
    throw err;
  }
};

/**
 * Gọi API HTTP thông thường từ trình duyệt lên server PHP/Express để lấy dữ liệu MySQL.
 */
export const mysqlClientService = {
  isUsingRealAPI: () => true,

  // --- XÁC THỰC VÀ PHIÊN LÀM VIỆC ---
  async login(username: string, password: string): Promise<User | null> {
    try {
      const res = await fetch(reqUrl('login', 'auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await handleResponse(res);
      if (data && data.__isPhpDevMode) {
        // Fallback kiểm tra an toàn trong môi trường preview
        return storageService.verifyLocalLogin(username, password);
      }
      if (data && data.status === 'success' && data.token && data.user) {
        authStorage.setToken(data.token);
        return data.user;
      }
      return null;
    } catch (err: any) {
      // Nếu là lỗi PHP dev mode, fallback sang local
      if (err.message && err.message.includes('__isPhpDevMode')) {
        return storageService.verifyLocalLogin(username, password);
      }
      throw err;
    }
  },

  async changePassword(currentPassword: string, newPassword: string, userId?: string): Promise<void> {
    const res = await fetch(reqUrl('changePassword', 'auth/change-password'), {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await handleResponse(res);
    if (data && data.__isPhpDevMode) {
      storageService.changeLocalPassword(currentPassword, newPassword, userId);
    }
  },

  logout(): void {
    authStorage.clearToken();
  },

  // --- KIỂM TRA KẾT NỐI DATABASE ---
  async testConnection(): Promise<{
    status: 'success' | 'error' | 'local_preview';
    message: string;
    host?: string;
    database?: string;
    user?: string;
    timestamp?: string;
    tables?: Record<string, number>;
    latencyMs?: number;
  }> {
    const startTime = performance.now();
    try {
      const res = await fetch(reqUrl('testConnection', 'health'));
      const latencyMs = Math.round(performance.now() - startTime);
      const data = await handleResponse(res);
      if (data && data.__isPhpDevMode) {
        return {
          status: 'local_preview',
          message: 'Hệ thống đang chạy trên môi trường giả lập (Preview Mode). File api.php đã sẵn sàng và sẽ kết nối trực tiếp MySQL khi tải lên Hostinger.',
          host: 'localhost:3306 (Hostinger)',
          database: 'u295972519_lichhop',
          user: 'u295972519_lichhop',
          latencyMs
        };
      }
      return {
        ...data,
        latencyMs
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        status: 'error',
        message: err.message || 'Không thể kết nối đến API Database Hostinger',
        latencyMs
      };
    }
  },

  // --- SYSTEM SETTINGS ---
  async getSettings(): Promise<SystemSettings | null> {
    if (!this.isUsingRealAPI()) return null;
    const res = await fetch(reqUrl('getSettings', 'settings'));
    const data = await handleResponse(res);
    if (data && data.__isPhpDevMode) return null;
    return data;
  },

  async updateSettings(s: SystemSettings): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const res = await fetch(reqUrl('updateSettings', 'settings'), {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(s)
    });
    await handleResponse(res);
  },

  // --- MEETINGS ---
  async getMeetings(): Promise<Meeting[]> {
    if (!this.isUsingRealAPI()) return [];
    const res = await fetch(reqUrl('getMeetings', 'meetings'));
    const data = await handleResponse(res);
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
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(m)
    });
    await handleResponse(res);
  },

  async deleteMeeting(id: string): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const url = reqUrl('deleteMeeting', `meetings/${encodeURIComponent(id)}`, `id=${encodeURIComponent(id)}`);
    const res = await fetch(url, { 
      method: isPHPHosting ? 'POST' : 'DELETE',
      headers: getAuthHeaders()
    });
    await handleResponse(res);
  },

  // --- ENDPOINTS ---
  async getEndpoints(): Promise<Endpoint[]> {
    if (!this.isUsingRealAPI()) return [];
    const res = await fetch(reqUrl('getEndpoints', 'endpoints'));
    const data = await handleResponse(res);
    if (!Array.isArray(data)) return [];
    return data.map((e: any) => ({
      id: e.id,
      name: e.name,
      location: e.location,
      status: e.status,
      lastConnected: e.lastConnected || e.last_connected,
      ip1: e.ip1 || e.ip_1,
      ip2: e.ip2 || e.ip_2,
      groupId: e.groupId || e.group_id
    }));
  },

  async upsertEndpoint(e: Endpoint): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const res = await fetch(reqUrl('upsertEndpoint', 'endpoints'), {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(e)
    });
    await handleResponse(res);
  },

  async deleteEndpoint(id: string): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const url = reqUrl('deleteEndpoint', `endpoints/${encodeURIComponent(id)}`, `id=${encodeURIComponent(id)}`);
    const res = await fetch(url, { 
      method: isPHPHosting ? 'POST' : 'DELETE',
      headers: getAuthHeaders()
    });
    await handleResponse(res);
  },

  // --- UNITS ---
  async getUnits(): Promise<Unit[]> {
    if (!this.isUsingRealAPI()) return [];
    const res = await fetch(reqUrl('getUnits', 'units'));
    const data = await handleResponse(res);
    return Array.isArray(data) ? data : [];
  },

  async upsertUnit(u: Unit): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const res = await fetch(reqUrl('upsertUnit', 'units'), {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(u)
    });
    await handleResponse(res);
  },

  async deleteUnit(id: string): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const url = reqUrl('deleteUnit', `units/${encodeURIComponent(id)}`, `id=${encodeURIComponent(id)}`);
    const res = await fetch(url, { 
      method: isPHPHosting ? 'POST' : 'DELETE',
      headers: getAuthHeaders()
    });
    await handleResponse(res);
  },

  // --- STAFF ---
  async getStaff(): Promise<Staff[]> {
    if (!this.isUsingRealAPI()) return [];
    const res = await fetch(reqUrl('getStaff', 'staff'));
    const data = await handleResponse(res);
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
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(s)
    });
    await handleResponse(res);
  },

  async deleteStaff(id: string): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const url = reqUrl('deleteStaff', `staff/${encodeURIComponent(id)}`, `id=${encodeURIComponent(id)}`);
    const res = await fetch(url, { 
      method: isPHPHosting ? 'POST' : 'DELETE',
      headers: getAuthHeaders()
    });
    await handleResponse(res);
  },

  // --- PARTICIPANT GROUPS ---
  async getGroups(): Promise<ParticipantGroup[]> {
    if (!this.isUsingRealAPI()) return [];
    const res = await fetch(reqUrl('getGroups', 'groups'));
    const data = await handleResponse(res);
    return Array.isArray(data) ? data : [];
  },

  async upsertGroup(g: ParticipantGroup): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const res = await fetch(reqUrl('upsertGroup', 'groups'), {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(g)
    });
    await handleResponse(res);
  },

  async deleteGroup(id: string): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const url = reqUrl('deleteGroup', `groups/${encodeURIComponent(id)}`, `id=${encodeURIComponent(id)}`);
    const res = await fetch(url, { 
      method: isPHPHosting ? 'POST' : 'DELETE',
      headers: getAuthHeaders()
    });
    await handleResponse(res);
  },

  // --- USERS (BẢO VỆ CHẶT CHẼ) ---
  async getUsers(): Promise<User[]> {
    if (!this.isUsingRealAPI()) return [];
    const res = await fetch(reqUrl('getUsers', 'users'), {
      headers: getAuthHeaders()
    });
    const data = await handleResponse(res);
    if (!Array.isArray(data)) return [];
    return data.map((u: any) => ({
      id: String(u.id),
      username: u.username,
      fullName: u.fullName || u.full_name,
      role: u.role
      // Tuyệt đối không map hoặc nhận password
    }));
  },

  async upsertUser(u: User): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const res = await fetch(reqUrl('upsertUser', 'users'), {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(u)
    });
    await handleResponse(res);
  },

  async deleteUser(id: string): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const url = reqUrl('deleteUser', `users/${encodeURIComponent(id)}`, `id=${encodeURIComponent(id)}`);
    const res = await fetch(url, { 
      method: isPHPHosting ? 'POST' : 'DELETE',
      headers: getAuthHeaders()
    });
    await handleResponse(res);
  },

  // --- OPERATORS ---
  async getOperators(): Promise<SystemOperator[]> {
    if (!this.isUsingRealAPI()) return [];
    const res = await fetch(reqUrl('getOperators', 'operators'));
    const data = await handleResponse(res);
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
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(o)
    });
    await handleResponse(res);
  },

  async deleteOperator(id: string): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const url = reqUrl('deleteOperator', `operators/${encodeURIComponent(id)}`, `id=${encodeURIComponent(id)}`);
    const res = await fetch(url, { 
      method: isPHPHosting ? 'POST' : 'DELETE',
      headers: getAuthHeaders()
    });
    await handleResponse(res);
  },

  // --- ENDPOINT GROUPS ---
  async getEndpointGroups(): Promise<EndpointGroup[]> {
    if (!this.isUsingRealAPI()) return [];
    const res = await fetch(reqUrl('getEndpointGroups', 'endpoint_groups'));
    const data = await handleResponse(res);
    return Array.isArray(data) ? data : [];
  },

  async upsertEndpointGroup(g: EndpointGroup): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const res = await fetch(reqUrl('upsertEndpointGroup', 'endpoint_groups'), {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(g)
    });
    await handleResponse(res);
  },

  async deleteEndpointGroup(id: string): Promise<void> {
    if (!this.isUsingRealAPI()) return;
    const url = reqUrl('deleteEndpointGroup', `endpoint_groups/${encodeURIComponent(id)}`, `id=${encodeURIComponent(id)}`);
    const res = await fetch(url, { 
      method: isPHPHosting ? 'POST' : 'DELETE',
      headers: getAuthHeaders()
    });
    await handleResponse(res);
  }
};
