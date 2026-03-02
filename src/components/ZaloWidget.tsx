import React from 'react';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks';

const ZALO_OA_URL = import.meta.env.VITE_ZALO_OA_URL as string | undefined;

/**
 * ZaloWidget - Floating Zalo contact button
 * Only renders when VITE_ZALO_OA_URL is configured
 */
export const ZaloWidget: React.FC = () => {
  const { t } = useTranslation();

  if (!ZALO_OA_URL) return null;

  const handleZaloClick = () => {
    window.open(ZALO_OA_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.button
      onClick={handleZaloClick}
      aria-label={t('common.chatViaZalo')}
      className="fixed bottom-24 right-4 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 ring-4 ring-blue-400/30 animate-pulse hover:animate-none hover:ring-blue-500/50"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
    >
      <MessageCircle className="w-6 h-6" />
    </motion.button>
  );
};
