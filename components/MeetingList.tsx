
import React, { useState, useMemo, useEffect } from 'react';
import { Meeting } from '../types';
import { FileText, Link as LinkIcon, ExternalLink } from 'lucide-react';

interface MeetingListProps {
  meetings: Meeting[];
  onSelect: (meeting: Meeting) => void;
  isAdmin?: boolean;
  onEdit?: (meeting: Meeting) => void;
  onDelete?: (id: string) => void;
  onAdd?: () => void;
  onUpdate?: (meeting: Meeting) => void;
}

type SortField = 'title' | 'hostUnit' | 'chairPerson' | 'startTime';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

const MeetingList: React.FC<MeetingListProps> = ({ meetings, onSelect, isAdmin, onEdit, onDelete, onAdd, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortField, setSortField] = useState<SortField>('startTime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionMeeting, setActionMeeting] = useState<{ meeting: Meeting, type: 'CANCEL' | 'POSTPONE' } | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  const filteredAndSortedMeetings = useMemo(() => {
    return [...meetings]
      .filter(m => {
        const matchesSearch = 
          m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.hostUnit.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.chairPerson.toLowerCase().includes(searchTerm.toLowerCase());
        
        const meetingDate = new Date(m.startTime).setHours(0, 0, 0, 0);
        const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
        const end = endDate ? new Date(endDate).setHours(0, 0, 0, 0) : null;

        const matchesStartDate = !start || meetingDate >= start;
        const matchesEndDate = !end || meetingDate <= end;

        return matchesSearch && matchesStartDate && matchesEndDate;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortField === 'startTime') {
          comparison = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        } else {
          comparison = (a[sortField] || '').localeCompare(b[sortField] || '', 'vi');
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [meetings, searchTerm, startDate, endDate, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedMeetings.length / ITEMS_PER_PAGE);
  const paginatedMeetings = filteredAndSortedMeetings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const confirmAction = () => {
    if (!actionMeeting || !onUpdate) return;
    if (!reason.trim()) {
      alert(`Vui lòng nhập lý do ${actionMeeting.type === 'CANCEL' ? 'huỷ' : 'hoãn'} cuộc họp.`);
      return;
    }
    
    onUpdate({
      ...actionMeeting.meeting,
      status: actionMeeting.type === 'CANCEL' ? 'CANCELLED' : 'POSTPONED',
      cancelReason: reason
    });
    
    setActionMeeting(null);
    setReason('');
  };

  const handleExportExcel = () => {
    if (filteredAndSortedMeetings.length === 0) {
      alert("Không có dữ liệu để xuất.");
      return;
    }

    const header = "Tiêu đề,Đơn vị chủ trì,Cán bộ chủ trì,Thời gian bắt đầu,Thời gian kết thúc,Số điểm cầu,Trạng thái,Giấy mời,Mô tả\n";
    const rows = filteredAndSortedMeetings.map(m => {
      const status = m.status === 'CANCELLED' ? 'Đã huỷ' : m.status === 'POSTPONED' ? 'Tạm hoãn' : 'Bình thường';
      return `"${m.title.replace(/"/g, '""')}","${m.hostUnit.replace(/"/g, '""')}","${m.chairPerson.replace(/"/g, '""')}","${new Date(m.startTime).toLocaleString('vi-VN', { hour12: false })}","${new Date(m.endTime).toLocaleString('vi-VN', { hour12: false })}","${m.endpoints.length}","${status}","${m.invitationLink || ''}","${(m.description || '').replace(/"/g, '""')}"`;
    }).join("\n");
    
    const csvContent = "\uFEFF" + header + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Danh_sach_Lich_Hop_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenInvitation = (link?: string) => {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      alert("Cuộc họp này chưa được gán liên kết giấy mời.");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return (
      <svg className="w-3 h-3 ml-1.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
    return (
      <svg className={`w-3 h-3 ml-1.5 text-blue-600 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" />
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full w-full">
      <div className="p-4 md:p-5 border-b border-gray-100 flex flex-col gap-4 bg-gray-50/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-gray-900">Danh sách cuộc họp</h2>
              <p className="text-xs text-gray-500 font-medium">Tìm thấy {filteredAndSortedMeetings.length} cuộc họp</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative group w-full md:w-auto">
              <input
                type="text"
                placeholder="Tìm cuộc họp..."
                className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 w-full md:w-64 text-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="w-5 h-5 absolute left-3.5 top-2.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <button 
                onClick={handleExportExcel}
                className="bg-emerald-600 text-white px-4 md:px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Xuất Excel
              </button>
              
              {isAdmin && onAdd && (
                <button 
                  onClick={onAdd}
                  className="bg-blue-600 text-white px-4 md:px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                  Lên lịch
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end gap-3 pb-1">
          <div className="flex gap-2">
             <div className="space-y-1.5 flex-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Từ ngày</label>
                <input 
                  type="date"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold text-gray-700 transition-all"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 flex-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Đến ngày</label>
                <input 
                  type="date"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold text-gray-700 transition-all"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
          </div>
          {(searchTerm || startDate || endDate) && (
            <button 
              onClick={handleResetFilters}
              className="px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-all flex items-center justify-center gap-1.5 mb-0.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto flex-1 w-full">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50/80 text-gray-500 text-[11px] uppercase font-black tracking-widest">
              <th 
                className="px-4 md:px-6 py-4 cursor-pointer hover:bg-gray-100 group transition-colors sticky left-0 bg-gray-50/80 z-10"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center">
                  Tên cuộc họp
                  <SortIcon field="title" />
                </div>
              </th>
              <th 
                className="px-4 md:px-6 py-4 cursor-pointer hover:bg-gray-100 group transition-colors"
                onClick={() => handleSort('hostUnit')}
              >
                <div className="flex items-center">
                  Đơn vị chủ trì
                  <SortIcon field="hostUnit" />
                </div>
              </th>
              <th 
                className="px-4 md:px-6 py-4 cursor-pointer hover:bg-gray-100 group transition-colors"
                onClick={() => handleSort('chairPerson')}
              >
                <div className="flex items-center">
                  Cán bộ chủ trì
                  <SortIcon field="chairPerson" />
                </div>
              </th>
              <th 
                className="px-4 md:px-6 py-4 cursor-pointer hover:bg-gray-100 group transition-colors"
                onClick={() => handleSort('startTime')}
              >
                <div className="flex items-center">
                  Thời gian
                  <SortIcon field="startTime" />
                </div>
              </th>
              <th className="px-4 md:px-6 py-4 whitespace-nowrap text-center">Trạng thái</th>
              <th className="px-4 md:px-6 py-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedMeetings.map((meeting) => {
              const isCancelled = meeting.status === 'CANCELLED';
              const isPostponed = meeting.status === 'POSTPONED';
              const isSpecial = isCancelled || isPostponed;

              return (
                <tr key={meeting.id} className={`hover:bg-blue-50/30 transition-all group ${
                  isCancelled ? 'bg-red-50/60 border-l-4 border-l-red-600' : 
                  isPostponed ? 'bg-amber-50/60 border-l-4 border-l-amber-500' : ''
                }`}>
                  <td className="px-4 md:px-6 py-4 sticky left-0 bg-inherit z-10 border-r border-transparent group-hover:border-gray-100">
                    <div className="relative group/title-tip">
                      <div className={`font-bold transition-all leading-tight text-sm line-clamp-2 md:line-clamp-none min-w-[150px] ${
                        isCancelled ? 'text-red-700 line-through decoration-red-700 decoration-2' : 
                        isPostponed ? 'text-amber-700 italic' : 
                        'text-gray-900 group-hover:text-blue-700'
                      }`}>
                        {meeting.title}
                      </div>
                    </div>
                    <div className={`text-[10px] mt-1 font-mono tracking-tighter truncate ${isCancelled ? 'text-red-400' : isPostponed ? 'text-amber-400' : 'text-gray-400'}`}>REF: {meeting.id}</div>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <div className={`text-sm font-medium line-clamp-1 ${isCancelled ? 'text-red-800' : isPostponed ? 'text-amber-800' : 'text-gray-700'}`}>{meeting.hostUnit}</div>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border shrink-0 ${
                        isCancelled ? 'bg-red-200 text-red-700 border-red-300' : 
                        isPostponed ? 'bg-amber-200 text-amber-700 border-amber-300' : 
                        'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {meeting.chairPerson?.charAt(0) || '?'}
                      </div>
                      <span className={`text-sm font-semibold line-clamp-1 ${isCancelled ? 'text-red-800' : isPostponed ? 'text-amber-800' : 'text-gray-700'}`}>{meeting.chairPerson}</span>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <div className={`text-xs font-bold whitespace-nowrap ${isCancelled ? 'text-red-600' : isPostponed ? 'text-amber-600' : 'text-gray-800'}`}>{new Date(meeting.startTime).toLocaleDateString('vi-VN')}</div>
                    <div className={`text-[11px] font-medium mt-0.5 whitespace-nowrap ${isCancelled ? 'text-red-500/70' : isPostponed ? 'text-amber-500/70' : 'text-gray-500'}`}>
                      {new Date(meeting.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })} - {new Date(meeting.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-center">
                    {isCancelled ? (
                      <span className="px-2.5 py-1 bg-red-700 text-white text-[10px] font-black uppercase rounded-lg shadow-md whitespace-nowrap ring-2 ring-red-200">ĐÃ HUỶ</span>
                    ) : isPostponed ? (
                      <span className="px-2.5 py-1 bg-amber-600 text-white text-[10px] font-black uppercase rounded-lg shadow-md whitespace-nowrap ring-2 ring-amber-100">TẠM HOÃN</span>
                    ) : (
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase rounded-lg border border-blue-100 shadow-sm whitespace-nowrap">
                        {meeting.endpoints?.length || 0} ĐIỂM CẦU
                      </span>
                    )}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => onSelect(meeting)}
                        className={`inline-flex items-center gap-1.5 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 ${
                          isCancelled ? 'bg-red-700 hover:bg-red-800 shadow-red-200' : 
                          isPostponed ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' : 
                          'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                        }`}
                        title="Xem chi tiết"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      {/* Nút Giấy mời */}
                      <button 
                        onClick={() => handleOpenInvitation(meeting.invitationLink)}
                        className={`p-1.5 rounded-lg transition-all border shadow-sm flex items-center gap-1.5 ${
                          meeting.invitationLink 
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white' 
                            : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed opacity-50'
                        }`}
                        title={meeting.invitationLink ? "Xem Giấy mời (Liên kết ngoài)" : "Chưa gán giấy mời"}
                      >
                        <ExternalLink size={14} strokeWidth={2.5} />
                      </button>

                      {isAdmin && (
                        <>
                          <button 
                            onClick={() => onEdit?.(meeting)}
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all border border-emerald-100 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed"
                            title="Chỉnh sửa"
                            disabled={isSpecial}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          
                          <button 
                            onClick={() => setActionMeeting({ meeting, type: 'POSTPONE' })}
                            className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-lg transition-all border border-amber-100 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed"
                            title="Hoãn lịch họp"
                            disabled={isSpecial}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </button>

                          <button 
                            onClick={() => setActionMeeting({ meeting, type: 'CANCEL' })}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all border border-red-100 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed"
                            title="Huỷ lịch họp"
                            disabled={isSpecial}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {actionMeeting && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
             <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                  actionMeeting.type === 'CANCEL' ? 'bg-red-100 text-red-600 shadow-red-100' : 'bg-amber-100 text-amber-600 shadow-amber-100'
                }`}>
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                   <h3 className="text-lg font-black text-gray-900 uppercase">Xác nhận {actionMeeting.type === 'CANCEL' ? 'huỷ lịch' : 'hoãn lịch'}</h3>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Thao tác này sẽ đánh dấu cuộc họp đã bị {actionMeeting.type === 'CANCEL' ? 'huỷ bỏ' : 'tạm hoãn'}</p>
                </div>
             </div>
             
             <div className="space-y-4">
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                   <p className="text-xs font-bold text-gray-500 uppercase tracking-tight mb-1">Cuộc họp:</p>
                   <p className="text-sm font-black text-gray-800 line-clamp-2">{actionMeeting.meeting.title}</p>
                </div>
                
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lý do {actionMeeting.type === 'CANCEL' ? 'huỷ' : 'hoãn'} cuộc họp *</label>
                   <textarea 
                     className={`w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:bg-white outline-none transition-all text-sm font-bold min-h-[100px] resize-none ${
                       actionMeeting.type === 'CANCEL' ? 'focus:ring-red-500/10 focus:border-red-500' : 'focus:ring-amber-500/10 focus:border-amber-500'
                     }`}
                     placeholder={`Nhập lý do ${actionMeeting.type === 'CANCEL' ? 'huỷ' : 'hoãn'}...`}
                     value={reason}
                     onChange={e => setReason(e.target.value)}
                   />
                </div>
             </div>

             <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => { setActionMeeting(null); setReason(''); }}
                  className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                >
                  Bỏ qua
                </button>
                <button 
                  onClick={confirmAction}
                  className={`flex-1 px-6 py-3 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] ${
                    actionMeeting.type === 'CANCEL' ? 'bg-red-600 hover:bg-red-700 shadow-red-100' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-100'
                  }`}
                >
                  Xác nhận {actionMeeting.type === 'CANCEL' ? 'huỷ' : 'hoãn'}
                </button>
             </div>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="px-4 md:px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest hidden md:block">
            Trang {currentPage} / {totalPages}
          </div>
          <div className="flex items-center gap-2 mx-auto md:mx-0">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-xl border transition-all ${
                currentPage === 1 
                  ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed' 
                  : 'bg-white text-blue-600 border-gray-200 hover:border-blue-500 active:scale-95'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingList;
