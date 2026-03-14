/**
 * UI Slice Tests
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { createUISlice, UISlice } from '../uiSlice';
import type { User, Transaction } from '../../../types';

// create UiSliceState type using pre created types 
type UiSliceState = UISlice & {user: User; transactions: Transaction[]};

vi.useFakeTimers();

describe('UISlice', () => {
  const mockUser = { id: 'user-123', name: 'Test User', rank: 'THIEN_LONG', growBalance: 5000000 };
  const mockInitialState = { landingPageTemplates: [], userLandingPages: [], redemptionItems: [], redemptionOrders: [] };

  beforeEach(() => { vi.clearAllTimers(); });

  afterAll(() => { vi.useRealTimers(); });

  it('should initialize with empty state', () => {
    const slice = createUISlice(() => {}, () => ({}) as any, {} as any);
    expect(slice.landingPageTemplates).toEqual([]);
    expect(slice.userLandingPages).toEqual([]);
    expect(slice.redemptionItems).toEqual([]);
    expect(slice.redemptionOrders).toEqual([]);
  });

  it('should create landing page with correct data', async () => {
    let state: UiSliceState = { user: mockUser, ...mockInitialState };
    const slice = createUISlice((updates) => { state = { ...state, ...updates }; }, () => state, {} as any);
    const newPagePromise = slice.createLandingPage('template-a', 'https://example.com/portrait.jpg');

    // Fast-forward timers to complete the 2000ms setTimeout
    vi.advanceTimersByTime(2100);

    const newPage = await newPagePromise;
    expect(newPage).toMatchObject({ userId: 'user-123', template: 'template-a', portraitUrl: 'https://example.com/portrait.jpg', isPublished: false, views: 0, conversions: 0 });
    expect(newPage.id).toMatch(/LP-\d{6}/);
    expect(newPage.aiGeneratedBio).toContain('Test User');
  });

  it('should publish landing page by ID', () => {
    const existingPage = { id: 'LP-001', userId: 'user-123', template: 'template-a' as const, isPublished: false };
    let state: UiSliceState = { user: mockUser, ...mockInitialState, userLandingPages: [existingPage] };
    const setMock = vi.fn((updater) => {
      const updates = typeof updater === 'function' ? updater(state) : updater;
      state = { ...state, ...updates };
    });
    const slice = createUISlice(setMock, () => state, {} as any);

    slice.publishLandingPage('LP-001');

    expect(setMock).toHaveBeenCalledTimes(1);
    expect(state.userLandingPages[0].isPublished).toBe(true);
  });

  it('should not publish wrong page ID', () => {
    const existingPage = { id: 'LP-001', userId: 'user-123', template: 'template-a' as const, isPublished: false };
    let state: UiSliceState = { user: mockUser, ...mockInitialState, userLandingPages: [existingPage] };
    const slice = createUISlice((updates) => { state = { ...state, ...updates }; }, () => state, {} as any);
    slice.publishLandingPage('LP-999');
    expect(state.userLandingPages[0].isPublished).toBe(false);
  });

  it('should redeem item when balance is sufficient', async () => {
    const item = { id: 'item-1', name: 'Premium Package', isAvailable: true, stock: 10, growCost: 1000000, redemptionCount: 0 };
    let state: UiSliceState = { user: mockUser, ...mockInitialState, redemptionItems: [item], transactions: [] };
    const slice = createUISlice((updates) => { state = { ...state, ...updates }; }, () => state, {} as any);
    const redeemPromise = slice.redeemItem('item-1');
    vi.advanceTimersByTime(1500);
    await redeemPromise;
    expect(state.user.growBalance).toBe(4000000);
    expect(state.redemptionItems[0].stock).toBe(9);
    expect(state.redemptionItems[0].redemptionCount).toBe(1);
    expect(state.redemptionOrders).toHaveLength(1);
    expect(state.transactions).toHaveLength(1);
    expect(state.redemptionOrders[0].status).toBe('pending');
  });

  it('should throw error when redeeming unavailable item', async () => {
    const unavailableItem = { id: 'item-2', name: 'Sold Out', isAvailable: false, stock: 0, growCost: 500000 };
    let state: UiSliceState = { user: mockUser, ...mockInitialState, redemptionItems: [unavailableItem], transactions: [] };
    const slice = createUISlice((updates) => { state = { ...state, ...updates }; }, () => state, {} as any);
    await expect(slice.redeemItem('item-2')).rejects.toThrow('Cannot redeem item');
  });

  it('should throw error when insufficient balance', async () => {
    const expensiveItem = { id: 'item-3', name: 'Luxury Package', isAvailable: true, stock: 5, growCost: 10000000 };
    let state: UiSliceState = { user: { ...mockUser, growBalance: 1000000 }, ...mockInitialState, redemptionItems: [expensiveItem], transactions: [] };
    const slice = createUISlice((updates) => { state = { ...state, ...updates }; }, () => state, {} as any);
    await expect(slice.redeemItem('item-3')).rejects.toThrow('Cannot redeem item');
  });
});
