import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DistributorDetailPage from './DistributorDetailPage';
import * as useDistributorsHooks from '../../hooks/queries/useDistributors';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock hook
vi.mock('../../hooks/queries/useDistributors', () => ({
  useDistributor: vi.fn(),
  useUpdateDistributor: vi.fn(),
}));

const renderWithRouter = (ui: React.ReactElement, initialEntries = ['/distributors/1']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/distributors/:id" element={ui} />
      </Routes>
    </MemoryRouter>
  );
};

describe('DistributorDetailPage', () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useDistributorsHooks.useUpdateDistributor as any).mockReturnValue({
      mutate: mockMutate,
      isPending: false
    });
  });

  it('renders loading state', () => {
    (useDistributorsHooks.useDistributor as any).mockReturnValue({ data: undefined, isLoading: true });
    renderWithRouter(<DistributorDetailPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders not found state', () => {
    (useDistributorsHooks.useDistributor as any).mockReturnValue({ data: null, isLoading: false });
    renderWithRouter(<DistributorDetailPage />);
    expect(screen.getByText('Not found')).toBeInTheDocument();
  });

  it('renders distributor details correctly', () => {
    const mockDistributor = {
      id: '1',
      level: 'gold',
      total_sales: 100000000,
      commission_rate: 15,
      user: {
        full_name: 'Distributor One',
        email: 'dist@example.com'
      }
    };

    (useDistributorsHooks.useDistributor as any).mockReturnValue({ data: mockDistributor, isLoading: false });

    renderWithRouter(<DistributorDetailPage />);

    expect(screen.getByText('Distributor One')).toBeInTheDocument();
    expect(screen.getByText('dist@example.com')).toBeInTheDocument();
    expect(screen.getByText('gold')).toBeInTheDocument();
    expect(screen.getByDisplayValue('15')).toBeInTheDocument(); // Input value
  });

  it('updates commission rate', () => {
    const mockDistributor = {
      id: '1',
      level: 'gold',
      commission_rate: 15,
      user: { full_name: 'A' }
    };

    (useDistributorsHooks.useDistributor as any).mockReturnValue({ data: mockDistributor, isLoading: false });

    renderWithRouter(<DistributorDetailPage />);

    const input = screen.getByDisplayValue('15');
    fireEvent.change(input, { target: { value: '20' } });

    const saveButton = screen.getByText('Lưu thay đổi');
    fireEvent.click(saveButton);

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        updates: { commission_rate: 20 }
      }),
      expect.any(Object)
    );
  });
});
