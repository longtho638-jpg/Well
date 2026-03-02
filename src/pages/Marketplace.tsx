/**
 * WellNexus Marketplace
 * Social commerce hub for premium well-being products and rewards.
 */

import React, { lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { GridPattern } from '@/components/ui/Aura';
import { useMarketplace } from '@/hooks/useMarketplace';
import { MarketplaceHeader } from '@/components/marketplace/MarketplaceHeader';
import { MarketplaceFilters } from '@/components/marketplace/MarketplaceFilters';
import { AIRecommendation } from '@/components/marketplace/AIRecommendation';
import { ProductGrid } from '@/components/marketplace/ProductGrid';
import { RedemptionZone } from '@/components/marketplace/RedemptionZone';
import { MarketplaceModeToggleButtons } from '@/components/marketplace/marketplace-mode-toggle-buttons';
import { SEOHead } from '@/components/seo/seo-head';
import { Breadcrumbs } from '@/components/seo/breadcrumbs';
import { seoConfig } from '@/config/seo-config';
import { useToast } from '@/components/ui/Toast';

const QuickPurchaseModal = lazy(() => import('@/components/marketplace/QuickPurchaseModal').then(m => ({ default: m.QuickPurchaseModal })));
const CartDrawer = lazy(() => import('@/components/marketplace/CartDrawer').then(m => ({ default: m.CartDrawer })));

export const Marketplace: React.FC = () => {
  const [showQuickBuy, setShowQuickBuy] = React.useState(false);
  const { showToast } = useToast();
  const {
    user, products, allRedemptionItems,
    searchTerm, setSearchTerm,
    priceRange, setPriceRange,
    category, setCategory,
    aiSuggestion, loadingAi,
    cart, showRedemption, setShowRedemption,
    showFilters, setShowFilters,
    showCart, setShowCart,
    addToCart, updateQuantity, removeFromCart, redeemItem,
    cartTotal, cartItemCount, t,
  } = useMarketplace();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden transition-colors duration-500">
      <SEOHead
        title={seoConfig['/dashboard/marketplace'].title}
        description={seoConfig['/dashboard/marketplace'].description}
        keywords={seoConfig['/dashboard/marketplace'].keywords}
        ogImage={seoConfig['/dashboard/marketplace'].ogImage}
        canonical="https://wellnexus.vn/dashboard/marketplace"
      />
      <GridPattern />

      <div className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-b border-zinc-200 dark:border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <div className="w-full"><Breadcrumbs /></div>
          <MarketplaceModeToggleButtons
            showRedemption={showRedemption}
            onShop={() => setShowRedemption(false)}
            onRedeem={() => setShowRedemption(true)}
            shopLabel={t('nav.marketplace')}
            redeemLabel={t('wallet.staking.rewards')}
          />
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
              <div className={`hidden lg:block lg:col-span-1 transition-all duration-500 ${!showFilters ? 'lg:opacity-0 lg:-translate-x-10 pointer-events-none w-0 overflow-hidden' : ''}`}>
                <MarketplaceFilters
                  category={category}
                  setCategory={setCategory}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  onClose={() => setShowFilters(false)}
                  onReset={() => { setCategory('all'); setPriceRange('all'); setSearchTerm(''); }}
                />
              </div>

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
                  loadingText={t('marketplace.aiRecommendation.loading', { count: 100 })}
                />
                <ProductGrid
                  products={products}
                  recommendedIds={aiSuggestion?.productIds || []}
                  onAddToCart={addToCart}
                  onViewDetail={(_id) => {}}
                />
                {products.length === 0 && (
                  <div className="py-40 text-center">
                    <h3 className="text-3xl font-black text-zinc-300 dark:text-zinc-800 uppercase tracking-[0.5em]">
                      {t('marketplace.noProductsFound')}
                    </h3>
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
                    showToast(t('success.purchaseSuccess'), 'success');
                  } catch (e) {
                    const err = e as Error;
                    showToast(err.message, 'error');
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Suspense fallback={null}>
        <CartDrawer
          isOpen={showCart}
          onClose={() => setShowCart(false)}
          items={cart}
          total={cartTotal}
          itemCount={cartItemCount}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
        />
      </Suspense>

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

      <Suspense fallback={null}>
        <QuickPurchaseModal isOpen={showQuickBuy} onClose={() => setShowQuickBuy(false)} />
      </Suspense>
    </div>
  );
};

export default Marketplace;
