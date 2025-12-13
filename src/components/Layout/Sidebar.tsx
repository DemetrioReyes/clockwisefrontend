import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  DollarSign,
  FileText,
  UserPlus,
  Banknote,
  MinusCircle,
  FileDown,
  TrendingUp,
  Heart,
  UtensilsCrossed,
} from 'lucide-react';

interface SidebarProps {
  userType: 'super_admin' | 'business';
}

const Sidebar: React.FC<SidebarProps> = ({ userType }) => {
  const location = useLocation();
  const { t } = useLanguage();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const superAdminLinks = [
    { path: '/super-admin/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { path: '/super-admin/businesses', label: t('businesses'), icon: Building2 },
    { path: '/super-admin/register-business', label: t('register_business'), icon: UserPlus },
    { path: '/super-admin/tip-credit', label: 'Tip Credit Config', icon: DollarSign },
  ];

  const businessLinks = [
    { path: '/business/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { path: '/business/employees', label: t('employees'), icon: Users },
    { path: '/business/time-entry', label: t('time_tracking'), icon: Clock },
    { path: '/business/tips', label: t('tips_incidents'), icon: Banknote },
    { path: '/business/deductions', label: t('deductions'), icon: MinusCircle },
    { path: '/business/payroll', label: t('payroll'), icon: DollarSign },
    { path: '/business/pdf-generation', label: t('pdfs'), icon: FileDown },
    { path: '/business/pay-rates', label: t('pay_rates'), icon: TrendingUp },
    { path: '/business/sick-leave', label: t('sick_leave'), icon: Heart },
    { path: '/business/tip-credit', label: t('tip_credit_config'), icon: DollarSign },
    { path: '/business/meal-benefit', label: t('meal_benefit_menu'), icon: UtensilsCrossed },
    { path: '/business/reports', label: t('reports'), icon: FileText },
  ];

  const links = userType === 'super_admin' ? superAdminLinks : businessLinks;

  return (
    <div className="w-64 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-white min-h-screen fixed left-0 top-0 shadow-2xl border-r border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-center mb-3">
          <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg">
            <img 
              src="/logo.png" 
              alt="Smart Punch Logo" 
              className="h-8 w-auto"
            />
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            {userType === 'super_admin' ? 'Super Admin' : 'Business Portal'}
          </p>
          <div className="mt-2 h-1 w-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mx-auto"></div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-4 px-3">
        {links.map((link, index) => {
          const Icon = link.icon;
          const active = isActive(link.path);
          
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`group relative flex items-center px-4 py-3 mb-1 rounded-lg transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/50'
                  : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              {/* Active indicator */}
              {active && (
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
              )}
              
              {/* Icon */}
              <div className={`relative z-10 ${
                active 
                  ? 'text-white' 
                  : 'text-gray-400 group-hover:text-white'
              }`}>
                <Icon className={`w-5 h-5 transition-transform duration-200 ${
                  active ? 'scale-110' : 'group-hover:scale-110'
                }`} />
              </div>
              
              {/* Label */}
              <span className={`ml-3 text-sm font-medium transition-all duration-200 ${
                active ? 'text-white font-semibold' : 'text-gray-300 group-hover:text-white'
              }`}>
                {link.label}
              </span>
              
              {/* Hover effect */}
              {!active && (
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-600/0 to-blue-600/0 group-hover:from-purple-600/10 group-hover:to-blue-600/10 transition-all duration-200"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer decoration */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Sistema Activo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
