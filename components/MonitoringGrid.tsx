
import React, { useState, useMemo, useEffect } from 'react';
import { Endpoint, EndpointStatus } from '../types';
import { Activity, Radio, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, MonitorPlay } from 'lucide-react';

interface MonitoringGridProps {
  endpoints: Endpoint[];
  onUpdateEndpoint?: (endpoint: Endpoint) => void;
}

const ITEMS_PER_PAGE = 12;

const MonitoringGrid: React.FC<MonitoringGridProps> = ({ endpoints, onUpdateEndpoint }) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  const locations = useMemo(() => {
    return Array.from(new Set(endpoints.map(e => e.location))).sort();
  }, [endpoints]);

  const filteredEndpoints = useMemo(() => {
    return endpoints.filter(ep => {
      const matchesStatus = statusFilter === 'ALL' || ep.status === statusFilter;
      const matchesLocation = locationFilter === 'ALL' || ep.location === locationFilter;
      const matchesSearch = ep.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            ep.location.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesLocation && matchesSearch;
    });
  }, [endpoints, statusFilter, locationFilter, searchTerm]);

  // Reset về trang 1 khi thay đổi bộ lọc hoặc tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, locationFilter, searchTerm]);

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
          card: "bg-emerald-50 border-emerald-200 hover:border-emerald-400 shadow-emerald-100/50",
          icon: "text-emerald-600",
          dot: "bg-emerald-500",
          label: "Online"
        };
      case EndpointStatus.DISCONNECTED:
        return {
          card: "bg-red-50 border-red-200 hover:border-red-400 shadow-red-100/50",
          icon: "text-red-600",
          dot: "bg-red-500",
          label: "Offline"
        };
      case EndpointStatus.CONNECTING:
        return {
          card: "bg-amber-50 border-amber-200 hover:border-amber-400 shadow-amber-100/50",
          icon: "text-amber-600",
          dot: "bg-amber-500",
          label: "Wait"
        };
      default:
        return {
          card: "bg-white border-gray-100 hover:border-blue-200 shadow-sm",
          icon: "text-gray-400",
          dot: "bg-gray-300",
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
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 pb-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Tìm kiếm tên hoặc vị trí..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all bg-white"
          />
          <svg className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <div className="flex items-center space-x-2 shrink-0">
            <label htmlFor="status-filter" className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Trạng thái:</label>
            <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-bold bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow cursor-pointer"
            >
                <option value="ALL">Tất cả</option>
                <option value={EndpointStatus.CONNECTED}>Online</option>
                <option value={EndpointStatus.DISCONNECTED}>Offline</option>
                <option value={EndpointStatus.CONNECTING}>Đang nạp</option>
            </select>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
            <label htmlFor="location-filter" className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Vị trí:</label>
            <select
                id="location-filter"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="text-xs font-bold bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow cursor-pointer"
            >
                <option value="ALL">Khu vực</option>
                {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
                ))}
            </select>
            </div>
        </div>

        <div className="md:ml-auto text-[10px] text-gray-400 font-black uppercase tracking-widest text-right">
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
                          ep.status === EndpointStatus.CONNECTED ? 'text-emerald-700 bg-emerald-100 ring-emerald-200 hover:bg-emerald-200' : 
                          ep.status === EndpointStatus.DISCONNECTED ? 'text-red-700 bg-red-100 ring-red-200 hover:bg-red-200' : 
                          'text-amber-700 bg-amber-100 ring-amber-200 hover:bg-amber-200'
                        } ${!onUpdateEndpoint ? 'cursor-default opacity-80' : 'cursor-pointer active:scale-95'}`}
                      >
                        {styles.label}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-gray-900 truncate group-hover:text-blue-600 transition-colors leading-tight uppercase tracking-tight">{ep.name}</h4>
                    <p className="text-[10px] text-gray-500 truncate uppercase font-bold tracking-widest mt-1.5 flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                      {ep.location}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-black/5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}></div>
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Update: {ep.lastConnected?.split(' ')[1] || '---'}</p>
                    </div>
                    <div className="text-[9px] text-gray-300 font-mono tracking-tighter">ID: {ep.id}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center py-16 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
            <div className="p-5 bg-white rounded-full shadow-sm mb-4">
              <MonitorPlay className="w-10 h-10 text-gray-200" />
            </div>
            <p className="text-gray-500 font-black text-sm uppercase tracking-widest">Không tìm thấy dữ liệu điểm cầu</p>
            <button 
              onClick={() => { setStatusFilter('ALL'); setLocationFilter('ALL'); setSearchTerm(''); }}
              className="mt-4 text-[10px] text-blue-600 font-black uppercase tracking-widest hover:underline"
            >
              Thiết lập lại bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 bg-white p-4 rounded-[2rem] shadow-sm">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Hiển thị <span className="text-blue-600">{startIndex}-{endIndex}</span> trong <span className="text-gray-900">{filteredEndpoints.length}</span> điểm cầu
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`p-2.5 rounded-xl border transition-all ${
                currentPage === 1 
                  ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' 
                  : 'bg-white text-blue-600 border-gray-200 hover:border-blue-500 hover:bg-blue-50 active:scale-95'
              }`}
            >
              <ChevronLeft size={18} strokeWidth={3} />
            </button>
            
            <div className="flex items-center px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl">
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-3">Trang</span>
               <span className="text-sm font-black text-blue-600">{currentPage}</span>
               <span className="text-[10px] font-black text-gray-300 mx-2">/</span>
               <span className="text-sm font-black text-gray-900">{totalPages}</span>
            </div>

            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`p-2.5 rounded-xl border transition-all ${
                currentPage === totalPages 
                  ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' 
                  : 'bg-white text-blue-600 border-gray-200 hover:border-blue-500 hover:bg-blue-50 active:scale-95'
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
