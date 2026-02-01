
import React from 'react';
import { Bell, X, ArrowRight } from 'lucide-react';
import { Meeting } from '../types';

interface NotificationToastProps {
  meeting: Meeting;
  onClose: () => void;
  onAction: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ meeting, onClose, onAction }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[200] w-full max-w-sm animate-in slide-in-from-right-8 fade-in duration-500">
      <div className="bg-slate-900 border border-white/10 rounded-[2rem] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
        
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400 shrink-0">
            <Bell size={24} className="animate-bounce" />
          </div>
          
          <div className="flex-1 min-w-0 pr-6">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Nhắc nhở cuộc họp</p>
            <h4 className="text-sm font-bold text-white truncate mb-1">{meeting.title}</h4>
            <p className="text-[10px] text-white/50 font-medium">Sắp bắt đầu lúc {new Date(meeting.startTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit', hour12: false})}</p>
            
            <button 
              onClick={onAction}
              className="mt-3 flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest hover:text-blue-400 transition-colors"
            >
              Chi tiết <ArrowRight size={12} />
            </button>
          </div>
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;
