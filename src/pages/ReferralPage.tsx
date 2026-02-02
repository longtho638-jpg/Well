/**
 * WellNexus Referral Hub (Aura Elite Edition)
 * High-performance network orchestration and propagation management.
 */

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Network, TrendingUp } from 'lucide-react';

// Hooks
import { useReferral } from '@/hooks/useReferral';
import { useTranslation } from '@/hooks';

// Components
import { ReferralHero } from '@/components/Referral/ReferralHero';
import { ReferralStatsGroup } from '@/components/Referral/ReferralStatsGroup';
import { ReferralLinkCard } from '@/components/Referral/ReferralLinkCard';
import { ReferralQRCode } from '@/components/Referral/ReferralQRCode';
import { ReferralTrendChart } from '@/components/Referral/ReferralTrendChart';
import { ReferralNetworkView } from '@/components/Referral/ReferralNetworkView';
import { ReferralRewardsList } from '@/components/Referral/ReferralRewardsList';
import TabButton from '@/components/Referral/TabButton';
import { GridPattern } from '@/components/ui/Aura';
import { ParticleBackground } from '@/components/ParticleBackground';
import { CursorGlow } from '@/components/CursorGlow';

const trendData = [
  { month: 'T1', referrals: 0, revenue: 0 },
  { month: 'T2', referrals: 1, revenue: 1200000 },
  { month: 'T3', referrals: 2, revenue: 2050000 },
  { month: 'T4', referrals: 3, revenue: 2570000 },
  { month: 'T5', referrals: 4, revenue: 2570000 }
];

export const ReferralPage: React.FC = () => {
  const { t } = useTranslation();
  const {
    copiedLink,
    selectedTab,
    setSelectedTab,
    showQRCode,
    setShowQRCode,
    referralUrl,
    qrCodeUrl,
    stats,
    f1Referrals,
    f2Referrals,
    copyReferralLink,
    shareViaZalo,
    shareViaFacebook,
    shareViaTelegram,
    shareViaEmail,
    downloadQRCode
  } = useReferral();

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden transition-colors duration-500 pb-20">
      <GridPattern />
      <ParticleBackground />
      <CursorGlow />

      <div className="relative z-10 px-6 lg:px-12 py-10 space-y-12 max-w-[1600px] mx-auto">
        <ReferralHero
          title={t('referral.title')}
          subtitle={t('referral.subtitle')}
          description={t('referral.description')}
          totalBonus={stats.totalBonus}
          monthlyReferrals={stats.monthlyReferrals}
        />

        <ReferralStatsGroup
          totalReferrals={stats.totalReferrals}
          activeReferrals={stats.activeReferrals}
          conversionRate={stats.conversionRate}
          monthlyReferrals={stats.monthlyReferrals}
          t={t}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7">
            <ReferralLinkCard
              referralUrl={referralUrl}
              copiedLink={copiedLink}
              onCopy={copyReferralLink}
              onShareZalo={shareViaZalo}
              onShareFB={shareViaFacebook}
              onShareTelegram={shareViaTelegram}
              onShareEmail={shareViaEmail}
              onToggleQR={() => setShowQRCode(!showQRCode)}
              showQRCode={showQRCode}
              t={t}
            />
          </div>
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              {showQRCode ? (
                <ReferralQRCode
                  key="qr"
                  qrCodeUrl={qrCodeUrl}
                  onDownload={downloadQRCode}
                />
              ) : (
                <ReferralRewardsList key="rewards" />
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex gap-4 border-b border-white/5 pb-1">
          <TabButton
            active={selectedTab === 'overview'}
            onClick={() => setSelectedTab('overview')}
            icon={TrendingUp}
            label="Propagation Analytics"
          />
          <TabButton
            active={selectedTab === 'network'}
            onClick={() => setSelectedTab('network')}
            icon={Network}
            label={`Node Topology (${f1Referrals.length + f2Referrals.length})`}
          />
        </div>

        <AnimatePresence mode="wait">
          {selectedTab === 'overview' ? (
            <ReferralTrendChart key="chart" data={trendData} />
          ) : (
            <ReferralNetworkView
              key="network"
              f1Referrals={f1Referrals}
              f2Referrals={f2Referrals}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReferralPage;

