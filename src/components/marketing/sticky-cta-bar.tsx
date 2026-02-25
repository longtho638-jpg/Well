/**
 * StickyCtaBar
 * CRO Phase 05: Sticky bottom CTA that appears after scrolling past hero
 * Mobile thumb-zone optimized
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks';

const SCROLL_THRESHOLD = 600;

export function StickyCtaBar() {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > SCROLL_THRESHOLD);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe"
        >
          <div className="bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/60 px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-400 truncate">{t('landing.stickyCta.label')}</p>
            </div>
            <button
              onClick={() => navigate('/venture')}
              className="shrink-0 flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/30"
            >
              {t('landing.stickyCta.cta')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
