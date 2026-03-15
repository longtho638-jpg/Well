/**
 * Email Automation Service Tests
 * ROIaaS Phase 5 - Automated Email Campaigns
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EmailAutomationService, emailAutomation } from '../email-automation';

// Mock fetch for Resend API
global.fetch = vi.fn();

describe('EmailAutomationService', () => {
  let service: EmailAutomationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EmailAutomationService({
      provider: 'resend',
      apiKey: 'test-key',
      fromEmail: 'noreply@wellnexus.vn',
      fromName: 'WellNexus',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Trial Reminder Emails', () => {
    it('sends 14-day trial reminder', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'email-id' }),
      } as Response);

      const result = await service.sendTrialReminder(
        { email: 'user@example.com', name: 'John' },
        14,
        'vi'
      );

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key',
          }),
        })
      );
    });

    it('sends 7-day trial reminder with promo', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'email-id' }),
      } as Response);

      const result = await service.sendTrialReminder(
        { email: 'user@example.com', name: 'Jane' },
        7,
        'vi'
      );

      expect(result.success).toBe(true);
    });

    it('sends 3-day urgent trial reminder', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'email-id' }),
      } as Response);

      const result = await service.sendTrialReminder(
        { email: 'user@example.com', name: 'Bob' },
        3,
        'vi'
      );

      expect(result.success).toBe(true);
    });

    it('handles missing template for invalid day', async () => {
      const result = await service.sendTrialReminder(
        { email: 'user@example.com' },
        10, // No template for day 10
        'vi'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('No template');
    });

    it('supports English locale', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'email-id' }),
      } as Response);

      const result = await service.sendTrialReminder(
        { email: 'user@example.com', name: 'Alice' },
        7,
        'en'
      );

      expect(result.success).toBe(true);
    });

    it('uses default name when not provided', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'email-id' }),
      } as Response);

      const result = await service.sendTrialReminder(
        { email: 'user@example.com' },
        14,
        'vi'
      );

      expect(result.success).toBe(true);
      // Check that "bạn" is used instead of name
      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);
      expect(body.html).toContain('bạn');
    });
  });

  describe('Milestone Emails', () => {
    it('sends usage milestone congratulations', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'email-id' }),
      } as Response);

      const result = await service.sendMilestoneEmail(
        { email: 'user@example.com', name: 'John' },
        {
          type: 'milestone',
          milestoneName: '1000 API calls',
          milestoneValue: 1000,
          category: 'usage',
        },
        'vi'
      );

      expect(result.success).toBe(true);
    });

    it('sends revenue milestone congratulations', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'email-id' }),
      } as Response);

      const result = await service.sendMilestoneEmail(
        { email: 'user@example.com', name: 'Jane' },
        {
          type: 'milestone',
          milestoneName: '100 triệu VND',
          milestoneValue: 100000000,
          category: 'revenue',
        },
        'vi'
      );

      expect(result.success).toBe(true);
    });

    it('sends engagement milestone email', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'email-id' }),
      } as Response);

      const result = await service.sendMilestoneEmail(
        { email: 'user@example.com', name: 'Bob' },
        {
          type: 'milestone',
          milestoneName: '7-day streak',
          milestoneValue: 7,
          category: 'engagement',
        },
        'vi'
      );

      expect(result.success).toBe(true);
    });

    it('handles invalid milestone category', async () => {
      const result = await service.sendMilestoneEmail(
        { email: 'user@example.com' },
        {
          type: 'milestone',
          milestoneName: 'Test',
          milestoneValue: 100,
          category: 'invalid' as any,
        },
        'vi'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid milestone category');
    });
  });

  describe('Upgrade Prompt Emails', () => {
    it('sends upgrade prompt when hitting limits', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'email-id' }),
      } as Response);

      const result = await service.sendUpgradePrompt(
        { email: 'user@example.com', name: 'John' },
        {
          type: 'upgrade_prompt',
          currentLimit: 1000,
          usagePercent: 80,
          recommendedPlan: 'Pro',
        },
        'vi'
      );

      expect(result.success).toBe(true);
    });

    it('includes upgrade link with plan parameter', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'email-id' }),
      } as Response);

      await service.sendUpgradePrompt(
        { email: 'user@example.com', name: 'Jane' },
        {
          type: 'upgrade_prompt',
          currentLimit: 5000,
          usagePercent: 90,
          recommendedPlan: 'Enterprise',
        },
        'vi'
      );

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);
      expect(body.html).toContain('/pricing?upgrade=enterprise');
    });
  });

  describe('Weekly Digest Emails', () => {
    it('sends weekly digest to Pro users', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'email-id' }),
      } as Response);

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const weekEnd = new Date();

      const result = await service.sendWeeklyDigest(
        { email: 'user@example.com', name: 'John' },
        {
          type: 'weekly_digest',
          weekStart,
          weekEnd,
          metrics: {
            totalUsage: 150,
            savingsGenerated: 7500000,
            featuresUsed: ['AI Copilot', 'Analytics', 'Reports'],
            topFeature: 'AI Copilot',
          },
        },
        'vi'
      );

      expect(result.success).toBe(true);
    });

    it('includes formatted dates in digest', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'email-id' }),
      } as Response);

      const weekStart = new Date('2026-03-06');
      const weekEnd = new Date('2026-03-13');

      await service.sendWeeklyDigest(
        { email: 'user@example.com', name: 'Jane' },
        {
          type: 'weekly_digest',
          weekStart,
          weekEnd,
          metrics: {
            totalUsage: 100,
            savingsGenerated: 5000000,
            featuresUsed: ['Analytics'],
            topFeature: 'Analytics',
          },
        },
        'vi'
      );

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);
      // Vietnamese date format: d/M/yyyy (no leading zeros)
      expect(body.subject).toContain('6/3/2026');
      expect(body.subject).toContain('13/3/2026');
    });

    it('formats currency in Vietnamese Dong', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'email-id' }),
      } as Response);

      await service.sendWeeklyDigest(
        { email: 'user@example.com', name: 'John' },
        {
          type: 'weekly_digest',
          weekStart: new Date(),
          weekEnd: new Date(),
          metrics: {
            totalUsage: 200,
            savingsGenerated: 10000000, // 10 million VND
            featuresUsed: ['AI Copilot'],
            topFeature: 'AI Copilot',
          },
        },
        'vi'
      );

      const callArgs = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);
      // Vietnamese currency format: 10.000.000 ₫ (with non-breaking space)
      expect(body.html).toContain('10.000.000');
      expect(body.html).toContain('₫');
    });
  });

  describe('Error Handling', () => {
    it('handles Resend API errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid API key' }),
      } as Response);

      const result = await service.sendTrialReminder(
        { email: 'user@example.com' },
        14,
        'vi'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid API key');
    });

    it('handles network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const result = await service.sendTrialReminder(
        { email: 'user@example.com' },
        14,
        'vi'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('handles missing API key', async () => {
      const serviceNoKey = new EmailAutomationService({
        provider: 'resend',
        fromEmail: 'noreply@wellnexus.vn',
        fromName: 'WellNexus',
      });

      const result = await serviceNoKey.sendTrialReminder(
        { email: 'user@example.com' },
        14,
        'vi'
      );

      expect(result.success).toBe(false);
    });
  });

  describe('Singleton Instance', () => {
    it('exports configured singleton', () => {
      expect(emailAutomation).toBeInstanceOf(EmailAutomationService);
    });
  });
});
