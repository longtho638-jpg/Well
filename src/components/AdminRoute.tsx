import { Navigate } from 'react-router-dom';
import { useStore } from '@/store';
import { ReactNode } from 'react';
import { authLogger } from '@/utils/logger';

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
    // SECURITY: Production admin whitelist - NO demo accounts
    const ADMIN_EMAILS = [
        'longtho638@gmail.com',
        'doanhnhancaotuan@gmail.com'
        // NOTE: demo@wellnexus.vn REMOVED - real users are making purchases
    ];

    const isAdmin = ADMIN_EMAILS.includes(user?.email || '') ||
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

