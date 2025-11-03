import api from './api';
import { API_ENDPOINTS } from '../config/api';
import { DigitalSignature, SignatureCreate } from '../types';

export const signaturesService = {
  signDocument: async (data: SignatureCreate): Promise<DigitalSignature> => {
  const response = await api.post(API_ENDPOINTS.SIGN_DOCUMENT, data);
  return response.data;
  },

  getEmployeeSignatures: async (employeeId: string, validOnly?: boolean): Promise<DigitalSignature[]> => {
    const params: any = {};
    if (validOnly !== undefined) params.valid_only = validOnly;

    const response = await api.get(`${API_ENDPOINTS.EMPLOYEE_SIGNATURES}/${employeeId}`, { params });
  return response.data;
  },

  getSignatureById: async (signatureId: string): Promise<DigitalSignature> => {
  const response = await api.get(`${API_ENDPOINTS.SIGNATURE_BY_ID}/${signatureId}`);
  return response.data;
  },

  getPDFSignature: async (pdfFilename: string): Promise<DigitalSignature> => {
  const response = await api.get(`${API_ENDPOINTS.PDF_SIGNATURE}/${pdfFilename}`);
  return response.data;
  },

  invalidateSignature: async (signatureId: string, invalidationReason: string): Promise<DigitalSignature> => {
  const response = await api.post(`${API_ENDPOINTS.INVALIDATE_SIGNATURE}/${signatureId}/invalidate`, {
      invalidation_reason: invalidationReason,
  });
  return response.data;
  },

  getSignatureMetadata: (): any => {
    return {
      device: navigator.userAgent,
      ip_address: 'Unknown',
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };
  },
};
