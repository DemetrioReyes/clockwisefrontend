import React, { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { userType } = useAuth();

  if (!userType) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userType={userType} />
      <div className="ml-64">
        <Header />
        <main className="pt-20 px-6 pb-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
