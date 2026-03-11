/**
 * Dunning Webhook Service
 *
 * Handles failed webhook logging, retrieval, and resolution.
 */

import { supabase } from '@/lib/supabase'
import { analyticsLogger } from '@/utils/logger'
import type { FailedWebhookRecord } from './dunning-types'

/**
 * Raw database row type for failed webhooks
 */
interface FailedWebhookRow {
  id: string
  webhook_id: string
  event_type: string
  payload: Record<string, unknown>
  error_message: string
  retry_count: number
}

/**
 * Log failed webhook for retry
 */
export async function logFailedWebhook(options: {
  webhookId: string
  eventType: string
  payload: Record<string, unknown>
  errorMessage: string
  retryCount?: number
  nextRetryAt?: Date
}): Promise<{ success: boolean; recordId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('failed_webhooks')
      .insert({
        webhook_id: options.webhookId,
        event_type: options.eventType,
        payload: options.payload,
        error_message: options.errorMessage,
        retry_count: options.retryCount || 0,
        next_retry_at: options.nextRetryAt?.toISOString() || null,
      })
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, recordId: data.id }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Get failed webhooks ready for retry
 */
export async function getFailedWebhooksForRetry(): Promise<FailedWebhookRecord[]> {
  try {
    const { data, error } = await supabase
      .from('failed_webhooks')
      .select('*')
      .eq('resolved', false)
      .lte('next_retry_at', new Date().toISOString())
      .lt('retry_count', 5)
      .order('next_retry_at', { ascending: true })
      .limit(50)

    if (error) {
      analyticsLogger.error('[DunningWebhookService] Error getting failed webhooks:', error)
      return []
    }

    return (data || []).map((item: FailedWebhookRow) => ({
      id: item.id,
      webhookId: item.webhook_id,
      eventType: item.event_type,
      payload: item.payload as Record<string, unknown>,
      errorMessage: item.error_message,
      retryCount: item.retry_count,
    }))
  } catch (err) {
    analyticsLogger.error('[DunningWebhookService] Error:', err)
    return []
  }
}

/**
 * Mark webhook as resolved
 */
export async function resolveFailedWebhook(
  webhookId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('failed_webhooks')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
      })
      .eq('webhook_id', webhookId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
