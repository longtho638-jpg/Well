/**
 * Unit Tests for useVendorDashboard Hook - verifyVendorAuthorization edge cases
 */

import { renderHook, act } from '@testing-library/react';
import { useVendorDashboard } from '../useVendorDashboard';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useToast } from '../../components/ui/Toast';
import { isUserVendor, logAuditEvent } from '../../utils/auth';
import { productService } from '../../services/productService';
import { useStore } from '../../store';
import type { Product, User } from '../../types';
import type { AppState } from '../../store';

vi.mock('../../utils/auth', async (importOriginal) => ({
  ...(await importOriginal()) as object,
  isUserVendor: vi.fn(),
  logAuditEvent: vi.fn(),
  checkRateLimit: vi.fn(),
  getRateLimitRemaining: vi.fn(),
}));

vi.mock('../../store', () => ({ useStore: vi.fn() }));
vi.mock('../../components/ui/Toast', () => ({ useToast: vi.fn() }));
vi.mock('../../services/productService', () => ({
  productService: {
    getVendorProducts: vi.fn(),
    createProductForVendor: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
  },
}));
vi.mock('../../hooks', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe('useVendorDashboard - Authorization', () => {
  const mockVendorId = 'vendor-123', mockUserId = 'user-456';
  const mockShowToast = vi.fn();

  const createMockStore = (user: Partial<User> | null): Partial<AppState> => ({ user });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useStore).mockReturnValue(createMockStore(null));
    vi.mocked(useToast).mockReturnValue({ showToast: mockShowToast });
    vi.mocked(isUserVendor).mockResolvedValue(false);
    vi.mocked(logAuditEvent).mockResolvedValue(undefined);
    vi.mocked(productService.getVendorProducts).mockResolvedValue([]);
  });

  describe('verifyVendorAuthorization - Edge Cases', () => {
    it('fails when user not logged in (missing user ID)', async () => {
      vi.mocked(useStore).mockReturnValue(createMockStore(null));
      const { result } = renderHook(() => useVendorDashboard(mockVendorId));
      await act(async () => { await result.current.loadProducts(); });
      expect(result.current.loading).toBe(false);
      expect(mockShowToast).toHaveBeenCalledWith('vendor.errors.notLoggedIn', 'error');
    });

    it('fails when user ID is undefined', async () => {
      vi.mocked(useStore).mockReturnValue(createMockStore({ id: undefined, email: 'test@example.com' }));
      const { result } = renderHook(() => useVendorDashboard(mockVendorId));
      await act(async () => { await result.current.loadProducts(); });
      expect(result.current.loading).toBe(false);
      expect(mockShowToast).toHaveBeenCalledWith('vendor.errors.notLoggedIn', 'error');
    });

    it('fails when user is not a vendor (non-vendor access)', async () => {
      vi.mocked(useStore).mockReturnValue(createMockStore({ id: mockUserId, email: 'test@example.com' }));
      vi.mocked(isUserVendor).mockResolvedValue(false);
      const { result } = renderHook(() => useVendorDashboard(mockVendorId));
      await act(async () => { await result.current.loadProducts(); });
      expect(result.current.loading).toBe(false);
      expect(mockShowToast).toHaveBeenCalledWith('vendor.errors.vendorOnly', 'error');
      expect(isUserVendor).toHaveBeenCalledWith(mockUserId);
    });

    it('fails when admin accesses another vendor dashboard', async () => {
      const differentVendorId = 'vendor-789';
      vi.mocked(useStore).mockReturnValue(createMockStore({ id: mockUserId, email: 'admin@example.com' }));
      vi.mocked(isUserVendor).mockResolvedValue(true);
      const { result } = renderHook(() => useVendorDashboard(differentVendorId));
      await act(async () => { await result.current.loadProducts(); });
      expect(result.current.loading).toBe(false);
      expect(mockShowToast).toHaveBeenCalledWith('vendor.errors.accessDenied', 'error');
      expect(logAuditEvent).toHaveBeenCalledWith(mockUserId, 'UNAUTHORIZED_ACCESS', 'vendor_dashboard', differentVendorId);
    });

    it('fails when vendor IDs mismatch (impersonation attempt)', async () => {
      const anotherVendorId = 'vendor-999';
      vi.mocked(useStore).mockReturnValue(createMockStore({ id: mockUserId, email: 'vendor@example.com' }));
      vi.mocked(isUserVendor).mockResolvedValue(true);
      const { result } = renderHook(() => useVendorDashboard(anotherVendorId));
      await act(async () => { await result.current.loadProducts(); });
      expect(result.current.loading).toBe(false);
      expect(mockShowToast).toHaveBeenCalledWith('vendor.errors.accessDenied', 'error');
      expect(logAuditEvent).toHaveBeenCalledWith(mockUserId, 'UNAUTHORIZED_ACCESS', 'vendor_dashboard', anotherVendorId);
    });

    it('succeeds for legitimate vendor owner', async () => {
      vi.mocked(useStore).mockReturnValue(createMockStore({ id: mockVendorId, email: 'vendor@example.com' }));
      vi.mocked(isUserVendor).mockResolvedValue(true);
      vi.mocked(productService.getVendorProducts).mockResolvedValue([{
        id: 'prod-1', name: 'Test Product', price: 100, vendor_id: mockVendorId,
        description: 'Test', bonus_revenue: 0, commission_rate: 0.2, image_url: '', sales_count: 0, stock: 10
      }]);
      const { result } = renderHook(() => useVendorDashboard(mockVendorId));
      let products: Product[] | undefined;
      await act(async () => { products = await result.current.loadProducts(); });
      expect(result.current.loading).toBe(false);
      expect(mockShowToast).not.toHaveBeenCalledWith(expect.any(String), 'error');
      expect(logAuditEvent).not.toHaveBeenCalled();
      expect(productService.getVendorProducts).toHaveBeenCalledWith(mockVendorId);
      expect(products).toHaveLength(1);
    });

    it('handles supabase error gracefully', async () => {
      vi.mocked(useStore).mockReturnValue(createMockStore({ id: mockUserId }));
      vi.mocked(isUserVendor).mockResolvedValue(false);
      const { result } = renderHook(() => useVendorDashboard(mockVendorId));
      await act(async () => { await result.current.loadProducts(); });
      expect(result.current.loading).toBe(false);
      expect(mockShowToast).toHaveBeenCalledWith('vendor.errors.vendorOnly', 'error');
    });

    it('checks auth before calling productService', async () => {
      vi.mocked(useStore).mockReturnValue(createMockStore({ id: mockUserId }));
      vi.mocked(isUserVendor).mockResolvedValue(false);
      const { result } = renderHook(() => useVendorDashboard(mockVendorId));
      await act(async () => { await result.current.loadProducts(); });
      expect(productService.getVendorProducts).not.toHaveBeenCalled();
    });

    it('calls productService only after successful auth', async () => {
      vi.mocked(useStore).mockReturnValue(createMockStore({ id: mockVendorId }));
      vi.mocked(isUserVendor).mockResolvedValue(true);
      const { result } = renderHook(() => useVendorDashboard(mockVendorId));
      await act(async () => { await result.current.loadProducts(); });
      expect(productService.getVendorProducts).toHaveBeenCalledWith(mockVendorId);
      expect(productService.getVendorProducts).toHaveBeenCalledTimes(1);
    });
  });

  describe('verifyVendorAuthorization - Other Operations', () => {
    it('blocks add product when not authorized', async () => {
      vi.mocked(useStore).mockReturnValue(createMockStore(null));
      const { result } = renderHook(() => useVendorDashboard(mockVendorId));
      await act(async () => {
        await result.current.handleAddProduct({
          name: 'New Product', price: 99, description: 'Test', commissionRate: 0.2,
          imageUrl: '', salesCount: 0, stock: 10, bonusRevenue: 10, vendorId: mockVendorId,
        });
      });
      expect(productService.createProductForVendor).not.toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith('vendor.errors.notLoggedIn', 'error');
    });

    it('blocks update product when vendor ID mismatches', async () => {
      vi.mocked(useStore).mockReturnValue(createMockStore({ id: mockUserId }));
      vi.mocked(isUserVendor).mockResolvedValue(true);
      const { result } = renderHook(() => useVendorDashboard(mockVendorId));
      await act(async () => { await result.current.handleUpdateProduct('prod-123', { name: 'Updated' }); });
      expect(productService.updateProduct).not.toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith('vendor.errors.accessDenied', 'error');
    });

    it('blocks delete product when not a vendor', async () => {
      vi.mocked(useStore).mockReturnValue(createMockStore({ id: mockUserId }));
      vi.mocked(isUserVendor).mockResolvedValue(false);
      const { result } = renderHook(() => useVendorDashboard(mockVendorId));
      const originalConfirm = window.confirm;
      window.confirm = vi.fn(() => true);
      await act(async () => { await result.current.handleDeleteProduct('prod-123'); });
      expect(productService.deleteProduct).not.toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith('vendor.errors.vendorOnly', 'error');
      window.confirm = originalConfirm;
    });
  });
});
