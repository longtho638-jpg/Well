import { QueryClient, MutationCache, QueryCache } from '@tanstack/react-query';
import { systemLogger } from './logger';

const handleError = (error: unknown) => {
  // In a real app, use a Toast notification here
  systemLogger.error('Global Query Error:', error);
};

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleError,
  }),
  mutationCache: new MutationCache({
    onError: handleError,
  }),
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
