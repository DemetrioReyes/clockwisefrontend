import api from './api';
import { API_ENDPOINTS } from '../config/api';
import {
  MealBenefitConfig,
  MealBenefitConfigCreate,
  MealBenefitConfigUpdate,
  MealBenefitConfigResponse,
  EmployeeType,
} from '../types';

class MealBenefitService {
  /**
   * Obtiene la configuración vigente para un tipo de empleado
   */
  async getCurrentConfig(
    employeeType: EmployeeType,
    effectiveDate?: string
  ): Promise<MealBenefitConfigResponse> {
    const params: any = { employee_type: employeeType };
    if (effectiveDate) params.effective_date = effectiveDate;

    const response = await api.get<MealBenefitConfigResponse>(
      API_ENDPOINTS.MEAL_BENEFIT_CURRENT,
      { params }
    );
    return response.data;
  }

  /**
   * Lista todas las configuraciones
   */
  async listConfigs(
    employeeType?: EmployeeType,
    includeGlobal: boolean = true,
    activeOnly: boolean = false
  ): Promise<MealBenefitConfig[]> {
    const params: any = {};
    if (employeeType) params.employee_type = employeeType;
    if (includeGlobal !== undefined) params.include_global = includeGlobal;
    if (activeOnly !== undefined) params.active_only = activeOnly;

    const response = await api.get<MealBenefitConfig[]>(
      API_ENDPOINTS.MEAL_BENEFIT_LIST,
      { params }
    );
    return response.data;
  }

  /**
   * Obtiene una configuración por ID
   */
  async getConfigById(configId: string): Promise<MealBenefitConfig> {
    const response = await api.get<MealBenefitConfig>(
      `${API_ENDPOINTS.MEAL_BENEFIT_BY_ID}/${configId}`
    );
    return response.data;
  }

  /**
   * Crea una nueva configuración
   */
  async createConfig(
    data: MealBenefitConfigCreate
  ): Promise<MealBenefitConfig> {
    const response = await api.post<MealBenefitConfig>(
      API_ENDPOINTS.MEAL_BENEFIT_CREATE,
      data
    );
    return response.data;
  }

  /**
   * Actualiza una configuración existente
   */
  async updateConfig(
    configId: string,
    data: MealBenefitConfigUpdate
  ): Promise<MealBenefitConfig> {
    const response = await api.put<MealBenefitConfig>(
      `${API_ENDPOINTS.MEAL_BENEFIT_UPDATE}/${configId}`,
      data
    );
    return response.data;
  }

  /**
   * Desactiva una configuración (soft delete)
   */
  async deleteConfig(configId: string): Promise<void> {
    await api.delete(`${API_ENDPOINTS.MEAL_BENEFIT_DELETE}/${configId}`);
  }
}

const mealBenefitServiceInstance = new MealBenefitService();

export default mealBenefitServiceInstance;

