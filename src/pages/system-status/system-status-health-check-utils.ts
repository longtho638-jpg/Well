/**
 * system-status-health-check-utils — async health check functions for Supabase, localStorage, and network connectivity
 */

import { createLogger } from '@/utils/logger';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const statusLogger = createLogger('SystemStatus');

export type CheckStatus = 'checking' | 'healthy' | 'degraded' | 'down';

export interface HealthCheckItem {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  latency?: number;
}

export async function checkSupabase(): Promise<Pick<HealthCheckItem, 'status' | 'detail' | 'latency'>> {
  if (!isSupabaseConfigured()) {
    return { status: 'degraded', detail: 'Supabase not configured (using mock data)' };
  }

  const start = performance.now();
  try {
    const { error } = await supabase.auth.getSession();
    const latency = Math.round(performance.now() - start);

    if (error) {
      statusLogger.warn('Supabase auth check returned error', { error: error.message });
      return { status: 'degraded', detail: error.message, latency };
    }

    statusLogger.info('Supabase connection healthy', { latency });
    return { status: 'healthy', detail: `Connected (${latency}ms)`, latency };
  } catch (err) {
    const latency = Math.round(performance.now() - start);
    const message = err instanceof Error ? err.message : 'Unknown error';
    statusLogger.error('Supabase connection failed', { error: message });
    return { status: 'down', detail: message, latency };
  }
}

export function checkLocalStorage(): Pick<HealthCheckItem, 'status' | 'detail'> {
  try {
    const testKey = '__well_health_check__';
    localStorage.setItem(testKey, '1');
    const value = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);

    if (value !== '1') {
      statusLogger.warn('LocalStorage read/write mismatch');
      return { status: 'degraded', detail: 'Read/write mismatch' };
    }

    const usedKeys = Object.keys(localStorage).length;
    statusLogger.info('LocalStorage healthy', { usedKeys });
    return { status: 'healthy', detail: `Available (${usedKeys} keys stored)` };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    statusLogger.error('LocalStorage unavailable', { error: message });
    return { status: 'down', detail: message };
  }
}

export function checkNetwork(): Pick<HealthCheckItem, 'status' | 'detail'> {
  const online = navigator.onLine;
  if (online) {
    statusLogger.info('Network online');
    return { status: 'healthy', detail: 'Online' };
  }
  statusLogger.warn('Network offline');
  return { status: 'down', detail: 'Offline' };
}

export function deriveOverallStatus(checks: HealthCheckItem[]): CheckStatus {
  if (checks.some(c => c.status === 'down')) return 'down';
  if (checks.some(c => c.status === 'degraded')) return 'degraded';
  if (checks.every(c => c.status === 'healthy')) return 'healthy';
  return 'checking';
}
