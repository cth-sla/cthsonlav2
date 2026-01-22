
import { createClient } from '@supabase/supabase-js';
import { Meeting, Unit, Staff, Endpoint, User, SystemSettings } from '../types';

const supabaseUrl = (window as any).process?.env?.SUPABASE_URL || "";
const supabaseAnonKey = (window as any).process?.env?.SUPABASE_ANON_KEY || "";

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Helper mappers to bridge snake_case DB and camelCase App
const mapMeeting = (m: any): Meeting => ({
  id: m.id,
  title: m.title,
  hostUnit: m.host_unit_name || m.hostUnit,
  chairPerson: m.chair_person_name || m.chairPerson,
  startTime: m.start_time || m.startTime,
  endTime: m.end_time || m.endTime,
  description: m.description,
  participants: Array.isArray(m.participants) ? m.participants : [],
  endpoints: Array.isArray(m.endpoints) ? m.endpoints : [],
  notes: m.notes
});

const unmapMeeting = (m: Meeting) => ({
  id: m.id,
  title: m.title,
  host_unit_name: m.hostUnit,
  chair_person_name: m.chairPerson,
  start_time: m.startTime,
  end_time: m.endTime,
  description: m.description,
  participants: m.participants,
  endpoints: m.endpoints,
  notes: m.notes
});

const mapEndpoint = (e: any): Endpoint => ({
  id: e.id,
  name: e.name,
  location: e.location,
  status: e.status,
  lastConnected: e.last_connected || e.lastConnected
});

const unmapEndpoint = (e: Endpoint) => ({
  id: e.id,
  name: e.name,
  location: e.location,
  status: e.status,
  last_connected: e.lastConnected
});

const mapStaff = (s: any): Staff => ({
  id: s.id,
  fullName: s.full_name || s.fullName,
  unitId: s.unit_id || s.unitId,
  position: s.position,
  email: s.email,
  phone: s.phone
});

const unmapStaff = (s: Staff) => ({
  id: s.id,
  full_name: s.fullName,
  unit_id: s.unitId,
  position: s.position,
  email: s.email,
  phone: s.phone
});

const mapUser = (u: any): User => ({
  id: u.id,
  username: u.username,
  fullName: u.full_name || u.fullName,
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

export const supabaseService = {
  isConfigured(): boolean {
    return !!supabase;
  },

  // Meetings
  async getMeetings(): Promise<Meeting[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('start_time', { ascending: false });
    
    if (error) {
      console.error('Lỗi lấy danh sách cuộc họp:', error);
      return [];
    }
    return data.map(mapMeeting);
  },

  async upsertMeeting(meeting: Meeting) {
    if (!supabase) return;
    const { error } = await supabase
      .from('meetings')
      .upsert(unmapMeeting(meeting));
    if (error) console.error('Lỗi cập nhật cuộc họp:', error);
  },

  async deleteMeeting(id: string) {
    if (!supabase) return;
    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', id);
    if (error) console.error('Lỗi xóa cuộc họp:', error);
  },

  // Units
  async getUnits(): Promise<Unit[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('units').select('*');
    if (error) return [];
    return data as Unit[];
  },

  async upsertUnit(unit: Unit) {
    if (!supabase) return;
    await supabase.from('units').upsert(unit);
  },

  async deleteUnit(id: string) {
    if (!supabase) return;
    await supabase.from('units').delete().eq('id', id);
  },

  // Staff
  async getStaff(): Promise<Staff[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('staff').select('*');
    if (error) return [];
    return data.map(mapStaff);
  },

  async upsertStaff(staff: Staff) {
    if (!supabase) return;
    await supabase.from('staff').upsert(unmapStaff(staff));
  },

  async deleteStaff(id: string) {
    if (!supabase) return;
    await supabase.from('staff').delete().eq('id', id);
  },

  // Endpoints
  async getEndpoints(): Promise<Endpoint[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('endpoints').select('*');
    if (error) return [];
    return data.map(mapEndpoint);
  },

  async upsertEndpoint(endpoint: Endpoint) {
    if (!supabase) return;
    await supabase.from('endpoints').upsert(unmapEndpoint(endpoint));
  },

  async deleteEndpoint(id: string) {
    if (!supabase) return;
    await supabase.from('endpoints').delete().eq('id', id);
  },

  // Settings
  async getSettings(): Promise<SystemSettings | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 'current')
      .single();
    if (error) return null;
    
    // Map snake_case settings to camelCase
    return {
      systemName: data.system_name,
      shortName: data.short_name,
      logoBase64: data.logo_base64,
      primaryColor: data.primary_color
    };
  },

  async updateSettings(settings: SystemSettings) {
    if (!supabase) return;
    await supabase.from('system_settings').upsert({ 
      id: 'current', 
      system_name: settings.systemName,
      short_name: settings.shortName,
      logo_base_64: settings.logoBase64,
      primary_color: settings.primaryColor
    });
  },

  // Users
  async getUsers(): Promise<User[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('users').select('*');
    if (error) return [];
    return data.map(mapUser);
  },

  async upsertUser(user: User) {
    if (!supabase) return;
    await supabase.from('users').upsert(unmapUser(user));
  },

  async deleteUser(id: string) {
    if (!supabase) return;
    await supabase.from('users').delete().eq('id', id);
  }
};
