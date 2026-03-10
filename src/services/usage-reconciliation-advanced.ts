/**
 * Usage Reconciliation - Advanced Helpers
 *
 * Statistics and history functions for reconciliation.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { analyticsLogger } from '@/utils/logger'

export async function getReconciliationHistory(
  supabase: SupabaseClient,
  orgId: string,
  days: number = 30
): Promise<any[]> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('reconciliation_log')
      .select('*')
      .eq('org_id', orgId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      analyticsLogger.error('[Reconciliation] History fetch error', error)
      return []
    }

    return data || []
  } catch (_err) {
    return []
  }
}

export async function getReconciliationStats(
  supabase: SupabaseClient,
  days: number = 30
): Promise<{
  totalReconciliations: number
  matchedCount: number
  autoHealedCount: number
  alertedCount: number
  avgDiscrepancy: number
}> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('reconciliation_log')
      .select('status, discrepancy')
      .gte('created_at', startDate.toISOString())

    if (error) {
      analyticsLogger.error('[Reconciliation] Stats fetch error', error)
      return {
        totalReconciliations: 0,
        matchedCount: 0,
        autoHealedCount: 0,
        alertedCount: 0,
        avgDiscrepancy: 0,
      }
    }

    const totalReconciliations = data?.length || 0
    const matchedCount = data?.filter(r => r.status === 'matched').length || 0
    const autoHealedCount = data?.filter(r => r.status === 'auto_healed').length || 0
    const alertedCount = data?.filter(r => r.status === 'alerted').length || 0
    const avgDiscrepancy = data?.reduce((sum, r) => sum + (r.discrepancy || 0), 0) / (data?.length || 1)

    return {
      totalReconciliations,
      matchedCount,
      autoHealedCount,
      alertedCount,
      avgDiscrepancy,
    }
  } catch (_err) {
    return {
      totalReconciliations: 0,
      matchedCount: 0,
      autoHealedCount: 0,
      alertedCount: 0,
      avgDiscrepancy: 0,
    }
  }
}
