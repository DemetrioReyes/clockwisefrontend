import api from './api';
import { API_ENDPOINTS } from '../config/api';
import { PayRate, PayRateCreate } from '../types';

export const payratesService = {
  createPayRate: async (data: PayRateCreate): Promise<PayRate> => {
  const response = await api.post(API_ENDPOINTS.PAY_RATES, data);
  return response.data;
  },

  getEmployeeCurrentPayRate: async (employeeId: string): Promise<PayRate> => {
  const response = await api.get(`${API_ENDPOINTS.EMPLOYEE_CURRENT_PAY_RATE}/${employeeId}/current`);
  return response.data;
  },

  getEmployeePayRateHistory: async (employeeId: string): Promise<PayRate[]> => {
  const response = await api.get(`${API_ENDPOINTS.EMPLOYEE_PAY_RATE_HISTORY}/${employeeId}/all`);
  return response.data;
  },

  getPayRateSummary: async (employeeId: string): Promise<any> => {
  const response = await api.get(`${API_ENDPOINTS.PAY_RATE_SUMMARY}/${employeeId}/summary`);
  return response.data;
  },

  listAllPayRates: async (activeOnly?: boolean): Promise<any> => {
    const params: any = {};
    if (activeOnly !== undefined) params.active_only = activeOnly;

    const response = await api.get(API_ENDPOINTS.PAY_RATES, { params });
    return response.data;
  },

  updatePayRate: async (payRateId: string, data: Partial<PayRateCreate>): Promise<PayRate> => {
  const response = await api.put(`${API_ENDPOINTS.UPDATE_PAY_RATE}/${payRateId}`, data);
  return response.data;
  },

  deletePayRate: async (payRateId: string): Promise<void> => {
    await api.delete(`${API_ENDPOINTS.PAY_RATES}${payRateId}`);
  },
};
