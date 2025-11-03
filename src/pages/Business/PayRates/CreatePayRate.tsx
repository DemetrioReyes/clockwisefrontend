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
  });

  useEffect(() => {
    loadEmployees();
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
      await payratesService.createPayRate({
        employee_id: formData.employee_id,
        regular_rate: parseFloat(formData.regular_rate),
        overtime_rate: parseFloat(formData.overtime_rate),
        overtime_threshold: parseFloat(formData.overtime_threshold),
        spread_hours_enabled: formData.spread_hours_enabled,
        spread_hours_threshold: parseFloat(formData.spread_hours_threshold),
        spread_hours_rate: parseFloat(formData.spread_hours_rate),
        break_compliance_enabled: formData.break_compliance_enabled,
        break_threshold_hours: parseFloat(formData.break_threshold_hours),
        required_break_minutes: parseFloat(formData.required_break_minutes),
        effective_date: formData.effective_date,
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
            Configure tarifas personalizadas y opciones de cumplimiento para NY State
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

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="regular_rate" className="block text-sm font-medium text-gray-700">
                Tarifa Regular ($/hr) *
              </label>
              <input
                type="number"
                id="regular_rate"
                required
                step="0.01"
                min="0"
                value={formData.regular_rate}
                onChange={(e) => setFormData({ ...formData, regular_rate: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Para empleados con tip credit, use el cash wage ($10)
              </p>
            </div>

            <div>
              <label htmlFor="overtime_rate" className="block text-sm font-medium text-gray-700">
                Tarifa Overtime ($/hr) *
              </label>
              <input
                type="number"
                id="overtime_rate"
                required
                step="0.01"
                min="0"
                value={formData.overtime_rate}
                onChange={(e) => setFormData({ ...formData, overtime_rate: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="overtime_threshold" className="block text-sm font-medium text-gray-700">
                Umbral Overtime (hrs)
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
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">NY State Compliance</h3>
            
            <div className="space-y-4">
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
                    Spread of Hours (NY State)
                  </label>
                  <p className="text-sm text-gray-500">
                    Pago extra si trabaja 10+ horas en un día
                  </p>
                  {formData.spread_hours_enabled && (
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        step="0.5"
                        value={formData.spread_hours_threshold}
                        onChange={(e) => setFormData({ ...formData, spread_hours_threshold: e.target.value })}
                        placeholder="Umbral (hrs)"
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={formData.spread_hours_rate}
                        onChange={(e) => setFormData({ ...formData, spread_hours_rate: e.target.value })}
                        placeholder="Tarifa ($/hr)"
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

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
                    Break Compliance (NY State)
                  </label>
                  <p className="text-sm text-gray-500">
                    30 minutos de break requeridos para turnos de 8+ horas
                  </p>
                  {formData.break_compliance_enabled && (
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        step="0.5"
                        value={formData.break_threshold_hours}
                        onChange={(e) => setFormData({ ...formData, break_threshold_hours: e.target.value })}
                        placeholder="Umbral (hrs)"
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="number"
                        value={formData.required_break_minutes}
                        onChange={(e) => setFormData({ ...formData, required_break_minutes: e.target.value })}
                        placeholder="Break requerido (min)"
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  )}
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

