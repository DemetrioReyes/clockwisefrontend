import React, { useState, useEffect } from 'react';
import { formatErrorMessage } from '../../../services/api';
import { API_BASE_URL } from '../../../config/api';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { useLanguage } from '../../../contexts/LanguageContext';
import { reportsService } from '../../../services/reports.service';
import { sickleaveService } from '../../../services/sickleave.service';
import { pdfService } from '../../../services/pdf.service';
import {
  BreakComplianceAlert,
  TimeEntry,
  Employee,
  SickLeaveDocument,
  SickLeaveDocumentFilters,
  PayrollDocument,
  PayrollDocumentFilters,
} from '../../../types';
import { CheckCircle, XCircle, CheckCircle2, X, Calendar, DollarSign, Clock, FileText, Download, Link, Server } from 'lucide-react';
import employeeService from '../../../services/employee.service';
import payrollService from '../../../services/payroll.service';

type ReportTab = 'attendance' | 'payroll' | 'time-summary' | 'break-compliance' | 'sick-leave-documents' | 'payroll-documents';

interface AttendanceReportItem {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  date: string;
  check_in: string;
  check_out: string;
  total_hours: number;
  late_arrival: boolean;
  early_departure: boolean;
}

interface PayrollSummaryReport {
  period_start: string;
  period_end: string;
  total_employees: number;
  total_gross_pay: number;
  total_net_pay: number;
  total_hours: number;
  total_deductions: number;
  total_food_gift_credit: number;
  total_paid_sick_leave_hours: number;
  total_paid_sick_leave_amount: number;
  payrolls: any[];
}

interface TimeSummaryItem {
  group_key: string;
  employee_name?: string;
  date?: string;
  week?: string;
  department?: string;
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
}

const Reports: React.FC = () => {
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ReportTab>('attendance');
  
  const locale = language === 'es' ? 'es-ES' : 'en-US';

  const parseNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }
    const normalized = typeof value === 'string' ? value.replace(/,/g, '') : String(value);
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  // Attendance Report State
  const [attendanceData, setAttendanceData] = useState<AttendanceReportItem[]>([]);
  const [attendanceStartDate, setAttendanceStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Last 7 days
    return date.toISOString().split('T')[0];
  });
  const [attendanceEndDate, setAttendanceEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Payroll Report State
  const [payrollData, setPayrollData] = useState<PayrollSummaryReport | null>(null);
  const [payrollStartDate, setPayrollStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Last 30 days
    return date.toISOString().split('T')[0];
  });
  const [payrollEndDate, setPayrollEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Time Summary Report State
  const [timeSummaryData, setTimeSummaryData] = useState<TimeSummaryItem[]>([]);
  const [timeSummaryStartDate, setTimeSummaryStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [timeSummaryEndDate, setTimeSummaryEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [timeSummaryGroupBy, setTimeSummaryGroupBy] = useState<'employee' | 'day' | 'week' | 'department'>('employee');

  // Break Compliance State
  const [breakComplianceData, setBreakComplianceData] = useState<BreakComplianceAlert[]>([]);
  const [breakComplianceStatus, setBreakComplianceStatus] = useState<'pending' | 'resolved' | 'all'>('pending');
  const [breakComplianceTotal, setBreakComplianceTotal] = useState<number>(0);
  const [resolvingAlert, setResolvingAlert] = useState<BreakComplianceAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  // Sick Leave Documents State
  const [sickLeaveDocuments, setSickLeaveDocuments] = useState<SickLeaveDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsEmployeeId, setDocumentsEmployeeId] = useState<string>('');
  const [documentsStartDate, setDocumentsStartDate] = useState<string>('');
  const [documentsEndDate, setDocumentsEndDate] = useState<string>('');
  const [documentsEmployees, setDocumentsEmployees] = useState<Employee[]>([]);

  // Payroll Documents State
  const [payrollDocuments, setPayrollDocuments] = useState<PayrollDocument[]>([]);
  const [payrollDocumentsLoading, setPayrollDocumentsLoading] = useState(false);
  const [payrollDocumentsEmployeeId, setPayrollDocumentsEmployeeId] = useState<string>('');
  const [payrollDocumentsPayrollId, setPayrollDocumentsPayrollId] = useState<string>('');
  const [payrollDocumentsStartDate, setPayrollDocumentsStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [payrollDocumentsEndDate, setPayrollDocumentsEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [payrollDocumentsLimit, setPayrollDocumentsLimit] = useState<string>('50');

  // Helper function to load employees
  const loadEmployees = async (): Promise<Record<string, Employee>> => {
    try {
      const employees = await employeeService.listEmployees(true);
      const employeesMap: Record<string, Employee> = {};
      employees.forEach((emp: Employee) => {
        employeesMap[emp.id] = emp;
      });
      return employeesMap;
    } catch (error) {
      console.error('Error loading employees:', error);
      return {};
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const employeeList = await employeeService.listEmployees(true);
        setDocumentsEmployees(employeeList);
      } catch (error) {
        console.error('Error loading employees for sick leave documents:', error);
      }
    })();
  }, []);

  // Attendance Report Handlers - Generate from time entries
  const handleLoadAttendance = async () => {
    if (!attendanceStartDate || !attendanceEndDate) {
      showToast(t('please_select_start_and_end_dates') || 'Please select start and end dates', 'error');
      return;
    }

    setLoading(true);
    try {
      // Load all employees
      const employeesMap = await loadEmployees();
      
      // Load time entries for all employees in the date range
      const allTimeEntries: TimeEntry[] = [];
      const employeeIds = Object.keys(employeesMap);
      
      for (const employeeId of employeeIds) {
        try {
          const entries = await employeeService.listTimeEntries(employeeId, attendanceStartDate, attendanceEndDate);
          if (Array.isArray(entries)) {
            allTimeEntries.push(...entries);
          }
        } catch (error) {
          console.error(`Error loading time entries for employee ${employeeId}:`, error);
        }
      }

      // Process time entries to create attendance report
      const attendanceMap: Record<string, AttendanceReportItem> = {};
      
      // Group entries by employee and date
      allTimeEntries.forEach((entry) => {
        if (!entry.employee_id || !entry.record_time) return;
        
        const entryDate = new Date(entry.record_time).toISOString().split('T')[0];
        const key = `${entry.employee_id}-${entryDate}`;
        const employee = employeesMap[entry.employee_id];
        
        if (!employee) return;
        
        if (!attendanceMap[key]) {
          attendanceMap[key] = {
            employee_id: entry.employee_id,
            employee_name: `${employee.first_name} ${employee.last_name}`,
            employee_code: employee.employee_code,
            date: entryDate,
            check_in: '',
            check_out: '',
            total_hours: 0,
            late_arrival: false,
            early_departure: false,
          };
        }
        
        const timeStr = new Date(entry.record_time).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        
        if (entry.record_type === 'check_in') {
          attendanceMap[key].check_in = timeStr;
          // Check for late arrival (after 9:00 AM)
          const entryHour = new Date(entry.record_time).getHours();
          if (entryHour >= 9) {
            attendanceMap[key].late_arrival = true;
          }
        } else if (entry.record_type === 'check_out') {
          attendanceMap[key].check_out = timeStr;
          // Check for early departure (before 5:00 PM)
          const entryHour = new Date(entry.record_time).getHours();
          if (entryHour < 17) {
            attendanceMap[key].early_departure = true;
          }
        }
      });

      // Calculate hours worked for each day
      Object.keys(attendanceMap).forEach((key) => {
        const item = attendanceMap[key];
        const dayEntries = allTimeEntries.filter(
          (e) => e.employee_id === item.employee_id && 
          e.record_time && 
          new Date(e.record_time).toISOString().split('T')[0] === item.date
        );
        
        // Find check-in and check-out times
        const checkIn = dayEntries.find((e) => e.record_type === 'check_in' && e.record_time);
        const checkOut = dayEntries.find((e) => e.record_type === 'check_out' && e.record_time);
        
        if (checkIn && checkOut && checkIn.record_time && checkOut.record_time) {
          const startTime = new Date(checkIn.record_time).getTime();
          const endTime = new Date(checkOut.record_time).getTime();
          const hours = (endTime - startTime) / (1000 * 60 * 60);
          item.total_hours = Math.max(0, hours);
        }
      });

      const attendanceReport = Object.values(attendanceMap)
        .filter((item) => item.check_in || item.check_out)
        .sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.employee_name.localeCompare(b.employee_name);
        });

      setAttendanceData(attendanceReport);
      showToast(t('report_loaded_successfully'), 'success');
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  // Payroll Report Handlers - Generate from saved payrolls
  const handleLoadPayroll = async () => {
    if (!payrollStartDate || !payrollEndDate) {
      showToast(t('please_select_start_and_end_dates') || 'Please select start and end dates', 'error');
      return;
    }

    setLoading(true);
    try {
      // Load all payrolls
      const payrollsResponse = await payrollService.listPayrolls(undefined, 1000);
      const payrollsList = Array.isArray(payrollsResponse) 
        ? payrollsResponse 
        : ((payrollsResponse as any)?.payrolls || (payrollsResponse as any)?.items || []);

      // Filter payrolls by date range
      const filteredPayrolls = payrollsList.filter((payroll: any) => {
        if (!payroll.period_start || !payroll.period_end) return false;
        const startDate = new Date(payroll.period_start);
        const endDate = new Date(payroll.period_end);
        const filterStart = new Date(payrollStartDate);
        const filterEnd = new Date(payrollEndDate);
        
        // Check if payroll period overlaps with filter period
        return (startDate <= filterEnd && endDate >= filterStart);
      });

      // Load detailed payroll data for each payroll
      const payrollDetails: any[] = [];
      for (const payroll of filteredPayrolls) {
        try {
          const detail = await payrollService.getPayrollById(payroll.id);
          payrollDetails.push(detail);
        } catch (error) {
          console.error(`Error loading payroll ${payroll.id}:`, error);
        }
      }

      // Calculate summary
      let totalEmployees = 0;
      let totalGrossPay = 0;
      let totalNetPay = 0;
      let totalHours = 0;
      let totalDeductions = 0;
      let totalFoodGiftCredit = 0;
      let totalPaidSickLeaveHours = 0;
      let totalPaidSickLeaveAmount = 0;
      const employeeSet = new Set<string>();

      payrollDetails.forEach((detail) => {
        // Use payroll totals if available (from PayrollResponse.payroll object)
        if (detail.payroll) {
          const grossPay = parseNumber(detail.payroll.total_gross_pay);
          const netPay = parseNumber(detail.payroll.total_net_pay);
          const deductions = parseNumber(detail.payroll.total_deductions);
          
          totalGrossPay += grossPay;
          totalNetPay += netPay;
          totalDeductions += deductions;
          totalEmployees = Math.max(totalEmployees, detail.payroll.total_employees || 0);

          if (detail.payroll.total_food_gift_credit !== undefined && detail.payroll.total_food_gift_credit !== null) {
            totalFoodGiftCredit += parseNumber(detail.payroll.total_food_gift_credit);
          }
          if (detail.payroll.total_paid_sick_leave_hours !== undefined && detail.payroll.total_paid_sick_leave_hours !== null) {
            totalPaidSickLeaveHours += parseNumber(detail.payroll.total_paid_sick_leave_hours);
          }
          if (detail.payroll.total_paid_sick_leave_amount !== undefined && detail.payroll.total_paid_sick_leave_amount !== null) {
            totalPaidSickLeaveAmount += parseNumber(detail.payroll.total_paid_sick_leave_amount);
          }
        }
        
        // Count unique employees from calculations
        if (detail.calculations && Array.isArray(detail.calculations)) {
          detail.calculations.forEach((calc: any) => {
            if (calc.employee_id) {
              employeeSet.add(calc.employee_id);
            }

            if (detail.payroll?.total_food_gift_credit === undefined || detail.payroll?.total_food_gift_credit === null) {
              totalFoodGiftCredit += parseNumber(calc.food_gift_credit);
            }
            if (detail.payroll?.total_paid_sick_leave_hours === undefined || detail.payroll?.total_paid_sick_leave_hours === null) {
              totalPaidSickLeaveHours += parseNumber(calc.paid_sick_leave_hours);
            }
            if (detail.payroll?.total_paid_sick_leave_amount === undefined || detail.payroll?.total_paid_sick_leave_amount === null) {
              totalPaidSickLeaveAmount += parseNumber(calc.paid_sick_leave_amount);
            }
          });
        }
        
        // Calculate hours from time summaries if available
        if (detail.time_summaries && Array.isArray(detail.time_summaries)) {
          detail.time_summaries.forEach((ts: any) => {
            const hours = parseNumber(ts.hours_worked);
            totalHours += hours;
          });
        }
      });

      // Use employee count from set if we have it, otherwise use the max from payrolls
      if (employeeSet.size > 0) {
        totalEmployees = employeeSet.size;
      }

      const summary: PayrollSummaryReport = {
        period_start: payrollStartDate,
        period_end: payrollEndDate,
        total_employees: totalEmployees,
        total_gross_pay: totalGrossPay,
        total_net_pay: totalNetPay,
        total_hours: totalHours,
        total_deductions: totalDeductions,
        total_food_gift_credit: totalFoodGiftCredit,
        total_paid_sick_leave_hours: totalPaidSickLeaveHours,
        total_paid_sick_leave_amount: totalPaidSickLeaveAmount,
        payrolls: filteredPayrolls,
      };

      setPayrollData(summary);
      showToast(t('report_loaded_successfully'), 'success');
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
      setPayrollData(null);
    } finally {
      setLoading(false);
    }
  };

  // Time Summary Report Handlers - Generate from time entries
  const handleLoadTimeSummary = async () => {
    if (!timeSummaryStartDate || !timeSummaryEndDate) {
      showToast(t('please_select_start_and_end_dates') || 'Please select start and end dates', 'error');
      return;
    }

    setLoading(true);
    try {
      // Load all employees
      const employeesMap = await loadEmployees();
      const employees = Object.values(employeesMap);
      
      // Load time entries for all employees
      const allTimeEntries: TimeEntry[] = [];
      
      for (const employee of employees) {
        try {
          const entries = await employeeService.listTimeEntries(employee.id, timeSummaryStartDate, timeSummaryEndDate);
          if (Array.isArray(entries)) {
            allTimeEntries.push(...entries);
          }
        } catch (error) {
          console.error(`Error loading time entries for employee ${employee.id}:`, error);
        }
      }

      // Process based on group by
      const summaryMap: Record<string, TimeSummaryItem> = {};

      if (timeSummaryGroupBy === 'employee') {
        employees.forEach((employee) => {
          const employeeEntries = allTimeEntries.filter((e) => e.employee_id === employee.id);
          const { totalHours, regularHours, overtimeHours } = calculateHoursFromEntries(employeeEntries);
          
          summaryMap[employee.id] = {
            group_key: `${employee.first_name} ${employee.last_name}`,
            employee_name: `${employee.first_name} ${employee.last_name}`,
            total_hours: totalHours,
            regular_hours: regularHours,
            overtime_hours: overtimeHours,
          };
        });
      } else if (timeSummaryGroupBy === 'day') {
        // Group by date
        const dateMap: Record<string, TimeEntry[]> = {};
        allTimeEntries.forEach((entry) => {
          if (!entry.record_time) return;
          const date = new Date(entry.record_time).toISOString().split('T')[0];
          if (!dateMap[date]) dateMap[date] = [];
          dateMap[date].push(entry);
        });

        Object.keys(dateMap).forEach((date) => {
          const { totalHours, regularHours, overtimeHours } = calculateHoursFromEntries(dateMap[date]);
          summaryMap[date] = {
            group_key: date,
            date: date,
            total_hours: totalHours,
            regular_hours: regularHours,
            overtime_hours: overtimeHours,
          };
        });
      } else if (timeSummaryGroupBy === 'week') {
        // Group by week
        const weekMap: Record<string, TimeEntry[]> = {};
        allTimeEntries.forEach((entry) => {
          if (!entry.record_time) return;
          const date = new Date(entry.record_time);
          const weekStart = getWeekStart(date);
          const weekKey = weekStart.toISOString().split('T')[0];
          if (!weekMap[weekKey]) weekMap[weekKey] = [];
          weekMap[weekKey].push(entry);
        });

        Object.keys(weekMap).forEach((weekKey) => {
          const weekStart = new Date(weekKey);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          const weekLabel = `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
          
          const { totalHours, regularHours, overtimeHours } = calculateHoursFromEntries(weekMap[weekKey]);
          summaryMap[weekKey] = {
            group_key: weekLabel,
            week: weekLabel,
            total_hours: totalHours,
            regular_hours: regularHours,
            overtime_hours: overtimeHours,
          };
        });
      } else if (timeSummaryGroupBy === 'department') {
        // Group by department
        const departmentMap: Record<string, TimeEntry[]> = {};
        allTimeEntries.forEach((entry) => {
          const employee = employeesMap[entry.employee_id || ''];
          const dept = employee?.department || 'No Department';
          if (!departmentMap[dept]) departmentMap[dept] = [];
          departmentMap[dept].push(entry);
        });

        Object.keys(departmentMap).forEach((dept) => {
          const { totalHours, regularHours, overtimeHours } = calculateHoursFromEntries(departmentMap[dept]);
          summaryMap[dept] = {
            group_key: dept,
            department: dept,
            total_hours: totalHours,
            regular_hours: regularHours,
            overtime_hours: overtimeHours,
          };
        });
      }

      const summaryArray = Object.values(summaryMap).sort((a, b) => {
        if (a.group_key && b.group_key) {
          return a.group_key.localeCompare(b.group_key);
        }
        return 0;
      });

      setTimeSummaryData(summaryArray);
      showToast(t('report_loaded_successfully'), 'success');
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
      setTimeSummaryData([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate hours from time entries
  const calculateHoursFromEntries = (entries: TimeEntry[]): { totalHours: number; regularHours: number; overtimeHours: number } => {
    // Filter and sort entries by time
    const validEntries = entries
      .filter((e) => e.record_time && (e.record_type === 'check_in' || e.record_type === 'check_out'))
      .sort((a, b) => {
        if (!a.record_time || !b.record_time) return 0;
        return new Date(a.record_time).getTime() - new Date(b.record_time).getTime();
      });

    let totalHours = 0;
    let regularHours = 0;
    let overtimeHours = 0;

    // Group by employee and date, then process chronologically
    const employeeDateMap: Record<string, TimeEntry[]> = {};
    
    validEntries.forEach((entry) => {
      if (!entry.employee_id || !entry.record_time) return;
      const date = new Date(entry.record_time).toISOString().split('T')[0];
      const key = `${entry.employee_id}-${date}`;
      
      if (!employeeDateMap[key]) {
        employeeDateMap[key] = [];
      }
      employeeDateMap[key].push(entry);
    });

    // Process each day, pairing check-ins with check-outs
    Object.values(employeeDateMap).forEach((dayEntries) => {
      // Sort by time
      dayEntries.sort((a, b) => {
        if (!a.record_time || !b.record_time) return 0;
        return new Date(a.record_time).getTime() - new Date(b.record_time).getTime();
      });

      let pendingCheckIn: Date | null = null;

      dayEntries.forEach((entry) => {
        if (!entry.record_time) return;
        
        if (entry.record_type === 'check_in') {
          // If there's a pending check-in, we found a new shift
          // (previous check-out was already processed or there was no check-out)
          pendingCheckIn = new Date(entry.record_time);
        } else if (entry.record_type === 'check_out' && pendingCheckIn) {
          // Pair check-out with pending check-in
          const checkOutTime = new Date(entry.record_time);
          const hours = (checkOutTime.getTime() - pendingCheckIn.getTime()) / (1000 * 60 * 60);
          
          // Only count positive hours (check-out should be after check-in)
          if (hours > 0 && hours < 24) { // Reasonable work shift (less than 24 hours)
            totalHours += hours;
            if (hours > 8) {
              regularHours += 8;
              overtimeHours += hours - 8;
            } else {
              regularHours += hours;
            }
          }
          pendingCheckIn = null; // Reset after pairing
        }
      });
    });

    return { totalHours, regularHours, overtimeHours };
  };

  // Helper function to get week start (Monday)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Break Compliance Handlers
  const handleLoadBreakCompliance = async () => {
    setLoading(true);
    try {
      const data = await reportsService.getBreakComplianceAlerts(breakComplianceStatus);
      if (Array.isArray(data)) {
        setBreakComplianceData(data);
        setBreakComplianceTotal(data.length);
      } else {
        setBreakComplianceData(data.alerts || []);
        setBreakComplianceTotal(data.total_alerts || data.alerts?.length || 0);
      }
      showToast(t('compliance_report_loaded'), 'success');
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const slugify = (value?: string) => {
    if (!value) return '';
    return value
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleLoadSickLeaveDocuments = async () => {
    setDocumentsLoading(true);
    try {
      const filters: SickLeaveDocumentFilters = {};
      if (documentsEmployeeId) filters.employee_id = documentsEmployeeId;
      if (documentsStartDate) filters.start_date = documentsStartDate;
      if (documentsEndDate) filters.end_date = documentsEndDate;

      const documents = await sickleaveService.listSickLeaveDocuments(filters);
      setSickLeaveDocuments(documents);
      if (documents.length > 0) {
        showToast(t('documents_loaded_successfully'), 'success');
      } else {
        showToast(t('no_documents_found'), 'info');
      }
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
      setSickLeaveDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleDownloadSickLeaveDocument = async (doc: SickLeaveDocument) => {
    try {
      const { blob, filename } = await sickleaveService.downloadSickLeaveDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');
      const fallbackName = `${slugify(doc.document_name || doc.document_filename || 'sick-leave-document') || 'sick-leave-document'}.pdf`;
      anchor.href = url;
      anchor.download = filename || fallbackName;
      window.document.body.appendChild(anchor);
      anchor.click();
      window.document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    }
  };

  const handleLoadPayrollDocuments = async () => {
    setPayrollDocumentsLoading(true);
    try {
      const filters: PayrollDocumentFilters = {};
      if (payrollDocumentsEmployeeId) {
        filters.employee_id = payrollDocumentsEmployeeId;
      }
      if (payrollDocumentsPayrollId) {
        filters.payroll_id = payrollDocumentsPayrollId;
      }
      if (payrollDocumentsStartDate) {
        filters.start_date = payrollDocumentsStartDate;
      }
      if (payrollDocumentsEndDate) {
        filters.end_date = payrollDocumentsEndDate;
      }

      const limitValue = payrollDocumentsLimit ? Number(payrollDocumentsLimit) : undefined;
      if (limitValue && !Number.isNaN(limitValue)) {
        filters.limit = limitValue;
      }

      const docs = await pdfService.listPayrollDocuments(filters);
      setPayrollDocuments(docs);
      if (docs.length > 0) {
        showToast(t('payroll_documents_loaded_successfully'), 'success');
      } else {
        showToast(t('no_payroll_documents'), 'info');
      }
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
      setPayrollDocuments([]);
    } finally {
      setPayrollDocumentsLoading(false);
    }
  };

  const handleDownloadPayrollDocument = async (doc: PayrollDocument) => {
    try {
      if (doc.download_url) {
        const url = resolveDownloadUrl(doc.download_url);
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
          showToast(t('document_downloaded_successfully'), 'success');
          return;
        }
      }

      if (!doc.pdf_filename) {
        showToast(t('payroll_document_download_unavailable'), 'info');
        return;
      }

      const blob = await pdfService.downloadPDF(doc.pdf_filename);
      pdfService.downloadPDFBlob(blob, doc.pdf_filename);
      showToast(t('document_downloaded_successfully'), 'success');
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    }
  };

  const handleOpenResolveModal = (alert: BreakComplianceAlert) => {
    setResolvingAlert(alert);
    setResolutionNotes('');
  };

  const handleCloseResolveModal = () => {
    setResolvingAlert(null);
    setResolutionNotes('');
  };

  const handleResolveAlert = async () => {
    if (!resolvingAlert || !resolutionNotes.trim()) {
      showToast(t('enter_resolution_notes'), 'error');
      return;
    }

    setResolving(true);
    try {
      await reportsService.resolveBreakComplianceAlert(resolvingAlert.id, resolutionNotes);
      showToast(t('alert_resolved_successfully'), 'success');
      handleCloseResolveModal();
      await handleLoadBreakCompliance();
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setResolving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
    }).format(Number.isFinite(amount) ? amount : 0);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const resolveDownloadUrl = (url: string) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    if (url.startsWith('/')) {
      return `${API_BASE_URL}${url}`;
    }
    return `${API_BASE_URL}/${url}`;
  };

  const translateOrFallback = (key: string, fallback: string) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('reports_title')}</h1>
          <p className="text-gray-600 mt-2">{t('compliance_reports')}</p>
        </div>

        <div className="flex space-x-4 border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="inline w-5 h-5 mr-2" />
            {t('attendance_report')}
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              activeTab === 'payroll'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <DollarSign className="inline w-5 h-5 mr-2" />
            {t('payroll_report')}
          </button>
          <button
            onClick={() => setActiveTab('time-summary')}
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              activeTab === 'time-summary'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="inline w-5 h-5 mr-2" />
            {t('time_summary_report')}
          </button>
          <button
            onClick={() => setActiveTab('break-compliance')}
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              activeTab === 'break-compliance'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CheckCircle className="inline w-5 h-5 mr-2" />
            {t('break_compliance')}
          </button>
          <button
            onClick={() => setActiveTab('sick-leave-documents')}
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              activeTab === 'sick-leave-documents'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="inline w-5 h-5 mr-2" />
            {t('sick_leave_documents_tab')}
          </button>
          <button
            onClick={() => setActiveTab('payroll-documents')}
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              activeTab === 'payroll-documents'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Download className="inline w-5 h-5 mr-2" />
            {t('payroll_documents_tab')}
          </button>
        </div>

        {/* Attendance Report Tab */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('start_date')}</label>
                  <input
                    type="date"
                    value={attendanceStartDate}
                    onChange={(e) => setAttendanceStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('end_date')}</label>
                  <input
                    type="date"
                    value={attendanceEndDate}
                    onChange={(e) => setAttendanceEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <button
                  onClick={handleLoadAttendance}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? t('loading') : t('load_report')}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" text={t('loading')} />
              </div>
            ) : attendanceData.length > 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('employee')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('date')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('check_in_time')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('check_out_time')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('hours_worked')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('status')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceData.map((item, index) => (
                      <tr key={`${item.employee_id}-${item.date}-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.employee_name}</div>
                          <div className="text-xs text-gray-500">{item.employee_code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{formatDate(item.date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{item.check_in || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{item.check_out || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.total_hours.toFixed(2)} {t('hrs')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {item.late_arrival && (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                {t('late_arrival')}
                              </span>
                            )}
                            {item.early_departure && (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                                {t('early_departure')}
                              </span>
                            )}
                            {!item.late_arrival && !item.early_departure && (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {t('on_time')}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-12 text-center text-gray-500">
                {t('no_data_available')}. {t('click_load_report') || 'Click "Load Report" to get data'}
              </div>
            )}
          </div>
        )}

        {/* Payroll Report Tab */}
        {activeTab === 'payroll' && (
          <div className="space-y-4">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('start_date')}</label>
                  <input
                    type="date"
                    value={payrollStartDate}
                    onChange={(e) => setPayrollStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('end_date')}</label>
                  <input
                    type="date"
                    value={payrollEndDate}
                    onChange={(e) => setPayrollEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <button
                  onClick={handleLoadPayroll}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? t('loading') : t('load_report')}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" text={t('loading')} />
              </div>
            ) : payrollData ? (
              <div className="space-y-4">
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('payroll_summary')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">{t('period')}</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatDate(payrollData.period_start)} - {formatDate(payrollData.period_end)}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">{t('total_employees_label')}</p>
                      <p className="text-lg font-semibold text-gray-900">{payrollData.total_employees}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">{t('total_gross_pay_label')}</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(payrollData.total_gross_pay)}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">{t('total_net_pay_label')}</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(payrollData.total_net_pay)}</p>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">{t('total_food_gift_credit_label')}</p>
                      <p className="text-lg font-semibold text-emerald-700">{formatCurrency(payrollData.total_food_gift_credit)}</p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">{t('total_paid_sick_leave_amount_label')}</p>
                      <p className="text-lg font-semibold text-indigo-700">{formatCurrency(payrollData.total_paid_sick_leave_amount)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('total_paid_sick_leave_hours_label')}: {formatNumber(payrollData.total_paid_sick_leave_hours)} {t('hrs')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">{t('total_hours')}</p>
                      <p className="text-lg font-semibold text-gray-900">{formatNumber(payrollData.total_hours)} {t('hrs')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('total_deductions_label')}</p>
                      <p className="text-lg font-semibold text-red-600">{formatCurrency(payrollData.total_deductions)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('total_payrolls') || 'Total Payrolls'}</p>
                      <p className="text-lg font-semibold text-gray-900">{payrollData.payrolls.length}</p>
                    </div>
                  </div>
                </div>

                {/* Payrolls List */}
                {payrollData.payrolls.length > 0 && (
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('payrolls_list') || 'Payrolls List'}</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('period')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('status')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('created_at')}</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {payrollData.payrolls.map((payroll: any) => (
                            <tr key={payroll.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {payroll.period_start && payroll.period_end 
                                    ? `${formatDate(payroll.period_start)} - ${formatDate(payroll.period_end)}`
                                    : '-'}
                                </div>
                                {parseNumber(payroll.total_food_gift_credit) > 0 && (
                                  <div className="text-xs text-emerald-600 mt-1">
                                    {t('food_gift_credit_label')}: {formatCurrency(parseNumber(payroll.total_food_gift_credit))}
                                  </div>
                                )}
                                {parseNumber(payroll.total_paid_sick_leave_amount) > 0 && (
                                  <div className="text-xs text-blue-600">
                                    {t('paid_sick_leave_label')}: {formatCurrency(parseNumber(payroll.total_paid_sick_leave_amount))} · {formatNumber(parseNumber(payroll.total_paid_sick_leave_hours))} {t('hrs')}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  payroll.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  payroll.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                                  payroll.status === 'calculated' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {payroll.status || 'draft'}
                          </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600">
                                  {payroll.created_at ? formatDate(payroll.created_at) : '-'}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-12 text-center text-gray-500">
                {t('no_data_available')}. {t('click_load_report') || 'Click "Load Report" to get data'}
              </div>
            )}
          </div>
        )}

        {/* Time Summary Report Tab */}
        {activeTab === 'time-summary' && (
          <div className="space-y-4">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('start_date')}</label>
                  <input
                    type="date"
                    value={timeSummaryStartDate}
                    onChange={(e) => setTimeSummaryStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('end_date')}</label>
                  <input
                    type="date"
                    value={timeSummaryEndDate}
                    onChange={(e) => setTimeSummaryEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('group_by')}</label>
                  <select
                    value={timeSummaryGroupBy}
                    onChange={(e) => setTimeSummaryGroupBy(e.target.value as 'employee' | 'day' | 'week' | 'department')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="employee">{t('employee')}</option>
                    <option value="day">{t('day')}</option>
                    <option value="week">{t('week')}</option>
                    <option value="department">{t('department')}</option>
                  </select>
                </div>
                <button
                  onClick={handleLoadTimeSummary}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? t('loading') : t('load_report')}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" text={t('loading')} />
              </div>
            ) : timeSummaryData.length > 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('group_by')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('total_hours')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('regular_hours') || 'Regular Hours'}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('overtime_hours') || 'Overtime Hours'}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {timeSummaryData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item.group_key || item.employee_name || item.date || item.week || item.department || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.total_hours.toFixed(2)} {t('hrs')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {item.regular_hours.toFixed(2)} {t('hrs')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {item.overtime_hours.toFixed(2)} {t('hrs')}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-12 text-center text-gray-500">
                {t('no_data_available')}. {t('click_load_report') || 'Click "Load Report" to get data'}
              </div>
            )}
          </div>
        )}

        {/* Break Compliance Tab */}
        {activeTab === 'break-compliance' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-1">{t('break_compliance')}</h3>
              <p className="text-sm text-blue-700">{t('break_compliance_description')}</p>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('alert_status')}</label>
                  <select
                    value={breakComplianceStatus}
                    onChange={(e) => setBreakComplianceStatus(e.target.value as 'pending' | 'resolved' | 'all')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">{t('pending')}</option>
                    <option value="resolved">{t('resolved')}</option>
                    <option value="all">{t('all')}</option>
                  </select>
                </div>
              <button
                onClick={handleLoadBreakCompliance}
                disabled={loading}
                  className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-2">{t('loading')}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {t('load_alerts')}
                    </>
                  )}
              </button>
              </div>
            </div>

            {breakComplianceTotal > 0 && (
              <div className="bg-white shadow rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {t('total_alerts')}: <span className="text-blue-600 font-bold">{breakComplianceTotal}</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    {breakComplianceStatus === 'pending' && t('pending_resolution')}
                    {breakComplianceStatus === 'resolved' && t('already_resolved')}
                    {breakComplianceStatus === 'all' && t('all_alerts')}
                  </span>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" text={t('loading')} />
              </div>
            ) : breakComplianceData.length > 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('employee')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('violation_date')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('deficit')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('severity')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('resolved_by')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {breakComplianceData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.employee_name}</div>
                          <div className="text-xs text-gray-500">{item.employee_code || item.employee_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.violation_date ? formatDate(item.violation_date) : <span className="text-red-600">{t('invalid_date')}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-red-700">
                            {item.deficit_minutes ?? 0} {t('minutes')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              item.severity === 'high'
                                ? 'bg-red-100 text-red-800'
                                : item.severity === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {item.severity === 'high' ? t('high') : item.severity === 'medium' ? t('medium') : t('low')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              item.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {item.status === 'pending' ? t('pending') : t('resolved')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.resolved_by ? (
                            <div className="text-sm text-gray-900">{item.resolved_by}</div>
                          ) : (
                            <div className="text-sm text-gray-400">-</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.status === 'pending' && (
                            <button
                              onClick={() => handleOpenResolveModal(item)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              {t('resolve')}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-12 text-center">
                <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">{t('no_alerts_available', { status: '' })}</p>
                <p className="text-sm text-gray-400 mt-2">{t('click_load_alerts')}</p>
              </div>
            )}
          </div>
        )}

        {/* Sick Leave Documents Tab */}
        {activeTab === 'sick-leave-documents' && (
          <div className="space-y-4">
            <div className="bg-white shadow rounded-xl p-6 border border-gray-200">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('employee')}
                    </label>
                    <select
                      value={documentsEmployeeId}
                      onChange={(e) => setDocumentsEmployeeId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">{t('all_employees')}</option>
                      {documentsEmployees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name} - {emp.employee_code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('start_date')}</label>
                    <input
                      type="date"
                      value={documentsStartDate}
                      onChange={(e) => setDocumentsStartDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('end_date')}</label>
                    <input
                      type="date"
                      value={documentsEndDate}
                      onChange={(e) => setDocumentsEndDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <button
                  onClick={handleLoadSickLeaveDocuments}
                  disabled={documentsLoading}
                  className="inline-flex items-center justify-center px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow hover:bg-blue-700 disabled:opacity-50"
                >
                  {documentsLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">{t('loading')}</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      {t('load_documents')}
                    </>
                  )}
                </button>
              </div>
            </div>

            {documentsLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" text={t('loading')} />
              </div>
            ) : sickLeaveDocuments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sickLeaveDocuments.map((doc) => {
                  const employee = documentsEmployees.find((emp) => emp.id === doc.employee_id);
                  const createdAt = doc.created_at ? new Date(doc.created_at) : null;
                  const formattedDate = createdAt
                    ? createdAt.toLocaleDateString(locale, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '';
                  const defaultNameRaw = t('sick_leave_default_document_name', { date: formattedDate });
                  const defaultName =
                    defaultNameRaw === 'sick_leave_default_document_name'
                      ? `${language === 'es' ? 'Constancia médica' : 'Medical certificate'} ${formattedDate}`.trim()
                      : defaultNameRaw;
                  const employeeName = employee
                    ? `${employee.first_name} ${employee.last_name}`
                    : doc.employee_code || doc.employee_id;
                  const employeeCode = employee?.employee_code || doc.employee_code;
                  const documentTitle = doc.document_name && doc.document_name !== 'sick_leave_default_document_name'
                    ? doc.document_name
                    : defaultName || translateOrFallback('document_without_name', 'Sick leave document');
                  const badgeText = translateOrFallback('sick_leave_receipt_tag', 'Sick Leave');
 
                   return (
                     <div
                       key={doc.id}
                       className="bg-white shadow-md border border-gray-200 rounded-xl p-5 flex flex-col gap-4 hover:shadow-lg transition-shadow"
                     >
                       <div className="flex items-start justify-between">
                         <div>
                           <h3 className="text-lg font-semibold text-gray-900">
                             {documentTitle}
                           </h3>
                           {doc.document_filename && (
                             <p className="text-xs text-gray-500 mt-1">{doc.document_filename}</p>
                           )}
                           <div className="text-sm text-gray-600 mt-2">
                             {employeeName}
                             {employeeCode && (
                               <span className="text-xs text-gray-400 ml-2">{employeeCode}</span>
                             )}
                           </div>
                         </div>
                         <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                           {badgeText}
                         </span>
                       </div>
 
                       <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 space-y-2">
                         <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                           {t('sick_leave_document_info')}
                         </p>
                         <div className="grid grid-cols-1 gap-2">
                           <div>
                             <p className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-2">
                               <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                               {t('employee')}
                             </p>
                             <p className="text-sm font-medium text-gray-900">{employeeName}</p>
                             {employeeCode && (
                               <p className="text-xs text-gray-500">{employeeCode}</p>
                             )}
                           </div>
                           <div>
                             <p className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-2">
                               <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                               {t('usage_id')}
                             </p>
                             <p className="text-xs font-mono text-gray-600 break-all">
                               {doc.sick_leave_usage_id}
                             </p>
                           </div>
                           <div>
                             <p className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-2">
                               <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                               {t('uploaded_at')}
                             </p>
                             <p className="text-sm text-gray-800">
                               {doc.created_at ? formatDateTime(doc.created_at) : '-'}
                             </p>
                           </div>
                           {doc.uploaded_by && (
                             <div>
                               <p className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-2">
                                 <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                 {t('uploaded_by')}
                               </p>
                               <p className="text-sm text-gray-800">{doc.uploaded_by}</p>
                             </div>
                           )}
                         </div>
                       </div>
 
                       <button
                         onClick={() => handleDownloadSickLeaveDocument(doc)}
                         className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700"
                       >
                         <Download className="w-4 h-4 mr-2" />
                         {t('download_document')}
                       </button>
                     </div>
                   );
                 })}
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-12 text-center text-gray-500">
                {t('no_documents_found')}
              </div>
            )}
          </div>
        )}

        {/* Payroll Documents Tab */}
        {activeTab === 'payroll-documents' && (
          <div className="space-y-4">
            <div className="bg-white shadow rounded-xl p-6 border border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{t('payroll_documents_title')}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('payroll_documents_description')}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100">
                  <Download className="w-4 h-4" />
                  <span>{t('load_payroll_documents_hint')}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('employee')}
                  </label>
                  <select
                    value={payrollDocumentsEmployeeId}
                    onChange={(e) => setPayrollDocumentsEmployeeId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">{t('all_employees')}</option>
                    {documentsEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} - {emp.employee_code}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('payroll_document_payroll_id')}</label>
                  <input
                    type="text"
                    value={payrollDocumentsPayrollId}
                    onChange={(e) => setPayrollDocumentsPayrollId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="550e8400-e29b-41d4-a716-446655440000"
                  />
                </div>
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('start_date')}</label>
                  <input
                    type="date"
                    value={payrollDocumentsStartDate}
                    onChange={(e) => setPayrollDocumentsStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('end_date')}</label>
                  <input
                    type="date"
                    value={payrollDocumentsEndDate}
                    onChange={(e) => setPayrollDocumentsEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('results_limit')}</label>
                  <input
                    type="number"
                    min={1}
                    value={payrollDocumentsLimit}
                    onChange={(e) => setPayrollDocumentsLimit(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleLoadPayrollDocuments}
                  disabled={payrollDocumentsLoading}
                  className="inline-flex items-center justify-center px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {payrollDocumentsLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">{t('loading')}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      {t('load_payroll_documents')}
                    </>
                  )}
                </button>
              </div>
            </div>

            {payrollDocumentsLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" text={t('loading')} />
              </div>
            ) : payrollDocuments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {payrollDocuments.map((doc) => {
                  const employee = documentsEmployees.find((emp) => emp.id === doc.employee_id);
                  const employeeName =
                    employee ? `${employee.first_name} ${employee.last_name}` : doc.employee_name || doc.employee_code || doc.employee_id || '-';
                  const employeeCode = employee?.employee_code || doc.employee_code;
                  const displayName =
                    doc.document_name ||
                    doc.invoice_id ||
                    doc.pdf_filename ||
                    translateOrFallback('payroll_document_default_name', 'Payroll receipt');
                  const uploadedAt = doc.uploaded_at || doc.created_at || doc.signed_at || '';
                  const invoiceDisplay = doc.invoice_id || t('payroll_document_invoice_missing');
                  const hasDirectLink = Boolean(doc.download_url);
                  const sourceLabel = hasDirectLink ? t('payroll_document_source_direct') : t('payroll_document_source_history');
                  const sourceStyles = hasDirectLink
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : 'bg-amber-100 text-amber-700 border-amber-200';
                  const sourceIcon = hasDirectLink ? <Link className="w-3.5 h-3.5" /> : <Server className="w-3.5 h-3.5" />;
                  let periodDisplay = '-';
                  if (doc.period_start && doc.period_end) {
                    periodDisplay = `${formatDateOnly(doc.period_start)} → ${formatDateOnly(doc.period_end)}`;
                  } else if (doc.period_start) {
                    periodDisplay = formatDateOnly(doc.period_start);
                  } else if (doc.period_end) {
                    periodDisplay = formatDateOnly(doc.period_end);
                  }
                  const uploadedBy = doc.uploaded_by || '-';

                  return (
                    <div
                      key={`${doc.id || doc.pdf_filename}`}
                      className="bg-white shadow-md border border-gray-200 rounded-xl p-5 flex flex-col gap-4 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                            {t('payroll_document_name')}
                          </p>
                          <h3 className="text-lg font-semibold text-gray-900">{displayName}</h3>
                          {doc.pdf_filename && <p className="text-xs text-gray-500 mt-1 font-mono">{doc.pdf_filename}</p>}
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${sourceStyles}`}>
                          {sourceIcon}
                          {sourceLabel}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold">{t('employee')}</p>
                          <p className="text-sm font-medium text-gray-900">{employeeName}</p>
                          {employeeCode && <p className="text-xs text-gray-500">{employeeCode}</p>}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold">{t('payroll_document_payroll_id_short')}</p>
                          <p className="text-xs font-mono text-gray-700 break-all">{doc.payroll_id || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold">{t('payroll_document_invoice_id')}</p>
                          <p className="text-sm text-gray-800 break-words">{invoiceDisplay}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold">{t('payroll_document_period_label')}</p>
                          <p className="text-sm text-gray-800">{periodDisplay}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold">{t('uploaded_at')}</p>
                          <p className="text-sm text-gray-800">{uploadedAt ? formatDateTime(uploadedAt) : '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold">{t('uploaded_by')}</p>
                          <p className="text-sm text-gray-800 break-words">{uploadedBy}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end border-t border-gray-100 pt-4">
                        <button
                          onClick={() => handleDownloadPayrollDocument(doc)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          {t('download_document')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-12 text-center text-gray-500">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium">{t('no_payroll_documents')}</p>
                <p className="text-sm text-gray-400 mt-2">{t('load_payroll_documents_hint')}</p>
              </div>
            )}
          </div>
        )}

        {/* Modal para Resolver Alerta */}
        {resolvingAlert && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{t('resolve_alert_title')}</h3>
                <button onClick={handleCloseResolveModal} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <div className="bg-gray-50 p-3 rounded-md mb-4">
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">{t('employee')}:</span> {resolvingAlert.employee_name}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">{t('date')}:</span>{' '}
                    {resolvingAlert.violation_date ? formatDate(resolvingAlert.violation_date) : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{t('deficit')}:</span> {resolvingAlert.deficit_minutes ?? 0} {t('minutes')}
                  </p>
                </div>

                <label htmlFor="resolution_notes" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('resolution_notes')} *
                </label>
                <textarea
                  id="resolution_notes"
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder={t('resolution_notes_placeholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">{t('describe_action')}</p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseResolveModal}
                  disabled={resolving}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleResolveAlert}
                  disabled={resolving || !resolutionNotes.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {resolving ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-2">{t('resolving')}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {t('mark_as_resolved')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Reports;