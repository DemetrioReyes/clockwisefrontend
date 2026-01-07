import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import { tipcreditService } from '../../../services/tipcredit.service';
import { TipCreditConfig as TipCreditConfigType, TipCreditConfigResponse } from '../../../types';
import { DollarSign, Settings, Info, Edit2, Trash2 } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import Modal from '../../../components/Common/Modal';

const TipCreditConfig = () => {
  const [currentConfig, setCurrentConfig] = useState<TipCreditConfigResponse | null>(null);
  const [configs, setConfigs] = useState<TipCreditConfigType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<TipCreditConfigType | null>(null);
  const [deletingConfig, setDeletingConfig] = useState<TipCreditConfigType | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    config_name: '',
    minimum_wage: '',
    cash_wage: '',
    tip_credit_amount: '',
    minimum_tips_threshold: '',
    effective_date: '',
    end_date: '',
    notes: '',
  });
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();

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

  // Función helper para eliminar "2024", "2025" y "(Vigente desde Enero 1)" del nombre de configuración
  const formatConfigName = (name: string): string => {
    return name
      .replace(/2024/g, '')
      .replace(/2025/g, '')
      .replace(/\(Vigente desde Enero 1\)/g, '') // Eliminar texto de vigencia
      .replace(/\s*-\s*-/g, '-') // Eliminar guiones dobles
      .replace(/\s+/g, ' ') // Reemplazar múltiples espacios con uno solo
      .replace(/\s*-\s*/g, ' - ') // Normalizar espacios alrededor de guiones
      .trim();
  };

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const all = await tipcreditService.listConfigs(false, false); // false para NO incluir globales, false para mostrar TODAS (activas e inactivas) del tenant
      
      // Manejar respuesta paginada o array directo
      const normalizedConfigs = Array.isArray(all)
        ? all
        : Array.isArray((all as any)?.configs)
          ? (all as any).configs
          : Array.isArray((all as any)?.items)
            ? (all as any).items
            : [];
      setConfigs(normalizedConfigs);
      
      // Usar la última configuración del tenant (primera en la lista ordenada por fecha DESC) para la barra azul
      if (normalizedConfigs.length > 0) {
        const lastConfig = normalizedConfigs[0]; // Primera = más reciente
        // Crear un objeto compatible con CurrentTipCreditResponse
        setCurrentConfig({
          config: lastConfig,
          is_global: false,
          source: 'tenant'
        } as any);
      } else {
        setCurrentConfig(null);
      }
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (config: TipCreditConfigType) => {
    setEditingConfig(config);
    setEditForm({
      config_name: config.config_name || '',
      minimum_wage: config.minimum_wage?.toString() || '',
      cash_wage: config.cash_wage?.toString() || '',
      tip_credit_amount: config.tip_credit_amount?.toString() || '',
      minimum_tips_threshold: config.minimum_tips_threshold?.toString() || '',
      effective_date: config.effective_date ? new Date(config.effective_date).toISOString().split('T')[0] : '',
      end_date: config.end_date ? new Date(config.end_date).toISOString().split('T')[0] : '',
      notes: config.notes || '',
    });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingConfig(null);
    setEditForm({
      config_name: '',
      minimum_wage: '',
      cash_wage: '',
      tip_credit_amount: '',
      minimum_tips_threshold: '',
      effective_date: '',
      end_date: '',
      notes: '',
    });
  };

  const handleUpdateConfig = async () => {
    if (!editingConfig) return;

    const minWage = parseFloat(editForm.minimum_wage);
    const cashWage = parseFloat(editForm.cash_wage);
    const tipCredit = parseFloat(editForm.tip_credit_amount);

    // Validación: cash_wage + tip_credit_amount debe = minimum_wage
    if (Math.abs((cashWage + tipCredit) - minWage) > 0.01) {
      showToast('Error: Cash Wage + Tip Credit debe ser igual a Salario Mínimo', 'error');
      return;
    }

    setSaving(true);
    try {
      const updateData: any = {
        config_name: editForm.config_name,
        minimum_wage: minWage,
        cash_wage: cashWage,
        tip_credit_amount: tipCredit,
      };

      if (editForm.minimum_tips_threshold) {
        updateData.minimum_tips_threshold = parseFloat(editForm.minimum_tips_threshold);
      }
      if (editForm.end_date) {
        updateData.end_date = editForm.end_date;
      }
      if (editForm.notes) {
        updateData.notes = editForm.notes;
      }

      await tipcreditService.updateConfig(editingConfig.id, updateData);
      showToast(t('tip_credit_updated_successfully'), 'success');
      handleCloseEditModal();
      loadConfigs();
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteModal = (config: TipCreditConfigType) => {
    setDeletingConfig(config);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingConfig(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingConfig) return;

    // Verificar que no sea una configuración global
    if (deletingConfig.tenant_id === '0000' || !deletingConfig.tenant_id) {
      showToast('No se pueden eliminar configuraciones globales del sistema', 'error');
      handleCloseDeleteModal();
      return;
    }

    setDeleting(true);
    try {
      await tipcreditService.deleteConfig(deletingConfig.id);
      showToast(t('tip_credit_deleted_successfully'), 'success');
      handleCloseDeleteModal();
      loadConfigs();
    } catch (error: any) {
      console.error('Error eliminando configuración:', error);
      console.error('Response:', error.response?.data);
      const errorMessage = formatErrorMessage(error);
      showToast(errorMessage, 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  {!currentConfig.is_global && (
                    <span className="ml-3 px-2 py-1 bg-green-400 text-white text-xs rounded-full">
                      Tenant
                    </span>
                  )}
                </div>
                <p className="text-blue-100 text-sm mb-4">{formatConfigName(currentConfig.config.config_name)}</p>
                
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
                      {new Date(currentConfig.config.effective_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Configuraciones */}
        <div className="bg-white shadow sm:rounded-lg">
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
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
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
                      <div className="text-sm font-medium text-gray-900">{formatConfigName(config.config_name)}</div>
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
                      <div>{new Date(config.effective_date).toLocaleDateString('en-US')}</div>
                      {config.end_date && (
                        <div className="text-xs text-gray-400">
                          {t('tip_credit_until_label')}: {new Date(config.end_date).toLocaleDateString('en-US')}
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
                      <div className="flex items-center gap-3">
                        {/* Solo mostrar botones para configuraciones del tenant (no globales '0000') */}
                        {config.tenant_id && config.tenant_id !== '0000' && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleOpenEditModal(config);
                              }}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                              title={t('edit_tip_credit')}
                            >
                              <Edit2 className="w-4 h-4" />
                              {t('edit')}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleOpenDeleteModal(config);
                              }}
                              className="text-red-600 hover:text-red-900 flex items-center gap-1"
                              title={t('delete_tip_credit')}
                            >
                              <Trash2 className="w-4 h-4" />
                              {t('delete')}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de edición */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title={t('edit_tip_credit_config')}
      >
        <div className="p-6">
          {editingConfig && (
            <>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Validación Importante</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Cash Wage + Tip Credit Amount DEBE ser igual a Minimum Wage</p>
                      <p className="mt-1 font-semibold">
                        Verificación: ${editForm.cash_wage || '0'} + ${editForm.tip_credit_amount || '0'} = $
                        {(parseFloat(editForm.cash_wage || '0') + parseFloat(editForm.tip_credit_amount || '0')).toFixed(2)} 
                        {Math.abs((parseFloat(editForm.cash_wage || '0') + parseFloat(editForm.tip_credit_amount || '0')) - parseFloat(editForm.minimum_wage || '0')) < 0.01 ? ' ✓' : ' ✗ (debe ser $' + editForm.minimum_wage + ')'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('tip_credit_config_name')}
                  </label>
                  <input
                    type="text"
                    value={editForm.config_name}
                    onChange={(e) => setEditForm({ ...editForm, config_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('tip_credit_minimum_wage_label')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.minimum_wage}
                      onChange={(e) => setEditForm({ ...editForm, minimum_wage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('tip_credit_cash_wage_label')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.cash_wage}
                      onChange={(e) => setEditForm({ ...editForm, cash_wage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('tip_credit_tip_credit_label')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.tip_credit_amount}
                      onChange={(e) => setEditForm({ ...editForm, tip_credit_amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('tip_credit_minimum_tips_threshold')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.minimum_tips_threshold}
                    onChange={(e) => setEditForm({ ...editForm, minimum_tips_threshold: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('optional')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('tip_credit_effective_date')}
                    </label>
                    <input
                      type="date"
                      value={editForm.effective_date}
                      onChange={(e) => setEditForm({ ...editForm, effective_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('tip_credit_end_date')} ({t('optional')})
                    </label>
                    <input
                      type="date"
                      value={editForm.end_date}
                      onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('notes')} ({t('optional')})
                  </label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('tip_credit_notes_placeholder')}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                  disabled={saving}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleUpdateConfig}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? t('saving') : t('save')}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal de confirmación para eliminar */}
      <Modal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        title={t('delete_tip_credit')}
      >
        <div className="p-4">
          {deletingConfig && (
            <>
              <p className="text-gray-700 mb-4">
                {t('tip_credit_delete_confirm', { name: formatConfigName(deletingConfig.config_name) })}
              </p>
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      Esta acción no se puede deshacer. La configuración será eliminada permanentemente.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseDeleteModal}
                  disabled={deleting}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deleting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      {t('deleting')}
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      {t('delete')}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </Layout>
  );
};

export default TipCreditConfig;

