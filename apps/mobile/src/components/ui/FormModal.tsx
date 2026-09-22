import { Modal, View, Text, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { colors, radius, shadow, spacing, typography } from '../../theme/tokens';
import { Button } from './Button';

interface FormModalProps {
  visible: boolean;
  title: string;
  message?: string;
  children?: React.ReactNode;
  onCancel: () => void;
  confirmLabel: string;
  onConfirm: () => void;
  confirmVariant?: 'primary' | 'destructive';
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
}

// Small centred dialog with a form body + Cancel / Confirm — shared by
// "Request attendance fix" and "Reject order". Keyboard-safe, closes on
// Android back button and on tapping the dimmed backdrop.
export function FormModal({
  visible, title, message, children, onCancel, confirmLabel, onConfirm,
  confirmVariant = 'primary', confirmDisabled, confirmLoading,
}: FormModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityRole="button" accessibilityLabel="Close dialog" />
          <View style={[styles.card, shadow.lg]} accessibilityViewIsModal>
            <Text style={styles.title} accessibilityRole="header">{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
            {children ? <View style={styles.body}>{children}</View> : null}
            <View style={styles.actions}>
              <Button label="Cancel" variant="ghost" onPress={onCancel} fullWidth={false} style={styles.action} />
              <Button
                label={confirmLabel}
                variant={confirmVariant}
                onPress={onConfirm}
                disabled={confirmDisabled}
                loading={confirmLoading}
                fullWidth={false}
                style={styles.action}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, width: '100%', maxWidth: 440 },
  title: { ...typography.h2, color: colors.text },
  message: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs },
  body: { marginTop: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  action: { flex: 1, paddingHorizontal: spacing.md },
});
