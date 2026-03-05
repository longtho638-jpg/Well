/**
 * WellNexus Admin Layout (Mission Control Aura Elite)
 * RaaS GATED: Requires valid license key
 */

import React, { useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { NotificationCenter } from '@/components/admin/NotificationCenter';
import { AdminSidebarNav } from './Admin/admin-sidebar-nav';
import { hasFeature } from '@/lib/raas-gate';

const Admin: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // RaaS License Gate - deny access without valid license
  const hasAdminAccess = hasFeature('adminDashboard');

  if (!hasAdminAccess) {
    return <Navigate to="/" replace />;
  }

  const navItems = [
    { id: 'overview', path: '/admin', label: t('admin.nav.overview') },
    { id: 'cms', path: '/admin/cms', label: t('admin.nav.content') },
    { id: 'partners', path: '/admin/partners', label: t('admin.nav.partners') },
    { id: 'finance', path: '/admin/finance', label: t('admin.nav.finance') },
    { id: 'orders', path: '/admin/orders', label: t('admin.nav.orders') },
    { id: 'products', path: '/admin/products', label: t('admin.nav.products') },
    { id: 'strategy', path: '/admin/policy-engine', label: t('admin.nav.strategy') },
    { id: 'audit', path: '/admin/audit-log', label: t('admin.nav.auditLog') },
  ];

  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-dark-bg flex text-dark-text-secondary font-sans selection:bg-brand-primary/30 selection:text-brand-accent">
      <AdminSidebarNav
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? (typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : 100) : (typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : 300) }}
      >
        <header className="h-24 bg-zinc-950/80 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-10 sticky top-0 z-30 shadow-xl">
          <div className="flex items-center gap-8">
            <button className="md:hidden p-3 bg-zinc-900 rounded-xl text-zinc-400 shadow-xl" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 italic">
              <span className="hover:text-zinc-400 transition-colors cursor-pointer">{t('admin.administration')}</span>
              <span className="text-zinc-800">/</span>
              <motion.span
                key={location.pathname}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-white bg-white/5 px-4 py-1.5 rounded-lg border border-white/5"
              >
                {navItems.find(item => isActive(item.path))?.label || 'Overview'}
              </motion.span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-white shadow-xl transition-all"
            >
              <Search size={20} />
            </motion.button>
            <NotificationCenter />
            <div className="h-10 w-px bg-white/5 mx-2" />
            <div className="flex items-center gap-3 bg-[#00575A]/10 border border-[#00575A]/20 px-4 py-2 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest italic">{t('admin.secure_session')}</span>
            </div>
          </div>
        </header>

        <main className="p-10 relative">
          <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-teal-500/5 rounded-full blur-[150px] -mr-64 -mt-64 pointer-events-none" />
          <div className="relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: "circOut" }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Admin;
