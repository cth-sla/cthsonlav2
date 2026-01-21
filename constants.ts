
import { Meeting, EndpointStatus, Unit, Staff, ParticipantGroup, User } from './types';

export const MOCK_USERS: User[] = [
  { id: '1', username: 'admin', fullName: 'Quản trị viên Hệ thống', role: 'ADMIN', password: 'admin' },
  { id: '2', username: 'user', fullName: 'Cán bộ Giám sát', role: 'VIEWER', password: 'user' },
  { id: '3', username: 'leader', fullName: 'Lãnh đạo Đơn vị', role: 'VIEWER', password: 'user' },
];

export const MOCK_ENDPOINTS = [
  { id: '1', name: 'Điểm cầu Hà Nội', location: 'Tầng 5, Tòa nhà A', status: EndpointStatus.CONNECTED, lastConnected: '2024-05-20 08:00' },
  { id: '2', name: 'Điểm cầu TP.HCM', location: 'Tòa nhà B, Quận 1', status: EndpointStatus.CONNECTED, lastConnected: '2024-05-20 08:05' },
  { id: '3', name: 'Điểm cầu Đà Nẵng', location: 'VP Đại diện Miền Trung', status: EndpointStatus.DISCONNECTED, lastConnected: '2024-05-19 17:30' },
  { id: '4', name: 'Điểm cầu Cần Thơ', location: 'VP Cần Thơ', status: EndpointStatus.CONNECTED, lastConnected: '2024-05-20 08:15' },
  { id: '5', name: 'Điểm cầu Hải Phòng', location: 'VP Hải Phòng', status: EndpointStatus.DISCONNECTED, lastConnected: '2024-05-18 10:00' },
  { id: '6', name: 'Điểm cầu Nghệ An', location: 'VP Nghệ An', status: EndpointStatus.CONNECTED, lastConnected: '2024-05-20 08:20' },
  { id: '7', name: 'Điểm cầu Quảng Ninh', location: 'VP Quảng Ninh', status: EndpointStatus.CONNECTED, lastConnected: '2024-05-20 08:22' },
  { id: '8', name: 'Điểm cầu Khánh Hòa', location: 'VP Nha Trang', status: EndpointStatus.CONNECTED, lastConnected: '2024-05-20 08:25' },
  { id: '9', name: 'Điểm cầu Hà Giang', location: 'VP Hà Giang', status: EndpointStatus.CONNECTED, lastConnected: '2024-05-20 08:30' },
];

export const MOCK_UNITS: Unit[] = [
  { id: 'U1', name: 'Văn phòng Tổng công ty', code: 'VP-TCT', description: 'Đơn vị quản lý điều hành chung' },
  { id: 'U2', name: 'Phòng Kỹ thuật', code: 'P-KT', description: 'Quản lý vận hành hạ tầng' },
  { id: 'U3', name: 'Phòng Kế hoạch', code: 'P-KH', description: 'Lập kế hoạch và kinh doanh' },
  { id: 'U4', name: 'Phòng Tài chính', code: 'P-TC', description: 'Quản lý ngân sách' },
  { id: 'U5', name: 'Phòng Nhân sự', code: 'P-NS', description: 'Quản lý con người' },
];

// Helper to get dates for "this week" (Mon-Sun)
const now = new Date();
const currentDay = now.getDay(); // 0 is Sun, 1 is Mon...
const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // adjust when day is sunday
const monday = new Date(now.setDate(diff));

const getDayInWeek = (dayOffset: number, hour: number) => {
  const d = new Date(monday);
  d.setDate(monday.getDate() + dayOffset);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

export const MOCK_MEETINGS: Meeting[] = [
  {
    id: 'MEET-001',
    title: 'Họp Giao ban Sáng Thứ Hai',
    hostUnit: 'Văn phòng Tổng công ty',
    chairPerson: 'Nguyễn Văn A',
    startTime: getDayInWeek(0, 8),
    endTime: getDayInWeek(0, 10),
    participants: ['Ban Giám đốc', 'Trưởng các phòng ban'],
    endpoints: MOCK_ENDPOINTS.slice(0, 5),
    description: 'Báo cáo kết quả tuần trước và triển khai kế hoạch tuần mới.'
  },
  {
    id: 'MEET-002',
    title: 'Hội nghị Triển khai Kỹ thuật Q3',
    hostUnit: 'Phòng Kỹ thuật',
    chairPerson: 'Trần Thị B',
    startTime: getDayInWeek(1, 14),
    endTime: getDayInWeek(1, 17),
    participants: ['Đội Kỹ thuật', 'Đại diện Chi nhánh'],
    endpoints: MOCK_ENDPOINTS,
    description: 'Hướng dẫn cài đặt và vận hành hệ thống mới.'
  },
  {
    id: 'MEET-003',
    title: 'Họp Tổng kết Dự án AI',
    hostUnit: 'Phòng Kế hoạch',
    chairPerson: 'Lê Văn C',
    startTime: getDayInWeek(2, 9),
    endTime: getDayInWeek(2, 11),
    participants: ['Team AI', 'Đối tác Google'],
    endpoints: MOCK_ENDPOINTS.slice(0, 3),
    description: 'Đánh giá các mô hình Gemini đã triển khai.'
  },
  {
    id: 'MEET-004',
    title: 'Review Ngân sách Đào tạo',
    hostUnit: 'Phòng Tài chính',
    chairPerson: 'Phạm Minh D',
    startTime: getDayInWeek(2, 14),
    endTime: getDayInWeek(2, 16),
    participants: ['Phòng Nhân sự', 'Kế toán trưởng'],
    endpoints: MOCK_ENDPOINTS.slice(4, 6),
    description: 'Phê duyệt chi phí đào tạo kỹ năng số.'
  },
  {
    id: 'MEET-005',
    title: 'Họp An toàn Thông tin',
    hostUnit: 'Phòng Kỹ thuật',
    chairPerson: 'Trần Thị B',
    startTime: getDayInWeek(3, 10),
    endTime: getDayInWeek(3, 12),
    participants: ['Đội SOC', 'Ban CNTT'],
    endpoints: MOCK_ENDPOINTS.slice(0, 8),
    description: 'Phòng chống tấn công Ransomware.'
  },
  {
    id: 'MEET-006',
    title: 'Phỏng vấn Nhân sự Cấp cao',
    hostUnit: 'Phòng Nhân sự',
    chairPerson: 'Hoàng Văn E',
    startTime: getDayInWeek(4, 15),
    endTime: getDayInWeek(4, 17),
    participants: ['Hội đồng Tuyển dụng'],
    endpoints: MOCK_ENDPOINTS.slice(1, 2),
    description: 'Tuyển dụng vị trí Giám đốc Công nghệ.'
  }
];

export const MOCK_STAFF: Staff[] = [
  { id: 'S1', fullName: 'Nguyễn Văn A', unitId: 'U1', position: 'Tổng Giám đốc', email: 'vana@example.com' },
  { id: 'S2', fullName: 'Trần Thị B', unitId: 'U2', position: 'Trưởng phòng Kỹ thuật', email: 'thib@example.com' },
  { id: 'S3', fullName: 'Lê Văn C', unitId: 'U3', position: 'Phó phòng Kế hoạch', email: 'vanc@example.com' },
  { id: 'S4', fullName: 'Phạm Minh D', unitId: 'U1', position: 'Chánh Văn phòng', email: 'minhd@example.com' },
];

export const MOCK_PARTICIPANT_GROUPS: ParticipantGroup[] = [
  { id: 'G1', name: 'Ban Giám đốc', description: 'Bao gồm các lãnh đạo cao nhất' },
  { id: 'G2', name: 'Hội đồng quản trị', description: 'Các thành viên HĐQT' },
  { id: 'G3', name: 'Trưởng phó các phòng ban', description: 'Đội ngũ quản lý cấp trung' },
  { id: 'G4', name: 'Toàn thể cán bộ nhân viên', description: 'Tất cả nhân viên công ty' },
];
