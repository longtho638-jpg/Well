import { useEffect, useState } from 'react';
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
      console.log('App ready to work offline');
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
