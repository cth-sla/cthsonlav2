
import React, { useState, useMemo, useEffect } from 'react';
import { Meeting } from '../types';

interface MeetingListProps {
  meetings: Meeting[];
  onSelect: (meeting: Meeting) => void;
  isAdmin?: boolean;
  onEdit?: (meeting: Meeting) => void;
  onDelete?: (id: string) => void;
  onAdd?: () => void;
}

type SortField = 'title' | 'hostUnit' | 'chairPerson' | 'startTime';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

const MeetingList: React.FC<MeetingListProps> = ({ meetings, onSelect, isAdmin, onEdit, onDelete, onAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortField, setSortField] = useState<SortField>('startTime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
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
          comparison = a[sortField].localeCompare(b[sortField], 'vi');
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [meetings, searchTerm, startDate, endDate, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedMeetings.length / ITEMS_PER_PAGE);
  const paginatedMeetings = filteredAndSortedMeetings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleExportExcel = () => {
    if (filteredAndSortedMeetings.length === 0) {
      alert("Không có dữ liệu để xuất.");
      return;
    }

    const header = "Tiêu đề,Đơn vị chủ trì,Cán bộ chủ trì,Thời gian bắt đầu,Thời gian kết thúc,Số điểm cầu,Mô tả\n";
    const rows = filteredAndSortedMeetings.map(m => {
      return `"${m.title.replace(/"/g, '""')}","${m.hostUnit.replace(/"/g, '""')}","${m.chairPerson.replace(/"/g, '""')}","${new Date(m.startTime).toLocaleString('vi-VN', { hour12: false })}","${new Date(m.endTime).toLocaleString('vi-VN', { hour12: false })}","${m.endpoints.length}","${(m.description || '').replace(/"/g, '""')}"`;
    }).join("\n");
    
    const csvContent = "\uFEFF" + header + rows; // Add BOM for Excel Vietnamese support
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
      {/* Filters Header */}
      <div className="p-5 border-b border-gray-100 flex flex-col gap-5 bg-gray-50/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Danh sách các cuộc họp</h2>
              <p className="text-xs text-gray-500 font-medium">Tìm thấy {filteredAndSortedMeetings.length} cuộc họp phù hợp</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative group">
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
            
            <div className="flex gap-2">
              <button 
                onClick={handleExportExcel}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Xuất Excel
              </button>
              
              {isAdmin && onAdd && (
                <button 
                  onClick={onAdd}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                  Lên lịch mới
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Date Range Filters */}
        <div className="flex flex-wrap items-end gap-4 pb-1">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Từ ngày</label>
            <input 
              type="date"
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold text-gray-700 transition-all"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Đến ngày</label>
            <input 
              type="date"
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold text-gray-700 transition-all"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          {(searchTerm || startDate || endDate) && (
            <button 
              onClick={handleResetFilters}
              className="px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-all flex items-center gap-1.5 mb-0.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 text-gray-500 text-[11px] uppercase font-black tracking-widest">
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 group transition-colors"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center">
                  Tên cuộc họp
                  <SortIcon field="title" />
                </div>
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 group transition-colors"
                onClick={() => handleSort('hostUnit')}
              >
                <div className="flex items-center">
                  Đơn vị chủ trì
                  <SortIcon field="hostUnit" />
                </div>
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 group transition-colors"
                onClick={() => handleSort('chairPerson')}
              >
                <div className="flex items-center">
                  Cán bộ chủ trì
                  <SortIcon field="chairPerson" />
                </div>
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 group transition-colors"
                onClick={() => handleSort('startTime')}
              >
                <div className="flex items-center">
                  Thời gian
                  <SortIcon field="startTime" />
                </div>
              </th>
              <th className="px-6 py-4">Số điểm cầu</th>
              <th className="px-6 py-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedMeetings.map((meeting) => (
              <tr key={meeting.id} className="hover:bg-blue-50/30 transition-all group">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors leading-tight text-sm">{meeting.title}</div>
                  <div className="text-[10px] text-gray-400 mt-1 font-mono tracking-tighter">REF: {meeting.id}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-700 font-medium">{meeting.hostUnit}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold border border-blue-100">
                      {meeting.chairPerson.charAt(0)}
                    </div>
                    <span className="text-sm text-gray-700 font-semibold">{meeting.chairPerson}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs font-bold text-gray-800">{new Date(meeting.startTime).toLocaleDateString('vi-VN')}</div>
                  <div className="text-[11px] text-gray-500 font-medium mt-0.5">
                    {new Date(meeting.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })} - {new Date(meeting.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-black uppercase rounded-lg border border-blue-100 shadow-sm">
                      {meeting.endpoints.length} ĐIỂM CẦU
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => onSelect(meeting)}
                      className="inline-flex items-center gap-1.5 text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-200 active:scale-95"
                      title="Xem chi tiết"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    {isAdmin && (
                      <>
                        <button 
                          onClick={() => onEdit?.(meeting)}
                          className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all border border-emerald-100"
                          title="Chỉnh sửa"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button 
                          onClick={() => onDelete?.(meeting.id)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all border border-red-100"
                          title="Xóa"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredAndSortedMeetings.length === 0 && (
          <div className="flex flex-col items-center justify-center p-20 text-gray-400 bg-gray-50/30">
            <div className="p-4 bg-gray-100 rounded-full mb-4">
              <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm font-bold tracking-tight uppercase">Không tìm thấy cuộc họp nào</p>
            <p className="text-xs mt-1">Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc ngày của bạn.</p>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Trang {currentPage} / {totalPages}
          </div>
          <div className="flex items-center gap-2">
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
            
            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                // Logic to show limited page numbers if too many
                if (
                  totalPages > 7 && 
                  page !== 1 && 
                  page !== totalPages && 
                  Math.abs(page - currentPage) > 1
                ) {
                  if (page === 2 && currentPage > 4) return <span key="ellipsis-1" className="text-gray-400">...</span>;
                  if (page === totalPages - 1 && currentPage < totalPages - 3) return <span key="ellipsis-2" className="text-gray-400">...</span>;
                  if (Math.abs(page - currentPage) > 1) return null;
                }

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-[11px] font-black transition-all ${
                      currentPage === page 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                        : 'bg-white text-gray-500 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-xl border transition-all ${
                currentPage === totalPages 
                  ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed' 
                  : 'bg-white text-blue-600 border-gray-200 hover:border-blue-500 active:scale-95'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingList;
