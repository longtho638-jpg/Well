/**
 * Unit tests for useTranslation hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTranslation } from '../useTranslation';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'vi',
      changeLanguage: vi.fn(),
      exists: vi.fn(),
    },
    ready: true,
  }),
}));

describe('useTranslation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return translation function and i18n instance', () => {
    const { result } = renderHook(() => useTranslation());

    expect(result.current.t).toBeDefined();
    expect(result.current.i18n).toBeDefined();
    expect(result.current.ready).toBe(true);
  });

  it('should translate keys correctly', () => {
    const { result } = renderHook(() => useTranslation());

    expect(result.current.t('common.hello')).toBe('common.hello');
    expect(result.current.t('dashboard.title')).toBe('dashboard.title');
  });

  it('should have correct language set', () => {
    const { result } = renderHook(() => useTranslation());

    expect(result.current.i18n.language).toBe('vi');
  });
});
