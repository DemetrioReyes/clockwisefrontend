import api from './api';
import { API_ENDPOINTS } from '../config/api';
import { Employee, EmployeeRegisterData, TimeEntry, TimeEntryCreate } from '../types';

class EmployeeService {
  async registerEmployee(data: EmployeeRegisterData): Promise<Employee> {
    const formData = new FormData();

    formData.append('first_name', data.first_name);
    formData.append('last_name', data.last_name);
    if (data.alias) formData.append('alias', data.alias);
    formData.append('ssn', data.ssn);
    formData.append('date_of_birth', data.date_of_birth);
    if (data.email) formData.append('email', data.email);
    formData.append('phone', data.phone);
    formData.append('hire_date', data.hire_date);
    formData.append('street_address', data.street_address);
    formData.append('city', data.city);
    formData.append('state', data.state);
    formData.append('zip_code', data.zip_code);
    formData.append('employee_type', data.employee_type);
    formData.append('position', data.position);
    formData.append('hourly_rate', data.hourly_rate.toString());
    formData.append('pay_frequency', data.pay_frequency);
    if (data.regular_shift) formData.append('regular_shift', data.regular_shift);
    if (data.department) formData.append('department', data.department);
    formData.append('payment_method', data.payment_method);
    if (data.bank_account_number) formData.append('bank_account_number', data.bank_account_number);
    if (data.bank_routing_number) formData.append('bank_routing_number', data.bank_routing_number);
    if (data.bank_account_type) formData.append('bank_account_type', data.bank_account_type);
    if (data.state_minimum_wage) formData.append('state_minimum_wage', data.state_minimum_wage.toString());
    if (data.receives_meal_benefit !== undefined) {
      formData.append('receives_meal_benefit', data.receives_meal_benefit ? 'true' : 'false');
    }

    if (data.face_image) {
      formData.append('face_image', data.face_image);
    }

    if (data.face_image_2) {
      formData.append('face_image_2', data.face_image_2);
    }

    const response = await api.post<Employee>(API_ENDPOINTS.EMPLOYEES, formData, {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return response.data;
  }

  // NUEVA: Con paginación (opcional)
  async listEmployeesPaginated(
    page: number = 1,
    limit: number = 50,
    activeOnly?: boolean
  ): Promise<{ results: Employee[]; total: number; page: number; pages: number }> {
    const params: any = { page, limit };
    if (activeOnly !== undefined) params.active_only = activeOnly;
    const response = await api.get(API_ENDPOINTS.EMPLOYEES, { params });
    return response.data;
  }

  // VIEJA: Sin paginación (mantenemos para compatibilidad)
  async listEmployees(activeOnly?: boolean): Promise<Employee[]> {
    const params: any = {};
    if (activeOnly !== undefined) params.active_only = activeOnly;
    const response = await api.get<Employee[]>(API_ENDPOINTS.EMPLOYEES, { params });
    return response.data;
  }

  async getEmployees(activeOnly: boolean = true): Promise<Employee[]> {
    return this.listEmployees(activeOnly);
  }

  async getEmployeeById(id: string): Promise<Employee> {
    const response = await api.get<Employee>(`${API_ENDPOINTS.EMPLOYEE_BY_ID}/${id}`);
    return response.data;
  }

  async updateEmployee(id: string, data: Partial<EmployeeRegisterData>): Promise<Employee> {
    const response = await api.put<Employee>(`${API_ENDPOINTS.UPDATE_EMPLOYEE}/${id}`, data);
    return response.data;
  }

  async deleteEmployee(id: string): Promise<void> {
    await api.delete(`${API_ENDPOINTS.EMPLOYEE_BY_ID}/${id}`);
  }

  async deleteEmployeeComplete(id: string): Promise<{
    success: boolean;
    message: string;
    employee_id: string;
    employee_code: string;
    employee_name: string;
    deleted_records: Record<string, number>;
    total_deleted: number;
  }> {
    const response = await api.delete<{
      success: boolean;
      message: string;
      employee_id: string;
      employee_code: string;
      employee_name: string;
      deleted_records: Record<string, number>;
      total_deleted: number;
    }>(`${API_ENDPOINTS.DELETE_EMPLOYEE_COMPLETE}/${id}/complete`);
    return response.data;
  }

  // Time Entry Methods (Facial Recognition)
  async createTimeEntry(data: TimeEntryCreate): Promise<TimeEntry> {
    const formData = new FormData();
    formData.append('face_image', data.face_image);
    formData.append('tenant_id', data.tenant_id);
    formData.append('record_type', data.record_type);
    if (data.device_info) formData.append('device_info', data.device_info);

    // Log para debug
    console.log('Enviando FormData:', JSON.stringify({
      record_type: data.record_type,
      tenant_id: data.tenant_id,
      device_info: data.device_info,
      has_image: !!data.face_image,
      image_name: data.face_image.name,
      image_size: data.face_image.size
    }, null, 2));

    const response = await api.post<TimeEntry>(API_ENDPOINTS.TIME_ENTRY, formData, {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    
    console.log('Respuesta del servidor:', JSON.stringify(response.data, null, 2));
    console.log('Status code:', response.status);
    return response.data;
  }

  async listTimeEntries(employeeId?: string, startDate?: string, endDate?: string): Promise<TimeEntry[]> {
    const params: any = {};
    if (employeeId) params.employee_id = employeeId;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await api.get<TimeEntry[]>(API_ENDPOINTS.TIME_ENTRY, { params });
    return response.data;
  }

  /**
   * Agrega un registro de tiempo manualmente (corrección)
   */
  async createManualTimeEntry(data: import('../types').TimeEntryManualCreate): Promise<any> {
    const response = await api.post(API_ENDPOINTS.TIME_ENTRY_MANUAL, data);
    return response.data;
  }

  /**
   * Corrige la hora de un registro de tiempo existente
   */
  async updateTimeEntry(recordId: string, data: import('../types').TimeEntryUpdate): Promise<any> {
    const response = await api.put(`${API_ENDPOINTS.TIME_ENTRY_UPDATE}/${recordId}`, data);
    return response.data;
  }
}

const employeeServiceInstance = new EmployeeService();

// Named exports for specific functions
export const getEmployees = (activeOnly: boolean = true) => employeeServiceInstance.getEmployees(activeOnly);
export const getEmployeesPaginated = (page?: number, limit?: number, activeOnly?: boolean) => employeeServiceInstance.listEmployeesPaginated(page, limit, activeOnly);
export const registerEmployee = (data: EmployeeRegisterData) => employeeServiceInstance.registerEmployee(data);
export const listEmployees = (activeOnly?: boolean) => employeeServiceInstance.listEmployees(activeOnly);
export const getEmployeeById = (id: string) => employeeServiceInstance.getEmployeeById(id);
export const updateEmployee = (id: string, data: Partial<EmployeeRegisterData>) => employeeServiceInstance.updateEmployee(id, data);
export const deleteEmployee = (id: string) => employeeServiceInstance.deleteEmployee(id);
export const deleteEmployeeComplete = (id: string) => employeeServiceInstance.deleteEmployeeComplete(id);
export const createTimeEntry = (data: TimeEntryCreate) => employeeServiceInstance.createTimeEntry(data);
export const listTimeEntries = (employeeId?: string, startDate?: string, endDate?: string) => employeeServiceInstance.listTimeEntries(employeeId, startDate, endDate);

export default employeeServiceInstance;
