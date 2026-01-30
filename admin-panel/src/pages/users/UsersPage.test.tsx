import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UsersPage from './UsersPage';
import * as useUsersHooks from '../../hooks/queries/useUsers';

// Mock UI components
vi.mock('../../components/ui/DataTable', () => ({
  DataTable: ({ data }: any) => (
    <div data-testid="data-table">Row Count: {data.length}</div>
  )
}));

// Mock the hook
vi.mock('../../hooks/queries/useUsers', () => ({
  useUsers: vi.fn(),
  useUpdateUser: vi.fn(),
}));

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useUsersHooks.useUpdateUser as any).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false
    });
  });

  it('renders correctly', () => {
    (useUsersHooks.useUsers as any).mockReturnValue({
      data: { data: [], totalPages: 0 },
      isLoading: false
    });

    render(<UsersPage />);

    expect(screen.getByText('Người dùng')).toBeInTheDocument();
    expect(screen.getByText('Thêm mới')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tìm kiếm theo tên, email...')).toBeInTheDocument();
    expect(screen.getByTestId('data-table')).toBeInTheDocument();
  });

  it('handles search input', () => {
    (useUsersHooks.useUsers as any).mockReturnValue({
      data: { data: [], totalPages: 0 },
      isLoading: false
    });

    render(<UsersPage />);
    const searchInput = screen.getByPlaceholderText('Tìm kiếm theo tên, email...');

    fireEvent.change(searchInput, { target: { value: 'Admin' } });
    expect(searchInput).toHaveValue('Admin');

    expect(useUsersHooks.useUsers).toHaveBeenLastCalledWith(expect.objectContaining({
      search: 'Admin'
    }));
  });

  it('passes data to table', () => {
    const mockData = [{ id: 1, full_name: 'User 1' }];
    (useUsersHooks.useUsers as any).mockReturnValue({
      data: { data: mockData, totalPages: 1 },
      isLoading: false
    });

    render(<UsersPage />);

    expect(screen.getByText('Row Count: 1')).toBeInTheDocument();
  });
});
