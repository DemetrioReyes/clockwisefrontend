import api from './api';
import { API_ENDPOINTS } from '../config/api';
import { SickLeave, SickLeaveUsage, SickLeaveUsageCreate } from '../types';

export const sickleaveService = {
  getSickLeaveSummary: async (employeeCode: string, year?: number): Promise<SickLeave> => {
    const params: any = {};
    if (year) params.year = year;

    const response = await api.get(`${API_ENDPOINTS.SICK_LEAVE_SUMMARY}/${employeeCode}`, { params });
    return response.data;
  },

  requestSickLeaveUsage: async (data: SickLeaveUsageCreate): Promise<SickLeaveUsage> => {
    const response = await api.post(API_ENDPOINTS.SICK_LEAVE_USAGE, data);
    return response.data;
  },

  getPendingSickLeaveRequests: async (): Promise<any> => {
    const response = await api.get(API_ENDPOINTS.PENDING_SICK_LEAVE);
    return response.data;
  },

  approveSickLeaveRequest: async (
    usageId: string,
    approvedBy: string,
    approvalNotes?: string
  ): Promise<SickLeaveUsage> => {
    const response = await api.put(`${API_ENDPOINTS.APPROVE_SICK_LEAVE}/${usageId}/approve`, {
      approved_by: approvedBy,
      approval_notes: approvalNotes,
    });
    return response.data;
  },

  accumulateSickLeaveAll: async (payrollId: string): Promise<any> => {
    const response = await api.post(API_ENDPOINTS.ACCUMULATE_SICK_LEAVE, {
      payroll_id: payrollId,
    });
    return response.data;
  },
};
