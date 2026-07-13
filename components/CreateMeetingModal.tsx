
import React, { useState, useMemo, useEffect } from 'react';
import { Video, MapPin } from 'lucide-react';
import { Endpoint, EndpointStatus, Meeting, Unit, Staff, EndpointGroup } from '../types';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (meeting: Meeting) => void;
  onUpdate?: (meeting: Meeting) => void;
  units: Unit[];
  staff: Staff[];
  availableEndpoints: Endpoint[];
  endpointGroups: EndpointGroup[];
  editingMeeting?: Meeting | null;
}

const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({ 
  isOpen, onClose, onCreate, onUpdate, units, staff, availableEndpoints, endpointGroups = [], editingMeeting 
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
    meetingRoomId: '',
    invitationLink: '',
    meetingFormat: 'TRUC_TUYEN' as 'TRUC_TUYEN' | 'TRUC_TIEP',
  });
  
  const [selectedEndpointIds, setSelectedEndpointIds] = useState<string[]>([]);
  const [endpointSearch, setEndpointSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');

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
  const [status, setStatus] = useState<'SCHEDULED' | 'CANCELLED' | 'POSTPONED' | 'CHANGED_FORMAT'>('SCHEDULED');
  const [cancelReason, setCancelReason] = useState('');

  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');

  const parseDateTimeString = (str: string) => {
    if (!str) return { date: '', time: '08:00' };
    let d: Date;
    if (str.includes('Z') || str.includes('+')) {
      d = new Date(str);
    } else {
      d = new Date(str.replace(' ', 'T'));
    }
    
    if (isNaN(d.getTime())) {
      return { date: '', time: '08:00' };
    }
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`
    };
  };

  useEffect(() => {
    if (editingMeeting) {
      const startParsed = parseDateTimeString(editingMeeting.startTime);
      const endParsed = parseDateTimeString(editingMeeting.endTime);
      
      setStartDate(startParsed.date);
      setStartTime(startParsed.time);
      setEndDate(endParsed.date);
      setEndTime(endParsed.time);

      setFormData({
        title: editingMeeting.title,
        hostUnit: editingMeeting.hostUnit,
        hostUnitId: editingMeeting.hostUnitId || '',
        chairPerson: editingMeeting.chairPerson,
        chairPersonId: editingMeeting.chairPersonId || '',
        startTime: '',
        endTime: '',
        description: editingMeeting.description,
        participants: editingMeeting.participants.join(', '),
        meetingRoomId: editingMeeting.meetingRoomId || '',
        invitationLink: editingMeeting.invitationLink || '',
        meetingFormat: editingMeeting.meetingFormat || (editingMeeting.meetingRoomId ? 'TRUC_TUYEN' : 'TRUC_TIEP'),
      });
      setSelectedEndpointIds(editingMeeting.endpoints.map(e => e.id));
      setStatus(editingMeeting.status || 'SCHEDULED');
      setCancelReason(editingMeeting.cancelReason || '');
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      setStartDate(todayStr);
      setStartTime('08:00');
      setEndDate(todayStr);
      setEndTime('10:00');

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
        meetingRoomId: '',
        invitationLink: '',
        meetingFormat: 'TRUC_TUYEN',
      });
      setSelectedEndpointIds([]);
      setStatus('SCHEDULED');
      setCancelReason('');
    }
    setSelectedGroup('ALL');
  }, [editingMeeting, isOpen]);

  const filteredStaffForUnit = useMemo(() => {
    if (!formData.hostUnitId) return [];
    return staff.filter(s => s.unitId === formData.hostUnitId);
  }, [formData.hostUnitId, staff]);

  const filteredEndpoints = useMemo(() => {
    return availableEndpoints.filter(ep => {
      const matchesSearch = ep.name.toLowerCase().includes(endpointSearch.toLowerCase()) ||
                            ep.location.toLowerCase().includes(endpointSearch.toLowerCase());
      if (!matchesSearch) return false;
      if (selectedGroup === 'ALL') return true;
      return getEndpointGroup(ep) === selectedGroup;
    });
  }, [endpointSearch, availableEndpoints, selectedGroup]);

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

    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
      alert("Thời gian nhập không hợp lệ. Vui lòng nhập đúng định dạng 24-giờ (ví dụ: 14:30).");
      return;
    }

    const meetingData: Meeting = {
      id: editingMeeting ? editingMeeting.id : `MEET-${Math.floor(1000 + Math.random() * 9000)}`,
      title: formData.title,
      hostUnit: formData.hostUnit,
      hostUnitId: formData.hostUnitId,
      chairPerson: formData.chairPerson,
      chairPersonId: formData.chairPersonId,
      startTime: `${startDate} ${startTime}:00`,
      endTime: `${endDate} ${endTime}:00`,
      description: formData.description,
      participants: formData.participants.split(',').map(p => p.trim()).filter(p => p !== ""),
      endpoints: selectedEndpoints,
      status: editingMeeting ? status : 'SCHEDULED',
      cancelReason: (status === 'CANCELLED' || status === 'POSTPONED') ? cancelReason : undefined,
      meetingRoomId: formData.meetingFormat === 'TRUC_TUYEN' ? (formData.meetingRoomId.trim() || undefined) : undefined,
      invitationLink: formData.invitationLink.trim() || undefined,
      meetingFormat: formData.meetingFormat
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
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 rounded-t-3xl shrink-0">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl shadow-lg text-white shrink-0 ${editingMeeting ? 'bg-emerald-600 shadow-emerald-100 dark:shadow-none' : 'bg-blue-600 shadow-blue-100 dark:shadow-none'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {editingMeeting ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                )}
              </svg>
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{editingMeeting ? 'Cập nhật cuộc họp' : 'Cuộc họp mới'}</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-medium hidden sm:block">{editingMeeting ? `Mã: ${editingMeeting.id}` : 'Điền thông tin chi tiết bên dưới'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all border border-transparent hover:border-gray-100 dark:hover:border-slate-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            <div className="lg:col-span-7 space-y-6">
              <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] border-l-4 border-blue-600 dark:border-blue-400 pl-3">Nội dung & Thời gian</h4>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Chủ đề cuộc họp *</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none transition-all text-gray-900 dark:text-white"
                  placeholder="Nhập tiêu đề chi tiết của cuộc họp..."
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Đơn vị chủ trì *</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none transition-all appearance-none cursor-pointer text-gray-900 dark:text-white"
                    value={formData.hostUnitId}
                    onChange={handleUnitChange}
                  >
                    <option value="">-- Chọn đơn vị --</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id} className="dark:bg-slate-800">{u.name} ({u.code})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Cán bộ chủ trì *</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none transition-all appearance-none cursor-pointer text-gray-900 dark:text-white"
                    value={formData.chairPersonId}
                    onChange={handleStaffChange}
                    disabled={!formData.hostUnitId}
                  >
                    <option value="" className="dark:bg-slate-800">{formData.hostUnitId ? '-- Chọn cán bộ --' : '-- Chọn đơn vị trước --'}</option>
                    {filteredStaffForUnit.map(s => (
                      <option key={s.id} value={s.id} className="dark:bg-slate-800">{s.fullName} - {s.position}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Thời điểm bắt đầu *</label>
                  <div className="flex gap-2">
                    <input 
                      required
                      type="date" 
                      className="flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none transition-all text-gray-900 dark:text-white font-medium"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                    />
                    <input 
                      required
                      type="text" 
                      placeholder="HH:mm"
                      pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                      title="Định dạng 24-giờ (ví dụ: 14:30)"
                      className="w-32 px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none transition-all text-gray-900 dark:text-white text-center font-mono font-bold"
                      value={startTime}
                      onChange={e => {
                        let val = e.target.value;
                        val = val.replace(/[^0-9:]/g, '');
                        if (val.length === 2 && !val.includes(':') && startTime.length < 2) {
                          val = val + ':';
                        }
                        if (val.length > 5) {
                          val = val.slice(0, 5);
                        }
                        setStartTime(val);
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Dự kiến kết thúc *</label>
                  <div className="flex gap-2">
                    <input 
                      required
                      type="date" 
                      className="flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none transition-all text-gray-900 dark:text-white font-medium"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                    />
                    <input 
                      required
                      type="text" 
                      placeholder="HH:mm"
                      pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                      title="Định dạng 24-giờ (ví dụ: 17:00)"
                      className="w-32 px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none transition-all text-gray-900 dark:text-white text-center font-mono font-bold"
                      value={endTime}
                      onChange={e => {
                        let val = e.target.value;
                        val = val.replace(/[^0-9:]/g, '');
                        if (val.length === 2 && !val.includes(':') && endTime.length < 2) {
                          val = val + ':';
                        }
                        if (val.length > 5) {
                          val = val.slice(0, 5);
                        }
                        setEndTime(val);
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Link giấy mời</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none transition-all text-gray-900 dark:text-white font-mono"
                  placeholder="Nhập link giấy mời từ hệ thống lưu trữ..."
                  value={formData.invitationLink}
                  onChange={e => setFormData({...formData, invitationLink: e.target.value})}
                />
                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium italic">Đường dẫn xem giấy mời hoặc tài liệu cuộc họp.</p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Hình thức họp *</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, meetingFormat: 'TRUC_TUYEN' })}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all ${
                      formData.meetingFormat === 'TRUC_TUYEN'
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-sm'
                        : 'bg-gray-50/50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Video size={16} />
                    Trực tuyến
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, meetingFormat: 'TRUC_TIEP' })}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all ${
                      formData.meetingFormat === 'TRUC_TIEP'
                        ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-500 text-amber-700 dark:text-amber-400 shadow-sm'
                        : 'bg-gray-50/50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <MapPin size={16} />
                    Trực tiếp
                  </button>
                </div>
              </div>

              {editingMeeting && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Trạng thái cuộc họp *</label>
                    <select
                      required
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer text-gray-900 dark:text-white"
                      value={status}
                      onChange={e => setStatus(e.target.value as any)}
                    >
                      <option value="SCHEDULED" className="dark:bg-slate-800">Lên lịch (Bình thường)</option>
                      <option value="POSTPONED" className="dark:bg-slate-800">Tạm hoãn</option>
                      <option value="CANCELLED" className="dark:bg-slate-800">Huỷ cuộc họp</option>
                      <option value="CHANGED_FORMAT" className="dark:bg-slate-800">Chuyển hình thức họp</option>
                    </select>
                  </div>

                  {(status === 'CANCELLED' || status === 'POSTPONED') && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                      <label className="text-sm font-bold text-gray-700 dark:text-slate-300">
                        Lý do {status === 'CANCELLED' ? 'huỷ' : 'hoãn'} cuộc họp *
                      </label>
                      <textarea
                        required
                        rows={2}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition-all text-gray-900 dark:text-white"
                        placeholder={`Nhập lý do chi tiết ${status === 'CANCELLED' ? 'huỷ' : 'hoãn'}...`}
                        value={cancelReason}
                        onChange={e => setCancelReason(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}

              {formData.meetingFormat === 'TRUC_TUYEN' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-700 dark:text-slate-300">ID phòng họp</label>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400">Chọn nhanh hoặc nhập ID thực tế</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 py-1">
                    {['1@10.8.0.1', '2@10.8.0.1', '3@10.8.0.1', '4@10.8.0.1'].map(id => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setFormData({...formData, meetingRoomId: id})}
                        className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                          formData.meetingRoomId === id
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'bg-white hover:bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-750 border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {id}
                      </button>
                    ))}
                    {formData.meetingRoomId && !['1@10.8.0.1', '2@10.8.0.1', '3@10.8.0.1', '4@10.8.0.1'].includes(formData.meetingRoomId) && (
                      <div className="px-3 py-1.5 text-xs font-mono font-bold rounded-lg border bg-blue-50/50 dark:bg-slate-900 border-blue-200 text-blue-600 dark:text-blue-400">
                        ID thực tế: {formData.meetingRoomId}
                      </div>
                    )}
                  </div>

                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none transition-all text-gray-900 dark:text-white font-mono"
                    placeholder="Nhập ID phòng họp thực tế"
                    value={formData.meetingRoomId}
                    onChange={e => setFormData({...formData, meetingRoomId: e.target.value})}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Thành phần khác</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none transition-all text-gray-900 dark:text-white"
                  placeholder="Gợi ý: Ban Giám đốc, Toàn thể CBNV..."
                  value={formData.participants}
                  onChange={e => setFormData({...formData, participants: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Nội dung thảo luận</label>
                <textarea 
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none resize-none transition-all text-gray-900 dark:text-white"
                  placeholder="Mô tả tóm tắt chương trình họp..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col space-y-6">
              <div className="flex justify-between items-center border-l-4 border-blue-600 dark:border-blue-400 pl-3">
                <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">Cấu hình Điểm cầu</h4>
                <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-black">
                  ĐÃ CHỌN: {selectedEndpointIds.length}
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-800/50 rounded-3xl border border-gray-100 dark:border-slate-800 p-4 space-y-4 shadow-inner min-h-[300px]">
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Tìm kiếm điểm cầu..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow text-gray-900 dark:text-white"
                    value={endpointSearch}
                    onChange={e => setEndpointSearch(e.target.value)}
                  />
                  <svg className="w-4 h-4 absolute left-3.5 top-3 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>

                {/* Chọn lọc theo Nhóm */}
                <div className="flex flex-wrap gap-1 bg-white dark:bg-slate-900/40 p-1 border border-gray-200/60 dark:border-slate-800 rounded-xl shadow-sm">
                  {[{ id: "ALL", name: "Tất cả" }, ...endpointGroups].map((group) => {
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => setSelectedGroup(group.id)}
                        className={`flex-1 min-w-[70px] py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-wider ${
                          selectedGroup === group.id
                            ? "bg-blue-600 dark:bg-blue-500 text-white shadow-sm"
                            : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
                        }`}
                      >
                        {group.name}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between px-2">
                  <button 
                    type="button"
                    onClick={() => setSelectedEndpointIds(filteredEndpoints.map(e => e.id))}
                    className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    Chọn tất cả ({filteredEndpoints.length})
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSelectedEndpointIds([])}
                    className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider hover:text-gray-600 dark:hover:text-slate-300"
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
                          ? 'bg-white dark:bg-slate-800 border-blue-500 dark:border-blue-400 shadow-md translate-x-1' 
                          : 'bg-white/50 dark:bg-slate-900/50 border-gray-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/50'
                      }`}
                    >
                      <div className={`relative flex items-center justify-center w-5 h-5 rounded-md border-2 transition-colors shrink-0 ${
                        selectedEndpointIds.includes(ep.id) ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500' : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600'
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
                          <span className={`text-sm font-bold truncate ${selectedEndpointIds.includes(ep.id) ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-slate-200'}`}>{ep.name}</span>
                          <span className={`w-2 h-2 rounded-full shrink-0 ${ep.status === EndpointStatus.CONNECTED ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium mt-0.5 truncate uppercase tracking-widest">
                          {ep.location} {ep.ip1 && `• IP: ${ep.ip1}`}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row justify-end gap-4 shrink-0">
            <button 
              type="button"
              onClick={onClose}
              className="px-8 py-3.5 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 rounded-2xl text-sm font-black hover:bg-gray-50 dark:hover:bg-slate-800 transition-all active:scale-95 w-full sm:w-auto"
            >
              HỦY BỎ
            </button>
            <button 
              type="submit"
              className={`px-12 py-3.5 text-white rounded-2xl text-sm font-black shadow-xl transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto ${
                editingMeeting ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none'
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
