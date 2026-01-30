import React from 'react';
import { useDashboardMetrics, useRevenueData, useRecentActivity } from '../../hooks/queries/useDashboard';
import { KPICard } from '../../components/dashboard/KPICard';
import { RevenueChart } from '../../components/dashboard/RevenueChart';
import { GlassCard } from '../../components/ui/GlassCard';
import { DollarSign, ShoppingBag, Users, Store, Activity } from 'lucide-react';

export default function DashboardPage() {
  const { data: metrics } = useDashboardMetrics();
  const { data: revenueData } = useRevenueData();
  const { data: activity } = useRecentActivity();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Tổng quan</h1>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Tổng doanh thu"
          value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(metrics?.totalRevenue || 0)}
          icon={DollarSign}
          trend={metrics?.revenueChange || 0}
          color="brand"
        />
        <KPICard
          title="Đơn hàng mới"
          value={metrics?.totalOrders || 0}
          icon={ShoppingBag}
          trend={metrics?.ordersChange || 0}
          color="blue"
        />
        <KPICard
          title="Người dùng mới"
          value={metrics?.totalUsers || 0}
          icon={Users}
          trend={metrics?.usersChange || 0}
          color="purple"
        />
        <KPICard
          title="NPP Hoạt động"
          value={metrics?.activeDistributors || 0}
          icon={Store}
          trend={metrics?.distributorsChange || 0}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <GlassCard className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Biểu đồ doanh thu</h3>
            <select className="bg-white/50 dark:bg-zinc-900/50 border border-slate-200 dark:border-white/10 rounded-lg text-sm p-1">
              <option>7 ngày qua</option>
              <option>30 ngày qua</option>
            </select>
          </div>
          <RevenueChart data={revenueData || []} />
        </GlassCard>

        {/* Activity Feed */}
        <GlassCard className="p-6">
           <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
             <Activity className="w-5 h-5 text-brand-primary dark:text-teal-500" />
             Hoạt động gần đây
           </h3>
           <div className="space-y-6">
             {activity?.map((item) => (
               <div key={item.id} className="flex gap-4 relative">
                 <div className="absolute left-[11px] top-8 bottom-[-24px] w-px bg-slate-200 dark:bg-zinc-800 last:hidden" />
                 <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-950 flex items-center justify-center shrink-0 z-10">
                    <div className="w-2 h-2 rounded-full bg-teal-500" />
                 </div>
                 <div>
                   <p className="text-sm text-slate-900 dark:text-white">
                     <span className="font-semibold">{item.user}</span>{' '}
                     {item.action === 'placed_order' && 'đã đặt đơn hàng mới'}
                     {item.action === 'joined' && 'đã tham gia hệ thống'}
                     {item.action === 'level_up' && 'đã thăng cấp lên'}
                     {' '}
                     {item.target && <span className="text-brand-primary dark:text-teal-400 font-medium">{item.target}</span>}
                   </p>
                   <p className="text-xs text-slate-500 mt-1">{item.time}</p>
                 </div>
               </div>
             ))}
           </div>
        </GlassCard>
      </div>
    </div>
  );
}
