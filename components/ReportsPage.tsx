
import React, { useState, useRef, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, Legend, LabelList, PieChart, Pie
} from 'recharts';
import { Meeting, Endpoint, User } from '../types';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { Calendar, Building2, CheckCircle, AlertTriangle, FileText, Download, TrendingUp, Users, Clock, Hash } from 'lucide-react';

interface ReportsPageProps {
  meetings: Meeting[];
  endpoints: Endpoint[];
  currentUser?: User | null;
}

type GroupByOption = 'day' | 'week' | 'month' | 'year' | 'unit';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

const ReportsPage: React.FC<ReportsPageProps> = ({ meetings, currentUser }) => {
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [groupBy, setGroupBy] = useState<GroupByOption>('month');
  
  const reportRef = useRef<HTMLDivElement>(null);

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
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [meetings, startDate, endDate]);

  const reportStats = useMemo(() => {
    const total = filteredMeetings.length;
    const scheduled = filteredMeetings.filter(m => m.status === 'SCHEDULED' || !m.status).length;
    const cancelled = filteredMeetings.filter(m => m.status === 'CANCELLED').length;
    const postponed = filteredMeetings.filter(m => m.status === 'POSTPONED').length;
    
    const uniqueUnits = new Set(filteredMeetings.map(m => m.hostUnit)).size;
    
    // Thống kê theo tuần, tháng, năm của thời điểm hiện tại
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
    startOfWeek.setHours(0,0,0,0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const currentWeekCount = meetings.filter(m => m.status !== 'CANCELLED' && new Date(m.startTime) >= startOfWeek).length;
    const currentMonthCount = meetings.filter(m => m.status !== 'CANCELLED' && new Date(m.startTime) >= startOfMonth).length;
    const currentYearCount = meetings.filter(m => m.status !== 'CANCELLED' && new Date(m.startTime) >= startOfYear).length;
    
    return { total, scheduled, cancelled, postponed, uniqueUnits, currentWeekCount, currentMonthCount, currentYearCount };
  }, [filteredMeetings, meetings]);

  const statsData = useMemo(() => {
    const groupMap: Record<string, number> = {};
    
    filteredMeetings.forEach(m => {
      const d = new Date(m.startTime);
      let key = '';
      
      switch (groupBy) {
        case 'day': key = d.toLocaleDateString('vi-VN'); break;
        case 'week': key = `Tuần ${getWeekNumber(d)}/${d.getFullYear()}`; break;
        case 'month': key = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`; break;
        case 'year': key = `Năm ${d.getFullYear()}`; break;
        case 'unit': key = m.hostUnit; break;
      }
      groupMap[key] = (groupMap[key] || 0) + 1;
    });

    return Object.keys(groupMap).map(key => ({
      name: key,
      value: groupMap[key]
    })).sort((a, b) => groupBy === 'unit' ? b.value - a.value : 0);
  }, [filteredMeetings, groupBy]);

  const downloadPDF = () => {
    if (!reportRef.current) return;
    const opt = {
      margin: 10,
      filename: `Bao_cao_CTH_Son_La_${new Date().toISOString().slice(0,10)}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'landscape' as const }
    };
    html2pdf().from(reportRef.current).set(opt).save();
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Control Panel */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm no-print space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-black text-gray-900 uppercase flex items-center gap-3">
              <FileText className="text-blue-600" />
              Thiết lập Báo cáo
            </h2>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setQuickRange('7d')} className="px-4 py-2 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black transition-all">7 Ngày</button>
              <button onClick={() => setQuickRange('30d')} className="px-4 py-2 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black transition-all">30 Ngày</button>
              <button onClick={() => setQuickRange('thisMonth')} className="px-4 py-2 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black transition-all">Tháng này</button>
              <button onClick={() => setQuickRange('thisYear')} className="px-4 py-2 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black transition-all">Năm nay</button>
            </div>
          </div>
          
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Từ ngày</label>
              <input type="date" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Đến ngày</label>
              <input type="date" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gom nhóm biểu đồ</label>
              <select className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold cursor-pointer" value={groupBy} onChange={e => setGroupBy(e.target.value as any)}>
                <option value="day">Theo Ngày</option>
                <option value="week">Theo Tuần</option>
                <option value="month">Theo Tháng</option>
                <option value="year">Theo Năm</option>
                <option value="unit">Đơn vị chủ trì</option>
              </select>
            </div>
            <button 
              onClick={downloadPDF} 
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <Download size={16} />
              Tải PDF
            </button>
          </div>
        </div>
      </div>

      {/* Report Document Content */}
      <div ref={reportRef} className="bg-white rounded-[2rem] shadow-sm p-10 space-y-10 border border-gray-50 min-h-[1000px]">
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-8 flex justify-between items-end">
          <div className="space-y-1">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Báo cáo Thống kê Hội nghị</h1>
            <p className="text-sm font-bold text-blue-600 uppercase tracking-[0.1em]">Hệ thống Quản lý & Giám sát Cầu truyền hình tỉnh Sơn La</p>
          </div>
          <div className="text-right text-[10px] font-bold text-slate-400 uppercase space-y-1">
            <p>Thời gian báo cáo: {new Date(startDate).toLocaleDateString('vi-VN')} - {new Date(endDate).toLocaleDateString('vi-VN')}</p>
            <p>Ngày trích xuất: {new Date().toLocaleString('vi-VN')}</p>
          </div>
        </div>

        {/* Quick Stats Summary Area */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-5 bg-blue-50 border border-blue-100 rounded-[1.5rem]">
            <div className="flex items-center gap-3 text-blue-600 mb-2">
              <Calendar size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Tổng cuộc họp</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{reportStats.total}</p>
          </div>
          <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-[1.5rem]">
            <div className="flex items-center gap-3 text-emerald-600 mb-2">
              <CheckCircle size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Đã thực hiện</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{reportStats.scheduled}</p>
          </div>
          <div className="p-5 bg-amber-50 border border-amber-100 rounded-[1.5rem]">
            <div className="flex items-center gap-3 text-amber-600 mb-2">
              <AlertTriangle size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Tạm hoãn</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{reportStats.postponed}</p>
          </div>
          <div className="p-5 bg-red-50 border border-red-100 rounded-[1.5rem]">
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <Building2 size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Số đơn vị</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{reportStats.uniqueUnits}</p>
          </div>
        </div>

        {/* Thống kê Tổng hợp (Tuần, Tháng, Năm) */}
        <div className="bg-slate-900 p-8 rounded-[2rem] text-white">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-blue-400" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Thống kê theo chu kỳ (Toàn hệ thống)</h3>
          </div>
          <div className="grid grid-cols-3 gap-8">
            <div className="space-y-2">
               <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Cuộc họp Tuần này</p>
               <div className="flex items-baseline gap-2">
                 <span className="text-4xl font-black text-blue-400">{reportStats.currentWeekCount}</span>
                 <span className="text-[10px] font-bold text-white/20 uppercase">Hội nghị</span>
               </div>
            </div>
            <div className="space-y-2 border-l border-white/10 pl-8">
               <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Cuộc họp Tháng này</p>
               <div className="flex items-baseline gap-2">
                 <span className="text-4xl font-black text-emerald-400">{reportStats.currentMonthCount}</span>
                 <span className="text-[10px] font-bold text-white/20 uppercase">Hội nghị</span>
               </div>
            </div>
            <div className="space-y-2 border-l border-white/10 pl-8">
               <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Cuộc họp Năm nay</p>
               <div className="flex items-baseline gap-2">
                 <span className="text-4xl font-black text-amber-400">{reportStats.currentYearCount}</span>
                 <span className="text-[10px] font-bold text-white/20 uppercase">Hội nghị</span>
               </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-10">
          <div className="space-y-4">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
               <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
               Biểu đồ phân bổ cuộc họp ({groupBy === 'unit' ? 'Theo đơn vị' : 'Theo thời gian'})
             </h3>
             <div className="h-[350px] w-full bg-slate-50/30 p-6 rounded-[2rem] border border-slate-100">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={statsData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                   <XAxis 
                     dataKey="name" 
                     fontSize={9} 
                     fontWeight="bold" 
                     tick={{fill: '#64748B'}} 
                     interval={0}
                     angle={groupBy === 'unit' ? -15 : 0}
                     textAnchor={groupBy === 'unit' ? 'end' : 'middle'}
                   />
                   <YAxis fontSize={9} fontWeight="bold" tick={{fill: '#64748B'}} />
                   <Tooltip cursor={{fill: '#F1F5F9'}} />
                   <Bar dataKey="value" name="Số cuộc họp" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={groupBy === 'unit' ? 30 : 50}>
                     {statsData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                     <LabelList dataKey="value" position="top" style={{ fill: '#1E293B', fontSize: '11px', fontWeight: '900' }} />
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* Table Summary */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
            <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
            Bảng tổng hợp dữ liệu (Theo {groupBy})
          </h3>
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                <tr>
                  <th className="px-6 py-4">Tiêu chí phân nhóm</th>
                  <th className="px-6 py-4 text-center">Số lượng hội nghị</th>
                  <th className="px-6 py-4 text-right">Tỷ lệ đóng góp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statsData.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-700">{row.name}</td>
                    <td className="px-6 py-3.5 text-center font-black text-blue-600 text-base">{row.value}</td>
                    <td className="px-6 py-3.5 text-right font-bold text-slate-400">{((row.value / reportStats.total) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed List */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
            <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
            Thông tin chi tiết các cuộc họp
          </h3>
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 text-slate-500 text-[9px] uppercase font-black tracking-widest">
                <tr>
                  <th className="px-4 py-3"><div className="flex items-center gap-1"><FileText size={10} /> Tên hội nghị</div></th>
                  <th className="px-4 py-3"><div className="flex items-center gap-1"><Building2 size={10} /> Đơn vị chủ trì</div></th>
                  <th className="px-4 py-3"><div className="flex items-center gap-1"><Clock size={10} /> Thời gian</div></th>
                  <th className="px-4 py-3 text-center"><div className="flex justify-center items-center gap-1"><Hash size={10} /> Điểm cầu</div></th>
                  <th className="px-4 py-3 text-center"><div className="flex justify-center items-center gap-1"><Users size={10} /> Thành phần</div></th>
                  <th className="px-4 py-3 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredMeetings.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900 max-w-[200px] leading-tight">
                      <div className={m.status === 'CANCELLED' ? 'line-through opacity-50' : ''}>{m.title}</div>
                      {m.cancelReason && <div className="text-[9px] font-medium text-red-500 mt-1 italic">Lý do: {m.cancelReason}</div>}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-600">{m.hostUnit}</td>
                    <td className="px-4 py-3 text-slate-500 font-bold whitespace-nowrap">
                      {new Date(m.startTime).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md font-black">{m.endpoints.length}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md font-black">{m.participants.length}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {m.status === 'CANCELLED' ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[8px] font-black uppercase rounded">Đã huỷ</span>
                      ) : m.status === 'POSTPONED' ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[8px] font-black uppercase rounded">Hoãn</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[8px] font-black uppercase rounded">Hợp lệ</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Signature */}
        <div className="pt-20 flex justify-between border-t border-slate-100">
           <div className="max-w-xs space-y-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ghi chú hệ thống</p>
              <p className="text-[9px] italic text-slate-400 leading-relaxed font-medium">Báo cáo được khởi tạo tự động. Các dữ liệu về thời gian và đơn vị được ghi nhận tại thời điểm kết thúc hội nghị.</p>
           </div>
           <div className="text-center w-60 space-y-20">
              <div className="space-y-1">
                 <p className="font-black text-[10px] uppercase tracking-widest text-slate-900">Người lập báo cáo</p>
                 <p className="text-[9px] text-slate-400 font-bold">(Ký và ghi rõ họ tên)</p>
              </div>
              <p className="font-black text-xs uppercase text-slate-900 italic">
                 {currentUser?.fullName || 'Quản trị viên hệ thống'}
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
