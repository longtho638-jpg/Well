import React, { useState, useEffect } from 'react';
import { HeroCard } from '../components/Dashboard/HeroCard';
import { StatsGrid } from '../components/Dashboard/StatsGrid';
import { RevenueChart } from '../components/Dashboard/RevenueChart';
import { TopProducts } from '../components/Dashboard/TopProducts';
import { QuickActionsCard } from '../components/Dashboard/QuickActionsCard';
import { DailyQuestHub } from '../components/Dashboard/DailyQuestHub';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
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
  Crown,
  Coins,
  ShoppingBag,
  TrendingDown,
  Gift,
  Sparkles,
  Radio
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatVND, formatNumber } from '../utils/format';

// Activity types
interface LiveActivity {
  id: string;
  type: 'reward' | 'order' | 'rank_up' | 'withdrawal' | 'referral';
  userName: string;
  message: string;
  timestamp: Date;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  amount?: number;
}

// Generate random Vietnamese names
const vietnameseNames = [
  'Nguyễn Văn Minh', 'Trần Thị Hương', 'Lê Quang Hải', 'Phạm Thu Hà',
  'Hoàng Minh Tuấn', 'Đỗ Thị Lan', 'Vũ Công Phượng', 'Ngô Thị Mai',
  'Bùi Văn Toàn', 'Đinh Thị Ngọc', 'Phan Văn Đức', 'Lý Thị Kim',
  'Trịnh Văn Quyết', 'Võ Thị Sáu', 'Mai Văn Thành', 'Cao Thị Loan',
  'Đặng Văn Lâm', 'Huỳnh Thị Ngân', 'Tô Văn Hùng', 'Lưu Thị Phương'
];

// Generate random live activity
const generateRandomActivity = (): LiveActivity => {
  const randomName = vietnameseNames[Math.floor(Math.random() * vietnameseNames.length)];
  const activityTypes: Array<LiveActivity['type']> = ['reward', 'order', 'rank_up', 'withdrawal', 'referral'];
  const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)];

  const activityTemplates = {
    reward: {
      icon: Coins,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      messages: [
        { text: 'vừa nhận ${amount} GROW tokens', amount: Math.floor(Math.random() * 900) + 100 },
        { text: 'được thưởng ${amount} GROW', amount: Math.floor(Math.random() * 1500) + 500 },
        { text: 'kiếm được ${amount} GROW từ team bonus', amount: Math.floor(Math.random() * 2000) + 800 }
      ]
    },
    order: {
      icon: ShoppingBag,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      messages: [
        { text: 'vừa chốt đơn ${amount}', amount: Math.floor(Math.random() * 8000000) + 2000000 },
        { text: 'bán thành công ${amount}', amount: Math.floor(Math.random() * 15000000) + 5000000 },
        { text: 'hoàn thành đơn hàng ${amount}', amount: Math.floor(Math.random() * 20000000) + 10000000 }
      ]
    },
    rank_up: {
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      messages: [
        { text: 'vừa thăng cấp Gold' },
        { text: 'đạt rank Partner' },
        { text: 'lên cấp Founder Club' },
        { text: 'thăng hạng Silver' }
      ]
    },
    withdrawal: {
      icon: TrendingDown,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      messages: [
        { text: 'rút ${amount} về tài khoản', amount: Math.floor(Math.random() * 30000000) + 10000000 },
        { text: 'chuyển ${amount} thành công', amount: Math.floor(Math.random() * 50000000) + 20000000 }
      ]
    },
    referral: {
      icon: Gift,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      messages: [
        { text: 'giới thiệu thành công 1 Partner mới' },
        { text: 'nhận bonus giới thiệu ${amount}', amount: Math.floor(Math.random() * 5000000) + 1000000 },
        { text: 'team mở rộng thêm 1 thành viên' }
      ]
    }
  };

  const template = activityTemplates[randomType];
  const randomMessage = template.messages[Math.floor(Math.random() * template.messages.length)];

  let messageText = randomMessage.text;
  let amount = 'amount' in randomMessage ? randomMessage.amount : undefined;

  if (amount && messageText.includes('${amount}')) {
    if (randomType === 'reward') {
      messageText = messageText.replace('${amount}', formatNumber(amount));
    } else {
      messageText = messageText.replace('${amount}', formatVND(amount));
    }
  }

  return {
    id: `activity-${Date.now()}-${Math.random()}`,
    type: randomType,
    userName: randomName,
    message: messageText,
    timestamp: new Date(),
    icon: template.icon,
    color: template.color,
    bgColor: template.bgColor,
    amount
  };
};

// Live Activities Ticker Component
const LiveActivitiesTicker: React.FC = () => {
  const [activities, setActivities] = useState<LiveActivity[]>([]);

  useEffect(() => {
    // Initialize with 5 activities
    const initialActivities = Array.from({ length: 5 }, () => generateRandomActivity());
    setActivities(initialActivities);

    // Add new activity every 3-5 seconds
    const interval = setInterval(() => {
      const newActivity = generateRandomActivity();
      setActivities(prev => {
        const updated = [newActivity, ...prev];
        // Keep only last 10 activities
        return updated.slice(0, 10);
      });
    }, Math.random() * 2000 + 3000); // 3-5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg"
            >
              <Radio className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                Live Activities
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="flex items-center gap-1 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full"
                >
                  <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  LIVE
                </motion.span>
              </h3>
              <p className="text-xs text-gray-500">Hoạt động đang diễn ra trên hệ thống</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400">Cập nhật liên tục</p>
          </div>
        </div>
      </div>

      {/* Ticker Container */}
      <div className="h-[400px] overflow-hidden relative">
        {/* Gradient overlays for fade effect */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />

        {/* Scrollable Content */}
        <div className="h-full overflow-y-auto px-6 py-4 space-y-2 scrollbar-hide">
          <AnimatePresence mode="popLayout">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.3 }}
                layout
                className="relative"
              >
                <div className={`
                  flex items-start gap-3 p-3 rounded-xl border border-gray-100
                  hover:shadow-md transition-all duration-300 cursor-pointer
                  ${activity.bgColor} ${index === 0 ? 'ring-2 ring-primary/20' : ''}
                `}>
                  {/* Animated Icon */}
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: index === 0 ? [0, 5, -5, 0] : 0
                    }}
                    transition={{
                      scale: { repeat: Infinity, duration: 2, delay: index * 0.2 },
                      rotate: { repeat: Infinity, duration: 1 }
                    }}
                    className={`w-10 h-10 ${activity.bgColor} rounded-lg flex items-center justify-center shrink-0 shadow-sm`}
                  >
                    <activity.icon className={`w-5 h-5 ${activity.color}`} />
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-bold">{activity.userName}</span>
                      {' '}
                      <span className="text-gray-600">{activity.message}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {activity.timestamp.toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </p>
                      {index === 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-semibold"
                        >
                          NEW
                        </motion.span>
                      )}
                    </div>
                  </div>

                  {/* Sparkles effect for new items */}
                  {index === 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {activities.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">Đang tải hoạt động...</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="bg-gray-50 border-t border-gray-100 px-6 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">
            🔥 {activities.length} hoạt động gần đây
          </span>
          <span className="text-gray-400">
            Hệ thống đang sôi động!
          </span>
        </div>
      </div>
    </motion.div>
  );
};

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

      {/* Daily Quest Hub - Full Width */}
      <DailyQuestHub />

      {/* Main Grid - 3 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stats + Chart (2 cols on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsGrid user={user} />
          </div>

          {/* Revenue Chart and Live Activities - Side by Side */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <RevenueChart data={revenueData} />

            {/* Live Activities Ticker */}
            <LiveActivitiesTicker />
          </div>

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
