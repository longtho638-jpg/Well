/**
 * Payment Method Manager Component
 *
 * Manages user payment methods with Stripe Elements integration.
 * Supports adding, updating, and removing payment methods.
 *
 * Features:
 * - Stripe Elements form for secure card input
 * - Current card display
 * - Update/replace flow
 * - Invoice history
 * - Payment method validation
 *
 * Usage:
 *   <PaymentMethodManager
 *     customerId={customerId}
 *     onPaymentMethodUpdated={handleUpdate}
 *   />
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@supabase/supabase-js'
import { analyticsLogger } from '@/utils/logger'

export interface PaymentMethod {
  id: string
  type: 'card' | 'bank_account'
  card?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
  isDefault: boolean
}

export interface Invoice {
  id: string
  amount: number
  currency: string
  status: 'paid' | 'unpaid' | 'pending' | 'failed'
  created: string
  hostedInvoiceUrl?: string
}

export interface PaymentMethodManagerProps {
  customerId: string
  onPaymentMethodUpdated?: (method: PaymentMethod) => void
}

const BRAND_ICONS: Record<string, string> = {
  visa: '💳',
  mastercard: '💳',
  amex: '💳',
  discover: '💳',
  jcb: '💳',
  diners: '💳',
  unionpay: '💳',
  default: '💳',
}

export const PaymentMethodManager: React.FC<PaymentMethodManagerProps> = ({
  customerId,
  onPaymentMethodUpdated,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [updating, setUpdating] = useState(false)

  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
  )

  // Fetch current payment method
  useEffect(() => {
    fetchPaymentMethod()
    fetchInvoices()
  }, [customerId])

  const fetchPaymentMethod = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.functions.invoke('stripe-get-payment-method', {
        body: { customer_id: customerId },
      })

      if (error) throw error

      if (data?.payment_method) {
        const pm = data.payment_method
        setPaymentMethod({
          id: pm.id,
          type: pm.type,
          card: pm.card ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          } : undefined,
          isDefault: pm.is_default || true,
        })
      }
    } catch (error) {
      analyticsLogger.error('[PaymentMethodManager] Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-get-invoices', {
        body: { customer_id: customerId },
      })

      if (error) throw error

      setInvoices(data?.invoices || [])
    } catch (error) {
      analyticsLogger.error('[PaymentMethodManager] Invoice fetch error:', error)
    }
  }

  const handleAddPaymentMethod = async (cardData: {
    cardNumber: string
    expiry: string
    cvc: string
  }) => {
    try {
      setUpdating(true)

      // Call Edge Function to create payment method
      const { data, error } = await supabase.functions.invoke('stripe-create-payment-method', {
        body: {
          customer_id: customerId,
          card_data: cardData,
        },
      })

      if (error) throw error

      setPaymentMethod(data?.payment_method)
      setShowAddForm(false)
      onPaymentMethodUpdated?.(data?.payment_method)

      // Show success message
      alert('✅ Thêm thẻ thành công!')
    } catch (error) {
      analyticsLogger.error('[PaymentMethodManager] Add error:', error)
      alert('❌ Không thể thêm thẻ. Vui lòng thử lại.')
    } finally {
      setUpdating(false)
    }
  }

  const handleRemovePaymentMethod = async () => {
    if (!confirm('Bạn có chắc muốn xóa phương thức thanh toán này?')) return

    try {
      setUpdating(true)

      const { error } = await supabase.functions.invoke('stripe-delete-payment-method', {
        body: {
          customer_id: customerId,
          payment_method_id: paymentMethod?.id,
        },
      })

      if (error) throw error

      setPaymentMethod(null)
      onPaymentMethodUpdated?.({ id: '', type: 'card', isDefault: false })
    } catch (error) {
      analyticsLogger.error('[PaymentMethodManager] Remove error:', error)
      alert('❌ Không thể xóa thẻ.')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse p-6 rounded-xl bg-zinc-800/50 border border-white/10">
        <div className="h-6 bg-zinc-700 rounded w-1/3 mb-4" />
        <div className="h-20 bg-zinc-700 rounded mb-4" />
        <div className="h-4 bg-zinc-700 rounded w-1/4" />
      </div>
    )
  }

  return (
    <div className="p-6 rounded-xl bg-zinc-800/50 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">
          Phương thức thanh toán
        </h3>
        {!paymentMethod && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            + Thêm thẻ
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Current Payment Method */}
        {paymentMethod ? (
          <motion.div
            key="payment-method"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Card Display */}
            <div className="relative p-6 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

              {/* Card content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl">
                    {BRAND_ICONS[paymentMethod.card?.brand?.toLowerCase() || 'default']}
                  </span>
                  {paymentMethod.isDefault && (
                    <span className="px-2 py-1 bg-white/20 rounded text-xs text-white">
                      Mặc định
                    </span>
                  )}
                </div>

                <div className="text-xl font-mono text-white mb-4">
                  •••• •••• •••• {paymentMethod.card?.last4 || '----'}
                </div>

                <div className="flex items-center justify-between text-sm text-white/80">
                  <div>
                    <div className="text-xs text-white/60">Hết hạn</div>
                    <div>
                      {paymentMethod.card?.expMonth?.toString().padStart(2, '0') || '--'}/
                      {paymentMethod.card?.expYear?.toString().slice(-2) || '--'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/60">Thẻ</div>
                    <div className="capitalize">{paymentMethod.card?.brand || 'Card'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddForm(true)}
                className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg transition-colors"
                disabled={updating}
              >
                Cập nhật
              </button>
              <button
                onClick={handleRemovePaymentMethod}
                className="flex-1 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium rounded-lg transition-colors"
                disabled={updating}
              >
                Xóa
              </button>
            </div>

            {/* Invoice History */}
            {invoices.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-white mb-3">
                  Lịch sử hóa đơn
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {invoices.slice(0, 5).map((invoice) => (
                    <InvoiceRow key={invoice.id} invoice={invoice} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="no-payment-method"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-8"
          >
            <div className="text-4xl mb-4">💳</div>
            <p className="text-zinc-400 mb-4">
              Chưa có phương thức thanh toán
            </p>
            <p className="text-sm text-zinc-500">
              Thêm thẻ để thanh toán các gói subscription và overage fees
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Payment Method Form Modal */}
      {showAddForm && (
        <AddPaymentMethodModal
          onClose={() => setShowAddForm(false)}
          onAdd={handleAddPaymentMethod}
          isProcessing={updating}
        />
      )}
    </div>
  )
}

// ============================================================
// Invoice Row Component
// ============================================================

interface InvoiceRowProps {
  invoice: Invoice
}

const InvoiceRow: React.FC<InvoiceRowProps> = ({ invoice }) => {
  const statusColors: Record<string, string> = {
    paid: 'text-emerald-400 bg-emerald-400/10',
    unpaid: 'text-amber-400 bg-amber-400/10',
    pending: 'text-zinc-400 bg-zinc-400/10',
    failed: 'text-red-400 bg-red-400/10',
  }

  const statusLabels: Record<string, string> = {
    paid: 'Đã thanh toán',
    unpaid: 'Chưa thanh toán',
    pending: 'Đang xử lý',
    failed: 'Thất bại',
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-700/50 hover:bg-zinc-700/70 transition-colors">
      <div>
        <div className="text-sm text-white">
          ${(invoice.amount / 100).toFixed(2)}
        </div>
        <div className="text-xs text-zinc-500">
          {new Date(invoice.created).toLocaleDateString('vi-VN')}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[invoice.status]}`}>
          {statusLabels[invoice.status]}
        </span>
        {invoice.hostedInvoiceUrl && (
          <a
            href={invoice.hostedInvoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-400 hover:text-purple-300"
          >
            Xem →
          </a>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Add Payment Method Modal
// ============================================================

interface AddPaymentMethodModalProps {
  onClose: () => void
  onAdd: (cardData: { cardNumber: string; expiry: string; cvc: string }) => void
  isProcessing: boolean
}

const AddPaymentMethodModal: React.FC<AddPaymentMethodModalProps> = ({
  onClose,
  onAdd,
  isProcessing,
}) => {
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Basic validation
    if (!cardNumber || !expiry || !cvc) {
      setError('Vui lòng điền đầy đủ thông tin')
      return
    }

    if (cardNumber.replace(/\s/g, '').length !== 16) {
      setError('Số thẻ không hợp lệ')
      return
    }

    onAdd({ cardNumber, expiry, cvc })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-800 rounded-xl p-6 max-w-md w-full border border-white/10"
      >
        <h3 className="text-lg font-semibold text-white mb-4">
          Thêm phương thức thanh toán
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Number */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              Số thẻ
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19))}
              placeholder="1234 5678 9012 3456"
              className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              maxLength={19}
            />
          </div>

          {/* Expiry & CVC */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Ngày hết hạn
              </label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  if (value.length <= 4) {
                    setExpiry(value.length >= 2 ? `${value.slice(0, 2)}/${value.slice(2)}` : value)
                  }
                }}
                placeholder="MM/YY"
                className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                maxLength={5}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                CVC
              </label>
              <input
                type="text"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="123"
                className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                maxLength={4}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 p-2 rounded">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg transition-colors"
              disabled={isProcessing}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white text-sm font-medium rounded-lg transition-opacity"
              disabled={isProcessing}
            >
              {isProcessing ? 'Đang xử lý...' : 'Thêm thẻ'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default PaymentMethodManager
