
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
  
  // Date states
  const [startDate, setStartDate] = useState<string>('2024-01-01');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [selectedWeek, setSelectedWeek] = useState<string>(''); // Format: YYYY-Www

  const [selectedColumns, setSelectedColumns] = useState<string[]>(ALL_COLUMNS['meetings']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [savedConfigs, setSavedConfigs] = useState<SavedReportConfig[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [showTemplateSave, setShowTemplateSave] = useState(false);
  const [showChart, setShowChart] = useState(true);
  
  // Preview State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  
  const reportRef = useRef<HTMLDivElement>(null);

  // Load saved configs on mount
  useEffect(() => {
    setSavedConfigs(storageService.getSavedReports());
  }, []);

  // Update selected columns when report type changes
  useEffect(() => {
    setSelectedColumns(ALL_COLUMNS[reportType]);
    setGeneratedData([]); 
  }, [reportType]);

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
      // selectedWeek is "2024-W12"
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
    setTimeout(() => {
      handleGenerate();
    }, 100);
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
    const opt = {
      margin: 10,
      filename: `Bao_cao_${reportType}_${new Date().toISOString().slice(0,10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
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
      {/* Templates Section */}
      {savedConfigs.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm no-print">
          <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
            Mẫu báo cáo đã lưu
          </h4>
          <div className="flex flex-wrap gap-3">
            {savedConfigs.map(config => (
              <div 
                key={config.id}
                onClick={() => handleApplyConfig(config)}
                className="group flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-sm"
              >
                <span className="text-xs font-bold">{config.name}</span>
                <button 
                  onClick={(e) => handleDeleteConfig(config.id, e)}
                  className="p-1 hover:bg-white/20 rounded-md transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Config Panel */}
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
                  <input 
                    type="date"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Đến ngày</label>
                  <input 
                    type="date"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            {dateMode === 'month' && (
              <div className="flex-1 space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Chọn tháng</label>
                <input 
                  type="month"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>
            )}

            {dateMode === 'week' && (
              <div className="flex-1 space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Chọn tuần</label>
                <input 
                  type="week"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 lg:col-span-2">
            <button 
              onClick={handlePreview}
              className="px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              Xem trước
            </button>
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              )}
              Tạo báo cáo
            </button>
            <button 
              onClick={() => setShowTemplateSave(!showTemplateSave)}
              className="px-4 py-2.5 bg-white border border-gray-200 text-gray-400 hover:text-blue-600 rounded-xl hover:bg-gray-50 transition-all"
              title="Lưu mẫu cấu hình"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            </button>
          </div>
        </div>

        {/* Column Selection */}
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Cấu hình cột hiển thị</label>
          <div className="flex flex-wrap gap-4">
            {ALL_COLUMNS[reportType].map(col => (
              <label key={col} className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                  selectedColumns.includes(col) ? 'bg-blue-600 border-blue-600' : 'bg-gray-100 border-gray-200 group-hover:border-blue-300'
                }`}>
                  <input 
                    type="checkbox" 
                    className="hidden"
                    checked={selectedColumns.includes(col)}
                    onChange={() => {
                      if (selectedColumns.includes(col)) {
                        setSelectedColumns(selectedColumns.filter(c => c !== col));
                      } else {
                        setSelectedColumns([...selectedColumns, col]);
                      }
                    }}
                  />
                  {selectedColumns.includes(col) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                  )}
                </div>
                <span className={`text-xs font-bold ${selectedColumns.includes(col) ? 'text-gray-800' : 'text-gray-400'}`}>{col}</span>
              </label>
            ))}
          </div>
        </div>

        {showTemplateSave && (
          <div className="pt-4 border-t border-gray-100 animate-in slide-in-from-top duration-300">
            <div className="flex gap-4 items-end max-w-md">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Tên mẫu báo cáo</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                  placeholder="Ví dụ: Báo cáo kỹ thuật quý 1..."
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              <button 
                onClick={handleSaveConfig}
                className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100 active:scale-95"
              >
                Lưu mẫu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Xem trước Cấu trúc Báo cáo</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Dữ liệu hiển thị bên dưới là dữ liệu mẫu</p>
                </div>
              </div>
              <button onClick={() => setIsPreviewOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-8">
              <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/50 text-gray-400 font-bold uppercase tracking-wider">
                    <tr>
                      {selectedColumns.map(header => (
                        <th key={header} className="px-4 py-4 border-b border-gray-100">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 italic">
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="bg-white">
                        {selectedColumns.map((col, vIdx) => (
                          <td key={vIdx} className="px-4 py-4 text-gray-400 font-medium">{row[col]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50"
              >
                Đóng
              </button>
              <button 
                onClick={handleGenerate}
                className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
              >
                Tạo báo cáo chính thức
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Panel */}
      {generatedData.length > 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
          <div className="flex justify-between items-center no-print px-1">
            <button 
              onClick={() => setShowChart(!showChart)}
              className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg border transition-all ${
                showChart ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              {showChart ? 'Ẩn Biểu đồ' : 'Xem Biểu đồ'}
            </button>
            <div className="flex items-center gap-4">
              <button 
                onClick={downloadCSV}
                className="flex items-center gap-2 text-xs font-black text-slate-600 uppercase tracking-widest hover:text-blue-600 transition-colors bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Xuất .CSV
              </button>
              <button 
                onClick={downloadPDF}
                className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-widest hover:bg-blue-700 transition-colors bg-blue-600 px-4 py-2 rounded-lg shadow-md active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                Xuất PDF
              </button>
            </div>
          </div>

          <div ref={reportRef} className="space-y-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            {/* Report Header for PDF */}
            <div className="text-center border-b border-gray-100 pb-6">
              <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{reportTitleMap[reportType]}</h1>
              <div className="mt-2 text-sm text-gray-500 font-medium">
                {dateMode === 'custom' ? (
                  <>Khoảng thời gian: <span className="text-gray-900">{new Date(calculatedStart).toLocaleDateString('vi-VN')}</span> - <span className="text-gray-900">{new Date(calculatedEnd).toLocaleDateString('vi-VN')}</span></>
                ) : dateMode === 'month' ? (
                  <>Tháng báo cáo: <span className="text-gray-900 font-bold">{selectedMonth}</span></>
                ) : (
                  <>Tuần báo cáo: <span className="text-gray-900 font-bold">{selectedWeek}</span></>
                )}
              </div>
              <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">Ngày trích xuất: {new Date().toLocaleString('vi-VN')}</div>
            </div>

            {/* Visual Analytics Section */}
            {showChart && chartData.length > 0 && (
              <div className="grid grid-cols-1 gap-6 pt-4">
                <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 text-center">Biểu đồ Phân tích Dữ liệu</h4>
                  <div className="h-[300px] w-full">
                    {reportType === 'endpoints' ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={chartData} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={70} 
                            outerRadius={100} 
                            paddingAngle={8} 
                            dataKey="value"
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.name === 'Kết nối' ? '#10B981' : '#EF4444'} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 'bold' }} 
                            angle={-45} 
                            textAnchor="end"
                            interval={0}
                          />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                          <Tooltip 
                            cursor={{ fill: '#F3F4F6' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                          />
                          <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={40}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-gray-50 text-gray-500 font-black uppercase tracking-widest">
                  <tr>
                    {selectedColumns.map(header => (
                      <th key={header} className="px-4 py-4 border-b border-gray-100">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {generatedData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/20 transition-colors">
                      {selectedColumns.map((col, vIdx) => (
                        <td key={vIdx} className="px-4 py-4 text-gray-700 font-semibold">{row[col]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-12 flex justify-between items-start text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              <div>Hệ thống E-Meeting SLA</div>
              <div className="text-right">Người lập biểu<br/><br/><br/><br/>...................................</div>
            </div>
          </div>
        </div>
      )}

      {generatedData.length === 0 && !isGenerating && (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-gray-100 border-dashed">
          <div className="p-6 bg-gray-50 rounded-full mb-6">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <p className="text-base font-bold text-gray-400">Chưa có dữ liệu báo cáo</p>
          <p className="text-sm text-gray-300 mt-1">Chọn cấu hình và nhấn nút để trích xuất dữ liệu thống kê.</p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
