import React, { useState, useEffect } from 'react';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatErrorMessage } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import employeeService from '../../../services/employee.service';
import payrollService from '../../../services/payroll.service';
import { TimeEntry as TimeEntryType, Business, TimeSummary, Employee, TimeEntryManualCreate, TimeEntryUpdate } from '../../../types';
import { Clock, Camera, Calendar, Users, Edit2, Plus } from 'lucide-react';
import Modal from '../../../components/Common/Modal';

const getRecordTypeBadge = (type: string) => {
  const badges: { [key: string]: string } = {
    check_in: 'bg-green-100 text-green-800',
    check_out: 'bg-red-100 text-red-800',
    break_start: 'bg-yellow-100 text-yellow-800',
    break_end: 'bg-blue-100 text-blue-800',
  };
  return badges[type] || 'bg-gray-100 text-gray-800';
};

const getRecordTypeLabel = (type: string, t: (key: string) => string) => {
  const labels: { [key: string]: string } = {
    check_in: t('check_in'),
    check_out: t('check_out'),
    break_start: t('break_start'),
    break_end: t('break_end'),
  };
  return labels[type] || type;
};

const TimeEntry: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordType, setRecordType] = useState<'check_in' | 'check_out' | 'break_start' | 'break_end'>('check_in');
  const [loading, setLoading] = useState(false);
  const [timeEntries, setTimeEntries] = useState<TimeEntryType[]>([]);
  const [timeSummaries, setTimeSummaries] = useState<TimeSummary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filters, setFilters] = useState({
    employee_id: '',
    start_date: '',
    end_date: '',
  });

  // Estados para corrección manual
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntryType | null>(null);
  const [manualForm, setManualForm] = useState<TimeEntryManualCreate>({
    employee_id: '',
    record_type: 'check_in',
    record_time: '',
    notes: '',
  });
  const [editForm, setEditForm] = useState<TimeEntryUpdate>({
    new_record_time: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEmployees();
    loadTimeEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await employeeService.listEmployees(true);
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.log('Error al cargar empleados:', error);
      setEmployees([]);
    }
  };

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

  // Calcular resumen desde los timeEntries cargados
  const calculateTimeSummaries = () => {
    if (!timeEntries.length) {
      setTimeSummaries([]);
      return;
    }

    // Agrupar por empleado
    const employeeMap: Record<string, {
      employee_id: string;
      employee_code: string;
      employee_name: string;
      check_ins: TimeEntryType[];
      check_outs: TimeEntryType[];
      break_starts: TimeEntryType[];
      break_ends: TimeEntryType[];
    }> = {};

    timeEntries.forEach((entry) => {
      if (!entry.employee_id) return;

      if (!employeeMap[entry.employee_id]) {
        employeeMap[entry.employee_id] = {
          employee_id: entry.employee_id,
          employee_code: entry.employee_code || '',
          employee_name: entry.employee_name || '',
          check_ins: [],
          check_outs: [],
          break_starts: [],
          break_ends: [],
        };
      }

      if (entry.record_type === 'check_in') {
        employeeMap[entry.employee_id].check_ins.push(entry);
      } else if (entry.record_type === 'check_out') {
        employeeMap[entry.employee_id].check_outs.push(entry);
      } else if (entry.record_type === 'break_start') {
        employeeMap[entry.employee_id].break_starts.push(entry);
      } else if (entry.record_type === 'break_end') {
        employeeMap[entry.employee_id].break_ends.push(entry);
      }
    });

    // Calcular horas para cada empleado
    const summaries = Object.values(employeeMap).map((emp) => {
      let totalHours = 0;
      let regularHours = 0;
      let overtimeHours = 0;

      // Emparejar check-ins con check-outs del mismo día
      const dayMap: Record<string, { checkIn?: TimeEntryType; checkOut?: TimeEntryType }> = {};

      emp.check_ins.forEach((checkIn) => {
        const date = checkIn.record_time 
          ? new Date(checkIn.record_time).toISOString().split('T')[0]
          : checkIn.timestamp 
          ? new Date(checkIn.timestamp).toISOString().split('T')[0]
          : null;
        
        if (date && !dayMap[date]) {
          dayMap[date] = {};
        }
        if (date) {
          dayMap[date].checkIn = checkIn;
        }
      });

      emp.check_outs.forEach((checkOut) => {
        const date = checkOut.record_time 
          ? new Date(checkOut.record_time).toISOString().split('T')[0]
          : checkOut.timestamp 
          ? new Date(checkOut.timestamp).toISOString().split('T')[0]
          : null;
        
        if (date && !dayMap[date]) {
          dayMap[date] = {};
        }
        if (date) {
          dayMap[date].checkOut = checkOut;
        }
      });

      // Calcular horas por día
      Object.entries(dayMap).forEach(([date, day]) => {
        if (day.checkIn && day.checkOut) {
          const checkInTime = day.checkIn.record_time 
            ? new Date(day.checkIn.record_time).getTime()
            : day.checkIn.timestamp 
            ? new Date(day.checkIn.timestamp).getTime()
            : null;
          
          const checkOutTime = day.checkOut.record_time 
            ? new Date(day.checkOut.record_time).getTime()
            : day.checkOut.timestamp 
            ? new Date(day.checkOut.timestamp).getTime()
            : null;

          if (checkInTime && checkOutTime) {
            // Encontrar breaks del mismo día
            const dayBreakStarts = emp.break_starts.filter((bs) => {
              const bsDate = bs.record_time 
                ? new Date(bs.record_time).toISOString().split('T')[0]
                : bs.timestamp 
                ? new Date(bs.timestamp).toISOString().split('T')[0]
                : null;
              return bsDate === date;
            });

            const dayBreakEnds = emp.break_ends.filter((be) => {
              const beDate = be.record_time 
                ? new Date(be.record_time).toISOString().split('T')[0]
                : be.timestamp 
                ? new Date(be.timestamp).toISOString().split('T')[0]
                : null;
              return beDate === date;
            });

            // Calcular tiempo de breaks
            let breakTime = 0;
            dayBreakStarts.forEach((breakStart) => {
              const breakEnd = dayBreakEnds.find((be) => {
                const bsTime = breakStart.record_time 
                  ? new Date(breakStart.record_time).getTime()
                  : breakStart.timestamp 
                  ? new Date(breakStart.timestamp).getTime()
                  : null;
                const beTime = be.record_time 
                  ? new Date(be.record_time).getTime()
                  : be.timestamp 
                  ? new Date(be.timestamp).getTime()
                  : null;
                return bsTime && beTime && beTime > bsTime;
              });

              if (breakEnd) {
                const bsTime = breakStart.record_time 
                  ? new Date(breakStart.record_time).getTime()
                  : breakStart.timestamp 
                  ? new Date(breakStart.timestamp).getTime()
                  : null;
                const beTime = breakEnd.record_time 
                  ? new Date(breakEnd.record_time).getTime()
                  : breakEnd.timestamp 
                  ? new Date(breakEnd.timestamp).getTime()
                  : null;
                
                if (bsTime && beTime) {
                  breakTime += (beTime - bsTime) / (1000 * 60 * 60);
                }
              }
            });

            // Calcular horas trabajadas (check-out - check-in - breaks)
            const hours = ((checkOutTime - checkInTime) / (1000 * 60 * 60)) - breakTime;
            
            if (hours > 0) {
              totalHours += hours;
              
              // Considerar horas regulares (8 horas) y extra (>8 horas)
              if (hours <= 8) {
                regularHours += hours;
              } else {
                regularHours += 8;
                overtimeHours += (hours - 8);
              }
            }
          }
        }
      });

      return {
        employee_id: emp.employee_id,
        employee_code: emp.employee_code,
        employee_name: emp.employee_name,
        regular_hours: regularHours.toFixed(2),
        overtime_hours: overtimeHours.toFixed(2),
        total_work_hours: totalHours.toFixed(2),
        check_in_count: emp.check_ins.length,
        check_out_count: emp.check_outs.length,
        break_start_count: emp.break_starts.length,
        break_end_count: emp.break_ends.length,
      };
    });

    setTimeSummaries(summaries as any);
  };

  // Recalcular resumen cuando cambien los timeEntries
  useEffect(() => {
    calculateTimeSummaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeEntries]);

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
      showToast(t('please_select_facial_image'), 'error');
      return;
    }

    setLoading(true);
    try {
      const tenantId = (user as Business).tenant_id;
      console.log('Registrando tiempo:', JSON.stringify({ 
        recordType, 
        tenantId, 
        imageSize: selectedImage.size, 
        imageName: selectedImage.name 
      }, null, 2));
      
      const result = await employeeService.createTimeEntry({
        face_image: selectedImage,
        tenant_id: tenantId,
        record_type: recordType,
        device_info: 'Web Browser',
      });
      
      console.log('Respuesta del servidor:', JSON.stringify(result, null, 2));
      console.log('Registro exitoso:', result);
      
      showToast(t('time_registered_successfully'), 'success');
      setSelectedImage(null);
      setPreviewUrl(null);
      
      // Esperar un momento antes de recargar para asegurar que el backend procesó el registro
      setTimeout(() => {
        loadTimeEntries();
      }, 1000);
    } catch (error: any) {
      console.error('Error al registrar tiempo:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      const errorMessage = formatErrorMessage(error);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Funciones para corrección manual
  const handleOpenAddModal = () => {
    setManualForm({
      employee_id: filters.employee_id || '',
      record_type: 'check_in',
      record_time: new Date().toISOString().slice(0, 16),
      notes: '',
    });
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setManualForm({
      employee_id: '',
      record_type: 'check_in',
      record_time: '',
      notes: '',
    });
  };

  const handleAddManualEntry = async () => {
    if (!manualForm.employee_id || !manualForm.record_time) {
      showToast(t('please_fill_all_fields') || 'Por favor complete todos los campos', 'error');
      return;
    }

    setSaving(true);
    try {
      const recordTime = new Date(manualForm.record_time).toISOString();
      await employeeService.createManualTimeEntry({
        ...manualForm,
        record_time: recordTime,
      });
      showToast(t('record_added_successfully') || 'Registro agregado exitosamente', 'success');
      handleCloseAddModal();
      loadTimeEntries();
    } catch (error: any) {
      const errorMessage = formatErrorMessage(error);
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditModal = (entry: TimeEntryType) => {
    setEditingEntry(entry);
    const currentTime = entry.record_time || entry.timestamp || new Date().toISOString();
    setEditForm({
      new_record_time: new Date(currentTime).toISOString().slice(0, 16),
      notes: '',
    });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingEntry(null);
    setEditForm({
      new_record_time: '',
      notes: '',
    });
  };

  const handleUpdateEntry = async () => {
    if (!editingEntry || !editForm.new_record_time) {
      showToast(t('please_fill_all_fields') || 'Por favor complete todos los campos', 'error');
      return;
    }

    setSaving(true);
    try {
      const newTime = new Date(editForm.new_record_time).toISOString();
      await employeeService.updateTimeEntry(editingEntry.id, {
        ...editForm,
        new_record_time: newTime,
      });
      showToast(t('record_updated_successfully') || 'Registro actualizado exitosamente', 'success');
      handleCloseEditModal();
      loadTimeEntries();
    } catch (error: any) {
      const errorMessage = formatErrorMessage(error);
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const getSessionStatusBadge = (entry: TimeEntryType) => {
    if (entry.session_status === 'active_session') {
      return 'bg-green-100 text-green-800';
    }
    if (entry.session_status === 'needs_correction') {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getSessionStatusLabel = (entry: TimeEntryType) => {
    if (entry.session_status === 'active_session') {
      return t('active_session') || 'Sesión Activa';
    }
    if (entry.session_status === 'needs_correction') {
      return t('needs_correction') || 'Necesita Corrección';
    }
    return t('closed') || 'Cerrada';
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('time_tracking_title')}</h1>
          <p className="text-gray-600 mt-2">
            {t('time_tracking_description')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario de Registro */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">{t('new_record')}</h2>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    {t('facial_recognition_info')}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('record_type')} *
                </label>
                <select
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="check_in">{t('check_in_option')}</option>
                  <option value="check_out">{t('check_out_option')}</option>
                  <option value="break_start">{t('break_start')}</option>
                  <option value="break_end">{t('break_end')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('facial_photo')} *
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
                          {previewUrl ? t('change_photo') : t('take_upload_photo')}
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
                  {t('clear')}
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedImage}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? t('processing') : t('register')}
                </button>
              </div>
            </form>
          </div>

          {/* Filtros y Estadísticas */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">{t('filters')}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline w-4 h-4 mr-1" />
                  {t('employee')}
                </label>
                <select
                  value={filters.employee_id}
                  onChange={(e) => setFilters({ ...filters, employee_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t('all_employees') || 'Todos los empleados'}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} - {emp.employee_code}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  {t('start_date')}
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
                  {t('end_date')}
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
                {loading ? t('loading') : t('apply_filters')}
              </button>

              <button
                onClick={() => {
                  setFilters({ employee_id: '', start_date: '', end_date: '' });
                  loadTimeEntries();
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {t('clear_filters')}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-3">{t('information')}</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <p>• <strong>{t('check_in')}:</strong> {t('check_in_info')}</p>
                <p>• <strong>{t('check_out')}:</strong> {t('check_out_info')}</p>
                <p>• <strong>{t('break_start')}:</strong> {t('break_start_info')}</p>
                <p>• <strong>{t('break_end')}:</strong> {t('break_end_info')}</p>
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
                  <h2 className="text-lg font-semibold text-green-900">{t('time_summary')}</h2>
                  <p className="text-sm text-green-700 mt-1">
                    {t('last_month_data')}
                  </p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('employee')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('regular_hours')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('overtime_hours')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('total_hours')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('check_ins_count')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('check_outs_count')}
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
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">{t('detailed_time_records')}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {t('total_records', { count: timeEntries.length })}
              </p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>{t('add_manual_record') || 'Agregar Registro Manual'}</span>
            </button>
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
                      {t('employee')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('type')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('date_time')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('session_status') || 'Estado'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('confidence')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('device')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('actions') || 'Acciones'}
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
                        {entry.is_manual_correction && (
                          <div className="text-xs text-orange-600 mt-1">
                            {t('manual_correction') || 'Corrección Manual'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRecordTypeBadge(entry.record_type)}`}>
                          {getRecordTypeLabel(entry.record_type, t)}
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
                        {entry.old_record_time && (
                          <div className="text-xs text-gray-400 mt-1">
                            {t('previous') || 'Anterior'}: {new Date(entry.old_record_time).toLocaleString('es-ES', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {entry.session_status && (
                          <div className="space-y-1">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSessionStatusBadge(entry)}`}>
                              {getSessionStatusLabel(entry)}
                            </span>
                            {entry.hours_since_checkin !== null && entry.hours_since_checkin !== undefined && (
                              <div className="text-xs text-gray-600 mt-1">
                                {entry.hours_since_checkin.toFixed(1)}h
                              </div>
                            )}
                            {entry.message && (
                              <div className="text-xs text-gray-500 mt-1 max-w-xs">
                                {entry.message}
                              </div>
                            )}
                          </div>
                        )}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleOpenEditModal(entry)}
                          className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                          title={t('edit_record') || 'Editar registro'}
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>{t('edit') || 'Editar'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}

        {/* Modal para agregar registro manual */}
        <Modal
          isOpen={showAddModal}
          onClose={handleCloseAddModal}
          title={t('add_manual_record') || 'Agregar Registro Manual'}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('employee')} *
              </label>
              <select
                value={manualForm.employee_id}
                onChange={(e) => setManualForm({ ...manualForm, employee_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">{t('select_employee') || 'Seleccionar empleado'}</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} - {emp.employee_code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('record_type')} *
              </label>
              <select
                value={manualForm.record_type}
                onChange={(e) => setManualForm({ ...manualForm, record_type: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="check_in">{t('check_in_option')}</option>
                <option value="check_out">{t('check_out_option')}</option>
                <option value="break_start">{t('break_start')}</option>
                <option value="break_end">{t('break_end')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('date_time')} *
              </label>
              <input
                type="datetime-local"
                value={manualForm.record_time}
                onChange={(e) => setManualForm({ ...manualForm, record_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('notes') || 'Notas'}
              </label>
              <textarea
                value={manualForm.notes}
                onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder={t('correction_notes_placeholder') || 'Notas sobre la corrección...'}
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleCloseAddModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {t('cancel') || 'Cancelar'}
              </button>
              <button
                onClick={handleAddManualEntry}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? t('saving') || 'Guardando...' : t('add') || 'Agregar'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal para editar registro */}
        <Modal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          title={t('edit_record') || 'Editar Registro'}
        >
          {editingEntry && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>{t('employee')}:</strong> {editingEntry.employee_name} ({editingEntry.employee_code})
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>{t('type')}:</strong> {getRecordTypeLabel(editingEntry.record_type, t)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>{t('current_time') || 'Hora actual'}:</strong>{' '}
                  {(() => {
                    const dateTime = editingEntry.record_time || editingEntry.timestamp;
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
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('new_time') || 'Nueva Hora'} *
                </label>
                <input
                  type="datetime-local"
                  value={editForm.new_record_time}
                  onChange={(e) => setEditForm({ ...editForm, new_record_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('notes') || 'Notas'}
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder={t('correction_notes_placeholder') || 'Notas sobre la corrección...'}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleCloseEditModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {t('cancel') || 'Cancelar'}
                </button>
                <button
                  onClick={handleUpdateEntry}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? t('saving') || 'Guardando...' : t('save') || 'Guardar'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default TimeEntry;
