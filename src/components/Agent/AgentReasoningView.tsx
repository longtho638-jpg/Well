/**
 * AgentReasoningView - Displays AGI Thought → Action → Observation chain
 *
 * Shows the ReAct loop steps with collapsible animation (Framer Motion).
 * Aura Elite dark glassmorphism design.
 */

import React, { useState } from 'react';
import { Brain, Zap, Eye, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ReasoningStep {
  type: 'thought' | 'action' | 'observation';
  content: string;
  toolCall?: {
    name: string;
    args: Record<string, unknown>;
    result?: unknown;
  };
}

interface StepConfig {
  icon: React.ElementType;
  label: string;
  colorClass: string;
  borderClass: string;
  bgClass: string;
}

const STEP_CONFIG: Record<ReasoningStep['type'], StepConfig> = {
  thought: {
    icon: Brain,
    label: 'Thought',
    colorClass: 'text-purple-300',
    borderClass: 'border-purple-500/20',
    bgClass: 'bg-purple-500/10',
  },
  action: {
    icon: Zap,
    label: 'Action',
    colorClass: 'text-blue-300',
    borderClass: 'border-blue-500/20',
    bgClass: 'bg-blue-500/10',
  },
  observation: {
    icon: Eye,
    label: 'Observation',
    colorClass: 'text-emerald-300',
    borderClass: 'border-emerald-500/20',
    bgClass: 'bg-emerald-500/10',
  },
};

interface StepItemProps {
  step: ReasoningStep;
  index: number;
}

const StepItem: React.FC<StepItemProps> = ({ step, index }) => {
  const [expanded, setExpanded] = useState(false);
  const config = STEP_CONFIG[step.type];
  const Icon = config.icon;
  const hasToolCall = !!step.toolCall;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      className={`rounded-lg p-3 mb-2 border ${config.borderClass} ${config.bgClass}`}
    >
      <button
        type="button"
        className={`flex items-start gap-2 w-full text-left ${hasToolCall ? 'cursor-pointer' : ''}`}
        onClick={hasToolCall ? () => setExpanded(v => !v) : undefined}
        tabIndex={hasToolCall ? 0 : -1}
      >
        <div className={`flex-shrink-0 mt-0.5 ${config.colorClass}`}>
          <Icon size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <span className={`text-[10px] font-black uppercase tracking-widest italic ${config.colorClass} mr-2`}>
            {config.label}
          </span>
          <p className="text-xs text-zinc-300 leading-relaxed mt-0.5 break-words">
            {step.content}
          </p>
        </div>
        {hasToolCall && (
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
        {expanded && step.toolCall && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 pt-2 border-t border-white/5">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1 italic">
                Tool: {step.toolCall.name}
              </p>
              <pre className="text-[10px] text-zinc-400 bg-black/30 rounded p-2 overflow-x-auto font-mono leading-relaxed">
                {JSON.stringify(step.toolCall.args, null, 2)}
              </pre>
              {step.toolCall.result !== undefined && (
                <>
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mt-2 mb-1 italic">
                    Result
                  </p>
                  <pre className="text-[10px] text-zinc-400 bg-black/30 rounded p-2 overflow-x-auto font-mono leading-relaxed">
                    {JSON.stringify(step.toolCall.result, null, 2)}
                  </pre>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface AgentReasoningViewProps {
  steps: ReasoningStep[];
}

export const AgentReasoningView: React.FC<AgentReasoningViewProps> = ({ steps }) => {
  if (steps.length === 0) return null;

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 mt-3">
      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 italic mb-3">
        AGI Reasoning Chain
      </p>
      <AnimatePresence initial={false}>
        {steps.map((step, i) => (
          <StepItem key={i} step={step} index={i} />
        ))}
      </AnimatePresence>
    </div>
  );
};
