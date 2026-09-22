import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { getUserInitials } from '../../lib/theme';
import { useOrgStore } from '../../store/orgStore';
import { useSessionStore } from '../../store/sessionStore';
import { Avatar } from './Avatar';
import { IconButton } from './IconButton';

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
    <View style={[styles.container, { backgroundColor: orgPrimaryColor || colors.navy }]}>
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
          <Text style={styles.greeting} numberOfLines={1}>{greeting}, {user?.name?.split(' ')[0] || 'there'}</Text>
          {user?.role ? (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{user.role}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.headerActions}>
          {user?.role === 'Sales Representative' && (
            <IconButton icon="notifications-outline" tone="onBrand" size={22} onPress={() => router.push('/(rep)/(tabs)/notifications' as any)} accessibilityLabel="Notifications" />
          )}
          {user?.role === 'Distributor' && (
            <IconButton icon="notifications-outline" tone="onBrand" size={22} onPress={() => router.push('/(distributor)/notifications')} accessibilityLabel="Notifications" />
          )}
          <Pressable
            style={({ pressed }) => [styles.avatarButton, pressed && { opacity: 0.7 }]}
            onPress={() => router.push(user?.role === 'Distributor' ? '/(distributor)/(tabs)/profile' : '/(rep)/(tabs)/profile')}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
          >
            <Avatar uri={null} initials={getUserInitials(user?.name, user?.email)} size={36} backgroundColor="rgba(255,255,255,0.22)" textColor="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  orgRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  orgName: { ...typography.bodyMedium, color: colors.onNavy, flex: 1 },
  userRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  greeting: { ...typography.h1, color: '#fff' },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm, marginTop: spacing.xs + 2 },
  roleBadgeText: { ...typography.caption, color: '#fff' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  avatarButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
});
