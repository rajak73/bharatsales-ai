import { Pressable, Text, View, StyleSheet, ScrollView, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme/tokens';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: 'primary' | 'danger';
  count?: number;
  style?: StyleProp<ViewStyle>;
}

// Filter / toggle / single-choice pill. 40dp visual + hitSlop = 48dp target.
export function Chip({ label, selected, onPress, icon, tone = 'primary', count, style }: ChipProps) {
  const activeFg = tone === 'danger' ? colors.danger : colors.primary;
  const activeBg = tone === 'danger' ? colors.dangerLight : colors.primaryLight;
  const fg = selected ? activeFg : colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 4, bottom: 4 }}
      accessibilityRole="button"
      accessibilityLabel={count !== undefined ? `${label}, ${count}` : label}
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [
        styles.chip,
        selected && { backgroundColor: activeBg, borderColor: activeFg },
        pressed && { opacity: 0.75 },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={15} color={fg} /> : null}
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>{label}</Text>
      {count !== undefined ? (
        <View style={[styles.count, selected && { backgroundColor: activeFg }]}>
          <Text style={[styles.countText, selected && { color: '#fff' }]}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

// Horizontally scrollable row of chips — never wraps to a second line on
// narrow phones.
export function ChipRow({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, style]}
      keyboardShouldPersistTaps="handled"
      style={styles.rowScroll}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2, height: 40, paddingHorizontal: spacing.md + 2,
    borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  label: { ...typography.bodyMedium, fontFamily: typography.h3.fontFamily, fontSize: 13 },
  count: { minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, backgroundColor: colors.neutralLight, alignItems: 'center', justifyContent: 'center' },
  countText: { ...typography.tiny, color: colors.textSecondary },
  rowScroll: { flexGrow: 0 },
  row: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
});
