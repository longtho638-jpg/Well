/**
 * Email Confirmation Page
 * Handles Supabase email confirmation redirects
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { GridPattern } from '../components/ui/Aura';
import { supabase } from '@/lib/supabase';
import { authLogger } from '@/utils/logger';
import { useTranslation } from '@/hooks';

type ConfirmationState = 'loading' | 'success' | 'error' | 'already_confirmed';

export default function ConfirmEmail() {
    const [state, setState] = useState<ConfirmationState>('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { t } = useTranslation();

    useEffect(() => {
        const confirmEmail = async () => {
            try {
                // Strategy 1: Check query params (token_hash + type) — Supabase email link format
                const tokenHash = searchParams.get('token_hash');
                const type = searchParams.get('type');

                if (tokenHash && type === 'signup') {
                    const { error } = await supabase.auth.verifyOtp({
                        token_hash: tokenHash,
                        type: 'signup',
                    });

                    if (error) {
                        if (error.message.includes('already been confirmed') || error.message.includes('already registered')) {
                            setState('already_confirmed');
                        } else {
                            authLogger.error('Email confirmation failed', error);
                            setState('error');
                            setErrorMessage(error.message);
                        }
                    } else {
                        setState('success');
                        setTimeout(() => navigate('/login'), 2000);
                    }
                    return;
                }

                // Strategy 2: Check hash fragment — Supabase implicit/PKCE flow
                const hash = window.location.hash;
                if (hash && hash.includes('access_token')) {
                    // Supabase JS client auto-processes hash fragments on page load
                    // Wait for the auth state change
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                        setState('success');
                        setTimeout(() => navigate('/login'), 2000);
                        return;
                    }
                }

                // Strategy 3: Check if already has a valid session (e.g., magic link clicked)
                const { data: { session: existingSession } } = await supabase.auth.getSession();
                if (existingSession) {
                    setState('already_confirmed');
                    return;
                }

                // No valid token found
                setState('error');
                setErrorMessage(t('auth.confirmEmail.invalidLink') || 'Invalid confirmation link');
            } catch (err) {
                authLogger.error('Confirmation error', err);
                setState('error');
                setErrorMessage(t('auth.confirmEmail.unexpectedError') || 'An unexpected error occurred');
            }
        };

        confirmEmail();
    }, [searchParams, navigate, t]);

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
                <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/60 rounded-3xl p-8 shadow-2xl">
                    {/* Loading State */}
                    {state === 'loading' && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 mx-auto">
                                <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                            </div>
                            <h1 className="text-2xl font-display font-bold text-white mb-2">
                                Confirming Email
                            </h1>
                            <p className="text-slate-400">
                                Please wait while we verify your email address...
                            </p>
                        </div>
                    )}

                    {/* Success State */}
                    {state === 'success' && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center"
                        >
                            <motion.div
                                initial={{ scale: 0.5 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", damping: 12 }}
                                className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-4 mx-auto"
                            >
                                <CheckCircle className="w-8 h-8 text-white" />
                            </motion.div>
                            <h1 className="text-2xl font-display font-bold text-white mb-2">
                                Email Confirmed!
                            </h1>
                            <p className="text-slate-400 mb-6">
                                Your email has been successfully verified. You can now log in to your account.
                            </p>
                            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Redirecting to login...
                            </div>
                        </motion.div>
                    )}

                    {/* Already Confirmed State */}
                    {state === 'already_confirmed' && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                                <Mail className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-display font-bold text-white mb-2">
                                Already Confirmed
                            </h1>
                            <p className="text-slate-400 mb-6">
                                This email has already been confirmed. You can log in to your account.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full bg-gradient-to-r from-[#00575A] to-teal-600 hover:from-teal-700 hover:to-teal-500 text-white font-bold py-3 rounded-2xl transition-all"
                            >
                                Go to Login
                            </button>
                        </div>
                    )}

                    {/* Error State */}
                    {state === 'error' && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                                <XCircle className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-display font-bold text-white mb-2">
                                Confirmation Failed
                            </h1>
                            <p className="text-slate-400 mb-2">
                                We couldn't confirm your email address.
                            </p>
                            <p className="text-sm text-red-400 mb-6">
                                {errorMessage || 'Invalid or expired confirmation link'}
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full bg-gradient-to-r from-[#00575A] to-teal-600 hover:from-teal-700 hover:to-teal-500 text-white font-bold py-3 rounded-2xl transition-all"
                                >
                                    Go to Login
                                </button>
                                <button
                                    onClick={() => navigate('/signup')}
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl transition-all"
                                >
                                    Sign Up Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <p className="mt-6 text-center text-slate-500 text-sm">
                    Need help?{' '}
                    <a href="mailto:support@wellnexus.vn" className="text-teal-400 hover:text-teal-300 transition-colors">
                        Contact Support
                    </a>
                </p>
            </motion.div>
        </div>
    );
}
