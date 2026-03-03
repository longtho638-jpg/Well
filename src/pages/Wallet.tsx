import React, { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { useStakingRewards } from '@/hooks/use-staking-rewards';
import { useTranslation } from '@/hooks';
import WalletPortfolioHeroSection from '@/components/Wallet/wallet-portfolio-hero-section';
import WalletTokenBalanceCard from '@/components/Wallet/wallet-token-balance-card';
import WalletTransactionHistoryTable from '@/components/Wallet/wallet-transaction-history-table';
import { motion } from 'framer-motion';
import { Lock, Gift, TrendingUp } from 'lucide-react';
import { STAKING_TIERS } from '@/services/staking-rewards-service';


const WalletPage: React.FC = () => {
  const { user, transactions } = useStore();
  const { t } = useTranslation();
  const [hideBalance, setHideBalance] = useState(false);
  const staking = useStakingRewards(user.id || null);

  const totalShopBalance = user.shopBalance;
  const totalGrowBalance = useMemo(() => user.growBalance + user.stakedGrowBalance, [user.growBalance, user.stakedGrowBalance]);
  const GROW_TO_VND_RATE = 10000;
  const totalPortfolioVND = useMemo(() => totalShopBalance + (totalGrowBalance * GROW_TO_VND_RATE), [totalShopBalance, totalGrowBalance]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 transition-colors duration-300">
      <WalletPortfolioHeroSection
        totalPortfolioVND={totalPortfolioVND}
        hideBalance={hideBalance}
        onToggleBalance={() => setHideBalance(!hideBalance)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <WalletTokenBalanceCard
          tokenType="SHOP"
          totalBalance={totalShopBalance}
          availableBalance={user.shopBalance}
          stakedBalance={0}
          hideBalance={hideBalance}
          delay={0.1}
        />
        <WalletTokenBalanceCard
          tokenType="GROW"
          totalBalance={totalGrowBalance}
          availableBalance={user.growBalance}
          stakedBalance={user.stakedGrowBalance}
          hideBalance={hideBalance}
          delay={0.2}
        />
      </div>

      {/* Staking Tiers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-500" />
          {t('wallet.staking_tiers')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAKING_TIERS.map((tier) => (
            <div
              key={tier.lockPeriod}
              className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-xl p-4"
            >
              <div className="text-sm text-zinc-500 dark:text-zinc-400">{tier.label}</div>
              <div className="text-2xl font-bold text-emerald-500 mt-1">{tier.apy}% APY</div>
              <div className="text-xs text-zinc-400 mt-2">Min: {tier.minAmount} GROW</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Staking Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
      >
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-xl p-4 flex items-center gap-3">
          <Lock className="w-8 h-8 text-blue-500" />
          <div>
            <div className="text-xs text-zinc-500">{t('wallet.total_staked')}</div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white">
              {hideBalance ? '***' : `${staking.metrics.totalStaked} GROW`}
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-xl p-4 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-emerald-500" />
          <div>
            <div className="text-xs text-zinc-500">{t('wallet.total_earned')}</div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white">
              {hideBalance ? '***' : `${staking.metrics.totalEarned} GROW`}
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-xl p-4 flex items-center gap-3">
          <Gift className="w-8 h-8 text-amber-500" />
          <div>
            <div className="text-xs text-zinc-500">{t('wallet.pending_rewards')}</div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white">
              {hideBalance ? '***' : `${staking.metrics.pendingRewards} GROW`}
            </div>
          </div>
        </div>
      </motion.div>

      <WalletTransactionHistoryTable transactions={transactions} />
    </div>
  );
};

export const Wallet = React.memo(WalletPage);
