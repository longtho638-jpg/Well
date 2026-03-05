/**
 * Vendor Authorization Utilities
 * Extracted from auth.ts for better modularity
 */

import { supabase } from '@/lib/supabase';
import { createLogger } from '../logger';
import type { AuditEventType } from './auth-types';

const logger = createLogger('Auth');

export const checkProductAuthorization = async (productId: string, userId: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('id')
            .eq('id', productId)
            .eq('vendor_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                await logAuditEvent(userId, 'UNAUTHORIZED_ACCESS', 'products', productId);
                return false;
            }
            logger.error('Error checking product authorization', { error: error instanceof Error ? error.message : String(error) });
            return false;
        }

        return !!data;
    } catch (error) {
        logger.error('Unexpected error in checkProductAuthorization', { error: error instanceof Error ? error.message : String(error) });
        return false;
    }
};

export const isUserVendor = async (userId: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        if (error) {
            logger.error('Error checking user role', { error: error instanceof Error ? error.message : String(error) });
            return false;
        }

        return data?.role === 'vendor' || data?.role === 'admin';
    } catch (error) {
        logger.error('Unexpected error in isUserVendor', { error: error instanceof Error ? error.message : String(error) });
        return false;
    }
};

export const getProductVendorId = async (productId: string): Promise<string | null> => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('vendor_id')
            .eq('id', productId)
            .single();

        if (error) {
            logger.error('Error getting product vendor ID', { error: error instanceof Error ? error.message : String(error) });
            return null;
        }

        return data?.vendor_id || null;
    } catch (error) {
        logger.error('Unexpected error in getProductVendorId', { error: error instanceof Error ? error.message : String(error) });
        return null;
    }
};

export const logAuditEvent = async (
    userId: string,
    eventType: AuditEventType,
    resource: string,
    resourceId?: string,
    metadata?: Record<string, unknown>
): Promise<void> => {
    try {
        await supabase.from('audit_logs').insert({
            user_id: userId,
            event_type: eventType,
            resource,
            resource_id: resourceId,
            metadata: metadata || {},
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Failed to log audit event', { error: error instanceof Error ? error.message : String(error) });
    }
};

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 100;
const RATE_LIMIT_STORAGE_KEY = 'vendor_rate_limit_';

export const checkRateLimit = (userId: string): boolean => {
    const now = Date.now();
    const key = RATE_LIMIT_STORAGE_KEY + userId;

    try {
        const stored = localStorage.getItem(key);
        if (!stored) {
            localStorage.setItem(key, JSON.stringify({ count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS }));
            return false;
        }

        const { count, resetAt } = JSON.parse(stored);

        if (now > resetAt) {
            localStorage.setItem(key, JSON.stringify({ count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS }));
            return false;
        }

        if (count >= RATE_LIMIT_MAX_REQUESTS) {
            logAuditEvent(userId, 'RATE_LIMIT_EXCEEDED', 'api', undefined, { count, resetAt });
            return true;
        }

        localStorage.setItem(key, JSON.stringify({ count: count + 1, resetAt }));
        return false;
    } catch {
        return false;
    }
};

export const getRateLimitRemaining = (userId: string): number => {
    const key = RATE_LIMIT_STORAGE_KEY + userId;
    const stored = localStorage.getItem(key);

    if (!stored) return RATE_LIMIT_MAX_REQUESTS;

    const { count, resetAt } = JSON.parse(stored);
    if (Date.now() > resetAt) return RATE_LIMIT_MAX_REQUESTS;

    return Math.max(0, RATE_LIMIT_MAX_REQUESTS - count);
};
