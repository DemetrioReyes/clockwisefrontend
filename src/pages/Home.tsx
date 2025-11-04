import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, TrendingUp, FileText, Users, DollarSign } from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <img src="/logo.png" alt="Clock" className="w-8 h-8" />,
      title: 'Control de Tiempo',
      description: 'Registro automático con reconocimiento facial y cumplimiento de leyes laborales',
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: 'Cálculo de Nómina',
      description: 'Cálculo automático con FLSA, Tip Credit y leyes estatales de los Estados Unidos',
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: 'Reportes y Compliance',
      description: 'Generación de reportes y cumplimiento con regulaciones federales y estatales',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Gestión de Empleados',
      description: 'Administración completa de empleados, tasas de pago y deducciones',
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Análisis de Datos',
      description: 'Visualización de tendencias y métricas de rendimiento laboral',
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: 'Firmas Digitales',
      description: 'Sistema de firmas digitales para documentos y aprobaciones',
    },
  ];

  return (
    <div className="min-h-screen bg-white pt-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="bg-white/6 backdrop-blur-sm p-1 rounded-xl">
                <img 
                  src="/logo.png" 
                  alt="ClockWise Logo" 
                  className="h-60 w-auto object-contain"
                />
              </div>
            </div>
            <p className="text-xl md:text-2xl text-blue-100 mb-4">
              Sistema Completo de Gestión de Nómina
            </p>
            <p className="text-lg text-blue-200 max-w-3xl mx-auto">
              Con cumplimiento FLSA, determinación automática de Tip Credit y soporte para leyes estatales de los Estados Unidos
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Características Principales
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Una solución integral para la gestión de nómina y cumplimiento laboral
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
            >
              <div className="text-blue-600 mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Cumplimiento Regulatorio
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Diseñado para cumplir con las regulaciones federales y estatales más estrictas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">FLSA Compliance</h3>
              <p className="text-gray-600">
                Cumplimiento completo con la Ley de Estándares Laborales Justos (FLSA)
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tip Credit Auto-Determination</h3>
              <p className="text-gray-600">
                Determinación automática de crédito por propinas según regulaciones federales
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Leyes Estatales de Descansos</h3>
              <p className="text-gray-600">
                Soporte completo para leyes de descansos estatales de los Estados Unidos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            ¿Listo para comenzar?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Accede al portal de tu negocio o administra el sistema como super administrador
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/business/login')}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
            >
              Portal de Negocio
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/logo.png" 
              alt="ClockWise Logo" 
              className="h-10 w-auto mr-2"
            />
            <span className="text-xl font-bold text-white">ClockWise</span>
          </div>
          <p className="text-sm">
            Sistema de Gestión de Nómina y Cumplimiento Laboral
          </p>
          <p className="text-xs mt-4">
            Desarrollado para cumplir con regulaciones FLSA y leyes laborales específicas por estado
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;

