import React, { useState } from 'react';
import { useCustomers } from '../../hooks/queries/useCustomers';
import { DataTable } from '../../components/ui/DataTable';
import { columns } from './columns';
import { Input } from '../../components/ui/Input';
import { Search } from 'lucide-react';
import { PaginationParams } from '../../types';
import { SortingState } from '@tanstack/react-table';

export default function CustomersPage() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState('');

  const queryParams: PaginationParams = {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: search || undefined,
    sortBy: sorting.length ? sorting[0].id : 'created_at',
    sortOrder: sorting.length ? (sorting[0].desc ? 'desc' : 'asc') : 'desc',
  };

  const { data, isLoading } = useCustomers(queryParams);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Khách hàng</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Danh sách khách hàng và lịch sử mua sắm.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-full max-w-sm">
           <Input
              placeholder="Tìm kiếm khách hàng..."
              icon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
           />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        pageCount={data?.totalPages || 0}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        onPaginationChange={(pageIndex, pageSize) => setPagination({ pageIndex, pageSize })}
        sorting={sorting}
        onSortingChange={setSorting}
        isLoading={isLoading}
      />
    </div>
  );
}
