import React, { useState } from 'react';
import { formatErrorMessage } from '../../../services/api';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { reportsService } from '../../../services/reports.service';
import { SickLeaveReport, BreakComplianceAlert } from '../../../types';
import { FileText, CheckCircle, XCircle } from 'lucide-react';

const Reports: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'sick-leave' | 'break-compliance'>('sick-leave');
  const [sickLeaveData, setSickLeaveData] = useState<SickLeaveReport[]>([]);
  const [breakComplianceData, setBreakComplianceData] = useState<BreakComplianceAlert[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());

  const handleLoadSickLeave = async () => {
    setLoading(true);
    try {
      const data = await reportsService.getSickLeaveReport(year);
      setSickLeaveData(data);
      showToast('Reporte de sick leave cargado exitosamente!', 'success');
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadBreakCompliance = async () => {
    setLoading(true);
    try {
      const data = await reportsService.getBreakComplianceAlerts('pending');
      setBreakComplianceData(data.alerts || data);
      showToast('Reporte de compliance cargado exitosamente!', 'success');
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600 mt-2">Reportes de cumplimiento y sick leave</p>
        </div>

        <div className="flex space-x-4 border-b">
          <button
            onClick={() => setActiveTab('sick-leave')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'sick-leave'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="inline w-5 h-5 mr-2" />
            Sick Leave
          </button>
          <button
            onClick={() => setActiveTab('break-compliance')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'break-compliance'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CheckCircle className="inline w-5 h-5 mr-2" />
            Break Compliance
          </button>
        </div>

        {activeTab === 'sick-leave' && (
          <div className="space-y-4">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Año</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <button
                  onClick={handleLoadSickLeave}
                  disabled={loading}
                  className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Cargando...' : 'Cargar Reporte'}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" text="Cargando reporte..." />
              </div>
            ) : sickLeaveData.length > 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empleado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas Acumuladas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas Usadas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas Restantes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sickLeaveData.map((item) => (
                      <tr key={item.employee_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.employee_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{item.hours_accrued.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{item.hours_used.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.hours_remaining.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              item.compliance_status === 'compliant'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {item.compliance_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-12 text-center text-gray-500">
                No hay datos disponibles. Haga clic en "Cargar Reporte" para obtener los datos.
              </div>
            )}
          </div>
        )}

        {activeTab === 'break-compliance' && (
          <div className="space-y-4">
            <div className="bg-white shadow rounded-lg p-6">
              <button
                onClick={handleLoadBreakCompliance}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Cargando...' : 'Cargar Alertas Pendientes'}
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" text="Cargando alertas..." />
              </div>
            ) : breakComplianceData.length > 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empleado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas Trabajadas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Break Tomado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {breakComplianceData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.employee_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {new Date(item.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{item.hours_worked.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.break_taken ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              item.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-12 text-center text-gray-500">
                No hay alertas pendientes.
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Reports;
