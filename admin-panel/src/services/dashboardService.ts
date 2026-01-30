import { supabase } from '../lib/supabase';

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  activeDistributors: number;
  revenueChange: number; // percentage
  ordersChange: number;
  usersChange: number;
  distributorsChange: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
}

export interface ActivityItem {
  id: string;
  user: string;
  action: string; // 'placed_order', 'joined', 'level_up'
  target?: string;
  time: string;
}

export const dashboardService = {
  async getMetrics(): Promise<DashboardMetrics> {
    // In a real app, this would be an RPC call or Materialized View fetch
    // For now, we'll fetch counts
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    // Revenue would need aggregation, simulating for MVP
    const { data: orders } = await supabase.from('orders').select('total_amount').eq('status', 'delivered');
    const totalRevenue = orders?.reduce((acc, order) => acc + (order.total_amount || 0), 0) || 0;

    return {
      totalRevenue: totalRevenue || 12500000, // Fallback to mock if empty for demo
      totalOrders: orderCount || 24,
      totalUsers: userCount || 128,
      activeDistributors: 15,
      revenueChange: 12.5,
      ordersChange: 8.2,
      usersChange: 24.5,
      distributorsChange: 5.0,
    };
  },

  async getRevenueData(days: number = 7): Promise<RevenueData[]> {
    // Mock data for charts
    const data: RevenueData[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        revenue: Math.floor(Math.random() * 5000000) + 1000000,
      });
    }
    return data;
  },

  async getRecentActivity(): Promise<ActivityItem[]> {
      return [
          { id: '1', user: 'Nguyễn Văn A', action: 'placed_order', target: '#ORD-123', time: '5 phút trước' },
          { id: '2', user: 'Trần Thị B', action: 'joined', time: '15 phút trước' },
          { id: '3', user: 'Lê Văn C', action: 'level_up', target: 'Gold', time: '1 giờ trước' },
          { id: '4', user: 'Phạm Thị D', action: 'placed_order', target: '#ORD-124', time: '2 giờ trước' },
      ];
  }
};
