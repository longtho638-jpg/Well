import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createLogger } from '@/utils/logger';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const statusLogger = createLogger('SystemStatus');

type CheckStatus = 'checking' | 'healthy' | 'degraded' | 'down';

interface HealthCheckItem {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  latency?: number;
}

function StatusDot({ status }: { status: CheckStatus }) {
  const colorMap: Record<CheckStatus, string> = {
    checking: 'bg-zinc-400 animate-pulse',
    healthy: 'bg-emerald-400 shadow-emerald-400/50 shadow-lg',
    degraded: 'bg-amber-400 shadow-amber-400/50 shadow-lg',
    down: 'bg-red-400 shadow-red-400/50 shadow-lg',
  };

  return <span className={`inline-block w-3 h-3 rounded-full ${colorMap[status]}`} />;
}

function StatusLabel({ status }: { status: CheckStatus }) {
  const labelMap: Record<CheckStatus, { text: string; color: string }> = {
    checking: { text: 'Checking...', color: 'text-zinc-400' },
    healthy: { text: 'Healthy', color: 'text-emerald-400' },
    degraded: { text: 'Degraded', color: 'text-amber-400' },
    down: { text: 'Down', color: 'text-red-400' },
  };

  const item = labelMap[status];
  return <span className={`text-xs font-semibold uppercase tracking-wider ${item.color}`}>{item.text}</span>;
}

async function checkSupabase(): Promise<Pick<HealthCheckItem, 'status' | 'detail' | 'latency'>> {
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

function checkLocalStorage(): Pick<HealthCheckItem, 'status' | 'detail'> {
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

function checkNetwork(): Pick<HealthCheckItem, 'status' | 'detail'> {
  const online = navigator.onLine;
  if (online) {
    statusLogger.info('Network online');
    return { status: 'healthy', detail: 'Online' };
  }
  statusLogger.warn('Network offline');
  return { status: 'down', detail: 'Offline' };
}

export default function SystemStatus() {
  const navigate = useNavigate();
  const [checks, setChecks] = useState<HealthCheckItem[]>([
    { id: 'supabase', label: 'Supabase API', status: 'checking', detail: 'Connecting...' },
    { id: 'localstorage', label: 'Local Storage', status: 'checking', detail: 'Checking...' },
    { id: 'network', label: 'Network', status: 'checking', detail: 'Checking...' },
  ]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const runChecks = useCallback(async () => {
    statusLogger.info('Running system health checks');

    // Reset all to checking
    setChecks(prev => prev.map(c => ({ ...c, status: 'checking' as const, detail: 'Checking...' })));

    // Run sync checks immediately
    const lsResult = checkLocalStorage();
    const netResult = checkNetwork();

    setChecks(prev =>
      prev.map(c => {
        if (c.id === 'localstorage') return { ...c, ...lsResult };
        if (c.id === 'network') return { ...c, ...netResult };
        return c;
      })
    );

    // Run async checks
    const supaResult = await checkSupabase();
    setChecks(prev =>
      prev.map(c => (c.id === 'supabase' ? { ...c, ...supaResult } : c))
    );

    setLastChecked(new Date());
    statusLogger.info('Health checks complete');
  }, []);

  useEffect(() => {
    runChecks();

    const handleOnline = () => {
      setChecks(prev =>
        prev.map(c => (c.id === 'network' ? { ...c, status: 'healthy', detail: 'Online' } : c))
      );
    };
    const handleOffline = () => {
      setChecks(prev =>
        prev.map(c => (c.id === 'network' ? { ...c, status: 'down', detail: 'Offline' } : c))
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [runChecks]);

  const overallStatus: CheckStatus = checks.some(c => c.status === 'down')
    ? 'down'
    : checks.some(c => c.status === 'degraded')
      ? 'degraded'
      : checks.every(c => c.status === 'healthy')
        ? 'healthy'
        : 'checking';

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-6">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white font-display">System Status</h1>
            <p className="text-zinc-500 text-sm">
              {lastChecked
                ? `Last checked: ${lastChecked.toLocaleTimeString()}`
                : 'Running checks...'}
            </p>
          </div>
        </motion.div>

        {/* Overall status card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusDot status={overallStatus} />
              <div>
                <h2 className="text-lg font-semibold text-white">Overall Health</h2>
                <StatusLabel status={overallStatus} />
              </div>
            </div>
            <button
              onClick={runChecks}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm rounded-xl font-medium hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20"
            >
              Re-check
            </button>
          </div>
        </motion.div>

        {/* Individual checks */}
        <div className="space-y-3">
          {checks.map((check, i) => (
            <motion.div
              key={check.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <StatusDot status={check.status} />
                <div>
                  <h3 className="text-white font-medium text-sm">{check.label}</h3>
                  <p className="text-zinc-500 text-xs mt-0.5">{check.detail}</p>
                </div>
              </div>
              <StatusLabel status={check.status} />
            </motion.div>
          ))}
        </div>

        {/* Build info footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center text-zinc-600 text-xs space-y-1"
        >
          <p>WellNexus v{import.meta.env.VITE_APP_VERSION || '1.0.0'}</p>
          <p>Environment: {import.meta.env.MODE}</p>
        </motion.div>
      </div>
    </div>
  );
}
