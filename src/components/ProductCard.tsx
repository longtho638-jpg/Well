import { uiLogger } from '@/utils/logger';

import React, { useState } from 'react';
import { Product } from '../types';
import { ShoppingBag, Share2, Loader2, CheckCircle, Eye } from 'lucide-react';
import { formatVND } from '../utils/format';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks';
import { useToast } from '@/components/ui/Toast';

interface Props {
  product: Product;
}

const ProductCard: React.FC<Props> = ({ product }) => {
    const { t } = useTranslation();
  const { simulateOrder } = useStore();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isBuying, setIsBuying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleBuy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBuying(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      await simulateOrder(product.id);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } finally {
      setIsBuying(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/product/${product.id}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link copied to clipboard!', 'success');
    } catch (err) {
      // Fallback for older browsers
      uiLogger.error('Failed to copy', err);
      showToast(`Share this link: ${shareUrl}`, 'info');
    }
  };

  const handleViewDetails = () => navigate(`/product/${product.id}`);

  const commissionAmount = product.price * product.commissionRate;
  const outOfStock = product.stock <= 0;

  return (
    <div
      onClick={handleViewDetails}
      className="glass-pearl dark:glass-void rounded-2xl overflow-hidden hover-lift transition-all duration-300 group flex flex-col h-full cursor-pointer relative border border-white/40 dark:border-white/5"
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 overflow-hidden p-6 flex items-center justify-center group-hover:p-4 transition-all duration-500">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/80 via-transparent to-transparent dark:from-white/5 dark:via-transparent dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal drop-shadow-xl transition-transform duration-500 ${outOfStock ? 'grayscale opacity-50' : 'group-hover:scale-110 group-hover:-rotate-3'}`}
        />

        {/* Overlay Badge */}
        <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-brand-primary dark:text-teal-400 border border-brand-primary/20 dark:border-teal-500/30 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 z-10 group-hover:scale-105 transition-transform">
          {t('productcard.earn')}{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(commissionAmount)}
        </div>

        {/* Hover Overlay for View Details */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl text-brand-dark dark:text-slate-100 px-5 py-2.5 rounded-full shadow-2xl border border-white/50 dark:border-white/10 font-bold text-xs flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 hover:scale-105">
            <Eye className="w-3.5 h-3.5" /> {t('productcard.view_details')}</div>
        </div>

        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-[2px] z-20">
            <span className="bg-gray-900 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-xl">{t('productcard.out_of_stock')}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/50 to-white/80 dark:from-transparent dark:via-slate-900/50 dark:to-slate-900/80 pointer-events-none" />

        <div className="relative z-10 flex flex-col flex-1">
          <h3 className="font-bold text-gray-900 dark:text-slate-100 text-lg mb-1 leading-tight group-hover:text-brand-primary dark:group-hover:text-teal-400 transition-colors line-clamp-1" title={product.name}>
            {product.name}
          </h3>

          <div className="flex items-center justify-between mb-4">
            <span className="text-brand-primary dark:text-teal-400 font-extrabold text-xl text-glow-brand">{formatVND(product.price)}</span>
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${outOfStock ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' : 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'}`}>
              {t('productcard.stock')}{product.stock}
            </span>
          </div>

          <p className="text-xs text-gray-600 dark:text-slate-400 mb-5 line-clamp-2 min-h-[2.5em] leading-relaxed">{product.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 active:bg-gray-100 dark:active:bg-slate-600 py-3 rounded-xl text-xs font-bold transition-all duration-200 hover:shadow-lg active:scale-95"
              aria-label="Share product link"
            >
              <Share2 className="w-3.5 h-3.5" /> {t('productcard.share')}</button>

            <button
              onClick={handleBuy}
              disabled={isBuying || outOfStock || showSuccess}
              className={`btn-liquid flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all duration-200 relative
                    ${showSuccess
                  ? 'bg-green-500 dark:bg-green-600 text-white border-green-500 shadow-lg shadow-green-500/30'
                  : 'bg-brand-accent dark:bg-yellow-400 text-brand-primary dark:text-slate-900 hover:bg-yellow-400 dark:hover:bg-yellow-300 active:bg-yellow-500 dark:active:bg-yellow-400 border border-transparent shadow-lg shadow-yellow-500/20'
                }
                    ${(outOfStock || isBuying) ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-xl hover:shadow-yellow-500/30 active:scale-95'}
                `}
            >
              {isBuying ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : showSuccess ? (
                <div className="flex items-center gap-1 animate-in fade-in zoom-in">
                  <CheckCircle className="w-3.5 h-3.5" /> {t('productcard.added')}</div>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" /> {t('productcard.buy_now')}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
