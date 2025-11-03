import api from './api';
import { TipCreditConfig, TipCreditConfigCreate, TipCreditConfigResponse, TipCreditShortfall } from '../types';

export const tipcreditService = {
  getCurrentConfig: async (): Promise<TipCreditConfigResponse> => {
    const response = await api.get('/api/tip-credit/current');
    return response.data;
  },

  listConfigs: async (includeGlobal: boolean = true, activeOnly: boolean = true): Promise<TipCreditConfig[]> => {
    const params: any = {};
    if (includeGlobal !== undefined) params.include_global = includeGlobal;
    if (activeOnly !== undefined) params.active_only = activeOnly;

    const response = await api.get('/api/tip-credit/', { params });
    return response.data;
  },

  createTenantConfig: async (data: TipCreditConfigCreate): Promise<TipCreditConfig> => {
    const response = await api.post('/api/tip-credit/', data);
    return response.data;
  },

  createSystemConfig: async (data: TipCreditConfigCreate): Promise<TipCreditConfig> => {
    const response = await api.post('/api/tip-credit/system', data);
    return response.data;
  },

  calculateShortfall: async (
    hoursWorked: number,
    tipsReported: number,
    workDate?: string
  ): Promise<TipCreditShortfall> => {
    const params: any = {
      hours_worked: hoursWorked,
      tips_reported: tipsReported,
    };
    if (workDate) params.work_date = workDate;

    const response = await api.post('/api/tip-credit/calculate-shortfall', null, { params });
    return response.data;
  },

  updateConfig: async (configId: string, data: Partial<TipCreditConfigCreate>): Promise<TipCreditConfig> => {
    const response = await api.put(`/api/tip-credit/${configId}`, data);
    return response.data;
  },

  deactivateConfig: async (configId: string): Promise<void> => {
    await api.delete(`/api/tip-credit/${configId}`);
  },
};

