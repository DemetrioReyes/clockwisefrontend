// URL del API desde variable de entorno
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Super Admin
  SUPER_ADMIN_LOGIN: '/api/auth/token',
  SUPER_ADMIN_ME: '/api/auth/me',

  // Business
  BUSINESS_REGISTER: '/api/business/',
  BUSINESS_LOGIN: '/api/business-auth/token',
  BUSINESS_ME: '/api/business-auth/me',
  LIST_BUSINESSES: '/api/business/',
  BUSINESS_BY_ID: '/api/business',
  UPDATE_BUSINESS: '/api/business',

  // Employees
  EMPLOYEES: '/api/employees/',
  EMPLOYEE_BY_ID: '/api/employees',
  UPDATE_EMPLOYEE: '/api/employees',
  TIME_ENTRY: '/api/employees/time-entry',

  // Deductions & Tips
  EMPLOYEE_DEDUCTIONS: '/api/employee-deductions/deductions',
  EMPLOYEE_BENEFITS: '/api/employee-deductions/benefits',
  EMPLOYEE_INCIDENTS: '/api/employee-deductions/incidents',
  SETUP_STANDARD_DEDUCTIONS: '/api/employee-deductions/setup-standard-deductions',
  PAYROLL_CONFIG: '/api/employee-deductions/payroll-config',
  PAYROLL_SUMMARY: '/api/employee-deductions/summary',

  // Payroll
  CALCULATE_PAYROLL: '/api/payroll/calculate',
  PAYROLL_BY_ID: '/api/payroll',
  LIST_PAYROLLS: '/api/payroll/',
  UPDATE_PAYROLL_STATUS: '/api/payroll',
  EMPLOYEE_PAYROLL_SUMMARY: '/api/payroll/employee',

  // Reports
  ATTENDANCE_REPORT: '/api/reports/attendance',
  PAYROLL_REPORT: '/api/reports/payroll',
  SICK_LEAVE_REPORT: '/api/reports/sick-leave',
  TIME_SUMMARY_REPORT: '/api/reports/time-summary',
  QUICK_STATS: '/api/reports/quick-stats',

  // Break Compliance
  BREAK_COMPLIANCE_ALERTS: '/api/break-compliance/alerts',
  BREAK_COMPLIANCE_DASHBOARD: '/api/break-compliance/dashboard',

  // PDF Generation
  GENERATE_PDF_SUMMARY: '/api/pdf-payroll/generate-summary',
  GENERATE_PDF_DETAILED: '/api/pdf-payroll/generate-detailed',
  DOWNLOAD_PDF: '/api/pdf-payroll/download',
  PDF_HISTORY: '/api/pdf-payroll/history',

  // Digital Signatures
  SIGN_DOCUMENT: '/api/digital-signatures/',
  EMPLOYEE_SIGNATURES: '/api/digital-signatures/employee',
  SIGNATURE_BY_ID: '/api/digital-signatures',
  PDF_SIGNATURE: '/api/digital-signatures/payroll-pdf',
  INVALIDATE_SIGNATURE: '/api/digital-signatures',

  // Pay Rates
  PAY_RATES: '/api/pay-rates/',
  EMPLOYEE_CURRENT_PAY_RATE: '/api/pay-rates/employee',
  EMPLOYEE_PAY_RATE_HISTORY: '/api/pay-rates/employee',
  PAY_RATE_SUMMARY: '/api/pay-rates/employee',
  UPDATE_PAY_RATE: '/api/pay-rates',

  // Sick Leave
  SICK_LEAVE_SUMMARY: '/api/sick-leave/summary',
  SICK_LEAVE_LIST: '/api/sick-leave/list',
  SICK_LEAVE_USAGE: '/api/sick-leave/usage',
  SICK_LEAVE_USAGE_HISTORY: '/api/sick-leave/usage/employee',
  PENDING_SICK_LEAVE: '/api/sick-leave/usage/pending',
  APPROVE_SICK_LEAVE: '/api/sick-leave/usage',
  ACCUMULATE_SICK_LEAVE: '/api/sick-leave/accumulate-all',

  // Tip Credit Configuration
  TIP_CREDIT_CURRENT: '/api/tip-credit/current',
  TIP_CREDIT_LIST: '/api/tip-credit/',
  TIP_CREDIT_CREATE: '/api/tip-credit/',
  TIP_CREDIT_SYSTEM: '/api/tip-credit/system',
  TIP_CREDIT_CALCULATE: '/api/tip-credit/calculate-shortfall',
  TIP_CREDIT_UPDATE: '/api/tip-credit',
  TIP_CREDIT_DELETE: '/api/tip-credit',
};
