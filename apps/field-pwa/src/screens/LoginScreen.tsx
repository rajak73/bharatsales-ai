import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, User, Lock, Eye, EyeOff } from 'lucide-react';

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setError('');
      await login({ email, password });
    } catch (err: any) {
      console.error('Login failed', err);
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden font-sans">
      
      {/* Decorative Light Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        {/* Simplified representation of the map/chart background pattern */}
        <div className="absolute top-20 left-[-20%] w-[140%] h-[140%] bg-gradient-to-br from-blue-50 via-slate-100 to-indigo-50 opacity-60"></div>
        <div className="absolute top-1/4 left-10 w-20 h-20 bg-blue-100 rounded-full blur-2xl opacity-50"></div>
        <div className="absolute bottom-1/4 right-10 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="w-full max-w-sm px-6 relative z-10">
        
        {/* Logo and Welcome Text */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-[#2D3A8C] rounded-xl flex items-center justify-center shadow-md">
              {/* Approximating the B with chart arrow logo */}
              <div className="text-white font-bold text-2xl italic tracking-tighter flex">
                <span className="relative">
                  B
                  <div className="absolute -top-1 -right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400 transform -rotate-45"></div>
                </span>
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#1E293B] tracking-tight">BharatSales AI</h1>
          <p className="text-[#64748B] text-xs font-medium tracking-wide uppercase mt-1 mb-6">Smart. Efficient. Sales.</p>
          
          <h2 className="text-xl font-bold text-[#1E293B]">Welcome back!</h2>
          <p className="text-[#64748B] text-sm mt-1">Sign in to continue to your dashboard.</p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm text-center font-medium">
              {error}
            </div>
          )}
          
          {/* Email / Username Field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="w-5 h-5 text-gray-400" />
            </div>
            <div className="block w-full rounded-2xl border border-gray-200 bg-white pt-6 pb-2 px-12 focus-within:border-[#2D3A8C] focus-within:ring-1 focus-within:ring-[#2D3A8C] transition-colors relative">
              <label className="absolute top-2 left-12 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                Username / Mobile No.
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-gray-900 outline-none"
                placeholder="example@field.com or +91 9876543210"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
            <div className="block w-full rounded-2xl border border-gray-200 bg-white pt-6 pb-2 px-12 focus-within:border-[#2D3A8C] focus-within:ring-1 focus-within:ring-[#2D3A8C] transition-colors relative">
              <label className="absolute top-2 left-12 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                Password
              </label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-none p-0 pr-8 focus:ring-0 text-sm text-gray-900 outline-none"
                placeholder="••••••••"
              />
            </div>
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-4 flex items-center z-10"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 text-gray-400" />
              ) : (
                <Eye className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>

          <div className="flex justify-end pt-1">
            <a href="#" onClick={(e) => { e.preventDefault(); setError('Please contact your Organization Administrator to reset your password.'); }} className="text-sm font-semibold text-[#2D3A8C] hover:text-[#1e2761]">
              Forgot Password?
            </a>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full flex justify-center items-center rounded-2xl bg-[#2D3A8C] px-4 py-4 text-sm font-bold text-white shadow-md hover:bg-[#1e2761] focus:outline-none focus:ring-2 focus:ring-[#2D3A8C] focus:ring-offset-2 disabled:opacity-70 transition-all"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'LOG IN'
              )}
            </button>
          </div>
          
          <div className="flex items-center justify-center pt-2 pb-4">
            <input
              id="keep-logged-in"
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded bg-white border-gray-300 text-[#2D3A8C] focus:ring-[#2D3A8C]"
            />
            <label htmlFor="keep-logged-in" className="ml-2 text-sm text-[#1E293B] font-medium">
              Keep me logged in
            </label>
          </div>
        </form>

        <div className="text-center space-y-4 pt-6 mt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            For access, please contact your Organization Administrator to receive your login credentials.
          </p>
          <div className="text-xs text-gray-400 font-medium flex items-center justify-center gap-2">
            <a href="#" className="hover:text-gray-600">Terms of Service</a>
            <span>|</span>
            <a href="#" className="hover:text-gray-600">Privacy Policy</a>
          </div>
        </div>
        
      </div>
    </div>
  );
}

