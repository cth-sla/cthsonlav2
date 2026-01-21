
import React, { useState } from 'react';
import { Unit, Staff, ParticipantGroup, Endpoint, EndpointStatus, SystemSettings } from '../types';

interface ManagementPageProps {
  units: Unit[];
  staff: Staff[];
  participantGroups: ParticipantGroup[];
  endpoints: Endpoint[];
  systemSettings: SystemSettings;
  onAddUnit: (unit: Omit<Unit, 'id'>) => void;
  onUpdateUnit: (unit: Unit) => void;
  onAddStaff: (staff: Omit<Staff, 'id'>) => void;
  onUpdateStaff: (staff: Staff) => void;
  onAddGroup: (group: Omit<ParticipantGroup, 'id'>) => void;
  onUpdateGroup: (group: ParticipantGroup) => void;
  onAddEndpoint: (endpoint: Omit<Endpoint, 'id' | 'status' | 'lastConnected'>) => void;
  onUpdateEndpoint: (endpoint: Endpoint) => void;
  onDeleteUnit: (id: string) => void;
  onDeleteStaff: (id: string) => void;
  onDeleteGroup: (id: string) => void;
  onDeleteEndpoint: (id: string) => void;
  onUpdateSettings: (settings: SystemSettings) => void;
}

const ManagementPage: React.FC<ManagementPageProps> = ({
  units,
  staff,
  participantGroups,
  endpoints,
  systemSettings,
  onAddUnit,
  onUpdateUnit,
  onAddStaff,
  onUpdateStaff,
  onAddGroup,
  onUpdateGroup,
  onAddEndpoint,
  onUpdateEndpoint,
  onDeleteUnit,
  onDeleteStaff,
  onDeleteGroup,
  onDeleteEndpoint,
  onUpdateSettings
}) => {
  const [activeTab, setActiveTab] = useState<'units' | 'staff' | 'groups' | 'endpoints' | 'settings'>('units');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Unit | Staff | ParticipantGroup | Endpoint | null>(null);
  const [formData, setFormData] = useState<any>({});

  // System Settings local state
  const [settingsForm, setSettingsForm] = useState<SystemSettings>(systemSettings);

  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStaff = staff.filter(s => 
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = participantGroups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEndpoints = endpoints.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUnitName = (id: string) => units.find(u => u.id === id)?.name || 'N/A';

  const openModal = (item: Unit | Staff | ParticipantGroup | Endpoint | null = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({ ...item });
    } else {
      setFormData(
        activeTab === 'units' ? { name: '', code: '', description: '' } :
        activeTab === 'staff' ? { fullName: '', position: '', unitId: '', email: '' } :
        activeTab === 'endpoints' ? { name: '', location: '', status: EndpointStatus.DISCONNECTED } :
        { name: '', description: '' }
      );
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
    }
    closeModal();
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettingsForm({ ...settingsForm, logoBase64: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = () => {
    onUpdateSettings(settingsForm);
    alert('Đã cập nhật cấu hình hệ thống!');
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
          {['units', 'staff', 'groups', 'endpoints', 'settings'].map((tab) => (
            <button 
              key={tab}
              onClick={() => { setActiveTab(tab as any); setSearchTerm(''); }}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab === 'units' ? 'Đơn vị' : 
               tab === 'staff' ? 'Cán bộ' : 
               tab === 'groups' ? 'Thành phần' : 
               tab === 'endpoints' ? 'Điểm cầu' : 'Cấu hình'}
            </button>
          ))}
        </div>

        {activeTab !== 'settings' && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Tìm kiếm nhanh..."
                className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-full md:w-48 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="w-4 h-4 absolute left-3 top-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <button 
              onClick={() => openModal()}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm active:scale-95 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
              Thêm mới
            </button>
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {activeTab === 'units' && (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Tên đơn vị</th>
                <th className="px-6 py-4">Mã đơn vị</th>
                <th className="px-6 py-4">Mô tả</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUnits.map(unit => (
                <tr key={unit.id} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="px-6 py-4 font-bold text-gray-900">{unit.name}</td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">{unit.code}</td>
                  <td className="px-6 py-4 text-gray-600 italic truncate max-w-[200px]">{unit.description || '---'}</td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button onClick={() => openModal(unit)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                    <button onClick={() => onDeleteUnit(unit.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'staff' && (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Họ và tên</th>
                <th className="px-6 py-4">Chức vụ</th>
                <th className="px-6 py-4">Đơn vị</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStaff.map(s => (
                <tr key={s.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{s.fullName}</td>
                  <td className="px-6 py-4 text-gray-600">{s.position}</td>
                  <td className="px-6 py-4 text-gray-500">{getUnitName(s.unitId)}</td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button onClick={() => openModal(s)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                    <button onClick={() => onDeleteStaff(s.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'groups' && (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Tên nhóm thành phần</th>
                <th className="px-6 py-4">Mô tả</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredGroups.map(group => (
                <tr key={group.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{group.name}</td>
                  <td className="px-6 py-4 text-gray-600">{group.description || '---'}</td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button onClick={() => openModal(group)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                    <button onClick={() => onDeleteGroup(group.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'endpoints' && (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Tên điểm cầu</th>
                <th className="px-6 py-4">Vị trí / Địa điểm</th>
                <th className="px-6 py-4">Trạng thái hiện tại</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEndpoints.map(ep => (
                <tr key={ep.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{ep.name}</td>
                  <td className="px-6 py-4 text-gray-600">{ep.location}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      ep.status === EndpointStatus.CONNECTED ? 'bg-green-100 text-green-700' : 
                      ep.status === EndpointStatus.DISCONNECTED ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {ep.status === EndpointStatus.CONNECTED ? 'Kết nối' : 
                       ep.status === EndpointStatus.DISCONNECTED ? 'Mất kết nối' : 'Đang chờ'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button onClick={() => openModal(ep)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                    <button onClick={() => onDeleteEndpoint(ep.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'settings' && (
          <div className="p-8 max-w-2xl space-y-8">
            <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">Cấu hình giao diện hệ thống</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Tên hệ thống (Dài)</label>
                  <input 
                    type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={settingsForm.systemName}
                    onChange={e => setSettingsForm({...settingsForm, systemName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Tên viết tắt (Short Name)</label>
                  <input 
                    type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={settingsForm.shortName}
                    onChange={e => setSettingsForm({...settingsForm, shortName: e.target.value})}
                  />
                </div>
                
                {/* Primary Color Customization Section */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Màu chủ đạo hệ thống (Theme Color)</label>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input 
                        type="color" 
                        className="w-12 h-12 p-1 bg-white border border-gray-200 rounded-xl cursor-pointer"
                        value={settingsForm.primaryColor}
                        onChange={e => setSettingsForm({...settingsForm, primaryColor: e.target.value})}
                      />
                    </div>
                    <input 
                      type="text" 
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm uppercase"
                      value={settingsForm.primaryColor}
                      onChange={e => setSettingsForm({...settingsForm, primaryColor: e.target.value})}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium italic">Thay đổi màu sắc này để tùy chỉnh giao diện Dashboard và Sidebar.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Logo hệ thống</label>
                  <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                    {settingsForm.logoBase64 ? (
                      <img src={settingsForm.logoBase64} alt="Preview" className="h-16 w-auto object-contain rounded" />
                    ) : (
                      <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                    <input 
                      type="file" accept="image/*" className="hidden" id="logo-upload"
                      onChange={handleLogoChange}
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer px-4 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors">
                      {settingsForm.logoBase64 ? 'Thay đổi Logo' : 'Tải lên Logo'}
                    </label>
                    {settingsForm.logoBase64 && (
                      <button 
                        onClick={() => setSettingsForm({...settingsForm, logoBase64: undefined})}
                        className="text-[10px] text-red-500 font-bold uppercase hover:underline"
                      >
                        Xóa Logo (Dùng mặc định)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button 
                onClick={handleSaveSettings}
                className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        )}

        {((filteredUnits.length === 0 && activeTab === 'units') ||
         (filteredStaff.length === 0 && activeTab === 'staff') ||
         (filteredEndpoints.length === 0 && activeTab === 'endpoints') ||
         (filteredGroups.length === 0 && activeTab === 'groups')) ? (
          <div className="p-12 text-center text-gray-400 italic bg-gray-50/30">
            Không tìm thấy dữ liệu nào phù hợp với tìm kiếm của bạn.
          </div>
        ) : null}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-4">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
          <h4 className="text-sm font-bold text-blue-800">Thông tin Quản trị</h4>
          <p className="text-xs text-blue-700 leading-relaxed mt-1 font-medium">
            Mọi thay đổi tại đây sẽ ảnh hưởng trực tiếp đến dữ liệu nguồn. Việc quản lý điểm cầu giúp đồng bộ hóa danh sách trong các phiên họp SLA.
          </p>
        </div>
      </div>

      {/* Dynamic Modal for Create/Update */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">
                {editingItem ? 'Cập nhật' : 'Thêm mới'} {
                  activeTab === 'units' ? 'Đơn vị' : 
                  activeTab === 'staff' ? 'Cán bộ' : 
                  activeTab === 'endpoints' ? 'Điểm cầu' : 'Thành phần'
                }
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              {activeTab === 'units' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Tên đơn vị *</label>
                    <input 
                      required type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all font-medium"
                      placeholder="Ví dụ: Văn phòng Tổng công ty" value={formData.name || ''}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Mã đơn vị *</label>
                    <input 
                      required type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all font-mono"
                      placeholder="Ví dụ: VP-TCT" value={formData.code || ''}
                      onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    />
                  </div>
                </>
              )}

              {activeTab === 'staff' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Họ và tên *</label>
                    <input 
                      required type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.fullName || ''} onChange={e => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Chức vụ *</label>
                    <input 
                      required type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.position || ''} onChange={e => setFormData({...formData, position: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Đơn vị công tác *</label>
                    <select 
                      required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.unitId || ''} onChange={e => setFormData({...formData, unitId: e.target.value})}
                    >
                      <option value="">-- Chọn đơn vị --</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'endpoints' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Tên điểm cầu *</label>
                    <input 
                      required type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Ví dụ: Hội trường Hà Nội" value={formData.name || ''}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Vị trí / Địa điểm *</label>
                    <input 
                      required type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Ví dụ: Tòa nhà A, Tầng 5" value={formData.location || ''}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Trạng thái hiện tại *</label>
                    <select 
                      required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                      value={formData.status || EndpointStatus.DISCONNECTED}
                      onChange={e => setFormData({...formData, status: e.target.value as EndpointStatus})}
                    >
                      <option value={EndpointStatus.CONNECTED}>Kết nối (Online)</option>
                      <option value={EndpointStatus.DISCONNECTED}>Mất kết nối (Offline)</option>
                      <option value={EndpointStatus.CONNECTING}>Đang thử lại (Connecting)</option>
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'groups' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Tên nhóm thành phần *</label>
                    <input 
                      required type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-6 py-3 border border-gray-200 text-gray-600 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95">Hủy bỏ</button>
                <button type="submit" className="px-10 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95">
                  {editingItem ? 'Cập nhật' : 'Xác nhận lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementPage;
