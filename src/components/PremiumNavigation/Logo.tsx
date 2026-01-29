import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks';

/**
 * Premium Logo Component
 * Animated logo with gradient and glow effect
 */
export default function Logo() {
  const { t } = useTranslation();

  return (
    <Link to="/" className="flex items-center gap-3 group">
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 via-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-shadow">
          W
        </div>
        {/* Subtle glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
      </motion.div>
      <div className="hidden sm:block">
        <div className="font-bold text-xl text-white tracking-tight">{t('premiumnavigation.wellnexus')}</div>
        <div className="text-[10px] text-emerald-400/80 font-medium tracking-widest uppercase">{t('premiumnavigation.social_commerce_2_0')}</div>
      </div>
    </Link>
  );
}
