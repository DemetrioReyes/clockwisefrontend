import api from './api';
import { TipCreditConfig, TipCreditConfigCreate, TipCreditConfigResponse, TipCreditShortfall } from '../types';

export interface CurrentTipCreditResponse {
  config: TipCreditConfig;
  is_global: boolean;
  source: string;
}

export const tipcreditService = {
  getCurrentConfig: async (effectiveDate?: string): Promise<CurrentTipCreditResponse> => {
    const params: any = {};
    if (effectiveDate) {
      params.effective_date = effectiveDate;
    }
    const response = await api.get('/api/tip-credit/current', { params });
    return response.data;
  },

  listConfigs: async (includeGlobal: boolean = true, activeOnly: boolean = true): Promise<TipCreditConfig[]> => {
    const params: any = {};
    if (includeGlobal !== undefined) params.include_global = includeGlobal;
    if (activeOnly !== undefined) params.active_only = activeOnly;

    const response = await api.get('/api/tip-credit/', { params });
    // El backend retorna TipCreditConfigListResponse con { configs: [...], total_count: ... }
    const data = response.data;
    if (data && Array.isArray(data.configs)) {
      return data.configs;
    }
    return Array.isArray(data) ? data : [];
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

  deleteConfig: async (configId: string): Promise<void> => {
    await api.delete(`/api/tip-credit/${configId}`);
  },
  
  deactivateConfig: async (configId: string): Promise<void> => {
    await api.delete(`/api/tip-credit/${configId}`);
  },
};

