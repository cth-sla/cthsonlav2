
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, Legend
} from 'recharts';
import { LayoutDashboard, CalendarDays, MonitorPlay, FileText, Settings, Users, Share2, LogOut, Menu, X, Activity, BarChart3 } from 'lucide-react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const isAdmin = currentUser?.role === 'ADMIN';
  const isOperator = currentUser?.role === 'OPERATOR';
  const canManageMeetings = isAdmin || isOperator;

  useEffect(() => {
    if (!currentUser) return;
    const refreshData = async () => {
      if (supabaseService.isConfigured()) {
        try {
          const freshEndpoints = await supabaseService.getEndpoints();
          if (freshEndpoints && freshEndpoints.length > 0) {
            setEndpoints(freshEndpoints);
            storageService.saveEndpoints(freshEndpoints);
            setLastRefreshed(new Date());
          }
        } catch (err) {
          console.error("Auto-refresh endpoints failed:", err);
        }
      }
    };
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === 'monitoring' && !isAdmin && currentUser) {
      setActiveTab('dashboard');
    }
  }, [activeTab, isAdmin, currentUser]);

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
    const now = new Date();
    
    // Mốc thời gian
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Tính toán số liệu (Loại bỏ các cuộc họp đã Huỷ khỏi thống kê hoạt động chính)
    const validMeetings = meetings.filter(m => m.status !== 'CANCELLED');
    const cancelledCount = meetings.filter(m => m.status === 'CANCELLED').length;
    const postponedCount = meetings.filter(m => m.status === 'POSTPONED').length;

    const weeklyMeetings = validMeetings.filter(m => new Date(m.startTime) >= startOfWeek);
    const monthlyMeetings = validMeetings.filter(m => new Date(m.startTime) >= startOfMonth);
    const yearlyMeetings = validMeetings.filter(m => new Date(m.startTime) >= startOfYear);

    // Thống kê theo đơn vị (Chỉ tính cuộc họp hợp lệ)
    const hostUnitMap: Record<string, number> = {};
    validMeetings.forEach(m => {
      hostUnitMap[m.hostUnit] = (hostUnitMap[m.hostUnit] || 0) + 1;
    });
    
    const unitStats = Object.entries(hostUnitMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const topHost = unitStats[0] || { name: "Chưa có", count: 0 };

    const connected = endpoints.filter(e => e.status === EndpointStatus.CONNECTED).length;
    const uptime = endpoints.length > 0 ? ((connected / endpoints.length) * 100).toFixed(1) : "0";
    
    // Cuộc họp gần đây (bao gồm mọi trạng thái để hiển thị)
    const recentMeetings = [...meetings].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 5);
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      const count = validMeetings.filter(m => new Date(m.startTime).toDateString() === d.toDateString()).length;
      return { name: dateStr, count };
    });

    return { 
      total: validMeetings.length,
      connected, 
      uptime, 
      recentMeetings, 
      last7Days,
      weeklyCount: weeklyMeetings.length,
      monthlyCount: monthlyMeetings.length,
      yearlyCount: yearlyMeetings.length,
      postponedCount,
      cancelledCount,
      topHostName: topHost.name,
      topHostCount: topHost.count,
      unitStats
    };
  }, [meetings, endpoints]);

  const handleLogout = () => { setCurrentUser(null); setActiveTab('dashboard'); };
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  if (!currentUser) return <LoginView users={users} meetings={meetings} onLoginSuccess={setCurrentUser} systemSettings={systemSettings} />;

  const primaryBgStyle = { backgroundColor: systemSettings.primaryColor };
  const primaryTextStyle = { color: systemSettings.primaryColor };
  const primaryLightBgStyle = { backgroundColor: 'var(--primary-color-light)' };

  return (
    <div className="min-h-screen flex bg-gray-50 overflow-hidden relative">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col shadow-2xl flex-shrink-0 z-30 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex justify-between items-center">
          <h1 className="flex items-center gap-3">
             <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                {systemSettings.logoBase64 ? <img src={systemSettings.logoBase64} alt="Logo" className="max-w-full max-h-full" /> : <span style={primaryTextStyle} className="font-bold text-sm">SL</span>}
             </div>
             <div className="flex flex-col min-w-0">
                <span className="text-xs font-black uppercase tracking-tight truncate">{systemSettings.shortName}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">SLA MONITOR v3.1</span>
             </div>
          </h1>
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
           <div className="mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase">Người dùng:</p>
              <p style={primaryTextStyle} className="text-xs font-bold truncate">{currentUser.fullName}</p>
           </div>
           <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-bold text-sm"><LogOut size={18} /> Đăng xuất</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4 justify-between shrink-0">
          <button onClick={toggleSidebar} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"><Menu size={24} /></button>
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Dashboard</h2>
          <div className="w-10"></div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
          <header className="mb-8 hidden lg:flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Thống kê hoạt động</h2>
              <div className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-full shadow-sm">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Live: {lastRefreshed.toLocaleTimeString('vi-VN', { hour12: false })}</span>
              </div>
            </div>
            {activeTab === 'dashboard' && canManageMeetings && (
              <button onClick={() => setIsCreateModalOpen(true)} style={primaryBgStyle} className="px-6 py-2.5 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2"><CalendarDays size={16} /> Tạo cuộc họp mới</button>
            )}
          </header>

          {activeTab === 'dashboard' && (
            <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  <StatCard 
                    title="Họp trong Tuần" 
                    value={dashboardStats.weeklyCount} 
                    icon={<CalendarDays color={systemSettings.primaryColor} />} 
                    description={
                      <div className="space-y-1">
                        <p>Tổng cuộc họp hợp lệ trong tuần này.</p>
                        <div className="flex justify-between text-[9px] border-t border-slate-600 pt-1 mt-1">
                          <span>Tạm hoãn:</span>
                          <span className="text-amber-400">{dashboardStats.postponedCount}</span>
                        </div>
                      </div>
                    } 
                  />
                  <StatCard title="Họp trong Tháng" value={dashboardStats.monthlyCount} icon={<FileText color={systemSettings.primaryColor} />} description="Tổng số cuộc họp hợp lệ trong tháng hiện tại." />
                  <StatCard title="Họp trong Năm" value={dashboardStats.yearlyCount} icon={<BarChart3 className="text-amber-500" />} description={`Tổng số cuộc họp hợp lệ trong năm ${new Date().getFullYear()}.`} />
                  <StatCard 
                    title="Uptime Hạ tầng" 
                    value={`${dashboardStats.uptime}%`} 
                    icon={<Activity color={systemSettings.primaryColor} />} 
                    description={
                      <div className="space-y-1">
                        <p>Tỷ lệ điểm cầu đang trực tuyến.</p>
                        <div className="flex justify-between text-[9px] border-t border-slate-600 pt-1 mt-1">
                          <span>Đã huỷ lịch:</span>
                          <span className="text-red-400">{dashboardStats.cancelledCount}</span>
                        </div>
                      </div>
                    } 
                  />
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
                              <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                labelStyle={{ fontWeight: '900', color: '#1e293b', marginBottom: '4px' }}
                              />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
                  
                  <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col">
                     <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-8">Thống kê theo Đơn vị</h3>
                     <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart layout="vertical" data={dashboardStats.unitStats} margin={{ left: 40 }}>
                              <XAxis type="number" hide />
                              <YAxis dataKey="name" type="category" fontSize={9} fontWeight="bold" width={100} tick={{fill: '#64748b'}} />
                              <Tooltip cursor={{fill: 'transparent'}} />
                              <Bar dataKey="count" fill={systemSettings.primaryColor} radius={[0, 4, 4, 0]}>
                                 {dashboardStats.unitStats.map((_, index) => (
                                    <Cell key={`cell-${index}`} fillOpacity={1 - (index * 0.1)} />
                                 ))}
                              </Bar>
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="mt-4 pt-4 border-t border-gray-50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đơn vị tích cực nhất:</p>
                        <p className="text-sm font-black text-slate-900 mt-1 truncate">{dashboardStats.topHostName}</p>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 md:p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                     <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Hoạt động gần đây</h3>
                     <button onClick={() => setActiveTab('meetings')} style={primaryTextStyle} className="text-xs font-bold hover:underline">Xem tất cả</button>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm min-w-[800px]">
                        <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                           <tr>
                              <th className="px-8 py-4 min-w-[350px]">Thông tin cuộc họp</th>
                              <th className="px-8 py-4">Đơn vị & Chủ trì</th>
                              <th className="px-8 py-4">Thời gian diễn ra</th>
                              <th className="px-8 py-4 text-center">Trạng thái</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                           {dashboardStats.recentMeetings.map(m => {
                             const isCancelled = m.status === 'CANCELLED';
                             const isPostponed = m.status === 'POSTPONED';
                             const isSpecial = isCancelled || isPostponed;

                             return (
                               <tr key={m.id} className={`hover:bg-gray-50 transition-all cursor-pointer ${isCancelled ? 'bg-red-50/50' : isPostponed ? 'bg-amber-50/50' : ''}`} onClick={() => setSelectedMeeting(m)}>
                                  <td className="px-8 py-5">
                                     <div className={`font-bold text-sm whitespace-normal leading-relaxed ${
                                       isCancelled ? 'text-red-700 line-through decoration-red-700 decoration-2' : 
                                       isPostponed ? 'text-amber-700 italic' : 
                                       'text-gray-900'
                                     }`}>{m.title}</div>
                                     <div className="text-[10px] text-gray-400 mt-1.5 font-mono tracking-tighter">
                                        REF: {m.id} 
                                        {isCancelled && <span className="text-red-700 font-black ml-2 uppercase tracking-widest bg-red-100 px-1.5 py-0.5 rounded border border-red-200">[ĐÃ HUỶ]</span>}
                                        {isPostponed && <span className="text-amber-700 font-black ml-2 uppercase tracking-widest bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">[HOÃN]</span>}
                                     </div>
                                  </td>
                                  <td className="px-8 py-5">
                                     <div className={`font-bold text-[11px] leading-tight ${isCancelled ? 'text-red-800' : isPostponed ? 'text-amber-800' : 'text-slate-900'}`}>{m.hostUnit}</div>
                                     <div className="text-slate-500 text-[10px] mt-1 font-medium italic">Chủ trì: {m.chairPerson}</div>
                                  </td>
                                  <td className="px-8 py-5">
                                     <div className={`font-bold text-[11px] whitespace-nowrap ${isCancelled ? 'text-red-600' : isPostponed ? 'text-amber-600' : 'text-blue-600'}`}>
                                        {new Date(m.startTime).toLocaleTimeString('vi-VN', { 
                                          hour: '2-digit', minute: '2-digit', hour12: false 
                                        })}
                                     </div>
                                     <div className="text-gray-500 text-[10px] mt-1 font-mono whitespace-nowrap">
                                        {new Date(m.startTime).toLocaleDateString('vi-VN')}
                                     </div>
                                  </td>
                                  <td className="px-8 py-5 text-center">
                                     {isCancelled ? (
                                       <span className="px-3 py-1 bg-red-100 text-red-700 text-[9px] font-black uppercase rounded-lg border border-red-200">Đã huỷ</span>
                                     ) : isPostponed ? (
                                       <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[9px] font-black uppercase rounded-lg border border-amber-200">Hoãn</span>
                                     ) : (
                                       <button className="px-5 py-2 text-[10px] font-black uppercase rounded-xl transition-all shadow-sm border border-transparent hover:border-blue-200" style={{...primaryLightBgStyle, ...primaryTextStyle}}>
                                          Chi tiết
                                       </button>
                                     )}
                                  </td>
                               </tr>
                             )
                           })}
                           {dashboardStats.recentMeetings.length === 0 && (
                             <tr>
                               <td colSpan={4} className="px-8 py-10 text-center text-gray-400 text-xs italic">Chưa có dữ liệu cuộc họp gần đây</td>
                             </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'reports' && <ReportsPage meetings={meetings} endpoints={endpoints} currentUser={currentUser} />}
          {activeTab === 'meetings' && <MeetingList meetings={meetings} onSelect={setSelectedMeeting} isAdmin={canManageMeetings} onEdit={m => { setEditingMeeting(m); setIsCreateModalOpen(true); }} onDelete={handleDeleteMeeting} onAdd={() => { setEditingMeeting(null); setIsCreateModalOpen(true); }} onUpdate={handleUpdateMeeting} />}
          {activeTab === 'monitoring' && isAdmin && <MonitoringGrid endpoints={endpoints} onUpdateEndpoint={handleUpdateEndpoint} />}
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
        </div>
      </main>

      {selectedMeeting && <MeetingDetailModal meeting={selectedMeeting} onClose={() => setSelectedMeeting(null)} onUpdate={handleUpdateMeeting} />}
      {isCreateModalOpen && <CreateMeetingModal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setEditingMeeting(null); }} onCreate={handleCreateMeeting} onUpdate={handleUpdateMeeting} units={units} staff={staff} availableEndpoints={endpoints} editingMeeting={editingMeeting} />}
    </div>
  );
};

export default App;
