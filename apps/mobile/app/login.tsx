import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import { useAuth } from '../src/lib/useAuth';
import { useSessionStore } from '../src/store/sessionStore';
import { colors, radius, spacing, typography, touchTarget } from '../src/theme/tokens';
import { Button, Banner, TextField, IconButton } from '../src/components/ui';
import { AuthService } from '@bharatsales/api-client';
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

const forgotSchema = z.object({
  email: z.string().email('Enter a valid email'),
});
type ForgotForm = z.infer<typeof forgotSchema>;

export default function LoginScreen() {
  const { login } = useAuth();
  const sessionUser = useSessionStore((s) => s.user);
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [forgotMessage, setForgotMessage] = useState('');
  const [slowHint, setSlowHint] = useState(false);
  const [showManualContinue, setShowManualContinue] = useState(false);

  // The backend can be cold-starting (Render free tier spins down after
  // idle) and take 30-60s+ to respond to the first request — without this,
  // that delay just looks like the app is frozen with no feedback.
  useEffect(() => {
    if (!submitting) return;
    const timer = setTimeout(() => setSlowHint(true), 5000);
    return () => clearTimeout(timer);
  }, [submitting]);

  // Navigate off of this screen's own subscription to the session store,
  // instead of firing router.replace() immediately after `login()`
  // resolves. Both ultimately land on a route that reads the same store
  // (app/index.tsx or (rep)/_layout.tsx), so imperatively navigating right
  // after the await bet on that store update having already propagated —
  // reacting to this component's own re-render once `sessionUser` actually
  // changes removes that assumption entirely; it's structurally impossible
  // to fire before the store reflects the logged-in user.
  useEffect(() => {
    if (sessionUser && (sessionUser.role === 'Sales Representative' || sessionUser.role === 'Distributor')) {
      router.replace(sessionUser.role === 'Distributor' ? '/(distributor)' : '/(rep)');
      // If that replace() actually navigates away, this screen unmounts and
      // the timer below never fires. If something is still keeping the app
      // on this screen 2s after the session was confirmed logged in, this
      // is a guaranteed manual way in rather than leaving no path forward.
      const fallbackTimer = setTimeout(() => setShowManualContinue(true), 2000);
      return () => clearTimeout(fallbackTimer);
    }
  }, [sessionUser]);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const forgotForm = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: LoginForm) => {
    setServerError('');
    setSlowHint(false);
    setSubmitting(true);
    try {
      // Navigation itself happens in the useEffect above, reacting to
      // sessionUser once login() has actually updated the store — see its
      // comment for why that's deliberately not done here.
      await login(values);
    } catch (err: any) {
      if (err?.code === 'ECONNABORTED' || /timeout/i.test(err?.message || '')) {
        setServerError('The server took too long to respond. It may be waking up from idle — please try again in a moment.');
      } else if (err?.message === 'Network Error') {
        setServerError('Could not reach the server. Check your internet connection and try again.');
      } else {
        setServerError(err?.response?.data?.message || err?.message || 'Invalid email or password. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onForgotSubmit = async (values: ForgotForm) => {
    setServerError('');
    setForgotMessage('');
    setSubmitting(true);
    try {
      await AuthService.forgotPassword(values.email);
      setForgotMessage('If an account exists for that email, a reset link has been sent. Open it on your phone or computer to set a new password.');
    } catch (err: any) {
      setServerError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === 'forgot') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <BrandArea />
          <View style={styles.card}>
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.subtitle}>Enter your account email and we&apos;ll send you a reset link.</Text>

            {serverError ? <Banner tone="danger" message={serverError} style={styles.banner} /> : null}
            {forgotMessage ? <Banner tone="success" message={forgotMessage} style={styles.banner} /> : null}

            <Controller
              control={forgotForm.control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Email"
                  icon="mail-outline"
                  placeholder="you@company.com"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  keyboardType="email-address"
                  returnKeyType="send"
                  onSubmitEditing={forgotForm.handleSubmit(onForgotSubmit)}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={forgotForm.formState.errors.email?.message}
                />
              )}
            />

            <Button
              label="Send Reset Link"
              onPress={forgotForm.handleSubmit(onForgotSubmit)}
              loading={submitting}
              style={{ marginTop: spacing.lg }}
            />

            <Pressable
              onPress={() => { setMode('login'); setServerError(''); setForgotMessage(''); }}
              style={({ pressed }) => [styles.linkButton, { alignSelf: 'center', marginTop: spacing.md }, pressed && { opacity: 0.6 }]}
              accessibilityRole="button"
            >
              <Text style={styles.linkText}>Back to Sign In</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <BrandArea />
        <View style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue to your field dashboard</Text>

          {serverError ? <Banner tone="danger" message={serverError} style={styles.banner} /> : null}

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Email"
                icon="mail-outline"
                placeholder="you@company.com"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="username"
                keyboardType="email-address"
                returnKeyType="next"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Password"
                icon="lock-closed-outline"
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleSubmit(onSubmit)}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
                containerStyle={{ marginTop: spacing.md }}
                right={
                  <IconButton
                    icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    onPress={() => setShowPassword((v) => !v)}
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    style={{ marginRight: -spacing.sm }}
                  />
                }
              />
            )}
          />

          <Pressable
            onPress={() => { setMode('forgot'); setServerError(''); }}
            style={({ pressed }) => [styles.linkButton, { alignSelf: 'flex-end' }, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
          >
            <Text style={styles.linkText}>Forgot Password?</Text>
          </Pressable>

          <Button label="Log In" onPress={handleSubmit(onSubmit)} loading={submitting} style={{ marginTop: spacing.sm }} />
          {submitting && slowHint && (
            <Text style={styles.slowHintText}>
              Still working — the server may be waking up after being idle. This can take up to a minute.
            </Text>
          )}
          {showManualContinue && sessionUser && (
            <Button
              label="Continue to Dashboard"
              variant="secondary"
              onPress={() => router.replace(sessionUser.role === 'Distributor' ? '/(distributor)' : '/(rep)')}
              style={{ marginTop: spacing.md }}
            />
          )}

          <Text style={styles.footnote}>For Sales Representatives and Distributors only.</Text>
          <Text style={styles.versionText}>
            v{Constants.expoConfig?.version}{Constants.expoConfig?.android?.versionCode ? ` (${Constants.expoConfig.android.versionCode})` : ''}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Navy top brand band with the saffron "BS" mark — the same identity as
// the web app's sidebar/hero. Purely presentational.
function BrandArea() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.brandArea, { paddingTop: insets.top + spacing.xxl }]}>
      <StatusBar style="light" />
      <View style={styles.logoWrap}>
        <Text style={styles.logoText}>BS</Text>
      </View>
      <Text style={styles.brand}>BharatSales AI</Text>
      <Text style={styles.brandTagline}>Field sales, simplified</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, alignItems: 'center', paddingBottom: spacing.xl },
  brandArea: {
    width: '100%', backgroundColor: colors.navy, alignItems: 'center',
    paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl,
  },
  card: { width: '100%', maxWidth: 400, paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  logoWrap: {
    width: 56, height: 56, borderRadius: radius.lg, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  logoText: { ...typography.h1, fontFamily: typography.display.fontFamily, color: colors.navy, letterSpacing: 0.5 },
  brand: { ...typography.h2, color: '#fff', textAlign: 'center' },
  brandTagline: { ...typography.caption, color: colors.onNavy, textAlign: 'center', marginTop: 2 },
  title: { ...typography.h1, color: colors.text, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.xl },
  banner: { marginBottom: spacing.lg },
  linkButton: { minHeight: touchTarget, justifyContent: 'center', paddingHorizontal: spacing.xs },
  linkText: { ...typography.bodyMedium, fontFamily: typography.h3.fontFamily, color: colors.primary, textAlign: 'center' },
  footnote: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  versionText: { ...typography.tiny, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs, opacity: 0.7 },
  slowHintText: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, fontStyle: 'italic' },
});
