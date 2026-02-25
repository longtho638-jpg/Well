/**
 * Health Check Consultation CTA Component
 * Expert consultation call-to-action section
 * Features:
 * - Animated message icon
 * - Zalo chat integration
 * - Gradient background with glassmorphism
 * - Hover animations on CTA button
 */

import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface Props {
  onZaloChat: () => void;
}

export default function HealthCheckConsultationCta({
  onZaloChat,
}: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.8 }}
      className="glass-ultra rounded-3xl shadow-2xl overflow-hidden relative"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/50 to-pink-900/50" />

      <div className="relative p-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6 text-white">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 bg-white/10 backdrop-blur-2xl rounded-3xl flex items-center justify-center shadow-2xl border border-white/20"
            >
              <MessageCircle className="w-10 h-10" />
            </motion.div>
            <div>
              <h3 className="text-3xl font-bold mb-2">
                {t('healthCheck.consultationTitle')}
              </h3>
              <p className="text-white/80 text-lg">
                {t('healthCheck.consultationDescription')}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onZaloChat}
            className="bg-white text-purple-600 px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all duration-300 flex items-center gap-3 whitespace-nowrap group"
          >
            <MessageCircle className="w-7 h-7 group-hover:rotate-12 transition-transform" />
            {t('healthCheck.chatNow')}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
