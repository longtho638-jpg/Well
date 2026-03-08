/**
 * ExtensionStatus Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExtensionStatus } from '../license-management/ExtensionStatus';

describe('ExtensionStatus', () => {
  const defaultProps = {
    extension: 'algo-trader' as const,
    permitted: true,
    status: 'approved' as const,
    usage: 500,
    limit: 1000,
    resetAt: null,
  };

  describe('Status States', () => {
    it('should render approved status correctly', () => {
      render(<ExtensionStatus {...defaultProps} status="approved" />);

      expect(screen.getByText('ĐÃ DUYỆT')).toBeInTheDocument();
      expect(screen.getByText('Algo Trader Extension')).toBeInTheDocument();
    });

    it('should render pending status correctly', () => {
      render(<ExtensionStatus {...defaultProps} status="pending" />);

      expect(screen.getByText('CHỜ DUYỆT')).toBeInTheDocument();
      expect(screen.getByText(/đang được xem xét/i)).toBeInTheDocument();
    });

    it('should render denied status correctly', () => {
      render(<ExtensionStatus {...defaultProps} permitted={false} status="denied" />);

      expect(screen.getByText('TỪ CHỐI')).toBeInTheDocument();
      expect(screen.getByText(/không hỗ trợ extension/i)).toBeInTheDocument();
    });

    it('should render none status correctly', () => {
      render(<ExtensionStatus {...defaultProps} status="none" />);

      expect(screen.getByText('CHƯA CẬP NHẬT')).toBeInTheDocument();
    });
  });

  describe('Usage Meter', () => {
    it('should render usage bar correctly', () => {
      render(<ExtensionStatus {...defaultProps} usage={500} limit={1000} />);

      expect(screen.getByText(/Đã dùng:/i)).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText(/Giới hạn:/i)).toBeInTheDocument();
      expect(screen.getByText('1,000 requests')).toBeInTheDocument();
    });

    it('should render progress bar with correct width', () => {
      const { container } = render(
        <ExtensionStatus {...defaultProps} usage={750} limit={1000} />
      );

      const progressBar = container.querySelector('.bg-emerald-500');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar?.getAttribute('style')).toContain('width: 75%');
    });

    it('should show amber warning when near limit (>80%)', () => {
      const { container } = render(
        <ExtensionStatus {...defaultProps} usage={850} limit={1000} />
      );

      expect(container.querySelector('.bg-amber-500')).toBeInTheDocument();
      expect(screen.getByText(/Cảnh báo:/i)).toBeInTheDocument();
    });

    it('should show red alert when over limit', () => {
      const { container } = render(
        <ExtensionStatus {...defaultProps} usage={1200} limit={1000} />
      );

      expect(container.querySelector('.bg-red-500')).toBeInTheDocument();
      expect(screen.getByText(/Vượt giới hạn:/i)).toBeInTheDocument();
    });

    it('should cap progress bar at 100%', () => {
      const { container } = render(
        <ExtensionStatus {...defaultProps} usage={2000} limit={1000} />
      );

      const progressBar = container.querySelector('.bg-red-500');
      expect(progressBar?.getAttribute('style')).toContain('width: 100%');
    });
  });

  describe('Reset Time Display', () => {
    it('should not show reset time when null', () => {
      render(<ExtensionStatus {...defaultProps} resetAt={null} />);

      expect(screen.queryByText(/Làm mới vào:/i)).not.toBeInTheDocument();
    });

    it('should format and display reset time', () => {
      const resetAt = new Date('2026-03-09T12:00:00Z').toISOString();
      render(<ExtensionStatus {...defaultProps} resetAt={resetAt} />);

      expect(screen.getByText(/Làm mới vào:/i)).toBeInTheDocument();
    });
  });

  describe('Extension Types', () => {
    it('should display correct title for algo-trader', () => {
      render(<ExtensionStatus {...defaultProps} extension="algo-trader" />);

      expect(screen.getByText('Algo Trader Extension')).toBeInTheDocument();
    });

    it('should display correct title for agi-auto-pilot', () => {
      render(<ExtensionStatus {...defaultProps} extension="agi-auto-pilot" />);

      expect(screen.getByText('AGI Auto-Pilot Extension')).toBeInTheDocument();
    });
  });

  describe('Denied State with Upgrade Link', () => {
    it('should show upgrade link for denied extensions', () => {
      render(<ExtensionStatus {...defaultProps} permitted={false} status="denied" />);

      const upgradeLink = screen.getByText(/Nâng cấp gói ngay/i);
      expect(upgradeLink).toBeInTheDocument();
      expect(upgradeLink).toHaveAttribute('href', '/billing/upgrade');
    });
  });
});
