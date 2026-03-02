/**
 * Overview Animated Metric Cards — Counter animation + MetricCard display for admin dashboard stats
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

export const Counter: React.FC<{ value: number; format?: (val: number) => string }> = ({ value, format }) => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <>{format ? format(count) : count}</>;
};

interface MetricCardProps {
  label: string;
  value: string;
  numericValue?: number;
  trend: string;
  icon: React.ElementType;
  color: string;
  index: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  numericValue,
  trend,
  icon: Icon,
  color,
  index,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1, duration: 0.5 }}
    whileHover={{ y: -8, scale: 1.02 }}
    className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group"
  >
    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
      <Icon size={120} />
    </div>
    <div className="relative z-10 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-2xl border ${color}`}>
          <Icon size={20} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{label}</span>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">
          {numericValue !== undefined
            ? <Counter value={numericValue} format={(val) => value.replace(/[\d,.]+/, val.toLocaleString('vi-VN'))} />
            : value}
        </p>
        <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
          <TrendingUp size={12} />
          {trend}
        </div>
      </div>
    </div>
  </motion.div>
);
