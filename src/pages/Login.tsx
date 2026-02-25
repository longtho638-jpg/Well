/**
 * WellNexus Unified Login (Max Level)
 * 
 * Production-certified authentication gateway.
 * Refactored for absolute zero technical debt and ultra-premium aesthetics.
 * 
 * Logic handled by useLogin.ts.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { GridPattern } from '../components/ui/Aura';
import { useLogin } from '../hooks/useLogin';
import { useTranslation } from '@/hooks';

export default function Login() {
    const { t } = useTranslation();
    const {
        register,
        handleSubmit,
        errors,
        serverError,
        loading,
        showPassword,
        setShowPassword,
        success,
    } = useLogin();

    return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden" aria-labelledby="login-heading">
            <GridPattern className="opacity-20" />

            {/* Ambient Glows */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-900/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-900/10 blur-[120px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block mb-6 group" aria-label={t('auth.login.backToHome')}>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-14 h-14 bg-gradient-to-br from-[#00575A] to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-teal-500/20 mx-auto transition-all"
                        >
                            W
                        </motion.div>
                    </Link>
                    <h1 id="login-heading" className="text-3xl font-display font-bold text-white mb-2 tracking-tight">{t('auth.login.title')}</h1>
                    <p className="text-slate-400">{t('auth.login.subtitle')}</p>
                </div>

                <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/60 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    {/* Success Overlay */}
                    <AnimatePresence>
                        {success && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center text-white"
                            >
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", damping: 12 }}
                                    className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-4"
                                >
                                    <CheckCircle className="w-8 h-8 text-white" />
                                </motion.div>
                                <p className="text-xl font-bold">{t('common.success')}</p>
                                <p className="text-slate-400 text-sm mt-1">{t('common.loading')}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {serverError && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3 mb-6"
                            role="alert"
                        >
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink0 mt-0.5" aria-hidden="true" />
                            <p className="text-sm text-red-200">{serverError}</p>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="login-email" className="text-sm font-semibold text-slate-300 ml-1">
                                {t('auth.login.email')}
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                                <input
                                    id="login-email"
                                    type="email"
                                    {...register('email')}
                                    placeholder="user@example.com"
                                    className="w-full bg-slate-950/50 border border-slate-700/50 text-white rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/50 transition-all placeholder:text-slate-600"
                                />
                            </div>
                            {errors.email && (
                                <p className="text-xs text-red-400 ml-1 mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label htmlFor="login-password" className="text-sm font-semibold text-slate-300">
                                    {t('auth.login.password')}
                                </label>
                                <Link to="/forgot-password" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
                                    {t('auth.login.forgotPassword')}
                                </Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('password')}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-950/50 border border-slate-700/50 text-white rounded-2xl py-3.5 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/50 transition-all placeholder:text-slate-600"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition-colors"
                                    aria-label={showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs text-red-400 ml-1 mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-2 select-none">
                            <input
                                id="login-remember"
                                type="checkbox"
                                {...register('rememberMe')}
                                className="w-5 h-5 rounded-lg border border-slate-700 bg-transparent checked:bg-teal-500 checked:border-teal-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-teal-500"
                            />
                            <label htmlFor="login-remember" className="text-xs text-slate-400 cursor-pointer">{t('auth.login.rememberMe')}</label>
                        </div>

                        <div className="space-y-3 pt-2">
                            <button
                                type="submit"
                                disabled={loading || success}
                                className="w-full bg-gradient-to-r from-[#00575A] to-teal-600 hover:from-teal-700 hover:to-teal-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-teal-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:grayscale group"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {t('common.loading')}
                                    </>
                                ) : (
                                    <>
                                        {t('auth.login.loginButton')}
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <p className="mt-8 text-center text-slate-500 text-sm">
                    {t('auth.login.noAccount')}{' '}
                    <Link to="/signup" className="text-teal-400 font-bold hover:text-teal-300 transition-colors">
                        {t('auth.login.signUp')}
                    </Link>
                </p>
            </motion.div>
        </main>
    );
}