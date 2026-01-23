
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, AreaChart, Area, Legend
} from 'recharts';
import { LayoutDashboard, CalendarDays, MonitorPlay, FileText, Settings, Users, Share2, LogOut } from 'lucide-react';
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

  const isAdmin = currentUser?.role === 'ADMIN';
  const isOperator = currentUser?.role === 'OPERATOR';
  const canManageMeetings = isAdmin || isOperator;

  // Áp dụng màu chủ đạo từ cài đặt vào CSS Variable
  useEffect(() => {
    if (systemSettings.primaryColor) {
      const root = document.documentElement;
      root.style.setProperty('--primary-color', systemSettings.primaryColor);
      
      const r = parseInt(systemSettings.primaryColor.slice(1, 3), 16);
      const g = parseInt(systemSettings.primaryColor.slice(3, 5), 16);
      const b = parseInt(systemSettings.primaryColor.slice(5, 7), 16);
      root.style.setProperty('--primary-color-light', `rgba(${r}, ${g}, ${b}, 0.1)`);
    }
  }, [systemSettings.primaryColor]);

  useEffect(() => {
    if (!supabaseService.isConfigured()) return;
    const syncInitialData = async () => {
      try {
        const [cloudMeetings, cloudEndpoints, cloudUnits, cloudStaff, cloudGroups, cloudUsers, cloudSettings] = await Promise.all([
          supabaseService.getMeetings(), supabaseService.getEndpoints(), supabaseService.getUnits(),
          supabaseService.getStaff(), supabaseService.getGroups(), supabaseService.getUsers(), supabaseService.getSettings()
        ]);
        if (cloudMeetings.length > 0) setMeetings(cloudMeetings);
        if (cloudEndpoints.length > 0) setEndpoints(cloudEndpoints);
        if (cloudUnits.length > 0) setUnits(cloudUnits);
        if (cloudStaff.length > 0) setStaff(cloudStaff);
        if (cloudGroups.length > 0) setGroups(cloudGroups);
        if (cloudUsers.length > 0) setUsers(cloudUsers);
        if (cloudSettings) setSystemSettings(cloudSettings);
      } catch (err) { console.error("Sync error:", err); }
    };
    syncInitialData();

    const tables = ['meetings', 'endpoints', 'units', 'staff', 'participant_groups', 'users', 'system_settings'];
    const subscriptions = tables.map(table => {
      return supabaseService.subscribeTable(table, (payload) => {
        const { eventType, old, mappedData } = payload;
        const updateState = (setter: any, storageKey: string) => {
          setter((prev: any[]) => {
            let next = [...prev];
            if (eventType === 'INSERT') {
              const exists = prev.some(item => item.id === mappedData.id);
              if (!exists) next = [mappedData, ...prev];
            } else if (eventType === 'UPDATE') {
              next = prev.map(item => item.id === mappedData.id ? mappedData : item);
            } else if (eventType === 'DELETE') {
              const deleteId = old?.id;
              if (deleteId) next = prev.filter(item => item.id !== deleteId);
            }
            storageService.saveData(storageKey, next);
            return next;
          });
        };
        if (table === 'meetings') updateState(setMeetings, 'cth_sla_meetings');
        else if (table === 'endpoints') updateState(setEndpoints, 'cth_sla_endpoints');
        else if (table === 'system_settings' && mappedData) setSystemSettings(mappedData);
        else if (table === 'units') updateState(setUnits, 'cth_sla_units');
        else if (table === 'staff') updateState(setStaff, 'cth_sla_staff');
        else if (table === 'participant_groups') updateState(setGroups, 'cth_sla_groups');
        else if (table === 'users') updateState(setUsers, 'cth_sla_users');
      });
    });
    return () => subscriptions.forEach(sub => sub?.unsubscribe());
  }, []);

  const handleDeleteMeeting = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa cuộc họp này?')) return;
    const nextMeetings = meetings.filter(m => m.id !== id);
    setMeetings(nextMeetings);
    storageService.saveMeetings(nextMeetings);
    if (supabaseService.isConfigured()) {
      try { await supabaseService.deleteMeeting(id); } catch (err) { console.error("Cloud delete error:", err); }
    }
  };

  const handleCreateMeeting = async (meeting: Meeting) => {
    const nextMeetings = [meeting, ...meetings];
    setMeetings(nextMeetings);
    storageService.saveMeetings(nextMeetings);
    if (supabaseService.isConfigured()) {
      try { await supabaseService.upsertMeeting(meeting); } catch (err) { console.error("Cloud save error:", err); }
    }
  };

  const handleUpdateMeeting = async (meeting: Meeting) => {
    const nextMeetings = meetings.map(m => m.id === meeting.id ? meeting : m);
    setMeetings(nextMeetings);
    storageService.saveMeetings(nextMeetings);
    if (supabaseService.isConfigured()) {
      try { await supabaseService.upsertMeeting(meeting); } catch (err) { console.error("Cloud update error:", err); }
    }
    if (selectedMeeting?.id === meeting.id) setSelectedMeeting(meeting);
  };

  const handleUpdateEndpoint = async (e: Endpoint) => {
    if (supabaseService.isConfigured()) {
      try { await supabaseService.upsertEndpoint(e); } catch (err) { console.error("Cloud endpoint update error:", err); }
    }
    const updated = endpoints.map(item => item.id === e.id ? e : item);
    setEndpoints(updated);
    storageService.saveEndpoints(updated);
  };

  const handleUpdateSettings = async (settings: SystemSettings) => {
    setSystemSettings(settings);
    storageService.saveSystemSettings(settings);
    if (supabaseService.isConfigured()) {
      try {
        await supabaseService.updateSettings(settings);
      } catch (err) {
        console.error("Cập nhật cấu hình cloud thất bại:", err);
      }
    }
  };

  const dashboardStats = useMemo(() => {
    const total = meetings.length;
    const connected = endpoints.filter(e => e.status === EndpointStatus.CONNECTED).length;
    const uptime = endpoints.length > 0 ? ((connected / endpoints.length) * 100).toFixed(1) : "0";
    const recentMeetings = [...meetings].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 5);
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      const count = meetings.filter(m => new Date(m.startTime).toDateString() === d.toDateString()).length;
      return { name: dateStr, count };
    });
    return { total, connected, uptime, recentMeetings, last7Days };
  }, [meetings, endpoints]);

  const handleLogout = () => { setCurrentUser(null); setActiveTab('dashboard'); };

  if (!currentUser) return <LoginView users={users} meetings={meetings} onLoginSuccess={setCurrentUser} systemSettings={systemSettings} />;

  const primaryBgStyle = { backgroundColor: systemSettings.primaryColor };
  const primaryTextStyle = { color: systemSettings.primaryColor };
  const primaryLightBgStyle = { backgroundColor: 'var(--primary-color-light)' };

  return (
    <div className="min-h-screen flex bg-gray-50 overflow-hidden">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl flex-shrink-0 z-20">
        <div className="p-6">
          <h1 className="flex items-center gap-3">
             <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center overflow-hidden">
                {systemSettings.logoBase64 ? <img src={systemSettings.logoBase64} className="max-w-full max-h-full" /> : <span style={primaryTextStyle} className="font-bold">SL</span>}
             </div>
             <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-tight">{systemSettings.shortName}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">SLA MONITOR v3.1</span>
             </div>
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-[var(--primary-color)] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
            style={activeTab === 'dashboard' ? primaryBgStyle : {}}
          >
            <LayoutDashboard size={20} /> <span className="font-bold text-sm">Tổng quan</span>
          </button>
          <button 
            onClick={() => setActiveTab('reports')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'reports' ? 'bg-[var(--primary-color)] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
            style={activeTab === 'reports' ? primaryBgStyle : {}}
          >
            <FileText size={20} /> <span className="font-bold text-sm">Báo cáo</span>
          </button>
          <button 
            onClick={() => setActiveTab('meetings')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'meetings' ? 'bg-[var(--primary-color)] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
            style={activeTab === 'meetings' ? primaryBgStyle : {}}
          >
            <CalendarDays size={20} /> <span className="font-bold text-sm">Lịch họp</span>
          </button>
          <button 
            onClick={() => setActiveTab('monitoring')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'monitoring' ? 'bg-[var(--primary-color)] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
            style={activeTab === 'monitoring' ? primaryBgStyle : {}}
          >
            <MonitorPlay size={20} /> <span className="font-bold text-sm">Giám sát</span>
          </button>
          
          {isAdmin && (
            <div className="pt-4 border-t border-slate-800 space-y-1">
               <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Hệ thống</p>
               <button 
                onClick={() => setActiveTab('management')} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'management' ? 'bg-[var(--primary-color)] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
                style={activeTab === 'management' ? primaryBgStyle : {}}
               >
                  <Settings size={20} /> <span className="font-bold text-sm">Danh mục</span>
               </button>
               <button 
                onClick={() => setActiveTab('accounts')} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'accounts' ? 'bg-[var(--primary-color)] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
                style={activeTab === 'accounts' ? primaryBgStyle : {}}
               >
                  <Users size={20} /> <span className="font-bold text-sm">Tài khoản</span>
               </button>
               <button 
                onClick={() => setActiveTab('deployment')} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'deployment' ? 'bg-[var(--primary-color)] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
                style={activeTab === 'deployment' ? primaryBgStyle : {}}
               >
                  <Share2 size={20} /> <span className="font-bold text-sm">Triển khai</span>
               </button>
            </div>
          )}
        </nav>

        <div className="p-6 border-t border-slate-800">
           <div className="mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase">Người dùng:</p>
              <p style={primaryTextStyle} className="text-xs font-bold truncate">{currentUser.fullName}</p>
           </div>
           <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-bold text-sm">
              <LogOut size={18} /> Đăng xuất
           </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <header className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
             {activeTab === 'dashboard' ? 'Bảng điều khiển' : 
              activeTab === 'meetings' ? 'Quản lý Lịch họp' : 
              activeTab === 'monitoring' ? 'Giám sát hạ tầng' : 
              activeTab === 'reports' ? 'Báo cáo thống kê' : 'Cấu hình hệ thống'}
          </h2>
          {activeTab === 'dashboard' && canManageMeetings && (
            <button 
              onClick={() => setIsCreateModalOpen(true)} 
              style={primaryBgStyle}
              className="px-6 py-2.5 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition-all hover:brightness-110 active:scale-95 flex items-center gap-2"
            >
              <CalendarDays size={16} /> Tạo cuộc họp mới
            </button>
          )}
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Tổng số cuộc họp" value={dashboardStats.total} icon={<CalendarDays color={systemSettings.primaryColor} />} />
                <StatCard title="Điểm cầu Online" value={dashboardStats.connected} trendUp={true} icon={<MonitorPlay color={systemSettings.primaryColor} />} />
                <StatCard title="Điểm cầu Offline" value={endpoints.length - dashboardStats.connected} trendUp={false} icon={<MonitorPlay className="text-red-500" />} />
                <StatCard title="Uptime Khả dụng" value={`${dashboardStats.uptime}%`} icon={<Share2 color={systemSettings.primaryColor} />} />
             </div>

             <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                   <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-8">Xu hướng họp 7 ngày qua</h3>
                   <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={dashboardStats.last7Days}>
                            <Area type="monotone" dataKey="count" stroke={systemSettings.primaryColor} strokeWidth={4} fill={systemSettings.primaryColor} fillOpacity={0.1} />
                            <Tooltip />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-center items-center">
                   <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-8 self-start">Hiệu suất hạ tầng</h3>
                   <div style={primaryTextStyle} className="text-6xl font-black">{dashboardStats.uptime}%</div>
                   <p className="text-[10px] font-bold text-gray-400 mt-4 uppercase tracking-widest">Tỉ lệ tín hiệu sạch</p>
                </div>
             </div>

             <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                   <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Cuộc họp gần đây</h3>
                   <button onClick={() => setActiveTab('meetings')} style={primaryTextStyle} className="text-xs font-bold hover:underline">Xem tất cả</button>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                         <tr>
                            <th className="px-8 py-4">Tên cuộc họp</th>
                            <th className="px-8 py-4">Đơn vị chủ trì</th>
                            <th className="px-8 py-4">Thời gian</th>
                            <th className="px-8 py-4 text-center">Hành động</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                         {dashboardStats.recentMeetings.map(m => (
                           <tr key={m.id} className="hover:bg-gray-50 transition-all cursor-pointer" onClick={() => setSelectedMeeting(m)}>
                              <td className="px-8 py-5 font-bold text-gray-900">{m.title}</td>
                              <td className="px-8 py-5 text-gray-500">{m.hostUnit}</td>
                              <td className="px-8 py-5 font-mono text-xs">{new Date(m.startTime).toLocaleString('vi-VN')}</td>
                              <td className="px-8 py-5 text-center">
                                 <button className="px-4 py-2 text-[10px] font-black uppercase rounded-lg" style={{...primaryLightBgStyle, ...primaryTextStyle}}>Chi tiết</button>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'reports' && <ReportsPage meetings={meetings} endpoints={endpoints} />}
        {activeTab === 'meetings' && <MeetingList meetings={meetings} onSelect={setSelectedMeeting} isAdmin={canManageMeetings} onEdit={m => { setEditingMeeting(m); setIsCreateModalOpen(true); }} onDelete={handleDeleteMeeting} onAdd={() => { setEditingMeeting(null); setIsCreateModalOpen(true); }} />}
        {activeTab === 'monitoring' && <MonitoringGrid endpoints={endpoints} onUpdateEndpoint={canManageMeetings ? handleUpdateEndpoint : undefined} />}
        {activeTab === 'management' && <ManagementPage 
            units={units} staff={staff} participantGroups={groups} endpoints={endpoints} systemSettings={systemSettings} 
            onAddUnit={async u => { 
              const newUnit = { ...u, id: `U${Date.now()}` };
              if (supabaseService.isConfigured()) await supabaseService.upsertUnit(newUnit);
              const updated = [...units, newUnit]; setUnits(updated); storageService.saveUnits(updated);
            }} 
            onUpdateUnit={async u => { 
              if (supabaseService.isConfigured()) await supabaseService.upsertUnit(u);
              const updated = units.map(item => item.id === u.id ? u : item); setUnits(updated); storageService.saveUnits(updated);
            }} 
            onDeleteUnit={async id => { 
              if (supabaseService.isConfigured()) await supabaseService.deleteUnit(id);
              const updated = units.filter(u => u.id !== id); setUnits(updated); storageService.saveUnits(updated);
            }}
            onAddStaff={async s => { 
              const newStaff = { ...s, id: `S${Date.now()}` };
              if (supabaseService.isConfigured()) await supabaseService.upsertStaff(newStaff);
              const updated = [...staff, newStaff]; setStaff(updated); storageService.saveStaff(updated);
            }}
            onUpdateStaff={async s => { 
              if (supabaseService.isConfigured()) await supabaseService.upsertStaff(s);
              const updated = staff.map(item => item.id === s.id ? s : item); setStaff(updated); storageService.saveStaff(updated);
            }}
            onDeleteStaff={async id => { 
              if (supabaseService.isConfigured()) await supabaseService.deleteStaff(id);
              const updated = staff.filter(s => s.id !== id); setStaff(updated); storageService.saveStaff(updated);
            }}
            onAddGroup={async g => { 
              const newGroup = { ...g, id: `G${Date.now()}` };
              if (supabaseService.isConfigured()) await supabaseService.upsertGroup(newGroup);
              const updated = [newGroup, ...groups]; setGroups(updated); storageService.saveGroups(updated);
            }}
            onUpdateGroup={async g => { 
              if (supabaseService.isConfigured()) await supabaseService.upsertGroup(g);
              const updated = groups.map(item => item.id === g.id ? g : item); setGroups(updated); storageService.saveGroups(updated);
            }}
            onDeleteGroup={async id => { 
              if (supabaseService.isConfigured()) await supabaseService.deleteGroup(id);
              const updated = groups.filter(g => g.id !== id); setGroups(updated); storageService.saveGroups(updated);
            }}
            onAddEndpoint={async e => { 
              const newEp = { ...e, id: `${Date.now()}`, status: EndpointStatus.DISCONNECTED, lastConnected: 'N/A' };
              if (supabaseService.isConfigured()) await supabaseService.upsertEndpoint(newEp);
              const updated = [...endpoints, newEp]; setEndpoints(updated); storageService.saveEndpoints(updated);
            }}
            onUpdateEndpoint={handleUpdateEndpoint}
            onDeleteEndpoint={async id => { 
              if (supabaseService.isConfigured()) await supabaseService.deleteEndpoint(id);
              const updated = endpoints.filter(e => e.id !== id); setEndpoints(updated); storageService.saveEndpoints(updated);
            }}
            onUpdateSettings={handleUpdateSettings} 
        />}
        {activeTab === 'accounts' && <UserManagement users={users} currentUser={currentUser!} onAddUser={async u => {
            const newUser = { ...u, id: `${Date.now()}` };
            if (supabaseService.isConfigured()) await supabaseService.upsertUser(newUser);
            const updated = [...users, newUser]; setUsers(updated); storageService.saveUsers(updated);
        }} onUpdateUser={async u => {
            if (supabaseService.isConfigured()) await supabaseService.upsertUser(u);
            const updated = users.map(item => item.id === u.id ? u : item); setUsers(updated); storageService.saveUsers(updated);
        }} onDeleteUser={async id => {
            if (supabaseService.isConfigured()) await supabaseService.deleteUser(id);
            const updated = users.filter(u => u.id !== id); setUsers(updated); storageService.saveUsers(updated);
        }} />}
        {activeTab === 'deployment' && <ExportPage />}
      </main>

      {selectedMeeting && <MeetingDetailModal meeting={selectedMeeting} onClose={() => setSelectedMeeting(null)} onUpdate={handleUpdateMeeting} />}
      {isCreateModalOpen && <CreateMeetingModal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setEditingMeeting(null); }} onCreate={handleCreateMeeting} onUpdate={handleUpdateMeeting} units={units} staff={staff} availableEndpoints={endpoints} editingMeeting={editingMeeting} />}
    </div>
  );
};

export default App;
