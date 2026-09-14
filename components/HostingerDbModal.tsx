import React, { useState } from 'react';
import { 
  Database, 
  CheckCircle2, 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle, 
  ArrowDownUp,
  Server
} from 'lucide-react';
import { mysqlClientService } from '../services/mysqlService';

interface HostingerDbModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbStatus: {
    status: 'connected' | 'error' | 'syncing' | 'local_preview';
    message?: string;
    details?: string;
  };
  onSyncData?: () => Promise<void>;
}

export const HostingerDbModal: React.FC<HostingerDbModalProps> = ({
  isOpen,
  onClose,
  dbStatus,
  onSyncData
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'success' | 'error' | 'local_preview';
    message: string;
    latencyMs?: number;
    tables?: Record<string, number>;
  } | null>(null);

  if (!isOpen) return null;

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    const startTime = performance.now();
    try {
      const res = await mysqlClientService.testConnection(true);
      const latency = Math.round(performance.now() - startTime);
      setTestResult({
        status: res.status,
        message: res.message,
        latencyMs: latency,
        tables: res.tables
      });
    } catch (err: any) {
      const latency = Math.round(performance.now() - startTime);
      setTestResult({
        status: 'error',
        message: err.message || 'Không thể kết nối đến máy chủ MySQL',
        latencyMs: latency
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSync = async () => {
    if (!onSyncData) return;
    setIsSyncing(true);
    try {
      await onSyncData();
      await handleTestConnection();
    } finally {
      setIsSyncing(false);
    }
  };

  const isConnected = (testResult ? testResult.status === 'success' : dbStatus.status === 'connected');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-[#0f172a] text-slate-100 border border-slate-700/80 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner">
              <Database size={20} className={isTesting || isSyncing ? 'animate-pulse' : ''} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Trạng thái Kết nối MySQL Hostinger
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isConnected 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}>
                  {isConnected ? 'MySQL Online' : 'MySQL Offline'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Thông tin kết nối và hướng dẫn mở quyền Remote MySQL trên Hostinger
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Status Alert Banner */}
          {isConnected ? (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-start gap-3 text-emerald-300">
              <div className="p-1 bg-emerald-500/20 rounded-full shrink-0 mt-0.5">
                <CheckCircle2 size={18} className="text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-emerald-200">
                  Cơ sở dữ liệu MySQL Hostinger đã kết nối!
                </h4>
                <p className="text-xs text-emerald-400/90 mt-0.5 leading-relaxed">
                  Mọi thao tác quản lý lịch họp, điểm cầu, phòng họp và danh mục được lưu trữ an toàn, trực tiếp trên máy chủ Hostinger của bạn.
                </p>
                {testResult?.latencyMs !== undefined && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-900/60 rounded-lg text-[11px] font-mono text-emerald-300">
                    <span>Độ trễ: <strong>{testResult.latencyMs}ms</strong></span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-2xl flex items-start gap-3 text-red-300">
              <div className="p-1 bg-red-500/20 rounded-full shrink-0 mt-0.5">
                <AlertCircle size={18} className="text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-red-200">
                  {testResult?.message || dbStatus.message || 'Chưa thể kết nối trực tiếp đến MySQL Hostinger'}
                </h4>
                <p className="text-xs text-red-300/80 mt-0.5 leading-relaxed">
                  Hệ thống đang kích hoạt bộ nhớ đệm an toàn và bộ đệm trình duyệt để đảm bảo dữ liệu không bị gián đoạn. Hãy kiểm tra lại bước mở quyền Remote MySQL bên dưới.
                </p>
              </div>
            </div>
          )}

          {/* Configured Parameters Cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Server size={14} className="text-indigo-400" />
                Thông số kết nối MySQL đã thiết lập
              </span>
              <span className="text-[10px] text-slate-500 normal-case">Cấu hình Hostinger</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Host */}
              <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-colors">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Máy chủ (MYSQL_HOST):</div>
                  <div className="text-xs font-bold font-mono text-emerald-400 mt-0.5">srv1415.hstgr.io</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('host', 'srv1415.hstgr.io')}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                  title="Sao chép máy chủ"
                >
                  {copiedKey === 'host' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>

              {/* Port */}
              <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Cổng (MYSQL_PORT):</div>
                  <div className="text-xs font-bold font-mono text-slate-200 mt-0.5">3306</div>
                </div>
                <span className="text-[11px] text-slate-500 font-mono pr-2">Mặc định 3306</span>
              </div>

              {/* Database */}
              <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-colors">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Database (MYSQL_DATABASE):</div>
                  <div className="text-xs font-bold font-mono text-cyan-400 mt-0.5">u295972519_lichhop</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('db', 'u295972519_lichhop')}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                  title="Sao chép tên database"
                >
                  {copiedKey === 'db' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>

              {/* User */}
              <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-colors">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Người dùng (MYSQL_USER):</div>
                  <div className="text-xs font-bold font-mono text-indigo-400 mt-0.5">u295972519_lichhop</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('user', 'u295972519_lichhop')}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                  title="Sao chép người dùng"
                >
                  {copiedKey === 'user' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Guide Steps to Enable Remote MySQL */}
          <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wide">
              <ShieldCheck size={16} />
              <span>Các bước kích hoạt Remote MySQL trên Hostinger (Dành cho kết nối từ xa)</span>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                <div>
                  <span className="font-bold text-white">Đăng nhập vào bảng điều khiển Hostinger (hPanel)</span>
                  <div className="text-slate-400 mt-0.5">
                    Truy cập <a href="https://hpanel.hostinger.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">hpanel.hostinger.com <ExternalLink size={10} /></a> và chọn gói Web Hosting của bạn.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                <div>
                  <span className="font-bold text-white">Mở mục &ldquo;MySQL từ xa&rdquo; (Remote MySQL)</span>
                  <div className="text-slate-400 mt-0.5">
                    Tại menu bên trái, tìm mục <strong>Cơ sở dữ liệu (Databases)</strong> &rarr; chọn <strong>MySQL từ xa (Remote MySQL)</strong>.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                <div>
                  <span className="font-bold text-white">Thêm quyền truy cập từ xa với ký tự <code className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 font-bold rounded font-mono">%</code></span>
                  <ul className="mt-1.5 space-y-1 text-slate-400 pl-2 border-l border-slate-700">
                    <li>&bull; <strong className="text-slate-200">Địa chỉ IP (IP Address):</strong> Điền ký tự <code className="text-amber-300 font-bold font-mono">%</code> (cho phép kết nối từ mọi IP máy chủ).</li>
                    <li>&bull; <strong className="text-slate-200">Cơ sở dữ liệu (Database):</strong> Chọn đúng <code className="text-cyan-300 font-mono">u295972519_lichhop</code>.</li>
                    <li>&bull; Nhấn nút <strong className="text-white">Tạo (Create)</strong>.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-800 bg-slate-900/40 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || isSyncing}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={isTesting ? 'animate-spin' : ''} />
              <span>{isTesting ? 'Đang kiểm tra...' : 'Kiểm tra lại kết nối MySQL'}</span>
            </button>

            {onSyncData && (
              <button
                type="button"
                onClick={handleSync}
                disabled={isTesting || isSyncing}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <ArrowDownUp size={14} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ dữ liệu'}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
