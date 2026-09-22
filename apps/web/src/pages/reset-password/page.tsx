import { Suspense, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthService } from '@bharatsales/api-client';
import { CheckCircle2, KeyRound } from 'lucide-react';
import { Alert, Button, buttonClassName } from '@bharatsales/ui';
import { AuthLayout, PasswordChecklist, PasswordInput, ResultState } from '../_public/auth';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('This reset link is missing a token. Please use the link exactly as sent to you.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await AuthService.resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <ResultState
          tone="success"
          icon={<CheckCircle2 />}
          title="Password updated"
          actions={
            <Link to="/login" className={buttonClassName()}>
              Go to sign in
            </Link>
          }
        >
          You can now sign in with your new password.
        </ResultState>
      </AuthLayout>
    );
  }

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <AuthLayout
      icon={<KeyRound />}
      title="Set a new password"
      description="Choose a new password for your account."
      footer={
        <p>
          Remember your password?{' '}
          <Link to="/login" className="font-medium text-primary-700 hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      {!token && (
        <Alert
          tone="danger"
          title="This link is incomplete"
          className="mb-4"
          actions={
            <Link to="/forgot-password" className={buttonClassName({ variant: 'outline', size: 'sm' })}>
              Request a new link
            </Link>
          }
        >
          No reset token found in the link. Please open the link exactly as it was sent to you.
        </Alert>
      )}
      {error && (
        <Alert tone="danger" className="mb-4" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          <PasswordInput
            label="New password"
            autoComplete="new-password"
            autoFocus
            placeholder="At least 8 characters"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordChecklist rules={[{ label: 'At least 8 characters', met: password.length >= 8 }]} />
        </div>
        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          minLength={8}
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={mismatch ? 'Passwords do not match.' : undefined}
        />
        <Button type="submit" size="lg" fullWidth loading={loading} disabled={!token}>
          {loading ? 'Updating password…' : 'Reset password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
