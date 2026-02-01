
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  description?: React.ReactNode;
  tooltipTitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendUp, 
  description,
  tooltipTitle = "Chi tiết chỉ số"
}) => {
  return (
    <div className="relative group bg-white p-6 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between transition-all duration-500 hover:shadow-[0_20px_50px_rgba(59,130,246,0.12)] hover:border-blue-200 hover:-translate-y-2 overflow-visible">
      <div className="flex items-center justify-between mb-6">
        <div className="p-4 bg-blue-50 text-blue-600 rounded-[1.25rem] group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm">
          {/* Fix: Validate that icon is a React element and use React.ReactElement<any> to allow passing 'size' and 'strokeWidth' props */}
          {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, { size: 24, strokeWidth: 2.5 })}
        </div>
        {trend && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
            trendUp 
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
              : 'bg-red-50 text-red-600 border border-red-100'
          }`}>
            <span className="text-xs">{trendUp ? '↑' : '↓'}</span>
            {trend}
          </div>
        )}
      </div>
      
      <div>
        <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-4xl font-black text-gray-900 tracking-tighter group-hover:text-blue-700 transition-colors duration-300">
            {value}
          </h3>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mb-1.5"></div>
        </div>
      </div>

      {/* Modern Tooltip with Glassmorphism */}
      {description && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 px-5 py-4 bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-[1.75rem] opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 pointer-events-none z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.3)] min-w-[240px] max-w-[300px] border border-white/10">
          <div className="font-black mb-3 border-b border-white/10 pb-2 flex justify-between items-center uppercase tracking-widest text-[9px] text-blue-400">
            <span className="flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {tooltipTitle}
            </span>
          </div>
          <div className="leading-relaxed font-medium text-slate-200 italic">
            {description}
          </div>
          {/* Tooltip Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[10px] border-transparent border-t-slate-900/95"></div>
        </div>
      )}
    </div>
  );
};

export default StatCard;
