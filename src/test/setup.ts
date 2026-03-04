import { expect, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { TransformStream } from 'node:stream/web';

// Polyfill TransformStream for jsdom (required by ai SDK / eventsource-parser)
// Synchronous polyfill to avoid async initialization issues
beforeAll(() => {
  if (typeof globalThis.TransformStream === 'undefined') {
    Object.assign(globalThis, { TransformStream });
  }
});

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

// Store original console methods
const originalWarn = console.warn;
const originalError = console.error;

// Mock React Router future flags to suppress warnings
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

// Suppress act() warnings from testing-library async state updates
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('not wrapped in act(') ||
     args[0].includes('not configured to support act(') ||
     args[0].includes('ReactDOMTestUtils.act'))
  ) {
    return;
  }
  originalError(...args);
};

// Restore console methods after all tests
afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// Cleanup DOM after each test to prevent state leaking between tests
afterEach(() => {
  cleanup();
});
