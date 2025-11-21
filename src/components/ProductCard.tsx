
import React, { useState } from 'react';
import { Product } from '../types';
import { ShoppingBag, Share2, Loader2, CheckCircle, Eye } from 'lucide-react';
import { formatVND } from '../utils/format';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks';

interface Props {
  product: Product;
}

const ProductCard: React.FC<Props> = ({ product }) => {
  const { simulateOrder } = useStore();
  const navigate = useNavigate();
  const t = useTranslation();
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
      alert(t('productCard.copySuccess'));
    } catch (err) {
      // Fallback for older browsers
      console.error('Failed to copy:', err);
      alert(t('productCard.shareLink', { url: shareUrl }));
    }
  };

  const handleViewDetails = () => navigate(`/product/${product.id}`);
  
  const commissionAmount = product.price * product.commissionRate;
  const outOfStock = product.stock <= 0;

  return (
    <div 
        onClick={handleViewDetails} 
        className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:border-brand-primary/20 transition-all duration-300 group flex flex-col h-full cursor-pointer relative"
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden p-4 flex items-center justify-center">
        <img 
            src={product.imageUrl} 
            alt={product.name} 
            className={`w-full h-full object-contain mix-blend-multiply transition-transform duration-500 ${outOfStock ? 'grayscale opacity-50' : 'group-hover:scale-110'}`} 
        />
        
        {/* Overlay Badge */}
        <div className="absolute top-3 right-3 bg-brand-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1 z-10">
          {t('productCard.earn')} {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(commissionAmount)}
        </div>
        
        {/* Hover Overlay for View Details */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white text-brand-dark px-4 py-2 rounded-full shadow-lg font-bold text-xs flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0">
                <Eye className="w-3 h-3" /> {t('productCard.viewDetails')}
            </div>
        </div>

        {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] z-20">
                <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">{t('productCard.outOfStock')}</span>
            </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-800 text-base mb-1 leading-tight group-hover:text-brand-primary transition-colors line-clamp-1" title={product.name}>
            {product.name}
        </h3>
        
        <div className="flex items-center justify-between mb-3">
            <span className="text-brand-primary font-bold text-lg">{formatVND(product.price)}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${outOfStock ? 'bg-red-100 text-red-600' : 'bg-brand-primary/5 text-brand-primary'}`}>
                {t('productCard.stock')} {product.stock}
            </span>
        </div>
        
        <p className="text-xs text-gray-500 mb-4 line-clamp-2 min-h-[2.5em]">{product.description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-xs font-bold hover:bg-gray-50 hover:border-gray-300 transition-all"
            aria-label="Share product link"
          >
            <Share2 className="w-3.5 h-3.5" /> {t('productCard.share')}
          </button>
          
          <button 
            onClick={handleBuy} 
            disabled={isBuying || outOfStock || showSuccess} 
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all relative overflow-hidden
                ${showSuccess 
                    ? 'bg-green-500 text-white border-green-500' 
                    : 'bg-brand-accent text-brand-primary hover:bg-yellow-400 border border-transparent'
                } 
                ${(outOfStock || isBuying) ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-yellow-500/20'}
            `}
          >
            {isBuying ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : showSuccess ? (
                <div className="flex items-center gap-1 animate-in fade-in zoom-in">
                    <CheckCircle className="w-3.5 h-3.5" /> {t('productCard.added')}
                </div>
            ) : (
                <>
                    <ShoppingBag className="w-3.5 h-3.5" /> {t('productCard.buyNow')}
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
