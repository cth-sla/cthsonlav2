
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
  const [statsPeriod, setStatsPeriod] = useState<'week' | 'month' | 'year' | 'unit'>('month');
  
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
      const [cloudMeetings, cloudEndpoints, cloudUnits, cloudStaff, cloudUsers, cloudSettings] = await Promise.all([
        supabaseService.getMeetings(),
        supabaseService.getEndpoints(),
        supabaseService.getUnits(),
        supabaseService.getStaff(),
        supabaseService.getUsers(),
        supabaseService.getSettings()
      ]);

      if (cloudMeetings.length > 0) { setMeetings(cloudMeetings); storageService.saveMeetings(cloudMeetings); }
      if (cloudEndpoints.length > 0) { setEndpoints(cloudEndpoints); storageService.saveEndpoints(cloudEndpoints); }
      if (cloudUnits.length > 0) { setUnits(cloudUnits); storageService.saveUnits(cloudUnits); }
      if (cloudStaff.length > 0) { setStaff(cloudStaff); storageService.saveStaff(cloudStaff); }
      if (cloudUsers.length > 0) { setUsers(cloudUsers); storageService.saveUsers(cloudUsers); }
      if (cloudSettings) { setSystemSettings(cloudSettings); storageService.saveSystemSettings(cloudSettings); }
    };

    syncInitialData();

    // Thiết lập Real-time listeners
    const tables = ['meetings', 'endpoints', 'units', 'staff', 'users', 'system_settings'];
    const subscriptions = tables.map(table => {
      return supabaseService.subscribeTable(table, (payload) => {
        const { eventType, old, mappedData } = payload;
        
        console.log(`📡 Real-time update in [${table}]:`, eventType);

        const updateState = (setter: any, storageKey: string) => {
          setter((prev: any[]) => {
            let next;
            if (eventType === 'INSERT') next = [mappedData, ...prev];
            else if (eventType === 'UPDATE') next = prev.map(item => item.id === mappedData.id ? mappedData : item);
            else if (eventType === 'DELETE') next = prev.filter(item => item.id !== old.id);
            else next = prev;
            
            // Lưu vào local storage để đồng bộ
            if (next) storageService.saveData(storageKey, next);
            return next;
          });
        };

        if (table === 'meetings') updateState(setMeetings, 'cth_sla_meetings');
        else if (table === 'endpoints') updateState(setEndpoints, 'cth_sla_endpoints');
        else if (table === 'units') updateState(setUnits, 'cth_sla_units');
        else if (table === 'staff') updateState(setStaff, 'cth_sla_staff');
        else if (table === 'users') updateState(setUsers, 'cth_sla_users');
        else if (table === 'system_settings') {
          if (mappedData) {
            setSystemSettings(mappedData);
            storageService.saveSystemSettings(mappedData);
          }
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

  const dynamicStats = useMemo(() => {
    const weekly = [
      { name: 'Thứ 2', count: 0 }, { name: 'Thứ 3', count: 0 }, { name: 'Thứ 4', count: 0 },
      { name: 'Thứ 5', count: 0 }, { name: 'Thứ 6', count: 0 }, { name: 'Thứ 7', count: 0 }, { name: 'Chủ Nhật', count: 0 },
    ];
    const monthlyMap: Record<string, number> = {};
    const yearlyMap: Record<string, number> = {};
    const unitMap: Record<string, number> = {};

    meetings.forEach(m => {
      const date = new Date(m.startTime);
      const day = date.getDay();
      const dayIndex = day === 0 ? 6 : day - 1;
      if (weekly[dayIndex]) weekly[dayIndex].count++;
      
      const monthLabel = `T${date.getMonth() + 1}`;
      monthlyMap[monthLabel] = (monthlyMap[monthLabel] || 0) + 1;
      
      const yearLabel = date.getFullYear().toString();
      yearlyMap[yearLabel] = (yearlyMap[yearLabel] || 0) + 1;
      
      unitMap[m.hostUnit] = (unitMap[m.hostUnit] || 0) + 1;
    });

    const monthlyArr = Object.entries(monthlyMap).map(([name, count]) => ({ name, count }))
      .sort((a, b) => parseInt(a.name.substring(1)) - parseInt(b.name.substring(1)));
    
    const yearlyArr = Object.entries(yearlyMap).map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const unitArr = Object.entries(unitMap).map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { weekly, monthly: monthlyArr, yearly: yearlyArr, units: unitArr };
  }, [meetings]);

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

  const dashboardMeetingList = useMemo(() => {
    const now = new Date();
    if (statsPeriod === 'week') {
      const currentWeekStart = new Date(now.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1)));
      currentWeekStart.setHours(0,0,0,0);
      return meetings.filter(m => new Date(m.startTime) >= currentWeekStart);
    }
    if (statsPeriod === 'month') {
      return meetings.filter(m => new Date(m.startTime).getMonth() === new Date().getMonth());
    }
    return meetings.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 10);
  }, [meetings, statsPeriod]);

  const isAdmin = currentUser?.role === 'ADMIN';

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleCreateMeeting = async (newMeeting: Meeting) => {
    // Với Real-time, ta chỉ cần gọi API, State sẽ được cập nhật qua Subscription listener
    if (supabaseService.isConfigured()) {
      await supabaseService.upsertMeeting(newMeeting);
    } else {
      const updated = [newMeeting, ...meetings];
      setMeetings(updated);
      storageService.saveMeetings(updated);
    }
    setIsCreateModalOpen(false);
  };

  const handleUpdateMeeting = async (updatedMeeting: Meeting) => {
    if (supabaseService.isConfigured()) {
      await supabaseService.upsertMeeting(updatedMeeting);
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
        await supabaseService.deleteMeeting(id);
      } else {
        const updated = meetings.filter(m => m.id !== id);
        setMeetings(updated);
        storageService.saveMeetings(updated);
      }
    }
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setIsCreateModalOpen(true);
  };

  if (!currentUser) return <LoginView users={users} meetings={meetings} onLoginSuccess={setCurrentUser} systemSettings={systemSettings} />;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50" style={{ '--theme-primary': systemSettings.primaryColor } as any}>
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 shadow-xl z-10 flex flex-col">
        <div className="p-6">
          <h1 className="flex items-start gap-3">
            <div className="relative group shrink-0">
               <div 
                className="absolute -inset-1 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"
                style={{ background: `linear-gradient(to right, ${systemSettings.primaryColor}, #22d3ee)` }}
               ></div>
               <div className="relative p-2 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center overflow-hidden w-10 h-10">
                {systemSettings.logoBase64 ? (
                  <img src={systemSettings.logoBase64} alt="Logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <svg className="w-6 h-6" style={{ color: '#22d3ee' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20 7L12 12L4 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="2.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1"/>
                  </svg>
                )}
               </div>
            </div>
            <div className="flex flex-col">
              <span 
                className="text-xs leading-tight font-black bg-clip-text text-transparent uppercase tracking-tight"
                style={{ backgroundImage: `linear-gradient(to right, white, #d1d5db, ${systemSettings.primaryColor})` }}
              >
                {systemSettings.shortName}
              </span>
              <span 
                className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-80"
                style={{ color: systemSettings.primaryColor }}
              >
                {systemSettings.systemName}
              </span>
            </div>
          </h1>
          {supabaseService.isConfigured() && (
            <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">Real-time Connected</span>
            </div>
          )}
        </div>

        <nav className="mt-2 px-4 space-y-1 flex-1 overflow-y-auto">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`} style={activeTab === 'dashboard' ? { backgroundColor: `${systemSettings.primaryColor}1a`, color: systemSettings.primaryColor } : {}}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" /></svg>
            <span className="font-semibold text-sm">Tổng quan</span>
          </button>
          
          <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'reports' ? 'text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`} style={activeTab === 'reports' ? { backgroundColor: `${systemSettings.primaryColor}1a`, color: systemSettings.primaryColor } : {}}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="font-semibold text-sm">Báo cáo & Thống kê</span>
          </button>

          <button onClick={() => setActiveTab('meetings')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'meetings' ? 'text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`} style={activeTab === 'meetings' ? { backgroundColor: `${systemSettings.primaryColor}1a`, color: systemSettings.primaryColor } : {}}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="font-semibold text-sm">Quản lý lịch họp</span>
          </button>
          
          {isAdmin && (
            <>
              <div className="pt-4 pb-1 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Hệ thống</div>
              <button onClick={() => setActiveTab('monitoring')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'monitoring' ? 'text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`} style={activeTab === 'monitoring' ? { backgroundColor: `${systemSettings.primaryColor}1a`, color: systemSettings.primaryColor } : {}}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                <span className="font-semibold text-sm">Giám sát điểm cầu</span>
              </button>
              <button onClick={() => setActiveTab('management')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'management' ? 'text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`} style={activeTab === 'management' ? { backgroundColor: `${systemSettings.primaryColor}1a`, color: systemSettings.primaryColor } : {}}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                <span className="font-semibold text-sm">Quản lý & Cấu hình</span>
              </button>
              <button onClick={() => setActiveTab('accounts')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'accounts' ? 'text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`} style={activeTab === 'accounts' ? { backgroundColor: `${systemSettings.primaryColor}1a`, color: systemSettings.primaryColor } : {}}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                <span className="font-semibold text-sm">Quản trị Tài khoản</span>
              </button>
              <button onClick={() => setActiveTab('deployment')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'deployment' ? 'text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`} style={activeTab === 'deployment' ? { backgroundColor: `${systemSettings.primaryColor}1a`, color: systemSettings.primaryColor } : {}}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                <span className="font-semibold text-sm">Hệ thống & Triển khai</span>
              </button>
            </>
          )}
        </nav>
        
        <div className="p-4 border-t border-slate-800/50">
          <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-semibold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="text-sm">Đăng xuất</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            {activeTab === 'dashboard' ? 'Thống kê & Phân tích Dữ liệu' : 
             activeTab === 'meetings' ? 'Danh sách lịch họp' : 
             activeTab === 'monitoring' ? 'Giám sát Điểm cầu' : 
             activeTab === 'management' ? 'Quản lý Danh mục & Cấu hình' :
             activeTab === 'reports' ? 'Báo cáo & Xuất dữ liệu' :
             activeTab === 'accounts' ? 'Quản lý Tài khoản' : 
             activeTab === 'deployment' ? 'Phát hành & Quản lý Từ xa' : 'Triển khai hệ thống'}
          </h2>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-8 pb-12">
            {/* Cards ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              <StatCard title="Tổng số cuộc họp" value={stats.total} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} trend="+5%" trendUp={true} />
              <StatCard title="Tổng điểm cầu" value={endpoints.length} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3" /></svg>} trend="Cố định" trendUp={true} />
              <StatCard title="Điểm cầu Online" value={stats.connected} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 1 1 0 12.728m-9.9-2.828a5 5 0 0 1 0-7.07m7.072 0a5 5 0 0 1 0 7.07M13 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" /></svg>} trend="Sẵn sàng" trendUp={true} />
              <StatCard title="Mất kết nối" value={stats.disconnected} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" /></svg>} trend="Cần xử lý" trendUp={false} />
              <StatCard title="SLA Khả dụng" value="96.5%" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>} trend="+0.2%" trendUp={true} />
            </div>

            {/* Charts ... */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 tracking-tight">Xếp hạng Cuộc họp theo Đơn vị</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Dữ liệu trong tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</p>
                </div>
              </div>

              <div className="h-[300px] w-full">
                {unitStatsThisMonth.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={unitStatsThisMonth} margin={{ left: 60, right: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: '#475569', fontWeight: '700'}} 
                        width={140}
                      />
                      <Tooltip 
                        cursor={{fill: '#f8fafc', radius: 4}} 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px'}} 
                      />
                      <Bar dataKey="count" fill={systemSettings.primaryColor} radius={[0, 8, 8, 0]} barSize={24}>
                        {unitStatsThisMonth.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 italic text-sm">
                    Chưa có cuộc họp nào được ghi nhận trong tháng này.
                  </div>
                )}
              </div>
            </div>

            {/* Thống kê đa chiều */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl text-white shadow-lg" style={{ backgroundColor: systemSettings.primaryColor }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">Xu hướng & Tổng hợp</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Phân tích theo dòng thời gian</p>
                  </div>
                </div>
                
                <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
                   <button onClick={() => setStatsPeriod('week')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statsPeriod === 'week' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} style={statsPeriod === 'week' ? { color: systemSettings.primaryColor } : {}}>Tuần</button>
                   <button onClick={() => setStatsPeriod('month')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statsPeriod === 'month' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} style={statsPeriod === 'month' ? { color: systemSettings.primaryColor } : {}}>Tháng</button>
                   <button onClick={() => setStatsPeriod('year')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statsPeriod === 'year' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} style={statsPeriod === 'year' ? { color: systemSettings.primaryColor } : {}}>Năm</button>
                   <button onClick={() => setStatsPeriod('unit')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statsPeriod === 'unit' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} style={statsPeriod === 'unit' ? { color: systemSettings.primaryColor } : {}}>Tổng kết đơn vị</button>
                </div>
              </div>

              <div className="h-[400px] w-full">
                {statsPeriod === 'unit' ? (
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie data={dynamicStats.units} cx="50%" cy="50%" innerRadius={80} outerRadius={140} paddingAngle={5} dataKey="count" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                         {dynamicStats.units.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                       </Pie>
                       <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px'}} />
                       <Legend verticalAlign="bottom" height={40}/>
                     </PieChart>
                   </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsPeriod === 'week' ? dynamicStats.weekly : statsPeriod === 'month' ? dynamicStats.monthly : dynamicStats.yearly}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: '800'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                      <Tooltip cursor={{fill: '#f8fafc', radius: 8}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px'}} />
                      <Bar dataKey="count" fill={statsPeriod === 'week' ? '#10B981' : statsPeriod === 'month' ? systemSettings.primaryColor : '#8B5CF6'} radius={[8, 8, 0, 0]} barSize={statsPeriod === 'year' ? 60 : 32}>
                        {(statsPeriod === 'week' ? dynamicStats.weekly : statsPeriod === 'month' ? dynamicStats.monthly : dynamicStats.yearly).map((entry, index) => (
                           <Cell key={`cell-${index}`} fillOpacity={0.85} className="hover:fill-opacity-100 transition-all cursor-pointer" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Other tabs ... */}
        {activeTab === 'reports' && <ReportsPage meetings={meetings} endpoints={endpoints} />}

        {activeTab === 'meetings' && (
          <MeetingList meetings={meetings} onSelect={setSelectedMeeting} isAdmin={isAdmin} onEdit={handleEditMeeting} onDelete={handleDeleteMeeting} onAdd={() => { setEditingMeeting(null); setIsCreateModalOpen(true); }} />
        )}
        
        {activeTab === 'monitoring' && <MonitoringGrid endpoints={endpoints} onUpdateEndpoint={isAdmin ? async e => {
          if (supabaseService.isConfigured()) await supabaseService.upsertEndpoint(e);
          else {
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
              if (supabaseService.isConfigured()) await supabaseService.upsertUnit(newUnit);
              else {
                const updated = [...units, newUnit]; setUnits(updated); storageService.saveUnits(updated); 
              }
            }}
            onUpdateUnit={async u => { 
              if (supabaseService.isConfigured()) await supabaseService.upsertUnit(u);
              else {
                const updated = units.map(item => item.id === u.id ? u : item); setUnits(updated); storageService.saveUnits(updated); 
              }
            }}
            onDeleteUnit={async id => { 
              if (window.confirm('Xóa đơn vị?')) { 
                if (supabaseService.isConfigured()) await supabaseService.deleteUnit(id);
                else {
                  const updated = units.filter(u => u.id !== id); setUnits(updated); storageService.saveUnits(updated); 
                }
              }
            }}
            onAddStaff={async s => { 
              const newStaff = { ...s, id: `S${Date.now()}` };
              if (supabaseService.isConfigured()) await supabaseService.upsertStaff(newStaff);
              else {
                const updated = [...staff, newStaff]; setStaff(updated); storageService.saveStaff(updated); 
              }
            }}
            onUpdateStaff={async s => { 
              if (supabaseService.isConfigured()) await supabaseService.upsertStaff(s);
              else {
                const updated = staff.map(item => item.id === s.id ? s : item); setStaff(updated); storageService.saveStaff(updated); 
              }
            }}
            onDeleteStaff={async id => { 
              if (window.confirm('Xóa cán bộ?')) { 
                if (supabaseService.isConfigured()) await supabaseService.deleteStaff(id);
                else {
                  const updated = staff.filter(s => s.id !== id); setStaff(updated); storageService.saveStaff(updated); 
                }
              }
            }}
            onAddEndpoint={async e => { 
              const newEp = { ...e, id: `${Date.now()}`, status: EndpointStatus.DISCONNECTED, lastConnected: 'N/A' };
              if (supabaseService.isConfigured()) await supabaseService.upsertEndpoint(newEp);
              else {
                const updated = [...endpoints, newEp]; setEndpoints(updated); storageService.saveEndpoints(updated); 
              }
            }}
            onUpdateEndpoint={async e => { 
              if (supabaseService.isConfigured()) await supabaseService.upsertEndpoint(e);
              else {
                const updated = endpoints.map(item => item.id === e.id ? e : item); setEndpoints(updated); storageService.saveEndpoints(updated); 
              }
            }}
            onDeleteEndpoint={async id => { 
              if (window.confirm('Xóa điểm cầu?')) { 
                if (supabaseService.isConfigured()) await supabaseService.deleteEndpoint(id);
                else {
                  const updated = endpoints.filter(e => e.id !== id); setEndpoints(updated); storageService.saveEndpoints(updated); 
                }
              }
            }}
            onAddGroup={async g => { const updated = [...groups, { ...g, id: `G${Date.now()}` }]; setGroups(updated); storageService.saveGroups(updated); }}
            onUpdateGroup={async g => { const updated = groups.map(item => item.id === g.id ? g : item); setGroups(updated); storageService.saveGroups(updated); }}
            onDeleteGroup={async id => { if (window.confirm('Xóa thành phần?')) { const updated = groups.filter(g => g.id !== id); setGroups(updated); storageService.saveGroups(updated); }}}
            onUpdateSettings={async s => { 
              if (supabaseService.isConfigured()) await supabaseService.updateSettings(s);
              else {
                setSystemSettings(s); storageService.saveSystemSettings(s); 
              }
            }}
          />
        )}

        {activeTab === 'accounts' && isAdmin && (
          <UserManagement users={users} currentUser={currentUser} 
            onAddUser={async u => { 
              const newUser = { ...u, id: `${Date.now()}` }; 
              if (supabaseService.isConfigured()) await supabaseService.upsertUser(newUser);
              else {
                const updated = [...users, newUser]; setUsers(updated); storageService.saveUsers(updated); 
              }
            }} 
            onUpdateUser={async u => { 
              if (supabaseService.isConfigured()) await supabaseService.upsertUser(u);
              else {
                const updated = users.map(item => item.id === u.id ? u : item); setUsers(updated); storageService.saveUsers(updated); 
              }
            }} 
            onDeleteUser={async id => { 
              if (window.confirm('Xóa người dùng?')) { 
                if (supabaseService.isConfigured()) await supabaseService.deleteUser(id);
                else {
                  const updated = users.filter(u => u.id !== id); setUsers(updated); storageService.saveUsers(updated); 
                }
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
