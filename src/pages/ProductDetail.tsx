
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { formatVND } from '../utils/format';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingBag, Share2, CheckCircle, Loader2, ShieldCheck, Package, Info, Leaf, Zap, Clock } from 'lucide-react';
import { checkCompliance } from '../services/geminiService';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, simulateOrder } = useStore();
  
  const product = products.find(p => p.id === id);
  const [activeTab, setActiveTab] = useState<'benefits' | 'ingredients' | 'usage'>('benefits');
  const [isBuying, setIsBuying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
            <Package className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-brand-dark mb-2">Product Not Found</h2>
        <p className="text-gray-500 mb-6">The product you are looking for might have been removed.</p>
        <button onClick={() => navigate('/marketplace')} className="bg-brand-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-dark transition-colors">
            Return to Marketplace
        </button>
      </div>
    );
  }

  const handleBuy = async () => {
    if (product.stock <= 0) return;
    setIsBuying(true);
    
    setTimeout(async () => {
        await simulateOrder(product.id);
        setIsBuying(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    }, 800);
  };

  const handleShare = () => {
    // Mock share functionality
    alert(`Link copied: wellnexus.vn/ref/VN-888/product/${product.id}`);
    checkCompliance(product.description);
  };

  const commissionAmount = product.price * product.commissionRate;
  const outOfStock = product.stock <= 0;

  // Mock Data for Enhanced Details
  const MOCK_DETAILS = {
    ingredients: [
        "Premium Vitamin C (Ascorbic Acid)",
        "Organic Zinc Gluconate", 
        "Elderberry Extract (Sambucus nigra)",
        "Echinacea Purpurea",
        "Natural Flavorings"
    ],
    benefits: [
        { title: "Boosts Immunity", desc: "Strengthens your body's natural defenses." },
        { title: "Increases Energy", desc: "Reduces fatigue and improves focus." },
        { title: "Skin Health", desc: "Promotes collagen production for radiant skin." }
    ],
    usage: "Take 1 tablet daily with water, preferably after a meal. Do not exceed recommended dose."
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="pb-24 max-w-5xl mx-auto"
    >
      {/* Breadcrumb / Back */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <button onClick={() => navigate('/marketplace')} className="hover:text-brand-primary flex items-center gap-1">
            Marketplace
        </button>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      <button 
        onClick={() => navigate('/marketplace')} 
        className="flex items-center gap-2 text-gray-500 hover:text-brand-primary mb-6 font-medium transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Products
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left: Product Image */}
            <div className="relative bg-gray-50 h-[400px] lg:h-auto flex items-center justify-center p-8 group">
                <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className={`w-full max-h-[400px] object-contain mix-blend-multiply transition-transform duration-700 ${outOfStock ? 'grayscale opacity-50' : 'group-hover:scale-105'}`}
                />
                {outOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm">
                        <span className="bg-gray-900 text-white text-lg font-bold px-6 py-2 rounded-full shadow-lg">Out of Stock</span>
                    </div>
                )}
                <div className="absolute top-4 left-4">
                    <span className="bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Authentic
                    </span>
                </div>
            </div>

            {/* Right: Product Info */}
            <div className="p-6 lg:p-10 flex flex-col">
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl font-bold text-brand-dark">{product.name}</h1>
                        <button onClick={handleShare} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1 text-brand-accent">
                            <ShieldCheck className="w-4 h-4 fill-current" />
                            <span className="text-sm font-bold text-gray-700">4.9 (128 Reviews)</span>
                        </div>
                        <div className="text-gray-300">|</div>
                        <div className="text-sm text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> In Stock: {product.stock}
                        </div>
                    </div>
                    <p className="text-gray-600 text-lg leading-relaxed">{product.description}</p>
                </div>

                {/* Price & Commission Card */}
                <div className="bg-brand-bg rounded-2xl p-6 mb-8 border border-brand-primary/5">
                    <div className="flex justify-between items-end mb-4 border-b border-gray-200 pb-4">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Retail Price</p>
                            <p className="text-3xl font-bold text-brand-dark">{formatVND(product.price)}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Your Commission</p>
                             <p className="text-2xl font-bold text-brand-accent">{formatVND(commissionAmount)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Info className="w-4 h-4 text-brand-primary" />
                        <span>You earn <span className="font-bold text-gray-900">{product.commissionRate * 100}%</span> on every sale made via your link.</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                        onClick={handleShare}
                        className="flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all"
                    >
                        <Share2 className="w-5 h-5" />
                        Share Link
                    </button>

                    <button 
                        onClick={handleBuy}
                        disabled={isBuying || outOfStock || showSuccess}
                        className={`flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all shadow-lg
                            ${showSuccess 
                                ? 'bg-green-500 text-white scale-105' 
                                : 'bg-brand-accent text-brand-primary hover:bg-yellow-400 hover:-translate-y-1 shadow-yellow-500/20'
                            }
                            ${(outOfStock || isBuying) ? 'opacity-70 cursor-not-allowed transform-none shadow-none' : ''}
                        `}
                    >
                         {isBuying ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : showSuccess ? (
                            <>
                                <CheckCircle className="w-6 h-6" />
                                Added to Wallet
                            </>
                        ) : (
                            <>
                                <ShoppingBag className="w-5 h-5" />
                                {outOfStock ? 'Out of Stock' : 'Buy Now'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>

        {/* Detailed Tabs */}
        <div className="border-t border-gray-100">
            <div className="flex border-b border-gray-100">
                {[
                    { id: 'benefits', label: 'Benefits', icon: Zap },
                    { id: 'ingredients', label: 'Ingredients', icon: Leaf },
                    { id: 'usage', label: 'How to Use', icon: Clock }
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold transition-colors border-b-2
                                ${activeTab === tab.id 
                                    ? 'border-brand-primary text-brand-primary bg-brand-primary/5' 
                                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                        >
                            <Icon className="w-4 h-4" /> {tab.label}
                        </button>
                    );
                })}
            </div>
            <div className="p-8 bg-gray-50/50 min-h-[200px]">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'ingredients' && (
                        <div>
                            <h3 className="font-bold text-gray-900 mb-4">Active Ingredients</h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {MOCK_DETAILS.ingredients.map((ing, i) => (
                                    <li key={i} className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-100">
                                        <Leaf className="w-4 h-4 text-green-500" />
                                        <span className="text-gray-700">{ing}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {activeTab === 'benefits' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {MOCK_DETAILS.benefits.map((ben, i) => (
                                <div key={i} className="bg-white p-5 rounded-xl border border-gray-100">
                                    <div className="w-10 h-10 bg-brand-accent/10 rounded-full flex items-center justify-center text-brand-accent mb-3">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <h4 className="font-bold text-gray-900 mb-1">{ben.title}</h4>
                                    <p className="text-sm text-gray-500">{ben.desc}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'usage' && (
                        <div className="flex items-start gap-4 bg-blue-50 p-6 rounded-xl text-blue-800">
                            <Clock className="w-6 h-6 shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold mb-2">Recommended Dosage</h4>
                                <p>{MOCK_DETAILS.usage}</p>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
      </div>
    </motion.div>
  );
};
