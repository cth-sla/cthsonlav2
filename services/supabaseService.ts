import { Meeting, Unit, Staff, Endpoint, User, SystemSettings, ParticipantGroup, SystemOperator } from '../types';
import { mysqlClientService } from './mysqlService';
import { storageService } from './storageService';

/**
 * -----------------------------------------------------------------------------
 * CTH SLA PLATFORM - DATABASE SYNCHRONIZATION FACADE (Supabase Service Replacement)
 * -----------------------------------------------------------------------------
 * File này hoạt động như một lớp chuyển tiếp (Facade) để đồng bộ dữ liệu.
 * Toàn bộ các kết nối tới Supabase đã bị NGẮT KẾT NỐI hoàn toàn.
 * Hệ thống giờ đây sử dụng 100% cơ sở dữ liệu MySQL trên Hostinger thông qua mysqlClientService.
 * -----------------------------------------------------------------------------
 */

export const supabaseService = {
  isConfigured: () => true,

  async getMeetings(): Promise<Meeting[]> {
    try {
      const data = await mysqlClientService.getMeetings();
      return data;
    } catch (e) {
      console.warn("Lấy meetings từ MySQL thất bại, sử dụng fallback cục bộ:", e);
      return storageService.getMeetings();
    }
  },

  async upsertMeeting(m: Meeting): Promise<void> {
    await mysqlClientService.upsertMeeting(m);
    const local = storageService.getMeetings();
    const idx = local.findIndex(x => x.id === m.id);
    if (idx >= 0) local[idx] = m;
    else local.push(m);
    storageService.saveMeetings(local);
  },

  async deleteMeeting(id: string): Promise<void> {
    await mysqlClientService.deleteMeeting(id);
    const local = storageService.getMeetings();
    storageService.saveMeetings(local.filter(x => x.id !== id));
  },

  async getEndpoints(): Promise<Endpoint[]> {
    try {
      return await mysqlClientService.getEndpoints();
    } catch (e) {
      console.warn("Lấy endpoints từ MySQL thất bại, sử dụng fallback cục bộ:", e);
      return storageService.getEndpoints();
    }
  },

  async upsertEndpoint(e: Endpoint): Promise<void> {
    await mysqlClientService.upsertEndpoint(e);
    const local = storageService.getEndpoints();
    const idx = local.findIndex(x => x.id === e.id);
    if (idx >= 0) local[idx] = e;
    else local.push(e);
    storageService.saveEndpoints(local);
  },

  async deleteEndpoint(id: string): Promise<void> {
    await mysqlClientService.deleteEndpoint(id);
    const local = storageService.getEndpoints();
    storageService.saveEndpoints(local.filter(x => x.id !== id));
  },

  async getUnits(): Promise<Unit[]> {
    try {
      return await mysqlClientService.getUnits();
    } catch (e) {
      console.warn("Lấy units từ MySQL thất bại, sử dụng fallback cục bộ:", e);
      return storageService.getUnits();
    }
  },

  async upsertUnit(u: Unit): Promise<void> {
    await mysqlClientService.upsertUnit(u);
    const local = storageService.getUnits();
    const idx = local.findIndex(x => x.id === u.id);
    if (idx >= 0) local[idx] = u;
    else local.push(u);
    storageService.saveUnits(local);
  },

  async deleteUnit(id: string): Promise<void> {
    await mysqlClientService.deleteUnit(id);
    const local = storageService.getUnits();
    storageService.saveUnits(local.filter(x => x.id !== id));
  },

  async getStaff(): Promise<Staff[]> {
    try {
      return await mysqlClientService.getStaff();
    } catch (e) {
      console.warn("Lấy staff từ MySQL thất bại, sử dụng fallback cục bộ:", e);
      return storageService.getStaff();
    }
  },

  async upsertStaff(s: Staff): Promise<void> {
    await mysqlClientService.upsertStaff(s);
    const local = storageService.getStaff();
    const idx = local.findIndex(x => x.id === s.id);
    if (idx >= 0) local[idx] = s;
    else local.push(s);
    storageService.saveStaff(local);
  },

  async deleteStaff(id: string): Promise<void> {
    await mysqlClientService.deleteStaff(id);
    const local = storageService.getStaff();
    storageService.saveStaff(local.filter(x => x.id !== id));
  },

  async getGroups(): Promise<ParticipantGroup[]> {
    try {
      return await mysqlClientService.getGroups();
    } catch (e) {
      console.warn("Lấy groups từ MySQL thất bại, sử dụng fallback cục bộ:", e);
      return storageService.getGroups();
    }
  },

  async upsertGroup(g: ParticipantGroup): Promise<void> {
    await mysqlClientService.upsertGroup(g);
    const local = storageService.getGroups();
    const idx = local.findIndex(x => x.id === g.id);
    if (idx >= 0) local[idx] = g;
    else local.push(g);
    storageService.saveGroups(local);
  },

  async deleteGroup(id: string): Promise<void> {
    await mysqlClientService.deleteGroup(id);
    const local = storageService.getGroups();
    storageService.saveGroups(local.filter(x => x.id !== id));
  },

  async getUsers(): Promise<User[]> {
    try {
      return await mysqlClientService.getUsers();
    } catch (e) {
      console.warn("Lấy users từ MySQL thất bại, sử dụng fallback cục bộ:", e);
      return storageService.getUsers();
    }
  },

  async upsertUser(u: User): Promise<void> {
    await mysqlClientService.upsertUser(u);
    const local = storageService.getUsers();
    const idx = local.findIndex(x => x.id === u.id);
    if (idx >= 0) local[idx] = u;
    else local.push(u);
    storageService.saveUsers(local);
  },

  async deleteUser(id: string): Promise<void> {
    await mysqlClientService.deleteUser(id);
    const local = storageService.getUsers();
    storageService.saveUsers(local.filter(x => x.id !== id));
  },

  async getSettings(): Promise<SystemSettings | null> {
    try {
      return await mysqlClientService.getSettings();
    } catch (e) {
      console.warn("Lấy settings từ MySQL thất bại, sử dụng fallback cục bộ:", e);
      return storageService.getSystemSettings();
    }
  },

  async updateSettings(s: SystemSettings): Promise<void> {
    await mysqlClientService.updateSettings(s);
    storageService.saveSystemSettings(s);
  },

  async getOperators(): Promise<SystemOperator[]> {
    try {
      return await mysqlClientService.getOperators();
    } catch (e) {
      console.warn("Lấy operators từ MySQL thất bại, sử dụng fallback cục bộ:", e);
      return [];
    }
  },

  async upsertOperator(o: SystemOperator): Promise<void> {
    await mysqlClientService.upsertOperator(o);
  },

  async deleteOperator(id: string): Promise<void> {
    await mysqlClientService.deleteOperator(id);
  },

  subscribeTable(table: string, callback: (payload: any) => void) {
    return {
      unsubscribe: () => {}
    };
  }
};
