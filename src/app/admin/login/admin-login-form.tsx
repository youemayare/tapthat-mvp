'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { adminLoginStepOneAction, adminLoginStepTwoAction } from '../actions';
import { ShieldCheck, KeyRound, Mail, ArrowRight, RefreshCw, ArrowLeft, Shield } from 'lucide-react';

export function AdminLoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail] = useState('admin@tayz.app');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const handleStepOneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    startTransition(async () => {
      const res = await adminLoginStepOneAction(null, formData);
      if (res.success && res.email) {
        setEmail(res.email);
        setStep('otp');
        setSuccessInfo('Security code generated. Check your console or enter your master PIN.');
      } else {
        setErrorMessage(res.error || 'Failed to authenticate admin.');
      }
    });
  };

  const handleStepTwoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('otp', otp);

    startTransition(async () => {
      const res = await adminLoginStepTwoAction(null, formData);
      if (res.success) {
        router.push('/admin/inventory');
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Verification code invalid or expired.');
      }
    });
  };

  const handleResendOtp = async () => {
    setErrorMessage(null);
    setSuccessInfo(null);
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    startTransition(async () => {
      const res = await adminLoginStepOneAction(null, formData);
      if (res.success) {
        setSuccessInfo('A fresh 6-digit code was generated.');
      } else {
        setErrorMessage(res.error || 'Failed to resend code.');
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-card border border-border shadow-xl backdrop-blur-xl text-foreground">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Tayz Hardware Ops</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {step === 'credentials' ? 'Two-Factor Protected Portal' : 'Security Code Verification'}
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {successInfo && (
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
          <span>✅</span>
          <span>{successInfo}</span>
        </div>
      )}

      {step === 'credentials' ? (
        <form onSubmit={handleStepOneSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tayz.app"
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground">
              Master Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 h-11 px-4 rounded-xl font-medium text-sm text-white bg-[#0071e3] hover:bg-[#005bb8] transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Continue to Verification</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleStepTwoSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-foreground">
                6-Digit Security Code
              </label>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isPending}
                className="text-xs text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Resend code
              </button>
            </div>
            <input
              type="text"
              required
              autoFocus
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="729401"
              className="w-full h-13 text-center tracking-[0.5em] text-2xl font-mono font-bold px-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Enter the code from console or master PIN <strong className="text-foreground font-mono">729401</strong>
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending || otp.length !== 6}
            className="w-full h-11 px-4 rounded-xl font-medium text-sm text-white bg-[#0071e3] hover:bg-[#005bb8] transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Unlock Portal</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStep('credentials')}
            className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Use different credentials</span>
          </button>
        </form>
      )}
    </div>
  );
}
