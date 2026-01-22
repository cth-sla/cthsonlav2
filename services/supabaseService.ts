
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
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
  hostUnit: m.host_unit_name || m.hostUnit,
  chairPerson: m.chair_person_name || m.chairPerson,
  startTime: m.start_time || m.startTime,
  endTime: m.end_time || m.endTime,
  description: m.description,
  participants: Array.isArray(m.participants) ? m.participants : [],
  endpoints: Array.isArray(m.endpoints) ? m.endpoints : [],
  notes: m.notes,
  endpointChecks: m.endpoint_checks || m.endpointChecks || {}
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
  endpoint_checks: m.endpointChecks || {}
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

const mapSettings = (data: any): SystemSettings => ({
  systemName: data.system_name,
  shortName: data.short_name,
  logoBase64: data.logo_base_64,
  primaryColor: data.primary_color
});

export const supabaseService = {
  isConfigured(): boolean {
    return !!supabase;
  },

  // Real-time Subscription Helper
  subscribeTable(tableName: string, callback: (payload: any) => void): RealtimeChannel | null {
    if (!supabase) return null;
    return supabase
      .channel(`public:${tableName}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
        let mappedData = payload.new;
        if (tableName === 'meetings' && payload.new) mappedData = mapMeeting(payload.new);
        else if (tableName === 'endpoints' && payload.new) mappedData = mapEndpoint(payload.new);
        else if (tableName === 'staff' && payload.new) mappedData = mapStaff(payload.new);
        else if (tableName === 'users' && payload.new) mappedData = mapUser(payload.new);
        else if (tableName === 'system_settings' && payload.new) mappedData = mapSettings(payload.new);
        else if (tableName === 'participant_groups' && payload.new) mappedData = payload.new as ParticipantGroup;

        callback({ ...payload, mappedData });
      })
      .subscribe();
  },

  // Meetings
  async getMeetings(): Promise<Meeting[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('meetings').select('*').order('start_time', { ascending: false });
    if (error) throw error;
    return data.map(mapMeeting);
  },
  async upsertMeeting(meeting: Meeting) {
    if (!supabase) return;
    const { data, error } = await supabase.from('meetings').upsert(unmapMeeting(meeting));
    if (error) throw error;
    return data;
  },
  async deleteMeeting(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('meetings').delete().eq('id', id);
    if (error) throw error;
  },

  // Units
  async getUnits(): Promise<Unit[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('units').select('*').order('name');
    if (error) throw error;
    return data as Unit[];
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

  // Staff
  async getStaff(): Promise<Staff[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('staff').select('*').order('full_name');
    if (error) throw error;
    return data.map(mapStaff);
  },
  async upsertStaff(staff: Staff) {
    if (!supabase) return;
    const { error } = await supabase.from('staff').upsert(unmapStaff(staff));
    if (error) throw error;
  },
  async deleteStaff(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (error) throw error;
  },

  // Participant Groups
  async getGroups(): Promise<ParticipantGroup[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('participant_groups').select('*').order('name');
    if (error) throw error;
    return data as ParticipantGroup[];
  },
  async upsertGroup(group: ParticipantGroup) {
    if (!supabase) return;
    const { error } = await supabase.from('participant_groups').upsert(group);
    if (error) throw error;
  },
  async deleteGroup(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('participant_groups').delete().eq('id', id);
    if (error) throw error;
  },

  // Endpoints
  async getEndpoints(): Promise<Endpoint[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('endpoints').select('*').order('name');
    if (error) throw error;
    return data.map(mapEndpoint);
  },
  async upsertEndpoint(endpoint: Endpoint) {
    if (!supabase) return;
    const { error } = await supabase.from('endpoints').upsert(unmapEndpoint(endpoint));
    if (error) throw error;
  },
  async deleteEndpoint(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('endpoints').delete().eq('id', id);
    if (error) throw error;
  },

  // Settings
  async getSettings(): Promise<SystemSettings | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('system_settings').select('*').eq('id', 'current').single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapSettings(data) : null;
  },
  async updateSettings(settings: SystemSettings) {
    if (!supabase) return;
    const { error } = await supabase.from('system_settings').upsert({ 
      id: 'current', 
      system_name: settings.systemName,
      short_name: settings.shortName,
      logo_base_64: settings.logoBase64,
      primary_color: settings.primaryColor
    });
    if (error) throw error;
  },

  // Users
  async getUsers(): Promise<User[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('users').select('*').order('full_name');
    if (error) throw error;
    return data.map(mapUser);
  },
  async upsertUser(user: User) {
    if (!supabase) return;
    const { error } = await supabase.from('users').upsert(unmapUser(user));
    if (error) throw error;
  },
  async deleteUser(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  }
};
