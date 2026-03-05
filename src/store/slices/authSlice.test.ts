/**
 * authSlice Tests
 */
import { describe, it, expect } from 'vitest';
import { createEmptyUser } from './authSlice';
import { UserRank } from '../../types';

describe('authSlice', () => {
  describe('createEmptyUser', () => {
    it('should create empty user with default values', () => {
      const user = createEmptyUser();
      expect(user.rank).toBe(UserRank.CTV);
      expect(user.shopBalance).toBe(0);
      expect(user.id).toBe('');
    });
  });
});
