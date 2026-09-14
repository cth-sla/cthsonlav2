import React, { useState, useEffect } from 'react';
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
  Server,
  Zap,
  Download,
  Globe,
  HelpCircle,
  Cpu,
  Layers
} from 'lucide-react';
import { mysqlClientService, getCustomHostingerApiUrl, setCustomHostingerApiUrl } from '../services/mysqlService';

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
  const [activeTab, setActiveTab] = useState<'http_api' | 'remote_mysql'>('http_api');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [customApiUrl, setCustomApiUrlState] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'success' | 'error' | 'local_preview';
    message: string;
    latencyMs?: number;
    tables?: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCustomApiUrlState(getCustomHostingerApiUrl());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveApiUrl = async () => {
    setCustomHostingerApiUrl(customApiUrl);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    await handleTestConnection();
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

  const handleDownloadApiPhp = () => {
    const link = document.createElement('a');
    link.href = '/api.php';
    link.download = 'api.php';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadDatabaseSql = () => {
    const link = document.createElement('a');
    link.href = '/database.sql';
    link.download = 'database.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isConnected = (testResult ? testResult.status === 'success' : dbStatus.status === 'connected');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-[#0f172a] text-slate-100 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 shrink-0 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner shrink-0">
              <Database size={22} className={isTesting || isSyncing ? 'animate-pulse text-cyan-400' : ''} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Khắc phục & Cấu hình MySQL Hostinger
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isConnected 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {isConnected ? 'MySQL Đã kết nối' : 'Đang chạy Bộ đệm an toàn'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Giải pháp khắc phục triệt để tình trạng mất kết nối hoặc bị giới hạn trên Hostinger
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-900/40 px-6 pt-2 shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('http_api')}
            className={`pb-3 px-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'http_api'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap size={14} className="text-emerald-400" />
            <span>Phương án Tối ưu (Web API qua api.php)</span>
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold rounded-md uppercase">Khuyên dùng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('remote_mysql')}
            className={`pb-3 px-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'remote_mysql'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server size={14} className="text-cyan-400" />
            <span>Kết nối Remote MySQL (Port 3306)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Status Alert Banner */}
          {isConnected ? (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-start gap-3 text-emerald-300">
              <div className="p-1 bg-emerald-500/20 rounded-full shrink-0 mt-0.5">
                <CheckCircle2 size={18} className="text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-emerald-200">
                  Cơ sở dữ liệu MySQL Hostinger đang hoạt động ổn định!
                </h4>
                <p className="text-xs text-emerald-400/90 mt-0.5 leading-relaxed">
                  Hệ thống đang duy trì kết nối persistent và bộ đệm thông minh. Mọi thay đổi về lịch họp, điểm cầu và cấu hình được đồng bộ tức thời.
                </p>
                {testResult?.latencyMs !== undefined && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-900/60 rounded-lg text-[11px] font-mono text-emerald-300">
                    <span>Độ trễ phản hồi: <strong>{testResult.latencyMs}ms</strong></span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-900/90 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-amber-200">
              <div className="p-1 bg-amber-500/20 rounded-full shrink-0 mt-0.5">
                <AlertCircle size={18} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-amber-100">
                  {testResult?.message || dbStatus.message || 'MySQL Hostinger tạm thời bảo vệ kết nối hoặc chưa mở quyền Remote'}
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Hệ thống <strong>tự động chuyển sang Chế độ Bộ đệm An toàn (Safe Local Cache)</strong> để bạn tiếp tục làm việc mà không bao giờ bị mất dữ liệu hay sập ứng dụng.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'http_api' ? (
            /* TAB 1: WEB API HTTP PROXY (KHUYÊN DÙNG CHO HOSTINGER) */
            <div className="space-y-4">
              {/* Giải thích tại sao chọn api.php */}
              <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-900/40 rounded-2xl border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase">
                  <Cpu size={15} />
                  <span>Vì sao nên sử dụng Web API trên chính Hostinger?</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Hostinger Shared Hosting thường giới hạn cổng 3306 từ xa (<code className="text-amber-300 font-bold">500 kết nối/giờ</code> hoặc chặn IP). Khi tải file <code className="text-emerald-300 font-bold">api.php</code> lên hosting của bạn, PHP sẽ kết nối MySQL nội bộ qua <code className="text-cyan-300 font-bold">localhost:3306</code>:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-slate-300">
                    <strong className="text-emerald-400 block mb-0.5">100% Ổn định</strong>
                    Không bị ngắt kết nối hay giới hạn Remote.
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-slate-300">
                    <strong className="text-cyan-400 block mb-0.5">Tốc độ &lt;15ms</strong>
                    Kết nối trực tiếp MySQL nội bộ tốc độ cao.
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-slate-300">
                    <strong className="text-amber-400 block mb-0.5">Không cần mở IP %</strong>
                    Bảo mật tuyệt đối, không cần cấu hình Remote.
                  </div>
                </div>
              </div>

              {/* Ô cấu hình URL API Hostinger */}
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-slate-200">
                  Địa chỉ URL file <code className="text-emerald-400 font-mono">api.php</code> trên Hostinger của bạn:
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="url"
                      value={customApiUrl}
                      onChange={(e) => setCustomApiUrlState(e.target.value)}
                      placeholder="Ví dụ: https://tenmien-cua-ban.com/api.php"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveApiUrl}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shrink-0 shadow-lg shadow-emerald-600/20"
                  >
                    {saveSuccess ? <Check size={14} /> : <Zap size={14} />}
                    <span>{saveSuccess ? 'Đã lưu!' : 'Lưu & Thử kết nối'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  * Để trống ô trên nếu muốn hệ thống sử dụng kết nối Node/Express mặc định.
                </p>
              </div>

              {/* Bộ file tải về */}
              <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Download size={14} className="text-cyan-400" />
                  <span>Tải file mã nguồn để đưa lên Hostinger (File Manager / public_html):</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadApiPhp}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                  >
                    <Download size={13} className="text-emerald-400" />
                    <span>Tải file <strong className="text-emerald-300 font-mono">api.php</strong></span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadDatabaseSql}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                  >
                    <Download size={13} className="text-cyan-400" />
                    <span>Tải cấu trúc CSDL <strong className="text-cyan-300 font-mono">database.sql</strong></span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: REMOTE MYSQL DIRECT (PORT 3306) */
            <div className="space-y-4">
              {/* Configured Parameters Cards */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Server size={14} className="text-indigo-400" />
                    Thông số kết nối MySQL đã thiết lập
                  </span>
                  <span className="text-[10px] text-slate-500 normal-case">Hostinger MySQL</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Host */}
                  <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-colors">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Máy chủ (MYSQL_HOST):</div>
                      <div className="text-xs font-bold font-mono text-emerald-400 mt-0.5">srv1415.hstgr.io</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('host', 'srv1415.hstgr.io')}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                      title="Sao chép"
                    >
                      {copiedKey === 'host' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* Port */}
                  <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Cổng (MYSQL_PORT):</div>
                      <div className="text-xs font-bold font-mono text-slate-200 mt-0.5">3306</div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono pr-2">Mặc định</span>
                  </div>

                  {/* Database */}
                  <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-colors">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Database (MYSQL_DATABASE):</div>
                      <div className="text-xs font-bold font-mono text-cyan-400 mt-0.5">u295972519_lichhop</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('db', 'u295972519_lichhop')}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                      title="Sao chép"
                    >
                      {copiedKey === 'db' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* User */}
                  <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-colors">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Người dùng (MYSQL_USER):</div>
                      <div className="text-xs font-bold font-mono text-indigo-400 mt-0.5">u295972519_lichhop</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('user', 'u295972519_lichhop')}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                      title="Sao chép"
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
                  <span>Các bước mở quyền Remote MySQL trên hPanel Hostinger</span>
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
                      <span className="font-bold text-white">Mục &ldquo;MySQL từ xa&rdquo; (Remote MySQL)</span>
                      <div className="text-slate-400 mt-0.5">
                        Menu bên trái &rarr; <strong>Cơ sở dữ liệu (Databases)</strong> &rarr; chọn <strong>MySQL từ xa (Remote MySQL)</strong>.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                    <div>
                      <span className="font-bold text-white">Thêm quyền truy cập với ký tự <code className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 font-bold rounded font-mono">%</code></span>
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
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-t border-slate-800 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || isSyncing}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={isTesting ? 'animate-spin' : ''} />
              <span>{isTesting ? 'Đang kiểm tra...' : 'Kiểm tra lại kết nối'}</span>
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
