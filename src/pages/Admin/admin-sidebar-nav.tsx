/**
 * Admin Sidebar Navigation — desktop collapsed/expanded + mobile drawer
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Users,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  DollarSign,
  Package,
  ClipboardList,
  ShieldCheck,
  Activity,
  Settings,
} from 'lucide-react';
import { useTranslation } from '@/hooks';
import { AdminSidebarMobileDrawer } from './admin-sidebar-mobile-drawer';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
}

interface AdminSidebarNavProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (v: boolean) => void;
}

export const AdminSidebarNav: React.FC<AdminSidebarNavProps> = ({
  sidebarCollapsed,
  setSidebarCollapsed,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems: NavItem[] = [
    { id: 'overview', label: t('admin.nav.overview'), icon: <LayoutDashboard size={20} />, path: '/admin', badge: '3' },
    { id: 'cms', label: t('admin.nav.content'), icon: <FileText size={20} />, path: '/admin/cms' },
    { id: 'partners', label: t('admin.nav.partners'), icon: <Users size={20} />, path: '/admin/partners', badge: '5' },
    { id: 'finance', label: t('admin.nav.finance'), icon: <Wallet size={20} />, path: '/admin/finance', badge: '2' },
    { id: 'orders', label: t('admin.nav.orders'), icon: <DollarSign size={20} />, path: '/admin/orders' },
    { id: 'products', label: t('admin.nav.products'), icon: <Package size={20} />, path: '/admin/products' },
    { id: 'strategy', label: t('admin.nav.strategy'), icon: <Settings size={20} />, path: '/admin/policy-engine' },
    { id: 'audit', label: t('admin.nav.auditLog'), icon: <ClipboardList size={20} />, path: '/admin/audit-log' },
  ];

  const NavButton = ({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) => {
    const active = isActive(item.path);
    return (
      <button
        key={item.id}
        onClick={onNavigate}
        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all relative group ${
          active
            ? 'bg-zinc-900 border border-white/10 text-white shadow-2xl'
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
        }`}
      >
        {active && (
          <motion.div
            layoutId="active-pill"
            className="absolute left-0 w-1.5 h-6 bg-teal-500 rounded-r-full shadow-[0_0_15px_rgba(20,184,166,0.6)]"
          />
        )}
        <span className={`transition-transform duration-500 group-hover:scale-110 ${active ? 'text-teal-400' : ''}`}>
          {item.icon}
        </span>
        {!sidebarCollapsed && (
          <>
            <span className="font-black text-[11px] uppercase tracking-[0.2em] flex-1 text-left italic">
              {item.label}
            </span>
            {item.badge && (
              <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg border italic ${
                active
                  ? 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
              }`}>
                {item.badge}
              </span>
            )}
          </>
        )}
        {sidebarCollapsed && item.badge && (
          <span className="absolute top-2 right-2 w-5 h-5 bg-rose-500 text-white text-[9px] flex items-center justify-center rounded-full font-black border-2 border-zinc-950">
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 100 : 300 }}
        className="bg-zinc-950 border-r border-white/5 flex flex-col fixed h-screen z-40 hidden md:flex shadow-2xl"
      >
        <div className="h-24 flex items-center justify-between px-8 border-b border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-transparent opacity-50" />
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 relative z-10"
            >
              <div className="w-10 h-10 bg-[#00575A] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,87,90,0.3)]">
                <ShieldCheck className="text-emerald-400 w-6 h-6" />
              </div>
              <div>
                <h1 className="font-black text-white uppercase italic tracking-tighter text-lg leading-tight">
                  {t('admin.mission')}
                </h1>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] opacity-80">{t('admin.control_center')}</p>
              </div>
            </motion.div>
          )}
          {sidebarCollapsed && (
            <div className="mx-auto relative z-10">
              <ShieldCheck className="text-emerald-400 w-8 h-8 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]" />
            </div>
          )}
        </div>

        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-6 mt-8 p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-[1.5rem] relative group overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-125 transition-transform duration-1000">
              <Activity size={60} className="text-emerald-500" />
            </div>
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest italic">{t('admin.ai_sentinel_active')}</span>
            </div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest relative z-10">{t('admin.monitoring_2_4k_identity_nodes')}</p>
          </motion.div>
        )}

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <NavButton key={item.id} item={item} onNavigate={() => navigate(item.path)} />
          ))}
        </nav>

        <div className="p-8 border-t border-white/5 bg-zinc-950/50 backdrop-blur-sm space-y-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-4 px-6 py-4 bg-zinc-900/50 border border-teal-500/20 rounded-2xl text-teal-400 hover:text-white hover:bg-teal-500/10 transition-all group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            {!sidebarCollapsed && (
              <span className="font-black text-[11px] uppercase tracking-[0.2em] italic">{t('admin.b_ng_i_u_khi_n')}</span>
            )}
          </button>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center py-4 bg-zinc-900 border border-white/5 rounded-2xl text-zinc-500 hover:text-white transition-all shadow-xl group"
          >
            {sidebarCollapsed
              ? <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              : <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            }
          </button>

          {!sidebarCollapsed && (
            <div className="flex items-center gap-4 mt-4 px-2 group cursor-pointer">
              <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-teal-400 font-black border border-white/5 shadow-2xl group-hover:border-teal-500/30 transition-all">
                A
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-white uppercase italic tracking-widest">{t('admin.administrator')}</p>
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mt-0.5">{t('admin.superuser_node')}</p>
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Mobile Drawer */}
      <AdminSidebarMobileDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navItems={navItems}
        isActive={isActive}
        onNavigate={navigate}
      />
    </>
  );
};
