import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
      language: 'vi',
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock React Router future flags to suppress warnings
// We can't easily mock the flags themselves without mocking the whole Router provider
// but we can suppress the console warnings for now if they are just noise
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('React Router Future Flag Warning') ||
     args[0].includes('v7_startTransition') ||
     args[0].includes('v7_relativeSplatPath'))
  ) {
    return;
  }
  originalWarn(...args);
};

// Suppress React 18 act() warnings from Vitest/jsdom async state updates in renderHook
// This is a known compatibility issue: https://github.com/testing-library/react-testing-library/issues/1382
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('not wrapped in act(') ||
     args[0].includes('not configured to support act('))
  ) {
    return;
  }
  originalError(...args);
};

// Cleanup after each test
afterEach(() => {
  cleanup();
});
