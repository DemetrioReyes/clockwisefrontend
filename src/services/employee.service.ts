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

    if (data.face_image) {
      formData.append('face_image', data.face_image);
    }

    const response = await api.post<Employee>(API_ENDPOINTS.EMPLOYEES, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

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

  // Time Entry Methods (Facial Recognition)
  async createTimeEntry(data: TimeEntryCreate): Promise<TimeEntry> {
    const formData = new FormData();
    formData.append('face_image', data.face_image);
    formData.append('tenant_id', data.tenant_id);
    formData.append('record_type', data.record_type);
    if (data.device_info) formData.append('device_info', data.device_info);

    const response = await api.post<TimeEntry>(API_ENDPOINTS.TIME_ENTRY, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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
}

const employeeServiceInstance = new EmployeeService();

// Named exports for specific functions
export const getEmployees = (activeOnly: boolean = true) => employeeServiceInstance.getEmployees(activeOnly);
export const registerEmployee = (data: EmployeeRegisterData) => employeeServiceInstance.registerEmployee(data);
export const listEmployees = (activeOnly?: boolean) => employeeServiceInstance.listEmployees(activeOnly);
export const getEmployeeById = (id: string) => employeeServiceInstance.getEmployeeById(id);
export const updateEmployee = (id: string, data: Partial<EmployeeRegisterData>) => employeeServiceInstance.updateEmployee(id, data);
export const deleteEmployee = (id: string) => employeeServiceInstance.deleteEmployee(id);
export const createTimeEntry = (data: TimeEntryCreate) => employeeServiceInstance.createTimeEntry(data);
export const listTimeEntries = (employeeId?: string, startDate?: string, endDate?: string) => employeeServiceInstance.listTimeEntries(employeeId, startDate, endDate);

export default employeeServiceInstance;
