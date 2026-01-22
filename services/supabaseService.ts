
import { createClient } from '@supabase/supabase-js';
import { Meeting, Unit, Staff, Endpoint, User, SystemSettings } from '../types';

const supabaseUrl = (window as any).process?.env?.SUPABASE_URL || "";
const supabaseAnonKey = (window as any).process?.env?.SUPABASE_ANON_KEY || "";

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

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
    
    // Map snake_case to camelCase if necessary, or assume direct mapping
    return data as Meeting[];
  },

  async upsertMeeting(meeting: Meeting) {
    if (!supabase) return;
    const { error } = await supabase
      .from('meetings')
      .upsert(meeting);
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
    return data as Staff[];
  },

  async upsertStaff(staff: Staff) {
    if (!supabase) return;
    await supabase.from('staff').upsert(staff);
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
    return data as Endpoint[];
  },

  async upsertEndpoint(endpoint: Endpoint) {
    if (!supabase) return;
    await supabase.from('endpoints').upsert(endpoint);
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
      .single();
    if (error) return null;
    return data as SystemSettings;
  },

  async updateSettings(settings: SystemSettings) {
    if (!supabase) return;
    await supabase.from('system_settings').upsert({ id: 'current', ...settings });
  },

  // Users
  async getUsers(): Promise<User[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('users').select('*');
    if (error) return [];
    return data as User[];
  },

  async upsertUser(user: User) {
    if (!supabase) return;
    await supabase.from('users').upsert(user);
  },

  async deleteUser(id: string) {
    if (!supabase) return;
    await supabase.from('users').delete().eq('id', id);
  }
};
