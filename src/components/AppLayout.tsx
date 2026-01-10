import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Bell, Search } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ui/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';

/**
 * AppLayout - Master wrapper for all Dashboard/Protected pages
 * Updated with Premium UI/UX, Animations, and Responsive Design (Phase 6)
 */
export const AppLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useStore();
  const location = useLocation();

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when mobile menu is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 transition-colors font-sans text-gray-900 dark:text-slate-100 overflow-hidden">
      {/* ================================================================ */}
      {/* DESKTOP SIDEBAR - Fixed left, always visible on md+ screens */}
      {/* ================================================================ */}
      <div className="hidden md:block w-64 flex-shrink-0 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 z-30">
        <Sidebar />
      </div>

      {/* ================================================================ */}
      {/* MOBILE MENU DRAWER */}
      {/* ================================================================ */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-64 h-full bg-white dark:bg-slate-800 shadow-2xl z-50"
          >
            <Sidebar onMobileClose={() => setIsMobileMenuOpen(false)} />
          </motion.div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MAIN CONTENT AREA */}
      {/* ================================================================ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header - Sticky */}
        <header className="sticky top-0 z-20 h-16 px-4 sm:px-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg md:hidden transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Search Bar (Hidden on small mobile) */}
            <div className="hidden sm:flex items-center relative group">
              <Search className="absolute left-3 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Tìm kiếm nhanh..."
                className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-slate-700 border-transparent focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-xl text-sm transition-all w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl relative transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></span>
            </button>

            <div className="h-8 w-px bg-gray-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

            <div className="flex items-center gap-3 pl-1 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{user.name}</p>
                <p className="text-xs text-primary font-medium">{user.rank}</p>
              </div>
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-primary to-teal-400 p-[2px]">
                  <div className="w-full h-full rounded-full bg-white dark:bg-slate-800 overflow-hidden">
                    <img
                      src={user.avatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content - Testing without AnimatePresence */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth bg-gradient-to-br from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};