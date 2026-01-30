import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomersPage from './CustomersPage';
import * as useCustomersHooks from '../../hooks/queries/useCustomers';

// Mock the DataTable component to simplify testing (avoid testing DataTable logic again)
vi.mock('../../components/ui/DataTable', () => ({
  DataTable: ({ data, columns, onPaginationChange, onSortingChange }: any) => (
    <div data-testid="data-table">
      <div>Row Count: {data.length}</div>
      <button onClick={() => onPaginationChange(1, 10)} data-testid="next-page">Next Page</button>
      <button onClick={() => onSortingChange([{ id: 'full_name', desc: false }])} data-testid="sort-name">Sort Name</button>
      {/* Render some column headers to verify they are passed */}
      <div data-testid="columns-count">{columns.length}</div>
    </div>
  )
}));

// Mock the hook
vi.mock('../../hooks/queries/useCustomers', () => ({
  useCustomers: vi.fn(),
}));

describe('CustomersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    (useCustomersHooks.useCustomers as any).mockReturnValue({
      data: { data: [], totalPages: 0 },
      isLoading: false
    });

    render(<CustomersPage />);

    expect(screen.getByText('Khách hàng')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tìm kiếm khách hàng...')).toBeInTheDocument();
    expect(screen.getByTestId('data-table')).toBeInTheDocument();
  });

  it('handles search input', () => {
    (useCustomersHooks.useCustomers as any).mockReturnValue({
      data: { data: [], totalPages: 0 },
      isLoading: false
    });

    render(<CustomersPage />);
    const searchInput = screen.getByPlaceholderText('Tìm kiếm khách hàng...');

    fireEvent.change(searchInput, { target: { value: 'John' } });
    expect(searchInput).toHaveValue('John');

    // Check if hook was called with search param (it re-renders)
    expect(useCustomersHooks.useCustomers).toHaveBeenLastCalledWith(expect.objectContaining({
      search: 'John'
    }));
  });

  it('handles pagination change', () => {
    (useCustomersHooks.useCustomers as any).mockReturnValue({
      data: { data: [], totalPages: 5 },
      isLoading: false
    });

    render(<CustomersPage />);

    // Trigger pagination from mocked table
    fireEvent.click(screen.getByTestId('next-page'));

    expect(useCustomersHooks.useCustomers).toHaveBeenLastCalledWith(expect.objectContaining({
      page: 2 // 0-indexed state + 1
    }));
  });

  it('handles sorting change', () => {
    (useCustomersHooks.useCustomers as any).mockReturnValue({
      data: { data: [], totalPages: 5 },
      isLoading: false
    });

    render(<CustomersPage />);

    // Trigger sorting
    fireEvent.click(screen.getByTestId('sort-name'));

    expect(useCustomersHooks.useCustomers).toHaveBeenLastCalledWith(expect.objectContaining({
      sortBy: 'full_name',
      sortOrder: 'asc'
    }));
  });

  it('passes data to table', () => {
    const mockData = [{ id: 1, name: 'Test' }];
    (useCustomersHooks.useCustomers as any).mockReturnValue({
      data: { data: mockData, totalPages: 1 },
      isLoading: false
    });

    render(<CustomersPage />);

    expect(screen.getByText('Row Count: 1')).toBeInTheDocument();
  });
});
