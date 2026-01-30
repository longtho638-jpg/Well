import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OrderDetailPage from './OrderDetailPage';
import * as useOrdersHooks from '../../hooks/queries/useOrders';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock hook
vi.mock('../../hooks/queries/useOrders', () => ({
  useOrder: vi.fn(),
  useUpdateOrderStatus: vi.fn(),
}));

const renderWithRouter = (ui: React.ReactElement, initialEntries = ['/orders/1']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/orders/:id" element={ui} />
      </Routes>
    </MemoryRouter>
  );
};

describe('OrderDetailPage', () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useOrdersHooks.useUpdateOrderStatus as any).mockReturnValue({
      mutate: mockMutate,
      isPending: false
    });
  });

  it('renders loading state', () => {
    (useOrdersHooks.useOrder as any).mockReturnValue({ data: undefined, isLoading: true });
    renderWithRouter(<OrderDetailPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders not found state', () => {
    (useOrdersHooks.useOrder as any).mockReturnValue({ data: null, isLoading: false });
    renderWithRouter(<OrderDetailPage />);
    expect(screen.getByText('Not found')).toBeInTheDocument();
  });

  it('renders order details correctly', () => {
    const mockOrder = {
      id: 'order-123',
      status: 'pending',
      payment_status: 'paid',
      created_at: '2023-01-01T00:00:00Z',
      total_amount: 500000,
      customer: {
        full_name: 'Customer A',
        phone: '123456',
        address: 'Hanoi'
      },
      items: [
        { id: '1', quantity: 2, price: 100000 }
      ]
    };

    (useOrdersHooks.useOrder as any).mockReturnValue({ data: mockOrder, isLoading: false });

    renderWithRouter(<OrderDetailPage />);

    expect(screen.getByText('Customer A')).toBeInTheDocument();
    expect(screen.getByText('123456')).toBeInTheDocument();
    expect(screen.getByText('Hanoi')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('paid')).toBeInTheDocument();
    // Check total amount presence
    expect(screen.getByText(/500\.000/)).toBeInTheDocument();
  });

  it('handles status updates', () => {
    const mockOrder = {
      id: '1',
      status: 'pending',
      customer: { full_name: 'A' },
      items: []
    };

    (useOrdersHooks.useOrder as any).mockReturnValue({ data: mockOrder, isLoading: false });

    renderWithRouter(<OrderDetailPage />);

    // Pending order should show "Xác nhận đơn" (Confirm) and "Hủy đơn" (Cancel)
    const confirmButton = screen.getByText('Xác nhận đơn');
    fireEvent.click(confirmButton);

    expect(mockMutate).toHaveBeenCalledWith({ id: '1', status: 'processing' });
  });

  it('shows correct actions for processing status', () => {
    const mockOrder = {
      id: '1',
      status: 'processing',
      customer: { full_name: 'A' },
      items: []
    };

    (useOrdersHooks.useOrder as any).mockReturnValue({ data: mockOrder, isLoading: false });

    renderWithRouter(<OrderDetailPage />);

    // Processing order should show "Gửi hàng" (Ship)
    const shipButton = screen.getByText('Gửi hàng');
    fireEvent.click(shipButton);

    expect(mockMutate).toHaveBeenCalledWith({ id: '1', status: 'shipped' });
  });

  it('shows correct actions for shipped status', () => {
     const mockOrder = {
       id: '1',
       status: 'shipped',
       customer: { full_name: 'A' },
       items: []
     };

     (useOrdersHooks.useOrder as any).mockReturnValue({ data: mockOrder, isLoading: false });

     renderWithRouter(<OrderDetailPage />);

     // Shipped order should show "Hoàn thành" (Complete)
     const completeButton = screen.getByText('Hoàn thành');
     fireEvent.click(completeButton);

     expect(mockMutate).toHaveBeenCalledWith({ id: '1', status: 'delivered' });
   });
});
