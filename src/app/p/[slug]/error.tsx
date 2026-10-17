'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function PersistentProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[PersistentProfileError Boundary]', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 text-center">
      <div className="w-full max-w-sm p-8 rounded-2xl bg-card border border-border shadow-xl space-y-6">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Unable to Load Profile
          </h1>
          <p className="text-sm text-muted-foreground">
            A temporary network issue prevented this profile from loading. Tap below to try again.
          </p>
        </div>

        <button
          onClick={() => reset()}
          className="w-full h-11 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reload Profile</span>
        </button>
      </div>
    </main>
  );
}
