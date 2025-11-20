
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import ProductCard from '../components/ProductCard';
import { Search, Sparkles, Bot, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../types';

export const Marketplace: React.FC = () => {
  const { products } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<{ text: string; productIds: string[] } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

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
          text: `Based on current market trends and your sales history, **${suggested.name}** is the hottest pick right now! It offers a high ${suggested.commissionRate * 100}% commission rate.`,
          productIds: [suggested.id]
        });
      }
      setLoadingAi(false);
    };

    generateRecommendations();
  }, [products]);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-brand-dark">Marketplace</h2>
        <div className="relative w-full sm:w-72">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
           </div>
           <input type="text" placeholder="Search products..." className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
               <h3 className="font-bold text-lg">AI Opportunity Radar</h3>
               <span className="bg-yellow-400 text-indigo-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Live
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
                  Analyzing 124 market signals...
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
                        <Sparkles className="w-3 h-3" /> AI Recommended
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
           <h3 className="text-lg font-bold text-gray-800">No products found</h3>
        </div>
      )}
    </div>
  );
};
