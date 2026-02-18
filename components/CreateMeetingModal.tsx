
import React, { useState, useMemo, useEffect } from 'react';
import { Endpoint, EndpointStatus, Meeting, Unit, Staff } from '../types';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (meeting: Meeting) => void;
  onUpdate?: (meeting: Meeting) => void;
  units: Unit[];
  staff: Staff[];
  availableEndpoints: Endpoint[];
  editingMeeting?: Meeting | null;
}

const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({ 
  isOpen, onClose, onCreate, onUpdate, units, staff, availableEndpoints, editingMeeting 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    hostUnit: '',
    hostUnitId: '',
    chairPerson: '',
    chairPersonId: '',
    startTime: '',
    endTime: '',
    description: '',
    participants: '',
    invitationLink: '',
  });
  
  const [selectedEndpointIds, setSelectedEndpointIds] = useState<string[]>([]);
  const [endpointSearch, setEndpointSearch] = useState('');

  const formatISOToLocalInput = (isoStr: string) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatLocalInputToISO = (localStr: string) => {
    if (!localStr) return '';
    const date = new Date(localStr);
    return isNaN(date.getTime()) ? localStr : date.toISOString();
  };

  useEffect(() => {
    if (editingMeeting) {
      setFormData({
        title: editingMeeting.title,
        hostUnit: editingMeeting.hostUnit,
        hostUnitId: editingMeeting.hostUnitId || '',
        chairPerson: editingMeeting.chairPerson,
        chairPersonId: editingMeeting.chairPersonId || '',
        startTime: formatISOToLocalInput(editingMeeting.startTime),
        endTime: formatISOToLocalInput(editingMeeting.endTime),
        description: editingMeeting.description,
        participants: editingMeeting.participants.join(', '),
        invitationLink: editingMeeting.invitationLink || '',
      });
      setSelectedEndpointIds(editingMeeting.endpoints.map(e => e.id));
    } else {
      setFormData({
        title: '',
        hostUnit: '',
        hostUnitId: '',
        chairPerson: '',
        chairPersonId: '',
        startTime: '',
        endTime: '',
        description: '',
        participants: '',
        invitationLink: '',
      });
      setSelectedEndpointIds([]);
    }
  }, [editingMeeting, isOpen]);

  const filteredStaffForUnit = useMemo(() => {
    if (!formData.hostUnitId) return [];
    return staff.filter(s => s.unitId === formData.hostUnitId);
  }, [formData.hostUnitId, staff]);

  const filteredEndpoints = useMemo(() => {
    return availableEndpoints.filter(ep => 
      ep.name.toLowerCase().includes(endpointSearch.toLowerCase()) ||
      ep.location.toLowerCase().includes(endpointSearch.toLowerCase())
    );
  }, [endpointSearch, availableEndpoints]);

  if (!isOpen) return null;

  const toggleEndpoint = (id: string) => {
    setSelectedEndpointIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const unitId = e.target.value;
    const unitName = units.find(u => u.id === unitId)?.name || '';
    setFormData({ ...formData, hostUnitId: unitId, hostUnit: unitName, chairPerson: '', chairPersonId: '' });
  };

  const handleStaffChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const staffId = e.target.value;
    const staffName = staff.find(s => s.id === staffId)?.fullName || '';
    setFormData({ ...formData, chairPersonId: staffId, chairPerson: staffName });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedEndpoints = availableEndpoints.filter(ep => selectedEndpointIds.includes(ep.id));
    
    if (selectedEndpoints.length === 0) {
      alert("Vui lòng chọn ít nhất một điểm cầu.");
      return;
    }

    const meetingData: Meeting = {
      id: editingMeeting ? editingMeeting.id : `MEET-${Math.floor(1000 + Math.random() * 9000)}`,
      title: formData.title,
      hostUnit: formData.hostUnit,
      hostUnitId: formData.hostUnitId,
      chairPerson: formData.chairPerson,
      chairPersonId: formData.chairPersonId,
      startTime: formatLocalInputToISO(formData.startTime),
      endTime: formatLocalInputToISO(formData.endTime),
      description: formData.description,
      participants: formData.participants.split(',').map(p => p.trim()).filter(p => p !== ""),
      endpoints: selectedEndpoints,
      status: editingMeeting?.status || 'SCHEDULED',
      cancelReason: editingMeeting?.cancelReason,
      invitationLink: formData.invitationLink.trim() || undefined
    };

    if (editingMeeting && onUpdate) {
      onUpdate(meetingData);
    } else {
      onCreate(meetingData);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
        <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-3xl shrink-0">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl shadow-lg text-white shrink-0 ${editingMeeting ? 'bg-emerald-600 shadow-emerald-100' : 'bg-blue-600 shadow-blue-100'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {editingMeeting ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                )}
              </svg>
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900">{editingMeeting ? 'Cập nhật cuộc họp' : 'Cuộc họp mới'}</h3>
              <p className="text-xs text-gray-500 mt-1 font-medium hidden sm:block">{editingMeeting ? `Mã: ${editingMeeting.id}` : 'Điền thông tin chi tiết bên dưới'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-full transition-all border border-transparent hover:border-gray-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            <div className="lg:col-span-7 space-y-6">
              <h4 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] border-l-4 border-blue-600 pl-3">Nội dung & Thời gian</h4>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Chủ đề cuộc họp *</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all"
                  placeholder="Nhập tiêu đề chi tiết của cuộc họp..."
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Đơn vị chủ trì *</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all appearance-none cursor-pointer"
                    value={formData.hostUnitId}
                    onChange={handleUnitChange}
                  >
                    <option value="">-- Chọn đơn vị --</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Cán bộ chủ trì *</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all appearance-none cursor-pointer"
                    value={formData.chairPersonId}
                    onChange={handleStaffChange}
                    disabled={!formData.hostUnitId}
                  >
                    <option value="">{formData.hostUnitId ? '-- Chọn cán bộ --' : '-- Chọn đơn vị trước --'}</option>
                    {filteredStaffForUnit.map(s => (
                      <option key={s.id} value={s.id}>{s.fullName} - {s.position}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Thời điểm bắt đầu *</label>
                  <input 
                    required
                    type="datetime-local" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all"
                    value={formData.startTime}
                    onChange={e => setFormData({...formData, startTime: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Dự kiến kết thúc *</label>
                  <input 
                    required
                    type="datetime-local" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all"
                    value={formData.endTime}
                    onChange={e => setFormData({...formData, endTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Giấy mời (Liên kết ngoài)</label>
                <input 
                  type="url" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all"
                  placeholder="https://example.com/invitation.pdf"
                  value={formData.invitationLink}
                  onChange={e => setFormData({...formData, invitationLink: e.target.value})}
                />
                <p className="text-[10px] text-gray-400 font-medium italic">Dán liên kết đến file giấy mời hoặc thông báo họp nếu có.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Thành phần khác</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all"
                  placeholder="Gợi ý: Ban Giám đốc, Toàn thể CBNV..."
                  value={formData.participants}
                  onChange={e => setFormData({...formData, participants: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Nội dung thảo luận</label>
                <textarea 
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none resize-none transition-all"
                  placeholder="Mô tả tóm tắt chương trình họp..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col space-y-6">
              <div className="flex justify-between items-center border-l-4 border-blue-600 pl-3">
                <h4 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em]">Cấu hình Điểm cầu</h4>
                <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-black">
                  ĐÃ CHỌN: {selectedEndpointIds.length}
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-gray-50 rounded-3xl border border-gray-100 p-4 space-y-4 shadow-inner min-h-[300px]">
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Tìm kiếm điểm cầu..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
                    value={endpointSearch}
                    onChange={e => setEndpointSearch(e.target.value)}
                  />
                  <svg className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>

                <div className="flex justify-between px-2">
                  <button 
                    type="button"
                    onClick={() => setSelectedEndpointIds(availableEndpoints.map(e => e.id))}
                    className="text-[10px] font-black text-blue-600 uppercase tracking-wider hover:text-blue-800"
                  >
                    Chọn tất cả
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSelectedEndpointIds([])}
                    className="text-[10px] font-black text-gray-400 uppercase tracking-wider hover:text-gray-600"
                  >
                    Bỏ chọn
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[350px] lg:max-h-[420px] pr-1 space-y-2 custom-scrollbar">
                  {filteredEndpoints.map(ep => (
                    <label 
                      key={ep.id} 
                      className={`flex items-center p-3.5 cursor-pointer rounded-2xl border transition-all ${
                        selectedEndpointIds.includes(ep.id) 
                          ? 'bg-white border-blue-500 shadow-md translate-x-1' 
                          : 'bg-white/50 border-gray-100 hover:border-blue-200'
                      }`}
                    >
                      <div className={`relative flex items-center justify-center w-5 h-5 rounded-md border-2 transition-colors shrink-0 ${
                        selectedEndpointIds.includes(ep.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
                      }`}>
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={selectedEndpointIds.includes(ep.id)}
                          onChange={() => toggleEndpoint(ep.id)}
                        />
                        {selectedEndpointIds.includes(ep.id) && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                        )}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-bold truncate ${selectedEndpointIds.includes(ep.id) ? 'text-blue-700' : 'text-gray-800'}`}>{ep.name}</span>
                          <span className={`w-2 h-2 rounded-full shrink-0 ${ep.status === EndpointStatus.CONNECTED ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium mt-0.5 truncate">{ep.location}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-4 shrink-0">
            <button 
              type="button"
              onClick={onClose}
              className="px-8 py-3.5 border border-gray-200 text-gray-600 rounded-2xl text-sm font-black hover:bg-gray-50 transition-all active:scale-95 w-full sm:w-auto"
            >
              HỦY BỎ
            </button>
            <button 
              type="submit"
              className={`px-12 py-3.5 text-white rounded-2xl text-sm font-black shadow-xl transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto ${
                editingMeeting ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
              }`}
            >
              <span>{editingMeeting ? 'CẬP NHẬT' : 'PHÁT HÀNH'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMeetingModal;
