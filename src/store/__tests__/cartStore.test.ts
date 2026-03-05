/**
 * Unit tests for cartStore
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCartStore } from '../cartStore';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock JSON storage for zustand persist
vi.mock('zustand/middleware', async () => {
  const actual = await vi.importActual('zustand/middleware');
  return {
    ...(actual as object),
    createJSONStorage: () => ({
      getItem: (name: string) => {
        const item = mockLocalStorage.getItem(name);
        return item ? JSON.parse(item) : null;
      },
      setItem: (name: string, value: unknown) => {
        mockLocalStorage.setItem(name, JSON.stringify(value));
      },
      removeItem: (name: string) => {
        mockLocalStorage.removeItem(name);
      },
    }),
  };
});

// Sample product data for testing
const createMockProduct = (overrides = {}) => ({
  id: 'prod-001',
  name: 'Test Product',
  price: 100000,
  commissionRate: 0.1,
  imageUrl: 'image1.jpg',
  description: 'A test product',
  salesCount: 0,
  stock: 10,
  vendorId: 'vendor-001',
  ...overrides,
});

describe('useCartStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    // Reset store state between tests
    useCartStore.setState({ items: [] });
  });

  describe('addToCart', () => {
    it('should add new product to cart', () => {
      const product = createMockProduct();

      useCartStore.getState().addToCart(product, 2);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].product.id).toBe('prod-001');
      expect(state.items[0].quantity).toBe(2);
    });

    it('should merge quantity for existing product', () => {
      const product = createMockProduct();

      useCartStore.getState().addToCart(product, 1);
      useCartStore.getState().addToCart(product, 2);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(3);
    });

    it('should default quantity to 1 when not specified', () => {
      const product = createMockProduct();

      useCartStore.getState().addToCart(product);

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(1);
    });

    it('should throw error when adding exceeds stock', () => {
      const product = createMockProduct({ stock: 2 });

      useCartStore.getState().addToCart(product, 1);

      expect(() => {
        useCartStore.getState().addToCart(product, 2);
      }).toThrow('Only 2 items available in stock');
    });

    it('should allow adding when product has no stock field', () => {
      const product = createMockProduct({ stock: undefined });

      expect(() => {
        useCartStore.getState().addToCart(product, 100);
      }).not.toThrow();
    });
  });

  describe('removeFromCart', () => {
    it('should remove product from cart', () => {
      const product = createMockProduct();
      useCartStore.getState().addToCart(product, 2);

      useCartStore.getState().removeFromCart('prod-001');

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
    });

    it('should not error when removing non-existent product', () => {
      expect(() => {
        useCartStore.getState().removeFromCart('non-existent');
      }).not.toThrow();
    });
  });

  describe('updateQuantity', () => {
    it('should update quantity of existing product', () => {
      const product = createMockProduct();
      useCartStore.getState().addToCart(product, 1);

      useCartStore.getState().updateQuantity('prod-001', 5);

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(5);
    });

    it('should set minimum quantity to 1 when given 0 or negative', () => {
      const product = createMockProduct();
      useCartStore.getState().addToCart(product, 3);

      useCartStore.getState().updateQuantity('prod-001', 0);

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(1);
    });

    it('should throw error when updating exceeds stock', () => {
      const product = createMockProduct({ stock: 3 });
      useCartStore.getState().addToCart(product, 1);

      expect(() => {
        useCartStore.getState().updateQuantity('prod-001', 5);
      }).toThrow('Only 3 items available in stock');
    });
  });

  describe('clearCart', () => {
    it('should remove all items from cart', () => {
      const product1 = createMockProduct({ id: 'prod-001' });
      const product2 = createMockProduct({ id: 'prod-002' });

      useCartStore.getState().addToCart(product1, 1);
      useCartStore.getState().addToCart(product2, 2);

      useCartStore.getState().clearCart();

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
    });
  });

  describe('getTotal', () => {
    it('should calculate total price correctly', () => {
      const product1 = createMockProduct({ id: 'prod-001', price: 100000 });
      const product2 = createMockProduct({ id: 'prod-002', price: 50000 });

      useCartStore.getState().addToCart(product1, 2);
      useCartStore.getState().addToCart(product2, 3);

      const total = useCartStore.getState().getTotal();

      expect(total).toBe(350000); // (100000 * 2) + (50000 * 3)
    });

    it('should return 0 for empty cart', () => {
      const total = useCartStore.getState().getTotal();
      expect(total).toBe(0);
    });
  });

  describe('getItemCount', () => {
    it('should return total quantity of all items', () => {
      const product1 = createMockProduct({ id: 'prod-001' });
      const product2 = createMockProduct({ id: 'prod-002' });

      useCartStore.getState().addToCart(product1, 2);
      useCartStore.getState().addToCart(product2, 3);

      const count = useCartStore.getState().getItemCount();

      expect(count).toBe(5);
    });

    it('should return 0 for empty cart', () => {
      const count = useCartStore.getState().getItemCount();
      expect(count).toBe(0);
    });
  });

  describe('localStorage persistence', () => {
    it('should persist cart to localStorage', () => {
      const product = createMockProduct();

      useCartStore.getState().addToCart(product, 2);

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const call = mockLocalStorage.setItem.mock.calls[0];
      expect(call[0]).toBe('well-cart-storage');
    });
  });
});
