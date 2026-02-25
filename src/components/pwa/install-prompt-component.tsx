/**
 * Add-to-Home-Screen (A2HS) Install Prompt Component
 * Beautiful native-like install banner with Aura Elite glassmorphism design
 */

import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'wellnexus-a2hs-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if user dismissed recently
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const now = Date.now();
      if (now - dismissedTime < DISMISS_DURATION) {
        return; // Still within dismiss period
      } else {
        // Dismiss period expired, clear storage
        localStorage.removeItem(DISMISS_KEY);
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show install prompt
    await deferredPrompt.prompt();

    // Wait for user choice
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      // User accepted install prompt
    }

    // Clear prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    // Save dismiss timestamp
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
        >
          {/* Glassmorphism Card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 p-6 shadow-2xl backdrop-blur-xl">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-purple-500/10" />

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute right-3 top-3 rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Dismiss install prompt"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Content */}
            <div className="relative">
              {/* Icon */}
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                <Smartphone className="h-6 w-6 text-white" />
              </div>

              {/* Title */}
              <h3 className="mb-2 text-lg font-bold text-white">
                Install WellNexus
              </h3>

              {/* Description */}
              <p className="mb-4 text-sm text-slate-300">
                Add to your home screen for quick access and offline support. Get a native app experience!
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleInstall}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110 active:scale-95"
                >
                  <Download className="h-4 w-4" />
                  Install Now
                </button>
                <button
                  onClick={handleDismiss}
                  className="rounded-xl border border-white/20 px-4 py-3 font-medium text-white/80 transition-all hover:bg-white/10 hover:text-white active:scale-95"
                >
                  Maybe Later
                </button>
              </div>

              {/* Features List */}
              <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Works offline
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Fast loading
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                  Push notifications
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
