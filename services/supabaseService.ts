
/**
 * Supabase Service (Disabled)
 * Hệ thống hiện tại ưu tiên sử dụng LocalStorage và Cloud Export để đảm bảo tính sẵn sàng.
 */
export const supabaseService = {
  isConfigured(): boolean {
    return false;
  },
  async getMeetings(): Promise<any[]> { return []; },
  async upsertMeeting(m: any) { return m; },
  async deleteMeeting(id: string) { },
  async getUnits(): Promise<any[]> { return []; },
  async upsertUnit(u: any) { },
  async deleteUnit(id: string) { },
  async getStaff(): Promise<any[]> { return []; },
  async upsertStaff(s: any) { },
  async deleteStaff(id: string) { },
  async getEndpoints(): Promise<any[]> { return []; },
  async upsertEndpoint(e: any) { },
  async deleteEndpoint(id: string) { },
  async getSettings(): Promise<any | null> { return null; },
  async updateSettings(s: any) { }
};
