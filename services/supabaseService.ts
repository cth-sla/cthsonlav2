
import { createClient } from '@supabase/supabase-js';
import { Meeting, Unit, Staff, Endpoint, User, SystemSettings, ParticipantGroup, EndpointStatus } from '../types';

const supabaseUrl = (window as any).process?.env?.SUPABASE_URL || "";
const supabaseAnonKey = (window as any).process?.env?.SUPABASE_ANON_KEY || "";

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// --- MAPPERS: Chuyển đổi snake_case (DB) <-> camelCase (App) ---

const mapMeeting = (m: any): Meeting => ({
  id: m.id,
  title: m.title || 'Không có tiêu đề',
  hostUnit: m.host_unit_name || m.host_unit || m.hostUnit || 'N/A',
  chairPerson: m.chair_person_name || m.chair_person || m.chairPerson || 'N/A',
  startTime: m.start_time || m.startTime || new Date().toISOString(),
  endTime: m.end_time || m.endTime || new Date().toISOString(),
  description: m.description || '',
  participants: Array.isArray(m.participants) ? m.participants : [],
  endpoints: Array.isArray(m.endpoints) ? m.endpoints : [],
  notes: m.notes || '',
  endpointChecks: m.endpoint_checks || m.endpointChecks || {},
  status: m.status || 'SCHEDULED',
  cancelReason: m.cancel_reason || m.cancelReason || ''
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
  notes: m.notes,
  endpoint_checks: m.endpointChecks || {},
  status: m.status,
  cancel_reason: m.cancelReason
});

const mapEndpoint = (e: any): Endpoint => ({
  id: e.id,
  name: e.name || 'N/A',
  location: e.location || 'N/A',
  status: (e.status as EndpointStatus) || EndpointStatus.DISCONNECTED,
  lastConnected: e.last_connected || e.lastConnected || 'N/A'
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
  logoBase64: s.logo_base64 || s.logoBase64 || '',
  primaryColor: s.primary_color || s.primaryColor || '#3B82F6'
});

const unmapSettings = (s: SystemSettings) => ({
  id: 1,
  system_name: s.systemName,
  short_name: s.shortName,
  logo_base_64: s.logoBase64,
  primary_color: s.primaryColor
});

export const supabaseService = {
  isConfigured: () => !!supabase,

  async getMeetings(): Promise<Meeting[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('meetings').select('*').order('start_time', { ascending: false });
    if (error) return [];
    return (data || []).map(mapMeeting);
  },

  async upsertMeeting(m: Meeting) {
    if (!supabase) return;
    const { error } = await supabase.from('meetings').upsert(unmapMeeting(m));
    if (error) throw error;
  },

  async deleteMeeting(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('meetings').delete().eq('id', id);
    if (error) throw error;
  },

  async getEndpoints(): Promise<Endpoint[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('endpoints').select('*').order('name');
    if (error) return [];
    return (data || []).map(mapEndpoint);
  },

  async upsertEndpoint(e: Endpoint) {
    if (!supabase) return;
    const { error } = await supabase.from('endpoints').upsert({
      id: e.id,
      name: e.name,
      location: e.location,
      status: e.status,
      last_connected: e.lastConnected
    });
    if (error) throw error;
  },

  async deleteEndpoint(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('endpoints').delete().eq('id', id);
    if (error) throw error;
  },

  async getUnits(): Promise<Unit[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('units').select('*').order('name');
    if (error) return [];
    return (data || []).map(mapUnit);
  },

  async upsertUnit(u: Unit) {
    if (!supabase) return;
    const { error } = await supabase.from('units').upsert(u);
    if (error) throw error;
  },

  async deleteUnit(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('units').delete().eq('id', id);
    if (error) throw error;
  },

  async getStaff(): Promise<Staff[]> {
    if (!supabase) return [];
    // Phải order theo full_name thay vì fullName
    const { data, error } = await supabase.from('staff').select('*').order('full_name');
    if (error) return [];
    return (data || []).map(mapStaff);
  },

  async upsertStaff(s: Staff) {
    if (!supabase) return;
    const { error } = await supabase.from('staff').upsert(unmapStaff(s));
    if (error) throw error;
  },

  async deleteStaff(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (error) throw error;
  },

  async getGroups(): Promise<ParticipantGroup[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('participant_groups').select('*').order('name');
    return data || [];
  },

  async upsertGroup(g: ParticipantGroup) {
    if (!supabase) return;
    const { error } = await supabase.from('participant_groups').upsert(g);
    if (error) throw error;
  },

  async deleteGroup(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('participant_groups').delete().eq('id', id);
    if (error) throw error;
  },

  async getUsers(): Promise<User[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('users').select('*').order('username');
    if (error) return [];
    return (data || []).map(mapUser);
  },

  async upsertUser(u: User) {
    if (!supabase) return;
    const { error } = await supabase.from('users').upsert(unmapUser(u));
    if (error) throw error;
  },

  async deleteUser(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  },

  async getSettings(): Promise<SystemSettings | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('system_settings').select('*').single();
    if (error) return null;
    return mapSettings(data);
  },

  async updateSettings(s: SystemSettings) {
    if (!supabase) return;
    const { error } = await supabase.from('system_settings').upsert(unmapSettings(s));
    if (error) throw error;
  },

  subscribeTable(table: string, callback: (payload: any) => void) {
    if (!supabase) return null;
    return supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        let mappedData = payload.new;
        if (payload.new) {
          if (table === 'meetings') mappedData = mapMeeting(payload.new);
          else if (table === 'endpoints') mappedData = mapEndpoint(payload.new);
          else if (table === 'staff') mappedData = mapStaff(payload.new);
          else if (table === 'units') mappedData = mapUnit(payload.new);
          else if (table === 'users') mappedData = mapUser(payload.new);
          else if (table === 'system_settings') mappedData = mapSettings(payload.new);
        }
        callback({ ...payload, mappedData });
      })
      .subscribe();
  }
};
