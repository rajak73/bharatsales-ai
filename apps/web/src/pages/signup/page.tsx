import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthService } from '@bharatsales/api-client';
import { ArrowRight, Building2, CheckCircle2 } from 'lucide-react';
import { Alert, Button, Input, Skeleton, buttonClassName } from '@bharatsales/ui';
import { AuthLayout, PasswordChecklist, PasswordInput, ResultState } from '../_public/auth';

export default function SignupPage() {
  const [companyName, setCompanyName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4" aria-busy="true">
        <Skeleton className="h-[32rem] w-full max-w-lg rounded-xl" />
      </div>
    );
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await AuthService.register({ companyName, firstName, lastName, email, password });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthLayout width="lg">
        <ResultState
          tone="success"
          icon={<CheckCircle2 />}
          title="Registration submitted"
          actions={
            <Link to="/login" className={buttonClassName()}>
              Back to sign in
            </Link>
          }
        >
          <p>
            <span className="font-medium text-gray-900">{companyName}</span> is waiting for approval from a platform administrator.
            You can sign in once it&apos;s approved.
          </p>
        </ResultState>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      width="lg"
      icon={<Building2 />}
      title="Create your organisation"
      description="Set up your workspace in minutes. A platform administrator reviews every new organisation before it goes live."
      footer={
        <p>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-700 hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      {error && (
        <Alert tone="danger" title="Couldn't create your account" className="mb-4" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSignup} className="space-y-3">
        <Input
          label="Company name"
          required
          autoComplete="organization"
          autoFocus
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Sharma Distributors Pvt Ltd"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="First name"
            required
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Priya"
          />
          <Input
            label="Last name"
            required
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Sharma"
          />
        </div>

        <Input
          label="Work email"
          type="email"
          inputMode="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          helperText="You'll use this to sign in as the organisation admin."
        />

        <div className="space-y-2">
          <PasswordInput
            label="Password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
          <PasswordChecklist rules={[{ label: 'At least 8 characters', met: password.length >= 8 }]} />
        </div>

        <Button type="submit" size="lg" fullWidth loading={loading} rightIcon={<ArrowRight />} className="mt-2">
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
