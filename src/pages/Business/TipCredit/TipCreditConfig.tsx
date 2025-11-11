import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import { tipcreditService } from '../../../services/tipcredit.service';
import { TipCreditConfig as TipCreditConfigType, TipCreditConfigResponse } from '../../../types';
import { DollarSign, Settings, Info } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

const TipCreditConfig = () => {
  const [currentConfig, setCurrentConfig] = useState<TipCreditConfigResponse | null>(null);
  const [configs, setConfigs] = useState<TipCreditConfigType[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t, language } = useLanguage();

  const parseNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const normalized = typeof value === 'string' ? value.replace(/,/g, '') : String(value);
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatCurrency = (value: any) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(
      parseNumber(value)
    );

  useEffect(() => {
    loadConfigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const [current, all] = await Promise.all([
        tipcreditService.getCurrentConfig(),
        tipcreditService.listConfigs(true, true),
      ]);
      setCurrentConfig(current);
      const normalizedConfigs = Array.isArray(all)
        ? all
        : Array.isArray((all as any)?.items)
          ? (all as any).items
          : [];
      setConfigs(normalizedConfigs);
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (configId: string) => {
    if (!window.confirm(t('tip_credit_deactivate_confirm'))) {
      return;
    }

    try {
      await tipcreditService.deactivateConfig(configId);
      showToast(t('tip_credit_deactivate_success'), 'success');
      loadConfigs();
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {t('tip_credit_config_title')}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('tip_credit_config_subtitle')}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <button
              onClick={() => navigate('/business/tip-credit/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Settings className="-ml-1 mr-2 h-5 w-5" />
              {t('tip_credit_config_new_button')}
            </button>
            <button
              onClick={() => navigate('/business/tip-credit/calculator')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <DollarSign className="-ml-1 mr-2 h-5 w-5" />
              {t('tip_credit_config_calculator_button')}
            </button>
          </div>
        </div>

        {/* Configuración Vigente */}
        {currentConfig && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 mb-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <Info className="h-5 w-5 mr-2" />
                  <h3 className="text-lg font-semibold">{t('tip_credit_current_title')}</h3>
                  {currentConfig.is_global && (
                    <span className="ml-3 px-2 py-1 bg-blue-400 text-white text-xs rounded-full">
                      {t('tip_credit_global_badge')}
                    </span>
                  )}
                </div>
                <p className="text-blue-100 text-sm mb-4">{currentConfig.config.config_name}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-400 bg-opacity-30 rounded-lg p-3">
                    <p className="text-sm text-blue-100">{t('tip_credit_minimum_wage_label')}</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(currentConfig.config.minimum_wage)}
                      /{t('hours_short_label')}
                    </p>
                  </div>
                  <div className="bg-blue-400 bg-opacity-30 rounded-lg p-3">
                    <p className="text-sm text-blue-100">{t('tip_credit_cash_wage_label')}</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(currentConfig.config.cash_wage)}
                      /{t('hours_short_label')}
                    </p>
                  </div>
                  <div className="bg-blue-400 bg-opacity-30 rounded-lg p-3">
                    <p className="text-sm text-blue-100">{t('tip_credit_tip_credit_label')}</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(currentConfig.config.tip_credit_amount)}
                      /{t('hours_short_label')}
                    </p>
                  </div>
                  <div className="bg-blue-400 bg-opacity-30 rounded-lg p-3">
                    <p className="text-sm text-blue-100">{t('tip_credit_effective_since')}</p>
                    <p className="text-lg font-bold">
                      {new Date(currentConfig.config.effective_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Configuraciones */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {t('tip_credit_configs_header')}
            </h3>
            <p className="text-sm text-gray-500">
              {t('tip_credit_configs_description')}
            </p>
          </div>

          {!Array.isArray(configs) || configs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">{t('tip_credit_empty_state')}</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('tip_credit_column_name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('tip_credit_column_location')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('tip_credit_column_minimum_wage')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('tip_credit_column_cash_wage')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('tip_credit_column_tip_credit')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('tip_credit_column_dates')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('tip_credit_column_type')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('tip_credit_column_actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {configs.map((config) => (
                  <tr key={config.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{config.config_name}</div>
                      {config.notes && (
                        <div className="text-xs text-gray-500">{config.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {config.state}{config.city && ` - ${config.city}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(config.minimum_wage)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatCurrency(config.cash_wage)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-semibold">
                      {formatCurrency(config.tip_credit_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{new Date(config.effective_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}</div>
                      {config.end_date && (
                        <div className="text-xs text-gray-400">
                          {t('tip_credit_until_label')}: {new Date(config.end_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        config.tenant_id ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                      {config.tenant_id ? t('tip_credit_type_tenant') : t('tip_credit_type_global')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {config.tenant_id && config.is_active && (
                        <button
                          onClick={() => handleDeactivate(config.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                        {t('tip_credit_deactivate')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TipCreditConfig;

