import { Suspense, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthService } from '@bharatsales/api-client';
import { CheckCircle2, Mail, XCircle } from 'lucide-react';
import { Spinner, buttonClassName } from '@bharatsales/ui';
import { AuthLayout, ResultState } from '../_public/auth';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('No verification token found in the link. Please open the link exactly as it was sent to you.');
      return;
    }

    AuthService.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err: any) => {
        setStatus('error');
        setError(err?.response?.data?.message || 'This verification link is invalid or has expired.');
      });
  }, [token]);

  return (
    <AuthLayout>
      <div aria-live="polite">
        {status === 'verifying' && (
          <ResultState tone="progress" icon={<Spinner size="lg" label={null} />} title="Verifying your email…">
            This will only take a moment.
          </ResultState>
        )}

        {status === 'success' && (
          <ResultState
            tone="success"
            icon={<CheckCircle2 />}
            title="Email verified"
            actions={
              <Link to="/login" className={buttonClassName()}>
                Go to sign in
              </Link>
            }
          >
            Your email has been verified. You can sign in once your organisation is approved.
          </ResultState>
        )}

        {status === 'error' && (
          <ResultState
            tone="danger"
            icon={<XCircle />}
            title="We couldn't verify your email"
            actions={
              <>
                <a href="mailto:support@bharatsales.com" className={buttonClassName({ variant: 'outline' })}>
                  <Mail aria-hidden="true" /> Contact support
                </a>
                <Link to="/login" className={buttonClassName()}>
                  Back to sign in
                </Link>
              </>
            }
          >
            {error}
          </ResultState>
        )}
      </div>
    </AuthLayout>
  );
}
