import React, { useState } from 'react';
import { formatErrorMessage } from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout/Layout';
import LoadingSpinner from '../../../components/Common/LoadingSpinner';
import { useToast } from '../../../components/Common/Toast';
import employeeService from '../../../services/employee.service';
import { EmployeeRegisterData, EmployeeType, PayFrequency, PaymentMethod } from '../../../types';
import { Camera } from 'lucide-react';

const RegisterEmployee: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoPreview2, setPhotoPreview2] = useState<string | null>(null);
  const [formData, setFormData] = useState<EmployeeRegisterData>({
    first_name: '',
    last_name: '',
    alias: '',
    ssn: '',
    date_of_birth: '',
    email: '',
    phone: '',
    hire_date: new Date().toISOString().split('T')[0],
    street_address: '',
    city: '',
    state: 'NY',
    zip_code: '',
    employee_type: 'hourly_fixed' as EmployeeType,
    position: '',
    hourly_rate: 16.50,
    pay_frequency: 'weekly' as PayFrequency,
    regular_shift: '',
    department: '',
    payment_method: 'transfer' as PaymentMethod,
    bank_account_number: '',
    bank_routing_number: '',
    bank_account_type: 'checking',
    state_minimum_wage: 16.50,
    receives_meal_benefit: false,
  });

  // Formatear teléfono automáticamente a XXX-XXX-XXXX
  const formatPhoneNumber = (value: string): string => {
    // Remover todo excepto dígitos
    const digits = value.replace(/\D/g, '');
    
    // Formatear a XXX-XXX-XXXX
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  // Comprimir imagen para reducir el tamaño del archivo
  const compressImage = (file: File, maxSizeMB: number = 1): Promise<File> => {
    return new Promise((resolve, reject) => {
      // Si el archivo ya es pequeño, no comprimir
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size <= maxSizeBytes) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Reducir dimensiones si son muy grandes (max 1200px en el lado más largo)
          const maxDimension = 1200;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height * maxDimension) / width;
              width = maxDimension;
            } else {
              width = (width * maxDimension) / height;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto del canvas'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a blob con calidad ajustable
          let quality = 0.8;
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Error al comprimir la imagen'));
                return;
              }

              // Si aún es muy grande después de comprimir, reducir calidad
              if (blob.size > maxSizeBytes) {
                quality = 0.6;
                canvas.toBlob(
                  (blob2) => {
                    if (!blob2) {
                      reject(new Error('Error al comprimir la imagen'));
                      return;
                    }
                    const compressedFile = new File([blob2], file.name, {
                      type: 'image/jpeg',
                      lastModified: Date.now(),
                    });
                    resolve(compressedFile);
                  },
                  'image/jpeg',
                  quality
                );
              } else {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('Error al cargar la imagen'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value} = e.target;
    
    // Formatear teléfono automáticamente
    if (name === 'phone') {
      const formatted = formatPhoneNumber(value);
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>, photoNumber: 1 | 2) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      showToast('Por favor selecciona un archivo de imagen válido', 'error');
      return;
    }

    // Validar tamaño (máximo 10MB antes de comprimir)
    const maxSizeBeforeCompress = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeBeforeCompress) {
      showToast('La imagen es demasiado grande. Por favor selecciona una imagen más pequeña (máximo 10MB)', 'error');
      return;
    }

    try {
      // Comprimir imagen (máximo 1MB después de comprimir)
      const compressedFile = await compressImage(file, 1);

      if (photoNumber === 1) {
        setFormData(prev => ({ ...prev, face_image: compressedFile }));
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } else {
        setFormData(prev => ({ ...prev, face_image_2: compressedFile }));
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview2(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);
      }

      // Mostrar mensaje si se comprimió
      if (file.size !== compressedFile.size) {
        const reduction = ((file.size - compressedFile.size) / file.size * 100).toFixed(0);
        showToast(`Imagen comprimida (reducción del ${reduction}%)`, 'success');
      }
    } catch (error: any) {
      showToast(`Error al procesar la imagen: ${error.message}`, 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que ambas fotos estén presentes
    if (!formData.face_image) {
      showToast('La primera foto es requerida para el reconocimiento facial', 'error');
      return;
    }
    
    if (!formData.face_image_2) {
      showToast('La segunda foto es requerida para mejorar el reconocimiento facial', 'error');
      return;
    }

    // Validar tamaño total de las imágenes
    const totalSize = (formData.face_image?.size || 0) + (formData.face_image_2?.size || 0);
    const maxTotalSize = 2 * 1024 * 1024; // 2MB total
    if (totalSize > maxTotalSize) {
      showToast('El tamaño total de las imágenes es muy grande. Por favor, inténtalo de nuevo con imágenes más pequeñas.', 'error');
      return;
    }

    setLoading(true);

    try {
      // Asegurarse de que el teléfono tenga el formato correcto antes de enviar
      const dataToSend = {
        ...formData,
        phone: formatPhoneNumber(formData.phone),
      };
      
      await employeeService.registerEmployee(dataToSend);
      showToast('Empleado registrado exitosamente', 'success');
      navigate('/business/employees');
    } catch (error: any) {
      // Mensaje específico para error 502
      if (error.response?.status === 502 || error.code === 'ERR_NETWORK') {
        showToast('Error 502: El servidor no está disponible. Por favor, verifica tu conexión e intenta nuevamente. Si el problema persiste, contacta al administrador.', 'error');
      } else {
        showToast(formatErrorMessage(error), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner size="lg" text="Registrando empleado..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Registrar Nuevo Empleado</h1>
          <p className="text-gray-600 mt-2">Complete la información del empleado</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-8 space-y-6">
          {/* Información Personal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Información Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Apellido *</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alias (Apodo)</label>
                <input
                  type="text"
                  name="alias"
                  value={formData.alias}
                  onChange={handleChange}
                  placeholder="Mari, Juanito, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Nombre informal o apodo del empleado</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SSN *</label>
                <input
                  type="text"
                  name="ssn"
                  value={formData.ssn}
                  onChange={handleChange}
                  placeholder="XXX-XX-XXXX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento *</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="305-909-9507"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">✨ Formato automático: XXX-XXX-XXXX (escriba solo números)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Dirección</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Calle *</label>
                <input
                  type="text"
                  name="street_address"
                  value={formData.street_address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado *</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  maxLength={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Código Postal *</label>
                <input
                  type="text"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
          </div>

          {/* Información de Empleo */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Información de Empleo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Empleado *</label>
                <select
                  name="employee_type"
                  value={formData.employee_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="hourly_tipped_waiter">Mesero (Con Tip Credit)</option>
                  <option value="hourly_tipped_delivery">Delivery (Con Tip Credit)</option>
                  <option value="hourly_fixed">Por Hora (Sin Tip Credit)</option>
                  <option value="exempt_salary">Salario Exento</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Posición *</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tarifa por Hora *</label>
                <input
                  type="number"
                  name="hourly_rate"
                  value={formData.hourly_rate}
                  onChange={handleChange}
                  step="0.01"
                  min="15"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frecuencia de Pago *</label>
                <select
                  name="pay_frequency"
                  value={formData.pay_frequency}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">Quincenal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Contratación *</label>
                <input
                  type="date"
                  name="hire_date"
                  value={formData.hire_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago *</label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="check">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Turno Regular</label>
                <input
                  type="text"
                  name="regular_shift"
                  value={formData.regular_shift}
                  onChange={handleChange}
                  placeholder="10:00-18:00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Ejemplo: 10:00-18:00</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Departamento</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Service, Kitchen, Management..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Información Bancaria - Solo si payment_method es transfer */}
          {formData.payment_method === 'transfer' && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded">
              <h3 className="text-lg font-semibold mb-4 text-blue-900">Información Bancaria (Transferencia)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Número de Cuenta *</label>
                  <input
                    type="text"
                    name="bank_account_number"
                    value={formData.bank_account_number}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Routing Number *</label>
                  <input
                    type="text"
                    name="bank_routing_number"
                    value={formData.bank_routing_number}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Cuenta</label>
                  <select
                    name="bank_account_type"
                    value={formData.bank_account_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="checking">Checking (Corriente)</option>
                    <option value="savings">Savings (Ahorros)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Configuración de Tip Credit */}
          {(formData.employee_type === 'hourly_tipped_waiter' || formData.employee_type === 'hourly_tipped_delivery') && (
            <div className="bg-purple-50 border-l-4 border-purple-400 p-6 rounded">
              <h3 className="text-lg font-semibold mb-4 text-purple-900">Configuración de Tip Credit (NY State 2025)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salario Mínimo del Estado</label>
                  <input
                    type="number"
                    name="state_minimum_wage"
                    value={formData.state_minimum_wage}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Por defecto: $16.50/hr (NY 2025)</p>
                </div>
                <div className="bg-purple-100 p-4 rounded">
                  <p className="text-sm text-purple-800 font-semibold">Tip Credit Automático:</p>
                  <p className="text-xs text-purple-600 mt-1">• Cash Wage: $11.00/hr</p>
                  <p className="text-xs text-purple-600">• Tip Credit: $5.50/hr</p>
                  <p className="text-xs text-purple-600 mt-2 italic">El sistema calcula automáticamente el tip credit shortfall</p>
                </div>
              </div>
            </div>
          )}

          {/* Beneficio de Comida */}
          <div className="bg-emerald-50 border-l-4 border-emerald-400 p-6 rounded">
            <h3 className="text-lg font-semibold mb-4 text-emerald-900">Beneficio de Comida (Crédito Automático)</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="receives_meal_benefit"
                  name="receives_meal_benefit"
                  checked={formData.receives_meal_benefit || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, receives_meal_benefit: e.target.checked }))}
                  className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="receives_meal_benefit" className="ml-3 text-sm font-medium text-gray-700">
                  Este empleado recibe crédito de comida automático
                </label>
              </div>
              <div className="bg-emerald-100 p-4 rounded">
                <p className="text-sm text-emerald-800 font-semibold mb-2">Cómo funciona:</p>
                <ul className="text-xs text-emerald-700 space-y-1 list-disc list-inside">
                  <li>El crédito se calcula automáticamente en cada período de nómina</li>
                  <li>Se aplica si el empleado trabaja las horas mínimas configuradas para su tipo</li>
                  <li>El crédito es <strong>imponible</strong> (se suma al gross_pay)</li>
                  <li>La configuración se gestiona en "Configuración de Beneficio de Comida"</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Fotos para Reconocimiento Facial */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Fotos para Reconocimiento Facial</h3>
            <p className="text-sm text-gray-600 mb-4">
              Se requieren <strong>2 fotos desde diferentes ángulos</strong> para mejorar la precisión del reconocimiento facial. 
              Tome una foto de frente y otra desde un ángulo lateral.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primera Foto */}
              <div className="border rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto 1 - Vista Frontal * <span className="text-red-500">Requerida</span>
                </label>
                <div className="flex flex-col items-center space-y-4">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview Foto 1" className="w-32 h-32 rounded-full object-cover border-2 border-blue-500" />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                      <Camera className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="w-full">
                    <label className="cursor-pointer inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                      <Camera className="w-5 h-5 mr-2" />
                      Subir Foto Frontal
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoChange(e, 1)}
                        className="hidden"
                        required
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Vista frontal del rostro
                    </p>
                  </div>
                </div>
              </div>

              {/* Segunda Foto */}
              <div className="border rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto 2 - Vista Lateral * <span className="text-red-500">Requerida</span>
                </label>
                <div className="flex flex-col items-center space-y-4">
                  {photoPreview2 ? (
                    <img src={photoPreview2} alt="Preview Foto 2" className="w-32 h-32 rounded-full object-cover border-2 border-blue-500" />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                      <Camera className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="w-full">
                    <label className="cursor-pointer inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                      <Camera className="w-5 h-5 mr-2" />
                      Subir Foto Lateral
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoChange(e, 2)}
                        className="hidden"
                        required
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Vista lateral o desde otro ángulo
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <p className="text-sm text-blue-800">
                <strong>💡 Consejo:</strong> Para mejores resultados, asegúrese de que ambas fotos tengan buena iluminación 
                y muestren claramente el rostro del empleado desde ángulos diferentes.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/business/employees')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Registrar Empleado'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default RegisterEmployee;
