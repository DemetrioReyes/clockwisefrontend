import api from './api';
import { API_ENDPOINTS } from '../config/api';
import { TipCreditConfig, TipCreditConfigCreate } from '../types';

export const superAdminTipCreditService = {
  /**
   * Lista TODAS las configuraciones de tip credit de TODOS los tenants
   */
  listAllConfigs: async (activeOnly: boolean = false): Promise<{ configs: TipCreditConfig[]; total_count: number }> => {
    const response = await api.get(API_ENDPOINTS.SUPER_ADMIN_TIP_CREDIT_LIST_ALL, {
      params: { active_only: activeOnly }
    });
    return response.data;
  },

  /**
   * Crea una configuración de tip credit para un tenant específico o global
   */
  createConfigForTenant: async (
    data: TipCreditConfigCreate,
    targetTenantId?: string
  ): Promise<TipCreditConfig> => {
    const params: any = {};
    if (targetTenantId) {
      params.target_tenant_id = targetTenantId;
    }
    const response = await api.post(API_ENDPOINTS.SUPER_ADMIN_TIP_CREDIT_CREATE, data, { params });
    return response.data;
  },

  /**
   * Actualiza cualquier configuración de tip credit
   */
  updateConfig: async (configId: string, data: Partial<TipCreditConfigCreate>): Promise<TipCreditConfig> => {
    const response = await api.put(`${API_ENDPOINTS.SUPER_ADMIN_TIP_CREDIT_UPDATE}/${configId}`, data);
    return response.data;
  },

  /**
   * Elimina cualquier configuración de tip credit
   */
  deleteConfig: async (configId: string): Promise<void> => {
    await api.delete(`${API_ENDPOINTS.SUPER_ADMIN_TIP_CREDIT_DELETE}/${configId}`);
  },
};
