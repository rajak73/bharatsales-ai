import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Store, ArrowRight } from 'lucide-react';

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md relative z-10">
        <div className="backdrop-blur-xl bg-white/10 p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/20">
          
          <div className="flex flex-col items-center mb-8">
            <div className="bg-gradient-to-tr from-blue-500 to-indigo-500 p-4 rounded-2xl shadow-lg mb-6 transform transition-transform hover:scale-105">
              <Store className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              BharatSales AI
            </h2>
            <p className="text-blue-200 mt-2 text-sm font-medium tracking-wide uppercase">
              Field Representative Portal
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm text-center font-medium backdrop-blur-md animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-blue-100 ml-1">
                Email address
              </label>
              <div className="relative group">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-white placeholder-blue-200/50 focus:bg-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-200 sm:text-sm"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between ml-1">
                <label htmlFor="password" className="block text-sm font-medium text-blue-100">
                  Password
                </label>
                <a href="#" className="text-xs font-medium text-blue-300 hover:text-white transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative group">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-white placeholder-blue-200/50 focus:bg-white/10 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all duration-200 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="group relative flex w-full justify-center items-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg hover:from-blue-400 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 overflow-hidden"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="ml-2 w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </>
                )}
              </button>
            </div>
          </form>
          
          <p className="mt-8 text-center text-xs text-blue-200/60">
            Secure login powered by BharatSales AI infrastructure
          </p>
        </div>
      </div>
    </div>
  );
}
