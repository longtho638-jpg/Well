import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CustomerDetailPage from './CustomerDetailPage';
import * as useCustomersHooks from '../../hooks/queries/useCustomers';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock the hook
vi.mock('../../hooks/queries/useCustomers', () => ({
  useCustomer: vi.fn(),
  useCustomerOrders: vi.fn(),
}));

// Helper to render with router and ID param
const renderWithRouter = (ui: React.ReactElement, initialEntries = ['/customers/1']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/customers/:id" element={ui} />
      </Routes>
    </MemoryRouter>
  );
};

describe('CustomerDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    (useCustomersHooks.useCustomer as any).mockReturnValue({ data: undefined, isLoading: true });
    (useCustomersHooks.useCustomerOrders as any).mockReturnValue({ data: undefined, isLoading: true });

    renderWithRouter(<CustomerDetailPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders not found state', () => {
    (useCustomersHooks.useCustomer as any).mockReturnValue({ data: null, isLoading: false });
    (useCustomersHooks.useCustomerOrders as any).mockReturnValue({ data: [], isLoading: false });

    renderWithRouter(<CustomerDetailPage />);
    expect(screen.getByText('Not found')).toBeInTheDocument();
  });

  it('renders customer details correctly', () => {
    const mockCustomer = {
      id: '1',
      full_name: 'Nguyen Van A',
      email: 'test@example.com',
      phone: '0901234567',
      address: '123 Street',
      created_at: '2023-01-01',
      total_spent: 5000000,
      total_orders: 10
    };

    (useCustomersHooks.useCustomer as any).mockReturnValue({ data: mockCustomer, isLoading: false });
    (useCustomersHooks.useCustomerOrders as any).mockReturnValue({ data: [], isLoading: false });

    renderWithRouter(<CustomerDetailPage />);

    expect(screen.getByText('Nguyen Van A')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('0901234567')).toBeInTheDocument();
    expect(screen.getByText('123 Street')).toBeInTheDocument();
    expect(screen.getByText('10 đơn')).toBeInTheDocument();
  });

  it('renders order history', () => {
    const mockCustomer = { id: '1', full_name: 'A' };
    const mockOrders = [
      {
        id: 'order-123',
        created_at: '2023-01-01',
        total_amount: 100000,
        status: 'delivered'
      }
    ];

    (useCustomersHooks.useCustomer as any).mockReturnValue({ data: mockCustomer, isLoading: false });
    (useCustomersHooks.useCustomerOrders as any).mockReturnValue({ data: mockOrders, isLoading: false });

    renderWithRouter(<CustomerDetailPage />);

    expect(screen.getByText('Lịch sử mua hàng')).toBeInTheDocument();
    expect(screen.getByText('Đơn hàng #order-12')).toBeInTheDocument(); // Slice check
    expect(screen.getByText('delivered')).toBeInTheDocument();
  });

  it('renders empty order history', () => {
     const mockCustomer = { id: '1', full_name: 'A' };
     (useCustomersHooks.useCustomer as any).mockReturnValue({ data: mockCustomer, isLoading: false });
     (useCustomersHooks.useCustomerOrders as any).mockReturnValue({ data: [], isLoading: false });

     renderWithRouter(<CustomerDetailPage />);
     expect(screen.getByText('Chưa có đơn hàng nào.')).toBeInTheDocument();
  });
});
