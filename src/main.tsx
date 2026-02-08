import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import './i18n'; // Initialize i18next
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider } from './context/LanguageContext';
import { initSentry } from './utils/sentry';
import './styles/design-system.css';
import './index.css';
import { validateConfig } from './utils/validate-config';

// Validate configuration before starting the app
const configState = validateConfig();

// Initialize Sentry error tracking (production only)
initSentry();

// ============================================================================
// SAFARI POLYFILLS - Promise.allSettled (Safari < 13)
// ============================================================================
if (!Promise.allSettled) {
  Promise.allSettled = function <T>(promises: Array<Promise<T>>): Promise<Array<PromiseSettledResult<T>>> {
    return Promise.all(
      promises.map(promise =>
        Promise.resolve(promise)
          .then(value => ({ status: 'fulfilled' as const, value }))
          .catch(reason => ({ status: 'rejected' as const, reason }))
      )
    );
  };
}

// Inject Vercel Analytics in production
if (import.meta.env.PROD) {
  const script = document.createElement('script');
  script.defer = true;
  script.src = '/_vercel/insights/script.js';
  document.head.appendChild(script);

  // Unregister stale Service Workers and clear caches (VitePWA is disabled)
  if ('serviceWorker' in navigator) {
    // Listen for cleanup completion from sw.js (Safari-safe — no client.navigate())
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SW_CLEANUP_COMPLETE') {
        window.location.reload();
      }
    });
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((reg) => reg.unregister());
    });
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

if (!configState.isValid) {
  // Render minimal config error UI without depending on i18n or other providers
  ReactDOM.createRoot(rootElement).render(
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #111827, #1f2937, #111827)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        maxWidth: '28rem',
        width: '100%',
        background: 'rgba(31,41,55,0.5)',
        backdropFilter: 'blur(8px)',
        borderRadius: '0.75rem',
        padding: '2rem',
        border: '1px solid rgba(239,68,68,0.5)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>&#9888;&#65039;</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
          Configuration Error
        </h1>
        <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
          The application is missing required environment variables.
          Please contact the administrator.
        </p>
        {!import.meta.env.PROD && (
          <details style={{ textAlign: 'left', background: '#111827', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
            <summary style={{ cursor: 'pointer', color: '#f87171', fontFamily: 'monospace', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Missing keys (dev only)
            </summary>
            <pre style={{ fontSize: '0.75rem', color: '#d1d5db', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
              {configState.missingKeys.join('\n')}
            </pre>
          </details>
        )}
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(to right, #06b6d4, #3b82f6)',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Reload Page
        </button>
      </div>
    </div>
  );
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <HelmetProvider>
        <ErrorBoundary>
          <LanguageProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </LanguageProvider>
        </ErrorBoundary>
      </HelmetProvider>
    </React.StrictMode>
  );
}
