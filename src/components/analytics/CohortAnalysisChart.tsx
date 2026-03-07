/**
 * Cohort Analysis & Retention Metrics Component
 * Features: Week-over-week retention curves, feature adoption heatmap, CSV export
 */

import { useState } from 'react'
import { AreaChart } from 'recharts';
import { Area } from 'recharts';
import { XAxis } from 'recharts';
import { YAxis } from 'recharts';
import { Tooltip } from 'recharts';
import { ResponsiveContainer } from 'recharts';
import { Legend } from 'recharts';
import { Download, TrendingUp, Users } from 'lucide-react'
import { useCohortAnalysis } from '@/hooks/use-polar-analytics'

export function CohortAnalysisChart() {
  const [view, setView] = useState<'retention' | 'adoption'>('retention')
  const [weeks, setWeeks] = useState<'6' | '12' | '24'>('12')
  const { data: cohortData, loading, error } = useCohortAnalysis({ weeks: parseInt(weeks) })

  if (loading) {
    return (
      <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
        <div className="h-80 animate-pulse bg-gray-700/30 rounded-xl" />
      </div>
    )
  }

  if (error || !cohortData) {
    return (
      <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
        <p className="text-red-400 text-center">Error loading cohort data</p>
      </div>
    )
  }

  const exportToCSV = () => {
    const headers = ['Week', 'Cohort Size', 'Active Users', 'Retention Rate (%)', 'Revenue (VND)']
    const rows = cohortData.cohorts.map(c => [c.week, c.cohort_size, c.active_users, c.retention_rate, c.revenue].join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cohort-analysis-${weeks}weeks.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const heatmapData = cohortData.feature_adoption.map(f => ({
    feature: f.feature,
    adoption: f.adoption_rate,
    active: f.weekly_active,
    adoption_count: f.adoption_count,
    color: f.adoption_rate > 70 ? '#10b981' : f.adoption_rate > 40 ? '#3b82f6' : '#f59e0b',
  }))

  const renderRetentionView = () => (
    <>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div className="flex items-center gap-2 text-blue-400 mb-2"><Users className="w-4 h-4" /><span className="text-sm font-medium">Avg Retention</span></div>
          <p className="text-2xl font-bold text-blue-300">{cohortData.cohorts.length > 0 ? (cohortData.cohorts.reduce((sum, c) => sum + c.retention_rate, 0) / cohortData.cohorts.length).toFixed(1) : 0}%</p>
        </div>
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-2"><Users className="w-4 h-4" /><span className="text-sm font-medium">Total Active</span></div>
          <p className="text-2xl font-bold text-emerald-300">{cohortData.cohorts.reduce((sum, c) => sum + c.active_users, 0).toLocaleString()}</p>
        </div>
        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
          <div className="flex items-center gap-2 text-purple-400 mb-2"><Users className="w-4 h-4" /><span className="text-sm font-medium">Total Revenue</span></div>
          <p className="text-2xl font-bold text-purple-300">{(cohortData.cohorts.reduce((sum, c) => sum + c.revenue, 0) / 100).toLocaleString('vi-VN')}₫</p>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={cohortData.cohorts.reverse()}>
            <defs><linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
            <XAxis dataKey="week" stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `W${v}`} />
            <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }} formatter={(value: any, name: string) => name === 'Retention Rate' ? [`${value.toFixed(1)}%`, 'Retention Rate'] : [value.toLocaleString(), name]} />
            <Legend />
            <Area type="monotone" dataKey="retention_rate" name="Retention Rate" stroke="#3b82f6" fillOpacity={1} fill="url(#retentionGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-gray-800/50 text-gray-400"><tr><th className="px-4 py-3 rounded-l-lg">Week</th><th className="px-4 py-3">Cohort Size</th><th className="px-4 py-3">Active Users</th><th className="px-4 py-3">Retention Rate</th><th className="px-4 py-3 rounded-r-lg">Revenue (VND)</th></tr></thead>
          <tbody>{cohortData.cohorts.slice().reverse().map((cohort) => (
            <tr key={cohort.week} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
              <td className="px-4 py-3 font-medium text-white">Week {cohort.week}</td>
              <td className="px-4 py-3 text-gray-300">{cohort.cohort_size.toLocaleString()}</td>
              <td className="px-4 py-3 text-gray-300">{cohort.active_users.toLocaleString()}</td>
              <td className="px-4 py-3"><span className={`px-2 py-1 rounded-md text-xs font-medium ${cohort.retention_rate >= 60 ? 'bg-emerald-500/20 text-emerald-400' : cohort.retention_rate >= 30 ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>{cohort.retention_rate.toFixed(1)}%</span></td>
              <td className="px-4 py-3 text-gray-300">{(cohort.revenue / 100).toLocaleString('vi-VN')}₫</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </>
  )

  const renderAdoptionView = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {heatmapData.map((feature) => (
          <div key={feature.feature} className="p-6 rounded-xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:border-white/20 transition-all">
            <div className="flex items-center justify-between mb-4"><h4 className="text-white font-semibold">{feature.feature}</h4><div className="w-3 h-3 rounded-full" style={{ backgroundColor: feature.color }} /></div>
            <div className="mb-4"><div className="flex justify-between text-sm mb-2"><span className="text-gray-400">Adoption Rate</span><span className="text-white font-medium">{feature.adoption}%</span></div><div className="h-3 bg-gray-700 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${feature.adoption}%`, backgroundColor: feature.color }} /></div></div>
            <div className="flex items-center justify-between"><span className="text-sm text-gray-400">Weekly Active</span><span className="text-lg font-bold text-white">{feature.active.toLocaleString()}</span></div>
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <h4 className="text-sm font-medium text-blue-300 mb-3">Feature Adoption Summary</h4>
        <div className="grid grid-cols-3 gap-4">{heatmapData.map((f) => (<div key={f.feature}><p className="text-xs text-gray-400 mb-1">{f.feature}</p><p className="text-lg font-bold text-white">{f.adoption.toFixed(1)}% adoption</p><p className="text-xs text-gray-500">{f.adoption_count.toLocaleString()} / {cohortData.period_weeks} weeks</p></div>))}</div>
      </div>
    </>
  )

  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2"><TrendingUp className="w-5 h-5" />Cohort Analysis & Retention</h3>
          <p className="text-sm text-gray-400 mt-1">Week-over-week retention and feature adoption</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={weeks} onChange={(e) => setWeeks(e.target.value as any)} className="bg-gray-800/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none">
            <option value="6">6 weeks</option><option value="12">12 weeks</option><option value="24">24 weeks</option>
          </select>
          <div className="flex bg-gray-800/50 rounded-lg p-1 border border-white/10"><button onClick={() => setView('retention')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'retention' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:text-white'}`}>Retention</button><button onClick={() => setView('adoption')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'adoption' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:text-white'}`}>Adoption</button></div>
          <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/30 transition-all text-sm font-medium"><Download className="w-4 h-4" />Export CSV</button>
        </div>
      </div>
      {view === 'retention' ? renderRetentionView() : renderAdoptionView()}
    </div>
  )
}
