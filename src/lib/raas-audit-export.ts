/**
 * RaaS Audit Trail Export - Phase 6.5
 *
 * Export audit logs in JSON/CSV format for compliance and analysis.
 * Supports suspension events, license validations, and alert events.
 *
 * Features:
 * - JSON/CSV export formats
 * - mk_ API key linking
 * - JWT session tracking
 * - Date range filtering
 * - Organization-specific exports
 *
 * Usage:
 *   import { raasAuditExport } from '@/lib/raas-audit-export'
 *
 *   const csv = await raasAuditExport.exportSuspensionEvents({ orgId, startDate, endDate, format: 'csv' })
 *   const json = await raasAuditExport.exportLicenseEvents({ orgId, format: 'json' })
 */

import { supabase } from '@/lib/supabase'
import { analyticsLogger } from '@/utils/logger'

// ============================================================================
// EXPORT TYPES
// ============================================================================

/**
 * Export format
 */
export type ExportFormat = 'json' | 'csv'

/**
 * Audit event type
 */
export type AuditEventType =
  | 'suspension_events'
  | 'license_validations'
  | 'raas_alert_events'
  | 'raas_analytics_events'

/**
 * Export options
 */
export interface ExportOptions {
  /** Organization ID */
  orgId?: string
  /** User ID (optional) */
  userId?: string
  /** Start date */
  startDate?: Date
  /** End date */
  endDate?: Date
  /** Export format */
  format: ExportFormat
  /** Event types to include */
  eventTypes?: AuditEventType[]
  /** API key for linking */
  apiKey?: string
  /** Session ID for JWT tracking */
  sessionId?: string
  /** Max records to export */
  maxRecords?: number
}

/**
 * Suspension event record
 */
export interface SuspensionEventRecord {
  id: string
  org_id: string
  user_id: string | null
  reason: string | null
  message: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  api_key?: string | null
  session_id?: string | null
}

/**
 * License validation record
 */
export interface LicenseValidationRecord {
  id: string
  org_id: string
  license_key: string | null
  valid: boolean
  source: string | null
  response_time_ms: number | null
  metadata: Record<string, unknown> | null
  created_at: string
  api_key?: string | null
  session_id?: string | null
}

/**
 * Alert event record
 */
export interface AlertEventRecord {
  id: string
  org_id: string
  rule_id: string | null
  rule_type: string
  triggered: boolean
  current_value: number
  threshold_value: number
  severity: string
  message: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

/**
 * Analytics event record
 */
export interface AnalyticsEventRecord {
  id: string
  event_type: string
  org_id: string
  user_id: string | null
  timestamp: string
  request_id: string | null
  path: string | null
  ip_address: string | null
  metadata: Record<string, unknown> | null
}

// ============================================================================
// CSV HELPERS
// ============================================================================

/**
 * Convert array of objects to CSV string
 */
function convertToCSV<T extends Record<string, unknown>>(data: T[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const csvRows: string[] = []

  // Header row
  csvRows.push(headers.join(','))

  // Data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header]

      // Handle null/undefined
      if (value === null || value === undefined) {
        return ''
      }

      // Handle objects/arrays - stringify
      if (typeof value === 'object') {
        const escaped = JSON.stringify(value).replace(/"/g, '""')
        return `"${escaped}"`
      }

      // Handle strings with special characters
      if (typeof value === 'string') {
        const escaped = value.replace(/"/g, '""')
        if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
          return `"${escaped}"`
        }
        return escaped
      }

      // Handle numbers/booleans
      return String(value)
    })

    csvRows.push(values.join(','))
  }

  return csvRows.join('\n')
}

/**
 * Generate CSV filename with timestamp
 */
function generateFilename(eventType: string, format: ExportFormat): string {
  const timestamp = new Date().toISOString().slice(0, 10)
  return `raas_${eventType}_export_${timestamp}.${format}`
}

// ============================================================================
// AUDIT EXPORT SERVICE
// ============================================================================

export class RaasAuditExportService {
  /**
   * Export suspension events
   */
  async exportSuspensionEvents(options: ExportOptions): Promise<string> {
    const { orgId, startDate, endDate, format, maxRecords = 10000 } = options

    try {
      let query = supabase
        .from('suspension_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(maxRecords)

      if (orgId) {
        query = query.eq('org_id', orgId)
      }

      if (options.userId) {
        query = query.eq('user_id', options.userId)
      }

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString())
      }

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString())
      }

      const { data, error } = await query

      if (error) {
        analyticsLogger.error('[RaasAuditExport] Suspension events error:', error)
        return format === 'json' ? '[]' : ''
      }

      const records = data as unknown as SuspensionEventRecord[]

      if (format === 'json') {
        return JSON.stringify(records, null, 2)
      } else {
        return convertToCSV(records as unknown as Record<string, unknown>[])
      }
    } catch (err) {
      analyticsLogger.error('[RaasAuditExport] Suspension events error:', err)
      return format === 'json' ? '[]' : ''
    }
  }

  /**
   * Export license validation events
   */
  async exportLicenseEvents(options: ExportOptions): Promise<string> {
    const { orgId, startDate, endDate, format, maxRecords = 10000 } = options

    try {
      let query = supabase
        .from('raas_analytics_events')
        .select('*')
        .in('event_type', ['license_validated', 'license_expired'])
        .order('timestamp', { ascending: false })
        .limit(maxRecords)

      if (orgId) {
        query = query.eq('org_id', orgId)
      }

      if (startDate) {
        query = query.gte('timestamp', startDate.toISOString())
      }

      if (endDate) {
        query = query.lte('timestamp', endDate.toISOString())
      }

      const { data, error } = await query

      if (error) {
        analyticsLogger.error('[RaasAuditExport] License events error:', error)
        return format === 'json' ? '[]' : ''
      }

      const records = data as unknown as AnalyticsEventRecord[]

      if (format === 'json') {
        return JSON.stringify(records, null, 2)
      } else {
        return convertToCSV(records as unknown as Record<string, unknown>[])
      }
    } catch (err) {
      analyticsLogger.error('[RaasAuditExport] License events error:', err)
      return format === 'json' ? '[]' : ''
    }
  }

  /**
   * Export alert events
   */
  async exportAlertEvents(options: ExportOptions): Promise<string> {
    const { orgId, startDate, endDate, format, maxRecords = 10000 } = options

    try {
      let query = supabase
        .from('raas_alert_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(maxRecords)

      if (orgId) {
        query = query.eq('org_id', orgId)
      }

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString())
      }

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString())
      }

      const { data, error } = await query

      if (error) {
        analyticsLogger.error('[RaasAuditExport] Alert events error:', error)
        return format === 'json' ? '[]' : ''
      }

      const records = data as unknown as AlertEventRecord[]

      if (format === 'json') {
        return JSON.stringify(records, null, 2)
      } else {
        return convertToCSV(records as unknown as Record<string, unknown>[])
      }
    } catch (err) {
      analyticsLogger.error('[RaasAuditExport] Alert events error:', err)
      return format === 'json' ? '[]' : ''
    }
  }

  /**
   * Export analytics events
   */
  async exportAnalyticsEvents(options: ExportOptions): Promise<string> {
    const { orgId, startDate, endDate, format, maxRecords = 10000 } = options

    try {
      let query = supabase
        .from('raas_analytics_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(maxRecords)

      if (orgId) {
        query = query.eq('org_id', orgId)
      }

      if (options.userId) {
        query = query.eq('user_id', options.userId)
      }

      if (startDate) {
        query = query.gte('timestamp', startDate.toISOString())
      }

      if (endDate) {
        query = query.lte('timestamp', endDate.toISOString())
      }

      const { data, error } = await query

      if (error) {
        analyticsLogger.error('[RaasAuditExport] Analytics events error:', error)
        return format === 'json' ? '[]' : ''
      }

      const records = data as unknown as AnalyticsEventRecord[]

      if (format === 'json') {
        return JSON.stringify(records, null, 2)
      } else {
        return convertToCSV(records as unknown as Record<string, unknown>[])
      }
    } catch (err) {
      analyticsLogger.error('[RaasAuditExport] Analytics events error:', err)
      return format === 'json' ? '[]' : ''
    }
  }

  /**
   * Export all audit events (combined)
   */
  async exportAllEvents(options: ExportOptions): Promise<string> {
    const { format, eventTypes = ['suspension_events', 'raas_alert_events', 'raas_analytics_events'] } = options

    const results: Record<string, unknown[]> = {}

    for (const eventType of eventTypes) {
      let data: unknown[] = []

      switch (eventType) {
        case 'suspension_events':
          const suspensionData = await this.exportSuspensionEvents({ ...options, format: 'json' })
          data = JSON.parse(suspensionData)
          break
        case 'raas_alert_events':
          const alertData = await this.exportAlertEvents({ ...options, format: 'json' })
          data = JSON.parse(alertData)
          break
        case 'raas_analytics_events':
          const analyticsData = await this.exportAnalyticsEvents({ ...options, format: 'json' })
          data = JSON.parse(analyticsData)
          break
      }

      results[eventType] = data
    }

    if (format === 'json') {
      return JSON.stringify(results, null, 2)
    } else {
      // For CSV, concatenate all events with event_type column
      const allRecords: Record<string, unknown>[] = []

      for (const [eventType, records] of Object.entries(results)) {
        for (const record of records) {
          allRecords.push({
            ...(record as Record<string, unknown>),
            _event_source: eventType,
          })
        }
      }

      return convertToCSV(allRecords)
    }
  }

  /**
   * Generate export metadata
   */
  generateExportMetadata(options: ExportOptions, recordCount: number): Record<string, unknown> {
    return {
      export_timestamp: new Date().toISOString(),
      organization_id: options.orgId,
      user_id: options.userId,
      api_key_linked: options.apiKey ? options.apiKey.substring(0, 8) + '...' : null,
      session_id: options.sessionId,
      date_range: {
        start: options.startDate?.toISOString(),
        end: options.endDate?.toISOString(),
      },
      format: options.format,
      record_count: recordCount,
      event_types: options.eventTypes,
    }
  }

  /**
   * Download export as file (browser)
   */
  downloadExport(content: string, filename: string, mimeType = 'text/plain'): void {
    if (typeof window === 'undefined') {
      analyticsLogger.error('[RaasAuditExport] Download not available in server environment')
      return
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Get export statistics for organization
   */
  async getExportStats(orgId: string): Promise<{
    suspensionCount: number
    alertCount: number
    analyticsCount: number
    licenseValidationCount: number
  }> {
    try {
      const [suspensionResult, alertResult, analyticsResult, licenseResult] = await Promise.all([
        supabase.from('suspension_events').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
        supabase.from('raas_alert_events').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
        supabase.from('raas_analytics_events').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
        supabase
          .from('raas_analytics_events')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .in('event_type', ['license_validated', 'license_expired']),
      ])

      return {
        suspensionCount: suspensionResult.count || 0,
        alertCount: alertResult.count || 0,
        analyticsCount: analyticsResult.count || 0,
        licenseValidationCount: licenseResult.count || 0,
      }
    } catch (err) {
      analyticsLogger.error('[RaasAuditExport] Get stats error:', err)
      return {
        suspensionCount: 0,
        alertCount: 0,
        analyticsCount: 0,
        licenseValidationCount: 0,
      }
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const raasAuditExport = new RaasAuditExportService()

export default raasAuditExport
