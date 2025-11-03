import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import { deductionsService } from '../../../services/deductions.service';
import { getEmployees } from '../../../services/employee.service';
import { Employee, IncidentType } from '../../../types';

const CreateIncident = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    employee_id: '',
    incident_type: 'bonus' as IncidentType,
    incident_name: '',
    amount: '',
    description: '',
    incident_date: new Date().toISOString().split('T')[0],
    payroll_period_start: '',
    payroll_period_end: '',
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
        incident_type: formData.incident_type,
        incident_name: formData.incident_name,
        incident_date: formData.incident_date,
      };

      if (formData.amount) {
        data.amount = parseFloat(formData.amount);
      }

      if (formData.description) {
        data.description = formData.description;
      }

      if (formData.payroll_period_start) {
        data.payroll_period_start = formData.payroll_period_start;
      }

      if (formData.payroll_period_end) {
        data.payroll_period_end = formData.payroll_period_end;
      }

      await deductionsService.createIncident(data);
      showToast('Incidente creado exitosamente', 'success');
      navigate('/business/incidents');
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
            Nuevo Incidente
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Registre bonos, penalizaciones, propinas u otros incidentes
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
            <label htmlFor="incident_type" className="block text-sm font-medium text-gray-700">
              Tipo de Incidente *
            </label>
            <select
              id="incident_type"
              required
              value={formData.incident_type}
              onChange={(e) => setFormData({ ...formData, incident_type: e.target.value as IncidentType })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="bonus">Bono</option>
              <option value="penalty">Penalización</option>
              <option value="tips_reported">Propinas Reportadas</option>
              <option value="warning">Advertencia</option>
              <option value="advance">Adelanto</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div>
            <label htmlFor="incident_name" className="block text-sm font-medium text-gray-700">
              Nombre del Incidente *
            </label>
            <input
              type="text"
              id="incident_name"
              required
              value={formData.incident_name}
              onChange={(e) => setFormData({ ...formData, incident_name: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Ej: Bono por Desempeño"
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Monto ($)
            </label>
            <input
              type="number"
              id="amount"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Detalles adicionales..."
            />
          </div>

          <div>
            <label htmlFor="incident_date" className="block text-sm font-medium text-gray-700">
              Fecha del Incidente *
            </label>
            <input
              type="date"
              id="incident_date"
              required
              value={formData.incident_date}
              onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="period_start" className="block text-sm font-medium text-gray-700">
                Inicio Período de Nómina
              </label>
              <input
                type="date"
                id="period_start"
                value={formData.payroll_period_start}
                onChange={(e) => setFormData({ ...formData, payroll_period_start: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="period_end" className="block text-sm font-medium text-gray-700">
                Fin Período de Nómina
              </label>
              <input
                type="date"
                id="period_end"
                value={formData.payroll_period_end}
                onChange={(e) => setFormData({ ...formData, payroll_period_end: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/business/incidents')}
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
              {loading ? 'Creando...' : 'Crear Incidente'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateIncident;

