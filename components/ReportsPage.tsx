
import React, { useState, useRef, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area
} from 'recharts';
import { Meeting, Endpoint } from '../types';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface ReportsPageProps {
  meetings: Meeting[];
  endpoints: Endpoint[];
}

type GroupByOption = 'day' | 'week' | 'month' | 'year' | 'unit';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

const ReportsPage: React.FC<ReportsPageProps> = ({ meetings }) => {
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [groupBy, setGroupBy] = useState<GroupByOption>('week');
  const [showChart, setShowChart] = useState(true);
  
  const reportRef = useRef<HTMLDivElement>(null);

  // Helper to get ISO Week number
  const getWeekNumber = (d: Date) => {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  // Quick range handlers
  const setQuickRange = (range: '7d' | '30d' | 'thisMonth' | 'thisYear') => {
    const end = new Date();
    const start = new Date();
    if (range === '7d') start.setDate(end.getDate() - 7);
    else if (range === '30d') start.setDate(end.getDate() - 30);
    else if (range === 'thisMonth') start.setDate(1);
    else if (range === 'thisYear') { start.setMonth(0); start.setDate(1); }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const filteredMeetings = useMemo(() => {
    const startTs = new Date(startDate).setHours(0,0,0,0);
    const endTs = new Date(endDate).setHours(23,59,59,999);
    return meetings.filter(m => {
      const mTime = new Date(m.startTime).getTime();
      return mTime >= startTs && mTime <= endTs;
    });
  }, [meetings, startDate, endDate]);

  const statsData = useMemo(() => {
    const groupMap: Record<string, number> = {};
    
    filteredMeetings.forEach(m => {
      const d = new Date(m.startTime);
      let key = '';
      
      switch (groupBy) {
        case 'day':
          key = d.toLocaleDateString('vi-VN');
          break;
        case 'week':
          key = `Tuần ${getWeekNumber(d)}/${d.getFullYear()}`;
          break;
        case 'month':
          key = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
          break;
        case 'year':
          key = `Năm ${d.getFullYear()}`;
          break;
        case 'unit':
          key = m.hostUnit;
          break;
      }
      groupMap[key] = (groupMap[key] || 0) + 1;
    });

    const sortedKeys = Object.keys(groupMap).sort((a, b) => {
      if (groupBy === 'unit') return groupMap[b] - groupMap[a];
      // Basic chronological sort for dates
      if (groupBy === 'day') {
        const [da, ma, ya] = a.split('/').map(Number);
        const [db, mb, yb] = b.split('/').map(Number);
        return new Date(ya, ma-1, da).getTime() - new Date(yb, mb-1, db).getTime();
      }
      return a.localeCompare(b, undefined, { numeric: true });
    });

    return sortedKeys.map(key => ({
      name: key,
      value: groupMap[key]
    }));
  }, [filteredMeetings, groupBy]);

  const downloadPDF = () => {
    if (!reportRef.current) return;
    // Fix: Use 'as const' to ensure 'jpeg' is treated as a literal type and not a generic string
    const opt = {
      margin: 10,
      filename: `Bao_cao_thong_ke_${new Date().toISOString().slice(0,10)}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const }
    };
    html2pdf().from(reportRef.current).set(opt).save();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Control Panel */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm no-print space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Trung tâm Báo cáo</h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Phân tích tần suất họp trực tuyến</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setQuickRange('7d')} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all">7 Ngày qua</button>
              <button onClick={() => setQuickRange('30d')} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all">30 Ngày qua</button>
              <button onClick={() => setQuickRange('thisMonth')} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all">Tháng này</button>
              <button onClick={() => setQuickRange('thisYear')} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all">Năm nay</button>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Khoảng thời gian (Lịch)</label>
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-gray-300 font-bold">→</span>
                <input 
                  type="date" 
                  className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tiêu chí gom nhóm</label>
              <select 
                className="block px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
              >
                <option value="day">Từng Ngày cụ thể</option>
                <option value="week">Theo Tuần</option>
                <option value="month">Theo Tháng</option>
                <option value="year">Theo Năm</option>
                <option value="unit">Theo Đơn vị chủ trì</option>
              </select>
            </div>
            <button 
              onClick={downloadPDF}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Xuất Báo cáo
            </button>
          </div>
        </div>
      </div>

      <div ref={reportRef} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-12 space-y-12">
        {/* Header Báo cáo */}
        <div className="flex justify-between items-start border-b border-gray-100 pb-10">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Báo cáo Thống kê Hoạt động Họp trực tuyến</h1>
            <p className="text-xs text-blue-600 font-black uppercase tracking-[0.3em]">Hệ thống Giám sát Cầu truyền hình v3.1</p>
            <div className="flex items-center gap-4 mt-6">
              <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-2xl text-[10px] font-black text-blue-700 uppercase tracking-widest">
                Từ: {new Date(startDate).toLocaleDateString('vi-VN')} → {new Date(endDate).toLocaleDateString('vi-VN')}
              </div>
              <div className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-2xl text-[10px] font-black text-slate-700 uppercase tracking-widest">
                Phân loại: {groupBy === 'day' ? 'Hàng ngày' : groupBy === 'week' ? 'Hàng tuần' : groupBy === 'month' ? 'Hàng tháng' : groupBy === 'year' ? 'Hàng năm' : 'Theo Đơn vị'}
              </div>
            </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thời gian trích xuất</p>
             <p className="text-sm font-black text-gray-900 mt-1">{new Date().toLocaleString('vi-VN')}</p>
          </div>
        </div>

        {/* Tổng hợp chỉ số nhanh */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Tổng cuộc họp', value: filteredMeetings.length, color: 'blue' },
            { label: 'Đơn vị tổ chức', value: Array.from(new Set(filteredMeetings.map(m => m.hostUnit))).length, color: 'emerald' },
            { label: 'Số điểm cầu tham gia', value: Array.from(new Set(filteredMeetings.flatMap(m => m.endpoints.map(e => e.id)))).length, color: 'amber' },
            { label: 'Tỷ lệ hoạt động', value: '94.5%', color: 'purple' }
          ].map((stat, i) => (
            <div key={i} className={`p-6 rounded-3xl border bg-${stat.color}-50/30 border-${stat.color}-100/50`}>
              <p className={`text-[9px] font-black text-${stat.color}-600 uppercase tracking-widest mb-1`}>{stat.label}</p>
              <p className={`text-3xl font-black text-${stat.color}-900`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Biểu đồ Phân tích */}
        {showChart && statsData.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Biểu đồ trực quan hóa dữ liệu</h3>
               <button onClick={() => setShowChart(!showChart)} className="text-[9px] font-black text-blue-600 uppercase no-print">Ẩn biểu đồ</button>
            </div>
            <div className="bg-gray-50/50 rounded-[2rem] p-8 border border-gray-100">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {groupBy === 'unit' ? (
                    <BarChart data={statsData} margin={{ bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 9, fill: '#6B7280', fontWeight: 'bold' }} 
                        angle={-45} 
                        textAnchor="end" 
                        interval={0}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        cursor={{ fill: '#F3F4F6' }}
                      />
                      <Bar dataKey="value" fill="#3B82F6" radius={[12, 12, 0, 0]} barSize={40}>
                        {statsData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  ) : (
                    <AreaChart data={statsData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 'bold' }}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Bảng tổng hợp số lượng */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] pl-3 border-l-4 border-blue-600">Bảng Tổng hợp Số lượng</h3>
          <div className="overflow-hidden border border-gray-100 rounded-3xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-black uppercase tracking-widest text-[9px]">
                <tr>
                  <th className="px-8 py-5">STT</th>
                  <th className="px-8 py-5">{groupBy === 'unit' ? 'Đơn vị chủ trì' : 'Mốc thời gian'}</th>
                  <th className="px-8 py-5 text-center">Số lượng cuộc họp</th>
                  <th className="px-8 py-5 text-right">Tỷ lệ đóng góp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {statsData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-8 py-5 text-gray-400 font-bold">{idx + 1}</td>
                    <td className="px-8 py-5 text-gray-900 font-black">{row.name}</td>
                    <td className="px-8 py-5 text-center">
                      <span className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-xl font-black">{row.value} cuộc họp</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                         <span className="text-gray-500 font-bold">{((row.value / (filteredMeetings.length || 1)) * 100).toFixed(1)}%</span>
                         <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${(row.value / (filteredMeetings.length || 1)) * 100}%` }}></div>
                         </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Thông tin Cuộc họp chi tiết */}
        <div className="space-y-4 pt-10">
          <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] pl-3 border-l-4 border-slate-600">Thông tin Chi tiết Cuộc họp</h3>
          <div className="overflow-hidden border border-gray-100 rounded-3xl">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-gray-100 text-gray-500 font-black uppercase tracking-widest text-[8px]">
                <tr>
                  <th className="px-6 py-4">Thời gian tổ chức</th>
                  <th className="px-6 py-4">Tên cuộc họp</th>
                  <th className="px-6 py-4">Đơn vị / Cán bộ chủ trì</th>
                  <th className="px-6 py-4 text-center">Thành phần & Điểm cầu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMeetings.sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-black text-gray-900">{new Date(m.startTime).toLocaleDateString('vi-VN')}</div>
                      <div className="text-[9px] text-blue-500 font-bold mt-1 uppercase">
                         {new Date(m.startTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} - {new Date(m.endTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800 line-clamp-2 max-w-xs">{m.title}</div>
                      <div className="text-[9px] text-gray-400 font-mono mt-1">ID: {m.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-black text-blue-700">{m.hostUnit}</div>
                      <div className="text-[10px] text-gray-500 font-bold mt-1">CB: {m.chairPerson}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg font-black text-[9px] uppercase tracking-tighter">
                          {m.endpoints.length} ĐIỂM CẦU
                        </span>
                        <span className="text-[8px] text-gray-400 font-bold uppercase">{m.participants.length} THÀNH PHẦN KHÁC</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredMeetings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-24 text-center">
                       <div className="flex flex-col items-center gap-4 text-gray-300">
                          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                          <p className="text-sm font-black uppercase tracking-widest italic">Không có dữ liệu cuộc họp trong khoảng thời gian này</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Báo cáo */}
        <div className="pt-20 flex justify-between items-end">
           <div className="max-w-md space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nguồn dữ liệu</p>
              <p className="text-[10px] text-gray-500 italic leading-relaxed">
                 Báo cáo này được tổng hợp từ cơ sở dữ liệu giám sát thời gian thực của Hệ thống Cầu truyền hình. Mọi sai sót vui lòng liên hệ bộ phận Kỹ thuật để đối soát.
              </p>
           </div>
           <div className="text-center w-64 space-y-20">
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Người trích xuất báo cáo</p>
              <div className="flex flex-col items-center gap-1">
                 <div className="w-48 h-px bg-gray-200 mb-2"></div>
                 <p className="text-[10px] text-gray-400 font-bold uppercase">(Ký và ghi rõ họ tên)</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
