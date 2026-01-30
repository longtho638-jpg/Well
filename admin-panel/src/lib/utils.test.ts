import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('utils/cn', () => {
  it('should merge class names correctly', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('should handle conditional classes', () => {
    const result = cn('text-red-500', false && 'bg-blue-500', true && 'font-bold');
    expect(result).toBe('text-red-500 font-bold');
  });

  it('should handle tailwind conflicts', () => {
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
  });
});
