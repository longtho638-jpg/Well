import { renderHook, act, waitFor } from '@testing-library/react';
import { useProducts } from './useProducts';
import { productService, Product, NewProductDto } from '@/services/productService';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock dependencies
vi.mock('@/services/productService', () => ({
  productService: {
    getProducts: vi.fn(),
    updateProduct: vi.fn(),
    createProduct: vi.fn(),
    deleteProduct: vi.fn(),
  },
}));

// Create a stable mock for toast
const showToastMock = vi.fn();
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    showToast: showToastMock,
  }),
}));

const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
        {children}
    </QueryClientProvider>
);

describe('useProducts', () => {
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Product 1',
      description: 'Desc 1',
      price: 100,
      bonus_revenue: 10,
      commission_rate: 0.2,
      image_url: 'img1.jpg',
      sales_count: 5,
      stock: 10,
    },
    {
      id: '2',
      name: 'Product 2',
      description: 'Desc 2',
      price: 200,
      bonus_revenue: 20,
      commission_rate: 0.25,
      image_url: 'img2.jpg',
      sales_count: 0,
      stock: 0,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    showToastMock.mockClear();
  });

  it('should fetch products on mount', async () => {
    (productService.getProducts as Mock).mockResolvedValue(mockProducts);

    const { result } = renderHook(() => useProducts(), { wrapper });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toEqual(mockProducts);
    expect(productService.getProducts).toHaveBeenCalledTimes(1);
    expect(result.current.stats).toEqual({
      total: 2,
      lowStock: 0,
      outOfStock: 1,
    });
  });

  it('should handle fetch error', async () => {
    (productService.getProducts as Mock).mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => useProducts(), { wrapper });

    await waitFor(() => {
        // isLoading becomes false when error occurs
        expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toEqual([]);
    expect(showToastMock).toHaveBeenCalledWith('Failed to load products', 'error');
  });

  it('should filter products', async () => {
    (productService.getProducts as Mock).mockResolvedValue(mockProducts);
    const { result } = renderHook(() => useProducts(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setSearchQuery('Product 1');
    });

    expect(result.current.filteredProducts).toHaveLength(1);
    expect(result.current.filteredProducts[0].id).toBe('1');
  });

  it('should create product', async () => {
     (productService.getProducts as Mock).mockResolvedValue([]);
    (productService.createProduct as Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useProducts(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const newProduct: NewProductDto = {
        name: 'New',
        description: 'New Desc',
        price: 100,
        bonus_revenue: 10,
        stock: 5,
        image_url: 'new.jpg',
        category: 'Test'
    };

    let success;
    await act(async () => {
       success = await result.current.handleCreate(newProduct);
    });

    expect(success).toBe(true);
    expect(productService.createProduct).toHaveBeenCalledWith(newProduct);

    // Invalidate queries is async, wait for refetch
    await waitFor(() => {
         expect(productService.getProducts).toHaveBeenCalledTimes(2);
    });
  });
});
