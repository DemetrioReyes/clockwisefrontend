import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Building2, Clock } from 'lucide-react';

const LoginSelection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Clock className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">ClockWise</h1>
          <p className="text-xl text-blue-100">Complete Payroll Management System</p>
          <p className="text-sm text-blue-200 mt-2">
            With FLSA Compliance, Tip Credit Auto-Determination & California Break Law Support
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Super Admin Login Card */}
          <div
            onClick={() => navigate('/super-admin/login')}
            className="bg-white rounded-lg shadow-xl p-8 hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 p-4 rounded-full mb-4">
                <Shield className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Super Admin</h2>
              <p className="text-gray-600 mb-6">
                System administrators can manage businesses, view all data, and configure system
                settings
              </p>
              <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Login as Super Admin
              </button>
            </div>
          </div>

          {/* Business Login Card */}
          <div
            onClick={() => navigate('/business/login')}
            className="bg-white rounded-lg shadow-xl p-8 hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-100 p-4 rounded-full mb-4">
                <Building2 className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Portal</h2>
              <p className="text-gray-600 mb-6">
                Business owners can manage employees, track time, calculate payroll, and generate
                reports
              </p>
              <button className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium">
                Login as Business
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-white text-sm">
            Developed for compliance with FLSA regulations and state-specific labor laws
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginSelection;
