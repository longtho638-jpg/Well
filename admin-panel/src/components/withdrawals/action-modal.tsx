import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes?: string) => Promise<void>;
  action: 'approve' | 'reject' | 'complete' | null;
  isLoading: boolean;
  withdrawalAmount?: number;
  userName?: string;
}

export function ActionModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  isLoading,
  withdrawalAmount,
  userName,
}: ActionModalProps) {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (action === 'reject' && !notes.trim()) {
      setError('Reason is required for rejection');
      return;
    }
    setError('');
    await onConfirm(notes);
    setNotes('');
  };

  const getTitle = () => {
    switch (action) {
      case 'approve':
        return 'Approve Withdrawal Request';
      case 'reject':
        return 'Reject Withdrawal Request';
      case 'complete':
        return 'Mark Withdrawal as Completed';
      default:
        return '';
    }
  };

  const getDescription = () => {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(withdrawalAmount || 0);

    switch (action) {
      case 'approve':
        return `Are you sure you want to approve the withdrawal of ${formattedAmount} for ${userName}? This will move the request to approved status.`;
      case 'reject':
        return `Are you sure you want to reject the withdrawal of ${formattedAmount} for ${userName}? The amount will be refunded to their balance.`;
      case 'complete':
        return `Confirm that you have transferred ${formattedAmount} to ${userName}. This will mark the request as completed.`;
      default:
        return '';
    }
  };

  const getActionColor = () => {
    switch (action) {
      case 'approve':
      case 'complete':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white';
      case 'reject':
        return 'bg-red-600 hover:bg-red-700 text-white';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isLoading && !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === 'reject' ? (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            )}
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label
              htmlFor="notes"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900 dark:text-slate-100"
            >
              {action === 'reject' ? 'Rejection Reason (Required)' : 'Notes (Optional)'}
            </label>
            <textarea
              id="notes"
              className={cn(
                "flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-slate-400",
                error
                  ? "border-red-500 focus-visible:ring-red-500"
                  : "border-slate-200 focus-visible:ring-slate-950 dark:border-white/10 dark:focus-visible:ring-slate-300"
              )}
              placeholder={action === 'reject' ? "Please explain why this request is being rejected..." : "Add any internal notes here..."}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (error) setError('');
              }}
              disabled={isLoading}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className={getActionColor()}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Complete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
