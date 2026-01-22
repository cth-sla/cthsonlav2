
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Meeting, Unit, Staff, Endpoint, SystemSettings } from '../types';

const supabaseUrl = (window as any).process?.env?.SUPABASE_URL || '';
const supabaseAnonKey = (window as any).process?.env?.SUPABASE_ANON_KEY || '';

// Chỉ khởi tạo client nếu có đủ thông tin cấu hình
let supabaseInstance: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    console.log("✅ Supabase service initialized.");
  } catch (e) {
    console.error("❌ Failed to initialize Supabase client:", e);
  }
} else {
  console.warn("⚠️ Supabase credentials missing. System is running in Local Storage mode.");
}

export const supabase = supabaseInstance;

export const supabaseService = {
  isConfigured(): boolean {
    return !!supabase;
  },

  // --- MEETINGS ---
  async getMeetings(): Promise<Meeting[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('startTime', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async upsertMeeting(meeting: Meeting) {
    if (!supabase) return meeting;
    const { data, error } = await supabase
      .from('meetings')
      .upsert(meeting)
      .select();
    if (error) throw error;
    return data ? data[0] : meeting;
  },

  async deleteMeeting(id: string) {
    if (!supabase) return;
    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // --- UNITS ---
  async getUnits(): Promise<Unit[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('units').select('*');
    if (error) throw error;
    return data || [];
  },

  async upsertUnit(unit: Unit) {
    if (!supabase) return;
    const { error } = await supabase.from('units').upsert(unit);
    if (error) throw error;
  },

  async deleteUnit(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('units').delete().eq('id', id);
    if (error) throw error;
  },

  // --- STAFF ---
  async getStaff(): Promise<Staff[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('staff').select('*');
    if (error) throw error;
    return data || [];
  },

  async upsertStaff(staff: Staff) {
    if (!supabase) return;
    const { error } = await supabase.from('staff').upsert(staff);
    if (error) throw error;
  },

  async deleteStaff(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (error) throw error;
  },

  // --- ENDPOINTS ---
  async getEndpoints(): Promise<Endpoint[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('endpoints').select('*');
    if (error) throw error;
    return data || [];
  },

  async upsertEndpoint(endpoint: Endpoint) {
    if (!supabase) return;
    const { error } = await supabase.from('endpoints').upsert(endpoint);
    if (error) throw error;
  },

  async deleteEndpoint(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('endpoints').delete().eq('id', id);
    if (error) throw error;
  },

  // --- SYSTEM SETTINGS ---
  async getSettings(): Promise<SystemSettings | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('system_settings').select('*').limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateSettings(settings: SystemSettings) {
    if (!supabase) return;
    const { error } = await supabase.from('system_settings').upsert({ id: 'current_config', ...settings });
    if (error) throw error;
  }
};
