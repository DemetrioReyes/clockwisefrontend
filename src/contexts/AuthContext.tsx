import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import authService from '../services/auth.service';
import { User, Business, LoginCredentials } from '../types';

interface AuthContextType {
  user: User | Business | null;
  userType: 'super_admin' | 'business' | null;
  loading: boolean;
  login: (credentials: LoginCredentials, type: 'super_admin' | 'business') => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | Business | null>(null);
  const [userType, setUserType] = useState<'super_admin' | 'business' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken();
      const type = authService.getUserType() as 'super_admin' | 'business' | null;

      if (token && type) {
        try {
          if (type === 'super_admin') {
            const userData = await authService.getSuperAdminProfile();
            setUser(userData);
            setUserType('super_admin');
          } else if (type === 'business') {
            const businessData = await authService.getBusinessProfile();
            setUser(businessData);
            setUserType('business');
          }
        } catch (error) {
          console.error('Failed to load user profile:', error);
          authService.logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials, type: 'super_admin' | 'business') => {
    try {
      let response;
      if (type === 'super_admin') {
        response = await authService.superAdminLogin(credentials);
        authService.setToken(response.access_token, 'super_admin');
        const userData = await authService.getSuperAdminProfile();
        setUser(userData);
        setUserType('super_admin');
      } else {
        response = await authService.businessLogin(credentials);
        authService.setToken(response.access_token, 'business');
        const businessData = await authService.getBusinessProfile();
        setUser(businessData);
        setUserType('business');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setUserType(null);
  };

  const value: AuthContextType = {
    user,
    userType,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
