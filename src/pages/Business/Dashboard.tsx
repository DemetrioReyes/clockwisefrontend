import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { formatErrorMessage } from '../../services/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { useToast } from '../../components/Common/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import employeeService from '../../services/employee.service';
import payrollService from '../../services/payroll.service';
import { reportsService } from '../../services/reports.service';
import { Employee } from '../../types';
import { Users, Clock, DollarSign, TrendingUp, UserPlus, AlertTriangle } from 'lucide-react';

const BusinessDashboard: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [breakComplianceAlerts, setBreakComplianceAlerts] = useState<any[]>([]);
  const [breakComplianceTotal, setBreakComplianceTotal] = useState(0);
  const [weeklyHours, setWeeklyHours] = useState<{ total: number; overtime: number }>({ total: 0, overtime: 0 });
  const [payrollCount, setPayrollCount] = useState<number>(0);
  const [employeeStats, setEmployeeStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      // Cargar empleados
      const employeesData = await employeeService.listEmployees(true);
      const employeesList = Array.isArray(employeesData) ? employeesData : (employeesData as any)?.employees || [];
      setEmployees(employeesList);

      // Cargar alertas de break compliance
      try {
        const alertsResponse = await reportsService.getBreakComplianceAlerts('pending');
        setBreakComplianceAlerts(alertsResponse.alerts || alertsResponse || []);
        setBreakComplianceTotal(alertsResponse.total_alerts || (alertsResponse.alerts || alertsResponse || []).length || 0);
      } catch (error) {
        console.log('Could not load break alerts:', error);
      }

      // Cargar horas del mes actual (todo el mes)
      try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Último día del mes
        
        const tenantId = (user as any)?.tenant_id;
        
        if (!tenantId) {
          console.log('No hay tenant_id disponible, saltando carga de horas');
          return;
        }
        
        const payrollData = await payrollService.calculatePayroll({
          tenant_id: tenantId,
          period_start: startOfMonth.toISOString().split('T')[0],
          period_end: endOfMonth.toISOString().split('T')[0],
          pay_frequency: 'monthly',
        });

        if (payrollData?.time_summaries && payrollData.time_summaries.length > 0) {
          const totalHours = payrollData.time_summaries.reduce((sum: number, s: any) => {
            const hours = parseFloat(s.total_work_hours || '0');
            return sum + hours;
          }, 0);
          const overtimeHours = payrollData.time_summaries.reduce((sum: number, s: any) => {
            const hours = parseFloat(s.overtime_hours || '0');
            return sum + hours;
          }, 0);
          setWeeklyHours({ total: totalHours, overtime: overtimeHours });
          
          // Guardar stats por empleado para mostrar en la tabla
          setEmployeeStats(payrollData.time_summaries);
        }
        
        // Cargar propinas por empleado
        if (payrollData?.calculations && payrollData.calculations.length > 0) {
          const statsWithTips = payrollData.time_summaries.map((summary: any) => {
            const calc = payrollData.calculations.find((c: any) => c.employee_id === summary.employee_id);
            return {
              ...summary,
              tips_reported: calc?.tips_reported || '0.00',
            };
          });
          setEmployeeStats(statsWithTips);
        }
      } catch (error) {
        console.log('No se pudieron cargar horas mensuales:', error);
      }
      
      // Cargar nóminas
      try {
        const payrollsData = await payrollService.listPayrolls();
        setPayrollCount(payrollsData.total_count || 0);
      } catch (error) {
        console.log('No se pudieron cargar nóminas:', error);
      }

      // Intentar cargar stats, pero no fallar si no está disponible
      try {
        await reportsService.getQuickStats();
      } catch (statsError) {
        console.log('Stats no disponibles:', statsError);
      }
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const activeEmployees = employees.filter((e: Employee) => e.is_active);
  const tippedEmployees = employees.filter((e: Employee) => e.has_tip_credit);

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('dashboard')}</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text={t('loading')} />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('active_employees')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {activeEmployees.length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{t('total')}: {employees.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('with_tip_credit')}</p>
                    <p className="text-2xl font-bold text-gray-900">{tippedEmployees.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('hours_this_month')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {weeklyHours.total > 0 ? weeklyHours.total.toFixed(0) : '0'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('overtime')}: {weeklyHours.overtime > 0 ? weeklyHours.overtime.toFixed(0) : '0'}h
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('payrolls')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {payrollCount}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{t('total_processed')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertTriangle className={`h-8 w-8 ${breakComplianceTotal > 0 ? 'text-red-600' : 'text-green-600'}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t('break_compliance')}</p>
                    <p className={`text-2xl font-bold ${breakComplianceTotal > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {breakComplianceTotal}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {breakComplianceTotal > 0 ? t('pending_alerts') : t('all_clear')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Link
                to="/business/employees/register"
                className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white hover:from-blue-600 hover:to-blue-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{t('register_employee')}</h3>
                    <p className="text-sm text-blue-100 mt-1">{t('add_new_employee')}</p>
                  </div>
                  <UserPlus className="h-8 w-8" />
                </div>
              </Link>

              <Link
                to="/business/time-entry"
                className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white hover:from-green-600 hover:to-green-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{t('time_control')}</h3>
                    <p className="text-sm text-green-100 mt-1">{t('facial_recognition')}</p>
                  </div>
                  <Clock className="h-8 w-8" />
                </div>
              </Link>

              <Link
                to="/business/payroll"
                className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white hover:from-purple-600 hover:to-purple-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{t('calculate_payroll')}</h3>
                    <p className="text-sm text-purple-100 mt-1">{t('process_payments')}</p>
                  </div>
                  <DollarSign className="h-8 w-8" />
                </div>
              </Link>
            </div>

            {/* Break Compliance Alerts */}
            {breakComplianceTotal > 0 && (
              <div className="bg-white shadow rounded-lg mb-8">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <h2 className="text-lg font-semibold text-gray-900">{t('break_compliance_alerts')}</h2>
                    <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                      {breakComplianceTotal} {breakComplianceTotal === 1 ? t('pending') : t('pending_alerts')}
                    </span>
                  </div>
                  <Link
                    to="/business/reports"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {t('view_all')} →
                  </Link>
                </div>
                {breakComplianceAlerts.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    {t('pending')} {t('break_compliance_alerts').toLowerCase()}
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
                            {t('code')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('violation_date')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('deficit')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('severity')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {breakComplianceAlerts.slice(0, 5).map((alert: any) => {
                          const severityColors: { [key: string]: string } = {
                            high: 'bg-red-100 text-red-800',
                            medium: 'bg-yellow-100 text-yellow-800',
                            low: 'bg-blue-100 text-blue-800',
                          };
                          const severityLabels: { [key: string]: string } = {
                            high: t('high'),
                            medium: t('medium'),
                            low: t('low'),
                          };
                          return (
                            <tr key={alert.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {alert.employee_name || 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-mono font-semibold text-blue-600">
                                  {alert.employee_code || 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {alert.violation_date
                                    ? new Date(alert.violation_date).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                      })
                                    : 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-red-600">
                                  {alert.deficit_minutes || 0} min
                                </div>
                                <div className="text-xs text-gray-500">
                                  {t('break_required_not_taken')}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  severityColors[alert.severity] || severityColors.low
                                }`}>
                                  {severityLabels[alert.severity] || t('low')}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {breakComplianceAlerts.length > 5 && (
                      <div className="px-6 py-4 bg-gray-50 text-center border-t border-gray-200">
                        <Link
                          to="/business/reports"
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {t('view_more_alerts', { count: breakComplianceAlerts.length - 5 })} →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Recent Employees */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">{t('recent_employees')}</h2>
                <Link
                  to="/business/employees"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {t('view_all')} →
                </Link>
              </div>
              {activeEmployees.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">{t('no_employees_registered')}</p>
                  <Link
                    to="/business/employees/register"
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <UserPlus className="h-5 w-5 mr-2" />
                    {t('register_first_employee')}
                  </Link>
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
                          {t('code')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('position')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('hours_month')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('tips')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('attendance')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('status')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {activeEmployees.slice(0, 5).map((employee: Employee) => {
                        const empStats = employeeStats.find(s => s.employee_id === employee.id);
                        return (
                        <tr key={employee.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.first_name} {employee.last_name}
                            </div>
                            {employee.alias && (
                              <div className="text-xs text-gray-500">"{employee.alias}"</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono font-semibold text-blue-600">{employee.employee_code}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{employee.position}</div>
                            {employee.department && (
                              <div className="text-xs text-gray-400">{employee.department}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">
                              {empStats?.total_work_hours ? `${parseFloat(empStats.total_work_hours).toFixed(1)}h` : '0h'}
                            </div>
                            {empStats && parseFloat(empStats.overtime_hours || '0') > 0 && (
                              <div className="text-xs text-orange-600">
                                OT: {parseFloat(empStats.overtime_hours).toFixed(1)}h
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {employee.has_tip_credit ? (
                              <div>
                                <div className="text-sm font-semibold text-green-600">
                                  ${empStats?.tips_reported || '0.00'}
                                </div>
                                <div className="text-xs text-gray-500">este mes</div>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-green-600 font-medium">
                              {empStats?.check_in_count || 0} {t('check_ins')}
                            </div>
                            <div className="text-xs text-red-600">
                              {empStats?.check_out_count || 0} {t('check_outs')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              employee.has_tip_credit ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {employee.has_tip_credit ? 'Tipped' : t('active')}
                            </span>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default BusinessDashboard;
