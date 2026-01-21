
import { Meeting, Unit, Staff, ParticipantGroup, User, Endpoint, SavedReportConfig } from '../types';
import { MOCK_MEETINGS, MOCK_UNITS, MOCK_STAFF, MOCK_PARTICIPANT_GROUPS, MOCK_USERS, MOCK_ENDPOINTS } from '../constants';

const DB_KEYS = {
  MEETINGS: 'cth_sla_meetings',
  UNITS: 'cth_sla_units',
  STAFF: 'cth_sla_staff',
  GROUPS: 'cth_sla_groups',
  USERS: 'cth_sla_users',
  ENDPOINTS: 'cth_sla_endpoints',
  SAVED_REPORTS: 'cth_sla_saved_reports'
};

export const storageService = {
  // Khởi tạo dữ liệu ban đầu nếu chưa có
  init() {
    if (!localStorage.getItem(DB_KEYS.UNITS)) {
      localStorage.setItem(DB_KEYS.UNITS, JSON.stringify(MOCK_UNITS));
    }
    if (!localStorage.getItem(DB_KEYS.STAFF)) {
      localStorage.setItem(DB_KEYS.STAFF, JSON.stringify(MOCK_STAFF));
    }
    if (!localStorage.getItem(DB_KEYS.GROUPS)) {
      localStorage.setItem(DB_KEYS.GROUPS, JSON.stringify(MOCK_PARTICIPANT_GROUPS));
    }
    if (!localStorage.getItem(DB_KEYS.USERS)) {
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(MOCK_USERS));
    }
    if (!localStorage.getItem(DB_KEYS.MEETINGS)) {
      localStorage.setItem(DB_KEYS.MEETINGS, JSON.stringify(MOCK_MEETINGS));
    }
    if (!localStorage.getItem(DB_KEYS.ENDPOINTS)) {
      localStorage.setItem(DB_KEYS.ENDPOINTS, JSON.stringify(MOCK_ENDPOINTS));
    }
    if (!localStorage.getItem(DB_KEYS.SAVED_REPORTS)) {
      localStorage.setItem(DB_KEYS.SAVED_REPORTS, JSON.stringify([]));
    }
  },

  // Generic Get/Set
  getData<T>(key: string, defaultValue: T): T {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  },

  saveData<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
  },

  // Specific Methods
  getMeetings(): Meeting[] { return this.getData(DB_KEYS.MEETINGS, MOCK_MEETINGS); },
  saveMeetings(data: Meeting[]) { this.saveData(DB_KEYS.MEETINGS, data); },

  getUnits(): Unit[] { return this.getData(DB_KEYS.UNITS, MOCK_UNITS); },
  saveUnits(data: Unit[]) { this.saveData(DB_KEYS.UNITS, data); },

  getStaff(): Staff[] { return this.getData(DB_KEYS.STAFF, MOCK_STAFF); },
  saveStaff(data: Staff[]) { this.saveData(DB_KEYS.STAFF, data); },

  getGroups(): ParticipantGroup[] { return this.getData(DB_KEYS.GROUPS, MOCK_PARTICIPANT_GROUPS); },
  saveGroups(data: ParticipantGroup[]) { this.saveData(DB_KEYS.GROUPS, data); },

  getUsers(): User[] { return this.getData(DB_KEYS.USERS, MOCK_USERS); },
  saveUsers(data: User[]) { this.saveData(DB_KEYS.USERS, data); },

  getEndpoints(): Endpoint[] { return this.getData(DB_KEYS.ENDPOINTS, MOCK_ENDPOINTS); },
  saveEndpoints(data: Endpoint[]) { this.saveData(DB_KEYS.ENDPOINTS, data); },

  getSavedReports(): SavedReportConfig[] { return this.getData(DB_KEYS.SAVED_REPORTS, []); },
  saveSavedReports(data: SavedReportConfig[]) { this.saveData(DB_KEYS.SAVED_REPORTS, data); }
};
