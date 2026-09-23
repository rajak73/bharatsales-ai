import { Suspense, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthService } from '@bharatsales/api-client';
import { CheckCircle2, UserPlus } from 'lucide-react';
import { Alert, Button, buttonClassName } from '@bharatsales/ui';
import { AuthLayout, PasswordChecklist, PasswordInput, ResultState } from '../_public/auth';

export default function InviteAcceptancePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <InviteAcceptanceForm />
    </Suspense>
  );
}

function InviteAcceptanceForm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('This invitation link is missing a token. Please use the link exactly as sent to you.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await AuthService.acceptInvitation(token, formData.password);
      setStep(2);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'This invitation link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <AuthLayout>
        <ResultState
          tone="success"
          icon={<CheckCircle2 />}
          title="Welcome aboard!"
          actions={
            <Link to="/login" className={buttonClassName()}>
              Go to sign in
            </Link>
          }
        >
          Your account is active. Sign in with your email and the password you just set.
        </ResultState>
      </AuthLayout>
    );
  }

  const mismatch = formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;

  return (
    <AuthLayout
      icon={<UserPlus />}
      title="You're invited to BharatSales"
      description="Set a password to activate your account."
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {!token && (
          <Alert tone="danger" title="This link is incomplete">
            No invitation token found in the link. Please open the invitation link exactly as it was shared with you.
          </Alert>
        )}
        {error && (
          <Alert tone="danger" onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}
        <div className="space-y-2">
          <PasswordInput
            label="Password"
            autoComplete="new-password"
            autoFocus
            placeholder="Create a strong password"
            minLength={8}
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <PasswordChecklist rules={[{ label: 'At least 8 characters', met: formData.password.length >= 8 }]} />
        </div>
        <PasswordInput
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          minLength={8}
          required
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          error={mismatch ? 'Passwords do not match.' : undefined}
        />
        <Button type="submit" size="lg" fullWidth loading={loading} disabled={!token}>
          {loading ? 'Activating account…' : 'Activate account'}
        </Button>
        <p className="text-center text-xs text-foreground-subtle">
          By activating, you agree to the{' '}
          <Link to="/terms" className="underline hover:text-gray-700">
            Terms of service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="underline hover:text-gray-700">
            Privacy policy
          </Link>
          .
        </p>
      </form>
    </AuthLayout>
  );
}
