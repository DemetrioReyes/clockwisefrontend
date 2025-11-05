import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import { payratesService } from '../../../services/payrates.service';
import { getEmployees } from '../../../services/employee.service';
import { Employee } from '../../../types';

const CreatePayRate = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    employee_id: '',
    regular_rate: '10.00',
    overtime_rate: '15.00',
    overtime_threshold: '40.00',
    spread_hours_enabled: true,
    spread_hours_threshold: '10.00',
    spread_hours_rate: '15.00',
    break_compliance_enabled: true,
    break_threshold_hours: '8.00',
    required_break_minutes: '30',
    effective_date: new Date().toISOString().split('T')[0],
    auto_calculate_overtime: true,
  });

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await getEmployees(true);
      setEmployees(data);
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { auto_calculate_overtime, ...submitData } = formData;
      await payratesService.createPayRate({
        employee_id: submitData.employee_id,
        regular_rate: parseFloat(submitData.regular_rate),
        overtime_rate: parseFloat(submitData.overtime_rate),
        overtime_threshold: parseFloat(submitData.overtime_threshold),
        spread_hours_enabled: submitData.spread_hours_enabled,
        spread_hours_threshold: parseFloat(submitData.spread_hours_threshold),
        spread_hours_rate: parseFloat(submitData.spread_hours_rate),
        break_compliance_enabled: submitData.break_compliance_enabled,
        break_threshold_hours: parseFloat(submitData.break_threshold_hours),
        required_break_minutes: parseFloat(submitData.required_break_minutes),
        effective_date: submitData.effective_date,
      });
      showToast('Tarifa de pago creada exitosamente', 'success');
      navigate('/business/pay-rates');
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            Nueva Tarifa de Pago
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure tarifas personalizadas y opciones de cumplimiento laboral
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700">
              Empleado *
            </label>
            <select
              id="employee_id"
              required
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Seleccione un empleado</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name} - {employee.employee_code}
                </option>
              ))}
            </select>
          </div>

          {/* Tarifa de Pago */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tarifa de Pago</h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="regular_rate" className="block text-sm font-medium text-gray-700">
                  Tarifa por Hora ($/hr) *
                </label>
                <input
                  type="number"
                  id="regular_rate"
                  required
                  step="0.01"
                  min="0"
                  value={formData.regular_rate}
                  onChange={(e) => {
                    const regularRate = parseFloat(e.target.value) || 0;
                    setFormData({
                      ...formData,
                      regular_rate: e.target.value,
                      overtime_rate: (regularRate * 1.5).toFixed(2), // Siempre calcular automáticamente
                    });
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Tarifa base por hora. Para empleados con tip credit, use el cash wage ($10/hr)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overtime (Horas Extra)
                </label>
                <div className="mt-1 p-3 bg-white border-2 border-gray-300 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        ${(parseFloat(formData.regular_rate) * 1.5).toFixed(2)}/hr
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Después de {formData.overtime_threshold} horas/semana
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Auto (1.5x)
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    ✓ Calculado automáticamente: {formData.regular_rate} × 1.5 = ${(parseFloat(formData.regular_rate) * 1.5).toFixed(2)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Requiere pago de 1.5x después de 40 horas/semana
                </p>
              </div>

              <div>
                <label htmlFor="overtime_threshold" className="block text-sm font-medium text-gray-700">
                  Horas para Overtime (por semana)
                </label>
                <input
                  type="number"
                  id="overtime_threshold"
                  step="0.5"
                  min="0"
                  value={formData.overtime_threshold}
                  onChange={(e) => setFormData({ ...formData, overtime_threshold: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Por defecto: 40 horas por semana
                </p>
              </div>
            </div>
          </div>

          {/* Configuración de Cumplimiento */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Cumplimiento</h3>
            
            <div className="space-y-4">
              {/* Spread of Hours */}
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="spread_hours_enabled"
                      type="checkbox"
                      checked={formData.spread_hours_enabled}
                      onChange={(e) => setFormData({ ...formData, spread_hours_enabled: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <label htmlFor="spread_hours_enabled" className="font-medium text-gray-700">
                      Spread of Hours (Extensión de Horas)
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      Si el empleado trabaja 10+ horas en un día, recibe 1 hora adicional de pago
                    </p>
                    {formData.spread_hours_enabled && (
                      <div className="mt-3 p-3 bg-white border border-green-200 rounded-md">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-700">
                              Umbral: {formData.spread_hours_threshold} horas/día
                            </p>
                            <p className="text-sm font-semibold text-gray-700 mt-1">
                              Pago adicional: 1 hora × ${formData.spread_hours_rate}/hr
                            </p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Auto
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          ✓ Configurado automáticamente: 10 horas/día, tarifa a salario mínimo
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Break Compliance */}
              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-lg">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="break_compliance_enabled"
                      type="checkbox"
                      checked={formData.break_compliance_enabled}
                      onChange={(e) => setFormData({ ...formData, break_compliance_enabled: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <label htmlFor="break_compliance_enabled" className="font-medium text-gray-700">
                      Break Compliance (Cumplimiento de Descansos)
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      Requiere 30 minutos de break para turnos de 8+ horas
                    </p>
                    {formData.break_compliance_enabled && (
                      <div className="mt-3 p-3 bg-white border border-purple-200 rounded-md">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-700">
                              Umbral: {formData.break_threshold_hours} horas
                            </p>
                            <p className="text-sm font-semibold text-gray-700 mt-1">
                              Break requerido: {formData.required_break_minutes} minutos
                            </p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Auto
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          ✓ Configurado automáticamente: 8 horas = 30 minutos de break
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

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

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/business/pay-rates')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading && <LoadingSpinner />}
              {loading ? 'Creando...' : 'Crear Tarifa'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreatePayRate;

