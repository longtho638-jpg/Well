/**
 * Auth Permission Utilities
 * Extracted from auth.ts for better modularity
 */

import type { Permission } from './auth-types';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    user: ['read:products', 'read:orders'],
    distributor: ['read:products', 'read:orders', 'write:orders', 'read:analytics'],
    vendor: ['read:products', 'read:orders', 'write:orders', 'read:analytics', 'vendor:manage-products'],
    admin: ['admin:all'],
};

export function hasPermission(role: string, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes('admin:all') || permissions.includes(permission);
}

export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
    return permissions.every(p => hasPermission(role, p));
}

export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
    return permissions.some(p => hasPermission(role, p));
}
