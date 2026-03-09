---
title: "Phase 6.6: Audit Trail & Export"
description: "Link events with mk_ API keys, JWT session validation, audit log export"
status: pending
priority: P2
effort: 1.5h
---

# Phase 6.6: Audit Trail & Export

## Overview

Implement comprehensive audit trail linking all analytics events to API keys (mk_*) and JWT sessions, with export functionality for compliance and forensics.

## Features

| Feature | Description | Implementation |
|---------|-------------|----------------|
| API Key Linking | Associate events with mk_* keys | `api_key_hash` column |
| JWT Session Tracking | Track user sessions | `jwt_session_id` column |
| Event Correlation | Link related events | `correlation_id` column |
| Export (JSON/CSV) | Download audit logs | Export API endpoint |
| Retention Policy | Auto-delete old events | Cron job (90 days) |

## Implementation Steps

### 1. Database Schema Updates (`supabase/migrations/260309_audit_trail.sql`)

```sql
-- Add API key hash column to analytics events
ALTER TABLE raas_analytics_events
ADD COLUMN IF NOT EXISTS api_key_hash TEXT;

-- Add JWT session ID
ALTER TABLE raas_analytics_events
ADD COLUMN IF NOT EXISTS jwt_session_id TEXT;

-- Add correlation ID for event linking
ALTER TABLE raas_analytics_events
ADD COLUMN IF NOT EXISTS correlation_id TEXT;

-- Create index for API key lookups
CREATE INDEX IF NOT EXISTS idx_analytics_api_key
  ON raas_analytics_events(api_key_hash, timestamp DESC);

-- Create index for session lookups
CREATE INDEX IF NOT EXISTS idx_analytics_session
  ON raas_analytics_events(jwt_session_id, timestamp DESC);

-- Create index for correlation
CREATE INDEX IF NOT EXISTS idx_analytics_correlation
  ON raas_analytics_events(correlation_id)
  WHERE correlation_id IS NOT NULL;

-- Audit export log (track who exported what)
CREATE TABLE raas_audit_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  export_format TEXT NOT NULL, -- 'json' | 'csv'
  date_from TIMESTAMPTZ NOT NULL,
  date_to TIMESTAMPTZ NOT NULL,
  event_types TEXT[],
  file_path TEXT,
  file_size_bytes INTEGER,
  record_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  downloaded BOOLEAN DEFAULT false
);

-- Index for export history
CREATE INDEX idx_audit_exports_org
  ON raas_audit_exports(org_id, created_at DESC);

-- RLS for exports table
ALTER TABLE raas_audit_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read their exports"
  ON raas_audit_exports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_memberships m
      WHERE m.org_id = (SELECT id FROM organizations WHERE external_id = raas_audit_exports.org_id)
      AND m.user_id = auth.uid()
    )
  );

-- Function to cleanup old audit events (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_audit_events(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM raas_analytics_events
    WHERE timestamp < NOW() - (retention_days || ' days')::INTERVAL
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup cron (if pg_cron enabled)
-- SELECT cron.schedule(
--   'cleanup-audit-events',
--   '0 2 * * *', -- Daily at 2 AM
--   'SELECT cleanup_old_audit_events(90)'
-- );
```

### 2. Audit Trail Service (`src/lib/raas-audit-trail.ts`)

```typescript
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export interface AuditEventFilters {
  orgId: string
  apiKeyHash?: string
  sessionId?: string
  eventTypes?: string[]
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}

export interface AuditExportOptions {
  orgId: string
  userId: string
  format: 'json' | 'csv'
  dateFrom: string
  dateTo: string
  eventTypes?: string[]
}

export class RaasAuditTrail {
  /**
   * Query audit events
   */
  async queryEvents(filters: AuditEventFilters): Promise<AuditEvent[]> {
    const {
      orgId,
      apiKeyHash,
      sessionId,
      eventTypes,
      dateFrom,
      dateTo,
      limit = 1000,
      offset = 0,
    } = filters

    let query = supabase
      .from('raas_analytics_events')
      .select('*')
      .eq('org_id', orgId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    if (apiKeyHash) {
      query = query.eq('api_key_hash', apiKeyHash)
    }

    if (sessionId) {
      query = query.eq('jwt_session_id', sessionId)
    }

    if (eventTypes && eventTypes.length > 0) {
      query = query.in('event_type', eventTypes)
    }

    if (dateFrom) {
      query = query.gte('timestamp', dateFrom)
    }

    if (dateTo) {
      query = query.lte('timestamp', dateTo)
    }

    const { data, error } = await query

    if (error) {
      console.error('[AuditTrail] Query failed:', error)
      throw error
    }

    return (data as AuditEvent[]) || []
  }

  /**
   * Get events by API key
   */
  async getEventsByApiKey(
    apiKeyHash: string,
    orgId: string,
    limit = 100
  ): Promise<AuditEvent[]> {
    return this.queryEvents({
      orgId,
      apiKeyHash,
      limit,
    })
  }

  /**
   * Get events by JWT session
   */
  async getEventsBySession(
    sessionId: string,
    orgId: string,
    limit = 100
  ): Promise<AuditEvent[]> {
    return this.queryEvents({
      orgId,
      sessionId,
      limit,
    })
  }

  /**
   * Get correlated events (same correlation_id)
   */
  async getCorrelatedEvents(
    correlationId: string,
    orgId: string
  ): Promise<AuditEvent[]> {
    return this.queryEvents({
      orgId,
      limit: 1000,
    }).then(events =>
      events.filter(e => (e as any).correlation_id === correlationId)
    )
  }

  /**
   * Export audit events to JSON
   */
  async exportToJson(options: AuditExportOptions): Promise<ExportResult> {
    const events = await this.queryEvents({
      orgId: options.orgId,
      eventTypes: options.eventTypes,
      dateFrom: options.dateFrom,
      dateTo: options.dateTo,
      limit: 100000, // No limit for exports
    })

    const exportData = {
      exported_at: new Date().toISOString(),
      org_id: options.orgId,
      user_id: options.userId,
      date_from: options.dateFrom,
      date_to: options.dateTo,
      event_types: options.eventTypes || 'all',
      record_count: events.length,
      events: events.map(e => ({
        ...e,
        // Remove sensitive fields
        metadata: this.sanitizeMetadata(e.metadata),
      })),
    }

    const jsonStr = JSON.stringify(exportData, null, 2)
    const fileSize = new Blob([jsonStr]).size

    // Log export
    await this.logExport({
      ...options,
      format: 'json',
      fileSize,
      recordCount: events.length,
    })

    return {
      data: jsonStr,
      format: 'json',
      fileSize,
      recordCount: events.length,
      downloadUrl: await this.createDownloadUrl(jsonStr, 'audit-export.json'),
    }
  }

  /**
   * Export audit events to CSV
   */
  async exportToCsv(options: AuditExportOptions): Promise<ExportResult> {
    const events = await this.queryEvents({
      orgId: options.orgId,
      eventTypes: options.eventTypes,
      dateFrom: options.dateFrom,
      dateTo: options.dateTo,
      limit: 100000,
    })

    const headers = [
      'id', 'event_type', 'org_id', 'user_id', 'timestamp',
      'api_key_hash', 'jwt_session_id', 'correlation_id',
      'reason', 'subscription_status', 'path',
    ]

    const rows = events.map(e => [
      e.id,
      e.event_type,
      e.org_id,
      e.user_id || '',
      e.timestamp,
      (e as any).api_key_hash || '',
      (e as any).jwt_session_id || '',
      (e as any).correlation_id || '',
      e.reason || '',
      e.subscription_status || '',
      e.path || '',
    ])

    const csvStr = [
      headers.join(','),
      ...rows.map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    const fileSize = new Blob([csvStr]).size

    await this.logExport({
      ...options,
      format: 'csv',
      fileSize,
      recordCount: events.length,
    })

    return {
      data: csvStr,
      format: 'csv',
      fileSize,
      recordCount: events.length,
      downloadUrl: await this.createDownloadUrl(csvStr, 'audit-export.csv'),
    }
  }

  /**
   * Get export history
   */
  async getExportHistory(
    orgId: string,
    limit = 50
  ): Promise<AuditExport[]> {
    const { data, error } = await supabase
      .from('raas_audit_exports')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data as AuditExport[]) || []
  }

  /**
   * Get audit statistics
   */
  async getStatistics(orgId: string, dateFrom: string): Promise<AuditStatistics> {
    const { data, error } = await supabase
      .from('raas_analytics_events')
      .select('event_type, api_key_hash, jwt_session_id')
      .eq('org_id', orgId)
      .gte('timestamp', dateFrom)

    if (error) throw error

    const events = data || []

    return {
      totalEvents: events.length,
      uniqueApiKeys: new Set(events.map(e => e.api_key_hash).filter(Boolean)).size,
      uniqueSessions: new Set(events.map(e => e.jwt_session_id).filter(Boolean)).size,
      eventsByDay: this.groupByDay(events),
      eventsByType: this.groupByType(events),
    }
  }

  /**
   * Log export to audit_exports table
   */
  private async logExport(options: {
    orgId: string
    userId: string
    format: string
    dateFrom: string
    dateTo: string
    eventTypes?: string[]
    fileSize: number
    recordCount: number
  }): Promise<void> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await supabase
      .from('raas_audit_exports')
      .insert({
        org_id: options.orgId,
        user_id: options.userId,
        export_format: options.format,
        date_from: options.dateFrom,
        date_to: options.dateTo,
        event_types: options.eventTypes,
        file_size_bytes: options.fileSize,
        record_count: options.recordCount,
        expires_at: expiresAt.toISOString(),
      })
  }

  /**
   * Create download URL (using Supabase Storage or temporary blob)
   */
  private async createDownloadUrl(
    content: string,
    filename: string
  ): Promise<string> {
    // For now, return base64 data URL
    // In production, upload to Supabase Storage and return signed URL
    const blob = new Blob([content], { type: 'application/octet-stream' })
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
    return base64
  }

  /**
   * Sanitize metadata for export (remove sensitive data)
   */
  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> {
    if (!metadata) return {}

    const sanitized = { ...metadata }

    // Remove sensitive fields
    delete sanitized.api_key
    delete sanitized.jwt_token
    delete sanitized.password
    delete sanitized.secret

    return sanitized
  }

  private groupByDay(events: any[]): Record<string, number> {
    return events.reduce((acc, e) => {
      const day = new Date(e.timestamp).toISOString().split('T')[0]
      acc[day] = (acc[day] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  private groupByType(events: any[]): Record<string, number> {
    return events.reduce((acc, e) => {
      acc[e.event_type] = (acc[e.event_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
}

export interface AuditEvent {
  id: string
  event_type: string
  org_id: string
  user_id?: string
  timestamp: string
  api_key_hash?: string
  jwt_session_id?: string
  correlation_id?: string
  reason?: string
  subscription_status?: string
  path?: string
  metadata?: Record<string, any>
}

export interface AuditExport {
  id: string
  org_id: string
  user_id: string
  export_format: string
  date_from: string
  date_to: string
  event_types?: string[]
  file_path?: string
  file_size_bytes?: number
  record_count?: number
  created_at: string
  expires_at: string
  downloaded: boolean
}

export interface ExportResult {
  data: string
  format: 'json' | 'csv'
  fileSize: number
  recordCount: number
  downloadUrl: string
}

export interface AuditStatistics {
  totalEvents: number
  uniqueApiKeys: number
  uniqueSessions: number
  eventsByDay: Record<string, number>
  eventsByType: Record<string, number>
}

export const raasAuditTrail = new RaasAuditTrail()
```

### 3. Export API Endpoint (`src/lib/raas-audit-export-api.ts`)

```typescript
import { raasAuditTrail } from './raas-audit-trail'

/**
 * Handle audit export request
 *
 * Usage in API route:
 *   export async function POST(req: Request) {
 *     const body = await req.json()
 *     const result = await handleAuditExport(req, body)
 *     return result
 *   }
 */
export async function handleAuditExport(
  request: Request,
  body: {
    format: 'json' | 'csv'
    dateFrom: string
    dateTo: string
    eventTypes?: string[]
  }
): Promise<Response> {
  try {
    // Get user from auth header
    const user = await getUserFromRequest(request)
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { format, dateFrom, dateTo, eventTypes } = body

    const exportResult = format === 'json'
      ? await raasAuditTrail.exportToJson({
          orgId: user.orgId,
          userId: user.id,
          format,
          dateFrom,
          dateTo,
          eventTypes,
        })
      : await raasAuditTrail.exportToCsv({
          orgId: user.orgId,
          userId: user.id,
          format,
          dateFrom,
          dateTo,
          eventTypes,
        })

    return new Response(exportResult.data, {
      headers: {
        'Content-Type': format === 'json' ? 'application/json' : 'text/csv',
        'Content-Disposition': `attachment; filename="audit-export-${Date.now()}.${format}"`,
      },
    })
  } catch (error) {
    console.error('[AuditExport] Error:', error)
    return new Response('Export failed', { status: 500 })
  }
}

async function getUserFromRequest(request: Request): Promise<{
  id: string
  orgId: string
} | null> {
  // Extract user from Supabase auth header or JWT
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return null

  // Parse JWT or call Supabase auth API
  // Implementation depends on auth setup
  return { id: 'user-id', orgId: 'org-id' }
}
```

### 4. Audit Dashboard Component (`src/components/analytics/audit-export-panel.tsx`)

```typescript
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useRaasAuditTrail } from '@/hooks/use-raas-audit-trail'

const EVENT_TYPES = [
  'suspension_created',
  'suspension_cleared',
  'license_expired',
  'license_validated',
  'feature_used',
  'quota_check',
  'access_denied',
  'quota_warning',
]

export function AuditExportPanel() {
  const [format, setFormat] = useState<'json' | 'csv'>('json')
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/audit/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          dateFrom: dateFrom?.toISOString(),
          dateTo: dateTo?.toISOString(),
          eventTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-export.${format}`
        a.click()
      }
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="p-4 rounded-lg bg-card border space-y-4">
      <h3 className="text-lg font-semibold">Export Audit Logs</h3>

      {/* Format Selection */}
      <div className="flex gap-4">
        <Select value={format} onValueChange={(v) => setFormat(v as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="csv">CSV</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Range */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium mb-2 block">From</label>
          <Calendar
            mode="single"
            selected={dateFrom}
            onSelect={setDateFrom}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">To</label>
          <Calendar
            mode="single"
            selected={dateTo}
            onSelect={setDateTo}
          />
        </div>
      </div>

      {/* Event Types */}
      <div>
        <label className="text-sm font-medium mb-2 block">Event Types</label>
        <div className="grid gap-2 md:grid-cols-2">
          {EVENT_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2">
              <Checkbox
                checked={selectedTypes.includes(type)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedTypes([...selectedTypes, type])
                  } else {
                    setSelectedTypes(selectedTypes.filter(t => t !== type))
                  }
                }}
              />
              <span className="text-sm">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Export Button */}
      <Button
        onClick={handleExport}
        disabled={exporting || !dateFrom || !dateTo}
      >
        {exporting ? 'Exporting...' : 'Export Audit Logs'}
      </Button>
    </div>
  )
}
```

## Success Criteria

- [ ] Events linked to API keys (mk_*)
- [ ] JWT session tracking functional
- [ ] JSON/CSV export working
- [ ] Export history tracked
- [ ] Retention policy enforced (90 days)

## Related Files

- Create: `supabase/migrations/260309_audit_trail.sql`
- Create: `src/lib/raas-audit-trail.ts`
- Create: `src/lib/raas-audit-export-api.ts`
- Create: `src/components/analytics/audit-export-panel.tsx`
- Create: `src/hooks/use-raas-audit-trail.ts`
