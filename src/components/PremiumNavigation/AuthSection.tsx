import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, LogOut, LayoutDashboard, Zap } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { User } from '@/types';

interface AuthSectionProps {
  isAuthenticated: boolean;
  user: User | null;
  onLogout: () => void;
}

/**
 * Auth Section with User Menu
 * Displays login/logout and user profile
 */
export default function AuthSection({ isAuthenticated, user, onLogout }: AuthSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3">
      {isAuthenticated && user ? (
        <>
          <Link
            to="/dashboard"
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors rounded-xl hover:bg-zinc-800/50"
          >
            <LayoutDashboard className="w-4 h-4" />
            {t('nav.dashboard')}
          </Link>
          <div className="flex items-center gap-2">
            <motion.div
              className="hidden md:flex items-center gap-3 px-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl"
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-sm font-bold text-black">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white max-w-[100px] truncate">
                  {user.email?.split('@')[0] || 'User'}
                </span>
                <span className="text-[10px] text-emerald-400">{t('premiumnavigation.premium_member')}</span>
              </div>
            </motion.div>
            <motion.button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-400 hover:text-red-400 transition-colors rounded-xl hover:bg-red-500/10"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.logout')}</span>
            </motion.button>
          </div>
        </>
      ) : (
        <>
          <Link
            to="/login"
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors rounded-xl hover:bg-zinc-800/50"
          >
            <LogIn className="w-4 h-4" />
            {t('auth.login.loginButton')}
          </Link>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/login"
              className="relative flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all overflow-hidden group"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <Zap className="w-4 h-4" />
              {t('landing.hero.cta')}
            </Link>
          </motion.div>
        </>
      )}
    </div>
  );
}
