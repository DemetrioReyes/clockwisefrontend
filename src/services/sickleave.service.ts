import api from './api';
import { API_ENDPOINTS } from '../config/api';
import {
  SickLeave,
  SickLeaveUsage,
  SickLeaveUsageCreate,
  UploadSickLeaveDocumentPayload,
  UploadSickLeaveDocumentResponse,
  SickLeaveDocument,
  SickLeaveDocumentFilters,
} from '../types';

export const sickleaveService = {
  getSickLeaveSummary: async (employeeCode: string, year?: number): Promise<SickLeave> => {
    const params: any = {};
    if (year) params.year = year;

    const response = await api.get(`${API_ENDPOINTS.SICK_LEAVE_SUMMARY}/${employeeCode}`, { params });
    return response.data;
  },

  getAllSickLeaves: async (year?: number): Promise<any> => {
    const params: any = {};
    if (year) params.year = year;

    const response = await api.get(API_ENDPOINTS.SICK_LEAVE_LIST, { params });
    return response.data;
  },

  getEmployeeUsageHistory: async (employeeId: string, year?: number): Promise<any> => {
    const params: any = {};
    if (year) params.year = year;

    const response = await api.get(`${API_ENDPOINTS.SICK_LEAVE_USAGE_HISTORY}/${employeeId}`, { params });
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

  uploadSickLeaveDocument: async (
    payload: UploadSickLeaveDocumentPayload
  ): Promise<UploadSickLeaveDocumentResponse> => {
    const formData = new FormData();
    formData.append('sick_leave_usage_id', payload.sick_leave_usage_id);
    formData.append('employee_id', payload.employee_id);
    formData.append('document_name', payload.document_name);
    formData.append('file', payload.file, payload.file.name);

    if (process.env.NODE_ENV === 'development') {
      const debugEntries: string[] = [];
      formData.forEach((value, key) => {
        if (value instanceof File) {
          debugEntries.push(`${key}: File{name=${value.name}, size=${value.size} bytes, type=${value.type}}`);
        } else {
          debugEntries.push(`${key}: ${value}`);
        }
      });
      // eslint-disable-next-line no-console
      console.debug('[sickleaveService.uploadSickLeaveDocument] FormData →', debugEntries.join(' | '));
    }

    const response = await api.post<UploadSickLeaveDocumentResponse>(
      API_ENDPOINTS.SICK_LEAVE_UPLOAD_DOCUMENT,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },

  listSickLeaveDocuments: async (
    filters?: SickLeaveDocumentFilters
  ): Promise<SickLeaveDocument[]> => {
    const params: SickLeaveDocumentFilters = {
      ...filters,
    };

    try {
      const response = await api.get(API_ENDPOINTS.SICK_LEAVE_DOCUMENTS, { params });
      const data = response.data;

      if (Array.isArray(data)) {
        return data;
      }

      return (
        data?.items ||
        data?.documents ||
        data?.results ||
        data?.data ||
        []
      );
    } catch (error: any) {
      if (error?.response?.status === 404) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.debug('[sickleaveService.listSickLeaveDocuments] 404 recibido, devolviendo lista vacía');
        }
        return [];
      }
      throw error;
    }
  },

  downloadSickLeaveDocument: async (
    documentId: string
  ): Promise<{ blob: Blob; filename?: string; contentType?: string }> => {
    const response = await api.get(
      `${API_ENDPOINTS.SICK_LEAVE_DOCUMENTS}/${documentId}/download`,
      {
        responseType: 'blob',
      }
    );

    const disposition = response.headers['content-disposition'];
    let filename: string | undefined;
    if (disposition) {
      const match = disposition.match(/filename="?([^";]+)/);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }
    }

    return {
      blob: response.data,
      filename,
      contentType: response.headers['content-type'],
    };
  },
};
