import React from 'react';
import { HeroCard } from '../components/Dashboard/HeroCard';
import { StatsGrid } from '../components/Dashboard/StatsGrid';
import { RevenueChart } from '../components/Dashboard/RevenueChart';
import { TopProducts } from '../components/Dashboard/TopProducts';
import { useStore } from '../store';

export const Dashboard: React.FC = () => {
  const { user, revenueData, products } = useStore();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-brand-dark tracking-tight">Dashboard</h2>
          <p className="text-gray-500 text-sm md:text-base">Welcome back, let's grow together!</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Server Time</p>
          <p className="text-sm font-medium text-gray-800 font-mono">
            {new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
          </p>
        </div>
      </div>

      {/* Dashboard Grid - Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <HeroCard user={user} />
        <StatsGrid user={user} />
        <RevenueChart data={revenueData} />
        <TopProducts products={products} />
      </div>
    </div>
  );
};