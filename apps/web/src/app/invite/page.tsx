'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthService } from '@bharatsales/api-client';

const NavLink = Link as any;

export default function InviteAcceptancePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-saffron-700" />}>
      <InviteAcceptanceForm />
    </Suspense>
  );
}

function InviteAcceptanceForm() {
  const searchParams = useSearchParams();
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary-900 via-primary-800 to-saffron-700">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
            <span className="text-white font-bold text-2xl">BS</span>
          </div>
          <h1 className="text-2xl font-bold text-white">You&apos;re Invited!</h1>
          <p className="text-white/70 mt-2">Set a password to activate your BharatSales AI account.</p>
        </div>
        <div className="card">
          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {!token && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                  No invitation token found in the link. Please open the invitation link exactly as it was shared with you.
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Create a strong password"
                    minLength={8}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <p className="text-xs text-gray-400 mt-1">Min 8 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Confirm your password"
                    minLength={8}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
              <button type="submit" disabled={loading || !token} className="btn-primary w-full text-center disabled:opacity-50">
                {loading ? 'Activating Account...' : 'Set Password & Activate Account'}
              </button>
              <p className="text-center text-xs text-gray-400">By accepting, you agree to the Terms of Service and Privacy Policy</p>
            </form>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">✅</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome Aboard!</h2>
              <p className="text-gray-500 mb-6">Your account has been activated successfully.</p>
              <NavLink href="/login" className="btn-primary inline-block">Go to Login</NavLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
