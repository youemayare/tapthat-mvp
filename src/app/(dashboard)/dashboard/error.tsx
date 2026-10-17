'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, LayoutDashboard } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[DashboardError Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md p-8 rounded-2xl bg-card border border-border shadow-xl text-center space-y-6">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Unable to Load Dashboard View
          </h1>
          <p className="text-sm text-muted-foreground">
            A temporary connection error occurred while loading your data. Please try again.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="h-10 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/dashboard"
            className="h-10 px-4 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
