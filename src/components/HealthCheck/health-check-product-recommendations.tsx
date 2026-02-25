/**
 * Health Check Product Recommendations Component
 * Displays AI-recommended products based on health assessment
 * Features:
 * - Bento grid layout (first item large if 3+ products)
 * - Priority badges (high/medium/low)
 * - Product benefits list
 * - Price display with order button
 * - Hover animations
 */

import { motion } from 'framer-motion';
import { Sparkles, Package, CheckCircle2, Zap, ShoppingBag } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { formatVND } from '@/utils/format';

interface ProductRecommendation {
  id: string;
  name: string;
  price: number;
  reason: string;
  benefits: string[];
  priority: 'high' | 'medium' | 'low';
}

interface Props {
  recommendations: ProductRecommendation[];
  onOrderRecommendation: (productId: string) => void;
}

export default function HealthCheckProductRecommendations({
  recommendations,
  onOrderRecommendation,
}: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">
            {t('healthCheck.recommendationsTitle')}
          </h2>
          <p className="text-sm text-white/60">{t('healthcheck.s_n_ph_m_c_ai_xu_t_d_nh')}</p>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((product, index) => {
          const isLarge = index === 0 && recommendations.length > 2;

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1.4 + index * 0.15 }}
              className={`
                ${isLarge ? 'md:col-span-2 lg:row-span-2' : ''}
                glass-ultra rounded-2xl shadow-xl overflow-hidden
                ${product.priority === 'high' ? 'border-teal-500/50' : ''}
                hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group
              `}
            >
              {/* Priority Badge */}
              {product.priority === 'high' && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    {t('healthcheck.u_ti_n')}
                  </div>
                </div>
              )}

              <div className={`p-6 ${isLarge ? 'lg:p-8' : ''}`}>
                {/* Product Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`${isLarge ? 'w-16 h-16' : 'w-12 h-12'} bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <Package className={`${isLarge ? 'w-8 h-8' : 'w-6 h-6'} text-white`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`${isLarge ? 'text-2xl' : 'text-lg'} font-bold text-white mb-2 group-hover:text-teal-400 transition-colors`}>
                      {product.name}
                    </h3>
                    <p className={`${isLarge ? 'text-base' : 'text-sm'} text-white/60 leading-relaxed`}>
                      {product.reason}
                    </p>
                  </div>
                </div>

                {/* Benefits */}
                <div className={`space-y-2 mb-6 ${isLarge ? '' : 'max-h-32 overflow-hidden'}`}>
                  {product.benefits.slice(0, isLarge ? 4 : 2).map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-white/80 leading-relaxed">{benefit}</span>
                    </div>
                  ))}
                  {!isLarge && product.benefits.length > 2 && (
                    <p className="text-xs text-white/40 italic">+{product.benefits.length - 2} {t('healthcheck.l_i_ch_kh_c')}</p>
                  )}
                </div>

                {/* Price & CTA */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-xs text-white/60 mb-1">{t('healthCheck.priceLabel')}</p>
                    <p className={`${isLarge ? 'text-3xl' : 'text-2xl'} font-bold text-teal-400`}>
                      {formatVND(product.price)}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onOrderRecommendation(product.id)}
                    className={`${isLarge ? 'px-8 py-4 text-base' : 'px-6 py-3 text-sm'} bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-xl font-bold hover:shadow-xl transition-all duration-300 flex items-center gap-2 group`}
                  >
                    <ShoppingBag className={`${isLarge ? 'w-5 h-5' : 'w-4 h-4'} group-hover:scale-110 transition-transform`} />
                    {t('healthCheck.orderNow')}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
