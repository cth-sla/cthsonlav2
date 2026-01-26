
import React, { useState, useMemo } from 'react';
import { User, SystemSettings, Meeting } from '../types';

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
    // Lấy các cuộc họp sắp tới hoặc đang diễn ra
    return meetings
      .filter(m => new Date(m.endTime) >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 30);
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
        setError('Tài khoản hoặc mật khẩu không chính xác. Thử "admin/admin".');
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0E14] relative overflow-hidden font-sans">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-7xl px-6 relative z-10 flex flex-col lg:flex-row items-start gap-12 py-10 lg:py-16">
        
        {/* Left Section: Branding & Public Schedule */}
        <div className="flex-1 w-full flex flex-col space-y-10 lg:max-h-[85vh]">
          <div className="group shrink-0">
            <div className="relative inline-flex mb-6">
               <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
               <div className="relative p-5 bg-slate-900 border border-slate-800 rounded-[1.5rem] shadow-2xl flex items-center justify-center w-20 h-20 overflow-hidden">
                  {systemSettings.logoBase64 ? (
                    <img src={systemSettings.logoBase64} alt="System Logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <svg className="w-12 h-12 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 22V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20 7L12 12L4 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
               </div>
            </div>
            <h1 className="flex flex-col items-start text-left">
              <span className="text-2xl lg:text-3xl font-black text-white uppercase tracking-tight leading-none">{systemSettings.shortName}</span>
              <span className="text-xs font-black text-blue-500 uppercase tracking-[0.4em] mt-3">{systemSettings.systemName}</span>
            </h1>
          </div>

          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            <div className="flex items-center justify-between shrink-0 px-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 border border-blue-600/30">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest">Lịch họp sắp tới</h3>
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800/40 px-3 py-1 rounded-full border border-slate-700/50">
                {upcomingMeetings.length} CUỘC HỌP
              </div>
            </div>

            {/* Scrollable Schedule List */}
            <div className="flex-1 overflow-y-auto pr-4 space-y-3 custom-scrollbar max-h-[400px] lg:max-h-none">
              {upcomingMeetings.length > 0 ? (
                upcomingMeetings.map((meeting) => (
                  <div 
                    key={meeting.id} 
                    onClick={() => setSelectedPublicMeeting(meeting)}
                    className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-[1.5rem] hover:bg-white/10 transition-all flex items-center gap-5 group border-l-4 border-l-transparent hover:border-l-blue-500 cursor-pointer"
                  >
                    <div className="flex flex-col items-center justify-center min-w-[85px] border-r border-white/10 pr-5">
                      <span className="text-lg font-black text-blue-400">
                        {formatTime(meeting.startTime)}
                      </span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight mt-1">{formatDate(meeting.startTime)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-100 line-clamp-2 group-hover:text-white transition-colors leading-relaxed tracking-tight">{meeting.title}</h4>
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-blue-500/70 uppercase tracking-widest">Chủ trì:</span>
                          <span className="text-[10px] font-black text-slate-300 uppercase truncate max-w-[120px]">{meeting.chairPerson}</span>
                        </div>
                        <span className="w-1 h-1 rounded-full bg-slate-700 hidden sm:block"></span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{meeting.hostUnit}</span>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                       <button className="px-4 py-2 bg-blue-600/10 border border-blue-500/30 rounded-xl text-[10px] font-black text-blue-400 uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
                         CHI TIẾT
                       </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 border border-white/5 bg-white/2 rounded-[2rem] text-center">
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest italic opacity-50">Hiện không có lịch họp nào sắp diễn ra</p>
                </div>
              )}
            </div>
            
            <p className="text-[10px] text-slate-600 font-medium italic pl-1 shrink-0">Ghi chú: Nhấn vào cuộc họp để xem thành phần tham gia và danh sách các điểm cầu.</p>
          </div>
        </div>

        {/* Right Section: Login Card */}
        <div className="w-full lg:w-[440px] flex-shrink-0 lg:sticky lg:top-12 self-start">
          <div className="bg-[#161B22]/98 backdrop-blur-3xl rounded-[3rem] p-10 lg:p-12 shadow-2xl border border-white/5 w-full ring-1 ring-white/10 flex flex-col">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tighter mb-2">Đăng nhập</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Cổng xác thực hệ thống v3.1</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-shake">
                  <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-tight">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tài khoản</label>
                <div className="relative group">
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-900 outline-none transition-all text-slate-200 font-bold placeholder:text-slate-700"
                    placeholder="Tên đăng nhập"
                  />
                  <svg className="w-5 h-5 absolute left-4 top-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mật khẩu</label>
                <div className="relative group">
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-900 outline-none transition-all text-slate-200 font-bold placeholder:text-slate-700"
                    placeholder="••••••••"
                  />
                  <svg className="w-5 h-5 absolute left-4 top-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className={`w-full py-4.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-white shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4 ${
                  isLoading ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/30 active:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ĐANG XÁC THỰC...
                  </>
                ) : (
                  <>
                    ĐĂNG NHẬP
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-white/5 text-center">
              <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] leading-relaxed">
                ỦY BAN NHÂN DÂN TỈNH SƠN LA<br/>
                &copy; 2026 • VIETTEL SƠN LA
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Public Meeting Detail Modal */}
      {selectedPublicMeeting && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-[#161B22] border border-white/10 w-full max-w-2xl rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight line-clamp-1">{selectedPublicMeeting.title}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Thông tin chi tiết cuộc họp</p>
                </div>
              </div>
              <button onClick={() => setSelectedPublicMeeting(null)} className="p-2 hover:bg-white/5 rounded-full transition-all text-slate-500 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {/* General Quick Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/2 border border-white/5 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Thời gian</p>
                  <p className="text-sm font-black text-blue-400 uppercase">{formatTime(selectedPublicMeeting.startTime)} - {formatDate(selectedPublicMeeting.startTime)}</p>
                </div>
                <div className="bg-white/2 border border-white/5 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Cán bộ chủ trì</p>
                  <p className="text-sm font-black text-white">{selectedPublicMeeting.chairPerson}</p>
                </div>
              </div>

              {/* Participants Section */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] border-l-2 border-blue-600 pl-3">Thành phần tham gia</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPublicMeeting.participants.map((p, i) => (
                    <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/10 text-slate-300 text-[10px] font-bold rounded-lg tracking-tight">
                      {p}
                    </span>
                  ))}
                  {selectedPublicMeeting.participants.length === 0 && (
                    <p className="text-xs text-slate-500 italic">Chưa xác định thành phần cụ thể</p>
                  )}
                </div>
              </div>

              {/* Endpoints Section */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em] border-l-2 border-cyan-600 pl-3">Danh sách điểm cầu ({selectedPublicMeeting.endpoints.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedPublicMeeting.endpoints.map(ep => (
                    <div key={ep.id} className="p-4 bg-white/2 border border-white/5 rounded-2xl flex items-center gap-4 group hover:bg-white/5 transition-all">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${ep.status === 'CONNECTED' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`}></div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-200 truncate">{ep.name}</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase truncate tracking-widest">{ep.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Public Description */}
              {selectedPublicMeeting.description && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] border-l-2 border-amber-600 pl-3">Nội dung tóm tắt</h4>
                  <div className="bg-white/2 border border-white/5 p-5 rounded-2xl">
                    <p className="text-xs text-slate-400 leading-relaxed font-medium italic">
                      {selectedPublicMeeting.description}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-white/5 bg-white/2 flex justify-end">
              <button 
                onClick={() => setSelectedPublicMeeting(null)}
                className="px-8 py-3 bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all active:scale-95"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.4);
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
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
