import React, { useState, useEffect, useMemo } from 'react';
import { Meeting, EndpointGroup } from '../types';
import { analyzeMeetingEfficiency } from '../services/geminiService';
import MeetingPreCheck from './MeetingPreCheck';
import { 
  ExternalLink, FileText, Link as LinkIcon, MailOpen, 
  Search, CheckCircle2, Circle, Plus, Trash2, Edit3, 
  MessageSquare, AlertTriangle, Check, X, Sparkles, 
  StickyNote, Filter, ChevronDown, ChevronUp, Save
} from 'lucide-react';

interface MeetingDetailModalProps {
  meeting: Meeting;
  endpointGroups?: EndpointGroup[];
  onClose: () => void;
  onUpdate?: (meeting: Meeting) => void;
}

// Danh sách các mẫu ghi chú sự cố nhanh
const QUICK_ISSUE_TAGS = [
  '🔊 Mic rè / nhỏ',
  '🔇 Mất tiếng',
  '📷 Mất tín hiệu hình',
  '📶 Mạng chập chờn',
  '⚡ Hình ảnh giật/lag',
  '⚠️ Chưa vào phòng họp',
  '✅ Đã xử lý xong',
  '🟢 Tín hiệu ổn định'
];

const MeetingDetailModal: React.FC<MeetingDetailModalProps> = ({ meeting, endpointGroups = [], onClose, onUpdate }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState(meeting.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [showPreCheck, setShowPreCheck] = useState(false);

  // Quản lý ghi chú và trạng thái kiểm tra từng điểm cầu
  const [endpointChecks, setEndpointChecks] = useState<Record<string, { checked: boolean; notes: string }>>(
    meeting.endpointChecks || {}
  );
  const [editingEndpointId, setEditingEndpointId] = useState<string | null>(null);
  const [draftEndpointNote, setDraftEndpointNote] = useState<string>('');
  const [draftEndpointChecked, setDraftEndpointChecked] = useState<boolean>(false);
  const [isSavingEndpoint, setIsSavingEndpoint] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [endpointFilter, setEndpointFilter] = useState<'ALL' | 'WITH_NOTES' | 'CHECKED' | 'UNCHECKED'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Đồng bộ lại state khi props meeting thay đổi
  useEffect(() => {
    setNotes(meeting.notes || '');
    setEndpointChecks(meeting.endpointChecks || {});
  }, [meeting.notes, meeting.endpointChecks]);

  useEffect(() => {
    const getAiAnalysis = async () => {
      setIsLoading(true);
      const analysis = await analyzeMeetingEfficiency(meeting);
      setAiAnalysis(analysis);
      setIsLoading(false);
    };
    getAiAnalysis();
  }, [meeting.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleSaveNotes = async () => {
    if (!onUpdate) return;
    setIsSavingNotes(true);
    try {
      onUpdate({
        ...meeting,
        notes: notes
      });
      setIsEditingNotes(false);
      showToast("Đã lưu biên bản cuộc họp!");
    } catch (error) {
      console.error("Lỗi khi lưu ghi chú:", error);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleUpdateMeeting = (updatedMeeting: Meeting) => {
    if (onUpdate) {
      return onUpdate(updatedMeeting);
    }
  };

  // Mở trình chỉnh sửa ghi chú cho điểm cầu
  const handleStartEditEndpoint = (endpointId: string) => {
    const current = endpointChecks[endpointId];
    setEditingEndpointId(endpointId);
    setDraftEndpointNote(current?.notes || '');
    setDraftEndpointChecked(current?.checked || false);
  };

  const handleCancelEditEndpoint = () => {
    setEditingEndpointId(null);
    setDraftEndpointNote('');
    setDraftEndpointChecked(false);
  };

  // Lưu ghi chú riêng cho 1 điểm cầu
  const handleSaveEndpointNote = async (endpointId: string) => {
    setIsSavingEndpoint(true);
    const updatedChecks = {
      ...endpointChecks,
      [endpointId]: {
        checked: draftEndpointChecked,
        notes: draftEndpointNote.trim()
      }
    };

    setEndpointChecks(updatedChecks);
    setEditingEndpointId(null);

    if (onUpdate) {
      try {
        await onUpdate({
          ...meeting,
          endpointChecks: updatedChecks
        });
        showToast("Đã lưu ghi chú điểm cầu!");
      } catch (error) {
        console.error("Lỗi khi lưu ghi chú điểm cầu:", error);
      }
    }
    setIsSavingEndpoint(false);
  };

  // Xóa ghi chú của điểm cầu
  const handleDeleteEndpointNote = async (endpointId: string) => {
    const current = endpointChecks[endpointId];
    const updatedChecks = {
      ...endpointChecks,
      [endpointId]: {
        checked: current?.checked || false,
        notes: ''
      }
    };

    setEndpointChecks(updatedChecks);
    if (editingEndpointId === endpointId) {
      setDraftEndpointNote('');
    }

    if (onUpdate) {
      try {
        await onUpdate({
          ...meeting,
          endpointChecks: updatedChecks
        });
        showToast("Đã xóa ghi chú điểm cầu!");
      } catch (error) {
        console.error("Lỗi khi xóa ghi chú điểm cầu:", error);
      }
    }
  };

  // Thao tác nhanh: Bật/Tắt trạng thái Đã kiểm tra KT
  const handleQuickToggleCheck = async (endpointId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = endpointChecks[endpointId];
    const newChecked = !current?.checked;
    
    const updatedChecks = {
      ...endpointChecks,
      [endpointId]: {
        checked: newChecked,
        notes: current?.notes || ''
      }
    };

    setEndpointChecks(updatedChecks);

    if (onUpdate) {
      try {
        await onUpdate({
          ...meeting,
          endpointChecks: updatedChecks
        });
        showToast(newChecked ? "Đã duyệt kỹ thuật điểm cầu!" : "Đã bỏ duyệt kỹ thuật điểm cầu!");
      } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái kiểm tra:", error);
      }
    }
  };

  // Thêm nhanh tag sự cố vào draft note
  const handleAddQuickTag = (tag: string) => {
    if (!draftEndpointNote.trim()) {
      setDraftEndpointNote(tag);
    } else {
      setDraftEndpointNote(prev => `${prev}; ${tag}`);
    }
  };

  // Lọc và tìm kiếm danh sách điểm cầu
  const filteredEndpoints = useMemo(() => {
    return meeting.endpoints.filter(ep => {
      const checkInfo = endpointChecks[ep.id];
      const hasNotes = Boolean(checkInfo?.notes && checkInfo.notes.trim().length > 0);
      const isChecked = Boolean(checkInfo?.checked);

      // Lọc theo trạng thái
      if (endpointFilter === 'WITH_NOTES' && !hasNotes) return false;
      if (endpointFilter === 'CHECKED' && !isChecked) return false;
      if (endpointFilter === 'UNCHECKED' && isChecked) return false;

      // Lọc theo từ khóa tìm kiếm
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = ep.name.toLowerCase().includes(query);
        const matchLoc = ep.location.toLowerCase().includes(query);
        const matchIp = (ep.ip1 || '').toLowerCase().includes(query) || (ep.ip2 || '').toLowerCase().includes(query);
        const matchNote = (checkInfo?.notes || '').toLowerCase().includes(query);
        return matchName || matchLoc || matchIp || matchNote;
      }

      return true;
    });
  }, [meeting.endpoints, endpointChecks, endpointFilter, searchTerm]);

  // Thống kê nhanh điểm cầu
  const endpointStats = useMemo(() => {
    let withNotes = 0;
    let checked = 0;
    meeting.endpoints.forEach(ep => {
      const check = endpointChecks[ep.id];
      if (check?.notes && check.notes.trim().length > 0) withNotes++;
      if (check?.checked) checked++;
    });
    return {
      total: meeting.endpoints.length,
      withNotes,
      checked,
      unchecked: meeting.endpoints.length - checked
    };
  }, [meeting.endpoints, endpointChecks]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Toast thông báo lưu thành công */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[60] px-4 py-2.5 bg-slate-900 text-white dark:bg-emerald-600 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold border border-slate-700 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 size={16} className="text-emerald-400 dark:text-white shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl max-h-[92vh] rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="p-6 md:p-8 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50 dark:bg-slate-800/50">
          <div className="flex-1">
             <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-wider ${
                  meeting.status === 'CANCELLED' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                  meeting.status === 'POSTPONED' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                  meeting.status === 'CHANGED_FORMAT' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                  'bg-blue-600 text-white'
                }`}>
                  {meeting.status === 'CANCELLED' ? 'Đã huỷ' :
                   meeting.status === 'POSTPONED' ? 'Đã hoãn' :
                   meeting.status === 'CHANGED_FORMAT' ? 'Đổi hình thức' :
                   'Sắp diễn ra'}
                </span>
                <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                  {meeting.meetingFormat === 'TRUC_TIEP' ? 'Trực tiếp' : 'Trực tuyến'}
                </span>
                {meeting.meetingRoomId && (
                  <>
                    <span className="text-xs font-bold text-gray-300 dark:text-slate-700">•</span>
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">ID: {meeting.meetingRoomId}</span>
                  </>
                )}
             </div>
             <h2 className="text-lg md:text-2xl font-black text-gray-900 dark:text-white leading-tight uppercase tracking-tight">{meeting.title}</h2>
          </div>
          
          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">

             {meeting.invitationLink && (
                <button 
                  onClick={() => {
                     try {
                        const url = meeting.invitationLink?.startsWith('http') 
                          ? meeting.invitationLink 
                          : `https://${meeting.invitationLink}`;
                        window.open(url, '_blank', 'noopener,noreferrer');
                     } catch (e) {
                        console.error('Không thể mở link:', e);
                     }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 active:scale-95"
                  title="Mở file/link giấy mời cuộc họp"
                >
                   <MailOpen className="w-4 h-4" />
                   <span>XEM GIẤY MỜI</span>
                </button>
             )}

             <button 
                onClick={() => setShowPreCheck(true)}
                className="flex-1 sm:flex-none justify-center px-4 md:px-5 py-2 bg-slate-900 dark:bg-slate-700 text-cyan-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-600 transition-all shadow-xl shadow-slate-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={meeting.status === 'CANCELLED'}
             >
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Kiểm tra Kỹ thuật</span>
                <span className="sm:hidden">KT Kỹ thuật</span>
             </button>
             <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all text-gray-400 dark:text-slate-500">
                <X className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Thân Modal */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 custom-scrollbar">
          
          {/* Cột trái: Thông tin tổng quan, Biên bản, Nội dung cuộc họp, Phân tích AI */}
          <div className="lg:col-span-6 space-y-6">
             {(meeting.status === 'CANCELLED' || meeting.status === 'POSTPONED') && (
               <section className={`${
                 meeting.status === 'CANCELLED' ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30'
               } border-2 p-6 rounded-[2rem] flex items-start gap-4`}>
                  <div className={`w-10 h-10 ${
                    meeting.status === 'CANCELLED' ? 'bg-red-100 dark:bg-red-800/50 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-800/50 text-amber-600 dark:text-amber-400'
                  } rounded-xl flex items-center justify-center shrink-0`}>
                     <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                     <h4 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                       meeting.status === 'CANCELLED' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                     }`}>Lý do {meeting.status === 'CANCELLED' ? 'huỷ' : 'hoãn'} cuộc họp</h4>
                     <p className={`text-sm font-black leading-relaxed italic ${
                       meeting.status === 'CANCELLED' ? 'text-red-900 dark:text-red-200' : 'text-amber-900 dark:text-amber-200'
                     }`}>
                        {meeting.cancelReason || 'Không có lý do chi tiết.'}
                     </p>
                  </div>
               </section>
             )}

             <section>
                <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4 border-l-4 border-blue-600 dark:border-blue-400 pl-3">Thông tin tổng quan</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-gray-100 dark:border-slate-800">
                   <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-tight">Đơn vị chủ trì</p>
                      <p className="text-sm font-black text-gray-800 dark:text-white mt-1">{meeting.hostUnit}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-tight">Cán bộ chủ trì</p>
                      <p className="text-sm font-black text-gray-800 dark:text-white mt-1">{meeting.chairPerson}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-tight">Thời gian bắt đầu</p>
                      <p className="text-sm font-black text-gray-800 dark:text-white mt-1">
                        {new Date(meeting.startTime).toLocaleString('vi-VN', { hour12: false })}
                      </p>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-tight">Thời gian kết thúc</p>
                      <p className="text-sm font-black text-gray-800 dark:text-white mt-1">
                        {new Date(meeting.endTime).toLocaleString('vi-VN', { hour12: false })}
                      </p>
                   </div>
                   {meeting.meetingRoomId && (
                    <div>
                       <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-tight">ID phòng họp</p>
                       <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-2">
                          {meeting.meetingRoomId}
                       </div>
                    </div>
                   )}
                   {meeting.invitationLink && (
                    <div className="sm:col-span-2">
                       <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-tight">Link giấy mời</p>
                       <div className="text-sm font-black text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-2 break-all">
                          {meeting.invitationLink}
                          <LinkIcon size={14} className="text-blue-400 shrink-0" />
                       </div>
                    </div>
                   )}
                </div>
             </section>

             {/* Ghi chú & Biên bản chung */}
             <section>
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest border-l-4 border-amber-600 dark:border-amber-400 pl-3">Ghi chú & Biên bản</h4>
                    {!isEditingNotes ? (
                        <button 
                            onClick={() => setIsEditingNotes(true)}
                            className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5 hover:underline"
                        >
                            <Edit3 className="w-3 h-3" />
                            {notes ? 'Sửa' : 'Thêm'}
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button 
                                onClick={() => { setIsEditingNotes(false); setNotes(meeting.notes || ''); }}
                                className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest hover:text-gray-600 dark:hover:text-slate-300"
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={handleSaveNotes}
                                disabled={isSavingNotes}
                                className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5"
                            >
                                {isSavingNotes ? '...' : 'Lưu'}
                            </button>
                        </div>
                    )}
                </div>
                {isEditingNotes ? (
                    <textarea 
                        className="w-full p-6 bg-amber-50/30 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-3xl text-sm text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none min-h-[150px] transition-all"
                        placeholder="Nhập ghi chú cuộc họp tại đây..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                ) : (
                    <div className="bg-amber-50/30 dark:bg-amber-900/10 p-6 rounded-3xl border border-amber-100/50 dark:border-amber-800/30 min-h-[100px] flex items-center justify-center">
                        {notes ? (
                            <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed italic w-full whitespace-pre-wrap">{notes}</p>
                        ) : (
                            <p className="text-xs text-gray-400 dark:text-slate-500 font-medium italic">Chưa có ghi chú cho cuộc họp này.</p>
                        )}
                    </div>
                )}
             </section>

             {/* Nội dung cuộc họp */}
             <section>
                <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4 border-l-4 border-emerald-600 dark:border-emerald-400 pl-3">Nội dung cuộc họp</h4>
                <div className="bg-emerald-50/30 dark:bg-emerald-900/10 p-6 rounded-3xl border border-emerald-100/50 dark:border-emerald-800/30">
                   <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed italic">{meeting.description || 'Chưa có mô tả nội dung.'}</p>
                </div>
             </section>

             {/* Phân tích AI */}
             <section className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                   <Sparkles className="w-24 h-24" />
                </div>
                <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                   <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                   Trợ lý AI Đánh giá Cuộc họp
                </h4>
                {isLoading ? (
                   <div className="flex flex-col items-center justify-center py-6 gap-3">
                      <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang phân tích...</p>
                   </div>
                ) : (
                   <div className="text-[11px] leading-relaxed text-slate-300 font-medium">
                      {aiAnalysis || 'Đang sẵn sàng phân tích.'}
                   </div>
                )}
             </section>
          </div>

          {/* Cột phải: Thành phần & Quản lý ghi chú riêng từng điểm cầu */}
          <div className="lg:col-span-6 space-y-6">
             
             {/* Thành phần tham dự */}
             <section>
                <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">
                  Thành phần tham dự ({meeting.participants.length})
                </h4>
                <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-2 custom-scrollbar bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                   {meeting.participants.map((p, i) => (
                      <span key={i} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded-lg border border-indigo-100 dark:border-indigo-800/30 uppercase tracking-tight">{p}</span>
                   ))}
                </div>
             </section>

             {/* Khu vực Ghi chú sự cố từng điểm cầu */}
             <section className="bg-slate-50 dark:bg-slate-800/60 p-4 md:p-5 rounded-[2rem] border border-slate-200/80 dark:border-slate-700 space-y-4">
                
                {/* Header danh sách điểm cầu */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                   <div>
                      <div className="flex items-center gap-2">
                         <StickyNote size={16} className="text-blue-600 dark:text-blue-400" />
                         <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                           Ghi chú sự cố từng điểm cầu ({meeting.endpoints.length})
                         </h4>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                         Ghi lại nhanh tình trạng đường truyền, âm thanh, hình ảnh tại mỗi xã/phường
                      </p>
                   </div>
                   
                   {/* Thống kê nhanh */}
                   <div className="flex items-center gap-2 shrink-0">
                      {endpointStats.withNotes > 0 && (
                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                          <AlertTriangle size={10} />
                          {endpointStats.withNotes} có ghi chú
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                        <Check size={10} />
                        {endpointStats.checked}/{endpointStats.total} đã KT
                      </span>
                   </div>
                </div>

                {/* Thanh tìm kiếm & bộ lọc điểm cầu */}
                <div className="space-y-2">
                   <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Tìm theo tên điểm cầu, IP, hoặc nội dung ghi chú..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                      {searchTerm && (
                        <button 
                          onClick={() => setSearchTerm('')} 
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <X size={14} />
                        </button>
                      )}
                   </div>

                   {/* Filter Chips */}
                   <div className="flex flex-wrap gap-1.5">
                      <button 
                        onClick={() => setEndpointFilter('ALL')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          endpointFilter === 'ALL' 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Tất cả ({endpointStats.total})
                      </button>
                      <button 
                        onClick={() => setEndpointFilter('WITH_NOTES')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                          endpointFilter === 'WITH_NOTES' 
                            ? 'bg-amber-600 text-white shadow-sm' 
                            : 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-600'
                        }`}
                      >
                        <AlertTriangle size={10} />
                        Có ghi chú ({endpointStats.withNotes})
                      </button>
                      <button 
                        onClick={() => setEndpointFilter('CHECKED')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                          endpointFilter === 'CHECKED' 
                            ? 'bg-emerald-600 text-white shadow-sm' 
                            : 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-600'
                        }`}
                      >
                        <CheckCircle2 size={10} />
                        Đã KT ({endpointStats.checked})
                      </button>
                      <button 
                        onClick={() => setEndpointFilter('UNCHECKED')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                          endpointFilter === 'UNCHECKED' 
                            ? 'bg-slate-700 text-white shadow-sm' 
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <Circle size={10} />
                        Chưa KT ({endpointStats.unchecked})
                      </button>
                   </div>
                </div>

                {/* Danh sách các điểm cầu với trình nhập ghi chú riêng */}
                <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1.5 custom-scrollbar">
                   {filteredEndpoints.length === 0 ? (
                      <div className="text-center py-8 bg-white dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                         <MessageSquare size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                         <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Không tìm thấy điểm cầu phù hợp</p>
                         {searchTerm && (
                           <button 
                             onClick={() => { setSearchTerm(''); setEndpointFilter('ALL'); }}
                             className="text-[10px] text-blue-600 hover:underline mt-1 font-bold"
                           >
                             Xóa bộ lọc
                           </button>
                         )}
                      </div>
                   ) : (
                      filteredEndpoints.map(ep => {
                         const checkInfo = endpointChecks[ep.id];
                         const isChecked = checkInfo?.checked;
                         const techNotes = checkInfo?.notes || '';
                         const isEditingThis = editingEndpointId === ep.id;

                         return (
                            <div 
                              key={ep.id} 
                              className={`p-3.5 bg-white dark:bg-slate-900 border rounded-2xl shadow-sm transition-all ${
                                isEditingThis 
                                  ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md' 
                                  : techNotes 
                                    ? 'border-amber-200 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10' 
                                    : 'border-slate-200/80 dark:border-slate-700 hover:border-blue-200 dark:hover:border-slate-600'
                              }`}
                            >
                               {/* Hàng tiêu đề của điểm cầu */}
                               <div className="flex items-center justify-between gap-2">
                                  <div className="min-w-0 flex items-center gap-2.5 flex-1">
                                     <div 
                                       className={`shrink-0 w-2.5 h-2.5 rounded-full ${
                                         ep.status === 'CONNECTED' 
                                           ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' 
                                           : 'bg-red-500'
                                       }`}
                                       title={ep.status === 'CONNECTED' ? 'Đang kết nối' : 'Mất kết nối'}
                                     />
                                     <div className="min-w-0 flex-1">
                                       <div className="flex items-center gap-2">
                                          <p className="text-xs font-black text-slate-900 dark:text-white uppercase truncate">
                                            {ep.name}
                                          </p>
                                          {isChecked && (
                                            <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[8px] font-black rounded uppercase tracking-tighter shrink-0">
                                              ĐÃ KT
                                            </span>
                                          )}
                                       </div>
                                       <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate uppercase tracking-widest mt-0.5">
                                         {ep.location} {ep.ip1 && `• IP: ${ep.ip1}`}
                                       </p>
                                     </div>
                                  </div>

                                  {/* Cụm nút thao tác nhanh: Check KT & Thêm/Sửa ghi chú */}
                                  <div className="flex items-center gap-1.5 shrink-0">
                                     <button
                                       onClick={(e) => handleQuickToggleCheck(ep.id, e)}
                                       className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                         isChecked 
                                           ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100' 
                                           : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                       }`}
                                       title={isChecked ? "Bấm để hủy duyệt KT" : "Bấm để duyệt KT điểm cầu"}
                                     >
                                       {isChecked ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                                     </button>

                                     {!isEditingThis && (
                                       <button
                                         onClick={() => handleStartEditEndpoint(ep.id)}
                                         className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
                                           techNotes 
                                             ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200' 
                                             : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100'
                                         }`}
                                       >
                                         <Edit3 size={11} />
                                         <span>{techNotes ? 'Sửa' : '+ Ghi chú'}</span>
                                       </button>
                                     )}
                                  </div>
                               </div>

                               {/* Hiển thị ghi chú hiện tại (khi không trong chế độ sửa) */}
                               {!isEditingThis && techNotes && (
                                  <div className="mt-2.5 p-2.5 bg-amber-50/80 dark:bg-amber-950/20 rounded-xl border border-amber-200/80 dark:border-amber-900/40 flex items-start gap-2">
                                     <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                     <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-0.5">
                                          Ghi chú kỹ thuật tại điểm cầu:
                                        </p>
                                        <p className="text-xs text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap leading-relaxed">
                                          {techNotes}
                                        </p>
                                     </div>
                                     <button 
                                       onClick={() => handleDeleteEndpointNote(ep.id)}
                                       className="p-1 text-slate-400 hover:text-red-500 rounded transition-all shrink-0"
                                       title="Xóa ghi chú này"
                                     >
                                       <Trash2 size={12} />
                                     </button>
                                  </div>
                               )}

                               {/* Form chỉnh sửa ghi chú cho điểm cầu */}
                               {isEditingThis && (
                                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-2.5 animate-in fade-in duration-150">
                                     <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                                           <StickyNote size={12} />
                                           Nhập vấn đề / tình trạng tại điểm cầu:
                                        </label>
                                        <div className="flex items-center gap-1.5">
                                           <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer select-none">
                                              <input 
                                                type="checkbox" 
                                                checked={draftEndpointChecked}
                                                onChange={(e) => setDraftEndpointChecked(e.target.checked)}
                                                className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer"
                                              />
                                              <span>Đã duyệt KT</span>
                                           </label>
                                        </div>
                                     </div>

                                     {/* Thẻ gợi ý sự cố nhanh */}
                                     <div>
                                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight mb-1">Chọn nhanh sự cố phổ biến:</p>
                                        <div className="flex flex-wrap gap-1">
                                           {QUICK_ISSUE_TAGS.map((tag, idx) => (
                                              <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleAddQuickTag(tag)}
                                                className="px-2 py-0.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-600 rounded-md text-[9px] font-medium transition-all"
                                              >
                                                {tag}
                                              </button>
                                           ))}
                                        </div>
                                     </div>

                                     {/* Ô nhập ghi chú */}
                                     <textarea 
                                       rows={2}
                                       value={draftEndpointNote}
                                       onChange={(e) => setDraftEndpointNote(e.target.value)}
                                       placeholder="Ví dụ: Mic rè, đã hướng dẫn cắm lại giắc 3.5mm; Mạng FPT ổn định..."
                                       className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none font-medium leading-relaxed"
                                       autoFocus
                                     />

                                     {/* Nút lưu / hủy */}
                                     <div className="flex items-center justify-between pt-1">
                                        {techNotes ? (
                                           <button
                                             type="button"
                                             onClick={() => handleDeleteEndpointNote(ep.id)}
                                             className="text-[10px] text-red-500 hover:text-red-700 dark:hover:text-red-400 font-bold flex items-center gap-1"
                                           >
                                             <Trash2 size={11} />
                                             Xóa ghi chú
                                           </button>
                                        ) : <div />}

                                        <div className="flex items-center gap-2">
                                           <button
                                             type="button"
                                             onClick={handleCancelEditEndpoint}
                                             className="px-3 py-1 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border border-slate-200 dark:border-slate-600"
                                           >
                                             Hủy
                                           </button>
                                           <button
                                             type="button"
                                             onClick={() => handleSaveEndpointNote(ep.id)}
                                             disabled={isSavingEndpoint}
                                             className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all disabled:opacity-50"
                                           >
                                             {isSavingEndpoint ? (
                                               <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                             ) : (
                                               <Save size={12} />
                                             )}
                                             <span>Lưu</span>
                                           </button>
                                        </div>
                                     </div>
                                  </div>
                               )}
                            </div>
                         );
                      })
                   )}
                </div>
             </section>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="p-4 md:p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex flex-wrap justify-between items-center gap-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
             <span>Ghi chú từng điểm cầu được đồng bộ và lưu tự động vào hệ thống.</span>
          </div>
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>

      {/* Modal Kiểm tra Kỹ thuật toàn diện */}
      {showPreCheck && (
        <MeetingPreCheck 
          meeting={meeting} 
          endpointGroups={endpointGroups}
          onClose={() => setShowPreCheck(false)} 
          onUpdate={handleUpdateMeeting}
        />
      )}
    </div>
  );
};

export default MeetingDetailModal;
