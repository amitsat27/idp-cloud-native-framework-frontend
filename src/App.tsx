import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import IntentChat from './components/IntentChat';
import ClusterStatus from './pages/ClusterStatus';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Setup from './pages/Setup';
import AdminDashboard from './pages/AdminDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';

type Role = 'VIEWER' | 'OPERATOR' | 'ADMIN';

const hasAccess = (userRole: string | undefined, requiredRoles: Role[]): boolean => {
  if (!userRole) return false;
  return requiredRoles.includes(userRole as Role);
};

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: Role[] }> = ({
  children,
  allowedRoles = ['VIEWER', 'OPERATOR', 'ADMIN'],
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAccess(user?.role, allowedRoles)) {
    // Redirect to appropriate page based on role
    if (user?.role === 'VIEWER') {
      return <Navigate to="/status" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/setup" element={<Setup />} />
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />} />

      {/* Protected routes */}
      {/* Dashboard - OPERATOR, ADMIN only */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['OPERATOR', 'ADMIN']}>
            <Layout>
              <IntentChat />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Status - VIEWER, OPERATOR, ADMIN */}
      <Route
        path="/status"
        element={
          <ProtectedRoute allowedRoles={['VIEWER', 'OPERATOR', 'ADMIN']}>
            <Layout>
              <ClusterStatus />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Admin - ADMIN only */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;