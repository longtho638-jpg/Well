import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Users,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertCircle,
  Menu,
  Settings,
  X,
  Bot,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from '@/hooks';

// ============================================================
// ADMIN LAYOUT COMPONENT - Mission Control
// ============================================================

const Admin: React.FC = () => {
  const t = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Determine active route
  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="w-5 h-5" />,
      path: '/admin',
      badge: '3' // AI pending tasks
    },
    {
      id: 'cms',
      label: 'Content',
      icon: <FileText className="w-5 h-5" />,
      path: '/admin/cms'
    },
    {
      id: 'partners',
      label: 'Partners',
      icon: <Users className="w-5 h-5" />,
      path: '/admin/partners',
      badge: '5' // AI insights available
    },
    {
      id: 'finance',
      label: 'Finance',
      icon: <Wallet className="w-5 h-5" />,
      path: '/admin/finance',
      badge: '2' // Fraud alerts
    },
    {
      id: 'strategy',
      label: 'Strategy',
      icon: <Settings className="w-5 h-5" />,
      path: '/admin/policy-engine'
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ============================================================ */}
      {/* SIDEBAR - Desktop */}
      {/* ============================================================ */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 280 }}
        className="bg-white border-r border-slate-200 flex flex-col fixed h-screen z-30 hidden md:flex"
      >
        {/* Logo */}
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6">
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <Bot className="w-6 h-6 text-[#00575A]" />
              <h1 className="font-display font-bold text-xl text-[#00575A]">
                Mission Control
              </h1>
            </motion.div>
          )}
          {sidebarCollapsed && <Bot className="w-6 h-6 text-[#00575A] mx-auto" />}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* AI Status Banner */}
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-4 mt-4 p-3 bg-gradient-to-br from-[#00575A]/5 to-transparent border border-[#00575A]/20 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#00575A]" />
              <span className="text-xs font-medium text-[#00575A]">AI Sentinel Active</span>
            </div>
            <p className="text-xs text-slate-600">Monitoring 245 partners</p>
          </motion.div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative ${
                isActive(item.path)
                  ? 'bg-[#00575A] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.icon}
              {!sidebarCollapsed && (
                <>
                  <span className="font-medium flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      isActive(item.path)
                        ? 'bg-white/20 text-white'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {sidebarCollapsed && item.badge && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00575A] to-[#004447] flex items-center justify-center text-white font-bold">
              A
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Admin</p>
                <p className="text-xs text-slate-500">Super User</p>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* ============================================================ */}
      {/* MOBILE MENU */}
      {/* ============================================================ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="w-280 bg-white h-full flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6">
                <div className="flex items-center gap-2">
                  <Bot className="w-6 h-6 text-[#00575A]" />
                  <h1 className="font-display font-bold text-xl text-[#00575A]">Mission Control</h1>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive(item.path)
                        ? 'bg-[#00575A] text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        isActive(item.path)
                          ? 'bg-white/20 text-white'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MAIN CONTENT */}
      {/* ============================================================ */}
      <div
        className="flex-1 transition-all"
        style={{ marginLeft: sidebarCollapsed ? 80 : 280 }}
      >
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Admin</span>
              <span>/</span>
              <span className="text-slate-900 font-medium">
                {navItems.find(item => isActive(item.path))?.label || 'Overview'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Search className="w-5 h-5 text-slate-600" />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative">
              <AlertCircle className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Content Area - Outlet for nested routes */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Admin;
