import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { distributorService } from '../../services/distributorService';
import { PaginationParams } from '../../types';

export const useDistributors = (params: PaginationParams) => {
  return useQuery({
    queryKey: ['distributors', params],
    queryFn: () => distributorService.getDistributors(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useDistributor = (id: string) => {
  return useQuery({
    queryKey: ['distributor', id],
    queryFn: () => distributorService.getDistributorById(id),
    enabled: !!id,
  });
};

export const useUpdateDistributor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      distributorService.updateDistributor(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['distributors'] });
      queryClient.invalidateQueries({ queryKey: ['distributor', data.id] });
    },
  });
};
