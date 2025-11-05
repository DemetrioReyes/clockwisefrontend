import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import payrollService from '../../../services/payroll.service';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import { Printer, ArrowLeft, Building2, PenTool } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { signaturesService } from '../../../services/signatures.service';
import { pdfService } from '../../../services/pdf.service';

interface EmployeeSignature {
  employeeId: string;
  signatureData: string | null;
  pdfFilename: string | null;
  isSigned: boolean;
}

const PayrollPrintView: React.FC = () => {
  const { payrollId } = useParams<{ payrollId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [payrollData, setPayrollData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [signatures, setSignatures] = useState<Record<string, EmployeeSignature>>({});
  const [signingInProgress, setSigningInProgress] = useState<string | null>(null);
  const signatureRefs = useRef<Record<string, any>>({});

  useEffect(() => {
    loadPayrollData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payrollId]);

  const loadPayrollData = async () => {
    try {
      if (!payrollId) return;
      const data = await payrollService.getPayrollById(payrollId);
      setPayrollData(data);

      // Cargar PDFs y firmas existentes
      await loadEmployeeSignatures(data.calculations);
    } catch (error) {
      console.error('Error cargando nómina:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeSignatures = async (calculations: any[]) => {
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

      for (const calc of calculations) {
        const employeeId = calc.employee_id;

        // Buscar PDF específico para este empleado
        const employeePdf = pdfArray.find((pdf: any) =>
          pdf.employee_id === employeeId
        );

        if (employeePdf && employeePdf.pdf_filename) {
          try {
            // Verificar si existe firma para este PDF
            const signature = await signaturesService.getPDFSignature(employeePdf.pdf_filename);
            signaturesMap[employeeId] = {
              employeeId,
              signatureData: signature.signature_data,
              pdfFilename: employeePdf.pdf_filename,
              isSigned: true,
            };
          } catch (error: any) {
            // Si no hay firma (404), inicializar como no firmado
            signaturesMap[employeeId] = {
              employeeId,
              signatureData: null,
              pdfFilename: employeePdf.pdf_filename,
              isSigned: false,
            };
          }
        } else {
          // No hay PDF para este empleado aún
          signaturesMap[employeeId] = {
            employeeId,
            signatureData: null,
            pdfFilename: null,
            isSigned: false,
          };
        }
      }

      setSignatures(signaturesMap);
    } catch (error) {
      console.error('Error cargando firmas:', error);
    }
  };

  const handleSignEmployee = async (employeeId: string, employeeCode: string) => {
    const sigPad = signatureRefs.current[employeeId];

    if (!sigPad || sigPad.isEmpty()) {
      showToast('Por favor dibuje su firma', 'error');
      return;
    }

    if (!payrollId) {
      showToast('Error: No se encontró el ID de la nómina', 'error');
      return;
    }

    setSigningInProgress(employeeId);

    try {
      const signatureData = sigPad.toDataURL();
      const metadata = signaturesService.getSignatureMetadata();

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
          showToast('Generando PDF del recibo...', 'info');
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
        },
      });

      // Actualizar estado local
      setSignatures(prev => ({
        ...prev,
        [employeeId]: {
          employeeId,
          signatureData,
          pdfFilename,
          isSigned: true,
        },
      }));

      // Verificar si se guardó en IndexedDB (backend no disponible)
      if (signature.id?.startsWith('local_')) {
        showToast(`Recibo firmado y guardado localmente por ${employeeCode}`, 'success');
      } else {
        showToast(`Recibo firmado exitosamente por ${employeeCode}`, 'success');
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

  const handlePrint = () => {
    window.print();
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!payrollId) return;
    
    setUpdatingStatus(true);
    try {
      await payrollService.updatePayrollStatus(payrollId, newStatus as 'draft' | 'calculated' | 'approved' | 'paid');
      showToast('Estado de nómina actualizado exitosamente', 'success');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando nómina..." />
      </div>
    );
  }

  if (!payrollData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl">No se encontró la nómina</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">
            Volver
          </button>
        </div>
      </div>
    );
  }

  const { payroll, calculations } = payrollData;

  return (
    <>
      {/* Botones de acción - NO se imprimen */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2 items-center">
        <div className="bg-white shadow-lg rounded-lg px-3 py-2 border border-gray-200">
          <label className="text-xs text-gray-600 mr-2">Estado:</label>
          {updatingStatus ? (
            <LoadingSpinner size="sm" />
          ) : (
            <select
              value={payroll.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`px-3 py-1 text-xs rounded-full border-0 font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(payroll.status)}`}
            >
              <option value="draft">Borrador</option>
              <option value="calculated">Calculada</option>
              <option value="approved">Aprobada</option>
              <option value="paid">Pagada</option>
            </select>
          )}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          Imprimir / Guardar PDF
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
                <p className="text-gray-600 text-sm">📍 {businessAddress}</p>
              )}
              {businessPhone && (
                <p className="text-gray-600 text-sm">📞 {businessPhone}</p>
              )}
              {businessEmail && (
                <p className="text-gray-600 text-sm">📧 {businessEmail}</p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-blue-600 mb-2">RECIBO DE NÓMINA</h2>
              <p className="text-sm text-gray-500">ID: {payroll.id.substring(0, 8)}...</p>
              <p className="text-sm text-gray-500">Creado: {new Date(payroll.created_at).toLocaleDateString('es-ES')}</p>
            </div>
          </div>
          
          {/* Info del período */}
          <div className="mt-4 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 uppercase">Período</p>
                <p className="font-semibold">{payroll.period_start} al {payroll.period_end}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Frecuencia</p>
                <p className="font-semibold capitalize">{payroll.pay_frequency}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Status</p>
                <p className="font-semibold capitalize">{payroll.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen General - Oculto en impresión para confidencialidad */}
        <div className="mb-8 bg-blue-50 p-6 rounded-lg no-print">
          <h2 className="text-xl font-bold mb-4">Resumen General</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Empleados</p>
              <p className="text-2xl font-bold">{payroll.total_employees}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pago Bruto</p>
              <p className="text-2xl font-bold text-green-600">${payroll.total_gross_pay}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Deducciones</p>
              <p className="text-2xl font-bold text-red-600">${payroll.total_deductions}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pago Neto</p>
              <p className="text-2xl font-bold text-blue-600">${payroll.total_net_pay}</p>
            </div>
          </div>
        </div>

        {/* Detalle por Empleado */}
        {calculations && calculations.map((calc: any) => (
          <div key={calc.employee_id} className="mb-8 page-break">
            {/* Header de la empresa - Aparece en cada comprobante */}
            <div className="mb-6 pb-4 border-b-2 border-gray-800">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Building2 className="w-10 h-10 text-blue-600" />
                    <h1 className="text-3xl font-bold text-gray-900">{companyName}</h1>
                  </div>
                  {businessAddress && (
                    <p className="text-gray-600 text-sm">📍 {businessAddress}</p>
                  )}
                  {businessPhone && (
                    <p className="text-gray-600 text-sm">📞 {businessPhone}</p>
                  )}
                  {businessEmail && (
                    <p className="text-gray-600 text-sm">📧 {businessEmail}</p>
                  )}
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-blue-600 mb-2">RECIBO DE NÓMINA</h2>
                  <p className="text-sm text-gray-500">ID: {payroll.id.substring(0, 8)}...</p>
                  <p className="text-sm text-gray-500">Creado: {new Date(payroll.created_at).toLocaleDateString('es-ES')}</p>
                </div>
              </div>
              
              {/* Info del período */}
              <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Período</p>
                    <p className="font-semibold">{payroll.period_start} al {payroll.period_end}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Frecuencia</p>
                    <p className="font-semibold capitalize">{payroll.pay_frequency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Status</p>
                    <p className="font-semibold capitalize">{payroll.status}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-2 border-gray-300 rounded-lg p-6">
              {/* Header del empleado */}
              <div className="bg-gray-100 -m-6 mb-6 p-4 rounded-t-lg">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold break-words">{calc.employee_name}</h3>
                    <p className="text-gray-600 break-words">Código: {calc.employee_code} | Tipo: {calc.employee_type}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-gray-600 whitespace-nowrap">Pago Neto</p>
                    <p className="text-3xl font-bold text-green-600 whitespace-nowrap">${calc.net_pay}</p>
                  </div>
                </div>
              </div>

              {/* Horas trabajadas */}
              <div className="mb-4">
                <h4 className="font-semibold text-lg mb-2 border-b pb-1">Horas Trabajadas</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Regulares</p>
                    <p className="text-lg font-bold">{calc.regular_hours}h</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Overtime</p>
                    <p className="text-lg font-bold">{calc.overtime_hours}h</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Break</p>
                    <p className="text-lg font-bold">{calc.break_hours}h</p>
                  </div>
                </div>
              </div>

              {/* Ingresos */}
              <div className="mb-4">
                <h4 className="font-semibold text-lg mb-2 border-b pb-1">Ingresos</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Pago Regular ({calc.regular_hours}h × ${calc.hourly_rate}/h)</span>
                    <span className="font-semibold">${calc.regular_pay}</span>
                  </div>
                  {parseFloat(calc.overtime_hours) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Pago Overtime ({calc.overtime_hours}h × ${(parseFloat(calc.hourly_rate) * 1.5).toFixed(2)}/h)</span>
                      <span className="font-semibold">${calc.overtime_pay}</span>
                    </div>
                  )}
                  {parseFloat(calc.spread_hours_pay) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Spread Hours Pay</span>
                      <span className="font-semibold">${calc.spread_hours_pay}</span>
                    </div>
                  )}
                  {parseFloat(calc.total_bonus) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Bonos</span>
                      <span className="font-semibold text-green-600">+${calc.total_bonus}</span>
                    </div>
                  )}
                  {parseFloat(calc.tips_reported) > 0 && (
                    <div className="flex justify-between bg-yellow-50 p-2 rounded">
                      <span className="text-gray-700 font-medium">💰 Propinas Reportadas</span>
                      <span className="font-bold text-yellow-700">${calc.tips_reported}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t-2 pt-2 mt-2">
                    <span className="font-bold text-lg">Pago Bruto</span>
                    <span className="font-bold text-lg text-green-600">${calc.gross_pay}</span>
                  </div>
                </div>
              </div>

              {/* Deducciones */}
              <div className="mb-4">
                <h4 className="font-semibold text-lg mb-2 border-b pb-1">Deducciones</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Impuesto Federal</span>
                    <span className="text-red-600">-${calc.federal_tax}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Impuesto Estatal (NY)</span>
                    <span className="text-red-600">-${calc.state_tax}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Social Security (6.2%)</span>
                    <span className="text-red-600">-${calc.social_security}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Medicare (1.45%)</span>
                    <span className="text-red-600">-${calc.medicare}</span>
                  </div>
                  {parseFloat(calc.other_deductions) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Otras Deducciones</span>
                      <span className="text-red-600">-${calc.other_deductions}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t-2 pt-2 mt-2">
                    <span className="font-bold text-lg">Total Deducciones</span>
                    <span className="font-bold text-lg text-red-600">-${calc.total_deductions}</span>
                  </div>
                </div>
              </div>

              {/* Pago Neto Final */}
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-400">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">PAGO NETO A RECIBIR</span>
                  <span className="text-3xl font-bold text-green-700">${calc.net_pay}</span>
                </div>
              </div>

              {/* Sección de Firma Digital */}
              <div className="mt-6 pt-4 border-t-2 border-gray-300">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <PenTool className="w-5 h-5 text-blue-600" />
                      Firma Digital del Empleado
                    </h4>
                    {signatures[calc.employee_id]?.isSigned && (
                      <span className="text-green-600 font-semibold flex items-center gap-1">
                        ✓ Firmado
                      </span>
                    )}
                  </div>

                  {signatures[calc.employee_id]?.isSigned ? (
                    // Mostrar firma existente
                    <div className="bg-white border-2 border-green-400 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Firma del empleado {calc.employee_code}:</p>
                      <div className="flex justify-center items-center bg-gray-50 rounded border-2 border-gray-300" style={{ minHeight: '150px' }}>
                        <img
                          src={signatures[calc.employee_id].signatureData || ''}
                          alt="Firma del empleado"
                          className="max-h-36"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Firmado digitalmente - Este documento es legalmente vinculante
                      </p>
                    </div>
                  ) : (
                    // Mostrar canvas para firmar
                    <div className="no-print">
                      <p className="text-sm text-gray-700 mb-3">
                        El empleado <strong>{calc.employee_code}</strong> debe firmar este recibo para confirmar que ha recibido y revisado la información.
                      </p>
                      <div className="bg-white border-2 border-gray-300 rounded-lg p-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Firme aquí con su dedo o mouse:
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
                            Limpiar Firma
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
                                Guardando...
                              </>
                            ) : (
                              <>
                                <PenTool className="w-4 h-4" />
                                Firmar y Guardar
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-xs text-yellow-800">
                          <strong>Importante:</strong> Al firmar este documento, confirmo que he recibido este recibo de nómina y que la información es correcta. Esta firma digital tiene validez legal.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Información adicional */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  <p className="font-semibold mb-1">Empleador: {companyName}</p>
                  {businessAddress && <p>{businessAddress}</p>}
                  <p className="mt-2 italic">Este recibo es solo informativo. Conserve para sus registros.</p>
                  <p className="text-right mt-2">Generado: {new Date().toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t-2 border-gray-300">
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="font-bold text-gray-900 mb-2">{companyName}</p>
              {businessAddress && <p className="text-gray-600">{businessAddress}</p>}
              {businessPhone && <p className="text-gray-600">Tel: {businessPhone}</p>}
              {businessEmail && <p className="text-gray-600">Email: {businessEmail}</p>}
            </div>
            <div className="text-right">
              <p className="text-gray-500">Generado por ClockWise Payroll System</p>
              <p className="text-gray-500">ID de Nómina: {payroll.id}</p>
              <p className="text-gray-500">Fecha de generación: {new Date().toLocaleDateString('es-ES', { 
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
          .no-print {
            display: none !important;
          }

          .page-break {
            page-break-after: always !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Header de empresa en cada comprobante - Optimizado para impresión */
          .page-break > .mb-6.pb-4 {
            page-break-after: avoid !important;
            break-after: avoid !important;
            margin-bottom: 6px !important;
            padding-bottom: 4px !important;
          }

          .page-break > .mb-6.pb-4 h1 {
            font-size: 16px !important;
            margin-bottom: 2px !important;
          }

          .page-break > .mb-6.pb-4 h2 {
            font-size: 14px !important;
            margin-bottom: 2px !important;
          }

          .page-break > .mb-6.pb-4 .text-sm {
            font-size: 9px !important;
          }

          .page-break > .mb-6.pb-4 .bg-gray-50 {
            padding: 4px !important;
            margin-top: 4px !important;
          }

          .page-break > .mb-6.pb-4 .text-xs {
            font-size: 7px !important;
          }

          .page-break > .mb-6.pb-4 .w-10 {
            width: 24px !important;
            height: 24px !important;
          }

          .page-break > .mb-6.pb-4 .gap-3 {
            gap: 6px !important;
          }

          .page-break > .mb-6.pb-4 .mb-3 {
            margin-bottom: 4px !important;
          }

          .page-break > .mb-6.pb-4 .mt-4 {
            margin-top: 4px !important;
          }

          .page-break > .mb-6.pb-4 .grid-cols-3 {
            gap: 4px !important;
          }

          .print-container {
            padding: 15px;
            font-size: 11px;
          }

          body {
            margin: 0;
            padding: 0;
            font-size: 11px;
          }

          h1 {
            font-size: 18px !important;
          }

          h2 {
            font-size: 16px !important;
          }

          h3 {
            font-size: 14px !important;
          }

          h4 {
            font-size: 12px !important;
          }

          .text-3xl {
            font-size: 20px !important;
          }

          .text-2xl {
            font-size: 16px !important;
          }

          .text-xl {
            font-size: 14px !important;
          }

          .text-lg {
            font-size: 12px !important;
          }

          .text-base {
            font-size: 11px !important;
          }

          .text-sm {
            font-size: 10px !important;
          }

          .text-xs {
            font-size: 9px !important;
          }

          .p-6 {
            padding: 12px !important;
          }

          .p-4 {
            padding: 10px !important;
          }

          .mb-8 {
            margin-bottom: 15px !important;
          }

          .mb-6 {
            margin-bottom: 12px !important;
          }

          .mb-4 {
            margin-bottom: 10px !important;
          }

          .gap-4 {
            gap: 8px !important;
          }

          /* Prevenir que el texto se corte horizontalmente */
          * {
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            max-width: 100% !important;
          }

          /* Asegurar que el header del empleado no se corte */
          .bg-gray-100 {
            overflow: visible !important;
            padding-left: 12px !important;
            padding-right: 12px !important;
            margin-left: -12px !important;
            margin-right: -12px !important;
            margin-top: -12px !important;
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
            margin-left: 0 !important;
            padding-left: 0 !important;
          }

          /* Asegurar que el contenedor del nombre tenga espacio */
          .bg-gray-100 .flex-1 {
            min-width: 0 !important;
            max-width: 70% !important;
            padding-right: 8px !important;
          }

          /* Asegurar que el monto de pago no se corte */
          .bg-gray-100 .flex-shrink-0 {
            min-width: 120px !important;
          }

          /* Asegurar que flex containers permitan wrap */
          .flex {
            flex-wrap: wrap !important;
            min-width: 0 !important;
          }

          .flex-1 {
            min-width: 0 !important;
            max-width: 100% !important;
          }

          /* Asegurar padding suficiente en contenedores */
          .print-container {
            padding-left: 12px !important;
            padding-right: 12px !important;
          }

          .border-2.rounded-lg {
            padding-left: 12px !important;
            padding-right: 12px !important;
          }

          /* Estilos para mostrar firmas en impresión */
          img[alt="Firma del empleado"] {
            max-height: 100px !important;
            display: block !important;
            margin: 0 auto !important;
          }

          .bg-blue-50 {
            background-color: #eff6ff !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .border-green-400 {
            border-color: #4ade80 !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
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

