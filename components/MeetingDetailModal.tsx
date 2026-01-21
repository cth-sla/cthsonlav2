
import React, { useState, useEffect } from 'react';
import { Meeting } from '../types';
import { analyzeMeetingEfficiency } from '../services/geminiService';

interface MeetingDetailModalProps {
  meeting: Meeting;
  onClose: () => void;
  onUpdate?: (meeting: Meeting) => void;
}

const MeetingDetailModal: React.FC<MeetingDetailModalProps> = ({ meeting, onClose, onUpdate }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState(meeting.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    const getAiAnalysis = async () => {
      setIsLoading(true);
      const analysis = await analyzeMeetingEfficiency(meeting);
      setAiAnalysis(analysis);
      setIsLoading(false);
    };
    getAiAnalysis();
  }, [meeting]);

  const handleSaveNotes = async () => {
    if (!onUpdate) return;
    setIsSavingNotes(true);
    try {
      onUpdate({
        ...meeting,
        notes: notes
      });
      setIsEditingNotes(false);
    } catch (error) {
      console.error("Lỗi khi lưu ghi chú:", error);
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">{meeting.title}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Chi tiết thông tin cuộc họp • ID: {meeting.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-8 space-y-8">
             <section>
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 border-l-4 border-blue-600 pl-3">Thông tin tổng quan</h4>
                <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                   <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Đơn vị chủ trì</p>
                      <p className="text-sm font-black text-gray-800 mt-1">{meeting.hostUnit}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Cán bộ chủ trì</p>
                      <p className="text-sm font-black text-gray-800 mt-1">{meeting.chairPerson}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Thời gian bắt đầu</p>
                      <p className="text-sm font-black text-gray-800 mt-1">{new Date(meeting.startTime).toLocaleString('vi-VN')}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Thời gian kết thúc</p>
                      <p className="text-sm font-black text-gray-800 mt-1">{new Date(meeting.endTime).toLocaleString('vi-VN')}</p>
                   </div>
                </div>
             </section>

             <section>
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest border-l-4 border-amber-600 pl-3">Ghi chú & Biên bản</h4>
                    {!isEditingNotes ? (
                        <button 
                            onClick={() => setIsEditingNotes(true)}
                            className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 hover:underline"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            {notes ? 'Chỉnh sửa ghi chú' : 'Thêm ghi chú mới'}
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button 
                                onClick={() => { setIsEditingNotes(false); setNotes(meeting.notes || ''); }}
                                className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600"
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={handleSaveNotes}
                                disabled={isSavingNotes}
                                className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5"
                            >
                                {isSavingNotes ? 'Đang lưu...' : 'Lưu ghi chú'}
                            </button>
                        </div>
                    )}
                </div>
                {isEditingNotes ? (
                    <textarea 
                        className="w-full p-6 bg-amber-50/30 border border-amber-100 rounded-3xl text-sm text-gray-800 focus:ring-2 focus:ring-amber-500 outline-none min-h-[150px] transition-all"
                        placeholder="Nhập ghi chú cuộc họp tại đây..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                ) : (
                    <div className="bg-amber-50/30 p-6 rounded-3xl border border-amber-100/50 min-h-[100px] flex items-center justify-center">
                        {notes ? (
                            <p className="text-sm text-gray-700 leading-relaxed italic w-full whitespace-pre-wrap">{notes}</p>
                        ) : (
                            <p className="text-xs text-gray-400 font-medium italic">Chưa có ghi chú cho cuộc họp này.</p>
                        )}
                    </div>
                )}
             </section>

             <section>
                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4 border-l-4 border-emerald-600 pl-3">Nội dung cuộc họp</h4>
                <div className="bg-emerald-50/30 p-6 rounded-3xl border border-emerald-100/50">
                   <p className="text-sm text-gray-700 leading-relaxed italic">{meeting.description || 'Chưa có mô tả nội dung.'}</p>
                </div>
             </section>
          </div>

          <div className="md:col-span-4 space-y-8">
             <section>
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Thành phần ({meeting.participants.length})</h4>
                <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                   {meeting.participants.map((p, i) => (
                      <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100">{p}</span>
                   ))}
                </div>
             </section>

             <section>
                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Các điểm cầu ({meeting.endpoints.length})</h4>
                <div className="space-y-3 overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
                   {meeting.endpoints.map(ep => (
                      <div key={ep.id} className="p-3 bg-white border border-gray-100 rounded-2xl flex items-center justify-between shadow-sm">
                         <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate">{ep.name}</p>
                            <p className="text-[9px] text-gray-400 font-medium truncate">{ep.location}</p>
                         </div>
                         <div className={`w-2 h-2 rounded-full shrink-0 ${ep.status === 'CONNECTED' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                      </div>
                   ))}
                </div>
             </section>

             <section className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                   <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4 7V17L12 22L20 17V7L12 2Z"/></svg>
                </div>
                <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                   <svg className="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                   Phân tích AI Gemini
                </h4>
                {isLoading ? (
                   <div className="flex flex-col items-center justify-center py-6 gap-3">
                      <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang phân tích...</p>
                   </div>
                ) : (
                   <div className="text-[11px] leading-relaxed text-slate-300 font-medium">
                      {aiAnalysis}
                   </div>
                )}
             </section>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default MeetingDetailModal;
