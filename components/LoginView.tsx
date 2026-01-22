
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

  const upcomingMeetings = useMemo(() => {
    const now = new Date();
    // Lấy các cuộc họp đang diễn ra hoặc sắp tới
    return meetings
      .filter(m => new Date(m.endTime) >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 20); // Hiển thị tối đa 20 mục
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0E14] relative overflow-hidden font-sans">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-7xl px-6 relative z-10 flex flex-col lg:flex-row items-start gap-12 py-12 lg:py-24">
        
        {/* Left Section: Branding & Public Schedule */}
        <div className="flex-1 w-full flex flex-col space-y-12">
          <div className="group shrink-0">
            <div className="relative inline-flex mb-6">
               <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
               <div className="relative p-5 bg-slate-900 border border-slate-800 rounded-[1.5rem] shadow-2xl flex items-center justify-center w-24 h-24 overflow-hidden">
                  {systemSettings.logoBase64 ? (
                    <img src={systemSettings.logoBase64} alt="System Logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <svg className="w-14 h-14 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 22V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20 7L12 12L4 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
               </div>
            </div>
            <h1 className="flex flex-col items-start text-left">
              <span className="text-4xl lg:text-6xl font-black text-white uppercase tracking-tight leading-none">{systemSettings.shortName}</span>
              <span className="text-xs font-black text-blue-500 uppercase tracking-[0.5em] mt-4">{systemSettings.systemName}</span>
            </h1>
          </div>

          <div className="flex-1 flex flex-col min-h-0 space-y-5">
            <div className="flex items-center justify-between shrink-0 px-2">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 border border-blue-600/30 shadow-lg shadow-blue-500/10">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-lg font-black text-slate-100 uppercase tracking-widest">Lịch họp trực tuyến hôm nay</h3>
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                {upcomingMeetings.length} CUỘC HỌP
              </div>
            </div>

            {/* Scrollable Schedule List with fixed maximum height */}
            <div className="flex-1 overflow-y-auto pr-4 space-y-4 custom-scrollbar max-h-[500px] lg:max-h-[550px]">
              {upcomingMeetings.length > 0 ? (
                upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] hover:bg-white/10 transition-all flex items-center gap-6 group border-l-4 border-l-transparent hover:border-l-blue-500 shadow-xl">
                    <div className="flex flex-col items-center justify-center min-w-[80px] border-r border-white/10 pr-6">
                      <span className="text-2xl font-black text-blue-400 group-hover:scale-110 transition-transform">
                        {new Date(meeting.startTime).getHours()}:{new Date(meeting.startTime).getMinutes().toString().padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mt-1">BẮT ĐẦU</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-slate-100 uppercase line-clamp-2 group-hover:text-white transition-colors leading-relaxed tracking-tight">{meeting.title}</h4>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="text-[11px] font-bold text-blue-500/80 uppercase tracking-widest truncate max-w-[200px]">{meeting.hostUnit}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                        <span className="text-[11px] font-bold text-slate-500 uppercase">{meeting.endpoints.length} ĐIỂM CẦU</span>
                      </div>
                    </div>
                    <div className="hidden sm:block shrink-0 px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-full">
                       <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">SẴN SÀNG</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-16 border border-white/5 bg-white/2 rounded-[3rem] text-center">
                  <p className="text-slate-500 font-bold text-sm uppercase tracking-widest italic opacity-50">Hiện không có lịch họp nào sắp diễn ra</p>
                </div>
              )}
            </div>
            
            <p className="text-[11px] text-slate-600 font-medium italic pl-2">Ghi chú: Lịch họp được cập nhật theo thời gian thực từ cơ quan chủ quản.</p>
          </div>
        </div>

        {/* Right Section: Login Card - FIXED WIDTH & NON-SHRINKABLE */}
        <div className="w-full lg:w-[460px] flex-shrink-0 sticky top-12">
          <div className="bg-[#161B22]/98 backdrop-blur-3xl rounded-[3.5rem] p-10 lg:p-14 shadow-2xl border border-white/5 w-full ring-1 ring-white/10 flex flex-col">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tighter mb-2">Đăng nhập</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Hệ thống giám sát v3.1</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-7">
              {error && (
                <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 animate-shake">
                  <svg className="w-6 h-6 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-[11px] font-black text-red-400 uppercase tracking-widest leading-tight">{error}</p>
                </div>
              )}

              <div className="space-y-2.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Tài khoản quản trị</label>
                <div className="relative group">
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-14 pr-6 py-4.5 bg-slate-900/50 border border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-900 outline-none transition-all text-slate-200 font-bold placeholder:text-slate-700"
                    placeholder="Nhập tên đăng nhập"
                  />
                  <svg className="w-6 h-6 absolute left-5 top-4.5 text-slate-600 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Mật khẩu bảo mật</label>
                <div className="relative group">
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-14 pr-6 py-4.5 bg-slate-900/50 border border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-900 outline-none transition-all text-slate-200 font-bold placeholder:text-slate-700"
                    placeholder="••••••••"
                  />
                  <svg className="w-6 h-6 absolute left-5 top-4.5 text-slate-600 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.25em] text-white shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-4 mt-6 ${
                  isLoading ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/30 active:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    XÁC THỰC...
                  </>
                ) : (
                  <>
                    XÁC NHẬN TRUY CẬP
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </button>
            </form>

            <div className="mt-16 pt-10 border-t border-white/5 text-center">
              <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] leading-relaxed">
                ỦY BAN NHÂN DÂN TỈNH SƠN LA<br/>
                &copy; 2026 • SECURE GATEWAY
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.15);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.3);
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
