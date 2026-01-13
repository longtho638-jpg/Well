import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { GridPattern } from '../components/ui/Aura';
import { useTranslation } from '../hooks';

// Components
import { SignupForm } from '@/components/auth/SignupForm';

export default function Signup() {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            <GridPattern className="opacity-20" />

            {/* Ambient Intelligence Layer */}
            <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-violet-900/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute top-0 left-0 w-[600px] h-[400px] bg-teal-900/10 blur-[100px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block mb-6">
                        <div className="w-14 h-14 bg-gradient-to-br from-[#00575A] to-teal-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-teal-500/20 mx-auto transform hover:scale-105 transition-transform duration-500">
                            W
                        </div>
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-1.5 mb-6"
                    >
                        <Sparkles className="w-3 h-3 text-teal-400" />
                        <span className="text-[10px] font-black text-teal-300 uppercase tracking-[0.2em]">{t('signup.early_access_2_0')}</span>
                    </motion.div>

                    <h1 className="text-4xl font-black text-white mb-3 tracking-tighter uppercase italic">{t('auth.register.title')}</h1>
                    <p className="text-slate-400 font-medium italic">{t('auth.register.subtitle')}</p>
                </div>

                <SignupForm />

                <p className="mt-10 text-center text-slate-400 font-medium">
                    {t('auth.register.haveAccount')}{' '}
                    <Link to="/login" className="text-teal-400 font-black hover:text-teal-300 transition-all underline underline-offset-8 decoration-teal-500/30 hover:decoration-teal-500 uppercase italic text-xs tracking-widest">
                        {t('auth.register.login')}
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
