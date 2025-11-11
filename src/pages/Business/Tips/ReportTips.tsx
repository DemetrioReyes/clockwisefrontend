import React, { useState, useEffect } from 'react';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getEmployees } from '../../../services/employee.service';
import { deductionsService } from '../../../services/deductions.service';
import { formatErrorMessage } from '../../../services/api';
import { Employee, Incident } from '../../../types';

const ReportTips: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [incidentType, setIncidentType] = useState<'tip' | 'bonus' | 'food_gift'>('tip');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const { showToast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      loadIncidents(selectedEmployee);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployee]);

  const loadEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
      if (data.length > 0) {
        setSelectedEmployee(data[0].id);
      }
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    }
  };

  const loadIncidents = async (employeeId: string) => {
    setLoadingHistory(true);
    try {
      const data = await deductionsService.getEmployeeIncidents(employeeId);
      setIncidents(data);
    } catch (error: any) {
      console.log('Error cargando incidentes:', error);
      setIncidents([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployee || !amount) {
      showToast(t('please_complete_all_fields'), 'error');
      return;
    }

    setLoading(true);

    try {
      if (incidentType === 'tip') {
        await deductionsService.reportTips(selectedEmployee, parseFloat(amount), date, date, description);
        showToast(t('tips_reported_successfully'), 'success');
      } else if (incidentType === 'bonus') {
        await deductionsService.createIncident({
          employee_id: selectedEmployee,
          incident_type: 'bonus',
          incident_name: t('bonus_label'),
          amount: parseFloat(amount),
          description: description || t('bonus_label'),
          incident_date: date,
        });
        showToast(t('bonus_added_successfully'), 'success');
      } else {
        try {
          await deductionsService.createIncident({
            employee_id: selectedEmployee,
            incident_type: 'food_gift',
            incident_name: t('food_gift_label'),
            amount: parseFloat(amount),
            description: description || t('food_gift_label'),
            incident_date: date,
          });
          showToast(t('food_gift_reported_successfully'), 'success');
        } catch (error: any) {
          if (error?.response?.status === 422) {
            await deductionsService.createIncident({
              employee_id: selectedEmployee,
              incident_type: 'other',
              incident_name: `${t('food_gift_label')} (fallback)`,
              amount: parseFloat(amount),
              description: `${description ? `${description} ` : ''}[FOOD_GIFT]`,
              incident_date: date,
            });
            showToast(t('food_gift_reported_with_fallback'), 'info');
          } else {
            throw error;
          }
        }
      }

      // Reset form
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);

      // Recargar historial
      await loadIncidents(selectedEmployee);
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const getIncidentTypeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      bonus: t('bonus_label'),
      penalty: t('penalty_label'),
      tips_reported: t('tips_reported_label'),
      food_gift: t('food_gift_label'),
      warning: t('warning_label'),
      advance: t('advance_label'),
      other: t('other_label'),
    };
    return labels[type] || type;
  };

  const getIncidentTypeBadgeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      bonus: 'bg-green-100 text-green-800',
      penalty: 'bg-red-100 text-red-800',
      tips_reported: 'bg-blue-100 text-blue-800',
      food_gift: 'bg-emerald-100 text-emerald-800',
      warning: 'bg-yellow-100 text-yellow-800',
      advance: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const selectedEmployeeData = employees.find(e => e.id.toString() === selectedEmployee);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {t('tips_incidents_subtitle')}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('tips_incidents_description')}
            </p>
          </div>
        </div>

        {/* Selector de Empleado Global */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-2">
            {t('employee')} *
          </label>
          <select
            id="employee"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          >
            <option value="">{t('select_employee_placeholder_tips')}</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.employee_code} - {emp.first_name} {emp.last_name} ({emp.position})
              </option>
            ))}
          </select>
          {selectedEmployeeData?.has_tip_credit && (
            <p className="text-sm text-blue-600 mt-1">
              {t('employee_has_tip_credit')}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">{t('report_new')}</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo de Incidente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('type')}
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="tip"
                      checked={incidentType === 'tip'}
                      onChange={() => setIncidentType('tip')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">{t('tips')}</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="bonus"
                      checked={incidentType === 'bonus'}
                      onChange={() => setIncidentType('bonus')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">{t('bonus')}</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="food_gift"
                      checked={incidentType === 'food_gift'}
                      onChange={() => setIncidentType('food_gift')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">{t('food_gift_label')}</span>
                  </label>
                </div>
              </div>

              {/* Monto */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('amount')} *
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="amount"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Fecha */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('date')} *
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>

              {/* Descripción */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('description')}
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={
                    incidentType === 'tip'
                      ? t('tips_notes_placeholder')
                      : incidentType === 'bonus'
                        ? t('bonus_reason_placeholder')
                        : t('food_gift_notes_placeholder')
                  }
                />
              </div>

              <button
                type="submit"
                disabled={loading || !selectedEmployee}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">{t('saving')}</span>
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {incidentType === 'tip' ? t('report_tips_label') : t('report_bonus_label')}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Historial */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">{t('incident_history')}</h3>
            {loadingHistory ? (
              <LoadingSpinner />
            ) : incidents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">{t('no_incidents_registered')}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {incidents.map((incident) => (
                  <div key={incident.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getIncidentTypeBadgeColor(incident.incident_type)}`}>
                        {getIncidentTypeLabel(incident.incident_type)}
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        ${incident.amount || '0.00'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">{incident.incident_name}</p>
                    <p className="text-sm text-gray-600 mb-1">{incident.description || '-'}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(incident.incident_date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReportTips;
