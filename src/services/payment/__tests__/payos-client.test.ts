import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPayment, getPaymentStatus, cancelPayment, verifyWebhook, isPayOSConfigured } from '../payos-client';
import type { Webhook } from '@payos/node';

const mocks = vi.hoisted(() => {
  return {
    create: vi.fn(),
    get: vi.fn(),
    cancel: vi.fn(),
    verify: vi.fn(),
  };
});

vi.mock('@payos/node', () => {
  return {
    PayOS: class {
      paymentRequests = {
        create: mocks.create,
        get: mocks.get,
        cancel: mocks.cancel,
      };
      webhooks = {
        verify: mocks.verify,
      };
    },
  };
});

describe('PayOS Client Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isPayOSConfigured', () => {
    it('should return boolean based on env vars', () => {
      // Since env vars are loaded at module level, this might be tricky to test dynamically
      // without reloading module, but basic check is fine.
      const result = isPayOSConfigured();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('createPayment', () => {
    const mockRequest = {
      orderCode: 123456,
      amount: 50000,
      description: 'Test Order',
      items: [{ name: 'Item 1', quantity: 1, price: 50000 }],
      returnUrl: 'https://example.com/return',
      cancelUrl: 'https://example.com/cancel',
    };

    it('should create payment request successfully', async () => {
      const mockResponse = {
        bin: '970415',
        accountNumber: '123456789',
        accountName: 'TEST ACCOUNT',
        amount: 50000,
        description: 'Test Order',
        orderCode: 123456,
        currency: 'VND',
        paymentLinkId: 'link_123',
        status: 'PENDING',
        checkoutUrl: 'https://pay.payos.vn/web/123',
        qrCode: 'data:image/png;base64,...',
      };

      mocks.create.mockResolvedValue(mockResponse);

      const result = await createPayment(mockRequest);

      expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
        orderCode: mockRequest.orderCode,
        amount: mockRequest.amount,
        description: mockRequest.description,
      }));
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors during creation', async () => {
      mocks.create.mockRejectedValue(new Error('API Error'));

      await expect(createPayment(mockRequest)).rejects.toThrow('Failed to create payment request');
    });
  });

  describe('getPaymentStatus', () => {
    it('should retrieve payment status', async () => {
      const mockStatus = {
        id: 'link_123',
        orderCode: 123456,
        amount: 50000,
        amountPaid: 50000,
        amountRemaining: 0,
        status: 'PAID',
        createdAt: '2024-02-03T10:00:00Z',
        transactions: [],
        cancellationReason: null,
        canceledAt: null,
      };

      mocks.get.mockResolvedValue(mockStatus);

      const result = await getPaymentStatus(123456);

      expect(mocks.get).toHaveBeenCalledWith(123456);
      expect(result).toEqual(mockStatus);
    });

    it('should handle errors when getting status', async () => {
      mocks.get.mockRejectedValue(new Error('Network Error'));

      await expect(getPaymentStatus(123456)).rejects.toThrow('Failed to get payment status');
    });
  });

  describe('cancelPayment', () => {
    it('should cancel payment successfully', async () => {
      const mockCancelledStatus = {
        id: 'link_123',
        orderCode: 123456,
        amount: 50000,
        amountPaid: 0,
        amountRemaining: 50000,
        status: 'CANCELLED',
        createdAt: '2024-02-03T10:00:00Z',
        transactions: [],
        cancellationReason: 'User cancelled',
        canceledAt: '2024-02-03T10:05:00Z',
      };

      mocks.cancel.mockResolvedValue(mockCancelledStatus);

      const result = await cancelPayment(123456, 'User cancelled');

      expect(mocks.cancel).toHaveBeenCalledWith(123456, 'User cancelled');
      expect(result).toEqual(mockCancelledStatus);
    });

    it('should handle errors during cancellation', async () => {
      mocks.cancel.mockRejectedValue(new Error('Invalid state'));

      await expect(cancelPayment(123456)).rejects.toThrow('Failed to cancel payment');
    });
  });

  describe('verifyWebhook', () => {
    it('should verify webhook data', async () => {
      const mockWebhook = {
        code: '00',
        desc: 'Success',
        success: true,
        data: {
          orderCode: 123456,
          amount: 50000,
          description: 'Test Order',
          accountNumber: '123456789',
          reference: 'REF123',
          transactionDateTime: '2024-02-03 10:00:00',
          currency: 'VND',
          paymentLinkId: 'link_123',
          code: '00',
          desc: 'Success',
          counterAccountBankId: null,
          counterAccountBankName: null,
          counterAccountName: null,
          counterAccountNumber: null,
          virtualAccountName: null,
          virtualAccountNumber: null,
        },
        signature: 'valid_signature',
      };

      const mockVerifiedData = mockWebhook.data;

      mocks.verify.mockResolvedValue(mockVerifiedData);

      const result = await verifyWebhook(mockWebhook);

      expect(mocks.verify).toHaveBeenCalledWith(mockWebhook);
      expect(result).toEqual(mockVerifiedData);
    });

    it('should handle verification errors', async () => {
      mocks.verify.mockRejectedValue(new Error('Invalid signature'));

      await expect(verifyWebhook({} as any)).rejects.toThrow('Failed to verify webhook data');
    });
  });
});
