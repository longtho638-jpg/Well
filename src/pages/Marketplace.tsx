
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import ProductCard from '../components/ProductCard';
import { Search, Sparkles, Bot, TrendingUp, Award, ShoppingCart, CheckCircle2, Package, Star, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../types';
import { useTranslation } from '../hooks';
import { formatVND, formatNumber } from '../utils/format';

export const Marketplace: React.FC = () => {
  const t = useTranslation();
  const { products, user, redemptionItems, redeemItem } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<{ text: string; productIds: string[] } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Redemption state - TREE MAX LEVEL
  const [showRedemption, setShowRedemption] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'electronics' | 'travel' | 'education' | 'experience'>('all');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Simulate AI Recommendation Engine
  useEffect(() => {
    const generateRecommendations = async () => {
      setLoadingAi(true);
      // Simulate API delay
      await new Promise(r => setTimeout(r, 1500));

      // Mock AI logic: Suggest high commission products or popular ones
      const suggested = products.find(p => p.commissionRate >= 0.25);

      if (suggested) {
        setAiSuggestion({
          text: t('marketplace.aiRecommendation.suggestion', {
            productName: suggested.name,
            commission: (suggested.commissionRate * 100).toString()
          }),
          productIds: [suggested.id]
        });
      }
      setLoadingAi(false);
    };

    generateRecommendations();
  }, [products, t]);

  // Redemption handlers - TREE MAX LEVEL
  const filteredRedemptionItems = redemptionItems.filter(item => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  const handleRedeem = async (itemId: string) => {
    const item = redemptionItems.find(i => i.id === itemId);
    if (!item) return;

    if (user.growBalance < item.growCost) {
      alert(`Không đủ GROW Token! Bạn cần ${item.growCost} GROW nhưng chỉ có ${user.growBalance} GROW.`);
      return;
    }

    if (!item.isAvailable || item.stock <= 0) {
      alert('Sản phẩm hiện đã hết hàng!');
      return;
    }

    const confirmed = window.confirm(`Xác nhận đổi ${item.name} với ${formatNumber(item.growCost)} GROW Token?`);
    if (!confirmed) return;

    setIsRedeeming(true);
    try {
      await redeemItem(itemId);
      alert(`Đã đổi thành công ${item.name}! Chúng tôi sẽ liên hệ bạn sớm nhất.`);
    } catch (error: any) {
      alert(`Đổi thưởng thất bại: ${error.message}`);
    } finally {
      setIsRedeeming(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'electronics': return '📱';
      case 'travel': return '✈️';
      case 'education': return '📚';
      case 'experience': return '🎭';
      default: return '🎁';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toggle Button - TREE MAX LEVEL */}
      <div className="bg-white rounded-xl p-2 flex gap-2 border border-gray-200">
        <button
          onClick={() => setShowRedemption(false)}
          className={`flex-1 px-6 py-3 rounded-lg font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
            !showRedemption
              ? 'bg-gradient-to-r from-primary to-teal-600 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          Mua Sản Phẩm
        </button>
        <button
          onClick={() => setShowRedemption(true)}
          className={`flex-1 px-6 py-3 rounded-lg font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
            showRedemption
              ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Award className="w-5 h-5" />
          Đổi Thưởng GROW
          <span className="bg-white text-purple-600 text-xs px-2 py-0.5 rounded-full font-bold">
            {formatNumber(user.growBalance)}
          </span>
        </button>
      </div>

      {!showRedemption && (
        <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-brand-dark">{t('marketplace.title')}</h2>
        <div className="relative w-full sm:w-72">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
           </div>
           <input type="text" placeholder={t('marketplace.searchPlaceholder')} className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* AI Recommendation Widget */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <div className="flex items-start gap-4 relative z-10">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-yellow-400 backdrop-blur-sm shrink-0">
            {loadingAi ? <Sparkles className="w-6 h-6 animate-spin" /> : <Bot className="w-6 h-6" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
               <h3 className="font-bold text-lg">{t('marketplace.aiRecommendation.title')}</h3>
               <span className="bg-yellow-400 text-indigo-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> {t('marketplace.aiRecommendation.live')}
               </span>
            </div>
            <AnimatePresence mode="wait">
              {loadingAi ? (
                <motion.p
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-indigo-200 text-sm"
                >
                  {t('marketplace.aiRecommendation.loading', { count: '124' })}
                </motion.p>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-indigo-100 text-sm leading-relaxed"
                >
                  {aiSuggestion?.text.split('**').map((part, i) =>
                    i % 2 === 1 ? <span key={i} className="text-yellow-300 font-bold">{part}</span> : part
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p, idx) => {
            const isRecommended = aiSuggestion?.productIds.includes(p.id);
            return (
                <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={isRecommended ? 'ring-2 ring-yellow-400 ring-offset-2 rounded-xl' : ''}
                >
                {isRecommended && (
                    <div className="bg-yellow-400 text-indigo-900 text-xs font-bold px-3 py-1 rounded-t-lg -mb-1 w-fit relative z-10 mx-auto flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {t('marketplace.aiRecommended')}
                    </div>
                )}
                <ProductCard product={p} />
                </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
           <div className="p-4 bg-gray-50 rounded-full mb-3"><Search className="h-6 w-6 text-gray-400" /></div>
           <h3 className="text-lg font-bold text-gray-800">{t('marketplace.noProductsFound')}</h3>
        </div>
      )}
        </>
      )}

      {/* Redemption Marketplace - TREE MAX LEVEL */}
      {showRedemption && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                  <Award className="w-8 h-8" />
                  Đổi Thưởng GROW Token
                </h2>
                <p className="text-white/90">Đổi GROW Token lấy phần thưởng siêu hấp dẫn</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center">
                <p className="text-sm text-white/80 mb-1">Số dư GROW của bạn</p>
                <p className="text-4xl font-bold">{formatNumber(user.growBalance)}</p>
                <p className="text-xs text-white/70 mt-1">GROW Token</p>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[
              { value: 'all', label: 'Tất cả', icon: '🎁' },
              { value: 'electronics', label: 'Điện tử', icon: '📱' },
              { value: 'travel', label: 'Du lịch', icon: '✈️' },
              { value: 'education', label: 'Giáo dục', icon: '📚' },
              { value: 'experience', label: 'Trải nghiệm', icon: '🎭' }
            ].map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value as any)}
                className={`px-6 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${
                  selectedCategory === cat.value
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <span className="text-lg">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Redemption Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRedemptionItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-purple-300"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {getCategoryIcon(item.category)} {item.category}
                  </div>
                  {item.stock <= 5 && item.stock > 0 && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Chỉ còn {item.stock}!
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{item.name}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>

                  {/* Highlights */}
                  <div className="space-y-2 mb-4">
                    {item.highlights.slice(0, 3).map((highlight, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                        <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                        <span className="line-clamp-1">{highlight}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      {item.redemptionCount} đã đổi
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3 text-blue-600" />
                      Còn {item.stock}
                    </span>
                  </div>

                  {/* Price & Button */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-purple-600 flex items-center gap-1">
                          <Award className="w-5 h-5" />
                          {formatNumber(item.growCost)}
                        </p>
                        <p className="text-xs text-gray-500">GROW Token</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Giá trị</p>
                        <p className="text-sm font-bold text-gray-900">{formatVND(item.estimatedValue)}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRedeem(item.id)}
                      disabled={isRedeeming || !item.isAvailable || item.stock <= 0 || user.growBalance < item.growCost}
                      className={`w-full px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                        !item.isAvailable || item.stock <= 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : user.growBalance < item.growCost
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                      }`}
                    >
                      {!item.isAvailable || item.stock <= 0 ? (
                        <>
                          <Package className="w-4 h-4" />
                          Hết hàng
                        </>
                      ) : user.growBalance < item.growCost ? (
                        <>
                          <Award className="w-4 h-4" />
                          Không đủ GROW
                        </>
                      ) : isRedeeming ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-spin" />
                          Đang đổi...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          Đổi ngay
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredRedemptionItems.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có sản phẩm trong danh mục này</h3>
              <p className="text-gray-600">Vui lòng chọn danh mục khác</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
