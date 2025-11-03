import api from './api';
import { API_ENDPOINTS } from '../config/api';
import { Deduction, DeductionCreate, Incident, IncidentCreate } from '../types';

export const deductionsService = {
  // Deductions
  createDeduction: async (data: DeductionCreate): Promise<Deduction> => {
  const response = await api.post(API_ENDPOINTS.EMPLOYEE_DEDUCTIONS, data);
  return response.data;
  },

  getEmployeeDeductions: async (employeeId: string): Promise<Deduction[]> => {
    const response = await api.get(`${API_ENDPOINTS.EMPLOYEE_DEDUCTIONS}/${employeeId}`);
    return response.data;
  },

  setupStandardDeductions: async (employeeId: string, effectiveDate: string): Promise<Deduction[]> => {
    const response = await api.post(API_ENDPOINTS.SETUP_STANDARD_DEDUCTIONS, {
      employee_id: employeeId,
      effective_date: effectiveDate,
  });
  return response.data;
  },

  // Incidents (Tips, Bonuses, Penalties)
  createIncident: async (data: IncidentCreate): Promise<Incident> => {
  const response = await api.post(API_ENDPOINTS.EMPLOYEE_INCIDENTS, data);
  return response.data;
  },

  reportTips: async (
    employeeId: string,
    amount: number,
    periodStart: string,
    periodEnd: string,
    description?: string
  ): Promise<Incident> => {
    const response = await api.post(API_ENDPOINTS.EMPLOYEE_INCIDENTS, {
    employee_id: employeeId,
      incident_type: 'tips_reported',
      incident_name: `Tips - ${periodStart} to ${periodEnd}`,
    amount,
      description: description || `Tips collected from ${periodStart} to ${periodEnd}`,
      incident_date: periodEnd,
      payroll_period_start: periodStart,
      payroll_period_end: periodEnd,
    });
  return response.data;
  },

  getEmployeeIncidents: async (employeeId: string): Promise<Incident[]> => {
    const response = await api.get(`${API_ENDPOINTS.EMPLOYEE_INCIDENTS}/${employeeId}`);
  return response.data;
  },

  getEmployeePayrollSummary: async (employeeId: string): Promise<any> => {
    const response = await api.get(`${API_ENDPOINTS.PAYROLL_SUMMARY}/${employeeId}`);
  return response.data;
  },
};
