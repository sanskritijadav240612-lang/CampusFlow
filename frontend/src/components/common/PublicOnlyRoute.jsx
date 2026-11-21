import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingState from '../ui/LoadingState';

/**
 * PublicOnlyRoute guard:
 * Prevents authenticated students or faculty from reopening login or registration pages.
 * Redirects them directly to their active role portal.
 */
export const PublicOnlyRoute = () => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState fullScreen message="Loading CampusFlow..." />;
  }

  if (isAuthenticated) {
    const targetDashboard = role === 'faculty' ? '/faculty' : '/student';
    return <Navigate to={targetDashboard} replace />;
  }

  return <Outlet />;
};

export default PublicOnlyRoute;
