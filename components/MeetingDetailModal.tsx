
import React, { useState, useEffect } from 'react';
import { Meeting } from '../types';
import { analyzeMeetingEfficiency } from '../services/geminiService';
import MeetingPreCheck from './MeetingPreCheck';
import { ExternalLink, FileText } from 'lucide-react';

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
  const [showPreCheck, setShowPreCheck] = useState(false);

  // Đồng bộ lại state notes khi props meeting thay đổi
  useEffect(() => {
    setNotes(meeting.notes || '');
  }, [meeting.notes]);

  useEffect(() => {
    const getAiAnalysis = async () => {
      setIsLoading(true);
      const analysis = await analyzeMeetingEfficiency(meeting);
      setAiAnalysis(analysis);
      setIsLoading(false);
    };
    getAiAnalysis();
  }, [meeting.id]); // Chỉ chạy lại khi ID cuộc họp đổi

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

  const handleUpdateMeeting = (updatedMeeting: Meeting) => {
    if (onUpdate) {
      onUpdate(updatedMeeting);
    }
  };

  const openInvitation = () => {
    if (meeting.invitationLink) {
      window.open(meeting.invitationLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-[2rem] md:rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 md:p-8 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0 ${
              meeting.status === 'CANCELLED' ? 'bg-red-600 shadow-red-100' : 
              meeting.status === 'POSTPONED' ? 'bg-amber-600 shadow-amber-100' :
              'bg-blue-600 shadow-blue-100'
            }`}>
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <h3 className={`text-lg md:text-xl font-black text-gray-900 tracking-tight line-clamp-2 ${
                meeting.status === 'CANCELLED' ? 'line-through decoration-red-500/50' : 
                meeting.status === 'POSTPONED' ? 'italic text-amber-900' : ''
              }`}>{meeting.title}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                {meeting.status === 'CANCELLED' ? 'Cuộc họp đã bị huỷ' : 
                 meeting.status === 'POSTPONED' ? 'Cuộc họp đang tạm hoãn' :
                 'Chi tiết thông tin cuộc họp'} • ID: {meeting.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
             {meeting.invitationLink && (
               <button 
                  onClick={openInvitation}
                  className="flex-1 sm:flex-none justify-center px-4 md:px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
               >
                  <FileText className="w-4 h-4" />
                  <span>Xem Giấy mời</span>
               </button>
             )}
             <button 
                onClick={() => setShowPreCheck(true)}
                className="flex-1 sm:flex-none justify-center px-4 md:px-5 py-2.5 bg-slate-900 text-cyan-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={meeting.status === 'CANCELLED'}
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <span className="hidden sm:inline">Kiểm tra Kỹ thuật</span>
                <span className="sm:hidden">KT Kỹ thuật</span>
             </button>
             <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-8 space-y-8">
             {(meeting.status === 'CANCELLED' || meeting.status === 'POSTPONED') && (
               <section className={`${
                 meeting.status === 'CANCELLED' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
               } border-2 p-6 rounded-[2rem] flex items-start gap-4`}>
                  <div className={`w-10 h-10 ${
                    meeting.status === 'CANCELLED' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                  } rounded-xl flex items-center justify-center shrink-0`}>
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <div>
                     <h4 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                       meeting.status === 'CANCELLED' ? 'text-red-600' : 'text-amber-600'
                     }`}>Lý do {meeting.status === 'CANCELLED' ? 'huỷ' : 'hoãn'} cuộc họp</h4>
                     <p className={`text-sm font-black leading-relaxed italic ${
                       meeting.status === 'CANCELLED' ? 'text-red-900' : 'text-amber-900'
                     }`}>
                        {meeting.cancelReason || 'Không có lý do chi tiết.'}
                     </p>
                  </div>
               </section>
             )}

             <section>
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 border-l-4 border-blue-600 pl-3">Thông tin tổng quan</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-3xl border border-gray-100">
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
                      <p className="text-sm font-black text-gray-800 mt-1">
                        {new Date(meeting.startTime).toLocaleString('vi-VN', { hour12: false })}
                      </p>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Thời gian kết thúc</p>
                      <p className="text-sm font-black text-gray-800 mt-1">
                        {new Date(meeting.endTime).toLocaleString('vi-VN', { hour12: false })}
                      </p>
                   </div>
                   {meeting.invitationLink && (
                    <div className="sm:col-span-2">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Giấy mời (URL)</p>
                       <a 
                        href={meeting.invitationLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-sm font-black text-indigo-600 mt-1 flex items-center gap-2 hover:underline"
                       >
                         {meeting.invitationLink}
                         <ExternalLink size={14} />
                       </a>
                    </div>
                   )}
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
                            {notes ? 'Sửa' : 'Thêm'}
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
                                {isSavingNotes ? '...' : 'Lưu'}
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
                      <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100 uppercase tracking-tight">{p}</span>
                   ))}
                </div>
             </section>

             <section>
                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Các điểm cầu ({meeting.endpoints.length})</h4>
                <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                   {meeting.endpoints.map(ep => {
                      const checkInfo = meeting.endpointChecks?.[ep.id];
                      const isChecked = checkInfo?.checked;
                      const techNotes = checkInfo?.notes;
                      
                      return (
                        <div key={ep.id} className="p-3 bg-white border border-gray-100 rounded-2xl flex flex-col gap-2 shadow-sm transition-all hover:border-blue-100">
                           <div className="flex items-center justify-between">
                              <div className="min-w-0 flex items-center gap-3">
                                 <div className={`shrink-0 w-2 h-2 rounded-full ${ep.status === 'CONNECTED' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                                 <div className="min-w-0">
                                   <p className="text-xs font-bold text-gray-800 truncate uppercase">{ep.name}</p>
                                   <p className="text-[9px] text-gray-400 font-medium truncate uppercase tracking-widest">{ep.location}</p>
                                 </div>
                              </div>
                              {isChecked && (
                                 <div className="shrink-0 p-1 bg-emerald-50 text-emerald-600 rounded-lg" title="Đã kiểm tra kỹ thuật">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                 </div>
                              )}
                           </div>
                           {techNotes && (
                              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                                 <p className="text-[10px] text-slate-500 font-medium italic leading-tight">
                                    <span className="font-black uppercase text-[8px] text-slate-400 mr-1">Ghi chú KT:</span>
                                    {techNotes}
                                 </p>
                              </div>
                           )}
                        </div>
                      );
                   })}
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

        <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button 
            onClick={onClose}
            className="w-full md:w-auto px-8 py-3 bg-white border border-gray-200 text-gray-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>

      {showPreCheck && (
        <MeetingPreCheck 
          meeting={meeting} 
          onClose={() => setShowPreCheck(false)} 
          onUpdate={handleUpdateMeeting}
        />
      )}
    </div>
  );
};

export default MeetingDetailModal;
