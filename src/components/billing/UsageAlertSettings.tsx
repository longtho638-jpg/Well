/**
 * Usage Alert Settings - Phase 6
 *
 * Configuration panel for usage alert preferences.
 * Allows users to customize notification channels and thresholds.
 */

import React, { useState } from 'react'
import { useUsageAlerts } from '@/hooks/use-usage-alerts'
import type { AlertSettings } from '@/types/usage-alerts'
import type { AlertMetricType, AlertThreshold } from '@/lib/usage-alert-engine'
import { ALERT_METRIC_INFO } from '@/types/usage-alerts'

interface UsageAlertSettingsProps {
  userId: string
}

const AVAILABLE_THRESHOLDS: AlertThreshold[] = [80, 90, 100]

const AVAILABLE_METRICS: AlertMetricType[] = [
  'api_calls',
  'tokens',
  'compute_minutes',
  'model_inferences',
  'agent_executions',
]

export const UsageAlertSettings: React.FC<UsageAlertSettingsProps> = ({ userId }) => {
  const { settings, updateSettings, loading, error } = useUsageAlerts(userId)
  const [isSaving, setIsSaving] = useState(false)
  const [localSettings, setLocalSettings] = useState<AlertSettings | null>(null)

  const currentSettings = localSettings || settings

  const handleToggleChannel = (channel: keyof Pick<AlertSettings, 'emailEnabled' | 'webhookEnabled' | 'smsEnabled'>) => {
    if (!currentSettings) return
    setLocalSettings({ ...currentSettings, [channel]: !currentSettings[channel] })
  }

  const handleToggleThreshold = (threshold: AlertThreshold) => {
    if (!currentSettings) return
    const exists = currentSettings.thresholds.includes(threshold)
    setLocalSettings({
      ...currentSettings,
      thresholds: exists
        ? currentSettings.thresholds.filter((t) => t !== threshold)
        : [...currentSettings.thresholds, threshold].sort((a, b) => a - b),
    })
  }

  const handleToggleMetric = (metric: AlertMetricType) => {
    if (!currentSettings) return
    const exists = currentSettings.metrics.includes(metric)
    setLocalSettings({
      ...currentSettings,
      metrics: exists
        ? currentSettings.metrics.filter((m) => m !== metric)
        : [...currentSettings.metrics, metric],
    })
  }

  const handleSave = async () => {
    if (!localSettings) return
    setIsSaving(true)
    try {
      await updateSettings(localSettings)
      setLocalSettings(null)
    } catch (err) {
      // Error handled silently - UI shows error state
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    )
  }

  if (!currentSettings) {
    return null
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Cài đặt cảnh báo sử dụng</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Notification Channels */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-white mb-4">Kênh thông báo</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📧</span>
              <div>
                <p className="text-white font-medium">Email</p>
                <p className="text-gray-400 text-sm">Nhận cảnh báo qua email</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={currentSettings.emailEnabled}
              onChange={() => handleToggleChannel('emailEnabled')}
              className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔗</span>
              <div>
                <p className="text-white font-medium">Webhook</p>
                <p className="text-gray-400 text-sm">Gửi webhook đến AgencyOS</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={currentSettings.webhookEnabled}
              onChange={() => handleToggleChannel('webhookEnabled')}
              className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors opacity-50">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <p className="text-white font-medium">SMS</p>
                <p className="text-gray-400 text-sm">Sớm ra mắt</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={currentSettings.smsEnabled || false}
              onChange={() => handleToggleChannel('smsEnabled')}
              disabled
              className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500"
            />
          </label>
        </div>
      </div>

      {/* Thresholds */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-white mb-4">Ngưỡng cảnh báo</h3>
        <div className="flex gap-4">
          {AVAILABLE_THRESHOLDS.map((threshold) => {
            const isSelected = currentSettings.thresholds.includes(threshold)
            return (
              <button
                key={threshold}
                onClick={() => handleToggleThreshold(threshold)}
                className={`flex-1 py-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? threshold === 80
                      ? 'border-amber-400 bg-amber-500/10 text-amber-400'
                      : threshold === 90
                      ? 'border-orange-400 bg-orange-500/10 text-orange-400'
                      : 'border-red-400 bg-red-500/10 text-red-400'
                    : 'border-gray-600 bg-gray-700/30 text-gray-400 hover:border-gray-500'
                }`}
              >
                <p className="text-2xl font-bold">{threshold}%</p>
                <p className="text-xs mt-1">
                  {threshold === 80 && 'Cảnh báo sớm'}
                  {threshold === 90 && 'Sắp hết'}
                  {threshold === 100 && 'Đã hết'}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Metrics */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-white mb-4">Chỉ số theo dõi</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {AVAILABLE_METRICS.map((metric) => {
            const metricInfo = ALERT_METRIC_INFO[metric]
            const isSelected = currentSettings.metrics.includes(metric)
            return (
              <button
                key={metric}
                onClick={() => handleToggleMetric(metric)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-emerald-400 bg-emerald-500/10 text-emerald-400'
                    : 'border-gray-600 bg-gray-700/30 text-gray-400 hover:border-gray-500'
                }`}
              >
                <span className="text-2xl mb-2 block">{metricInfo.icon}</span>
                <p className="text-sm font-medium">{metricInfo.label}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Cooldown */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-white mb-4">Thời gian chờ giữa cảnh báo</h3>
        <select
          value={currentSettings.cooldownMinutes || 60}
          onChange={(e) =>
            setLocalSettings({ ...currentSettings, cooldownMinutes: parseInt(e.target.value) })
          }
          className="w-full bg-gray-700/30 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value={15}>15 phút</option>
          <option value={30}>30 phút</option>
          <option value={60}>1 giờ</option>
          <option value={180}>3 giờ</option>
          <option value={360}>6 giờ</option>
        </select>
      </div>

      {/* Save button */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
        <button
          onClick={() => setLocalSettings(settings)}
          disabled={!localSettings || isSaving}
          className="px-6 py-3 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
        >
          Hủy
        </button>
        <button
          onClick={handleSave}
          disabled={!localSettings || isSaving}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
        >
          {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>
    </div>
  )
}

export default UsageAlertSettings
