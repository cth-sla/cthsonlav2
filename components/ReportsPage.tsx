
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
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [groupBy, setGroupBy] = useState<GroupByOption>('month');
  const [showChart, setShowChart] = useState(true);
  
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
    }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
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

    return Object.keys(groupMap).sort().map(key => ({
      name: key,
      value: groupMap[key]
    }));
  }, [filteredMeetings, groupBy]);

  const downloadPDF = () => {
    if (!reportRef.current) return;
    const opt = {
      margin: 10,
      filename: `Bao_cao_CTH_Son_La_${new Date().toISOString().slice(0,10)}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'landscape' as const }
    };
    html2pdf().from(reportRef.current).set(opt).save();
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Control Panel - No Print */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm no-print space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-gray-900 uppercase">Thống kê & Báo cáo</h2>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setQuickRange('7d')} className="px-4 py-2 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black transition-all">7 Ngày</button>
              <button onClick={() => setQuickRange('30d')} className="px-4 py-2 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black transition-all">30 Ngày</button>
              <button onClick={() => setQuickRange('thisMonth')} className="px-4 py-2 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black transition-all">Tháng này</button>
              <button onClick={() => setQuickRange('thisYear')} className="px-4 py-2 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black transition-all">Năm nay</button>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Từ ngày</label>
              <input type="date" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Đến ngày</label>
              <input type="date" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gom nhóm</label>
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
              className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Xuất Báo cáo (PDF)
            </button>
          </div>
        </div>
      </div>

      {/* Actual Report Document */}
      <div ref={reportRef} className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-12 space-y-12 bg-white">
        {/* Header Document */}
        <div className="border-b-4 border-slate-900 pb-10 flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">Báo cáo Hoạt động</h1>
            <h2 className="text-lg font-black text-blue-600 uppercase tracking-[0.2em]">Hệ thống Cầu truyền hình tỉnh Sơn La</h2>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian trích xuất: {new Date().toLocaleString('vi-VN')}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Giai đoạn báo cáo: {new Date(startDate).toLocaleDateString('vi-VN')} - {new Date(endDate).toLocaleDateString('vi-VN')}</p>
          </div>
        </div>

        {/* Visual Statistics */}
        {showChart && statsData.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
              <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
              Biểu đồ trực quan ({groupBy === 'unit' ? 'Theo đơn vị' : 'Theo thời gian'})
            </h3>
            <div className="h-[350px] bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                {groupBy === 'unit' ? (
                  <BarChart data={statsData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" fontSize={10} fontWeight="bold" tick={{fill: '#64748B'}} />
                    <YAxis fontSize={10} fontWeight="bold" tick={{fill: '#64748B'}} />
                    <Tooltip cursor={{fill: '#F1F5F9'}} />
                    <Bar dataKey="value" name="Số cuộc họp" fill="#3B82F6" radius={[8, 8, 0, 0]}>
                      {statsData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                ) : (
                  <AreaChart data={statsData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" fontSize={10} fontWeight="bold" tick={{fill: '#64748B'}} />
                    <YAxis fontSize={10} fontWeight="bold" tick={{fill: '#64748B'}} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" name="Số cuộc họp" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} strokeWidth={4} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Summary Table */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
            <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
            Bảng tổng hợp số liệu
          </h3>
          <div className="overflow-hidden border border-slate-100 rounded-[2rem]">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-white uppercase font-black text-[10px] tracking-widest">
                <tr>
                  <th className="px-8 py-5">Tiêu chí gom nhóm</th>
                  <th className="px-8 py-5 text-center">Số lượng cuộc họp</th>
                  <th className="px-8 py-5 text-right">Tỷ lệ đóng góp (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statsData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-4 font-bold text-slate-700 uppercase">{row.name}</td>
                    <td className="px-8 py-4 text-center font-black text-blue-600 text-lg">{row.value}</td>
                    <td className="px-8 py-4 text-right font-black text-slate-500">{((row.value / (filteredMeetings.length || 1)) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
                <tr className="bg-slate-50">
                  <td className="px-8 py-5 font-black text-slate-900 uppercase">Tổng cộng</td>
                  <td className="px-8 py-5 text-center font-black text-slate-900 text-xl">{filteredMeetings.length}</td>
                  <td className="px-8 py-5 text-right font-black text-slate-900">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Meetings List */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
            <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
            Danh sách chi tiết các cuộc họp
          </h3>
          <div className="overflow-hidden border border-slate-100 rounded-[2rem]">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-100 text-slate-500 uppercase font-black tracking-widest">
                <tr>
                  <th className="px-6 py-4">Tên cuộc họp</th>
                  <th className="px-6 py-4">Đơn vị chủ trì</th>
                  <th className="px-6 py-4">Người chủ trì</th>
                  <th className="px-6 py-4">Thời gian</th>
                  <th className="px-6 py-4 text-center">Số điểm cầu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMeetings.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 max-w-[250px] leading-relaxed uppercase">{m.title}</td>
                    <td className="px-6 py-4 font-medium text-slate-600 uppercase">{m.hostUnit}</td>
                    <td className="px-6 py-4 font-medium text-slate-600 uppercase">{m.chairPerson}</td>
                    <td className="px-6 py-4 text-slate-500 font-bold">
                      {new Date(m.startTime).toLocaleString('vi-VN', { 
                        day: '2-digit', month: '2-digit', year: 'numeric', 
                        hour: '2-digit', minute: '2-digit' 
                      })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md font-black">
                        {m.endpoints.length}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredMeetings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold uppercase italic">Không có dữ liệu trong khoảng thời gian này</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Signature */}
        <div className="pt-24 flex justify-between border-t border-slate-100">
           <div className="max-w-md space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ghi chú hệ thống:</p>
              <p className="text-[10px] italic text-slate-400 leading-relaxed font-medium">
                Báo cáo này được tạo tự động từ Hệ thống Giám sát SLA Cầu truyền hình tỉnh Sơn La. Dữ liệu bao gồm các thông tin về lịch họp, đơn vị chủ trì và danh sách điểm cầu tham gia.
              </p>
           </div>
           <div className="text-center w-64 space-y-24">
              <div className="space-y-1">
                 <p className="font-black text-[11px] uppercase tracking-widest text-slate-900">NGƯỜI LẬP BÁO CÁO</p>
                 <p className="text-[10px] text-slate-400 font-bold">(Ký và ghi rõ họ tên)</p>
              </div>
              <div>
                 <p className="font-black text-sm uppercase text-slate-900 italic">Hệ thống SLA v3.1</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
