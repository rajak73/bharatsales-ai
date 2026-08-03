import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { getUserInitials } from '../../lib/theme';
import { useOrgStore } from '../../store/orgStore';
import { useSessionStore } from '../../store/sessionStore';
import { Avatar } from './Avatar';

// The "organization identity" banner — always visible at the top of both
// Home dashboards, per spec: org logo/name, user name, role, greeting. Pulls
// live from orgStore (GET /settings/branding, fetched once after login) and
// sessionStore (already-known user), so nothing here is hardcoded per org.
export function OrgHeader() {
  const user = useSessionStore((s) => s.user);
  const orgName = useOrgStore((s) => s.name);
  const orgLogoUrl = useOrgStore((s) => s.logoUrl);
  const orgPrimaryColor = useOrgStore((s) => s.primaryColor);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <View style={[styles.container, { backgroundColor: orgPrimaryColor || colors.primary }]}>
      <View style={styles.orgRow}>
        <Avatar
          uri={orgLogoUrl}
          initials={orgName ? getUserInitials(orgName) : 'BS'}
          size={36}
          backgroundColor="rgba(255,255,255,0.2)"
          textColor="#fff"
        />
        <Text style={styles.orgName} numberOfLines={1}>{orgName || 'BharatSales AI'}</Text>
      </View>

      <View style={styles.userRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{greeting}, {user?.name?.split(' ')[0] || 'there'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{user?.role}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => router.push(user?.role === 'Distributor' ? '/(distributor)/(tabs)/profile' : '/(rep)/(tabs)/profile')}
          >
            <Avatar uri={null} initials={getUserInitials(user?.name, user?.email)} size={32} backgroundColor="rgba(255,255,255,0.2)" textColor="#fff" />
          </TouchableOpacity>
          {user?.role === 'Sales Representative' && (
            <TouchableOpacity onPress={() => router.push('/(rep)/(tabs)/notifications' as any)}>
              <Ionicons name="notifications" size={22} color="#fff" />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          )}
          {user?.role === 'Distributor' && (
            <TouchableOpacity onPress={() => router.push('/(distributor)/notifications')}>
              <Ionicons name="notifications" size={22} color="#fff" />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  orgRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  orgName: { ...typography.bodyMedium, color: 'rgba(255,255,255,0.95)', flex: 1 },
  userRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { ...typography.h1, color: '#fff' },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm, marginTop: spacing.xs },
  roleBadgeText: { ...typography.tiny, color: '#fff' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatarButton: {},
  notifDot: { position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger, borderWidth: 1.5, borderColor: colors.primary },
});
