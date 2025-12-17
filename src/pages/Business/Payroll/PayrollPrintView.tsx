import React, { useState, useEffect, useRef, ChangeEvent, useMemo } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import payrollService from '../../../services/payroll.service';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import { Printer, ArrowLeft, Building2, PenTool } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { signaturesService } from '../../../services/signatures.service';
import { pdfService } from '../../../services/pdf.service';
import employeeService from '../../../services/employee.service';
import { Calendar } from 'lucide-react';
import { UploadSignedPayrollResponse } from '../../../types';

interface EmployeeSignature {
  employeeId: string;
  signatureData: string | null;
  pdfFilename: string | null;
  isSigned: boolean;
  signedPdfFilename?: string | null;
  signedPdfUrl?: string | null;
  invoiceId?: string | null;
}

const PayrollPrintView: React.FC = () => {
  const { payrollId } = useParams<{ payrollId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const [payrollData, setPayrollData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [signatures, setSignatures] = useState<Record<string, EmployeeSignature>>({});
  const [signingInProgress, setSigningInProgress] = useState<string | null>(null);
  const signatureRefs = useRef<Record<string, any>>({});
  const employeePdfRef = useRef<HTMLDivElement | null>(null);
  const [employeeTimeEntries, setEmployeeTimeEntries] = useState<Record<string, any[]>>({});
  const [employeeDaysWorked, setEmployeeDaysWorked] = useState<Record<string, number>>({});
  const [invoiceIds, setInvoiceIds] = useState<Record<string, string>>({});
  const [selectedSignedFiles, setSelectedSignedFiles] = useState<Record<string, File | null>>({});
  const [uploadingSignedPdf, setUploadingSignedPdf] = useState<Record<string, boolean>>({});
  const [uploadedSignedPdfs, setUploadedSignedPdfs] = useState<Record<string, UploadSignedPayrollResponse | null>>({});
  const [activeEmployeeIndex, setActiveEmployeeIndex] = useState(0);
  const [employeePaymentInfo, setEmployeePaymentInfo] = useState<Record<string, { payment_method?: string; bank_account_number?: string; bank_routing_number?: string }>>({});

  const locale = language === 'es' ? 'es-ES' : 'en-US';

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }),
    [locale]
  );

  const hoursFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale]
  );

  const formatCurrencyValue = (value: number) => currencyFormatter.format(Number.isFinite(value) ? value : 0);
  const formatHoursValue = (value: number) => hoursFormatter.format(Number.isFinite(value) ? value : 0);
  const formatDateOnly = (value: string) =>
    value
      ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
      : '-';

  const parseNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }
    const normalized = typeof value === 'string' ? value.replace(/,/g, '') : String(value);
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const slugify = (value?: string) => {
    if (!value) {
      return '';
    }
    return value
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const generateDefaultInvoiceId = (payrollInfo: any, employeeCode?: string, employeeId?: string) => {
    const datePart = slugify(payrollInfo?.period_end || payrollInfo?.period_start || new Date().toISOString().split('T')[0]);
    const codePart = slugify(employeeCode) || slugify(employeeId) || 'empleado';
    return `payroll-${datePart}-${codePart}`;
  };

  useEffect(() => {
    loadPayrollData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payrollId]);

  const loadPayrollData = async () => {
    try {
      if (!payrollId) return;
      const data = await payrollService.getPayrollById(payrollId);
      setPayrollData(data);
      setActiveEmployeeIndex(0);

      // Cargar PDFs y firmas existentes
      await loadEmployeeSignatures(data.calculations, data.payroll);
      
      // Cargar time entries para cada empleado
      if (data.calculations && data.payroll?.period_start && data.payroll?.period_end) {
        await loadEmployeeTimeEntries(data.calculations, data.payroll.period_start, data.payroll.period_end);
      }
      
      // Cargar información de pago de cada empleado
      await loadEmployeePaymentInfo(data.calculations);
    } catch (error) {
      console.error('Error cargando nómina:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeTimeEntries = async (calculations: any[], startDate: string, endDate: string) => {
    const timeEntriesMap: Record<string, any[]> = {};
    
    for (const calc of calculations) {
      try {
        // Usar el endpoint del backend que calcula correctamente el desglose diario
        const breakdownData = await payrollService.getEmployeeDailyBreakdown(
          calc.employee_id,
          startDate,
          endDate
        );
        
        if (breakdownData && breakdownData.daily_breakdown) {
          // Transformar los datos del backend al formato esperado por el frontend
          const processedEntries = breakdownData.daily_breakdown.map((day: any) => ({
            date: day.date,
            checkIn: day.check_in || '',
            checkOut: day.check_out || '',
            breaks: day.breaks_formatted || '',
            hoursWorked: typeof day.hours_worked === 'number' ? day.hours_worked.toFixed(2) : parseFloat(day.hours_worked || 0).toFixed(2),
            dayName: day.day_name || '',
          }));
          
          timeEntriesMap[calc.employee_id] = processedEntries;
          
          // Guardar días trabajados del backend
          setEmployeeDaysWorked((prev) => ({
            ...prev,
            [calc.employee_id]: breakdownData.days_worked || 0
          }));
        } else {
          timeEntriesMap[calc.employee_id] = [];
        }
      } catch (error) {
        console.error(`Error cargando daily breakdown para empleado ${calc.employee_id}:`, error);
        // Fallback: intentar con el método anterior si el nuevo falla
        try {
          const entries = await employeeService.listTimeEntries(calc.employee_id, startDate, endDate);
          const entriesArray = Array.isArray(entries) ? entries : [];
          const processedEntries = processTimeEntriesByDay(entriesArray);
          timeEntriesMap[calc.employee_id] = processedEntries;
        } catch (fallbackError) {
          console.error(`Error en fallback para empleado ${calc.employee_id}:`, fallbackError);
          timeEntriesMap[calc.employee_id] = [];
        }
      }
    }
    
    setEmployeeTimeEntries(timeEntriesMap);
  };

  const loadEmployeePaymentInfo = async (calculations: any[]) => {
    const paymentInfoMap: Record<string, { payment_method?: string; bank_account_number?: string; bank_routing_number?: string }> = {};
    
    for (const calc of calculations) {
      try {
        const employee = await employeeService.getEmployeeById(calc.employee_id);
        if (employee) {
          paymentInfoMap[calc.employee_id] = {
            payment_method: employee.payment_method,
            bank_account_number: employee.bank_account_number,
            bank_routing_number: employee.bank_routing_number,
          };
        }
      } catch (error) {
        console.error(`Error cargando información de pago para empleado ${calc.employee_id}:`, error);
      }
    }
    
    setEmployeePaymentInfo(paymentInfoMap);
  };

  const processTimeEntriesByDay = (entries: any[]) => {
    // Agrupar por fecha
    const groupedByDate: Record<string, any[]> = {};
    
    entries.forEach((entry) => {
      const dateKey = entry.record_time ? entry.record_time.split('T')[0] : entry.timestamp?.split('T')[0];
      if (dateKey) {
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = [];
        }
        groupedByDate[dateKey].push(entry);
      }
    });

    // Procesar cada día
    const dailySummary = Object.entries(groupedByDate).map(([date, dayEntries]) => {
      // Ordenar por hora
      const sorted = dayEntries.sort((a, b) => {
        const timeA = a.record_time || a.timestamp || '';
        const timeB = b.record_time || b.timestamp || '';
        return timeA.localeCompare(timeB);
      });

      // Identificar check-in, check-out y breaks
      let checkIn = '';
      let checkOut = '';
      const breaks: string[] = [];
      let breakStart = '';

      sorted.forEach((entry) => {
        const time = entry.record_time || entry.timestamp || '';
        const timeStr = time.split('T')[1]?.substring(0, 5) || '';
        
        if (entry.record_type === 'check_in') {
          checkIn = timeStr;
        } else if (entry.record_type === 'check_out') {
          checkOut = timeStr;
        } else if (entry.record_type === 'break_start') {
          breakStart = timeStr;
        } else if (entry.record_type === 'break_end' && breakStart) {
          breaks.push(`${breakStart} - ${timeStr}`);
          breakStart = '';
        }
      });

      // Calcular horas trabajadas
      let hoursWorked = 0;
      if (checkIn && checkOut) {
        const start = new Date(`${date}T${checkIn}`);
        let end = new Date(`${date}T${checkOut}`);
        
        // Si check-out es antes que check-in, asumir que es al día siguiente
        if (end <= start) {
          end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
        }
        
        const diffMs = end.getTime() - start.getTime();
        hoursWorked = diffMs / (1000 * 60 * 60);
        
        // Restar tiempo de breaks (asumir 30 min por break si no hay info detallada)
        const breakMinutes = breaks.length * 30;
        hoursWorked -= breakMinutes / 60;
        hoursWorked = Math.max(0, hoursWorked);
      }

      return {
        date,
        checkIn,
        checkOut,
        breaks: breaks.length > 0 ? breaks.join(', ') : (breakStart ? `${breakStart} - ...` : ''),
        hoursWorked: hoursWorked.toFixed(2),
      };
    });

    // Ordenar por fecha
    return dailySummary.sort((a, b) => a.date.localeCompare(b.date));
  };

  const SHOW_SIGNED_PDF_UPLOAD_UI = false;

  const loadEmployeeSignatures = async (calculations: any[], payrollInfo?: any) => {
    if (!payrollId) return;

    try {
      // Obtener PDFs de esta nómina
      const pdfData = await pdfService.getPDFHistory(undefined, payrollId, 100);
      let pdfArray: any[] = [];
      if (Array.isArray(pdfData)) {
        pdfArray = pdfData;
      } else if (pdfData && typeof pdfData === 'object') {
        const pdfObj = pdfData as any;
        pdfArray = pdfObj.items || pdfObj.data || pdfObj.results || [];
      }
      const signaturesMap: Record<string, EmployeeSignature> = {};
      const invoiceMap: Record<string, string> = {};
      const uploadedMap: Record<string, UploadSignedPayrollResponse | null> = {};

      for (const calc of calculations) {
        const employeeId = calc.employee_id;

        // Buscar PDF específico para este empleado
        const employeePdf = pdfArray.find((pdf: any) =>
          pdf.employee_id === employeeId
        );
        const invoiceId = employeePdf?.invoice_id || generateDefaultInvoiceId(payrollInfo, calc.employee_code, employeeId);
        invoiceMap[employeeId] = invoiceId;

        const signedPdfFilename = employeePdf?.signed_pdf_filename || employeePdf?.pdf_filename || null;
        const signedPdfUrl = employeePdf?.signed_pdf_url || employeePdf?.signed_pdf_path || employeePdf?.pdf_url || employeePdf?.file_url || null;

        if (signedPdfFilename || signedPdfUrl) {
          uploadedMap[employeeId] = {
            ...(employeePdf as UploadSignedPayrollResponse),
            signed_pdf_filename: signedPdfFilename ?? undefined,
            signed_pdf_url: signedPdfUrl ?? undefined,
            invoice_id: invoiceId,
          };
        } else {
          uploadedMap[employeeId] = null;
        }

        if (employeePdf && employeePdf.pdf_filename) {
          try {
            // Verificar si existe firma para este PDF
            const signature = await signaturesService.getPDFSignature(employeePdf.pdf_filename);
            signaturesMap[employeeId] = {
              employeeId,
              signatureData: signature.signature_data,
              pdfFilename: employeePdf.pdf_filename,
              isSigned: true,
              signedPdfFilename,
              signedPdfUrl,
              invoiceId,
            };
          } catch (error: any) {
            // Si no hay firma (404), inicializar como no firmado
            signaturesMap[employeeId] = {
              employeeId,
              signatureData: null,
              pdfFilename: employeePdf.pdf_filename,
              isSigned: false,
              signedPdfFilename,
              signedPdfUrl,
              invoiceId,
            };
          }
        } else {
          // No hay PDF para este empleado aún
          signaturesMap[employeeId] = {
            employeeId,
            signatureData: null,
            pdfFilename: null,
            isSigned: false,
            signedPdfFilename: null,
            signedPdfUrl: null,
            invoiceId,
          };
        }
      }

      // Consultar firmas existentes (backend o IndexedDB)
      const signaturesByEmployee = await Promise.all(
        calculations.map(async (calc) => {
          try {
            const employeeSignatures = await signaturesService.getEmployeeSignatures(calc.employee_id);
            return {
              employeeId: calc.employee_id,
              signatures: Array.isArray(employeeSignatures) ? employeeSignatures : [],
            };
          } catch (error) {
            console.warn(`Error obteniendo firmas para empleado ${calc.employee_id}:`, error);
            return {
              employeeId: calc.employee_id,
              signatures: [],
            };
          }
        })
      );

      signaturesByEmployee.forEach(({ employeeId, signatures: employeeSignaturesList }) => {
        if (!employeeSignaturesList || employeeSignaturesList.length === 0) {
          return;
        }

        const matchingSignature = employeeSignaturesList.find((signature) => {
          if (!signature) return false;
          if (signature.payroll_id && signature.payroll_id === payrollId) return true;
          const signaturePayrollMetadata = signature.signature_metadata?.payroll_id;
          if (signaturePayrollMetadata && signaturePayrollMetadata === payrollId) return true;
          if (payrollId && signature.payroll_pdf_id?.includes(payrollId)) return true;
          return false;
        });

        if (!matchingSignature) {
          return;
        }

        const invoiceFromSignature =
          matchingSignature.invoice_id ||
          matchingSignature.signature_metadata?.invoice_id ||
          invoiceMap[employeeId] ||
          generateDefaultInvoiceId(payrollInfo, calculations.find((calc) => calc.employee_id === employeeId)?.employee_code, employeeId);

        invoiceMap[employeeId] = invoiceFromSignature;

        const currentSignature = signaturesMap[employeeId] || {
          employeeId,
          signatureData: null,
          pdfFilename: null,
          isSigned: false,
          signedPdfFilename: null,
          signedPdfUrl: null,
          invoiceId: invoiceFromSignature,
        };

        signaturesMap[employeeId] = {
          ...currentSignature,
          employeeId,
          signatureData: matchingSignature.signature_data,
          pdfFilename: matchingSignature.payroll_pdf_id || currentSignature.pdfFilename,
          isSigned: true,
          invoiceId: invoiceFromSignature,
          signedPdfFilename: currentSignature.signedPdfFilename || matchingSignature.payroll_pdf_id || null,
          signedPdfUrl: currentSignature.signedPdfUrl || null,
        };
      });

      setSignatures(signaturesMap);
      setInvoiceIds((prev) => {
        const merged: Record<string, string> = { ...invoiceMap };
        Object.keys(prev).forEach((key) => {
          if (prev[key]) {
            merged[key] = prev[key];
          }
        });
        return merged;
      });
      setUploadedSignedPdfs(uploadedMap);
      setSelectedSignedFiles({});
    } catch (error) {
      console.error('Error cargando firmas:', error);
    }
  };

  const handleInvoiceChange = (employeeId: string, value: string) => {
    setInvoiceIds((prev) => ({
      ...prev,
      [employeeId]: value,
    }));
  };

  const handleSignedPdfFileChange = (employeeId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (file && file.type !== 'application/pdf') {
      showToast(t('signed_pdf_only'), 'error');
      event.target.value = '';
      return;
    }

    setSelectedSignedFiles((prev) => ({
      ...prev,
      [employeeId]: file,
    }));
  };

  const handleUploadSignedPdf = async (employeeId: string, employeeCode: string) => {
    if (!payrollId) {
      showToast(t('error_no_payroll_id'), 'error');
      return;
    }

    if (!signatures[employeeId]?.isSigned) {
      showToast(t('signed_pdf_requires_signature'), 'error');
      return;
    }

    const selectedFile = selectedSignedFiles[employeeId];
    if (!selectedFile) {
      showToast(t('signed_pdf_select_file_first'), 'error');
      return;
    }

    const invoiceId = (invoiceIds[employeeId] || '').trim();
    if (!invoiceId) {
      showToast(t('signed_pdf_missing_invoice'), 'error');
      return;
    }

    try {
      setUploadingSignedPdf((prev) => ({
        ...prev,
        [employeeId]: true,
      }));

      const response = await pdfService.uploadSignedPayrollPDF({
        payroll_id: payrollId,
        employee_id: employeeId,
        invoice_id: invoiceId,
        file: selectedFile,
      });

      setUploadedSignedPdfs((prev) => ({
        ...prev,
        [employeeId]: response,
      }));

      setSignatures((prev) => ({
        ...prev,
        [employeeId]: {
          ...(prev[employeeId] || { employeeId }),
          employeeId,
          signatureData: prev[employeeId]?.signatureData ?? null,
          pdfFilename: prev[employeeId]?.pdfFilename ?? response.pdf_filename ?? null,
          isSigned: true,
          signedPdfFilename: response.signed_pdf_filename || response.pdf_filename || selectedFile.name,
          signedPdfUrl:
            response.signed_pdf_url || (response as any).file_url || (response as any).url || prev[employeeId]?.signedPdfUrl || null,
          invoiceId,
        },
      }));

      setSelectedSignedFiles((prev) => ({
        ...prev,
        [employeeId]: null,
      }));

      showToast(t('signed_pdf_uploaded_success', { code: employeeCode }), 'success');
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setUploadingSignedPdf((prev) => ({
        ...prev,
        [employeeId]: false,
      }));
    }
  };

  const generateAndUploadSignedPdf = async (
    employeeId: string,
    employeeCode: string,
    invoiceId: string,
    fallbackPdfFilename: string | null
  ) => {
    if (!payrollId) {
      return;
    }

    const element = employeePdfRef.current;
    if (!element) {
      console.warn(`No se encontró el contenedor del comprobante para ${employeeId}`);
      return;
    }

    try {
      setUploadingSignedPdf((prev) => ({
        ...prev,
        [employeeId]: true,
      }));

      // Esperar a que React renderice la firma como imagen
      await new Promise((resolve) => setTimeout(resolve, 350));

      const canvas = await html2canvas(element, {
        scale: Math.min(Math.max(window.devicePixelRatio, 1), 1.2),
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const pdfBlob = pdf.output('blob');
      const baseName = invoiceId || fallbackPdfFilename || `${payrollId}_${employeeCode}`;
      const normalizedFileName = `${baseName.replace(/[^a-z\d\-_.]/gi, '_')}.pdf`;
      const pdfFile = new File([pdfBlob], normalizedFileName, { type: 'application/pdf' });

      const response = await pdfService.uploadSignedPayrollPDF({
        payroll_id: payrollId,
        employee_id: employeeId,
        invoice_id: invoiceId,
        file: pdfFile,
      });

      setUploadedSignedPdfs((prev) => ({
        ...prev,
        [employeeId]: response,
      }));

      setSignatures((prev) => ({
        ...prev,
        [employeeId]: {
          ...(prev[employeeId] || { employeeId }),
          employeeId,
          signatureData: prev[employeeId]?.signatureData || null,
          pdfFilename: prev[employeeId]?.pdfFilename || fallbackPdfFilename,
          isSigned: true,
          signedPdfFilename: response.signed_pdf_filename || response.pdf_filename || normalizedFileName,
          signedPdfUrl:
            response.signed_pdf_url || (response as any)?.file_url || (response as any)?.url || prev[employeeId]?.signedPdfUrl || null,
          invoiceId,
        },
      }));

      showToast(t('signed_pdf_uploaded_success', { code: employeeCode }), 'success');
    } catch (error: any) {
      console.error('Error generando o subiendo el PDF firmado:', error);
      if (error?.response?.data) {
        console.error('Respuesta del backend (upload PDF):', error.response.data);
      }
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setUploadingSignedPdf((prev) => ({
        ...prev,
        [employeeId]: false,
      }));
    }
  };

  const handleSignEmployee = async (employeeId: string, employeeCode: string) => {
    const sigPad = signatureRefs.current[employeeId];

    if (!sigPad || sigPad.isEmpty()) {
      showToast(t('please_draw_signature'), 'error');
      return;
    }

    if (!payrollId) {
      showToast(t('error_no_payroll_id'), 'error');
      return;
    }

    setSigningInProgress(employeeId);

    try {
      const signatureData = sigPad.toDataURL();
      const metadata = signaturesService.getSignatureMetadata();

      const existingInvoice = invoiceIds[employeeId];
      const generatedInvoiceDefault = generateDefaultInvoiceId(payrollData?.payroll, employeeCode, employeeId);
      const invoiceId = (existingInvoice && existingInvoice.trim()) || generatedInvoiceDefault;

      // Paso 1: Buscar si ya existe un PDF generado para este empleado
      let pdfFilename = signatures[employeeId]?.pdfFilename;

      if (!pdfFilename) {
        try {
          // Buscar en el historial de PDFs
          const pdfHistory = await pdfService.getPDFHistory(employeeId, payrollId, 10);
          const employeePdf = pdfHistory.find((pdf: any) => 
            pdf.employee_id === employeeId && pdf.payroll_id === payrollId
          );
          
          if (employeePdf?.pdf_filename) {
            pdfFilename = employeePdf.pdf_filename;
          }
        } catch (error) {
          console.log('Error buscando PDF existente:', error);
        }
      }

      // Paso 2: Si no existe PDF, generarlo primero
      if (!pdfFilename) {
        try {
          showToast(t('generating_pdf_receipt'), 'info');
          const pdfResponse = await pdfService.generateDetailedPDF({
            payroll_id: payrollId,
            employee_id: employeeId,
            include_time_details: true,
            include_deductions_breakdown: true,
            include_tip_credit_calculation: true,
          });
          pdfFilename = pdfResponse.pdf_filename;
        } catch (error: any) {
          // Si falla la generación del PDF, intentar crear uno local
          console.warn('No se pudo generar PDF en el backend, usando nombre local:', error);
          const timestamp = new Date().getTime();
          pdfFilename = `local_payroll_${payrollId}_emp_${employeeCode}_${timestamp}.pdf`;
        }
      }

      // Obtener tenant_id del usuario actual si está disponible
      const businessData = user as any;
      const tenantId = businessData?.tenant_id || '';

      // Paso 3: Firmar el documento usando el pdf_filename
      const signature = await signaturesService.signDocument({
        payroll_pdf_id: pdfFilename,
        signature_type: 'drawn',
        signature_data: signatureData,
        signature_metadata: {
          ...metadata,
          employee_id: employeeId,
          tenant_id: tenantId,
          payroll_id: payrollId,
          invoice_id: invoiceId,
        },
      });

      // Actualizar estado local
      setSignatures(prev => ({
        ...prev,
        [employeeId]: {
          ...(prev[employeeId] || { employeeId }),
          employeeId,
          signatureData,
          pdfFilename,
          isSigned: true,
          invoiceId,
          signedPdfFilename: prev[employeeId]?.signedPdfFilename || pdfFilename,
        },
      }));

      setInvoiceIds((prev) => ({
        ...prev,
        [employeeId]: invoiceId,
      }));

      await generateAndUploadSignedPdf(employeeId, employeeCode, invoiceId, pdfFilename);

      // Verificar si se guardó en IndexedDB (backend no disponible)
      if (signature.id?.startsWith('local_')) {
        showToast(t('receipt_signed_locally', { code: employeeCode }), 'success');
      } else {
        showToast(t('receipt_signed_successfully_payroll', { code: employeeCode }), 'success');
      }
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setSigningInProgress(null);
    }
  };

  const clearSignature = (employeeId: string) => {
    const sigPad = signatureRefs.current[employeeId];
    if (sigPad) {
      sigPad.clear();
    }
  };

  // Obtener datos de la empresa
  const businessData = user as any;
  const companyName = businessData?.company_name || 'Empresa';
  const businessAddress = businessData?.address || '';
  const businessPhone = businessData?.phone || '';
  const businessEmail = businessData?.email || '';
  const businessRfc = businessData?.rfc || '';

  const handlePrint = () => {
    window.print();
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!payrollId) return;
    
    setUpdatingStatus(true);
    try {
      await payrollService.updatePayrollStatus(payrollId, newStatus as 'draft' | 'calculated' | 'approved' | 'paid');
      showToast(t('payroll_status_updated'), 'success');
      // Recargar los datos
      await loadPayrollData();
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      draft: 'bg-gray-100 text-gray-800',
      calculated: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const calculations = payrollData?.calculations ?? [];
  const calcLength = calculations.length;
  const safeActiveIndex = calcLength > 0 ? Math.min(activeEmployeeIndex, calcLength - 1) : 0;
  const activeCalculation = calcLength > 0 ? calculations[safeActiveIndex] : null;
  const totalEmployees = calcLength;

  useEffect(() => {
    if (calcLength === 0) {
      return;
    }
    if (activeEmployeeIndex >= calcLength) {
      setActiveEmployeeIndex(0);
    }
  }, [calcLength, activeEmployeeIndex]);

  const handleEmployeeNavigation = (direction: 'prev' | 'next') => {
    if (!calculations || calculations.length === 0) return;
    setActiveEmployeeIndex((prevIndex) => {
      if (direction === 'prev') {
        return prevIndex <= 0 ? calculations.length - 1 : prevIndex - 1;
      }
      return prevIndex >= calculations.length - 1 ? 0 : prevIndex + 1;
    });
  };

  const handleEmployeeSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    const newIndex = Number(event.target.value);
    if (!Number.isNaN(newIndex)) {
      setActiveEmployeeIndex(newIndex);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text={t('loading_payroll')} />
      </div>
    );
  }

  if (!payrollData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl">{t('payroll_not_found')}</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">
            {t('back')}
          </button>
        </div>
      </div>
    );
  }

  const { payroll } = payrollData;

  const fallbackFoodGiftCredit = calculations.reduce((sum: number, calc: any) => sum + parseNumber(calc.food_gift_credit), 0);
  const fallbackPaidSickLeaveHours = calculations.reduce((sum: number, calc: any) => sum + parseNumber(calc.paid_sick_leave_hours), 0);
  const fallbackPaidSickLeaveAmount = calculations.reduce((sum: number, calc: any) => sum + parseNumber(calc.paid_sick_leave_amount), 0);

  const totalFoodGiftCredit =
    payroll?.total_food_gift_credit !== undefined && payroll?.total_food_gift_credit !== null
      ? parseNumber(payroll.total_food_gift_credit)
      : fallbackFoodGiftCredit;

  const totalPaidSickLeaveHours =
    payroll?.total_paid_sick_leave_hours !== undefined && payroll?.total_paid_sick_leave_hours !== null
      ? parseNumber(payroll.total_paid_sick_leave_hours)
      : fallbackPaidSickLeaveHours;

  const totalPaidSickLeaveAmount =
    payroll?.total_paid_sick_leave_amount !== undefined && payroll?.total_paid_sick_leave_amount !== null
      ? parseNumber(payroll.total_paid_sick_leave_amount)
      : fallbackPaidSickLeaveAmount;

  const sickLeavePayments: any[] = Array.isArray(payrollData?.sick_leave_payments) ? payrollData.sick_leave_payments : [];

  return (
    <>
      {/* Botones de acción - NO se imprimen */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2 items-center">
        <div className="bg-white shadow-lg rounded-lg px-3 py-2 border border-gray-200">
          <label className="text-xs text-gray-600 mr-2">{t('status')}:</label>
          {updatingStatus ? (
            <LoadingSpinner size="sm" />
          ) : (
            <select
              value={payroll.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`px-3 py-1 text-xs rounded-full border-0 font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(payroll.status)}`}
            >
              <option value="draft">{t('draft')}</option>
              <option value="calculated">{t('calculated')}</option>
              <option value="approved">{t('approved')}</option>
              <option value="paid">{t('paid')}</option>
            </select>
          )}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('back')}
        </button>
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          {t('print_save_pdf')}
        </button>
      </div>

      {/* Vista imprimible */}
      <div className="print-container bg-white min-h-screen p-8">
        {/* Header de la empresa - Solo visible en pantalla, no en impresión */}
        <div className="mb-8 pb-6 border-b-2 border-gray-800 no-print">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Building2 className="w-10 h-10 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">{companyName}</h1>
              </div>
              {businessAddress && (
                <p className="text-gray-600 text-sm">{businessAddress}</p>
              )}
              {businessPhone && (
                <p className="text-gray-600 text-sm">📞 {businessPhone}</p>
              )}
              {businessEmail && (
                <p className="text-gray-600 text-sm">📧 {businessEmail}</p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-blue-600 mb-2">{t('payroll_receipt')}</h2>
              <p className="text-sm text-gray-500">ID: {payroll.id.substring(0, 8)}...</p>
              <p className="text-sm text-gray-500">{t('created')}: {new Date(payroll.created_at).toLocaleDateString('en-US')}</p>
            </div>
          </div>
          
          {/* Info del período */}
          <div className="mt-4 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 uppercase">{t('period')}</p>
                <p className="font-semibold">{payroll.period_start} al {payroll.period_end}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">{t('frequency')}</p>
                <p className="font-semibold capitalize">{payroll.pay_frequency}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">{t('status')}</p>
                <p className="font-semibold capitalize">{payroll.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen General - Oculto en impresión para confidencialidad */}
        <div className="mb-8 bg-blue-50 p-6 rounded-lg no-print">
          <h2 className="text-xl font-bold mb-4">{t('general_summary')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-gray-600">{t('total_employees')}</p>
              <p className="text-2xl font-bold">{payroll.total_employees}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('gross_pay')}</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrencyValue(parseNumber(payroll.total_gross_pay))}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('deductions')}</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrencyValue(parseNumber(payroll.total_deductions))}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('net_pay')}</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrencyValue(parseNumber(payroll.total_net_pay))}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('total_food_gift_credit_label')}</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrencyValue(totalFoodGiftCredit)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('total_paid_sick_leave_amount_label')}</p>
              <p className="text-2xl font-bold text-indigo-600">{formatCurrencyValue(totalPaidSickLeaveAmount)}</p>
              <p className="text-xs text-gray-500">
                {t('total_paid_sick_leave_hours_label')}: {formatHoursValue(totalPaidSickLeaveHours)} {t('hrs')}
              </p>
            </div>
          </div>
        </div>

        {/* Detalle por Empleado */}
        {activeCalculation ? (() => {
          const calc = activeCalculation;
          const employeeSignature = signatures[calc.employee_id];
          const invoiceValue = invoiceIds[calc.employee_id] ?? generateDefaultInvoiceId(payroll, calc.employee_code, calc.employee_id);
          const selectedFile = selectedSignedFiles[calc.employee_id] || null;
          const isUploading = uploadingSignedPdf[calc.employee_id] || false;
          const uploadDetails = uploadedSignedPdfs[calc.employee_id] || null;
          const signedPdfFilename = employeeSignature?.signedPdfFilename || uploadDetails?.signed_pdf_filename || null;
          const signedPdfUrl = employeeSignature?.signedPdfUrl || uploadDetails?.signed_pdf_url || null;
          const hasUploadedSignedPdf = Boolean(signedPdfFilename || signedPdfUrl);
          const trimmedInvoice = (invoiceValue || '').trim();
          const foodGiftCredit = parseNumber(calc.food_gift_credit);
          const paidSickLeaveHours = parseNumber(calc.paid_sick_leave_hours);
          const paidSickLeaveAmount = parseNumber(calc.paid_sick_leave_amount);
          const activeSickLeavePayments = sickLeavePayments.filter((payment: any) => {
            const paymentEmployeeId = payment.employee_id || payment.employeeId;
            return paymentEmployeeId === calc.employee_id;
          });
          const totalEmployeeSickLeaveHours = activeSickLeavePayments.reduce(
            (sum, payment) => sum + parseNumber(payment.hours_paid ?? payment.hours ?? payment.paid_hours),
            0
          );
          const showSickLeaveCapWarning = totalEmployeeSickLeaveHours >= 40 || paidSickLeaveHours >= 40;

          return (
            <div key={calc.employee_id} className="mb-8 page-break">
              <div className="no-print mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEmployeeNavigation('prev')}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium"
                  >
                    {t('previous')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEmployeeNavigation('next')}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium"
                  >
                    {t('next')}
                  </button>
                </div>
                <div className="flex-1">
                  <label htmlFor="employee_selector" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('select_employee_label')}
                  </label>
                  <select
                    id="employee_selector"
                    value={safeActiveIndex}
                    onChange={handleEmployeeSelect}
                    className="w-full md:w-72 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    {calculations.map((employee: any, optionIndex: number) => (
                      <option key={employee.employee_id} value={optionIndex}>
                        {employee.employee_code} - {employee.employee_name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('employee_position_indicator', { current: safeActiveIndex + 1, total: totalEmployees })}
                  </p>
                </div>
              </div>

              {/* Header de la empresa - Aparece en cada comprobante */}
              <div className="mb-6 pb-4 border-b-2 border-gray-800">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Building2 className="w-10 h-10 text-blue-600" />
                      <h1 className="text-3xl font-bold text-gray-900">{companyName}</h1>
                    </div>
                    {businessAddress && (
                      <p className="text-gray-600 text-sm">{businessAddress}</p>
                    )}
                    {businessPhone && (
                      <p className="text-gray-600 text-sm">📞 {businessPhone}</p>
                    )}
                    {businessRfc && (
                      <p className="text-gray-600 text-sm">EIN: {businessRfc}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-bold text-blue-600 mb-2">{t('payroll_receipt')}</h2>
                    <p className="text-sm text-gray-500">ID: {payroll.id.substring(0, 8)}...</p>
                    <p className="text-sm text-gray-500">{t('created')}: {new Date(payroll.created_at).toLocaleDateString('en-US')}</p>
                  </div>
                </div>
                
                {/* Info del período */}
                <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">{t('period')}</p>
                      <p className="font-semibold">{payroll.period_start} al {payroll.period_end}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">{t('frequency')}</p>
                      <p className="font-semibold capitalize">{payroll.pay_frequency}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">{t('status')}</p>
                      <p className="font-semibold capitalize">{payroll.status}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="border-2 border-gray-300 rounded-lg p-6"
                ref={(el) => {
                  employeePdfRef.current = el;
                }}
              >
                {/* Header del empleado */}
                <div className="bg-gray-100 -m-6 mb-6 p-4 rounded-t-lg">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold break-words">{calc.employee_name}</h3>
                      <p className="text-gray-600 break-words">{t('payroll_code')}: {calc.employee_code} | {t('payroll_type')}: {calc.employee_type}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-gray-600 whitespace-nowrap">{t('net_pay')}</p>
                      <p className="text-3xl font-bold text-green-600 whitespace-nowrap">${calc.net_pay}</p>
                    </div>
                  </div>
                </div>

                {/* Horas trabajadas */}
                <div className="mb-4">
                  <h4 className="font-semibold text-lg mb-2 border-b pb-1">{t('hours_worked')}</h4>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">{t('regular')}</p>
                      <p className="text-lg font-bold">{calc.regular_hours}h</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('overtime')}</p>
                      <p className="text-lg font-bold">{calc.overtime_hours}h</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('break')}</p>
                      <p className="text-lg font-bold">{calc.break_hours}h</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('days_worked')}</p>
                      <p className="text-lg font-bold">
                        {employeeDaysWorked[calc.employee_id] !== undefined 
                          ? employeeDaysWorked[calc.employee_id] 
                          : (employeeTimeEntries[calc.employee_id] 
                            ? employeeTimeEntries[calc.employee_id].filter((d: any) => d.checkIn && d.checkOut).length 
                            : 0)} {t('days')}
                      </p>
                    </div>
                  </div>

                  {/* Desglose por Día */}
                  {employeeTimeEntries[calc.employee_id] && employeeTimeEntries[calc.employee_id].length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-semibold text-base mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {t('daily_breakdown')}
                      </h5>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse desglose-dia-table">
                          <thead>
                            <tr className="bg-gray-100 border-b">
                              <th className="text-left py-2 px-2 font-semibold text-gray-700">{t('date')}</th>
                              <th className="text-left py-2 px-2 font-semibold text-gray-700">{t('check_in')}</th>
                              <th className="text-left py-2 px-2 font-semibold text-gray-700">{t('break_time')}</th>
                              <th className="text-left py-2 px-2 font-semibold text-gray-700">{t('check_out')}</th>
                              <th className="text-right py-2 px-2 font-semibold text-gray-700">{t('hours')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {employeeTimeEntries[calc.employee_id].map((dayEntry: any, idx: number) => {
                              // Formatear fecha correctamente - usar dayName del backend si está disponible
                              let formattedDate = '';
                              try {
                                // Si tenemos dayName del backend, usarlo directamente
                                if (dayEntry.dayName) {
                                  // Parsear fecha para obtener mes y día
                                  const dateParts = dayEntry.date.split('-');
                                  if (dateParts.length === 3) {
                                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                    const month = parseInt(dateParts[1], 10);
                                    const day = parseInt(dateParts[2], 10);
                                    const dayAbbr = dayEntry.dayName.substring(0, 3);
                                    formattedDate = `${dayAbbr}, ${monthNames[month - 1]} ${day}`;
                                  } else {
                                    formattedDate = dayEntry.date;
                                  }
                                } else {
                                  // Fallback: parsear fecha manualmente sin conversión de timezone
                                  const dateParts = dayEntry.date.split('-');
                                  if (dateParts.length === 3) {
                                    const year = parseInt(dateParts[0], 10);
                                    const month = parseInt(dateParts[1], 10) - 1; // JavaScript months are 0-indexed
                                    const day = parseInt(dateParts[2], 10);
                                    const dateObj = new Date(year, month, day);
                                    formattedDate = dateObj.toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      day: 'numeric',
                                      month: 'short'
                                    });
                                  } else {
                                    formattedDate = dayEntry.date;
                                  }
                                }
                              } catch (e) {
                                formattedDate = dayEntry.date;
                              }
                              
                              return (
                              <tr key={idx} className="border-b border-gray-200">
                                <td className="py-2 px-2">
                                  {formattedDate}
                                </td>
                                <td className="py-2 px-2">
                                  {dayEntry.checkIn ? (
                                    <span className="text-green-700 font-medium">{dayEntry.checkIn}</span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="py-2 px-2">
                                  {dayEntry.breaks ? (
                                    <span className="text-orange-600 text-xs">{dayEntry.breaks}</span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="py-2 px-2">
                                  {dayEntry.checkOut ? (
                                    <span className="text-red-700 font-medium">{dayEntry.checkOut}</span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="py-2 px-2 text-right">
                                  <span className="text-blue-700 font-bold">{dayEntry.hoursWorked}h</span>
                                </td>
                              </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ingresos */}
                <div className="mb-4">
                  <h4 className="font-semibold text-lg mb-2 border-b pb-1">{t('earnings')}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">{t('regular_pay_calc', { hours: calc.regular_hours, rate: `$${calc.hourly_rate}` })}</span>
                      <span className="font-semibold">${calc.regular_pay}</span>
                    </div>
                    {parseFloat(calc.overtime_hours) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">{t('overtime_pay_calc', { hours: calc.overtime_hours, rate: `$${(parseFloat(calc.hourly_rate) * 1.5).toFixed(2)}` })}</span>
                        <span className="font-semibold">${calc.overtime_pay}</span>
                      </div>
                    )}
                    {parseFloat(calc.spread_hours_pay || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">
                          {t('spread_hours_pay')}
                          {calc.spread_hours_hours && calc.spread_hours_rate 
                            ? ` (${calc.spread_hours_hours}h × $${calc.spread_hours_rate})`
                            : ''}
                        </span>
                        <span className="font-semibold">${calc.spread_hours_pay}</span>
                      </div>
                    )}
                    {parseFloat(calc.total_bonus) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">{t('bonuses')}</span>
                        <span className="font-semibold text-green-600">+${calc.total_bonus}</span>
                      </div>
                    )}
                    {parseFloat(calc.tips_reported) > 0 && (
                      <div className="flex justify-between bg-yellow-50 p-2 rounded">
                        <span className="text-gray-700 font-medium">{t('tips_reported_payroll')}</span>
                        <span className="font-bold text-yellow-700">${calc.tips_reported}</span>
                      </div>
                    )}
                    {foodGiftCredit > 0 && (
                      <div className="flex justify-between bg-emerald-50 p-2 rounded">
                        <span className="text-gray-700 font-medium">{t('food_gift_credit_label')}</span>
                        <span className="font-semibold text-emerald-700">{formatCurrencyValue(foodGiftCredit)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t-2 pt-2 mt-2">
                      <span className="font-bold text-lg">{t('gross_pay_total')}</span>
                      <span className="font-bold text-lg text-green-600">${calc.gross_pay}</span>
                    </div>
                  </div>
                </div>

                {(paidSickLeaveAmount > 0 || paidSickLeaveHours > 0) && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-lg mb-2 border-b pb-1">{t('paid_sick_leave_label')}</h4>
                    <div className="flex justify-between">
                      <span className="text-gray-700">{t('paid_sick_leave_amount_label')}</span>
                      <span className="font-semibold text-blue-700">{formatCurrencyValue(paidSickLeaveAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{t('paid_sick_leave_hours_label')}</span>
                      <span>{formatHoursValue(paidSickLeaveHours)} {t('hrs')}</span>
                    </div>
                    {showSickLeaveCapWarning && (
                      <div className="mt-2 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                        {t('paid_sick_leave_cap_warning')}
                      </div>
                    )}
                  </div>
                )}

                {activeSickLeavePayments.length > 0 ? (
                  <div className="mb-4">
                    <h4 className="font-semibold text-lg mb-2 border-b pb-1">{t('sick_leave_payments_section_title')}</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wide">{t('sick_leave_payment_usage')}</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wide">{t('sick_leave_payment_hours')}</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wide">{t('sick_leave_payment_amount')}</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wide">{t('sick_leave_payment_date')}</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {activeSickLeavePayments.map((payment, index) => {
                            const usageId =
                              payment.usage_id ||
                              payment.usageId ||
                              payment.sick_leave_usage_id ||
                              `#${index + 1}`;
                            const hoursPaid = parseNumber(payment.hours_paid ?? payment.hours ?? payment.paid_hours);
                            const amountPaid = parseNumber(payment.amount_paid ?? payment.amount ?? payment.paid_amount);
                            const paymentDate = payment.paid_at || payment.payment_date || payment.processed_at || payment.created_at || '';

                            return (
                              <tr key={`${usageId}-${index}`}>
                                <td className="px-4 py-2 text-gray-700">{usageId}</td>
                                <td className="px-4 py-2 text-gray-700">{formatHoursValue(hoursPaid)} {t('hrs')}</td>
                                <td className="px-4 py-2 text-gray-700">{formatCurrencyValue(amountPaid)}</td>
                                <td className="px-4 py-2 text-gray-700">{paymentDate ? formatDateOnly(paymentDate) : '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  (paidSickLeaveAmount > 0 || paidSickLeaveHours > 0) && (
                    <div className="mb-4 text-sm text-gray-500">
                      {t('sick_leave_payments_empty')}
                    </div>
                  )
                )}

                {/* Deducciones */}
                <div className="mb-4">
                  <h4 className="font-semibold text-lg mb-2 border-b pb-1">{t('deductions')}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">{t('federal_tax_payroll')}</span>
                      <span className="text-red-600">-${calc.federal_tax}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">{t('state_tax_payroll')}</span>
                      <span className="text-red-600">-${calc.state_tax}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">{t('social_security_payroll')}</span>
                      <span className="text-red-600">-${calc.social_security}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">{t('medicare_payroll')}</span>
                      <span className="text-red-600">-${calc.medicare}</span>
                    </div>
                    {parseFloat(calc.other_deductions) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">{t('other_deductions')}</span>
                        <span className="text-red-600">-${calc.other_deductions}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t-2 pt-2 mt-2">
                      <span className="font-bold text-lg">{t('total_deductions')}</span>
                      <span className="font-bold text-lg text-red-600">-${calc.total_deductions}</span>
                    </div>
                  </div>
                </div>

                {/* Pago Neto Final */}
                <div className="bg-green-50 p-4 rounded-lg border-2 border-green-400">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">{t('net_pay_to_receive')}</span>
                    <span className="text-3xl font-bold text-green-700">${calc.net_pay}</span>
                  </div>
                </div>

                {/* Información de Método de Pago */}
                {employeePaymentInfo[calc.employee_id] && (
                  <div className="mt-4 bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                    <h4 className="font-semibold text-lg mb-3 text-gray-800">{t('payment_method')}</h4>
                    {employeePaymentInfo[calc.employee_id].payment_method === 'cash' ? (
                      <div className="text-gray-700">
                        <p className="font-semibold text-lg">{t('cash')}</p>
                        <p className="text-sm text-gray-600 mt-1">{t('payment_will_be_made_in_cash')}</p>
                      </div>
                    ) : employeePaymentInfo[calc.employee_id].payment_method === 'transfer' || 
                         employeePaymentInfo[calc.employee_id].payment_method === 'check' ? (
                      <div className="text-gray-700">
                        <p className="font-semibold text-lg mb-2">{employeePaymentInfo[calc.employee_id].payment_method === 'transfer' ? t('bank_transfer') : t('check')}</p>
                        {employeePaymentInfo[calc.employee_id].bank_account_number && (
                          <p className="text-sm">
                            <span className="font-semibold">{t('account_number')}:</span>{' '}
                            {employeePaymentInfo[calc.employee_id].bank_account_number}
                          </p>
                        )}
                        {employeePaymentInfo[calc.employee_id].bank_routing_number && (
                          <p className="text-sm">
                            <span className="font-semibold">{t('routing_number')}:</span>{' '}
                            {employeePaymentInfo[calc.employee_id].bank_routing_number}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-700">
                        <p className="font-semibold text-lg">{employeePaymentInfo[calc.employee_id].payment_method || t('payment_method')}</p>
                        {employeePaymentInfo[calc.employee_id].bank_account_number && (
                          <p className="text-sm">
                            <span className="font-semibold">{t('account_number')}:</span>{' '}
                            {employeePaymentInfo[calc.employee_id].bank_account_number}
                          </p>
                        )}
                        {employeePaymentInfo[calc.employee_id].bank_routing_number && (
                          <p className="text-sm">
                            <span className="font-semibold">{t('routing_number')}:</span>{' '}
                            {employeePaymentInfo[calc.employee_id].bank_routing_number}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Sección de Firma Digital */}
                <div className="mt-6 pt-4 border-t-2 border-gray-300">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <PenTool className="w-5 h-5 text-blue-600" />
                        {t('employee_digital_signature')}
                      </h4>
                      {employeeSignature?.isSigned && (
                        <span className="text-green-600 font-semibold flex items-center gap-1">
                          {t('signed')}
                        </span>
                      )}
                    </div>

                    {employeeSignature?.isSigned ? (
                      <div className="bg-white border-2 border-green-400 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-2">{t('employee_signature', { code: calc.employee_code })}</p>
                        <div className="flex justify-center items-center bg-gray-50 rounded border-2 border-gray-300" style={{ minHeight: '150px' }}>
                          <img
                            src={employeeSignature?.signatureData || ''}
                            alt="Firma del empleado"
                            className="max-h-36"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          {t('digitally_signed_legal')}
                        </p>
                      </div>
                    ) : (
                      <div className="no-print">
                        <p className="text-sm text-gray-700 mb-3">
                          {t('employee_must_sign_payroll', { code: calc.employee_code })}
                        </p>
                        <div className="bg-white border-2 border-gray-300 rounded-lg p-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('sign_here_payroll')}
                          </label>
                          <div className="border-2 border-dashed border-gray-400 rounded-lg bg-white">
                            <SignatureCanvas
                              ref={(ref) => {
                                if (ref) signatureRefs.current[calc.employee_id] = ref;
                              }}
                              canvasProps={{
                                className: 'w-full h-40 cursor-crosshair',
                              }}
                            />
                          </div>
                          <div className="mt-3 flex justify-between items-center">
                            <button
                              type="button"
                              onClick={() => clearSignature(calc.employee_id)}
                              className="px-4 py-2 text-sm border-2 border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium"
                            >
                              {t('clear_signature_payroll')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSignEmployee(calc.employee_id, calc.employee_code)}
                              disabled={signingInProgress === calc.employee_id}
                              className="px-6 py-2 text-sm border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
                            >
                              {signingInProgress === calc.employee_id ? (
                                <>
                                  <LoadingSpinner size="sm" />
                                  {t('saving_payroll')}
                                </>
                              ) : (
                                <>
                                  <PenTool className="w-4 h-4" />
                                  {t('sign_and_save_payroll')}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-xs text-yellow-800">
                            <strong>{t('info')}:</strong> {t('signature_legal_notice_payroll')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              {/* Subir Comprobante Firmado */}
              {SHOW_SIGNED_PDF_UPLOAD_UI && (
                <div className="mt-6 pt-4 border-t-2 border-gray-200 no-print">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-lg text-green-800 mb-3">
                      {t('signed_pdf_upload_section_title')}
                    </h4>

                    {employeeSignature?.isSigned ? (
                      <div className="space-y-4">
                        {hasUploadedSignedPdf && (
                          <div className="bg-white border border-green-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-green-700">
                              {t('signed_pdf_existing_download', { code: calc.employee_code })}
                            </p>
                            {signedPdfFilename && (
                              <p className="text-xs text-gray-500 mt-1">{signedPdfFilename}</p>
                            )}
                            {signedPdfUrl ? (
                              <a
                                href={signedPdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center mt-2 text-sm text-blue-600 hover:text-blue-800"
                              >
                                {t('download')}
                              </a>
                            ) : (
                              <p className="text-xs text-gray-400 mt-2">{t('signed_pdf_no_direct_link')}</p>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`invoice-${calc.employee_id}`}>
                              {t('signed_pdf_invoice_label')}
                            </label>
                            <input
                              id={`invoice-${calc.employee_id}`}
                              type="text"
                              value={invoiceValue}
                              onChange={(event) => handleInvoiceChange(calc.employee_id, event.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                              placeholder={t('signed_pdf_invoice_placeholder')}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`signed-pdf-${calc.employee_id}`}>
                              {t('signed_pdf_file_label')}
                            </label>
                            <input
                              id={`signed-pdf-${calc.employee_id}`}
                              type="file"
                              accept="application/pdf"
                              onChange={(event) => handleSignedPdfFileChange(calc.employee_id, event)}
                              className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
                            />
                            {selectedFile && (
                              <p className="text-xs text-gray-500 mt-1">{selectedFile.name}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-600">
                            {t('signed_pdf_upload_hint')}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleUploadSignedPdf(calc.employee_id, calc.employee_code)}
                            disabled={isUploading || !selectedFile || !trimmedInvoice}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUploading && <LoadingSpinner size="sm" />}
                            <span>{isUploading ? t('uploading') : t('upload_signed_pdf_btn')}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-700">
                          {t('signed_pdf_pending_signature')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

                {/* Información adicional */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    <p className="font-semibold mb-1">{t('employer')}: {companyName}</p>
                    {businessAddress && <p>{businessAddress}</p>}
                    {businessRfc && <p>EIN: {businessRfc}</p>}
                    <p className="mt-2 italic">{t('informational_receipt')}</p>
                    <p className="text-right mt-2">{t('generated')}: {new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })() : (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
            {t('no_employees_available')}
          </div>
        )}

        {/* Footer - Oculto en impresión */}
        <div className="mt-8 pt-6 border-t-2 border-gray-300 no-print">
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="font-bold text-gray-900 mb-2">{companyName}</p>
              {businessAddress && <p className="text-gray-600">{businessAddress}</p>}
              {businessPhone && <p className="text-gray-600">Tel: {businessPhone}</p>}
              {businessEmail && <p className="text-gray-600">Email: {businessEmail}</p>}
            </div>
            <div className="text-right">
              <p className="text-gray-500">{t('generated_by')}</p>
              <p className="text-gray-500">{t('payroll_id')}: {payroll.id}</p>
              <p className="text-gray-500">{t('generation_date')}: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos para impresión */}
      <style>{`
        @media print {
          /* Ocultar elementos marcados como no-print */
          .no-print,
          .no-print * {
            display: none !important;
            visibility: hidden !important;
          }

          .page-break {
            page-break-after: always !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Configuración global compacta */
          body {
            margin: 0 !important;
            padding: 0 !important;
            font-size: 9px !important;
          }

          .print-container {
            padding: 8px !important;
            font-size: 9px !important;
          }

          /* Header de empresa en cada comprobante - Ultra compacto */
          .page-break > .mb-6.pb-4 {
            page-break-after: avoid !important;
            break-after: avoid !important;
            margin-bottom: 3px !important;
            padding-bottom: 2px !important;
          }

          .page-break > .mb-6.pb-4 h1 {
            font-size: 12px !important;
            margin-bottom: 1px !important;
            line-height: 1.2 !important;
          }

          .page-break > .mb-6.pb-4 h2 {
            font-size: 11px !important;
            margin-bottom: 1px !important;
            line-height: 1.2 !important;
          }

          .page-break > .mb-6.pb-4 .text-sm {
            font-size: 7px !important;
            line-height: 1.1 !important;
          }

          .page-break > .mb-6.pb-4 .bg-gray-50 {
            padding: 2px 4px !important;
            margin-top: 2px !important;
          }

          .page-break > .mb-6.pb-4 .text-xs {
            font-size: 6px !important;
            line-height: 1.1 !important;
          }

          .page-break > .mb-6.pb-4 .w-10 {
            width: 16px !important;
            height: 16px !important;
          }

          .page-break > .mb-6.pb-4 .gap-3 {
            gap: 3px !important;
          }

          .page-break > .mb-6.pb-4 .mb-3 {
            margin-bottom: 2px !important;
          }

          .page-break > .mb-6.pb-4 .mt-4 {
            margin-top: 2px !important;
          }

          .page-break > .mb-6.pb-4 .grid-cols-3 {
            gap: 2px !important;
          }

          /* Tamaños de fuente reducidos */
          h1 {
            font-size: 14px !important;
            margin-bottom: 2px !important;
            line-height: 1.2 !important;
          }

          h2 {
            font-size: 12px !important;
            margin-bottom: 2px !important;
            line-height: 1.2 !important;
          }

          h3 {
            font-size: 11px !important;
            margin-bottom: 2px !important;
            line-height: 1.2 !important;
          }

          h4 {
            font-size: 10px !important;
            margin-bottom: 2px !important;
            line-height: 1.2 !important;
          }

          h5 {
            font-size: 9px !important;
            margin-bottom: 2px !important;
            line-height: 1.2 !important;
          }

          .text-3xl {
            font-size: 16px !important;
            line-height: 1.2 !important;
          }

          .text-2xl {
            font-size: 14px !important;
            line-height: 1.2 !important;
          }

          .text-xl {
            font-size: 12px !important;
            line-height: 1.2 !important;
          }

          .text-lg {
            font-size: 10px !important;
            line-height: 1.2 !important;
          }

          .text-base {
            font-size: 9px !important;
            line-height: 1.2 !important;
          }

          .text-sm {
            font-size: 8px !important;
            line-height: 1.2 !important;
          }

          .text-xs {
            font-size: 7px !important;
            line-height: 1.1 !important;
          }

          /* Padding y márgenes reducidos */
          .p-6 {
            padding: 6px !important;
          }

          .p-4 {
            padding: 4px !important;
          }

          .p-3 {
            padding: 3px !important;
          }

          .mb-8 {
            margin-bottom: 6px !important;
          }

          .mb-6 {
            margin-bottom: 4px !important;
          }

          .mb-4 {
            margin-bottom: 3px !important;
          }

          .mb-3 {
            margin-bottom: 2px !important;
          }

          .mb-2 {
            margin-bottom: 2px !important;
          }

          .mt-4 {
            margin-top: 3px !important;
          }

          .mt-3 {
            margin-top: 2px !important;
          }

          .mt-2 {
            margin-top: 2px !important;
          }

          .pt-4 {
            padding-top: 3px !important;
          }

          .pt-2 {
            padding-top: 2px !important;
          }

          .pb-1 {
            padding-bottom: 1px !important;
          }

          .gap-4 {
            gap: 4px !important;
          }

          .gap-2 {
            gap: 2px !important;
          }

          .space-y-2 > * + * {
            margin-top: 2px !important;
          }

          /* Header del empleado compacto */
          .bg-gray-100 {
            overflow: visible !important;
            padding: 4px 8px !important;
            margin-left: -8px !important;
            margin-right: -8px !important;
            margin-top: -8px !important;
            margin-bottom: 3px !important;
          }

          .bg-gray-100 > div {
            overflow: visible !important;
            width: 100% !important;
            min-width: 0 !important;
          }

          .bg-gray-100 h3,
          .bg-gray-100 p {
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            white-space: normal !important;
            max-width: 100% !important;
            overflow: visible !important;
            text-overflow: clip !important;
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1.2 !important;
          }

          .bg-gray-100 .flex-1 {
            min-width: 0 !important;
            max-width: 70% !important;
            padding-right: 4px !important;
          }

          .bg-gray-100 .flex-shrink-0 {
            min-width: 100px !important;
          }

          /* Contenedor principal */
          .border-2.rounded-lg {
            padding: 6px 8px !important;
            margin-bottom: 4px !important;
          }

          /* Secciones */
          .border-b {
            border-bottom-width: 1px !important;
            padding-bottom: 2px !important;
          }

          .border-t {
            border-top-width: 1px !important;
            padding-top: 2px !important;
          }

          .border-t-2 {
            border-top-width: 1px !important;
            padding-top: 2px !important;
            margin-top: 2px !important;
          }

          /* Grid compacto */
          .grid-cols-3 {
            gap: 3px !important;
          }

          .grid-cols-3 > div {
            padding: 2px !important;
          }

          /* Flex containers */
          .flex {
            flex-wrap: wrap !important;
            min-width: 0 !important;
            gap: 2px !important;
          }

          .flex-1 {
            min-width: 0 !important;
            max-width: 100% !important;
          }

          /* Ingresos y deducciones */
          .flex.justify-between {
            padding: 1px 0 !important;
            font-size: 8px !important;
            line-height: 1.3 !important;
          }

          /* Pago neto destacado */
          .bg-green-50 {
            background-color: #eff6ff !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            padding: 4px 6px !important;
            margin-top: 3px !important;
            margin-bottom: 3px !important;
          }

          .bg-green-50 .text-xl {
            font-size: 11px !important;
          }

          .bg-green-50 .text-3xl {
            font-size: 18px !important;
          }

          .border-green-400 {
            border-color: #4ade80 !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            border-width: 1px !important;
          }

          /* Tabla de desglose diario ultra compacta */
          .desglose-dia-table {
            font-size: 7px !important;
            margin-top: 2px !important;
            margin-bottom: 2px !important;
          }

          .desglose-dia-table th,
          .desglose-dia-table td {
            padding: 2px 1px !important;
            font-size: 7px !important;
            line-height: 1.2 !important;
          }

          .desglose-dia-table thead th {
            padding: 2px 1px !important;
            font-weight: 600 !important;
          }

          table {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin: 2px 0 !important;
          }

          thead {
            display: table-header-group !important;
          }

          tbody {
            display: table-row-group !important;
          }

          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Sección de firma compacta */
          .bg-blue-50 {
            background-color: #eff6ff !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            padding: 4px 6px !important;
            margin-top: 3px !important;
          }

          .bg-blue-50 h4 {
            font-size: 9px !important;
            margin-bottom: 2px !important;
          }

          .bg-blue-50 .text-sm {
            font-size: 7px !important;
            margin-bottom: 2px !important;
          }

          .bg-white.border-2 {
            padding: 3px !important;
            margin: 2px 0 !important;
          }

          img[alt="Firma del empleado"] {
            max-height: 60px !important;
            display: block !important;
            margin: 2px auto !important;
          }

          /* Información adicional compacta */
          .border-t.border-gray-200 {
            padding-top: 2px !important;
            margin-top: 2px !important;
            font-size: 7px !important;
            line-height: 1.2 !important;
          }

          /* Prevenir que el texto se corte horizontalmente */
          * {
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            max-width: 100% !important;
          }

          /* Ajustes de espaciado general */
          .rounded-lg {
            border-radius: 4px !important;
          }

          .rounded {
            border-radius: 2px !important;
          }
        }

        /* Estilos para el canvas de firma */
        .signature-canvas {
          touch-action: none;
        }
      `}</style>
    </>
  );
};

export default PayrollPrintView;

