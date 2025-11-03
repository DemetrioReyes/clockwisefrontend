import { useState, useEffect } from 'react';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import { pdfService } from '../../../services/pdf.service';
import payrollService from '../../../services/payroll.service';
import { getEmployees } from '../../../services/employee.service';
import { Employee, PayrollResponse } from '../../../types';

const PDFGeneration = () => {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { showToast } = useToast();

  const [summaryForm, setSummaryForm] = useState({
    payroll_id: '',
    include_deductions_detail: true,
    include_tip_credit_info: true,
  });

  const [detailedForm, setDetailedForm] = useState({
    payroll_id: '',
    employee_id: '',
    include_time_details: true,
    include_deductions_breakdown: true,
    include_tip_credit_calculation: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [payrollsData, employeesData] = await Promise.all([
        payrollService.listPayrolls('completed', 20),
        getEmployees(true),
      ]);
      setPayrolls(payrollsData.payrolls || payrollsData);
      setEmployees(employeesData);
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const result = await pdfService.generateSummaryPDF(summaryForm);
      showToast('PDF de resumen generado exitosamente', 'success');
      
      const blob = await pdfService.downloadPDF(result.pdf_filename);
      pdfService.downloadPDFBlob(blob, result.pdf_filename);
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateDetailed = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const result = await pdfService.generateDetailedPDF(detailedForm);
      showToast('PDF detallado generado exitosamente', 'success');
      
      const blob = await pdfService.downloadPDF(result.pdf_filename);
      pdfService.downloadPDFBlob(blob, result.pdf_filename);
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            Generación de PDFs
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Genere comprobantes de pago en PDF
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              PDF Resumen (Todos los Empleados)
            </h3>
            <form onSubmit={handleGenerateSummary} className="space-y-4">
              <div>
                <label htmlFor="summary_payroll" className="block text-sm font-medium text-gray-700">
                  Nómina *
                </label>
                <select
                  id="summary_payroll"
                  required
                  value={summaryForm.payroll_id}
                  onChange={(e) => setSummaryForm({ ...summaryForm, payroll_id: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Seleccione una nómina</option>
                  {payrolls.map((payroll) => (
                    <option key={payroll.id} value={payroll.id}>
                      {payroll.period_start} - {payroll.period_end} ({payroll.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    id="include_deductions"
                    type="checkbox"
                    checked={summaryForm.include_deductions_detail}
                    onChange={(e) => setSummaryForm({ ...summaryForm, include_deductions_detail: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="include_deductions" className="ml-2 block text-sm text-gray-900">
                    Incluir detalle de deducciones
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="include_tip_credit"
                    type="checkbox"
                    checked={summaryForm.include_tip_credit_info}
                    onChange={(e) => setSummaryForm({ ...summaryForm, include_tip_credit_info: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="include_tip_credit" className="ml-2 block text-sm text-gray-900">
                    Incluir información de tip credit
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {generating ? 'Generando...' : 'Generar PDF Resumen'}
              </button>
            </form>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              PDF Detallado (Un Empleado)
            </h3>
            <form onSubmit={handleGenerateDetailed} className="space-y-4">
              <div>
                <label htmlFor="detailed_payroll" className="block text-sm font-medium text-gray-700">
                  Nómina *
                </label>
                <select
                  id="detailed_payroll"
                  required
                  value={detailedForm.payroll_id}
                  onChange={(e) => setDetailedForm({ ...detailedForm, payroll_id: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Seleccione una nómina</option>
                  {payrolls.map((payroll) => (
                    <option key={payroll.id} value={payroll.id}>
                      {payroll.period_start} - {payroll.period_end} ({payroll.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="employee" className="block text-sm font-medium text-gray-700">
                  Empleado *
                </label>
                <select
                  id="employee"
                  required
                  value={detailedForm.employee_id}
                  onChange={(e) => setDetailedForm({ ...detailedForm, employee_id: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Seleccione un empleado</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    id="include_time"
                    type="checkbox"
                    checked={detailedForm.include_time_details}
                    onChange={(e) => setDetailedForm({ ...detailedForm, include_time_details: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="include_time" className="ml-2 block text-sm text-gray-900">
                    Incluir detalles de tiempo
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="include_deductions_detailed"
                    type="checkbox"
                    checked={detailedForm.include_deductions_breakdown}
                    onChange={(e) => setDetailedForm({ ...detailedForm, include_deductions_breakdown: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="include_deductions_detailed" className="ml-2 block text-sm text-gray-900">
                    Incluir desglose de deducciones
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="include_tip_detailed"
                    type="checkbox"
                    checked={detailedForm.include_tip_credit_calculation}
                    onChange={(e) => setDetailedForm({ ...detailedForm, include_tip_credit_calculation: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="include_tip_detailed" className="ml-2 block text-sm text-gray-900">
                    Incluir cálculo de tip credit
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {generating ? 'Generando...' : 'Generar PDF Detallado'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PDFGeneration;

