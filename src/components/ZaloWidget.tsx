import React from 'react';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * ZaloWidget - Floating Zalo contact button
 * Phase 7: Mobile Metamorphosis
 */
export const ZaloWidget: React.FC = () => {
  const handleZaloClick = () => {
    // Open Zalo chat - Replace with actual Zalo OA link
    window.open('https://zalo.me/your-zalo-oa', '_blank');
  };

  return (
    <motion.button
      onClick={handleZaloClick}
      className="fixed bottom-24 right-4 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 animate-pulse hover:animate-none"
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
