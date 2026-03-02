/**
 * AgentToolCallCard - Displays a single AGI tool call with inputs/outputs
 *
 * Shows tool name, args, result, and status indicator.
 * Expandable JSON view. Aura Elite dark glassmorphism design.
 */

import React, { useState } from 'react';
import { Search, ShoppingCart, Award, DollarSign, Wrench, ChevronDown, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks';

export interface ToolCallData {
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: 'loading' | 'success' | 'error';
}

const TOOL_ICONS: Record<string, React.ElementType> = {
  search: Search,
  order: ShoppingCart,
  rank: Award,
  commission: DollarSign,
};

function getToolIcon(name: string): React.ElementType {
  const key = Object.keys(TOOL_ICONS).find(k => name.toLowerCase().includes(k));
  return key ? TOOL_ICONS[key] : Wrench;
}

const STATUS_CONFIG = {
  loading: {
    icon: Loader2,
    colorClass: 'text-blue-400',
    animate: true,
    labelKey: 'running' as const,
  },
  success: {
    icon: CheckCircle,
    colorClass: 'text-emerald-400',
    animate: false,
    labelKey: 'done' as const,
  },
  error: {
    icon: XCircle,
    colorClass: 'text-red-400',
    animate: false,
    labelKey: 'error' as const,
  },
} as const;

interface AgentToolCallCardProps {
  toolCall: ToolCallData;
}

export const AgentToolCallCard: React.FC<AgentToolCallCardProps> = ({ toolCall }) => {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();

  const ToolIcon = getToolIcon(toolCall.name);
  const statusCfg = STATUS_CONFIG[toolCall.status];
  const StatusIcon = statusCfg.icon;
  const hasDetails = Object.keys(toolCall.args).length > 0 || toolCall.result !== undefined;

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-blue-500/20 rounded-xl p-3 mb-2">
      <button
        type="button"
        className={`flex items-center gap-3 w-full text-left ${hasDetails ? 'cursor-pointer' : ''}`}
        onClick={hasDetails ? () => setExpanded(v => !v) : undefined}
        tabIndex={hasDetails ? 0 : -1}
      >
        {/* Tool icon */}
        <div className="flex-shrink-0 w-7 h-7 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
          <ToolIcon size={13} className="text-blue-400" />
        </div>

        {/* Tool name */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black uppercase tracking-widest text-blue-300 italic truncate">
            {toolCall.name}
          </p>
          <p className={`text-[9px] font-bold uppercase tracking-widest italic ${statusCfg.colorClass}`}>
            {t(`agent.toolcall.${statusCfg.labelKey}`)}
          </p>
        </div>

        {/* Status icon */}
        <StatusIcon
          size={14}
          className={`flex-shrink-0 ${statusCfg.colorClass} ${statusCfg.animate ? 'animate-spin' : ''}`}
        />

        {/* Expand chevron */}
        {hasDetails && (
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 text-zinc-500"
          >
            <ChevronDown size={12} />
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {expanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
              {Object.keys(toolCall.args).length > 0 && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1 italic">
                    {t('agent.toolcall.inputs')}
                  </p>
                  <pre className="text-[10px] text-zinc-400 bg-black/30 rounded-lg p-2 overflow-x-auto font-mono leading-relaxed">
                    {JSON.stringify(toolCall.args, null, 2)}
                  </pre>
                </div>
              )}
              {toolCall.result !== undefined && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1 italic">
                    {t('agent.toolcall.output')}
                  </p>
                  <pre className="text-[10px] text-zinc-400 bg-black/30 rounded-lg p-2 overflow-x-auto font-mono leading-relaxed">
                    {JSON.stringify(toolCall.result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
