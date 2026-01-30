import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable } from './DataTable';
import { ColumnDef } from '@tanstack/react-table';

type TestData = {
  id: string;
  name: string;
  amount: number;
};

const columns: ColumnDef<TestData>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
  },
];

const data: TestData[] = [
  { id: '1', name: 'Item 1', amount: 100 },
  { id: '2', name: 'Item 2', amount: 200 },
];

describe('DataTable', () => {
  it('renders data correctly', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        pageCount={1}
        pageIndex={0}
        pageSize={10}
        onPaginationChange={vi.fn()}
      />
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        pageCount={0}
        pageIndex={0}
        pageSize={10}
        onPaginationChange={vi.fn()}
        isLoading={true}
      />
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        pageCount={0}
        pageIndex={0}
        pageSize={10}
        onPaginationChange={vi.fn()}
      />
    );

    expect(screen.getByText('No results.')).toBeInTheDocument();
  });

  it('handles pagination', () => {
    const onPaginationChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={data}
        pageCount={2}
        pageIndex={0}
        pageSize={10}
        onPaginationChange={onPaginationChange}
      />
    );

    // Initial state: Page 1 of 2. Previous disabled, Next enabled.
    const prevButton = screen.getAllByRole('button')[0];
    const nextButton = screen.getAllByRole('button')[1];

    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();

    fireEvent.click(nextButton);
    expect(onPaginationChange).toHaveBeenCalledWith(1, 10);
  });
});
