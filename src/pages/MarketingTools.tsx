import { uiLogger } from '@/utils/logger';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store';
import { useTranslation } from '@/hooks';
import { LandingPageTemplateType, UserLandingPage } from '@/types';
import {
  GiftCardSection,
  ContentLibrarySection,
  AffiliateLinkSection,
  GiftCard,
  ContentTemplate,
} from '@/components/MarketingTools';
import MarketingToolsPageHeader from '@/components/MarketingTools/marketing-tools-page-header';
import AiLandingPageBuilder from '@/components/MarketingTools/ai-landing-page-builder';

// Sample content templates
const getContentTemplates = (t: (key: string) => string): ContentTemplate[] => [
  {
    id: '1',
    title: t('marketing.templates.t1.title'),
    content: t('marketing.templates.t1.content'),
    imageUrl: 'https://images.unsplash.com/photo-1541480601022-2308c0f02487?w=800',
    category: 'product'
  },
  {
    id: '2',
    title: t('marketing.templates.t2.title'),
    content: t('marketing.templates.t2.content'),
    imageUrl: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800',
    category: 'testimonial'
  },
  {
    id: '3',
    title: t('marketing.templates.t3.title'),
    content: t('marketing.templates.t3.content'),
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
    category: 'tips'
  },
  {
    id: '4',
    title: t('marketing.templates.t4.title'),
    content: t('marketing.templates.t4.content'),
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
    category: 'promotion'
  }
];

/**
 * Marketing Tools Page
 * Main orchestration page for marketing tools including:
 * - Gift cards management
 * - Content library templates
 * - Affiliate links & QR codes
 * - AI landing page builder
 */
export default function MarketingTools() {
  const { t } = useTranslation();
  const contentTemplates = getContentTemplates(t);
  const { user, landingPageTemplates, userLandingPages, createLandingPage, publishLandingPage } = useStore();

  const [giftCards, setGiftCards] = useState<GiftCard[]>([
    {
      id: '1',
      code: 'AN-200K',
      discount: 200000,
      type: 'fixed',
      usageCount: 12,
      createdAt: new Date('2025-01-15')
    },
    {
      id: '2',
      code: 'ANIMA15',
      discount: 15,
      type: 'percentage',
      usageCount: 8,
      createdAt: new Date('2025-01-10')
    }
  ]);

  // Affiliate link
  const affiliateLink = `https://wellnexus.vn/ref/${user.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(affiliateLink)}&bgcolor=00575A&color=FFBF00`;

  const handleCreateGiftCard = (cardData: Omit<GiftCard, 'id' | 'usageCount' | 'createdAt'>) => {
    const newCard: GiftCard = {
      ...cardData,
      id: Date.now().toString(),
      usageCount: 0,
      createdAt: new Date()
    };
    setGiftCards(prev => [newCard, ...prev]);
  };

  const handleDownloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadQRCode = () => {
    handleDownloadImage(qrCodeUrl, `qr-code-${user.id}.png`);
  };

  const handleShareQRCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('marketing.affiliate.shareTitle'),
          text: t('marketing.affiliate.shareText'),
          url: affiliateLink
        });
      } catch {
        // User cancelled share - no action needed
      }
    } else {
      navigator.clipboard.writeText(affiliateLink);
    }
  };

  const handleCreateLandingPage = async (templateType: string, portraitUrl?: string): Promise<UserLandingPage> => {
    try {
      return await createLandingPage(templateType as LandingPageTemplateType, portraitUrl);
    } catch (error) {
      uiLogger.error('Failed to create landing page', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 dark:from-slate-900 via-purple-50 dark:via-slate-800 to-pink-50 dark:to-slate-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Page Header */}
        <MarketingToolsPageHeader
          giftCardsCount={giftCards.length}
          contentTemplatesCount={contentTemplates.length}
        />

        {/* Gift Card Section */}
        <GiftCardSection
          giftCards={giftCards}
          onCreateCard={handleCreateGiftCard}
        />

        {/* Content Library Section */}
        <ContentLibrarySection
          templates={contentTemplates}
          onDownloadImage={handleDownloadImage}
        />

        {/* Affiliate Link & QR Code Section */}
        <AffiliateLinkSection
          userId={user.id}
          userName={user.name}
          affiliateLink={affiliateLink}
          qrCodeUrl={qrCodeUrl}
          onDownloadQRCode={handleDownloadQRCode}
          onShareQRCode={handleShareQRCode}
        />

        {/* AI Landing Builder Section */}
        <AiLandingPageBuilder
          user={user}
          landingPageTemplates={landingPageTemplates}
          userLandingPages={userLandingPages}
          onCreateLandingPage={handleCreateLandingPage}
          onPublishLandingPage={publishLandingPage}
        />
      </motion.div>
    </div>
  );
}
