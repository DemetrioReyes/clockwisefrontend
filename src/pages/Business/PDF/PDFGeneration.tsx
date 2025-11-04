import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import payrollService from '../../../services/payroll.service';
import { Printer, Eye, FileText } from 'lucide-react';

const PDFGeneration = () => {
  const navigate = useNavigate();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [selectedPayrollId, setSelectedPayrollId] = useState<string>('');

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

  const handleViewPrintable = () => {
    if (!selectedPayrollId) {
      showToast('Por favor seleccione una nómina', 'error');
      return;
    }
    navigate(`/business/payroll/print/${selectedPayrollId}`);
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
                  onChange={(e) => setSelectedPayrollId(e.target.value)}
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
                  disabled={!selectedPayrollId}
                  className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg font-semibold"
                >
                  <Eye className="w-6 h-6" />
                  Ver Imprimible
                </button>
                <button
                  type="button"
                  onClick={handleViewPrintable}
                  disabled={!selectedPayrollId}
                  className="flex-1 bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg font-semibold"
                >
                  <Printer className="w-6 h-6" />
                  Imprimir / Guardar PDF
                </button>
              </div>

              {selectedPayrollId && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <p className="text-green-800 text-sm">
                    ✅ Nómina seleccionada. Click en cualquiera de los botones para continuar.
                  </p>
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
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            payroll.status === 'paid' ? 'bg-green-100 text-green-800' :
                            payroll.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payroll.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => navigate(`/business/payroll/print/${payroll.id}`)}
                            className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                          >
                            <Printer className="w-4 h-4" />
                            Imprimir
                          </button>
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

