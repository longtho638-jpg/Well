// Vitest Test Setup File
// Mock framer-motion for jsdom compatibility
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock framer-motion's motion components
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...(actual as object),
    motionProxy: new Proxy(
      {},
      {
        get: () => ({ render: () => null }),
      },
    ),
  };
});

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: async () => {},
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}));

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
    }),
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signIn: async () => ({ data: null, error: null }),
      signOut: async () => ({ error: null }),
    },
  }),
}));

// Suppress console warnings during tests
const originalWarn = console.warn;
console.warn = (...args) => {
  const msg = args[0];
  if (
    typeof msg === 'string' &&
    (msg.includes('framer-motion') ||
    msg.includes('act(') ||
    msg.includes('act(...)') ||
    msg.includes('wrap-tests-with-act') ||
    msg.includes('TestingLibraryElementError'))
  ) {
    return;
  }
  originalWarn(...args);
};
