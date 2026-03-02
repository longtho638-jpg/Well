/**
 * Health Check Radar Chart Component
 * Displays health dimensions in radar chart format
 * Features:
 * - Recharts radar chart visualization
 * - 4 health dimension cards (sleep, stress, energy, exercise)
 * - Animated progress bars
 * - Score-based color coding
 */

import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { useTranslation } from '@/hooks';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface HealthDimension {
  dimension: string;
  score: number;
  fullMark: number;
}

interface Props {
  healthDimensions: HealthDimension[];
  getScoreColor: (score: number) => string;
}

export default function HealthCheckRadarChart({
  healthDimensions,
  getScoreColor,
}: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="glass-ultra rounded-3xl shadow-2xl p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{t('healthcheck.ph_n_t_ch_chi_ti_t')}</h2>
          <p className="text-sm text-white/60">{t('healthcheck.i_m_s_t_ng_kh_a_c_nh_s_c_kh')}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={healthDimensions}>
          <PolarGrid stroke="#ffffff30" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#ffffff90', fontSize: 14, fontWeight: 600 }}
          />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#ffffff60' }} />
          <Radar
            name={t('healthCheck.radarTitle')}
            dataKey="score"
            stroke="#2dd4bf"
            fill="#2dd4bf"
            fillOpacity={0.5}
            strokeWidth={3}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              color: 'white'
            }}
          />
        </RadarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {healthDimensions.map((dim, idx) => (
          <motion.div
            key={dim.dimension}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 + idx * 0.1 }}
            className="bg-white/5 rounded-xl p-4 border border-white/10"
          >
            <p className="text-sm font-semibold text-white/80 mb-1">{dim.dimension}</p>
            <p className="text-3xl font-bold text-teal-400">{dim.score}</p>
            <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${dim.score}%` }}
                transition={{ delay: 1.2 + idx * 0.1, duration: 0.8 }}
                className={`h-full bg-gradient-to-r ${getScoreColor(dim.score)}`}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
