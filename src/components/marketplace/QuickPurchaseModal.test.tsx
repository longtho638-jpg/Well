import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuickPurchaseModal } from './QuickPurchaseModal';
import { BrowserRouter } from 'react-router-dom';
import * as storeModule from '@/store';

// Mock dependencies
vi.mock('@/hooks', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
        if (key === 'marketplace.quickBuy.noItems') return `No ${params?.tab || ''} items found`;
        if (key === 'marketplace.quickBuy.commission') return `Comm: ${params?.rate || ''}%`;
        return key;
    },
  }),
}));

vi.mock('@/store', () => ({
  useStore: vi.fn(),
}));

describe('QuickPurchaseModal', () => {
  const onClose = vi.fn();
  const simulateOrder = vi.fn();

  const mockProducts = [
    {
      id: '1',
      name: 'Product A',
      price: 100000,
      commissionRate: 0.1,
      imageUrl: 'img-a.jpg',
      stock: 10,
    },
    {
      id: '2',
      name: 'Product B',
      price: 200000,
      commissionRate: 0.2,
      imageUrl: 'img-b.jpg',
      stock: 5,
    },
  ];

  const mockTransactions = [
    {
      type: 'Direct Sale',
      metadata: { product_id: '1' },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    interface StoreState {
      products: typeof mockProducts;
      transactions: typeof mockTransactions;
      simulateOrder: typeof simulateOrder;
    }

    // Mock Store
    (storeModule.useStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: StoreState) => unknown) => {
        const state = {
            products: mockProducts,
            transactions: mockTransactions,
            simulateOrder,
        };
        if (typeof selector === 'function') {
             return selector(state);
        }
        return state;
    });

    // Mock localStorage
    const store: Record<string, string> = {};
    const localStorageMock = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      clear: vi.fn(() => {
        for (const key in store) delete store[key];
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      length: 0,
      key: vi.fn(),
    };

    // Use Object.defineProperty to override window.localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true // Important for re-defining in beforeEach
    });
  });

  it('renders nothing when not open', () => {
    render(
      <BrowserRouter>
        <QuickPurchaseModal isOpen={false} onClose={onClose} />
      </BrowserRouter>
    );
    expect(screen.queryByText('marketplace.quickBuy.title')).not.toBeInTheDocument();
  });

  it('renders correctly when open', () => {
    render(
      <BrowserRouter>
        <QuickPurchaseModal isOpen={true} onClose={onClose} />
      </BrowserRouter>
    );
    expect(screen.getByText('marketplace.quickBuy.title')).toBeInTheDocument();
  });

  it('displays recent products by default', () => {
    render(
      <BrowserRouter>
        <QuickPurchaseModal isOpen={true} onClose={onClose} />
      </BrowserRouter>
    );
    expect(screen.getByText('Product A')).toBeInTheDocument();
    expect(screen.queryByText('Product B')).not.toBeInTheDocument();
  });

  it('switches to favorites tab', () => {
    render(
      <BrowserRouter>
        <QuickPurchaseModal isOpen={true} onClose={onClose} />
      </BrowserRouter>
    );

    const favoritesTab = screen.getByText('marketplace.quickBuy.favorites');
    fireEvent.click(favoritesTab);

    // Should show empty state message if no favorites
    // We mocked 'marketplace.quickBuy.noItems' to return 'No {tab} items found'
    // tab param is translated key. Since we use identity mock for t, tab='marketplace.quickBuy.favorites'
    expect(screen.getByText(/No marketplace.quickBuy.favorites items found/)).toBeInTheDocument();
  });

  it('calls simulateOrder when Buy Now is clicked', async () => {
    render(
      <BrowserRouter>
        <QuickPurchaseModal isOpen={true} onClose={onClose} />
      </BrowserRouter>
    );

    const buyBtn = screen.getByText('marketplace.quickBuy.buyNow');
    fireEvent.click(buyBtn);

    // Wait for the simulated delay
    await waitFor(() => {
        expect(simulateOrder).toHaveBeenCalledWith('1');
    }, { timeout: 2000 });
  });
});
