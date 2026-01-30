import { useQuery } from '@tanstack/react-query';
import { customerService } from '../../services/customerService';
import { PaginationParams } from '../../types';

export const useCustomers = (params: PaginationParams) => {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => customerService.getCustomers(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerService.getCustomerById(id),
    enabled: !!id,
  });
};

export const useCustomerOrders = (customerId: string) => {
  return useQuery({
    queryKey: ['customer-orders', customerId],
    queryFn: () => customerService.getCustomerOrders(customerId),
    enabled: !!customerId,
  });
};
