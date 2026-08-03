import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '../../theme/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  elevation?: 'sm' | 'md' | 'lg' | 'none';
  padding?: keyof typeof spacing | 0;
}

export function Card({ children, style, elevation = 'sm', padding = 'lg' }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        { padding: padding === 0 ? 0 : spacing[padding] },
        elevation !== 'none' && (shadow as any)[elevation],
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
