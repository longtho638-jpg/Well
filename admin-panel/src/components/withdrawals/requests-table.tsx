import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { WithdrawalRequest } from '@/services/withdrawal-service';
import { MoreHorizontal, Check, X, CheckCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RequestsTableProps {
  data: WithdrawalRequest[];
  isLoading: boolean;
  onApprove: (request: WithdrawalRequest) => void;
  onReject: (request: WithdrawalRequest) => void;
  onComplete: (request: WithdrawalRequest) => void;
}

export function RequestsTable({
  data,
  isLoading,
  onApprove,
  onReject,
  onComplete,
}: RequestsTableProps) {
  const columns: ColumnDef<WithdrawalRequest>[] = [
    {
      accessorKey: 'user',
      header: 'User',
      cell: ({ row }) => {
        const user = row.original.user;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-slate-900 dark:text-slate-100">{user?.name || 'Unknown'}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('amount'));
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(amount);
        return <div className="font-medium text-slate-900 dark:text-slate-100">{formatted}</div>;
      },
    },
    {
      accessorKey: 'bank_details',
      header: 'Bank Details',
      cell: ({ row }) => {
        const { bank_name, bank_account_number, bank_account_name } = row.original;
        return (
          <div className="flex flex-col text-sm">
            <span className="font-medium text-slate-900 dark:text-slate-100">{bank_name}</span>
            <span className="text-slate-500 dark:text-slate-400">{bank_account_number}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{bank_account_name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;

        // Custom styling for badges since we might not have all variants in the Badge component
        const getBadgeStyle = (s: string) => {
            switch(s) {
                case 'pending': return 'bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20';
                case 'approved': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20';
                case 'completed': return 'bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20';
                case 'rejected': return 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20';
                case 'cancelled': return 'bg-slate-500/10 text-slate-600 border-slate-500/20 hover:bg-slate-500/20';
                default: return '';
            }
        };

        return (
          <Badge className={`capitalize border ${getBadgeStyle(status)}`} variant="outline">
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'requested_at',
      header: 'Date',
      cell: ({ row }) => {
        const date = new Date(row.getValue('requested_at'));
        return (
          <div className="flex flex-col text-sm text-slate-500 dark:text-slate-400">
            <span>{date.toLocaleDateString()}</span>
            <span className="text-xs">{date.toLocaleTimeString()}</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const request = row.original;
        const status = request.status;

        if (status === 'cancelled' || status === 'rejected' || status === 'completed') {
            return null; // No actions for finalized states
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {status === 'pending' && (
                <>
                  <DropdownMenuItem onClick={() => onApprove(request)} className="text-emerald-600">
                    <Check className="mr-2 h-4 w-4" />
                    Approve Request
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onReject(request)} className="text-red-600">
                    <X className="mr-2 h-4 w-4" />
                    Reject Request
                  </DropdownMenuItem>
                </>
              )}
              {status === 'approved' && (
                <DropdownMenuItem onClick={() => onComplete(request)} className="text-blue-600">
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Mark Completed
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      pageCount={1} // TODO: Implement pagination in service if needed
      pageIndex={0}
      pageSize={data.length}
      onPaginationChange={() => {}}
      isLoading={isLoading}
    />
  );
}
