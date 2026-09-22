import { forwardRef, useState } from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, touchTarget, typography } from '../../theme/tokens';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  right?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  required?: boolean;
}

// Standard labelled input: 48dp tall, visible focus ring, inline error text.
// Every form (login, payment, delivery, report issue, modals) uses this so
// fields look and behave identically.
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, icon, right, containerStyle, required, multiline, style, onFocus, onBlur, ...inputProps },
  ref
) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={containerStyle}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={{ color: colors.danger }}> *</Text> : null}
        </Text>
      ) : null}
      <View style={[styles.inputWrap, multiline && styles.inputWrapMultiline, { borderColor }, focused && styles.focused]}>
        {icon ? <Ionicons name={icon} size={18} color={focused ? colors.primary : colors.textMuted} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={inputProps.accessibilityLabel || label}
          accessibilityHint={error || hint}
          multiline={multiline}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          style={[styles.input, multiline && styles.inputMultiline, style]}
          {...inputProps}
        />
        {right}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: { ...typography.caption, fontFamily: typography.h3.fontFamily, color: colors.text, marginBottom: spacing.xs + 2 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: touchTarget + 2,
    backgroundColor: colors.card, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md,
  },
  inputWrapMultiline: { alignItems: 'flex-start', paddingVertical: spacing.sm },
  focused: { borderWidth: 1.5 },
  input: {
    flex: 1, ...typography.body, fontSize: 15, color: colors.text, paddingVertical: spacing.sm,
    // Web preview only: the wrapper already draws the focus ring, so drop
    // the browser's own outline on the inner <input>.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  inputMultiline: { minHeight: 96, textAlignVertical: 'top' },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.xs },
  hint: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
});
