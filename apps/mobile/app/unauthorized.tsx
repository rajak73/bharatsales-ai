import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSessionStore } from '../src/store/sessionStore';
import { useAuth } from '../src/lib/useAuth';
import { colors, spacing, typography } from '../src/theme/tokens';
import { Button } from '../src/components/ui';

export default function UnauthorizedScreen() {
  const user = useSessionStore((s) => s.user);
  const { logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="desktop-outline" size={40} color={colors.primary} />
      </View>
      <Text style={styles.title} accessibilityRole="header">Use the Web Dashboard</Text>
      <Text style={styles.body}>
        This mobile app is only for Sales Representatives and Distributors.{'\n'}
        {user?.role ? `Your role (${user.role})` : 'Your role'} should sign in at the BharatSales AI web dashboard instead.
      </Text>
      <Button
        label="Log Out"
        onPress={logout}
        variant="danger"
        fullWidth={false}
        style={{ paddingHorizontal: spacing.xxxl }}
        icon={<Ionicons name="log-out-outline" size={20} color={colors.danger} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, backgroundColor: colors.bg },
  iconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.md, textAlign: 'center' },
  body: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xxl, maxWidth: 340 },
});
