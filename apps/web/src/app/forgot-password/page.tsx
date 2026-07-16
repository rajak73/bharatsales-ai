'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSuccessMessage('Password reset link has been sent to your email!');
    setLoading(false);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50"><div className="w-full max-w-md"><div className="text-center mb-8"><Link href="/" className="inline-flex items-center space-x-2"><div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-saffron-500 rounded-xl flex items-center justify-center"><span className="text-white font-bold">BS</span></div><span className="text-xl font-bold text-gray-900">BharatSales AI</span></Link></div><div className="card"><h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2><p className="text-gray-500 mb-6 text-sm">Enter your email or mobile number and we&apos;ll send you a reset link.</p>
      {successMessage && (<div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg"><p className="text-sm text-green-600">{successMessage}</p></div>)}
      <form onSubmit={handleSubmit} className="space-y-5"><div><label className="block text-sm font-medium text-gray-700 mb-1">Email or Mobile</label><input type="text" className="input-field" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div><button type="submit" className="btn-primary w-full text-center disabled:opacity-50" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</button></form>
      <p className="mt-6 text-center text-sm text-gray-500">Remember your password?{' '}<Link href="/login" className="text-primary-600 font-semibold hover:text-primary-700">Sign In</Link></p></div></div></div>
  );
}
