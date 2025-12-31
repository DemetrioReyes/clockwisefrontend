import { useState, useEffect } from 'react';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { useToast } from '../../components/Common/Toast';
import { formatErrorMessage } from '../../services/api';
import { superAdminTipCreditService } from '../../services/superAdminTipCredit.service';
import businessService from '../../services/business.service';
import { TipCreditConfig, TipCreditConfigCreate, Business } from '../../types';
import { DollarSign, Edit2, Trash2, Plus, Search, Building2, Globe, Settings, Filter, X, ChevronDown, ChevronUp, MapPin, Calendar } from 'lucide-react';
import Modal from '../../components/Common/Modal';
import { formatDateUS } from '../../utils/dateFormat';
import Header from '../../components/Layout/Header';
import { Link } from 'react-router-dom';

const TipCreditManagement = () => {
  const [configs, setConfigs] = useState<TipCreditConfig[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<TipCreditConfig | null>(null);
  const [deletingConfig, setDeletingConfig] = useState<TipCreditConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTenant, setFilterTenant] = useState<string>('all');
  const [activeOnly, setActiveOnly] = useState(false);
  
  const [createForm, setCreateForm] = useState({
    config_name: '',
    state: 'NY',
    city: '',
    minimum_wage: '',
    cash_wage: '',
    tip_credit_amount: '',
    minimum_tips_threshold: '',
    effective_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: '',
    target_tenant_id: '0000', // Por defecto global
  });

  const [editForm, setEditForm] = useState({
    config_name: '',
    minimum_wage: '',
    cash_wage: '',
    tip_credit_amount: '',
    minimum_tips_threshold: '',
    end_date: '',
    notes: '',
    is_active: true,
  });

  const { showToast } = useToast();

  const parseNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const normalized = typeof value === 'string' ? value.replace(/,/g, '') : String(value);
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatCurrency = (value: any) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(
      parseNumber(value)
    );

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOnly]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [configsData, businessesData] = await Promise.all([
        superAdminTipCreditService.listAllConfigs(activeOnly),
        businessService.listBusinesses(),
      ]);
      
      setConfigs(configsData.configs || []);
      setBusinesses(businessesData || []);
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const getBusinessName = (tenantId?: string): string => {
    if (!tenantId || tenantId === '0000') return 'Sistema Global';
    const business = businesses.find(b => b.tenant_id === tenantId);
    return business ? `${business.business_name} (${business.company_name})` : `Tenant ${tenantId}`;
  };

  const filteredConfigs = configs.filter(config => {
    const matchesSearch = 
      config.config_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (config.city && config.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      getBusinessName(config.tenant_id).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTenant = filterTenant === 'all' || 
      (filterTenant === 'global' && (!config.tenant_id || config.tenant_id === '0000')) ||
      (filterTenant !== 'all' && filterTenant !== 'global' && config.tenant_id === filterTenant);
    
    return matchesSearch && matchesTenant;
  });

  // Agrupar configuraciones por tenant
  const groupedConfigs = filteredConfigs.reduce((acc, config) => {
    const tenantId = config.tenant_id || '0000';
    const tenantName = getBusinessName(config.tenant_id);
    
    if (!acc[tenantId]) {
      acc[tenantId] = {
        tenantId,
        tenantName,
        configs: [],
        isGlobal: tenantId === '0000'
      };
    }
    acc[tenantId].configs.push(config);
    return acc;
  }, {} as Record<string, { tenantId: string; tenantName: string; configs: TipCreditConfig[]; isGlobal: boolean }>);

  const [expandedTenants, setExpandedTenants] = useState<Set<string>>(new Set(Object.keys(groupedConfigs)));

  const toggleTenant = (tenantId: string) => {
    const newExpanded = new Set(expandedTenants);
    if (newExpanded.has(tenantId)) {
      newExpanded.delete(tenantId);
    } else {
      newExpanded.add(tenantId);
    }
    setExpandedTenants(newExpanded);
  };

  const handleOpenCreateModal = () => {
    setCreateForm({
      config_name: '',
      state: 'NY',
      city: '',
      minimum_wage: '',
      cash_wage: '',
      tip_credit_amount: '',
      minimum_tips_threshold: '',
      effective_date: new Date().toISOString().split('T')[0],
      end_date: '',
      notes: '',
      target_tenant_id: '0000',
    });
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleCreateConfig = async () => {
    const minWage = parseNumber(createForm.minimum_wage);
    const cashWage = parseNumber(createForm.cash_wage);
    const tipCredit = parseNumber(createForm.tip_credit_amount);

    if (Math.abs((cashWage + tipCredit) - minWage) > 0.01) {
      showToast('Error: Cash Wage + Tip Credit debe ser igual a Minimum Wage', 'error');
      return;
    }

    setSaving(true);
    try {
      const data: TipCreditConfigCreate = {
        config_name: createForm.config_name,
        state: createForm.state,
        minimum_wage: minWage,
        cash_wage: cashWage,
        tip_credit_amount: tipCredit,
        effective_date: createForm.effective_date,
      };

      if (createForm.city) data.city = createForm.city;
      if (createForm.minimum_tips_threshold) data.minimum_tips_threshold = parseNumber(createForm.minimum_tips_threshold);
      if (createForm.end_date) data.end_date = createForm.end_date;
      if (createForm.notes) data.notes = createForm.notes;

      const targetTenantId = createForm.target_tenant_id === '0000' ? undefined : createForm.target_tenant_id;
      await superAdminTipCreditService.createConfigForTenant(data, targetTenantId);
      
      showToast('Configuración creada exitosamente', 'success');
      setShowCreateModal(false);
      loadData();
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditModal = (config: TipCreditConfig) => {
    setEditingConfig(config);
    setEditForm({
      config_name: config.config_name,
      minimum_wage: String(config.minimum_wage),
      cash_wage: String(config.cash_wage),
      tip_credit_amount: String(config.tip_credit_amount),
      minimum_tips_threshold: config.minimum_tips_threshold ? String(config.minimum_tips_threshold) : '',
      end_date: config.end_date || '',
      notes: config.notes || '',
      is_active: config.is_active,
    });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingConfig(null);
  };

  const handleUpdateConfig = async () => {
    if (!editingConfig) return;

    const minWage = parseNumber(editForm.minimum_wage);
    const cashWage = parseNumber(editForm.cash_wage);
    const tipCredit = parseNumber(editForm.tip_credit_amount);

    if (editForm.minimum_wage && editForm.cash_wage && editForm.tip_credit_amount) {
      if (Math.abs((cashWage + tipCredit) - minWage) > 0.01) {
        showToast('Error: Cash Wage + Tip Credit debe ser igual a Minimum Wage', 'error');
        return;
      }
    }

    setSaving(true);
    try {
      const updateData: any = {};
      if (editForm.config_name) updateData.config_name = editForm.config_name;
      if (editForm.minimum_wage) updateData.minimum_wage = minWage;
      if (editForm.cash_wage) updateData.cash_wage = cashWage;
      if (editForm.tip_credit_amount) updateData.tip_credit_amount = tipCredit;
      if (editForm.minimum_tips_threshold) updateData.minimum_tips_threshold = parseNumber(editForm.minimum_tips_threshold);
      if (editForm.end_date !== undefined) updateData.end_date = editForm.end_date || null;
      if (editForm.notes !== undefined) updateData.notes = editForm.notes || null;
      updateData.is_active = editForm.is_active;

      await superAdminTipCreditService.updateConfig(editingConfig.id, updateData);
      
      showToast('Configuración actualizada exitosamente', 'success');
      setShowEditModal(false);
      loadData();
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteModal = (config: TipCreditConfig) => {
    setDeletingConfig(config);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingConfig(null);
  };

  const handleDeleteConfig = async () => {
    if (!deletingConfig) return;

    setDeleting(true);
    try {
      await superAdminTipCreditService.deleteConfig(deletingConfig.id);
      showToast('Configuración eliminada exitosamente', 'success');
      setShowDeleteModal(false);
      loadData();
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const createTotalCheck = parseNumber(createForm.cash_wage) + parseNumber(createForm.tip_credit_amount);
  const createIsValid = Math.abs(createTotalCheck - parseNumber(createForm.minimum_wage)) < 0.01 || 
    (!createForm.minimum_wage || !createForm.cash_wage || !createForm.tip_credit_amount);

  const editTotalCheck = parseNumber(editForm.cash_wage) + parseNumber(editForm.tip_credit_amount);
  const editIsValid = Math.abs(editTotalCheck - parseNumber(editForm.minimum_wage)) < 0.01 || 
    (!editForm.minimum_wage || !editForm.cash_wage || !editForm.tip_credit_amount);

  if (loading && configs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center min-h-screen pt-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  const activeConfigs = configs.filter(c => c.is_active).length;
  const globalConfigs = configs.filter(c => !c.tenant_id || c.tenant_id === '0000').length;
  const tenantConfigs = configs.length - globalConfigs;

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
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Tip Credit Management
                </h1>
              </div>
              <p className="text-gray-600 ml-14">
                Administra y configura las políticas de tip credit para todos los tenants del sistema
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nueva Configuración
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">Total Configuraciones</p>
                  <p className="text-3xl font-bold text-blue-900">{configs.length}</p>
                </div>
                <div className="p-3 bg-blue-200 rounded-lg">
                  <Settings className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">Configuraciones Activas</p>
                  <p className="text-3xl font-bold text-green-900">{activeConfigs}</p>
                </div>
                <div className="p-3 bg-green-200 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 mb-1">Globales</p>
                  <p className="text-3xl font-bold text-purple-900">{globalConfigs}</p>
                </div>
                <div className="p-3 bg-purple-200 rounded-lg">
                  <Globe className="w-6 h-6 text-purple-700" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-5 border border-indigo-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-700 mb-1">Por Tenant</p>
                  <p className="text-3xl font-bold text-indigo-900">{tenantConfigs}</p>
                </div>
                <div className="p-3 bg-indigo-200 rounded-lg">
                  <Building2 className="w-6 h-6 text-indigo-700" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
            </div>
            {(searchTerm || filterTenant !== 'all' || activeOnly) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterTenant('all');
                  setActiveOnly(false);
                }}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Limpiar filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, estado, ciudad..."
                  className="pl-10 w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Filtrar por Tenant</label>
              <select
                value={filterTenant}
                onChange={(e) => setFilterTenant(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              >
                <option value="all">Todos los tenants</option>
                <option value="global">Solo Sistema Global</option>
                {businesses.map(business => (
                  <option key={business.tenant_id} value={business.tenant_id}>
                    {business.business_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={activeOnly}
                    onChange={(e) => setActiveOnly(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    activeOnly ? 'bg-purple-600' : 'bg-gray-300'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                      activeOnly ? 'translate-x-5' : 'translate-x-0.5'
                    } mt-0.5`}></div>
                  </div>
                </div>
                <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  Solo configuraciones activas
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Configuraciones agrupadas por Tenant */}
        <div className="space-y-4">
          {Object.keys(groupedConfigs).length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-16 text-center">
              <div className="flex flex-col items-center">
                <Settings className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-gray-500 font-medium text-lg">No se encontraron configuraciones</p>
                <p className="text-sm text-gray-400 mt-2">
                  {searchTerm || filterTenant !== 'all' || activeOnly
                    ? 'Intenta ajustar los filtros'
                    : 'Crea tu primera configuración'}
                </p>
              </div>
            </div>
          ) : (
            Object.values(groupedConfigs)
              .sort((a, b) => {
                // Global primero, luego alfabético
                if (a.isGlobal) return -1;
                if (b.isGlobal) return 1;
                return a.tenantName.localeCompare(b.tenantName);
              })
              .map((group) => {
                const isExpanded = expandedTenants.has(group.tenantId);
                const activeCount = group.configs.filter(c => c.is_active).length;
                
                return (
                  <div
                    key={group.tenantId}
                    className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all hover:shadow-xl"
                  >
                    {/* Tenant Header */}
                    <div
                      onClick={() => toggleTenant(group.tenantId)}
                      className={`p-6 cursor-pointer transition-all ${
                        isExpanded
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600'
                          : 'bg-gradient-to-r from-gray-50 to-purple-50 hover:from-purple-50 hover:to-blue-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${
                            isExpanded ? 'bg-white/20' : group.isGlobal ? 'bg-purple-100' : 'bg-blue-100'
                          }`}>
                            {group.isGlobal ? (
                              <Globe className={`w-6 h-6 ${isExpanded ? 'text-white' : 'text-purple-600'}`} />
                            ) : (
                              <Building2 className={`w-6 h-6 ${isExpanded ? 'text-white' : 'text-blue-600'}`} />
                            )}
                          </div>
                          <div>
                            <h3 className={`text-xl font-bold ${isExpanded ? 'text-white' : 'text-gray-900'}`}>
                              {group.tenantName}
                            </h3>
                            <div className="flex items-center gap-4 mt-1">
                              <span className={`text-sm ${isExpanded ? 'text-purple-100' : 'text-gray-600'}`}>
                                {group.configs.length} configuración{group.configs.length !== 1 ? 'es' : ''}
                              </span>
                              {activeCount > 0 && (
                                <span className={`text-sm font-semibold ${isExpanded ? 'text-green-200' : 'text-green-600'}`}>
                                  {activeCount} activa{activeCount !== 1 ? 's' : ''}
                                </span>
                              )}
                              {!group.isGlobal && group.tenantId !== '0000' && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${isExpanded ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                  {group.tenantId}
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

                    {/* Configuraciones del Tenant */}
                    {isExpanded && (
                      <div className="p-6 bg-gray-50">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {group.configs
                            .sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime())
                            .map((config) => (
                            <div
                              key={config.id}
                              className={`bg-white rounded-lg p-5 border-2 transition-all hover:shadow-lg ${
                                config.is_active
                                  ? 'border-green-200 hover:border-green-300'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="text-lg font-bold text-gray-900">{config.config_name}</h4>
                                    {config.is_active && (
                                      <span className="px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full">
                                        Activa
                                      </span>
                                    )}
                                  </div>
                                  {config.notes && (
                                    <p className="text-sm text-gray-600 mb-3">{config.notes}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(config)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Editar"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDeleteModal(config)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Información de ubicación */}
                              <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                                <MapPin className="w-4 h-4" />
                                <span className="font-medium">
                                  {config.state}
                                  {config.city && `, ${config.city}`}
                                </span>
                              </div>

                              {/* Grid de información financiera */}
                              <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                  <p className="text-xs text-blue-700 font-medium mb-1">Salario Mínimo</p>
                                  <p className="text-lg font-bold text-blue-900">{formatCurrency(config.minimum_wage)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                  <p className="text-xs text-gray-700 font-medium mb-1">Salario Efectivo</p>
                                  <p className="text-lg font-bold text-gray-900">{formatCurrency(config.cash_wage)}</p>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                                  <p className="text-xs text-purple-700 font-medium mb-1 flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    Tip Credit
                                  </p>
                                  <p className="text-lg font-bold text-purple-900">{formatCurrency(config.tip_credit_amount)}</p>
                                </div>
                              </div>

                              {/* Vigencia */}
                              <div className="flex items-center gap-2 text-sm text-gray-600 pt-3 border-t border-gray-200">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  Desde {formatDateUS(config.effective_date)}
                                  {config.end_date && ` hasta ${formatDateUS(config.end_date)}`}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>

        {/* Create Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={handleCloseCreateModal}
          title="Nueva Configuración de Tip Credit"
          size="lg"
        >
          <div className="space-y-5 p-1">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                <Globe className="w-4 h-4 inline mr-1" />
                Seleccionar Tenant
              </label>
              <select
                value={createForm.target_tenant_id}
                onChange={(e) => setCreateForm({ ...createForm, target_tenant_id: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white"
              >
                <option value="0000">🌐 Sistema Global (para todos los tenants)</option>
                {businesses.map(business => (
                  <option key={business.tenant_id} value={business.tenant_id}>
                    🏢 {business.business_name} ({business.company_name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Nombre de Configuración <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={createForm.config_name}
                onChange={(e) => setCreateForm({ ...createForm, config_name: e.target.value })}
                placeholder="Ej: NYC - 2025"
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Estado <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.state}
                  onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                  placeholder="NY, CA, TX..."
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Ciudad (opcional)</label>
                <input
                  type="text"
                  value={createForm.city}
                  onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                  placeholder="NYC, LA..."
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                />
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Información de Salarios
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Salario Mínimo <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={createForm.minimum_wage}
                      onChange={(e) => setCreateForm({ ...createForm, minimum_wage: e.target.value })}
                      className="w-full pl-7 rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Salario Efectivo <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={createForm.cash_wage}
                      onChange={(e) => setCreateForm({ ...createForm, cash_wage: e.target.value })}
                      className="w-full pl-7 rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tip Credit <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 font-semibold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={createForm.tip_credit_amount}
                      onChange={(e) => setCreateForm({ ...createForm, tip_credit_amount: e.target.value })}
                      className="w-full pl-7 rounded-lg border-purple-300 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-purple-50"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
            {!createIsValid && createForm.minimum_wage && createForm.cash_wage && createForm.tip_credit_amount && (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <X className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-red-800">Error de Validación</h3>
                    <p className="text-sm text-red-700 mt-1">
                      La suma de <strong>Salario Efectivo</strong> + <strong>Tip Credit</strong> debe ser igual al <strong>Salario Mínimo</strong>
                    </p>
                    <div className="mt-2 text-xs text-red-600 bg-red-100 rounded p-2 font-mono">
                      ${createForm.cash_wage || '0'} + ${createForm.tip_credit_amount || '0'} = ${createTotalCheck.toFixed(2)} 
                      <span className="text-red-800 font-bold"> ≠ </span>
                      ${createForm.minimum_wage} (requerido)
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Umbral Mínimo de Propinas ($)</label>
              <input
                type="number"
                step="0.01"
                value={createForm.minimum_tips_threshold}
                onChange={(e) => setCreateForm({ ...createForm, minimum_tips_threshold: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Efectiva *</label>
                <input
                  type="date"
                  value={createForm.effective_date}
                  onChange={(e) => setCreateForm({ ...createForm, effective_date: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Fin</label>
                <input
                  type="date"
                  value={createForm.end_date}
                  onChange={(e) => setCreateForm({ ...createForm, end_date: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCloseCreateModal}
                className="px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateConfig}
                disabled={saving || !createIsValid}
                className="px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:transform-none"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <LoadingSpinner />
                    Guardando...
                  </span>
                ) : (
                  'Crear Configuración'
                )}
              </button>
            </div>
          </div>
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          title={`Editar Configuración: ${editingConfig?.config_name}`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Configuración</label>
              <input
                type="text"
                value={editForm.config_name}
                onChange={(e) => setEditForm({ ...editForm, config_name: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salario Mínimo ($)</label>
              <input
                type="number"
                step="0.01"
                value={editForm.minimum_wage}
                onChange={(e) => setEditForm({ ...editForm, minimum_wage: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salario en Efectivo ($)</label>
              <input
                type="number"
                step="0.01"
                value={editForm.cash_wage}
                onChange={(e) => setEditForm({ ...editForm, cash_wage: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tip Credit ($)</label>
              <input
                type="number"
                step="0.01"
                value={editForm.tip_credit_amount}
                onChange={(e) => setEditForm({ ...editForm, tip_credit_amount: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            {!editIsValid && editForm.minimum_wage && editForm.cash_wage && editForm.tip_credit_amount && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <p className="text-sm text-red-700">
                  Error: Cash Wage + Tip Credit debe ser igual a Minimum Wage
                  <br />
                  ${editForm.cash_wage} + ${editForm.tip_credit_amount} = ${editTotalCheck.toFixed(2)} 
                  (debe ser ${editForm.minimum_wage})
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Umbral Mínimo de Propinas ($)</label>
              <input
                type="number"
                step="0.01"
                value={editForm.minimum_tips_threshold}
                onChange={(e) => setEditForm({ ...editForm, minimum_tips_threshold: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Fin</label>
              <input
                type="date"
                value={editForm.end_date}
                onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Activa</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUpdateConfig}
                disabled={saving || (!!editForm.minimum_wage && !!editForm.cash_wage && !!editForm.tip_credit_amount && !editIsValid)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Delete Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={handleCloseDeleteModal}
          title="Eliminar Configuración"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              ¿Estás seguro de que deseas eliminar la configuración <strong>{deletingConfig?.config_name}</strong>?
            </p>
            <p className="text-sm text-gray-500">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfig}
                disabled={deleting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </Modal>
        </div>
      </div>
    </div>
  );
};

export default TipCreditManagement;
