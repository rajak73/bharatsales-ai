import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Smartphone } from 'lucide-react';
import { Alert, Button, buttonClassName } from '@bharatsales/ui';
import { AuthLayout, ResultState } from '../_public/auth';

export default function DeviceVerifyPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1) { const newOtp = [...otp]; newOtp[index] = value; setOtp(newOtp); }
  };

  const handleVerify = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setVerified(true);
    setLoading(false);
  };

  // Keyboard/paste helpers for the 6 boxes (UI only).
  const onBoxChange = (index: number, raw: string) => {
    const value = raw.replace(/\D/g, '').slice(-1);
    handleOtpChange(index, value);
    if (value && index < otp.length - 1) inputsRef.current[index + 1]?.focus();
  };
  const onBoxKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputsRef.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < otp.length - 1) inputsRef.current[index + 1]?.focus();
  };
  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, otp.length);
    if (!digits) return;
    e.preventDefault();
    const next = otp.map((d, i) => digits[i] ?? d);
    setOtp(next);
    inputsRef.current[Math.min(digits.length, otp.length - 1)]?.focus();
  };

  const complete = otp.every((d) => d !== '');

  if (verified) {
    return (
      <AuthLayout>
        <ResultState
          tone="success"
          icon={<CheckCircle2 />}
          title="Device verified"
          actions={
            <Link to="/dashboard" className={buttonClassName()}>
              Continue to dashboard
            </Link>
          }
        >
          This device is now trusted.
        </ResultState>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={<Smartphone />} title="Verify this device" description="We don't recognise this device yet. Confirm it's you to continue.">
      <Alert tone="warning" className="mb-4">
        New device detected. Enter the OTP sent to your registered mobile number.
      </Alert>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (complete) handleVerify();
        }}
        className="space-y-4"
      >
        <fieldset>
          <legend className="mb-3 text-sm text-foreground-muted">
            Enter the 6-digit OTP sent to <span className="font-medium text-gray-900">+91 ******4321</span>
          </legend>
          <div className="flex justify-between gap-2 sm:justify-center sm:gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                pattern="[0-9]*"
                maxLength={1}
                autoFocus={index === 0}
                aria-label={`Digit ${index + 1} of 6`}
                value={digit}
                onChange={(e) => onBoxChange(index, e.target.value)}
                onKeyDown={(e) => onBoxKeyDown(index, e)}
                onPaste={onPaste}
                onFocus={(e) => e.target.select()}
                className="h-12 w-11 min-w-0 rounded-lg border border-border-strong bg-white text-center text-xl font-semibold tabular-nums text-gray-900 shadow-xs transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 sm:h-14 sm:w-12"
              />
            ))}
          </div>
        </fieldset>

        <Button type="submit" size="lg" fullWidth loading={loading} disabled={!complete}>
          {loading ? 'Verifying…' : 'Verify device'}
        </Button>
        <p className="text-center text-sm text-foreground-muted">
          Didn&apos;t get the code?{' '}
          <Button variant="link" className="font-medium">
            Resend OTP
          </Button>
        </p>
      </form>
    </AuthLayout>
  );
}
