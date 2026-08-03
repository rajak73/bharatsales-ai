'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthService } from '@bharatsales/api-client';

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50"><div className="w-full max-w-md"><div className="text-center mb-8"><Link href="/" className="inline-flex items-center space-x-2"><div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-saffron-500 rounded-xl flex items-center justify-center"><span className="text-white font-bold">BS</span></div><span className="text-xl font-bold text-gray-900">BharatSales AI</span></Link></div><div className="card"><h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2><p className="text-gray-500 mb-6 text-sm">Enter your account email and we&apos;ll send you a reset link.</p>
      {successMessage && (<div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg"><p className="text-sm text-green-600">{successMessage}</p></div>)}
      {errorMessage && (<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-600">{errorMessage}</p></div>)}
      <form onSubmit={handleSubmit} className="space-y-5"><div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" className="input-field" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div><button type="submit" className="btn-primary w-full text-center disabled:opacity-50" disabled={loading || !email}>{loading ? 'Sending...' : 'Send Reset Link'}</button></form>
      <p className="mt-6 text-center text-sm text-gray-500">Remember your password?{' '}<Link href="/login" className="text-primary-600 font-semibold hover:text-primary-700">Sign In</Link></p></div></div></div>
  );
}
