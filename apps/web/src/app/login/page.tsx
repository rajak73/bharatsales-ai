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
  ArrowRight,
  Sparkles
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
      console.error('LOGIN ERROR:', err); 
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030914] flex items-center justify-center p-4 sm:p-8 font-sans relative overflow-hidden">
      
      {/* Animated Mesh/Orb Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/40 blur-[120px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/30 blur-[100px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDuration: '10s' }}></div>
      <div className="absolute top-[20%] right-[15%] w-[30%] h-[30%] rounded-full bg-purple-900/20 blur-[80px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDuration: '12s' }}></div>

      <div className="w-full max-w-[1200px] min-h-[800px] bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] flex overflow-hidden relative z-10 transition-all duration-500 hover:shadow-cyan-500/10 hover:border-white/20">
        
        {/* Left Side - Brand & Capabilities */}
        <div className="w-[45%] hidden lg:flex flex-col justify-between p-14 relative overflow-hidden text-white border-r border-white/5">
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-16 transform transition hover:scale-105 duration-300 origin-left">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-cyan-500/30 border border-white/20">
                B
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">BharatSales AI</h1>
                <p className="text-xs text-cyan-400 font-medium tracking-wide">SMARTER SALES. STRONGER BHARAT.</p>
              </div>
            </div>

            <h2 className="text-5xl font-extrabold leading-tight mb-4 tracking-tight">
              Empowering<br />Field Reps<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Every Day.</span>
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-cyan-400 to-transparent rounded-full mb-8"></div>
            
            <p className="text-gray-300 text-lg mb-12 max-w-md font-light leading-relaxed">
              Manage outlets, capture orders, track performance, and grow together with intelligent insights.
            </p>

            <div className="space-y-4">
              <h3 className="font-semibold text-white tracking-wide text-sm uppercase mb-4 opacity-80 flex items-center gap-2">
                {/* @ts-ignore */}
                <Sparkles size={16} className="text-cyan-400" /> Platform Capabilities
              </h3>
              
              {[
                { icon: Store, color: "text-cyan-400", title: "Outlet Management", desc: "Add, update & track activities" },
                { icon: ShoppingCart, color: "text-green-400", title: "Order Management", desc: "Create & track real-time status" },
                { icon: IndianRupee, color: "text-orange-400", title: "Collections", desc: "Record payments & manage ledgers" },
                { icon: TrendingUp, color: "text-purple-400", title: "Performance Tracking", desc: "Monitor targets & achieve more" },
                { icon: Brain, color: "text-pink-400", title: "Smart Insights", desc: "AI-powered strategic suggestions" }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all duration-300 cursor-default group border border-transparent hover:border-white/5">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-white/10 group-hover:scale-110 transition-all duration-300 shadow-inner">
                    {/* @ts-ignore */}
                    <item.icon size={22} className={item.color} />
                  </div>
                  <div className="pt-1">
                    <h4 className="font-semibold text-gray-100 group-hover:text-white transition-colors">{item.title}</h4>
                    <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-[55%] p-4 sm:p-12 relative flex flex-col items-center justify-center">
          
          <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-white/[0.03] backdrop-blur-md rounded-[2rem] p-10 shadow-2xl relative z-10 border border-white/10 relative overflow-hidden group">
              
              {/* Internal card subtle glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              <div className="absolute top-6 right-6 flex items-center gap-1 text-sm text-gray-400 font-medium hover:text-white transition-colors cursor-pointer bg-white/5 px-3 py-1 rounded-full border border-white/5">
                🌐 English <span className="text-[10px]">▼</span>
              </div>

              <div className="flex flex-col items-center mb-8 mt-4 relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center mb-6 shadow-lg border border-cyan-500/30">
                  {/* @ts-ignore */}
                  <Store size={36} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-gray-400 text-center font-light">Sign in to your intelligent workspace</p>
              </div>

              {error && (
                <div className="mb-6 bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl text-sm flex items-center gap-3 backdrop-blur-sm animate-in zoom-in-95 duration-200">
                  <span className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center text-xs shrink-0 font-bold">!</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400 group-focus-within:text-cyan-400 transition-colors">✉</span>
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm transition-all outline-none shadow-inner"
                      placeholder="admin@company.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-300">Password</label>
                    <a href="#" className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                      Forgot Password?
                    </a>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400 group-focus-within:text-cyan-400 transition-colors">🔓</span>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:bg-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm transition-all outline-none shadow-inner"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {/* @ts-ignore */}
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center group">
                    <div className="relative flex items-center justify-center w-5 h-5 rounded border border-white/20 bg-white/5 group-hover:border-cyan-400 transition-colors">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="absolute w-full h-full opacity-0 cursor-pointer peer"
                      />
                      <svg className="w-3 h-3 text-cyan-400 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <label htmlFor="remember-me" className="ml-3 block text-sm text-gray-300 cursor-pointer group-hover:text-white transition-colors">
                      Remember me
                    </label>
                  </div>
                  <a href="#" className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                    Use OTP Instead
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-4 px-4 border border-white/10 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.15)] text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A192F] focus:ring-cyan-500 disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Authenticating...
                    </div>
                  ) : (
                    <>
                      {/* @ts-ignore */}
                      Sign In to Workspace <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 relative z-10">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-[#0A192F]/50 backdrop-blur-sm text-gray-400 rounded-full border border-white/5">OR</span>
                  </div>
                </div>

                <div className="mt-8">
                  <button className="w-full flex justify-center items-center py-3.5 px-4 border border-white/10 rounded-xl shadow-sm text-sm font-medium text-white bg-white/5 hover:bg-white/10 focus:outline-none transition-all duration-300 hover:border-white/20">
                    {/* @ts-ignore */}
                    <ScanLine size={18} className="mr-2 text-cyan-400" />
                    Scan QR Code to Login
                  </button>
                </div>
              </div>
            </div>

            {/* Trusted Badge below the card */}
            <div className="mt-8 bg-white/5 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 border border-white/10 transition-all hover:bg-white/10">
              <div className="w-12 h-12 bg-black/20 rounded-full flex items-center justify-center shrink-0 border border-white/5">
                {/* @ts-ignore */}
                <ShieldCheck size={24} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Enterprise Secured</h4>
                <p className="text-xs text-gray-400 mt-1">End-to-end encrypted with multi-tenant isolation.</p>
              </div>
            </div>

            <div className="mt-8 text-center text-sm text-gray-500">
              Need help? <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">Contact Support</a>
              <div className="mt-2 text-[11px] opacity-40 font-mono">Build v2.1.0 • Env: STAGING</div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
