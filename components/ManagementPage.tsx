
import React, { useState, useEffect, useRef } from 'react';
import { Unit, Staff, ParticipantGroup, Endpoint, EndpointStatus, SystemSettings, EndpointGroup } from '../types';
import { Upload, X, Trash2, Image as ImageIcon, Phone, QrCode } from 'lucide-react';

interface ManagementPageProps {
  units: Unit[];
  staff: Staff[];
  participantGroups: ParticipantGroup[];
  endpoints: Endpoint[];
  endpointGroups: EndpointGroup[];
  systemSettings: SystemSettings;
  initialTab?: 'units' | 'staff' | 'groups' | 'endpointGroups' | 'endpoints' | 'settings' | 'ads';
  onAddUnit: (unit: Omit<Unit, 'id'>) => void;
  onUpdateUnit: (unit: Unit) => void;
  onAddStaff: (staff: Omit<Staff, 'id'>) => void;
  onUpdateStaff: (staff: Staff) => void;
  onAddGroup: (group: Omit<ParticipantGroup, 'id'>) => void;
  onUpdateGroup: (group: ParticipantGroup) => void;
  onAddEndpoint: (endpoint: Omit<Endpoint, 'id' | 'status' | 'lastConnected'>) => void;
  onUpdateEndpoint: (endpoint: Endpoint) => void;
  onAddEndpointGroup: (group: Omit<EndpointGroup, 'id'>) => void;
  onUpdateEndpointGroup: (group: EndpointGroup) => void;
  onDeleteUnit: (id: string) => void;
  onDeleteStaff: (id: string) => void;
  onDeleteGroup: (id: string) => void;
  onDeleteEndpoint: (id: string) => void;
  onDeleteEndpointGroup: (id: string) => void;
  onUpdateSettings: (settings: SystemSettings) => void;
}

const ManagementPage: React.FC<ManagementPageProps> = ({
  units,
  staff,
  participantGroups,
  endpoints,
  endpointGroups = [],
  systemSettings,
  initialTab,
  onAddUnit,
  onUpdateUnit,
  onAddStaff,
  onUpdateStaff,
  onAddGroup,
  onUpdateGroup,
  onAddEndpoint,
  onUpdateEndpoint,
  onAddEndpointGroup,
  onUpdateEndpointGroup,
  onDeleteUnit,
  onDeleteStaff,
  onDeleteGroup,
  onDeleteEndpoint,
  onDeleteEndpointGroup,
  onUpdateSettings
}) => {
  const [activeTab, setActiveTab] = useState<'units' | 'staff' | 'groups' | 'endpointGroups' | 'endpoints' | 'settings' | 'ads'>(initialTab || 'units');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [searchTerm, setSearchTerm] = useState('');
  const [endpointGroup, setEndpointGroup] = useState<string>('ALL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [settingsForm, setSettingsForm] = useState<SystemSettings>(systemSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSettingsForm(systemSettings);
  }, [systemSettings]);

  const handleBannerImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // Giới hạn 1MB
        alert("Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedBanners = settingsForm.banners?.map(b => 
          b.id === id ? { ...b, image: reader.result as string } : b
        ) || [];
        setSettingsForm({ ...settingsForm, banners: updatedBanners });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBannerImage = (id: string) => {
    const updatedBanners = settingsForm.banners?.map(b => 
      b.id === id ? { ...b, image: '' } : b
    ) || [];
    setSettingsForm({ ...settingsForm, banners: updatedBanners });
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // Giới hạn 1MB
        alert("Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettingsForm({ ...settingsForm, supportQrBase64: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeQr = () => {
    setSettingsForm({ ...settingsForm, supportQrBase64: '' });
  };

  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStaff = staff.filter(s => 
    (s.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.position || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = participantGroups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEndpointGroups = endpointGroups.filter(eg =>
    eg.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const filteredEndpoints = endpoints.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.location.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (endpointGroup === 'ALL') return true;
    return getEndpointGroup(e) === endpointGroup;
  });

  const getUnitName = (id: string) => units.find(u => u.id === id)?.name || 'N/A';

  const openModal = (item: any = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({ ...item });
    } else {
      if (activeTab === 'units') setFormData({ name: '', code: '', description: '' });
      else if (activeTab === 'staff') setFormData({ fullName: '', position: '', unitId: '', email: '', phone: '' });
      else if (activeTab === 'endpoints') setFormData({ name: '', location: '', status: EndpointStatus.DISCONNECTED, groupId: '' });
      else if (activeTab === 'groups') setFormData({ name: '', description: '' });
      else if (activeTab === 'endpointGroups') setFormData({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'units') {
      editingItem ? onUpdateUnit(formData as Unit) : onAddUnit(formData as Omit<Unit, 'id'>);
    } else if (activeTab === 'staff') {
      editingItem ? onUpdateStaff(formData as Staff) : onAddStaff(formData as Omit<Staff, 'id'>);
    } else if (activeTab === 'endpoints') {
      editingItem ? onUpdateEndpoint(formData as Endpoint) : onAddEndpoint(formData as Omit<Endpoint, 'id' | 'status' | 'lastConnected'>);
    } else if (activeTab === 'groups') {
      editingItem ? onUpdateGroup(formData as ParticipantGroup) : onAddGroup(formData as Omit<ParticipantGroup, 'id'>);
    } else if (activeTab === 'endpointGroups') {
      editingItem ? onUpdateEndpointGroup(formData as EndpointGroup) : onAddEndpointGroup(formData as Omit<EndpointGroup, 'id'>);
    }
    closeModal();
  };

  const handleSaveSettings = () => {
    onUpdateSettings(settingsForm);
    alert('Đã cập nhật cấu hình hệ thống!');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // Giới hạn 1MB
        alert("Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettingsForm({ ...settingsForm, logoBase64: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setSettingsForm({ ...settingsForm, logoBase64: '' });
  };

  const primaryTextStyle = { color: systemSettings.primaryColor };
  const primaryBgStyle = { backgroundColor: systemSettings.primaryColor };

  return (
    <div className="space-y-6">
      {initialTab !== 'ads' && (
        <div className="flex flex-col md:flex-row justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex bg-[#F5F5F5] dark:bg-slate-800 p-1 rounded-lg overflow-x-auto no-scrollbar">
            {['units', 'staff', 'groups', 'endpointGroups', 'endpoints', 'settings'].map((tab) => (
              <button 
                key={tab}
                onClick={() => { setActiveTab(tab as any); setSearchTerm(''); setEndpointGroup('ALL'); }}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-gray-550 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                style={activeTab === tab ? primaryTextStyle : {}}
              >
                {tab === 'units' ? 'Đơn vị' : 
                 tab === 'staff' ? 'Cán bộ' : 
                 tab === 'groups' ? 'Thành phần' : 
                 tab === 'endpointGroups' ? 'Nhóm điểm cầu' : 
                 tab === 'endpoints' ? 'Điểm cầu' : 
                 tab === 'settings' ? 'Hệ thống' : 'Quảng cáo'}
              </button>
            ))}
          </div>

          {activeTab !== 'settings' && activeTab !== 'ads' && (
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Tìm kiếm..."
                  className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-48 transition-all bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg className="w-4 h-4 absolute left-3 top-2 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <button 
                onClick={() => openModal()}
                style={primaryBgStyle}
                className="text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:brightness-110 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
              >
                Thêm mới
              </button>
            </div>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto">
        {activeTab === 'units' && (
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-[#F5F5F5] dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Tên đơn vị</th>
                <th className="px-6 py-4">Mã đơn vị</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredUnits.map(unit => (
                <tr key={unit.id} className="hover:bg-[#F5F5F5] dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{unit.name}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-slate-400 font-mono text-xs">{unit.code}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openModal(unit)} className="text-blue-600 font-bold hover:underline">Sửa</button>
                    <button onClick={() => onDeleteUnit(unit.id)} className="text-red-600 font-bold hover:underline">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'staff' && (
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-[#F5F5F5] dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Cán bộ chủ trì</th>
                <th className="px-6 py-4">Chức vụ</th>
                <th className="px-6 py-4">Đơn vị công tác</th>
                <th className="px-6 py-4">Liên hệ</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredStaff.map(s => (
                <tr key={s.id} className="hover:bg-[#F5F5F5] dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs">
                        {s.fullName?.split(' ').filter(Boolean).pop()?.[0] || 'C'}
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">{s.fullName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-slate-300 font-medium">{s.position}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase tracking-tight text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {getUnitName(s.unitId)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[10px] space-y-0.5">
                      <p className="text-gray-400 dark:text-slate-500 uppercase font-black tracking-tighter">E: {s.email || '---'}</p>
                      <p className="text-gray-400 dark:text-slate-500 uppercase font-black tracking-tighter">P: {s.phone || '---'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button onClick={() => openModal(s)} className="text-blue-600 font-black text-xs uppercase tracking-widest hover:underline">Sửa</button>
                    <button onClick={() => onDeleteStaff(s.id)} className="text-red-600 font-black text-xs uppercase tracking-widest hover:underline">Xóa</button>
                  </td>
                </tr>
              ))}
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">Không tìm thấy cán bộ nào trong danh mục.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'groups' && (
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-[#F5F5F5] dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Tên nhóm</th>
                <th className="px-6 py-4">Mô tả</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredGroups.map(g => (
                <tr key={g.id} className="hover:bg-[#F5F5F5] dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{g.name}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{g.description || '---'}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openModal(g)} className="text-blue-600 font-bold hover:underline">Sửa</button>
                    <button onClick={() => onDeleteGroup(g.id)} className="text-red-600 font-bold hover:underline">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'endpointGroups' && (
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-[#F5F5F5] dark:bg-slate-800/50 text-gray-550 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Tên nhóm</th>
                <th className="px-6 py-4">Mô tả</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredEndpointGroups.map(eg => (
                <tr key={eg.id} className="hover:bg-[#F5F5F5] dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{eg.name}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{eg.description || '---'}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openModal(eg)} className="text-blue-600 font-bold hover:underline">Sửa</button>
                    <button onClick={() => onDeleteEndpointGroup(eg.id)} className="text-red-600 font-bold hover:underline">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'endpoints' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50/50 dark:bg-slate-800/10 border-b border-gray-100 dark:border-slate-850 gap-3">
              <div className="flex flex-wrap gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto border border-gray-200/50 dark:border-slate-700">
                {[{ id: 'ALL', name: 'Tất cả' }, ...endpointGroups].map((group) => {
                  return (
                    <button
                      key={group.id}
                      onClick={() => setEndpointGroup(group.id)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all uppercase tracking-wider ${
                        endpointGroup === group.id
                          ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm'
                          : 'text-gray-550 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                      }`}
                    >
                      {group.name}
                    </button>
                  );
                })}
              </div>
              <div className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest shrink-0">
                Hiển thị: <span className="text-blue-600 dark:text-blue-400 font-black">{filteredEndpoints.length}</span> điểm cầu
              </div>
            </div>

            <table className="w-full text-left text-sm min-w-[600px]">
              <thead className="bg-[#F5F5F5] dark:bg-slate-800/50 text-gray-550 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Tên điểm cầu</th>
                  <th className="px-6 py-4">Nhóm</th>
                  <th className="px-6 py-4">Vị trí</th>
                  <th className="px-6 py-4">IP 1</th>
                  <th className="px-6 py-4">IP 2</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredEndpoints.map(e => (
                  <tr key={e.id} className="hover:bg-[#F5F5F5] dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{e.name}</td>
                    <td className="px-6 py-4">
                      {(() => {
                        const gId = getEndpointGroup(e);
                        const groupObj = endpointGroups.find(eg => eg.id === gId);
                        const label = groupObj ? groupObj.name : 'Chưa gán';
                        
                        let styles = 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30';
                        if (gId === 'TINH') {
                          styles = 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/30';
                        } else if (gId === 'XA_PHUONG') {
                          styles = 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border border-teal-200/50 dark:border-teal-800/30';
                        } else if (gId === 'SO_NGANH') {
                          styles = 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30';
                        }
                        
                        return (
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${styles}`}>
                            {label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{e.location}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400 font-mono text-xs">{e.ip1 || '---'}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400 font-mono text-xs">{e.ip2 || '---'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                        e.status === EndpointStatus.CONNECTED ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                      }`}>
                        {e.status === EndpointStatus.CONNECTED ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => openModal(e)} className="text-blue-600 font-bold hover:underline">Sửa</button>
                      <button onClick={() => onDeleteEndpoint(e.id)} className="text-red-600 font-bold hover:underline">Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-8 w-full space-y-8">
            <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Cấu hình hệ thống</h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Left Column: General system settings */}
              <div className="space-y-6">
                {/* Logo Section */}
                <div className="space-y-4">
                  <label className="text-sm font-bold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                    <ImageIcon size={18} className="text-blue-600 dark:text-blue-400" />
                    Logo hệ thống (Base64)
                  </label>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 bg-[#F5F5F5] dark:bg-slate-800/50 border border-dashed border-gray-300 dark:border-slate-700 rounded-[2rem]">
                    <div className="w-32 h-32 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                      {settingsForm.logoBase64 ? (
                        <img src={settingsForm.logoBase64} alt="Preview" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <div className="text-gray-300 dark:text-slate-600 flex flex-col items-center">
                          <ImageIcon size={32} />
                          <span className="text-[9px] font-bold mt-2 uppercase">No Logo</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                        Logo sẽ hiển thị ở Sidebar và trang Đăng nhập. <br/>
                        Định dạng khuyên dùng: <b>PNG hoặc SVG (Nền trong suốt)</b>. <br/>
                        Dung lượng tối đa: <b>1MB</b>.
                      </p>
                      <div className="flex gap-2">
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleLogoUpload} 
                          accept="image/*" 
                          className="hidden" 
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-sm"
                        >
                          <Upload size={14} />
                          Tải ảnh lên
                        </button>
                        {settingsForm.logoBase64 && (
                          <button 
                            onClick={removeLogo}
                            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-900/40 transition-all flex items-center gap-2"
                          >
                            <Trash2 size={14} />
                            Xóa logo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Tên hệ thống</label>
                  <input 
                    type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 outline-none font-bold text-gray-900 dark:text-white"
                    value={settingsForm.systemName}
                    onChange={e => setSettingsForm({...settingsForm, systemName: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Tên viết tắt (Sidebar)</label>
                  <input 
                    type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 outline-none font-bold text-gray-900 dark:text-white"
                    value={settingsForm.shortName}
                    onChange={e => setSettingsForm({...settingsForm, shortName: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Màu chủ đạo</label>
                  <div className="flex gap-3">
                    <input 
                      type="color" className="w-12 h-12 p-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl cursor-pointer"
                      value={settingsForm.primaryColor}
                      onChange={e => setSettingsForm({...settingsForm, primaryColor: e.target.value})}
                    />
                    <input 
                      type="text" className="flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 outline-none font-mono text-gray-900 dark:text-white"
                      value={settingsForm.primaryColor}
                      onChange={e => setSettingsForm({...settingsForm, primaryColor: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Support Information Configuration */}
              <div className="space-y-6 bg-slate-50 dark:bg-slate-800/20 p-6 rounded-[2rem] border border-gray-150 dark:border-slate-800">
                <h5 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-gray-200/50 dark:border-slate-800 pb-3">
                  <Phone size={16} className="text-blue-600 dark:text-blue-400" />
                  Thông tin hỗ trợ kỹ thuật
                </h5>

                {/* QR Code upload (80x80) */}
                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                    <QrCode size={16} className="text-blue-600 dark:text-blue-400" />
                    Ảnh mã QR hỗ trợ (Ảnh 80x80)
                  </label>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-white dark:bg-slate-900 border border-dashed border-gray-300 dark:border-slate-700 rounded-2xl">
                    <div className="w-20 h-20 bg-white dark:bg-slate-950 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                      {settingsForm.supportQrBase64 ? (
                        <img src={settingsForm.supportQrBase64} alt="Support QR" className="w-20 h-20 object-contain" />
                      ) : (
                        <div className="text-gray-300 dark:text-slate-600 flex flex-col items-center">
                          <QrCode size={24} />
                          <span className="text-[8px] font-bold mt-1 uppercase">No QR</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-relaxed">
                        Mã QR hỗ trợ, liên hệ (Zalo, Telegram, v.v.).<br/>
                        Hiển thị kích thước cố định: <b>80x80 px</b>.<br/>
                        Dung lượng tối đa: <b>1MB</b>.
                      </p>
                      <div className="flex gap-2">
                        <input 
                          type="file" 
                          ref={qrInputRef} 
                          onChange={handleQrUpload} 
                          accept="image/*" 
                          className="hidden" 
                        />
                        <button 
                          onClick={() => qrInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1 shadow-sm"
                        >
                          <Upload size={12} />
                          Tải ảnh
                        </button>
                        {settingsForm.supportQrBase64 && (
                          <button 
                            onClick={removeQr}
                            className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-900/40 transition-all flex items-center gap-1"
                          >
                            <Trash2 size={12} />
                            Xóa QR
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Support phone number */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-2">
                    <Phone size={16} className="text-blue-600 dark:text-blue-400" />
                    Số điện thoại hỗ trợ (Hiển thị to rõ)
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ví dụ: 0912.345.678"
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 outline-none font-bold text-gray-900 dark:text-white"
                    value={settingsForm.supportPhone || ''}
                    onChange={e => setSettingsForm({...settingsForm, supportPhone: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleSaveSettings}
              style={primaryBgStyle}
              className="px-8 py-3.5 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:brightness-110 transition-all active:scale-95 w-full sm:w-auto"
            >
              Lưu cấu hình hệ thống
            </button>
          </div>
        )}

        {activeTab === 'ads' && (
          <div className="p-8 w-full space-y-8">
            <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
              <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Quản lý Liên kết quảng cáo</h4>
              <p className="text-xs text-gray-550 dark:text-slate-400 mt-1">Cấu hình danh sách 6 liên kết nhanh / logo quảng cáo hiển thị ở góc trái trang đăng nhập.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(settingsForm.banners || []).map((b, idx) => (
                <div key={b.id} className="bg-[#F8F9FA] dark:bg-slate-850/40 border border-gray-150 dark:border-slate-800/60 p-5 rounded-3xl space-y-4 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                  {/* Slot Number Badge */}
                  <div className="absolute top-4 right-4 bg-gray-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                    Ô số {idx + 1}
                  </div>

                  <div className="space-y-4">
                    {/* Image Preview & Upload Area */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Hình ảnh đại diện</label>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                          {b.image ? (
                            <img src={b.image} alt="Banner" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="text-gray-350 dark:text-slate-600 w-6 h-6" />
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <input 
                            type="file" 
                            id={`banner-file-${b.id}`}
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => handleBannerImageUpload(b.id, e)}
                          />
                          <div className="flex gap-1.5">
                            <label 
                              htmlFor={`banner-file-${b.id}`}
                              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-50 dark:hover:bg-slate-750 transition-all flex items-center gap-1 cursor-pointer shadow-sm select-none"
                            >
                              <Upload size={10} />
                              Tải ảnh
                            </label>
                            {b.image && (
                              <button 
                                type="button"
                                onClick={() => removeBannerImage(b.id)}
                                className="px-2 py-1.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-transparent hover:border-red-200 dark:hover:border-red-900/50 rounded-lg text-[9px] font-black uppercase transition-all flex items-center justify-center"
                                title="Xóa ảnh"
                              >
                                <Trash2 size={10} />
                              </button>
                            )}
                          </div>
                          <p className="text-[8px] text-gray-400 dark:text-slate-500 font-medium">Tỷ lệ khuyên dùng 1:1, dưới 1MB</p>
                        </div>
                      </div>
                    </div>

                    {/* Title input */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Tiêu đề liên kết</label>
                      <input 
                        type="text"
                        placeholder="Ví dụ: Cổng dịch vụ công..."
                        className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 rounded-xl focus:ring-2 outline-none font-bold text-gray-900 dark:text-white"
                        value={b.title}
                        onChange={(e) => {
                          const updated = settingsForm.banners?.map(item => 
                            item.id === b.id ? { ...item, title: e.target.value } : item
                          ) || [];
                          setSettingsForm({ ...settingsForm, banners: updated });
                        }}
                      />
                    </div>

                    {/* Link URL input */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider">Đường dẫn liên kết (URL)</label>
                      <input 
                        type="text"
                        placeholder="Ví dụ: https://..."
                        className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 rounded-xl focus:ring-2 outline-none font-mono text-gray-900 dark:text-white"
                        value={b.link}
                        onChange={(e) => {
                          const updated = settingsForm.banners?.map(item => 
                            item.id === b.id ? { ...item, link: e.target.value } : item
                          ) || [];
                          setSettingsForm({ ...settingsForm, banners: updated });
                        }}
                      />
                    </div>

                    {/* Active Toggle Switch */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200/50 dark:border-slate-800/65 mt-1">
                      <span className="text-xs font-bold text-gray-600 dark:text-slate-400">Trạng thái hiển thị</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={b.active}
                          onChange={(e) => {
                            const updated = settingsForm.banners?.map(item => 
                              item.id === b.id ? { ...item, active: e.target.checked } : item
                            ) || [];
                            setSettingsForm({ ...settingsForm, banners: updated });
                          }}
                        />
                        <div className="w-9 h-5 bg-gray-200 dark:bg-slate-750 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-slate-800/80 flex justify-start">
              <button 
                onClick={handleSaveSettings}
                style={primaryBgStyle}
                className="px-8 py-3.5 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:brightness-110 transition-all active:scale-95 w-full sm:w-auto"
              >
                Lưu cấu hình quảng cáo
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                {editingItem ? 'Cập nhật' : 'Thêm mới'} {
                  activeTab === 'units' ? 'Đơn vị' : 
                  activeTab === 'staff' ? 'Cán bộ' : 
                  activeTab === 'groups' ? 'Thành phần' : 
                  activeTab === 'endpointGroups' ? 'Nhóm điểm cầu' : 'Điểm cầu'
                }
              </h3>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
                {activeTab === 'units' && (
                  <>
                    <input required className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 outline-none font-bold text-gray-900 dark:text-white" placeholder="Tên đơn vị" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                    <input required className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 outline-none font-mono text-gray-900 dark:text-white" placeholder="Mã đơn vị" value={formData.code || ''} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} />
                    <textarea className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 outline-none text-gray-900 dark:text-white" placeholder="Mô tả" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </>
                )}

                {activeTab === 'staff' && (
                  <>
                    <input required className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 outline-none font-bold text-gray-900 dark:text-white" placeholder="Họ và tên" value={formData.fullName || ''} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                    <select required className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 outline-none font-bold text-gray-900 dark:text-white" value={formData.unitId || ''} onChange={e => setFormData({...formData, unitId: e.target.value})}>
                      <option value="">-- Chọn đơn vị --</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <input required className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 outline-none text-gray-900 dark:text-white" placeholder="Chức vụ" value={formData.position || ''} onChange={e => setFormData({...formData, position: e.target.value})} />
                    <input className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 outline-none text-gray-900 dark:text-white" placeholder="Email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                    <input className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 outline-none text-gray-900 dark:text-white" placeholder="Số điện thoại" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </>
                )}

                {activeTab === 'groups' && (
                  <>
                    <input required className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 outline-none font-bold text-gray-900 dark:text-white" placeholder="Tên nhóm thành phần" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                    <textarea className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 outline-none text-gray-900 dark:text-white" placeholder="Mô tả" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </>
                )}

                {activeTab === 'endpointGroups' && (
                  <>
                    <input required className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 outline-none font-bold text-gray-900 dark:text-white" placeholder="Tên nhóm điểm cầu" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                    <textarea className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 outline-none text-gray-900 dark:text-white" placeholder="Mô tả" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </>
                )}

                {activeTab === 'endpoints' && (
                  <>
                    <input required className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 outline-none font-bold text-gray-900 dark:text-white" placeholder="Tên điểm cầu" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                    <select required className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 outline-none font-bold text-gray-900 dark:text-white" value={formData.groupId || ''} onChange={e => setFormData({...formData, groupId: e.target.value})}>
                      <option value="">-- Chọn nhóm điểm cầu --</option>
                      {endpointGroups.map(eg => <option key={eg.id} value={eg.id}>{eg.name}</option>)}
                    </select>
                    <input required className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 outline-none text-gray-900 dark:text-white" placeholder="Vị trí / Địa điểm" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                      <input className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 outline-none font-mono text-gray-900 dark:text-white" placeholder="IP 1" value={formData.ip1 || ''} onChange={e => setFormData({...formData, ip1: e.target.value})} />
                      <input className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 outline-none font-mono text-gray-900 dark:text-white" placeholder="IP 2" value={formData.ip2 || ''} onChange={e => setFormData({...formData, ip2: e.target.value})} />
                    </div>
                  </>
                )}

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 border border-gray-200 dark:border-slate-700 rounded-2xl font-bold uppercase text-xs tracking-widest text-gray-500 dark:text-slate-400">Hủy</button>
                  <button type="submit" style={primaryBgStyle} className="flex-1 py-3 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Lưu</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementPage;
