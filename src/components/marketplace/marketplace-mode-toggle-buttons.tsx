/**
 * Marketplace mode toggle — shopping vs redemption zone switcher buttons
 */

import React from 'react';
import { ShoppingCart, Award } from 'lucide-react';

interface Props {
  showRedemption: boolean;
  onShop: () => void;
  onRedeem: () => void;
  shopLabel: string;
  redeemLabel: string;
}

export const MarketplaceModeToggleButtons: React.FC<Props> = ({
  showRedemption,
  onShop,
  onRedeem,
  shopLabel,
  redeemLabel,
}) => (
  <div className="flex gap-4">
    <button
      onClick={onShop}
      className={`flex-1 px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-3 ${
        !showRedemption
          ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xl'
          : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
      }`}
    >
      <ShoppingCart size={20} />
      {shopLabel}
    </button>

    <button
      onClick={onRedeem}
      className={`flex-1 px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-3 ${
        showRedemption
          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xl shadow-purple-900/40'
          : 'text-zinc-400 hover:text-purple-500 dark:hover:text-purple-400'
      }`}
    >
      <Award size={20} />
      {redeemLabel}
    </button>
  </div>
);
