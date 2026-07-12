
import { createClient } from '@supabase/supabase-js';
import { Meeting, Unit, Staff, Endpoint, User, SystemSettings, ParticipantGroup, EndpointStatus, SystemOperator } from '../types';
import { mysqlClientService } from './mysqlService';
import { storageService } from './storageService';

const decodeBase64 = (str: string) => {
  try {
    return atob(str);
  } catch (e) {
    return "";
  }
};

const supabaseUrl = 
  (import.meta as any).env?.VITE_SUPABASE_URL || 
  (window as any).process?.env?.SUPABASE_URL || 
  decodeBase64("aHR0cHM6Ly91aGFxb2ZobmZldGRrY2lhc3dvZi5zdXBhYmFzZS5jbw==");

const supabaseAnonKey = 
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
  (window as any).process?.env?.SUPABASE_ANON_KEY || 
  decodeBase64("ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW5Wb1lYRnZabWh1Wm1WMFpHdGphV0Z6ZDI5bUlpd2ljbTlzWlNJNkltRnViMjRpTENKcFlYUXlPakUzTmprd016RTVNREVzSW1WNGNDSTZNakE0TkRZd056a3dNWDAuNndISG5JTThkOXgwWXZkNThCc3VteFR4M2xVcl9FWmpYMFBNNU1XRkhxQQ==");

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// --- MAPPERS: Chuyển đổi snake_case (DB) <-> camelCase (App) ---

const mapMeeting = (m: any): Meeting => ({
  id: m.id,
  title: m.title || 'Không có tiêu đề',
  hostUnit: m.host_unit_name || 'N/A',
  hostUnitId: m.host_unit_id || undefined,
  chairPerson: m.chair_person_name || 'N/A',
  chairPersonId: m.chair_person_id || undefined,
  startTime: m.start_time || new Date().toISOString(),
  endTime: m.end_time || new Date().toISOString(),
  description: m.description || '',
  participants: Array.isArray(m.participants) ? m.participants : [],
  endpoints: Array.isArray(m.endpoints) ? m.endpoints : [],
  notes: m.notes || '',
  endpointChecks: m.endpoint_checks || {},
  status: m.status || 'SCHEDULED',
  cancelReason: m.cancel_reason || '',
  invitationLink: m.invitation_link || '',
  meetingRoomId: m.meeting_room_id || '',
  meetingFormat: m.meeting_format || undefined
});

const unmapMeeting = (m: Meeting) => {
  const payload: any = {
    id: m.id,
    title: m.title,
    host_unit_name: m.hostUnit,
    chair_person_name: m.chairPerson,
    start_time: m.startTime,
    end_time: m.endTime,
    description: m.description,
    participants: m.participants,
    endpoints: m.endpoints,
    notes: m.notes || null,
    endpoint_checks: m.endpointChecks || {},
    status: m.status || 'SCHEDULED',
    cancel_reason: m.cancelReason || null,
    invitation_link: m.invitationLink || null,
    meeting_room_id: m.meetingRoomId || null,
    meeting_format: m.meetingFormat || null
  };

  // Chỉ thêm các trường ID nếu chúng có giá trị để tránh lỗi nếu cột chưa tồn tại trong DB
  if (m.hostUnitId) payload.host_unit_id = m.hostUnitId;
  if (m.chairPersonId) payload.chair_person_id = m.chairPersonId;

  return payload;
};

const mapEndpoint = (e: any): Endpoint => ({
  id: e.id,
  name: e.name || 'N/A',
  location: e.location || 'N/A',
  status: (e.status as EndpointStatus) || EndpointStatus.DISCONNECTED,
  lastConnected: e.last_connected || e.lastConnected || 'N/A',
  ip1: e.ip_1 || '',
  ip2: e.ip_2 || ''
});

const mapStaff = (s: any): Staff => ({
  id: s.id,
  fullName: s.full_name || s.fullName || 'N/A',
  unitId: s.unit_id || s.unitId || '',
  position: s.position || 'Cán bộ',
  email: s.email || '',
  phone: s.phone || ''
});

const unmapStaff = (s: Staff) => ({
  id: s.id,
  full_name: s.fullName,
  unit_id: s.unitId,
  position: s.position,
  email: s.email,
  phone: s.phone
});

const mapUnit = (u: any): Unit => ({
  id: u.id,
  name: u.name || 'N/A',
  code: u.code || 'N/A',
  description: u.description || ''
});

const mapUser = (u: any): User => ({
  id: u.id,
  username: u.username,
  fullName: u.full_name || u.fullName || 'N/A',
  role: u.role,
  password: u.password
});

const unmapUser = (u: User) => ({
  id: u.id,
  username: u.username,
  full_name: u.fullName,
  role: u.role,
  password: u.password
});

const mapSettings = (s: any): SystemSettings => ({
  systemName: s.system_name || s.systemName || '',
  shortName: s.short_name || s.shortName || '',
  logoBase64: s.logo_base_64 || s.logoBase64 || '',
  primaryColor: s.primary_color || s.primaryColor || '#3B82F6',
  supportQrBase64: s.support_qr_base_64 || s.supportQrBase64 || '',
  supportPhone: s.support_phone || s.supportPhone || ''
});

const unmapSettings = (s: SystemSettings) => ({
  id: 1,
  system_name: s.systemName,
  short_name: s.shortName,
  logo_base_64: s.logoBase64,
  primary_color: s.primaryColor,
  support_qr_base_64: s.supportQrBase64 || null,
  support_phone: s.supportPhone || null
});

const mapOperator = (o: any): SystemOperator => ({
  id: o.id,
  fullName: o.full_name || o.fullName || 'N/A',
  position: o.position || 'Cán bộ vận hành',
  endpointId: o.endpoint_id || o.endpointId || '',
  phone: o.phone || '',
  createdAt: o.created_at || o.createdAt
});

const unmapOperator = (o: SystemOperator) => ({
  id: o.id,
  full_name: o.fullName,
  position: o.position,
  endpoint_id: o.endpointId,
  phone: o.phone
});

export const supabaseService = {
  isConfigured: () => true,

  async getMeetings(): Promise<Meeting[]> {
    if (mysqlClientService.isUsingRealAPI()) {
      try {
        return await mysqlClientService.getMeetings();
      } catch (e) {
        console.warn("Lấy meetings từ MySQL thất bại, sử dụng fallback cục bộ:", e);
      }
    }
    return storageService.getMeetings();
  },

  async upsertMeeting(m: Meeting) {
    if (mysqlClientService.isUsingRealAPI()) {
      await mysqlClientService.upsertMeeting(m);
    }
    const local = storageService.getMeetings();
    const idx = local.findIndex(x => x.id === m.id);
    if (idx >= 0) local[idx] = m;
    else local.push(m);
    storageService.saveMeetings(local);
  },

  async deleteMeeting(id: string) {
    if (mysqlClientService.isUsingRealAPI()) {
      await mysqlClientService.deleteMeeting(id);
    }
    const local = storageService.getMeetings();
    storageService.saveMeetings(local.filter(x => x.id !== id));
  },

  async getEndpoints(): Promise<Endpoint[]> {
    if (mysqlClientService.isUsingRealAPI()) {
      try {
        return await mysqlClientService.getEndpoints();
      } catch (e) {
        console.warn("Lấy endpoints từ MySQL thất bại, sử dụng fallback cục bộ:", e);
      }
    }
    return storageService.getEndpoints();
  },

  async upsertEndpoint(e: Endpoint) {
    if (mysqlClientService.isUsingRealAPI()) {
      await mysqlClientService.upsertEndpoint(e);
    }
    const local = storageService.getEndpoints();
    const idx = local.findIndex(x => x.id === e.id);
    if (idx >= 0) local[idx] = e;
    else local.push(e);
    storageService.saveEndpoints(local);
  },

  async deleteEndpoint(id: string) {
    if (mysqlClientService.isUsingRealAPI()) {
      await mysqlClientService.deleteEndpoint(id);
    }
    const local = storageService.getEndpoints();
    storageService.saveEndpoints(local.filter(x => x.id !== id));
  },

  async getUnits(): Promise<Unit[]> {
    if (mysqlClientService.isUsingRealAPI()) {
      try {
        return await mysqlClientService.getUnits();
      } catch (e) {
        console.warn("Lấy units từ MySQL thất bại, sử dụng fallback cục bộ:", e);
      }
    }
    return storageService.getUnits();
  },

  async upsertUnit(u: Unit) {
    if (mysqlClientService.isUsingRealAPI()) {
      await mysqlClientService.upsertUnit(u);
    }
    const local = storageService.getUnits();
    const idx = local.findIndex(x => x.id === u.id);
    if (idx >= 0) local[idx] = u;
    else local.push(u);
    storageService.saveUnits(local);
  },

  async deleteUnit(id: string) {
    if (mysqlClientService.isUsingRealAPI()) {
      await mysqlClientService.deleteUnit(id);
    }
    const local = storageService.getUnits();
    storageService.saveUnits(local.filter(x => x.id !== id));
  },

  async getStaff(): Promise<Staff[]> {
    if (mysqlClientService.isUsingRealAPI()) {
      try {
        return await mysqlClientService.getStaff();
      } catch (e) {
        console.warn("Lấy staff từ MySQL thất bại, sử dụng fallback cục bộ:", e);
      }
    }
    return storageService.getStaff();
  },

  async upsertStaff(s: Staff) {
    if (mysqlClientService.isUsingRealAPI()) {
      await mysqlClientService.upsertStaff(s);
    }
    const local = storageService.getStaff();
    const idx = local.findIndex(x => x.id === s.id);
    if (idx >= 0) local[idx] = s;
    else local.push(s);
    storageService.saveStaff(local);
  },

  async deleteStaff(id: string) {
    if (mysqlClientService.isUsingRealAPI()) {
      await mysqlClientService.deleteStaff(id);
    }
    const local = storageService.getStaff();
    storageService.saveStaff(local.filter(x => x.id !== id));
  },

  async getGroups(): Promise<ParticipantGroup[]> {
    if (mysqlClientService.isUsingRealAPI()) {
      try {
        return await mysqlClientService.getGroups();
      } catch (e) {
        console.warn("Lấy groups từ MySQL thất bại, sử dụng fallback cục bộ:", e);
      }
    }
    return storageService.getGroups();
  },

  async upsertGroup(g: ParticipantGroup) {
    if (mysqlClientService.isUsingRealAPI()) {
      await mysqlClientService.upsertGroup(g);
    }
    const local = storageService.getGroups();
    const idx = local.findIndex(x => x.id === g.id);
    if (idx >= 0) local[idx] = g;
    else local.push(g);
    storageService.saveGroups(local);
  },

  async deleteGroup(id: string) {
    if (mysqlClientService.isUsingRealAPI()) {
      await mysqlClientService.deleteGroup(id);
    }
    const local = storageService.getGroups();
    storageService.saveGroups(local.filter(x => x.id !== id));
  },

  async getUsers(): Promise<User[]> {
    if (mysqlClientService.isUsingRealAPI()) {
      try {
        return await mysqlClientService.getUsers();
      } catch (e) {
        console.warn("Lấy users từ MySQL thất bại, sử dụng fallback cục bộ:", e);
      }
    }
    return storageService.getUsers();
  },

  async upsertUser(u: User) {
    if (mysqlClientService.isUsingRealAPI()) {
      await mysqlClientService.upsertUser(u);
    }
    const local = storageService.getUsers();
    const idx = local.findIndex(x => x.id === u.id);
    if (idx >= 0) local[idx] = u;
    else local.push(u);
    storageService.saveUsers(local);
  },

  async deleteUser(id: string) {
    if (mysqlClientService.isUsingRealAPI()) {
      await mysqlClientService.deleteUser(id);
    }
    const local = storageService.getUsers();
    storageService.saveUsers(local.filter(x => x.id !== id));
  },

  async getSettings(): Promise<SystemSettings | null> {
    if (mysqlClientService.isUsingRealAPI()) {
      try {
        return await mysqlClientService.getSettings();
      } catch (e) {
        console.warn("Lấy settings từ MySQL thất bại, sử dụng fallback cục bộ:", e);
      }
    }
    return storageService.getSystemSettings();
  },

  async updateSettings(s: SystemSettings) {
    if (mysqlClientService.isUsingRealAPI()) {
      await mysqlClientService.updateSettings(s);
    }
    storageService.saveSystemSettings(s);
  },

  async getOperators(): Promise<SystemOperator[]> {
    if (mysqlClientService.isUsingRealAPI()) {
      try {
        return await mysqlClientService.getOperators();
      } catch (e) {
        console.warn("Lấy operators từ MySQL thất bại, sử dụng fallback cục bộ:", e);
      }
    }
    return [];
  },

  async upsertOperator(o: SystemOperator) {
    if (mysqlClientService.isUsingRealAPI()) {
      await mysqlClientService.upsertOperator(o);
    }
  },

  async deleteOperator(id: string) {
    if (mysqlClientService.isUsingRealAPI()) {
      await mysqlClientService.deleteOperator(id);
    }
  },

  subscribeTable(table: string, callback: (payload: any) => void) {
    return {
      unsubscribe: () => {}
    };
  }
};
