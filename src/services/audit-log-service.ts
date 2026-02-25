/**
 * Audit Log Service
 * Logs admin actions for security compliance and audit trail
 */

import { supabase } from '@/lib/supabase';
import { uiLogger } from '@/utils/logger';
import { fromSupabaseError } from '@/utils/errors';

export type AuditAction = 
  | 'withdrawal_approved'
  | 'withdrawal_rejected'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'role_changed'
  | 'settings_updated'
  | 'commission_adjusted'
  | 'payout_processed';

export interface AuditLogPayload {
  withdrawal_id?: string;
  user_id?: string;
  amount?: number;
  reason?: string;
  old_value?: unknown;
  new_value?: unknown;
  metadata?: Record<string, unknown>;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_id: string;
  action: AuditAction;
  payload: AuditLogPayload;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

/**
 * Log an admin action to audit trail
 */
export async function logAuditAction(
  action: AuditAction,
  payload: AuditLogPayload
): Promise<void> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      uiLogger.warn('Attempted to log audit action without authenticated user');
      return;
    }

    // Get client IP and user agent (best effort)
    const userAgent = navigator.userAgent;
    
    // Create audit log entry
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action,
        payload,
        user_agent: userAgent,
        timestamp: new Date().toISOString(),
      });

    if (error) {
      uiLogger.error('Failed to create audit log entry', error);
      // Don't throw - audit logging should not break the main flow
      return;
    }

    uiLogger.info('Audit log created', { action, userId: user.id });
  } catch (error) {
    uiLogger.error('Unexpected error in audit logging', error);
    // Silent failure - don't break main operations
  }
}

/**
 * Log withdrawal approval action
 */
export async function logWithdrawalApproval(
  withdrawalId: string,
  amount: number,
  userId: string
): Promise<void> {
  await logAuditAction('withdrawal_approved', {
    withdrawal_id: withdrawalId,
    user_id: userId,
    amount,
    metadata: {
      approved_at: new Date().toISOString(),
    },
  });
}

/**
 * Log withdrawal rejection action
 */
export async function logWithdrawalRejection(
  withdrawalId: string,
  amount: number,
  userId: string,
  reason: string
): Promise<void> {
  await logAuditAction('withdrawal_rejected', {
    withdrawal_id: withdrawalId,
    user_id: userId,
    amount,
    reason,
    metadata: {
      rejected_at: new Date().toISOString(),
    },
  });
}

/**
 * Log user creation action
 */
export async function logUserCreation(
  newUserId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAuditAction('user_created', {
    user_id: newUserId,
    metadata: {
      created_at: new Date().toISOString(),
      ...metadata,
    },
  });
}

/**
 * Log user update action
 */
export async function logUserUpdate(
  updatedUserId: string,
  oldValue: unknown,
  newValue: unknown
): Promise<void> {
  await logAuditAction('user_updated', {
    user_id: updatedUserId,
    old_value: oldValue,
    new_value: newValue,
    metadata: {
      updated_at: new Date().toISOString(),
    },
  });
}

/**
 * Log role change action
 */
export async function logRoleChange(
  targetUserId: string,
  oldRole: string,
  newRole: string
): Promise<void> {
  await logAuditAction('role_changed', {
    user_id: targetUserId,
    old_value: oldRole,
    new_value: newRole,
    metadata: {
      changed_at: new Date().toISOString(),
    },
  });
}

/**
 * Retrieve audit logs with pagination
 */
export async function getAuditLogs(
  options: {
    userId?: string;
    action?: AuditAction;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<AuditLogEntry[]> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (options.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options.action) {
      query = query.eq('action', options.action);
    }

    if (options.startDate) {
      query = query.gte('created_at', options.startDate);
    }

    if (options.endDate) {
      query = query.lte('created_at', options.endDate);
    }

    // Apply pagination
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      uiLogger.error('Failed to fetch audit logs', error);
      throw fromSupabaseError(error);
    }

    return data || [];
  } catch (error) {
    uiLogger.error('Error retrieving audit logs', error);
    throw error;
  }
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats(
  startDate?: string,
  endDate?: string
): Promise<Record<AuditAction, number>> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('action');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      uiLogger.error('Failed to fetch audit log stats', error);
      throw fromSupabaseError(error);
    }

    // Count by action type
    const stats: Record<string, number> = {};
    data?.forEach((log) => {
      stats[log.action] = (stats[log.action] || 0) + 1;
    });

    return stats as Record<AuditAction, number>;
  } catch (error) {
    uiLogger.error('Error retrieving audit log stats', error);
    throw error;
  }
}
