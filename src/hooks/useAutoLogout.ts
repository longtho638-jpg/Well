import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useStore } from '@/store';
import { authLogger } from '@/utils/logger';
import { createAutoLogoutController } from '@/lib/vibe-auth';

export function useAutoLogout() {
  const { signOut } = useAuth();
  const { isAuthenticated } = useStore();
  const controllerRef = useRef<ReturnType<typeof createAutoLogoutController> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const controller = createAutoLogoutController(
      () => {
        authLogger.warn('User inactive for 30 minutes, logging out');
        signOut().then(() => {
          window.location.href = '/login?reason=timeout';
        });
      },
      { inactivityLimitMs: 30 * 60 * 1000, checkIntervalMs: 60 * 1000 },
    );

    controllerRef.current = controller;
    controller.start();

    return () => controller.stop();
  }, [isAuthenticated, signOut]);
}
