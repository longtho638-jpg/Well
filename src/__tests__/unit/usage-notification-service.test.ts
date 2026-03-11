/**
 * Usage Notification Service Unit Tests
 *
 * Tests for multi-channel notification system (email, SMS, webhook)
 * for usage threshold alerts at 80%, 90%, 100%
 *
 * Run: pnpm vitest run src/__tests__/unit/usage-notification-service.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UsageNotificationService } from '../../services/usage-notification-service'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AlertMetricType } from '../../services/usage-notification-types'

// ============================================================
// Mock Supabase Client Factory
// ============================================================

const createMockSupabase = () => {
  const mock: any = {
    from: vi.fn((_table: string) => {
      const queryBuilder: any = {}
      queryBuilder.select = vi.fn(() => queryBuilder)
      queryBuilder.insert = vi.fn().mockReturnValue({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })
      queryBuilder.eq = vi.fn(() => queryBuilder)
      // canSendAlert cần single() return null (không có cooldown)
      queryBuilder.single = vi.fn().mockResolvedValue({ data: null, error: null })
      queryBuilder.order = vi.fn(() => queryBuilder)
      queryBuilder.limit = vi.fn(() => queryBuilder)
      return queryBuilder
    }),
    rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    },
  }
  return mock as unknown as SupabaseClient
}

// ============================================================
// UsageNotificationService Tests
// ============================================================

describe('UsageNotificationService', () => {
  let mockSupabase: SupabaseClient
  let notificationService: UsageNotificationService

  beforeEach(() => {
    mockSupabase = createMockSupabase()
    notificationService = new UsageNotificationService(mockSupabase, 3600000) // 1 hour cooldown
  })

  // ============================================================
  // sendNotification() Tests
  // ============================================================

  describe('sendNotification()', () => {
    it('nên gửi thành công tất cả channels (email, webhook) khi threshold 80%', async () => {
      // Arrange
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        const qb: any = {}
        qb.select = vi.fn(() => qb)
        qb.eq = vi.fn(() => qb)
        qb.single = vi.fn().mockResolvedValue({
          data: table === 'user_notification_preferences'
            ? { email_enabled: true, sms_enabled: false, phone_number: null, email_address: 'user@test.com' }
            : table === 'organizations'
            ? { metadata: { webhook_url: 'https://org.webhook.com' } }
            : null,
          error: null,
        })
        qb.order = vi.fn(() => qb)
        qb.limit = vi.fn(() => qb)
        qb.insert = vi.fn().mockReturnValue({
          select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })),
        })
        return qb
      })

      // Act
      const result = await notificationService.sendNotification({
        userId: 'user-123',
        orgId: 'org-456',
        metricType: 'api_calls',
        thresholdPercentage: 80,
        currentUsage: 800,
        quotaLimit: 1000,
        locale: 'vi',
      })

      // Assert
      expect(result.success).toBe(true)
      expect(result.emailSent).toBe(true)
      expect(result.webhookSent).toBe(true)
      expect(result.smsSent).toBe(false)
    })

    it('nên gửi SMS khi threshold 90%', async () => {
      // Arrange
      mockSupabase.from = vi.fn().mockImplementation(() => {
        const qb: any = {}
        qb.select = vi.fn(() => qb)
        qb.eq = vi.fn(() => qb)
        qb.single = vi.fn().mockResolvedValue({
          data: { email_enabled: true, sms_enabled: true, webhook_enabled: true, phone_number: '+1234567890' },
          error: null,
        })
        qb.order = vi.fn(() => qb)
        qb.limit = vi.fn(() => qb)
        qb.insert = vi.fn().mockReturnValue({
          select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })),
        })
        return qb
      })
      mockSupabase.rpc = vi.fn().mockResolvedValue({ data: true, error: null })
      mockSupabase.functions.invoke = vi.fn().mockResolvedValue({ data: { success: true }, error: null })

      // Act
      const result = await notificationService.sendNotification({
        userId: 'user-123',
        metricType: 'api_calls',
        thresholdPercentage: 90,
        currentUsage: 900,
        quotaLimit: 1000,
        locale: 'en',
      })

      // Assert
      expect(result.success).toBe(true)
      expect(result.smsSent).toBe(true)
    })

    it('nên gửi SMS khi threshold 100%', async () => {
      // Arrange
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        const qb: any = {}
        qb.select = vi.fn(() => qb)
        qb.eq = vi.fn(() => qb)
        if (table === 'user_notification_preferences') {
          qb.single = vi.fn().mockResolvedValue({
            data: { email_enabled: true, sms_enabled: true, phone_number: '+1234567890', email_address: 'user@test.com' },
            error: null,
          })
        } else if (table === 'organizations') {
          qb.single = vi.fn().mockResolvedValue({ data: null, error: null })
        } else {
          qb.single = vi.fn().mockResolvedValue({ data: null, error: null })
        }
        qb.order = vi.fn(() => qb)
        qb.limit = vi.fn(() => qb)
        qb.insert = vi.fn().mockReturnValue({
          select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })),
        })
        return qb
      })
      mockSupabase.rpc = vi.fn().mockResolvedValue({ data: true, error: null })
      mockSupabase.functions.invoke = vi.fn().mockResolvedValue({ data: { success: true }, error: null })

      // Act
      const result = await notificationService.sendNotification({
        userId: 'user-123',
        metricType: 'tokens',
        thresholdPercentage: 100,
        currentUsage: 1000,
        quotaLimit: 1000,
        locale: 'vi',
      })

      // Assert
      expect(result.smsSent).toBe(true)
      expect(result.emailSent).toBe(true)
    })

    it('KHÔNG nên gửi SMS khi threshold 80% (chỉ email và webhook)', async () => {
      // Arrange
      mockSupabase.from = vi.fn().mockImplementation(() => {
        const qb: any = {}
        qb.select = vi.fn(() => qb)
        qb.eq = vi.fn(() => qb)
        qb.single = vi.fn().mockResolvedValue({
          data: { email_enabled: true, sms_enabled: true, webhook_enabled: true },
          error: null,
        })
        qb.order = vi.fn(() => qb)
        qb.limit = vi.fn(() => qb)
        qb.insert = vi.fn().mockReturnValue({
          select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })),
        })
        return qb
      })
      mockSupabase.rpc = vi.fn().mockResolvedValue({ data: true, error: null })
      mockSupabase.functions.invoke = vi.fn().mockResolvedValue({ data: { success: true }, error: null })

      // Act
      const result = await notificationService.sendNotification({
        userId: 'user-123',
        metricType: 'api_calls',
        thresholdPercentage: 80,
        currentUsage: 800,
        quotaLimit: 1000,
      })

      // Assert
      expect(result.smsSent).toBe(false)
    })

    it('nên skip khi cooldown đang active (idempotency)', async () => {
      // Arrange - mock usage_alert_events table với cooldown_until trong tương lai
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        const qb: any = {}
        qb.select = vi.fn(() => qb)
        qb.eq = vi.fn(() => qb)
        if (table === 'usage_alert_events') {
          // canSendAlert query - return cooldown_until in future
          const futureDate = new Date(Date.now() + 3600000).toISOString()
          qb.single = vi.fn().mockResolvedValue({ data: { cooldown_until: futureDate }, error: null })
          qb.order = vi.fn(() => qb)
          qb.limit = vi.fn(() => qb)
        } else {
          qb.single = vi.fn().mockResolvedValue({ data: null, error: null })
        }
        qb.insert = vi.fn().mockReturnValue({
          select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })),
        })
        return qb
      })
      // rpc không được gọi vì cooldown chặn trước

      // Act
      const result = await notificationService.sendNotification({
        userId: 'user-123',
        metricType: 'api_calls',
        thresholdPercentage: 80,
        currentUsage: 800,
        quotaLimit: 1000,
      })

      // Assert
      expect(result.success).toBe(true)
      expect(result.emailSent).toBe(false)
      expect(result.smsSent).toBe(false)
      expect(result.webhookSent).toBe(false)
    })

    it('nên handle email failure và vẫn gửi webhook (fail-open)', async () => {
      // Arrange
      let invokeCount = 0
      mockSupabase.functions.invoke = vi.fn().mockImplementation(async () => {
        invokeCount++
        if (invokeCount === 1) {
          // Email fails - return error object
          return { data: null, error: new Error('Email service unavailable') as any }
        }
        // Webhook succeeds
        return { data: { success: true }, error: null }
      })
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        const qb: any = {}
        qb.select = vi.fn(() => qb)
        qb.eq = vi.fn(() => qb)
        if (table === 'user_notification_preferences') {
          qb.single = vi.fn().mockResolvedValue({
            data: { email_enabled: true, sms_enabled: false, phone_number: null, email_address: 'user@test.com' },
            error: null,
          })
        } else if (table === 'organizations') {
          qb.single = vi.fn().mockResolvedValue({
            data: { metadata: { webhook_url: 'https://org.webhook.com' } },
            error: null,
          })
        } else if (table === 'usage_alert_events') {
          qb.order = vi.fn(() => qb)
          qb.limit = vi.fn(() => qb)
          qb.single = vi.fn().mockResolvedValue({ data: null, error: null })
        }
        qb.order = vi.fn(() => qb)
        qb.limit = vi.fn(() => qb)
        qb.insert = vi.fn().mockReturnValue({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: { id: 'alert-123' }, error: null }),
          })),
        })
        return qb
      })
      mockSupabase.rpc = vi.fn().mockResolvedValue({ data: true, error: null })

      // Act
      const result = await notificationService.sendNotification({
        userId: 'user-123',
        orgId: 'org-456',
        metricType: 'api_calls',
        thresholdPercentage: 80,
        currentUsage: 800,
        quotaLimit: 1000,
      })

      // Assert - fail-open: webhook vẫn gửi được dù email fail
      expect(result.webhookSent).toBe(true)
      expect(result.emailSent).toBe(false)
      // Service design: sendViaEmail returns false on error instead of throwing
      // nên errors array có thể không được populate
      expect(result.success).toBe(true)
    })

    it('nên ghi usage_alert_events table sau khi gửi thành công', async () => {
      // Arrange
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })

      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        const qb: any = {}
        qb.select = vi.fn(() => qb)
        qb.eq = vi.fn(() => qb)
        if (table === 'user_notification_preferences') {
          qb.single = vi.fn().mockResolvedValue({
            data: { email_enabled: true, sms_enabled: false, phone_number: null, email_address: 'user@test.com' },
            error: null,
          })
        } else if (table === 'organizations') {
          qb.single = vi.fn().mockResolvedValue({ data: null, error: null })
        } else if (table === 'usage_alert_events') {
          // canSendAlert query
          qb.order = vi.fn(() => qb)
          qb.limit = vi.fn(() => qb)
          qb.single = vi.fn().mockResolvedValue({ data: null, error: null })
        }
        qb.order = vi.fn(() => qb)
        qb.limit = vi.fn(() => qb)
        if (table === 'usage_alert_events') {
          qb.insert = mockInsert
        } else {
          qb.insert = vi.fn().mockReturnValue({
            select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })),
          })
        }
        return qb
      })
      mockSupabase.rpc = vi.fn().mockResolvedValue({ data: true, error: null })
      mockSupabase.functions.invoke = vi.fn().mockResolvedValue({ data: { success: true }, error: null })

      // Act
      await notificationService.sendNotification({
        userId: 'user-123',
        metricType: 'api_calls',
        thresholdPercentage: 80,
        currentUsage: 800,
        quotaLimit: 1000,
      })

      // Assert
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        metric_type: 'api_calls',
        threshold_percentage: 80,
        current_usage: 800,
        quota_limit: 1000,
        channels_sent: expect.any(Array),
        cooldown_until: expect.any(String),
      })
    })
  })

  // ============================================================
  // canSendAlert() Tests
  // ============================================================

  describe('canSendAlert()', () => {
    it('nên trả về true khi cooldown đã hết', async () => {
      // Arrange
      mockSupabase.from = vi.fn().mockImplementation(() => {
        const qb: any = {}
        qb.select = vi.fn(() => qb)
        qb.eq = vi.fn(() => qb)
        qb.order = vi.fn(() => qb)
        qb.limit = vi.fn(() => qb)
        qb.single = vi.fn().mockResolvedValue({ data: null, error: null })
        return qb
      })

      // Act
      const canSend = await notificationService.canSendAlert('user-123', 'api_calls', 80)

      // Assert
      expect(canSend).toBe(true)
    })

    it('nên trả về false khi đang trong cooldown period', async () => {
      // Arrange
      const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString()
      mockSupabase.from = vi.fn().mockImplementation(() => {
        const qb: any = {}
        qb.select = vi.fn(() => qb)
        qb.eq = vi.fn(() => qb)
        qb.order = vi.fn(() => qb)
        qb.limit = vi.fn(() => qb)
        qb.single = vi.fn().mockResolvedValue({ data: { cooldown_until: futureDate }, error: null })
        return qb
      })

      // Act
      const canSend = await notificationService.canSendAlert('user-123', 'api_calls', 80)

      // Assert
      expect(canSend).toBe(false)
    })

    it('nên fail-open (return true) khi database error', async () => {
      // Arrange
      mockSupabase.from = vi.fn().mockImplementation(() => {
        const qb: any = {}
        qb.select = vi.fn(() => qb)
        qb.eq = vi.fn(() => qb)
        qb.order = vi.fn(() => qb)
        qb.limit = vi.fn(() => qb)
        qb.single = vi.fn().mockRejectedValue(new Error('Database unavailable'))
        return qb
      })

      // Act
      const canSend = await notificationService.canSendAlert('user-123', 'api_calls', 80)

      // Assert
      expect(canSend).toBe(true)
    })
  })

  // ============================================================
  // getNotificationChannels() Tests
  // ============================================================

  describe('getNotificationChannels()', () => {
    it('nên lấy đúng user notification preferences', async () => {
      // Arrange
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        const qb: any = {}
        qb.select = vi.fn(() => qb)
        qb.eq = vi.fn(() => qb)
        if (table === 'user_notification_preferences') {
          qb.single = vi.fn().mockResolvedValue({
            data: { email_enabled: true, sms_enabled: false, phone_number: '+1234567890', email_address: 'user@test.com' },
            error: null,
          })
        } else {
          qb.single = vi.fn().mockResolvedValue({ data: null, error: null })
        }
        return qb
      })

      // Act
      const channels = await notificationService.getNotificationChannels('user-123')

      // Assert
      expect(channels.email.enabled).toBe(true)
      expect(channels.email.address).toBe('user@test.com')
      expect(channels.sms.enabled).toBe(false)
      expect(channels.webhook.enabled).toBe(false)
    })

    it('nên trả về default values khi preferences không tồn tại', async () => {
      // Arrange
      mockSupabase.from = vi.fn().mockImplementation(() => {
        const qb: any = {}
        qb.select = vi.fn(() => qb)
        qb.eq = vi.fn(() => qb)
        qb.single = vi.fn().mockResolvedValue({ data: null, error: null })
        return qb
      })

      // Act
      const channels = await notificationService.getNotificationChannels('user-123')

      // Assert
      expect(channels.email.enabled).toBe(true)
      expect(channels.sms.enabled).toBe(false)
      expect(channels.webhook.enabled).toBe(false)
    })

    it('nên trả về default values khi có lỗi', async () => {
      // Arrange
      mockSupabase.from = vi.fn().mockImplementation(() => {
        const qb: any = {}
        qb.select = vi.fn(() => qb)
        qb.eq = vi.fn(() => qb)
        qb.single = vi.fn().mockRejectedValue(new Error('Database error'))
        return qb
      })

      // Act
      const channels = await notificationService.getNotificationChannels('user-123')

      // Assert
      expect(channels.email.enabled).toBe(true)
      expect(channels.sms.enabled).toBe(false)
      expect(channels.webhook.enabled).toBe(false)
    })

    it('nên ưu tiên org webhook URL khi không có user webhook', async () => {
      // Arrange
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        const qb: any = {}
        qb.select = vi.fn(() => qb)
        qb.eq = vi.fn(() => qb)
        if (table === 'user_notification_preferences') {
          qb.single = vi.fn().mockResolvedValue({
            data: { email_enabled: true, sms_enabled: false, phone_number: null, email_address: null },
            error: null,
          })
        } else if (table === 'organizations') {
          qb.single = vi.fn().mockResolvedValue({
            data: { metadata: { webhook_url: 'https://org.webhook.com' } },
            error: null,
          })
        } else {
          qb.single = vi.fn().mockResolvedValue({ data: null, error: null })
        }
        return qb
      })

      // Act
      const channels = await notificationService.getNotificationChannels('user-123', 'org-456')

      // Assert
      expect(channels.webhook.enabled).toBe(true)
      expect(channels.webhook.url).toBe('https://org.webhook.com')
    })
  })

  // ============================================================
  // Edge Cases Tests
  // ============================================================

  describe('Edge Cases', () => {
    it('nên handle khi Edge Function throws error', async () => {
      // Arrange
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        const qb: any = {}
        qb.select = vi.fn(() => qb)
        qb.eq = vi.fn(() => qb)
        if (table === 'user_notification_preferences') {
          qb.single = vi.fn().mockResolvedValue({
            data: { email_enabled: true, sms_enabled: false, phone_number: null, email_address: 'user@test.com' },
            error: null,
          })
        } else if (table === 'usage_alert_events') {
          qb.order = vi.fn(() => qb)
          qb.limit = vi.fn(() => qb)
          qb.single = vi.fn().mockResolvedValue({ data: null, error: null })
        } else {
          qb.single = vi.fn().mockResolvedValue({ data: null, error: null })
        }
        qb.order = vi.fn(() => qb)
        qb.limit = vi.fn(() => qb)
        qb.insert = vi.fn().mockReturnValue({
          select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })),
        })
        return qb
      })
      mockSupabase.functions.invoke = vi.fn().mockRejectedValue(new Error('Function not found'))

      // Act
      const result = await notificationService.sendNotification({
        userId: 'user-123',
        metricType: 'api_calls',
        thresholdPercentage: 80,
        currentUsage: 800,
        quotaLimit: 1000,
      })

      // Assert
      expect(result.success).toBe(false)
      expect(result.emailSent).toBe(false)
      expect(result.webhookSent).toBe(false)
    })

    it('nên handle khi user profile không tồn tại', async () => {
      // Arrange - user profile không tồn tại nhưng vẫn có default channels
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        const qb: any = {}
        qb.select = vi.fn(() => qb)
        qb.eq = vi.fn(() => qb)
        if (table === 'user_notification_preferences') {
          // User profile không tồn tại
          qb.single = vi.fn().mockResolvedValue({ data: null, error: null })
        } else if (table === 'organizations') {
          // Org có webhook URL
          qb.single = vi.fn().mockResolvedValue({
            data: { metadata: { webhook_url: 'https://org.webhook.com' } },
            error: null,
          })
        } else if (table === 'usage_alert_events') {
          // canSendAlert - no cooldown
          qb.order = vi.fn(() => qb)
          qb.limit = vi.fn(() => qb)
          qb.single = vi.fn().mockResolvedValue({ data: null, error: null })
        }
        qb.order = vi.fn(() => qb)
        qb.limit = vi.fn(() => qb)
        qb.insert = vi.fn().mockReturnValue({
          select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })),
        })
        return qb
      })
      mockSupabase.rpc = vi.fn().mockResolvedValue({ data: true, error: null })
      mockSupabase.functions.invoke = vi.fn().mockResolvedValue({ data: { success: true }, error: null })

      // Act
      const result = await notificationService.sendNotification({
        userId: 'non-existent-user',
        orgId: 'org-456',
        metricType: 'api_calls',
        thresholdPercentage: 80,
        currentUsage: 800,
        quotaLimit: 1000,
      })

      // Assert - service nên fail-open và gửi được webhook
      expect(result.success).toBe(true)
      expect(result.webhookSent).toBe(true)
    })

    it('nên record alert event ngay cả khi audit log fails', async () => {
      // Arrange
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        const qb: any = {}
        qb.select = vi.fn(() => qb)
        qb.eq = vi.fn(() => qb)
        if (table === 'usage_alert_events') {
          qb.insert = vi.fn().mockRejectedValue(new Error('Audit table locked'))
          qb.order = vi.fn(() => qb)
          qb.limit = vi.fn(() => qb)
          qb.single = vi.fn().mockResolvedValue({ data: null, error: null })
        } else if (table === 'user_notification_preferences') {
          qb.single = vi.fn().mockResolvedValue({
            data: { email_enabled: true, sms_enabled: false, phone_number: null, email_address: 'user@test.com' },
            error: null,
          })
        } else {
          qb.single = vi.fn().mockResolvedValue({ data: null, error: null })
        }
        qb.order = vi.fn(() => qb)
        qb.limit = vi.fn(() => qb)
        return qb
      })
      mockSupabase.functions.invoke = vi.fn().mockResolvedValue({ data: { success: true }, error: null })

      // Act
      const result = await notificationService.sendNotification({
        userId: 'user-123',
        metricType: 'api_calls',
        thresholdPercentage: 80,
        currentUsage: 800,
        quotaLimit: 1000,
      })

      // Assert
      expect(result.emailSent).toBe(true)
      expect(result.success).toBe(true)
    })

    it('nên support tất cả metric types', async () => {
      // Arrange
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        const qb: any = {}
        qb.select = vi.fn(() => qb)
        qb.eq = vi.fn(() => qb)
        if (table === 'user_notification_preferences') {
          qb.single = vi.fn().mockResolvedValue({ data: { email_enabled: true, sms_enabled: false, phone_number: null, email_address: 'user@test.com' }, error: null })
        } else if (table === 'usage_alert_events') {
          qb.order = vi.fn(() => qb)
          qb.limit = vi.fn(() => qb)
          qb.single = vi.fn().mockResolvedValue({ data: null, error: null })
        } else {
          qb.single = vi.fn().mockResolvedValue({ data: null, error: null })
        }
        qb.order = vi.fn(() => qb)
        qb.limit = vi.fn(() => qb)
        qb.insert = vi.fn().mockReturnValue({
          select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })),
        })
        return qb
      })

      const metricTypes: AlertMetricType[] = ['api_calls', 'tokens', 'compute_minutes', 'model_inferences', 'agent_executions']

      // Act & Assert
      for (const metricType of metricTypes) {
        const result = await notificationService.sendNotification({
          userId: 'user-123',
          metricType,
          thresholdPercentage: 80,
          currentUsage: 800,
          quotaLimit: 1000,
        })
        expect(result.emailSent).toBe(true)
      }
    })

    it('nên handle multiple sequential notifications', async () => {
      // Arrange
      let cooldownActive = false
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        const qb: any = {}
        qb.select = vi.fn(() => qb)
        qb.eq = vi.fn(() => qb)
        if (table === 'usage_alert_events') {
          qb.order = vi.fn(() => qb)
          qb.limit = vi.fn(() => qb)
          qb.single = vi.fn().mockResolvedValue({
            data: cooldownActive ? { cooldown_until: new Date(Date.now() + 3600000).toISOString() } : null,
            error: null,
          })
          qb.insert = vi.fn().mockReturnValue({
            select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })),
          })
        } else if (table === 'user_notification_preferences') {
          qb.single = vi.fn().mockResolvedValue({ data: { email_enabled: true, sms_enabled: false, phone_number: null, email_address: 'user@test.com' }, error: null })
        } else {
          qb.single = vi.fn().mockResolvedValue({ data: null, error: null })
        }
        return qb
      })

      // Act - First notification
      const result1 = await notificationService.sendNotification({
        userId: 'user-123',
        metricType: 'api_calls',
        thresholdPercentage: 80,
        currentUsage: 800,
        quotaLimit: 1000,
      })

      // Activate cooldown
      cooldownActive = true

      // Act - Second notification (should be blocked by cooldown)
      const result2 = await notificationService.sendNotification({
        userId: 'user-123',
        metricType: 'api_calls',
        thresholdPercentage: 80,
        currentUsage: 850,
        quotaLimit: 1000,
      })

      // Assert
      expect(result1.emailSent).toBe(true)
      expect(result2.emailSent).toBe(false)
    })
  })

  // ============================================================
  // Locale Support Tests
  // ============================================================

  describe('Locale Support', () => {
    it('nên gửi notification với locale tiếng Việt', async () => {
      // Arrange
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        const qb: any = {}
        qb.select = vi.fn(() => qb)
        qb.eq = vi.fn(() => qb)
        if (table === 'user_notification_preferences') {
          qb.single = vi.fn().mockResolvedValue({
            data: { email_enabled: true, sms_enabled: false, phone_number: null, email_address: 'user@test.com' },
            error: null,
          })
        } else if (table === 'organizations') {
          qb.single = vi.fn().mockResolvedValue({ data: null, error: null })
        } else if (table === 'usage_alert_events') {
          qb.order = vi.fn(() => qb)
          qb.limit = vi.fn(() => qb)
          qb.single = vi.fn().mockResolvedValue({ data: null, error: null })
        }
        qb.order = vi.fn(() => qb)
        qb.limit = vi.fn(() => qb)
        qb.insert = vi.fn().mockReturnValue({
          select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })),
        })
        return qb
      })
      mockSupabase.rpc = vi.fn().mockResolvedValue({ data: true, error: null })
      const invokeSpy = vi.spyOn(mockSupabase.functions, 'invoke')

      // Act
      await notificationService.sendNotification({
        userId: 'user-123',
        metricType: 'api_calls',
        thresholdPercentage: 80,
        currentUsage: 800,
        quotaLimit: 1000,
        locale: 'vi',
      })

      // Assert
      expect(invokeSpy).toHaveBeenCalledWith(
        'send-overage-alert',
        expect.objectContaining({
          body: expect.objectContaining({
            locale: 'vi',
          }),
        })
      )
    })

    it('nên gửi notification với locale tiếng Anh', async () => {
      // Arrange
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        const qb: any = {}
        qb.select = vi.fn(() => qb)
        qb.eq = vi.fn(() => qb)
        if (table === 'user_notification_preferences') {
          qb.single = vi.fn().mockResolvedValue({
            data: { email_enabled: true, sms_enabled: false, phone_number: null, email_address: 'user@test.com' },
            error: null,
          })
        } else if (table === 'organizations') {
          qb.single = vi.fn().mockResolvedValue({ data: null, error: null })
        } else if (table === 'usage_alert_events') {
          qb.order = vi.fn(() => qb)
          qb.limit = vi.fn(() => qb)
          qb.single = vi.fn().mockResolvedValue({ data: null, error: null })
        }
        qb.order = vi.fn(() => qb)
        qb.limit = vi.fn(() => qb)
        qb.insert = vi.fn().mockReturnValue({
          select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })),
        })
        return qb
      })
      mockSupabase.rpc = vi.fn().mockResolvedValue({ data: true, error: null })
      const invokeSpy = vi.spyOn(mockSupabase.functions, 'invoke')

      // Act
      await notificationService.sendNotification({
        userId: 'user-123',
        metricType: 'api_calls',
        thresholdPercentage: 80,
        currentUsage: 800,
        quotaLimit: 1000,
        locale: 'en',
      })

      // Assert
      expect(invokeSpy).toHaveBeenCalledWith(
        'send-overage-alert',
        expect.objectContaining({
          body: expect.objectContaining({
            locale: 'en',
          }),
        })
      )
    })
  })
})
