/**
 * Audit log service — AuditAction types, payload/entry interfaces, and read query helpers.
 * Extracted to keep audit-log-service.ts under 200 LOC.
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

export interface AuditLogQueryOptions {
  userId?: string;
  action?: AuditAction;
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}

/**
 * Retrieve audit logs with pagination
 */
export async function getAuditLogs(
  options: AuditLogQueryOptions = {}
): Promise<AuditLogEntry[]> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (options.userId) query = query.eq('user_id', options.userId);
    if (options.action) query = query.eq('action', options.action);
    if (options.startDate) query = query.gte('created_at', options.startDate);
    if (options.endDate) query = query.lte('created_at', options.endDate);

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
    let query = supabase.from('audit_logs').select('action');
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, error } = await query;
    if (error) {
      uiLogger.error('Failed to fetch audit log stats', error);
      throw fromSupabaseError(error);
    }

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
