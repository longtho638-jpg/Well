/**
 * Email Automation Service
 * ROIaaS Phase 5 - Automated Email Campaigns
 *
 * Features:
 * - Trial expiry reminders (Day 3, 7, 14)
 * - Usage milestone congratulations
 * - Upgrade prompts when hitting limits
 * - Weekly digest for Pro users
 *
 * Uses Resend for email delivery.
 * For SMTP/nodemailer support, see email-service.ts which uses Supabase Edge Functions.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ===== Types =====

export interface EmailRecipient {
  email: string;
  name?: string;
  orgId?: string;
  userId?: string;
}

export interface TrialReminderEmail {
  type: 'trial_reminder';
  daysRemaining: number;
  trialEndsAt: Date;
}

export interface MilestoneEmail {
  type: 'milestone';
  milestoneName: string;
  milestoneValue: number;
  category: 'usage' | 'revenue' | 'engagement';
}

export interface UpgradePromptEmail {
  type: 'upgrade_prompt';
  currentLimit: number;
  usagePercent: number;
  recommendedPlan: string;
}

export interface WeeklyDigestEmail {
  type: 'weekly_digest';
  weekStart: Date;
  weekEnd: Date;
  metrics: {
    totalUsage: number;
    savingsGenerated: number;
    featuresUsed: string[];
    topFeature: string;
  };
}

interface EmailOptions {
  to: EmailRecipient;
  subject: string;
  html: string;
  text?: string;
  tags?: Record<string, string>;
}

export interface EmailServiceConfig {
  provider: 'resend';
  apiKey?: string;
  fromEmail: string;
  fromName: string;
}

export interface EmailResult {
  success: boolean;
  error?: string;
}

// ===== Email Templates =====

const TRIAL_REMINDER_TEMPLATES = {
  vi: {
    14: {
      subject: 'Còn 14 ngày dùng thử WellNexus Pro',
      html: (name: string) => `
        <h1>Xin chào ${name},</h1>
        <p>Bạn còn <strong>14 ngày</strong> để trải nghiệm WellNexus Pro miễn phí.</p>
        <h2>Đã làm được gì trong 14 ngày qua?</h2>
        <ul>
          <li>✓ Truy cập Analytics Dashboard</li>
          <li>✓ Sử dụng AI Copilot</li>
          <li>✓ Tạo báo cáo chuyên sâu</li>
        </ul>
        <p><strong>Đừng bỏ lỡ:</strong> Nâng cấp ngay để tiếp tục sử dụng các tính năng cao cấp!</p>
        <a href="/pricing" style="background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Nâng cấp Pro</a>
      `,
    },
    7: {
      subject: '⏰ 7 ngày nữa là hết hạn dùng thử',
      html: (name: string) => `
        <h1>${name} ơi,</h1>
        <p style="font-size: 18px; color: #f59e0b;">Chỉ còn <strong>7 ngày</strong> dùng thử WellNexus Pro!</p>
        <h2>Ưu đãi đặc biệt:</h2>
        <ul>
          <li>🎁 Giảm 20% khi nâng cấp trong tuần này</li>
          <li>🎁 Tặng thêm 1 tháng khi thanh toán năm</li>
        </ul>
        <a href="/pricing?promo=TRIAL7" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Nhận ưu đãi ngay</a>
      `,
    },
    3: {
      subject: '🚨 Chỉ còn 3 ngày - Đừng bỏ lỡ!',
      html: (name: string) => `
        <h1>${name},</h1>
        <p style="font-size: 20px; color: #ef4444;">⚠️ Tài khoản Pro của bạn sẽ hết hạn sau <strong>3 ngày</strong>!</p>
        <h2>Tất cả những gì bạn sẽ mất:</h2>
        <ul>
          <li>❌ Analytics Dashboard</li>
          <li>❌ AI Copilot</li>
          <li>❌ Báo cáo chuyên sâu</li>
          <li>❌ Priority Support</li>
        </ul>
        <p><strong>Nâng cấp ngay để không gián đoạn:</strong></p>
        <a href="/pricing?urgent=true" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Giữ tài khoản Pro</a>
      `,
    },
  },
  en: {
    14: {
      subject: '14 days left to try WellNexus Pro',
      html: (name: string) => `
        <h1>Hi ${name},</h1>
        <p>You have <strong>14 days</strong> left to experience WellNexus Pro for free.</p>
        <h2>What you've accomplished:</h2>
        <ul>
          <li>✓ Analytics Dashboard access</li>
          <li>✓ AI Copilot usage</li>
          <li>✓ Advanced reports created</li>
        </ul>
        <p><strong>Don't miss out:</strong> Upgrade now to continue using premium features!</p>
        <a href="/pricing" style="background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Upgrade to Pro</a>
      `,
    },
    7: {
      subject: '⏰ 7 days until trial expires',
      html: (name: string) => `
        <h1>Hey ${name},</h1>
        <p style="font-size: 18px; color: #f59e0b;">Only <strong>7 days</strong> left on your WellNexus Pro trial!</p>
        <h2>Special offer:</h2>
        <ul>
          <li>🎁 20% off when you upgrade this week</li>
          <li>🎁 Get 1 month free with annual billing</li>
        </ul>
        <a href="/pricing?promo=TRIAL7" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Claim offer</a>
      `,
    },
    3: {
      subject: '🚨 Only 3 days left - Don\'t miss out!',
      html: (name: string) => `
        <h1>${name},</h1>
        <p style="font-size: 20px; color: #ef4444;">⚠️ Your Pro account expires in <strong>3 days</strong>!</p>
        <h2>You'll lose access to:</h2>
        <ul>
          <li>❌ Analytics Dashboard</li>
          <li>❌ AI Copilot</li>
          <li>❌ Advanced Reports</li>
          <li>❌ Priority Support</li>
        </ul>
        <p><strong>Upgrade now to avoid interruption:</strong></p>
        <a href="/pricing?urgent=true" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Keep Pro access</a>
      `,
    },
  },
};

const MILESTONE_TEMPLATES = {
  vi: {
    usage: {
      subject: '🎉 Chúc mừng cột mốc {milestone}!',
      html: (name: string, milestone: string, value: number) => `
        <h1>Xin chúc mừng ${name}!</h1>
        <p style="font-size: 24px; color: #14b8a6;">🎊 Bạn đã đạt cột mốc: <strong>${milestone}</strong></p>
        <p style="font-size: 18px;">Con số ấn tượng: <strong>${value.toLocaleString('vi-VN')}</strong></p>
        <p>Thật tuyệt vời! Tiếp tục phát huy nhé!</p>
        <a href="/dashboard" style="background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Xem dashboard</a>
      `,
    },
    revenue: {
      subject: '💰 Chúc mừng doanh thu {milestone}!',
      html: (name: string, milestone: string, value: number) => `
        <h1>Chúc mừng ${name}!</h1>
        <p style="font-size: 24px; color: #f59e0b;">💸 Doanh thu đạt mốc: <strong>${milestone}</strong></p>
        <p style="font-size: 18px;">Tổng: <strong>${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}</strong></p>
        <p>Thật xuất sắc! Bạn đang trên đà thành công!</p>
        <a href="/dashboard/revenue" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Xem chi tiết</a>
      `,
    },
    engagement: {
      subject: '🔥 Bạn thật chăm chỉ!',
      html: (name: string, milestone: string, value: number) => `
        <h1>${name} ơi,</h1>
        <p style="font-size: 24px; color: #8b5cf6;">⭐ Cột mốc tương tác: <strong>${milestone}</strong></p>
        <p style="font-size: 18px;">Số lần: <strong>${value.toLocaleString('vi-VN')}</strong></p>
        <p>Cảm ơn bạn đã đồng hành cùng WellNexus!</p>
        <a href="/profile" style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Xem profile</a>
      `,
    },
  },
  en: {
    usage: {
      subject: '🎉 Congratulations on {milestone}!',
      html: (name: string, milestone: string, value: number) => `
        <h1>Congratulations ${name}!</h1>
        <p style="font-size: 24px; color: #14b8a6;">🎊 You've reached: <strong>${milestone}</strong></p>
        <p style="font-size: 18px;">Amazing number: <strong>${value.toLocaleString()}</strong></p>
        <p>Keep up the great work!</p>
        <a href="/dashboard" style="background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">View dashboard</a>
      `,
    },
    revenue: {
      subject: '💰 Revenue milestone achieved!',
      html: (name: string, milestone: string, value: number) => `
        <h1>Congratulations ${name}!</h1>
        <p style="font-size: 24px; color: #f59e0b;">💸 Revenue milestone: <strong>${milestone}</strong></p>
        <p style="font-size: 18px;">Total: <strong>${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}</strong></p>
        <p>You're on fire!</p>
        <a href="/dashboard/revenue" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">View details</a>
      `,
    },
    engagement: {
      subject: '🔥 You\'re on fire!',
      html: (name: string, milestone: string, value: number) => `
        <h1>Hey ${name},</h1>
        <p style="font-size: 24px; color: #8b5cf6;">⭐ Engagement milestone: <strong>${milestone}</strong></p>
        <p style="font-size: 18px;">Count: <strong>${value.toLocaleString()}</strong></p>
        <p>Thanks for being awesome!</p>
        <a href="/profile" style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">View profile</a>
      `,
    },
  },
};

const UPGRADE_PROMPT_TEMPLATES = {
  vi: {
    subject: '⚠️ Bạn đã dùng {percent}% giới hạn',
    html: (name: string, percent: number, limit: number, plan: string) => `
      <h1>${name},</h1>
      <p style="font-size: 18px; color: #f59e0b;">⚠️ Bạn đã sử dụng <strong>${percent}%</strong> giới hạn tháng này!</p>
      <p>Giới hạn hiện tại: <strong>${limit.toLocaleString()}</strong></p>
      <h2>Đề xuất nâng cấp:</h2>
      <p>Gói <strong>${plan}</strong> phù hợp với nhu cầu của bạn.</p>
      <ul>
        <li>✓ Giới hạn cao hơn</li>
        <li>✓ Tính năng cao cấp</li>
        <li>✓ Priority support</li>
      </ul>
      <a href="/pricing?upgrade=${plan.toLowerCase()}" style="background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Nâng cấp ngay</a>
    `,
  },
  en: {
    subject: '⚠️ You\'ve used {percent}% of your limit',
    html: (name: string, percent: number, limit: number, plan: string) => `
      <h1>${name},</h1>
      <p style="font-size: 18px; color: #f59e0b;">⚠️ You've used <strong>${percent}%</strong> of your monthly limit!</p>
      <p>Current limit: <strong>${limit.toLocaleString()}</strong></p>
      <h2>Recommended upgrade:</h2>
      <p>The <strong>${plan}</strong> plan fits your needs.</p>
      <ul>
        <li>✓ Higher limits</li>
        <li>✓ Premium features</li>
        <li>✓ Priority support</li>
      </ul>
      <a href="/pricing?upgrade=${plan.toLowerCase()}" style="background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Upgrade now</a>
    `,
  },
};

const WEEKLY_DIGEST_TEMPLATES = {
  vi: {
    subject: '📊 Báo cáo tuần của bạn: {weekStart} - {weekEnd}',
    html: (
      name: string,
      weekStart: string,
      weekEnd: string,
      usage: number,
      savings: number,
      features: string[],
      topFeature: string
    ) => `
      <h1>Xin chào ${name},</h1>
      <h2>Báo cáo tuần: ${weekStart} - ${weekEnd}</h2>

      <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 20px 0;">
        <h3>📈 Tổng quan</h3>
        <p>Số lần sử dụng: <strong>${usage.toLocaleString('vi-VN')}</strong></p>
        <p>Tiết kiệm được: <strong>${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(savings)}</strong></p>
      </div>

      <h3>🎯 Tính năng đã dùng</h3>
      <ul>
        ${features.map(f => `<li>${f}</li>`).join('')}
      </ul>

      <p>⭐ Tính năng yêu thích: <strong>${topFeature}</strong></p>

      <a href="/dashboard/analytics" style="background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Xem analytics đầy đủ</a>
    `,
  },
  en: {
    subject: '📊 Your weekly report: {weekStart} - {weekEnd}',
    html: (
      name: string,
      weekStart: string,
      weekEnd: string,
      usage: number,
      savings: number,
      features: string[],
      topFeature: string
    ) => `
      <h1>Hi ${name},</h1>
      <h2>Weekly report: ${weekStart} - ${weekEnd}</h2>

      <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 20px 0;">
        <h3>📈 Overview</h3>
        <p>Usage: <strong>${usage.toLocaleString()}</strong></p>
        <p>Savings: <strong>${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(savings)}</strong></p>
      </div>

      <h3>🎯 Features used</h3>
      <ul>
        ${features.map(f => `<li>${f}</li>`).join('')}
      </ul>

      <p>⭐ Top feature: <strong>${topFeature}</strong></p>

      <a href="/dashboard/analytics" style="background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">View full analytics</a>
    `,
  },
};

// ===== Email Service Class =====

export class EmailAutomationService {
  private config: EmailServiceConfig;
  private supabase: SupabaseClient;

  constructor(config: EmailServiceConfig) {
    this.config = config;
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_ANON_KEY || ''
    );
  }

  /**
   * Send trial expiry reminder
   */
  async sendTrialReminder(
    recipient: EmailRecipient,
    daysRemaining: number,
    locale: 'vi' | 'en' = 'vi'
  ): Promise<EmailResult> {
    try {
      const template = TRIAL_REMINDER_TEMPLATES[locale][daysRemaining as 14 | 7 | 3];
      if (!template) {
        return { success: false, error: `No template for day ${daysRemaining}` };
      }

      const name = recipient.name || 'bạn';
      const html = template.html(name);

      await this.sendEmail({
        to: recipient,
        subject: template.subject,
        html,
        tags: { type: 'trial_reminder', daysRemaining: daysRemaining.toString() },
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send milestone congratulations email
   */
  async sendMilestoneEmail(
    recipient: EmailRecipient,
    milestone: MilestoneEmail,
    locale: 'vi' | 'en' = 'vi'
  ): Promise<EmailResult> {
    try {
      const categoryTemplates = MILESTONE_TEMPLATES[locale][milestone.category];
      if (!categoryTemplates) {
        return { success: false, error: 'Invalid milestone category' };
      }

      const name = recipient.name || 'bạn';
      const html = categoryTemplates.html(name, milestone.milestoneName, milestone.milestoneValue);
      const subject = categoryTemplates.subject
        .replace('{milestone}', milestone.milestoneName);

      await this.sendEmail({
        to: recipient,
        subject,
        html,
        tags: { type: 'milestone', category: milestone.category },
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send upgrade prompt when hitting limits
   */
  async sendUpgradePrompt(
    recipient: EmailRecipient,
    prompt: UpgradePromptEmail,
    locale: 'vi' | 'en' = 'vi'
  ): Promise<EmailResult> {
    try {
      const template = UPGRADE_PROMPT_TEMPLATES[locale];
      const name = recipient.name || 'bạn';
      const html = template.html(name, prompt.usagePercent, prompt.currentLimit, prompt.recommendedPlan);
      const subject = template.subject
        .replace('{percent}', prompt.usagePercent.toString());

      await this.sendEmail({
        to: recipient,
        subject,
        html,
        tags: { type: 'upgrade_prompt', plan: prompt.recommendedPlan },
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send weekly digest to Pro users
   */
  async sendWeeklyDigest(
    recipient: EmailRecipient,
    digest: WeeklyDigestEmail,
    locale: 'vi' | 'en' = 'vi'
  ): Promise<EmailResult> {
    try {
      const template = WEEKLY_DIGEST_TEMPLATES[locale];
      const name = recipient.name || 'bạn';
      const weekStart = digest.weekStart.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US');
      const weekEnd = digest.weekEnd.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US');

      const html = template.html(
        name,
        weekStart,
        weekEnd,
        digest.metrics.totalUsage,
        digest.metrics.savingsGenerated,
        digest.metrics.featuresUsed,
        digest.metrics.topFeature
      );

      const subject = template.subject
        .replace('{weekStart}', weekStart)
        .replace('{weekEnd}', weekEnd);

      await this.sendEmail({
        to: recipient,
        subject,
        html,
        tags: { type: 'weekly_digest' },
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send email using Resend API
   */
  private async sendEmail(options: EmailOptions): Promise<void> {
    const apiKey = this.config.apiKey || process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('Resend API key not configured. Set RESEND_API_KEY environment variable.');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: options.to.email,
        subject: options.subject,
        html: options.html,
        text: options.text,
        tags: options.tags ? Object.entries(options.tags).map(([key, value]) => ({ name: key, value })) : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send email via Resend');
    }
  }

  /**
   * Schedule automated trial reminder emails
   * Call this from a cron job or scheduled function
   */
  async scheduleTrialReminders(): Promise<void> {
    const { data: trials, error } = await this.supabase
      .from('trial_periods')
      .select('user_id, email, name, trial_end_date, locale')
      .eq('status', 'active')
      .gte('trial_end_date', new Date().toISOString());

    if (error) {
      console.error('Failed to fetch trials:', error);
      return;
    }

    const now = new Date();
    for (const trial of trials || []) {
      const daysRemaining = Math.ceil(
        (new Date(trial.trial_end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Send reminders at 14, 7, and 3 days before expiry
      if ([14, 7, 3].includes(daysRemaining)) {
        await this.sendTrialReminder(
          { email: trial.email, name: trial.name, userId: trial.user_id },
          daysRemaining,
          trial.locale || 'vi'
        );
      }
    }
  }

  /**
   * Schedule weekly digests for Pro users
   * Call this from a cron job or scheduled function (e.g., every Monday at 9 AM)
   */
  async scheduleWeeklyDigests(): Promise<void> {
    const { data: proUsers, error } = await this.supabase
      .from('subscriptions')
      .select('user_id, email, name, locale')
      .eq('status', 'active')
      .in('plan_slug', ['pro', 'enterprise']);

    if (error) {
      console.error('Failed to fetch Pro users:', error);
      return;
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const user of proUsers || []) {
      // Fetch user's weekly metrics
      const { data: metrics } = await this.supabase
        .from('usage_events')
        .select('*')
        .eq('user_id', user.user_id)
        .gte('timestamp', weekAgo.toISOString())
        .lte('timestamp', now.toISOString());

      if (!metrics || metrics.length === 0) continue;

      const totalUsage = metrics.length;
      const categorySet = new Set(metrics.map((m: any) => (m.category || 'general') as string));
      const featuresUsed = Array.from(categorySet);
      const topFeature = featuresUsed[0] || 'Analytics';

      await this.sendWeeklyDigest(
        { email: user.email, name: user.name, userId: user.user_id },
        {
          type: 'weekly_digest',
          weekStart: weekAgo,
          weekEnd: now,
          metrics: {
            totalUsage,
            savingsGenerated: totalUsage * 50000, // Estimated savings
            featuresUsed,
            topFeature,
          },
        },
        user.locale || 'vi'
      );
    }
  }
}

// ===== Singleton Instance =====

export const emailAutomation = new EmailAutomationService({
  provider: 'resend',
  apiKey: process.env.RESEND_API_KEY,
  fromEmail: process.env.EMAIL_FROM || 'noreply@wellnexus.vn',
  fromName: process.env.EMAIL_FROM_NAME || 'WellNexus',
});

export default emailAutomation;
