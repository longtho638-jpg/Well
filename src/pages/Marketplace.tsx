import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import ProductCard from '../components/ProductCard';
import {
  Search,
  Sparkles,
  Bot,
  TrendingUp,
  Award,
  ShoppingCart,
  CheckCircle2,
  Package,
  Star,
  Zap,
  X,
  Plus,
  Minus,
  Trash2,
  Filter,
  SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../types';
import { useTranslation } from '../hooks';
import { formatVND, formatNumber } from '../utils/format';

// Cart Item Interface
interface CartItem {
  product: Product;
  quantity: number;
}

export const Marketplace: React.FC = () => {
  const t = useTranslation();
  const { products, user, redemptionItems, redeemItem } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<{ text: string; productIds: string[] } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Redemption state
  const [showRedemption, setShowRedemption] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'electronics' | 'travel' | 'education' | 'experience'>('all');
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Filter state
  const [showFilters, setShowFilters] = useState(true);
  const [selectedPriceRange, setSelectedPriceRange] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [selectedProductCategory, setSelectedProductCategory] = useState<'all' | 'health' | 'wellness' | 'supplement'>('all');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Price filter
    let matchesPrice = true;
    if (selectedPriceRange === 'low') matchesPrice = p.price < 5000000;
    else if (selectedPriceRange === 'medium') matchesPrice = p.price >= 5000000 && p.price < 15000000;
    else if (selectedPriceRange === 'high') matchesPrice = p.price >= 15000000;

    // Category filter (simplified - based on product name)
    let matchesCategory = true;
    if (selectedProductCategory !== 'all') {
      matchesCategory = p.name.toLowerCase().includes(selectedProductCategory);
    }

    return matchesSearch && matchesPrice && matchesCategory;
  });

  // Simulate AI Recommendation Engine
  useEffect(() => {
    const generateRecommendations = async () => {
      setLoadingAi(true);
      await new Promise(r => setTimeout(r, 1500));

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

  // Redemption handlers
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

  // Cart functions
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setShowCart(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartCommission = cart.reduce((sum, item) => sum + (item.product.price * item.product.commissionRate * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 pb-20">
      {/* Toggle Button */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex gap-3">
          <button
            onClick={() => setShowRedemption(false)}
            className={`flex-1 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              !showRedemption
                ? 'bg-gradient-to-r from-primary to-teal-600 text-white shadow-lg shadow-primary/30'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            Mua Sản Phẩm
          </button>
          <button
            onClick={() => setShowRedemption(true)}
            className={`flex-1 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              showRedemption
                ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white shadow-lg shadow-purple-500/30'
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
      </div>

      {/* Shopping Section */}
      {!showRedemption && (
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="lg:col-span-1 space-y-6"
                >
                  {/* Filter Card */}
                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 shadow-xl sticky top-24">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        <SlidersHorizontal className="w-5 h-5 text-primary" />
                        Bộ Lọc
                      </h3>
                      <button
                        onClick={() => setShowFilters(false)}
                        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Category Filter */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-700 mb-3 text-sm">Danh Mục</h4>
                      <div className="space-y-2">
                        {[
                          { value: 'all', label: 'Tất cả sản phẩm', icon: '🎁' },
                          { value: 'health', label: 'Sức khỏe', icon: '💊' },
                          { value: 'wellness', label: 'Wellness', icon: '🌿' },
                          { value: 'supplement', label: 'Thực phẩm bổ sung', icon: '🥗' }
                        ].map((cat) => (
                          <button
                            key={cat.value}
                            onClick={() => setSelectedProductCategory(cat.value as any)}
                            className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-3 ${
                              selectedProductCategory === cat.value
                                ? 'bg-gradient-to-r from-primary to-teal-600 text-white shadow-lg'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <span className="text-lg">{cat.icon}</span>
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Range Filter */}
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3 text-sm">Khoảng Giá</h4>
                      <div className="space-y-2">
                        {[
                          { value: 'all', label: 'Tất cả giá', range: '' },
                          { value: 'low', label: 'Dưới 5 triệu', range: '< 5M' },
                          { value: 'medium', label: '5 - 15 triệu', range: '5M - 15M' },
                          { value: 'high', label: 'Trên 15 triệu', range: '> 15M' }
                        ].map((price) => (
                          <button
                            key={price.value}
                            onClick={() => setSelectedPriceRange(price.value as any)}
                            className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 text-left ${
                              selectedPriceRange === price.value
                                ? 'bg-gradient-to-r from-accent to-yellow-500 text-primary shadow-lg'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{price.label}</span>
                              {price.range && (
                                <span className="text-xs opacity-70">{price.range}</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reset Button */}
                    <button
                      onClick={() => {
                        setSelectedProductCategory('all');
                        setSelectedPriceRange('all');
                        setSearchTerm('');
                      }}
                      className="w-full mt-6 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                    >
                      Đặt lại bộ lọc
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Content */}
            <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="p-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors lg:hidden"
                    >
                      <Filter className="w-5 h-5 text-primary" />
                    </button>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">{t('marketplace.title')}</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {filteredProducts.length} sản phẩm
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 sm:w-72">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder={t('marketplace.searchPlaceholder')}
                        className="pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    {/* Cart Button */}
                    <button
                      onClick={() => setShowCart(true)}
                      className="relative p-3 bg-gradient-to-r from-primary to-teal-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {cartItemCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-accent text-primary text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-lg">
                          {cartItemCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* AI Recommendation Widget */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl" />
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />

                  <div className="relative p-6 text-white">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-yellow-400 backdrop-blur-sm shrink-0">
                        {loadingAi ? <Sparkles className="w-6 h-6 animate-spin" /> : <Bot className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
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
                </motion.div>

                {/* Products Grid */}
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
                          <div onClick={() => addToCart(p)}>
                            <ProductCard product={p} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center bg-white/70 backdrop-blur-xl rounded-2xl border-2 border-gray-200 border-dashed">
                    <div className="p-4 bg-gray-50 rounded-full mb-3">
                      <Search className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">{t('marketplace.noProductsFound')}</h3>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Redemption Section */}
      {showRedemption && (
        <div className="max-w-7xl mx-auto p-6">
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
        </div>
      )}

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-teal-600 p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6" />
                    Giỏ Hàng
                  </h2>
                  <button
                    onClick={() => setShowCart(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-white/80 text-sm">
                  {cartItemCount} sản phẩm
                </p>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-gray-600 font-medium">Giỏ hàng trống</p>
                    <p className="text-sm text-gray-500">Thêm sản phẩm vào giỏ hàng</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <motion.div
                      key={item.product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                    >
                      <div className="flex gap-4">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-1">{item.product.name}</h3>
                          <p className="text-sm text-primary font-bold mb-2">
                            {formatVND(item.product.price)}
                          </p>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg">
                              <button
                                onClick={() => updateQuantity(item.product.id, -1)}
                                className="p-2 hover:bg-gray-100 rounded-l-lg transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="px-3 font-bold">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.product.id, 1)}
                                className="p-2 hover:bg-gray-100 rounded-r-lg transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Commission Badge */}
                      <div className="mt-3 bg-accent/20 border border-accent rounded-lg p-2 text-xs">
                        <span className="text-primary font-bold">
                          Hoa hồng: {formatVND(item.product.price * item.product.commissionRate * item.quantity)}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer */}
              {cart.length > 0 && (
                <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Tổng tiền:</span>
                      <span className="font-bold text-gray-900">{formatVND(cartTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Tổng hoa hồng:</span>
                      <span className="font-bold text-green-600">{formatVND(cartCommission)}</span>
                    </div>
                  </div>
                  <button className="w-full bg-gradient-to-r from-primary to-teal-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300">
                    Thanh Toán
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
