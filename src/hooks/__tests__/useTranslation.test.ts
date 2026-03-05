/**
 * Unit tests for useTranslation hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTranslation } from '../useTranslation';

// Mock i18next - match actual hook return shape
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'vi',
      changeLanguage: vi.fn(),
      exists: vi.fn(),
    },
  }),
}));

describe('useTranslation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return translation function, lang, setLang and i18n', () => {
    const { result } = renderHook(() => useTranslation());

    expect(result.current.t).toBeDefined();
    expect(result.current.i18n).toBeDefined();
    expect(result.current.lang).toBeDefined();
    expect(result.current.setLang).toBeDefined();
    expect(typeof result.current.setLang).toBe('function');
  });

  it('should translate keys correctly', () => {
    const { result } = renderHook(() => useTranslation());

    expect(result.current.t('common.hello')).toBe('common.hello');
    expect(result.current.t('dashboard.title')).toBe('dashboard.title');
  });

  it('should have correct language set', () => {
    const { result } = renderHook(() => useTranslation());

    expect(result.current.lang).toBe('vi');
  });
});
