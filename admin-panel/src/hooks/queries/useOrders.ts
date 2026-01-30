import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { PaginationParams, Order } from '../../types';

export const useOrders = (params: PaginationParams) => {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => orderService.getOrders(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getOrderById(id),
    enabled: !!id,
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Order['status'] }) =>
      orderService.updateOrderStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', data.id] });
    },
  });
};
