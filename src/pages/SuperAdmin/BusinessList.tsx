import React, { useState, useEffect } from 'react';
import { formatErrorMessage } from '../../services/api';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { useToast } from '../../components/Common/Toast';
import businessService from '../../services/business.service';
import { Business, BusinessRegisterData } from '../../types';
import { Building2, Search, Plus, Edit2, X, Lock, Unlock, Key, Trash2, AlertTriangle } from 'lucide-react';

const BusinessList: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [editForm, setEditForm] = useState<Partial<BusinessRegisterData>>({});
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<{ show: boolean; business: Business | null; type: 'soft' | 'complete' }>({ show: false, business: null, type: 'soft' });
  const [showDisableModal, setShowDisableModal] = useState<{ show: boolean; business: Business | null }>({ show: false, business: null });
  const [showResetPasswordModal, setShowResetPasswordModal] = useState<{ show: boolean; business: Business | null }>({ show: false, business: null });
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [confirmDeleteComplete, setConfirmDeleteComplete] = useState(false);

  useEffect(() => {
    loadBusinesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const filtered = businesses.filter(
      (business) =>
        business.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBusinesses(filtered);
  }, [searchTerm, businesses]);

  const loadBusinesses = async () => {
    try {
      const data = await businessService.listBusinesses();
      setBusinesses(data);
      setFilteredBusinesses(data);
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (business: Business) => {
    setEditingBusiness(business);
    setEditForm({
      company_name: business.company_name,
      business_name: business.business_name,
      rfc: business.rfc,
      address: business.address,
      phone: business.phone,
      contact_first_name: business.contact_first_name,
      contact_last_name: business.contact_last_name,
      contact_phone: business.contact_phone,
      billing_cycle: business.billing_cycle,
      email: business.email,
    });
  };

  const handleCancelEdit = () => {
    setEditingBusiness(null);
    setEditForm({});
  };

  const handleFormChange = (field: keyof BusinessRegisterData, value: string) => {
    setEditForm({ ...editForm, [field]: value });
  };

  const handleSaveEdit = async () => {
    if (!editingBusiness) return;

    setSaving(true);
    try {
      await businessService.updateBusiness(editingBusiness.id, editForm);
      showToast('Business updated successfully', 'success');
      setEditingBusiness(null);
      setEditForm({});
      await loadBusinesses();
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDisableClick = (business: Business) => {
    setShowDisableModal({ show: true, business });
  };

  const handleConfirmDisable = async () => {
    if (!showDisableModal.business) return;

    setDisabling(true);
    try {
      if (showDisableModal.business.is_active) {
        // Disable: use the disable endpoint
        await businessService.disableBusiness(showDisableModal.business.id);
        showToast('Business login disabled successfully', 'success');
      } else {
        // Enable: use update endpoint with is_active: true
        await businessService.updateBusiness(showDisableModal.business.id, { is_active: true });
        showToast('Business login enabled successfully', 'success');
      }
      setShowDisableModal({ show: false, business: null });
      await loadBusinesses();
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setDisabling(false);
    }
  };

  const handleResetPasswordClick = (business: Business) => {
    setShowResetPasswordModal({ show: true, business });
    setNewPassword('');
  };

  const handleConfirmResetPassword = async () => {
    if (!showResetPasswordModal.business || !newPassword.trim()) {
      showToast('Please enter a new password', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    setResetting(true);
    try {
      await businessService.resetBusinessPassword(showResetPasswordModal.business!.id, newPassword);
      showToast('Password reset successfully', 'success');
      setShowResetPasswordModal({ show: false, business: null });
      setNewPassword('');
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteClick = (business: Business, type: 'soft' | 'complete') => {
    setShowDeleteModal({ show: true, business, type });
    setConfirmDeleteComplete(false);
  };

  const handleConfirmDelete = async () => {
    if (!showDeleteModal.business) return;

    setDeleting(true);
    try {
      if (showDeleteModal.type === 'complete') {
        const result = await businessService.deleteBusinessComplete(showDeleteModal.business.id);
        showToast(`Business and all data deleted. Total records deleted: ${result.total_deleted}`, 'success');
      } else {
        await businessService.deleteBusiness(showDeleteModal.business.id);
        showToast('Business deactivated successfully (soft delete)', 'success');
      }
      setShowDeleteModal({ show: false, business: null, type: 'soft' });
      await loadBusinesses();
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Layout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">All Businesses</h1>
          <Link
            to="/super-admin/register-business"
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Register Business</span>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow">
          {/* Search Bar */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, owner, or email..."
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
                <LoadingSpinner size="lg" text="Loading businesses..." />
              </div>
            ) : filteredBusinesses.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  {searchTerm ? 'No businesses found matching your search' : 'No businesses registered yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Business Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        EIN
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBusinesses.map((business) => (
                      <tr key={business.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {business.business_name}
                          </div>
                          <div className="text-xs text-gray-500">{business.company_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{business.rfc}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{business.contact_first_name} {business.contact_last_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{business.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{business.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              business.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {business.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditClick(business)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit Business"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {business.is_active ? (
                              <button
                                onClick={() => handleDisableClick(business)}
                                className="text-orange-600 hover:text-orange-900"
                                title="Disable Login"
                              >
                                <Lock className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDisableClick(business)}
                                className="text-green-600 hover:text-green-900"
                                title="Enable Login"
                              >
                                <Unlock className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleResetPasswordClick(business)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Reset Password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(business, 'soft')}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Soft Delete (Deactivate)"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(business, 'complete')}
                              className="text-red-600 hover:text-red-900"
                              title="Hard Delete (Permanent)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Business Modal */}
      {editingBusiness && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Business</h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    value={editForm.company_name || ''}
                    onChange={(e) => handleFormChange('company_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                  <input
                    type="text"
                    value={editForm.business_name || ''}
                    onChange={(e) => handleFormChange('business_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RFC/EIN *</label>
                  <input
                    type="text"
                    value={editForm.rfc || ''}
                    onChange={(e) => handleFormChange('rfc', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="text"
                    value={editForm.phone || ''}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle *</label>
                  <select
                    value={editForm.billing_cycle || ''}
                    onChange={(e) => handleFormChange('billing_cycle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <input
                  type="text"
                  value={editForm.address || ''}
                  onChange={(e) => handleFormChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact First Name *</label>
                  <input
                    type="text"
                    value={editForm.contact_first_name || ''}
                    onChange={(e) => handleFormChange('contact_first_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Last Name *</label>
                  <input
                    type="text"
                    value={editForm.contact_last_name || ''}
                    onChange={(e) => handleFormChange('contact_last_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    value={editForm.contact_phone || ''}
                    onChange={(e) => handleFormChange('contact_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Saving...</span>
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disable Business Modal */}
      {showDisableModal.show && showDisableModal.business && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {showDisableModal.business.is_active ? 'Disable Business Login' : 'Enable Business Login'}
              </h3>
              <button
                onClick={() => setShowDisableModal({ show: false, business: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Business:</strong> {showDisableModal.business.business_name}
              </p>
              {showDisableModal.business.is_active ? (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                  <p className="text-sm text-yellow-700">
                    This will disable login for this business. The business will not be able to authenticate, but data will be preserved.
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
                  <p className="text-sm text-green-700">
                    This will enable login for this business. The business will be able to authenticate again.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDisableModal({ show: false, business: null })}
                disabled={disabling}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDisable}
                disabled={disabling}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white disabled:opacity-50 ${
                  showDisableModal.business.is_active
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {disabling ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Processing...</span>
                  </>
                ) : (
                  showDisableModal.business.is_active ? 'Disable Login' : 'Enable Login'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal.show && showResetPasswordModal.business && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Reset Business Password</h3>
              <button
                onClick={() => setShowResetPasswordModal({ show: false, business: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                <strong>Business:</strong> {showResetPasswordModal.business.business_name}
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password *
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Minimum 8 characters required
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowResetPasswordModal({ show: false, business: null })}
                disabled={resetting}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResetPassword}
                disabled={resetting || !newPassword.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
              >
                {resetting ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Resetting...</span>
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Business Modal */}
      {showDeleteModal.show && showDeleteModal.business && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-medium text-gray-900">
                  {showDeleteModal.type === 'complete' ? 'Delete Business Permanently' : 'Deactivate Business'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal({ show: false, business: null, type: 'soft' });
                  setConfirmDeleteComplete(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Business:</strong> {showDeleteModal.business.business_name}
              </p>
              {showDeleteModal.type === 'complete' ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                  <p className="text-sm font-semibold text-red-800 mb-2">⚠️ PERMANENT DELETION</p>
                  <p className="text-sm text-red-700">
                    This will <strong>PERMANENTLY DELETE</strong>:
                  </p>
                  <ul className="text-sm text-red-700 list-disc list-inside mt-2">
                    <li>The business account</li>
                    <li>All employees</li>
                    <li>All time records</li>
                    <li>All payrolls and details</li>
                    <li>All deductions and incidents</li>
                    <li>All sick leave records</li>
                    <li>All break compliance alerts</li>
                    <li>All configurations and settings</li>
                    <li><strong>ALL DATA</strong></li>
                  </ul>
                  <p className="text-sm font-semibold text-red-800 mt-2">
                    This action CANNOT be undone!
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                  <p className="text-sm text-yellow-700">
                    This will deactivate the business (soft delete). The business will not be able to login, but all data will be preserved and can be reactivated later.
                  </p>
                </div>
              )}
            </div>

            {showDeleteModal.type === 'complete' && (
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={confirmDeleteComplete}
                    onChange={(e) => setConfirmDeleteComplete(e.target.checked)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    I understand this will permanently delete all data
                  </span>
                </label>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal({ show: false, business: null, type: 'soft' });
                  setConfirmDeleteComplete(false);
                }}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting || (showDeleteModal.type === 'complete' && !confirmDeleteComplete)}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white disabled:opacity-50 ${
                  showDeleteModal.type === 'complete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {deleting ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Deleting...</span>
                  </>
                ) : (
                  showDeleteModal.type === 'complete' ? 'Delete Permanently' : 'Deactivate'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default BusinessList;
