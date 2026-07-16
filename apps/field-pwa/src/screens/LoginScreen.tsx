import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Store } from 'lucide-react';

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
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-600 flex flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm flex flex-col items-center">
        <div className="bg-white p-3 rounded-2xl mb-4 shadow-lg">
          <Store className="w-10 h-10 text-primary-600" />
        </div>
        <h2 className="mt-2 text-center text-3xl font-bold leading-9 tracking-tight text-white">
          BharatSales AI
        </h2>
        <p className="text-primary-100 mt-2 text-sm text-center">Field Representative Portal</p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6 bg-white p-8 rounded-2xl shadow-xl" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-xl border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
              Password
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="flex w-full justify-center items-center rounded-xl bg-primary-600 px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:bg-primary-300 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
