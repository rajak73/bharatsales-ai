import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      // A field rep/distributor is often offline — don't spin forever
      // refetching in the background when connectivity is flaky.
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
  },
});
