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
  const [breakComplianceStatus, setBreakComplianceStatus] = useState<'pending' | 'resolved' | 'all'>('pending');
  const [breakComplianceTotal, setBreakComplianceTotal] = useState<number>(0);
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
      const data = await reportsService.getBreakComplianceAlerts(breakComplianceStatus);
      // El backend puede devolver un objeto con { alerts: [], total_alerts: number } o directamente un array
      if (Array.isArray(data)) {
        setBreakComplianceData(data);
        setBreakComplianceTotal(data.length);
      } else {
        setBreakComplianceData(data.alerts || []);
        setBreakComplianceTotal(data.total_alerts || data.alerts?.length || 0);
      }
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
            {/* Información sobre Break Compliance */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-1">Break Compliance</h3>
              <p className="text-sm text-blue-700">
                Requiere 30 minutos de break para turnos de 8+ horas. Las alertas identifican cuando un empleado trabajó 8+ horas sin tomar el break requerido.
              </p>
            </div>

            {/* Controles de filtro */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado de las Alertas
                  </label>
                  <select
                    value={breakComplianceStatus}
                    onChange={(e) => setBreakComplianceStatus(e.target.value as 'pending' | 'resolved' | 'all')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pendientes</option>
                    <option value="resolved">Resueltas</option>
                    <option value="all">Todas</option>
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
                      <span className="ml-2">Cargando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Cargar Alertas
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Resumen de alertas */}
            {breakComplianceTotal > 0 && (
              <div className="bg-white shadow rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Total de Alertas: <span className="text-blue-600 font-bold">{breakComplianceTotal}</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    {breakComplianceStatus === 'pending' && 'Pendientes de resolución'}
                    {breakComplianceStatus === 'resolved' && 'Ya resueltas'}
                    {breakComplianceStatus === 'all' && 'Todas las alertas'}
                  </span>
                </div>
              </div>
            )}

            {/* Tabla de alertas */}
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" text="Cargando alertas..." />
              </div>
            ) : breakComplianceData.length > 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empleado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha de Violación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Déficit de Break
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Severidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resuelto Por
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
                            {item.violation_date ? (
                              new Date(item.violation_date).toLocaleDateString('es-ES', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            ) : (
                              <span className="text-red-600">Fecha inválida</span>
                            )}
                          </div>
                          {item.created_at && (
                            <div className="text-xs text-gray-500 mt-1">
                              Creado: {new Date(item.created_at).toLocaleDateString('es-ES')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-red-700">
                            {item.deficit_minutes ?? 0} minutos
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Faltan {item.deficit_minutes ?? 0} min de break requerido
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
                            {item.severity === 'high' ? 'Alta' : item.severity === 'medium' ? 'Media' : 'Baja'}
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
                            {item.status === 'pending' ? 'Pendiente' : 'Resuelta'}
                          </span>
                          {item.resolved_at && (
                            <div className="text-xs text-gray-500 mt-1">
                              Resuelto: {new Date(item.resolved_at).toLocaleDateString('es-ES')}
                            </div>
                          )}
                          {item.resolution_notes && (
                            <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={item.resolution_notes}>
                              {item.resolution_notes}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.resolved_by ? (
                            <div className="text-sm text-gray-900">{item.resolved_by}</div>
                          ) : (
                            <div className="text-sm text-gray-400">-</div>
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
                <p className="text-gray-500 font-medium">
                  No hay alertas {breakComplianceStatus === 'pending' ? 'pendientes' : breakComplianceStatus === 'resolved' ? 'resueltas' : 'disponibles'}.
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Haga clic en "Cargar Alertas" para obtener los datos más recientes.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Reports;
