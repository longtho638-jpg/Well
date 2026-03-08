/**
 * License Management Admin Dashboard - Phase 2
 * Simplified version using existing UI components
 */

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Key,
  Plus,
  Trash2,
  ShieldAlert,
  Activity,
  DollarSign,
  Search,
  Copy,
  Check,
} from 'lucide-react'
import { useRaaSLicense } from '@/hooks/use-raas-license'

interface LicenseKey {
  id: string
  key: string
  tier: string
  status: 'active' | 'revoked' | 'expired'
  orgName: string
  createdAt: string
  expiresAt: string
}

interface AuditLog {
  id: string
  event: string
  licenseId: string
  orgId: string
  timestamp: string
}

interface UsageStats {
  totalLicenses: number
  activeLicenses: number
  revokedLicenses: number
  totalRevenue: number
}

// Mock data
const mockLicenses: LicenseKey[] = [
  {
    id: '1',
    key: 'RAAS-XXXXX-XXXXX-XXXXX-001',
    tier: 'master',
    status: 'active',
    orgName: 'AgencyOS Inc',
    createdAt: '2026-03-01',
    expiresAt: '2027-03-01',
  },
  {
    id: '2',
    key: 'RAAS-XXXXX-XXXXX-XXXXX-002',
    tier: 'pro',
    status: 'active',
    orgName: 'Tech Startup Co',
    createdAt: '2026-03-05',
    expiresAt: '2027-03-05',
  },
]

const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    event: 'LICENSE_CREATED',
    licenseId: '1',
    orgId: 'org-1',
    timestamp: '2026-03-01T00:00:00Z',
  },
  {
    id: '2',
    event: 'LICENSE_VALIDATED',
    licenseId: '1',
    orgId: 'org-1',
    timestamp: '2026-03-08T10:00:00Z',
  },
]

const mockStats: UsageStats = {
  totalLicenses: 50,
  activeLicenses: 45,
  revokedLicenses: 3,
  totalRevenue: 125000,
}

export function LicenseManagementDashboard() {
  const { t } = useTranslation()
  const [licenses, setLicenses] = useState<LicenseKey[]>(mockLicenses)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs)
  const [stats] = useState<UsageStats>(mockStats)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newLicenseTier, setNewLicenseTier] = useState('pro')
  const [newLicenseOrg, setNewLicenseOrg] = useState('')

  const { isValid: hasAdminAccess } = useRaaSLicense({
    requiredFeature: 'adminDashboard',
  })

  const filteredLicenses = licenses.filter((license) => {
    const matchesSearch =
      license.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.orgName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || license.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const generateLicenseKey = () => {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `RAAS-${timestamp}-${random}-${Date.now().toString(36).toUpperCase().substring(0, 5)}`
  }

  const handleCreateLicense = () => {
    const newLicense: LicenseKey = {
      id: Date.now().toString(),
      key: generateLicenseKey(),
      tier: newLicenseTier,
      status: 'active',
      orgName: newLicenseOrg || 'Unknown Org',
      createdAt: new Date().toISOString().split('T')[0],
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }
    setLicenses([newLicense, ...licenses])
    setAuditLogs([
      {
        id: Date.now().toString(),
        event: 'LICENSE_CREATED',
        licenseId: newLicense.id,
        orgId: newLicense.orgName,
        timestamp: new Date().toISOString(),
      },
      ...auditLogs,
    ])
    setShowCreateDialog(false)
    setNewLicenseOrg('')
  }

  const handleRevokeLicense = (licenseId: string) => {
    setLicenses(
      licenses.map((l) => (l.id === licenseId ? { ...l, status: 'revoked' as const } : l))
    )
    setAuditLogs([
      {
        id: Date.now().toString(),
        event: 'LICENSE_REVOKED',
        licenseId,
        orgId: licenses.find((l) => l.id === licenseId)?.orgName || '',
        timestamp: new Date().toISOString(),
      },
      ...auditLogs,
    ])
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (!hasAdminAccess) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="max-w-md w-full p-6 bg-slate-800 rounded-lg border border-slate-700 text-center">
          <ShieldAlert className="h-12 w-12 mx-auto text-rose-500 mb-2" />
          <h2 className="text-xl font-bold mb-2">Admin Access Required</h2>
          <p className="text-slate-400">
            You need an active license with admin dashboard access
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('raas.license_management.title')}</h1>
          <p className="text-slate-400">
            {t('raas.license_management.description')}
          </p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('raas.license_management.create_button')}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Total Licenses</span>
            <Key className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold">{stats.totalLicenses}</div>
          <p className="text-xs text-slate-400">{stats.activeLicenses} active</p>
        </div>

        <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Active</span>
            <ShieldAlert className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold">{stats.activeLicenses}</div>
          <p className="text-xs text-slate-400">{stats.revokedLicenses} revoked</p>
        </div>

        <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Total Revenue</span>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
        </div>

        <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Activity</span>
            <Activity className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold">{auditLogs.length}</div>
          <p className="text-xs text-slate-400">Events logged</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('raas.license_management.search_placeholder')}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="revoked">Revoked</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Licenses Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold">{t('raas.license_management.tabs.licenses')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                  {t('raas.license_management.table.license_key')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                  {t('raas.license_management.table.organization')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                  {t('raas.license_management.table.tier')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                  {t('raas.license_management.table.status')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                  {t('raas.license_management.table.created')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                  {t('raas.license_management.table.expires')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                  {t('raas.license_management.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLicenses.map((license) => (
                <tr key={license.id} className="border-t border-slate-700">
                  <td className="px-4 py-3 font-mono text-sm">
                    <div className="flex items-center gap-2">
                      {license.key}
                      <button
                        onClick={() => copyToClipboard(license.key, license.id)}
                        className="p-1 hover:bg-slate-700 rounded"
                      >
                        {copiedId === license.id ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">{license.orgName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      license.tier === 'master' ? 'bg-amber-500/10 text-amber-500' :
                      license.tier === 'pro' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-gray-500/10 text-gray-500'
                    }`}>
                      {license.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      license.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                      license.status === 'revoked' ? 'bg-rose-500/10 text-rose-500' :
                      'bg-amber-500/10 text-amber-500'
                    }`}>
                      {license.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">{license.createdAt}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{license.expiresAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(license.key, license.id)}
                        className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 rounded"
                      >
                        {t('raas.license_management.table.copy')}
                      </button>
                      {license.status === 'active' && (
                        <button
                          onClick={() => handleRevokeLicense(license.id)}
                          className="px-3 py-1 text-sm bg-rose-500/20 hover:bg-rose-500/30 text-rose-500 rounded flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          {t('raas.license_management.table.revoke')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredLicenses.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <Key className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t('raas.license_management.no_licenses')}</p>
          </div>
        )}
      </div>

      {/* Audit Logs */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold">{t('raas.license_management.tabs.audit')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Event</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">License ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Organization</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} className="border-t border-slate-700">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      log.event.includes('CREATED') ? 'bg-emerald-500/10 text-emerald-500' :
                      log.event.includes('REVOKED') ? 'bg-rose-500/10 text-rose-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                      {log.event.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{log.licenseId}</td>
                  <td className="px-4 py-3">{log.orgId}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {auditLogs.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <p>{t('raas.license_management.no_audit_logs')}</p>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full border border-slate-700">
            <h2 className="text-xl font-bold mb-4">
              {t('raas.license_management.create_dialog.title')}
            </h2>
            <p className="text-slate-400 mb-4">
              {t('raas.license_management.create_dialog.description')}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('raas.license_management.create_dialog.org_label')}
                </label>
                <input
                  type="text"
                  placeholder={t('raas.license_management.create_dialog.org_placeholder')}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newLicenseOrg}
                  onChange={(e) => setNewLicenseOrg(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('raas.license_management.create_dialog.tier_label')}
                </label>
                <select
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newLicenseTier}
                  onChange={(e) => setNewLicenseTier(e.target.value)}
                >
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="master">Master</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
              >
                {t('raas.license_management.create_dialog.cancel_button')}
              </button>
              <button
                onClick={handleCreateLicense}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
              >
                {t('raas.license_management.create_dialog.generate_button')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LicenseManagementDashboard
