/**
 * Dunning Status Page Component
 *
 * Displays dunning state for delinquent accounts.
 * Shows payment retry countdown, amount owed, and recovery actions.
 *
 * Features:
 * - Current dunning stage display (initial/reminder/final/cancel_notice)
 * - Amount owed with due date
 * - Payment retry countdown timer
 * - Payment method update button
 * - Invoice payment link
 * - Support contact info
 *
 * Usage:
 *   <DunningStatusPage orgId={orgId} />
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@supabase/supabase-js'

export type DunningStage = 'initial' | 'reminder' | 'final' | 'cancel_notice'

export interface DunningStatus {
  isActive: boolean
  stage: DunningStage
  amountOwed: number
  currency: string
  dueDate: string
  attemptCount: number
  nextRetryAt: string
  paymentUrl?: string
  invoiceId?: string
  daysUntilCancel?: number
}

export interface DunningStatusPageProps {
  orgId: string
  onPaymentCompleted?: () => void
}

const STAGE_CONFIG: Record<DunningStage, {
  title: string
  description: string
  color: string
  icon: string
  daysUntilCancel: number
}> = {
  initial: {
    title: 'Thanh toán ban đầu',
    description: 'Hóa đơn chưa được thanh toán. Chúng tôi sẽ thử lại.',
    color: 'text-amber-400',
    icon: '⏳',
    daysUntilCancel: 7,
  },
  reminder: {
    title: 'Nhắc nhở thanh toán',
    description: 'Thanh toán đã thất bại nhiều lần. Vui lòng cập nhật phương thức thanh toán.',
    color: 'text-orange-400',
    icon: '⚠️',
    daysUntilCancel: 4,
  },
  final: {
    title: 'Cảnh báo cuối cùng',
    description: 'Tài khoản sẽ bị hủy nếu không thanh toán.',
    color: 'text-red-400',
    icon: '🔴',
    daysUntilCancel: 2,
  },
  cancel_notice: {
    title: 'Sắp hủy tài khoản',
    description: 'Tài khoản của bạn sẽ bị hủy trong vòng 24 giờ.',
    color: 'text-red-600',
    icon: '🚨',
    daysUntilCancel: 1,
  },
}

export const DunningStatusPage: React.FC<DunningStatusPageProps> = ({
  orgId,
  onPaymentCompleted,
}) => {
  const [dunning, setDunning] = useState<DunningStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number } | null>(null)

  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
  )

  // Fetch dunning status
  useEffect(() => {
    fetchDunningStatus()
  }, [orgId])

  // Update countdown timer
  useEffect(() => {
    if (!dunning?.nextRetryAt) return

    const updateCountdown = () => {
      const nextRetry = new Date(dunning.nextRetryAt)
      const now = new Date()
      const diff = nextRetry.getTime() - now.getTime()

      if (diff <= 0) {
        setCountdown(null)
        // Refresh status when countdown reaches zero
        setTimeout(fetchDunningStatus, 5000)
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setCountdown({ hours, minutes, seconds })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [dunning?.nextRetryAt])

  const fetchDunningStatus = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('dunning_events')
        .select('*')
        .eq('org_id', orgId)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setDunning({
          isActive: true,
          stage: data.dunning_stage as DunningStage,
          amountOwed: data.amount_owed,
          currency: data.currency || 'USD',
          dueDate: data.due_date,
          attemptCount: data.attempt_count,
          nextRetryAt: data.next_retry_at,
          paymentUrl: data.payment_url,
          invoiceId: data.invoice_id,
          daysUntilCancel: data.days_until_cancel,
        })
      } else {
        setDunning(null)
      }
    } catch (error) {
      // Fetch error handled by error boundary
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePaymentMethod = () => {
    // Navigate to billing page or open payment modal
    window.location.href = '/dashboard/billing/payment-methods'
  }

  const handlePayNow = () => {
    if (dunning?.paymentUrl) {
      window.open(dunning.paymentUrl, '_blank')
    }
  }

  const handleContactSupport = () => {
    window.location.href = '/dashboard/support'
  }

  if (loading) {
    return (
      <div className="animate-pulse p-8 rounded-xl bg-zinc-800/50 border border-white/10">
        <div className="h-8 bg-zinc-700 rounded w-1/2 mb-4" />
        <div className="h-32 bg-zinc-700 rounded mb-4" />
        <div className="h-12 bg-zinc-700 rounded" />
      </div>
    )
  }

  // No active dunning - account in good standing
  if (!dunning) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center"
      >
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Tài khoản đang hoạt động tốt
        </h2>
        <p className="text-zinc-400">
          Không có hóa đơn nào chưa thanh toán
        </p>
      </motion.div>
    )
  }

  const stageConfig = STAGE_CONFIG[dunning.stage]

  return (
    <div className="p-8 rounded-xl bg-zinc-800/50 border border-white/10">
      {/* Header with Stage Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="text-5xl mb-4">{stageConfig.icon}</div>
        <h2 className={`text-2xl font-bold ${stageConfig.color} mb-2`}>
          {stageConfig.title}
        </h2>
        <p className="text-zinc-400">
          {stageConfig.description}
        </p>
      </motion.div>

      {/* Amount Owed Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-xl bg-gradient-to-br from-red-600/20 to-orange-600/20 border border-red-500/20 mb-6"
      >
        <div className="text-center">
          <div className="text-sm text-zinc-400 mb-2">Số tiền cần thanh toán</div>
          <div className="text-4xl font-bold text-white mb-2">
            ${(dunning.amountOwed / 100).toFixed(2)}
          </div>
          <div className="text-sm text-zinc-400">
            Hạn thanh toán: {new Date(dunning.dueDate).toLocaleDateString('vi-VN')}
          </div>
        </div>
      </motion.div>

      {/* Retry Countdown */}
      {countdown && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-zinc-700/50 border border-zinc-600 mb-6"
        >
          <div className="text-center">
            <div className="text-sm text-zinc-400 mb-3">
              Lần thử thanh toán tiếp theo sau
            </div>
            <div className="flex justify-center gap-4">
              <TimeBox value={countdown.hours} label="Giờ" />
              <TimeBox value={countdown.minutes} label="Phút" />
              <TimeBox value={countdown.seconds} label="Giây" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-2">
          {Object.entries(STAGE_CONFIG).map(([stage, config], index) => {
            const currentStageIndex = Object.keys(STAGE_CONFIG).indexOf(dunning.stage)
            const stageIndex = index
            const isPast = stageIndex <= currentStageIndex
            const isCurrent = stageIndex === currentStageIndex

            return (
              <div key={stage} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isPast ? 'bg-red-500 text-white' :
                  isCurrent ? 'bg-amber-500 text-white animate-pulse' :
                  'bg-zinc-700 text-zinc-500'
                }`}>
                  {index + 1}
                </div>
                {index < Object.keys(STAGE_CONFIG).length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    isPast ? 'bg-red-500' : 'bg-zinc-700'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
          <span>Ban đầu</span>
          <span>Nhắc nhở</span>
          <span>Cuối cùng</span>
          <span>Hủy</span>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <button
          onClick={handlePayNow}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-medium rounded-lg transition-opacity"
        >
          💳 Thanh toán ngay
        </button>
        <button
          onClick={handleUpdatePaymentMethod}
          className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors"
        >
          ⚙️ Cập nhật phương thức
        </button>
        <button
          onClick={handleContactSupport}
          className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors"
        >
          💬 Hỗ trợ
        </button>
      </motion.div>

      {/* Warning Banner */}
      {dunning.stage === 'cancel_notice' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-4 rounded-xl bg-red-600/20 border border-red-600/40"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <div className="font-bold text-red-400 mb-1">
                Cảnh báo khẩn cấp
              </div>
              <p className="text-sm text-red-300">
                Tài khoản của bạn sẽ bị hủy trong vòng {(dunning.daysUntilCancel || 0) * 24} giờ nếu không thanh toán.
                Sau khi hủy, tất cả dữ liệu sẽ bị xóa và không thể khôi phục.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Help Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6 p-4 rounded-xl bg-zinc-700/30 border border-zinc-600/50"
      >
        <div className="text-sm text-zinc-400">
          <strong className="text-white">Cần giúp đỡ?</strong>{' '}
          Liên hệ hỗ trợ tại{' '}
          <a href="/dashboard/support" className="text-purple-400 hover:underline">
            /dashboard/support
          </a>{' '}
          hoặc email{' '}
          <a href="mailto:support@wellnexus.vn" className="text-purple-400 hover:underline">
            support@wellnexus.vn
          </a>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================
// Time Box Component (for countdown)
// ============================================================

interface TimeBoxProps {
  value: number
  label: string
}

const TimeBox: React.FC<TimeBoxProps> = ({ value, label }) => {
  return (
    <div className="w-16 p-3 rounded-lg bg-zinc-800 border border-zinc-600 text-center">
      <div className="text-2xl font-bold text-white">
        {value.toString().padStart(2, '0')}
      </div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  )
}

export default DunningStatusPage
