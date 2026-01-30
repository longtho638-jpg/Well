import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services/dashboardService';

export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: dashboardService.getMetrics,
  });
};

export const useRevenueData = (days: number = 7) => {
  return useQuery({
    queryKey: ['revenue-data', days],
    queryFn: () => dashboardService.getRevenueData(days),
  });
};

export const useRecentActivity = () => {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: dashboardService.getRecentActivity,
  });
};
