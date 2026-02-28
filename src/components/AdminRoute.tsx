import { Navigate } from 'react-router-dom';
import { useStore } from '@/store';
import { ReactNode } from 'react';
import { authLogger } from '@/utils/logger';
import { evaluateRouteGuard, checkAdminAccess } from '@/lib/vibe-auth';
import { getAdminEmails } from '@/utils/admin-check';

interface AdminRouteProps {
    children: ReactNode;
}

/**
 * AdminRoute - Protects admin routes using vibe-auth SDK route guard.
 *
 * Security checks:
 * 1. Auth must be initialized (prevents redirect flash on page reload)
 * 2. User must be authenticated
 * 3. User must have admin role (via vibe-auth checkAdminAccess)
 */
export function AdminRoute({ children }: AdminRouteProps) {
    const { user, isAuthenticated, isInitialized } = useStore();

    if (!isInitialized) {
        return null;
    }

    const verdict = evaluateRouteGuard(
        { requireAuth: true, requiredRoles: ['admin', 'super_admin'] },
        user ? { id: user.id, email: user.email, role: user.role, isAdmin: user.isAdmin } : null,
        isAuthenticated,
    );

    // Also check email whitelist via admin-check utility
    const isAdmin = verdict === 'allow' || checkAdminAccess(
        user ? { id: user.id, email: user.email, role: user.role, isAdmin: user.isAdmin } : null,
        getAdminEmails(),
    );

    if (verdict === 'redirect-login') {
        authLogger.warn('Access denied: User not authenticated');
        return <Navigate to="/" replace />;
    }

    if (!isAdmin) {
        authLogger.warn('Access denied: User is not admin', { email: user?.email, role: user?.role });
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}

export default AdminRoute;

