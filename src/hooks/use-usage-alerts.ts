/**
 * Usage Alerts Hook - Phase 6 Real-time Alerts
 *
 * Subscribes to real-time usage alerts via Supabase Realtime.
 * Provides methods to fetch alert history and update settings.
 *
 * @example
 * ```typescript
 * const { alerts, settings, loading, dismissAlert, updateSettings } = useUsageAlerts(userId);
 * ```
 */

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { AlertEvent, AlertSettings, AlertHistoryItem } from '@/types/usage-alerts'
import type { AlertMetricType, AlertThreshold } from '@/lib/usage-alert-engine'
import { createLogger } from '@/utils/logger'

/**
 * Raw database row type for alert webhook events
 */
interface AlertWebhookRow {
  id: string
  event_id: string
  event_type: string
  user_id: string
  license_id: string | null
  metric_type: string
  threshold_percentage: number
  current_usage: number
  quota_limit: number
  webhook_status: string
  processed_at: string | null
  created_at: string
}

const logger = createLogger('useUsageAlerts')

interface UseUsageAlertsReturn {
  // Real-time alerts
  alerts: AlertEvent[]
  loading: boolean
  error: string | null

  // Alert history
  history: AlertHistoryItem[]
  fetchHistory: () => Promise<void>

  // Settings
  settings: AlertSettings | null
  updateSettings: (settings: Partial<AlertSettings>) => Promise<void>

  // Actions
  dismissAlert: (eventId: string) => Promise<void>
  checkAlerts: () => Promise<void>
  refreshStatus: () => Promise<void>
}

const DEFAULT_SETTINGS: AlertSettings = {
  emailEnabled: true,
  webhookEnabled: true,
  smsEnabled: false,
  thresholds: [80, 90, 100],
  metrics: ['api_calls', 'tokens', 'compute_minutes', 'model_inferences', 'agent_executions'],
  cooldownMinutes: 60,
}

export function useUsageAlerts(userId: string): UseUsageAlertsReturn {
  const [alerts, setAlerts] = useState<AlertEvent[]>([])
  const [history, setHistory] = useState<AlertHistoryItem[]>([])
  const [settings, setSettings] = useState<AlertSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch alert history
   */
  const fetchHistory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('alert_webhook_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setHistory(
        (data || []).map((item: AlertWebhookRow) => ({
          id: item.id,
          eventId: item.event_id,
          eventType: item.event_type,
          metricType: item.metric_type as AlertMetricType,
          thresholdPercentage: item.threshold_percentage as AlertThreshold,
          usagePercentage: Math.round((item.current_usage / item.quota_limit) * 100),
          webhookStatus: item.webhook_status as 'pending' | 'sent' | 'failed',
          createdAt: item.created_at,
          processedAt: item.processed_at ?? undefined,
        }))
      )
    } catch (err) {
      logger.warn('History fetch failed', { error: err })
    }
  }, [userId])

  /**
   * Fetch current settings
   */
  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_alert_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        setSettings(DEFAULT_SETTINGS)
        return
      }

      setSettings({
        ...DEFAULT_SETTINGS,
        ...data.settings,
      })
    } catch (err) {
      logger.warn('Settings fetch failed', { error: err })
      setSettings(DEFAULT_SETTINGS)
    }
  }, [userId])

  /**
   * Update alert settings
   */
  const updateSettings = useCallback(
    async (newSettings: Partial<AlertSettings>) => {
      try {
        const updatedSettings = { ...settings, ...newSettings } as AlertSettings

        const { error } = await supabase.from('user_alert_settings').upsert({
          user_id: userId,
          settings: updatedSettings,
          updated_at: new Date().toISOString(),
        })

        if (error) throw error

        setSettings(updatedSettings)
      } catch (err) {
        logger.error('Settings update failed', { error: err })
        throw err
      }
    },
    [settings, userId]
  )

  /**
   * Dismiss an alert
   */
  const dismissAlert = useCallback(async (eventId: string) => {
    setAlerts((prev) => prev.filter((a) => a.eventId !== eventId))
  }, [])

  /**
   * Check and trigger alerts
   */
  const checkAlerts = useCallback(async () => {
    try {
      await supabase.functions.invoke('usage-alert-webhook', {
        body: { user_id: userId },
      })
    } catch (err) {
      logger.warn('Alert check failed', { error: err })
    }
  }, [userId])

  /**
   * Refresh usage status
   */
  const refreshStatus = useCallback(async () => {
    await fetchHistory()
  }, [fetchHistory])

  /**
   * Subscribe to real-time alerts via Supabase Realtime
   */
  useEffect(() => {
    if (!userId) return

    // Fetch initial data
    fetchHistory()
    fetchSettings()
    setLoading(false)

    // Subscribe to new alerts
    const channel = supabase
      .channel('usage-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alert_webhook_events',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newAlert: AlertEvent = {
            eventId: payload.new.event_id,
            eventType: payload.new.event_type,
            userId: payload.new.user_id,
            licenseId: payload.new.license_id,
            metricType: payload.new.metric_type,
            thresholdPercentage: payload.new.threshold_percentage,
            currentUsage: payload.new.current_usage,
            quotaLimit: payload.new.quota_limit,
            usagePercentage: Math.round(
              (payload.new.current_usage / payload.new.quota_limit) * 100
            ),
            createdAt: payload.new.created_at,
            webhookStatus: payload.new.webhook_status,
          }

          setAlerts((prev) => [...prev, newAlert])

          // Auto-dismiss after 10 seconds
          setTimeout(() => {
            setAlerts((prev) => prev.filter((a) => a.eventId !== newAlert.eventId))
          }, 10000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchHistory, fetchSettings])

  return {
    alerts,
    loading,
    error,
    history,
    fetchHistory,
    settings,
    updateSettings,
    dismissAlert,
    checkAlerts,
    refreshStatus,
  }
}

export default useUsageAlerts
