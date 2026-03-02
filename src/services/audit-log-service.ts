/**
 * Audit Log Service
 * Logs admin actions for security compliance and audit trail
 */

import { supabase } from '@/lib/supabase';
import { uiLogger } from '@/utils/logger';
import {
  AuditAction,
  AuditLogPayload,
  AuditLogEntry,
  AuditLogQueryOptions,
  getAuditLogs,
  getAuditLogStats,
} from './audit-log-service-action-types';

export type { AuditAction, AuditLogPayload, AuditLogEntry, AuditLogQueryOptions };
export { getAuditLogs, getAuditLogStats };

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

