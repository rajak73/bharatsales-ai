import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSessionStore, isAllowedRole } from '../src/store/sessionStore';

export default function Index() {
  const user = useSessionStore((s) => s.user);
  const isInitializing = useSessionStore((s) => s.isInitializing);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (!isAllowedRole(user.role)) {
    return <Redirect href="/unauthorized" />;
  }

  if (user.role === 'Distributor') {
    return <Redirect href="/(distributor)" />;
  }

  return <Redirect href="/(rep)" />;
}
