import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import payrollService from '../../../services/payroll.service';
import { pdfService } from '../../../services/pdf.service';
import { signaturesService } from '../../../services/signatures.service';
import { Printer, Eye, FileText, Trash2, AlertCircle } from 'lucide-react';

const PDFGeneration = () => {
  const navigate = useNavigate();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deletingPayrollId, setDeletingPayrollId] = useState<string | null>(null);
  const { showToast } = useToast();
  const [selectedPayrollId, setSelectedPayrollId] = useState<string>('');
  const [checkingSignatures, setCheckingSignatures] = useState(false);
  const [hasSignatures, setHasSignatures] = useState<boolean | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const payrollsData = await payrollService.listPayrolls(undefined, 100);
      
      // Manejar respuesta paginada o array directo
      const payrollsList = Array.isArray(payrollsData) 
        ? payrollsData 
        : ((payrollsData as any)?.payrolls || (payrollsData as any)?.items || []);
      
      setPayrolls(payrollsList);
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkPayrollSignatures = async (payrollId: string) => {
    setCheckingSignatures(true);
    setHasSignatures(null);
    
    try {
      // Obtener todos los PDFs de esta nómina
      const pdfData = await pdfService.getPDFHistory(undefined, payrollId, 100);
      let pdfArray: any[] = [];
      if (Array.isArray(pdfData)) {
        pdfArray = pdfData;
      } else if (pdfData && typeof pdfData === 'object') {
        const pdfObj = pdfData as any;
        pdfArray = pdfObj.items || pdfObj.data || pdfObj.results || [];
      }

      if (pdfArray.length === 0) {
        setHasSignatures(false);
        return false;
      }

      // Verificar si al menos un PDF tiene firma
      let hasAnySignature = false;
      for (const pdf of pdfArray) {
        try {
          if (pdf.pdf_filename) {
            await signaturesService.getPDFSignature(pdf.pdf_filename);
            hasAnySignature = true;
            break; // Si encontramos al menos una firma, no necesitamos seguir
          }
        } catch (error: any) {
          // Si el error es 404, significa que no hay firma para este PDF
          if (error.response?.status === 404) {
            continue;
          }
          // Otros errores los ignoramos y continuamos
        }
      }

      setHasSignatures(hasAnySignature);
      return hasAnySignature;
    } catch (error: any) {
      console.error('Error verificando firmas:', error);
      setHasSignatures(false);
      return false;
    } finally {
      setCheckingSignatures(false);
    }
  };

  const handlePayrollSelect = async (payrollId: string) => {
    setSelectedPayrollId(payrollId);
    if (payrollId) {
      await checkPayrollSignatures(payrollId);
    } else {
      setHasSignatures(null);
    }
  };

  const handleViewPrintable = () => {
    if (!selectedPayrollId) {
      showToast('Por favor seleccione una nómina', 'error');
      return;
    }
    
    // Permitir ver la nómina siempre, incluso sin firmas (para que la firmen)
    navigate(`/business/payroll/print/${selectedPayrollId}`);
  };

  const handlePrintOrSave = () => {
    if (!selectedPayrollId) {
      showToast('Por favor seleccione una nómina', 'error');
      return;
    }
    
    // Solo bloquear imprimir/guardar si no tiene firmas
    if (!hasSignatures) {
      showToast('Esta nómina no tiene firmas. Las nóminas deben ser firmadas digitalmente antes de imprimir o guardar. Puede ver la nómina para que los empleados la firmen primero.', 'error');
      return;
    }
    
    navigate(`/business/payroll/print/${selectedPayrollId}`);
  };

  const handleStatusChange = async (payrollId: string, newStatus: string) => {
    setUpdatingStatus(payrollId);
    try {
      await payrollService.updatePayrollStatus(payrollId, newStatus as 'draft' | 'calculated' | 'approved' | 'paid');
      showToast('Estado de nómina actualizado exitosamente', 'success');
      // Actualizar el estado local
      setPayrolls(prev => prev.map(p => 
        p.id === payrollId ? { ...p, status: newStatus } : p
      ));
    } catch (error: any) {
      console.error('Error actualizando estado:', error);
      console.error('Response data:', error.response?.data);
      console.error('Detail array:', error.response?.data?.detail);
      if (error.response?.data?.detail && Array.isArray(error.response.data.detail)) {
        console.error('Detalles del error:', JSON.stringify(error.response.data.detail, null, 2));
      }
      const errorMessage = formatErrorMessage(error);
      showToast(errorMessage, 'error');
    } finally {
      setUpdatingStatus(null);
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

  const handleDeletePayroll = async (payrollId: string, period: string) => {
    const confirmMessage = `¿Estás seguro de que deseas eliminar la nómina del período ${period}?\n\nEsta acción no se puede deshacer.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setDeletingPayrollId(payrollId);
    try {
      await payrollService.deletePayroll(payrollId);
      showToast('Nómina eliminada exitosamente', 'success');
      
      // Remover de la lista local
      setPayrolls(prev => prev.filter(p => p.id !== payrollId));
      
      // Si la nómina eliminada estaba seleccionada, limpiar la selección
      if (selectedPayrollId === payrollId) {
        setSelectedPayrollId('');
      }
    } catch (error: any) {
      console.error('Error eliminando nómina:', error);
      console.error('Response data:', error.response?.data);
      const errorMessage = formatErrorMessage(error);
      showToast(errorMessage, 'error');
    } finally {
      setDeletingPayrollId(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Cargando nóminas..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Imprimir Recibos de Nómina</h1>
          <p className="text-gray-600 mt-2">Seleccione una nómina para ver e imprimir los recibos de pago</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <FileText className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">💡 Cómo Funciona</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>1. Selecciona una nómina guardada de la lista</p>
                  <p>2. Click en "Ver Imprimible"</p>
                  <p>3. Se abrirá una vista profesional de recibos</p>
                  <p>4. Click en "Imprimir" o presiona Ctrl+P (Cmd+P en Mac)</p>
                  <p>5. Selecciona "Guardar como PDF" para descargarlo a tu PC</p>
                </div>
              </div>
            </div>
          </div>

          {payrolls.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hay nóminas guardadas</p>
              <p className="text-gray-400 text-sm mt-2">Ve a "Nómina" para calcular y guardar una nómina primero</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="payroll_select" className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Nómina *
                </label>
                <select
                  id="payroll_select"
                  value={selectedPayrollId}
                  onChange={(e) => handlePayrollSelect(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                >
                  <option value="">-- Seleccione una nómina --</option>
                  {payrolls.map((payroll) => (
                    <option key={payroll.id} value={payroll.id}>
                      📅 {payroll.period_start} - {payroll.period_end} | 
                      💰 ${payroll.total_gross_pay} | 
                      👥 {payroll.total_employees} empleados | 
                      📊 {payroll.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleViewPrintable}
                  disabled={!selectedPayrollId || checkingSignatures}
                  className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg font-semibold"
                  title="Ver nómina para que los empleados la firmen"
                >
                  <Eye className="w-6 h-6" />
                  Ver para Firmar
                </button>
                <button
                  type="button"
                  onClick={handlePrintOrSave}
                  disabled={!selectedPayrollId || checkingSignatures || !hasSignatures}
                  className="flex-1 bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg font-semibold"
                  title={!hasSignatures && selectedPayrollId ? 'Esta nómina no tiene firmas. Debe ser firmada antes de imprimir o guardar.' : ''}
                >
                  <Printer className="w-6 h-6" />
                  Imprimir / Guardar PDF
                </button>
              </div>

              {checkingSignatures && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4 flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <p className="text-blue-800 text-sm">
                    Verificando firmas digitales...
                  </p>
                </div>
              )}

              {selectedPayrollId && !checkingSignatures && hasSignatures === true && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4 flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <p className="text-green-800 text-sm">
                    Nómina firmada. Puede proceder a imprimir o guardar.
                  </p>
                </div>
              )}

              {selectedPayrollId && !checkingSignatures && hasSignatures === false && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">
                        ⚠️ Nómina sin firmas
                      </h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Esta nómina no ha sido firmada por los empleados. Puede ver la nómina usando el botón "Ver para Firmar" para que los empleados la firmen.
                      </p>
                      <p className="text-sm text-yellow-700 mt-2">
                        <strong>Las nóminas deben ser firmadas digitalmente antes de poder imprimir o guardar.</strong> Una vez que todos los empleados hayan firmado, podrá usar el botón "Imprimir / Guardar PDF".
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lista de nóminas */}
          {payrolls.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nóminas Disponibles</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Período
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empleados
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pago Bruto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pago Neto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payrolls.map((payroll) => (
                      <tr key={payroll.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {payroll.period_start} - {payroll.period_end}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {payroll.total_employees}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          ${payroll.total_gross_pay}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                          ${payroll.total_net_pay}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {updatingStatus === payroll.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <select
                              value={payroll.status}
                              onChange={(e) => handleStatusChange(payroll.id, e.target.value)}
                              className={`px-3 py-1 text-xs rounded-full border-0 font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(payroll.status)}`}
                            >
                              <option value="draft">Borrador</option>
                              <option value="calculated">Calculada</option>
                              <option value="approved">Aprobada</option>
                              <option value="paid">Pagada</option>
                            </select>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                // Siempre permitir ver la nómina (para que la firmen)
                                navigate(`/business/payroll/print/${payroll.id}`);
                              }}
                              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                              title="Ver nómina para que los empleados la firmen"
                            >
                              <Eye className="w-4 h-4" />
                              Ver
                            </button>
                            <button
                              onClick={() => handleDeletePayroll(payroll.id, `${payroll.period_start} - ${payroll.period_end}`)}
                              disabled={deletingPayrollId === payroll.id}
                              className="text-red-600 hover:text-red-800 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Eliminar nómina"
                            >
                              {deletingPayrollId === payroll.id ? (
                                <span className="text-xs">Eliminando...</span>
                              ) : (
                                <>
                                  <Trash2 className="w-4 h-4" />
                                  Eliminar
                                </>
                              )}
                            </button>
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
      </div>
    </Layout>
  );
};

export default PDFGeneration;

