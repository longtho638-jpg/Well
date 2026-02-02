/**
 * Sentry Error Tracking Configuration
 *
 * Configures Sentry for production error monitoring and performance tracking.
 * Free tier: 10,000 events/month
 */

import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry error tracking
 * Only runs in production to avoid noise in development
 */
export function initSentry() {
  // Only initialize in production
  if (import.meta.env.MODE !== 'production') {
    console.log('[Sentry] Skipping initialization in development');
    return;
  }

  // Check if DSN is configured
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.warn('[Sentry] DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,

    // Set environment
    environment: import.meta.env.MODE,

    // Enable performance monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance monitoring sample rate
    // 100% for initial launch to capture all issues, reduce to 10% as traffic grows
    tracesSampleRate: 1.0,

    // Session replay sample rate
    // 100% for launch phase to understand user journeys and debug issues
    replaysSessionSampleRate: 1.0, // 100% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Filter sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }

      // Remove API keys from URLs
      if (event.request?.url) {
        event.request.url = event.request.url.replace(/apikey=[^&]+/gi, 'apikey=***');
      }

      return event;
    },

    // Ignore known third-party errors
    ignoreErrors: [
      // Browser extensions
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      // Network errors (handled by app logic)
      'NetworkError',
      'Failed to fetch',
    ],
  });

  console.log('[Sentry] Initialized successfully');
}

/**
 * Capture custom error with context
 */
export function captureError(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext('custom', context);
  }
  Sentry.captureException(error);
}

/**
 * Add user context to Sentry events
 */
export function setUserContext(user: { id: string; email?: string; role?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.role,
  });
}

/**
 * Clear user context on logout
 */
export function clearUserContext() {
  Sentry.setUser(null);
}
