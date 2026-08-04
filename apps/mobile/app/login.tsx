import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import { useAuth } from '../src/lib/useAuth';
import { colors, radius, spacing, typography } from '../src/theme/tokens';
import { Button } from '../src/components/ui';
import { AuthService } from '@bharatsales/api-client';
import Constants from 'expo-constants';

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
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [forgotMessage, setForgotMessage] = useState('');
  const [slowHint, setSlowHint] = useState(false);

  // The backend can be cold-starting (Render free tier spins down after
  // idle) and take 30-60s+ to respond to the first request — without this,
  // that delay just looks like the app is frozen with no feedback.
  useEffect(() => {
    if (!submitting) return;
    const timer = setTimeout(() => setSlowHint(true), 5000);
    return () => clearTimeout(timer);
  }, [submitting]);

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
      await login(values);
      // Route to root instead of directly to '/(rep)' or '/(distributor)' —
      // app/index.tsx already does this exact role-based redirect reliably
      // on cold start, so reusing it here avoids duplicating that branching
      // logic (and the risk of it drifting out of sync) in two places.
      router.replace('/');
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
          <View style={styles.card}>
            <View style={styles.logoWrap}>
              <Text style={styles.logoText}>B</Text>
            </View>
            <Text style={styles.brand}>BharatSales AI</Text>
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.subtitle}>Enter your account email and we&apos;ll send you a reset link.</Text>

            {serverError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{serverError}</Text>
              </View>
            ) : null}
            {forgotMessage ? (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.successText}>{forgotMessage}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Email</Text>
            <Controller
              control={forgotForm.control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrap}>
                  <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="you@company.com"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                </View>
              )}
            />
            {forgotForm.formState.errors.email && (
              <Text style={styles.fieldError}>{forgotForm.formState.errors.email.message}</Text>
            )}

            <Button
              label="Send Reset Link"
              onPress={forgotForm.handleSubmit(onForgotSubmit)}
              loading={submitting}
              style={{ marginTop: spacing.lg }}
            />

            <TouchableOpacity
              onPress={() => { setMode('login'); setServerError(''); setForgotMessage(''); }}
              style={{ marginTop: spacing.xl }}
            >
              <Text style={styles.linkText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoText}>B</Text>
          </View>
          <Text style={styles.brand}>BharatSales AI</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue to your field dashboard</Text>

          {serverError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{serverError}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="you@company.com"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              </View>
            )}
          />
          {errors.email && <Text style={styles.fieldError}>{errors.email.message}</Text>}

          <Text style={styles.label}>Password</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.password && <Text style={styles.fieldError}>{errors.password.message}</Text>}

          <TouchableOpacity onPress={() => { setMode('forgot'); setServerError(''); }} style={{ alignSelf: 'flex-end', marginTop: spacing.sm }}>
            <Text style={styles.linkText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button label="Log In" onPress={handleSubmit(onSubmit)} loading={submitting} style={{ marginTop: spacing.lg }} />
          {submitting && slowHint && (
            <Text style={styles.slowHintText}>
              Still working — the server may be waking up after being idle. This can take up to a minute.
            </Text>
          )}

          <Text style={styles.footnote}>For Sales Representatives and Distributors only.</Text>
          <Text style={styles.versionText}>
            v{Constants.expoConfig?.version} ({Constants.expoConfig?.android?.versionCode})
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  card: { width: '100%', maxWidth: 400 },
  logoWrap: {
    width: 64, height: 64, borderRadius: radius.xl, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: spacing.md,
  },
  logoText: { color: '#fff', fontSize: 28, fontWeight: '800', fontStyle: 'italic' },
  brand: { ...typography.caption, color: colors.primary, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  title: { ...typography.display, color: colors.text, textAlign: 'center', marginTop: spacing.sm },
  subtitle: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.xxl },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.dangerLight, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.lg },
  errorText: { ...typography.caption, color: colors.danger, flex: 1 },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.successLight, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.lg },
  successText: { ...typography.caption, color: colors.success, flex: 1 },
  linkText: { ...typography.caption, color: colors.primary, fontWeight: '600', textAlign: 'center' },
  label: { ...typography.caption, color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
  },
  inputIcon: {},
  input: { flex: 1, ...typography.body, color: colors.text, paddingVertical: spacing.xs },
  fieldError: { ...typography.caption, color: colors.danger, marginTop: spacing.xs, marginLeft: spacing.xs },
  footnote: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  versionText: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs, fontSize: 10, opacity: 0.6 },
  slowHintText: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, fontStyle: 'italic' },
});
