
export enum EndpointStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING'
}

export type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  password?: string;
}

export interface EndpointGroup {
  id: string;
  name: string;
  description?: string;
}

export interface Endpoint {
  id: string;
  name: string;
  location: string;
  status: EndpointStatus;
  lastConnected: string;
  ip1?: string;
  ip2?: string;
  groupId?: string;
}

export interface Unit {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Staff {
  id: string;
  fullName: string;
  unitId: string;
  position: string;
  email?: string;
  phone?: string;
}

export interface ParticipantGroup {
  id: string;
  name: string;
  description?: string;
}

export interface Meeting {
  id: string;
  title: string;
  hostUnit: string;
  hostUnitId?: string; // Thêm trường ID đơn vị
  chairPerson: string;
  chairPersonId?: string; // Thêm trường ID cán bộ
  startTime: string;
  endTime: string;
  participants: string[];
  endpoints: Endpoint[];
  description: string;
  notes?: string;
  endpointChecks?: Record<string, { checked: boolean; notes: string }>;
  status?: 'SCHEDULED' | 'CANCELLED' | 'POSTPONED' | 'CHANGED_FORMAT';
  cancelReason?: string;
  invitationLink?: string;
  meetingRoomId?: string;
  meetingFormat?: 'TRUC_TUYEN' | 'TRUC_TIEP';
}

export interface StatData {
  name: string;
  count: number;
}

export interface SavedReportConfig {
  id: string;
  name: string;
  type: 'meetings' | 'endpoints' | 'units';
  startDate: string;
  endDate: string;
  selectedColumns: string[];
}

export interface AdBanner {
  id: string; // 'ad1' to 'ad6'
  title: string; // Tên quảng cáo / Liên kết
  image: string; // Base64 hoặc URL ảnh
  link: string; // Đường dẫn liên kết khi click
  active: boolean; // Trạng thái hiển thị
}

export interface SystemSettings {
  systemName: string;
  shortName: string;
  logoBase64?: string;
  primaryColor: string;
  supportQrBase64?: string;
  supportPhone?: string;
  banners?: AdBanner[]; // Danh sách 6 ô quảng cáo/banner liên kết
}

export interface SystemOperator {
  id: string;
  fullName: string;
  position: string;
  endpointId: string;
  phone: string;
  createdAt?: string;
}
