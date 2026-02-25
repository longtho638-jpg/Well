import { useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from '../hooks';
import {
  Sprout,
  TreeDeciduous,
  Trees,
  Building2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useCartStore } from '../store/cartStore';
import { FeaturedProducts } from '../components/landing/FeaturedProducts';
import { Product } from '../types';
import {
  SocialProofTicker,
  TestimonialsCarousel,
  TrustBadges,
  TRUST_BADGES,
} from '../components/HeroEnhancements';
import { ScrollProgress } from '../components/EastAsiaBrand';
import { ZenDivider, AwardsBar } from '../components/EastAsiaBrand';
import {
  PremiumHeader,
  PremiumFooter,
} from '../components/PremiumNavigation';
import LandingHeroSection from '../components/landing/landing-hero-section';
import LandingRoadmapSection from '../components/landing/landing-roadmap-section';
import { ObjectionFaqTrustSection } from '../components/marketing/objection-faq-trust-section';
import { StickyCtaBar } from '../components/marketing/sticky-cta-bar';
import { SEOHead } from '../components/seo/seo-head';
import { WebSiteSchema, OrganizationSchema } from '../components/seo/structured-data';
import { seoConfig } from '../config/seo-config';

const CartDrawer = lazy(() => import('../components/marketplace/CartDrawer').then(m => ({ default: m.CartDrawer })));
const ExitIntentPopup = lazy(() => import('../components/marketing/ExitIntentPopup').then(m => ({ default: m.ExitIntentPopup })));

// Import roadmap stages data builder
const getRoadmapStages = (t: (key: string) => string) => [
  {
    id: 'seed',
    name: t('landing.roadmap.stages.seed.name'),
    icon: Sprout,
    status: 'active',
    statusLabel: t('landing.roadmap.stages.seed.status'),
    color: 'teal',
    gradient: 'from-teal-500 to-teal-600',
    bgGlow: 'bg-teal-500/20',
    textColor: 'text-teal-400',
    borderColor: 'border-teal-500/50',
    description: t('landing.roadmap.stages.seed.description'),
    mission: t('landing.roadmap.stages.seed.mission'),
    benefits: [
      t('landing.roadmap.stages.seed.benefits.income'),
      t('landing.roadmap.stages.seed.benefits.founder'),
      t('landing.roadmap.stages.seed.benefits.ai'),
      t('landing.roadmap.stages.seed.benefits.support')
    ],
    unlockCondition: null
  },
  {
    id: 'tree',
    name: t('landing.roadmap.stages.tree.name'),
    icon: TreeDeciduous,
    status: 'coming',
    statusLabel: t('landing.roadmap.stages.tree.status'),
    color: 'green',
    gradient: 'from-green-500 to-green-600',
    bgGlow: 'bg-green-500/20',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/50',
    description: t('landing.roadmap.stages.tree.description'),
    mission: t('landing.roadmap.stages.tree.mission'),
    benefits: [
      t('landing.roadmap.stages.tree.benefits.copilot'),
      t('landing.roadmap.stages.tree.benefits.marketing'),
      t('landing.roadmap.stages.tree.benefits.dashboard'),
      t('landing.roadmap.stages.tree.benefits.passive')
    ],
    unlockCondition: '1,000 Partner'
  },
  {
    id: 'forest',
    name: t('landing.roadmap.stages.forest.name'),
    icon: Trees,
    status: 'locked',
    statusLabel: t('landing.roadmap.stages.forest.status'),
    color: 'emerald',
    gradient: 'from-emerald-500 to-emerald-600',
    bgGlow: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/50',
    description: t('landing.roadmap.stages.forest.description'),
    mission: t('landing.roadmap.stages.forest.mission'),
    benefits: [
      t('landing.roadmap.stages.forest.benefits.platform'),
      t('landing.roadmap.stages.forest.benefits.market'),
      t('landing.roadmap.stages.forest.benefits.data'),
      t('landing.roadmap.stages.forest.benefits.equity')
    ],
    unlockCondition: '10,000 Partner'
  },
  {
    id: 'metropolis',
    name: t('landing.roadmap.stages.metropolis.name'),
    icon: Building2,
    status: 'vision',
    statusLabel: t('landing.roadmap.stages.metropolis.status'),
    color: 'sky',
    gradient: 'from-sky-500 to-sky-600',
    bgGlow: 'bg-sky-500/20',
    textColor: 'text-sky-400',
    borderColor: 'border-sky-500/50',
    description: t('landing.roadmap.stages.metropolis.description'),
    mission: t('landing.roadmap.stages.metropolis.mission'),
    benefits: [
      t('landing.roadmap.stages.metropolis.benefits.franchise'),
      t('landing.roadmap.stages.metropolis.benefits.global'),
      t('landing.roadmap.stages.metropolis.benefits.diversified'),
      t('landing.roadmap.stages.metropolis.benefits.legacy')
    ],
    unlockCondition: null,
    hasVisionLink: true
  },
];

const EA_AWARDS_DATA = [
  { title: 'ISO 9001:2015', icon: '🏆' },
  { title: 'FDA Certified', icon: '✅' },
  { title: 'GMP Compliant', icon: '🎖️' },
  { title: 'Top 100 Vietnam', icon: '⭐' },
];

export default function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { products, fetchProducts } = useStore();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const cartItems = useCartStore(state => state.items);
  const cartTotal = useCartStore(state => state.getTotal());
  const cartItemCount = useCartStore(state => state.getItemCount());
  const addToCart = useCartStore(state => state.addToCart);
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const removeFromCart = useCartStore(state => state.removeFromCart);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    setIsCartOpen(true);
  };

  const handleJoin = () => {
    navigate('/venture');
  };

  const handleLearnMore = () => {
    document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleVisionClick = () => {
    window.open('https://wellnexus.vn/venture', '_blank');
  };

  const HERO_STATS = [
    { value: 1243, suffix: '+', label: t('landing.heroStats.partnersActive') },
    { value: 5200000000, prefix: '₫', label: t('landing.heroStats.gmvTotal') },
    { value: 320, suffix: '%', label: t('landing.heroStats.yoyGrowth') },
    { value: 157, label: t('landing.heroStats.slotsRemaining') },
  ];

  const SOCIAL_PROOF_ITEMS = [
    { name: 'Minh Anh', action: t('landing.socialProof.actions.joined'), time: t('landing.socialProof.times.min2'), avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MinhAnh&backgroundColor=b6e3f4' },
    { name: 'Hoàng Nam', action: t('landing.socialProof.actions.silver'), time: t('landing.socialProof.times.min5'), avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HoangNam&backgroundColor=c0aede' },
    { name: 'Thanh Hà', action: t('landing.socialProof.actions.withdraw'), time: t('landing.socialProof.times.min8'), avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThanhHa&backgroundColor=ffd5dc' },
    { name: 'Tuấn Anh', action: t('landing.socialProof.actions.team'), time: t('landing.socialProof.times.min12'), avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TuanAnh&backgroundColor=d1f4d9' },
    { name: 'Ngọc Linh', action: t('landing.socialProof.actions.order'), time: t('landing.socialProof.times.min15'), avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NgocLinh&backgroundColor=ffebd8' },
  ];

  const TESTIMONIALS = [
    {
      name: t('landing.testimonials.items.item1.name'),
      role: t('landing.testimonials.items.item1.role'),
      content: t('landing.testimonials.items.item1.content'),
      rating: 5,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NguyenMinhAnh&backgroundColor=b6e3f4',
    },
    {
      name: t('landing.testimonials.items.item2.name'),
      role: t('landing.testimonials.items.item2.role'),
      content: t('landing.testimonials.items.item2.content'),
      rating: 5,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TranHoangNam&backgroundColor=c0aede',
    },
    {
      name: t('landing.testimonials.items.item3.name'),
      role: t('landing.testimonials.items.item3.role'),
      content: t('landing.testimonials.items.item3.content'),
      rating: 5,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LeThanhHa&backgroundColor=ffd5dc',
    },
  ];

  const CONTENT = {
    hero: {
      badge: t('landing.hero.badge'),
      headline: t('landing.hero.title'),
      headlineAccent: t('landing.hero.headlineAccent'),
      subheadline: t('landing.hero.subtitle'),
      primaryCta: t('landing.hero.cta'),
      secondaryCta: t('landing.hero.learnMore'),
    },
    bento: {
      ai_coach: {
        title: t('landing.bento.ai_coach.title'),
        description: t('landing.bento.ai_coach.description')
      },
      passive_income: {
        title: t('landing.bento.passive_income.title'),
        description: t('landing.bento.passive_income.description'),
        amount: t('landing.bento.passive_income.amount'),
        label: t('landing.bento.passive_income.label')
      },
      community: {
        title: t('landing.bento.community.title'),
        description: t('landing.bento.community.description')
      },
      global: {
        title: t('landing.bento.global.title'),
        description: t('landing.bento.global.description')
      }
    },
    roadmap: {
      sectionBadge: t('landing.roadmap.sectionBadge'),
      sectionTitle: t('landing.roadmap.sectionTitle'),
      subheadline: t('landing.roadmap.subheadline'),
      stages: getRoadmapStages(t)
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 overflow-x-hidden selection:bg-emerald-900 selection:text-emerald-100">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-lg focus:outline-none">
        {t('nav.skipToContent')}
      </a>
      <SEOHead
        title={seoConfig['/'].title}
        description={seoConfig['/'].description}
        keywords={seoConfig['/'].keywords}
        ogImage={seoConfig['/'].ogImage}
        canonical="https://wellnexus.vn/"
      />
      <WebSiteSchema />
      <OrganizationSchema />
      <ScrollProgress />
      <PremiumHeader />

      <main id="main-content" role="main">
      {/* Hero Section - Extracted Component */}
      <LandingHeroSection
        content={CONTENT}
        heroStats={HERO_STATS}
        onJoin={handleJoin}
        onLearnMore={handleLearnMore}
        t={t}
      />

      <TrustBadges badges={TRUST_BADGES} />
      <AwardsBar awards={EA_AWARDS_DATA} />
      <ZenDivider />

      {/* Roadmap Section - Extracted Component */}
      <LandingRoadmapSection
        content={CONTENT.roadmap}
        onVisionClick={handleVisionClick}
      />

      <ZenDivider />
      <TestimonialsCarousel testimonials={TESTIMONIALS} />
      <SocialProofTicker items={SOCIAL_PROOF_ITEMS} />

      <ObjectionFaqTrustSection />

      <FeaturedProducts
        products={products}
        onAddToCart={handleAddToCart}
      />

      <PremiumFooter />
      </main>

      <Suspense fallback={null}>
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          total={cartTotal}
          itemCount={cartItemCount}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
        />
      </Suspense>

      {/* Exit Intent Popup - Phase 9: LCCO */}
      <Suspense fallback={null}>
        <ExitIntentPopup />
      </Suspense>

      {/* Sticky CTA Bar - CRO Phase 05: mobile thumb zone */}
      <StickyCtaBar />
    </div>
  );
}
