import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import { deductionsService } from '../../../services/deductions.service';
import { getEmployees } from '../../../services/employee.service';
import { Deduction, Employee } from '../../../types';

interface DeductionConfig {
  federal_tax: number;
  state_tax: number;
  social_security: number;
  medicare: number;
}

const DeductionsList = () => {
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [settingUp, setSettingUp] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deductionConfig, setDeductionConfig] = useState<DeductionConfig>({
    federal_tax: 12,
    state_tax: 5,
    social_security: 6.2,
    medicare: 1.45,
  });
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      loadDeductions(selectedEmployee);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployee]);

  const loadEmployees = async () => {
    try {
      const data = await getEmployees(true);
      const employeesList = Array.isArray(data) ? data : ((data as any)?.employees || []);
      setEmployees(employeesList);
      if (employeesList.length > 0) {
        setSelectedEmployee(employeesList[0].id);
      }
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    }
  };

  const loadDeductions = async (employeeId: string) => {
    setLoading(true);
    try {
      const data = await deductionsService.getEmployeeDeductions(employeeId);
      const deductionsList = Array.isArray(data) ? data : ((data as any)?.deductions || []);
      setDeductions(deductionsList);
    } catch (error: any) {
      console.log('Error cargando deducciones:', error);
      setDeductions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    if (!selectedEmployee) {
      showToast('Por favor seleccione un empleado primero', 'error');
      return;
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    // Resetear valores por defecto
    setDeductionConfig({
      federal_tax: 12,
      state_tax: 5,
      social_security: 6.2,
      medicare: 1.45,
    });
  };

  const handleSetupStandardDeductions = async () => {
    if (!selectedEmployee) {
      showToast('Por favor seleccione un empleado primero', 'error');
      return;
    }

    setSettingUp(true);
    setShowModal(false);
    const effectiveDate = new Date().toISOString().split('T')[0]; // Fecha actual en formato YYYY-MM-DD

    try {
      // Crear las 4 deducciones estándar con valores configurables
      const standardDeductions = [
        {
          employee_id: selectedEmployee,
          deduction_type: 'federal_tax' as const,
          deduction_name: 'Federal Income Tax',
          deduction_percentage: deductionConfig.federal_tax / 100, // Convertir % a decimal
          is_percentage: true,
          effective_date: effectiveDate,
        },
        {
          employee_id: selectedEmployee,
          deduction_type: 'state_tax' as const,
          deduction_name: 'NY State Tax',
          deduction_percentage: deductionConfig.state_tax / 100,
          is_percentage: true,
          effective_date: effectiveDate,
        },
        {
          employee_id: selectedEmployee,
          deduction_type: 'social_security' as const,
          deduction_name: 'Social Security',
          deduction_percentage: deductionConfig.social_security / 100,
          is_percentage: true,
          effective_date: effectiveDate,
        },
        {
          employee_id: selectedEmployee,
          deduction_type: 'medicare' as const,
          deduction_name: 'Medicare',
          deduction_percentage: deductionConfig.medicare / 100,
          is_percentage: true,
          effective_date: effectiveDate,
        },
      ];

      // Crear cada deducción individualmente
      for (const deduction of standardDeductions) {
        try {
          await deductionsService.createDeduction(deduction);
        } catch (error: any) {
          // Si la deducción ya existe, continuar con la siguiente
          console.log(`Deducción ${deduction.deduction_type} ya existe o error:`, error);
        }
      }

      // Llamar al endpoint de setup
      await deductionsService.setupStandardDeductions(selectedEmployee, effectiveDate);

      showToast('¡Deducciones estándar configuradas exitosamente!', 'success');
      
      // Recargar la lista de deducciones
      await loadDeductions(selectedEmployee);
    } catch (error: any) {
      console.error('Error configurando deducciones estándar:', error);
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setSettingUp(false);
    }
  };

  const getDeductionTypeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      federal_tax: 'Impuesto Federal',
      state_tax: 'Impuesto Estatal',
      social_security: 'Seguro Social',
      medicare: 'Medicare',
      health_insurance: 'Seguro Médico',
      retirement: 'Retiro/401k',
      union_dues: 'Cuotas Sindicales',
      other: 'Otro',
    };
    return labels[type] || type;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Deducciones de Empleados
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <button
              onClick={() => navigate('/business/deductions/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Deducción
            </button>
            <button
              onClick={handleOpenModal}
              disabled={settingUp || !selectedEmployee}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Configurar Deducciones Estándar
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Empleado
          </label>
          <select
            id="employee"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Seleccione un empleado</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.first_name} {employee.last_name} - {employee.employee_code}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            {deductions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay deducciones registradas para este empleado</p>
                <p className="text-sm text-gray-400 mt-2">Use "Configurar Deducciones Estándar" para crear automáticamente:</p>
                <ul className="text-sm text-gray-400 mt-2">
                  <li>• Impuesto Federal: 12%</li>
                  <li>• Impuesto Estatal (NY): 5%</li>
                  <li>• Seguro Social: 6.2%</li>
                  <li>• Medicare: 1.45%</li>
                </ul>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Efectiva
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deductions.map((deduction) => (
                    <tr key={deduction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getDeductionTypeLabel(deduction.deduction_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {deduction.deduction_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {deduction.is_percentage
                          ? `${(typeof deduction.deduction_percentage === 'number' 
                              ? deduction.deduction_percentage * 100 
                              : parseFloat(deduction.deduction_percentage || '0') * 100).toFixed(2)}%`
                          : `$${typeof deduction.deduction_fixed_amount === 'number' 
                              ? deduction.deduction_fixed_amount.toFixed(2) 
                              : parseFloat(deduction.deduction_fixed_amount || '0').toFixed(2)}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(deduction.effective_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            deduction.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {deduction.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Modal para Configurar Deducciones Estándar */}
        {showModal && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Overlay */}
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={handleCloseModal}
              ></div>

              {/* Modal Panel */}
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Configurar Deducciones Estándar
                      </h3>
                      <p className="text-sm text-gray-500 mb-6">
                        Ingrese los porcentajes para cada deducción. Los valores se aplicarán al empleado seleccionado.
                      </p>

                      <div className="space-y-4">
                        {/* Federal Tax */}
                        <div>
                          <label htmlFor="federal_tax" className="block text-sm font-medium text-gray-700 mb-1">
                            Impuesto Federal (%)
                          </label>
                          <input
                            type="number"
                            id="federal_tax"
                            min="0"
                            max="100"
                            step="0.01"
                            value={deductionConfig.federal_tax}
                            onChange={(e) =>
                              setDeductionConfig({
                                ...deductionConfig,
                                federal_tax: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="12"
                          />
                        </div>

                        {/* State Tax */}
                        <div>
                          <label htmlFor="state_tax" className="block text-sm font-medium text-gray-700 mb-1">
                            Impuesto Estatal NY (%)
                          </label>
                          <input
                            type="number"
                            id="state_tax"
                            min="0"
                            max="100"
                            step="0.01"
                            value={deductionConfig.state_tax}
                            onChange={(e) =>
                              setDeductionConfig({
                                ...deductionConfig,
                                state_tax: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="5"
                          />
                        </div>

                        {/* Social Security */}
                        <div>
                          <label htmlFor="social_security" className="block text-sm font-medium text-gray-700 mb-1">
                            Seguro Social (%)
                          </label>
                          <input
                            type="number"
                            id="social_security"
                            min="0"
                            max="100"
                            step="0.01"
                            value={deductionConfig.social_security}
                            onChange={(e) =>
                              setDeductionConfig({
                                ...deductionConfig,
                                social_security: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="6.2"
                          />
                        </div>

                        {/* Medicare */}
                        <div>
                          <label htmlFor="medicare" className="block text-sm font-medium text-gray-700 mb-1">
                            Medicare (%)
                          </label>
                          <input
                            type="number"
                            id="medicare"
                            min="0"
                            max="100"
                            step="0.01"
                            value={deductionConfig.medicare}
                            onChange={(e) =>
                              setDeductionConfig({
                                ...deductionConfig,
                                medicare: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="1.45"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleSetupStandardDeductions}
                    disabled={settingUp}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {settingUp ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Configurando...
                      </>
                    ) : (
                      'Configurar'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={settingUp}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DeductionsList;

