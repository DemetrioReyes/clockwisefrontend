import api from './api';
import { API_ENDPOINTS } from '../config/api';
import { PDFGenerate, PDFGenerateDetailed, PDFResponse } from '../types';

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
  return response.data;
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
};
