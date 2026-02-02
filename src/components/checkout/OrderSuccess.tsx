import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';
import { useTranslation } from '@/hooks';

export const OrderSuccess: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Prevent direct access if no order just placed (basic check could be added via location state)

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-[2.5rem] p-10 text-center shadow-2xl border border-zinc-200 dark:border-white/5">
                <div className="w-24 h-24 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                    <CheckCircle className="w-12 h-12 text-teal-500" />
                </div>

                <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-4">{t('checkout.successPage.title')}</h1>
                <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
                    {t('checkout.successPage.message')}
                </p>

                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/marketplace')}
                        className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                        {t('checkout.successPage.continueShopping')} <ArrowRight size={18} />
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-900 dark:text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                        <Home size={18} /> {t('checkout.successPage.backToHome')}
                    </button>
                </div>
            </div>
        </div>
    );
};
