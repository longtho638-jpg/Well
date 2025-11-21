import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

/**
 * AppLayout - Master wrapper for all Dashboard/Protected pages
 *
 * Features:
 * - Desktop: Fixed sidebar on left, scrollable content on right
 * - Mobile: Hidden sidebar with drawer, fixed header with hamburger menu
 * - Container: Centered content with consistent padding across all screen sizes
 * - Scroll: Independent scrolling for main content (not entire page)
 */
export const AppLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <div className="flex h-screen bg-gray-100 dark:bg-slate-900 font-sans text-gray-900 dark:text-slate-100 overflow-hidden transition-colors">
      {/* ================================================================ */}
      {/* DESKTOP SIDEBAR - Fixed left, always visible on md+ screens */}
      {/* ================================================================ */}
      <div className="hidden md:block w-72 flex-shrink-0">
        <Sidebar />
      </div>

      {/* ================================================================ */}
      {/* MOBILE HEADER - Fixed top, only visible on small screens */}
      {/* ================================================================ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-primary dark:bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md shadow-brand-primary/20">
              W
            </div>
            <span className="font-bold text-brand-primary dark:text-teal-400 text-lg tracking-tight">
              WellNexus
            </span>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200 dark:active:bg-slate-700 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-gray-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* MOBILE MENU DRAWER - Slide from left with backdrop */}
      {/* ================================================================ */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Sidebar Drawer */}
          <div className="w-72 h-full bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-300">
            <Sidebar onMobileClose={() => setIsMobileMenuOpen(false)} />
          </div>

          {/* Backdrop */}
          <div
            className="flex-1 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          />
        </div>
      )}

      {/* ================================================================ */}
      {/* MAIN CONTENT AREA - Scrollable, centered container */}
      {/* ================================================================ */}
      <main className="flex-1 h-screen overflow-y-auto scroll-smooth">
        {/* Add top padding on mobile to account for fixed header */}
        <div className="pt-16 md:pt-0">
          {/* Centered container with responsive padding */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
