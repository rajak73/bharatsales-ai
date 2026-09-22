import { KeyboardAvoidingView, Platform, StyleSheet, ViewStyle, StyleProp } from 'react-native';

// Wraps a form screen's body (scroll view + bottom action bar) so the
// focused field and the submit button stay above the software keyboard.
// Same behaviour the login screen already shipped with: iOS pads, Android
// relies on the window resizing.
export function KeyboardAware({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <KeyboardAvoidingView style={[styles.flex, style]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
