import api from './api';
import { API_ENDPOINTS } from '../config/api';
import { PayrollResponse, PayrollRequest } from '../types';

class PayrollService {
  /**
   * Calcular nómina (PREVIEW) - NO guarda en BD
   * Usa esto para verificar antes de guardar
   */
  async calculatePayroll(data: PayrollRequest): Promise<PayrollResponse> {
    const response = await api.post<PayrollResponse>(API_ENDPOINTS.CALCULATE_PAYROLL, data);
    return response.data;
  }

  /**
   * Crear y guardar nómina en BD - Genera payroll_id real
   * Usa esto para crear la nómina definitiva
   */
  async createPayroll(data: PayrollRequest & { description?: string }): Promise<any> {
    const response = await api.post(API_ENDPOINTS.LIST_PAYROLLS, data);
    return response.data;
  }

  /**
   * Obtener nómina por ID con todos los detalles
   */
  async getPayrollById(payrollId: string): Promise<PayrollResponse> {
    const response = await api.get<PayrollResponse>(`${API_ENDPOINTS.PAYROLL_BY_ID}/${payrollId}`);
    return response.data;
  }

  /**
   * Listar todas las nóminas con filtros opcionales
   */
  async listPayrolls(status?: string, limit?: number, skip?: number): Promise<any> {
    const params: any = {};
    if (status) params.status = status;
    if (limit) params.limit = limit;
    if (skip) params.skip = skip;

    const response = await api.get(API_ENDPOINTS.LIST_PAYROLLS, { params });
    return response.data;
  }

  /**
   * Actualizar status de nómina
   * Status: draft, calculated, approved, paid
   */
  async updatePayrollStatus(payrollId: string, status: 'draft' | 'calculated' | 'approved' | 'paid'): Promise<any> {
    const response = await api.put(`${API_ENDPOINTS.PAYROLL_BY_ID}/${payrollId}/status`, null, {
      params: { new_status: status }
    });
    return response.data;
  }

  /**
   * Obtener resumen de nóminas de un empleado
   */
  async getEmployeePayrollSummary(employeeCode: string): Promise<any> {
    const response = await api.get(`${API_ENDPOINTS.EMPLOYEE_PAYROLL_SUMMARY}/${employeeCode}/summary`);
    return response.data;
  }

  /**
   * Eliminar/cancelar nómina
   */
  async deletePayroll(payrollId: string): Promise<void> {
    const response = await api.delete(`${API_ENDPOINTS.PAYROLL_BY_ID}/${payrollId}`);
    return response.data;
  }

  /**
   * Actualizar nómina completa
   */
  async updatePayroll(payrollId: string, data: Partial<PayrollRequest>): Promise<any> {
    const response = await api.put(`${API_ENDPOINTS.PAYROLL_BY_ID}/${payrollId}`, data);
    return response.data;
  }

  /**
   * Obtener desglose diario correcto de registros de tiempo para un empleado
   */
  async getEmployeeDailyBreakdown(
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<any> {
    const response = await api.get(`/api/payroll/employee/${employeeId}/daily-breakdown`, {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  }
}

const payrollServiceInstance = new PayrollService();
export default payrollServiceInstance;
