import { useState } from 'react';
import Layout from '../../../components/Layout/Layout';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import { tipcreditService } from '../../../services/tipcredit.service';
import { TipCreditShortfall } from '../../../types';
import { Calculator, TrendingUp } from 'lucide-react';

const TipCreditCalculator = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TipCreditShortfall | null>(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    hours_worked: '40',
    tips_reported: '150.00',
    work_date: new Date().toISOString().split('T')[0],
  });

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await tipcreditService.calculateShortfall(
        parseFloat(formData.hours_worked),
        parseFloat(formData.tips_reported),
        formData.work_date
      );
      setResult(data);
      showToast('Cálculo completado', 'success');
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            Calculadora de Tip Credit Shortfall
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Calcule el faltante de propinas antes de procesar la nómina
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Datos de Entrada
            </h3>

            <form onSubmit={handleCalculate} className="space-y-4">
              <div>
                <label htmlFor="hours_worked" className="block text-sm font-medium text-gray-700">
                  Horas Trabajadas *
                </label>
                <input
                  type="number"
                  id="hours_worked"
                  required
                  step="0.5"
                  min="0"
                  value={formData.hours_worked}
                  onChange={(e) => setFormData({ ...formData, hours_worked: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="tips_reported" className="block text-sm font-medium text-gray-700">
                  Propinas Reportadas ($) *
                </label>
                <input
                  type="number"
                  id="tips_reported"
                  required
                  step="0.01"
                  min="0"
                  value={formData.tips_reported}
                  onChange={(e) => setFormData({ ...formData, tips_reported: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="work_date" className="block text-sm font-medium text-gray-700">
                  Fecha de Trabajo
                </label>
                <input
                  type="date"
                  id="work_date"
                  value={formData.work_date}
                  onChange={(e) => setFormData({ ...formData, work_date: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Determina qué configuración de tip credit se usará
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Calculando...' : 'Calcular Shortfall'}
              </button>
            </form>
          </div>

          {/* Resultados */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Resultados
            </h3>

            {!result ? (
              <div className="text-center py-12 text-gray-400">
                <Calculator className="h-16 w-16 mx-auto mb-4" />
                <p>Los resultados aparecerán aquí</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Propinas Requeridas</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${result.tips_required.toFixed(2)}
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Propinas Reportadas</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${result.tips_reported.toFixed(2)}
                  </p>
                </div>

                <div className={`rounded-lg p-4 ${
                  result.shortfall > 0 ? 'bg-red-50' : 'bg-green-50'
                }`}>
                  <p className="text-sm text-gray-600">Shortfall (Faltante)</p>
                  <p className={`text-3xl font-bold ${
                    result.shortfall > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    ${result.shortfall.toFixed(2)}
                  </p>
                  {result.shortfall > 0 && (
                    <p className="text-sm text-red-600 mt-2">
                      El empleador debe compensar este monto
                    </p>
                  )}
                </div>

                {result.config_used && (
                  <div className="border-t pt-4 mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Configuración Utilizada
                    </p>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                      <p><span className="font-medium">Nombre:</span> {result.config_used.config_name.replace(/2024/g, '').replace(/2025/g, '').replace(/\(Vigente desde Enero 1\)/g, '').replace(/\s*-\s*-/g, '-').replace(/\s+/g, ' ').replace(/\s*-\s*/g, ' - ').trim()}</p>
                      <p><span className="font-medium">Salario Mínimo:</span> ${result.config_used.minimum_wage.toFixed(2)}/hr</p>
                      <p><span className="font-medium">Cash Wage:</span> ${result.config_used.cash_wage.toFixed(2)}/hr</p>
                      <p><span className="font-medium">Tip Credit:</span> ${result.config_used.tip_credit_amount.toFixed(2)}/hr</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ejemplo Educativo */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">📚 Ejemplo de Cálculo</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <p className="font-medium">Escenario: Empleado trabaja 40 horas en la semana</p>
            <div className="pl-4 space-y-1">
              <p>• Propinas requeridas: 40 × $5.65 = <span className="font-semibold">$226.00</span></p>
              <p>• Propinas reportadas: <span className="font-semibold">$150.00</span></p>
              <p>• <span className="text-red-600 font-semibold">Shortfall: $70.00</span> (el empleador paga esto)</p>
            </div>
            <div className="border-t pt-3 mt-3">
              <p className="font-medium">Pago Total al Empleado:</p>
              <div className="pl-4 space-y-1">
                <p>• Cash wage: 40 × $11.35 = $454.00</p>
                <p>• Shortfall compensation: $70.00</p>
                <p>• Propinas: $150.00</p>
                <p className="text-green-600 font-bold">━━━━━━━━━━━━━━━</p>
                <p className="text-green-600 font-bold">TOTAL: $660.00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TipCreditCalculator;

