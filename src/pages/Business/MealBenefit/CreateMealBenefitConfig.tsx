import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import mealBenefitService from '../../../services/meal-benefit.service';
import { EmployeeType } from '../../../types';
import { Info, Save } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

const CreateMealBenefitConfig = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const employeeTypeLabels: Record<EmployeeType, string> = {
    hourly_tipped_waiter: t('employee_type_hourly_tipped_waiter'),
    hourly_tipped_delivery: t('employee_type_hourly_tipped_delivery'),
    hourly_fixed: t('employee_type_hourly_fixed'),
    exempt_salary: t('employee_type_exempt_salary'),
  };

  const [formData, setFormData] = useState({
    config_name: '',
    employee_type: 'hourly_tipped_waiter' as EmployeeType,
    min_hours_threshold: '6.00',
    credit_amount: '15.00',
    effective_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: '',
  });

  useEffect(() => {
    if (isEdit && id) {
      loadConfig(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, id]);

  const loadConfig = async (configId: string) => {
    setLoadingData(true);
    try {
      const config = await mealBenefitService.getConfigById(configId);
      setFormData({
        config_name: config.config_name,
        employee_type: config.employee_type,
        min_hours_threshold: config.min_hours_threshold.toString(),
        credit_amount: config.credit_amount.toString(),
        effective_date: config.effective_date.split('T')[0],
        end_date: config.end_date ? config.end_date.split('T')[0] : '',
        notes: config.notes || '',
      });
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
      navigate('/business/meal-benefit');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const minHours = parseFloat(formData.min_hours_threshold);
    const creditAmount = parseFloat(formData.credit_amount);

    if (minHours < 0) {
      showToast(t('meal_benefit_min_hours_negative'), 'error');
      return;
    }

    if (creditAmount <= 0) {
      showToast(t('meal_benefit_credit_positive'), 'error');
      return;
    }

    if (formData.end_date && formData.end_date < formData.effective_date) {
      showToast(t('meal_benefit_end_before_start'), 'error');
      return;
    }

    setLoading(true);

    try {
      const data: any = {
        config_name: formData.config_name,
        employee_type: formData.employee_type,
        min_hours_threshold: minHours,
        credit_amount: creditAmount,
        effective_date: formData.effective_date,
      };

      if (formData.end_date) data.end_date = formData.end_date;
      if (formData.notes) data.notes = formData.notes;

      if (isEdit && id) {
        await mealBenefitService.updateConfig(id, data);
        showToast(t('meal_benefit_config_updated'), 'success');
      } else {
        await mealBenefitService.createConfig(data);
        showToast(t('meal_benefit_config_created'), 'success');
      }
      navigate('/business/meal-benefit');
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner size="lg" text={t('loading_configuration')} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            {isEdit ? t('edit_configuration') : t('new_configuration_title')}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {isEdit ? t('edit_configuration_subtitle') : t('new_configuration_subtitle')}
          </p>
        </div>

        <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-emerald-800">{t('important_information')}</h3>
              <div className="mt-2 text-sm text-emerald-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>{t('meal_benefit_auto_applies')}</li>
                  <li>
                    {t('meal_benefit_taxable')}
                  </li>
                  <li>{t('meal_benefit_per_period_calc')}</li>
                  <li>
                    {t('meal_benefit_requires_flag')} <code className="bg-emerald-100 px-1 rounded">receives_meal_benefit = TRUE</code>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('config_name_label')} *
            </label>
            <input
              type="text"
              value={formData.config_name}
              onChange={(e) => setFormData({ ...formData, config_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder={t('config_name_placeholder')}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{t('config_name_description')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('employee_type_label')} *
            </label>
            <select
              value={formData.employee_type}
              onChange={(e) => setFormData({ ...formData, employee_type: e.target.value as EmployeeType })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
              disabled={isEdit}
            >
              {(Object.keys(employeeTypeLabels) as EmployeeType[]).map((type) => (
                <option key={type} value={type}>
                  {employeeTypeLabels[type]}
                </option>
              ))}
            </select>
            {isEdit && (
              <p className="text-xs text-gray-500 mt-1">{t('employee_type_cannot_modify')}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('min_hours_label')} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.min_hours_threshold}
                onChange={(e) => setFormData({ ...formData, min_hours_threshold: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">{t('min_hours_description')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('credit_amount_label')} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.credit_amount}
                onChange={(e) => setFormData({ ...formData, credit_amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">{t('credit_amount_description')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('start_date_label')} *
              </label>
              <input
                type="date"
                value={formData.effective_date}
                onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('end_date_label')}
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                min={formData.effective_date}
              />
              <p className="text-xs text-gray-500 mt-1">{t('end_date_description')}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('notes_label')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder={t('notes_placeholder')}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/business/meal-benefit')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  {isEdit ? t('saving') : t('creating')}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isEdit ? t('save_changes') : t('create_configuration')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateMealBenefitConfig;

