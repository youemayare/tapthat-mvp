'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Turnstile } from '@marsidev/react-turnstile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type FunnelState = 'idle' | 'submitting_join' | 'success_intro' | 'survey_active' | 'submitting_survey' | 'completed';

export function WaitlistFunnel() {
  const [state, setState] = useState<FunnelState>('idle');
  const [waitlistId, setWaitlistId] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const turnstileRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    profession: '',
    whatsappNumber: '',
    turnstileToken: '',
  });

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.turnstileToken) {
      toast.error('Please complete the captcha');
      return;
    }

    setState('submitting_join');
    
    try {
      const res = await fetch('/api/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          referredByCode: searchParams.get('ref') || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join');

      if (data.alreadyExists) {
        toast.success('You are already in the Tayz Founding Circle!');
      }

      setWaitlistId(data.waitlistId);
      setState('success_intro');
    } catch (err: any) {
      toast.error(err.message);
      setState('idle');
      turnstileRef.current?.reset();
    }
  };

  const handleSkipSurvey = async () => {
    if (!waitlistId) return;
    try {
      await fetch(`/api/waitlist/${waitlistId}/survey`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skipped: true }),
      });
    } catch (e) {
      // Background fail is fine
    }
    setState('completed');
  };

  if (state === 'idle' || state === 'submitting_join') {
    return (
      <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-zinc-950 border border-white/10 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-2">Reserve your access.</h2>
        <p className="text-zinc-400 mb-8 text-sm">
          Join the list to unlock the AED 299 founding price and help shape the first Tayz Metal Card collection.
        </p>

        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-zinc-300">First name</Label>
            <Input
              id="firstName"
              required
              className="bg-zinc-900 border-white/10 text-white"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">Email address</Label>
            <Input
              id="email"
              type="email"
              required
              className="bg-zinc-900 border-white/10 text-white"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profession" className="text-zinc-300">Profession / Role</Label>
            <select
              id="profession"
              required
              className="flex h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={formData.profession}
              onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
            >
              <option value="" disabled>Select your profession</option>
              <option value="Founder / Business owner">Founder / Business owner</option>
              <option value="Sales / Business development">Sales / Business development</option>
              <option value="Real estate">Real estate</option>
              <option value="Consultant / Freelancer">Consultant / Freelancer</option>
              <option value="Corporate professional">Corporate professional</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="pt-4">
            <Turnstile
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
              onSuccess={(token) => setFormData({ ...formData, turnstileToken: token })}
              options={{ theme: 'dark' }}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-brand-600 hover:bg-brand-500 text-white py-6 text-lg mt-4"
            disabled={state === 'submitting_join'}
          >
            {state === 'submitting_join' ? 'Reserving...' : 'Unlock AED 299 Access'}
          </Button>

          <p className="text-[11px] text-zinc-500 text-center mt-4">
            By joining, you agree to receive Tayz launch updates by email. You can unsubscribe anytime.
          </p>
        </form>
      </div>
    );
  }

  if (state === 'success_intro') {
    return (
      <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-zinc-950 border border-brand-500/30 shadow-2xl shadow-brand-500/10 text-center">
        <div className="w-16 h-16 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">You’re in the Tayz Founding Circle.</h2>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          Your AED 299 founding access is reserved. Help us shape the first Metal Card collection in under one minute.
        </p>

        <div className="space-y-3">
          <Button 
            onClick={() => setState('survey_active')}
            className="w-full bg-white text-black hover:bg-zinc-200 py-6 text-lg font-semibold"
          >
            Help shape the first cards
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleSkipSurvey}
            className="w-full text-zinc-400 hover:text-white"
          >
            Skip for now
          </Button>
        </div>
      </div>
    );
  }

  if (state === 'survey_active' || state === 'submitting_survey') {
    return <SurveyForm waitlistId={waitlistId!} onComplete={(code) => { setReferralCode(code); setState('completed'); }} />;
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-zinc-950 border border-white/10 shadow-2xl text-center">
      <h2 className="text-2xl font-bold text-white mb-4">Thank you!</h2>
      <p className="text-zinc-400 mb-8 leading-relaxed">
        You’re on the Founding Circle list and eligible for the AED 299 Metal Card launch price. Keep an eye on your inbox.
      </p>
      
      {referralCode && (
        <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 mb-6">
          <p className="text-xs text-zinc-500 mb-2 font-semibold uppercase tracking-wider">Your Invite Link</p>
          <code className="text-brand-400 text-sm">tapthat.vercel.app/founding-circle?ref={referralCode}</code>
        </div>
      )}

      <Button onClick={() => window.location.href = '/'} variant="outline" className="w-full border-white/10 text-white hover:bg-white/5">
        Return to Home
      </Button>
    </div>
  );
}

function SurveyForm({ waitlistId, onComplete }: { waitlistId: string, onComplete: (refCode: string) => void }) {
  const [color, setColor] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/waitlist/${waitlistId}/survey`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredCardColor: color }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onComplete(data.referralCode);
    } catch (err: any) {
      toast.error(err.message);
      setSubmitting(false);
    }
  };

  const colors = ['Matte Black', 'Gunmetal', 'Brushed Silver', 'Midnight Blue'];

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-zinc-950 border border-white/10 shadow-2xl">
      <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-6">Step 2 of 2 · 30 Seconds</div>
      <h2 className="text-xl font-bold text-white mb-6">Which Tayz Metal Card colour would you choose first?</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          {colors.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${
                color === c ? 'bg-brand-500/20 border-brand-500 text-white' : 'bg-zinc-900 border-white/5 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <Button 
          type="submit" 
          disabled={!color || submitting}
          className="w-full bg-white text-black hover:bg-zinc-200 py-6 text-lg font-semibold"
        >
          {submitting ? 'Saving...' : 'Finish'}
        </Button>
      </form>
    </div>
  );
}
