import { useState } from 'react';
import { useStore } from '@/store';
import { useTranslation } from '@/hooks';
import WalletPortfolioHeroSection from '@/components/Wallet/wallet-portfolio-hero-section';
import WalletTokenBalanceCard from '@/components/Wallet/wallet-token-balance-card';
import WalletTransactionHistoryTable from '@/components/Wallet/wallet-transaction-history-table';

export const Wallet: React.FC = () => {
  const { t } = useTranslation();
  const { user, transactions } = useStore();
  const [hideBalance, setHideBalance] = useState(false);

  // Calculate total balances
  const totalShopBalance = user.shopBalance;
  const totalGrowBalance = user.growBalance + user.stakedGrowBalance;
  const totalPortfolioVND = totalShopBalance / 1000 + (totalGrowBalance * 50000); // GROW @ 50k VND

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 transition-colors duration-300">
      {/* Hero Section - Total Portfolio */}
      <WalletPortfolioHeroSection
        totalPortfolioVND={totalPortfolioVND}
        hideBalance={hideBalance}
        onToggleBalance={() => setHideBalance(!hideBalance)}
      />

      {/* Dual Asset Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* SHOP Token Card */}
        <WalletTokenBalanceCard
          tokenType="SHOP"
          totalBalance={totalShopBalance}
          availableBalance={user.shopBalance}
          stakedBalance={0}
          hideBalance={hideBalance}
          delay={0.1}
        />

        {/* GROW Token Card */}
        <WalletTokenBalanceCard
          tokenType="GROW"
          totalBalance={totalGrowBalance}
          availableBalance={user.growBalance}
          stakedBalance={user.stakedGrowBalance}
          hideBalance={hideBalance}
          delay={0.2}
        />
      </div>

      {/* Transaction History - Blockchain Explorer Style */}
      <WalletTransactionHistoryTable transactions={transactions} />
    </div>
  );
};
