import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { AuthService } from '@bharatsales/api-client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Requests permission and registers the device's Expo push token against
// the logged-in user via the new, purely additive POST /auth/push-token
// endpoint. Safe to call multiple times (idempotent — always overwrites
// with the current token). Silently no-ops on failure (e.g. permission
// denied, or running in a simulator without push capability) since push is
// an enhancement, not a blocker to using the app.
export async function registerForPushNotifications(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    await AuthService.registerPushToken(tokenResponse.data);
  } catch (err) {
    console.warn('[Push] Failed to register for push notifications', err);
  }
}
