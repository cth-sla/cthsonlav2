
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
    <div className="relative group bg-white p-6 rounded-[1.75rem] shadow-sm border border-gray-100 flex flex-col justify-between transition-all hover:shadow-xl hover:border-blue-100 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-inner">
          {icon}
        </div>
        {trend && (
          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.15em]">{title}</p>
        <h3 className="text-3xl font-black text-gray-900 mt-1 tracking-tighter">{value}</h3>
      </div>

      {/* Tooltip với z-index và pointer-events tối ưu */}
      {description && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-4 py-3 bg-slate-900 text-white text-[11px] rounded-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[100] shadow-2xl min-w-[220px] max-w-[280px] border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <div className="font-black mb-2 border-b border-slate-700 pb-2 flex justify-between items-center uppercase tracking-widest text-[9px] text-blue-400">
            <span>{tooltipTitle}</span>
          </div>
          <div className="leading-relaxed font-medium text-slate-300 italic">
            {description}
          </div>
          {/* Tooltip Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
        </div>
      )}
    </div>
  );
};

export default StatCard;
