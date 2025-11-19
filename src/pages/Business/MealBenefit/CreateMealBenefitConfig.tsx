import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import { formatErrorMessage } from '../../../services/api';
import mealBenefitService from '../../../services/meal-benefit.service';
import { EmployeeType } from '../../../types';
import { Info, Save } from 'lucide-react';

const CreateMealBenefitConfig = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const employeeTypeLabels: Record<EmployeeType, string> = {
    hourly_tipped_waiter: 'Mesero (Con Tip Credit)',
    hourly_tipped_delivery: 'Delivery (Con Tip Credit)',
    hourly_fixed: 'Por Hora (Sin Tip Credit)',
    exempt_salary: 'Salario Exento',
  };

  const [formData, setFormData] = useState({
    config_name: '',
    employee_type: 'hourly_tipped_waiter' as EmployeeType,
    min_hours_threshold: '6.00',
    credit_amount: '15.00',
    effective_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: '',
  });

  useEffect(() => {
    if (isEdit && id) {
      loadConfig(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, id]);

  const loadConfig = async (configId: string) => {
    setLoadingData(true);
    try {
      const config = await mealBenefitService.getConfigById(configId);
      setFormData({
        config_name: config.config_name,
        employee_type: config.employee_type,
        min_hours_threshold: config.min_hours_threshold.toString(),
        credit_amount: config.credit_amount.toString(),
        effective_date: config.effective_date.split('T')[0],
        end_date: config.end_date ? config.end_date.split('T')[0] : '',
        notes: config.notes || '',
      });
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
      navigate('/business/meal-benefit');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const minHours = parseFloat(formData.min_hours_threshold);
    const creditAmount = parseFloat(formData.credit_amount);

    if (minHours < 0) {
      showToast('Las horas mínimas no pueden ser negativas', 'error');
      return;
    }

    if (creditAmount <= 0) {
      showToast('El monto del crédito debe ser mayor a cero', 'error');
      return;
    }

    if (formData.end_date && formData.end_date < formData.effective_date) {
      showToast('La fecha de fin no puede ser anterior a la fecha de inicio', 'error');
      return;
    }

    setLoading(true);

    try {
      const data: any = {
        config_name: formData.config_name,
        employee_type: formData.employee_type,
        min_hours_threshold: minHours,
        credit_amount: creditAmount,
        effective_date: formData.effective_date,
      };

      if (formData.end_date) data.end_date = formData.end_date;
      if (formData.notes) data.notes = formData.notes;

      if (isEdit && id) {
        await mealBenefitService.updateConfig(id, data);
        showToast('Configuración actualizada exitosamente', 'success');
      } else {
        await mealBenefitService.createConfig(data);
        showToast('Configuración creada exitosamente', 'success');
      }
      navigate('/business/meal-benefit');
    } catch (error: any) {
      showToast(formatErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner size="lg" text="Cargando configuración..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            {isEdit ? 'Editar Configuración' : 'Nueva Configuración de Beneficio de Comida'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {isEdit
              ? 'Modifique los valores de la configuración'
              : 'Configure las reglas de crédito automático de comida para un tipo de empleado'}
          </p>
        </div>

        <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-emerald-800">Información Importante</h3>
              <div className="mt-2 text-sm text-emerald-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>El crédito se aplica automáticamente si el empleado trabaja ≥ horas mínimas en el período</li>
                  <li>El crédito es <strong>imponible</strong> (se suma al gross_pay)</li>
                  <li>Se calcula por período completo, no diario</li>
                  <li>Los empleados deben tener <code className="bg-emerald-100 px-1 rounded">receives_meal_benefit = TRUE</code></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Configuración *
            </label>
            <input
              type="text"
              value={formData.config_name}
              onChange={(e) => setFormData({ ...formData, config_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Ej: Waiter - 6+ horas"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Un nombre descriptivo para identificar esta configuración</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Empleado *
            </label>
            <select
              value={formData.employee_type}
              onChange={(e) => setFormData({ ...formData, employee_type: e.target.value as EmployeeType })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
              disabled={isEdit}
            >
              {(Object.keys(employeeTypeLabels) as EmployeeType[]).map((type) => (
                <option key={type} value={type}>
                  {employeeTypeLabels[type]}
                </option>
              ))}
            </select>
            {isEdit && (
              <p className="text-xs text-gray-500 mt-1">El tipo de empleado no se puede modificar</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horas Mínimas Requeridas *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.min_hours_threshold}
                onChange={(e) => setFormData({ ...formData, min_hours_threshold: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Horas mínimas trabajadas en el período para aplicar el crédito</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto del Crédito ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.credit_amount}
                onChange={(e) => setFormData({ ...formData, credit_amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Monto del crédito de comida (imponible)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                value={formData.effective_date}
                onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Fin (Opcional)
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                min={formData.effective_date}
              />
              <p className="text-xs text-gray-500 mt-1">Dejar vacío si no tiene fecha de fin</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas (Opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Notas adicionales sobre esta configuración..."
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/business/meal-benefit')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  {isEdit ? 'Guardando...' : 'Creando...'}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isEdit ? 'Guardar Cambios' : 'Crear Configuración'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateMealBenefitConfig;

