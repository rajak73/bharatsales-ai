import { Tabs } from 'expo-router';
import { useTabBarScreenOptions, tabIcon } from '../../../src/theme/tabBarOptions';

export default function RepTabsLayout() {
  const screenOptions = useTabBarScreenOptions();
  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('home', 'home-outline') }} />
      <Tabs.Screen name="beat" options={{ title: 'Beat', tabBarAccessibilityLabel: "Today's beat", tabBarIcon: tabIcon('navigate', 'navigate-outline') }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: tabIcon('receipt', 'receipt-outline') }} />
      <Tabs.Screen name="notifications" options={{ title: 'Alerts', tabBarAccessibilityLabel: 'Notifications', tabBarIcon: tabIcon('notifications', 'notifications-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('person-circle', 'person-circle-outline') }} />
    </Tabs>
  );
}
