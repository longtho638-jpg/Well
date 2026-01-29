/**
 * Premium Navigation Components - Phase 26
 * MAX LEVEL 2026 East Asian Brand Navigation
 *
 * Features:
 * - Glassmorphism dropdowns with premium blur
 * - Zen divider aesthetics
 * - Enhanced micro-interactions
 * - Smart auth-aware routing
 * - Living notification badge
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, ShoppingBag, Sparkles, Crown, Gem, Users, Globe } from 'lucide-react';
import { useStore } from '../store';
import { useTranslation } from '../hooks';
import Logo from './PremiumNavigation/Logo';
import DesktopNav from './PremiumNavigation/DesktopNav';
import AuthSection from './PremiumNavigation/AuthSection';
import MobileMenu from './PremiumNavigation/MobileMenu';
import NewsletterSection from './PremiumNavigation/NewsletterSection';
import FooterContent from './PremiumNavigation/FooterContent';
import FooterBottomBar from './PremiumNavigation/FooterBottomBar';

// ============================================================================
// NAVIGATION ITEMS - Real Routes with Auth-Aware Logic
// ============================================================================

interface NavChild {
  label: string;
  href: string;
  icon: React.ReactNode;
  description: string;
  badge?: string;
  badgeColor?: string;
}

interface NavItem {
  label: string;
  href?: string;
  children?: NavChild[];
  highlight?: boolean;
}

// ============================================================================
// PREMIUM HEADER - MAX LEVEL 2026
// ============================================================================

export function PremiumHeader() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useStore();

  // Dynamic navigation based on auth state
  const NAV_ITEMS: NavItem[] = [
    {
      label: t('nav.products'),
      children: [
        {
          label: t('nav.marketplace'),
          href: isAuthenticated ? '/dashboard/marketplace' : '/login?redirect=/dashboard/marketplace',
          icon: <ShoppingBag className="w-5 h-5" />,
          description: t('marketplace.subtitle'),
          badge: 'Hot',
          badgeColor: 'from-rose-500 to-orange-500'
        },
        {
          label: t('nav.healthCoach'),
          href: isAuthenticated ? '/dashboard/health-coach' : '/login?redirect=/dashboard/health-coach',
          icon: <Sparkles className="w-5 h-5" />,
          description: t('healthCoach.subtitle'),
          badge: 'New',
          badgeColor: 'from-cyan-500 to-blue-500'
        },
      ]
    },
    {
      label: t('nav.partner'),
      children: [
        {
          label: 'Venture Program', // Keep as is or add translation
          href: '/venture',
          icon: <Gem className="w-5 h-5" />,
          description: 'Gia nhập đội ngũ 200+ Co-Founders', // Can translate later
          badge: '🔥',
        },
        {
          label: t('team.leaderDashboard'),
          href: isAuthenticated ? '/dashboard/team' : '/login?redirect=/dashboard/team',
          icon: <Crown className="w-5 h-5" />,
          description: t('team.subtitle'),
        },
      ]
    },
    {
      label: t('nav.marketplace'),
      href: isAuthenticated ? '/dashboard/marketplace' : '/login?redirect=/dashboard/marketplace',
      highlight: true
    },
  ];

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`
          fixed top-0 left-0 right-0 z-50
          transition-all duration-500
          ${scrolled
            ? 'bg-zinc-950/80 backdrop-blur-2xl border-b border-zinc-800/50 shadow-2xl shadow-black/20'
            : 'bg-gradient-to-b from-zinc-950/80 to-transparent backdrop-blur-md'
          }
        `}
      >
        {/* Premium top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <Logo />
            <DesktopNav navItems={NAV_ITEMS} />
            <AuthSection
              isAuthenticated={isAuthenticated}
              user={user}
              onLogout={handleLogout}
            />

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/50 transition-colors"
              aria-label="Toggle menu"
            >
              <motion.div
                animate={{ rotate: mobileOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.div>
            </button>
          </div>
        </div>
      </motion.header>

      <MobileMenu
        isOpen={mobileOpen}
        navItems={NAV_ITEMS}
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
      />
    </>
  );
}

// ============================================================================
// PREMIUM FOOTER - MAX LEVEL 2026 East Asian Brand
// ============================================================================

const getFooterLinks = (isAuth: boolean) => [
  {
    title: 'Sản Phẩm',
    icon: <ShoppingBag className="w-4 h-4" />,
    links: [
      { label: 'Marketplace', href: isAuth ? '/dashboard/marketplace' : '/login?redirect=/dashboard/marketplace' },
      { label: 'AI Health Coach', href: isAuth ? '/dashboard/health-coach' : '/login?redirect=/dashboard/health-coach' },
    ]
  },
  {
    title: 'Partner',
    icon: <Users className="w-4 h-4" />,
    links: [
      { label: 'Venture Program', href: '/venture' },
      { label: 'Leader Dashboard', href: isAuth ? '/dashboard/team' : '/login?redirect=/dashboard/team' },
    ]
  },
  {
    title: 'Company',
    icon: <Globe className="w-4 h-4" />,
    links: [
      { label: 'About Us', href: '/venture' },
      { label: 'Careers', href: '/venture' },
    ]
  }
];

export function PremiumFooter() {
  const { isAuthenticated } = useStore();
  const FOOTER_LINKS = getFooterLinks(isAuthenticated);

  return (
    <footer className="relative bg-zinc-950 overflow-hidden">
      {/* Ambient gradient */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

      {/* Zen divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
        </div>
        <div className="relative flex justify-center">
          <div className="bg-zinc-950 px-6">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          </div>
        </div>
      </div>

      <NewsletterSection />
      <FooterContent footerLinks={FOOTER_LINKS} />
      <FooterBottomBar />
    </footer>
  );
}
