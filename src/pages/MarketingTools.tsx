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
  Tag
} from 'lucide-react';
import { useStore } from '@/store';
import { formatVND, formatNumber } from '@/utils/format';
import { useTranslation } from '@/hooks';

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
  const { user } = useStore();
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
        // Share cancelled or failed - silently ignore
      }
    } else {
      handleCopyText(affiliateLink, 'qr-link');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
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
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-3 rounded-xl shadow-lg">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{t('marketing.giftCards.title')}</h2>
                  <p className="text-sm text-gray-600">{t('marketing.giftCards.subtitle')}</p>
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
                className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 mb-6 border-2 border-pink-200"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('marketing.giftCards.createTitle')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('marketing.giftCards.codeLabel')}
                    </label>
                    <input
                      type="text"
                      value={newCardCode}
                      onChange={(e) => setNewCardCode(e.target.value)}
                      placeholder={t('marketing.giftCards.codePlaceholder')}
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-pink-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('marketing.giftCards.valueLabel')}
                    </label>
                    <input
                      type="number"
                      value={newCardDiscount}
                      onChange={(e) => setNewCardDiscount(e.target.value)}
                      placeholder={newCardType === 'fixed' ? '200000' : '15'}
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-pink-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('marketing.giftCards.typeLabel')}
                    </label>
                    <select
                      value={newCardType}
                      onChange={(e) => setNewCardType(e.target.value as 'percentage' | 'fixed')}
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-pink-500 focus:outline-none"
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
                    className="px-6 py-2 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
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
                  className="bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 rounded-xl p-6 border-2 border-pink-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-5 h-5 text-pink-600" />
                        <h3 className="text-2xl font-bold text-gray-900">{card.code}</h3>
                      </div>
                      <p className="text-3xl font-bold text-pink-600">
                        {card.type === 'fixed' ? formatVND(card.discount) : `${card.discount}%`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopyText(card.code, card.id)}
                      className="bg-white p-2 rounded-lg hover:bg-pink-50 transition-colors border border-pink-200"
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
                      <span className="text-gray-600">{t('marketing.giftCards.usageCount')}</span>
                      <span className="font-bold text-gray-900 flex items-center gap-1">
                        <Eye className="w-4 h-4 text-purple-600" />
                        {card.usageCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{t('marketing.giftCards.createdDate')}</span>
                      <span className="font-medium text-gray-900">
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
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-3 rounded-xl shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{t('marketing.contentLibrary.title')}</h2>
                <p className="text-sm text-gray-600">{t('marketing.contentLibrary.subtitle')}</p>
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
                  className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={template.imageUrl}
                      alt={template.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-primary">
                        {template.category === 'product' && t('marketing.contentLibrary.categories.product')}
                        {template.category === 'testimonial' && t('marketing.contentLibrary.categories.testimonial')}
                        {template.category === 'tips' && t('marketing.contentLibrary.categories.tips')}
                        {template.category === 'promotion' && t('marketing.contentLibrary.categories.promotion')}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {template.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3 whitespace-pre-line">
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
                        className="flex items-center justify-center gap-2 bg-white border-2 border-blue-500 text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-300"
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
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-green-50 to-teal-50 border-b border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-500 to-teal-600 p-3 rounded-xl shadow-lg">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{t('marketing.affiliate.title')}</h2>
                <p className="text-sm text-gray-600">{t('marketing.affiliate.subtitle')}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Affiliate Link */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('marketing.affiliate.linkLabel')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={affiliateLink}
                      readOnly
                      className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-300 bg-gray-50 text-gray-700 font-mono text-sm"
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

                <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border-2 border-green-200">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    {t('marketing.affiliate.stats.title')}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('marketing.affiliate.stats.clicks')}</span>
                      <span className="font-bold text-gray-900">245</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('marketing.affiliate.stats.signups')}</span>
                      <span className="font-bold text-green-600">12</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('marketing.affiliate.stats.conversion')}</span>
                      <span className="font-bold text-primary">4.9%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-sm text-gray-700">{t('marketing.affiliate.tip')}</p>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center">
                <div className="bg-gradient-to-br from-green-100 to-teal-100 p-8 rounded-2xl border-4 border-white shadow-2xl">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-64 h-64 rounded-xl"
                  />
                  <div className="mt-4 text-center">
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">{t('marketing.affiliate.partnerLabel')}</p>
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
                    className="flex items-center gap-2 bg-white border-2 border-green-500 text-green-600 px-6 py-3 rounded-xl font-semibold hover:bg-green-50 transition-all duration-300"
                  >
                    <Share2 className="w-5 h-5" />
                    {t('marketing.affiliate.share')}
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-4 max-w-xs">
                  {t('marketing.affiliate.qrTip')}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
