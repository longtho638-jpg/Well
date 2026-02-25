/**
 * WellNexus Venture Hub (Aura Elite Edition)
 * Modular architecture for ecosystem venture builder positioning.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ParticleBackground } from '@/components/ParticleBackground';
import { CursorGlow } from '@/components/CursorGlow';
import { Building2, Zap, Award } from 'lucide-react';
import { useTranslation } from '@/hooks';

// Modular Components
import { VentureNavigation } from '@/components/Venture/VentureNavigation';
import { VentureHero } from '@/components/Venture/VentureHero';
import { VentureDealSection } from '@/components/Venture/VentureDealSection';
import { VenturePortfolio } from '@/components/Venture/VenturePortfolio';
import { VentureMarketMap } from '@/components/Venture/VentureMarketMap';
import { VentureFooter } from '@/components/Venture/VentureFooter';

const VenturePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const content = {
    hero: {
      badge: t('venture.hero.badge'),
      headline: t('venture.hero.headline'),
      headlineAccent: t('venture.hero.headlineAccent'),
      subheadline: t('venture.hero.subheadline'),
      primaryCta: t('venture.hero.primaryCta'),
      secondaryCta: t('venture.hero.secondaryCta'),
      stats: [
        { value: '$2.5M', label: t('venture.hero.stats.valuation_label') },
        { value: '200', label: t('venture.hero.stats.nodes_label') },
        { value: 'SEA', label: t('venture.hero.stats.market_label') }
      ]
    },
    deal: {
      sectionBadge: t('venture.deal.sectionBadge'),
      sectionTitle: t('venture.deal.sectionTitle'),
      subheadline: t('venture.deal.subheadline'),
      terms: [
        {
          category: t('venture.deal.capitalNode.category'),
          items: [
            t('venture.deal.capitalNode.item1'),
            t('venture.deal.capitalNode.item2'),
            t('venture.deal.capitalNode.item3')
          ],
          icon: Building2,
          gradient: 'from-emerald-500/20 to-teal-500/20'
        },
        {
          category: t('venture.deal.techStack.category'),
          items: [
            t('venture.deal.techStack.item1'),
            t('venture.deal.techStack.item2'),
            t('venture.deal.techStack.item3'),
            t('venture.deal.techStack.item4')
          ],
          icon: Zap,
          gradient: 'from-violet-500/20 to-purple-500/20'
        },
        {
          category: t('venture.deal.ownership.category'),
          items: [
            t('venture.deal.ownership.item1'),
            t('venture.deal.ownership.item2'),
            t('venture.deal.ownership.item3'),
            t('venture.deal.ownership.item4')
          ],
          icon: Award,
          gradient: 'from-amber-500/20 to-yellow-500/20'
        }
      ]
    },
    portfolio: {
      sectionBadge: t('venture.portfolio.sectionBadge'),
      sectionTitle: t('venture.portfolio.sectionTitle'),
      subheadline: t('venture.portfolio.subheadline'),
      companies: [
        {
          founderName: 'Minh An',
          companyName: 'AnHealth Distribution',
          role: t('venture.portfolio.roles.ceo'),
          valuation: '$500K',
          growth: '+320% VEL',
          metric: '₫180M ARR',
          image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&q=80',
          region: t('venture.portfolio.regions.hanoi')
        },
        {
          founderName: 'Bich Tran',
          companyName: 'Wellness Network',
          role: t('venture.portfolio.roles.cmo'),
          valuation: '$350K',
          growth: '+280% VEL',
          metric: '₫125M ARR',
          image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&q=80',
          region: t('venture.portfolio.regions.hcmc')
        },
        {
          founderName: 'Hoang Long',
          companyName: 'HealthTech Ventures',
          role: t('venture.portfolio.roles.cto'),
          valuation: '$420K',
          growth: '+295% VEL',
          metric: '₫155M ARR',
          image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&q=80',
          region: t('venture.portfolio.regions.danang')
        }
      ]
    },
    market: {
      sectionBadge: t('venture.market.sectionBadge'),
      sectionTitle: t('venture.market.sectionTitle'),
      subheadline: t('venture.market.subheadline'),
      regions: [
        { name: t('venture.market.regions.vietnam'), market: '$3.5B', growth: '+28%', status: t('venture.market.status.active') },
        { name: t('venture.market.regions.thailand'), market: '$2.8B', growth: '+22%', status: t('venture.market.status.expanding') },
        { name: t('venture.market.regions.indonesia'), market: '$4.2B', growth: '+32%', status: t('venture.market.status.protocol_init') },
        { name: t('venture.market.regions.philippines'), market: '$1.5B', growth: '+25%', status: t('venture.market.status.pending') }
      ]
    },
    footer: {
      logo: 'WellNexus',
      tagline: t('venture.footer.tagline'),
      newsletter: {
        title: t('venture.footer.newsletter.title'),
        placeholder: t('venture.footer.newsletter.placeholder')
      },
      social: {
        facebook: 'https://facebook.com/wellnexus',
        instagram: 'https://instagram.com/wellnexus',
        linkedin: 'https://linkedin.com/company/wellnexus'
      },
      copyright: t('venture.footer.copyright')
    }
  };

  const handleJoin = () => navigate('/signup');
  const smoothScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-x-hidden relative selection:bg-teal-500/30">
      <ParticleBackground />
      <CursorGlow />

      <VentureNavigation
        logo={content.footer.logo}
        onScroll={smoothScrollTo}
        onJoin={handleJoin}
      />

      <VentureHero
        content={content.hero}
        onJoin={handleJoin}
        onPortfolio={() => smoothScrollTo('portfolio')}
      />

      <VenturePortfolio content={content.portfolio} />

      <VentureDealSection content={content.deal} />

      <VentureMarketMap
        content={content.market}
        onJoin={handleJoin}
      />

      <VentureFooter content={content.footer} />
    </div>
  );
};

export default VenturePage;
