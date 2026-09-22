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

// ['local', ...] queries read the on-device SQLite cache, never the network,
// so they must keep running while offline. With the default networkMode
// ('online') they pause whenever TanStack's onlineManager reports offline, and
// an order booked offline would not show up as "Pending Sync" until the
// connection came back.
queryClient.setQueryDefaults(['local'], { networkMode: 'always' });
