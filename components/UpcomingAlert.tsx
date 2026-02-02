
import React, { useState, useEffect } from 'react';
import { Meeting } from '../types';
import { Clock, Users, MapPin, Zap, ArrowRight } from 'lucide-react';

interface UpcomingAlertProps {
  meeting: Meeting;
  onViewDetail: (meeting: Meeting) => void;
}

const UpcomingAlert: React.FC<UpcomingAlertProps> = ({ meeting, onViewDetail }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const start = new Date(meeting.startTime).getTime();
      const diff = start - now;

      if (diff <= 0) {
        setTimeLeft('Đang diễn ra');
        return;
      }

      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));

      if (hours > 0) {
        setTimeLeft(`${hours} giờ ${minutes} phút nữa`);
      } else {
        setTimeLeft(`${minutes} phút nữa`);
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 30000);
    return () => clearInterval(timer);
  }, [meeting.startTime]);

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-[2.5rem] p-6 md:p-8 text-white shadow-2xl shadow-blue-200 group animate-in slide-in-from-top-4 duration-700">
      {/* Background Decorative Circles */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-red-400/20 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="relative">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center border border-white/30 shadow-xl">
              <Zap className="w-10 h-10 text-yellow-300 animate-pulse" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full border-4 border-indigo-600 animate-ping"></div>
          </div>
          
          <div className="space-y-2">
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
              <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">Hội nghị chuẩn bị diễn ra</span>
              <div className="flex items-center gap-2 text-yellow-300">
                <Clock size={14} className="animate-spin-slow" />
                <span className="text-xs font-black uppercase tracking-widest">{timeLeft}</span>
              </div>
            </div>
            <h3 className="text-xl md:text-2xl font-black tracking-tighter uppercase leading-tight max-w-xl">
              {meeting.title}
            </h3>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-white/70">
              <div className="flex items-center gap-2">
                <Users size={14} />
                <span className="text-[11px] font-bold uppercase">{meeting.chairPerson}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} />
                <span className="text-[11px] font-bold uppercase">{meeting.endpoints.length} Điểm cầu</span>
              </div>
            </div>
          </div>
        </div>

      </div>
      
      <style>{`
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default UpcomingAlert;
