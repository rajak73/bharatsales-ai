import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/tokens';

interface KPICardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBackground?: string;
  value: string | number;
  label: string;
  onPress?: () => void;
}

// Standardizes the stat-card pattern both Home dashboards were already
// building ad hoc (icon + big value + label, in a 2-column grid).
export function KPICard({ icon, iconColor = colors.primary, iconBackground = colors.primaryLight, value, label, onPress }: KPICardProps) {
  const content = (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{value}</Text>
      <Text style={styles.label} numberOfLines={2}>{label}</Text>
    </View>
  );

  if (!onPress) return <View style={styles.cell}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cell, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // The flex-basis lives on the outer cell (the direct child of the
  // parent's wrapping row) so pressable and static cards size identically.
  cell: { flexBasis: '47%', flexGrow: 1 },
  card: {
    flex: 1,
    minHeight: 100,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs + 2,
  },
  iconWrap: { width: 34, height: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  value: { ...typography.display, fontSize: 22, lineHeight: 26, color: colors.text },
  label: { ...typography.caption, color: colors.textMuted },
});
