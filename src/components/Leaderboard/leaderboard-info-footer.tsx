/**
 * Leaderboard Info Footer Component
 * Information and last update footer
 * Features:
 * - Note about leaderboard updates
 * - Last update timestamp
 * - Glassmorphism design
 */

import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks';

export default function LeaderboardInfoFooter() {
  const { t, i18n } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="mt-6 text-center"
    >
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <p className="text-sm text-white/60">
          <span className="font-semibold text-white">{t('leaderboard.noteLabel')}</span> {t('leaderboard.noteText')}
        </p>
        <p className="text-xs text-white/40 mt-2">
          {t('leaderboard.lastUpdate', { time: new Date().toLocaleString(i18n.language) })}
        </p>
      </div>
    </motion.div>
  );
}
