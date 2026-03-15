/**
 * ROIDashboard Component Tests
 * ROIaaS Phase 4 - Subscription ROI Analytics
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ROIDashboard } from './ROIDashboard';
import { useFeatureGate } from '@/lib/subscription-gate';

// Mock useFeatureGate hook
vi.mock('@/lib/subscription-gate', () => ({
  useFeatureGate: vi.fn(),
}));

const mockUseFeatureGate = vi.mocked(useFeatureGate);

// Mock framer-motion for tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    ul: ({ children, ...props }: any) => <ul {...props}>{children}</ul>,
    li: ({ children, ...props }: any) => <li {...props}>{children}</li>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
}));

describe('ROIDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Free Tier (No Access)', () => {
    beforeEach(() => {
      mockUseFeatureGate.mockReturnValue({
        hasAccess: false,
        isLoading: false,
        currentTier: 'free',
        requiredTier: 'pro',
        featureName: 'analyticsDashboard',
        upgradeMessage: 'Upgrade to Pro',
      });
    });

    it('shows upgrade CTA for free users', () => {
      render(<ROIDashboard />);
      expect(screen.getByText(/Nâng cấp Pro để mở khóa/i)).toBeInTheDocument();
    });

    it('displays lock icon', () => {
      render(<ROIDashboard />);
      // Check for lock-related content
      expect(screen.getByText(/yêu cầu gói Pro/i)).toBeInTheDocument();
    });

    it('lists Pro features', () => {
      render(<ROIDashboard />);
      expect(screen.getByText(/Analytics Dashboard đầy đủ/i)).toBeInTheDocument();
      expect(screen.getByText(/Feature Usage Heatmap/i)).toBeInTheDocument();
      expect(screen.getByText(/Subscription ROI Calculator/i)).toBeInTheDocument();
    });

    it('has upgrade button', () => {
      render(<ROIDashboard />);
      const upgradeButton = screen.getByRole('button', { name: /Nâng cấp Pro ngay/i });
      expect(upgradeButton).toBeInTheDocument();
    });
  });

  describe('Pro Tier (Has Access)', () => {
    beforeEach(() => {
      mockUseFeatureGate.mockReturnValue({
        hasAccess: true,
        isLoading: false,
        currentTier: 'pro',
        requiredTier: 'pro',
        featureName: 'analyticsDashboard',
        upgradeMessage: '',
      });
    });

    it('renders dashboard title', () => {
      render(<ROIDashboard />);
      expect(screen.getByText('ROI Dashboard')).toBeInTheDocument();
    });

    it('displays Pro plan badge', () => {
      render(<ROIDashboard />);
      expect(screen.getByText('Pro Plan')).toBeInTheDocument();
    });

    it('shows monthly savings section', () => {
      render(<ROIDashboard />);
      expect(screen.getByText(/Tổng tiết kiệm/i)).toBeInTheDocument();
      expect(screen.getByText(/Thời gian tiết kiệm/i)).toBeInTheDocument();
    });

    it('shows feature usage heatmap', () => {
      render(<ROIDashboard />);
      expect(screen.getByText(/Feature Usage Heatmap/i)).toBeInTheDocument();
      expect(screen.getByText('AI Copilot')).toBeInTheDocument();
      expect(screen.getByText('89%')).toBeInTheDocument();
    });

    it('shows ROI calculator section', () => {
      render(<ROIDashboard />);
      expect(screen.getByText(/Subscription ROI Calculator/i)).toBeInTheDocument();
      expect(screen.getByText('14.986%')).toBeInTheDocument();
    });
  });

  describe('Enterprise Tier', () => {
    it('shows Enterprise plan badge', () => {
      mockUseFeatureGate.mockReturnValue({
        hasAccess: true,
        isLoading: false,
        currentTier: 'enterprise',
        requiredTier: 'pro',
        featureName: 'analyticsDashboard',
        upgradeMessage: '',
      });

      render(<ROIDashboard />);
      expect(screen.getByText('Enterprise Plan')).toBeInTheDocument();
    });
  });
});
