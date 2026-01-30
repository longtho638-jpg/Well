import React, { useState } from 'react';
import { useDistributors } from '../../hooks/queries/useDistributors';
import { DataTable } from '../../components/ui/DataTable';
import { columns } from './columns';
import { Input } from '../../components/ui/Input';
import { Search, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { PaginationParams } from '../../types';
import { SortingState } from '@tanstack/react-table';

export default function DistributorsPage() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState('');

  const queryParams: PaginationParams = {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: search || undefined,
    sortBy: sorting.length ? sorting[0].id : 'total_sales',
    sortOrder: sorting.length ? (sorting[0].desc ? 'desc' : 'asc') : 'desc',
  };

  const { data, isLoading } = useDistributors(queryParams);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Nhà phân phối</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Quản lý hiệu suất và hoa hồng hệ thống.</p>
        </div>
        <Button>
            <Plus className="w-4 h-4 mr-2" />
            Thêm NPP
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-full max-w-sm">
           <Input
              placeholder="Tìm kiếm NPP..."
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
