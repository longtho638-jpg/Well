import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstallable(false);
      setInstallPrompt(null);
    }
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
  };
}
