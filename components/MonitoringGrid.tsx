
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Endpoint, EndpointStatus } from '../types';
import { Activity, Radio, AlertCircle, RefreshCw } from 'lucide-react';

interface MonitoringGridProps {
  endpoints: Endpoint[];
  onUpdateEndpoint?: (endpoint: Endpoint) => void;
}

const MonitoringGrid: React.FC<MonitoringGridProps> = ({ endpoints, onUpdateEndpoint }) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const ROW_HEIGHT = 90; 
  const GAP = 16;        
  const ITEM_HEIGHT = ROW_HEIGHT + GAP;
  const BUFFER_ROWS = 2;

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(containerRef.current);
    
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLDivElement;
      setScrollTop(target.scrollTop);
    };

    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll);

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

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

  const { columnCount, visibleEndpoints, totalHeight, offsetY } = useMemo(() => {
    let cols = 1;
    if (containerWidth >= 1024) cols = 4;
    else if (containerWidth >= 640) cols = 2;

    const rowCount = Math.ceil(filteredEndpoints.length / cols);
    const totalH = rowCount * ITEM_HEIGHT - GAP;

    const startRow = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_ROWS);
    const endRow = Math.min(rowCount, Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_ROWS);

    const startIndex = startRow * cols;
    const endIndex = endRow * cols;

    return {
      columnCount: cols,
      visibleEndpoints: filteredEndpoints.slice(startIndex, endIndex),
      totalHeight: Math.max(0, totalH),
      offsetY: startRow * ITEM_HEIGHT
    };
  }, [filteredEndpoints, containerWidth, containerHeight, scrollTop, ITEM_HEIGHT]);

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

  const getStatusIndicator = (status: EndpointStatus) => {
    switch (status) {
      case EndpointStatus.CONNECTED:
        return (
          <div className="relative flex items-center justify-center">
            <Radio className="w-5 h-5 text-green-500 animate-pulse" />
            <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
          </div>
        );
      case EndpointStatus.DISCONNECTED:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case EndpointStatus.CONNECTING:
        return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />;
      default:
        return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Tìm kiếm tên hoặc vị trí..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow bg-white"
          />
          <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center space-x-2">
          <label htmlFor="status-filter" className="text-xs font-bold text-gray-400 uppercase tracking-tight">Trạng thái:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
          >
            <option value="ALL">Tất cả</option>
            <option value={EndpointStatus.CONNECTED}>Online</option>
            <option value={EndpointStatus.DISCONNECTED}>Offline</option>
            <option value={EndpointStatus.CONNECTING}>Đang nạp</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label htmlFor="location-filter" className="text-xs font-bold text-gray-400 uppercase tracking-tight">Vị trí:</label>
          <select
            id="location-filter"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
          >
            <option value="ALL">Khu vực</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-[10px] text-gray-400 font-black uppercase tracking-widest">
          {filteredEndpoints.length} / {endpoints.length} ĐIỂM CẦU
        </div>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto custom-scrollbar relative min-h-[400px]"
        style={{ scrollBehavior: 'auto' }}
      >
        {filteredEndpoints.length > 0 ? (
          <div 
            className="relative w-full"
            style={{ height: `${totalHeight}px` }}
          >
            <div 
              className="absolute inset-x-0 top-0 grid gap-4"
              style={{ 
                transform: `translateY(${offsetY}px)`,
                gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`
              }}
            >
              {visibleEndpoints.map((ep) => (
                <div 
                  key={ep.id} 
                  style={{ height: `${ROW_HEIGHT}px` }}
                  className="group bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4 hover:border-blue-200 hover:shadow-md transition-all animate-in fade-in duration-300"
                >
                  <div className="shrink-0">
                    {getStatusIndicator(ep.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-black text-gray-900 truncate group-hover:text-blue-600 transition-colors leading-tight">{ep.name}</h4>
                    <p className="text-[9px] text-gray-400 truncate uppercase font-bold tracking-widest mt-1">{ep.location}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className={`w-1 h-1 rounded-full ${ep.status === EndpointStatus.CONNECTED ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <p className="text-[8px] text-gray-400 font-medium">Cập nhật: {ep.lastConnected.split(' ')[1] || '---'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => toggleStatus(ep)}
                      disabled={!onUpdateEndpoint}
                      className={`text-[9px] font-black uppercase px-2.5 py-1.5 rounded-xl transition-all shadow-sm ${
                        ep.status === EndpointStatus.CONNECTED ? 'text-green-700 bg-green-50 hover:bg-green-100 border border-green-100' : 
                        ep.status === EndpointStatus.DISCONNECTED ? 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-100' : 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border border-yellow-100'
                      } ${!onUpdateEndpoint ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
                    >
                      {ep.status === EndpointStatus.CONNECTED ? 'Online' : 
                       ep.status === EndpointStatus.DISCONNECTED ? 'Offline' : 'Wait'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center py-16 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="p-4 bg-white rounded-full shadow-sm mb-4">
              <Activity className="w-10 h-10 text-gray-200" />
            </div>
            <p className="text-gray-500 font-bold text-sm">Không tìm thấy dữ liệu phù hợp</p>
            <button 
              onClick={() => { setStatusFilter('ALL'); setLocationFilter('ALL'); setSearchTerm(''); }}
              className="mt-4 text-[10px] text-blue-600 font-black uppercase tracking-widest hover:underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>
      
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
