import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import mealBenefitService from '../../../services/meal-benefit.service';
import { MealBenefitConfig as MealBenefitConfigType, EmployeeType } from '../../../types';
import { Settings, Info, Plus, Edit2, Trash2, Calendar, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

const MealBenefitConfig = () => {
  const [configs, setConfigs] = useState<MealBenefitConfigType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmployeeType, setSelectedEmployeeType] = useState<EmployeeType | ''>('');
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t, language } = useLanguage();

  const employeeTypeLabels: Record<EmployeeType, string> = {
    hourly_tipped_waiter: 'Mesero (Con Tip Credit)',
    hourly_tipped_delivery: 'Delivery (Con Tip Credit)',
    hourly_fixed: 'Por Hora (Sin Tip Credit)',
    exempt_salary: 'Salario Exento',
  };

  const parseNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const normalized = typeof value === 'string' ? value.replace(/,/g, '') : String(value);
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatCurrency = (value: any) =>
    new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(parseNumber(value));

  useEffect(() => {
    loadConfigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recargar cuando se regresa de crear/editar
  useEffect(() => {
    const handleFocus = () => {
      loadConfigs();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const all = await mealBenefitService.listConfigs(undefined, true, false);
      console.log('Response from backend:', all);
      
      // Manejar diferentes formatos de respuesta
      let normalizedConfigs: MealBenefitConfigType[] = [];
      if (Array.isArray(all)) {
        normalizedConfigs = all;
      } else if (all && typeof all === 'object') {
        // Si viene como objeto con propiedades
        if (Array.isArray((all as any).items)) {
          normalizedConfigs = (all as any).items;
        } else if (Array.isArray((all as any).configs)) {
          normalizedConfigs = (all as any).configs;
        } else if (Array.isArray((all as any).data)) {
          normalizedConfigs = (all as any).data;
        }
      }
      
      console.log('Normalized configs:', normalizedConfigs);
      setConfigs(normalizedConfigs);
      
      if (normalizedConfigs.length === 0) {
        console.log('No configs found. Check backend response format.');
      }
    } catch (error: any) {
      console.error('Error loading configs:', error);
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (configId: string) => {
    if (!window.confirm(t('tip_credit_deactivate_confirm'))) {
      return;
    }

    try {
      await mealBenefitService.deleteConfig(configId);
      showToast(t('tip_credit_deactivate_success'), 'success');
      loadConfigs();
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    }
  };

  const filteredConfigs = selectedEmployeeType
    ? configs.filter((c) => c.employee_type === selectedEmployeeType)
    : configs;

  const activeConfigs = filteredConfigs.filter((c) => c.is_active);
  const inactiveConfigs = filteredConfigs.filter((c) => !c.is_active);

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {t('meal_benefit_config_title')}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('meal_benefit_config_subtitle')}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <button
              onClick={loadConfigs}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              <RefreshCw className={`-ml-1 mr-2 h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              Recargar
            </button>
            <button
              onClick={() => navigate('/business/meal-benefit/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              {t('meal_benefit_new_config_button')}
            </button>
          </div>
        </div>

        {/* Filtro por tipo de empleado */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('meal_benefit_filter_by_type')}
          </label>
          <select
            value={selectedEmployeeType}
            onChange={(e) => setSelectedEmployeeType(e.target.value as EmployeeType | '')}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">{t('meal_benefit_all_types')}</option>
            {(Object.keys(employeeTypeLabels) as EmployeeType[]).map((type) => (
              <option key={type} value={type}>
                {employeeTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>

        {/* Información */}
        <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 mb-6 rounded">
          <div className="flex">
            <Info className="h-5 w-5 text-emerald-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-emerald-800">{t('meal_benefit_how_it_works')}</h3>
              <div className="mt-2 text-sm text-emerald-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>{t('meal_benefit_auto_calculated')}</li>
                  <li>{t('meal_benefit_requires_flag')}</li>
                  <li>{t('meal_benefit_min_hours_description')}</li>
                  <li>{t('meal_benefit_taxable')}</li>
                  <li>{t('meal_benefit_per_period')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Configuraciones Activas */}
        {activeConfigs.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('meal_benefit_active_configs')}</h3>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('meal_benefit_config_name')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('meal_benefit_employee_type')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('meal_benefit_min_hours')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('meal_benefit_credit')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('meal_benefit_effective_dates')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('meal_benefit_source')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeConfigs.map((config) => (
                    <tr key={config.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{config.config_name}</div>
                        {config.notes && (
                          <div className="text-xs text-gray-500 mt-1">{config.notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          {employeeTypeLabels[config.employee_type]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {parseNumber(config.min_hours_threshold).toFixed(2)} hrs
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">
                        {formatCurrency(config.credit_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <div>
                            <div>
                              {t('meal_benefit_from')}: {new Date(config.effective_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
                            </div>
                            {config.end_date && (
                              <div className="text-xs">
                                {t('meal_benefit_to')}: {new Date(config.end_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {config.tenant_id ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {t('meal_benefit_tenant')}
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            {t('meal_benefit_global')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => navigate(`/business/meal-benefit/edit/${config.id}`)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          {t('meal_benefit_edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(config.id)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('meal_benefit_deactivate')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Configuraciones Inactivas */}
        {inactiveConfigs.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('meal_benefit_inactive_configs')}</h3>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg opacity-75">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo de Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horas Mínimas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Crédito
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fechas Vigentes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inactiveConfigs.map((config) => (
                    <tr key={config.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-500">{config.config_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-500">
                          {employeeTypeLabels[config.employee_type]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {parseNumber(config.min_hours_threshold).toFixed(2)} hrs
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(config.credit_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(config.effective_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
                        {config.end_date && ` - ${new Date(config.end_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Estado vacío */}
        {!loading && filteredConfigs.length === 0 && (
            <div className="text-center py-12 bg-white shadow rounded-lg">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">
              {configs.length === 0 
                ? t('meal_benefit_no_configs')
                : selectedEmployeeType 
                  ? t('meal_benefit_no_configs')
                  : t('meal_benefit_no_configs')}
            </p>
            {configs.length === 0 && (
              <p className="text-sm text-gray-500 mb-4">
                {t('meal_benefit_create_first')}
              </p>
            )}
            <button
              onClick={() => navigate('/business/meal-benefit/create')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              {configs.length === 0 ? t('meal_benefit_create_config') : t('meal_benefit_new_config_button')}
            </button>
            <button
              onClick={loadConfigs}
              className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="-ml-1 mr-2 h-5 w-5" />
              Recargar
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MealBenefitConfig;

