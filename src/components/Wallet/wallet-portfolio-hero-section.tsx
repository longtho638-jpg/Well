/**
 * Wallet Portfolio Hero Section Component
 * Premium hero section displaying total portfolio value
 * Features:
 * - Gradient mesh background with animation
 * - Total portfolio value with animated counter
 * - Growth stats (monthly growth, APY)
 * - Hide balance toggle button
 * - Glassmorphism design
 */

import { motion } from 'framer-motion';
import {
  Wallet as WalletIcon,
  Eye,
  EyeOff,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from '@/hooks';
import WalletAnimatedCounter from './wallet-animated-counter';

interface Props {
  totalPortfolioVND: number;
  hideBalance: boolean;
  onToggleBalance: () => void;
}

export default function WalletPortfolioHeroSection({
  totalPortfolioVND,
  hideBalance,
  onToggleBalance,
}: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-8 overflow-hidden"
    >
      {/* Gradient Background with Mesh Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-zinc-900 to-black rounded-3xl" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzEwYjk4MSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />

      {/* Content */}
      <div className="relative p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <WalletIcon className="w-8 h-8 text-white/90" />
              <h1 className="text-2xl font-bold text-white">{t('wallet.title')}</h1>
            </div>
            <p className="text-white/70 text-sm">{t('wallet.subtitle')}</p>
          </div>
          <button
            onClick={onToggleBalance}
            className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all border border-white/20"
          >
            {hideBalance ? (
              <EyeOff className="w-5 h-5 text-white" />
            ) : (
              <Eye className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {/* Total Portfolio Value */}
        <div className="mb-4">
          <p className="text-zinc-200 text-sm mb-2">{t('wallet.balance.total_assets')}</p>
          {hideBalance ? (
            <p className="text-6xl font-bold text-white">••••••</p>
          ) : (
            <div className="flex items-baseline gap-3">
              <h2 className="text-6xl font-bold text-white font-mono">
                <WalletAnimatedCounter value={totalPortfolioVND} decimals={0} />
              </h2>
              <span className="text-2xl text-zinc-300">{t('common.currency.vnd')}</span>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-zinc-300 text-xs">{t('wallet.balance.this_month')}</p>
              <p className="text-emerald-300 font-semibold">{t('wallet.stats.growth_12_5')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-zinc-300 text-xs">{t('wallet.staking.apy')}</p>
              <p className="text-cyan-300 font-semibold">{t('wallet.stats.apy_12_0')}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
