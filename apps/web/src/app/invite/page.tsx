'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function InviteAcceptancePage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ fullName: '', password: '', confirmPassword: '', mobile: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setStep(2);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary-900 via-primary-800 to-saffron-700"><div className="w-full max-w-md"><div className="text-center mb-8"><div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20"><span className="text-white font-bold text-2xl">BS</span></div><h1 className="text-2xl font-bold text-white">You&apos;re Invited!</h1><p className="text-white/70 mt-2">Join BharatSales AI at Demo FMCG Company</p></div><div className="card">{step === 1 ? (<div className="space-y-6"><div className="bg-primary-50 rounded-xl p-4"><div className="flex items-center space-x-3"><div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center"><span className="text-primary-700 font-bold">RK</span></div><div><div className="text-sm font-medium text-gray-900">Rahul Kumar invited you</div><div className="text-xs text-gray-500">Role: Sales Representative • Zone A</div></div></div></div><div className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input type="text" className="input-field" placeholder="Enter your full name" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label><input type="tel" className="input-field" placeholder="+91 98765 43210" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Password *</label><input type="password" className="input-field" placeholder="Create a strong password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} /><p className="text-xs text-gray-400 mt-1">Min 8 characters, 1 uppercase, 1 number, 1 special character</p></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label><input type="password" className="input-field" placeholder="Confirm your password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} /></div></div><button onClick={handleSubmit} disabled={loading} className="btn-primary w-full text-center disabled:opacity-50">{loading ? 'Creating Account...' : 'Accept Invitation & Create Account'}</button><p className="text-center text-xs text-gray-400">By accepting, you agree to the Terms of Service and Privacy Policy</p></div>) : (<div className="text-center py-8"><div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-4xl">✅</span></div><h2 className="text-xl font-bold text-gray-900 mb-2">Welcome Aboard!</h2><p className="text-gray-500 mb-6">Your account has been created successfully.</p><Link href="/login" className="btn-primary inline-block">Go to Login</Link></div>)}</div></div></div>
  );
}
