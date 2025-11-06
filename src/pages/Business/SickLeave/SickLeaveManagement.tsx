import { useState, useEffect, useRef } from 'react';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import { sickleaveService } from '../../../services/sickleave.service';
import { getEmployees } from '../../../services/employee.service';
import { signaturesService } from '../../../services/signatures.service';
import { Employee } from '../../../types';
import { Calendar, Clock, Users, CheckCircle2, AlertCircle, FileText, Plus, X, PenTool, Printer } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

const SickLeaveManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allSickLeaves, setAllSickLeaves] = useState<any[]>([]);
  const [selectedEmployeeForHistory, setSelectedEmployeeForHistory] = useState<string | null>(null);
  const [usageHistory, setUsageHistory] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [currentUsage, setCurrentUsage] = useState<any>(null);
  const [signing, setSigning] = useState(false);
  const signatureRef = useRef<any>(null);
  const { showToast } = useToast();

  const [usageForm, setUsageForm] = useState({
    employee_code: '',
    usage_date: new Date().toISOString().split('T')[0],
    hours_used: '',
    reason: '',
    requires_approval: false,
  });

  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  useEffect(() => {
    loadEmployees();
    loadAllSickLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAllSickLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  useEffect(() => {
    if (selectedEmployee) {
      const employee = employees.find((e) => e.id === selectedEmployee);
      if (employee) {
        setUsageForm({ ...usageForm, employee_code: employee.employee_code });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployee]);

  const loadEmployees = async () => {
    try {
      const data = await getEmployees(true);
      setEmployees(data);
      if (data.length > 0) {
        setSelectedEmployee(data[0].id);
      }
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    }
  };



  const loadAllSickLeaves = async () => {
    setLoadingAll(true);
    try {
      const data = await sickleaveService.getAllSickLeaves(selectedYear);
      // Handle array or object response - backend returns { year, total_employees, employees: [...] }
      const sickLeavesList = Array.isArray(data) 
        ? data 
        : ((data as any)?.employees || (data as any)?.sick_leaves || (data as any)?.items || []);
      setAllSickLeaves(sickLeavesList);
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
      setAllSickLeaves([]);
    } finally {
      setLoadingAll(false);
    }
  };

  const handleRequestUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const employee = employees.find((e) => e.id === selectedEmployee);
      const usageResponse = await sickleaveService.requestSickLeaveUsage({
        ...usageForm,
        hours_used: parseFloat(usageForm.hours_used),
      });
      
      // Guardar la información del uso para mostrar en el modal de firma
      setCurrentUsage({
        ...usageResponse,
        employee_name: employee ? `${employee.first_name} ${employee.last_name}` : '',
        employee_code: usageForm.employee_code,
      });
      
      // Cerrar el formulario y abrir el modal de firma
      setUsageForm({
        ...usageForm,
        hours_used: '',
        reason: '',
      });
      setShowSignatureModal(true);
      loadAllSickLeaves();
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignComprobante = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      showToast('Por favor, firma el comprobante antes de continuar', 'error');
      return;
    }

    setSigning(true);
    try {
      const signatureData = signatureRef.current.toDataURL();
      
      // Generar un nombre único para el PDF del comprobante
      const timestamp = new Date().getTime();
      const pdfFilename = `sick_leave_usage_${currentUsage.id || currentUsage.employee_code}_${timestamp}.pdf`;

      // Firmar el documento
      await signaturesService.signDocument({
        payroll_pdf_id: pdfFilename,
        signature_type: 'drawn',
        signature_data: signatureData,
        signature_metadata: {
          device: navigator.userAgent,
          ip_address: '',
          user_agent: navigator.userAgent,
          signed_location: 'Sick Leave Management',
          timestamp: new Date().toISOString(),
          geolocation: undefined,
        },
      });

      showToast('Comprobante firmado y guardado exitosamente', 'success');
      setShowSignatureModal(false);
      setCurrentUsage(null);
      if (signatureRef.current) {
        signatureRef.current.clear();
      }
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setSigning(false);
    }
  };

  const handlePrintComprobante = () => {
    window.print();
  };

  const handleCloseModal = () => {
    setShowSignatureModal(false);
    setCurrentUsage(null);
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  const handleViewHistory = async (employeeId: string) => {
    setLoadingHistory(true);
    setSelectedEmployeeForHistory(employeeId);
    try {
      const data = await sickleaveService.getEmployeeUsageHistory(employeeId, selectedYear);
      setUsageHistory(data);
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
      setUsageHistory(null);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Gestión de Sick Leave
              </h2>
              <p className="mt-1 text-sm text-gray-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                NY State: 1 hora de sick leave por cada 30 horas trabajadas (máximo 40 hrs/año)
              </p>
            </div>
          </div>
        </div>

        {/* Lista de Todas las Sick Leaves */}
        <div className="bg-white shadow-lg rounded-xl p-6 mb-8 border border-gray-200">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Sick Leave de Todos los Empleados</h3>
                <p className="text-sm text-gray-600 mt-1">Resumen completo del año seleccionado</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="year_select" className="text-sm font-semibold text-gray-700">
                Año:
              </label>
              <select
                id="year_select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white font-medium"
              >
                {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingAll ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : allSickLeaves.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No hay datos de sick leave para el año {selectedYear}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Horas Acumuladas
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Horas Usadas
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Horas Restantes
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allSickLeaves.map((sickLeaveItem: any) => (
                    <tr key={sickLeaveItem.id || sickLeaveItem.employee_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {sickLeaveItem.employee_name || `${sickLeaveItem.first_name || ''} ${sickLeaveItem.last_name || ''}`.trim() || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 font-medium">
                          {sickLeaveItem.employee_code || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-3 py-1 inline-flex text-sm font-bold text-blue-700 bg-blue-50 rounded-lg border border-blue-200">
                          {(sickLeaveItem.hours_earned ?? sickLeaveItem.hours_accrued ?? 0).toFixed(2)} hrs
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-3 py-1 inline-flex text-sm font-bold text-red-700 bg-red-50 rounded-lg border border-red-200">
                          {(sickLeaveItem.hours_used ?? 0).toFixed(2)} hrs
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-3 py-1 inline-flex text-sm font-bold text-green-700 bg-green-50 rounded-lg border border-green-200">
                          {(sickLeaveItem.hours_available ?? sickLeaveItem.hours_remaining ?? (sickLeaveItem.hours_earned ?? sickLeaveItem.hours_accrued ?? 0) - (sickLeaveItem.hours_used ?? 0)).toFixed(2)} hrs
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {((sickLeaveItem.hours_available ?? sickLeaveItem.hours_remaining ?? (sickLeaveItem.hours_earned ?? sickLeaveItem.hours_accrued ?? 0) - (sickLeaveItem.hours_used ?? 0)) > 0) ? (
                          <span className="px-3 py-1 inline-flex text-xs font-semibold text-green-800 bg-green-100 rounded-full border border-green-300">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Disponible
                          </span>
                        ) : (
                          <span className="px-3 py-1 inline-flex text-xs font-semibold text-gray-800 bg-gray-100 rounded-full border border-gray-300">
                            Agotado
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleViewHistory(sickLeaveItem.employee_id)}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                        >
                          Ver Historial
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Historial de Uso de Sick Leave */}
        {selectedEmployeeForHistory && usageHistory && (
          <div className="bg-white shadow-lg rounded-xl p-6 mb-8 border border-gray-200">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Historial de Uso - {usageHistory.employee_code}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Año {usageHistory.year} - {usageHistory.total_usage} uso(s) registrado(s)
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedEmployeeForHistory(null);
                  setUsageHistory(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>

            {loadingHistory ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : usageHistory.usage_history && usageHistory.usage_history.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No hay historial de uso para este empleado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {usageHistory.usage_history?.map((usage: any) => (
                  <div key={usage.id} className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <p className="text-base font-bold text-gray-900">
                            {new Date(usage.usage_date).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        {usage.reason && (
                          <div className="ml-7 mb-2">
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold">Razón:</span> {usage.reason}
                            </p>
                          </div>
                        )}
                        <div className="ml-7 text-xs text-gray-500">
                          <span>Registrado: {new Date(usage.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-100 px-4 py-2 rounded-lg border border-blue-300">
                          <p className="text-xs font-semibold text-blue-700 mb-0.5">Horas Usadas</p>
                          <p className="text-lg font-bold text-blue-900">{usage.hours_used} hrs</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Solicitar Uso de Sick Leave */}
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200 mb-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Plus className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Solicitar Uso de Sick Leave</h3>
              </div>
              
              <form onSubmit={handleRequestUsage} className="space-y-5">
                <div>
                  <label htmlFor="employee_select" className="block text-sm font-semibold text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Seleccionar Empleado *
                  </label>
                  <select
                    id="employee_select"
                    required
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white font-medium"
                  >
                    <option value="">-- Seleccione un empleado --</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name} - {employee.employee_code}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="usage_date" className="block text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Fecha *
                  </label>
                  <input
                    type="date"
                    id="usage_date"
                    required
                    value={usageForm.usage_date}
                    onChange={(e) => setUsageForm({ ...usageForm, usage_date: e.target.value })}
                    className="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-medium"
                  />
                </div>

                <div>
                  <label htmlFor="hours_used" className="block text-sm font-semibold text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Horas a Usar *
                  </label>
                  <input
                    type="number"
                    id="hours_used"
                    required
                    step="0.5"
                    min="0"
                    value={usageForm.hours_used}
                    onChange={(e) => setUsageForm({ ...usageForm, hours_used: e.target.value })}
                    className="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-medium"
                    placeholder="0.0"
                  />
                </div>

                <div>
                  <label htmlFor="reason" className="block text-sm font-semibold text-gray-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Razón (Opcional)
                  </label>
                  <textarea
                    id="reason"
                    rows={3}
                    value={usageForm.reason}
                    onChange={(e) => setUsageForm({ ...usageForm, reason: e.target.value })}
                    className="block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-medium resize-none"
                    placeholder="Describe la razón del uso de sick leave..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Procesando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Solicitar Uso
                    </>
                  )}
                </button>
              </form>
            </div>

        {/* Modal de Firma del Comprobante */}
        {showSignatureModal && currentUsage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <PenTool className="w-6 h-6 text-blue-600" />
                  Comprobante de Uso de Sick Leave
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                {/* Contenido del Comprobante */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                  <div className="text-center mb-6">
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">COMPROBANTE DE USO</h4>
                    <h5 className="text-xl font-semibold text-gray-700">Sick Leave - NY State</h5>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Empleado</p>
                      <p className="text-lg font-bold text-gray-900">{currentUsage.employee_name || currentUsage.employee_code}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Código</p>
                      <p className="text-lg font-bold text-gray-900">{currentUsage.employee_code}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Fecha de Uso</p>
                      <p className="text-lg font-bold text-gray-900">
                        {new Date(currentUsage.usage_date).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Horas Usadas</p>
                      <p className="text-2xl font-bold text-blue-700">{currentUsage.hours_used} hrs</p>
                    </div>
                  </div>

                  {currentUsage.reason && (
                    <div className="bg-white p-4 rounded-lg border border-blue-200 mb-6">
                      <p className="text-sm font-semibold text-gray-600 mb-2">Razón</p>
                      <p className="text-gray-700">{currentUsage.reason}</p>
                    </div>
                  )}

                  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
                    <p className="text-sm text-yellow-800 font-semibold">
                      ⚠️ Este comprobante tiene validez legal. Al firmar, confirmas que la información es correcta y has utilizado las horas de sick leave indicadas.
                    </p>
                  </div>

                  {/* Área de Firma */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Firma Digital del Empleado
                    </label>
                    <div className="border-2 border-gray-300 rounded-lg bg-white overflow-hidden">
                      <SignatureCanvas
                        ref={signatureRef}
                        canvasProps={{
                          width: 800,
                          height: 200,
                          className: 'signature-canvas w-full h-full',
                          style: { touchAction: 'none' }
                        }}
                        backgroundColor="#ffffff"
                      />
                    </div>
                    <div className="flex gap-3 mt-3">
                      <button
                        onClick={() => signatureRef.current?.clear()}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Limpiar Firma
                      </button>
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex gap-4">
                    <button
                      onClick={handlePrintComprobante}
                      className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Printer className="w-5 h-5" />
                      Imprimir
                    </button>
                    <button
                      onClick={handleSignComprobante}
                      disabled={signing}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {signing ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <PenTool className="w-5 h-5" />
                          Firmar y Guardar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SickLeaveManagement;

