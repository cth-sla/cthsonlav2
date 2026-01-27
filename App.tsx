
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, Legend
} from 'recharts';
import { LayoutDashboard, CalendarDays, MonitorPlay, FileText, Settings, Users, Share2, LogOut, Menu, X, Activity, BarChart3, Building2, User as UserIcon } from 'lucide-react';
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

const VIBRANT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

storageService.init();

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'meetings' | 'monitoring' | 'management' | 'accounts' | 'reports' | 'deployment'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [meetings, setMeetings] = useState<Meeting[]>(() => storageService.getMeetings());
  const [endpoints, setEndpoints] = useState<Endpoint[]>(() => storageService.getEndpoints());
  const [units, setUnits] = useState<Unit[]>(() => storageService.getUnits());
  const [staff, setStaff] = useState<Staff[]>(() => storageService.getStaff());
  const [groups, setGroups] = useState<ParticipantGroup[]>(() => storageService.getGroups());
  const [users, setUsers] = useState<User[]>(() => storageService.getUsers());
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => storageService.getSystemSettings());
  
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasSyncedOnce, setHasSyncedOnce] = useState(false);

  const isAdmin = currentUser?.role === 'ADMIN';
  const isOperator = currentUser?.role === 'OPERATOR';
  const canManageMeetings = isAdmin || isOperator;

  useEffect(() => {
    const syncData = async () => {
      if (!supabaseService.isConfigured()) return;
      
      setIsSyncing(true);
      try {
        const [cloudMeetings, cloudEndpoints, cloudUnits, cloudStaff, cloudGroups, cloudUsers, cloudSettings] = await Promise.all([
          supabaseService.getMeetings(),
          supabaseService.getEndpoints(),
          supabaseService.getUnits(),
          supabaseService.getStaff(),
          supabaseService.getGroups(),
          supabaseService.getUsers(),
          supabaseService.getSettings()
        ]);

        setMeetings(cloudMeetings); storageService.saveMeetings(cloudMeetings);
        setEndpoints(cloudEndpoints); storageService.saveEndpoints(cloudEndpoints);
        setUnits(cloudUnits); storageService.saveUnits(cloudUnits);
        setStaff(cloudStaff); storageService.saveStaff(cloudStaff);
        setGroups(cloudGroups); storageService.saveGroups(cloudGroups);
        setUsers(cloudUsers); storageService.saveUsers(cloudUsers);
        
        if (cloudSettings) {
          setSystemSettings(cloudSettings);
          storageService.saveSystemSettings(cloudSettings);
        }
        
        setLastRefreshed(new Date());
        setHasSyncedOnce(true);
      } catch (err) {
        console.error("Đồng bộ thất bại:", err);
      } finally {
        setIsSyncing(false);
      }
    };

    syncData();

    const tables = ['meetings', 'endpoints', 'units', 'staff', 'participant_groups', 'users', 'system_settings'];
    const subscriptions = tables.map(table => {
      return supabaseService.subscribeTable(table, (payload) => {
        const { eventType, old, mappedData } = payload;
        
        const updateMap: Record<string, any> = {
          'meetings': { state: setMeetings, storage: 'cth_sla_meetings' },
          'endpoints': { state: setEndpoints, storage: 'cth_sla_endpoints' },
          'units': { state: setUnits, storage: 'cth_sla_units' },
          'staff': { state: setStaff, storage: 'cth_sla_staff' },
          'participant_groups': { state: setGroups, storage: 'cth_sla_groups' },
          'users': { state: setUsers, storage: 'cth_sla_users' }
        };

        if (table === 'system_settings' && mappedData) {
          setSystemSettings(mappedData);
          storageService.saveSystemSettings(mappedData);
          return;
        }

        const config = updateMap[table];
        if (config) {
          config.state((prev: any[]) => {
            let next = [...prev];
            if (eventType === 'INSERT') {
              if (!prev.some(item => item.id === mappedData.id)) next = [mappedData, ...prev];
            } else if (eventType === 'UPDATE') {
              next = prev.map(item => item.id === mappedData.id ? mappedData : item);
            } else if (eventType === 'DELETE') {
              next = prev.filter(item => item.id !== old.id);
            }
            storageService.saveData(config.storage, next);
            return next;
          });
        }
      });
    });

    return () => subscriptions.forEach(sub => sub?.unsubscribe());
  }, []);

  const dashboardStats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const validMeetings = meetings.filter(m => m.status !== 'CANCELLED');

    const weeklyMeetings = validMeetings.filter(m => new Date(m.startTime) >= startOfWeek);
    const monthlyMeetings = validMeetings.filter(m => new Date(m.startTime) >= startOfMonth);
    const yearlyMeetings = validMeetings.filter(m => new Date(m.startTime) >= startOfYear);

    const unitMap: Record<string, number> = {};
    validMeetings.forEach(m => {
      unitMap[m.hostUnit] = (unitMap[m.hostUnit] || 0) + 1;
    });

    const unitStats = Object.entries(unitMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const topUnit = unitStats[0]?.name || "Chưa xác định";
    const connected = endpoints.filter(e => e.status === EndpointStatus.CONNECTED).length;
    const uptime = endpoints.length > 0 ? ((connected / endpoints.length) * 100).toFixed(1) : "0";

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      const count = validMeetings.filter(m => new Date(m.startTime).toDateString() === d.toDateString()).length;
      return { name: dateStr, count };
    });

    return {
      weekly: weeklyMeetings.length,
      monthly: monthlyMeetings.length,
      yearly: yearlyMeetings.length,
      topUnit,
      unitStats,
      uptime,
      last7Days,
      recentMeetings: [...meetings].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 5)
    };
  }, [meetings, endpoints]);

  const handleLogout = () => { setCurrentUser(null); setActiveTab('dashboard'); };
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const handleUpdateMeeting = async (meeting: Meeting) => {
    const nextMeetings = meetings.map(m => m.id === meeting.id ? meeting : m);
    setMeetings(nextMeetings);
    storageService.saveMeetings(nextMeetings);
    if (supabaseService.isConfigured()) {
      try { await supabaseService.upsertMeeting(meeting); } catch (err) { console.error("Update failed:", err); }
    }
    if (selectedMeeting?.id === meeting.id) setSelectedMeeting(meeting);
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!window.confirm('Xóa cuộc họp này vĩnh viễn?')) return;
    const nextMeetings = meetings.filter(m => m.id !== id);
    setMeetings(nextMeetings);
    storageService.saveMeetings(nextMeetings);
    if (supabaseService.isConfigured()) {
      try { await supabaseService.deleteMeeting(id); } catch (err) { console.error("Delete failed:", err); }
    }
  };

  if (!currentUser) return <LoginView users={users} meetings={meetings} onLoginSuccess={setCurrentUser} systemSettings={systemSettings} />;

  const primaryBgStyle = { backgroundColor: systemSettings.primaryColor };
  const primaryTextStyle = { color: systemSettings.primaryColor };

  return (
    <div className="min-h-screen flex bg-gray-50 overflow-hidden relative">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col shadow-2xl flex-shrink-0 z-30 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-3 min-w-0">
             <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                {systemSettings.logoBase64 ? <img src={systemSettings.logoBase64} alt="Logo" className="max-w-full max-h-full" /> : <span style={primaryTextStyle} className="font-bold text-sm">SL</span>}
             </div>
             <div className="flex flex-col min-w-0">
                <span className="text-xs font-black uppercase tracking-tight truncate">{systemSettings.shortName}</span>
                <span className="text-[9px] font-bold text-blue-400 uppercase mt-0.5 truncate">{currentUser.fullName}</span>
             </div>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
          <button onClick={() => handleTabChange('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-[var(--primary-color)] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`} style={activeTab === 'dashboard' ? primaryBgStyle : {}}><LayoutDashboard size={20} /> <span className="font-bold text-sm">Tổng quan</span></button>
          <button onClick={() => handleTabChange('reports')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'reports' ? 'bg-[var(--primary-color)] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`} style={activeTab === 'reports' ? primaryBgStyle : {}}><FileText size={20} /> <span className="font-bold text-sm">Báo cáo</span></button>
          <button onClick={() => handleTabChange('meetings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'meetings' ? 'bg-[var(--primary-color)] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`} style={activeTab === 'meetings' ? primaryBgStyle : {}}><CalendarDays size={20} /> <span className="font-bold text-sm">Lịch họp</span></button>
          {isAdmin && (
            <button onClick={() => handleTabChange('monitoring')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'monitoring' ? 'bg-[var(--primary-color)] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`} style={activeTab === 'monitoring' ? primaryBgStyle : {}}><MonitorPlay size={20} /> <span className="font-bold text-sm">Giám sát</span></button>
          )}
          {isAdmin && (
            <div className="pt-4 border-t border-slate-800 space-y-1">
               <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Hệ thống</p>
               <button onClick={() => handleTabChange('management')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'management' ? 'bg-[var(--primary-color)] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`} style={activeTab === 'management' ? primaryBgStyle : {}}><Settings size={20} /> <span className="font-bold text-sm">Danh mục</span></button>
               <button onClick={() => handleTabChange('accounts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'accounts' ? 'bg-[var(--primary-color)] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`} style={activeTab === 'accounts' ? primaryBgStyle : {}}><Users size={20} /> <span className="font-bold text-sm">Tài khoản</span></button>
               <button onClick={() => handleTabChange('deployment')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'deployment' ? 'bg-[var(--primary-color)] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`} style={activeTab === 'deployment' ? primaryBgStyle : {}}><Share2 size={20} /> <span className="font-bold text-sm">Triển khai</span></button>
            </div>
          )}
        </nav>

        <div className="p-6 border-t border-slate-800">
           <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-bold text-sm"><LogOut size={18} /> Đăng xuất</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 md:px-8 justify-between shrink-0 shadow-sm">
          <button onClick={toggleSidebar} className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><Menu size={24} /></button>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 rounded-full">
                <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-spin' : 'bg-emerald-500 animate-pulse'}`}></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {isSyncing ? 'Đồng bộ...' : `Cloud: ${lastRefreshed.toLocaleTimeString('vi-VN', { hour12: false })}`}
                </span>
             </div>
             {hasSyncedOnce && !isSyncing && (
                <span className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 hidden sm:inline-block">Live Cloud Data</span>
             )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-blue-50/50 px-4 py-1.5 rounded-full border border-blue-100/50">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-black shadow-lg shadow-blue-200">
                {currentUser?.fullName?.split(' ').filter(Boolean).pop()?.[0] || 'U'}
              </div>
              <p className="text-xs font-black text-gray-700 hidden sm:block">
                <span style={primaryTextStyle}>{currentUser?.fullName}</span>
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  <StatCard title="Họp trong Tuần" value={dashboardStats.weekly} icon={<CalendarDays color={systemSettings.primaryColor} />} description="Tổng số cuộc họp diễn ra trong tuần này." />
                  <StatCard title="Họp trong Tháng" value={dashboardStats.monthly} icon={<FileText color={systemSettings.primaryColor} />} description="Tổng số cuộc họp diễn ra trong tháng này." />
                  <StatCard title="Họp trong Năm" value={dashboardStats.yearly} icon={<BarChart3 className="text-amber-500" />} description={`Tổng số cuộc họp trong năm ${new Date().getFullYear()}.`} />
                  <StatCard title="Uptime Hạ tầng" value={`${dashboardStats.uptime}%`} icon={<Activity color={systemSettings.primaryColor} />} description="Tỷ lệ điểm cầu đang trực tuyến." />
               </div>

               <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  <div className="xl:col-span-2 bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                     <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-8">Tần suất họp (7 ngày qua)</h3>
                     <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={dashboardStats.last7Days}>
                              <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={systemSettings.primaryColor} stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor={systemSettings.primaryColor} stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="count" stroke={systemSettings.primaryColor} strokeWidth={4} fill="url(#colorCount)" />
                              <XAxis dataKey="name" fontSize={10} fontWeight="bold" tick={{fill: '#94a3b8'}} />
                              <YAxis fontSize={10} fontWeight="bold" tick={{fill: '#94a3b8'}} />
                              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
                  
                  <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col">
                     <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-8">Top Đơn vị chủ trì</h3>
                     <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart layout="vertical" data={dashboardStats.unitStats} margin={{ left: 20 }}>
                              <XAxis type="number" hide />
                              <YAxis dataKey="name" type="category" fontSize={9} fontWeight="bold" width={80} tick={{fill: '#64748b'}} />
                              <Tooltip cursor={{fill: 'transparent'}} />
                              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                 {dashboardStats.unitStats.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={VIBRANT_COLORS[index % VIBRANT_COLORS.length]} />
                                 ))}
                              </Bar>
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="mt-4 pt-4 border-t border-gray-50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đơn vị tích cực nhất:</p>
                        <p className="text-sm font-black text-slate-900 mt-1 truncate flex items-center gap-2">
                           <Building2 size={14} className="text-blue-500" />
                           {dashboardStats.topUnit}
                        </p>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 md:p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                     <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Cuộc họp gần đây</h3>
                     <button onClick={() => setActiveTab('meetings')} style={primaryTextStyle} className="text-xs font-bold hover:underline">Xem tất cả</button>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm min-w-[800px]">
                        <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                           <tr>
                              <th className="px-8 py-4">Tên cuộc họp</th>
                              <th className="px-8 py-4">Đơn vị chủ trì</th>
                              <th className="px-8 py-4">Thời gian</th>
                              <th className="px-8 py-4 text-center">Trạng thái</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                           {dashboardStats.recentMeetings.map(m => (
                             <tr key={m.id} className="hover:bg-gray-50 transition-all cursor-pointer" onClick={() => setSelectedMeeting(m)}>
                                <td className="px-8 py-5">
                                   <div className={`font-bold text-sm line-clamp-1 ${m.status === 'CANCELLED' ? 'text-red-600 line-through' : m.status === 'POSTPONED' ? 'text-amber-600 italic' : 'text-gray-900'}`}>
                                     {m.title}
                                   </div>
                                   <div className="text-[10px] text-gray-400 mt-1 font-mono uppercase tracking-tighter">ID: {m.id}</div>
                                </td>
                                <td className="px-8 py-5">
                                   <div className="font-bold text-[11px] text-slate-700">{m.hostUnit}</div>
                                </td>
                                <td className="px-8 py-5">
                                   <div className="text-[11px] font-bold text-blue-600">{new Date(m.startTime).toLocaleTimeString('vi-VN', { hour12: false })}</div>
                                   <div className="text-gray-500 text-[10px] mt-0.5">{new Date(m.startTime).toLocaleDateString('vi-VN')}</div>
                                </td>
                                <td className="px-8 py-5 text-center">
                                   {m.status === 'CANCELLED' ? (
                                      <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[9px] font-black uppercase rounded">Đã huỷ</span>
                                   ) : m.status === 'POSTPONED' ? (
                                      <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[9px] font-black uppercase rounded">Tạm hoãn</span>
                                   ) : (
                                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[9px] font-black uppercase rounded">Hợp lệ</span>
                                   )}
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'reports' && <ReportsPage meetings={meetings} endpoints={endpoints} currentUser={currentUser} />}
          {activeTab === 'meetings' && <MeetingList meetings={meetings} onSelect={setSelectedMeeting} isAdmin={canManageMeetings} onEdit={m => { setEditingMeeting(m); setIsCreateModalOpen(true); }} onDelete={handleDeleteMeeting} onAdd={() => { setEditingMeeting(null); setIsCreateModalOpen(true); }} onUpdate={handleUpdateMeeting} />}
          {activeTab === 'monitoring' && isAdmin && <MonitoringGrid endpoints={endpoints} onUpdateEndpoint={async (e) => {
              if (supabaseService.isConfigured()) await supabaseService.upsertEndpoint(e);
              setEndpoints(prev => prev.map(item => item.id === e.id ? e : item));
          }} />}
          {activeTab === 'management' && <ManagementPage 
              units={units} staff={staff} participantGroups={groups} endpoints={endpoints} systemSettings={systemSettings} 
              onAddUnit={async u => { 
                const newUnit = { ...u, id: `U${Date.now()}` };
                if (supabaseService.isConfigured()) await supabaseService.upsertUnit(newUnit);
                setUnits(prev => [...prev, newUnit]);
              }} 
              onUpdateUnit={async u => { 
                if (supabaseService.isConfigured()) await supabaseService.upsertUnit(u);
                setUnits(prev => prev.map(item => item.id === u.id ? u : item));
              }} 
              onDeleteUnit={async id => { 
                if (supabaseService.isConfigured()) await supabaseService.deleteUnit(id);
                setUnits(prev => prev.filter(u => u.id !== id));
              }}
              onAddStaff={async s => { 
                const newStaff = { ...s, id: `S${Date.now()}` };
                if (supabaseService.isConfigured()) await supabaseService.upsertStaff(newStaff);
                setStaff(prev => [...prev, newStaff]);
              }}
              onUpdateStaff={async s => { 
                if (supabaseService.isConfigured()) await supabaseService.upsertStaff(s);
                setStaff(prev => prev.map(item => item.id === s.id ? s : item));
              }}
              onDeleteStaff={async id => { 
                if (supabaseService.isConfigured()) await supabaseService.deleteStaff(id);
                setStaff(prev => prev.filter(s => s.id !== id));
              }}
              onAddGroup={async g => { 
                const newGroup = { ...g, id: `G${Date.now()}` };
                if (supabaseService.isConfigured()) await supabaseService.upsertGroup(newGroup);
                setGroups(prev => [newGroup, ...prev]);
              }}
              onUpdateGroup={async g => { 
                if (supabaseService.isConfigured()) await supabaseService.upsertGroup(g);
                setGroups(prev => prev.map(item => item.id === g.id ? g : item));
              }}
              onDeleteGroup={async id => { 
                if (supabaseService.isConfigured()) await supabaseService.deleteGroup(id);
                setGroups(prev => prev.filter(g => g.id !== id));
              }}
              onAddEndpoint={async e => { 
                const newEp = { ...e, id: `${Date.now()}`, status: EndpointStatus.DISCONNECTED, lastConnected: 'N/A' };
                if (supabaseService.isConfigured()) await supabaseService.upsertEndpoint(newEp);
                setEndpoints(prev => [...prev, newEp]);
              }}
              onUpdateEndpoint={async (e) => {
                if (supabaseService.isConfigured()) await supabaseService.upsertEndpoint(e);
                setEndpoints(prev => prev.map(item => item.id === e.id ? e : item));
              }}
              onDeleteEndpoint={async id => { 
                if (supabaseService.isConfigured()) await supabaseService.deleteEndpoint(id);
                setEndpoints(prev => prev.filter(e => e.id !== id));
              }}
              onUpdateSettings={async s => {
                if (supabaseService.isConfigured()) await supabaseService.updateSettings(s);
                setSystemSettings(s);
              }} 
          />}
          {activeTab === 'accounts' && <UserManagement users={users} currentUser={currentUser!} onAddUser={async u => {
              const newUser = { ...u, id: `${Date.now()}` };
              if (supabaseService.isConfigured()) await supabaseService.upsertUser(newUser);
              setUsers(prev => [...prev, newUser]);
          }} onUpdateUser={async u => {
              if (supabaseService.isConfigured()) await supabaseService.upsertUser(u);
              setUsers(prev => prev.map(item => item.id === u.id ? u : item));
          }} onDeleteUser={async id => {
              if (supabaseService.isConfigured()) await supabaseService.deleteUser(id);
              setUsers(prev => prev.filter(u => u.id !== id));
          }} />}
          {activeTab === 'deployment' && <ExportPage />}
        </div>
      </main>

      {selectedMeeting && <MeetingDetailModal meeting={selectedMeeting} onClose={() => setSelectedMeeting(null)} onUpdate={handleUpdateMeeting} />}
      {isCreateModalOpen && <CreateMeetingModal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setEditingMeeting(null); }} onCreate={async (m) => {
        setMeetings(prev => [m, ...prev]);
        if (supabaseService.isConfigured()) await supabaseService.upsertMeeting(m);
      }} onUpdate={handleUpdateMeeting} units={units} staff={staff} availableEndpoints={endpoints} editingMeeting={editingMeeting} />}
    </div>
  );
};

export default App;
