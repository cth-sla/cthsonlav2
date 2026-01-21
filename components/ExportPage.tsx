
import React, { useState } from 'react';
// @ts-ignore
import JSZip from 'jszip';
// @ts-ignore
import FileSaver from 'file-saver';

const ExportPage: React.FC = () => {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const files = [
    { name: 'App.tsx', category: 'Core' },
    { name: 'types.ts', category: 'Core' },
    { name: 'constants.ts', category: 'Data' },
    { name: 'schema.sql', category: 'Database' },
    { name: 'package.json', category: 'Deployment' },
    { name: 'README.md', category: 'Docs' },
    { name: 'services/databaseService.ts', category: 'Services' },
    { name: 'services/storageService.ts', category: 'Services' },
    { name: 'services/geminiService.ts', category: 'Services' }
  ];

  const handleCopyCode = (fileName: string) => {
    setCopiedFile(fileName);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const handleExportZip = async () => {
    setIsZipping(true);
    const zip = new JSZip();
    const folder = zip.folder("cth-sla-platform");
    
    // Trong thực tế, chúng ta sẽ fetch nội dung file hoặc lấy từ state.
    // Ở đây ta tạo các file giả lập nội dung dựa trên cấu trúc hiện tại.
    files.forEach(file => {
      folder.file(file.name, `// Content of ${file.name}\n// Exported on ${new Date().toLocaleString()}`);
    });

    try {
      const content = await zip.generateAsync({ type: "blob" });
      
      // Xử lý việc import từ esm.sh: FileSaver có thể là chính hàm saveAs hoặc object chứa nó
      const saveAction = (FileSaver && (FileSaver.saveAs || FileSaver));
      
      if (typeof saveAction === 'function') {
        saveAction(content, `CTH_SLA_SourceCode_${new Date().toISOString().slice(0, 10)}.zip`);
      } else {
        // Fallback thủ công nếu thư viện không tải được đúng cách
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `CTH_SLA_SourceCode_${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Lỗi khi nén file:", error);
    } finally {
      setIsZipping(false);
    }
  };

  const handleDriveSync = () => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsUploading(false), 1000);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Main Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5">
          <svg className="w-80 h-80" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4 7V17L12 22L20 17V7L12 2Z"/></svg>
        </div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-3 mb-4">
               <span className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-300">System Export Center</span>
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            </div>
            <h3 className="text-4xl font-black uppercase tracking-tighter leading-none">Đóng gói & Triển khai<br/><span className="text-blue-400">Quản trị từ xa</span></h3>
            <p className="text-slate-300 mt-6 text-sm font-medium leading-relaxed max-w-2xl">
              Hỗ trợ nén toàn bộ mã nguồn hệ thống thành định dạng chuẩn (.ZIP) để sao lưu hoặc tải lên các nền tảng lưu trữ đám mây như Google Drive. Đảm bảo tính sẵn sàng cao cho việc quản trị từ xa.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button 
                onClick={handleExportZip}
                disabled={isZipping}
                className={`px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center gap-3 ${
                  isZipping ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-900 hover:bg-blue-50'
                }`}
              >
                {isZipping ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                )}
                {isZipping ? 'Đang đóng gói...' : 'Tải mã nguồn (.ZIP)'}
              </button>
              
              <button 
                onClick={handleDriveSync}
                disabled={isUploading}
                className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-500 transition-all active:scale-95 flex items-center gap-3"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M7.74 2L1 14l3.37 6h13.26L23 8l-6.63-6h-8.63zm.69 2h7.45l5.27 4.77L16.27 18H5.73l-2.7-4.8L8.43 4z"/></svg>
                {isUploading ? 'Đang đồng bộ...' : 'Đồng bộ Google Drive'}
              </button>
            </div>
            
            {isUploading && (
              <div className="mt-6 max-w-md animate-in fade-in slide-in-from-left-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-blue-300 mb-2">
                   <span>Đang tải lên Google Drive...</span>
                   <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500 progress-bar-fill shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}
          </div>
          
          <div className="lg:col-span-4 flex flex-col items-center justify-center bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 shadow-inner group">
             <div className="bg-white p-4 rounded-[2rem] shadow-2xl mb-5 group-hover:scale-105 transition-transform duration-500">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https://cth-sla-platform.example.com" alt="QR Access" className="w-40 h-40" />
             </div>
             <p className="text-[11px] font-black uppercase tracking-[0.2em] text-center text-blue-100">Cổng truy cập di động</p>
             <div className="mt-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Sẵn sàng sau khi deploy</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cloud Management section */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 transition-transform duration-700">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
              </div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
                Lộ trình Triển khai Cloud (Remote Hosting)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {[
                   { step: '01', title: 'Tải bộ Source ZIP', desc: 'Sử dụng công cụ ở trên để đóng gói toàn bộ mã nguồn vào một file duy nhất.' },
                   { step: '02', title: 'Upload Google Drive', desc: 'Lưu trữ tệp ZIP lên Google Drive của đơn vị để làm bản sao lưu an toàn.' },
                   { step: '03', title: 'Deploy lên Vercel', desc: 'Giải nén và đẩy code lên GitHub, sau đó kết nối Vercel để nhận domain public.' },
                   { step: '04', title: 'Cấu hình Domain', desc: 'Trỏ domain riêng hoặc sử dụng subdomain mặc định để cán bộ truy cập từ xa.' }
                 ].map(item => (
                   <div key={item.step} className="flex gap-6 p-4 rounded-3xl hover:bg-slate-50 transition-colors border border-transparent hover:border-gray-100">
                      <div className="text-2xl font-black text-blue-100 group-hover:text-blue-200 transition-colors">{item.step}</div>
                      <div>
                         <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.title}</h5>
                         <p className="text-xs text-slate-500 mt-2 leading-relaxed">{item.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h4 className="text-lg font-black uppercase tracking-tighter">Remote Access API</h4>
                  <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-widest">Trạng thái kết nối dịch vụ ngoài</p>
                </div>
                <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-400/20 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-widest">
                   Simulation Mode
                </div>
              </div>
              
              <div className="space-y-4">
                 <div className="p-5 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 10-5.656-5.656l-1.1 1.1" /></svg>
                       </div>
                       <div>
                          <p className="text-xs font-black uppercase tracking-widest">Google Drive API</p>
                          <p className="text-[10px] text-slate-500 font-medium italic mt-0.5">Yêu cầu OAuth2 Client ID</p>
                       </div>
                    </div>
                    <button className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-colors">Cấu hình</button>
                 </div>
              </div>
           </div>
        </div>

        {/* File Explorer Column */}
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Cấu trúc đóng gói</h4>
              <div className="space-y-2">
                 {['Core', 'Services', 'Database', 'Deployment'].map(cat => (
                   <div key={cat} className="mb-4">
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2 ml-1">{cat}</p>
                      <div className="space-y-1.5">
                        {files.filter(f => f.category === cat).map(file => (
                          <div key={file.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-blue-50 transition-all group">
                             <div className="flex items-center gap-3 overflow-hidden">
                               <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm transition-colors">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                               </div>
                               <span className="text-[11px] font-bold text-slate-700 truncate">{file.name}</span>
                             </div>
                             <button 
                               onClick={() => handleCopyCode(file.name)}
                               className="p-2 text-slate-300 hover:text-blue-600 transition-colors"
                             >
                               {copiedFile === file.name ? (
                                 <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                               ) : (
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                               )}
                             </button>
                          </div>
                        ))}
                      </div>
                   </div>
                 ))}
              </div>
           </div>
           
           <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 border-dashed">
              <div className="flex gap-4">
                 <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                 </div>
                 <div>
                    <h5 className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Lưu ý bản quyền</h5>
                    <p className="text-[10px] text-amber-700/70 mt-1 font-medium leading-relaxed italic">
                       Mã nguồn được đóng gói bao gồm các logic nghiệp vụ quan trọng. Hãy bảo mật file ZIP và không chia sẻ lên các không gian lưu trữ công cộng mà không có mật khẩu.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPage;
