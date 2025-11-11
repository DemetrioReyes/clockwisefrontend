import api from './api';
import { API_ENDPOINTS } from '../config/api';
import {
  PDFGenerate,
  PDFGenerateDetailed,
  PDFResponse,
  UploadSignedPayrollPayload,
  UploadSignedPayrollResponse,
  PayrollDocument,
  PayrollDocumentFilters,
} from '../types';

const mapHistoryEntryToPayrollDocument = (entry: any): PayrollDocument => ({
  id: entry?.id,
  payroll_id: entry?.payroll_id || entry?.payrollId,
  employee_id: entry?.employee_id || entry?.employeeId,
  employee_code: entry?.employee_code || entry?.employeeCode,
  employee_name: entry?.employee_name || entry?.employeeName,
  invoice_id: entry?.invoice_id || entry?.invoiceId,
  document_name: entry?.document_name || entry?.documentName,
  pdf_filename: entry?.pdf_filename || entry?.filename,
  download_url: entry?.download_url || entry?.url || entry?.file_url,
  created_at: entry?.created_at || entry?.createdAt,
  uploaded_at: entry?.uploaded_at || entry?.uploadedAt,
  signed_at: entry?.signed_at || entry?.signedAt,
  uploaded_by: entry?.uploaded_by || entry?.uploadedBy,
  period_start: entry?.period_start || entry?.periodStart,
  period_end: entry?.period_end || entry?.periodEnd,
  metadata: entry?.metadata,
});

const filterPayrollDocuments = (docs: PayrollDocument[], filters: PayrollDocumentFilters): PayrollDocument[] => {
  let result = docs;

  if (filters.start_date) {
    const start = new Date(filters.start_date);
    result = result.filter((doc) => {
      const referenceDate = doc.uploaded_at || doc.created_at || doc.signed_at || doc.period_start;
      if (!referenceDate) return true;
      return new Date(referenceDate) >= start;
    });
  }

  if (filters.end_date) {
    const endBoundary = new Date(filters.end_date);
    if (!Number.isNaN(endBoundary.getTime())) {
      endBoundary.setHours(23, 59, 59, 999);
    }
    result = result.filter((doc) => {
      const referenceDate = doc.uploaded_at || doc.created_at || doc.signed_at || doc.period_end;
      if (!referenceDate) return true;
      const dateValue = new Date(referenceDate);
      if (Number.isNaN(dateValue.getTime())) return true;
      if (Number.isNaN(endBoundary.getTime())) return true;
      return dateValue <= endBoundary;
    });
  }

  if (filters.employee_id) {
    result = result.filter((doc) => doc.employee_id === filters.employee_id);
  }

  if (filters.payroll_id) {
    result = result.filter((doc) => doc.payroll_id === filters.payroll_id);
  }

  if (filters.limit && filters.limit > 0) {
    result = result.slice(0, filters.limit);
  }

  return result;
};

let payrollDocumentsEndpointHealthy = true;

export const pdfService = {
  generateSummaryPDF: async (data: PDFGenerate): Promise<PDFResponse> => {
    const response = await api.post(API_ENDPOINTS.GENERATE_PDF_SUMMARY, data);
  return response.data;
  },

  listPayrollDocuments: async (filters: PayrollDocumentFilters = {}): Promise<PayrollDocument[]> => {
    const params: Record<string, string | number> = {};
    if (filters.employee_id) params.employee_id = filters.employee_id;
    if (filters.payroll_id) params.payroll_id = filters.payroll_id;
    if (filters.start_date) params.start_date = filters.start_date;
    if (filters.end_date) params.end_date = filters.end_date;
    if (filters.limit) params.limit = filters.limit;

    if (payrollDocumentsEndpointHealthy) {
      try {
        const response = await api.get<PayrollDocument[]>(API_ENDPOINTS.PAYROLL_SIGNED_DOCUMENTS, { params });
        const data = response.data;

        if (Array.isArray(data)) {
          return filterPayrollDocuments(data, filters);
        }

        if (data && typeof data === 'object') {
          const extracted = (data as any)?.items || (data as any)?.results || (data as any)?.data || [];
          if (Array.isArray(extracted)) {
            return filterPayrollDocuments(extracted, filters);
          }
        }
      } catch (error: any) {
        if (error?.response?.status !== 422) {
          throw error;
        }
        payrollDocumentsEndpointHealthy = false;
      }
    }

    const fallbackParams: any = {};
    if (filters.employee_id) fallbackParams.employee_id = filters.employee_id;
    if (filters.payroll_id) fallbackParams.payroll_id = filters.payroll_id;
    if (filters.limit) fallbackParams.limit = filters.limit;

    const historyResponse = await api.get(API_ENDPOINTS.PDF_HISTORY, { params: fallbackParams });
    const historyData = historyResponse.data;

    const normalizedList = (() => {
      if (Array.isArray(historyData)) {
        return historyData.map(mapHistoryEntryToPayrollDocument);
      }
      const candidate =
        historyData?.items ||
        historyData?.results ||
        historyData?.data ||
        historyData?.documents ||
        [];
      return Array.isArray(candidate) ? candidate.map(mapHistoryEntryToPayrollDocument) : [];
    })();

    return filterPayrollDocuments(normalizedList, filters);
  },

  generateDetailedPDF: async (data: PDFGenerateDetailed): Promise<PDFResponse> => {
    const response = await api.post(API_ENDPOINTS.GENERATE_PDF_DETAILED, data);
  return response.data;
  },

  downloadPDF: async (filename: string): Promise<Blob> => {
  const response = await api.get(`${API_ENDPOINTS.DOWNLOAD_PDF}/${filename}`, {
      responseType: 'blob',
  });
  return response.data;
  },

  getPDFHistory: async (employeeId?: string, payrollId?: string, limit?: number): Promise<any[]> => {
    const params: any = {};
    if (employeeId) params.employee_id = employeeId;
    if (payrollId) params.payroll_id = payrollId;
    if (limit) params.limit = limit;

    const response = await api.get(API_ENDPOINTS.PDF_HISTORY, { params });
    const data = response.data;
    
    // Asegurar que siempre devolvamos un array
    if (Array.isArray(data)) {
      return data;
    }
    // Si es un objeto, intentar extraer el array
    if (data && typeof data === 'object') {
      return data.items || data.data || data.results || [];
    }
    // Si no es array ni objeto, devolver array vacío
    return [];
  },

  downloadPDFBlob: (blob: Blob, filename: string): void => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  uploadSignedPayrollPDF: async (payload: UploadSignedPayrollPayload): Promise<UploadSignedPayrollResponse> => {
    const formData = new FormData();
    formData.append('payroll_id', payload.payroll_id);
    formData.append('employee_id', payload.employee_id);
    formData.append('invoice_id', payload.invoice_id);
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
      console.debug('[pdfService.uploadSignedPayrollPDF] Enviando FormData →', debugEntries.join(' | '));
    }

    const response = await api.post<UploadSignedPayrollResponse>(API_ENDPOINTS.UPLOAD_SIGNED_PDF, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};
