import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { QRPaymentModal } from '../qr-payment-modal';
import { getPaymentStatus } from '@/services/payment/payos-client';

// Mock dependencies
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick, ...props }: React.ComponentProps<'div'>) => (
      <div className={className} onClick={onClick} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-close">X</span>,
  CheckCircle: () => <span data-testid="icon-check">Check</span>,
  XCircle: () => <span data-testid="icon-error">Error</span>,
  Clock: () => <span data-testid="icon-clock">Clock</span>,
  RefreshCw: () => <span data-testid="icon-refresh">Refresh</span>,
  Smartphone: () => <span data-testid="icon-phone">Phone</span>,
}));

vi.mock('@/hooks', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/services/payment/payos-client', () => ({
  getPaymentStatus: vi.fn(),
}));

describe('QRPaymentModal Component', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockOnFailure = vi.fn();

  const mockPaymentData = {
    bin: '970415',
    accountNumber: '123456789',
    accountName: 'TEST ACCOUNT',
    amount: 50000,
    description: 'Test Order',
    orderCode: 123456,
    currency: 'VND',
    paymentLinkId: 'link_123',
    status: 'PENDING' as const,
    checkoutUrl: 'https://pay.payos.vn/web/123',
    qrCode: 'https://example.com/qr.png',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not render when isOpen is false', () => {
    render(
      <QRPaymentModal
        isOpen={false}
        onClose={mockOnClose}
        paymentData={mockPaymentData}
        onSuccess={mockOnSuccess}
        onFailure={mockOnFailure}
      />
    );

    expect(screen.queryByText('checkout.payment.qr_scan')).not.toBeInTheDocument();
  });

  it('should render correct payment details when open', () => {
    render(
      <QRPaymentModal
        isOpen={true}
        onClose={mockOnClose}
        paymentData={mockPaymentData}
        onSuccess={mockOnSuccess}
        onFailure={mockOnFailure}
      />
    );

    expect(screen.getByText('checkout.payment.qr_scan')).toBeInTheDocument();
    expect(screen.getByText('50.000 VND')).toBeInTheDocument();
    expect(screen.getByText('123456')).toBeInTheDocument();
    expect(screen.getByAltText('QR Code')).toHaveAttribute('src', mockPaymentData.qrCode);
  });

  it('should handle successful payment status check', async () => {
    (getPaymentStatus as Mock).mockResolvedValue({ status: 'PAID' });

    render(
      <QRPaymentModal
        isOpen={true}
        onClose={mockOnClose}
        paymentData={mockPaymentData}
        onSuccess={mockOnSuccess}
        onFailure={mockOnFailure}
      />
    );

    // Fast-forward time to trigger interval
    await act(async () => {
        vi.advanceTimersByTime(3000);
        // Allow promises to resolve
        await Promise.resolve();
        await Promise.resolve();
    });

    expect(getPaymentStatus).toHaveBeenCalledWith(mockPaymentData.orderCode);
    expect(mockOnSuccess).toHaveBeenCalledWith(mockPaymentData.orderCode);
    expect(screen.getByText('checkout.payment.success_title')).toBeInTheDocument();
  });

  it('should handle cancelled payment status check', async () => {
    (getPaymentStatus as Mock).mockResolvedValue({ status: 'CANCELLED' });

    render(
      <QRPaymentModal
        isOpen={true}
        onClose={mockOnClose}
        paymentData={mockPaymentData}
        onSuccess={mockOnSuccess}
        onFailure={mockOnFailure}
      />
    );

     // Fast-forward time to trigger interval
    await act(async () => {
        vi.advanceTimersByTime(3000);
        // Allow promises to resolve
        await Promise.resolve();
        await Promise.resolve();
    });

    expect(getPaymentStatus).toHaveBeenCalledWith(mockPaymentData.orderCode);
    expect(mockOnFailure).toHaveBeenCalledWith('Payment was cancelled');
    expect(screen.getByText('checkout.payment.failed_title')).toBeInTheDocument();
  });

  it('should handle timeout expiration', async () => {
    render(
      <QRPaymentModal
        isOpen={true}
        onClose={mockOnClose}
        paymentData={mockPaymentData}
        onSuccess={mockOnSuccess}
        onFailure={mockOnFailure}
      />
    );

    // Fast-forward past 10 minutes (600 seconds)
    await act(async () => {
        vi.advanceTimersByTime(601000);
        // Allow promises to resolve
        await Promise.resolve();
        await Promise.resolve();
    });

    expect(mockOnFailure).toHaveBeenCalledWith('Payment expired');
    expect(screen.getByText('checkout.payment.failed_title')).toBeInTheDocument();
  });

  it('should confirm before closing when pending', () => {
    window.confirm = vi.fn().mockReturnValue(true);

    render(
      <QRPaymentModal
        isOpen={true}
        onClose={mockOnClose}
        paymentData={mockPaymentData}
        onSuccess={mockOnSuccess}
        onFailure={mockOnFailure}
      />
    );

    const closeButton = screen.getByTestId('icon-close').parentElement;
    fireEvent.click(closeButton!);

    expect(window.confirm).toHaveBeenCalledWith('checkout.payment.confirm_close');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not close if user denies confirmation', () => {
    window.confirm = vi.fn().mockReturnValue(false);

    render(
      <QRPaymentModal
        isOpen={true}
        onClose={mockOnClose}
        paymentData={mockPaymentData}
        onSuccess={mockOnSuccess}
        onFailure={mockOnFailure}
      />
    );

    const closeButton = screen.getByTestId('icon-close').parentElement;
    fireEvent.click(closeButton!);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
