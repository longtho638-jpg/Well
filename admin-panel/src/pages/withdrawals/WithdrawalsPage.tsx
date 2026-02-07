import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import withdrawalService, { WithdrawalRequest } from '@/services/withdrawal-service';
import { RequestsTable } from '@/components/withdrawals/requests-table';
import { ActionModal } from '@/components/withdrawals/action-modal';
import { WithdrawalStats } from '@/components/withdrawals/withdrawal-stats';
import { Button } from '@/components/ui/Button';
import { Loader2, RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner'; // Assuming sonner is used, or console if not available. Will check context.
import { exportToCSV, CSVColumn } from '@/utils/csv-export-utility';

// Simple Tabs implementation since we might not have shadcn Tabs
const Tabs = ({
  activeTab,
  onTabChange,
  counts
}: {
  activeTab: 'pending' | 'history';
  onTabChange: (tab: 'pending' | 'history') => void;
  counts?: { pending: number };
}) => {
  return (
    <div className="flex space-x-1 rounded-xl bg-slate-100 p-1 dark:bg-zinc-800 w-fit">
      <button
        onClick={() => onTabChange('pending')}
        className={`
          flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all
          ${activeTab === 'pending'
            ? 'bg-white text-slate-900 shadow dark:bg-zinc-950 dark:text-slate-100'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'}
        `}
      >
        Pending Requests
        {counts?.pending ? (
          <span className="ml-1 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] text-white">
            {counts.pending}
          </span>
        ) : null}
      </button>
      <button
        onClick={() => onTabChange('history')}
        className={`
          flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all
          ${activeTab === 'history'
            ? 'bg-white text-slate-900 shadow dark:bg-zinc-950 dark:text-slate-100'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'}
        `}
      >
        History
      </button>
    </div>
  );
};

export default function WithdrawalsPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | 'complete' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const queryClient = useQueryClient();

  // Fetch all withdrawals
  const {
    data: withdrawals = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: () => withdrawalService.getAllWithdrawals(),
  });

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-withdrawals-stats'],
    queryFn: () => withdrawalService.getWithdrawalStats(),
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-withdrawals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawal_requests',
        },
        () => {
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
          queryClient.invalidateQueries({ queryKey: ['admin-withdrawals-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (activeTab === 'pending') {
      return w.status === 'pending';
    }
    return w.status !== 'pending';
  });

  const handleActionClick = (request: WithdrawalRequest, action: 'approve' | 'reject' | 'complete') => {
    setSelectedRequest(request);
    setModalAction(action);
    setModalOpen(true);
  };

  const handleConfirmAction = async (notes?: string) => {
    if (!selectedRequest || !modalAction) return;

    setIsProcessing(true);
    try {
      if (modalAction === 'complete') {
        await withdrawalService.completeWithdrawal(selectedRequest.id, notes);
        toast.success('Withdrawal marked as completed');
      } else {
        await withdrawalService.processWithdrawal(selectedRequest.id, modalAction, notes);
        toast.success(`Withdrawal ${modalAction}d successfully`);
      }
      setModalOpen(false);
      setSelectedRequest(null);
      setModalAction(null);
    } catch (error) {
      console.error('Action failed:', error);
      toast.error(`Failed to ${modalAction} request`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      // Define CSV columns
      const columns: CSVColumn[] = [
        { key: 'id', header: 'Request ID', formatter: (id) => id.slice(0, 8) },
        { key: 'user', header: 'User', formatter: (user) => user?.name || user?.email || 'N/A' },
        {
          key: 'amount',
          header: 'Amount (VND)',
          formatter: (amount) => new Intl.NumberFormat('vi-VN').format(amount)
        },
        { key: 'bank_name', header: 'Bank' },
        { key: 'bank_account_number', header: 'Account Number' },
        { key: 'bank_account_name', header: 'Account Name' },
        { key: 'status', header: 'Status' },
        {
          key: 'requested_at',
          header: 'Request Date',
          formatter: (date) => new Date(date).toLocaleString('vi-VN')
        },
        {
          key: 'processed_at',
          header: 'Processed Date',
          formatter: (date) => date ? new Date(date).toLocaleString('vi-VN') : 'N/A'
        },
        { key: 'processed_by', header: 'Processed By', formatter: (v) => v || 'N/A' },
        { key: 'notes', header: 'Notes', formatter: (v) => v || '' },
      ];

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `withdrawals-export-${timestamp}.csv`;

      // Export data
      exportToCSV(filteredWithdrawals, columns, filename);

      toast.success(`Exported ${filteredWithdrawals.length} withdrawal records`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Withdrawal Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage and process distributor withdrawal requests
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={isExporting || filteredWithdrawals.length === 0}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <WithdrawalStats
        stats={stats || null}
        isLoading={statsLoading}
      />

      <div className="space-y-4">
        <Tabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={{ pending: stats?.pendingCount || 0 }}
        />

        <div className="rounded-xl border border-white/20 bg-white/50 p-1 backdrop-blur-sm dark:bg-zinc-900/40">
          <RequestsTable
            data={filteredWithdrawals}
            isLoading={isLoading}
            onApprove={(req) => handleActionClick(req, 'approve')}
            onReject={(req) => handleActionClick(req, 'reject')}
            onComplete={(req) => handleActionClick(req, 'complete')}
          />
        </div>
      </div>

      <ActionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmAction}
        action={modalAction}
        isLoading={isProcessing}
        withdrawalAmount={selectedRequest?.amount}
        userName={selectedRequest?.user?.name}
      />
    </div>
  );
}
