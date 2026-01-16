import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import noticesService, { PayNoticeSaveRequest } from '../../../services/notices.service';
import employeeService from '../../../services/employee.service';
import SignatureCanvas from 'react-signature-canvas';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';

const CreateNoticeForm: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [employee, setEmployee] = useState<any>(null);
  const sigPadRef = useRef<SignatureCanvas>(null);
  const [employeePrimaryLanguage, setEmployeePrimaryLanguage] = useState('');
  const [includeSignature, setIncludeSignature] = useState(false);
  const [formData, setFormData] = useState<PayNoticeSaveRequest>({
    employee_id: employeeId || '',
    // Sección 2: Notice given
    notice_given_at_hiring: false,
    notice_given_before_change: false,
    notice_type: 'initial',
    // Sección 3: Employee's pay rate(s)
    pay_rate_type: 'hourly',
    pay_rate_value: undefined,
    // Sección 4: Allowances taken
    allowance_none: true,
    allowance_tips: false,
    tip_credit_amount: undefined,
    allowance_meals: false,
    meal_benefit_amount: undefined,
    allowance_lodging: false,
    allowance_other: false,
    other_allowances_description: undefined,
    // Sección 5: Regular payday
    regular_payday: undefined,
    // Sección 6: Pay is
    pay_frequency: 'weekly',
    pay_frequency_other: undefined,
    // Sección 7: Overtime Pay Rate
    overtime_rate: 1.5,
    overtime_exempt: false,
    overtime_exemption_description: undefined,
    // Idioma
    language: 'en',
  });

  useEffect(() => {
    if (employeeId) {
      loadEmployee();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const loadEmployee = async () => {
    if (!employeeId) return;
    
    try {
      const employeeData = await employeeService.getEmployeeById(employeeId);
      setEmployee(employeeData);
      
      // Pre-llenar algunos campos con datos del empleado
      const hasTipCredit = employeeData.has_tip_credit || false;
      const receivesMealBenefit = employeeData.receives_meal_benefit || false;
      
      setFormData(prev => ({
        ...prev,
        employee_id: employeeId,
        pay_rate_type: employeeData.employee_type?.includes('salary') ? 'salary' : 'hourly',
        pay_rate_value: employeeData.hourly_rate || employeeData.annual_salary,
        pay_frequency: employeeData.pay_frequency || 'weekly',
        regular_payday: employeeData.regular_shift || '',
        overtime_rate: 1.5, // Valor por defecto según NYS Labor Law
        allowance_none: !hasTipCredit && !receivesMealBenefit,
        allowance_tips: hasTipCredit,
        tip_credit_amount: hasTipCredit ? employeeData.tip_credit_amount : undefined,
        allowance_meals: receivesMealBenefit,
        meal_benefit_amount: receivesMealBenefit ? undefined : undefined, // Se calculará en el backend si es necesario
      }));
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    }
  };

  const handleCheckboxChange = (field: keyof PayNoticeSaveRequest, value: boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Lógica para checkboxes mutuamente excluyentes
    if (field === 'notice_given_at_hiring' && value) {
      setFormData(prev => ({ ...prev, notice_given_before_change: false, notice_type: 'initial' }));
    }
    if (field === 'notice_given_before_change' && value) {
      setFormData(prev => {
        // Determinar tipo según otros campos - usar el valor actual del formData
        let noticeType: 'rate_change' | 'payday_change' = 'payday_change';
        // Por defecto es payday_change, pero esto se puede ajustar según la lógica de negocio
        
        return {
          ...prev,
          notice_given_at_hiring: false,
          notice_type: noticeType
        };
      });
    }
    
    // Allowances: si se marca "None", desmarcar otros
    if (field === 'allowance_none' && value) {
      setFormData(prev => ({
        ...prev,
        allowance_tips: false,
        allowance_meals: false,
        allowance_lodging: false,
        allowance_other: false,
        tip_credit_amount: undefined,
        meal_benefit_amount: undefined,
        other_allowances_description: undefined,
      }));
    }
    // Si se marca cualquier otro allowance, desmarcar "None"
    if ((field === 'allowance_tips' || field === 'allowance_meals' || 
         field === 'allowance_lodging' || field === 'allowance_other') && value) {
      setFormData(prev => ({ ...prev, allowance_none: false }));
    }
  };

  const handleInputChange = (field: keyof PayNoticeSaveRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.pay_rate_value) {
      showToast('Debe especificar el valor de la tasa de pago', 'error');
      return false;
    }
    
    if (formData.allowance_tips && !formData.tip_credit_amount) {
      showToast('Si marca "Tips per hour", debe especificar el monto', 'error');
      return false;
    }
    
    if (formData.allowance_meals && !formData.meal_benefit_amount) {
      showToast('Si marca "Meals per meal", debe especificar el monto', 'error');
      return false;
    }
    
    if (formData.allowance_other && !formData.other_allowances_description) {
      showToast('Si marca "Other", debe especificar la descripción', 'error');
      return false;
    }
    
    if (formData.pay_frequency === 'other' && !formData.pay_frequency_other) {
      showToast('Si selecciona "Other" en frecuencia de pago, debe especificar', 'error');
      return false;
    }
    
    if (!formData.notice_given_at_hiring && !formData.notice_given_before_change) {
      showToast('Debe marcar al menos una opción en "Notice given"', 'error');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Validar firma si está marcada
    if (includeSignature && sigPadRef.current?.isEmpty()) {
      showToast('Por favor dibuje la firma del empleado', 'error');
      return;
    }
    
    setLoading(true);
    try {
      // Guardar el notice
      const savedNotice = await noticesService.saveNotice(formData);
      
      // Generar el PDF
      await noticesService.generatePdfForNotice(savedNotice.id);
      
      // Si hay firma, firmar el documento
      if (includeSignature && sigPadRef.current && !sigPadRef.current.isEmpty()) {
        const signatureData = sigPadRef.current.toDataURL();
        await noticesService.signNotice(savedNotice.id, {
          signature_data: signatureData,
          employee_primary_language: employeePrimaryLanguage || undefined,
          signature_metadata: {
            device: navigator.userAgent,
            ip_address: 'Unknown',
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          },
        });
        showToast('Notice guardado, PDF generado y firmado exitosamente', 'success');
      } else {
        showToast('Notice guardado y PDF generado exitosamente', 'success');
      }
      
      navigate(`/business/notices/employee/${employeeId}`);
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSignature = () => {
    sigPadRef.current?.clear();
  };

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
              <h1 className="text-3xl font-bold text-gray-900">Crear Notice (LS 59)</h1>
              {employee && (
                <p className="mt-1 text-sm text-gray-500">
                  {employee.first_name} {employee.last_name} ({employee.employee_code})
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-8">
          {/* Sección 2: Notice given */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">2. Notice given:</h2>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notice_given_at_hiring}
                  onChange={(e) => handleCheckboxChange('notice_given_at_hiring', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">At hiring</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notice_given_before_change}
                  onChange={(e) => handleCheckboxChange('notice_given_before_change', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">Before a change in pay rate(s), allowances claimed, or payday</span>
              </label>
            </div>
          </div>

          {/* Sección 3: Employee's pay rate(s) */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">3. Employee's pay rate(s):</h2>
            <p className="text-sm text-gray-600">State if pay is based on an hourly, salary, day rate, piece rate, or other basis.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type:</label>
                <select
                  value={formData.pay_rate_type}
                  onChange={(e) => handleInputChange('pay_rate_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="hourly">Hourly</option>
                  <option value="salary">Salary</option>
                  <option value="day_rate">Day Rate</option>
                  <option value="piece_rate">Piece Rate</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Value:</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pay_rate_value || ''}
                  onChange={(e) => handleInputChange('pay_rate_value', parseFloat(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          {/* Sección 4: Allowances taken */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">4. Allowances taken:</h2>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allowance_none}
                  onChange={(e) => handleCheckboxChange('allowance_none', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">None</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={formData.allowance_tips}
                    onChange={(e) => handleCheckboxChange('allowance_tips', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Tips per hour:</span>
                </label>
                {formData.allowance_tips && (
                  <input
                    type="number"
                    step="0.01"
                    value={formData.tip_credit_amount || ''}
                    onChange={(e) => handleInputChange('tip_credit_amount', parseFloat(e.target.value) || undefined)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={formData.allowance_meals}
                    onChange={(e) => handleCheckboxChange('allowance_meals', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Meals per meal:</span>
                </label>
                {formData.allowance_meals && (
                  <input
                    type="number"
                    step="0.01"
                    value={formData.meal_benefit_amount || ''}
                    onChange={(e) => handleInputChange('meal_benefit_amount', parseFloat(e.target.value) || undefined)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allowance_lodging}
                  onChange={(e) => handleCheckboxChange('allowance_lodging', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">Lodging</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowance_other}
                    onChange={(e) => handleCheckboxChange('allowance_other', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Other</span>
                </label>
                {formData.allowance_other && (
                  <input
                    type="text"
                    value={formData.other_allowances_description || ''}
                    onChange={(e) => handleInputChange('other_allowances_description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Especificar otros allowances"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Sección 5: Regular payday */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">5. Regular payday:</h2>
            <input
              type="text"
              value={formData.regular_payday || ''}
              onChange={(e) => handleInputChange('regular_payday', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Every Friday, 15th and last day"
            />
          </div>

          {/* Sección 6: Pay is */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">6. Pay is:</h2>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pay_frequency"
                  value="weekly"
                  checked={formData.pay_frequency === 'weekly'}
                  onChange={(e) => handleInputChange('pay_frequency', e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700">Weekly</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pay_frequency"
                  value="biweekly"
                  checked={formData.pay_frequency === 'biweekly'}
                  onChange={(e) => handleInputChange('pay_frequency', e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700">Bi-weekly</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pay_frequency"
                  value="monthly"
                  checked={formData.pay_frequency === 'monthly'}
                  onChange={(e) => handleInputChange('pay_frequency', e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700">Monthly</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pay_frequency"
                    value="other"
                    checked={formData.pay_frequency === 'other'}
                    onChange={(e) => handleInputChange('pay_frequency', e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Other:</span>
                </label>
                {formData.pay_frequency === 'other' && (
                  <input
                    type="text"
                    value={formData.pay_frequency_other || ''}
                    onChange={(e) => handleInputChange('pay_frequency_other', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Especificar frecuencia"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Sección 7: Overtime Pay Rate */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">7. Overtime Pay Rate:</h2>
            <p className="text-sm text-gray-600">
              Most workers in NYS must receive at least 1½ times their regular rate of pay for all hours worked over 40 in a workweek, with few exceptions.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rate:</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.overtime_rate}
                  onChange={(e) => handleInputChange('overtime_rate', parseFloat(e.target.value) || 1.5)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-sm text-gray-500 ml-2">x regular rate</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.overtime_exempt}
                  onChange={(e) => handleCheckboxChange('overtime_exempt', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">This employee is exempt from overtime</span>
              </label>
              {formData.overtime_exempt && (
                <input
                  type="text"
                  value={formData.overtime_exemption_description || ''}
                  onChange={(e) => handleInputChange('overtime_exemption_description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Especificar exención"
                />
              )}
            </div>
          </div>

          {/* Idioma */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Idioma del documento:</h2>
            <select
              value={formData.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
              className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>

          {/* Sección 8: Employee Acknowledgement - Firma */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">8. Employee Acknowledgement:</h2>
            <p className="text-sm text-gray-600">
              On this day, I received notice of my pay rate, overtime rate (if eligible), allowances, and designated payday. I told my employer what my primary language is.
            </p>
            
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSignature}
                  onChange={(e) => setIncludeSignature(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700 font-medium">Incluir firma del empleado ahora</span>
              </label>
              
              {includeSignature && (
                <div className="space-y-3 p-4 border border-gray-300 rounded-lg bg-gray-50">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Idioma primario del empleado (opcional):
                    </label>
                    <input
                      type="text"
                      value={employeePrimaryLanguage}
                      onChange={(e) => setEmployeePrimaryLanguage(e.target.value)}
                      className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Spanish, English, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Firma del empleado:
                    </label>
                    <div className="border-2 border-gray-300 rounded-lg bg-white inline-block">
                      <SignatureCanvas
                        ref={sigPadRef}
                        canvasProps={{
                          width: 400,
                          height: 120,
                          className: 'signature-canvas',
                        }}
                        backgroundColor="white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleClearSignature}
                      className="mt-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Limpiar firma
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar y Generar PDF
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateNoticeForm;
