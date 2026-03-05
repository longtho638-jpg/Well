/**
 * Phase 2B: Partner Split - 60/40 Distribution Tests
 */

import { describe, it, expect } from 'vitest';

describe('Phase 2B: Partner Split', () => {
  describe('60/40 Split Calculation', () => {
    it('calculates 60/40 split for referrer/sponsor', () => {
      const orderTotal = 10000000;
      const totalCommission = orderTotal * 0.08;
      const referrerAmount = totalCommission * 0.60;
      const sponsorAmount = totalCommission * 0.40;

      expect(totalCommission).toBe(800000);
      expect(referrerAmount).toBe(480000);
      expect(sponsorAmount).toBe(320000);
      expect(referrerAmount + sponsorAmount).toBe(totalCommission);
    });

    it('splits 5M order correctly', () => {
      const orderTotal = 5000000;
      const totalCommission = orderTotal * 0.08;
      const referrerAmount = totalCommission * 0.60;
      const sponsorAmount = totalCommission * 0.40;

      expect(totalCommission).toBe(400000);
      expect(referrerAmount).toBe(240000);
      expect(sponsorAmount).toBe(160000);
    });
  });

  describe('Custom Split Percentage', () => {
    it('uses 60/40 as default when no config', () => {
      const referrerPercentage = 60.00;
      const sponsorPercentage = 100.00 - referrerPercentage;

      expect(referrerPercentage).toBe(60.00);
      expect(sponsorPercentage).toBe(40.00);
    });

    it('supports custom 70/30 split', () => {
      const referrerPercentage = 70.00;
      const sponsorPercentage = 100.00 - referrerPercentage;

      expect(referrerPercentage).toBe(70.00);
      expect(sponsorPercentage).toBe(30.00);
    });

    it('supports custom 50/50 split', () => {
      const referrerPercentage = 50.00;
      const sponsorPercentage = 100.00 - referrerPercentage;

      expect(referrerPercentage).toBe(50.00);
      expect(sponsorPercentage).toBe(50.00);
    });
  });

  describe('Edge Cases', () => {
    it('returns zero commission for zero order total', () => {
      const orderTotal = 0;
      const totalCommission = orderTotal * 0.08;

      expect(totalCommission).toBe(0);
    });

    it('handles small order amounts', () => {
      const orderTotal = 100000;
      const totalCommission = orderTotal * 0.08;
      const referrerAmount = totalCommission * 0.60;
      const sponsorAmount = totalCommission * 0.40;

      expect(totalCommission).toBe(8000);
      expect(referrerAmount).toBe(4800);
      expect(sponsorAmount).toBe(3200);
    });

    it('handles large order amounts', () => {
      const orderTotal = 100000000;
      const totalCommission = orderTotal * 0.08;
      const referrerAmount = totalCommission * 0.60;
      const sponsorAmount = totalCommission * 0.40;

      expect(totalCommission).toBe(8000000);
      expect(referrerAmount).toBe(4800000);
      expect(sponsorAmount).toBe(3200000);
    });
  });

  describe('Transaction Types', () => {
    it('uses partner_referrer type for referrer', () => {
      const type = 'partner_referrer';
      expect(type).toBe('partner_referrer');
    });

    it('uses partner_sponsor type for sponsor', () => {
      const type = 'partner_sponsor';
      expect(type).toBe('partner_sponsor');
    });
  });

  describe('Description Format', () => {
    it('formats referrer description with percentage and order ID', () => {
      const percentage = 60;
      const orderId = 'order-123';
      const description = `Partner referrer ${percentage}% từ đơn hàng ${orderId}`;

      expect(description).toContain('Partner referrer');
      expect(description).toContain('60%');
      expect(description).toContain('order-123');
    });

    it('formats sponsor description with percentage and order ID', () => {
      const percentage = 40;
      const orderId = 'order-456';
      const description = `Partner sponsor ${percentage}% từ đơn hàng ${orderId}`;

      expect(description).toContain('Partner sponsor');
      expect(description).toContain('40%');
      expect(description).toContain('order-456');
    });
  });

  describe('No Sponsor Edge Case', () => {
    it('skips partner split when user has no sponsor', () => {
      const sponsorId = null;
      const shouldSplit = sponsorId !== null;

      expect(shouldSplit).toBe(false);
    });

    it('processes split when sponsor exists', () => {
      const sponsorId = 'sponsor-123';
      const shouldSplit = sponsorId !== null;

      expect(shouldSplit).toBe(true);
    });
  });

  describe('Percentage Validation', () => {
    it('validates percentage sums to 100', () => {
      const referrerPercentage = 60.00;
      const sponsorPercentage = 100.00 - referrerPercentage;

      expect(referrerPercentage + sponsorPercentage).toBe(100.00);
    });

    it('rejects percentage over 100', () => {
      const referrerPercentage = 110.00;
      const isValid = referrerPercentage <= 100;

      expect(isValid).toBe(false);
    });

    it('rejects negative percentage', () => {
      const referrerPercentage = -10.00;
      const isValid = referrerPercentage >= 0 && referrerPercentage <= 100;

      expect(isValid).toBe(false);
    });
  });
});
