/**
 * ROI Digest Worker - Phase 6
 * Cloudflare Worker for anomaly detection and ROI reporting
 */

import { AnomalyDetectorCore } from './anomaly-detector-core'
import type { AlertWebhookPayload, WorkerEnv, AnomalyAlert } from './types'

function corsHeaders(): Record<string, string> {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-Org-ID, Authorization', 'Access-Control-Max-Age': '86400' }
}

async function verifyAuth(request: Request, env: WorkerEnv): Promise<{ valid: boolean; orgId?: string; error?: string }> {
  const apiKey = request.headers.get('X-API-Key')
  if (!apiKey?.startsWith('mk_')) return { valid: false, error: 'Invalid X-API-Key' }

  try {
    const url = `${env.SUPABASE_URL}/rest/v1/raas_licenses?api_key=eq.${apiKey}&select=org_id,status`
    const response = await fetch(url, { headers: { 'apikey': env.SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } })
    if (!response.ok) return { valid: false, error: 'Auth failed' }

    const data = await response.json() as any[]
    if (data.length === 0 || data[0].status !== 'active') return { valid: false, error: 'License inactive' }

    return { valid: true, orgId: data[0].org_id }
  } catch {
    return { valid: false, error: 'Auth error' }
  }
}

async function sendWebhookAlert(payload: AlertWebhookPayload, webhookUrl: string): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    return response.ok
  } catch { return false }
}

async function storeAlertInR2(_alert: AnomalyAlert, _r2Bucket: R2Bucket): Promise<void> {
  // TODO: Implement R2 storage
}

async function insertAlertToSupabase(alert: AnomalyAlert, url: string, key: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/rest/v1/anomaly_alerts`, {
      method: 'POST',
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: alert.org_id, alert_type: alert.alert_type, alert_level: alert.alert_level, metric_name: alert.metric_name, metric_value: alert.metric_value, threshold_value: alert.threshold_value, description: alert.description, z_score: alert.z_score }),
    })
    return response.ok
  } catch { return false }
}

export default {
  async scheduled(_event: ScheduledEvent, env: WorkerEnv, _ctx: ExecutionContext): Promise<void> {
    try {
      const url = `${env.SUPABASE_URL}/rest/v1/raas_licenses?select=org_id&status=eq.active`
      const response = await fetch(url, { headers: { 'apikey': env.SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } })
      if (!response.ok) return

      const orgs = (await response.json()) as { org_id: string }[]
      const detector = new AnomalyDetectorCore(env.USAGE_KV, env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

      for (const org of orgs.slice(0, 100)) {
        const results = await detector.detectAllMetrics(org.org_id, ['api_calls', 'ai_calls', 'tokens'], '1h')
        for (const result of results) {
          const alert: AnomalyAlert = {
            id: crypto.randomUUID(), org_id: result.orgId, alert_type: result.currentValue > result.expectedValue ? 'usage_spike' : 'usage_drop',
            alert_level: result.severity, metric_name: result.metricType, metric_value: result.currentValue, threshold_value: result.expectedValue,
            description: result.alertPayload.description, z_score: result.zScore, acknowledged: false, created_at: new Date().toISOString(),
          }
          await insertAlertToSupabase(alert, env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
          await storeAlertInR2(alert, env.ALERTS_R2)
          if (result.severity === 'critical' || result.severity === 'warning') {
            const payload: AlertWebhookPayload = {
              event_type: 'anomaly_detected', timestamp: result.timestamp, org_id: result.orgId, project_id: result.orgId,
              metric_type: result.metricType, deviation_severity: result.severity, raw_value: result.currentValue,
              expected_value: result.expectedValue, z_score: result.zScore, description: result.alertPayload.description,
            }
            await sendWebhookAlert(payload, env.WEBHOOK_URL)
          }
        }
      }
    } catch (e) {
      // Log error but don't fail
      void e
    }
  },

  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url)
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() })
    if (url.pathname === '/health') return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })

    const auth = await verifyAuth(request, env)
    if (!auth.valid) return new Response(JSON.stringify({ error: auth.error }), { status: 401, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })

    if (url.pathname === '/anomaly/detect' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const detector = new AnomalyDetectorCore(env.USAGE_KV, env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
      const results = await detector.detectAllMetrics(auth.orgId!, body.metrics || ['api_calls', 'ai_calls', 'tokens'], body.window || '1h')

      const alerts: AnomalyAlert[] = results.map(r => ({
        id: crypto.randomUUID(), org_id: r.orgId, alert_type: r.currentValue > r.expectedValue ? 'usage_spike' : 'usage_drop',
        alert_level: r.severity, metric_name: r.metricType, metric_value: r.currentValue, threshold_value: r.expectedValue,
        description: r.alertPayload.description, z_score: r.zScore, acknowledged: false, created_at: new Date().toISOString(),
      }))

      for (const alert of alerts) {
        await insertAlertToSupabase(alert, env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
        await storeAlertInR2(alert, env.ALERTS_R2)
      }

      return new Response(JSON.stringify({ detected: alerts.length, alerts: alerts.map(a => ({ id: a.id, alert_level: a.alert_level, metric_name: a.metric_name, description: a.description })) }), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
    }

    if (url.pathname === '/anomaly' && request.method === 'GET') {
      const limit = url.searchParams.get('limit') || '20'
      const unackOnly = url.searchParams.get('unacknowledged') === 'true'
      let query = `${env.SUPABASE_URL}/rest/v1/anomaly_alerts?select=*&org_id=eq.${auth.orgId}&order=created_at.desc&limit=${limit}`
      if (unackOnly) query += '&acknowledged=is.false'

      const response = await fetch(query, { headers: { 'apikey': env.SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } })
      if (!response.ok) return new Response(JSON.stringify({ error: 'fetch_failed' }), { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })

      return new Response(JSON.stringify({ alerts: await response.json() }), { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
  },
}