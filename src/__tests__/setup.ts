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

// Mock i18next with basic translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      // Basic translation map for common keys
      const translations: Record<string, string> = {
        'quotaTracker.reset_at': 'Làm mới vào:',
        'quotaTracker.extension_usage': 'Đã dùng',
        'quotaTracker.extension_limit': 'Giới hạn',
        'quotaTracker.warning': 'Cảnh báo',
        'quotaTracker.near_limit_warning': 'Cảnh báo',
        'quotaTracker.over_limit': 'Vượt giới hạn',
        'extension.approved': 'ĐÃ DUYỆT',
        'extension.pending': 'CHỜ DUYỆT',
        'extension.denied': 'TỪ CHỐI',
        'extension.none': 'CHƯA CẬP NHẬT',
        'extension.viewing': 'đang được xem xét',
        'extension.not_supported': 'không hỗ trợ extension',
      }
      // Handle parameterized translations
      if (key === 'quotaTracker.over_limit' && params?.count) {
        return `Vượt giới hạn: ${params.count.toLocaleString()}`
      }
      if (key === 'quotaTracker.near_limit_warning' && params?.percentage) {
        return `Cảnh báo: ${params.percentage}%`
      }
      return translations[key] || key
    },
    i18n: {
      language: 'vi',
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
