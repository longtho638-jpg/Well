
import React, { useState } from 'react';
import { LayoutDashboard, ShoppingBag, Wallet, LogOut, Sparkles, Bot, CheckCircle2, Circle } from 'lucide-react';
import { getCoachAdvice } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';

interface SidebarProps {
  activeView: string;
  onChangeView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onChangeView }) => {
  const { user, quests } = useStore();
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
    { id: 'wallet', label: 'My Wallet', icon: Wallet },
  ];

  const handleGetAdvice = async () => {
    setLoading(true);
    try {
       const pending = quests.filter(q => !q.isCompleted).map(q => q.title);
       const text = await getCoachAdvice(user.name, user.totalSales, pending);
       setAdvice(text);
    } catch (e) {
       setAdvice("Focus on your team volume today! Growth happens together.");
    }
    setLoading(false);
  };

  return (
    <aside className="bg-white border-r border-gray-200 flex flex-col h-full md:h-screen sticky top-0 z-30 overflow-y-auto">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-brand-primary/30 flex-shrink-0">
          W
        </div>
        <div>
          <h1 className="font-bold text-xl text-brand-primary tracking-tight leading-none">WellNexus</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mt-1">Social Commerce</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-brand-primary'
              }`}
            >
              <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-brand-accent' : 'group-hover:text-brand-primary'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* THE COACH WIDGET (Agentic Layer) */}
      <div className="p-4">
        <div className="bg-brand-primary rounded-2xl p-5 relative overflow-hidden shadow-xl group">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent opacity-10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-transform duration-500 group-hover:scale-110"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Bot className="w-4 h-4 text-brand-accent" />
                The Coach
              </div>
              <span className="text-[10px] font-bold bg-white/10 text-white px-2 py-1 rounded-full border border-white/10">
                Day 3 / 30
              </span>
            </div>

            {/* Quests List */}
            <div className="space-y-2 mb-4">
              {quests.map((q) => (
                <div key={q.id} className="flex items-start gap-2 text-xs">
                   {q.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                   ) : (
                      <Circle className="w-4 h-4 text-brand-accent shrink-0" />
                   )}
                   <div className="flex-1">
                      <p className={`font-medium ${q.isCompleted ? 'text-gray-400 line-through' : 'text-gray-100'}`}>
                        {q.title}
                      </p>
                      {!q.isCompleted && <p className="text-gray-400 text-[10px] mt-0.5">{q.description}</p>}
                   </div>
                   <span className="text-[10px] font-bold text-brand-accent bg-brand-accent/10 px-1.5 py-0.5 rounded">+{q.xp}XP</span>
                </div>
              ))}
            </div>

            {/* AI Advice Area */}
             <AnimatePresence mode='wait'>
                {advice ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white/10 rounded-lg p-3 text-xs text-gray-100 italic border border-white/10 mb-2"
                    >
                        "{advice}"
                    </motion.div>
                ) : (
                    <button
                        onClick={handleGetAdvice}
                        disabled={loading}
                        className="w-full py-2.5 bg-brand-accent hover:bg-yellow-400 text-brand-primary font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-yellow-500/20"
                    >
                        {loading ? <Sparkles className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                        Get AI Advice
                    </button>
                )}
             </AnimatePresence>
          </div>
        </div>
      </div>

      {/* User Profile Snippet */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full border border-gray-100 shadow-sm object-cover" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-brand-primary font-medium">{user.rank}</p>
          </div>
          <button className="text-gray-400 hover:text-red-500 transition p-2 rounded-full hover:bg-red-50">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
