import { useState, useEffect, useRef } from 'react';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import { signaturesService } from '../../../services/signatures.service';
import { pdfService } from '../../../services/pdf.service';
import SignatureCanvas from 'react-signature-canvas';

const DigitalSignatures = () => {
  const [pdfHistory, setPdfHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState('');
  const sigPadRef = useRef<any>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadPDFHistory();
  }, []);

  const loadPDFHistory = async () => {
    setLoading(true);
    try {
      const data = await pdfService.getPDFHistory(undefined, undefined, 20);
      setPdfHistory(data);
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearSignature = () => {
    sigPadRef.current?.clear();
  };

  const handleSign = async () => {
    if (!selectedPDF) {
      showToast('Seleccione un PDF para firmar', 'error');
      return;
    }

    if (sigPadRef.current?.isEmpty()) {
      showToast('Por favor dibuje su firma', 'error');
      return;
    }

    setSigning(true);
    try {
      const signatureData = sigPadRef.current.toDataURL();
      const metadata = signaturesService.getSignatureMetadata();

      await signaturesService.signDocument({
        payroll_pdf_id: selectedPDF,
        signature_type: 'drawn',
        signature_data: signatureData,
        signature_metadata: metadata,
      });

      showToast('Documento firmado exitosamente', 'success');
      clearSignature();
      setSelectedPDF('');
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setSigning(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            Firmas Digitales
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Firme comprobantes de pago digitalmente
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Firmar Documento</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="pdf_select" className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar PDF para Firmar
              </label>
              <select
                id="pdf_select"
                value={selectedPDF}
                onChange={(e) => setSelectedPDF(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Seleccione un PDF</option>
                {pdfHistory.map((pdf) => (
                  <option key={pdf.id} value={pdf.pdf_filename}>
                    {pdf.pdf_filename}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dibuje su Firma
              </label>
              <div className="border-2 border-gray-300 rounded-lg bg-white">
                <SignatureCanvas
                  ref={sigPadRef}
                  canvasProps={{
                    className: 'w-full h-48',
                  }}
                />
              </div>
              <div className="mt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={clearSignature}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSign}
                disabled={signing || !selectedPDF}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {signing ? 'Firmando...' : 'Firmar Documento'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">PDFs Disponibles</h3>
          {loading ? (
            <LoadingSpinner />
          ) : pdfHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay PDFs generados</p>
          ) : (
            <div className="space-y-2">
              {pdfHistory.map((pdf) => (
                <div
                  key={pdf.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{pdf.pdf_filename}</p>
                    <p className="text-xs text-gray-500">
                      Generado: {new Date(pdf.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPDF(pdf.pdf_filename)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Seleccionar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DigitalSignatures;

