import { useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from '../hooks';
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
import {
  getRoadmapStages,
  EA_AWARDS_DATA,
  getSocialProofItems,
  getTestimonials,
  getHeroStats,
} from './landing-page/landing-page-data';

const CartDrawer = lazy(() => import('../components/marketplace/CartDrawer').then(m => ({ default: m.CartDrawer })));
const ExitIntentPopup = lazy(() => import('../components/marketing/ExitIntentPopup').then(m => ({ default: m.ExitIntentPopup })));

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

  const handleJoin = () => navigate('/venture');
  const handleLearnMore = () => {
    document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth' });
  };
  const handleVisionClick = () => {
    window.open('https://wellnexus.vn/venture', '_blank');
  };

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
      ai_coach: { title: t('landing.bento.ai_coach.title'), description: t('landing.bento.ai_coach.description') },
      passive_income: {
        title: t('landing.bento.passive_income.title'),
        description: t('landing.bento.passive_income.description'),
        amount: t('landing.bento.passive_income.amount'),
        label: t('landing.bento.passive_income.label'),
      },
      community: { title: t('landing.bento.community.title'), description: t('landing.bento.community.description') },
      global: { title: t('landing.bento.global.title'), description: t('landing.bento.global.description') },
    },
    roadmap: {
      sectionBadge: t('landing.roadmap.sectionBadge'),
      sectionTitle: t('landing.roadmap.sectionTitle'),
      subheadline: t('landing.roadmap.subheadline'),
      stages: getRoadmapStages(t),
    },
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
        <LandingHeroSection
          content={CONTENT}
          heroStats={getHeroStats(t)}
          onJoin={handleJoin}
          onLearnMore={handleLearnMore}
          t={t}
        />
        <TrustBadges badges={TRUST_BADGES} />
        <AwardsBar awards={EA_AWARDS_DATA} />
        <ZenDivider />
        <LandingRoadmapSection content={CONTENT.roadmap} onVisionClick={handleVisionClick} />
        <ZenDivider />
        <TestimonialsCarousel testimonials={getTestimonials(t)} />
        <SocialProofTicker items={getSocialProofItems(t)} />
        <ObjectionFaqTrustSection />
        <FeaturedProducts products={products} onAddToCart={handleAddToCart} />
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

      <Suspense fallback={null}>
        <ExitIntentPopup />
      </Suspense>

      <StickyCtaBar />
    </div>
  );
}
