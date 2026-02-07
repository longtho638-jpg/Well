import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * ExitIntentPopup - Shows promotional modal on exit intent
 * Phase 9: LCCO (Low Cost Conversion Optimization)
 *
 * Features:
 * - Detects mouse leaving viewport
 * - Shows only once per session (localStorage)
 * - Smooth animations with framer-motion
 * - Aura Elite glassmorphism design
 */

const STORAGE_KEY = 'exit-intent-shown';

export const ExitIntentPopup: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already shown in this session
    const hasShown = sessionStorage.getItem(STORAGE_KEY);
    if (hasShown) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Trigger only when mouse leaves from top of viewport
      if (e.clientY <= 0 && !hasShown) {
        setShowPopup(true);
        sessionStorage.setItem(STORAGE_KEY, 'true');
      }
    };

    // Add listener after 3 seconds to avoid immediate trigger
    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 3000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleRegister = () => {
    setShowPopup(false);
    navigate('/venture');
  };

  const handleClose = () => {
    setShowPopup(false);
  };

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
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md mx-4"
          >
            <div className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-emerald-500/20 rounded-2xl shadow-2xl overflow-hidden">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10 pointer-events-none" />

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white transition-colors"
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
                  Wait! Don't Leave Yet
                </h3>

                {/* Subheadline */}
                <p className="text-slate-300 mb-6">
                  Unlock exclusive Pro benefits and join 1,243+ successful distributors building wealth with WellNexus
                </p>

                {/* Benefits list */}
                <div className="space-y-2 mb-8 text-left">
                  {[
                    'AI-powered business coaching',
                    'Passive income potential',
                    'Zero inventory risk',
                    'Premium product portfolio'
                  ].map((benefit, idx) => (
                    <motion.div
                      key={benefit}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                      className="flex items-center gap-2 text-sm text-slate-300"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
                  Register Now - Limited Slots
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>

                {/* Urgency text */}
                <p className="mt-4 text-xs text-slate-400">
                  Only 157 slots remaining in your area
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
