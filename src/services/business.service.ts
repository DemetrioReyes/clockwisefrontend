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

  async updateBusiness(id: string, data: Partial<BusinessRegisterData>): Promise<Business> {
    const response = await api.put<Business>(`${API_ENDPOINTS.UPDATE_BUSINESS}/${id}`, data);
    return response.data;
  }

  async deleteBusiness(id: string): Promise<void> {
    await api.delete(`${API_ENDPOINTS.BUSINESS_BY_ID}/${id}`);
  }
}

const businessServiceInstance = new BusinessService();
export default businessServiceInstance;
