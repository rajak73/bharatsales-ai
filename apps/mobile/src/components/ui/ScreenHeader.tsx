import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, touchTarget, typography } from '../../theme/tokens';
import { useOrgStore } from '../../store/orgStore';
import { IconButton } from './IconButton';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap | null;
    label?: string;
    onPress: () => void;
    accessibilityLabel?: string;
    badgeCount?: number;
    disabled?: boolean;
  };
}

// Every pushed screen (Reports, Target, Payments, order/[id], delivery/[id],
// collection, outlets-list, ...) previously duplicated the same
// `<View style={header}><TouchableOpacity back /><Text title /></View>`
// block with its own StyleSheet — this is the single standardized version,
// using the org's brand color (falling back to the default primary) so
// every screen visually reflects the logged-in organization. Both side
// slots are fixed 48dp touch targets so the title stays centred.
export function ScreenHeader({ title, subtitle, showBack = true, rightAction }: ScreenHeaderProps) {
  const orgPrimaryColor = useOrgStore((s) => s.primaryColor);

  const goBack = () => {
    // Deep links / notification taps can open a pushed screen with no
    // history underneath it — fall back to the role-aware root instead of a
    // back button that silently does nothing.
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={[styles.header, { backgroundColor: orgPrimaryColor || colors.navy }]}>
      {showBack ? (
        <IconButton icon="chevron-back" size={24} tone="onBrand" onPress={goBack} accessibilityLabel="Go back" />
      ) : (
        <View style={styles.side} />
      )}
      <View style={styles.titleWrap} accessibilityRole="header">
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {rightAction ? (
        rightAction.icon ? (
          <IconButton
            icon={rightAction.icon}
            tone="onBrand"
            onPress={rightAction.onPress}
            accessibilityLabel={rightAction.accessibilityLabel || rightAction.label || title}
            badgeCount={rightAction.badgeCount}
            disabled={rightAction.disabled}
          />
        ) : (
          <Pressable
            onPress={rightAction.onPress}
            disabled={rightAction.disabled}
            accessibilityRole="button"
            accessibilityLabel={rightAction.accessibilityLabel || rightAction.label}
            style={({ pressed }) => [styles.textAction, pressed && { opacity: 0.6 }, rightAction.disabled && { opacity: 0.4 }]}
          >
            <Text style={styles.rightLabel} numberOfLines={1}>{rightAction.label}</Text>
          </Pressable>
        )
      ) : (
        <View style={styles.side} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    minHeight: 56,
  },
  side: { width: touchTarget, height: touchTarget },
  titleWrap: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xs },
  title: { ...typography.h2, fontSize: 17, color: '#fff' },
  subtitle: { ...typography.caption, color: colors.onNavy, marginTop: 1 },
  textAction: { minWidth: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, maxWidth: 110 },
  rightLabel: { ...typography.caption, fontFamily: typography.h3.fontFamily, color: '#fff' },
});
