
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Endpoint, EndpointStatus } from '../types';

interface MonitoringGridProps {
  endpoints: Endpoint[];
  onUpdateEndpoint?: (endpoint: Endpoint) => void;
}

const MonitoringGrid: React.FC<MonitoringGridProps> = ({ endpoints, onUpdateEndpoint }) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Virtualization State
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Constants for virtualization
  const ROW_HEIGHT = 86; // Approximate card height
  const GAP = 16;        // gap-4
  const ITEM_HEIGHT = ROW_HEIGHT + GAP;
  const BUFFER_ROWS = 2;

  // Track container dimensions and scroll
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

  // Dynamically extract unique locations
  const locations = useMemo(() => {
    return Array.from(new Set(endpoints.map(e => e.location))).sort();
  }, [endpoints]);

  // Filter logic
  const filteredEndpoints = useMemo(() => {
    return endpoints.filter(ep => {
      const matchesStatus = statusFilter === 'ALL' || ep.status === statusFilter;
      const matchesLocation = locationFilter === 'ALL' || ep.location === locationFilter;
      const matchesSearch = ep.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            ep.location.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesLocation && matchesSearch;
    });
  }, [endpoints, statusFilter, locationFilter, searchTerm]);

  // Virtualization Calculations
  const { columnCount, visibleEndpoints, totalHeight, offsetY } = useMemo(() => {
    // Determine columns based on container width
    let cols = 1;
    if (containerWidth >= 1024) cols = 4;
    else if (containerWidth >= 640) cols = 2;

    const rowCount = Math.ceil(filteredEndpoints.length / cols);
    const totalH = rowCount * ITEM_HEIGHT - GAP;

    // Calculate which rows are visible
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

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Filter Controls - Fixed height section */}
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
            <option value={EndpointStatus.CONNECTED}>Đang kết nối</option>
            <option value={EndpointStatus.DISCONNECTED}>Mất kết nối</option>
            <option value={EndpointStatus.CONNECTING}>Đang thử lại</option>
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
            <option value="ALL">Tất cả khu vực</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-xs text-gray-400 font-medium italic">
          {filteredEndpoints.length} / {endpoints.length} điểm cầu
        </div>
      </div>

      {/* Scrollable Container for Virtual Grid */}
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
                  className="group bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4 hover:border-blue-200 hover:shadow-md transition-all animate-in fade-in duration-300"
                >
                  <div className={`w-3 h-3 rounded-full shrink-0 ${
                    ep.status === EndpointStatus.CONNECTED ? 'bg-green-500 animate-pulse' : 
                    ep.status === EndpointStatus.DISCONNECTED ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{ep.name}</h4>
                    <p className="text-[10px] text-gray-500 truncate uppercase font-semibold tracking-tight">{ep.location}</p>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => toggleStatus(ep)}
                      disabled={!onUpdateEndpoint}
                      className={`text-[10px] font-black uppercase px-2 py-1 rounded-md transition-all shadow-sm ${
                        ep.status === EndpointStatus.CONNECTED ? 'text-green-700 bg-green-50 hover:bg-green-100 border border-green-100' : 
                        ep.status === EndpointStatus.DISCONNECTED ? 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-100' : 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border border-yellow-100'
                      } ${!onUpdateEndpoint ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
                      title={onUpdateEndpoint ? "Nhấp để chuyển trạng thái" : undefined}
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
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-bold text-sm">Không tìm thấy dữ liệu phù hợp</p>
            <button 
              onClick={() => { setStatusFilter('ALL'); setLocationFilter('ALL'); setSearchTerm(''); }}
              className="mt-4 text-xs text-blue-600 font-black uppercase tracking-widest hover:underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
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
