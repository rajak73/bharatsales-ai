import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Lock } from 'lucide-react';
import { Alert, Button, buttonClassName } from '@bharatsales/ui';
import { AuthLayout, PasswordChecklist, PasswordInput, ResultState } from '../_public/auth';

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

  if (reset) {
    return (
      <AuthLayout>
        <ResultState
          tone="success"
          icon={<CheckCircle2 />}
          title="Password changed"
          actions={
            <Link to="/login" className={buttonClassName()}>
              Go to sign in
            </Link>
          }
        >
          Your password has been changed. Sign in again with your new password.
        </ResultState>
      </AuthLayout>
    );
  }

  const mismatch = formData.confirmPassword.length > 0 && formData.newPassword !== formData.confirmPassword;

  return (
    <AuthLayout
      icon={<Lock />}
      title="Change your password"
      description="Your password has expired or must be changed before you continue."
    >
      <Alert tone="warning" className="mb-4">
        For security, you must set a new password before continuing.
      </Alert>

      <form onSubmit={handleReset} className="space-y-3">
        <PasswordInput
          label="Current password"
          required
          autoComplete="current-password"
          autoFocus
          placeholder="Enter your current password"
          value={formData.currentPassword}
          onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
        />
        <div className="space-y-2">
          <PasswordInput
            label="New password"
            required
            autoComplete="new-password"
            placeholder="Enter a new password"
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
          />
          <PasswordChecklist
            rules={[
              { label: 'At least 8 characters', met: formData.newPassword.length >= 8 },
              { label: 'One uppercase letter', met: /[A-Z]/.test(formData.newPassword) },
              { label: 'One number', met: /[0-9]/.test(formData.newPassword) },
            ]}
          />
        </div>
        <PasswordInput
          label="Confirm new password"
          required
          autoComplete="new-password"
          placeholder="Re-enter the new password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          error={mismatch ? 'Passwords do not match.' : undefined}
        />
        <Button type="submit" size="lg" fullWidth loading={loading}>
          {loading ? 'Updating password…' : 'Change password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
