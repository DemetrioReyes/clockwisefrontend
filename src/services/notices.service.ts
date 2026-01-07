import api from './api';
import { API_ENDPOINTS } from '../config/api';

export interface PayNotice {
  id: string;
  tenant_id: string;
  employee_id: string;
  employee_code: string;
  notice_type: 'initial' | 'rate_change' | 'payday_change';
  document_filename: string;
  document_path: string;
  document_size_bytes: number;
  status: 'generated' | 'sent_to_employee' | 'signed' | 'archived';
  is_signed: boolean;
  signed_document_filename?: string;
  signed_document_path?: string;
  signature_id?: string;
  signed_at?: string;
  pay_rate_type: 'hourly' | 'salary' | 'day_rate' | 'piece_rate' | 'other';
  pay_rate_value?: number;
  pay_frequency: string;
  regular_payday?: string;
  overtime_rate: number;
  has_tip_credit: boolean;
  tip_credit_amount?: number;
  receives_meal_benefit: boolean;
  meal_benefit_amount?: number;
  other_allowances?: any;
  language: 'en' | 'es';
  employee_primary_language?: string;
  generated_by: string;
  generated_at: string;
  sent_to_employee_at?: string;
  employee_acknowledged_at?: string;
  previous_notice_id?: string;
  download_url?: string;
  signed_download_url?: string;
  first_name?: string;
  last_name?: string;
}

export interface PayNoticeCreate {
  employee_id: string;
  notice_type?: 'initial' | 'rate_change' | 'payday_change';
  language?: 'en' | 'es';
}

export interface PayNoticeSaveRequest {
  employee_id: string;
  // Sección 2: Notice given
  notice_given_at_hiring: boolean;
  notice_given_before_change: boolean;
  notice_type: 'initial' | 'rate_change' | 'payday_change';
  // Sección 3: Employee's pay rate(s)
  pay_rate_type: 'hourly' | 'salary' | 'day_rate' | 'piece_rate' | 'other';
  pay_rate_value?: number;
  // Sección 4: Allowances taken
  allowance_none: boolean;
  allowance_tips: boolean;
  tip_credit_amount?: number;
  allowance_meals: boolean;
  meal_benefit_amount?: number;
  allowance_lodging: boolean;
  allowance_other: boolean;
  other_allowances_description?: string;
  // Sección 5: Regular payday
  regular_payday?: string;
  // Sección 6: Pay is
  pay_frequency: 'weekly' | 'biweekly' | 'monthly' | 'other';
  pay_frequency_other?: string;
  // Sección 7: Overtime Pay Rate
  overtime_rate: number;
  overtime_exempt: boolean;
  overtime_exemption_description?: string;
  // Idioma
  language: 'en' | 'es';
  // Campos adicionales para compatibilidad (no se envían al backend)
  has_tip_credit?: boolean;
  receives_meal_benefit?: boolean;
}

export interface PayNoticeSignRequest {
  signature_data: string;
  employee_primary_language?: string;
  signature_metadata?: any;
}

export interface PayNoticeSendRequest {
  email?: string;
  send_email: boolean;
}

export interface PayNoticeListResponse {
  notices: PayNotice[];
  total_count: number;
}

class NoticesService {
  async saveNotice(data: PayNoticeSaveRequest): Promise<PayNotice> {
    const response = await api.post<PayNotice>(API_ENDPOINTS.NOTICES_SAVE, data);
    return response.data;
  }

  async generatePdfForNotice(noticeId: string): Promise<PayNotice> {
    const response = await api.post<PayNotice>(
      `${API_ENDPOINTS.NOTICES_GENERATE_PDF}/${noticeId}/generate-pdf`
    );
    return response.data;
  }

  async generateNotice(data: PayNoticeCreate): Promise<PayNotice> {
    const response = await api.post<PayNotice>(API_ENDPOINTS.NOTICES_GENERATE, data);
    return response.data;
  }

  async getNoticeById(noticeId: string): Promise<PayNotice> {
    const response = await api.get<PayNotice>(`${API_ENDPOINTS.NOTICES_BY_ID}/${noticeId}`);
    return response.data;
  }

  async getEmployeeNotices(
    employeeId: string,
    includeUnsigned: boolean = true,
    includeSigned: boolean = true,
    noticeType?: string
  ): Promise<PayNotice[]> {
    const params: any = {
      include_unsigned: includeUnsigned,
      include_signed: includeSigned,
    };
    if (noticeType) params.notice_type = noticeType;
    
    const response = await api.get<PayNotice[]>(
      `${API_ENDPOINTS.NOTICES_EMPLOYEE}/${employeeId}`,
      { params }
    );
    return response.data;
  }

  async listNotices(
    employeeId?: string,
    status?: string,
    isSigned?: boolean,
    startDate?: string,
    endDate?: string,
    limit: number = 50
  ): Promise<PayNoticeListResponse> {
    const params: any = { limit };
    if (employeeId) params.employee_id = employeeId;
    if (status) params.status = status;
    if (isSigned !== undefined) params.is_signed = isSigned;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await api.get<PayNoticeListResponse>(API_ENDPOINTS.NOTICES_LIST, { params });
    return response.data;
  }

  async downloadNotice(noticeId: string, signed: boolean = false): Promise<Blob> {
    const params = signed ? { signed: 'true' } : {};
    const response = await api.get(
      `${API_ENDPOINTS.NOTICES_DOWNLOAD}/${noticeId}/download`,
      {
        params,
        responseType: 'blob',
      }
    );
    return response.data;
  }

  async signNotice(noticeId: string, signData: PayNoticeSignRequest): Promise<any> {
    const response = await api.post(
      `${API_ENDPOINTS.NOTICES_SIGN}/${noticeId}/sign`,
      signData
    );
    return response.data;
  }

  async sendNotice(noticeId: string, sendData: PayNoticeSendRequest): Promise<any> {
    const response = await api.post(
      `${API_ENDPOINTS.NOTICES_SEND}/${noticeId}/send`,
      sendData
    );
    return response.data;
  }

  async deleteNotice(noticeId: string): Promise<void> {
    await api.delete(`${API_ENDPOINTS.NOTICES_DELETE}/${noticeId}`);
  }
}

const noticesServiceInstance = new NoticesService();

export default noticesServiceInstance;
