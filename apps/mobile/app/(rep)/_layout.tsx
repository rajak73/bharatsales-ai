import { Redirect, Stack } from 'expo-router';
import { useSessionStore } from '../../src/store/sessionStore';

export default function RepLayout() {
  const user = useSessionStore((s) => s.user);
  const isInitializing = useSessionStore((s) => s.isInitializing);

  if (isInitializing) return null;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'Sales Representative') return <Redirect href="/unauthorized" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
