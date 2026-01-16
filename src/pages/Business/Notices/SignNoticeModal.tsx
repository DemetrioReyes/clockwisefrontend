import React, { useRef, useState } from 'react';
import Modal from '../../../components/Common/Modal';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import noticesService, { PayNotice } from '../../../services/notices.service';
import SignatureCanvas from 'react-signature-canvas';
import { Check, RotateCcw } from 'lucide-react';

interface SignNoticeModalProps {
  notice: PayNotice;
  onClose: () => void;
  onSuccess: () => void;
}

const SignNoticeModal: React.FC<SignNoticeModalProps> = ({ notice, onClose, onSuccess }) => {
  const sigPadRef = useRef<SignatureCanvas>(null);
  const [signing, setSigning] = useState(false);
  const [employeeLanguage, setEmployeeLanguage] = useState('');
  const { showToast } = useToast();

  const handleClear = () => {
    sigPadRef.current?.clear();
  };

  const handleSign = async () => {
    if (sigPadRef.current?.isEmpty()) {
      showToast('Por favor dibuje su firma', 'error');
      return;
    }

    setSigning(true);
    try {
      const signatureData = sigPadRef.current?.toDataURL();
      if (!signatureData) {
        throw new Error('Error al generar la firma');
      }

      await noticesService.signNotice(notice.id, {
        signature_data: signatureData,
        employee_primary_language: employeeLanguage || undefined,
        signature_metadata: {
          device: navigator.userAgent,
          ip_address: 'Unknown',
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        },
      });

      showToast('Documento firmado exitosamente', 'success');
      onSuccess();
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setSigning(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Firmar Notice">
      <div className="space-y-6">
        {/* Información del Notice */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Información del Documento</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Empleado:</span>{' '}
              <span className="font-medium">
                {notice.first_name} {notice.last_name} ({notice.employee_code})
              </span>
            </div>
            <div>
              <span className="text-gray-600">Tipo:</span>{' '}
              <span className="font-medium">
                {notice.notice_type === 'initial' ? 'Inicial' : 
                 notice.notice_type === 'rate_change' ? 'Cambio de Tasa' : 
                 'Cambio de Día de Pago'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Fecha Generación:</span>{' '}
              <span className="font-medium">
                {new Date(notice.generated_at).toLocaleDateString('es-ES')}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Estado:</span>{' '}
              <span className="font-medium">
                {notice.status === 'generated' ? 'Generado' :
                 notice.status === 'sent_to_employee' ? 'Enviado' :
                 notice.status === 'signed' ? 'Firmado' : 'Archivado'}
              </span>
            </div>
          </div>
        </div>

        {/* Idioma Primario del Empleado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Idioma Primario del Empleado (Opcional)
          </label>
          <input
            type="text"
            value={employeeLanguage}
            onChange={(e) => setEmployeeLanguage(e.target.value)}
            placeholder="Ej: Español, English, etc."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Canvas de Firma */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Firma Digital
          </label>
          <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
            <SignatureCanvas
              ref={sigPadRef}
              canvasProps={{
                className: 'signature-canvas w-full',
                style: { width: '100%', height: '200px' },
              }}
              backgroundColor="rgb(255, 255, 255)"
              penColor="rgb(0, 0, 0)"
            />
          </div>
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Limpiar
            </button>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={signing}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleSign}
            disabled={signing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Firmando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Firmar Documento
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SignNoticeModal;
