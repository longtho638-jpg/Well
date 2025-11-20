import React from 'react';
import { Product } from '../types';
import { ShoppingBag, Share2, Info } from 'lucide-react';
import { checkCompliance } from '../services/geminiService';
import { formatVND } from '../utils/format';

interface Props {
  product: Product;
}

const ProductCard: React.FC<Props> = ({ product }) => {
  const handleShare = () => {
    // Simulate copying link
    alert(`Link copied: wellnexus.vn/ref/VN-888/product/${product.id}`);
    
    // "The Guardian" check (Simulated in background)
    checkCompliance(product.description).then(isSafe => {
        if(!isSafe) console.warn("Compliance Warning: Product description flagged.");
    });
  };

  const commissionAmount = product.price * product.commissionRate;

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2 right-2 bg-brand-primary text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
          Earn {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(commissionAmount)}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-gray-800 text-lg mb-1 truncate">{product.name}</h3>
        <div className="flex items-center justify-between mb-3">
            <span className="text-brand-primary font-semibold">
                {formatVND(product.price)}
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">In Stock: {product.stock || 0}</span>
        </div>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[2.5em]">{product.description}</p>
        
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={handleShare}
            className="flex items-center justify-center gap-2 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            <Share2 className="w-4 h-4" />
            Copy Link
          </button>
          <button className="flex items-center justify-center gap-2 bg-brand-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-800 transition">
            <ShoppingBag className="w-4 h-4" />
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;