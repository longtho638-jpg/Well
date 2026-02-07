import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks';

/**
 * ExitIntentPopup - Shows promotional modal on exit intent
 * Phase 9: LCCO (Low Cost Conversion Optimization)
 *
 * Features:
 * - Desktop: Detects mouse leaving viewport from top
 * - Mobile: Detects rapid scroll-up near page top
 * - Shows only once per session (sessionStorage)
 * - Accessible: role="dialog", aria-label, focus trap, Escape key
 * - i18n: All strings via translation keys
 * - Aura Elite glassmorphism design
 */

const STORAGE_KEY = 'exit-intent-shown';
const DELAY_MS = 5000;
const MOBILE_SCROLL_THRESHOLD = 100;

export const ExitIntentPopup: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  const triggerPopup = useCallback(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    setShowPopup(true);
    sessionStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    // Desktop: mouse leaves from top
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) triggerPopup();
    };

    // Mobile: rapid scroll-up near page top
    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = lastScrollY.current - currentY;
      if (currentY < MOBILE_SCROLL_THRESHOLD && delta > 50) {
        triggerPopup();
      }
      lastScrollY.current = currentY;
    };

    const isTouchDevice = 'ontouchstart' in window;
    const timer = setTimeout(() => {
      if (isTouchDevice) {
        window.addEventListener('scroll', handleScroll, { passive: true });
      } else {
        document.addEventListener('mouseleave', handleMouseLeave);
      }
    }, DELAY_MS);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [triggerPopup]);

  // Focus trap & Escape key
  useEffect(() => {
    if (!showPopup) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPopup(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showPopup]);

  const handleRegister = () => {
    setShowPopup(false);
    navigate('/venture');
  };

  const handleClose = () => setShowPopup(false);

  const benefits = [
    t('exitIntent.benefits.aiCoaching'),
    t('exitIntent.benefits.passiveIncome'),
    t('exitIntent.benefits.zeroRisk'),
    t('exitIntent.benefits.premiumProducts'),
  ];

  return (
    <AnimatePresence>
      {showPopup && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('exitIntent.headline')}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md mx-4 outline-none"
          >
            <div className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-emerald-500/20 rounded-2xl shadow-2xl overflow-hidden">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10 pointer-events-none" />

              {/* Close button */}
              <button
                onClick={handleClose}
                aria-label={t('exitIntent.closeLabel')}
                className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="relative p-8 text-center">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full"
                >
                  <Sparkles className="w-8 h-8 text-white" />
                </motion.div>

                {/* Headline */}
                <h3 className="text-2xl font-bold text-white mb-3">
                  {t('exitIntent.headline')}
                </h3>

                {/* Subheadline */}
                <p className="text-slate-300 mb-6">
                  {t('exitIntent.subheadline')}
                </p>

                {/* Benefits list */}
                <div className="space-y-2 mb-8 text-left">
                  {benefits.map((benefit, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                      className="flex items-center gap-2 text-sm text-slate-300"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      {benefit}
                    </motion.div>
                  ))}
                </div>

                {/* CTA Button */}
                <motion.button
                  onClick={handleRegister}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  {t('exitIntent.cta')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>

                {/* Urgency text */}
                <p className="mt-3 text-xs text-slate-400">
                  {t('exitIntent.urgency')}
                </p>

                {/* No thanks link */}
                <button
                  onClick={handleClose}
                  className="mt-2 text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors"
                >
                  {t('exitIntent.noThanks')}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
