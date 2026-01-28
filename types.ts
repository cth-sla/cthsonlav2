
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

export interface Endpoint {
  id: string;
  name: string;
  location: string;
  status: EndpointStatus;
  lastConnected: string;
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
  chairPerson: string;
  startTime: string;
  endTime: string;
  participants: string[];
  endpoints: Endpoint[];
  description: string;
  notes?: string;
  endpointChecks?: Record<string, { checked: boolean; notes: string }>;
  status?: 'SCHEDULED' | 'CANCELLED' | 'POSTPONED';
  cancelReason?: string;
  invitationLink?: string;
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

export interface SystemSettings {
  systemName: string;
  shortName: string;
  logoBase64?: string;
  primaryColor: string;
}
