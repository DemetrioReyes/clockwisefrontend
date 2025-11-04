import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Building2, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const PublicHeader: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Solo mostrar en rutas públicas
  const isPublicRoute = location.pathname === '/' || 
                        location.pathname === '/super-admin/login' || 
                        location.pathname === '/business/login';
  
  if (!isPublicRoute) {
    return null;
  }

  // Verificar si el usuario puede ver el botón de Super Admin
  const canShowSuperAdmin = () => {
    if (!user) return true; // No autenticado, puede ver
    const u = user as any;
    return u.is_super_admin === true; // Solo si es super admin
  };

  return (
    <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <Clock className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">ClockWise</span>
          </div>

          {/* Navigation Buttons */}
          <nav className="flex items-center space-x-4">
            {canShowSuperAdmin() && (
              <button
                onClick={() => navigate('/super-admin/login')}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span>Super Admin</span>
              </button>
            )}
            
            <button
              onClick={() => navigate('/business/login')}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-md"
            >
              <Building2 className="w-4 h-4" />
              <span>Portal de Negocio</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;

