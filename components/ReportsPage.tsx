
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import { Meeting, Endpoint, EndpointStatus } from '../types';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface ReportsPageProps {
  meetings: Meeting[];
  endpoints: Endpoint[];
}

type ReportType = 'meetings' | 'endpoints' | 'units';
type DateMode = 'custom' | 'month' | 'week';

const ALL_COLUMNS: Record<ReportType, string[]> = {
  meetings: ['ID', 'Tên cuộc họp', 'Đơn vị chủ trì', 'Chủ trì', 'Bắt đầu', 'Kết thúc', 'Số điểm cầu'],
  endpoints: ['Tên điểm cầu', 'Vị trí', 'Trạng thái', 'Lần cuối kết nối'],
  units: ['Đơn vị', 'Số lượng cuộc họp', 'Tỷ lệ (%)']
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

const ReportsPage: React.FC<ReportsPageProps> = ({ meetings, endpoints }) => {
  const [reportType, setReportType] = useState<ReportType>('meetings');
  const [dateMode, setDateMode] = useState<DateMode>('custom');
  
  const [startDate, setStartDate] = useState<string>('2024-01-01');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [selectedWeek, setSelectedWeek] = useState<string>('');

  const [selectedColumns, setSelectedColumns] = useState<string[]>(ALL_COLUMNS['meetings']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [showChart, setShowChart] = useState(true);
  
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedColumns(ALL_COLUMNS[reportType]);
    setGeneratedData([]); 
  }, [reportType]);

  const statsSummary = useMemo(() => {
    if (generatedData.length === 0 || reportType !== 'meetings') return null;

    const unitMap: Record<string, number> = {};
    const weekMap: Record<string, number> = {};
    const monthMap: Record<string, number> = {};
    const yearMap: Record<string, number> = {};

    generatedData.forEach(row => {
      const unit = row['Đơn vị chủ trì'];
      unitMap[unit] = (unitMap[unit] || 0) + 1;
      
      const dateStr = row['Bắt đầu'];
      // Xử lý các định dạng ngày khác nhau có thể trả về từ toLocaleString
      const dateOnly = dateStr.split(',')[0].split(' ')[0];
      const dateParts = dateOnly.split('/');
      
      let d: Date;
      if (dateParts.length === 3) {
        // Định dạng DD/MM/YYYY
        d = new Date(Number(dateParts[2]), Number(dateParts[1]) - 1, Number(dateParts[0]));
      } else {
        d = new Date(dateStr);
      }

      if (isNaN(d.getTime())) return;

      const yearLabel = `${d.getFullYear()}`;
      yearMap[yearLabel] = (yearMap[yearLabel] || 0) + 1;

      const monthLabel = `T${d.getMonth() + 1}/${d.getFullYear()}`;
      monthMap[monthLabel] = (monthMap[monthLabel] || 0) + 1;

      const oneJan = new Date(d.getFullYear(), 0, 1);
      const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
      const weekLabel = `W${Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7)}/${d.getFullYear()}`;
      weekMap[weekLabel] = (weekMap[weekLabel] || 0) + 1;
    });

    return {
      topUnit: Object.entries(unitMap).sort((a,b) => b[1] - a[1])[0] || ['N/A', 0],
      total: generatedData.length,
      weeks: Object.keys(weekMap).length,
      months: Object.keys(monthMap).length,
      years: Object.keys(yearMap).length
    };
  }, [generatedData, reportType]);

  const chartData = useMemo(() => {
    if (generatedData.length === 0) return [];
    if (reportType === 'meetings') {
      const counts: Record<string, number> = {};
      generatedData.forEach(row => {
        const unit = row['Đơn vị chủ trì'];
        counts[unit] = (counts[unit] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    } else if (reportType === 'units') {
      return generatedData.map(row => ({
        name: row['Đơn vị'],
        value: Number(row['Số lượng cuộc họp'])
      }));
    }
    return [];
  }, [generatedData, reportType]);

  const calculateDates = () => {
    let finalStart = startDate;
    let finalEnd = endDate;

    if (dateMode === 'month') {
      const [year, month] = selectedMonth.split('-').map(Number);
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      finalStart = firstDay.toISOString().split('T')[0];
      finalEnd = lastDay.toISOString().split('T')[0];
    } else if (dateMode === 'week' && selectedWeek) {
      const [year, weekNum] = selectedWeek.split('-W').map(Number);
      const simple = new Date(year, 0, 1 + (weekNum - 1) * 7);
      const dow = simple.getDay();
      const isoWeekStart = new Date(simple);
      if (dow <= 4) isoWeekStart.setDate(simple.getDate() - simple.getDay() + 1);
      else isoWeekStart.setDate(simple.getDate() + 8 - simple.getDay());
      const isoWeekEnd = new Date(isoWeekStart);
      isoWeekEnd.setDate(isoWeekStart.getDate() + 6);
      finalStart = isoWeekStart.toISOString().split('T')[0];
      finalEnd = isoWeekEnd.toISOString().split('T')[0];
    }
    return { start: finalStart, end: finalEnd };
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    const { start: calcStart, end: calcEnd } = calculateDates();
    const startTs = new Date(calcStart).setHours(0,0,0,0);
    const endTs = new Date(calcEnd).setHours(23,59,59,999);

    setTimeout(() => {
      let data: any[] = [];
      if (reportType === 'meetings') {
        data = meetings
          .filter(m => {
            const mTime = new Date(m.startTime).getTime();
            return mTime >= startTs && mTime <= endTs;
          })
          .map(m => ({
            'ID': m.id,
            'Tên cuộc họp': m.title,
            'Đơn vị chủ trì': m.hostUnit,
            'Chủ trì': m.chairPerson,
            'Bắt đầu': new Date(m.startTime).toLocaleString('vi-VN'),
            'Kết thúc': new Date(m.endTime).toLocaleString('vi-VN'),
            'Số điểm cầu': m.endpoints.length
          }));
      } else if (reportType === 'endpoints') {
        data = endpoints.map(e => ({
          'Tên điểm cầu': e.name,
          'Vị trí': e.location,
          'Trạng thái': e.status === EndpointStatus.CONNECTED ? 'Kết nối' : 'Mất kết nối',
          'Lần cuối kết nối': e.lastConnected
        }));
      } else if (reportType === 'units') {
        const unitStats: Record<string, number> = {};
        let totalCount = 0;
        meetings.forEach(m => {
          const mTime = new Date(m.startTime).getTime();
          if (mTime >= startTs && mTime <= endTs) {
            unitStats[m.hostUnit] = (unitStats[m.hostUnit] || 0) + 1;
            totalCount++;
          }
        });
        data = Object.entries(unitStats).map(([unit, count]) => ({
          'Đơn vị': unit,
          'Số lượng cuộc họp': count,
          'Tỷ lệ (%)': totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0.0'
        }));
      }
      setGeneratedData(data);
      setIsGenerating(false);
    }, 600);
  };

  const downloadPDF = () => {
    if (!reportRef.current || generatedData.length === 0) return;
    const opt = {
      margin: 10,
      filename: `Bao_cao_${reportType}_${new Date().toISOString().slice(0,10)}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'landscape' as const }
    };
    html2pdf().from(reportRef.current).set(opt).save();
  };

  const reportTitleMap = {
    meetings: 'Thống kê Chi tiết Cuộc họp',
    endpoints: 'Trạng thái Điểm cầu Hệ thống',
    units: 'Thống kê Hiệu suất Đơn vị'
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm no-print space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 items-end">
          <div className="space-y-2 lg:col-span-1">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Loại báo cáo</label>
            <select 
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
            >
              <option value="meetings">Thống kê Cuộc họp</option>
              <option value="endpoints">Trạng thái Điểm cầu</option>
              <option value="units">Hiệu suất theo Đơn vị</option>
            </select>
          </div>

          <div className="space-y-2 lg:col-span-1">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Thời gian trích xuất</label>
            <select 
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
              value={dateMode}
              onChange={(e) => setDateMode(e.target.value as DateMode)}
            >
              <option value="custom">Khoảng ngày</option>
              <option value="month">Theo Tháng</option>
              <option value="week">Theo Tuần</option>
            </select>
          </div>
          
          <div className="lg:col-span-2 flex gap-4">
            {dateMode === 'custom' && (
              <>
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Từ ngày</label>
                  <input type="date" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Đến ngày</label>
                  <input type="date" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </>
            )}
            {dateMode === 'month' && (
              <div className="flex-1 space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Chọn tháng</label>
                <input type="month" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
              </div>
            )}
            {dateMode === 'week' && (
              <div className="flex-1 space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Chọn tuần</label>
                <input type="week" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} />
              </div>
            )}
          </div>

          <div className="flex gap-2 lg:col-span-2">
            <button onClick={handleGenerate} disabled={isGenerating} className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {isGenerating ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
              Trích xuất dữ liệu
            </button>
          </div>
        </div>
      </div>

      {generatedData.length > 0 && (
        <div className="space-y-6 pb-20 animate-in fade-in duration-700">
          <div className="flex justify-end gap-3 no-print">
            <button onClick={() => setShowChart(!showChart)} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest border transition-all ${showChart ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>
              {showChart ? 'Ẩn biểu đồ' : 'Hiện biểu đồ'}
            </button>
            <button onClick={downloadPDF} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-black uppercase shadow-md hover:bg-blue-700">Xuất Báo cáo PDF</button>
          </div>

          <div ref={reportRef} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10 space-y-10">
            <div className="flex justify-between items-start border-b border-gray-100 pb-10">
               <div>
                  <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{reportTitleMap[reportType]}</h1>
                  <p className="text-sm text-gray-500 font-bold mt-2 uppercase tracking-widest">Hệ thống Giám sát Cầu truyền hình SLA</p>
                  <p className="text-[10px] font-black text-blue-600 uppercase mt-4 tracking-widest">Phạm vi: {calculateDates().start} → {calculateDates().end}</p>
               </div>
               <div className="text-right">
                  <div className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Thời gian trích xuất</div>
                  <div className="text-sm font-black text-gray-900">{new Date().toLocaleString('vi-VN')}</div>
               </div>
            </div>

            {statsSummary && reportType === 'meetings' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50 shadow-sm">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Tổng số cuộc họp</p>
                    <div className="text-3xl font-black text-blue-700">{statsSummary.total}</div>
                    <p className="text-[9px] text-blue-500 font-bold mt-1 uppercase">Dữ liệu trích xuất từ {statsSummary.years} năm</p>
                 </div>
                 <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100/50 shadow-sm">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Đơn vị tích cực nhất</p>
                    <div className="text-lg font-black text-emerald-700 truncate">{statsSummary.topUnit[0]}</div>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase">{statsSummary.topUnit[1]} cuộc họp đã tổ chức</p>
                 </div>
                 <div className="p-6 bg-amber-50/50 rounded-3xl border border-amber-100/50 shadow-sm">
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Số tháng thống kê</p>
                    <div className="text-3xl font-black text-amber-700">{statsSummary.months} <span className="text-xs uppercase">Tháng</span></div>
                 </div>
                 <div className="p-6 bg-purple-50/50 rounded-3xl border border-purple-100/50 shadow-sm">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Số tuần thống kê</p>
                    <div className="text-3xl font-black text-purple-700">{statsSummary.weeks} <span className="text-xs uppercase">Tuần</span></div>
                 </div>
              </div>
            )}

            {showChart && chartData.length > 0 && (
              <div className="bg-gray-50/30 rounded-3xl p-8 border border-gray-100">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8 text-center">Phân bổ Số lượng cuộc họp theo Đơn vị</h4>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280', fontWeight: 'bold' }} angle={-45} textAnchor="end" interval={0} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                      <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '20px', border: 'none' }} />
                      <Bar dataKey="value" fill="#3B82F6" radius={[10, 10, 0, 0]} barSize={40}>
                        {chartData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-900 text-white font-black uppercase tracking-widest">
                  <tr>
                    {selectedColumns.map(header => (
                      <th key={header} className="px-5 py-5 first:rounded-tl-2xl last:rounded-tr-2xl">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 border-x border-b border-gray-100 rounded-b-2xl overflow-hidden">
                  {generatedData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                      {selectedColumns.map((col, vIdx) => (
                        <td key={vIdx} className="px-5 py-5 text-gray-700 font-bold">{row[col]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-20 flex justify-between items-start text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">
              <div className="max-w-[200px] italic">Báo cáo được trích xuất tự động và có giá trị nội bộ • v3.1.0</div>
              <div className="text-center w-48">
                 Cán bộ phụ trách<br/><br/><br/><br/>
                 <div className="w-full h-px bg-gray-200 mb-2"></div>
                 (Ký và ghi rõ họ tên)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
