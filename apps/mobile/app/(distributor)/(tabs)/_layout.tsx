import { Tabs } from 'expo-router';
import { useTabBarScreenOptions, tabIcon } from '../../../src/theme/tabBarOptions';

export default function DistributorTabsLayout() {
  const screenOptions = useTabBarScreenOptions();
  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('home', 'home-outline') }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: tabIcon('receipt', 'receipt-outline') }} />
      <Tabs.Screen name="inventory" options={{ title: 'Inventory', tabBarIcon: tabIcon('cube', 'cube-outline') }} />
      <Tabs.Screen name="deliveries" options={{ title: 'Deliveries', tabBarIcon: tabIcon('car', 'car-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('person-circle', 'person-circle-outline') }} />
    </Tabs>
  );
}
