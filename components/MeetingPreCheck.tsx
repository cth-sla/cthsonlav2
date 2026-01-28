
import React, { useState, useMemo } from 'react';
import { Meeting, EndpointStatus } from '../types';
import { CheckCircle2, Circle, ClipboardList, Search, AlertCircle, Save, FileSpreadsheet } from 'lucide-react';

interface MeetingPreCheckProps {
  meeting: Meeting;
  onClose: () => void;
  onUpdate: (meeting: Meeting) => void;
}

const MeetingPreCheck: React.FC<MeetingPreCheckProps> = ({ meeting, onClose, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'CHECKED' | 'UNCHECKED'>('ALL');
  const [localChecks, setLocalChecks] = useState<Record<string, { checked: boolean; notes: string }>>(
    meeting.endpointChecks || {}
  );
  const [isSaving, setIsSaving] = useState(false);

  const stats = useMemo(() => {
    const total = meeting.endpoints.length;
    const checked = meeting.endpoints.filter(e => localChecks[e.id]?.checked).length;
    return { total, checked, progress: total > 0 ? Math.round((checked / total) * 100) : 0 };
  }, [meeting.endpoints, localChecks]);

  const filteredEndpoints = useMemo(() => {
    return meeting.endpoints.filter(e => {
      const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            e.location.toLowerCase().includes(searchTerm.toLowerCase());
      const isChecked = localChecks[e.id]?.checked || false;
      const matchesFilter = filter === 'ALL' || (filter === 'CHECKED' ? isChecked : !isChecked);
      return matchesSearch && matchesFilter;
    });
  }, [meeting.endpoints, searchTerm, filter, localChecks]);

  const handleToggleCheck = (id: string) => {
    setLocalChecks(prev => ({
      ...prev,
      [id]: {
        checked: !prev[id]?.checked,
        notes: prev[id]?.notes || ''
      }
    }));
  };

  const handleNoteChange = (id: string, notes: string) => {
    setLocalChecks(prev => ({
      ...prev,
      [id]: {
        checked: prev[id]?.checked || false,
        notes: notes
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
        await onUpdate({
            ...meeting,
            endpointChecks: localChecks
        });
        alert('Đã lưu trạng thái kiểm tra kỹ thuật lên hệ thống Cloud!');
        onClose(); // Đóng modal sau khi lưu để làm mới giao diện
    } catch (err) {
        console.error("Lỗi khi lưu báo cáo kiểm tra:", err);
        alert('Có lỗi xảy ra khi lưu lên Cloud. Vui lòng thử lại.');
    } finally {
        setIsSaving(false);
    }
  };

  const handleExportExcel = () => {
    if (meeting.endpoints.length === 0) {
      alert("Không có dữ liệu điểm cầu để xuất.");
      return;
    }

    const header = "Tên điểm cầu,Vị trí,Trạng thái kiểm tra,Ghi chú kỹ thuật\n";
    const rows = meeting.endpoints.map(ep => {
      const checkInfo = localChecks[ep.id] || { checked: false, notes: '' };
      const statusText = checkInfo.checked ? "Đã kiểm tra" : "Chưa kiểm tra";
      const cleanNotes = (checkInfo.notes || "").replace(/"/g, '""');
      return `"${ep.name.replace(/"/g, '""')}","${ep.location.replace(/"/g, '""')}","${statusText}","${cleanNotes}"`;
    }).join("\n");
    
    const csvContent = "\uFEFF" + header + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = meeting.title.replace(/[^a-z0-9àáạảãâầấnậẩêềếệểiìíịỉĩoòóọỏõôồốộổơờớợởuùúụủũưừứựửyỳýỵỷỹ\s]/gi, '_').replace(/\s+/g, '_');
    
    link.href = url;
    link.setAttribute('download', `Ket_qua_KT_Ky_thuat_${safeTitle}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200">
        <div className="p-8 border-b border-gray-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-slate-900 text-cyan-400 rounded-2xl flex items-center justify-center shadow-xl">
              <ClipboardList className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight line-clamp-1">{meeting.title}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Kiểm tra hạ tầng kỹ thuật trước cuộc họp</p>
            </div>
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-3 mb-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiến độ kiểm tra:</span>
                <span className="text-sm font-black text-slate-900">{stats.checked} / {stats.total}</span>
              </div>
              <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
                  style={{ width: `${stats.progress}%` }}
                ></div>
              </div>
            </div>
            <button onClick={onClose} className="p-2.5 hover:bg-white border border-transparent hover:border-slate-200 rounded-full transition-all text-gray-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="px-8 py-5 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-white">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm tên điểm cầu hoặc vị trí..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'CHECKED', label: 'Đã kiểm tra' },
              { id: 'UNCHECKED', label: 'Chưa kiểm tra' }
            ].map(btn => (
              <button 
                key={btn.id}
                onClick={() => setFilter(btn.id as any)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === btn.id ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {btn.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 ml-auto">
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Xuất Excel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-2 px-8 py-3 bg-cyan-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-cyan-100 hover:bg-cyan-700 transition-all active:scale-95 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
              {isSaving ? 'Đang lưu...' : 'Lưu báo cáo'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEndpoints.map(ep => {
              const checkInfo = localChecks[ep.id] || { checked: false, notes: '' };
              return (
                <div 
                  key={ep.id} 
                  className={`group bg-white p-6 rounded-[2rem] border transition-all duration-300 flex flex-col gap-4 ${
                    checkInfo.checked 
                      ? 'border-emerald-100 bg-emerald-50/10' 
                      : 'border-slate-100 shadow-sm hover:border-cyan-200 hover:shadow-lg hover:-translate-y-1'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-black uppercase tracking-tight truncate ${checkInfo.checked ? 'text-emerald-700' : 'text-slate-900'}`}>
                          {ep.name}
                        </h4>
                        <div className={`w-1.5 h-1.5 rounded-full ${ep.status === EndpointStatus.CONNECTED ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{ep.location}</p>
                    </div>
                    <button 
                      onClick={() => handleToggleCheck(ep.id)}
                      className={`shrink-0 p-2 rounded-xl transition-all ${
                        checkInfo.checked 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-100 text-slate-300 hover:text-cyan-600 hover:bg-cyan-50'
                      }`}
                    >
                      {checkInfo.checked ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className={`w-3 h-3 ${checkInfo.checked ? 'text-emerald-500' : 'text-cyan-500'}`} />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${checkInfo.checked ? 'text-emerald-600' : 'text-slate-400'}`}>Ghi chú kỹ thuật:</span>
                    </div>
                    <textarea 
                      rows={2}
                      placeholder="Nhập tình trạng: âm thanh, hình ảnh..."
                      className={`w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-cyan-500 outline-none resize-none transition-all ${
                        checkInfo.checked ? 'border-emerald-200 bg-emerald-50/20' : 'hover:border-slate-200 focus:bg-white'
                      }`}
                      value={checkInfo.notes}
                      onChange={e => handleNoteChange(ep.id, e.target.value)}
                    />
                  </div>
                  
                  {checkInfo.checked && (
                    <div className="mt-auto flex items-center gap-2 py-1.5 px-3 bg-emerald-100/50 rounded-lg self-start">
                       <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                       <span className="text-[8px] font-black text-emerald-700 uppercase">Đã xác nhận hạ tầng</span>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredEndpoints.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300">
                <ClipboardList className="w-20 h-20 opacity-10 mb-6" />
                <p className="text-sm font-black uppercase tracking-[0.2em]">Không tìm thấy điểm cầu nào</p>
                <button onClick={() => { setSearchTerm(''); setFilter('ALL'); }} className="mt-4 text-[10px] font-black text-cyan-600 uppercase tracking-widest hover:underline">Xóa bộ lọc</button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Điểm cầu Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-200 shadow-sm"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Chưa kiểm tra</span>
            </div>
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            HỆ THỐNG GIÁM SÁT SLA v3.1 • {new Date().toLocaleDateString('vi-VN')}
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
      `}</style>
    </div>
  );
};

export default MeetingPreCheck;
