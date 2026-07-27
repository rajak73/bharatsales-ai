"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@bharatsales/api-client';
import { 
  Store as StoreBase, 
  ShoppingCart as ShoppingCartBase, 
  TrendingUp as TrendingUpBase, 
  ShieldCheck as ShieldCheckBase, 
  Eye as EyeBase, 
  EyeOff as EyeOffBase, 
  ArrowRight as ArrowRightBase,
  QrCode as QrCodeBase,
} from 'lucide-react';

const Store = StoreBase as any;
const ShoppingCart = ShoppingCartBase as any;
const TrendingUp = TrendingUpBase as any;
const ShieldCheck = ShieldCheckBase as any;
const Eye = EyeBase as any;
const EyeOff = EyeOffBase as any;
const ArrowRight = ArrowRightBase as any;
const QrCode = QrCodeBase as any;
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-white" />;

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
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('LOGIN ERROR:', err); 
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSSOLogin = (provider: string) => {
    alert(`${provider} login integration is pending.`);
  };

  return (
    <div suppressHydrationWarning className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* Left Side - Brand & Capabilities (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 bg-[#2D3A8C] flex-col justify-between p-16 text-white relative overflow-hidden">
        
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-bold text-2xl text-[#2D3A8C] shadow-md">
              BS
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">BharatSales</h1>
              <p className="text-xs text-blue-200 font-medium tracking-wide">ENTERPRISE PLATFORM</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-6">
            Intelligent Field Sales &<br />
            Distributor Management.
          </h2>
          
          <p className="text-blue-100 text-lg mb-12 max-w-md leading-relaxed">
            Unify your distribution network, automate orders, and empower field reps with real-time insights.
          </p>

          <div className="space-y-6">
            {[
              { icon: Store, title: "Outlet 360", desc: "Complete visibility into every retail point" },
              { icon: ShoppingCart, title: "B2B Ordering", desc: "Seamless order capture and fulfillment" },
              { icon: TrendingUp, title: "Beat Analytics", desc: "Optimize routes and track targets" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-blue-800/50 flex items-center justify-center shrink-0">
                  <item.icon size={20} className="text-blue-200" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{item.title}</h4>
                  <p className="text-sm text-blue-200 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="relative z-10 flex items-center gap-2 text-sm text-blue-300 font-medium">
          <ShieldCheck size={18} />
          End-to-End Enterprise Security
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 lg:p-24 bg-white relative">
        <div className="w-full max-w-md mx-auto">
          
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-[#2D3A8C] rounded-lg flex items-center justify-center font-bold text-xl text-white">
              BS
            </div>
            <h1 className="text-xl font-bold text-slate-900">BharatSales</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Sign In</h2>
            <p className="text-slate-500 text-sm">Enter your credentials to access your workspace.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-600">!</span>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-[#2D3A8C] focus:ring-1 focus:ring-[#2D3A8C] outline-none transition-all text-sm"
                placeholder="admin@company.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <a href="#" onClick={(e) => { e.preventDefault(); setError('Password reset instructions have been sent to your email.'); }} className="text-sm font-semibold text-[#2D3A8C] hover:text-blue-800">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-[#2D3A8C] focus:ring-1 focus:ring-[#2D3A8C] outline-none transition-all text-sm"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center mt-2 mb-6">
              <input
                id="remember-me"
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-[#2D3A8C] focus:ring-[#2D3A8C]"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">
                Keep me signed in
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#2D3A8C] hover:bg-[#1e2761] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2D3A8C] disabled:opacity-70 transition-all"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Authenticating...
                </div>
              ) : (
                <>
                  Sign In <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </button>
          </form>



          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">
              Need assistance? <a href="mailto:support@bharatsales.com" className="font-semibold text-[#2D3A8C] hover:underline">Contact Support</a>
            </p>
          </div>

        </div>
      </div>
      
    </div>
  );
}
