/**
 * Health Check Results Hero Component
 * Displays overall health score with animated score display
 * Features:
 * - Large animated score card
 * - Score label and description
 * - Glassmorphism design with gradient background
 * - Award icon with decorative elements
 */

import { motion } from 'framer-motion';
import { Award, Sparkles } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface Props {
  healthScore: number;
  getScoreLabel: (score: number) => string;
  getScoreDescription: (score: number) => string;
}

export default function HealthCheckResultsHero({
  healthScore,
  getScoreLabel,
  getScoreDescription,
}: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-ultra rounded-3xl shadow-2xl overflow-hidden relative"
    >
      {/* Decorative Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-blue-600/20 to-purple-600/20" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

      <div className="relative p-12 text-white">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between"
        >
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl border border-white/20">
                <Award className="w-10 h-10 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">{t('healthCheck.resultsTitle')}</h1>
                <p className="text-white/60 text-lg">{t('healthCheck.yourHealthScore')}</p>
              </div>
            </div>
          </div>

          {/* Score Display */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.4 }}
            className="w-48 h-48 bg-white/10 backdrop-blur-2xl rounded-3xl flex items-center justify-center shadow-2xl border-4 border-white/20"
          >
            <div className="text-center">
              <motion.p
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
                className="text-7xl font-bold text-white drop-shadow-lg"
              >
                {healthScore}
              </motion.p>
              <p className="text-white/80 text-xl font-semibold opacity-90">{t('healthcheck.100')}</p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6"
        >
          <div className="inline-block bg-white/10 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20">
            <p className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              {getScoreLabel(healthScore)}
            </p>
          </div>
          <p className="text-white/80 mt-4 text-lg max-w-2xl">
            {getScoreDescription(healthScore)}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
