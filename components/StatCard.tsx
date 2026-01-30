
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
    <div className="relative group bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between transition-all hover:shadow-md hover:border-blue-100">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
      </div>

      {/* Tooltip */}
      {description && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-2 bg-slate-900 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[100] shadow-2xl min-w-[200px] max-w-xs border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <div className="font-black mb-1.5 border-b border-slate-700 pb-1.5 flex justify-between items-center uppercase tracking-widest">
            <span>{tooltipTitle}</span>
            {trend && <span className={trendUp ? 'text-green-400' : 'text-red-400'}>{trendUp ? '↑' : '↓'}</span>}
          </div>
          <div className="leading-relaxed font-medium">
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
