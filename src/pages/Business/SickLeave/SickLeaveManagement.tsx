import { useState, useEffect } from 'react';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import { sickleaveService } from '../../../services/sickleave.service';
import { getEmployees } from '../../../services/employee.service';
import { Employee, SickLeave, SickLeaveUsage } from '../../../types';

const SickLeaveManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [sickLeave, setSickLeave] = useState<SickLeave | null>(null);
  const [pendingRequests, setPendingRequests] = useState<SickLeaveUsage[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const [usageForm, setUsageForm] = useState({
    employee_code: '',
    usage_date: new Date().toISOString().split('T')[0],
    hours_used: '',
    reason: '',
    requires_approval: true,
  });

  useEffect(() => {
    loadEmployees();
    loadPendingRequests();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      const employee = employees.find((e) => e.id === selectedEmployee);
      if (employee) {
        setUsageForm({ ...usageForm, employee_code: employee.employee_code });
        loadSickLeaveSummary(employee.employee_code);
      }
    }
  }, [selectedEmployee]);

  const loadEmployees = async () => {
    try {
      const data = await getEmployees(true);
      setEmployees(data);
      if (data.length > 0) {
        setSelectedEmployee(data[0].id);
      }
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    }
  };

  const loadSickLeaveSummary = async (employeeCode: string) => {
    setLoading(true);
    try {
      const data = await sickleaveService.getSickLeaveSummary(employeeCode, new Date().getFullYear());
      setSickLeave(data);
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
      setSickLeave(null);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const data = await sickleaveService.getPendingSickLeaveRequests();
      setPendingRequests(data.pending_usage || data);
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    }
  };

  const handleRequestUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sickleaveService.requestSickLeaveUsage({
        ...usageForm,
        hours_used: parseFloat(usageForm.hours_used),
      });
      showToast('Solicitud de sick leave creada exitosamente', 'success');
      setUsageForm({
        ...usageForm,
        hours_used: '',
        reason: '',
      });
      loadSickLeaveSummary(usageForm.employee_code);
      loadPendingRequests();
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (usageId: string) => {
    try {
      await sickleaveService.approveSickLeaveRequest(usageId, 'admin', 'Aprobado');
      showToast('Solicitud aprobada exitosamente', 'success');
      loadPendingRequests();
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            Gestión de Sick Leave
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            NY State: 1 hora de sick leave por cada 30 horas trabajadas (máximo 40 hrs/año)
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen de Sick Leave</h3>
              
              <div className="mb-4">
                <label htmlFor="employee_select" className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Empleado
                </label>
                <select
                  id="employee_select"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name} - {employee.employee_code}
                    </option>
                  ))}
                </select>
              </div>

              {loading ? (
                <LoadingSpinner />
              ) : sickLeave ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-md">
                    <span className="text-sm font-medium text-gray-700">Horas Acumuladas</span>
                    <span className="text-lg font-bold text-blue-600">{sickLeave.hours_accrued.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-md">
                    <span className="text-sm font-medium text-gray-700">Horas Usadas</span>
                    <span className="text-lg font-bold text-red-600">{sickLeave.hours_used.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-md">
                    <span className="text-sm font-medium text-gray-700">Horas Restantes</span>
                    <span className="text-lg font-bold text-green-600">{sickLeave.hours_remaining.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay datos disponibles</p>
              )}
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Solicitar Uso de Sick Leave</h3>
              <form onSubmit={handleRequestUsage} className="space-y-4">
                <div>
                  <label htmlFor="usage_date" className="block text-sm font-medium text-gray-700">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    id="usage_date"
                    required
                    value={usageForm.usage_date}
                    onChange={(e) => setUsageForm({ ...usageForm, usage_date: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="hours_used" className="block text-sm font-medium text-gray-700">
                    Horas a Usar *
                  </label>
                  <input
                    type="number"
                    id="hours_used"
                    required
                    step="0.5"
                    min="0"
                    value={usageForm.hours_used}
                    onChange={(e) => setUsageForm({ ...usageForm, hours_used: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                    Razón (Opcional)
                  </label>
                  <textarea
                    id="reason"
                    rows={3}
                    value={usageForm.reason}
                    onChange={(e) => setUsageForm({ ...usageForm, reason: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="requires_approval"
                    type="checkbox"
                    checked={usageForm.requires_approval}
                    onChange={(e) => setUsageForm({ ...usageForm, requires_approval: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requires_approval" className="ml-2 block text-sm text-gray-900">
                    Requiere aprobación
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Procesando...' : 'Solicitar Uso'}
                </button>
              </form>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Solicitudes Pendientes</h3>
            {pendingRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay solicitudes pendientes</p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {request.employee_code}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(request.usage_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-blue-600">
                        {request.hours_used} hrs
                      </span>
                    </div>
                    {request.reason && (
                      <p className="text-sm text-gray-600 mb-2">{request.reason}</p>
                    )}
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="w-full text-sm px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Aprobar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SickLeaveManagement;

