/**
 * Product Slice Tests
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import { createProductSlice } from '../productSlice';
import { supabase } from '../../../lib/supabase';
import type { Product } from '../../../types';

// add types
type ProductSliceState = {
  products: Product[]
  categories?: string[]
}

type ProductRow = {
  id: string
  name: string
  description: string
  price: number
  commission_rate: number
  bonus_revenue: number
  image_url: string
  sales_count: number
  stock: number
}

vi.mock('../../../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}));

const mockSupabaseFrom = supabase.from as MockedFunction<typeof supabase.from>;

describe('ProductSlice', () => {
  const mockSelect = vi.fn();
  const mockOrder = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ order: mockOrder.mockReturnValue({ then: vi.fn() }) });
    mockSupabaseFrom.mockReturnValue({ select: mockSelect } as any);
  });

  it('should initialize with empty products and default categories', () => {
    const slice = createProductSlice(() => {}, () => ({}) as any, {} as any);
    expect(slice.products).toEqual([]);
    expect(slice.categories).toEqual(['health', 'supplements', 'equipment']);
  });

  it('should set products correctly', () => {
    const mockProducts: Product[] = [
      { id: '1', name: 'Product 1', price: 100, commissionRate: 0.25, imageUrl: 'https://img.jpg', description: 'Desc', salesCount: 0, stock: 10 },
      { id: '2', name: 'Product 2', price: 200, commissionRate: 0.3, imageUrl: 'https://img2.jpg', description: 'Desc 2', salesCount: 5, stock: 20 },
    ];
    let state: ProductSliceState = { products: [], categories: [] };
    const slice = createProductSlice((updates) => { state = { ...state, ...updates }; }, () => state, {} as any);
    slice.setProducts(mockProducts);
    expect(state.products).toEqual(mockProducts);
  });

  it('should fetch products and transform data correctly', async () => {
    const mockData: ProductRow[] = [{
      id: 'prod-1', name: 'Vitamin C', description: 'Immune support', price: 299000,
      commission_rate: 0.25, bonus_revenue: 150000, image_url: 'https://example.com/img.jpg',
      sales_count: 150, stock: 50,
    }];
    const mockThen = vi.fn((cb: (r: { data: ProductRow[] }) => void) => { cb({ data: mockData }); return { catch: vi.fn() }; });
    mockSupabaseFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ then: mockThen }) }) } as any);

    let state: ProductSliceState = { products: [] };
    const slice = createProductSlice((updates) => { state = { ...state, ...updates }; }, () => state, {} as any);
    await slice.fetchProducts();

    expect(state.products).toHaveLength(1);
    expect(state.products[0]).toMatchObject({ id: 'prod-1', name: 'Vitamin C', price: 299000, commissionRate: 0.25, salesCount: 150 });
  });

  it('should handle empty response from fetch', async () => {
    const mockThen = vi.fn((cb: (r: { data: ProductRow[] }) => void) => { cb({ data: [] }); return { catch: vi.fn() }; });
    mockSupabaseFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ then: mockThen }) }) } as any);
    let state: ProductSliceState = { products: [] };
    const slice = createProductSlice((updates) => { state = { ...state, ...updates }; }, () => state, {} as any);
    await slice.fetchProducts();
    expect(state.products).toEqual([]);
  });

  it('should handle null data from fetch', async () => {
    const mockThen = vi.fn((cb: (r: { data: null }) => void) => { cb({ data: null }); return { catch: vi.fn() }; });
    mockSupabaseFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ then: mockThen }) }) } as any);
    let state: ProductSliceState = { products: [] };
    const slice = createProductSlice((updates) => { state = { ...state, ...updates }; }, () => state, {} as any);
    await slice.fetchProducts();
    expect(state.products).toEqual([]);
  });
});
