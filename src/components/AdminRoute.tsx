import { Navigate } from 'react-router-dom';
import { useStore } from '@/store';
import { ReactNode } from 'react';
import { authLogger } from '@/utils/logger';
import { isAdmin as checkIsAdmin } from '@/utils/admin-check';

interface AdminRouteProps {
    children: ReactNode;
}

/**
 * AdminRoute - Protects admin routes from unauthorized access
 * 
 * Security checks:
 * 1. User must be authenticated
 * 2. User must have admin role
 * 
 * If checks fail, redirects to appropriate page
 */
export function AdminRoute({ children }: AdminRouteProps) {
    const { user, isAuthenticated } = useStore();

    // Check 1: Must be authenticated
    if (!isAuthenticated) {
        authLogger.warn('Access denied: User not authenticated');
        return <Navigate to="/" replace />;
    }

    // Check 2: Must have admin role
    const isAdmin = checkIsAdmin(user?.email) ||
        user?.role === 'admin' ||
        user?.role === 'super_admin' ||
        user?.isAdmin === true;

    if (!isAdmin) {
        authLogger.warn('Access denied: User is not admin', {
            email: user?.email,
            role: user?.role
        });
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}

export default AdminRoute;

