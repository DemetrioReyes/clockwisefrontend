import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import noticesService, { PayNotice } from '../../../services/notices.service';
import employeeService from '../../../services/employee.service';
import { FileText, Download, CheckCircle2, Clock, ArrowLeft, User, Plus, Trash2 } from 'lucide-react';
import SignNoticeModal from './SignNoticeModal';

const EmployeeNotices: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [notices, setNotices] = useState<PayNotice[]>([]);
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState<PayNotice | null>(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (employeeId) {
      loadData();
    }
  }, [employeeId]);

  const loadData = async () => {
    if (!employeeId) return;
    
    setLoading(true);
    try {
      const [noticesData, employeeData] = await Promise.all([
        noticesService.getEmployeeNotices(employeeId),
        employeeService.getEmployeeById(employeeId)
      ]);
      
      setNotices(noticesData);
      setEmployee(employeeData);
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notices del Empleado</h1>
              {employee && (
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <User className="w-4 h-4" />
                  <span>
                    {employee.first_name} {employee.last_name} ({employee.employee_code})
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate(`/business/notices/create/${employeeId}`)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear Notice
          </button>
        </div>

        {/* Lista de Notices */}
        {notices.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No se encontraron notices para este empleado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {getNoticeTypeLabel(notice.notice_type)}
                      </h3>
                      {getStatusBadge(notice.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Generado:</span>{' '}
                        {new Date(notice.generated_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      {notice.signed_at && (
                        <div>
                          <span className="font-medium">Firmado:</span>{' '}
                          {new Date(notice.signed_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Tasa:</span>{' '}
                        {notice.pay_rate_type === 'hourly' ? '$' : ''}
                        {notice.pay_rate_value?.toFixed(2)}
                        {notice.pay_rate_type === 'hourly' ? '/hr' : '/año'}
                      </div>
                      <div>
                        <span className="font-medium">Frecuencia:</span>{' '}
                        {notice.pay_frequency === 'weekly' ? 'Semanal' :
                         notice.pay_frequency === 'biweekly' ? 'Quincenal' :
                         'Mensual'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleDownload(notice, false)}
                      className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Descargar original"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    {notice.is_signed && (
                      <button
                        onClick={() => handleDownload(notice, true)}
                        className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
                        title="Descargar firmado"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    )}
                    {!notice.is_signed && (
                      <button
                        onClick={() => handleSignClick(notice)}
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                      >
                        Firmar
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notice)}
                      className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar notice"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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

export default EmployeeNotices;
