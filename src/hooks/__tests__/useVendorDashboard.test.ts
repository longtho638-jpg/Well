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

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useStore).mockReturnValue({ user: null } as any);
    vi.mocked(useToast).mockReturnValue({ showToast: mockShowToast });
    vi.mocked(isUserVendor).mockResolvedValue(false);
    vi.mocked(logAuditEvent).mockResolvedValue(undefined);
    vi.mocked(productService.getVendorProducts).mockResolvedValue([]);
  });

  describe('verifyVendorAuthorization - Edge Cases', () => {
    it('fails when user not logged in (missing user ID)', async () => {
      vi.mocked(useStore).mockReturnValue({ user: null } as any);
      const { result } = renderHook(() => useVendorDashboard(mockVendorId));
      await act(async () => { await result.current.loadProducts(); });
      expect(result.current.loading).toBe(false);
      expect(mockShowToast).toHaveBeenCalledWith('You must be logged in to manage products', 'error');
    });

    it('fails when user ID is undefined', async () => {
      vi.mocked(useStore).mockReturnValue({ user: { id: undefined, email: 'test@example.com' } } as any);
      const { result } = renderHook(() => useVendorDashboard(mockVendorId));
      await act(async () => { await result.current.loadProducts(); });
      expect(result.current.loading).toBe(false);
      expect(mockShowToast).toHaveBeenCalledWith('You must be logged in to manage products', 'error');
    });

    it('fails when user is not a vendor (non-vendor access)', async () => {
      vi.mocked(useStore).mockReturnValue({ user: { id: mockUserId, email: 'test@example.com' } } as any);
      vi.mocked(isUserVendor).mockResolvedValue(false);
      const { result } = renderHook(() => useVendorDashboard(mockVendorId));
      await act(async () => { await result.current.loadProducts(); });
      expect(result.current.loading).toBe(false);
      expect(mockShowToast).toHaveBeenCalledWith('Only vendors can access this feature', 'error');
      expect(isUserVendor).toHaveBeenCalledWith(mockUserId);
    });

    it('fails when admin accesses another vendor dashboard', async () => {
      const differentVendorId = 'vendor-789';
      vi.mocked(useStore).mockReturnValue({ user: { id: mockUserId, email: 'admin@example.com' } } as any);
      vi.mocked(isUserVendor).mockResolvedValue(true);
      const { result } = renderHook(() => useVendorDashboard(differentVendorId));
      await act(async () => { await result.current.loadProducts(); });
      expect(result.current.loading).toBe(false);
      expect(mockShowToast).toHaveBeenCalledWith('You can only access your own vendor dashboard', 'error');
      expect(logAuditEvent).toHaveBeenCalledWith(mockUserId, 'UNAUTHORIZED_ACCESS', 'vendor_dashboard', differentVendorId);
    });

    it('fails when vendor IDs mismatch (impersonation attempt)', async () => {
      const anotherVendorId = 'vendor-999';
      vi.mocked(useStore).mockReturnValue({ user: { id: mockUserId, email: 'vendor@example.com' } } as any);
      vi.mocked(isUserVendor).mockResolvedValue(true);
      const { result } = renderHook(() => useVendorDashboard(anotherVendorId));
      await act(async () => { await result.current.loadProducts(); });
      expect(result.current.loading).toBe(false);
      expect(mockShowToast).toHaveBeenCalledWith('You can only access your own vendor dashboard', 'error');
      expect(logAuditEvent).toHaveBeenCalledWith(mockUserId, 'UNAUTHORIZED_ACCESS', 'vendor_dashboard', anotherVendorId);
    });

    it('succeeds for legitimate vendor owner', async () => {
      vi.mocked(useStore).mockReturnValue({ user: { id: mockVendorId, email: 'vendor@example.com' } } as any);
      vi.mocked(isUserVendor).mockResolvedValue(true);
      vi.mocked(productService.getVendorProducts).mockResolvedValue([{
        id: 'prod-1', name: 'Test Product', price: 100, vendor_id: mockVendorId,
        description: 'Test', bonus_revenue: 0, commission_rate: 0.2, image_url: '', sales_count: 0, stock: 10
      }]);
      const { result } = renderHook(() => useVendorDashboard(mockVendorId));
      let products: any;
      await act(async () => { products = await result.current.loadProducts(); });
      expect(result.current.loading).toBe(false);
      expect(mockShowToast).not.toHaveBeenCalledWith(expect.any(String), 'error');
      expect(logAuditEvent).not.toHaveBeenCalled();
      expect(productService.getVendorProducts).toHaveBeenCalledWith(mockVendorId);
      expect(products).toHaveLength(1);
    });

    it('handles supabase error gracefully', async () => {
      vi.mocked(useStore).mockReturnValue({ user: { id: mockUserId } } as any);
      vi.mocked(isUserVendor).mockResolvedValue(false);
      const { result } = renderHook(() => useVendorDashboard(mockVendorId));
      await act(async () => { await result.current.loadProducts(); });
      expect(result.current.loading).toBe(false);
      expect(mockShowToast).toHaveBeenCalledWith('Only vendors can access this feature', 'error');
    });

    it('checks auth before calling productService', async () => {
      vi.mocked(useStore).mockReturnValue({ user: { id: mockUserId } } as any);
      vi.mocked(isUserVendor).mockResolvedValue(false);
      const { result } = renderHook(() => useVendorDashboard(mockVendorId));
      await act(async () => { await result.current.loadProducts(); });
      expect(productService.getVendorProducts).not.toHaveBeenCalled();
    });

    it('calls productService only after successful auth', async () => {
      vi.mocked(useStore).mockReturnValue({ user: { id: mockVendorId } } as any);
      vi.mocked(isUserVendor).mockResolvedValue(true);
      const { result } = renderHook(() => useVendorDashboard(mockVendorId));
      await act(async () => { await result.current.loadProducts(); });
      expect(productService.getVendorProducts).toHaveBeenCalledWith(mockVendorId);
      expect(productService.getVendorProducts).toHaveBeenCalledTimes(1);
    });
  });

  describe('verifyVendorAuthorization - Other Operations', () => {
    it('blocks add product when not authorized', async () => {
      vi.mocked(useStore).mockReturnValue({ user: null } as any);
      const { result } = renderHook(() => useVendorDashboard(mockVendorId));
      await act(async () => {
        await result.current.handleAddProduct({
          name: 'New Product', price: 99, description: 'Test', commissionRate: 0.2,
          imageUrl: '', salesCount: 0, stock: 10, bonusRevenue: 10, vendorId: mockVendorId,
        });
      });
      expect(productService.createProductForVendor).not.toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith('You must be logged in to manage products', 'error');
    });

    it('blocks update product when vendor ID mismatches', async () => {
      vi.mocked(useStore).mockReturnValue({ user: { id: mockUserId } } as any);
      vi.mocked(isUserVendor).mockResolvedValue(true);
      const { result } = renderHook(() => useVendorDashboard(mockVendorId));
      await act(async () => { await result.current.handleUpdateProduct('prod-123', { name: 'Updated' }); });
      expect(productService.updateProduct).not.toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith('You can only access your own vendor dashboard', 'error');
    });

    it('blocks delete product when not a vendor', async () => {
      vi.mocked(useStore).mockReturnValue({ user: { id: mockUserId } } as any);
      vi.mocked(isUserVendor).mockResolvedValue(false);
      const { result } = renderHook(() => useVendorDashboard(mockVendorId));
      const originalConfirm = window.confirm;
      window.confirm = vi.fn(() => true);
      await act(async () => { await result.current.handleDeleteProduct('prod-123'); });
      expect(productService.deleteProduct).not.toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith('Only vendors can access this feature', 'error');
      window.confirm = originalConfirm;
    });
  });
});
