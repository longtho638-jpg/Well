
import React, { useState } from 'react';
import { LayoutDashboard, ShoppingBag, Wallet, LogOut, Sparkles, Bot, CheckCircle2, Circle, Users, Share2, Trophy, Heart, Megaphone, Moon, Sun, Activity, Shield, Settings } from 'lucide-react';
import { getCoachAdvice } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../hooks';
import { useTheme } from '../context/ThemeContext';
import { isAdmin as checkIsAdmin } from '@/utils/admin-check';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  matches?: string[];
  badge?: string;
}

interface SidebarProps {
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onMobileClose }) => {
  const { t } = useTranslation();
  const { user, quests, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if current user is admin
  const isAdmin = checkIsAdmin(user?.email) || user?.role === 'admin' || user?.isAdmin === true;

  const menuItems: MenuItem[] = [
    { path: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: '/dashboard/marketplace', label: t('nav.marketplace'), icon: ShoppingBag, matches: ['/dashboard/product'] },
    { path: '/dashboard/wallet', label: t('nav.wallet'), icon: Wallet },
    { path: '/dashboard/leaderboard', label: t('nav.leaderboard'), icon: Trophy, badge: 'HOT' },
    { path: '/dashboard/marketing-tools', label: t('nav.marketingTools'), icon: Megaphone, badge: 'NEW' },
    { path: '/dashboard/agents', label: 'Agent Dashboard', icon: Activity },
    { path: '/dashboard/health-check', label: t('nav.healthCheck'), icon: Heart },
    { path: '/dashboard/health-coach', label: t('nav.healthCoach'), icon: Sparkles, badge: 'AI' },
    { path: '/dashboard/copilot', label: t('nav.copilot'), icon: Bot, badge: 'AI' },
    { path: '/dashboard/team', label: t('nav.team'), icon: Users },
    { path: '/dashboard/network', label: t('nav.network'), icon: Users },
    { path: '/dashboard/withdrawal', label: t('nav.withdrawal'), icon: Wallet },
    { path: '/dashboard/referral', label: t('nav.referral'), icon: Share2 },
    { path: '/dashboard/settings', label: t('nav.settings'), icon: Settings },
    // Admin menu - only visible to admin users
    ...(isAdmin ? [{ path: '/admin', label: t('nav.admin'), icon: Shield, badge: 'ADMIN' }] : []),
  ];

  const handleNav = (path: string) => {
    navigate(path);
    if (onMobileClose) onMobileClose();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleAdvice = async () => {
    setLoading(true);
    try {
      const pending = quests.filter(q => !q.isCompleted).map(q => q.title);
      const text = await getCoachAdvice(user.name, user.totalSales, pending);
      setAdvice(text);
    } catch {
      setAdvice("Focus on sharing value today. Sales will follow!");
    }
    setLoading(false);
  };

  return (
    <aside
      className="bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-screen overflow-y-auto transition-colors"
      role="navigation"
      aria-label="Main navigation"
    >
      <div
        className="p-6 flex items-center gap-3 cursor-pointer"
        onClick={() => handleNav('/dashboard')}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleNav('/dashboard');
          }
        }}
        aria-label="WellNexus home"
      >
        <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-emerald-400 font-bold shadow-lg border border-zinc-800 flex-shrink-0">W</div>
        <div>
          <h1 className="font-bold text-xl text-zinc-900 dark:text-zinc-100 leading-none">{t('sidebar.wellnexus')}</h1>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-semibold mt-1">{t('sidebar.social_commerce')}</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 py-4" aria-label="Primary navigation">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.matches && item.matches.some(m => location.pathname.startsWith(m)));

          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Navigate to ${item.label}`}
            >
              <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-zinc-300'}`} aria-hidden="true" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden shadow-xl group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm">
                <Bot className="w-4 h-4 text-emerald-400" /> {t('sidebar.the_coach')}</div>
              <span className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full border border-zinc-700">{t('sidebar.day_3_30')}</span>
            </div>

            <div className="space-y-2 mb-4">
              {quests.map((q) => (
                <div key={q.id} className="flex items-start gap-2 text-xs">
                  {q.isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <Circle className="w-4 h-4 text-zinc-600 shrink-0" />}
                  <div className="flex-1">
                    <p className={`font-medium ${q.isCompleted ? 'text-zinc-400 line-through' : 'text-zinc-300'}`}>{q.title}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">+{q.xp}{t('sidebar.xp')}</span>
                </div>
              ))}
            </div>

            <AnimatePresence mode='wait'>
              {advice ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-zinc-800 rounded-lg p-3 text-xs text-zinc-300 italic border border-zinc-700 mb-2"
                  role="status"
                  aria-live="polite"
                >
                  "{advice}"
                </motion.div>
              ) : (
                <button
                  onClick={handleAdvice}
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                  aria-label={loading ? t('common.loading') : 'Get personalized AI advice'}
                >
                  {loading ? <Sparkles className="w-3 h-3 animate-spin" aria-hidden="true" /> : <Sparkles className="w-3 h-3" aria-hidden="true" />} {t('sidebar.get_ai_advice')}</button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="px-6 py-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-900/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all group"
          aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
        >
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-zinc-800 text-zinc-400' : 'bg-amber-100 text-amber-600'}`}>
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">
              {theme === 'dark' ? t('nav.darkMode') : t('nav.lightMode')}
            </span>
          </div>
          <div className={`w-8 h-4 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-emerald-500/20' : 'bg-zinc-200'}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-300 ${theme === 'dark' ? 'left-4.5 bg-emerald-400' : 'left-0.5 bg-white shadow-sm'}`}
              style={{ left: theme === 'dark' ? '18px' : '2px' }}
            />
          </div>
        </button>
      </div>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <img
            src={user.avatarUrl}
            alt={`${user.name}'s profile picture`}
            className="w-10 h-10 rounded-full border border-zinc-700 shadow-sm object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{user.name}</p>
            <p className="text-xs text-emerald-400 font-medium" aria-label={`Rank: ${user.rank}`}>{user.rank}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-zinc-400 hover:text-red-400 transition p-2 rounded-full hover:bg-zinc-800"
            aria-label={t('nav.logout')}
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
};
