import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Star, Sparkles } from 'lucide-react';
import { Product } from '@/types';
import { formatVND } from '@/utils/format';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks';

interface FeaturedProductsProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ products, onAddToCart }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Take top 4 products
  const displayProducts = products.slice(0, 4);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
  };

  return (
    <section className="relative py-32 bg-zinc-950 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-64 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -left-64 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-5 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-bold text-purple-400 uppercase tracking-wider">
                {t('landing.featured.badge')}
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              {t('landing.featured.title')}
            </h2>
            <p className="text-zinc-400 max-w-2xl text-lg">
              {t('landing.featured.subtitle')}
            </p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            onClick={() => navigate('/marketplace')}
            className="group flex items-center gap-2 text-white font-bold bg-white/5 hover:bg-white/10 px-6 py-3 rounded-xl border border-white/10 hover:border-white/20 transition-all"
          >
            {t('landing.featured.viewAll')}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>

        {/* Product Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {displayProducts.map((product) => (
            <motion.div
              key={product.id}
              variants={item}
              className="group relative bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden hover:border-teal-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-teal-900/20 flex flex-col h-full"
            >
              {/* Image Area */}
              <div className="relative aspect-[4/5] overflow-hidden p-6 bg-gradient-to-b from-white/5 to-transparent">
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                   <div className="bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-bold text-white">4.9</span>
                   </div>
                </div>

                <motion.img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-contain drop-shadow-2xl group-hover:scale-110 group-hover:-rotate-2 transition-transform duration-700 ease-out"
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />

                {/* Quick Add Button (Visible on Hover) */}
                <div className="absolute bottom-4 left-4 right-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(product);
                    }}
                    className="w-full bg-white text-zinc-950 font-bold py-3 rounded-xl shadow-xl flex items-center justify-center gap-2 hover:bg-teal-50 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {t('landing.featured.addToCart')}
                  </button>
                </div>
              </div>

              {/* Info Area */}
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-teal-400 transition-colors">
                  {product.name}
                </h3>
                <p className="text-sm text-zinc-400 mb-4 line-clamp-2 flex-1">
                  {product.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">{t('landing.featured.price')}</span>
                    <span className="text-xl font-bold text-white">{formatVND(product.price)}</span>
                  </div>
                  <button
                    onClick={() => onAddToCart(product)}
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-teal-500 hover:border-teal-500 transition-all md:hidden"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
