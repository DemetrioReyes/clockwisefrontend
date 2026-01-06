import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import { tipcreditService } from '../../../services/tipcredit.service';
import { Info } from 'lucide-react';

const CreateTipCreditConfig = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    config_name: 'Mi Negocio - NY 2026',
    state: 'NY',
    city: '',
    minimum_wage: '17.00',
    cash_wage: '11.35',
    tip_credit_amount: '5.65',
    minimum_tips_threshold: '',
    effective_date: '2026-01-01',
    end_date: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const minWage = parseFloat(formData.minimum_wage);
    const cashWage = parseFloat(formData.cash_wage);
    const tipCredit = parseFloat(formData.tip_credit_amount);

    // Validación: cash_wage + tip_credit_amount debe = minimum_wage
    if (Math.abs((cashWage + tipCredit) - minWage) > 0.01) {
      showToast('Error: Cash Wage + Tip Credit debe ser igual a Salario Mínimo', 'error');
      return;
    }

    setLoading(true);

    try {
      const data: any = {
        config_name: formData.config_name,
        state: formData.state,
        minimum_wage: minWage,
        cash_wage: cashWage,
        tip_credit_amount: tipCredit,
        effective_date: formData.effective_date,
      };

      if (formData.city) data.city = formData.city;
      if (formData.minimum_tips_threshold) data.minimum_tips_threshold = parseFloat(formData.minimum_tips_threshold);
      if (formData.end_date) data.end_date = formData.end_date;
      if (formData.notes) data.notes = formData.notes;

      await tipcreditService.createTenantConfig(data);
      showToast('Configuración creada exitosamente', 'success');
      navigate('/business/tip-credit');
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const totalCheck = parseFloat(formData.cash_wage || '0') + parseFloat(formData.tip_credit_amount || '0');
  const isValid = Math.abs(totalCheck - parseFloat(formData.minimum_wage || '0')) < 0.01;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            Nueva Configuración de Tip Credit
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure valores personalizados para su negocio
          </p>
        </div>

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
                  Verificación: ${formData.cash_wage} + ${formData.tip_credit_amount} = $
                  {totalCheck.toFixed(2)} {isValid ? '✓' : '✗ (debe ser $' + formData.minimum_wage + ')'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label htmlFor="config_name" className="block text-sm font-medium text-gray-700">
              Nombre de la Configuración *
            </label>
            <input
              type="text"
              id="config_name"
              required
              value={formData.config_name}
              onChange={(e) => setFormData({ ...formData, config_name: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Ej: Mi Restaurante - NY 2026"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                Estado *
              </label>
              <input
                type="text"
                id="state"
                required
                maxLength={2}
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="NY"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                Ciudad (Opcional)
              </label>
              <input
                type="text"
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Queens"
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Valores de Pago</h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label htmlFor="minimum_wage" className="block text-sm font-medium text-gray-700">
                  Salario Mínimo ($/hr) *
                </label>
                <input
                  type="number"
                  id="minimum_wage"
                  required
                  step="0.01"
                  min="0"
                  value={formData.minimum_wage}
                  onChange={(e) => setFormData({ ...formData, minimum_wage: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="cash_wage" className="block text-sm font-medium text-gray-700">
                  Cash Wage ($/hr) *
                </label>
                <input
                  type="number"
                  id="cash_wage"
                  required
                  step="0.01"
                  min="0"
                  value={formData.cash_wage}
                  onChange={(e) => setFormData({ ...formData, cash_wage: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="tip_credit_amount" className="block text-sm font-medium text-gray-700">
                  Tip Credit ($/hr) *
                </label>
                <input
                  type="number"
                  id="tip_credit_amount"
                  required
                  step="0.01"
                  min="0"
                  value={formData.tip_credit_amount}
                  onChange={(e) => setFormData({ ...formData, tip_credit_amount: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="effective_date" className="block text-sm font-medium text-gray-700">
                Fecha Efectiva *
              </label>
              <input
                type="date"
                id="effective_date"
                required
                value={formData.effective_date}
                onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                Fecha de Fin (Opcional)
              </label>
              <input
                type="date"
                id="end_date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notas
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Información adicional sobre esta configuración..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/business/tip-credit')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !isValid}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading && <LoadingSpinner />}
              {loading ? 'Creando...' : 'Crear Configuración'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateTipCreditConfig;

