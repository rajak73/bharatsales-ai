import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthService } from '@bharatsales/api-client';
import { KeyRound, Mail, MailCheck } from 'lucide-react';
import { Alert, Button, Input, buttonClassName } from '@bharatsales/ui';
import { AuthLayout, ResultState } from '../_public/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      await AuthService.forgotPassword(email);
      setSuccessMessage('If an account exists for that email, a reset link has been sent.');
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const backToSignIn = (
    <p>
      Remember your password?{' '}
      <Link to="/login" className="font-medium text-primary-700 hover:underline">
        Sign in
      </Link>
    </p>
  );

  if (successMessage) {
    return (
      <AuthLayout footer={backToSignIn}>
        <ResultState
          tone="success"
          icon={<MailCheck />}
          title="Check your email"
          actions={
            <>
              <Button variant="outline" onClick={() => setSuccessMessage('')}>
                Use a different email
              </Button>
              <Link to="/login" className={buttonClassName()}>
                Back to sign in
              </Link>
            </>
          }
        >
          <p>{successMessage}</p>
          <p className="mt-2">
            Emails can take a few minutes to arrive. Check your spam folder too.
          </p>
        </ResultState>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={<KeyRound />}
      title="Reset your password"
      description="Enter your account email and we'll send you a link to set a new password."
      footer={backToSignIn}
    >
      {errorMessage && (
        <Alert tone="danger" className="mb-4" onDismiss={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          required
          leftIcon={<Mail />}
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" size="lg" fullWidth loading={loading} disabled={!email}>
          {loading ? 'Sending link…' : 'Send reset link'}
        </Button>
      </form>
    </AuthLayout>
  );
}
