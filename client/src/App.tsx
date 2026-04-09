import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GeneratorProvider } from './context/GeneratorContext';
import ProtectedRoute from './components/common/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import OAuthSuccess from './pages/OAuthSuccess';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import UserDetail from './pages/admin/UserDetail';
import AllGenerations from './pages/admin/AllGenerations';
import PendingPayments from './pages/admin/PendingPayments';
import LSSuccess from './pages/StripeSuccess';
import { Analytics } from '@vercel/analytics/react';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Analytics />
      <GeneratorProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />
          <Route
            path="/ls-success"
            element={
              <ProtectedRoute role="teacher">
                <LSSuccess />
              </ProtectedRoute>
            }
          />

          {/* Teacher */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="teacher">
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute role="teacher">
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute role="admin">
                <ManageUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users/:id"
            element={
              <ProtectedRoute role="admin">
                <UserDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/generations"
            element={
              <ProtectedRoute role="admin">
                <AllGenerations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute role="admin">
                <PendingPayments />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </GeneratorProvider>
    </AuthProvider>
  );
};

export default App;
