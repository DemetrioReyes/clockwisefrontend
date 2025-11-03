import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import { deductionsService } from '../../../services/deductions.service';
import { getEmployees } from '../../../services/employee.service';
import { Employee, DeductionType } from '../../../types';

const CreateDeduction = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    employee_id: '',
    deduction_type: 'federal_tax' as DeductionType,
    deduction_name: '',
    is_percentage: true,
    deduction_percentage: '',
    deduction_amount: '',
    effective_date: new Date().toISOString().split('T')[0],
    end_date: '',
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
      const data: any = {
        employee_id: formData.employee_id,
        deduction_type: formData.deduction_type,
        deduction_name: formData.deduction_name,
        is_percentage: formData.is_percentage,
        effective_date: formData.effective_date,
      };

      if (formData.is_percentage) {
        data.deduction_percentage = parseFloat(formData.deduction_percentage) / 100;
      } else {
        data.deduction_amount = parseFloat(formData.deduction_amount);
      }

      if (formData.end_date) {
        data.end_date = formData.end_date;
      }

      await deductionsService.createDeduction(data);
      showToast('Deducción creada exitosamente', 'success');
      navigate('/business/deductions');
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            Nueva Deducción
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Agregue una nueva deducción para un empleado
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

          <div>
            <label htmlFor="deduction_type" className="block text-sm font-medium text-gray-700">
              Tipo de Deducción *
            </label>
            <select
              id="deduction_type"
              required
              value={formData.deduction_type}
              onChange={(e) => setFormData({ ...formData, deduction_type: e.target.value as DeductionType })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="federal_tax">Impuesto Federal</option>
              <option value="state_tax">Impuesto Estatal</option>
              <option value="social_security">Seguro Social</option>
              <option value="medicare">Medicare</option>
              <option value="health_insurance">Seguro Médico</option>
              <option value="retirement">Retiro/401k</option>
              <option value="union_dues">Cuotas Sindicales</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div>
            <label htmlFor="deduction_name" className="block text-sm font-medium text-gray-700">
              Nombre de la Deducción *
            </label>
            <input
              type="text"
              id="deduction_name"
              required
              value={formData.deduction_name}
              onChange={(e) => setFormData({ ...formData, deduction_name: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Ej: Impuesto Federal sobre Ingresos"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Monto *
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  id="percentage"
                  type="radio"
                  checked={formData.is_percentage}
                  onChange={() => setFormData({ ...formData, is_percentage: true, deduction_amount: '' })}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                />
                <label htmlFor="percentage" className="ml-3 block text-sm font-medium text-gray-700">
                  Porcentaje
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="fixed"
                  type="radio"
                  checked={!formData.is_percentage}
                  onChange={() => setFormData({ ...formData, is_percentage: false, deduction_percentage: '' })}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                />
                <label htmlFor="fixed" className="ml-3 block text-sm font-medium text-gray-700">
                  Monto Fijo
                </label>
              </div>
            </div>
          </div>

          {formData.is_percentage ? (
            <div>
              <label htmlFor="deduction_percentage" className="block text-sm font-medium text-gray-700">
                Porcentaje (%) *
              </label>
              <input
                type="number"
                id="deduction_percentage"
                required
                step="0.01"
                min="0"
                max="100"
                value={formData.deduction_percentage}
                onChange={(e) => setFormData({ ...formData, deduction_percentage: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ej: 12.00"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="deduction_amount" className="block text-sm font-medium text-gray-700">
                Monto Fijo ($) *
              </label>
              <input
                type="number"
                id="deduction_amount"
                required
                step="0.01"
                min="0"
                value={formData.deduction_amount}
                onChange={(e) => setFormData({ ...formData, deduction_amount: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ej: 50.00"
              />
            </div>
          )}

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

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/business/deductions')}
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
              {loading ? 'Creando...' : 'Crear Deducción'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateDeduction;

