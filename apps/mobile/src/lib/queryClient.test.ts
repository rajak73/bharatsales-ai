import { onlineManager } from '@tanstack/react-query';
import { queryClient } from './queryClient';

describe('queryClient local (SQLite) queries', () => {
  afterEach(() => {
    onlineManager.setOnline(true);
    queryClient.clear();
  });

  it('still run while the device is offline', async () => {
    onlineManager.setOnline(false);
    const data = await queryClient.fetchQuery({ queryKey: ['local', 'orders'], queryFn: async () => ['queued order'] });
    expect(data).toEqual(['queued order']);
  });

  it('leaves network-backed queries on the default online mode', () => {
    expect(queryClient.getQueryDefaults(['attendance', 'current']).networkMode).toBeUndefined();
    expect(queryClient.getQueryDefaults(['local', 'orders']).networkMode).toBe('always');
  });
});
