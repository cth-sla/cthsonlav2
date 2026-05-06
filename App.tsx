
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, Legend
} from 'recharts';
import { 
  LayoutDashboard, CalendarDays, MonitorPlay, FileText, Settings, Users, Share2, LogOut, Menu, X, Activity, BarChart3, Building2, User as UserIcon, Clock, Zap, Target, ShieldEllipsis, Bell, Video,
  ChevronLeft, ChevronRight,
  Sun, Moon
} from 'lucide-react';
import { Meeting, Endpoint, EndpointStatus, Unit, Staff, ParticipantGroup, User, SystemSettings, SystemOperator } from './types';
import StatCard from './components/StatCard';
import MeetingList from './components/MeetingList';
import MonitoringGrid from './components/MonitoringGrid';
import ManagementPage from './components/ManagementPage';
import UserManagement from './components/UserManagement';
import ReportsPage from './components/ReportsPage';
import OperatorManagement from './components/OperatorManagement';
import LoginView from './components/LoginView';
import CreateMeetingModal from './components/CreateMeetingModal';
import MeetingDetailModal from './components/MeetingDetailModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import UpcomingAlert from './components/UpcomingAlert';
import NotificationToast from './components/NotificationToast';
import ExportPage from './components/ExportPage';
import { storageService } from './services/storageService';
import { supabaseService } from './services/supabaseService';

const VIBRANT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

storageService.init();

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'meetings' | 'monitoring' | 'management' | 'accounts' | 'reports' | 'deployment' | 'operators'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  
  const [meetings, setMeetings] = useState<Meeting[]>(() => storageService.getMeetings());
  const [endpoints, setEndpoints] = useState<Endpoint[]>(() => storageService.getEndpoints());
  const [units, setUnits] = useState<Unit[]>(() => storageService.getUnits());
  const [staff, setStaff] = useState<Staff[]>(() => storageService.getStaff());
  const [operators, setOperators] = useState<SystemOperator[]>(() => []);
  const [groups, setGroups] = useState<ParticipantGroup[]>(() => storageService.getGroups());
  const [users, setUsers] = useState<User[]>(() => storageService.getUsers());
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => storageService.getSystemSettings());
  
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  
  // States cho nhắc nhở
  const [notifiedMeetingIds, setNotifiedMeetingIds] = useState<Set<string>>(new Set());
  const [currentAlertMeeting, setCurrentAlertMeeting] = useState<Meeting | null>(null);
  const [showToast, setShowToast] = useState(false);

  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasSyncedOnce, setHasSyncedOnce] = useState(false);

  const isAdmin = currentUser?.role === 'ADMIN';
  const isOperator = currentUser?.role === 'OPERATOR';
  const canManageMeetings = isAdmin || isOperator;

  // Yêu cầu quyền thông báo ngay khi tải trang (nếu browser hỗ trợ)
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Cập nhật class dark cho html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Logic kiểm tra nhắc nhở định kỳ (mỗi 1 phút) - Chạy cả khi chưa login
  useEffect(() => {
    const checkMeetings = () => {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      const fifteenMinsLater = new Date(now.getTime() + 15 * 60 * 1000);

      const upcoming = meetings.filter(m => {
        if (m.status === 'CANCELLED') return false;
        const start = new Date(m.startTime);
        return start > now && start <= oneHourLater;
      });

      // Lấy cuộc họp gần nhất để hiển thị Banner trên Dashboard
      const nextOne = upcoming.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
      setCurrentAlertMeeting(nextOne || null);

      // Xử lý gửi thông báo đẩy và Toast cho cuộc họp trong vòng 15 phút
      const immediate = upcoming.find(m => new Date(m.startTime) <= fifteenMinsLater);
      if (immediate && !notifiedMeetingIds.has(immediate.id)) {
        // Gửi Browser Notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🔔 Hội nghị sắp bắt đầu!', {
            body: `${immediate.title} sẽ diễn ra lúc ${new Date(immediate.startTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit', hour12: false})}`,
            icon: systemSettings.logoBase64 || 'https://cdn-icons-png.flaticon.com/512/3661/3661331.png'
          });
        }
        
        // Show UI Toast
        setShowToast(true);
        setNotifiedMeetingIds(prev => new Set(prev).add(immediate.id));
      }
    };

    checkMeetings();
    const interval = setInterval(checkMeetings, 60000);
    return () => clearInterval(interval);
  }, [meetings, notifiedMeetingIds, systemSettings.logoBase64]);

  useEffect(() => {
    const syncData = async () => {
      if (!supabaseService.isConfigured()) return;
      
      setIsSyncing(true);
      try {
        const [cloudMeetings, cloudEndpoints, cloudUnits, cloudStaff, cloudGroups, cloudUsers, cloudSettings, cloudOperators] = await Promise.all([
          supabaseService.getMeetings(),
          supabaseService.getEndpoints(),
          supabaseService.getUnits(),
          supabaseService.getStaff(),
          supabaseService.getGroups(),
          supabaseService.getUsers(),
          supabaseService.getSettings(),
          supabaseService.getOperators()
        ]);

        // Cập nhật dữ liệu từ Cloud vào State và Local Storage
        setMeetings(cloudMeetings); 
        storageService.saveMeetings(cloudMeetings);
        
        setEndpoints(cloudEndpoints); storageService.saveEndpoints(cloudEndpoints);
        setUnits(cloudUnits); storageService.saveUnits(cloudUnits);
        setStaff(cloudStaff); storageService.saveStaff(cloudStaff);
        setGroups(cloudGroups); storageService.saveGroups(cloudGroups);
        setUsers(cloudUsers); storageService.saveUsers(cloudUsers);
        setOperators(cloudOperators);
        
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

    const tables = ['meetings', 'endpoints', 'units', 'staff', 'participant_groups', 'users', 'system_settings', 'system_operators'];
    const subscriptions = tables.map(table => {
      return supabaseService.subscribeTable(table, (payload) => {
        const { eventType, old, mappedData } = payload;
        
        const updateMap: Record<string, any> = {
          'meetings': { state: setMeetings, storage: storageService.saveMeetings.bind(storageService) },
          'endpoints': { state: setEndpoints, storage: storageService.saveEndpoints.bind(storageService) },
          'units': { state: setUnits, storage: storageService.saveUnits.bind(storageService) },
          'staff': { state: setStaff, storage: storageService.saveStaff.bind(storageService) },
          'participant_groups': { state: setGroups, storage: storageService.saveGroups.bind(storageService) },
          'users': { state: setUsers, storage: storageService.saveUsers.bind(storageService) },
          'system_operators': { state: setOperators, storage: null }
        };

        if (table === 'system_settings' && mappedData) {
          setSystemSettings(mappedData);
          storageService.saveSystemSettings(mappedData); // Cập nhật local khi có thay đổi từ cloud
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
              setSelectedMeeting(current => (current && current.id === mappedData.id) ? mappedData : current);
              if (currentUser && mappedData.id === currentUser.id) {
                setCurrentUser(mappedData);
              }
            } else if (eventType === 'DELETE') {
              next = prev.filter(item => item.id !== old.id);
              if (selectedMeeting?.id === old.id) setSelectedMeeting(null);
            }
            
            // Quan trọng: Lưu vào storage khi có thay đổi từ Realtime
            if (config.storage) config.storage(next);
            return next;
          });
        }
      });
    });

    return () => subscriptions.forEach(sub => sub?.unsubscribe());
  }, [currentUser?.id]);

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

    const totalDurationMs = validMeetings.reduce((acc, m) => {
      const start = new Date(m.startTime).getTime();
      const end = new Date(m.endTime).getTime();
      return acc + (end - start);
    }, 0);
    
    const avgDurationHours = validMeetings.length > 0 
      ? (totalDurationMs / (1000 * 60 * 60 * validMeetings.length)).toFixed(1) 
      : "0";

    const onTimeRate = validMeetings.length > 0 
      ? (100 - (validMeetings.filter(m => m.status === 'POSTPONED').length / validMeetings.length * 100)).toFixed(1)
      : "100";

    const engagementScore = validMeetings.length > 0 
      ? Math.min(100, Math.floor(validMeetings.reduce((acc, m) => acc + (m.endpoints.length * 2 + m.participants.length), 0) / validMeetings.length * 1.5))
      : 0;

    return {
      weekly: weeklyMeetings.length,
      monthly: monthlyMeetings.length,
      yearly: yearlyMeetings.length,
      topUnit,
      unitStats,
      uptime,
      last7Days,
      avgDuration: avgDurationHours,
      onTimeRate: onTimeRate,
      engagementScore: engagementScore,
      recentMeetings: [...meetings].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 5)
    };
  }, [meetings, endpoints]);

  const handleLogout = () => { setCurrentUser(null); setActiveTab('dashboard'); };
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const handleCreateMeeting = async (m: Meeting) => {
    const newMeeting: Meeting = { ...m, id: m.id || `MEET-${Date.now()}`, status: 'SCHEDULED' };
    
    // Update local state and storage immediately
    setMeetings(prev => {
      const next = [newMeeting, ...prev];
      storageService.saveMeetings(next);
      return next;
    });

    // Sync to cloud
    if (supabaseService.isConfigured()) {
      try {
        await supabaseService.upsertMeeting(newMeeting);
        console.log("Đã lưu cuộc họp lên Cloud thành công");
      } catch (err) {
        console.error("Lỗi lưu cuộc họp lên Cloud:", err);
        alert("Không thể đồng bộ cuộc họp lên Cloud. Dữ liệu hiện chỉ được lưu tạm thời trên trình duyệt này.");
      }
    }
  };

  const handleUpdateMeeting = async (meeting: Meeting) => {
    setMeetings(prev => {
      const updated = prev.map(m => m.id === meeting.id ? meeting : m);
      storageService.saveMeetings(updated);
      return updated;
    });

    if (selectedMeeting && selectedMeeting.id === meeting.id) {
        setSelectedMeeting(meeting);
    }
    
    if (supabaseService.isConfigured()) {
      try { 
        await supabaseService.upsertMeeting(meeting); 
        console.log("Cập nhật Cloud thành công");
      } catch (err) { 
        console.error("Cập nhật Cloud thất bại:", err); 
        alert("Lỗi đồng bộ Cloud: " + (err instanceof Error ? err.message : "Vui lòng kiểm tra lại cấu hình Database."));
      }
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!window.confirm('Xóa cuộc họp này vĩnh viễn khỏi hệ thống?')) return;
    setMeetings(prev => {
      const next = prev.filter(m => m.id !== id);
      storageService.saveMeetings(next);
      return next;
    });
    if (selectedMeeting?.id === id) setSelectedMeeting(null);
    if (supabaseService.isConfigured()) {
      try { await supabaseService.deleteMeeting(id); } catch (err) { console.error("Xóa thất bại:", err); }
    }
  };

  const handleSelfUpdatePassword = async (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    storageService.saveUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));

    if (supabaseService.isConfigured()) {
      try {
        await supabaseService.upsertUser(updatedUser);
      } catch (err) {
        console.error("Lỗi cập nhật mật khẩu Cloud:", err);
        throw err;
      }
    }
  };

  if (!currentUser) return (
    <>
      <LoginView 
        users={users} 
        meetings={meetings} 
        onLoginSuccess={setCurrentUser} 
        systemSettings={systemSettings} 
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />
      {showToast && currentAlertMeeting && (
        <NotificationToast 
          meeting={currentAlertMeeting} 
          onClose={() => setShowToast(false)} 
          onAction={() => {
            setShowToast(false);
          }}
        />
      )}
    </>
  );

  const primaryBgStyle = { backgroundColor: systemSettings.primaryColor };
  const primaryTextStyle = { color: systemSettings.primaryColor };

  return (
    <div className="min-h-screen flex bg-[#808080] dark:bg-slate-950 overflow-hidden relative transition-colors duration-300">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64 bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col shadow-2xl flex-shrink-0 z-30 transform transition-all duration-300 ease-in-out lg:translate-x-0 border-r border-gray-100 dark:border-slate-800 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className={`p-6 flex ${isSidebarCollapsed ? 'flex-col items-center' : 'justify-between items-center'}`}>
          <div className={`flex items-center gap-3 min-w-0 ${isSidebarCollapsed ? 'flex-col' : ''}`}>
             <div className="w-10 h-10 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                <img 
                  src="https://i.postimg.cc/NFKqCphP/logo-CTHSLA.png" 
                  alt="Logo" 
                  className="w-[35px] h-[35px] object-contain" 
                  referrerPolicy="no-referrer"
                />
             </div>
             {!isSidebarCollapsed && (
               <div className="flex flex-col min-w-0">
                  <span className="text-xs font-black uppercase tracking-tight truncate text-slate-900 dark:text-white">{systemSettings.shortName}</span>
                  <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase mt-0.5 truncate tracking-tighter">Cán bộ: {currentUser.fullName || 'User'}</span>
               </div>
             )}
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-all"
              title={isSidebarCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
            >
              {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={20} /></button>
          </div>
        </div>
 
        <nav className={`flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar ${isSidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
          <button onClick={() => handleTabChange('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'text-white shadow-lg' : 'text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'} ${isSidebarCollapsed ? 'justify-center px-0' : ''}`} style={activeTab === 'dashboard' ? primaryBgStyle : {}} title="Tổng quan">
            <LayoutDashboard size={20} /> 
            {!isSidebarCollapsed && <span className="font-bold text-sm">Tổng quan</span>}
          </button>
          <button onClick={() => handleTabChange('reports')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'reports' ? 'text-white shadow-lg' : 'text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'} ${isSidebarCollapsed ? 'justify-center px-0' : ''}`} style={activeTab === 'reports' ? primaryBgStyle : {}} title="Báo cáo">
            <FileText size={20} /> 
            {!isSidebarCollapsed && <span className="font-bold text-sm">Báo cáo</span>}
          </button>
          <button onClick={() => handleTabChange('meetings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'meetings' ? 'text-white shadow-lg' : 'text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'} ${isSidebarCollapsed ? 'justify-center px-0' : ''}`} style={activeTab === 'meetings' ? primaryBgStyle : {}} title="Lịch họp">
            <CalendarDays size={20} /> 
            {!isSidebarCollapsed && <span className="font-bold text-sm">Lịch họp</span>}
          </button>
          <button onClick={() => handleTabChange('operators')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'operators' ? 'text-white shadow-lg' : 'text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'} ${isSidebarCollapsed ? 'justify-center px-0' : ''}`} style={activeTab === 'operators' ? primaryBgStyle : {}} title="Danh bạ">
            <Users size={20} /> 
            {!isSidebarCollapsed && <span className="font-bold text-sm">Danh bạ</span>}
          </button>
          {isAdmin && (
            <button onClick={() => handleTabChange('monitoring')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'monitoring' ? 'text-white shadow-lg' : 'text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'} ${isSidebarCollapsed ? 'justify-center px-0' : ''}`} style={activeTab === 'monitoring' ? primaryBgStyle : {}} title="Giám sát">
              <MonitorPlay size={20} /> 
              {!isSidebarCollapsed && <span className="font-bold text-sm">Giám sát</span>}
            </button>
          )}
          {isAdmin && (
            <div className={`pt-4 border-t border-gray-100 dark:border-slate-800 space-y-1 ${isSidebarCollapsed ? 'w-full flex flex-col items-center' : ''}`}>
               {!isSidebarCollapsed && <p className="px-4 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">Hệ thống</p>}
               <button onClick={() => handleTabChange('management')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'management' ? 'text-white shadow-lg' : 'text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'} ${isSidebarCollapsed ? 'justify-center px-0' : ''}`} style={activeTab === 'management' ? primaryBgStyle : {}} title="Danh mục">
                 <Settings size={20} /> 
                 {!isSidebarCollapsed && <span className="font-bold text-sm">Danh mục</span>}
               </button>
               <button onClick={() => handleTabChange('accounts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'accounts' ? 'text-white shadow-lg' : 'text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'} ${isSidebarCollapsed ? 'justify-center px-0' : ''}`} style={activeTab === 'accounts' ? primaryBgStyle : {}} title="Tài khoản">
                 <Users size={20} /> 
                 {!isSidebarCollapsed && <span className="font-bold text-sm">Tài khoản</span>}
               </button>
               <button onClick={() => handleTabChange('deployment')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'deployment' ? 'text-white shadow-lg' : 'text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'} ${isSidebarCollapsed ? 'justify-center px-0' : ''}`} style={activeTab === 'deployment' ? primaryBgStyle : {}} title="Triển khai">
                 <Share2 size={20} /> 
                 {!isSidebarCollapsed && <span className="font-bold text-sm">Triển khai</span>}
               </button>
            </div>
          )}
        </nav>
 
        <div className={`p-6 border-t border-gray-100 dark:border-slate-800 ${isSidebarCollapsed ? 'flex justify-center px-0' : ''}`}>
           <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-all font-bold text-sm ${isSidebarCollapsed ? 'justify-center px-0' : ''}`} title="Đăng xuất">
             <LogOut size={18} /> 
             {!isSidebarCollapsed && <span>Đăng xuất</span>}
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F5F5F5] dark:bg-slate-950 transition-colors duration-300">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 md:px-8 justify-between shrink-0 shadow-sm transition-colors duration-300">
          <button onClick={toggleSidebar} className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><Menu size={24} /></button>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full">
                <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-spin' : 'bg-emerald-500 animate-pulse'}`}></div>
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  {isSyncing ? 'Đang đồng bộ...' : `Cloud Sync: ${lastRefreshed.toLocaleTimeString('vi-VN', { hour12: false })}`}
                </span>
             </div>
          </div>
 
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group relative"
              title={isDarkMode ? "Chế độ sáng" : "Chế độ tối"}
            >
              {isDarkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-slate-600" />}
            </button>
 
            <button 
              onClick={() => setIsChangePasswordOpen(true)}
              className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group relative"
              title="Đổi mật khẩu"
            >
              <ShieldEllipsis size={20} className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            </button>
            
            <div className="flex items-center gap-3 bg-blue-50/50 dark:bg-blue-900/20 px-4 py-1.5 rounded-full border border-blue-100/50 dark:border-blue-800/30">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-black shadow-lg shadow-blue-200">
                {(currentUser?.fullName || 'U').trim().split(/\s+/).pop()?.charAt(0).toUpperCase() || 'U'}
              </div>
              <p className="text-xs font-black text-slate-700 dark:text-slate-300 hidden sm:block">
                Tài khoản: <span style={primaryTextStyle}>{currentUser?.fullName || 'N/A'}</span>
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               {/* Upcoming Meeting Banner Alert */}
               {currentAlertMeeting && (
                 <UpcomingAlert 
                   meeting={currentAlertMeeting} 
                   onViewDetail={setSelectedMeeting} 
                 />
               )}

               {/* Primary Stats */}
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  <StatCard title="Họp trong Tuần" value={dashboardStats.weekly} icon={<CalendarDays />} description="Tổng số cuộc họp diễn ra trong tuần này." color="text-blue-600 dark:text-blue-400" />
                  <StatCard title="Họp trong Tháng" value={dashboardStats.monthly} icon={<FileText />} description="Tổng số cuộc họp diễn ra trong tháng này." color="text-emerald-500 dark:text-emerald-400" />
                  <StatCard title="Họp trong Năm" value={dashboardStats.yearly} icon={<BarChart3 />} description={`Tổng số cuộc họp trong năm ${new Date().getFullYear()}.`} color="text-amber-500 dark:text-amber-400" />
                  <StatCard title="Uptime Hạ tầng" value={`${dashboardStats.uptime}%`} icon={<MonitorPlay />} description="Tỷ lệ điểm cầu đang trực tuyến." color="text-indigo-600 dark:text-indigo-400" />
               </div>

               {/* Efficiency KPIs Section */}
               <div className="space-y-4">
                  <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] border-l-4 border-blue-600 pl-4 mb-4">Chỉ số Hiệu quả Vận hành (KPIs)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard 
                      title="Thời lượng TB (Giờ)" 
                      value={dashboardStats.avgDuration} 
                      icon={<Clock />} 
                      trend="Ổn định"
                      trendUp={true}
                      description="Thời gian trung bình của mỗi cuộc họp diễn ra trên hệ thống."
                      tooltipTitle="Hiệu suất thời gian"
                      color="text-indigo-600 dark:text-indigo-400"
                    />
                    <StatCard 
                      title="Tỷ lệ đúng giờ" 
                      value={`${dashboardStats.onTimeRate}%`} 
                      icon={<Zap />} 
                      trend="+2.1%"
                      trendUp={true}
                      description="Tỷ lệ các cuộc họp bắt đầu và kết nối điểm cầu đúng thời gian quy định."
                      tooltipTitle="Độ tin cậy hạ tầng"
                      color="text-yellow-600 dark:text-yellow-400"
                    />
                    <StatCard 
                      title="Điểm hiệu quả" 
                      value={dashboardStats.engagementScore} 
                      icon={<Target />} 
                      trend="+8"
                      trendUp={true}
                      description="Điểm số đánh giá mức độ tương tác và quy mô tổ chức các hội nghị."
                      tooltipTitle="Chỉ số tương tác"
                      color="text-red-600 dark:text-red-400"
                    />
                  </div>
               </div>

               <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  <div className="xl:col-span-2 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-sm">
                     <h3 className="text-xs font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest mb-8">Tần suất họp (7 ngày qua)</h3>
                     <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={dashboardStats.last7Days}>
                              <defs>
                                <linearGradient id="colorCount" x1="0" x2="0" y2="1">
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
                  
                  <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col">
                     <h3 className="text-xs font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest mb-8">Top Đơn vị chủ trì</h3>
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
                     <div className="mt-4 pt-4 border-t border-gray-50 dark:border-slate-700">
                        <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Đơn vị tích cực nhất:</p>
                        <div className="text-sm font-black text-slate-900 dark:text-white mt-1 truncate flex items-center gap-2">
                           <Building2 size={14} className="text-blue-500" />
                           {dashboardStats.topUnit}
                        </div>
                     </div>
                  </div>
               </div>

               <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="p-6 md:p-8 border-b border-gray-50 dark:border-slate-700 flex justify-between items-center bg-[#F5F5F5]/30 dark:bg-slate-900/30">
                     <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Cuộc họp gần đây</h3>
                     <button onClick={() => setActiveTab('meetings')} style={primaryTextStyle} className="text-xs font-bold hover:underline">Xem tất cả</button>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm min-w-[800px]">
                        <thead className="bg-[#F5F5F5]/50 dark:bg-slate-900/50 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                           <tr>
                              <th className="px-8 py-4">Tên cuộc họp</th>
                              <th className="px-8 py-4">Đơn vị chủ trì</th>
                              <th className="px-8 py-4">Thời gian</th>
                              <th className="px-8 py-4 text-center">Trạng thái</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                           {dashboardStats.recentMeetings.map(m => (
                             <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all cursor-pointer" onClick={() => setSelectedMeeting(m)}>
                                <td className="px-8 py-5">
                                   <div className={`font-bold text-sm line-clamp-1 ${m.status === 'CANCELLED' ? 'text-red-600 line-through' : m.status === 'POSTPONED' ? 'text-amber-600 italic' : 'text-gray-900 dark:text-white'}`}>
                                     {m.title}
                                   </div>
                                   <div className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 font-mono uppercase tracking-tighter">ID: {m.id}</div>
                                </td>
                                <td className="px-8 py-5">
                                   <div className="font-bold text-[11px] text-slate-700 dark:text-slate-300">{m.hostUnit}</div>
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
          {activeTab === 'meetings' && (
            <MeetingList 
              meetings={meetings} 
              onSelect={setSelectedMeeting} 
              isAdmin={canManageMeetings} 
              onEdit={m => { setEditingMeeting(m); setIsCreateModalOpen(true); }} 
              onDelete={isAdmin ? handleDeleteMeeting : undefined} 
              onAdd={() => { setEditingMeeting(null); setIsCreateModalOpen(true); }} 
              onUpdate={handleUpdateMeeting} 
            />
          )}
          {activeTab === 'operators' && (
            <OperatorManagement 
              operators={operators} 
              endpoints={endpoints}
              onAdd={async o => {
                const newOp = { ...o, id: `OP-${Date.now()}` };
                if (supabaseService.isConfigured()) {
                  await supabaseService.upsertOperator(newOp);
                }
                setOperators(prev => [newOp, ...prev]);
              }}
              onUpdate={async o => {
                if (supabaseService.isConfigured()) {
                  await supabaseService.upsertOperator(o);
                }
                setOperators(prev => prev.map(item => item.id === o.id ? o : item));
              }}
              onDelete={async id => {
                if (supabaseService.isConfigured()) {
                  await supabaseService.deleteOperator(id);
                }
                setOperators(prev => prev.filter(o => o.id !== id));
              }}
              onImport={async ops => {
                if (supabaseService.isConfigured()) {
                  for (const o of ops) {
                    const newOp = { ...o, id: `OP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
                    await supabaseService.upsertOperator(newOp);
                  }
                }
              }}
            />
          )}
          {activeTab === 'monitoring' && isAdmin && <MonitoringGrid endpoints={endpoints} onUpdateEndpoint={async (e) => {
              if (supabaseService.isConfigured()) {
                try { await supabaseService.upsertEndpoint(e); } catch (err) { console.error(err); }
              }
              setEndpoints(prev => {
                const next = prev.map(item => item.id === e.id ? e : item);
                storageService.saveEndpoints(next);
                return next;
              });
          }} />}
          {activeTab === 'management' && <ManagementPage 
              units={units} staff={staff} participantGroups={groups} endpoints={endpoints} systemSettings={systemSettings} 
              onAddUnit={async u => { 
                const newUnit = { ...u, id: `U${Date.now()}` };
                if (supabaseService.isConfigured()) {
                  try { await supabaseService.upsertUnit(newUnit); } catch (err) { console.error(err); }
                }
                setUnits(prev => {
                  const next = [...prev, newUnit];
                  storageService.saveUnits(next);
                  return next;
                });
              }} 
              onUpdateUnit={async u => { 
                if (supabaseService.isConfigured()) {
                  try { await supabaseService.upsertUnit(u); } catch (err) { console.error(err); }
                }
                setUnits(prev => {
                  const next = prev.map(item => item.id === u.id ? u : item);
                  storageService.saveUnits(next);
                  return next;
                });
              }} 
              onDeleteUnit={async id => { 
                if (supabaseService.isConfigured()) {
                  try { await supabaseService.deleteUnit(id); } catch (err) { console.error(err); }
                }
                setUnits(prev => {
                  const next = prev.filter(u => u.id !== id);
                  storageService.saveUnits(next);
                  return next;
                });
              }}
              onAddStaff={async s => { 
                const newStaff = { ...s, id: `S${Date.now()}` };
                if (supabaseService.isConfigured()) {
                  try { await supabaseService.upsertStaff(newStaff); } catch (err) { console.error(err); }
                }
                setStaff(prev => {
                  const next = [...prev, newStaff];
                  storageService.saveStaff(next);
                  return next;
                });
              }}
              onUpdateStaff={async s => { 
                if (supabaseService.isConfigured()) {
                  try { await supabaseService.upsertStaff(s); } catch (err) { console.error(err); }
                }
                setStaff(prev => {
                  const next = prev.map(item => item.id === s.id ? s : item);
                  storageService.saveStaff(next);
                  return next;
                });
              }}
              onDeleteStaff={async id => { 
                if (supabaseService.isConfigured()) {
                  try { await supabaseService.deleteStaff(id); } catch (err) { console.error(err); }
                }
                setStaff(prev => {
                  const next = prev.filter(s => s.id !== id);
                  storageService.saveStaff(next);
                  return next;
                });
              }}
              onAddGroup={async g => { 
                const newGroup = { ...g, id: `G${Date.now()}` };
                if (supabaseService.isConfigured()) {
                  try { await supabaseService.upsertGroup(newGroup); } catch (err) { console.error(err); }
                }
                setGroups(prev => {
                  const next = [newGroup, ...prev];
                  storageService.saveGroups(next);
                  return next;
                });
              }}
              onUpdateGroup={async g => { 
                if (supabaseService.isConfigured()) {
                  try { await supabaseService.upsertGroup(g); } catch (err) { console.error(err); }
                }
                setGroups(prev => {
                  const next = prev.map(item => item.id === g.id ? g : item);
                  storageService.saveGroups(next);
                  return next;
                });
              }}
              onDeleteGroup={async id => { 
                if (supabaseService.isConfigured()) {
                  try { await supabaseService.deleteGroup(id); } catch (err) { console.error(err); }
                }
                setGroups(prev => {
                  const next = prev.filter(g => g.id !== id);
                  storageService.saveGroups(next);
                  return next;
                });
              }}
              onAddEndpoint={async e => { 
                const newEp = { ...e, id: `${Date.now()}`, status: EndpointStatus.DISCONNECTED, lastConnected: 'N/A' };
                if (supabaseService.isConfigured()) {
                  try { await supabaseService.upsertEndpoint(newEp); } catch (err) { console.error(err); }
                }
                setEndpoints(prev => {
                  const next = [...prev, newEp];
                  storageService.saveEndpoints(next);
                  return next;
                });
              }}
              onUpdateEndpoint={async (e) => {
                if (supabaseService.isConfigured()) {
                  try { await supabaseService.upsertEndpoint(e); } catch (err) { console.error(err); }
                }
                setEndpoints(prev => {
                  const next = prev.map(item => item.id === e.id ? e : item);
                  storageService.saveEndpoints(next);
                  return next;
                });
              }}
              onDeleteEndpoint={async id => { 
                if (supabaseService.isConfigured()) {
                  try { await supabaseService.deleteEndpoint(id); } catch (err) { console.error(err); }
                }
                setEndpoints(prev => {
                  const next = prev.filter(e => e.id !== id);
                  storageService.saveEndpoints(next);
                  return next;
                });
              }}
              onUpdateSettings={async s => {
                if (supabaseService.isConfigured()) {
                  try {
                    await supabaseService.updateSettings(s);
                  } catch (err) {
                    console.error("Lỗi cập nhật cấu hình lên Cloud:", err);
                  }
                }
                setSystemSettings(s);
                storageService.saveSystemSettings(s);
              }} 
          />}
          {activeTab === 'accounts' && <UserManagement users={users} currentUser={currentUser!} onAddUser={async u => {
              const newUser = { ...u, id: `${Date.now()}` };
              if (supabaseService.isConfigured()) {
                try { await supabaseService.upsertUser(newUser); } catch (err) { console.error(err); }
              }
              setUsers(prev => {
                const next = [...prev, newUser];
                storageService.saveUsers(next);
                return next;
              });
          }} onUpdateUser={async u => {
              if (supabaseService.isConfigured()) {
                try { await supabaseService.upsertUser(u); } catch (err) { console.error(err); }
              }
              setUsers(prev => {
                const next = prev.map(item => item.id === u.id ? u : item);
                storageService.saveUsers(next);
                return next;
              });
          }} onDeleteUser={async id => {
              if (supabaseService.isConfigured()) {
                try { await supabaseService.deleteUser(id); } catch (err) { console.error(err); }
              }
              setUsers(prev => {
                const next = prev.filter(u => u.id !== id);
                storageService.saveUsers(next);
                return next;
              });
          }} />}
          {activeTab === 'deployment' && <ExportPage />}
        </div>
      </main>

      {/* Global Notifications */}
      {showToast && currentAlertMeeting && (
        <NotificationToast 
          meeting={currentAlertMeeting} 
          onClose={() => setShowToast(false)} 
          onAction={() => {
            setSelectedMeeting(currentAlertMeeting);
            setShowToast(false);
          }}
        />
      )}

      {selectedMeeting && <MeetingDetailModal meeting={selectedMeeting} onClose={() => setSelectedMeeting(null)} onUpdate={handleUpdateMeeting} />}
      {isCreateModalOpen && <CreateMeetingModal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setEditingMeeting(null); }} onCreate={handleCreateMeeting} onUpdate={handleUpdateMeeting} units={units} staff={staff} availableEndpoints={endpoints} editingMeeting={editingMeeting} />}
      
      {isChangePasswordOpen && currentUser && (
        <ChangePasswordModal 
          isOpen={isChangePasswordOpen} 
          onClose={() => setIsChangePasswordOpen(false)} 
          currentUser={currentUser} 
          onUpdate={handleSelfUpdatePassword}
        />
      )}
    </div>
  );
};

export default App;
