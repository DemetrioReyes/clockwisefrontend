import React, { useState } from 'react';
import { formatErrorMessage } from '../../../services/api';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { reportsService } from '../../../services/reports.service';
import { SickLeaveReport, BreakComplianceAlert } from '../../../types';
import { FileText, CheckCircle, XCircle, CheckCircle2, X } from 'lucide-react';

const Reports: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'sick-leave' | 'break-compliance'>('sick-leave');
  const [sickLeaveData, setSickLeaveData] = useState<SickLeaveReport[]>([]);
  const [breakComplianceData, setBreakComplianceData] = useState<BreakComplianceAlert[]>([]);
  const [breakComplianceStatus, setBreakComplianceStatus] = useState<'pending' | 'resolved' | 'all'>('pending');
  const [breakComplianceTotal, setBreakComplianceTotal] = useState<number>(0);
  const [year, setYear] = useState(new Date().getFullYear());
  const [resolvingAlert, setResolvingAlert] = useState<BreakComplianceAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

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
      showToast('Por favor, ingrese las notas de resolución', 'error');
      return;
    }

    setResolving(true);
    try {
      const result = await reportsService.resolveBreakComplianceAlert(resolvingAlert.id, resolutionNotes);
      showToast('Alerta resuelta exitosamente', 'success');
      handleCloseResolveModal();
      // Recargar las alertas
      await handleLoadBreakCompliance();
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setResolving(false);
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.status === 'pending' && (
                            <button
                              onClick={() => handleOpenResolveModal(item)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Resolver
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

        {/* Modal para Resolver Alerta */}
        {resolvingAlert && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Resolver Alerta de Break Compliance</h3>
                <button
                  onClick={handleCloseResolveModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <div className="bg-gray-50 p-3 rounded-md mb-4">
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Empleado:</span> {resolvingAlert.employee_name}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Fecha:</span> {resolvingAlert.violation_date ? new Date(resolvingAlert.violation_date).toLocaleDateString('es-ES') : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Déficit:</span> {resolvingAlert.deficit_minutes ?? 0} minutos
                  </p>
                </div>

                <label htmlFor="resolution_notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notas de Resolución *
                </label>
                <textarea
                  id="resolution_notes"
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Ej: Empleado tomó descanso pero no lo registró. Se corrigió en el sistema y se le recordó la importancia de registrar los breaks."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Describe la acción tomada para resolver esta alerta de cumplimiento.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseResolveModal}
                  disabled={resolving}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleResolveAlert}
                  disabled={resolving || !resolutionNotes.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {resolving ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-2">Resolviendo...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Marcar como Resuelto
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
