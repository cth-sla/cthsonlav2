
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import { Meeting, Endpoint, EndpointStatus, Unit, Staff, ParticipantGroup, User, SystemSettings } from './types';
import StatCard from './components/StatCard';
import MeetingList from './components/MeetingList';
import MonitoringGrid from './components/MonitoringGrid';
import ManagementPage from './components/ManagementPage';
import UserManagement from './components/UserManagement';
import ReportsPage from './components/ReportsPage';
import LoginView from './components/LoginView';
import CreateMeetingModal from './components/CreateMeetingModal';
import MeetingDetailModal from './components/MeetingDetailModal';
import ExportPage from './components/ExportPage';
import { storageService } from './services/storageService';
import { supabaseService } from './services/supabaseService';

storageService.init();

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'meetings' | 'monitoring' | 'management' | 'accounts' | 'reports' | 'deployment'>('dashboard');
  
  const [meetings, setMeetings] = useState<Meeting[]>(() => storageService.getMeetings());
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const [endpoints, setEndpoints] = useState<Endpoint[]>(() => storageService.getEndpoints());
  const [units, setUnits] = useState<Unit[]>(() => storageService.getUnits());
  const [staff, setStaff] = useState<Staff[]>(() => storageService.getStaff());
  const [groups, setGroups] = useState<ParticipantGroup[]>(() => storageService.getGroups());
  const [users, setUsers] = useState<User[]>(() => storageService.getUsers());
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => storageService.getSystemSettings());

  // Supabase Initial Sync & Real-time Subscriptions
  useEffect(() => {
    if (!supabaseService.isConfigured()) return;

    const syncInitialData = async () => {
      console.log('🔄 Đang đồng bộ dữ liệu ban đầu từ Supabase Cloud...');
      const [cloudMeetings, cloudEndpoints, cloudUnits, cloudStaff, cloudGroups, cloudUsers, cloudSettings] = await Promise.all([
        supabaseService.getMeetings(),
        supabaseService.getEndpoints(),
        supabaseService.getUnits(),
        supabaseService.getStaff(),
        supabaseService.getGroups(),
        supabaseService.getUsers(),
        supabaseService.getSettings()
      ]);

      if (cloudMeetings.length > 0) { setMeetings(cloudMeetings); storageService.saveMeetings(cloudMeetings); }
      if (cloudEndpoints.length > 0) { setEndpoints(cloudEndpoints); storageService.saveEndpoints(cloudEndpoints); }
      if (cloudUnits.length > 0) { setUnits(cloudUnits); storageService.saveUnits(cloudUnits); }
      if (cloudStaff.length > 0) { setStaff(cloudStaff); storageService.saveStaff(cloudStaff); }
      if (cloudGroups.length > 0) { setGroups(cloudGroups); storageService.saveGroups(cloudGroups); }
      if (cloudUsers.length > 0) { setUsers(cloudUsers); storageService.saveUsers(cloudUsers); }
      if (cloudSettings) { setSystemSettings(cloudSettings); storageService.saveSystemSettings(cloudSettings); }
    };

    syncInitialData();

    // Thiết lập Real-time listeners cho tất cả các bảng chính
    const tables = ['meetings', 'endpoints', 'units', 'staff', 'participant_groups', 'users', 'system_settings'];
    const subscriptions = tables.map(table => {
      return supabaseService.subscribeTable(table, (payload) => {
        const { eventType, old, mappedData } = payload;
        
        console.log(`📡 Real-time update in [${table}]:`, eventType);

        const updateState = (setter: any, storageKey: string) => {
          setter((prev: any[]) => {
            let next;
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
              const exists = prev.some(item => item.id === mappedData.id);
              if (exists) {
                next = prev.map(item => item.id === mappedData.id ? mappedData : item);
              } else {
                next = [mappedData, ...prev];
              }
            } else if (eventType === 'DELETE') {
              next = prev.filter(item => item.id !== old.id);
            } else {
              next = prev;
            }
            
            if (next) storageService.saveData(storageKey, next);
            return next;
          });
        };

        if (table === 'meetings') updateState(setMeetings, 'cth_sla_meetings');
        else if (table === 'endpoints') updateState(setEndpoints, 'cth_sla_endpoints');
        else if (table === 'units') updateState(setUnits, 'cth_sla_units');
        else if (table === 'staff') updateState(setStaff, 'cth_sla_staff');
        else if (table === 'participant_groups') updateState(setGroups, 'cth_sla_groups');
        else if (table === 'users') updateState(setUsers, 'cth_sla_users');
        else if (table === 'system_settings' && mappedData) {
          setSystemSettings(mappedData);
          storageService.saveSystemSettings(mappedData);
        }
      });
    });

    return () => {
      subscriptions.forEach(sub => sub?.unsubscribe());
    };
  }, []);

  // Inject primary color into CSS
  useEffect(() => {
    const root = document.documentElement;
    if (systemSettings.primaryColor) {
      root.style.setProperty('--primary-color', systemSettings.primaryColor);
      root.style.setProperty('--primary-color-bg', `${systemSettings.primaryColor}15`);
      root.style.setProperty('--primary-color-hover', `${systemSettings.primaryColor}dd`);
    }
  }, [systemSettings.primaryColor]);

  const stats = useMemo(() => {
    const total = meetings.length;
    const connected = endpoints.filter(e => e.status === EndpointStatus.CONNECTED).length;
    const disconnected = endpoints.filter(e => e.status === EndpointStatus.DISCONNECTED).length;
    return { total, connected, disconnected };
  }, [meetings, endpoints]);

  const unitStatsThisMonth = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const map: Record<string, number> = {};
    meetings.forEach(m => {
      const d = new Date(m.startTime);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        map[m.hostUnit] = (map[m.hostUnit] || 0) + 1;
      }
    });
    
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [meetings]);

  const isAdmin = currentUser?.role === 'ADMIN';

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleCreateMeeting = async (newMeeting: Meeting) => {
    if (supabaseService.isConfigured()) {
      const { error } = await supabaseService.upsertMeeting(newMeeting) as any;
      if (error) {
        alert("Lỗi khi thêm cuộc họp: " + error.message);
        return;
      }
    } else {
      const updated = [newMeeting, ...meetings];
      setMeetings(updated);
      storageService.saveMeetings(updated);
    }
    setIsCreateModalOpen(false);
  };

  const handleUpdateMeeting = async (updatedMeeting: Meeting) => {
    if (supabaseService.isConfigured()) {
      const { error } = await supabaseService.upsertMeeting(updatedMeeting) as any;
      if (error) {
        alert("Lỗi khi cập nhật cuộc họp: " + error.message);
        return;
      }
    } else {
      const updated = meetings.map(m => m.id === updatedMeeting.id ? updatedMeeting : m);
      setMeetings(updated);
      storageService.saveMeetings(updated);
    }
    setEditingMeeting(null);
    setIsCreateModalOpen(false);
  };

  const handleDeleteMeeting = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch họp này?')) {
      if (supabaseService.isConfigured()) {
        const { error } = await supabaseService.deleteMeeting(id) as any;
        if (error) alert("Lỗi khi xóa cuộc họp: " + error.message);
      } else {
        const updated = meetings.filter(m => m.id !== id);
        setMeetings(updated);
        storageService.saveMeetings(updated);
      }
    }
  };

  if (!currentUser) return <LoginView users={users} meetings={meetings} onLoginSuccess={setCurrentUser} systemSettings={systemSettings} />;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50" style={{ '--theme-primary': systemSettings.primaryColor } as any}>
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 shadow-xl z-10 flex flex-col">
        <div className="p-6">
          <h1 className="flex items-start gap-3">
            <div className="relative group shrink-0">
               <div className="absolute -inset-1 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" style={{ background: `linear-gradient(to right, ${systemSettings.primaryColor}, #22d3ee)` }}></div>
               <div className="relative p-2 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center overflow-hidden w-10 h-10">
                {systemSettings.logoBase64 ? (
                  <img src={systemSettings.logoBase64} alt="Logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <svg className="w-6 h-6" style={{ color: '#22d3ee' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20 7L12 12L4 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
               </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-tight">{systemSettings.shortName}</span>
              <span className="text-[9px] font-black uppercase mt-1 opacity-80" style={{ color: systemSettings.primaryColor }}>{systemSettings.systemName}</span>
            </div>
          </h1>
          {supabaseService.isConfigured() && (
            <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">Database Cloud Ready</span>
            </div>
          )}
        </div>

        <nav className="mt-2 px-4 space-y-1 flex-1 overflow-y-auto">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-slate-800' : 'text-slate-400 hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" /></svg>
            <span className="font-semibold text-sm">Tổng quan</span>
          </button>
          <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'reports' ? 'bg-slate-800' : 'text-slate-400 hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="font-semibold text-sm">Báo cáo</span>
          </button>
          <button onClick={() => setActiveTab('meetings')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'meetings' ? 'bg-slate-800' : 'text-slate-400 hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="font-semibold text-sm">Lịch họp</span>
          </button>
          {isAdmin && (
            <>
              <div className="pt-4 pb-1 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Quản trị</div>
              <button onClick={() => setActiveTab('monitoring')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'monitoring' ? 'bg-slate-800' : 'text-slate-400 hover:bg-slate-800'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2" /></svg>
                <span className="font-semibold text-sm">Giám sát</span>
              </button>
              <button onClick={() => setActiveTab('management')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'management' ? 'bg-slate-800' : 'text-slate-400 hover:bg-slate-800'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4" /></svg>
                <span className="font-semibold text-sm">Danh mục</span>
              </button>
              <button onClick={() => setActiveTab('accounts')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'accounts' ? 'bg-slate-800' : 'text-slate-400 hover:bg-slate-800'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>
                <span className="font-semibold text-sm">Tài khoản</span>
              </button>
              <button onClick={() => setActiveTab('deployment')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'deployment' ? 'bg-slate-800' : 'text-slate-400 hover:bg-slate-800'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8" /></svg>
                <span className="font-semibold text-sm">Triển khai</span>
              </button>
            </>
          )}
        </nav>
        
        <div className="p-4 border-t border-slate-800/50">
          <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-semibold text-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            {activeTab === 'dashboard' ? 'Thống kê & Phân tích' : 
             activeTab === 'meetings' ? 'Danh sách lịch họp' : 
             activeTab === 'monitoring' ? 'Giám sát Điểm cầu' : 
             activeTab === 'management' ? 'Quản lý Danh mục' :
             activeTab === 'reports' ? 'Báo cáo trích xuất' :
             activeTab === 'accounts' ? 'Quản lý Tài khoản' : 
             activeTab === 'deployment' ? 'Phát hành & Sao lưu' : 'Triển khai'}
          </h2>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-8 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              <StatCard title="Tổng số cuộc họp" value={stats.total} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3" /></svg>} />
              <StatCard title="Tổng điểm cầu" value={endpoints.length} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9" /></svg>} />
              <StatCard title="Online" value={stats.connected} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.636 18.364" /></svg>} />
              <StatCard title="Offline" value={stats.disconnected} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636" /></svg>} />
              <StatCard title="Khả dụng" value="98.2%" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2" /></svg>} />
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={unitStatsThisMonth}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="count" fill={systemSettings.primaryColor} radius={[8, 8, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && <ReportsPage meetings={meetings} endpoints={endpoints} />}

        {activeTab === 'meetings' && (
          <MeetingList meetings={meetings} onSelect={setSelectedMeeting} isAdmin={isAdmin} onEdit={(m) => { setEditingMeeting(m); setIsCreateModalOpen(true); }} onDelete={handleDeleteMeeting} onAdd={() => { setEditingMeeting(null); setIsCreateModalOpen(true); }} />
        )}
        
        {activeTab === 'monitoring' && <MonitoringGrid endpoints={endpoints} onUpdateEndpoint={isAdmin ? async e => {
          if (supabaseService.isConfigured()) {
            const { error } = await supabaseService.upsertEndpoint(e) as any;
            if (error) alert("Lỗi khi cập nhật điểm cầu: " + error.message);
          } else {
            const updated = endpoints.map(item => item.id === e.id ? e : item);
            setEndpoints(updated);
            storageService.saveEndpoints(updated);
          }
        } : undefined} />}

        {activeTab === 'management' && isAdmin && (
          <ManagementPage 
            units={units} staff={staff} participantGroups={groups} endpoints={endpoints} systemSettings={systemSettings}
            onAddUnit={async u => { 
              const newUnit = { ...u, id: `U${Date.now()}` };
              if (supabaseService.isConfigured()) {
                const { error } = await supabaseService.upsertUnit(newUnit) as any;
                if (error) alert("Lỗi: " + error.message);
              } else { const updated = [...units, newUnit]; setUnits(updated); storageService.saveUnits(updated); }
            }}
            onUpdateUnit={async u => { 
              if (supabaseService.isConfigured()) {
                const { error } = await supabaseService.upsertUnit(u) as any;
                if (error) alert("Lỗi: " + error.message);
              } else { const updated = units.map(item => item.id === u.id ? u : item); setUnits(updated); storageService.saveUnits(updated); }
            }}
            onDeleteUnit={async id => { 
              if (window.confirm('Xóa đơn vị này?')) { 
                if (supabaseService.isConfigured()) {
                  const { error } = await supabaseService.deleteUnit(id) as any;
                  if (error) alert("Lỗi: " + error.message);
                } else { const updated = units.filter(u => u.id !== id); setUnits(updated); storageService.saveUnits(updated); }
              }
            }}
            onAddStaff={async s => { 
              const newStaff = { ...s, id: `S${Date.now()}` };
              if (supabaseService.isConfigured()) {
                const { error } = await supabaseService.upsertStaff(newStaff) as any;
                if (error) alert("Lỗi: " + error.message);
              } else { const updated = [...staff, newStaff]; setStaff(updated); storageService.saveStaff(updated); }
            }}
            onUpdateStaff={async s => { 
              if (supabaseService.isConfigured()) {
                const { error } = await supabaseService.upsertStaff(s) as any;
                if (error) alert("Lỗi: " + error.message);
              } else { const updated = staff.map(item => item.id === s.id ? s : item); setStaff(updated); storageService.saveStaff(updated); }
            }}
            onDeleteStaff={async id => { 
              if (window.confirm('Xóa cán bộ này?')) { 
                if (supabaseService.isConfigured()) {
                  const { error } = await supabaseService.deleteStaff(id) as any;
                  if (error) alert("Lỗi: " + error.message);
                } else { const updated = staff.filter(s => s.id !== id); setStaff(updated); storageService.saveStaff(updated); }
              }
            }}
            onAddEndpoint={async e => { 
              const newEp = { ...e, id: `${Date.now()}`, status: EndpointStatus.DISCONNECTED, lastConnected: 'N/A' };
              if (supabaseService.isConfigured()) {
                const { error } = await supabaseService.upsertEndpoint(newEp) as any;
                if (error) alert("Lỗi: " + error.message);
              } else { const updated = [...endpoints, newEp]; setEndpoints(updated); storageService.saveEndpoints(updated); }
            }}
            onUpdateEndpoint={async e => { 
              if (supabaseService.isConfigured()) {
                const { error } = await supabaseService.upsertEndpoint(e) as any;
                if (error) alert("Lỗi: " + error.message);
              } else { const updated = endpoints.map(item => item.id === e.id ? e : item); setEndpoints(updated); storageService.saveEndpoints(updated); }
            }}
            onDeleteEndpoint={async id => { 
              if (window.confirm('Xóa điểm cầu này?')) { 
                if (supabaseService.isConfigured()) {
                  const { error } = await supabaseService.deleteEndpoint(id) as any;
                  if (error) alert("Lỗi: " + error.message);
                } else { const updated = endpoints.filter(e => e.id !== id); setEndpoints(updated); storageService.saveEndpoints(updated); }
              }
            }}
            onAddGroup={async g => { 
              const newGroup = { ...g, id: `G${Date.now()}` };
              if (supabaseService.isConfigured()) {
                const { error } = await supabaseService.upsertGroup(newGroup) as any;
                if (error) alert("Lỗi: " + error.message);
              } else { const updated = [...groups, newGroup]; setGroups(updated); storageService.saveGroups(updated); }
            }}
            onUpdateGroup={async g => { 
              if (supabaseService.isConfigured()) {
                const { error } = await supabaseService.upsertGroup(g) as any;
                if (error) alert("Lỗi: " + error.message);
              } else { const updated = groups.map(item => item.id === g.id ? g : item); setGroups(updated); storageService.saveGroups(updated); }
            }}
            onDeleteGroup={async id => { 
              if (window.confirm('Xóa thành phần này?')) { 
                if (supabaseService.isConfigured()) {
                  const { error } = await supabaseService.deleteGroup(id) as any;
                  if (error) alert("Lỗi: " + error.message);
                } else { const updated = groups.filter(g => g.id !== id); setGroups(updated); storageService.saveGroups(updated); }
              }
            }}
            onUpdateSettings={async s => { 
              if (supabaseService.isConfigured()) {
                const { error } = await supabaseService.updateSettings(s) as any;
                if (error) alert("Lỗi: " + error.message);
              } else { setSystemSettings(s); storageService.saveSystemSettings(s); }
            }}
          />
        )}

        {activeTab === 'accounts' && isAdmin && (
          <UserManagement users={users} currentUser={currentUser} 
            onAddUser={async u => { 
              const newUser = { ...u, id: `${Date.now()}` }; 
              if (supabaseService.isConfigured()) {
                const { error } = await supabaseService.upsertUser(newUser) as any;
                if (error) alert("Lỗi: " + error.message);
              } else { const updated = [...users, newUser]; setUsers(updated); storageService.saveUsers(updated); }
            }} 
            onUpdateUser={async u => { 
              if (supabaseService.isConfigured()) {
                const { error } = await supabaseService.upsertUser(u) as any;
                if (error) alert("Lỗi: " + error.message);
              } else { const updated = users.map(item => item.id === u.id ? u : item); setUsers(updated); storageService.saveUsers(updated); }
            }} 
            onDeleteUser={async id => { 
              if (window.confirm('Xóa người dùng này?')) { 
                if (supabaseService.isConfigured()) {
                  const { error } = await supabaseService.deleteUser(id) as any;
                  if (error) alert("Lỗi: " + error.message);
                } else { const updated = users.filter(u => u.id !== id); setUsers(updated); storageService.saveUsers(updated); }
              }
            }} 
          />
        )}

        {activeTab === 'deployment' && isAdmin && <ExportPage />}
      </main>

      {selectedMeeting && <MeetingDetailModal meeting={selectedMeeting} onClose={() => setSelectedMeeting(null)} onUpdate={handleUpdateMeeting} />}

      {isCreateModalOpen && <CreateMeetingModal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setEditingMeeting(null); }} onCreate={handleCreateMeeting} onUpdate={handleUpdateMeeting} units={units} staff={staff} availableEndpoints={endpoints} editingMeeting={editingMeeting} />}
    </div>
  );
};

export default App;
