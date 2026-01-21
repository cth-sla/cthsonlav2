
import React, { useState } from 'react';
import { User, SystemSettings } from '../types';

interface LoginViewProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
  systemSettings: SystemSettings;
}

const LoginView: React.FC<LoginViewProps> = ({ users, onLoginSuccess, systemSettings }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ràng buộc kiểm tra không để trống
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate network delay
    setTimeout(() => {
      const foundUser = users.find(u => u.username === username && u.password === password);
      
      if (foundUser) {
        onLoginSuccess(foundUser);
      } else {
        setError('Tài khoản hoặc mật khẩu không chính xác. Thử "admin/admin" hoặc "user/user".');
        setIsLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0E14] relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-indigo-600/5 rounded-full blur-[150px]"></div>

      <div className="w-full max-w-lg px-6 relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-10 group">
          <div className="relative inline-flex mb-8">
             <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
             <div className="relative p-6 bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl flex items-center justify-center w-24 h-24 overflow-hidden">
                {systemSettings.logoBase64 ? (
                  <img src={systemSettings.logoBase64} alt="System Logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <svg className="w-16 h-16 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 22V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20 7L12 12L4 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1"/>
                    <path d="M12 15L12 15.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                )}
             </div>
          </div>
          <h1 className="flex flex-col items-center">
            <span className="text-3xl font-black text-white uppercase tracking-tight">{systemSettings.shortName}</span>
            <span className="text-sm font-black text-blue-500 uppercase tracking-[0.4em] mt-3">{systemSettings.systemName}</span>
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent mx-auto mt-6"></div>
        </div>

        {/* Login Card */}
        <div className="bg-[#161B22]/80 backdrop-blur-2xl rounded-[2.5rem] p-10 shadow-2xl border border-white/5 transform transition-all duration-300 mx-auto max-w-md">
          <h2 className="text-xl font-bold text-slate-200 mb-8 text-center">Xác thực quyền truy cập</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-shake">
                <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-tight">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
              <div className="relative group">
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-900 outline-none transition-all text-slate-200 font-semibold placeholder:text-slate-700"
                  placeholder="admin"
                  autoFocus
                />
                <svg className="w-5 h-5 absolute left-4 top-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
                  className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-slate-900 outline-none transition-all text-slate-200 font-semibold placeholder:text-slate-700"
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
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${
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
                  Đăng nhập
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.3em] leading-relaxed">
            HỆ THỐNG GIÁM SÁT HỘI NGHỊ TRỰC TUYẾN TỈNH SƠN LA<br/>
            &copy; 2024 VERSION 3.1.0 • SECURE ACCESS
          </p>
        </div>
      </div>
      
      <style>{`
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
