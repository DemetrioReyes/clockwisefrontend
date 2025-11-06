import api from './api';
import { API_ENDPOINTS } from '../config/api';
import { Business, BusinessRegisterData } from '../types';

class BusinessService {
  async registerBusiness(data: BusinessRegisterData): Promise<Business> {
    const response = await api.post<Business>(API_ENDPOINTS.BUSINESS_REGISTER, data);
    return response.data;
  }

  async listBusinesses(): Promise<Business[]> {
    const response = await api.get<Business[]>(API_ENDPOINTS.LIST_BUSINESSES);
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
}

const businessServiceInstance = new BusinessService();
export default businessServiceInstance;
