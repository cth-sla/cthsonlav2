
import React, { useState, useMemo, useEffect } from 'react';
import { Video, MapPin, FileUp, Download, AlertCircle, Trash2, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
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

const getEndpointGroup = (ep: { name: string; location?: string }): 'XA_PHUONG' | 'SO_NGANH' | 'UBND' => {
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
    return 'UBND';
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
    meetingRoomId: '',
    invitationLink: '',
    meetingFormat: 'TRUC_TUYEN' as 'TRUC_TUYEN' | 'TRUC_TIEP',
  });
  
  const [selectedEndpointIds, setSelectedEndpointIds] = useState<string[]>([]);
  const [endpointSearch, setEndpointSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<'ALL' | 'XA_PHUONG' | 'SO_NGANH' | 'UBND'>('ALL');
  const [status, setStatus] = useState<'SCHEDULED' | 'CANCELLED' | 'POSTPONED' | 'CHANGED_FORMAT'>('SCHEDULED');
  const [cancelReason, setCancelReason] = useState('');

  // Trạng thái nhập Excel
  interface ParsedMeetingRow {
    id: string;
    title: string;
    hostUnit: string;
    hostUnitId: string;
    chairPerson: string;
    chairPersonId: string;
    startTime: string;
    endTime: string;
    description: string;
    participants: string[];
    endpoints: Endpoint[];
    meetingFormat: 'TRUC_TUYEN' | 'TRUC_TIEP';
    meetingRoomId?: string;
    invitationLink?: string;
    errors: string[];
    warnings: string[];
  }

  const [isImportMode, setIsImportMode] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedMeetingRow[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Helper: Chuẩn hóa định dạng thời gian từ Excel
  const parseExcelDate = (val: any): string => {
    if (!val) return '';
    if (val instanceof Date) {
      return val.toISOString();
    }
    if (typeof val === 'number') {
      const date = new Date((val - 25569) * 86400 * 1000);
      return isNaN(date.getTime()) ? '' : date.toISOString();
    }
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!trimmed) return '';
      // Format DD/MM/YYYY HH:mm hoặc DD-MM-YYYY HH:mm
      const dmyRegex = /^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/;
      const match = trimmed.match(dmyRegex);
      if (match) {
        const [_, day, month, year, hour, minute, second = '0'] = match;
        const date = new Date(
          parseInt(year), 
          parseInt(month) - 1, 
          parseInt(day), 
          parseInt(hour), 
          parseInt(minute), 
          parseInt(second)
        );
        return isNaN(date.getTime()) ? '' : date.toISOString();
      }
      // Format DD/MM/YYYY hoặc DD-MM-YYYY (không có giờ)
      const dmyNoTimeRegex = /^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/;
      const matchNoTime = trimmed.match(dmyNoTimeRegex);
      if (matchNoTime) {
        const [_, day, month, year] = matchNoTime;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0);
        return isNaN(date.getTime()) ? '' : date.toISOString();
      }
      const date = new Date(trimmed);
      return isNaN(date.getTime()) ? '' : date.toISOString();
    }
    return '';
  };

  // Helper: Tìm kiếm đơn vị chủ trì khớp trong danh mục
  const findMatchedUnit = (unitText: string) => {
    if (!unitText) return { id: '', name: '' };
    const lower = unitText.toString().trim().toLowerCase();
    const matched = units.find(u => 
      u.name.toLowerCase().includes(lower) || 
      u.code.toLowerCase().includes(lower)
    );
    if (matched) {
      return { id: matched.id, name: matched.name };
    }
    return { id: '', name: unitText.toString().trim() };
  };

  // Helper: Tìm kiếm cán bộ chủ trì khớp trong danh mục cán bộ
  const findMatchedStaff = (staffText: string, hostUnitId: string) => {
    if (!staffText) return { id: '', name: '' };
    const lower = staffText.toString().trim().toLowerCase();
    const searchPool = hostUnitId ? staff.filter(s => s.unitId === hostUnitId) : staff;
    const matched = searchPool.find(s => 
      s.fullName.toLowerCase().includes(lower)
    );
    if (matched) {
      return { id: matched.id, name: matched.fullName };
    }
    if (hostUnitId) {
      const fallbackMatched = staff.find(s => s.fullName.toLowerCase().includes(lower));
      if (fallbackMatched) {
        return { id: fallbackMatched.id, name: fallbackMatched.fullName };
      }
    }
    return { id: '', name: staffText.toString().trim() };
  };

  // Helper: Tìm kiếm các điểm cầu khớp dựa trên chuỗi văn bản phân cách
  const findMatchedEndpoints = (endpointsText: string): Endpoint[] => {
    if (!endpointsText) return [];
    const names = endpointsText.split(/[,\;\n]/).map(n => n.trim()).filter(n => n !== '');
    const matched: Endpoint[] = [];
    
    names.forEach(name => {
      const lower = name.toLowerCase();
      const found = availableEndpoints.find(ep => 
        ep.name.toLowerCase().includes(lower) || 
        ep.location.toLowerCase().includes(lower)
      );
      if (found && !matched.some(m => m.id === found.id)) {
        matched.push(found);
      }
    });
    
    if (names.some(name => name.toLowerCase() === 'tất cả' || name.toLowerCase() === 'all')) {
      return availableEndpoints;
    }
    
    return matched;
  };

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
        meetingRoomId: editingMeeting.meetingRoomId || '',
        invitationLink: editingMeeting.invitationLink || '',
        meetingFormat: editingMeeting.meetingFormat || (editingMeeting.meetingRoomId ? 'TRUC_TUYEN' : 'TRUC_TIEP'),
      });
      setSelectedEndpointIds(editingMeeting.endpoints.map(e => e.id));
      setStatus(editingMeeting.status || 'SCHEDULED');
      setCancelReason(editingMeeting.cancelReason || '');
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

  // Các xử lý liên quan đến Import Excel
  const handleFile = (file: File) => {
    if (!file) return;
    
    setImportLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws) as any[];

        if (rawData.length === 0) {
          alert("File Excel trống hoặc không đúng định dạng.");
          setImportLoading(false);
          return;
        }

        const rows: ParsedMeetingRow[] = rawData.map((row, index) => {
          const title = String(row['Chủ đề cuộc họp'] || row['Chủ đề'] || row['Tên cuộc họp'] || row['Tiêu đề'] || '').trim();
          
          const hostUnitRaw = String(row['Đơn vị chủ trì'] || row['Đơn vị'] || row['Tên đơn vị'] || '').trim();
          const { id: hostUnitId, name: hostUnit } = findMatchedUnit(hostUnitRaw);

          const chairPersonRaw = String(row['Cán bộ chủ trì'] || row['Người chủ trì'] || row['Chủ trì'] || '').trim();
          const { id: chairPersonId, name: chairPerson } = findMatchedStaff(chairPersonRaw, hostUnitId);

          const startTimeStr = row['Thời gian bắt đầu'] || row['Bắt đầu'] || '';
          const endTimeStr = row['Thời gian kết thúc'] || row['Kết thúc'] || '';
          
          const startTimeISO = parseExcelDate(startTimeStr);
          const endTimeISO = parseExcelDate(endTimeStr);

          const meetingFormatRaw = String(row['Hình thức họp'] || row['Hình thức'] || '').trim().toLowerCase();
          const meetingFormat = (meetingFormatRaw.includes('trực tiếp') || meetingFormatRaw.includes('tieu_bieu') || meetingFormatRaw.includes('truc_tiep'))
            ? 'TRUC_TIEP'
            : 'TRUC_TUYEN';

          const meetingRoomId = String(row['ID phòng họp'] || row['ID phòng'] || row['Phòng'] || '').trim();
          const invitationLink = String(row['Link giấy mời'] || row['Giấy mời'] || row['Link'] || '').trim();
          
          const participantsRaw = String(row['Thành phần khác'] || row['Thành phần'] || '').trim();
          const participants = participantsRaw ? participantsRaw.split(/[,\;\n]/).map(p => p.trim()).filter(p => p !== '') : [];

          const description = String(row['Nội dung thảo luận'] || row['Nội dung'] || row['Mô tả'] || '').trim();

          const endpointsRaw = String(row['Danh sách điểm cầu'] || row['Điểm cầu'] || '').trim();
          let matchedEndpoints = findMatchedEndpoints(endpointsRaw);

          const errors: string[] = [];
          const warnings: string[] = [];

          if (!title) {
            errors.push("Chủ đề cuộc họp bắt buộc phải có");
          }

          if (!startTimeISO) {
            errors.push("Thời gian bắt đầu không hợp lệ hoặc bị trống");
          }

          if (!endTimeISO) {
            errors.push("Thời gian kết thúc không hợp lệ hoặc bị trống");
          }

          if (startTimeISO && endTimeISO) {
            if (new Date(startTimeISO) >= new Date(endTimeISO)) {
              errors.push("Thời gian bắt đầu phải trước thời gian kết thúc");
            }
          }

          if (hostUnitRaw && !hostUnitId) {
            warnings.push(`Đơn vị '${hostUnitRaw}' không có trong danh mục (sẽ lưu dạng chữ thường)`);
          } else if (!hostUnitRaw) {
            errors.push("Đơn vị chủ trì không được để trống");
          }

          if (chairPersonRaw && !chairPersonId) {
            warnings.push(`Cán bộ '${chairPersonRaw}' không có trong danh mục cán bộ (sẽ lưu dạng chữ thường)`);
          } else if (!chairPersonRaw) {
            errors.push("Cán bộ chủ trì không được để trống");
          }

          if (matchedEndpoints.length === 0) {
            if (availableEndpoints.length > 0) {
              matchedEndpoints = [availableEndpoints[0]];
              warnings.push(`Không có điểm cầu khớp. Đã tự động chọn điểm cầu mặc định: ${availableEndpoints[0].name}`);
            } else {
              errors.push("Hệ thống chưa có điểm cầu nào khả dụng");
            }
          }

          return {
            id: `row-${index}-${Date.now()}`,
            title,
            hostUnit,
            hostUnitId,
            chairPerson,
            chairPersonId,
            startTime: startTimeISO,
            endTime: endTimeISO,
            description,
            participants,
            endpoints: matchedEndpoints,
            meetingFormat,
            meetingRoomId: meetingRoomId || undefined,
            invitationLink: invitationLink || undefined,
            errors,
            warnings
          };
        });

        setParsedRows(rows);
        setSelectedRowIds(rows.filter(r => r.errors.length === 0).map(r => r.id));
      } catch (error) {
        console.error("Lỗi đọc file Excel:", error);
        alert("Lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng.");
      } finally {
        setImportLoading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "Chủ đề cuộc họp",
      "Đơn vị chủ trì",
      "Cán bộ chủ trì",
      "Thời gian bắt đầu",
      "Thời gian kết thúc",
      "Hình thức họp",
      "ID phòng họp",
      "Link giấy mời",
      "Thành phần khác",
      "Nội dung thảo luận",
      "Danh sách điểm cầu"
    ];
    
    const sampleUnit = units[0]?.name || "Văn phòng UBND Tỉnh";
    const sampleStaff = staff.find(s => s.unitId === units[0]?.id)?.fullName || staff[0]?.fullName || "Nguyễn Văn A";
    const sampleEndpoints = availableEndpoints.slice(0, 3).map(e => e.name).join(", ") || "UBND Tỉnh, Sở Tài chính";

    const data = [
      {
        "Chủ đề cuộc họp": "Hội nghị trực tuyến triển khai kế hoạch phát triển kinh tế xã hội năm 2026",
        "Đơn vị chủ trì": sampleUnit,
        "Cán bộ chủ trì": sampleStaff,
        "Thời gian bắt đầu": "2026-07-20 08:30",
        "Thời gian kết thúc": "2026-07-20 11:30",
        "Hình thức họp": "Trực tuyến",
        "ID phòng họp": "999-888-777",
        "Link giấy mời": "https://giaymoi.example.com/gm123",
        "Thành phần khác": "Toàn thể cán bộ, công chức thuộc cơ quan",
        "Nội dung thảo luận": "1. Khai mạc hội nghị\n2. Phát biểu chỉ đạo của Lãnh đạo\n3. Trình bày dự thảo quyết định\n4. Thảo luận đóng góp ý kiến",
        "Danh sách điểm cầu": sampleEndpoints
      }
    ];

    const ws = XLSX.utils.json_to_sheet(data, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lịch Họp Template");
    
    const max_len = headers.map(h => h.length);
    ws['!cols'] = max_len.map(len => ({ wch: len + 6 }));

    XLSX.writeFile(wb, "Template_Lich_Hop.xlsx");
  };

  const handleConfirmImport = () => {
    const rowsToImport = parsedRows.filter(r => selectedRowIds.includes(r.id));
    if (rowsToImport.length === 0) {
      alert("Vui lòng chọn ít nhất một cuộc họp hợp lệ để nhập.");
      return;
    }

    const hasErrors = rowsToImport.some(r => r.errors.length > 0);
    if (hasErrors) {
      if (!window.confirm("Một số cuộc họp được chọn chứa lỗi. Bạn có chắc muốn tiếp tục nhập? Những cuộc họp bị lỗi nghiêm trọng có thể không hiển thị đúng.")) {
        return;
      }
    }

    try {
      rowsToImport.forEach((row, i) => {
        const meetingData: Meeting = {
          id: `MEET-${Math.floor(1000 + Math.random() * 9000)}-${Date.now()}-${i}`,
          title: row.title,
          hostUnit: row.hostUnit,
          hostUnitId: row.hostUnitId || undefined,
          chairPerson: row.chairPerson,
          chairPersonId: row.chairPersonId || undefined,
          startTime: row.startTime,
          endTime: row.endTime,
          description: row.description,
          participants: row.participants,
          endpoints: row.endpoints,
          status: 'SCHEDULED',
          meetingFormat: row.meetingFormat,
          meetingRoomId: row.meetingRoomId,
          invitationLink: row.invitationLink
        };
        onCreate(meetingData);
      });

      alert(`Đã nhập thành công ${rowsToImport.length} cuộc họp vào hệ thống.`);
      setParsedRows([]);
      setSelectedRowIds([]);
      setIsImportMode(false);
      onClose();
    } catch (e) {
      console.error("Lỗi thực hiện nhập lịch họp:", e);
      alert("Đã xảy ra lỗi trong quá trình lưu lịch họp.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 rounded-t-3xl shrink-0">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl shadow-lg text-white shrink-0 ${isImportMode ? 'bg-indigo-600' : editingMeeting ? 'bg-emerald-600 shadow-emerald-100 dark:shadow-none' : 'bg-blue-600 shadow-blue-100 dark:shadow-none'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isImportMode ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                ) : editingMeeting ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                )}
              </svg>
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                {isImportMode ? 'Nhập lịch họp từ file Excel' : editingMeeting ? 'Cập nhật cuộc họp' : 'Tạo lịch họp mới'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-medium hidden sm:block">
                {isImportMode ? 'Tải file Excel lên để thêm danh sách cuộc họp nhanh chóng' : editingMeeting ? `Mã: ${editingMeeting.id}` : 'Điền thông tin chi tiết bên dưới'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!editingMeeting && (
              <button
                type="button"
                onClick={() => {
                  setIsImportMode(!isImportMode);
                  if (isImportMode) {
                    setParsedRows([]);
                    setSelectedRowIds([]);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  isImportMode 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200' 
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                {isImportMode ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                    TẠO THỦ CÔNG
                  </>
                ) : (
                  <>
                    <FileUp size={14} />
                    NHẬP TỪ EXCEL
                  </>
                )}
              </button>
            )}

            <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all border border-transparent hover:border-gray-100 dark:hover:border-slate-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {isImportMode ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden min-h-[500px]">
            {importLoading ? (
              <div className="flex-1 flex flex-col justify-center items-center min-h-[400px]">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-sm font-bold text-gray-700 dark:text-slate-300">Đang đọc và phân tích dữ liệu file Excel...</p>
              </div>
            ) : parsedRows.length === 0 ? (
              <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col justify-center items-center min-h-[400px]">
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`w-full max-w-2xl border-4 border-dashed rounded-[2.5rem] p-8 md:p-12 text-center transition-all ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 scale-102' 
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-3xl shadow-lg shadow-blue-100 dark:shadow-none animate-bounce-subtle">
                      <FileUp size={40} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-black text-gray-900 dark:text-white">Kéo thả file Excel vào đây</h4>
                      <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                        Hỗ trợ định dạng .xlsx, .xls. Các thông tin sẽ được tự động chuẩn hóa và đối chiếu với danh mục đơn vị, cán bộ, điểm cầu trên hệ thống.
                      </p>
                    </div>
                    
                    <div className="pt-2">
                      <input 
                        type="file" 
                        id="excel-file-selector" 
                        accept=".xlsx, .xls" 
                        className="hidden" 
                        onChange={handleFileChange} 
                      />
                      <label 
                        htmlFor="excel-file-selector"
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-200 dark:shadow-none transition-all hover:-translate-y-0.5 active:scale-95 inline-block cursor-pointer uppercase tracking-wider"
                      >
                        Chọn file từ máy tính
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-2xl bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
                  <div className="text-center sm:text-left space-y-1">
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Chưa có file mẫu dữ liệu?</p>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">Tải ngay file mẫu Excel đã được định dạng sẵn để nhập nhanh nhất.</p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs font-black flex items-center gap-2 shrink-0 transition-all active:scale-95"
                  >
                    <Download size={14} />
                    TẢI FILE MẪU EXCEL
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header Stats */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900/60 border-b border-gray-100 dark:border-slate-800 flex flex-wrap gap-4 justify-between items-center shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Tổng số: <span className="font-black text-blue-600">{parsedRows.length}</span> cuộc họp
                    </div>
                    <div className="text-xs font-medium text-slate-500">
                      • Hợp lệ: <span className="font-black text-emerald-600">{parsedRows.filter(r => r.errors.length === 0).length}</span>
                    </div>
                    <div className="text-xs font-medium text-slate-500">
                      • Có lỗi: <span className="font-black text-red-600">{parsedRows.filter(r => r.errors.length > 0).length}</span>
                    </div>
                  </div>
                  
                  <div className="text-xs font-black px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded-lg">
                    CHỌN NHẬP: {selectedRowIds.length} / {parsedRows.length}
                  </div>
                </div>

                {/* Table Preview */}
                <div className="flex-1 overflow-x-auto overflow-y-auto p-4 md:p-6">
                  <table className="w-full text-left text-sm min-w-[900px] border-collapse bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm">
                    <thead className="bg-gray-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      <tr className="border-b border-gray-100 dark:border-slate-800">
                        <th className="px-4 py-4 w-12 text-center">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                            checked={selectedRowIds.length === parsedRows.length && parsedRows.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRowIds(parsedRows.map(r => r.id));
                              } else {
                                setSelectedRowIds([]);
                              }
                            }}
                          />
                        </th>
                        <th className="px-4 py-4 w-12 text-center">STT</th>
                        <th className="px-6 py-4">Chủ đề & Hình thức</th>
                        <th className="px-6 py-4">Chủ trì</th>
                        <th className="px-6 py-4">Thời gian</th>
                        <th className="px-6 py-4">Điểm cầu</th>
                        <th className="px-6 py-4 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {parsedRows.map((row, idx) => {
                        const hasErrors = row.errors.length > 0;
                        const hasWarnings = row.warnings.length > 0;
                        const isSelected = selectedRowIds.includes(row.id);

                        return (
                          <tr 
                            key={row.id} 
                            className={`hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-all ${
                              hasErrors ? 'bg-red-50/20 dark:bg-red-950/5' : ''
                            } ${isSelected ? 'bg-blue-50/10 dark:bg-blue-950/5' : ''}`}
                          >
                            <td className="px-4 py-3 text-center">
                              <input 
                                type="checkbox" 
                                className="rounded border-gray-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRowIds(prev => [...prev, row.id]);
                                  } else {
                                    setSelectedRowIds(prev => prev.filter(id => id !== row.id));
                                  }
                                }}
                              />
                            </td>
                            <td className="px-4 py-3 text-center text-xs font-mono text-gray-500">{idx + 1}</td>
                            <td className="px-6 py-3">
                              <div className="font-bold text-gray-900 dark:text-white line-clamp-1" title={row.title}>
                                {row.title || <span className="text-red-500 italic">Trống</span>}
                              </div>
                              <div className="flex gap-2 items-center mt-1">
                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                                  row.meetingFormat === 'TRUC_TUYEN' 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50' 
                                    : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50'
                                }`}>
                                  {row.meetingFormat === 'TRUC_TUYEN' ? 'Trực tuyến' : 'Trực tiếp'}
                                </span>
                                {row.meetingRoomId && (
                                  <span className="text-[10px] text-slate-500 font-mono">ID: {row.meetingRoomId}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <div className="text-xs font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${row.hostUnitId ? 'bg-green-500' : 'bg-amber-500'}`} title={row.hostUnitId ? "Đã so khớp danh mục" : "Custom text"}></span>
                                {row.hostUnit}
                              </div>
                              <div className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${row.chairPersonId ? 'bg-green-500' : 'bg-amber-500'}`} title={row.chairPersonId ? "Đã so khớp danh mục" : "Custom text"}></span>
                                {row.chairPerson}
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                {row.startTime ? new Date(row.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--'} {row.startTime ? new Date(row.startTime).toLocaleDateString('vi-VN') : ''}
                              </div>
                              <div className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                                Đến: {row.endTime ? new Date(row.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--'} {row.endTime ? new Date(row.endTime).toLocaleDateString('vi-VN') : ''}
                              </div>
                            </td>
                            <td className="px-6 py-3 max-w-[200px]">
                              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title={row.endpoints.map(e => e.name).join(', ')}>
                                {row.endpoints.map(e => e.name).join(', ')}
                              </div>
                              <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                                Đã khớp {row.endpoints.filter(e => availableEndpoints.some(ae => ae.id === e.id)).length} điểm cầu
                              </div>
                            </td>
                            <td className="px-6 py-3 text-center">
                              {hasErrors ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900 rounded-lg text-xs font-bold">
                                  <AlertCircle size={12} />
                                  {row.errors.length} lỗi
                                </div>
                              ) : hasWarnings ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900 rounded-lg text-xs font-bold">
                                  <AlertCircle size={12} />
                                  {row.warnings.length} lưu ý
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 rounded-lg text-xs font-bold">
                                  <Check size={12} />
                                  Hợp lệ
                                </div>
                              )}
                              
                              {(hasErrors || hasWarnings) && (
                                <div className="text-[10px] text-left mt-1 text-gray-500 dark:text-slate-400 max-w-[250px] mx-auto bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 space-y-0.5">
                                  {row.errors.map((e, idx) => (
                                    <div key={`err-${idx}`} className="text-red-600 dark:text-red-400 font-medium">• {e}</div>
                                  ))}
                                  {row.warnings.map((w, idx) => (
                                    <div key={`warn-${idx}`} className="text-amber-600 dark:text-amber-400 font-medium">• {w}</div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer Controls */}
                <div className="mt-4 p-4 md:p-6 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between gap-4 bg-gray-50 dark:bg-slate-900/40 rounded-b-3xl shrink-0">
                  <button 
                    type="button"
                    onClick={() => {
                      setParsedRows([]);
                      setSelectedRowIds([]);
                    }}
                    className="px-6 py-3.5 border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/20 rounded-2xl text-sm font-black transition-all active:scale-95 w-full sm:w-auto uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Xóa kết quả & Chọn lại file
                  </button>
                  
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button 
                      type="button"
                      onClick={() => setIsImportMode(false)}
                      className="px-6 py-3.5 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 rounded-2xl text-sm font-black hover:bg-gray-100 dark:hover:bg-slate-800 transition-all active:scale-95 w-full sm:w-auto uppercase tracking-wider"
                    >
                      QUAY LẠI
                    </button>
                    <button 
                      type="button"
                      onClick={handleConfirmImport}
                      disabled={selectedRowIds.length === 0}
                      className={`px-10 py-3.5 text-white rounded-2xl text-sm font-black shadow-xl transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto uppercase tracking-wider ${
                        selectedRowIds.length === 0
                          ? 'bg-gray-300 dark:bg-slate-800 cursor-not-allowed shadow-none'
                          : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none'
                      }`}
                    >
                      <span>NHẬP {selectedRowIds.length} CUỘC HỌP</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
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
                  <input 
                    required
                    type="datetime-local" 
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none transition-all text-gray-900 dark:text-white"
                    value={formData.startTime}
                    onChange={e => setFormData({...formData, startTime: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Dự kiến kết thúc *</label>
                  <input 
                    required
                    type="datetime-local" 
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none transition-all text-gray-900 dark:text-white"
                    value={formData.endTime}
                    onChange={e => setFormData({...formData, endTime: e.target.value})}
                  />
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
                  <label className="text-sm font-bold text-gray-700 dark:text-slate-300">ID phòng họp</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none transition-all text-gray-900 dark:text-white font-mono"
                    placeholder="Nhập ID phòng họp"
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
                  {(['ALL', 'XA_PHUONG', 'SO_NGANH', 'UBND'] as const).map((group) => {
                    const label = group === 'ALL' ? 'Tất cả' :
                                  group === 'XA_PHUONG' ? 'Xã/phường' :
                                  group === 'SO_NGANH' ? 'Sở/Ngành' : 'UBND';
                    return (
                      <button
                        key={group}
                        type="button"
                        onClick={() => setSelectedGroup(group)}
                        className={`flex-1 min-w-[70px] py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-wider ${
                          selectedGroup === group
                            ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm'
                            : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                        }`}
                      >
                        {label}
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
        )}
      </div>
    </div>
  );
};

export default CreateMeetingModal;
