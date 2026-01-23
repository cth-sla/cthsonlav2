
import React, { useState, useRef, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, Legend
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
    d.setMonth(d.getMonth() - 3); // Mặc định xem 3 tháng gần nhất
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [groupBy, setGroupBy] = useState<GroupByOption>('month');
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

  const setQuickRange = (range: '7d' | '30d' | 'thisMonth' | 'thisYear' | 'all') => {
    const end = new Date();
    const start = new Date();
    if (range === '7d') start.setDate(end.getDate() - 7);
    else if (range === '30d') start.setDate(end.getDate() - 30);
    else if (range === 'thisMonth') start.setDate(1);
    else if (range === 'thisYear') { start.setMonth(0); start.setDate(1); }
    else if (range === 'all') start.setFullYear(2020);
    
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
          key = `T${getWeekNumber(d)}/${d.getFullYear()}`;
          break;
        case 'month':
          key = `${d.getMonth() + 1}/${d.getFullYear()}`;
          break;
        case 'year':
          key = `${d.getFullYear()}`;
          break;
        case 'unit':
          key = m.hostUnit;
          break;
      }
      groupMap[key] = (groupMap[key] || 0) + 1;
    });

    const sortedKeys = Object.keys(groupMap).sort((a, b) => {
      if (groupBy === 'unit') return groupMap[b] - groupMap[a];
      if (groupBy === 'day') {
        const [da, ma, ya] = a.split('/').map(Number);
        const [db, mb, yb] = b.split('/').map(Number);
        return new Date(ya, ma-1, da).getTime() - new Date(yb, mb-1, db).getTime();
      }
      if (groupBy === 'month' || groupBy === 'week') {
          // Simple string sort for Month/Year often works if formatted correctly, 
          // but we can refine if needed.
          return a.localeCompare(b, undefined, { numeric: true });
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
    const opt = {
      margin: 10,
      filename: `Bao_cao_CTH_Sơn_La_${new Date().toISOString().slice(0,10)}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const }
    };
    html2pdf().from(reportRef.current).set(opt).save();
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Control Panel */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm no-print space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Thống kê & Báo cáo</h2>
                <p className="text-xs text-blue-600 font-black uppercase tracking-widest mt-1">Phân tích hiệu suất vận hành hệ thống</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setQuickRange('7d')} className="px-4 py-2 bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all">7 Ngày</button>
              <button onClick={() => setQuickRange('30d')} className="px-4 py-2 bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all">30 Ngày</button>
              <button onClick={() => setQuickRange('thisMonth')} className="px-4 py-2 bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all">Tháng này</button>
              <button onClick={() => setQuickRange('thisYear')} className="px-4 py-2 bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all">Năm nay</button>
              <button onClick={() => setQuickRange('all')} className="px-4 py-2 bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all">Tất cả</button>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lọc thời gian</label>
              <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-2xl border border-gray-100">
                <input 
                  type="date" 
                  className="px-4 py-2 bg-transparent text-sm font-bold focus:outline-none transition-all"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-gray-300 font-bold px-1">→</span>
                <input 
                  type="date" 
                  className="px-4 py-2 bg-transparent text-sm font-bold focus:outline-none transition-all"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gom nhóm theo</label>
              <select 
                className="block px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
              >
                <option value="day">Theo Ngày</option>
                <option value="week">Theo Tuần</option>
                <option value="month">Theo Tháng</option>
                <option value="year">Theo Năm</option>
                <option value="unit">Đơn vị chủ trì</option>
              </select>
            </div>
            <button 
              onClick={downloadPDF}
              className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Xuất PDF
            </button>
          </div>
        </div>
      </div>

      {/* Main Report Document */}
      <div ref={reportRef} className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-12 space-y-12">
        {/* Header Document */}
        <div className="flex justify-between items-start border-b-2 border-gray-900 pb-8">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">BÁO CÁO THỐNG KÊ HOẠT ĐỘNG</h1>
            <p className="text-sm text-blue-600 font-black uppercase tracking-[0.4em]">Hệ thống giám sát Cầu truyền hình v3.1</p>
            <div className="flex items-center gap-6 mt-6">
              <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-400 uppercase">Giai đoạn báo cáo</span>
                  <span className="text-sm font-black text-gray-900 uppercase">{new Date(startDate).toLocaleDateString('vi-VN')} – {new Date(endDate).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-400 uppercase">Tiêu chí tổng hợp</span>
                  <span className="text-sm font-black text-blue-600 uppercase">{groupBy === 'day' ? 'Hàng ngày' : groupBy === 'week' ? 'Hàng tuần' : groupBy === 'month' ? 'Hàng tháng' : groupBy === 'year' ? 'Hàng năm' : 'Phòng ban / Đơn vị'}</span>
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
             <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                 <svg className="w-6 h-6 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4 7V17L12 22L20 17V7L12 2Z"/></svg>
             </div>
             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2">Ngày in: {new Date().toLocaleDateString('vi-VN')}</p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { label: 'TỔNG CỘNG CUỘC HỌP', value: filteredMeetings.length, sub: 'Ghi nhận trong kỳ', color: 'blue' },
            { label: 'ĐƠN VỊ CHỦ TRÌ', value: Array.from(new Set(filteredMeetings.map(m => m.hostUnit))).length, sub: 'Đơn vị tham gia tổ chức', color: 'emerald' },
            { label: 'ĐIỂM CẦU KẾT NỐI', value: Array.from(new Set(filteredMeetings.flatMap(m => m.endpoints.map(e => e.id)))).length, sub: 'Phát sinh tín hiệu', color: 'amber' },
            { label: 'TỶ LỆ KHẢ DỤNG', value: '98.2%', sub: 'SLA Cam kết', color: 'purple' }
          ].map((stat, i) => (
            <div key={i} className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100 shadow-inner flex flex-col items-center text-center">
              <p className={`text-[10px] font-black text-${stat.color}-600 uppercase tracking-widest mb-2`}>{stat.label}</p>
              <p className="text-4xl font-black text-gray-900 mb-1">{stat.value}</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Analytics Chart */}
        {showChart && statsData.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-l-4 border-blue-600 pl-4">
               <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Biểu đồ phân tích xu hướng</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Số lượng cuộc họp biến động theo {groupBy}</p>
               </div>
               <button onClick={() => setShowChart(!showChart)} className="text-[10px] font-black text-blue-600 uppercase no-print hover:underline">Ẩn biểu đồ</button>
            </div>
            <div className="bg-gray-50/30 rounded-[2.5rem] p-10 border border-gray-100">
              <div className="h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {groupBy === 'unit' ? (
                    <BarChart data={statsData} margin={{ bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 9, fill: '#6B7280', fontWeight: 'bold' }} 
                        angle={-40} 
                        textAnchor="end" 
                        interval={0}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '16px' }}
                        cursor={{ fill: '#F1F5F9', radius: 10 }}
                      />
                      <Bar dataKey="value" fill="#3B82F6" radius={[12, 12, 4, 4]} barSize={40}>
                        {statsData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  ) : (
                    <AreaChart data={statsData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
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
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={5} fillOpacity={1} fill="url(#colorValue)" dot={{ r: 6, fill: '#3B82F6', strokeWidth: 3, stroke: '#fff' }} />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Aggregate Table */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 border-l-4 border-emerald-600 pl-4">
             <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Bảng tổng hợp dữ liệu</h3>
          </div>
          <div className="overflow-hidden border border-gray-100 rounded-[2rem] shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-black uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="px-8 py-6">STT</th>
                  <th className="px-8 py-6">{groupBy === 'unit' ? 'ĐƠN VỊ CHỦ TRÌ' : 'THỜI GIAN'}</th>
                  <th className="px-8 py-6 text-center">SỐ LƯỢNG CUỘC HỌP</th>
                  <th className="px-8 py-6 text-right">TỶ TRỌNG (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {statsData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-8 py-5 text-gray-400 font-bold">{idx + 1}</td>
                    <td className="px-8 py-5 text-gray-900 font-black uppercase tracking-tight">{row.name}</td>
                    <td className="px-8 py-5 text-center">
                      <span className="px-5 py-2 bg-blue-50 text-blue-700 rounded-xl font-black text-[11px] border border-blue-100">{row.value}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-4">
                         <span className="text-gray-500 font-black">{((row.value / (filteredMeetings.length || 1)) * 100).toFixed(1)}%</span>
                         <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: `${(row.value / (filteredMeetings.length || 1)) * 100}%` }}></div>
                         </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Meeting Information (Theo yêu cầu: Thông tin về cuộc họp) */}
        <div className="space-y-6 pt-12">
          <div className="flex items-center gap-4 border-l-4 border-amber-500 pl-4">
             <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Danh sách thông tin cuộc họp chi tiết</h3>
          </div>
          <div className="overflow-hidden border border-gray-100 rounded-[2rem] shadow-sm">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-gray-100 text-gray-500 font-black uppercase tracking-widest text-[9px]">
                <tr>
                  <th className="px-8 py-5">THỜI GIAN</th>
                  <th className="px-8 py-5">TÊN CUỘC HỌP / CHỦ ĐỀ</th>
                  <th className="px-8 py-5">ĐƠN VỊ & CÁN BỘ CHỦ TRÌ</th>
                  <th className="px-8 py-5 text-center">ĐIỂM CẦU / THÀNH PHẦN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMeetings.sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="font-black text-gray-900">{new Date(m.startTime).toLocaleDateString('vi-VN')}</div>
                      <div className="text-[10px] text-blue-500 font-black mt-1 uppercase">
                         {new Date(m.startTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-black text-gray-800 uppercase tracking-tight line-clamp-2 max-w-sm">{m.title}</div>
                      <div className="text-[9px] text-gray-400 font-mono mt-1 uppercase">Mã: {m.id}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-black text-slate-700 uppercase">{m.hostUnit}</div>
                      <div className="text-[10px] text-gray-500 font-bold mt-1">Chủ trì: {m.chairPerson}</div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="px-4 py-1.5 bg-slate-900 text-cyan-400 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-lg">
                          {m.endpoints.length} ĐIỂM CẦU
                        </span>
                        <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">{m.participants.length} THÀNH PHẦN KHÁC</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredMeetings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-32 text-center">
                       <div className="flex flex-col items-center gap-6 text-gray-300">
                          <svg className="w-20 h-20 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                          <p className="text-lg font-black uppercase tracking-[0.3em] italic">Không tìm thấy dữ liệu phù hợp</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signature Section */}
        <div className="pt-24 flex justify-between items-end border-t border-gray-100">
           <div className="max-w-md space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nguồn xác thực dữ liệu</p>
              <p className="text-[10px] text-gray-500 italic leading-relaxed font-medium">
                 Báo cáo điện tử này được trích xuất từ Hệ thống Quản lý Cầu truyền hình tỉnh Sơn Lan. Thông tin điểm cầu và thời gian họp được ghi nhận tự động từ hạ tầng MCU và thiết bị đầu cuối.
              </p>
           </div>
           <div className="text-center w-80 space-y-24">
              <div>
                  <p className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em]">CÁN BỘ LẬP BÁO CÁO</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">(Ký tên và ghi rõ họ tên)</p>
              </div>
              <div className="flex flex-col items-center">
                 <div className="w-56 h-px bg-gray-200 mb-2"></div>
                 <p className="text-[11px] text-slate-400 font-black uppercase italic">Hệ thống CTH v3.1</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
