import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { GridPattern, AuraBadge } from '../components/ui/Aura';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        console.log('[Login] Starting login for:', email);

        try {
            console.log('[Login] Calling signIn...');

            // Add timeout to prevent indefinite hang (30s for slow networks)
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Đăng nhập quá thời gian. Vui lòng kiểm tra kết nối mạng và thử lại.')), 30000)
            );

            const signInPromise = signIn(email, password);
            const result = await Promise.race([signInPromise, timeoutPromise]) as any;

            console.log('[Login] signIn result:', { data: result?.data, error: result?.error });

            // If error exists, it will be returned. If not, useAuth's listener handles the state update.
            if (result?.error) throw result.error;

            console.log('[Login] Success! Navigating to dashboard...');
            setLoading(false);
            // Navigate to dashboard on success (listener will update store state)
            // Small delay to ensure state updates
            setTimeout(() => navigate('/dashboard'), 500);

        } catch (err: any) {
            console.error('[Login] Login failed:', err);
            // Better error message for network/fetch errors
            let errorMessage = err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
            if (err.message?.includes('fetch') || err.message?.includes('network') || err.message?.includes('ENOTFOUND')) {
                errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.';
            }
            setError(errorMessage);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            <GridPattern className="opacity-20" />

            {/* Ambient Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-teal-900/20 blur-[120px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#00575A] to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-teal-500/20 mx-auto">
                            W
                        </div>
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2">Chào mừng trở lại</h1>
                    <p className="text-slate-400">Đăng nhập vào hệ điều hành thịnh vượng của bạn</p>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 mb-6"
                        >
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-200">{error}</p>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="name@example.com"
                                    className="w-full bg-slate-950/50 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all placeholder:text-slate-600"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-slate-300">
                                    Mật khẩu
                                </label>
                                <a href="#" className="text-sm text-teal-400 hover:text-teal-300 transition-colors">
                                    Quên mật khẩu?
                                </a>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-slate-950/50 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all placeholder:text-slate-600"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#00575A] to-teal-600 hover:from-teal-700 hover:to-teal-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-teal-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    Đăng Nhập
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-8 text-center text-slate-400">
                    Chưa có tài khoản?{' '}
                    <Link to="/signup" className="text-teal-400 font-bold hover:text-teal-300 transition-colors">
                        Đăng ký Founders Club
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
