/**
 * Usage Dashboard Page - Main analytics dashboard with multi-tenant support
 * Phase 6.6: Added tenant selector and aggregate usage across tenants
 */

import { useState, useEffect, useCallback } from 'react'
import { useUsageAnalytics } from '@/hooks/use-usage-analytics'
import { useStore } from '@/store'
import { UsageGaugeGrid } from '@/components/analytics/UsageGaugeGrid'
import { UsageTrendsChart } from '@/components/analytics/UsageTrendsChart'
import { TopConsumersTable } from '@/components/analytics/TopConsumersTable'
import { TenantLicenseCard } from '@/components/tenant/TenantLicenseCard'
import { Helmet } from 'react-helmet-async'
import { Building, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Tenant {
  id: string
  name: string
  status: 'active' | 'suspended' | 'expired'
  tier: 'basic' | 'pro' | 'enterprise' | 'unlimited'
  validFrom: string
  validUntil?: string
}

export function UsageDashboardPage() {
  const { user } = useStore()
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week')
  const [trendsData, setTrendsData] = useState<any[]>([])
  const [topConsumers, setTopConsumers] = useState<any[]>([])
  const [loadingTrends, setLoadingTrends] = useState(true)

  // Multi-tenant state
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState<string>('all')
  const [loadingTenants, setLoadingTenants] = useState(true)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)

  const { getTrends, getTopConsumers } = useUsageAnalytics({
    userId: user?.id,
    enabled: !!user,
  })

  // Fetch tenants for admin users
  const fetchTenants = useCallback(async () => {
    try {
      setLoadingTenants(true)
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          id,
          name,
          status,
          raas_licenses (
            tier,
            valid_from,
            valid_until
          )
        `)
        .order('name', { ascending: true })

      if (error) throw error

      const tenantList: Tenant[] = (data || []).map((t: any) => {
        const license = t.raas_licenses?.[0]
        return {
          id: t.id,
          name: t.name,
          status: t.status,
          tier: license?.tier || 'basic',
          validFrom: license?.valid_from || new Date().toISOString(),
          validUntil: license?.valid_until || undefined,
        }
      })

      setTenants(tenantList)

      // Select first tenant by default if exists
      if (tenantList.length > 0 && selectedTenantId === 'all') {
        setSelectedTenantId(tenantList[0].id)
        setSelectedTenant(tenantList[0])
      }
    } catch (err) {
      console.error('[fetchTenants] Error:', err)
    } finally {
      setLoadingTenants(false)
    }
  }, [selectedTenantId])

  useEffect(() => {
    fetchTenants()
  }, [fetchTenants])

  // Fetch trends
  useEffect(() => {
    if (!user || !getTrends) return

    const fetchTrends = async () => {
      try {
        setLoadingTrends(true)
        const days = period === 'day' ? 1 : period === 'week' ? 7 : 30
        const data = await getTrends({
          granularity: period === 'day' ? 'hour' : 'day',
          days,
        })
        setTrendsData(data)
      } catch (error) {
        // Error handled by error boundary
      } finally {
        setLoadingTrends(false)
      }
    }

    fetchTrends()
  }, [user, period, getTrends, selectedTenantId])

  // Fetch top consumers (admin only)
  useEffect(() => {
    if (!getTopConsumers) return

    const fetchTopConsumers = async () => {
      try {
        const data = await getTopConsumers({ limit: 10, periodDays: 30 })
        setTopConsumers(data)
      } catch (error) {
        // Error handled by error boundary
      }
    }

    fetchTopConsumers()
  }, [getTopConsumers])

  return (
    <>
      <Helmet>
        <title>Analytics Dashboard - Usage Metrics</title>
        <meta name="description" content="Real-time usage analytics and quota monitoring" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        {/* Header */}
        <div className="border-b border-white/10 bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
                  <p className="text-sm text-gray-400 mt-1">Theo dõi usage và quota theo thời gian thực</p>
                </div>

                {/* Tenant Selector */}
                {!loadingTenants && tenants.length > 0 && (
                  <div className="relative">
                    <select
                      value={selectedTenantId}
                      onChange={(e) => {
                        setSelectedTenantId(e.target.value)
                        setSelectedTenant(tenants.find(t => t.id === e.target.value) || null)
                      }}
                      className="appearance-none pl-10 pr-8 py-2 rounded-lg bg-gray-800 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                    >
                      <option value="all">Tất cả tenants</option>
                      {tenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </option>
                      ))}
                    </select>
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Period Selector */}
              <div className="flex gap-2">
                {(['day', 'week', 'month'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      'px-4 py-2 text-sm rounded-lg border transition-all',
                      period === p
                        ? 'border-white/30 text-white bg-white/10'
                        : 'border-white/10 text-gray-400 hover:text-white'
                    )}
                  >
                    {p === 'day' ? 'Ngày' : p === 'week' ? 'Tuần' : 'Tháng'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Selected Tenant License Card */}
          {selectedTenant && (
            <section>
              <TenantLicenseCard
                tenantId={selectedTenant.id}
                tenantName={selectedTenant.name}
                tier={selectedTenant.tier}
                status={selectedTenant.status}
                validFrom={selectedTenant.validFrom}
                validUntil={selectedTenant.validUntil}
              />
            </section>
          )}

          {/* Usage Gauges */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Quota Utilization</h2>
            {user && <UsageGaugeGrid userId={user.id} />}
          </section>

          {/* Usage Trends */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Usage Trends</h2>
            {loadingTrends ? (
              <div className="h-72 rounded-xl bg-gray-800/30 animate-pulse" />
            ) : (
              <UsageTrendsChart data={trendsData} />
            )}
          </section>

          {/* Top Consumers (Admin) */}
          {topConsumers.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Top Consumers</h2>
              <TopConsumersTable data={topConsumers} />
            </section>
          )}
        </div>
      </div>
    </>
  )
}

// Simple cn utility if not available
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export default UsageDashboardPage
