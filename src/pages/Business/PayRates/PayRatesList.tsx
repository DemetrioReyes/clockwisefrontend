import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import { payratesService } from '../../../services/payrates.service';
import { PayRate } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Trash2 } from 'lucide-react';
import Modal from '../../../components/Common/Modal';

const PayRatesList = () => {
  const [payRates, setPayRates] = useState<PayRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRate, setDeletingRate] = useState<PayRate | null>(null);
  const [deleting, setDeleting] = useState(false);
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
    new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(parseNumber(value));

  useEffect(() => {
    loadPayRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPayRates = async () => {
    setLoading(true);
    try {
      const data = await payratesService.listAllPayRates(false); // Mostrar todas, incluyendo inactivas
      setPayRates(data.pay_rates || data);
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteModal = (rate: PayRate) => {
    setDeletingRate(rate);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingRate(null);
  };

  const handleDeletePayRate = async () => {
    if (!deletingRate) return;

    setDeleting(true);
    try {
      await payratesService.deletePayRate(deletingRate.id);
      showToast(t('pay_rate_deleted_successfully') || 'Pay rate deleted successfully', 'success');
      handleCloseDeleteModal();
      loadPayRates(); // Recargar la lista
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {t('pay_rates_list_title')}
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={() => navigate('/business/pay-rates/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('new_pay_rate_button')}
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            {payRates.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">{t('no_pay_rates_configured')}</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('regular_rate_table')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('overtime_rate_table')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('overtime_threshold_table')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('spread_hours_table')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('effective_date_table')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('status_table_payrate')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payRates.map((rate) => (
                    <tr key={rate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(rate.regular_rate)}/{t('hours_short_label')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(rate.overtime_rate)}/{t('hours_short_label')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {parseNumber(rate.overtime_threshold)} {t('hours_short_label')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rate.spread_hours_enabled ? t('yes_with_hours', { hours: rate.spread_hours_threshold }) : t('no_label')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(rate.effective_date).toLocaleDateString('en-US')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            rate.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {rate.is_active ? t('active_status') : t('inactive_status')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleOpenDeleteModal(rate)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1"
                          title={t('delete_pay_rate') || 'Delete pay rate'}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>{t('delete')}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Modal de confirmación para eliminar */}
        <Modal
          isOpen={showDeleteModal}
          onClose={handleCloseDeleteModal}
          title={t('delete_pay_rate') || 'Delete Pay Rate'}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {t('delete_pay_rate_confirmation') || 'Are you sure you want to delete this pay rate configuration?'}
            </p>
            
            {deletingRate && (
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm">
                  <p className="font-medium text-gray-900">
                    {t('employee')}: {deletingRate.employee_name || deletingRate.employee_code}
                  </p>
                  <p className="text-gray-600 mt-1">
                    {t('regular_rate_table')}: {formatCurrency(deletingRate.regular_rate)}/{t('hours_short_label')}
                  </p>
                  <p className="text-gray-600">
                    {t('effective_date_table')}: {new Date(deletingRate.effective_date).toLocaleDateString('en-US')}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={handleCloseDeleteModal}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDeletePayRate}
                disabled={deleting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? (t('deleting') || 'Deleting...') : (t('delete') || 'Delete')}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

export default PayRatesList;

