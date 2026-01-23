
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, AreaChart, Area, Legend
} from 'recharts';
import { LayoutDashboard, CalendarDays, MonitorPlay, FileText, Settings, Users, Share2, LogOut, Menu, X } from 'lucide-react';
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

  const isAdmin = currentUser?.role === 'ADMIN';
  const isOperator = currentUser?.role === 'OPERATOR';
  const canManageMeetings = isAdmin || isOperator;

  // Supabase Initial Sync & Real-time Subscriptions
  useEffect(() => {
    if (!supabaseService.isConfigured()) return;
    const syncInitialData = async () => {
      try {
        const [cloudMeetings, cloudEndpoints, cloudUnits, cloudStaff, cloudGroups, cloudUsers, cloudSettings] = await Promise.all([
          supabaseService.getMeetings(), supabaseService.getEndpoints(), supabaseService.getUnits(),
          supabaseService.getStaff(), supabaseService.getGroups(), supabaseService.getUsers(), supabaseService.getSettings()
        ]);
        if (cloudMeetings.length > 0) { setMeetings(cloudMeetings); storageService.saveMeetings(cloudMeetings); }
        if (cloudEndpoints.length > 0) { setEndpoints(cloudEndpoints); storageService.saveEndpoints(cloudEndpoints); }
        if (cloudUnits.length > 0) { setUnits(cloudUnits); storageService.saveUnits(cloudUnits); }
        if (cloudStaff.length > 0) { setStaff(cloudStaff); storageService.saveStaff(cloudStaff); }
        if (cloudGroups.length > 0) { setGroups(cloudGroups); storageService.saveGroups(cloudGroups); }
        if (cloudUsers.length > 0) { setUsers(cloudUsers); storageService.saveUsers(cloudUsers); }
        if (cloudSettings) { setSystemSettings(cloudSettings); storageService.saveSystemSettings(cloudSettings); }
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
        else if (table === 'system_settings' && mappedData) { setSystemSettings(mappedData); storageService.saveSystemSettings(mappedData); }
      });
    });
    return () => subscriptions.forEach(sub => sub?.unsubscribe());
  }, []);

  // Handlers for Meetings
  // Fix: Added handleDeleteMeeting to fix the 'Cannot find name handleDeleteMeeting' error.
  const handleDeleteMeeting = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa cuộc họp này?')) return;
    const nextMeetings = meetings.filter(m => m.id !== id);
    setMeetings(nextMeetings);
    storageService.saveMeetings(nextMeetings);
    if (supabaseService.isConfigured()) {
      try {
        await supabaseService.deleteMeeting(id);
      } catch (err) {
        console.error("Xóa thất bại trên cloud:", err);
      }
    }
  };

  // Fix: Added handleCreateMeeting to properly update state and storage when creating a new meeting.
  const handleCreateMeeting = async (meeting: Meeting) => {
    const nextMeetings = [meeting, ...meetings];
    setMeetings(nextMeetings);
    storageService.saveMeetings(nextMeetings);
    if (supabaseService.isConfigured()) {
      try {
        await supabaseService.upsertMeeting(meeting);
      } catch (err) {
        console.error("Lưu thất bại trên cloud:", err);
      }
    }
  };

  // Fix: Added handleUpdateMeeting to properly update state and storage when modifying an existing meeting.
  const handleUpdateMeeting = async (meeting: Meeting) => {
    const nextMeetings = meetings.map(m => m.id === meeting.id ? meeting : m);
    setMeetings(nextMeetings);
    storageService.saveMeetings(nextMeetings);
    if (supabaseService.isConfigured()) {
      try {
        await supabaseService.upsertMeeting(meeting);
      } catch (err) {
        console.error("Cập nhật thất bại trên cloud:", err);
      }
    }
    // Update selectedMeeting if it is currently being viewed
    if (selectedMeeting?.id === meeting.id) {
      setSelectedMeeting(meeting);
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

  const navigation = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'meetings', label: 'Lịch họp', icon: CalendarDays },
    { id: 'monitoring', label: 'Giám sát', icon: MonitorPlay },
    { id: 'reports', label: 'Báo cáo', icon: FileText },
  ];

  const adminNav = [
    { id: 'management', label: 'Danh mục', icon: Settings },
    { id: 'accounts', label: 'Tài khoản', icon: Users },
    { id: 'deployment', label: 'Triển khai', icon: Share2 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20 md:pb-0 md:flex-row overflow-x-hidden">
      
      {/* PC Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col shadow-2xl z-20">
        <div className="p-6">
          <h1 className="flex items-center gap-3">
             <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center overflow-hidden">
                {systemSettings.logoBase64 ? <img src={systemSettings.logoBase64} className="max-w-full max-h-full" /> : <span className="text-cyan-400 font-bold">SL</span>}
             </div>
             <span className="text-sm font-black uppercase">{systemSettings.shortName}</span>
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navigation.map(nav => (
            <button key={nav.id} onClick={() => setActiveTab(nav.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === nav.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800'}`}>
              <nav.icon size={20} />
              <span className="font-bold text-sm">{nav.label}</span>
            </button>
          ))}
          {isAdmin && (
            <div className="pt-4 border-t border-slate-800 space-y-1">
               <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Quản trị</p>
               {adminNav.map(nav => (
                <button key={nav.id} onClick={() => setActiveTab(nav.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === nav.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                  <nav.icon size={20} />
                  <span className="font-bold text-sm">{nav.label}</span>
                </button>
              ))}
            </div>
          )}
        </nav>
        <div className="p-6 border-t border-slate-800">
           <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 font-bold text-sm hover:text-red-300">
              <LogOut size={18} /> Đăng xuất
           </button>
        </div>
      </aside>

      {/* Mobile TopBar */}
      <header className="md:hidden sticky top-0 bg-slate-900 text-white p-4 flex justify-between items-center z-30 shadow-lg">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xs uppercase">SL</div>
             <h2 className="text-xs font-black uppercase tracking-tighter">{activeTab === 'dashboard' ? 'Tổng quan' : activeTab === 'meetings' ? 'Lịch họp' : activeTab === 'monitoring' ? 'Giám sát' : 'Báo cáo'}</h2>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-300">
             {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setIsSidebarOpen(false)}>
           <div className="absolute right-0 top-0 bottom-0 w-3/4 bg-slate-900 p-6 flex flex-col animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Menu mở rộng</h3>
              <div className="space-y-2 flex-1">
                 {adminNav.map(nav => (
                   <button key={nav.id} onClick={() => { setActiveTab(nav.id as any); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl ${activeTab === nav.id ? 'bg-blue-600 text-white' : 'bg-slate-800/50 text-slate-400'}`}>
                      <nav.icon size={20} /> <span className="font-bold">{nav.label}</span>
                   </button>
                 ))}
              </div>
              <button onClick={handleLogout} className="p-4 bg-red-600/10 text-red-500 rounded-2xl font-bold flex items-center gap-3 justify-center">
                 <LogOut size={18} /> Đăng xuất tài khoản
              </button>
           </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 page-transition">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Hôm nay" value={dashboardStats.total} icon={<CalendarDays size={20} />} />
                <StatCard title="Online" value={dashboardStats.connected} icon={<MonitorPlay size={20} />} trendUp={true} />
                <StatCard title="Uptime" value={`${dashboardStats.uptime}%`} icon={<Share2 size={20} />} />
                <div className="hidden lg:block">
                   <StatCard title="Điểm cầu" value={endpoints.length} icon={<Users size={20} />} />
                </div>
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                   <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-6">Xu hướng tuần</h3>
                   <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={dashboardStats.last7Days}>
                            <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={3} fill="#3B82F6" fillOpacity={0.1} />
                            <Tooltip />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-3xl shadow-xl text-white overflow-hidden relative">
                   <h3 className="text-xs font-black uppercase text-slate-500 mb-6">Trạng thái hạ tầng</h3>
                   <div className="flex flex-col items-center justify-center py-6">
                      <p className="text-5xl font-black text-blue-400">{dashboardStats.uptime}%</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Khả dụng hiện tại</p>
                   </div>
                </div>
             </div>

             <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                   <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Gần đây</h3>
                   <button onClick={() => setActiveTab('meetings')} className="text-xs font-bold text-blue-600">Xem hết</button>
                </div>
                <div className="divide-y divide-gray-50">
                   {dashboardStats.recentMeetings.map(m => (
                     <div key={m.id} className="p-4 flex items-center justify-between hover:bg-blue-50/50 transition-all cursor-pointer" onClick={() => setSelectedMeeting(m)}>
                        <div>
                           <p className="text-sm font-bold text-gray-900 line-clamp-1">{m.title}</p>
                           <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{new Date(m.startTime).toLocaleDateString('vi-VN')} • {m.hostUnit}</p>
                        </div>
                        <Share2 size={16} className="text-slate-300" />
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'meetings' && (
          <MeetingList 
            meetings={meetings} 
            onSelect={setSelectedMeeting} 
            isAdmin={canManageMeetings} 
            onEdit={(m) => { setEditingMeeting(m); setIsCreateModalOpen(true); }} 
            onDelete={handleDeleteMeeting} 
            onAdd={() => { setEditingMeeting(null); setIsCreateModalOpen(true); }} 
          />
        )}
        
        {activeTab === 'monitoring' && <MonitoringGrid endpoints={endpoints} />}
        {activeTab === 'reports' && <ReportsPage meetings={meetings} endpoints={endpoints} />}
        {activeTab === 'management' && <ManagementPage 
            units={units} staff={staff} participantGroups={groups} endpoints={endpoints} systemSettings={systemSettings}
            onAddUnit={()=>{}} onUpdateUnit={()=>{}} onAddStaff={()=>{}} onUpdateStaff={()=>{}} onAddGroup={()=>{}} onUpdateGroup={()=>{}} onAddEndpoint={()=>{}} onUpdateEndpoint={()=>{}} onDeleteUnit={()=>{}} onDeleteStaff={()=>{}} onDeleteGroup={()=>{}} onDeleteEndpoint={()=>{}} onUpdateSettings={()=>{}}
        />}
        {activeTab === 'accounts' && <UserManagement users={users} currentUser={currentUser!} onAddUser={()=>{}} onUpdateUser={()=>{}} onDeleteUser={()=>{}} />}
        {activeTab === 'deployment' && <ExportPage />}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center p-2 safe-area-bottom z-30 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
         {navigation.map(nav => (
           <button 
            key={nav.id} 
            onClick={() => setActiveTab(nav.id as any)} 
            className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === nav.id ? 'text-blue-600' : 'text-slate-400'}`}
           >
              <div className={`p-2 rounded-xl transition-all ${activeTab === nav.id ? 'bg-blue-50 scale-110' : ''}`}>
                 <nav.icon size={20} strokeWidth={activeTab === nav.id ? 2.5 : 2} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-tighter">{nav.label}</span>
           </button>
         ))}
      </nav>

      {/* Modals */}
      {/* Fix: Pass onUpdate handler to MeetingDetailModal */}
      {selectedMeeting && (
        <MeetingDetailModal 
          meeting={selectedMeeting} 
          onClose={() => setSelectedMeeting(null)} 
          onUpdate={handleUpdateMeeting}
        />
      )}
      {/* Fix: Pass proper handlers and editingMeeting to CreateMeetingModal */}
      {isCreateModalOpen && (
        <CreateMeetingModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
          onCreate={handleCreateMeeting} 
          onUpdate={handleUpdateMeeting}
          editingMeeting={editingMeeting}
          units={units} 
          staff={staff} 
          availableEndpoints={endpoints} 
        />
      )}
    </div>
  );
};

export default App;
