import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ShoppingBag, Clock, Star, ArrowRight, Check } from 'lucide-react';
import { formatVND } from '@/utils/format';
import { useTranslation } from '@/hooks';
import { useNavigate } from 'react-router-dom';
import { useQuickPurchaseFavoritesAndOrder } from './use-quick-purchase-favorites-and-order';

interface QuickPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'recent' | 'favorites';

export const QuickPurchaseModal: React.FC<QuickPurchaseModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('recent');
  const {
      favorites,
      processingId,
      recentProducts,
      favoriteProducts,
      toggleFavorite,
      handleBuyNow,
  } = useQuickPurchaseFavoritesAndOrder();

  const displayProducts = activeTab === 'recent' ? recentProducts : favoriteProducts;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-zinc-900/90 dark:bg-black/90 border border-white/10 backdrop-blur-xl w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[80vh]">

              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-emerald-400" />
                    {t('marketplace.quickBuy.title')}
                  </h2>
                  <p className="text-xs text-zinc-400 font-medium">{t('marketplace.quickBuy.subtitle')}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex p-2 bg-black/20 gap-1 border-b border-white/5">
                <button
                  onClick={() => setActiveTab('recent')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'recent'
                      ? 'bg-white/10 text-white shadow-lg'
                      : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  {t('marketplace.quickBuy.recent')}
                </button>
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'favorites'
                      ? 'bg-white/10 text-pink-400 shadow-lg'
                      : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${activeTab === 'favorites' ? 'fill-pink-400' : ''}`} />
                  {t('marketplace.quickBuy.favorites')}
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto min-h-[300px]">
                {displayProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {displayProducts.map(product => (
                      <div
                        key={product.id}
                        className="group relative bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 rounded-2xl p-4 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-900/20"
                      >
                        {/* Favorite Toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(product.id);
                          }}
                          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white/50 hover:text-pink-400 transition-colors"
                        >
                          <Heart className={`w-4 h-4 ${favorites.includes(product.id) ? 'fill-pink-500 text-pink-500' : ''}`} />
                        </button>

                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-white rounded-xl p-2 flex-shrink-0">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white text-sm line-clamp-1 mb-1">{product.name}</h3>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-emerald-400 font-black text-sm">{formatVND(product.price)}</span>
                              <span className="text-[10px] text-zinc-500 px-1.5 py-0.5 border border-white/10 rounded">
                                {t('marketplace.quickBuy.commission', { rate: product.commissionRate * 100 })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleBuyNow(product)}
                          disabled={!!processingId || product.stock <= 0}
                          className={`w-full mt-3 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                            processingId === product.id
                              ? 'bg-emerald-500 text-white'
                              : 'bg-white/5 hover:bg-emerald-500 text-zinc-300 hover:text-white border border-white/10 hover:border-emerald-500'
                          }`}
                        >
                          {processingId === product.id ? (
                            <>
                              <Check className="w-3 h-3" />
                              {t('marketplace.quickBuy.purchased')}
                            </>
                          ) : (
                            <>
                              {t('marketplace.quickBuy.buyNow')}
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-12">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      {activeTab === 'recent' ? <Clock className="w-8 h-8 opacity-50" /> : <Star className="w-8 h-8 opacity-50" />}
                    </div>
                    <p className="font-medium">{t('marketplace.quickBuy.noItems', { tab: activeTab === 'recent' ? t('marketplace.quickBuy.recent') : t('marketplace.quickBuy.favorites') })}</p>
                    {activeTab === 'recent' && (
                      <p className="text-xs text-zinc-600 mt-1">{t('marketplace.quickBuy.noRecent')}</p>
                    )}
                    {activeTab === 'favorites' && (
                      <p className="text-xs text-zinc-600 mt-1">{t('marketplace.quickBuy.noFavorites')}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 bg-white/5 flex justify-between items-center text-xs text-zinc-500">
                <span>{t('marketplace.quickBuy.vatIncluded')}</span>
                <button onClick={() => navigate('/dashboard/marketplace')} className="hover:text-white transition-colors">
                  {t('marketplace.quickBuy.viewFullMarketplace')}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
