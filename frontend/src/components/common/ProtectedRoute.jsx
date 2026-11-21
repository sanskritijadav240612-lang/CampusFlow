import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingState from '../ui/LoadingState';

/**
 * ProtectedRoute guard:
 * - Displays loading screen while checking auth session.
 * - Redirects unauthenticated users to the appropriate login page.
 * - Enforces role-based permissions (Student cannot access Faculty, Faculty cannot access Student).
 */
export const ProtectedRoute = ({ allowedRole }) => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState fullScreen message="Verifying campus credentials..." />;
  }

  if (!isAuthenticated) {
    const redirectPath = allowedRole === 'faculty' ? '/faculty/login' : '/login';
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // Cross-role boundary protection
  if (allowedRole && role !== allowedRole) {
    const fallbackPath = role === 'faculty' ? '/faculty' : '/student';
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
