"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@bharatsales/api-client';
import { 
  Store, 
  ShoppingCart, 
  IndianRupee, 
  TrendingUp, 
  Brain, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  ScanLine, 
  ArrowRight 
} from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await AuthService.login({
        email,
        password,
        deviceInfo: navigator.userAgent
      });
      
      // Redirect on success
      router.push('/dashboard');
    } catch (err: any) {
      console.error('LOGIN ERROR:', err); setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A192F] flex items-center justify-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-[1200px] h-[800px] bg-[#0D2140] rounded-3xl shadow-2xl flex overflow-hidden relative">
        
        {/* Left Side - Brand & Capabilities */}
        <div className="w-[45%] hidden lg:flex flex-col justify-between p-12 relative overflow-hidden text-white">
          {/* Subtle gradient background effect */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#102B54] to-[#0A192F] opacity-90 z-0"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-16">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-2xl">
                B
              </div>
              <div>
                <h1 className="text-xl font-bold">BharatSales AI</h1>
                <p className="text-xs text-blue-300">Smarter Sales. Stronger Bharat.</p>
              </div>
            </div>

            <h2 className="text-5xl font-bold leading-tight mb-4">
              Empowering<br />Field Representatives<br />
              <span className="text-cyan-400">Every Day</span>
            </h2>
            <div className="w-12 h-1 bg-cyan-400 mb-6"></div>
            
            <p className="text-blue-200 text-lg mb-12 max-w-md">
              Manage outlets, capture orders, track performance, and grow together with BharatSales AI.
            </p>

            <div className="space-y-6">
              <h3 className="font-semibold text-white">Key Capabilities</h3>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#1A365D] flex items-center justify-center shrink-0">
                  {/* @ts-ignore */}
                  <Store size={20} className="text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Outlet Management</h4>
                  <p className="text-sm text-blue-200">Add, update & track outlet activities</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#1A365D] flex items-center justify-center shrink-0">
                  {/* @ts-ignore */}
                  <ShoppingCart size={20} className="text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Order Management</h4>
                  <p className="text-sm text-blue-200">Create orders & track real-time status</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#1A365D] flex items-center justify-center shrink-0">
                  {/* @ts-ignore */}
                  <IndianRupee size={20} className="text-orange-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Collections</h4>
                  <p className="text-sm text-blue-200">Record payments & manage collections</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#1A365D] flex items-center justify-center shrink-0">
                  {/* @ts-ignore */}
                  <TrendingUp size={20} className="text-purple-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Performance Tracking</h4>
                  <p className="text-sm text-blue-200">Monitor targets & achieve more</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#1A365D] flex items-center justify-center shrink-0">
                  {/* @ts-ignore */}
                  <Brain size={20} className="text-pink-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Smart Insights</h4>
                  <p className="text-sm text-blue-200">AI-powered insights & suggestions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-[55%] bg-[#0A192F] p-4 sm:p-12 relative flex flex-col items-center justify-center">
          
          <div className="w-full max-w-md">
            <div className="bg-white rounded-[2rem] p-10 shadow-2xl relative z-10">
              <div className="absolute top-6 right-6 flex items-center gap-1 text-sm text-gray-500 font-medium">
                🌐 English <span className="text-xs">▼</span>
              </div>

              <div className="flex flex-col items-center mb-8 mt-4">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-200">
                  {/* @ts-ignore */}
                  <Store size={40} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
                <p className="text-gray-500 text-center">Sign in to continue your journey</p>
              </div>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full border border-red-500 flex items-center justify-center text-xs">!</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400">✉</span>
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-shadow outline-none"
                      placeholder="admin@company.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                      Forgot Password?
                    </a>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400">🔓</span>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-11 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-shadow outline-none"
                      placeholder="••••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {/* @ts-ignore */}
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                      Remember me
                    </label>
                  </div>
                  <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    Use OTP Instead
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-all"
                >
                  {loading ? 'Signing in...' : (
                    <>
                      {/* @ts-ignore */}
                      Sign In <ArrowRight size={18} className="ml-2" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">OR</span>
                  </div>
                </div>

                <div className="mt-8">
                  <button className="w-full flex justify-center items-center py-3.5 px-4 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors">
                    {/* @ts-ignore */}
                    <ScanLine size={18} className="mr-2 text-indigo-600" />
                    Scan QR Code to Login
                  </button>
                </div>
              </div>
            </div>

            {/* Trusted Badge below the card */}
            <div className="mt-6 bg-[#102B54] rounded-2xl p-4 flex items-center gap-4 border border-[#1A365D]">
              <div className="w-12 h-12 bg-[#0A192F] rounded-full flex items-center justify-center shrink-0 border border-[#1A365D]">
                {/* @ts-ignore */}
                <ShieldCheck size={24} className="text-cyan-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Secure & Trusted</h4>
                <p className="text-xs text-blue-200 mt-1">Your data is protected with enterprise-grade security and encryption.</p>
              </div>
            </div>

            <div className="mt-8 text-center text-sm text-blue-300">
              Need help? <a href="#" className="text-cyan-400 hover:underline">Contact your manager</a>
              <div className="mt-1 text-xs opacity-50">v2.1.0</div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
