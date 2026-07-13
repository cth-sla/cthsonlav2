
import React, { useState, useMemo } from 'react';
import { Meeting } from '../types';

interface MeetingCalendarProps {
  meetings: Meeting[];
  onSelect: (meeting: Meeting) => void;
}

const MeetingCalendar: React.FC<MeetingCalendarProps> = ({ meetings, onSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const startDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = daysInMonth(year, month);
    const firstDay = startDayOfMonth(year, month);
    
    // Adjust for Monday start (0=Sun, 1=Mon... -> 0=Mon, 6=Sun)
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    
    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];

    // Fill offset
    for (let i = 0; i < startOffset; i++) {
      currentWeek.push(null);
    }

    // Fill days
    for (let d = 1; d <= days; d++) {
      currentWeek.push(d);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill remaining
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [currentDate]);

  const getMeetingsForDay = (day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return meetings.filter(m => {
      const mDate = new Date(m.startTime);
      return mDate.getDate() === day && 
             mDate.getMonth() === currentDate.getMonth() && 
             mDate.getFullYear() === currentDate.getFullYear();
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const weekdayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
      {/* Calendar Header */}
      <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/30 dark:bg-slate-800/50">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
            Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
          </h2>
          <button 
            onClick={handleToday}
            className="px-3 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-600 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            Hôm nay
          </button>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
          <button 
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="w-px h-4 bg-gray-200 dark:bg-slate-700 mx-1"></div>
          <button 
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Weekday Names */}
      <div className="grid grid-cols-7 border-b border-gray-100 dark:border-slate-800 bg-gray-50/10 dark:bg-slate-800/20">
        {weekdayNames.map(name => (
          <div key={name} className="py-3 text-center text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
            {name}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 grid grid-cols-7 divide-x divide-y divide-gray-100 dark:divide-slate-800 border-b border-gray-100 dark:border-slate-800">
        {calendarData.flat().map((day, idx) => (
          <div 
            key={idx} 
            className={`min-h-[120px] p-2 transition-all flex flex-col group ${
              day === null ? 'bg-gray-50/40 dark:bg-slate-800/40' : 'bg-white dark:bg-slate-900 hover:bg-blue-50/20 dark:hover:bg-blue-900/10'
            }`}
          >
            {day && (
              <>
                <div className="flex justify-between items-center mb-1.5">
                  <span className={`text-xs font-black p-1 rounded-md min-w-[24px] text-center ${
                    isToday(day) ? 'bg-blue-600 text-white shadow-md shadow-blue-100 dark:shadow-none' : 'text-gray-400 dark:text-slate-500'
                  }`}>
                    {day}
                  </span>
                  {getMeetingsForDay(day).length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  )}
                </div>
                <div className="flex-1 space-y-1 overflow-y-auto max-h-[140px] custom-scrollbar">
                  {getMeetingsForDay(day).map(m => {
                    const isCancelled = m.status === 'CANCELLED';
                    const isPostponed = m.status === 'POSTPONED';
                    
                    return (
                      <button
                        key={m.id}
                        onClick={() => onSelect(m)}
                        className={`w-full text-left p-1.5 rounded-lg border transition-all group/chip mb-1 ${
                          isCancelled ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30 hover:bg-red-100 dark:hover:bg-red-900/40 hover:border-red-200 dark:hover:border-red-700/50' :
                          isPostponed ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:border-amber-200 dark:hover:border-amber-700/50' :
                          'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-200 dark:hover:border-blue-700/50'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <div className={`text-[10px] font-black leading-tight line-clamp-2 uppercase ${
                            isCancelled ? 'text-red-700 dark:text-red-400 line-through decoration-red-700/50' :
                            isPostponed ? 'text-amber-700 dark:text-amber-400 italic' :
                            'text-blue-700 dark:text-blue-400'
                          }`}>
                            {m.title}
                          </div>
                          <span className={`shrink-0 text-[8px] font-black px-1 rounded ${
                            isCancelled ? 'bg-red-200 dark:bg-red-800/50 text-red-800 dark:text-red-200' :
                            isPostponed ? 'bg-amber-200 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200' :
                            'bg-blue-200 dark:bg-blue-800/50 text-blue-800 dark:text-blue-200'
                          }`}>
                            {m.endpoints.length}EP
                          </span>
                        </div>
                        <div className={`text-[9px] font-bold mt-0.5 flex items-center gap-1 ${
                          isCancelled ? 'text-red-400 dark:text-red-500' :
                          isPostponed ? 'text-amber-400 dark:text-amber-500' :
                          'text-blue-400 dark:text-blue-500'
                        }`}>
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3" /></svg>
                          {new Date(m.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MeetingCalendar;
