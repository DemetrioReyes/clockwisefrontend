import api from './api';
import { API_ENDPOINTS } from '../config/api';
import { PayrollResponse, PayrollRequest } from '../types';

class PayrollService {
  // Preview payroll (no guarda en BD)
  async calculatePayroll(data: PayrollRequest): Promise<PayrollResponse> {
    const response = await api.post<PayrollResponse>(API_ENDPOINTS.CALCULATE_PAYROLL, data);
    return response.data;
  }

  // Crear y guardar payroll (genera payroll_id)
  async createPayroll(data: PayrollRequest & { description?: string }): Promise<any> {
    const response = await api.post(API_ENDPOINTS.LIST_PAYROLLS, data);
    return response.data;
  }

  async getPayrollById(payrollId: string): Promise<PayrollResponse> {
    const response = await api.get<PayrollResponse>(`${API_ENDPOINTS.PAYROLL_BY_ID}/${payrollId}`);
    return response.data;
  }

  async listPayrolls(status?: string, limit?: number, skip?: number): Promise<any> {
    const params: any = {};
    if (status) params.status = status;
    if (limit) params.limit = limit;
    if (skip) params.skip = skip;

    const response = await api.get(API_ENDPOINTS.LIST_PAYROLLS, { params });
    return response.data;
  }

  async updatePayrollStatus(payrollId: string, status: string): Promise<PayrollResponse> {
    const response = await api.put<PayrollResponse>(`${API_ENDPOINTS.UPDATE_PAYROLL_STATUS}/${payrollId}/status`, {
      status,
    });
    return response.data;
  }

  async getEmployeePayrollSummary(employeeCode: string): Promise<any> {
    const response = await api.get(`${API_ENDPOINTS.EMPLOYEE_PAYROLL_SUMMARY}/${employeeCode}/summary`);
    return response.data;
  }
}

const payrollServiceInstance = new PayrollService();
export default payrollServiceInstance;
