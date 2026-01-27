
import { createClient } from '@supabase/supabase-js';
import { Meeting, Unit, Staff, Endpoint, User, SystemSettings, ParticipantGroup } from '../types';

const supabaseUrl = (window as any).process?.env?.SUPABASE_URL || "";
const supabaseAnonKey = (window as any).process?.env?.SUPABASE_ANON_KEY || "";

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Helper mappers
const mapMeeting = (m: any): Meeting => ({
  id: m.id,
  title: m.title,
  hostUnit: m.host_unit_name || m.hostUnit || 'N/A',
  chairPerson: m.chair_person_name || m.chairPerson || 'N/A',
  startTime: m.start_time || m.startTime,
  endTime: m.end_time || m.endTime,
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
  status: m.status || 'SCHEDULED',
  cancel_reason: m.cancelReason
});

const mapEndpoint = (e: any): Endpoint => ({
  id: e.id,
  name: e.name,
  location: e.location,
  status: e.status,
  lastConnected: e.last_connected || e.lastConnected || 'N/A'
});

const unmapEndpoint = (e: Endpoint) => ({
  id: e.id,
  name: e.name,
  location: e.location,
  status: e.status,
  last_connected: e.lastConnected
});

export const supabaseService = {
  isConfigured: () => !!supabase,

  async getMeetings(): Promise<Meeting[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('meetings').select('*').order('start_time', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapMeeting);
    } catch (err) {
      console.error("Supabase getMeetings error:", err);
      return [];
    }
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
    try {
      const { data, error } = await supabase.from('endpoints').select('*').order('name');
      if (error) throw error;
      return (data || []).map(mapEndpoint);
    } catch (err) {
      console.error("Supabase getEndpoints error:", err);
      return [];
    }
  },

  async upsertEndpoint(e: Endpoint) {
    if (!supabase) return;
    const { error } = await supabase.from('endpoints').upsert(unmapEndpoint(e));
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
    if (error) throw error;
    return data || [];
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
    const { data, error } = await supabase.from('staff').select('*').order('fullName');
    if (error) throw error;
    return data || [];
  },

  async upsertStaff(s: Staff) {
    if (!supabase) return;
    const { error } = await supabase.from('staff').upsert(s);
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
    if (error) throw error;
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
    if (error) throw error;
    return data || [];
  },

  async upsertUser(u: User) {
    if (!supabase) return;
    const { error } = await supabase.from('users').upsert(u);
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
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async updateSettings(s: SystemSettings) {
    if (!supabase) return;
    const { error } = await supabase.from('system_settings').upsert({ id: 1, ...s });
    if (error) throw error;
  },

  subscribeTable(table: string, callback: (payload: any) => void) {
    if (!supabase) return null;
    return supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        const mappedData = table === 'meetings' ? mapMeeting(payload.new) : payload.new;
        callback({ ...payload, mappedData });
      })
      .subscribe();
  }
};
