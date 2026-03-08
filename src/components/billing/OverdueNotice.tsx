/**
 * Overdue Notice Component
 * Displays payment failure notice with retry countdown
 */

import React from 'react';
import { AlertTriangle, CreditCard, X } from 'lucide-react';

interface OverdueNoticeProps {
  daysUntilCancel: number;
  amountDue: number;
  onUpdatePayment: () => void;
  onDismiss?: () => void;
}

export const OverdueNotice: React.FC<OverdueNoticeProps> = ({
  daysUntilCancel,
  amountDue,
  onUpdatePayment,
  onDismiss,
}) => {
  return (
    <div className="relative rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-red-500/10 p-6">
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Icon */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-amber-500/20">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
        </div>
        <h3 className="text-lg font-bold text-white">Thanh toán quá hạn</h3>
      </div>

      {/* Message */}
      <p className="text-zinc-300 mb-4">
        Thanh toán subscription của bạn đã thất bại. Chúng tôi sẽ thử lại sau {daysUntilCancel} ngày.
      </p>

      {/* Amount */}
      <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/10 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-zinc-400" />
            <span className="text-zinc-400">Số tiền cần thanh toán</span>
          </div>
          <span className="text-2xl font-bold text-amber-400">
            ${(amountDue / 100).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Countdown */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-zinc-400">Hủy sau</span>
          <span className={`font-medium ${daysUntilCancel <= 3 ? 'text-red-400' : 'text-amber-400'}`}>
            {daysUntilCancel} ngày
          </span>
        </div>
        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${daysUntilCancel <= 3 ? 'bg-red-500' : 'bg-amber-500'}`}
            style={{ width: `${(daysUntilCancel / 7) * 100}%` }}
          />
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onUpdatePayment}
        className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-colors flex items-center justify-center gap-2"
      >
        <CreditCard className="w-5 h-5" />
        Cập nhật phương thức thanh toán
      </button>
    </div>
  );
};
