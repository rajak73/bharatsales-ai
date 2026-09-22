import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { Card } from './Card';

interface ListItemProps {
  title: string;
  subtitle?: string;
  meta?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBackground?: string;
  // Right-hand content (amount, status pill, action buttons).
  trailing?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

// Standard list row card (icon tile + title/subtitle + trailing) shared by
// outlets, orders, notifications, reports, menu items etc. When `onPress` is
// set the entire row is the touch target, so rows are always >= 64dp tall.
export function ListItem({
  title, subtitle, meta, icon, iconColor = colors.primary, iconBackground = colors.primaryLight,
  trailing, showChevron, onPress, accessibilityLabel, style,
}: ListItemProps) {
  return (
    <Card
      padding="md"
      elevation="none"
      onPress={onPress}
      accessibilityLabel={accessibilityLabel || [title, subtitle, meta].filter(Boolean).join(', ')}
      style={[styles.row, style]}
    >
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: iconBackground }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
      ) : null}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        {meta ? <Text style={styles.meta} numberOfLines={1}>{meta}</Text> : null}
      </View>
      {trailing}
      {showChevron ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 64 },
  iconWrap: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0 },
  title: { ...typography.h3, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: 1 },
});
