import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { columns as customerColumns } from './customers/columns';
import { columns as distributorColumns } from './distributors/columns';
import { getColumns as getUserColumns } from './users/columns';
import { columns as orderColumns } from './orders/columns';
import { DataTable } from '../components/ui/DataTable';
import { BrowserRouter } from 'react-router-dom';

// Wrapper for router context
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Page Columns Configuration', () => {
  describe('Customer Columns', () => {
    const mockData = [
      {
        id: '1',
        full_name: 'Nguyen Van A',
        phone: '0901234567',
        total_orders: 5,
        total_spent: 1000000,
        last_order_date: '2023-01-01T00:00:00Z',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }
    ];

    it('renders customer data correctly', () => {
      renderWithRouter(
        <DataTable
          columns={customerColumns}
          data={mockData}
          pageCount={1}
          pageIndex={0}
          pageSize={10}
          onPaginationChange={() => {}}
        />
      );

      expect(screen.getByText('Nguyen Van A')).toBeInTheDocument();
      expect(screen.getByText('0901234567')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      // Check currency formatting (approximate since locale might vary)
      expect(screen.getByText(/1\.000\.000/)).toBeInTheDocument();
    });

    it('renders customer fallback avatar', () => {
        const dataWithoutName = [{ ...mockData[0], full_name: '' }];
        renderWithRouter(
            <DataTable columns={customerColumns} data={dataWithoutName} pageCount={1} pageIndex={0} pageSize={10} onPaginationChange={() => {}} />
        );
        expect(screen.getByText('C')).toBeInTheDocument(); // Default fallback
    });
  });

  describe('Distributor Columns', () => {
    const mockData = [
      {
        id: '1',
        user_id: 'u1',
        level: 'gold',
        commission_rate: 15,
        total_sales: 50000000,
        active: true,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        user: {
            id: 'u1',
            full_name: 'Distributor A',
            email: 'dist@example.com',
            role: 'distributor',
            created_at: '2023-01-01',
            updated_at: '2023-01-01'
        }
      }
    ];

    it('renders distributor data correctly', () => {
      renderWithRouter(
        <DataTable
          columns={distributorColumns}
          data={mockData as any} // Cast because mock data might miss some optional fields
          pageCount={1}
          pageIndex={0}
          pageSize={10}
          onPaginationChange={() => {}}
        />
      );

      expect(screen.getByText('Distributor A')).toBeInTheDocument();
      expect(screen.getByText('gold')).toBeInTheDocument();
      expect(screen.getByText(/50\.000\.000/)).toBeInTheDocument();
      expect(screen.getByText('15%')).toBeInTheDocument();
      expect(screen.getByText('Hoạt động')).toBeInTheDocument();
    });
  });

  describe('User Columns', () => {
    const mockData = [
      {
        id: '1',
        full_name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01',
        avatar_url: 'https://example.com/avatar.jpg'
      }
    ];

    it('renders user data correctly', () => {
      const userColumns = getUserColumns({ onEdit: () => {}, onDelete: () => {} });
      renderWithRouter(
        <DataTable
          columns={userColumns}
          data={mockData as any}
          pageCount={1}
          pageIndex={0}
          pageSize={10}
          onPaginationChange={() => {}}
        />
      );

      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });
  });

  describe('Order Columns', () => {
    const mockData = [
      {
        id: '12345678-90ab-cdef-1234-567890abcdef',
        customer_id: 'c1',
        total_amount: 250000,
        status: 'pending',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01',
        customer: {
            full_name: 'Customer B'
        }
      }
    ];

    it('renders order data correctly', () => {
      renderWithRouter(
        <DataTable
          columns={orderColumns}
          data={mockData as any}
          pageCount={1}
          pageIndex={0}
          pageSize={10}
          onPaginationChange={() => {}}
        />
      );

      // Check truncated ID
      expect(screen.getByText('#12345678')).toBeInTheDocument();
      expect(screen.getByText('Customer B')).toBeInTheDocument();
      expect(screen.getByText(/250\.000/)).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();
    });
  });
});
