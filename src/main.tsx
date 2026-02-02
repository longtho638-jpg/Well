import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './i18n'; // Initialize i18next
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider } from './context/LanguageContext';
import { initSentry } from './utils/sentry';
import './styles/design-system.css';
import './index.css';
import { validateConfig } from './utils/validate-config';

// Validate configuration before starting the app
validateConfig();

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

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(() => {
        // SW registered successfully
      })
      .catch(() => {
        // SW registration failed
      });
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </LanguageProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
