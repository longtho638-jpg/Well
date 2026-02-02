import { uiLogger } from '@/utils/logger';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Gift,
  Sparkles,
  FileText,
  QrCode,
  Wand2,
  Palette,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Eye,
  TrendingUp,
  BarChart3,
  ExternalLink,
  Copy,
} from 'lucide-react';
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

// Sample content templates - moved inside component or use translation keys if strictly needed
// For now keeping static content but translating categories
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

  const [copiedText, setCopiedText] = useState<string | null>(null);

  // AI Landing Builder State
  const [selectedTemplate, setSelectedTemplate] = useState<LandingPageTemplateType>('expert');
  const [portraitUrl, setPortraitUrl] = useState<string>('');
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [generatedLandingPage, setGeneratedLandingPage] = useState<UserLandingPage | null>(null);

  // Affiliate link
  const affiliateLink = `https://wellnexus.vn/ref/${user.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(affiliateLink)}&bgcolor=00575A&color=FFBF00`;

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

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

  // AI Landing Builder Handlers
  const handleGenerateBio = async () => {
    setIsGeneratingBio(true);
    try {
      const newPage = await createLandingPage(selectedTemplate, portraitUrl || undefined);
      setGeneratedLandingPage(newPage);
    } catch (error) {
      uiLogger.error('Failed to generate landing page', error);
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const handlePublishLandingPage = () => {
    if (generatedLandingPage) {
      publishLandingPage(generatedLandingPage.id);
      setGeneratedLandingPage({ ...generatedLandingPage, isPublished: true });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPortraitUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
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
        <div className="bg-gradient-to-r from-primary via-teal-600 to-primary rounded-2xl p-8 text-white shadow-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
              <Sparkles className="w-10 h-10 text-accent" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">{t('marketing.title')}</h1>
              <p className="text-teal-100 text-sm mt-1">
                {t('marketing.subtitle')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <Gift className="w-6 h-6 text-accent mb-2" />
              <p className="text-sm text-teal-100">{t('marketing.stats.giftCards')}</p>
              <p className="text-2xl font-bold">{giftCards.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <FileText className="w-6 h-6 text-accent mb-2" />
              <p className="text-sm text-teal-100">{t('marketing.stats.contentTemplates')}</p>
              <p className="text-2xl font-bold">{contentTemplates.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <QrCode className="w-6 h-6 text-accent mb-2" />
              <p className="text-sm text-teal-100">{t('marketing.stats.affiliateLink')}</p>
              <p className="text-2xl font-bold">{t('marketing.stats.active')}</p>
            </div>
          </div>
        </div>


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

        {/* AI Landing Builder Section - TREE MAX LEVEL */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 border-b border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl shadow-lg">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  {t('marketingtools.ai_landing_builder')}<span className="bg-accent text-primary text-xs px-3 py-1 rounded-full font-bold">{t('marketingtools.new')}</span>
                </h2>
                <p className="text-white/90 text-sm">{t('marketingtools.t_o_trang_tuy_n_d_ng_chuy_n_ng')}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Template Selection */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-purple-600" />
                    {t('marketingtools.ch_n_template')}</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {landingPageTemplates.map((template) => (
                      <motion.button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.type)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300 ${selectedTemplate === template.type
                          ? 'ring-4 ring-purple-500 bg-gradient-to-r from-purple-50 dark:from-slate-700 to-pink-50 dark:to-slate-700'
                          : 'bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600'
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={template.imageUrl}
                            alt={template.name}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 dark:text-slate-100">{template.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-slate-400">{template.description}</p>
                          </div>
                          {selectedTemplate === template.type && (
                            <CheckCircle2 className="w-6 h-6 text-purple-600" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Portrait Upload */}
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-purple-600" />
                    {t('marketingtools.upload_nh_ch_n_dung')}</h3>
                  <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-6 hover:border-purple-500 dark:hover:border-purple-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="portrait-upload"
                    />
                    <label htmlFor="portrait-upload" className="cursor-pointer">
                      {portraitUrl ? (
                        <div className="flex items-center gap-4">
                          <img
                            src={portraitUrl}
                            alt="Portrait"
                            className="w-20 h-20 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{t('marketingtools.nh_t_i_l_n')}</p>
                            <p className="text-xs text-gray-600">{t('marketingtools.click_thay_i')}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{t('marketingtools.click_t_i_nh_l_n')}</p>
                          <p className="text-xs text-gray-600 dark:text-slate-400">{t('marketingtools.jpg_png_t_i_a_5mb')}</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerateBio}
                  disabled={isGeneratingBio}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:active:scale-100"
                >
                  {isGeneratingBio ? (
                    <>
                      <Sparkles className="w-6 h-6 animate-spin" />
                      {t('marketingtools.ai_ang_vi_t_c_u_chuy_n')}</>
                  ) : (
                    <>
                      <Wand2 className="w-6 h-6" />
                      {t('marketingtools.ai_vi_t_c_u_chuy_n_c_a_t_i')}</>
                  )}
                </button>
              </div>

              {/* Preview / Result */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-600" />
                  {t('marketingtools.preview_landing_page')}</h3>

                {generatedLandingPage ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-purple-50 dark:from-slate-700 to-pink-50 dark:to-slate-700 rounded-xl p-6 border-2 border-purple-200 dark:border-slate-600"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      {portraitUrl && (
                        <img
                          src={portraitUrl}
                          alt="Portrait"
                          className="w-24 h-24 rounded-full object-cover ring-4 ring-white dark:ring-slate-800 shadow-lg"
                        />
                      )}
                      <div>
                        <h4 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{user.name}</h4>
                        <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">{user.rank}</p>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {generatedLandingPage.aiGeneratedBio}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg p-3">
                        <span className="text-sm text-gray-600 dark:text-slate-400">{t('marketingtools.link_landing_page')}</span>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                            {generatedLandingPage.publishedUrl}
                          </code>
                          <button
                            onClick={() => handleCopyText(generatedLandingPage.publishedUrl, 'landing-url')}
                            className="p-1 hover:bg-purple-100 rounded"
                          >
                            {copiedText === 'landing-url' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-purple-600" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                          <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                          <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{generatedLandingPage.views}</p>
                          <p className="text-xs text-gray-600 dark:text-slate-400">{t('marketingtools.l_t_xem')}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                          <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
                          <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{generatedLandingPage.conversions}</p>
                          <p className="text-xs text-gray-600 dark:text-slate-400">{t('marketingtools.chuy_n_i')}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                          <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                          <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
                            {generatedLandingPage.views > 0
                              ? ((generatedLandingPage.conversions / generatedLandingPage.views) * 100).toFixed(1)
                              : '0.0'}%
                          </p>
                          <p className="text-xs text-gray-600 dark:text-slate-400">{t('marketingtools.t_l')}</p>
                        </div>
                      </div>

                      {!generatedLandingPage.isPublished ? (
                        <button
                          onClick={handlePublishLandingPage}
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg active:scale-95 transition-all duration-300"
                        >
                          <ExternalLink className="w-5 h-5" />
                          {t('marketingtools.xu_t_b_n_ngay')}</button>
                      ) : (
                        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-600 rounded-xl p-4 text-center">
                          <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                          <p className="text-sm font-bold text-green-800 dark:text-green-300">{t('marketingtools.landing_page_xu_t_b_n')}</p>
                          <p className="text-xs text-green-700 dark:text-green-400">{t('marketingtools.link_s_n_s_ng_chia_s')}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-12 text-center border-2 border-dashed border-gray-300 dark:border-slate-600">
                    <Wand2 className="w-16 h-16 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-slate-300 font-medium">{t('marketingtools.ch_n_template_v_click_ai_vi')}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">{t('marketingtools.ai_s_t_o_landing_page_chuy_n')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Existing Landing Pages */}
            {userLandingPages.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-700">
                <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-4">{t('marketingtools.landing_pages_t_o')}{userLandingPages.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userLandingPages.map((page) => (
                    <div
                      key={page.id}
                      className="bg-gradient-to-br from-purple-50 dark:from-slate-700 to-pink-50 dark:to-slate-700 rounded-xl p-4 border border-purple-200 dark:border-slate-600"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-900 dark:text-slate-100">{page.template}</span>
                        {page.isPublished && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">
                            {t('marketingtools.live')}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-slate-400">
                        <span>👁️ {page.views} {t('marketingtools.views')}</span>
                        <span>✅ {page.conversions} {t('marketingtools.conversions')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
