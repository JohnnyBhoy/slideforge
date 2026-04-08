import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from './Loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) return <Loader fullPage />;
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
