/**
 * WellNexus Marketplace (Refactored)
 * A social commerce hub for premium well-being products and rewards.
 * 
 * Modular architecture leveraging useMarketplace hook and domain components.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Award, Zap } from 'lucide-react';
import { GridPattern } from '@/components/ui/Aura';

// Hooks
import { useMarketplace } from '@/hooks/useMarketplace';

// Components
import { MarketplaceHeader } from '@/components/marketplace/MarketplaceHeader';
import { MarketplaceFilters } from '@/components/marketplace/MarketplaceFilters';
import { AIRecommendation } from '@/components/marketplace/AIRecommendation';
import { ProductGrid } from '@/components/marketplace/ProductGrid';
import { CartDrawer } from '@/components/marketplace/CartDrawer';
import { RedemptionZone } from '@/components/marketplace/RedemptionZone';
import { QuickPurchaseModal } from '@/components/marketplace/QuickPurchaseModal';

export const Marketplace: React.FC = () => {
  const [showQuickBuy, setShowQuickBuy] = React.useState(false);
  const {
    // State
    user,
    products,
    allRedemptionItems,
    searchTerm,
    setSearchTerm,
    priceRange,
    setPriceRange,
    category,
    setCategory,
    aiSuggestion,
    loadingAi,
    cart,
    showRedemption,
    setShowRedemption,
    showFilters,
    setShowFilters,
    showCart,
    setShowCart,

    // Actions
    addToCart,
    updateQuantity,
    removeFromCart,
    redeemItem,

    // Totals
    cartTotal,
    cartItemCount,
    t
  } = useMarketplace();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden transition-colors duration-500">
      <GridPattern />

      {/* Navigation & Mode Toggle */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-b border-zinc-200 dark:border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex gap-4">
          <button
            onClick={() => setShowRedemption(false)}
            className={`flex-1 px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-3 ${!showRedemption
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xl'
              : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
          >
            <ShoppingCart size={20} />
            {t('nav.marketplace')}
          </button>

          <button
            onClick={() => setShowRedemption(true)}
            className={`flex-1 px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-3 ${showRedemption
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xl shadow-purple-900/40'
              : 'text-zinc-400 hover:text-purple-500 dark:hover:text-purple-400'
              }`}
          >
            <Award size={20} />
            {t('wallet.staking.rewards')}
          </button>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!showRedemption ? (
            <motion.div
              key="shopping"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-12"
            >
              {/* Sidebar Filters */}
              <div className={`hidden lg:block lg:col-span-1 transition-all duration-500 ${!showFilters ? 'lg:opacity-0 lg:-translate-x-10 pointer-events-none w-0 overflow-hidden' : ''}`}>
                <MarketplaceFilters
                  category={category}
                  setCategory={setCategory}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  onClose={() => setShowFilters(false)}
                  onReset={() => {
                    setCategory('all');
                    setPriceRange('all');
                    setSearchTerm('');
                  }}
                />
              </div>

              {/* Main Content Area */}
              <div className={`${showFilters ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-12 transition-all duration-500`}>
                <MarketplaceHeader
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  cartItemCount={cartItemCount}
                  onToggleFilters={() => setShowFilters(!showFilters)}
                  onShowCart={() => setShowCart(true)}
                  title={t('marketplace.title')}
                  searchPlaceholder={t('marketplace.searchPlaceholder')}
                  totalProducts={products.length}
                />

                <AIRecommendation
                  suggestion={aiSuggestion}
                  loading={loadingAi}
                  title={t('marketplace.aiRecommendation.title')}
                  liveLabel={t('marketplace.aiRecommendation.live')}
                  loadingText={t('marketplace.aiRecommendation.loading', { count: '100+' })}
                />

                <ProductGrid
                  products={products}
                  recommendedIds={aiSuggestion?.productIds || []}
                  onAddToCart={addToCart}
                  onViewDetail={(id) => { /* Detail view transition logic here */ }}
                />

                {products.length === 0 && (
                  <div className="py-40 text-center">
                    <h3 className="text-3xl font-black text-zinc-300 dark:text-zinc-800 uppercase tracking-[0.5em]">{t('marketplace.noProductsFound')}</h3>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="redemption"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <RedemptionZone
                items={allRedemptionItems}
                userGrowBalance={user.growBalance}
                onRedeem={async (id) => {
                  try {
                    await redeemItem(id);
                    alert(t('success.purchaseSuccess'));
                  } catch (e) {
                    const err = e as Error;
                    alert(err.message);
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cart Drawer Overlay */}
      <CartDrawer
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        items={cart}
        total={cartTotal}
        itemCount={cartItemCount}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
      />

      {/* Quick Buy FAB */}
      {!showRedemption && (
        <motion.button
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowQuickBuy(true)}
          className="fixed bottom-8 right-8 z-30 w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center text-white border border-white/20"
        >
          <Zap className="w-8 h-8 fill-white" />
        </motion.button>
      )}

      <QuickPurchaseModal
        isOpen={showQuickBuy}
        onClose={() => setShowQuickBuy(false)}
      />
    </div>
  );
};

export default Marketplace;
