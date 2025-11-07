import api from './api';
import { API_ENDPOINTS } from '../config/api';
import { PDFGenerate, PDFGenerateDetailed, PDFResponse, UploadSignedPayrollPayload, UploadSignedPayrollResponse } from '../types';

export const pdfService = {
  generateSummaryPDF: async (data: PDFGenerate): Promise<PDFResponse> => {
    const response = await api.post(API_ENDPOINTS.GENERATE_PDF_SUMMARY, data);
  return response.data;
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
