import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { useTranslation } from 'react-i18next';

export function PWAInstallPrompt() {
  const { t } = useTranslation();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [pageViews, setPageViews] = useState(0);

  useEffect(() => {
    // Track page views
    const views = parseInt(localStorage.getItem('pwa-page-views') || '0');
    const newViews = views + 1;
    setPageViews(newViews);
    localStorage.setItem('pwa-page-views', newViews.toString());

    // Check if previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) setIsDismissed(true);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleInstall = async () => {
    await promptInstall();
    handleDismiss();
  };

  // Show after 2 page views, not installed, not dismissed
  const shouldShow = isInstallable && !isInstalled && !isDismissed && pageViews >= 2;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50"
        >
          <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="text-4xl">📱</div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {t('pwa.install.title')}
                </h3>
                <p className="text-sm text-gray-300 mb-4">
                  {t('pwa.install.description')}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={handleInstall}
                    className="px-4 py-2 text-sm font-medium rounded-lg text-white
                             bg-gradient-to-r from-indigo-500 to-purple-500
                             hover:from-indigo-600 hover:to-purple-600
                             transition-all shadow-lg shadow-indigo-500/20"
                  >
                    {t('pwa.install.install')}
                  </button>

                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2 text-sm font-medium text-gray-400
                             hover:text-white transition-colors"
                  >
                    {t('pwa.install.dismiss')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
