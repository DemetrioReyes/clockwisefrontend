import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  AlertCircle,
  FileDown,
  PenTool,
  TrendingUp,
  Heart,
} from 'lucide-react';

interface SidebarProps {
  userType: 'super_admin' | 'business';
}

const Sidebar: React.FC<SidebarProps> = ({ userType }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const superAdminLinks = [
    { path: '/super-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/super-admin/businesses', label: 'Businesses', icon: Building2 },
    { path: '/super-admin/register-business', label: 'Register Business', icon: UserPlus },
  ];

  const businessLinks = [
    { path: '/business/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/business/employees', label: 'Empleados', icon: Users },
    { path: '/business/time-entry', label: 'Control de Tiempo', icon: Clock },
    { path: '/business/tips', label: 'Propinas e Incidentes', icon: Banknote },
    { path: '/business/deductions', label: 'Deducciones', icon: MinusCircle },
    { path: '/business/payroll', label: 'Nómina', icon: DollarSign },
    { path: '/business/pdf-generation', label: 'PDFs', icon: FileDown },
    { path: '/business/signatures', label: 'Firmas Digitales', icon: PenTool },
    { path: '/business/pay-rates', label: 'Tarifas de Pago', icon: TrendingUp },
    { path: '/business/sick-leave', label: 'Sick Leave', icon: Heart },
    { path: '/business/tip-credit', label: 'Tip Credit Config', icon: DollarSign },
    { path: '/business/reports', label: 'Reportes', icon: FileText },
  ];

  const links = userType === 'super_admin' ? superAdminLinks : businessLinks;

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-400">ClockWise</h1>
        <p className="text-sm text-gray-400 mt-1">
          {userType === 'super_admin' ? 'Super Admin' : 'Business Portal'}
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
