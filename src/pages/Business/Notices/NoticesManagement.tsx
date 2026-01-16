import React, { useState, useEffect } from 'react';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import noticesService, { PayNotice } from '../../../services/notices.service';
import employeeService from '../../../services/employee.service';
import { FileText, Download, CheckCircle2, Clock, Search, User, Trash2 } from 'lucide-react';
import SignNoticeModal from './SignNoticeModal';

const NoticesManagement: React.FC = () => {
  const [notices, setNotices] = useState<PayNotice[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<PayNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [signedFilter, setSignedFilter] = useState<string>('all');
  const [selectedNotice, setSelectedNotice] = useState<PayNotice | null>(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterNotices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, signedFilter, notices]);

  const loadData = async () => {
    setLoading(true);
    try {
      const noticesData = await noticesService.listNotices(undefined, undefined, undefined, undefined, undefined, 100);
      
      setNotices(noticesData.notices);
      setFilteredNotices(noticesData.notices);
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterNotices = () => {
    let filtered = [...notices];

    // Filtrar por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (notice) =>
          notice.employee_code?.toLowerCase().includes(term) ||
          `${notice.first_name} ${notice.last_name}`.toLowerCase().includes(term) ||
          notice.notice_type?.toLowerCase().includes(term)
      );
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter((notice) => notice.status === statusFilter);
    }

    // Filtrar por firma
    if (signedFilter === 'signed') {
      filtered = filtered.filter((notice) => notice.is_signed);
    } else if (signedFilter === 'unsigned') {
      filtered = filtered.filter((notice) => !notice.is_signed);
    }

    setFilteredNotices(filtered);
  };

  const handleDownload = async (notice: PayNotice, signed: boolean = false) => {
    try {
      const blob = await noticesService.downloadNotice(notice.id, signed);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = signed && notice.signed_document_filename 
        ? notice.signed_document_filename 
        : notice.document_filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('Documento descargado exitosamente', 'success');
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    }
  };

  const handleSignClick = (notice: PayNotice) => {
    if (notice.is_signed) {
      showToast('Este documento ya está firmado', 'info');
      return;
    }
    setSelectedNotice(notice);
    setShowSignModal(true);
  };

  const handleSignSuccess = () => {
    setShowSignModal(false);
    setSelectedNotice(null);
    loadData();
    showToast('Documento firmado exitosamente', 'success');
  };

  const handleDelete = async (notice: PayNotice) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar este notice? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await noticesService.deleteNotice(notice.id);
      showToast('Notice eliminado exitosamente', 'success');
      loadData();
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      generated: { color: 'bg-gray-100 text-gray-800', icon: Clock, text: 'Generado' },
      sent_to_employee: { color: 'bg-blue-100 text-blue-800', icon: Clock, text: 'Enviado' },
      signed: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, text: 'Firmado' },
      archived: { color: 'bg-gray-100 text-gray-800', icon: FileText, text: 'Archivado' },
    };
    const badge = badges[status as keyof typeof badges] || badges.generated;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  const getNoticeTypeLabel = (type: string) => {
    const labels = {
      initial: 'Inicial',
      rate_change: 'Cambio de Tasa',
      payday_change: 'Cambio de Día de Pago',
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Notices</h1>
            <p className="mt-1 text-sm text-gray-500">
              Notice and Acknowledgement of Pay Rate and Payday (LS 59)
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por empleado o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="generated">Generado</option>
                <option value="sent_to_employee">Enviado</option>
                <option value="signed">Firmado</option>
                <option value="archived">Archivado</option>
              </select>
            </div>
            <div>
              <select
                value={signedFilter}
                onChange={(e) => setSignedFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="signed">Firmados</option>
                <option value="unsigned">No firmados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de Notices */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Generación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Firma
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNotices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No se encontraron notices
                    </td>
                  </tr>
                ) : (
                  filteredNotices.map((notice) => (
                    <tr key={notice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-5 h-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {notice.first_name} {notice.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{notice.employee_code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {getNoticeTypeLabel(notice.notice_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(notice.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(notice.generated_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {notice.signed_at
                          ? new Date(notice.signed_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleDownload(notice, false)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                            title="Descargar original"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {notice.is_signed && (
                            <button
                              onClick={() => handleDownload(notice, true)}
                              className="text-green-600 hover:text-green-900 flex items-center gap-1"
                              title="Descargar firmado"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {!notice.is_signed && (
                            <button
                              onClick={() => handleSignClick(notice)}
                              className="text-purple-600 hover:text-purple-900 flex items-center gap-1"
                              title="Firmar"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notice)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Firma */}
        {showSignModal && selectedNotice && (
          <SignNoticeModal
            notice={selectedNotice}
            onClose={() => {
              setShowSignModal(false);
              setSelectedNotice(null);
            }}
            onSuccess={handleSignSuccess}
          />
        )}
      </div>
    </Layout>
  );
};

export default NoticesManagement;
