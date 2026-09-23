import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from '@bharatsales/api-client';
import { ArrowRight, Mail } from 'lucide-react';
import { Alert, Button, Checkbox, Input } from '@bharatsales/ui';
import { AuthLayout, PasswordInput } from '../_public/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      navigate('/dashboard');
    } catch (err: any) {
      console.error('LOGIN ERROR:', err);
      setError(err?.response?.data?.message || err?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in to BharatSales"
      description="Enter your work email and password to open your workspace."
      footer={
        <>
          <p>
            New organisation?{' '}
            <Link to="/signup" className="font-medium text-primary-700 hover:underline">
              Create an account
            </Link>
          </p>
          <p className="text-xs text-foreground-subtle">
            Need help?{' '}
            <Link to="/contact" className="font-medium text-primary-700 hover:underline">
              Contact us
            </Link>
          </p>
        </>
      }
    >
      {error && (
        <Alert tone="danger" title="Couldn't sign you in" className="mb-4" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleLogin} className="space-y-3">
        <Input
          label="Work email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          autoFocus
          leftIcon={<Mail />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
        />

        <div className="space-y-1.5">
          <PasswordInput
            label="Password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
          <div className="flex justify-end">
            <Link to="/forgot-password" className="rounded text-sm font-medium text-primary-700 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <Checkbox id="remember-me" label="Keep me signed in" />

        <Button type="submit" size="lg" fullWidth loading={loading} rightIcon={<ArrowRight />}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  );
}
