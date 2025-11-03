import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './Common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: 'super_admin' | 'business';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredUserType }) => {
  const { isAuthenticated, userType, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredUserType && userType !== requiredUserType) {
    // Redirect to appropriate dashboard if wrong user type
    if (userType === 'super_admin') {
      return <Navigate to="/super-admin/dashboard" replace />;
    }
    return <Navigate to="/business/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
