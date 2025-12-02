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
    <div className="w-64 bg-gray-900 text-white min-h-screen fixed left-0 top-0">
      <div className="p-6">
        <div className="flex items-center justify-center mb-2">
          <img 
            src="/logo.png" 
            alt="Smart Punch Logo" 
            className="h-10 w-auto"
          />
        </div>
        <p className="text-sm text-gray-400 mt-1 text-center">
          {userType === 'super_admin' ? t('super_admin') : t('business_portal')}
        </p>
      </div>

      <nav className="mt-6">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                isActive(link.path) ? 'bg-gray-800 text-white border-l-4 border-blue-500' : ''
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
