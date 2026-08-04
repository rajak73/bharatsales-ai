import { Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../theme/tokens';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Without this, an uncaught render error in a release build has no visible
// feedback at all — the screen just goes blank/frozen with nothing telling
// the user (or us, when they report it) what actually happened.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary] Uncaught render error', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error.message}</Text>
          <Text style={styles.hint}>Please close and reopen the app. If this keeps happening, tell your admin what this message says.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, backgroundColor: colors.bg },
  title: { ...typography.h3, color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
  message: {
    ...typography.body, color: colors.text, textAlign: 'center', marginBottom: spacing.lg,
    backgroundColor: colors.dangerLight, padding: spacing.md, borderRadius: radius.md,
  },
  hint: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
});
