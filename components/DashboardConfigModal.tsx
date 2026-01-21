
import React from 'react';

export interface StatConfig {
  id: string;
  label: string;
  visible: boolean;
}

interface DashboardConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  configs: StatConfig[];
  onToggle: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
}

const DashboardConfigModal: React.FC<DashboardConfigModalProps> = ({
  isOpen,
  onClose,
  configs,
  onToggle,
  onMove,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Tùy chỉnh Chỉ số</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-500 font-medium mb-4 italic">
            Kéo thả hoặc sử dụng các nút điều hướng để sắp xếp thứ tự hiển thị của các thẻ thông tin trên Dashboard.
          </p>
          
          <div className="space-y-2">
            {configs.map((config, index) => (
              <div 
                key={config.id} 
                className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                  config.visible ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60'
                }`}
              >
                {/* Reorder Buttons */}
                <div className="flex flex-col gap-1">
                  <button 
                    disabled={index === 0}
                    onClick={() => onMove(config.id, 'up')}
                    className="p-1 hover:bg-gray-100 rounded text-gray-400 disabled:opacity-20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button 
                    disabled={index === configs.length - 1}
                    onClick={() => onMove(config.id, 'down')}
                    className="p-1 hover:bg-gray-100 rounded text-gray-400 disabled:opacity-20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <span className={`text-sm font-bold ${config.visible ? 'text-gray-800' : 'text-gray-400'}`}>
                    {config.label}
                  </span>
                </div>

                {/* Visibility Toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={config.visible}
                    onChange={() => onToggle(config.id)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button 
              onClick={onClose}
              className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg active:scale-95 transition-all"
            >
              Hoàn tất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardConfigModal;
