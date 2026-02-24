import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { GlassCard } from '../../components/ui/GlassCard';
import { ShieldCheck, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { authLogger } from '../../lib/logger';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { initialize } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
         // Check role
         const isFounder = data.user.app_metadata?.role === 'founder' || data.user.user_metadata?.role === 'founder';

         if (!isFounder) {
             await supabase.auth.signOut();
             throw new Error('Access denied: Founder privileges required.');
         }

         // Force store update
         await initialize();
         navigate('/');
      }
    } catch (err: any) {
      authLogger.error('Login failed', err);
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg dark:bg-dark-bg p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-primary/10 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[150px]" />

      <GlassCard className="w-full max-w-md p-8 relative z-10" hoverEffect={false}>
        <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-primary to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20 mb-4">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Admin Portal</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Đăng nhập quyền quản trị</p>
        </div>

        {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
            </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <Input
                type="email"
                placeholder="admin@wellnexus.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mật khẩu</label>
            <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                required
            />
          </div>

          <Button
            type="submit"
            className="w-full mt-2"
            size="lg"
            isLoading={loading}
          >
            Đăng nhập
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
