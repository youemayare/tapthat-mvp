'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Zap, ArrowRight } from 'lucide-react';

interface Props {
  uid: string;
}

/**
 * "Claim your card" page — shown when a tapped card has no owner yet.
 * Sends the user to signup with the card UID pre-filled as a query param
 * so the claim can be completed after account creation.
 */
export function ClaimCard({ uid }: Props) {
  // Log the tap even for unclaimed cards (analytics insight: how many taps before claim)
  useEffect(() => {
    fetch('/api/tap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, type: 'unclaimed' }),
    }).catch(() => {}); // fire-and-forget, never block UI
  }, [uid]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-600/15 blur-[120px]" />
      </div>

      <div className="relative z-10 text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-8">
          <Zap className="w-9 h-9 text-brand-400" />
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-3">
          This card is unclaimed
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-2">
          This TapThat card hasn&apos;t been set up yet.
        </p>
        <p className="text-muted-foreground text-sm mb-10 font-mono bg-card text-card-foreground border border-border rounded-lg px-4 py-2 inline-block">
          Card ID: {uid}
        </p>

        <div className="space-y-3">
          <Link
            href={`/claim?uid=${uid}`}
            className="group w-full flex items-center justify-center gap-2 py-4 px-6 bg-brand-600 hover:bg-brand-500 text-foreground font-semibold rounded-2xl transition-all duration-200 hover:scale-[1.02]"
          >
            Claim this card
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <p className="text-zinc-600 text-xs mt-8">
          Powered by{' '}
          <Link href="/" className="text-muted-foreground hover:text-muted-foreground transition-colors">
            TapThat
          </Link>
        </p>
      </div>
    </main>
  );
}
