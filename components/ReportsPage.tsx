
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';
import { Meeting, Endpoint, EndpointStatus, SavedReportConfig } from '../types';
import { storageService } from '../services/storageService';
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
  const [savedConfigs, setSavedConfigs] = useState<SavedReportConfig[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [showTemplateSave, setShowTemplateSave] = useState(false);
  const [showChart, setShowChart] = useState(true);
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSavedConfigs(storageService.getSavedReports());
  }, []);

  useEffect(() => {
    setSelectedColumns(ALL_COLUMNS[reportType]);
    setGeneratedData([]); 
  }, [reportType]);

  const summaryStats = useMemo(() => {
    if (generatedData.length === 0 || reportType !== 'meetings') return null;

    const unitMap: Record<string, number> = {};
    const weekMap: Record<string, number> = {};
    const monthMap: Record<string, number> = {};

    generatedData.forEach(row => {
      unitMap[row['Đơn vị chủ trì']] = (unitMap[row['Đơn vị chủ trì']] || 0) + 1;
      
      // Parse date to group
      const d = new Date(row['Bắt đầu'].split(' ')[0].split('/').reverse().join('-'));
      const monthLabel = `Tháng ${d.getMonth() + 1}`;
      monthMap[monthLabel] = (monthMap[monthLabel] || 0) + 1;
      
      // Basic week calculation (ISO-ish)
      const oneJan = new Date(d.getFullYear(), 0, 1);
      const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
      const weekLabel = `Tuần ${Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7)}`;
      weekMap[weekLabel] = (weekMap[weekLabel] || 0) + 1;
    });

    return {
      topUnit: Object.entries(unitMap).sort((a,b) => b[1] - a[1])[0] || ['N/A', 0],
      totalMeetings: generatedData.length,
      avgEndpoints: (generatedData.reduce((acc, curr) => acc + (curr['Số điểm cầu'] || 0), 0) / generatedData.length).toFixed(1)
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
        value: row['Số lượng cuộc họp']
      }));
    } else if (reportType === 'endpoints') {
      const counts: Record<string, number> = {};
      generatedData.forEach(row => {
        const status = row['Trạng thái'];
        counts[status] = (counts[status] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
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

  const handlePreview = () => {
    const sampleRows = [];
    for (let i = 1; i <= 3; i++) {
      const row: any = {};
      if (reportType === 'meetings') {
        row['ID'] = `MEET-SAMPLE-00${i}`;
        row['Tên cuộc họp'] = `Cuộc họp mẫu số ${i}`;
        row['Đơn vị chủ trì'] = `Đơn vị mẫu ${i}`;
        row['Chủ trì'] = `Cán bộ mẫu ${i}`;
        row['Bắt đầu'] = new Date().toLocaleString('vi-VN');
        row['Kết thúc'] = new Date().toLocaleString('vi-VN');
        row['Số điểm cầu'] = Math.floor(Math.random() * 10) + 1;
      } else if (reportType === 'endpoints') {
        row['Tên điểm cầu'] = `Điểm cầu mẫu ${i}`;
        row['Vị trí'] = `Khu vực mẫu ${i}`;
        row['Trạng thái'] = i % 2 === 0 ? 'Kết nối' : 'Mất kết nối';
        row['Lần cuối kết nối'] = '2024-05-20 08:00';
      } else if (reportType === 'units') {
        row['Đơn vị'] = `Đơn vị mẫu ${i}`;
        row['Số lượng cuộc họp'] = Math.floor(Math.random() * 50) + 5;
        row['Tỷ lệ (%)'] = (Math.random() * 100).toFixed(1);
      }
      sampleRows.push(row);
    }
    setPreviewData(sampleRows);
    setIsPreviewOpen(true);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setIsPreviewOpen(false);
    
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
    }, 800);
  };

  const handleSaveConfig = () => {
    if (!templateName.trim()) {
      alert('Vui lòng nhập tên mẫu báo cáo.');
      return;
    }
    const newConfig: SavedReportConfig = {
      id: Date.now().toString(),
      name: templateName,
      type: reportType,
      startDate,
      endDate,
      selectedColumns
    };
    const updated = [newConfig, ...savedConfigs];
    setSavedConfigs(updated);
    storageService.saveSavedReports(updated);
    setTemplateName('');
    setShowTemplateSave(false);
  };

  const handleApplyConfig = (config: SavedReportConfig) => {
    setReportType(config.type);
    setDateMode('custom');
    setStartDate(config.startDate);
    setEndDate(config.endDate);
    setSelectedColumns(config.selectedColumns);
    setTimeout(() => handleGenerate(), 100);
  };

  const handleDeleteConfig = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc muốn xóa mẫu báo cáo này?')) {
      const updated = savedConfigs.filter(c => c.id !== id);
      setSavedConfigs(updated);
      storageService.saveSavedReports(updated);
    }
  };

  const downloadCSV = () => {
    if (generatedData.length === 0) return;
    const headers = selectedColumns;
    const csvRows = [
      headers.join(','),
      ...generatedData.map(row => 
        headers.map(fieldName => JSON.stringify(row[fieldName], (key, value) => value === null ? '' : value)).join(',')
      )
    ];
    const csvContent = "\ufeff" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_cao_${reportType}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    if (!reportRef.current || generatedData.length === 0) return;
    // Fix: Explicitly cast literal values to prevent TS from inferring them as general 'string'
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
    meetings: 'Báo cáo Chi tiết Cuộc họp',
    endpoints: 'Báo cáo Trạng thái Điểm cầu',
    units: 'Báo cáo Hiệu suất theo Đơn vị'
  };

  const { start: calculatedStart, end: calculatedEnd } = calculateDates();

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
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Phạm vi thời gian</label>
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
            <button onClick={handlePreview} className="px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              Xem trước
            </button>
            <button onClick={handleGenerate} disabled={isGenerating} className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {isGenerating ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
              Tạo báo cáo
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 space-y-3">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Cấu hình cột hiển thị</label>
          <div className="flex flex-wrap gap-4">
            {ALL_COLUMNS[reportType].map(col => (
              <label key={col} className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" checked={selectedColumns.includes(col)} onChange={() => setSelectedColumns(selectedColumns.includes(col) ? selectedColumns.filter(c => c !== col) : [...selectedColumns, col])} />
                <span className={`text-xs font-bold ${selectedColumns.includes(col) ? 'text-gray-800' : 'text-gray-400'}`}>{col}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {generatedData.length > 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
          <div className="flex justify-between items-center no-print px-1">
             <div className="flex gap-2">
                <button onClick={() => setShowChart(!showChart)} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest border transition-all ${showChart ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>
                  {showChart ? 'Ẩn Biểu đồ' : 'Xem Biểu đồ'}
                </button>
             </div>
             <div className="flex gap-3">
                <button onClick={downloadCSV} className="px-4 py-2 bg-white border rounded-lg text-xs font-black uppercase text-gray-600 hover:text-blue-600 transition-colors">Xuất .CSV</button>
                <button onClick={downloadPDF} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-black uppercase shadow-md hover:bg-blue-700">Xuất PDF</button>
             </div>
          </div>

          <div ref={reportRef} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10 space-y-10">
            {/* Report Identity */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-10">
               <div>
                  <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{reportTitleMap[reportType]}</h1>
                  <p className="text-sm text-gray-500 font-bold mt-2 uppercase tracking-widest">Hệ thống Giám sát Cầu truyền hình SLA</p>
               </div>
               <div className="text-right">
                  <div className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Thời gian trích xuất</div>
                  <div className="text-sm font-black text-gray-900">{new Date().toLocaleString('vi-VN')}</div>
               </div>
            </div>

            {/* Quick Summary Section - NEW */}
            {summaryStats && reportType === 'meetings' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Tổng cuộc họp trong kỳ</p>
                    <div className="text-3xl font-black text-blue-700">{summaryStats.totalMeetings}</div>
                 </div>
                 <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100/50">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Đơn vị tích cực nhất</p>
                    <div className="text-xl font-black text-emerald-700 truncate">{summaryStats.topUnit[0]}</div>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase">{summaryStats.topUnit[1]} cuộc họp</p>
                 </div>
                 <div className="p-6 bg-amber-50/50 rounded-3xl border border-amber-100/50">
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Tỉ lệ EP trung bình</p>
                    <div className="text-3xl font-black text-amber-700">{summaryStats.avgEndpoints} <span className="text-xs font-bold uppercase">EPs/Họp</span></div>
                 </div>
              </div>
            )}

            {showChart && chartData.length > 0 && (
              <div className="bg-gray-50/30 rounded-3xl p-8 border border-gray-100">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8 text-center">Phân tích Phổ dữ liệu</h4>
                <div className="h-[350px] w-full">
                  {reportType === 'endpoints' ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                          {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.name === 'Kết nối' ? '#10B981' : '#EF4444'} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 'bold' }} angle={-30} textAnchor="end" interval={0} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                        <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '20px', border: 'none' }} />
                        <Bar dataKey="value" fill="#3B82F6" radius={[10, 10, 0, 0]} barSize={45}>
                          {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
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
              <div className="max-w-[200px] italic">Báo cáo được tạo tự động bởi hệ thống CTH-SLA Platform Version 3.1.0</div>
              <div className="text-center w-48">
                 Cán bộ phụ trách<br/><br/><br/><br/>
                 <div className="w-full h-px bg-gray-200 mb-2"></div>
                 (Ký và ghi rõ họ tên)
              </div>
            </div>
          </div>
        </div>
      )}

      {generatedData.length === 0 && !isGenerating && (
        <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <p className="text-lg font-black text-gray-300 uppercase tracking-widest">Chưa có dữ liệu trích xuất</p>
          <p className="text-sm text-gray-400 mt-2 font-medium">Vui lòng chọn các tham số và nhấn "Tạo báo cáo"</p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
