import { Redirect, Stack } from 'expo-router';
import { useSessionStore } from '../../src/store/sessionStore';

export default function DistributorLayout() {
  const user = useSessionStore((s) => s.user);
  const isInitializing = useSessionStore((s) => s.isInitializing);

  if (isInitializing) return null;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'Distributor') return <Redirect href="/unauthorized" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
