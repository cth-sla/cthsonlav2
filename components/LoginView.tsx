
import React, { useState, useMemo } from 'react';
import { User, SystemSettings, Meeting } from '../types';
import { ExternalLink, FileText, Lock, User as UserIcon, ArrowRight, Calendar, Clock, MapPin, Users as UsersIcon, CheckCircle2, AlertTriangle, XCircle, Activity } from 'lucide-react';

interface LoginViewProps {
  users: User[];
  meetings: Meeting[];
  onLoginSuccess: (user: User) => void;
  systemSettings: SystemSettings;
}

const LoginView: React.FC<LoginViewProps> = ({ users, meetings, onLoginSuccess, systemSettings }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPublicMeeting, setSelectedPublicMeeting] = useState<Meeting | null>(null);

  const upcomingMeetings = useMemo(() => {
    const now = new Date();
    return meetings
      .filter(m => new Date(m.endTime) >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 12);
  }, [meetings]);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const valid = meetings.filter(m => m.status !== 'CANCELLED');

    return {
      week: valid.filter(m => new Date(m.startTime) >= startOfWeek).length,
      month: valid.filter(m => new Date(m.startTime) >= startOfMonth).length,
      year: valid.filter(m => new Date(m.startTime) >= startOfYear).length,
    };
  }, [meetings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }
    setIsLoading(true);
    setError('');
    setTimeout(() => {
      const foundUser = users.find(u => u.username === username && u.password === password);
      if (foundUser) {
        onLoginSuccess(foundUser);
      } else {
        setError('Tài khoản hoặc mật khẩu không chính xác.');
        setIsLoading(false);
      }
    }, 1200);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleExternalLink = (e: React.MouseEvent, link?: string) => {
    e.stopPropagation();
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans bg-slate-950">
      {/* Background Image - Modern & Smooth */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-[30000ms] scale-110 animate-slow-zoom"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000")' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/80 to-slate-950/90"></div>
      </div>

      <div className="w-full max-w-7xl px-6 relative z-10 flex flex-col lg:flex-row items-stretch gap-10 py-8 lg:py-12 min-h-[90vh]">
        
        {/* Left Section: Branding, Stats & Meeting List */}
        <div className="flex-1 w-full flex flex-col space-y-6 animate-in fade-in slide-in-from-left duration-1000">
          <div className="shrink-0">
            <div className="relative inline-flex mb-4">
               <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-2xl"></div>
               <div className="relative p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[1.5rem] shadow-2xl flex items-center justify-center w-16 h-16 overflow-hidden">
                  {systemSettings.logoBase64 ? (
                    <img src={systemSettings.logoBase64} alt="System Logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <svg className="w-10 h-10 text-blue-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 22V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20 7L12 12L4 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
               </div>
            </div>
            <h1 className="flex flex-col items-start text-left space-y-1">
              <span className="text-2xl lg:text-3xl font-black text-white uppercase tracking-tighter leading-tight">
                {systemSettings.shortName}
              </span>
              <div className="flex items-center gap-3">
                <div className="w-8 h-0.5 bg-blue-500 rounded-full"></div>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em]">
                  {systemSettings.systemName}
                </span>
              </div>
            </h1>
          </div>

          {/* Quick Stats Summary */}
          <div className="grid grid-cols-3 gap-4 shrink-0">
             {[
               { label: 'Cuộc họp Tuần', val: stats.week, color: 'text-blue-400', icon: <Calendar size={14} /> },
               { label: 'Cuộc họp Tháng', val: stats.month, color: 'text-emerald-400', icon: <Clock size={14} /> },
               { label: 'Cuộc họp Năm', val: stats.year, color: 'text-amber-400', icon: <Activity size={14} /> }
             ].map((s, idx) => (
               <div key={idx} className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col">
                  <div className="flex items-center gap-2 mb-1 opacity-60">
                    <span className={s.color}>{s.icon}</span>
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">{s.label}</span>
                  </div>
                  <span className={`text-2xl font-black ${s.color}`}>{s.val}</span>
               </div>
             ))}
          </div>

          {/* Meeting List */}
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-400/20">
                  <UsersIcon size={16} />
                </div>
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Lịch họp sắp tới</h3>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {upcomingMeetings.length > 0 ? (
                upcomingMeetings.map((m) => {
                  const isCancelled = m.status === 'CANCELLED';
                  const isPostponed = m.status === 'POSTPONED';

                  return (
                    <div 
                      key={m.id}
                      onClick={() => setSelectedPublicMeeting(m)}
                      className={`group bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/5 hover:border-blue-500/30 p-4 rounded-[1.5rem] transition-all cursor-pointer flex items-center gap-4 ${
                        isCancelled ? 'opacity-60 grayscale-[0.5]' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center min-w-[70px] border-r border-white/10 pr-4">
                        <span className={`text-lg font-black ${isCancelled ? 'text-red-400' : isPostponed ? 'text-amber-400' : 'text-blue-400'}`}>
                          {formatTime(m.startTime)}
                        </span>
                        <span className="text-[9px] font-black text-white/30 uppercase mt-1">
                          {formatDate(m.startTime).split('/')[0] + '/' + formatDate(m.startTime).split('/')[1]}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`text-sm font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1 ${isCancelled ? 'line-through' : ''}`}>
                            {m.title}
                          </h4>
                          {isCancelled ? (
                            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[8px] font-black rounded uppercase border border-red-500/20">Huỷ</span>
                          ) : isPostponed ? (
                            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[8px] font-black rounded uppercase border border-amber-500/20">Hoãn</span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="text-[10px] text-white/40 font-bold uppercase truncate max-w-[120px]">Chủ trì: {m.chairPerson}</span>
                          <div className="w-1 h-1 rounded-full bg-white/10 shrink-0"></div>
                          <span className="text-[10px] text-blue-400/60 font-black uppercase truncate">{m.hostUnit}</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {m.invitationLink && (
                          <button 
                            onClick={(e) => handleExternalLink(e, m.invitationLink)}
                            className="p-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-lg shadow-indigo-900/10 z-20"
                            title="Xem giấy mời"
                          >
                            <FileText size={16} />
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSelectedPublicMeeting(m); }}
                          className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/30 group-hover:text-white group-hover:bg-blue-600 group-hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 z-20"
                        >
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-[2rem]">
                  <p className="text-xs font-bold text-white/20 uppercase tracking-widest">Hiện chưa có lịch họp nào được lên lịch</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Smaller & Compact Login Card */}
        <div className="w-full lg:w-[400px] flex flex-col justify-center shrink-0 animate-in fade-in zoom-in duration-1000 delay-500">
          <div className="bg-white/10 backdrop-blur-[30px] rounded-[2.5rem] p-8 lg:p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-white/20 w-full flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="mb-8 text-center">
              <div className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-400/20 rounded-full">
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.4em]">ĐĂNG NHẬP HỆ THỐNG</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-shake text-white">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-widest leading-tight">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-2">Tên tài khoản</label>
                <div className="relative group">
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-[1.25rem] focus:ring-8 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white/10 outline-none transition-all text-white font-bold placeholder:text-white/20 text-sm"
                    placeholder="Tên đăng nhập..."
                  />
                  <UserIcon className="w-5 h-5 absolute left-4 top-4 text-white/20 group-focus-within:text-blue-400 transition-colors" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-2">Mật khẩu</label>
                <div className="relative group">
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-[1.25rem] focus:ring-8 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white/10 outline-none transition-all text-white font-bold placeholder:text-white/20 text-sm"
                    placeholder="••••••••"
                  />
                  <Lock className="w-5 h-5 absolute left-4 top-4 text-white/20 group-focus-within:text-blue-400 transition-colors" />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 rounded-[1.25rem] font-black text-[11px] uppercase tracking-[0.3em] text-white shadow-2xl transition-all active:scale-[0.97] flex items-center justify-center gap-3 mt-4 ${
                  isLoading ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/30 active:bg-blue-800'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    Đang xác thực...
                  </>
                ) : (
                  <>
                    ĐĂNG NHẬP
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 pt-6 border-t border-white/5 text-center">
              <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.4em] leading-relaxed">
                <span className="opacity-40">© 2026 • VIETTEL SƠN LA</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Public Detail Modal */}
      {selectedPublicMeeting && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 flex items-center justify-center rounded-2xl shadow-lg ${
                  selectedPublicMeeting.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400' :
                  selectedPublicMeeting.status === 'POSTPONED' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight line-clamp-1">{selectedPublicMeeting.title}</h3>
                  <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mt-1">Thông tin cuộc họp công khai</p>
                </div>
              </div>
              <button onClick={() => setSelectedPublicMeeting(null)} className="p-2 hover:bg-white/5 rounded-full transition-all text-slate-500 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {selectedPublicMeeting.status === 'CANCELLED' && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Thông báo huỷ họp:</p>
                    <p className="text-xs text-white font-medium mt-1 leading-relaxed italic">{selectedPublicMeeting.cancelReason || 'Không có lý do chi tiết.'}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Thời gian</p>
                  <p className="text-sm font-black text-white">{formatTime(selectedPublicMeeting.startTime)} • {formatDate(selectedPublicMeeting.startTime)}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Cán bộ chủ trì</p>
                  <p className="text-sm font-black text-white">{selectedPublicMeeting.chairPerson}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 col-span-2">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Đơn vị tổ chức</p>
                  <p className="text-sm font-black text-blue-400 uppercase tracking-tight">{selectedPublicMeeting.hostUnit}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] border-l-2 border-blue-500 pl-3">Thành phần tham gia</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPublicMeeting.participants.map((p, i) => (
                    <span key={i} className="px-3 py-1 bg-white/5 text-white/70 text-[10px] font-bold rounded-lg border border-white/5 uppercase tracking-tight">{p}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] border-l-2 border-cyan-500 pl-3">Điểm cầu kết nối ({selectedPublicMeeting.endpoints.length})</h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedPublicMeeting.endpoints.map(ep => (
                    <div key={ep.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <span className="text-[11px] font-bold text-white/80 truncate uppercase tracking-tight">{ep.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-white/5 flex justify-end gap-3">
              {selectedPublicMeeting.invitationLink && (
                 <button 
                  onClick={(e) => handleExternalLink(e, selectedPublicMeeting.invitationLink)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/20 flex items-center gap-2"
                >
                  <FileText size={14} />
                  Giấy mời
                </button>
              )}
              <button 
                onClick={() => setSelectedPublicMeeting(null)}
                className="px-8 py-3 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes slow-zoom {
          0% { transform: scale(1.1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1.1); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 30s ease-in-out infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out infinite;
          animation-iteration-count: 2;
        }
      `}</style>
    </div>
  );
};

export default LoginView;
