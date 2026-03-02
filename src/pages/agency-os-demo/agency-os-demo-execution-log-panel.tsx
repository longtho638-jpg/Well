/**
 * agency-os-demo-execution-log-panel — command execution log panel and shared category display constants for AgencyOSDemo page
 */

import React from 'react';
import { Clock, Command } from 'lucide-react';
import { useTranslation } from '@/hooks';
import type { AgencyOSCategory } from '@/agents/custom/AgencyOSAgent';

export const CATEGORY_COLORS: Record<AgencyOSCategory, string> = {
  marketing: 'from-pink-500 to-rose-500',
  sales: 'from-blue-500 to-cyan-500',
  finance: 'from-green-500 to-emerald-500',
  operations: 'from-purple-500 to-violet-500',
  strategy: 'from-orange-500 to-amber-500',
  agents: 'from-indigo-500 to-blue-500',
};

export const CATEGORY_ICONS: Record<AgencyOSCategory, string> = {
  marketing: '📣',
  sales: '💼',
  finance: '💰',
  operations: '⚙️',
  strategy: '🎯',
  agents: '🤖',
};

interface ExecutionLogEntry {
  command: string;
  result: {
    success: boolean;
    message?: string;
    output?: string;
    error?: string;
  };
  timestamp: string;
}

interface AgencyOSDemoExecutionLogPanelProps {
  executionLog: ExecutionLogEntry[];
}

export const AgencyOSDemoExecutionLogPanel: React.FC<AgencyOSDemoExecutionLogPanelProps> = ({
  executionLog,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-purple-400" />
        {t('agencyosdemo.execution_history')}
      </h2>

      {executionLog.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Command className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t('agencyosdemo.no_commands_executed_yet_clic')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {executionLog.map((log, idx) => (
            <div
              key={idx}
              className="bg-gray-700/30 rounded-lg p-4 border border-gray-600"
            >
              <div className="flex items-center justify-between mb-2">
                <code className="text-cyan-400 font-mono text-sm">{log.command}</code>
                <span className="text-xs text-gray-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              {log.result.success ? (
                <div className="text-green-400 text-sm">
                  <p className="font-medium">✅ {log.result.message}</p>
                  <p className="text-gray-400 mt-1">{log.result.output}</p>
                </div>
              ) : (
                <div className="text-red-400 text-sm">
                  ❌ {log.result.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
