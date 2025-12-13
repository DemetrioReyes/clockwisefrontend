import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatErrorMessage } from '../../../services/api';
import { deductionsService } from '../../../services/deductions.service';
import { getEmployees } from '../../../services/employee.service';
import { Deduction, Employee } from '../../../types';
import { Edit2, Trash2 } from 'lucide-react';
import Modal from '../../../components/Common/Modal';

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState<Deduction | null>(null);
  const [deletingDeduction, setDeletingDeduction] = useState<Deduction | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deductionConfig, setDeductionConfig] = useState<DeductionConfig>({
    federal_tax: 12,
    state_tax: 5,
    social_security: 6.2,
    medicare: 1.45,
  });
  const [editForm, setEditForm] = useState({
    deduction_name: '',
    is_percentage: true,
    deduction_percentage: '',
    deduction_fixed_amount: '',
    effective_date: '',
    end_date: '',
  });
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();

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
      console.log('Deducciones recibidas del backend:', data);
      const deductionsList = Array.isArray(data) ? data : ((data as any)?.deductions || []);
      console.log('Deducciones procesadas:', deductionsList);
      setDeductions(deductionsList);
      if (deductionsList.length === 0) {
        console.warn('No se encontraron deducciones para el empleado:', employeeId);
      }
    } catch (error: any) {
      console.error('Error cargando deducciones:', error);
      console.error('Detalles del error:', error.response?.data || error.message);
      showToast(formatErrorMessage(error), 'error');
      setDeductions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    if (!selectedEmployee) {
      showToast(t('please_select_employee_first'), 'error');
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
      showToast(t('please_select_employee_first'), 'error');
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

      showToast(t('standard_deductions_configured'), 'success');
      
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
      federal_tax: t('federal_tax_type'),
      state_tax: t('state_tax_type'),
      social_security: t('social_security_type'),
      medicare: t('medicare_type'),
      health_insurance: t('health_insurance'),
      retirement: t('retirement'),
      union_dues: t('union_dues'),
      other: t('other_type'),
    };
    return labels[type] || type;
  };

  const handleOpenEditModal = (deduction: Deduction) => {
    setEditingDeduction(deduction);
    setEditForm({
      deduction_name: deduction.deduction_name,
      is_percentage: deduction.is_percentage,
      deduction_percentage: deduction.is_percentage 
        ? (typeof deduction.deduction_percentage === 'number' 
            ? (deduction.deduction_percentage * 100).toString() 
            : (parseFloat(deduction.deduction_percentage || '0') * 100).toString())
        : '',
      deduction_fixed_amount: !deduction.is_percentage
        ? (typeof deduction.deduction_fixed_amount === 'number' 
            ? deduction.deduction_fixed_amount.toString() 
            : deduction.deduction_fixed_amount || '')
        : '',
      effective_date: deduction.effective_date,
      end_date: deduction.end_date || '',
    });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingDeduction(null);
    setEditForm({
      deduction_name: '',
      is_percentage: true,
      deduction_percentage: '',
      deduction_fixed_amount: '',
      effective_date: '',
      end_date: '',
    });
  };

  const handleUpdateDeduction = async () => {
    if (!editingDeduction) return;

    setSaving(true);
    try {
      const updateData: any = {
        deduction_name: editForm.deduction_name,
        is_percentage: editForm.is_percentage,
        effective_date: editForm.effective_date,
      };

      if (editForm.is_percentage) {
        updateData.deduction_percentage = parseFloat(editForm.deduction_percentage) / 100;
        updateData.deduction_fixed_amount = null;
      } else {
        updateData.deduction_fixed_amount = parseFloat(editForm.deduction_fixed_amount);
        updateData.deduction_percentage = null;
      }

      if (editForm.end_date) {
        updateData.end_date = editForm.end_date;
      } else {
        updateData.end_date = null;
      }

      await deductionsService.updateDeduction(editingDeduction.id, updateData);
      showToast(t('deduction_updated_successfully') || 'Deduction updated successfully', 'success');
      handleCloseEditModal();
      if (selectedEmployee) {
        loadDeductions(selectedEmployee);
      }
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteModal = (deduction: Deduction) => {
    setDeletingDeduction(deduction);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingDeduction(null);
  };

  const handleDeleteDeduction = async () => {
    if (!deletingDeduction) return;

    setDeleting(true);
    try {
      await deductionsService.deleteDeduction(deletingDeduction.id);
      showToast(t('deduction_deleted_successfully') || 'Deduction deleted successfully', 'success');
      handleCloseDeleteModal();
      if (selectedEmployee) {
        loadDeductions(selectedEmployee);
      }
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
              {t('deductions_subtitle')}
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
              {t('new_deduction')}
            </button>
            <button
              onClick={handleOpenModal}
              disabled={settingUp || !selectedEmployee}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('configure_standard_deductions')}
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-2">
            {t('select_employee_deductions')}
          </label>
          <select
            id="employee"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">{t('select_employee_placeholder_deductions')}</option>
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
                <p className="text-gray-500">{t('no_deductions_registered')}</p>
                <p className="text-sm text-gray-400 mt-2">{t('use_standard_deductions')}</p>
                <ul className="text-sm text-gray-400 mt-2">
                  <li>{t('federal_tax_percent')}</li>
                  <li>{t('state_tax_percent')}</li>
                  <li>{t('social_security_percent')}</li>
                  <li>{t('medicare_percent')}</li>
                </ul>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('type')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('name')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('amount')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('effective_date_deduction')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('actions')}
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
                        {new Date(deduction.effective_date).toLocaleDateString('en-US')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            deduction.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {deduction.is_active ? t('active') : t('inactive')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleOpenEditModal(deduction)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                            title={t('edit_deduction') || 'Edit deduction'}
                          >
                            <Edit2 className="h-4 w-4" />
                            <span>{t('edit')}</span>
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(deduction)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1"
                            title={t('delete_deduction') || 'Delete deduction'}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>{t('delete')}</span>
                          </button>
                        </div>
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
                        {t('setup_standard_deductions_title')}
                      </h3>
                      <p className="text-sm text-gray-500 mb-6">
                        {t('enter_percentages_description')}
                      </p>

                      <div className="space-y-4">
                        {/* Federal Tax */}
                        <div>
                          <label htmlFor="federal_tax" className="block text-sm font-medium text-gray-700 mb-1">
                            {t('federal_tax_label')}
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
                            {t('state_tax_label')}
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
                            {t('social_security_label')}
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
                            {t('medicare_label')}
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
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">{t('setting_up')}</span>
                      </>
                    ) : (
                      t('configure')
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={settingUp}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de edición */}
        <Modal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          title={t('edit_deduction') || 'Edit Deduction'}
        >
          <div className="space-y-4">
            {editingDeduction && (
              <>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{t('type')}:</span> {getDeductionTypeLabel(editingDeduction.deduction_type)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('name')} *
                  </label>
                  <input
                    type="text"
                    value={editForm.deduction_name}
                    onChange={(e) => setEditForm({ ...editForm, deduction_name: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('type_of_deduction') || 'Type of Deduction'}
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={editForm.is_percentage}
                        onChange={() => setEditForm({ ...editForm, is_percentage: true, deduction_fixed_amount: '' })}
                        className="mr-2"
                      />
                      {t('percentage') || 'Percentage'}
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!editForm.is_percentage}
                        onChange={() => setEditForm({ ...editForm, is_percentage: false, deduction_percentage: '' })}
                        className="mr-2"
                      />
                      {t('fixed_amount') || 'Fixed Amount'}
                    </label>
                  </div>
                </div>

                {editForm.is_percentage ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('percentage') || 'Percentage'} (%) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={editForm.deduction_percentage}
                      onChange={(e) => setEditForm({ ...editForm, deduction_percentage: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('fixed_amount') || 'Fixed Amount'} ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.deduction_fixed_amount}
                      onChange={(e) => setEditForm({ ...editForm, deduction_fixed_amount: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('effective_date_deduction')} *
                  </label>
                  <input
                    type="date"
                    value={editForm.effective_date}
                    onChange={(e) => setEditForm({ ...editForm, effective_date: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('end_date') || 'End Date'} ({t('optional') || 'Optional'})
                  </label>
                  <input
                    type="date"
                    value={editForm.end_date}
                    onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={handleCloseEditModal}
                    disabled={saving}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleUpdateDeduction}
                    disabled={saving}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (t('saving') || 'Saving...') : (t('save') || 'Save')}
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>

        {/* Modal de eliminación */}
        <Modal
          isOpen={showDeleteModal}
          onClose={handleCloseDeleteModal}
          title={t('delete_deduction') || 'Delete Deduction'}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {t('delete_deduction_confirmation') || 'Are you sure you want to delete this deduction? This action cannot be undone.'}
            </p>
            
            {deletingDeduction && (
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm">
                  <p className="font-medium text-gray-900">
                    {t('name')}: {deletingDeduction.deduction_name}
                  </p>
                  <p className="text-gray-600 mt-1">
                    {t('type')}: {getDeductionTypeLabel(deletingDeduction.deduction_type)}
                  </p>
                  <p className="text-gray-600">
                    {t('amount')}: {deletingDeduction.is_percentage
                      ? `${(typeof deletingDeduction.deduction_percentage === 'number' 
                          ? deletingDeduction.deduction_percentage * 100 
                          : parseFloat(deletingDeduction.deduction_percentage || '0') * 100).toFixed(2)}%`
                      : `$${typeof deletingDeduction.deduction_fixed_amount === 'number' 
                          ? deletingDeduction.deduction_fixed_amount.toFixed(2) 
                          : parseFloat(deletingDeduction.deduction_fixed_amount || '0').toFixed(2)}`}
                  </p>
                  <p className="text-gray-600">
                    {t('effective_date_deduction')}: {new Date(deletingDeduction.effective_date).toLocaleDateString('en-US')}
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
                onClick={handleDeleteDeduction}
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

export default DeductionsList;

