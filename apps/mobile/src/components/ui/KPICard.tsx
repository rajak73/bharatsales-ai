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
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );

  if (!onPress) return content;
  return <Pressable onPress={onPress}>{content}</Pressable>;
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  iconWrap: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  value: { ...typography.display, fontSize: 24, lineHeight: 28, color: colors.text },
  label: { ...typography.caption, color: colors.textMuted },
});
