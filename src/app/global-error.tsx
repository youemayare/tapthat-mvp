'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError Boundary]', error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6 font-sans antialiased">
        <div className="w-full max-w-md p-8 rounded-2xl bg-[#12121a] border border-white/10 shadow-xl text-center space-y-6">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
              TAYZ
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Something went wrong
            </h1>
            <p className="text-sm text-white/60">
              A temporary error occurred. Please reload to continue.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => reset()}
              className="h-10 px-5 rounded-xl bg-[#0071e3] hover:bg-[#005bb8] text-white text-sm font-medium transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
