
import React, { useState } from 'react';
import { LayoutDashboard, ShoppingBag, Wallet, LogOut, Sparkles, Bot, CheckCircle2, Circle, Users, Share2 } from 'lucide-react';
import { getCoachAdvice } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onMobileClose }) => {
  const { user, quests, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const menuItems = [
    { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { path: '/dashboard/marketplace', label: 'Marketplace', icon: ShoppingBag, matches: ['/dashboard/product'] },
    { path: '/dashboard/wallet', label: 'My Wallet', icon: Wallet },
    { path: '/dashboard/copilot', label: 'The Copilot', icon: Bot, badge: 'AI' },
    { path: '/dashboard/team', label: 'Team Leader', icon: Users },
    { path: '/dashboard/referral', label: 'Giới Thiệu', icon: Share2 },
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
      className="bg-white border-r border-gray-200 flex flex-col h-full md:h-screen sticky top-0 z-30 overflow-y-auto"
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
        <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-brand-primary/30 flex-shrink-0">W</div>
        <div>
          <h1 className="font-bold text-xl text-brand-primary leading-none">WellNexus</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mt-1">Social Commerce</p>
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
                  ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                  : 'text-gray-500 hover:bg-brand-primary/5 hover:text-brand-primary'
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
                      className="w-full py-2.5 bg-brand-accent hover:bg-yellow-400 text-brand-primary font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-yellow-500/20"
                      aria-label={loading ? 'Loading AI advice' : 'Get personalized AI advice'}
                    >
                        {loading ? <Sparkles className="w-3 h-3 animate-spin" aria-hidden="true" /> : <Sparkles className="w-3 h-3" aria-hidden="true" />} Get AI Advice
                    </button>
                )}
             </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <img
            src={user.avatarUrl}
            alt={`${user.name}'s profile picture`}
            className="w-10 h-10 rounded-full border border-gray-100 shadow-sm object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-brand-primary font-medium" aria-label={`Rank: ${user.rank}`}>{user.rank}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-500 transition p-2 rounded-full hover:bg-red-50"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
};
