
import React, { useState, useMemo, useEffect } from 'react';
import { Endpoint, EndpointStatus, EndpointGroup } from '../types';
import { Activity, Radio, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, MonitorPlay } from 'lucide-react';

interface MonitoringGridProps {
  endpoints: Endpoint[];
  endpointGroups: EndpointGroup[];
  onUpdateEndpoint?: (endpoint: Endpoint) => void;
}

const ITEMS_PER_PAGE = 12;

const MonitoringGrid: React.FC<MonitoringGridProps> = ({ endpoints, endpointGroups = [], onUpdateEndpoint }) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  const getEndpointGroup = (ep: Endpoint): string => {
    if (ep.groupId) return ep.groupId;
    
    const name = (ep.name || '').toUpperCase();
    const location = (ep.location || '').toUpperCase();
    
    if (
      name.includes('UBND') || 
      name.includes('ỦY BAN NHÂN DÂN') || 
      name.includes('HĐND') || 
      name.includes('HỘI ĐỒNG NHÂN DÂN') ||
      name.includes('TỈNH ỦY') ||
      name.includes('TỈNH UỶ') ||
      name.includes('VĂN PHÒNG TỈNH')
    ) {
      return 'TINH';
    }
    
    if (
      name.startsWith('P. ') || 
      name.startsWith('X. ') || 
      name.startsWith('TT. ') || 
      name.includes('PHƯỜNG') || 
      name.includes('XÃ') || 
      name.includes('THỊ TRẤN') ||
      location.includes('PHƯỜNG') ||
      location.includes('XÃ') ||
      location.includes('THỊ TRẤN')
    ) {
      return 'XA_PHUONG';
    }
    
    return 'SO_NGANH';
  };

  const locations = useMemo(() => {
    return Array.from(new Set(endpoints.map(e => e.location))).sort();
  }, [endpoints]);

  const filteredEndpoints = useMemo(() => {
    return endpoints.filter(ep => {
      const matchesStatus = statusFilter === 'ALL' || ep.status === statusFilter;
      const matchesLocation = locationFilter === 'ALL' || ep.location === locationFilter;
      const matchesGroup = groupFilter === 'ALL' || getEndpointGroup(ep) === groupFilter;
      const matchesSearch = ep.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            ep.location.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesLocation && matchesGroup && matchesSearch;
    });
  }, [endpoints, statusFilter, locationFilter, groupFilter, searchTerm]);

  // Reset về trang 1 khi thay đổi bộ lọc hoặc tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, locationFilter, groupFilter, searchTerm]);

  const { paginatedEndpoints, totalPages, startIndex, endIndex } = useMemo(() => {
    const total = filteredEndpoints.length;
    const pages = Math.ceil(total / ITEMS_PER_PAGE);
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = Math.min(start + ITEMS_PER_PAGE, total);
    
    return {
      paginatedEndpoints: filteredEndpoints.slice(start, end),
      totalPages: Math.max(1, pages),
      startIndex: total > 0 ? start + 1 : 0,
      endIndex: end
    };
  }, [filteredEndpoints, currentPage]);

  const toggleStatus = (ep: Endpoint) => {
    if (!onUpdateEndpoint) return;
    
    let nextStatus: EndpointStatus;
    if (ep.status === EndpointStatus.CONNECTED) {
      nextStatus = EndpointStatus.DISCONNECTED;
    } else if (ep.status === EndpointStatus.DISCONNECTED) {
      nextStatus = EndpointStatus.CONNECTING;
    } else {
      nextStatus = EndpointStatus.CONNECTED;
    }

    onUpdateEndpoint({
      ...ep,
      status: nextStatus,
      lastConnected: nextStatus === EndpointStatus.CONNECTED ? new Date().toLocaleString('vi-VN').slice(0, 16) : ep.lastConnected
    });
  };

  const getStatusStyles = (status: EndpointStatus) => {
    switch (status) {
      case EndpointStatus.CONNECTED:
        return {
          card: "bg-emerald-50/30 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20 hover:border-emerald-400 dark:hover:border-emerald-500/50 shadow-sm dark:shadow-none",
          icon: "text-emerald-600 dark:text-emerald-400",
          dot: "bg-emerald-500",
          label: "Online"
        };
      case EndpointStatus.DISCONNECTED:
        return {
          card: "bg-red-50/30 dark:bg-red-500/5 border-red-100 dark:border-red-500/20 hover:border-red-400 dark:hover:border-red-500/50 shadow-sm dark:shadow-none",
          icon: "text-red-600 dark:text-red-400",
          dot: "bg-red-500",
          label: "Offline"
        };
      case EndpointStatus.CONNECTING:
        return {
          card: "bg-amber-50/30 dark:bg-amber-500/5 border-amber-100 dark:border-amber-500/20 hover:border-amber-400 dark:hover:border-amber-500/50 shadow-sm dark:shadow-none",
          icon: "text-amber-600 dark:text-amber-400",
          dot: "bg-amber-500",
          label: "Wait"
        };
      default:
        return {
          card: "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-500/30 shadow-sm",
          icon: "text-slate-400 dark:text-slate-500",
          dot: "bg-slate-300 dark:bg-slate-700",
          label: "Unknown"
        };
    }
  };

  const getStatusIndicator = (status: EndpointStatus) => {
    const styles = getStatusStyles(status);
    switch (status) {
      case EndpointStatus.CONNECTED:
        return (
          <div className="relative flex items-center justify-center">
            <Radio className={`w-6 h-6 ${styles.icon} animate-pulse`} />
            <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
          </div>
        );
      case EndpointStatus.DISCONNECTED:
        return <AlertCircle className={`w-6 h-6 ${styles.icon}`} />;
      case EndpointStatus.CONNECTING:
        return <RefreshCw className={`w-6 h-6 ${styles.icon} animate-spin`} />;
      default:
        return <Activity className={`w-6 h-6 ${styles.icon}`} />;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 pb-4 border-b border-gray-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Tìm kiếm tên hoặc vị trí..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
          />
          <svg className="w-4 h-4 absolute left-3.5 top-3 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <div className="flex items-center space-x-2 shrink-0">
            <label htmlFor="group-filter" className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Nhóm:</label>
            <select
                id="group-filter"
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="text-xs font-bold bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow cursor-pointer text-gray-900 dark:text-white"
            >
                <option value="ALL">Tất cả</option>
                {endpointGroups.map(eg => (
                  <option key={eg.id} value={eg.id}>{eg.name}</option>
                ))}
            </select>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
            <label htmlFor="status-filter" className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Trạng thái:</label>
            <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-bold bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow cursor-pointer text-gray-900 dark:text-white"
            >
                <option value="ALL">Tất cả</option>
                <option value={EndpointStatus.CONNECTED}>Online</option>
                <option value={EndpointStatus.DISCONNECTED}>Offline</option>
                <option value={EndpointStatus.CONNECTING}>Đang nạp</option>
            </select>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
            <label htmlFor="location-filter" className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Vị trí:</label>
            <select
                id="location-filter"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="text-xs font-bold bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow cursor-pointer text-gray-950 dark:text-white"
            >
                <option value="ALL">Khu vực</option>
                {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
                ))}
            </select>
            </div>
        </div>

        <div className="md:ml-auto text-[10px] text-gray-400 dark:text-slate-500 font-black uppercase tracking-widest text-right">
          {filteredEndpoints.length} ĐIỂM CẦU
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative min-h-[400px]">
        {paginatedEndpoints.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1">
            {paginatedEndpoints.map((ep) => {
              const styles = getStatusStyles(ep.status);
              return (
                <div 
                  key={ep.id} 
                  className={`group ${styles.card} p-5 rounded-[2rem] border shadow-sm flex flex-col gap-4 transition-all duration-300 animate-in fade-in zoom-in-95`}
                >
                  <div className="flex items-center justify-between">
                    <div className="shrink-0">
                      {getStatusIndicator(ep.status)}
                    </div>
                    <div className="text-right">
                      <button
                        onClick={() => toggleStatus(ep)}
                        disabled={!onUpdateEndpoint}
                        className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full transition-all shadow-sm ring-1 ring-inset ${
                          ep.status === EndpointStatus.CONNECTED ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 ring-emerald-200 dark:ring-emerald-800/50 hover:bg-emerald-200 dark:hover:bg-emerald-800/50' : 
                          ep.status === EndpointStatus.DISCONNECTED ? 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 ring-red-200 dark:ring-red-800/50 hover:bg-red-200 dark:hover:bg-red-800/50' : 
                          'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 ring-amber-200 dark:ring-amber-800/50 hover:bg-amber-200 dark:hover:bg-amber-800/50'
                        } ${!onUpdateEndpoint ? 'cursor-default opacity-80' : 'cursor-pointer active:scale-95'}`}
                      >
                        {styles.label}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      {(() => {
                        const groupId = getEndpointGroup(ep);
                        const matchedGroup = endpointGroups.find(g => g.id === groupId);
                        const label = matchedGroup ? matchedGroup.name : 'Khác';
                        
                        let badgeStyles = 'bg-amber-50 dark:bg-amber-950/30 text-amber-750 dark:text-amber-400 border border-amber-200/30';
                        if (groupId === 'TINH' || groupId === 'UBND') {
                          badgeStyles = 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-750 dark:text-indigo-400 border border-indigo-200/30';
                        } else if (groupId === 'XA_PHUONG') {
                          badgeStyles = 'bg-teal-50 dark:bg-teal-950/30 text-teal-750 dark:text-teal-400 border border-teal-200/30';
                        }
                        
                        return (
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${badgeStyles}`}>
                            {label}
                          </span>
                        );
                      })()}
                    </div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight uppercase tracking-tight">{ep.name}</h4>
                    <div className="text-[10px] text-gray-500 dark:text-slate-400 truncate uppercase font-bold tracking-widest mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600"></div>
                        {ep.location}
                      </div>
                      {ep.ip1 && (
                        <div className="flex items-center gap-1.5 text-blue-500/70 dark:text-blue-400/70">
                          <div className="w-1 h-1 rounded-full bg-blue-400/30"></div>
                          {ep.ip1}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}></div>
                      <p className="text-[9px] text-gray-400 dark:text-slate-500 font-black uppercase tracking-widest">Update: {ep.lastConnected?.split(' ')[1] || '---'}</p>
                    </div>
                    <div className="text-[9px] text-gray-300 dark:text-slate-600 font-mono tracking-tighter">ID: {ep.id}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center py-16 bg-[#F5F5F5]/50 dark:bg-slate-800/50 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-slate-700">
            <div className="p-5 bg-white dark:bg-slate-800 rounded-full shadow-sm mb-4">
              <MonitorPlay className="w-10 h-10 text-gray-200 dark:text-slate-700" />
            </div>
            <p className="text-gray-500 dark:text-slate-400 font-black text-sm uppercase tracking-widest">Không tìm thấy dữ liệu điểm cầu</p>
            <button 
              onClick={() => { setStatusFilter('ALL'); setLocationFilter('ALL'); setSearchTerm(''); }}
              className="mt-4 text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest hover:underline"
            >
              Thiết lập lại bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 rounded-[2rem] shadow-sm">
          <div className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
            Hiển thị <span className="text-blue-600 dark:text-blue-400">{startIndex}-{endIndex}</span> trong <span className="text-gray-900 dark:text-white">{filteredEndpoints.length}</span> điểm cầu
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`p-2.5 rounded-xl border transition-all ${
                currentPage === 1 
                  ? 'bg-gray-50 dark:bg-slate-800 text-gray-300 dark:text-slate-700 border-gray-100 dark:border-slate-800 cursor-not-allowed' 
                  : 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 active:scale-95'
              }`}
            >
              <ChevronLeft size={18} strokeWidth={3} />
            </button>
            
            <div className="flex items-center px-4 py-2 bg-[#F5F5F5] dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl">
               <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mr-3">Trang</span>
               <span className="text-sm font-black text-blue-600 dark:text-blue-400">{currentPage}</span>
               <span className="text-[10px] font-black text-gray-300 dark:text-slate-600 mx-2">/</span>
               <span className="text-sm font-black text-gray-900 dark:text-white">{totalPages}</span>
            </div>

            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`p-2.5 rounded-xl border transition-all ${
                currentPage === totalPages 
                  ? 'bg-gray-50 dark:bg-slate-800 text-gray-300 dark:text-slate-700 border-gray-100 dark:border-slate-800 cursor-not-allowed' 
                  : 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 active:scale-95'
              }`}
            >
              <ChevronRight size={18} strokeWidth={3} />
            </button>
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E5E7EB;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #D1D5DB;
        }
      `}</style>
    </div>
  );
};

export default MonitoringGrid;
