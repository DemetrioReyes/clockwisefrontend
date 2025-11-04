import React, { useState, useEffect } from 'react';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import employeeService from '../../../services/employee.service';
import payrollService from '../../../services/payroll.service';
import { TimeEntry as TimeEntryType, Business, TimeSummary } from '../../../types';
import { Clock, Camera, Calendar, Users } from 'lucide-react';

const getRecordTypeBadge = (type: string) => {
  const badges: { [key: string]: string } = {
    check_in: 'bg-green-100 text-green-800',
    check_out: 'bg-red-100 text-red-800',
    break_start: 'bg-yellow-100 text-yellow-800',
    break_end: 'bg-blue-100 text-blue-800',
  };
  return badges[type] || 'bg-gray-100 text-gray-800';
};

const getRecordTypeLabel = (type: string) => {
  const labels: { [key: string]: string } = {
    check_in: 'Entrada',
    check_out: 'Salida',
    break_start: 'Inicio Break',
    break_end: 'Fin Break',
  };
  return labels[type] || type;
};

const TimeEntry: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordType, setRecordType] = useState<'check_in' | 'check_out' | 'break_start' | 'break_end'>('check_in');
  const [loading, setLoading] = useState(false);
  const [timeEntries, setTimeEntries] = useState<TimeEntryType[]>([]);
  const [timeSummaries, setTimeSummaries] = useState<TimeSummary[]>([]);
  const [filters, setFilters] = useState({
    employee_id: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadTimeEntries();
    loadTimeSummaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTimeEntries = async () => {
    setLoading(true);
    try {
      const data = await employeeService.listTimeEntries(
        filters.employee_id || undefined,
        filters.start_date || undefined,
        filters.end_date || undefined
      );
      setTimeEntries(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.log('Error al cargar time entries:', error);
      // No mostrar error al usuario, simplemente mostrar lista vacía
      setTimeEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeSummaries = async () => {
    try {
      const tenantId = (user as Business).tenant_id;
      // Obtener resumen de tiempo del mes actual completo
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Último día del mes
      
      const data = await payrollService.calculatePayroll({
        tenant_id: tenantId,
        period_start: startOfMonth.toISOString().split('T')[0],
        period_end: endOfMonth.toISOString().split('T')[0],
        pay_frequency: 'monthly',
      });
      
      if (data?.time_summaries && Array.isArray(data.time_summaries)) {
        setTimeSummaries(data.time_summaries);
      }
    } catch (error: any) {
      console.log('Error al cargar time summaries:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedImage) {
      showToast('Por favor seleccione una imagen facial', 'error');
      return;
    }

    setLoading(true);
    try {
      const tenantId = (user as Business).tenant_id;
      await employeeService.createTimeEntry({
        face_image: selectedImage,
        tenant_id: tenantId,
        record_type: recordType,
        device_info: 'Web Browser',
      });
      
      showToast('Control de tiempo registrado exitosamente', 'success');
      setSelectedImage(null);
      setPreviewUrl(null);
      loadTimeEntries();
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Control de Tiempo</h1>
          <p className="text-gray-600 mt-2">
            Registre entrada, salida y breaks usando reconocimiento facial
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario de Registro */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Nuevo Registro</h2>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    El sistema utiliza reconocimiento facial para identificar automáticamente al empleado.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Registro *
                </label>
                <select
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="check_in">Entrada (Check In)</option>
                  <option value="check_out">Salida (Check Out)</option>
                  <option value="break_start">Inicio de Break</option>
                  <option value="break_end">Fin de Break</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto Facial *
                </label>
                <div className="space-y-4">
                  {previewUrl && (
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-48 rounded-lg object-cover border-2 border-gray-300"
                    />
                  )}
                  
                  <label className="cursor-pointer block w-full">
                    <div className="flex items-center justify-center px-6 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition">
                      <div className="text-center">
                        <Camera className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          {previewUrl ? 'Cambiar Foto' : 'Tomar/Subir Foto'}
                        </p>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    setPreviewUrl(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Limpiar
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedImage}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Procesando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>

          {/* Filtros y Estadísticas */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Filtros</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                onClick={loadTimeEntries}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Cargando...' : 'Aplicar Filtros'}
              </button>

              <button
                onClick={() => {
                  setFilters({ employee_id: '', start_date: '', end_date: '' });
                  loadTimeEntries();
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Limpiar Filtros
              </button>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Información</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <p>• <strong>Check In:</strong> Entrada al trabajo</p>
                <p>• <strong>Check Out:</strong> Salida del trabajo</p>
                <p>• <strong>Break Start:</strong> Inicio de descanso</p>
                <p>• <strong>Break End:</strong> Fin de descanso</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen de Registros */}
        {timeSummaries.length > 0 && (
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <h2 className="text-lg font-semibold text-green-900">Resumen de Registros de Tiempo</h2>
                  <p className="text-sm text-green-700 mt-1">
                    Datos del último mes
                  </p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horas Regulares
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horas Extra
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Horas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entradas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Salidas
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeSummaries.map((summary) => (
                    <tr key={summary.employee_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{summary.employee_name}</div>
                        <div className="text-sm text-gray-500">{summary.employee_code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {parseFloat(summary.regular_hours).toFixed(2)}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-semibold">
                        {parseFloat(summary.overtime_hours).toFixed(2)}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-bold">
                        {parseFloat(summary.total_work_hours).toFixed(2)}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {summary.check_in_count} check-ins
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {summary.check_out_count} check-outs
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Lista de Registros Detallados - Solo mostrar si hay datos del endpoint GET */}
        {timeEntries.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Registros de Tiempo Detallados</h2>
            <p className="text-sm text-gray-500 mt-1">
              Total: {timeEntries.length} registros
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confianza
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dispositivo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.employee_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entry.employee_code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRecordTypeBadge(entry.record_type)}`}>
                          {getRecordTypeLabel(entry.record_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(() => {
                          const dateTime = entry.record_time || entry.timestamp;
                          if (!dateTime) return '-';
                          try {
                            const date = new Date(dateTime);
                            if (isNaN(date.getTime())) return '-';
                            return date.toLocaleString('es-ES', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            });
                          } catch {
                            return '-';
                          }
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const confidence = entry.face_confidence || entry.confidence;
                          if (confidence === undefined || confidence === null) {
                            return <span className="text-gray-400">-</span>;
                          }
                          return (
                            <div className="flex items-center">
                              <div className="text-sm text-gray-900">
                                {(confidence * 100).toFixed(1)}%
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.device_info || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}
      </div>
    </Layout>
  );
};

export default TimeEntry;
