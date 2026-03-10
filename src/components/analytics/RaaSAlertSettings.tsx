/**
 * RaaS Alert Settings Component - Phase 6.4
 *
 * UI for configuring alert rules and thresholds.
 * Supports quota, spending, and feature block alerts.
 *
 * Features:
 * - Create/edit/delete alert rules
 * - Threshold configuration
 * - Severity level selection
 * - Notification channel setup
 * - Real-time preview
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { raasAlertRules, type AlertRuleConfig, type AlertSeverity, type AlertRuleType } from '@/lib/raas-alert-rules'
import { AlertTriangle, Bell, Settings, Trash2, Edit, Plus, Save, X, Check } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface RaaSAlertSettingsProps {
  /** Organization ID */
  orgId: string
  /** Callback when rule is created/updated */
  onRuleChange?: () => void
}

interface AlertRuleForm {
  name: string
  description: string
  rule_type: AlertRuleType
  severity: AlertSeverity
  threshold: number
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq'
  enabled: boolean
  cooldown_seconds: number
  message_template: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function RaaSAlertSettings({ orgId, onRuleChange }: RaaSAlertSettingsProps) {
  const { t } = useTranslation('alert_settings')
  const [rules, setRules] = useState<AlertRuleConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<AlertRuleConfig | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [form, setForm] = useState<AlertRuleForm>({
    name: '',
    description: '',
    rule_type: 'quota_threshold',
    severity: 'warning',
    threshold: 90,
    operator: 'gte',
    enabled: true,
    cooldown_seconds: 3600,
    message_template: '',
  })

  // Load rules on mount
  useEffect(() => {
    loadRules()
  }, [orgId])

  const loadRules = async () => {
    setLoading(true)
    const fetchedRules = await raasAlertRules.getAlertRules(orgId)
    setRules(fetchedRules)
    setLoading(false)
  }

  const handleCreateRule = () => {
    setEditingRule(null)
    setForm({
      name: '',
      description: '',
      rule_type: 'quota_threshold',
      severity: 'warning',
      threshold: 90,
      operator: 'gte',
      enabled: true,
      cooldown_seconds: 3600,
      message_template: '',
    })
    setShowForm(true)
  }

  const handleEditRule = (rule: AlertRuleConfig) => {
    setEditingRule(rule)
    setForm({
      name: rule.name,
      description: rule.description || '',
      rule_type: rule.rule_type,
      severity: rule.severity,
      threshold: rule.threshold,
      operator: rule.operator,
      enabled: rule.enabled,
      cooldown_seconds: rule.cooldown_seconds || 3600,
      message_template: rule.message_template || '',
    })
    setShowForm(true)
  }

  const handleSaveRule = async () => {
    setSaving(true)

    try {
      if (editingRule) {
        await raasAlertRules.updateAlertRule(editingRule.id!, {
          ...form,
        })
      } else {
        await raasAlertRules.createAlertRule({
          ...form,
          org_id: orgId,
        })
      }

      await loadRules()
      onRuleChange?.()
      setShowForm(false)
    } catch (err) {
      console.error('[RaaSAlertSettings] Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm(t('alert_settings.delete_confirm'))) {
      return
    }

    try {
      await raasAlertRules.deleteAlertRule(ruleId)
      await loadRules()
      onRuleChange?.()
    } catch (err) {
      console.error('[RaaSAlertSettings] Delete error:', err)
    }
  }

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'info':
        return 'text-blue-400 bg-blue-400/10'
      case 'warning':
        return 'text-yellow-400 bg-yellow-400/10'
      case 'critical':
        return 'text-red-400 bg-red-400/10'
      default:
        return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getRuleTypeIcon = (ruleType: AlertRuleType) => {
    switch (ruleType) {
      case 'quota_threshold':
        return <AlertTriangle className="w-4 h-4" />
      case 'spending_limit':
        return <Settings className="w-4 h-4" />
      case 'feature_blocked':
        return <X className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t('alert_settings.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('alert_settings.description')}</p>
        </div>
        <button
          onClick={handleCreateRule}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          {t('alert_settings.add_rule')}
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {rules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{t('alert_settings.no_rules')}</p>
            <p className="text-sm">{t('alert_settings.no_rules_description')}</p>
          </div>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-card/50"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded ${getSeverityColor(rule.severity)}`}>
                  {getRuleTypeIcon(rule.rule_type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{rule.name}</h3>
                    {!rule.enabled && (
                      <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {t('alert_settings.disabled')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {rule.description || t('alert_settings.no_description')}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>
                      {t('alert_settings.threshold')}: {rule.threshold} ({rule.operator})
                    </span>
                    <span>
                      {t('alert_settings.cooldown')}: {Math.round((rule.cooldown_seconds || 0) / 60)}m
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditRule(rule)}
                  className="p-2 hover:bg-muted rounded"
                  title={t('alert_settings.edit')}
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteRule(rule.id!)}
                  className="p-2 hover:bg-destructive/10 text-destructive rounded"
                  title={t('alert_settings.delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-card z-10">
              <h3 className="text-lg font-semibold">
                {editingRule ? t('alert_settings.edit_rule') : t('alert_settings.create_rule')}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Rule Type */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('alert_settings.rule_type')}
                </label>
                <select
                  value={form.rule_type}
                  onChange={(e) => setForm({ ...form, rule_type: e.target.value as AlertRuleType })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  disabled={!!editingRule}
                >
                  <option value="quota_threshold">{t('alert_settings.types.quota_threshold')}</option>
                  <option value="spending_limit">{t('alert_settings.types.spending_limit')}</option>
                  <option value="feature_blocked">{t('alert_settings.types.feature_blocked')}</option>
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('alert_settings.name')}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder={t('alert_settings.name_placeholder')}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('alert_settings.description')}
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  rows={2}
                  placeholder={t('alert_settings.description_placeholder')}
                />
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('alert_settings.severity')}
                </label>
                <select
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value as AlertSeverity })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="info">{t('alert_settings.severity_info')}</option>
                  <option value="warning">{t('alert_settings.severity_warning')}</option>
                  <option value="critical">{t('alert_settings.severity_critical')}</option>
                </select>
              </div>

              {/* Threshold & Operator */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('alert_settings.threshold')}
                  </label>
                  <input
                    type="number"
                    value={form.threshold}
                    onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('alert_settings.operator')}
                  </label>
                  <select
                    value={form.operator}
                    onChange={(e) => setForm({ ...form, operator: e.target.value as AlertRuleForm['operator'] })}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="gt">&gt; (Greater than)</option>
                    <option value="gte">&ge; (Greater or equal)</option>
                    <option value="lt">&lt; (Less than)</option>
                    <option value="lte">&le; (Less or equal)</option>
                    <option value="eq">= (Equal)</option>
                  </select>
                </div>
              </div>

              {/* Cooldown */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('alert_settings.cooldown')} ({t('alert_settings.seconds')})
                </label>
                <input
                  type="number"
                  value={form.cooldown_seconds}
                  onChange={(e) => setForm({ ...form, cooldown_seconds: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>

              {/* Message Template */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('alert_settings.message_template')}
                </label>
                <textarea
                  value={form.message_template}
                  onChange={(e) => setForm({ ...form, message_template: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  rows={2}
                  placeholder={t('alert_settings.message_placeholder')}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('alert_settings.message_help')}
                </p>
              </div>

              {/* Enabled */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="enabled" className="text-sm">
                  {t('alert_settings.enable_rule')}
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex justify-end gap-2 sticky bottom-0 bg-card">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded-md hover:bg-muted"
              >
                {t('alert_settings.cancel')}
              </button>
              <button
                onClick={handleSaveRule}
                disabled={saving || !form.name}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? t('alert_settings.saving') : t('alert_settings.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RaaSAlertSettings
