import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardPage from './DashboardPage';
import * as useDashboardHooks from '../../hooks/queries/useDashboard';

// Mock the Recharts component because it's hard to test in JSDOM
vi.mock('../../components/dashboard/RevenueChart', () => ({
  RevenueChart: () => <div data-testid="revenue-chart">Revenue Chart Mock</div>
}));

// Mock the queries
vi.mock('../../hooks/queries/useDashboard', () => ({
  useDashboardMetrics: vi.fn(),
  useRevenueData: vi.fn(),
  useRecentActivity: vi.fn(),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state or empty state gracefully', () => {
    (useDashboardHooks.useDashboardMetrics as any).mockReturnValue({ data: undefined });
    (useDashboardHooks.useRevenueData as any).mockReturnValue({ data: undefined });
    (useDashboardHooks.useRecentActivity as any).mockReturnValue({ data: undefined });

    render(<DashboardPage />);

    expect(screen.getByText('Tổng quan')).toBeInTheDocument();
    // KPI Cards should render 0/default
    expect(screen.getByText('Tổng doanh thu')).toBeInTheDocument();
    // 0 formatted as currency might vary, let's just check existence of labels
    expect(screen.getByText('Đơn hàng mới')).toBeInTheDocument();
  });

  it('renders metrics correctly', () => {
    const mockMetrics = {
      totalRevenue: 15000000,
      revenueChange: 12.5,
      totalOrders: 45,
      ordersChange: 5,
      totalUsers: 120,
      usersChange: 8,
      activeDistributors: 15,
      distributorsChange: 2
    };

    (useDashboardHooks.useDashboardMetrics as any).mockReturnValue({ data: mockMetrics });
    (useDashboardHooks.useRevenueData as any).mockReturnValue({ data: [] });
    (useDashboardHooks.useRecentActivity as any).mockReturnValue({ data: [] });

    render(<DashboardPage />);

    // Check specific values
    // 15,000,000 VND -> "15.000.000 ₫" or similar depending on locale implementation in JSDOM
    // We'll search for the number part to be safe or just use a regex
    expect(screen.getByText(/15\.000\.000/)).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('renders revenue chart', () => {
    (useDashboardHooks.useDashboardMetrics as any).mockReturnValue({ data: {} });
    (useDashboardHooks.useRevenueData as any).mockReturnValue({ data: [{ date: '2023-01-01', revenue: 100 }] });
    (useDashboardHooks.useRecentActivity as any).mockReturnValue({ data: [] });

    render(<DashboardPage />);

    expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
  });

  it('renders activity feed', () => {
    const mockActivity = [
      { id: 1, user: 'User A', action: 'placed_order', time: '2 hours ago' },
      { id: 2, user: 'User B', action: 'joined', time: '5 hours ago' }
    ];

    (useDashboardHooks.useDashboardMetrics as any).mockReturnValue({ data: {} });
    (useDashboardHooks.useRevenueData as any).mockReturnValue({ data: [] });
    (useDashboardHooks.useRecentActivity as any).mockReturnValue({ data: mockActivity });

    render(<DashboardPage />);

    expect(screen.getByText('User A')).toBeInTheDocument();
    expect(screen.getByText(/đã đặt đơn hàng mới/)).toBeInTheDocument();
    expect(screen.getByText('User B')).toBeInTheDocument();
    expect(screen.getByText(/đã tham gia hệ thống/)).toBeInTheDocument();
  });
});
