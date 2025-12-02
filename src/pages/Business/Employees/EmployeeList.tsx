import React, { useState, useEffect } from 'react';
import { formatErrorMessage } from '../../../services/api';
import { Link } from 'react-router-dom';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { useLanguage } from '../../../contexts/LanguageContext';
import employeeService from '../../../services/employee.service';
import { Employee } from '../../../types';
import { Users, Search, Plus, Mail, Phone, Edit2, X } from 'lucide-react';
import { EmployeeType, PayFrequency, PaymentMethod, BankAccountType } from '../../../types';

const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    alias: '',
    ssn: '',
    date_of_birth: '',
    email: '',
    phone: '',
    hire_date: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    employee_type: 'hourly_fixed' as EmployeeType,
    position: '',
    hourly_rate: '',
    pay_frequency: 'weekly' as PayFrequency,
    regular_shift: '',
    department: '',
    payment_method: 'transfer' as PaymentMethod,
    bank_account_number: '',
    bank_routing_number: '',
    bank_account_type: 'checking' as BankAccountType,
    state_minimum_wage: '',
    receives_meal_benefit: false,
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const filtered = employees.filter(
      (employee) =>
        employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredEmployees(filtered);
  }, [searchTerm, employees]);

  const loadEmployees = async () => {
    try {
      const data = await employeeService.listEmployees(true);
      setEmployees(data);
      setFilteredEmployees(data);
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditForm({
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      alias: employee.alias || '',
      ssn: employee.ssn || '',
      date_of_birth: employee.date_of_birth ? employee.date_of_birth.split('T')[0] : '',
      email: employee.email || '',
      phone: employee.phone || '',
      hire_date: employee.hire_date ? employee.hire_date.split('T')[0] : '',
      street_address: employee.street_address || '',
      city: employee.city || '',
      state: employee.state || '',
      zip_code: employee.zip_code || '',
      employee_type: employee.employee_type || 'hourly_fixed',
      position: employee.position || '',
      hourly_rate: employee.hourly_rate?.toString() || '',
      pay_frequency: employee.pay_frequency || 'weekly',
      regular_shift: employee.regular_shift || '',
      department: employee.department || '',
      payment_method: employee.payment_method || 'transfer',
      bank_account_number: employee.bank_account_number || '',
      bank_routing_number: employee.bank_routing_number || '',
      bank_account_type: employee.bank_account_type || 'checking',
      state_minimum_wage: employee.state_minimum_wage?.toString() || '',
      receives_meal_benefit: employee.receives_meal_benefit || false,
    });
  };

  const handleCancelEdit = () => {
    setEditingEmployee(null);
    setEditForm({
      first_name: '',
      last_name: '',
      alias: '',
      ssn: '',
      date_of_birth: '',
      email: '',
      phone: '',
      hire_date: '',
      street_address: '',
      city: '',
      state: '',
      zip_code: '',
      employee_type: 'hourly_fixed',
      position: '',
      hourly_rate: '',
      pay_frequency: 'weekly',
      regular_shift: '',
      department: '',
      payment_method: 'transfer',
      bank_account_number: '',
      bank_routing_number: '',
      bank_account_type: 'checking',
      state_minimum_wage: '',
      receives_meal_benefit: false,
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  };

  const handleSaveEdit = async () => {
    if (!editingEmployee) return;

    setSaving(true);
    try {
      const updateData: any = {};
      
      // Solo incluir campos que han cambiado
      if (editForm.first_name !== editingEmployee.first_name) updateData.first_name = editForm.first_name;
      if (editForm.last_name !== editingEmployee.last_name) updateData.last_name = editForm.last_name;
      if (editForm.alias !== (editingEmployee.alias || '')) updateData.alias = editForm.alias || null;
      if (editForm.ssn !== (editingEmployee.ssn || '')) updateData.ssn = editForm.ssn;
      if (editForm.date_of_birth !== (editingEmployee.date_of_birth?.split('T')[0] || '')) updateData.date_of_birth = editForm.date_of_birth;
      if (editForm.email !== (editingEmployee.email || '')) updateData.email = editForm.email || null;
      if (editForm.phone !== editingEmployee.phone) updateData.phone = editForm.phone;
      if (editForm.hire_date !== (editingEmployee.hire_date?.split('T')[0] || '')) updateData.hire_date = editForm.hire_date;
      if (editForm.street_address !== editingEmployee.street_address) updateData.street_address = editForm.street_address;
      if (editForm.city !== editingEmployee.city) updateData.city = editForm.city;
      if (editForm.state !== editingEmployee.state) updateData.state = editForm.state;
      if (editForm.zip_code !== editingEmployee.zip_code) updateData.zip_code = editForm.zip_code;
      if (editForm.employee_type !== editingEmployee.employee_type) updateData.employee_type = editForm.employee_type;
      if (editForm.position !== editingEmployee.position) updateData.position = editForm.position;
      if (editForm.hourly_rate !== (editingEmployee.hourly_rate?.toString() || '')) {
        updateData.hourly_rate = editForm.hourly_rate ? parseFloat(editForm.hourly_rate) : null;
      }
      if (editForm.pay_frequency !== editingEmployee.pay_frequency) updateData.pay_frequency = editForm.pay_frequency;
      if (editForm.regular_shift !== (editingEmployee.regular_shift || '')) updateData.regular_shift = editForm.regular_shift || null;
      if (editForm.department !== (editingEmployee.department || '')) updateData.department = editForm.department || null;
      if (editForm.payment_method !== editingEmployee.payment_method) updateData.payment_method = editForm.payment_method;
      if (editForm.bank_account_number !== (editingEmployee.bank_account_number || '')) updateData.bank_account_number = editForm.bank_account_number || null;
      if (editForm.bank_routing_number !== (editingEmployee.bank_routing_number || '')) updateData.bank_routing_number = editForm.bank_routing_number || null;
      if (editForm.bank_account_type !== (editingEmployee.bank_account_type || 'checking')) updateData.bank_account_type = editForm.bank_account_type;
      if (editForm.state_minimum_wage !== (editingEmployee.state_minimum_wage?.toString() || '')) {
        updateData.state_minimum_wage = editForm.state_minimum_wage ? parseFloat(editForm.state_minimum_wage) : null;
      }
      if (editForm.receives_meal_benefit !== (editingEmployee.receives_meal_benefit || false)) {
        updateData.receives_meal_benefit = editForm.receives_meal_benefit;
      }

      await employeeService.updateEmployee(editingEmployee.id, updateData);
      showToast(t('employee_updated_successfully'), 'success');
      await loadEmployees();
      handleCancelEdit();
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('employees')}</h1>
          <Link
            to="/business/employees/register"
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>{t('register_new_employee')}</span>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow">
          {/* Search Bar */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('search_employees')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Table */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" text={t('loading')} />
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  {searchTerm ? t('no_employees_found') : t('no_employees_registered')}
                </p>
                {!searchTerm && (
                  <Link
                    to="/business/employees/register"
                    className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
                  >
                    {t('register_first_employee')}
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('employee')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('position')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('contact')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('hourly_rate')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('type')}
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
                    {filteredEmployees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {employee.first_name} {employee.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {t('hire_date')}: {new Date(employee.hire_date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{employee.position}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="w-4 h-4 mr-1" />
                              {employee.email}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="w-4 h-4 mr-1" />
                              {employee.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.hourly_rate ? `$${employee.hourly_rate.toFixed(2)}/hr` : employee.annual_salary ? `$${employee.annual_salary.toLocaleString()}/año` : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              employee.has_tip_credit
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {employee.has_tip_credit ? t('tipped') : t('regular')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              employee.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {employee.is_active ? t('active') : t('inactive')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEditClick(employee)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            <Edit2 className="w-4 h-4" />
                            {t('edit')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal de Edición */}
        {editingEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl z-10">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {t('edit_employee')}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {editingEmployee.first_name} {editingEmployee.last_name} - {editingEmployee.employee_code}
                  </p>
                </div>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Información Personal */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">{t('personal_info')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('first_name')} *</label>
                      <input
                        type="text"
                        name="first_name"
                        value={editForm.first_name}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('last_name')} *</label>
                      <input
                        type="text"
                        name="last_name"
                        value={editForm.last_name}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('alias')}</label>
                      <input
                        type="text"
                        name="alias"
                        value={editForm.alias}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Mari, Juanito, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('ssn')} *</label>
                      <input
                        type="text"
                        name="ssn"
                        value={editForm.ssn}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="XXX-XX-XXXX"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('date_of_birth')} *</label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={editForm.date_of_birth}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('phone')} *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={editForm.phone}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('email')}</label>
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Dirección */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">{t('address')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('street_address')} *</label>
                      <input
                        type="text"
                        name="street_address"
                        value={editForm.street_address}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('city')} *</label>
                      <input
                        type="text"
                        name="city"
                        value={editForm.city}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('state')} *</label>
                      <input
                        type="text"
                        name="state"
                        value={editForm.state}
                        onChange={handleFormChange}
                        maxLength={2}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('zip_code')} *</label>
                      <input
                        type="text"
                        name="zip_code"
                        value={editForm.zip_code}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Información de Empleo */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">{t('employment_info')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('employee_type')} *</label>
                      <select
                        name="employee_type"
                        value={editForm.employee_type}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="hourly_tipped_waiter">{t('hourly_tipped_waiter')}</option>
                        <option value="hourly_tipped_delivery">{t('hourly_tipped_delivery')}</option>
                        <option value="hourly_fixed">{t('hourly_fixed')}</option>
                        <option value="exempt_salary">{t('exempt_salary')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('position')} *</label>
                      <input
                        type="text"
                        name="position"
                        value={editForm.position}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('hourly_rate')} *</label>
                      <input
                        type="number"
                        name="hourly_rate"
                        value={editForm.hourly_rate}
                        onChange={handleFormChange}
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('pay_frequency')} *</label>
                      <select
                        name="pay_frequency"
                        value={editForm.pay_frequency}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="weekly">{t('weekly')}</option>
                        <option value="biweekly">{t('biweekly')}</option>
                        <option value="monthly">{t('monthly')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('hire_date')} *</label>
                      <input
                        type="date"
                        name="hire_date"
                        value={editForm.hire_date}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('payment_method')} *</label>
                      <select
                        name="payment_method"
                        value={editForm.payment_method}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="cash">{t('cash')}</option>
                        <option value="transfer">{t('transfer')}</option>
                        <option value="check">{t('check')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('regular_shift')}</label>
                      <input
                        type="text"
                        name="regular_shift"
                        value={editForm.regular_shift}
                        onChange={handleFormChange}
                        placeholder="10:00-18:00"
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('department')}</label>
                      <input
                        type="text"
                        name="department"
                        value={editForm.department}
                        onChange={handleFormChange}
                        placeholder="Service, Kitchen, Management..."
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Información Bancaria */}
                {editForm.payment_method === 'transfer' && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded">
                    <h3 className="text-lg font-semibold mb-4 text-blue-900">{t('banking_info')} ({t('transfer')})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('bank_account_number')}</label>
                        <input
                          type="text"
                          name="bank_account_number"
                          value={editForm.bank_account_number}
                          onChange={handleFormChange}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('bank_routing_number')}</label>
                        <input
                          type="text"
                          name="bank_routing_number"
                          value={editForm.bank_routing_number}
                          onChange={handleFormChange}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('bank_account_type')}</label>
                        <select
                          name="bank_account_type"
                          value={editForm.bank_account_type}
                          onChange={handleFormChange}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="checking">{t('checking')}</option>
                          <option value="savings">{t('savings')}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Configuración de Tip Credit */}
                {(editForm.employee_type === 'hourly_tipped_waiter' || editForm.employee_type === 'hourly_tipped_delivery') && (
                  <div className="bg-purple-50 border-l-4 border-purple-400 p-6 rounded">
                    <h3 className="text-lg font-semibold mb-4 text-purple-900">{t('tip_credit_config_label')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('state_minimum_wage')}</label>
                        <input
                          type="number"
                          name="state_minimum_wage"
                          value={editForm.state_minimum_wage}
                          onChange={handleFormChange}
                          step="0.01"
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Beneficio de Comida */}
                <div className="bg-emerald-50 border-l-4 border-emerald-400 p-6 rounded">
                  <h3 className="text-lg font-semibold mb-4 text-emerald-900">{t('meal_benefit_title')}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="receives_meal_benefit_edit"
                        name="receives_meal_benefit"
                        checked={editForm.receives_meal_benefit || false}
                        onChange={(e) => setEditForm(prev => ({ ...prev, receives_meal_benefit: e.target.checked }))}
                        className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <label htmlFor="receives_meal_benefit_edit" className="ml-3 text-sm font-medium text-gray-700">
                        {t('meal_benefit_employee_receives')}
                      </label>
                    </div>
                    <div className="bg-emerald-100 p-4 rounded">
                      <p className="text-sm text-emerald-800 font-semibold mb-2">{t('meal_benefit_how_works')}</p>
                      <ul className="text-xs text-emerald-700 space-y-1 list-disc list-inside">
                        <li>{t('meal_benefit_auto_calc_period')}</li>
                        <li>{t('meal_benefit_applies_if')}</li>
                        <li>{t('meal_benefit_taxable_note')}</li>
                        <li>{t('meal_benefit_manage_in')}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-6 border-t">
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner size="sm" />
                        {t('saving')}
                      </>
                    ) : (
                      t('save')
                    )}
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

export default EmployeeList;
