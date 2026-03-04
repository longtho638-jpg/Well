import React, { useState } from 'react';
import { BarChart, Bar, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks';

interface VendorAnalyticsProps {
  vendorId: string;
  className?: string;
}

// Mock data
const mockChartData = [
  { name: 'Jan', sales: 4000, commission: 240, orders: 24 },
  { name: 'Feb', sales: 3000, commission: 139, orders: 19 },
  { name: 'Mar', sales: 2000, commission: 180, orders: 12 },
  { name: 'Apr', sales: 2780, commission: 190, orders: 21 },
  { name: 'May', sales: 1890, commission: 150, orders: 15 },
  { name: 'Jun', sales: 2390, commission: 221, orders: 18 },
];

const mockTopProducts = [
  { name: 'Product A', sales: 400, revenue: 4000000 },
  { name: 'Product B', sales: 300, revenue: 3000000 },
  { name: 'Product C', sales: 200, revenue: 2000000 },
  { name: 'Product D', sales: 150, revenue: 1500000 },
  { name: 'Product E', sales: 100, revenue: 1000000 },
];

const COLORS = ['#00575A', '#FFBF00', '#0EA5E9', '#8B5CF6', '#EC4899'];

const RANGE_OPTS = { '7d': '7 days', '30d': '30 days', '90d': '90 days' } as const;

export const VendorAnalytics: React.FC<VendorAnalyticsProps> = ({ vendorId: _vendorId, className }) => {
  const { t: _t } = useTranslation();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  const totalSales = mockChartData.reduce((sum, day) => sum + day.sales, 0);
  const totalCommission = mockChartData.reduce((sum, day) => sum + day.commission, 0);
  const totalOrders = mockChartData.reduce((sum, day) => sum + day.orders, 0);

  const renderRangeBtn = (range: '7d' | '30d' | '90d') => (
    <button
      key={range}
      onClick={() => setDateRange(range)}
      className={`px-3 py-1 text-sm rounded-md ${
        dateRange === range ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-zinc-700 dark:text-gray-300'
      }`}
    >
      {RANGE_OPTS[range]}
    </button>
  );

  const SummaryCard = ({ title, value, color, iconPath }: { title: string; value: string | number; color: string; iconPath: string }) => (
    <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-${color}-900/30 dark:to-${color}-800/30 rounded-xl p-6 border border-${color}-200 dark:border-${color}-800/50`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium text-${color}-600 dark:text-${color}-400`}>{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 bg-${color}-100 dark:bg-${color}-800/50 rounded-lg`}>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
          </svg>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 ${className}`}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Analytics</h3>
        <div className="flex space-x-2">
          {(['7d', '30d', '90d'] as const).map(renderRangeBtn)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard title="Total Sales" value={`${totalSales.toLocaleString('vi-VN')}₫`} color="blue" iconPath="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <SummaryCard title="Total Commission" value={`${totalCommission.toLocaleString('vi-VN')}₫`} color="green" iconPath="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        <SummaryCard title="Total Orders" value={totalOrders} color="purple" iconPath="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Over Time Chart */}
        <div className="bg-gray-50 dark:bg-zinc-800 p-6 rounded-xl">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">Sales Over Time</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={mockChartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00575A" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00575A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${value.toLocaleString('vi-VN')}₫`, 'Sales']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Area type="monotone" dataKey="sales" stroke="#00575A" fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-gray-50 dark:bg-zinc-800 p-6 rounded-xl">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">Top Products</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockTopProducts}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="sales"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {mockTopProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} sales`, 'Sales']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Category */}
        <div className="bg-gray-50 dark:bg-zinc-800 p-6 rounded-xl lg:col-span-2">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">Commission vs Revenue</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={mockChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value, name) => name === 'sales'
                    ? [`${value.toLocaleString('vi-VN')}₫`, 'Sales']
                    : [`${value.toLocaleString('vi-VN')}₫`, 'Commission']}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="sales" name="Sales (₫)" fill="#00575A" />
                <Line yAxisId="right" type="monotone" dataKey="commission" name="Commission (₫)" stroke="#FFBF00" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
};