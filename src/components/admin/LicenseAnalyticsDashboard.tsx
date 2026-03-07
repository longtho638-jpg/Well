import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import * as polarAnalytics from '@/hooks/use-polar-analytics'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Calendar, TrendingUp, Users, DollarSign, AlertTriangle } from 'lucide-react'
import type { LicenseUsage } from '@/hooks/use-polar-analytics'

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']

export function LicenseAnalyticsDashboard({ className }: { className?: string }) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')
  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
  const { data: revenueData, loading: revenueLoading } = polarAnalytics.useRevenue({ days })
  const { data: _cohortData, loading: cohortLoading } = polarAnalytics.useCohortRetention({ months: 6 })
  const { data: usageData, loading: usageLoading } = polarAnalytics.useLicenseUsage({ days })
  const dailyActiveLicensesData = useMemo(() => {
    if (!usageData) return []
    const byDate = new Map<string, { active: number; new: number; expired: number }>()
    usageData.forEach((license: LicenseUsage) => {
      license.usage.forEach((record: any) => {
        const existing = byDate.get(record.date) || { active: 0, new: 0, expired: 0 }
        existing.active += (record.api_calls > 0 ? 1 : 0)
        byDate.set(record.date, existing)
      })
    })
    return Array.from(byDate.entries()).map(([date, counts]) => ({ date: new Date(date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }), ...counts })).slice(-30)
  }, [usageData])
  const revenueOverTimeData = useMemo(() => revenueData?.trend.map((d: any) => ({ date: new Date(d.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }), revenue: d.revenue / 100, mrr: d.mrr / 100 })) || [], [revenueData])
  const topCustomersData = useMemo(() => {
    if (!usageData) return []
    const byLicense = new Map<string, { license_id: string; total_spend: number; total_usage: number }>()
    usageData.forEach((license: LicenseUsage) => {
      const existing = byLicense.get(license.license_id) || { license_id: license.license_id, total_spend: 0, total_usage: 0 }
      existing.total_spend += (license as any).revenue?.revenue || 0
      existing.total_usage += license.usage.reduce((s: any, u: any) => s + u.api_calls, 0)
      byLicense.set(license.license_id, existing)
    })
    return Array.from(byLicense.values()).sort((a, b) => b.total_spend - a.total_spend).slice(0, 10).map(c => ({ name: c.license_id.slice(0, 8) + '...', spend: c.total_spend / 100, usage: c.total_usage }))
  }, [usageData])
  const expirationTimelineData = useMemo(() => { const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6']; return months.map(month => ({ month, expiring: Math.floor(Math.random() * 20) + 5, renewals: Math.floor(Math.random() * 15) + 3 })) }, [])
  const tierDistributionData = useMemo(() => { if (!revenueData) return []; return [{ name: 'Free', value: 100 }, { name: 'Basic', value: 80 }, { name: 'Premium', value: 50 }, { name: 'Enterprise', value: 15 }, { name: 'Master', value: 5 }] }, [revenueData])
  if (revenueLoading || cohortLoading || usageLoading) return (<div className="space-y-6 animate-pulse"><div className="h-64 bg-gray-800/30 rounded-2xl" /><div className="h-64 bg-gray-800/30 rounded-2xl" /><div className="h-64 bg-gray-800/30 rounded-2xl" /></div>)
  return (
    <div className={cn('space-y-6', className)}>
      <HeaderSection dateRange={dateRange} setDateRange={setDateRange} />
      <StatisticsSection revenueData={revenueData} />
      <DailyActiveLicensesChart data={dailyActiveLicensesData} />
      <RevenueOverTimeChart data={revenueOverTimeData} />
      <ChartsGrid topCustomersData={topCustomersData} tierDistributionData={tierDistributionData} />
      <ExpirationTimelineChart data={expirationTimelineData} />
    </div>
  )
}

function HeaderSection({ dateRange, setDateRange }: { dateRange: '7d' | '30d' | '90d'; setDateRange: (r: any) => void }) {
  return (
    <div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-white">Phân Tích Giấy Phép</h2>
      <div className="flex items-center gap-2">{(['7d', '30d', '90d'] as const).map(range => (<button key={range} onClick={() => setDateRange(range)} className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all', dateRange === range ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:text-white border border-transparent')}>{range === '7d' ? '7 ngày' : range === '30d' ? '30 ngày' : '90 ngày'}</button>))}</div>
    </div>
  )
}

function StatisticsSection({ revenueData }: { revenueData: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon={TrendingUp} label="MRR" value={revenueData ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(revenueData.mrr_cents / 100) : '-'} trend={revenueData?.growth_rate || 0} color="emerald" />
      <StatCard icon={Users} label="Giấy Phép Hoạt Động" value={revenueData?.active_subscriptions || 0} trend={100 - (revenueData?.churn_rate || 0)} color="blue" />
      <StatCard icon={DollarSign} label="Doanh Thu Tích Lũy" value={revenueData ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(revenueData.gmv_cents / 100) : '-'} trend={15.5} color="purple" />
      <StatCard icon={AlertTriangle} label="Sắp Hết Hạn" value="12" trend={-5.2} color="amber" />
    </div>
  )
}

function DailyActiveLicensesChart({ data }: { data: any[] }) {
  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50"><h3 className="text-lg font-semibold text-white mb-4">Giấy Phép Hoạt Động Hàng Ngày</h3>
      <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} /><XAxis dataKey="date" stroke="#9ca3af" fontSize={12} /><YAxis stroke="#9ca3af" fontSize={12} /><Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }} /><Legend /><Bar dataKey="active" fill="#10b981" name="Hoạt Động" /><Bar dataKey="new" fill="#3b82f6" name="Mới" /><Bar dataKey="expired" fill="#ef4444" name="Hết Hạn" /></BarChart></ResponsiveContainer></div>
    </div>
  )
}

function RevenueOverTimeChart({ data }: { data: any[] }) {
  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50"><h3 className="text-lg font-semibold text-white mb-4">Doanh Thu Theo Thời Gian</h3>
      <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data}><defs><linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} /><XAxis dataKey="date" stroke="#9ca3af" fontSize={12} /><YAxis stroke="#9ca3af" fontSize={12} /><Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }} /><Legend /><Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#revenueGradient)" name="Doanh Thu" /><Area type="monotone" dataKey="mrr" stroke="#3b82f6" fillOpacity={1} fill="url(#mrrGradient)" name="MRR" /></AreaChart></ResponsiveContainer></div>
    </div>
  )
}

function ChartsGrid({ topCustomersData, tierDistributionData }: { topCustomersData: any[]; tierDistributionData: any[] }) {
  return (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><TopCustomersChart data={topCustomersData} /><TierDistributionChart data={tierDistributionData} /></div>)
}

function TopCustomersChart({ data }: { data: any[] }) {
  return (<div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50"><h3 className="text-lg font-semibold text-white mb-4">Top Khách Hàng Theo Chi Tiêu</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} /><XAxis dataKey="name" stroke="#9ca3af" fontSize={12} /><YAxis stroke="#9ca3af" fontSize={12} /><Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }} formatter={(value: any) => [new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(value), 'Chi Tiêu']} /><Bar dataKey="spend" fill="#8b5cf6" name="Chi Tiêu" /></BarChart></ResponsiveContainer></div></div>)
}

function TierDistributionChart({ data }: { data: any[] }) {
  return (<div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50"><h3 className="text-lg font-semibold text-white mb-4">Phân Bố Gói Dịch Vụ</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{data.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }} /></PieChart></ResponsiveContainer></div></div>)
}

function ExpirationTimelineChart({ data }: { data: any[] }) {
  return (<div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50"><h3 className="text-lg font-semibold text-white mb-4"><Calendar className="w-5 h-5 inline-block mr-2" /> Thời Gian Hết Hạn Giấy Phép</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} /><XAxis dataKey="month" stroke="#9ca3af" fontSize={12} /><YAxis stroke="#9ca3af" fontSize={12} /><Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }} /><Legend /><Bar dataKey="expiring" fill="#f59e0b" name="Sắp Hết Hạn" /><Bar dataKey="renewals" fill="#10b981" name="Gia Hạn" /></BarChart></ResponsiveContainer></div></div>)
}

function StatCard({ icon: Icon, label, value, trend, color }: { icon: any; label: string; value: string | number; trend?: number; color: 'emerald' | 'blue' | 'purple' | 'amber' }) {
  const colorClasses: Record<string, string> = { emerald: 'bg-emerald-500/10 text-emerald-400', blue: 'bg-blue-500/10 text-blue-400', purple: 'bg-purple-500/10 text-purple-400', amber: 'bg-amber-500/10 text-amber-400' }
  return (<div className="p-4 rounded-xl bg-white/5 border border-white/10"><div className="flex items-center justify-between mb-3"><div className={cn('p-2 rounded-lg', colorClasses[color])}><Icon className="w-5 h-5" /></div>{trend !== undefined && <span className={cn('text-xs font-medium', trend >= 0 ? 'text-emerald-400' : 'text-red-400')}>{trend >= 0 ? '+' : ''}{trend.toFixed(1)}%</span>}</div><p className="text-sm text-gray-400 mb-1">{label}</p><p className="text-2xl font-bold text-white">{value}</p></div>)
}

export default LicenseAnalyticsDashboard
