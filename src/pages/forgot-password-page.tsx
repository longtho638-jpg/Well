/**
 * Forgot Password Page
 * Allows users to request a password reset email.
 * Logic handled by useForgotPassword.ts.
 */

import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { GridPattern } from '../components/ui/Aura';
import { useTranslation } from '@/hooks';
import { useForgotPassword } from '../hooks/useForgotPassword';

export default function ForgotPasswordPage() {
    const { t } = useTranslation();
    const {
        register,
        handleSubmit,
        errors,
        serverError,
        loading,
        success,
    } = useForgotPassword();

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
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
                    <Link to="/" className="inline-block mb-6 group">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-14 h-14 bg-gradient-to-br from-[#00575A] to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-teal-500/20 mx-auto transition-all"
                        >
                            W
                        </motion.div>
                    </Link>
                    <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">{t('auth.forgotPassword.title')}</h1>
                    <p className="text-slate-400">{t('auth.forgotPassword.subtitle')}</p>
                </div>

                <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/60 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    {/* Success Overlay */}
                    <AnimatePresence>
                        {success && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center text-white p-6"
                            >
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", damping: 12 }}
                                    className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-4"
                                >
                                    <CheckCircle className="w-8 h-8 text-white" />
                                </motion.div>
                                <p className="text-xl font-bold mb-2">{t('common.success')}</p>
                                <p className="text-sm text-slate-300 text-center mb-6">{t('auth.forgotPassword.successMessage')}</p>
                                <Link
                                    to="/login"
                                    className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                                >
                                    {t('auth.forgotPassword.backToLogin')}
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Server Error Message */}
                        <AnimatePresence>
                            {serverError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300"
                                >
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm">{serverError}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 block">
                                {t('auth.login.email')}
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="email"
                                    {...register('email')}
                                    placeholder={t('auth.forgotPassword.emailPlaceholder')}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                    disabled={loading}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-xs text-red-400 ml-1 mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: loading ? 1 : 1.02 }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                        >
                            <span className={`flex items-center justify-center gap-2 ${loading ? 'opacity-0' : ''}`}>
                                {t('auth.forgotPassword.submitButton')}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                </div>
                            )}
                        </motion.button>

                        {/* Back to Login */}
                        <div className="text-center pt-4">
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors text-sm"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                {t('auth.forgotPassword.backToLogin')}
                            </Link>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
