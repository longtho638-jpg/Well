import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);

  const {
    updateServiceWorker,
  } = useRegisterSW({
    onNeedRefresh() {
      setNeedRefresh(true);
    },
    onOfflineReady() {
      // App ready to work offline
    },
  });

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  return {
    needRefresh,
    handleUpdate,
  };
}
