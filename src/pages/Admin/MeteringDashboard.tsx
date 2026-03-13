/**
 * Admin Metering Dashboard - Phase 3
 * Track organization usage, overage revenue, and top consumers
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, Calendar, TrendingUp, Users, Activity } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useTranslation } from '@/hooks';
import { useToast } from '@/components/ui/Toast';

// Types
interface OrgUsage {
  org_id: string;
  org_name: string;
  plan_tier: 'free' | 'basic' | 'premium' | 'enterprise' | 'master';
  api_usage_pct: number;
  booking_usage_pct: number;
  reports_usage_pct: number;
  email_usage_pct: number;
  overage_amount: number;
}

interface TopConsumer {
  org_name: string;
  metric: string;
  total_usage: number;
  rank: number;
}

interface RevenueSummary {
  total_overage_revenue: number;
  period_start: string;
  period_end: string;
}

type DateRangePreset = 'this_month' | 'last_month' | 'custom';

interface DateRange {
  preset: DateRangePreset;
  start?: string;
  end?: string;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function MeteringDashboard() {
  const { t } = useTranslation();
  const { showToast } = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [orgUsage, setOrgUsage] = useState<OrgUsage[]>([]);
  const [topConsumers, setTopConsumers] = useState<TopConsumer[]>([]);
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ preset: 'this_month' });

  // Get date range boundaries
  const getDateRange = useCallback(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (dateRange.preset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (dateRange.preset === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else {
      start = dateRange.start ? new Date(dateRange.start) : new Date();
      end = dateRange.end ? new Date(dateRange.end) : new Date();
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }, [dateRange]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { start, end } = getDateRange();

      // Fetch org usage aggregation
      const { data: usageData, error: usageError } = await supabase.rpc('get_org_usage_aggregation', {
        p_start_date: start,
        p_end_date: end,
      });

      if (usageError) throw usageError;
      setOrgUsage(usageData || []);

      // Fetch top consumers
      const { data: topData, error: topError } = await supabase.rpc('get_top_consumers_by_metric', {
        p_start_date: start,
        p_end_date: end,
        p_limit: 5,
      });

      if (topError) throw topError;
      setTopConsumers(topData || []);

      // Fetch revenue summary
      const { data: revenueData, error: revenueError } = await supabase.rpc('get_overage_revenue_summary', {
        p_start_date: start,
        p_end_date: end,
      });

      if (revenueError) throw revenueError;
      setRevenue(revenueData?.[0] || null);
    } catch (error) {
      console.error('Failed to fetch metering data:', error);
      showToast('Failed to fetch usage data', 'error');
    } finally {
      setLoading(false);
    }
  }, [getDateRange, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Export to CSV
  const handleExportCSV = useCallback(() => {
    const headers = ['Organization', 'Plan Tier', 'API %', 'Booking %', 'Reports %', 'Email %', 'Overage Amount'];
    const csv = [
      headers.join(','),
      ...orgUsage.map((org) =>
        [
          org.org_name,
          org.plan_tier,
          `${org.api_usage_pct.toFixed(1)}%`,
          `${org.booking_usage_pct.toFixed(1)}%`,
          `${org.reports_usage_pct.toFixed(1)}%`,
          `${org.email_usage_pct.toFixed(1)}%`,
          org.overage_amount.toFixed(2),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metering-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast(t('admin.metering.export_success'), 'success');
  }, [orgUsage, showToast, t]);

  // Get tier badge color
  const getTierBadgeClass = (tier: string) => {
    const colors: Record<string, string> = {
      free: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      basic: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      premium: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      enterprise: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      master: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    };
    return colors[tier] || colors.free;
  };

  // Get usage percentage color
  const getUsageColor = (pct: number) => {
    if (pct >= 100) return 'text-red-400';
    if (pct >= 80) return 'text-orange-400';
    if (pct >= 50) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            {t('admin.metering.title')}
          </h1>
          <p className="text-zinc-500 mt-1">{t('admin.metering.subtitle')}</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={loading || orgUsage.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {t('admin.metering.export_csv')}
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-zinc-400" />
        <span className="text-sm text-zinc-500">{t('admin.metering.date_range')}:</span>
        <div className="flex gap-2">
          {(['this_month', 'last_month', 'custom'] as DateRangePreset[]).map((preset) => (
            <button
              key={preset}
              onClick={() => setDateRange({ preset })}
              className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                dateRange.preset === preset
                  ? 'border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                  : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              {t(`admin.metering.${preset}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Summary Card */}
      {revenue && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">{t('admin.metering.revenue')}</p>
              <p className="text-3xl font-bold text-emerald-500">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                  revenue.total_overage_revenue
                )}
              </p>
              <p className="text-xs text-zinc-400 mt-1">{t('admin.metering.revenue_this_month')}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Usage Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {t('admin.metering.usage_table')}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  {t('admin.metering.org_name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  {t('admin.metering.plan_tier')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  {t('admin.metering.api_usage')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  {t('admin.metering.booking_usage')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  {t('admin.metering.reports_usage')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  {t('admin.metering.email_usage')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Overage
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-zinc-500">
                      <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-500 rounded-full animate-spin" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : orgUsage.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    {t('admin.metering.no_data')}
                  </td>
                </tr>
              ) : (
                orgUsage.map((org) => (
                  <tr key={org.org_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                          {org.org_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-zinc-900 dark:text-white">
                          {org.org_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${getTierBadgeClass(
                          org.plan_tier
                        )}`}
                      >
                        {org.plan_tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${getUsageColor(org.api_usage_pct)}`}>
                        {org.api_usage_pct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${getUsageColor(org.booking_usage_pct)}`}>
                        {org.booking_usage_pct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${getUsageColor(org.reports_usage_pct)}`}>
                        {org.reports_usage_pct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${getUsageColor(org.email_usage_pct)}`}>
                        {org.email_usage_pct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="font-medium text-emerald-500">
                        {org.overage_amount > 0
                          ? new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                              minimumFractionDigits: 0,
                            }).format(org.overage_amount)
                          : '-'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Consumers */}
      {topConsumers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {t('admin.metering.top_consumers')}
              </h2>
              <p className="text-sm text-zinc-500">{t('admin.metering.top_5_by_metric')}</p>
            </div>
          </div>
          <div className="space-y-3">
            {topConsumers.map((consumer, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center text-sm font-bold text-zinc-600 dark:text-zinc-300">
                    #{consumer.rank}
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">{consumer.org_name}</p>
                    <p className="text-sm text-zinc-500 capitalize">{consumer.metric}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold text-blue-500">
                    {consumer.total_usage.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default MeteringDashboard;
