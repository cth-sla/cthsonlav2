import { Meeting, Unit, Staff, Endpoint, User, SystemSettings, ParticipantGroup, SystemOperator, EndpointGroup } from '../types';
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

  async testConnection() {
    return await mysqlClientService.testConnection();
  },

  async login(username: string, pass: string): Promise<User | null> {
    return await mysqlClientService.login(username, pass);
  },

  async changePassword(currentPass: string, newPass: string, userId?: string): Promise<void> {
    return await mysqlClientService.changePassword(currentPass, newPass, userId);
  },

  logout(): void {
    mysqlClientService.logout();
  },

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
    try {
      await mysqlClientService.upsertMeeting(m);
    } catch (err) {
      console.warn("Lưu cuộc họp lên MySQL thất bại (đã lưu bộ nhớ cục bộ):", err);
    }
    const local = storageService.getMeetings();
    const idx = local.findIndex(x => x.id === m.id);
    if (idx >= 0) local[idx] = m;
    else local.push(m);
    storageService.saveMeetings(local);
  },

  async deleteMeeting(id: string): Promise<void> {
    try {
      await mysqlClientService.deleteMeeting(id);
    } catch (err) {
      console.warn("Xóa cuộc họp trên MySQL thất bại (đã xóa bộ nhớ cục bộ):", err);
    }
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
    try {
      await mysqlClientService.upsertEndpoint(e);
    } catch (err) {
      console.warn("Lưu điểm cầu lên MySQL thất bại (đã lưu bộ nhớ cục bộ):", err);
    }
    const local = storageService.getEndpoints();
    const idx = local.findIndex(x => x.id === e.id);
    if (idx >= 0) local[idx] = e;
    else local.push(e);
    storageService.saveEndpoints(local);
  },

  async deleteEndpoint(id: string): Promise<void> {
    try {
      await mysqlClientService.deleteEndpoint(id);
    } catch (err) {
      console.warn("Xóa điểm cầu trên MySQL thất bại (đã xóa bộ nhớ cục bộ):", err);
    }
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
    try {
      await mysqlClientService.upsertUnit(u);
    } catch (err) {
      console.warn("Lưu đơn vị lên MySQL thất bại (đã lưu bộ nhớ cục bộ):", err);
    }
    const local = storageService.getUnits();
    const idx = local.findIndex(x => x.id === u.id);
    if (idx >= 0) local[idx] = u;
    else local.push(u);
    storageService.saveUnits(local);
  },

  async deleteUnit(id: string): Promise<void> {
    try {
      await mysqlClientService.deleteUnit(id);
    } catch (err) {
      console.warn("Xóa đơn vị trên MySQL thất bại (đã xóa bộ nhớ cục bộ):", err);
    }
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
    try {
      await mysqlClientService.upsertStaff(s);
    } catch (err) {
      console.warn("Lưu cán bộ lên MySQL thất bại (đã lưu bộ nhớ cục bộ):", err);
    }
    const local = storageService.getStaff();
    const idx = local.findIndex(x => x.id === s.id);
    if (idx >= 0) local[idx] = s;
    else local.push(s);
    storageService.saveStaff(local);
  },

  async deleteStaff(id: string): Promise<void> {
    try {
      await mysqlClientService.deleteStaff(id);
    } catch (err) {
      console.warn("Xóa cán bộ trên MySQL thất bại (đã xóa bộ nhớ cục bộ):", err);
    }
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
    try {
      await mysqlClientService.upsertGroup(g);
    } catch (err) {
      console.warn("Lưu nhóm lên MySQL thất bại (đã lưu bộ nhớ cục bộ):", err);
    }
    const local = storageService.getGroups();
    const idx = local.findIndex(x => x.id === g.id);
    if (idx >= 0) local[idx] = g;
    else local.push(g);
    storageService.saveGroups(local);
  },

  async deleteGroup(id: string): Promise<void> {
    try {
      await mysqlClientService.deleteGroup(id);
    } catch (err) {
      console.warn("Xóa nhóm trên MySQL thất bại (đã xóa bộ nhớ cục bộ):", err);
    }
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
    try {
      await mysqlClientService.upsertUser(u);
    } catch (err) {
      console.warn("Lưu user lên MySQL thất bại (đã lưu bộ nhớ cục bộ):", err);
    }
    const local = storageService.getUsers();
    const idx = local.findIndex(x => x.id === u.id);
    if (idx >= 0) local[idx] = u;
    else local.push(u);
    storageService.saveUsers(local);
  },

  async deleteUser(id: string): Promise<void> {
    try {
      await mysqlClientService.deleteUser(id);
    } catch (err) {
      console.warn("Xóa user trên MySQL thất bại (đã xóa bộ nhớ cục bộ):", err);
    }
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
    try {
      await mysqlClientService.updateSettings(s);
    } catch (err) {
      console.warn("Cập nhật cài đặt lên MySQL thất bại (đã lưu bộ nhớ cục bộ):", err);
    }
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
    try {
      await mysqlClientService.upsertOperator(o);
    } catch (err) {
      console.warn("Lưu cán bộ kỹ thuật lên MySQL thất bại:", err);
    }
  },

  async deleteOperator(id: string): Promise<void> {
    try {
      await mysqlClientService.deleteOperator(id);
    } catch (err) {
      console.warn("Xóa cán bộ kỹ thuật trên MySQL thất bại:", err);
    }
  },

  async getEndpointGroups(): Promise<EndpointGroup[]> {
    try {
      return await mysqlClientService.getEndpointGroups();
    } catch (e) {
      console.warn("Lấy endpoint groups từ MySQL thất bại, sử dụng fallback cục bộ:", e);
      return storageService.getEndpointGroups();
    }
  },

  async upsertEndpointGroup(g: EndpointGroup): Promise<void> {
    try {
      await mysqlClientService.upsertEndpointGroup(g);
    } catch (err) {
      console.warn("Lưu nhóm điểm cầu lên MySQL thất bại (đã lưu bộ nhớ cục bộ):", err);
    }
    const local = storageService.getEndpointGroups();
    const idx = local.findIndex(x => x.id === g.id);
    if (idx >= 0) local[idx] = g;
    else local.push(g);
    storageService.saveEndpointGroups(local);
  },

  async deleteEndpointGroup(id: string): Promise<void> {
    try {
      await mysqlClientService.deleteEndpointGroup(id);
    } catch (err) {
      console.warn("Xóa nhóm điểm cầu trên MySQL thất bại (đã xóa bộ nhớ cục bộ):", err);
    }
    const local = storageService.getEndpointGroups();
    storageService.saveEndpointGroups(local.filter(x => x.id !== id));
  },

  subscribeTable(table: string, callback: (payload: any) => void) {
    return {
      unsubscribe: () => {}
    };
  }
};
