
import React, { useState } from 'react';
import { LayoutDashboard, ShoppingBag, Wallet, LogOut, Sparkles, Bot, CheckCircle2, Circle, Users, Share2, Trophy, Heart, Megaphone, Moon, Sun, Activity } from 'lucide-react';
import { getCoachAdvice } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../hooks';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onMobileClose }) => {
  const t = useTranslation();
  const { user, quests, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const menuItems = [
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
    { path: '/dashboard/referral', label: t('nav.referral'), icon: Share2 },
  ];

  const handleNav = (path: string) => {
    navigate(path);
    if (onMobileClose) onMobileClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleAdvice = async () => {
    setLoading(true);
    try {
       const pending = quests.filter(q => !q.isCompleted).map(q => q.title);
       const text = await getCoachAdvice(user.name, user.totalSales, pending);
       setAdvice(text);
    } catch (e) {
       setAdvice("Focus on sharing value today. Sales will follow!");
    }
    setLoading(false);
  };

  return (
    <aside
      className="bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col h-screen overflow-y-auto transition-colors"
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
        <div className="w-10 h-10 bg-brand-primary dark:bg-teal-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-brand-primary/30 flex-shrink-0">W</div>
        <div>
          <h1 className="font-bold text-xl text-brand-primary dark:text-teal-400 leading-none">WellNexus</h1>
          <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest font-semibold mt-1">Social Commerce</p>
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
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-brand-primary dark:bg-teal-600 text-white shadow-md shadow-brand-primary/20'
                  : 'text-gray-500 dark:text-slate-400 hover:bg-brand-primary/5 dark:hover:bg-slate-800 hover:text-brand-primary dark:hover:text-teal-400'
              }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Navigate to ${item.label}`}
            >
              <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-brand-accent' : 'group-hover:text-brand-primary'}`} aria-hidden="true" />
              <span className="flex-1 text-left">{item.label}</span>
              {(item as any).badge && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-brand-accent text-brand-primary' : 'bg-brand-accent/10 text-brand-accent'
                }`}>
                  {(item as any).badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4">
        <div className="bg-brand-primary rounded-2xl p-5 relative overflow-hidden shadow-xl group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent opacity-10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Bot className="w-4 h-4 text-brand-accent" /> The Coach
              </div>
              <span className="text-[10px] font-bold bg-white/10 text-white px-2 py-1 rounded-full border border-white/10">Day 3/30</span>
            </div>

            <div className="space-y-2 mb-4">
              {quests.map((q) => (
                <div key={q.id} className="flex items-start gap-2 text-xs">
                   {q.isCompleted ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> : <Circle className="w-4 h-4 text-brand-accent shrink-0" />}
                   <div className="flex-1">
                      <p className={`font-medium ${q.isCompleted ? 'text-gray-400 line-through' : 'text-gray-100'}`}>{q.title}</p>
                   </div>
                   <span className="text-[10px] font-bold text-brand-accent bg-brand-accent/10 px-1.5 py-0.5 rounded">+{q.xp}XP</span>
                </div>
              ))}
            </div>

             <AnimatePresence mode='wait'>
                {advice ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white/10 rounded-lg p-3 text-xs text-gray-100 italic border border-white/10 mb-2"
                      role="status"
                      aria-live="polite"
                    >
                      "{advice}"
                    </motion.div>
                ) : (
                    <button
                      onClick={handleAdvice}
                      disabled={loading}
                      className="w-full py-2.5 bg-brand-accent dark:bg-yellow-400 hover:bg-yellow-400 dark:hover:bg-yellow-300 active:bg-yellow-500 dark:active:bg-yellow-400 text-brand-primary dark:text-slate-900 font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30"
                      aria-label={loading ? t('common.loading') : 'Get personalized AI advice'}
                    >
                        {loading ? <Sparkles className="w-3 h-3 animate-spin" aria-hidden="true" /> : <Sparkles className="w-3 h-3" aria-hidden="true" />} Get AI Advice
                    </button>
                )}
             </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Theme Toggle Button */}
      <div className="px-4 pb-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleTheme}
          className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center gap-3 transition-all font-semibold text-gray-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-5 h-5" aria-hidden="true" />
              <span>Dark Mode</span>
            </>
          ) : (
            <>
              <Sun className="w-5 h-5" aria-hidden="true" />
              <span>Light Mode</span>
            </>
          )}
        </motion.button>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <img
            src={user.avatarUrl}
            alt={`${user.name}'s profile picture`}
            className="w-10 h-10 rounded-full border border-gray-100 dark:border-slate-700 shadow-sm object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">{user.name}</p>
            <p className="text-xs text-brand-primary dark:text-teal-400 font-medium" aria-label={`Rank: ${user.rank}`}>{user.rank}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
            aria-label={t('nav.logout')}
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
};
