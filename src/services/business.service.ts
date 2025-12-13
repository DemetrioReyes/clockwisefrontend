import api from './api';
import { API_ENDPOINTS } from '../config/api';
import { Business, BusinessRegisterData } from '../types';

class BusinessService {
  async registerBusiness(data: BusinessRegisterData): Promise<Business> {
    const response = await api.post<Business>(API_ENDPOINTS.BUSINESS_REGISTER, data);
    return response.data;
  }

  async listBusinesses(active_only?: boolean): Promise<Business[]> {
    const params = active_only !== undefined ? { active_only } : {};
    const response = await api.get<Business[]>(API_ENDPOINTS.LIST_BUSINESSES, {
      params
    });
    return response.data;
  }

  async getBusinessById(id: string): Promise<Business> {
    const response = await api.get<Business>(`${API_ENDPOINTS.BUSINESS_BY_ID}/${id}`);
    return response.data;
  }

  async updateBusiness(id: string, data: Partial<BusinessRegisterData & { is_active?: boolean }>): Promise<Business> {
    const response = await api.put<Business>(`${API_ENDPOINTS.UPDATE_BUSINESS}/${id}`, data);
    return response.data;
  }

  async deleteBusiness(id: string): Promise<void> {
    await api.delete(`${API_ENDPOINTS.BUSINESS_BY_ID}/${id}`);
  }

  async disableBusiness(id: string): Promise<{ success: boolean; message: string; business_id: string }> {
    const response = await api.put<{ success: boolean; message: string; business_id: string }>(
      `${API_ENDPOINTS.DISABLE_BUSINESS}/${id}/disable`
    );
    return response.data;
  }

  async resetBusinessPassword(id: string, newPassword: string): Promise<{ success: boolean; message: string; business_id: string }> {
    const response = await api.post<{ success: boolean; message: string; business_id: string }>(
      `${API_ENDPOINTS.RESET_BUSINESS_PASSWORD}/${id}/reset-password`,
      { new_password: newPassword }
    );
    return response.data;
  }

  async deleteBusinessComplete(id: string): Promise<{
    success: boolean;
    message: string;
    business_id: string;
    tenant_id: string;
    deleted_records: any;
    total_deleted: number;
  }> {
    const response = await api.delete<{
      success: boolean;
      message: string;
      business_id: string;
      tenant_id: string;
      deleted_records: any;
      total_deleted: number;
    }>(`${API_ENDPOINTS.DELETE_BUSINESS_COMPLETE}/${id}/complete`);
    return response.data;
  }

  async searchBusinesses(params: {
    search_term?: string;
    is_active?: boolean;
    billing_cycle?: string;
    created_after?: string;
    created_before?: string;
    limit?: number;
  }): Promise<Business[]> {
    const response = await api.get<Business[]>(API_ENDPOINTS.BUSINESS_SEARCH, { params });
    return response.data;
  }

  async getRecentActivity(limit: number = 10): Promise<{ activities: any[]; total: number }> {
    const response = await api.get<{ activities: any[]; total: number }>(
      API_ENDPOINTS.BUSINESS_RECENT_ACTIVITY,
      { params: { limit } }
    );
    return response.data;
  }

  async exportBusinesses(): Promise<Blob> {
    const response = await api.get(API_ENDPOINTS.BUSINESS_EXPORT, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getNotifications(): Promise<{ notifications: any[]; total: number; unread_count: number }> {
    const response = await api.get<{ notifications: any[]; total: number; unread_count: number }>(
      API_ENDPOINTS.BUSINESS_NOTIFICATIONS
    );
    return response.data;
  }

  async getActivityDetails(activityId: string): Promise<any> {
    const response = await api.get<any>(`${API_ENDPOINTS.BUSINESS_BY_ID}/activity/${activityId}`);
    return response.data;
  }
}

const businessServiceInstance = new BusinessService();
export default businessServiceInstance;
