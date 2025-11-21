import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Gift,
  Copy,
  Download,
  Image as ImageIcon,
  Share2,
  CheckCircle2,
  Plus,
  QrCode,
  Eye,
  TrendingUp,
  FileText,
  Link as LinkIcon,
  Sparkles,
  Tag,
  Palette,
  Upload,
  Wand2,
  ExternalLink,
  BarChart3
} from 'lucide-react';
import { useStore } from '@/store';
import { formatVND, formatNumber } from '@/utils/format';
import { useTranslation } from '@/hooks';
import { LandingPageTemplateType } from '@/types';

// Gift Card Interface
interface GiftCard {
  id: string;
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  usageCount: number;
  createdAt: Date;
}

// Content Template Interface
interface ContentTemplate {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  category: 'product' | 'testimonial' | 'tips' | 'promotion';
}

// Sample content templates
const contentTemplates: ContentTemplate[] = [
  {
    id: '1',
    title: 'Giới thiệu ANIMA 119',
    content: '🌿 ANIMA 119 - Giải pháp vàng cho giấc ngủ ngon!\n\n✨ Bạn đang gặp khó khăn với giấc ngủ?\n✨ Thường xuyên lo âu, căng thẳng?\n✨ Muốn cải thiện sức khỏe thần kinh?\n\n💊 ANIMA 119 là câu trả lời hoàn hảo:\n✅ Giúp ngủ sâu, ngủ ngon\n✅ Giảm stress, lo âu\n✅ Cân bằng cảm xúc\n✅ 100% thành phần tự nhiên\n\n💰 Giá: 15.900.000đ\n🎁 Ưu đãi đặc biệt cho khách hàng mới!\n\n📱 Liên hệ ngay để được tư vấn miễn phí!',
    imageUrl: 'https://images.unsplash.com/photo-1541480601022-2308c0f02487?w=800',
    category: 'product'
  },
  {
    id: '2',
    title: 'Câu chuyện thành công',
    content: '💪 Câu chuyện của chị Mai - 35 tuổi\n\n"Trước đây, tôi thường xuyên mất ngủ, mệt mỏi suốt ngày. Sau 2 tuần sử dụng ANIMA 119, tôi đã có những đêm ngủ ngon hơn rất nhiều. Cảm ơn ANIMA đã giúp tôi lấy lại sức khỏe!"\n\n🌟 Bạn cũng có thể thay đổi cuộc sống như chị Mai!\n\n📞 Inbox để được tư vấn và nhận ưu đãi đặc biệt!',
    imageUrl: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800',
    category: 'testimonial'
  },
  {
    id: '3',
    title: 'Tips sức khỏe',
    content: '🌙 5 Tips để có giấc ngủ ngon:\n\n1️⃣ Tắt điện thoại trước khi ngủ 30 phút\n2️⃣ Uống trà thảo mộc\n3️⃣ Tạo không gian ngủ thoải mái\n4️⃣ Tập yoga hoặc thiền trước khi ngủ\n5️⃣ Sử dụng ANIMA 119 để hỗ trợ giấc ngủ sâu\n\n💚 Chăm sóc sức khỏe là chăm sóc bản thân!\n\n#SứcKhỏe #GiấcNgủNgon #ANIMA',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
    category: 'tips'
  },
  {
    id: '4',
    title: 'Khuyến mãi đặc biệt',
    content: '🎉 FLASH SALE - Chỉ 3 ngày!\n\n🔥 GIẢM 20% toàn bộ sản phẩm ANIMA\n🎁 Tặng kèm quà tặng trị giá 500.000đ\n🚚 Miễn phí vận chuyển toàn quốc\n\n⏰ Chương trình kết thúc sau:\n📅 72 giờ nữa!\n\n💰 Đặt hàng ngay:\n👉 Nhắn tin để được hỗ trợ\n👉 Số lượng có hạn!\n\n#FlashSale #KhuyếnMãi #ANIMA',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
    category: 'promotion'
  }
];

export default function MarketingTools() {
  const t = useTranslation();
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

  const [showCreateCard, setShowCreateCard] = useState(false);
  const [newCardCode, setNewCardCode] = useState('');
  const [newCardDiscount, setNewCardDiscount] = useState('');
  const [newCardType, setNewCardType] = useState<'percentage' | 'fixed'>('fixed');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);

  // AI Landing Builder State
  const [selectedTemplate, setSelectedTemplate] = useState<LandingPageTemplateType>('expert');
  const [portraitUrl, setPortraitUrl] = useState<string>('');
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [generatedLandingPage, setGeneratedLandingPage] = useState<any>(null);

  // Affiliate link
  const affiliateLink = `https://wellnexus.vn/ref/${user.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(affiliateLink)}&bgcolor=00575A&color=FFBF00`;

  const handleCreateGiftCard = () => {
    if (!newCardCode || !newCardDiscount) return;

    const newCard: GiftCard = {
      id: Date.now().toString(),
      code: newCardCode.toUpperCase(),
      discount: parseFloat(newCardDiscount),
      type: newCardType,
      usageCount: 0,
      createdAt: new Date()
    };

    setGiftCards(prev => [newCard, ...prev]);
    setNewCardCode('');
    setNewCardDiscount('');
    setShowCreateCard(false);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
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
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      handleCopyText(affiliateLink, 'qr-link');
    }
  };

  // AI Landing Builder Handlers
  const handleGenerateBio = async () => {
    setIsGeneratingBio(true);
    try {
      const newPage = await createLandingPage(selectedTemplate, portraitUrl || undefined);
      setGeneratedLandingPage(newPage);
    } catch (error) {
      console.error('Failed to generate landing page:', error);
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-pink-50 dark:from-slate-700 to-purple-50 dark:to-slate-700 border-b border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-3 rounded-xl shadow-lg">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('marketing.giftCards.title')}</h2>
                  <p className="text-sm text-gray-600 dark:text-slate-400">{t('marketing.giftCards.subtitle')}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateCard(!showCreateCard)}
                className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                {t('marketing.giftCards.createNew')}
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Create Gift Card Form */}
            {showCreateCard && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gradient-to-br from-pink-50 dark:from-slate-700 to-purple-50 dark:to-slate-700 rounded-xl p-6 mb-6 border-2 border-pink-200 dark:border-slate-600"
              >
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4">{t('marketing.giftCards.createTitle')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      {t('marketing.giftCards.codeLabel')}
                    </label>
                    <input
                      type="text"
                      value={newCardCode}
                      onChange={(e) => setNewCardCode(e.target.value)}
                      placeholder={t('marketing.giftCards.codePlaceholder')}
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-slate-600 focus:border-pink-500 focus:outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      {t('marketing.giftCards.valueLabel')}
                    </label>
                    <input
                      type="number"
                      value={newCardDiscount}
                      onChange={(e) => setNewCardDiscount(e.target.value)}
                      placeholder={newCardType === 'fixed' ? '200000' : '15'}
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-slate-600 focus:border-pink-500 focus:outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      {t('marketing.giftCards.typeLabel')}
                    </label>
                    <select
                      value={newCardType}
                      onChange={(e) => setNewCardType(e.target.value as 'percentage' | 'fixed')}
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-slate-600 focus:border-pink-500 focus:outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                    >
                      <option value="fixed">{t('marketing.giftCards.typeFixed')}</option>
                      <option value="percentage">{t('marketing.giftCards.typePercentage')}</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCreateGiftCard}
                    className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {t('marketing.giftCards.createButton')}
                  </button>
                  <button
                    onClick={() => setShowCreateCard(false)}
                    className="px-6 py-2 rounded-lg border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    {t('marketing.giftCards.cancel')}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Gift Cards List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {giftCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-pink-100 dark:from-slate-700 via-purple-100 dark:via-slate-700 to-blue-100 dark:to-slate-700 rounded-xl p-6 border-2 border-pink-200 dark:border-slate-600 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-5 h-5 text-pink-600" />
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{card.code}</h3>
                      </div>
                      <p className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                        {card.type === 'fixed' ? formatVND(card.discount) : `${card.discount}%`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopyText(card.code, card.id)}
                      className="bg-white dark:bg-slate-800 p-2 rounded-lg hover:bg-pink-50 dark:hover:bg-slate-700 transition-colors border border-pink-200 dark:border-slate-600"
                    >
                      {copiedText === card.id ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Copy className="w-5 h-5 text-pink-600" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-slate-400">{t('marketing.giftCards.usageCount')}</span>
                      <span className="font-bold text-gray-900 dark:text-slate-100 flex items-center gap-1">
                        <Eye className="w-4 h-4 text-purple-600" />
                        {card.usageCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-slate-400">{t('marketing.giftCards.createdDate')}</span>
                      <span className="font-medium text-gray-900 dark:text-slate-100">
                        {card.createdAt.toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Content Library Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-50 dark:from-slate-700 to-cyan-50 dark:to-slate-700 border-b border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-3 rounded-xl shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('marketing.contentLibrary.title')}</h2>
                <p className="text-sm text-gray-600 dark:text-slate-400">{t('marketing.contentLibrary.subtitle')}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contentTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={template.imageUrl}
                      alt={template.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="bg-white dark:bg-slate-800 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-primary dark:text-cyan-400 border border-primary/20 dark:border-cyan-400/20">
                        {template.category === 'product' && t('marketing.contentLibrary.categories.product')}
                        {template.category === 'testimonial' && t('marketing.contentLibrary.categories.testimonial')}
                        {template.category === 'tips' && t('marketing.contentLibrary.categories.tips')}
                        {template.category === 'promotion' && t('marketing.contentLibrary.categories.promotion')}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">
                      {template.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-4 line-clamp-3 whitespace-pre-line">
                      {template.content}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyText(template.content, `content-${template.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                      >
                        {copiedText === `content-${template.id}` ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            {t('marketing.contentLibrary.copied')}
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            {t('marketing.contentLibrary.copyText')}
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDownloadImage(template.imageUrl, `${template.title}.jpg`)}
                        className="flex items-center justify-center gap-2 bg-white dark:bg-slate-700 border-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-slate-600 transition-all duration-300"
                      >
                        <Download className="w-4 h-4" />
                        {t('marketing.contentLibrary.downloadImage')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Affiliate Link & QR Code Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-green-50 dark:from-slate-700 to-teal-50 dark:to-slate-700 border-b border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-500 to-teal-600 p-3 rounded-xl shadow-lg">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('marketing.affiliate.title')}</h2>
                <p className="text-sm text-gray-600 dark:text-slate-400">{t('marketing.affiliate.subtitle')}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Affiliate Link */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    {t('marketing.affiliate.linkLabel')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={affiliateLink}
                      readOnly
                      className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-slate-300 font-mono text-sm"
                    />
                    <button
                      onClick={() => handleCopyText(affiliateLink, 'affiliate-link')}
                      className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                    >
                      {copiedText === 'affiliate-link' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 dark:from-slate-700 to-teal-50 dark:to-slate-700 rounded-xl p-6 border-2 border-green-200 dark:border-slate-600">
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    {t('marketing.affiliate.stats.title')}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-slate-400">{t('marketing.affiliate.stats.clicks')}</span>
                      <span className="font-bold text-gray-900 dark:text-slate-100">245</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-slate-400">{t('marketing.affiliate.stats.signups')}</span>
                      <span className="font-bold text-green-600 dark:text-green-400">12</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-slate-400">{t('marketing.affiliate.stats.conversion')}</span>
                      <span className="font-bold text-primary dark:text-cyan-400">4.9%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-slate-700 rounded-xl p-4 border border-blue-200 dark:border-slate-600">
                  <p className="text-sm text-gray-700 dark:text-slate-300">{t('marketing.affiliate.tip')}</p>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center">
                <div className="bg-gradient-to-br from-green-100 dark:from-slate-700 to-teal-100 dark:to-slate-700 p-8 rounded-2xl border-4 border-white dark:border-slate-600 shadow-2xl">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-64 h-64 rounded-xl"
                  />
                  <div className="mt-4 text-center">
                    <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{t('marketing.affiliate.partnerLabel')}</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleDownloadQRCode}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    <Download className="w-5 h-5" />
                    {t('marketing.affiliate.downloadQR')}
                  </button>
                  <button
                    onClick={handleShareQRCode}
                    className="flex items-center gap-2 bg-white dark:bg-slate-700 border-2 border-green-500 dark:border-green-400 text-green-600 dark:text-green-400 px-6 py-3 rounded-xl font-semibold hover:bg-green-50 dark:hover:bg-slate-600 transition-all duration-300"
                  >
                    <Share2 className="w-5 h-5" />
                    {t('marketing.affiliate.share')}
                  </button>
                </div>

                <p className="text-xs text-gray-500 dark:text-slate-400 text-center mt-4 max-w-xs">
                  {t('marketing.affiliate.qrTip')}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

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
                  AI Landing Builder
                  <span className="bg-accent text-primary text-xs px-3 py-1 rounded-full font-bold">NEW</span>
                </h2>
                <p className="text-white/90 text-sm">Tạo trang tuyển dụng chuyên nghiệp với AI trong 60 giây</p>
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
                    Chọn Template
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {landingPageTemplates.map((template) => (
                      <motion.button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.type)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300 ${
                          selectedTemplate === template.type
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
                    Upload Ảnh Chân Dung
                  </h3>
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
                            <p className="text-sm font-medium text-gray-900">Ảnh đã tải lên</p>
                            <p className="text-xs text-gray-600">Click để thay đổi</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">Click để tải ảnh lên</p>
                          <p className="text-xs text-gray-600 dark:text-slate-400">JPG, PNG, tối đa 5MB</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerateBio}
                  disabled={isGeneratingBio}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 disabled:opacity-50"
                >
                  {isGeneratingBio ? (
                    <>
                      <Sparkles className="w-6 h-6 animate-spin" />
                      AI Đang Viết Câu Chuyện...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-6 h-6" />
                      AI Viết Câu Chuyện Của Tôi
                    </>
                  )}
                </button>
              </div>

              {/* Preview / Result */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-600" />
                  Preview Landing Page
                </h3>

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
                        <span className="text-sm text-gray-600 dark:text-slate-400">Link Landing Page:</span>
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
                          <p className="text-xs text-gray-600 dark:text-slate-400">Lượt xem</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                          <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
                          <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{generatedLandingPage.conversions}</p>
                          <p className="text-xs text-gray-600 dark:text-slate-400">Chuyển đổi</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                          <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                          <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
                            {generatedLandingPage.views > 0
                              ? ((generatedLandingPage.conversions / generatedLandingPage.views) * 100).toFixed(1)
                              : '0.0'}%
                          </p>
                          <p className="text-xs text-gray-600 dark:text-slate-400">Tỷ lệ</p>
                        </div>
                      </div>

                      {!generatedLandingPage.isPublished ? (
                        <button
                          onClick={handlePublishLandingPage}
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all duration-300"
                        >
                          <ExternalLink className="w-5 h-5" />
                          Xuất Bản Ngay
                        </button>
                      ) : (
                        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-600 rounded-xl p-4 text-center">
                          <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                          <p className="text-sm font-bold text-green-800 dark:text-green-300">Landing Page Đã Xuất Bản!</p>
                          <p className="text-xs text-green-700 dark:text-green-400">Link đã sẵn sàng để chia sẻ</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-12 text-center border-2 border-dashed border-gray-300 dark:border-slate-600">
                    <Wand2 className="w-16 h-16 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-slate-300 font-medium">Chọn template và click "AI Viết Câu Chuyện"</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">AI sẽ tạo landing page chuyên nghiệp cho bạn</p>
                  </div>
                )}
              </div>
            </div>

            {/* Existing Landing Pages */}
            {userLandingPages.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-700">
                <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-4">Landing Pages Đã Tạo ({userLandingPages.length})</h3>
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
                            Live
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-slate-400">
                        <span>👁️ {page.views} views</span>
                        <span>✅ {page.conversions} conversions</span>
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
