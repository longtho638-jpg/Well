import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Gift, FileText, QrCode } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { GiftCard, ContentTemplate } from '@/components/MarketingTools';

interface Props {
  giftCardsCount: number;
  contentTemplatesCount: number;
}

/**
 * Marketing Tools Page Header Component
 * Displays page title, subtitle, and 3 stats cards (Gift Cards, Content Templates, Affiliate Link)
 */
export default function MarketingToolsPageHeader({
  giftCardsCount,
  contentTemplatesCount,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="bg-gradient-to-r from-primary via-teal-600 to-primary rounded-2xl p-8 text-white shadow-2xl">
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
          <Sparkles className="w-10 h-10 text-accent" />
        </div>
        <div>
          <h1 className="text-4xl font-bold">{t('marketing.title')}</h1>
          <p className="text-teal-100 text-sm mt-1">{t('marketing.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {/* Gift Cards Stats */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <Gift className="w-6 h-6 text-accent mb-2" />
          <p className="text-sm text-teal-100">{t('marketing.stats.giftCards')}</p>
          <p className="text-2xl font-bold">{giftCardsCount}</p>
        </div>

        {/* Content Templates Stats */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <FileText className="w-6 h-6 text-accent mb-2" />
          <p className="text-sm text-teal-100">{t('marketing.stats.contentTemplates')}</p>
          <p className="text-2xl font-bold">{contentTemplatesCount}</p>
        </div>

        {/* Affiliate Link Stats */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <QrCode className="w-6 h-6 text-accent mb-2" />
          <p className="text-sm text-teal-100">{t('marketing.stats.affiliateLink')}</p>
          <p className="text-2xl font-bold">{t('marketing.stats.active')}</p>
        </div>
      </div>
    </div>
  );
}
