'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function NfcTapError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[NfcTapError Boundary]', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 text-center">
      <div className="w-full max-w-sm p-8 rounded-2xl bg-card border border-border shadow-xl space-y-6">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Connection Interrupted
          </h1>
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load this card right now due to a brief network hiccup. Tap below to reload.
          </p>
        </div>

        <button
          onClick={() => reset()}
          className="w-full h-11 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reload Card</span>
        </button>
      </div>
    </main>
  );
}
