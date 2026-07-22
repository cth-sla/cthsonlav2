
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, SystemSettings, Meeting } from '../types';
import { ExternalLink, FileText, Lock, User as UserIcon, ArrowRight, Calendar, Clock, MapPin, Users as UsersIcon, CheckCircle2, AlertTriangle, XCircle, Activity, Video, Sun, Moon, MailOpen, LayoutDashboard, Phone, QrCode, EyeOff, Eye, Smile } from 'lucide-react';

const FIXED_SUPPORT_PHONE = '0328.007.999';
const FIXED_SUPPORT_QR = 'data:image/png;base64,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';

interface LoginViewProps {
  users: User[];
  meetings: Meeting[];
  onLoginSuccess: (user: User) => void;
  systemSettings: SystemSettings;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isAdminLoggedIn?: boolean;
  onBackToAdmin?: () => void;
}

// Cute Modern AI Robot Component with Floating, Wandering, Waving, Blinking & Smiling
const CuteAIRobot = ({ isParentHovered }: { isParentHovered?: boolean }) => {
  const [internalHover, setInternalHover] = useState(false);
  const isHovered = isParentHovered || internalHover;

  return (
    <div 
      className="relative w-48 h-48 flex flex-col items-center justify-center select-none"
      onMouseEnter={() => setInternalHover(true)}
      onMouseLeave={() => setInternalHover(false)}
    >
      {/* Floor Shadow that shrinks/grows as robot floats */}
      <motion.div 
        className="absolute bottom-1 w-24 h-3 bg-slate-900/20 dark:bg-black/50 rounded-full blur-[3px]"
        animate={{
          scaleX: [1, 0.7, 0.95, 0.75, 1],
          opacity: [0.35, 0.15, 0.3, 0.18, 0.35]
        }}
        transition={{
          duration: 5.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Floating & Wandering Main Robot Container */}
      <motion.div
        className="relative flex flex-col items-center"
        animate={{
          y: [0, -12, -4, -10, 0],
          x: [0, 8, -8, 5, 0],
          rotate: [0, 2.5, -2, 1.5, 0]
        }}
        transition={{
          duration: 5.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Head Shell with Ears & Visor */}
        <div className="relative flex items-center justify-center">
          {/* Left Ear Ring */}
          <div className="absolute -left-3.5 w-4 h-7 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full border-2 border-white shadow-md flex items-center justify-center z-0">
            <div className="w-1.5 h-3 bg-cyan-300 rounded-full animate-pulse" />
          </div>

          {/* Right Ear Ring */}
          <div className="absolute -right-3.5 w-4 h-7 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full border-2 border-white shadow-md flex items-center justify-center z-0">
            <div className="w-1.5 h-3 bg-cyan-300 rounded-full animate-pulse" />
          </div>

          {/* Helmet Head Shell */}
          <div className="relative w-32 h-24 bg-gradient-to-b from-white via-slate-100 to-slate-200 rounded-[2.2rem] border-[3px] border-white shadow-[0_12px_28px_-6px_rgba(0,0,0,0.2)] flex items-center justify-center p-2 z-10 overflow-hidden">
            {/* Top Gloss Reflection */}
            <div className="absolute top-1 left-3 right-3 h-3 bg-white/80 rounded-full blur-[1px]" />

            {/* Dark Visor Screen */}
            <div className="relative w-full h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-[1.6rem] border-2 border-blue-400/40 shadow-inner flex flex-col items-center justify-center overflow-hidden p-2">
              {/* Subtle Screen Glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent pointer-events-none" />

              {/* Digital LED Face */}
              <div className="flex flex-col items-center gap-1 z-10 w-full">
                {/* Eyes Row */}
                <div className="flex items-center justify-between w-16 px-1">
                  {/* Left Eye */}
                  <motion.div
                    className="relative flex items-center justify-center"
                    animate={isHovered ? { scaleY: 1 } : { scaleY: [1, 1, 0.1, 1, 1] }}
                    transition={isHovered ? {} : { duration: 3.5, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1] }}
                  >
                    {isHovered ? (
                      /* Cheerful Arch Eye ^ */
                      <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                        <path d="M2 12C2 12 6 2 10 2C14 2 18 12 18 12" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="round" />
                      </svg>
                    ) : (
                      /* Digital Pixel Eye */
                      <div className="w-5 h-5 bg-cyan-400 rounded-full shadow-[0_0_12px_#22d3ee] flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full translate-x-[-1px] translate-y-[-1px]" />
                      </div>
                    )}
                  </motion.div>

                  {/* Right Eye */}
                  <motion.div
                    className="relative flex items-center justify-center"
                    animate={isHovered ? { scaleY: 1 } : { scaleY: [1, 1, 0.1, 1, 1] }}
                    transition={isHovered ? {} : { duration: 3.5, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1] }}
                  >
                    {isHovered ? (
                      /* Cheerful Arch Eye ^ */
                      <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                        <path d="M2 12C2 12 6 2 10 2C14 2 18 12 18 12" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="round" />
                      </svg>
                    ) : (
                      /* Digital Pixel Eye */
                      <div className="w-5 h-5 bg-cyan-400 rounded-full shadow-[0_0_12px_#22d3ee] flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full translate-x-[-1px] translate-y-[-1px]" />
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Glowing Smile Arc */}
                <motion.div
                  animate={{ scale: isHovered ? 1.2 : 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center mt-0.5"
                >
                  <svg width="24" height="11" viewBox="0 0 24 11" fill="none">
                    <path
                      d={isHovered ? "M3 2C3 2 7 9 12 9C17 9 21 2 21 2" : "M5 3C5 3 8 8 12 8C16 8 19 3 19 3"}
                      stroke="#22d3ee"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </motion.div>

                {/* Cute Blushing Cheeks */}
                <div className="flex justify-between w-20 px-1 -mt-1">
                  <div className="w-3 h-1.5 bg-pink-400/60 rounded-full blur-[1px]" />
                  <div className="w-3 h-1.5 bg-pink-400/60 rounded-full blur-[1px]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Neck */}
        <div className="w-7 h-2.5 bg-slate-700 rounded-sm shadow-inner -mt-0.5 z-0 flex items-center justify-center">
          <div className="w-5 h-1 bg-blue-500 rounded-full" />
        </div>

        {/* Torso & Arms Container */}
        <div className="relative flex items-center justify-center z-10 -mt-0.5">
          {/* Left Arm (Resting at side) */}
          <motion.div
            className="absolute -left-6 top-1 z-0 pointer-events-none"
            style={{ transformOrigin: "24px 10px" }}
            animate={{ rotate: isHovered ? [-10, -2, -10] : [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="32" height="56" viewBox="0 0 32 56" fill="none" className="drop-shadow-sm">
              {/* Shoulder Joint */}
              <circle cx="24" cy="10" r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
              {/* Arm Capsule */}
              <rect x="19.5" y="12" width="9" height="22" rx="4.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
              <rect x="20.5" y="21" width="7" height="3" rx="1.5" fill="#3b82f6" />
              {/* Wrist Joint */}
              <circle cx="24" cy="37" r="4" fill="#1e293b" stroke="#3b82f6" strokeWidth="1" />
              {/* Hand / Palm */}
              <rect x="19" y="39" width="10" height="8" rx="2.5" fill="#1e293b" stroke="#3b82f6" strokeWidth="1" />
              {/* Fingers */}
              <rect x="28" y="40" width="3" height="2.2" rx="1" fill="#1e293b" stroke="#3b82f6" strokeWidth="0.8" />
              <rect x="26.5" y="47" width="2" height="5" rx="1" fill="#1e293b" stroke="#3b82f6" strokeWidth="0.8" />
              <rect x="24" y="47" width="2" height="6.5" rx="1" fill="#1e293b" stroke="#3b82f6" strokeWidth="0.8" />
              <rect x="21.5" y="47" width="2" height="5" rx="1" fill="#1e293b" stroke="#3b82f6" strokeWidth="0.8" />
              <rect x="19.2" y="47" width="1.8" height="4" rx="0.9" fill="#1e293b" stroke="#3b82f6" strokeWidth="0.8" />
            </svg>
          </motion.div>

          {/* Body Torso */}
          <div className="relative w-22 h-18 bg-gradient-to-b from-white via-slate-100 to-slate-200 rounded-b-[1.6rem] rounded-t-lg border-2 border-white shadow-lg flex flex-col items-center justify-between p-1.5 overflow-hidden">
            {/* Top Blue Accent */}
            <div className="w-full h-1.5 bg-blue-500 rounded-full opacity-90" />

            {/* Chest Logo: "AI" with glowing cyan indicator */}
            <div className="flex flex-col items-center justify-center my-auto">
              <span className="text-[12px] font-black text-blue-600 tracking-wider font-mono leading-none">
                AI
              </span>
              <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee] animate-pulse mt-0.5" />
            </div>

            {/* Bottom Thruster / Waist */}
            <div className="w-14 h-2.5 bg-blue-600 rounded-full flex items-center justify-center shadow-inner">
              <div className="w-7 h-1 bg-cyan-300 rounded-full shadow-[0_0_8px_#67e8f9]" />
            </div>
          </div>

          {/* Right Arm (Waving Hand beside Head when Hovered, Resting down at side when normal) */}
          <motion.div
            className="absolute -right-6 top-1 z-30 pointer-events-none"
            style={{ transformOrigin: "8px 10px" }}
            animate={
              isHovered
                ? {
                    rotate: [-130, -155, -130],
                    scale: 1.05
                  }
                : {
                    rotate: [0, 4, 0],
                    scale: 1
                  }
            }
            transition={
              isHovered
                ? { duration: 0.7, repeat: Infinity, ease: "easeInOut" }
                : { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <svg width="32" height="56" viewBox="0 0 32 56" fill="none" className="drop-shadow-md">
              {/* Shoulder Joint */}
              <circle cx="8" cy="10" r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />

              {/* Arm Capsule */}
              <rect x="3.5" y="12" width="9" height="22" rx="4.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
              <rect x="4.5" y="21" width="7" height="3" rx="1.5" fill="#3b82f6" />

              {/* Wrist Joint */}
              <circle cx="8" cy="37" r="4" fill="#1e293b" stroke="#3b82f6" strokeWidth="1" />

              {/* Palm / Hand */}
              <rect x="3" y="39" width="10" height="8" rx="2.5" fill="#1e293b" stroke="#3b82f6" strokeWidth="1" />

              {/* 4 Extended Waving Fingers + Thumb */}
              <rect x="1" y="40" width="3" height="2.2" rx="1" fill="#1e293b" stroke="#3b82f6" strokeWidth="0.8" />
              <rect x="3.5" y="47" width="2" height="5" rx="1" fill="#1e293b" stroke="#3b82f6" strokeWidth="0.8" />
              <rect x="6" y="47" width="2" height="6.5" rx="1" fill="#1e293b" stroke="#3b82f6" strokeWidth="0.8" />
              <rect x="8.5" y="47" width="2" height="5" rx="1" fill="#1e293b" stroke="#3b82f6" strokeWidth="0.8" />
              <rect x="11" y="47" width="1.8" height="4" rx="0.9" fill="#1e293b" stroke="#3b82f6" strokeWidth="0.8" />
            </svg>
          </motion.div>
        </div>

        {/* Floating Light Thruster Jet Glow */}
        <motion.div
          className="w-10 h-3 bg-cyan-400/50 rounded-full blur-[3px] -mt-0.5"
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      </motion.div>
    </div>
  );
};

const LoginView: React.FC<LoginViewProps> = ({ 
  users, 
  meetings, 
  onLoginSuccess, 
  systemSettings, 
  isDarkMode, 
  onToggleDarkMode,
  isAdminLoggedIn = false,
  onBackToAdmin
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPublicMeeting, setSelectedPublicMeeting] = useState<Meeting | null>(null);
  const [now, setNow] = useState(new Date());
  const [isLoginHidden, setIsLoginHidden] = useState(true);

  // Đồng hồ thời gian thực
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const upcomingMeetings = useMemo(() => {
    const today = new Date();
    return meetings
      .filter(m => new Date(m.endTime) >= today)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 12);
  }, [meetings]);

  const stats = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  const formatMeetingDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatMeetingTime = (dateStr: string) => {
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
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans bg-[#F5F5F5] dark:bg-slate-950 transition-colors duration-500">
      {/* Dark Mode & Back To Admin Toggle for Login Page */}
      <div className="absolute top-6 right-6 z-[100] flex items-center gap-3">
        {isAdminLoggedIn && onBackToAdmin && (
          <button 
            type="button"
            onClick={onBackToAdmin}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all select-none shadow-[0_4px_12px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] active:scale-95 border border-blue-500"
            title="Quay lại Bảng điều khiển Quản trị"
          >
            <LayoutDashboard size={14} />
            <span className="hidden sm:inline">Trang Quản trị</span>
          </button>
        )}
        <button 
          onClick={onToggleDarkMode}
          className="p-3 bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-white/20 dark:hover:bg-white/10 transition-all shadow-xl"
          title={isDarkMode ? "Chế độ sáng" : "Chế độ tối"}
        >
          {isDarkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-slate-600" />}
        </button>
      </div>

      {/* Background Image - Modern & Smooth */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-[30000ms] scale-110 animate-slow-zoom"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2601")' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#F5F5F5]/90 via-[#F5F5F5]/60 to-[#F5F5F5]/90 dark:from-slate-950/95 dark:via-slate-900/80 dark:to-slate-950/90 transition-colors duration-500"></div>
      </div>

      <div className="w-full max-w-7xl px-6 relative z-10 flex flex-col lg:flex-row items-stretch gap-10 py-8 lg:py-12 min-h-[90vh]">
        
        {/* Left Section: Branding, Stats & Meeting List */}
        <div className="flex-1 w-full flex flex-col space-y-6 animate-in fade-in slide-in-from-left duration-1000">
          <div className="shrink-0">
            <div className="relative inline-flex mb-4">
               <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-2xl"></div>
               <div className="w-10 h-10 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                <img 
                  src="https://i.postimg.cc/NFKqCphP/logo-CTHSLA.png" 
                  alt="Logo" 
                  className="w-[35px] h-[35px] object-contain" 
                  referrerPolicy="no-referrer"
                />
             </div>
            </div>
            <h1 className="flex flex-col items-start text-left space-y-1">
              <span className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight drop-shadow-sm">
                {systemSettings.shortName}
              </span>
              <div className="flex items-center gap-3">
                <div className="w-12 h-1 bg-blue-600 rounded-full"></div>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.4em]">
                  {systemSettings.systemName}
                </span>
              </div>
            </h1>
          </div>

          {/* Quick Stats Summary */}
          <div className="grid grid-cols-3 gap-4 shrink-0">
             {[
               { label: 'Cuộc họp Tuần', val: stats.week, color: 'text-blue-600 dark:text-blue-400', iconColor: 'text-blue-500', icon: <Calendar size={18} /> },
               { label: 'Cuộc họp Tháng', val: stats.month, color: 'text-emerald-500 dark:text-emerald-400', iconColor: 'text-emerald-500', icon: <Clock size={18} /> },
               { label: 'Cuộc họp Năm', val: stats.year, color: 'text-amber-500 dark:text-amber-400', iconColor: 'text-amber-500', icon: <Activity size={18} /> }
             ].map((s, idx) => (
               <div key={idx} className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 p-5 rounded-[1.5rem] flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-all hover:translate-y-[-2px] hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)]">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className={s.iconColor}>{s.icon}</span>
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">{s.label}</span>
                  </div>
                  <span className={`text-4xl font-black ${s.color}`}>{s.val}</span>
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
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Lịch họp sắp tới</h3>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {upcomingMeetings.length > 0 ? (
                upcomingMeetings.map((m) => {
                  const isCancelled = m.status === 'CANCELLED';
                  const isPostponed = m.status === 'POSTPONED';
                  const isChangedFormat = m.status === 'CHANGED_FORMAT';
 
                  return (
                    <div 
                      key={m.id}
                      onClick={() => setSelectedPublicMeeting(m)}
                      className={`group bg-white dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-white/10 backdrop-blur-md border border-gray-100 dark:border-white/5 hover:border-blue-500/30 p-4 rounded-[1.5rem] transition-all cursor-pointer flex items-center gap-4 shadow-sm dark:shadow-none ${
                        isCancelled ? 'opacity-60 grayscale-[0.5]' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center min-w-[105px] border-r border-gray-100 dark:border-white/10 pr-4 shrink-0">
                        <span className={`text-[14px] font-black tracking-tight ${
                          isCancelled ? 'text-red-400' : 
                          isPostponed ? 'text-amber-400' : 
                          isChangedFormat ? 'text-purple-400 dark:text-purple-300' : 
                          'text-blue-600 dark:text-blue-400'
                        }`}>
                          {formatMeetingTime(m.startTime)} - {formatMeetingTime(m.endTime)}
                        </span>
                        <span className={`text-[10.5px] font-black uppercase mt-1.5 text-center leading-tight tracking-wider transition-colors ${
                          isCancelled ? 'text-red-500 dark:text-red-400' :
                          isPostponed ? 'text-amber-600 dark:text-amber-400' :
                          isChangedFormat ? 'text-purple-600 dark:text-purple-400' :
                          'text-slate-500 dark:text-white/40'
                        }`}>
                          {formatMeetingDate(m.startTime)}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className={`text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors line-clamp-1 ${isCancelled ? 'line-through' : ''}`}>
                            {m.title}
                          </h4>
                          {isCancelled ? (
                            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[8px] font-black rounded uppercase border border-red-500/20 shrink-0">Huỷ</span>
                          ) : isPostponed ? (
                            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[8px] font-black rounded uppercase border border-amber-500/20 shrink-0">Hoãn</span>
                          ) : isChangedFormat ? (
                            <span className="px-1.5 py-0.5 bg-purple-500/25 text-purple-600 dark:text-purple-400 text-[8px] font-black rounded uppercase border border-purple-500/35 shrink-0">Chuyển HT</span>
                          ) : null}
                          {isCancelled || isPostponed ? (
                            <span className={`inline-flex items-center px-2 py-0.5 text-[9.5px] font-bold rounded-md border shrink-0 select-none max-w-[240px] truncate ${
                              isCancelled 
                                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' 
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            }`} title={m.cancelReason || 'Chưa cập nhật lý do'}>
                              Lý do: {m.cancelReason || 'Chưa cập nhật lý do'}
                            </span>
                          ) : (m.meetingFormat === 'TRUC_TUYEN' || (!m.meetingFormat && m.meetingRoomId)) ? (
                            <>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-black rounded-md uppercase border border-emerald-500/20 shrink-0 select-none">
                                <Video size={11} className="shrink-0" />
                                Trực tuyến
                              </span>
                              {m.meetingRoomId && !isChangedFormat && (
                                <span className="inline-flex items-center px-2.5 py-0.5 bg-blue-600 dark:bg-indigo-500/30 text-white dark:text-cyan-300 text-xs font-black font-mono rounded-md border border-blue-600 dark:border-indigo-500/50 shrink-0 select-none tracking-wider shadow-[0_2px_8px_rgba(37,99,235,0.2)]">
                                  ID: {m.meetingRoomId}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[8px] font-black rounded uppercase border border-amber-500/20 shrink-0 select-none">
                              <MapPin size={10} className="shrink-0" />
                              Trực tiếp
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 overflow-hidden flex-wrap">
                          <span className="text-[10px] text-slate-500 dark:text-white/40 font-bold uppercase whitespace-nowrap">Chủ trì: {m.chairPerson}</span>
                          <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-white/10 shrink-0 hidden sm:block"></div>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400/60 font-black uppercase truncate">{m.hostUnit}</span>
                        </div>
                      </div>
 
                      <div className="shrink-0 flex items-center gap-2">
                        {m.invitationLink && (
                          <button 
                            onClick={(e) => handleExternalLink(e, m.invitationLink)}
                            className="p-2.5 bg-indigo-600/10 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-lg shadow-indigo-900/5 z-20"
                            title="Giấy mời"
                          >
                            <ExternalLink size={16} />
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSelectedPublicMeeting(m); }}
                          className="p-2.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-slate-400 dark:text-white/30 group-hover:text-white group-hover:bg-blue-600 group-hover:border-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 z-20"
                        >
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center bg-white dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 rounded-[2rem]">
                  <p className="text-xs font-bold text-slate-300 dark:text-white/20 uppercase tracking-widest">Hiện chưa có lịch họp nào được lên lịch</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Smaller & Compact Login Card + Attached Links */}
        <div className="w-full lg:w-[320px] xl:w-[430px] flex flex-col justify-center shrink-0 transition-all duration-500 ease-in-out relative">
          
          {/* Digital Clock Header - Single Line Layout */}
          <div className="mb-6 flex justify-center">
            <div className="px-6 py-2.5 bg-white dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-full shadow-xl flex items-center gap-4 group">
               <div className="flex items-baseline gap-1">
                 <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tighter drop-shadow-[0_0_8px_rgba(59,130,246,0.1)] dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                   {formatTime(now).split(':')[0]}
                   <span className="animate-pulse mx-0.5 text-blue-600 dark:text-blue-400">:</span>
                   {formatTime(now).split(':')[1]}
                 </span>
                 <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 font-mono w-4">
                   {formatTime(now).split(':')[2]}
                 </span>
               </div>
               
               <div className="w-px h-4 bg-gray-200 dark:bg-white/10"></div>
               
               <div className="flex items-center gap-2">
                 <Calendar size={12} className="text-blue-600 dark:text-blue-400/60" />
                 <span className="text-[10px] font-black text-slate-500 dark:text-white/50 uppercase tracking-[0.15em]">
                   {formatDate(now)}
                 </span>
               </div>
            </div>
          </div>
 
          {/* Side-by-Side Wrapper to make Login Card & Links Column level */}
          <div className="flex flex-row items-stretch gap-4 w-full">
            {/* Left Column containing Login Card and Support Box */}
            <div className="flex flex-col gap-4 flex-1">
              
              <AnimatePresence mode="wait">
                {isLoginHidden ? (
                  /* Mascot Body Substituting only the Login Card */
                  <motion.div 
                    key="mascot"
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    onClick={() => setIsLoginHidden(false)}
                    className="bg-white/90 dark:bg-white/10 backdrop-blur-[30px] border-2 border-dashed border-blue-500/40 dark:border-blue-400/30 p-5 rounded-[1.75rem] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.08)] dark:shadow-[0_30px_80px_-15px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center gap-5 cursor-pointer select-none group relative overflow-hidden min-h-[350px]"
                  >
                    {/* Fun cartoon energy waves in background */}
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Spinning/floating particle core behind mascot */}
                    <div className="absolute w-28 h-28 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all duration-500 animate-pulse"></div>

                    {/* Speech bubble/hint for user */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-black px-3.5 py-1.5 rounded-xl shadow-lg whitespace-nowrap opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-0 pointer-events-none z-50">
                      ✨ Làm vì đam mê, ai chê là mình... ✨
                      <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 dark:bg-white rotate-45"></div>
                    </div>

                    {/* Cute Modern AI Robot with Waving Hand, Wandering Motion, Blinking Eyes & Smile */}
                    <CuteAIRobot />

                    {/* Play prompt */}
                    <div className="flex flex-col justify-center items-center text-center px-2 mt-1">
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] animate-pulse">
                        CHÀO BẠN!
                      </span>
                      <span className="text-[9px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest mt-1.5">
                        Chúc bạn một ngày tốt lành
                      </span>
                    </div>

                    {/* Hint bottom icon */}
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-400/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      <Eye size={14} className="animate-bounce" />
                    </div>
                  </motion.div>
                ) : (
                  /* Login Card */
                  <motion.div 
                    key="login-card"
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="bg-white dark:bg-white/10 backdrop-blur-[30px] rounded-[1.75rem] p-5 lg:p-6 shadow-[0_30px_80px_-15px_rgba(0,0,0,0.08)] dark:shadow-[0_30px_80px_-15px_rgba(0,0,0,0.4)] border border-gray-200 dark:border-white/20 flex-1 flex flex-col relative overflow-hidden group min-h-[350px]"
                  >
                    
                    {/* Minimize button inside card */}
                    <button
                      type="button"
                      onClick={() => setIsLoginHidden(true)}
                      className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:text-white/30 dark:hover:text-white transition-all duration-300 flex items-center gap-1 group/btn"
                      title="Tạm ẩn khung đăng nhập"
                    >
                      <span className="text-[8px] font-black tracking-wider uppercase opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300">Tạm ẩn</span>
                      <EyeOff size={13} className="transition-transform group-hover/btn:scale-110" />
                    </button>

                    <div className="mb-5 text-center">
                       <div className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-400/20 rounded-full">
                        <p className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em]">ĐĂNG NHẬP HỆ THỐNG</p>
                      </div>
                      <div>
                        <p className="text-slate-400 dark:text-white/40 text-[8px] font-black tracking-[0.3em] leading-relaxed mt-1.5">
                          <span className="opacity-100">Lưu ý: Chỉ dành cho quản trị hệ thống</span>
                        </p>
                      </div>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-3.5">
                      {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl flex items-center gap-2.5 animate-shake text-red-600 dark:text-white">
                          <XCircle className="w-4.5 h-4.5 text-red-500 dark:text-red-400 shrink-0" />
                          <p className="text-[9px] font-black uppercase tracking-wider leading-tight">{error}</p>
                        </div>
                      )}
         
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] ml-2">Tên tài khoản</label>
                        <div className="relative group">
                          <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/10 outline-none transition-all text-slate-900 dark:text-white font-bold placeholder:text-slate-300 dark:placeholder:text-white/20 text-xs"
                            placeholder="Tên đăng nhập..."
                          />
                          <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-300 dark:text-white/20 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                        </div>
                      </div>
         
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] ml-2">Mật khẩu</label>
                        <div className="relative group">
                          <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/10 outline-none transition-all text-slate-900 dark:text-white font-bold placeholder:text-slate-300 dark:placeholder:text-white/20 text-xs"
                            placeholder="••••••••"
                          />
                          <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-300 dark:text-white/20 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                        </div>
                      </div>
        
                      <button 
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] text-white shadow-lg transition-all active:scale-[0.97] flex items-center justify-center gap-2 mt-3 ${
                          isLoading ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/20'
                        }`}
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                            Đang xác thực...
                          </>
                        ) : (
                          <>
                            ĐĂNG NHẬP
                          </>
                        )}
                      </button>
                    </form>
        
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 text-center">
                      <p className="text-slate-400 dark:text-white/40 text-[8px] font-black uppercase tracking-[0.3em] leading-relaxed">
                        <span className="opacity-50">© 2026 • Trần Trà • VIETTEL SƠN LA</span>
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Support Information Box - aligned perfectly with Login Card */}
              <div className="bg-white dark:bg-white/10 backdrop-blur-[30px] rounded-2xl p-4 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.05)] dark:shadow-[0_15px_35px_-5px_rgba(0,0,0,0.3)] border border-gray-200 dark:border-white/20 w-full flex items-center gap-4 transition-all">
                <div className="w-14 h-14 shrink-0 bg-white dark:bg-slate-900 p-1 rounded-xl border border-gray-100 dark:border-white/5 flex items-center justify-center overflow-hidden shadow-sm">
                  <img 
                    src={systemSettings.supportQrBase64 || FIXED_SUPPORT_QR} 
                    alt="Support QR" 
                    className="w-[50px] h-[50px] object-contain select-none rounded-lg" 
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none">
                    HỖ TRỢ KỸ THUẬT
                  </p>
                  <div className="space-y-0.5">
                    <p className="text-[8px] text-slate-400 dark:text-white/40 font-bold uppercase tracking-wider leading-none">
                      Hotline liên hệ:
                    </p>
                    <a 
                      href={`tel:${(systemSettings.supportPhone || FIXED_SUPPORT_PHONE).replace(/\./g, '')}`}
                      className="block text-xl font-black text-slate-800 dark:text-white tracking-tight hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer leading-tight font-sans"
                    >
                      {systemSettings.supportPhone || FIXED_SUPPORT_PHONE}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop/Attached Links Column on the Right of Login Card */}
            <div className="hidden xl:flex flex-col gap-3 bg-white/70 dark:bg-gradient-to-b dark:from-[#0F172A]/90 dark:to-[#1E293B]/95 backdrop-blur-xl p-3 rounded-2xl border border-gray-200 dark:border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.25)] w-[84px] items-center justify-start shrink-0 select-none">
              <div className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-300 tracking-[0.15em] text-center border-b border-gray-200/60 dark:border-white/10 pb-2 mb-1 w-full">
                LIÊN KẾT
              </div>
              <div className="flex flex-col gap-3 justify-center flex-1">
                {systemSettings.banners?.filter(b => b.active).slice(0, 6).map((b, idx) => (
                  <motion.div
                    key={b.id}
                    className="group relative cursor-pointer"
                    whileHover={{ scale: 1.15, rotate: idx % 2 === 0 ? 2 : -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleExternalLink(e, b.link)}
                  >
                    {/* Glossy border glow effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-500"></div>
                    
                    {/* Main square image container */}
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-gray-200/50 dark:border-white/10 bg-transparent shadow-sm flex items-center justify-center">
                      {b.image ? (
                        <img 
                          src={b.image} 
                          alt={b.title} 
                          className="w-full h-full object-contain p-1 rounded-2xl transition-transform duration-500 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-950 flex items-center justify-center text-xs font-black text-slate-500 dark:text-slate-400">
                          {b.title.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      
                      {/* Shine Sweep Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shine-sweep"></div>
                    </div>
  
                    {/* Hover Tooltip sliding to the left (avoiding right edge cut-off) */}
                    <div className="absolute right-16 top-1/2 -translate-y-1/2 mr-3 pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 z-[100]">
                      <div className="bg-white dark:bg-slate-950/95 backdrop-blur-md text-slate-800 dark:text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xl border border-gray-200 dark:border-white/10 whitespace-nowrap flex items-center gap-2">
                        <span>{b.title}</span>
                        <ExternalLink size={10} className="text-blue-400 shrink-0" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
 
          {/* Quick Access Mobile Grid */}
          <div className="mt-6 xl:hidden w-full space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] ml-2">Liên kết nhanh</h4>
            <div className="grid grid-cols-3 gap-3">
              {systemSettings.banners?.filter(b => b.active).slice(0, 6).map((b, idx) => (
                <motion.div
                  key={b.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => handleExternalLink(e, b.link)}
                  className="bg-white dark:bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-gray-200 dark:border-white/20 shadow-sm flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center group"
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden relative bg-transparent shadow-sm shrink-0">
                    {b.image ? (
                      <img src={b.image} alt={b.title} className="w-full h-full object-contain p-0.5 transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-[10px] font-black text-slate-400">
                        {b.title.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 leading-tight line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                    {b.title}
                  </span>
                </motion.div>
              ))}
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
                  selectedPublicMeeting.status === 'CHANGED_FORMAT' ? 'bg-purple-500/25 text-purple-400 border border-purple-500/20' :
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

              {selectedPublicMeeting.status === 'POSTPONED' && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Thông báo hoãn họp:</p>
                    <p className="text-xs text-white font-medium mt-1 leading-relaxed italic">{selectedPublicMeeting.cancelReason || 'Không có lý do chi tiết.'}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Thời gian</p>
                  <p className="text-sm font-black text-white">{formatMeetingTime(selectedPublicMeeting.startTime)} - {formatMeetingTime(selectedPublicMeeting.endTime)} • {formatMeetingDate(selectedPublicMeeting.startTime)}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Cán bộ chủ trì</p>
                  <p className="text-sm font-black text-white">{selectedPublicMeeting.chairPerson}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Đơn vị tổ chức</p>
                  <p className="text-sm font-black text-blue-400 uppercase tracking-tight line-clamp-1">{selectedPublicMeeting.hostUnit}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Hình thức họp</p>
                  <div className="flex items-center gap-2 mt-1">
                    {(selectedPublicMeeting.meetingFormat === 'TRUC_TUYEN' || (!selectedPublicMeeting.meetingFormat && selectedPublicMeeting.meetingRoomId)) ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-black rounded-lg uppercase tracking-wider border border-emerald-500/30">
                        <Video size={14} />
                        Trực tuyến
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 text-amber-400 text-xs font-black rounded-lg uppercase tracking-wider border border-amber-500/30">
                        <MapPin size={14} />
                        Trực tiếp
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {selectedPublicMeeting.meetingRoomId && 
               selectedPublicMeeting.status !== 'CANCELLED' && 
               selectedPublicMeeting.status !== 'POSTPONED' && 
               selectedPublicMeeting.status !== 'CHANGED_FORMAT' && (
                <div className="p-5 bg-gradient-to-r from-indigo-500/10 via-indigo-500/20 to-indigo-500/10 border border-indigo-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-indigo-500/5">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                    </span>
                    <p className="text-[11px] font-black text-indigo-300 uppercase tracking-[0.1em]">Mã ID phòng họp trực tuyến</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-amber-400 dark:text-amber-300 font-mono tracking-widest px-4 py-1.5 bg-slate-950/60 rounded-xl border border-white/10 select-all shadow-inner">
                      {selectedPublicMeeting.meetingRoomId}
                    </span>
                  </div>
                </div>
              )}

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

            <div className="p-6 border-t border-white/5 bg-white/5 flex flex-wrap justify-end gap-3">
              {selectedPublicMeeting.invitationLink && (
                 <button 
                  onClick={(e) => handleExternalLink(e, selectedPublicMeeting.invitationLink)}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/20 flex items-center gap-2"
                >
                  <MailOpen size={14} />
                  XEM GIẤY MỜI
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
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.15); opacity: 0.4; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        @keyframes wink {
          0%, 94%, 100% { transform: scaleY(1); }
          97% { transform: scaleY(0.1); }
        }
        .animate-wink {
          animation: wink 4s ease-in-out infinite;
        }
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>
    </div>
  );
};

export default LoginView;
