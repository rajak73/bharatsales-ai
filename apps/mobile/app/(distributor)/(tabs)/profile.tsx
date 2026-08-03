import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, getUserInitials } from '../../../src/lib/theme';
import { radius, spacing, typography } from '../../../src/theme/tokens';
import { useSessionStore } from '../../../src/store/sessionStore';
import { useOrgStore } from '../../../src/store/orgStore';
import { useAuth } from '../../../src/lib/useAuth';
import { useSyncStatus } from '../../../src/hooks/useSyncStatus';
import { SyncEngine } from '../../../src/sync/syncEngine';
import { Avatar, Card, Button } from '../../../src/components/ui';

export default function DistributorProfileScreen() {
  const user = useSessionStore((s) => s.user);
  const orgName = useOrgStore((s) => s.name);
  const orgLogoUrl = useOrgStore((s) => s.logoUrl);
  const { logout } = useAuth();
  const syncStatus = useSyncStatus();
  const [syncing, setSyncing] = useState(false);

  const handleForceSync = async () => {
    setSyncing(true);
    try {
      await SyncEngine.pullSync('Distributor');
      await SyncEngine.triggerSync();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Profile</Text>

        <Card style={styles.profileCard}>
          <Avatar uri={null} initials={getUserInitials(user?.name, user?.email)} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.name || 'Distributor'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'No email on file'}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}><Text style={styles.roleBadgeText}>Distributor</Text></View>
              {orgName && (
                <View style={styles.orgBadge}>
                  <Avatar uri={orgLogoUrl} initials={getUserInitials(orgName)} size={14} textColor={colors.textMuted} backgroundColor="transparent" />
                  <Text style={styles.orgBadgeText} numberOfLines={1}>{orgName}</Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        <Card>
          <View style={styles.syncRow}>
            <Ionicons name={syncStatus.pendingCount > 0 ? 'cloud-offline' : 'cloud-done'} size={18} color={syncStatus.pendingCount > 0 ? colors.warning : colors.success} />
            <Text style={styles.syncText}>
              {syncStatus.pendingCount > 0 ? `${syncStatus.pendingCount} item(s) waiting to sync.` : 'Everything is synced.'}
            </Text>
          </View>
          <Button
            label="Force Sync Now"
            onPress={handleForceSync}
            loading={syncing}
            variant="secondary"
            icon={<Ionicons name="refresh" size={16} color={colors.primary} />}
          />
        </Card>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(distributor)/payments')}>
          <Ionicons name="wallet" size={18} color={colors.text} />
          <Text style={styles.menuItemText}>Payments</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(distributor)/notifications')}>
          <Ionicons name="notifications" size={18} color={colors.text} />
          <Text style={styles.menuItemText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <Button label="Log Out" onPress={logout} variant="danger" icon={<Ionicons name="log-out" size={18} color={colors.danger} />} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.huge },
  title: { ...typography.display, fontSize: 22, color: colors.text },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  userName: { ...typography.h2, color: colors.text },
  userEmail: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  roleBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  roleBadgeText: { color: colors.primary, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  orgBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orgBadgeText: { ...typography.tiny, color: colors.textMuted, textTransform: 'none' },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  syncText: { color: colors.textMuted, fontSize: 13, flex: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  menuItemText: { flex: 1, ...typography.bodyMedium, color: colors.text },
});
