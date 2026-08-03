import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, typography } from '../../theme/tokens';
import { useOrgStore } from '../../store/orgStore';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: { icon: keyof typeof Ionicons.glyphMap | null; label?: string; onPress: () => void };
}

// Every pushed screen (Reports, Target, Payments, order/[id], delivery/[id],
// collection, outlets-list, ...) previously duplicated the same
// `<View style={header}><TouchableOpacity back /><Text title /></View>`
// block with its own StyleSheet — this is the single standardized version,
// using the org's brand color (falling back to the default primary) so
// every screen visually reflects the logged-in organization.
export function ScreenHeader({ title, subtitle, showBack = true, rightAction }: ScreenHeaderProps) {
  const orgPrimaryColor = useOrgStore((s) => s.primaryColor);

  return (
    <View style={[styles.header, { backgroundColor: orgPrimaryColor || colors.primary }]}>
      {showBack ? (
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 22 }} />
      )}
      <View style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
      {rightAction ? (
        <TouchableOpacity onPress={rightAction.onPress} hitSlop={12}>
          {rightAction.icon ? (
            <Ionicons name={rightAction.icon} size={20} color="#fff" />
          ) : (
            <Text style={styles.rightLabel}>{rightAction.label}</Text>
          )}
        </TouchableOpacity>
      ) : (
        <View style={{ width: 22 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: { ...typography.h2, color: '#fff' },
  subtitle: { ...typography.caption, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  rightLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
});
