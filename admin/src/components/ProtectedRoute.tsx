import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { admin, loading } = useAuth();
  if (loading) return <div className="state-message">Loading…</div>;
  if (!admin) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export const SuperAdminRoute: React.FC = () => {
  const { admin } = useAuth();
  if (admin?.role !== 'superadmin') return <Navigate to="/" replace />;
  return <Outlet />;
};
