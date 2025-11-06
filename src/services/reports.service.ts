import api from './api';
import { API_ENDPOINTS } from '../config/api';
import { AttendanceReport, PayrollReport, SickLeaveReport, QuickStats } from '../types';

export const reportsService = {
  getAttendanceReport: async (
    startDate: string,
    endDate: string,
    employeeId?: string
  ): Promise<AttendanceReport[]> => {
    const response = await api.post(API_ENDPOINTS.ATTENDANCE_REPORT, {
      start_date: startDate,
      end_date: endDate,
      employee_id: employeeId,
    });
    return response.data;
  },

  getPayrollReport: async (
    startDate: string,
    endDate: string,
    includeTipCreditDetails?: boolean
  ): Promise<PayrollReport> => {
    const response = await api.post(API_ENDPOINTS.PAYROLL_REPORT, {
      start_date: startDate,
      end_date: endDate,
      include_tip_credit_details: includeTipCreditDetails,
    });
    return response.data;
  },

  getSickLeaveReport: async (year: number, employeeId?: string): Promise<SickLeaveReport[]> => {
    const response = await api.post(API_ENDPOINTS.SICK_LEAVE_REPORT, {
      year,
      employee_id: employeeId,
    });
    return response.data;
  },

  getTimeSummaryReport: async (
    startDate: string,
    endDate: string,
    groupBy: 'employee' | 'day' | 'week' | 'department'
  ): Promise<any> => {
    const response = await api.post(API_ENDPOINTS.TIME_SUMMARY_REPORT, {
      start_date: startDate,
      end_date: endDate,
      group_by: groupBy,
    });
    return response.data;
  },

  getQuickStats: async (): Promise<QuickStats> => {
    const response = await api.get(API_ENDPOINTS.QUICK_STATS);
    return response.data;
  },

  getBreakComplianceAlerts: async (status?: 'pending' | 'resolved' | 'all'): Promise<any> => {
    const params: any = {};
    if (status) params.status = status;

    const response = await api.get(API_ENDPOINTS.BREAK_COMPLIANCE_ALERTS, { params });
    return response.data;
  },

  resolveBreakComplianceAlert: async (alertId: string, resolutionNotes: string): Promise<any> => {
    const response = await api.post(`${API_ENDPOINTS.BREAK_COMPLIANCE_ALERT_RESOLVE}/${alertId}/resolve`, {
      resolution_notes: resolutionNotes,
    });
    return response.data;
  },

  getBreakComplianceDashboard: async (): Promise<any> => {
    const response = await api.get(API_ENDPOINTS.BREAK_COMPLIANCE_DASHBOARD);
    return response.data;
  },
};
