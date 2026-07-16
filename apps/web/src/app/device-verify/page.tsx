'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DeviceVerifyPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1) { const newOtp = [...otp]; newOtp[index] = value; setOtp(newOtp); }
  };

  const handleVerify = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setVerified(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary-900 via-primary-800 to-saffron-700"><div className="w-full max-w-md"><div className="text-center mb-8"><div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20"><span className="text-white font-bold text-2xl">📱</span></div><h1 className="text-2xl font-bold text-white">Device Verification</h1><p className="text-white/70 mt-2">Verify this device to continue</p></div><div className="card">{!verified ? (<div className="space-y-6"><div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4"><div className="flex items-center space-x-2"><span>⚠️</span><span className="text-sm text-yellow-800">New device detected. Enter the OTP sent to your registered mobile number.</span></div></div><div className="text-center"><p className="text-sm text-gray-500 mb-4">Enter 6-digit OTP sent to +91 ******4321</p><div className="flex justify-center space-x-3">{otp.map((digit, index) => (<input key={index} type="text" maxLength={1} value={digit} onChange={(e) => handleOtpChange(index, e.target.value)} className="w-12 h-14 text-center text-xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />))}</div></div><button onClick={handleVerify} disabled={loading} className="btn-primary w-full text-center disabled:opacity-50">{loading ? 'Verifying...' : 'Verify Device'}</button><div className="text-center"><button className="text-sm text-primary-600 font-medium">Resend OTP</button></div></div>) : (<div className="text-center py-8"><div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-4xl">✅</span></div><h2 className="text-xl font-bold text-gray-900 mb-2">Device Verified!</h2><p className="text-gray-500 mb-6">This device is now trusted.</p><Link href="/dashboard" className="btn-primary inline-block">Continue to Dashboard</Link></div>)}</div></div></div>
  );
}
