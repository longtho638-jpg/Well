import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OrdersPage from './OrdersPage';
import * as useOrdersHooks from '../../hooks/queries/useOrders';

// Mock UI components
vi.mock('../../components/ui/DataTable', () => ({
  DataTable: ({ data }: any) => (
    <div data-testid="data-table">Row Count: {data.length}</div>
  )
}));

// Mock the hook
vi.mock('../../hooks/queries/useOrders', () => ({
  useOrders: vi.fn(),
}));

describe('OrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    (useOrdersHooks.useOrders as any).mockReturnValue({
      data: { data: [], totalPages: 0 },
      isLoading: false
    });

    render(<OrdersPage />);

    expect(screen.getByText('Đơn hàng')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tìm kiếm mã đơn, khách hàng...')).toBeInTheDocument();
    expect(screen.getByTestId('data-table')).toBeInTheDocument();
  });

  it('handles search input', () => {
    (useOrdersHooks.useOrders as any).mockReturnValue({
      data: { data: [], totalPages: 0 },
      isLoading: false
    });

    render(<OrdersPage />);
    const searchInput = screen.getByPlaceholderText('Tìm kiếm mã đơn, khách hàng...');

    fireEvent.change(searchInput, { target: { value: 'ORD-123' } });
    expect(searchInput).toHaveValue('ORD-123');

    expect(useOrdersHooks.useOrders).toHaveBeenLastCalledWith(expect.objectContaining({
      search: 'ORD-123'
    }));
  });

  it('passes data to table', () => {
    const mockData = [{ id: '1', total_amount: 100000 }];
    (useOrdersHooks.useOrders as any).mockReturnValue({
      data: { data: mockData, totalPages: 1 },
      isLoading: false
    });

    render(<OrdersPage />);

    expect(screen.getByText('Row Count: 1')).toBeInTheDocument();
  });
});
