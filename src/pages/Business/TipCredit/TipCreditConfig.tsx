import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import { tipcreditService } from '../../../services/tipcredit.service';
import { TipCreditConfig as TipCreditConfigType, TipCreditConfigResponse } from '../../../types';
import { DollarSign, Settings, Info } from 'lucide-react';

const TipCreditConfig = () => {
  const [currentConfig, setCurrentConfig] = useState<TipCreditConfigResponse | null>(null);
  const [configs, setConfigs] = useState<TipCreditConfigType[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const [current, all] = await Promise.all([
        tipcreditService.getCurrentConfig(),
        tipcreditService.listConfigs(true, true),
      ]);
      setCurrentConfig(current);
      setConfigs(all);
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (configId: string) => {
    if (!window.confirm('¿Está seguro de desactivar esta configuración?')) {
      return;
    }

    try {
      await tipcreditService.deactivateConfig(configId);
      showToast('Configuración desactivada exitosamente', 'success');
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
              Configuración de Tip Credit
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              NY State 2025: Valores configurables sin modificar código
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <button
              onClick={() => navigate('/business/tip-credit/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Settings className="-ml-1 mr-2 h-5 w-5" />
              Nueva Configuración
            </button>
            <button
              onClick={() => navigate('/business/tip-credit/calculator')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <DollarSign className="-ml-1 mr-2 h-5 w-5" />
              Calculadora de Shortfall
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
                  <h3 className="text-lg font-semibold">Configuración Vigente</h3>
                  {currentConfig.is_global && (
                    <span className="ml-3 px-2 py-1 bg-blue-400 text-white text-xs rounded-full">
                      Sistema Global
                    </span>
                  )}
                </div>
                <p className="text-blue-100 text-sm mb-4">{currentConfig.config.config_name}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-400 bg-opacity-30 rounded-lg p-3">
                    <p className="text-sm text-blue-100">Salario Mínimo</p>
                    <p className="text-2xl font-bold">${currentConfig.config.minimum_wage.toFixed(2)}/hr</p>
                  </div>
                  <div className="bg-blue-400 bg-opacity-30 rounded-lg p-3">
                    <p className="text-sm text-blue-100">Cash Wage</p>
                    <p className="text-2xl font-bold">${currentConfig.config.cash_wage.toFixed(2)}/hr</p>
                  </div>
                  <div className="bg-blue-400 bg-opacity-30 rounded-lg p-3">
                    <p className="text-sm text-blue-100">Tip Credit</p>
                    <p className="text-2xl font-bold">${currentConfig.config.tip_credit_amount.toFixed(2)}/hr</p>
                  </div>
                  <div className="bg-blue-400 bg-opacity-30 rounded-lg p-3">
                    <p className="text-sm text-blue-100">Vigente Desde</p>
                    <p className="text-lg font-bold">
                      {new Date(currentConfig.config.effective_date).toLocaleDateString()}
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
              Todas las Configuraciones
            </h3>
            <p className="text-sm text-gray-500">
              Historial completo de configuraciones de tip credit
            </p>
          </div>

          {configs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay configuraciones disponibles</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado/Ciudad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salario Mínimo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cash Wage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tip Credit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vigencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
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
                      ${config.minimum_wage.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      ${config.cash_wage.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-semibold">
                      ${config.tip_credit_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{new Date(config.effective_date).toLocaleDateString()}</div>
                      {config.end_date && (
                        <div className="text-xs text-gray-400">
                          Hasta: {new Date(config.end_date).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        config.tenant_id ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {config.tenant_id ? 'Tenant' : 'Global'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {config.tenant_id && config.is_active && (
                        <button
                          onClick={() => handleDeactivate(config.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Desactivar
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

