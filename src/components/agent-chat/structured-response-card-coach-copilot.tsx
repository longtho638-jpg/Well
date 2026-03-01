import { motion } from 'framer-motion';
import { Lightbulb, Zap, CheckCircle } from 'lucide-react';

interface StructuredResponseCardProps {
  type: 'coach' | 'copilot';
  data: Record<string, unknown>;
}

function ConfidenceMeter({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(1, value));
  const pct = Math.round(clamped * 100);
  const color = pct >= 70 ? 'bg-emerald-400' : pct >= 40 ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <div className="mt-3">
      <div className="flex justify-between text-[10px] text-gray-500 mb-1">
        <span>Confidence</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function CoachCard({ data }: { data: Record<string, unknown> }) {
  const advice = typeof data['advice'] === 'string' ? data['advice'] : '';
  const actions = Array.isArray(data['actions']) ? (data['actions'] as unknown[]) : [];
  const confidence = typeof data['confidence'] === 'number' ? data['confidence'] : 0.75;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
          Coach Advice
        </span>
      </div>

      {advice && (
        <p className="text-sm text-gray-200 leading-relaxed mb-3">{advice}</p>
      )}

      {actions.length > 0 && (
        <ul className="space-y-1.5">
          {actions.map((action, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{String(action)}</span>
            </li>
          ))}
        </ul>
      )}

      <ConfidenceMeter value={confidence} />
    </motion.div>
  );
}

function CopilotCard({ data }: { data: Record<string, unknown> }) {
  const suggestion = typeof data['suggestion'] === 'string' ? data['suggestion'] : '';
  const nextStep = typeof data['nextStep'] === 'string' ? data['nextStep'] : '';
  const products = Array.isArray(data['products']) ? (data['products'] as unknown[]) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">
          Copilot Suggestion
        </span>
      </div>

      {suggestion && (
        <p className="text-sm text-gray-200 leading-relaxed mb-3">{suggestion}</p>
      )}

      {nextStep && (
        <div className="flex items-start gap-2 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2 mb-3">
          <span className="text-[10px] font-semibold text-purple-400 uppercase mt-0.5 flex-shrink-0">
            Next
          </span>
          <span className="text-sm text-gray-300">{nextStep}</span>
        </div>
      )}

      {products.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">
            Recommended Products
          </p>
          <div className="flex flex-wrap gap-1.5">
            {products.map((p, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-md text-xs text-purple-300"
              >
                {String(p)}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function StructuredResponseCard({ type, data }: StructuredResponseCardProps) {
  if (type === 'coach') return <CoachCard data={data} />;
  return <CopilotCard data={data} />;
}
