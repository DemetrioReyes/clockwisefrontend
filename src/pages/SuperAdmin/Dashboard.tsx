import React, { useState, useEffect } from 'react';
import { formatErrorMessage } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { useToast } from '../../components/Common/Toast';
import businessService from '../../services/business.service';
import { Business } from '../../types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Building2, TrendingUp, Search, Download, Filter, Bell, CheckCircle, AlertCircle, Clock, Users, Settings, Mail, MapPin, Phone, User } from 'lucide-react';
import { formatDateUS } from '../../utils/dateFormat';
import Modal from '../../components/Common/Modal';

const SuperAdminDashboard: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    billing_cycle: '',
    created_after: '',
    created_before: '',
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, activeFilter, filters, businesses]);

  const loadDashboardData = async () => {
    try {
      const [businessesData, activityData, notificationsData] = await Promise.all([
        businessService.listBusinesses(false), // Cargar todos, no solo activos
        businessService.getRecentActivity(6),
        businessService.getNotifications(),
      ]);
      
      setBusinesses(businessesData);
      setFilteredBusinesses(businessesData); // Inicializar filteredBusinesses también
      setRecentActivity(activityData.activities || []);
      setNotifications(notificationsData.notifications || []);
      setUnreadNotifications(notificationsData.unread_count || 0);
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      let filtered = [...businesses];

      // Filtro por búsqueda
      if (searchTerm) {
        filtered = filtered.filter(
          (b) =>
            b.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Filtro por estado
      if (activeFilter === 'active') {
        filtered = filtered.filter((b) => b.is_active);
      } else if (activeFilter === 'inactive') {
        filtered = filtered.filter((b) => !b.is_active);
      }

      // Filtros avanzados
      if (filters.billing_cycle) {
        filtered = filtered.filter((b) => b.billing_cycle === filters.billing_cycle);
      }

      if (filters.created_after) {
        filtered = filtered.filter((b) => {
          const createdDate = new Date(b.created_at);
          const filterDate = new Date(filters.created_after);
          return createdDate >= filterDate;
        });
      }

      if (filters.created_before) {
        filtered = filtered.filter((b) => {
          const createdDate = new Date(b.created_at);
          const filterDate = new Date(filters.created_before);
          return createdDate <= filterDate;
        });
      }

      setFilteredBusinesses(filtered);
    } catch (error) {
      console.error('Error aplicando filtros:', error);
    }
  };

  const handleCardClick = (filterType: 'all' | 'active' | 'inactive') => {
    setActiveFilter(filterType);
    navigate('/super-admin/businesses', { state: { filter: filterType } });
  };

  const handleExport = async () => {
    try {
      const blob = await businessService.exportBusinesses();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `businesses_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('Datos exportados exitosamente', 'success');
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    }
  };

  const activeBusinesses = businesses.filter((b) => b.is_active);
  const inactiveBusinesses = businesses.filter((b) => !b.is_active);

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
              </div>
              <p className="text-gray-600 ml-14">
                Panel de control y gestión del sistema
              </p>
            </div>
            <div className="flex items-center gap-3">
              {unreadNotifications > 0 && (
                <div className="relative">
                  <div className="p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-all">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-pulse">
                    {unreadNotifications}
                  </span>
                </div>
              )}
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg shadow-lg hover:shadow-xl hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 font-semibold"
              >
                <Download className="w-5 h-5" />
                Export Data
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading dashboard..." />
          </div>
        ) : (
          <>
            {/* Notifications Section */}
            {notifications.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Notifications
                    </h3>
                    {unreadNotifications > 0 && (
                      <span className="bg-white text-purple-600 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        {unreadNotifications} new
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
                  {notifications.slice(0, 5).map((notification, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-l-4 shadow-sm transition-all hover:shadow-md ${
                        notification.priority === 'warning'
                          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-500'
                          : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          notification.priority === 'warning'
                            ? 'bg-yellow-100'
                            : 'bg-blue-100'
                        }`}>
                          {notification.priority === 'warning' ? (
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats Cards - Clickeables */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div
                className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 cursor-pointer border-2 transition-all transform hover:scale-105 ${
                  activeFilter === 'all' 
                    ? 'border-blue-500 shadow-xl shadow-blue-500/50' 
                    : 'border-blue-200 shadow-lg hover:shadow-xl'
                }`}
                onClick={() => handleCardClick('all')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-700 mb-1">Total Businesses</p>
                    <p className="text-3xl font-bold text-blue-900">{businesses.length}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              <div
                className={`bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 cursor-pointer border-2 transition-all transform hover:scale-105 ${
                  activeFilter === 'active' 
                    ? 'border-green-500 shadow-xl shadow-green-500/50' 
                    : 'border-green-200 shadow-lg hover:shadow-xl'
                }`}
                onClick={() => handleCardClick('active')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-700 mb-1">Active Businesses</p>
                    <p className="text-3xl font-bold text-green-900">{activeBusinesses.length}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              <div
                className={`bg-gradient-to-br from-red-50 to-pink-100 rounded-xl p-6 cursor-pointer border-2 transition-all transform hover:scale-105 ${
                  activeFilter === 'inactive' 
                    ? 'border-red-500 shadow-xl shadow-red-500/50' 
                    : 'border-red-200 shadow-lg hover:shadow-xl'
                }`}
                onClick={() => handleCardClick('inactive')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-red-700 mb-1">Inactive Businesses</p>
                    <p className="text-3xl font-bold text-red-900">{inactiveBusinesses.length}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or owner..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all transform hover:scale-105 ${
                    showFilters
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-sm'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg p-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
                    <select
                      value={filters.billing_cycle}
                      onChange={(e) => setFilters({ ...filters, billing_cycle: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">All</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created After</label>
                    <input
                      type="date"
                      value={filters.created_after}
                      onChange={(e) => setFilters({ ...filters, created_after: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created Before</label>
                    <input
                      type="date"
                      value={filters.created_before}
                      onChange={(e) => setFilters({ ...filters, created_before: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Activity
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {recentActivity.slice(0, 6).map((activity, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => {
                          setSelectedActivity(activity);
                          setShowActivityModal(true);
                        }}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg border border-gray-200 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${
                            activity.activity_type === 'employee_created' || activity.activity_type === 'business_created'
                              ? 'bg-green-100' 
                              : activity.activity_type === 'employee_deleted'
                              ? 'bg-red-100'
                              : activity.activity_type === 'payroll_generated'
                              ? 'bg-blue-100'
                              : 'bg-purple-100'
                          }`}>
                            {activity.activity_type === 'employee_created' || activity.activity_type === 'business_created' ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : activity.activity_type === 'employee_deleted' ? (
                              <AlertCircle className="w-5 h-5 text-red-600" />
                            ) : activity.activity_type === 'payroll_generated' ? (
                              <Clock className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Settings className="w-5 h-5 text-purple-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {activity.business_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {activity.activity_description || 
                               (activity.activity_type === 'business_created' ? 'Business Created' :
                                activity.activity_type === 'employee_created' ? 'Employee Created' :
                                activity.activity_type === 'employee_deleted' ? 'Employee Deleted' :
                                activity.activity_type === 'payroll_generated' ? 'Payroll Generated' :
                                activity.activity_type === 'created' ? 'Created' : 'Updated')}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(activity.created_at || activity.activity_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm ${
                              activity.is_active
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                            }`}
                          >
                            {activity.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <div className="text-gray-400 hover:text-purple-600 transition-colors">
                            <Clock className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Businesses */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Recent Businesses
                </h2>
                <Link
                  to="/super-admin/businesses"
                  className="text-sm text-white hover:text-purple-200 font-semibold flex items-center gap-1 transition-colors"
                >
                  View All →
                </Link>
              </div>
              <div className="p-6">
                {filteredBusinesses.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">
                      {searchTerm || showFilters ? 'No businesses found matching your filters' : 'No businesses registered yet'}
                    </p>
                    {!searchTerm && !showFilters && (
                      <Link
                        to="/super-admin/register-business"
                        className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
                      >
                        Register your first business
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-purple-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Business Name
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Owner
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Registration Date
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Employees
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredBusinesses.slice(0, 5).map((business) => (
                          <tr key={business.id} className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-100 rounded-lg">
                                  <Building2 className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">
                                    {business.business_name}
                                  </div>
                                  <div className="text-xs text-gray-500">{business.company_name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-700">{business.contact_first_name} {business.contact_last_name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{business.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                {formatDateUS(business.created_at)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="p-1 bg-purple-100 rounded-lg">
                                  <Users className="w-4 h-4 text-purple-600" />
                                </div>
                                <span className="text-sm font-semibold text-gray-900">
                                  {business.employee_count || 0}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full shadow-sm ${
                                  business.is_active
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                    : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                                }`}
                              >
                                {business.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredBusinesses.length > 5 && (
                      <div className="px-6 py-4 bg-gray-50 text-center border-t border-gray-200">
                        <Link
                          to="/super-admin/businesses"
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View all {filteredBusinesses.length} businesses →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Activity Detail Modal */}
        <Modal
          isOpen={showActivityModal && !!selectedActivity}
          onClose={() => {
            setShowActivityModal(false);
            setSelectedActivity(null);
          }}
          title={`Activity Details - ${selectedActivity?.business_name || ''}`}
          size="lg"
        >
          {selectedActivity && (
            <div className="space-y-4">
              {/* Activity Type Badge */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-lg ${
                  selectedActivity.activity_type === 'employee_created' || selectedActivity.activity_type === 'business_created'
                    ? 'bg-green-100' 
                    : selectedActivity.activity_type === 'employee_deleted'
                    ? 'bg-red-100'
                    : selectedActivity.activity_type === 'payroll_generated'
                    ? 'bg-blue-100'
                    : 'bg-purple-100'
                }`}>
                  {selectedActivity.activity_type === 'employee_created' || selectedActivity.activity_type === 'business_created' ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : selectedActivity.activity_type === 'employee_deleted' ? (
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  ) : selectedActivity.activity_type === 'payroll_generated' ? (
                    <Clock className="w-6 h-6 text-blue-600" />
                  ) : (
                    <Settings className="w-6 h-6 text-purple-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedActivity.activity_description || 
                     (selectedActivity.activity_type === 'business_created' ? 'Business Created' : 
                      selectedActivity.activity_type === 'employee_created' ? 'Employee Created' :
                      selectedActivity.activity_type === 'employee_deleted' ? 'Employee Deleted' :
                      selectedActivity.activity_type === 'payroll_generated' ? 'Payroll Generated' :
                      'Activity')}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedActivity.created_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* Activity-Specific Details */}
              {selectedActivity.activity_type === 'employee_created' && selectedActivity.employee_details && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200 mb-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Employee Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Employee Code</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedActivity.employee_details.employee_code}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Name</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedActivity.employee_details.first_name} {selectedActivity.employee_details.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Type</p>
                      <p className="text-sm font-semibold text-gray-900 capitalize">{selectedActivity.employee_details.employee_type?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Position</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedActivity.employee_details.position || 'N/A'}</p>
                    </div>
                    {selectedActivity.employee_details.hire_date && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Hire Date</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatDateUS(selectedActivity.employee_details.hire_date)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedActivity.activity_type === 'employee_deleted' && selectedActivity.metadata && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 border border-red-200 mb-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Deletion Details
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Employee</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedActivity.entity_name}</p>
                    </div>
                    {selectedActivity.metadata.employee_code && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Employee Code</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedActivity.metadata.employee_code}</p>
                      </div>
                    )}
                    {selectedActivity.metadata.total_deleted !== undefined && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Total Records Deleted</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedActivity.metadata.total_deleted}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedActivity.activity_type === 'payroll_generated' && selectedActivity.payroll_details && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 mb-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Payroll Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Period</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedActivity.payroll_details.period_start && selectedActivity.payroll_details.period_end
                          ? `${formatDateUS(selectedActivity.payroll_details.period_start)} - ${formatDateUS(selectedActivity.payroll_details.period_end)}`
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Frequency</p>
                      <p className="text-sm font-semibold text-gray-900 capitalize">{selectedActivity.payroll_details.pay_frequency || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Total Employees</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedActivity.payroll_details.total_employees || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Total Gross Pay</p>
                      <p className="text-sm font-semibold text-gray-900">
                        ${selectedActivity.payroll_details.total_gross_pay?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Total Net Pay</p>
                      <p className="text-sm font-semibold text-gray-900">
                        ${selectedActivity.payroll_details.total_net_pay?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Status</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                        selectedActivity.payroll_details.status === 'calculated'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                          : 'bg-gray-500 text-white'
                      }`}>
                        {selectedActivity.payroll_details.status || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Business Information */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Business Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Business Name</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedActivity.business_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Company Name</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedActivity.company_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Tenant ID</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedActivity.tenant_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Status</p>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                        selectedActivity.is_active
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                          : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                      }`}
                    >
                      {selectedActivity.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {selectedActivity.rfc && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">EIN/Tax ID</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedActivity.rfc}</p>
                    </div>
                  )}
                  {selectedActivity.billing_cycle && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Billing Cycle</p>
                      <p className="text-sm font-semibold text-gray-900 capitalize">{selectedActivity.billing_cycle}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedActivity.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium text-gray-900">{selectedActivity.email}</p>
                      </div>
                    </div>
                  )}
                  {selectedActivity.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm font-medium text-gray-900">{selectedActivity.phone}</p>
                      </div>
                    </div>
                  )}
                  {(selectedActivity.contact_first_name || selectedActivity.contact_last_name) && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Contact Person</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedActivity.contact_first_name || ''} {selectedActivity.contact_last_name || ''}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedActivity.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Address</p>
                        <p className="text-sm font-medium text-gray-900">{selectedActivity.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Timeline
                </h4>
                <div className="space-y-3">
                  {selectedActivity.created_at && (
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-green-100 rounded-full mt-0.5">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-700">Created</p>
                        <p className="text-xs text-gray-500">
                          {new Date(selectedActivity.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedActivity.updated_at && selectedActivity.updated_at !== selectedActivity.created_at && (
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-blue-100 rounded-full mt-0.5">
                        <AlertCircle className="w-3 h-3 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-700">Last Updated</p>
                        <p className="text-xs text-gray-500">
                          {new Date(selectedActivity.updated_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowActivityModal(false);
                    setSelectedActivity(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <Link
                  to={`/super-admin/businesses`}
                  onClick={() => {
                    setShowActivityModal(false);
                    setSelectedActivity(null);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-sm text-sm font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  View Business Details
                </Link>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default SuperAdminDashboard;
