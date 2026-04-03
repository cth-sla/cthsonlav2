
import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, Edit2, Trash2, FileUp, Download, UserPlus, Phone, Briefcase, Building2, X, Check, AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { SystemOperator, Endpoint } from '../types';

interface OperatorManagementProps {
  operators: SystemOperator[];
  endpoints: Endpoint[];
  onAdd: (o: Omit<SystemOperator, 'id'>) => Promise<void>;
  onUpdate: (o: SystemOperator) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onImport: (operators: Omit<SystemOperator, 'id'>[]) => Promise<void>;
}

const OperatorManagement: React.FC<OperatorManagementProps> = ({ 
  operators, endpoints, onAdd, onUpdate, onDelete, onImport 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<SystemOperator | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    position: '',
    endpointId: '',
    phone: ''
  });

  const filteredOperators = useMemo(() => {
    return operators.filter(o => {
      const endpoint = endpoints.find(e => e.id === o.endpointId);
      const endpointName = endpoint?.name || '';
      
      const matchesSearch = 
        o.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.phone.includes(searchTerm) ||
        o.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        endpointName.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesEndpoint = selectedEndpointId === 'all' || o.endpointId === selectedEndpointId;
      
      return matchesSearch && matchesEndpoint;
    });
  }, [operators, searchTerm, selectedEndpointId, endpoints]);

  const handleOpenModal = (operator?: SystemOperator) => {
    if (operator) {
      setEditingOperator(operator);
      setFormData({
        fullName: operator.fullName,
        position: operator.position,
        endpointId: operator.endpointId,
        phone: operator.phone
      });
    } else {
      setEditingOperator(null);
      setFormData({
        fullName: '',
        position: '',
        endpointId: endpoints[0]?.id || '',
        phone: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOperator) {
        await onUpdate({ ...editingOperator, ...formData });
      } else {
        await onAdd(formData);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Lỗi lưu cán bộ:", error);
      alert("Có lỗi xảy ra khi lưu thông tin.");
    }
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const importedOperators: Omit<SystemOperator, 'id'>[] = data.map(row => {
          // Tìm endpointId dựa trên tên đơn vị trong Excel
          const unitName = row['Đơn vị'] || row['Unit'] || '';
          const endpoint = endpoints.find(ep => ep.name.toLowerCase().includes(unitName.toLowerCase()));
          
          return {
            fullName: row['Họ và Tên'] || row['FullName'] || 'N/A',
            position: row['Chức vụ'] || row['Position'] || 'Cán bộ',
            endpointId: endpoint?.id || endpoints[0]?.id || '',
            phone: String(row['Số điện thoại'] || row['Phone'] || '')
          };
        });

        if (importedOperators.length > 0) {
          await onImport(importedOperators);
          alert(`Đã nhập thành công ${importedOperators.length} cán bộ.`);
        }
      } catch (error) {
        console.error("Lỗi import Excel:", error);
        alert("Lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng.");
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const template = [
      { 'Họ và Tên': 'Nguyễn Văn A', 'Chức vụ': 'Cán bộ vận hành', 'Đơn vị': endpoints[0]?.name || 'Tên điểm cầu', 'Số điện thoại': '0912345678' }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Danh_Ba_Can_Bo.xlsx");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <UserPlus className="text-blue-600" />
            Danh bạ Cán bộ Vận hành
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Quản lý đầu mối cán bộ kỹ thuật tại các điểm cầu xã/phường.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-bold text-sm shadow-sm"
          >
            <Download size={18} />
            Mẫu Excel
          </button>
          
          <label className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-all font-bold text-sm shadow-sm cursor-pointer">
            <FileUp size={18} />
            {isImporting ? 'Đang nhập...' : 'Nhập Excel'}
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleExcelImport} disabled={isImporting} />
          </label>

          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold text-sm shadow-lg shadow-blue-200 dark:shadow-none"
          >
            <Plus size={18} />
            Thêm mới
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 dark:border-slate-700 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên, số điện thoại, chức vụ, đơn vị..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="w-full md:w-64">
            <select 
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
              value={selectedEndpointId}
              onChange={(e) => setSelectedEndpointId(e.target.value)}
            >
              <option value="all">Tất cả Đơn vị (Điểm cầu)</option>
              {endpoints.map(ep => (
                <option key={ep.id} value={ep.id}>{ep.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-gray-50/50 dark:bg-slate-900/50 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Họ và Tên</th>
                <th className="px-8 py-4">Chức vụ</th>
                <th className="px-8 py-4">Đơn vị (Điểm cầu)</th>
                <th className="px-8 py-4">Số điện thoại</th>
                <th className="px-8 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
              {filteredOperators.length > 0 ? (
                filteredOperators.map(o => {
                  const endpoint = endpoints.find(e => e.id === o.endpointId);
                  return (
                    <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all">
                      <td className="px-8 py-5">
                        <div className="font-bold text-slate-900 dark:text-white">{o.fullName}</div>
                        <div className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5 font-mono">ID: {o.id}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Briefcase size={14} className="text-blue-500" />
                          {o.position}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold">
                          <Building2 size={14} className="text-emerald-500" />
                          {endpoint?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <a href={`tel:${o.phone}`} className="flex items-center gap-2 text-blue-600 hover:underline font-bold">
                          <Phone size={14} />
                          {o.phone}
                        </a>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleOpenModal(o)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => { if(window.confirm('Xóa cán bộ này?')) onDelete(o.id); }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic">
                    Không tìm thấy cán bộ nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm/Sửa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white/10">
            <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {editingOperator ? 'Cập nhật thông tin' : 'Thêm cán bộ mới'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Vui lòng điền đầy đủ các thông tin bên dưới.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Họ và Tên</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Chức vụ</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData.position}
                    onChange={e => setFormData({...formData, position: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Đơn vị (Điểm cầu)</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData.endpointId}
                    onChange={e => setFormData({...formData, endpointId: e.target.value})}
                  >
                    <option value="">Chọn điểm cầu...</option>
                    {endpoints.map(ep => (
                      <option key={ep.id} value={ep.id}>{ep.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Số điện thoại</label>
                  <input 
                    required
                    type="tel" 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
                >
                  {editingOperator ? 'Cập nhật' : 'Lưu thông tin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorManagement;
