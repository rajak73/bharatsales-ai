import { Stack } from 'expo-router';
import { NotificationsScreen } from '../../src/features/shared/NotificationsScreen';

export default function DistributorNotifications() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <NotificationsScreen showBack />
    </>
  );
}
