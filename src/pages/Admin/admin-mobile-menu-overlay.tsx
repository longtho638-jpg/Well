import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, Zap } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
}

interface AdminMobileMenuOverlayProps {
  open: boolean;
  navItems: NavItem[];
  isActive: (path: string) => boolean;
  onNavigate: (path: string) => void;
  onClose: () => void;
}

export function AdminMobileMenuOverlay({
  open,
  navItems,
  isActive,
  onNavigate,
  onClose
}: AdminMobileMenuOverlayProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[60] md:hidden"
          onClick={onClose}
        >
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="w-[300px] bg-zinc-950 h-full flex flex-col border-r border-white/5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-24 border-b border-white/5 flex items-center justify-between px-8">
              <div className="flex items-center gap-4">
                <ShieldCheck className="text-emerald-400 w-8 h-8" />
                <h1 className="font-black text-white uppercase italic tracking-tighter text-lg">{t('admin.mission_control')}</h1>
              </div>
              <button onClick={onClose} className="p-3 bg-zinc-900 rounded-xl text-zinc-500">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 p-6 space-y-3">
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.id}
                    onClick={() => { onNavigate(item.path); onClose(); }}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${
                      active ? 'bg-zinc-900 border border-white/10 text-white shadow-xl' : 'text-zinc-500'
                    }`}
                  >
                    {active && <Zap className="w-4 h-4 text-emerald-400" />}
                    <span className="font-black text-[11px] uppercase tracking-[0.2em] italic">{item.label}</span>
                    {item.badge && (
                      <span className={`ml-auto px-2 py-0.5 text-[9px] font-black rounded-lg border ${
                        active
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
