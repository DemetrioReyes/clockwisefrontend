import React, { useState, useEffect } from 'react';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatErrorMessage } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import employeeService from '../../../services/employee.service';
import { TimeEntry as TimeEntryType, Business, TimeSummary, Employee, TimeEntryManualCreate, TimeEntryUpdate, TimeEntryDelete } from '../../../types';
import { Clock, Camera, Calendar, Users, Edit2, Plus, Trash2, ArrowRight, ArrowDown, Minus, CheckCircle2, XCircle, Coffee, PlayCircle, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import Modal from '../../../components/Common/Modal';
import { formatDateTimeUS } from '../../../utils/dateFormat';

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
  const { t, language } = useLanguage();

  // Función para traducir mensajes del backend
  const translateBackendMessage = (message: string | null | undefined): string => {
    if (!message) return '';
    
    // Mensajes comunes del backend que necesitan traducción
    const messageTranslations: Record<string, string> = {
      'falta check-out del día anterior': t('message_missing_checkout_previous_day'),
      'Necesita corrección - falta check-out del día anterior': t('message_missing_checkout_previous_day'),
      'needs correction - missing check-out from previous day': t('message_missing_checkout_previous_day'),
    };
    
    // Buscar traducción exacta o parcial
    const normalizedMessage = message.trim();
    if (messageTranslations[normalizedMessage]) {
      return messageTranslations[normalizedMessage];
    }
    
    // Si el mensaje contiene "falta check-out", traducirlo
    if (normalizedMessage.toLowerCase().includes('falta check-out') || 
        normalizedMessage.toLowerCase().includes('missing check-out')) {
      return t('message_missing_checkout_previous_day');
    }
    
    // Si el idioma es inglés pero el mensaje está en español, intentar traducir patrones comunes
    if (language === 'en' && /[áéíóúñ]/.test(normalizedMessage)) {
      // Patrones comunes en español
      if (normalizedMessage.includes('falta check-out')) {
        return t('message_missing_checkout_previous_day');
      }
    }
    
    // Si no hay traducción, retornar el mensaje original
    return message;
  };
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntryType | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<TimeEntryType | null>(null);
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
  const [deleteForm, setDeleteForm] = useState<TimeEntryDelete>({
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Estados para colapsar/expandir
  const [expandedEmployees, setExpandedEmployees] = useState<Record<string, boolean>>({});
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    start_date: '',
    end_date: '',
  });

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

      // Calcular horas por día y agrupar por semana
      const dailyHours: Record<string, number> = {};
      const weeklyHours: Record<string, number> = {};

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
            
            // Solo contar horas positivas (ignorar errores de datos)
            if (hours > 0) {
              dailyHours[date] = hours;
              totalHours += hours;

              // Calcular semana (lunes a domingo)
              const checkInDate = new Date(checkInTime);
              const dayOfWeek = checkInDate.getDay(); // 0 = domingo, 1 = lunes, etc.
              const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convertir domingo a 6
              const monday = new Date(checkInDate);
              monday.setDate(checkInDate.getDate() - daysSinceMonday);
              monday.setHours(0, 0, 0, 0);
              const weekKey = monday.toISOString().split('T')[0];

              if (!weeklyHours[weekKey]) {
                weeklyHours[weekKey] = 0;
              }
              weeklyHours[weekKey] += hours;
            }
          }
        }
      });

      // Calcular regular y overtime por semana (40 horas semanales)
      const OVERTIME_THRESHOLD = 40; // Horas semanales antes de overtime
      Object.values(weeklyHours).forEach((weekTotal) => {
        if (weekTotal <= OVERTIME_THRESHOLD) {
          // Todas las horas de la semana son regulares
          regularHours += weekTotal;
        } else {
          // Las primeras 40 horas son regulares, el resto es overtime
          regularHours += OVERTIME_THRESHOLD;
          overtimeHours += (weekTotal - OVERTIME_THRESHOLD);
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

  const handleOpenDeleteModal = (entry: TimeEntryType) => {
    setDeletingEntry(entry);
    setDeleteForm({ notes: '' });
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingEntry(null);
    setDeleteForm({ notes: '' });
  };

  const handleDeleteEntry = async () => {
    if (!deletingEntry) {
      return;
    }

    setDeleting(true);
    try {
      await employeeService.deleteTimeEntry(deletingEntry.id, deleteForm);
      showToast(t('record_deleted_successfully') || 'Registro eliminado exitosamente', 'success');
      handleCloseDeleteModal();
      loadTimeEntries();
    } catch (error: any) {
      const errorMessage = formatErrorMessage(error);
      showToast(errorMessage, 'error');
    } finally {
      setDeleting(false);
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

  const toggleEmployee = (employeeKey: string) => {
    setExpandedEmployees(prev => ({
      ...prev,
      [employeeKey]: !prev[employeeKey]
    }));
  };

  const toggleDay = (dayKey: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayKey]: !prev[dayKey]
    }));
  };

  // Expandir automáticamente el primer empleado y el primer día al cargar
  useEffect(() => {
    if (timeEntries.length > 0 && Object.keys(expandedEmployees).length === 0) {
      const firstEntry = timeEntries[0];
      const employeeKey = `${firstEntry.employee_id}_${firstEntry.employee_name}`;
      const dateTime = firstEntry.record_time || firstEntry.timestamp;
      if (dateTime) {
        const date = new Date(dateTime).toISOString().split('T')[0];
        const dayKey = `${employeeKey}_${date}`;
        setExpandedEmployees({ [employeeKey]: true });
        setExpandedDays({ [dayKey]: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeEntries]);

  // Filtrar registros por fecha si hay filtros aplicados
  const getFilteredEntries = () => {
    if (!dateFilter.start_date && !dateFilter.end_date) {
      return timeEntries;
    }
    
    return timeEntries.filter(entry => {
      const dateTime = entry.record_time || entry.timestamp;
      if (!dateTime) return false;
      
      const entryDate = new Date(dateTime).toISOString().split('T')[0];
      
      if (dateFilter.start_date && entryDate < dateFilter.start_date) {
        return false;
      }
      if (dateFilter.end_date && entryDate > dateFilter.end_date) {
        return false;
      }
      
      return true;
    });
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

        {/* Lista de Registros Detallados - Vista Moderna */}
        {timeEntries.length > 0 && (
        <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock className="w-6 h-6" />
                {t('detailed_time_records')}
              </h2>
              <p className="text-sm text-blue-100 mt-1">
                {t('total_records', { count: timeEntries.length })}
              </p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4" />
              <span className="font-semibold">{t('add_manual_record') || 'Agregar Registro Manual'}</span>
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="p-6">
              {/* Filtros de Fecha */}
              <div className="mb-6">
                <button
                  onClick={() => setShowDateFilter(!showDateFilter)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
                >
                  <Filter className="w-4 h-4" />
                  {showDateFilter ? 'Ocultar Filtros' : 'Filtrar por Fecha'}
                </button>
                
                {showDateFilter && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha Inicio
                      </label>
                      <input
                        type="date"
                        value={dateFilter.start_date}
                        onChange={(e) => setDateFilter({ ...dateFilter, start_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha Fin
                      </label>
                      <input
                        type="date"
                        value={dateFilter.end_date}
                        onChange={(e) => setDateFilter({ ...dateFilter, end_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => setDateFilter({ start_date: '', end_date: '' })}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Limpiar
                    </button>
                  </div>
                )}
              </div>

              {(() => {
                const filteredEntries = getFilteredEntries();
                
                if (filteredEntries.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg font-medium">
                        {dateFilter.start_date || dateFilter.end_date 
                          ? 'No hay registros en el rango de fechas seleccionado'
                          : 'No hay registros de tiempo disponibles'}
                      </p>
                    </div>
                  );
                }

                // Agrupar registros por empleado y día
                const groupedEntries: Record<string, Record<string, TimeEntryType[]>> = {};
                
                filteredEntries.forEach((entry) => {
                  const employeeKey = `${entry.employee_id}_${entry.employee_name}`;
                  const dateTime = entry.record_time || entry.timestamp;
                  if (!dateTime) return;
                  
                  const date = new Date(dateTime).toISOString().split('T')[0];
                  
                  if (!groupedEntries[employeeKey]) {
                    groupedEntries[employeeKey] = {};
                  }
                  if (!groupedEntries[employeeKey][date]) {
                    groupedEntries[employeeKey][date] = [];
                  }
                  groupedEntries[employeeKey][date].push(entry);
                });

                // Ordenar registros dentro de cada día por tiempo
                Object.keys(groupedEntries).forEach((employeeKey) => {
                  Object.keys(groupedEntries[employeeKey]).forEach((date) => {
                    groupedEntries[employeeKey][date].sort((a, b) => {
                      const timeA = new Date(a.record_time || a.timestamp || 0).getTime();
                      const timeB = new Date(b.record_time || b.timestamp || 0).getTime();
                      return timeA - timeB;
                    });
                  });
                });

                return (
                  <div className="space-y-6">
                    {Object.entries(groupedEntries).map(([employeeKey, dates]) => {
                      const [employeeId, employeeName] = employeeKey.split('_');
                      const firstEntry = Object.values(dates)[0]?.[0];
                      const employeeCode = firstEntry?.employee_code || '';
                      
                      const isEmployeeExpanded = expandedEmployees[employeeKey] ?? false;
                      const daysCount = Object.keys(dates).length;
                      const totalRecords = Object.values(dates).reduce((sum, dayEntries) => sum + dayEntries.length, 0);

                      return (
                        <div key={employeeKey} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                          {/* Header del Empleado - Clickeable */}
                          <button
                            onClick={() => toggleEmployee(employeeKey)}
                            className="w-full flex items-center justify-between p-6 hover:bg-blue-100/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg">
                                <Users className="w-6 h-6 text-white" />
                              </div>
                              <div className="text-left">
                                <h3 className="text-lg font-bold text-gray-900">{employeeName}</h3>
                                <p className="text-sm text-gray-600">{employeeCode}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {daysCount} {daysCount === 1 ? 'día' : 'días'} • {totalRecords} {totalRecords === 1 ? 'registro' : 'registros'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isEmployeeExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-600" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-600" />
                              )}
                            </div>
                          </button>

                          {/* Contenido del Empleado - Colapsable */}
                          {isEmployeeExpanded && (
                          <div className="px-6 pb-6">

                            {/* Registros por Día */}
                            <div className="space-y-3">
                              {Object.entries(dates)
                                .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                                .map(([date, entries]) => {
                                  const dayKey = `${employeeKey}_${date}`;
                                  const isDayExpanded = expandedDays[dayKey] ?? false;
                                  const dateObj = new Date(date);
                                  const formattedDate = dateObj.toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  });
                                  const shortDate = dateObj.toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  });

                                  // Encontrar pares de registros relacionados
                                  const checkIn = entries.find(e => e.record_type === 'check_in');
                                  const checkOut = entries.find(e => e.record_type === 'check_out');
                                  const breaks = entries.filter(e => 
                                    e.record_type === 'break_start' || e.record_type === 'break_end'
                                  );

                                  return (
                                    <div key={date} className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
                                      {/* Header del Día - Clickeable */}
                                      <button
                                        onClick={() => toggleDay(dayKey)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                      >
                                        <div className="flex items-center gap-3">
                                          <Calendar className="w-5 h-5 text-blue-600" />
                                          <div className="text-left">
                                            <h4 className="font-semibold text-gray-900">{formattedDate}</h4>
                                            <p className="text-xs text-gray-500 mt-1">
                                              {entries.length} {entries.length === 1 ? 'registro' : 'registros'}
                                              {breaks.length > 0 && ` • ${breaks.length / 2} ${breaks.length / 2 === 1 ? 'break' : 'breaks'}`}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          {/* Resumen rápido del día */}
                                          {checkIn && checkOut && (
                                            <div className="hidden md:flex items-center gap-2 text-xs text-gray-600">
                                              <CheckCircle2 className="w-3 h-3 text-green-600" />
                                              <span>{new Date(checkIn.record_time || checkIn.timestamp || '').toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                              <ArrowRight className="w-3 h-3" />
                                              <XCircle className="w-3 h-3 text-red-600" />
                                              <span>{new Date(checkOut.record_time || checkOut.timestamp || '').toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                          )}
                                          {isDayExpanded ? (
                                            <ChevronUp className="w-5 h-5 text-gray-600" />
                                          ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-600" />
                                          )}
                                        </div>
                                      </button>

                                      {/* Contenido del Día - Colapsable */}
                                      {isDayExpanded && (
                                      <div className="p-5 pt-0">

                                        {/* Timeline Visual */}
                                        <div className="relative pl-8 space-y-3 mt-4">
                                      {/* Línea vertical de conexión */}
                                      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 via-purple-400 to-green-400"></div>

                                      {entries.map((entry, index) => {
                                        const dateTime = entry.record_time || entry.timestamp;
                                        const time = dateTime ? new Date(dateTime).toLocaleTimeString('en-US', { 
                                          hour: '2-digit', 
                                          minute: '2-digit' 
                                        }) : '-';
                                        
                                        const isCheckIn = entry.record_type === 'check_in';
                                        const isCheckOut = entry.record_type === 'check_out';
                                        const isBreakStart = entry.record_type === 'break_start';
                                        const isBreakEnd = entry.record_type === 'break_end';

                                        // Determinar color y icono según tipo
                                        let bgColor = '';
                                        let icon = null;
                                        let borderColor = '';

                                        if (isCheckIn) {
                                          bgColor = 'bg-gradient-to-br from-green-50 to-emerald-50';
                                          borderColor = 'border-green-400';
                                          icon = <CheckCircle2 className="w-5 h-5 text-green-600" />;
                                        } else if (isCheckOut) {
                                          bgColor = 'bg-gradient-to-br from-red-50 to-pink-50';
                                          borderColor = 'border-red-400';
                                          icon = <XCircle className="w-5 h-5 text-red-600" />;
                                        } else if (isBreakStart) {
                                          bgColor = 'bg-gradient-to-br from-yellow-50 to-orange-50';
                                          borderColor = 'border-yellow-400';
                                          icon = <Coffee className="w-5 h-5 text-yellow-600" />;
                                        } else if (isBreakEnd) {
                                          bgColor = 'bg-gradient-to-br from-blue-50 to-indigo-50';
                                          borderColor = 'border-blue-400';
                                          icon = <PlayCircle className="w-5 h-5 text-blue-600" />;
                                        }

                                        return (
                                          <div key={entry.id} className="relative">
                                            {/* Punto en la línea */}
                                            <div className={`absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 ${borderColor} bg-white shadow-lg z-10`}></div>
                                            
                                            {/* Card del Registro */}
                                            <div className={`ml-6 ${bgColor} rounded-lg p-4 border-2 ${borderColor} shadow-md hover:shadow-lg transition-all`}>
                                              <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3 flex-1">
                                                  <div className="p-2 bg-white rounded-lg shadow-sm">
                                                    {icon}
                                                  </div>
                                                  <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${getRecordTypeBadge(entry.record_type)}`}>
                                                        {getRecordTypeLabel(entry.record_type, t)}
                                                      </span>
                                                      {entry.is_manual_correction && (
                                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                                          {t('manual_correction') || 'Manual'}
                                                        </span>
                                                      )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1">
                                                      <Clock className="w-4 h-4 text-gray-500" />
                                                      {time}
                                                    </div>
                                                    {entry.session_status && (
                                                      <div className="mb-2">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSessionStatusBadge(entry)}`}>
                                                          {getSessionStatusLabel(entry)}
                                                        </span>
                                                      </div>
                                                    )}
                                                    {entry.message && (
                                                      <p className="text-xs text-gray-600 mt-1 italic">
                                                        {translateBackendMessage(entry.message)}
                                                      </p>
                                                    )}
                                                    {(entry.face_confidence || entry.confidence) && (
                                                      <div className="mt-2 flex items-center gap-2">
                                                        <div className="text-xs text-gray-600">
                                                          {t('confidence')}: <span className="font-semibold">{((entry.face_confidence || entry.confidence || 0) * 100).toFixed(1)}%</span>
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                                
                                                {/* Acciones */}
                                                <div className="flex items-center gap-2 ml-4">
                                                  <button
                                                    onClick={() => handleOpenEditModal(entry)}
                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                    title={t('edit_record') || 'Editar registro'}
                                                  >
                                                    <Edit2 className="w-4 h-4" />
                                                  </button>
                                                  <button
                                                    onClick={() => handleOpenDeleteModal(entry)}
                                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                    title={t('delete_record') || 'Eliminar registro'}
                                                  >
                                                    <Trash2 className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>

                                        {/* Resumen del Día */}
                                        {checkIn && checkOut && (
                                          <div className="mt-4 pt-4 border-t border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3">
                                            <div className="flex items-center justify-between text-sm">
                                              <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                  <span className="text-gray-700 font-medium">{t('check_in')}:</span>
                                                  <span className="text-gray-900 font-semibold">
                                                    {new Date(checkIn.record_time || checkIn.timestamp || '').toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                  </span>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-gray-400" />
                                                <div className="flex items-center gap-2">
                                                  <XCircle className="w-4 h-4 text-red-600" />
                                                  <span className="text-gray-700 font-medium">{t('check_out')}:</span>
                                                  <span className="text-gray-900 font-semibold">
                                                    {new Date(checkOut.record_time || checkOut.timestamp || '').toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                  </span>
                                                </div>
                                              </div>
                                              {breaks.length > 0 && (
                                                <div className="text-xs text-gray-600">
                                                  {breaks.length / 2} {t('breaks') || 'breaks'}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
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
                      return formatDateTimeUS(date);
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

        {/* Modal para eliminar registro */}
        <Modal
          isOpen={showDeleteModal}
          onClose={handleCloseDeleteModal}
          title={t('delete_record') || 'Eliminar Registro'}
        >
          {deletingEntry && (
            <div className="space-y-4">
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Trash2 className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      {t('delete_record_warning') || '¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>{t('employee')}:</strong> {deletingEntry.employee_name} ({deletingEntry.employee_code})
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>{t('type')}:</strong> {getRecordTypeLabel(deletingEntry.record_type, t)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>{t('date_time')}:</strong>{' '}
                  {(() => {
                    const dateTime = deletingEntry.record_time || deletingEntry.timestamp;
                    if (!dateTime) return '-';
                    try {
                      const date = new Date(dateTime);
                      if (isNaN(date.getTime())) return '-';
                      return formatDateTimeUS(date);
                    } catch {
                      return '-';
                    }
                  })()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('notes') || 'Notas'} ({t('optional') || 'Opcional'})
                </label>
                <textarea
                  value={deleteForm.notes}
                  onChange={(e) => setDeleteForm({ ...deleteForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-red-500 focus:border-red-500"
                  rows={3}
                  placeholder={t('delete_notes_placeholder') || 'Razón por la que se elimina este registro...'}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleCloseDeleteModal}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {t('cancel') || 'Cancelar'}
                </button>
                <button
                  onClick={handleDeleteEntry}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {deleting ? (
                    <>
                      <LoadingSpinner />
                      <span>{t('deleting_record') || 'Eliminando...'}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>{t('delete') || 'Eliminar'}</span>
                    </>
                  )}
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
