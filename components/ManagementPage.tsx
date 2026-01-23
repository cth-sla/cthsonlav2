
import React, { useState, useEffect } from 'react';
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
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [settingsForm, setSettingsForm] = useState<SystemSettings>(systemSettings);

  useEffect(() => {
    setSettingsForm(systemSettings);
  }, [systemSettings]);

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

  const openModal = (item: any = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({ ...item });
    } else {
      if (activeTab === 'units') setFormData({ name: '', code: '', description: '' });
      else if (activeTab === 'staff') setFormData({ fullName: '', position: '', unitId: '', email: '' });
      else if (activeTab === 'endpoints') setFormData({ name: '', location: '', status: EndpointStatus.DISCONNECTED });
      else if (activeTab === 'groups') setFormData({ name: '', description: '' });
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

  const handleSaveSettings = () => {
    onUpdateSettings(settingsForm);
    alert('Đã cập nhật cấu hình hệ thống!');
  };

  const primaryTextStyle = { color: systemSettings.primaryColor };
  const primaryBgStyle = { backgroundColor: systemSettings.primaryColor };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
          {['units', 'staff', 'groups', 'endpoints', 'settings'].map((tab) => (
            <button 
              key={tab}
              onClick={() => { setActiveTab(tab as any); setSearchTerm(''); }}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              style={activeTab === tab ? primaryTextStyle : {}}
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
                placeholder="Tìm kiếm..."
                className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-48 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="w-4 h-4 absolute left-3 top-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <button 
              onClick={() => openModal()}
              style={primaryBgStyle}
              className="text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:brightness-110 transition-all shadow-sm active:scale-95 flex items-center gap-2"
            >
              Thêm mới
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {activeTab === 'units' && (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Tên đơn vị</th>
                <th className="px-6 py-4">Mã đơn vị</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUnits.map(unit => (
                <tr key={unit.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{unit.name}</td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">{unit.code}</td>
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
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{s.fullName}</td>
                  <td className="px-6 py-4 text-gray-600">{s.position}</td>
                  <td className="px-6 py-4 text-gray-500">{getUnitName(s.unitId)}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openModal(s)} className="text-blue-600 font-bold hover:underline">Sửa</button>
                    <button onClick={() => onDeleteStaff(s.id)} className="text-red-600 font-bold hover:underline">Xóa</button>
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
                <th className="px-6 py-4">Tên nhóm</th>
                <th className="px-6 py-4">Mô tả</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredGroups.map(g => (
                <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{g.name}</td>
                  <td className="px-6 py-4 text-gray-600">{g.description || '---'}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openModal(g)} className="text-blue-600 font-bold hover:underline">Sửa</button>
                    <button onClick={() => onDeleteGroup(g.id)} className="text-red-600 font-bold hover:underline">Xóa</button>
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
                <th className="px-6 py-4">Vị trí</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEndpoints.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{e.name}</td>
                  <td className="px-6 py-4 text-gray-600">{e.location}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                      e.status === EndpointStatus.CONNECTED ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
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
        )}

        {activeTab === 'settings' && (
          <div className="p-8 max-w-2xl space-y-8">
            <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">Cấu hình hệ thống</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Tên hệ thống</label>
                <input 
                  type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 outline-none"
                  value={settingsForm.systemName}
                  onChange={e => setSettingsForm({...settingsForm, systemName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Màu chủ đạo</label>
                <div className="flex gap-3">
                  <input 
                    type="color" className="w-12 h-12 p-1 bg-white border border-gray-200 rounded-xl"
                    value={settingsForm.primaryColor}
                    onChange={e => setSettingsForm({...settingsForm, primaryColor: e.target.value})}
                  />
                  <input 
                    type="text" className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 outline-none font-mono"
                    value={settingsForm.primaryColor}
                    onChange={e => setSettingsForm({...settingsForm, primaryColor: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <button 
              onClick={handleSaveSettings}
              style={primaryBgStyle}
              className="px-8 py-3 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:brightness-110 transition-all active:scale-95"
            >
              Lưu cấu hình
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                {editingItem ? 'Cập nhật' : 'Thêm mới'} {
                  activeTab === 'units' ? 'Đơn vị' : 
                  activeTab === 'staff' ? 'Cán bộ' : 
                  activeTab === 'groups' ? 'Thành phần' : 'Điểm cầu'
                }
              </h3>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
                {activeTab === 'units' && (
                  <>
                    <input required className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 outline-none font-bold" placeholder="Tên đơn vị" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                    <input required className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 outline-none font-mono" placeholder="Mã đơn vị" value={formData.code || ''} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} />
                    <textarea className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 outline-none" placeholder="Mô tả" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </>
                )}

                {activeTab === 'staff' && (
                  <>
                    <input required className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 outline-none font-bold" placeholder="Họ và tên" value={formData.fullName || ''} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                    <select required className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 outline-none font-bold" value={formData.unitId || ''} onChange={e => setFormData({...formData, unitId: e.target.value})}>
                      <option value="">-- Chọn đơn vị --</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <input required className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 outline-none" placeholder="Chức vụ" value={formData.position || ''} onChange={e => setFormData({...formData, position: e.target.value})} />
                    <input className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 outline-none" placeholder="Email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </>
                )}

                {activeTab === 'groups' && (
                  <>
                    <input required className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 outline-none font-bold" placeholder="Tên nhóm thành phần" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                    <textarea className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 outline-none" placeholder="Mô tả" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </>
                )}

                {activeTab === 'endpoints' && (
                  <>
                    <input required className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 outline-none font-bold" placeholder="Tên điểm cầu" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                    <input required className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 outline-none" placeholder="Vị trí / Địa điểm" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} />
                  </>
                )}

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 border border-gray-200 rounded-2xl font-bold uppercase text-xs tracking-widest">Hủy</button>
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
