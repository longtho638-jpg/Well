/**
 * Pricing Page Tests
 * Tests for the pricing landing page component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import PricingPage from '../pricing';

// Mock dependencies
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_target, prop: string) => {
      const MotionComponent = ({ children, className, onClick, ...props }: React.ComponentProps<'div'>) => (
        <div className={className} onClick={onClick} role="none" {...props}>
          {children}
        </div>
      );
      MotionComponent.displayName = `motion.${prop}`;
      return MotionComponent;
    },
  }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('lucide-react', () => ({
  Check: () => <span data-testid="icon-check">✓</span>,
  Crown: () => <span data-testid="icon-crown">Crown</span>,
  Zap: () => <span data-testid="icon-zap">Zap</span>,
  Users: () => <span data-testid="icon-users">Users</span>,
  ChevronDown: () => <span data-testid="icon-chevron-down">▼</span>,
  ChevronUp: () => <span data-testid="icon-chevron-up">▲</span>,
  Shield: () => <span data-testid="icon-shield">Shield</span>,
  Clock: () => <span data-testid="icon-clock">Clock</span>,
  Headphones: () => <span data-testid="icon-headphones">Headphones</span>,
  RefreshCcw: () => <span data-testid="icon-refresh">Refresh</span>,
  Star: () => <span data-testid="icon-star">★</span>,
  Award: () => <span data-testid="icon-award">Award</span>,
  TrendingUp: () => <span data-testid="icon-trending">Trending</span>,
  Sparkles: () => <span data-testid="icon-sparkles">Sparkles</span>,
  Loader2: () => <span data-testid="icon-loader">Loading</span>,
  AlertCircle: () => <span data-testid="icon-alert">Alert</span>,
  X: () => <span data-testid="icon-x">X</span>,
  ArrowRight: () => <span data-testid="icon-arrow">→</span>,
}));

vi.mock('@/hooks', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    lang: 'en',
    setLang: vi.fn(),
  }),
}));

vi.mock('@/services/payment/payos-client', () => ({
  createPayment: vi.fn().mockResolvedValue({
    bin: '123456',
    accountNumber: '1234567890',
    accountName: 'Test Account',
    amount: 299000,
    description: 'Pro',
    orderCode: 1234567890,
    currency: 'VND',
    paymentLinkId: 'test-link',
    status: 'pending',
    checkoutUrl: 'https://checkout.test.com',
    qrCode: 'data:image/png;base64,test',
  }),
}));

vi.mock('@/components/seo/seo-head', () => ({
  SEOHead: () => <div data-testid="seo-head">SEO Head Component</div>,
}));

vi.mock('@/components/checkout/qr-payment-modal', () => ({
  QRPaymentModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="qr-payment-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null,
}));

describe('PricingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPricingPage = () => {
    render(
      <BrowserRouter>
        <PricingPage />
      </BrowserRouter>
    );
  };

  describe('SEO and Page Structure', () => {
    it('renders SEO head', () => {
      renderPricingPage();
      expect(screen.getByTestId('seo-head')).toBeInTheDocument();
    });

    it('renders main heading', () => {
      renderPricingPage();
      expect(screen.getByText('pricing.choose_plan')).toBeInTheDocument();
    });

    it('renders subtitle', () => {
      renderPricingPage();
      expect(screen.getByText('pricing.subtitle')).toBeInTheDocument();
    });
  });

  describe('Billing Cycle Toggle', () => {
    it('shows billing toggle options', () => {
      renderPricingPage();
      expect(screen.getByText('pricing.monthly')).toBeInTheDocument();
      expect(screen.getByText('pricing.yearly')).toBeInTheDocument();
    });

    it('renders save badge', () => {
      renderPricingPage();
      expect(screen.getAllByText('pricing.save_2_months').length).toBeGreaterThan(0);
    });
  });

  describe('Pricing Tiers', () => {
    it('renders all three pricing tiers', () => {
      renderPricingPage();
      expect(screen.getAllByText('pricing.free_name').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('pricing.pro_name').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('pricing.enterprise_name').length).toBeGreaterThanOrEqual(1);
    });

    it('shows Pro tier as most popular', () => {
      renderPricingPage();
      expect(screen.getByText('pricing.most_popular')).toBeInTheDocument();
    });

    it('displays tier descriptions', () => {
      renderPricingPage();
      expect(screen.getByText('pricing.free_description')).toBeInTheDocument();
      expect(screen.getByText('pricing.pro_description')).toBeInTheDocument();
      expect(screen.getByText('pricing.enterprise_description')).toBeInTheDocument();
    });
  });

  describe('CTA Buttons', () => {
    it('shows "Included" for free tier', () => {
      renderPricingPage();
      expect(screen.getByText('pricing.included')).toBeInTheDocument();
    });

    it('shows "Upgrade" for paid tiers', () => {
      renderPricingPage();
      const upgradeButtons = screen.getAllByText('pricing.upgrade');
      expect(upgradeButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Feature Comparison Table', () => {
    it('renders feature comparison section', () => {
      renderPricingPage();
      expect(screen.getByText('pricing.feature_comparison')).toBeInTheDocument();
    });
  });

  describe('Trust Badges', () => {
    it('renders trust badges section', () => {
      renderPricingPage();
      expect(screen.getByText('pricing.trust.secure_payment')).toBeInTheDocument();
      expect(screen.getByText('pricing.trust.money_back')).toBeInTheDocument();
    });
  });

  describe('FAQ Section', () => {
    it('renders FAQ heading', () => {
      renderPricingPage();
      expect(screen.getByText('pricing.faq_title')).toBeInTheDocument();
    });

    it('renders FAQ items', () => {
      renderPricingPage();
      expect(screen.getByText('pricing.faq.q1_question')).toBeInTheDocument();
    });
  });

  describe('Bottom CTA Section', () => {
    it('renders bottom CTA', () => {
      renderPricingPage();
      expect(screen.getByText('pricing.cta_bottom.title')).toBeInTheDocument();
      expect(screen.getByText('pricing.cta_bottom.get_started')).toBeInTheDocument();
    });
  });

  describe('Payment Flow', () => {
    it('calls createPayment when clicking upgrade on Pro', async () => {
      const { createPayment } = await import('@/services/payment/payos-client');

      renderPricingPage();

      const upgradeButtons = screen.getAllByText('pricing.upgrade');
      fireEvent.click(upgradeButtons[0]);

      await waitFor(() => {
        expect(createPayment).toHaveBeenCalled();
      });
    });

    it('opens payment modal after successful payment creation', async () => {
      renderPricingPage();

      const upgradeButtons = screen.getAllByText('pricing.upgrade');
      fireEvent.click(upgradeButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('qr-payment-modal')).toBeInTheDocument();
      });
    });
  });
});
