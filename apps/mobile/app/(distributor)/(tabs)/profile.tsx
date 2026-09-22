import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, getUserInitials } from '../../../src/lib/theme';
import { spacing, typography } from '../../../src/theme/tokens';
import { useSessionStore } from '../../../src/store/sessionStore';
import { useOrgStore } from '../../../src/store/orgStore';
import { useAuth } from '../../../src/lib/useAuth';
import { SyncStatusCard } from '../../../src/components/SyncStatusCard';
import { Avatar, Card, Button, ScreenHeader, SectionHeader, ListItem, StatusPill } from '../../../src/components/ui';

export default function DistributorProfileScreen() {
  const user = useSessionStore((s) => s.user);
  const orgName = useOrgStore((s) => s.name);
  const orgLogoUrl = useOrgStore((s) => s.logoUrl);
  const { logout } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Profile" showBack={false} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.profileCard}>
          <Avatar uri={null} initials={getUserInitials(user?.name, user?.email)} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>{user?.name || 'Distributor'}</Text>
            <Text style={styles.userEmail} numberOfLines={1}>{user?.email || 'No email on file'}</Text>
            <View style={styles.badgeRow}>
              <StatusPill label="Distributor" tone="primary" />
              {orgName && (
                <View style={styles.orgBadge}>
                  {orgLogoUrl ? (
                    <Avatar uri={orgLogoUrl} initials={getUserInitials(orgName)} size={16} textColor={colors.textMuted} backgroundColor="transparent" />
                  ) : (
                    <Ionicons name="business-outline" size={14} color={colors.textMuted} />
                  )}
                  <Text style={styles.orgBadgeText} numberOfLines={1}>{orgName}</Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        <SyncStatusCard />

        <SectionHeader title="More" />
        <View style={styles.menu}>
          <ListItem
            icon="wallet"
            iconColor={colors.success}
            iconBackground={colors.successLight}
            title="Payments"
            subtitle="Collections & invoices"
            showChevron
            onPress={() => router.push('/(distributor)/payments')}
          />
          <ListItem
            icon="notifications"
            title="Notifications"
            subtitle="Order and delivery updates"
            showChevron
            onPress={() => router.push('/(distributor)/notifications')}
          />
        </View>

        <Button label="Log Out" onPress={logout} variant="danger" icon={<Ionicons name="log-out-outline" size={20} color={colors.danger} />} style={{ marginTop: spacing.sm }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  userName: { ...typography.h2, color: colors.text },
  userEmail: { ...typography.body, color: colors.textMuted, marginTop: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  orgBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1 },
  orgBadgeText: { ...typography.caption, color: colors.textMuted, flexShrink: 1 },
  menu: { gap: spacing.sm },
});
