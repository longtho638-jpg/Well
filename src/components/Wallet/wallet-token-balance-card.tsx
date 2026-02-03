/**
 * Wallet Token Balance Card Component
 * Reusable card for displaying SHOP and GROW token balances
 * Features:
 * - Glassmorphism design with glow effects
 * - Balance display with breakdown (available/locked/staked)
 * - Staking reward estimation (GROW only)
 * - Action buttons (deposit/withdraw/stake)
 * - Hide balance toggle support
 */

import { motion } from 'framer-motion';
import { Coins, Zap, Download, Upload, Lock, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { calculateStakingReward } from '@/utils/tokenomics';
import WalletAnimatedCounter from './wallet-animated-counter';

type TokenType = 'SHOP' | 'GROW';

interface Props {
  tokenType: TokenType;
  totalBalance: number;
  availableBalance: number;
  stakedBalance: number;
  hideBalance: boolean;
  delay?: number;
}

export default function WalletTokenBalanceCard({
  tokenType,
  totalBalance,
  availableBalance,
  stakedBalance,
  hideBalance,
  delay = 0,
}: Props) {
  const { t, i18n } = useTranslation();

  const isSHOP = tokenType === 'SHOP';
  const isGROW = tokenType === 'GROW';

  // Config for each token type
  const config = {
    SHOP: {
      icon: Coins,
      gradient: 'from-teal-500 to-cyan-500',
      glowColor: 'from-teal-500 to-cyan-500',
      shadowColor: 'shadow-teal-500/30',
      hoverShadow: 'hover:shadow-teal-500/50',
      borderHover: 'hover:border-emerald-500/30',
      title: t('wallet.balance.shopToken'),
      subtitle: t('wallet.balance.vnd_stablecoin'),
      valueColor: 'text-teal-600 dark:text-teal-400',
      primaryBtnGradient: 'from-teal-500 to-cyan-500',
      primaryBtnHover: 'hover:from-teal-600 hover:to-cyan-600',
      primaryBtnShadow: 'shadow-teal-500/40 hover:shadow-teal-500/50',
      showStaking: false,
    },
    GROW: {
      icon: Zap,
      gradient: 'from-purple-500 via-pink-500 to-purple-600',
      glowColor: 'from-purple-500 via-pink-500 to-purple-600',
      shadowColor: 'shadow-purple-500/30',
      hoverShadow: 'hover:shadow-purple-500/50',
      borderHover: 'hover:border-purple-500/30',
      title: t('wallet.balance.growToken'),
      subtitle: t('wallet.balance.governance_token'),
      valueColor: 'text-purple-600 dark:text-purple-400',
      primaryBtnGradient: 'from-purple-500 via-pink-500 to-purple-600',
      primaryBtnHover: 'hover:from-purple-600 hover:via-pink-600 hover:to-purple-700',
      primaryBtnShadow: 'shadow-purple-500/40 hover:shadow-purple-500/50',
      showStaking: true,
    },
  };

  const cfg = config[tokenType];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: isSHOP ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="relative group"
    >
      {/* Glow Effect */}
      <div className={`absolute inset-0 bg-gradient-to-r ${cfg.glowColor} rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity`} />

      {/* Card Content - Glassmorphism */}
      <div className={`relative bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 ${cfg.borderHover} transition-all shadow-sm`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-lg ${cfg.shadowColor} ${isGROW ? 'animate-pulse' : ''}`}>
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-zinc-900 dark:text-white text-lg font-bold">
                {cfg.title}
              </p>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs">{cfg.subtitle}</p>
            </div>
          </div>
          {isGROW && (
            <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold">
              {t('wallet.staking.apy')} {t('wallet.stats.apy_12_percent')}
            </div>
          )}
        </div>

        {/* Balance */}
        <div className="mb-6">
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-2">
            {t('wallet.balance.total')}
          </p>
          {hideBalance ? (
            <p className="text-5xl font-bold text-zinc-900 dark:text-white">••••••</p>
          ) : (
            <>
              <p className="text-5xl font-bold text-zinc-900 dark:text-white font-mono mb-1">
                <WalletAnimatedCounter value={totalBalance} decimals={isGROW ? 2 : 0} />
              </p>
              {isSHOP && (
                <p className={`${cfg.valueColor} text-lg font-mono`}>
                  ≈ {(totalBalance / 1000).toLocaleString(i18n.language)} {t('common.currency.vnd')}
                </p>
              )}
              {isGROW && (
                <p className={`${cfg.valueColor} text-lg font-mono`}>{t('common.currency.grow')}</p>
              )}
            </>
          )}
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-black/20 rounded-2xl border border-white/5">
          <div>
            <p className="text-gray-500 text-xs mb-1">
              {t('wallet.balance.available')}
            </p>
            <p className="text-white font-mono text-sm font-semibold">
              {hideBalance ? '••••' : availableBalance.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-zinc-500 dark:text-gray-500 text-xs mb-1">
              {t('wallet.balance.locked')}
            </p>
            <p className="text-amber-500 dark:text-amber-400 font-mono text-sm font-semibold">0</p>
          </div>
          <div>
            <p className="text-zinc-500 dark:text-gray-500 text-xs mb-1">
              {t('wallet.balance.staked')}
            </p>
            <p className={`${cfg.valueColor} font-mono text-sm font-semibold`}>
              {hideBalance ? '••••' : (stakedBalance > 0 ? stakedBalance.toLocaleString() : '0')}
            </p>
          </div>
        </div>

        {/* Staking Info (GROW only) */}
        {isGROW && stakedBalance > 0 && !hideBalance && (
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-xl border border-purple-500/30 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-xs mb-1">
                  {t('wallet.staking.estimatedReward')} ({t('wallet.staking.days', { count: 90 })})
                </p>
                <p className="text-purple-200 font-mono text-lg font-bold flex items-center gap-2">
                  +{calculateStakingReward(stakedBalance, 0.12, 90).toFixed(2)} {t('common.currency.grow')}
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {isSHOP ? (
            <>
              <button className={`flex-1 bg-gradient-to-r ${cfg.primaryBtnGradient} ${cfg.primaryBtnHover} text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl ${cfg.primaryBtnShadow} hover:shadow-2xl hover:-translate-y-0.5`}>
                <Download className="w-5 h-5" />
                {t('wallet.actions.deposit_shop')}
              </button>
              <button className="flex-1 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-700 hover:-translate-y-0.5 shadow-sm">
                <Upload className="w-5 h-5" />
                {t('wallet.actions.withdraw')}
              </button>
            </>
          ) : (
            <>
              <button className={`flex-1 bg-gradient-to-r ${cfg.primaryBtnGradient} ${cfg.primaryBtnHover} text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl ${cfg.primaryBtnShadow} hover:shadow-2xl hover:-translate-y-0.5`}>
                <Lock className="w-5 h-5" />
                {t('wallet.actions.stake')}
              </button>
              <button className="flex-1 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-700 hover:-translate-y-0.5 shadow-sm">
                <TrendingUp className="w-5 h-5" />
                {t('wallet.staking.rewards')}
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
