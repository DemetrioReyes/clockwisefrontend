import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import payrollService from '../../../services/payroll.service';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { Printer, ArrowLeft, Building2 } from 'lucide-react';

const PayrollPrintView: React.FC = () => {
  const { payrollId } = useParams<{ payrollId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payrollData, setPayrollData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayrollData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payrollId]);

  const loadPayrollData = async () => {
    try {
      if (!payrollId) return;
      const data = await payrollService.getPayrollById(payrollId);
      setPayrollData(data);
    } catch (error) {
      console.error('Error cargando nómina:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener datos de la empresa
  const businessData = user as any;
  const companyName = businessData?.company_name || 'Empresa';
  const businessAddress = businessData?.address || '';
  const businessPhone = businessData?.phone || '';
  const businessEmail = businessData?.email || '';

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando nómina..." />
      </div>
    );
  }

  if (!payrollData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl">No se encontró la nómina</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">
            Volver
          </button>
        </div>
      </div>
    );
  }

  const { payroll, calculations } = payrollData;

  return (
    <>
      {/* Botones de acción - NO se imprimen */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          Imprimir / Guardar PDF
        </button>
      </div>

      {/* Vista imprimible */}
      <div className="print-container bg-white min-h-screen p-8">
        {/* Header de la empresa */}
        <div className="mb-8 pb-6 border-b-2 border-gray-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Building2 className="w-10 h-10 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">{companyName}</h1>
              </div>
              {businessAddress && (
                <p className="text-gray-600 text-sm">📍 {businessAddress}</p>
              )}
              {businessPhone && (
                <p className="text-gray-600 text-sm">📞 {businessPhone}</p>
              )}
              {businessEmail && (
                <p className="text-gray-600 text-sm">📧 {businessEmail}</p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-blue-600 mb-2">RECIBO DE NÓMINA</h2>
              <p className="text-sm text-gray-500">ID: {payroll.id.substring(0, 8)}...</p>
              <p className="text-sm text-gray-500">Creado: {new Date(payroll.created_at).toLocaleDateString('es-ES')}</p>
            </div>
          </div>
          
          {/* Info del período */}
          <div className="mt-4 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 uppercase">Período</p>
                <p className="font-semibold">{payroll.period_start} al {payroll.period_end}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Frecuencia</p>
                <p className="font-semibold capitalize">{payroll.pay_frequency}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Status</p>
                <p className="font-semibold capitalize">{payroll.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen General */}
        <div className="mb-8 bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Resumen General</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Empleados</p>
              <p className="text-2xl font-bold">{payroll.total_employees}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pago Bruto</p>
              <p className="text-2xl font-bold text-green-600">${payroll.total_gross_pay}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Deducciones</p>
              <p className="text-2xl font-bold text-red-600">${payroll.total_deductions}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pago Neto</p>
              <p className="text-2xl font-bold text-blue-600">${payroll.total_net_pay}</p>
            </div>
          </div>
        </div>

        {/* Detalle por Empleado */}
        {calculations && calculations.map((calc: any, index: number) => (
          <div key={calc.employee_id} className="mb-8 page-break">
            <div className="border-2 border-gray-300 rounded-lg p-6">
              {/* Header del empleado */}
              <div className="bg-gray-100 -m-6 mb-6 p-4 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">{calc.employee_name}</h3>
                    <p className="text-gray-600">Código: {calc.employee_code} | Tipo: {calc.employee_type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Pago Neto</p>
                    <p className="text-3xl font-bold text-green-600">${calc.net_pay}</p>
                  </div>
                </div>
              </div>

              {/* Horas trabajadas */}
              <div className="mb-4">
                <h4 className="font-semibold text-lg mb-2 border-b pb-1">Horas Trabajadas</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Regulares</p>
                    <p className="text-lg font-bold">{calc.regular_hours}h</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Overtime</p>
                    <p className="text-lg font-bold">{calc.overtime_hours}h</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Break</p>
                    <p className="text-lg font-bold">{calc.break_hours}h</p>
                  </div>
                </div>
              </div>

              {/* Ingresos */}
              <div className="mb-4">
                <h4 className="font-semibold text-lg mb-2 border-b pb-1">Ingresos</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Pago Regular ({calc.regular_hours}h × ${calc.hourly_rate}/h)</span>
                    <span className="font-semibold">${calc.regular_pay}</span>
                  </div>
                  {parseFloat(calc.overtime_hours) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Pago Overtime ({calc.overtime_hours}h × ${(parseFloat(calc.hourly_rate) * 1.5).toFixed(2)}/h)</span>
                      <span className="font-semibold">${calc.overtime_pay}</span>
                    </div>
                  )}
                  {parseFloat(calc.spread_hours_pay || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">
                        Spread of Hours
                        {calc.spread_hours_hours && calc.spread_hours_rate 
                          ? ` (${calc.spread_hours_hours}h × $${calc.spread_hours_rate})`
                          : ''}
                      </span>
                      <span className="font-semibold">${calc.spread_hours_pay}</span>
                    </div>
                  )}
                  {parseFloat(calc.total_bonus) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Bonos</span>
                      <span className="font-semibold text-green-600">+${calc.total_bonus}</span>
                    </div>
                  )}
                  {parseFloat(calc.tips_reported) > 0 && (
                    <div className="flex justify-between bg-yellow-50 p-2 rounded">
                      <span className="text-gray-700 font-medium">💰 Propinas Reportadas</span>
                      <span className="font-bold text-yellow-700">${calc.tips_reported}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t-2 pt-2 mt-2">
                    <span className="font-bold text-lg">Pago Bruto</span>
                    <span className="font-bold text-lg text-green-600">${calc.gross_pay}</span>
                  </div>
                </div>
              </div>

              {/* Deducciones */}
              <div className="mb-4">
                <h4 className="font-semibold text-lg mb-2 border-b pb-1">Deducciones</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Impuesto Federal</span>
                    <span className="text-red-600">-${calc.federal_tax}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Impuesto Estatal (NY)</span>
                    <span className="text-red-600">-${calc.state_tax}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Social Security (6.2%)</span>
                    <span className="text-red-600">-${calc.social_security}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Medicare (1.45%)</span>
                    <span className="text-red-600">-${calc.medicare}</span>
                  </div>
                  {parseFloat(calc.other_deductions) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Otras Deducciones</span>
                      <span className="text-red-600">-${calc.other_deductions}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t-2 pt-2 mt-2">
                    <span className="font-bold text-lg">Total Deducciones</span>
                    <span className="font-bold text-lg text-red-600">-${calc.total_deductions}</span>
                  </div>
                </div>
              </div>

              {/* Pago Neto Final */}
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-400">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">PAGO NETO A RECIBIR</span>
                  <span className="text-3xl font-bold text-green-700">${calc.net_pay}</span>
                </div>
              </div>

              {/* Información adicional */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  <p className="font-semibold mb-1">Empleador: {companyName}</p>
                  {businessAddress && <p>{businessAddress}</p>}
                  <p className="mt-2 italic">Este recibo es solo informativo. Conserve para sus registros.</p>
                  <p className="text-right mt-2">Generado: {new Date().toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long', 
                    day: 'numeric'
                  })}</p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t-2 border-gray-300">
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="font-bold text-gray-900 mb-2">{companyName}</p>
              {businessAddress && <p className="text-gray-600">{businessAddress}</p>}
              {businessPhone && <p className="text-gray-600">Tel: {businessPhone}</p>}
              {businessEmail && <p className="text-gray-600">Email: {businessEmail}</p>}
            </div>
            <div className="text-right">
              <p className="text-gray-500">Generado por ClockWise Payroll System</p>
              <p className="text-gray-500">ID de Nómina: {payroll.id}</p>
              <p className="text-gray-500">Fecha de generación: {new Date().toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos para impresión */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          .page-break {
            page-break-after: always;
          }
          
          .print-container {
            padding: 15px;
            font-size: 11px;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-size: 11px;
          }
          
          h1 {
            font-size: 18px !important;
          }
          
          h2 {
            font-size: 16px !important;
          }
          
          h3 {
            font-size: 14px !important;
          }
          
          h4 {
            font-size: 12px !important;
          }
          
          .text-3xl {
            font-size: 20px !important;
          }
          
          .text-2xl {
            font-size: 16px !important;
          }
          
          .text-xl {
            font-size: 14px !important;
          }
          
          .text-lg {
            font-size: 12px !important;
          }
          
          .text-base {
            font-size: 11px !important;
          }
          
          .text-sm {
            font-size: 10px !important;
          }
          
          .text-xs {
            font-size: 9px !important;
          }
          
          .p-6 {
            padding: 12px !important;
          }
          
          .p-4 {
            padding: 10px !important;
          }
          
          .mb-8 {
            margin-bottom: 15px !important;
          }
          
          .mb-6 {
            margin-bottom: 12px !important;
          }
          
          .mb-4 {
            margin-bottom: 10px !important;
          }
          
          .gap-4 {
            gap: 8px !important;
          }
        }
      `}</style>
    </>
  );
};

export default PayrollPrintView;

