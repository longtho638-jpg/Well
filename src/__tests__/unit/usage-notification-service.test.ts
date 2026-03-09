/**
 * Usage Notification Service Unit Tests
 *
 * Tests for multi-channel notification system (email, SMS, webhook)
 * for usage threshold alerts at 80%, 90%, 100%
 *
 * Run: npm test -- usage-notification-service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UsageNotificationService } from '../../services/usage-notification-service'
import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================
// Mock Supabase Client
// ============================================================

const createMockSupabase = () => {
  const mock = {
    from: vi.fn((table: string) => ({
      select: vi.fn((columns: string) => mock),
      insert: vi.fn((data: unknown) => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
      eq: vi.fn((key: string, value: unknown) => mock),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn((fn: string, params: unknown) => ({
      single: vi.fn().mockResolvedValue({ data: true, error: null }),
    })),
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
      // Arrange - Mock user preferences
      ;(mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { email_enabled: true, sms_enabled: false, webhook_enabled: true },
              error: null,
            }),
          }),
        }),
      })

      ;(mockSupabase.rpc as any).mockResolvedValue({ data: true, error: null })

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
      expect(result.smsSent).toBe(false) // SMS chỉ gửi ở 90% và 100%
    })

    it('nên gửi SMS khi threshold 90%', async () => {
      // Arrange - Mock user với SMS enabled
      ;(mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { email_enabled: true, sms_enabled: true, webhook_enabled: true },
              error: null,
            }),
          }),
        }),
      })

      ;(mockSupabase.rpc as any).mockResolvedValue({ data: true, error: null })
      ;(mockSupabase.functions.invoke as any).mockResolvedValue({ data: { success: true }, error: null })

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
      ;(mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { email_enabled: true, sms_enabled: true, webhook_enabled: true },
              error: null,
            }),
          }),
        }),
      })

      ;(mockSupabase.rpc as any).mockResolvedValue({ data: true, error: null })

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
      ;(mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { email_enabled: true, sms_enabled: true, webhook_enabled: true },
              error: null,
            }),
          }),
        }),
      })

      ;(mockSupabase.rpc as any).mockResolvedValue({ data: true, error: null })

      // Act
      const result = await notificationService.sendNotification({
        userId: 'user-123',
        metricType: 'api_calls',
        thresholdPercentage: 80,
        currentUsage: 800,
        quotaLimit: 1000,
      })

      // Assert - SMS không được gửi ở 80%
      expect(result.smsSent).toBe(false)
    })

    it('nên skip khi cooldown đang active (idempotency)', async () => {
      // Arrange - Mock cooldown active
      ;(mockSupabase.rpc as any).mockResolvedValue({ data: false, error: null })

      // Act
      const result = await notificationService.sendNotification({
        userId: 'user-123',
        metricType: 'api_calls',
        thresholdPercentage: 80,
        currentUsage: 800,
        quotaLimit: 1000,
      })

      // Assert - Không gửi gì cả do cooldown
      expect(result.success).toBe(true)
      expect(result.emailSent).toBe(false)
      expect(result.smsSent).toBe(false)
      expect(result.webhookSent).toBe(false)
    })

    it('nên handle email failure và vẫn gửi webhook (fail-open)', async () => {
      // Arrange - Email fails, webhook succeeds
      let invokeCount = 0
      ;(mockSupabase.functions.invoke as any).mockImplementation(() => {
        invokeCount++
        if (invokeCount === 1) {
          // Email call fails
          return { data: null, error: new Error('Email service unavailable') }
        }
        // Webhook call succeeds
        return { data: { success: true }, error: null }
      })

      ;(mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { email_enabled: true, sms_enabled: false, webhook_enabled: true },
              error: null,
            }),
          }),
        }),
      })

      ;(mockSupabase.rpc as any).mockResolvedValue({ data: true, error: null })

      // Act
      const result = await notificationService.sendNotification({
        userId: 'user-123',
        metricType: 'api_calls',
        thresholdPercentage: 80,
        currentUsage: 800,
        quotaLimit: 1000,
      })

      // Assert - Webhook still sent despite email failure
      expect(result.success).toBe(false) // Overall success is false due to email error
      expect(result.webhookSent).toBe(true)
      expect(result.errors).toBeDefined()
      expect(result.errors?.some(e => e.includes('Email'))).toBe(true)
    })

    it('nên ghi usage_alert_events table sau khi gửi thành công', async () => {
      // Arrange
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      })

      ;(mockSupabase.from as any).mockImplementation((table: string) => {
        if (table === 'usage_alert_events') {
          return { insert: mockInsert }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { email_enabled: true }, error: null }),
            }),
          }),
        }
      })

      ;(mockSupabase.rpc as any).mockResolvedValue({ data: true, error: null })

      // Act
      await notificationService.sendNotification({
        userId: 'user-123',
        metricType: 'api_calls',
        thresholdPercentage: 80,
        currentUsage: 800,
        quotaLimit: 1000,
      })

      // Assert - Audit log được ghi
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
  // checkCooldown() Tests
  // ============================================================

  describe('checkCooldown()', () => {
    it('nên trả về true khi cooldown đã hết', async () => {
      // Arrange
      ;(mockSupabase.rpc as any).mockResolvedValue({ data: true, error: null })

      // Act
      const canSend = await notificationService.checkCooldown('user-123', 'api_calls', 80)

      // Assert
      expect(canSend).toBe(true)
    })

    it('nên trả về false khi đang trong cooldown period', async () => {
      // Arrange
      ;(mockSupabase.rpc as any).mockResolvedValue({ data: false, error: null })

      // Act
      const canSend = await notificationService.checkCooldown('user-123', 'api_calls', 80)

      // Assert
      expect(canSend).toBe(false)
    })

    it('nên fail-open (return true) khi database error', async () => {
      // Arrange
      ;(mockSupabase.rpc as any).mockRejectedValue(new Error('Database unavailable'))

      // Act
      const canSend = await notificationService.checkCooldown('user-123', 'api_calls', 80)

      // Assert - Fail-open behavior
      expect(canSend).toBe(true)
    })
  })

  // ============================================================
  // getNotificationChannels() Tests
  // ============================================================

  describe('getNotificationChannels()', () => {
    it('nên lấy đúng user notification preferences', async () => {
      // Arrange
      ;(mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                email_enabled: true,
                sms_enabled: false,
                webhook_enabled: true,
                webhook_url: 'https://custom.webhook.com',
              },
              error: null,
            }),
          }),
        }),
      })

      // Act
      const channels = await notificationService.getNotificationChannels('user-123', 'org-456')

      // Assert
      expect(channels.emailEnabled).toBe(true)
      expect(channels.smsEnabled).toBe(false)
      expect(channels.webhookEnabled).toBe(true)
      expect(channels.webhookUrl).toBe('https://custom.webhook.com')
    })

    it('nên trả về default values khi preferences không tồn tại', async () => {
      // Arrange - No data returned
      ;(mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      })

      // Act
      const channels = await notificationService.getNotificationChannels('user-123')

      // Assert - Defaults
      expect(channels.emailEnabled).toBe(true)
      expect(channels.smsEnabled).toBe(false)
      expect(channels.webhookEnabled).toBe(true)
    })

    it('nên trả về default values khi có lỗi', async () => {
      // Arrange
      ;(mockSupabase.from as any).mockRejectedValue(new Error('Database error'))

      // Act
      const channels = await notificationService.getNotificationChannels('user-123')

      // Assert - Fail-open with defaults
      expect(channels.emailEnabled).toBe(true)
      expect(channels.smsEnabled).toBe(false)
      expect(channels.webhookEnabled).toBe(true)
    })

    it('nên ưu tiên org webhook URL khi không có user webhook', async () => {
      // Arrange
      let callCount = 0
      ;(mockSupabase.from as any).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // User preferences
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { email_enabled: true, sms_enabled: false, webhook_enabled: true, webhook_url: null },
                  error: null,
                }),
              }),
            }),
          }
        } else if (callCount === 2) {
          // User profile
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                single: vi.fn().mockResolvedValue({ data: { email: 'user@test.com', phone: null }, error: null }),
              }),
            }),
          }
        } else {
          // Org metadata
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { metadata: { webhook_url: 'https://org.webhook.com' } },
                  error: null,
                }),
              }),
            }),
          }
        }
      })

      // Act
      const channels = await notificationService.getNotificationChannels('user-123', 'org-456')

      // Assert
      expect(channels.webhookUrl).toBe('https://org.webhook.com')
    })
  })

  // ============================================================
  // Edge Cases Tests
  // ============================================================

  describe('Edge Cases', () => {
    it('nên handle khi Edge Function throws error', async () => {
      // Arrange
      ;(mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { email_enabled: true },
              error: null,
            }),
          }),
        }),
      })

      ;(mockSupabase.rpc as any).mockResolvedValue({ data: true, error: null })
      ;(mockSupabase.functions.invoke as any).mockRejectedValue(new Error('Function not found'))

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
      // Arrange
      ;(mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('User not found') }),
          }),
        }),
      })

      ;(mockSupabase.rpc as any).mockResolvedValue({ data: true, error: null })

      // Act
      const result = await notificationService.sendNotification({
        userId: 'non-existent-user',
        metricType: 'api_calls',
        thresholdPercentage: 80,
        currentUsage: 800,
        quotaLimit: 1000,
      })

      // Assert - Should still attempt to send with defaults
      expect(result.success).toBe(true)
    })

    it('nên record alert event ngay cả khi audit log fails', async () => {
      // Arrange - Audit log fails
      ;(mockSupabase.from as any).mockReturnValue({
        insert: vi.fn().mockRejectedValue(new Error('Audit table locked')),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { email_enabled: true }, error: null }),
          }),
        }),
      })

      ;(mockSupabase.rpc as any).mockResolvedValue({ data: true, error: null })
      ;(mockSupabase.functions.invoke as any).mockResolvedValue({ data: { success: true }, error: null })

      // Act
      const result = await notificationService.sendNotification({
        userId: 'user-123',
        metricType: 'api_calls',
        thresholdPercentage: 80,
        currentUsage: 800,
        quotaLimit: 1000,
      })

      // Assert - Alert delivery succeeds despite audit failure
      expect(result.emailSent).toBe(true)
      expect(result.success).toBe(true)
    })

    it('nên support tất cả metric types', async () => {
      // Arrange
      ;(mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { email_enabled: true }, error: null }),
          }),
        }),
      })

      ;(mockSupabase.rpc as any).mockResolvedValue({ data: true, error: null })

      const metricTypes = [
        'api_calls',
        'ai_calls',
        'tokens',
        'compute_minutes',
        'storage_gb',
        'emails',
        'model_inferences',
        'agent_executions',
      ] as const

      // Act & Assert - All metric types should work
      for (const metricType of metricTypes) {
        const result = await notificationService.sendNotification({
          userId: 'user-123',
          metricType,
          thresholdPercentage: 80,
          currentUsage: 800,
          quotaLimit: 1000,
        })

        expect(result.success).toBe(true)
      }
    })

    it('nên handle multiple sequential notifications', async () => {
      // Arrange
      let cooldownActive = false
      ;(mockSupabase.rpc as any).mockImplementation(() => ({
        single: vi.fn().mockResolvedValue({ data: !cooldownActive, error: null }),
      }))

      ;(mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { email_enabled: true }, error: null }),
          }),
        }),
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
      expect(result2.emailSent).toBe(false) // Blocked by cooldown
    })
  })

  // ============================================================
  // Locale Support Tests
  // ============================================================

  describe('Locale Support', () => {
    it('nên gửi notification với locale tiếng Việt', async () => {
      // Arrange
      ;(mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { email_enabled: true }, error: null }),
          }),
        }),
      })

      ;(mockSupabase.rpc as any).mockResolvedValue({ data: true, error: null })

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
      ;(mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { email_enabled: true }, error: null }),
          }),
        }),
      })

      ;(mockSupabase.rpc as any).mockResolvedValue({ data: true, error: null })
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
