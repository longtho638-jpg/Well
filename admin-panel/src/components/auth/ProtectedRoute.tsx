import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Loader2 } from 'lucide-react';
import { AURA_ELITE } from '../../lib/design-tokens';

/**
 * Protected Route Component with Role-Based Access Control
 *
 * Features:
 * - Authentication check
 * - Role-based authorization (admin/founder only)
 * - Loading state (prevents flash of wrong content)
 * - Automatic redirect to login with return URL
 * - Forbidden page for insufficient permissions
 * - Aura Elite design system integration
 */
export function ProtectedRoute() {
  const { session, isLoading, isFounder, initialize } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Loading state - show skeleton with Aura Elite style
  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${AURA_ELITE.glass.dark}`}>
        <div className={`${AURA_ELITE.spacing.card} ${AURA_ELITE.glass.medium} ${AURA_ELITE.borders.glow}`}>
          <Loader2 className={`w-12 h-12 ${AURA_ELITE.animations.spin} text-purple-400`} />
          <p className={`mt-4 ${AURA_ELITE.text.body}`}>Verifying credentials...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login with return URL
  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Authenticated but insufficient role - show forbidden page with Aura Elite styling
  if (!isFounder) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${AURA_ELITE.glass.dark}`}>
        <div className={`${AURA_ELITE.spacing.card} ${AURA_ELITE.glass.medium} ${AURA_ELITE.borders.default} max-w-md text-center`}>
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full ${AURA_ELITE.gradients.danger} flex items-center justify-center`}>
            <span className="text-4xl">🚫</span>
          </div>
          <h1 className={AURA_ELITE.text.heading + ' ' + AURA_ELITE.gradients.primary}>
            Access Forbidden
          </h1>
          <p className={`mt-4 ${AURA_ELITE.text.body}`}>
            You don't have permission to access this page.
          </p>
          <p className={`mt-2 ${AURA_ELITE.text.caption}`}>
            This area is restricted to administrators only.
          </p>
          <button
            onClick={() => useAuthStore.getState().signOut()}
            className={`mt-6 px-6 py-3 rounded-xl ${AURA_ELITE.gradients.primary} ${AURA_ELITE.shadows.md} hover:scale-105 transition-transform`}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // All checks passed - render children
  return <Outlet />;
}
