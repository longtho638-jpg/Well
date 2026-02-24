import React, { useState, useMemo } from 'react';
import { useUsers } from '../../hooks/queries/useUsers';
import { DataTable } from '../../components/ui/DataTable';
import { getColumns } from './columns';
import { Input } from '../../components/ui/Input';
import { Search, UserPlus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { PaginationParams, User } from '../../types';
import { SortingState } from '@tanstack/react-table';
import { UserDialog } from './UserDialog';
import { usersLogger } from '../../lib/logger';

export default function UsersPage() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState('');

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Debounce search in real app, simple state for now
  const queryParams: PaginationParams = {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: search || undefined,
    sortBy: sorting.length ? sorting[0].id : 'created_at',
    sortOrder: sorting.length ? (sorting[0].desc ? 'desc' : 'asc') : 'desc',
  };

  const { data, isLoading } = useUsers(queryParams);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedUser(null);
    setIsDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    // Implement delete logic or open confirmation dialog
    usersLogger.info('Delete user request:', user);
  };

  const columns = useMemo(() => getColumns({ onEdit: handleEdit, onDelete: handleDelete }), []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Người dùng</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Quản lý tài khoản và phân quyền.</p>
        </div>
        <Button onClick={handleAdd}>
            <UserPlus className="w-4 h-4 mr-2" />
            Thêm mới
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="w-full max-w-sm">
           <Input
              placeholder="Tìm kiếm theo tên, email..."
              icon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
           />
        </div>
        {/* Add more filters like Role Select here */}
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

      <UserDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        user={selectedUser}
      />
    </div>
  );
}
