// Authentication Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user?: {
    email: string;
    first_name?: string;
    last_name?: string;
    is_super_admin?: boolean;
    tenant_id?: string;
    company_name?: string;
  };
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_super_admin?: boolean;
  tenant_id?: string;
  company_name?: string;
}

// Business Types
export interface Business {
  id: string;
  tenant_id: string;
  company_name: string;
  business_name: string;
  rfc: string;
  address: string;
  phone: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_phone: string;
  billing_cycle: 'weekly' | 'monthly' | 'yearly';
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface BusinessRegisterData {
  company_name: string;
  business_name: string;
  rfc: string;
  address: string;
  phone: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_phone: string;
  billing_cycle: string;
  email: string;
  password: string;
}

// Employee Types
export type EmployeeType = 'hourly_tipped_waiter' | 'hourly_tipped_delivery' | 'hourly_fixed' | 'exempt_salary';
export type PayFrequency = 'weekly' | 'biweekly' | 'monthly';
export type PaymentMethod = 'cash' | 'transfer' | 'check';
export type BankAccountType = 'checking' | 'savings';

export interface Employee {
  id: string;
  employee_code: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  alias?: string;
  ssn?: string;
  date_of_birth?: string;
  email?: string;
  phone: string;
  hire_date: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  employee_type: EmployeeType;
  position: string;
  hourly_rate?: number;
  annual_salary?: number;
  pay_frequency: PayFrequency;
  regular_shift?: string;
  department?: string;
  payment_method: PaymentMethod;
  bank_account_number?: string;
  bank_routing_number?: string;
  bank_account_type?: BankAccountType;
  has_tip_credit: boolean;
  tip_credit_cash_wage?: number;
  tip_credit_amount?: number;
  state_minimum_wage?: number;
  face_image_path?: string;
  is_active: boolean;
  created_at: string;
}

export interface EmployeeRegisterData {
  first_name: string;
  last_name: string;
  alias?: string;
  ssn: string;
  date_of_birth: string;
  email?: string;
  phone: string;
  hire_date: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  employee_type: EmployeeType;
  position: string;
  hourly_rate: number;
  pay_frequency: PayFrequency;
  regular_shift?: string;
  department?: string;
  payment_method: PaymentMethod;
  bank_account_number?: string;
  bank_routing_number?: string;
  bank_account_type?: BankAccountType;
  state_minimum_wage?: number;
  face_image?: File;
}

// Deduction Types
export type DeductionType = 'federal_tax' | 'state_tax' | 'social_security' | 'medicare' | 'health_insurance' | 'retirement' | 'union_dues' | 'other';

export interface Deduction {
  id: string;
  employee_id: string;
  tenant_id: string;
  deduction_type: DeductionType;
  deduction_name: string;
  deduction_percentage?: number | string;
  deduction_fixed_amount?: number | string;
  is_percentage: boolean;
  effective_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
}

export interface DeductionCreate {
  employee_id: string;
  deduction_type: DeductionType;
  deduction_name: string;
  deduction_percentage?: number;
  deduction_fixed_amount?: number;
  is_percentage: boolean;
  effective_date: string;
  end_date?: string;
}

// Incident Types
export type IncidentType = 'bonus' | 'penalty' | 'tips_reported' | 'warning' | 'advance' | 'other';

export interface Incident {
  id: string;
  employee_id: string;
  tenant_id: string;
  incident_type: IncidentType;
  incident_name: string;
  amount?: string;
  description?: string;
  incident_date: string;
  payroll_period_start?: string;
  payroll_period_end?: string;
  is_applied_to_payroll: boolean;
  applied_payroll_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentCreate {
  employee_id: string;
  incident_type: IncidentType;
  incident_name: string;
  amount?: number;
  description?: string;
  incident_date: string;
  payroll_period_start?: string;
  payroll_period_end?: string;
}

// Time Entry Types
export type RecordType = 'check_in' | 'check_out' | 'break_start' | 'break_end';

export interface TimeEntry {
  id: string;
  employee_id: string;
  employee_name?: string;
  employee_code?: string;
  position?: string;
  record_type: RecordType;
  record_time?: string; // Campo del API GET
  timestamp?: string; // Campo del API POST (mantener compatibilidad)
  face_confidence?: number; // Campo del API GET
  confidence?: number; // Campo del API POST (mantener compatibilidad)
  device_info?: string;
  created_at?: string;
}

export interface TimeEntryCreate {
  face_image: File;
  tenant_id: string;
  record_type: RecordType;
  device_info?: string;
}

// Payroll Types
export interface TipCreditInfo {
  applicable: boolean;
  cash_wage_rate: number;
  tip_credit_amount: number;
  tips_required: number;
  tips_reported: number;
  tip_credit_shortfall: number;
}

export interface PayrollCalculation {
  employee_id: string;
  employee_code: string;
  employee_name: string;
  employee_type: string;
  hourly_rate: string;
  annual_salary: string | null;
  pay_frequency: string;
  regular_hours: string;
  overtime_hours: string;
  break_hours: string;
  regular_pay: string;
  overtime_pay: string;
  spread_hours_pay: string;
  gross_pay: string;
  total_bonus: string;
  total_penalty: string;
  other_income: string;
  adjusted_gross_pay: string;
  federal_tax: string;
  state_tax: string;
  social_security: string;
  medicare: string;
  other_deductions: string;
  total_deductions: string;
  net_pay: string;
  tips_reported: string;
  spread_hours_eligible: boolean;
}

export interface PayrollResponse {
  payroll: {
    id: string;
    tenant_id: string;
    period_start: string;
    period_end: string;
    pay_frequency: string;
    status: string;
    total_employees: number;
    total_gross_pay: string;
    total_net_pay: string;
    total_deductions: string;
    created_at: string;
    updated_at: string;
    description: string | null;
  };
  calculations: PayrollCalculation[];
  time_summaries: TimeSummary[];
}

export interface TimeSummary {
  employee_id: string;
  employee_code: string;
  employee_name: string;
  regular_hours: string;
  overtime_hours: string;
  break_hours: string;
  total_work_hours: string;
  check_in_count: number;
  check_out_count: number;
  break_start_count: number;
  break_end_count: number;
}

export interface PayrollRequest {
  tenant_id: string;
  period_start: string;
  period_end: string;
  pay_frequency: string;
}

export interface PayrollListItem {
  id: string;
  tenant_id: string;
  period_start: string;
  period_end: string;
  pay_frequency: string;
  status: string;
  total_employees: number;
  total_gross_pay: string;
  total_net_pay: string;
  total_deductions: string;
  created_at: string;
  updated_at: string;
  description: string | null;
}

export interface PayrollListResponse {
  payrolls: PayrollListItem[];
  total_count: number;
  page: number;
  page_size: number;
}

// PDF Types
export interface PDFGenerate {
  payroll_id: string;
  include_deductions_detail?: boolean;
  include_tip_credit_info?: boolean;
}

export interface PDFGenerateDetailed {
  payroll_id: string;
  employee_id: string;
  include_time_details?: boolean;
  include_deductions_breakdown?: boolean;
  include_tip_credit_calculation?: boolean;
}

export interface PDFResponse {
  pdf_filename: string;
  pdf_path: string;
}

// Digital Signature Types
export type SignatureType = 'drawn' | 'typed' | 'digital' | 'biometric';

export interface SignatureMetadata {
  device?: string;
  ip_address?: string;
  user_agent?: string;
  signed_location?: string;
  timestamp?: string;
  geolocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface DigitalSignature {
  id: string;
  employee_id: string;
  tenant_id: string;
  payroll_pdf_id: string;
  signature_type: SignatureType;
  signature_data: string;
  signature_metadata?: SignatureMetadata;
  signed_at: string;
  is_valid: boolean;
  invalidated_at?: string;
  invalidated_by?: string;
  invalidation_reason?: string;
}

export interface SignatureCreate {
  payroll_pdf_id: string;
  signature_type: SignatureType;
  signature_data: string;
  signature_metadata?: SignatureMetadata;
}

// Pay Rate Types
export interface PayRate {
  id: string;
  employee_id: string;
  tenant_id: string;
  regular_rate: number;
  overtime_rate: number;
  overtime_threshold: number;
  spread_hours_enabled: boolean;
  spread_hours_threshold: number;
  spread_hours_rate: number;
  break_compliance_enabled: boolean;
  break_threshold_hours: number;
  required_break_minutes: number;
  effective_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
}

export interface PayRateCreate {
  employee_id: string;
  regular_rate: number;
  overtime_rate: number;
  overtime_threshold?: number;
  spread_hours_enabled?: boolean;
  spread_hours_threshold?: number;
  spread_hours_rate?: number;
  break_compliance_enabled?: boolean;
  break_threshold_hours?: number;
  required_break_minutes?: number;
  effective_date: string;
}

// Sick Leave Types
export interface SickLeave {
  id: string;
  employee_id: string;
  employee_code: string;
  year: number;
  hours_accrued: number;
  hours_used: number;
  hours_remaining: number;
  last_accrual_date?: string;
  created_at: string;
}

export interface SickLeaveUsage {
  id: string;
  employee_id: string;
  employee_code: string;
  usage_date: string;
  hours_used: number;
  reason?: string;
  requires_approval: boolean;
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  approval_notes?: string;
  created_at: string;
}

export interface SickLeaveUsageCreate {
  employee_code: string;
  usage_date: string;
  hours_used: number;
  reason?: string;
  requires_approval?: boolean;
}

// Report Types
export interface AttendanceReport {
  employee_id: string;
  employee_name: string;
  date: string;
  check_in?: string;
  check_out?: string;
  total_hours: number;
  late_arrival: boolean;
  early_departure: boolean;
}

export interface PayrollReport {
  period_start: string;
  period_end: string;
  total_employees: number;
  total_hours: number;
  total_gross_pay: number;
  total_deductions: number;
  total_net_pay: number;
  tip_credit_summary?: {
    total_tips_required: number;
    total_tips_reported: number;
    total_shortfall: number;
  };
}

export interface SickLeaveReport {
  employee_id: string;
  employee_name: string;
  hours_accrued: number;
  hours_used: number;
  hours_remaining: number;
  compliance_status: string;
}

export interface BreakComplianceAlert {
  id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  hours_worked: number;
  break_taken: boolean;
  break_duration_minutes?: number;
  status: 'pending' | 'resolved';
  resolution_notes?: string;
}

export interface BreakComplianceResponse {
  total_alerts: number;
  alerts: BreakComplianceAlert[];
}

export interface PayRatesListResponse {
  pay_rates: PayRate[];
  total_count: number;
  page: number;
  page_size: number;
}

export interface SickLeavePendingResponse {
  total_pending: number;
  pending_usage: SickLeave[];
}

export interface QuickStats {
  tenant_id: string;
  company_name: string;
  generated_at: string;
  statistics: {
    today: {
      date: string;
      attendance_rate: number;
      employees_checked_in: number;
      late_arrivals: number;
      absent: number;
    };
    this_week: {
      period: string;
      total_hours: number;
      average_daily_hours: number;
      overtime_hours: number;
    };
    this_month: {
      period: string;
      total_employees: number;
      active_employees: number;
      new_employees: number;
    };
    alerts: {
      pending_sick_leave: number;
      payroll_pending: number;
      system_issues: number;
    };
  };
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
}

export interface ApiError {
  detail: string | any[];
  status?: number;
}

// Tip Credit Configuration Types
export interface TipCreditConfig {
  id: string;
  tenant_id?: string;
  config_name: string;
  state: string;
  city?: string;
  minimum_wage: number;
  cash_wage: number;
  tip_credit_amount: number;
  minimum_tips_threshold?: number;
  effective_date: string;
  end_date?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export interface TipCreditConfigCreate {
  config_name: string;
  state: string;
  city?: string;
  minimum_wage: number;
  cash_wage: number;
  tip_credit_amount: number;
  minimum_tips_threshold?: number;
  effective_date: string;
  end_date?: string;
  notes?: string;
}

export interface TipCreditConfigResponse {
  config: TipCreditConfig;
  is_global: boolean;
  source: string;
}

export interface TipCreditShortfall {
  tips_required: number;
  tips_reported: number;
  shortfall: number;
  config_used: TipCreditConfig;
}

// UI State Types
export interface LoadingState {
  [key: string]: boolean;
}

export interface ErrorState {
  [key: string]: string | null;
}
