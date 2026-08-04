'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthService } from '@bharatsales/api-client';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
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
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-saffron-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">BS</span>
            </div>
            <span className="text-xl font-bold text-gray-900">BharatSales AI</span>
          </Link>
        </div>

        <div className="card text-center py-4">
          {status === 'verifying' && (
            <>
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying your email...</h2>
              <p className="text-gray-500 text-sm">This will just take a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Email Verified</h2>
              <p className="text-gray-500 mb-6 text-sm">Your email has been verified. You can now sign in once your organization is approved.</p>
              <Link href="/login" className="btn-primary inline-block">Go to Login</Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✕</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h2>
              <p className="text-red-600 mb-6 text-sm">{error}</p>
              <Link href="/login" className="text-primary-600 font-semibold hover:text-primary-700">Back to Login</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
