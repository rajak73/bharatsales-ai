'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForcePasswordResetPage() {
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [reset, setReset] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setReset(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary-900 via-primary-800 to-saffron-700"><div className="w-full max-w-md"><div className="text-center mb-8"><div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20"><span className="text-white font-bold text-2xl">🔒</span></div><h1 className="text-2xl font-bold text-white">Password Reset Required</h1><p className="text-white/70 mt-2">Your password has expired or must be changed</p></div><div className="card">{!reset ? (<div className="space-y-6"><div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4"><div className="flex items-center space-x-2"><span>⚠️</span><span className="text-sm text-yellow-800">For security, you must reset your password before continuing.</span></div></div><form onSubmit={handleReset} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Current Password *</label><input type="password" className="input-field" placeholder="Enter current password" value={formData.currentPassword} onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })} /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label><input type="password" className="input-field" placeholder="Enter new password" value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} /><div className="mt-2 space-y-1"><div className="flex items-center space-x-2"><span className={`w-2 h-2 rounded-full ${formData.newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></span><span className="text-xs text-gray-500">At least 8 characters</span></div><div className="flex items-center space-x-2"><span className={`w-2 h-2 rounded-full ${/[A-Z]/.test(formData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></span><span className="text-xs text-gray-500">One uppercase letter</span></div><div className="flex items-center space-x-2"><span className={`w-2 h-2 rounded-full ${/[0-9]/.test(formData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></span><span className="text-xs text-gray-500">One number</span></div></div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password *</label><input type="password" className="input-field" placeholder="Confirm new password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />{formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (<p className="text-xs text-red-500 mt-1">Passwords do not match</p>)}</div><button type="submit" disabled={loading} className="btn-primary w-full text-center disabled:opacity-50">{loading ? 'Resetting...' : 'Reset Password'}</button></form></div>) : (<div className="text-center py-8"><div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-4xl">✅</span></div><h2 className="text-xl font-bold text-gray-900 mb-2">Password Reset Successful!</h2><p className="text-gray-500 mb-6">Your password has been changed.</p><Link href="/login" className="btn-primary inline-block">Go to Login</Link></div>)}</div></div></div>
  );
}
