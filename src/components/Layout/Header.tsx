import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User as UserIcon, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const Header: React.FC = () => {
  const { user, logout, userType } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Solo mostrar header en rutas protegidas (dentro del layout)
  const isPublicRoute = location.pathname === '/' || 
                        location.pathname === '/super-admin/login' || 
                        location.pathname === '/business/login';

  if (isPublicRoute) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getUserName = () => {
    if (!user) return 'User';
    
    const u = user as any;
    
    // Para business, usar company_name
    if (userType === 'business' && u.company_name) {
      return u.company_name;
    }
    
    // Para super_admin, usar first_name + last_name
    if (userType === 'super_admin' && u.first_name && u.last_name) {
      return `${u.first_name} ${u.last_name}`;
    }
    
    // Fallback
    return u.email || 'User';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 right-0 left-64 z-10">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-800">
            {t('welcome_back')}, {getUserName()}!
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          {/* Language Selector */}
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-gray-600" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              <option value="es">🇪🇸 Español</option>
              <option value="en">🇺🇸 English</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 text-gray-700">
            <UserIcon className="w-5 h-5" />
            <span className="text-sm font-medium">{getUserName()}</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
