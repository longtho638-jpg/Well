import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DistributorsPage from './DistributorsPage';
import * as useDistributorsHooks from '../../hooks/queries/useDistributors';

// Mock UI components
vi.mock('../../components/ui/DataTable', () => ({
  DataTable: ({ data }: any) => (
    <div data-testid="data-table">Row Count: {data.length}</div>
  )
}));

// Mock the hook
vi.mock('../../hooks/queries/useDistributors', () => ({
  useDistributors: vi.fn(),
}));

describe('DistributorsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    (useDistributorsHooks.useDistributors as any).mockReturnValue({
      data: { data: [], totalPages: 0 },
      isLoading: false
    });

    render(<DistributorsPage />);

    expect(screen.getByText('Nhà phân phối')).toBeInTheDocument();
    expect(screen.getByText('Thêm NPP')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tìm kiếm NPP...')).toBeInTheDocument();
    expect(screen.getByTestId('data-table')).toBeInTheDocument();
  });

  it('handles search input', () => {
    (useDistributorsHooks.useDistributors as any).mockReturnValue({
      data: { data: [], totalPages: 0 },
      isLoading: false
    });

    render(<DistributorsPage />);
    const searchInput = screen.getByPlaceholderText('Tìm kiếm NPP...');

    fireEvent.change(searchInput, { target: { value: 'Distributor A' } });
    expect(searchInput).toHaveValue('Distributor A');

    expect(useDistributorsHooks.useDistributors).toHaveBeenLastCalledWith(expect.objectContaining({
      search: 'Distributor A'
    }));
  });

  it('passes data to table', () => {
    const mockData = [{ id: 1, name: 'Distributor 1' }];
    (useDistributorsHooks.useDistributors as any).mockReturnValue({
      data: { data: mockData, totalPages: 1 },
      isLoading: false
    });

    render(<DistributorsPage />);

    expect(screen.getByText('Row Count: 1')).toBeInTheDocument();
  });
});
