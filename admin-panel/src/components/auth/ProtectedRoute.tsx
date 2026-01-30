import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute() {
  const { session, isLoading, isFounder, initialize } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg dark:bg-dark-bg">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary dark:text-teal-500" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isFounder) {
    // If logged in but not founder, show forbidden or redirect
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg dark:bg-dark-bg p-4 text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-4">You do not have permission to access this area.</p>
            <button
                onClick={() => useAuthStore.getState().signOut()}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-sm"
            >
                Sign Out
            </button>
        </div>
    );
  }

  return <Outlet />;
}
