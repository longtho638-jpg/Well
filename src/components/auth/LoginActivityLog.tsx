/**
 * Login Activity Log Component
 * Phase 1: Auth Max Level
 *
 * Shows recent login attempts for security awareness:
 * - Time, device, location, status
 * - Failed attempts highlighted
 * - Exportable for security audits
 */

import { motion } from 'framer-motion';
import {
  Clock,
  Monitor,
  Smartphone,
  MapPin,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { useTranslation } from '@/hooks';
import {
  useLoginActivityFilterAndFormatter,
  formatLoginTimestamp,
  LoginAttempt,
} from './use-login-activity-filter-and-formatter';
import {
  MOCK_LOGIN_ATTEMPTS,
  StatusBadge,
} from './login-activity-log-mock-data-and-status-badge';

export type { LoginAttempt };

interface LoginActivityLogProps {
  attempts?: LoginAttempt[];
  onExport?: () => void;
}

export function LoginActivityLog({
  attempts = import.meta.env.DEV ? MOCK_LOGIN_ATTEMPTS : [],
  onExport,
}: LoginActivityLogProps) {
  const { t } = useTranslation();
  const { filter, setFilter, filteredAttempts, failedCount } =
    useLoginActivityFilterAndFormatter(attempts);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-zinc-100">{t('loginactivitylog.login_activity')}</h3>
          <p className="text-sm text-zinc-500">{t('loginactivitylog.recent_sign_in_attempts_to_you')}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-900 rounded-lg p-1">
            {(['all', 'success', 'failed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filter === f ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {f === 'all' ? 'All' : f === 'success' ? 'Successful' : 'Failed'}
                {f === 'failed' && failedCount > 0 && (
                  <span className="ml-1 text-red-400">({failedCount})</span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={onExport}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
            title="Export activity log"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Failed Attempts Warning */}
      {failedCount > 0 && filter !== 'success' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-red-200 font-medium">
                {failedCount} {t('loginactivitylog.failed_login_attempt')}{failedCount !== 1 ? 's' : ''} {t('loginactivitylog.detected')}
              </p>
              <p className="text-zinc-400 mt-1">{t('loginactivitylog.if_you_don_t_recognize_these_a')}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Activity List */}
      <div className="border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-900/50 border-b border-zinc-800">
            <tr>
              {[
                t('loginactivitylog.time'),
                t('loginactivitylog.device'),
                t('loginactivitylog.location'),
                t('loginactivitylog.status'),
              ].map((heading) => (
                <th key={heading} className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filteredAttempts.map((attempt, index) => (
              <motion.tr
                key={attempt.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`${attempt.status !== 'success' ? 'bg-red-500/5' : ''} hover:bg-zinc-900/50 transition-colors`}
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-300">{formatLoginTimestamp(attempt.timestamp)}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 text-sm">
                    {attempt.device === 'mobile'
                      ? <Smartphone className="w-4 h-4 text-zinc-500" />
                      : <Monitor className="w-4 h-4 text-zinc-500" />}
                    <span className="text-zinc-300">{attempt.browser}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-300">{attempt.location}</span>
                    <span className="text-zinc-600">({attempt.ip})</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-1">
                    <StatusBadge status={attempt.status} />
                    {attempt.failReason && (
                      <span className="text-xs text-zinc-500">{attempt.failReason}</span>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {filteredAttempts.length === 0 && (
          <div className="px-4 py-8 text-center text-zinc-500">
            {t('loginactivitylog.no_login_attempts_found')}
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginActivityLog;
