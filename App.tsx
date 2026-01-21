
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import { Meeting, Endpoint, EndpointStatus, Unit, Staff, ParticipantGroup, User } from './types';
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
import { databaseService } from './services/databaseService';

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
  
  const [dbStatus, setDbStatus] = useState<'CONNECTING' | 'ONLINE' | 'OFFLINE'>('CONNECTING');
  
  const [endpoints, setEndpoints] = useState<Endpoint[]>(() => storageService.getEndpoints());
  const [units, setUnits] = useState<Unit[]>(() => storageService.getUnits());
  const [staff, setStaff] = useState<Staff[]>(() => storageService.getStaff());
  const [groups, setGroups] = useState<ParticipantGroup[]>(() => storageService.getGroups());
  const [users, setUsers] = useState<User[]>(() => storageService.getUsers());

  const checkDb = useCallback(async () => {
    const result = await databaseService.checkConnection();
    setDbStatus(result.status);
  }, []);

  useEffect(() => {
    checkDb();
    const interval = setInterval(() => checkDb(), 60000);
    return () => clearInterval(interval);
  }, [checkDb]);

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

  const handleCreateMeeting = (newMeeting: Meeting) => {
    const updated = [newMeeting, ...meetings];
    setMeetings(updated);
    storageService.saveMeetings(updated);
    setIsCreateModalOpen(false);
  };

  const handleUpdateMeeting = (updatedMeeting: Meeting) => {
    const updated = meetings.map(m => m.id === updatedMeeting.id ? updatedMeeting : m);
    setMeetings(updated);
    storageService.saveMeetings(updated);
    setEditingMeeting(null);
    setIsCreateModalOpen(false);
    if (selectedMeeting?.id === updatedMeeting.id) {
        setSelectedMeeting(updatedMeeting);
    }
  };

  const handleDeleteMeeting = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch họp này?')) {
      const updated = meetings.filter(m => m.id !== id);
      setMeetings(updated);
      storageService.saveMeetings(updated);
    }
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setIsCreateModalOpen(true);
  };

  if (!currentUser) return <LoginView users={users} onLoginSuccess={setCurrentUser} />;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 shadow-xl z-10 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-3">
            <div className="relative group">
               <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
               <div className="relative p-2 bg-slate-800 border border-slate-700 rounded-xl">
                <svg className="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 7L12 12L4 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="2.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1"/>
                </svg>
               </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg leading-none font-black bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent uppercase tracking-tighter">E-Meeting</span>
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-0.5">SLA Platform</span>
            </div>
          </h1>
        </div>

        <nav className="mt-2 px-4 space-y-1 flex-1 overflow-y-auto">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" /></svg>
            <span className="font-semibold text-sm">Tổng quan</span>
          </button>
          
          <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'reports' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="font-semibold text-sm">Báo cáo & Thống kê</span>
          </button>

          <button onClick={() => setActiveTab('meetings')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'meetings' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="font-semibold text-sm">Quản lý lịch họp</span>
          </button>
          
          {isAdmin && (
            <>
              <div className="pt-4 pb-1 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Hệ thống</div>
              <button onClick={() => setActiveTab('monitoring')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'monitoring' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                <span className="font-semibold text-sm">Giám sát điểm cầu</span>
              </button>
              <button onClick={() => setActiveTab('management')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'management' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                <span className="font-semibold text-sm">Danh mục chung</span>
              </button>
              <button onClick={() => setActiveTab('accounts')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'accounts' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                <span className="font-semibold text-sm">Quản trị Tài khoản</span>
              </button>
              <button onClick={() => setActiveTab('deployment')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'deployment' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
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
             activeTab === 'management' ? 'Quản lý Danh mục' :
             activeTab === 'reports' ? 'Báo cáo & Xuất dữ liệu' :
             activeTab === 'accounts' ? 'Quản lý Tài khoản' : 
             activeTab === 'deployment' ? 'Phát hành & Quản lý Từ xa' : 'Triển khai hệ thống'}
          </h2>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-xl shadow-sm">
             <div className={`w-2 h-2 rounded-full ${dbStatus === 'ONLINE' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{dbStatus === 'ONLINE' ? 'Database Online' : 'Database Offline'}</span>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-8 pb-12">
            {/* Thống kê Tổng quan (Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              <StatCard title="Tổng số cuộc họp" value={stats.total} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} trend="+5%" trendUp={true} />
              <StatCard title="Tổng điểm cầu" value={endpoints.length} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3" /></svg>} trend="Cố định" trendUp={true} />
              <StatCard title="Điểm cầu Online" value={stats.connected} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 1 1 0 12.728m-9.9-2.828a5 5 0 0 1 0-7.07m7.072 0a5 5 0 0 1 0 7.07M13 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" /></svg>} trend="Sẵn sàng" trendUp={true} />
              <StatCard title="Mất kết nối" value={stats.disconnected} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" /></svg>} trend="Cần xử lý" trendUp={false} />
              <StatCard title="SLA Khả dụng" value="96.5%" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>} trend="+0.2%" trendUp={true} />
            </div>

            {/* Bộ lọc Thống kê Đa chiều */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">Thống kê Cuộc họp</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Theo Tuần, Tháng, Năm và Đơn vị chủ trì</p>
                  </div>
                </div>
                
                <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
                   <button onClick={() => setStatsPeriod('week')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statsPeriod === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Tuần</button>
                   <button onClick={() => setStatsPeriod('month')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statsPeriod === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Tháng</button>
                   <button onClick={() => setStatsPeriod('year')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statsPeriod === 'year' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Năm</button>
                   <button onClick={() => setStatsPeriod('unit')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statsPeriod === 'unit' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Đơn vị</button>
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
                      <Bar dataKey="count" fill={statsPeriod === 'week' ? '#10B981' : statsPeriod === 'month' ? '#3B82F6' : '#8B5CF6'} radius={[8, 8, 0, 0]} barSize={statsPeriod === 'year' ? 60 : 32}>
                        {(statsPeriod === 'week' ? dynamicStats.weekly : statsPeriod === 'month' ? dynamicStats.monthly : dynamicStats.yearly).map((entry, index) => (
                           <Cell key={`cell-${index}`} fillOpacity={0.85} className="hover:fill-opacity-100 transition-all cursor-pointer" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Thông tin cuộc họp chi tiết */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                  Thông tin Cuộc họp trong kỳ ({dashboardMeetingList.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/30">
                      <th className="px-6 py-4">Chủ đề & Đơn vị</th>
                      <th className="px-6 py-4">Thời gian</th>
                      <th className="px-6 py-4">Chủ trì</th>
                      <th className="px-6 py-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {dashboardMeetingList.map((meeting) => (
                      <tr key={meeting.id} className="hover:bg-blue-50/30 transition-all group">
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900">{meeting.title}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{meeting.hostUnit}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold text-gray-700">{new Date(meeting.startTime).toLocaleDateString('vi-VN')}</div>
                          <div className="text-[10px] text-gray-500 font-medium">{new Date(meeting.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-gray-700">{meeting.chairPerson}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => setSelectedMeeting(meeting)} className="px-4 py-1.5 bg-white border border-gray-200 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95">Chi tiết</button>
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
          <MeetingList meetings={meetings} onSelect={setSelectedMeeting} isAdmin={isAdmin} onEdit={handleEditMeeting} onDelete={handleDeleteMeeting} onAdd={() => { setEditingMeeting(null); setIsCreateModalOpen(true); }} />
        )}
        
        {activeTab === 'monitoring' && <MonitoringGrid endpoints={endpoints} onUpdateEndpoint={isAdmin ? e => {
          const updated = endpoints.map(item => item.id === e.id ? e : item);
          setEndpoints(updated);
          storageService.saveEndpoints(updated);
        } : undefined} />}

        {activeTab === 'management' && isAdmin && (
          <ManagementPage 
            units={units} staff={staff} participantGroups={groups} endpoints={endpoints}
            onAddUnit={u => { const updated = [...units, { ...u, id: `U${Date.now()}` }]; setUnits(updated); storageService.saveUnits(updated); }}
            onUpdateUnit={u => { const updated = units.map(item => item.id === u.id ? u : item); setUnits(updated); storageService.saveUnits(updated); }}
            onDeleteUnit={id => { if (window.confirm('Xóa đơn vị?')) { const updated = units.filter(u => u.id !== id); setUnits(updated); storageService.saveUnits(updated); }}}
            onAddStaff={s => { const updated = [...staff, { ...s, id: `S${Date.now()}` }]; setStaff(updated); storageService.saveStaff(updated); }}
            onUpdateStaff={s => { const updated = staff.map(item => item.id === s.id ? s : item); setStaff(updated); storageService.saveStaff(updated); }}
            onDeleteStaff={id => { if (window.confirm('Xóa cán bộ?')) { const updated = staff.filter(s => s.id !== id); setStaff(updated); storageService.saveStaff(updated); }}}
            onAddEndpoint={e => { const updated = [...endpoints, { ...e, id: `${Date.now()}`, status: EndpointStatus.DISCONNECTED, lastConnected: 'N/A' }]; setEndpoints(updated); storageService.saveEndpoints(updated); }}
            onUpdateEndpoint={e => { const updated = endpoints.map(item => item.id === e.id ? e : item); setEndpoints(updated); storageService.saveEndpoints(updated); }}
            onDeleteEndpoint={id => { if (window.confirm('Xóa điểm cầu?')) { const updated = endpoints.filter(e => e.id !== id); setEndpoints(updated); storageService.saveEndpoints(updated); }}}
            onAddGroup={g => { const updated = [...groups, { ...g, id: `G${Date.now()}` }]; setGroups(updated); storageService.saveGroups(updated); }}
            onUpdateGroup={g => { const updated = groups.map(item => item.id === g.id ? g : item); setGroups(updated); storageService.saveGroups(updated); }}
            onDeleteGroup={id => { if (window.confirm('Xóa thành phần?')) { const updated = groups.filter(g => g.id !== id); setGroups(updated); storageService.saveGroups(updated); }}}
          />
        )}

        {activeTab === 'accounts' && isAdmin && (
          <UserManagement users={users} currentUser={currentUser} onAddUser={u => { const updated = [...users, { ...u, id: `${Date.now()}` }]; setUsers(updated); storageService.saveUsers(updated); }} onUpdateUser={u => { const updated = users.map(item => item.id === u.id ? u : item); setUsers(updated); storageService.saveUsers(updated); }} onDeleteUser={id => { if (window.confirm('Xóa người dùng?')) { const updated = users.filter(u => u.id !== id); setUsers(updated); storageService.saveUsers(updated); }}} />
        )}

        {activeTab === 'deployment' && isAdmin && <ExportPage />}
      </main>

      {selectedMeeting && <MeetingDetailModal meeting={selectedMeeting} onClose={() => setSelectedMeeting(null)} onUpdate={handleUpdateMeeting} />}

      {isCreateModalOpen && <CreateMeetingModal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setEditingMeeting(null); }} onCreate={handleCreateMeeting} onUpdate={handleUpdateMeeting} units={units} staff={staff} availableEndpoints={endpoints} editingMeeting={editingMeeting} />}
    </div>
  );
};

export default App;
