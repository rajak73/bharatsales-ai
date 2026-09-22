import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSessionStore, isAllowedRole } from '../src/store/sessionStore';
import { colors } from '../src/theme/tokens';

export default function Index() {
  const user = useSessionStore((s) => s.user);
  const isInitializing = useSessionStore((s) => s.isInitializing);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading" />
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
