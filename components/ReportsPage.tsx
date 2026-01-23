
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
          key = `W${getWeekNumber(d)}/${d.getFullYear()}`;
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

    return Object.keys(groupMap).sort().map(key => ({
      name: key,
      value: groupMap[key]
    }));
  }, [filteredMeetings, groupBy]);

  const downloadPDF = () => {
    if (!reportRef.current) return;
    // Fix: Explicitly cast literal types to avoid 'string' inference error
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
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm no-print space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-gray-900 uppercase">Thống kê & Báo cáo</h2>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setQuickRange('7d')} className="px-4 py-2 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black transition-all">7 Ngày</button>
              <button onClick={() => setQuickRange('30d')} className="px-4 py-2 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black transition-all">30 Ngày</button>
              <button onClick={() => setQuickRange('thisMonth')} className="px-4 py-2 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black transition-all">Tháng này</button>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-5">
            <input type="date" className="px-4 py-2 border rounded-xl" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <input type="date" className="px-4 py-2 border rounded-xl" value={endDate} onChange={e => setEndDate(e.target.value)} />
            <select className="px-4 py-2 border rounded-xl" value={groupBy} onChange={e => setGroupBy(e.target.value as any)}>
              <option value="day">Theo Ngày</option>
              <option value="week">Theo Tuần</option>
              <option value="month">Theo Tháng</option>
              <option value="year">Theo Năm</option>
              <option value="unit">Đơn vị chủ trì</option>
            </select>
            <button onClick={downloadPDF} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest">Xuất PDF</button>
          </div>
        </div>
      </div>

      <div ref={reportRef} className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-12 space-y-12">
        <div className="border-b-2 border-gray-900 pb-8 flex justify-between items-start">
          <h1 className="text-4xl font-black uppercase">BÁO CÁO THỐNG KÊ HOẠT ĐỘNG</h1>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-400">Giai đoạn: {startDate} - {endDate}</p>
            <p className="text-xs font-bold text-gray-400">Ngày in: {new Date().toLocaleDateString('vi-VN')}</p>
          </div>
        </div>

        {showChart && statsData.length > 0 && (
          <div className="h-[400px] bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100">
            <ResponsiveContainer width="100%" height="100%">
              {groupBy === 'unit' ? (
                <BarChart data={statsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" radius={[10, 10, 0, 0]}>
                    {statsData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              ) : (
                <AreaChart data={statsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} strokeWidth={4} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        <div className="overflow-hidden border rounded-3xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-white uppercase font-black text-xs">
              <tr>
                <th className="px-8 py-6">Phân loại</th>
                <th className="px-8 py-6 text-center">Số lượng cuộc họp</th>
                <th className="px-8 py-6 text-right">Tỷ lệ (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {statsData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-8 py-5 font-bold uppercase">{row.name}</td>
                  <td className="px-8 py-5 text-center font-black text-blue-600">{row.value}</td>
                  <td className="px-8 py-5 text-right font-bold">{((row.value / (filteredMeetings.length || 1)) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-24 flex justify-between border-t border-gray-100 text-xs">
           <div className="max-w-md italic text-gray-400">
              Báo cáo điện tử trích xuất từ Hệ thống Quản lý Cầu truyền hình tỉnh Sơn La.
           </div>
           <div className="text-center w-64">
              <p className="font-black uppercase mb-24 tracking-widest">CÁN BỘ LẬP BÁO CÁO</p>
              <p className="font-black uppercase italic">Hệ thống CTH v3.1</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
