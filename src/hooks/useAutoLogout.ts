import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useStore } from '@/store';
import { authLogger } from '@/utils/logger';

// 30 minutes in milliseconds
const INACTIVITY_LIMIT = 30 * 60 * 1000;
// Check interval
const CHECK_INTERVAL = 60 * 1000;

export function useAutoLogout() {
  const { signOut } = useAuth();
  const { isAuthenticated } = useStore();
  const lastActivityRef = useRef<number>(Date.now());

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const checkInactivity = useCallback(() => {
    if (!isAuthenticated) return;

    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;

    if (timeSinceLastActivity >= INACTIVITY_LIMIT) {
      authLogger.warn('User inactive for 30 minutes, logging out');
      signOut().then(() => {
        window.location.href = '/login?reason=timeout';
      });
    }
  }, [isAuthenticated, signOut]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial activity timestamp
    lastActivityRef.current = Date.now();

    // Events to track
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

    // Throttled event handler
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const handleActivity = () => {
      if (!timeoutId) {
        updateActivity();
        timeoutId = setTimeout(() => {
          timeoutId = undefined;
        }, 1000); // Throttle updates to once per second
      }
    };

    // Attach listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Setup interval check
    const intervalId = setInterval(checkInactivity, CHECK_INTERVAL);

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isAuthenticated, updateActivity, checkInactivity]);
}
