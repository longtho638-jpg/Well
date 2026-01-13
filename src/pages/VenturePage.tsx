/**
 * WellNexus Venture Hub (Aura Elite Edition)
 * Modular architecture for ecosystem venture builder positioning.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ParticleBackground } from '@/components/ParticleBackground';
import { CursorGlow } from '@/components/CursorGlow';
import { Building2, Zap, Award } from 'lucide-react';

// Modular Components
import { VentureNavigation } from '@/components/Venture/VentureNavigation';
import { VentureHero } from '@/components/Venture/VentureHero';
import { VentureDealSection } from '@/components/Venture/VentureDealSection';
import { VenturePortfolio } from '@/components/Venture/VenturePortfolio';
import { VentureMarketMap } from '@/components/Venture/VentureMarketMap';
import { VentureFooter } from '@/components/Venture/VentureFooter';

// ============================================================================
// CONTENT ARCHITECTURE
// ============================================================================
const CONTENT = {
  hero: {
    badge: 'Co-Founder Recruitment Protocol v4.0',
    headline: 'Venture Builder:',
    headlineAccent: 'Next-Gen Health Tech Ecosystem',
    subheadline: 'Architecting the decentralized health supply chain across SEA. We don\'t recruit employees; we build equity-backed Co-Founder nodes.',
    primaryCta: 'Init Recruitment Protocol',
    secondaryCta: 'Audit Portfolio',
    stats: [
      { value: '$2.5M', label: 'Accumulated Valuation' },
      { value: '200', label: 'Nodes Targeted' },
      { value: 'SEA', label: 'Primary Market' }
    ]
  },
  deal: {
    sectionBadge: 'The Protocol Deck',
    sectionTitle: 'Equity & Infrastructure',
    subheadline: 'Hyper-scalable investment structure for high-performance Co-Founders with local autonomy.',
    terms: [
      {
        category: 'Capital Node',
        items: [
          'Inventory sync with zero initial liquidity',
          'Network-backed working capital pools',
          'Performance-indexed credit extensions'
        ],
        icon: Building2,
        gradient: 'from-emerald-500/20 to-teal-500/20'
      },
      {
        category: 'Tech Stack 2.0',
        items: [
          'Agentic OS - Native AI coordination',
          'Real-time valuation & yield telemetry',
          'Dynamic tax compliance abstraction',
          'Distributed ledger integration'
        ],
        icon: Zap,
        gradient: 'from-violet-500/20 to-purple-500/20'
      },
      {
        category: 'Ownership Matrix',
        items: [
          'ESOP - Direct equity ownership tracks',
          'GROW Delta - Incentive-aligned yield',
          'Linear 4-year vesting // 1-year cliff',
          'IPO-indexed valuation milestones'
        ],
        icon: Award,
        gradient: 'from-amber-500/20 to-yellow-500/20'
      }
    ]
  },
  portfolio: {
    sectionBadge: 'Active Founder Nodes',
    sectionTitle: 'Proven Yield Generations',
    subheadline: 'Ecosystem telemetry from active high-performance nodes.',
    companies: [
      {
        founderName: 'Minh An',
        companyName: 'AnHealth Distribution',
        role: 'Co-Founder // CEO',
        valuation: '$500K',
        growth: '+320% VEL',
        metric: '₫180M ARR',
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&q=80',
        region: 'Hanoi'
      },
      {
        founderName: 'Bich Tran',
        companyName: 'Wellness Network',
        role: 'Co-Founder // CMO',
        valuation: '$350K',
        growth: '+280% VEL',
        metric: '₫125M ARR',
        image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&q=80',
        region: 'HCMC'
      },
      {
        founderName: 'Hoang Long',
        companyName: 'HealthTech Ventures',
        role: 'Co-Founder // CTO',
        valuation: '$420K',
        growth: '+295% VEL',
        metric: '₫155M ARR',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&q=80',
        region: 'Da Nang'
      }
    ]
  },
  market: {
    sectionBadge: 'Ecosystem Expansion',
    sectionTitle: 'SEA Regional Dominance',
    subheadline: 'Multi-lateral expansion protocol into $12B addressable market.',
    regions: [
      { name: 'Vietnam', market: '$3.5B', growth: '+28%', status: 'Active' },
      { name: 'Thailand', market: '$2.8B', growth: '+22%', status: 'Expanding' },
      { name: 'Indonesia', market: '$4.2B', growth: '+32%', status: 'Protocol Init' },
      { name: 'Philippines', market: '$1.5B', growth: '+25%', status: 'Pending' }
    ]
  },
  footer: {
    logo: 'WellNexus',
    tagline: 'Venture Builder powering high-fidelity administrative surfaces and decentralized health commerce across Southeast Asia.',
    newsletter: {
      title: 'Transmission Sync',
      placeholder: 'comm_channel@secure.vn'
    },
    social: {
      facebook: 'https://facebook.com/wellnexus',
      instagram: 'https://instagram.com/wellnexus',
      linkedin: 'https://linkedin.com/company/wellnexus'
    },
    copyright: '© 2026 WellNexus Venture Builder // Absolute Zero Debt'
  }
};

const VenturePage: React.FC = () => {
  const navigate = useNavigate();

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
        logo={CONTENT.footer.logo}
        onScroll={smoothScrollTo}
        onJoin={handleJoin}
      />

      <VentureHero
        content={CONTENT.hero}
        onJoin={handleJoin}
        onPortfolio={() => smoothScrollTo('portfolio')}
      />

      <VenturePortfolio content={CONTENT.portfolio} />

      <VentureDealSection content={CONTENT.deal} />

      <VentureMarketMap
        content={CONTENT.market}
        onJoin={handleJoin}
      />

      <VentureFooter content={CONTENT.footer} />
    </div>
  );
};

export default VenturePage;
