import React, { useState, useEffect } from 'react';
import { formatErrorMessage } from '../../services/api';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { useToast } from '../../components/Common/Toast';
import businessService from '../../services/business.service';
import { Business, BusinessRegisterData } from '../../types';
import { Building2, Search, Plus, Edit2, X, Lock, Unlock, Key, Trash2, AlertTriangle, Users, Settings, Mail, Phone, Calendar, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDateUS } from '../../utils/dateFormat';
import Modal from '../../components/Common/Modal';

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

  const [expandedBusinesses, setExpandedBusinesses] = useState<Set<string>>(new Set());

  const toggleBusiness = (businessId: string) => {
    const newExpanded = new Set(expandedBusinesses);
    if (newExpanded.has(businessId)) {
      newExpanded.delete(businessId);
    } else {
      newExpanded.add(businessId);
    }
    setExpandedBusinesses(newExpanded);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30">
        <header className="bg-white shadow-lg border-b border-gray-200 fixed top-0 right-0 left-0 z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <Link to="/super-admin/dashboard" className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-800">Volver al Dashboard</span>
            </Link>
          </div>
        </header>
        <div className="flex justify-center items-center min-h-screen pt-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30">
      {/* Custom Header sin sidebar */}
      <header className="bg-white shadow-lg border-b border-gray-200 fixed top-0 right-0 left-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <Link to="/super-admin/dashboard" className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-800">Volver al Dashboard</span>
          </Link>
        </div>
      </header>
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">All Businesses</h1>
                </div>
                <p className="text-gray-600 ml-14">
                  Gestión completa de todos los negocios del sistema
                </p>
              </div>
              <Link
                to="/super-admin/register-business"
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-2.5 rounded-lg shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 font-semibold"
              >
                <Plus className="w-5 h-5" />
                <span>Register Business</span>
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, owner, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Businesses Cards */}
          <div className="space-y-4">
            {filteredBusinesses.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-16 text-center">
                <div className="flex flex-col items-center">
                  <Building2 className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-gray-500 font-medium text-lg">
                    {searchTerm ? 'No businesses found matching your search' : 'No businesses registered yet'}
                  </p>
                  {!searchTerm && (
                    <Link
                      to="/super-admin/register-business"
                      className="text-purple-600 hover:text-purple-700 mt-4 font-semibold"
                    >
                      Register your first business →
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              filteredBusinesses.map((business) => {
                const isExpanded = expandedBusinesses.has(business.id);
                
                return (
                  <div
                    key={business.id}
                    className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all hover:shadow-xl"
                  >
                    {/* Business Header */}
                    <div
                      onClick={() => toggleBusiness(business.id)}
                      className={`p-6 cursor-pointer transition-all ${
                        isExpanded
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600'
                          : 'bg-gradient-to-r from-gray-50 to-purple-50 hover:from-purple-50 hover:to-blue-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-3 rounded-xl ${
                            isExpanded ? 'bg-white/20' : 'bg-blue-100'
                          }`}>
                            <Building2 className={`w-6 h-6 ${isExpanded ? 'text-white' : 'text-blue-600'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className={`text-xl font-bold ${isExpanded ? 'text-white' : 'text-gray-900'}`}>
                                {business.business_name}
                              </h3>
                              <span
                                className={`px-3 py-1 inline-flex text-xs font-bold rounded-full shadow-sm ${
                                  business.is_active
                                    ? isExpanded
                                      ? 'bg-green-500 text-white'
                                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                    : isExpanded
                                      ? 'bg-red-500 text-white'
                                      : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                                }`}
                              >
                                {business.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                              <span className={`text-sm ${isExpanded ? 'text-purple-100' : 'text-gray-600'}`}>
                                {business.company_name}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${isExpanded ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                {business.tenant_id}
                              </span>
                              {business.employee_count !== undefined && business.employee_count > 0 && (
                                <span className={`text-sm font-semibold flex items-center gap-1 ${isExpanded ? 'text-white' : 'text-purple-600'}`}>
                                  <Users className="w-4 h-4" />
                                  {business.employee_count} empleado{business.employee_count !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronUp className="w-6 h-6 text-white" />
                          ) : (
                            <ChevronDown className="w-6 h-6 text-gray-600" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Business Details */}
                    {isExpanded && (
                      <div className="p-6 bg-gray-50">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Información Principal */}
                          <div className="space-y-4">
                            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <Building2 className="w-5 h-5 text-purple-600" />
                              Información del Negocio
                            </h4>
                            
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">EIN/Tax ID</p>
                                  <p className="text-sm font-semibold text-gray-900">{business.rfc}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Billing Cycle</p>
                                  <p className="text-sm font-semibold text-gray-900 capitalize">{business.billing_cycle || 'N/A'}</p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                Dirección
                              </p>
                              <p className="text-sm font-medium text-gray-900">{business.address || 'No especificada'}</p>
                            </div>
                          </div>

                          {/* Información de Contacto */}
                          <div className="space-y-4">
                            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <Users className="w-5 h-5 text-blue-600" />
                              Información de Contacto
                            </h4>
                            
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                Contacto Principal
                              </p>
                              <p className="text-sm font-semibold text-gray-900">
                                {business.contact_first_name} {business.contact_last_name}
                              </p>
                            </div>

                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                Email
                              </p>
                              <p className="text-sm font-medium text-gray-900">{business.email}</p>
                            </div>

                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                Teléfono
                              </p>
                              <p className="text-sm font-medium text-gray-900">{business.phone || 'N/A'}</p>
                              {business.contact_phone && business.contact_phone !== business.phone && (
                                <p className="text-xs text-gray-500 mt-1">Contacto: {business.contact_phone}</p>
                              )}
                            </div>

                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Fecha de Registro
                              </p>
                              <p className="text-sm font-medium text-gray-900">{formatDateUS(business.created_at)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(business);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                          >
                            <Edit2 className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDisableClick(business);
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-semibold ${
                              business.is_active
                                ? 'bg-orange-600 text-white hover:bg-orange-700'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {business.is_active ? (
                              <>
                                <Lock className="w-4 h-4" />
                                Desactivar Login
                              </>
                            ) : (
                              <>
                                <Unlock className="w-4 h-4" />
                                Activar Login
                              </>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowResetPasswordModal({ show: true, business });
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                          >
                            <Key className="w-4 h-4" />
                            Reset Password
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(business, 'soft');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold"
                          >
                            <X className="w-4 h-4" />
                            Desactivar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(business, 'complete');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar Permanentemente
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Edit Business Modal */}
      <Modal
        isOpen={!!editingBusiness}
        onClose={handleCancelEdit}
        title="Edit Business"
        size="lg"
      >

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
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
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
      </Modal>

      {/* Disable Business Modal */}
      <Modal
        isOpen={showDisableModal.show && !!showDisableModal.business}
        onClose={() => setShowDisableModal({ show: false, business: null })}
        title={showDisableModal.business?.is_active ? 'Disable Business Login' : 'Enable Business Login'}
      >

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            <strong>Business:</strong> {showDisableModal.business?.business_name}
          </p>
          {showDisableModal.business?.is_active ? (
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
              showDisableModal.business?.is_active
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
              showDisableModal.business?.is_active ? 'Disable Login' : 'Enable Login'
            )}
          </button>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={showResetPasswordModal.show && !!showResetPasswordModal.business}
        onClose={() => setShowResetPasswordModal({ show: false, business: null })}
        title="Reset Business Password"
      >

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-4">
            <strong>Business:</strong> {showResetPasswordModal.business?.business_name}
          </p>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Password *
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password (min 8 characters)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
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
      </Modal>

      {/* Delete Business Modal */}
      <Modal
        isOpen={showDeleteModal.show && !!showDeleteModal.business}
        onClose={() => {
          setShowDeleteModal({ show: false, business: null, type: 'soft' });
          setConfirmDeleteComplete(false);
        }}
        title={showDeleteModal.type === 'complete' ? 'Delete Business Permanently' : 'Deactivate Business'}
      >
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            <strong>Business:</strong> {showDeleteModal.business?.business_name}
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
      </Modal>
    </div>
  );
};

export default BusinessList;
