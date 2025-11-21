import React from 'react';
import { HeroCard } from '../components/Dashboard/HeroCard';
import { StatsGrid } from '../components/Dashboard/StatsGrid';
import { RevenueChart } from '../components/Dashboard/RevenueChart';
import { TopProducts } from '../components/Dashboard/TopProducts';
import { QuickActionsCard } from '../components/Dashboard/QuickActionsCard';
import { useStore } from '../store';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Package,
  Award,
  Target,
  Zap,
  Clock,
  CheckCircle2,
  Star,
  Crown
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export const Dashboard: React.FC = () => {
  const { user, revenueData, products, transactions } = useStore();

  // Revenue breakdown data
  const revenueBreakdown = [
    { name: 'Direct Sales', value: user.totalSales * 0.7, color: '#00575A' },
    { name: 'Team Bonus', value: user.totalSales * 0.25, color: '#FFBF00' },
    { name: 'Referral', value: user.totalSales * 0.05, color: '#22c55e' }
  ];

  // Recent activities
  const recentActivities = [
    { icon: CheckCircle2, label: 'Completed Quest: First Sale', time: '2 hours ago', color: 'text-green-600', bg: 'bg-green-50' },
    { icon: Users, label: 'New team member joined', time: '5 hours ago', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Package, label: 'Product shipped to customer', time: '1 day ago', color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: Award, label: 'Reached Partner rank', time: '3 days ago', color: 'text-amber-600', bg: 'bg-amber-50' }
  ];

  // Achievement badges
  const achievements = [
    { icon: Crown, label: 'Top Seller', unlocked: true, color: 'from-yellow-400 to-amber-500' },
    { icon: Target, label: 'Goal Crusher', unlocked: true, color: 'from-blue-400 to-cyan-500' },
    { icon: Star, label: 'Team Leader', unlocked: false, color: 'from-gray-300 to-gray-400' },
    { icon: Zap, label: 'Speed Demon', unlocked: false, color: 'from-gray-300 to-gray-400' }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-brand-dark tracking-tight flex items-center gap-2">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="w-8 h-8 text-[#FFBF00]" />
            </motion.div>
            Dashboard
          </h2>
          <p className="text-gray-500 text-sm md:text-base">Welcome back, {user.name}! 🚀</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Server Time</p>
          <p className="text-sm font-medium text-gray-800 font-mono">
            {new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
          </p>
        </div>
      </div>

      {/* Hero Card - Full Width */}
      <HeroCard user={user} />

      {/* Main Grid - 3 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stats + Chart (2 cols on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsGrid user={user} />
          </div>

          {/* Revenue Chart */}
          <RevenueChart data={revenueData} />

          {/* Top Products */}
          <TopProducts products={products} />
        </div>

        {/* Right Column - Sidebar widgets */}
        <div className="space-y-6">
          {/* Quick Actions Card - Priority position */}
          <QuickActionsCard />

          {/* Revenue Breakdown Donut Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#00575A]/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#00575A]" />
              </div>
              <h3 className="font-bold text-gray-900">Revenue Sources</h3>
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={revenueBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {revenueBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${(value / 1000000).toFixed(1)}M ₫`} />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-2 mt-4">
              {revenueBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {((item.value / user.totalSales) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900">Recent Activity</h3>
            </div>

            <div className="space-y-3">
              {recentActivities.map((activity, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-8 h-8 ${activity.bg} rounded-lg flex items-center justify-center shrink-0`}>
                    <activity.icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{activity.label}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Achievement Badges */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-yellow-300" />
                <h3 className="font-bold">Achievements</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {achievements.map((badge, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.1, type: 'spring' }}
                    className={`
                      relative p-4 rounded-xl text-center
                      ${badge.unlocked
                        ? 'bg-gradient-to-br ' + badge.color + ' shadow-lg'
                        : 'bg-white/10 backdrop-blur-sm opacity-50'
                      }
                    `}
                  >
                    <badge.icon className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs font-semibold">{badge.label}</p>
                    {!badge.unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 bg-gray-900/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                          <span className="text-xl">🔒</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <p className="text-xs text-white/70 mt-4 text-center">
                {achievements.filter(a => a.unlocked).length} / {achievements.length} unlocked
              </p>
            </div>
          </motion.div>

          {/* Quick Stats Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Transactions</span>
                <span className="font-bold text-gray-900">{transactions.length}</span>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Products</span>
                <span className="font-bold text-gray-900">{products.length}</span>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Rank</span>
                <span className="font-bold text-[#FFBF00]">{user.rank}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
