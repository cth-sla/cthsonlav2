
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
    // Lấy các cuộc họp đang diễn ra hoặc sắp tới trong vòng 48h
    return meetings
      .filter(m => new Date(m.endTime) >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 10); // Hiển thị tối đa 10 cuộc họp gần nhất
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
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-7xl px-6 relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-16 py-8">
        
        {/* Left Section: Branding & Schedule */}
        <div className="flex-1 w-full flex flex-col space-y-8 lg:max-h-[85vh]">
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
              <span className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tight leading-none">{systemSettings.shortName}</span>
              <span className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] mt-3">{systemSettings.systemName}</span>
            </h1>
          </div>

          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 border border-blue-600/30">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-base font-black text-slate-200 uppercase tracking-widest">Lịch họp hôm nay</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sắp xếp theo thời gian</span>
            </div>

            {/* Scrollable Meeting List */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar max-h-[400px] lg:max-h-none">
              {upcomingMeetings.length > 0 ? (
                upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-all flex items-center gap-4 group">
                    <div className="flex flex-col items-center justify-center min-w-[64px] border-r border-white/10 pr-4">
                      <span className="text-lg font-black text-blue-400 leading-none">
                        {new Date(meeting.startTime).getHours()}:{new Date(meeting.startTime).getMinutes().toString().padStart(2, '0')}
                      </span>
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter mt-1">Bắt đầu</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-100 uppercase line-clamp-1 group-hover:text-white transition-colors">{meeting.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold text-blue-500/80 uppercase tracking-widest truncate max-w-[150px]">{meeting.hostUnit}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-700 shrink-0"></span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase shrink-0">{meeting.endpoints.length} điểm cầu</span>
                      </div>
                    </div>
                    <div className="hidden sm:block px-2.5 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full shrink-0">
                       <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Live</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 border border-white/5 bg-white/2 rounded-2xl text-center">
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest italic opacity-60">Không có lịch họp nào sắp tới</p>
                </div>
              )}
            </div>
            
            <p className="text-[9px] text-slate-500 font-medium italic pl-1 shrink-0">Cập nhật tự động: {new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</p>
          </div>
        </div>

        {/* Right Section: Login Card - Fixed width to prevent shrinking */}
        <div className="w-full lg:w-[420px] shrink-0">
          <div className="bg-[#161B22]/90 backdrop-blur-3xl rounded-[2.5rem] p-8 lg:p-10 shadow-2xl border border-white/5 w-full transform transition-all duration-300 ring-1 ring-white/10">
            <h2 className="text-xl font-black text-slate-200 mb-8 text-center uppercase tracking-tighter">Xác thực hệ thống</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-shake">
                  <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-tight">{error}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Tên đăng nhập</label>
                <div className="relative group">
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-800 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-900 outline-none transition-all text-slate-200 font-semibold placeholder:text-slate-700 text-sm"
                    placeholder="Nhập tài khoản"
                  />
                  <svg className="w-4 h-4 absolute left-4 top-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Mật khẩu</label>
                <div className="relative group">
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-800 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-900 outline-none transition-all text-slate-200 font-semibold placeholder:text-slate-700 text-sm"
                    placeholder="••••••••"
                  />
                  <svg className="w-4 h-4 absolute left-4 top-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] text-white shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4 ${
                  isLoading ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/20 active:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ĐANG XỬ LÝ...
                  </>
                ) : (
                  <>
                    Đăng nhập hệ thống
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-slate-600 text-[8px] font-black uppercase tracking-[0.3em] leading-relaxed">
                ỦY BAN NHÂN DÂN TỈNH SƠN LA<br/>
                &copy; 2026 • SECURE VERSION 3.1.0
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
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
