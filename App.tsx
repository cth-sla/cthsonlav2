
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, AreaChart, Area, Legend
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

        if (cloudMeetings.length > 0) { setMeetings(cloudMeetings); storageService.saveMeetings(cloudMeetings); }
        if (cloudEndpoints.length > 0) { setEndpoints(cloudEndpoints); storageService.saveEndpoints(cloudEndpoints); }
        if (cloudUnits.length > 0) { setUnits(cloudUnits); storageService.saveUnits(cloudUnits); }
        if (cloudStaff.length > 0) { setStaff(cloudStaff); storageService.saveStaff(cloudStaff); }
        if (cloudGroups.length > 0) { setGroups(cloudGroups); storageService.saveGroups(cloudGroups); }
        if (cloudUsers.length > 0) { setUsers(cloudUsers); storageService.saveUsers(cloudUsers); }
        if (cloudSettings) { setSystemSettings(cloudSettings); storageService.saveSystemSettings(cloudSettings); }
      } catch (err) {
        console.error("Lỗi đồng bộ dữ liệu ban đầu từ Supabase:", err);
      }
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

  useEffect(() => {
    const root = document.documentElement;
    if (systemSettings.primaryColor) {
      root.style.setProperty('--primary-color', systemSettings.primaryColor);
    }
  }, [systemSettings.primaryColor]);

  const dashboardStats = useMemo(() => {
    const total = meetings.length;
    const connected = endpoints.filter(e => e.status === EndpointStatus.CONNECTED).length;
    const disconnected = endpoints.filter(e => e.status === EndpointStatus.DISCONNECTED).length;
    const connecting = endpoints.filter(e => e.status === EndpointStatus.CONNECTING).length;
    const uptime = endpoints.length > 0 ? ((connected / endpoints.length) * 100).toFixed(1) : "0";

    const recentMeetings = [...meetings]
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 5);

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      const count = meetings.filter(m => new Date(m.startTime).toDateString() === d.toDateString()).length;
      return { name: dateStr, count };
    });

    const endpointDist = [
      { name: 'Online', value: connected, color: '#10B981' },
      { name: 'Offline', value: disconnected, color: '#EF4444' },
      { name: 'Connecting', value: connecting, color: '#F59E0B' }
    ];

    return { total, connected, disconnected, uptime, recentMeetings, last7Days, endpointDist };
  }, [meetings, endpoints]);

  const isAdmin = currentUser?.role === 'ADMIN';

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleCreateMeeting = async (newMeeting: Meeting) => {
    const previousMeetings = [...meetings];
    // 1. Optimistic Update
    setMeetings(prev => [newMeeting, ...prev]);
    
    // 2. Sync
    if (supabaseService.isConfigured()) {
      try {
        await supabaseService.upsertMeeting(newMeeting);
        storageService.saveMeetings([newMeeting, ...previousMeetings]);
      } catch (error: any) {
        console.error("Lỗi khi thêm mới lịch họp lên Cloud:", error);
        alert(`Không thể đồng bộ lịch họp lên Cloud: ${error.message || 'Lỗi không xác định'}`);
        // Rollback
        setMeetings(previousMeetings);
      }
    } else {
      storageService.saveMeetings([newMeeting, ...previousMeetings]);
    }
    setIsCreateModalOpen(false);
  };

  const handleUpdateMeeting = async (updatedMeeting: Meeting) => {
    const previousMeetings = [...meetings];
    // 1. Optimistic Update
    const updatedList = meetings.map(m => m.id === updatedMeeting.id ? updatedMeeting : m);
    setMeetings(updatedList);
    
    if (selectedMeeting && selectedMeeting.id === updatedMeeting.id) {
      setSelectedMeeting(updatedMeeting);
    }

    // 2. Sync
    if (supabaseService.isConfigured()) {
      try {
        await supabaseService.upsertMeeting(updatedMeeting);
        storageService.saveMeetings(updatedList);
      } catch (error: any) {
        console.error("Lỗi khi cập nhật lịch họp lên Cloud:", error);
        alert(`Không thể cập nhật lịch họp lên Cloud: ${error.message || 'Lỗi không xác định'}`);
        // Rollback
        setMeetings(previousMeetings);
        if (selectedMeeting && selectedMeeting.id === updatedMeeting.id) {
          setSelectedMeeting(previousMeetings.find(m => m.id === updatedMeeting.id) || null);
        }
      }
    } else {
      storageService.saveMeetings(updatedList);
    }
    
    setEditingMeeting(null);
    setIsCreateModalOpen(false);
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!window.confirm('Xóa lịch họp này?')) return;
    
    const previousMeetings = [...meetings];
    // 1. Optimistic Delete
    const updated = meetings.filter(m => m.id !== id);
    setMeetings(updated);

    // 2. Sync
    if (supabaseService.isConfigured()) {
      try {
        await supabaseService.deleteMeeting(id);
        storageService.saveMeetings(updated);
      } catch (error: any) {
        console.error("Lỗi khi xóa lịch họp trên Cloud:", error);
        alert(`Không thể xóa lịch họp trên Cloud: ${error.message || 'Lỗi không xác định'}`);
        // Rollback
        setMeetings(previousMeetings);
      }
    } else {
      storageService.saveMeetings(updated);
    }
  };

  if (!currentUser) return <LoginView users={users} meetings={meetings} onLoginSuccess={setCurrentUser} systemSettings={systemSettings} />;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 shadow-xl z-10 flex flex-col">
        <div className="p-6">
          <h1 className="flex items-start gap-3">
             <div className="relative p-2 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center overflow-hidden w-10 h-10">
                {systemSettings.logoBase64 ? (
                  <img src={systemSettings.logoBase64} alt="Logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <div className="w-6 h-6 text-cyan-400 font-bold flex items-center justify-center">SLA</div>
                )}
             </div>
             <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-tight">{systemSettings.shortName}</span>
                <span className="text-[9px] font-black uppercase mt-1 opacity-80" style={{ color: systemSettings.primaryColor }}>{systemSettings.systemName}</span>
             </div>
          </h1>
        </div>

        <nav className="mt-2 px-4 space-y-1 flex-1 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Tổng quan', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6z' },
            { id: 'reports', label: 'Báo cáo', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { id: 'meetings', label: 'Lịch họp', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            ...(isAdmin ? [
              { id: 'monitoring', label: 'Giám sát', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2' },
              { id: 'management', label: 'Danh mục', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4' },
              { id: 'accounts', label: 'Tài khoản', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197' },
              { id: 'deployment', label: 'Triển khai', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8' }
            ] : [])
          ].map(nav => (
            <button key={nav.id} onClick={() => setActiveTab(nav.id as any)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === nav.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={nav.icon} /></svg>
              <span className="font-semibold text-sm">{nav.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-800/50">
          <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-semibold text-sm">
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar">
        <header className="mb-8 flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
              {activeTab === 'dashboard' ? 'Bảng điều khiển' : 
               activeTab === 'meetings' ? 'Quản lý Lịch họp' : 
               activeTab === 'monitoring' ? 'Giám sát Trạng thái' : 
               activeTab === 'management' ? 'Cấu hình Danh mục' :
               activeTab === 'reports' ? 'Trung tâm Báo cáo' :
               activeTab === 'accounts' ? 'Quản lý Truy cập' : 
               activeTab === 'deployment' ? 'Triển khai & Sao lưu' : ''}
            </h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Hệ thống Giám sát Cầu truyền hình v3.1</p>
          </div>

          {activeTab === 'dashboard' && (
            <div className="flex items-center gap-3">
               {isAdmin && (
                 <>
                   <button onClick={() => setActiveTab('monitoring')} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-blue-500 transition-all">Kiểm tra hạ tầng</button>
                   <button onClick={() => setIsCreateModalOpen(true)} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2">
                     <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                     Tạo cuộc họp mới
                   </button>
                 </>
               )}
            </div>
          )}
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              <StatCard title="Tổng số cuộc họp" value={dashboardStats.total} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} tooltipTitle="Tần suất họp" description="Tổng số lượng cuộc họp đã được lên lịch và ghi nhận trên toàn hệ thống." />
              <StatCard title="Tổng điểm cầu" value={endpoints.length} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9H3m9 9V3" /></svg>} tooltipTitle="Hạ tầng điểm cầu" description="Số lượng các điểm cầu đang được quản lý bởi hệ thống." />
              <StatCard title="Online" value={dashboardStats.connected} trend="↑ 4" trendUp={true} icon={<svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" /></svg>} tooltipTitle="Trạng thái kết nối" description="Số lượng điểm cầu đang trực tuyến và sẵn sàng kết nối." />
              <StatCard title="Offline" value={dashboardStats.disconnected} trend="↓ 2" trendUp={false} icon={<svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>} tooltipTitle="Mất kết nối" description="Số lượng điểm cầu đang ngoại tuyến hoặc gặp sự cố kỹ thuật." />
              <StatCard title="Uptime" value={`${dashboardStats.uptime}%`} icon={<svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} tooltipTitle="Chỉ số khả dụng" description="Tỉ lệ thời gian hệ thống hoạt động ổn định so với tổng thời gian vận hành." />
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Xu hướng hoạt động 7 ngày gần nhất</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span className="text-[10px] font-black text-gray-400 uppercase">Cuộc họp</span>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardStats.last7Days}>
                      <defs>
                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={systemSettings.primaryColor} stopOpacity={0.1}/>
                          <stop offset="95%" stopColor={systemSettings.primaryColor} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                      <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px'}} />
                      <Area type="monotone" dataKey="count" stroke={systemSettings.primaryColor} strokeWidth={4} fillOpacity={1} fill="url(#colorTrend)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest self-start mb-8">Trạng thái hạ tầng</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dashboardStats.endpointDist} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={10} dataKey="value">
                        {dashboardStats.endpointDist.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} content={({payload}) => (
                        <div className="flex justify-center gap-6 mt-4">
                          {payload?.map((entry: any, i: number) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{backgroundColor: entry.color}}></div>
                              <span className="text-[10px] font-black text-gray-400 uppercase">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      )} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tỉ lệ Online</p>
                   <p className="text-3xl font-black text-emerald-600">{dashboardStats.uptime}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Cuộc họp gần nhất</h3>
                  <button onClick={() => setActiveTab('meetings')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Xem tất cả</button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                     <tr>
                       <th className="px-8 py-4">Tên cuộc họp</th>
                       <th className="px-8 py-4">Đơn vị chủ trì</th>
                       <th className="px-8 py-4">Thời gian</th>
                       <th className="px-8 py-4 text-center">Điểm cầu</th>
                       <th className="px-8 py-4 text-right">Hành động</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     {dashboardStats.recentMeetings.map((m) => (
                       <tr key={m.id} className="hover:bg-blue-50/30 transition-colors group">
                         <td className="px-8 py-5">
                           <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{m.title}</div>
                           <div className="text-[10px] text-gray-400 mt-1 font-mono uppercase tracking-widest">ID: {m.id}</div>
                         </td>
                         <td className="px-8 py-5 text-gray-600 font-medium">{m.hostUnit}</td>
                         <td className="px-8 py-5">
                            <div className="text-xs font-black text-gray-900">{new Date(m.startTime).toLocaleDateString('vi-VN')}</div>
                            <div className="text-[10px] text-gray-400 mt-1 font-bold">{new Date(m.startTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</div>
                         </td>
                         <td className="px-8 py-5 text-center">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                              {m.endpoints.length} ĐIỂM CẦU
                            </span>
                         </td>
                         <td className="px-8 py-5 text-right">
                            <button onClick={() => setSelectedMeeting(m)} className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all">Chi tiết</button>
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

        {activeTab === 'meetings' && (
          <MeetingList meetings={meetings} onSelect={setSelectedMeeting} isAdmin={isAdmin} onEdit={(m) => { setEditingMeeting(m); setIsCreateModalOpen(true); }} onDelete={handleDeleteMeeting} onAdd={() => { setEditingMeeting(null); setIsCreateModalOpen(true); }} />
        )}
        
        {activeTab === 'monitoring' && <MonitoringGrid endpoints={endpoints} onUpdateEndpoint={isAdmin ? async e => {
          try {
            if (supabaseService.isConfigured()) await supabaseService.upsertEndpoint(e);
            const updated = endpoints.map(item => item.id === e.id ? e : item);
            setEndpoints(updated);
            storageService.saveEndpoints(updated);
          } catch (err) {
             console.error("Lỗi cập nhật trạng thái điểm cầu:", err);
          }
        } : undefined} />}

        {activeTab === 'management' && isAdmin && (
          <ManagementPage 
            units={units} staff={staff} participantGroups={groups} endpoints={endpoints} systemSettings={systemSettings}
            onAddUnit={async u => { 
              const newUnit = { ...u, id: `U${Date.now()}` };
              try {
                if (supabaseService.isConfigured()) await supabaseService.upsertUnit(newUnit);
                const updated = [...units, newUnit]; setUnits(updated); storageService.saveUnits(updated);
              } catch (err) { alert(`Lỗi: ${err.message}`); }
            }}
            onUpdateUnit={async u => { 
              try {
                if (supabaseService.isConfigured()) await supabaseService.upsertUnit(u);
                const updated = units.map(item => item.id === u.id ? u : item); setUnits(updated); storageService.saveUnits(updated);
              } catch (err) { alert(`Lỗi: ${err.message}`); }
            }}
            onDeleteUnit={async id => { 
              if (!window.confirm('Xóa đơn vị này?')) return;
              try {
                if (supabaseService.isConfigured()) await supabaseService.deleteUnit(id);
                const updated = units.filter(u => u.id !== id); setUnits(updated); storageService.saveUnits(updated);
              } catch (err) { alert(`Lỗi: ${err.message}`); }
            }}
            onAddStaff={async s => { 
              const newStaff = { ...s, id: `S${Date.now()}` };
              try {
                if (supabaseService.isConfigured()) await supabaseService.upsertStaff(newStaff);
                const updated = [...staff, newStaff]; setStaff(updated); storageService.saveStaff(updated);
              } catch (err) { alert(`Lỗi: ${err.message}`); }
            }}
            onUpdateStaff={async s => { 
              try {
                if (supabaseService.isConfigured()) await supabaseService.upsertStaff(s);
                const updated = staff.map(item => item.id === s.id ? s : item); setStaff(updated); storageService.saveStaff(updated);
              } catch (err) { alert(`Lỗi: ${err.message}`); }
            }}
            onDeleteStaff={async id => { 
              if (!window.confirm('Xóa cán bộ này?')) return;
              try {
                if (supabaseService.isConfigured()) await supabaseService.deleteStaff(id);
                const updated = staff.filter(s => s.id !== id); setStaff(updated); storageService.saveStaff(updated);
              } catch (err) { alert(`Lỗi: ${err.message}`); }
            }}
            onAddEndpoint={async e => { 
              const newEp = { ...e, id: `${Date.now()}`, status: EndpointStatus.DISCONNECTED, lastConnected: 'N/A' };
              try {
                if (supabaseService.isConfigured()) await supabaseService.upsertEndpoint(newEp);
                const updated = [...endpoints, newEp]; setEndpoints(updated); storageService.saveEndpoints(updated);
              } catch (err) { alert(`Lỗi: ${err.message}`); }
            }}
            onUpdateEndpoint={async e => { 
              try {
                if (supabaseService.isConfigured()) await supabaseService.upsertEndpoint(e);
                const updated = endpoints.map(item => item.id === e.id ? e : item); setEndpoints(updated); storageService.saveEndpoints(updated);
              } catch (err) { alert(`Lỗi: ${err.message}`); }
            }}
            onDeleteEndpoint={async id => { 
              if (!window.confirm('Xóa điểm cầu này?')) return;
              try {
                if (supabaseService.isConfigured()) await supabaseService.deleteEndpoint(id);
                const updated = endpoints.filter(e => e.id !== id); setEndpoints(updated); storageService.saveEndpoints(updated);
              } catch (err) { alert(`Lỗi: ${err.message}`); }
            }}
            onAddGroup={async g => { 
              const newGroup = { ...g, id: `G${Date.now()}` };
              try {
                if (supabaseService.isConfigured()) await supabaseService.upsertGroup(newGroup);
                const updated = [newGroup, ...groups]; setGroups(updated); storageService.saveGroups(updated);
              } catch (err) { alert(`Lỗi: ${err.message}`); }
            }}
            onUpdateGroup={async g => { 
              try {
                if (supabaseService.isConfigured()) await supabaseService.upsertGroup(g);
                const updated = groups.map(item => item.id === g.id ? g : item); setGroups(updated); storageService.saveGroups(updated);
              } catch (err) { alert(`Lỗi: ${err.message}`); }
            }}
            onDeleteGroup={async id => { 
              if (!window.confirm('Xóa thành phần này?')) return;
              try {
                if (supabaseService.isConfigured()) await supabaseService.deleteGroup(id);
                const updated = groups.filter(g => g.id !== id); setGroups(updated); storageService.saveGroups(updated);
              } catch (err) { alert(`Lỗi: ${err.message}`); }
            }}
            onUpdateSettings={async s => { 
              try {
                if (supabaseService.isConfigured()) await supabaseService.updateSettings(s);
                setSystemSettings(s); storageService.saveSystemSettings(s);
              } catch (err) { alert(`Lỗi: ${err.message}`); }
            }}
          />
        )}

        {activeTab === 'accounts' && isAdmin && (
          <UserManagement users={users} currentUser={currentUser} 
            onAddUser={async u => { 
              const newUser = { ...u, id: `${Date.now()}` }; 
              try {
                if (supabaseService.isConfigured()) await supabaseService.upsertUser(newUser);
                const updated = [...users, newUser]; setUsers(updated); storageService.saveUsers(updated);
              } catch (err) { alert(`Lỗi: ${err.message}`); }
            }} 
            onUpdateUser={async u => { 
              try {
                if (supabaseService.isConfigured()) await supabaseService.upsertUser(u);
                const updated = users.map(item => item.id === u.id ? u : item); setUsers(updated); storageService.saveUsers(updated);
              } catch (err) { alert(`Lỗi: ${err.message}`); }
            }} 
            onDeleteUser={async id => { 
              if (!window.confirm('Xóa người dùng này?')) return;
              try {
                if (supabaseService.isConfigured()) await supabaseService.deleteUser(id);
                const updated = users.filter(u => u.id !== id); setUsers(updated); storageService.saveUsers(updated);
              } catch (err) { alert(`Lỗi: ${err.message}`); }
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
