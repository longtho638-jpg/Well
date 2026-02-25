/**
 * Premium Navigation Footer Component - Phase 26
 * MAX LEVEL 2026 East Asian Brand Footer
 *
 * Features:
 * - Ambient gradient background
 * - Zen divider aesthetics
 * - Newsletter subscription section
 * - Multi-column footer links
 * - Premium bottom bar with social links
 */

import { ShoppingBag, Users, Globe } from 'lucide-react';
import { useStore } from '@/store';
import { useTranslation } from '@/hooks';
import NewsletterSection from './NewsletterSection';
import FooterContent from './FooterContent';
import FooterBottomBar from './FooterBottomBar';

// ============================================================================
// PREMIUM FOOTER - MAX LEVEL 2026 East Asian Brand
// ============================================================================

export default function PremiumNavigationFooter() {
  const { isAuthenticated } = useStore();
  const { t } = useTranslation();

  const FOOTER_LINKS = [
    {
      title: t('nav.products'),
      icon: <ShoppingBag className="w-4 h-4" />,
      links: [
        { label: t('nav.marketplace'), href: isAuthenticated ? '/dashboard/marketplace' : '/login?redirect=/dashboard/marketplace' },
        { label: t('nav.healthCoach'), href: isAuthenticated ? '/dashboard/health-coach' : '/login?redirect=/dashboard/health-coach' },
      ]
    },
    {
      title: t('nav.partner'),
      icon: <Users className="w-4 h-4" />,
      links: [
        { label: t('nav.ventureProgram'), href: '/venture' },
        { label: t('team.leaderDashboard'), href: isAuthenticated ? '/dashboard/team' : '/login?redirect=/dashboard/team' },
      ]
    },
    {
      title: t('nav.company'),
      icon: <Globe className="w-4 h-4" />,
      links: [
        { label: t('nav.aboutUs'), href: '/venture' },
        { label: t('nav.careers'), href: '/venture' },
      ]
    }
  ];

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
