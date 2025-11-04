import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatErrorMessage } from '../../../services/api';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { useAuth } from '../../../contexts/AuthContext';
import payrollService from '../../../services/payroll.service';
import { PayrollRequest, PayrollResponse, Business } from '../../../types';
import { DollarSign, Calendar, Printer } from 'lucide-react';

const CalculatePayroll: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();
  const [result, setResult] = useState<PayrollResponse | null>(null);
  const [savedPayrollId, setSavedPayrollId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PayrollRequest>({
    tenant_id: (user as Business).tenant_id,
    period_start: '',
    period_end: '',
    pay_frequency: 'weekly',
  });

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSavedPayrollId(null);

    try {
      const data = await payrollService.calculatePayroll(formData);
      setResult(data);
      showToast('Preview de nómina calculado exitosamente!', 'success');
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) {
      showToast('Primero debe calcular el preview de la nómina', 'error');
      return;
    }

    setSaving(true);

    try {
      const data = await payrollService.createPayroll({
        ...formData,
        description: `Nómina ${formData.pay_frequency} - ${formData.period_start} al ${formData.period_end}`,
      });
      setSavedPayrollId(data.id);
      showToast(`Nómina guardada exitosamente! ID: ${data.id}`, 'success');
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calcular Nómina</h1>
          <p className="text-gray-600 mt-2">Calcule la nómina para un período específico</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">💡 Flujo de Trabajo</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>1. <strong>Preview</strong> - Calcular nómina sin guardar (verificar montos)</p>
                  <p>2. <strong>Guardar</strong> - Guardar en base de datos (genera payroll_id)</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handlePreview} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Fecha Inicio del Período *
                </label>
                <input
                  type="date"
                  value={formData.period_start}
                  onChange={(e) => setFormData(prev => ({ ...prev, period_start: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Fecha Fin del Período *
                </label>
                <input
                  type="date"
                  value={formData.period_end}
                  onChange={(e) => setFormData(prev => ({ ...prev, period_end: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frecuencia de Pago *
                </label>
                <select
                  value={formData.pay_frequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, pay_frequency: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">Quincenal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <LoadingSpinner /> : null}
                {loading ? 'Calculando Preview...' : '👁️ Preview (No Guarda)'}
              </button>

              {result && !savedPayrollId && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {saving ? <LoadingSpinner /> : null}
                  {saving ? 'Guardando...' : '💾 Guardar Nómina'}
                </button>
              )}

              {savedPayrollId && (
                <button
                  type="button"
                  onClick={() => navigate(`/business/payroll/print/${savedPayrollId}`)}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  <span className="font-semibold">Ver Imprimible / Imprimir</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Calculando nómina..." />
          </div>
        )}

        {result && result.payroll && (
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <DollarSign className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Resumen de Nómina</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      <div>
                        <p className="font-semibold">Empleados</p>
                        <p className="text-lg">{result.payroll.total_employees || 0}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Pago Bruto Total</p>
                        <p className="text-lg">${result.payroll.total_gross_pay || '0.00'}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Deducciones Totales</p>
                        <p className="text-lg">${result.payroll.total_deductions || '0.00'}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Pago Neto Total</p>
                        <p className="text-lg font-bold text-green-700">${result.payroll.total_net_pay || '0.00'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empleado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pago Regular</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overtime</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tip Credit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deducciones</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pago Neto</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {result.calculations && result.calculations.length > 0 ? result.calculations.map((calc) => (
                    <tr key={calc.employee_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{calc.employee_name}</div>
                        <div className="text-sm text-gray-500">{calc.employee_code}</div>
                        <div className="text-xs text-gray-400">{calc.employee_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div>Reg: {parseFloat(calc.regular_hours).toFixed(2)}</div>
                        {parseFloat(calc.overtime_hours) > 0 && (
                          <div className="text-orange-600">OT: {parseFloat(calc.overtime_hours).toFixed(2)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        ${calc.regular_pay}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        ${calc.overtime_pay}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {calc.employee_type.includes('tipped') ? (
                          <div className="text-purple-600">
                            <div className="text-xs">Tips: ${calc.tips_reported}</div>
                            {parseFloat(calc.spread_hours_pay) > 0 && (
                              <div className="text-xs text-green-600">Spread: ${calc.spread_hours_pay}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        -${calc.total_deductions}
                        <div className="text-xs text-gray-500">
                          Fed: ${calc.federal_tax} | SS: ${calc.social_security}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        ${calc.net_pay}
                        <div className="text-xs text-gray-500 font-normal">
                          Bruto: ${calc.gross_pay}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No hay cálculos de nómina disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CalculatePayroll;
