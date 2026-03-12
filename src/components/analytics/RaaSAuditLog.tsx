/**
 * RaaS Audit Log Viewer - Phase 6.5
 *
 * UI for viewing and exporting audit logs.
 * Supports filtering, search, and JSON/CSV export.
 *
 * Features:
 * - View suspension, license, alert events
 * - Date range filtering
 * - Search by org/user
 * - Export to JSON/CSV
 * - mk_ API key linking display
 * - JWT session tracking
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { raasAuditExport, type AuditEventType, type ExportFormat } from '@/lib/raas-audit-export'
import { Download, FileJson, FileSpreadsheet, Search, Filter, Calendar, Eye } from 'lucide-react'
import { analyticsLogger } from '@/utils/logger'

// ============================================================================
// TYPES
// ============================================================================

interface RaaSAuditLogProps {
  /** Organization ID */
  orgId: string
  /** API key for linking (optional) */
  apiKey?: string
  /** Session ID for JWT tracking (optional) */
  sessionId?: string
}

interface EventRecord {
  id: string
  org_id: string
  event_type?: string
  rule_type?: string
  created_at: string
  [key: string]: unknown
}

// ============================================================================
// COMPONENT
// ============================================================================

export function RaaSAuditLog({ orgId, apiKey, sessionId }: RaaSAuditLogProps) {
  const { t } = useTranslation('raas')
  const [eventType, setEventType] = useState<AuditEventType>('suspension_events')
  const [events, setEvents] = useState<EventRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [stats, setStats] = useState({
    suspensionCount: 0,
    alertCount: 0,
    analyticsCount: 0,
    licenseValidationCount: 0,
  })

  // Load events on mount and when filters change
  useEffect(() => {
    loadEvents()
    loadStats()
  }, [orgId, eventType])

  const loadEvents = async () => {
    setLoading(true)

    const options = {
      orgId,
      startDate: dateRange.start ? new Date(dateRange.start) : undefined,
      endDate: dateRange.end ? new Date(dateRange.end) : undefined,
      format: 'json' as ExportFormat,
    }

    let data: string

    switch (eventType) {
      case 'suspension_events':
        data = await raasAuditExport.exportSuspensionEvents(options)
        break
      case 'raas_alert_events':
        data = await raasAuditExport.exportAlertEvents(options)
        break
      case 'raas_analytics_events':
        data = await raasAuditExport.exportAnalyticsEvents(options)
        break
      default:
        data = '[]'
    }

    try {
      const parsed = JSON.parse(data)
      setEvents(parsed)
    } catch (err) {
      analyticsLogger.error('[RaaSAuditLog] Parse error:', err)
      setEvents([])
    }

    setLoading(false)
  }

  const loadStats = async () => {
    const s = await raasAuditExport.getExportStats(orgId)
    setStats(s)
  }

  const handleExport = async (format: ExportFormat) => {
    setExporting(true)

    const options = {
      orgId,
      startDate: dateRange.start ? new Date(dateRange.start) : undefined,
      endDate: dateRange.end ? new Date(dateRange.end) : undefined,
      format,
      apiKey,
      sessionId,
    }

    let content: string
    let filename: string

    switch (eventType) {
      case 'suspension_events':
        content = await raasAuditExport.exportSuspensionEvents(options)
        filename = `raas_suspension_events_${new Date().toISOString().slice(0, 10)}.${format}`
        break
      case 'raas_alert_events':
        content = await raasAuditExport.exportAlertEvents(options)
        filename = `raas_alert_events_${new Date().toISOString().slice(0, 10)}.${format}`
        break
      case 'raas_analytics_events':
        content = await raasAuditExport.exportAnalyticsEvents(options)
        filename = `raas_analytics_events_${new Date().toISOString().slice(0, 10)}.${format}`
        break
      default:
        content = '[]'
        filename = `raas_export_${new Date().toISOString().slice(0, 10)}.${format}`
    }

    raasAuditExport.downloadExport(
      content,
      filename,
      format === 'json' ? 'application/json' : 'text/csv'
    )

    setExporting(false)
  }

  const handleExportAll = async (format: ExportFormat) => {
    setExporting(true)

    const options = {
      orgId,
      startDate: dateRange.start ? new Date(dateRange.start) : undefined,
      endDate: dateRange.end ? new Date(dateRange.end) : undefined,
      format,
      apiKey,
      sessionId,
    }

    const content = await raasAuditExport.exportAllEvents(options)
    const filename = `raas_all_events_${new Date().toISOString().slice(0, 10)}.${format}`

    raasAuditExport.downloadExport(
      content,
      filename,
      format === 'json' ? 'application/json' : 'text/csv'
    )

    setExporting(false)
  }

  const filteredEvents = events.filter((event) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return Object.values(event).some((value) =>
      String(value).toLowerCase().includes(searchLower)
    )
  })

  const getEventStatusColor = (event: EventRecord) => {
    if ('triggered' in event) {
      return event.triggered ? 'text-red-400 bg-red-400/10' : 'text-green-400 bg-green-400/10'
    }
    if ('valid' in event) {
      return event.valid ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
    }
    return 'text-blue-400 bg-blue-400/10'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t('raas.audit_log.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('raas.audit_log.description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportAll('json')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted disabled:opacity-50"
          >
            <FileJson className="w-4 h-4" />
            {t('raas.audit_log.export_all_json')}
          </button>
          <button
            onClick={() => handleExportAll('csv')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {t('raas.audit_log.export_all_csv')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg bg-card">
          <div className="text-sm text-muted-foreground">{t('raas.audit_log.suspension_events')}</div>
          <div className="text-2xl font-bold">{stats.suspensionCount}</div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="text-sm text-muted-foreground">{t('raas.audit_log.alert_events')}</div>
          <div className="text-2xl font-bold">{stats.alertCount}</div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="text-sm text-muted-foreground">{t('raas.audit_log.analytics_events')}</div>
          <div className="text-2xl font-bold">{stats.analyticsCount}</div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="text-sm text-muted-foreground">{t('raas.audit_log.license_validations')}</div>
          <div className="text-2xl font-bold">{stats.licenseValidationCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
        {/* Event Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value as AuditEventType)}
            className="px-3 py-2 border rounded-md bg-background text-sm"
          >
            <option value="suspension_events">{t('raas.audit_log.types.suspension')}</option>
            <option value="raas_alert_events">{t('raas.audit_log.types.alerts')}</option>
            <option value="raas_analytics_events">{t('raas.audit_log.types.analytics')}</option>
          </select>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-3 py-2 border rounded-md bg-background text-sm"
          />
          <span className="text-muted-foreground">-</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-3 py-2 border rounded-md bg-background text-sm"
          />
        </div>

        {/* Search */}
        <div className="flex-1 flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('raas.audit_log.search_placeholder')}
            className="flex-1 px-3 py-2 border rounded-md bg-background text-sm"
          />
        </div>
      </div>

      {/* Export Current View */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Eye className="w-4 h-4" />
          {t('raas.audit_log.showing')} {filteredEvents.length} {t('raas.audit_log.of')} {events.length} {t('raas.audit_log.events')}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('raas.audit_log.export_current')}:</span>
          <button
            onClick={() => handleExport('json')}
            disabled={exporting || filteredEvents.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 border rounded-md hover:bg-muted disabled:opacity-50 text-sm"
          >
            <FileJson className="w-3 h-3" />
            JSON
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting || filteredEvents.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 border rounded-md hover:bg-muted disabled:opacity-50 text-sm"
          >
            <FileSpreadsheet className="w-3 h-3" />
            CSV
          </button>
        </div>
      </div>

      {/* Events Table */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>{t('raas.audit_log.no_events')}</p>
          <p className="text-sm">{t('raas.audit_log.no_events_description')}</p>
        </div>
      ) : (
        <div className="border rounded-lg bg-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('raas.audit_log.table.timestamp')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('raas.audit_log.table.type')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('raas.audit_log.table.org_id')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('raas.audit_log.table.details')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t('raas.audit_log.table.status')}</th>
                {apiKey && (
                  <th className="px-4 py-3 text-left text-sm font-medium">{t('raas.audit_log.table.api_key')}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredEvents.slice(0, 100).map((event) => (
                <tr key={event.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {event.event_type || event.rule_type || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-xs">
                    {event.org_id?.substring(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <pre className="text-xs bg-muted/50 p-2 rounded max-h-20 overflow-auto">
                      {JSON.stringify(event, null, 2).substring(0, 200)}
                      {JSON.stringify(event, null, 2).length > 200 ? '...' : ''}
                    </pre>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${getEventStatusColor(event)}`}>
                      {'triggered' in event
                        ? event.triggered
                          ? t('raas.audit_log.status.triggered')
                          : t('raas.audit_log.status.not_triggered')
                        : 'valid' in event
                        ? event.valid
                          ? t('raas.audit_log.status.valid')
                          : t('raas.audit_log.status.invalid')
                        : t('raas.audit_log.status.recorded')}
                    </span>
                  </td>
                  {apiKey && (
                    <td className="px-4 py-3 text-sm font-mono text-xs text-muted-foreground">
                      {apiKey.substring(0, 8)}...
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEvents.length > 100 && (
            <div className="p-4 text-center text-sm text-muted-foreground border-t">
              {t('raas.audit_log.showing_first_100')}
            </div>
          )}
        </div>
      )}

      {/* API Key & Session Info */}
      {(apiKey || sessionId) && (
        <div className="p-4 border rounded-lg bg-muted/30 text-sm">
          <div className="flex items-center gap-2 mb-2">
            <FileJson className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{t('raas.audit_log.tracking_info')}</span>
          </div>
          {apiKey && (
            <div className="text-muted-foreground">
              {t('raas.audit_log.api_key')}: <code className="bg-muted px-2 py-0.5 rounded">{apiKey.substring(0, 8)}...</code>
            </div>
          )}
          {sessionId && (
            <div className="text-muted-foreground">
              {t('raas.audit_log.session_id')}: <code className="bg-muted px-2 py-0.5 rounded">{sessionId.substring(0, 8)}...</code>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RaaSAuditLog
